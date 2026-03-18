import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },
    serviceType: {
      type: String,
      required: true,
    },
    bookingDate: {
      type: Date,
      required: [true, "Booking date is required"],
    },
    bookingTime: {
      type: String,
      required: [true, "Booking time is required"],
    },
    address: {
      street: { type: String, default: "N/A" },
      area: { type: String, default: "N/A" },
      city: { type: String, default: "Bangalore" },
      pincode: { type: String, default: "N/A" },
      landmark: { type: String, default: "N/A" },
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },
    problemDescription: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    cancellationReason: {
      type: String,
      default: "",
    },
    estimatedDuration: {
      type: Number,
      default: 1,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    actualCost: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"], // Added failed as per requirements
      default: "pending",
    },
    paymentId: {
      type: String,
      default: "",
    },
    razorpayOrderId: {
      type: String, // To link booking to razorpay order before payment completion
      default: "",
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    paidAt: {
      type: Date,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
