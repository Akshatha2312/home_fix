import express from "express";
import {
  createBooking,
  getCustomerBookings,
  getProviderBookings,
  updateBookingStatus,
  cancelBooking,
  submitReview,
  getBooking,
  getProviderAvailability,
} from "../controllers/booking.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("customer"), createBooking);
router.get("/customer", protect, authorize("customer"), getCustomerBookings);
router.get("/provider", protect, authorize("provider"), getProviderBookings);
router.get("/:id", protect, getBooking);
router.put("/:id/status", protect, authorize("provider"), updateBookingStatus);
router.put("/:id/cancel", protect, authorize("customer"), cancelBooking);
router.post("/:id/review", protect, authorize("customer"), submitReview);
router.get("/availability/:providerId", getProviderAvailability);

export default router;
