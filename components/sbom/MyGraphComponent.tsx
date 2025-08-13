"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input"

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });
const API_PROXY_PATH = process.env.NEXT_PUBLIC_API_PROXY_PATH || '/api/backend'

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
        if (watchlistId) url = `${API_PROXY_PATH}/sbom/graph-dependencies/${encodedWatchlist}/${encodedNode}?vulns=${vulnsParam}`;
        else if (userWatchlistId)
          url = `${API_PROXY_PATH}/sbom/user-graph-dependencies/${encodedUserWatchlist}/${encodedNode}?vulns=${vulnsParam}`;

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

            const paddingX = 6;
            const paddingY = 4;
            const rectWidth = textWidth + paddingX * 2;
            const rectHeight = fontSize + paddingY * 2;

            const x = node.x!;
            const y = node.y!;

            (node as any).__width = rectWidth;
            (node as any).__height = rectHeight;

            const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            let color = node.color || "lightblue";
            if(isDarkMode) {
              switch(color){
                case 'lightblue': // lightblue: child node not effected
                  color = "#4e8debff";
                  break;
                case 'red': // red: child node effected
                  color = '#ff3838ff';
                  break;
                case 'grey': // grey: parent node
                  color = '#D3D3D3';
                  break;
                
              }
            }

            // Fill node background (rounded rect)
            const radius = 6;
            ctx.fillStyle = color || "lightblue";
            ctx.beginPath();
            ctx.moveTo(x - rectWidth / 2 + radius, y - rectHeight / 2);
            ctx.lineTo(x + rectWidth / 2 - radius, y - rectHeight / 2);
            ctx.quadraticCurveTo(x + rectWidth / 2, y - rectHeight / 2, x + rectWidth / 2, y - rectHeight / 2 + radius);
            ctx.lineTo(x + rectWidth / 2, y + rectHeight / 2 - radius);
            ctx.quadraticCurveTo(x + rectWidth / 2, y + rectHeight / 2, x + rectWidth / 2 - radius, y + rectHeight / 2);
            ctx.lineTo(x - rectWidth / 2 + radius, y + rectHeight / 2);
            ctx.quadraticCurveTo(x - rectWidth / 2, y + rectHeight / 2, x - rectWidth / 2, y + rectHeight / 2 - radius);
            ctx.lineTo(x - rectWidth / 2, y - rectHeight / 2 + radius);
            ctx.quadraticCurveTo(x - rectWidth / 2, y - rectHeight / 2, x - rectWidth / 2 + radius, y - rectHeight / 2);
            ctx.closePath();
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
          linkColor={() => "grey"} // Change arrows + link color
          linkDirectionalArrowColor={() => "lightgrey"}
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

        {/* Scrollable list */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
          <ul className="space-y-2 ml-2">
            {(showEResults && searchEResults.length > 0
              ? searchEResults.map((result) => result.node)
              : data.nodes.slice(1)
            ).map((node) => {
              const isDarkMode =
                window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches;

              let color = node.color || "lightblue";
              if(node.color=='lightblue')
              if (isDarkMode) {
                switch (color) {
                  case "lightblue":
                    color = "#4e8debff";
                    break;
                  case "red":
                    color = "#ff3838ff";
                    break;
                  case "grey":
                    color = "#D3D3D3";
                    break;
                }
              }

              return (
                <li
                  key={node.id}
                  className="p-2 rounded border border-gray-900 cursor-pointer
                            bg-gray-600 hover:bg-gray-200
                            dark:hover:bg-gray-700
                            text-black"
                  onClick={() => {
                    onNodeClick(node.id);
                    setEShowResults(false);
                  }}
                  style={{ backgroundColor: color || undefined }}
                >
                  <div className="font-medium">{node.name || node.id}</div>
                  {node.group && <div className="text-sm">Group: {node.group}</div>}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
}
