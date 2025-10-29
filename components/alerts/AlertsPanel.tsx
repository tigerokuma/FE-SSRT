"use client";

import {useMemo, useState} from "react";
import {Button} from "@/components/ui/button";
import {colors} from "@/lib/design-system";
import {AlertsCard, AlertItem, AlertKind} from "./AlertsCard";

type PkgLite = {
    id?: string;                      // Packages.id (watchlist) or BranchDependency.package_id (deps)
    name: string;
    package?: {
        total_score?: number;
        vulnerability_score?: number;
        license?: string | null;
        scorecard_score?: number;
    } | null;
    added_at?: string;
};

export function AlertsPanel({
                                dependencies,
                                watchlist,
                                onOpenSettings,
                                onNavigate,            // NEW: navigation callback to activity section
                            }: {
    dependencies: PkgLite[];
    watchlist: PkgLite[];
    onOpenSettings: () => void;
    onNavigate?: (args: {
        source: "dependency" | "watchlist";
        packageId?: string;
        packageName: string;
        kind: AlertKind;
    }) => void;
}) {
    // global filters (source + type)
    const [globalType, setGlobalType] = useState<"all" | AlertKind>("all");
    const [globalSource, setGlobalSource] = useState<"all" | "dependency" | "watchlist">("all");

    // per-card search + type filters
    const [depSearch, setDepSearch] = useState("");
    const [wlSearch, setWlSearch] = useState("");
    const [depType, setDepType] = useState<"all" | AlertKind>("all");
    const [wlType, setWlType] = useState<"all" | AlertKind>("all");

    // ---- MOCK ALERTS referencing activity-like fields from your schema ----
    // For now we synthesize commitSha/analysisDate; replace with backend fields when ready.
    const mockFrom = (arr: PkgLite[], source: "dependency" | "watchlist"): AlertItem[] => {
        const now = Date.now();
        return arr.flatMap<AlertItem>((w, i) => {
            const id = w.id;
            const name = w.name;
            const total = w.package?.total_score ?? 0;
            const vul = w.package?.vulnerability_score ?? 0;
            const lic = w.package?.license ?? null;
            const scorecard = w.package?.scorecard_score ?? 0;

            const alerts: AlertItem[] = [];

            if (vul >= 60) {
                alerts.push({
                    id: `${source}-v-${id ?? i}`,
                    source,
                    pkg: {id, name},
                    kind: "vulnerability",
                    severity: vul >= 90 ? "critical" : vul >= 75 ? "high" : "medium",
                    message: `High vulnerability score detected (${vul}).`,
                    detectedAt: new Date(now - i * 60_000).toISOString(),
                    activity: {
                        metric: "vulnerability_score",
                        value: vul,
                        commitSha: "mocksha_vul_" + (i + 1),
                        analysisDate: new Date(now - i * 60_000).toISOString(),
                    },
                });
            }

            if (!lic || lic.toUpperCase().startsWith("GPL")) {
                alerts.push({
                    id: `${source}-l-${id ?? i}`,
                    source,
                    pkg: {id, name},
                    kind: "license",
                    message: lic
                        ? `License ${lic} may be incompatible with policy.`
                        : "No license detected.",
                    detectedAt: new Date(now - i * 120_000).toISOString(),
                    activity: {
                        metric: "license",
                        value: undefined,
                        commitSha: "mocksha_lic_" + (i + 1),
                        analysisDate: new Date(now - i * 120_000).toISOString(),
                    },
                });
            }

            if (total <= 50 || scorecard < 5) {
                alerts.push({
                    id: `${source}-h-${id ?? i}`,
                    source,
                    pkg: {id, name},
                    kind: "health",
                    message:
                        total <= 50
                            ? `Low overall health (${total}/100).`
                            : `Low Scorecard rating (${scorecard}).`,
                    detectedAt: new Date(now - i * 180_000).toISOString(),
                    activity: {
                        metric: total <= 50 ? "overall_health_score" : "scorecard_score",
                        value: total <= 50 ? total : scorecard,
                        commitSha: "mocksha_health_" + (i + 1),
                        analysisDate: new Date(now - i * 180_000).toISOString(),
                    },
                });
            }

            return alerts;
        });
    };

    const depAlerts = useMemo(() => mockFrom(dependencies || [], "dependency"), [dependencies]);
    const wlAlerts = useMemo(() => mockFrom(watchlist || [], "watchlist"), [watchlist]);

    const depFiltered = useMemo(() => {
        const byType = globalType === "all" ? depAlerts : depAlerts.filter(a => a.kind === globalType);
        const bySource = globalSource === "all" || globalSource === "dependency" ? byType : [];
        return bySource;
    }, [depAlerts, globalType, globalSource]);

    const wlFiltered = useMemo(() => {
        const byType = globalType === "all" ? wlAlerts : wlAlerts.filter(a => a.kind === globalType);
        const bySource = globalSource === "all" || globalSource === "watchlist" ? byType : [];
        return bySource;
    }, [wlAlerts, globalType, globalSource]);

    return (
        <div className="space-y-4 min-h-0">
            {/* top row */}
            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={globalSource}
                    onChange={(e) => setGlobalSource(e.target.value as any)}
                    className="rounded-md px-2 py-2 text-sm"
                    style={{
                        backgroundColor: colors.background.card,
                        borderColor: colors.border.default,
                        color: colors.text.primary,
                    }}
                >
                    <option value="all">All sources</option>
                    <option value="dependency">Dependencies</option>
                    <option value="watchlist">Watchlist</option>
                </select>

                <select
                    value={globalType}
                    onChange={(e) => setGlobalType(e.target.value as any)}
                    className="rounded-md px-2 py-2 text-sm"
                    style={{
                        backgroundColor: colors.background.card,
                        borderColor: colors.border.default,
                        color: colors.text.primary,
                    }}
                >
                    <option value="all">All alert types</option>
                    <option value="vulnerability">Vulnerabilities</option>
                    <option value="license">License</option>
                    <option value="health">Health</option>
                </select>

                <div className="ml-auto"/>

                <Button
                    variant="outline"
                    onClick={onOpenSettings}
                    className="text-sm"
                    style={{
                        backgroundColor: colors.background.card,
                        borderColor: colors.border.default,
                        color: colors.text.primary,
                    }}
                >
                    Alert Settings
                </Button>
            </div>

            {/* two equal-height cards; min-h-0 prevents overflow from parent */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
                <AlertsCard
                    title="Dependency Alerts"
                    items={depFiltered}
                    search={depSearch}
                    typeFilter={depType}
                    onSearchChange={setDepSearch}
                    onTypeChange={setDepType}
                    onAlertClick={(a) => onNavigate?.({
                        source: "dependency",
                        packageId: a.pkg.id,
                        packageName: a.pkg.name,
                        kind: a.kind
                    })}
                    pageSize={4}                                   // 👈 ensure fits without scroll
                    style={{height: "calc(100vh - 200px)"}}      // keeps columns even; no scroll inside
                />
                <AlertsCard
                    title="Watchlist Alerts"
                    items={wlFiltered}
                    search={wlSearch}
                    typeFilter={wlType}
                    onSearchChange={setWlSearch}
                    onTypeChange={setWlType}
                    onAlertClick={(a) => onNavigate?.({
                        source: "watchlist",
                        packageId: a.pkg.id,
                        packageName: a.pkg.name,
                        kind: a.kind
                    })}
                    pageSize={4}                                   // 👈 same here
                    style={{height: "calc(100vh - 200px)"}}
                />
            </div>
        </div>
    );
}
