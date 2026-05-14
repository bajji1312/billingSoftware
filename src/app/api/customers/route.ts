import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { bills: true } } },
  });
  return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, phone, email, address, gstNumber } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Customer name is required" },
      { status: 400 }
    );
  }

  const customer = await prisma.customer.create({
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null,
      gstNumber: gstNumber?.trim() || null,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}
