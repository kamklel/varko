"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const SCENES = [
  "Circling the block, looking for parking?",
  "Find open spots near you, in seconds.",
  "Book by the hour — instantly confirmed.",
  "Park anywhere. Host anywhere.",
];

const SCENE_COUNT = SCENES.length;

export function ScrollHeroSequence() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const captionRefs = useRef<Array<HTMLParagraphElement | null>>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const scene = sceneRef.current;
    const car = carRef.current;
    const spot = spotRef.current;
    if (!section || !scene || !car || !spot) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let startX = 0;
    let endX = 0;
    let lastProgress = 0;

    function measure() {
      const sceneRect = scene!.getBoundingClientRect();
      const spotRect = spot!.getBoundingClientRect();
      const carWidth = car!.offsetWidth;

      // Car's base position (before any translateX) is the scene's left edge,
      // so both offsets below are in that same coordinate space.
      startX = -(carWidth + 60);
      endX = spotRect.left - sceneRect.left + spotRect.width / 2 - carWidth / 2;
    }

    function applyProgress(progress: number) {
      lastProgress = progress;
      const scale = 1 - progress * 0.18;
      const x = startX + (endX - startX) * progress;
      car!.style.transform = `translateX(${x}px) translateY(-50%) scale(${scale})`;

      const spotProgress = Math.min(1, Math.max(0, (progress - 0.72) / 0.28));
      spot!.style.opacity = String(spotProgress);

      const cta = ctaRef.current;
      if (cta) {
        const ctaProgress = Math.min(1, Math.max(0, (progress - 0.85) / 0.15));
        cta.style.opacity = String(ctaProgress);
        cta.style.transform = `translateY(${(1 - ctaProgress) * 10}px)`;
      }

      const segment = Math.min(SCENE_COUNT - 1, Math.floor(progress * SCENE_COUNT));
      captionRefs.current.forEach((el, i) => {
        if (!el) return;
        const active = i === segment;
        el.style.opacity = active ? "1" : "0";
        el.style.transform = active ? "translateY(0px)" : "translateY(12px)";
      });
    }

    if (reduceMotion) {
      measure();
      applyProgress(1);
      return;
    }

    let ticking = false;
    function update() {
      const rect = section!.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      applyProgress(progress);
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }
    function onResize() {
      measure();
      update();
    }

    measure();
    update();
    // Re-measure a frame later too, in case fonts/layout were still settling.
    const raf = requestAnimationFrame(() => {
      measure();
      applyProgress(lastProgress);
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div ref={sectionRef} className="relative" style={{ height: "400vh" }}>
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
        <div ref={sceneRef} className="relative h-40 w-full max-w-4xl sm:h-56">
          <div className="absolute inset-x-6 top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-200 dark:bg-neutral-800" />

          <div
            ref={spotRef}
            className="absolute right-[10%] top-1/2 h-16 w-11 -translate-y-1/2 rounded-md border-2 border-dashed border-blue-500 opacity-0 sm:h-24 sm:w-16"
          />

          <div ref={carRef} className="absolute left-0 top-1/2 will-change-transform">
            <CarIcon />
          </div>
        </div>

        <div className="relative mt-10 h-24 w-full max-w-2xl px-4 sm:mt-14 sm:h-20">
          {SCENES.map((text, i) => (
            <p
              key={text}
              ref={(el) => {
                captionRefs.current[i] = el;
              }}
              className="absolute inset-x-0 top-0 px-4 text-center text-2xl font-bold tracking-tight text-neutral-900 opacity-0 transition-[opacity,transform] duration-300 ease-out sm:text-5xl dark:text-neutral-100"
            >
              {text}
            </p>
          ))}
        </div>

        <div
          ref={ctaRef}
          className="relative mt-8 flex flex-col items-center justify-center gap-3 opacity-0 sm:mt-10 sm:flex-row"
        >
          <Link
            href="/search"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            Find parking
          </Link>
          <Link
            href="/host/listings/new"
            className="rounded-lg border border-blue-600 bg-white px-6 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:bg-transparent dark:hover:bg-blue-950"
          >
            List your space
          </Link>
        </div>
      </div>
    </div>
  );
}

function CarIcon() {
  return (
    <svg
      width="120"
      height="56"
      viewBox="0 0 120 56"
      fill="none"
      className="text-blue-600 drop-shadow-md sm:w-[150px] sm:h-[70px] dark:text-blue-500"
    >
      <path
        d="M8 38C8 33 12 30 18 29L28 20C30.5 17.7 33.7 16.5 37 16.5H72C76 16.5 79.7 18.5 82 21.8L90 33C90 33 100 33.5 106 36C110 37.5 112 40 112 43C112 45 110.5 46 108 46H12C9.5 46 8 44.5 8 42V38Z"
        fill="currentColor"
      />
      <path
        d="M38 21.5H70C72.5 21.5 74.8 22.8 76 25L80 31H35L40 24C41.3 22.5 39 21.5 38 21.5Z"
        fill="white"
        fillOpacity="0.85"
      />
      <circle cx="32" cy="46" r="9" fill="#1f2937" className="dark:fill-neutral-950" />
      <circle cx="32" cy="46" r="4" fill="#9ca3af" />
      <circle cx="92" cy="46" r="9" fill="#1f2937" className="dark:fill-neutral-950" />
      <circle cx="92" cy="46" r="4" fill="#9ca3af" />
    </svg>
  );
}
