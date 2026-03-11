const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isNotLoggedIn, isLoggedIn } = require('../middleware/auth');

// GET /auth/login
router.get('/login', isNotLoggedIn, (req, res) => {
  res.render('login', { title: 'Login - SABJIWALA' });
});

// POST /auth/login
router.post('/login', isNotLoggedIn, async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      req.flash('error', 'Please fill in all fields.');
      return res.redirect('/auth/login');
    }
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/auth/login');
    }
    req.session.userId = user._id;
    req.session.userName = user.name;
    req.session.userRole = user.role;
    req.flash('success', `Welcome back, ${user.name}! 🌿`);
    const returnTo = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    res.redirect(returnTo);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/auth/login');
  }
});

// GET /auth/signup
router.get('/signup', isNotLoggedIn, (req, res) => {
  res.render('signup', { title: 'Sign Up - SABJIWALA' });
});

// POST /auth/signup
router.post('/signup', isNotLoggedIn, async (req, res) => {
  const { name, email, password, confirmPassword, phone } = req.body;
  try {
    if (!name || !email || !password) {
      req.flash('error', 'Please fill in all required fields.');
      return res.redirect('/auth/signup');
    }
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/auth/signup');
    }
    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters.');
      return res.redirect('/auth/signup');
    }
    const existing = await User.findOne({ email });
    if (existing) {
      req.flash('error', 'Email already registered. Please login.');
      return res.redirect('/auth/login');
    }
    const user = new User({ name, email, password, phone });
    await user.save();
    req.session.userId = user._id;
    req.session.userName = user.name;
    req.session.userRole = user.role;
    req.flash('success', `Welcome to SABJIWALA, ${user.name}! 🌿`);
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      req.flash('error', 'Email already exists.');
    } else {
      req.flash('error', err.message || 'Registration failed.');
    }
    res.redirect('/auth/signup');
  }
});

// GET /auth/logout
router.get('/logout', isLoggedIn, (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
