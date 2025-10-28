// lib/deps-utils.ts
export type DependencySortKey = "name" | "version" | "contributors" | "stars" | "score";
export type SortDir = "asc" | "desc";

export type DependencyControls = {
  search: string;
  activeFilters: string[]; // keep your existing FilterId typing if exported
  sortKey: DependencySortKey | null;
  sortDir: SortDir | null;
};

export type Project = { license?: string | null } // minimal for license checks
export type ProjectDependency = {
  id: string;
  name: string;
  version: string;
  risk: number;
  updated_at?: string;

  // IMPORTANT: include id/name/status/summary so DependencyPackageCard props match
  package?: {
    id: string;                // required by the card
    name: string;              // required by the card
    license?: string;
    status?: string;           // queued | fast | done (you read this in isLoading)
    stars?: number;
    contributors?: number;
    summary?: string;

    // scores (as before)
    total_score?: number;
    activity_score?: number;
    bus_factor_score?: number;
    vulnerability_score?: number;
    license_score?: number;
    scorecard_score?: number;
  };
};

// keep your filter defs externally and pass them in to stay decoupled
export type FilterDef = {
  id: string;
  predicate: (dep: ProjectDependency, project: Project | null) => boolean;
};

const getSortVal = (dep: ProjectDependency, key: DependencySortKey) => {
  switch (key) {
    case "name": return dep.name?.toLowerCase() ?? "";
    case "version": return dep.version ?? "";
    case "contributors": return dep.package?.contributors ?? 0;
    case "stars": return dep.package?.stars ?? 0;
    case "score": return dep.package?.total_score ?? dep.risk ?? 0;
  }
};

export function filterAndSortDependencies(
  items: ProjectDependency[],
  controls: DependencyControls,
  project: Project | null,
  filterDefs: FilterDef[]
) {
  const { search, activeFilters, sortKey, sortDir } = controls;

  const byId = new Map(filterDefs.map(f => [f.id, f]));

  const filtered = items.filter(dep => {
    const matchesSearch = !search || dep.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilters =
      !activeFilters.length ||
      activeFilters.every(fid => byId.get(fid)?.predicate(dep, project));
    return matchesSearch && matchesFilters;
  });

  if (!sortKey || !sortDir) return filtered;

  const dir = sortDir === "asc" ? 1 : -1;
  return [...filtered].sort((a, b) => {
    const av = getSortVal(a, sortKey);
    const bv = getSortVal(b, sortKey);
    return dir * (av < bv ? -1 : av > bv ? 1 : 0);
  });
}
