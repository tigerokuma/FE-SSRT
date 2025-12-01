"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEnsureBackendUser } from "@/lib/useEnsureBackendUser";
import { Loader2 } from "lucide-react";
import { colors } from "@/lib/design-system";
import Image from "next/image";

interface SlackChannel {
  id: string;
  name: string;
  is_private?: boolean;
  is_archived?: boolean;
  num_members?: number;
}

export default function SlackSelectChannelPage() {
  const apiBase = "/api/backend";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded: clerkLoaded } = useUser();
  const { backendUserId, isEnsured } = useEnsureBackendUser(apiBase);
  
  const projectId = searchParams.get("project_id"); // For project-level connections
  const isProjectLevel = !!projectId;
  
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<SlackChannel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  useEffect(() => {
    const fetchChannels = async () => {
      // For project-level connections, we don't need backendUserId
      if (!clerkLoaded || (!isProjectLevel && (!isEnsured || !backendUserId))) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Use project-level endpoint if projectId is provided, otherwise use user-level
        const endpoint = isProjectLevel && projectId
          ? `${apiBase}/slack/projects/${projectId}/channels`
          : `${apiBase}/slack/channels`;
        
        const response = await fetch(endpoint, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch channels: ${response.statusText}`);
        }

        const data = await response.json();
        setChannels(data.channels || []);
      } catch (err) {
        console.error('Error fetching Slack channels:', err);
        setError(err instanceof Error ? err.message : 'Failed to load channels');
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [clerkLoaded, isEnsured, backendUserId, projectId, isProjectLevel, apiBase]);

  // Filter channels based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = channels.filter(channel =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChannels(filtered);
    } else {
      setFilteredChannels(channels);
    }
  }, [searchQuery, channels]);

  const handleSaveChannel = async () => {
    if (!selectedChannel) {
      return;
    }

    // For project-level connections, we don't need backendUserId
    if (!isProjectLevel && !backendUserId) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Use project-level endpoint if projectId is provided, otherwise use user-level
      const endpoint = isProjectLevel && projectId
        ? `${apiBase}/slack/projects/${projectId}/update-channel`
        : `${apiBase}/slack/update-channel`;

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: selectedChannel }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save channel: ${response.statusText}`);
      }

      // Redirect based on connection type
      if (isProjectLevel && projectId) {
        router.push(`/project/${projectId}?tab=settings&settingsTab=integrations&slack_connected=true`);
      } else {
        router.push('/settings?slack_connected=true');
      }
    } catch (err) {
      console.error('Error saving channel:', err);
      setError(err instanceof Error ? err.message : 'Failed to save channel');
    } finally {
      setSaving(false);
    }
  };

  // For project-level connections, we don't need backendUserId
  if (!clerkLoaded || (!isProjectLevel && (!isEnsured || !backendUserId))) {
    return (
      <div className="min-h-screen" style={{backgroundColor: colors.background.main}}>
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="p-6 rounded-lg" style={{backgroundColor: colors.background.card}}>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{backgroundColor: colors.background.main}}>
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="p-6 rounded-lg" style={{backgroundColor: colors.background.card}}>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Loading channels...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: colors.background.main}}>
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Select Slack Channel</h1>
          <p className="text-gray-400 mt-2">
            {isProjectLevel 
              ? "Choose which Slack channel to connect to this project"
              : "Choose which Slack channel to connect to your account"
            }
          </p>
        </div>

        {/* Channel Selection Box */}
        <div className="p-6 rounded-lg h-[600px] flex flex-col" style={{backgroundColor: colors.background.card}}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{backgroundColor: colors.primaryBubble}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313a2.528 2.528 0 0 1-2.521 2.523 2.528 2.528 0 0 1-2.521-2.523v-6.313zM11.979 5.042a2.528 2.528 0 0 1-2.523-2.52A2.528 2.528 0 0 1 11.979 0a2.528 2.528 0 0 1 2.523 2.522v2.52H11.98zM11.979 6.313a2.528 2.528 0 0 1 2.523 2.521 2.528 2.528 0 0 1-2.523 2.521H5.666a2.528 2.528 0 0 1-2.523-2.521 2.528 2.528 0 0 1 2.523-2.521h6.313zM18.958 5.042a2.528 2.528 0 0 1-2.523-2.52A2.528 2.528 0 0 1 18.958 0a2.528 2.528 0 0 1 2.522 2.522v2.52H18.958zM18.958 6.313a2.528 2.528 0 0 1 2.522 2.521 2.528 2.528 0 0 1-2.522 2.521h-2.52V6.313h2.52zM12.979 11.979a2.528 2.528 0 0 1 2.523 2.522 2.528 2.528 0 0 1-2.523 2.523h-2.52v-2.523a2.528 2.528 0 0 1 2.52-2.522zM5.042 11.979a2.528 2.528 0 0 1 2.521 2.522 2.528 2.528 0 0 1-2.521 2.523H2.522a2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.522h2.52zM24 12.979a2.528 2.528 0 0 1-2.522 2.523 2.528 2.528 0 0 1-2.523-2.523V5.666a2.528 2.528 0 0 1 2.523-2.523A2.528 2.528 0 0 1 24 5.666v7.313z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Select Slack Channel</h2>
              <p className="text-gray-400 text-sm">Choose a channel to connect</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 flex-shrink-0">
              {error}
            </div>
          )}

          {channels.length === 0 ? (
            <div className="text-center py-8 flex-1 flex items-center justify-center">
              <p className="text-gray-400">No channels found in your Slack workspace.</p>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative mb-4 flex-shrink-0">
                <Input
                  placeholder="Search channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black border-gray-700 text-white placeholder-gray-400"
                  style={{backgroundColor: 'rgb(26 26 26)'}}
                />
              </div>

              {/* Channel List - Scrollable */}
              <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                <div className="space-y-3">
                  {filteredChannels.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No channels match your search.</p>
                    </div>
                  ) : (
                    filteredChannels.map((channel) => (
                    <Card
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel.id)}
                      className={`bg-black border-gray-700 hover:border-gray-600 transition-all cursor-pointer ${
                        selectedChannel === channel.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : ''
                      }`}
                      style={{backgroundColor: 'rgb(26 26 26)'}}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">#</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 min-w-0">
                                <h3 className="font-medium text-white truncate">{channel.name}</h3>
                                {channel.is_private && (
                                  <span className="text-xs text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded">Private</span>
                                )}
                              </div>
                              <div className="text-sm text-gray-400 truncate">
                                {channel.num_members ? `${channel.num_members} members` : 'Channel'}
                              </div>
                            </div>
                          </div>
                          {selectedChannel === channel.id && (
                            <div className="text-blue-500 font-bold">✓</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-4 flex-shrink-0">
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (isProjectLevel && projectId) {
                      router.push(`/project/${projectId}?tab=settings&settingsTab=integrations`);
                    } else {
                      router.push('/settings');
                    }
                  }}
                  disabled={saving}
                  className="text-white"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleSaveChannel}
                  disabled={!selectedChannel || saving}
                  className="text-white"
                  style={{backgroundColor: colors.primary}}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Channel'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

