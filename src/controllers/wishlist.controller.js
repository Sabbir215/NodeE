import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Wishlist from "../models/wishlist.model.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import CustomError from "../utils/customError.js";
import wishlistValidationSchema from "../validations/wishlist.validation.js";

// Add to wishlist
export const addToWishlist = asyncHandler(async (req, res) => {

  // validate request body
  const validatedData = await wishlistValidationSchema(req);
  const { product, user } = validatedData;

  // check if user and product are real
  const existingUser = await User.findById(user);
  if (!existingUser) {
    throw new CustomError(404, "User not found");
  }
  const existingProduct = await Product.findById(product);
  if (!existingProduct) {
    throw new CustomError(404, "Product not found");
  }

  // check if product already in wishlist and update if exists, if not add new
  const existingWishlist = await Wishlist.findOne({user});

  if (existingWishlist && existingWishlist.products.length > 0 && existingWishlist.products.some(p => p.product.toString() === product)) {
    throw new CustomError(400, "Product already in wishlist");
  } else if (existingWishlist) {
    existingWishlist.products.push({ product, addedAt: new Date() });
    const updatedWishlist = await existingWishlist.save();
    return apiResponse.sendSuccess(res, 200, "Product added to wishlist", updatedWishlist);
  } else {
    const newWishlist = await Wishlist.create({
      user,
      products: [{ product, addedAt: new Date() }],
    });
    if (!newWishlist) {
      throw new CustomError(500, "Failed to add product to wishlist");
    }
    return apiResponse.sendSuccess(res, 201, "Product added to wishlist", newWishlist);
  }
});

// get all wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const { user } = req.body;

  // check if user is real
  const existingUser = await User.findById(user);
  if (!existingUser) {
    throw new CustomError(404, "User not found or invalid user request");
  }

  // get wishlist items
  const wishlistItems = await Wishlist.find({ user, "products.0": { $exists: true } }).populate("products.product");
  
  if (!wishlistItems || wishlistItems.length === 0) {
    return apiResponse.sendSuccess(res, 200, "Wishlist is empty", []);
  }
  
  return apiResponse.sendSuccess(res, 200, "Wishlist fetched successfully", wishlistItems);
});

// remove selected wishlists
export const removeSelectedWishlists = asyncHandler(async (req, res) => {
    let { user, products } = req.body;

    // validate input - convert single product to array if needed
    if (typeof products === 'string') {
      products = [products];
    } 
    if (!Array.isArray(products)) {
      throw new CustomError(400, "Products must be a string or array");
    }

    // check if user is real
    const existingUser = await User.findById(user);
    if (!existingUser) {
      throw new CustomError(404, "User not found");
    }

    // remove selected products from wishlist
    const updatedWishlist = await Wishlist.findOneAndUpdate(
      { user },
      { $pull: { products: { product: { $in: products } } } },
      { new: true }
    ).populate("products.product");

    if (!updatedWishlist) {
      throw new CustomError(404, "Wishlist not found");
    }

    const message = products.length === 1 ? "Product removed from wishlist" : "Products removed from wishlist";
    return apiResponse.sendSuccess(res, 200, message, updatedWishlist);
});

// move to cart
export const moveToCart = asyncHandler(async (req, res) => {
  const { user, products } = req.body;

  // validate input - convert single product to array if needed
  if (typeof products === 'string') {
    products = [products];
  } if (!Array.isArray(products)) {
    throw new CustomError(400, "Products must be a string or array");
  }

  // check if user is real
  const existingUser = await User.findById(user);
  if (!existingUser) {
    throw new CustomError(404, "User not found");
  }
  
  // check if wishlist exists and has products
  const existingWishlist = await Wishlist.findOne({ user });
  if (!existingWishlist || existingWishlist.products.length === 0) {
    throw new CustomError(404, "Wishlist not found or wishlist is empty");
  }

  // check if products exist in wishlist
  const wishlistProducts = existingWishlist.products.filter(item => 
    products.includes(item.product.toString())
  );
  if (wishlistProducts.length === 0) {
    throw new CustomError(404, "Selected products not found in wishlist");
  }

  // check if products are available and have stock
  for (const item of wishlistProducts) {
    const product = await Product.findById(item.product);
    if (!product) {
      throw new CustomError(404, `Product not found`);
    }
    if (product.stock < 1) {
      throw new CustomError(400, `Product is out of stock`);
    }
  }

  // Add wishlist items to cart
  let addedToCart = [];
  let existingCart = await Cart.findOne({ user });
  
  for (const item of wishlistProducts) {
    if (existingCart) {
      // Cart exists, check if product already in cart
      const existingCartProduct = existingCart.products.find(p => p.product.toString() === item.product.toString());
      
      if (existingCartProduct) {
        // Product already in cart, increment quantity
        existingCartProduct.quantity += 1;
      } else {
        // Add new product to existing cart
        existingCart.products.push({ product: item.product, quantity: 1 });
      }
    } else {
      // Create new cart with the first product
      existingCart = await Cart.create({
        user,
        products: [{ product: item.product, quantity: 1 }]
      });
    }
    
    // Decrement product stock
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -1 } });
    addedToCart.push(item.product);
  }
  
  // Save the cart if it was modified (not newly created)
  if (existingCart && !existingCart.isNew) {
    await existingCart.save();
  }

  // Remove items from wishlist after successfully adding to cart
  await Wishlist.findOneAndUpdate(
    { user },
    { $pull: { products: { product: { $in: products } } } }
  );

  const message = products.length === 1 ? "Product moved to cart" : "Products moved to cart";
  return apiResponse.sendSuccess(res, 200, message, { movedProducts: addedToCart });
});

// get wishlist count
export const getWishlistCount = asyncHandler(async (req, res) => {
  const { user } = req.body;

  const existingUser = await User.findById(user);
  if (!existingUser) {
    throw new CustomError(404, "User not found or invalid user request");
  }

  const existingWishlist = await Wishlist.findOne({ user });
  if (!existingWishlist) {
    return apiResponse.sendSuccess(res, 200, "Wishlist is empty", { count: 0 });
  }

  const wishlistCount = existingWishlist.products.length;
  return apiResponse.sendSuccess(res, 200, "Wishlist count fetched successfully", { count: wishlistCount });
});