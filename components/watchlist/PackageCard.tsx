"use client"

import { Download, Plus, Shield, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Package as PackageType } from '../../lib/watchlist/types'
import { formatNumber } from '../../lib/watchlist/index'

interface PackageCardProps {
  pkg: PackageType
  onSelect: (pkg: PackageType) => void
  onAdd: (pkg: PackageType) => void
  searchQuery: string
  isSelected: boolean
  isAdding?: boolean
}

export function PackageCard({ pkg, onSelect, onAdd, searchQuery, isSelected, isAdding }: PackageCardProps) {
  const isExactMatch = pkg.name.toLowerCase() === searchQuery.toLowerCase().trim()
  
  return (
    <div 
      className={`group rounded-lg border p-4 transition-all duration-200 cursor-pointer ${
        isSelected 
          ? 'border-gray-600 bg-gray-800 ring-2 ring-gray-600' 
          : 'border-gray-800 bg-black hover:border-gray-700 hover:bg-gray-900/50'
      }`}
      onClick={() => onSelect(pkg)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-white truncate">{pkg.name}</h3>
          {isExactMatch && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-900 text-green-300 border border-green-800">
              exact match
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-sm text-gray-300">
            <Download className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{formatNumber(pkg.downloads)}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {pkg.description && (
        <p className="text-sm text-gray-400 mb-3 line-clamp-2 leading-relaxed">
          {pkg.description}
        </p>
      )}

      {/* Keywords */}
      {pkg.keywords && pkg.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {pkg.keywords.slice(0, 3).map((keyword: string, idx: number) => (
            <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-800 text-gray-300">
              {keyword}
            </span>
          ))}
          {pkg.keywords.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-800 text-gray-500">
              +{pkg.keywords.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-800">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {pkg.version && (
            <span className="font-mono text-gray-400">v{pkg.version}</span>
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
          className="h-7 px-3 text-xs font-medium bg-white text-black hover:bg-gray-100 transition-colors disabled:opacity-50"
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