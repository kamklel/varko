import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Temporary one-off seeding endpoint for populating the production database with
// demo listings. Gate is a fixed key (not a real secret) since the data itself is
// non-sensitive dummy content -- remove this route once seeding is done.
const SEED_KEY = "varko-seed-2026";
const TOTAL_LISTINGS = 1000;
const HOST_COUNT = 20;

// bcrypt hash for "password123".
const PASSWORD_HASH = "$2b$10$pglawz3ItWirvWEJBNWrS.cwNqv2jT7MkUkK1uNsQd6qu9RYdZyg.";

const HOST_FIRST_NAMES = [
  "Priya", "Arjun", "Rohan", "Ananya", "Vikram", "Sneha", "Karthik", "Divya",
  "Aditya", "Neha", "Rahul", "Pooja", "Sanjay", "Kavya", "Amit", "Ritu",
  "Vivek", "Meera", "Suresh", "Anjali",
];
const HOST_LAST_NAMES = [
  "Sharma", "Mehta", "Reddy", "Iyer", "Singh", "Nair", "Gupta", "Rao",
  "Kapoor", "Menon", "Verma", "Pillai", "Joshi", "Desai", "Chopra", "Bhat",
];

// [city, state, lat, lng, pincode prefix (5 digits, last one randomized)]
const CITIES: Array<[string, string, number, number, string]> = [
  ["Mumbai", "Maharashtra", 19.076, 72.8777, "40005"],
  ["New Delhi", "Delhi", 28.6139, 77.209, "11000"],
  ["Bengaluru", "Karnataka", 12.9716, 77.5946, "56003"],
  ["Hyderabad", "Telangana", 17.385, 78.4867, "50003"],
  ["Chennai", "Tamil Nadu", 13.0827, 80.2707, "60001"],
  ["Kolkata", "West Bengal", 22.5726, 88.3639, "70001"],
  ["Pune", "Maharashtra", 18.5204, 73.8567, "41100"],
  ["Ahmedabad", "Gujarat", 23.0225, 72.5714, "38000"],
  ["Jaipur", "Rajasthan", 26.9124, 75.7873, "30200"],
  ["Surat", "Gujarat", 21.1702, 72.8311, "39500"],
  ["Lucknow", "Uttar Pradesh", 26.8467, 80.9462, "22600"],
  ["Kanpur", "Uttar Pradesh", 26.4499, 80.3319, "20800"],
  ["Nagpur", "Maharashtra", 21.1458, 79.0882, "44000"],
  ["Indore", "Madhya Pradesh", 22.7196, 75.8577, "45200"],
  ["Bhopal", "Madhya Pradesh", 23.2599, 77.4126, "46200"],
  ["Coimbatore", "Tamil Nadu", 11.0168, 76.9558, "64100"],
  ["Kochi", "Kerala", 9.9312, 76.2673, "68200"],
  ["Chandigarh", "Chandigarh", 30.7333, 76.7794, "16001"],
  ["Guwahati", "Assam", 26.1445, 91.7362, "78100"],
  ["Bhubaneswar", "Odisha", 20.2961, 85.8245, "75100"],
  ["Vadodara", "Gujarat", 22.3072, 73.1812, "39000"],
  ["Visakhapatnam", "Andhra Pradesh", 17.6868, 83.2185, "53000"],
  ["Patna", "Bihar", 25.5941, 85.1376, "80000"],
  ["Nashik", "Maharashtra", 19.9975, 73.7898, "42200"],
  ["Thiruvananthapuram", "Kerala", 8.5241, 76.9366, "69500"],
];

const AREA_WORDS = [
  "Sector 12", "Phase 2", "Green Park", "Lake View Colony", "MG Road Extension",
  "Civil Lines", "Model Town", "Vasant Vihar", "Sunrise Enclave", "Palm Grove",
  "Silver Oaks", "New Layout", "Ring Road", "Station Road", "Garden Estate",
  "Hill View", "Riverside Colony", "Market Square", "Tech Park Road", "Old Town",
];

const TITLE_TEMPLATES = [
  (a: string) => `Covered driveway near ${a}`,
  (a: string) => `Open plot in ${a}`,
  (a: string) => `Secure gated parking, ${a}`,
  (a: string) => `Basement parking near ${a}`,
  (a: string) => `Rooftop spot, ${a}`,
  (a: string) => `Backyard lot in ${a}`,
  (a: string) => `Fenced yard near ${a}`,
  (a: string) => `Street-side spot, ${a}`,
  (a: string) => `Society parking, ${a}`,
  (a: string) => `Commercial lot near ${a}`,
];

const DESCRIPTIONS = [
  "Well-lit and easy to access, close to main roads.",
  "Flat surface with room to maneuver, popular with commuters.",
  "CCTV on-site, gated entry, attendant during business hours.",
  "Quiet residential spot, walking distance from local shops.",
  "Covered area, protected from sun and rain.",
  "Open lot with space for multiple vehicles.",
  "Close to the metro/bus stop, great for daily commuters.",
  "Simple, no-frills space with easy in-and-out access.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function jitter(value: number, spread: number) {
  return value + (Math.random() - 0.5) * spread;
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== SEED_KEY) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existingCount = await prisma.listing.count();
  if (existingCount >= 100) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: `Already seeded (${existingCount} listings exist).`,
    });
  }

  const hostIds: string[] = [];
  for (let i = 0; i < HOST_COUNT; i++) {
    const name = `${pick(HOST_FIRST_NAMES)} ${pick(HOST_LAST_NAMES)}`;
    const email = `demo-host-${i + 1}@example.com`;
    const host = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name, email, passwordHash: PASSWORD_HASH },
    });
    hostIds.push(host.id);
  }

  const listings = [];
  for (let i = 0; i < TOTAL_LISTINGS; i++) {
    const [city, state, lat, lng, pincodePrefix] = pick(CITIES);
    const area = pick(AREA_WORDS);
    const pincode = `${pincodePrefix}${Math.floor(Math.random() * 10)}`;

    listings.push({
      hostId: pick(hostIds),
      title: pick(TITLE_TEMPLATES)(area),
      description: pick(DESCRIPTIONS),
      address: `${area}, ${city}, ${state}, India`,
      city,
      pincode,
      lat: jitter(lat, 0.2),
      lng: jitter(lng, 0.2),
      capacity: 1 + Math.floor(Math.random() * 6),
      pricePerHourCents: 1500 + Math.floor(Math.random() * 6500),
      status: "ACTIVE",
    });
  }

  const result = await prisma.listing.createMany({ data: listings });

  return NextResponse.json({ ok: true, hosts: hostIds.length, listingsCreated: result.count });
}
