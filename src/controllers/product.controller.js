import { deleteImage, uploadImage } from "../helpers/cloudinary.js";
import Brand from "../models/brand.model.js";
import Category from "../models/category.model.js";
import Discount from "../models/discount.model.js";
import Product from "../models/product.model.js";
import SubCategory from "../models/subCategory.model.js";
import Variant from "../models/variant.model.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import CustomError from "../utils/customError.js";
import productValidationSchema from "../validations/product.validation.js";

// Create a new product
export const createProduct = asyncHandler(async (req, res, next) => {

  // Validate product data
  const validatedData = await productValidationSchema(req);

  // Handle multiple image uploads
  if (req.files.images) {
    const imagePaths = req.files.images.map(file => file.path);
    validatedData.images = await uploadImage(imagePaths);
  }

  const { name, description, category, subCategory, brand, discount, sku, variantType, retailPrice, wholesalePrice, stock, alertQuantity, tags, images } = validatedData;

  // Check if product with the same name already exists
  const existingProduct = await Product.findOne({ name });
  if (existingProduct) {
    return next(new CustomError(400, "Product with this name already exists"));
  }

  // Check if SKU already exists
  const existingSKU = await Product.findOne({ sku });
  if (existingSKU) {
    return next(new CustomError(400, "Product with this SKU already exists"));
  }

  // Validate that the category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    return next(new CustomError(400, "Category does not exist"));
  }

  // Validate that the subcategory exists
  const subCategoryExists = await SubCategory.findById(subCategory);
  if (!subCategoryExists) {
    return next(new CustomError(400, "SubCategory does not exist"));
  }

  // Validate that the brand exists
  const brandExists = await Brand.findById(brand);
  if (!brandExists) {
    return next(new CustomError(400, "Brand does not exist"));
  }

  // Validate discount if provided
  if (discount) {
    const discountExists = await Discount.findById(discount);
    if (!discountExists) {
      return next(new CustomError(400, "Discount does not exist"));
    }
  }

  // Create the product first
  const product = new Product({
    name,
    description,
    category,
    subCategory,
    brand,
    discount: discount || undefined,
    sku,
    variantType,
    retailPrice,
    wholesalePrice,
    stock,
    alertQuantity,
    tags,
    images: images || [],
  });

  // Update the category to include this product
  await Category.findByIdAndUpdate(
    category,
    { $addToSet: { products: product._id } }
  );

  // Update the subcategory to include this product
  await SubCategory.findByIdAndUpdate(
    subCategory,
    { $addToSet: { products: product._id } }
  );

  // Update the brand to include this product
  await Brand.findByIdAndUpdate(
    brand,
    { $addToSet: { products: product._id } }
  );

  // Update discount if provided
  if (discount) {
    product.discounts = [discount];
  }

  await product.save();

  apiResponse.sendSuccess(res, 201, "Product created successfully", product);
});

export const deleteProduct = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  
  const product = await Product.findOne({ slug });
  if (!product) {
    return next(new CustomError(404, "Product not found"));
  }
  
  // Delete all associated variants first
  if (product.variants && product.variants.length > 0) {
    // Find all variants associated with this product
    const variants = await Variant.find({ product: product._id });
    
    // Delete images for each variant and then delete the variants
    for (const variant of variants) {
      if (variant.images.length > 0) {
        await deleteImage(variant.images);
      }
    }
    
    // Delete all variants associated with this product
    await Variant.deleteMany({ product: product._id });
  }
  
  // Delete all images associated with this product
  if (product.images && product.images.length > 0) {
    await deleteImage(product.images);
  }
  
  // Remove product reference from category
  if (product.category) {
    await Category.findByIdAndUpdate(
      product.category,
      { $pull: { products: product._id } }
    );
  }
  
  // Remove product reference from subcategory
  if (product.subCategory) {
    await SubCategory.findByIdAndUpdate(
      product.subCategory,
      { $pull: { products: product._id } }
    );
  }
  
  // Remove product reference from brand
  if (product.brand) {
    await Brand.findByIdAndUpdate(
      product.brand,
      { $pull: { products: product._id } }
    );
  }
  
  // Delete the product
  const deletedProduct = await Product.findOneAndDelete({ slug });
  if (!deletedProduct) next(new CustomError(500, "Failed to delete product"));
  
  apiResponse.sendSuccess(res, 200, "Product deleted successfully", null);
});

export const deleteImageFromProduct = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const product = await Product.findOne({ slug });
  if (!product) {
    return next(new CustomError(404, "Product not found"));
  }

  const { imageUrls } = req.body;
if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    return next(new CustomError(400, "Invalid Request to delete images"));
    }

  // Remove images from product
  product.images = product.images.filter(image => !imageUrls.includes(image));
  await product.save();

  apiResponse.sendSuccess(res, 200, "Images deleted successfully", null);
});

