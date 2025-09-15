import { deleteImage, uploadImage } from "../helpers/cloudinary.js";
import Category from "../models/category.model.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import CustomError from "../utils/customError.js";
import categoryValidationSchema from "../validations/category.validation.js";

// Create a new category
export const createCategory = asyncHandler(async (req, res, next) => {

  // Validate category data
  const validatedData = await categoryValidationSchema(req);
  if (validatedData.error) {
    return next(new CustomError(400, validatedData.error.details));
  }
  // If an image file is provided, upload it to Cloudinary
  if (req.file) {
      validatedData.image = await uploadImage(req.file.path);
  }
  const { name, image, description } = validatedData;

  // Check if category with the same name already exists
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    return next(new CustomError(400, "Category with this name already exists"));
  }

  const category = new Category({
    name,
    image,
    description,
  });

  await category.save();

  apiResponse.sendSuccess(res, 201, "Category created successfully", category);
});

export const deleteCategory = asyncHandler(async (req, res, next) => {
    const { slug } = req.params;
    
    // First, find the category to check sub-categories
    const category = await Category.findOne({ slug });
    if (!category) {
        return next(new CustomError(404, "Category not found"));
    }
    
    // Check for sub-categories
    if (category.subCategories && category.subCategories.length > 0) {
        return next(new CustomError(400, 'Cannot delete category with associated sub-categories'));
    }
    
    // Delete the category
    await Category.findOneAndDelete({ slug });
    
    // Delete image if exists
    if (category.image) await deleteImage(category.image);
    
    apiResponse.sendSuccess(res, 200, "Category deleted successfully", null);
});

export const updateCategory = asyncHandler(async (req, res, next) => {

  const { slug } = req.params;
  const category = await Category.findOne({ slug });
  if (!category) {
    return next(new CustomError(404, "Category not found"));
  }

  // otherwise validator will be upset
  if (!req.body.name) req.body.name = category.name;

  // Validate category data
  const validatedData = await categoryValidationSchema(req);
  console.log(validatedData);
  if (validatedData.error) {
    return next(new CustomError(400, validatedData.error.details));
  }
  // If an image file is provided, upload it to Cloudinary
  if (req.file) {
      validatedData.image = await uploadImage(req.file.path);
  }
  
  const { name, image, description } = validatedData;

  if (name) category.name = name;
  if (image) {
    if (category.image) await deleteImage(category.image);
    category.image = image;
  }
  if (description) category.description = description;

  await category.save();

  apiResponse.sendSuccess(res, 200, "Category updated successfully", category);
});
export const getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find();
  apiResponse.sendSuccess(res, 200, "Categories retrieved successfully", categories);
});
export const getCategoryBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const category = await Category.findOne({ slug });
  if (!category) {
    return next(new CustomError(404, "Category not found"));
  }
  apiResponse.sendSuccess(res, 200, "Category retrieved successfully", category);
});