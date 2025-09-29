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

const discountValidationSchema = Joi.object({
  // name validation: required, max 100 chars, alphanumeric with spaces, hyphen, and underscore
  // multiple spaces are converted to single space
  discountName: Joi.string()
    .required()
    .max(100)
    .messages({
      "string.empty": "Discount name is required.",
      "string.max": "Discount name must be at most 100 characters long.",
    })
    .custom((value, helpers) => {
      const cleaned = value.replace(/\s+/g, " ");
      // Allow letters, numbers, spaces, and common punctuation for discount names
      if (!/^[a-zA-Z0-9 _\-.,!&()%$]+$/.test(cleaned)) {
        return helpers.error("string.invalidCharacters");
      }
      return cleaned.trim();
    })
    .messages({
      "string.invalidCharacters":
        "Discount name contains invalid characters! (letters, numbers, spaces, and common punctuation allowed)",
    }),

  description: Joi.string().max(500).messages({
    "string.max": "Description must be at most 500 characters long.",
  }),

  discountValidFrom: Joi.date().required().messages({
    'date.base': 'Discount valid from must be a valid date.',
    'any.required': 'Discount valid from date is required.',
  }),

  discountValidTo: Joi.date()
    .greater(Joi.ref('discountValidFrom'))
    .required()
    .messages({
      'date.base': 'Discount valid to must be a valid date.',
      'date.greater': 'Discount valid to date must be after discount valid from date.',
      'any.required': 'Discount valid to date is required.',
    }),

  discountValueByAmount: Joi.number().min(0).default(0).messages({
    'number.min': 'Discount amount cannot be negative.',
  }),

  discountValueByPercentage: Joi.number().min(0).max(100).default(0).messages({
    'number.min': 'Discount percentage cannot be negative.',
    'number.max': 'Discount percentage cannot exceed 100.',
  }),

  discountType: Joi.string()
    .valid('tk', 'percentage')
    .required()
    .messages({
      'any.only': 'Discount type must be either "tk" or "percentage".',
      'any.required': 'Discount type is required.',
    }),

  discountPlan: Joi.string()
    .valid('flat', 'category', 'product', 'subcategory', 'brand')
    .required()
    .messages({
      'any.only': 'Discount plan must be one of: flat, category, product, subcategory, brand.',
      'any.required': 'Discount plan is required.',
    }),

  targetProduct: Joi.when('discountPlan', {
    is: 'product',
    then: Joi.string().custom(isValidObjectId).required().messages({
      'objectId.invalid': 'Target product ID must be a valid MongoDB ObjectId format.',
      'any.required': 'Target product is required for product discount plan.',
    }),
    otherwise: Joi.string().allow(null, '').custom(value => value.replace(value, '')),
  }),

  targetCategory: Joi.when('discountPlan', {
    is: 'category',
    then: Joi.string().custom(isValidObjectId).required().messages({
      'objectId.invalid': 'Target category ID must be a valid MongoDB ObjectId format.',
      'any.required': 'Target category is required for category discount plan.',
    }),
    otherwise: Joi.string().allow(null, '').custom(value => value.replace(value, '')),
  }),

  targetSubcategory: Joi.when('discountPlan', {
    is: 'subcategory',
    then: Joi.string().custom(isValidObjectId).required().messages({
      'objectId.invalid': 'Target subcategory ID must be a valid MongoDB ObjectId format.',
      'any.required': 'Target subcategory is required for subcategory discount plan.',
    }),
    otherwise: Joi.string().allow(null, '').custom(value => value.replace(value, '')),
  }),

  targetBrand: Joi.when('discountPlan', {
    is: 'brand',
    then: Joi.string().custom(isValidObjectId).required().messages({
      'objectId.invalid': 'Target brand ID must be a valid MongoDB ObjectId format.',
      'any.required': 'Target brand is required for brand discount plan.',
    }),
    otherwise: Joi.string().allow(null, '').custom(value => value.replace(value, '')),
  }),

  isActive: Joi.boolean().default(true),
});

export default async (req) => {
  try {
    const validations = await discountValidationSchema.validateAsync(
      req.body,
      {
        abortEarly: false,
        allowUnknown: true,
      }
    );

    return validations;
  } catch (error) {
    console.error("Validation error:", error);
    throw new customError(400, error.details);
  }
};