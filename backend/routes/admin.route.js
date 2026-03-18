import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  getDashboardStats,
  getAllCustomers,
  getAllProviders,
  deleteUser,
  getAllBookings,
  getProviderStats,
} from "../controllers/admin.controller.js";

const router = express.Router();

// All routes are protected and require admin role
router.use(protect);
router.use(authorize("admin"));

router.get("/dashboard", getDashboardStats);
router.get("/customers", getAllCustomers);
router.get("/providers", getAllProviders);
router.get("/bookings", getAllBookings);
router.get("/providers/:id/stats", getProviderStats);
router.delete("/users/:id", deleteUser);

export default router;
