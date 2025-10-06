import express from 'express';
import { addToWishlist, getWishlist, getWishlistCount, moveToCart, removeSelectedWishlists } from '../../controllers/wishlist.controller.js';
const _ = express.Router();

_.route('/add-to-wishlist').post(addToWishlist);
_.route('/get-wishlist').get(getWishlist);
_.route('/remove-selected-wishlists').patch(removeSelectedWishlists);
_.route('/move-to-cart').post(moveToCart);
_.route('/count-wishlist').get(getWishlistCount);



export default _;