export const updateProduct = asyncHandler(async (req, res, next) => {

  const { slug } = req.params;
  const product = await Product.findOne({ slug });
  if (!product) {
    return next(new CustomError(404, "Product not found"));
  }

  // otherwise validator will be upset
  if (!req.body.name) req.body.name = product.name;
  if (!req.body.category) req.body.category = product.category.toString();
  if (!req.body.subCategory) req.body.subCategory = product.subCategory.toString();
  if (!req.body.brand) req.body.brand = product.brand.toString();
  if (!req.body.sku) req.body.sku = product.sku;
  if (!req.body.retailPrice) req.body.retailPrice = product.retailPrice;

  // Validate product data
  const validatedData = await productValidationSchema(req);
  
  let { name, description, category, subCategory, brand, discount, sku, variantType, retailPrice, wholesalePrice, stock, alertQuantity, tags, images } = validatedData;

  // Check if product name is being changed and if new name already exists
  if (name !== product.name) {
    const existingProduct = await Product.findOne({ 
      name: name,
      _id: { $ne: product._id } 
    });
    if (existingProduct) {
      return next(new CustomError(400, "Product with this name already exists"));
    }
  }

  // Check if SKU is being changed and if new SKU already exists
  if (sku && sku !== product.sku) {
    const existingSKU = await Product.findOne({ 
      sku: sku,
      _id: { $ne: product._id } 
    });
    if (existingSKU) {
      return next(new CustomError(400, "Product with this SKU already exists"));
    }
  }

  // Handle category change
  if (category && category.toString() !== product.category.toString()) {
    // Validate new category exists
    const newCategoryExists = await Category.findById(category);
    if (!newCategoryExists) {
      return next(new CustomError(400, "New Category does not exist"));
    }

    // Remove from old category
    await Category.findByIdAndUpdate(
      product.category,
      { $pull: { products: product._id } }
    );

    // Add to new category
    await Category.findByIdAndUpdate(
      category,
      { $addToSet: { products: product._id } }
    );

    product.category = category;
  }

  // Handle subcategory change
  if (subCategory && subCategory.toString() !== product.subCategory.toString()) {
    // Validate new subcategory exists
    const newSubCategoryExists = await SubCategory.findById(subCategory);
    if (!newSubCategoryExists) {
      return next(new CustomError(400, "New SubCategory does not exist"));
    }

    // Remove from old subcategory
    await SubCategory.findByIdAndUpdate(
      product.subCategory,
      { $pull: { products: product._id } }
    );

    // Add to new subcategory
    await SubCategory.findByIdAndUpdate(
      subCategory,
      { $addToSet: { products: product._id } }
    );

    product.subCategory = subCategory;
  }

  // Handle brand change
  if (brand && brand.toString() !== product.brand.toString()) {
    // Validate new brand exists
    const newBrandExists = await Brand.findById(brand);
    if (!newBrandExists) {
      return next(new CustomError(400, "New Brand does not exist"));
    }

    // Remove from old brand
    await Brand.findByIdAndUpdate(
      product.brand,
      { $pull: { products: product._id } }
    );

    // Add to new brand
    await Brand.findByIdAndUpdate(
      brand,
      { $addToSet: { products: product._id } }
    );

    product.brand = brand;
  }

  if (name) product.name = name;
  if (description) product.description = description;
  if (req.files.images.length + (product?.images?.length || 0) <= 10) {
      const imagePaths = req.files.images.map(file => file.path);
      images = await uploadImage(imagePaths);
      console.log(product.images);
      product.images.push(...images);
    } else if (req.files.images.length + (product?.images?.length || 0) > 10) {
    return next(new CustomError(400, "Cannot have more than 10 images per product"));
  }
  if (discount) product.discounts.push(discount);
  if (sku) product.sku = sku;
  if (variantType) product.variantType = variantType;
  if (retailPrice) product.retailPrice = retailPrice;
  if (wholesalePrice) product.wholesalePrice = wholesalePrice;
  if (stock) product.stock = stock;
  if (alertQuantity) product.alertQuantity = alertQuantity;
  if (tags) product.tags = tags;

  await product.save();

  apiResponse.sendSuccess(res, 200, "Product updated successfully", product);
});

export const getProducts = asyncHandler(async (req, res, next) => {
  const products = await Product.find()
    .populate('category subCategory brand variants discounts');
  apiResponse.sendSuccess(res, 200, "Products retrieved successfully", products);
});

export const getProductBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const product = await Product.findOne({ slug })
    .populate('category subCategory brand variants discounts');
  if (!product) {
    return next(new CustomError(404, "Product not found"));
  }
  apiResponse.sendSuccess(res, 200, "Product retrieved successfully", product);
});