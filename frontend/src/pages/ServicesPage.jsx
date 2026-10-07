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
  const initialSearch = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
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

  // Sync searchQuery with URL params
  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  // Calculate active filters count
  const activeFiltersCount = [
    Boolean(selectedType),
    Boolean(searchQuery),
    minRating > 0,
    maxPrice < 2000,
    statusFilter !== "all",
    verifiedOnly,
  ].filter(Boolean).length;

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

  // Reset page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedType,
    searchQuery,
    minRating,
    maxPrice,
    sortBy,
    statusFilter,
    verifiedOnly,
  ]);

  // Reset sort if logged out and on favorites
  useEffect(() => {
    if (!isAuthenticated && sortBy === "favorites") {
      setSortBy("rating");
    }
  }, [isAuthenticated, sortBy]);

  // Reset all filters helper
  const handleResetFilters = () => {
    setSearchParams({});
    setSearchQuery("");
    setMinRating(0);
    setMaxPrice(2000);
    setSortBy("rating");
    setStatusFilter("all");
    setVerifiedOnly(false);
  };

  // Fetch Providers with Filters & Search
  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        const sortMap = {
          rating_desc: "rating",
          price_asc: "price_low",
          price_desc: "price_high",
          experience_desc: "experience",
          favorites: "favorites",
        };

        const params = {
          page: currentPage,
          limit: 9,
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
          q: searchQuery || undefined,
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
    searchQuery,
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
    <div className="container mx-auto px-4 py-8 font-sans text-gray-800 max-w-7xl">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                {activeFiltersCount > 0 && (
                  <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Providers
              </label>
              <input
                type="text"
                placeholder="Search by name or area..."
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  const newParams = new URLSearchParams(searchParams);
                  if (val) {
                    newParams.set("search", val);
                  } else {
                    newParams.delete("search");
                  }
                  setSearchParams(newParams);
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>

            {/* Service Type */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Service Category
              </label>
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => {
                    const newParams = new URLSearchParams(searchParams);
                    if (e.target.value) {
                      newParams.set("type", e.target.value);
                    } else {
                      newParams.delete("type");
                    }
                    setSearchParams(newParams);
                  }}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
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
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
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
              <div className="flex justify-between text-xs text-gray-400 mt-1.5 font-medium">
                <span>₹300</span>
                <span>₹2000</span>
              </div>
            </div>

            {/* Min Rating */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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

            {/* Availability Status Filter */}
            <div className="mb-6 border-t border-gray-100 pt-5">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Availability Status
              </label>
              <div className="flex flex-col gap-2">
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
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all duration-200 ${
                      statusFilter === status.id
                        ? "border-primary bg-blue-50/50 text-primary font-semibold shadow-xs"
                        : "border-gray-100 bg-white text-gray-600 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <status.icon className={`w-4 h-4 ${status.color}`} />
                      <span className="text-sm font-medium">{status.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Verified Filter */}
            <div className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100/50">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">
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
                  <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </div>
              </label>
            </div>
          </div>
        </aside>

        {/* Main Listing */}
        <main className="flex-1 min-w-0">
          {/* Header & Sorting */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Available Providers{" "}
                <span className="text-gray-500 text-lg font-normal">
                  ({totalProviders})
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-sm text-gray-600 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  if (e.target.value === "favorites" && !isAuthenticated) {
                    toast.error("Please login to view your favorites");
                    return;
                  }
                  setSortBy(e.target.value);
                }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-xs"
              >
                <option value="rating_desc">Highest Rated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="experience_desc">Most Experienced</option>
                <option value="favorites">My Favorites</option>
              </select>
            </div>
          </div>

          {/* Active Filter Pills */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-white rounded-xl border border-gray-100 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">
                Active:
              </span>
              {selectedType && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                  Category: {services.find((s) => s.id === selectedType)?.name || selectedType}
                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.delete("type");
                      setSearchParams(newParams);
                    }}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.delete("search");
                      setSearchQuery("");
                      setSearchParams(newParams);
                    }}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {minRating > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                  Rating: {minRating}★+
                  <button onClick={() => setMinRating(0)} className="hover:text-blue-900">
                    ×
                  </button>
                </span>
              )}
              {maxPrice < 2000 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                  Max: ₹{maxPrice}/hr
                  <button onClick={() => setMaxPrice(2000)} className="hover:text-blue-900">
                    ×
                  </button>
                </span>
              )}
              {statusFilter !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100 capitalize">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter("all")} className="hover:text-blue-900">
                    ×
                  </button>
                </span>
              )}
              {verifiedOnly && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                  Verified Only
                  <button onClick={() => setVerifiedOnly(false)} className="hover:text-blue-900">
                    ×
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Provider Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
              ? [...Array(6)].map((_, i) => (
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
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs my-6">
              <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                🔍
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                No Providers Found
              </h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                We couldn't find any service providers matching your exact search and filter criteria.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition shadow-md"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Touch-Friendly Responsive Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-10 flex justify-center">
              <nav className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
                >
                  Previous
                </button>

                {[...Array(totalPages)].map((_, i) => {
                  const pageNumber = i + 1;
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
                        className={`min-w-[40px] h-10 rounded-xl text-sm font-semibold transition ${
                          currentPage === pageNumber
                            ? "bg-primary text-white shadow-md"
                            : "border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-xs"
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
                      <span key={pageNumber} className="px-2 text-gray-400 font-bold">
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
                  className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ServicesPage;
