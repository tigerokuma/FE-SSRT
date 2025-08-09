"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { useEffect, useState } from "react"

export default function SettingsPage() {
  const [jiraProject, setJiraProject] = useState("");

  const [slackChannel, setSlackChannel] = useState("");

  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [sending, setSending] = useState(false);

  const waitValues = [
    { value: "DAY", label: "Day(s)" },
    { value: "WEEK", label: "Week(s)" },
    { value: "MONTH", label: "Month(s)" },
    { value: "YEAR", label: "Year(s)" },
  ];

  const [firstEmailTime, setFirstEmailTime] = useState("");
  const [nextEmailTime, setNextEmailTime] = useState("");
  const [waitValue, setWaitValue] = useState<{ value: string; label: string }>(waitValues[0]);
  const [waitUnit, setWaitUnit] = useState(1);
  const [addingTime, setAddingTime] = useState(false);


  const user_id = "user-123";

  useEffect(() => {
    if (!user_id) return;

    const fetchUserInfo = async () => {
      try {
        const email_con_res = await fetch(`http://localhost:3000/email/check-confimation/${user_id}`);
        if (!email_con_res.ok) throw new Error(`HTTP ${email_con_res.status}`);
        const email_con_data = await email_con_res.json();

        setEmailConfirmed(email_con_data.email_confirmed);

        


        const email_time_res = await fetch(`http://localhost:3000/email/email-time/${user_id}`);
        
        if (!email_time_res.ok) throw new Error(`HTTP ${email_time_res.status}`);
        const text = await email_time_res.text();

        const email_data = text ? JSON.parse(text) : null;

        if(email_data && !!email_data.next_email_time) {
          setNextEmailTime(email_data.next_email_time);
          console.log("here: ", email_data.next_email_time)
          const dt = new Date(email_data.next_email_time);
          const formatted = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}T${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
          setFirstEmailTime(formatted);
          setWaitUnit(email_data.wait_unit)
          const match = waitValues.find(v => v.value === email_data.wait_value);
          if (match) {
            setWaitValue(match);
          }


        } else {
          const now = new Date();
          const formattedNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          setFirstEmailTime(formattedNow);
        }

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

  
  async function sendConfirmation() {
    setSending(true);
    try {
      const res = await fetch("http://localhost:3000/email/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id }),
      });
      if (!res.ok) throw new Error("Failed to send confirmation email");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  async function addEmailTime() {
    setAddingTime(true);
    try {
      const payload = {
        id: user_id,
        first_email_time: new Date(firstEmailTime).toISOString(),
        wait_value: waitValue.value,
        wait_unit: Number(waitUnit),
      };

      const res = await fetch("http://localhost:3000/email/add-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to add email time");
    } catch (err) {
      console.error(err);
    } finally {
      setAddingTime(false);
      window.location.reload();
    }
  }


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
        Primary email: <span className="font-mono"> </span>
      </p>
      {!emailConfirmed ? (
        <Button variant="secondary" onClick={sendConfirmation} disabled={sending}>
          {sending ? "Sending..." : "Send Confirmation Email"}
        </Button>
      ) : (
        <p className="text-sm text-green-600">Email confirmed</p>
      )}
    </div>

    <hr/>
      {emailConfirmed && (
        <>
          <h4 className="font-semibold">
            {nextEmailTime ? 'Update Email Time' : 'Add Email Time'}
          </h4>

          {nextEmailTime && (
            <h1 className="text-sm text-gray-600">
              Next email time: {new Date(nextEmailTime).toLocaleString()}
            </h1>
          )}

          <div className="space-y-4 max-w-md">
            {/* First Email Time */}
            <div>
              <label className="block mb-1">
                {nextEmailTime ? 'Updated Next Email Time' : 'First Email Time'}
              </label>
              <input
                type="datetime-local"
                value={firstEmailTime}
                onChange={(e) => setFirstEmailTime(e.target.value)}
                className="border px-2 py-1 rounded w-full"
              />
            </div>

            {/* Repeat Interval */}
            <div>
              <label className="block mb-1">Repeats:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  value={waitUnit}
                  onChange={(e) => setWaitUnit(Number(e.target.value))}
                  className="border rounded px-2 py-1 w-20"
                />

                <select
                  className="bg-white border border-gray-300 px-2 py-1 rounded"
                  value={waitValue.value}
                  onChange={(e) => {
                    const selected = waitValues.find(unit => unit.value === e.target.value);
                    if (selected) setWaitValue(selected);
                  }}
                >
                  {waitValues.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={addEmailTime}
              disabled={addingTime}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {nextEmailTime ? "Update Time" : "Add Time"}
            </button>
          </div>

          <hr/>
        </>
         
      )}

     

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

      <hr/>

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
              Re-establish Slack Connection
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

      <hr/>

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