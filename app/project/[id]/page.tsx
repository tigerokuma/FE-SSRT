"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, ExternalLink, Github, Search, Plus, MoreHorizontal, User, RefreshCw, Copy, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { WatchlistSearchDialog } from "@/components/watchlist/WatchlistSearchDialog"

interface Project {
  id: string
  name: string
  description?: string
  repository_url?: string
  created_at: string
  updated_at: string
}

interface ProjectDependency {
  id: string
  name: string
  version: string
  risk: number
  tags: string[]
  last_updated: string
}

interface WatchlistDependency {
  id: string
  name: string
  version: string
  date_added: string
  reason: string
  added_by: string
}

interface ProjectUser {
  id: string
  project_id: string
  user_id: string
  role: string
  joined_at: string
  user: {
    user_id: string
    name: string
    email: string
  }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [projectDependencies, setProjectDependencies] = useState<ProjectDependency[]>([])
  const [watchlistDependencies, setWatchlistDependencies] = useState<WatchlistDependency[]>([])
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([])
  const [projectWatchlist, setProjectWatchlist] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string>('')
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showWatchlistSearchDialog, setShowWatchlistSearchDialog] = useState(false)

  const projectId = params.id as string

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true)
        
        // Fetch project details
        const projectResponse = await fetch(`http://localhost:3000/projects/${projectId}`)
        if (!projectResponse.ok) {
          throw new Error('Failed to fetch project')
        }
        const projectData = await projectResponse.json()
        setProject(projectData)
        
        // Fetch team members for this project
        const teamResponse = await fetch(`http://localhost:3000/projects/${projectId}/users`)
        if (teamResponse.ok) {
          const teamData = await teamResponse.json()
          setProjectUsers(teamData)
        }
        
        // Fetch project dependencies
        const dependenciesResponse = await fetch(`http://localhost:3000/projects/${projectId}/dependencies`)
        if (dependenciesResponse.ok) {
          const dependenciesData = await dependenciesResponse.json()
          setProjectDependencies(dependenciesData)
        }
        
        // Fetch watchlist dependencies
        const watchlistResponse = await fetch(`http://localhost:3000/projects/${projectId}/watchlist`)
        if (watchlistResponse.ok) {
          const watchlistData = await watchlistResponse.json()
          setWatchlistDependencies(watchlistData)
        }
        
        // Check current user's role in the project
        const roleResponse = await fetch(`http://localhost:3000/projects/${projectId}/user/user-123/role`)
        if (roleResponse.ok) {
          const roleData = await roleResponse.json()
          setCurrentUserRole(roleData.role)
        }
        
        // Fetch project watchlist
        const projectWatchlistResponse = await fetch(`http://localhost:3000/projects/${projectId}/project-watchlist`)
        if (projectWatchlistResponse.ok) {
          const projectWatchlistData = await projectWatchlistResponse.json()
          setProjectWatchlist(projectWatchlistData)
        }
        
      } catch (err) {
        console.error('Error fetching project data:', err)
        setError('Failed to load project')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchProjectData()
    }
  }, [projectId])

  const handleRefreshDependencies = async () => {
    if (!projectId) return
    
    try {
      setRefreshing(true)
      const response = await fetch(`http://localhost:3000/projects/${projectId}/refresh-dependencies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to refresh dependencies')
      }
      
      // Refresh the dependencies list
      const dependenciesResponse = await fetch(`http://localhost:3000/projects/${projectId}/dependencies`)
      if (dependenciesResponse.ok) {
        const dependenciesData = await dependenciesResponse.json()
        setProjectDependencies(dependenciesData)
      }
      
    } catch (err) {
      console.error('Error refreshing dependencies:', err)
      alert('Failed to refresh dependencies. Please try again.')
    } finally {
      setRefreshing(false)
    }
  }

  const handleInviteMember = () => {
    const baseUrl = window.location.origin
    const inviteUrl = `${baseUrl}/join/${projectId}`
    setInviteLink(inviteUrl)
    setShowInviteDialog(true)
  }

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      toast({
        title: "Invite link copied!",
        description: "Share this link with team members to invite them to the project.",
      })
    } catch (err) {
      console.error('Failed to copy invite link:', err)
      toast({
        title: "Failed to copy link",
        description: "Please try copying the link manually.",
        variant: "destructive",
      })
    }
  }

  const handleWatchlistDependencyAdded = async () => {
    // Refresh project watchlist
    try {
      const projectWatchlistResponse = await fetch(`http://localhost:3000/projects/${projectId}/project-watchlist`)
      if (projectWatchlistResponse.ok) {
        const projectWatchlistData = await projectWatchlistResponse.json()
        setProjectWatchlist(projectWatchlistData)
      }
    } catch (err) {
      console.error('Error refreshing project watchlist:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <div className="text-gray-400">Loading project...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <div className="text-red-400 mb-4">{error || 'Project not found'}</div>
            <Button 
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            onClick={() => router.push('/')}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
          <h1 className="text-3xl font-bold text-white">{project.name}</h1>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dependencies" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 border-gray-800">
            <TabsTrigger value="dependencies" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-800">
              Dependencies
            </TabsTrigger>
            <TabsTrigger value="team" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-800">
              Team
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-800">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Dependencies Tab */}
          <TabsContent value="dependencies" className="space-y-6">
            {/* Project Dependencies */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Project Dependencies</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input 
                        placeholder="Search" 
                        className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 w-64"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={handleRefreshDependencies}
                        disabled={refreshing}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                      </Button>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Dependency
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {projectDependencies.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">No project dependencies found</div>
                      <div className="text-sm text-gray-500">Add dependencies to track your project's packages</div>
                    </div>
                  ) : (
                    projectDependencies.map((dep) => (
                      <div key={dep.id} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-800/50 transition-colors">
                        <div className="flex-1 grid grid-cols-3 gap-4">
                          <div className="text-white font-medium">{dep.name}</div>
                          <div className="text-gray-300">{dep.version}</div>
                          <div className="text-gray-300">{new Date(dep.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                            More Info
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Watchlist Dependencies */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Watchlist Dependencies</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input 
                        placeholder="Search" 
                        className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 w-64"
                      />
                    </div>
                    <WatchlistSearchDialog
                      trigger={
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Dependency
                        </Button>
                      }
                      onRepositoryAdded={handleWatchlistDependencyAdded}
                      projectId={projectId}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {projectWatchlist.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">No watchlist dependencies found</div>
                      <div className="text-sm text-gray-500">Add dependencies to your watchlist for monitoring</div>
                    </div>
                  ) : (
                    projectWatchlist.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-800/50 transition-colors">
                        <div className="flex-1 grid grid-cols-3 gap-4">
                          <div className="text-white font-medium">{item.name}</div>
                          <div className="text-gray-300">
                            Added by {item.user?.name || 'Unknown'} on {new Date(item.added_at).toLocaleDateString()}
                          </div>
                          <div className="text-gray-400 capitalize">{item.status}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-gray-600 text-gray-300 hover:bg-gray-800"
                            onClick={() => router.push(`/project/${projectId}/review/${item.id}`)}
                          >
                            Review
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Current Members</CardTitle>
                  {currentUserRole === 'admin' && (
                    <Button 
                      onClick={handleInviteMember}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Invite New Member
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">No team members found</div>
                      <div className="text-sm text-gray-500">Invite users to collaborate on this project</div>
                    </div>
                  ) : (
                    projectUsers.map((projectUser) => (
                      <div key={projectUser.id} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                          <div>
                            <div className="text-white font-medium">{projectUser.user.name}</div>
                            <div className="text-gray-400 text-sm">{projectUser.user.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-gray-300 capitalize">{projectUser.role}</div>
                          <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                            Modify Access
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Project Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">Settings Coming Soon</div>
                  <div className="text-sm text-gray-500">
                    Project configuration, notifications, and advanced settings will be available here.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">
              Share this link with team members to invite them to the project. They will be added as members (non-admin).
            </p>
            <div className="flex items-center space-x-2">
              <Input
                value={inviteLink}
                readOnly
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Button
                onClick={handleCopyInviteLink}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
