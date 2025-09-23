import express from 'express';
import { createBrand, deleteBrand, getBrandBySlug, getBrands, updateBrand } from '../../controllers/brand.controller.js';
import upload from '../../middlewares/multer.middleware.js';
const _ = express.Router();

_.route('/create-brand').post(upload.single('image'), createBrand);
_.route('/brands').get(getBrands);
_.route('/brand-slug/:slug').get(getBrandBySlug);
_.route('/update-brand/:slug').put(upload.single('image'), updateBrand);
_.route('/delete-brand/:slug').delete(deleteBrand);


export default _;