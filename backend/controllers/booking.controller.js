import Booking from "../models/booking.model.js";
import Provider from "../models/provider.model.js";
import {
  notifyNewBooking,
  notifyBookingUpdated,
  notifyBookingCancelled,
} from "../services/socket.service.js";
import { sendEmail } from "../utils/email.js";
import Notification from "../models/notification.model.js";

// @desc    Create new booking
// @route   POST /api/bookings
export const createBooking = async (req, res) => {
  try {
    const {
      providerId,
      serviceType,
      bookingDate,
      bookingTime,
      address,
      problemDescription,
      estimatedDuration,
    } = req.body;

    // Server-side validation for booking date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(bookingDate);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: "Cannot book for a past date.",
      });
    }

    // Ensure address has default structure if missing or incomplete
    const bookingAddress = {
      street: address?.street || "",
      area: address?.area || "",
      city: address?.city || "Bangalore",
      pincode: address?.pincode || "",
      landmark: address?.landmark || "",
    };

    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res
        .status(404)
        .json({ success: false, message: "Provider not found" });
    }

    if (!provider.availability) {
      return res.status(400).json({
        success: false,
        message: "Provider is currently offline and not accepting bookings.",
      });
    }

    const estimatedCost = provider.pricePerHour * (estimatedDuration || 1);

    // Check for overlapping bookings
    // Calculate new booking time range
    const [newStartHour, newStartMin] = bookingTime.split(":").map(Number);
    const newStartMins = newStartHour * 60 + newStartMin;
    const newEndMins = newStartMins + (estimatedDuration || 1) * 60;

    const existingBookings = await Booking.find({
      providerId,
      bookingDate,
      status: { $in: ["pending", "accepted"] },
    });

    const isOverlapping = existingBookings.some((b) => {
      const [bStartHour, bStartMin] = b.bookingTime.split(":").map(Number);
      const bStartMins = bStartHour * 60 + bStartMin;
      const bEndMins = bStartMins + b.estimatedDuration * 60;

      // Check for overlap: (StartA < EndB) && (EndA > StartB)
      return newStartMins < bEndMins && newEndMins > bStartMins;
    });

    if (isOverlapping) {
      return res.status(400).json({
        success: false,
        message: "This time slot is unavailable due to an existing booking.",
      });
    }

    const booking = await Booking.create({
      customerId: req.user._id,
      providerId,
      serviceType: serviceType || provider.serviceType,
      bookingDate,
      bookingTime,
      address,
      problemDescription,
      estimatedDuration: estimatedDuration || 1,
      estimatedCost,
    });

    // Increment provider's total bookings count
    await Provider.findByIdAndUpdate(providerId, {
      $inc: { totalBookings: 1 },
    });

    // Update Customer's address if it was empty
    const customer = await import("../models/customer.model.js").then(
      (m) => m.default,
    );
    // Reload customer to get current state (req.user might be stale if modified elsewhere, though unlikely in this request scope)
    // Actually req.user is from protect middleware.
    // Check if we should update address
    if (
      req.user.userType === "customer" &&
      (!req.user.address || !req.user.address.street)
    ) {
      await customer.findByIdAndUpdate(req.user._id, {
        address: bookingAddress,
      });
    }

    // Populate booking details for notification
    const populatedBooking = await Booking.findById(booking._id).populate(
      "customerId",
      "name phone",
    );

    // Notify provider via Socket.io
    // provider is now the standalone provider document, so we use provider._id
    notifyNewBooking(provider._id, populatedBooking);

    // Send Emails
    // 1. To Provider (New Booking Request)
    await sendEmail({
      to: provider.email,
      subject: "HomeFix: New Booking Request",
      templateId:
        process.env.EMAILJS_TEMPLATE_ID_BOOKING_CREATED ||
        process.env.EMAILJS_TEMPLATE_ID,
      templateParams: {
        email_type: "booking_created",
        provider_name: provider.name,
        customer_name: req.user.name,
        customer_phone: req.user.phone,
        service_type: booking.serviceType,
        booking_date: new Date(booking.bookingDate).toLocaleDateString("en-IN"),
        booking_time: booking.bookingTime,
        address_street: booking.address?.street || "",
        address_area: booking.address?.area || "",
        address_city: booking.address?.city || "Bangalore",
        address_pincode: booking.address?.pincode || "",
      },
    });

    // 2. To Customer (Booking Confirmation)
    await sendEmail({
      to: req.user.email,
      subject: "HomeFix: Booking Request Sent",
      templateId:
        process.env.EMAILJS_TEMPLATE_ID_BOOKING_CONFIRMATION ||
        process.env.EMAILJS_TEMPLATE_ID,
      templateParams: {
        email_type: "booking_confirmation",
        customer_name: req.user.name,
        provider_name: provider.name,
        provider_phone: provider.phone,
        service_type: booking.serviceType,
        booking_date: new Date(booking.bookingDate).toLocaleDateString("en-IN"),
        booking_time: booking.bookingTime,
        address_street: booking.address?.street || "",
        address_area: booking.address?.area || "",
        address_city: booking.address?.city || "Bangalore",
        address_pincode: booking.address?.pincode || "",
      },
    });

    // Create Notifications
    // 1. For Provider
    await Notification.create({
      userId: provider._id,
      userType: "Provider",
      type: "BOOKING_REQUEST",
      message: `New booking request from ${req.user.name} for ${booking.serviceType}`,
      relatedBookingId: booking._id,
    });

    // 2. For Customer
    await Notification.create({
      userId: req.user._id,
      userType: "Customer",
      type: "BOOKING_CREATED",
      message: `Booking request sent to ${provider.name}`,
      relatedBookingId: booking._id,
    });

    res.status(201).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get customer bookings
