import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatCents } from "@/lib/pricing";
import { MapView } from "@/components/MapView";
import { BookingWidget } from "@/components/BookingWidget";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [listing, session] = await Promise.all([
    prisma.listing.findUnique({
      where: { id },
      include: {
        host: { select: { name: true } },
        photos: { orderBy: { order: "asc" } },
      },
    }),
    auth(),
  ]);

  if (!listing) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
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
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {listing.title}
          </h1>
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
