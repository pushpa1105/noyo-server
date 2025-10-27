const express = require('express');
const router = express.Router();

const {
  getAllActiveProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductDetail,
} = require('../controllers/productController');

// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Public route for getting products
router.route('/active').get(getAllActiveProducts);
router.route('/:id').get(getProductById);

// Admin-only routes
router.route('/')
    .post(protect, authorize('admin'), upload.array('images', 5), createProduct);

router.route('/')
    .get(getAllProducts);

router.route('/create')
    .post(protect, authorize('admin'), upload.array('images', 5), createProduct);

router.route('/:id')
    .put(protect, authorize('admin'), upload.array('images', 5), updateProduct)
    .delete(protect, authorize('admin'), deleteProduct);

router.route('/:id/detail')
    .get(protect, authorize('admin'), getProductDetail)

module.exports = router;