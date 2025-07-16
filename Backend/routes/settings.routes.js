// routes/settings.routes.js
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// User profile settings
router.get('/profile', auth, settingsController.getProfileSettings);
router.put('/profile', auth, settingsController.updateProfileSettings);
router.delete('/profile', auth, settingsController.deleteProfile);

// Account settings
router.get('/account', auth, settingsController.getAccountSettings);
router.put('/account/email', auth, settingsController.updateEmail);
router.put('/account/password', auth, settingsController.updatePassword);
router.put('/account/phone', auth, settingsController.updatePhone);

// Privacy settings
router.get('/privacy', auth, settingsController.getPrivacySettings);
router.put('/privacy', auth, settingsController.updatePrivacySettings);
router.put('/privacy/visibility', auth, settingsController.updateProfileVisibility);

// Notification settings
router.get('/notifications', auth, settingsController.getNotificationSettings);
router.put('/notifications', auth, settingsController.updateNotificationSettings);
router.put('/notifications/email', auth, settingsController.updateEmailNotifications);
router.put('/notifications/push', auth, settingsController.updatePushNotifications);
router.put('/notifications/sms', auth, settingsController.updateSmsNotifications);

// Communication preferences
router.get('/communication', auth, settingsController.getCommunicationPreferences);
router.put('/communication', auth, settingsController.updateCommunicationPreferences);

// Trainer-specific settings
router.get('/trainer/business', auth, settingsController.getTrainerBusinessSettings);
router.put('/trainer/business', auth, settingsController.updateTrainerBusinessSettings);
router.get('/trainer/availability', auth, settingsController.getTrainerAvailabilitySettings);
router.put('/trainer/availability', auth, settingsController.updateTrainerAvailabilitySettings);
router.get('/trainer/pricing', auth, settingsController.getTrainerPricingSettings);
router.put('/trainer/pricing', auth, settingsController.updateTrainerPricingSettings);

// Payment settings
router.get('/payment', auth, settingsController.getPaymentSettings);
router.put('/payment/methods', auth, settingsController.updatePaymentMethods);
router.delete('/payment/methods/:id', auth, settingsController.removePaymentMethod);
router.put('/payment/default', auth, settingsController.setDefaultPaymentMethod);

// Subscription settings
router.get('/subscription', auth, settingsController.getSubscriptionSettings);
router.put('/subscription/plan', auth, settingsController.updateSubscriptionPlan);
router.delete('/subscription/cancel', auth, settingsController.cancelSubscription);
router.put('/subscription/reactivate', auth, settingsController.reactivateSubscription);

// Security settings
router.get('/security', auth, settingsController.getSecuritySettings);
router.put('/security/two-factor', auth, settingsController.updateTwoFactorAuth);
router.post('/security/sessions/revoke', auth, settingsController.revokeAllSessions);
router.get('/security/login-history', auth, settingsController.getLoginHistory);

// Data and backup settings
router.get('/data', auth, settingsController.getDataSettings);
router.post('/data/export', auth, settingsController.exportUserData);
router.post('/data/backup', auth, settingsController.backupUserData);

// Integration settings
router.get('/integrations', auth, settingsController.getIntegrationSettings);
router.put('/integrations/:provider', auth, settingsController.updateIntegrationSettings);
router.delete('/integrations/:provider', auth, settingsController.disconnectIntegration);

// Theme and display settings
router.get('/display', auth, settingsController.getDisplaySettings);
router.put('/display/theme', auth, settingsController.updateTheme);
router.put('/display/language', auth, settingsController.updateLanguage);
router.put('/display/timezone', auth, settingsController.updateTimezone);

// Admin system settings
router.get('/admin/system', [auth, adminAuth], settingsController.getSystemSettings);
router.put('/admin/system', [auth, adminAuth], settingsController.updateSystemSettings);

// Admin client settings
router.get('/admin/client-settings', [auth, adminAuth], settingsController.getClientSystemSettings);
router.put('/admin/client-settings', [auth, adminAuth], settingsController.updateClientSystemSettings);

// Admin trainer settings
router.get('/admin/trainer-settings', [auth, adminAuth], settingsController.getTrainerSystemSettings);
router.put('/admin/trainer-settings', [auth, adminAuth], settingsController.updateTrainerSystemSettings);

// Admin payment settings
router.get('/admin/payment-settings', [auth, adminAuth], settingsController.getPaymentSystemSettings);
router.put('/admin/payment-settings', [auth, adminAuth], settingsController.updatePaymentSystemSettings);

// Admin hero banner settings
router.get('/admin/hero-banner', [auth, adminAuth], settingsController.getHeroBannerSettings);
router.put('/admin/hero-banner', [auth, adminAuth], settingsController.updateHeroBannerSettings);

// Admin SEO and marketing settings
router.get('/admin/seo', [auth, adminAuth], settingsController.getSeoSettings);
router.put('/admin/seo', [auth, adminAuth], settingsController.updateSeoSettings);

// Platform configuration
router.get('/admin/platform-config', [auth, adminAuth], settingsController.getPlatformConfig);
router.put('/admin/platform-config', [auth, adminAuth], settingsController.updatePlatformConfig);

// Email template settings
router.get('/admin/email-templates', [auth, adminAuth], settingsController.getEmailTemplates);
router.put('/admin/email-templates/:templateId', [auth, adminAuth], settingsController.updateEmailTemplate);

// Settings history and audit
router.get('/history', auth, settingsController.getSettingsHistory);
router.get('/admin/settings-audit', [auth, adminAuth], settingsController.getSettingsAudit);

module.exports = router;
