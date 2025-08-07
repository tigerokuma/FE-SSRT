"use client"

import React, { useState, useEffect } from "react"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

import { MainContent } from "@/components/main-content"

import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});



function structuredGraphOutput(data: { nodes: any[]; links: any[] }) {
  if (!data.nodes.length) return data;

  const mainNode = data.nodes[0];
  mainNode.x = 0;
  mainNode.y = 0;

  const leftNodes: any[] = [];
  const rightNodes: any[] = [];

  data.nodes.slice(1).forEach((node, i) => {
    if (i % 2 === 0) {
      leftNodes.push(node);
    } else {
      rightNodes.push(node);
    }
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


// Graph component


export default function SbomSearchPage() {
  const [infQuery, setInfQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [eQuery, setEQuery] = useState("");
  const [showEResults, setEShowResults] = useState(false);
  const [searchEResults, setESearchResults] = useState<any[]>([]);
  const [vulnerablePackages, setVulnerablePackages] = useState<string[]>([]);
  const [metadata, setMetadata] = useState({
    sbomPackage: "",
    directDependencies: 0,
    transitiveDependencies: 0,
    licenseSummary: {},
    riskSummary: {}
  });
  const [selectedSbom, setSelectedSbom] = useState<string>("");
  const [dependencyPackages, setDependencyPackages] = useState<
    { id: string; label: string }[]
  >([]);


  const userRepositories = [
    { id: "user-123", label: "main" }, 
  ];
  const userId = 'user-123';
  const [history, setHistory] = useState<string[]>([metadata.sbomPackage]);
  const [watchlistId, setWatchlistId] = useState<string>("");
  const [userWatchlistId, setUserWatchlistId] = useState<string>("user-123");


  function selectWatchlist(id: string) {
    setWatchlistId(id);
    setUserWatchlistId(""); // clear the other
  }

  function selectUserWatchlist(id: string) {
    setUserWatchlistId(id);
    setWatchlistId(""); // clear the other
  }

  function MyGraphComponent({ onNodeClick }: { onNodeClick: (nodeId: string) => void }) {
  const [data, setData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });

  useEffect(() => {
    async function fetchData() {
      try {
        const encodedWatchlist = encodeURIComponent(watchlistId);
        const encodedUserWatchlist = encodeURIComponent(userWatchlistId);
        const encodedNode = encodeURIComponent(currentNodeId);
        const vulnsParam = encodeURIComponent(vulnerablePackages.join(','));
        let url = "";
        if (watchlistId) {
          url = `http://localhost:3000/sbom/graph-dependencies/${encodedWatchlist}/${encodedNode}?vulns=${vulnsParam}`;
        } else if (userWatchlistId) {
          url = `http://localhost:3000/sbom/user-graph-dependencies/${encodedUserWatchlist}/${encodedNode}?vulns=${vulnsParam}`;
        }

        const res = await fetch(url);

        const json = await res.json();
        if(viewMode == "graph"){
          const layoutedData = structuredGraphOutput(json);
          setData(layoutedData);
        }
        else{
          setData(json);
        }

      } catch (error) {
        console.error("Error fetching graph data:", error);
      }
    }

      fetchData();
    }, [metadata, watchlistId, currentNodeId, vulnerablePackages]);
    if(viewMode == "graph"){
      return (
        <ForceGraph2D
          graphData={data}
          d3AlphaDecay={0.01} 
          d3VelocityDecay={1} 
          
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

            ctx.fillStyle = node.color || 'lightblue';
          
            ctx.beginPath();
            ctx.rect(x - rectWidth / 2, y - rectHeight / 2, rectWidth, rectHeight);
            ctx.fill();

            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
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
          onNodeClick={(node) => { onNodeClick(String(node.id)); console.log('here')} }
        />
      );
    }
    else {
      return (
        

     <div className="relative h-[75vh] overflow-y-auto space-y-2">
  {/* Search Input */}
  <div className="mt-6">
    <div className="flex items-center">
      <Input
        placeholder="Search packages..."
        value={eQuery}
        onChange={(e) => {
    const value = e.target.value;
    setEQuery(value);
    handleSearch("E", value); // pass input value to search function
  }}
        className="flex-1 max-w-xs"
      />
    </div>
  </div>

  {/* Node List */}
  <ul className="space-y-2">
    {(showEResults && searchEResults.length > 0
      ? searchEResults.map((result) => result.node)
      : data.nodes.slice(1)
    ).map((node) => (
      <li
        key={node.id}
        className="p-2 rounded border border-gray-300 cursor-pointer hover:bg-blue-200"
        onClick={() => {onNodeClick(node.id); setEShowResults(false)}}
        style={{ backgroundColor: node.color || 'transparent' }}
      >
        <div className="font-medium">{node.name || node.id}</div>
        {node.group && (
          <div className="text-sm text-gray-500">Group: {node.group}</div>
        )}
      </li>
    ))}
  </ul>
</div>
    );
    }
  }

  let currentNodeId = history[history.length - 1];

  useEffect(() => {
    async function loadDependencyPackages() {
      try {
        const res = await fetch(`http://localhost:3000/sbom/dep-list/${userId}`);
        const data = await res.json();

        // Transform backend output to match your frontend format
        const formatted = data.map((item: any) => ({
          id: item.watchlist_id,
          label: item.package_name
        }));

        setDependencyPackages(formatted);
      } catch (error) {
        console.error("Error fetching dependency packages:", error);
      }
    }

    if (userId) {
      loadDependencyPackages();
    }
  }, [userId]);


  useEffect(() => {
    async function fetchMetadata() {
      try {
        let url = "";
        if (watchlistId) {
          url = `http://localhost:3000/sbom/watchlist-metadata/${watchlistId}`;
        } else if (userWatchlistId) {
          url = `http://localhost:3000/sbom/user-watchlist-metadata/${userWatchlistId}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        setMetadata(data);
        setHistory([data.sbomPackage]);
        console.log('metadata change:', data.sbomPackage);

        currentNodeId = history[history.length - 1];
      } catch (error) {
        console.error("Failed to fetch metadata:", error);
      }
    }

    fetchMetadata();
  }, [watchlistId, userWatchlistId]);


  function handleNodeClick(newNodeId: string) {
    console.log("Clicked node:", newNodeId);

    setHistory((prev) => [...prev, newNodeId]); // push new node to history
  }

  async function handleSearch(searchBar: string, query: string) {


    if (!query.trim()) {
      setShowResults(false);
      setEShowResults(false);
      return;
    }

    try {
      let url = "";
        if (watchlistId) {
          url = `http://localhost:3000/sbom/search/${watchlistId}/${encodeURIComponent(query)}`;
        } else if (userWatchlistId) {
          url = `http://localhost:3000/sbom/user-search/${userWatchlistId}/${encodeURIComponent(query)}`;
        }

      const res = await fetch(
        url
      );
      const data = await res.json();
      console.log("Search results:", data);

      if (data.length > 0) {
        if(searchBar=='Inf'){
          setSearchResults(data);
          setShowResults(true);
        }
        else{
          setESearchResults(data);
          setEShowResults(true);
        }
      }
    } catch (error) {
      console.error("Search failed:", error);
      alert("Search failed");
    }
  }

  async function handleDownloadSbom() {
    try {
      let url = "";
      if (watchlistId) {
        url = `http://localhost:3000/sbom/watchlist/${watchlistId}`;
      } else if (userWatchlistId) {
        url = `http://localhost:3000/sbom/user-watchlist/${userWatchlistId}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch SBOM");

      const sbomJson = await res.json();

      // Create a blob and trigger download
      const blob = new Blob([JSON.stringify(sbomJson, null, 2)], { type: "application/json" });
      const durl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = durl;
      link.download = `sbom.json`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(durl);
    } catch (error) {
      console.error("Failed to download SBOM:", error);
      alert("Download failed");
    }
  }

  function handleGoBack() {
    if (history.length > 1) {
      setHistory((prev) => prev.slice(0, -1)); // pop last node
    }
  }


  function prepareLicenseData(licenseSummary: Record<string, number>) {
    const threshold = 0;

    // Convert to array of objects
    const rawData = Object.entries(licenseSummary || {}).map(([license, count]) => ({
      name: license,
      value: count,
    }));

    // Split into big vs small
    const bigLicenses = rawData.filter(item => item.value >= threshold);

    return bigLicenses;
  }

  const licenseData = prepareLicenseData(metadata.licenseSummary || {});

  const licenses = [
  {
    name: 'Apache-2.0',
    requirements: [
      'Include license and NOTICE file',
      'Grant of patent rights',
      'State changes made to code',
    ],
  },
  {
    name: 'BSD-3-Clause',
    requirements: [
      'Include license text',
      'Provide attribution',
      'Do not use names of contributors for endorsement',
    ],
  },
  {
    name: 'GPL-3.0',
    requirements: [
      'Disclose source code',
      'Use same license (copyleft)',
      'Provide installation instructions',
    ],
  },
  {
    name: 'ISC',
    requirements: [
      'Include original license text',
      'Provide attribution',
    ],
  },
  {
    name: 'MIT',
    requirements: [
      'Include original license',
      'Provide attribution',
    ],
  },
];


  const [selectedLicense, setSelectedLicense] = useState<{
    name: string;
    requirements: string[];
  } | null>(null);

  const [viewMode, setViewMode] = useState<"graph" | "list">("graph");


  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Sbom Search" description="Search through the dependencies and generate sbom ">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" className="sm:w-auto" onClick={handleDownloadSbom}>
            <Download className="mr-2 h-4 w-4" />
            Download Sbom
          </Button>
        </div>
      </PageHeader>
      
      <MainContent>
        <div className="flex items-center gap-2 mb-4">
          <label htmlFor="sbomSelect" className="font-medium">Select SBOM:</label>
          <select
            id="sbomSelect"
            value={selectedSbom}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedSbom(value);

              if (value.startsWith("user:")) {
                setUserWatchlistId(value.replace("user:", ""));
                setWatchlistId("");
              } else if (value.startsWith("dep:")) {
                setWatchlistId(value.replace("dep:", ""));
                setUserWatchlistId("");
              }
            }}
            className="border border-gray-300 rounded p-2 w-64"
          >
            <option value="" disabled>-- Select an SBOM --</option>

            <optgroup label="-- user --">
              {userRepositories.map((repo) => (
                <option key={repo.id} value={`user:${repo.id}`}>
                  {repo.label}
                </option>
              ))}
            </optgroup>

            <optgroup label="-- dep --">
              {dependencyPackages.map((dep) => (
                <option key={dep.id} value={`dep:${dep.id}`}>
                  {dep.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>


        {/* Show metadata at the top */}
        {metadata && (
          <Card className="h-[30vh]">
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
              {/* Total Components */}
              <div className="flex flex-col  items-center justify-center bg-white rounded shadow p-4">
                <h3 className="text-lg font-bold mb-2">Total Components</h3>
                <p className="text-2xl font-bold">{metadata.directDependencies + metadata.transitiveDependencies}</p>
                <div className="flex flex-row items-center">
                  <div className="flex flex-col items-center p-3">
                    <h3 className="text-md font-bold mb-2">Direct Components</h3>
                    <p className="text-1xl font-bold">{metadata.directDependencies}</p>
                  </div>
                  <div className="flex flex-col items-center p-3">
                    <h3 className="text-md font-bold mb-2">Indirect Components</h3>
                    <p className="text-1xl font-bold">{metadata.transitiveDependencies}</p>
                  </div>
                </div>
              </div>

              {/* License Summary Pie Chart */}
              <div className="bg-white rounded shadow p-4 w-[55vh] h-[28vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-2">License Summary</h3>
                <ul className="space-y-2 overflow-auto">
                  {licenseData.map((entry, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between border-b pb-1"
                    >
                      <span className="font-medium">{entry.name}</span>
                      <span className="text-sm text-gray-600">{entry.value} components</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risk Summary Bar Chart */}
              <div className="bg-white rounded shadow p-4 w-[55vh] h-[28vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">License Explorer</h3>
                
                {!selectedLicense ? (
                  // Explorer View
                  <div className="space-y-2">
                    {licenses.map((license, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedLicense(license)}
                      >
                        <span className="font-medium">{license.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Detail View
                  <div>
                    <button
                      className="text-sm text-blue-500 hover:underline mb-3"
                      onClick={() => setSelectedLicense(null)}
                    >
                      ← Back to licenses
                    </button>

                    <h4 className="text-md font-semibold mb-2">{selectedLicense.name}</h4>
                    <ul className="list-disc ml-5 text-sm text-gray-700">
                      {selectedLicense.requirements.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
        )}
        <div>
          <CardHeader className="flex justify-center items-center text-2xl font-bold">
              Sbom Exploration
            </CardHeader>
          <Card className="flex flex-row w-full mx-auto gap-4">
            
          <Card>
              <h2 className="text-xl pt-4 pl-4 pr-2 font-semibold"> Dependency Influence</h2>
            <CardContent className="w-72 flex-shrink-0 max-h-[80vh]">
              {/* Search Row */}
                <div className="relative mt-3">
                  <div className="flex items-center">
                    <Input
                      placeholder="Search packages..."
                      value={infQuery}
                            onChange={(e) => {
                            const value = e.target.value;
                            setInfQuery(value);
                            handleSearch("Inf", value); // pass input value to search function
                          }}
                      className="flex-1 max-w-xs" // limit width
                    />
                  </div>


                {showResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-white border shadow-lg max-h-64 overflow-y-auto z-50">
                    {searchResults.map((result) => (
                      <div
                        key={result.node.id}
                        className="p-2 hover:bg-gray-200 cursor-pointer"
                        onClick={() => {
                          // 1. Close popup
                          setShowResults(false);
                          setVulnerablePackages((prev) => [...prev, result.node.id]);

                          console.log(result.node.id, vulnerablePackages)
                        }}
                      >
                        {result.node.name || result.node.id}
                      </div>
                    ))}
                  </div>
                )}

                {/* Vulnerable Packages Chips */}
                {vulnerablePackages.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {vulnerablePackages.map((pkg, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm"
                      >
                        <span className="mr-2">{pkg}</span>
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() =>
                            setVulnerablePackages((prev) =>
                              prev.filter((p) => p !== pkg)
                            )
                          }
                        > ✕ </button>
                      </div>
                    ))}
                  </div>
                )}

              </div>

            </CardContent>
          </Card>
          <Card className="w-[90vw] h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4">
              <h2 className="text-xl font-semibold">Dependency Explorer</h2>
              <button
                onClick={() => setViewMode(viewMode === "graph" ? "list" : "graph")}
                className="px-3 py-1 bg-blue-500 text-white rounded"
              >
                Switch to {viewMode === "graph" ? "List" : "Graph"} View
              </button>
            </div>

            <div className="flex-1 w-full px-4">
              {/* Top row: Go Back + History display */}
              <div className="flex items-center mb-4">
                {history.length > 1 && (
                  <>
                    <button
                      onClick={handleGoBack}
                      className="p-2 rounded border border-gray-300"
                    >
                      Go Back
                    </button>

                    <div className="flex-1 flex justify-center">
                      <div className="underline font-semibold">
                        {history[history.length - 2]}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Graph Component */}
              <div className="h-[calc(100%-100px)]"> {/* Adjust height if needed */}
                <MyGraphComponent onNodeClick={handleNodeClick} />
              </div>
            </div>
          </Card>
          </Card>
        </div>
      </MainContent>
    </div>
  );
}
