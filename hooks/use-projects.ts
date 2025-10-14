"use client"

import { useState, useEffect } from "react"
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
  type?: 'repo' | 'file' | 'cli'
  language?: string
  license?: string | null
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await AuthService.fetchWithAuth('http://localhost:3000/projects/user/user-123')
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      
      const data = await response.json()
      setProjects(data)
      return data
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError('Failed to load projects')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getProjectById = (id: string): Project | undefined => {
    return projects.find(project => project.id === id)
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return {
    projects,
    loading,
    error,
    fetchProjects,
    getProjectById
  }
}
