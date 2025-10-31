import express from 'express';
import {
    createCoupon,
    deleteCoupon,
    getActiveCoupons,
    getAllCoupons,
    getCouponByCode,
    getCouponBySlug,
    toggleCouponStatus,
    updateCoupon,
    verifyCoupon,
} from '../../controllers/coupon.controller.js';

const _ = express.Router();

// Admin routes
_.route('/create-coupon').post(createCoupon);
_.route('/coupons').get(getAllCoupons);
_.route('/active-coupons').get(getActiveCoupons);
_.route('/coupon-slug/:slug').get(getCouponBySlug);
_.route('/update-coupon/:slug').put(updateCoupon);
_.route('/delete-coupon/:slug').delete(deleteCoupon);
_.route('/toggle-status/:slug').patch(toggleCouponStatus);

// Public/Customer routes
_.route('/verify-coupon').post(verifyCoupon);
_.route('/coupon-code/:code').get(getCouponByCode);

export default _;
