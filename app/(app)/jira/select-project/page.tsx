"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEnsureBackendUser } from "@/lib/useEnsureBackendUser";
import { Loader2 } from "lucide-react";
import { colors } from "@/lib/design-system";
import Image from "next/image";

interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  avatarUrls?: {
    '48x48'?: string;
  };
}

export default function JiraSelectProjectPage() {
  const apiBase = "/api/backend";
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded: clerkLoaded } = useUser();
  const { backendUserId, isEnsured } = useEnsureBackendUser(apiBase);
  
  const cloudId = searchParams.get("cloud_id");
  const projectId = searchParams.get("project_id"); // For project-level connections
  const isProjectLevel = !!projectId;
  
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      // For project-level connections, we don't need backendUserId
      if (!clerkLoaded || !cloudId || (!isProjectLevel && (!isEnsured || !backendUserId))) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Use project-level endpoint if projectId is provided, otherwise use user-level
        const endpoint = isProjectLevel && projectId
          ? `${apiBase}/jira/projects/${projectId}/projects?cloud_id=${encodeURIComponent(cloudId)}`
          : `${apiBase}/jira/projects?cloud_id=${encodeURIComponent(cloudId)}`;
        
        const response = await fetch(endpoint, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }

        const data = await response.json();
        setProjects(data.values || []);
      } catch (err) {
        console.error('Error fetching Jira projects:', err);
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [clerkLoaded, isEnsured, backendUserId, cloudId, projectId, isProjectLevel, apiBase]);

  const handleSaveProject = async () => {
    if (!selectedProject) {
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
        ? `${apiBase}/jira/projects/${projectId}/update-project`
        : `${apiBase}/jira/update-project`;

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_key: selectedProject }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save project: ${response.statusText}`);
      }

      // Redirect based on connection type
      if (isProjectLevel && projectId) {
        router.push(`/project/${projectId}?tab=settings&settingsTab=integrations&jira_connected=true`);
      } else {
        router.push('/settings?jira_connected=true');
      }
    } catch (err) {
      console.error('Error saving project:', err);
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  // For project-level connections, we don't need backendUserId
  if (!clerkLoaded || (!isProjectLevel && (!isEnsured || !backendUserId))) {
    return (
      <div className="min-h-screen" style={{backgroundColor: colors.background.main}}>
        <div className="container mx-auto px-6 py-8 max-w-2xl">
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
        <div className="container mx-auto px-6 py-8 max-w-2xl">
          <div className="p-6 rounded-lg" style={{backgroundColor: colors.background.card}}>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Loading projects...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: colors.background.main}}>
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Select Jira Project</h1>
          <p className="text-gray-400 mt-2">
            {isProjectLevel 
              ? "Choose which Jira project to connect to this project"
              : "Choose which Jira project to connect to your account"
            }
          </p>
        </div>

        {/* Project Selection Box */}
        <div className="p-6 rounded-lg" style={{backgroundColor: colors.background.card}}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{backgroundColor: colors.primaryBubble}}>
              <Image src="/jira_icon.png" alt="Jira" width={16} height={16} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Select Jira Project</h2>
              <p className="text-gray-400 text-sm">Choose a project to connect</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400">
              {error}
            </div>
          )}

          {projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No projects found in your Jira account.</p>
            </div>
          ) : (
            <>
              {/* Project List */}
              <div className="space-y-3 mb-6 max-h-[420px] overflow-y-auto pr-1">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    onClick={() => setSelectedProject(project.key)}
                    className={`bg-black border-gray-700 hover:border-gray-600 transition-all cursor-pointer ${
                      selectedProject === project.key
                        ? 'border-blue-500 bg-blue-500/10'
                        : ''
                    }`}
                    style={{backgroundColor: 'rgb(26 26 26)'}}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {project.avatarUrls?.['48x48'] ? (
                            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                              <img
                                src={project.avatarUrls['48x48']}
                                alt={project.name}
                                className="h-4 w-4"
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                              <Image src="/jira_icon.png" alt="Jira" width={16} height={16} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 min-w-0">
                              <h3 className="font-medium text-white truncate">{project.name}</h3>
                            </div>
                            <div className="text-sm text-gray-400 truncate">
                              Key: {project.key} • Type: {project.projectTypeKey}
                            </div>
                          </div>
                        </div>
                        {selectedProject === project.key && (
                          <div className="text-blue-500 font-bold">✓</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
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
                  onClick={handleSaveProject}
                  disabled={!selectedProject || saving}
                  className="text-white"
                  style={{backgroundColor: colors.primary}}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Project'
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

