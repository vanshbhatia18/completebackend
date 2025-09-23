import mongoose, { Schema } from "mongoose";

const ProductReviewSchema = new mongoose.Schema(
  {
    productId: String,
    userId: String,
    userName: String,
    reviewMessage: String,
    reviewValue: Number,
  },
  { timestamps: true }
);

export const ProductReview = mongoose.model("ProductReview", ProductReviewSchema);