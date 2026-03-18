import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  },
);

// Compound index to prevent duplicate favorites
favoriteSchema.index({ customerId: 1, providerId: 1 }, { unique: true });

const Favorite = mongoose.model("Favorite", favoriteSchema);
export default Favorite;
