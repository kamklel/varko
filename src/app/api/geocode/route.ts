import { NextRequest, NextResponse } from "next/server";

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    suburb?: string;
    postcode?: string;
  };
};

function pickCity(address: NominatimResult["address"]): string | null {
  if (!address) return null;
  return address.city ?? address.town ?? address.village ?? address.municipality ?? address.suburb ?? null;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "1");

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        // Nominatim's usage policy requires an identifying User-Agent.
        "User-Agent": "Varko-Prototype/0.1 (parking marketplace demo)",
      },
      cache: "no-store",
    });
  } catch (err) {
    console.error("Geocode fetch failed:", err);
    return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 502 });
  }

  if (!res.ok) {
    console.error("Geocode request returned", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 502 });
  }

  const results = (await res.json()) as NominatimResult[];

  return NextResponse.json(
    results.map((r) => ({
      displayName: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      city: pickCity(r.address),
      pincode: r.address?.postcode ?? null,
    })),
  );
}
