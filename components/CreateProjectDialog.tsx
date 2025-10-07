"use client"

import { useState } from "react"
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
import { Plus, X } from "lucide-react"

interface CreateProjectDialogProps {
  trigger: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onProjectCreated?: () => void
}

export function CreateProjectDialog({ trigger, open, onOpenChange, onProjectCreated }: CreateProjectDialogProps) {
  const [projectName, setProjectName] = useState("")
  const [description, setDescription] = useState("")
  const [repositoryUrl, setRepositoryUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
          repositoryUrl,
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
      setRepositoryUrl("")
      
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
    setRepositoryUrl("")
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
            <Label htmlFor="repository-url" className="text-white">
              Repository URL
            </Label>
            <Input
              id="repository-url"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              type="url"
            />
          </div>
          
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
