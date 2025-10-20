"use client"

import React, { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { TrendingUp, Eye, ChevronRight } from 'lucide-react'

// Custom dot component that shows selection state
const CustomDot = ({ cx, cy, payload, isSelected }: any) => {
  if (!cx || !cy) return null
  
  // Get the color based on the score
  const getScoreColor = (score: number) => {
    if (score >= 7.5) return "#10b981" // Green
    if (score >= 4) return "#f97316" // Orange
    return "#ef4444" // Red
  }
  
  const scoreColor = getScoreColor(payload.score)
  
  return (
    <g>
      {/* Background circle for selected state */}
      {isSelected && (
        <circle
          cx={cx}
          cy={cy}
          r={8}
          fill={`${scoreColor}20`} // 20% opacity
          stroke="none"
        />
      )}
      {/* Main dot */}
      <circle
        cx={cx}
        cy={cy}
        r={isSelected ? 6 : 4}
        fill={isSelected ? '#ffffff' : scoreColor}
        stroke={isSelected ? scoreColor : '#ffffff'}
        strokeWidth={isSelected ? 3 : 2}
        style={{ cursor: 'pointer' }}
      />
    </g>
  )
}

interface HealthScoreData {
  date: string
  score: number
  commitSha?: string
}

interface ScorecardCheck {
  name: string
  score: number
  reason: string
  details: string[] | null
  documentation: {
    short: string
    url: string
  }
}

interface ScorecardData {
  date: string
  score: number
  checks: ScorecardCheck[]
  commitSha?: string
}

interface HealthScoreChartProps {
  data: HealthScoreData[]
  className?: string
  height?: number
  onDataPointSelect?: (data: HealthScoreData) => void
  selectedDate?: string
  scorecardData?: ScorecardData | ScorecardData[]
  layout?: 'default' | 'side-by-side'
  onViewFullAssessment?: (scorecardData: ScorecardData) => void
  tooltipType?: 'health' | 'commits'
}

const CustomTooltip = ({ active, payload, label, tooltipType = 'health' }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    
    // Get color based on score
    const getScoreColor = (score: number) => {
      if (score >= 7.5) return "text-green-400"
      if (score >= 4) return "text-orange-400"
      return "text-red-400"
    }
    
    return (
      <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3 shadow-lg backdrop-blur-sm">
        <div className="text-sm text-gray-300 mb-1">
          {format(parseISO(data.date), 'MMM dd, yyyy')}
        </div>
        <div className={`text-lg font-semibold ${getScoreColor(data.score)}`}>
          {tooltipType === 'commits' 
            ? `${data.score} commits in ${format(parseISO(data.date), 'MMMM')}`
            : `${data.score} Health Score`
          }
        </div>
        {data.commitSha && (
          <div className="text-xs text-gray-400 mt-1">
            Commit: {data.commitSha.substring(0, 8)}
          </div>
        )}
      </div>
    )
  }
  return null
}

const CustomXAxisTick = ({ x, y, payload }: any) => {
  const date = new Date(payload.value)
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill="#9CA3AF"
        fontSize={12}
      >
        {format(date, 'MMM dd, yyyy')}
      </text>
    </g>
  )
}

const CustomYAxisTick = ({ x, y, payload }: any) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill="#9CA3AF"
        fontSize={12}
      >
        {payload.value}
      </text>
    </g>
  )
}

