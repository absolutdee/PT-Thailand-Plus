// routes/analytics.routes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public analytics
router.get('/public/stats', analyticsController.getPublicStats);

// Trainer analytics
router.get('/trainer/overview', auth, analyticsController.getTrainerOverview);
router.get('/trainer/clients', auth, analyticsController.getTrainerClientStats);
router.get('/trainer/revenue', auth, analyticsController.getTrainerRevenue);
router.get('/trainer/sessions', auth, analyticsController.getTrainerSessions);
router.get('/trainer/packages', auth, analyticsController.getTrainerPackageStats);
router.get('/trainer/reviews', auth, analyticsController.getTrainerReviewStats);
router.get('/trainer/monthly', auth, analyticsController.getTrainerMonthlyStats);

// Client analytics
router.get('/client/overview', auth, analyticsController.getClientOverview);
router.get('/client/progress', auth, analyticsController.getClientProgress);
router.get('/client/workouts', auth, analyticsController.getClientWorkoutStats);
router.get('/client/sessions', auth, analyticsController.getClientSessionStats);

// Admin analytics
router.get('/admin/overview', [auth, adminAuth], analyticsController.getAdminOverview);
router.get('/admin/users', [auth, adminAuth], analyticsController.getUserStats);
router.get('/admin/revenue', [auth, adminAuth], analyticsController.getPlatformRevenue);
router.get('/admin/sessions', [auth, adminAuth], analyticsController.getPlatformSessions);
router.get('/admin/geography', [auth, adminAuth], analyticsController.getGeographyStats);
router.get('/admin/trending', [auth, adminAuth], analyticsController.getTrendingStats);

// Custom reports
router.post('/admin/custom-report', [auth, adminAuth], analyticsController.generateCustomReport);
router.get('/admin/export/:type', [auth, adminAuth], analyticsController.exportData);

module.exports = router;
