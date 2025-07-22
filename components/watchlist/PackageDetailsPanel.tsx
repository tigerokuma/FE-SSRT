"use client"

import { useState, useEffect } from "react"
import { Loader2, Download, Plus, Star, GitFork, Users, Calendar, Shield, ExternalLink, Globe, Package, AlertCircle, CheckCircle, XCircle, Eye, Github, Award, Activity, Clock, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { Package as PackageType } from '../../lib/watchlist/types'
import { formatNumber } from '../../lib/watchlist/index'
import { getPackageDetailsSafe } from '../../lib/watchlist/api'

interface PackageDetailsPanelProps {
  pkg: PackageType | null
  onClose: () => void
  onAdd: (pkg: PackageType) => void
  onAddWithConfig?: (pkg: PackageType) => void
  isAdding?: boolean
}

export function PackageDetailsPanel({ pkg, onClose, onAdd, onAddWithConfig, isAdding }: PackageDetailsPanelProps) {
  const [detailedPkg, setDetailedPkg] = useState<PackageType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (pkg) {
      // Show the search data immediately
      setDetailedPkg(pkg)
      setIsLoading(true)
      setError(null)
      
      // Fetch detailed info in the background
      getPackageDetailsSafe(pkg.name, 'details')
        .then((result) => {
          if (result) {
            // Enhance with detailed information
            setDetailedPkg(result)
          } else {
            setError('Unable to load additional package details')
            // Keep using search data
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [pkg])

  if (!pkg) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-xs">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gray-800 flex items-center justify-center mb-8">
            <Eye className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">
            Select a Package
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Choose a package from the search results to view comprehensive analytics, security insights, and community metrics.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-400">Loading package details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-700 flex items-center justify-center shadow-lg">
            <AlertCircle className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Failed to Load Details
          </h3>
          <p className="text-red-400 text-sm mb-4 leading-relaxed">
            {error}
          </p>
          <p className="text-gray-400 text-xs mb-6 leading-relaxed">
            You can still add this package with the available information, or try refreshing the details.
          </p>
          <div className="flex gap-3">
            <Button 
              onClick={() => onAdd(pkg)}
              disabled={isAdding}
              size="sm"
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3 mr-2" />
                  Add Package
                </>
              )}
            </Button>
            <Button 
              onClick={() => onClose()}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const displayPkg = detailedPkg || pkg
  
  const getRiskData = (score?: number) => {
    if (!score) return { level: 'Unknown', color: 'slate', description: 'Risk assessment unavailable' }
    if (score >= 85) return { 
      level: 'Excellent', 
      color: 'emerald', 
      description: 'Exceptional maintenance with robust security practices' 
    }
    if (score >= 70) return { 
      level: 'Good', 
      color: 'green', 
      description: 'Well maintained with good security practices' 
    }
    if (score >= 50) return { 
      level: 'Fair', 
      color: 'yellow', 
      description: 'Moderate maintenance - review recommended' 
    }
    return { 
      level: 'Poor', 
      color: 'red', 
      description: 'Requires careful evaluation before adoption' 
    }
  }

  const riskData = getRiskData(displayPkg.risk_score)

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-800 bg-gray-900">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-700 flex items-center justify-center shadow-lg flex-shrink-0">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white truncate">
                  {displayPkg.name}
                </h2>
                {displayPkg.version && (
                  <Badge variant="secondary" className="text-xs font-mono px-2 py-1">
                    v{displayPkg.version}
                  </Badge>
                )}
                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Loading details...</span>
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-3">
                NPM Package
              </p>
              {displayPkg.description ? (
                <p className="text-gray-300 leading-relaxed text-sm line-clamp-2">
                  {displayPkg.description}
                </p>
              ) : (
                <p className="text-gray-400 italic text-sm">
                  No description available
                </p>
              )}
            </div>
            <Button
              onClick={() => onAdd(displayPkg)}
              disabled={isAdding}
              className="bg-gray-800 hover:bg-gray-700 text-white shadow-lg px-6"
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
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8">
          {/* Key Metrics */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Key Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                    <Download className="h-5 w-5 text-gray-300" />
                  </div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Weekly
                  </span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {displayPkg.downloads ? formatNumber(displayPkg.downloads) : 'N/A'}
                </div>
                <div className="text-xs text-gray-400">Downloads</div>
              </div>
              
              {displayPkg.stars !== undefined && displayPkg.stars !== null ? (
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                      <Star className="h-5 w-5 text-gray-300" />
                    </div>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      GitHub
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {formatNumber(displayPkg.stars)}
                  </div>
                  <div className="text-xs text-gray-400">Stars</div>
                </div>
              ) : (
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 opacity-60">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                      <Star className="h-5 w-5 text-gray-400" />
                    </div>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      GitHub
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-400 mb-1 flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'N/A'
                    )}
                  </div>
                  <div className="text-xs text-gray-400">Stars</div>
                </div>
              )}
              
              {displayPkg.forks !== undefined && displayPkg.forks !== null ? (
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                      <GitFork className="h-5 w-5 text-gray-300" />
                    </div>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Community
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {formatNumber(displayPkg.forks)}
                  </div>
                  <div className="text-xs text-gray-400">Forks</div>
                </div>
              ) : (
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 opacity-60">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                      <GitFork className="h-5 w-5 text-gray-400" />
                    </div>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Community
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-400 mb-1 flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'N/A'
                    )}
                  </div>
                  <div className="text-xs text-gray-400">Forks</div>
                </div>
              )}
              
              {displayPkg.contributors !== undefined && displayPkg.contributors !== null ? (
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-300" />
                    </div>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Active
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {formatNumber(displayPkg.contributors)}
                  </div>
                  <div className="text-xs text-gray-400">Contributors</div>
                </div>
              ) : (
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 opacity-60">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Active
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-400 mb-1 flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'N/A'
                    )}
                  </div>
                  <div className="text-xs text-gray-400">Contributors</div>
                </div>
              )}
            </div>
          </div>

          {/* Security & Risk Assessment */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Security Assessment
            </h3>
            {displayPkg.risk_score ? (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-${riskData.color}-100 dark:bg-${riskData.color}-900/50 flex items-center justify-center`}>
                      <Shield className={`h-6 w-6 text-${riskData.color}-600 dark:text-${riskData.color}-400`} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {riskData.level} Security
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Risk Score: {displayPkg.risk_score}/100
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${riskData.color}-100 text-${riskData.color}-700 dark:bg-${riskData.color}-900/50 dark:text-${riskData.color}-300`}>
                    {displayPkg.risk_score}/100
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r from-${riskData.color}-500 to-${riskData.color}-600`}
                      style={{ width: `${displayPkg.risk_score}%` }}
                    />
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {riskData.description}
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-600 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
                  Security assessment unavailable
                </p>
                <p className="text-slate-500 dark:text-slate-500 text-xs">
                  Manual review recommended before adoption
                </p>
              </div>
            )}
          </div>

          {/* Package Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Package Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Version</span>
                  </div>
                  <div className="font-mono text-sm text-slate-900 dark:text-slate-100">
                    {displayPkg.version || <span className="text-slate-500 italic">Not specified</span>}
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">License</span>
                  </div>
                  <div className="text-sm text-slate-900 dark:text-slate-100">
                    {displayPkg.license || <span className="text-slate-500 italic">Not specified</span>}
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Published</span>
                  </div>
                  <div className="text-sm text-slate-900 dark:text-slate-100">
                    {displayPkg.published || <span className="text-slate-500 italic">Not available</span>}
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Updated</span>
                  </div>
                  <div className="text-sm text-slate-900 dark:text-slate-100">
                    {displayPkg.last_updated || <span className="text-slate-500 italic">Not available</span>}
                  </div>
                </div>
              </div>

              {/* Maintainers */}
              {displayPkg.maintainers && displayPkg.maintainers.length > 0 ? (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Maintainers</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {displayPkg.maintainers.map((maintainer, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                        <div className="w-6 h-6 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {maintainer.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300">{maintainer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-600 opacity-60">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-500">Maintainers</span>
                  </div>
                  <p className="text-slate-500 text-sm italic">No maintainer information available</p>
                </div>
              )}
            </div>
          </div>

          {/* Keywords */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Keywords & Tags
            </h3>
            {displayPkg.keywords && displayPkg.keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {displayPkg.keywords.map((keyword, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary" 
                    className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-600 text-center">
                <p className="text-slate-500 text-sm italic">No keywords available</p>
              </div>
            )}
          </div>

          {/* External Resources */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              External Resources
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {displayPkg.npm_url ? (
                <a
                  href={displayPkg.npm_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 rounded-xl border border-red-200 dark:border-red-800 hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/30 dark:hover:to-red-900/40 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shadow-lg">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-red-900 dark:text-red-100 group-hover:text-red-800 dark:group-hover:text-red-50">
                      NPM Registry
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300">
                      View package details and installation guide
                    </div>
                  </div>
                  <ExternalLink className="h-5 w-5 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300" />
                </a>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 opacity-60">
                  <div className="w-12 h-12 rounded-xl bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
                    <Package className="h-6 w-6 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-500">NPM Registry</div>
                    <div className="text-sm text-slate-400">Link not available</div>
                  </div>
                </div>
              )}
              
              {displayPkg.repo_url ? (
                <a
                  href={displayPkg.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800 dark:bg-slate-600 flex items-center justify-center shadow-lg">
                    <Github className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-slate-800 dark:group-hover:text-slate-50">
                      GitHub Repository
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Browse source code, issues, and contributions
                    </div>
                  </div>
                  <ExternalLink className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
                </a>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 opacity-60">
                  <div className="w-12 h-12 rounded-xl bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
                    <Github className="h-6 w-6 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-500">GitHub Repository</div>
                    <div className="text-sm text-slate-400">Link not available</div>
                  </div>
                </div>
              )}
              
              {displayPkg.homepage ? (
                <a
                  href={displayPkg.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-800 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-900/30 dark:hover:to-gray-900/40 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-500 flex items-center justify-center shadow-lg">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-gray-800 dark:group-hover:text-gray-50">
                      Official Website
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Documentation, guides, and project information
                    </div>
                  </div>
                  <ExternalLink className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                </a>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 opacity-60">
                  <div className="w-12 h-12 rounded-xl bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
                    <Globe className="h-6 w-6 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-500">Official Website</div>
                    <div className="text-sm text-slate-400">Link not available</div>
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