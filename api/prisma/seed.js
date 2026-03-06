import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Pass@123", 10);

  const provider = await prisma.user.upsert({
    where: { email: "provider@neednest.com" },
    update: {
      shopName: "Ravi Home Services",
      shopDescription: "Trusted daily home services in Bengaluru.",
      shopAddress: "BTM Layout, Bengaluru",
      workType: "Cleaning, Electrical, Plumbing"
    },
    create: {
      name: "Ravi Kumar",
      email: "provider@neednest.com",
      passwordHash,
      role: "PROVIDER",
      city: "Bengaluru",
      phone: "+91-9000000001",
      shopName: "Ravi Home Services",
      shopDescription: "Trusted daily home services in Bengaluru.",
      shopAddress: "BTM Layout, Bengaluru",
      workType: "Cleaning, Electrical, Plumbing"
    }
  });

  await prisma.user.upsert({
    where: { email: "user@neednest.com" },
    update: {},
    create: {
      name: "Ananya Sharma",
      email: "user@neednest.com",
      passwordHash,
      role: "USER",
      city: "Bengaluru",
      phone: "+91-9000000002"
    }
  });

  const services = [
    {
      title: "Home Deep Cleaning",
      description: "Professional full-home cleaning with eco-safe products.",
      category: "Cleaning",
      workType: "Cleaner",
      city: "Bengaluru",
      price: 1499,
      minorPrice: 499,
      smallPrice: 1499,
      majorPrice: 2999,
      imageUrl:
        "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=900&q=80"
    },
    {
      title: "Electrician Visit",
      description: "Fan, switchboard, lighting and wiring fixes for home.",
      category: "Electrical",
      workType: "Electrician",
      city: "Bengaluru",
      price: 499,
      minorPrice: 299,
      smallPrice: 799,
      majorPrice: 1999,
      imageUrl:
        "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=900&q=80"
    }
  ];

  for (const service of services) {
    await prisma.service.create({
      data: {
        ...service,
        providerId: provider.id
      }
    });
  }

  console.log("Seeded demo users and services");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
