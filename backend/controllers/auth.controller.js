import crypto from "crypto";
import jwt from "jsonwebtoken";
import Customer from "../models/customer.model.js";
import Provider from "../models/provider.model.js";
import Admin from "../models/admin.model.js";
import cloudinary from "../config/cloudinary.js";
import {
  notifyProviderAvailabilityChanged,
  forceLogout,
  disconnectSocket,
} from "../services/socket.service.js";
import { sendEmail } from "../utils/email.js";
import { forgotPasswordTemplate } from "../utils/emailTemplates.js";

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide an email" });
    }

    // Check Customer collection first
    let user = await Customer.findOne({ email });

    // If not found, check Provider collection
    if (!user) {
      user = await Provider.findOne({ email });
    }

    // If not found, check Admin collection
    if (!user) {
      user = await Admin.findOne({ email });
    }

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expire (1 hour)
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const configuredFrontendUrls = (
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      "http://localhost:5173"
    )
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);

    const requestOrigin = req.get("origin");
    const frontendUrl =
      requestOrigin && configuredFrontendUrls.includes(requestOrigin)
        ? requestOrigin
        : process.env.NODE_ENV === "production"
          ? configuredFrontendUrls.find(
              (url) => !url.includes("localhost") && !url.includes("127.0.0.1"),
            ) || configuredFrontendUrls[0]
          : configuredFrontendUrls.find(
              (url) => url.includes("localhost") || url.includes("127.0.0.1"),
            ) || configuredFrontendUrls[0];

    const finalResetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const html = forgotPasswordTemplate(finalResetUrl);

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        html,
      });

      res.status(200).json({ success: true, message: "Email sent" });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res
        .status(500)
        .json({ success: false, message: "Email could not be sent" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
export const resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    const query = {
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    };

    // Check all collections
    let user = await Customer.findOne(query);
    if (!user) user = await Provider.findOne(query);
    if (!user) user = await Admin.findOne(query);

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Reset session after password change for security
    user.isLoggedIn = false;
    user.activeSessionId = null;
    if (user.socketId) {
      disconnectSocket(user.socketId);
    }
    user.socketId = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate JWT token
const generateToken = (user, sessionId) => {
  const role =
    user.userType ||
    (user.constructor?.modelName
      ? user.constructor.modelName.toLowerCase()
      : "customer");
  return jwt.sign(
    { id: user._id, role, sessionId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    },
  );
};

// Set token in HTTP-only cookie
const sendTokenResponse = (user, statusCode, res, sessionId) => {
  const token = generateToken(user, sessionId);

  const cookieOptions = {
    expires: new Date(Date.now() + 1 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  const { password, ...userData } = user._doc || user;

  res.status(statusCode).cookie("token", token, cookieOptions).json({
    success: true,
    token,
    user: userData,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      userType,
      serviceType,
      experience,
      pricePerHour,
      area,
      pincode,
      description,
      skills,
    } = req.body;

    // Check if user already exists in either collection
    const existingCustomer = await Customer.findOne({ email });
    const existingProvider = await Provider.findOne({ email });

    if (existingCustomer || existingProvider) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    let user;

    let profileImageUrl = "";
    if (req.file) {
      profileImageUrl = req.file.path;
    }

    if (userType === "provider") {
      user = await Provider.create({
        name,
        email,
        password, // Will be hashed by pre-save hook
        phone,
        userType: "provider",
        profileImage: profileImageUrl,
        serviceType: serviceType || "plumber",
        experience: experience || 0,
        pricePerHour: pricePerHour || 500,
        description: description || "",
        skills: skills || [],
        location: {
          area: area || "",
          city: "Bangalore",
          pincode: pincode || "",
        },
      });
    } else {
      // Default to customer
      user = await Customer.create({
        name,
        email,
        password, // Will be hashed by pre-save hook
        phone,
        userType: "customer",
        profileImage: profileImageUrl,
        address: {
          street: "",
          area: area || "",
          city: "Bangalore",
          pincode: pincode || "",
          landmark: "",
        },
      });
    }

    // Set session data for new user
    const sessionId = crypto.randomUUID();
    user.isLoggedIn = true;
    user.activeSessionId = sessionId;
    user.lastLoginAt = new Date();
    await user.save();

    sendTokenResponse(user, 201, res, sessionId);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    let user;
    if (userType === "provider") {
      user = await Provider.findOne({ email }).select("+password");
      if (!user) user = await Customer.findOne({ email }).select("+password");
      if (!user) user = await Admin.findOne({ email }).select("+password");
    } else if (userType === "admin") {
      user = await Admin.findOne({ email }).select("+password");
      if (!user) user = await Customer.findOne({ email }).select("+password");
      if (!user) user = await Provider.findOne({ email }).select("+password");
    } else {
      user = await Customer.findOne({ email }).select("+password");
      if (!user) user = await Provider.findOne({ email }).select("+password");
      if (!user) user = await Admin.findOne({ email }).select("+password");
    }

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // STRICT SESSION CHECK
    if (user.isLoggedIn) {
      // Logic: Emit force_logout to old socket, wait 5s to clear session
      if (user.socketId) {
        forceLogout(
          user.socketId,
          "Account logged in from another device. Logging out in 5 seconds.",
        );
      }

      // Schedule session invalidation after 5 seconds
      setTimeout(async () => {
        try {
          // Re-fetch user to avoid stale data
          let dbUser = await Customer.findById(user._id);
          if (!dbUser) dbUser = await Provider.findById(user._id);
          if (!dbUser) dbUser = await Admin.findById(user._id);

          if (dbUser) {
            dbUser.isLoggedIn = false;
            dbUser.activeSessionId = null;
            // Disconnect the socket from server side
            if (dbUser.socketId) {
              disconnectSocket(dbUser.socketId);
            }
            dbUser.socketId = null;
            await dbUser.save();
            console.log(`User ${dbUser.email} previous session invalidated.`);
          }
        } catch (err) {
          console.error("Error invalidating previous session:", err);
        }
      }, 5000);

      return res.status(409).json({
        success: false,
        message:
          "Account already logged in. Previous session will be terminated.",
      });
    }

    // Generate new Session ID
    const sessionId = crypto.randomUUID();

    // Update user session
    user.isLoggedIn = true;
    user.activeSessionId = sessionId;
    user.lastLoginAt = new Date();
    // socketId will be updated upon socket connection
    await user.save();

    sendTokenResponse(user, 200, res, sessionId);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    const user = req.user;

    if (user) {
      // Immediately update database
      user.isLoggedIn = false;
      user.activeSessionId = null;

      // Clean up socket if exists
      if (user.socketId) {
        disconnectSocket(user.socketId);
      }
      user.socketId = null;

      // If user is a provider, set availability to false
      if (user.userType === "provider") {
        user.availability = false;
        notifyProviderAvailabilityChanged(user._id, false);
      }

      await user.save();
      console.log(`User ${user.email} logged out and DB updated.`);
    }
  } catch (err) {
    console.error("Logout error:", err);
  }

  // Clear cookie
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({ success: true, message: "Logged out successfully" });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    // user is already attached to req by protect middleware
    const user = req.user;

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify token
// @route   GET /api/auth/verify-token
export const verifyToken = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { name, phone, address, ...otherUpdates } = req.body;

    // Handle stringified address if coming from FormData
    let parsedAddress = address;
    if (typeof address === "string") {
      try {
        parsedAddress = JSON.parse(address);
      } catch (e) {
        console.error("Error parsing address:", e);
      }
    }

    // Update basic fields
    if (name) user.name = name;
    if (phone) user.phone = phone;

    // Handle address specifically for customers
    if (user.userType === "customer" && parsedAddress) {
      user.address = { ...user.address, ...parsedAddress };
    }

    // Handle other updates based on user type
    if (user.userType === "provider") {
      if (otherUpdates.pricePerHour)
        user.pricePerHour = otherUpdates.pricePerHour;
      if (otherUpdates.description) user.description = otherUpdates.description;
      if (otherUpdates.experience) user.experience = otherUpdates.experience;
      // Add other provider specific fields as needed
    }

    // Handle Profile Image Upload
    if (req.file) {
      // If user has an existing cloudinary image, delete it
      if (user.profileImage && user.profileImage.includes("cloudinary")) {
        const publicId = user.profileImage.split("/").pop().split(".")[0];
        // We need the folder path too if it's in a folder.
        // URL: .../homefix/profiles/filename.jpg -> public_id: homefix/profiles/filename

        try {
          // Extract public ID more robustly
          const parts = user.profileImage.split("/");
          const filename = parts.pop().split(".")[0];
          const folder = parts.includes("homefix") ? "homefix/profiles" : ""; // basic check
          const fullPublicId = folder ? `${folder}/${filename}` : filename;

          // Or simpler: regex to get everything after 'upload/v.../' until extension?
          // Actually, multer-storage-cloudinary returns path as the full public_id usually?
          // Let's try to extract it from the URL.
          // format: https://res.cloudinary.com/cloudname/image/upload/v1234/homefix/profiles/imageId.jpg

          const regex = /\/v\d+\/(.+)\.[a-z]+$/;
          const match = user.profileImage.match(regex);

          if (match && match[1]) {
            await cloudinary.uploader.destroy(match[1]);
          }
        } catch (err) {
          console.error("Error deleting old image:", err);
        }
      }

      user.profileImage = req.file.path;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
