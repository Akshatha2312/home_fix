import jwt from "jsonwebtoken";
import Customer from "../models/customer.model.js";
import Provider from "../models/provider.model.js";
import Admin from "../models/admin.model.js";

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in cookies first, then Authorization header
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    let inferredRole = decoded.role || "customer";

    // Prioritize collection lookup based on JWT role claim
    if (decoded.role === "provider") {
      user = await Provider.findById(decoded.id);
      inferredRole = "provider";
      if (!user) {
        user = await Customer.findById(decoded.id);
        if (user) inferredRole = "customer";
      }
      if (!user) {
        user = await Admin.findById(decoded.id);
        if (user) inferredRole = "admin";
      }
    } else if (decoded.role === "admin") {
      user = await Admin.findById(decoded.id);
      inferredRole = "admin";
      if (!user) {
        user = await Customer.findById(decoded.id);
        if (user) inferredRole = "customer";
      }
      if (!user) {
        user = await Provider.findById(decoded.id);
        if (user) inferredRole = "provider";
      }
    } else {
      user = await Customer.findById(decoded.id);
      inferredRole = "customer";
      if (!user) {
        user = await Provider.findById(decoded.id);
        if (user) inferredRole = "provider";
      }
      if (!user) {
        user = await Admin.findById(decoded.id);
        if (user) inferredRole = "admin";
      }
    }

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    req.user = user;
    if (!req.user.userType) {
      req.user.userType = inferredRole;
    }

    // Check if user is logged in and session matches
    if (
      !req.user.isLoggedIn ||
      (req.user.activeSessionId &&
        decoded.sessionId &&
        req.user.activeSessionId !== decoded.sessionId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Session expired or logged in from another device.",
      });
    }

    next();
  } catch (error) {
    console.error(error);
    if (error.name === "TokenExpiredError") {
      // Decode the token without verification to get the user ID
      const decoded = jwt.decode(req.headers.authorization?.split(" ")[1]);
      if (decoded && decoded.id) {
        try {
          // Update user status to logged out
          let user = await Customer.findByIdAndUpdate(decoded.id, {
            isLoggedIn: false,
            socketId: null,
            activeSessionId: null,
          });

          if (!user) {
            await Provider.findByIdAndUpdate(decoded.id, {
              isLoggedIn: false,
              socketId: null,
              activeSessionId: null,
            });
          }
        } catch (dbError) {
          console.error("Error updating user status on token expiry:", dbError);
        }
      }
      return res
        .status(401)
        .json({ success: false, message: "Token expired, please login again" });
    }
    return res.status(401).json({ success: false, message: "Not authorized" });
  }
};

// Authorize specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.userType || req.user?.role;
    if (!roles.includes(userRole)) {
      console.warn(
        `[AUTH 403] Route '${req.originalUrl}' requested. User ID: ${req.user?._id}, Role: '${userRole}', Required: [${roles.join(", ")}]`
      );
      return res.status(403).json({
        success: false,
        message: `User role '${userRole}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Optional user restoration - for public routes that can benefit from user context
export const restoreUser = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    let inferredRole = decoded.role || "customer";

    if (decoded.role === "provider") {
      user = await Provider.findById(decoded.id);
      inferredRole = "provider";
      if (!user) {
        user = await Customer.findById(decoded.id);
        if (user) inferredRole = "customer";
      }
      if (!user) {
        user = await Admin.findById(decoded.id);
        if (user) inferredRole = "admin";
      }
    } else if (decoded.role === "admin") {
      user = await Admin.findById(decoded.id);
      inferredRole = "admin";
      if (!user) {
        user = await Customer.findById(decoded.id);
        if (user) inferredRole = "customer";
      }
      if (!user) {
        user = await Provider.findById(decoded.id);
        if (user) inferredRole = "provider";
      }
    } else {
      user = await Customer.findById(decoded.id);
      inferredRole = "customer";
      if (!user) {
        user = await Provider.findById(decoded.id);
        if (user) inferredRole = "provider";
      }
      if (!user) {
        user = await Admin.findById(decoded.id);
        if (user) inferredRole = "admin";
      }
    }

    if (user && user.isLoggedIn) {
      if (!user.userType) {
        user.userType = inferredRole;
      }
      // Validate session if needed
      if (
        !user.activeSessionId ||
        !decoded.sessionId ||
        user.activeSessionId === decoded.sessionId
      ) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // If token is invalid, just proceed without req.user
    next();
  }
};
