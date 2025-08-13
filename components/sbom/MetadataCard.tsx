// /components/sbom/MetadataCard.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LicenseDetails {
  id: string;
  count: number,
  link: string,
  category: string,
}

interface Metadata {
  sbomPackage?: string;
  directDependencies: number;
  transitiveDependencies: number;
  licenseSummary: Record<string, LicenseDetails>;
}

interface MetadataCardProps {
  metadata: Metadata;
}


export default function MetadataCard({ metadata }: MetadataCardProps) {
  return (
    <Card className="h-[414px] w-[1340px] pr-2">
      <CardHeader> <h3 className="text-2xl font-bold">Sbom Metadata</h3></CardHeader>
      <CardContent className="grid grid-cols-[40%_60%] gap-4 h-full">
        {/* Total Components */}
        <Card className="h-[300px] flex flex-col items-center justify-center rounded shadow">
          <h3 className="text-lg font-bold mb-2">Total Components</h3>
          <p className="text-2xl font-bold">
            {metadata.directDependencies + metadata.transitiveDependencies}
          </p>
          <div className="flex flex-row items-center gap-x-8">
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

        {/* License Count & Info */}
        <Card className="flex-1 h-[300px] rounded shadow p-4 px-5">
          <h3 className="text-lg font-bold mb-4">License Count & Info</h3>
          <ul className="space-y-3 overflow-auto max-h-[220px]">
            {Object.values(metadata.licenseSummary).map((entry, index) => (
              <li key={index} className="flex items-center justify-between border-b pb-2">
                {/* Left side: name + OSI badge */}
                <div className="flex items-center space-x-2 max-w-xs">
                  {/* License Name with Link */}
                  {entry.link ? (
                    <a
                      href={entry.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                      title="View license text"
                    >
                      {entry.id}
                    </a>
                  ) : (
                    <span className="font-medium">{entry.id}</span>
                  )}

                  {/* OSI Approved Badge */}
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full
                      ${entry.category ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                    title={entry.category == 'Permissive' ? 'OSI Approved' : 'Not OSI Approved'}
                  >
                    {entry.category == 'Permissive' ? 'OSI Approved' : ' OSI Unapproved'}
                  </span>
                </div>

                {/* Right side: Component count */}
                <span className="text-sm text-gray-600">{entry.count} components</span>
              </li>
            ))}
          </ul>
        </Card>
      </CardContent>
    </Card>
  );
}
