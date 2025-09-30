import Joi from "joi";
import mongoose from "mongoose";
import customError from "../utils/customError.js";

// Helper: check valid ObjectId with optional empty allowance
const isValidObjectId = (value, helpers) => {
  if (value === "" || value === null || value === undefined) {
    return value;
  }
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("objectId.invalid");
  }
  return value;
};

const variantValidationSchema = Joi.object({
  product: Joi.string().required().custom(isValidObjectId).messages({
    "any.required": "Product reference is required.",
    "objectId.invalid": "Product ID must be a valid MongoDB ObjectId format.",
  }),
  name: Joi.string()
    .required()
    .max(150)
    .messages({
      "string.empty": "Variant name is required.",
      "string.max": "Variant name must be at most 150 characters long.",
    }),
  description: Joi.string().max(1000).allow("", null).messages({
    "string.max": "Description must be at most 1000 characters long.",
  }),
  color: Joi.string().allow("", null).max(80).messages({
    "string.max": "Color must be at most 80 characters long.",
  }),
  size: Joi.string().allow("", null).max(80).messages({
    "string.max": "Size must be at most 80 characters long.",
  }),
  stock: Joi.number().integer().min(0).default(0).messages({
    "number.base": "Stock must be a number.",
    "number.min": "Stock cannot be negative.",
  }),
  alertStock: Joi.number().integer().min(0).default(5).messages({
    "number.base": "Alert stock must be a number.",
    "number.min": "Alert stock cannot be negative.",
  }),
  retailPrice: Joi.number().min(0).required().messages({
    "number.base": "Retail price must be a number.",
    "number.min": "Retail price cannot be negative.",
    "any.required": "Retail price is required.",
  }),
  wholesalePrice: Joi.number().min(0).messages({
    "number.base": "Wholesale price must be a number.",
    "number.min": "Wholesale price cannot be negative.",
  }),
  isActive: Joi.boolean().default(true),
});

export default async (req) => {
  try {
    const validations = await variantValidationSchema.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true,
      convert: true,
    });

    // Image validation - req.files.images is already an array from multer
    const files = req.files?.images || [];
    if (files.length > 0) {
      const mimeTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      files.forEach((file) => {
        if (!file) return;
        if (!mimeTypes.includes(file.mimetype)) {
          throw new customError(400, "Invalid image format. Only JPEG, PNG, JPG, and WEBP are allowed.");
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new customError(400, "Each image should not exceed 5MB.");
        }
      });
    }

    return validations;
  } catch (error) {
    console.error("Validation error:", error);
    if (error instanceof customError) {
      throw error;
    }

    // Handle Joi validation errors
    if (error.details && Array.isArray(error.details)) {
      const errorMessages = error.details.map(detail => detail.message).join(', ');
      throw new customError(400, errorMessages);
    }

    throw new customError(400, error.message || 'Validation failed');
  }
};
