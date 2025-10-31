import Cart from "../models/cart.model.js";
import Coupon from "../models/coupon.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import CustomError from "../utils/customError.js";
import cartValidationSchema from "../validations/cart.validation.js";

// Add to cart
export const addToCart = asyncHandler(async (req, res) => {
  const validatedData = await cartValidationSchema(req);

  const { product, user } = validatedData;

  // check if user is real
  const existingUser = await User.findById(user);
  if (!existingUser) {
    throw new CustomError(404, "User not found");
  }

  // check if product is real
  const existingProduct = await Product.findById(product);
  if (existingProduct.stock < 1) {
    throw new CustomError(400, "Product is out of stock");
  }
  if (!existingProduct) {
    throw new CustomError(404, "Product not found");
  }

  // check if product already in cart and update quantity if exists if not add new
  const existingCart = await Cart.findOne({user});

  if (existingCart && existingCart.products.length > 0 && existingCart.products.some(p => p.product.toString() === product)) {
    const updatedCart = await Cart.findOneAndUpdate(
      { user, "products.product": product },
      { $inc: { "products.$.quantity": 1 } },
      { new: true }
    );
    return apiResponse.sendSuccess(res, 200, "Product quantity updated in cart", updatedCart);
  } else if (existingCart) {
    existingCart.products.push({ product, quantity: 1 });
    const updatedCart = await existingCart.save();
    return apiResponse.sendSuccess(res, 200, "Product added to cart", updatedCart);
  } else {
    const newCart = await Cart.create({
      user,
      products: [{ product, quantity: 1 }],
    });
    if (!newCart) {
      throw new CustomError(500, "Failed to add product to cart");
    }
    return apiResponse.sendSuccess(res, 201, "Product added to cart", newCart);
  }
});

// get all cart items
export const getCartItems = asyncHandler(async (req, res) => {
  const { user } = req.body;

  // check if user is real
  const existingUser = await User.findById(user);
  if (!existingUser) {
    throw new CustomError(404, "User not found or invalid user request");
  }

  // get cart items
  const cartItems = await Cart.find({ user, "products.0": { $exists: true } }).populate("products.product");
  
  if (!cartItems || cartItems.length === 0) {
    return apiResponse.sendSuccess(res, 200, "Cart is empty", []);
  }
  
  return apiResponse.sendSuccess(res, 200, "Cart fetched successfully", cartItems);
});

// remove selected cart items
export const removeSelectedCartItems = asyncHandler(async (req, res) => {
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

  // check if cart exists
  const existingCart = await Cart.findOne({ user });
  if (!existingCart || existingCart.products.length === 0) {
    throw new CustomError(404, "Cart not found or cart is empty");
  }

  // get quantities of products being removed to restore stock
  const productsToRemove = existingCart.products.filter(item => 
    products.includes(item.product.toString())
  );

  // restore stock for removed products
  for (const item of productsToRemove) {
    await Product.findByIdAndUpdate(item.product, { 
      $inc: { stock: item.quantity } 
    });
  }

  // remove selected products from cart
  const updatedCart = await Cart.findOneAndUpdate(
    { user },
    { $pull: { products: { product: { $in: products } } } },
    { new: true }
  ).populate("products.product");

  if (!updatedCart) {
    throw new CustomError(500, "Failed to remove products from cart");
  }

  return apiResponse.sendSuccess(res, 200, "Products removed from cart", updatedCart);
});

