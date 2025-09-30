import mongoose, { Schema, Types } from "mongoose";
import slugify from "slugify";
import CustomError from "../utils/customError.js";

const { ObjectId } = Types;

const productSchema = new Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    unique: [true, "Product name exists"],
    trim: true,
    maxlength: 150,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  category: {
    type: ObjectId,
    ref: "Category",
    required: [true, "Category is required"],
  },
  subCategory: {
    type: ObjectId,
    ref: "SubCategory",
    required: [true, "SubCategory is required"],
  },
  brand: {
    type: ObjectId,
    ref: "Brand",
    required: [true, "Brand is required"],
  },
  variants: [
    {
      type: ObjectId,
      ref: "Variant",
    },
  ],
  discounts: [
    {
      type: ObjectId,
      ref: "Discount",
    },
  ],
  images: [
    {
      type: String,
      trim: true,
    },
  ],
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  sku: {
    type: String,
    required: [true, "SKU is required"],
    unique: [true, "SKU exists"],
    uppercase: true,
    trim: true,
    maxlength: 80,
  },
  variantType: {
    type: String,
    enum: ["single", "multiple"],
    default: "single",
  },
  retailPrice: {
    type: Number,
    required: [true, "Retail price is required"],
    min: [0, "Retail price cannot be negative"],
  },
  wholesalePrice: {
    type: Number,
    min: [0, "Wholesale price cannot be negative"],
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, "Stock cannot be negative"],
  },
  alertQuantity: {
    type: Number,
    default: 0,
    min: [0, "Alert quantity cannot be negative"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true, versionKey: false });

productSchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isNew) {
    let slug = slugify(this.name, { replacement: '-', lower: true, strict: true });

    if (!slug) {
      return next(new CustomError(400, 'Invalid product name'));
    }

    let existing = await this.constructor.findOne({ slug });
    let count = (await this.constructor.find({ slug: new RegExp(`^${slug}(-\\d+)?$`, 'i') }).countDocuments());
    console.log('Slug count:', count);
    if (count > 0) count += 1;
    const baseSlug = slug;

    while (existing && existing._id.toString() !== this._id.toString()) {
      slug = `${baseSlug}-${count++}`;
      existing = await this.constructor.findOne({ slug });
    }

    this.slug = slug;
  }
  next();
});

export default mongoose.model("Product", productSchema);
