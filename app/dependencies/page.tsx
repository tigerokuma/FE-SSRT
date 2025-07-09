"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Check,
  Clock,
  ExternalLink,
  Package,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  Star,
  ArrowDown,
  Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { MainContent } from "@/components/main-content"

// Types based on the API model
interface Package {
  package_id: string
  package_name: string
  repo_url: string
  repo_name: string
  downloads?: number
  last_updated?: string
  stars?: number
  contributors?: number
  pushed_at?: string
  risk_score?: number
  fetched_at?: string
}

interface DependencyData {
  id: number
  name: string
  version: string
  type: string
  risk: string
  activity: string
  lastUpdate: string
  cves: number
  maintainers: number
  stars: string
}

const dependenciesData: DependencyData[] = [
  {
    id: 1,
    name: "lodash",
    version: "4.17.21",
    type: "production",
    risk: "low",
    activity: "high",
    lastUpdate: "2 days ago",
    cves: 0,
    maintainers: 5,
    stars: "52.4k",
  },
  {
    id: 2,
    name: "react",
    version: "18.2.0",
    type: "production",
    risk: "low",
    activity: "high",
    lastUpdate: "1 week ago",
    cves: 0,
    maintainers: 12,
    stars: "203k",
  },
  {
    id: 3,
    name: "axios",
    version: "1.3.4",
    type: "production",
    risk: "medium",
    activity: "medium",
    lastUpdate: "1 month ago",
    cves: 1,
    maintainers: 3,
    stars: "98.2k",
  },
  {
    id: 4,
    name: "moment",
    version: "2.29.4",
    type: "production",
    risk: "high",
    activity: "low",
    lastUpdate: "6 months ago",
    cves: 2,
    maintainers: 2,
    stars: "46.8k",
  },
  {
    id: 5,
    name: "express",
    version: "4.18.2",
    type: "production",
    risk: "low",
    activity: "high",
    lastUpdate: "3 months ago",
    cves: 0,
    maintainers: 8,
    stars: "59.7k",
  },
]

