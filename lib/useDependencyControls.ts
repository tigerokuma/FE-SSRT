// lib/useDependencyControls.ts
"use client";

import {useMemo, useState} from "react";
import type {DependencySortKey, SortDir, DependencyControls} from "@/lib/deps-utils";

type Init = Partial<{
    search: string;
    activeFilters: string[];
    sortKey: DependencySortKey | null;
    sortDir: SortDir | null;
}>;

export function useDependencyControls(init: Init = {}) {
    const [search, setSearch] = useState(init.search ?? "");
    const [activeFilters, setActiveFilters] = useState<string[]>(init.activeFilters ?? []);
    const [sortKey, setSortKey] = useState<DependencySortKey | null>(
        init.sortKey === undefined ? "score" : init.sortKey
    );
    const [sortDir, setSortDir] = useState<SortDir | null>(
        init.sortDir === undefined ? "desc" : init.sortDir
    );

    // helpers
    const toggleFilter = (id: string) =>
        setActiveFilters(prev => (prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]));

    const clearFilters = () => setActiveFilters([]);

    const setSort = (key: DependencySortKey) => {
        // if selecting same key, flip direction; otherwise default to desc
        setSortKey(prevKey => {
            if (prevKey === key) {
                setSortDir(prevDir => (prevDir === "asc" ? "desc" : "asc"));
                return prevKey;
            }
            setSortDir("desc");
            return key;
        });
    };

    const clearSort = () => {
        setSortKey(null);
        setSortDir(null);
    };

    const resetAll = () => {
        setSearch("");
        setActiveFilters([]);
        setSortKey("score");
        setSortDir("desc");
    };

    // object that deps-utils expects
    const controls: DependencyControls = useMemo(
        () => ({search, activeFilters, sortKey, sortDir}),
        [search, activeFilters, sortKey, sortDir]
    );

    return {
        // state
        search,
        activeFilters,
        sortKey,
        sortDir,

        // setters
        setSearch,
        setActiveFilters,
        setSortKey,
        setSortDir,

        // helpers
        toggleFilter,
        clearFilters,
        setSort,
        clearSort,
        resetAll,

        // packed controls for filterAndSortDependencies(...)
        controls,
    };
}
