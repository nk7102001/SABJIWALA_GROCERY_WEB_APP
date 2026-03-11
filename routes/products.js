const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /products - Product listing with search and filter
router.get('/', async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category && category !== 'All') {
      query.category = category;
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'name') sortOption = { name: 1 };

    const products = await Product.find(query).sort(sortOption);
    const categories = ['All', 'Vegetables', 'Fruits', 'Dairy', 'Grains', 'Snacks', 'Beverages'];

    res.render('products', {
      title: 'Products - SABJIWALA',
      products,
      categories,
      selectedCategory: category || 'All',
      search: search || '',
      sort: sort || ''
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not load products.');
    res.redirect('/');
  }
});

// GET /products/:id - Single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect('/products');
    }
    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    }).limit(4);
    res.render('product-detail', { title: product.name + ' - SABJIWALA', product, related });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Product not found.');
    res.redirect('/products');
  }
});

module.exports = router;
