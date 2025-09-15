import "dotenv/config";
import jwt from "jsonwebtoken";
import { fullName } from "../helpers/beautify.js";
import sendEmail from "../helpers/email.send.js";
import userModel from "../models/user.model.js";
import regVerTem from "../templates/registration.verify.js";
import resPassVerTem from "../templates/resPassword.verify.js";
// import verifiedSuccessTem from "../templates/verifiedSuccessTem.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import CustomError from "../utils/customError.js";
import validateUser, {
  validatePassword
} from "../validations/user.validation.js";

export const registration = asyncHandler(async (req, res) => {
  const userData = await validateUser(req);
  // Save user to database
  const user = new userModel(userData);
  const otp = await user.generateOtp();
  const verificationLink = await user.generateVerificationLink();
  // Send welcome email
  await sendEmail(
    user.email,
    `${process.env.BRAND_NAME} Verification`,
    regVerTem(
      process.env.BRAND_NAME,
      fullName(user.firstName, user.lastName),
      otp,
      verificationLink
    )
  );

  await user.save();
  console.log("User registered successfully!");
  apiResponse.sendSuccess(
    res,
    201,
    "User registered successfully! Please check your email to verify your account.",
    user
  );
});

export const resendVerification = asyncHandler(registration);
export const resendOtpVerification = asyncHandler(registration);
export const otpVerification = asyncHandler(async (req, res) => {
  const { otp, email } = req.body;
  if (!otp || !email) {
    throw new CustomError(
      400,
      "Invalid request. Missing OTP or email."
    );
  }

  const user = await userModel.findOne({ email });
  if (!user) {
    throw new CustomError(400, "Invalid OTP or email.");
  }
  if (user.verificationOtpExpires < Date.now()) {
    throw new CustomError(
      400,
      "OTP has expired. Please registration again."
    );
  }
  if (user.verificationOtp !== otp) {
    throw new CustomError(400, "Invalid OTP. Please try again.");
  }

  user.isActive = true;
  user.createdAt = Date.now();
  user.updatedAt = Date.now();
  user.lastLogin = Date.now();
  user.isEmailVerified = true;
  user.verificationOtp = null;
  user.verificationOtpExpires = null;
  await user.save();

  console.log("Email verified successfully via OTP!");
  apiResponse.sendSuccess(
    res,
    200,
    "Email verified successfully via OTP!",
    user
  );
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new CustomError(400, "Email is required");
  }
  const user = await userModel.findOne({ email });
  if (!user) {
    throw new CustomError(404, "User not found with this email");
  }

  const resetToken = await user.generateResetPasswordLink();
  await sendEmail(
    user.email,
    `${process.env.BRAND_NAME} Password Reset`,
    resPassVerTem(
      process.env.BRAND_NAME,
      fullName(user.firstName, user.lastName),
      resetToken
    )
  );

  user.save();
  console.log("Password reset link has been sent to your email.");
  apiResponse.sendSuccess(
    res,
    200,
    "Password reset link has been sent to your email.",
    null
  );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, email } = req.query;
  const { newPassword, confirmPassword } = req.body;
  validatePassword(newPassword);
  if (!token || !email) {
    throw new CustomError(
      400,
      "Invalid request. Missing token or email."
    );
  }
  if (newPassword !== confirmPassword) {
    throw new CustomError(
      400,
      "New password and confirm password do not match."
    );
  }

  const user = await userModel.findOne({ email, resetPasswordToken: token });
  if (!user) {
    throw new CustomError(400, "Invalid token or email.");
  }
  if (user.resetPasswordExpires < Date.now()) {
    throw new CustomError(
      400,
      "Reset password token has expired. Please try again."
    );
  }
  user.password = newPassword;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  console.log("Password reset successfully!");
  apiResponse.sendSuccess(res, 200, "Password reset successfully!", null);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token, email } = req.query;

  if (!token || !email) {
    throw new CustomError(
      400,
      "Invalid request. Validation token error"
    );
  }

  const user = await userModel.findOne({ email, verificationToken: token });

  if (!user) {
    throw new CustomError(400, "Invalid token or email.");
  }

  if (user.isVerified) {
    throw new CustomError(400, "Email is already verified.");
  }

  if (user.verificationTokenExpires > Date.now()) {
    throw new CustomError(
      400,
      "Verification token has expired. Please registration again."
    );
  }
  user.isActive = true;
  user.createdAt = Date.now();
  user.updatedAt = Date.now();
  user.lastLogin = Date.now();
  user.isEmailVerified = true;
  user.verificationToken = null;
  user.verificationTokenExpires = null;
  await user.save();

  console.log("Email verified successfully!");
  // return res.redirect(`/${process.env.BASE_URL}/auth/verified-success`);
  apiResponse.sendSuccess(res, 200, 'Email verified successfully!', user);
});

// export const verifiedSuccess = asyncHandler(verifiedSuccessTem);



export const login = asyncHandler(async (req, res) => {
  const { username, phone, email, password } = req.body;

  if ((!email && !username && !phone) || !password) {
    throw new CustomError(
      400,
      "Please provide email/username/phone and password"
    );
  }

  let query = {};
  if (email) query.email = email;
  else if (username) query.username = username;
  else if (phone) query.phone = phone;

  const user = await userModel.findOne(query);
  if (!user) {
    throw new CustomError(404, "User not found with this email");
  }
  if (!user.isEmailVerified) {
    throw new CustomError(
      401,
      "Email is not verified. Please verify your email to login."
    );
  }
  if (!user.isActive) {
    throw new CustomError(
      403,
      "Your account is inactive. Please contact support."
    );
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new CustomError(
      401,
      "Invalid password. Please try again."
    );
  }

  user.lastLogin = Date.now();

  user.accessToken = await user.generateAccessToken();
  user.refreshToken = await user.generateRefreshToken();
  res.setHeader("Authorization", `Bearer ${user.accessToken}`);
  res.cookie("refreshToken", user.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  await user.save();

  console.log("User logged in successfully!");
  apiResponse.sendSuccess(res, 200, "User logged in successfully!", { user });
});

export const logout = asyncHandler(async (req, res) => {
  let authHeader = req.headers.authorization.split(" ")[1];
  let refreshToken = req.cookies.refreshToken;
  // const token = req.headers.authorization.split(' ')[1] || req.cookies.refreshToken;

  if (!authHeader || !refreshToken) {
    throw new CustomError(401, "Unauthorized");
  }

  let authQuery, refreshQuery, iat, exp;
  if (authHeader) {
    try {
      ({ iat, exp, ...authQuery } = await jwt.verify(
        authHeader,
        process.env.JWT_ACCESS_SECRET
      ));
    } catch (error) {
      authQuery = {};
    }
  }

  if (refreshToken) {
    try {
      const decoded = await jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET
      );
      ({ iat, exp, ...refreshQuery } = decoded);
    } catch (error) {
      refreshQuery = {};
    }
  }

  if (!authQuery || !refreshQuery) {
    throw new CustomError(401, "Unauthorized");
  }

  const user = await userModel.findOne({ $or: [authQuery, refreshQuery] });
  if (!user) {
    throw new CustomError(401, "Unauthorized");
  }
  if (authHeader) res.setHeader("Authorization", null);
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  user.accessToken = null;
  user.refreshToken = null;

  await user.save();
  console.log("User logged out successfully!");
  apiResponse.sendSuccess(res, 200, "User logged out successfully!", null);
});
