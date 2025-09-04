import Joi from "joi";
import customError from "../utils/customError.js";

export const passwordSchema = Joi.string()
    .min(8)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W_]{8,}$/)
    .messages({
      "string.pattern.base":
        "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number.",
    });

const userValidationSchema = Joi.object({
  username: Joi.string().required()
    .pattern(/^[a-zA-Z][a-zA-Z0-9_]{2,29}$/).messages({
      "string.pattern.base":
        "Username must be 3-30 characters long, start with a letter, and contain only alphanumeric characters and underscores.",
    }),
  firstName: Joi.string()
    .max(50)
    .required()
    .pattern(/^[a-zA-Z]+$/)
    .messages({
      "string.pattern.base":
        "First name must contain only alphabetic characters.",
    }),
  lastName: Joi.string()
    .max(50)
    .required()
    .pattern(/^[a-zA-Z]+$/)
    .messages({
      "string.pattern.base":
        "Last name must contain only alphabetic characters.",
    }),
  email: Joi.string().required()
    .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .messages({
      "string.pattern.base":
        "Email must be a valid email address.",
    }),
  phone: Joi.string().required()
    .pattern(/^\+?[0-9]\d{9,15}$/)
    .messages({
      "string.pattern.base":
        "Phone number is not valid!",
    }),
  password: passwordSchema,

  // role: Joi.string().valid("user", "admin").required(),
  // permissions: Joi.array().items(Joi.string()).optional(),
});

export default async (userData) => {
  try {
    const validations = await userValidationSchema.validateAsync(userData, {
      abortEarly: false,
      allowUnknown: true,
    });
    return validations;
  } catch (error) {
    console.error("Validation error:", error);
    throw new customError(
      400,
      error.details
    )
  }
}


export const validatePassword = async (pass) => {
  try {
    const validations = await passwordSchema.validateAsync(pass, {
      abortEarly: false,
      allowUnknown: true,
    });
    return validations;
  } catch (error) {
    console.error("Validation error:", error);
    throw new customError(
      400,
      error.details
    )
  }
}

