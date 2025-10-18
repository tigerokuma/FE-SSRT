"use client"

import { useRef, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GitCommit, FileText, AlertTriangle } from "lucide-react"
import { colors } from "@/lib/design-system"

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-gray-950 rounded-lg">
      <div className="text-gray-400">Loading graph visualization...</div>
    </div>
  )
})

interface GraphNode {
  id: string
  name: string
  type: 'commit' | 'file'
  commitType?: 'current' | 'past'
  fileType?: 'familiar' | 'new'
  isSensitive?: boolean
  editCount?: number
  size: number
  color: string
  group?: string
  fx?: number
  fy?: number
}

interface GraphLink {
  source: string
  target: string
  thickness: number
  color: string
  opacity?: number
}

interface CommitBehaviorGraphProps {
  width?: number
  height?: number
  commitId?: string
  showCard?: boolean
}

export default function CommitBehaviorGraph({ 
  width, 
  height = 600,
  commitId,
  showCard = true
}: CommitBehaviorGraphProps) {
   const graphRef = useRef<any>(null)
   const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
   const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
   const [isClient, setIsClient] = useState(false)
   const [showTooltip, setShowTooltip] = useState(false)
   const [containerWidth, setContainerWidth] = useState(1200)
   const [showDiffPanel, setShowDiffPanel] = useState(false)
   const [selectedFile, setSelectedFile] = useState<GraphNode | null>(null)
   const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
   const isHoveringRef = useRef(false)
   const containerRef = useRef<HTMLDivElement>(null)

  // Ensure component only renders on client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Handle body scroll and keyboard shortcuts when diff panel is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDiffPanel) {
        setShowDiffPanel(false)
        setSelectedFile(null)
      }
    }

    if (showDiffPanel) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showDiffPanel])

  const generateGraphData = () => {
    const nodes: GraphNode[] = []
    const links: GraphLink[] = []

     // Central current commit - larger and prominent (fixed further right)
     nodes.push({
       id: 'current-commit',
       name: 'This commit',
       type: 'commit',
       commitType: 'current',
       size: 28,
       color: '#60a5fa',
       group: 'current',
       fx: 300, // Move further to the right
       fy: 0
     })

    // Past commits cluster (left side)
    const pastCommits = [
      { id: 'past-1', name: '2a9f3e1', editCount: 12 },
      { id: 'past-2', name: 'f7e9c4a', editCount: 8 },
      { id: 'past-3', name: 'b2d4f89', editCount: 15 },
      { id: 'past-4', name: 'c8e1a92', editCount: 6 },
      { id: 'past-5', name: 'd9f2b7c', editCount: 11 },
      { id: 'past-6', name: 'e4a8c55', editCount: 9 },
      { id: 'past-7', name: '91h2i3d', editCount: 7 }
    ]

     pastCommits.forEach((commit, index) => {
       // Create a more spread out cluster
       const baseRadius = 50
       const randomRadius = Math.random() * 25
       const angle = (index / pastCommits.length) * Math.PI * 1.8 - Math.PI * 0.5
       const x = -280 + Math.cos(angle) * (baseRadius + randomRadius) + (Math.random() - 0.5) * 20
       const y = Math.sin(angle) * (baseRadius + randomRadius) + (Math.random() - 0.5) * 20
      
      nodes.push({
        id: commit.id,
        name: commit.name,
        type: 'commit',
        commitType: 'past',
        size: 12,
        color: '#64748b',
        group: 'past',
        fx: x,
        fy: y
      })
    })

     // Familiar files cluster (right side) - with varying sizes based on edit count
     const familiarFiles = [
       { id: 'file-1', name: 'main.py', editCount: 24, sensitive: false },
       { id: 'file-2', name: 'helpers.js', editCount: 18, sensitive: false },
       { id: 'file-3', name: 'test_main.py', editCount: 12, sensitive: false },
       { id: 'file-4', name: 'utils.py', editCount: 15, sensitive: false },
       { id: 'file-5', name: 'parser.js', editCount: 9, sensitive: false },
       { id: 'file-6', name: 'components.py', editCount: 21, sensitive: false },
       { id: 'file-7', name: 'api.ts', editCount: 14, sensitive: false },
       { id: 'file-8', name: 'auth.py', editCount: 7, sensitive: true },
       { id: 'file-9', name: 'database.yml', editCount: 5, sensitive: true },
       { id: 'file-10', name: 'models.py', editCount: 16, sensitive: false },
       { id: 'file-11', name: 'config.py', editCount: 8, sensitive: false },
       { id: 'file-12', name: 'routes.js', editCount: 13, sensitive: false },
       { id: 'file-13', name: 'middleware.ts', editCount: 6, sensitive: false },
       { id: 'file-14', name: 'types.ts', editCount: 11, sensitive: false },
       { id: 'file-15', name: 'services.py', editCount: 19, sensitive: false }
     ]

     familiarFiles.forEach((file, index) => {
       // Create a more spread out cluster with much more size variation
       const baseRadius = 80
       const randomRadius = Math.random() * 40
       const angle = (index / familiarFiles.length) * Math.PI * 2
       const x = 80 + Math.cos(angle) * (baseRadius + randomRadius) + (Math.random() - 0.5) * 30
       const y = Math.sin(angle) * (baseRadius + randomRadius) + (Math.random() - 0.5) * 30
       // Much more size variation - 1-10x difference
       const size = 4 + (file.editCount / 2) + Math.random() * 8
      
      nodes.push({
        id: file.id,
        name: file.name,
        type: 'file',
        fileType: 'familiar',
        isSensitive: file.sensitive,
        editCount: file.editCount,
        size: size,
        color: file.sensitive ? '#a78bfa' : '#34d399',
        group: 'familiar',
        fx: x,
        fy: y
      })
    })

     // New files cluster (bottom)
     const newFiles = [
       { id: 'new-1', name: 'feature-x.ts', sensitive: false },
       { id: 'new-2', name: 'experimental.js', sensitive: false },
       { id: 'new-3', name: 'prototype.py', sensitive: false },
       { id: 'new-4', name: '.env.local', sensitive: true },
       { id: 'new-5', name: 'analytics.js', sensitive: false },
       { id: 'new-6', name: 'dashboard.tsx', sensitive: false },
       { id: 'new-7', name: 'webhook.py', sensitive: false },
       { id: 'new-8', name: 'cache.config', sensitive: true }
     ]

     newFiles.forEach((file, index) => {
       // Create a more spread out cluster
       const baseRadius = 60
       const randomRadius = Math.random() * 30
       const angle = (index / newFiles.length) * Math.PI * 2
       const x = 450 + Math.cos(angle) * (baseRadius + randomRadius) + (Math.random() - 0.5) * 25
       const y = Math.sin(angle) * (baseRadius + randomRadius) + (Math.random() - 0.5) * 25
      
      nodes.push({
        id: file.id,
        name: file.name,
        type: 'file',
        fileType: 'new',
        isSensitive: file.sensitive,
        editCount: 0,
        size: file.sensitive ? 14 : 12,
        color: file.sensitive ? '#c084fc' : '#f87171',
        group: 'new',
        fx: x,
        fy: y
      })
    })

    // Links from current commit to all files (stronger, more visible)
    const allFiles = [...familiarFiles, ...newFiles]
    allFiles.forEach(file => {
      const isSensitive = file.sensitive
      links.push({
        source: 'current-commit',
        target: file.id,
        thickness: isSensitive ? 3 : 2,
        color: isSensitive ? '#a78bfa' : '#60a5fa',
        opacity: 0.6
      })
    })

    // Links from past commits to familiar files (subtle)
    pastCommits.forEach((commit, i) => {
      const connectedFiles = familiarFiles.slice(
        (i * 2) % familiarFiles.length, 
        ((i * 2) % familiarFiles.length) + 3
      )
      connectedFiles.forEach(file => {
        links.push({
          source: commit.id,
          target: file.id,
          thickness: 0.5,
          color: '#475569',
          opacity: 0.2
        })
      })
    })

    // Internal cluster connections for cohesion
    for (let i = 0; i < pastCommits.length; i++) {
      if (i < pastCommits.length - 1) {
        links.push({
          source: pastCommits[i].id,
          target: pastCommits[i + 1].id,
          thickness: 0.5,
          color: '#334155',
          opacity: 0.3
        })
      }
    }

    return { nodes, links }
  }

  const { nodes, links } = generateGraphData()

  useEffect(() => {
    if (graphRef.current) {
      const fg = graphRef.current
      
       // Optimize forces for better clustering and stability
       fg.d3Force('charge').strength(-200)
       fg.d3Force('link').distance((link: any) => {
         if (link.source.id === 'current-commit' || link.target.id === 'current-commit') return 180
         if (link.source.type === 'commit' && link.target.type === 'file') return 150
         return 80
       }).strength(0.6)
       
       fg.d3Force('center').strength(0.02)
       fg.d3Force('collision', 25)
       fg.d3AlphaDecay(0.01)
       fg.d3VelocityDecay(0.6)
    }
  }, [])

  const handleNodeClick = (node: any) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node as GraphNode)
    
    // If it's a file node, show the diff panel
    if (node.type === 'file') {
      setSelectedFile(node as GraphNode)
      setShowDiffPanel(true)
    }
  }

   const handleNodeHover = (node: any) => {
     // Clear any existing timeout
     if (hoverTimeoutRef.current) {
       clearTimeout(hoverTimeoutRef.current)
     }
     
     if (node && !isHoveringRef.current) {
       isHoveringRef.current = true
       setHoveredNode(node as GraphNode)
       setShowTooltip(true)
     } else if (!node && isHoveringRef.current) {
       // Only hide if we're actually leaving the node area
       hoverTimeoutRef.current = setTimeout(() => {
         if (!isHoveringRef.current) {
           setShowTooltip(false)
           setHoveredNode(null)
         }
       }, 200)
     }
   }

   const handleNodeMouseEnter = (node: any) => {
     isHoveringRef.current = true
     if (hoverTimeoutRef.current) {
       clearTimeout(hoverTimeoutRef.current)
     }
     setHoveredNode(node as GraphNode)
     setShowTooltip(true)
   }

   const handleNodeMouseLeave = () => {
     isHoveringRef.current = false
     hoverTimeoutRef.current = setTimeout(() => {
       setShowTooltip(false)
       setHoveredNode(null)
     }, 200)
   }

  const getNodeLabel = (node: GraphNode) => {
    if (node.type === 'commit') {
      return node.commitType === 'current' ? node.name : node.name
    }
    return node.name
  }

  // Generate dummy diff data for the selected file
  const generateDiffData = (file: GraphNode) => {
    const diffLines = [
      { type: 'context', content: '// Main application logic', lineNumber: 1 },
      { type: 'context', content: 'function main() {', lineNumber: 2 },
      { type: 'removed', content: '  console.log("Old version");', lineNumber: 3 },
      { type: 'added', content: '  console.log("New version with suspicious changes");', lineNumber: 3 },
      { type: 'context', content: '  return true;', lineNumber: 4 },
      { type: 'context', content: '}', lineNumber: 5 },
      { type: 'context', content: '', lineNumber: 6 },
      { type: 'added', content: '// Suspicious new code', lineNumber: 7 },
      { type: 'added', content: 'function suspiciousFunction() {', lineNumber: 8 },
      { type: 'added', content: '  // This looks suspicious', lineNumber: 9 },
      { type: 'added', content: '  return false;', lineNumber: 10 },
      { type: 'added', content: '}', lineNumber: 11 }
    ]
    
    return diffLines
  }

  const renderDiffPanel = () => {
    if (!showDiffPanel || !selectedFile) return null

    const diffData = generateDiffData(selectedFile)

    return (
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
        onClick={() => {
          setShowDiffPanel(false)
          setSelectedFile(null)
        }}
      >
        <div 
          className="w-full max-w-4xl max-h-[80vh] rounded-lg overflow-hidden" 
          style={{ backgroundColor: colors.background.card, borderColor: colors.border.default }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.border.default }}>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                File Diff: {selectedFile.name}
              </h3>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {selectedFile.fileType === 'new' ? 'New file in this commit' : `Modified file (${selectedFile.editCount} previous edits)`}
                {selectedFile.isSensitive && <span className="ml-2 px-2 py-1 rounded text-xs" style={{ backgroundColor: '#8b5cf6', color: colors.text.primary }}>Sensitive</span>}
              </p>
            </div>
            <button
              onClick={() => {
                setShowDiffPanel(false)
                setSelectedFile(null)
              }}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              style={{ color: colors.text.secondary }}
            >
              ✕
            </button>
          </div>

          {/* Diff Content */}
          <div className="p-4 overflow-auto max-h-[60vh]">
            <div className="font-mono text-sm">
              {diffData.map((line, index) => (
                <div key={index} className="flex">
                  <div className="w-12 text-right pr-4 text-xs" style={{ color: colors.text.muted }}>
                    {line.lineNumber}
                  </div>
                  <div className="flex-1">
                    <span
                      className={`px-2 py-1 ${
                        line.type === 'added' ? 'bg-green-500/20 text-green-300' :
                        line.type === 'removed' ? 'bg-red-500/20 text-red-300' :
                        'text-gray-300'
                      }`}
                    >
                      {line.type === 'added' && '+'}
                      {line.type === 'removed' && '-'}
                      {line.type === 'context' && ' '}
                      {line.content}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: colors.border.default }}>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#10b981', color: colors.text.primary }}>
                +{diffData.filter(l => l.type === 'added').length} additions
              </span>
              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#ef4444', color: colors.text.primary }}>
                -{diffData.filter(l => l.type === 'removed').length} deletions
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {/* TODO: Implement copy diff */}}
                className="px-3 py-1 text-xs rounded border transition-colors"
                style={{ borderColor: colors.border.default, color: colors.text.secondary }}
              >
                Copy Diff
              </button>
              <button
                onClick={() => {/* TODO: Implement view full file */}}
                className="px-3 py-1 text-xs rounded transition-colors"
                style={{ backgroundColor: colors.primary, color: colors.text.primary }}
              >
                View Full File
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderNodeTooltip = () => {
    if (!hoveredNode) return null

    const node = hoveredNode
    if (node.type === 'commit') {
      return (
        <div className="space-y-1">
          <div className="font-semibold" style={{ color: colors.primary }}>
            {node.commitType === 'current' ? 'Current Commit' : 'Past Commit'}
          </div>
          <div className="text-sm" style={{ color: colors.text.primary }}>{node.name}</div>
        </div>
      )
    } else {
      const badges = []
      if (node.isSensitive) badges.push('Sensitive')
      if (node.fileType === 'new') badges.push('New')
      
      return (
        <div className="space-y-2">
          <div className="font-semibold" style={{ color: colors.text.primary }}>{node.name}</div>
          {badges.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {badges.map(badge => (
                <span key={badge} className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: '#8b5cf6', color: colors.text.primary }}>
                  {badge}
                </span>
              ))}
            </div>
          )}
          <div className="text-sm" style={{ color: colors.text.secondary }}>
            {node.fileType === 'new' 
              ? 'First time editing' 
              : `Edited ${node.editCount} times before`}
          </div>
        </div>
      )
    }
  }

  const stats = {
    familiar: nodes.filter(n => n.fileType === 'familiar').length,
    new: nodes.filter(n => n.fileType === 'new').length,
    sensitive: nodes.filter(n => n.isSensitive).length,
    totalFiles: nodes.filter(n => n.type === 'file').length
  }

  const graphContent = (
    <div ref={containerRef} className="relative rounded-xl overflow-hidden border w-full" style={{ backgroundColor: colors.background.main, borderColor: colors.border.default }}>
      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 backdrop-blur-md rounded-lg p-4 shadow-xl" style={{ backgroundColor: colors.background.card, borderColor: colors.border.default }}>
        <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: colors.text.secondary }}>Legend</div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#60a5fa' }}></div>
            <span className="text-xs" style={{ color: colors.text.primary }}>Current commit</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#64748b' }}></div>
            <span className="text-xs" style={{ color: colors.text.secondary }}>Past commits</span>
          </div>
          <div className="h-px my-2" style={{ backgroundColor: colors.border.default }}></div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#34d399' }}></div>
            <span className="text-xs" style={{ color: colors.text.secondary }}>Familiar files</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f87171' }}></div>
            <span className="text-xs" style={{ color: colors.text.secondary }}>New files</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#a78bfa' }}></div>
            <span className="text-xs" style={{ color: colors.text.secondary }}>Sensitive</span>
          </div>
        </div>
      </div>

      {/* Graph */}
      {isClient && (
        <ForceGraph2D
          ref={graphRef}
          graphData={{ nodes, links }}
          width={width || containerWidth}
          height={height}
          backgroundColor="rgba(0,0,0,0)"
          nodeCanvasObject={(node: any, ctx: any, globalScale: any) => {
            const label = getNodeLabel(node)
            const fontSize = node.type === 'commit' ? 11 : 10
            const displayFontSize = fontSize / globalScale
            
            // Reduced glow effect
            if (node.id === 'current-commit') {
              ctx.shadowColor = node.color
              ctx.shadowBlur = 8
            } else if (node.isSensitive) {
              ctx.shadowColor = node.color
              ctx.shadowBlur = 4
            } else {
              ctx.shadowColor = node.color
              ctx.shadowBlur = 2
            }
            
            // Draw main node
            ctx.fillStyle = node.color
            ctx.beginPath()
            ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI)
            ctx.fill()
            
            // Add border for current commit
            if (node.id === 'current-commit') {
              ctx.strokeStyle = '#93c5fd'
              ctx.lineWidth = 2.5
              ctx.stroke()
            } else if (selectedNode?.id === node.id) {
              ctx.strokeStyle = '#ffffff'
              ctx.lineWidth = 2
              ctx.stroke()
            }
            
            // Add subtle border for file nodes to indicate they're clickable
            if (node.type === 'file') {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
              ctx.lineWidth = 1
              ctx.stroke()
            }
            
            ctx.shadowBlur = 0
            
            // Draw label with better contrast - only show when zoomed in much closer
            if (globalScale > 2.5) {
              ctx.font = `${node.type === 'commit' ? '600' : '500'} ${displayFontSize}px Inter, system-ui, sans-serif`
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              
              const labelY = node.y + node.size + (10 / globalScale)
              
              // Text shadow for readability
              ctx.shadowColor = 'rgba(0,0,0,0.9)'
              ctx.shadowBlur = 4
              ctx.shadowOffsetY = 1
              
              // Use gray text instead of white
              ctx.fillStyle = '#9ca3af'
              ctx.fillText(label, node.x, labelY)
              
              ctx.shadowBlur = 0
              ctx.shadowOffsetY = 0
            }
          }}
          linkCanvasObject={(link: any, ctx: any) => {
            const opacity = link.opacity || 0.4
            ctx.globalAlpha = opacity
            ctx.strokeStyle = link.color
            ctx.lineWidth = link.thickness
            
            if (link.source.id === 'current-commit') {
              ctx.setLineDash([5, 3])
            }
            
            ctx.beginPath()
            ctx.moveTo(link.source.x, link.source.y)
            ctx.lineTo(link.target.x, link.target.y)
            ctx.stroke()
            
            ctx.setLineDash([])
            ctx.globalAlpha = 1
          }}
          onNodeClick={handleNodeClick}
          nodePointerAreaPaint={(node: any, color: any, ctx: any) => {
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(node.x, node.y, node.size + 6, 0, 2 * Math.PI)
            ctx.fill()
          }}
          cooldownTicks={150}
          enableZoomInteraction={true}
          enableNodeDrag={true}
        />
      )}

      {/* Hover tooltip */}
      {hoveredNode && showTooltip && (
        <div className="absolute bottom-4 left-4 backdrop-blur-md rounded-lg p-4 shadow-xl max-w-xs z-20 pointer-events-none transition-opacity duration-200" style={{ backgroundColor: colors.background.card, borderColor: colors.border.default }}>
          {renderNodeTooltip()}
        </div>
      )}

      {/* Diff Panel */}
      {renderDiffPanel()}
    </div>
  )

  if (showCard) {
    return (
      <Card className="w-full" style={{ backgroundColor: colors.background.card, borderColor: colors.border.default }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl" style={{ color: colors.text.primary }}>
            <GitCommit className="h-6 w-6" style={{ color: colors.primary }} />
            Commit Behavior Analysis
          </CardTitle>
          <CardDescription style={{ color: colors.text.secondary }}>
            Comparing current commit patterns against historical contributor behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          {graphContent}
          
          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="backdrop-blur-sm rounded-lg p-4" style={{ backgroundColor: colors.background.card, borderColor: colors.border.default }}>
              <div className="text-sm mb-1" style={{ color: colors.text.secondary }}>Total Files</div>
              <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>{stats.totalFiles}</div>
            </div>
            
            <div className="backdrop-blur-sm rounded-lg p-4" style={{ backgroundColor: colors.background.card, borderColor: '#10b981' }}>
              <div className="text-sm mb-1" style={{ color: '#10b981' }}>Familiar</div>
              <div className="text-2xl font-bold" style={{ color: '#10b981' }}>{stats.familiar}</div>
            </div>

            <div className="backdrop-blur-sm rounded-lg p-4" style={{ backgroundColor: colors.background.card, borderColor: '#ef4444' }}>
              <div className="text-sm mb-1" style={{ color: '#ef4444' }}>New</div>
              <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>{stats.new}</div>
            </div>

            <div className="backdrop-blur-sm rounded-lg p-4" style={{ backgroundColor: colors.background.card, borderColor: '#8b5cf6' }}>
              <div className="text-sm mb-1" style={{ color: '#8b5cf6' }}>Sensitive</div>
              <div className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>{stats.sensitive}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return graphContent
}