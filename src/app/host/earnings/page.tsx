import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Earnings",
  robots: { index: false, follow: false },
};

export default async function HostEarningsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { listing: { hostId: session.user.id }, bookingStatus: "CONFIRMED" },
    select: { hostPayoutCents: true, startTime: true },
    orderBy: { startTime: "asc" },
  });

  // eslint-disable-next-line react-hooks/purity -- Server Component: re-evaluated fresh per request, not memoized like client render
  const now = Date.now();
  const totalEarnings = bookings.reduce((sum, b) => sum + b.hostPayoutCents, 0);
  const upcoming = bookings.filter((b) => b.startTime.getTime() > now);
  const completed = bookings.filter((b) => b.startTime.getTime() <= now);
  const upcomingPayout = upcoming.reduce((sum, b) => sum + b.hostPayoutCents, 0);

  const byMonth = new Map<string, number>();
  for (const b of completed) {
    const key = b.startTime.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    byMonth.set(key, (byMonth.get(key) ?? 0) + b.hostPayoutCents);
  }
  const monthEntries = Array.from(byMonth.entries()).slice(-6);
  const maxMonth = Math.max(1, ...monthEntries.map(([, v]) => v));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Earnings
        </h1>
        <Link
          href="/host/listings"
          className="text-sm text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
        >
          Back to listings
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Total earnings</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {formatCents(totalEarnings)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Upcoming payout</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {formatCents(upcomingPayout)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Completed bookings</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {completed.length}
          </p>
        </div>
      </div>

      {monthEntries.length > 0 && (
        <div className="mt-8">
          <h2 className="font-medium text-neutral-900 dark:text-neutral-100">Last 6 months</h2>
          <div className="mt-4 space-y-2">
            {monthEntries.map(([month, amount]) => (
              <div key={month} className="flex items-center gap-3 text-sm">
                <span className="w-20 shrink-0 text-neutral-500 dark:text-neutral-400">
                  {month}
                </span>
                <div className="h-4 flex-1 rounded bg-neutral-100 dark:bg-neutral-900">
                  <div
                    className="h-4 rounded bg-blue-600"
                    style={{ width: `${(amount / maxMonth) * 100}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right font-medium text-neutral-900 dark:text-neutral-100">
                  {formatCents(amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {bookings.length === 0 && (
        <p className="mt-8 text-sm text-neutral-500 dark:text-neutral-400">
          No bookings yet -- earnings will show up here once your listings start getting booked.
        </p>
      )}
    </div>
  );
}
