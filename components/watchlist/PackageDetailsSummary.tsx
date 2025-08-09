"use client"

import { useState, useEffect } from "react"
import { Loader2, Download, Plus, Star, GitFork, Users, Package, AlertCircle, CheckCircle, ExternalLink, Github, Globe, AlertTriangle, Eye, Shield, Calendar, ChevronDown, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Package as PackageType, OsvVulnerability } from '../../lib/watchlist/types'
import { formatNumber, getVulnerabilityCount, hasVulnerabilities, getHighestSeverity, parseCvssSeverity } from '../../lib/watchlist/index'
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

  const formatVulnerabilityDate = (dateString?: string): { formatted: string, relative: string } => {
    if (!dateString) return { formatted: 'Unknown', relative: 'Unknown date' }
    
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInMs = now.getTime() - date.getTime()
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
      
      // Formatted date
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
      
      // Relative time
      let relative: string
      if (diffInDays < 1) relative = 'Today'
      else if (diffInDays === 1) relative = '1 day ago'
      else if (diffInDays < 7) relative = `${diffInDays} days ago`
      else if (diffInDays < 30) relative = `${Math.floor(diffInDays / 7)} weeks ago`
      else if (diffInDays < 365) relative = `${Math.floor(diffInDays / 30)} months ago`
      else relative = `${Math.floor(diffInDays / 365)} years ago`
      
      return { formatted, relative }
    } catch {
      return { formatted: 'Invalid date', relative: 'Unknown date' }
    }
  }

  const parseCvssScore = (cvssString?: string): { score: number | null, level: string } => {
    if (!cvssString) return { score: null, level: 'unknown' }
    
    // Try to extract actual CVSS score from common formats
    // Format 1: "CVSS_V3: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" with score
    let scoreMatch = cvssString.match(/(\d+\.?\d*)\s*\/\s*10/)
    if (scoreMatch) {
      const score = parseFloat(scoreMatch[1])
      return { score, level: getSeverityLevel(score) }
    }
    
    // Format 2: Look for standalone score in string
    scoreMatch = cvssString.match(/score[:\s]+(\d+\.?\d*)/i)
    if (scoreMatch) {
      const score = parseFloat(scoreMatch[1])
      return { score, level: getSeverityLevel(score) }
    }
    
    // Format 3: Just CVSS vector - we can't calculate accurately without proper formula
    // So we'll classify based on the impact metrics only
    const impactMatch = cvssString.match(/C:([HNML])[^A-Z]*I:([HNML])[^A-Z]*A:([HNML])/)
    if (impactMatch) {
      const [, c, i, a] = impactMatch
      // Simple heuristic: if all High, likely critical/high
      if (c === 'H' && i === 'H' && a === 'H') return { score: null, level: 'high' }
      if ((c === 'H' && i === 'H') || (c === 'H' && a === 'H') || (i === 'H' && a === 'H')) return { score: null, level: 'medium' }
      if (c === 'H' || i === 'H' || a === 'H') return { score: null, level: 'medium' }
      if (c === 'M' || i === 'M' || a === 'M') return { score: null, level: 'low' }
      return { score: null, level: 'low' }
    }
    
    return { score: null, level: 'unknown' }
  }
  
  const getSeverityLevel = (score: number): string => {
    if (score >= 9.0) return 'critical'
    if (score >= 7.0) return 'high' 
    if (score >= 4.0) return 'medium'
    if (score >= 0.1) return 'low'
    return 'unknown'
  }

  const getSeverityTheme = (vuln: OsvVulnerability) => {
    const { score, level } = parseCvssScore(vuln.severity)
    const hasSeverityData = !!vuln.severity
    
    switch (level) {
      case 'critical':
        return {
          dotColor: 'bg-red-600',
          cardBg: 'from-red-50 to-red-50/80 dark:from-red-950/30 dark:to-red-900/20',
          cardBorder: 'border-red-300 dark:border-red-800/60',
          idBg: 'bg-red-100 dark:bg-red-900/50',
          idText: 'text-red-700 dark:text-red-300',
          titleText: 'text-red-900 dark:text-red-100',
          subtitleText: 'text-red-700 dark:text-red-200',
          sectionBorder: 'border-red-300 dark:border-red-700',
          sectionBg: 'bg-white dark:bg-red-950/40',
          sectionBorderColor: 'border-red-200 dark:border-red-800/40',
          level: 'CRITICAL',
          score
        }
      case 'high':
        return {
          dotColor: 'bg-orange-600',
          cardBg: 'from-orange-50 to-orange-50/80 dark:from-orange-950/30 dark:to-orange-900/20',
          cardBorder: 'border-orange-300 dark:border-orange-800/60',
          idBg: 'bg-orange-100 dark:bg-orange-900/50',
          idText: 'text-orange-700 dark:text-orange-300',
          titleText: 'text-orange-900 dark:text-orange-100',
          subtitleText: 'text-orange-700 dark:text-orange-200',
          sectionBorder: 'border-orange-300 dark:border-orange-700',
          sectionBg: 'bg-white dark:bg-orange-950/40',
          sectionBorderColor: 'border-orange-200 dark:border-orange-800/40',
          level: 'HIGH',
          score
        }
      case 'medium':
        return {
          dotColor: 'bg-yellow-600',
          cardBg: 'from-yellow-50 to-yellow-50/80 dark:from-yellow-950/30 dark:to-yellow-900/20',
          cardBorder: 'border-yellow-300 dark:border-yellow-800/60',
          idBg: 'bg-yellow-100 dark:bg-yellow-900/50',
          idText: 'text-yellow-700 dark:text-yellow-300',
          titleText: 'text-yellow-900 dark:text-yellow-100',
          subtitleText: 'text-yellow-700 dark:text-yellow-200',
          sectionBorder: 'border-yellow-300 dark:border-yellow-700',
          sectionBg: 'bg-white dark:bg-yellow-950/40',
          sectionBorderColor: 'border-yellow-200 dark:border-yellow-800/40',
          level: 'MEDIUM',
          score
        }
      case 'low':
        return {
          dotColor: 'bg-green-600',
          cardBg: 'from-green-50 to-green-50/80 dark:from-green-950/30 dark:to-green-900/20',
          cardBorder: 'border-green-300 dark:border-green-800/60',
          idBg: 'bg-green-100 dark:bg-green-900/50',
          idText: 'text-green-700 dark:text-green-300',
          titleText: 'text-green-900 dark:text-green-100',
          subtitleText: 'text-green-700 dark:text-green-200',
          sectionBorder: 'border-green-300 dark:border-green-700',
          sectionBg: 'bg-white dark:bg-green-950/40',
          sectionBorderColor: 'border-green-200 dark:border-green-800/40',
          level: 'LOW',
          score
        }
      default:
        return {
          dotColor: 'bg-gray-500',
          cardBg: 'from-gray-50 to-gray-50/80 dark:from-gray-950/30 dark:to-gray-900/20',
          cardBorder: 'border-gray-300 dark:border-gray-800/60',
          idBg: 'bg-gray-100 dark:bg-gray-900/50',
          idText: 'text-gray-700 dark:text-gray-300',
          titleText: 'text-gray-900 dark:text-gray-100',
          subtitleText: 'text-gray-700 dark:text-gray-200',
          sectionBorder: 'border-gray-300 dark:border-gray-700',
          sectionBg: 'bg-white dark:bg-gray-950/40',
          sectionBorderColor: 'border-gray-200 dark:border-gray-800/40',
          level: hasSeverityData ? 'UNRATED' : 'NO CVSS',
          score
        }
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
          {/* Security Vulnerabilities */}
          {hasVulns && displayPkg.osv_vulnerabilities && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Security Vulnerabilities</h4>
                  <p className="text-xs text-red-400">
                    {vulnCount} {vulnCount === 1 ? 'vulnerability' : 'vulnerabilities'} found
                    {vulnCount > 0 && (() => {
                      const sortedVulns = displayPkg.osv_vulnerabilities.sort((a, b) => {
                        const dateA = new Date(a.published || a.modified || '1970-01-01').getTime()
                        const dateB = new Date(b.published || b.modified || '1970-01-01').getTime()
                        return dateB - dateA
                      })
                      const latestDate = formatVulnerabilityDate(sortedVulns[0]?.published || sortedVulns[0]?.modified)
                      return (
                        <span className="text-gray-400"> • Latest: {latestDate.relative}</span>
                      )
                    })()}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {displayPkg.osv_vulnerabilities
                  .sort((a, b) => {
                    // Sort by published date (latest first), fallback to modified date
                    const dateA = new Date(a.published || a.modified || '1970-01-01').getTime()
                    const dateB = new Date(b.published || b.modified || '1970-01-01').getTime()
                    return dateB - dateA // Latest first
                  })
                  .map((vuln: OsvVulnerability) => {
                  const isExpanded = expandedVulns.has(vuln.id)
                  const theme = getSeverityTheme(vuln)
                  const publishedDate = formatVulnerabilityDate(vuln.published)
                  const modifiedDate = formatVulnerabilityDate(vuln.modified)
                  
                  return (
                    <div key={vuln.id} className={`bg-gradient-to-r ${theme.cardBg} border ${theme.cardBorder} rounded-xl p-4 w-full overflow-hidden shadow-sm`}>
                      <div className="w-full">
                        {/* Vulnerability Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${theme.dotColor}`}></div>
                              <span className={`font-mono text-xs ${theme.idText} ${theme.idBg} px-2.5 py-1 rounded-full font-medium`}>
                                {vuln.id}
                              </span>
                            </div>
                            <div className={`flex items-center gap-1 ${theme.idBg} px-2 py-0.5 rounded-full`}>
                              <Shield className={`h-3 w-3 ${theme.dotColor.replace('bg-', 'text-')}`} />
                              <span className={`text-xs font-medium ${theme.idText}`}>{theme.level}</span>
                            </div>
                            {theme.score !== null && (
                              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  {theme.score.toFixed(1)}/10
                                </span>
                              </div>
                            )}
                            {/* Timing Information */}
                            <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                              <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                {publishedDate.relative}
                              </span>
                            </div>
                          </div>
                          
                          <Collapsible open={isExpanded} onOpenChange={() => toggleVulnExpansion(vuln.id)}>
                            <CollapsibleTrigger asChild>
                              <button className={`flex items-center gap-1 px-2 py-1 text-xs ${theme.idText} hover:opacity-80 hover:${theme.idBg} rounded-md transition-colors`}>
                                {isExpanded ? (
                                  <>
                                    <ChevronDown className="h-3 w-3" />
                                    Less
                                  </>
                                ) : (
                                  <>
                                    <ChevronRight className="h-3 w-3" />
                                    More
                                  </>
                                )}
                              </button>
                            </CollapsibleTrigger>
                          </Collapsible>
                        </div>
                        
                        {/* Vulnerability Summary */}
                        <div className="mb-3">
                          <h5 className={`text-sm font-medium ${theme.titleText} mb-1 leading-tight`}>
                            {vuln.summary.split('.')[0]}.
                          </h5>
                          {vuln.summary.split('.').length > 1 && (
                            <p className={`text-xs ${theme.subtitleText} leading-relaxed opacity-90`}>
                              {vuln.summary.split('.').slice(1).join('.').trim()}
                            </p>
                          )}
                        </div>
                        
                        {/* Expandable Details */}
                        <Collapsible open={isExpanded} onOpenChange={() => toggleVulnExpansion(vuln.id)}>
                          <CollapsibleContent className={`space-y-4 pt-3 border-t ${theme.sectionBorder}`}>
                            {/* CVSS Severity */}
                            {vuln.severity && (
                              <div className={`${theme.sectionBg} rounded-lg p-3 border ${theme.sectionBorderColor}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <Shield className={`h-4 w-4 ${theme.dotColor.replace('bg-', 'text-')}`} />
                                  <span className={`text-xs font-semibold ${theme.idText} uppercase tracking-wide`}>
                                    CVSS Score ({theme.level})
                                  </span>
                                </div>
                                <code className={`text-xs ${theme.idText} ${theme.idBg} px-2 py-1 rounded block break-all font-mono`}>
                                  {vuln.severity}
                                </code>
                                {theme.score !== null && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${theme.dotColor}`}></div>
                                    <span className={`text-sm font-bold ${theme.titleText}`}>
                                      Score: {theme.score.toFixed(1)}/10
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Timing Information */}
                            <div className={`${theme.sectionBg} rounded-lg p-3 border ${theme.sectionBorderColor}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className={`h-4 w-4 ${theme.dotColor.replace('bg-', 'text-')}`} />
                                <span className={`text-xs font-semibold ${theme.idText} uppercase tracking-wide`}>Vulnerability Timeline</span>
                              </div>
                              <div className="space-y-2">
                                {vuln.published && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Published:</span>
                                    <div className="text-right">
                                      <div className={`text-xs font-medium ${theme.titleText}`}>{publishedDate.formatted}</div>
                                      <div className="text-xs text-gray-500">{publishedDate.relative}</div>
                                    </div>
                                  </div>
                                )}
                                {vuln.modified && vuln.modified !== vuln.published && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Last Modified:</span>
                                    <div className="text-right">
                                      <div className={`text-xs font-medium ${theme.titleText}`}>{modifiedDate.formatted}</div>
                                      <div className="text-xs text-gray-500">{modifiedDate.relative}</div>
                                    </div>
                                  </div>
                                )}
                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                      publishedDate.relative.includes('day') || publishedDate.relative === 'Today' 
                                        ? 'bg-red-500' 
                                        : publishedDate.relative.includes('week') 
                                        ? 'bg-orange-500' 
                                        : publishedDate.relative.includes('month') 
                                        ? 'bg-yellow-500' 
                                        : 'bg-green-500'
                                    }`}></div>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      {publishedDate.relative.includes('day') || publishedDate.relative === 'Today' 
                                        ? 'Recently discovered' 
                                        : publishedDate.relative.includes('week') 
                                        ? 'Recent discovery' 
                                        : publishedDate.relative.includes('month') 
                                        ? 'Moderate age' 
                                        : 'Well-established'
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Affected Versions */}
                            {vuln.affected_versions && vuln.affected_versions.length > 0 && (
                              <div className={`${theme.sectionBg} rounded-lg p-3 border ${theme.sectionBorderColor}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <Package className={`h-4 w-4 ${theme.dotColor.replace('bg-', 'text-')}`} />
                                  <span className={`text-xs font-semibold ${theme.idText} uppercase tracking-wide`}>Affected Versions</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {vuln.affected_versions.map((version, idx) => (
                                    <span key={idx} className={`px-2 py-1 ${theme.idBg} ${theme.idText} text-xs rounded-md font-mono border ${theme.sectionBorderColor}`}>
                                      {version}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Technical Details */}
                            {vuln.details && (
                              <div className={`${theme.sectionBg} rounded-lg p-3 border ${theme.sectionBorderColor}`}>
                                <div className="flex items-center gap-2 mb-3">
                                  <AlertCircle className={`h-4 w-4 ${theme.dotColor.replace('bg-', 'text-')}`} />
                                  <span className={`text-xs font-semibold ${theme.idText} uppercase tracking-wide`}>Technical Details</span>
                                </div>
                                <div className={`${theme.idBg} p-3 rounded border ${theme.sectionBorderColor} max-h-64 overflow-y-auto`}>
                                  {(() => {
                                    const details = vuln.details;
                                    
                                    // Parse markdown-like content
                                    const sections = details.split('##').filter(section => section.trim());
                                    
                                    if (sections.length <= 1) {
                                      // No markdown sections, show as regular text
                                      return (
                                        <p className={`text-xs ${theme.idText} leading-relaxed break-words overflow-wrap-anywhere`}>
                                          {details}
                                        </p>
                                      );
                                    }
                                    
                                    return (
                                      <div className="space-y-3">
                                        {sections.map((section, idx) => {
                                          const lines = section.trim().split('\n');
                                          const title = lines[0]?.trim();
                                          const content = lines.slice(1).join('\n').trim();
                                          
                                          if (!title) return null;
                                          
                                          return (
                                            <div key={idx} className={`border-l-2 ${theme.sectionBorder} pl-3`}>
                                              <h6 className={`text-xs font-semibold ${theme.titleText} mb-1 uppercase tracking-wide`}>
                                                {title}
                                              </h6>
                                              {content && (
                                                <div className={`text-xs ${theme.subtitleText} leading-relaxed space-y-2`}>
                                                  {content.split('\n\n').map((paragraph, pIdx) => {
                                                    // Handle code blocks
                                                    if (paragraph.includes('```') || paragraph.includes('`')) {
                                                      const codeMatch = paragraph.match(/`([^`]+)`/g);
                                                      if (codeMatch) {
                                                        return (
                                                          <div key={pIdx} className="space-y-1">
                                                            {paragraph.split(/`([^`]+)`/).map((part, partIdx) => {
                                                              if (codeMatch.some(code => code === `\`${part}\``)) {
                                                                return (
                                                                  <code key={partIdx} className="bg-red-100 dark:bg-red-900/40 px-1 py-0.5 rounded text-xs font-mono text-red-700 dark:text-red-300">
                                                                    {part}
                                                                  </code>
                                                                );
                                                              }
                                                              return part;
                                                            })}
                                                          </div>
                                                        );
                                                      }
                                                    }
                                                    
                                                    // Handle numbered lists
                                                    if (paragraph.match(/^\d+\./m)) {
                                                      const listItems = paragraph.split(/(?=^\d+\.)/m).filter(item => item.trim());
                                                      return (
                                                        <ol key={pIdx} className="list-decimal list-inside space-y-1 ml-2">
                                                          {listItems.map((item, itemIdx) => (
                                                            <li key={itemIdx} className="text-xs break-words">
                                                              {item.replace(/^\d+\.\s*/, '')}
                                                            </li>
                                                          ))}
                                                        </ol>
                                                      );
                                                    }
                                                    
                                                    // Handle bullet points
                                                    if (paragraph.match(/^[-*]/m)) {
                                                      const listItems = paragraph.split(/(?=^[-*])/m).filter(item => item.trim());
                                                      return (
                                                        <ul key={pIdx} className="list-disc list-inside space-y-1 ml-2">
                                                          {listItems.map((item, itemIdx) => (
                                                            <li key={itemIdx} className="text-xs break-words">
                                                              {item.replace(/^[-*]\s*/, '')}
                                                            </li>
                                                          ))}
                                                        </ul>
                                                      );
                                                    }
                                                    
                                                    // Handle links
                                                    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                                                    if (linkRegex.test(paragraph)) {
                                                      const parts = paragraph.split(linkRegex);
                                                      return (
                                                        <p key={pIdx} className="break-words">
                                                          {parts.map((part, partIdx) => {
                                                            if (partIdx % 3 === 1) {
                                                              // Link text
                                                              const url = parts[partIdx + 1];
                                                              return (
                                                                <a
                                                                  key={partIdx}
                                                                  href={url}
                                                                  target="_blank"
                                                                  rel="noopener noreferrer"
                                                                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                                                >
                                                                  {part}
                                                                </a>
                                                              );
                                                            } else if (partIdx % 3 === 2) {
                                                              // URL part, skip
                                                              return null;
                                                            }
                                                            return part;
                                                          })}
                                                        </p>
                                                      );
                                                    }
                                                    
                                                    // Regular paragraph
                                                    return (
                                                      <p key={pIdx} className="break-words overflow-wrap-anywhere">
                                                        {paragraph}
                                                      </p>
                                                    );
                                                  })}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                            
                            {/* References */}
                            {vuln.references && vuln.references.length > 0 && (
                              <div className={`${theme.sectionBg} rounded-lg p-3 border ${theme.sectionBorderColor}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  <span className={`text-xs font-semibold ${theme.idText} uppercase tracking-wide`}>
                                    References ({vuln.references.length})
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {vuln.references.slice(0, 3).map((ref, idx) => (
                                    <div key={idx} className={`flex items-center gap-2 p-2 ${theme.idBg} rounded border ${theme.sectionBorderColor}`}>
                                      <span className={`text-xs font-medium ${theme.idText} bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded uppercase flex-shrink-0`}>
                                        {ref.type}
                                      </span>
                                      <a 
                                        href={ref.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline break-all flex-1"
                                      >
                                        {ref.url}
                                      </a>
                                      <ExternalLink className="h-3 w-3 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                    </div>
                                  ))}
                                  {vuln.references.length > 3 && (
                                    <p className={`text-xs ${theme.subtitleText} text-center py-1 italic`}>
                                      +{vuln.references.length - 3} more references available
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
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