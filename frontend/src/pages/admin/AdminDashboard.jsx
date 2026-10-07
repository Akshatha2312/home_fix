/**
 * AdminDashboard Component
 * Displays key platform metrics, recent bookings, revenue chart, and provider health.
 * Features real-time updates via Socket.io for new bookings and status changes.
 */
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Briefcase,
  Calendar,
  IndianRupee,
  Activity,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../context/socket";
import toast from "react-hot-toast";
import MonthlyRevenueChart from "../../components/admin/MonthlyRevenueChart";
import { adminAPI } from "../../services/api";
import { getGreeting } from "../../utils/greeting";

const StatCard = ({ title, value, icon, color }) => {
  const Icon = icon;
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-teal-200 transition-all">
      <div>
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</h3>
        <p className="text-2xl sm:text-3xl font-black mt-1 text-[#0F2747]">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.bg} ${color.text}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuth();

  // Pagination for All Bookings
  const [allBookings, setAllBookings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tableLoading, setTableLoading] = useState(false);

  // Fetch Dashboard Stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await adminAPI.getDashboard();
      if (data.success) {
        setStats(data.stats);
        setRecentBookings(data.recentBookings);
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch All Bookings (Paginated)
  const fetchAllBookings = useCallback(
    async (page) => {
      try {
        setTableLoading(true);
        const data = await adminAPI.getBookings(page, 5);
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
    [],
  );

  useEffect(() => {
    fetchStats();
    fetchAllBookings(1);
  }, [fetchStats, fetchAllBookings]);

  // Socket.io Real-time Updates
  useEffect(() => {
    if (!socket) return;

    const handleNewBooking = (data) => {
      toast.success(`New Booking: ${data.booking.serviceType}`);
      setStats((prev) => ({
        ...prev,
        totalBookings: (prev?.totalBookings || 0) + 1,
      }));

      setRecentBookings((prev) => {
        const newBooking = { ...data.booking };
        const updated = [newBooking, ...prev];
        return updated.slice(0, 5);
      });

      if (currentPage === 1) {
        fetchAllBookings(1);
      }
    };

    const handleBookingUpdated = (data) => {
      setRecentBookings((prev) => {
        return prev.map((b) =>
          b._id === data.booking._id ? { ...b, ...data.booking } : b,
        );
      });

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#0F766E] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#172033] font-sans">
      {/* 1. ADMIN HEADER */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
            Platform Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F2747] mt-2 tracking-tight">
            {getGreeting()}, Admin!
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Real-time control center overview for customers, providers, and revenue.
          </p>
        </div>

        {/* 6. QUICK ACTIONS */}
        <div className="flex items-center gap-2">
          <Link
            to="/admin/customers"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200"
          >
            Manage Customers
          </Link>
          <Link
            to="/admin/providers"
            className="px-4 py-2.5 bg-[#0F766E] hover:bg-[#0B5F59] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            Manage Providers
          </Link>
        </div>
      </div>

      {/* 2. PLATFORM STATISTICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={Users}
          color={{ bg: "bg-slate-100", text: "text-[#0F2747]" }}
        />
        <StatCard
          title="Total Providers"
          value={stats?.totalProviders || 0}
          icon={Briefcase}
          color={{ bg: "bg-teal-50", text: "text-[#0F766E]" }}
        />
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          icon={Calendar}
          color={{ bg: "bg-amber-50", text: "text-[#F59E0B]" }}
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats?.totalRevenue?.toLocaleString() || 0}`}
          icon={IndianRupee}
          color={{ bg: "bg-emerald-50", text: "text-[#16A34A]" }}
        />
      </div>

      {/* WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RECENT BOOKINGS ACTIVITY */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0F766E]" /> Recent Booking Activity
            </h2>
            <span className="w-2.5 h-2.5 bg-[#16A34A] rounded-full animate-ping"></span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Customer</th>
                  <th className="pb-3">Service</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Amount</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm font-semibold">
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <tr
                      key={booking._id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 pl-2 font-bold text-[#0F2747] whitespace-nowrap">
                        {booking.customerId?.name || "Unknown Customer"}
                      </td>
                      <td className="py-3.5 text-[#0F766E] capitalize font-bold whitespace-nowrap">
                        {booking.serviceType}
                      </td>
                      <td className="py-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize
                          ${
                            booking.status === "completed"
                              ? "bg-emerald-50 text-[#16A34A] border border-emerald-100"
                              : booking.status === "pending"
                                ? "bg-amber-50 text-[#F59E0B] border border-amber-100"
                                : booking.status === "cancelled"
                                  ? "bg-red-50 text-[#DC2626] border border-red-100"
                                  : "bg-teal-50 text-[#0F766E] border border-teal-100"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-2 font-black text-[#0F2747] whitespace-nowrap">
                        ₹{booking.estimatedCost || 0}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 font-medium">
                      No recent bookings logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. MONTHLY REVENUE CHART */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0F766E]" /> Monthly Revenue
            </h2>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[260px]">
            {stats?.monthlyRevenue ? (
              <MonthlyRevenueChart data={stats.monthlyRevenue} />
            ) : (
              <p className="text-slate-400 text-xs font-semibold">No revenue data available</p>
            )}
          </div>
        </div>
      </div>

      {/* ALL BOOKINGS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <h2 className="text-base font-extrabold text-[#0F2747] uppercase tracking-wider">
            All System Bookings
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {tableLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#0F766E] border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 pl-3 font-semibold rounded-l-xl">ID</th>
                    <th className="py-3 font-semibold">Customer</th>
                    <th className="py-3 font-semibold">Provider</th>
                    <th className="py-3 font-semibold">Service</th>
                    <th className="py-3 font-semibold">Date & Time</th>
                    <th className="py-3 font-semibold">Status</th>
                    <th className="py-3 text-right pr-3 font-semibold rounded-r-xl">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm font-semibold">
                  {allBookings.length > 0 ? (
                    allBookings.map((booking) => (
                      <tr
                        key={booking._id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3.5 pl-3 text-slate-400 font-mono text-xs font-bold">
                          #{booking._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3.5 font-bold text-[#0F2747]">
                          {booking.customerId?.name || "Unknown"}
                          <div className="text-xs text-slate-400 font-normal">
                            {booking.customerId?.email}
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-600">
                          {booking.providerId?.name || "Unassigned"}
                        </td>
                        <td className="py-3.5 text-[#0F766E] capitalize font-bold">
                          {booking.serviceType}
                        </td>
                        <td className="py-3.5 text-slate-500 font-medium">
                          {new Date(booking.bookingDate).toLocaleDateString()}
                          <div className="text-xs text-slate-400">{booking.bookingTime}</div>
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize
                          ${
                            booking.status === "completed"
                              ? "bg-emerald-50 text-[#16A34A] border border-emerald-100"
                              : booking.status === "pending"
                                ? "bg-amber-50 text-[#F59E0B] border border-amber-100"
                                : booking.status === "cancelled"
                                  ? "bg-red-50 text-[#DC2626] border border-red-100"
                                  : "bg-teal-50 text-[#0F766E] border border-teal-100"
                          }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right pr-3 font-black text-[#0F2747]">
                          ₹{booking.estimatedCost || 0}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="py-12 text-center text-slate-400 font-medium"
                      >
                        No bookings found in the system.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-6 border-t border-slate-100 pt-4">
              <span className="text-xs text-slate-500 font-semibold">
                Showing Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
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
