import { useState, useEffect, useCallback } from "react";
import {
  Star,
  TrendingUp,
  IndianRupee,
  CheckCircle,
  Eye,
  EyeOff,
  Loader,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import BookingCard from "../components/common/BookingCard";
import toast from "react-hot-toast";
import { bookingsAPI, providerAPI } from "../services/api";
import { useSocket } from "../context/socket";

const ProviderDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [isOnline, setIsOnline] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // ... socket effect ...

  const handleToggleOnline = async () => {
    try {
      const response = await providerAPI.toggleAvailability();
      if (response?.success) {
        setIsOnline(response.data.availability);
        toast.success(
          response.data.availability
            ? "You are now online"
            : "You are now offline",
        );
      }
    } catch (error) {
      console.error("Error toggling availability:", error);
      toast.error("Failed to update status");
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on("new-booking", (data) => {
        toast.success(data.message);
        setBookings((prev) => [data.booking, ...prev]);
        // Also play a sound if possible? For now, just toast.
      });

      socket.on("booking-cancelled", (data) => {
        toast.error(data.message);
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

  const handleAction = async (action, bookingId) => {
    let statusUpdate = "";
    if (action === "accepted") {
      statusUpdate = "accepted";
    } else if (action === "rejected") {
      statusUpdate = "rejected";
    }

    if (!statusUpdate) return;

    try {
      // If it's a rejection, we might want to use the cancel endpoint or status update.
      // The controller has updateBookingStatus which takes any status.
      // Let's use updateStatus.
      await bookingsAPI.updateStatus(bookingId, statusUpdate);

      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, status: statusUpdate } : b,
        ),
      );
      toast.success(`Booking ${statusUpdate}`);
    } catch (err) {
      console.error("Failed to update booking:", err);
      toast.error(err.message || "Failed to update booking");
    }
  };

  const newRequests = bookings.filter((b) => b.status === "pending");
  const upcoming = bookings.filter((b) => b.status === "accepted");
  const completed = bookings.filter((b) => b.status === "completed");

  // Calculate total earnings from completed bookings
  // Note: estimatedCost is used as a proxy for actual cost often in these simple apps
  const totalEarnings = completed.reduce(
    (sum, b) => sum + (b.estimatedCost || 0),
    0,
  );

  const stats = [
    {
      label: "Total Earnings",
      value: `₹${totalEarnings.toLocaleString()}`,
      icon: IndianRupee,
      color: "from-green-500 to-emerald-600",
    },
    {
      label: "Completed Jobs",
      value: completed.length,
      icon: CheckCircle,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Avg Rating",
      value: user?.rating || "New", // specific to provider user object usually
      icon: Star,
      color: "from-yellow-500 to-orange-500",
    },
    {
      label: "Total Bookings",
      value: bookings.length,
      icon: TrendingUp,
      color: "from-purple-500 to-indigo-600",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-gray-500">Loading your dashboard...</p>
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
            onClick={fetchDashboardData}
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
              Provider Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back, {user?.name?.split(" ")[0] || "Provider"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleOnline}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isOnline
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-gray-50 text-gray-700 border border-gray-200"
              }`}
            >
              {isOnline ? (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Online</span>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Offline</span>
                </>
              )}
            </button>
          </div>
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* New Requests */}
          <div className="lg:col-span-2 space-y-6">
            {newRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                  New Requests ({newRequests.length})
                </h2>
                <div className="space-y-3">
                  {newRequests.map((booking) => (
                    <BookingCard
                      key={booking._id}
                      booking={booking}
                      userType="provider"
                      onAction={handleAction}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Upcoming Schedule
              </h2>
              {upcoming.length > 0 ? (
                <div className="space-y-3">
                  {upcoming.map((booking) => (
                    <BookingCard
                      key={booking._id}
                      booking={booking}
                      userType="provider"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                  <p className="text-3xl mb-2">📅</p>
                  <p className="text-sm text-gray-500">No upcoming bookings</p>
                </div>
              )}
            </div>

            {/* Completed */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Recent Completions
              </h2>
              {completed.length > 0 ? (
                <div className="space-y-3">
                  {completed.map((booking) => (
                    <BookingCard
                      key={booking._id}
                      booking={booking}
                      userType="provider"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                  <p className="text-3xl mb-2">✅</p>
                  <p className="text-sm text-gray-500">No completed jobs yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pro Status Card */}
            <div className="bg-linear-to-br from-primary-600 to-secondary-600 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-bold text-lg mb-1">Pro Status</h3>
              <p className="text-sm text-blue-100 mb-4">
                You are currently {isOnline ? "visible" : "hidden"} to
                customers.
              </p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Response Rate</span>
                  <span className="font-semibold">95%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2"
                    style={{ width: "95%" }}
                  ></div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Completion Rate</span>
                  <span className="font-semibold">98%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2"
                    style={{ width: "98%" }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">This Week</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Jobs completed</span>
                  <span className="text-sm font-bold text-gray-900">
                    {completed.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Revenue</span>
                  <span className="text-sm font-bold text-green-600">
                    ₹{totalEarnings.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">New reviews</span>
                  <span className="text-sm font-bold text-gray-900">
                    {completed.filter((b) => b.rating).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Avg. rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-gray-900">
                      {user?.rating || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
