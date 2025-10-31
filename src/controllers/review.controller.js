import { deleteImage, uploadImage } from "../helpers/cloudinary.js";
import Product from "../models/product.model.js";
import Review from "../models/review.model.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import CustomError from "../utils/customError.js";
import {
    markHelpfulSchema,
    reviewValidationSchema,
    toggleReviewStatusSchema,
    updateReviewValidationSchema,
} from "../validations/review.validation.js";

// Helper function to validate review data
const validateReviewData = async (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join(", ");
    throw new CustomError(400, errorMessages);
  }

  return value;
};

// Create a new review
export const createReview = asyncHandler(async (req, res) => {
  // Validate review data
  const validatedData = await validateReviewData(reviewValidationSchema, req.body);

  // Check if product exists
  const product = await Product.findById(validatedData.product);
  if (!product) {
    throw new CustomError(404, "Product not found");
  }

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    user: validatedData.user,
    product: validatedData.product,
  });

  if (existingReview) {
    throw new CustomError(400, "You have already reviewed this product");
  }

  // Handle image uploads if files are provided
  if (req.files && req.files.images && req.files.images.length > 0) {
    if (req.files.images.length > 5) {
      throw new CustomError(400, "Maximum 5 images allowed per review");
    }
    
    const imagePaths = req.files.images.map(file => file.path);
    validatedData.images = await uploadImage(imagePaths);
  }

  // Create the review
  const review = await Review.create(validatedData);

  // Populate user and product details
  await review.populate([
    { path: "user", select: "firstName lastName email avatar" },
    { path: "product", select: "name slug images retailPrice" },
  ]);

  return apiResponse.sendSuccess(res, 201, "Review created successfully", review);
});

// Get all reviews (admin)
export const getAllReviews = asyncHandler(async (req, res) => {
  const { status, rating, page = 1, limit = 20 } = req.query;

  // Build filter query
  const filter = {};
  if (status) {
    filter.status = status;
  }
  if (rating) {
    filter.rating = parseInt(rating);
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get reviews with pagination
  const reviews = await Review.find(filter)
    .populate("user", "firstName lastName email avatar")
    .populate("product", "name slug images retailPrice")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count
  const totalReviews = await Review.countDocuments(filter);

  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalReviews / parseInt(limit)),
    totalReviews,
    reviewsPerPage: parseInt(limit),
    hasNextPage: parseInt(page) < Math.ceil(totalReviews / parseInt(limit)),
    hasPrevPage: parseInt(page) > 1,
  };

  return apiResponse.sendSuccess(res, 200, "Reviews retrieved successfully", {
    reviews,
    pagination,
  });
});

// Get reviews for a specific product
export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { status = "approved", rating, page = 1, limit = 10 } = req.query;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new CustomError(404, "Product not found");
  }

  // Build filter query
  const filter = { product: productId };
  if (status) {
    filter.status = status;
  }
  if (rating) {
    filter.rating = parseInt(rating);
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get reviews with pagination
  const reviews = await Review.find(filter)
    .populate("user", "firstName lastName email avatar")
    .populate("helpfulBy", "firstName lastName")
    .sort({ createdAt: -1, helpful: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count
  const totalReviews = await Review.countDocuments(filter);

  // Get rating distribution
  const ratingDistribution = await Review.aggregate([
    {
      $match: {
        product: product._id,
        status: "approved",
      },
    },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: -1 },
    },
  ]);

  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalReviews / parseInt(limit)),
    totalReviews,
    reviewsPerPage: parseInt(limit),
    hasNextPage: parseInt(page) < Math.ceil(totalReviews / parseInt(limit)),
    hasPrevPage: parseInt(page) > 1,
  };

  return apiResponse.sendSuccess(res, 200, "Product reviews retrieved successfully", {
    product: {
      id: product._id,
      name: product.name,
      averageRating: product.averageRating || 0,
      totalReviews: product.totalReviews || 0,
    },
    reviews,
    ratingDistribution,
    pagination,
  });
});

// Get reviews by a specific user
export const getUserReviews = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, page = 1, limit = 10 } = req.query;

  // Build filter query
  const filter = { user: userId };
  if (status) {
    filter.status = status;
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get reviews with pagination
  const reviews = await Review.find(filter)
    .populate("product", "name slug images retailPrice averageRating")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count
  const totalReviews = await Review.countDocuments(filter);

  const pagination = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalReviews / parseInt(limit)),
    totalReviews,
    reviewsPerPage: parseInt(limit),
    hasNextPage: parseInt(page) < Math.ceil(totalReviews / parseInt(limit)),
    hasPrevPage: parseInt(page) > 1,
  };

  return apiResponse.sendSuccess(res, 200, "User reviews retrieved successfully", {
    reviews,
    pagination,
  });
});

// Get single review by ID
export const getReviewById = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId)
    .populate("user", "firstName lastName email avatar")
    .populate("product", "name slug images retailPrice")
    .populate("helpfulBy", "firstName lastName");

  if (!review) {
    throw new CustomError(404, "Review not found");
  }

  return apiResponse.sendSuccess(res, 200, "Review retrieved successfully", review);
});

