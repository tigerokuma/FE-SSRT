"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { colors } from "@/lib/design-system"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  level: "root" | "direct" | "transitive"
  riskScore?: number
  color: string
  size: number
  fx?: number
  fy?: number
  x?: number
  y?: number
  slug?: string
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
}

type DirectDependency = {
  id: string
  label: string
  riskScore: number
  children: Array<{ id: string; label: string; riskScore: number }>
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
  if (score >= 60) return "#fbbf24" // medium risk
  return "#34d399" // low risk
}

const getRiskCategory = (score: number): "low" | "medium" | "high" => {
  if (score >= 75) return "high"
  if (score >= 60) return "medium"
  return "low"
}

export default function DependencyRelationshipGraph({
  packageId,
  packageName,
}: DependencyRelationshipGraphProps) {
  const [expandedNodes, setExpandedNodes] = useState<string[]>([])
  const [searchMode, setSearchMode] = useState<"direct" | "all">("all")
  const [riskFilter, setRiskFilter] = useState<"all" | "low" | "medium" | "high">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredDirectDependencies, setFilteredDirectDependencies] = useState<DirectDependency[]>(DIRECT_DEPENDENCIES)
  const [isFetching, setIsFetching] = useState(false)

  const apiBase = "/api/backend"

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

        const response = await fetch(
          `${apiBase}/dependencies/graph-filter?${params.toString()}`,
          { signal: controller.signal }
        )

        if (response.ok) {
          const payload = await response.json()
          if (!ignore && Array.isArray(payload?.directDependencies)) {
            const sanitized: DirectDependency[] = payload.directDependencies.map(
              (dep: DirectDependency) => ({
                ...dep,
                riskScore: typeof dep.riskScore === "number" ? dep.riskScore : 0,
                children: Array.isArray(dep.children)
                  ? dep.children
                      .map((child) => ({
                        ...child,
                        riskScore:
                          typeof child.riskScore === "number" ? child.riskScore : 0,
                      }))
                      .sort((a, b) => b.riskScore - a.riskScore)
                      .slice(0, 6)
                  : [],
              })
            )

            setFilteredDirectDependencies(
              sanitized.sort((a, b) => b.riskScore - a.riskScore).slice(0, 6)
            )
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
  }, [apiBase, localFiltered, riskFilter, searchMode, searchQuery])

  const graphData = useMemo(() => {
    const centerId = `root-${packageId}`
    const nodes: GraphNode[] = [
      {
        id: centerId,
        label: packageName ?? packageId,
        level: "root",
        color: "#38bdf8",
        size: 18,
        fx: 0,
        fy: 0,
      },
    ]

    const links: GraphLink[] = []
    const expandedSet = new Set(expandedNodes)

    const sortedDirect = [...filteredDirectDependencies]
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 6)

    const radius = 200
    sortedDirect.forEach((dep, index) => {
      const angle = (index / sortedDirect.length) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      const nodeId = `direct-${dep.id}`

      nodes.push({
        id: nodeId,
        label: dep.label,
        level: "direct",
        riskScore: dep.riskScore,
        slug: dep.id,
        color: getRiskLevelColor(dep.riskScore),
        size: 10 + dep.riskScore / 15,
        fx: x,
        fy: y,
      })

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
        const spread = Math.PI / 2.2
        const denom = Math.max(sortedChildren.length - 1, 1)
        const childRadius = 150

        sortedChildren.forEach((child, childIndex) => {
          const childId = `transitive-${child.id}`
          const centeredIndex = childIndex - (sortedChildren.length - 1) / 2
          const proportionalOffset = (centeredIndex / denom) * spread
          const hash =
            childId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
            100
          const jitter = ((hash / 100) - 0.5) * (Math.PI / 24)
          const childAngle = baseAngle + proportionalOffset + jitter
          const childX = x + Math.cos(childAngle) * childRadius
          const childY = y + Math.sin(childAngle) * childRadius

          nodes.push({
            id: childId,
            label: child.label,
            level: "transitive",
            riskScore: child.riskScore,
            slug: child.id,
            color: getRiskLevelColor(child.riskScore),
            size: 6 + child.riskScore / 20,
            fx: childX,
            fy: childY,
          })

          links.push({
            source: nodeId,
            target: childId,
            kind: "transitive",
          })
        })
      }
    })

    return { nodes, links }
  }, [expandedNodes, packageId, packageName])

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const isExpanded = prev.includes(nodeId)
      if (isExpanded) {
        return prev.filter((id) => id !== nodeId)
      }
      return [...prev, nodeId]
    })
  }

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
          <div className="grid gap-2">
            <Input
              id="dependency-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search dependencies..."
              className="w-full px-4 py-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ backgroundColor: "rgb(18, 18, 18)", borderColor: "hsl(var(--border))", borderWidth: "1px" }}
            />
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
          className="w-full overflow-hidden rounded-lg border"
          style={{ backgroundColor: "rgb(18, 18, 18)", borderColor: "hsl(var(--border))", borderWidth: "1px" }}
        >
          <ForceGraph2D
            height={420}
            graphData={graphData}
            cooldownTicks={0}
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
              const paddingX = 16 / globalScale
              const paddingY = 10 / globalScale
              const text = node.label

              ctx.font = `${Math.max(12 / globalScale, 9)}px Inter, sans-serif`
              const textMetrics = ctx.measureText(text)
              const textWidth = textMetrics.width
              const textHeight = Math.max(
                ctx.measureText("M").actualBoundingBoxAscent + ctx.measureText("M").actualBoundingBoxDescent,
                12 / globalScale
              )

              const rectWidth = Math.max(textWidth + paddingX * 2, node.width ?? 80)
              const rectHeight = Math.max(textHeight + paddingY * 2, node.height ?? 28)
              node.width = rectWidth
              node.height = rectHeight

              ctx.beginPath()
              ctx.roundRect(
                (node.x ?? 0) - rectWidth / 2,
                (node.y ?? 0) - rectHeight / 2,
                rectWidth,
                rectHeight,
                8 / globalScale
              )
              ctx.fillStyle = node.color
              ctx.fill()

              ctx.fillStyle = "#0f172a"
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillText(text, node.x ?? 0, node.y ?? 0)
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
              if (node.level === "direct") {
                toggleNodeExpansion(node.id)
              }
            }}
            onNodeRightClick={(nodeObject: any, event) => {
              const node = nodeObject as GraphNode
              if (!node.slug) return
              event.preventDefault()
              const targetUrl = `/dependency/${encodeURIComponent(node.slug)}`
              window.open(targetUrl, "_blank", "noopener,noreferrer")
            }}
            backgroundColor="rgb(18, 18, 18)"
          />
        </div>

        <hr style={{ borderColor: "hsl(var(--border))" }} />

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-300">
            <span className="h-2 w-6 rounded-full bg-sky-400" />
            Primary dependency
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <span className="h-2 w-6 rounded-full bg-emerald-400" />
            Direct dependency · low risk (&lt; 60)
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <span className="h-2 w-6 rounded-full bg-amber-300" />
            Direct dependency · medium risk (60-74)
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <span className="h-2 w-6 rounded-full bg-orange-400" />
            Direct dependency · high risk (≥ 75)
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