// add cart item quantity
export const addCartItemQuantity = asyncHandler(async (req, res) => {
  const { user, product } = req.body;
  
  // check if user is real and product in cart and increment quantity
  const existingUser = await User.findById(user);
  if (!existingUser) {
    throw new CustomError(404, "User not found");
  }

  const existingCart = await Cart.findOne({ user });
  if (!existingCart || existingCart.products.length === 0) {
    throw new CustomError(404, "Cart not found or cart is empty");
  }

  // check if product in cart
  const cartProduct = existingCart.products.find(p => p.product.toString() === product);
  if (!cartProduct) {
    throw new CustomError(404, "Product not found in cart");
  }

  // check if product is real and stock available
  const existingProduct = await Product.findById(product);
  if (!existingProduct) {
    throw new CustomError(404, "Product not found");
  }

  // check if product has stock available
  if (existingProduct.stock < 1) {
    throw new CustomError(400, "Product is out of stock");
  }

  // check if incrementing quantity will exceed limit (assuming max 100 per product)
  if (cartProduct.quantity >= 100) {
    throw new CustomError(400, "Maximum quantity limit reached for this product");
  }

  // increment cart quantity and decrement product stock
  const updatedCart = await Cart.findOneAndUpdate(
    { user, "products.product": product },
    { $inc: { "products.$.quantity": 1 } },
    { new: true }
  ).populate("products.product");

  // decrement product stock
  await Product.findByIdAndUpdate(product, { $inc: { stock: -1 } });

  return apiResponse.sendSuccess(res, 200, "Product quantity updated in cart", updatedCart);
});

// subtract cart item quantity
export const subtractCartItemQuantity = asyncHandler(async (req, res) => {
  const { user, product } = req.body;

  // check if user is real
  const existingUser = await User.findById(user);
  if (!existingUser) {
    throw new CustomError(404, "User not found");
  }

  const existingCart = await Cart.findOne({ user });
  if (!existingCart || existingCart.products.length === 0) {
    throw new CustomError(404, "Cart not found or cart is empty");
  }

  // check if product in cart
  const cartProduct = existingCart.products.find(p => p.product.toString() === product);
  if (!cartProduct) {
    throw new CustomError(404, "Product not found in cart");
  }

  // check if product is real and stock available
  const existingProduct = await Product.findById(product);
  if (!existingProduct) {
    throw new CustomError(404, "Product not found");
  }

  // check if product has stock available
  if (existingProduct.stock < 1) {
    throw new CustomError(400, "Product is out of stock");
  }

  // check if decrementing quantity will exceed limit (assuming min 1 per product)
  if (cartProduct.quantity <= 1) {
    throw new CustomError(400, "Minimum quantity limit reached for this product");
  }

  // decrement cart quantity and increment product stock
  const updatedCart = await Cart.findOneAndUpdate(
    { user, "products.product": product },
    { $inc: { "products.$.quantity": -1 } },
    { new: true }
  ).populate("products.product");

  // increment product stock
  await Product.findByIdAndUpdate(product, { $inc: { stock: 1 } });

  return apiResponse.sendSuccess(res, 200, "Product quantity updated in cart", updatedCart);
});

// set cart item quantity
export const setCartItemQuantity = asyncHandler(async (req, res) => {
  const { user, product, quantity } = req.body;

  // validate quantity
  if (!quantity || quantity < 1 || quantity > 100) {
    throw new CustomError(400, "Quantity must be between 1 and 100");
  }

  // check if user is real
  const existingUser = await User.findById(user);
  if (!existingUser) {
    throw new CustomError(404, "User not found");
  }

  const existingCart = await Cart.findOne({ user });
  if (!existingCart || existingCart.products.length === 0) {
    throw new CustomError(404, "Cart not found or cart is empty");
  }

  // check if product in cart
  const cartProduct = existingCart.products.find(p => p.product.toString() === product);
  if (!cartProduct) {
    throw new CustomError(404, "Product not found in cart");
  }

  // check if product is real
  const existingProduct = await Product.findById(product);
  if (!existingProduct) {
    throw new CustomError(404, "Product not found");
  }

  // calculate stock difference needed
  const currentQuantity = cartProduct.quantity;
  const quantityDifference = quantity - currentQuantity;

  // check if we have enough stock for the increase
  if (quantityDifference > 0 && existingProduct.stock < quantityDifference) {
    throw new CustomError(400, "Insufficient stock available");
  }

  // update cart quantity
  const updatedCart = await Cart.findOneAndUpdate(
    { user, "products.product": product },
    { $set: { "products.$.quantity": quantity } },
    { new: true }
  ).populate("products.product");

  // update product stock (opposite of quantity change)
  await Product.findByIdAndUpdate(product, { $inc: { stock: -quantityDifference } });

  return apiResponse.sendSuccess(res, 200, "Product quantity set in cart", updatedCart);
});

