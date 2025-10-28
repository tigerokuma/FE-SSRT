"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

interface Channel {
  id: string;
  name: string;
}

export default function SlackPage() {
  // always go through our Next.js proxy (adds Clerk JWT)
  const apiBase = "/api/backend";

  const searchParams = useSearchParams();
  const router = useRouter();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [joiningChannel, setJoiningChannel] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    const runOAuthAndFetchChannels = async () => {
      if (!code || !state) return;

      try {
        const res = await fetch(
          `${apiBase}/slack/oauth?code=${code}&state=${state}`
        );
        if (!res.ok) throw new Error("OAuth failed");

        setUserId(state);

        const channel_res = await fetch(
          `${apiBase}/slack/channels/${state}`
        );
        if (!channel_res.ok) throw new Error("Failed to fetch channels");

        const channel_data = await channel_res.json();
        setChannels(channel_data.channels);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    runOAuthAndFetchChannels();
  }, [searchParams]);

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setJoinSuccess(null);
    setJoinError(null);
  };

  const handleJoinSelectedChannel = async () => {
    if (!userId || !selectedChannel) return;

    setJoiningChannel(selectedChannel.id);
    setJoinSuccess(null);
    setJoinError(null);

    try {
      const res = await fetch(`${apiBase}/slack/join-channel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, channel: selectedChannel.id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Join channel failed");
      }

      setJoinSuccess(`Joined channel ${selectedChannel.name} successfully!`);

      setTimeout(() => {
        router.push("/settings");
      }, 1500);
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
      <PageHeader title="Join Slack Channel"></PageHeader>

      <div className="w-[60vw] ml-8 pt-6"></div>

      <Card>
        <CardContent>
          <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold">Slack Channels</h1>

            {joinSuccess && (
              <div className="p-2 bg-green-200 text-green-800 rounded">
                {joinSuccess}
              </div>
            )}
            {joinError && (
              <div className="p-2 bg-red-200 text-red-800 rounded">
                {joinError}
              </div>
            )}

            {channels.length === 0 ? (
              <p>No public channels found.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto border rounded p-2 space-y-2">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => handleSelectChannel(channel)}
                    className={`w-full text-left rounded border px-4 py-2 hover:bg-blue-100 darK: hover:bg-blue-900
                      ${
                        selectedChannel?.id === channel.id
                          ? "border-blue-500 bg-blue-50 dark: bg-blue-900"
                          : "border-gray-300"
                      }
                    `}
                    disabled={joiningChannel === channel.id}
                  >
                    {channel.name}
                  </button>
                ))}
              </div>
            )}

            {selectedChannel && (
              <button
                onClick={handleJoinSelectedChannel}
                disabled={joiningChannel === selectedChannel.id}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
              >
                {joiningChannel === selectedChannel.id
                  ? "Joining..."
                  : `Join ${selectedChannel.name}`}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
