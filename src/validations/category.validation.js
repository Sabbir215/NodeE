import Joi from "joi";
import customError from "../utils/customError.js";

const categoryValidationSchema = Joi.object({
  // name validation: required, max 100 chars, alphanumeric with spaces, hyphen, and underscore
  // multiple spaces are converted to single space
  name: Joi.string()
    .required()
    .max(100)
    .custom((value, helpers) => {
      const cleaned = value.replace(/\s+/g, " ");
      if (!/^[a-zA-Z0-9 _-]+$/.test(cleaned)) {
        return helpers.error("string.alphanumWithSpacesHyphenUnderscore");
      }
      return cleaned.trim();
    })
    .messages({
      "string.empty": "Category name is required.",
      "string.max": "Category name must be at most 100 characters long.",
      "string.alphanumWithSpacesHyphenUnderscore":
        "Category name is not valid! (only letters, numbers, spaces, hyphen, and underscore allowed)",
    }),

  image: Joi.string().uri().allow("").messages({
    "string.uri": "Image must be a valid URI.",
  }),
  description: Joi.string().max(500).messages({
    "string.max": "Description must be at most 500 characters long.",
  }),
  isActive: Joi.boolean().default(true),
});

export default async (req) => {
  try {
    const validations = await categoryValidationSchema.validateAsync(
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
      if (req.file.size > 20 * 1024 * 1024) { // 20MB limit
        throw new customError(400, "Image size should not exceed 20MB.");
      }
    }

    return validations;
  } catch (error) {
    console.error("Validation error:", error);
    throw new customError(400, error.details);
  }
};
