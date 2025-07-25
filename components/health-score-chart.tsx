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
import { TrendingUp } from 'lucide-react'

// Custom dot component that shows selection state
const CustomDot = ({ cx, cy, payload, isSelected }: any) => {
  if (!cx || !cy) return null
  
  return (
    <g>
      {/* Background circle for selected state */}
      {isSelected && (
        <circle
          cx={cx}
          cy={cy}
          r={8}
          fill="rgba(16, 185, 129, 0.2)"
          stroke="none"
        />
      )}
      {/* Main dot */}
      <circle
        cx={cx}
        cy={cy}
        r={isSelected ? 6 : 4}
        fill={isSelected ? '#ffffff' : '#10b981'}
        stroke={isSelected ? '#10b981' : '#ffffff'}
        strokeWidth={isSelected ? 3 : 2}
        style={{ cursor: 'pointer' }}
      />
    </g>
  )
}

interface HealthScoreData {
  date: string
  score: number
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
}

interface HealthScoreChartProps {
  data: HealthScoreData[]
  className?: string
  height?: number
  onDataPointSelect?: (data: HealthScoreData) => void
  selectedDate?: string
  scorecardData?: ScorecardData
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3 shadow-lg backdrop-blur-sm">
        <div className="text-sm text-gray-300 mb-1">
          {format(parseISO(data.date), 'MMM dd, yyyy')}
        </div>
        <div className="text-lg font-semibold text-green-400">
          {data.score} Health Score
        </div>
      </div>
    )
  }
  return null
}

const CustomXAxisTick = ({ x, y, payload }: any) => {
  const date = parseISO(payload.value)
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill="#9CA3AF"
        fontSize={11}
        className="font-medium"
      >
        {format(date, 'MMM dd')}
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
        fontSize={11}
        className="font-medium"
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
  scorecardData
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

  // Sort data by date to ensure proper ordering
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Calculate min and max for better Y-axis scaling
  const scores = sortedData.map(d => d.score)
  const minScore = Math.max(0, Math.min(...scores) - 5)
  const maxScore = Math.min(100, Math.max(...scores) + 5)

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
  const selectedDataPoint = sortedData.find(d => d.date === currentSelectedDate)

  return (
    <div className={`w-full ${className}`}>
      <div style={{ height: `${height}px`, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={sortedData}
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
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              opacity={0.3}
              vertical={false}
            />
            
            <XAxis
              dataKey="date"
              tick={<CustomXAxisTick />}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              interval="preserveStartEnd"
            />
            
            <YAxis
              domain={[minScore, maxScore]}
              tick={<CustomYAxisTick />}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              width={40}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Area
              type="monotone"
              dataKey="score"
              stroke="#10b981"
              strokeWidth={3}
              fill="url(#healthGradient)"
              dot={(props) => (
                <CustomDot
                  {...props}
                  isSelected={props.payload.date === currentSelectedDate}
                />
              )}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Selected Data Point Display */}
      {selectedDataPoint && (
        <div className="mt-4 space-y-4">
          {/* Health Score Data */}
          <div className="p-4 bg-gray-900/30 border border-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {format(parseISO(selectedDataPoint.date), 'MMMM d, yyyy')} Health Data
                </h3>
                <p className="text-sm text-gray-400">
                  Health Score: <span className="text-green-400 font-semibold">{selectedDataPoint.score}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  {selectedDataPoint.score}
                </div>
                <div className="text-xs text-gray-500">Health Score</div>
              </div>
            </div>
          </div>

          {/* Scorecard Health Data */}
          {scorecardData && (
            <div className="p-4 bg-gray-900/30 border border-gray-800 rounded-lg">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Scorecard Health Assessment
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  OpenSSF Scorecard from {format(parseISO(scorecardData.date), 'MMMM d, yyyy')}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-white">
                      {scorecardData.score}
                    </div>
                    <div className="text-sm text-gray-400">out of 10</div>
                  </div>
                  <div className="w-32 bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${getScorecardScoreBgColor(scorecardData.score)}`}
                      style={{ width: `${Math.max(0, scorecardData.score) * 10}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* All Scorecard Checks */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">All Checks</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {scorecardData.checks.map((check, index) => (
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