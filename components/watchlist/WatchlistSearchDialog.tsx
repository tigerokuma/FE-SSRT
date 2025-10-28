"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, Plus, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import type { Package as PackageType, WatchlistItem } from "../../lib/watchlist/types"
import { usePackageSearch, useWatchlist } from "../../lib/watchlist"
import { hasActiveVulnerabilities } from "../../lib/watchlist/utils"
import { PackageCard } from "./PackageCard"
import { PackageDetailsSummary } from "./PackageDetailsSummary"
import { colors } from "@/lib/design-system"
import {useUser} from "@clerk/nextjs";

interface WatchlistSearchDialogProps {
  trigger?: React.ReactNode
  onPackagePreview?: (pkg: PackageType, type: "npm" | "github") => void
  defaultType?: WatchlistItem["type"]
  onRepositoryAdded?: () => void
  projectId?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function WatchlistSearchDialog({
  trigger,
  onPackagePreview,
  defaultType = "production",
  onRepositoryAdded,
  projectId,
  open,
  onOpenChange,
}: WatchlistSearchDialogProps) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
  const { user, isLoaded } = useUser()
  const backendUserId = (user?.publicMetadata as any)?.backendUserId ?? user?.id ?? null

  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen
  const setIsOpenExternal = onOpenChange

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [securityFilter, setSecurityFilter] = useState<"all" | "secure" | "vulnerable">("all")

  const { isAdding: isAddingToWatchlist } = useWatchlist()
  const { searchResults, isSearching, searchPackages, clearSearch } = usePackageSearch()

  useEffect(() => {
    if (searchQuery.trim().length === 0) clearSearch()
  }, [searchQuery, clearSearch])

  useEffect(() => {
    if (searchQuery.trim().length < 2) return
    const t = setTimeout(() => {
      searchPackages(searchQuery, { enrichWithGitHub: false, maxConcurrentEnrichments: 0 })
    }, 500)
    return () => clearTimeout(t)
  }, [searchQuery, searchPackages])

  const secureCount = searchResults.filter((p) => !hasActiveVulnerabilities(p.osv_vulnerabilities)).length
  const vulnerableCount = searchResults.filter((p) => hasActiveVulnerabilities(p.osv_vulnerabilities)).length

  const filteredResults = searchResults
    .filter((pkg) => {
      if (securityFilter === "secure") return !hasActiveVulnerabilities(pkg.osv_vulnerabilities)
      if (securityFilter === "vulnerable") return hasActiveVulnerabilities(pkg.osv_vulnerabilities)
      return true
    })
    .sort((a, b) => {
      const aIsExact = a.name.toLowerCase() === searchQuery.toLowerCase().trim()
      const bIsExact = b.name.toLowerCase() === searchQuery.toLowerCase().trim()
      if (aIsExact && !bIsExact) return -1
      if (!aIsExact && bIsExact) return 1
      return (b.downloads || 0) - (a.downloads || 0)
    })

  const handlePackageSelect = (pkg: PackageType) => {
    setSelectedPackage(pkg)
    onPackagePreview?.(pkg, "npm")
  }

