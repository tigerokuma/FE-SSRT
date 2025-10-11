'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function JoinProjectPage() {
  const params = useParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const projectId = params.projectId as string

  useEffect(() => {
    const joinProject = async () => {
      try {
        setStatus('loading')
        setMessage('Joining project...')

        const response = await fetch(`http://localhost:3000/projects/${projectId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to join project')
        }

        const result = await response.json()
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

    if (projectId) {
      joinProject()
    }
  }, [projectId, router])

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
              <p className="text-gray-300">{message}</p>
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
