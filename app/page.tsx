"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Star, Shield, AlertCircle, Clock, User } from "lucide-react"
import { CreateProjectDialog } from "@/components/CreateProjectDialog"
import { AuthService } from "@/lib/auth"

interface Project {
  id: string
  name: string
  description?: string
  repository_url?: string
  status: string
  error_message?: string
  created_at: string
  updated_at: string
}

export default function Home() {
  const router = useRouter()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check authentication status and fetch projects on component mount
  useEffect(() => {
    const checkAuthAndFetchProjects = async () => {
      try {
        setLoading(true)
        
        // Simple: just set authenticated state for testing
        setIsAuthenticated(true)
        setUser({ 
          name: 'Test User',
          github_username: 'test-user',
          email: 'test@example.com'
        })
        
        // Fetch projects with auth headers
        const response = await AuthService.fetchWithAuth('http://localhost:3000/projects/user/user-123')
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects')
        }
        
        const data = await response.json()
        setProjects(data)
      } catch (err) {
        console.error('Error fetching projects:', err)
        setError('Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchProjects()
  }, [])

  // Polling logic for projects with "creating" status
  useEffect(() => {
    const hasCreatingProjects = projects.some(project => project.status === 'creating')
    
    if (hasCreatingProjects && !pollingIntervalRef.current) {
      console.log('🔄 Starting polling for creating projects...')
      // Start polling every 5 seconds
      const interval = setInterval(async () => {
        try {
          console.log('🔄 Polling project status...')
          const response = await fetch('http://localhost:3000/projects/user/user-123')
          if (response.ok) {
            const data = await response.json()
            console.log('📊 Polling response:', data)
            setProjects(data)
            
            // Check if all projects are ready (no more "creating" status)
            const stillCreating = data.some((project: Project) => project.status === 'creating')
            if (!stillCreating) {
              console.log('✅ All projects ready, stopping polling')
              clearInterval(interval)
              pollingIntervalRef.current = null
            }
          }
        } catch (err) {
          console.error('Error polling project status:', err)
        }
      }, 5000)
      
      pollingIntervalRef.current = interval
    } else if (!hasCreatingProjects && pollingIntervalRef.current) {
      console.log('🛑 No creating projects, clearing polling')
      // Clear polling if no creating projects
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [projects])

  // Refresh projects when a new one is created
  const handleProjectCreated = () => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://localhost:3000/projects/user/user-123')
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects')
        }
        
        const data = await response.json()
        setProjects(data)
      } catch (err) {
        console.error('Error fetching projects:', err)
        setError('Failed to load projects')
      }
    }

    fetchProjects()
  }

  const handleProjectClick = (project: Project) => {
    // Only allow clicking on ready projects
    if (project.status === 'ready') {
      router.push(`/project/${project.id}`)
    }
  }


  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search" 
                className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-white">
                <User className="h-4 w-4" />
                <span className="text-sm">{user?.name || 'Test User'}</span>
              </div>
            </div>
            
            <CreateProjectDialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              onProjectCreated={handleProjectCreated}
              trigger={
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              }
            />
          </div>
        </div>

        {/* Projects Table */}
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-400">Loading projects...</div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-400">{error}</div>
                <Button 
                  onClick={handleProjectCreated}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Try Again
                </Button>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">No projects found</div>
                <div className="text-sm text-gray-500">Create your first project to get started</div>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => {
                  const isCreating = project.status === 'creating'
                  const isFailed = project.status === 'failed'
                  const isReady = project.status === 'ready'
                  
                  return (
                    <div 
                      key={project.id}
                      onClick={() => handleProjectClick(project)}
                      className={`py-3 px-4 rounded-lg transition-colors ${
                        isCreating 
                          ? 'bg-gray-800/30 cursor-not-allowed opacity-75' 
                          : isReady 
                            ? 'hover:bg-gray-800/50 cursor-pointer' 
                            : 'bg-red-900/20 cursor-not-allowed opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium text-lg">{project.name}</span>
                            {isCreating && (
                              <div className="flex items-center gap-2 text-blue-400 text-sm">
                                <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                                <span>Creating...</span>
                              </div>
                            )}
                            {isFailed && (
                              <div className="flex items-center gap-2 text-red-400 text-sm">
                                <AlertCircle className="h-4 w-4" />
                                <span>Failed</span>
                              </div>
                            )}
                            {isReady && (
                              <div className="flex items-center gap-2 text-green-400 text-sm">
                                <Shield className="h-4 w-4" />
                                <span>Ready</span>
                              </div>
                            )}
                          </div>
                          
                          {project.description && (
                            <div className="text-gray-400 text-sm mt-1">{project.description}</div>
                          )}
                          
                          {project.repository_url && (
                            <div className="text-blue-400 text-sm mt-1">
                              <a href={project.repository_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {project.repository_url}
                              </a>
                            </div>
                          )}
                          
                          {isFailed && project.error_message && (
                            <div className="text-red-400 text-sm mt-1">
                              Error: {project.error_message}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-gray-500 text-sm">
                          {new Date(project.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
