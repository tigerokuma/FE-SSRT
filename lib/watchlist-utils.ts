// lib/watchlist-utils.ts
import { checkLicenseCompatibility } from "@/lib/license-utils";

export type WatchlistSortKey =
  | "name"
  | "added_at"
  | "risk"
  | "vuln"
  | "score"
  | "stars"
  | "contributors"
  | "status";

export type SortDir = "asc" | "desc";

export type WatchlistControls = {
  search: string;
  status: ("approved" | "pending" | "rejected")[];
  licenseFilter: "all" | "compatible" | "incompatible" | "unknown";
  processing: "all" | "queued_or_running" | "done";
  riskMin: number;
  riskMax: number;
  // ⬇️ make nullable for 3-state behavior
  sortBy: WatchlistSortKey | null;
  sortDir: SortDir | null;
};


// Keep identical to your card props shape
export type WatchlistPackage = {
  id: string;
  name?: string;
  added_at?: string;
  package?: {
    id: string;
    name: string;
    total_score?: number;
    vulnerability_score?: number;
    activity_score?: number;
    bus_factor_score?: number;
    license_score?: number;
    scorecard_score?: number;
    license?: string;
    repo_url?: string;
    status?: string; // queued | fast | done
    stars?: number;
    contributors?: number;
  };
  status?: "approved" | "rejected" | "pending";
  license?: string;
  addedBy?: string;
  // ... other optional fields omitted for brevity
};

// ---------- Normalizers ----------
const pkgData = (w: WatchlistPackage) => w.package ?? ({} as NonNullable<WatchlistPackage["package"]>);
export const getName = (w: WatchlistPackage) => pkgData(w).name || w.name || "Unknown Package";
export const getRisk = (w: WatchlistPackage) => pkgData(w).total_score ?? 0;
export const getVuln = (w: WatchlistPackage) => pkgData(w).vulnerability_score ?? 0;
export const getStars = (w: WatchlistPackage) => pkgData(w).stars ?? 0;
export const getContributors = (w: WatchlistPackage) => pkgData(w).contributors ?? 0;
export const getAddedAt = (w: WatchlistPackage) => new Date(w.added_at ?? Date.now()).getTime();
export const getManualStatus = (w: WatchlistPackage) => w.status ?? "pending";
export const isQueuedOrRunning = (w: WatchlistPackage) => {
  const s = pkgData(w).status;
  return s && s !== "done";
};
export const getPackageLicense = (w: WatchlistPackage) => pkgData(w).license ?? w.license;

// ---------- Filters ----------
function passesStatus(w: WatchlistPackage, selected: WatchlistControls["status"]) {
  if (!selected.length) return true;
  return selected.includes(getManualStatus(w));
}

function passesLicense(
  w: WatchlistPackage,
  projectLicense: string | null | undefined,
  mode: WatchlistControls["licenseFilter"]
) {
  if (mode === "all") return true;
  const proj = projectLicense && !["none", "unlicensed"].includes(projectLicense) ? projectLicense : undefined;
  const pack = getPackageLicense(w);
  if (!proj || !pack) return mode === "unknown";
  const res = checkLicenseCompatibility(proj, pack);
  return mode === "compatible" ? !!res?.isCompatible : !res?.isCompatible;
}

function passesProcessing(w: WatchlistPackage, mode: WatchlistControls["processing"]) {
  if (mode === "all") return true;
  const queued = isQueuedOrRunning(w);
  return mode === "queued_or_running" ? queued : !queued;
}

function passesRiskRange(w: WatchlistPackage, min: number, max: number) {
  const r = getRisk(w);
  return r >= min && r <= max;
}

function passesSearch(w: WatchlistPackage, q: string) {
  if (!q) return true;
  return getName(w).toLowerCase().includes(q.toLowerCase());
}

// ---------- Sorting ----------
export function watchlistComparator(
  key: WatchlistSortKey,
  dir: SortDir
): (a: WatchlistPackage, b: WatchlistPackage) => number {
  const d = dir === "asc" ? 1 : -1;
  return (a, b) => {
    const map: Record<WatchlistSortKey, number> = {
      name: getName(a).localeCompare(getName(b)),
      added_at: getAddedAt(a) - getAddedAt(b),
      risk: getRisk(a) - getRisk(b),
      vuln: getVuln(a) - getVuln(b),
      score:
        (pkgData(a).scorecard_score ?? 0) -
        (pkgData(b).scorecard_score ?? 0),
      stars: getStars(a) - getStars(b),
      contributors: getContributors(a) - getContributors(b),
      status: getManualStatus(a).localeCompare(getManualStatus(b)),
    };
    return map[key] * d;
  };
}

// ---------- Main pipeline ----------
export function filterAndSortWatchlist(
  items: WatchlistPackage[],
  controls: WatchlistControls,
  projectLicense?: string | null
) {
  const {
    search, status, licenseFilter, processing,
    riskMin, riskMax, sortBy, sortDir
  } = controls;

  const filtered = items
    .filter((w) => passesSearch(w, search))
    .filter((w) => passesStatus(w, status))
    .filter((w) => passesLicense(w, projectLicense, licenseFilter))
    .filter((w) => passesProcessing(w, processing))
    .filter((w) => passesRiskRange(w, riskMin, riskMax));

  // ⬇️ only sort when user picked a column+direction
  if (!sortBy || !sortDir) return filtered;

  return [...filtered].sort(watchlistComparator(sortBy, sortDir));
}
