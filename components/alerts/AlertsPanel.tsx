"use client";

import {useMemo, useState, useEffect} from "react";
import {Button} from "@/components/ui/button";
import {colors} from "@/lib/design-system";
import {AlertsCard, AlertItem, AlertKind} from "./AlertsCard";
import Image from "next/image";

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
                                projectId,
                                apiBase,
                                notificationSettings,
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
    projectId: string;
    apiBase: string;
    notificationSettings?: {
        vulnerability?: { alerts: boolean; slack: boolean; discord: boolean };
        license?: { alerts: boolean; slack: boolean; discord: boolean };
        health?: { alerts: boolean; slack: boolean; discord: boolean };
        anomaly?: { alerts: boolean; slack: boolean; discord: boolean };
    };
}) {
    // global filters (source + type)
    const [globalType, setGlobalType] = useState<"all" | AlertKind>("all");
    const [globalSource, setGlobalSource] = useState<"all" | "dependency" | "watchlist">("all");
    const [showResolvedAlerts, setShowResolvedAlerts] = useState(false);
    const [projectAlerts, setProjectAlerts] = useState<any[]>([]);
    const [loadingAlerts, setLoadingAlerts] = useState(true);
    const [jiraConnected, setJiraConnected] = useState(false);

    // per-card search + type filters
    const [depSearch, setDepSearch] = useState("");
    const [wlSearch, setWlSearch] = useState("");
    const [depType, setDepType] = useState<"all" | AlertKind>("all");
    const [wlType, setWlType] = useState<"all" | AlertKind>("all");

    // Fetch project alerts from backend
    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                setLoadingAlerts(true);
                const response = await fetch(`${apiBase}/projects/${projectId}/alerts`);
                if (!response.ok) {
                    console.error('Failed to fetch project alerts');
                    return;
                }
                const data = await response.json();
                // Combine projectAlerts and packageAlerts
                const allAlerts = [
                    ...(data.projectAlerts || []),
                    ...(data.packageAlerts || []),
                ];
                setProjectAlerts(allAlerts);
            } catch (error) {
                console.error('Error fetching project alerts:', error);
            } finally {
                setLoadingAlerts(false);
            }
        };

        if (projectId) {
            fetchAlerts();
        }
    }, [projectId, apiBase]);

    // Fetch Jira connection status
    useEffect(() => {
        const fetchJiraStatus = async () => {
            try {
                const response = await fetch(`${apiBase}/jira/projects/${projectId}/status`);
                if (response.ok) {
                    const data = await response.json();
                    setJiraConnected(data.connected || false);
                }
            } catch (error) {
                console.error('Error fetching Jira status:', error);
            }
        };

        if (projectId) {
            fetchJiraStatus();
        }
    }, [projectId, apiBase]);

    // Convert project alerts to AlertItem format
    const convertProjectAlerts = useMemo(() => {
        if (!projectAlerts || projectAlerts.length === 0) return { depAlerts: [], wlAlerts: [] };

        // Get package IDs from dependencies - check all possible locations
        const depPackageIds = new Set<string>();
        dependencies.forEach(d => {
            const pkg = (d as any).package;
            const packageId = pkg?.id || (d as any).package_id || d.id;
            if (packageId) {
                depPackageIds.add(packageId);
            }
        });

        // Get package IDs from watchlist
        const wlPackageIds = new Set<string>();
        watchlist.forEach(w => {
            const pkg = (w as any).package;
            const packageId = pkg?.id || (w as any).package_id || w.id;
            if (packageId) {
                wlPackageIds.add(packageId);
            }
        });

        const depAlertsList: AlertItem[] = [];
        const wlAlertsList: AlertItem[] = [];
        const projectLevelAlerts: AlertItem[] = [];

        console.log('Converting alerts:', {
            totalAlerts: projectAlerts.length,
            depPackageIds: Array.from(depPackageIds),
            wlPackageIds: Array.from(wlPackageIds),
        });

        for (const alert of projectAlerts) {
            // Handle both ProjectAlert and ProjectPackageAlert structures
            const alertType = alert.alert_type;
            const packageId = alert.package_id;
            const isProjectPackageAlert = alertType === 'vulnerability' || alertType === 'anomaly';
            
            // For ProjectPackageAlert, extract message and details differently
            let message = alert.message;
            let severity = alert.severity as "critical" | "high" | "medium" | "low" | undefined;
            let activity: any = undefined;

            if (isProjectPackageAlert && alertType === 'vulnerability') {
                // ProjectPackageAlert vulnerability
                const vulnDetails = alert.vulnerability_details as any;
                message = vulnDetails?.summary || alert.message || `Vulnerability detected: ${alert.vulnerability_id}`;
                severity = alert.severity as "critical" | "high" | "medium" | "low" | undefined;
                activity = {
                    metric: "vulnerability",
                    value: undefined,
                    commitSha: undefined,
                    analysisDate: alert.detected_at || alert.created_at,
                };
            } else if (isProjectPackageAlert && alertType === 'anomaly') {
                // ProjectPackageAlert anomaly
                const score = alert.anomaly_score || 0;
                const breakdown = (alert.score_breakdown || []) as Array<{
                    factor: string;
                    points: number;
                    reason: string;
                }>;
                const factorCount = breakdown.length;
                
                // Format factor names
                const formatFactorName = (factor: string): string => {
                    const factorMap: Record<string, string> = {
                        'files_changed': 'Files Changed',
                        'lines_changed': 'Lines Changed',
                        'message_length': 'Message Length',
                        'insert_delete_ratio': 'Insert/Delete Ratio',
                        'abnormal_time': 'Abnormal Time',
                        'abnormal_day': 'Abnormal Day',
                        'new_files': 'New Files',
                    };
                    return factorMap[factor] || factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                };
                
                // Build breakdown text
                let breakdownText = '';
                if (breakdown.length > 0) {
                    const breakdownItems = breakdown.map(item => 
                        `${formatFactorName(item.factor)}: +${item.points.toFixed(1)}`
                    ).join(', ');
                    breakdownText = ` (${breakdownItems})`;
                }
                
                message = `Commit generated anomaly score of ${score.toFixed(1)}${breakdownText}`;
                activity = {
                    metric: "anomaly_score",
                    value: score,
                    commitSha: alert.commit_sha,
                    analysisDate: alert.detected_at || alert.created_at,
                };
            } else {
                // ProjectAlert (health, license)
                activity = alert.details ? {
                    metric: alert.alert_type,
                    value: (alert.details as any)?.score || (alert.details as any)?.new_score,
                    commitSha: (alert.details as any)?.commit_sha,
                    analysisDate: alert.detected_at || alert.created_at,
                } : undefined;
            }

            // For health and license alerts, use "health" or "license" as the package name instead of the actual package name
            const packageName = alertType === 'health' 
                ? "health" 
                : alertType === 'license'
                ? "license"
                : (alert.package?.name || (packageId ? "Unknown Package" : "Project"));

            const alertItem: AlertItem = {
                id: alert.id,
                source: packageId ? (depPackageIds.has(packageId) ? "dependency" : "watchlist") : "dependency",
                pkg: {
                    id: packageId || undefined,
                    name: packageName,
                },
                kind: alertType as AlertKind,
                severity: severity,
                message: message,
                detectedAt: alert.detected_at || alert.created_at,
                status: alert.status as "unread" | "read" | "resolved",
                activity: activity,
            };

            // Debug logging
            console.log('Processing alert:', {
                id: alert.id,
                alertType,
                packageId,
                isInDeps: packageId ? depPackageIds.has(packageId) : false,
                isInWatchlist: packageId ? wlPackageIds.has(packageId) : false,
            });

            if (!packageId) {
                // Project-level alert (health, license) - show in dependency alerts
                projectLevelAlerts.push(alertItem);
            } else if (depPackageIds.has(packageId)) {
                // Package alert for a dependency - ALWAYS show in dependency alerts
                depAlertsList.push(alertItem);
            } else if (wlPackageIds.has(packageId)) {
                // Only show anomalies and vulnerabilities in watchlist
                if (alertType === 'anomaly' || alertType === 'vulnerability') {
                    wlAlertsList.push(alertItem);
                }
            } else {
                // Alert has a package_id but it's not in dependencies or watchlist
                // This shouldn't happen, but log it for debugging
                console.warn('Alert package not found in dependencies or watchlist:', {
                    alertId: alert.id,
                    packageId,
                    alertType,
                });
            }
        }

        // Filter alerts based on notification settings
        const filteredDepAlerts = depAlertsList.filter(alert => {
            if (!notificationSettings) return true; // Show all if no settings
            const settings = notificationSettings[alert.kind];
            return settings?.alerts !== false; // Show if alerts enabled or not set
        });

        const filteredProjectLevelAlerts = projectLevelAlerts.filter(alert => {
            if (!notificationSettings) return true;
            const settings = notificationSettings[alert.kind];
            return settings?.alerts !== false;
        });

        const filteredWlAlerts = wlAlertsList.filter(alert => {
            if (!notificationSettings) return true;
            const settings = notificationSettings[alert.kind];
            return settings?.alerts !== false;
        });

        const result = {
            depAlerts: [...filteredDepAlerts, ...filteredProjectLevelAlerts],
            wlAlerts: filteredWlAlerts,
        };

        console.log('Final alert conversion result:', {
            depAlertsCount: result.depAlerts.length,
            wlAlertsCount: result.wlAlerts.length,
            depAlertsFromPackages: depAlertsList.length,
            projectLevelAlerts: projectLevelAlerts.length,
            filtered: {
                depAlerts: filteredDepAlerts.length,
                projectLevel: filteredProjectLevelAlerts.length,
                wlAlerts: filteredWlAlerts.length,
            },
        });

        return result;
    }, [projectAlerts, dependencies, watchlist, notificationSettings]);

    const { depAlerts, wlAlerts } = convertProjectAlerts;

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

    // Use real alerts from backend only (no mock fallback)
    const depAlertsFinal = depAlerts;
    const wlAlertsFinal = wlAlerts;

    const depFiltered = useMemo(() => {
        const byType = globalType === "all" ? depAlertsFinal : depAlertsFinal.filter(a => a.kind === globalType);
        const bySource = globalSource === "all" || globalSource === "dependency" ? byType : [];
        const byStatus = showResolvedAlerts ? bySource : bySource.filter(a => a.status !== "resolved");
        return byStatus;
    }, [depAlertsFinal, globalType, globalSource, showResolvedAlerts]);

    const wlFiltered = useMemo(() => {
        const byType = globalType === "all" ? wlAlertsFinal : wlAlertsFinal.filter(a => a.kind === globalType);
        const bySource = globalSource === "all" || globalSource === "watchlist" ? byType : [];
        const byStatus = showResolvedAlerts ? bySource : bySource.filter(a => a.status !== "resolved");
        return byStatus;
    }, [wlAlertsFinal, globalType, globalSource, showResolvedAlerts]);

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
                    <option value="anomaly">Anomalies</option>
                </select>

                <select
                    value={showResolvedAlerts ? "all" : "active"}
                    onChange={(e) => setShowResolvedAlerts(e.target.value === "all")}
                    className="rounded-md px-2 py-2 text-sm"
                    style={{
                        backgroundColor: colors.background.card,
                        borderColor: colors.border.default,
                        color: colors.text.primary,
                    }}
                >
                    <option value="active">Active alerts</option>
                    <option value="all">All alerts</option>
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
                    onResolve={async (alertId: string) => {
                        try {
                            const response = await fetch(
                                `${apiBase}/projects/${projectId}/alerts/${alertId}`,
                                {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'resolved' }),
                                }
                            );
                            if (!response.ok) {
                                throw new Error('Failed to resolve alert');
                            }
                            // Refresh alerts
                            const alertsResponse = await fetch(`${apiBase}/projects/${projectId}/alerts`);
                            if (alertsResponse.ok) {
                                const data = await alertsResponse.json();
                                // Combine projectAlerts and packageAlerts
                                const allAlerts = [
                                    ...(data.projectAlerts || []),
                                    ...(data.packageAlerts || []),
                                ];
                                setProjectAlerts(allAlerts);
                            }
                        } catch (err) {
                            console.error('Error resolving alert:', err);
                        }
                    }}
                    onSendToJira={jiraConnected ? async (alertId: string) => {
                        try {
                            const response = await fetch(
                                `${apiBase}/jira/projects/${projectId}/alerts/${alertId}/create-issue`,
                                {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                }
                            );
                            
                            if (!response.ok) {
                                const error = await response.json();
                                throw new Error(error.message || 'Failed to create Jira issue');
                            }
                            
                            const result = await response.json();
                            window.alert(`Jira issue created successfully! Issue key: ${result.key || 'N/A'}`);
                        } catch (err) {
                            console.error('Error sending to Jira:', err);
                            window.alert(err instanceof Error ? err.message : 'Failed to create Jira issue');
                        }
                    } : undefined}
                    showResolved={showResolvedAlerts}
                    pageSize={4}
                    style={{height: "calc(100vh - 200px)"}}
                    hideTypeFilter={true}
                    isLoading={loadingAlerts}
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
                    onResolve={async (alertId: string) => {
                        try {
                            const response = await fetch(
                                `${apiBase}/projects/${projectId}/alerts/${alertId}`,
                                {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'resolved' }),
                                }
                            );
                            if (!response.ok) {
                                throw new Error('Failed to resolve alert');
                            }
                            // Refresh alerts
                            const alertsResponse = await fetch(`${apiBase}/projects/${projectId}/alerts`);
                            if (alertsResponse.ok) {
                                const data = await alertsResponse.json();
                                // Combine projectAlerts and packageAlerts
                                const allAlerts = [
                                    ...(data.projectAlerts || []),
                                    ...(data.packageAlerts || []),
                                ];
                                setProjectAlerts(allAlerts);
                            }
                        } catch (err) {
                            console.error('Error resolving alert:', err);
                        }
                    }}
                    onSendToJira={jiraConnected ? async (alertId: string) => {
                        try {
                            const response = await fetch(
                                `${apiBase}/jira/projects/${projectId}/alerts/${alertId}/create-issue`,
                                {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                }
                            );
                            
                            if (!response.ok) {
                                const error = await response.json();
                                throw new Error(error.message || 'Failed to create Jira issue');
                            }
                            
                            const result = await response.json();
                            window.alert(`Jira issue created successfully! Issue key: ${result.key || 'N/A'}`);
                        } catch (err) {
                            console.error('Error sending to Jira:', err);
                            window.alert(err instanceof Error ? err.message : 'Failed to create Jira issue');
                        }
                    } : undefined}
                    showResolved={showResolvedAlerts}
                    pageSize={4}
                    style={{height: "calc(100vh - 200px)"}}
                    hideTypeFilter={true}
                    isLoading={loadingAlerts}
                />
            </div>
        </div>
    );
}
