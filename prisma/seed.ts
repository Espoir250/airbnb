import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data first — order matters because of foreign keys
  // Delete in reverse order of dependencies
  await prisma.booking.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️  Cleared existing data");

  // ─── Seed Users ───────────────────────────────────────────────────────────

  const alice = await prisma.user.create({
    data: {
      name: "Alice Johnson",
      email: "alice@example.com",
      username: "alice_host",
      password: "$2b$10$hashedpasswordhere", // use bcrypt in real seeds
      role: "HOST",
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: "Bob Smith",
      email: "bob@example.com",
      username: "bob_guest",
      password: "$2b$10$hashedpasswordhere",
      role: "GUEST",
    },
  });

  const carol = await prisma.user.create({
    data: {
      name: "Carol White",
      email: "carol@example.com",
      username: "carol_guest",
      password: "$2b$10$hashedpasswordhere",
      role: "GUEST",
    },
  });

  console.log("👥 Created users");

  // ─── Seed Listings ────────────────────────────────────────────────────────

  const listing1 = await prisma.listing.create({
    data: {
      title: "Cozy apartment in downtown",
      description: "A beautiful apartment in the heart of the city",
      location: "New York, NY",
      pricePerNight: 120,
      guests: 2,
      type: "APARTMENT",
      amenities: ["WiFi", "Kitchen", "Air conditioning"],
      hostId: alice.id,
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      title: "Beach house with ocean view",
      description: "Wake up to stunning ocean views every morning",
      location: "Miami, FL",
      pricePerNight: 250,
      guests: 6,
      type: "HOUSE",
      amenities: ["WiFi", "Pool", "Beach access", "BBQ"],
      hostId: alice.id,
    },
  });

  const listing3 = await prisma.listing.create({
    data: {
      title: "Mountain cabin retreat",
      description: "Escape the city in this peaceful mountain cabin",
      location: "Denver, CO",
      pricePerNight: 180,
      guests: 4,
      type: "CABIN",
      amenities: ["Fireplace", "Hiking trails", "WiFi"],
      hostId: alice.id,
    },
  });

  console.log("🏠 Created listings");

  // ─── Seed Bookings ────────────────────────────────────────────────────────

  await prisma.booking.create({
    data: {
      checkIn: new Date("2025-08-01"),
      checkOut: new Date("2025-08-05"),
      totalPrice: 480, // 4 nights × 120
      status: "CONFIRMED",
      guestId: bob.id,
      listingId: listing1.id,
    },
  });

  await prisma.booking.create({
    data: {
      checkIn: new Date("2025-09-10"),
      checkOut: new Date("2025-09-15"),
      totalPrice: 1250, // 5 nights × 250
      status: "PENDING",
      guestId: carol.id,
      listingId: listing2.id,
    },
  });

  console.log("📅 Created bookings");
  console.log("✅ Seeding complete!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });