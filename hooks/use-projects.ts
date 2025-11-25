"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
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
  type?: "repo" | "file" | "cli"
  language?: string
  license?: string | null
}

export function useProjects() {
  // always go through our Next.js proxy (adds Clerk JWT)
  const apiBase = "/api/backend";
  const { user, isLoaded } = useUser()
  const backendUserId =
    (user?.publicMetadata as any)?.backendUserId ?? user?.id ?? null

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    // Don’t attempt until Clerk is ready
    if (!isLoaded) return
    if (!backendUserId) {
      setLoading(false)
      setError("No authenticated user")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Use plain fetch - the /api/backend proxy automatically adds Clerk JWT token
      const response = await fetch(
        `${apiBase}/projects/user/${backendUserId}`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`)
      }

      const data = (await response.json()) as Project[]
      setProjects(data)
      return data
    } catch (err) {
      console.error("Error fetching projects:", err)
      setError("Failed to load projects")
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiBase, backendUserId, isLoaded])

  const getProjectById = useCallback(
    (id: string): Project | undefined => projects.find((p) => p.id === id),
    [projects]
  )

  useEffect(() => {
    // Auto-fetch when the user becomes available
    fetchProjects()
  }, [fetchProjects])

  return {
    projects,
    loading,
    error,
    fetchProjects,
    getProjectById,
    backendUserId,
    isUserLoaded: isLoaded,
  }
}