// @route   GET /api/bookings/customer
export const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.user._id })
      .populate({
        path: "providerId",
        select: "name phone profileImage serviceType",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get provider bookings
// @route   GET /api/bookings/provider
export const getProviderBookings = async (req, res) => {
  try {
    // Since req.user is now the Provider document (from protect middleware),
    // we can use req.user._id directly.
    const bookings = await Booking.find({ providerId: req.user._id })
      .populate("customerId", "name phone email profileImage")
      .sort({ createdAt: -1 });

    // Sync totalBookings count from actual bookings
    const actualCount = await Booking.countDocuments({
      providerId: req.user._id,
    });
    await Provider.findByIdAndUpdate(req.user._id, {
      totalBookings: actualCount,
    });

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update booking status (provider accept/reject)
// @route   PUT /api/bookings/:id/status
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // IDOR Check: Ensure the current provider owns this booking
    // req.user is the Provider document, so we use req.user._id
    const isAuthorized =
      booking.providerId.toString() === req.user._id.toString();

    if (!isAuthorized) {
      // Fallback check for legacy data or potential mismatches
      // If req.user is NOT a provider but has a userId, check that?
      // Current system guarantees req.user is Provider for 'provider' role.

      console.warn(
        `[AUTH FAIL] Booking Provider: ${booking.providerId}, Req User: ${req.user._id}`,
      );
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this booking",
      });
    }

    booking.status = status;
    if (status === "completed") {
      booking.actualCost = booking.estimatedCost;
    }
    await booking.save();

    // Populate checking to ensure we have details for email
    const populatedBooking = await Booking.findById(booking._id)
      .populate("customerId", "name email phone")
      .populate("providerId", "name phone");

    // Socket.io notification
    notifyBookingUpdated(populatedBooking.customerId._id, populatedBooking);

    // Send Email to Customer based on status
    if (status === "accepted") {
      await sendEmail({
        to: populatedBooking.customerId.email,
        subject: "HomeFix: Booking Accepted",
        templateId:
          process.env.EMAILJS_TEMPLATE_ID_BOOKING_ACCEPTED ||
          process.env.EMAILJS_TEMPLATE_ID,
        templateParams: {
          email_type: "booking_accepted",
          customer_name: populatedBooking.customerId.name,
          provider_name: populatedBooking.providerId.name,
          provider_phone: populatedBooking.providerId.phone,
          service_type: populatedBooking.serviceType,
          booking_date: new Date(
            populatedBooking.bookingDate,
          ).toLocaleDateString("en-IN"),
          booking_time: populatedBooking.bookingTime,
          address_street: populatedBooking.address?.street || "",
          address_area: populatedBooking.address?.area || "",
          address_city: populatedBooking.address?.city || "Bangalore",
          address_pincode: populatedBooking.address?.pincode || "",
        },
      });
    } else if (status === "rejected") {
      await sendEmail({
        to: populatedBooking.customerId.email,
        subject: "HomeFix: Booking Rejected",
        templateId:
          process.env.EMAILJS_TEMPLATE_ID_BOOKING_REJECTED ||
          process.env.EMAILJS_TEMPLATE_ID,
        templateParams: {
          email_type: "booking_rejected",
          customer_name: populatedBooking.customerId.name,
          provider_name: populatedBooking.providerId.name,
          service_type: populatedBooking.serviceType,
          booking_date: new Date(
            populatedBooking.bookingDate,
          ).toLocaleDateString("en-IN"),
          booking_time: populatedBooking.bookingTime,
        },
      });
    }

    // Create Notification for Customer
    await Notification.create({
      userId: populatedBooking.customerId._id,
      userType: "Customer",
      type: status === "accepted" ? "BOOKING_ACCEPTED" : "BOOKING_REJECTED",
      message:
        status === "accepted"
          ? `Your booking with ${populatedBooking.providerId.name} has been accepted!`
          : `Your booking with ${populatedBooking.providerId.name} was rejected.`,
      relatedBookingId: booking._id,
    });

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "providerId",
    );

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking",
      });
    }

    booking.status = "cancelled";
    booking.cancellationReason = req.body.reason || "No reason provided";
    await booking.save();

    // Notify provider
    if (booking.providerId) {
      // If populated, use ._id, else it's already the ID
      const providerId = booking.providerId._id
        ? booking.providerId._id
        : booking.providerId;
      notifyBookingCancelled(providerId, booking);
    }

    // Send Emails for Cancellation
    const populatedBooking = await Booking.findById(booking._id)
      .populate("customerId", "name email phone")
      .populate("providerId", "name email phone");

    if (populatedBooking.providerId && populatedBooking.providerId.email) {
      // 1. To Provider (Booking Cancelled)
      await sendEmail({
        to: populatedBooking.providerId.email,
        subject: "HomeFix: Booking Cancelled",
        templateId:
          process.env.EMAILJS_TEMPLATE_ID_BOOKING_CANCELLED_PROVIDER ||
          process.env.EMAILJS_TEMPLATE_ID,
        templateParams: {
          email_type: "booking_cancelled_provider",
          provider_name: populatedBooking.providerId.name,
          customer_name: populatedBooking.customerId.name,
          customer_phone: populatedBooking.customerId.phone,
          service_type: populatedBooking.serviceType,
          booking_date: new Date(
            populatedBooking.bookingDate,
          ).toLocaleDateString("en-IN"),
          cancellation_reason: booking.cancellationReason,
        },
      });
    }

    // 2. To Customer (Cancellation Confirmation) - if initiated by customer (which it is enforced above)
    await sendEmail({
      to: populatedBooking.customerId.email,
      subject: "HomeFix: Cancellation Confirmed",
      templateId:
        process.env.EMAILJS_TEMPLATE_ID_BOOKING_CANCELLED_CUSTOMER ||
        process.env.EMAILJS_TEMPLATE_ID,
      templateParams: {
        email_type: "booking_cancelled_customer",
        customer_name: populatedBooking.customerId.name,
        provider_name: populatedBooking.providerId
          ? populatedBooking.providerId.name
          : "Provider",
      },
    });

    // Create Notifications
    if (populatedBooking.providerId) {
      await Notification.create({
        userId: populatedBooking.providerId._id,
        userType: "Provider",
        type: "BOOKING_CANCELLED",
        message: `Booking cancelled by ${populatedBooking.customerId.name}`,
        relatedBookingId: booking._id,
      });
    }

    await Notification.create({
      userId: populatedBooking.customerId._id,
      userType: "Customer",
      type: "BOOKING_CANCELLED",
      message: `Booking with ${
        populatedBooking.providerId
          ? populatedBooking.providerId.name
          : "Provider"
      } cancelled successfully`,
      relatedBookingId: booking._id,
    });

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit rating and review
// @route   POST /api/bookings/:id/review
export const submitReview = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    booking.rating = rating;
    booking.review = review || "";
    await booking.save();

    // Update provider's average rating
    const providerBookings = await Booking.find({
      providerId: booking.providerId,
      rating: { $exists: true, $gt: 0 },
    });

    const avgRating =
      providerBookings.reduce((sum, b) => sum + b.rating, 0) /
      providerBookings.length;

    await Provider.findByIdAndUpdate(booking.providerId, {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: providerBookings.length,
    });

    // Send Email to Provider (New Rating)
    const populatedBooking = await Booking.findById(booking._id)
      .populate("customerId", "name")
      .populate("providerId", "name email");

    if (populatedBooking.providerId && populatedBooking.providerId.email) {
      await sendEmail({
        to: populatedBooking.providerId.email,
        subject: "HomeFix: New Rating Received",
        templateId:
          process.env.EMAILJS_TEMPLATE_ID_RATING_RECEIVED ||
          process.env.EMAILJS_TEMPLATE_ID,
        templateParams: {
          email_type: "rating_received",
          provider_name: populatedBooking.providerId.name,
          customer_name: populatedBooking.customerId.name,
          rating,
          comment: review || "",
        },
      });
    }

    // Create Notification for Provider
    if (populatedBooking.providerId) {
      await Notification.create({
        userId: populatedBooking.providerId._id,
        userType: "Provider",
        type: "NEW_RATING",
        message: `You received a ${rating}-star rating from ${populatedBooking.customerId.name}`,
        relatedBookingId: booking._id,
      });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
export const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("customerId", "name phone email profileImage")
      .populate("providerId", "name phone profileImage serviceType");

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // IDOR Check: Allow access only if user is the customer OR the provider
    const isCustomer =
      booking.customerId._id.toString() === req.user._id.toString();

    // booking.providerId is populated with Provider object
    const isProvider =
      booking.providerId._id.toString() === req.user._id.toString();

    if (!isCustomer && !isProvider) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this booking",
      });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get provider availability
// @route   GET /api/bookings/availability/:providerId
export const getProviderAvailability = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    // Find all bookings for this provider on the given date
    // Status should be pending or accepted
    const bookings = await Booking.find({
      providerId,
      bookingDate: new Date(date),
      status: { $in: ["pending", "accepted"] },
    }).select("bookingTime estimatedDuration");

    // simplified: just return the booked times
    // In a more complex system, we might calculate available slots based on duration
    const bookedSlots = bookings.map((b) => ({
      time: b.bookingTime,
      duration: b.estimatedDuration,
    }));

    res.status(200).json({ success: true, bookedSlots });
  } catch (error) {
    console.error("Error fetching availability:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
