// Socket.io service for real-time notifications

import Customer from "../models/customer.model.js";
import Provider from "../models/provider.model.js";
import Admin from "../models/admin.model.js";

let io;
// Track socketId -> userId
const socketUserMap = new Map();

export const initSocket = (socketIo) => {
  io = socketIo;

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join user-specific room
    socket.on("join", async (userId) => {
      socket.join(userId);
      console.log(`👤 User ${userId} joined their room`);

      // Add to map
      socketUserMap.set(socket.id, userId);

      // Update user socketId in DB
      try {
        let user = await Customer.findById(userId);
        if (!user) user = await Provider.findById(userId);
        if (!user) user = await Admin.findById(userId);

        if (user) {
          user.socketId = socket.id;
          await user.save();
        }
      } catch (err) {
        console.error("Error updating socketId:", err);
      }

      // Broadcast unique online user IDs
      broadcastOnlineUsers();
    });

    // Join admin room
    socket.on("join-admin", () => {
      socket.join("admin");
      console.log(`🛡️ Admin joined admin room`);
    });

    // Handle disconnect with debounce to prevent flickering on refresh
    socket.on("disconnect", async () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);

      // Clear the mapping immediately so we don't broadcast them as online
      if (socketUserMap.has(socket.id)) {
        const userId = socketUserMap.get(socket.id);
        socketUserMap.delete(socket.id);
        broadcastOnlineUsers();

        // 5-second delay before creating DB update
        // We use a timeout to allow for "instant" reconnects (like page refresh)
        setTimeout(async () => {
          // Check if user has reconnected with a new socket ID
          const isUserOnline = Array.from(socketUserMap.values()).includes(
            userId,
          );

          if (!isUserOnline) {
            try {
              // User is truly offline, update DB
              let user = await Customer.findByIdAndUpdate(userId, {
                isLoggedIn: false,
                socketId: null,
              });

              if (!user) {
                user = await Provider.findByIdAndUpdate(userId, {
                  isLoggedIn: false,
                  socketId: null,
                });
              }

              if (user) {
                console.log(
                  `User ${userId} marked as offline in DB (after timeout)`,
                );
              }
            } catch (err) {
              console.error("Error updating user offline status:", err);
            }
          } else {
            console.log(
              `User ${userId} reconnected, skipping DB offline update`,
            );
          }
        }, 5000);
      }
    });
  });
};

const broadcastOnlineUsers = () => {
  if (!io) return;
  // Get unique user IDs
  const uniqueUsers = Array.from(new Set(socketUserMap.values()));
  io.emit("online-users", uniqueUsers);
};

// Emit notification to a specific user
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(userId.toString()).emit(event, data);
  }
};

// Notification events
/**
 * Notify provider of a new booking request
 * @param {string} providerId
 * @param {object} booking
 */
export const notifyNewBooking = (providerId, booking) => {
  emitToUser(providerId, "new-booking", {
    type: "new-booking",
    message: `New booking request for ${booking.serviceType}`,
    booking,
  });

  // Notify Admins
  if (io) {
    io.to("admin").emit("new-booking", {
      type: "new-booking",
      message: `New booking: ${booking.serviceType}`,
      booking,
    });
  }
};

export const notifyBookingAccepted = (customerId, booking) => {
  emitToUser(customerId, "booking-accepted", {
    type: "booking-accepted",
    message: `Your booking has been accepted!`,
    booking,
  });
};

export const notifyBookingRejected = (customerId, booking) => {
  emitToUser(customerId, "booking-rejected", {
    type: "booking-rejected",
    message: `Your booking has been rejected`,
    booking,
  });
};

export const notifyPaymentConfirmed = (userId, payment) => {
  emitToUser(userId, "payment-confirmed", {
    type: "payment-confirmed",
    message: `Payment of ₹${payment.amount} confirmed`,
    payment,
  });
};

export const notifyBookingUpdated = (customerId, booking) => {
  emitToUser(customerId, "booking-updated", {
    type: "booking-updated",
    message: `Booking status updated to ${booking.status}`,
    booking,
  });

  // Notify Admins
  if (io) {
    io.to("admin").emit("booking-updated", {
      type: "booking-updated",
      message: `Booking status: ${booking.status}`,
      booking,
    });
  }
};

/**
 * Notify provider and admin of booking cancellation
 * @param {string} providerId
 * @param {object} booking
 */
export const notifyBookingCancelled = (providerId, booking) => {
  emitToUser(providerId, "booking-cancelled", {
    type: "booking-cancelled",
    message: `Booking cancelled: ${
      booking.cancellationReason || "Customer cancelled"
    }`,
    booking,
  });

  // Notify Admins
  if (io) {
    io.to("admin").emit("booking-updated", {
      type: "booking-updated",
      message: `Booking cancelled`,
      booking,
    });
  }
};

export const notifyProviderAvailabilityChanged = (providerId, isAvailable) => {
  if (io) {
    io.emit("provider-availability-changed", { providerId, isAvailable });
  }
};

export const forceLogout = (socketId, message) => {
  if (io && socketId) {
    io.to(socketId).emit("force_logout", {
      message:
        message || "Logged in from another device. Logging out in 5 seconds.",
    });
  }
};

export const disconnectSocket = (socketId) => {
  if (io && socketId) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.disconnect(true);
      console.log(`🔌 Forcibly disconnected socket: ${socketId}`);
    }
  }
};

export default {
  initSocket,
  emitToUser,
  notifyNewBooking,
  notifyBookingAccepted,
  notifyBookingRejected,
  notifyPaymentConfirmed,
  notifyBookingUpdated,
  notifyBookingCancelled,
  notifyProviderAvailabilityChanged,
  forceLogout,
  disconnectSocket,
};
