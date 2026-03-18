import Favorite from "../models/favorite.model.js";
import Provider from "../models/provider.model.js";
import mongoose from "mongoose";

// @desc    Toggle provider favorite status (Add if not exists, Remove if exists)
// @route   POST /api/favorites/:providerId
// @access  Private (Customer)
export const toggleFavorite = async (req, res) => {
  try {
    const { providerId } = req.params;

    // Validate providerId format
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID format",
      });
    }

    // Check if provider exists
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // Check if already favorite
    const existingFavorite = await Favorite.findOne({
      customerId: req.user._id,
      providerId: provider._id,
    });

    if (existingFavorite) {
      // Remove if exists
      await Favorite.findByIdAndDelete(existingFavorite._id);
      return res.status(200).json({
        success: true,
        message: "Removed from favorites",
        isFavorite: false,
      });
    } else {
      // Add if not exists
      await Favorite.create({
        customerId: req.user._id,
        providerId: provider._id,
      });
      return res.status(201).json({
        success: true,
        message: "Added to favorites",
        isFavorite: true,
      });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format provided",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Remove provider from favorites
// @route   DELETE /api/favorites/:providerId
// @access  Private (Customer)
export const removeFavorite = async (req, res) => {
  try {
    const { providerId } = req.params;

    // Validate providerId format
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID format",
      });
    }

    const favorite = await Favorite.findOneAndDelete({
      customerId: req.user._id,
      providerId: providerId,
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found",
      });
    }

    res.status(200).json({ success: true, message: "Removed from favorites" });
  } catch (error) {
    console.error("Error removing favorite:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format provided",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get user favorites
// @route   GET /api/favorites
// @access  Private (Customer)
export const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({
      customerId: req.user._id,
    }).populate({
      path: "providerId",
      select:
        "name profileImage serviceType rating location experience pricePerHour totalReviews",
    });

    res.status(200).json({
      success: true,
      favorites: favorites.map((f) => f.providerId), // Return list of providers
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Check if provider is favorite
// @route   GET /api/favorites/:providerId/check
// @access  Private
export const checkFavorite = async (req, res) => {
  try {
    const { providerId } = req.params;

    // Validate providerId format
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({
        success: true,
        isFavorite: false,
      });
    }

    const count = await Favorite.countDocuments({
      customerId: req.user._id,
      providerId: providerId,
    });
    res.status(200).json({ success: true, isFavorite: count > 0 });
  } catch (error) {
    console.error("Error checking favorite:", error);
    if (error.name === "CastError") {
      return res.status(200).json({ success: true, isFavorite: false });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
