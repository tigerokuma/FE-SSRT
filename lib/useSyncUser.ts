// lib/useSyncUser.ts (client)
'use client'

import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'

export function useSyncUser(apiBase = "/api/backend") {
  const { user, isLoaded, isSignedIn } = useUser()
  const did = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || did.current) return
    if (!user) return

    did.current = true

    const clerk_user_id = user.id
    const email = user.primaryEmailAddress?.emailAddress ?? ''
    const name =
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      undefined

    fetch(`${apiBase}/users/sync-from-clerk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerk_user_id, email, name }),
      credentials: 'include',
    }).catch(console.error)
  }, [isLoaded, isSignedIn, user, apiBase])
}
