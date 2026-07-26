import "server-only";
import { prisma } from "@/lib/prisma";
import type { Listing } from "@/generated/prisma/client";

const KM_PER_DEGREE_LAT = 111.32;

export function boundingBox(lat: number, lng: number, radiusKm: number) {
  const dLat = radiusKm / KM_PER_DEGREE_LAT;
  const dLng = radiusKm / (KM_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180));
  return {
    minLat: lat - dLat,
    maxLat: lat + dLat,
    minLng: lng - dLng,
    maxLng: lng + dLng,
  };
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Active listings within radiusKm of (lat, lng), ordered nearest-first.
 * Shared by the pricing guardrail and the renter search page.
 */
export async function findListingsNearby(
  lat: number,
  lng: number,
  radiusKm: number,
  excludeId?: string,
): Promise<(Listing & { distanceKm: number })[]> {
  const box = boundingBox(lat, lng, radiusKm);
  const candidates = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      id: excludeId ? { not: excludeId } : undefined,
      lat: { gte: box.minLat, lte: box.maxLat },
      lng: { gte: box.minLng, lte: box.maxLng },
    },
  });

  return candidates
    .map((l) => ({ ...l, distanceKm: haversineKm(lat, lng, l.lat, l.lng) }))
    .filter((l) => l.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
