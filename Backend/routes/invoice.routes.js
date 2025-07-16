// routes/invoice.routes.js
const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Client invoice routes
router.get('/my-invoices', auth, invoiceController.getMyInvoices);
router.get('/:id', auth, invoiceController.getInvoiceById);
router.get('/:id/download', auth, invoiceController.downloadInvoice);
router.post('/:id/pay', auth, invoiceController.payInvoice);
router.get('/:id/payment-methods', auth, invoiceController.getPaymentMethods);

// Trainer invoice routes
router.get('/trainer/my-invoices', auth, invoiceController.getTrainerInvoices);
router.post('/trainer/create', auth, invoiceController.createInvoice);
router.put('/trainer/:id', auth, invoiceController.updateInvoice);
router.delete('/trainer/:id', auth, invoiceController.deleteInvoice);
router.post('/trainer/:id/send', auth, invoiceController.sendInvoice);

// Invoice status management
router.put('/:id/mark-paid', auth, invoiceController.markAsPaid);
router.put('/:id/mark-unpaid', auth, invoiceController.markAsUnpaid);
router.put('/:id/cancel', auth, invoiceController.cancelInvoice);
router.put('/:id/refund', auth, invoiceController.refundInvoice);

// Invoice templates
router.get('/templates', auth, invoiceController.getInvoiceTemplates);
router.post('/templates', auth, invoiceController.createInvoiceTemplate);
router.put('/templates/:id', auth, invoiceController.updateInvoiceTemplate);
router.delete('/templates/:id', auth, invoiceController.deleteInvoiceTemplate);

// Recurring invoices
router.get('/recurring', auth, invoiceController.getRecurringInvoices);
router.post('/recurring/create', auth, invoiceController.createRecurringInvoice);
router.put('/recurring/:id', auth, invoiceController.updateRecurringInvoice);
router.delete('/recurring/:id', auth, invoiceController.deleteRecurringInvoice);
router.put('/recurring/:id/pause', auth, invoiceController.pauseRecurringInvoice);
router.put('/recurring/:id/resume', auth, invoiceController.resumeRecurringInvoice);

// Payment tracking
router.get('/:id/payments', auth, invoiceController.getInvoicePayments);
router.post('/:id/payment-reminder', auth, invoiceController.sendPaymentReminder);
router.get('/overdue', auth, invoiceController.getOverdueInvoices);

// Admin invoice management
router.get('/admin/all', [auth, adminAuth], invoiceController.getAllInvoices);
router.get('/admin/statistics', [auth, adminAuth], invoiceController.getInvoiceStatistics);
router.get('/admin/revenue-report', [auth, adminAuth], invoiceController.getRevenueReport);
router.put('/admin/:id/status', [auth, adminAuth], invoiceController.updateInvoiceStatus);

// Bulk operations
router.post('/bulk/send', auth, invoiceController.bulkSendInvoices);
router.post('/bulk/mark-paid', [auth, adminAuth], invoiceController.bulkMarkAsPaid);
router.post('/bulk/export', auth, invoiceController.bulkExportInvoices);

// Invoice settings
router.get('/settings', auth, invoiceController.getInvoiceSettings);
router.put('/settings', auth, invoiceController.updateInvoiceSettings);

// Tax and accounting
router.get('/tax-summary/:year', auth, invoiceController.getTaxSummary);
router.get('/accounting-export/:year', auth, invoiceController.getAccountingExport);

// Invoice notifications
router.post('/:id/notifications/payment-due', auth, invoiceController.sendPaymentDueNotification);
router.post('/:id/notifications/overdue', auth, invoiceController.sendOverdueNotification);
router.post('/:id/notifications/thank-you', auth, invoiceController.sendThankYouNotification);

// Invoice analytics
router.get('/analytics/monthly', auth, invoiceController.getMonthlyInvoiceAnalytics);
router.get('/analytics/client-payment-behavior', auth, invoiceController.getClientPaymentBehavior);

// Invoice validation
router.post('/validate', auth, invoiceController.validateInvoiceData);

module.exports = router;
