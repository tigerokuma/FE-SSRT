"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Github, ArrowLeft, FileText, Terminal, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { colors } from "@/lib/design-system"

interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string
  html_url: string
  clone_url: string
  private: boolean
  language: string
  stargazers_count: number
  forks_count: number
  updated_at: string
}

export default function CreateProjectPage() {
  const router = useRouter()
  const [repositories, setRepositories] = useState<GitHubRepository[]>([])
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepository[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [creatingRepoId, setCreatingRepoId] = useState<number | null>(null)
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchRepositories()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = repositories.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredRepos(filtered)
    } else {
      setFilteredRepos(repositories)
    }
  }, [searchQuery, repositories])

  const fetchRepositories = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:3000/github/repositories')
      if (response.ok) {
        const repos = await response.json()
        setRepositories(repos)
        setFilteredRepos(repos)
      } else {
        console.error('Failed to fetch repositories')
        toast({
          title: "Error",
          description: "Failed to load your GitHub repositories. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching repositories:', error)
      toast({
        title: "Error",
        description: "Failed to load your GitHub repositories. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProject = async (repo: GitHubRepository) => {
    // Navigate to new project configuration page with repository data
    router.push(`/create-project/new?repo=${encodeURIComponent(JSON.stringify(repo))}`)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('File selected:', file.name)
      // Handle file upload logic here
      toast({
        title: "File Selected",
        description: `Selected ${file.name}. File upload functionality coming soon!`,
      })
    }
  }

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background.main }}>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Create Project</h1>
          <p className="text-gray-400 mt-2">
            Choose how you'd like to create your project
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Half: Git Repositories */}
          <div className="space-y-6" style={{ backgroundColor: colors.background.card }}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primaryBubble }}>
                  <Github className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Import Git Repository</h2>
                  <p className="text-gray-400 text-sm">Link to repository for automatic updates</p>
                </div>
              </div>
              
              {/* Search */}
              <div className="relative mb-6">
                <Input
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black border-gray-700 text-white placeholder-gray-400"
                  style={{ backgroundColor: 'rgb(26 26 26)' }}
                />
              </div>

              {/* Repository List */}
              <div className="space-y-3">
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, index) => (
                    <Card 
                      key={index}
                      className="bg-black border-gray-700 hover:border-gray-600 transition-all"
                      style={{ backgroundColor: 'rgb(26 26 26)' }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 bg-gray-600 rounded-lg animate-pulse"></div>
                            <div className="flex-1 min-w-0">
                              <div className="h-4 bg-gray-600 rounded animate-pulse mb-1 w-3/4"></div>
                              <div className="h-3 bg-gray-600 rounded animate-pulse mb-1 w-1/2"></div>
                              <div className="h-3 bg-gray-600 rounded animate-pulse w-2/3"></div>
                            </div>
                          </div>
                          <div className="h-8 w-20 bg-gray-600 rounded animate-pulse"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : filteredRepos.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400">No repositories found</div>
                  </div>
                ) : (
                  filteredRepos.slice(0, 5).map((repo) => (
                    <Card 
                      key={repo.id}
                      className="bg-black border-gray-700 hover:border-gray-600 transition-all cursor-pointer"
                      style={{ backgroundColor: 'rgb(26 26 26)' }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                              <Github className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-white truncate">{repo.name}</h3>
                              </div>
                              <div className="text-sm text-gray-400 truncate">{repo.full_name}</div>
                              {repo.description && (
                                <div className="text-xs text-gray-500 truncate mt-1">{repo.description}</div>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleCreateProject(repo)}
                            disabled={creatingRepoId === repo.id}
                            className="text-white"
                            style={{ backgroundColor: colors.primary }}
                          >
                            {creatingRepoId === repo.id ? 'Creating...' : 'Import'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Half: CLI and Package.json */}
          <div className="space-y-6">
            {/* Top Quarter: CLI */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: colors.background.card }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primaryBubble }}>
                  <Terminal className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Create with CLI</h3>
                  <p className="text-gray-400 text-sm">Run commands from your terminal</p>
                </div>
              </div>
              
              {/* CLI Commands */}
              <div className="space-y-3">
                <div className="bg-gray-800 rounded-lg p-3 relative group" style={{ backgroundColor: 'rgb(26 26 26)' }}>
                  <code className="text-gray-300 text-sm">npm i -g deply-cli</code>
                  <button 
                    onClick={() => handleCopy('npm i -g deply-cli', 'npm-install')}
                    className="absolute opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ top: '15px', right: '15px' }}
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
                <div className="bg-gray-800 rounded-lg p-3 relative group" style={{ backgroundColor: 'rgb(26 26 26)' }}>
                  <code className="text-gray-300 text-sm">deply init</code>
                  <button 
                    onClick={() => handleCopy('deply init', 'deply-init')}
                    className="absolute opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ top: '15px', right: '15px' }}
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

            {/* Bottom Quarter: Package.json Upload */}
            <div className="p-6 rounded-lg flex flex-col" style={{ backgroundColor: colors.background.card, height: '400px' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primaryBubble }}>
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Create with package.json</h3>
                  <p className="text-gray-400 text-sm">Never share your repo's code</p>
                </div>
              </div>
              
              {/* File Upload Dropzone */}
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 hover:border-gray-500 transition-colors flex-1 flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="package-json-upload"
                />
                <label htmlFor="package-json-upload" className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-lg text-gray-400 mb-2">Click to upload package.json</div>
                  <div className="text-sm text-gray-500">or drag and drop</div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
