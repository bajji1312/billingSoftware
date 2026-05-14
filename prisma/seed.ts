import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const customer1 = await prisma.customer.create({
    data: {
      name: "TAMILNADU MEDICAL SERVICES CORPORATION LTD",
      address: "3RD FLOOR, 417, PANTHEAN ROAD, EGMORE, Chennai, Tamil Nadu, 600008",
      gstNumber: "33AAACT3400E1Z4",
    },
  });

  console.log("Seeded customer:", customer1.name);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
