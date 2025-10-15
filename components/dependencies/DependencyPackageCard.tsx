"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, AlertTriangle, Shield, Clock, Loader2 } from "lucide-react"
import { colors } from "@/lib/design-system"
import { checkLicenseCompatibility, getLicenseDisplayName } from "@/lib/license-utils"
import { useRouter } from "next/navigation"

interface DependencyPackage {
  id: string
  name: string
  version: string
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

interface DependencyPackageCardProps {
  dependency: DependencyPackage
  searchQuery: string
  projectLicense?: string | null
  isLoading?: boolean
}

export function DependencyPackageCard({ 
  dependency, 
  searchQuery, 
  projectLicense, 
  isLoading = false 
}: DependencyPackageCardProps) {
  
  const router = useRouter()
  const packageData = dependency.package
  const packageName = dependency.name || 'Unknown Package'
  
  // Filter based on search query
  if (searchQuery && !packageName.toLowerCase().includes(searchQuery.toLowerCase())) {
    return null
  }

  // Determine if package is still processing
  const isProcessing = isLoading || packageData?.status === 'queued' || packageData?.status === 'fast'
  const isComplete = packageData?.status === 'done'
  
  const riskScore = packageData?.total_score || 0
  const healthScore = packageData?.health_score || 0
  const activityScore = packageData?.activity_score || 0
  const busFactor = packageData?.bus_factor_score || 0
  const vulnerabilities = packageData?.vulnerability_score || 0

  // Check license compatibility only if project has a license
  const hasProjectLicense = projectLicense && projectLicense !== 'unlicensed' && projectLicense !== 'none'
  const packageLicense = packageData?.license
  const licenseCompatibility = hasProjectLicense ? checkLicenseCompatibility(projectLicense, packageLicense) : null

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

  const handleCardClick = () => {
    if (packageData?.id) {
      router.push(`/dependency/${packageData.id}/${dependency.version}`)
    }
  }

  return (
    <Card 
      style={{ backgroundColor: colors.background.card, borderColor: 'hsl(var(--border))' }}
      className="cursor-pointer hover:opacity-90 transition-opacity"
      onClick={handleCardClick}
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
                Version: {dependency.version}
              </p>
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
