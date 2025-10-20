"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, AlertTriangle, FileText, GitCommit, GitBranch, Plus, Minus, FileIcon, BarChart3 } from "lucide-react"
import { colors } from "@/lib/design-system"
import { dummyCommits, CommitData } from "@/lib/dummyCommitData"
import Image from "next/image"
import CommitBehaviorGraph from "./CommitBehaviorGraph"
import ContributorHeatmap from "./ContributorHeatmap"

// Helper function to get colors based on anomaly score
function getAnomalyColors(score: number) {
  if (score >= 25) {
    return {
      border: 'rgb(239, 68, 68)', // Red
      text: 'rgb(239, 68, 68)' // Red
    }
  } else if (score >= 15) {
    return {
      border: 'rgb(245, 158, 11)', // Orange
      text: 'rgb(245, 158, 11)' // Orange
    }
  } else {
    return {
      border: 'none',
      text: colors.text.secondary
    }
  }
}

// Group commits by date
function groupCommitsByDate(commits: CommitData[]) {
  const groups: { [key: string]: CommitData[] } = {}
  
  commits.forEach(commit => {
    const date = getDateFromTimestamp(commit.timestamp)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(commit)
  })
  
  return groups
}

function getDateFromTimestamp(timestamp: string): string {
  // Convert relative timestamps to date strings for grouping
  const now = new Date()
  if (timestamp.includes('days ago')) {
    const days = parseInt(timestamp.split(' ')[0])
    const date = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } else if (timestamp.includes('week ago')) {
    const date = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } else if (timestamp.includes('weeks ago')) {
    const weeks = parseInt(timestamp.split(' ')[0])
    const date = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }
  return 'Recent'
}

interface CommitItemProps {
  commit: CommitData
  isLast?: boolean
}

