"use client"

import { Download, Plus, Shield, Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Package as PackageType } from '../../lib/watchlist/types'
import { formatNumber, getVulnerabilityCount, hasVulnerabilities, getHighestSeverity } from '../../lib/watchlist/index'

interface PackageCardProps {
  pkg: PackageType
  onSelect: (pkg: PackageType) => void
  searchQuery: string
  isSelected: boolean
  onAdd: (pkg: PackageType) => void
  isAdding: boolean
}

export function PackageCard({ pkg, onSelect, searchQuery, isSelected, onAdd, isAdding }: PackageCardProps) {
  const isExactMatch = pkg.name.toLowerCase() === searchQuery.toLowerCase().trim()
  
  // Separate active (unpatched) and historical (patched) vulnerabilities
  const allVulns = pkg.osv_vulnerabilities || []
  const activeVulns = allVulns.filter(v => !v.is_patched)
  const historicalVulns = allVulns.filter(v => v.is_patched)
  
  const vulnerabilityCount = getVulnerabilityCount(pkg.osv_vulnerabilities)
  const hasVulns = hasVulnerabilities(pkg.osv_vulnerabilities)
  const hasActiveVulns = activeVulns.length > 0
  const hasOnlyPatchedVulns = historicalVulns.length > 0 && activeVulns.length === 0
  
  // Use active vulnerabilities for severity assessment, not all vulnerabilities
  const highestSeverity = hasActiveVulns ? getHighestSeverity(activeVulns) : getHighestSeverity(pkg.osv_vulnerabilities)
  
  // Debug logging
  console.log(`PackageCard for ${pkg.name}:`, {
    vulnerabilityCount,
    hasVulns,
    hasActiveVulns,
    hasOnlyPatchedVulns,
    activeVulns: activeVulns.length,
    historicalVulns: historicalVulns.length,
    highestSeverity,
    osv_vulnerabilities: pkg.osv_vulnerabilities
  })
  
  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }
  
  return (
    <div 
      className={`
        group rounded-xl border p-4 cursor-pointer
        transition-all duration-200 hover:shadow-lg
        focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0
        active:scale-[0.99]
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
        }
      `}
      onClick={() => onSelect(pkg)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">{pkg.name}</h3>
          {isExactMatch && (
            <Badge 
              variant="secondary" 
              className="text-xs bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 font-medium"
            >
              exact match
            </Badge>
          )}
          {hasActiveVulns && (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getSeverityColor(highestSeverity.level)}`} />
              <Badge variant="outline" className="text-xs border-red-200 text-red-700 dark:border-red-800 dark:text-red-400">
                {activeVulns.length} active {activeVulns.length === 1 ? 'vulnerability' : 'vulnerabilities'}
              </Badge>
            </div>
          )}
          {hasOnlyPatchedVulns && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <Badge variant="outline" className="text-xs border-green-200 text-green-700 dark:border-green-800 dark:text-green-400">
                {historicalVulns.length} patched {historicalVulns.length === 1 ? 'issue' : 'issues'}
              </Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <Download className="h-4 w-4" />
            <span className="font-medium">{formatNumber(pkg.downloads)}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {pkg.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 leading-relaxed">
          {pkg.description}
        </p>
      )}

      {/* Active Vulnerability Status */}
      {hasActiveVulns && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-red-700 dark:text-red-300 font-medium mb-1">
                {activeVulns.length} active {highestSeverity.level} severity {activeVulns.length === 1 ? 'vulnerability' : 'vulnerabilities'} detected
              </p>
              <div className="flex items-center justify-between text-xs">
                <p className="text-red-600 dark:text-red-400">
                  Review security advisories from OSV.dev before adding to your project
                </p>
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 font-medium ml-2 flex-shrink-0"
                >
                  <img src="/osv_logo.svg" alt="OSV.dev" className="h-3 w-auto" />
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patched Vulnerabilities Status */}
      {hasOnlyPatchedVulns && (
        <div className="mb-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/50 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-green-700 dark:text-green-300 font-medium mb-1">
                All {historicalVulns.length} known {historicalVulns.length === 1 ? 'vulnerability has' : 'vulnerabilities have'} been patched
              </p>
              <div className="flex items-center justify-between text-xs">
                <p className="text-green-600 dark:text-green-400">
                  No active security threats from OSV.dev - safe to add to your project
                </p>
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 font-medium ml-2 flex-shrink-0"
                >
                  <img src="/osv_logo.svg" alt="OSV.dev" className="h-3 w-auto" />
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keywords */}
      {pkg.keywords && pkg.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {pkg.keywords.slice(0, 3).map((keyword: string, idx: number) => (
            <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {keyword}
            </span>
          ))}
          {pkg.keywords.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500">
              +{pkg.keywords.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {pkg.version && (
            <span className="font-mono text-gray-600 dark:text-gray-300">v{pkg.version}</span>
          )}
          {pkg.license && (
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {pkg.license}
            </span>
          )}
        </div>
        
        <Button
          onClick={(e) => {
            e.stopPropagation()
            onAdd(pkg)
          }}
          disabled={isAdding}
          size="sm"
          className={`h-8 px-4 text-sm font-medium transition-colors disabled:opacity-50 ${
            hasActiveVulns 
              ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700' 
              : hasOnlyPatchedVulns
              ? 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700'
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
              Add
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 