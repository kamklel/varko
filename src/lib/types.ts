export const LISTING_STATUS = ["ACTIVE", "INACTIVE"] as const;
export type ListingStatus = (typeof LISTING_STATUS)[number];

export const BOOKING_STATUS = ["CONFIRMED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUS)[number];

export const PAYMENT_STATUS = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];
