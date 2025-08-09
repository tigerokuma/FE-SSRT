"use client"

import {useEffect, useState} from "react"
import {Calendar, Download, FileDown, GitBranch, GitCommit, GitMerge, Search} from "lucide-react"

import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {PageHeader} from "@/components/page-header"
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group"
import {MainContent} from "@/components/main-content"
import {GraphPreview} from "./GraphPreview";

const API_BASE = "/api/backend/"

type BuildTask = {
    repo_id: string
    task_id: string
    // ...other fields
}

type Snapshot = {
    snapshot_id: string
    repo_id: string
    commit_id?: string
    s3_url?: string // json string of {graphml,json,nodes_csv,edges_csv}
    // ...other fields
}

export default function GraphExportPage() {
    const [repos, setRepos] = useState<BuildTask[]>([])
    const [snapshots, setSnapshots] = useState<Snapshot[]>([])
    const [selectedRepo, setSelectedRepo] = useState<string>("")
    const [selectedCommitId, setSelectedCommitId] = useState<string>("")
    const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null)
    const [exportFormat, setExportFormat] = useState<"json" | "graphml" | "csv">("json")
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const [query, setQuery] = useState("");
    const [previewElements, setPreviewElements] = useState<any[]>([]); // Cytoscape elements
    const [previewLoading, setPreviewLoading] = useState(false);

    function handleQuerySubmit() {
        if (!selectedRepo || !selectedCommitId || !query) {
            alert("Please select repo, commit, and enter a query.");
            return;
        }
        setPreviewLoading(true);
        fetch(`${API_BASE}/graph/subgraph?repoId=${encodeURIComponent(selectedRepo)}&commitId=${encodeURIComponent(selectedCommitId)}&q=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => {
                setPreviewElements(data.elements || []);
            })
            .catch(() => setPreviewElements([]))
            .finally(() => setPreviewLoading(false));
    }

    // Fetch all repos (build tasks)
    useEffect(() => {
        async function fetchRepos() {
            try {
                setIsLoading(true)
                const res = await fetch(`${API_BASE}/graph/build`)
                const data = await res.json()
                // Always fallback to empty array if not an array
                setRepos(Array.isArray(data) ? data : [])
            } catch (e) {
                setRepos([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchRepos()
    }, [])

    // Fetch all snapshots for selected repo
    useEffect(() => {
        if (!selectedRepo) {
            setSnapshots([])
            setSelectedCommitId("")
            setSelectedSnapshot(null)
            return
        }

        async function fetchSnapshots() {
            try {
                setIsLoading(true)
                const res = await fetch(`${API_BASE}/graph/snapshots/by-repo/${encodeURIComponent(selectedRepo)}`)
                const data = await res.json()
                setSnapshots(data)
            } catch (e) {
                setSnapshots([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchSnapshots()
    }, [selectedRepo])

    // Find selected snapshot object
    useEffect(() => {
        if (!selectedCommitId || !snapshots.length) {
            setSelectedSnapshot(null)
            return
        }
        const snap = snapshots.find(s => (s.commit_id || "") === selectedCommitId)
        setSelectedSnapshot(snap || null)
    }, [selectedCommitId, snapshots])

    // Reset all state
    function handleReset() {
        setSelectedRepo("")
        setSelectedCommitId("")
        setSelectedSnapshot(null)
        setSnapshots([])
        setExportFormat("json")
    }

    // Download graph
    async function handleDownload(format: "json" | "graphml" | "csv") {
        if (!selectedSnapshot?.s3_url) return;
        try {
            const urls = JSON.parse(selectedSnapshot.s3_url);
            if (format === "csv") {
                // Download nodes CSV
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
                // Download edges CSV
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
                return; // Don't continue
            }
            // JSON/GraphML single file
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
        } catch (e) {
            alert("Failed to download file.");
        }
    }

    // Render commit id options
    const commitIds = snapshots.map(s => s.commit_id).filter(Boolean)

    return (
        <div className="flex flex-col min-h-screen">
            <PageHeader title="Graph Export" description="Export and visualize your repository dependencies">
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" size="sm" className="sm:w-auto">
                        <Calendar className="mr-2 h-4 w-4"/>
                        History
                    </Button>
                </div>
            </PageHeader>

            <MainContent>
                <div className="flex flex-col gap-4 mb-4">
                    <h2 className="text-xl font-bold tracking-tight">Export Configuration</h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Export Settings</CardTitle>
                                <CardDescription>Configure your graph export settings</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="repo-select">Select Repository</Label>
                                        <Select value={selectedRepo} onValueChange={(val) => setSelectedRepo(val)}>
                                            <SelectTrigger id="repo-select">
                                                <SelectValue placeholder="Select a repository"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {repos.map(repo =>
                                                    <SelectItem key={repo.repo_id} value={repo.repo_id}>
                                                        {repo.repo_id}
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="commit-range">Commit</Label>
                                        <Select value={selectedCommitId} onValueChange={setSelectedCommitId}
                                                disabled={!commitIds.length}>
                                            <SelectTrigger id="commit-range">
                                                <SelectValue placeholder="Select commit"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {commitIds.map((commitId: string | undefined, idx: number) =>
                                                    <SelectItem
                                                        key={`${commitId ?? "unknown"}-${idx}`}
                                                        value={commitId ?? ""}
                                                    >
                                                        {commitId ?? "(no commit id)"}
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Export Format</Label>
                                        <RadioGroup
                                            value={exportFormat}
                                            onValueChange={val => setExportFormat(val as "json" | "graphml" | "csv")}
                                            className="flex flex-col space-y-1"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="json" id="json"/>
                                                <Label htmlFor="json">JSON</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="graphml" id="graphml"/>
                                                <Label htmlFor="graphml">GraphML</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="csv" id="csv"/>
                                                <Label htmlFor="csv">CSV (Nodes & Edges)</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    <Button
                                        className="sm:w-auto"
                                        onClick={() => handleDownload(exportFormat)}
                                        disabled={!selectedSnapshot}
                                    >
                                        <Download className="mr-2 h-4 w-4"/>
                                        Export Graph
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Exports</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Optionally show history here */}
                                    {repos.slice(0, 3).map((repo, idx) => (
                                        <div key={repo.repo_id + idx}
                                             className="flex items-center justify-between rounded-lg border p-3">
                                            <div className="flex items-center gap-2">
                                                <GitBranch className="h-4 w-4 text-muted-foreground"/>
                                                <span className="text-sm font-medium">{repo.repo_id}</span>
                                            </div>
                                            <Button variant="ghost" size="icon">
                                                <FileDown className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Graph Preview</CardTitle>
                            <CardDescription>
                                {selectedRepo && selectedCommitId
                                    ? `Visualizing ${selectedRepo}@${selectedCommitId}`
                                    : "Select a repository and commit to preview its graph"}
                            </CardDescription>
                        </CardHeader>
                        <div className="flex gap-2 mb-2">
                            <Input
                                placeholder="Enter graph query (e.g., function name, node id...)"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="w-full"
                            />
                            <Button onClick={handleQuerySubmit} disabled={!selectedRepo || !selectedCommitId || !query}>
                                <Search className="mr-2 h-4 w-4"/>
                                Query
                            </Button>
                        </div>
                        <CardContent className="h-[500px] flex items-center justify-center">
                            {previewLoading ? (
                                <div>Loading...</div>
                            ) : previewElements.length > 0 ? (
                                <GraphPreview elements={previewElements}/>
                            ) : (
                                <div className="text-center p-6">
                                    <div
                                        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                                        <GitCommit className="h-10 w-10 text-muted-foreground"/>
                                    </div>
                                    <h3 className="mt-4 text-lg font-medium">No Repository Selected</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Select a repository and configure your export settings to generate a graph
                                        preview.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={handleReset}>Reset</Button>
                            <Button onClick={() => handleDownload("graphml")} disabled={!selectedSnapshot}>
                                <Download className="mr-2 h-4 w-4"/>
                                Download GraphML
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </MainContent>
        </div>
    )
}
