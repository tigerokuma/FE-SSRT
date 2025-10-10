"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Github, GitBranch, Package, Plus } from "lucide-react"
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

interface GitHubBranch {
  name: string
  protected: boolean
}

export default function NewProjectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [branches, setBranches] = useState<GitHubBranch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('main')
  const [projectName, setProjectName] = useState<string>('')
  const [selectedFramework, setSelectedFramework] = useState<string>('other')
  const [selectedLicense, setSelectedLicense] = useState<string>('MIT')
  const [collaborationEnabled, setCollaborationEnabled] = useState<boolean>(false)
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [repository, setRepository] = useState<GitHubRepository | null>(null)
  const [showLicense, setShowLicense] = useState<boolean>(false)
  const { toast } = useToast()

  useEffect(() => {
    const repoParam = searchParams.get('repo')
    if (repoParam) {
      try {
        const repoData = JSON.parse(decodeURIComponent(repoParam))
        setRepository(repoData)
        setProjectName(repoData.name)
        fetchBranches(repoData.full_name)
      } catch (error) {
        console.error('Error parsing repository data:', error)
        router.push('/create-project')
      }
    } else {
      router.push('/create-project')
    }
  }, [searchParams, router])

  const fetchBranches = async (repoFullName: string) => {
    try {
      const response = await fetch(`http://localhost:3000/github/repositories/${repoFullName}/branches`)
      if (response.ok) {
        const branchesData = await response.json()
        setBranches(branchesData)
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const frameworks = [
    { value: 'other', label: 'Other', icon: '/Deply_Logo.png' },
    { value: 'nodejs', label: 'Node.js', icon: '/Node_logo.png' },
    { value: 'python', label: 'Python', icon: '/Python_logo.png' },
    { value: 'java', label: 'Java', icon: '/Java_logo.png' },
    { value: 'rust', label: 'Rust', icon: '/Rust_logo.png' },
    { value: 'go', label: 'Go', icon: '/Go_logo.png' },
    { value: 'ruby', label: 'Ruby', icon: '/Ruby_logo.png' }
  ]

  const licenses = [
    { value: 'MIT', label: 'MIT License' },
    { value: 'Apache-2.0', label: 'Apache 2.0' },
    { value: 'GPL-3.0', label: 'GPL 3.0' },
    { value: 'BSD-3-Clause', label: 'BSD 3-Clause' },
    { value: 'ISC', label: 'ISC License' }
  ]

  const handleCreateProject = async () => {
    if (!repository) return
    
    setIsCreating(true)
    try {
      const response = await fetch('http://localhost:3000/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName || repository.name,
          description: repository.description,
          repositoryUrl: repository.html_url,
          branch: selectedBranch,
          framework: selectedFramework,
          license: selectedLicense,
          collaborationEnabled,
          userId: 'user-123'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
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

  if (!repository) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.main }}>
        <div className="text-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background.main, maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
      <div className="container mx-auto px-6 py-8">
        {/* Main Configuration Card */}
        <div className="w-full mt-8">
          <Card style={{ backgroundColor: colors.background.card }}>
            <CardContent className="p-8">
              {/* Header inside card */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">New Project</h1>
                <p className="text-gray-400 mt-2">
                  Configure your project settings
                </p>
              </div>

              <div className="space-y-8">
                  {/* Project Name */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Project Name</h3>
                    <Input
                      placeholder={repository.name}
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="border-gray-700 text-white placeholder-gray-400"
                      style={{ backgroundColor: 'rgb(26, 26, 26)' }}
                    />
                  </div>

                  {/* Repository Info */}
                  <div>
                    <div className="rounded-lg p-4" style={{ backgroundColor: 'rgb(26, 26, 26)' }}>
                      <div className="flex items-center gap-3 mb-4">
                        <Github className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-white font-medium">{repository.name}</div>
                          <div className="text-sm text-gray-400">{repository.full_name}</div>
                        </div>
                      </div>
                      <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                        <SelectTrigger className="border-gray-700 text-white" style={{ backgroundColor: 'rgb(26, 26, 26)' }}>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.length > 0 ? (
                            branches.map((branch) => (
                              <SelectItem key={branch.name} value={branch.name}>
                                {branch.name}
                              </SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="main">main</SelectItem>
                              <SelectItem value="develop">develop</SelectItem>
                              <SelectItem value="master">master</SelectItem>
                              <SelectItem value="staging">staging</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>


                  {/* License Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">License</h3>
                      <Switch
                        checked={showLicense}
                        onCheckedChange={setShowLicense}
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
                  {/* Framework Selection */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Framework</h3>
                    <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                      <SelectTrigger className="border-gray-700 text-white" style={{ backgroundColor: 'rgb(26, 26, 26)' }}>
                        <SelectValue placeholder="Select framework" />
                      </SelectTrigger>
                      <SelectContent>
                        {frameworks.map((framework) => (
                          <SelectItem key={framework.value} value={framework.value}>
                            <div className="flex items-center gap-2">
                              <img src={framework.icon} alt={framework.label} className="w-4 h-4" />
                              {framework.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Packages Detected */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primaryBubble }}>
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Packages Detected</h3>
                          <p className="text-gray-400 text-sm">Dependencies found in your project</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">47</div>
                        <div className="text-sm text-gray-400">packages currently detected</div>
                      </div>
                    </div>
                  </div>

                  {/* Create Project Button */}
                  <div className="pt-4">
                    <Button
                      onClick={handleCreateProject}
                      disabled={isCreating}
                      className="w-full text-white text-lg py-6"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {isCreating ? 'Creating Project...' : 'Create Project'}
                    </Button>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
