// app/(app)/settings/page.tsx
"use client"

import {useEffect, useMemo, useState} from "react"
import useSWR from "swr"
import {useUser, SignOutButton} from "@clerk/nextjs"
import {Link as LinkIcon} from "lucide-react"

import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"

// ---- Brand SVGs (no external icon deps → no deprecation) ----
function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.06c-3.22.7-3.9-1.4-3.9-1.4-.53-1.35-1.3-1.71-1.3-1.71-1.06-.73.08-.72.08-.72 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.26 3.39.97.11-.76.41-1.26.75-1.55-2.57-.29-5.28-1.28-5.28-5.69 0-1.26.45-2.28 1.2-3.09-.12-.3-.52-1.52.11-3.16 0 0 .98-.31 3.22 1.18A11.2 11.2 0 0 1 12 6.84c.99.01 1.99.13 2.92.37 2.23-1.49 3.21-1.18 3.21-1.18.64 1.64.24 2.86.12 3.16.75.81 1.2 1.83 1.2 3.09 0 4.42-2.72 5.39-5.31 5.67.42.37.8 1.1.8 2.22v3.29c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .5Z"
            />
        </svg>
    )
}

function SlackIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
            <path fill="currentColor"
                  d="M5.2 14.4a1.8 1.8 0 1 1-1.8-1.8h1.8v1.8Zm.9 0a1.8 1.8 0 1 1 3.6 0v4.5a1.8 1.8 0 1 1-3.6 0v-4.5Zm3.6-10.8a1.8 1.8 0 0 1 1.8 1.8v1.8H9.7a1.8 1.8 0 1 1 0-3.6h0Zm0 .9a1.8 1.8 0 1 1 0 3.6H5.2a1.8 1.8 0 1 1 0-3.6h4.5ZM18.8 9.7a1.8 1.8 0 1 1 1.8 1.8h-1.8V9.7Zm-.9 0a1.8 1.8 0 1 1-3.6 0V5.2a1.8 1.8 0 1 1 3.6 0v4.5Zm-3.6 10.8a1.8 1.8 0 0 1-1.8-1.8v-1.8h1.8a1.8 1.8 0 1 1 0 3.6Zm0-.9a1.8 1.8 0 1 1 0-3.6h4.5a1.8 1.8 0 1 1 0 3.6h-4.5Z"/>
        </svg>
    )
}

function JiraIcon(props: React.SVGProps<SVGSVGElement>) {
    // Simplified Atlassian Jira rhombus mark
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                d="M3.5 12 12 3.5 20.5 12 12 20.5 3.5 12Zm5.66 0L12 9.16 14.84 12 12 14.84 9.16 12Z"
            />
        </svg>
    )
}

