"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MapView } from "@/components/MapView";
import { formatCents } from "@/lib/pricing";
import { searchListingsAction, type SearchResultListing } from "@/app/search/actions";

const RADIUS_OPTIONS_KM = [2, 5, 10, 25, 50];

type GeoStatus = "prompting" | "denied" | "unavailable" | "ready";

const inputClass =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-blue-400";

export function SearchClient() {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [radiusKm, setRadiusKm] = useState(10);
  const [results, setResults] = useState<SearchResultListing[] | null>(null);
  // Must start as "prompting" on both server and client -- checking
  // `navigator` here to pick an initial value would desync from the server
  // render (no `navigator` in Node) and cause a hydration mismatch.
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("prompting");
  const [loading, setLoading] = useState(false);

  const [addressQuery, setAddressQuery] = useState("");
  const [addressSearching, setAddressSearching] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const runSearch = useCallback(async (lat: number, lng: number, radius: number) => {
    setLoading(true);
    try {
      const r = await searchListingsAction(lat, lng, radius);
      setResults(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- must transition post-mount (client-only check); doing this in the initializer would desync from SSR
      setGeoStatus("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCenter(c);
        setLocationLabel("Your current location");
        setGeoStatus("ready");
        runSearch(c[0], c[1], radiusKm);
      },
      () => setGeoStatus("denied"),
      { timeout: 8000 },
    );
    // Only run once on mount -- radiusKm changes are handled by handleRadiusChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFindAddress() {
    if (!addressQuery.trim()) return;
    setAddressSearching(true);
    setAddressError(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(addressQuery)}`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data) || data.length === 0) {
        setAddressError("Couldn't find that address. Try being more specific.");
        return;
      }
      const top = data[0];
      setCenter([top.lat, top.lng]);
      setLocationLabel(top.displayName);
      setGeoStatus("ready");
      await runSearch(top.lat, top.lng, radiusKm);
    } catch {
      setAddressError("Couldn't reach the geocoding service. Try again.");
    } finally {
      setAddressSearching(false);
    }
  }

  function handleRadiusChange(newRadius: number) {
    setRadiusKm(newRadius);
    if (center) runSearch(center[0], center[1], newRadius);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 gap-2">
            <input
              type="text"
              value={addressQuery}
              onChange={(e) => setAddressQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleFindAddress();
                }
              }}
              placeholder="Search by address, e.g. 'MG Road, Bangalore'"
              className={`w-full ${inputClass}`}
            />
            <button
              type="button"
              onClick={handleFindAddress}
              disabled={addressSearching || !addressQuery.trim()}
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {addressSearching ? "Searching..." : "Search"}
            </button>
          </div>
          <select
            value={radiusKm}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            className={inputClass}
          >
            {RADIUS_OPTIONS_KM.map((km) => (
              <option key={km} value={km}>
                within {km} km
              </option>
            ))}
          </select>
        </div>
        {addressError && (
          <p className="mx-auto mt-2 max-w-5xl text-sm text-red-600 dark:text-red-400">
            {addressError}
          </p>
        )}
        {geoStatus === "denied" && (
          <p className="mx-auto mt-2 max-w-5xl text-sm text-neutral-500 dark:text-neutral-400">
            Location access was denied -- search for an address above instead.
          </p>
        )}
        {locationLabel && (
          <p className="mx-auto mt-2 max-w-5xl text-sm text-neutral-500 dark:text-neutral-400">
            Showing parking near{" "}
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {locationLabel}
            </span>
          </p>
        )}
      </div>

      <div className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-0 lg:grid-cols-2">
        <div className="order-2 flex flex-col overflow-y-auto px-4 py-4 lg:order-1">
          {!center && geoStatus === "prompting" && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Finding your location...
            </p>
          )}
          {!center && (geoStatus === "denied" || geoStatus === "unavailable") && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Search for an address above to find parking nearby.
            </p>
          )}
          {loading && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Searching...</p>
          )}
          {results && results.length === 0 && !loading && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No parking spots found within {radiusKm} km. Try a wider radius.
            </p>
          )}
          {results && results.length > 0 && !loading && (
            <ul className="space-y-3">
              {results.map((listing) => (
                <li key={listing.id}>
                  <Link
                    href={`/listings/${listing.id}`}
                    className="block rounded-lg border border-neutral-200 p-4 hover:border-blue-600 dark:border-neutral-800 dark:hover:border-blue-400"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">
                          {listing.title}
                        </p>
                        <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                          {listing.address}
                        </p>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          {listing.distanceKm.toFixed(1)} km away · {listing.capacity} spot
                          {listing.capacity === 1 ? "" : "s"}
                        </p>
                      </div>
                      <p className="shrink-0 whitespace-nowrap font-medium text-neutral-900 dark:text-neutral-100">
                        {formatCents(listing.pricePerHourCents)}/hr
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="order-1 h-72 lg:sticky lg:top-0 lg:order-2 lg:h-[calc(100vh-8.5rem)]">
          {center ? (
            <MapView
              center={center}
              youAreHere={center}
              pins={(results ?? []).map((l) => ({
                id: l.id,
                lat: l.lat,
                lng: l.lng,
                label: l.title,
                price: `${formatCents(l.pricePerHourCents)}/hr`,
              }))}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-neutral-100 text-sm text-neutral-400 dark:bg-neutral-900 dark:text-neutral-600">
              Map will appear once a location is set
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
