import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bill = await prisma.bill.findUnique({
    where: { id: Number(id) },
    include: { customer: true, items: true },
  });

  if (!bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  return NextResponse.json(bill);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // If only status update
  if (body.status && Object.keys(body).length === 1) {
    const bill = await prisma.bill.update({
      where: { id: Number(id) },
      data: { status: body.status },
      include: { customer: true, items: true },
    });
    return NextResponse.json(bill);
  }

  // Full bill update
  const { customerId, items, taxPercent, discount, notes, date, invoiceNumber, deliveryAddress, purchaseOrderNumber, purchaseOrderDate, deliveryChallan } = body;

  const subtotal = items.reduce(
    (sum: number, item: { quantity: number; rate: number }) =>
      sum + item.quantity * item.rate,
    0
  );
  const taxAmount = (subtotal * (taxPercent || 18)) / 100;
  const total = subtotal + taxAmount - (discount || 0);

  // Delete existing items and recreate
  await prisma.billItem.deleteMany({ where: { billId: Number(id) } });

  const bill = await prisma.bill.update({
    where: { id: Number(id) },
    data: {
      invoiceNumber: invoiceNumber || null,
      customerId: Number(customerId),
      subtotal,
      taxPercent: taxPercent || 18,
      taxAmount,
      discount: discount || 0,
      total,
      notes: notes || null,
      date: date ? new Date(date) : undefined,
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
            rate: item.rate,
            amount: item.quantity * item.rate,
          })
        ),
      },
    },
    include: { customer: true, items: true },
  });

  return NextResponse.json(bill);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.bill.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
