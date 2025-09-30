import express from 'express';
import { createProduct, deleteImageFromProduct, deleteProduct, getProductBySlug, getProducts, updateProduct } from '../../controllers/product.controller.js';
import { getVariantsByProductSlug } from '../../controllers/variant.controller.js';
import upload from '../../middlewares/multer.middleware.js';
const _ = express.Router();

_.route('/create-product').post(upload.fields([{ name: 'images', maxCount: 10 }]), createProduct);
_.route('/products').get(getProducts);
_.route('/product-slug/:slug').get(getProductBySlug);
_.route('/product/:productSlug/variants').get(getVariantsByProductSlug);
_.route('/update-product/:slug').put(upload.fields([{ name: 'images', maxCount: 10 }]), updateProduct);
_.route('/delete-product/:slug').delete(deleteProduct);
_.route('/delete-images-slug/:slug').delete(deleteImageFromProduct);

export default _;