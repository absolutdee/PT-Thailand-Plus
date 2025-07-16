// routes/index.js
const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth.routes');
const trainerRoutes = require('./trainer.routes');
const clientRoutes = require('./client.routes');
const adminRoutes = require('./admin.routes');
const publicRoutes = require('./public.routes');
const chatRoutes = require('./chat.routes');
const notificationRoutes = require('./notification.routes');
const paymentRoutes = require('./payment.routes');

// API versioning
const API_VERSION = '/api/v1';

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation route
router.get('/docs', (req, res) => {
  res.redirect('/api-docs');
});

// Mount routes with versioning
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/trainers`, trainerRoutes);
router.use(`${API_VERSION}/clients`, clientRoutes);
router.use(`${API_VERSION}/admin`, adminRoutes);
router.use(`${API_VERSION}/public`, publicRoutes);
router.use(`${API_VERSION}/chat`, chatRoutes);
router.use(`${API_VERSION}/notifications`, notificationRoutes);
router.use(`${API_VERSION}/payments`, paymentRoutes);

// Root API route
router.get(API_VERSION, (req, res) => {
  res.json({
    message: 'Welcome to Fitness Trainer API',
    version: '1.0.0',
    endpoints: {
      auth: `${API_VERSION}/auth`,
      trainers: `${API_VERSION}/trainers`,
      clients: `${API_VERSION}/clients`,
      admin: `${API_VERSION}/admin`,
      public: `${API_VERSION}/public`,
      chat: `${API_VERSION}/chat`,
      notifications: `${API_VERSION}/notifications`,
      payments: `${API_VERSION}/payments`
    },
    documentation: '/api-docs'
  });
});

// Catch all route for undefined endpoints
router.all('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;