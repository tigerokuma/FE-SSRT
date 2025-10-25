'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

export default function JoinProjectPage() {
  const params = useParams()
  const router = useRouter()

  // ✅ API base + Clerk user
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  const { user, isLoaded } = useUser()
  const computedBackendUserId =
    (user?.publicMetadata as any)?.backendUserId ?? user?.id ?? null

  // ✅ local state
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [backendUserId, setBackendUserId] = useState<string | null>(null)

  const projectId = params.projectId as string

  // Keep a stable copy in state once Clerk is ready
  useEffect(() => {
    if (isLoaded) {
      setBackendUserId(computedBackendUserId)
    }
  }, [isLoaded, computedBackendUserId])

  useEffect(() => {
    const joinProject = async () => {
      try {
        setStatus('loading')
        setMessage('Joining project...')

        if (!projectId) {
          throw new Error('Missing project id')
        }
        if (!isLoaded) {
          // Clerk not ready yet — stop here and this effect will rerun
          return
        }
        if (!backendUserId) {
          throw new Error('No authenticated user available')
        }

        // If your controller accepts userId in the body, send it along.
        // (If not yet wired, backend will ignore the body safely.)
        const response = await fetch(`${apiBase}/projects/${projectId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: backendUserId }),
        })

        if (!response.ok) {
          const text = await response.text().catch(() => '')
          throw new Error(`Failed to join project: ${response.status} ${text}`)
        }

        await response.json().catch(() => ({}))
        setStatus('success')
        setMessage('Successfully joined the project!')

        // Redirect to project page after 2 seconds
        setTimeout(() => {
          router.push(`/project/${projectId}`)
        }, 2000)
      } catch (error) {
        console.error('Error joining project:', error)
        setStatus('error')
        setMessage('Failed to join project. Please try again.')
      }
    }

    // Only try when we have a projectId and Clerk has loaded
    if (projectId && isLoaded) {
      // If user is missing after Clerk load, show error state
      if (!backendUserId) {
        setStatus('error')
        setMessage('You must be signed in to join this project.')
        return
      }
      joinProject()
    }
  }, [projectId, isLoaded, backendUserId, apiBase, router])

  const handleRedirect = () => {
    router.push(`/project/${projectId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/50 border-gray-800 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-white text-xl">Joining Project</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto" />
              <p className="text-gray-300">
                {!isLoaded ? 'Checking your session...' : message}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-green-400 font-medium">{message}</p>
              <p className="text-gray-400 text-sm">Redirecting to project page...</p>
              <Button
                onClick={handleRedirect}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Go to Project
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="text-red-400 font-medium">{message}</p>
              <Button
                onClick={handleRedirect}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
