import mongoose, { Schema, Types } from "mongoose";
import slugify from "slugify";
import CustomError from "../utils/customError.js";
const { ObjectId } = Types;

const brandSchema = new Schema({
  name: {
    type: String,
    required: [true, "Brand name is required"],
    unique: [true, "Brand name exists"],
    trim: true,
    maxlength: 100,
  },
  image: {
    type: String,
    trim: true,
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
  since: {
    type: Number,
    required: [true, "Since year is required"],
    min: [1800, "Since year must be after 1800"],
    max: [new Date().getFullYear(), "Since year cannot be in the future"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true, versionKey: false });

// Generate slug before saving the brand
// Counting existing slugs and naming accordingly
// even though names are unique but for underscoring and hyphen preference e.g., brand-a, brand_a, brand---a, results are brand-a, brand-a-1, brand-a-2 subsequently
brandSchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isNew) {
    let slug = slugify(this.name, { replacement: '-', lower: true, strict: true });

    if (!slug) {
      return next(new CustomError(400, 'Invalid brand name'));
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

export default mongoose.model("Brand", brandSchema);