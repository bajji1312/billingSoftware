import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { FileText, Users, IndianRupee, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [billCount, customerCount, bills] = await Promise.all([
    prisma.bill.count(),
    prisma.customer.count(),
    prisma.bill.findMany({
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalRevenue = await prisma.bill.aggregate({
    _sum: { total: true },
  });

  const paidBills = await prisma.bill.aggregate({
    _sum: { total: true },
    where: { status: "paid" },
  });

  const stats = [
    {
      label: "Total Bills",
      value: billCount,
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Customers",
      value: customerCount,
      icon: Users,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue._sum.total || 0),
      icon: IndianRupee,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Collected",
      value: formatCurrency(paidBills._sum.total || 0),
      icon: TrendingUp,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-muted mt-1">Welcome to Monisa Printers billing system</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm border border-border p-5"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Bills */}
      <div className="bg-white rounded-xl shadow-sm border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Recent Bills</h2>
          <Link
            href="/bills/new"
            className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            + New Bill
          </Link>
        </div>
        {bills.length === 0 ? (
          <div className="p-12 text-center text-muted">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No bills yet. Create your first bill!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {bills.map((bill) => (
              <Link
                key={bill.id}
                href={`/bills/${bill.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {bill.billNumber}
                    </p>
                    <p className="text-sm text-muted">{bill.customer.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(bill.total)}</p>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      bill.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {bill.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
