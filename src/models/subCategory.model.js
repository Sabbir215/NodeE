import mongoose, { Schema, Types } from "mongoose";
import slugify from "slugify";
import CustomError from "../utils/customError.js";
const { ObjectId } = Types;

const subCategorySchema = new Schema({
  name: {
    type: String,
    required: [true, "SubCategory name is required"],
    unique: [true, "SubCategory name exists"],
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
  category: {
    type: ObjectId,
    ref: "Category",
    required: [true, "Parent category is required"],
  },
  brands: [
    {
      type: ObjectId,
      ref: "Brand",
    },
  ],
  discounts: [
    {
      type: ObjectId,
      ref: "Discount",
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true, versionKey: false });

// Generate slug before saving the subCategory
subCategorySchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isNew) {
    let slug = slugify(this.name, { replacement: '-', lower: true, strict: true });

    if (!slug) {
      return next(new CustomError(400, 'Invalid subCategory name'));
    }

    let existing = await this.constructor.findOne({ slug });
    let count = (await this.constructor.find({ slug: new RegExp(`^${slug}(-\\d+)?$`, 'i') }).countDocuments());
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

export default mongoose.model("SubCategory", subCategorySchema);
export { subCategorySchema };
