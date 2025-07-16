// routes/partner.routes.js
const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partner.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public partner routes
router.get('/public', partnerController.getPublicPartners);
router.get('/public/:id', partnerController.getPublicPartnerById);
router.get('/featured', partnerController.getFeaturedPartners);
router.get('/categories/:category', partnerController.getPartnersByCategory);

// Partnership application
router.post('/apply', partnerController.applyForPartnership);
router.get('/application-status/:email', partnerController.getApplicationStatus);

// Partner benefits and offers
router.get('/benefits', partnerController.getPartnerBenefits);
router.get('/offers', partnerController.getPartnerOffers);
router.get('/offers/:partnerId', partnerController.getPartnerOfferById);

// User partner interactions
router.get('/my-partnerships', auth, partnerController.getMyPartnerships);
router.post('/:id/connect', auth, partnerController.connectWithPartner);
router.delete('/:id/disconnect', auth, partnerController.disconnectFromPartner);

// Partner discounts and coupons
router.get('/:id/discounts', partnerController.getPartnerDiscounts);
router.post('/:id/redeem-discount', auth, partnerController.redeemPartnerDiscount);
router.get('/my-partner-coupons', auth, partnerController.getMyPartnerCoupons);

// Admin partner management
router.get('/admin/all', [auth, adminAuth], partnerController.getAllPartners);
router.post('/admin/create', [auth, adminAuth], partnerController.createPartner);
router.put('/admin/:id', [auth, adminAuth], partnerController.updatePartner);
router.delete('/admin/:id', [auth, adminAuth], partnerController.deletePartner);
router.get('/admin/:id', [auth, adminAuth], partnerController.getPartnerById);

// Partnership applications management
router.get('/admin/applications', [auth, adminAuth], partnerController.getPartnershipApplications);
router.get('/admin/applications/:id', [auth, adminAuth], partnerController.getApplicationById);
router.put('/admin/applications/:id/approve', [auth, adminAuth], partnerController.approveApplication);
router.put('/admin/applications/:id/reject', [auth, adminAuth], partnerController.rejectApplication);

// Partner status management
router.put('/admin/:id/activate', [auth, adminAuth], partnerController.activatePartner);
router.put('/admin/:id/deactivate', [auth, adminAuth], partnerController.deactivatePartner);
router.put('/admin/:id/feature', [auth, adminAuth], partnerController.featurePartner);
router.put('/admin/:id/unfeature', [auth, adminAuth], partnerController.unfeaturePartner);

// Partner categories management
router.get('/admin/categories', [auth, adminAuth], partnerController.getPartnerCategories);
router.post('/admin/categories', [auth, adminAuth], partnerController.createPartnerCategory);
router.put('/admin/categories/:id', [auth, adminAuth], partnerController.updatePartnerCategory);
router.delete('/admin/categories/:id', [auth, adminAuth], partnerController.deletePartnerCategory);

// Partner contracts and agreements
router.get('/admin/:id/contract', [auth, adminAuth], partnerController.getPartnerContract);
router.post('/admin/:id/contract', [auth, adminAuth], partnerController.createPartnerContract);
router.put('/admin/:id/contract', [auth, adminAuth], partnerController.updatePartnerContract);

// Partner performance tracking
router.get('/admin/:id/performance', [auth, adminAuth], partnerController.getPartnerPerformance);
router.get('/admin/:id/analytics', [auth, adminAuth], partnerController.getPartnerAnalytics);
router.get('/admin/performance-overview', [auth, adminAuth], partnerController.getPartnerPerformanceOverview);

// Partner communications
router.post('/admin/:id/send-message', [auth, adminAuth], partnerController.sendMessageToPartner);
router.get('/admin/:id/messages', [auth, adminAuth], partnerController.getPartnerMessages);

// Partner payments and commissions
router.get('/admin/:id/payments', [auth, adminAuth], partnerController.getPartnerPayments);
router.post('/admin/:id/process-payment', [auth, adminAuth], partnerController.processPartnerPayment);
router.get('/admin/commission-report', [auth, adminAuth], partnerController.getCommissionReport);

// Partner API access
router.post('/admin/:id/api-access', [auth, adminAuth], partnerController.grantApiAccess);
router.delete('/admin/:id/api-access', [auth, adminAuth], partnerController.revokeApiAccess);
router.get('/admin/:id/api-usage', [auth, adminAuth], partnerController.getApiUsage);

// Partner directory
router.get('/directory', partnerController.getPartnerDirectory);
router.get('/directory/search', partnerController.searchPartners);

module.exports = router;
