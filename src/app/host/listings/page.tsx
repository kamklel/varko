import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/pricing";
import { setListingStatusAction } from "./actions";

export default async function HostListingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const listings = await prisma.listing.findMany({
    where: { hostId: session.user.id },
    include: { photos: { orderBy: { order: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Your listings
          </h1>
          <div className="flex gap-3">
            <Link
              href="/host/bookings"
              className="text-sm text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
            >
              View bookings received
            </Link>
            <Link
              href="/host/earnings"
              className="text-sm text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
            >
              View earnings
            </Link>
          </div>
        </div>
        <Link
          href="/host/listings/new"
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
        >
          + List a new space
        </Link>
      </div>

      {listings.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500 dark:text-neutral-400">
          You haven&apos;t listed a space yet.{" "}
          <Link href="/host/listings/new" className="text-blue-600 underline dark:text-blue-400">
            Create your first listing
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {listings.map((listing) => (
            <li key={listing.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900">
                  {listing.photos[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listing.photos[0].url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">
                    {listing.title}
                  </p>
                  <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                    {listing.address}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {formatCents(listing.pricePerHourCents)}/hr/spot · {listing.capacity} spot
                    {listing.capacity === 1 ? "" : "s"} ·{" "}
                    <span
                      className={
                        listing.status === "ACTIVE"
                          ? "text-green-700 dark:text-green-400"
                          : "text-neutral-400 dark:text-neutral-600"
                      }
                    >
                      {listing.status === "ACTIVE" ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-between gap-2 text-sm sm:flex-col sm:items-end">
                <div className="flex gap-3">
                  <Link
                    href={`/listings/${listing.id}`}
                    className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                  >
                    View
                  </Link>
                  <Link
                    href={`/host/listings/${listing.id}/edit`}
                    className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                  >
                    Edit
                  </Link>
                </div>
                <form
                  action={setListingStatusAction.bind(
                    null,
                    listing.id,
                    listing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                  )}
                >
                  <button
                    type="submit"
                    className="text-neutral-500 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                  >
                    {listing.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
