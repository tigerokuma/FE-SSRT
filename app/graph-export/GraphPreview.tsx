"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import cytoscape, { Core, ElementDefinition, NodeSingular } from "cytoscape";

type LayoutName = "breadthfirst" | "cose" | "grid" | "circle";

interface GraphPreviewProps {
  elements: ElementDefinition[];
  initialLayout?: LayoutName;
  height?: number | string;
}

const TYPE_COLORS: Record<string, string> = {
  Function: "#2563eb",
  Class: "#9333ea",
  Call: "#0891b2",
  If: "#f59e0b",
  Loop: "#16a34a",
  Switch: "#ea580c",
  Try: "#db2777",
  Catch: "#be123c",
  Contributor: "#64748b",
};
const DEFAULT_NODE_COLOR = "#0ea5e9";

// quick validator to help catch bad edges
function validateElements(els: ElementDefinition[]) {
  const nodes = els.filter((e: any) => e.data && !e.data.source && !e.data.target);
  const edges = els.filter((e: any) => e.data && (e.data.source || e.data.target));
  for (const n of nodes) if (!n.data?.id) console.warn("Node missing data.id:", n);
  const nodeIds = new Set(nodes.map((n: any) => n.data.id));
  for (const e of edges) {
    const d = (e as any).data || {};
    if (!d.source || !d.target) console.warn("Edge missing source/target:", e);
    if (!nodeIds.has(d.source) || !nodeIds.has(d.target)) console.warn("Edge points to unknown node(s):", e);
  }
  return true;
}

