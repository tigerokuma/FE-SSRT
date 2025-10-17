"use client"

import { useState, useEffect, useLayoutEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { colors } from "@/lib/design-system"
import CommitTimeline from "@/components/dependencies/CommitTimeline"

export default function DependencyDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState("overview")
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  const packageId = params.packageId as string
  const version = params.version as string

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "activity", label: "Activity" },
    { id: "alerts", label: "Alerts" },
  ]

  // Update tab indicator position
  useEffect(() => {
    const updateIndicator = () => {
      const activeTab = tabRefs.current[currentTab]
      if (activeTab) {
        setIndicatorStyle({
          left: activeTab.offsetLeft,
          width: activeTab.offsetWidth,
        })
      }
    }

    updateIndicator() // Initial position
    window.addEventListener('resize', updateIndicator) // Update on resize
    return () => window.removeEventListener('resize', updateIndicator) // Cleanup
  }, [currentTab]) // Recalculate when currentTab changes

  // Fetch dependency data
  useEffect(() => {
    const fetchDependencyData = async () => {
      try {
        setLoading(true)
        
        const response = await fetch(`http://localhost:3000/packages/id/${packageId}?version=${version}`)
        if (!response.ok) {
          throw new Error('Failed to fetch dependency details')
        }
        
        const data = await response.json()
        console.log('Dependency data:', data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (packageId) {
      fetchDependencyData()
    }
  }, [packageId, version])

  // Remove loading state - show tabs immediately like projects screen

  // Error state
  if (error) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <div className="text-red-400 mb-4">{error}</div>
            <Button 
              onClick={() => router.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Dependency Top Bar - Sticky header */}
      <div className="sticky top-0 z-40 w-full border-b" style={{ backgroundColor: colors.background.card, borderColor: 'hsl(var(--border))', borderBottomWidth: '1px' }}>
        <div className="px-6 py-4 w-full max-w-none">
          {/* First line - Dependency info */}
          <div className="flex items-center gap-3 mb-4">
            {/* Dependency icon */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(84, 0, 250)' }}>
              <img src="/package_icon.png" alt="Package" className="w-6 h-6" />
            </div>
            
            {/* Dependency name and version */}
            <div>
              <h1 className="text-xl font-semibold text-white">
                Package: {packageId}
              </h1>
              <p className="text-sm text-gray-400">
                Version: {version}
              </p>
            </div>
          </div>

          {/* Second line - Tabs */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              return (
                <Button
                  key={tab.id}
                  ref={(el) => { 
                    if (el) tabRefs.current[tab.id] = el 
                  }}
                  onClick={() => setCurrentTab(tab.id)}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors relative",
                    "text-gray-400 hover:text-white hover:bg-transparent",
                    "border-b-2 border-transparent",
                    currentTab === tab.id && "text-white"
                  )}
                >
                  {tab.label}
                </Button>
              )
            })}
          </div>
        </div>
        
        {/* Active tab indicator bar */}
        <div className="relative">
          <div className="absolute bottom-0 left-0 right-0 h-0.5"></div> {/* Base line */}
          <div 
            className="absolute bottom-0 h-0.5 transition-all duration-200"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              backgroundColor: colors.primary,
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Tab Content */}
        {currentTab === "overview" && (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-white mb-4">Overview Tab</h2>
            <p className="text-gray-400">
              This is the overview content for the dependency.
            </p>
          </div>
        )}

        {currentTab === "activity" && (
          <div className="w-full">
            <CommitTimeline />
          </div>
        )}

        {currentTab === "alerts" && (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-white mb-4">Alerts Tab</h2>
            <p className="text-gray-400">
              This is the alerts content for the dependency.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
