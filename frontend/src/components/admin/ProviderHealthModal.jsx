import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  TrendingUp,
  Calendar,
  Users,
  Star,
  IndianRupee,
  Briefcase,
  Activity,
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
import { adminAPI } from "../../services/api";

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

const ProviderHealthModal = ({ isOpen, onClose, provider }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartView, setChartView] = useState("daily");

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getProviderStats(provider._id);

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
  }, [provider]);

  useEffect(() => {
    if (isOpen && provider?._id) {
      fetchStats();
    } else {
      setStats(null);
    }
  }, [isOpen, provider, fetchStats]);

  if (!isOpen) return null;

  const getChartData = () => {
    if (!stats) return { labels: [], datasets: [] };
    const dataPoints = stats.stats[chartView] || [];

    return {
      labels: dataPoints.map((d) => d.label),
      datasets: [
        {
          label: "Earnings (₹)",
          data: dataPoints.map((d) => d.earning),
          borderColor: "#0F766E",
          backgroundColor: "rgba(15, 118, 110, 0.2)",
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 border border-slate-200">
        {/* Header */}
        <div className="bg-[#0F2747] text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" /> Provider Health Card
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Performance analytics for{" "}
              <span className="font-bold text-white">
                {provider?.name}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-[#F8FAFC]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 font-semibold">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#0F766E] border-t-transparent mb-4"></div>
              Loading Performance Analytics...
            </div>
          ) : error ? (
            <div className="text-center text-[#DC2626] py-10 bg-red-50 rounded-2xl border border-red-100 font-medium">
              <p className="font-bold text-base">Error Loading Data</p>
              <p className="text-xs mt-1">{error}</p>
              <button
                onClick={fetchStats}
                className="mt-4 px-5 py-2 bg-[#DC2626] text-white rounded-xl font-bold text-xs"
              >
                Retry
              </button>
            </div>
          ) : !stats ? (
            <div className="text-center py-10 text-slate-500 font-medium">
              No performance data available
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-[#0F2747] to-[#0A1D35] p-5 rounded-2xl text-white shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-teal-300 text-xs font-bold uppercase tracking-wider">
                      Total Revenue
                    </p>
                    <div className="p-2 bg-white/10 rounded-xl text-teal-300">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black">
                    ₹{stats.stats.totalEarnings.toLocaleString()}
                  </h3>
                  <p className="text-[11px] text-slate-300 font-semibold mt-1">
                    Lifetime earnings
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                      Total Jobs
                    </p>
                    <div className="p-2 bg-teal-50 text-[#0F766E] rounded-xl">
                      <Briefcase className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-[#0F2747]">
                    {stats.totalJobs}
                  </h3>
                  <p className="text-xs text-[#16A34A] mt-1 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Completed
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                      Average Rating
                    </p>
                    <div className="p-2 bg-amber-50 text-[#F59E0B] rounded-xl">
                      <Star className="w-5 h-5 fill-[#F59E0B]" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-[#0F2747] flex items-center gap-1">
                    {provider.rating.toFixed(1)}{" "}
                    <span className="text-xs text-slate-400 font-normal">
                      / 5.0
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {provider.totalReviews} reviews
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                      Recent Customers
                    </p>
                    <div className="p-2 bg-slate-100 text-[#0F2747] rounded-xl">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex -space-x-2 mt-2">
                    {stats.recentCustomers.length > 0 ? (
                      stats.recentCustomers.slice(0, 5).map((u, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full border-2 border-white bg-teal-50 flex items-center justify-center text-xs font-bold text-[#0F766E] overflow-hidden"
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
                      <p className="text-xs text-slate-400 font-medium">
                        No recent customers
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Earnings Chart Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-100 pb-3">
                  <h3 className="text-base font-extrabold text-[#0F2747] uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#0F766E]" /> Earnings Analytics
                  </h3>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {["daily", "weekly", "monthly"].map((view) => (
                      <button
                        key={view}
                        onClick={() => setChartView(view)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          chartView === view
                            ? "bg-[#0F766E] text-white shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        } capitalize`}
                      >
                        {view}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[280px]">
                  {chartView === "monthly" ? (
                    <Bar data={getChartData()} options={chartOptions} />
                  ) : (
                    <Line data={getChartData()} options={chartOptions} />
                  )}
                </div>
              </div>

              {/* Reviews Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
                <h3 className="text-base font-extrabold text-[#0F2747] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" /> Recent Provider Reviews
                </h3>

                {stats.reviews.length > 0 ? (
                  <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                    {stats.reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border-b border-slate-100 last:border-0 pb-3 last:pb-0"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-[#0F2747] text-xs sm:text-sm">
                            {review.customerName}
                          </p>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {new Date(review.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex text-[#F59E0B] mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < review.rating ? "fill-current" : "text-slate-200"}`}
                            />
                          ))}
                        </div>
                        <p className="text-slate-600 text-xs sm:text-sm font-medium italic">
                          "{review.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl font-medium text-xs">
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
