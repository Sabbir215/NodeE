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

const productValidationSchema = Joi.object({
  name: Joi.string()
    .required()
    .max(150)
    .custom((value, helpers) => {
      const cleaned = value.replace(/\s+/g, " ");
      if (!/^[a-zA-Z0-9 _\-.,!&()%$]+$/.test(cleaned)) {
        return helpers.error("string.invalidCharacters");
      }
      return cleaned.trim();
    })
    .messages({
      "string.empty": "Product name is required.",
      "string.max": "Product name must be at most 150 characters long.",
      "string.invalidCharacters":
        "Product name contains invalid characters! (letters, numbers, spaces, and common punctuation allowed)",
    }),
  description: Joi.string().max(2000).allow("", null).messages({
    "string.max": "Description must be at most 2000 characters long.",
  }),
  category: Joi.string().custom(isValidObjectId).required().messages({
    "objectId.invalid": "Category ID must be a valid MongoDB ObjectId format.",
    "any.required": "Category is required.",
  }),
  subCategory: Joi.string().custom(isValidObjectId).required().messages({
    "objectId.invalid": "SubCategory ID must be a valid MongoDB ObjectId format.",
    "any.required": "SubCategory is required.",
  }),
  brand: Joi.string().custom(isValidObjectId).required().messages({
    "objectId.invalid": "Brand ID must be a valid MongoDB ObjectId format.",
    "any.required": "Brand is required.",
  }),
  discount: Joi.string().allow("", null).custom(isValidObjectId).messages({
    "objectId.invalid": "Discount ID must be a valid MongoDB ObjectId format.",
  }),
  sku: Joi.string()
    .required()
    .max(80)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .messages({
      "string.empty": "SKU is required.",
      "string.max": "SKU must be at most 80 characters long.",
      "string.pattern.base": "SKU may only contain letters, numbers, hyphen and underscore.",
    }),
  variantType: Joi.string().valid("single", "multiple").default("single"),
  retailPrice: Joi.number().min(0).required().messages({
    "number.base": "Retail price must be a number.",
    "number.min": "Retail price cannot be negative.",
    "any.required": "Retail price is required.",
  }),
  wholesalePrice: Joi.number().min(0).allow(null, "").messages({
    "number.base": "Wholesale price must be a number.",
    "number.min": "Wholesale price cannot be negative.",
  }),
  stock: Joi.number().integer().min(0).default(0).messages({
    "number.base": "Stock must be a number.",
    "number.min": "Stock cannot be negative.",
  }),
  alertQuantity: Joi.number().integer().min(0).default(0).messages({
    "number.base": "Alert quantity must be a number.",
    "number.min": "Alert quantity cannot be negative.",
  }),
  tags: Joi.array().items(Joi.string().trim().max(50)).default([]).messages({
    "array.base": "Tags must be an array of strings.",
    "string.max": "Each tag must be at most 50 characters long.",
  }),
  isActive: Joi.boolean().default(true),
});

export default async (req) => {
  try {
    const validations = await productValidationSchema.validateAsync(req.body, {
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
