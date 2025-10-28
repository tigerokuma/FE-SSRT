"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { colors } from "@/lib/design-system";

export type AlertKind = "vulnerability" | "license" | "health";
export type AlertSource = "dependency" | "watchlist";

export interface AlertItem {
  id: string;
  source: AlertSource;
  pkg: { id?: string; name: string };
  kind: AlertKind;
  severity?: "critical" | "high" | "medium" | "low";
  message: string;
  detectedAt: string; // ISO
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
  pageSize = 6,
  style,
}: {
  title: string;
  items: AlertItem[];
  search: string;
  typeFilter: "all" | AlertKind;
  onSearchChange: (s: string) => void;
  onTypeChange: (t: "all" | AlertKind) => void;
  onAlertClick?: (a: AlertItem) => void;
  pageSize?: number;
  style?: React.CSSProperties;
}) {
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const byType =
      typeFilter === "all" ? items : items.filter((i) => i.kind === typeFilter);
    const bySearch = search.trim()
      ? byType.filter((i) =>
          i.pkg.name.toLowerCase().includes(search.trim().toLowerCase())
        )
      : byType;
    return bySearch;
  }, [items, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const pill = (k: AlertKind) => {
    const map: Record<AlertKind, string> = {
      vulnerability: "bg-red-500/20 text-red-300",
      license: "bg-yellow-500/20 text-yellow-300",
      health: "bg-blue-500/20 text-blue-300",
    };
    return `inline-flex items-center text-xs px-2 py-0.5 rounded ${map[k]}`;
  };

  return (
    <Card
      className="flex flex-col"
      style={{ backgroundColor: colors.background.card, ...style }}
    >
      <CardHeader className="flex flex-col gap-2">
        <CardTitle className="text-white">{title}</CardTitle>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search package..."
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
          </select>
        </div>
      </CardHeader>

      {/* No internal scrolling; just render the current page */}
      <CardContent className="space-y-3">
        {pageItems.length === 0 ? (
          <div className="text-sm text-gray-400">No alerts.</div>
        ) : (
          pageItems.map((a) => (
            <button
              key={a.id}
              onClick={() => onAlertClick?.(a)}
              className="w-full text-left p-3 rounded-lg border transition-colors hover:bg-white/5"
              style={{ borderColor: colors.border.default }}
            >
              <div className="flex items-center justify-between">
                <div className="text-white font-medium">{a.pkg.name}</div>
                <div className="flex items-center gap-2">
                  <span className={pill(a.kind)}>{a.kind}</span>
                  {a.severity && (
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
                </div>
              </div>

              <div className="text-sm text-gray-300 mt-1">{a.message}</div>

              {a.activity && (
                <div className="text-xs text-gray-400 mt-1">
                  {a.activity.metric && a.activity.value !== undefined
                    ? `${a.activity.metric}: ${a.activity.value}`
                    : null}
                  {a.activity.commitSha
                    ? ` • commit ${a.activity.commitSha.slice(0, 7)}`
                    : null}
                </div>
              )}

              <div className="text-xs text-gray-500 mt-1">
                Detected {new Date(a.detectedAt).toLocaleString()}
              </div>
            </button>
          ))
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2">
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
