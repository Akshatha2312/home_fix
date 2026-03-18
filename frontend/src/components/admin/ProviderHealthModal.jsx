import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  X,
  TrendingUp,
  Calendar,
  Users,
  Star,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useAuth } from "../../hooks/useAuth";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ProviderHealthModal = ({ isOpen, onClose, provider }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartView, setChartView] = useState("daily"); // daily, weekly, monthly
  const { token } = useAuth();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get(
        `${API_URL}/admin/providers/${provider._id}/stats`,
        config,
      );

      if (data.success) {
        setStats(data);
      } else {
        setError("Failed to load stats");
      }
    } catch (err) {
      console.error("Error fetching provider stats:", err);
      setError(err.response?.data?.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, [provider, token]);

  useEffect(() => {
    if (isOpen && provider?._id) {
      fetchStats();
    } else {
      setStats(null); // Reset when closed or changing provider
    }
  }, [isOpen, provider, fetchStats]);

  if (!isOpen) return null;

  // Chart Configuration
  const getChartData = () => {
    if (!stats) return { labels: [], datasets: [] };
    const dataPoints = stats.stats[chartView] || [];

    return {
      labels: dataPoints.map((d) => d.label),
      datasets: [
        {
          label: "Earnings (₹)",
          data: dataPoints.map((d) => d.earning),
          borderColor: "rgb(79, 70, 229)", // Indigo-600
          backgroundColor: "rgba(79, 70, 229, 0.5)",
          tension: 0.3,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              Provider Health Card
            </h2>
            <p className="text-sm text-gray-500">
              Detailed performance analytics for{" "}
              <span className="font-semibold text-gray-700">
                {provider?.name}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              Loading Performance Data...
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10 bg-red-50 rounded-lg border border-red-100">
              <p className="font-semibold">Error Loading Data</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={fetchStats}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Retry
              </button>
            </div>
          ) : !stats ? (
            <div className="text-center py-10 text-gray-500">
              No data available
            </div>
          ) : (
            <div className="space-y-8">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-xl text-white shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-indigo-100 text-sm font-medium">
                      Total Revenue
                    </p>
                    <div className="p-2 bg-white/20 rounded-lg">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold">
                    ₹{stats.stats.totalEarnings.toLocaleString()}
                  </h3>
                  <p className="text-xs text-indigo-100 mt-1">
                    Lifetime earnings
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 text-sm font-medium">
                      Total Jobs
                    </p>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Briefcase className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {stats.totalJobs}
                  </h3>
                  <p className="text-xs text-green-500 mt-1 font-medium flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" /> Completed
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 text-sm font-medium">
                      Average Rating
                    </p>
                    <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                      <Star className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-1">
                    {provider.rating.toFixed(1)}{" "}
                    <span className="text-sm text-gray-400 font-normal">
                      / 5.0
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {provider.totalReviews} reviews
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 text-sm font-medium">
                      Recent Customers
                    </p>
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex -space-x-2 mt-2">
                    {stats.recentCustomers.length > 0 ? (
                      stats.recentCustomers.slice(0, 5).map((u, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden"
                          title={u.name}
                        >
                          {u.image ? (
                            <img
                              src={u.image}
                              alt={u.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            u.name.charAt(0)
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">
                        No recent customers
                      </p>
                    )}
                    {stats.recentCustomers.length > 5 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                        +{stats.recentCustomers.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Earnings Chart Section */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" /> Earnings
                    Analytics
                  </h3>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    {["daily", "weekly", "monthly"].map((view) => (
                      <button
                        key={view}
                        onClick={() => setChartView(view)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                          chartView === view
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        } capitalize`}
                      >
                        {view}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[300px]">
                  {chartView === "monthly" ? (
                    <Bar data={getChartData()} options={chartOptions} />
                  ) : (
                    <Line data={getChartData()} options={chartOptions} />
                  )}
                </div>
              </div>

              {/* Reviews Section */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" /> Recent Reviews
                </h3>

                {stats.reviews.length > 0 ? (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {stats.reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border-b border-gray-50 last:border-0 pb-4 last:pb-0"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-gray-800 text-sm">
                            {review.customerName}
                          </p>
                          <span className="text-xs text-gray-400">
                            {new Date(review.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex text-yellow-500 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < review.rating ? "fill-current" : "text-gray-200"}`}
                            />
                          ))}
                        </div>
                        <p className="text-gray-600 text-sm italic">
                          "{review.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    No reviews available for this provider yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderHealthModal;
