// routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validation');
const { adminValidation } = require('../validations');
const upload = require('../middleware/upload');

// Apply authentication and admin role check to all admin routes
router.use(authenticate, roleCheck('admin'));

// Dashboard & Overview
router.get('/dashboard', adminController.getDashboard);
router.get('/stats', adminController.getSystemStats);
router.get('/analytics', adminController.getAnalytics);
router.get('/analytics/revenue', adminController.getRevenueAnalytics);
router.get('/analytics/users', adminController.getUserAnalytics);
router.get('/analytics/sessions', adminController.getSessionAnalytics);

// User Management - Clients
router.get('/users/clients', adminController.getClients);
router.get('/users/clients/:clientId', adminController.getClientDetails);
router.put('/users/clients/:clientId/status', 
  validate(adminValidation.updateUserStatus), 
  adminController.updateClientStatus
);
router.delete('/users/clients/:clientId', adminController.deleteClient);
router.get('/users/clients/:clientId/activity', adminController.getClientActivity);

// User Management - Trainers
router.get('/users/trainers', adminController.getTrainers);
router.get('/users/trainers/:trainerId', adminController.getTrainerDetails);
router.put('/users/trainers/:trainerId/status', 
  validate(adminValidation.updateUserStatus), 
  adminController.updateTrainerStatus
);
router.put('/users/trainers/:trainerId/verify', adminController.verifyTrainer);
router.delete('/users/trainers/:trainerId', adminController.deleteTrainer);
router.get('/users/trainers/:trainerId/activity', adminController.getTrainerActivity);
router.get('/users/trainers/pending-verification', adminController.getPendingTrainers);

// User Management - Admins
router.get('/users/admins', adminController.getAdmins);
router.post('/users/admins', 
  validate(adminValidation.createAdmin), 
  adminController.createAdmin
);
router.put('/users/admins/:adminId', 
  validate(adminValidation.updateAdmin), 
  adminController.updateAdmin
);
router.delete('/users/admins/:adminId', adminController.deleteAdmin);

// Content Management - Articles
router.get('/articles', adminController.getArticles);
router.post('/articles', 
  validate(adminValidation.createArticle), 
  adminController.createArticle
);
router.put('/articles/:articleId', 
  validate(adminValidation.updateArticle), 
  adminController.updateArticle
);
router.delete('/articles/:articleId', adminController.deleteArticle);
router.put('/articles/:articleId/publish', adminController.publishArticle);
router.put('/articles/:articleId/unpublish', adminController.unpublishArticle);

// Content Management - Events
router.get('/events', adminController.getEvents);
router.post('/events', 
  validate(adminValidation.createEvent), 
  adminController.createEvent
);
router.put('/events/:eventId', 
  validate(adminValidation.updateEvent), 
  adminController.updateEvent
);
router.delete('/events/:eventId', adminController.deleteEvent);
router.put('/events/:eventId/publish', adminController.publishEvent);
router.get('/events/:eventId/participants', adminController.getEventParticipants);

// Gym & Fitness Center Management
router.get('/gyms', adminController.getGyms);
router.post('/gyms', 
  validate(adminValidation.createGym), 
  adminController.createGym
);
router.put('/gyms/:gymId', 
  validate(adminValidation.updateGym), 
  adminController.updateGym
);
router.delete('/gyms/:gymId', adminController.deleteGym);
router.put('/gyms/:gymId/verify', adminController.verifyGym);
router.get('/gyms/pending-verification', adminController.getPendingGyms);

// Partner Management
router.get('/partners', adminController.getPartners);
router.post('/partners', 
  validate(adminValidation.createPartner), 
  adminController.createPartner
);
router.put('/partners/:partnerId', 
  validate(adminValidation.updatePartner), 
  adminController.updatePartner
);
router.delete('/partners/:partnerId', adminController.deletePartner);
router.put('/partners/:partnerId/status', 
  validate(adminValidation.updatePartnerStatus), 
  adminController.updatePartnerStatus
);

// Review Management
router.get('/reviews', adminController.getReviews);
router.get('/reviews/reported', adminController.getReportedReviews);
router.put('/reviews/:reviewId/approve', adminController.approveReview);
router.delete('/reviews/:reviewId', adminController.deleteReview);
router.put('/reviews/:reviewId/resolve-report', 
  validate(adminValidation.resolveReport), 
  adminController.resolveReviewReport
);

