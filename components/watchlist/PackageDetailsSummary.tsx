"use client"

import { useState, useEffect } from "react"
import { Loader2, Download, Plus, Star, GitFork, Users, Package, AlertCircle, CheckCircle, ExternalLink, Github, Globe, AlertTriangle, Eye, Shield, Calendar, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Package as PackageType, OsvVulnerability } from '../../lib/watchlist/types'
import { formatNumber, getVulnerabilityCount, hasVulnerabilities, getHighestSeverity } from '../../lib/watchlist/index'
import { getPackageDetailsSafe } from '../../lib/watchlist/api'

interface PackageDetailsSummaryProps {
  pkg: PackageType | null
  onAdd: (pkg: PackageType) => void
  isAdding?: boolean
}

export function PackageDetailsSummary({ pkg, onAdd, isAdding }: PackageDetailsSummaryProps) {
  const [detailedPkg, setDetailedPkg] = useState<PackageType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedVulns, setExpandedVulns] = useState<Set<string>>(new Set())

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
            setDetailedPkg(result)
          } else {
            setError('Unable to load additional details')
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [pkg])

  if (!pkg) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-950">
        <div className="text-center max-w-xs">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gray-800 flex items-center justify-center mb-6 shadow-lg">
            <Eye className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Select a Package
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Choose a package from the search results to view key metrics, security insights, and package information.
          </p>
        </div>
      </div>
    )
  }

  const displayPkg = detailedPkg || pkg
  const vulnCount = displayPkg.osv_vulnerabilities?.length || 0
  const hasVulns = vulnCount > 0
  const highestSeverity = getHighestSeverity(displayPkg.osv_vulnerabilities)

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const toggleVulnExpansion = (vulnId: string) => {
    const newExpanded = new Set(expandedVulns)
    if (newExpanded.has(vulnId)) {
      newExpanded.delete(vulnId)
    } else {
      newExpanded.add(vulnId)
    }
    setExpandedVulns(newExpanded)
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b border-gray-800 bg-gray-900">
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center shadow-lg flex-shrink-0">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg text-white truncate">
                  {displayPkg.name}
                </h3>
                {displayPkg.version && (
                  <span className="font-mono text-sm text-gray-300">v{displayPkg.version}</span>
                )}
                {hasVulns && (
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getSeverityColor(highestSeverity.level)}`} />
                    <Badge variant="outline" className="text-xs border-red-200 text-red-300 dark:border-red-800 dark:text-red-400">
                      {vulnCount} {vulnCount === 1 ? 'vulnerability' : 'vulnerabilities'}
                    </Badge>
                  </div>
                )}
                {isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>
              {displayPkg.description ? (
                <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">
                  {displayPkg.description}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  No description available
                </p>
              )}
            </div>
          </div>
          
          {/* Vulnerability Status Banner */}
          {hasVulns && (
            <div className="mb-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-red-700 dark:text-red-300 font-medium mb-1">
                    {highestSeverity.level.charAt(0).toUpperCase() + highestSeverity.level.slice(1)} severity vulnerabilities detected
                  </p>
                  <p className="text-red-600 dark:text-red-400 text-xs">
                    Review security advisories before adding to your project
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={() => onAdd(displayPkg)}
            disabled={isAdding}
            size="sm"
            className={`w-full h-8 text-sm font-medium transition-colors disabled:opacity-50 ${
              hasVulns 
                ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'
            }`}
          >
            {isAdding ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-3 h-3 mr-1" />
                Add to Watchlist
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Detailed Vulnerability Information */}
          {hasVulns && displayPkg.osv_vulnerabilities && (
            <div>
              <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                Security Vulnerabilities ({vulnCount})
              </h4>
              <div className="space-y-3">
                {displayPkg.osv_vulnerabilities.map((vuln: OsvVulnerability) => {
                  const isExpanded = expandedVulns.has(vuln.id)
                  return (
                    <div key={vuln.id} className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3 w-full overflow-hidden">
                      <div className="flex items-start gap-2 w-full">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0 w-full overflow-hidden">
                          {/* Vulnerability Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                              {vuln.id}
                            </span>
                            {vuln.severity && (
                              <Badge variant="outline" className="text-xs border-red-300 text-red-700 dark:border-red-700 dark:text-red-300">
                                CVSS Available
                              </Badge>
                            )}
                          </div>
                          
                          {/* Summary */}
                          <p className="text-sm text-red-700 dark:text-red-300 mb-2 font-medium break-words overflow-wrap-anywhere leading-relaxed">
                            {vuln.summary}
                          </p>
                          
                          {/* Expandable Details */}
                          <Collapsible open={isExpanded} onOpenChange={() => toggleVulnExpansion(vuln.id)}>
                            <CollapsibleTrigger asChild>
                              <button className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
                                {isExpanded ? (
                                  <>
                                    <ChevronDown className="h-3 w-3" />
                                    Hide Details
                                  </>
                                ) : (
                                  <>
                                    <ChevronRight className="h-3 w-3" />
                                    Show Details
                                  </>
                                )}
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 space-y-3 overflow-hidden">
                              {/* CVSS Severity */}
                              {vuln.severity && (
                                <div className="w-full">
                                  <span className="text-xs font-medium text-red-700 dark:text-red-300">CVSS Severity:</span>
                                  <div className="text-xs text-red-600 dark:text-red-400 font-mono mt-1 bg-red-100 dark:bg-red-900/20 p-2 rounded break-all">
                                    {vuln.severity}
                                  </div>
                                </div>
                              )}
                              
                              {/* Affected Versions */}
                              {vuln.affected_versions && vuln.affected_versions.length > 0 && (
                                <div className="w-full">
                                  <span className="text-xs font-medium text-red-700 dark:text-red-300">Affected Versions:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {vuln.affected_versions.map((version, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs rounded font-mono break-all">
                                        {version}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Details */}
                              {vuln.details && (
                                <div className="w-full">
                                  <span className="text-xs font-medium text-red-700 dark:text-red-300">Details:</span>
                                  <div className="text-xs text-red-600 dark:text-red-400 mt-1 leading-relaxed bg-red-100 dark:bg-red-900/20 p-2 rounded break-words overflow-wrap-anywhere">
                                    {vuln.details}
                                  </div>
                                </div>
                              )}
                              
                              {/* References */}
                              {vuln.references && vuln.references.length > 0 && (
                                <div className="w-full">
                                  <span className="text-xs font-medium text-red-700 dark:text-red-300">
                                    References ({vuln.references.length}):
                                  </span>
                                  <div className="mt-1 space-y-1">
                                    {vuln.references.slice(0, 3).map((ref, idx) => (
                                      <div key={idx} className="w-full">
                                        <div className="flex items-start gap-2 text-xs">
                                          <span className="text-red-500 dark:text-red-400 capitalize font-medium flex-shrink-0">{ref.type.toUpperCase()}:</span>
                                          <div className="flex-1 min-w-0">
                                            <a 
                                              href={ref.url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline break-all block"
                                            >
                                              {ref.url}
                                            </a>
                                          </div>
                                          <ExternalLink className="h-3 w-3 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                        </div>
                                      </div>
                                    ))}
                                    {vuln.references.length > 3 && (
                                      <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                                        +{vuln.references.length - 3} more references
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Key Metrics</h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Downloads */}
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-gray-400 font-medium">Downloads</span>
                </div>
                <div className="text-sm font-medium text-white">
                  {displayPkg.downloads ? formatNumber(displayPkg.downloads) : 'N/A'}
                </div>
                <div className="text-xs text-gray-500">weekly</div>
              </div>

              {/* Stars */}
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs text-gray-400 font-medium">Stars</span>
                </div>
                <div className="text-sm font-medium text-white">
                  {displayPkg.stars !== null && displayPkg.stars !== undefined ? (
                    formatNumber(displayPkg.stars)
                  ) : isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'N/A'
                  )}
                </div>
                <div className="text-xs text-gray-500">github</div>
              </div>

              {/* Forks */}
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <GitFork className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-gray-400 font-medium">Forks</span>
                </div>
                <div className="text-sm font-medium text-white">
                  {displayPkg.forks !== null && displayPkg.forks !== undefined ? (
                    formatNumber(displayPkg.forks)
                  ) : isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'N/A'
                  )}
                </div>
                <div className="text-xs text-gray-500">community</div>
              </div>

              {/* Contributors */}
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-gray-400 font-medium">Contributors</span>
                </div>
                <div className="text-sm font-medium text-white">
                  {displayPkg.contributors !== null && displayPkg.contributors !== undefined ? (
                    formatNumber(displayPkg.contributors)
                  ) : isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'N/A'
                  )}
                </div>
                <div className="text-xs text-gray-500">active</div>
              </div>
            </div>
          </div>

          {/* Package Info */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Package Info</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 bg-gray-900 rounded-lg border border-gray-800">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-gray-400 font-medium">License</span>
                </div>
                <span className="text-xs text-white font-mono">
                  {displayPkg.license || 'Not specified'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 px-3 bg-gray-900 rounded-lg border border-gray-800">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-gray-400 font-medium">Last Updated</span>
                </div>
                <span className="text-xs text-white">
                  {displayPkg.last_updated || 'Not available'}
                </span>
              </div>
            </div>
          </div>

          {/* No Vulnerabilities State */}
          {!hasVulns && (
            <div>
              <h4 className="text-sm font-medium text-white mb-3">Security Status</h4>
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">No known vulnerabilities</span>
                </div>
                <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                  This package appears to be secure according to OSV database
                </p>
              </div>
            </div>
          )}

          {/* Keywords */}
          {displayPkg.keywords && displayPkg.keywords.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-white mb-3">Keywords</h4>
              <div className="flex flex-wrap gap-1.5">
                {displayPkg.keywords.slice(0, 6).map((keyword, idx) => (
                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    {keyword}
                  </span>
                ))}
                {displayPkg.keywords.length > 6 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500">
                    +{displayPkg.keywords.length - 6}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Maintainers */}
          {displayPkg.maintainers && displayPkg.maintainers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-white mb-3">Maintainers</h4>
              <div className="flex flex-wrap gap-2">
                {displayPkg.maintainers.slice(0, 4).map((maintainer, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-gray-800 rounded-lg text-xs">
                    <div className="w-5 h-5 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {maintainer.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-300 font-medium">{maintainer}</span>
                  </div>
                ))}
                {displayPkg.maintainers.length > 4 && (
                  <div className="px-2 py-1 bg-gray-800 rounded-lg text-xs text-gray-400">
                    +{displayPkg.maintainers.length - 4} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Quick Links</h4>
            <div className="space-y-2">
              {displayPkg.npm_url && (
                <a
                  href={displayPkg.npm_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-red-700 dark:text-red-300">NPM Registry</div>
                    <div className="text-xs text-red-600 dark:text-red-400">Install & documentation</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-red-600 dark:text-red-400" />
                </a>
              )}

              {displayPkg.repo_url && (
                <a
                  href={displayPkg.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-800 dark:bg-gray-600 flex items-center justify-center">
                    <Github className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">GitHub Repository</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Source code & issues</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </a>
              )}

              {displayPkg.homepage && (
                <a
                  href={displayPkg.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Official Website</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">Documentation & guides</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </a>
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm text-yellow-700 dark:text-yellow-300">{error}</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}