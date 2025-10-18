"use client"

import { colors } from "@/lib/design-system"

interface ContributorHeatmapProps {
  heatmapData: number[][]
  className?: string
}

export default function ContributorHeatmap({ heatmapData, className = "" }: ContributorHeatmapProps) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getColorIntensity = (value: number) => {
    // Convert value (0-1) to color intensity
    const intensity = Math.floor(value * 255)
    return `rgb(${intensity}, ${intensity}, ${intensity})`
  }

  return (
    <div className={`${className}`}>
      <div className="text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
        Typical Contribution Times
      </div>
      
      <div className="flex gap-1">
        {/* Days labels */}
        <div className="flex flex-col gap-1 mr-2">
          {days.map((day, index) => (
            <div 
              key={day}
              className="text-xs w-8 h-4 flex items-center justify-center"
              style={{ color: colors.text.secondary }}
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
                className="text-xs w-3 h-4 flex items-center justify-center"
                style={{ color: colors.text.muted }}
              >
                {hour % 4 === 0 ? hour : ''}
              </div>
              
              {/* Day cells for this hour */}
              {heatmapData.map((dayRow, dayIndex) => (
                <div
                  key={`${dayIndex}-${hour}`}
                  className="w-3 h-4 rounded-sm border"
                  style={{
                    backgroundColor: getColorIntensity(dayRow[hour]),
                    borderColor: colors.border.default
                  }}
                  title={`${days[dayIndex]} ${hour}:00 - Activity: ${Math.round(dayRow[hour] * 100)}%`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs" style={{ color: colors.text.muted }}>Less</span>
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-sm border"
              style={{
                backgroundColor: getColorIntensity(i / 4),
                borderColor: colors.border.default
              }}
            />
          ))}
        </div>
        <span className="text-xs" style={{ color: colors.text.muted }}>More</span>
      </div>
    </div>
  )
}
