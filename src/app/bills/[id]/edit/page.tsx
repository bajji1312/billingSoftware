"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const PREDEFINED_ITEMS = [
  { description: "CT Scan Cover", rate: 4.28, hsnCode: "4819" },
  { description: "MRI Scan Cover", rate: 4.28, hsnCode: "4819" },
  { description: "Doctor,S Order", rate: 100, hsnCode: "" },
  { description: "X-Ray Cover Size - 21 x 15 inches", rate: 15, hsnCode: "" },
  { description: "Discharge Summary Folder", rate: 9.50, hsnCode: "" },
];

interface BillItem {
  description: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  isCustom: boolean;
}

interface Customer {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
}

export default function EditBillPage() {
  const params = useParams();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("");
  const [purchaseOrderDate, setPurchaseOrderDate] = useState("");
  const [deliveryChallan, setDeliveryChallan] = useState("");
  const [sgstPercent, setSgstPercent] = useState(9);
  const [cgstPercent, setCgstPercent] = useState(9);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [billDate, setBillDate] = useState("");
  const [items, setItems] = useState<BillItem[]>([
    { description: "", hsnCode: "", quantity: 1, rate: 0, isCustom: false },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch(`/api/bills/${params.id}`).then((r) => r.json()),
    ])
      .then(([customersData, billData]) => {
        setCustomers(customersData);
        setCustomerId(String(billData.customerId));
        setInvoiceNumber(billData.invoiceNumber || "");
        setDeliveryAddress(billData.deliveryAddress || "");
        setPurchaseOrderNumber(billData.purchaseOrderNumber || "");
        setPurchaseOrderDate(billData.purchaseOrderDate || "");
        setDeliveryChallan(billData.deliveryChallan || "");
        setSgstPercent(billData.taxPercent / 2);
        setCgstPercent(billData.taxPercent / 2);
        setDiscount(billData.discount || 0);
        setNotes(billData.notes || "");
        setBillDate(new Date(billData.date).toISOString().split("T")[0]);
        setItems(
          billData.items.map((item: { description: string; hsnCode?: string; quantity: number; rate: number }) => {
            const isPredefined = PREDEFINED_ITEMS.some((p) => p.description === item.description);
            return {
              description: item.description,
              hsnCode: item.hsnCode || "",
              quantity: item.quantity,
              rate: item.rate,
              isCustom: !isPredefined,
            };
          })
        );
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load bill data");
        setLoading(false);
      });
  }, [params.id]);

  const addItem = () => {
    setItems([...items, { description: "", hsnCode: "", quantity: 1, rate: 0, isCustom: false }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof BillItem, value: string) => {
    const updated = [...items];
    if (field === "description") {
      updated[index].description = value;
    } else if (field === "isCustom") {
      updated[index].isCustom = value === "true";
    } else {
      updated[index][field] = parseFloat(value) || 0;
    }
    setItems(updated);
  };

  const handleDescriptionChange = (index: number, value: string) => {
    const updated = [...items];
    if (value === "__custom__") {
      updated[index] = { ...updated[index], isCustom: true, description: "", hsnCode: "" };
    } else {
      const preset = PREDEFINED_ITEMS.find((p) => p.description === value);
      updated[index] = {
        ...updated[index],
        isCustom: false,
        description: value,
        rate: preset ? preset.rate : updated[index].rate,
        hsnCode: preset ? preset.hsnCode : updated[index].hsnCode,
      };
    }
    setItems(updated);
  };

  const taxPercent = sgstPercent + cgstPercent;
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const taxAmount = (subtotal * taxPercent) / 100;
  const total = subtotal + taxAmount - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!customerId) {
      setError("Please select a customer");
      return;
    }

    if (!invoiceNumber.trim()) {
      setError("Please enter an invoice number");
      return;
    }

    if (items.some((item) => !item.description.trim())) {
      setError("All items must have a description");
      return;
    }

    if (items.some((item) => item.quantity <= 0 || item.rate <= 0)) {
      setError("All items must have valid quantity and rate");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/bills/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: Number(customerId),
          invoiceNumber: invoiceNumber.trim(),
          deliveryAddress: deliveryAddress.trim() || null,
          purchaseOrderNumber: purchaseOrderNumber.trim() || null,
          purchaseOrderDate: purchaseOrderDate || null,
          deliveryChallan: deliveryChallan.trim() || null,
          items: items.map(({ description, hsnCode, quantity, rate }) => ({
            description,
            hsnCode: hsnCode || null,
            quantity,
            rate,
          })),
          taxPercent,
          discount,
          notes,
          date: billDate || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update bill");

      router.push(`/bills/${params.id}`);
    } catch {
      setError("Failed to update bill. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

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
          <Link
            href={`/bills/${params.id}`}
            className="flex items-center gap-1 text-muted hover:text-gray-900 transition-colors text-sm mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Bill
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Bill</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Customer & Invoice Details */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
                required
              >
                <option value="">Select a customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number *
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Enter invoice number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Address
              </label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
                placeholder="Enter delivery address..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bill Date *
              </label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Order Number
              </label>
              <input
                type="text"
                value={purchaseOrderNumber}
                onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                placeholder="Enter PO number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Order Date
              </label>
              <input
                type="date"
                value={purchaseOrderDate}
                onChange={(e) => setPurchaseOrderDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Challan No. & Date
              </label>
              <input
                type="text"
                value={deliveryChallan}
                onChange={(e) => setDeliveryChallan(e.target.value)}
                placeholder="e.g. 25 - 30/04/2026"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-3 text-sm font-medium text-gray-500 px-1">
              <div className="col-span-4">Description</div>
              <div className="col-span-1">HSN</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Rate (₹)</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-1"></div>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-start">
                <div className="col-span-4 space-y-1">
                  <select
                    value={item.isCustom ? "__custom__" : item.description}
                    onChange={(e) => handleDescriptionChange(index, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
                    required={!item.isCustom}
                  >
                    <option value="">Select item</option>
                    {PREDEFINED_ITEMS.map((p) => (
                      <option key={p.description} value={p.description}>
                        {p.description}
                      </option>
                    ))}
                    <option value="__custom__">+ Custom Item</option>
                  </select>
                  {item.isCustom && (
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
                      placeholder="Enter custom description"
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      required
                    />
                  )}
                </div>
                <input
                  className="col-span-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none text-sm"
                  type="text"
                  value={item.hsnCode}
                  onChange={(e) => {
                    const updated = [...items];
                    updated[index].hsnCode = e.target.value;
                    setItems(updated);
                  }}
                  placeholder="HSN"
                />
                <input
                  className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity || ""}
                  onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  required
                />
                <input
                  className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.rate || ""}
                  onChange={(e) => updateItem(index, "rate", e.target.value)}
                  required
                />
                <div className="col-span-2 text-sm font-medium text-gray-700 px-1 py-2">
                  {formatINR(item.quantity * item.rate)}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="col-span-1 text-red-400 hover:text-red-600 transition-colors disabled:opacity-30 py-2"
                  disabled={items.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
                placeholder="Additional notes..."
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm items-center gap-3">
                <span className="text-gray-600">SGST (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={sgstPercent}
                  onChange={(e) => setSgstPercent(parseFloat(e.target.value) || 0)}
                  className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-right focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
                />
                <span className="font-medium min-w-[100px] text-right">
                  {formatINR((subtotal * sgstPercent) / 100)}
                </span>
              </div>
              <div className="flex justify-between text-sm items-center gap-3">
                <span className="text-gray-600">CGST (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={cgstPercent}
                  onChange={(e) => setCgstPercent(parseFloat(e.target.value) || 0)}
                  className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-right focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
                />
                <span className="font-medium min-w-[100px] text-right">
                  {formatINR((subtotal * cgstPercent) / 100)}
                </span>
              </div>
              <div className="flex justify-between text-sm items-center gap-3">
                <span className="text-gray-600">Discount (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount || ""}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-right focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
                />
                <span className="font-medium min-w-[100px] text-right text-red-500">
                  -{formatINR(discount)}
                </span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatINR(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Updating..." : "Update Bill"}
          </button>
        </div>
      </form>
    </div>
  );
}
