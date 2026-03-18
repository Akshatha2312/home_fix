import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  Bell,
  TrendingUp,
  Loader,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import BookingCard from "../components/common/BookingCard";
import Modal from "../components/common/Modal";
import ReviewModal from "../components/common/ReviewModal";
import toast from "react-hot-toast";
import { bookingsAPI, paymentsAPI } from "../services/api";
import { useSocket } from "../context/socket";
import { loadRazorpay } from "../utils/loadRazorpay";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] =
    useState(null);

  useEffect(() => {
    console.log("Current tab:", activeTab);
    fetchBookings();
  }, [activeTab]);

  useEffect(() => {
    if (socket) {
      socket.on("booking-updated", (data) => {
        toast.success(data.message);
        setBookings((prev) =>
          prev.map((b) => (b._id === data.booking._id ? data.booking : b)),
        );
      });

      socket.on("provider-online", (data) => {
        toast(
          () => (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>
                <strong>{data.providerName}</strong> is now online!
              </span>
            </div>
          ),
          { duration: 5000, icon: "👋" },
        );
      });

      return () => {
        socket.off("booking-updated");
        socket.off("provider-online");
      };
    }
  }, [socket]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingsAPI.getCustomerBookings();
      if (response && response.success) {
        setBookings(response.bookings);
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      setError("Failed to load your bookings. Please try again later.");
      toast.error("Could not load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (bookingId) => {
    try {
      setSelectedBookingId(bookingId);
      setProcessingPayment(true);
      const isLoaded = await loadRazorpay();

      if (!isLoaded) {
        toast.error("Razorpay SDK failed to load. Check your connection.");
        setProcessingPayment(false);
        return;
      }

      // Create Order
      const { order, keyId, booking } = await paymentsAPI.createOrder({
        bookingId,
      });

      console.log("[Frontend] Payment Order Response:", { order, keyId });

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "HomeFix",
        description: `Payment for ${booking.serviceType} Service`,
        order_id: order.id,
        handler: async function (response) {
          console.log("[Frontend] Razorpay Response:", response);
          try {
            const verifyRes = await paymentsAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              toast.success("Payment Successful!");
              fetchBookings(); // Refresh to show updated status
            }
          } catch (err) {
            console.error("Payment Verification Failed", err);
            toast.error(err.message || "Payment verification failed");
          } finally {
            setProcessingPayment(false);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(false);
          },
        },
      };

      console.log("[Frontend] Razorpay Options:", options);

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

      // Ensure processing state is reset if user closes modal without paying
      paymentObject.on("payment.failed", function (response) {
        console.error("Payment Failed:", response.error);
        toast.error(response.error.description || "Payment failed");
        setProcessingPayment(false);
      });
    } catch (err) {
      console.error("Payment Error:", err);
      toast.error(err.message || "Could not initiate payment");
      setProcessingPayment(false);
    }
  };

  const handleReviewSuccess = () => {
    fetchBookings(); // Refresh to show updated rating
  };

  const handleAction = async (action, bookingId) => {
    if (action === "pay") {
      handlePayment(bookingId);
    }
    if (action === "cancelled") {
      setSelectedBookingId(bookingId);
      setIsCancelModalOpen(true);
      setCancellationReason("");
    }
    if (action === "review") {
      // bookingId here is actually the whole booking object passed from BookingCard
      setSelectedBookingForReview(bookingId);
      setShowReviewModal(true);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellationReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    try {
      setCancelling(true);
      await bookingsAPI.cancel(selectedBookingId, cancellationReason);
      setBookings((prev) =>
        prev.map((b) =>
          b._id === selectedBookingId ? { ...b, status: "cancelled" } : b,
        ),
      );
      toast.success("Booking cancelled successfully");
      setIsCancelModalOpen(false);
    } catch (err) {
      console.error("Failed to cancel booking:", err);
      toast.error(err.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  const filtered =
    activeTab === "all"
      ? bookings
      : bookings.filter((b) => b.status === activeTab);

  const stats = [
    {
      label: "Total Bookings",
      value: bookings.length,
      icon: Calendar,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Completed",
      value: bookings.filter((b) => b.status === "completed").length,
      icon: TrendingUp,
      color: "from-green-500 to-emerald-600",
    },
    {
      label: "Pending",
      value: bookings.filter((b) => b.status === "pending").length,
      icon: Clock,
      color: "from-yellow-500 to-orange-500",
    },
    {
      label: "Upcoming",
      value: bookings.filter((b) => b.status === "accepted").length,
      icon: Bell,
      color: "from-purple-500 to-indigo-600",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-gray-500">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-red-100 max-w-md">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={fetchBookings}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name?.split(" ")[0] || "Customer"}!
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your bookings and service history
            </p>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-primary-500 to-primary-600 text-white text-sm font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Book New Service
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 card-hover"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 bg-linear-to-br ${stat.color} rounded-xl flex items-center justify-center`}
                >
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: "all", label: "All Bookings" },
            { key: "pending", label: "Pending" },
            { key: "accepted", label: "Upcoming" },
            { key: "completed", label: "Completed" },
            { key: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-primary-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings */}
        {filtered.length > 0 ? (
          <div className="grid gap-4">
            {filtered.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                userType="customer"
                onAction={handleAction}
                isProcessing={processingPayment}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-4">📋</p>
            <h3 className="text-lg font-semibold text-gray-900">
              No bookings found
            </h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              {activeTab === "all"
                ? "You haven't made any bookings yet"
                : `No ${activeTab} bookings found`}
            </p>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline"
            >
              Browse Services <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Booking"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to cancel this booking? Please provide a
            reason to help us improve.
          </p>
          <textarea
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-hidden transition-all resize-none"
            placeholder="e.g. Found another provider, Schedule conflict..."
            rows="4"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
          ></textarea>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              disabled={cancelling}
            >
              Keep Booking
            </button>
            <button
              onClick={handleConfirmCancel}
              disabled={cancelling || !cancellationReason.trim()}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {cancelling ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {showReviewModal && selectedBookingForReview && (
        <ReviewModal
          bookingId={selectedBookingForReview._id}
          providerName={selectedBookingForReview.providerId?.name || "Provider"}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedBookingForReview(null);
          }}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;
