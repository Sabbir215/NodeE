import { deleteImage, uploadImage } from "../helpers/cloudinary.js";
import Brand from "../models/brand.model.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import CustomError from "../utils/customError.js";
import brandValidationSchema from "../validations/brand.validation.js";

// Create a new brand
export const createBrand = asyncHandler(async (req, res, next) => {

  // Validate brand data
  const validatedData = await brandValidationSchema(req);
  if (validatedData.error) {
    return next(new CustomError(400, validatedData.error.details));
  }
  if (req.file) {
      validatedData.image = await uploadImage(req.file.path);
  }
  const { name, image, description, since } = validatedData;

  const existingBrand = await Brand.findOne({ name });
  if (existingBrand) {
    return next(new CustomError(400, "Brand with this name already exists"));
  }

  const brand = new Brand({
    name,
    image,
    description,
    since,
  });

  await brand.save();

  apiResponse.sendSuccess(res, 201, "Brand created successfully", brand);
});

export const deleteBrand = asyncHandler(async (req, res, next) => {
    const { slug } = req.params;
    
    const brand = await Brand.findOne({ slug });
    if (!brand) {
        return next(new CustomError(404, "Brand not found"));
    }
    
    // Delete the brand
    await Brand.findOneAndDelete({ slug });
    
    // Delete image if exists
    if (brand.image) await deleteImage(brand.image);
    
    apiResponse.sendSuccess(res, 200, "Brand deleted successfully", null);
});

export const updateBrand = asyncHandler(async (req, res, next) => {

  const { slug } = req.params;
  const brand = await Brand.findOne({ slug });
  if (!brand) {
    return next(new CustomError(404, "Brand not found"));
  }

  // otherwise validator will be upset
  if (!req.body.name) req.body.name = brand.name;
  if (!req.body.since) req.body.since = brand.since;

  // Validate brand data
  const validatedData = await brandValidationSchema(req);
  console.log(validatedData);
  if (validatedData.error) {
    return next(new CustomError(400, validatedData.error.details));
  }
  // If an image file is provided, upload it to Cloudinary
  if (req.file) {
      validatedData.image = await uploadImage(req.file.path);
  }
  
  const { name, image, description, since } = validatedData;

  if (name) brand.name = name;
  if (image) {
    if (brand.image) await deleteImage(brand.image);
    brand.image = image;
  }
  if (description) brand.description = description;
  if (since) brand.since = since;

  await brand.save();

  apiResponse.sendSuccess(res, 200, "Brand updated successfully", brand);
});

export const getBrands = asyncHandler(async (req, res, next) => {
  const brands = await Brand.find();
  apiResponse.sendSuccess(res, 200, "Brands retrieved successfully", brands);
});

export const getBrandBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const brand = await Brand.findOne({ slug });
  if (!brand) {
    return next(new CustomError(404, "Brand not found"));
  }
  apiResponse.sendSuccess(res, 200, "Brand retrieved successfully", brand);
});