  const handleAddToWatchlist = async (pkg: PackageType) => {
    setIsAdding(true)
    try {
      if (!projectId) throw new Error("Project ID is required but not provided")
      if (!isLoaded) throw new Error("User not loaded yet")
      if (!backendUserId) throw new Error("No backend user id available")

      const response = await fetch(`${apiBase}/projects/${projectId}/watchlist/add-package`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageName: pkg.name, repoUrl: pkg.repo_url, userId: backendUserId }),
      })

      if (!response.ok) throw new Error(`Failed to add package: ${response.statusText} - ${await response.text()}`)

      setInternalOpen(false)
      if (setIsOpenExternal) setIsOpenExternal(false)
      setSearchQuery("")
      setSelectedPackage(null)
      clearSearch()
      onRepositoryAdded?.()
    } catch (e) {
      console.error(e)
    } finally {
      setIsAdding(false)
    }
  }

  const hasResults = searchResults.length > 0

  const panelStyle: React.CSSProperties = {
    backgroundColor: colors.background.card,
    borderColor: colors.border.default,
    color: colors.text.primary,
  }

  const subtlePill =
    "text-xs px-1.5 py-0.5 rounded font-medium bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-gray-300"

  return (
    <Dialog open={isOpen} onOpenChange={(v) => {
      // keep both in sync
      setInternalOpen(v)
      onOpenChange?.(v)
    }}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent
        className="max-w-6xl max-h-[90vh] p-0"
        style={{ backgroundColor: colors.background.card, borderColor: colors.border.default }}
      >
        <div className="flex h-[80vh]">
          {/* Left */}
          <div className="w-1/2 flex flex-col min-h-0 border-r" style={{ borderColor: colors.border.default }}>
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-white">Add Package to Project Watchlist</DialogTitle>
              <DialogDescription className="text-[color:rgb(156,163,175)]">
                Search and add packages to your project's dependency watchlist
              </DialogDescription>
            </DialogHeader>

            {/* Search */}
            <div className="px-6 pb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4" style={{ color: colors.text.muted }} />
                <Input
                  placeholder="Search packages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  style={{
                    backgroundColor: colors.background.main,
                    borderColor: colors.border.default,
                    color: colors.text.primary,
                  }}
                />
              </div>

              {/* Filters (neutral) */}
              {searchResults.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: colors.text.secondary }}>
                    Security:
                  </span>
                  <div className="flex gap-1">
                    {(["all", "secure", "vulnerable"] as const).map((key) => {
                      const active = securityFilter === key
                      return (
                        <Button
                          key={key}
                          size="sm"
                          variant="outline"
                          onClick={() => setSecurityFilter(key)}
                          className="text-xs flex items-center gap-1.5"
                          style={{
                            backgroundColor: active ? "rgba(255,255,255,0.06)" : colors.background.card,
                            borderColor: colors.border.default,
                            color: active ? colors.text.primary : colors.text.secondary,
                          }}
                        >
                          {key[0].toUpperCase() + key.slice(1)}
                          <span className={subtlePill}>
                            {key === "all" ? searchResults.length : key === "secure" ? secureCount : vulnerableCount}
                          </span>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full px-6">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: colors.text.secondary }} />
                      <p className="text-sm" style={{ color: colors.text.secondary }}>
                        Searching NPM packages...
                      </p>
                    </div>
                  </div>
                ) : hasResults ? (
                  <div className="space-y-3 pb-6">
                    {filteredResults.map((pkg) => (
                      <PackageCard
                        key={pkg.name}
                        pkg={pkg}
                        onSelect={handlePackageSelect}
                        searchQuery={searchQuery}
                        isSelected={selectedPackage?.name === pkg.name}
                        onAdd={handleAddToWatchlist}
                        isAdding={isAdding}
                      />
                    ))}
                  </div>
                ) : searchQuery.trim().length >= 2 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Search className="h-8 w-8 mx-auto mb-4" style={{ color: colors.text.muted }} />
                      <p className="text-sm" style={{ color: colors.text.secondary }}>
                        {securityFilter === "all"
                          ? "No packages found"
                          : securityFilter === "secure"
                          ? "No secure packages found"
                          : "No vulnerable packages found"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Search className="h-8 w-8 mx-auto mb-4" style={{ color: colors.text.muted }} />
                      <p className="text-sm" style={{ color: colors.text.secondary }}>
                        Start typing to search...
                      </p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          {/* Right */}
          <div className="w-1/2 flex flex-col min-h-0" style={panelStyle}>
            <PackageDetailsSummary pkg={selectedPackage} onAdd={handleAddToWatchlist} isAdding={isAddingToWatchlist|| !isLoaded || !backendUserId} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
