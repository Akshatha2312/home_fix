import { Calendar, Clock, MapPin, User, ExternalLink, ShieldCheck, ArrowRight } from "lucide-react";
import { BOOKING_STATUS } from "../../config/constants";
import RatingStars from "./RatingStars";

const BookingCard = ({
  booking,
  userType = "customer",
  onAction,
  isProcessing = false,
}) => {
  const status = BOOKING_STATUS[booking.status] || BOOKING_STATUS.pending;
  const providerName = booking.providerId?.name || "Provider";
  const customerName = booking.customerId?.name || "Customer";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-teal-50 text-[#0F766E] rounded-2xl flex items-center justify-center font-bold text-base border border-teal-100 shrink-0">
            {userType === "customer" ? (
              booking.providerId?.profileImage ? (
                <img
                  src={booking.providerId.profileImage}
                  alt={providerName}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                providerName.charAt(0).toUpperCase()
              )
            ) : (
              customerName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h4 className="font-extrabold text-[#0F2747] text-base leading-tight">
              {userType === "customer" ? providerName : customerName}
            </h4>
            <p className="text-xs font-bold text-[#0F766E] uppercase tracking-wider mt-0.5">
              {booking.serviceType} Service
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${status.color}`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${status.dot}`}
            ></span>
            {status.label}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-semibold text-slate-600">
        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <Calendar className="w-4 h-4 text-[#0F766E] shrink-0" />
          <span>
            {new Date(booking.bookingDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <Clock className="w-4 h-4 text-[#0F766E] shrink-0" />
          <span>{booking.bookingTime} ({booking.estimatedDuration || 1} hr)</span>
        </div>
        {booking.address?.area && (
          <div className="flex items-center justify-between gap-2 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-1 sm:col-span-2">
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">
                {booking.address.street ? `${booking.address.street}, ` : ""}
                {booking.address.area}, {booking.address.city || "Bangalore"}
              </span>
            </div>
            {booking.address?.coordinates?.lat && (
              <a
                href={`https://www.google.com/maps?q=${booking.address.coordinates.lat},${booking.address.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-xs text-[#0F766E] hover:underline font-bold shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                GPS Map
              </a>
            )}
          </div>
        )}
      </div>

      {booking.problemDescription && (
        <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
          <span className="font-bold text-[#0F2747]">Notes: </span>
          {booking.problemDescription}
        </div>
      )}

      {booking.rating && (
        <div className="mt-3 p-3 bg-amber-50/70 rounded-xl text-xs border border-amber-200/80">
          <div className="flex items-center justify-between mb-1">
            <span className="font-extrabold text-[#0F2747]">Customer Review</span>
            <RatingStars rating={booking.rating} size="xs" />
          </div>
          {booking.review && <p className="text-slate-700 italic">"{booking.review}"</p>}

          {booking.providerReply?.text && (
            <div className="mt-2 pl-3 border-l-2 border-[#0F766E] text-slate-700 font-medium bg-white p-2 rounded-r-lg">
              <span className="font-bold text-[#0F766E] block text-[11px] uppercase tracking-wider">
                Provider Response:
              </span>
              <span>{booking.providerReply.text}</span>
            </div>
          )}
        </div>
      )}

      {booking.status === "cancelled" && booking.cancellationReason && (
        <div className="mt-3 p-3 bg-red-50 rounded-xl text-xs text-[#DC2626] border border-red-100 font-medium">
          <span className="font-bold">Cancellation Reason:</span>{" "}
          {booking.cancellationReason}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            Total Cost
          </span>
          <div className="flex items-center gap-2">
            <span className="font-black text-[#0F2747] text-lg">
              ₹{booking.finalAmount > 0 ? booking.finalAmount : (booking.estimatedCost || 0)}
            </span>
            {booking.discountAmount > 0 && (
              <span className="text-[11px] font-bold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                -₹{booking.discountAmount} OFF ({booking.couponCode})
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {(booking.paymentStatus === "paid" || booking.status === "completed") && (
            <button
              onClick={() => onAction?.("invoice", booking)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#0F2747] rounded-xl transition-all border border-slate-200 cursor-pointer flex items-center gap-1"
            >
              📄 Invoice / Receipt
            </button>
          )}

          {userType === "provider" && booking.status === "pending" && (
            <>
              <button
                onClick={() => onAction?.("accepted", booking._id)}
                className="px-3.5 py-2 text-xs font-bold bg-[#16A34A] text-white hover:bg-emerald-700 rounded-xl transition-all shadow-2xs cursor-pointer"
                disabled={isProcessing}
              >
                Accept
              </button>
              <button
                onClick={() => onAction?.("rejected", booking._id)}
                className="px-3.5 py-2 text-xs font-bold bg-[#DC2626] text-white hover:bg-red-700 rounded-xl transition-all shadow-2xs cursor-pointer"
                disabled={isProcessing}
              >
                Reject
              </button>
            </>
          )}

          {userType === "customer" &&
            (booking.status === "pending" || booking.status === "accepted") && (
              <button
                onClick={() => onAction?.("cancelled", booking._id)}
                className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-[#DC2626] rounded-xl transition-all border border-slate-200 cursor-pointer"
                disabled={isProcessing}
              >
                Cancel Booking
              </button>
            )}

          {userType === "customer" &&
            booking.status === "accepted" &&
            booking.paymentStatus === "pending" && (
              <button
                onClick={() => onAction?.("pay", booking._id)}
                className="px-4 py-2 text-xs font-bold bg-[#16A34A] text-white hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Pay Now"}
              </button>
            )}

          {booking.status === "completed" &&
            !booking.rating &&
            userType === "customer" && (
              <button
                onClick={() => onAction?.("review", booking)}
                className="px-4 py-2 text-xs font-bold bg-[#0F766E] text-white hover:bg-[#0B5F59] rounded-xl transition-all shadow-xs cursor-pointer"
                disabled={isProcessing}
              >
                Rate & Review
              </button>
            )}

          {userType === "provider" &&
            booking.rating &&
            !booking.providerReply?.text && (
              <button
                onClick={() => onAction?.("replyReview", booking)}
                className="px-3.5 py-2 text-xs font-bold bg-[#0F766E] text-white hover:bg-[#0B5F59] rounded-xl transition-all shadow-2xs cursor-pointer"
                disabled={isProcessing}
              >
                Reply to Review
              </button>
            )}

          {booking.rating && userType === "customer" && (
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/80">
              <span className="text-xs font-bold text-amber-900">Rated:</span>
              <RatingStars rating={booking.rating} size="xs" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
