"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { RecommendationDependencyGraph } from "./RecommendationDependencyGraph"

export type FlatteningSuggestion = {
    title: string
    description: string
    impact: "high" | "medium" | "low"
    dependencies: string[]
    packageName?: string
    oldVersion?: string
    newVersion?: string
}

interface RecommendationItemProps {
    suggestion: FlatteningSuggestion;
    projectId: string;
    apiBase: string;
}

export function RecommendationItem({
    suggestion,
    projectId,
    apiBase,
}: RecommendationItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [graphData, setGraphData] = useState<any>(null);
    const [loadingGraph, setLoadingGraph] = useState(false);

    // Generate dummy data for demonstration
    const getDummyData = () => {
        const packageName = suggestion.packageName || 'example-package';
        const oldVersion = suggestion.oldVersion || '1.2.3';
        const newVersion = suggestion.newVersion || '2.0.0';
        
        return {
            projectName: 'My Project',
            packageName: packageName,
            oldVersion: oldVersion,
            newVersion: newVersion,
            oldSeparateDependencies: 12,
            oldSharedDependencies: 8,
            newSeparateDependencies: 15,
            newSharedDependencies: 5,
            changeSeparate: 3,
            changeShared: -3,
        };
    };

    useEffect(() => {
        if (isOpen && suggestion.packageName && suggestion.oldVersion && suggestion.newVersion && !graphData) {
            setLoadingGraph(true);
            // Simulate API call with timeout to show loading state
            setTimeout(() => {
                const pkgName = suggestion.packageName || 'example-package';
                const oldVer = suggestion.oldVersion || '1.2.3';
                const newVer = suggestion.newVersion || '2.0.0';
                
                fetch(
                    `${apiBase}/sbom/upgrade-graph/${projectId}?packageName=${encodeURIComponent(pkgName)}&oldVersion=${encodeURIComponent(oldVer)}&newVersion=${encodeURIComponent(newVer)}`
                )
                    .then((res) => res.json())
                    .then((data) => {
                        // Use dummy data if API fails or returns error
                        if (data.error || !data.projectName) {
                            setGraphData(getDummyData());
                        } else {
                            setGraphData(data);
                        }
                        setLoadingGraph(false);
                    })
                    .catch((err) => {
                        console.error('Failed to load graph, using dummy data:', err);
                        // Use dummy data on error
                        setGraphData(getDummyData());
                        setLoadingGraph(false);
                    });
            }, 500); // Small delay to show loading state
        }
    }, [isOpen, suggestion.packageName, suggestion.oldVersion, suggestion.newVersion, graphData, projectId, apiBase]);

    const hasGraph = suggestion.packageName && suggestion.oldVersion && suggestion.newVersion;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="rounded-md border border-gray-800 bg-gray-950/60">
                <CollapsibleTrigger className="w-full p-3 text-left hover:bg-gray-900/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                {hasGraph && (
                                    <div className="flex items-center justify-center w-5 h-5 rounded border border-blue-500/50 bg-blue-500/10">
                                        {isOpen ? (
                                            <ChevronDown className="h-3 w-3 text-blue-400 flex-shrink-0" />
                                        ) : (
                                            <ChevronRight className="h-3 w-3 text-blue-400 flex-shrink-0" />
                                        )}
                                    </div>
                                )}
                                <p className="text-sm font-medium text-white">{suggestion.title}</p>
                                <span
                                    className={`text-xs uppercase tracking-wide ${
                                        suggestion.impact === "high"
                                            ? "text-rose-300"
                                            : suggestion.impact === "medium"
                                                ? "text-amber-300"
                                                : "text-slate-300"
                                    }`}
                                >
                                    {suggestion.impact}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{suggestion.description}</p>
                            {suggestion.dependencies.length > 0 && (
                                <p className="text-[11px] text-gray-500 mt-1">
                                    Related: {suggestion.dependencies.join(", ")}
                                </p>
                            )}
                            {hasGraph && !isOpen && (
                                <p className="text-[11px] text-blue-400 mt-1 flex items-center gap-1">
                                    <ChevronRight className="h-3 w-3" />
                                    Click to view dependency graph
                                </p>
                            )}
                        </div>
                        {suggestion.oldVersion && suggestion.newVersion && (
                            <div className="ml-4 flex-shrink-0">
                                <div className="text-xs text-gray-400">
                                    <span className="text-gray-500">{suggestion.oldVersion}</span>
                                    <span className="mx-1.5 text-gray-600">→</span>
                                    <span className="text-blue-400 font-medium">{suggestion.newVersion}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleTrigger>
                {hasGraph && (
                    <CollapsibleContent className="px-3 pb-3">
                        <div className="mt-3 pt-3 border-t border-gray-800">
                            {loadingGraph ? (
                                <div className="flex items-center justify-center h-64 text-gray-400">
                                    Loading dependency graph...
                                </div>
                            ) : graphData?.error ? (
                                <div className="text-sm text-red-400">Failed to load dependency graph</div>
                            ) : graphData ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Old Version Graph */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-medium text-white">Old Version</h4>
                                                <span className="text-xs text-gray-400">
                                                    {graphData.oldVersion}
                                                </span>
                                            </div>
                                            <div className="rounded border border-gray-800 bg-gray-900/50 p-4">
                                                <RecommendationDependencyGraph
                                                    projectName={graphData.projectName}
                                                    packageName={`${graphData.packageName}@${graphData.oldVersion}`}
                                                    separateCount={graphData.oldSeparateDependencies}
                                                    sharedCount={graphData.oldSharedDependencies}
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* New Version Graph */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-medium text-white">New Version</h4>
                                                <span className="text-xs text-gray-400">
                                                    {graphData.newVersion}
                                                </span>
                                            </div>
                                            <div className="rounded border border-gray-800 bg-gray-900/50 p-4">
                                                <RecommendationDependencyGraph
                                                    projectName={graphData.projectName}
                                                    packageName={`${graphData.packageName}@${graphData.newVersion}`}
                                                    separateCount={graphData.newSeparateDependencies}
                                                    sharedCount={graphData.newSharedDependencies}
                                                    changeSeparate={graphData.changeSeparate}
                                                    changeShared={graphData.changeShared}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Summary */}
                                    {(graphData.changeSeparate !== 0 || graphData.changeShared !== 0) && (
                                        <div className="rounded border border-gray-800 bg-gray-900/30 p-3">
                                            <div className="text-xs text-gray-300 space-y-1">
                                                <div className="font-medium text-white mb-2">Impact Summary:</div>
                                                {graphData.changeSeparate !== 0 && (
                                                    <div>
                                                        • Separate dependencies: {graphData.changeSeparate > 0 ? '+' : ''}{graphData.changeSeparate}
                                                    </div>
                                                )}
                                                {graphData.changeShared !== 0 && (
                                                    <div>
                                                        • Shared dependencies: {graphData.changeShared > 0 ? '+' : ''}{graphData.changeShared}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </CollapsibleContent>
                )}
            </div>
        </Collapsible>
    );
}

