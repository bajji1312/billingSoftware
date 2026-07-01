import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const bills = await prisma.bill.findMany({
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(bills);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { customerId, items, taxPercent, discount, notes, date, invoiceNumber, deliveryAddress, purchaseOrderNumber, purchaseOrderDate, deliveryChallan } = body;

  const subtotal = Number(
    items.reduce(
      (sum: number, item: { quantity: number; rate: number }) =>
        sum + item.quantity * item.rate,
      0
    ).toFixed(2)
  );
  const taxAmount = Number(((subtotal * (taxPercent || 18)) / 100).toFixed(2));
  const total = Number((subtotal + taxAmount - (discount || 0)).toFixed(2));

  // Generate a unique bill number
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const prefix = `MP-${year}${month}-`;
  let counter = await prisma.bill.count();
  let billNumber = `${prefix}${String(counter + 1).padStart(4, "0")}`;

  while (true) {
    const existingBill = await prisma.bill.findUnique({
      where: { billNumber },
      select: { id: true },
    });

    if (!existingBill) break;

    counter += 1;
    billNumber = `${prefix}${String(counter + 1).padStart(4, "0")}`;
  }

  const bill = await prisma.bill.create({
    data: {
      billNumber,
      invoiceNumber: invoiceNumber || null,
      customerId: Number(customerId),
      subtotal,
      taxPercent: taxPercent || 18,
      taxAmount,
      discount: discount || 0,
      total,
      notes: notes || null,
      date: date ? new Date(date) : new Date(),
      deliveryAddress: deliveryAddress || null,
      purchaseOrderNumber: purchaseOrderNumber || null,
      purchaseOrderDate: purchaseOrderDate || null,
      deliveryChallan: deliveryChallan || null,
      items: {
        create: items.map(
          (item: { description: string; hsnCode?: string; quantity: number; rate: number }) => ({
            description: item.description,
            hsnCode: item.hsnCode || null,
            quantity: item.quantity,
            rate: Number(item.rate.toFixed(3)),
            amount: Number((item.quantity * item.rate).toFixed(2)),
          })
        ),
      },
    },
    include: { customer: true, items: true },
  });

  return NextResponse.json(bill, { status: 201 });
}
