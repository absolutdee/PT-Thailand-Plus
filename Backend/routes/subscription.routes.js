// routes/subscription.routes.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public subscription plans
router.get('/plans', subscriptionController.getSubscriptionPlans);
router.get('/plans/:id', subscriptionController.getSubscriptionPlanById);
router.get('/plans/compare', subscriptionController.compareSubscriptionPlans);

// User subscription management
router.get('/my-subscription', auth, subscriptionController.getMySubscription);
router.post('/subscribe/:planId', auth, subscriptionController.subscribeToplan);
router.put('/upgrade/:planId', auth, subscriptionController.upgradeSubscription);
router.put('/downgrade/:planId', auth, subscriptionController.downgradeSubscription);
router.delete('/cancel', auth, subscriptionController.cancelSubscription);
router.put('/reactivate', auth, subscriptionController.reactivateSubscription);

// Subscription billing
router.get('/billing/history', auth, subscriptionController.getBillingHistory);
router.get('/billing/upcoming', auth, subscriptionController.getUpcomingBilling);
router.put('/billing/update-payment', auth, subscriptionController.updatePaymentMethod);
router.post('/billing/retry-payment', auth, subscriptionController.retryFailedPayment);

// Subscription usage tracking
router.get('/usage/current', auth, subscriptionController.getCurrentUsage);
router.get('/usage/history', auth, subscriptionController.getUsageHistory);
router.get('/usage/limits', auth, subscriptionController.getUsageLimits);

// Subscription features
router.get('/features', auth, subscriptionController.getSubscriptionFeatures);
router.get('/features/available', auth, subscriptionController.getAvailableFeatures);

// Trial management
router.post('/trial/start', auth, subscriptionController.startTrial);
router.get('/trial/status', auth, subscriptionController.getTrialStatus);
router.put('/trial/extend', auth, subscriptionController.extendTrial);

// Subscription add-ons
router.get('/add-ons', subscriptionController.getAvailableAddOns);
router.post('/add-ons/:addOnId/purchase', auth, subscriptionController.purchaseAddOn);
router.delete('/add-ons/:addOnId/remove', auth, subscriptionController.removeAddOn);

// Trainer subscription management
router.get('/trainer/plans', subscriptionController.getTrainerSubscriptionPlans);
router.get('/trainer/my-subscription', auth, subscriptionController.getTrainerSubscription);
router.post('/trainer/subscribe/:planId', auth, subscriptionController.subscribeTrainerToPlan);

// Subscription notifications
router.get('/notifications', auth, subscriptionController.getSubscriptionNotifications);
router.put('/notifications/preferences', auth, subscriptionController.updateNotificationPreferences);

// Admin subscription management
router.get('/admin/all', [auth, adminAuth], subscriptionController.getAllSubscriptions);
router.get('/admin/stats', [auth, adminAuth], subscriptionController.getSubscriptionStats);
router.put('/admin/:userId/subscription', [auth, adminAuth], subscriptionController.updateUserSubscription);
router.delete('/admin/:userId/cancel', [auth, adminAuth], subscriptionController.adminCancelSubscription);

// Admin plan management
router.get('/admin/plans', [auth, adminAuth], subscriptionController.getAllPlans);
router.post('/admin/plans', [auth, adminAuth], subscriptionController.createSubscriptionPlan);
router.put('/admin/plans/:id', [auth, adminAuth], subscriptionController.updateSubscriptionPlan);
router.delete('/admin/plans/:id', [auth, adminAuth], subscriptionController.deleteSubscriptionPlan);

// Subscription analytics
router.get('/admin/analytics/overview', [auth, adminAuth], subscriptionController.getSubscriptionAnalytics);
router.get('/admin/analytics/revenue', [auth, adminAuth], subscriptionController.getSubscriptionRevenue);
router.get('/admin/analytics/churn', [auth, adminAuth], subscriptionController.getChurnAnalysis);
router.get('/admin/analytics/retention', [auth, adminAuth], subscriptionController.getRetentionAnalysis);

// Subscription discounts and coupons
router.get('/discounts', subscriptionController.getAvailableDiscounts);
router.post('/apply-discount', auth, subscriptionController.applyDiscount);
router.delete('/remove-discount', auth, subscriptionController.removeDiscount);

// Subscription webhooks
router.post('/webhooks/payment-success', subscriptionController.handlePaymentSuccess);
router.post('/webhooks/payment-failed', subscriptionController.handlePaymentFailed);
router.post('/webhooks/subscription-updated', subscriptionController.handleSubscriptionUpdated);

// Subscription reports
router.get('/admin/reports/monthly', [auth, adminAuth], subscriptionController.getMonthlySubscriptionReport);
router.get('/admin/reports/user-lifecycle', [auth, adminAuth], subscriptionController.getUserLifecycleReport);

// Subscription renewal
router.get('/renewal/preview', auth, subscriptionController.previewRenewal);
router.post('/renewal/confirm', auth, subscriptionController.confirmRenewal);
router.put('/renewal/auto-renew', auth, subscriptionController.updateAutoRenewal);

// Subscription pausing
router.put('/pause', auth, subscriptionController.pauseSubscription);
router.put('/resume', auth, subscriptionController.resumeSubscription);

// Subscription referrals
router.get('/referrals', auth, subscriptionController.getSubscriptionReferrals);
router.post('/referrals/create', auth, subscriptionController.createReferral);

module.exports = router;
