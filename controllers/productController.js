const Product = require('../models/productModel');
const cloudinary = require('../config/cloudinary'); // Import Cloudinary config for deleting images

// @desc    Fetch all products with search and filtering
// @route   GET /api/products/active
// @access  Public
const getAllActiveProducts = async (req, res) => {
  try {
    // --- Filtering Logic ---
    const queryObj = { ...req.query };
    const excludedFields = ['keyword', 'page', 'limit'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Price filtering ($gte, $lte)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = Product.find(JSON.parse(queryStr));

    // --- Searching Logic ---
    if (req.query.keyword) {
      const keyword = {
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          { brand: { $regex: req.query.keyword, $options: 'i' } },
          { category: { $regex: req.query.keyword, $options: 'i' } },
        ],
      };
      query = query.where(keyword);
    }

    const products = await query;

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Fetch a single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a product with image uploads
// @route   POST /api/products/create
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    if (req.files) {
      const images = req.files.map(file => ({
        public_id: file.filename,
        url: file.path,
      }));
      productData.images = images;
    }

    // Associate the product with the user who created it
    productData.user = req.user.id;

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      product,
      message: 'Product created successfully.'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Fetch all products with search and filtering
// @route   GET /api/products/all
// @access  Private/Admin
const getAllProducts = async (req, res) => {
  try {
    // --- Filtering Logic ---
    const queryObj = { ...req.query };
    const excludedFields = ['keyword', 'page', 'limit'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Price filtering ($gte, $lte)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = Product.find(JSON.parse(queryStr));

    // --- Searching Logic ---
    if (req.query.keyword) {
      const keyword = {
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          { brand: { $regex: req.query.keyword, $options: 'i' } },
          { category: { $regex: req.query.keyword, $options: 'i' } },
        ],
      };
      query = query.where(keyword);
    }

    // --- Pagination Logic ---
    // Default to page 1 if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Add pagination to the query
    query = query.skip(skip).limit(limit);

    // Get total count of products for pagination info
    const totalProducts = await Product.countDocuments(JSON.parse(queryStr));

    // --- Execute the query ---
    const products = await query;

    res.status(200).json({
      meta: {
        count: products.length,
        total: totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        itemsPerPage: limit
      },
      data: products,
      success: true,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', data: error });
  }
};


// @desc    Update a product with optional new images
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updateData = { ...req.body };

    const uploadedImages = updateData?.files?.map(i => ({
      public_id: i?.public_id,
      url: i?.preview,
    }))

    // Check if new images are being uploaded
    if (req.files && req.files.length > 0) {
      // Step 1: Delete the old images from Cloudinary
      for (const image of product.images) {
        if (uploadedImages?.map(i => i?.public_id).includes(image?.public_id)) break;
        await cloudinary.uploader.destroy(image.public_id);
      }

      // Step 2: Map the new file data
      const newImages = req.files.map(file => ({
        public_id: file.filename,
        url: file.path,
      }));

      updateData.images = [...uploadedImages, ...newImages];
    }

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.log(error)
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product and its images from Cloudinary
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Step 1: Delete images from Cloudinary
    for (const image of product.images) {
      await cloudinary.uploader.destroy(image.public_id);
    }

    // Step 2: Delete the product from the database
    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product and associated images deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Fetch product detail
// @route   GET /api/products/:id
// @access  Private/Admin
const getProductDetail = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      data: product,
      message: 'Product detail fetched successfully.'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}


module.exports = {
  getAllActiveProducts,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductDetail
};