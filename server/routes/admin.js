const router = require('express').Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const adminLayout = '../views/layouts/admin';
const jwtSecret = process.env.JWT_SECRET || 'supersecret';

// ==========================
// MIDDLEWARES
// ==========================

// Auth middleware to protect routes
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/admin'); // Not logged in

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    // Invalid or expired token
    return res.redirect('/admin');
  }
};

// ==========================
// ROUTES
// ==========================

// GET: Admin login page
router.get('/admin', (req, res) => {
  res.render('admin/index', {
    locals: { title: 'Admin', description: 'Simple Blog Admin Login' },
    layout: adminLayout
  });
});

// POST: Admin login
router.post('/admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });

    // Create JWT with 7 days expiry
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '7d' });

    // Set persistent cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Admin registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ username, email, password: hashedPassword });
    res.status(201).json({ message: 'User created', user });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'User already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Admin logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/admin');
});

// GET: Admin dashboard
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const locals = { title: 'Dashboard', description: 'Blog Admin Dashboard' };
    const perPage = 4;
    const page = parseInt(req.query.page) || 1;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage);

    const total = await Post.countDocuments();
    const nextPage = page + 1;
    const hasNextPage = nextPage <= Math.ceil(total / perPage);

    res.render('admin/dashboard', {
      locals,
      data:posts,
      current: page,
      nextPage: hasNextPage ? nextPage : null,
      layout: adminLayout
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET: Add post page
router.get('/add-post', authMiddleware, (req, res) => {
  res.render('admin/add-post', {
    locals: { title: 'Add Post', description: 'Add new blog post' },
    layout: adminLayout
  });
});

// POST: Add new post
router.post('/add-post', authMiddleware, async (req, res) => {
  try {
    const newPost = new Post({ title: req.body.title, body: req.body.body });
    await newPost.save();
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET: Edit post page
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.redirect('/dashboard');

    res.render('admin/edit-post', { post, layout: adminLayout });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// PUT: Edit post
router.put('/edit-post/:id', authMiddleware, async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      body: req.body.body,
      updatedAt: Date.now()
    });
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// DELETE: Delete post
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;