"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, ExternalLink, Github, Search, Plus, MoreHorizontal, User, RefreshCw, Copy, Check, Trash2, Download, ArrowLeft, Shield, ShieldCheck, MessageSquare, X, AlertTriangle, Clock, Users, FileText, ExternalLink as ExternalLinkIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { WatchlistSearchDialog } from "@/components/watchlist/WatchlistSearchDialog"
import { ProjectTopBar } from "@/components/ProjectTopBar"
import { colors } from "@/lib/design-system"

interface Project {
  id: string
  name: string
  description?: string
  repository_url?: string
  language?: string
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [currentTab, setCurrentTab] = useState("overview")
  const [currentSettingsTab, setCurrentSettingsTab] = useState("general")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [showFilterPopup, setShowFilterPopup] = useState(false)
  const [showDependencyReviewDialog, setShowDependencyReviewDialog] = useState(false)
  const [selectedDependency, setSelectedDependency] = useState<any>(null)
  const [alertFilter, setAlertFilter] = useState("all")

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

  const handleDeleteProject = async () => {
    if (!projectId) return
    
    try {
      setDeleting(true)
      const response = await fetch(`http://localhost:3000/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete project')
      }
      
      toast({
        title: "Project deleted!",
        description: "The project has been permanently deleted.",
      })
      
      // Redirect to home page
      router.push('/')
      
    } catch (err) {
      console.error('Error deleting project:', err)
      toast({
        title: "Failed to delete project",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
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
      {/* Project Top Bar */}
      <ProjectTopBar
        projectName={project?.name || ''}
        projectLanguage={project?.language || ''}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Tab Content */}
        {currentTab === "overview" && (
          <div className="space-y-6">
            {/* Project Health Overview */}
            <Card style={{ backgroundColor: colors.background.card }}>
                <CardHeader>
                <CardTitle className="text-white">Project Health</CardTitle>
                <p className="text-gray-400 text-sm">Average dependency risk</p>
                </CardHeader>
                <CardContent>
    {/* MODIFIED: Changed to a 12-column grid to allow for a wider graph (3/9 split) */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Left: Security Score (3/12 columns on large screens) */}
      <div className="flex flex-col justify-center items-center lg:col-span-3" style={{ marginLeft: 'auto' }}>
        {/* Security Score with Progress Circle */}
        <div className="relative">
          <div className="relative w-48 h-48">
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
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
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.78)}`}
                style={{ stroke: 'rgb(84, 0, 250)' }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-6xl font-bold text-white">78</div>
                        </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Security Score Graph (9/12 columns on large screens) */}
      <div className="lg:col-span-9">
        <div className="h-64 w-full">
          {/* MODIFIED: Increased viewBox width from 400 to 600 and adjusted points/text positions */}
          <svg className="w-full h-full" viewBox="0 0 600 200"> 
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Y-axis scale numbers (no change) */}
            <text x="15" y="25" fill="#9CA3AF" fontSize="12" textAnchor="middle">100</text>
            <text x="15" y="60" fill="#9CA3AF" fontSize="12" textAnchor="middle">80</text>
            <text x="15" y="95" fill="#9CA3AF" fontSize="12" textAnchor="middle">60</text>
            <text x="15" y="130" fill="#9CA3AF" fontSize="12" textAnchor="middle">40</text>
            <text x="15" y="165" fill="#9CA3AF" fontSize="12" textAnchor="middle">20</text>
            <text x="15" y="195" fill="#9CA3AF" fontSize="12" textAnchor="middle">0</text>
            
            {/* X-axis dates (Adjusted positions for wider graph: 50, 217, 384, 550) */}
            <text x="50" y="195" fill="#9CA3AF" fontSize="10" textAnchor="middle">30d ago</text>
            <text x="217" y="195" fill="#9CA3AF" fontSize="10" textAnchor="middle">20d ago</text>
            <text x="384" y="195" fill="#9CA3AF" fontSize="10" textAnchor="middle">10d ago</text>
            <text x="550" y="195" fill="#9CA3AF" fontSize="10" textAnchor="middle">Today</text>
            
            {/* Line chart (Adjusted points for wider graph: 50, 150, 250, 350, 450, 550) */}
            <polyline
              fill="none"
              stroke="rgb(84, 0, 250)"
              strokeWidth="3"
              points="50,180 150,160 250,140 350,120 450,100 550,60"
            />
            
            {/* Area fill (Adjusted points for wider graph) */}
            <polygon
              fill="url(#securityGradient)"
              points="50,180 150,160 250,140 350,120 450,100 550,60 550,180 50,180"
            />
            
            {/* Gradient definition (no change) */}
            <defs>
              <linearGradient id="securityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(84, 0, 250)" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="rgb(84, 0, 250)" stopOpacity="0.05"/>
              </linearGradient>
            </defs>
            
            {/* Data points (Adjusted positions for wider graph) */}
            <circle cx="50" cy="180" r="3" fill="rgb(84, 0, 250)"/>
            <circle cx="250" cy="140" r="3" fill="rgb(84, 0, 250)"/>
            <circle cx="450" cy="100" r="3" fill="rgb(84, 0, 250)"/>
            <circle cx="550" cy="60" r="3" fill="rgb(84, 0, 250)"/>
          </svg>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            {/* Vulnerabilities and License Compliance Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vulnerabilities */}
              <Card style={{ backgroundColor: colors.background.card }}>
                <CardHeader>
                  <CardTitle className="text-white">Vulnerabilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Total Vulnerabilities */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">23</div>
                      <div className="text-sm text-gray-400">Total active vulnerabilities</div>
                    </div>

                    {/* Severity Breakdown */}
                    <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="text-sm text-gray-300">Critical</span>
                      </div>
                        <span className="text-white font-semibold">3</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          <span className="text-sm text-gray-300">High</span>
                      </div>
                        <span className="text-white font-semibold">7</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span className="text-sm text-gray-300">Medium</span>
                      </div>
                        <span className="text-white font-semibold">8</span>
                    </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span className="text-sm text-gray-300">Low</span>
                        </div>
                        <span className="text-white font-semibold">5</span>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>

              {/* License Compliance */}
              <Card style={{ backgroundColor: colors.background.card }}>
              <CardHeader>
                  <CardTitle className="text-white">License Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    {/* Project License */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <span className="text-green-400 font-bold text-sm">MIT</span>
                    </div>
                      <div>
                        <div className="text-white font-medium">MIT License</div>
                  </div>
                    </div>

                    {/* Compliance Status */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Overall Compliance</span>
                        <span className="text-green-400 font-semibold">95%</span>
                  </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">License Conflicts</span>
                        <span className="text-yellow-400 font-semibold">2</span>
                    </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Vulnerable Dependencies</span>
                        <span className="text-red-400 font-semibold">3</span>
                  </div>
                    </div>
                  </div>
              </CardContent>
            </Card>
                    </div>
                  </div>
        )}

        {currentTab === "dependencies" && (
          <div className="space-y-6">
            {/* Dependencies Header */}
            <div className="space-y-4">
              
              {/* Search and Filters */}
              <div className="space-y-4">
                    <div className="relative">
                  <input
                    type="text"
                    placeholder="Search dependencies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ backgroundColor: colors.background.card, borderColor: 'hsl(var(--border))', borderWidth: '1px' }}
                  />
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>

                {/* Filter Options */}
                <div className="flex items-center gap-4">
                      <Button 
                        variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => setShowFilterPopup(true)}
                      >
                    <Search className="h-4 w-4 mr-2" />
                    Add Filters
                      </Button>
                  
                  {/* Show filter chips or status text */}
                  {activeFilters.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {activeFilters.map((filter) => (
                        <div
                          key={filter}
                          className="flex items-center gap-2 px-3 py-1 text-gray-300 text-sm rounded-full"
                          style={{ backgroundColor: colors.background.card, borderColor: 'hsl(var(--border))', borderWidth: '1px' }}
                        >
                          <span>{filter}</span>
                          <button
                            onClick={() => setActiveFilters(activeFilters.filter(f => f !== filter))}
                            className="text-gray-400 hover:text-gray-300"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">
                      Showing {searchQuery ? 'filtered' : 'all'} dependencies
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dependencies List */}
            <div className="grid gap-4">
              {/* Express */}
              {(!searchQuery || 'express'.includes(searchQuery.toLowerCase())) && (
              <Card style={{ backgroundColor: colors.background.card }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
                        <img src="/package_icon.png" alt="Package" className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">express</h3>
                        <p className="text-gray-400">4.18.2</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs px-2 py-1">
                        Bump
                      </Button>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-4">
                        <span className="text-green-400 text-xs">✓</span>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">85</div>
                          <div className="text-xs text-gray-400">Risk Score</div>
                  </div>
                </div>
                    </div>
                        </div>
                  
              </CardContent>
            </Card>
              )}

              {/* React */}
              {(!searchQuery || 'react'.includes(searchQuery.toLowerCase())) && (
              <Card style={{ backgroundColor: colors.background.card }}>
                <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
                        <img src="/package_icon.png" alt="Package" className="w-6 h-6" />
                    </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">react</h3>
                        <p className="text-gray-400">18.2.0</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs px-2 py-1">
                        Bump
                          </Button>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-4">
                        <span className="text-green-400 text-xs">✓</span>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">72</div>
                          <div className="text-xs text-gray-400">Risk Score</div>
                  </div>
                </div>
                    </div>
                        </div>
                  
                </CardContent>
              </Card>
              )}

              {/* Axios */}
              {(!searchQuery || 'axios'.includes(searchQuery.toLowerCase())) && (
              <Card style={{ backgroundColor: colors.background.card }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
                        <img src="/package_icon.png" alt="Package" className="w-6 h-6" />
                    </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">axios</h3>
                        <p className="text-gray-400">1.6.0</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs px-2 py-1">
                        Bump
                          </Button>
                        </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-4">
                        <span className="text-green-400 text-xs">✓</span>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">95</div>
                          <div className="text-xs text-gray-400">Risk Score</div>
                      </div>
                      </div>
                    </div>
                </div>
                  
                </CardContent>
              </Card>
              )}

              {/* Lodash */}
              {(!searchQuery || 'lodash'.includes(searchQuery.toLowerCase())) && (
              <Card style={{ backgroundColor: colors.background.card }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
                        <img src="/package_icon.png" alt="Package" className="w-6 h-6" />
                </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">lodash</h3>
                        <p className="text-gray-400">4.17.21</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs px-2 py-1">
                        Bump
                      </Button>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-4">
                        <span className="text-yellow-400 text-xs">⚠</span>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">68</div>
                          <div className="text-xs text-gray-400">Risk Score</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
              </CardContent>
            </Card>
              )}

              {/* Moment */}
              {(!searchQuery || 'moment'.includes(searchQuery.toLowerCase())) && (
              <Card style={{ backgroundColor: colors.background.card }}>
                <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
                        <img src="/package_icon.png" alt="Package" className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">moment</h3>
                        <p className="text-gray-400">2.29.4</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-4">
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">Non-Compliant</span>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">45</div>
                          <div className="text-xs text-gray-400">Risk Score</div>
                        </div>
                      </div>
                    </div>
                </div>
                  
              </CardContent>
            </Card>
              )}
            </div>
          </div>
        )}

        {currentTab === "watchlist" && (
          <div className="space-y-6">
            {/* Search and Add */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search watchlist dependencies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ backgroundColor: colors.background.card, borderColor: 'hsl(var(--border))', borderWidth: '1px' }}
                  />
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                <Button 
                  style={{ backgroundColor: colors.primary }}
                  className="hover:opacity-90 text-white"
                  onClick={() => setShowWatchlistSearchDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Dependency
                </Button>
              </div>
            </div>

            {/* Watchlist Dependencies */}
            <div className="grid gap-4">
              {/* Express - Watchlist */}
              {(!searchQuery || 'express'.includes(searchQuery.toLowerCase())) && (
              <Card 
                style={{ backgroundColor: colors.background.card, cursor: 'pointer' }}
                onClick={() => {
                  setSelectedDependency({
                    name: 'express',
                    version: '4.18.2',
                    addedBy: 'Alex Johnson',
                    riskScore: 85,
                    status: 'approved',
                    approvedBy: 'Sarah Kim',
                    healthScore: 92,
                    activityScore: 78,
                    busFactor: 15,
                    license: 'MIT',
                    projectLicense: 'MIT',
                    vulnerabilities: 2,
                    pastVulnerabilities: 12
                  })
                  setShowDependencyReviewDialog(true)
                }}
                className="hover:opacity-90 transition-opacity"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
                        <img src="/package_icon.png" alt="Package" className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">express</h3>
                        <p className="text-gray-400">Added by Alex Johnson</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-green-500 text-green-500">
                          <Check className="mr-1 h-3 w-3" />
                          Approved
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-4">
                        <span className="text-green-400 text-xs">✓</span>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">85</div>
                          <div className="text-xs text-gray-400">Risk Score</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* React - Watchlist */}
              {(!searchQuery || 'react'.includes(searchQuery.toLowerCase())) && (
              <Card 
                style={{ backgroundColor: colors.background.card, cursor: 'pointer' }}
                onClick={() => {
                  setSelectedDependency({
                    name: 'react',
                    version: '18.2.0',
                    addedBy: 'Sarah Kim',
                    riskScore: 72,
                    status: 'rejected',
                    rejectedBy: 'David Lee',
                    healthScore: 88,
                    activityScore: 95,
                    busFactor: 8,
                    license: 'MIT',
                    projectLicense: 'MIT',
                    vulnerabilities: 1,
                    pastVulnerabilities: 5
                  })
                  setShowDependencyReviewDialog(true)
                }}
                className="hover:opacity-90 transition-opacity"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
                        <img src="/package_icon.png" alt="Package" className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">react</h3>
                        <p className="text-gray-400">Added by Sarah Kim</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-red-500 text-red-500">
                          <Trash2 className="mr-1 h-3 w-3" />
                          Rejected
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-4">
                        <span className="text-yellow-400 text-xs">⚠</span>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">72</div>
                          <div className="text-xs text-gray-400">Risk Score</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Moment - Watchlist */}
              {(!searchQuery || 'moment'.includes(searchQuery.toLowerCase())) && (
              <Card 
                style={{ backgroundColor: colors.background.card, cursor: 'pointer' }}
                onClick={() => {
                  setSelectedDependency({
                    name: 'moment',
                    version: '2.29.4',
                    addedBy: 'David Lee',
                    riskScore: 45,
                    status: 'pending',
                    healthScore: 65,
                    activityScore: 25,
                    busFactor: 3,
                    license: 'MIT',
                    projectLicense: 'MIT',
                    vulnerabilities: 0,
                    pastVulnerabilities: 8
                  })
                  setShowDependencyReviewDialog(true)
                }}
                className="hover:opacity-90 transition-opacity"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
                        <img src="/package_icon.png" alt="Package" className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">moment</h3>
                        <p className="text-gray-400">Added by David Lee</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-blue-500 text-blue-500">
                          <MessageSquare className="mr-1 h-3 w-3" />
                          3
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-4">
                        <span className="text-green-400 text-xs">✓</span>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">45</div>
                          <div className="text-xs text-gray-400">Risk Score</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Lodash - Watchlist */}
              {(!searchQuery || 'lodash'.includes(searchQuery.toLowerCase())) && (
                <Card 
                  style={{ backgroundColor: colors.background.card, cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedDependency({
                      name: 'lodash',
                      version: '4.17.21',
                      addedBy: 'Emma Wilson',
                      riskScore: 68,
                      status: 'pending',
                      healthScore: 75,
                      activityScore: 45,
                      busFactor: 12,
                      license: 'MIT',
                      projectLicense: 'MIT',
                      vulnerabilities: 1,
                      pastVulnerabilities: 3
                    })
                    setShowDependencyReviewDialog(true)
                  }}
                  className="hover:opacity-90 transition-opacity"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
                          <img src="/package_icon.png" alt="Package" className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white">lodash</h3>
                          <p className="text-gray-400">Added by Emma Wilson</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-blue-500 text-blue-500">
                            <MessageSquare className="mr-1 h-3 w-3" />
                            1
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4">
                          <span className="text-yellow-400 text-xs">⚠</span>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">68</div>
                            <div className="text-xs text-gray-400">Risk Score</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {currentTab === "compliance" && (
          <div className="space-y-6">

            {/* License Compliance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project License */}
              <Card style={{ backgroundColor: colors.background.card }}>
              <CardHeader>
                  <CardTitle className="text-white">Project License</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <span className="text-green-400 font-bold text-sm">MIT</span>
                    </div>
                      <div>
                        <div className="text-white font-medium">MIT License</div>
                          </div>
                  </div>
                </div>
              </CardContent>
            </Card>

              {/* Compliance Status */}
              <Card style={{ backgroundColor: colors.background.card }}>
              <CardHeader>
                  <CardTitle className="text-white">Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Overall Compliance</span>
                      <span className="text-green-400 font-semibold">95%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">License Conflicts</span>
                      <span className="text-yellow-400 font-semibold">2</span>
                  </div>
                  </div>
                </CardContent>
              </Card>

              {/* SBOM Download */}
              <Card style={{ backgroundColor: colors.background.card }}>
              <CardHeader>
                  <CardTitle className="text-white">Software Bill of Materials</CardTitle>
              </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full hover:opacity-90 text-white" style={{ backgroundColor: colors.primary }}>
                      <Download className="h-4 w-4 mr-2" />
                      Download SBOM
                    </Button>
                    <div className="text-xs text-gray-500">
                      Last updated: 2 hours ago
                  </div>
                </div>
                </CardContent>
              </Card>
                  </div>
                  
            {/* Non-Compliant Dependencies */}
            <Card style={{ backgroundColor: colors.background.card }}>
              <CardHeader>
                <CardTitle className="text-white">Non-Compliant Dependencies</CardTitle>
                <p className="text-gray-400 text-sm">Dependencies that don't comply with your project's license</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'rgb(26, 26, 26)' }}>
                          <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
                        <img src="/package_icon.png" alt="Package" className="w-4 h-4" />
                            </div>
                            <div>
                        <div className="text-white font-medium">moment</div>
                        <div className="text-sm text-gray-400">v2.29.4 • GPL-2.0 License</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                      <div className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">Incompatible</div>
                        </div>
                      </div>

                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {currentTab === "alerts" && (
          <div className="space-y-6">
            {/* Alert Filters */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className={`border-blue-500 text-blue-400 hover:bg-blue-500/20 ${alertFilter === "all" ? "bg-blue-500/20 border-blue-400" : ""}`}
                onClick={() => setAlertFilter("all")}
              >
                All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`border-blue-500 text-blue-400 hover:bg-blue-500/20 ${alertFilter === "resolve" ? "bg-blue-500/20 border-blue-400" : ""}`}
                onClick={() => setAlertFilter("resolve")}
              >
                Resolve
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className={`border-blue-500 text-blue-400 hover:bg-blue-500/20 ${alertFilter === "resolved" ? "bg-blue-500/20 border-blue-400" : ""}`}
                onClick={() => setAlertFilter("resolved")}
              >
                Resolved
              </Button>
            </div>

            {/* Alert 1 - New Vulnerability */}
            {(alertFilter === "all" || alertFilter === "resolve") && (
            <Card style={{ backgroundColor: colors.background.card }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
                      <span className="text-white font-bold text-lg">!</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">New Vulnerability in express</h3>
                      <p className="text-gray-300">A new vulnerability has been detected for express</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between h-full">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        Resolve
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        <img src="/jira_icon.png" alt="Jira" className="h-4 w-4 mr-1" />
                        Send to Jira
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Sept. 6, 2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Alert 2 - Lines Deleted */}
            {(alertFilter === "all" || alertFilter === "resolve") && (
            <Card style={{ backgroundColor: colors.background.card }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
                      <span className="text-white font-bold text-lg">⚠</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Lines Deleted in react</h3>
                      <p className="text-gray-300">The number of lines deleted (201) has exceeded the threshold</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between h-full">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        Resolve
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        <img src="/jira_icon.png" alt="Jira" className="h-4 w-4 mr-1" />
                        Send to Jira
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Sept. 4, 2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Alert 3 - Files Added */}
            {(alertFilter === "all" || alertFilter === "resolved") && (
            <Card style={{ backgroundColor: colors.background.card }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
                      <span className="text-white font-bold text-lg">+</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Files Added in lodash</h3>
                      <p className="text-gray-300">20 new files have been added exceeding the normal threshold</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between h-full">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-500 cursor-not-allowed" disabled>
                        Resolved
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-500 cursor-not-allowed" disabled>
                        <img src="/jira_icon.png" alt="Jira" className="h-4 w-4 mr-1 opacity-50" />
                        Send to Jira
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Sept. 2, 2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Alert 4 - Lower Health */}
            {(alertFilter === "all" || alertFilter === "resolve") && (
            <Card style={{ backgroundColor: colors.background.card }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
                      <span className="text-white font-bold text-lg">↓</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Lower Health in moment</h3>
                      <p className="text-gray-300">Project health score has decreased significantly</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between h-full">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        Resolve
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        <img src="/jira_icon.png" alt="Jira" className="h-4 w-4 mr-1" />
                        Send to Jira
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Aug. 28, 2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Alert 5 - Suspicious Author */}
            {(alertFilter === "all" || alertFilter === "resolve") && (
            <Card style={{ backgroundColor: colors.background.card }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
                      <span className="text-white font-bold text-lg">👤</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">Suspicious Author in axios</h3>
                      <p className="text-gray-300">New dependency added by unknown author</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between h-full">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        Resolve
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        <img src="/jira_icon.png" alt="Jira" className="h-4 w-4 mr-1" />
                        Send to Jira
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Aug. 25, 2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        )}

        {currentTab === "settings" && (
          <div className="flex h-full overflow-hidden scrollbar-hide">
            {/* Settings Sidebar */}
            <div className="w-64 border-r border-gray-800 p-6 overflow-y-auto scrollbar-hide">
              <div className="space-y-1">                
                {/* Settings Navigation Items */}
                {[
                  { id: 'general', label: 'General' },
                  { id: 'integrations', label: 'Integrations' },
                  { id: 'alerts', label: 'Alert Settings' },
                  { id: 'team', label: 'Team Members' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentSettingsTab(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      currentSettingsTab === item.id
                        ? 'text-white'
                        : 'text-gray-300 hover:text-white'
                    }`}
                    style={currentSettingsTab === item.id ? { backgroundColor: 'rgb(18, 18, 18)' } : {}}
                    onMouseEnter={(e) => {
                      if (currentSettingsTab !== item.id) {
                        e.currentTarget.style.backgroundColor = 'rgb(18, 18, 18)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentSettingsTab !== item.id) {
                        e.currentTarget.style.backgroundColor = '';
                      }
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Settings Content */}
            <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
              {currentSettingsTab === 'general' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white">General Settings</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Project Name</label>
                      <Input 
                        placeholder="Enter project name"
                        defaultValue={project?.name || ''}
                        className="text-white placeholder-gray-400"
                        style={{ backgroundColor: 'rgb(18, 18, 18)' }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Project Language</label>
                      <Input 
                        placeholder="JavaScript"
                        defaultValue="JavaScript"
                        className="text-white placeholder-gray-400"
                        style={{ backgroundColor: 'rgb(18, 18, 18)' }}
                      />
                      <p className="text-sm text-gray-400 mt-1">Primary programming language for this project</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">License</label>
                      <Input 
                        placeholder="MIT License"
                        defaultValue="MIT License"
                        className="text-white placeholder-gray-400"
                        style={{ backgroundColor: 'rgb(18, 18, 18)' }}
                      />
                      <p className="text-sm text-gray-400 mt-1">The license under which this project is distributed</p>
                    </div>
                    
                    <div className="pt-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Project Type</h3>
                      <div className="text-sm text-gray-400">Linked to GitHub repository</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">GitHub Repository</label>
                      <Input 
                        placeholder="https://github.com/username/repository"
                        defaultValue="https://github.com/example/project"
                        className="text-white placeholder-gray-400"
                        style={{ backgroundColor: 'rgb(18, 18, 18)' }}
                      />
                      <p className="text-sm text-gray-400 mt-1">The GitHub repository URL for this project</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Branch</label>
                      <Input 
                        placeholder="main"
                        defaultValue="main"
                        className="text-white placeholder-gray-400"
                        style={{ backgroundColor: 'rgb(18, 18, 18)' }}
                      />
                      <p className="text-sm text-gray-400 mt-1">The default branch to monitor for changes</p>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button style={{ backgroundColor: colors.primary }} className="hover:opacity-90 text-white">
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {currentSettingsTab === 'integrations' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Integrations</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Jira Integration */}
                    <Card style={{ backgroundColor: colors.background.card }}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                              <img src="/jira_icon.png" alt="Jira" className="w-8 h-8" />
                            </div>
                            <div>
                              <div className="text-white font-medium text-lg">Jira</div>
                              <div className="text-sm text-gray-400">Project management and issue tracking</div>
                            </div>
                          </div>
                          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                            Connect
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Slack Integration */}
                    <Card style={{ backgroundColor: colors.background.card }}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                              <img src="/Slack_icon.png" alt="Slack" className="w-8 h-8" />
                            </div>
                            <div>
                              <div className="text-white font-medium text-lg">Slack</div>
                              <div className="text-sm text-gray-400">Team communication and notifications</div>
                            </div>
                          </div>
                          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                            Connect
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Discord Integration */}
                    <Card style={{ backgroundColor: colors.background.card }}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                              <img src="/Discord_icon.png" alt="Discord" className="w-8 h-8" />
                            </div>
                            <div>
                              <div className="text-white font-medium text-lg">Discord</div>
                              <div className="text-sm text-gray-400">Community communication and notifications</div>
                            </div>
                          </div>
                          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                            Connect
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* GitHub Actions Integration */}
                    <Card style={{ backgroundColor: colors.background.card }}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gray-500/20 flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                              <img src="/Github_icon.png" alt="GitHub Actions" className="w-8 h-8" />
                            </div>
                            <div>
                              <div className="text-white font-medium text-lg">GitHub Actions</div>
                              <div className="text-sm text-gray-400">Automated workflows and CI/CD pipelines</div>
                            </div>
                          </div>
                          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                            Connect
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {currentSettingsTab === 'alerts' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Alert Settings</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {/* New Vulnerabilities Card */}
                    <Card style={{ backgroundColor: colors.background.card }}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                              <Shield className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                              <div className="text-white font-medium text-lg">New Vulnerabilities</div>
                              <div className="text-sm text-gray-400">Alert when new vulnerabilities are detected in dependencies</div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ backgroundColor: 'rgb(84, 0, 250)' }}></div>
                          </label>
                        </div>
                      </CardContent>
                    </Card>

                    {/* License Alerts Card */}
                    <Card style={{ backgroundColor: colors.background.card }}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                              <FileText className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div>
                              <div className="text-white font-medium text-lg">License Alerts</div>
                              <div className="text-sm text-gray-400">Alert when dependencies have incompatible licenses</div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ backgroundColor: 'rgb(84, 0, 250)' }}></div>
                          </label>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Project Health Drops Card */}
                    <Card style={{ backgroundColor: colors.background.card }}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                              <AlertTriangle className="w-6 h-6 text-orange-400" />
                            </div>
                            <div>
                              <div className="text-white font-medium text-lg">Project Health Changes</div>
                              <div className="text-sm text-gray-400">Alert when project health score drops</div>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ backgroundColor: 'rgb(84, 0, 250)' }}></div>
                          </label>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {currentSettingsTab === 'team' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Team Members</h2>
                    <Button style={{ backgroundColor: colors.primary }} className="hover:opacity-90 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </div>
                  
                  <div className="space-y-0 border border-gray-700 rounded-lg overflow-hidden">
                    {/* Team Member 1 */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-700 transition-colors" style={{ backgroundColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(18, 18, 18)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <span className="text-blue-400 font-bold text-sm">AJ</span>
                        </div>
                        <div>
                          <div className="text-white font-medium">Alex Johnson</div>
                          <div className="text-sm text-gray-400">Admin</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                          Promote
                        </Button>
                        <Button variant="outline" size="sm" className="border-red-600 text-red-400 hover:bg-red-600/20">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Team Member 2 */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-700 transition-colors" style={{ backgroundColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(18, 18, 18)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <span className="text-purple-400 font-bold text-sm">SK</span>
                        </div>
                        <div>
                          <div className="text-white font-medium">Sarah Kim</div>
                          <div className="text-sm text-gray-400">Member</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                          Promote
                        </Button>
                        <Button variant="outline" size="sm" className="border-red-600 text-red-400 hover:bg-red-600/20">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Team Member 3 */}
                    <div className="flex items-center justify-between p-4 transition-colors" style={{ backgroundColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(18, 18, 18)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                          <span className="text-orange-400 font-bold text-sm">DL</span>
                        </div>
                        <div>
                          <div className="text-white font-medium">David Lee</div>
                          <div className="text-sm text-gray-400">Member</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                          Promote
                        </Button>
                        <Button variant="outline" size="sm" className="border-red-600 text-red-400 hover:bg-red-600/20">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* Filter Popup Dialog */}
      <Dialog open={showFilterPopup} onOpenChange={setShowFilterPopup}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Add Filters</DialogTitle>
          </DialogHeader>
                  <div className="space-y-4">
            <div className="text-sm text-gray-400">
              Select filters to narrow down your dependencies
            </div>
            <div className="space-y-3">
              {[
                { id: 'non-compliant', label: 'Non-Compliant', description: 'Dependencies with license issues' },
                { id: 'outdated', label: 'Outdated', description: 'Dependencies with newer versions available' },
                { id: 'risky', label: 'Risky', description: 'Dependencies with high risk scores' }
              ].map((filter) => (
                <div
                  key={filter.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    activeFilters.includes(filter.label)
                      ? 'border-gray-600'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  style={{ backgroundColor: activeFilters.includes(filter.label) ? colors.background.card : colors.background.card }}
                  onClick={() => {
                    if (activeFilters.includes(filter.label)) {
                      setActiveFilters(activeFilters.filter(f => f !== filter.label))
                    } else {
                      setActiveFilters([...activeFilters, filter.label])
                    }
                  }}
                >
                      <div>
                    <div className="text-white font-medium">{filter.label}</div>
                    <div className="text-sm text-gray-400">{filter.description}</div>
                      </div>
                  <div className={`w-4 h-4 rounded border-2 ${
                    activeFilters.includes(filter.label)
                      ? 'border-gray-400'
                      : 'border-gray-600'
                  }`}
                  style={{ backgroundColor: activeFilters.includes(filter.label) ? colors.background.card : 'transparent' }}>
                    {activeFilters.includes(filter.label) && (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4">
                      <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => setShowFilterPopup(false)}
              >
                Cancel
                      </Button>
              {activeFilters.length > 0 && (
                <Button
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                  onClick={() => {
                    setActiveFilters([])
                    setShowFilterPopup(false)
                  }}
                >
                  Clear Filters
                </Button>
              )}
      </div>
                  </div>
        </DialogContent>
      </Dialog>

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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-gray-900 border-red-800">
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">
              Are you sure you want to delete <strong className="text-white">{project?.name}</strong>? 
              This action cannot be undone and will permanently delete:
            </p>
            <ul className="text-gray-300 text-sm space-y-1 ml-4">
              <li>• All project data and settings</li>
              <li>• All team member associations</li>
              <li>• All watchlist items</li>
              <li>• All dependency tracking data</li>
              {project?.repository_url && (
                <li>• Monitored branch (if no other projects are tracking it)</li>
              )}
            </ul>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProject}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? 'Deleting...' : 'Delete Project'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dependency Review Dialog */}
      <Dialog open={showDependencyReviewDialog} onOpenChange={setShowDependencyReviewDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
                <img src="/package_icon.png" alt="Package" className="w-5 h-5" />
              </div>
              {selectedDependency?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDependency && (
            <div className="space-y-6">
              {/* Package Details - Full Width */}
              <Card style={{ backgroundColor: colors.background.card }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Package Details</CardTitle>
                    <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      <ExternalLinkIcon className="mr-2 h-4 w-4" />
                      View Full Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-8">
                    {/* Progress Circle for Score */}
                    <div className="flex items-center gap-4">
                      <div className="relative w-32 h-32">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-800"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            style={{ stroke: 'rgb(84, 0, 250)' }}
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray={`${selectedDependency.riskScore}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-white">{selectedDependency.riskScore}</div>
                            <div className="text-sm text-gray-400">Score</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bars for Score Breakdown */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">Health Score</span>
                          <span className="text-sm text-white font-medium">{selectedDependency.healthScore}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ width: `${selectedDependency.healthScore}%`, backgroundColor: 'rgb(84, 0, 250)' }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">Activity Score</span>
                          <span className="text-sm text-white font-medium">{selectedDependency.activityScore}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ width: `${selectedDependency.activityScore}%`, backgroundColor: 'rgb(84, 0, 250)' }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">Bus Factor</span>
                          <span className="text-sm text-white font-medium">{selectedDependency.busFactor}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(selectedDependency.busFactor * 5, 100)}%`, backgroundColor: 'rgb(84, 0, 250)' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Second Row - Vulnerabilities and License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vulnerabilities Card */}
                <Card style={{ backgroundColor: colors.background.card }}>
                  <CardHeader>
                    <CardTitle className="text-white">Vulnerabilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm text-gray-300">No known vulnerabilities in current version</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <img src="/osv_logo.svg" alt="OSV" className="w-4 h-4" />
                        <span className="text-xs text-gray-500">Data from OSV</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* License Information Card */}
                <Card style={{ backgroundColor: colors.background.card }}>
                  <CardHeader>
                    <CardTitle className="text-white">License Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <span className="text-green-400 font-bold text-sm">{selectedDependency.license}</span>
                        </div>
                        <div>
                          <div className="text-white font-medium">{selectedDependency.license} License</div>
                          <div className="text-sm text-gray-400">Compatible with project</div>
                        </div>
                      </div>
                      {selectedDependency.license === selectedDependency.projectLicense ? (
                        <Badge variant="outline" className="border-green-500 text-green-500">
                          <Check className="mr-1 h-3 w-3" />
                          Compatible
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Review Needed
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Review and Timeline - Combined */}
              <Card style={{ backgroundColor: colors.background.card }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Review</CardTitle>
                    <div>
                      {selectedDependency.status === 'approved' && (
                        <Badge variant="outline" className="border-green-500 text-green-500">
                          <Check className="mr-1 h-3 w-3" />
                          Approved
                        </Badge>
                      )}
                      {selectedDependency.status === 'rejected' && (
                        <Badge variant="outline" className="border-red-500 text-red-500">
                          <Trash2 className="mr-1 h-3 w-3" />
                          Rejected
                        </Badge>
                      )}
                      {selectedDependency.status === 'pending' && (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Timeline */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{selectedDependency.addedBy} added this dependency to watchlist</div>
                          <div className="text-sm text-gray-400">2 days ago</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">Sarah Kim commented</div>
                          <div className="text-gray-300 mt-1">This looks good, but we should check the license compatibility first.</div>
                          <div className="text-sm text-gray-400">1 day ago</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">David Lee commented</div>
                          <div className="text-gray-300 mt-1">License looks compatible with our MIT project. I think we can proceed.</div>
                          <div className="text-sm text-gray-400">12 hours ago</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">Emma Wilson commented</div>
                          <div className="text-gray-300 mt-1">The health score looks great and activity is high. I'm in favor of adding this.</div>
                          <div className="text-sm text-gray-400">8 hours ago</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">Mike Chen commented</div>
                          <div className="text-gray-300 mt-1">Just want to double-check - are we sure about the bus factor? 15 contributors seems low for such a popular package.</div>
                          <div className="text-sm text-gray-400">4 hours ago</div>
                        </div>
                      </div>
                      
                      {selectedDependency.status === 'approved' && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Check className="h-4 w-4 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium">{selectedDependency.approvedBy} approved this dependency</div>
                            <div className="text-sm text-gray-400">1 hour ago</div>
                          </div>
                        </div>
                      )}
                      
                      {selectedDependency.status === 'rejected' && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium">{selectedDependency.rejectedBy} rejected this dependency</div>
                            <div className="text-gray-300 mt-1">"Too many vulnerabilities and low activity score."</div>
                            <div className="text-sm text-gray-400">2 days ago</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Add Comment Section */}
                    <div className="border-t border-gray-700 pt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <textarea
                            placeholder="Add a comment..."
                            className="w-full px-3 py-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            style={{ backgroundColor: colors.background.card, borderColor: 'hsl(var(--border))', borderWidth: '1px' }}
                            rows={3}
                          />
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm"
                                className="text-white"
                                style={{ backgroundColor: 'rgb(34, 197, 94)' }}
                                onClick={() => {
                                  setShowDependencyReviewDialog(false)
                                  toast({
                                    title: "Dependency Approved",
                                    description: `${selectedDependency.name} has been approved.`,
                                  })
                                }}
                              >
                                <Check className="mr-1 h-3 w-3" />
                                Approve
                              </Button>
                              <Button 
                                size="sm"
                                className="text-white"
                                style={{ backgroundColor: 'rgb(239, 68, 68)' }}
                                onClick={() => {
                                  setShowDependencyReviewDialog(false)
                                  toast({
                                    title: "Dependency Rejected",
                                    description: `${selectedDependency.name} has been rejected.`,
                                  })
                                }}
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                Reject
                              </Button>
                            </div>
                            <Button size="sm" className="text-white" style={{ backgroundColor: colors.primary }}>
                              Comment
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}