export function GraphPreview({ elements, initialLayout = "cose", height = 500 }: GraphPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const createdRef = useRef(false);

  const [layoutName, setLayoutName] = useState<LayoutName>(initialLayout);
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);
  const [selectedEdgeData, setSelectedEdgeData] = useState<any | null>(null);

  // Dark-mode readable styles
  const stylesheet = useMemo(
    () => [
      {
        selector: "node",
        style: {
          label: "data(label)",
          fontSize: 11,
          textWrap: "wrap",
          textMaxWidth: 180,
          backgroundColor: (ele: NodeSingular) => {
            const t = ele.data("type") as string | undefined;
            return (t && TYPE_COLORS[t]) || DEFAULT_NODE_COLOR;
          },
          borderWidth: 1,
          borderColor: "#1f2937",
          color: "#e5e7eb",
          textOutlineWidth: 2,
          textOutlineColor: "#0b0f19",
          textBackgroundColor: "#0b0f19",
          textBackgroundOpacity: 0.6,
          textBackgroundPadding: 2,
        },
      },
      { selector: 'node[type = "Contributor"]', style: { shape: "round-rectangle" } },
      {
        selector: "edge",
        style: {
          width: 2,
          lineColor: "#94a3b8",
          targetArrowColor: "#94a3b8",
          targetArrowShape: "triangle",
          curveStyle: "bezier",
          fontSize: 10,
          textRotation: "autorotate",
          textMarginY: -6,
          color: "#cbd5e1",
          textBackgroundColor: "#0b0f19",
          textBackgroundOpacity: 0.6,
          textBackgroundPadding: 2,
          label: "data(relation)",
        },
      },
      {
        selector: "node:selected",
        style: {
          "border-width": 3,
          "border-color": "#ffffff",
          "background-color": (ele: NodeSingular) => {
            const t = ele.data("type") as string | undefined;
            return (t && TYPE_COLORS[t]) || DEFAULT_NODE_COLOR;
          },
          "background-blacken": 0,
          color: "#e5e7eb",
          "text-outline-width": 2,
          "text-outline-color": "#0b0f19",
          "text-background-color": "#0b0f19",
          "text-background-opacity": 0.7,
          "text-background-padding": 2,
        },
      },
      { selector: "edge:selected", style: { width: 3, lineColor: "#ffffff", targetArrowColor: "#ffffff" } },
    ],
    []
  );

  // helpers to read actual rendered colors from cytoscape
  const getNodeColor = (ele: any) => ele.style("background-color");
  const getEdgeColor = (ele: any) => ele.style("line-color");

  // create once
  useEffect(() => {
    if (typeof window === "undefined") return; // SSR guard
    if (createdRef.current || !containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: stylesheet as any,
      // Use preset initially; run the chosen layout after elements are added
      layout: { name: "preset" },
      wheelSensitivity: 0.2,
      pixelRatio: 1,
    });

    cyRef.current = cy;
    createdRef.current = true;

    // IMPORTANT: stash the actual color so the details panel can mirror the graph
    cy.on("select", "node", (evt) => {
      setSelectedEdgeData(null);
      setSelectedNodeData({ ...evt.target.data(), color: getNodeColor(evt.target) });
    });
    cy.on("select", "edge", (evt) => {
      setSelectedNodeData(null);
      setSelectedEdgeData({ ...evt.target.data(), color: getEdgeColor(evt.target) });
    });
    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        setSelectedNodeData(null);
        setSelectedEdgeData(null);
      }
    });

    return () => {
      try {
        try {
          cy.stop();
        } catch {}
        cy.destroy();
      } finally {
        cyRef.current = null;
        createdRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update on data/layout change
  useEffect(() => {
    const cy = cyRef.current;
    const container = containerRef.current;
    if (!cy || cy.destroyed() || !container) return;

    // if hidden or zero-sized, skip; we'll fit on the next visible paint
    if (container.offsetWidth === 0 || container.offsetHeight === 0) return;

    if (!Array.isArray(elements) || elements.length === 0) {
      cy.startBatch();
      cy.elements().remove();
      cy.endBatch();
      return;
    }

    validateElements(elements);

    cy.startBatch();
    cy.elements().remove();
    cy.add(elements as any);
    cy.endBatch();

    let canceled = false;

    // ensure renderer knows actual size before layout/fit
    cy.resize();

    const lay = cy.layout({ name: layoutName });
    lay.on("layoutstop", () => {
      if (canceled || cy.destroyed()) return;
      if (cy.nodes().length > 0) {
        cy.fit(undefined, 30);
      }
    });

    // kick to next frame to avoid running while sizing/DOM is settling
    const id = requestAnimationFrame(() => {
      if (!canceled && cy && !cy.destroyed()) lay.run();
    });

    return () => {
      canceled = true;
      try {
        lay.stop();
      } catch {}
      cancelAnimationFrame(id);
    };
  }, [elements, layoutName]);

  const runLayout = (name: LayoutName) => {
    setLayoutName(name);
    const cy = cyRef.current;
    const container = containerRef.current;
    if (!cy || cy.destroyed() || !container) return;
    if (container.offsetWidth === 0 || container.offsetHeight === 0) return;

    cy.resize();

    const lay = cy.layout({ name });
    lay.on("layoutstop", () => {
      if (!cy.destroyed() && cy.nodes().length > 0) cy.fit(undefined, 30);
    });
    requestAnimationFrame(() => {
      if (cy && !cy.destroyed()) lay.run();
    });
  };

  const handleFit = () => {
    const cy = cyRef.current;
    const container = containerRef.current;
    if (!cy || cy.destroyed() || cy.nodes().length === 0 || !container) return;
    cy.resize();
    cy.fit(undefined, 30);
  };

  const handleExportPng = () => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;
    const png = cy.png({ full: true, scale: 2, bg: "#ffffff" });
    const a = document.createElement("a");
    a.href = png;
    a.download = "graph.png";
    a.click();
  };

  const detailsMaxH = typeof height === "number" ? `${height}px` : height;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 12 }}>
      <div>
        {/* toolbar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
          <label style={{ fontSize: 12, color: "#9ca3af" }}>Layout</label>
          <select
            value={layoutName}
            onChange={(e) => runLayout(e.target.value as LayoutName)}
            style={{
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid #374151",
              background: "transparent",
              color: "#e5e7eb",
            }}
          >
            <option value="cose">cose (force)</option>
            <option value="breadthfirst">breadthfirst</option>
            <option value="grid">grid</option>
            <option value="circle">circle</option>
          </select>

          <button
            onClick={handleFit}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #374151",
              background: "transparent",
              color: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            Fit
          </button>

          <button
            onClick={handleExportPng}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #374151",
              background: "transparent",
              color: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            Export
          </button>

          <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
            {Object.entries(TYPE_COLORS).map(([t, c]) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    background: c,
                    borderRadius: 2,
                    border: "1px solid #0b0f19",
                  }}
                />
                <span style={{ fontSize: 11, color: "#9ca3af" }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Graph canvas */}
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: typeof height === "number" ? `${height}px` : height,
            border: "1px solid #374151",
            borderRadius: 10,
            background: "#0b0f19",
          }}
        />
      </div>

      {/* Details panel mirrors actual colors */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 12,
          background: "#0b0f19",
          color: "#e5e7eb",
          overflowY: "auto",
          maxHeight: detailsMaxH,
        }}
      >
        {selectedNodeData ? (
          <>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: selectedNodeData.color || DEFAULT_NODE_COLOR,
                  border: "1px solid #0b0f19",
                }}
              />
              Node
            </h3>
            <div style={{ fontSize: 13, marginBottom: 8 }}>
              <div>
                <b>Type:</b> {selectedNodeData.type ?? "-"}
              </div>
              <div>
                <b>Name:</b> {selectedNodeData.name ?? "-"}
              </div>
              <div>
                <b>Location:</b> {selectedNodeData.location ?? "-"}
              </div>
            </div>
            {selectedNodeData.code ? (
              <>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Code</div>
                <pre
                  style={{
                    fontSize: 12,
                    background: "#0b0f19",
                    color: "#e5e7eb",
                    padding: 8,
                    borderRadius: 8,
                    whiteSpace: "pre-wrap",
                    overflowX: "auto",
                    border: "1px solid #374151",
                  }}
                >
                  {selectedNodeData.code}
                </pre>
              </>
            ) : null}
          </>
        ) : selectedEdgeData ? (
          <>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 18,
                  height: 2,
                  background: selectedEdgeData.color || "#94a3b8",
                }}
              />
              Edge
            </h3>
            <div style={{ fontSize: 13, marginBottom: 8 }}>
              <div>
                <b>Relation:</b> {selectedEdgeData.relation ?? "-"}
              </div>
              <div>
                <b>Source:</b> {selectedEdgeData.source ?? "-"}
              </div>
              <div>
                <b>Target:</b> {selectedEdgeData.target ?? "-"}
              </div>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: "#6b7280" }}>Select a node or edge to see details</div>
        )}
      </div>
    </div>
  );
}
