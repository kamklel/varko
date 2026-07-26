// Client-safe pricing helpers and constants -- no Prisma/server-only imports here,
// since this module is imported directly by client components (e.g. to render
// live price breakdowns and pricing-guidance text). The DB-backed guardrail
// lookup itself lives in src/lib/pricing-guardrail.ts (server-only).

// Platform fee model. Named constants so they're easy to retune later --
// each booking snapshots its own computed amounts, so changing these never
// rewrites historical bookings.
export const RENTER_SERVICE_FEE_RATE = 0.1;
export const HOST_COMMISSION_RATE = 0.1;

// Amounts are stored as integer paise (1 INR = 100 paise) -- same "smallest
// unit x 100" shape as cents, just a different currency.
export const ABSOLUTE_FLOOR_CENTS = 500; // ₹5.00/hr
export const ABSOLUTE_CEILING_CENTS = 30000; // ₹300.00/hr

export function computeBookingPrice(
  hourlyRateCents: number,
  hours: number,
  numSpots: number,
) {
  const basePriceCents = Math.round(hourlyRateCents * hours * numSpots);
  const renterServiceFeeCents = Math.round(basePriceCents * RENTER_SERVICE_FEE_RATE);
  const hostCommissionCents = Math.round(basePriceCents * HOST_COMMISSION_RATE);
  return {
    basePriceCents,
    renterServiceFeeCents,
    totalPriceCents: basePriceCents + renterServiceFeeCents,
    hostCommissionCents,
    hostPayoutCents: basePriceCents - hostCommissionCents,
  };
}

export type PricingGuidance = {
  sampleSize: number;
  radiusKm: number | null;
  avgCents: number | null;
  minCents: number | null;
  maxCents: number | null;
  ceilingCents: number;
  floorCents: number;
  coldStart: boolean;
};

export function formatCents(cents: number): string {
  return `₹${(cents / 100).toFixed(2)}`;
}
