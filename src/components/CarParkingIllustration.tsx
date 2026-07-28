"use client";

import { useEffect, useRef } from "react";

export function CarParkingIllustration() {
  const carRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const car = carRef.current;
    if (!car) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    // Tied directly to how far the page has scrolled (not the element's own
    // position), so it animates as soon as the user scrolls down -- an
    // element already visible at page-load never gets a "scrolled into
    // view" moment, so that approach doesn't work for above-the-fold content.
    const maxScroll = 480;

    let ticking = false;

    function update() {
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const offsetPx = (1 - progress) * -140;
      car!.style.transform = `translateX(${offsetPx}px)`;
      car!.style.opacity = String(0.25 + progress * 0.75);
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative mx-auto flex h-72 w-56 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm sm:h-80 sm:w-64 dark:bg-neutral-800/60">
      <div className="absolute inset-6 rounded-xl border-2 border-dashed border-blue-400/70 dark:border-blue-500/50" />
      <div className="absolute bottom-8 h-6 w-32 rounded-full bg-black/10 blur-md dark:bg-black/30" />
      <div ref={carRef} className="relative will-change-transform">
        <CarTopDown className="h-56 w-auto sm:h-64" />
      </div>
    </div>
  );
}

function CarTopDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 150" className={className} fill="none" aria-hidden="true">
      <rect x="10" y="5" width="60" height="140" rx="22" fill="#2563eb" />

      {/* wheels */}
      <rect x="0" y="30" width="8" height="26" rx="4" fill="#1f2937" />
      <rect x="72" y="30" width="8" height="26" rx="4" fill="#1f2937" />
      <rect x="0" y="100" width="8" height="26" rx="4" fill="#1f2937" />
      <rect x="72" y="100" width="8" height="26" rx="4" fill="#1f2937" />

      {/* windshields */}
      <rect x="17" y="25" width="46" height="30" rx="8" fill="white" fillOpacity="0.9" />
      <rect x="17" y="95" width="46" height="30" rx="8" fill="white" fillOpacity="0.9" />

      {/* roof seam */}
      <rect x="38" y="58" width="4" height="30" rx="2" fill="#1d4ed8" />

      {/* mirrors */}
      <rect x="1" y="88" width="8" height="14" rx="3" fill="#1d4ed8" />
      <rect x="71" y="88" width="8" height="14" rx="3" fill="#1d4ed8" />

      {/* lights */}
      <circle cx="22" cy="140" r="4" fill="#fcd34d" />
      <circle cx="58" cy="140" r="4" fill="#fcd34d" />
      <circle cx="22" cy="10" r="3" fill="#ef4444" />
      <circle cx="58" cy="10" r="3" fill="#ef4444" />
    </svg>
  );
}
