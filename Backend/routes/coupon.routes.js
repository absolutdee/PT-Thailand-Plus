// routes/coupon.routes.js
const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public coupon routes
router.post('/validate', couponController.validateCoupon);
router.post('/apply', auth, couponController.applyCoupon);

// User coupon routes
router.get('/my-coupons', auth, couponController.getMyCoupons);
router.get('/available', auth, couponController.getAvailableCoupons);
router.post('/claim/:code', auth, couponController.claimCoupon);

// Trainer coupon routes
router.get('/trainer/my-coupons', auth, couponController.getTrainerCoupons);
router.post('/trainer/create', auth, couponController.createTrainerCoupon);
router.put('/trainer/:id', auth, couponController.updateTrainerCoupon);
router.delete('/trainer/:id', auth, couponController.deleteTrainerCoupon);
router.get('/trainer/:id/usage', auth, couponController.getCouponUsage);

// Admin coupon management
router.get('/admin/all', [auth, adminAuth], couponController.getAllCoupons);
router.post('/admin/create', [auth, adminAuth], couponController.createCoupon);
router.put('/admin/:id', [auth, adminAuth], couponController.updateCoupon);
router.delete('/admin/:id', [auth, adminAuth], couponController.deleteCoupon);
router.get('/admin/:id', [auth, adminAuth], couponController.getCouponById);

// Coupon types management
router.get('/admin/types', [auth, adminAuth], couponController.getCouponTypes);
router.post('/admin/types', [auth, adminAuth], couponController.createCouponType);

// Bulk operations
router.post('/admin/bulk-create', [auth, adminAuth], couponController.bulkCreateCoupons);
router.put('/admin/bulk-update', [auth, adminAuth], couponController.bulkUpdateCoupons);
router.delete('/admin/bulk-delete', [auth, adminAuth], couponController.bulkDeleteCoupons);

// Coupon campaigns
router.get('/admin/campaigns', [auth, adminAuth], couponController.getCampaigns);
router.post('/admin/campaigns', [auth, adminAuth], couponController.createCampaign);
router.put('/admin/campaigns/:id', [auth, adminAuth], couponController.updateCampaign);
router.delete('/admin/campaigns/:id', [auth, adminAuth], couponController.deleteCampaign);

// Usage tracking
router.get('/admin/usage-stats', [auth, adminAuth], couponController.getUsageStats);
router.get('/admin/:id/usage-history', [auth, adminAuth], couponController.getCouponUsageHistory);

// Coupon status management
router.put('/admin/:id/activate', [auth, adminAuth], couponController.activateCoupon);
router.put('/admin/:id/deactivate', [auth, adminAuth], couponController.deactivateCoupon);
router.put('/admin/:id/expire', [auth, adminAuth], couponController.expireCoupon);

// Auto-generation
router.post('/admin/auto-generate', [auth, adminAuth], couponController.autoGenerateCoupons);

// Reports
router.get('/admin/reports/usage', [auth, adminAuth], couponController.getUsageReport);
router.get('/admin/reports/revenue', [auth, adminAuth], couponController.getRevenueReport);
router.get('/admin/reports/popular', [auth, adminAuth], couponController.getPopularCouponsReport);

// Export
router.get('/admin/export', [auth, adminAuth], couponController.exportCoupons);

module.exports = router;
