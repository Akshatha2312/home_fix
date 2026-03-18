import mongoose from "mongoose";
import dns from "dns";
import dotenv from "dotenv";
import Admin from "../models/admin.model.js";

dotenv.config();

// Force IPv4 and use Google DNS to resolve MongoDB Atlas SRV records
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    console.log("MongoDB Connected for Seeding");

    const adminEmail = process.env.ADMIN_EMAIL || "admin@homefix.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    // Check if admin exists
    const adminExists = await Admin.findOne({ email: adminEmail });

    if (adminExists) {
      console.log("Admin account already exists");
      process.exit();
    }

    // Create Admin
    await Admin.create({
      name: "Super Admin",
      email: adminEmail,
      password: adminPassword,
      userType: "admin",
    });

    console.log("Admin account created successfully");
    console.log(`Email: ${adminEmail}`);
    console.log("Password: (as set in environment or default)");

    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
