"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"

export type FlatteningSuggestion = {
    title: string
    description: string
    impact: "high" | "medium" | "low"
    dependencies: string[]
    packageName?: string
    oldVersion?: string
    newVersion?: string
    isDowngrade?: boolean
    beforeStats?: { separate: number; shared: number }
    afterStats?: { separate: number; shared: number }
    dependencyVersionChanges?: Array<{ name: string; oldVersion: string; newVersion: string }>
}

interface RecommendationItemProps {
    suggestion: FlatteningSuggestion;
    projectId: string;
    apiBase: string;
    allRecommendations?: FlatteningSuggestion[]; // All recommendations from backend
}

export function RecommendationItem({
    suggestion,
    projectId,
    apiBase,
    allRecommendations = [],
}: RecommendationItemProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Use stats from suggestion if available
    const hasStats = suggestion.beforeStats !== undefined && suggestion.afterStats !== undefined;
    
    // Debug: Log stats to console
    if (hasStats) {
        console.log(`[${suggestion.packageName}] Before - Separate: ${suggestion.beforeStats?.separate ?? 'undefined'}, Shared: ${suggestion.beforeStats?.shared ?? 'undefined'}`);
        console.log(`[${suggestion.packageName}] After - Separate: ${suggestion.afterStats?.separate ?? 'undefined'}, Shared: ${suggestion.afterStats?.shared ?? 'undefined'}`);
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="rounded-md border border-gray-800 bg-gray-950/60">
                <CollapsibleTrigger className="w-full p-3 text-left hover:bg-gray-900/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                {hasStats && (
                                    <div className="flex items-center justify-center w-5 h-5 rounded border border-gray-600 bg-gray-800">
                                        {isOpen ? (
                                            <ChevronDown className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                        ) : (
                                            <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
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
                            {hasStats && !isOpen && (
                                <div className="mt-2 flex items-center gap-4 text-[11px]">
                                    <div className="flex items-center gap-1 text-gray-500">
                                        <ChevronRight className="h-3 w-3" />
                                        <span>Click to view package changes</span>
                                    </div>
                                    {suggestion.beforeStats && suggestion.afterStats && (
                                        <div className="flex items-center gap-3 text-gray-400">
                                            <span>Before: <span className="text-white font-medium">{suggestion.beforeStats.separate ?? 0}</span> separate, <span className="text-white font-medium">{suggestion.beforeStats.shared ?? 0}</span> shared</span>
                                            <span>→</span>
                                            <span>After: <span className="text-white font-medium">{suggestion.afterStats.separate ?? 0}</span> separate, <span className="text-white font-medium">{suggestion.afterStats.shared ?? 0}</span> shared</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {suggestion.oldVersion && suggestion.newVersion && (
                            <div className="ml-4 flex-shrink-0">
                                <div className="text-xs text-gray-400">
                                    <span className="text-gray-500">{suggestion.oldVersion}</span>
                                    <span className="mx-1.5 text-gray-600">→</span>
                                    <span className="text-purple-400 font-medium">{suggestion.newVersion}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleTrigger>
                {hasStats && (
                    <CollapsibleContent className="px-3 pb-3">
                        <div className="mt-3 pt-3 border-t border-gray-800">
                            {suggestion.beforeStats && suggestion.afterStats ? (
                                <div className="space-y-4">
                                    {/* Before/After Dependency Stats */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Before */}
                                        <div className="rounded border border-gray-800 bg-gray-900/30 p-4">
                                            <div className="text-sm font-medium text-white mb-3">Before</div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-400">Separate:</span>
                                                    <span className="text-white font-medium">{suggestion.beforeStats.separate}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-400">Shared:</span>
                                                    <span className="text-white font-medium">{suggestion.beforeStats.shared ?? 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* After */}
                                        <div className="rounded border border-gray-800 bg-gray-900/30 p-4">
                                            <div className="text-sm font-medium text-white mb-3">After</div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-400">Separate:</span>
                                                    <span className={`font-medium ${
                                                        suggestion.afterStats.separate > suggestion.beforeStats.separate 
                                                            ? 'text-green-400' 
                                                            : suggestion.afterStats.separate < suggestion.beforeStats.separate 
                                                                ? 'text-red-400' 
                                                                : 'text-white'
                                                    }`}>
                                                        {suggestion.afterStats.separate}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-400">Shared:</span>
                                                    <span className={`font-medium ${
                                                        (suggestion.afterStats.shared ?? 0) > (suggestion.beforeStats.shared ?? 0)
                                                            ? 'text-green-400' 
                                                            : (suggestion.afterStats.shared ?? 0) < (suggestion.beforeStats.shared ?? 0)
                                                                ? 'text-red-400' 
                                                                : 'text-white'
                                                    }`}>
                                                        {suggestion.afterStats.shared ?? 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* All Package Changes List */}
                                    <div className="rounded border border-gray-800 bg-gray-900/30 p-3">
                                        <div className="text-xs font-medium text-white mb-2">All Package Changes:</div>
                                        <ScrollArea className="h-[200px] w-full">
                                            <div className="space-y-2 pr-4">
                                                {/* Show all recommendations from backend */}
                                                {allRecommendations.length > 0 ? (
                                                    allRecommendations.map((rec, idx) => {
                                                        if (rec.packageName && rec.oldVersion && rec.newVersion) {
                                                            // Add border-bottom to main package (first item) if there are more items or dependency changes
                                                            const hasMoreItems = idx < allRecommendations.length - 1 || (suggestion.dependencyVersionChanges && suggestion.dependencyVersionChanges.length > 0);
                                                            return (
                                                                <div key={idx} className={`flex items-center justify-between text-xs text-gray-300 ${idx > 0 ? 'border-t border-gray-800 pt-2 mt-2' : ''} ${idx === 0 && hasMoreItems ? 'border-b border-gray-800 pb-2 mb-2' : ''}`}>
                                                                    <span className="font-medium">{rec.packageName}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-gray-500">{rec.oldVersion}</span>
                                                                        <span className="text-gray-600">→</span>
                                                                        <span className={`font-medium ${rec.isDowngrade ? 'text-red-400' : 'text-purple-400'}`}>
                                                                            {rec.newVersion}
                                                                        </span>
                                                                        {rec.isDowngrade && (
                                                                            <span className="text-xs text-red-400">(downgrade)</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })
                                                ) : (
                                                    /* Fallback to current suggestion if no allRecommendations provided */
                                                    suggestion.packageName && suggestion.oldVersion && suggestion.newVersion && (
                                                        <div className="flex items-center justify-between text-xs text-gray-300">
                                                            <span className="font-medium">{suggestion.packageName}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-gray-500">{suggestion.oldVersion}</span>
                                                                <span className="text-gray-600">→</span>
                                                                <span className={`font-medium ${suggestion.isDowngrade ? 'text-red-400' : 'text-purple-400'}`}>
                                                                    {suggestion.newVersion}
                                                                </span>
                                                                {suggestion.isDowngrade && (
                                                                    <span className="text-xs text-red-400">(downgrade)</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                                {/* Show dependency version changes for this specific recommendation */}
                                                {suggestion.dependencyVersionChanges && suggestion.dependencyVersionChanges.length > 0 && (
                                                    <>
                                                        {suggestion.dependencyVersionChanges.map((change, idx) => (
                                                            <div key={`dep-change-${idx}`} className={`flex items-center justify-between text-xs text-gray-300 ${idx > 0 ? 'border-t border-gray-800 pt-2 mt-2' : ''}`}>
                                                                <span className="font-medium">{change.name}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-gray-500">{change.oldVersion}</span>
                                                                    <span className="text-gray-600">→</span>
                                                                    <span className="text-purple-400 font-medium">{change.newVersion}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </CollapsibleContent>
                )}
            </div>
        </Collapsible>
    );
}

