import mongoose from "mongoose";
import dns from "dns";

let connectionPromise;

const getDnsServers = () => {
  const configured = process.env.MONGODB_DNS_SERVERS;
  if (!configured) {
    return ["8.8.8.8", "1.1.1.1"];
  }

  const servers = configured
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return servers.length > 0 ? servers : ["8.8.8.8", "1.1.1.1"];
};

const isSrvDnsError = (error) => {
  const message = error?.message || "";
  return (
    message.includes("querySrv ECONNREFUSED") ||
    message.includes("querySrv ETIMEOUT")
  );
};

const getMongoUri = () => {
  const isVercel = process.env.VERCEL === "1";
  if (isVercel && process.env.MONGODB_URI_SRV) {
    return process.env.MONGODB_URI_SRV;
  }
  return process.env.MONGODB_URI || process.env.MONGODB_URI_SRV;
};

const validateMongoUri = (mongoUri) => {
  if (!mongoUri) {
    return {
      valid: false,
      reason: "MONGODB_URI (or MONGODB_URI_SRV) is missing",
    };
  }

  const isSrv = mongoUri.startsWith("mongodb+srv://");
  const hasMultipleHosts = mongoUri.includes(",");

  if (isSrv && hasMultipleHosts) {
    return {
      valid: false,
      reason:
        "mongodb+srv URI cannot include multiple hosts. Use a single Atlas SRV host (cluster0.xxxxx.mongodb.net) or use mongodb:// for multi-host URIs.",
    };
  }

  return { valid: true };
};

export const validateRequiredEnv = () => {
  const requiredVars = ["JWT_SECRET"];
  const missing = requiredVars.filter((name) => !process.env[name]);
  const mongoUri = getMongoUri();
  const mongoValidation = validateMongoUri(mongoUri);

  if (missing.length > 0 || !mongoValidation.valid) {
    const messages = [];
    if (missing.length > 0) {
      messages.push(
        `Missing required environment variables: ${missing.join(", ")}`,
      );
    }
    if (!mongoValidation.valid) {
      messages.push(mongoValidation.reason);
    }
    console.error(`❌ ${messages.join(" | ")}`);
    return false;
  }

  return true;
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    const mongoUri = getMongoUri();
    const mongoValidation = validateMongoUri(mongoUri);
    if (!mongoValidation.valid) {
      throw new Error(mongoValidation.reason);
    }

    connectionPromise = mongoose.connect(mongoUri);
    const conn = await connectionPromise;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    connectionPromise = null;

    const mongoUri = getMongoUri();
    const shouldRetryWithCustomDns =
      mongoUri?.startsWith("mongodb+srv://") && isSrvDnsError(error);

    if (shouldRetryWithCustomDns) {
      try {
        const dnsServers = getDnsServers();
        dns.setServers(dnsServers);
        console.warn(
          `⚠️ MongoDB SRV DNS lookup failed. Retrying with custom DNS servers: ${dnsServers.join(
            ", ",
          )}`,
        );

        connectionPromise = mongoose.connect(mongoUri);
        const conn = await connectionPromise;
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (retryError) {
        connectionPromise = null;
        console.error(`❌ MongoDB Connection Error: ${retryError.message}`);
        throw retryError;
      }
    }

    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

export const ensureDBConnection = async () => {
  try {
    await connectDB();
    return true;
  } catch {
    return false;
  }
};

export const getDBStatus = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return states[mongoose.connection.readyState] || "unknown";
};

export default connectDB;
