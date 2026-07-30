import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/pricing";
import { FavoriteButton } from "@/components/FavoriteButton";

export const metadata: Metadata = {
  title: "Saved listings",
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: { listing: { include: { photos: { take: 1, orderBy: { order: "asc" } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        Saved listings
      </h1>

      {favorites.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500 dark:text-neutral-400">
          You haven&apos;t saved any listings yet.{" "}
          <Link href="/search" className="text-blue-600 underline dark:text-blue-400">
            Find parking
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {favorites.map((f) => (
            <li key={f.id} className="flex items-center gap-4 p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900">
                {f.listing.photos[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.listing.photos[0].url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/listings/${f.listing.id}`}
                  className="truncate font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                >
                  {f.listing.title}
                </Link>
                <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                  {f.listing.address}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {formatCents(f.listing.pricePerHourCents)}/hr
                </p>
              </div>
              <FavoriteButton listingId={f.listing.id} initialFavorited={true} isLoggedIn={true} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
