import mongoose, { Schema, Types } from "mongoose";
const { ObjectId } = Types;

const wishlistSchema = new Schema({
  user: {
    type: ObjectId,
    ref: "User",
    required: [true, "User is required"],
    unique: [true, "Double user wishlist detected"],
  },
  products: [
    {
      product: {
        type: ObjectId,
        ref: "Product",
        required: true,
        unique: true,
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
}, { timestamps: true, versionKey: false });

// Middleware to automatically delete wishlist if products array becomes empty
wishlistSchema.post('save', async function(doc) {
  if (doc && doc.products.length === 0) {
    await doc.deleteOne();
  }
});

wishlistSchema.post(['findOneAndUpdate', 'updateOne'], async function() {
  // Always fetch the current document after update to check its state
  const wishlist = await this.model.findOne(this.getQuery());
  
  // If document exists and has empty products array, delete it
  if (wishlist && wishlist.products.length === 0) {
    await this.model.findByIdAndDelete(wishlist._id);
  }
});

export default mongoose.models.Wishlist || mongoose.model("Wishlist", wishlistSchema);