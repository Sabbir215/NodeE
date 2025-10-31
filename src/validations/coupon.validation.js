import Joi from "joi";
import mongoose from "mongoose";
import CustomError from "../utils/customError.js";

// Helper: check valid ObjectId
const isValidObjectId = (value, helpers) => {
  if (value === '' || value === null || value === undefined) {
    return value;
  }
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('objectId.invalid');
  }
  return value;
};

// Coupon Validation Schema
const couponValidationSchema = Joi.object({
  code: Joi.string()
    .trim()
    .uppercase()
    .required()
    .messages({
      'string.empty': 'Coupon code cannot be empty.',
      'any.required': 'Coupon code is required.',
    }),
  
  description: Joi.string()
    .trim()
    .allow('', null)
    .messages({
      'string.base': 'Description must be a string.',
    }),
  
  discountType: Joi.string()
    .valid('percentage', 'fixed')
    .required()
    .messages({
      'string.empty': 'Discount type cannot be empty.',
      'any.required': 'Discount type is required.',
      'any.only': 'Discount type must be either "percentage" or "fixed".',
    }),
  
  discountValue: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Discount value must be a number.',
      'number.min': 'Discount value must be at least 0.',
      'any.required': 'Discount value is required.',
    }),
  
  minPurchaseAmount: Joi.number()
    .min(0)
    .default(0)
    .messages({
      'number.base': 'Minimum purchase amount must be a number.',
      'number.min': 'Minimum purchase amount cannot be negative.',
    }),
  
  maxDiscountAmount: Joi.number()
    .min(0)
    .allow(null)
    .messages({
      'number.base': 'Maximum discount amount must be a number.',
      'number.min': 'Maximum discount amount cannot be negative.',
    }),
  
  expireAt: Joi.date()
    .greater('now')
    .required()
    .messages({
      'date.base': 'Please provide a valid expiration date.',
      'any.required': 'Expiration date is required.',
      'date.greater': 'Expiration date must be in the future.',
    }),
  
  usageLimit: Joi.number()
    .integer()
    .min(1)
    .allow(null)
    .messages({
      'number.base': 'Usage limit must be a number.',
      'number.integer': 'Usage limit must be an integer.',
      'number.min': 'Usage limit must be at least 1.',
    }),
  
  isActive: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'isActive must be a boolean value (true or false).',
    }),
  
  applicableTo: Joi.string()
    .valid('all', 'products', 'cart')
    .default('all')
    .messages({
      'any.only': 'Applicable to must be "all", "products", or "cart".',
    }),
  
  applicableProducts: Joi.array()
    .items(Joi.string().custom(isValidObjectId))
    .messages({
      'array.base': 'Applicable products must be an array.',
      'objectId.invalid': 'Each product ID must be a valid MongoDB ObjectId format.',
    }),
});

// Exported validation function
export default async (req) => {
  try {
    const value = await couponValidationSchema.validateAsync(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    return value;
  } catch (error) {
    console.log("Error from validateCoupon method:", error);
    throw new CustomError(
      400,
      error.details ? error.details.map(d => d.message).join(', ') : error.message
    );
  }
};
