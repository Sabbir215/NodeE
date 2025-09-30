import express from 'express';
import { createSubCategory, deleteSubCategory, getSubCategories, getSubCategoryBySlug, updateSubCategory } from '../../controllers/subCategory.controller.js';
import upload from '../../middlewares/multer.middleware.js';
const _ = express.Router();

_.route('/create-subCategory').post(upload.fields([{ name: 'image', maxCount: 1 }]), createSubCategory);
_.route('/subCategories').get(getSubCategories);
_.route('/subCategory-slug/:slug').get(getSubCategoryBySlug);
_.route('/update-subCategory/:slug').put(upload.fields([{ name: 'image', maxCount: 1 }]), updateSubCategory);
_.route('/delete-subCategory/:slug').delete(deleteSubCategory);


export default _;