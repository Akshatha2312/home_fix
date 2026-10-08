import Coupon from "../models/coupon.model.js";

// @desc    Create new coupon (Admin only)
// @route   POST /api/coupons
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minBookingAmount,
      maxDiscount,
      expiryDate,
      usageLimit,
      applicableService,
    } = req.body;

    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Code, discount type, discount value, and expiry date are required.",
      });
    }

    const existingCoupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon with this code already exists.",
      });
    }

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minBookingAmount: Number(minBookingAmount || 0),
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit ? Number(usageLimit) : 100,
      applicableService: applicableService || "all",
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all coupons (Admin / Public active coupons)
// @route   GET /api/coupons
export const getCoupons = async (req, res) => {
  try {
    const isAdmin = req.user && (req.user.userType === "admin" || req.user.role === "admin");
    const query = isAdmin ? {} : { isActive: true, expiryDate: { $gt: new Date() } };

    const coupons = await Coupon.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Validate coupon for customer booking
// @route   POST /api/coupons/validate
export const validateCoupon = async (req, res) => {
  try {
    const { code, bookingAmount, serviceType } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required.",
      });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code.",
      });
    }

    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: "This coupon is currently inactive.",
      });
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "This coupon has expired.",
      });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "This coupon has reached its usage limit.",
      });
    }

    if (
      coupon.applicableService !== "all" &&
      serviceType &&
      coupon.applicableService.toLowerCase() !== serviceType.toLowerCase()
    ) {
      return res.status(400).json({
        success: false,
        message: `This coupon is only valid for ${coupon.applicableService} services.`,
      });
    }

    const amount = Number(bookingAmount || 0);

    if (amount < coupon.minBookingAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum booking amount of ₹${coupon.minBookingAmount} required for this coupon.`,
      });
    }

    // Calculate discount amount
    let discount = 0;
    if (coupon.discountType === "fixed") {
      discount = coupon.discountValue;
    } else if (coupon.discountType === "percentage") {
      discount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }

    discount = Math.min(discount, amount); // Discount cannot exceed booking total
    const finalAmount = Math.max(0, amount - discount);

    res.status(200).json({
      success: true,
      message: "Coupon applied successfully!",
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discount * 100) / 100,
        finalAmount: Math.round(finalAmount * 100) / 100,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle coupon active status or delete (Admin only)
// @route   PUT /api/coupons/:id/status
export const toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.status(200).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete coupon (Admin only)
// @route   DELETE /api/coupons/:id
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    res.status(200).json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
