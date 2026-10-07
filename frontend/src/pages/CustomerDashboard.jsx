import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  Bell,
  CheckCircle2,
  Loader,
  AlertCircle,
  Wrench,
  Zap,
  Droplets,
  Paintbrush,
  Hammer,
  MapPin,
  Star,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import BookingCard from "../components/common/BookingCard";
import Modal from "../components/common/Modal";
import ReviewModal from "../components/common/ReviewModal";
import toast from "react-hot-toast";
import { bookingsAPI, paymentsAPI } from "../services/api";
import { useSocket } from "../context/socket";
import { loadRazorpay } from "../utils/loadRazorpay";
import { SERVICE_TYPES } from "../config/constants";

const SERVICE_ICONS = {
  plumber: Wrench,
  electrician: Zap,
  cleaner: Droplets,
  painter: Paintbrush,
  mason: Hammer,
  carpenter: Hammer,
};

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
              <div className="w-2.5 h-2.5 bg-[#16A34A] rounded-full animate-ping"></div>
              <span className="text-xs font-semibold text-[#0F2747]">
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

      const { order, keyId, booking } = await paymentsAPI.createOrder({
        bookingId,
      });

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "HomeFix",
        description: `Payment for ${booking.serviceType} Service`,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await paymentsAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              toast.success("Payment Successful!");
              fetchBookings();
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
          color: "#0F766E",
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(false);
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

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
    fetchBookings();
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

  // Identify next upcoming booking (accepted or pending)
  const nextAppointment = bookings.find(
    (b) => b.status === "accepted" || b.status === "pending",
  );

  const stats = [
    {
      label: "Total Bookings",
      value: bookings.length,
      icon: Calendar,
      bgColor: "bg-slate-100 text-[#0F2747]",
    },
    {
      label: "Completed",
      value: bookings.filter((b) => b.status === "completed").length,
      icon: CheckCircle2,
      bgColor: "bg-emerald-50 text-[#16A34A]",
    },
    {
      label: "Pending",
      value: bookings.filter((b) => b.status === "pending").length,
      icon: Clock,
      bgColor: "bg-amber-50 text-[#F59E0B]",
    },
    {
      label: "Upcoming",
      value: bookings.filter((b) => b.status === "accepted").length,
      icon: Bell,
      bgColor: "bg-teal-50 text-[#0F766E]",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-[#0F766E] animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading control center...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-24 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-2xs border border-red-100 max-w-md">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#DC2626]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#0F2747] mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button
            onClick={fetchBookings}
            className="px-6 py-2.5 bg-[#0F766E] text-white font-bold text-sm rounded-xl hover:bg-[#0B5F59] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 text-[#172033] font-sans pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 1. DASHBOARD HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              Customer Control Center
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F2747] mt-2 tracking-tight">
              Welcome back, {user?.name?.split(" ")[0] || "Customer"}!
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Here is the real-time overview of your HomeFix service requests and history.
            </p>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#0F766E] hover:bg-[#0B5F59] text-white text-sm font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Book a Service
          </Link>
        </div>

        {/* 2. STATISTICS SECTION */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 flex items-center gap-4 hover:border-teal-200 transition-all"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bgColor}`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </p>
                <p className="text-2xl sm:text-3xl font-black text-[#0F2747]">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 11. TWO-COLUMN LAYOUT AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 items-start">
          {/* LEFT: NEXT APPOINTMENT & MY BOOKINGS */}
          <div className="lg:col-span-2 space-y-8">
            {/* 3. NEXT / UPCOMING APPOINTMENT SECTION */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-base font-extrabold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#0F766E]" /> Next Appointment
                </h2>
                {nextAppointment && (
                  <span className="text-xs font-bold text-[#0F766E] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100 capitalize">
                    {nextAppointment.status}
                  </span>
                )}
              </div>

              {nextAppointment ? (
                <div className="bg-slate-50 rounded-2xl border border-slate-200/70 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200/60">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-white text-[#0F766E] font-extrabold text-lg flex items-center justify-center border border-slate-200 shadow-2xs">
                        {nextAppointment.providerId?.profileImage ? (
                          <img
                            src={nextAppointment.providerId.profileImage}
                            alt="Provider"
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        ) : (
                          (nextAppointment.providerId?.name?.[0] || "P").toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-[#0F2747] text-lg leading-tight">
                          {nextAppointment.providerId?.name || "Assigned Provider"}
                        </h3>
                        <p className="text-xs font-bold text-[#0F766E] uppercase tracking-wider mt-0.5">
                          {nextAppointment.serviceType} Service
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                        Cost
                      </span>
                      <span className="text-xl font-black text-[#0F2747]">
                        ₹{nextAppointment.estimatedCost || 0}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-semibold text-slate-600 mb-4">
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200/60">
                      <Calendar className="w-4 h-4 text-[#0F766E] shrink-0" />
                      <span>
                        {new Date(nextAppointment.bookingDate).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200/60">
                      <Clock className="w-4 h-4 text-[#0F766E] shrink-0" />
                      <span>{nextAppointment.bookingTime}</span>
                    </div>
                    {nextAppointment.address?.area && (
                      <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200/60 col-span-1 sm:col-span-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {nextAppointment.address.street
                            ? `${nextAppointment.address.street}, `
                            : ""}
                          {nextAppointment.address.area},{" "}
                          {nextAppointment.address.city || "Bangalore"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 4. BOOKING STATUS TIMELINE */}
                  <div className="pt-3 border-t border-slate-200/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Booking Lifecycle Progress
                    </span>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <div className="flex items-center gap-1.5 text-[#0F766E]">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0F766E]"></div>
                        <span>Requested</span>
                      </div>
                      <div
                        className={`h-0.5 flex-1 mx-2 ${
                          nextAppointment.status === "accepted" ||
                          nextAppointment.status === "completed"
                            ? "bg-[#0F766E]"
                            : "bg-slate-300"
                        }`}
                      ></div>
                      <div
                        className={`flex items-center gap-1.5 ${
                          nextAppointment.status === "accepted" ||
                          nextAppointment.status === "completed"
                            ? "text-[#0F766E]"
                            : "text-slate-400"
                        }`}
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            nextAppointment.status === "accepted" ||
                            nextAppointment.status === "completed"
                              ? "bg-[#0F766E]"
                              : "bg-slate-300"
                          }`}
                        ></div>
                        <span>Confirmed</span>
                      </div>
                      <div
                        className={`h-0.5 flex-1 mx-2 ${
                          nextAppointment.status === "completed"
                            ? "bg-[#16A34A]"
                            : "bg-slate-300"
                        }`}
                      ></div>
                      <div
                        className={`flex items-center gap-1.5 ${
                          nextAppointment.status === "completed"
                            ? "text-[#16A34A]"
                            : "text-slate-400"
                        }`}
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            nextAppointment.status === "completed"
                              ? "bg-[#16A34A]"
                              : "bg-slate-300"
                          }`}
                        ></div>
                        <span>Completed</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200/70">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-[#0F766E] shadow-2xs">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F2747] mb-1">
                    No Upcoming Services
                  </h3>
                  <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mb-4">
                    Need help with plumbing, electrical, or cleaning? Book a top-rated professional.
                  </p>
                  <Link
                    to="/services"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0F766E] text-white text-xs font-bold rounded-xl hover:bg-[#0B5F59] transition-all"
                  >
                    <span>Browse Services</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* 5. MY BOOKINGS SECTION & TABS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0F2747]">
                    My Bookings
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Filter and track all past and current service requests ({bookings.length} total)
                  </p>
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { key: "all", label: "All" },
                    { key: "pending", label: "Pending" },
                    { key: "accepted", label: "Upcoming" },
                    { key: "completed", label: "Completed" },
                    { key: "cancelled", label: "Cancelled" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === tab.key
                          ? "bg-[#0F766E] text-white shadow-2xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. BOOKING CARDS LIST */}
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
                /* 8. EMPTY STATE */
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200/70">
                  <div className="w-14 h-14 bg-white text-[#0F766E] rounded-full flex items-center justify-center mx-auto mb-3 shadow-2xs text-2xl font-bold">
                    📋
                  </div>
                  <h3 className="text-lg font-bold text-[#0F2747] mb-1">
                    No Bookings Found
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto font-semibold mb-5">
                    {activeTab === "all"
                      ? "You haven't requested any home services yet."
                      : `No ${activeTab} bookings found.`}
                  </p>
                  <Link
                    to="/services"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F766E] hover:bg-[#0B5F59] text-white text-xs font-bold rounded-xl transition shadow-md"
                  >
                    <span>Explore Services</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR: QUICK DISCOVERY & SUPPORT */}
          <div className="space-y-6">
            {/* 9. QUICK SERVICE DISCOVERY */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F2747] mb-3 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-[#0F766E]" /> Book Your Next Service
              </h3>
              <div className="space-y-2">
                {SERVICE_TYPES.map((cat) => {
                  const Icon = SERVICE_ICONS[cat.id] || Wrench;
                  return (
                    <Link
                      key={cat.id}
                      to={`/services?type=${cat.id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-100 hover:border-teal-200 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white text-[#0F766E] flex items-center justify-center shadow-2xs">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-[#0F2747] group-hover:text-[#0F766E] transition-colors">
                          {cat.name}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* HomeFix Guarantee Summary Card */}
            <div className="bg-gradient-to-br from-[#0F2747] to-[#0A1D35] text-white p-5 rounded-2xl shadow-md border border-slate-800">
              <div className="flex items-center gap-2 mb-2 text-teal-300">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-extrabold uppercase tracking-wider">
                  HomeFix Trust Promise
                </span>
              </div>
              <h4 className="font-extrabold text-base mb-1">Punctual & Transparent</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                All listed service partners are background-checked. You pay directly after job completion.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CANCELLATION MODAL */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Booking"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 font-medium">
            Are you sure you want to cancel this booking request? Please provide a reason to help us improve.
          </p>
          <textarea
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 outline-none transition-all text-xs sm:text-sm font-medium resize-none"
            placeholder="e.g. Schedule conflict, Found another provider..."
            rows="3"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
          ></textarea>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-xs font-bold cursor-pointer"
              disabled={cancelling}
            >
              Keep Booking
            </button>
            <button
              onClick={handleConfirmCancel}
              disabled={cancelling || !cancellationReason.trim()}
              className="px-4 py-2 bg-[#DC2626] text-white hover:bg-red-700 rounded-xl transition-colors text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {cancelling ? (
                <>
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* REVIEW MODAL */}
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