// Media Management
router.get('/media', adminController.getMedia);
router.post('/media/upload', 
  upload.single('file'), 
  adminController.uploadMedia
);
router.delete('/media/:mediaId', adminController.deleteMedia);
router.get('/media/categories', adminController.getMediaCategories);
router.post('/media/categories', 
  validate(adminValidation.createMediaCategory), 
  adminController.createMediaCategory
);

// Financial Management
router.get('/finance/overview', adminController.getFinanceOverview);
router.get('/finance/transactions', adminController.getTransactions);
router.get('/finance/transactions/:transactionId', adminController.getTransactionDetails);
router.get('/finance/payouts', adminController.getPayouts);
router.post('/finance/payouts/process', 
  validate(adminValidation.processPayout), 
  adminController.processPayout
);
router.get('/finance/invoices', adminController.getAllInvoices);
router.get('/finance/revenue-report', adminController.getRevenueReport);
router.get('/finance/commission-report', adminController.getCommissionReport);
router.put('/finance/commission-rate', 
  validate(adminValidation.updateCommissionRate), 
  adminController.updateCommissionRate
);

// Session Management
router.get('/sessions', adminController.getAllSessions);
router.get('/sessions/:sessionId', adminController.getSessionDetails);
router.get('/sessions/conflicts', adminController.getSessionConflicts);
router.put('/sessions/:sessionId/resolve-conflict', 
  validate(adminValidation.resolveSessionConflict), 
  adminController.resolveSessionConflict
);

// Reports
router.get('/reports/users', adminController.getUserReport);
router.get('/reports/trainers', adminController.getTrainerReport);
router.get('/reports/sessions', adminController.getSessionReport);
router.get('/reports/revenue', adminController.getRevenueReport);
router.get('/reports/growth', adminController.getGrowthReport);
router.post('/reports/export', 
  validate(adminValidation.exportReport), 
  adminController.exportReport
);

// Support Ticket Management
router.get('/support/tickets', adminController.getSupportTickets);
router.get('/support/tickets/:ticketId', adminController.getTicketDetails);
router.put('/support/tickets/:ticketId/assign', 
  validate(adminValidation.assignTicket), 
  adminController.assignTicket
);
router.put('/support/tickets/:ticketId/status', 
  validate(adminValidation.updateTicketStatus), 
  adminController.updateTicketStatus
);
router.post('/support/tickets/:ticketId/reply', 
  validate(adminValidation.replyToTicket), 
  adminController.replyToTicket
);
router.get('/support/categories', adminController.getSupportCategories);
router.post('/support/categories', 
  validate(adminValidation.createSupportCategory), 
  adminController.createSupportCategory
);

// System Settings
router.get('/settings', adminController.getSystemSettings);
router.put('/settings/general', 
  validate(adminValidation.updateGeneralSettings), 
  adminController.updateGeneralSettings
);
router.put('/settings/client', 
  validate(adminValidation.updateClientSettings), 
  adminController.updateClientSettings
);
router.put('/settings/trainer', 
  validate(adminValidation.updateTrainerSettings), 
  adminController.updateTrainerSettings
);
router.put('/settings/payment', 
  validate(adminValidation.updatePaymentSettings), 
  adminController.updatePaymentSettings
);
router.put('/settings/hero-banner', 
  validate(adminValidation.updateHeroBanner), 
  adminController.updateHeroBanner
);
router.put('/settings/seo', 
  validate(adminValidation.updateSEOSettings), 
  adminController.updateSEOSettings
);
router.put('/settings/email-templates', 
  validate(adminValidation.updateEmailTemplate), 
  adminController.updateEmailTemplate
);
router.get('/settings/email-templates', adminController.getEmailTemplates);

// System Maintenance
router.get('/system/logs', adminController.getSystemLogs);
router.get('/system/activity', adminController.getSystemActivity);
router.post('/system/backup', adminController.createBackup);
router.get('/system/backups', adminController.getBackups);
router.post('/system/restore', 
  validate(adminValidation.restoreBackup), 
  adminController.restoreBackup
);
router.post('/system/cache/clear', adminController.clearCache);
router.get('/system/health', adminController.getSystemHealth);

// Notifications Management
router.get('/notifications/templates', adminController.getNotificationTemplates);
router.put('/notifications/templates/:templateId', 
  validate(adminValidation.updateNotificationTemplate), 
  adminController.updateNotificationTemplate
);
router.post('/notifications/send', 
  validate(adminValidation.sendBulkNotification), 
  adminController.sendBulkNotification
);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/audit-logs/:logId', adminController.getAuditLogDetails);

module.exports = router;
