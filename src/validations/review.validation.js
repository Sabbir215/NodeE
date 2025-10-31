import Joi from "joi";
import mongoose from "mongoose";

// Helper: check valid ObjectId
const isValidObjectId = (value, helpers) => {
  if (value === "" || value === null || value === undefined) {
    return value;
  }
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("objectId.invalid");
  }
  return value;
};

const reviewValidationSchema = Joi.object({
  user: Joi.string().custom(isValidObjectId).required().messages({
    "objectId.invalid": "User ID must be a valid MongoDB ObjectId format.",
    "any.required": "User is required.",
  }),
  product: Joi.string().custom(isValidObjectId).required().messages({
    "objectId.invalid": "Product ID must be a valid MongoDB ObjectId format.",
    "any.required": "Product is required.",
  }),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "number.base": "Rating must be a number.",
    "number.integer": "Rating must be a whole number.",
    "number.min": "Rating must be at least 1.",
    "number.max": "Rating cannot exceed 5.",
    "any.required": "Rating is required.",
  }),
  comment: Joi.string()
    .trim()
    .min(10)
    .max(1000)
    .required()
    .messages({
      "string.empty": "Review comment is required.",
      "string.min": "Comment must be at least 10 characters long.",
      "string.max": "Comment cannot exceed 1000 characters.",
      "any.required": "Comment is required.",
    }),
  images: Joi.array()
    .items(
      Joi.string().uri().messages({
        "string.uri": "Each image must be a valid URL.",
      })
    )
    .max(5)
    .default([])
    .messages({
      "array.base": "Images must be an array of URLs.",
      "array.max": "You can upload a maximum of 5 images.",
    }),
  isVerifiedPurchase: Joi.boolean().default(false).messages({
    "boolean.base": "isVerifiedPurchase must be a boolean value.",
  }),
  status: Joi.string()
    .valid("pending", "approved", "rejected")
    .default("pending")
    .messages({
      "any.only": "Status must be pending, approved, or rejected.",
    }),
  adminResponse: Joi.string().trim().max(500).allow("", null).messages({
    "string.max": "Admin response cannot exceed 500 characters.",
  }),
  rejectionReason: Joi.string().trim().max(200).allow("", null).messages({
    "string.max": "Rejection reason cannot exceed 200 characters.",
  }),
});

const updateReviewValidationSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).messages({
    "number.base": "Rating must be a number.",
    "number.integer": "Rating must be a whole number.",
    "number.min": "Rating must be at least 1.",
    "number.max": "Rating cannot exceed 5.",
  }),
  comment: Joi.string()
    .trim()
    .min(10)
    .max(1000)
    .messages({
      "string.min": "Comment must be at least 10 characters long.",
      "string.max": "Comment cannot exceed 1000 characters.",
    }),
  images: Joi.array()
    .items(
      Joi.string().uri().messages({
        "string.uri": "Each image must be a valid URL.",
      })
    )
    .max(5)
    .messages({
      "array.base": "Images must be an array of URLs.",
      "array.max": "You can upload a maximum of 5 images.",
    }),
  status: Joi.string()
    .valid("pending", "approved", "rejected")
    .messages({
      "any.only": "Status must be pending, approved, or rejected.",
    }),
  adminResponse: Joi.string().trim().max(500).allow("", null).messages({
    "string.max": "Admin response cannot exceed 500 characters.",
  }),
  rejectionReason: Joi.string().trim().max(200).allow("", null).messages({
    "string.max": "Rejection reason cannot exceed 200 characters.",
  }),
}).min(1).messages({
  "object.min": "At least one field must be provided for update.",
});

const toggleReviewStatusSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "approved", "rejected")
    .required()
    .messages({
      "any.only": "Status must be pending, approved, or rejected.",
      "any.required": "Status is required.",
    }),
  rejectionReason: Joi.when("status", {
    is: "rejected",
    then: Joi.string().trim().min(10).max(200).required().messages({
      "string.empty": "Rejection reason is required when rejecting a review.",
      "string.min": "Rejection reason must be at least 10 characters.",
      "string.max": "Rejection reason cannot exceed 200 characters.",
      "any.required": "Rejection reason is required when rejecting a review.",
    }),
    otherwise: Joi.forbidden(),
  }),
  adminResponse: Joi.string().trim().max(500).allow("", null).messages({
    "string.max": "Admin response cannot exceed 500 characters.",
  }),
});

const markHelpfulSchema = Joi.object({
  user: Joi.string().custom(isValidObjectId).required().messages({
    "objectId.invalid": "User ID must be a valid MongoDB ObjectId format.",
    "any.required": "User is required.",
  }),
  action: Joi.string().valid("mark", "unmark").required().messages({
    "any.only": "Action must be either 'mark' or 'unmark'.",
    "any.required": "Action is required.",
  }),
});

export {
    markHelpfulSchema,
    reviewValidationSchema,
    toggleReviewStatusSchema,
    updateReviewValidationSchema
};

