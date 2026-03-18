import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Check,
  Wrench,
  Zap,
  Droplets, // For Cleaning
  Paintbrush, // For Painting (optional if needed)
  Hammer, // For Masonry
  ArrowRight,
  Shield,
  Clock,
  IndianRupee, // For Pricing
} from "lucide-react";
import heroImage from "../assets/hero_illustration.png";
import { SERVICE_TYPES as LOCAL_SERVICE_TYPES } from "../config/constants";
import { servicesAPI, bookingsAPI } from "../services/api";
import useDebounce from "../hooks/useDebounce";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../context/socket";

// Map service IDs to Lucide icons to match the HTML's visual style better than emojis
const SERVICE_ICONS = {
  plumber: Wrench,
  electrician: Zap,
  cleaner: Droplets,
  painter: Paintbrush,
  mason: Hammer,
  carpenter: Hammer, // Using Hammer for now, could be specific
};

const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

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
        // Find the latest accepted/pending booking
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

  // Fetch top-rated provider for non-logged-in users
  useEffect(() => {
    const fetchTopProvider = async () => {
      if (isAuthenticated && user?.userType === "customer") return;
      try {
        // Fetch providers from any service type, sorted by rating
        const response = await servicesAPI.getByType("plumber", {
          sort: "rating",
        });
        if (response?.success && response?.providers?.length > 0) {
          // Pick the top-rated provider
          const best = response.providers.reduce((top, p) =>
            (p.rating || 0) > (top.rating || 0) ? p : top,
          );
          setTopProvider(best);
        }
      } catch (error) {
        console.error("Failed to fetch top provider:", error);
      }
    };
    fetchTopProvider();
  }, [isAuthenticated, user?.userType]);

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
      setTimeout(() => setShowCard1(false), 500); // fade-out duration
    }, 5000);

    const timer2 = setTimeout(() => {
      setCard2Fading(true);
      setTimeout(() => setShowCard2(false), 500);
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [latestBooking, topProvider]); // re-trigger when data changes

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
          // Merge API data with local constants for UI properties (colors, images, etc.)
          const mergedServices = response.services.map((apiService) => {
            const localService = LOCAL_SERVICE_TYPES.find(
              (s) => s.id === apiService.id,
            );
            return {
              ...apiService,
              ...localService, // Keep local UI properties
              // Ensure we have the API data as source of truth for text
              name: apiService.name,
              description: apiService.description,
            };
          });
          setServices(mergedServices);
        }
      } catch (error) {
        console.error("Failed to fetch services:", error);
        // Fallback to local data if API fails to avoid empty UI
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
    <div className="bg-gray-50 text-gray-800 font-sans">
      {/* Hero Section */}
      {/* Hero Section */}
      <header className="bg-gradient-to-b from-blue-50 via-white to-white overflow-hidden relative">
        {/* Background Blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

        <div className="container mx-auto px-4 py-12 md:py-24 lg:py-32 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left Column: Content */}
            <div className="lg:w-1/2 text-center lg:text-left">
              <span className="inline-block bg-blue-50 text-blue-600 text-sm font-bold px-4 py-1.5 rounded-full mb-6 border border-blue-100 shadow-sm">
                👋 #1 Home Service App in Bangalore
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
                Expert Home Services <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                  Delivered Instantly
                </span>
              </h1>

              <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Book verified professionals for cleaning, repair, painting, and
                more. Top-rated service at your doorstep in
                <span className="text-gray-900 font-semibold"> 60 minutes</span>
                .
              </p>

              {/* Search Bar */}
              {/* Search Bar */}
              {(!isAuthenticated || user?.userType === "customer") && (
                <div className="w-full max-w-lg mb-10 mx-auto lg:mx-0 relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-400 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                  <form
                    onSubmit={handleSearch}
                    className="relative flex items-center bg-white rounded-full shadow-xl z-20"
                  >
                    <div className="pl-6 text-gray-400">
                      <Search className="w-6 h-6" />
                    </div>
                    <input
                      type="text"
                      placeholder="What keeps you waiting?"
                      className="w-full px-4 py-4 rounded-full focus:outline-none text-gray-700 placeholder-gray-400 bg-transparent text-base"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (searchQuery.length > 1) setShowDropdown(true);
                      }}
                      onBlur={() => {
                        // Delay hiding dropdown to allow clicking
                        setTimeout(() => setShowDropdown(false), 200);
                      }}
                    />
                    <button
                      type="submit"
                      className="bg-primary text-white px-8 py-3 m-1 rounded-full font-bold hover:bg-blue-600 transition shadow-md hover:shadow-lg shrink-0"
                    >
                      Search
                    </button>
                  </form>

                  {/* Dropdown Results */}
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                      {isSearching ? (
                        <div className="p-4 text-center text-gray-500">
                          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                          Searching...
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div>
                          <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {searchResults.map((provider) => (
                              <Link
                                key={provider._id}
                                to={`/provider/${provider._id}`}
                                className="block p-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0"
                                onClick={() => setShowDropdown(false)}
                              >
                                <div className="flex items-center gap-3">
                                  {provider.profileImage ? (
                                    <img
                                      src={provider.profileImage}
                                      alt={provider.name}
                                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                      {(
                                        provider.name?.[0] || "?"
                                      ).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900">
                                      {provider.name || "Provider"}
                                    </h4>
                                    <p className="text-xs text-gray-500 capitalize">
                                      {provider.serviceType} •{" "}
                                      {provider.location?.area || "Bangalore"}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                          <div
                            className="bg-gray-50 p-3 text-center text-sm font-medium text-primary hover:text-blue-700 cursor-pointer border-t border-gray-100 transition"
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
                          <div className="p-8 text-center text-gray-500">
                            <p>No providers found.</p>
                            <p className="text-xs mt-1">
                              Try searching for "plumber", "electrician"...
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* CTA Buttons & Trust */}
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link
                  to="/services"
                  className="bg-gray-900 text-white px-8 py-3.5 rounded-lg font-bold hover:bg-gray-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 min-w-[200px]"
                >
                  <span>Explore Services</span>
                </Link>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <div className="flex -space-x-2">
                    <img
                      className="w-8 h-8 rounded-full border-2 border-white"
                      src="https://randomuser.me/api/portraits/women/65.jpg"
                      alt="User"
                    />
                    <img
                      className="w-8 h-8 rounded-full border-2 border-white"
                      src="https://randomuser.me/api/portraits/men/32.jpg"
                      alt="User"
                    />
                    <img
                      className="w-8 h-8 rounded-full border-2 border-white"
                      src="https://randomuser.me/api/portraits/women/24.jpg"
                      alt="User"
                    />
                  </div>
                  <span>4.8/5 from 10k+ users</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Image */}
            <div className="lg:w-1/2 relative lg:h-[600px] flex items-center justify-center">
              <div className="relative w-full max-w-lg lg:max-w-none">
                <div className="absolute top-0 right-0 -mr-4 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

                <img
                  src={heroImage}
                  alt="Home Services Illustration"
                  className="relative w-full h-auto drop-shadow-2xl hover:scale-105 transition duration-500 ease-in-out transform rounded-2xl"
                />

                {/* Floating Card 1 - Booking Confirmed */}
                {showCard1 && (
                  <div
                    className={`absolute top-10 left-0 md:-left-10 bg-white p-4 rounded-xl shadow-lg animate-bounce-slow max-w-45 transition-opacity duration-500 ${
                      card1Fading ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg text-green-600">
                        <Check className="w-6 h-6" />
                      </div>
                      <div>
                        {isAuthenticated &&
                        user?.userType === "customer" &&
                        latestBooking ? (
                          <>
                            <p className="text-xs text-gray-500 font-bold">
                              {latestBooking.status === "accepted"
                                ? "Booking Confirmed"
                                : latestBooking.status === "pending"
                                  ? "Booking Pending"
                                  : "Booking Updated"}
                            </p>
                            <p className="text-xs text-gray-400 capitalize">
                              {latestBooking.serviceType || "Service"}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-gray-500 font-bold">
                              Booking Confirmed
                            </p>
                            <p className="text-xs text-gray-400">Just now</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Floating Card 2 - Provider Arriving / Top Provider */}
                {showCard2 && (
                  <div
                    className={`absolute bottom-10 right-0 md:-right-4 bg-white p-4 rounded-xl shadow-lg animate-bounce-slow animation-delay-2000 max-w-50 transition-opacity duration-500 ${
                      card2Fading ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
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
                            <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
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
                          <img
                            src="https://randomuser.me/api/portraits/men/85.jpg"
                            alt="Provider"
                          />
                        )}
                      </div>
                      <div>
                        {isAuthenticated &&
                        user?.userType === "customer" &&
                        latestBooking?.status === "accepted" ? (
                          <>
                            <p className="text-xs text-gray-500 font-bold">
                              {latestBooking.providerId?.name || "Provider"} is
                              arriving
                            </p>
                            <p className="text-xs text-green-500 font-semibold">
                              On Time •{" "}
                              {latestBooking.providerId?.rating || "New"} ★
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-gray-500 font-bold">
                              {topProvider?.name || "Top Provider"} is available
                            </p>
                            <p className="text-xs text-green-500 font-semibold">
                              Top Rated • {topProvider?.rating || "5.0"} ★
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

      {/* Popular Services */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular Services
            </h2>
            <p className="text-gray-600">
              Choose from our most demanded services
            </p>
          </div>

          <div
            id="services-grid"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {loading
              ? // Loading Skeleton
                [...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center animate-pulse"
                  >
                    <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                ))
              : services.map((service) => {
                  const Icon = SERVICE_ICONS[service.id] || Wrench;
                  return (
                    <Link
                      key={service.id}
                      to={`/services?type=${service.id}`}
                      className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center hover:shadow-md transition cursor-pointer"
                    >
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-primary">
                        <Icon className="w-8 h-8" />
                      </div>
                      <h3 className="font-semibold text-lg mb-1">
                        {service.name}
                      </h3>
                      <p className="text-gray-500 text-sm">45+ Providers</p>
                    </Link>
                  );
                })}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/services"
              className="inline-flex items-center text-primary font-semibold hover:underline"
            >
              View All Services
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="w-16 h-16 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-4 text-secondary">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Verified Professionals
              </h3>
              <p className="text-gray-600">
                Every provider is vetted and background checked for your safety.
              </p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 mx-auto bg-yellow-50 rounded-full flex items-center justify-center mb-4 text-accent">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">On-Time Service</h3>
              <p className="text-gray-600">
                We value your time. Our professionals arrive exactly when
                scheduled.
              </p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 mx-auto bg-purple-50 rounded-full flex items-center justify-center mb-4 text-purple-600">
                <IndianRupee className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Transparent Pricing
              </h3>
              <p className="text-gray-600">
                Upfront pricing with no hidden charges. Pay only after service.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
