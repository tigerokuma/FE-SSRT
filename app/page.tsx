"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Star, Shield, AlertCircle, Clock, User, Github, GitBranch, Package, Bell, ChevronDown, ChevronUp, Code, Globe, Database, Terminal, FileText } from "lucide-react"
// import { CreateProjectDialog } from "@/components/CreateProjectDialog"
import { AuthService } from "@/lib/auth"
import { colors } from "@/lib/design-system"
import { WatchlistSearchDialog } from "@/components/watchlist/WatchlistSearchDialog"

interface Project {
  id: string
  name: string
  description?: string
  repository_url?: string
  status: string
  error_message?: string
  created_at: string
  updated_at: string
  type?: 'repo' | 'file' | 'cli'
  language?: string
  license?: string | null
  health_score?: number
  progress?: number
  totalDependencies?: number
  completedDependencies?: number
}

export default function Home() {
  const router = useRouter()
  // const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPlanUsageExpanded, setIsPlanUsageExpanded] = useState(false)
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({})
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingStartTimeRef = useRef<number | null>(null)

  // Fetch projects function
  const fetchProjects = async () => {
    try {
      const response = await AuthService.fetchWithAuth('http://localhost:3000/projects/user/user-123')
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      
      const data = await response.json()
      
      // For creating projects, fetch their individual status to get progress data
      const creatingProjects = data.filter((project: Project) => project.status === 'creating')
      if (creatingProjects.length > 0) {
        console.log(`🔍 Found ${creatingProjects.length} creating projects, fetching progress data...`)
        
        const progressPromises = creatingProjects.map(async (project: Project) => {
          try {
            const statusResponse = await AuthService.fetchWithAuth(`http://localhost:3000/projects/${project.id}/status`)
            if (statusResponse.ok) {
              const statusData = await statusResponse.json()
              return { projectId: project.id, statusData }
            }
          } catch (err) {
            console.error(`❌ ERROR fetching progress for project ${project.id}:`, err)
          }
          return null
        })
        
        const progressResults = await Promise.all(progressPromises)
        const validProgressResults = progressResults.filter(result => result !== null)
        
        // Update projects with progress data
        if (validProgressResults.length > 0) {
          data.forEach((project: Project) => {
            const progressResult = validProgressResults.find(result => result.projectId === project.id)
            if (progressResult) {
              project.progress = progressResult.statusData.progress
              project.totalDependencies = progressResult.statusData.totalDependencies
              project.completedDependencies = progressResult.statusData.completedDependencies
            }
          })
        }
      }
      
      setProjects(data)
      return data
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError('Failed to load projects')
      throw err
    }
  }

  // Function to handle copy with animation
  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates(prev => ({ ...prev, [key]: true }))
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // Function to format relative time
  const formatRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return 'just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000)
      return `${months} month${months > 1 ? 's' : ''} ago`
    } else {
      const years = Math.floor(diffInSeconds / 31536000)
      return `${years} year${years > 1 ? 's' : ''} ago`
    }
  }

  // Function to generate random commit hash
  const generateCommitHash = () => {
    const chars = '0123456789abcdef'
    let result = ''
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Function to get project icon based on language
  const getProjectIcon = (project: Project) => {
    const language = project.language?.toLowerCase()
    
    // React/JavaScript projects
    if (language === 'javascript' || language === 'typescript' || language === 'react' || language === 'nodejs') {
      return <img src="/Node_logo.png" alt="Node.js" className="h-5 w-5 bg-transparent" />
    }
    
    // Vue projects
    if (language === 'vue') {
      return <img src="/Vue_logo.png" alt="Vue" className="h-5 w-5 bg-transparent" />
    }
    
    // Python projects
    if (language === 'python') {
      return <img src="/Python_logo.png" alt="Python" className="h-5 w-5 bg-transparent" />
    }
    
    // Go projects
    if (language === 'go') {
      return <img src="/Go_logo.png" alt="Go" className="h-5 w-5 bg-transparent" />
    }
    
    // Java projects
    if (language === 'java') {
      return <img src="/Java_logo.png" alt="Java" className="h-5 w-5 bg-transparent" />
    }
    
    // Rust projects
    if (language === 'rust') {
      return <img src="/Rust_logo.png" alt="Rust" className="h-5 w-5 bg-transparent" />
    }
    
    // Ruby projects
    if (language === 'ruby') {
      return <img src="/Ruby_logo.png" alt="Ruby" className="h-5 w-5 bg-transparent" />
    }
    
    // Default to Deply logo for unknown languages
    return <img src="/Deply_Logo.png" alt="Deply" className="h-5 w-5 bg-transparent" />
  }

  // Function to get project status message
  const getProjectStatus = (project: Project) => {
    const projectType = project.type
    const relativeTime = formatRelativeTime(project.created_at)
    
    // File upload projects
    if (projectType === 'file') {
      return {
        text: `Created ${relativeTime}`,
        icon: <FileText className="h-3 w-3" />,
        timeText: `Created ${relativeTime}`
      }
    }
    
    // Repository projects
    if (projectType === 'repo') {
      return {
        text: `Created ${relativeTime}`,
        icon: <Github className="h-3 w-3" />,
        timeText: `Created ${relativeTime}`
      }
    }
    
    // CLI projects
    if (projectType === 'cli') {
      return {
        text: `Created ${relativeTime}`,
        icon: <Terminal className="h-3 w-3" />,
        timeText: `Created ${relativeTime}`
      }
    }
    
    // Fallback for projects without type (legacy)
    return {
      text: `Created ${relativeTime}`,
      icon: <Clock className="h-3 w-3" />,
      timeText: `Created ${relativeTime}`
    }
  }

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
        
        // Fetch projects
        await fetchProjects()
      } catch (err) {
        console.error('Error fetching projects:', err)
        setError('Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchProjects()
  }, [])

  // OPTIMIZED POLLING - Check individual project statuses for creating projects
  useEffect(() => {
    const creatingProjects = projects.filter(project => project.status === 'creating')
    console.log('🔍 POLLING CHECK - Creating projects:', creatingProjects.length)
    console.log('🔍 POLLING CHECK - Current interval:', pollingIntervalRef.current)
    
    if (creatingProjects.length > 0) {
      console.log('🔄 STARTING OPTIMIZED POLLING NOW!')
      
      // Clear any existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      
      // Start new polling every 2 seconds
      const interval = setInterval(async () => {
        console.log('🔄 POLLING NOW - Checking individual project statuses...')
        try {
          // Poll each creating project individually
          const statusPromises = creatingProjects.map(async (project) => {
            try {
              const response = await AuthService.fetchWithAuth(`http://localhost:3000/projects/${project.id}/status`)
              if (response.ok) {
                const statusData = await response.json()
                console.log(`📊 PROJECT ${project.id} STATUS:`, statusData)
                return { projectId: project.id, statusData }
              }
            } catch (err) {
              console.error(`❌ ERROR checking status for project ${project.id}:`, err)
            }
            return null
          })
          
          const statusResults = await Promise.all(statusPromises)
          const validResults = statusResults.filter(result => result !== null)
          
          if (validResults.length > 0) {
            // Update projects state with new statuses
            setProjects(prevProjects => {
              const updatedProjects = [...prevProjects]
              let hasUpdates = false
              
              validResults.forEach(({ projectId, statusData }) => {
                const projectIndex = updatedProjects.findIndex(p => p.id === projectId)
                if (projectIndex !== -1) {
                  const currentProject = updatedProjects[projectIndex]
                  const statusChanged = currentProject.status !== statusData.status
                  const progressChanged = currentProject.progress !== statusData.progress
                  
                  if (statusChanged || progressChanged) {
                    console.log(`🔄 UPDATING PROJECT ${projectId}: ${statusChanged ? `${currentProject.status} -> ${statusData.status}` : ''} ${progressChanged ? `progress: ${currentProject.progress} -> ${statusData.progress}` : ''}`)
                    
                    // Only allow progress to increase, never decrease
                    const currentProgress = currentProject.progress || 0
                    const newProgress = statusData.progress || 0
                    const finalProgress = newProgress > currentProgress ? newProgress : currentProgress
                    
                    updatedProjects[projectIndex] = {
                      ...currentProject,
                      status: statusData.status,
                      error_message: statusData.errorMessage,
                      progress: finalProgress,
                      totalDependencies: statusData.totalDependencies,
                      completedDependencies: statusData.completedDependencies,
                      health_score: statusData.health_score || currentProject.health_score,
                      created_at: statusData.created_at || currentProject.created_at
                    }
                    hasUpdates = true
                  }
                }
              })
              
              return hasUpdates ? updatedProjects : prevProjects
            })
          }
          
          // Check if still creating
          const stillCreating = projects.some((project: Project) => project.status === 'creating')
          if (!stillCreating) {
            console.log('✅ POLLING STOPPED - All projects ready')
            clearInterval(interval)
            pollingIntervalRef.current = null
          }
        } catch (err) {
          console.error('❌ POLLING ERROR:', err)
        }
      }, 2000)
      
      pollingIntervalRef.current = interval
    } else if (pollingIntervalRef.current) {
      console.log('🛑 STOPPING POLLING - No creating projects')
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [projects])

  // Refresh projects when a new one is created
  const handleProjectCreated = () => {
    fetchProjects()
  }

  // Test function to manually trigger polling (for debugging)
  const testPolling = () => {
    console.log('🧪 Testing polling manually...')
    fetchProjects()
  }

  const handleProjectClick = (project: Project) => {
    // Only allow clicking on ready projects
    if (project.status === 'ready') {
      router.push(`/project/${project.id}`)
    }
  }


  // Filter projects based on search query
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      <div className="container mx-auto px-6 py-8 max-w-7xl" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1" style={{ marginRight: '20px' }}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search projects..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-white placeholder-gray-400 focus:border-indigo-500"
                style={{ backgroundColor: colors.background.card }}
              />
            </div>
            
            </div>
            
          <div className="flex gap-3">
            <WatchlistSearchDialog
              trigger={
                <Button 
                  variant="outline"
                  className="text-white border-gray-600 hover:bg-gray-800"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Search Package
                </Button>
              }
            />
            <Button 
              className="text-white"
              style={{ backgroundColor: colors.primary }}
              onClick={() => router.push('/create-project')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </div>
        </div>

        {/* Plan Usage Section */}
        <div className="mb-8">
          <Card style={{ backgroundColor: 'rgb(18 18 18)' }}>
          <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Plan Usage</h3>
                    <p className="text-sm text-gray-400">Free tier</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPlanUsageExpanded(!isPlanUsageExpanded)}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    {isPlanUsageExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                
                {!isPlanUsageExpanded && (
                  <div className="hidden xl:flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="relative w-4 h-4">
                        <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-800"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            style={{ color: colors.progress }}
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray="100, 100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-400">Projects</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-4 h-4">
                        <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-800"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            style={{ color: colors.progress }}
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray="40, 100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-400">Tracked Packages</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-4 h-4">
                        <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-800"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            style={{ color: colors.progress }}
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray="10, 100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-400">Package Searches</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-4 h-4">
                        <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-800"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            style={{ color: colors.progress }}
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray="20, 100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-400">Project Syncs</span>
                    </div>
                  </div>
                )}
                
                <Button size="sm" className="text-white" style={{ backgroundColor: colors.primary, marginLeft: '10px' }}>
                  Upgrade
                </Button>
              </div>
              
              {!isPlanUsageExpanded && (
                <div className="xl:hidden mt-4">
                  {/* Wide mobile/tablet: single row */}
                  <div className="hidden sm:flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="relative w-4 h-4">
                        <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-800"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            style={{ color: colors.progress }}
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray="100, 100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-400">Projects</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-4 h-4">
                        <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-800"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            style={{ color: colors.progress }}
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray="40, 100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-400">Tracked Packages</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-4 h-4">
                        <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-800"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            style={{ color: colors.progress }}
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray="10, 100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-400">Package Searches</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-4 h-4">
                        <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-800"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            style={{ color: colors.progress }}
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray="20, 100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-400">Project Syncs</span>
                    </div>
                  </div>
                  
                  {/* Very narrow mobile: 2 rows of 2 */}
                  <div className="sm:hidden space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="relative w-4 h-4">
                          <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-gray-800"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              style={{ color: colors.progress }}
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              strokeDasharray="100, 100"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-400">Projects</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative w-4 h-4">
                          <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-gray-800"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              style={{ color: colors.progress }}
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              strokeDasharray="40, 100"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-400">Tracked Packages</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="relative w-4 h-4">
                          <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-gray-800"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              style={{ color: colors.progress }}
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              strokeDasharray="10, 100"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-400">Package Searches</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative w-4 h-4">
                          <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-gray-800"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              style={{ color: colors.progress }}
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              strokeDasharray="20, 100"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-400">Project Syncs</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {isPlanUsageExpanded ? (
                <div className="space-y-3" style={{ marginTop: '10px' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-6 h-6">
                        <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-800"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            style={{ color: colors.progress }}
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray="100, 100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-400">Projects</span>
                    </div>
                    <span className="text-sm text-gray-400">1/1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-6 h-6">
                        <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-800"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            style={{ color: colors.progress }}
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray="40, 100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-400">Tracked Packages</span>
                    </div>
                    <span className="text-sm text-gray-400">20/50</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-6 h-6">
                        <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-800"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            style={{ color: colors.progress }}
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray="10, 100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-400">Packages Analyzed Monthly</span>
                    </div>
                    <span className="text-sm text-gray-400">10/100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-6 h-6">
                        <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-800"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            style={{ color: colors.progress }}
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray="20, 100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-400">Project Syncs</span>
                    </div>
                    <span className="text-sm text-gray-400">4/20</span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
            {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skeleton Card 1 */}
            <div className="rounded-lg p-6" style={{ backgroundColor: colors.background.card }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-gray-600 rounded-lg animate-pulse"></div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                  <div className="w-12 h-4 bg-gray-600 rounded animate-pulse"></div>
                </div>
              </div>
              
              <div className="h-6 bg-gray-600 rounded mb-3 w-3/4 animate-pulse"></div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-600 rounded-full animate-pulse"></div>
                    <div className="w-20 h-4 bg-gray-600 rounded animate-pulse"></div>
                  </div>
                  <div className="w-8 h-4 bg-gray-600 rounded animate-pulse"></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-600 rounded animate-pulse"></div>
                    <div className="w-24 h-3 bg-gray-600 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
                    <div className="w-4 h-3 bg-gray-600 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skeleton Card 2 */}
            <div className="rounded-lg p-6" style={{ backgroundColor: colors.background.card }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-gray-600 rounded-lg animate-pulse"></div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                  <div className="w-12 h-4 bg-gray-600 rounded animate-pulse"></div>
                </div>
              </div>
              
              <div className="h-6 bg-gray-600 rounded mb-3 w-2/3 animate-pulse"></div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-600 rounded-full animate-pulse"></div>
                    <div className="w-20 h-4 bg-gray-600 rounded animate-pulse"></div>
                  </div>
                  <div className="w-8 h-4 bg-gray-600 rounded animate-pulse"></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-600 rounded animate-pulse"></div>
                    <div className="w-24 h-3 bg-gray-600 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
                    <div className="w-4 h-3 bg-gray-600 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skeleton Card 3 */}
            <div className="rounded-lg p-6" style={{ backgroundColor: colors.background.card }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-gray-600 rounded-lg animate-pulse"></div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                  <div className="w-12 h-4 bg-gray-600 rounded animate-pulse"></div>
                </div>
              </div>
              
              <div className="h-6 bg-gray-600 rounded mb-3 w-4/5 animate-pulse"></div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-600 rounded-full animate-pulse"></div>
                    <div className="w-20 h-4 bg-gray-600 rounded animate-pulse"></div>
                  </div>
                  <div className="w-8 h-4 bg-gray-600 rounded animate-pulse"></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-600 rounded animate-pulse"></div>
                    <div className="w-24 h-3 bg-gray-600 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
                    <div className="w-4 h-3 bg-gray-600 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skeleton Card 4 */}
            <div className="rounded-lg p-6" style={{ backgroundColor: colors.background.card }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-gray-600 rounded-lg animate-pulse"></div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
                  <div className="w-12 h-4 bg-gray-600 rounded animate-pulse"></div>
                </div>
              </div>
              
              <div className="h-6 bg-gray-600 rounded mb-3 w-1/2 animate-pulse"></div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-600 rounded-full animate-pulse"></div>
                    <div className="w-20 h-4 bg-gray-600 rounded animate-pulse"></div>
                  </div>
                  <div className="w-8 h-4 bg-gray-600 rounded animate-pulse"></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-600 rounded animate-pulse"></div>
                    <div className="w-24 h-3 bg-gray-600 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
                    <div className="w-4 h-3 bg-gray-600 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

              </div>
            ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">{error}</div>
                <Button 
                  onClick={() => {
                    setError(null)
                    setLoading(true)
                    fetchProjects()
                  }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Try Again
                </Button>
              </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-16">
            {/* Three ways to create a project */}
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Option 1: Connect GitHub Repository */}
                <div className="text-center p-6 rounded-lg" style={{ backgroundColor: colors.background.card }}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: colors.primaryBubble }}>
                    <Github className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Connect GitHub Repo</h3>
                  <p className="text-gray-400 text-sm">Link to one of your repositories for automatic updates</p>
                </div>

                {/* Option 2: Upload package.json */}
                <div className="text-center p-6 rounded-lg" style={{ backgroundColor: colors.background.card }}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: colors.primaryBubble }}>
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Upload dependencies file</h3>
                  <p className="text-gray-400 text-sm">Get security score without sharing your codebase</p>
                </div>

                {/* Option 3: Use CLI */}
                <div className="text-center p-6 rounded-lg" style={{ backgroundColor: colors.background.card }}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: colors.primaryBubble }}>
                    <Terminal className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Use the CLI</h3>
                  <div className="bg-gray-900 rounded-lg p-3 mb-2 relative group" style={{ padding: '0.2rem', backgroundColor: 'rgb(26 26 26)' }}>
                    <code className="text-gray-300 text-sm">npm i -g deply-cli</code>
                    <button 
                      onClick={() => handleCopy('npm i -g deply-cli', 'npm-install')}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedStates['npm-install'] ? (
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3 relative group" style={{ padding: '0.2rem', backgroundColor: 'rgb(26 26 26)' }}>
                    <code className="text-gray-300 text-sm">deply init</code>
                    <button 
                      onClick={() => handleCopy('deply init', 'deply-init')}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedStates['deply-init'] ? (
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button 
                className="text-white"
                style={{ backgroundColor: colors.primary }}
                onClick={() => router.push('/create-project')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </div>
              </div>
            ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map((project) => {
                  const isCreating = project.status === 'creating'
                  const isFailed = project.status === 'failed'
                  const isReady = project.status === 'ready'
              
              // Use actual health score for ready projects, mock data for others
              const projectScore = isReady && project.health_score ? project.health_score : (isCreating ? 0 : Math.floor(Math.random() * 40) + 60)
              const activeAlerts = 0 // Always show 0 notifications on home screen
              
              // Debug progress data for creating projects
              if (isCreating) {
                console.log(`🔍 PROJECT ${project.id} PROGRESS DEBUG:`, {
                  progress: project.progress,
                  totalDependencies: project.totalDependencies,
                  completedDependencies: project.completedDependencies,
                  status: project.status
                })
              }
              const lastUpdate = new Date(project.updated_at)
              const branchName = 'main'
                  
                  return (
                <Card 
                      key={project.id}
                  className={`transition-all cursor-pointer ${
                    isCreating ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                  style={{ backgroundColor: colors.background.card }}
                      onClick={() => handleProjectClick(project)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                        {getProjectIcon(project)}
                      </div>
                          <div className="flex items-center gap-2">
                            {isCreating && (
                          <div className="flex items-center gap-1 text-blue-400 text-xs">
                            <div className="animate-spin h-3 w-3 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                            <span>Creating</span>
                              </div>
                            )}
                            {isFailed && (
                          <div className="flex items-center gap-1 text-red-400 text-xs">
                            <AlertCircle className="h-3 w-3" />
                                <span>Failed</span>
                              </div>
                            )}
                      </div>
                          </div>
                          
                    <h3 className="text-lg font-semibold text-white mb-2">{project.name}</h3>
                          
                          {project.repository_url && project.repository_url.includes('github.com') && (
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                              <Github className="h-4 w-4" />
                              <span className="truncate">{project.repository_url.split('/').slice(-2).join('/')}</span>
                            </div>
                          )}
                          
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="relative w-6 h-6">
                            <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-gray-800"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className={`${isCreating ? 'text-blue-500' : 
                                  projectScore >= 80 ? 'text-green-500' : 
                                  projectScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                                } transition-all duration-1000 ease-out`}
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray={isCreating ? `${project.progress || 0}, 100` : `${projectScore}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            </div>
                          <span className="text-sm text-gray-400">
                            {isCreating ? 'Progress' : 'Project Score'}
                          </span>
                        </div>
                        <span className={`text-sm font-medium transition-all duration-1000 ease-out ${
                          isCreating ? 'text-blue-500' :
                          projectScore >= 80 ? 'text-green-500' : 
                          projectScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {isCreating ? `${project.progress || 0}%` : Math.round(projectScore)}
                        </span>
                        </div>
                        
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                          {isCreating ? (
                            <>
                              <Clock className="h-3 w-3" />
                              <span>Just created</span>
                            </>
                          ) : (
                            (() => {
                              const status = getProjectStatus(project)
                              return (
                                <>
                                  {status.icon}
                                  <span>{status.timeText}</span>
                                </>
                              )
                            })()
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Bell className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-400">{activeAlerts}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                  )
                })}
              </div>
            )}
      </div>
    </div>
  )
}
