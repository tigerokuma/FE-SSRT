// /components/sbom/VulnerablePackagesList.tsx
"use client";

import React from "react";

interface VulnerablePackagesListProps {
  vulnerablePackages: string[];
  onRemovePackage: (pkg: string) => void;
}

export default function VulnerablePackagesList({
  vulnerablePackages,
  onRemovePackage,
}: VulnerablePackagesListProps) {
  if (vulnerablePackages.length === 0) {
    return <p className="text-gray-500 italic pt-4">No vulnerable packages selected.</p>;
  }

  return (
    <div className="w-full h-[680px] overflow-y-auto flex flex-col gap-2 mt-2">
      {vulnerablePackages.map((pkg, index) => (
        <div
          key={index}
          className="flex items-center bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm"
        >
          <span className="mr-2 truncate max-w-[calc(100%-1.5rem)]">{pkg}</span>
          <button
            className="text-red-500 hover:text-red-700"
            onClick={() => onRemovePackage(pkg)}
            aria-label={`Remove vulnerable package ${pkg}`}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
