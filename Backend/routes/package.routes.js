// routes/package.routes.js
const express = require('express');
const router = express.Router();
const packageController = require('../controllers/package.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public package routes
router.get('/public', packageController.getPublicPackages);
router.get('/public/:id', packageController.getPublicPackageById);
router.get('/trainer/:trainerId/packages', packageController.getTrainerPackages);
router.get('/featured', packageController.getFeaturedPackages);
router.get('/popular', packageController.getPopularPackages);

// Package categories
router.get('/categories', packageController.getPackageCategories);
router.get('/categories/:category', packageController.getPackagesByCategory);

// Package search and filter
router.get('/search', packageController.searchPackages);
router.get('/filter', packageController.filterPackages);

// Client package routes
router.get('/my-packages', auth, packageController.getMyPackages);
router.post('/:id/purchase', auth, packageController.purchasePackage);
router.get('/purchased/:id', auth, packageController.getPurchasedPackage);
router.post('/:id/cancel', auth, packageController.cancelPackage);

// Trainer package management
router.get('/trainer/my-packages', auth, packageController.getTrainerOwnPackages);
router.post('/trainer/create', auth, packageController.createPackage);
router.put('/trainer/:id', auth, packageController.updatePackage);
router.delete('/trainer/:id', auth, packageController.deletePackage);
router.get('/trainer/:id', auth, packageController.getTrainerPackageById);

// Package status management
router.put('/trainer/:id/activate', auth, packageController.activatePackage);
router.put('/trainer/:id/deactivate', auth, packageController.deactivatePackage);
router.put('/trainer/:id/feature', auth, packageController.setFeaturedPackage);
router.put('/trainer/:id/unfeature', auth, packageController.removeFeaturedPackage);

// Package pricing
router.get('/:id/pricing', packageController.getPackagePricing);
router.post('/trainer/:id/pricing', auth, packageController.updatePackagePricing);

// Package sessions
router.get('/:id/sessions', auth, packageController.getPackageSessions);
router.post('/:id/sessions', auth, packageController.addPackageSession);
router.put('/sessions/:sessionId', auth, packageController.updatePackageSession);
router.delete('/sessions/:sessionId', auth, packageController.deletePackageSession);

// Package subscriptions
router.get('/subscriptions', auth, packageController.getPackageSubscriptions);
router.post('/:id/subscribe', auth, packageController.subscribeToPackage);
router.put('/subscription/:subscriptionId/pause', auth, packageController.pauseSubscription);
router.put('/subscription/:subscriptionId/resume', auth, packageController.resumeSubscription);
router.delete('/subscription/:subscriptionId', auth, packageController.cancelSubscription);

// Package reviews
router.get('/:id/reviews', packageController.getPackageReviews);
router.post('/:id/review', auth, packageController.createPackageReview);
router.put('/review/:reviewId', auth, packageController.updatePackageReview);
router.delete('/review/:reviewId', auth, packageController.deletePackageReview);

// Package analytics
router.get('/trainer/:id/analytics', auth, packageController.getPackageAnalytics);
router.get('/trainer/analytics/overview', auth, packageController.getTrainerPackageAnalytics);

// Admin package management
router.get('/admin/all', [auth, adminAuth], packageController.getAllPackages);
router.get('/admin/pending', [auth, adminAuth], packageController.getPendingPackages);
router.put('/admin/:id/approve', [auth, adminAuth], packageController.approvePackage);
router.put('/admin/:id/reject', [auth, adminAuth], packageController.rejectPackage);
router.delete('/admin/:id', [auth, adminAuth], packageController.deletePackageAdmin);

// Package categories management
router.post('/admin/categories', [auth, adminAuth], packageController.createPackageCategory);
router.put('/admin/categories/:id', [auth, adminAuth], packageController.updatePackageCategory);
router.delete('/admin/categories/:id', [auth, adminAuth], packageController.deletePackageCategory);

// Package templates
router.get('/templates', packageController.getPackageTemplates);
router.post('/admin/templates', [auth, adminAuth], packageController.createPackageTemplate);

// Package statistics
router.get('/admin/statistics', [auth, adminAuth], packageController.getPackageStatistics);
router.get('/admin/revenue-report', [auth, adminAuth], packageController.getPackageRevenueReport);

// Package recommendations
router.get('/recommendations', auth, packageController.getPackageRecommendations);

module.exports = router;
