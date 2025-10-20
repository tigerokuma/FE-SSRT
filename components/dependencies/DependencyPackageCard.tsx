"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, AlertTriangle, Shield, Clock, Loader2, Users, Github } from "lucide-react"
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
  isLoading = false,
}: DependencyPackageCardProps) {
  const router = useRouter()
  const packageData = dependency.package
  const packageName = dependency.name || "Unknown Package"

  // search guard (kept from your code)
  if (searchQuery && !packageName.toLowerCase().includes(searchQuery.toLowerCase())) {
    return null
  }

  const isProcessing =
    isLoading || packageData?.status === "queued" || packageData?.status === "fast"

  const riskScore = packageData?.total_score ?? 0

  const hasProjectLicense =
    projectLicense && projectLicense !== "unlicensed" && projectLicense !== "none"
  const packageLicense = packageData?.license
  const licenseCompatibility = hasProjectLicense
    ? checkLicenseCompatibility(projectLicense, packageLicense)
    : null

  const getLicenseBadge = () => {
    if (!hasProjectLicense) return null
    if (licenseCompatibility?.isCompatible) {
      return (
        <Badge variant="outline" className="border-green-500 text-green-500">
          <Shield className="mr-1 h-3 w-3" />
          License OK
        </Badge>
      )
    }
    const severityColor =
      licenseCompatibility?.severity === "high"
        ? "red"
        : licenseCompatibility?.severity === "medium"
        ? "yellow"
        : "blue"
    return (
      <Badge variant="outline" className={`border-${severityColor}-500 text-${severityColor}-500`}>
        <AlertTriangle className="mr-1 h-3 w-3" />
        License Issue
      </Badge>
    )
  }

  const handleCardClick = () => {
    if (packageData?.id) {
      router.push(`/dependency/${packageData.id}/${dependency.version}`)
    }
  }

  const stars = packageData?.stars ?? 0
  const contributors = packageData?.contributors ?? 0

  return (
    <Card
      style={{ backgroundColor: colors.background.card, borderColor: "hsl(var(--border))" }}
      className="cursor-pointer hover:opacity-90 transition-opacity"
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          {/* Left: icon + name/version + stats (contributors/stars) */}
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgb(84, 0, 250)" }}
            >
              <img src="/package_icon.png" alt="Package" className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">{packageName}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="shrink-0">Version: {dependency.version}</span>

                {/* contributors */}
                <span className="inline-flex items-center gap-1 shrink-0" title="Contributors">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="tabular-nums">{contributors}</span>
                </span>

                {/* stars */}
                <span className="inline-flex items-center gap-1 shrink-0" title="Stars">
                  <Github className="h-4 w-4 text-gray-400" />
                  <span className="tabular-nums">{stars}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: license badge + risk score */}
          <div className="flex items-center gap-6">
            {getLicenseBadge()}

            <div className="text-center">
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                </div>
              ) : (
                <div className="text-2xl font-bold text-white tabular-nums">
                  {Math.round(riskScore)}
                </div>
              )}
              <div className="text-xs text-gray-400">Risk Score</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
