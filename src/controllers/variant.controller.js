import { deleteImage, uploadImage } from "../helpers/cloudinary.js";
import Product from "../models/product.model.js";
import Variant from "../models/variant.model.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import CustomError from "../utils/customError.js";
import variantValidationSchema from "../validations/variant.validation.js";

// Create a new variant
export const createVariant = asyncHandler(async (req, res, next) => {

  // Validate variant data
  const validatedData = await variantValidationSchema(req);

  // Handle multiple image uploads
  if (req.files.images) {
    const imagePaths = req.files.images.map(file => file.path);
    validatedData.images = await uploadImage(imagePaths);
  }

  const { product, name, description, color, size, stock, alertStock, retailPrice, wholesalePrice, images } = validatedData;

  // Check if variant with the same name already exists for this product
  const existingVariant = await Variant.findOne({ name, product });
  if (existingVariant) {
    return next(new CustomError(400, "Variant with this name already exists for this product"));
  }

  // Validate that the product exists
  const productExists = await Product.findById(product);
  if (!productExists) {
    return next(new CustomError(400, "Product does not exist"));
  }

  // Create the variant first
  const variant = new Variant({
    product,
    name,
    description,
    color,
    size,
    stock,
    alertStock,
    retailPrice,
    wholesalePrice,
    images: images || [],
  });

  // Update the product to include this variant
  await Product.findByIdAndUpdate(
    product,
    { $addToSet: { variants: variant._id } }
  );

  await variant.save();

  apiResponse.sendSuccess(res, 201, "Variant created successfully", variant);
});

export const deleteVariant = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  
  const variant = await Variant.findOne({ slug });
  if (!variant) {
    return next(new CustomError(404, "Variant not found"));
  }
  
  // Delete all images associated with this variant
  if (variant.images.length > 0) {
    await deleteImage(variant.images);
  }
  
  // Remove variant reference from product
  if (variant.product) {
    await Product.findByIdAndUpdate(
      variant.product,
      { $pull: { variants: variant._id } }
    );
  }
  
  // Delete the variant
  const deletedVariant = await Variant.findOneAndDelete({ slug });
  if (!deletedVariant) next(new CustomError(500, "Failed to delete variant"));
  
  apiResponse.sendSuccess(res, 200, "Variant deleted successfully", null);
});

export const deleteImageFromVariant = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const variant = await Variant.findOne({ slug });
  if (!variant) {
    return next(new CustomError(404, "Variant not found"));
  }

  const { imageUrls } = req.body;
  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    return next(new CustomError(400, "Invalid Request to delete images"));
  }

  // Remove images from variant
  variant.images = variant.images.filter(image => !imageUrls.includes(image));
  await variant.save();

  apiResponse.sendSuccess(res, 200, "Images deleted successfully", null);
});

export const updateVariant = asyncHandler(async (req, res, next) => {

  const { slug } = req.params;
  const variant = await Variant.findOne({ slug });
  if (!variant) {
    return next(new CustomError(404, "Variant not found"));
  }

  // otherwise validator will be upset
  if (!req.body.product) req.body.product = variant.product.toString();
  if (!req.body.name) req.body.name = variant.name;
  if (!req.body.retailPrice) req.body.retailPrice = variant.retailPrice;

  // Validate variant data
  const validatedData = await variantValidationSchema(req);
  
  const { product, name, description, color, size, stock, alertStock, retailPrice, wholesalePrice, images } = validatedData;

  // Check if variant name is being changed and if new name already exists for this product
  if (name !== variant.name) {
    const existingVariant = await Variant.findOne({ 
      name: name,
      product: variant.product,
      _id: { $ne: variant._id } 
    });
    if (existingVariant) {
      return next(new CustomError(400, "Variant with this name already exists for this product"));
    }
  }

  // Handle product change
  if (product && product.toString() !== variant.product.toString()) {
    // Validate new product exists
    const newProductExists = await Product.findById(product);
    if (!newProductExists) {
      return next(new CustomError(400, "New Product does not exist"));
    }

    // Remove from old product
    await Product.findByIdAndUpdate(
      variant.product,
      { $pull: { variants: variant._id } }
    );

    // Add to new product
    await Product.findByIdAndUpdate(
      product,
      { $addToSet: { variants: variant._id } }
    );

    variant.product = product;
  }

  if (name) variant.name = name;
  if (description) variant.description = description;
  
  // Handle image uploads if provided
  if (req.files?.images && req.files.images.length > 0) {
    const currentImageCount = variant?.images?.length || 0;
    const newImageCount = req.files.images.length;
    
    if (currentImageCount + newImageCount <= 10) {
      const imagePaths = req.files.images.map(file => file.path);
      const uploadedImages = await uploadImage(imagePaths);
      variant.images.push(...uploadedImages);
    } else {
      return next(new CustomError(400, "Cannot have more than 10 images per variant"));
    }
  }
  
  if (color) variant.color = color;
  if (size) variant.size = size;
  if (stock) variant.stock = stock;
  if (alertStock) variant.alertStock = alertStock;
  if (retailPrice) variant.retailPrice = retailPrice;
  if (wholesalePrice) variant.wholesalePrice = wholesalePrice;

  await variant.save();

  apiResponse.sendSuccess(res, 200, "Variant updated successfully", variant);
});

export const getVariants = asyncHandler(async (req, res, next) => {
  const variants = await Variant.find()
    .populate('product');
  apiResponse.sendSuccess(res, 200, "Variants retrieved successfully", variants);
});

export const getVariantBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const variant = await Variant.findOne({ slug })
    .populate('product');
  if (!variant) {
    return next(new CustomError(404, "Variant not found"));
  }
  apiResponse.sendSuccess(res, 200, "Variant retrieved successfully", variant);
});

export const getVariantsByProductSlug = asyncHandler(async (req, res, next) => {
  const { productSlug } = req.params;
  
  // Find the product first
  const product = await Product.findOne({ slug: productSlug });
  if (!product) {
    return next(new CustomError(404, "Product not found"));
  }
  
  // Find all variants for this product
  const variants = await Variant.find({ product: product._id })
    .populate('product');
  
  apiResponse.sendSuccess(res, 200, "Product variants retrieved successfully", variants);
});