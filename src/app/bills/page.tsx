import { prisma } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BillsPage() {
  const bills = await prisma.bill.findMany({
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bills</h1>
          <p className="text-muted mt-1">Manage all your invoices</p>
        </div>
        <Link
          href="/bills/new"
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors font-medium"
        >
          + New Bill
        </Link>
      </div>

      {bills.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-border p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600">No bills yet</h3>
          <p className="text-muted mt-1">Create your first bill to get started</p>
          <Link
            href="/bills/new"
            className="inline-block mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Create Bill
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
                  Date
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium">{bill.invoiceNumber || bill.billNumber}</td>
                  <td className="py-3 px-4 text-muted">{bill.customer.name}</td>
                  <td className="py-3 px-4 text-muted text-sm">
                    {formatDate(bill.date)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">
                    {formatCurrency(bill.total)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        bill.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {bill.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/bills/${bill.id}`}
                        className="text-primary hover:text-primary-dark text-sm font-medium"
                      >
                        View
                      </Link>
                      <Link
                        href={`/bills/${bill.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}