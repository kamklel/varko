"use client";

import { useState } from "react";

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
      {items.map((item, i) => {
        const isOpen = openIndexes.has(i);
        return (
          <div key={item.q}>
            <h3>
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${i}`}
                className="flex w-full items-center justify-between gap-4 py-4 text-left font-medium text-neutral-900 dark:text-neutral-100"
              >
                {item.q}
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg text-blue-600 transition-transform dark:bg-blue-950 dark:text-blue-400 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
            </h3>
            {isOpen && (
              <div id={`faq-answer-${i}`} className="pb-4 pr-11 text-sm text-neutral-600 dark:text-neutral-400">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
