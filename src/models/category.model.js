import mongoose, { Schema, Types } from "mongoose";
import slugify from "slugify";
import CustomError from "../utils/customError.js";
const { ObjectId } = Types;

const categorySchema = new Schema({
  name: {
    type: String,
    required: [true, "Category name is required"],
    unique: [true, "Category name exists"],
    trim: true,
    maxlength: 100,
    // validate: {
    //   validator: function (v) {
    //     return validatorImport.isAlphanumeric(v.replace(/\s+/g, " "));
    //   },
    //   message: (props) => `${props.value} is not a valid category name!`,
    // },
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
  subCategories: [
    {
      type: ObjectId,
      ref: "subCategory",
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true, versionKey: false });

// Generate slug before saving the category
// Counting existing slugs and naming accordingly
// even though names are unique but for underscoring and hyphen preference e.g., category-a, category_a, category---a, results are category-a, category-a-1, category-a-2 subsequently
categorySchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isNew) {
    let slug = slugify(this.name, { replacement: '-', lower: true, strict: true });

    if (!slug) {
      return next(new CustomError(400, 'Invalid category name'));
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

// categorySchema.pre('save', async function (next) {
//   if (this.isModified('name')) {
//     const slug = slugify(this.name, {
//       lower: true,
//       // replacement: '-',
//       // trim: true,
//       // remove: undefined,
//       // strict: false,
//       // locale: 'vi',
//     });
//     // this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
//     if (!slug) {
//       return next(new CustomError(400, 'Invalid category name'));
//     }
//     if (slug && await this.constructor.findOne({ slug })) {
//         return next(new CustomError(400, 'Category slug already exists, choose a different name!'));
//     } else {
//         this.slug = slug;
//     }
//   }
//   next();
// });

categorySchema.pre('findOneAndDelete', async function (next) {
    const category = await this.model.findOne(this.getQuery());

    if (!category) {
        return next(new CustomError(404, 'Category not found'));
    }

    if (category.subCategories.length > 0) {
      return next(new CustomError(400, 'Cannot delete category with associated sub-categories'));
    }
    next();
});

export default mongoose.model("Category", categorySchema);