import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "userType", // Dynamic reference based on userType
      required: true,
    },
    userType: {
      type: String,
      required: true,
      enum: ["Customer", "Provider", "Admin"],
    },
    type: {
      type: String, // e.g., 'BOOKING_CREATED', 'PAYMENT_RECEIVED'
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
    emailStatus: {
      type: String, // To log if email was sent
      enum: ["sent", "failed", "pending"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
