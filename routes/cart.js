const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { isLoggedIn } = require('../middleware/auth');

// Helper to get cart from session
function getCart(req) {
  return req.session.cart || [];
}

// Helper to save cart to session
function saveCart(req, cart) {
  req.session.cart = cart;
}

// GET /cart - View cart
router.get('/', (req, res) => {
  const cart = getCart(req);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryCharge = subtotal > 500 ? 0 : 40;
  const total = subtotal + deliveryCharge;
  res.render('cart', {
    title: 'Cart - SABJIWALA',
    cart,
    subtotal,
    deliveryCharge,
    total
  });
});

// POST /cart/add - Add to cart
router.post('/add', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity) || 1;
    const product = await Product.findById(productId);
    if (!product) {
      return res.json({ success: false, message: 'Product not found' });
    }
    let cart = getCart(req);
    const existingIndex = cart.findIndex(item => item.productId === productId);
    if (existingIndex > -1) {
      cart[existingIndex].quantity += qty;
    } else {
      cart.push({
        productId,
        name: product.name,
        price: product.price,
        image: product.image,
        unit: product.unit,
        quantity: qty
      });
    }
    saveCart(req, cart);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    res.json({ success: true, message: `${product.name} added to cart!`, cartCount });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Failed to add to cart.' });
  }
});

// POST /cart/update - Update quantity
router.post('/update', (req, res) => {
  const { productId, quantity } = req.body;
  const qty = parseInt(quantity);
  let cart = getCart(req);
  if (qty <= 0) {
    cart = cart.filter(item => item.productId !== productId);
  } else {
    const index = cart.findIndex(item => item.productId === productId);
    if (index > -1) cart[index].quantity = qty;
  }
  saveCart(req, cart);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryCharge = subtotal > 500 ? 0 : 40;
  res.json({
    success: true,
    cart,
    subtotal,
    deliveryCharge,
    total: subtotal + deliveryCharge,
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0)
  });
});

// POST /cart/remove - Remove item
router.post('/remove', (req, res) => {
  const { productId } = req.body;
  let cart = getCart(req).filter(item => item.productId !== productId);
  saveCart(req, cart);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryCharge = subtotal > 500 ? 0 : 40;
  res.json({
    success: true,
    cart,
    subtotal,
    deliveryCharge,
    total: subtotal + deliveryCharge,
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0)
  });
});

// POST /cart/clear
router.post('/clear', (req, res) => {
  saveCart(req, []);
  res.json({ success: true });
});

module.exports = router;
