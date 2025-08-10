"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input"

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

function structuredGraphOutput(data: { nodes: any[]; links: any[] }) {
  if (!data.nodes.length) return data;

  const mainNode = data.nodes[0];
  mainNode.x = 0;
  mainNode.y = 0;

  const leftNodes: any[] = [];
  const rightNodes: any[] = [];

  data.nodes.slice(1).forEach((node, i) => {
    if (i % 2 === 0) leftNodes.push(node);
    else rightNodes.push(node);
  });

  const spacing = 20;
  leftNodes.forEach((node, i) => {
    node.x = -200;
    node.y = i * spacing - ((leftNodes.length - 1) * spacing) / 2;
  });
  rightNodes.forEach((node, i) => {
    node.x = 200;
    node.y = i * spacing - ((rightNodes.length - 1) * spacing) / 2;
  });

  return { nodes: [mainNode, ...leftNodes, ...rightNodes], links: data.links };
}

interface MyGraphComponentProps {
  currentNodeId: string;
  watchlistId: string;
  userWatchlistId: string;
  vulnerablePackages: string[];
  viewMode: "graph" | "list";
  onNodeClick: (nodeId: string) => void;
  eQuery: string;
  setEQuery: React.Dispatch<React.SetStateAction<string>>;
  showEResults: boolean;
  setEShowResults: React.Dispatch<React.SetStateAction<boolean>>;
  searchEResults: any[];
  setESearchResults: React.Dispatch<React.SetStateAction<any[]>>;
  handleSearch: (searchBar: string, query: string) => Promise<void>;
}

export default function MyGraphComponent({
  currentNodeId,
  watchlistId,
  userWatchlistId,
  vulnerablePackages,
  viewMode,
  onNodeClick,
  eQuery,
  setEQuery,
  showEResults,
  setEShowResults,
  searchEResults,
  setESearchResults,
  handleSearch,
}: MyGraphComponentProps) {
  const [data, setData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });

  useEffect(() => {
    async function fetchData() {
      try {
        const encodedWatchlist = encodeURIComponent(watchlistId);
        const encodedUserWatchlist = encodeURIComponent(userWatchlistId);
        const encodedNode = encodeURIComponent(currentNodeId);
        const vulnsParam = encodeURIComponent(vulnerablePackages.join(","));
        let url = "";
        if (watchlistId) url = `http://localhost:3000/sbom/graph-dependencies/${encodedWatchlist}/${encodedNode}?vulns=${vulnsParam}`;
        else if (userWatchlistId)
          url = `http://localhost:3000/sbom/user-graph-dependencies/${encodedUserWatchlist}/${encodedNode}?vulns=${vulnsParam}`;

        const res = await fetch(url);
        const json = await res.json();

        if (viewMode === "graph") {
          const layoutedData = structuredGraphOutput(json);
          setData(layoutedData);
        } else {
          setData(json);
        }
      } catch (error) {
        console.error("Error fetching graph data:", error);
      }
    }
    fetchData();
  }, [watchlistId, currentNodeId, vulnerablePackages, viewMode]);

  if (viewMode === "graph") {
    return (
      <div className="border border-2 rounded-md">
        <ForceGraph2D
          graphData={data}
          d3AlphaDecay={0}
          d3VelocityDecay={1}
          height={655}
          width={962}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name || node.id;
            const fontSize = 12 / globalScale;

            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;

            const paddingX = 2;
            const paddingY = 2;
            const rectWidth = textWidth + paddingX * 2;
            const rectHeight = fontSize + paddingY * 2;

            const x = node.x!;
            const y = node.y!;

            (node as any).__width = rectWidth;
            (node as any).__height = rectHeight;

            ctx.fillStyle = node.color || "lightblue";

            ctx.beginPath();
            ctx.rect(x - rectWidth / 2, y - rectHeight / 2, rectWidth, rectHeight);
            ctx.fill();

            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(label, x, y);
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            const width = (node as any).__width || 20;
            const height = (node as any).__height || 10;
            const x = node.x!;
            const y = node.y!;
            ctx.fillStyle = color;
            ctx.fillRect(x - width / 2, y - height / 2, width, height);
          }}
          nodeLabel="name"
          linkDirectionalArrowLength={3}
          onNodeClick={(node) => {
            onNodeClick(String(node.id));
          }}
        />
      </div>
    );
  } else {
    return (
      <div className="relative overflow-y-auto h-[655px] w-[960px] space-y-2">
        <div className="mt-2 ml-2">
          <div className="flex items-center">
            <Input
              placeholder="Search packages..."
              value={eQuery}
              onChange={(e) => {
                const value = e.target.value;
                setEQuery(value);
                handleSearch("E", value);
              }}
              className="flex-1 max-w-xs"
            />
          </div>
        </div>

        <ul className="space-y-2 ml-2">
          {(showEResults && searchEResults.length > 0 ? searchEResults.map((result) => result.node) : data.nodes.slice(1)).map((node) => (
            <li
              key={node.id}
              className="p-2 rounded border border-gray-300 cursor-pointer hover:bg-blue-200"
              onClick={() => {
                onNodeClick(node.id);
                setEShowResults(false);
              }}
              style={{ backgroundColor: node.color || "transparent" }}
            >
              <div className="font-medium">{node.name || node.id}</div>
              {node.group && <div className="text-sm text-gray-500">Group: {node.group}</div>}
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
