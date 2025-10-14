"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Trash2, MessageSquare, AlertTriangle, Shield, Clock, Loader2 } from "lucide-react"
import { colors } from "@/lib/design-system"
import { checkLicenseCompatibility, getLicenseDisplayName } from "@/lib/license-utils"

interface WatchlistPackage {
  id: string
  name?: string
  version?: string
  addedBy?: string
  added_by?: string
  addedByUser?: {
    name?: string
    email?: string
  }
  addedAt?: string
  added_at?: string
  comments?: Array<{
    id: string
    user_id: string
    user?: {
      name?: string
      email?: string
    }
    comment: string
    created_at: string
  }>
  riskScore?: number
  status?: 'approved' | 'rejected' | 'pending'
  approvedBy?: string
  approvedByUser?: {
    name?: string
    email?: string
  }
  rejectedBy?: string
  rejectedByUser?: {
    name?: string
    email?: string
  }
  approvedAt?: string
  rejectedAt?: string
  healthScore?: number
  activityScore?: number
  busFactor?: number
  license?: string
  projectLicense?: string
  vulnerabilities?: number
  pastVulnerabilities?: number
  package?: {
    id: string
    name: string
    total_score?: number
    vulnerability_score?: number
    activity_score?: number
    bus_factor_score?: number
    license_score?: number
    scorecard_score?: number
    health_score?: number
    license?: string
    repo_url?: string
    status?: string
    stars?: number
    contributors?: number
    summary?: string
  }
}

interface WatchlistPackageCardProps {
  package: WatchlistPackage
  searchQuery: string
  projectLicense?: string | null
  onPackageClick: (pkg: WatchlistPackage) => void
  isLoading?: boolean
  packageStatus?: 'queued' | 'fast' | 'done'
}

export function WatchlistPackageCard({ package: pkg, searchQuery, projectLicense, onPackageClick, isLoading = false, packageStatus }: WatchlistPackageCardProps) {
  // Get package data from the nested package object or use direct properties
  const packageData = pkg.package || pkg
  const packageName = packageData.name || pkg.name || 'Unknown Package'
  
  // Filter based on search query
  if (searchQuery && !packageName.toLowerCase().includes(searchQuery.toLowerCase())) {
    return null
  }

  // Determine if package is still processing
  const isProcessing = isLoading || packageStatus === 'queued' || packageStatus === 'fast'
  const hasScores = packageData.total_score !== null && packageData.total_score !== undefined
  
  const riskScore = packageData.total_score || pkg.riskScore || 0
  const healthScore = packageData.activity_score || pkg.healthScore || 0
  const activityScore = packageData.activity_score || pkg.activityScore || 0
  const busFactor = packageData.bus_factor_score || pkg.busFactor || 0
  const vulnerabilities = packageData.vulnerability_score || pkg.vulnerabilities || 0

  // Check license compatibility only if project has a license
  const hasProjectLicense = projectLicense && projectLicense !== 'unlicensed' && projectLicense !== 'none'
  const packageLicense = packageData.license || pkg.license
  const licenseCompatibility = hasProjectLicense ? checkLicenseCompatibility(projectLicense, packageLicense) : null

  // Get manual status badge (left side)
  const getManualStatusBadge = () => {
    // Show loading state if package is processing
    if (isProcessing) {
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-400">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Loading
        </Badge>
      )
    }
    
    const status = pkg.status || 'pending'
    if (status === 'approved') {
      return (
        <Badge variant="outline" className="border-green-500 text-green-500">
          <Check className="mr-1 h-3 w-3" />
          Approved
        </Badge>
      )
    } else if (status === 'rejected') {
      return (
        <Badge variant="outline" className="border-red-500 text-red-500">
          <Trash2 className="mr-1 h-3 w-3" />
          Rejected
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="border-gray-500 text-gray-400 bg-gray-800/50">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      )
    }
  }

  // Get license compatibility badge (right side) - only if project has license
  const getLicenseBadge = () => {
    if (!hasProjectLicense) {
      return null // Don't show license badge if project has no license
    }

    if (licenseCompatibility?.isCompatible) {
      return (
        <Badge variant="outline" className="border-green-500 text-green-500">
          <Shield className="mr-1 h-3 w-3" />
          License OK
        </Badge>
      )
    } else {
      const severityColor = licenseCompatibility?.severity === 'high' ? 'red' : 
                           licenseCompatibility?.severity === 'medium' ? 'yellow' : 'blue'
      return (
        <Badge variant="outline" className={`border-${severityColor}-500 text-${severityColor}-500`}>
          <AlertTriangle className="mr-1 h-3 w-3" />
          License Issue
        </Badge>
      )
    }
  }

  // Get license compatibility indicator (the checkmark on the right)
  const getLicenseIndicator = () => {
    if (!hasProjectLicense) {
      return null // Don't show any indicator if project has no license
    }
    
    if (licenseCompatibility?.isCompatible) {
      return <span className="text-green-400 text-xs">✓</span>
    } else {
      return <span className="text-red-400 text-xs">⚠</span>
    }
  }

  // Format added date
  const formatAddedDate = (dateString?: string) => {
    if (!dateString) return 'Recently added'
    const date = new Date(dateString)
    return `Added ${date.toLocaleDateString()}`
  }

  return (
    <Card 
      style={{ backgroundColor: colors.background.card, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
      onClick={() => !isProcessing && onPackageClick(pkg)}
      className={`transition-opacity ${isProcessing ? 'opacity-75' : 'hover:opacity-90'}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
              <img src="/package_icon.png" alt="Package" className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{packageName}</h3>
              <p className="text-gray-400">
                {pkg.addedBy ? `Added by ${pkg.addedBy}` : formatAddedDate(pkg.added_at)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getManualStatusBadge()}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              {getLicenseBadge()}
              <div className="text-center">
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-white">{Math.round(riskScore)}</div>
                )}
                <div className="text-xs text-gray-400">Risk Score</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
