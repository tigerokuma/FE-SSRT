// /components/sbom/MetadataCard.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface LicenseRequirement {
  name: string;
  requirements: string[];
}

interface LicenseSummaryEntry {
  name: string;
  value: number;
}

interface Metadata {
  sbomPackage?: string;
  directDependencies: number;
  transitiveDependencies: number;
  licenseSummary: Record<string, number>;
  riskSummary?: Record<string, number>;
}

interface MetadataCardProps {
  metadata: Metadata;
}

const licenses: LicenseRequirement[] = [
  {
    name: "Apache-2.0",
    requirements: [
      "Include license and NOTICE file",
      "Grant of patent rights",
      "State changes made to code",
    ],
  },
  {
    name: "BSD-3-Clause",
    requirements: [
      "Include license text",
      "Provide attribution",
      "Do not use names of contributors for endorsement",
    ],
  },
  {
    name: "GPL-3.0",
    requirements: [
      "Disclose source code",
      "Use same license (copyleft)",
      "Provide installation instructions",
    ],
  },
  {
    name: "ISC",
    requirements: ["Include original license text", "Provide attribution"],
  },
  {
    name: "MIT",
    requirements: ["Include original license", "Provide attribution"],
  },
];

function prepareLicenseData(licenseSummary: Record<string, number>) {
  const threshold = 0; // adjust if you want to filter low count licenses

  const rawData = Object.entries(licenseSummary || {}).map(([license, count]) => ({
    name: license,
    value: count,
  }));

  return rawData.filter((item) => item.value >= threshold);
}

export default function MetadataCard({ metadata }: MetadataCardProps) {
  const licenseData = prepareLicenseData(metadata.licenseSummary);

  const [selectedLicense, setSelectedLicense] = useState<LicenseRequirement | null>(null);

  return (
    <Card className="h-60 w-400">
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 h-full">
        {/* Total Components */}
        <Card className="h-full flex flex-col items-center justify-center bg-white rounded shadow p-4">
          <h3 className="text-lg font-bold mb-2">Total Components</h3>
          <p className="text-2xl font-bold">
            {metadata.directDependencies + metadata.transitiveDependencies}
          </p>
          <div className="flex flex-row items-center">
            <div className="flex flex-col items-center p-3">
              <h3 className="text-md font-bold mb-2">Direct Components</h3>
              <p className="text-1xl font-bold">{metadata.directDependencies}</p>
            </div>
            <div className="flex flex-col items-center p-3">
              <h3 className="text-md font-bold mb-2">Indirect Components</h3>
              <p className="text-1xl font-bold">{metadata.transitiveDependencies}</p>
            </div>
          </div>
        </Card>

        {/* License Summary */}
        <Card className="h-full overflow-y-auto rounded shadow p-4 overflow-y-auto">
          <h3 className="text-lg font-bold mb-2">License Summary</h3>
          <ul className="space-y-2 overflow-auto">
            {licenseData.map((entry, index) => (
              <li key={index} className="flex items-center justify-between border-b pb-1">
                <span className="font-medium">{entry.name}</span>
                <span className="text-sm text-gray-600">{entry.value} components</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* License Explorer */}
        <Card className="h-full overflow-y-auto rounded shadow p-4 overflow-y-auto">
          <h3 className="text-lg font-bold mb-4">License Explorer</h3>

          {!selectedLicense ? (
            // Explorer View
            <div className="space-y-2">
              {licenses.map((license, index) => (
                <div
                  key={index}
                  className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedLicense(license)}
                >
                  <span className="font-medium">{license.name}</span>
                </div>
              ))}
            </div>
          ) : (
            // Detail View
            <div>
              <button
                className="text-sm text-blue-500 hover:underline mb-3"
                onClick={() => setSelectedLicense(null)}
              >
                ← Back to licenses
              </button>

              <h4 className="text-md font-semibold mb-2">{selectedLicense.name}</h4>
              <ul className="list-disc ml-5 text-sm text-gray-700">
                {selectedLicense.requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </CardContent>
    </Card>
  );
}
