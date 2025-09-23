import express from 'express';
import brand from './api/brand.api.js';
import category from './api/category.api.js';
import discount from './api/discount.api.js';
import subCategory from './api/subCategory.api.js';
import user from './api/user.api.js';
export const _ = express.Router();

_.use("/auth", user);
_.use("/category", category);
_.use("/subCategory", subCategory);
_.use("/brand", brand);
_.use("/discount", discount);


export default _;