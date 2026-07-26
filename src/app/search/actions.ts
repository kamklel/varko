"use server";

import { findListingsNearby } from "@/lib/geo";

export type SearchResultListing = {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  capacity: number;
  pricePerHourCents: number;
  distanceKm: number;
};

export async function searchListingsAction(
  lat: number,
  lng: number,
  radiusKm: number,
): Promise<SearchResultListing[]> {
  const listings = await findListingsNearby(lat, lng, radiusKm);
  return listings.map((l) => ({
    id: l.id,
    title: l.title,
    address: l.address,
    lat: l.lat,
    lng: l.lng,
    capacity: l.capacity,
    pricePerHourCents: l.pricePerHourCents,
    distanceKm: l.distanceKm,
  }));
}
