import { useEffect, useState } from "react"
import { Star, Download, ExternalLink, Loader2, Users, GitFork, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Package as PackageType } from '../../lib/watchlist/types'
import { formatNumber, formatDate } from '../../lib/watchlist/utils'
import { getPackageDetails } from '../../lib/packages/api'

interface WatchlistPreviewPanelProps {
  isOpen: boolean
  package: PackageType | null
  type: 'npm' | 'github'
  onClose: () => void
  className?: string
}

export function WatchlistPreviewPanel({ 
  isOpen, 
  package: pkg, 
  type, 
  onClose,
  className 
}: WatchlistPreviewPanelProps) {
  const [detailedPackage, setDetailedPackage] = useState<PackageType | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  // Fetch detailed package info when preview opens
  useEffect(() => {
    if (!isOpen || !pkg) {
      setDetailedPackage(null)
      setDetailsError(null)
      return
    }

    // Show search data immediately
    setDetailedPackage(pkg)
    setIsLoadingDetails(true)
    setDetailsError(null)

    const fetchDetailedInfo = async () => {
      try {
        // Use the new safer API that returns a result object
        const result = await getPackageDetails(pkg.name, 'details')
        
        if (result.success) {
          // Enhance with detailed information
          setDetailedPackage(result.data)
        } else {
          // Handle different error types with specific messages
          const errorMessage = result.errorType === 'not_found' 
            ? 'Additional package details not available'
            : result.errorType === 'network'
            ? 'Network error loading additional details'
            : 'Unable to load additional information'
            
          setDetailsError(errorMessage)
          // Keep using search data
        }
      } catch (error) {
        console.error('Unexpected error fetching detailed package info:', error)
        setDetailsError('Failed to load additional details')
        // Keep using search data
      } finally {
        setIsLoadingDetails(false)
      }
    }

    fetchDetailedInfo()
  }, [isOpen, pkg])

  // Handle keyboard shortcuts and body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !pkg) return null

  // Use detailed package info if available, otherwise fall back to summary
  const displayPackage = detailedPackage || pkg

  return (
    <div className={`fixed inset-0 z-50 bg-black/20 backdrop-blur-sm ${className}`} onClick={onClose}>
      <div 
        className="absolute right-0 top-0 h-full w-[600px] bg-background border-l shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${type === 'npm' ? 'bg-red-500' : 'bg-gray-800'}`} />
            <h3 className="font-semibold text-sm">
              {displayPackage.name} on {type === 'npm' ? 'NPM' : 'GitHub'}
            </h3>
            {isLoadingDetails && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => {
                const url = type === 'npm' ? displayPackage.npm_url : displayPackage.repo_url
                if (url) window.open(url, '_blank')
              }}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
            >
              ×
            </Button>
          </div>
        </div>

        {/* Rich Preview Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Error State */}
              {detailsError && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">{detailsError}</span>
                  </div>
                </div>
              )}

              {/* Package Header */}
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">{displayPackage.name}</h1>
                  {displayPackage.description && (
                    <p className="text-muted-foreground mt-2 leading-relaxed">
                      {displayPackage.description}
                    </p>
                  )}
                </div>
                {displayPackage.version && (
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    v{displayPackage.version}
                  </Badge>
                )}
              </div>

              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">Stars</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {displayPackage.stars !== null && displayPackage.stars !== undefined ? (
                      formatNumber(displayPackage.stars)
                    ) : isLoadingDetails ? (
                      <span className="flex items-center gap-2 text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Downloads</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {displayPackage.downloads !== null && displayPackage.downloads !== undefined ? (
                      formatNumber(displayPackage.downloads)
                    ) : isLoadingDetails ? (
                      <span className="flex items-center gap-2 text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </p>
                </div>
                
                {/* Forks - always show, with loading state */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <GitFork className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Forks</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {displayPackage.forks !== null && displayPackage.forks !== undefined ? (
                      formatNumber(displayPackage.forks)
                    ) : isLoadingDetails ? (
                      <span className="flex items-center gap-2 text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </p>
                </div>
                
                {/* Contributors - always show, with loading state */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Contributors</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {displayPackage.contributors !== null && displayPackage.contributors !== undefined ? (
                      formatNumber(displayPackage.contributors)
                    ) : isLoadingDetails ? (
                      <span className="flex items-center gap-2 text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Risk Score from details view */}
              {displayPackage.risk_score && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Risk Assessment</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          displayPackage.risk_score >= 80 ? 'bg-green-500' : 
                          displayPackage.risk_score >= 60 ? 'bg-yellow-500' : 
                          'bg-red-500'
                        }`}
                        style={{ width: `${displayPackage.risk_score}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{displayPackage.risk_score}/100</span>
                  </div>
                </div>
              )}

              {/* Package Info */}
              <div className="space-y-4">
                {displayPackage.license && (
                  <div>
                    <h3 className="font-medium mb-2">License</h3>
                    <Badge variant="secondary">{displayPackage.license}</Badge>
                  </div>
                )}

                {displayPackage.maintainers && displayPackage.maintainers.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Maintainers</h3>
                    <div className="flex flex-wrap gap-2">
                      {displayPackage.maintainers.map((maintainer: string, idx: number) => (
                        <Badge key={idx} variant="outline">{maintainer}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {displayPackage.keywords && displayPackage.keywords.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {displayPackage.keywords.map((keyword: string, idx: number) => (
                        <Badge key={idx} variant="outline">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {displayPackage.last_updated && (
                  <div>
                    <h3 className="font-medium mb-2">Last Updated</h3>
                    <p className="text-muted-foreground">{formatDate(displayPackage.last_updated)}</p>
                  </div>
                )}

                {displayPackage.homepage && (
                  <div>
                    <h3 className="font-medium mb-2">Homepage</h3>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm"
                      onClick={() => window.open(displayPackage.homepage, '_blank')}
                    >
                      {displayPackage.homepage}
                    </Button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {displayPackage.npm_url && (
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={() => window.open(displayPackage.npm_url, '_blank')}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                    View on NPM
                  </Button>
                )}
                {displayPackage.repo_url && (
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => window.open(displayPackage.repo_url, '_blank')}
                  >
                    <div className="w-2 h-2 rounded-full bg-gray-700 mr-2" />
                    View on GitHub
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
} 