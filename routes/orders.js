const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const { isLoggedIn } = require('../middleware/auth');

// GET /orders/checkout - Show checkout page
router.get('/checkout', isLoggedIn, async (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) {
    req.flash('error', 'Your cart is empty!');
    return res.redirect('/cart');
  }
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryCharge = subtotal > 500 ? 0 : 40;
  const user = await User.findById(req.session.userId);
  res.render('checkout', {
    title: 'Checkout - SABJIWALA',
    cart,
    subtotal,
    deliveryCharge,
    total: subtotal + deliveryCharge,
    user
  });
});

// POST /orders/place - Place order
router.post('/place', isLoggedIn, async (req, res) => {
  try {
    const cart = req.session.cart || [];
    if (cart.length === 0) {
      req.flash('error', 'Your cart is empty!');
      return res.redirect('/cart');
    }
    const { street, city, state, pincode, paymentMethod } = req.body;
    if (!street || !city || !state || !pincode) {
      req.flash('error', 'Please fill in all address fields.');
      return res.redirect('/orders/checkout');
    }
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryCharge = subtotal > 500 ? 0 : 40;
    const items = cart.map(item => ({
      product: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity
    }));
    const order = new Order({
      user: req.session.userId,
      items,
      totalPrice: subtotal + deliveryCharge,
      deliveryCharge,
      address: { street, city, state, pincode },
      paymentMethod: paymentMethod || 'COD',
      status: 'Confirmed'
    });
    await order.save();
    req.session.cart = [];
    req.flash('success', 'Order placed successfully! 🎉');
    res.redirect(`/orders/${order._id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to place order. Please try again.');
    res.redirect('/orders/checkout');
  }
});

// GET /orders/:id - Order confirmation
router.get('/:id', isLoggedIn, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user');
    if (!order || !order.user || order.user._id.toString() !== req.session.userId.toString()) {
      req.flash('error', 'Order not found.');
      return res.redirect('/dashboard');
    }
    res.render('order-confirmation', { title: 'Order Confirmed - SABJIWALA', order });
  } catch (err) {
    req.flash('error', 'Order not found.');
    res.redirect('/dashboard');
  }
});

module.exports = router;
