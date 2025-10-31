import express from 'express';
import {
    createReview,
    deleteReview,
    getAllReviews,
    getProductReviews,
    getReviewById,
    getReviewStatistics,
    getUserReviews,
    markHelpful,
    toggleReviewStatus,
    updateReview,
    uploadReviewImages,
} from '../../controllers/review.controller.js';
import upload from '../../middlewares/multer.middleware.js';

const _ = express.Router();

// Public/Customer routes
_.route('/create-review').post(upload.fields([{ name: 'images', maxCount: 5 }]), createReview);
_.route('/product/:productId').get(getProductReviews);
_.route('/user/:userId').get(getUserReviews);
_.route('/review/:reviewId').get(getReviewById);
_.route('/update-review/:reviewId').put(upload.fields([{ name: 'images', maxCount: 5 }]), updateReview);
_.route('/delete-review/:reviewId').delete(deleteReview);
_.route('/mark-helpful/:reviewId').post(markHelpful);

// Image upload endpoint (can be used separately)
_.route('/upload-images').post(upload.fields([{ name: 'images', maxCount: 5 }]), uploadReviewImages);

// Admin routes
_.route('/all-reviews').get(getAllReviews);
_.route('/toggle-status/:reviewId').patch(toggleReviewStatus);
_.route('/statistics').get(getReviewStatistics);

export default _;
