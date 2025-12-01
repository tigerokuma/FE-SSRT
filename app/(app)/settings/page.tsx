// app/(app)/settings/page.tsx
"use client"

import {useEffect, useMemo, useState} from "react"
import useSWR from "swr"
import Image from "next/image"
import {useUser, SignOutButton, useClerk} from "@clerk/nextjs"
import {useSearchParams, useRouter} from "next/navigation"

import {Button} from "@/components/ui/button"
import {useIngestGithubFromClerk} from "@/lib/useIngestGithubFromClerk";
import {useEnsureBackendUser} from "@/lib/useEnsureBackendUser";

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SettingsPage() {
    // always go through our Next.js proxy (adds Clerk JWT)
    const apiBase = "/api/backend";
    const {user, isLoaded} = useUser()
    const searchParams = useSearchParams()
    const router = useRouter()

    const {openUserProfile, signOut} = useClerk();

    const {backendUserId} = useEnsureBackendUser(apiBase)
    useIngestGithubFromClerk(backendUserId, apiBase)

    const [currentSettingsTab, setCurrentSettingsTab] = useState("basic")
    // Handle Jira OAuth callback redirect
    useEffect(() => {
        const jiraConnected = searchParams.get('jira_connected')
        if (jiraConnected === 'true') {
            // Remove query param and refresh Jira data
            router.replace('/settings', { scroll: false })
            // Trigger SWR revalidation for Jira data
            setTimeout(() => {
                window.location.reload()
            }, 500)
        }
    }, [searchParams, router])

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [savingBasic, setSavingBasic] = useState(false)

    const email = useMemo(() => user?.primaryEmailAddress?.emailAddress ?? "", [user])
    const phone = useMemo(() => user?.primaryPhoneNumber?.phoneNumber ?? "", [user])

    const userId = user?.id
    const {data: slackData} = useSWR(userId ? `${apiBase}/slack/slack-channel/${userId}` : null, fetcher, {
        revalidateOnFocus: false,
    })
    const {data: jiraData} = useSWR(userId ? `${apiBase}/jira/user-info/${userId}` : null, fetcher, {
        revalidateOnFocus: false,
    })

    const slackChannel = slackData?.name ?? ""
    const jiraProject = jiraData?.project_key ?? ""

    const githubConnected = useMemo(() => {
        const eas = user?.externalAccounts ?? [];
        return eas.some((ea: any) => {
            const p = String(ea.provider).toLowerCase();
            const isGithub = p === 'github' || p === 'oauth_github';
            const isVerified =
                ea?.verification?.status === 'verified' ||
                ea?.approved === true; // some versions expose this
            return isGithub && isVerified;
        });
    }, [user?.externalAccounts]);

    // Jira is considered connected only if:
    // 1. Connection info exists (jiraData with webtrigger_url)
    // 2. project_key is set
    const jiraConnected = useMemo(() => {
        const hasConnection = !!jiraData?.webtrigger_url;
        const hasProjectKey = !!jiraProject && jiraProject.trim() !== '';
        return hasConnection && hasProjectKey;
    }, [jiraData, jiraProject]);

    const [emailConfirmed, setEmailConfirmed] = useState(false)
    const [sendingConfirm, setSendingConfirm] = useState(false)
    const [firstEmailTime, setFirstEmailTime] = useState("")
    const [nextEmailTime, setNextEmailTime] = useState("")
    const waitValues = [
        {value: "DAY", label: "Day(s)"},
        {value: "WEEK", label: "Week(s)"},
        {value: "MONTH", label: "Month(s)"},
        {value: "YEAR", label: "Year(s)"},
    ]
    const [waitValue, setWaitValue] = useState(waitValues[0])
    const [waitUnit, setWaitUnit] = useState(1)
    const [savingSchedule, setSavingSchedule] = useState(false)

    useEffect(() => {
        if (!isLoaded || !user) return
        setFirstName(user.firstName || "")
        setLastName(user.lastName || "")
    }, [isLoaded, user])

    useEffect(() => {
        if (!userId) return
            ;
        (async () => {
            try {
                const emailCon = await fetch(`${apiBase}/email/check-confirmation/${userId}`)
                if (emailCon.ok) {
                    const data = await emailCon.json()
                    setEmailConfirmed(!!data.email_confirmed)
                }

                const res = await fetch(`${apiBase}/email/email-time/${userId}`)
                if (res.ok) {
                    const text = await res.text()
                    const data = text ? JSON.parse(text) : null
                    if (data?.next_email_time) {
                        setNextEmailTime(data.next_email_time)
                        const dt = new Date(data.next_email_time)
                        const fmt = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
                            dt.getDate()
                        ).padStart(2, "0")}T${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`
                        setFirstEmailTime(fmt)
                        setWaitUnit(Number(data.wait_unit) || 1)
                        const match = waitValues.find((v) => v.value === data.wait_value)
                        if (match) setWaitValue(match)
                    } else {
                        const now = new Date()
                        const fmt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
                            now.getDate()
                        ).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
                        setFirstEmailTime(fmt)
                    }
                }
            } catch (e) {
                console.error("Failed to load email settings", e)
            }
        })()
    }, [userId, apiBase])

    async function saveBasicInfo() {
        if (!user) return
        setSavingBasic(true)
        try {
            await user.update({firstName, lastName})
        } catch (e) {
            console.error("Saving basic info failed", e)
        } finally {
            setSavingBasic(false)
        }
    }

    async function sendEmailConfirmation() {
        if (!userId) return
        setSendingConfirm(true)
        try {
            const res = await fetch(`${apiBase}/email/send-confirmation`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({user_id: userId}),
            })
            if (!res.ok) throw new Error("Failed to send confirmation email")
        } catch (e) {
            console.error(e)
        } finally {
            setSendingConfirm(false)
        }
    }

    async function saveSchedule() {
        if (!userId) return
        setSavingSchedule(true)
        try {
            const payload = {
                id: userId,
                first_email_time: new Date(firstEmailTime).toISOString(),
                wait_value: waitValue.value,
                wait_unit: Number(waitUnit),
            }
            const res = await fetch(`${apiBase}/email/add-time`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error("Failed to save schedule")
        } catch (e) {
            console.error(e)
        } finally {
            setSavingSchedule(false)
        }
    }

    function StatusPill({
                            connected,
                            textConnected = "Connected",
                            textNot = "Not connected",
                        }: {
        connected: boolean
        textConnected?: string
        textNot?: string
    }) {
        return (
            <div
                className={`h-6 rounded-[10px] border px-2 flex items-center ${
                    connected
                        ? "bg-[rgba(12,230,0,0.12)] border-[#2A2A2A]"
                        : "bg-[#1a1a1a] border-[#2A2A2A] opacity-80"
                }`}
            >
        <span className={`text-sm ${connected ? "text-[#7CFC7C]" : "text-gray-300"}`}>
          {connected ? textConnected : textNot}
        </span>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">Settings</h2>
                </div>

                {/* Settings Layout */}
                <div className="flex h-full overflow-hidden">
                    {/* Settings Sidebar */}
                    <div className="w-64 border-r border-gray-800 p-6 overflow-y-auto">
                        <div className="space-y-1">
                            {[
                                {id: 'basic', label: 'Basic Information'},
                                {id: 'connections', label: 'Connections'},
                                {id: 'email', label: 'Email Preferences'},
                                {id: 'logout', label: 'Log Out'}
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={async () => {
                                        if (item.id === 'logout') {
                                            // Immediately log out
                                            await signOut({ redirectUrl: '/' });
                                        } else {
                                            setCurrentSettingsTab(item.id);
                                        }
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                        item.id === 'logout'
                                            ? currentSettingsTab === item.id
                                                ? 'text-red-400'
                                                : 'text-red-500 hover:text-red-400'
                                            : currentSettingsTab === item.id
                                                ? 'text-white'
                                                : 'text-gray-300 hover:text-white'
                                    }`}
                                    style={currentSettingsTab === item.id ? {backgroundColor: 'rgb(18, 18, 18)'} : {}}
                                    onMouseEnter={(e) => {
                                        if (currentSettingsTab !== item.id) {
                                            e.currentTarget.style.backgroundColor = 'rgb(18, 18, 18)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (currentSettingsTab !== item.id) {
                                            e.currentTarget.style.backgroundColor = '';
                                        }
                                    }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Settings Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {currentSettingsTab === 'basic' && (
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Basic Information</h2>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">First name</label>
                                        <input
                                            type="text"
                                            placeholder="First name"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full px-3 py-2 rounded-md border text-white placeholder-gray-400"
                                            style={{backgroundColor: 'rgb(18, 18, 18)'}}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Last name</label>
                                        <input
                                            type="text"
                                            placeholder="Last name"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full px-3 py-2 rounded-md border text-white placeholder-gray-400"
                                            style={{backgroundColor: 'rgb(18, 18, 18)'}}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Email</label>
                                        <div className="flex items-center gap-3 p-3 border rounded-md" style={{backgroundColor: 'rgb(18, 18, 18)'}}>
                                            <span className="text-white text-sm">{email}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Phone</label>
                                        <div className="flex items-center gap-3 p-3 border rounded-md" style={{backgroundColor: 'rgb(18, 18, 18)'}}>
                                            <span className="text-gray-400 text-sm">{phone || '(optional)'}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            variant="secondary"
                                            className="h-10 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700"
                                            onClick={saveBasicInfo}
                                            disabled={savingBasic}
                                        >
                                            {savingBasic ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentSettingsTab === 'connections' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Connections</h2>
                                    <p className="text-gray-400 mt-1">Connect your favorite tools to streamline your workflow</p>
                                </div>

                                <div className="space-y-4">
                                    {/* GitHub */}
                                    <div className="flex items-center justify-between p-4 border rounded-md" style={{backgroundColor: 'rgb(18, 18, 18)'}}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                                                <Image src="/Github_icon.png" alt="GitHub" width={20} height={20}/>
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">GitHub</div>
                                                <div className="text-xs text-gray-400">Code repository</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <StatusPill connected={githubConnected}/>
                                            {githubConnected ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                                    onClick={() => openUserProfile()}
                                                >
                                                    Manage
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                                    onClick={async () => {
                                                        if (!user) return;
                                                        const scopes = ['read:user', 'user:email', 'repo', 'read:org'];
                                                        const redirectUrl = `${window.location.origin}/sso-callback`;
                                                        const created = await user.createExternalAccount({
                                                            strategy: 'oauth_github',
                                                            redirectUrl,
                                                            additionalScopes: scopes,
                                                        });
                                                        const verification = (created as any)?.verification;
                                                        const nextUrl: string | undefined =
                                                            verification?.externalVerificationRedirectURL || verification?.externalVerificationRedirectUrl;
                                                        if (nextUrl) {
                                                            window.location.href = nextUrl;
                                                        }
                                                    }}
                                                >
                                                    Connect
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Jira */}
                                    <div className="flex items-center justify-between p-4 border rounded-md" style={{backgroundColor: 'rgb(18, 18, 18)'}}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                <Image src="/jira_icon.png" alt="Jira" width={20} height={20}/>
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">Jira</div>
                                                <div className="text-xs text-gray-400">Project management</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                        <StatusPill connected={jiraConnected}/>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                                onClick={async () => {
                                                    if (!backendUserId) {
                                                        alert('Please wait for your account to be set up.');
                                                        return;
                                                    }
            
                                                    // Use backend's direct OAuth flow (similar to Slack)
                                                    // Redirect to backend OAuth endpoint which will handle Jira OAuth
                                                    window.location.href = `${apiBase}/jira/connect`;
                                                }}
                                            >
                                                {jiraConnected ? "Disconnect" : "Connect"}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Slack */}
                                    <div className="flex items-center justify-between p-4 border rounded-md" style={{backgroundColor: 'rgb(18, 18, 18)'}}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                <Image src="/Slack_icon.png" alt="Slack" width={20} height={20}/>
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">Slack</div>
                                                <div className="text-xs text-gray-400">Team communication</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <StatusPill connected={!!slackChannel}/>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                                onClick={() => {
                                                    if (!userId) return
                                                    window.location.href = `${apiBase}/slack/start-oauth/${userId}`
                                                }}
                                            >
                                                {slackChannel ? "Disconnect" : "Connect"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentSettingsTab === 'email' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Email Preferences</h2>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Primary email</label>
                                        <div className="flex items-center gap-3 p-3 border rounded-md" style={{backgroundColor: 'rgb(18, 18, 18)'}}>
                                            <span className="text-white text-sm font-mono">{email}</span>
                                        </div>
                                        {!emailConfirmed ? (
                                            <div className="mt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                                    onClick={sendEmailConfirmation}
                                                    disabled={sendingConfirm}
                                                >
                                                    {sendingConfirm ? "Sending..." : "Send Confirmation Email"}
                                                </Button>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-green-400 mt-2">Email confirmed</p>
                                        )}
                                    </div>

                                    {emailConfirmed && (
                                        <>
                                            {nextEmailTime && (
                                                <div>
                                                    <label className="block text-sm font-medium text-white mb-2">Next email time</label>
                                                    <div className="flex items-center gap-3 p-3 border rounded-md" style={{backgroundColor: 'rgb(18, 18, 18)'}}>
                                                        <span className="text-gray-300 text-sm">{new Date(nextEmailTime).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-white mb-2">
                                                        {nextEmailTime ? "Update Next Email Time" : "First Email Time"}
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={firstEmailTime}
                                                        onChange={(e) => setFirstEmailTime(e.target.value)}
                                                        className="w-full px-3 py-2 rounded-md border text-white"
                                                        style={{backgroundColor: 'rgb(18, 18, 18)'}}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-white mb-2">Repeats</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={waitUnit}
                                                            onChange={(e) => setWaitUnit(Number(e.target.value))}
                                                            className="w-20 px-3 py-2 rounded-md border text-white"
                                                            style={{backgroundColor: 'rgb(18, 18, 18)'}}
                                                        />
                                                        <select
                                                            className="flex-1 px-3 py-2 rounded-md border text-white"
                                                            style={{backgroundColor: 'rgb(18, 18, 18)'}}
                                                            value={waitValue.value}
                                                            onChange={(e) => {
                                                                const v = waitValues.find((w) => w.value === e.target.value)
                                                                if (v) setWaitValue(v)
                                                            }}
                                                        >
                                                            {waitValues.map((w) => (
                                                                <option key={w.value} value={w.value}>
                                                                    {w.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="pt-4">
                                                    <Button
                                                        className="h-10 rounded-lg bg-green-600 text-white hover:bg-green-500"
                                                        onClick={saveSchedule}
                                                        disabled={savingSchedule}
                                                    >
                                                        {savingSchedule ? "Saving..." : (nextEmailTime ? "Update Time" : "Add Time")}
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

        </div>
    )
}