// count cart items
export const countCartItems = asyncHandler(async (req, res) => {
  const { user } = req.body;

  // check if user is real
  const existingUser = await User.findById(user);
  if (!existingUser) {
    throw new CustomError(404, "User not found");
  }

  const existingCart = await Cart.findOne({ user });
  if (!existingCart) {
    return apiResponse.sendSuccess(res, 200, "Cart is empty", { itemCount: 0 });
  }

  const itemCount = existingCart.products.reduce((total, item) => total + item.quantity, 0);

  return apiResponse.sendSuccess(res, 200, "Cart item count fetched", { itemCount });
});

// total cart price
export const totalCartPrice = asyncHandler(async (req, res) => {
  const { user } = req.body;

  // check if user is real
  const existingUser = await User.findById(user);
  if (!existingUser) {
    throw new CustomError(404, "User not found");
  }

  const existingCart = await Cart.findOne({ user }).populate("products.product");
  if (!existingCart) {
    return apiResponse.sendSuccess(res, 200, "Cart is empty", { totalPrice: 0 });
  }

  const totalPrice = existingCart.products.reduce((total, item) => {
    const productPrice = item.product ? item.product.retailPrice : 0;
    return total + (productPrice * item.quantity);
  }, 0);

  return apiResponse.sendSuccess(res, 200, "Total cart price fetched", { totalPrice });
});

// Apply coupon to cart
export const applyCoupon = asyncHandler(async (req, res) => {
  const { user, code } = req.body;

  if (!code) {
    throw new CustomError(400, "Coupon code is required");
  }

  // Find user's cart
  const cart = await Cart.findOne({ user }).populate("products.product");
  if (!cart || cart.products.length === 0) {
    throw new CustomError(404, "Cart is empty");
  }

  // Calculate cart total
  const cartTotal = cart.products.reduce((total, item) => {
    const productPrice = item.product ? item.product.retailPrice : 0;
    return total + (productPrice * item.quantity);
  }, 0);

  // Find and validate coupon
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
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
    const cartProductIds = cart.products.map(item => item.product._id.toString());
    const applicableProductIds = coupon.applicableProducts.map(p => p.toString());
    const hasApplicableProduct = cartProductIds.some(id => applicableProductIds.includes(id));

    if (!hasApplicableProduct) {
      throw new CustomError(400, "This coupon is not applicable to items in your cart");
    }
  }

  // Calculate discount
  const discountAmount = Math.round(coupon.calculateDiscount(cartTotal));
  const finalAmount = Math.max(0, cartTotal - discountAmount);

  // Update cart with coupon details
  cart.coupon = coupon._id;
  cart.discountAmount = discountAmount;
  cart.discountType = coupon.discountType;
  await cart.save();

  // Increment coupon usage count
  coupon.usedCount += 1;
  await coupon.save();

  return apiResponse.sendSuccess(res, 200, "Coupon applied successfully", {
    cart,
    cartTotal,
    discountAmount,
    finalAmount,
    savings: discountAmount,
  });
});

// Remove coupon from cart
export const removeCoupon = asyncHandler(async (req, res) => {
  const { user } = req.body;

  // Find user's cart
  const cart = await Cart.findOne({ user });
  if (!cart) {
    throw new CustomError(404, "Cart not found");
  }

  if (!cart.coupon) {
    throw new CustomError(400, "No coupon applied to this cart");
  }

  // Decrement coupon usage count
  const coupon = await Coupon.findById(cart.coupon);
  if (coupon && coupon.usedCount > 0) {
    coupon.usedCount -= 1;
    await coupon.save();
  }

  // Remove coupon from cart
  cart.coupon = null;
  cart.discountAmount = 0;
  cart.discountType = null;
  await cart.save();

  return apiResponse.sendSuccess(res, 200, "Coupon removed successfully", cart);
});


