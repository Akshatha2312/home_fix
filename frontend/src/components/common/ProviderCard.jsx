import { Link, useNavigate } from "react-router-dom";
import { MapPin, Briefcase, Star, Heart, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { favoritesAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../context/socket";
import toast from "react-hot-toast";

const ProviderCard = ({ provider }) => {
  const name = provider.name || "Provider";
  const { isAuthenticated, user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  // Track availability state from provider prop, but allow real-time updates
  const [isAvailable, setIsAvailable] = useState(provider.availability);

  // Track connection status
  const isConnected = onlineUsers?.includes(provider._id);

  // Show green only if Connected AND Available
  const isOnline = isConnected && isAvailable;

  useEffect(() => {
    // Check Favorites
    const checkFavoriteStatus = async () => {
      try {
        const response = await favoritesAPI.check(provider._id);
        if (response.success) {
          setIsFavorite(response.isFavorite);
        }
      } catch (error) {
        console.error("Error checking favorite:", error);
      }
    };

    if (isAuthenticated) {
      checkFavoriteStatus();
    } else {
      Promise.resolve().then(() => setIsFavorite(false));
    }

    // Listen for availability changes
    if (socket) {
      const handleAvailabilityChange = (data) => {
        if (data.providerId === provider._id) {
          setIsAvailable(data.isAvailable);
        }
      };

      socket.on("provider-availability-changed", handleAvailabilityChange);

      return () => {
        socket.off("provider-availability-changed", handleAvailabilityChange);
      };
    }
  }, [isAuthenticated, user?._id, provider._id, socket]);

  const toggleFavorite = async (e) => {
    e.preventDefault(); // Prevent navigation to profile
    if (!isAuthenticated) {
      toast.error("Please login to add favorites");
      navigate("/login");
      return;
    }

    try {
      const response = await favoritesAPI.toggle(provider._id);
      setIsFavorite(response.isFavorite);
      toast.success(response.message);
    } catch (error) {
      toast.error(error.message || "Failed to update favorites");
    }
  };

  const serviceLabels = {
    plumber: "Plumbing",
    electrician: "Electrical",
    painter: "Painting",
    mason: "Masonry",
    cleaner: "Cleaning",
    carpenter: "Carpentry",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-blue-100 transition-all duration-300 group relative flex flex-col h-full">
      <button
        onClick={toggleFavorite}
        className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100"
      >
        <Heart
          className={`w-5 h-5 transition-colors ${
            isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
          }`}
        />
      </button>

      <div className="p-5 flex flex-col grow">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center shrink-0 overflow-hidden text-primary border-2 border-white shadow-sm ring-1 ring-gray-100">
              {provider.profileImage ? (
                <img
                  src={provider.profileImage}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold">{name.charAt(0)}</span>
              )}
            </div>
            {/* Online Status Indicator */}
            <div
              className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white rounded-full ${
                isOnline ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <h3 className="font-bold text-gray-900 text-lg leading-tight truncate flex items-center gap-1.5">
              {name}
              {provider.isVerified && (
                <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-50" />
              )}
            </h3>
            <p className="text-sm text-primary font-medium mt-1">
              {serviceLabels[provider.serviceType] || provider.serviceType}
            </p>
            <div className="flex items-center gap-1 mt-1.5">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-gray-900 text-sm">
                {provider.rating?.toFixed(1) || "New"}
              </span>
              <span className="text-gray-400 text-xs">
                ({provider.totalReviews || 0} reviews)
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm text-gray-600 mb-6 grow">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-primary shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <span className="truncate">
              {provider.location?.area || "Bangalore"}
            </span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <span>{provider.experience} Years Experience</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Starts at
            </span>
            <div className="text-gray-900 font-extrabold text-xl">
              ₹{provider.pricePerHour}
              <span className="text-xs text-gray-500 font-normal ml-1">
                /hr
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                toast.error("Please login to view details");
                navigate("/login");
              } else {
                navigate(`/provider/${provider._id}`);
              }
            }}
            className="bg-primary hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-blue-100 hover:shadow-lg transition-all active:scale-95"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderCard;
