"use client";

import { useEffect, useRef } from "react";

export function ScrollCarTrack({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const car = carRef.current;
    if (!track || !car) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let ticking = false;

    function update() {
      if (!track || !car) return;
      const rect = track.getBoundingClientRect();
      const travel = rect.height - 48;
      const progress = Math.min(1, Math.max(0, -rect.top / (rect.height - window.innerHeight)));
      car.style.transform = `translateY(${progress * travel}px)`;
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
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={trackRef} className="relative flex flex-1 flex-col">
      {children}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-8 right-3 hidden w-10 sm:right-5 sm:block lg:right-10"
      >
        <div className="absolute inset-y-0 left-1/2 w-0 -translate-x-1/2 border-l-2 border-dashed border-neutral-300 dark:border-neutral-700" />

        {/* Parking spot marker at the end of the road */}
        <div className="absolute bottom-0 left-1/2 h-11 w-8 -translate-x-1/2 rounded-md border-2 border-dashed border-blue-400/60 dark:border-blue-500/50" />

        <div ref={carRef} className="absolute left-1/2 top-0 -translate-x-1/2 will-change-transform">
          <CarIcon />
        </div>
      </div>
    </div>
  );
}

function CarIcon() {
  return (
    <svg
      width="26"
      height="40"
      viewBox="0 0 26 40"
      fill="none"
      className="text-blue-600 drop-shadow-sm dark:text-blue-500"
    >
      <rect x="3" y="1" width="20" height="38" rx="8" fill="currentColor" />
      <rect x="6" y="6" width="14" height="7" rx="2" fill="white" fillOpacity="0.85" />
      <rect x="6" y="27" width="14" height="7" rx="2" fill="white" fillOpacity="0.85" />
      <circle cx="4" cy="10" r="2" fill="currentColor" />
      <circle cx="22" cy="10" r="2" fill="currentColor" />
      <circle cx="4" cy="30" r="2" fill="currentColor" />
      <circle cx="22" cy="30" r="2" fill="currentColor" />
    </svg>
  );
}
