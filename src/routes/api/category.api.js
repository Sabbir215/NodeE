import express from 'express';
import { createCategory, deleteCategory, getCategories, getCategoryBySlug, updateCategory } from '../../controllers/category.controller.js';
import upload from '../../middlewares/multer.middleware.js';
const _ = express.Router();

_.route('/create-category').post(upload.single('image'), createCategory);
_.route('/categories').get(getCategories);
_.route('/category-slug/:slug').get(getCategoryBySlug);
_.route('/update-category/:slug').put(upload.single('image'), updateCategory);
_.route('/delete-category/:slug').delete(deleteCategory);


export default _;