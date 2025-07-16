// routes/trainer.routes.js
const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainer.controller');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validation');
const { trainerValidation } = require('../validations');
const upload = require('../middleware/upload');

// Apply authentication and role check to all trainer routes
router.use(authenticate, roleCheck('trainer'));

// Dashboard & Overview
router.get('/dashboard', trainerController.getDashboard);
router.get('/stats', trainerController.getStats);

// Profile Management
router.get('/profile', trainerController.getProfile);
router.put('/profile', 
  validate(trainerValidation.updateProfile), 
  trainerController.updateProfile
);

// Gallery Management (max 12 images)
router.get('/gallery', trainerController.getGallery);
router.post('/gallery/upload', 
  upload.array('images', 12), 
  trainerController.uploadGalleryImages
);
router.delete('/gallery/:imageId', trainerController.deleteGalleryImage);
router.put('/gallery/reorder', 
  validate(trainerValidation.reorderGallery), 
  trainerController.reorderGallery
);

// Package Management (max 3 packages)
router.get('/packages', trainerController.getPackages);
router.post('/packages', 
  validate(trainerValidation.createPackage), 
  trainerController.createPackage
);
router.put('/packages/:packageId', 
  validate(trainerValidation.updatePackage), 
  trainerController.updatePackage
);
router.delete('/packages/:packageId', trainerController.deletePackage);
router.put('/packages/:packageId/featured', trainerController.setFeaturedPackage);

// Schedule Management
router.get('/schedule', trainerController.getSchedule);
router.post('/schedule', 
  validate(trainerValidation.createSchedule), 
  trainerController.createSchedule
);
router.put('/schedule/:scheduleId', 
  validate(trainerValidation.updateSchedule), 
  trainerController.updateSchedule
);
router.delete('/schedule/:scheduleId', trainerController.deleteSchedule);
router.get('/availability', trainerController.getAvailability);
router.put('/availability', 
  validate(trainerValidation.updateAvailability), 
  trainerController.updateAvailability
);

// Client Management
router.get('/clients', trainerController.getClients);
router.get('/clients/:clientId', trainerController.getClientDetails);
router.get('/clients/:clientId/progress', trainerController.getClientProgress);
router.get('/clients/:clientId/health-data', trainerController.getClientHealthData);

// Session Management
router.get('/sessions', trainerController.getSessions);
router.get('/sessions/:sessionId', trainerController.getSessionDetails);
router.post('/sessions/:sessionId/notes', 
  validate(trainerValidation.addSessionNotes), 
  trainerController.addSessionNotes
);
router.put('/sessions/:sessionId/complete', 
  validate(trainerValidation.completeSession), 
  trainerController.completeSession
);
router.put('/sessions/:sessionId/cancel', 
  validate(trainerValidation.cancelSession), 
  trainerController.cancelSession
);

// Appointment Management
router.get('/appointments', trainerController.getAppointments);
router.post('/appointments', 
  validate(trainerValidation.createAppointment), 
  trainerController.createAppointment
);
router.put('/appointments/:appointmentId/confirm', trainerController.confirmAppointment);
router.put('/appointments/:appointmentId/reschedule', 
  validate(trainerValidation.rescheduleAppointment), 
  trainerController.rescheduleAppointment
);
router.put('/appointments/:appointmentId/cancel', 
  validate(trainerValidation.cancelAppointment), 
  trainerController.cancelAppointment
);

// Nutrition Plan Management
router.get('/nutrition-plans', trainerController.getNutritionPlans);
router.post('/nutrition-plans', 
  validate(trainerValidation.createNutritionPlan), 
  trainerController.createNutritionPlan
);
router.put('/nutrition-plans/:planId', 
  validate(trainerValidation.updateNutritionPlan), 
  trainerController.updateNutritionPlan
);
router.delete('/nutrition-plans/:planId', trainerController.deleteNutritionPlan);
router.post('/nutrition-plans/:planId/assign', 
  validate(trainerValidation.assignNutritionPlan), 
  trainerController.assignNutritionPlan
);

// Workout Plan Management
router.get('/workout-plans', trainerController.getWorkoutPlans);
router.post('/workout-plans', 
  validate(trainerValidation.createWorkoutPlan), 
  trainerController.createWorkoutPlan
);
router.put('/workout-plans/:planId', 
  validate(trainerValidation.updateWorkoutPlan), 
  trainerController.updateWorkoutPlan
);
router.delete('/workout-plans/:planId', trainerController.deleteWorkoutPlan);
router.post('/workout-plans/:planId/assign', 
  validate(trainerValidation.assignWorkoutPlan), 
  trainerController.assignWorkoutPlan
);

// Financial Management
router.get('/earnings', trainerController.getEarnings);
router.get('/earnings/summary', trainerController.getEarningsSummary);
router.get('/transactions', trainerController.getTransactions);
router.get('/invoices', trainerController.getInvoices);
router.get('/invoices/:invoiceId', trainerController.getInvoiceDetails);
router.post('/withdraw', 
  validate(trainerValidation.withdrawRequest), 
  trainerController.createWithdrawRequest
);
router.get('/withdraw/history', trainerController.getWithdrawHistory);

// Reviews & Ratings
router.get('/reviews', trainerController.getReviews);
router.get('/reviews/stats', trainerController.getReviewStats);
router.post('/reviews/:reviewId/response', 
  validate(trainerValidation.respondToReview), 
  trainerController.respondToReview
);

// Settings
router.get('/settings', trainerController.getSettings);
router.put('/settings/working-hours', 
  validate(trainerValidation.updateWorkingHours), 
  trainerController.updateWorkingHours
);
router.put('/settings/notifications', 
  validate(trainerValidation.updateNotificationSettings), 
  trainerController.updateNotificationSettings
);
router.put('/settings/privacy', 
  validate(trainerValidation.updatePrivacySettings), 
  trainerController.updatePrivacySettings
);
router.put('/settings/payment', 
  validate(trainerValidation.updatePaymentSettings), 
  trainerController.updatePaymentSettings
);

// Reports & Analytics
router.get('/reports/overview', trainerController.getOverviewReport);
router.get('/reports/clients', trainerController.getClientReport);
router.get('/reports/sessions', trainerController.getSessionReport);
router.get('/reports/earnings', trainerController.getEarningsReport);

module.exports = router;