import express from "express";
import { createServer } from "http";
import net from "net";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import connectDB, {
  ensureDBConnection,
  getDBStatus,
  validateRequiredEnv,
} from "./config/db.js";
import { initSocket } from "./services/socket.service.js";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import providerRoutes from "./routes/provider.routes.js";
import favoriteRoutes from "./routes/favorite.routes.js";
import adminRoutes from "./routes/admin.route.js";

// Load env vars
dotenv.config();

const app = express();
const isVercel = process.env.VERCEL === "1";

app.set("trust proxy", 1);

const configuredOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "https://home-fix.vercel.app",
  "https://home-drgzjd5t1-portfolios-projects-350917fc.vercel.app",
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : []),
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : []),
]
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  return configuredOrigins.includes(origin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

let httpServer;

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});

if (!validateRequiredEnv()) {
  console.warn(
    "⚠️ Server is starting with missing required environment variables",
  );
}

if (!isVercel) {
  httpServer = createServer(app);

  // Socket.io setup (local/self-hosted only)
  const io = new Server(httpServer, {
    cors: {
      ...corsOptions,
      methods: ["GET", "POST"],
    },
  });
  initSocket(io);
}

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});
app.use("/api", limiter);

app.use("/api", async (req, res, next) => {
  if (req.path === "/health") {
    return next();
  }

  const isDbAvailable = await ensureDBConnection();
  if (!isDbAvailable) {
    return res.status(503).json({
      success: false,
      message: "Database unavailable. Please try again shortly.",
    });
  }

  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", async (req, res) => {
  if (!process.env.MONGODB_URI && !process.env.MONGODB_URI_SRV) {
    return res.status(503).json({
      success: false,
      message: "HomeFix API running, but database is not configured",
      timestamp: new Date(),
      db: "not-configured",
    });
  }

  const isDbAvailable = await ensureDBConnection();
  const dbState = getDBStatus();

  res.status(isDbAvailable ? 200 : 503).json({
    success: isDbAvailable,
    message: isDbAvailable
      ? "HomeFix API is running 🏠"
      : "HomeFix API running, but database is unavailable",
    timestamp: new Date(),
    db: dbState,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// Connect to DB eagerly only for non-serverless runtime
if (!isVercel) {
  connectDB().catch((error) => {
    console.error("❌ Initial DB connection failed:", error.message);
  });
}

if (!isVercel) {
  const startPort = Number(process.env.PORT) || 5000;
  const hasManagedPort = Boolean(process.env.PORT);

  const isPortAvailable = (port) =>
    new Promise((resolve) => {
      const tester = net
        .createServer()
        .once("error", (error) => {
          if (error.code === "EADDRINUSE") {
            resolve(false);
            return;
          }
          resolve(false);
        })
        .once("listening", () => {
          tester.close(() => resolve(true));
        })
        .listen(port);
    });

  const startServer = async (port) => {
    if (hasManagedPort) {
      httpServer.listen(port, () => {
        console.log(`\n🏠 HomeFix API Server running on port ${port}`);
        console.log(`📡 Socket.io ready for connections`);
        console.log(
          `🌍 Environment: ${process.env.NODE_ENV || "development"}\n`,
        );
      });
      return;
    }

    let chosenPort = port;
    const available = await isPortAvailable(chosenPort);

    if (!available) {
      chosenPort = chosenPort + 1;
      console.warn(
        `⚠️ Port ${port} is already in use. Starting on ${chosenPort}...`,
      );
    }

    httpServer.listen(chosenPort, () => {
      console.log(`\n🏠 HomeFix API Server running on port ${chosenPort}`);
      console.log(`📡 Socket.io ready for connections`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}\n`);
    });
  };

  startServer(startPort);
}

export default app;
