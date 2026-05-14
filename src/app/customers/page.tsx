"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Trash2, X } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gstNumber?: string | null;
  _count?: { bills: number };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadCustomers = () => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, address, gstNumber }),
      });

      if (!res.ok) throw new Error("Failed to create customer");

      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setGstNumber("");
      setShowForm(false);
      loadCustomers();
    } catch {
      setError("Failed to create customer");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCustomer = async (id: number) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (res.ok) {
      loadCustomers();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete customer");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-muted mt-1">Manage your customer directory</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors font-medium"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" /> Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Add Customer
            </>
          )}
        </button>
      </div>

      {/* Add Customer Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">New Customer</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
                placeholder="Customer name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
                placeholder="Email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
                placeholder="Address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST Number
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
                placeholder="GST Number"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Customer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer List */}
      {customers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-border p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600">No customers yet</h3>
          <p className="text-muted mt-1">
            Add your first customer to start creating bills
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
                  Phone
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
                  Address
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
                  Bills
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium">{customer.name}</td>
                  <td className="py-3 px-4 text-muted text-sm">
                    {customer.phone || "—"}
                  </td>
                  <td className="py-3 px-4 text-muted text-sm">
                    {customer.email || "—"}
                  </td>
                  <td className="py-3 px-4 text-muted text-sm">
                    {customer.address || "—"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-blue-50 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full">
                      {customer._count?.bills || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => deleteCustomer(customer.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                      title="Delete customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
