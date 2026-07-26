import "server-only";
import { prisma } from "@/lib/prisma";
import { findListingsNearby } from "@/lib/geo";
import { ABSOLUTE_FLOOR_CENTS, ABSOLUTE_CEILING_CENTS, type PricingGuidance } from "@/lib/pricing";

// Area-based pricing guardrail: widen the search radius until there's enough
// comparable data to trust, with a looser ceiling multiplier the wider (less
// local) the sample. Always fall back to flat sanity bounds.
const RADIUS_TIERS_KM = [3, 20] as const;
const TIER_MULTIPLIERS = [1.5, 1.75, 2.0];
const MIN_COMPARABLES = 3;

export async function getPricingGuidance(
  lat: number,
  lng: number,
  excludeId?: string,
): Promise<PricingGuidance> {
  for (let i = 0; i < RADIUS_TIERS_KM.length; i++) {
    const listings = await findListingsNearby(lat, lng, RADIUS_TIERS_KM[i], excludeId);
    if (listings.length >= MIN_COMPARABLES) {
      return summarize(
        listings.map((l) => l.pricePerHourCents),
        RADIUS_TIERS_KM[i],
        TIER_MULTIPLIERS[i],
      );
    }
  }

  // Platform-wide (no distance limit).
  const allActive = await prisma.listing.findMany({
    where: { status: "ACTIVE", id: excludeId ? { not: excludeId } : undefined },
    select: { pricePerHourCents: true },
  });
  if (allActive.length >= MIN_COMPARABLES) {
    return summarize(allActive.map((l) => l.pricePerHourCents), null, TIER_MULTIPLIERS[2]);
  }

  // Cold start: fewer than MIN_COMPARABLES even platform-wide.
  return {
    sampleSize: allActive.length,
    radiusKm: null,
    avgCents: null,
    minCents: null,
    maxCents: null,
    ceilingCents: ABSOLUTE_CEILING_CENTS,
    floorCents: ABSOLUTE_FLOOR_CENTS,
    coldStart: true,
  };
}

function summarize(prices: number[], radiusKm: number | null, multiplier: number): PricingGuidance {
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  return {
    sampleSize: prices.length,
    radiusKm,
    avgCents: avg,
    minCents: Math.min(...prices),
    maxCents: Math.max(...prices),
    ceilingCents: Math.min(Math.round(avg * multiplier), ABSOLUTE_CEILING_CENTS),
    floorCents: ABSOLUTE_FLOOR_CENTS,
    coldStart: false,
  };
}
