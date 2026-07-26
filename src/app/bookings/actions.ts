"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function cancelBookingAction(bookingId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.renterId !== session.user.id) {
    throw new Error("Booking not found");
  }
  if (booking.bookingStatus !== "CONFIRMED") {
    throw new Error("Booking is not active");
  }
  if (booking.startTime.getTime() <= Date.now()) {
    throw new Error("Can't cancel a booking that has already started");
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { bookingStatus: "CANCELLED" },
  });
  revalidatePath("/bookings");
  revalidatePath("/host/bookings");
}
