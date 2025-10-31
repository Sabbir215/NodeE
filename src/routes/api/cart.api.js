import express from 'express';
import { addCartItemQuantity, addToCart, applyCoupon, countCartItems, getCartItems, removeCoupon, removeSelectedCartItems, setCartItemQuantity, subtractCartItemQuantity, totalCartPrice } from '../../controllers/cart.controller.js';
const _ = express.Router();


_.route('/count-cart-items').get(countCartItems);
_.route('/add-to-cart').post(addToCart);
_.route('/remove-selected-cart-items').patch(removeSelectedCartItems);
_.route('/get-cart').get(getCartItems);
_.route('/total-cart-price').get(totalCartPrice);
_.route('/add-cart-item-quantity').patch(addCartItemQuantity);
_.route('/subtract-cart-item-quantity').patch(subtractCartItemQuantity);
_.route('/set-cart-item-quantity').patch(setCartItemQuantity);
_.route('/apply-coupon').post(applyCoupon);
_.route('/remove-coupon').post(removeCoupon);

export default _;