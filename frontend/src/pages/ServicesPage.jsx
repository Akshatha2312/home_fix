import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Globe, GlobeX, Users, Search, SlidersHorizontal, X, ArrowUpDown, ChevronDown } from "lucide-react";
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

  // Mobile Filter Drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Local state for filters
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [sortBy, setSortBy] = useState("rating_desc");
  const [statusFilter, setStatusFilter] = useState("all");
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
        setServices(LOCAL_SERVICE_TYPES);
      }
    };
    fetchServices();
  }, []);

  // Reset page when filters change
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
      setSortBy("rating_desc");
    }
  }, [isAuthenticated, sortBy]);

  // Reset all filters helper
  const handleResetFilters = () => {
    setSearchParams({});
    setSearchQuery("");
    setMinRating(0);
    setMaxPrice(2000);
    setSortBy("rating_desc");
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

  const handleCategorySelect = (categoryId) => {
    const newParams = new URLSearchParams(searchParams);
    if (categoryId) {
      newParams.set("type", categoryId);
    } else {
      newParams.delete("type");
    }
    setSearchParams(newParams);
  };

  // Reusable Filter Content Component
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category Dropdown */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#0F2747] mb-2">
          Service Category
        </label>
        <div className="relative">
          <select
            value={selectedType}
            onChange={(e) => handleCategorySelect(e.target.value)}
            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#172033] focus:ring-2 focus:ring-[#0F766E] focus:border-transparent outline-none transition"
          >
            <option value="">All Service Categories</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Price Range */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#0F2747]">
            Max Price / Hour
          </label>
          <span className="text-xs font-bold text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
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
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1 font-semibold">
          <span>₹300</span>
          <span>₹2000</span>
        </div>
      </div>

      {/* Min Rating */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#0F2747] mb-2">
          Minimum Rating
        </label>
        <div className="space-y-2">
          {[4.5, 4.0, 3.5].map((val) => (
            <label
              key={val}
              className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-700 hover:text-[#0F766E]"
            >
              <input
                type="radio"
                name="rating"
                value={val}
                checked={minRating === val}
                onChange={() => setMinRating(val)}
                className="text-[#0F766E] focus:ring-[#0F766E] w-4 h-4 accent-[#0F766E]"
              />
              <span>★ {val} & above</span>
            </label>
          ))}
          {minRating > 0 && (
            <button
              onClick={() => setMinRating(0)}
              className="text-xs text-slate-400 hover:text-[#0F766E] underline pt-1"
            >
              Clear rating filter
            </button>
          )}
        </div>
      </div>

      {/* Availability Status Filter */}
      <div className="border-t border-slate-100 pt-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#0F2747] mb-3">
          Real-Time Availability
        </label>
        <div className="flex flex-col gap-2">
          {[
            { id: "all", label: "All Providers", icon: Users, color: "text-slate-400" },
            { id: "online", label: "Online Now", icon: Globe, color: "text-[#16A34A]" },
            { id: "offline", label: "Offline", icon: GlobeX, color: "text-[#DC2626]" },
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => setStatusFilter(status.id)}
              className={`flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs transition-all duration-200 cursor-pointer ${
                statusFilter === status.id
                  ? "border-[#0F766E] bg-teal-50 text-[#0F766E] font-bold shadow-2xs"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <status.icon className={`w-3.5 h-3.5 ${status.color}`} />
                <span>{status.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Verified Filter */}
      <div className="p-3.5 bg-teal-50/70 rounded-xl border border-teal-100">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#0F2747]">
              Verified Providers Only
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Background checked partners
            </span>
          </div>
          <div className="relative inline-flex items-center">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
            />
            <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0F766E]"></div>
          </div>
        </label>
      </div>
    </div>
  );

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-[#172033] font-sans pb-16">
      {/* 1. DISCOVERY HEADER */}
      <header className="bg-white border-b border-slate-200/80 pt-8 pb-6">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="max-w-3xl mb-6">
            <h1 className="text-3xl sm:text-4xl font-black text-[#0F2747] tracking-tight">
              Find the Right Professional for Your Home
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mt-2">
              Browse background-checked local experts by service, rating, pricing, and availability.
            </p>
          </div>

          {/* Search Input Bar */}
          <div className="max-w-2xl relative mb-6">
            <div className="relative flex items-center bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-[#0F766E] focus-within:ring-2 focus-within:ring-[#0F766E]/20 transition-all p-1">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search by provider name or area (e.g., Indiranagar, Koramangala)..."
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
                className="w-full bg-transparent px-3 py-2.5 text-sm sm:text-base text-[#172033] placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete("search");
                    setSearchParams(newParams);
                  }}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 rounded-full mr-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 2. POPULAR SERVICE SHORTCUTS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => handleCategorySelect("")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                !selectedType
                  ? "bg-[#0F766E] text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              All Services
            </button>
            {LOCAL_SERVICE_TYPES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedType === cat.id
                    ? "bg-[#0F766E] text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row gap-8">
          {/* DESKTOP FILTER SIDEBAR */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#0F766E]" />
                  <h2 className="text-sm font-bold text-[#0F2747]">Filters</h2>
                  {activeFiltersCount > 0 && (
                    <span className="bg-[#0F766E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-[#0F766E] font-semibold hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <FilterContent />
            </div>
          </aside>

          {/* MAIN LISTING AREA */}
          <main className="flex-1 min-w-0">
            {/* 3. RESULT HEADER & SORTING */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
              <div className="flex items-center justify-between w-full sm:w-auto">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F2747]">
                  {loading ? (
                    "Loading professionals..."
                  ) : (
                    <>
                      {totalProviders} {totalProviders === 1 ? "Professional" : "Professionals"}{" "}
                      <span className="text-slate-400 font-normal text-base sm:text-lg">Available</span>
                    </>
                  )}
                </h2>

                {/* Mobile Filter Button Trigger */}
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F2747] shadow-2xs"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-[#0F766E] text-white text-[10px] px-1.5 py-0.2 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-500 font-semibold">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    if (e.target.value === "favorites" && !isAuthenticated) {
                      toast.error("Please login to view your favorites");
                      return;
                    }
                    setSortBy(e.target.value);
                  }}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#0F2747] focus:outline-none focus:ring-2 focus:ring-[#0F766E] bg-white shadow-2xs cursor-pointer"
                >
                  <option value="rating_desc">Highest Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="experience_desc">Most Experienced</option>
                  <option value="favorites">My Favorites</option>
                </select>
              </div>
            </div>

            {/* ACTIVE FILTER PILLS */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Active Filters:
                </span>
                {selectedType && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-[#0F766E] text-xs font-bold rounded-full border border-teal-100">
                    Category: {services.find((s) => s.id === selectedType)?.name || selectedType}
                    <button
                      onClick={() => handleCategorySelect("")}
                      className="hover:text-[#0B5F59] font-bold"
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-[#0F766E] text-xs font-bold rounded-full border border-teal-100">
                    "{searchQuery}"
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete("search");
                        setSearchParams(newParams);
                      }}
                      className="hover:text-[#0B5F59] font-bold"
                    >
                      ×
                    </button>
                  </span>
                )}
                {minRating > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-[#0F766E] text-xs font-bold rounded-full border border-teal-100">
                    ★ {minRating}+
                    <button onClick={() => setMinRating(0)} className="hover:text-[#0B5F59] font-bold">
                      ×
                    </button>
                  </span>
                )}
                {maxPrice < 2000 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-[#0F766E] text-xs font-bold rounded-full border border-teal-100">
                    Under ₹{maxPrice}/hr
                    <button onClick={() => setMaxPrice(2000)} className="hover:text-[#0B5F59] font-bold">
                      ×
                    </button>
                  </span>
                )}
                {statusFilter !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-[#0F766E] text-xs font-bold rounded-full border border-teal-100 capitalize">
                    {statusFilter}
                    <button onClick={() => setStatusFilter("all")} className="hover:text-[#0B5F59] font-bold">
                      ×
                    </button>
                  </span>
                )}
                {verifiedOnly && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-[#0F766E] text-xs font-bold rounded-full border border-teal-100">
                    Verified Only
                    <button onClick={() => setVerifiedOnly(false)} className="hover:text-[#0B5F59] font-bold">
                      ×
                    </button>
                  </span>
                )}
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-[#0F766E] font-bold hover:underline ml-auto cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* 6 & 12. PROVIDER GRID & SKELETON LOADING */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading
                ? [...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse flex flex-col justify-between h-72 shadow-2xs"
                    >
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-slate-200 rounded-2xl shrink-0"></div>
                        <div className="flex-1 space-y-2.5 pt-1">
                          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                          <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                        </div>
                      </div>
                      <div className="h-10 bg-slate-200 rounded-xl w-full mt-4"></div>
                    </div>
                  ))
                : providers.map((provider) => (
                    <ProviderCard key={provider._id} provider={provider} />
                  ))}
            </div>

            {/* 11. EMPTY STATE */}
            {!loading && providers.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs my-6">
                <div className="w-16 h-16 bg-teal-50 text-[#0F766E] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  🔍
                </div>
                <h3 className="text-xl font-bold text-[#0F2747] mb-1">
                  No Professionals Found
                </h3>
                <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                  We couldn't find any service providers matching your exact search and filter criteria. Try clearing some filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-3 bg-[#0F766E] hover:bg-[#0B5F59] text-white text-sm font-bold rounded-xl transition shadow-md cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* 10. PAGINATION */}
            {!loading && totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <nav className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
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
                          className={`min-w-[38px] h-9 rounded-xl text-xs font-bold transition ${
                            currentPage === pageNumber
                              ? "bg-[#0F766E] text-white shadow-md"
                              : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs"
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
                        <span key={pageNumber} className="px-1 text-slate-400 font-bold">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 5. MOBILE FILTER DRAWER */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-white">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-[#0F766E]" />
              <h2 className="font-extrabold text-lg text-[#0F2747]">Filter Professionals</h2>
            </div>
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="p-2 hover:bg-slate-200 rounded-full text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <FilterContent />
          </div>

          <div className="p-4 border-t border-slate-200 bg-white flex items-center gap-3">
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="w-1/3 py-3 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Reset
              </button>
            )}
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="flex-1 py-3 bg-[#0F766E] text-white rounded-xl font-bold text-sm shadow-md"
            >
              Apply Filters ({totalProviders})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
