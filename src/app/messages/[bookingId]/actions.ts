"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertParticipant(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: { select: { hostId: true } } },
  });
  if (!booking) throw new Error("Booking not found");
  if (booking.renterId !== userId && booking.listing.hostId !== userId) {
    throw new Error("Not authorized");
  }
  return booking;
}

export async function sendMessageAction(bookingId: string, body: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  if (!body.trim()) throw new Error("Message can't be empty");

  await assertParticipant(bookingId, session.user.id);

  const conversation = await prisma.conversation.upsert({
    where: { bookingId },
    update: {},
    create: { bookingId },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: session.user.id,
      body: body.trim(),
    },
  });

  revalidatePath(`/messages/${bookingId}`);
}
