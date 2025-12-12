"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { colors } from "@/lib/design-system"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, X, ExternalLink } from "lucide-react"

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-lg border border-gray-800 bg-gray-950 text-gray-400">
      Loading dependency graph…
    </div>
  ),
})

type GraphNode = {
  id: string
  label: string
  version?: string
  level: "root" | "direct" | "transitive"
  riskScore?: number
  color: string
  size: number
  fx?: number
  fy?: number
  x?: number
  y?: number
  slug?: string
  packageId?: string
  width?: number
  height?: number
}

type GraphLink = {
  source: string
  target: string
  kind: "direct" | "transitive"
}

type DependencyRelationshipGraphProps = {
  packageId: string
  packageName?: string
  version?: string
}

type DirectDependency = {
  id: string
  label: string
  version?: string
  riskScore: number
  children: Array<{ id: string; label: string; version?: string; riskScore: number }>
}

const DIRECT_DEPENDENCIES: DirectDependency[] = [
  {
    id: "api-gateway",
    label: "api-gateway",
    riskScore: 92,
    children: [
      { id: "http-client", label: "http-client", riskScore: 81 },
      { id: "retry-logic", label: "retry-logic", riskScore: 70 },
      { id: "request-mapper", label: "request-mapper", riskScore: 64 },
      { id: "schema-validator", label: "schema-validator", riskScore: 76 },
      { id: "auth-proxy", label: "auth-proxy", riskScore: 83 },
      { id: "signature-kit", label: "signature-kit", riskScore: 68 },
      { id: "load-balancer", label: "load-balancer", riskScore: 61 },
    ],
  },
  {
    id: "security-suite",
    label: "security-suite",
    riskScore: 88,
    children: [
      { id: "crypto-utils", label: "crypto-utils", riskScore: 86 },
      { id: "token-exchange", label: "token-exchange", riskScore: 74 },
      { id: "threat-intel", label: "threat-intel", riskScore: 69 },
      { id: "audit-sink", label: "audit-sink", riskScore: 63 },
      { id: "compliance-kit", label: "compliance-kit", riskScore: 58 },
      { id: "secrets-manager", label: "secrets-manager", riskScore: 80 },
    ],
  },
  {
    id: "runtime-core",
    label: "runtime-core",
    riskScore: 77,
    children: [
      { id: "state-machine", label: "state-machine", riskScore: 71 },
      { id: "event-scheduler", label: "event-scheduler", riskScore: 62 },
      { id: "memory-profiler", label: "memory-profiler", riskScore: 55 },
      { id: "thread-pool", label: "thread-pool", riskScore: 59 },
      { id: "io-driver", label: "io-driver", riskScore: 66 },
    ],
  },
  {
    id: "data-access",
    label: "data-access-kit",
    riskScore: 68,
    children: [
      { id: "orm-driver", label: "orm-driver", riskScore: 72 },
      { id: "query-optimizer", label: "query-optimizer", riskScore: 65 },
      { id: "connection-guard", label: "connection-guard", riskScore: 60 },
      { id: "cache-layer", label: "cache-layer", riskScore: 54 },
      { id: "migration-tool", label: "migration-tool", riskScore: 58 },
    ],
  },
  {
    id: "telemetry",
    label: "telemetry-tools",
    riskScore: 64,
    children: [
      { id: "metrics-core", label: "metrics-core", riskScore: 69 },
      { id: "log-router", label: "log-router", riskScore: 61 },
      { id: "trace-sampler", label: "trace-sampler", riskScore: 57 },
      { id: "alerting-sdk", label: "alerting-sdk", riskScore: 65 },
      { id: "dashboard-ui", label: "dashboard-ui", riskScore: 52 },
    ],
  },
  {
    id: "ui-widgets",
    label: "ui-widgets",
    riskScore: 58,
    children: [
      { id: "theme-kit", label: "theme-kit", riskScore: 55 },
      { id: "accessibility", label: "a11y-helpers", riskScore: 60 },
      { id: "state-adapter", label: "state-adapter", riskScore: 53 },
      { id: "animation-engine", label: "animation-engine", riskScore: 49 },
      { id: "form-builder", label: "form-builder", riskScore: 51 },
    ],
  },
  {
    id: "cli-tools",
    label: "cli-tools",
    riskScore: 73,
    children: [
      { id: "scaffold-gen", label: "scaffold-gen", riskScore: 67 },
      { id: "deploy-runner", label: "deploy-runner", riskScore: 63 },
      { id: "plugin-host", label: "plugin-host", riskScore: 59 },
      { id: "env-manager", label: "env-manager", riskScore: 55 },
      { id: "release-kit", label: "release-kit", riskScore: 60 },
    ],
  },
  {
    id: "workflow-engine",
    label: "workflow-engine",
    riskScore: 82,
    children: [
      { id: "task-runner", label: "task-runner", riskScore: 77 },
      { id: "cron-scheduler", label: "cron-scheduler", riskScore: 69 },
      { id: "monitor-agent", label: "monitor-agent", riskScore: 71 },
      { id: "queue-adapter", label: "queue-adapter", riskScore: 66 },
      { id: "state-tracker", label: "state-tracker", riskScore: 64 },
    ],
  },
]

const getRiskLevelColor = (score: number) => {
  if (score >= 75) return "#f97316" // high risk
  if (score >= 50) return "#fbbf24" // medium risk
  return "#34d399" // low risk
}

const getRiskCategory = (score: number): "low" | "medium" | "high" => {
  if (score >= 75) return "high"
  if (score >= 50) return "medium"
  return "low"
}

