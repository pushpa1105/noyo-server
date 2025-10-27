const Order = require('../models/orderModel');
const User = require('../models/userModel');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paymentInfo,
    } = req.body;

    const order = await Order.create({
      orderItems,
      shippingInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paymentInfo,
      paidAt: Date.now(),
      user: req.user._id,
    });

    // After creating order, clear the user's cart
    await User.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// --- ADMIN ROUTES ---

// @desc    Get all orders
// @route   GET /api/orders/all
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const queryObj = { ...req.query };
    const excludedFields = ['keyword', 'page', 'limit'];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    let query = Order.find(JSON.parse(queryStr));

    // --- Pagination Logic ---
    // Default to page 1 if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Add pagination to the query
    query = query.skip(skip).limit(limit);

    // Get total count of orders for pagination info
    const totalOrders = await Order.countDocuments(JSON.parse(queryStr));

    // --- Execute the query ---
    const orders = await query.populate({
      path: 'user',
      select: 'name email'
    });

    res.status(200).json({
      success: true,
      data: orders,
      meta: {
        count: orders.length,
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        currentPage: page,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update order status (e.g., to Shipped or Delivered)
// @route   PUT /api/orders/:id
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.orderStatus = req.body.status;

    // If the status is 'Delivered', update the payment info for COD
    if (req.body.status === 'Delivered') {
      order.deliveredAt = Date.now();
      order.paidAt = Date.now(); // Mark as paid upon delivery
      order.paymentInfo = {
        id: 'COD',
        status: 'succeeded',
      };
    }

    await order.save();
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};