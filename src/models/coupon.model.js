import mongoose from "mongoose";
import slugify from "slugify";
import CustomError from "../utils/customError.js";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      enum: {
        values: ["percentage", "fixed"],
        message: "Discount type must be either 'percentage' or 'fixed'"
      },
      required: [true, "Discount type is required"],
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum purchase amount cannot be negative"],
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: [0, "Maximum discount amount cannot be negative"],
    },
    expireAt: {
      type: Date,
      required: [true, "Expiration date is required"],
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
      min: [1, "Usage limit must be at least 1"],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, "Used count cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    applicableTo: {
      type: String,
      enum: {
        values: ["all", "products", "cart"],
        message: "Applicable to must be 'all', 'products', or 'cart'"
      },
      default: "all",
    },
    applicableProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    }],
  },
  { timestamps: true, versionKey: false }
);

// Generate slug from code before save
couponSchema.pre("save", function (next) {
  if (this.isModified("code")) {
    this.slug = slugify(this.code, {
      replacement: "-",
      lower: true,
      strict: true,
      trim: true,
    });
  }
  next();
});

// Check for duplicate slug before save
couponSchema.pre("save", async function (next) {
  const existingCoupon = await this.constructor.findOne({ slug: this.slug });
  if (existingCoupon && existingCoupon._id.toString() !== this._id.toString()) {
    throw new CustomError(400, "Coupon code already exists");
  }
  next();
});

// Update slug when code changes in update
couponSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.code) {
    update.slug = slugify(update.code, {
      replacement: "-",
      lower: true,
      strict: true,
      trim: true,
    });
    this.setUpdate(update);
  }
  next();
});

// Custom validation for percentage discount
couponSchema.pre("save", function (next) {
  if (this.discountType === "percentage" && this.discountValue > 100) {
    throw new CustomError(400, "Percentage discount cannot exceed 100%");
  }
  next();
});

// Check if coupon is expired
couponSchema.methods.isExpired = function() {
  return new Date() > new Date(this.expireAt);
};

// Check if coupon usage limit reached
couponSchema.methods.isUsageLimitReached = function() {
  if (this.usageLimit === null) return false;
  return this.usedCount >= this.usageLimit;
};

// Calculate discount amount
couponSchema.methods.calculateDiscount = function(cartTotal) {
  if (this.discountType === "percentage") {
    const discount = (cartTotal * this.discountValue) / 100;
    // Apply max discount limit if set
    if (this.maxDiscountAmount) {
      return Math.min(discount, this.maxDiscountAmount);
    }
    return discount;
  } else {
    // Fixed discount
    return Math.min(this.discountValue, cartTotal);
  }
};

export default mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
