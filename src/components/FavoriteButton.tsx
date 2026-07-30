"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavoriteAction } from "@/app/favorites/actions";

export function FavoriteButton({
  listingId,
  initialFavorited,
  isLoggedIn,
}: {
  listingId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!isLoggedIn) {
          router.push("/login");
          return;
        }
        const optimistic = !favorited;
        setFavorited(optimistic);
        startTransition(async () => {
          try {
            const result = await toggleFavoriteAction(listingId);
            setFavorited(result.favorited);
          } catch {
            setFavorited(!optimistic);
          }
        });
      }}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from saved listings" : "Save this listing"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill={favorited ? "#ef4444" : "none"}
        stroke={favorited ? "#ef4444" : "currentColor"}
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21s-7.5-4.6-10-9.1C.6 8.4 2 4.5 5.6 4c2-.3 3.9.7 4.9 2.4C11.5 4.7 13.4 3.7 15.4 4c3.6.5 5 4.4 3.6 7.9C19.5 16.4 12 21 12 21z"
        />
      </svg>
    </button>
  );
}
