"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Github, ArrowLeft, FileText, Terminal, Upload, X, Package } from "lucide-react"
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
  
  // File drop zone state
  const [isFileDropped, setIsFileDropped] = useState(false)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const [projectName, setProjectName] = useState('')
  const [selectedLicense, setSelectedLicense] = useState('MIT')
  const [packageData, setPackageData] = useState<any>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [showLicense, setShowLicense] = useState(false)
  
  const { toast } = useToast()

  // License options
  const licenses = [
    { value: 'MIT', label: 'MIT License' },
    { value: 'Apache-2.0', label: 'Apache 2.0' },
    { value: 'GPL-3.0', label: 'GPL 3.0' },
    { value: 'BSD-3-Clause', label: 'BSD 3-Clause' },
    { value: 'ISC', label: 'ISC License' }
  ]

  useEffect(() => {
    fetchRepositories()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = repositories.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
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

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      toast({
        title: "Invalid File",
        description: "Please select a valid JSON file.",
        variant: "destructive",
      })
      return
    }

    setIsProcessingFile(true)
    setDroppedFile(file)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:3000/github/parse-package-json', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setPackageData(data)
        setProjectName(data.name || '')
        setIsFileDropped(true)
        
        toast({
          title: "File Processed",
          description: `Successfully parsed ${file.name}`,
        })
      } else {
        throw new Error('Failed to parse file')
      }
    } catch (error) {
      console.error('Error processing file:', error)
      toast({
        title: "Error",
        description: "Failed to process the file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingFile(false)
    }
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleClearFile = () => {
    setIsFileDropped(false)
    setDroppedFile(null)
    setPackageData(null)
    setProjectName('')
    setSelectedLicense('MIT')
    setShowLicense(false)
  }

  const handleCreateProjectFromFile = async () => {
    if (!packageData) return

    setIsCreating(true)
    try {
      const response = await fetch('http://localhost:3000/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          description: packageData.description || '',
          // Don't send repositoryUrl or branch for file uploads
          type: 'file', // File upload type
          language: 'nodejs', // Always nodejs for package.json
          license: showLicense ? selectedLicense : null, // Pass license if toggle is on, null if off
          userId: 'user-123',
          packageData: packageData
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Project creation failed:', response.status, errorText)
        throw new Error(`Failed to create project: ${response.status} - ${errorText}`)
      }

      const newProject = await response.json()
      console.log("Project created successfully:", newProject)
      
      toast({
        title: "Project Created!",
        description: "Your project is now being set up in the background.",
        duration: 5000,
      })

      // Navigate back to projects page
      router.push('/')
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
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

            {/* Bottom Quarter: Dependencies File Upload */}
            <div className="p-6 rounded-lg flex flex-col" style={{ backgroundColor: colors.background.card, height: '400px' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primaryBubble }}>
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Drop Dependencies File</h3>
                    <p className="text-gray-400 text-sm">Upload package.json or other dependency files</p>
                  </div>
                </div>
                {isFileDropped && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFile}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {!isFileDropped ? (
                /* File Upload Dropzone */
                <div 
                  className="border-2 border-dashed border-gray-600 rounded-lg p-6 hover:border-gray-500 transition-colors flex-1 flex flex-col items-center justify-center"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="package-json-upload"
                  />
                  <label htmlFor="package-json-upload" className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
                    {isProcessingFile ? (
                      <>
                        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-400 border-t-transparent mb-4"></div>
                        <div className="text-lg text-gray-400 mb-2">Processing file...</div>
                        <div className="text-sm text-gray-500">Please wait</div>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-gray-400 mb-4" />
                        <div className="text-lg text-gray-400 mb-2">Click to upload package.json</div>
                        <div className="text-sm text-gray-500">or drag and drop</div>
                      </>
                    )}
                  </label>
                </div>
              ) : (
                /* Project Configuration Form */
                <div className="flex-1 flex flex-col space-y-6">
                  {/* Project Name */}
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-white">Project Name</h3>
                    <Input
                      placeholder="Enter project name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="border-gray-700 text-white placeholder-gray-400 flex-1"
                      style={{ backgroundColor: 'rgb(26, 26, 26)' }}
                    />
                  </div>

                  {/* License Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">License</h3>
                      <Switch
                        checked={showLicense}
                        onCheckedChange={setShowLicense}
                        className="data-[state=checked]:bg-[rgb(84,0,250)]"
                      />
                    </div>
                    {showLicense && (
                      <Select value={selectedLicense} onValueChange={setSelectedLicense}>
                        <SelectTrigger className="border-gray-700 text-white" style={{ backgroundColor: 'rgb(26, 26, 26)' }}>
                          <SelectValue placeholder="Select license" />
                        </SelectTrigger>
                        <SelectContent>
                          {licenses.map((license) => (
                            <SelectItem key={license.value} value={license.value}>
                              {license.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Package Info */}
                  {packageData && (
                    <div className="my-2" style={{ marginTop: '15px' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primaryBubble }}>
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Dependencies</h3>
                          <p className="text-gray-400 text-sm">
                            {packageData.dependencyCount || 0} packages detected
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}
              
              {/* Create Project Button - Outside the form section */}
              {isFileDropped && (
                <div className="pt-4">
                  <Button
                    onClick={handleCreateProjectFromFile}
                    disabled={isCreating || !projectName.trim()}
                    className="w-full text-white py-6"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Creating Project...
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
