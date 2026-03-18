import Admin from "../models/admin.model.js";
import Customer from "../models/customer.model.js";
import Provider from "../models/provider.model.js";
import Booking from "../models/booking.model.js";
import Payment from "../models/payment.model.js";
import mongoose from "mongoose";

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const totalProviders = await Provider.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // Calculate total revenue (sum of all successful payments)
    const payments = await Payment.find({
      status: { $in: ["successful", "captured"] },
    });

    const totalRevenue = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );

    // Calculate monthly revenue for graph (last 6 months)
    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: { $in: ["successful", "captured"] },
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Format monthly data for frontend (ensure all months are present or just return array)
    const formattedMonthlyRevenue = monthlyRevenue.map((item) => ({
      month: new Date(0, item._id.month - 1).toLocaleString("default", {
        month: "short",
      }),
      revenue: item.total,
    }));

    // Get recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customerId", "name")
      .populate("providerId", "name serviceType");

    res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        totalProviders,
        totalBookings,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        monthlyRevenue: formattedMonthlyRevenue,
      },
      recentBookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get All Customers
// @route   GET /api/admin/customers
export const getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const customers = await Customer.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments();

    res.status(200).json({
      success: true,
      customers,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCustomers: total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get All Providers
// @route   GET /api/admin/providers
export const getAllProviders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const providers = await Provider.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Provider.countDocuments();

    res.status(200).json({
      success: true,
      providers,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProviders: total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete User (Customer or Provider)
// @route   DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // Expect 'customer' or 'provider'

    if (!type || (type !== "customer" && type !== "provider")) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user type" });
    }

    let user;
    if (type === "customer") {
      user = await Customer.findById(id);
    } else {
      user = await Provider.findById(id);
    }

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Cascade Delete: Remove related Bookings, Payments
    // Find bookings where user is customer OR provider
    const bookingQuery =
      type === "customer" ? { customerId: id } : { providerId: id };
    const bookings = await Booking.find(bookingQuery);

    const bookingIds = bookings.map((b) => b._id);

    // Delete Payments related to these bookings
    await Payment.deleteMany({ bookingId: { $in: bookingIds } });

    // Delete Bookings
    await Booking.deleteMany(bookingQuery);

    // Finally Delete User
    if (type === "customer") {
      await Customer.findByIdAndDelete(id);
    } else {
      await Provider.findByIdAndDelete(id);
    }

    res.status(200).json({
      success: true,
      message: "User and related data deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Get All Bookings (Paginated)
// @route   GET /api/admin/bookings
export const getAllBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const bookings = await Booking.find()
      .populate("customerId", "name email")
      .populate("providerId", "name email serviceType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments();

    res.status(200).json({
      success: true,
      bookings,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBookings: total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Provider Stats (Earnings, Reviews, Customer Insights)
// @route   GET /api/admin/providers/:id/stats
export const getProviderStats = async (req, res) => {
  try {
    const { id } = req.params;

    const providerId = new mongoose.Types.ObjectId(id);

    // 1. Calculate Total Earnings (Lifetime)
    const totalEarningsResult = await Payment.aggregate([
      {
        $match: {
          providerId: providerId,
          status: { $in: ["successful", "captured"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const totalEarnings =
      totalEarningsResult.length > 0 ? totalEarningsResult[0].total : 0;

    // 2. Daily Stats (Last 7 Days)
    const dailyStats = await Payment.aggregate([
      {
        $match: {
          providerId: providerId,
          status: { $in: ["successful", "captured"] },
          createdAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$createdAt" },
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          total: { $sum: "$amount" },
          date: { $first: "$createdAt" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Fill in missing days with 0
    const formattedDailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
      }); // e.g., "Mon 12"

      const existingStat = dailyStats.find((stat) => {
        const statDate = new Date(stat.date);
        return (
          statDate.getDate() === d.getDate() &&
          statDate.getMonth() === d.getMonth()
        );
      });

      formattedDailyStats.push({
        label: dateString,
        earning: existingStat ? existingStat.total : 0,
      });
    }

    // 3. Weekly Stats (Last 4 Weeks)
    // Simplified logic: Group by week number of the year
    const weeklyStats = await Payment.aggregate([
      {
        $match: {
          providerId: providerId,
          status: { $in: ["successful", "captured"] },
          createdAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 28)), // Last 4 weeks
          },
        },
      },
      {
        $group: {
          _id: { week: { $week: "$createdAt" }, year: { $year: "$createdAt" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    const formattedWeeklyStats = weeklyStats.map((item) => ({
      label: `Week ${item._id.week}`,
      earning: item.total,
    }));

    // 4. Monthly Stats (Last 12 Months)
    const monthlyStats = await Payment.aggregate([
      {
        $match: {
          providerId: providerId,
          status: { $in: ["successful", "captured"] },
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 11)), // Last 12 months
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const formattedMonthlyStats = monthlyStats.map((item) => ({
      label: new Date(item._id.year, item._id.month - 1).toLocaleString(
        "default",
        {
          month: "short",
          year: "2-digit",
        },
      ),
      earning: item.total,
    }));

    // 5. Customer Insights & Reviews (From Bookings)
    // Fetch completed bookings for this provider
    const completedBookings = await Booking.find({
      providerId: providerId,
      status: "completed",
    })
      .populate("customerId", "name email profileImage")
      .sort({ bookingDate: -1 })
      .limit(20); // Last 20 completed jobs

    // Extract reviews
    const reviews = completedBookings
      .filter((b) => b.review && b.rating)
      .map((b) => ({
        id: b._id,
        customerName: b.customerId?.name || "Unknown",
        rating: b.rating,
        comment: b.review,
        date: b.bookingDate,
      }));

    // Unique Customers Logic (for "Customer Insights" summary if needed, or just list)
    // Here we just return the list of unique customers from the last 20 jobs for display
    const uniqueCustomersMap = new Map();
    completedBookings.forEach((b) => {
      if (
        b.customerId &&
        !uniqueCustomersMap.has(b.customerId._id.toString())
      ) {
        uniqueCustomersMap.set(b.customerId._id.toString(), {
          id: b.customerId._id,
          name: b.customerId.name,
          email: b.customerId.email,
          image: b.customerId.profileImage,
        });
      }
    });
    const recentCustomers = Array.from(uniqueCustomersMap.values()).slice(0, 5);

    res.status(200).json({
      success: true,
      stats: {
        totalEarnings,
        daily: formattedDailyStats,
        weekly: formattedWeeklyStats,
        monthly: formattedMonthlyStats,
      },
      reviews,
      recentCustomers,
      totalJobs: completedBookings.length, // Of the fetched ones, or we could count all
    });
  } catch (error) {
    console.error("Error in getProviderStats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
