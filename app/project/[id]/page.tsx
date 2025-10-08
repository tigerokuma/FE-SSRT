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
  const [saving, setSaving] = useState(false)

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

  const handleSaveProject = async () => {
    if (!project) return
    
    try {
      setSaving(true)
      const response = await fetch(`http://localhost:3000/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: project.name,
          description: project.description,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update project')
      }
      
      toast({
        title: "Project updated!",
        description: "Your project settings have been saved successfully.",
      })
      
    } catch (err) {
      console.error('Error updating project:', err)
      toast({
        title: "Failed to save",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
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
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 border-gray-800">
            <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-purple-600">
              Overview
            </TabsTrigger>
            <TabsTrigger value="dependencies" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-purple-600">
              Dependencies
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-purple-600">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Score and Activity Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score Card */}
              <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-gray-700"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.67)}`}
                          className="text-green-500"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">67</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Latest Dependency Activity */}
              <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Latest Dependency Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">tailwindcss</div>
                        <div className="text-sm text-gray-400">4 hours ago</div>
                      </div>
                      <div className="text-green-500 font-medium">86 → 95</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">express</div>
                        <div className="text-sm text-gray-400">14 hours ago</div>
                      </div>
                      <div className="text-red-500 font-medium">93 → 89</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">react</div>
                        <div className="text-sm text-gray-400">1 day ago</div>
                      </div>
                      <div className="text-green-500 font-medium">73 → 76</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Log */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="text-white font-medium">Johnny Made a comment on Express</div>
                      <div className="text-gray-400 text-sm">Initial review of the package and found zero vulnerabilities.</div>
                      <div className="text-gray-500 text-xs mt-1">2 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="text-white font-medium">Alex Johnson made a comment on axios</div>
                      <div className="text-gray-400 text-sm">I've reviewed the changes and the encryption module. The vulnerability identified by Alex seems to be a minor issue and can be mitigated with a configuration change. I recommend approving the package with this change.</div>
                      <div className="text-gray-500 text-xs mt-1">2 days ago</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="text-white font-medium">Timmy added a new package: Express</div>
                      <div className="text-gray-500 text-xs mt-1">3 days ago</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="text-white font-medium">Johnny removed a package: Angular</div>
                      <div className="text-gray-500 text-xs mt-1">1 month ago</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="text-white font-medium">Jessica added a new package: React</div>
                      <div className="text-gray-500 text-xs mt-1">3 months ago</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
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
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
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


          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Project Details */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Project Details</CardTitle>
                <p className="text-gray-400 text-sm">Update your project's name, description and repository</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Name</label>
                  <Input 
                    value={project.name}
                    onChange={(e) => setProject({...project, name: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Project name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Description</label>
                  <textarea 
                    value={project.description || ''}
                    onChange={(e) => setProject({...project, description: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Project description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Linked Repository</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={project.repository_url || ''}
                      readOnly
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Repository URL"
                    />
                    <Button 
                      variant="outline" 
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      disabled
                    >
                      Change
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Repository cannot be changed after project creation</p>
                </div>
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveProject}
                    disabled={saving}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Team Members</CardTitle>
                <p className="text-gray-400 text-sm">Manage your team members: invite, remove, or change roles</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input 
                        placeholder="Search team members" 
                        className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                      />
                    </div>
                    {currentUserRole === 'admin' && (
                      <Button 
                        onClick={handleInviteMember}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Invite New Member
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
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
                className="bg-purple-600 hover:bg-purple-700 text-white"
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
