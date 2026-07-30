import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/pricing";
import { cancelBookingAction } from "./actions";
import { ReviewForm } from "@/components/ReviewForm";

export default async function MyBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ justBooked?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { justBooked } = await searchParams;

  const bookings = await prisma.booking.findMany({
    where: { renterId: session.user.id },
    include: {
      listing: { select: { id: true, title: true, address: true } },
      review: true,
    },
    orderBy: { startTime: "desc" },
  });

  // eslint-disable-next-line react-hooks/purity -- Server Component: re-evaluated fresh per request, not memoized like client render
  const now = Date.now();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        My bookings
      </h1>

      {justBooked && (
        <div className="mt-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Booking confirmed!
        </div>
      )}

      {bookings.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500 dark:text-neutral-400">
          You haven&apos;t booked any parking yet.{" "}
          <Link href="/search" className="text-blue-600 underline dark:text-blue-400">
            Find a spot
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {bookings.map((b) => {
            const isPast = b.startTime.getTime() <= now;
            const cancellable = b.bookingStatus === "CONFIRMED" && !isPast;
            return (
              <li
                key={b.id}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
              >
                <div>
                  <Link
                    href={`/listings/${b.listing.id}`}
                    className="font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                  >
                    {b.listing.title}
                  </Link>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {b.listing.address}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {b.startTime.toLocaleString()} &ndash; {b.endTime.toLocaleTimeString()} ·{" "}
                    {b.numSpots} spot{b.numSpots === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 text-sm">
                    <span
                      className={
                        b.bookingStatus === "CANCELLED"
                          ? "text-neutral-400 dark:text-neutral-600"
                          : isPast
                            ? "text-neutral-500 dark:text-neutral-400"
                            : "text-green-700 dark:text-green-400"
                      }
                    >
                      {b.bookingStatus === "CANCELLED"
                        ? "Cancelled"
                        : isPast
                          ? "Completed"
                          : "Upcoming"}
                    </span>
                  </p>

                  {b.bookingStatus === "CONFIRMED" && isPast && (
                    <>
                      {b.review ? (
                        <div className="mt-2 text-sm">
                          <span className="text-amber-400">
                            {"★".repeat(b.review.rating)}
                            <span className="text-neutral-300 dark:text-neutral-700">
                              {"★".repeat(5 - b.review.rating)}
                            </span>
                          </span>
                          {b.review.comment && (
                            <p className="mt-0.5 text-neutral-600 dark:text-neutral-400">
                              {b.review.comment}
                            </p>
                          )}
                        </div>
                      ) : (
                        <ReviewForm bookingId={b.id} />
                      )}
                    </>
                  )}
                </div>
                <div className="shrink-0 sm:text-right">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {formatCents(b.totalPriceCents)}
                  </p>
                  <div className="mt-2 flex flex-col gap-2 sm:items-end">
                    <Link
                      href={`/messages/${b.id}`}
                      className="text-sm text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
                    >
                      Message host
                    </Link>
                    {cancellable && (
                      <form action={cancelBookingAction.bind(null, b.id)}>
                        <button
                          type="submit"
                          className="text-sm text-red-600 underline hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
