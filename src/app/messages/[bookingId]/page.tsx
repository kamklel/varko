import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageForm } from "@/components/MessageForm";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: { select: { title: true, hostId: true } },
      renter: { select: { id: true, name: true } },
      conversation: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: { sender: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!booking) notFound();
  const isRenter = booking.renterId === userId;
  const isHost = booking.listing.hostId === userId;
  if (!isRenter && !isHost) notFound();

  const messages = booking.conversation?.messages ?? [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        {booking.listing.title}
      </h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Conversation about your booking on {booking.startTime.toLocaleDateString()}
      </p>

      <div className="mt-6 flex-1 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No messages yet — say hello!
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === userId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    mine
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                  }`}
                >
                  {!mine && (
                    <p className="mb-0.5 text-xs font-medium opacity-70">{m.sender.name}</p>
                  )}
                  <p className="whitespace-pre-wrap">{m.body}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <MessageForm bookingId={booking.id} />
    </div>
  );
}
