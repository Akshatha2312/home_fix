import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const providerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    userType: {
      type: String,
      default: "provider",
      immutable: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isLoggedIn: {
      type: Boolean,
      default: false,
    },
    activeSessionId: {
      type: String,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    socketId: {
      type: String,
      default: null,
      index: true,
    },
    serviceType: {
      type: String,
      enum: [
        "plumber",
        "electrician",
        "painter",
        "mason",
        "cleaner",
        "carpenter",
      ],
      required: [true, "Service type is required"],
    },
    experience: {
      type: Number,
      required: [true, "Experience is required"],
      min: 0,
    },
    description: {
      type: String,
      default: "",
    },
    workImages: [
      {
        type: String,
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalBookings: {
      type: Number,
      default: 0,
    },
    availability: {
      type: Boolean,
      default: true,
    },
    location: {
      area: { type: String, default: "" },
      city: { type: String, default: "Bangalore" },
      pincode: { type: String, default: "" },
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    pricePerHour: {
      type: Number,
      required: [true, "Price per hour is required"],
      min: 0,
    },
    skills: [
      {
        type: String,
      },
    ],
    certifications: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
providerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
providerSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Provider = mongoose.model("Provider", providerSchema);
export default Provider;
