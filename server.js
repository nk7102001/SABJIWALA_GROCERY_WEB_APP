require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sabjiwala')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    seedDatabase();
    ensureAdmin();
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'sabjiwala_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

// Flash messages
app.use(flash());

// Global middleware - set user locals
const { setUserLocals } = require('./middleware/auth');
app.use(setUserLocals);

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/admin', adminRoutes);

// Home route
app.get('/', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const featuredProducts = await Product.find({ isFeatured: true }).limit(8);
    const allProducts = featuredProducts.length < 8
      ? await Product.find().limit(8)
      : featuredProducts;
    const categories = [
      { name: 'Vegetables', icon: '🥦', color: '#2ecc71' },
      { name: 'Fruits', icon: '🍎', color: '#e74c3c' },
      { name: 'Dairy', icon: '🥛', color: '#3498db' },
      { name: 'Grains', icon: '🌾', color: '#f39c12' },
      { name: 'Snacks', icon: '🍿', color: '#9b59b6' },
      { name: 'Beverages', icon: '🧃', color: '#1abc9c' }
    ];
    res.render('home', { title: 'SABJIWALA - Fresh Groceries Delivered', products: allProducts, categories });
  } catch (err) {
    console.error(err);
    res.render('home', { title: 'SABJIWALA', products: [], categories: [] });
  }
});

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('404', { title: 'Error - SABJIWALA' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SABJIWALA running at http://localhost:${PORT}`);
  console.log(`👤 Admin: http://localhost:${PORT}/admin`);
});

// Ensure admin always exists
async function ensureAdmin() {
  const User = require('./models/User');
  try {
    const adminExists = await User.findOne({ email: 'admin@sabjiwala.com' });
    if (!adminExists) {
      const admin = new User({
        name: 'Admin',
        email: 'admin@sabjiwala.com',
        password: 'admin123',
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin created: admin@sabjiwala.com / admin123');
    } else {
      // Force update role to admin
      await User.findOneAndUpdate(
        { email: 'admin@sabjiwala.com' },
        { role: 'admin' },
        { new: true }
      );
      console.log('✅ Admin role updated!');
    }
  } catch (err) {
    console.error('❌ Admin creation error:', err);
  }
}

// Seed database with sample products
async function seedDatabase() {
  const Product = require('./models/Product');
  const count = await Product.countDocuments();
  if (count > 0) return;

  console.log('🌱 Seeding database with sample products...');

  const products = [
    { name: 'Fresh Tomatoes', description: 'Farm fresh, juicy red tomatoes. Rich in vitamins and antioxidants.', price: 40, originalPrice: 55, image: 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=400&q=80', category: 'Vegetables', unit: 'kg', stock: 150, isFeatured: true, discount: 27 },
    { name: 'Potatoes', description: 'Premium quality potatoes, perfect for all your cooking needs.', price: 25, originalPrice: 30, image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80', category: 'Vegetables', unit: 'kg', stock: 200, isFeatured: true, discount: 17 },
    { name: 'Onions', description: 'Fresh, aromatic onions that enhance every dish.', price: 30, originalPrice: 40, image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400&q=80', category: 'Vegetables', unit: 'kg', stock: 180, isFeatured: false, discount: 25 },
    { name: 'Carrots', description: 'Crunchy, sweet orange carrots. High in beta-carotene.', price: 45, originalPrice: 55, image: 'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=400&q=80', category: 'Vegetables', unit: 'kg', stock: 120, isFeatured: true, discount: 18 },
    { name: 'Cabbage', description: 'Crispy green cabbage, fresh from the farm.', price: 35, originalPrice: 45, image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&q=80', category: 'Vegetables', unit: 'piece', stock: 80, isFeatured: false, discount: 22 },
    { name: 'Spinach', description: 'Fresh green spinach, packed with iron and vitamins.', price: 20, originalPrice: 28, image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80', category: 'Vegetables', unit: 'bunch', stock: 100, isFeatured: true, discount: 29 },
    { name: 'Green Peas', description: 'Sweet and tender green peas, freshly harvested.', price: 60, originalPrice: 75, image: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400&q=80', category: 'Vegetables', unit: 'kg', stock: 90, isFeatured: false, discount: 20 },
    { name: 'Bananas', description: 'Ripe, sweet yellow bananas. A powerhouse of energy.', price: 50, originalPrice: 60, image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80', category: 'Fruits', unit: 'dozen', stock: 150, isFeatured: true, discount: 17 },
    { name: 'Apples (Red)', description: 'Crispy Shimla apples, sweet and refreshing.', price: 180, originalPrice: 220, image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80', category: 'Fruits', unit: 'kg', stock: 100, isFeatured: true, discount: 18 },
    { name: 'Oranges', description: 'Juicy, vitamin C-rich oranges. Perfect for fresh juice.', price: 80, originalPrice: 100, image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80', category: 'Fruits', unit: 'kg', stock: 120, isFeatured: false, discount: 20 },
    { name: 'Mangoes', description: 'Sweet Alphonso mangoes - the king of fruits!', price: 250, originalPrice: 300, image: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400&q=80', category: 'Fruits', unit: 'kg', stock: 70, isFeatured: true, discount: 17 },
    { name: 'Full Cream Milk', description: 'Fresh, pasteurized full cream milk. Rich in calcium.', price: 60, originalPrice: 65, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80', category: 'Dairy', unit: 'litre', stock: 200, isFeatured: true, discount: 8 },
    { name: 'Paneer', description: 'Fresh homemade-style paneer. Soft and creamy.', price: 120, originalPrice: 140, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80', category: 'Dairy', unit: '200g', stock: 80, isFeatured: false, discount: 14 },
    { name: 'Curd (Dahi)', description: 'Thick and creamy dahi, made from fresh milk.', price: 45, originalPrice: 50, image: 'https://images.unsplash.com/photo-1488477181228-c84cae1b2d1f?w=400&q=80', category: 'Dairy', unit: '500g', stock: 150, isFeatured: false, discount: 10 },
    { name: 'Whole Wheat Bread', description: 'Fresh baked whole wheat bread, soft and nutritious.', price: 45, originalPrice: 52, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80', category: 'Grains', unit: 'loaf', stock: 60, isFeatured: true, discount: 13 },
    { name: 'Basmati Rice', description: 'Premium long-grain basmati rice with beautiful aroma.', price: 120, originalPrice: 145, image: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9ef1b?w=400&q=80', category: 'Grains', unit: 'kg', stock: 200, isFeatured: false, discount: 17 },
    { name: 'Moong Dal', description: 'High-protein yellow moong dal, easy to cook.', price: 95, originalPrice: 115, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80', category: 'Grains', unit: 'kg', stock: 150, isFeatured: false, discount: 17 },
    { name: 'Potato Chips', description: 'Crispy salted potato chips, perfect snack.', price: 30, originalPrice: 35, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80', category: 'Snacks', unit: 'pack', stock: 200, isFeatured: false, discount: 14 },
    { name: 'Mixed Nuts', description: 'Premium mix of almonds, cashews, and walnuts.', price: 450, originalPrice: 520, image: 'https://images.unsplash.com/photo-1545540921-81c6e6eac31d?w=400&q=80', category: 'Snacks', unit: '250g', stock: 80, isFeatured: true, discount: 13 },
    { name: 'Orange Juice', description: 'Fresh pressed 100% natural orange juice. No added sugar.', price: 85, originalPrice: 100, image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80', category: 'Beverages', unit: 'litre', stock: 100, isFeatured: false, discount: 15 }
  ];

  await Product.insertMany(products);
  console.log(`✅ ${products.length} products seeded!`);
}