export default function DependenciesPage() {
  const [dependencies, setDependencies] = useState<DependencyData[]>(dependenciesData)
  const [isAddDependencyOpen, setIsAddDependencyOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Package[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false)

  const searchPackages = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/packages/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const results = await response.json()
        
        // Debug: Log the results to see the structure
        console.log('Search results type:', typeof results)
        console.log('Search results:', results)
        console.log('Is array?', Array.isArray(results))
        
        // Handle different response formats
        let packages: Package[] = []
        
        if (Array.isArray(results)) {
          // If it's already an array (original format)
          packages = results
        } else if (results && typeof results === 'object') {
          // If it's an object, check for common array properties
          if (results.data && Array.isArray(results.data)) {
            packages = results.data
          } else if (results.packages && Array.isArray(results.packages)) {
            packages = results.packages
          } else if (results.results && Array.isArray(results.results)) {
            packages = results.results
          } else {
            console.error('Unknown response format:', results)
            setSearchResults([])
            return
          }
        } else {
          console.error('Invalid response format:', results)
          setSearchResults([])
          return
        }
        
        // Remove duplicates based on package_id (if any still exist)
        const uniqueResults = packages.filter((pkg: Package, index: number, self: Package[]) => 
          index === self.findIndex(p => p.package_id === pkg.package_id)
        )
        
        console.log('Final unique results:', uniqueResults)
        setSearchResults(uniqueResults)
      } else {
        console.error('Search failed:', response.statusText)
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = () => {
    searchPackages(searchQuery)
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatNumber = (num?: number) => {
    if (num == null || num === 0) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
    return num.toString()
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`
    return `${Math.ceil(diffDays / 365)} years ago`
  }

  const getRiskFromScore = (riskScore?: number) => {
    if (!riskScore) return 'unknown'
    if (riskScore >= 0.7) return 'high'
    if (riskScore >= 0.4) return 'medium'
    return 'low'
  }

  const addToWatchlist = async (pkg: Package) => {
    setIsAddingToWatchlist(true)
    try {
      // Convert Package to DependencyData format
      const newDependency: DependencyData = {
        id: dependencies.length + 1,
        name: pkg.package_name,
        version: "latest", // You might want to fetch the actual latest version
        type: "production", // Default type, could be made configurable
        risk: getRiskFromScore(pkg.risk_score),
        activity: pkg.pushed_at ? "high" : "low", // Simple heuristic
        lastUpdate: formatDate(pkg.last_updated),
        cves: 0, // Would need additional API call to get CVE data
        maintainers: pkg.contributors || 0,
        stars: formatNumber(pkg.stars),
      }

      setDependencies(prev => [...prev, newDependency])
      setIsAddDependencyOpen(false)
      setSearchQuery("")
      setSearchResults([])
      setSelectedPackage(null)
    } catch (error) {
      console.error('Error adding to watchlist:', error)
    } finally {
      setIsAddingToWatchlist(false)
    }
  }

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "high":
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            <ShieldAlert className="mr-1 h-3 w-3" />
            High Risk
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            <Shield className="mr-1 h-3 w-3" />
            Medium Risk
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            <ShieldCheck className="mr-1 h-3 w-3" />
            Low Risk
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getActivityBadge = (activity: string) => {
    switch (activity) {
      case "high":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            <Check className="mr-1 h-3 w-3" />
            High Activity
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            <Clock className="mr-1 h-3 w-3" />
            Medium Activity
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Low Activity
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Dependency Watchlist" description="Monitor and manage your project dependencies">
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isAddDependencyOpen} onOpenChange={setIsAddDependencyOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Dependency
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader className="space-y-2 pb-4">
                <DialogTitle>Add Dependency to Watchlist</DialogTitle>
                <DialogDescription>Search for a package to add to your watchlist for monitoring.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Search for a package..." 
                      className="flex-1 min-w-0" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="shrink-0"
                      onClick={handleSearch}
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Search Results */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      {searchResults.map((pkg) => {
                        // Debug: Log package metadata
                        console.log('Package metadata:', {
                          name: pkg.package_name,
                          stars: pkg.stars,
                          downloads: pkg.downloads,
                          contributors: pkg.contributors,
                          stars_type: typeof pkg.stars,
                          downloads_type: typeof pkg.downloads,
                          contributors_type: typeof pkg.contributors
                        })
                        
                        return (
                        <div 
                          key={pkg.package_id} 
                          className={`rounded-lg border p-4 space-y-3 cursor-pointer transition-colors ${
                            selectedPackage?.package_id === pkg.package_id 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedPackage(pkg)}
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Package className="h-5 w-5 shrink-0" />
                                <span className="font-medium truncate">{pkg.package_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {pkg.risk_score && (
                                  <Badge variant="outline" className="shrink-0">
                                    Risk: {(pkg.risk_score * 100).toFixed(0)}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground break-words">
                              {pkg.repo_name}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1 shrink-0">
                              <Star className="h-4 w-4 text-yellow-400" />
                              <span>{formatNumber(pkg.stars || 0)} stars</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <ArrowDown className="h-4 w-4 text-green-400" />
                              <span>{formatNumber(pkg.downloads || 0)} downloads</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Users className="h-4 w-4 text-blue-400" />
                              <span>{pkg.contributors || 0} contributors</span>
                            </div>
                          </div>
                          {pkg.last_updated && (
                            <div className="text-sm text-muted-foreground">
                              Last updated: {formatDate(pkg.last_updated)}
                            </div>
                          )}
                        </div>
                        )
                      })}
                    </div>
                  )}
                  
                  {searchQuery && !isSearching && searchResults.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No packages found for "{searchQuery}"
                    </div>
                  )}
                  
                  {!searchQuery && (
                    <div className="text-center py-8 text-muted-foreground">
                      Enter a package name to search
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="flex flex-col gap-2 mt-6">
                <Button 
                  className="w-full" 
                  disabled={!selectedPackage || isAddingToWatchlist}
                  onClick={() => selectedPackage && addToWatchlist(selectedPackage)}
                >
                  {isAddingToWatchlist ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding to Watchlist...
                    </>
                  ) : (
                    'Add to Watchlist'
                  )}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setIsAddDependencyOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>
      
      <MainContent>
      <Tabs defaultValue="all">
        <div className="flex flex-col gap-4 mb-4">
          <h2 className="text-xl font-bold tracking-tight">Dependencies</h2>
          <TabsList className="grid grid-cols-3 max-w-md">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="development">Development</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {dependencies.map((dep) => (
              <div key={dep.id} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium min-w-0 truncate">{dep.name}</span>
                    <Badge variant="outline" className="shrink-0">v{dep.version}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="shrink-0">{getRiskBadge(dep.risk)}</div>
                    <div className="shrink-0">{getActivityBadge(dep.activity)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>{dep.cves} CVEs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>{dep.maintainers}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span>{dep.stars}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="truncate">Updated {dep.lastUpdate}</span>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {dependencies.filter(dep => dep.type === "production").map((dep) => (
              <div key={dep.id} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium min-w-0 truncate">{dep.name}</span>
                    <Badge variant="outline" className="shrink-0">v{dep.version}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="shrink-0">{getRiskBadge(dep.risk)}</div>
                    <div className="shrink-0">{getActivityBadge(dep.activity)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>{dep.cves} CVEs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>{dep.maintainers}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span>{dep.stars}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="truncate">Updated {dep.lastUpdate}</span>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {dependencies.filter(dep => dep.type === "production").length === 0 && (
              <div className="rounded-lg border bg-card p-8 flex flex-col items-center justify-center text-center">
                <Package className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Production Dependencies</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add production dependencies to your watchlist.
                </p>
                <Button onClick={() => setIsAddDependencyOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Dependency
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="development" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {dependencies.filter(dep => dep.type === "development").map((dep) => (
              <div key={dep.id} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium min-w-0 truncate">{dep.name}</span>
                    <Badge variant="outline" className="shrink-0">v{dep.version}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="shrink-0">{getRiskBadge(dep.risk)}</div>
                    <div className="shrink-0">{getActivityBadge(dep.activity)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>{dep.cves} CVEs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>{dep.maintainers}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span>{dep.stars}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="truncate">Updated {dep.lastUpdate}</span>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {dependencies.filter(dep => dep.type === "development").length === 0 && (
              <div className="rounded-lg border bg-card p-8 flex flex-col items-center justify-center text-center">
                <Package className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Development Dependencies</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add development dependencies to your watchlist.
                </p>
                <Button onClick={() => setIsAddDependencyOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Dependency
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </MainContent>
    </div>
  )
}
