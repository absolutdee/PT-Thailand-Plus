// routes/client.routes.js
const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validation');
const { clientValidation } = require('../validations');

// Apply authentication and role check to all client routes
router.use(authenticate, roleCheck('client'));

// Dashboard & Overview
router.get('/dashboard', clientController.getDashboard);
router.get('/stats', clientController.getStats);
router.get('/upcoming-sessions', clientController.getUpcomingSessions);

// Profile Management
router.get('/profile', clientController.getProfile);
router.put('/profile', 
  validate(clientValidation.updateProfile), 
  clientController.updateProfile
);

// Health Data Management
router.get('/health-data', clientController.getHealthData);
router.post('/health-data', 
  validate(clientValidation.createHealthData), 
  clientController.createHealthData
);
router.put('/health-data/:dataId', 
  validate(clientValidation.updateHealthData), 
  clientController.updateHealthData
);
router.get('/health-data/history', clientController.getHealthDataHistory);
router.get('/health-data/metrics', clientController.getHealthMetrics);

// Trainer Search & Discovery
router.get('/trainers/search', 
  validate(clientValidation.searchTrainers), 
  clientController.searchTrainers
);
router.get('/trainers/recommended', clientController.getRecommendedTrainers);
router.get('/trainers/:trainerId', clientController.getTrainerDetails);
router.get('/trainers/:trainerId/packages', clientController.getTrainerPackages);
router.get('/trainers/:trainerId/availability', clientController.getTrainerAvailability);
router.get('/trainers/:trainerId/reviews', clientController.getTrainerReviews);

// Subscription & Package Management
router.get('/subscriptions', clientController.getSubscriptions);
router.get('/subscriptions/active', clientController.getActiveSubscriptions);
router.post('/subscriptions/purchase', 
  validate(clientValidation.purchasePackage), 
  clientController.purchasePackage
);
router.put('/subscriptions/:subscriptionId/cancel', clientController.cancelSubscription);
router.get('/subscriptions/:subscriptionId', clientController.getSubscriptionDetails);

// Session Management
router.get('/sessions', clientController.getSessions);
router.get('/sessions/:sessionId', clientController.getSessionDetails);
router.put('/sessions/:sessionId/confirm', clientController.confirmSession);
router.put('/sessions/:sessionId/reschedule', 
  validate(clientValidation.rescheduleSession), 
  clientController.rescheduleSession
);
router.put('/sessions/:sessionId/cancel', 
  validate(clientValidation.cancelSession), 
  clientController.cancelSession
);
router.get('/sessions/:sessionId/notes', clientController.getSessionNotes);

// Appointment Booking
router.get('/appointments', clientController.getAppointments);
router.post('/appointments/book', 
  validate(clientValidation.bookAppointment), 
  clientController.bookAppointment
);
router.get('/appointments/:appointmentId', clientController.getAppointmentDetails);
router.put('/appointments/:appointmentId/confirm', clientController.confirmAppointment);
router.put('/appointments/:appointmentId/cancel', 
  validate(clientValidation.cancelAppointment), 
  clientController.cancelAppointment
);

// Workout Plans
router.get('/workout-plans', clientController.getWorkoutPlans);
router.get('/workout-plans/active', clientController.getActiveWorkoutPlans);
router.get('/workout-plans/:planId', clientController.getWorkoutPlanDetails);
router.post('/workout-plans/:planId/exercises/:exerciseId/complete', 
  validate(clientValidation.completeExercise), 
  clientController.completeExercise
);
router.get('/workout-plans/:planId/progress', clientController.getWorkoutProgress);

// Nutrition Plans
router.get('/nutrition-plans', clientController.getNutritionPlans);
router.get('/nutrition-plans/active', clientController.getActiveNutritionPlans);
router.get('/nutrition-plans/:planId', clientController.getNutritionPlanDetails);
router.post('/nutrition-plans/:planId/meals/:mealId/log', 
  validate(clientValidation.logMeal), 
  clientController.logMeal
);
router.get('/nutrition-plans/:planId/progress', clientController.getNutritionProgress);

// Progress Tracking
router.get('/progress', clientController.getProgress);
router.get('/progress/summary', clientController.getProgressSummary);
router.get('/progress/measurements', clientController.getMeasurements);
router.post('/progress/measurements', 
  validate(clientValidation.addMeasurement), 
  clientController.addMeasurement
);
router.get('/progress/photos', clientController.getProgressPhotos);
router.post('/progress/photos', 
  clientController.uploadProgressPhoto
);
router.delete('/progress/photos/:photoId', clientController.deleteProgressPhoto);

// Achievements & Milestones
router.get('/achievements', clientController.getAchievements);
router.get('/achievements/recent', clientController.getRecentAchievements);
router.get('/milestones', clientController.getMilestones);
router.post('/milestones/:milestoneId/complete', clientController.completeMilestone);

// Reviews & Ratings
router.get('/reviews', clientController.getMyReviews);
router.post('/reviews', 
  validate(clientValidation.createReview), 
  clientController.createReview
);
router.put('/reviews/:reviewId', 
  validate(clientValidation.updateReview), 
  clientController.updateReview
);
router.delete('/reviews/:reviewId', clientController.deleteReview);

// Chat & Messaging
router.get('/chats', clientController.getChats);
router.get('/chats/:trainerId', clientController.getChatHistory);
router.post('/chats/:trainerId/messages', 
  validate(clientValidation.sendMessage), 
  clientController.sendMessage
);
router.put('/chats/:trainerId/read', clientController.markMessagesAsRead);

// Notifications
router.get('/notifications', clientController.getNotifications);
router.get('/notifications/unread', clientController.getUnreadNotifications);
router.put('/notifications/:notificationId/read', clientController.markNotificationAsRead);
router.put('/notifications/read-all', clientController.markAllNotificationsAsRead);
router.delete('/notifications/:notificationId', clientController.deleteNotification);

// Payment & Billing
router.get('/payments', clientController.getPaymentHistory);
router.get('/payments/:paymentId', clientController.getPaymentDetails);
router.get('/invoices', clientController.getInvoices);
router.get('/invoices/:invoiceId', clientController.getInvoiceDetails);
router.post('/payments/methods', 
  validate(clientValidation.addPaymentMethod), 
  clientController.addPaymentMethod
);
router.delete('/payments/methods/:methodId', clientController.removePaymentMethod);
router.put('/payments/methods/:methodId/default', clientController.setDefaultPaymentMethod);

// Settings
router.get('/settings', clientController.getSettings);
router.put('/settings/notifications', 
  validate(clientValidation.updateNotificationSettings), 
  clientController.updateNotificationSettings
);
router.put('/settings/privacy', 
  validate(clientValidation.updatePrivacySettings), 
  clientController.updatePrivacySettings
);
router.put('/settings/preferences', 
  validate(clientValidation.updatePreferences), 
  clientController.updatePreferences
);

// Support
router.get('/support/tickets', clientController.getSupportTickets);
router.post('/support/tickets', 
  validate(clientValidation.createSupportTicket), 
  clientController.createSupportTicket
);
router.get('/support/tickets/:ticketId', clientController.getTicketDetails);
router.post('/support/tickets/:ticketId/messages', 
  validate(clientValidation.addTicketMessage), 
  clientController.addTicketMessage
);

module.exports = router;