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
    const {data: slackData} = useSWR(userId ? `${apiBase}/slack/user-info/${userId}` : null, fetcher, {
        revalidateOnFocus: false,
    })
    const {data: jiraData} = useSWR(userId ? `${apiBase}/jira/user-info/${userId}` : null, fetcher, {
        revalidateOnFocus: false,
    })

    const slackChannel = slackData?.slack_channel ?? ""
    const slackToken = slackData?.slack_token ?? ""
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

    // Slack is considered connected only if:
    // 1. Connection info exists (slackData with slack_token)
    // 2. slack_channel is set
    const slackConnected = useMemo(() => {
        const hasConnection = !!slackToken;
        const hasChannel = !!slackChannel && slackChannel.trim() !== '';
        return hasConnection && hasChannel;
    }, [slackToken, slackChannel]);

    useEffect(() => {
        if (!isLoaded || !user) return
        setFirstName(user.firstName || "")
        setLastName(user.lastName || "")
    }, [isLoaded, user])

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
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

        </div>
    )
}