// --------------------------------------------------------------

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SettingsPage() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
    const {user, isLoaded} = useUser()

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [savingBasic, setSavingBasic] = useState(false)

    const email = useMemo(() => user?.primaryEmailAddress?.emailAddress ?? "", [user])
    const phone = useMemo(() => user?.primaryPhoneNumber?.phoneNumber ?? "", [user])

    const userId = user?.id
    const {data: slackData} = useSWR(
        userId ? `${apiBase}/slack/slack-channel/${userId}` : null,
        fetcher,
        {revalidateOnFocus: false}
    )
    const {data: jiraData} = useSWR(
        userId ? `${apiBase}/jira/user-info/${userId}` : null,
        fetcher,
        {revalidateOnFocus: false}
    )

    const slackChannel = slackData?.name ?? ""
    const jiraProject = jiraData?.project_key ?? ""
    const githubConnected = useMemo(() => {
        const providers =
            user?.externalAccounts?.map(a => String(a.provider)) ?? [];
        return providers.some(p => p === "github" || p === "oauth_github");
    }, [user]);
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
                        const fmt = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}T${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`
                        setFirstEmailTime(fmt)
                        setWaitUnit(Number(data.wait_unit) || 1)
                        const match = waitValues.find((v) => v.value === data.wait_value)
                        if (match) setWaitValue(match)
                    } else {
                        const now = new Date()
                        const fmt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
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
                    connected ? "bg-[rgba(12,230,0,0.2)] border-[#E5E7EB]" : "bg-[#F3F4F6] opacity-60 border-[#E5E7EB]"
                }`}
            >
        <span className={`text-sm ${connected ? "text-[#0CE600]" : "text-black"}`}>
          {connected ? textConnected : textNot}
        </span>
            </div>
        )
    }

    return (
        <div className="w-full overflow-x-hidden bg-white">
            {/* Header */}
            <div className="px-6 md:px-8 lg:px-10 mt-6 mb-6 flex items-center justify-between">
                <h2 className="text-2xl md:text-[32px] font-semibold leading-10 text-black">User Profile</h2>
                <div className="h-6 w-6 rounded-full border border-[#E5E7EB] flex items-center justify-center">
                    <LinkIcon className="h-4 w-4 text-black"/>
                </div>
            </div>

            {/* Full-width content (no max-w) */}
            <div className="px-6 md:px-8 lg:px-10 w-full space-y-6 pb-10">
                {/* Basic Information */}
                <Card className="w-full bg-white text-black border border-[#E5E7EB]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[32px] leading-10 font-semibold">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex flex-col gap-3 md:flex-row">
                            <div className="flex-1 space-y-1">
                                <label className="text-xs font-medium text-black">First name</label>
                                <div
                                    className="flex h-11 items-center rounded-lg border border-[#E5E7EB] bg-white px-3">
                                    <input
                                        className="h-full w-full bg-transparent text-base outline-none placeholder:text-[#777777]"
                                        placeholder="First name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 space-y-1">
                                <label className="text-xs font-medium text-black">Last name</label>
                                <div
                                    className="flex h-11 items-center rounded-lg border border-[#E5E7EB] bg-white px-3">
                                    <input
                                        className="h-full w-full bg-transparent text-base outline-none placeholder:text-[#777777]"
                                        placeholder="Last name"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row">
                            <div className="flex-1 space-y-1 opacity-60">
                                <label className="text-xs font-medium text-black/60">Email</label>
                                <div
                                    className="flex h-11 items-center rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3">
                                    <input className="h-full w-full bg-transparent text-base outline-none" value={email}
                                           readOnly/>
                                </div>
                            </div>

                            <div className="flex-1 space-y-1">
                                <label className="text-xs font-medium text-black">Phone</label>
                                <div
                                    className="flex h-11 items-center rounded-lg border border-[#E5E7EB] bg-white px-3">
                                    <input
                                        className="h-full w-full bg-transparent text-base outline-none placeholder:text-[#777777]"
                                        placeholder="(optional)"
                                        value={phone}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-2 flex justify-end">
                            <Button
                                variant="secondary"
                                className="h-14 w-[90px] rounded-lg border border-[#E5E7EB] bg-white text-[#111]"
                                onClick={saveBasicInfo}
                                disabled={savingBasic}
                            >
                                {savingBasic ? "Saving…" : "Save"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Connections */}
                <Card className="w-full bg-white text-black border border-[#E5E7EB]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[32px] leading-10 font-semibold">Connection</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* GitHub */}
                        <div className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] px-3 py-3">
                            <div
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E5E7EB]">
                                <GitHubIcon className="h-4 w-4"/>
                            </div>
                            <div className="text-base">GitHub</div>
                            <div className="flex-1"/>
                            <StatusPill connected={githubConnected}/>
                            {githubConnected ? (
                                <Button
                                    variant="secondary"
                                    className="ml-3 h-8 rounded-lg border border-[#E5E7EB] bg-white text-[#111]"
                                    onClick={() => {
                                        window.location.href = "/settings"
                                    }}
                                >
                                    Disconnect
                                </Button>
                            ) : (
                                <Button
                                    variant="secondary"
                                    className="ml-3 h-8 rounded-lg border border-[#E5E7EB] bg-white text-[#111]"
                                    onClick={() => {
                                        window.location.href = "/sign-in?redirect_url=/settings"
                                    }}
                                >
                                    Connect
                                </Button>
                            )}
                        </div>

                        {/* Jira */}
                        <div className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] px-3 py-3">
                            <div
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E5E7EB]">
                                <JiraIcon className="h-4 w-4"/>
                            </div>
                            <div className="text-base">Jira</div>
                            <div className="flex-1"/>
                            <StatusPill connected={!!jiraProject}/>
                            <Button
                                variant="secondary"
                                className="ml-3 h-8 rounded-lg border border-[#E5E7EB] bg-white text-[#111]"
                                onClick={() => {
                                    window.location.href =
                                        "https://developer.atlassian.com/console/install/71b61dcb-1eeb-4af0-93ae-abbe03946c28?product=jira"
                                }}
                            >
                                {jiraProject ? "Disconnect" : "Connect"}
                            </Button>
                        </div>

                        {/* Slack */}
                        <div className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] px-3 py-3">
                            <div
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E5E7EB]">
                                <SlackIcon className="h-4 w-4"/>
                            </div>
                            <div className="text-base">Slack</div>
                            <div className="flex-1"/>
                            <StatusPill connected={!!slackChannel}/>
                            <Button
                                variant="secondary"
                                className="ml-3 h-8 rounded-lg border border-[#E5E7EB] bg-white text-[#111]"
                                onClick={() => {
                                    if (!userId) return
                                    window.location.href = `${apiBase}/slack/start-oauth/${userId}`
                                }}
                            >
                                {slackChannel ? "Disconnect" : "Connect"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Subscription */}
                <Card className="w-full bg-white text-black border border-[#E5E7EB]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[32px] leading-10 font-semibold">Subscription</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-3 rounded-lg px-3 py-3">
                            <div
                                className="h-6 rounded-[10px] border border-[#E5E7EB] bg-[rgba(90,98,187,0.2)] px-2 flex items-center">
                                <span className="text-sm text-[#5A62BB]">Team</span>
                            </div>
                            <div className="text-base">Billed monthly · 10 seats</div>
                            <div className="flex-1"/>
                            <Button
                                variant="secondary"
                                className="h-8 rounded-lg border border-[#E5E7EB] bg-white text-[#111]"
                                onClick={() => {
                                    // Link to billing portal when ready
                                }}
                            >
                                Manage billing
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Email Preferences */}
                <Card className="w-full bg-white text-black border border-[#E5E7EB]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-semibold">Email Preferences</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="text-sm">
                                Primary email: <span className="font-mono">{email}</span>
                            </div>
                            {!emailConfirmed ? (
                                <Button
                                    variant="secondary"
                                    className="mt-2 h-10 rounded-lg border border-[#E5E7EB] bg-white text-[#111]"
                                    onClick={sendEmailConfirmation}
                                    disabled={sendingConfirm}
                                >
                                    {sendingConfirm ? "Sending…" : "Send Confirmation Email"}
                                </Button>
                            ) : (
                                <div className="mt-2 text-sm text-green-600">Email confirmed</div>
                            )}
                        </div>

                        {emailConfirmed && (
                            <>
                                {nextEmailTime && (
                                    <div className="text-sm text-gray-600">
                                        Next email time: {new Date(nextEmailTime).toLocaleString()}
                                    </div>
                                )}

                                <div className="max-w-md space-y-3">
                                    <div className="space-y-1">
                                        <label className="block text-sm">
                                            {nextEmailTime ? "Update Next Email Time" : "First Email Time"}
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={firstEmailTime}
                                            onChange={(e) => setFirstEmailTime(e.target.value)}
                                            className="w-full rounded border px-2 py-1"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm mb-1">Repeats</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={1}
                                                value={waitUnit}
                                                onChange={(e) => setWaitUnit(Number(e.target.value))}
                                                className="w-20 rounded border px-2 py-1"
                                            />
                                            <select
                                                className="rounded border bg-white px-2 py-1"
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

                                    <Button
                                        className="mt-1 h-10 rounded-lg bg-green-600 text-white"
                                        onClick={saveSchedule}
                                        disabled={savingSchedule}
                                    >
                                        {nextEmailTime ? "Update Time" : "Add Time"}
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Sign out */}
                <SignOutButton redirectUrl="/">
                    <Button className="h-14 w-full rounded-lg border border-[#FF0000] bg-[#EF4444] text-white">
                        Log Out
                    </Button>
                </SignOutButton>
            </div>
        </div>
    )
}
