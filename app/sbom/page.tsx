"use client";

import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { MainContent } from "@/components/main-content";

import MyGraphComponent from "@/components/sbom/MyGraphComponent";
import DependencyExplorerOptions from "@/components/sbom/ExplorerOptions";
import DependencySelector from "@/components/sbom/DependencySelector";
import MetadataCard from "@/components/sbom/MetadataCard";
import VulnerablePackagesList from "@/components/sbom/VulnerablePackagesList";

const API_PROXY_PATH = process.env.NEXT_PUBLIC_API_PROXY_PATH || '/api/backend'

export default function SbomSearchPage() {
  const userRepositories = [{ id: "user-123", label: "main" }];
  const userId = "user-123";

  const [infQuery, setInfQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [eQuery, setEQuery] = useState("");
  const [showEResults, setEShowResults] = useState(false);
  const [searchEResults, setESearchResults] = useState<any[]>([]);
  const [vulnerablePackages, setVulnerablePackages] = useState<string[]>([]);
  const [selectedSbom, setSelectedSbom] = useState<string>("");
  const [dependencyPackages, setDependencyPackages] = useState<{ id: string; label: string }[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [watchlistId, setWatchlistId] = useState<string>("");
  const [userWatchlistId, setUserWatchlistId] = useState<string>(userId);
  const [currentNodeId, setCurrentNodeId] = useState<string>(`pkg:user/${userId}@latest`);
  const [metadata, setMetadata] = useState({
    sbomPackage: "",
    directDependencies: 0,
    transitiveDependencies: 0,
    licenseSummary: {},
    riskSummary: {},
  });
  const [viewMode, setViewMode] = useState<"graph" | "list">("graph");
  const [allLicenses, setAllLicenses] = useState<string[]>([]);
  const [includedLicenses, setIncludedLicenses] = useState<string[]>([]);
  const [excludedLicenses, setExcludedLicenses] = useState<string[]>([]);
  const [showGraphLicense, setShowGraphLicense] = useState(false);


  // Fetch dependency packages
  useEffect(() => {
    async function loadDependencyPackages() {
      try {
        const res = await fetch(`${API_PROXY_PATH}/sbom/dep-list/${userId}`);
        const data = await res.json();
        const formatted = data.map((item: any) => ({
          id: item.watchlist_id,
          label: item.package_name,
        }));
        setDependencyPackages(formatted);
      } catch (error) {
        console.error("Error fetching dependency packages:", error);
      }
    }
    if (userId) loadDependencyPackages();
  }, [userId]);

  // Fetch metadata on watchlist or userWatchlist change
  useEffect(() => {
    async function fetchMetadata() {
      try {
        let url = "";
        if (watchlistId) url = `${API_PROXY_PATH}/sbom/watchlist-metadata/${watchlistId}`;
        else if (userWatchlistId) url = `${API_PROXY_PATH}/sbom/user-watchlist-metadata/${userWatchlistId}`;

        const res = await fetch(url);
        const data = await res.json();
        setMetadata(data);

        const licenseNames = Object.values(data.licenseSummary)
          .map((entry) => (entry as { id: string }).id)
          .sort((a, b) => a.localeCompare(b))
        setAllLicenses(licenseNames);

        setHistory([data.sbomPackage]);
        setCurrentNodeId(data.sbomPackage);
      } catch (error) {
        console.error("Failed to fetch metadata:", error);
      }
    }
    fetchMetadata();
  }, [watchlistId, userWatchlistId]);

  function onSelectSbom(value: string) {
    if (value.startsWith("user:")) {
      setUserWatchlistId(value.replace("user:", ""));
      setWatchlistId("");
    } else if (value.startsWith("dep:")) {
      setWatchlistId(value.replace("dep:", ""));
      setUserWatchlistId("");
    }
  }


  function handleNodeClick(newNodeId: string) {
    setCurrentNodeId(newNodeId);
    setHistory((prev) => [...prev, newNodeId]);
  }

  async function handleSearch(searchBar: string, query: string) {
    if (!query.trim()) {
      setShowResults(false);
      setEShowResults(false);
      return;
    }
    try {
      let url = "";
      if (watchlistId) url = `${API_PROXY_PATH}/sbom/search/${watchlistId}/${encodeURIComponent(query)}`;
      else if (userWatchlistId) url = `${API_PROXY_PATH}/sbom/user-search/${userWatchlistId}/${encodeURIComponent(query)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.length > 0) {
        if (searchBar === "Inf") {
          setSearchResults(data);
          setShowResults(true);
        } else {
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
      if (watchlistId) url = `${API_PROXY_PATH}/sbom/watchlist/${watchlistId}`;
      else if (userWatchlistId) url = `${API_PROXY_PATH}/sbom/user-watchlist/${userWatchlistId}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch SBOM");

      const sbomJson = await res.json();
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
      setCurrentNodeId(history[history.length - 2]);
      setHistory((prev) => prev.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Sbom Search" description="Search through the dependencies and generate sbom">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadSbom}>
            <Download className="mr-2 h-4 w-4" />
            Download Sbom
          </Button>
        </div>
      </PageHeader>

      <MainContent>
        <div className=" flex flex-col gap-4">
        <DependencySelector
          userRepositories={userRepositories}
          dependencyPackages={dependencyPackages}
          selectedSbom={selectedSbom}
          setSelectedSbom={setSelectedSbom}
          onSelectSbom={onSelectSbom}
        />
        
        <MetadataCard metadata={metadata} />
        
        <Card className="p-4">
        <CardHeader className="p-3 text-2xl font-bold">Sbom Exploration</CardHeader>

        <div className="flex flex-row h-[800px] mx-auto gap-4">
          <Card className="h-full">
            <h2 className="text-xl pt-4 pl-4 pr-2 font-semibold">Dependency Influence</h2>
            <CardContent className="w-72">
              <div className="relative mt-3">
                <div className="flex items-center">
                  <Input
                    placeholder="Search packages..."
                    value={infQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setInfQuery(value);
                      handleSearch("Inf", value);
                    }}
                    className="flex-1 max-w-xs"
                  />
                </div>

                {showResults && searchResults.length > 0 && (
                  <Card
                    className="absolute w-full bg-white border shadow-lg max-h-64 overflow-y-auto z-50
                              dark:bg-gray-800 dark:border-gray-700 dark:shadow-gray-900"
                  >
                    {searchResults.map((result) => (
                      <div
                        key={result.node.id}
                        className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 text-black dark:text-gray-100"
                        onClick={() => {
                          setShowResults(false);
                          setVulnerablePackages((prev) =>
                            prev.includes(result.node.id) ? prev : [...prev, result.node.id]
                          );
                        }}
                      >
                        {result.node.name || result.node.id}
                      </div>
                    ))}
                  </Card>
                )}

                <VulnerablePackagesList
                  vulnerablePackages={vulnerablePackages}
                  onRemovePackage={(pkg) =>
                    setVulnerablePackages((prev) => prev.filter((p) => p !== pkg))
                  }
                />
              </div>
            </CardContent>
          </Card>


          <Card className="overflow-hidden w-[1000px] flex-1 flex flex-col">
            <div className="flex justify-between items-center p-4">
              <h2 className="text-xl font-semibold">Dependency Explorer</h2>
              <button
                onClick={() => setViewMode(viewMode === "graph" ? "list" : "graph")}
                className="px-3 py-1 bg-blue-500 text-white rounded"
              >
                Switch to {viewMode === "graph" ? "List" : "Graph"} View
              </button>
            </div>
            

           
            <div className="flex-1 w-full px-4 flex flex-col">
              <div className="relative w-full px-4 mb-4 h-10">
                {/* Left: Go Back Button */}
                <div className="absolute left-0 top-0 h-full flex items-center">
                  <button
                    onClick={handleGoBack}
                    disabled={history.length <= 1}
                    className={`p-1.5 rounded border ${
                      history.length <= 1
                        ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed dark:border-gray-700 dark:text-gray-600 dark:bg-gray-800"
                        : "border-gray-300 hover:bg-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                    }`}
                  >
                    Go Back
                  </button>
                </div>

                {/* Center: History Label */}
                <div className="absolute left-1/2 top-0 transform -translate-x-1/2 h-full flex items-center">
                  {history.length >= 1 && (
                    <div className="underline font-semibold text-center">
                      {history[history.length - 1]}
                    </div>
                  )}
                </div>

                {/* Right: Switch + License Filter */}
                <div className="absolute right-0 top-0 h-full flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs whitespace-normal w-20 text-center">
                      Show Graph Licenses
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowGraphLicense(!showGraphLicense)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        showGraphLicense ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          showGraphLicense ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <DependencyExplorerOptions
                    allLicenses={allLicenses}
                    includedLicenses={includedLicenses}
                    setIncludedLicenses={setIncludedLicenses}
                    excludedLicenses={excludedLicenses}
                    setExcludedLicenses={setExcludedLicenses}
                  />
                </div>
              </div>


              <MyGraphComponent
                currentNodeId={currentNodeId}
                watchlistId={watchlistId}
                userWatchlistId={userWatchlistId}
                vulnerablePackages={vulnerablePackages}
                viewMode={viewMode}
                onNodeClick={handleNodeClick}
                eQuery={eQuery}
                setEQuery={setEQuery}
                showEResults={showEResults}
                setEShowResults={setEShowResults}
                searchEResults={searchEResults}
                setESearchResults={setESearchResults}
                handleSearch={handleSearch}
                includedLicenses={includedLicenses}
                excludedLicenses={excludedLicenses}
                showGraphLicense={showGraphLicense}
              />
            </div>
          </Card>
        </div>
        </Card>
        </div>
      </MainContent>
    </div>
  );
}
