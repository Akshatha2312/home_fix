import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Globe, GlobeX, Users } from "lucide-react";
import ProviderCard from "../components/common/ProviderCard";
import { SERVICE_TYPES as LOCAL_SERVICE_TYPES } from "../config/constants";
import { servicesAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

const ServicesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const selectedType = searchParams.get("type") || "";

  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProviders, setTotalProviders] = useState(0);

  // Local state for filters
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [sortBy, setSortBy] = useState("rating");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'online', 'offline'
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch Services (Categories)
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await servicesAPI.getAll();
        if (response.success) {
          const mergedServices = response.services.map((apiService) => {
            const localService = LOCAL_SERVICE_TYPES.find(
              (s) => s.id === apiService.id,
            );
            return { ...apiService, ...localService };
          });
          setServices(mergedServices);
        }
      } catch (error) {
        console.error("Failed to fetch services:", error);
      }
    };
    fetchServices();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, minRating, maxPrice, sortBy, statusFilter, verifiedOnly]);

  // Reset sort if logged out and on favorites
  useEffect(() => {
    if (!isAuthenticated && sortBy === "favorites") {
      setSortBy("rating");
    }
  }, [isAuthenticated, sortBy]);

  // Fetch Providers with Filters
  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        // Map frontend sort keys to backend sort keys
        const sortMap = {
          rating_desc: "rating",
          price_asc: "price_low",
          price_desc: "price_high",
          experience_desc: "experience",
          favorites: "favorites",
        };

        const params = {
          page: currentPage,
          limit: 9, // Grid 3x3
          minRating: minRating > 0 ? minRating : undefined,
          maxPrice: maxPrice < 2000 ? maxPrice : undefined,
          sortBy: sortMap[sortBy] || "rating",
          isLoggedIn:
            statusFilter === "all"
              ? undefined
              : statusFilter === "online"
                ? "true"
                : "false",
          isVerified: verifiedOnly ? "true" : undefined,
        };

        const response = await servicesAPI.getByType(
          selectedType || "all",
          params,
        );

        if (response.success) {
          setProviders(response.providers);
          setTotalProviders(response.count);
          if (response.pagination) {
            setTotalPages(response.pagination.totalPages);
          }
        }
      } catch (error) {
        console.error("Failed to fetch providers:", error);
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [
    selectedType,
    minRating,
    maxPrice,
    sortBy,
    statusFilter,
    verifiedOnly,
    currentPage,
    isAuthenticated,
    user?._id,
  ]);

  return (
    <div className="container mx-auto px-4 py-8 font-sans text-gray-800">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Filters</h2>
              <button
                onClick={() => {
                  setSearchParams({});
                  setMinRating(0);
                  setMaxPrice(2000);
                  setSortBy("rating");
                  setStatusFilter("all");
                  setVerifiedOnly(false);
                }}
                className="text-xs text-primary font-medium hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Service Type */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Service
              </label>
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) =>
                    setSearchParams(
                      e.target.value ? { type: e.target.value } : {},
                    )
                  }
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                >
                  <option value="">All Services</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-gray-700">
                  Max Price
                </label>
                <span className="text-sm font-bold text-primary">
                  ₹{maxPrice}/hr
                </span>
              </div>
              <input
                type="range"
                min="300"
                max="2000"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                <span>₹300</span>
                <span>₹2000</span>
              </div>
            </div>

            {/* Min Rating */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Minimum Rating
              </label>
              <div className="space-y-2">
                {[4.5, 4.0, 3.5].map((val) => (
                  <label
                    key={val}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="rating"
                      value={val}
                      checked={minRating === val}
                      onChange={() => setMinRating(val)}
                      className="text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="text-sm text-gray-600">{val} & up</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Provider Status Filter */}
            <div className="mb-8 border-t border-gray-100 pt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Availability Status
              </label>
              <div className="flex flex-col gap-3">
                {[
                  {
                    id: "all",
                    label: "All Providers",
                    icon: Users,
                    color: "text-gray-400",
                  },
                  {
                    id: "online",
                    label: "Online Now",
                    icon: Globe,
                    color: "text-green-500",
                  },
                  {
                    id: "offline",
                    label: "Offline",
                    icon: GlobeX,
                    color: "text-red-500",
                  },
                ].map((status) => (
                  <button
                    key={status.id}
                    onClick={() => setStatusFilter(status.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      statusFilter === status.id
                        ? "border-primary bg-blue-50/50 text-primary shadow-sm"
                        : "border-gray-50 bg-white text-gray-600 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <status.icon className={`w-5 h-5 ${status.color}`} />
                      <span className="text-sm font-semibold">
                        {status.label}
                      </span>
                    </div>
                    {statusFilter === status.id && (
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Best Providers Filter */}
            <div className="mb-8 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100/50">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                    Best Providers Only
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    Verified & Top Rated
                  </span>
                </div>
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                </div>
              </label>
            </div>

            <button
              className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm font-medium"
              onClick={() => {
                // Apply logic if strictly needed, but reactive is formatted fine.
              }}
            >
              Apply Filters
            </button>
          </div>
        </aside>

        {/* Main Listing */}
        <main className="flex-1">
          {/* Header & Sorting */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h1 className="text-2xl font-bold mb-4 sm:mb-0">
              Available Providers{" "}
              <span className="text-gray-500 text-lg font-normal">
                ({totalProviders})
              </span>
            </h1>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  if (e.target.value === "favorites" && !isAuthenticated) {
                    toast.error("Please login to view your favorites");
                    return;
                  }
                  setSortBy(e.target.value);
                }}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="rating_desc">Highest Rated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="experience_desc">Most Experienced</option>
                <option value="favorites">My Favorites</option>
              </select>
            </div>
          </div>

          {/* Provider Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
              ? // Loading Skeleton
                [...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-sm p-6 animate-pulse h-80"
                  >
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))
              : providers.map((provider) => (
                  <ProviderCard key={provider._id} provider={provider} />
                ))}
          </div>

          {!loading && providers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No providers found matching your criteria.
              </p>
            </div>
          )}

          {/* Pagination (Static for now to match HTML) */}
          <div className="mt-8 flex justify-center">
            {totalPages > 1 && (
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {[...Array(totalPages)].map((_, i) => {
                  const pageNumber = i + 1;
                  // Simple logic to show reasonable number of pages, can be improved for large N
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 &&
                      pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-3 py-1 rounded ${
                          currentPage === pageNumber
                            ? "bg-primary text-white"
                            : "border border-gray-300 hover:bg-gray-50 text-gray-600"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return (
                      <span key={pageNumber} className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ServicesPage;
