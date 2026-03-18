import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  toggleAvailability,
  getMyProviderProfile,
} from "../controllers/provider.controller.js";

const router = express.Router();

router.put("/availability", protect, authorize("provider"), toggleAvailability);
router.get("/me", protect, authorize("provider"), getMyProviderProfile);

export default router;
