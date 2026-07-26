// One-off seed script for demo/dummy data. Run with: node prisma/seed-dummy-data.cjs
// Uses better-sqlite3 directly (raw SQL) rather than the Prisma client, matching
// the rest of this project's ad-hoc DB scripts -- avoids needing ts-node/tsx.
const Database = require("better-sqlite3");
const crypto = require("crypto");
const path = require("path");

const db = new Database(path.join(__dirname, "..", "dev.db"));

// bcrypt hash for "password123" (reused from the existing Manish test account).
const PASSWORD_HASH = "$2b$10$pglawz3ItWirvWEJBNWrS.cwNqv2jT7MkUkK1uNsQd6qu9RYdZyg.";

const now = new Date().toISOString();

function cuidLike() {
  return crypto.randomUUID();
}

function upsertUser(name, email) {
  const existing = db.prepare("SELECT id FROM User WHERE email = ?").get(email);
  if (existing) return existing.id;
  const id = cuidLike();
  db.prepare(
    `INSERT INTO User (id, name, email, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, name, email, PASSWORD_HASH, now, now);
  console.log(`Created user ${name} <${email}>`);
  return id;
}

const priyaId = upsertUser("Priya Sharma", "priya@example.com");
const arjunId = upsertUser("Arjun Mehta", "arjun@example.com");
const manish = db.prepare("SELECT id FROM User WHERE email = ?").get("manish@example.com");

const listings = [
  {
    hostId: priyaId,
    title: "Gated compound, 2 covered spots",
    description:
      "Covered parking inside a gated residential compound. CCTV on-site, easy in-and-out access.",
    address: "Bandra West, Mumbai, Maharashtra, India",
    city: "Mumbai",
    pincode: "400050",
    lat: 19.0596,
    lng: 72.8295,
    capacity: 2,
    pricePerHourCents: 5500,
  },
  {
    hostId: priyaId,
    title: "Open plot near metro station",
    description: "Flat open lot two minutes from the metro station. Great for commuters.",
    address: "Andheri East, Mumbai, Maharashtra, India",
    city: "Mumbai",
    pincode: "400069",
    lat: 19.1197,
    lng: 72.8464,
    capacity: 4,
    pricePerHourCents: 3500,
  },
  {
    hostId: arjunId,
    title: "Secure basement parking",
    description: "Basement parking in a commercial building, security guard on duty round the clock.",
    address: "Connaught Place, New Delhi, Delhi, India",
    city: "New Delhi",
    pincode: "110001",
    lat: 28.6315,
    lng: 77.2167,
    capacity: 3,
    pricePerHourCents: 5000,
  },
  {
    hostId: arjunId,
    title: "Driveway space, easy access",
    description: "A single driveway spot right off the main road, no gate to navigate.",
    address: "Koramangala, Bengaluru, Karnataka, India",
    city: "Bengaluru",
    pincode: "560034",
    lat: 12.9352,
    lng: 77.6245,
    capacity: 1,
    pricePerHourCents: 2800,
  },
  {
    hostId: arjunId,
    title: "Backyard lot, room for 3 cars",
    description: "Quiet backyard lot behind the house, flat gravel surface, well lit at night.",
    address: "Koregaon Park, Pune, Maharashtra, India",
    city: "Pune",
    pincode: "411001",
    lat: 18.5362,
    lng: 73.8938,
    capacity: 3,
    pricePerHourCents: 3000,
  },
  {
    hostId: priyaId,
    title: "Fenced yard near tech park",
    description: "Fenced yard a short walk from the tech park, popular with commuters on weekdays.",
    address: "Banjara Hills, Hyderabad, Telangana, India",
    city: "Hyderabad",
    pincode: "500034",
    lat: 17.4126,
    lng: 78.4482,
    capacity: 4,
    pricePerHourCents: 3500,
  },
  {
    hostId: manish ? manish.id : arjunId,
    title: "Rooftop parking, covered",
    description: "Covered rooftop parking with a ramp, attendant available during business hours.",
    address: "T Nagar, Chennai, Tamil Nadu, India",
    city: "Chennai",
    pincode: "600017",
    lat: 13.0418,
    lng: 80.2341,
    capacity: 2,
    pricePerHourCents: 3200,
  },
  {
    hostId: priyaId,
    title: "Spacious lot near MG Road",
    description: "Large open lot a few minutes' walk from MG Road, room for several cars.",
    address: "MG Road, Bengaluru, Karnataka, India",
    city: "Bengaluru",
    pincode: "560001",
    lat: 12.9755,
    lng: 77.6068,
    capacity: 6,
    pricePerHourCents: 4000,
  },
];

const insertListing = db.prepare(`
  INSERT INTO Listing (id, hostId, title, description, address, city, pincode, lat, lng, capacity, pricePerHourCents, status, createdAt, updatedAt)
  VALUES (@id, @hostId, @title, @description, @address, @city, @pincode, @lat, @lng, @capacity, @pricePerHourCents, 'ACTIVE', @createdAt, @updatedAt)
`);

let created = 0;
for (const l of listings) {
  const existing = db
    .prepare("SELECT id FROM Listing WHERE title = ? AND hostId = ?")
    .get(l.title, l.hostId);
  if (existing) continue;
  insertListing.run({
    id: cuidLike(),
    ...l,
    createdAt: now,
    updatedAt: now,
  });
  created++;
}

console.log(`Inserted ${created} dummy listing(s).`);
db.close();
