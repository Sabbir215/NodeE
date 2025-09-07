import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import CustomError from "../utils/customError.js";
import Category from "../models/category.model.js";

// Create a new category
export const createCategory = asyncHandler(async (req, res, next) => {
  const { name, image, description } = req.body;

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
  const category = await Category.findOneAndDelete({ slug });
  if (!category) {
    return next(new CustomError(404, "Category not found"));
  }
  apiResponse.sendSuccess(res, 200, true, "Category deleted successfully", null);
});
export const updateCategory = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const { name, image, description } = req.body;

  const category = await Category.findOne({ slug });
  if (!category) {
    return next(new CustomError(404, "Category not found"));
  }

  // Check if updating the name to one that already exists
  if (category.name === name) {
      return next(new CustomError(400, "Another category with this name already exists"));
  }

  if (name !== undefined) category.name = name;
  if (image !== undefined) category.image = image;
  if (description !== undefined) category.description = description;

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