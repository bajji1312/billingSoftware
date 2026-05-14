"use client";

import { useRef } from "react";
import { formatCurrency, formatDate, amountToWords } from "@/lib/utils";
import { Download, Printer } from "lucide-react";

interface BillItem {
 id: number;
 description: string;
 hsnCode?: string | null;
 quantity: number;
 rate: number;
 amount: number;
}

interface Customer {
 name: string;
 phone?: string | null;
 email?: string | null;
 address?: string | null;
 gstNumber?: string | null;
}

interface Bill {
 id: number;
 billNumber: string;
 invoiceNumber?: string | null;
 date: string;
 dueDate?: string | null;
 deliveryAddress?: string | null;
 purchaseOrderNumber?: string | null;
 purchaseOrderDate?: string | null;
 deliveryChallan?: string | null;
 customer: Customer;
 items: BillItem[];
 subtotal: number;
 taxPercent: number;
 taxAmount: number;
 discount: number;
 total: number;
 notes?: string | null;
 status: string;
}

export function BillPreview({ bill }: { bill: Bill }) {
 const printRef = useRef<HTMLDivElement>(null);

 const handlePrint = () => {
 window.print();
 };

 const getFileName = () => {
 const customerName = bill.customer.name.replace(/[^a-zA-Z0-9]/g, "");
 return `${customerName}billno.${bill.invoiceNumber || bill.billNumber}`;
 };

 const handleDownloadPDF = async () => {
 if (!printRef.current) return;

 const isWindows = navigator.userAgent.includes("Windows");

 if (isWindows) {
 // On Windows, html2canvas doesn't handle DPI scaling correctly.
 // Use the browser's native print → Save as PDF which renders perfectly.
 const originalTitle = document.title;
 document.title = getFileName();
 window.print();
 // Restore title after print dialog closes
 const restoreTitle = () => {
 document.title = originalTitle;
 window.removeEventListener("focus", restoreTitle);
 window.removeEventListener("afterprint", restoreTitle);
 };
 window.addEventListener("afterprint", restoreTitle);
 // Fallback: restore on window focus (some browsers don't fire afterprint)
 window.addEventListener("focus", restoreTitle);
 return;
 }

 // Mac/Linux: use html2canvas + jsPDF (works correctly at DPR 1-2)
 const html2canvas = (await import("html2canvas-pro")).default;
 const { jsPDF } = await import("jspdf");

 const element = printRef.current;
 const originalStyle = element.style.cssText;
 element.style.width = "794px";
 element.style.maxWidth = "794px";
 element.style.padding = "40px";

 const canvas = await html2canvas(element, {
 scale: 2,
 useCORS: true,
 backgroundColor: "#ffffff",
 width: 794,
 windowWidth: 794,
 });

 element.style.cssText = originalStyle;

 const imgData = canvas.toDataURL("image/png");
 const pdf = new jsPDF("p", "mm", "a4");
 const pdfWidth = pdf.internal.pageSize.getWidth();
 const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

 pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
 pdf.save(`${getFileName()}.pdf`);
 };

 const sgstPercent = bill.taxPercent / 2;
 const cgstPercent = bill.taxPercent / 2;
 const sgstAmount = (bill.subtotal * sgstPercent) / 100;
 const cgstAmount = (bill.subtotal * cgstPercent) / 100;

 return (
 <div>
 {/* Action Buttons */}
 <div className="no-print flex gap-3 mb-6 justify-end">
 <button
 onClick={handlePrint}
 className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
 >
 <Printer className="w-4 h-4" /> Print
 </button>
 <button
 onClick={handleDownloadPDF}
 className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
 >
 <Download className="w-4 h-4" /> Download PDF
 </button>
 </div>

 {/* Bill Content */}
 <div
 ref={printRef}
 data-bill-preview
 className="print-area bg-white rounded-xl shadow-sm border border-border p-8 max-w-3xl mx-auto"
 >
 {/* Header */}
 <div className="flex justify-between items-start border-b-2 border-primary pb-6 mb-6">
 <div>
 <h1 className="text-4xl font-bold text-black" style={{ fontFamily: "'Brush 455 BT', 'Brush Script MT', cursive" }}>Monisa Printers</h1>
 <p className="text-sm text-black mt-1">
 56 Paramananda Mudali Street, Sevenwells, Chennai - 600 001.
 </p>
 <p className="text-sm text-black">
 Phone: 9092940103 / 9940615145
 </p>
 <p className="text-sm text-black">
 Email: monisaprinters@gmail.com / monisha_prints@yahoo.co.in
 </p>
 <p className="text-sm text-black font-medium">
 GST NO: 33AGKPM6192P1ZO
 </p>
 </div>
 <div className="text-right">
 <h2 className="text-2xl font-bold text-black">TAX INVOICE</h2>
 {bill.invoiceNumber && (
 <p className="text-sm font-bold text-black mt-1">Invoice #: {bill.invoiceNumber}</p>
 )}
 <div className="flex justify-end gap-4 text-sm mt-1">
 <span className="text-black">Date:</span>
 <span className="font-medium">{formatDate(bill.date)}</span>
 </div>
 </div>
 </div>

 {/* Bill Details & Customer */}
 <div className="grid grid-cols-2 mb-8 border border-gray-300">
 <div className="p-4 border-r border-gray-300">
 <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-2">
 Bill To
 </h3>
 <p className="font-semibold text-black">{bill.customer.name}</p>
 {bill.customer.address && (
 <p className="text-sm text-black">{bill.customer.address}</p>
 )}
 {bill.customer.phone && (
 <p className="text-sm text-black">Phone: {bill.customer.phone}</p>
 )}
 {bill.customer.email && (
 <p className="text-sm text-black">Email: {bill.customer.email}</p>
 )}
 {bill.customer.gstNumber && (
 <p className="text-sm text-black font-medium">GST NO: {bill.customer.gstNumber}</p>
 )}
 {bill.deliveryAddress && (
 <p className="font-bold text-black">
 <span className="font-bold">Delivery Address: </span><p>{bill.deliveryAddress}</p>
 </p>
 )}
 </div>
 <div className="p-4">
 <div className="space-y-1">
 <p className="text-sm text-black">
 <span className="font-bold">Purchase Order No: </span>{bill.purchaseOrderNumber || ""}
 </p>
 <p className="text-sm text-black">
 <span className="font-bold">Purchase Order Date: </span>{bill.purchaseOrderDate ? formatDate(bill.purchaseOrderDate) : ""}
 </p>
 <p className="text-sm text-black">
 <span className="font-bold">Delivery Challan No. & Date: </span>{bill.deliveryChallan || ""}
 </p>
 </div>
 </div>
 </div>


 {/* Items Table */}
 <table className="w-full mb-0 border-collapse border border-gray-300">
 <thead>
 <tr className="bg-gray-50">
 <th className="text-left py-3 px-4 text-xs font-bold text-black uppercase tracking-wider border border-gray-300">
 #
 </th>
 <th className="text-left py-3 px-4 text-xs font-bold text-black uppercase tracking-wider border border-gray-300">
 Description
 </th>
 <th className="text-left py-3 px-4 text-xs font-bold text-black uppercase tracking-wider border border-gray-300">
 HSN Code
 </th>
 <th className="text-right py-3 px-4 text-xs font-bold text-black uppercase tracking-wider border border-gray-300">
 Qty
 </th>
 <th className="text-right py-3 px-4 text-xs font-bold text-black uppercase tracking-wider border border-gray-300">
 Rate
 </th>
 <th className="text-right py-3 px-4 text-xs font-bold text-black uppercase tracking-wider border border-gray-300">
 Amount
 </th>
 </tr>
 </thead>
 <tbody>
 {bill.items.map((item, index) => (
 <tr key={item.id}>
 <td className="py-3 px-4 text-sm text-black border border-gray-300">{index + 1}</td>
 <td className="py-3 px-4 text-sm font-bold border border-gray-300">{item.description}</td>
 <td className="py-3 px-4 text-sm border border-gray-300">{item.hsnCode || ""}</td>
 <td className="py-3 px-4 text-sm font-bold text-right border border-gray-300">{item.quantity}</td>
 <td className="py-3 px-4 text-sm text-right border border-gray-300">
 {formatCurrency(item.rate)}
 </td>
 <td className="py-3 px-4 text-sm text-right font-medium border border-gray-300">
 {formatCurrency(item.amount)}
 </td>
 </tr>
 ))}
 </tbody>
 <tfoot>
 <tr>
 <td colSpan={4} rowSpan={bill.discount > 0 ? 5 : 4} className="border border-gray-300"></td>
 <td className="py-2 px-4 text-sm font-semibold text-black border border-gray-300">Subtotal</td>
 <td className="py-2 px-4 text-sm text-right font-bold text-black border border-gray-300">{formatCurrency(bill.subtotal)}</td>
 </tr>
 <tr>
 <td className="py-2 px-4 text-sm font-semibold text-black border border-gray-300">SGST ({sgstPercent}%)</td>
 <td className="py-2 px-4 text-sm text-right font-bold text-black border border-gray-300">{formatCurrency(sgstAmount)}</td>
 </tr>
 <tr>
 <td className="py-2 px-4 text-sm font-semibold text-black border border-gray-300">CGST ({cgstPercent}%)</td>
 <td className="py-2 px-4 text-sm text-right font-bold text-black border border-gray-300">{formatCurrency(cgstAmount)}</td>
 </tr>
 {bill.discount > 0 && (
 <tr>
 <td className="py-2 px-4 text-sm font-semibold text-black border border-gray-300">Discount</td>
 <td className="py-2 px-4 text-sm text-right text-red-500 border border-gray-300">-{formatCurrency(bill.discount)}</td>
 </tr>
 )}
 <tr>
 <td className="py-3 px-4 text-base font-bold text-black border border-gray-300">Total</td>
 <td className="py-3 px-4 text-base text-right font-bold text-black border border-gray-300">{formatCurrency(bill.total)}</td>
 </tr>
 </tfoot>
 </table>

 {/* Amount in Words */}
 <div className="mt-4 pt-4 border-t border-gray-200">
 <p className="text-sm font-bold text-black">
 Amount in Words: {amountToWords(bill.total)}
 </p>
 </div>

 {/* Signature */}
 <div className="mt-10 flex justify-end pr-12">
 <div className="text-right">
 <p className="text-xl font-bold text-black"><span style={{ fontFamily: "Arial, sans-serif" }}>For </span><span style={{ fontFamily: "'Brush 455 BT', 'Brush Script MT', cursive" }}>Monisa Printers,</span></p>
 <div className="mt-20 border-t border-gray-400 pt-1">
 <p className="text-sm text-black">Authorized Signatory</p>
 </div>
 </div>
 </div>

 {/* Notes */}
 {bill.notes && (
 <div className="mt-6 pt-4 border-t border-gray-200">
 <h3 className="text-xs font-semibold text-black uppercase tracking-wider mb-2">
 Notes
 </h3>
 <p className="text-sm text-black">{bill.notes}</p>
 </div>
 )}
 </div>
 </div>
 );
}