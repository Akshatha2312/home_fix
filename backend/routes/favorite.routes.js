import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  toggleFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite,
} from "../controllers/favorite.controller.js";

const router = express.Router();

router.use(protect); // All favorite routes require authentication

router.route("/").get(authorize("customer"), getFavorites);

router
  .route("/:providerId")
  .post(authorize("customer"), toggleFavorite)
  .delete(authorize("customer"), removeFavorite);

router.get("/:providerId/check", checkFavorite);

export default router;
