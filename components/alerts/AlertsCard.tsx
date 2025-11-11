"use client";

import {useMemo, useState} from "react";
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Skeleton} from "@/components/ui/skeleton";
import {colors} from "@/lib/design-system";
import Image from "next/image";

export type AlertKind = "vulnerability" | "license" | "health" | "anomaly";
export type AlertSource = "dependency" | "watchlist";

export interface AlertItem {
    id: string;
    source: AlertSource;
    pkg: { id?: string; name: string };
    kind: AlertKind;
    severity?: "critical" | "high" | "medium" | "low";
    message: string;
    detectedAt: string; // ISO
    status?: "unread" | "read" | "resolved";
    activity?: {
        commitSha?: string;
        analysisDate?: string;
        metric?: string;
        value?: number;
    };
}

export function AlertsCard({
                               title,
                               items,
                               search,
                               typeFilter,
                               onSearchChange,
                               onTypeChange,
                               onAlertClick,
                               onResolve,
                               onSendToJira,
                               pageSize = 6,
                               style,
                               hideTypeFilter = false,
                               showResolved = false,
                               isLoading = false,
                           }: {
    title: string;
    items: AlertItem[];
    search: string;
    typeFilter: "all" | AlertKind;
    onSearchChange: (s: string) => void;
    onTypeChange: (t: "all" | AlertKind) => void;
    onAlertClick?: (a: AlertItem) => void;
    onResolve?: (alertId: string) => Promise<void>;
    onSendToJira?: (alertId: string) => Promise<void>;
    pageSize?: number;
    style?: React.CSSProperties;
    hideTypeFilter?: boolean;
    showResolved?: boolean;
    isLoading?: boolean;
}) {
    const [page, setPage] = useState(1);
    const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());
    const [sendingToJiraIds, setSendingToJiraIds] = useState<Set<string>>(new Set());

    const filtered = useMemo(() => {
        const byType =
            typeFilter === "all" ? items : items.filter((i) => i.kind === typeFilter);
        const bySearch = search.trim()
            ? byType.filter((i) =>
                i.pkg.name.toLowerCase().includes(search.trim().toLowerCase())
            )
            : byType;
        const byStatus = showResolved 
            ? bySearch 
            : bySearch.filter((i) => i.status !== "resolved");
        return byStatus;
    }, [items, search, typeFilter, showResolved]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageSafe = Math.min(page, totalPages);
    const start = (pageSafe - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    const pill = (k: AlertKind) => {
        const map: Record<AlertKind, string> = {
            vulnerability: "bg-red-500/20 text-red-300",
            license: "bg-yellow-500/20 text-yellow-300",
            health: "bg-blue-500/20 text-blue-300",
            anomaly: "bg-orange-500/20 text-orange-300",
        };
        return `inline-flex items-center text-xs px-2 py-0.5 rounded ${map[k]}`;
    };

    return (
        <Card
            className="flex flex-col min-h-0 overflow-hidden"
            style={{backgroundColor: colors.background.card, ...style}}
        >
            <CardHeader className="flex-none flex flex-col gap-2">
                <CardTitle className="text-white">{title}</CardTitle>
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <Input
                            placeholder="Search alerts..."
                            value={search}
                            onChange={(e) => {
                                setPage(1);
                                onSearchChange(e.target.value);
                            }}
                            style={{
                                backgroundColor: colors.background.main,
                                borderColor: colors.border.default,
                                color: colors.text.primary,
                            }}
                        />
                    </div>

                    {!hideTypeFilter && (
                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setPage(1);
                                onTypeChange(e.target.value as "all" | AlertKind);
                            }}
                            className="rounded-md px-2 py-2 text-sm"
                            style={{
                                backgroundColor: colors.background.card,
                                borderColor: colors.border.default,
                                color: colors.text.primary,
                            }}
                        >
                            <option value="all">All types</option>
                            <option value="vulnerability">Vulnerabilities</option>
                            <option value="license">License</option>
                            <option value="health">Health</option>
                            <option value="anomaly">Anomaly</option>
                        </select>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 flex flex-col gap-3">
                {/* Scrollable list area */}
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
                    {isLoading ? (
                        // Loading skeleton
                        Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={`skeleton-${i}`}
                                className="w-full p-3 rounded-lg border"
                                style={{
                                    borderColor: colors.border.default,
                                }}
                            >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <Skeleton className="h-5 w-32" />
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-5 w-20" />
                                        <Skeleton className="h-5 w-16" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-3/4" />
                                </div>
                            </div>
                        ))
                    ) : pageItems.length === 0 ? (
                        <div className="text-sm text-gray-400">No alerts.</div>
                    ) : (
                        pageItems.map((a) => {
                            const isResolving = resolvingIds.has(a.id);
                            const isSendingToJira = sendingToJiraIds.has(a.id);
                            const isResolved = a.status === "resolved";

                            const handleResolve = async (e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (!onResolve) return;
                                setResolvingIds(prev => new Set(prev).add(a.id));
                                try {
                                    await onResolve(a.id);
                                } finally {
                                    setResolvingIds(prev => {
                                        const next = new Set(prev);
                                        next.delete(a.id);
                                        return next;
                                    });
                                }
                            };

                            const handleSendToJira = async (e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (!onSendToJira) return;
                                setSendingToJiraIds(prev => new Set(prev).add(a.id));
                                try {
                                    await onSendToJira(a.id);
                                } finally {
                                    setSendingToJiraIds(prev => {
                                        const next = new Set(prev);
                                        next.delete(a.id);
                                        return next;
                                    });
                                }
                            };

                            return (
                                <div
                                    key={a.id}
                                    className="w-full p-3 rounded-lg border transition-colors break-words"
                                    style={{
                                        borderColor: colors.border.default,
                                        backgroundColor: isResolved ? colors.background.main : undefined,
                                        opacity: isResolved ? 0.6 : 1,
                                    }}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-white font-medium break-words">{a.pkg.name}</div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={pill(a.kind)}>{a.kind}</span>
                                            {a.severity && a.kind !== 'health' && a.kind !== 'license' && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                    style={{
                                                        borderColor: colors.border.default,
                                                        color: colors.text.secondary,
                                                    }}
                                                >
                                                    {a.severity}
                                                </Badge>
                                            )}
                                            {isResolved && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs border-green-500 text-green-500"
                                                >
                                                    Resolved
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start justify-between gap-4 mt-1">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-gray-300 break-words">{a.message}</div>
                                            {a.activity && (
                                                <div className="text-xs text-gray-400 mt-0.5">
                                                    {a.activity.metric && a.activity.value !== undefined
                                                        ? `${a.activity.metric}: ${a.activity.value}`
                                                        : null}
                                                    {a.activity.commitSha ? ` • commit ${a.activity.commitSha.slice(0, 7)}` : null}
                                                </div>
                                            )}
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                Detected {new Date(a.detectedAt).toLocaleString()}
                                            </div>
                                        </div>
                                        {!isResolved && (onResolve || onSendToJira) && (
                                            <div className="flex gap-2 shrink-0">
                                                {onResolve && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={handleResolve}
                                                        disabled={isResolving}
                                                        className="text-xs"
                                                        style={{
                                                            borderColor: colors.border.default,
                                                            color: colors.text.secondary,
                                                        }}
                                                    >
                                                        {isResolving ? "Resolving..." : "Resolve"}
                                                    </Button>
                                                )}
                                                {onSendToJira && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={handleSendToJira}
                                                        disabled={isSendingToJira}
                                                        className="text-xs flex items-center justify-center gap-1"
                                                        style={{
                                                            borderColor: colors.border.default,
                                                            color: colors.text.secondary,
                                                        }}
                                                    >
                                                        {isSendingToJira ? (
                                                            "Sending..."
                                                        ) : (
                                                            <>
                                                                <Image
                                                                    src="/jira_icon.png"
                                                                    alt="Jira"
                                                                    width={14}
                                                                    height={14}
                                                                />
                                                                Send to Jira
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination row stays pinned at the bottom */}
                <div className="flex-none flex items-center justify-between pt-2">
                    <div className="text-xs text-gray-400">
                        Page {pageSafe} / {totalPages} • {filtered.length} alerts
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            disabled={pageSafe <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="text-sm"
                            style={{
                                backgroundColor: colors.background.card,
                                borderColor: colors.border.default,
                                color: colors.text.primary,
                            }}
                        >
                            Prev
                        </Button>
                        <Button
                            variant="outline"
                            disabled={pageSafe >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="text-sm"
                            style={{
                                backgroundColor: colors.background.card,
                                borderColor: colors.border.default,
                                color: colors.text.primary,
                            }}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
