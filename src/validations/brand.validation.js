import Joi from "joi";
import customError from "../utils/customError.js";

const brandValidationSchema = Joi.object({
  // name validation: required, max 100 chars, alphanumeric with spaces, hyphen, and underscore
  // multiple spaces are converted to single space
  name: Joi.string()
    .required()
    .max(100)
    .messages({
      "string.empty": "Brand name is required.",
      "string.max": "Brand name must be at most 100 characters long.",
    })
    .custom((value, helpers) => {
      const cleaned = value.replace(/\s+/g, " ");
      if (!/^[a-zA-Z0-9 _-]+$/.test(cleaned)) {
        return helpers.error("string.alphanumWithSpacesHyphenUnderscore");
      }
      return cleaned.trim();
    })
    .messages({
      "string.alphanumWithSpacesHyphenUnderscore":
        "Brand name is not valid! (only letters, numbers, spaces, hyphen, and underscore allowed)",
    }),

  image: Joi.string().uri().allow("").messages({
    "string.uri": "Image must be a valid URI.",
  }),
  description: Joi.string().max(500).messages({
    "string.max": "Description must be at most 500 characters long.",
  }),
  since: Joi.number()
    .integer()
    .min(1800)
    .max(new Date().getFullYear())
    .required()
    .messages({
      "number.base": "Since year must be a number.",
      "number.min": "Since year must be after 1800.",
      "number.max": "Since year cannot be in the future.",
      "any.required": "Since year is required.",
    }),
  isActive: Joi.boolean().default(true),
});

export default async (req) => {
  try {
    const validations = await brandValidationSchema.validateAsync(
      req.body,
      {
        abortEarly: false,
        allowUnknown: true,
      }
    );

    // image validation
    if (req.file) {
      const mimeTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      const { mimetype } = req.file;
      if (!mimeTypes.includes(mimetype)) {
        throw new customError(400, "Invalid image format. Only JPEG, PNG, JPG, and WEBP are allowed.");
      }
      if (req.file.size > 2 * 1024 * 1024) { // 2MB limit
        throw new customError(400, "Image size should not exceed 2MB.");
      }
    }

    return validations;
  } catch (error) {
    console.error("Validation error:", error);
    throw new customError(400, error.details);
  }
};