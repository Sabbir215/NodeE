import { deleteImage, uploadImage } from "../helpers/cloudinary.js";
import Category from "../models/category.model.js";
import SubCategory from "../models/subCategory.model.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import CustomError from "../utils/customError.js";
import subCategoryValidationSchema from "../validations/subCategory.validation.js";

// Create a new sub-category
export const createSubCategory = asyncHandler(async (req, res, next) => {

  // Validate sub-category data
  const validatedData = await subCategoryValidationSchema(req);
  if (validatedData.error) {
    return next(new CustomError(400, validatedData.error.details));
  }

  // If an image file is provided, upload it to Cloudinary
  if (req.file) {
    validatedData.image = await uploadImage(req.file.path);
  }

  const { name, image, description, category } = validatedData;

  const subCategory = new SubCategory({
    name,
    image,
    description,
    category,
  });

  // ensure the parent category exists and update its subCategories array
  const parent = await Category.findById(category, {
    push: { subCategories: subCategory._id }
  },{
    new: true
  });
  if (!parent) return next(new CustomError(400, 'Parent category not found'));
  
  await parent.save();
  await subCategory.save();

  apiResponse.sendSuccess(res, 201, "Sub-category created successfully", subCategory);
});

export const deleteSubCategory = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;

  const sub = await SubCategory.findOne({ slug });
  if (!sub) return next(new CustomError(404, "Sub-category not found"));

  // remove reference from parent category
  if (sub.category) {
    console.log(sub.category)
    const parent = await Category.findById(sub.category, {
        pull: { subCategories: sub._id },
        new: true
    });
      await parent.save();
    }

  if (sub.image) await deleteImage(sub.image);
  await SubCategory.findOneAndDelete({ slug });

  apiResponse.sendSuccess(res, 200, "Sub-category deleted successfully", null);
});

export const updateSubCategory = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const sub = await SubCategory.findOne({ slug });
  if (!sub) return next(new CustomError(404, "Sub-category not found"));

  // otherwise validator will be upset
  if (!req.body.name) req.body.name = sub.name;

  const validatedData = await subCategoryValidationSchema(req);
  if (validatedData.error) return next(new CustomError(400, validatedData.error.details));

  if (req.file) {
    validatedData.image = await uploadImage(req.file.path);
  }

  const { name, image, description, category } = validatedData;

  if (name) sub.name = name;
  if (image) {
    if (sub.image) await deleteImage(sub.image);
    sub.image = image;
  }
  if (description) sub.description = description;
  if (category) {
    // ensure the new category exists and update parent arrays accordingly
    const newParent = await Category.findById(category);
    if (!newParent) return next(new CustomError(400, 'Parent category not found'));

    if (!sub.category || sub.category.toString() !== category.toString()) {
      // remove from old parent
      if (sub.category) {
        const oldParent = await Category.findById(sub.category);
        if (oldParent && oldParent.subCategories) {
          oldParent.subCategories = oldParent.subCategories.filter(id => id.toString() !== sub._id.toString());
          await oldParent.save();
        }
      }
      // add to new parent
      newParent.subCategories.push(sub._id);
      await newParent.save();
      sub.category = category;
    }
  }

  await sub.save();
  apiResponse.sendSuccess(res, 200, "Sub-category updated successfully", sub);
});

export const getSubCategories = asyncHandler(async (req, res, next) => {
  const subs = await SubCategory.find().populate('category', 'name slug subCategories image description');
  apiResponse.sendSuccess(res, 200, "Sub-categories retrieved successfully", subs);
});

export const getSubCategoryBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const sub = await SubCategory.findOne({ slug }).populate('category', 'name slug subCategories image description');
  if (!sub) return next(new CustomError(404, "Sub-category not found"));
  apiResponse.sendSuccess(res, 200, "Sub-category retrieved successfully", sub);
});
