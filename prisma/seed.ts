import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env["DATABASE_URL"] as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Cleanup — delete in reverse dependency order
  await prisma.booking.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️  Cleared existing data");

  // 2. Create users with upsert (safe to run multiple times)
  const hashedPassword = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice Johnson",
      email: "alice@example.com",
      username: "alice_host",
      phone: "+1234567890",
      password: hashedPassword,
      role: "HOST",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      name: "Bob Smith",
      email: "bob@example.com",
      username: "bob_host",
      phone: "+1234567891",
      password: hashedPassword,
      role: "HOST",
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: "carol@example.com" },
    update: {},
    create: {
      name: "Carol White",
      email: "carol@example.com",
      username: "carol_guest",
      phone: "+1234567892",
      password: hashedPassword,
      role: "GUEST",
    },
  });

  const david = await prisma.user.upsert({
    where: { email: "david@example.com" },
    update: {},
    create: {
      name: "David Brown",
      email: "david@example.com",
      username: "david_guest",
      phone: "+1234567893",
      password: hashedPassword,
      role: "GUEST",
    },
  });

  const eve = await prisma.user.upsert({
    where: { email: "eve@example.com" },
    update: {},
    create: {
      name: "Eve Wilson",
      email: "eve@example.com",
      username: "eve_guest",
      phone: "+1234567894",
      password: hashedPassword,
      role: "GUEST",
    },
  });

  console.log("👥 Created 5 users (2 hosts, 3 guests)");

  // 3. Create listings — one of each type: APARTMENT, HOUSE, VILLA, CABIN
  const listing1 = await prisma.listing.create({
    data: {
      title: "Cozy apartment in downtown",
      description:
        "A beautiful apartment in the heart of the city with modern amenities",
      location: "New York, NY",
      pricePerNight: 120,
      guests: 2,
      type: "APARTMENT",
      amenities: ["WiFi", "Kitchen", "Air conditioning", "TV", "Washer"],
      hostId: alice.id,
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      title: "Beach house with ocean view",
      description:
        "Wake up to stunning ocean views every morning in this beachfront house",
      location: "Miami, FL",
      pricePerNight: 250,
      guests: 6,
      type: "HOUSE",
      amenities: ["WiFi", "Pool", "Beach access", "BBQ", "Parking"],
      hostId: alice.id,
    },
  });

  const listing3 = await prisma.listing.create({
    data: {
      title: "Luxury villa with private pool",
      description:
        "Experience ultimate relaxation in this stunning luxury villa",
      location: "Los Angeles, CA",
      pricePerNight: 450,
      guests: 8,
      type: "VILLA",
      amenities: [
        "Private pool",
        "Hot tub",
        "Gym",
        "Home theater",
        "Wine cellar",
      ],
      hostId: bob.id,
    },
  });

  const listing4 = await prisma.listing.create({
    data: {
      title: "Mountain cabin retreat",
      description:
        "Escape the city in this peaceful mountain cabin with breathtaking views",
      location: "Denver, CO",
      pricePerNight: 180,
      guests: 4,
      type: "CABIN",
      amenities: ["Fireplace", "Hiking trails", "WiFi", "Hot tub", "Kitchen"],
      hostId: bob.id,
    },
  });

  console.log("🏠 Created 4 listings (APARTMENT, HOUSE, VILLA, CABIN)");

  // 4. Create bookings with future dates
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // Booking 1: CONFIRMED, 4 nights in New York
  const checkIn1 = new Date(nextMonth);
  checkIn1.setDate(1);
  const checkOut1 = new Date(checkIn1);
  checkOut1.setDate(checkIn1.getDate() + 4);
  const nights1 = Math.ceil(
    (checkOut1.getTime() - checkIn1.getTime()) / (1000 * 60 * 60 * 24),
  );

  await prisma.booking.create({
    data: {
      checkIn: checkIn1,
      checkOut: checkOut1,
      guests: 2,
      totalPrice: nights1 * listing1.pricePerNight,
      status: "CONFIRMED",
      guestId: carol.id,
      listingId: listing1.id,
    },
  });

  // Booking 2: PENDING, 5 nights in Miami
  const checkIn2 = new Date(nextMonth);
  checkIn2.setDate(10);
  const checkOut2 = new Date(checkIn2);
  checkOut2.setDate(checkIn2.getDate() + 5);
  const nights2 = Math.ceil(
    (checkOut2.getTime() - checkIn2.getTime()) / (1000 * 60 * 60 * 24),
  );

  await prisma.booking.create({
    data: {
      checkIn: checkIn2,
      checkOut: checkOut2,
      guests: 4,
      totalPrice: nights2 * listing2.pricePerNight,
      status: "PENDING",
      guestId: david.id,
      listingId: listing2.id,
    },
  });

  // Booking 3: CONFIRMED, 3 nights in LA
  const checkIn3 = new Date(nextMonth);
  checkIn3.setDate(20);
  const checkOut3 = new Date(checkIn3);
  checkOut3.setDate(checkIn3.getDate() + 3);
  const nights3 = Math.ceil(
    (checkOut3.getTime() - checkIn3.getTime()) / (1000 * 60 * 60 * 24),
  );

  await prisma.booking.create({
    data: {
      checkIn: checkIn3,
      checkOut: checkOut3,
      guests: 2,
      totalPrice: nights3 * listing3.pricePerNight,
      status: "CONFIRMED",
      guestId: eve.id,
      listingId: listing3.id,
    },
  });

  console.log(
    "📅 Created 3 bookings (2 CONFIRMED, 1 PENDING) with future dates",
  );
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