// Update a review (by user)
export const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { user } = req.body;

  // Validate update data
  const validatedData = await validateReviewData(updateReviewValidationSchema, req.body);

  // Find the review
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new CustomError(404, "Review not found");
  }

  // Check if user owns the review
  if (review.user.toString() !== user.toString()) {
    throw new CustomError(403, "You can only update your own reviews");
  }

  // Check if review is approved (approved reviews can't be edited by users)
  if (review.status === "approved") {
    throw new CustomError(400, "Approved reviews cannot be edited. Contact support for changes.");
  }

  // Handle image uploads if files are provided
  if (req.files && req.files.images && req.files.images.length > 0) {
    if (req.files.images.length > 5) {
      throw new CustomError(400, "Maximum 5 images allowed per review");
    }
    
    // Delete old images from Cloudinary if they exist
    if (review.images && review.images.length > 0) {
      try {
        await deleteImage(review.images);
      } catch (error) {
        console.error("Error deleting old review images:", error);
        // Continue with update even if deletion fails
      }
    }
    
    const imagePaths = req.files.images.map(file => file.path);
    validatedData.images = await uploadImage(imagePaths);
  }

  // Update the review
  Object.assign(review, validatedData);
  await review.save();

  // Populate user and product details
  await review.populate([
    { path: "user", select: "firstName lastName email avatar" },
    { path: "product", select: "name slug images retailPrice" },
  ]);

  return apiResponse.sendSuccess(res, 200, "Review updated successfully", review);
});

// Delete a review
export const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { user, isAdmin } = req.body;

  // Find the review
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new CustomError(404, "Review not found");
  }

  // Check permissions (user can delete own review, admin can delete any)
  if (!isAdmin && review.user.toString() !== user.toString()) {
    throw new CustomError(403, "You can only delete your own reviews");
  }

  // Delete images from Cloudinary if they exist
  if (review.images && review.images.length > 0) {
    try {
      await deleteImage(review.images);
    } catch (error) {
      console.error("Error deleting review images from Cloudinary:", error);
      // Continue with deletion even if Cloudinary cleanup fails
    }
  }

  // Delete the review
  await Review.findByIdAndDelete(reviewId);

  return apiResponse.sendSuccess(res, 200, "Review deleted successfully", null);
});

// Toggle review status (admin only)
export const toggleReviewStatus = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  // Validate status data
  const validatedData = await validateReviewData(toggleReviewStatusSchema, req.body);

  // Find the review
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new CustomError(404, "Review not found");
  }

  // Update status
  review.status = validatedData.status;
  
  if (validatedData.status === "rejected") {
    review.rejectionReason = validatedData.rejectionReason;
  } else {
    review.rejectionReason = undefined;
  }

  if (validatedData.adminResponse) {
    review.adminResponse = validatedData.adminResponse;
  }

  await review.save();

  // Populate user and product details
  await review.populate([
    { path: "user", select: "firstName lastName email avatar" },
    { path: "product", select: "name slug images retailPrice" },
  ]);

  const message = 
    validatedData.status === "approved" 
      ? "Review approved successfully"
      : validatedData.status === "rejected"
      ? "Review rejected successfully"
      : "Review status updated successfully";

  return apiResponse.sendSuccess(res, 200, message, review);
});

// Mark review as helpful
export const markHelpful = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  // Validate helpful data
  const validatedData = await validateReviewData(markHelpfulSchema, req.body);

  // Find the review
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new CustomError(404, "Review not found");
  }

  // Check if review is approved
  if (review.status !== "approved") {
    throw new CustomError(400, "You can only mark approved reviews as helpful");
  }

  // Mark or unmark as helpful
  if (validatedData.action === "mark") {
    await review.markHelpful(validatedData.user);
  } else {
    await review.unmarkHelpful(validatedData.user);
  }

  // Populate user and product details
  await review.populate([
    { path: "user", select: "firstName lastName email avatar" },
    { path: "product", select: "name slug images retailPrice" },
  ]);

  const message = 
    validatedData.action === "mark" 
      ? "Review marked as helpful" 
      : "Review unmarked as helpful";

  return apiResponse.sendSuccess(res, 200, message, review);
});

// Get review statistics (admin)
export const getReviewStatistics = asyncHandler(async (req, res) => {
  const stats = await Review.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const totalReviews = await Review.countDocuments();
  const averageRating = await Review.aggregate([
    {
      $match: { status: "approved" },
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  const ratingDistribution = await Review.aggregate([
    {
      $match: { status: "approved" },
    },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: -1 },
    },
  ]);

  const topReviewedProducts = await Review.aggregate([
    {
      $match: { status: "approved" },
    },
    {
      $group: {
        _id: "$product",
        reviewCount: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
    {
      $sort: { reviewCount: -1 },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: "$product",
    },
    {
      $project: {
        productId: "$_id",
        productName: "$product.name",
        productSlug: "$product.slug",
        reviewCount: 1,
        averageRating: 1,
      },
    },
  ]);

  return apiResponse.sendSuccess(res, 200, "Review statistics retrieved successfully", {
    totalReviews,
    averageRating: averageRating.length > 0 ? Math.round(averageRating[0].avgRating * 10) / 10 : 0,
    statusDistribution: stats,
    ratingDistribution,
    topReviewedProducts,
  });
});

// Upload review images
export const uploadReviewImages = asyncHandler(async (req, res) => {
  // Check if files were uploaded
  if (!req.files || !req.files.images || req.files.images.length === 0) {
    throw new CustomError(400, "No images provided for upload");
  }

  // Check max images (5)
  if (req.files.images.length > 5) {
    throw new CustomError(400, "Maximum 5 images allowed per review");
  }

  // Get file paths
  const imagePaths = req.files.images.map(file => file.path);

  // Upload to Cloudinary
  const imageUrls = await uploadImage(imagePaths);

  return apiResponse.sendSuccess(res, 200, "Review images uploaded successfully", {
    images: Array.isArray(imageUrls) ? imageUrls : [imageUrls],
    count: Array.isArray(imageUrls) ? imageUrls.length : 1,
  });
});
