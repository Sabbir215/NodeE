import bcrypt from "bcryptjs";
import crypto from "crypto";
import 'dotenv/config';
import jwt from "jsonwebtoken";
import mongoose, { Schema, Types } from "mongoose";
import validatorImport from "validator";
import customError from "../utils/customError.js";
const { isEmail, isMobilePhone, isStrongPassword, isPostalCode } = validatorImport;
const { ObjectId } = Types;




const userSchema = new Schema({
  // personal details
  firstName: {
    type: String,
    // required: [true, "First name is required"],
    trim: true,
    maxlength: 50,
    validate: {
      validator: function (v) {
        return /^[a-zA-Z]+$/.test(v);
      },
      message: (props) => `${props.value} is not a valid first name! Only alphabetic characters are allowed.`,
    },
  },
  lastName: {
    type: String,
    // required: [true, "Last name is required"],
    trim: true,
    maxlength: 50,
    validate: {
      validator: function (v) {
        return /^[a-zA-Z]+$/.test(v);
      },
      message: (props) => `${props.value} is not a valid last name! Only alphabetic characters are allowed.`,
    },
  },
  username: {
    type: String,
    // required: [true, "Username is required"],
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    // required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        return isEmail(v);
      },
      message: (props) => `${props.value} is not a valid email address!`,
    },
  },
  dateOfBirth: {
    type: Date,
    // required: [true, "Date of birth is required"],
    validate: {
      validator: function (v) {
        return v instanceof Date && !isNaN(v);
      },
      message: (props) => `${props.value} is not a valid date!`,
    },
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  bio: {
    type: String,
    maxlength: 500,
    trim: true,
  },
  socialLinks: {
    facebook: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9._-]+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid Facebook URL!`,
      },
    },
    x: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/)?(www\.)?x\.com\/[a-zA-Z0-9._-]+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid Twitter URL!`,
      },
    },
    instagram: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9._-]+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid Instagram URL!`,
      },
    },
  },
  phone: {
    type: String,
    // required: [true, "Phone number is required"],
    trim: true,
    validate: {
      validator: function (v) {
        return isMobilePhone(v, 'any', { strictMode: false });
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
  address: {
    type: String,
    // required: [true, "Address is required"],
    trim: true,
  },
  city: String,
  state: String,
  country: String,
  postalCode: {
    type: String,
    // required: [true, "Postal code is required"],
    validate: {
      validator: function (v) {
        return isPostalCode(v, 'any');
      },
      message: (props) => `${props.value} is not a valid postal code!`,
    },
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    // minlength: 8,
    // validate: {
    //   validator: function (v) {
    //     return isStrongPassword(v, {
    //       minLength: 8,
    //       minLowercase: 1,
    //       minNumbers: 1,
    //     });
    //   },
    //   message: (props) => `${props.value} is not a strong password!`,
    // },
  },
  // saltPassword: {
  //   type: String,
  //   default: null,
  // },
  passwordUpdatedLast: {
    type: Date,
    default: null,
  },
  image: {
    type: String,
    default: "https://example.com/default-avatar.png",
  },
  // is verified fields
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  isAddressVerified: {
    type: Boolean,
    default: false,
  },  
  // Cart, Wishlist, Orders
  cart: {
    type: [ObjectId],
    ref: "Product",
    default: [],
  },
  wishlist: {
    type: [ObjectId],
    ref: "Product",
    default: [],
  },
  orders: {
    type: [ObjectId],
    ref: "Order",
    default: [],
  },
  // Security and authentication
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  lastPasswordChange: {
    type: Date,
    default: Date.now,
  },
  verificationOtp: {
    type: String,
    default: null,
  },
  verificationOtpExpires: {
    type: Date,
    default: null,
  },
  verificationToken: {
    type: String,
    default: null,
  },
  verificationTokenExpires: {
    type: Date,
    default: null,
  },
  // Two-Factor Authentication (2FA)
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorToken: {
    type: String,
    default: null,
  },
  twoFactorExpires: {
    type: Date,
    default: null,
  },
  role: {
    type: ObjectId,
    ref: "Role",
    // required: true,
  },
  permissions: {
    type: [ObjectId],
    ref: "Permission",
    default: [],
  },
  // activity logs and status
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  accountLocked: {
    type: Boolean,
    default: false,
  },
  lockUntil: {
    type: Date,
    default: null,
  },
  newsletterSubscribed: {
    type: Boolean,
    default: false,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  // tokens and sessions
  accessToken: {
    type: String,
    default: null,
  },
  refreshToken: {
    type: String,
    default: null,
  },
  // JWT token expiration settings
  accessTokenExpires: {
    type: String,
    default: process.env.JWT_ACCESS_EXPIRATION, // 15 minutes
  },
  refreshTokenExpires: {
    type: String,
    default: process.env.JWT_REFRESH_EXPIRATION, // 7 days
  },
  // Oauth providers and third-party integrations
  oauthProviders: {
    google: {
      type: String,
      default: null,
    },
    facebook: {
      type: String,
      default: null,
    },
    x: {
      type: String,
      default: null,
    },
  },
  // referral and affiliate system
  referralCode: {
    type: String,
    // unique: true,
    trim: true,
    // validate: {
    //   validator: function (v) {
    //     return /^[A-Z0-9]{6}$/.test(v);
    //   },
    //   message: (props) => `${props.value} is not a valid referral code!`,
    // },
  },
  referredBy: {
    type: ObjectId,
    ref: "User",
    default: null,
  },
  // additional fields
  notes: {
    type: String,
    maxlength: 500,
    trim: true,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true, versionKey: false });



userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.saltPassword = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, this.saltPassword);
  }
  this.passwordUpdatedLast = Date.now();
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateOtp = async function () {
  this.verificationOtp = await crypto.randomInt(100000, 999999).toString();
  this.verificationOtpExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  return this.verificationOtp;
}

userSchema.methods.generateVerificationLink = async function () {
  this.verificationToken = await crypto.randomBytes(32).toString("hex");
  this.verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 1 day
  return `${process.env.FRONTEND_URL}/api/v1/auth/verify-email?token=${this.verificationToken}&email=${this.email}`;
}

userSchema.methods.generateResetPasswordLink = async function () {
  this.resetPasswordToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return `${process.env.FRONTEND_URL}/reset-password?token=${this.resetPasswordToken}&email=${this.email}`;
}

userSchema.methods.generateAccessToken = async function () {
  return jwt.sign({
    id: this._id,
    username: this.username,
    email: this.email,
    role: this.role,
    permissions: this.permissions
  }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRATION
  });
}

userSchema.methods.generateRefreshToken = async function () {
  return jwt.sign({
    id: this._id,
    username: this.username,
    email: this.email,
    role: this.role,
    permissions: this.permissions
  }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION
  });
}

userSchema.methods.verifyAccessToken = async function (token) {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    throw new customError(401, "Invalid access token");
  }
}

userSchema.methods.verifyRefreshToken = async function (token) {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new customError(401, "Invalid refresh token");
  }
}

export default mongoose.model("User", userSchema);
export { userSchema };

