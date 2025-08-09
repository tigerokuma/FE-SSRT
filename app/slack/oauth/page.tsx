"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

interface Channel {
  id: string;
  name: string;
}

export default function SlackPage() {
  const searchParams = useSearchParams();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [joiningChannel, setJoiningChannel] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    const runOAuthAndFetchChannels = async () => {
      if (!code || !state) return;

      try {
        const res = await fetch(
          `http://localhost:3000/slack/oauth?code=${code}&state=${state}`
        );
        if (!res.ok) throw new Error("OAuth failed");

        setUserId(state);

        const channelRes = await fetch(
          `http://localhost:3000/slack/channels/${state}`
        );
        if (!channelRes.ok) throw new Error("Failed to fetch channels");

        const channelData = await channelRes.json();
        setChannels(channelData);

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    runOAuthAndFetchChannels();
  }, [searchParams]);

  const handleJoinChannel = async (channelId: string) => {
    if (!userId) return;

    setJoiningChannel(channelId);
    setJoinSuccess(null);
    setJoinError(null);

    try {
      const res = await fetch("http://localhost:3000/slack/join-channel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, channel: channelId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Join channel failed");
      }

      setJoinSuccess(`Joined channel ${channelId} successfully!`);
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setJoiningChannel(null);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div>
      <PageHeader title='Join Slack Channel'>
      </PageHeader>

      <div className="w-[60vw] ml-8 pt-6"></div>

      <Card>
        <CardContent>
          <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold">Slack Channels</h1>

            {joinSuccess && (
              <div className="p-2 bg-green-200 text-green-800 rounded">{joinSuccess}</div>
            )}
            {joinError && (
              <div className="p-2 bg-red-200 text-red-800 rounded">{joinError}</div>
            )}

            {channels.length === 0 ? (
              <p>No public channels found.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto border rounded p-2 space-y-2">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    disabled={joiningChannel === channel.id}
                    onClick={() => handleJoinChannel(channel.id)}
                    className="w-full text-left rounded border border-gray-300 px-4 py-2 hover:bg-blue-100 disabled:opacity-50"
                  >
                    {channel.name}
                    {joiningChannel === channel.id && " (Joining...)"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>

  );
}
