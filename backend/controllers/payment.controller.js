import Payment from "../models/payment.model.js";
import Booking from "../models/booking.model.js";
import { sendEmail } from "../utils/email.js";
import {
  paymentSuccessTemplate,
  paymentReceivedTemplate,
} from "../utils/emailTemplates.js";
import Notification from "../models/notification.model.js";

// @desc    Create payment order (stub for Razorpay)
// @route   POST /api/payments/create-order
export const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // IDOR Check: Ensure the user paying is the customer who booked it
    if (booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to pay for this booking",
      });
    }

    // Check if booking is already paid
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Booking is already paid",
      });
    }

    const Razorpay = (await import("razorpay")).default;
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Ensure amount is at least ₹1 (100 paise)
    let amountInPaise = Math.round(booking.estimatedCost * 100);
    if (amountInPaise < 100) {
      console.warn(
        `[Payment] Booking ${bookingId} cost is ${booking.estimatedCost}, adjusting to ₹1 for test.`,
      );
      amountInPaise = 100;
    }

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${bookingId.toString().slice(-10)}`,
    };

    // console.log("[Payment] Creating Razorpay order with options:", options);

    const order = await instance.orders.create(options);

    // console.log("[Payment] Razorpay Order Created:", order);

    if (!order) {
      return res
        .status(500)
        .json({ success: false, message: "Some error occured" });
    }

    // Check if a payment record already exists for this booking
    let payment = await Payment.findOne({ bookingId });

    if (payment) {
      // Update existing payment record with new order details
      payment.razorpayOrderId = order.id;
      payment.amount = amountInPaise / 100;
      payment.status = "created";
      await payment.save();
    } else {
      // Create new payment record
      payment = await Payment.create({
        bookingId,
        customerId: req.user._id,
        providerId: booking.providerId,
        amount: amountInPaise / 100,
        razorpayOrderId: order.id,
        status: "created",
      });
    }

    // Update Booking with Razorpay Order ID
    await Booking.findByIdAndUpdate(bookingId, {
      razorpayOrderId: order.id,
    });

    res.status(201).json({
      success: true,
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
      booking, // Sending booking details might be useful for frontend
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify payment
// @route   POST /api/payments/verify
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Dynamic import for crypto (built-in)
    const crypto = await import("crypto");

    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Transaction not legit!" });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment record not found" });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = "successful";
    await payment.save();

    // Update booking payment status
    await Booking.findByIdAndUpdate(payment.bookingId, {
      paymentStatus: "paid",
      status: "completed",
      paymentId: razorpay_payment_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      paidAt: new Date(),
    });

    // Fetch updated booking with details for email
    const updatedBooking = await Booking.findById(payment.bookingId)
      .populate("customerId", "name email")
      .populate("providerId", "name email");

    if (updatedBooking) {
      // 1. To Customer (Payment Success)
      await sendEmail({
        to: updatedBooking.customerId.email,
        subject: "HomeFix: Payment Successful",
        html: paymentSuccessTemplate({
          customerName: updatedBooking.customerId.name,
          providerName: updatedBooking.providerId.name,
          amount: payment.amount, // Payment model stores amount (already in rupees? No, created as paise/100, so it is in rupees)
          paymentId: razorpay_payment_id,
        }),
      });

      // 2. To Provider (Payment Received)
      if (updatedBooking.providerId && updatedBooking.providerId.email) {
        await sendEmail({
          to: updatedBooking.providerId.email,
          subject: "HomeFix: You Received a Payment",
          html: paymentReceivedTemplate({
            providerName: updatedBooking.providerId.name,
            customerName: updatedBooking.customerId.name,
            serviceType: updatedBooking.serviceType,
            amount: payment.amount,
            paymentId: razorpay_payment_id,
          }),
        });
      }

      // Create Notifications
      // 1. For Customer
      await Notification.create({
        userId: updatedBooking.customerId._id,
        userType: "Customer",
        type: "PAYMENT_SUCCESS",
        message: `Payment of ₹${payment.amount} to ${updatedBooking.providerId.name} successful`,
        relatedBookingId: updatedBooking._id,
      });

      // 2. For Provider
      if (updatedBooking.providerId) {
        await Notification.create({
          userId: updatedBooking.providerId._id,
          userType: "Provider",
          type: "PAYMENT_RECEIVED",
          message: `Received payment of ₹${payment.amount} from ${updatedBooking.customerId.name}`,
          relatedBookingId: updatedBooking._id,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment verified and booking updated",
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payment history
// @route   GET /api/payments/history
export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ customerId: req.user._id })
      .populate("bookingId")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
