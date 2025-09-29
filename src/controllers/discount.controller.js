import Brand from "../models/brand.model.js";
import Category from "../models/category.model.js";
import Discount from "../models/discount.model.js";
import SubCategory from "../models/subCategory.model.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import CustomError from "../utils/customError.js";
import discountValidationSchema from "../validations/discount.validation.js";

// Create a new discount
export const createDiscount = asyncHandler(async (req, res, next) => {

  // Validate discount data
  const validatedData = await discountValidationSchema(req);
  if (validatedData.error) {
    return next(new CustomError(400, validatedData.error.details));
  }
  
  const { discountName, description, discountValidFrom, discountValidTo, discountValueByAmount, discountValueByPercentage, discountType, discountPlan, targetProduct, targetCategory, targetSubCategory, targetBrand } = validatedData;

  // Check if discount with the same name already exists
  const existingDiscount = await Discount.findOne({ discountName });
  if (existingDiscount) {
    return next(new CustomError(400, "Discount with this name already exists"));
  }

  // Validate that referenced entities exist
  if (targetCategory && targetCategory !== '') {
    const categoryExists = await Category.findById(targetCategory);
    if (!categoryExists) {
      return next(new CustomError(400, "Target category does not exist"));
    }
  }

  if (targetSubCategory && targetSubCategory !== '') {
    const subCategoryExists = await SubCategory.findById(targetSubCategory);
    if (!subCategoryExists) {
      return next(new CustomError(400, "Target subcategory does not exist"));
    }
  }

  if (targetBrand && targetBrand !== '') {
    const brandExists = await Brand.findById(targetBrand);
    if (!brandExists) {
      return next(new CustomError(400, "Target brand does not exist"));
    }
  }

  // Note: Add Product model import and validation when Product model is available
  // if (targetProduct && targetProduct !== '') {
  //   const productExists = await Product.findById(targetProduct);
  //   if (!productExists) {
  //     return next(new CustomError(400, "Target product does not exist"));
  //   }
  // }

  // Filter out empty string values for ObjectId fields
  const discountData = { ...req.body };
  if (discountData.targetCategory === '') {
    delete discountData.targetCategory;
  }
  if (discountData.targetSubCategory === '') {
    delete discountData.targetSubCategory;
  }
  if (discountData.targetProduct === '') {
    delete discountData.targetProduct;
  }
  if (discountData.targetBrand === '') {
    delete discountData.targetBrand;
  }

  // Create and save the new discount
  const discount = new Discount(discountData);
  await discount.save();

  // Update relationships
  if (discount.discountPlan === 'category' && discount.targetCategory) {
    await Category.findOneAndUpdate(
      { _id: discount.targetCategory },
      { $addToSet: { discounts: discount._id } }
    );
  }

  if (discount.discountPlan === 'subcategory' && discount.targetSubCategory) {
    await SubCategory.findOneAndUpdate(
      { _id: discount.targetSubCategory },
      { $addToSet: { discounts: discount._id } }
    );
  }

  if (discount.discountPlan === 'brand' && discount.targetBrand) {
    await Brand.findOneAndUpdate(
      { _id: discount.targetBrand },
      { $addToSet: { discounts: discount._id } }
    );
  }

  // note: Add Product relationship update when Product model is available
  // if (discount.discountPlan === 'product' && discount.targetProduct) {
  //   await Product.findOneAndUpdate(
  //     { _id: discount.targetProduct },
  //     { $addToSet: { discounts: discount._id } }
  //   );
  // }

  apiResponse.sendSuccess(res, 201, "Discount created successfully", discount);
});

export const deleteDiscount = asyncHandler(async (req, res, next) => {
    const { slug } = req.params;
    
    // First, find the discount
    const discount = await Discount.findOne({ slug });
    if (!discount) {
        return next(new CustomError(404, "Discount not found"));
    }
    
    // Remove discount references from related models
    if (discount.discountPlan === 'category' && discount.targetCategory) {
      await Category.findOneAndUpdate(
        { _id: discount.targetCategory },
        { $pull: { discounts: discount._id } }
      );
    }

    if (discount.discountPlan === 'subcategory' && discount.targetSubCategory) {
      await SubCategory.findOneAndUpdate(
        { _id: discount.targetSubCategory },
        { $pull: { discounts: discount._id } }
      );
    }

    if (discount.discountPlan === 'brand' && discount.targetBrand) {
      await Brand.findOneAndUpdate(
        { _id: discount.targetBrand },
        { $pull: { discounts: discount._id } }
      );
    }
    
    // Delete the discount
    await Discount.findOneAndDelete({ slug });
    
    apiResponse.sendSuccess(res, 200, "Discount deleted successfully", null);
});

