"use client"

import { Loader2 } from "lucide-react"
import { colors } from "@/lib/design-system"

interface ProcessingBannerProps {
  title?: string
  message?: string
  className?: string
}

export function ProcessingBanner({ 
  title = "Analysis in Progress",
  message = "We're still analyzing this package. This data will appear shortly.",
  className = ""
}: ProcessingBannerProps) {
  return (
    <div 
      className={`flex flex-col items-center justify-center py-8 px-4 rounded-xl ${className}`}
      style={{ 
        backgroundColor: colors.background.card,
        border: `1px solid ${colors.border.default}`
      }}
    >
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
        style={{ backgroundColor: 'rgba(84, 0, 250, 0.15)' }}
      >
        <Loader2 
          className="w-5 h-5 animate-spin" 
          style={{ color: colors.primary }}
        />
      </div>
      <span className="text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
        {title}
      </span>
      <p className="text-xs text-center max-w-md" style={{ color: colors.text.secondary }}>
        {message}
      </p>
    </div>
  )
}

export function ProcessingBannerCompact({ 
  message = "Still processing...",
  className = ""
}: { message?: string; className?: string }) {
  return (
    <div 
      className={`flex items-center gap-2 py-2 px-3 rounded-lg ${className}`}
      style={{ 
        backgroundColor: colors.background.card,
        border: `1px solid ${colors.border.default}`
      }}
    >
      <Loader2 
        className="w-4 h-4 animate-spin" 
        style={{ color: colors.primary }}
      />
      <span className="text-xs" style={{ color: colors.text.secondary }}>
        {message}
      </span>
    </div>
  )
}

