 import mongoose, { Schema, Types } from "mongoose";
 const { ObjectId } = Types;
 
const cartSchema = new Schema({
  user: {
    type: ObjectId,
    ref: "User",
    required: [true, "User is required"],
    unique: [true, "Double user cart detected"],
  },
  products: [
    {
     product: {
      type: ObjectId,
      ref: "Product",
      required: true,
      unique: true,
     },
     quantity: {
      type: Number,
      default: 1,
      min: 1,
      max: 100,
     },
     addedAt: {
      type: Date,
      default: Date.now,
     },
    },
  ],
  coupon: {
    type: ObjectId,
    ref: "Coupon",
    default: null,
  },
  discountAmount: {
    type: Number,
    min: 0,
    default: 0,
  },
  discountType: {
    type: String,
    enum: ["percentage", "fixed"],
    default: null,
  },
 }, { timestamps: true, versionKey: false });

// Middleware to automatically delete cart if products array becomes empty
cartSchema.post('save', async function(doc) {
  if (doc && doc.products.length === 0) {
    await doc.deleteOne();
  }
});

cartSchema.post(['findOneAndUpdate', 'updateOne'], async function() {
  // Always fetch the current document after update to check its state
  const cart = await this.model.findOne(this.getQuery());
  
  // If document exists and has empty products array, delete it
  if (cart && cart.products.length === 0) {
    await this.model.findByIdAndDelete(cart._id);
  }
});

 export default mongoose.models.Cart || mongoose.model("Cart", cartSchema);