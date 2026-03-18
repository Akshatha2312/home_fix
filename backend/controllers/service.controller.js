import Provider from "../models/provider.model.js";
import Booking from "../models/booking.model.js";
import Favorite from "../models/favorite.model.js";

// Service type metadata
const SERVICE_TYPES = [
  {
    id: "plumber",
    name: "Plumbing",
    icon: "🔧",
    description: "Pipe repair, fixture installation, drain cleaning",
  },
  {
    id: "electrician",
    name: "Electrical",
    icon: "⚡",
    description: "Wiring, switch repair, appliance installation",
  },
  {
    id: "painter",
    name: "Painting",
    icon: "🎨",
    description: "Interior & exterior painting, wall textures",
  },
  {
    id: "mason",
    name: "Masonry",
    icon: "🧱",
    description: "Brick work, plastering, tile setting",
  },
  {
    id: "cleaner",
    name: "Cleaning",
    icon: "🧹",
    description: "Deep cleaning, pest control, sanitization",
  },
  {
    id: "carpenter",
    name: "Carpentry",
    icon: "🪚",
    description: "Furniture repair, woodwork, cabinet installation",
  },
];

// @desc    Get all service types
// @route   GET /api/services
export const getServiceTypes = async (req, res) => {
  try {
    // Count providers per service type
    const serviceCounts = await Provider.aggregate([
      { $match: { availability: true } },
      { $group: { _id: "$serviceType", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    serviceCounts.forEach((s) => {
      countMap[s._id] = s.count;
    });

    const services = SERVICE_TYPES.map((s) => ({
      ...s,
      providerCount: countMap[s.id] || 0,
    }));

    res.status(200).json({ success: true, services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get providers by service type with filters
// @route   GET /api/services/:type
export const getProvidersByType = async (req, res) => {
  try {
    const { type } = req.params;
    const {
      minRating,
      maxPrice,
      minPrice,
      area,
      sortBy,
      isLoggedIn,
      isVerified,
    } = req.query;

    let query = {};
    if (type && type !== "all") {
      query.serviceType = type;
    }
    if (minRating) query.rating = { $gte: parseFloat(minRating) };
    if (minPrice || maxPrice) {
      query.pricePerHour = {};
      if (minPrice) query.pricePerHour.$gte = parseInt(minPrice);
      if (maxPrice) query.pricePerHour.$lte = parseInt(maxPrice);
    }
    if (area) query["location.area"] = { $regex: area, $options: "i" };
    if (isVerified === "true") query.isVerified = true;

    if (isLoggedIn !== undefined) {
      if (isLoggedIn === "true") {
        query.isLoggedIn = true;
        query.availability = true;
      } else {
        // Filter those who are NOT both logged in and available
        query.$or = [{ isLoggedIn: false }, { availability: false }];
      }
    }

    let sort = {};
    if (sortBy === "favorites") {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Please login to view your favorites",
        });
      }

      const favorites = await Favorite.find({ customerId: req.user._id });
      const providerIds = favorites.map((f) => f.providerId);
      query._id = { $in: providerIds };
      sort = { createdAt: -1 }; // Default sort for favorites
    } else {
      switch (sortBy) {
        case "rating":
          sort = { rating: -1 };
          break;
        case "price_low":
          sort = { pricePerHour: 1 };
          break;
        case "price_high":
          sort = { pricePerHour: -1 };
          break;
        case "experience":
          sort = { experience: -1 };
          break;
        default:
          sort = { rating: -1 };
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9; // Default to 9 for grid layout (3x3)
    const skip = (page - 1) * limit;

    const total = await Provider.countDocuments(query);

    const providers = await Provider.find(query)
      .select("-password")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      providers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get specific provider details
// @route   GET /api/services/provider/:id
export const getProviderDetails = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id).select("-password");

    if (!provider) {
      return res
        .status(404)
        .json({ success: false, message: "Provider not found" });
    }

    // Get reviews for this provider
    const reviews = await Booking.find({
      providerId: provider._id,
      rating: { $exists: true, $gt: 0 },
    })
      .populate("customerId", "name profileImage")
      .select("rating review createdAt customerId serviceType")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({ success: true, provider, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search providers
// @route   GET /api/services/search
export const searchProviders = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res
        .status(400)
        .json({ success: false, message: "Search query is required" });
    }

    const providers = await Provider.find({
      $or: [
        { serviceType: { $regex: q, $options: "i" } },
        { "location.area": { $regex: q, $options: "i" } },
        { skills: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
      ],
    }).select("-password");

    res.status(200).json({ success: true, count: providers.length, providers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update provider profile
// @route   PUT /api/services/profile
export const updateProfile = async (req, res) => {
  try {
    const {
      serviceType,
      experience,
      pricePerHour,
      description,
      skills,
      area,
      city,
      pincode,
      availability,
    } = req.body;

    let provider = await Provider.findOne({ _id: req.user._id });

    if (!provider) {
      return res
        .status(404)
        .json({ success: false, message: "Provider profile not found" });
    }

    // Update fields
    if (serviceType) provider.serviceType = serviceType;
    if (experience) provider.experience = experience;
    if (pricePerHour) provider.pricePerHour = pricePerHour;
    if (description) provider.description = description;
    if (skills) provider.skills = skills;
    if (availability !== undefined) provider.availability = availability;

    // Update location fields if provided
    if (area || city || pincode) {
      provider.location = {
        area: area || provider.location.area,
        city: city || provider.location.city,
        pincode: pincode || provider.location.pincode,
      };
    }

    await provider.save();

    res.status(200).json({ success: true, provider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
