import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatCents } from "@/lib/pricing";
import { MapView } from "@/components/MapView";
import { BookingWidget } from "@/components/BookingWidget";
import { FavoriteButton } from "@/components/FavoriteButton";
import { SITE_URL } from "@/lib/site";

const getListing = cache(async (id: string) => {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      host: { select: { name: true } },
      photos: { orderBy: { order: "asc" } },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { renter: { select: { name: true } } },
      },
    },
  });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return {};

  const location = [listing.city, listing.pincode].filter(Boolean).join(" ");
  const title = `${listing.title}${location ? ` — Parking in ${location}` : ""}`;
  const description = listing.description.slice(0, 155);
  const image = listing.photos[0]?.url;

  return {
    title,
    description,
    alternates: { canonical: `/listings/${id}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/listings/${id}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [listing, session] = await Promise.all([getListing(id), auth()]);

  if (!listing) {
    notFound();
  }

  const isFavorited = session?.user
    ? Boolean(
        await prisma.favorite.findUnique({
          where: { userId_listingId: { userId: session.user.id, listingId: id } },
        }),
      )
    : false;

  const reviewCount = listing.reviews.length;
  const avgRating =
    reviewCount > 0
      ? listing.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null;

  const listingJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description,
    image: listing.photos.map((p) => p.url),
    ...(avgRating !== null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating.toFixed(1),
            reviewCount,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (listing.pricePerHourCents / 100).toFixed(2),
      availability: listing.status === "ACTIVE" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/listings/${listing.id}`,
    },
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd) }}
      />

      {listing.status === "INACTIVE" && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          This listing is currently inactive and not bookable.
        </div>
      )}

      {listing.photos.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {listing.photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={photo.url}
              alt={listing.title}
              className="aspect-square w-full rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {listing.title}
            </h1>
            <FavoriteButton
              listingId={listing.id}
              initialFavorited={isFavorited}
              isLoggedIn={!!session?.user}
            />
          </div>
          {avgRating !== null && (
            <p className="mt-1 flex items-center gap-1 text-sm">
              <span className="text-amber-400">★</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-neutral-500 dark:text-neutral-400">
                ({reviewCount} review{reviewCount === 1 ? "" : "s"})
              </span>
            </p>
          )}
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">{listing.address}</p>
          {(listing.city || listing.pincode) && (
            <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              {listing.city}
              {listing.city && listing.pincode && " · "}
              {listing.pincode}
            </p>
          )}
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Hosted by {listing.host.name}
          </p>

          <div className="mt-6 flex gap-6 text-sm">
            <div>
              <p className="text-neutral-500 dark:text-neutral-400">Price</p>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {formatCents(listing.pricePerHourCents)}/hr per spot
              </p>
            </div>
            <div>
              <p className="text-neutral-500 dark:text-neutral-400">Capacity</p>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {listing.capacity} car{listing.capacity === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="font-medium text-neutral-900 dark:text-neutral-100">About this space</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-400">
              {listing.description}
            </p>
          </div>

          {listing.reviews.length > 0 && (
            <div className="mt-6">
              <h2 className="font-medium text-neutral-900 dark:text-neutral-100">
                Reviews ({listing.reviews.length})
              </h2>
              <ul className="mt-3 space-y-3">
                {listing.reviews.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {r.renter.name}
                      </span>
                      <span className="text-amber-400">
                        {"★".repeat(r.rating)}
                        <span className="text-neutral-300 dark:text-neutral-700">
                          {"★".repeat(5 - r.rating)}
                        </span>
                      </span>
                    </div>
                    {r.comment && (
                      <p className="mt-1 text-neutral-600 dark:text-neutral-400">{r.comment}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 h-56 overflow-hidden rounded-lg sm:h-64">
            <MapView
              center={[listing.lat, listing.lng]}
              zoom={15}
              pins={[
                {
                  id: listing.id,
                  lat: listing.lat,
                  lng: listing.lng,
                  label: listing.title,
                  price: `${formatCents(listing.pricePerHourCents)}/hr`,
                },
              ]}
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <BookingWidget
            listingId={listing.id}
            pricePerHourCents={listing.pricePerHourCents}
            capacity={listing.capacity}
            isLoggedIn={!!session?.user}
            isOwnListing={session?.user?.id === listing.hostId}
            listingActive={listing.status === "ACTIVE"}
          />
        </div>
      </div>
    </div>
  );
}
