'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ExternalLink, Check, X, MessageSquare, User, Calendar, MoreHorizontal } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ReviewData {
  id: string
  name: string
  repo_url: string
  added_at: string
  status: string
  user: {
    user_id: string
    name: string
    email: string
  }
  approvals: Array<{
    id: string
    approved_at: string
    user: {
      user_id: string
      name: string
      email: string
    }
  }>
  disapprovals: Array<{
    id: string
    disapproved_at: string
    user: {
      user_id: string
      name: string
      email: string
    }
  }>
  comments: Array<{
    id: string
    comment: string
    created_at: string
    user: {
      user_id: string
      name: string
      email: string
    }
  }>
}

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const [reviewData, setReviewData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [submittingApproval, setSubmittingApproval] = useState(false)
  const [submittingDisapproval, setSubmittingDisapproval] = useState(false)

  const projectId = params.id as string
  const watchlistId = params.watchlistId as string

  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`http://localhost:3000/projects/watchlist/${watchlistId}/review`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch review data')
        }
        
        const data = await response.json()
        setReviewData(data)
      } catch (error) {
        console.error('Error fetching review data:', error)
        toast({
          title: "Error",
          description: "Failed to load review data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (watchlistId) {
      fetchReviewData()
    }
  }, [watchlistId])

  const handleSubmitComment = async () => {
    if (!comment.trim()) return

    try {
      setSubmittingComment(true)
      const response = await fetch(`http://localhost:3000/projects/watchlist/${watchlistId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user-123',
          comment: comment.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit comment')
      }

      // Refresh review data
      const reviewResponse = await fetch(`http://localhost:3000/projects/watchlist/${watchlistId}/review`)
      if (reviewResponse.ok) {
        const data = await reviewResponse.json()
        setReviewData(data)
      }

      setComment('')
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully",
      })
    } catch (error) {
      console.error('Error submitting comment:', error)
      toast({
        title: "Error",
        description: "Failed to submit comment",
        variant: "destructive",
      })
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleApprove = async () => {
    try {
      setSubmittingApproval(true)
      const response = await fetch(`http://localhost:3000/projects/watchlist/${watchlistId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user-123',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to approve')
      }

      // Refresh review data
      const reviewResponse = await fetch(`http://localhost:3000/projects/watchlist/${watchlistId}/review`)
      if (reviewResponse.ok) {
        const data = await reviewResponse.json()
        setReviewData(data)
      }

      toast({
        title: "Approved",
        description: "You have approved this package",
      })
    } catch (error) {
      console.error('Error approving:', error)
      toast({
        title: "Error",
        description: "Failed to approve package",
        variant: "destructive",
      })
    } finally {
      setSubmittingApproval(false)
    }
  }

  const handleDisapprove = async () => {
    try {
      setSubmittingDisapproval(true)
      const response = await fetch(`http://localhost:3000/projects/watchlist/${watchlistId}/disapprove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user-123',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to disapprove')
      }

      // Refresh review data
      const reviewResponse = await fetch(`http://localhost:3000/projects/watchlist/${watchlistId}/review`)
      if (reviewResponse.ok) {
        const data = await reviewResponse.json()
        setReviewData(data)
      }

      toast({
        title: "Disapproved",
        description: "You have disapproved this package",
      })
    } catch (error) {
      console.error('Error disapproving:', error)
      toast({
        title: "Error",
        description: "Failed to disapprove package",
        variant: "destructive",
      })
    } finally {
      setSubmittingDisapproval(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <div className="text-gray-400">Loading review...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!reviewData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <div className="text-gray-400">Review not found</div>
          </div>
        </div>
      </div>
    )
  }

  const approvalCount = reviewData.approvals.length
  const disapprovalCount = reviewData.disapprovals.length
  const pendingCount = 1 // You can calculate this based on your logic

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">{reviewData.name}</h1>
              <p className="text-gray-400">Package Review</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Full Details
            </Button>
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Package Metrics */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Risk Score: 7/10
          </Badge>
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Vulnerabilities: 5
          </Badge>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Health Score: 85%
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Status: Active
          </Badge>
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            License: MIT
          </Badge>
        </div>

        {/* Review Status */}
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Pending Review</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 font-medium">{approvalCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-400" />
                  <span className="text-red-400 font-medium">{disapprovalCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">-</span>
                  <span className="text-gray-400 font-medium">{pendingCount}</span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(approvalCount / (approvalCount + disapprovalCount + pendingCount)) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-white">Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              {reviewData.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-4 bg-gray-800/50 rounded-lg">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-medium">{comment.user.name}</span>
                      <span className="text-gray-400 text-sm">{formatDate(comment.created_at)}</span>
                    </div>
                    <p className="text-gray-300">{comment.comment}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <div className="space-y-4">
              <Textarea
                placeholder="Leave a comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!comment.trim() || submittingComment}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submittingComment ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={handleApprove}
            disabled={submittingApproval || submittingDisapproval}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
          >
            <Check className="mr-2 h-5 w-5" />
            {submittingApproval ? 'Approving...' : 'Approve'}
          </Button>
          <Button
            onClick={handleDisapprove}
            disabled={submittingApproval || submittingDisapproval}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
          >
            <X className="mr-2 h-5 w-5" />
            {submittingDisapproval ? 'Disapproving...' : 'Disapprove'}
          </Button>
        </div>
      </div>
    </div>
  )
}
