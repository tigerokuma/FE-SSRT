import { useState } from "react";

interface DependencyExplorerOptionsProps {
  allLicenses: string[];
  includedLicenses: string[];
  setIncludedLicenses: (licenses: string[]) => void;
  excludedLicenses: string[];
  setExcludedLicenses: (licenses: string[]) => void;
}

export default function DependencyExplorerOptions({
  allLicenses,
  includedLicenses,
  setIncludedLicenses,
  excludedLicenses,
  setExcludedLicenses,
}: DependencyExplorerOptionsProps) {
  const [open, setOpen] = useState(false);
  const [includeSearch, setIncludeSearch] = useState("");
  const [excludeSearch, setExcludeSearch] = useState("");

  const filteredIncludes = allLicenses.filter((l) =>
    l.toLowerCase().includes(includeSearch.toLowerCase())
  );
  const filteredExcludes = allLicenses.filter((l) =>
    l.toLowerCase().includes(excludeSearch.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
      >
        Filter
      </button>

      {open && (
        <div className="absolute right-0 mt-2 p-4 bg-white dark:bg-gray-800 border rounded shadow-lg z-50 w-80">

          {/* Include Licenses */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Include Licenses
            </label>
            <input
              type="text"
              placeholder="Search licenses..."
              value={includeSearch}
              onChange={(e) => setIncludeSearch(e.target.value)}
              className="w-full border rounded p-1 mb-2 dark:bg-gray-700 dark:text-white"
            />
            <div className="max-h-32 overflow-y-auto border rounded p-1 dark:bg-gray-700 dark:text-white">
              {filteredIncludes.map((license) => (
                <div key={license} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    checked={includedLicenses.includes(license)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setIncludedLicenses([...includedLicenses, license]);
                      } else {
                        setIncludedLicenses(
                          includedLicenses.filter((l) => l !== license)
                        );
                      }
                    }}
                    className="mr-2"
                  />
                  <span>{license}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Exclude Licenses */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Exclude Licenses
            </label>
            <input
              type="text"
              placeholder="Search licenses..."
              value={excludeSearch}
              onChange={(e) => setExcludeSearch(e.target.value)}
              className="w-full border rounded p-1 mb-2 dark:bg-gray-700 dark:text-white"
            />
            <div className="max-h-32 overflow-y-auto border rounded p-1 dark:bg-gray-700 dark:text-white">
              {filteredExcludes.map((license) => (
                <div key={license} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    checked={excludedLicenses.includes(license)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setExcludedLicenses([...excludedLicenses, license]);
                      } else {
                        setExcludedLicenses(
                          excludedLicenses.filter((l) => l !== license)
                        );
                      }
                    }}
                    className="mr-2"
                  />
                  <span>{license}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
