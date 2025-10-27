'use client'
import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export function useIngestGithubFromClerk(
  userIdInBackend?: string,
  apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'
) {
  const { user, isLoaded, isSignedIn } = useUser()

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || !userIdInBackend) return
    const hasGithub = user.externalAccounts?.some((ea) => {
      const p = String((ea as any).provider).toLowerCase()
      return p === 'github' || p === 'oauth_github'
    })
    if (!hasGithub) return

    fetch(`${apiBase}/users/${userIdInBackend}/ingest-clerk-github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerk_id: user.id }),
      credentials: 'include',
    }).catch(console.error)
  }, [isLoaded, isSignedIn, user, userIdInBackend, apiBase])
}
