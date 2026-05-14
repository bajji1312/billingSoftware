"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BillPreview } from "@/components/bill-preview";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Trash2, Pencil } from "lucide-react";

interface BillData {
  id: number;
  billNumber: string;
  invoiceNumber?: string | null;
  date: string;
  dueDate?: string | null;
  deliveryAddress?: string | null;
  purchaseOrderNumber?: string | null;
  purchaseOrderDate?: string | null;
  deliveryChallan?: string | null;
  customer: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    gstNumber?: string | null;
  };
  items: {
    id: number;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes?: string | null;
  status: string;
}

export default function BillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [bill, setBill] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bills/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setBill(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const toggleStatus = async () => {
    if (!bill) return;
    const newStatus = bill.status === "paid" ? "unpaid" : "paid";
    const res = await fetch(`/api/bills/${bill.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setBill(updated);
    }
  };

  const deleteBill = async () => {
    if (!bill) return;
    if (!confirm("Are you sure you want to delete this bill?")) return;
    const res = await fetch(`/api/bills/${bill.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/bills");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-600">Bill not found</h2>
        <Link href="/bills" className="text-primary mt-2 inline-block">
          ← Back to bills
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <Link
          href="/bills"
          className="flex items-center gap-1 text-muted hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Bills
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/bills/${bill.id}/edit`}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
          >
            <Pencil className="w-4 h-4" /> Edit
          </Link>
          <button
            onClick={toggleStatus}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              bill.status === "paid"
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            {bill.status === "paid" ? "Mark Unpaid" : "Mark Paid"}
          </button>
          <button
            onClick={deleteBill}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <BillPreview bill={bill} />
    </div>
  );
}
