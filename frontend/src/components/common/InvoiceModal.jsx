import { Printer, Download, X, CheckCircle2, ShieldCheck, Home } from "lucide-react";

const InvoiceModal = ({ booking, onClose }) => {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNo = `INV-${booking._id.toString().slice(-8).toUpperCase()}`;
  const invoiceDate = booking.paidAt
    ? new Date(booking.paidAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date(booking.createdAt || Date.now()).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  const estimatedCost = booking.estimatedCost || 0;
  const discountAmount = booking.discountAmount || 0;
  const finalAmount = booking.finalAmount > 0 ? booking.finalAmount : Math.max(0, estimatedCost - discountAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Action Header - Hidden when printing */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-sm">HomeFix Official Receipt</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Content */}
        <div className="p-8 space-y-6 print:p-0" id="printable-invoice">
          {/* Brand Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-[#0F2747] font-black text-2xl tracking-tight mb-1">
                <span>HomeFix</span>
                <span className="text-xs bg-teal-50 text-[#0F766E] border border-teal-100 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Home Services Marketplace Pvt Ltd
              </p>
              <p className="text-xs text-slate-500 font-medium">Bangalore, Karnataka, India</p>
              <p className="text-xs text-slate-500 font-medium">support@homefix.com</p>
            </div>
            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-[#16A34A] border border-emerald-200 font-bold text-xs uppercase tracking-wider rounded-full mb-2">
                Payment Completed
              </span>
              <h2 className="text-xl font-black text-[#0F2747]">{invoiceNo}</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Date: {invoiceDate}</p>
              {booking.paymentId || booking.razorpayPaymentId ? (
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Txn ID: {booking.paymentId || booking.razorpayPaymentId}
                </p>
              ) : null}
            </div>
          </div>

          {/* Customer & Provider Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Billed To (Customer)
              </span>
              <h3 className="font-bold text-[#0F2747] text-sm">
                {booking.customerId?.name || "Valued Customer"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {booking.customerId?.email || ""}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {booking.address?.street ? `${booking.address.street}, ` : ""}
                {booking.address?.area ? `${booking.address.area}, ` : ""}
                {booking.address?.city || "Bangalore"} {booking.address?.pincode || ""}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Service Provider
              </span>
              <h3 className="font-bold text-[#0F2747] text-sm flex items-center gap-1">
                {booking.providerId?.name || "Service Partner"}
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" />
              </h3>
              <p className="text-xs text-slate-500 capitalize font-medium">
                Category: {booking.serviceType || "Home Repairs"}
              </p>
              {booking.providerId?.phone && (
                <p className="text-xs text-slate-500 font-medium">
                  Contact: {booking.providerId.phone}
                </p>
              )}
            </div>
          </div>

          {/* Service Particulars Table */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F2747] block mb-3">
              Service Item Breakdown
            </span>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 rounded-l-lg">Description</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr>
                  <td className="py-3 px-3">
                    <span className="font-bold text-[#0F2747] capitalize block">
                      {booking.serviceType} Service
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {booking.problemDescription || "Standard home service visit"}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {new Date(booking.bookingDate).toLocaleDateString("en-IN")} @ {booking.bookingTime}
                  </td>
                  <td className="py-3 px-3">{booking.estimatedDuration || 1} Hour(s)</td>
                  <td className="py-3 px-3 text-right font-bold text-[#0F2747]">
                    ₹{estimatedCost.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary / Total Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-500 max-w-xs">
              <div className="flex items-center gap-1 text-[#16A34A] font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Invoice</span>
              </div>
              <p>
                Thank you for booking through HomeFix. All services are backed by our Quality Satisfaction Commitment.
              </p>
            </div>
            <div className="w-full sm:w-64 space-y-2 text-xs font-semibold text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{estimatedCost.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#16A34A] font-bold">
                  <span>Coupon Discount ({booking.couponCode}):</span>
                  <span>-₹{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Taxes & Platform Fees:</span>
                <span>Included</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-[#0F2747]">
                <span>Total Amount Paid:</span>
                <span>₹{finalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100 text-xs text-slate-400 font-medium print:hidden">
          Need assistance with this invoice? Contact support@homefix.com
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
