import express from "express";
import {
  createCoupon,
  getCoupons,
  validateCoupon,
  toggleCouponStatus,
  deleteCoupon,
} from "../controllers/coupon.controller.js";
import { protect, authorize, restoreUser } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public / Authenticated route to get coupons or validate coupon
router.get("/", restoreUser, getCoupons);
router.post("/validate", protect, validateCoupon);

// Admin-only management routes
router.post("/", protect, authorize("admin"), createCoupon);
router.put("/:id/status", protect, authorize("admin"), toggleCouponStatus);
router.delete("/:id", protect, authorize("admin"), deleteCoupon);

export default router;