function CommitItem({ commit, isLast = false }: CommitItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const isAnomaly = commit.anomalyScore >= 20
  const anomalyColors = getAnomalyColors(commit.anomalyScore)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div 
      className={`relative transform transition-all duration-500 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
      style={{ transitionDelay: `${Math.random() * 200}ms` }}
    >
      {/* Card with enhanced animations */}
      <div 
        className="rounded-xl p-4 border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer group"
        style={{ 
          backgroundColor: colors.background.card,
          borderColor: anomalyColors.border,
          borderWidth: anomalyColors.border === 'none' ? '1px' : '1px',
          boxShadow: isAnomaly ? `0 0 20px ${anomalyColors.border}40` : 'none'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Main content with Show Details on the right */}
        <div className="flex items-start gap-4">
          {/* Left side content */}
          <div className="flex-1">
            {/* Header with avatar, name, and anomaly score */}
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <Image
                  src={commit.contributor.avatar || 'https://avatars.githubusercontent.com/u/169111517?s=400&v=4'}
                  alt={commit.contributor.name}
                  width={24}
                  height={24}
                  className="rounded-full transition-transform duration-200 group-hover:scale-110"
                />
                {isAnomaly && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></div>
                )}
              </div>
              <span className="font-semibold transition-colors duration-200 group-hover:text-blue-400" style={{ color: colors.text.primary }}>
                {commit.contributor.name}
              </span>
              <div className="flex items-center gap-1">
                <span 
                  className="text-sm font-medium px-2 py-1 rounded-full transition-all duration-200"
                  style={{ 
                    color: anomalyColors.text,
                    backgroundColor: isAnomaly ? `${anomalyColors.text}20` : 'transparent'
                  }}
                >
                  {commit.anomalyScore}/30
                </span>
              </div>
            </div>
            
            {/* Commit message */}
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              {commit.message}
            </p>
          </div>
          
          {/* Show Details button on the right, vertically centered */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className="flex items-center gap-1 transition-all duration-200 hover:bg-blue-500/10 hover:text-blue-400"
              style={{ color: colors.text.secondary }}
            >
              <div className="flex items-center gap-1">
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 transition-transform duration-200" />
                    <span className="transition-opacity duration-200">Hide Details</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                    <span className="transition-opacity duration-200">Show Details</span>
                  </>
                )}
              </div>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Expanded content */}
      {isExpanded && (
        <div 
          className="mt-4 rounded-xl p-6 border animate-in slide-in-from-top-2 fade-in duration-300" 
          style={{ 
            backgroundColor: colors.background.card,
            borderColor: anomalyColors.border,
            borderWidth: '1px'
          }}
        >
          <div className="space-y-8">
            {/* Main Title with Commit Info */}
            <div>
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.text.primary }}>
                Commit Details
              </h3>
              <div className="flex flex-wrap gap-6 text-sm" style={{ color: colors.text.secondary }}>
                <span className="text-green-400">+{commit.contributorProfile.avgLinesChanged.added}</span>
                <span className="text-red-400">-{commit.contributorProfile.avgLinesChanged.deleted}</span>
                <span>{commit.contributorProfile.avgFilesChanged} files</span>
                <span>{commit.contributorProfile.thisCommitTime}</span>
              </div>
            </div>

            {/* Anomaly Score */}
            <div>
              <div className="mb-4">
                <div className="space-y-1">
                  <div className="text-sm" style={{ color: colors.text.primary }}>Anomaly Score</div>
                  <div className="text-2xl font-bold" style={{ color: anomalyColors.text }}>
                    {commit.anomalyScore}/30
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: colors.text.secondary }}>Suspicious Timestamp</span>
                  <span className="text-sm font-medium text-orange-500">+2</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: colors.text.secondary }}>New Files Changed</span>
                  <span className="text-sm font-medium text-red-500">+5</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: colors.text.secondary }}>Abnormal Lines Changed</span>
                  <span className="text-sm font-medium text-yellow-500">+3</span>
                </div>
              </div>
            </div>

            {/* Contributor Behavior */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left side - Metrics */}
                <div>
                  <div className="mb-4">
                    <div className="text-sm" style={{ color: colors.text.primary }}>Past Contributor Behavior</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <GitBranch className="h-4 w-4" style={{ color: colors.text.secondary }} />
                      <span className="text-sm" style={{ color: colors.text.secondary }}>Total Commits</span>
                      <span className="text-sm font-medium" style={{ color: colors.text.primary }}>47</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Plus className="h-4 w-4 text-green-400" />
                      <span className="text-sm" style={{ color: colors.text.secondary }}>Average Lines Added</span>
                      <span className="text-sm font-medium" style={{ color: colors.text.primary }}>{commit.contributorProfile.avgLinesChanged.added} ± 15</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Minus className="h-4 w-4 text-red-400" />
                      <span className="text-sm" style={{ color: colors.text.secondary }}>Average Lines Deleted</span>
                      <span className="text-sm font-medium" style={{ color: colors.text.primary }}>{commit.contributorProfile.avgLinesChanged.deleted} ± 8</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-4 w-4" style={{ color: colors.text.secondary }} />
                      <span className="text-sm" style={{ color: colors.text.secondary }}>Average Files Changed</span>
                      <span className="text-sm font-medium" style={{ color: colors.text.primary }}>{commit.contributorProfile.avgFilesChanged} ± 1.2</span>
                    </div>
                  </div>
                </div>
                
                {/* Right side - Heatmap */}
                <div className="col-span-2">
                  <div className="mb-4">
                    <div className="text-sm" style={{ color: colors.text.primary }}>Typical Contribution Times</div>
                  </div>
                  <ContributorHeatmap 
                    heatmapData={commit.contributorProfile.heatmapData} 
                    showTitle={false} 
                    commitTime={commit.contributorProfile.thisCommitTime}
                  />
                </div>
              </div>
            </div>
            
            {/* File Touch Analysis */}
            <div>
              <h4 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>
                File Touch Analysis
              </h4>
              <CommitBehaviorGraph 
                height={400} 
                showCard={false}
                commitId={commit.id}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CommitTimeline() {
  const [isVisible, setIsVisible] = useState(false)
  const commitGroups = groupCommitsByDate(dummyCommits)
  const sortedDates = Object.keys(commitGroups).sort((a, b) => {
    // Sort dates in descending order (most recent first)
    return new Date(b).getTime() - new Date(a).getTime()
  })

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`space-y-0 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {sortedDates.map((date, dateIndex) => (
        <div 
          key={date} 
          className="mb-12 transform transition-all duration-500 ease-out"
          style={{ 
            marginTop: '30px',
            animationDelay: `${dateIndex * 100}ms`,
            animation: isVisible ? 'slideInUp 0.6s ease-out forwards' : 'none'
          }}
        >
          {/* GitHub-style date header with commit icon */}
          <div className="flex items-center gap-3 mb-4 group">
            <div className="w-4 h-4 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
              <GitCommit className="h-4 w-4 transition-colors duration-200 group-hover:text-blue-400" style={{ color: colors.text.secondary }} />
            </div>
            <h3 className="text-sm font-medium transition-colors duration-200 group-hover:text-white" style={{ color: colors.text.secondary }}>
              Commits on {date}
            </h3>
          </div>
          
          {/* Commits for this date */}
          <div className="space-y-3">
            {commitGroups[date].map((commit, commitIndex) => (
              <div
                key={commit.id}
                className="transform transition-all duration-500 ease-out"
                style={{
                  animationDelay: `${(dateIndex * 100) + (commitIndex * 50)}ms`,
                  animation: isVisible ? 'slideInUp 0.6s ease-out forwards' : 'none'
                }}
              >
                <CommitItem 
                  commit={commit} 
                  isLast={commitIndex === commitGroups[date].length - 1}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translate3d(0, 8px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>
    </div>
  )
}
