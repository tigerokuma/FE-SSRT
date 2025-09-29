"use client";

import { useEffect, useState } from "react";

/**
 * Switches the *palette* by setting data-theme on <html>.
 * Available palettes:
 *  - "default" (your existing tokens)
 *  - "sentinel" (indigo/blue)
 *  - "aurora"   (teal/violet)
 * Make sure these exist in globals.css (you added them earlier).
 */
const PALETTES = ["default", "sentinel", "aurora"] as const;

export function PaletteSwitcher() {
  const [mounted, setMounted] = useState(false);
  const [palette, setPalette] = useState<(typeof PALETTES)[number]>("default");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const el = document.documentElement;
    if (palette === "default") el.removeAttribute("data-theme");
    else el.setAttribute("data-theme", palette);
  }, [palette]);

  if (!mounted) return null;

  return (
    <select
      aria-label="Color palette"
      className="h-9 px-3 rounded-md border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
      value={palette}
      onChange={(e) => setPalette(e.target.value as any)}
    >
      {PALETTES.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
}
