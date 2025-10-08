"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, X, Github, Star, GitFork } from "lucide-react"

interface CreateProjectDialogProps {
  trigger: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onProjectCreated?: () => void
}

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
}

export function CreateProjectDialog({ trigger, open, onOpenChange, onProjectCreated }: CreateProjectDialogProps) {
  const [projectName, setProjectName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null)
  const [selectedBranch, setSelectedBranch] = useState("main")
  const [repositories, setRepositories] = useState<GitHubRepository[]>([])
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const [branches, setBranches] = useState<any[]>([])
  const [isLoadingBranches, setIsLoadingBranches] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch repositories when dialog opens
  useEffect(() => {
    if (open) {
      fetchRepositories()
    }
  }, [open])

  // Fetch branches when repository is selected
  useEffect(() => {
    if (selectedRepo) {
      fetchBranches()
    }
  }, [selectedRepo])

  const fetchRepositories = async () => {
    setIsLoadingRepos(true)
    try {
      const response = await fetch('http://localhost:3000/github/repositories')
      if (response.ok) {
        const repos = await response.json()
        setRepositories(repos)
      } else {
        console.error('Failed to fetch repositories')
      }
    } catch (error) {
      console.error('Error fetching repositories:', error)
    } finally {
      setIsLoadingRepos(false)
    }
  }

  const fetchBranches = async () => {
    if (!selectedRepo) return
    
    setIsLoadingBranches(true)
    try {
      const response = await fetch(`http://localhost:3000/github/branches?repositoryUrl=${encodeURIComponent(selectedRepo.html_url)}`)
      if (response.ok) {
        const data = await response.json()
        setBranches(data)
        
        // Auto-select main or master branch if available
        const mainBranch = data.find((branch: any) => branch.name === 'main' || branch.name === 'master')
        if (mainBranch) {
          setSelectedBranch(mainBranch.name)
        } else if (data.length > 0) {
          setSelectedBranch(data[0].name)
        }
      } else {
        console.error('Failed to fetch branches')
        // Fallback to default branches
        setBranches([
          { name: 'main', protected: false },
          { name: 'master', protected: false },
          { name: 'develop', protected: false },
        ])
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
      // Fallback to default branches
      setBranches([
        { name: 'main', protected: false },
        { name: 'master', protected: false },
        { name: 'develop', protected: false },
      ])
    } finally {
      setIsLoadingBranches(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('http://localhost:3000/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          description,
          repositoryUrl: selectedRepo?.html_url || '',
          branch: selectedBranch,
          userId: 'user-123' // Hardcoded user ID as requested
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const newProject = await response.json()
      console.log("Project created successfully:", newProject)
      
      // Reset form
      setProjectName("")
      setDescription("")
      setSelectedRepo(null)
      setSelectedBranch("main")
      setBranches([])
      
      // Close dialog
      onOpenChange?.(false)
      
      // Notify parent component to refresh projects
      onProjectCreated?.()
    } catch (error) {
      console.error("Error creating project:", error)
      alert("Failed to create project. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setProjectName("")
    setDescription("")
    setSelectedRepo(null)
    setSelectedBranch("main")
    setBranches([])
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger}
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Create New Project</DialogTitle>
          <DialogDescription className="text-gray-400">
            Set up a new project to track dependencies and security insights.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name" className="text-white">
              Project Name *
            </Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description (optional)"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="repository-select" className="text-white">
              Select Repository
            </Label>
            {isLoadingRepos ? (
              <div className="flex items-center justify-center py-4">
                <div className="text-gray-400">Loading your repositories...</div>
              </div>
            ) : (
              <Select 
                value={selectedRepo?.id.toString() || ""} 
                onValueChange={(value) => {
                  const repo = repositories.find(r => r.id.toString() === value)
                  setSelectedRepo(repo || null)
                }}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Choose a repository from your GitHub account" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {repositories.map((repo) => (
                    <SelectItem key={repo.id} value={repo.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Github className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">{repo.name}</div>
                          <div className="text-sm text-gray-400">{repo.full_name}</div>
                          {repo.description && (
                            <div className="text-xs text-gray-500 truncate">{repo.description}</div>
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            {repo.language && <span>{repo.language}</span>}
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {repo.stargazers_count}
                            </div>
                            <div className="flex items-center gap-1">
                              <GitFork className="h-3 w-3" />
                              {repo.forks_count}
                            </div>
                            {repo.private && <span className="text-yellow-400">Private</span>}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedRepo && (
              <div className="text-sm text-gray-400">
                Selected: <span className="text-blue-400">{selectedRepo.full_name}</span>
              </div>
            )}
          </div>
          
          {selectedRepo && (
            <div className="space-y-2">
              <Label htmlFor="branch-select" className="text-white">
                Branch to Monitor
              </Label>
              {isLoadingBranches ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                  Loading branches...
                </div>
              ) : (
                <Select 
                  value={selectedBranch} 
                  onValueChange={setSelectedBranch}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Choose branch to monitor" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {branches.map((branch: any) => (
                      <SelectItem key={branch.name} value={branch.name}>
                        <div className="flex items-center gap-2">
                          {branch.name}
                          {branch.protected && (
                            <span className="text-xs text-yellow-400">🔒</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="text-xs text-gray-500">
                Only events from this branch will trigger analysis
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!projectName.trim() || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
