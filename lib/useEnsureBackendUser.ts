// lib/useEnsureBackendUser.ts
'use client'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

export function useEnsureBackendUser(
  // always go through our Next.js proxy (adds Clerk JWT)
  apiBase = "/api/backend"
) {
  const { user, isLoaded, isSignedIn } = useUser()
  const [backendUserId, setBackendUserId] = useState<string | undefined>()
  const [isEnsured, setIsEnsured] = useState(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return
    ;(async () => {
      try {
        const res = await fetch(`${apiBase}/users/sync-from-clerk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            clerk_id: user.id, // ⬅️ keep this name aligned with your backend DTO
            email: user.primaryEmailAddress?.emailAddress,
            name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || undefined,
          }),
        })
        if (!res.ok) {
          console.error('sync-from-clerk failed', await res.text())
          return
        }
        const payload = await res.json()
        setBackendUserId(payload?.user_id)
        setIsEnsured(true)
      } catch (e) {
        console.error('sync-from-clerk error', e)
      }
    })()
  }, [isLoaded, isSignedIn, user, apiBase])

  return { backendUserId, isEnsured }
}
