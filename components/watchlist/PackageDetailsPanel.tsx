"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, Download, Plus, Star, GitFork, Users, Calendar, Shield, ExternalLink, Globe, Package, AlertCircle, CheckCircle, XCircle, Eye, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { Package as PackageType } from '../../lib/watchlist/types'
import { formatNumber } from '../../lib/watchlist/index'
import { getPackageDetailsWithFull } from '../../lib/watchlist/api'

interface PackageDetailsPanelProps {
  pkg: PackageType | null
  onClose: () => void
  onAdd: (pkg: PackageType) => void
  isAdding?: boolean
}

export function PackageDetailsPanel({ pkg, onClose, onAdd, isAdding }: PackageDetailsPanelProps) {
  const [detailedPkg, setDetailedPkg] = useState<PackageType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (pkg) {
      setIsLoading(true)
      setError(null)
      
      getPackageDetailsWithFull(pkg.name)
        .then(setDetailedPkg)
        .catch((err) => {
          console.error('Error fetching package details:', err)
          setError('Failed to load detailed package information')
          setDetailedPkg(pkg) // Fallback to basic package info
        })
        .finally(() => setIsLoading(false))
    }
  }, [pkg])

  if (!pkg) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center max-w-sm">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
              <Eye className="h-10 w-10 text-gray-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <Search className="h-3 w-3 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Package Details</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Select a package from the search results to view comprehensive information, risk assessments, and community metrics.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Package className="h-8 w-8 text-white" />
            </div>
            <Loader2 className="absolute inset-0 w-16 h-16 animate-spin text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Loading Package Details</h3>
          <p className="text-gray-400 text-sm">Fetching comprehensive information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="relative mb-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Unable to Load Details</h3>
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <p className="text-gray-400 text-xs mb-4">
            Don't worry! You can still add this package to your watchlist with basic information.
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={() => onAdd(pkg)}
              disabled={isAdding}
              size="sm"
              className="bg-white text-black hover:bg-gray-100"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Anyway
                </>
              )}
            </Button>
            <Button 
              onClick={() => onClose()}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const displayPkg = detailedPkg || pkg
  
  const getRiskColor = (score?: number) => {
    if (!score) return 'gray'
    if (score >= 80) return 'green'
    if (score >= 60) return 'yellow'
    return 'red'
  }

  const getRiskLevel = (score?: number) => {
    if (!score) return 'Unknown'
    if (score >= 80) return 'Low Risk'
    if (score >= 60) return 'Medium Risk'
    return 'High Risk'
  }

  const getRiskDescription = (score?: number) => {
    if (!score) return 'Risk assessment data not available'
    if (score >= 80) return 'Well maintained with active development and good security practices'
    if (score >= 60) return 'Moderately maintained - review recommended before adoption'
    return 'Requires careful evaluation - consider alternatives or additional security measures'
  }

  const riskColor = getRiskColor(displayPkg.risk_score)

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white truncate">{displayPkg.name}</h2>
                <p className="text-gray-400 text-sm">NPM Package</p>
              </div>
            </div>
            {displayPkg.description ? (
              <p className="text-gray-300 leading-relaxed line-clamp-2">{displayPkg.description}</p>
            ) : (
              <p className="text-gray-500 italic">No description available</p>
            )}
          </div>
          <Button
            onClick={() => onAdd(displayPkg)}
            disabled={isAdding}
            className="bg-white text-black hover:bg-gray-100 font-medium shadow-lg ml-4"
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add to Watchlist
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1 px-6">
        <div className="py-6 space-y-6">
          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl p-4 text-center border border-gray-700">
              <div className="w-8 h-8 mx-auto mb-3 rounded-lg bg-purple-900 flex items-center justify-center">
                <Download className="h-4 w-4 text-purple-300" />
              </div>
              <div className="text-lg font-bold text-white">
                {displayPkg.downloads ? formatNumber(displayPkg.downloads) : 'N/A'}
              </div>
              <div className="text-xs text-gray-400">Downloads/Week</div>
            </div>
            
            {displayPkg.stars !== undefined ? (
              <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl p-4 text-center border border-gray-700">
                <div className="w-8 h-8 mx-auto mb-3 rounded-lg bg-yellow-900 flex items-center justify-center">
                  <Star className="h-4 w-4 text-yellow-300" />
                </div>
                <div className="text-lg font-bold text-white">{formatNumber(displayPkg.stars)}</div>
                <div className="text-xs text-gray-400">GitHub Stars</div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl p-4 text-center border border-gray-700 opacity-50">
                <div className="w-8 h-8 mx-auto mb-3 rounded-lg bg-gray-700 flex items-center justify-center">
                  <Star className="h-4 w-4 text-gray-500" />
                </div>
                <div className="text-lg font-bold text-gray-500">N/A</div>
                <div className="text-xs text-gray-500">GitHub Stars</div>
              </div>
            )}
            
            {displayPkg.forks !== undefined ? (
              <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl p-4 text-center border border-gray-700">
                <div className="w-8 h-8 mx-auto mb-3 rounded-lg bg-blue-900 flex items-center justify-center">
                  <GitFork className="h-4 w-4 text-blue-300" />
                </div>
                <div className="text-lg font-bold text-white">{formatNumber(displayPkg.forks)}</div>
                <div className="text-xs text-gray-400">Forks</div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl p-4 text-center border border-gray-700 opacity-50">
                <div className="w-8 h-8 mx-auto mb-3 rounded-lg bg-gray-700 flex items-center justify-center">
                  <GitFork className="h-4 w-4 text-gray-500" />
                </div>
                <div className="text-lg font-bold text-gray-500">N/A</div>
                <div className="text-xs text-gray-500">Forks</div>
              </div>
            )}
            
            {displayPkg.contributors !== undefined ? (
              <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl p-4 text-center border border-gray-700">
                <div className="w-8 h-8 mx-auto mb-3 rounded-lg bg-green-900 flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-300" />
                </div>
                <div className="text-lg font-bold text-white">{formatNumber(displayPkg.contributors)}</div>
                <div className="text-xs text-gray-400">Contributors</div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl p-4 text-center border border-gray-700 opacity-50">
                <div className="w-8 h-8 mx-auto mb-3 rounded-lg bg-gray-700 flex items-center justify-center">
                  <Users className="h-4 w-4 text-gray-500" />
                </div>
                <div className="text-lg font-bold text-gray-500">N/A</div>
                <div className="text-xs text-gray-500">Contributors</div>
              </div>
            )}
          </div>

          {/* Enhanced Risk Assessment */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-400" />
                Risk Assessment
              </h3>
              {displayPkg.risk_score ? (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  riskColor === 'green' ? 'bg-green-900 text-green-300 border border-green-800' :
                  riskColor === 'yellow' ? 'bg-yellow-900 text-yellow-300 border border-yellow-800' :
                  'bg-red-900 text-red-300 border border-red-800'
                }`}>
                  {riskColor === 'green' ? <CheckCircle className="h-4 w-4" /> :
                   riskColor === 'yellow' ? <AlertCircle className="h-4 w-4" /> :
                   <XCircle className="h-4 w-4" />}
                  {displayPkg.risk_score}/100
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-700 text-gray-400 border border-gray-600">
                  <AlertCircle className="h-4 w-4" />
                  Not Available
                </div>
              )}
            </div>
            
            {displayPkg.risk_score ? (
              <>
                <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      riskColor === 'green' ? 'bg-gradient-to-r from-green-600 to-green-500' :
                      riskColor === 'yellow' ? 'bg-gradient-to-r from-yellow-600 to-yellow-500' :
                      'bg-gradient-to-r from-red-600 to-red-500'
                    }`}
                    style={{ width: `${displayPkg.risk_score}%` }}
                  />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-white mb-1">{getRiskLevel(displayPkg.risk_score)}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">{getRiskDescription(displayPkg.risk_score)}</p>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                <p className="text-gray-400 text-sm">Risk assessment data is not available for this package.</p>
                <p className="text-gray-500 text-xs mt-1">Consider reviewing the package manually before adding.</p>
              </div>
            )}
          </div>

          <Separator className="bg-gray-700" />

          {/* Enhanced Package Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-400" />
              Package Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  <Package className="h-4 w-4 text-blue-400" />
                  <div className="flex-1">
                    <span className="text-sm text-gray-400">Version</span>
                    <div className="font-mono text-sm text-white">
                      {displayPkg.version || <span className="text-gray-500 italic">Not specified</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  <Shield className="h-4 w-4 text-green-400" />
                  <div className="flex-1">
                    <span className="text-sm text-gray-400">License</span>
                    <div className="text-sm text-white">
                      {displayPkg.license || <span className="text-gray-500 italic">Not specified</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <div className="flex-1">
                    <span className="text-sm text-gray-400">Published</span>
                    <div className="text-sm text-white">
                      {displayPkg.published || <span className="text-gray-500 italic">Not available</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  <Calendar className="h-4 w-4 text-yellow-400" />
                  <div className="flex-1">
                    <span className="text-sm text-gray-400">Last Updated</span>
                    <div className="text-sm text-white">
                      {displayPkg.last_updated || <span className="text-gray-500 italic">Not available</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {displayPkg.maintainers && displayPkg.maintainers.length > 0 ? (
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-cyan-400" />
                      <span className="text-sm text-gray-400">Maintainers</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {displayPkg.maintainers.map((maintainer, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded-lg">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {maintainer.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-300">{maintainer}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-800 rounded-lg opacity-50">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">Maintainers</span>
                    </div>
                    <p className="text-gray-500 text-sm italic">No maintainer information available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Keywords */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Keywords</h3>
            {displayPkg.keywords && displayPkg.keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {displayPkg.keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors">
                    {keyword}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-800 rounded-lg">
                <p className="text-gray-500 text-sm italic">No keywords available</p>
              </div>
            )}
          </div>

          <Separator className="bg-gray-700" />

          {/* Enhanced External Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-gray-400" />
              External Links
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayPkg.npm_url ? (
                <a
                  href={displayPkg.npm_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-900 to-red-800 rounded-lg hover:from-red-800 hover:to-red-700 transition-all"
                >
                  <Package className="h-5 w-5 text-red-300" />
                  <div className="flex-1">
                    <div className="font-medium text-red-200">NPM Package</div>
                    <div className="text-xs text-red-300">View on npm registry</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-red-400" />
                </a>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg opacity-50">
                  <Package className="h-5 w-5 text-gray-500" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-500">NPM Package</div>
                    <div className="text-xs text-gray-600">Link not available</div>
                  </div>
                </div>
              )}
              
              {displayPkg.repo_url ? (
                <a
                  href={displayPkg.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg hover:from-gray-700 hover:to-gray-600 transition-all"
                >
                  <Github className="h-5 w-5 text-gray-300" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-200">GitHub Repository</div>
                    <div className="text-xs text-gray-400">View source code</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg opacity-50">
                  <Github className="h-5 w-5 text-gray-500" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-500">GitHub Repository</div>
                    <div className="text-xs text-gray-600">Link not available</div>
                  </div>
                </div>
              )}
              
              {displayPkg.homepage ? (
                <a
                  href={displayPkg.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg hover:from-blue-800 hover:to-blue-700 transition-all"
                >
                  <Globe className="h-5 w-5 text-blue-300" />
                  <div className="flex-1">
                    <div className="font-medium text-blue-200">Homepage</div>
                    <div className="text-xs text-blue-300">Official website</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-blue-400" />
                </a>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg opacity-50">
                  <Globe className="h-5 w-5 text-gray-500" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-500">Homepage</div>
                    <div className="text-xs text-gray-600">Link not available</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
} 