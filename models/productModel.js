const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter product name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please enter product description'],
    },
    price: {
      type: Number,
      required: [true, 'Please enter product price'],
    },
    // Adding ratings for future feature
    ratings: {
      type: Number,
      default: 0,
    },
    images: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    category: {
      type: String,
      required: [true, 'Please enter product category (e.g., Skincare, Makeup, Haircare)'],
    },
    // New field for Brand
    brand: {
      type: String,
      required: [true, 'Please enter product brand'],
    },
    // New field for Skin Type, specific to cosmetics
    skinType: {
      type: [String], // An array of strings to allow multiple skin types
      required: [true, 'Please specify suitable skin type(s)'],
      enum: {
        values: ['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive'],
        message: 'Please select a valid skin type',
      },
    },
    status: {
      type: [String], // An array of strings to allow multiple skin types
      default: 'Active'
    },
    stock: {
      type: Number,
      required: [true, 'Please enter product stock'],
      default: 1,
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
    // We will populate this user field later during authentication
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      // required: true, // We'll enable this after setting up auth
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);