"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatCents } from "@/lib/pricing";
import { getPricingGuidance } from "@/lib/pricing-guardrail";
import { saveListingPhotos } from "@/lib/uploads";
import type { ListingStatus } from "@/lib/types";

const listingSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  description: z.string().trim().min(1, "Description is required").max(2000),
  address: z.string().trim().min(1, "Please look up and confirm an address"),
  city: z.string().trim().max(100).optional(),
  pincode: z.string().trim().max(20).optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  capacity: z.coerce
    .number()
    .int("Capacity must be a whole number")
    .min(1, "Capacity must be at least 1")
    .max(50, "Capacity can't exceed 50"),
  priceDollars: z.coerce.number().min(0.01, "Price must be greater than 0"),
});

export type ListingFormState = { error?: string } | undefined;

export async function saveListingAction(
  _prevState: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be logged in to list a space." };
  }

  if (!formData.get("address") || !formData.get("lat") || !formData.get("lng")) {
    return { error: "Please look up and confirm the address before submitting." };
  }

  const parsed = listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    address: formData.get("address"),
    city: formData.get("city") || undefined,
    pincode: formData.get("pincode") || undefined,
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    capacity: formData.get("capacity"),
    priceDollars: formData.get("price"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form for errors." };
  }

  const listingId = formData.get("listingId")?.toString() || null;
  const pricePerHourCents = Math.round(parsed.data.priceDollars * 100);

  let existing = null;
  if (listingId) {
    existing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!existing || existing.hostId !== session.user.id) {
      return { error: "Listing not found." };
    }
  }

  const guidance = await getPricingGuidance(
    parsed.data.lat,
    parsed.data.lng,
    listingId ?? undefined,
  );
  if (pricePerHourCents > guidance.ceilingCents) {
    return {
      error: `${formatCents(pricePerHourCents)}/hr is above the local maximum of ${formatCents(
        guidance.ceilingCents,
      )}/hr for this area. Please lower your price.`,
    };
  }
  if (pricePerHourCents < guidance.floorCents) {
    return { error: `Price must be at least ${formatCents(guidance.floorCents)}/hr.` };
  }

  const data = {
    title: parsed.data.title,
    description: parsed.data.description,
    address: parsed.data.address,
    city: parsed.data.city ?? null,
    pincode: parsed.data.pincode ?? null,
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    capacity: parsed.data.capacity,
    pricePerHourCents,
  };

  const listing = existing
    ? await prisma.listing.update({ where: { id: existing.id }, data })
    : await prisma.listing.create({ data: { ...data, hostId: session.user.id } });

  const removeIds = formData.getAll("removePhotoId").map((v) => v.toString());
  if (removeIds.length > 0) {
    await prisma.listingPhoto.deleteMany({
      where: { id: { in: removeIds }, listingId: listing.id },
    });
  }

  const photoFiles = formData.getAll("photos").filter((f): f is File => f instanceof File);
  try {
    const saved = await saveListingPhotos(listing.id, photoFiles);
    if (saved.length > 0) {
      const existingCount = await prisma.listingPhoto.count({ where: { listingId: listing.id } });
      await prisma.listingPhoto.createMany({
        data: saved.map((s, i) => ({
          listingId: listing.id,
          url: s.url,
          order: existingCount + i,
        })),
      });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to upload photo." };
  }

  revalidatePath("/host/listings");
  redirect("/host/listings");
}

export async function getPricingGuidanceAction(
  lat: number,
  lng: number,
  excludeListingId?: string,
) {
  return getPricingGuidance(lat, lng, excludeListingId);
}

export async function setListingStatusAction(listingId: string, status: ListingStatus) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.hostId !== session.user.id) {
    throw new Error("Listing not found");
  }

  await prisma.listing.update({ where: { id: listingId }, data: { status } });
  revalidatePath("/host/listings");
}
