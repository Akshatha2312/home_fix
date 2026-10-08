import { useState, useEffect, useCallback } from "react";
import {
  Star,
  TrendingUp,
  IndianRupee,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader,
  AlertCircle,
  Clock,
  Bell,
  User,
  ShieldCheck,
  Calendar,
  MapPin,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import BookingCard from "../components/common/BookingCard";
import Modal from "../components/common/Modal";
import toast from "react-hot-toast";
import { bookingsAPI, providerAPI } from "../services/api";
import { useSocket } from "../context/socket";
import { getGreeting } from "../utils/greeting";

const ProviderDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [isOnline, setIsOnline] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedBookingForReply, setSelectedBookingForReply] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [bookingsResponse, profileResponse] = await Promise.all([
        bookingsAPI.getProviderBookings(),
        providerAPI.getProfile(),
      ]);

      if (bookingsResponse?.success) {
        setBookings(bookingsResponse.bookings);
      }

      if (profileResponse?.success) {
        setIsOnline(profileResponse.provider.availability);
        setProviderProfile(profileResponse.provider);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleToggleOnline = async () => {
    try {
      const response = await providerAPI.toggleAvailability();
      if (response?.success) {
        setIsOnline(response.data.availability);
        toast.success(
          response.data.availability
            ? "You are now online & visible to customers"
            : "You are now offline",
        );
      }
    } catch (error) {
      console.error("Error toggling availability:", error);
      toast.error("Failed to update availability status");
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on("new-booking", (data) => {
        toast.success(data.message || "New booking request received!");
        setBookings((prev) => [data.booking, ...prev]);
      });

      socket.on("booking-cancelled", (data) => {
        toast.error(data.message || "A booking was cancelled");
        setBookings((prev) =>
          prev.map((b) =>
            b._id === data.booking._id ? { ...b, status: "cancelled" } : b,
          ),
        );
      });

      return () => {
        socket.off("new-booking");
        socket.off("booking-cancelled");
      };
    }
  }, [socket]);

  const handleAction = async (action, data) => {
    if (action === "replyReview") {
      setSelectedBookingForReply(data);
      setReplyText("");
      setShowReplyModal(true);
      return;
    }

    let statusUpdate = "";
    if (action === "accepted") {
      statusUpdate = "accepted";
    } else if (action === "rejected") {
      statusUpdate = "rejected";
    }

    if (!statusUpdate) return;

    try {
      await bookingsAPI.updateStatus(data, statusUpdate);
      setBookings((prev) =>
        prev.map((b) =>
          b._id === data ? { ...b, status: statusUpdate } : b,
        ),
      );
      toast.success(`Booking ${statusUpdate} successfully`);
    } catch (err) {
      console.error("Failed to update booking:", err);
      toast.error(err.message || "Failed to update booking status");
    }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      toast.error("Please enter a response to the review.");
      return;
    }

    try {
      setSubmittingReply(true);
      const res = await bookingsAPI.replyToReview(selectedBookingForReply._id, replyText);
      if (res.success) {
        toast.success("Response posted to review!");
        setBookings((prev) =>
          prev.map((b) => (b._id === selectedBookingForReply._id ? res.booking : b)),
        );
        setShowReplyModal(false);
        setSelectedBookingForReply(null);
        setReplyText("");
      }
    } catch (err) {
      console.error("Failed to post reply:", err);
      toast.error(err.message || "Failed to post review response");
    } finally {
      setSubmittingReply(false);
    }
  };

  const newRequests = bookings.filter((b) => b.status === "pending");
  const upcoming = bookings.filter((b) => b.status === "accepted");
  const completed = bookings.filter((b) => b.status === "completed");

  const totalEarnings = completed.reduce(
    (sum, b) => sum + (b.estimatedCost || 0),
    0,
  );

  const stats = [
    {
      label: "Total Earnings",
      value: `₹${totalEarnings.toLocaleString()}`,
      icon: IndianRupee,
      bgColor: "bg-emerald-50 text-[#16A34A]",
    },
    {
      label: "Pending Requests",
      value: newRequests.length,
      icon: Clock,
      bgColor: "bg-amber-50 text-[#F59E0B]",
    },
    {
      label: "Upcoming Jobs",
      value: upcoming.length,
      icon: Bell,
      bgColor: "bg-teal-50 text-[#0F766E]",
    },
    {
      label: "Completed Jobs",
      value: completed.length,
      icon: CheckCircle2,
      bgColor: "bg-slate-100 text-[#0F2747]",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-[#0F766E] animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading provider workspace...</p>
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
            onClick={fetchDashboardData}
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
      <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-10 py-6">
        {/* 1 & 9. PROVIDER HEADER & ONLINE TOGGLE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              Provider Workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F2747] mt-2 tracking-tight">
              {getGreeting()}, {user?.name?.split(" ")[0] || "Partner"}!
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Here is what's happening with your HomeFix bookings today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleOnline}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer border ${
                isOnline
                  ? "bg-emerald-50 text-[#16A34A] border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {isOnline ? (
                <>
                  <div className="w-2.5 h-2.5 bg-[#16A34A] rounded-full animate-ping"></div>
                  <span>● Online (Visible to Customers)</span>
                </>
              ) : (
                <>
                  <div className="w-2.5 h-2.5 bg-slate-400 rounded-full"></div>
                  <span>○ Offline (Hidden from Search)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. STATISTICS SECTION */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 flex items-center gap-3 hover:border-teal-200 transition-all"
            >
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bgColor}`}
              >
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </p>
                <p className="text-xl sm:text-2xl font-black text-[#0F2747]">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 13. TWO-COLUMN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT COLUMN: REQUESTS & SCHEDULE */}
          <div className="lg:col-span-2 space-y-8">
            {/* 4. NEW BOOKING REQUESTS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-base font-extrabold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#F59E0B] rounded-full animate-pulse"></span>
                  New Booking Requests ({newRequests.length})
                </h2>
                {newRequests.length > 0 && (
                  <span className="text-xs font-bold text-[#F59E0B] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80">
                    Action Required
                  </span>
                )}
              </div>

              {newRequests.length > 0 ? (
                <div className="space-y-4">
                  {newRequests.map((booking) => (
                    <BookingCard
                      key={booking._id}
                      booking={booking}
                      userType="provider"
                      onAction={handleAction}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 bg-slate-50 rounded-2xl border border-slate-200/70">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400 shadow-2xs">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F2747] mb-1">
                    No Pending Requests
                  </h3>
                  <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                    New customer booking requests will appear here in real time.
                  </p>
                </div>
              )}
            </div>

            {/* 5. UPCOMING JOBS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-base font-extrabold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#0F766E]" /> Upcoming Schedule ({upcoming.length})
                </h2>
              </div>

              {upcoming.length > 0 ? (
                <div className="space-y-4">
                  {upcoming.map((booking) => (
                    <BookingCard
                      key={booking._id}
                      booking={booking}
                      userType="provider"
                      onAction={handleAction}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 bg-slate-50 rounded-2xl border border-slate-200/70">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400 shadow-2xs">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F2747] mb-1">
                    No Upcoming Jobs
                  </h3>
                  <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                    Accepted bookings scheduled for future dates will show here.
                  </p>
                </div>
              )}
            </div>

            {/* 12. COMPLETED JOBS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-base font-extrabold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" /> Completed Jobs ({completed.length})
                </h2>
              </div>

              {completed.length > 0 ? (
                <div className="space-y-4">
                  {completed.map((booking) => (
                    <BookingCard
                      key={booking._id}
                      booking={booking}
                      userType="provider"
                      onAction={handleAction}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 bg-slate-50 rounded-2xl border border-slate-200/70">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400 shadow-2xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F2747] mb-1">
                    No Completed Jobs Yet
                  </h3>
                  <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                    Jobs marked as completed will be recorded here for your earnings history.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: PROVIDER PROFILE SUMMARY */}
          <div className="space-y-6">
            {/* 2. PROVIDER PROFILE SUMMARY */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center gap-3.5 mb-4 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F766E] font-black text-lg flex items-center justify-center border border-teal-100 shrink-0">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    (user?.name?.[0] || "P").toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-[#0F2747] text-base leading-tight flex items-center gap-1.5">
                    {user?.name || "Partner"}
                    {providerProfile?.isVerified && (
                      <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
                    )}
                  </h3>
                  <p className="text-xs font-bold text-[#0F766E] uppercase tracking-wider mt-0.5">
                    {providerProfile?.serviceType || user?.serviceType || "Service"} Partner
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs font-semibold text-slate-600">
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400">Rating</span>
                  <div className="flex items-center gap-1 font-extrabold text-[#0F2747]">
                    <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                    <span>{providerProfile?.rating ? providerProfile.rating.toFixed(1) : (user?.rating || "5.0")}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400">Experience</span>
                  <span className="font-bold text-[#0F2747]">
                    {providerProfile?.experience || user?.experience || 1} Years
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400">Location</span>
                  <span className="font-bold text-[#0F2747]">
                    {providerProfile?.location?.area || "Bangalore"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROVIDER REVIEW REPLY MODAL */}
      {showReplyModal && selectedBookingForReply && (
        <Modal
          isOpen={showReplyModal}
          onClose={() => {
            setShowReplyModal(false);
            setSelectedBookingForReply(null);
          }}
          title="Respond to Customer Review"
        >
          <div className="space-y-4">
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/80 text-xs">
              <span className="font-bold text-amber-900 block mb-1">
                Customer Rating: {selectedBookingForReply.rating} ★
              </span>
              <p className="text-slate-700 italic">
                "{selectedBookingForReply.review || "No review text"}"
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Your Public Response
              </label>
              <textarea
                rows={3}
                placeholder="Thank the customer or address their feedback professionally..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0F766E] outline-none text-xs sm:text-sm font-medium resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowReplyModal(false);
                  setSelectedBookingForReply(null);
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                disabled={submittingReply}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReply}
                disabled={submittingReply || !replyText.trim()}
                className="px-5 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
              >
                {submittingReply ? (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Response"
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProviderDashboard;
