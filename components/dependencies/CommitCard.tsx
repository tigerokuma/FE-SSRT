"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, AlertTriangle, User, Clock, FileText, GitCommit } from "lucide-react"
import { colors } from "@/lib/design-system"
import { CommitData } from "@/lib/dummyCommitData"
import CommitBehaviorGraph from "./CommitBehaviorGraph"
import ContributorHeatmap from "./ContributorHeatmap"

interface CommitCardProps {
  commit: CommitData
  isLast?: boolean
}

export default function CommitCard({ commit, isLast = false }: CommitCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  
  const isAnomaly = commit.anomalyScore >= 20
  const anomalyColor = isAnomaly ? '#f59e0b' : colors.text.secondary

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div 
      className={`relative transform transition-all duration-500 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
      style={{ transitionDelay: `${Math.random() * 200}ms` }}
    >
      <Card 
        className={`transition-all duration-300 hover:shadow-lg hover:scale-[1.01] cursor-pointer group ${
          isExpanded ? 'mb-6' : 'mb-4'
        }`}
        style={{ 
          backgroundColor: isExpanded ? colors.background.card : colors.background.card,
          borderColor: isAnomaly ? '#f59e0b' : colors.border.default,
          borderWidth: isAnomaly ? '2px' : '1px',
          boxShadow: isAnomaly ? `0 0 20px ${anomalyColor}40` : 'none'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardContent className="p-4">
          {/* Collapsed content */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              {/* Avatar */}
              <div className="relative">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: colors.primary }}
                >
                  {commit.contributor.name.split(' ').map(n => n[0]).join('')}
                </div>
                {isAnomaly && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-white flex items-center justify-center">
                    <AlertTriangle className="h-2 w-2 text-white" />
                  </div>
                )}
              </div>
              
              {/* Commit info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold" style={{ color: colors.text.primary }}>
                    {commit.contributor.name}
                  </span>
                  <span className="text-sm" style={{ color: colors.text.secondary }}>
                    {commit.timestamp}
                  </span>
                </div>
                
                <p className="text-sm mb-3" style={{ color: colors.text.primary }}>
                  {commit.message}
                </p>
                
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-green-400">+{commit.linesAdded}</span>
                    <span className="text-red-400">-{commit.linesDeleted}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" style={{ color: colors.text.secondary }} />
                    <span style={{ color: colors.text.secondary }}>{commit.filesChanged} files</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Anomaly score and expand button */}
            <div className="flex items-center gap-3">
              {/* Anomaly score */}
              <div className="flex items-center gap-2">
                <span 
                  className="text-sm font-medium px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: isAnomaly ? '#f59e0b' : colors.background.main,
                    color: isAnomaly ? colors.text.primary : colors.text.secondary
                  }}
                >
                  {commit.anomalyScore}/30
                </span>
                {isAnomaly && (
                  <div className="flex items-center gap-1 text-sm" style={{ color: '#f59e0b' }}>
                    <AlertTriangle className="h-4 w-4" />
                    <span>Anomaly</span>
                  </div>
                )}
              </div>
              
              {/* Expand button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
                className="flex items-center gap-1 transition-all duration-200 hover:bg-blue-500/10 hover:text-blue-400"
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
          
          {/* Expanded content */}
          {isExpanded && (
            <div className="mt-6 space-y-6 animate-in slide-in-from-top-2 fade-in duration-300">
              {/* Contributor Profile Summary */}
              <div>
                <h4 className="text-lg font-semibold mb-4" style={{ color: colors.text.primary }}>
                  Contributor Profile Summary
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Stats */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" style={{ color: colors.primary }} />
                      <div>
                        <div className="text-sm" style={{ color: colors.text.secondary }}>
                          Avg. Lines Changed
                        </div>
                        <div className="font-medium" style={{ color: colors.text.primary }}>
                          {commit.contributorProfile.avgLinesChanged.added + commit.contributorProfile.avgLinesChanged.deleted} 
                          <span className="text-green-400"> (+{commit.contributorProfile.avgLinesChanged.added}</span>
                          <span className="text-red-400">, -{commit.contributorProfile.avgLinesChanged.deleted})</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" style={{ color: colors.primary }} />
                      <div>
                        <div className="text-sm" style={{ color: colors.text.secondary }}>
                          Avg. Files Changed
                        </div>
                        <div className="font-medium" style={{ color: colors.text.primary }}>
                          ~{commit.contributorProfile.avgFilesChanged}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" style={{ color: colors.primary }} />
                      <div>
                        <div className="text-sm" style={{ color: colors.text.secondary }}>
                          This commit time
                        </div>
                        <div className="font-medium" style={{ color: colors.text.primary }}>
                          {commit.contributorProfile.thisCommitTime}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Heatmap */}
                  <div>
                    <ContributorHeatmap heatmapData={commit.contributorProfile.heatmapData} />
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
