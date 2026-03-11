const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { isLoggedIn } = require('../middleware/auth');

// GET /dashboard
router.get('/', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const orders = await Order.find({ user: req.session.userId }).sort({ createdAt: -1 });
    res.render('dashboard', {
      title: 'My Dashboard - SABJIWALA',
      user,
      orders
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not load dashboard.');
    res.redirect('/');
  }
});

// POST /dashboard/update-profile
router.post('/update-profile', isLoggedIn, async (req, res) => {
  try {
    const { name, phone, street, city, state, pincode } = req.body;
    await User.findByIdAndUpdate(req.session.userId, {
      name,
      phone,
      address: { street, city, state, pincode }
    });
    req.session.userName = name;
    req.flash('success', 'Profile updated successfully!');
    res.redirect('/dashboard');
  } catch (err) {
    req.flash('error', 'Failed to update profile.');
    res.redirect('/dashboard');
  }
});

module.exports = router;
