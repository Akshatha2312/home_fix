import express from "express";
import {
  createOrder,
  verifyPayment,
  getPaymentHistory,
} from "../controllers/payment.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create-order", protect, authorize("customer"), createOrder);
router.post("/verify", protect, authorize("customer"), verifyPayment);
router.get("/history", protect, getPaymentHistory);

export default router;
