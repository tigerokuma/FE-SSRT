"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Mail, Bug, Activity } from "lucide-react"
import { useEffect, useState } from "react"
import { Select, SelectItem } from "@/components/ui/select"

export default function SettingsPage() {
  const [status, setStatus] = useState({jiraConnected: false});

  const [slackChannel, setSlackChannel] = useState("");

  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [frequency, setFrequency] = useState("weekly");

  const user_id = "user-123";

  useEffect(() => {
    if (!user_id) return;

    const fetchUserInfo = async () => {
      try {
        const slack_res = await fetch(`http://localhost:3000/slack/slack-channel/${user_id}`);
        if (!slack_res.ok) throw new Error(`HTTP ${slack_res.status}`);
        const slack_data = await slack_res.json();

        setSlackChannel(slack_data.name);
      } catch (err) {
        console.error("Error fetching Slack channel:", err);
      }
    };

    fetchUserInfo();
  }, [user_id]);


  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      <PageHeader title="Settings" description="Manage integrations and notifications">
        <div className="grid grid-cols-3 sm:flex sm:flex-row w-full sm:w-auto gap-2 mt-2 sm:mt-0">
          <Button 
            variant="default" 
            size="sm" 
            className="w-full sm:w-auto bg-primary/10 hover:bg-primary/20 text-primary border-0 flex items-center justify-center h-12 sm:h-9"
          >
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Activity</span>
            </div>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="w-full sm:w-auto bg-primary/10 hover:bg-primary/20 text-primary border-0 flex items-center justify-center h-12 sm:h-9"
          >
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <Bug className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Debug</span>
            </div>
          </Button>
        </div>
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
        {!status.emailConfirmed ? (
          <Button variant="secondary">Send Confirmation Email</Button>
        ) : (
          <p className="text-sm text-green-600">Email confirmed</p>
        )}
      </div>

      {/* Jira */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Jira Integration</h3>
        {status.jiraConnected ? (
          <p className="text-sm text-green-600">Jira connected</p>
        ) : (
          <Button variant="secondary">Connect Jira</Button>
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