export default function DependencyRelationshipGraph({
  packageId,
  packageName,
  version,
}: DependencyRelationshipGraphProps) {
  const router = useRouter()
  const [expandedNodes, setExpandedNodes] = useState<string[]>([])
  const [nestedDependencies, setNestedDependencies] = useState<Map<string, DirectDependency[]>>(new Map())
  const [searchMode, setSearchMode] = useState<"direct" | "all">("all")
  const [riskFilter, setRiskFilter] = useState<"all" | "low" | "medium" | "high">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredDirectDependencies, setFilteredDirectDependencies] = useState<DirectDependency[]>(DIRECT_DEPENDENCIES)
  const [allDependenciesForSearch, setAllDependenciesForSearch] = useState<DirectDependency[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [currentCenterPackageId, setCurrentCenterPackageId] = useState<string>(packageId)
  const [currentCenterPackageName, setCurrentCenterPackageName] = useState<string>(packageName || "")
  const [isLoadingPackageName, setIsLoadingPackageName] = useState<boolean>(!packageName)
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedDependency, setSelectedDependency] = useState<string>("")
  const [popoverWidth, setPopoverWidth] = useState<number | undefined>(undefined)
  const [isNoDepsMessageClosed, setIsNoDepsMessageClosed] = useState<boolean>(false)
  const [contextMenuNode, setContextMenuNode] = useState<GraphNode | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [noDependenciesMessage, setNoDependenciesMessage] = useState<{ visible: boolean; nodeName: string }>({ visible: false, nodeName: '' })
  const graphRef = useRef<any>(null)
  const searchTriggerRef = useRef<HTMLDivElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  

  const apiBase = "/api/backend"

  // Fetch package name from backend if not provided
  useEffect(() => {
    if (packageName) {
      setCurrentCenterPackageName(packageName)
      setIsLoadingPackageName(false)
      return
    }

    let ignore = false
    const controller = new AbortController()

    const fetchPackageName = async () => {
      try {
        setIsLoadingPackageName(true)
        const response = await fetch(
          `${apiBase}/packages/id/${packageId}`,
          { signal: controller.signal }
        )

        if (response.ok && !ignore) {
          const packageData = await response.json()
          if (packageData?.name) {
            setCurrentCenterPackageName(packageData.name)
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.warn("Failed to fetch package name:", error)
        }
      } finally {
        if (!ignore) {
          setIsLoadingPackageName(false)
        }
      }
    }

    fetchPackageName()

    return () => {
      ignore = true
      controller.abort()
    }
  }, [packageId, packageName, apiBase])

  // Close context menu on escape key or click outside
  useEffect(() => {
    if (!contextMenuPosition) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenuPosition(null)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [contextMenuPosition])

  const localFiltered = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return DIRECT_DEPENDENCIES.map((dep) => {
      const depRiskCategory = getRiskCategory(dep.riskScore)
      const matchesDirectRisk = riskFilter === "all" || depRiskCategory === riskFilter
      if (!matchesDirectRisk) return null

      const filteredChildren = dep.children
        .filter((child) => {
          const childRiskCategory = getRiskCategory(child.riskScore)
          if (riskFilter !== "all" && childRiskCategory !== riskFilter) return false
          if (!normalizedQuery) return true
          if (searchMode === "direct") return true
          return child.label.toLowerCase().includes(normalizedQuery)
        })
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 6)

      const matchesDirectQuery =
        !normalizedQuery || dep.label.toLowerCase().includes(normalizedQuery)
      const matchesChildQuery =
        normalizedQuery &&
        searchMode === "all" &&
        filteredChildren.some((child) =>
          child.label.toLowerCase().includes(normalizedQuery)
        )

      if (!matchesDirectQuery && !matchesChildQuery) return null

      return {
        ...dep,
        children: filteredChildren,
      }
    })
      .filter((dep): dep is DirectDependency => dep !== null)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 6)
  }, [riskFilter, searchMode, searchQuery])

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    const fetchFilteredDependencies = async () => {
      setIsFetching(true)
      let appliedFromBackend = false

      try {
        const params = new URLSearchParams({
          query: searchQuery,
          scope: searchMode,
          risk: riskFilter,
        })
        
        // For main component, use the dependency version
        if (version) {
          params.append('version', version)
        }

        const response = await fetch(
          `${apiBase}/sbom/dependency-graph/${currentCenterPackageId}?${params.toString()}`,
          { signal: controller.signal }
        )

        if (response.ok) {
          const payload = await response.json()
          if (!ignore && Array.isArray(payload?.directDependencies)) {
            // Process all dependencies - create unlimited version for search
            const allDepsUnlimited: DirectDependency[] = payload.directDependencies.map(
              (dep: DirectDependency) => ({
                ...dep,
                riskScore: typeof dep.riskScore === "number" ? dep.riskScore : 0,
                children: Array.isArray(dep.children)
                  ? dep.children
                      .map((child) => ({
                        ...child,
                        version: child.version,
                        riskScore:
                          typeof child.riskScore === "number" ? child.riskScore : 0,
                      }))
                      .sort((a, b) => b.riskScore - a.riskScore)
                      // Don't limit children - keep all for search
                  : [],
              })
            )
            
            // Store all dependencies (no limit) for search dropdown
            const allDepsSorted = allDepsUnlimited.sort((a, b) => b.riskScore - a.riskScore)
            setAllDependenciesForSearch(allDepsSorted)
            
            // Create limited version for graph display (limit both direct deps and their children)
            const limitedForGraph: DirectDependency[] = allDepsSorted
              .slice(0, 6) // Limit to top 6 direct dependencies
              .map((dep) => ({
                ...dep,
                children: dep.children.slice(0, 6) // Limit children to top 6
              }))
            
            setFilteredDirectDependencies(limitedForGraph)
            appliedFromBackend = true
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.warn("Failed to fetch dependency graph from backend, using local fallback.", error)
        }
      } finally {
        if (!ignore) {
          if (!appliedFromBackend) {
            setFilteredDirectDependencies(localFiltered)
          }
          setIsFetching(false)
        }
      }
    }

    fetchFilteredDependencies()

    return () => {
      ignore = true
      controller.abort()
    }
  }, [apiBase, localFiltered, riskFilter, searchMode, searchQuery, currentCenterPackageId, version])

  // Helper function to check if a position collides with existing nodes
  const checkCollision = (
    x: number,
    y: number,
    existingNodes: GraphNode[],
    minDistance: number = 100
  ): boolean => {
    for (const node of existingNodes) {
      if (node.fx !== undefined && node.fy !== undefined) {
        const dx = x - node.fx
        const dy = y - node.fy
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < minDistance) {
          return true // Collision detected
        }
      }
    }
    return false // No collision
  }

  // Helper function to find a non-colliding position
  const findNonCollidingPosition = (
    startX: number,
    startY: number,
    existingNodes: GraphNode[],
    minDistance: number = 100,
    maxAttempts: number = 20
  ): { x: number; y: number } => {
    // Try the original position first
    if (!checkCollision(startX, startY, existingNodes, minDistance)) {
      return { x: startX, y: startY }
    }

    // Try positions in a spiral pattern
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const angle = (attempt * 0.5) % (Math.PI * 2)
      const radius = minDistance * (1 + attempt * 0.2)
      
      for (let spiral = 0; spiral < 8; spiral++) {
        const spiralAngle = angle + (spiral * Math.PI / 4)
        const x = startX + Math.cos(spiralAngle) * radius
        const y = startY + Math.sin(spiralAngle) * radius
        
        if (!checkCollision(x, y, existingNodes, minDistance)) {
          return { x, y }
        }
      }
    }

    // If all attempts fail, return a position far away
    return { x: startX + minDistance * 2, y: startY + minDistance * 2 }
  }

  const graphData = useMemo(() => {
    const centerId = `root-${currentCenterPackageId}`
    // Keep label as just the name - version will be displayed separately by the renderer
    const centerLabel = currentCenterPackageName || (isLoadingPackageName ? "Loading..." : "")
    
    const nodes: GraphNode[] = [
      {
        id: centerId,
        label: centerLabel,
        version: version, // Version will be displayed separately below the name
        level: "root",
        color: "#38bdf8",
        size: 18,
        fx: 0,
        fy: 0,
      },
    ]
    
    const links: GraphLink[] = []
    const expandedSet = new Set(expandedNodes)
    const nodeIdSet = new Set<string>([centerId]) // Track all node IDs to prevent duplicates

    const sortedDirect = [...filteredDirectDependencies]
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 6)

    // Only create nodes and links if we have dependencies
    if (sortedDirect.length > 0) {
      const radius = 200
      sortedDirect.forEach((dep, index) => {
        const angle = (index / sortedDirect.length) * Math.PI * 2
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        // Sanitize node ID to ensure it's unique and valid
        const sanitizedId = dep.id.replace(/[^a-zA-Z0-9-_]/g, '_')
        const nodeId = `direct-${sanitizedId}`

        // Only add node if it doesn't already exist
        if (!nodeIdSet.has(nodeId)) {
          nodes.push({
            id: nodeId,
            label: dep.label,
            version: dep.version,
            level: "direct",
            riskScore: dep.riskScore,
            slug: dep.id,
            color: getRiskLevelColor(dep.riskScore),
            size: 10 + dep.riskScore / 15,
            fx: x,
            fy: y,
          })
          nodeIdSet.add(nodeId)
        }

        // Ensure all primary (direct) nodes connect to the root/primary node
        links.push({
          source: centerId,
          target: nodeId,
          kind: "direct",
        })

        if (expandedSet.has(nodeId)) {
          const sortedChildren = [...dep.children]
            .sort((a, b) => b.riskScore - a.riskScore)
            .slice(0, 6)

          const baseAngle = Math.atan2(y, x)
          // Increase spread angle based on number of children to prevent overlap
          const spread = Math.min(Math.PI * 1.5, (Math.PI * 2) / Math.max(sortedChildren.length, 1))
          const denom = Math.max(sortedChildren.length - 1, 1)
          // Increase child radius to give more space
          const childRadius = 180
          const minDistance = 120 // Minimum distance between nodes

          sortedChildren.forEach((child, childIndex) => {
            // Sanitize child ID to ensure it's unique and valid
            const sanitizedChildId = child.id.replace(/[^a-zA-Z0-9-_]/g, '_')
            const childId = `transitive-${sanitizedChildId}`
            
            // Only add child node if it doesn't already exist
            if (!nodeIdSet.has(childId)) {
              const centeredIndex = childIndex - (sortedChildren.length - 1) / 2
              const proportionalOffset = (centeredIndex / denom) * spread
              // Reduce jitter to prevent overlap
              const hash =
                childId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
                100
              const jitter = ((hash / 100) - 0.5) * (Math.PI / 36) // Reduced jitter
              const childAngle = baseAngle + proportionalOffset + jitter
              const initialX = x + Math.cos(childAngle) * childRadius
              const initialY = y + Math.sin(childAngle) * childRadius

              // Check for collision and find a non-colliding position
              const { x: childX, y: childY } = findNonCollidingPosition(
                initialX,
                initialY,
                nodes,
                minDistance
              )

              nodes.push({
                id: childId,
                label: child.label,
                version: child.version,
                level: "transitive",
                riskScore: child.riskScore,
                slug: child.id,
                color: getRiskLevelColor(child.riskScore),
                size: 6 + child.riskScore / 20,
                fx: childX,
                fy: childY,
              })
              nodeIdSet.add(childId)
            }

            // Every node connects to the node before it (its parent)
            // Only add link if both nodes exist
            if (nodeIdSet.has(nodeId) && nodeIdSet.has(childId)) {
              links.push({
                source: nodeId,
                target: childId,
                kind: "transitive",
              })
            }

            // If this transitive node is expanded, show its children
            if (expandedSet.has(childId)) {
              const nestedDeps = nestedDependencies.get(childId) || []
              // Use child's position (childX, childY) instead of parent's position
              const childNode = nodes.find(n => n.id === childId)
              const childX = childNode?.fx || x
              const childY = childNode?.fy || y
              const childAngle = Math.atan2(childY, childX)
              // Increase nested radius and adjust spread
              const nestedRadius = 130
              const nestedSpread = Math.min(Math.PI * 1.2, (Math.PI * 2) / Math.max(nestedDeps.length, 1))
              const nestedMinDistance = 100 // Minimum distance for nested nodes

              nestedDeps.slice(0, 4).forEach((nestedChild, nestedIndex) => {
                // Sanitize nested child ID to ensure it's unique and valid
                const sanitizedNestedId = nestedChild.id.replace(/[^a-zA-Z0-9-_]/g, '_')
                const nestedChildId = `nested-${sanitizedNestedId}-${childId}`
                
                // Only add nested node if it doesn't already exist
                if (!nodeIdSet.has(nestedChildId)) {
                  const nestedCenteredIndex = nestedIndex - (nestedDeps.length - 1) / 2
                  const nestedProportionalOffset = (nestedCenteredIndex / Math.max(nestedDeps.length - 1, 1)) * nestedSpread
                  const nestedHash =
                    nestedChildId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 100
                  const nestedJitter = ((nestedHash / 100) - 0.5) * (Math.PI / 40) // Reduced jitter
                  const nestedAngle = childAngle + nestedProportionalOffset + nestedJitter
                  const initialNestedX = childX + Math.cos(nestedAngle) * nestedRadius
                  const initialNestedY = childY + Math.sin(nestedAngle) * nestedRadius

                  // Check for collision and find a non-colliding position
                  const { x: nestedX, y: nestedY } = findNonCollidingPosition(
                    initialNestedX,
                    initialNestedY,
                    nodes,
                    nestedMinDistance
                  )

                  nodes.push({
                    id: nestedChildId,
                    label: nestedChild.label,
                    version: nestedChild.version,
                    level: "transitive",
                    riskScore: nestedChild.riskScore,
                    slug: nestedChild.id,
                    color: getRiskLevelColor(nestedChild.riskScore),
                    size: 5 + nestedChild.riskScore / 25,
                    fx: nestedX,
                    fy: nestedY,
                  })
                  nodeIdSet.add(nestedChildId)
                }

                // Every nested node connects to the node before it (its parent)
                // Only add link if both nodes exist
                if (nodeIdSet.has(childId) && nodeIdSet.has(nestedChildId)) {
                  links.push({
                    source: childId,
                    target: nestedChildId,
                    kind: "transitive",
                  })
                }
              })
            }
          })
        }
      })
    }

    // Filter out any links that reference non-existent nodes
    const validLinks = links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id || String(link.source)
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id || String(link.target)
      return nodeIdSet.has(sourceId) && nodeIdSet.has(targetId)
    })

    return { nodes, links: validLinks }
  }, [expandedNodes, nestedDependencies, currentCenterPackageId, currentCenterPackageName, filteredDirectDependencies, isLoadingPackageName, version])

  // Collect all dependencies for the dropdown, filtered by search scope
  // Use allDependenciesForSearch (unlimited) instead of filteredDirectDependencies (limited)
  const allDependencies = useMemo(() => {
    const deps: Array<{ id: string; baseId?: string; label: string; version?: string; level: "direct" | "transitive"; parentId?: string }> = []
    const seenIds = new Set<string>() // Track unique IDs to prevent duplicates
    
    // Use all dependencies for search, not the limited ones for graph display
    const dependenciesToUse = allDependenciesForSearch.length > 0 ? allDependenciesForSearch : filteredDirectDependencies
    
    dependenciesToUse.forEach((dep) => {
      const sanitizedId = dep.id.replace(/[^a-zA-Z0-9-_]/g, '_')
      const directId = `direct-${sanitizedId}`
      
      // Only add direct dependency if not already seen
      if (!seenIds.has(directId)) {
        deps.push({
          id: directId,
          label: dep.label,
          version: dep.version,
          level: "direct"
        })
        seenIds.add(directId)
      }
      
      // Only include transitive dependencies if search scope is "all"
      if (searchMode === "all") {
        dep.children.forEach((child) => {
          const sanitizedChildId = child.id.replace(/[^a-zA-Z0-9-_]/g, '_')
          const sanitizedParentId = directId.replace(/[^a-zA-Z0-9-_]/g, '_')
          // Make key unique by including parent ID to avoid duplicates in React
          // But also store the base ID that matches the graph node ID
          const baseChildId = `transitive-${sanitizedChildId}`
          const uniqueChildId = `transitive-${sanitizedChildId}-${sanitizedParentId}`
          
          // Only add if we haven't seen this exact combination before
          if (!seenIds.has(uniqueChildId)) {
            deps.push({
              id: uniqueChildId, // Unique key for React
              baseId: baseChildId, // Base ID to match graph node
              label: child.label,
              version: child.version,
              level: "transitive",
              parentId: directId
            })
            seenIds.add(uniqueChildId)
          }
        })
      }
    })
    
    return deps.sort((a, b) => a.label.localeCompare(b.label))
  }, [allDependenciesForSearch, filteredDirectDependencies, searchMode])

  // Handle dependency selection from dropdown
  const handleDependencySelect = (dependencyId: string) => {
    setSelectedDependency(dependencyId)
    setSearchQuery("")
    setSearchOpen(false)
    
    // Find the dependency in our list
    const dep = allDependencies.find(d => d.id === dependencyId)
    if (!dep) return
    
    // Check if the node is already on the graph by checking filteredDirectDependencies
    const nodeIdToFind = (dep as any).baseId || dependencyId
    const sanitizedId = dep.id.replace('direct-', '').replace('transitive-', '')
    const isOnGraph = filteredDirectDependencies.some(d => {
      const depSanitized = d.id.replace(/[^a-zA-Z0-9-_]/g, '_')
      if (dep.level === "direct") {
        return depSanitized === sanitizedId
      } else {
        // For transitive, check if parent is on graph and expanded
        const parentSanitized = (dep.parentId || '').replace('direct-', '')
        return d.id.replace(/[^a-zA-Z0-9-_]/g, '_') === parentSanitized && 
               expandedNodes.includes(dep.parentId || '') &&
               d.children.some(c => {
                 const childSanitized = c.id.replace(/[^a-zA-Z0-9-_]/g, '_')
                 return childSanitized === sanitizedId
               })
      }
    })
    
    if (!isOnGraph) {
      if (dep.level === "direct") {
        // For direct dependencies: remove one existing direct dependency and add the selected one
        setFilteredDirectDependencies(prev => {
          const newDeps = [...prev]
          // Remove the last one to make room
          if (newDeps.length >= 6) {
            newDeps.pop()
          }
          
          // Find the full dependency data from allDependenciesForSearch
          // The dep.id is like "direct-package-name", we need to find by the actual package name/id
          const sanitizedId = dep.id.replace('direct-', '')
          const fullDep = allDependenciesForSearch.find(d => {
            const depSanitized = d.id.replace(/[^a-zA-Z0-9-_]/g, '_')
            return depSanitized === sanitizedId
          })
          
          if (fullDep) {
            newDeps.push(fullDep)
          }
          
          return newDeps
        })
      } else if (dep.level === "transitive" && dep.parentId) {
        // For transitive dependencies: create a path from root
        // First, find the parent direct dependency
        const parentSanitizedId = dep.parentId.replace('direct-', '')
        const parentDep = allDependenciesForSearch.find(d => {
          const depSanitized = d.id.replace(/[^a-zA-Z0-9-_]/g, '_')
          return depSanitized === parentSanitizedId
        })
        
        if (parentDep) {
          // Check if parent is on the graph
          const parentNodeId = dep.parentId
          const isParentOnGraph = graphData.nodes.some(n => n.id === parentNodeId)
          
          if (!isParentOnGraph) {
            // Add parent to graph first
            setFilteredDirectDependencies(prev => {
              const newDeps = [...prev]
              // Remove the last one if we're at capacity
              if (newDeps.length >= 6) {
                newDeps.pop()
              }
              newDeps.push(parentDep)
              return newDeps
            })
          }
          
          // Expand the parent to show transitive dependencies
          setTimeout(() => {
            setExpandedNodes(prev => {
              if (!prev.includes(parentNodeId)) {
                return [...prev, parentNodeId]
              }
              return prev
            })
          }, 100)
        }
      }
    } else {
      // Node is already on graph, just expand if needed
      if (dep.level === "transitive" && dep.parentId) {
        const parentNodeId = dep.parentId
        if (!expandedNodes.includes(parentNodeId)) {
          setExpandedNodes(prev => [...prev, parentNodeId])
        }
      }
    }
    
    // Center on the node after a delay to allow graph to update
    setTimeout(() => {
      if (graphRef.current) {
        const node = graphData.nodes.find(n => n.id === nodeIdToFind)
        if (node && node.x !== undefined && node.y !== undefined) {
          // Center the graph on this node
          graphRef.current.centerAt(node.x, node.y, 1000)
        } else {
          // If node not found yet, try again after graph updates
          setTimeout(() => {
            if (graphRef.current) {
              const updatedNode = graphData.nodes.find(n => n.id === nodeIdToFind)
              if (updatedNode && updatedNode.x !== undefined && updatedNode.y !== undefined) {
                graphRef.current.centerAt(updatedNode.x, updatedNode.y, 1000)
              }
            }
          }, 400)
        }
      }
    }, 300)
  }

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const isExpanded = prev.includes(nodeId)
      if (isExpanded) {
        return prev.filter((id) => id !== nodeId)
      }
      return [...prev, nodeId]
    })
  }

  const handleNodeClick = async (node: GraphNode) => {
    // Clicking the root does nothing
    if (node.level === "root") return

    if (node.level === "direct") {
      // Check if this direct node has children
      const dep = filteredDirectDependencies.find(d => {
        const sanitizedId = d.id.replace(/[^a-zA-Z0-9-_]/g, '_')
        return `direct-${sanitizedId}` === node.id
      })
      
      if (dep && (!dep.children || dep.children.length === 0)) {
        // Show message that this node has no dependencies
        setNoDependenciesMessage({ visible: true, nodeName: node.label })
        
        // Clear any existing timeout
        if (messageTimeoutRef.current) {
          clearTimeout(messageTimeoutRef.current)
        }
        
        // Hide message after 3 seconds with fade
        messageTimeoutRef.current = setTimeout(() => {
          setNoDependenciesMessage(prev => ({ ...prev, visible: false }))
        }, 3000)
        return
      }
      
      // Toggle expansion for direct dependencies so their children appear inline
      toggleNodeExpansion(node.id)
      return
    }

    if (node.level === "transitive" && node.slug) {
      // For transitive dependencies, fetch their dependencies and expand
      const nodeId = node.id
      const isExpanded = expandedNodes.includes(nodeId)
      
      if (!isExpanded) {
        // Fetch dependencies for this transitive node
        try {
          const params = new URLSearchParams({
            query: searchQuery,
            scope: searchMode,
            risk: riskFilter,
          })
          
          // For transitive dependencies, use the package version (node.version) instead of the main dependency version
          const transitiveVersion = node.version || undefined
          if (transitiveVersion) {
            params.append('version', transitiveVersion)
          }
          
          const response = await fetch(
            `${apiBase}/sbom/dependency-graph/${node.slug}?${params.toString()}`
          )
          if (response.ok) {
            const payload = await response.json()
            if (Array.isArray(payload?.directDependencies)) {
              if (payload.directDependencies.length === 0) {
                // Show message that this node has no dependencies
                setNoDependenciesMessage({ visible: true, nodeName: node.label })
                
                // Clear any existing timeout
                if (messageTimeoutRef.current) {
                  clearTimeout(messageTimeoutRef.current)
                }
                
                // Hide message after 3 seconds with fade
                messageTimeoutRef.current = setTimeout(() => {
                  setNoDependenciesMessage(prev => ({ ...prev, visible: false }))
                }, 3000)
                return
              }
              
              const sanitized: DirectDependency[] = payload.directDependencies.map(
                (dep: DirectDependency) => ({
                  ...dep,
                  riskScore: typeof dep.riskScore === "number" ? dep.riskScore : 0,
                  children: Array.isArray(dep.children)
                    ? dep.children
                        .map((child) => ({
                          ...child,
                          version: child.version,
                          riskScore: typeof child.riskScore === "number" ? child.riskScore : 0,
                        }))
                        .sort((a, b) => b.riskScore - a.riskScore)
                        .slice(0, 6)
                    : [],
                })
              )
              setNestedDependencies((prev) => {
                const newMap = new Map(prev)
                newMap.set(nodeId, sanitized)
                return newMap
              })
            } else {
              // No dependencies found
              setNoDependenciesMessage({ visible: true, nodeName: node.label })
              
              // Clear any existing timeout
              if (messageTimeoutRef.current) {
                clearTimeout(messageTimeoutRef.current)
              }
              
              // Hide message after 3 seconds with fade
              messageTimeoutRef.current = setTimeout(() => {
                setNoDependenciesMessage(prev => ({ ...prev, visible: false }))
              }, 3000)
              return
            }
          } else {
            // API call failed, might mean no dependencies
            setNoDependenciesMessage({ visible: true, nodeName: node.label })
            
            // Clear any existing timeout
            if (messageTimeoutRef.current) {
              clearTimeout(messageTimeoutRef.current)
            }
            
            // Hide message after 3 seconds with fade
            messageTimeoutRef.current = setTimeout(() => {
              setNoDependenciesMessage(prev => ({ ...prev, visible: false }))
            }, 3000)
            return
          }
        } catch (error) {
          console.warn("Failed to fetch nested dependencies:", error)
          // Show message on error
          setNoDependenciesMessage({ visible: true, nodeName: node.label })
          
          // Clear any existing timeout
          if (messageTimeoutRef.current) {
            clearTimeout(messageTimeoutRef.current)
          }
          
          // Hide message after 3 seconds with fade
          messageTimeoutRef.current = setTimeout(() => {
            setNoDependenciesMessage(prev => ({ ...prev, visible: false }))
          }, 3000)
          return
        }
      }
      
      // Toggle expansion
      toggleNodeExpansion(nodeId)
      return
    }
  }
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Card style={{ backgroundColor: colors.background.card }}>
      <CardHeader>
        <CardTitle style={{ color: colors.text.primary }}>Dependency Graph</CardTitle>
        <CardDescription className="text-gray-400 space-y-1">
          <p>Visualizes the highest-risk relationships around this package. Right click a direct dependency to reveal its riskiest transitive dependencies. Left click to go to the dependency page.</p>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-4">
          <div className="grid gap-2 relative">
            <div className="relative" ref={searchTriggerRef}>
              <Input
                value={selectedDependency
                  ? allDependencies.find((dep) => dep.id === selectedDependency)?.label || ""
                  : searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchQuery(e.target.value)
                  setSearchOpen(true)
                  setSelectedDependency("") // Clear selection when typing
                }}
                onFocus={() => setSearchOpen(true)}
                onBlur={(e) => {
                  // Don't close if clicking on the dropdown
                  if (!e.currentTarget.parentElement?.querySelector('.popover-content')?.contains(e.relatedTarget as Node)) {
                    setTimeout(() => setSearchOpen(false), 200)
                  }
                }}
                placeholder="Search dependencies..."
                className="w-full px-4 py-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ backgroundColor: "rgb(18, 18, 18)", borderColor: "hsl(var(--border))", borderWidth: "1px" }}
              />
              {searchOpen && (searchQuery || allDependencies.length > 0) && (
                <div 
                  className="absolute z-50 mt-1 w-full rounded-md border shadow-lg popover-content"
                  style={{ 
                    backgroundColor: "rgb(18, 18, 18)", 
                    borderColor: "hsl(var(--border))",
                    maxHeight: "300px",
                    overflowY: "auto"
                  }}
                  onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking dropdown
                >
                  <div className="p-1">
                    {allDependencies
                      .filter((dep) => 
                        !searchQuery || 
                        dep.label.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-gray-400">No dependencies found.</div>
                      ) : (
                        allDependencies
                          .filter((dep) => 
                            !searchQuery || 
                            dep.label.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((dep) => (
                            <div
                              key={dep.id}
                              onClick={() => handleDependencySelect(dep.id)}
                              className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-200 cursor-pointer hover:bg-gray-800 rounded-sm"
                            >
                              <Check
                                className={`h-4 w-4 ${
                                  selectedDependency === dep.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <div className="flex flex-col">
                                <span>{dep.label}</span>
                                {dep.version && (
                                  <span className="text-xs text-gray-400">v{dep.version}</span>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-gray-300 text-sm">Search scope</Label>
              <RadioGroup
                value={searchMode}
                onValueChange={(value) => setSearchMode(value as "direct" | "all")}
                className="flex gap-4"
              >
                <div
                  className="flex items-center gap-2 rounded-md border"
                  style={{ backgroundColor: "rgb(18, 18, 18)", padding: "8px 12px", borderColor: "hsl(var(--border))", borderWidth: "1px" }}
                >
                  <RadioGroupItem value="direct" id="scope-direct" />
                  <Label htmlFor="scope-direct" className="cursor-pointer text-gray-200">
                    Direct only
                  </Label>
                </div>
                <div
                  className="flex items-center gap-2 rounded-md border"
                  style={{ backgroundColor: "rgb(18, 18, 18)", padding: "8px 12px", borderColor: "hsl(var(--border))", borderWidth: "1px" }}
                >
                  <RadioGroupItem value="all" id="scope-all" />
                  <Label htmlFor="scope-all" className="cursor-pointer text-gray-200">
                    Direct + transitive
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label className="text-gray-300 text-sm">Risk filter</Label>
              <Select
                value={riskFilter}
                onValueChange={(value) =>
                  setRiskFilter(value as "all" | "low" | "medium" | "high")
                }
              >
                <SelectTrigger className="w-full text-gray-200" style={{ backgroundColor: "rgb(18, 18, 18)", borderColor: "hsl(var(--border))", borderWidth: "1px" }}>
                  <SelectValue placeholder="Risk level" />
                </SelectTrigger>
                <SelectContent className="text-gray-200" style={{ backgroundColor: "rgb(18, 18, 18)", borderColor: "hsl(var(--border))", borderWidth: "1px" }}>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="high">High risk only</SelectItem>
                  <SelectItem value="medium">Medium risk only</SelectItem>
                  <SelectItem value="low">Low risk only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isFetching && (
            <p className="text-xs text-gray-500">
              Syncing with backend…
            </p>
          )}
        </div>

        <hr style={{ borderColor: "hsl(var(--border))" }} />

        <div
          className="w-full overflow-hidden rounded-lg border relative"
          style={{ backgroundColor: "rgb(18, 18, 18)", borderColor: "hsl(var(--border))", borderWidth: "1px" }}
        >
          {filteredDirectDependencies.length === 0 && !isFetching && !isNoDepsMessageClosed && (
            <div className="absolute bottom-4 right-4 z-10 px-4 py-2 rounded-lg border bg-gray-900/90 backdrop-blur-sm flex items-center gap-2"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <p className="text-sm text-gray-400">No dependencies for package</p>
              <button
                onClick={() => setIsNoDepsMessageClosed(true)}
                className="text-gray-400 hover:text-gray-200 transition-colors"
                aria-label="Close message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <ForceGraph2D
            ref={graphRef}
            height={420}
            graphData={graphData}
            cooldownTicks={100}
            autoPauseRedraw={false}
            enableNodeDrag={false}
            nodeRelSize={6}
            linkDirectionalParticles={0}
            linkWidth={(linkObject: any) => (linkObject.kind === "direct" ? 2 : 1)}
            linkColor={(linkObject: any) =>
              linkObject.kind === "direct" ? "rgba(56, 189, 248, 0.9)" : "rgba(192, 132, 252, 0.6)"
            }
            nodeCanvasObject={(nodeObject: any, ctx, globalScale) => {
              const node = nodeObject as GraphNode
              // Clamp globalScale to prevent extreme scaling
              const clampedScale = Math.max(0.1, Math.min(globalScale, 10))
              
              // Scale padding with zoom - larger when zoomed in, smaller when zoomed out
              const paddingX = Math.max(8, 16 / clampedScale)
              const paddingY = Math.max(5, 10 / clampedScale)
              const text = node.label
              const versionText = node.version ? `@${node.version}` : ""

              // Measure both texts with clamped font sizes
              const fontSize = Math.max(9, Math.min(24, 12 / clampedScale))
              const versionFontSize = versionText ? Math.max(8, Math.min(20, 10 / clampedScale)) : 0
              
              ctx.font = `${fontSize}px Inter, sans-serif`
              const textMetrics = ctx.measureText(text)
              const textWidth = textMetrics.width
              
              let versionWidth = 0
              if (versionText) {
                ctx.font = `${versionFontSize}px Inter, sans-serif`
                const versionMetrics = ctx.measureText(versionText)
                versionWidth = versionMetrics.width
              }

              const totalTextWidth = Math.max(textWidth, versionWidth)
              const textHeight = Math.max(
                ctx.measureText("M").actualBoundingBoxAscent + ctx.measureText("M").actualBoundingBoxDescent,
                fontSize
              )
              const versionHeight = versionText ? Math.max(
                ctx.measureText("M").actualBoundingBoxAscent + ctx.measureText("M").actualBoundingBoxDescent,
                versionFontSize
              ) : 0
              const totalHeight = textHeight + (versionText ? versionHeight + Math.max(1, 2 / clampedScale) : 0)

              // Calculate node size based on text with clamped scaling
              const baseMinWidth = 60
              const baseMinHeight = 24
              const baseMaxWidth = 300
              const baseMaxHeight = 100
              
              // Scale minimum sizes, but clamp them
              const minWidth = Math.max(baseMinWidth, Math.min(baseMaxWidth, baseMinWidth / clampedScale))
              const minHeight = Math.max(baseMinHeight, Math.min(baseMaxHeight, baseMinHeight / clampedScale))
              
              // Calculate final size with maximum constraints
              const rectWidth = Math.min(
                baseMaxWidth,
                Math.max(totalTextWidth + paddingX * 2, minWidth)
              )
              const rectHeight = Math.min(
                baseMaxHeight,
                Math.max(totalHeight + paddingY * 2, minHeight)
              )
              
              node.width = rectWidth
              node.height = rectHeight

              ctx.beginPath()
              const borderRadius = Math.max(4, Math.min(12, 8 / clampedScale))
              ctx.roundRect(
                (node.x ?? 0) - rectWidth / 2,
                (node.y ?? 0) - rectHeight / 2,
                rectWidth,
                rectHeight,
                borderRadius
              )
              ctx.fillStyle = node.color
              ctx.fill()

              // Draw main label
              ctx.fillStyle = "#0f172a"
              ctx.textAlign = "center"
              ctx.font = `${fontSize}px Inter, sans-serif`
              ctx.textBaseline = versionText ? "bottom" : "middle"
              const labelY = versionText 
                ? (node.y ?? 0) - (versionHeight / 2 + Math.max(0.5, 1 / clampedScale))
                : (node.y ?? 0)
              ctx.fillText(text, node.x ?? 0, labelY)

              // Draw version if available
              if (versionText) {
                ctx.fillStyle = "rgba(15, 23, 42, 0.7)"
                ctx.font = `${versionFontSize}px Inter, sans-serif`
                ctx.textBaseline = "top"
                ctx.fillText(versionText, node.x ?? 0, (node.y ?? 0) + (textHeight / 2 + Math.max(0.5, 1 / clampedScale)))
              }
            }}
            nodePointerAreaPaint={(nodeObject: any, color, ctx) => {
              const node = nodeObject as GraphNode
              ctx.fillStyle = color
              const padding = 10
              const width = (node.width ?? 80) + padding
              const height = (node.height ?? 28) + padding
              ctx.beginPath()
              ctx.rect((node.x ?? 0) - width / 2, (node.y ?? 0) - height / 2, width, height)
              ctx.fill()
            }}
            onNodeClick={(nodeObject: any) => {
              const node = nodeObject as GraphNode
              // Don't navigate if clicking the center node
              if (node.level !== "root") {
                handleNodeClick(node)
              }
            }}
            onNodeRightClick={(nodeObject: any, event) => {
              const node = nodeObject as GraphNode
              if (!node.slug) return
              event.preventDefault()
              
              // Get mouse position relative to the viewport
              const mouseEvent = event as MouseEvent
              const x = mouseEvent.clientX
              const y = mouseEvent.clientY
              
              setContextMenuNode(node)
              setContextMenuPosition({ x, y })
            }}
            backgroundColor="rgb(18, 18, 18)"
          />
          
          {/* No dependencies message */}
          <div
            className="absolute bottom-4 right-4 px-4 py-2 rounded-lg border shadow-lg transition-opacity duration-500 pointer-events-none z-20"
            style={{
              backgroundColor: "rgba(18, 18, 18, 0.95)",
              borderColor: "hsl(var(--border))",
              opacity: noDependenciesMessage.visible ? 1 : 0,
              visibility: noDependenciesMessage.visible ? 'visible' : 'hidden',
            }}
          >
            <p className="text-sm text-gray-300">
              No dependencies found for <span className="font-semibold text-white">{noDependenciesMessage.nodeName}</span>
            </p>
          </div>
        </div>

        <hr style={{ borderColor: "hsl(var(--border))" }} />

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-300">
            <span className="h-2 w-6 rounded-full bg-sky-400" />
            Primary dependency
          </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="h-2 w-6 rounded-full bg-emerald-400" />
              Direct dependency · low risk (&lt; 50)
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="h-2 w-6 rounded-full bg-amber-300" />
              Direct dependency · medium risk (50-74)
            </div>
          <div className="flex items-center gap-2 text-gray-300">
            <span className="h-2 w-6 rounded-full bg-orange-400" />
            Direct dependency · high risk (≥ 75)
          </div>
        </div>
      </CardContent>

      {/* Right-click context menu */}
      {contextMenuPosition && contextMenuNode && (
        <>
          {/* Backdrop to close menu on click outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenuPosition(null)}
            onContextMenu={(e) => {
              e.preventDefault()
              setContextMenuPosition(null)
            }}
          />
          {/* Context menu */}
          <div
            ref={contextMenuRef}
            className="fixed z-50 min-w-[180px] rounded-md border shadow-lg"
            style={{
              left: `${contextMenuPosition.x}px`,
              top: `${contextMenuPosition.y}px`,
              backgroundColor: colors.background.card,
              borderColor: "hsl(var(--border))",
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="p-1">
              <button
                onClick={async () => {
                  if (contextMenuNode?.slug) {
                    // Extract projectId from current URL
                    const currentPath = window.location.pathname
                    const pathParts = currentPath.split('/').filter(Boolean)
                    
                    // URL structure: /dependency/[projectId]/[packageId]/[version]
                    let projectId = 'default'
                    if (pathParts[0] === 'dependency' && pathParts[1]) {
                      projectId = pathParts[1]
                    } else if (pathParts[0] === 'project' && pathParts[1]) {
                      // If we're in a project page, use that project ID
                      projectId = pathParts[1]
                    }
                    
                    // Use packageId if already stored in node, otherwise query it from Memgraph
                    let packageId = contextMenuNode.packageId
                    
                    if (!packageId) {
                      // Query package ID from Memgraph using package name and version
                      try {
                        const params = new URLSearchParams()
                        if (contextMenuNode.version) {
                          params.append('version', contextMenuNode.version)
                        }
                        const response = await fetch(
                          `${apiBase}/sbom/package-id/${encodeURIComponent(contextMenuNode.slug)}?${params.toString()}`
                        )
                        if (response.ok) {
                          const data = await response.json()
                          packageId = data?.packageId
                        }
                      } catch (error) {
                        console.error('Error fetching package ID from Memgraph:', error)
                      }
                    }
                    
                    // Use package ID if available, otherwise fallback to slug (package name)
                    const finalPackageId = packageId || contextMenuNode.slug
                    const targetUrl = `/dependency/${projectId}/${encodeURIComponent(finalPackageId)}${contextMenuNode.version ? `/${encodeURIComponent(contextMenuNode.version)}` : ''}`
                    router.push(targetUrl)
                    setContextMenuPosition(null)
                  }
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-200 hover:bg-gray-800 rounded-sm cursor-pointer transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Go to dependency</span>
              </button>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}

