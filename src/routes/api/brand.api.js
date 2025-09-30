import express from 'express';
import { createBrand, deleteBrand, getBrandBySlug, getBrands, updateBrand } from '../../controllers/brand.controller.js';
import upload from '../../middlewares/multer.middleware.js';
const _ = express.Router();

_.route('/create-brand').post(upload.fields([{ name: 'image', maxCount: 1 }]), createBrand);
_.route('/brands').get(getBrands);
_.route('/brand-slug/:slug').get(getBrandBySlug);
_.route('/update-brand/:slug').put(upload.fields([{ name: 'image', maxCount: 1 }]), updateBrand);
_.route('/delete-brand/:slug').delete(deleteBrand);


export default _;