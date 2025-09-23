import express from 'express';
import { createDiscount, deleteDiscount, getDiscountBySlug, getDiscounts, updateDiscount } from '../../controllers/discount.controller.js';
const _ = express.Router();

_.route('/create-discount').post(createDiscount);
_.route('/discounts').get(getDiscounts);
_.route('/discount-slug/:slug').get(getDiscountBySlug);
_.route('/update-discount/:slug').put(updateDiscount);
_.route('/delete-discount/:slug').delete(deleteDiscount);


export default _;