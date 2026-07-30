"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function toggleFavoriteAction(listingId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId: session.user.id, listingId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { userId: session.user.id, listingId } });
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/favorites");
  return { favorited: !existing };
}
