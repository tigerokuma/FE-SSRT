// lib/useWatchlistControls.ts
import { useState } from "react";
import type { WatchlistSortKey, SortDir } from "./watchlist-utils";

export function useWatchlistControls() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<("approved"|"pending"|"rejected")[]>([]);
  const [licenseFilter, setLicenseFilter] = useState<"all"|"compatible"|"incompatible"|"unknown">("all");
  const [processing, setProcessing] = useState<"all"|"queued_or_running"|"done">("all");
  const [riskMin, setRiskMin] = useState(0);
  const [riskMax, setRiskMax] = useState(100);

  // ⬇️ start in "no sort" state (keeps backend order)
  const [sortBy, setSortBy] = useState<WatchlistSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir | null>(null);

  return {
    state: { search, status, licenseFilter, processing, riskMin, riskMax, sortBy, sortDir },
    setSearch, setStatus, setLicenseFilter, setProcessing, setRiskMin, setRiskMax, setSortBy, setSortDir
  };
}
