// routes/notification.routes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { notificationValidation } = require('../validations');

// Apply authentication to all notification routes
router.use(authenticate);

// Get Notifications
router.get('/', 
  validate(notificationValidation.getNotifications), 
  notificationController.getNotifications
);
router.get('/unread', notificationController.getUnreadNotifications);
router.get('/count', notificationController.getNotificationCount);
router.get('/:notificationId', notificationController.getNotificationDetails);

// Notification Actions
router.put('/:notificationId/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);
router.delete('/clear-all', notificationController.clearAllNotifications);

// Notification Preferences
router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', 
  validate(notificationValidation.updatePreferences), 
  notificationController.updatePreferences
);
router.get('/preferences/categories', notificationController.getNotificationCategories);
router.put('/preferences/categories/:category', 
  validate(notificationValidation.updateCategoryPreference), 
  notificationController.updateCategoryPreference
);

// Push Notification Tokens
router.post('/devices', 
  validate(notificationValidation.registerDevice), 
  notificationController.registerDevice
);
router.delete('/devices/:deviceId', notificationController.unregisterDevice);
router.get('/devices', notificationController.getRegisteredDevices);

// Email Notification Settings
router.get('/email/settings', notificationController.getEmailSettings);
router.put('/email/settings', 
  validate(notificationValidation.updateEmailSettings), 
  notificationController.updateEmailSettings
);
router.post('/email/verify', 
  validate(notificationValidation.verifyEmail), 
  notificationController.verifyEmailForNotifications
);

// SMS Notification Settings
router.get('/sms/settings', notificationController.getSMSSettings);
router.put('/sms/settings', 
  validate(notificationValidation.updateSMSSettings), 
  notificationController.updateSMSSettings
);
router.post('/sms/verify', 
  validate(notificationValidation.verifySMS), 
  notificationController.verifySMSForNotifications
);

// Notification Schedule
router.get('/schedule', notificationController.getNotificationSchedule);
router.put('/schedule', 
  validate(notificationValidation.updateSchedule), 
  notificationController.updateNotificationSchedule
);
router.get('/quiet-hours', notificationController.getQuietHours);
router.put('/quiet-hours', 
  validate(notificationValidation.updateQuietHours), 
  notificationController.updateQuietHours
);

// Notification History
router.get('/history', 
  validate(notificationValidation.getHistory), 
  notificationController.getNotificationHistory
);
router.get('/history/stats', notificationController.getNotificationStats);

// Subscription Management
router.get('/subscriptions', notificationController.getSubscriptions);
router.post('/subscriptions/:type/subscribe', 
  validate(notificationValidation.subscribe), 
  notificationController.subscribe
);
router.delete('/subscriptions/:type/unsubscribe', notificationController.unsubscribe);

// Test Notifications
router.post('/test', 
  validate(notificationValidation.sendTestNotification), 
  notificationController.sendTestNotification
);

// Notification Templates (for viewing available templates)
router.get('/templates', notificationController.getAvailableTemplates);
router.get('/templates/:templateId/preview', notificationController.previewTemplate);

// Batch Operations
router.post('/batch/read', 
  validate(notificationValidation.batchMarkAsRead), 
  notificationController.batchMarkAsRead
);
router.post('/batch/delete', 
  validate(notificationValidation.batchDelete), 
  notificationController.batchDelete
);

// Notification Filters
router.get('/filters', notificationController.getAvailableFilters);
router.post('/filters', 
  validate(notificationValidation.createFilter), 
  notificationController.createFilter
);
router.put('/filters/:filterId', 
  validate(notificationValidation.updateFilter), 
  notificationController.updateFilter
);
router.delete('/filters/:filterId', notificationController.deleteFilter);

module.exports = router;