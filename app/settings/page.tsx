"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { useEffect, useState } from "react"

export default function SettingsPage() {
  const [jiraProject, setJiraProject] = useState("");

  const [slackChannel, setSlackChannel] = useState("");

  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [frequency, setFrequency] = useState("weekly");

  const user_id = "user-123";

  useEffect(() => {
    if (!user_id) return;

    const fetchUserInfo = async () => {
      try {
        const email_res = await fetch(`http://localhost:3000/email/check-confimation/${user_id}`);
        if (!email_res.ok) throw new Error(`HTTP ${email_res.status}`);
        const email_data = await email_res.json();

        setEmailConfirmed(email_data.email_confirmed);

        const slack_res = await fetch(`http://localhost:3000/slack/slack-channel/${user_id}`);
        if (!slack_res.ok) throw new Error(`HTTP ${slack_res.status}`);
        const slack_data = await slack_res.json();

        setSlackChannel(slack_data.name);

        const jira_res = await fetch(`http://localhost:3000/jira/user-info/${user_id}`);
        if (!jira_res.ok) throw new Error(`Failed to fetch Jira info: ${jira_res.status}`);
        const data = await jira_res.json();

        setJiraProject(data.project_key);
      } catch (err) {
        console.error("Error fetching Slack channel:", err);
      }
    };

    fetchUserInfo();
  }, [user_id]);


  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      <PageHeader title="Settings" description="Manage User Settings">
      </PageHeader>

       <div className="w-[60vw] ml-8 pt-6">
  <Card>
    <CardHeader>
      <CardTitle className="text-2xl">Settings</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Email</h3>
        <p className="text-sm text-muted-foreground">
          Primary email: <span className="font-mono">user@example.com</span>
        </p>
        {!emailConfirmed ? (
          <Button variant="secondary">Send Confirmation Email</Button>
        ) : (
          <p className="text-sm text-green-600">Email confirmed</p>
        )}
      </div>

      {/* Jira */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Jira Integration</h3>
        {jiraProject ? (
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-green-600 font-medium">Connected to Jira project:</p>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-semibold">
                {jiraProject}
              </span>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                console.log("Reinstall button clicked");
                window.location.href =
                  "https://developer.atlassian.com/console/install/71b61dcb-1eeb-4af0-93ae-abbe03946c28?signature=..."; // your install URL here
              }}
            >
              Reinstall Jira
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            onClick={() => {
              console.log("Install button clicked");
              window.location.href =
                "https://developer.atlassian.com/console/install/71b61dcb-1eeb-4af0-93ae-abbe03946c28?signature=..."; // your install URL here
            }}
          >
            Install Jira
          </Button>
        )}
      </div>

      {/* Slack */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Slack Integration</h3>
        {slackChannel ? (
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-green-600 font-medium">Slack connected to channel:</p>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-semibold">
                {slackChannel}
              </span>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                console.log("button clicked");
                window.location.href = `http://localhost:3000/slack/start-oauth/${user_id}`;
              }}
            >
              Connect to Different Slack
            </Button>
          </div>
          
        ) : (
          <Button
            variant="secondary"
            onClick={() => {
              console.log("button clicked");
              window.location.href = `http://localhost:3000/slack/start-oauth/${user_id}`;
            }}
          >
            Connect Slack
          </Button>
        )}
      </div>

      {/* Password Reset */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Password</h3>
        <p className="text-sm text-muted-foreground">Reset your account password.</p>
        <Button variant="secondary">Reset Password</Button>
      </div>

    </CardContent>
  </Card>
</div>

    </div>
  )
}