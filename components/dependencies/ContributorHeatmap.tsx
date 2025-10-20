"use client"

import { useState, useEffect } from "react"
import { colors } from "@/lib/design-system"

interface ContributorHeatmapProps {
  heatmapData: number[][]
  className?: string
  showTitle?: boolean
  commitTime?: string
}

export default function ContributorHeatmap({ heatmapData, className = "", showTitle = true, commitTime }: ContributorHeatmapProps) {
  const [isVisible, setIsVisible] = useState(false)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = Array.from({ length: 24 }, (_, i) => i)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200)
    return () => clearTimeout(timer)
  }, [])

  const getColorIntensity = (commitCount: number) => {
    // Convert commit count to color intensity
    // 0 commits = dark grey, 10+ commits = white
    const maxCommits = 10
    const normalizedValue = Math.min(commitCount / maxCommits, 1)
    const intensity = Math.floor(50 + (normalizedValue * 205)) // Range from 50 (dark) to 255 (white)
    return `rgb(${intensity}, ${intensity}, ${intensity})`
  }

  const getCommitTimePosition = (commitTime?: string) => {
    if (!commitTime) return { day: -1, hour: -1 }
    
    // Parse commit time like "Monday, 11:45 PM PST" or "Thursday, 10:15 AM PST"
    const dayMatch = commitTime.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i)
    const timeMatch = commitTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    
    if (!dayMatch || !timeMatch) return { day: -1, hour: -1 }
    
    const dayName = dayMatch[1].toLowerCase()
    const hour = parseInt(timeMatch[1])
    const minute = parseInt(timeMatch[2])
    const period = timeMatch[3].toUpperCase()
    
    // Convert to 24-hour format
    let hour24 = hour
    if (period === 'PM' && hour !== 12) hour24 += 12
    if (period === 'AM' && hour === 12) hour24 = 0
    
    // Round to nearest hour
    const roundedHour = minute >= 30 ? hour24 + 1 : hour24
    const finalHour = roundedHour >= 24 ? 0 : roundedHour
    
    // Map day name to index
    const dayIndex = days.findIndex(day => day.toLowerCase() === dayName.slice(0, 3))
    
    return { day: dayIndex, hour: finalHour }
  }

  return (
    <div className={`${className} transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {showTitle && (
        <div className="text-sm font-medium mb-2 transition-all duration-300" style={{ color: colors.text.primary }}>
          Typical Contribution Times
        </div>
      )}
      
      <div className="flex gap-1">
        {/* Days labels */}
        <div className="flex flex-col gap-1 mr-2" style={{ marginTop: '16px' }}>
          {days.map((day, index) => (
            <div 
              key={day}
              className="text-xs w-8 h-3 flex items-center justify-start transition-all duration-300 hover:text-blue-400"
              style={{ 
                color: colors.text.secondary,
                animationDelay: `${index * 50}ms`,
                animation: isVisible ? 'fadeInUp 0.6s ease-out forwards' : 'none'
              }}
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Heatmap grid */}
        <div className="flex gap-1">
          {hours.map((hour) => (
            <div key={hour} className="flex flex-col gap-1">
              {/* Hour label (only show every 4 hours) */}
              <div 
                className="text-xs w-3 h-3 flex items-center justify-center transition-all duration-300"
                style={{ 
                  color: colors.text.muted,
                  animationDelay: `${hour * 20}ms`,
                  animation: isVisible ? 'fadeInUp 0.6s ease-out forwards' : 'none'
                }}
              >
                {hour % 4 === 0 ? hour : ''}
              </div>
              
              {/* Day cells for this hour */}
              {heatmapData.map((dayRow, dayIndex) => {
                const commitPosition = getCommitTimePosition(commitTime)
                const isCommitTime = commitPosition.day === dayIndex && commitPosition.hour === hour
                
                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className="w-3 h-3 rounded-sm border transition-all duration-200 hover:scale-125 hover:z-10 cursor-pointer relative group heatmap-cell"
                    style={{
                      backgroundColor: getColorIntensity(dayRow[hour]),
                      borderColor: isCommitTime ? colors.primary : colors.border.default,
                      borderWidth: isCommitTime ? '2px' : '1px',
                      boxShadow: isCommitTime ? `0 0 8px ${colors.primary}40` : 'none',
                      animationDelay: `${(dayIndex * 50) + (hour * 20)}ms`,
                      animation: isVisible ? 'fadeInUp 0.6s ease-out forwards' : 'none'
                    }}
                    title={`${days[dayIndex]} ${hour}:00 - ${dayRow[hour]} commits${isCommitTime ? ' (This commit)' : ''}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate3d(0, 4px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        
        .heatmap-cell:hover {
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.3), 0 0 6px rgba(255, 255, 255, 0.2) !important;
          transform: scale(1.25) translateZ(0) !important;
        }
      `}</style>
    </div>
  )
}
