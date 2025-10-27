const express = require('express');
const router = express.Router();

const {
  // User functions
  registerUser,
  loginUser,
  logoutUser,
  getCart,
  addToCart,
  removeFromCart,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  // Admin functions
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getCurrentUser,
  decreaseItemFromCart,
} = require('../controllers/userController');

// Import our auth middleware
const { protect, authorize } = require('../middleware/authMiddleware');

// --- Public Auth Routes ---
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser); // Should be protected, but accessible to any logged in user

// --- Protected User Routes (Cart & Wishlist) ---
router.route('/me').get(protect, getCurrentUser)
router.route('/cart')
  .get(protect, getCart)
  .post(protect, addToCart);
router.route('/cart/:productId').delete(protect, removeFromCart);
router.route('/cart/:productId/decrease').put(protect, decreaseItemFromCart);

router.route('/wishlist')
  .get(protect, getWishlist)
  .post(protect, addToWishlist);
router.route('/wishlist/:productId').delete(protect, removeFromWishlist);


// --- ADMIN ONLY Routes ---
router.route('/')
    .get(protect, authorize('admin'), getAllUsers);

router.route('/:id')
    .get(protect, authorize('admin'), getUserById)
    .put(protect, authorize('admin'), updateUser)
    .delete(protect, authorize('admin'), deleteUser);


module.exports = router;