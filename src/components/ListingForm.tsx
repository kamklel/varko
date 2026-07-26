"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  saveListingAction,
  getPricingGuidanceAction,
  type ListingFormState,
} from "@/app/host/listings/actions";
import { formatCents, type PricingGuidance } from "@/lib/pricing";

type GeocodeResult = {
  displayName: string;
  lat: number;
  lng: number;
  city?: string | null;
  pincode?: string | null;
};

type InitialListing = {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string | null;
  pincode: string | null;
  lat: number;
  lng: number;
  capacity: number;
  pricePerHourCents: number;
  photos: { id: string; url: string }[];
};

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-blue-400";

export function ListingForm({ initialListing }: { initialListing?: InitialListing }) {
  const [state, formAction, pending] = useActionState<ListingFormState, FormData>(
    saveListingAction,
    undefined,
  );

  const [addressQuery, setAddressQuery] = useState(initialListing?.address ?? "");
  const [selectedLocation, setSelectedLocation] = useState<GeocodeResult | null>(
    initialListing
      ? {
          displayName: initialListing.address,
          lat: initialListing.lat,
          lng: initialListing.lng,
          city: initialListing.city,
          pincode: initialListing.pincode,
        }
      : null,
  );
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<PricingGuidance | null>(null);
  const [removePhotoIds, setRemovePhotoIds] = useState<string[]>([]);

  async function handleFindLocation() {
    if (!addressQuery.trim()) return;
    setSearching(true);
    setSearchError(null);
    setResults([]);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(addressQuery)}`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        setSearchError("Couldn't look up that address. Try being more specific.");
        return;
      }
      if (data.length === 0) {
        setSearchError("No matches found. Try a more specific address.");
        return;
      }
      setResults(data);
    } catch {
      setSearchError("Couldn't reach the geocoding service. Check your connection and try again.");
    } finally {
      setSearching(false);
    }
  }

  async function handleSelectLocation(result: GeocodeResult) {
    setSelectedLocation(result);
    setAddressQuery(result.displayName);
    setResults([]);
    const g = await getPricingGuidanceAction(result.lat, result.lng, initialListing?.id);
    setGuidance(g);
  }

  const remainingPhotos = (initialListing?.photos ?? []).filter(
    (p) => !removePhotoIds.includes(p.id),
  );

  return (
    <form action={formAction} className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:py-10">
      {initialListing && <input type="hidden" name="listingId" value={initialListing.id} />}
      <input type="hidden" name="address" value={selectedLocation?.displayName ?? ""} />
      <input type="hidden" name="lat" value={selectedLocation?.lat ?? ""} />
      <input type="hidden" name="lng" value={selectedLocation?.lng ?? ""} />
      <input type="hidden" name="city" value={selectedLocation?.city ?? ""} />
      <input type="hidden" name="pincode" value={selectedLocation?.pincode ?? ""} />
      {removePhotoIds.map((id) => (
        <input key={id} type="hidden" name="removePhotoId" value={id} />
      ))}

      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          {initialListing ? "Edit listing" : "List your space"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Tell renters what you&apos;re offering and where to find it.
        </p>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={initialListing?.title}
          placeholder="e.g. Fenced field, room for 5 cars"
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          defaultValue={initialListing?.description}
          placeholder="Describe access, surface, lighting, anything a driver should know."
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="addressQuery"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Address
        </label>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <input
            id="addressQuery"
            type="text"
            value={addressQuery}
            onChange={(e) => {
              setAddressQuery(e.target.value);
              setSelectedLocation(null);
              setGuidance(null);
            }}
            placeholder="Start typing an address..."
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-blue-400"
          />
          <button
            type="button"
            onClick={handleFindLocation}
            disabled={searching || !addressQuery.trim()}
            className="shrink-0 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:border-blue-400 dark:bg-transparent dark:text-blue-400 dark:hover:bg-blue-950"
          >
            {searching ? "Searching..." : "Find location"}
          </button>
        </div>

        {searchError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{searchError}</p>}

        {results.length > 0 && (
          <ul className="mt-2 divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {results.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => handleSelectLocation(r)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
                >
                  {r.displayName}
                </button>
              </li>
            ))}
          </ul>
        )}

        {selectedLocation && (
          <div className="mt-2 text-sm text-green-700 dark:text-green-400">
            <p>📍 Confirmed: {selectedLocation.displayName}</p>
            {(selectedLocation.city || selectedLocation.pincode) && (
              <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                {selectedLocation.city && <>City: {selectedLocation.city}</>}
                {selectedLocation.city && selectedLocation.pincode && " · "}
                {selectedLocation.pincode && <>Pincode: {selectedLocation.pincode}</>}
              </p>
            )}
          </div>
        )}
        {!selectedLocation && !results.length && (
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            Type an address and click &quot;Find location&quot; to confirm it before saving.
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="capacity"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Capacity (number of car spots)
        </label>
        <input
          id="capacity"
          name="capacity"
          type="number"
          min={1}
          max={50}
          required
          defaultValue={initialListing?.capacity ?? 1}
          className={`${inputClass} w-32`}
        />
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Price per hour, per spot (₹)
        </label>
        <input
          id="price"
          name="price"
          type="number"
          min={0.01}
          step={0.01}
          required
          defaultValue={
            initialListing ? (initialListing.pricePerHourCents / 100).toFixed(2) : undefined
          }
          className={`${inputClass} w-32`}
        />

        {guidance && (
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            {guidance.coldStart ? (
              <>
                You&apos;re one of the first hosts in this area — no local pricing data yet.
                Similar marketplaces typically charge {formatCents(guidance.floorCents)}–
                {formatCents(guidance.ceilingCents)}/hr per spot.
              </>
            ) : (
              <>
                Listings {guidance.radiusKm ? `within ${guidance.radiusKm} km` : "platform-wide"}{" "}
                average {formatCents(guidance.avgCents ?? 0)}/hr (based on {guidance.sampleSize}{" "}
                listing{guidance.sampleSize === 1 ? "" : "s"}), ranging{" "}
                {formatCents(guidance.minCents ?? 0)}–{formatCents(guidance.maxCents ?? 0)}/hr.
                Maximum allowed here: {formatCents(guidance.ceilingCents)}/hr.
              </>
            )}
          </p>
        )}
      </div>

      {remainingPhotos.length > 0 && (
        <div>
          <span className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Current photos
          </span>
          <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {remainingPhotos.map((p) => (
              <div key={p.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt=""
                  className="aspect-square w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => setRemovePhotoIds((ids) => [...ids, p.id])}
                  className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white hover:bg-black/80"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="photos" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {remainingPhotos.length > 0 ? "Add more photos" : "Photos"}
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="mt-1 block w-full text-sm text-neutral-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700 dark:text-neutral-400"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending || !selectedLocation}
          className="w-full rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
        >
          {pending ? "Saving..." : initialListing ? "Save changes" : "Create listing"}
        </button>
        <Link
          href="/host/listings"
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
