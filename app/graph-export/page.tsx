"use client";

import { useEffect, useState } from "react";
import { Calendar, Download, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { MainContent } from "@/components/main-content";
import { GraphPreview } from "./GraphPreview";
import Spinner from "@/app/graph-export/loading";

const API_BASE = "/api/backend/";

type BuildTask = { repo_id: string; task_id: string };
type Snapshot = {
  snapshot_id: string;
  repo_id: string;
  commit_id?: string;
  s3_url?: string; // stringified { graphml, json, nodes_csv, edges_csv }
};

export default function GraphExportPage() {
  const [repos, setRepos] = useState<BuildTask[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedCommitId, setSelectedCommitId] = useState("");
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [exportFormat, setExportFormat] = useState<"json" | "graphml" | "csv">("json");
  const [isLoading, setIsLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [previewElements, setPreviewElements] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const GRAPH_HEIGHT = 500; // fixed canvas height to keep layout stable

  function handleQuerySubmit() {
    if (!selectedRepo || !selectedCommitId || !query) return;
    setPreviewLoading(true);
    fetch(
      `${API_BASE}/graph/subgraph?repoId=${encodeURIComponent(selectedRepo)}&commitId=${encodeURIComponent(
        selectedCommitId
      )}&q=${encodeURIComponent(query)}`
    )
      .then((res) => res.json())
      .then((data) => setPreviewElements(data.elements || []))
      .catch(() => setPreviewElements([]))
      .finally(() => setPreviewLoading(false));
  }

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/graph/build`);
        const data = await res.json();
        setRepos(Array.isArray(data) ? data : []);
      } catch {
        setRepos([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedRepo) {
      setSnapshots([]);
      setSelectedCommitId("");
      setSelectedSnapshot(null);
      return;
    }
    (async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/graph/snapshots/by-repo/${encodeURIComponent(selectedRepo)}`);
        const data = await res.json();
        setSnapshots(data);
      } catch {
        setSnapshots([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [selectedRepo]);

  useEffect(() => {
    if (!selectedCommitId || !snapshots.length) {
      setSelectedSnapshot(null);
      return;
    }
    const snap = snapshots.find((s) => (s.commit_id || "") === selectedCommitId);
    setSelectedSnapshot(snap || null);
  }, [selectedCommitId, snapshots]);

  function handleReset() {
    setSelectedRepo("");
    setSelectedCommitId("");
    setSelectedSnapshot(null);
    setSnapshots([]);
    setExportFormat("json");
    setPreviewElements([]);
    setQuery("");
  }

  async function handleDownload(format: "json" | "graphml" | "csv") {
    if (!selectedSnapshot?.s3_url) return;
    try {
      const urls = JSON.parse(selectedSnapshot.s3_url);

      if (format === "csv") {
        if (urls.nodes_csv) {
          const res1 = await fetch(urls.nodes_csv);
          const blob1 = await res1.blob();
          const link1 = document.createElement("a");
          link1.href = URL.createObjectURL(blob1);
          link1.download = `graph_snapshot_${selectedSnapshot.snapshot_id}_nodes.csv`;
          document.body.appendChild(link1);
          link1.click();
          setTimeout(() => {
            URL.revokeObjectURL(link1.href);
            document.body.removeChild(link1);
          }, 100);
        }
        if (urls.edges_csv) {
          const res2 = await fetch(urls.edges_csv);
          const blob2 = await res2.blob();
          const link2 = document.createElement("a");
          link2.href = URL.createObjectURL(blob2);
          link2.download = `graph_snapshot_${selectedSnapshot.snapshot_id}_edges.csv`;
          document.body.appendChild(link2);
          link2.click();
          setTimeout(() => {
            URL.revokeObjectURL(link2.href);
            document.body.removeChild(link2);
          }, 100);
        }
        return;
      }

      let url = "";
      let filename = "";
      if (format === "json") {
        url = urls.json;
        filename = `graph_snapshot_${selectedSnapshot.snapshot_id}.json`;
      } else if (format === "graphml") {
        url = urls.graphml;
        filename = `graph_snapshot_${selectedSnapshot.snapshot_id}.graphml`;
      }
      if (url) {
        const response = await fetch(url);
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          URL.revokeObjectURL(link.href);
          document.body.removeChild(link);
        }, 100);
      }
    } catch {
      alert("Failed to download file.");
    }
  }

  const commitIds = snapshots.map((s) => s.commit_id).filter(Boolean) as string[];

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Code Graph" description="Query your repository graph and explore results">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" className="sm:w-auto" disabled={isLoading}>
            <Calendar className="mr-2 h-4 w-4" />
            History
          </Button>
        </div>
      </PageHeader>

      <MainContent>
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle>Query & Export</CardTitle>
            <CardDescription>Select repo/commit, run a query, and export.</CardDescription>

            {/* Combined, sticky controls */}
            <div className="sticky top-0 z-10 -mx-6 mt-3 px-6 py-3 bg-background/90 backdrop-blur border-b border-border space-y-3">
              {/* Row 1: repo / commit / format / export */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[220px]">
                  <Label htmlFor="repo-select" className="sr-only">
                    Repository
                  </Label>
                  <Select value={selectedRepo} onValueChange={(val) => setSelectedRepo(val)}>
                    <SelectTrigger id="repo-select">
                      <SelectValue placeholder="Select repository" />
                    </SelectTrigger>
                    <SelectContent>
                      {repos.map((repo) => (
                        <SelectItem key={repo.repo_id} value={repo.repo_id}>
                          {repo.repo_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[220px]">
                  <Label htmlFor="commit-select" className="sr-only">
                    Commit
                  </Label>
                  <Select
                    value={selectedCommitId}
                    onValueChange={setSelectedCommitId}
                    disabled={!snapshots.length}
                  >
                    <SelectTrigger id="commit-select">
                      <SelectValue placeholder="Select commit" />
                    </SelectTrigger>
                    <SelectContent>
                      {commitIds.map((commitId, idx) => (
                        <SelectItem key={`${commitId}-${idx}`} value={commitId}>
                          {commitId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[160px]">
                  <Label htmlFor="format-select" className="sr-only">
                    Format
                  </Label>
                  <Select
                    value={exportFormat}
                    onValueChange={(val) => setExportFormat(val as "json" | "graphml" | "csv")}
                  >
                    <SelectTrigger id="format-select">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="graphml">GraphML</SelectItem>
                      <SelectItem value="csv">CSV (nodes & edges)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="ml-auto"
                  onClick={() => handleDownload(exportFormat)}
                  disabled={!selectedSnapshot}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>

              {/* Row 2: query input / run / reset */}
              <div className="flex gap-2">
                <Input
                  placeholder="Describe the subgraph you want (e.g. 'show 100 functions')"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full"
                />
                <Button onClick={handleQuerySubmit} disabled={!selectedRepo || !selectedCommitId || !query}>
                  <Search className="mr-2 h-4 w-4" />
                  Query
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setQuery("show 100 functions")}>
                  Top 100 functions
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setQuery("any calls")}>
                  Any calls
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setQuery("if/loop blocks")}>
                  If/Loop blocks
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setQuery("contributors")}>
                  Contributors
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Fixed drawing area; GraphPreview always mounted */}
            <div
              className="w-full overflow-hidden rounded-md border border-border relative"
              style={{ height: GRAPH_HEIGHT }}
            >
              <GraphPreview elements={previewElements} height={GRAPH_HEIGHT} />

              {previewLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <Spinner />
                  </div>
              )}

              {!previewLoading && previewElements.length === 0 && (
                <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
                  No graph yet — choose a repo/commit and run a query.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </MainContent>
    </div>
  );
}
