import Provider from "../models/provider.model.js";
import {
  emitToUser,
  notifyProviderAvailabilityChanged,
} from "../services/socket.service.js";
import Favorite from "../models/favorite.model.js";

// @desc    Toggle provider availability
// @route   PUT /api/providers/availability
// @access  Private (Provider only)
export const toggleAvailability = async (req, res) => {
  try {
    // req.user is the provider document
    const provider = req.user;

    provider.availability = !provider.availability;
    await provider.save();

    // If provider is now online, notify users who favorited them
    if (provider.availability) {
      const favorites = await Favorite.find({
        providerId: provider._id,
      }).populate("customerId"); // Changed from userId to customerId based on earlier refactor

      favorites.forEach((fav) => {
        if (fav.customerId && fav.customerId._id) {
          emitToUser(fav.customerId._id, "provider-online", {
            message: `${provider.name} is now online`,
            providerId: provider._id,
            providerName: provider.name,
          });
        }
      });
    }

    // Broadcast availability change to all clients (for real-time status dots)
    notifyProviderAvailabilityChanged(provider._id, provider.availability);

    res.status(200).json({
      success: true,
      data: { availability: provider.availability },
    });
  } catch (error) {
    console.error("Error toggling availability:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get provider profile (for the logged in provider)
// @route   GET /api/providers/me
// @access  Private
// eslint-disable-next-line no-unused-vars
export const getMyProviderProfile = async (req, res) => {
  try {
    // req.user is already the provider document populated by auth middleware
    if (!req.user) {
      return res
        .status(404)
        .json({ success: false, message: "Provider profile not found" });
    }
    res.status(200).json({ success: true, provider: req.user });
  } catch (error) {
    console.error("Error fetching provider profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
