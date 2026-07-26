"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` at import time, so it must be loaded client-side
// only (ssr: false) -- this wrapper is what Server Components import instead
// of Map.tsx directly.
export const MapView = dynamic(() => import("./Map").then((m) => m.Map), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-sm text-neutral-400">
      Loading map...
    </div>
  ),
});
