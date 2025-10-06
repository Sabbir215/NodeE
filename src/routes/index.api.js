import express from 'express';
import brand from './api/brand.api.js';
import cart from './api/cart.api.js';
import category from './api/category.api.js';
import discount from './api/discount.api.js';
import product from './api/product.api.js';
import subCategory from './api/subCategory.api.js';
import user from './api/user.api.js';
import variant from './api/variant.api.js';
import wishlist from './api/wishlist.api.js';
export const _ = express.Router();

_.use("/auth", user);
_.use("/category", category);
_.use("/subCategory", subCategory);
_.use("/brand", brand);
_.use("/discount", discount);
_.use("/product", product);
_.use("/variant", variant);
_.use("/cart", cart);
_.use("/wishlist", wishlist);

export default _;