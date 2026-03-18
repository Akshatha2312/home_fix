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

  // Reviews are now fetched from API, but we can keep a fallback if empty for demo purposes?
  // Actually, let's just use the fetched reviews. If empty, the UI will show nothing or we can show a message.
  // The backend returns specific structure for reviews: { rating, review, customerId: { name, profileImage }, createdAt }
  // We need to map it to the UI structure if different.
  // UI uses: name, initials, rating, date, text.

  const formattedReviews = reviews.map((r) => ({
    name: r.customerId?.name || "Anonymous",
    initials: r.customerId?.name
      ? r.customerId.name
          .split(" ")
          .map((n) => n[0])
          .join("")
      : "A",
    rating: r.rating,
    date: new Date(r.createdAt).toLocaleDateString(),
    text: r.review,
  }));

  const serviceLabels = {
    plumber: "Plumbing",
    electrician: "Electrical",
    painter: "Painting",
    mason: "Masonry",
    cleaner: "Cleaning",
    carpenter: "Carpentry",
  };

  return (
    <div className="bg-gray-50 text-gray-800 min-h-screen font-sans">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 text-sm text-gray-500">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/services" className="hover:text-primary">
            Services
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Provider Profile</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Header Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {provider.profileImage ? (
                  <img
                    src={provider.profileImage}
                    alt={provider.name}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 border-4 border-white shadow-md">
                    <span className="text-3xl font-bold">
                      {provider.name.charAt(0)}
                    </span>
                  </div>
                )}

                <div className="flex-1 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {provider.name}
                      </h1>
                      <p className="text-lg text-primary font-medium mb-2">
                        {serviceLabels[provider.serviceType] ||
                          provider.serviceType}{" "}
                        Specialist
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-lg font-bold">
                        <span>{provider.rating.toFixed(1)}</span>
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                      <span className="text-sm text-gray-500 mt-1">
                        {provider.totalReviews} Reviews
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span>
                        {provider.location?.area || "Bangalore"}, Bengaluru
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-gray-400" />
                      <span>{provider.experience} Years Experience</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span>Available Today</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-gray-100 pt-6">
                <h3 className="text-lg font-semibold mb-3">About</h3>
                <p className="text-gray-600 leading-relaxed">
                  {provider.description ||
                    `Certified ${provider.serviceType} professional with over ${provider.experience} years of field experience. Committed to providing clean and efficient service.`}
                </p>
              </div>
            </div>

            {/* Portfolio Gallery */}
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              <h3 className="text-lg font-semibold mb-4">Work Portfolio</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-100 rounded-lg h-32 w-full flex items-center justify-center text-gray-400">
                  Example 1
                </div>
                <div className="bg-gray-100 rounded-lg h-32 w-full flex items-center justify-center text-gray-400">
                  Example 2
                </div>
                <div className="bg-gray-100 rounded-lg flex items-center justify-center h-32 text-gray-400 text-sm font-medium">
                  +2 more
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              <h3 className="text-lg font-semibold mb-6">Customer Reviews</h3>
              <div className="space-y-6">
                {formattedReviews.length > 0 ? (
                  formattedReviews.map((review, i) => (
                    <div
                      key={i}
                      className="border-b border-gray-100 pb-6 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold text-xs">
                            {review.initials}
                          </div>
                          <span className="font-medium text-gray-900">
                            {review.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {review.date}
                        </span>
                      </div>
                      <div className="flex text-yellow-400 text-sm mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-gray-600 text-sm">{review.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No reviews yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Booking Card */}
          <aside className="lg:w-full">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24 border border-blue-50">
              <div className="text-center mb-6">
                <span className="block text-gray-500 text-sm mb-1">
                  Standard Rate
                </span>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-3xl font-bold text-gray-900">
                    ₹{provider.pricePerHour}
                  </span>
                  <span className="text-gray-500 font-medium">/ hour</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
                  <span className="text-sm text-gray-700">
                    Background Checked & Verified
                  </span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Zap className="w-5 h-5 text-primary mt-0.5" />
                  <span className="text-sm text-gray-700">
                    Instant Booking Confirmation
                  </span>
                </div>
              </div>

              {/* Booking Form */}
              <form onSubmit={handleBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <DateSelector
                    selectedDate={bookingDate}
                    onSelect={setBookingDate}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Time
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                      <option key={h} value={h}>
                        {h} hour{h > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Details
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      placeholder="Street / Building / Flat No"
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
                        placeholder="Landmark (Optional)"
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
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed rounded-lg text-sm font-medium transition-all ${
                        address.coordinates?.lat
                          ? "border-green-300 bg-green-50 text-green-700"
                          : "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                      } ${locationLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      {locationLoading ? (
                        <MapPin className="w-4 h-4 animate-bounce" />
                      ) : (
                        <Navigation className="w-4 h-4" />
                      )}
                      {locationLoading
                        ? "Getting location..."
                        : address.coordinates?.lat
                          ? "📍 Location captured!"
                          : "📍 Use My Location"}
                    </button>

                    {/* Location Confirmation */}
                    {address.coordinates?.lat && (
                      <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-100">
                        <span className="text-xs text-green-700">
                          📍 {address.coordinates.lat.toFixed(5)},{" "}
                          {address.coordinates.lng.toFixed(5)}
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${address.coordinates.lat},${address.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          View on Map ↗
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Problem Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe your issue..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isBooking}
                  className={`block w-full bg-primary text-white text-center font-bold py-3 rounded-lg transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                    isBooking
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-blue-600"
                  }`}
                >
                  {isBooking ? "Booking..." : "Book Now"}
                </button>
              </form>

              <p className="text-xs text-center text-gray-500 mt-4">
                You won't be charged until the service is completed.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ProviderDetailPage;