export const updateDiscount = asyncHandler(async (req, res, next) => {

  const { slug } = req.params;
  const discount = await Discount.findOne({ slug });
  if (!discount) {
    return next(new CustomError(404, "Discount not found"));
  }

  // otherwise validator will be upset
  if (!req.body.discountName) req.body.discountName = discount.discountName;
  if (!req.body.discountValidFrom) req.body.discountValidFrom = discount.discountValidFrom;
  if (!req.body.discountValidTo) req.body.discountValidTo = discount.discountValidTo;
  if (!req.body.discountType) req.body.discountType = discount.discountType;
  if (!req.body.discountPlan) req.body.discountPlan = discount.discountPlan;

  // Validate discount data
  const validatedData = await discountValidationSchema(req);
  console.log(validatedData);
  if (validatedData.error) {
    return next(new CustomError(400, validatedData.error.details));
  }
  
  const { discountName, description, discountValidFrom, discountValidTo, discountValueByAmount, discountValueByPercentage, discountType, discountPlan, targetProduct, targetCategory, targetSubCategory, targetBrand } = validatedData;

  // Filter out empty string values for ObjectId fields
  const discountData = { ...req.body };
  if (discountData.targetCategory === '') {
    delete discountData.targetCategory;
  }
  if (discountData.targetSubCategory === '') {
    delete discountData.targetSubCategory;
  }
  if (discountData.targetProduct === '') {
    delete discountData.targetProduct;
  }
  if (discountData.targetBrand === '') {
    delete discountData.targetBrand;
  }

  // Validate that referenced entities exist
  if (discountData.targetCategory) {
    const categoryExists = await Category.findById(discountData.targetCategory);
    if (!categoryExists) {
      return next(new CustomError(400, "Target category does not exist"));
    }
  }

  if (discountData.targetSubCategory) {
    const subCategoryExists = await SubCategory.findById(discountData.targetSubCategory);
    if (!subCategoryExists) {
      return next(new CustomError(400, "Target subcategory does not exist"));
    }
  }

  if (discountData.targetBrand) {
    const brandExists = await Brand.findById(discountData.targetBrand);
    if (!brandExists) {
      return next(new CustomError(400, "Target brand does not exist"));
    }
  }

  // Note: Add Product model import and validation when Product model is available
  // if (discountData.targetProduct) {
  //   const productExists = await Product.findById(discountData.targetProduct);
  //   if (!productExists) {
  //     return next(new CustomError(400, "Target product does not exist"));
  //   }
  // }

  // Check if discount name is being changed and if new name already exists
  if (discountName && discountName !== discount.discountName) {
    const existingDiscount = await Discount.findOne({ 
      discountName: discountName,
      _id: { $ne: discount._id } // Exclude current discount from check
    });
    if (existingDiscount) {
      return next(new CustomError(400, "Discount with this name already exists"));
    }
  }

  // Store old values for relationship cleanup
  const oldDiscountPlan = discount.discountPlan;
  const oldTargetCategory = discount.targetCategory;
  const oldTargetSubCategory = discount.targetSubCategory;
  const oldTargetBrand = discount.targetBrand;

  // Update fields
  if (discountName) discount.discountName = discountName;
  if (description) discount.description = description;
  if (discountValidFrom) discount.discountValidFrom = discountValidFrom;
  if (discountValidTo) discount.discountValidTo = discountValidTo;
  if (discountValueByAmount !== undefined) discount.discountValueByAmount = discountValueByAmount;
  if (discountValueByPercentage !== undefined) discount.discountValueByPercentage = discountValueByPercentage;
  if (discountType) discount.discountType = discountType;
  if (discountPlan) discount.discountPlan = discountPlan;
  
  // Handle ObjectId fields - only update if not empty string
  if (targetProduct !== undefined) {
    if (targetProduct && targetProduct !== '') {
      discount.targetProduct = targetProduct;
    } else {
      discount.targetProduct = undefined;
    }
  }
  if (targetCategory !== undefined) {
    if (targetCategory && targetCategory !== '') {
      discount.targetCategory = targetCategory;
    } else {
      discount.targetCategory = undefined;
    }
  }
  if (targetSubCategory !== undefined) {
    if (targetSubCategory && targetSubCategory !== '') {
      discount.targetSubCategory = targetSubCategory;
    } else {
      discount.targetSubCategory = undefined;
    }
  }
  if (targetBrand !== undefined) {
    if (targetBrand && targetBrand !== '') {
      discount.targetBrand = targetBrand;
    } else {
      discount.targetBrand = undefined;
    }
  }

  await discount.save();

  // Handle relationship updates
  const discountId = discount._id;

    // Clean up old relationships if plan changed
  if (oldDiscountPlan !== discount.discountPlan) {
    if (oldDiscountPlan === 'category' && oldTargetCategory) {
      await Category.findOneAndUpdate(
        { _id: oldTargetCategory },
        { $pull: { discounts: discount._id } }
      );
    }
    if (oldDiscountPlan === 'subcategory' && oldTargetSubCategory) {
      await SubCategory.findOneAndUpdate(
        { _id: oldTargetSubCategory },
        { $pull: { discounts: discount._id } }
      );
    }
    if (oldDiscountPlan === 'brand' && oldTargetBrand) {
      await Brand.findOneAndUpdate(
        { _id: oldTargetBrand },
        { $pull: { discounts: discount._id } }
      );
    }
  }

  // Update new relationships
  if (discount.discountPlan === 'category' && discount.targetCategory) {
    await Category.findOneAndUpdate(
      { _id: discount.targetCategory },
      { $addToSet: { discounts: discountId } }
    );
  }

  if (discount.discountPlan === 'subcategory' && discount.targetSubCategory) {
    await SubCategory.findOneAndUpdate(
      { _id: discount.targetSubCategory },
      { $addToSet: { discounts: discountId } }
    );
  }

  if (discount.discountPlan === 'brand' && discount.targetBrand) {
    await Brand.findOneAndUpdate(
      { _id: discount.targetBrand },
      { $addToSet: { discounts: discountId } }
    );
  }

  apiResponse.sendSuccess(res, 200, "Discount updated successfully", discount);
});

export const getDiscounts = asyncHandler(async (req, res, next) => {
  const discounts = await Discount.find()
    .populate('targetCategory')
    .populate('targetSubCategory')
    .populate('targetBrand');
  apiResponse.sendSuccess(res, 200, "Discounts retrieved successfully", discounts);
});

export const getDiscountBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const discount = await Discount.findOne({ slug })
    .populate('targetCategory')
    .populate('targetSubCategory')
    .populate('targetBrand');
  if (!discount) {
    return next(new CustomError(404, "Discount not found"));
  }
  apiResponse.sendSuccess(res, 200, "Discount retrieved successfully", discount);
});