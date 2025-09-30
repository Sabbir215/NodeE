import express from 'express';
import { createVariant, deleteVariant, deleteImageFromVariant, getVariantBySlug, getVariants, getVariantsByProductSlug, updateVariant } from '../../controllers/variant.controller.js';
import upload from '../../middlewares/multer.middleware.js';
const _ = express.Router();

_.route('/create-variant').post(upload.fields([{ name: 'images', maxCount: 10 }]), createVariant);
_.route('/variants').get(getVariants);
_.route('/variant-slug/:slug').get(getVariantBySlug);
_.route('/product/:productSlug/variants').get(getVariantsByProductSlug);
_.route('/update-variant/:slug').put(upload.fields([{ name: 'images', maxCount: 10 }]), updateVariant);
_.route('/delete-variant/:slug').delete(deleteVariant);
_.route('/delete-images-slug/:slug').delete(deleteImageFromVariant);

export default _;