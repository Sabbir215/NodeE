import mongoose, { Schema, Types } from "mongoose";
import slugify from "slugify";
import CustomError from "../utils/customError.js";
const { ObjectId } = Types;

const discountSchema = new Schema({
  discountName: {
    type: String,
    required: [true, "Discount name is required"],
    unique: [true, "Discount name exists"],
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  discountValidFrom: {
    type: Date,
    required: [true, "Discount valid from date is required"],
  },
  discountValidTo: {
    type: Date,
    required: [true, "Discount valid to date is required"],
  },
  discountValueByAmount: {
    type: Number,
    default: 0,
    min: [0, "Discount amount cannot be negative"],
  },
  discountValueByPercentage: {
    type: Number,
    default: 0,
    min: [0, "Discount percentage cannot be negative"],
    max: [100, "Discount percentage cannot exceed 100"],
  },
  discountType: {
    type: String,
    enum: ['tk', 'percentage'],
    required: [true, "Discount type is required"],
  },
  discountPlan: {
    type: String,
    enum: ['flat', 'category', 'product', 'subcategory', 'brand'],
    required: [true, "Discount plan is required"],
  },
  targetProduct: {
    type: ObjectId,
    ref: 'Product',
  },
  targetCategory: {
    type: ObjectId,
    ref: 'Category',
  },
  targetSubCategory: {
    type: ObjectId,
    ref: 'SubCategory',
  },
  targetBrand: {
    type: ObjectId,
    ref: 'Brand',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true, versionKey: false });

// Generate slug before saving the discount
// Counting existing slugs and naming accordingly
// even though names are unique but for underscoring and hyphen preference e.g., discount-a, discount_a, discount---a, results are discount-a, discount-a-1, discount-a-2 subsequently
discountSchema.pre('save', async function (next) {
  if (this.isModified('discountName') || this.isNew) {
    let slug = slugify(this.discountName, { replacement: '-', lower: true, strict: true });

    if (!slug) {
      return next(new CustomError(400, 'Invalid discount name'));
    }

    let existing = await this.constructor.findOne({ slug });
    let count = (await this.constructor.find({ slug: new RegExp(`^${slug}(-\\d+)?$`, 'i') }).countDocuments());
    console.log('Slug count:', count);
    if (count > 0) count += 1; // Increment count if there are existing slugs
    const baseSlug = slug;

    while (existing && existing._id.toString() !== this._id.toString()) {
      slug = `${baseSlug}-${count++}`;
      existing = await this.constructor.findOne({ slug });
    }

    this.slug = slug;
  }
  next();
});

export default mongoose.model("Discount", discountSchema);