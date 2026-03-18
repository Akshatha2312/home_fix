import { Calendar, Clock, MapPin, User, ExternalLink } from "lucide-react";
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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 card-hover">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-linear-to-br from-primary-400 to-secondary-500 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {userType === "customer" ? providerName : customerName}
            </h4>
            <p className="text-sm text-gray-500 capitalize">
              {booking.serviceType} Service
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${status.color}`}
        >
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5`}
          ></span>
          {status.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date(booking.bookingDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <Clock className="w-4 h-4" />
          <span>{booking.bookingTime}</span>
        </div>
        {booking.address?.area && (
          <div className="flex items-center gap-2 text-gray-500 col-span-2">
            <MapPin className="w-4 h-4" />
            <span>
              {booking.address.area}, {booking.address.city || "Bangalore"}
            </span>
            {booking.address?.coordinates?.lat && (
              <a
                href={`https://www.google.com/maps?q=${booking.address.coordinates.lat},${booking.address.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                <ExternalLink className="w-3 h-3" />
                Map
              </a>
            )}
          </div>
        )}
      </div>

      {booking.problemDescription && (
        <p className="mt-3 text-sm text-gray-500 line-clamp-2">
          {booking.problemDescription}
        </p>
      )}

      {booking.status === "cancelled" && booking.cancellationReason && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700">
          <span className="font-medium">Cancellation Reason:</span>{" "}
          {booking.cancellationReason}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
        <div className="text-sm">
          <span className="text-gray-400">Est. Cost </span>
          <span className="font-semibold text-gray-900">
            ₹{booking.estimatedCost || 0}
          </span>
        </div>

        {/* Action buttons based on status and user type */}
        <div className="flex gap-2">
          {userType === "provider" && booking.status === "pending" && (
            <>
              <button
                onClick={() => onAction?.("accepted", booking._id)}
                className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                disabled={isProcessing}
              >
                Accept
              </button>
              <button
                onClick={() => onAction?.("rejected", booking._id)}
                className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
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
                className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
            )}
          {userType === "customer" &&
            booking.status === "accepted" &&
            booking.paymentStatus === "pending" && (
              <button
                onClick={() => onAction?.("pay", booking._id)}
                className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                className="px-3 py-1.5 text-xs font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg transition-colors"
                disabled={isProcessing}
              >
                Rate & Review
              </button>
            )}
          {booking.rating && userType === "customer" && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Rated:</span>
              <RatingStars rating={booking.rating} size="xs" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
