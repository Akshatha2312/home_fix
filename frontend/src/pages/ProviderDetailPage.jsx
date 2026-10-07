import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Briefcase,
  Star,
  CheckCircle,
  Clock,
  ShieldCheck,
  Zap,
  Navigation,
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
          // Reverse geocode using free Nominatim (OpenStreetMap) API
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
          // Even if geocoding fails, we still have coordinates
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

  // ... (existing code)

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
        // Reset form
        // Reset form
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
        // Optional: Redirect to customer dashboard
        navigate("/customer-dashboard");
      }
    } catch (error) {
      console.error("Booking failed:", error);
      toast.error(error.message || "Failed to submit booking");
    } finally {
      setIsBooking(false);
    }
  };
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Provider Not Found
          </h2>
          <Link to="/services" className="text-primary hover:underline text-sm">
            ← Back to Services
          </Link>
        </div>
      </div>
    );
  }

  // Reviews are fetched from API
  const formattedReviews = reviews.map((r) => ({
    name: r.customerId?.name || "Anonymous Customer",
    initials: r.customerId?.name
      ? r.customerId.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()
      : "AC",
    rating: r.rating || 5,
    date: r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Recent",
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

  // Check if provider has custom portfolio images
  const portfolioImages = provider?.portfolio || provider?.workImages || [];

  return (
    <div className="bg-gray-50 text-gray-800 min-h-screen font-sans pb-12">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 text-sm text-gray-500 flex items-center gap-2 flex-wrap">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/services" className="hover:text-primary transition-colors">
            Services
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">
            {provider.name}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="relative shrink-0">
                  {provider.profileImage ? (
                    <img
                      src={provider.profileImage}
                      alt={provider.name}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-white shadow-sm ring-1 ring-gray-100"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-blue-50 text-primary flex items-center justify-center font-bold text-3xl border-2 border-white shadow-sm ring-1 ring-gray-100">
                      {provider.name.charAt(0)}
                    </div>
                  )}
                  {provider.isVerified && (
                    <span
                      title="Identity & Background Verified Provider"
                      className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full shadow-md ring-2 ring-white"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                          {provider.name}
                        </h1>
                        {provider.isVerified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                            <ShieldCheck className="w-3.5 h-3.5" /> Identity Verified
                          </span>
                        )}
                      </div>
                      <p className="text-base text-primary font-semibold mb-3">
                        {serviceLabels[provider.serviceType] || provider.serviceType} Specialist
                      </p>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0 bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                      <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200/60 px-3 py-1 rounded-lg font-bold text-base">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>{provider.rating ? provider.rating.toFixed(1) : "New"}</span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">
                        {provider.totalReviews || 0} customer reviews
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate">
                        {provider.location?.area || "Bangalore"}, Bengaluru
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{provider.experience || 0} Years Experience</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-emerald-700 font-medium">Available for Booking</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-6">
                <h2 className="text-base font-bold text-gray-900 mb-2">About Provider</h2>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  {provider.description ||
                    `Certified ${serviceLabels[provider.serviceType] || provider.serviceType} professional with over ${provider.experience || 0} years of field experience. Dedicated to prompt, high-quality, and reliable service.`}
                </p>
              </div>
            </div>

            {/* Work Portfolio Gallery - Only displayed if real portfolio images exist */}
            {portfolioImages.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Work Portfolio</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {portfolioImages.map((img, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden border border-gray-200 h-32">
                      <img src={img} alt={`Work sample ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Reviews Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Customer Ratings & Reviews</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Verified service experiences from HomeFix users</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="text-2xl font-black text-gray-900">
                      {provider.rating ? provider.rating.toFixed(1) : "N/A"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{provider.totalReviews || 0} Total Reviews</span>
                </div>
              </div>

              {/* Review List */}
              <div className="space-y-6">
                {formattedReviews.length > 0 ? (
                  formattedReviews.map((review, i) => (
                    <div
                      key={i}
                      className="border-b border-gray-100 pb-6 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-100 shrink-0">
                            {review.initials}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 text-sm block leading-tight">
                              {review.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {review.date}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded text-amber-800 text-xs font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{review.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed mt-2 pl-12">
                        {review.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs text-gray-400">
                      <Star className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No reviews yet</h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">
                      Be the first customer to book this provider and share your experience with the community.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Compact Booking Card */}
          <aside className="lg:w-full lg:sticky lg:top-24">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200/80 p-6">
              <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-gray-100">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                    Service Rate
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-extrabold text-gray-900">
                      ₹{provider.pricePerHour}
                    </span>
                    <span className="text-gray-500 text-sm font-medium">/ hr</span>
                  </div>
                </div>
                {provider.isVerified && (
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                      <ShieldCheck className="w-3.5 h-3.5" /> ID Verified
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 mb-5 text-xs text-gray-600 bg-blue-50/50 p-3 rounded-lg border border-blue-100/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Identity & Profile Background Checked</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Direct Scheduling & Prompt Confirmation</span>
                </div>
              </div>

              {/* Booking Form */}
              <form onSubmit={handleBooking} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Select Date
                  </label>
                  <DateSelector
                    selectedDate={bookingDate}
                    onSelect={setBookingDate}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Select Time Slot
                  </label>
                  <TimeSelector
                    selectedTime={bookingTime}
                    onSelect={setBookingTime}
                    bookedSlots={bookedSlots}
                    selectedDate={bookingDate}
                    selectedDuration={duration}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Estimated Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-white font-medium text-gray-800"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                      <option key={h} value={h}>
                        {h} hour{h > 1 ? "s" : ""} (₹{provider.pricePerHour * h})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Service Location
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      placeholder="Street / Flat / Door No"
                      value={address.street}
                      onChange={(e) =>
                        setAddress({ ...address, street: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={address.city}
                        onChange={(e) =>
                          setAddress({ ...address, city: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Landmark (Opt)"
                        value={address.landmark}
                        onChange={(e) =>
                          setAddress({ ...address, landmark: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>

                    {/* Use My Location Button */}
                    <button
                      type="button"
                      onClick={getMyLocation}
                      disabled={locationLoading}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg text-xs font-semibold transition-all ${
                        address.coordinates?.lat
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
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
                          ? "📍 Location Captured"
                          : "📍 Use Current GPS Location"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Problem Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Briefly describe the task or issue..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isBooking}
                  className={`block w-full bg-primary hover:bg-blue-700 text-white text-center font-bold py-3 px-4 rounded-xl transition shadow-md hover:shadow-lg active:scale-98 ${
                    isBooking ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isBooking ? "Submitting Booking..." : `Confirm Booking (₹${provider.pricePerHour * duration})`}
                </button>
              </form>

              <p className="text-[11px] text-center text-gray-500 mt-3 leading-tight">
                No upfront payment required. You pay after service completion.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ProviderDetailPage;
