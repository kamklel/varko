"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { computeBookingPrice, formatCents } from "@/lib/pricing";
import { createBookingAction, checkAvailabilityAction } from "@/app/listings/[id]/booking-actions";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDatetimeLocalValue(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nextHalfHour(d: Date) {
  const result = new Date(d);
  result.setSeconds(0, 0);
  const minutes = result.getMinutes();
  const add = minutes % 30 === 0 ? 30 : 30 - (minutes % 30);
  result.setMinutes(minutes + add);
  return result;
}

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-blue-400";
const cardClass = "rounded-lg border border-neutral-200 p-4 dark:border-neutral-800";

export function BookingWidget({
  listingId,
  pricePerHourCents,
  capacity,
  isLoggedIn,
  isOwnListing,
  listingActive,
}: {
  listingId: string;
  pricePerHourCents: number;
  capacity: number;
  isLoggedIn: boolean;
  isOwnListing: boolean;
  listingActive: boolean;
}) {
  const [state, formAction, pending] = useActionState(createBookingAction, undefined);

  const [startTime, setStartTime] = useState(() => toDatetimeLocalValue(nextHalfHour(new Date())));
  const [endTime, setEndTime] = useState(() => {
    const start = nextHalfHour(new Date());
    return toDatetimeLocalValue(new Date(start.getTime() + 60 * 60 * 1000));
  });
  const [numSpots, setNumSpots] = useState(1);
  const [availability, setAvailability] = useState<{ fits: boolean; available: number } | null>(
    null,
  );
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!listingActive || isOwnListing) return;
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      // No setState here -- the render below already gates on validRange/hours,
      // so a stale `availability` value from a previous valid range just stays
      // hidden rather than needing to be cleared.
      return;
    }
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard "start loading" flag before an async fetch (React's own data-fetching-effect pattern)
    setChecking(true);
    checkAvailabilityAction(listingId, startTime, endTime, numSpots)
      .then((result) => {
        if (!cancelled) setAvailability(result);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId, startTime, endTime, numSpots, listingActive, isOwnListing]);

  const start = new Date(startTime);
  const end = new Date(endTime);
  const validRange = !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
  const hours = validRange ? (end.getTime() - start.getTime()) / (1000 * 60 * 60) : 0;
  const price = validRange ? computeBookingPrice(pricePerHourCents, hours, numSpots) : null;

  if (!listingActive) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          This listing isn&apos;t currently bookable.
        </p>
      </div>
    );
  }

  if (isOwnListing) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">This is your own listing.</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          <Link href="/login" className="font-medium text-blue-600 underline dark:text-blue-400">
            Log in
          </Link>{" "}
          to book this spot.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className={cardClass}>
      <input type="hidden" name="listingId" value={listingId} />
      <p className="font-medium text-neutral-900 dark:text-neutral-100">
        {formatCents(pricePerHourCents)}/hr per spot
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Start
          </label>
          <input
            id="startTime"
            name="startTime"
            type="datetime-local"
            step={1800}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            End
          </label>
          <input
            id="endTime"
            name="endTime"
            type="datetime-local"
            step={1800}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="numSpots" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Number of spots
          </label>
          <input
            id="numSpots"
            name="numSpots"
            type="number"
            min={1}
            max={capacity}
            value={numSpots}
            onChange={(e) => setNumSpots(Math.max(1, Number(e.target.value) || 1))}
            className={`${inputClass} w-24`}
          />
        </div>
      </div>

      {!validRange && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
          End time must be after the start time.
        </p>
      )}
      {validRange && hours < 1 && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
          Bookings must be at least 1 hour long.
        </p>
      )}

      {validRange && hours >= 1 && (
        <>
          {checking && (
            <p className="mt-3 text-sm text-neutral-400 dark:text-neutral-500">
              Checking availability...
            </p>
          )}
          {!checking && availability && !availability.fits && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              {availability.available > 0
                ? `Only ${availability.available} spot${availability.available === 1 ? "" : "s"} available for that time.`
                : "No spots available for that time window."}
            </p>
          )}
          {!checking && availability?.fits && price && (
            <div className="mt-4 space-y-1 border-t border-neutral-200 pt-3 text-sm dark:border-neutral-800">
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>
                  {formatCents(pricePerHourCents)} × {hours.toFixed(1)}h × {numSpots} spot
                  {numSpots === 1 ? "" : "s"}
                </span>
                <span>{formatCents(price.basePriceCents)}</span>
              </div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Service fee</span>
                <span>{formatCents(price.renterServiceFeeCents)}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-1 font-medium text-neutral-900 dark:border-neutral-800 dark:text-neutral-100">
                <span>Total</span>
                <span>{formatCents(price.totalPriceCents)}</span>
              </div>
            </div>
          )}
        </>
      )}

      {state?.error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || !validRange || hours < 1 || checking || !availability?.fits}
        className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Booking..." : "Book now"}
      </button>
    </form>
  );
}
