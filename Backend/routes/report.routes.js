// routes/report.routes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Client reports
router.get('/client/fitness-summary', auth, reportController.getClientFitnessSummary);
router.get('/client/progress-report', auth, reportController.getClientProgressReport);
router.get('/client/workout-summary/:period', auth, reportController.getClientWorkoutSummary);
router.get('/client/nutrition-report/:period', auth, reportController.getClientNutritionReport);

// Trainer reports
router.get('/trainer/client-overview', auth, reportController.getTrainerClientOverview);
router.get('/trainer/revenue-report/:period', auth, reportController.getTrainerRevenueReport);
router.get('/trainer/session-report/:period', auth, reportController.getTrainerSessionReport);
router.get('/trainer/client-progress/:clientId', auth, reportController.getClientProgressForTrainer);
router.get('/trainer/performance-metrics', auth, reportController.getTrainerPerformanceMetrics);

// Admin reports
router.get('/admin/platform-overview', [auth, adminAuth], reportController.getPlatformOverview);
router.get('/admin/user-analytics', [auth, adminAuth], reportController.getUserAnalytics);
router.get('/admin/revenue-analytics', [auth, adminAuth], reportController.getRevenueAnalytics);
router.get('/admin/trainer-performance', [auth, adminAuth], reportController.getTrainerPerformanceReport);
router.get('/admin/client-engagement', [auth, adminAuth], reportController.getClientEngagementReport);

// Financial reports
router.get('/admin/financial/monthly/:year/:month', [auth, adminAuth], reportController.getMonthlyFinancialReport);
router.get('/admin/financial/quarterly/:year/:quarter', [auth, adminAuth], reportController.getQuarterlyFinancialReport);
router.get('/admin/financial/yearly/:year', [auth, adminAuth], reportController.getYearlyFinancialReport);
router.get('/admin/financial/tax-summary/:year', [auth, adminAuth], reportController.getTaxSummaryReport);

// Usage reports
router.get('/admin/usage/app-usage', [auth, adminAuth], reportController.getAppUsageReport);
router.get('/admin/usage/feature-usage', [auth, adminAuth], reportController.getFeatureUsageReport);
router.get('/admin/usage/session-analytics', [auth, adminAuth], reportController.getSessionAnalyticsReport);

// Marketing reports
router.get('/admin/marketing/conversion', [auth, adminAuth], reportController.getConversionReport);
router.get('/admin/marketing/user-acquisition', [auth, adminAuth], reportController.getUserAcquisitionReport);
router.get('/admin/marketing/retention', [auth, adminAuth], reportController.getRetentionReport);

// Operational reports
router.get('/admin/operational/booking-trends', [auth, adminAuth], reportController.getBookingTrendsReport);
router.get('/admin/operational/cancellation-analysis', [auth, adminAuth], reportController.getCancellationAnalysisReport);
router.get('/admin/operational/support-tickets', [auth, adminAuth], reportController.getSupportTicketsReport);

// Custom reports
router.post('/admin/custom/create', [auth, adminAuth], reportController.createCustomReport);
router.get('/admin/custom/templates', [auth, adminAuth], reportController.getCustomReportTemplates);
router.get('/admin/custom/:reportId', [auth, adminAuth], reportController.getCustomReport);
router.put('/admin/custom/:reportId', [auth, adminAuth], reportController.updateCustomReport);
router.delete('/admin/custom/:reportId', [auth, adminAuth], reportController.deleteCustomReport);

// Report scheduling
router.get('/admin/scheduled', [auth, adminAuth], reportController.getScheduledReports);
router.post('/admin/schedule', [auth, adminAuth], reportController.scheduleReport);
router.put('/admin/schedule/:scheduleId', [auth, adminAuth], reportController.updateScheduledReport);
router.delete('/admin/schedule/:scheduleId', [auth, adminAuth], reportController.deleteScheduledReport);

// Report export
router.get('/export/pdf/:reportType', auth, reportController.exportReportPdf);
router.get('/export/excel/:reportType', auth, reportController.exportReportExcel);
router.get('/export/csv/:reportType', auth, reportController.exportReportCsv);

// Report sharing
router.post('/share/:reportId', auth, reportController.shareReport);
router.get('/shared/:shareToken', reportController.getSharedReport);
router.delete('/share/:shareId', auth, reportController.removeSharedReport);

// Report notifications
router.get('/notifications', auth, reportController.getReportNotifications);
router.post('/notifications/subscribe', auth, reportController.subscribeToReportNotifications);
router.delete('/notifications/unsubscribe/:subscriptionId', auth, reportController.unsubscribeFromReportNotifications);

// Report history
router.get('/history', auth, reportController.getReportHistory);
router.get('/history/:reportId/versions', auth, reportController.getReportVersions);

// Benchmarking reports
router.get('/admin/benchmarks/industry', [auth, adminAuth], reportController.getIndustryBenchmarks);
router.get('/admin/benchmarks/competitor', [auth, adminAuth], reportController.getCompetitorBenchmarks);

module.exports = router;
