import "server-only";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient | PrismaClient;

export class BookingConflictError extends Error {
  available: number;
  constructor(available: number) {
    super("Not enough spots available for that time window");
    this.available = available;
  }
}

/**
 * Sum of spots booked (CONFIRMED only) in bookings that overlap [start, end).
 * Half-open range: a booking ending at 10:00 and one starting at 10:00 do not
 * overlap, so a spot can turn over exactly at the boundary.
 */
export async function getBookedSpots(
  tx: Tx,
  listingId: string,
  start: Date,
  end: Date,
): Promise<number> {
  const result = await tx.booking.aggregate({
    where: {
      listingId,
      bookingStatus: "CONFIRMED",
      startTime: { lt: end },
      endTime: { gt: start },
    },
    _sum: { numSpots: true },
  });
  return result._sum.numSpots ?? 0;
}

export async function canBook(
  tx: Tx,
  listing: { id: string; capacity: number },
  start: Date,
  end: Date,
  requestedSpots: number,
): Promise<{ fits: boolean; available: number }> {
  const booked = await getBookedSpots(tx, listing.id, start, end);
  const available = listing.capacity - booked;
  return { fits: available >= requestedSpots, available };
}
