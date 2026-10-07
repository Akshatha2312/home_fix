import { Link, useNavigate } from "react-router-dom";
import { MapPin, Briefcase, Star, Heart, CheckCircle2, ArrowRight } from "lucide-react";
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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xl hover:border-teal-200 transition-all duration-300 group relative flex flex-col h-full overflow-hidden">
      {/* Top Banner / Favorite button */}
      <div className="p-5 pb-4 flex flex-col grow">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0 overflow-hidden text-[#0F766E] border border-teal-100 shadow-2xs">
                {provider.profileImage ? (
                  <img
                    src={provider.profileImage}
                    alt={name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span className="text-2xl font-black">{name.charAt(0)}</span>
                )}
              </div>
              {/* Online Status Indicator */}
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                  isOnline ? "bg-[#16A34A]" : "bg-[#DC2626]"
                }`}
                title={isOnline ? "Online Now" : "Offline"}
              ></div>
            </div>

            <div className="min-w-0">
              <h3 className="font-extrabold text-[#0F2747] text-lg leading-tight truncate flex items-center gap-1.5 group-hover:text-[#0F766E] transition-colors">
                {name}
              </h3>
              <p className="text-xs text-[#0F766E] font-bold uppercase tracking-wider mt-0.5">
                {serviceLabels[provider.serviceType] || provider.serviceType}
              </p>
              {provider.isVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-[#0F766E]" /> Verified
                </span>
              )}
            </div>
          </div>

          <button
            onClick={toggleFavorite}
            type="button"
            className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors border border-slate-100 shrink-0 cursor-pointer"
            aria-label="Toggle Favorite"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorite ? "fill-red-500 text-red-500" : ""
              }`}
            />
          </button>
        </div>

        {/* Rating & Review summary */}
        <div className="flex items-center justify-between bg-slate-50/80 px-3.5 py-2 rounded-xl mb-4 text-xs font-semibold border border-slate-100">
          <div className="flex items-center gap-1 text-[#172033]">
            <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
            <span className="font-bold">{provider.rating ? provider.rating.toFixed(1) : "New"}</span>
            <span className="text-slate-400 font-normal">
              ({provider.totalReviews || 0} reviews)
            </span>
          </div>
          <div className="text-slate-500 font-medium">
            {provider.experience || 1}+ yrs exp
          </div>
        </div>

        {/* Info Rows */}
        <div className="space-y-2 text-xs text-slate-600 mb-5 grow">
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{provider.location?.area || "Bangalore"}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Available for booking</span>
          </div>
        </div>

        {/* Bottom Price & Button */}
        <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 mt-auto">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Rate
            </span>
            <div className="text-[#0F2747] font-black text-lg leading-none">
              ₹{provider.pricePerHour || provider.hourlyRate || 299}
              <span className="text-xs text-slate-500 font-normal">/hr</span>
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
            className="inline-flex items-center justify-center gap-1.5 bg-[#0F766E] hover:bg-[#0B5F59] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <span>View Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderCard;
