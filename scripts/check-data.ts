import { prisma } from "../src/config/prisma";

async function main() {
  const users = await prisma.user.findMany();
  const listings = await prisma.listing.findMany();

  console.log("Users:", JSON.stringify(users, null, 2));
  console.log("Listings:", JSON.stringify(listings, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
