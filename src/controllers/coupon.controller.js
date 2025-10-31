import Coupon from "../models/coupon.model.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import CustomError from "../utils/customError.js";
import couponValidation from "../validations/coupon.validation.js";

// Create a new coupon
export const createCoupon = asyncHandler(async (req, res) => {
  // Validate coupon data
  const validatedData = await couponValidation(req);

  // Check if coupon code already exists
  const existingCoupon = await Coupon.findOne({ code: validatedData.code.toUpperCase() });
  if (existingCoupon) {
    throw new CustomError(400, "Coupon code already exists");
  }

  // Validate percentage discount
  if (validatedData.discountType === "percentage" && validatedData.discountValue > 100) {
    throw new CustomError(400, "Percentage discount cannot exceed 100%");
  }

  // Create the coupon
  const coupon = await Coupon.create(validatedData);

  return apiResponse.sendSuccess(res, 201, "Coupon created successfully", coupon);
});

// Get all coupons
export const getAllCoupons = asyncHandler(async (req, res) => {
  const { isActive, discountType } = req.query;
  
  // Build filter query
  const filter = {};
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }
  if (discountType) {
    filter.discountType = discountType;
  }

  const coupons = await Coupon.find(filter)
    .populate('applicableProducts', 'name slug retailPrice images')
    .sort({ createdAt: -1 });

  return apiResponse.sendSuccess(res, 200, "Coupons retrieved successfully", coupons);
});

// Get active coupons only
export const getActiveCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ 
    isActive: true,
    expireAt: { $gt: new Date() }
  })
    .populate('applicableProducts', 'name slug retailPrice images')
    .sort({ createdAt: -1 });

  return apiResponse.sendSuccess(res, 200, "Active coupons retrieved successfully", coupons);
});

// Get single coupon by slug
export const getCouponBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const coupon = await Coupon.findOne({ slug })
    .populate('applicableProducts', 'name slug retailPrice images');
  
  if (!coupon) {
    throw new CustomError(404, "Coupon not found");
  }

  return apiResponse.sendSuccess(res, 200, "Coupon retrieved successfully", coupon);
});

// Get single coupon by code (for customer use)
export const getCouponByCode = asyncHandler(async (req, res) => {
  const { code } = req.params;

  const coupon = await Coupon.findOne({ code: code.toUpperCase() })
    .populate('applicableProducts', 'name slug retailPrice images');
  
  if (!coupon) {
    throw new CustomError(404, "Coupon not found");
  }

  // Check if coupon is valid
  if (!coupon.isActive) {
    throw new CustomError(400, "This coupon is not active");
  }

  if (coupon.isExpired()) {
    throw new CustomError(400, "This coupon has expired");
  }

  if (coupon.isUsageLimitReached()) {
    throw new CustomError(400, "This coupon has reached its usage limit");
  }

  return apiResponse.sendSuccess(res, 200, "Coupon is valid", coupon);
});

// Update coupon
export const updateCoupon = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  // Find existing coupon
  const existingCoupon = await Coupon.findOne({ slug });
  if (!existingCoupon) {
    throw new CustomError(404, "Coupon not found");
  }

  // Don't allow changing code if coupon has been used
  if (req.body.code && existingCoupon.usedCount > 0) {
    throw new CustomError(400, "Cannot change code of a coupon that has been used");
  }

  // Validate percentage discount if being updated
  if (req.body.discountType === "percentage" && req.body.discountValue > 100) {
    throw new CustomError(400, "Percentage discount cannot exceed 100%");
  }

  // Update the coupon
  const updatedCoupon = await Coupon.findOneAndUpdate(
    { slug },
    { $set: req.body },
    { new: true, runValidators: true }
  ).populate('applicableProducts', 'name slug retailPrice images');

  return apiResponse.sendSuccess(res, 200, "Coupon updated successfully", updatedCoupon);
});

// Delete coupon
export const deleteCoupon = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const coupon = await Coupon.findOne({ slug });
  if (!coupon) {
    throw new CustomError(404, "Coupon not found");
  }

  // Check if coupon has been used
  if (coupon.usedCount > 0) {
    throw new CustomError(400, "Cannot delete a coupon that has been used. Consider deactivating it instead.");
  }

  await Coupon.findOneAndDelete({ slug });

  return apiResponse.sendSuccess(res, 200, "Coupon deleted successfully", null);
});

// Toggle coupon status (activate/deactivate)
export const toggleCouponStatus = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    throw new CustomError(400, "isActive must be a boolean value");
  }

  const coupon = await Coupon.findOne({ slug });
  if (!coupon) {
    throw new CustomError(404, "Coupon not found");
  }

  coupon.isActive = isActive;
  await coupon.save();

  const statusMessage = isActive ? "activated" : "deactivated";
  return apiResponse.sendSuccess(res, 200, `Coupon ${statusMessage} successfully`, coupon);
});

// Verify coupon for cart (used by frontend before applying)
export const verifyCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal, productIds } = req.body;

  if (!code) {
    throw new CustomError(400, "Coupon code is required");
  }

  if (!cartTotal || cartTotal < 0) {
    throw new CustomError(400, "Valid cart total is required");
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase() })
    .populate('applicableProducts');

  if (!coupon) {
    throw new CustomError(404, "Invalid coupon code");
  }

  // Check if coupon is active
  if (!coupon.isActive) {
    throw new CustomError(400, "This coupon is not active");
  }

  // Check if coupon is expired
  if (coupon.isExpired()) {
    throw new CustomError(400, "This coupon has expired");
  }

  // Check usage limit
  if (coupon.isUsageLimitReached()) {
    throw new CustomError(400, "This coupon has reached its usage limit");
  }

  // Check minimum purchase amount
  if (cartTotal < coupon.minPurchaseAmount) {
    throw new CustomError(
      400,
      `Minimum purchase amount of ৳${coupon.minPurchaseAmount} is required to use this coupon`
    );
  }

  // Check if coupon is applicable to specific products
  if (coupon.applicableTo === 'products' && coupon.applicableProducts.length > 0) {
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new CustomError(400, "Product IDs are required for product-specific coupons");
    }

    const applicableProductIds = coupon.applicableProducts.map(p => p._id.toString());
    const hasApplicableProduct = productIds.some(id => applicableProductIds.includes(id.toString()));

    if (!hasApplicableProduct) {
      throw new CustomError(400, "This coupon is not applicable to items in your cart");
    }
  }

  // Calculate discount
  const discountAmount = coupon.calculateDiscount(cartTotal);
  const finalAmount = Math.max(0, cartTotal - discountAmount);

  return apiResponse.sendSuccess(res, 200, "Coupon is valid", {
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    },
    discountAmount: Math.round(discountAmount),
    finalAmount: Math.round(finalAmount),
    savings: Math.round(discountAmount),
  });
});
