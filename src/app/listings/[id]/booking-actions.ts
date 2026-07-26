"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canBook, BookingConflictError } from "@/lib/availability";
import { computeBookingPrice } from "@/lib/pricing";

const bookingSchema = z.object({
  listingId: z.string().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  numSpots: z.coerce.number().int().min(1),
});

function isSnappedToHalfHour(d: Date) {
  return d.getMinutes() === 0 || d.getMinutes() === 30;
}

export type BookingFormState = { error?: string } | undefined;

export async function createBookingAction(
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Please log in to book a spot." };
  }

  const parsed = bookingSchema.safeParse({
    listingId: formData.get("listingId"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    numSpots: formData.get("numSpots"),
  });

  if (!parsed.success) {
    return { error: "Please fill in a valid start time, end time, and number of spots." };
  }

  const { listingId, startTime, endTime, numSpots } = parsed.data;

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return { error: "Please choose a start and end time." };
  }
  if (startTime.getTime() < Date.now() - 60_000) {
    return { error: "Start time can't be in the past." };
  }
  if (endTime.getTime() <= startTime.getTime()) {
    return { error: "End time must be after the start time." };
  }
  const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  if (hours < 1) {
    return { error: "Bookings must be at least 1 hour long." };
  }
  if (!isSnappedToHalfHour(startTime) || !isSnappedToHalfHour(endTime)) {
    return { error: "Start and end times must land on the hour or half-hour." };
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== "ACTIVE") {
    return { error: "This listing isn't available for booking." };
  }
  if (listing.hostId === session.user.id) {
    return { error: "You can't book your own listing." };
  }
  if (numSpots > listing.capacity) {
    return { error: `This listing only has ${listing.capacity} spot${listing.capacity === 1 ? "" : "s"}.` };
  }

  const price = computeBookingPrice(listing.pricePerHourCents, hours, numSpots);
  let bookingId: string;

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const { fits, available } = await canBook(tx, listing, startTime, endTime, numSpots);
      if (!fits) {
        throw new BookingConflictError(available);
      }
      return tx.booking.create({
        data: {
          listingId,
          renterId: session.user.id,
          startTime,
          endTime,
          numSpots,
          hourlyRateCentsSnapshot: listing.pricePerHourCents,
          basePriceCents: price.basePriceCents,
          renterServiceFeeCents: price.renterServiceFeeCents,
          totalPriceCents: price.totalPriceCents,
          hostCommissionCents: price.hostCommissionCents,
          hostPayoutCents: price.hostPayoutCents,
          // Simulated payment for v1 -- flips straight to PAID since there's no
          // real processor yet. paymentProviderRef stays null until v2 wires
          // one in (e.g. a Stripe PaymentIntent id).
          paymentStatus: "PAID",
          bookingStatus: "CONFIRMED",
        },
      });
    });
    bookingId = booking.id;
  } catch (err) {
    if (err instanceof BookingConflictError) {
      return {
        error:
          err.available > 0
            ? `Only ${err.available} spot${err.available === 1 ? "" : "s"} left for that time -- reduce the number of spots or pick a different time.`
            : "No spots left for that time window. Please pick a different time.",
      };
    }
    throw err;
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/bookings");
  redirect(`/bookings?justBooked=${bookingId}`);
}

export async function checkAvailabilityAction(
  listingId: string,
  startTime: string,
  endTime: string,
  numSpots: number,
) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return { fits: false, available: 0 };
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, capacity: true },
  });
  if (!listing) return { fits: false, available: 0 };

  return canBook(prisma, listing, start, end, numSpots);
}
