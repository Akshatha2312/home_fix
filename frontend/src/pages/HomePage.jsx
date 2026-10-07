import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Check,
  Wrench,
  Zap,
  Droplets,
  Paintbrush,
  Hammer,
  ArrowRight,
  Shield,
  Clock,
  IndianRupee,
  Star,
  MapPin,
  Calendar,
  CheckCircle2,
  Sparkles,
  Award,
  ChevronRight,
  Users,
} from "lucide-react";
import heroImage from "../assets/hero_illustration.png";
import { SERVICE_TYPES as LOCAL_SERVICE_TYPES } from "../config/constants";
import { servicesAPI, bookingsAPI } from "../services/api";
import useDebounce from "../hooks/useDebounce";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../context/socket";
import FAQSection from "../components/common/FAQSection";

const SERVICE_ICONS = {
  plumber: Wrench,
  electrician: Zap,
  cleaner: Droplets,
  painter: Paintbrush,
  mason: Hammer,
  carpenter: Hammer,
};

const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Top providers state
  const [topProviders, setTopProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  // debounced search
  const debouncedSearchTerm = useDebounce(searchQuery, 500);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Real-time hero cards state
  const [latestBooking, setLatestBooking] = useState(null);
  const [topProvider, setTopProvider] = useState(null);
  const [showCard1, setShowCard1] = useState(true);
  const [showCard2, setShowCard2] = useState(true);
  const [card1Fading, setCard1Fading] = useState(false);
  const [card2Fading, setCard2Fading] = useState(false);
  const isMobileRef = useRef(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      isMobileRef.current = window.innerWidth < 640;
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch latest active booking for logged-in customers
  const fetchLatestBooking = useCallback(async () => {
    if (!isAuthenticated || user?.userType !== "customer") return;
    try {
      const response = await bookingsAPI.getCustomerBookings();
      if (response?.success && response.bookings?.length > 0) {
        const activeBooking = response.bookings.find(
          (b) => b.status === "accepted" || b.status === "pending",
        );
        if (activeBooking) {
          setLatestBooking(activeBooking);
        }
      }
    } catch (error) {
      console.error("Failed to fetch latest booking:", error);
    }
  }, [isAuthenticated, user?.userType]);

  // Fetch top-rated providers for featured providers section & hero card
  useEffect(() => {
    const fetchTopProviders = async () => {
      try {
        setLoadingProviders(true);
        // Query plumber & electrician service types to gather real providers
        const [plumberRes, electricianRes] = await Promise.allSettled([
          servicesAPI.getByType("plumber", { sort: "rating" }),
          servicesAPI.getByType("electrician", { sort: "rating" }),
        ]);

        let combined = [];
        if (plumberRes.status === "fulfilled" && plumberRes.value?.success) {
          combined = combined.concat(plumberRes.value.providers || []);
        }
        if (electricianRes.status === "fulfilled" && electricianRes.value?.success) {
          combined = combined.concat(electricianRes.value.providers || []);
        }

        // Deduplicate by _id
        const uniqueProviders = Array.from(
          new Map(combined.map((p) => [p._id, p])).values(),
        );

        if (uniqueProviders.length > 0) {
          // Sort by rating descending
          uniqueProviders.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          setTopProviders(uniqueProviders.slice(0, 4));
          setTopProvider(uniqueProviders[0]);
        }
      } catch (error) {
        console.error("Failed to fetch top providers:", error);
      } finally {
        setLoadingProviders(false);
      }
    };
    fetchTopProviders();
  }, []);

  // Fetch latest booking on mount
  useEffect(() => {
    fetchLatestBooking();
  }, [fetchLatestBooking]);

  // Socket listeners for real-time booking updates
  useEffect(() => {
    if (!socket || !isAuthenticated || user?.userType !== "customer") return;

    const handleBookingAccepted = (data) => {
      if (data?.booking) {
        setLatestBooking(data.booking);
        setShowCard1(true);
        setShowCard2(true);
        setCard1Fading(false);
        setCard2Fading(false);
      }
    };

    const handleBookingUpdated = (data) => {
      if (data?.booking) {
        setLatestBooking(data.booking);
        setShowCard1(true);
        setShowCard2(true);
        setCard1Fading(false);
        setCard2Fading(false);
      }
    };

    socket.on("booking-accepted", handleBookingAccepted);
    socket.on("booking-updated", handleBookingUpdated);

    return () => {
      socket.off("booking-accepted", handleBookingAccepted);
      socket.off("booking-updated", handleBookingUpdated);
    };
  }, [socket, isAuthenticated, user?.userType]);

  // Auto-hide cards on mobile after 5 seconds
  useEffect(() => {
    if (!isMobileRef.current) return;

    const timer1 = setTimeout(() => {
      setCard1Fading(true);
      setTimeout(() => setShowCard1(false), 500);
    }, 5000);

    const timer2 = setTimeout(() => {
      setCard2Fading(true);
      setTimeout(() => setShowCard2(false), 500);
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [latestBooking, topProvider]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (debouncedSearchTerm.length > 1) {
        setIsSearching(true);
        setShowDropdown(true);
        try {
          const response = await servicesAPI.search(debouncedSearchTerm);
          if (response.success) {
            setSearchResults(response.providers);
          }
        } catch (error) {
          console.error("Search failed:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    };

    fetchSearchResults();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await servicesAPI.getAll();
        if (response.success) {
          const mergedServices = response.services.map((apiService) => {
            const localService = LOCAL_SERVICE_TYPES.find(
              (s) => s.id === apiService.id,
            );
            return {
              ...apiService,
              ...localService,
              name: apiService.name,
              description: apiService.description,
            };
          });
          setServices(mergedServices);
        }
      } catch (error) {
        console.error("Failed to fetch services:", error);
        setServices(LOCAL_SERVICE_TYPES);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="bg-[#F8FAFC] text-[#172033] font-sans">
      {/* 1. HERO SECTION */}
      <header className="bg-gradient-to-b from-slate-100/90 via-slate-50 to-[#F8FAFC] overflow-hidden relative border-b border-slate-100">
        {/* Subtle Background Blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-teal-100/60 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 bg-amber-100/50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none"></div>

        <div className="container mx-auto px-4 py-12 md:py-20 lg:py-24 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left Column: Content */}
            <div className="lg:w-1/2 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 bg-teal-50 text-[#0F766E] text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full mb-6 border border-teal-100 shadow-2xs">
                <Sparkles className="w-4 h-4 text-[#0F766E]" /> #1 Verified Home Service Platform in Bangalore
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#0F2747] mb-6 leading-[1.15] tracking-tight">
                Expert Home Services <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0F2747] via-[#0F766E] to-[#0F766E]">
                  Delivered Instantly
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Book verified professionals for cleaning, repair, painting, and
                more. Top-rated service at your doorstep in
                <span className="text-[#0F2747] font-bold"> 60 minutes</span>.
              </p>

              {/* Search Bar */}
              {(!isAuthenticated || user?.userType === "customer") && (
                <div className="w-full max-w-lg mb-8 mx-auto lg:mx-0 relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#0F2747] to-[#0F766E] rounded-full blur-xs opacity-20 group-hover:opacity-35 transition duration-200"></div>
                  <form
                    onSubmit={handleSearch}
                    className="relative flex items-center bg-white rounded-full shadow-lg z-20 border border-slate-200/80 p-1.5"
                  >
                    <div className="pl-4 text-slate-400 shrink-0">
                      <Search className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="What service do you need today?"
                      className="w-full px-3 py-3 rounded-full focus:outline-none text-[#172033] placeholder-slate-400 bg-transparent text-sm sm:text-base font-medium"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (searchQuery.length > 1) setShowDropdown(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowDropdown(false), 200);
                      }}
                    />
                    <button
                      type="submit"
                      className="bg-[#0F766E] hover:bg-[#0B5F59] text-white px-7 py-3 rounded-full font-bold text-sm sm:text-base transition-colors shadow-md shrink-0 cursor-pointer"
                    >
                      Search
                    </button>
                  </form>

                  {/* Dropdown Results */}
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-30">
                      {isSearching ? (
                        <div className="p-4 text-center text-slate-500">
                          <div className="animate-spin h-5 w-5 border-2 border-[#0F766E] border-t-transparent rounded-full mx-auto mb-2"></div>
                          Searching providers...
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div>
                          <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {searchResults.map((provider) => (
                              <Link
                                key={provider._id}
                                to={`/provider/${provider._id}`}
                                className="block p-3 hover:bg-slate-50 transition border-b border-slate-50 last:border-0"
                                onClick={() => setShowDropdown(false)}
                              >
                                <div className="flex items-center gap-3">
                                  {provider.profileImage ? (
                                    <img
                                      src={provider.profileImage}
                                      alt={provider.name}
                                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-[#0F766E] font-bold text-sm">
                                      {(
                                        provider.name?.[0] || "?"
                                      ).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="text-sm font-semibold text-[#172033]">
                                      {provider.name || "Provider"}
                                    </h4>
                                    <p className="text-xs text-slate-500 capitalize">
                                      {provider.serviceType} •{" "}
                                      {provider.location?.area || "Bangalore"}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                          <div
                            className="bg-slate-50 p-3 text-center text-sm font-semibold text-[#0F766E] hover:text-[#0B5F59] cursor-pointer border-t border-slate-100 transition"
                            onClick={() => {
                              navigate(
                                `/services?search=${encodeURIComponent(
                                  searchQuery,
                                )}`,
                              );
                              setShowDropdown(false);
                            }}
                          >
                            See all results for "{searchQuery}"
                          </div>
                        </div>
                      ) : (
                        searchQuery.length > 1 && (
                          <div className="p-6 text-center text-slate-500">
                            <p className="text-sm font-medium">No providers found.</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Try searching for "plumber", "electrician", or "cleaning"
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Supporting Trust Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-3 gap-x-6 text-xs sm:text-sm font-semibold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                  <span>Verified Professionals</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                  <span>Transparent Upfront Pricing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                  <span>Instant Schedule Confirmation</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Image */}
            <div className="lg:w-1/2 relative flex items-center justify-center">
              <div className="relative w-full max-w-lg lg:max-w-none">
                <div className="absolute top-0 right-0 -mr-4 w-72 h-72 bg-amber-100/60 rounded-full mix-blend-multiply filter blur-2xl opacity-40"></div>

                <img
                  src={heroImage}
                  alt="Home Services Illustration"
                  className="relative w-full h-auto drop-shadow-xl hover:scale-[1.02] transition duration-500 ease-in-out transform rounded-2xl"
                />

                {/* Floating Card 1 - Booking Status */}
                {showCard1 && (
                  <div
                    className={`absolute top-6 left-0 md:-left-6 bg-white p-3.5 rounded-xl shadow-xl border border-slate-100 max-w-xs transition-opacity duration-500 ${
                      card1Fading ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-50 p-2 rounded-lg text-[#16A34A] shrink-0">
                        <Check className="w-5 h-5" />
                      </div>
                      <div>
                        {isAuthenticated &&
                        user?.userType === "customer" &&
                        latestBooking ? (
                          <>
                            <p className="text-xs text-[#0F2747] font-bold">
                              {latestBooking.status === "accepted"
                                ? "Booking Confirmed"
                                : latestBooking.status === "pending"
                                  ? "Booking Pending"
                                  : "Booking Updated"}
                            </p>
                            <p className="text-xs text-slate-500 capitalize font-medium">
                              {latestBooking.serviceType || "Service"}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-[#0F2747] font-bold">
                              Booking Confirmed
                            </p>
                            <p className="text-xs text-slate-500 font-medium">Just now in Indiranagar</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Floating Card 2 - Provider Info */}
                {showCard2 && (
                  <div
                    className={`absolute bottom-6 right-0 md:-right-4 bg-white p-3.5 rounded-xl shadow-xl border border-slate-100 max-w-xs transition-opacity duration-500 ${
                      card2Fading ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-50 overflow-hidden shrink-0 border border-teal-100">
                        {isAuthenticated &&
                        user?.userType === "customer" &&
                        latestBooking?.status === "accepted" ? (
                          latestBooking.providerId?.profileImage ? (
                            <img
                              src={latestBooking.providerId.profileImage}
                              alt="Provider"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-teal-50 flex items-center justify-center text-[#0F766E] font-bold text-xs">
                              {(
                                latestBooking.providerId?.name?.[0] || "P"
                              ).toUpperCase()}
                            </div>
                          )
                        ) : topProvider?.profileImage ? (
                          <img
                            src={topProvider.profileImage}
                            alt="Provider"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-teal-50 flex items-center justify-center text-[#0F766E] font-bold text-xs">
                            HP
                          </div>
                        )}
                      </div>
                      <div>
                        {isAuthenticated &&
                        user?.userType === "customer" &&
                        latestBooking?.status === "accepted" ? (
                          <>
                            <p className="text-xs text-[#0F2747] font-bold">
                              {latestBooking.providerId?.name || "Provider"} is assigned
                            </p>
                            <p className="text-xs text-[#16A34A] font-semibold">
                              On Time • {latestBooking.providerId?.rating || "5.0"} ★
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-[#0F2747] font-bold">
                              {topProvider?.name || "Top Verified Partner"}
                            </p>
                            <p className="text-xs text-[#16A34A] font-semibold flex items-center gap-1">
                              <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                              {topProvider?.rating || "4.9"} • Available Now
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. POPULAR SERVICES SECTION */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                Explore Categories
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2747] mt-3 tracking-tight">
                Popular Services
              </h2>
              <p className="text-slate-600 text-base mt-1">
                Choose from our most demanded professional home services
              </p>
            </div>
            <Link
              to="/services"
              className="hidden md:inline-flex items-center gap-2 text-sm font-bold text-[#0F766E] hover:text-[#0B5F59] transition-colors"
            >
              <span>View All Services</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div
            id="services-grid"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {loading
              ? [...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 rounded-2xl p-6 flex flex-col items-center animate-pulse border border-slate-100"
                  >
                    <div className="w-16 h-16 bg-slate-200 rounded-2xl mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-28 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-20"></div>
                  </div>
                ))
              : services.map((service) => {
                  const Icon = SERVICE_ICONS[service.id] || Wrench;
                  return (
                    <Link
                      key={service.id}
                      to={`/services?type=${service.id}`}
                      className="group bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-start hover:border-teal-200 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="w-14 h-14 bg-teal-50 border border-teal-100/80 rounded-2xl flex items-center justify-center mb-5 text-[#0F766E] group-hover:bg-[#0F766E] group-hover:text-white transition-all duration-300 shadow-2xs">
                        <Icon className="w-7 h-7" />
                      </div>
                      <h3 className="font-bold text-xl mb-1.5 text-[#0F2747] group-hover:text-[#0F766E] transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2">
                        {service.description || "Top rated, vetted professionals ready to assist."}
                      </p>
                      <div className="mt-auto pt-4 border-t border-slate-100 w-full flex items-center justify-between text-xs font-semibold text-[#0F766E]">
                        <span>Explore Service</span>
                        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
          </div>

          <div className="text-center mt-10 md:hidden">
            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-teal-50 text-[#0F766E] border border-teal-100 rounded-xl font-bold text-sm"
            >
              <span>View All Services</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. TOP / FEATURED PROVIDERS SECTION */}
      <section className="py-20 bg-[#F8FAFC] border-b border-slate-200/60">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                Verified Partners
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2747] mt-3 tracking-tight">
                Top-Rated Professionals
              </h2>
              <p className="text-slate-600 text-base mt-1">
                Find trusted experts ready to help
              </p>
            </div>
            <Link
              to="/services"
              className="hidden md:inline-flex items-center gap-2 text-sm font-bold text-[#0F766E] hover:text-[#0B5F59] transition-colors"
            >
              <span>View All Professionals →</span>
            </Link>
          </div>

          {loadingProviders ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 animate-pulse flex flex-col gap-4"
                >
                  <div className="h-40 bg-slate-200 rounded-xl w-full"></div>
                  <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : topProviders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topProviders.map((provider) => (
                <div
                  key={provider._id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xl hover:border-teal-200 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Image / Header */}
                    <div className="relative mb-4 rounded-xl overflow-hidden bg-slate-100 h-44 flex items-center justify-center">
                      {provider.profileImage ? (
                        <img
                          src={provider.profileImage}
                          alt={provider.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-teal-50 flex items-center justify-center text-[#0F766E] font-extrabold text-3xl">
                          {(provider.name?.[0] || "P").toUpperCase()}
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-[#0F2747] flex items-center gap-1 shadow-2xs">
                        <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                        <span>{provider.rating ? provider.rating.toFixed(1) : "5.0"}</span>
                        <span className="text-slate-400 font-normal">
                          ({provider.totalReviews || provider.reviewCount || 12})
                        </span>
                      </div>
                      {provider.isVerified !== false && (
                        <div className="absolute top-3 right-3 bg-[#0F766E] text-white p-1 rounded-full shadow-2xs" title="Verified Professional">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <h3 className="font-bold text-lg text-[#0F2747] mb-1 group-hover:text-[#0F766E] transition-colors">
                      {provider.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider mb-3">
                      {provider.serviceType || "Home Service Expert"}
                    </p>

                    <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{provider.location?.area || "Bangalore"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Starting ₹{provider.hourlyRate || 299}/hr</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/provider/${provider._id}`}
                    className="w-full py-2.5 px-4 bg-teal-50 text-[#0F766E] hover:bg-[#0F766E] hover:text-white rounded-xl font-bold text-xs text-center transition-colors border border-teal-100"
                  >
                    View Profile & Book
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 max-w-md mx-auto">
              <p className="text-slate-600 font-medium">Browse our full list of verified professionals.</p>
              <Link
                to="/services"
                className="mt-4 inline-block px-6 py-2.5 bg-[#0F766E] text-white rounded-xl font-bold text-sm"
              >
                Explore Services Page
              </Link>
            </div>
          )}

          <div className="text-center mt-10 md:hidden">
            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-teal-50 text-[#0F766E] border border-teal-100 rounded-xl font-bold text-sm"
            >
              <span>View All Professionals →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. HOW HOMEFIX WORKS */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              Simple 4-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2747] mt-3 tracking-tight">
              How HomeFix Works
            </h2>
            <p className="text-slate-600 text-base mt-2">
              Book professional home services in four seamless steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Desktop Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-16 right-16 h-0.5 bg-slate-200/80 -translate-y-6 z-0"></div>

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#0F766E] border-2 border-teal-100 font-extrabold text-xl flex items-center justify-center mb-4 shadow-sm bg-white">
                01
              </div>
              <h3 className="font-bold text-lg text-[#0F2747] mb-2">Choose a Service</h3>
              <p className="text-slate-600 text-sm leading-relaxed max-w-xs">
                Browse our verified categories and pick the service you need.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#0F766E] border-2 border-teal-100 font-extrabold text-xl flex items-center justify-center mb-4 shadow-sm bg-white">
                02
              </div>
              <h3 className="font-bold text-lg text-[#0F2747] mb-2">Select a Professional</h3>
              <p className="text-slate-600 text-sm leading-relaxed max-w-xs">
                Compare ratings, reviews, experience, and hourly pricing.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#0F766E] border-2 border-teal-100 font-extrabold text-xl flex items-center justify-center mb-4 shadow-sm bg-white">
                03
              </div>
              <h3 className="font-bold text-lg text-[#0F2747] mb-2">Book a Convenient Time</h3>
              <p className="text-slate-600 text-sm leading-relaxed max-w-xs">
                Choose an available date and schedule slot that fits your day.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#0F766E] text-white font-extrabold text-xl flex items-center justify-center mb-4 shadow-md">
                04
              </div>
              <h3 className="font-bold text-lg text-[#0F2747] mb-2">Get the Service Done</h3>
              <p className="text-slate-600 text-sm leading-relaxed max-w-xs">
                Our expert arrives on time, completes the job, and you pay hassle-free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE HOMEFIX */}
      <section className="py-20 bg-[#F8FAFC] border-b border-slate-200/60">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              Why Customers Trust Us
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2747] mt-3 tracking-tight">
              Why Choose HomeFix
            </h2>
            <p className="text-slate-600 text-base mt-2">
              Designed to give you full peace of mind for every home repair and maintenance task
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 text-[#0F766E]">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#0F2747]">
                Verified Professionals
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Every service partner undergoes identity checks, document verification, and skill evaluation before joining our platform.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 text-[#F59E0B]">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#0F2747]">
                Punctual Service
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                We respect your schedule. Our providers are committed to punctual arrivals and efficient service delivery.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 text-[#0F2747]">
                <IndianRupee className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#0F2747]">
                Transparent Pricing
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Know the exact hourly rate up front with zero surprise hidden charges. Pay safely after your job is done.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <FAQSection />

      {/* 10. FINAL CTA SECTION */}
      <section className="py-20 bg-[#0F2747] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#0F766E]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="container mx-auto px-4 text-center relative z-10 max-w-3xl">
          <span className="inline-block bg-white/10 text-teal-300 text-xs font-bold px-4 py-1.5 rounded-full mb-4 border border-white/10 backdrop-blur-md uppercase tracking-wider">
            Ready to get started?
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 tracking-tight leading-tight">
            Need Something Fixed at Home Today?
          </h2>
          <p className="text-slate-300 text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            Find trusted, top-rated local professionals in Bangalore ready to help with your next home service task.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/services"
              className="w-full sm:w-auto px-8 py-4 bg-[#0F766E] hover:bg-[#0B5F59] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-base"
            >
              <span>Explore Services Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
