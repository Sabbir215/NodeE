import mongoose, { Schema, Types } from "mongoose";
import slugify from "slugify";
import CustomError from "../utils/customError.js";

const { ObjectId } = Types;

const variantSchema = new Schema({
  product: {
    type: ObjectId,
    ref: "Product",
    required: [true, "Product reference is required"],
  },
  name: {
    type: String,
    required: [true, "Variant name is required"],
    trim: true,
    maxlength: 150,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  size: {
    type: String,
    trim: true,
    // default: "N/A",
  },
  color: {
    type: String,
    trim: true,
    // default: "N/A",
  },
  stock: {
    type: Number,
    required: [true, "Variant stock is required"],
    min: [0, "Variant stock cannot be negative"],
  },
  alertStock: {
    type: Number,
    default: 5,
    min: [0, "Alert stock cannot be negative"],
  },
  retailPrice: {
    type: Number,
    required: [true, "Variant retail price is required"],
    min: [0, "Retail price cannot be negative"],
  },
  wholesalePrice: {
    type: Number,
    min: [0, "Wholesale price cannot be negative"],
  },
  images: [
    {
      type: String,
      trim: true,
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true, versionKey: false });

variantSchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isNew) {
    let slug = slugify(this.name, { replacement: '-', lower: true, strict: true });

    if (!slug) {
      return next(new CustomError(400, 'Invalid variant name'));
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

export default mongoose.models.Variant || mongoose.model("Variant", variantSchema);
