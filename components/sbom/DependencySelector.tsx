// /components/sbom/DependencySelector.tsx
"use client";

import React from "react";

interface Repo {
  id: string;
  label: string;
}

interface DependencySelectorProps {
  userRepositories: Repo[];
  dependencyPackages: Repo[];
  selectedSbom: string;
  setSelectedSbom: (value: string) => void;
  onSelectSbom: (value: string) => void; // optional callback for side effects on select
}

export default function DependencySelector({
  userRepositories,
  dependencyPackages,
  selectedSbom,
  setSelectedSbom,
  onSelectSbom,
}: DependencySelectorProps) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setSelectedSbom(value);
    if (onSelectSbom) onSelectSbom(value);
  }

  return (
    <div className="flex items-center gap-2 mb-4">
      <label htmlFor="sbomSelect" className="font-medium">
        Select SBOM:
      </label>
      <select
        id="sbomSelect"
        value={selectedSbom}
        onChange={handleChange}
        className="border border-gray-300 rounded p-2 w-64"
      >
        <option value="" disabled>
          -- Select an SBOM --
        </option>

        <optgroup label="-- user --">
          {userRepositories.map((repo) => (
            <option key={repo.id} value={`user:${repo.id}`}>
              {repo.label}
            </option>
          ))}
        </optgroup>

        <optgroup label="-- dep --">
          {dependencyPackages.map((dep) => (
            <option key={dep.id} value={`dep:${dep.id}`}>
              {dep.label}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}
