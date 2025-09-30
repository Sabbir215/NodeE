import { deleteImage, uploadImage } from "../helpers/cloudinary.js";
import Brand from "../models/brand.model.js";
import Discount from "../models/discount.model.js";
import SubCategory from "../models/subCategory.model.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import CustomError from "../utils/customError.js";
import brandValidationSchema from "../validations/brand.validation.js";

// Create a new brand
export const createBrand = asyncHandler(async (req, res, next) => {

  // Validate brand data
  const validatedData = await brandValidationSchema(req);
  
  if (req.files.image && req.files.image[0]) {
      validatedData.image = await uploadImage(req.files.image[0].path);
  }
  const { name, image, description, subCategory, since } = validatedData;

  // Check if brand with the same name already exists
  const existingBrand = await Brand.findOne({ name });
  if (existingBrand) {
    return next(new CustomError(400, "Brand with this name already exists"));
  }

  // Validate that the subcategory exists
  const subCategoryExists = await SubCategory.findById(subCategory);
  if (!subCategoryExists) {
    return next(new CustomError(400, "SubCategory does not exist"));
  }

  // Create the brand first
  const brand = new Brand({
    name,
    image,
    description,
    subCategory,
    since,
  });

  // Update the subcategory to include this brand
  await SubCategory.findByIdAndUpdate(
    subCategory,
    { $addToSet: { brands: brand._id } }
  );

  await brand.save();

  apiResponse.sendSuccess(res, 201, "Brand created successfully", brand);
});

export const deleteBrand = asyncHandler(async (req, res, next) => {
    const { slug } = req.params;
    
    const brand = await Brand.findOne({ slug });
    if (!brand) {
        return next(new CustomError(404, "Brand not found"));
    }
    
    // Check if brand has products
    if (brand.products && brand.products.length > 0) {
        return next(new CustomError(400, 'Cannot delete brand with associated products'));
    }
    
    // Delete all discounts associated with this brand
    if (brand.discounts && brand.discounts.length > 0) {
        await Discount.deleteMany({ _id: { $in: brand.discounts } });
    }
    
    // Remove brand reference from subcategory
    if (brand.subCategory) {
        await SubCategory.findByIdAndUpdate(
            brand.subCategory,
            { $pull: { brands: brand._id } }
        );
    }
    
    // Delete image if exists
    if (brand.image) await deleteImage(brand.image);
    
    // Delete the brand
    const deletedBrand = await Brand.findOneAndDelete({ slug });
    if (!deletedBrand) next(new CustomError(500, "Failed to delete brand"));
    
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
  if (!req.body.subCategory) req.body.subCategory = brand.subCategory;

  // Validate brand data
  const validatedData = await brandValidationSchema(req);

  // If an image file is provided, upload it to Cloudinary
  if (req.files.image && req.files.image[0]) {
      validatedData.image = await uploadImage(req.files.image[0].path);
  }
  
  const { name, image, description, subCategory, since } = validatedData;

  // Check if brand name is being changed and if new name already exists
  if (name && name !== brand.name) {
    const existingBrand = await Brand.findOne({ 
      name: name,
      _id: { $ne: brand._id } 
    });
    if (existingBrand) {
      return next(new CustomError(400, "Brand with this name already exists"));
    }
  }

  // Handle subcategory change
  if (subCategory && subCategory.toString() !== brand.subCategory.toString()) {
    // Validate new subcategory exists
    const newSubCategoryExists = await SubCategory.findById(subCategory);
    if (!newSubCategoryExists) {
      return next(new CustomError(400, "New SubCategory does not exist"));
    }

    // Remove from old subcategory
    await SubCategory.findByIdAndUpdate(
      brand.subCategory,
      { $pull: { brands: brand._id } }
    );

    // Add to new subcategory
    await SubCategory.findByIdAndUpdate(
      subCategory,
      { $addToSet: { brands: brand._id } }
    );

    brand.subCategory = subCategory;
  }

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
  const brands = await Brand.find()
    .populate('subCategory discounts');
  apiResponse.sendSuccess(res, 200, "Brands retrieved successfully", brands);
});

export const getBrandBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const brand = await Brand.findOne({ slug })
    .populate('subCategory discounts products');
    // .populate('subCategory', 'name slug image description category')
    // .populate({
    //   path: 'subCategory',
    //   populate: {
    //     path: 'category',
    //     select: 'name slug image description'
    //   }
    // })
    // .populate('products', 'name slug image description')
    // .populate('discounts', 'discountName description discountType discountValueByAmount discountValueByPercentage discountValidFrom discountValidTo');
  if (!brand) {
    return next(new CustomError(404, "Brand not found"));
  }
  apiResponse.sendSuccess(res, 200, "Brand retrieved successfully", brand);
});