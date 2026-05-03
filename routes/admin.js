const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { isAdmin } = require('../middleware/auth');

// GET /admin - Dashboard
router.get('/', isAdmin, async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const userCount = await User.countDocuments();
    const recentOrders = await Order.find().populate('user').sort({ createdAt: -1 }).limit(5);
    const revenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    res.render('admin/dashboard', {
      title: 'Admin Panel - SABJIWALA',
      productCount,
      orderCount,
      userCount,
      recentOrders,
      revenue: revenue[0] ? revenue[0].total : 0
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// GET /admin/products
router.get('/products', isAdmin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.render('admin/products', { title: 'Manage Products - SABJIWALA', products });
  } catch (err) {
    req.flash('error', 'Could not load products.');
    res.redirect('/admin');
  }
});

// GET /admin/products/add
router.get('/products/add', isAdmin, (req, res) => {
  res.render('admin/product-form', { title: 'Add Product - SABJIWALA', product: null });
});

// POST /admin/products/add
router.post('/products/add', isAdmin, async (req, res) => {
  try {
    const { name, description, price, originalPrice, category, unit, stock, image, isFeatured, discount } = req.body;
    const product = new Product({
      name, description, price, originalPrice, category,
      unit: unit || 'kg', stock, image, discount: discount || 0,
      isFeatured: isFeatured === 'on'
    });
    await product.save();
    req.flash('success', 'Product added successfully!');
    res.redirect('/admin/products');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/admin/products/add');
  }
});

// GET /admin/products/edit/:id
router.get('/products/edit/:id', isAdmin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { req.flash('error', 'Product not found.'); return res.redirect('/admin/products'); }
  res.render('admin/product-form', { title: 'Edit Product - SABJIWALA', product });
});

// POST /admin/products/edit/:id
router.post('/products/edit/:id', isAdmin, async (req, res) => {
  try {
    const { name, description, price, originalPrice, category, unit, stock, image, isFeatured, discount } = req.body;
    await Product.findByIdAndUpdate(req.params.id, {
      name, description, price, originalPrice, category,
      unit, stock, image, discount: discount || 0,
      isFeatured: isFeatured === 'on'
    });
    req.flash('success', 'Product updated successfully!');
    res.redirect('/admin/products');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/admin/products/edit/' + req.params.id);
  }
});

// POST /admin/products/delete/:id
router.post('/products/delete/:id', isAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  req.flash('success', 'Product deleted.');
  res.redirect('/admin/products');
});

// GET /admin/orders
router.get('/orders', isAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate('user').sort({ createdAt: -1 });
    res.render('admin/orders', { title: 'All Orders - SABJIWALA', orders });
  } catch (err) {
    req.flash('error', 'Could not load orders.');
    res.redirect('/admin');
  }
});

// POST /admin/orders/update-status/:id
router.post('/orders/update-status/:id', isAdmin, async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, { status: req.body.status });
    req.flash('success', 'Order status updated!');
  } catch (err) {
    req.flash('error', 'Could not update order status.');
  }
  res.redirect('/admin/orders');
});

module.exports = router;
