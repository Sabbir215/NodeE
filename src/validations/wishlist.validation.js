import Joi from "joi";
import mongoose from "mongoose";
import customError from "../utils/customError.js";

// Helper: check valid ObjectId
const isValidObjectId = (value, helpers) => {
  // Allow empty strings and null values
  if (value === '' || value === null || value === undefined) {
    return value;
  }
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('objectId.invalid');
  }
  return value;
};

const wishlistValidationSchema = Joi.object({
  user: Joi.string().custom(isValidObjectId).required().messages({
    'objectId.invalid': 'User ID must be a valid MongoDB ObjectId format.',
    'any.required': 'User is required.',
  }),
  product: Joi.string().custom(isValidObjectId).required().messages({
    'objectId.invalid': 'Product ID must be a valid MongoDB ObjectId format.',
    'any.required': 'Product is required.',
  }),
  isActive: Joi.boolean().default(true),
});

export default async (req) => {
  try {
    return await wishlistValidationSchema.validateAsync(
      req.body,
      {
        abortEarly: false,
        allowUnknown: true,
      }
    );
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