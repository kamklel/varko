import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/pricing";

export default async function HostBookingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { listing: { hostId: session.user.id } },
    include: { listing: { select: { title: true } }, renter: { select: { name: true, email: true } } },
    orderBy: { startTime: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        Bookings received
      </h1>

      {bookings.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500 dark:text-neutral-400">No bookings yet.</p>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {bookings.map((b) => (
            <li key={b.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {b.listing.title}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Booked by {b.renter.name} &middot;{" "}
                  <a
                    href={`mailto:${b.renter.email}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {b.renter.email}
                  </a>
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
                        : "text-green-700 dark:text-green-400"
                    }
                  >
                    {b.bookingStatus === "CANCELLED" ? "Cancelled" : "Confirmed"}
                  </span>
                </p>
              </div>
              <div className="shrink-0 text-sm sm:text-right">
                <p className="text-neutral-500 dark:text-neutral-400">
                  Subtotal {formatCents(b.basePriceCents)}
                </p>
                <p className="text-neutral-500 dark:text-neutral-400">
                  Commission &minus;{formatCents(b.hostCommissionCents)}
                </p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  Payout {formatCents(b.hostPayoutCents)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
