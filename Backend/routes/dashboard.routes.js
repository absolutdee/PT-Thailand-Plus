// routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Client dashboard
router.get('/client/overview', auth, dashboardController.getClientOverview);
router.get('/client/stats', auth, dashboardController.getClientStats);
router.get('/client/recent-activities', auth, dashboardController.getClientRecentActivities);
router.get('/client/upcoming-sessions', auth, dashboardController.getUpcomingSessions);
router.get('/client/progress', auth, dashboardController.getClientProgress);
router.get('/client/achievements', auth, dashboardController.getClientAchievements);

// Trainer dashboard
router.get('/trainer/overview', auth, dashboardController.getTrainerOverview);
router.get('/trainer/stats', auth, dashboardController.getTrainerStats);
router.get('/trainer/today-schedule', auth, dashboardController.getTodaySchedule);
router.get('/trainer/recent-clients', auth, dashboardController.getRecentClients);
router.get('/trainer/revenue', auth, dashboardController.getTrainerRevenue);
router.get('/trainer/reviews', auth, dashboardController.getTrainerReviews);
router.get('/trainer/notifications', auth, dashboardController.getTrainerNotifications);

// Admin dashboard
router.get('/admin/overview', [auth, adminAuth], dashboardController.getAdminOverview);
router.get('/admin/stats', [auth, adminAuth], dashboardController.getAdminStats);
router.get('/admin/recent-activities', [auth, adminAuth], dashboardController.getRecentActivities);
router.get('/admin/user-growth', [auth, adminAuth], dashboardController.getUserGrowth);
router.get('/admin/revenue-overview', [auth, adminAuth], dashboardController.getRevenueOverview);
router.get('/admin/top-trainers', [auth, adminAuth], dashboardController.getTopTrainers);
router.get('/admin/platform-health', [auth, adminAuth], dashboardController.getPlatformHealth);

// Dashboard widgets
router.get('/widgets/upcoming-events', auth, dashboardController.getUpcomingEvents);
router.get('/widgets/weather', auth, dashboardController.getWeatherWidget);
router.get('/widgets/quick-stats', auth, dashboardController.getQuickStats);
router.get('/widgets/progress-chart', auth, dashboardController.getProgressChart);
router.get('/widgets/recent-bookings', auth, dashboardController.getRecentBookings);

// Dashboard customization
router.get('/layout', auth, dashboardController.getDashboardLayout);
router.post('/layout', auth, dashboardController.saveDashboardLayout);
router.put('/layout', auth, dashboardController.updateDashboardLayout);
router.delete('/layout', auth, dashboardController.resetDashboardLayout);

// Dashboard preferences
router.get('/preferences', auth, dashboardController.getDashboardPreferences);
router.post('/preferences', auth, dashboardController.saveDashboardPreferences);

// Dashboard notifications
router.get('/notifications/recent', auth, dashboardController.getRecentNotifications);
router.put('/notifications/:id/read', auth, dashboardController.markNotificationAsRead);
router.put('/notifications/mark-all-read', auth, dashboardController.markAllNotificationsAsRead);

// Quick actions
router.post('/quick-action/book-session', auth, dashboardController.quickBookSession);
router.post('/quick-action/send-message', auth, dashboardController.quickSendMessage);
router.post('/quick-action/log-workout', auth, dashboardController.quickLogWorkout);

// Dashboard analytics
router.get('/analytics/time-range/:range', auth, dashboardController.getDashboardAnalytics);

module.exports = router;
