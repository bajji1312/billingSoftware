import { BillForm } from "@/components/bill-form";

export default function NewBillPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Bill</h1>
        <p className="text-muted mt-1">Fill in the details to generate a new invoice</p>
      </div>
      <BillForm />
    </div>
  );
}
