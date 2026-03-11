// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  req.flash('error', 'Please login to continue.');
  res.redirect('/auth/login');
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session && req.session.userId && req.session.userRole === 'admin') {
    return next();
  }
  req.flash('error', 'Access denied. Admin only.');
  res.redirect('/');
};

// Middleware to check if already logged in (redirect away from login/signup)
const isNotLoggedIn = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  next();
};

// Make user available in all views
const setUserLocals = async (req, res, next) => {
  const User = require('../models/User');
  res.locals.currentUser = null;
  res.locals.isAdmin = false;
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      res.locals.currentUser = user;
      res.locals.isAdmin = user && user.role === 'admin';
    } catch (err) {
      // ignore
    }
  }
  // Cart count
  const cart = req.session.cart || [];
  res.locals.cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  res.locals.flashMessages = {
    success: req.flash('success'),
    error: req.flash('error'),
    info: req.flash('info')
  };
  next();
};

module.exports = { isLoggedIn, isAdmin, isNotLoggedIn, setUserLocals };
