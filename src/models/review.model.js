import mongoose, { Schema, Types } from "mongoose";
import CustomError from "../utils/customError.js";

const { ObjectId } = Types;

const reviewSchema = new Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    product: {
      type: ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      validate: {
        validator: function (v) {
          return Number.isInteger(v);
        },
        message: "Rating must be a whole number between 1 and 5",
      },
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      minlength: [10, "Comment must be at least 10 characters"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpful: {
      type: Number,
      default: 0,
      min: [0, "Helpful count cannot be negative"],
    },
    helpfulBy: [
      {
        type: ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "Status must be pending, approved, or rejected",
      },
      default: "pending",
    },
    adminResponse: {
      type: String,
      trim: true,
      maxlength: [500, "Admin response cannot exceed 500 characters"],
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [200, "Rejection reason cannot exceed 200 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Index for faster queries
reviewSchema.index({ product: 1, status: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: 1 });

// Pre-save validation: Ensure user hasn't already reviewed this product
reviewSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next();
  }

  try {
    const existingReview = await this.constructor.findOne({
      user: this.user,
      product: this.product,
    });

    if (existingReview) {
      throw new CustomError(400, "You have already reviewed this product");
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if review is approved
reviewSchema.methods.isApproved = function () {
  return this.status === "approved";
};

// Method to approve review
reviewSchema.methods.approve = function () {
  this.status = "approved";
  this.rejectionReason = undefined;
  return this.save();
};

// Method to reject review
reviewSchema.methods.reject = function (reason) {
  this.status = "rejected";
  this.rejectionReason = reason;
  return this.save();
};

// Method to mark review as helpful
reviewSchema.methods.markHelpful = async function (userId) {
  // Check if user already marked as helpful
  const alreadyMarked = this.helpfulBy.some(
    (id) => id.toString() === userId.toString()
  );

  if (alreadyMarked) {
    throw new CustomError(400, "You have already marked this review as helpful");
  }

  this.helpfulBy.push(userId);
  this.helpful = this.helpfulBy.length;
  return this.save();
};

// Method to unmark review as helpful
reviewSchema.methods.unmarkHelpful = async function (userId) {
  const index = this.helpfulBy.findIndex(
    (id) => id.toString() === userId.toString()
  );

  if (index === -1) {
    throw new CustomError(400, "You haven't marked this review as helpful");
  }

  this.helpfulBy.splice(index, 1);
  this.helpful = this.helpfulBy.length;
  return this.save();
};

// Static method to calculate average rating for a product
reviewSchema.statics.calculateProductRating = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        status: "approved",
      },
    },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    return {
      averageRating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: stats[0].totalReviews,
    };
  }

  return {
    averageRating: 0,
    totalReviews: 0,
  };
};

// Post-save hook: Update product rating after review is saved
reviewSchema.post("save", async function () {
  if (this.status === "approved") {
    await this.constructor.updateProductRating(this.product);
  }
});

// Post-remove hook: Update product rating after review is deleted
reviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await doc.constructor.updateProductRating(doc.product);
  }
});

// Post-update hook: Update product rating after review status changes
reviewSchema.post("findOneAndUpdate", async function (doc) {
  if (doc) {
    await doc.constructor.updateProductRating(doc.product);
  }
});

// Static method to update product rating
reviewSchema.statics.updateProductRating = async function (productId) {
  const Product = mongoose.model("Product");
  const stats = await this.calculateProductRating(productId);

  await Product.findByIdAndUpdate(productId, {
    averageRating: stats.averageRating,
    totalReviews: stats.totalReviews,
  });
};

const Review = mongoose.model("Review", reviewSchema);

export default Review;
