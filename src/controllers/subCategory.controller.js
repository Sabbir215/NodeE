import { deleteImage, uploadImage } from "../helpers/cloudinary.js";
import Category from "../models/category.model.js";
import Discount from "../models/discount.model.js";
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

  // Validate that the parent category exists first
  const parentCategory = await Category.findById(category);
  if (!parentCategory) {
    return next(new CustomError(400, 'Parent category not found'));
  }

  // Now create the subcategory
  const subCategory = new SubCategory({
    name,
    image,
    description,
    category,
  });

  // Update the parent category's subCategories array first
  const updatedCategory = await Category.findByIdAndUpdate(
    category,
    { $addToSet: { subCategories: subCategory._id } },
    { new: true }
  );

  if (!updatedCategory) {
    return next(new CustomError(500, 'Failed to update parent category'));
  }

  // Only save the subcategory if parent update succeeded
  await subCategory.save();

  apiResponse.sendSuccess(res, 201, "Sub-category created successfully", subCategory);
});

export const deleteSubCategory = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;

  const sub = await SubCategory.findOne({ slug });
  if (!sub) return next(new CustomError(404, "Sub-category not found"));

  // Check if subcategory has brands
  if (sub.brands && sub.brands.length > 0) {
    return next(new CustomError(400, 'Cannot delete sub-category with associated brands'));
  }

  // Delete all discounts associated with this subcategory
  if (sub.discounts && sub.discounts.length > 0) {
    const deleteResult = await Discount.deleteMany({ _id: { $in: sub.discounts } });
    console.log(`Deleted ${deleteResult.deletedCount} discounts associated with subcategory`);
  }

  // Remove reference from parent category
  if (sub.category) {
    const updatedParent = await Category.findByIdAndUpdate(
      sub.category,
      { $pull: { subCategories: sub._id } },
      { new: true }
    );
    
    if (!updatedParent) {
      return next(new CustomError(500, 'Failed to remove subcategory reference from parent category'));
    }
  }

  if (sub.image) await deleteImage(sub.image);

  const deletedSub = await SubCategory.findOneAndDelete({ slug });
  
  if (!deletedSub) {
    return next(new CustomError(500, "Failed to delete subcategory"));
  }

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
    // Ensure the new category exists
    const newParent = await Category.findById(category);
    if (!newParent) return next(new CustomError(400, 'Parent category not found'));

    // Only update if category is actually changing
    if (!sub.category || sub.category.toString() !== category.toString()) {
      // Remove from old parent category
      if (sub.category) {
        await Category.findByIdAndUpdate(
          sub.category,
          { $pull: { subCategories: sub._id } }
        );
      }
      
      // Add to new parent category
      await Category.findByIdAndUpdate(
        category,
        { $addToSet: { subCategories: sub._id } }
      );
      
      sub.category = category;
    }
  }

  await sub.save();
  apiResponse.sendSuccess(res, 200, "Sub-category updated successfully", sub);
});

export const getSubCategories = asyncHandler(async (req, res, next) => {
  const subs = await SubCategory.find()
    .populate('category discounts brands');
  apiResponse.sendSuccess(res, 200, "Sub-categories retrieved successfully", subs);
});

export const getSubCategoryBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const sub = await SubCategory.findOne({ slug })
    .populate('category discounts brands');
  if (!sub) return next(new CustomError(404, "Sub-category not found"));
  apiResponse.sendSuccess(res, 200, "Sub-category retrieved successfully", sub);
});
