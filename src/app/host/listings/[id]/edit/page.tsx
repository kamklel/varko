import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListingForm } from "@/components/ListingForm";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { photos: { orderBy: { order: "asc" } } },
  });

  if (!listing || listing.hostId !== session.user.id) {
    notFound();
  }

  return (
    <ListingForm
      initialListing={{
        id: listing.id,
        title: listing.title,
        description: listing.description,
        address: listing.address,
        city: listing.city,
        pincode: listing.pincode,
        lat: listing.lat,
        lng: listing.lng,
        capacity: listing.capacity,
        pricePerHourCents: listing.pricePerHourCents,
        photos: listing.photos.map((p) => ({ id: p.id, url: p.url })),
      }}
    />
  );
}
