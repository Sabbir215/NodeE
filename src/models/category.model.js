import mongoose, { Schema, Types } from "mongoose";
import slugify from "slugify";
import validatorImport from "validator";
import CustomError from "../utils/customError.js";
const { ObjectId } = Types;

const categorySchema = new Schema({
  name: {
    type: String,
    required: [true, "Category name is required"],
    trim: true,
    maxlength: 100,
    unique: true,
    validate: {
      validator: function (v) {
        return validatorImport.isAlphanumeric(v.replace(/\s/g, ""));
      },
      message: (props) => `${props.value} is not a valid category name!`,
    },
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
  },
  subCategories: [
    {
      type: ObjectId,
      ref: "subCategory",
    },
  ],
//   parentCategory: {
//     type: ObjectId,
//     ref: "Category",
//   },
//   isFeatured: {
//     type: Boolean,
//     default: false,
//   },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true, versionKey: false });

categorySchema.pre('save', async function (next) {
  if (this.isModified('name')) {
    const slug = slugify(this.name, {
      lower: true,
      // replacement: '-',
      // trim: true,
      // remove: undefined,
      // strict: false,
      // locale: 'vi',
    });
    // this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    if (!slug) {
      return next(new CustomError(400, 'Invalid category name'));
    }
    if (slug && await this.constructor.findOne({ slug })) {
        return next(new CustomError(400, 'Category slug already exists, choose a different name!'));
    } else {
        this.slug = slug;
    }
  }
  next();
});

categorySchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update.name) {
    const existingCategory = await mongoose.model('Category').findOne({ name: update.name });
    if (existingCategory && !existingCategory._id.equals(this._conditions._id)) {
      throw new CustomError(400, 'Category name already exists');
    }
    update.slug = slugify(update.name, { lower: true});
  }
  this.setUpdate(update);
  next();
});

categorySchema.pre('findOneAndDelete', async function (next) {
    const category = await this.model.findOne(this.getQuery());
    if (category.subCategories && category.subCategories.length > 0) {
      return next(new CustomError(400, 'Cannot delete category with associated sub-categories'));
    }
    next();
});



export default mongoose.model("Category", categorySchema);