export function HealthScoreChart({ 
  data, 
  className, 
  height = 256, 
  onDataPointSelect,
  selectedDate,
  scorecardData,
  layout = 'default',
  onViewFullAssessment,
  tooltipType = 'health'
}: HealthScoreChartProps) {
  // Helper functions for scorecard colors
  const getScorecardScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400"
    if (score >= 6) return "text-yellow-400"
    if (score >= 4) return "text-orange-400"
    if (score >= 0) return "text-red-400"
    return "text-gray-400" // -1 or below
  }

  const getScorecardScoreBgColor = (score: number) => {
    if (score >= 8) return "bg-green-500"
    if (score >= 6) return "bg-yellow-500"
    if (score >= 4) return "bg-orange-500"
    if (score >= 0) return "bg-red-500"
    return "bg-gray-500" // -1 or below
  }

  // Get color for graph based on score
  const getGraphColor = (score: number) => {
    if (score >= 7.5) return "#10b981" // Green
    if (score >= 4) return "#f97316" // Orange
    return "#ef4444" // Red
  }

  // Sort data by date to ensure proper ordering
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Transform data to use timestamps for proper time-based scaling
  const timeBasedData = sortedData.map(item => ({
    ...item,
    timestamp: new Date(item.date).getTime()
  }))

  // Debug: Log the data being passed to the chart
  console.log('HealthScoreChart data:', sortedData)

  // Calculate min and max for better Y-axis scaling (0-10 scale)
  const scores = sortedData.map(d => d.score)
  const minScore = Math.max(0, Math.min(...scores) - 1)
  const maxScore = Math.min(10, Math.max(...scores) + 1)

  // Set default selected date to the most recent if not provided
  const [currentSelectedDate, setCurrentSelectedDate] = useState<string>(
    selectedDate || (sortedData.length > 0 ? sortedData[sortedData.length - 1].date : '')
  )

  // Initialize the selected data when component mounts (only once)
  useEffect(() => {
    if (sortedData.length > 0 && !currentSelectedDate) {
      const mostRecent = sortedData[sortedData.length - 1]
      setCurrentSelectedDate(mostRecent.date)
      onDataPointSelect?.(mostRecent)
    }
  }, [sortedData, currentSelectedDate, onDataPointSelect])

  // Update selected date when prop changes (external control)
  useEffect(() => {
    if (selectedDate && selectedDate !== currentSelectedDate) {
      setCurrentSelectedDate(selectedDate)
    }
  }, [selectedDate, currentSelectedDate])

  // Get the currently selected data point
  const selectedDataPoint = timeBasedData.find(d => d.date === currentSelectedDate)

  // Get the scorecard data for the selected date
  let selectedScorecardData: ScorecardData | null = null
  
  if (scorecardData && selectedDataPoint) {
    if (Array.isArray(scorecardData)) {
      // Find the scorecard data that matches the selected date
      selectedScorecardData = scorecardData.find(sc => sc.date === selectedDataPoint.date) || null
    } else {
      // Single scorecard data object
      selectedScorecardData = scorecardData
    }
  }

  if (layout === 'side-by-side') {
    return (
      <div className={`w-full ${className}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scorecard Preview - Left 1/3 */}
          <div className="lg:col-span-1">
            {selectedDataPoint && selectedScorecardData && (
              <div className="space-y-4">
                {/* Title with Logo */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <img src="/Scorecard_logo.png" alt="Scorecard" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Scorecard Health History
                  </h3>
                </div>
                
                {/* Date Info */}
                <p className="text-sm text-gray-400">
                  OpenSSF Scorecard from {format(parseISO(selectedScorecardData.date), 'MMMM d, yyyy')}
                  {selectedScorecardData.commitSha && (
                    <span className="ml-2 text-xs text-gray-500">
                      (Commit: {selectedScorecardData.commitSha.substring(0, 8)})
                    </span>
                  )}
                </p>
                
                {/* Spacing */}
                <div className="h-4"></div>
                
                {/* Overall Score */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-white transition-all duration-200 hover:scale-105 cursor-pointer">
                      {selectedScorecardData.score}
                    </div>
                    <div className="text-sm text-gray-400">out of 10</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${getScorecardScoreBgColor(selectedScorecardData.score)}`}
                        style={{ width: `${Math.max(0, selectedScorecardData.score) * 10}%` }}
                      />
                    </div>
                    <button 
                      onClick={() => {
                        onViewFullAssessment?.(selectedScorecardData)
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Total Checks */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Total Checks</span>
                  <span className="text-sm font-medium text-white">
                    {selectedScorecardData.checks.length}
                  </span>
                </div>


              </div>
            )}
          </div>
          
          {/* Graph - Right 2/3 */}
          <div className="lg:col-span-2">
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timeBasedData}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 20,
                    bottom: 20,
                  }}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const clickedData = data.activePayload[0].payload
                      console.log('Chart clicked:', clickedData)
                      setCurrentSelectedDate(clickedData.date)
                      onDataPointSelect?.(clickedData)
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={selectedDataPoint ? getGraphColor(selectedDataPoint.score) : "#10b981"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={selectedDataPoint ? getGraphColor(selectedDataPoint.score) : "#10b981"} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>

                  
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#374151" 
                    opacity={0.3}
                    vertical={false}
                  />
                  
                  <XAxis
                    dataKey="timestamp"
                    tick={<CustomXAxisTick />}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    interval="preserveStartEnd"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                  />
                  
                  <YAxis
                    domain={[minScore, maxScore]}
                    tick={<CustomYAxisTick />}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  
                  <Tooltip content={(props) => <CustomTooltip {...props} tooltipType={tooltipType} />} />
                  
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke={selectedDataPoint ? getGraphColor(selectedDataPoint.score) : "#10b981"}
                    strokeWidth={3}
                    fill="url(#healthGradient)"
                    dot={(props: any) => {
                      const { key: dotKey, ...rest } = props || {};
                      return (
                        <CustomDot
                          key={dotKey}
                          {...rest}
                          isSelected={rest.payload?.date === currentSelectedDate}
                        />
                      );
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default layout (original)
  return (
    <div className={`w-full ${className}`}>
      <div style={{ height: `${height}px`, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={timeBasedData}
            margin={{
              top: 20,
              right: 20,
              left: 20,
              bottom: 20,
            }}
            onClick={(data) => {
              if (data && data.activePayload && data.activePayload[0]) {
                const clickedData = data.activePayload[0].payload
                console.log('Chart clicked:', clickedData)
                setCurrentSelectedDate(clickedData.date)
                onDataPointSelect?.(clickedData)
              }
            }}
          >
            <defs>
              <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={selectedDataPoint ? getGraphColor(selectedDataPoint.score) : "#10b981"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={selectedDataPoint ? getGraphColor(selectedDataPoint.score) : "#10b981"} stopOpacity={0.05} />
              </linearGradient>
            </defs>

            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              opacity={0.3}
              vertical={false}
            />
            
            <XAxis
              dataKey="timestamp"
              tick={<CustomXAxisTick />}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              interval="preserveStartEnd"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
            />
            
            <YAxis
              domain={[minScore, maxScore]}
              tick={<CustomYAxisTick />}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            
            <Tooltip content={(props) => <CustomTooltip {...props} tooltipType={tooltipType} />} />
            
            <Area
              type="monotone"
              dataKey="score"
              stroke={selectedDataPoint ? getGraphColor(selectedDataPoint.score) : "#10b981"}
              strokeWidth={3}
              fill="url(#healthGradient)"
              dot={(props: any) => {
                const { key: dotKey, ...rest } = props || {};
                return (
                  <CustomDot
                    key={dotKey}
                    {...rest}
                    isSelected={rest.payload?.date === currentSelectedDate}
                  />
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Selected Data Point Display */}
      {selectedDataPoint && (
        <div className="mt-4 space-y-4">
          {/* Scorecard Health Data */}
          {selectedScorecardData && (
            <div className="p-4 bg-gray-900/30 border border-gray-800 rounded-lg">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Scorecard Health Assessment
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  OpenSSF Scorecard from {format(parseISO(selectedScorecardData.date), 'MMMM d, yyyy')}
                  {selectedScorecardData.commitSha && (
                    <span className="ml-2 text-xs text-gray-500">
                      (Commit: {selectedScorecardData.commitSha.substring(0, 8)})
                    </span>
                  )}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-white">
                      {selectedScorecardData.score}
                    </div>
                    <div className="text-sm text-gray-400">out of 10</div>
                  </div>
                  <div className="w-32 bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${getScorecardScoreBgColor(selectedScorecardData.score)}`}
                      style={{ width: `${Math.max(0, selectedScorecardData.score) * 10}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* All Scorecard Checks */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">All Checks</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedScorecardData.checks.map((check, index) => (
                    <div key={index} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-white truncate">{check.name}</span>
                        <div className={`text-sm font-bold ${getScorecardScoreColor(check.score)}`}>
                          {check.score}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {check.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 