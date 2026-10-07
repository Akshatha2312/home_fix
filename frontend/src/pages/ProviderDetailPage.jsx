import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Briefcase,
  Star,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Navigation,
  ArrowRight,
  Sparkles,
  Award,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { servicesAPI, bookingsAPI } from "../services/api";
import toast from "react-hot-toast";
import DateSelector from "../components/common/DateSelector";
import TimeSelector from "../components/common/TimeSelector";

const ProviderDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [duration, setDuration] = useState(1);
  const [address, setAddress] = useState({
    street: "",
    area: "",
    city: "Bangalore",
    pincode: "",
    landmark: "",
    coordinates: { lat: null, lng: null },
  });
  const [description, setDescription] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  // Pre-fill address from user profile if available
  useEffect(() => {
    if (user?.address) {
      setAddress((prev) => ({
        ...prev,
        street: user.address.street || "",
        area: user.address.area || "",
        city: user.address.city || "Bangalore",
        pincode: user.address.pincode || "",
        landmark: user.address.landmark || "",
      }));
    }
  }, [user]);

  // Geolocation: Get user's current location and reverse geocode
  const getMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          );
          const data = await response.json();
          const addr = data.address || {};

          setAddress((prev) => ({
            ...prev,
            street:
              addr.road ||
              addr.house_number ||
              addr.neighbourhood ||
              prev.street,
            area:
              addr.suburb || addr.neighbourhood || addr.village || prev.area,
            city: addr.city || addr.town || addr.county || prev.city,
            pincode: addr.postcode || prev.pincode,
            coordinates: { lat: latitude, lng: longitude },
          }));

          toast.success("Location captured successfully!");
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          setAddress((prev) => ({
            ...prev,
            coordinates: { lat: latitude, lng: longitude },
          }));
          toast.success("Location coordinates captured!");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location permission denied. Please allow access.");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            toast.error("Location request timed out.");
            break;
          default:
            toast.error("An unknown error occurred.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // Fetch availability when date or provider changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (provider?._id && bookingDate) {
        try {
          const response = await bookingsAPI.getAvailability(
            provider._id,
            bookingDate,
          );
          if (response.success) {
            setBookedSlots(response.bookedSlots || []);
          }
        } catch (error) {
          console.error("Failed to fetch availability:", error);
        }
      } else {
        setBookedSlots([]);
      }
    };

    fetchAvailability();
  }, [provider, bookingDate]);

  // Fetch provider detail & reviews
  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const response = await servicesAPI.getProvider(id);
        if (response.success) {
          setProvider(response.provider);
          setReviews(response.reviews || []);
        }
      } catch (error) {
        console.error("Failed to fetch provider:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProvider();
  }, [id]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to book a service");
      navigate("/login?type=customer");
      return;
    }

    try {
      setIsBooking(true);
      const bookingData = {
        providerId: provider._id,
        serviceType: provider.serviceType,
        bookingDate,
        bookingTime,
        address,
        problemDescription: description,
        estimatedDuration: duration,
      };

      const response = await bookingsAPI.createBooking(bookingData);

      if (response.success) {
        toast.success(
          "Booking request submitted! The provider will confirm shortly.",
        );
        setBookingDate("");
        setBookingTime("");
        setAddress({
          street: "",
          area: "",
          city: "Bangalore",
          pincode: "",
          landmark: "",
          coordinates: { lat: null, lng: null },
        });
        setDescription("");
        setDuration(1);
        navigate("/customer-dashboard");
      }
    } catch (error) {
      console.error("Booking failed:", error);
      toast.error(error.message || "Failed to submit booking");
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0F766E] border-t-transparent"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-24 flex items-center justify-center">
        <div className="text-center bg-white p-12 rounded-2xl border border-slate-200 shadow-2xs max-w-md">
          <p className="text-5xl mb-4">🔍</p>
          <h2 className="text-xl font-bold text-[#0F2747] mb-2">
            Provider Not Found
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            The requested service provider could not be found or is unavailable.
          </p>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F766E] text-white font-bold text-sm rounded-xl"
          >
            ← Back to All Services
          </Link>
        </div>
      </div>
    );
  }

  const formattedReviews = reviews.map((r) => ({
    name: r.customerId?.name || "Verified Customer",
    initials: r.customerId?.name
      ? r.customerId.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()
      : "VC",
    rating: r.rating || 5,
    date: r.createdAt
      ? new Date(r.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "Recent",
    text: r.review || "No detailed review comment provided.",
    serviceType: r.serviceType || provider?.serviceType || "",
  }));

  const serviceLabels = {
    plumber: "Plumbing",
    electrician: "Electrical",
    painter: "Painting",
    mason: "Masonry",
    cleaner: "Cleaning",
    carpenter: "Carpentry",
  };

  const portfolioImages = provider?.portfolio || provider?.workImages || [];

  return (
    <div className="bg-[#F8FAFC] text-[#172033] min-h-screen font-sans pb-16">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-10 py-3 text-xs sm:text-sm text-slate-500 flex items-center gap-2 flex-wrap font-semibold">
          <Link to="/" className="hover:text-[#0F766E] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/services" className="hover:text-[#0F766E] transition-colors">
            Services
          </Link>
          <span>/</span>
          <span className="text-[#0F2747] font-bold truncate">
            {provider.name}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="w-full max-w-[1920px] mx-auto px-6 lg:px-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Provider Detail Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* 1. PROVIDER PROFILE HERO */}
            <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-6 md:p-8 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="relative shrink-0">
                  {provider.profileImage ? (
                    <img
                      src={provider.profileImage}
                      alt={provider.name}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-white shadow-md ring-1 ring-slate-100"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center font-black text-3xl border-2 border-white shadow-md ring-1 ring-slate-100">
                      {provider.name.charAt(0)}
                    </div>
                  )}
                  {provider.isVerified && (
                    <span
                      title="Verified Partner"
                      className="absolute -bottom-2 -right-2 bg-[#0F766E] text-white p-1.5 rounded-full shadow-md ring-2 ring-white"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h1 className="text-2xl sm:text-3xl font-black text-[#0F2747] leading-tight">
                          {provider.name}
                        </h1>
                        {provider.isVerified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-[#0F766E] border border-teal-100">
                            <ShieldCheck className="w-3.5 h-3.5" /> Identity Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm sm:text-base text-[#0F766E] font-bold mb-3">
                        {serviceLabels[provider.serviceType] || provider.serviceType} Specialist
                      </p>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                      <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200/80 px-3 py-1 rounded-xl font-extrabold text-base">
                        <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                        <span>{provider.rating ? provider.rating.toFixed(1) : "New"}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-semibold">
                        {provider.totalReviews || 0} reviews
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-600 font-semibold">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {provider.location?.area || "Bangalore"}, Bengaluru
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{provider.experience || 1} Years Experience</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#16A34A] shrink-0" />
                      <span className="text-[#16A34A] font-bold">Available for Booking</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. ABOUT / PROFESSIONAL INFORMATION */}
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0F2747] mb-2">
                  About Professional
                </h2>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
                  {provider.description ||
                    `Certified ${serviceLabels[provider.serviceType] || provider.serviceType} professional with over ${provider.experience || 1} years of hands-on experience in residential and commercial installations, maintenance, and emergency repairs.`}
                </p>
              </div>

              {/* 8. SERVICES / SKILLS TAGS */}
              <div className="mt-6 border-t border-slate-100 pt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Service Expertise
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-teal-50 text-[#0F766E] text-xs font-bold rounded-lg border border-teal-100">
                    {serviceLabels[provider.serviceType] || provider.serviceType}
                  </span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                    Emergency Service
                  </span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                    Residential Repair
                  </span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                    Punctual Service
                  </span>
                </div>
              </div>
            </div>

            {/* 10. PORTFOLIO (Only if real images exist) */}
            {portfolioImages.length > 0 && (
              <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-6 md:p-8">
                <h2 className="text-lg font-extrabold text-[#0F2747] mb-4">
                  Work Portfolio
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {portfolioImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl overflow-hidden border border-slate-200 h-36 group"
                    >
                      <img
                        src={img}
                        alt={`Work sample ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 11. REVIEWS SECTION */}
            <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-6 md:p-8">
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0F2747]">
                    Customer Reviews
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Verified feedback from HomeFix service bookings
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Star className="w-5 h-5 fill-[#F59E0B] text-[#F59E0B]" />
                    <span className="text-2xl font-black text-[#0F2747]">
                      {provider.rating ? provider.rating.toFixed(1) : "N/A"}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">
                    {provider.totalReviews || 0} Total Reviews
                  </span>
                </div>
              </div>

              {/* Review List */}
              <div className="space-y-6">
                {formattedReviews.length > 0 ? (
                  formattedReviews.map((review, i) => (
                    <div
                      key={i}
                      className="border-b border-slate-100 pb-6 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-50 text-[#0F766E] font-bold text-xs flex items-center justify-center border border-teal-100 shrink-0">
                            {review.initials}
                          </div>
                          <div>
                            <span className="font-bold text-[#172033] text-sm block leading-tight">
                              {review.name}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              {review.date}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg text-amber-900 text-xs font-bold border border-amber-200/60">
                          <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                          <span>{review.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed mt-2 pl-13 font-medium">
                        {review.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5 px-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400 shadow-2xs">
                      <Star className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-[#0F2747] mb-1">
                      No reviews yet
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                      Be the first customer to book this provider and share your experience.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. STICKY BOOKING CARD */}
          <aside className="lg:w-full lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-6 relative overflow-hidden">
              <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Hourly Rate
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-black text-[#0F2747]">
                      ₹{provider.pricePerHour}
                    </span>
                    <span className="text-slate-500 text-xs font-semibold">/ hr</span>
                  </div>
                </div>
                {provider.isVerified && (
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                      <ShieldCheck className="w-3.5 h-3.5" /> ID Verified
                    </span>
                  </div>
                )}
              </div>

              {/* Trust Callouts */}
              <div className="space-y-2 mb-5 text-xs text-slate-600 bg-teal-50/70 p-3.5 rounded-xl border border-teal-100">
                <div className="flex items-center gap-2 font-semibold text-[#0F766E]">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Verified Identity & Skill Evaluation</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-[#0F766E]">
                  <Zap className="w-4 h-4 shrink-0" />
                  <span>Direct Booking & Immediate Status Updates</span>
                </div>
              </div>

              {/* Booking Form */}
              <form onSubmit={handleBooking} className="space-y-4">
                {/* 5. Date Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0F2747] mb-1.5">
                    Select Service Date
                  </label>
                  <DateSelector
                    selectedDate={bookingDate}
                    onSelect={setBookingDate}
                  />
                </div>

                {/* 6. Time Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0F2747] mb-1.5">
                    Select Start Time
                  </label>
                  <TimeSelector
                    selectedTime={bookingTime}
                    onSelect={setBookingTime}
                    bookedSlots={bookedSlots}
                    selectedDate={bookingDate}
                    selectedDuration={duration}
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0F2747] mb-1">
                    Estimated Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-[#172033] focus:ring-2 focus:ring-[#0F766E] focus:border-transparent outline-none bg-slate-50"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                      <option key={h} value={h}>
                        {h} hour{h > 1 ? "s" : ""} (₹{provider.pricePerHour * h})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0F2747] mb-1">
                    Service Location
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      placeholder="Street / Door No / Apartment"
                      value={address.street}
                      onChange={(e) =>
                        setAddress({ ...address, street: e.target.value })
                      }
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Area / Colony"
                        value={address.area}
                        onChange={(e) =>
                          setAddress({ ...address, area: e.target.value })
                        }
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] outline-none"
                      />
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={address.city}
                        onChange={(e) =>
                          setAddress({ ...address, city: e.target.value })
                        }
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Pincode"
                        value={address.pincode}
                        onChange={(e) =>
                          setAddress({ ...address, pincode: e.target.value })
                        }
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Landmark (Optional)"
                        value={address.landmark}
                        onChange={(e) =>
                          setAddress({ ...address, landmark: e.target.value })
                        }
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] outline-none"
                      />
                    </div>

                    {/* GPS Location Button */}
                    <button
                      type="button"
                      onClick={getMyLocation}
                      disabled={locationLoading}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        address.coordinates?.lat
                          ? "border-emerald-300 bg-emerald-50 text-[#16A34A]"
                          : "border-teal-300 bg-teal-50 text-[#0F766E] hover:bg-teal-100"
                      } ${locationLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      {locationLoading ? (
                        <MapPin className="w-3.5 h-3.5 animate-bounce" />
                      ) : (
                        <Navigation className="w-3.5 h-3.5" />
                      )}
                      {locationLoading
                        ? "Getting location..."
                        : address.coordinates?.lat
                          ? "📍 GPS Location Captured"
                          : "📍 Use Current GPS Location"}
                    </button>
                  </div>
                </div>

                {/* Problem Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0F2747] mb-1">
                    Job Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe the task or issue briefly..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0F766E] outline-none resize-none"
                  />
                </div>

                {/* 4. BOOKING SUMMARY & CTA */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Estimated Total:</span>
                    <span className="font-extrabold text-[#0F2747] text-sm">
                      ₹{provider.pricePerHour * duration}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBooking}
                  className={`w-full bg-[#0F766E] hover:bg-[#0B5F59] text-white font-bold py-3.5 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer ${
                    isBooking ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  <span>{isBooking ? "Submitting Request..." : `Confirm Booking (₹${provider.pricePerHour * duration})`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <p className="text-[11px] text-center text-slate-400 mt-3 font-semibold">
                No upfront charge. Pay after service completion.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ProviderDetailPage;
