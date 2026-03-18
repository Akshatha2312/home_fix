/**
 * AdminDashboard Component
 * Displays key metrics, recent bookings, and revenue charts.
 * Features real-time updates via Socket.io for new bookings and status changes.
 */
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Activity,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../context/socket";
import toast from "react-hot-toast";
import MonthlyRevenueChart from "../../components/admin/MonthlyRevenueChart";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const StatCard = ({ title, value, icon, color }) => {
  const Icon = icon;
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold mt-1 text-gray-800">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color.bg} ${color.text}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { socket } = useSocket();

  // Pagination for All Bookings
  const [allBookings, setAllBookings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tableLoading, setTableLoading] = useState(false);

  // Fetch Dashboard Stats
  const fetchStats = useCallback(async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const { data } = await axios.get(`${API_URL}/admin/dashboard`, config);
      if (data.success) {
        setStats(data.stats);
        setRecentBookings(data.recentBookings);
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch All Bookings (Paginated)
  const fetchAllBookings = useCallback(
    async (page) => {
      try {
        setTableLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        const { data } = await axios.get(
          `${API_URL}/admin/bookings?page=${page}&limit=5`,
          config,
        );
        if (data.success) {
          setAllBookings(data.bookings);
          setCurrentPage(data.currentPage);
          setTotalPages(data.totalPages);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setTableLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchStats();
    fetchAllBookings(1);
  }, [fetchStats, fetchAllBookings]);

  // Socket.io Real-time Updates
  // Listens for 'new-booking' and 'booking-updated' events to update the UI instantly without refresh.
  useEffect(() => {
    if (!socket) return;

    const handleNewBooking = (data) => {
      toast.success(`New Booking: ${data.booking.serviceType}`);
      // Update stats locally
      setStats((prev) => ({
        ...prev,
        totalBookings: (prev?.totalBookings || 0) + 1,
      }));

      // Update Recent Bookings
      setRecentBookings((prev) => {
        const newBooking = {
          ...data.booking,
        };
        const updated = [newBooking, ...prev];
        return updated.slice(0, 5); // Keep only 5
      });

      // Refresh table if on page 1
      if (currentPage === 1) {
        fetchAllBookings(1);
      }
    };

    const handleBookingUpdated = (data) => {
      // toast.success(`Booking Updated: ${data.message}`); // Optional toast

      // Update Recent Bookings if present
      setRecentBookings((prev) => {
        return prev.map((b) =>
          b._id === data.booking._id ? { ...b, ...data.booking } : b,
        );
      });

      // Update All Bookings List (if present in current view)
      setAllBookings((prev) => {
        return prev.map((b) =>
          b._id === data.booking._id ? { ...b, ...data.booking } : b,
        );
      });
    };

    socket.on("new-booking", handleNewBooking);
    socket.on("booking-updated", handleBookingUpdated);

    return () => {
      socket.off("new-booking", handleNewBooking);
      socket.off("booking-updated", handleBookingUpdated);
    };
  }, [socket, currentPage, fetchAllBookings]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchAllBookings(newPage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">
          Welcome back to the admin control panel.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={Users}
          color={{ bg: "bg-blue-100", text: "text-blue-600" }}
        />
        <StatCard
          title="Total Providers"
          value={stats?.totalProviders || 0}
          icon={Briefcase}
          color={{ bg: "bg-purple-100", text: "text-purple-600" }}
        />
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          icon={Calendar}
          color={{ bg: "bg-orange-100", text: "text-orange-600" }}
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats?.totalRevenue?.toLocaleString() || 0}`}
          icon={DollarSign}
          color={{ bg: "bg-green-100", text: "text-green-600" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-gray-400 w-5 h-5" />
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              Recent Bookings
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2" />
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-sm">
                  <th className="pb-3 font-medium pl-2">Customer</th>
                  <th className="pb-3 font-medium">Service</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right pr-2">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <tr
                      key={booking._id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 pl-2 font-medium text-gray-800">
                        {booking.customerId?.name || "Unknown"}
                      </td>
                      <td className="py-3 text-gray-600">
                        {booking.serviceType}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                          ${
                            booking.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : booking.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : booking.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-3 text-right pr-2 font-medium text-gray-800">
                        ₹{booking.estimatedCost}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-400">
                      No recent bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            Monthly Revenue
          </h2>
          <div className="flex-1 flex items-center justify-center">
            {stats?.monthlyRevenue ? (
              <MonthlyRevenueChart data={stats.monthlyRevenue} />
            ) : (
              <p className="text-gray-400">No revenue data available</p>
            )}
          </div>
        </div>
      </div>

      {/* All Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">All Bookings</h2>
          {/* Could add search filter here later */}
        </div>

        {tableLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-sm bg-gray-50/50">
                    <th className="py-3 pl-4 font-medium rounded-l-lg">ID</th>
                    <th className="py-3 font-medium">Customer</th>
                    <th className="py-3 font-medium">Provider</th>
                    <th className="py-3 font-medium">Service</th>
                    <th className="py-3 font-medium">Date</th>
                    <th className="py-3 font-medium">Status</th>
                    <th className="py-3 font-medium text-right pr-4 rounded-r-lg">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {allBookings.length > 0 ? (
                    allBookings.map((booking) => (
                      <tr
                        key={booking._id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 pl-4 text-gray-500 font-mono text-xs">
                          #{booking._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3 font-medium text-gray-800">
                          {booking.customerId?.name || "Unknown"}
                          <div className="text-xs text-gray-500 font-normal">
                            {booking.customerId?.email}
                          </div>
                        </td>
                        <td className="py-3 text-gray-600">
                          {booking.providerId?.name || "Pending"}
                        </td>
                        <td className="py-3 text-gray-600">
                          <span className="capitalize">
                            {booking.serviceType}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">
                          {new Date(booking.bookingDate).toLocaleDateString()}
                          <div className="text-xs">{booking.bookingTime}</div>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                          ${
                            booking.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : booking.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : booking.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                          }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-3 text-right pr-4 font-medium text-gray-800">
                          ₹{booking.estimatedCost}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="py-12 text-center text-gray-400"
                      >
                        No bookings found in the system.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-6 border-t border-gray-100 pt-4">
              <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
