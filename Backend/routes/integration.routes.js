// routes/integration.routes.js
const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integration.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Third-party authentication
router.post('/auth/google/connect', auth, integrationController.connectGoogle);
router.post('/auth/facebook/connect', auth, integrationController.connectFacebook);
router.post('/auth/apple/connect', auth, integrationController.connectApple);
router.delete('/auth/:provider/disconnect', auth, integrationController.disconnectProvider);

// Fitness apps integration
router.post('/fitness/strava/connect', auth, integrationController.connectStrava);
router.post('/fitness/fitbit/connect', auth, integrationController.connectFitbit);
router.post('/fitness/garmin/connect', auth, integrationController.connectGarmin);
router.post('/fitness/myfitnesspal/connect', auth, integrationController.connectMyFitnessPal);
router.get('/fitness/connected', auth, integrationController.getConnectedFitnessApps);

// Health data sync
router.post('/health/sync/workouts', auth, integrationController.syncWorkouts);
router.post('/health/sync/nutrition', auth, integrationController.syncNutrition);
router.post('/health/sync/weight', auth, integrationController.syncWeight);
router.post('/health/sync/heart-rate', auth, integrationController.syncHeartRate);
router.post('/health/sync/steps', auth, integrationController.syncSteps);

// Calendar integration
router.post('/calendar/google/connect', auth, integrationController.connectGoogleCalendar);
router.post('/calendar/outlook/connect', auth, integrationController.connectOutlookCalendar);
router.post('/calendar/sync', auth, integrationController.syncCalendar);
router.get('/calendar/events', auth, integrationController.getCalendarEvents);

// Payment gateway integration
router.post('/payment/stripe/connect', auth, integrationController.connectStripe);
router.post('/payment/paypal/connect', auth, integrationController.connectPayPal);
router.get('/payment/methods', auth, integrationController.getPaymentMethods);
router.delete('/payment/:provider/disconnect', auth, integrationController.disconnectPayment);

// Messaging integration
router.post('/messaging/whatsapp/connect', auth, integrationController.connectWhatsApp);
router.post('/messaging/telegram/connect', auth, integrationController.connectTelegram);
router.post('/messaging/slack/connect', auth, integrationController.connectSlack);

// Nutrition tracking integration
router.post('/nutrition/cronometer/connect', auth, integrationController.connectCronometer);
router.post('/nutrition/fooducate/connect', auth, integrationController.connectFooducate);
router.get('/nutrition/data', auth, integrationController.getNutritionData);

// Wearable device integration
router.post('/wearables/apple-watch/connect', auth, integrationController.connectAppleWatch);
router.post('/wearables/samsung-health/connect', auth, integrationController.connectSamsungHealth);
router.post('/wearables/polar/connect', auth, integrationController.connectPolar);

// Integration status and management
router.get('/status', auth, integrationController.getIntegrationStatus);
router.get('/available', auth, integrationController.getAvailableIntegrations);
router.put('/settings/:provider', auth, integrationController.updateIntegrationSettings);

// Webhook management
router.post('/webhooks/register', auth, integrationController.registerWebhook);
router.get('/webhooks', auth, integrationController.getWebhooks);
router.delete('/webhooks/:id', auth, integrationController.deleteWebhook);

// Admin integration management
router.get('/admin/overview', [auth, adminAuth], integrationController.getIntegrationOverview);
router.get('/admin/usage-stats', [auth, adminAuth], integrationController.getIntegrationUsageStats);
router.post('/admin/api-keys', [auth, adminAuth], integrationController.manageApiKeys);

// API endpoints for external integrations
router.post('/api/webhook/:provider', integrationController.handleWebhook);
router.get('/api/health-check', integrationController.healthCheck);

module.exports = router;
