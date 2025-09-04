import express from 'express';
import { forgotPassword, login, logout, otpVerification, registration, resendOtpVerification, resendVerification, resetPassword, verifyEmail } from '../../controllers/user.controller.js';
const _ = express.Router();

_.route('/registration').get(registration);
_.route('/verify-email').get(verifyEmail);
// _.route('/verified-success').get(verifiedSuccess);
_.route('/resend-verification').get(resendVerification);
_.route('/resend-otp-verification').get(resendOtpVerification);
_.route('/forgot-password').get(forgotPassword);
_.route('/reset-password').get(resetPassword);
_.route('/otp-verification').get(otpVerification);
_.route('/login').get(login);
_.route('/logout').get(logout);



export default _;
