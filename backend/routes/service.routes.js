import express from "express";
import {
  getServiceTypes,
  getProvidersByType,
  getProviderDetails,
  searchProviders,
  updateProfile,
} from "../controllers/service.controller.js";
import {
  protect,
  authorize,
  restoreUser,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Public route for landing page and registration
router.get("/", getServiceTypes);

// Public routes for browsing providers
router.get("/search", searchProviders);
router.get("/:type", restoreUser, getProvidersByType);

// Public route for viewing provider details
router.get("/provider/:id", restoreUser, getProviderDetails);

// Protected route (Provider only) for updating profile
router.put("/profile", protect, authorize("provider"), updateProfile);

export default router;
