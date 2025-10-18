// app/(app)/settings/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import Image from "next/image"
import { useUser, SignOutButton } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackgroundGradient } from "@/components/background-gradient"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SettingsPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
  const { user, isLoaded } = useUser()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [savingBasic, setSavingBasic] = useState(false)

  const email = useMemo(() => user?.primaryEmailAddress?.emailAddress ?? "", [user])
  const phone = useMemo(() => user?.primaryPhoneNumber?.phoneNumber ?? "", [user])

  const userId = user?.id
  const { data: slackData } = useSWR(userId ? `${apiBase}/slack/slack-channel/${userId}` : null, fetcher, {
    revalidateOnFocus: false,
  })
  const { data: jiraData } = useSWR(userId ? `${apiBase}/jira/user-info/${userId}` : null, fetcher, {
    revalidateOnFocus: false,
  })

  const slackChannel = slackData?.name ?? ""
  const jiraProject = jiraData?.project_key ?? ""

  const githubConnected = useMemo(() => {
    const providers = user?.externalAccounts?.map((a) => String(a.provider)) ?? []
    return providers.some((p) => p === "github" || p === "oauth_github")
  }, [user])

  const [emailConfirmed, setEmailConfirmed] = useState(false)
  const [sendingConfirm, setSendingConfirm] = useState(false)
  const [firstEmailTime, setFirstEmailTime] = useState("")
  const [nextEmailTime, setNextEmailTime] = useState("")
  const waitValues = [
    { value: "DAY", label: "Day(s)" },
    { value: "WEEK", label: "Week(s)" },
    { value: "MONTH", label: "Month(s)" },
    { value: "YEAR", label: "Year(s)" },
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
    ;(async () => {
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
      await user.update({ firstName, lastName })
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
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
        headers: { "Content-Type": "application/json" },
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
    <div className="relative min-h-screen text-white">
      {/* Background gradient behind everything */}
      <BackgroundGradient />

      {/* Header */}
      <div className="px-6 md:px-8 lg:px-10 mt-6 mb-6 flex items-center justify-between">
        <h2 className="text-2xl md:text-[32px] font-semibold leading-10">User Profile</h2>
        {/* Link icon removed */}
        <div />
      </div>

      {/* Content */}
      <div className="px-6 md:px-8 lg:px-10 w-full space-y-6 pb-10 bg-transparent">
        {/* Basic Information */}
        <Card className="w-full bg-[#121212]/95 text-white border border-[#2A2A2A]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[28px] md:text-[32px] leading-10 font-semibold">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-gray-300">First name</label>
                <div className="flex h-11 items-center rounded-lg border border-[#2A2A2A] bg-[#0e0e0e] px-3">
                  <input
                    className="h-full w-full bg-transparent text-base outline-none placeholder:text-gray-500"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-gray-300">Last name</label>
                <div className="flex h-11 items-center rounded-lg border border-[#2A2A2A] bg-[#0e0e0e] px-3">
                  <input
                    className="h-full w-full bg-transparent text-base outline-none placeholder:text-gray-500"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <div className="flex-1 space-y-1 opacity-80">
                <label className="text-xs font-medium text-gray-400">Email</label>
                <div className="flex h-11 items-center rounded-lg border border-[#2A2A2A] bg-[#151515] px-3">
                  <input className="h-full w-full bg-transparent text-base outline-none" value={email} readOnly />
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-gray-300">Phone</label>
                <div className="flex h-11 items-center rounded-lg border border-[#2A2A2A] bg-[#0e0e0e] px-3">
                  <input
                    className="h-full w-full bg-transparent text-base outline-none placeholder:text-gray-500"
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
                className="h-11 w-[100px] rounded-lg border border-[#2A2A2A] bg-[#1a1a1a] text-white hover:bg-[#222]"
                onClick={saveBasicInfo}
                disabled={savingBasic}
              >
                {savingBasic ? "Saving…" : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Connections */}
        <Card className="w-full bg-[#121212]/95 text-white border border-[#2A2A2A]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[28px] md:text-[32px] leading-10 font-semibold">Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* GitHub */}
            <div className="flex items-center gap-3 rounded-lg border border-[#2A2A2A] px-3 py-3 bg-[#0f0f0f]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#2A2A2A] bg-white">
                <Image src="/Github_icon.png" alt="GitHub" width={16} height={16} />
              </div>
              <div className="text-base">GitHub</div>
              <div className="flex-1" />
              <StatusPill connected={githubConnected} />
              {githubConnected ? (
                <Button
                  variant="secondary"
                  className="ml-3 h-8 rounded-lg border border-[#2A2A2A] bg-[#1a1a1a] text-white hover:bg-[#222]"
                  onClick={() => {
                    window.location.href = "/settings"
                  }}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="ml-3 h-8 rounded-lg border border-[#2A2A2A] bg-[#1a1a1a] text-white hover:bg-[#222]"
                  onClick={() => {
                    window.location.href = "/sign-in?redirect_url=/settings"
                  }}
                >
                  Connect
                </Button>
              )}
            </div>

            {/* Jira */}
            <div className="flex items-center gap-3 rounded-lg border border-[#2A2A2A] px-3 py-3 bg-[#0f0f0f]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#2A2A2A] bg-blue-500/20">
                <Image src="/jira_icon.png" alt="Jira" width={16} height={16} />
              </div>
              <div className="text-base">Jira</div>
              <div className="flex-1" />
              <StatusPill connected={!!jiraProject} />
              <Button
                variant="secondary"
                className="ml-3 h-8 rounded-lg border border-[#2A2A2A] bg-[#1a1a1a] text-white hover:bg-[#222]"
                onClick={() => {
                  window.location.href =
                    "https://developer.atlassian.com/console/install/71b61dcb-1eeb-4af0-93ae-abbe03946c28?product=jira"
                }}
              >
                {jiraProject ? "Disconnect" : "Connect"}
              </Button>
            </div>

            {/* Slack */}
            <div className="flex items-center gap-3 rounded-lg border border-[#2A2A2A] px-3 py-3 bg-[#0f0f0f]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#2A2A2A] bg-purple-500/20">
                <Image src="/Slack_icon.png" alt="Slack" width={16} height={16} />
              </div>
              <div className="text-base">Slack</div>
              <div className="flex-1" />
              <StatusPill connected={!!slackChannel} />
              <Button
                variant="secondary"
                className="ml-3 h-8 rounded-lg border border-[#2A2A2A] bg-[#1a1a1a] text-white hover:bg-[#222]"
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
        <Card className="w-full bg-[#121212]/95 text-white border border-[#2A2A2A]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[28px] md:text-[32px] leading-10 font-semibold">Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg px-3 py-3 bg-[#0f0f0f] border border-[#2A2A2A]">
              <div className="h-6 rounded-[10px] border border-[#364152] bg-[rgba(90,98,187,0.15)] px-2 flex items-center">
                <span className="text-sm text-[#96A0FF]">Team</span>
              </div>
              <div className="text-base text-gray-200">Billed monthly · 10 seats</div>
              <div className="flex-1" />
              <Button
                variant="secondary"
                className="h-8 rounded-lg border border-[#2A2A2A] bg-[#1a1a1a] text-white hover:bg-[#222]"
                onClick={() => {
                  // TODO: billing portal
                }}
              >
                Manage billing
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Preferences */}
        <Card className="w-full bg-[#121212]/95 text-white border border-[#2A2A2A]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold">Email Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm">
                Primary email: <span className="font-mono text-gray-200">{email}</span>
              </div>
              {!emailConfirmed ? (
                <Button
                  variant="secondary"
                  className="mt-2 h-10 rounded-lg border border-[#2A2A2A] bg-[#1a1a1a] text-white hover:bg-[#222]"
                  onClick={sendEmailConfirmation}
                  disabled={sendingConfirm}
                >
                  {sendingConfirm ? "Sending…" : "Send Confirmation Email"}
                </Button>
              ) : (
                <div className="mt-2 text-sm text-green-400">Email confirmed</div>
              )}
            </div>

            {emailConfirmed && (
              <>
                {nextEmailTime && (
                  <div className="text-sm text-gray-300">
                    Next email time: {new Date(nextEmailTime).toLocaleString()}
                  </div>
                )}

                <div className="max-w-md space-y-3">
                  <div className="space-y-1">
                    <label className="block text-sm text-gray-300">
                      {nextEmailTime ? "Update Next Email Time" : "First Email Time"}
                    </label>
                    <input
                      type="datetime-local"
                      value={firstEmailTime}
                      onChange={(e) => setFirstEmailTime(e.target.value)}
                      className="w-full rounded border border-[#2A2A2A] bg-[#0e0e0e] px-2 py-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1 text-gray-300">Repeats</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={waitUnit}
                        onChange={(e) => setWaitUnit(Number(e.target.value))}
                        className="w-20 rounded border border-[#2A2A2A] bg-[#0e0e0e] px-2 py-2 text-white outline-none"
                      />
                      <select
                        className="rounded border border-[#2A2A2A] bg-[#0e0e0e] px-2 py-2 text-white outline-none"
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
                    className="mt-1 h-10 rounded-lg bg-green-600 text-white hover:bg-green-500"
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
          <Button className="h-14 w-full rounded-lg border border-[#7F1D1D] bg-[#EF4444] text-white hover:bg-[#DC2626]">
            Log Out
          </Button>
        </SignOutButton>
      </div>
    </div>
  )
}
