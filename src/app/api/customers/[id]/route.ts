import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const customerWithBills = await prisma.customer.findUnique({
    where: { id: Number(id) },
    include: { _count: { select: { bills: true } } },
  });

  if (!customerWithBills) {
    return NextResponse.json(
      { error: "Customer not found" },
      { status: 404 }
    );
  }

  if (customerWithBills._count.bills > 0) {
    return NextResponse.json(
      { error: "Cannot delete customer with existing bills" },
      { status: 400 }
    );
  }

  await prisma.customer.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
