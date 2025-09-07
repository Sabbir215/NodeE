import express from 'express';
import category from './api/category.api.js';
import user from './api/user.api.js';
export const _ = express.Router();

_.use("/auth", user);
_.use("/category", category);


export default _;