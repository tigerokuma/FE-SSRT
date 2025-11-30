"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { colors } from "@/lib/design-system"

interface ProjectTopBarProps {
  projectName: string
  projectIcon?: string
  projectLanguage?: string
  currentTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "overview", label: "Overview", icon: null },
  { id: "dependencies", label: "Dependencies", icon: null },
  { id: "watchlist", label: "Watchlist", icon: null },
  { id: "compliance", label: "Compliance", icon: null },
  { id: "alerts", label: "Alerts", icon: null },
  { id: "settings", label: "Settings", icon: null },
]

// Function to get project icon based on language
const getProjectIcon = (language?: string) => {
  const lang = language?.toLowerCase()
  
  // React/JavaScript projects
  if (lang === 'javascript' || lang === 'typescript' || lang === 'react' || lang === 'nodejs') {
    return <img src="/Node_logo.png" alt="Node.js" className="h-5 w-5 bg-transparent" />
  }
  
  // Vue projects
  if (lang === 'vue') {
    return <img src="/Vue_logo.png" alt="Vue" className="h-5 w-5 bg-transparent" />
  }
  
  // Python projects
  if (lang === 'python') {
    return <img src="/Python_logo.png" alt="Python" className="h-5 w-5 bg-transparent" />
  }
  
  // Go projects
  if (lang === 'go') {
    return <img src="/Go_logo.png" alt="Go" className="h-5 w-5 bg-transparent" />
  }
  
  // Java projects
  if (lang === 'java') {
    return <img src="/Java_logo.png" alt="Java" className="h-5 w-5 bg-transparent" />
  }
  
  // Rust projects
  if (lang === 'rust') {
    return <img src="/Rust_logo.png" alt="Rust" className="h-5 w-5 bg-transparent" />
  }
  
  // Ruby projects
  if (lang === 'ruby') {
    return <img src="/Ruby_logo.png" alt="Ruby" className="h-5 w-5 bg-transparent" />
  }
  
  // Default to Deply logo for unknown languages
  return <img src="/Deply_Logo.png" alt="Deply" className="h-5 w-5 bg-transparent" />
}

export function ProjectTopBar({ 
  projectName, 
  projectIcon, 
  projectLanguage,
  currentTab, 
  onTabChange
}: ProjectTopBarProps) {
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

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
  return (
    <div className="w-full border-b" style={{ backgroundColor: colors.background.card, borderColor: 'hsl(var(--border))', borderBottomWidth: '1px' }}>
      <div className="px-6 py-3 w-full max-w-none">
        {/* First line - Project info */}
        <div className="flex items-center gap-3 mb-2">
          {/* Project icon */}
          <div className="w-6 h-6 rounded-lg flex items-center justify-center">
            {projectLanguage ? (
              getProjectIcon(projectLanguage)
            ) : projectIcon ? (
              <img src={projectIcon} alt={projectName} className="w-full h-full object-contain" />
            ) : projectName ? (
              <div className="w-full h-full bg-white/20 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {projectName.charAt(0).toUpperCase()}
                </span>
              </div>
            ) : (
              <div className="w-full h-full bg-gray-600 rounded animate-pulse"></div>
            )}
          </div>
          
          {/* Project name */}
          {projectName ? (
            <h1 className="text-xl font-semibold text-white">{projectName}</h1>
          ) : (
            <div className="h-7 w-32 bg-gray-600 rounded animate-pulse"></div>
          )}
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
                onClick={() => onTabChange(tab.id)}
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
      <div className="relative px-6">
        <div className="absolute bottom-0 left-6 right-6 h-0.5"></div> {/* Base line */}
        <div 
          className="absolute bottom-0 h-0.5 transition-all duration-200"
          style={{
            left: indicatorStyle.left, // Match tabs container padding (px-6 = 24px)
            width: indicatorStyle.width,
            backgroundColor: colors.primary,
          }}
        />
      </div>
    </div>
  )
}
