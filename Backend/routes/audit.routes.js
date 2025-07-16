// routes/audit.routes.js
const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Admin only routes
router.get('/logs', [auth, adminAuth], auditController.getAuditLogs);
router.get('/logs/:id', [auth, adminAuth], auditController.getAuditLogById);
router.get('/user/:userId', [auth, adminAuth], auditController.getUserAuditLogs);
router.get('/trainer/:trainerId', [auth, adminAuth], auditController.getTrainerAuditLogs);

// Activity logs
router.get('/activities', [auth, adminAuth], auditController.getActivityLogs);
router.get('/activities/user/:userId', [auth, adminAuth], auditController.getUserActivities);
router.get('/activities/trainer/:trainerId', [auth, adminAuth], auditController.getTrainerActivities);

// System logs
router.get('/system', [auth, adminAuth], auditController.getSystemLogs);
router.get('/system/errors', [auth, adminAuth], auditController.getErrorLogs);
router.get('/system/warnings', [auth, adminAuth], auditController.getWarningLogs);

// Security logs
router.get('/security', [auth, adminAuth], auditController.getSecurityLogs);
router.get('/security/failed-logins', [auth, adminAuth], auditController.getFailedLogins);
router.get('/security/suspicious', [auth, adminAuth], auditController.getSuspiciousActivities);

// Login history
router.get('/login-history', [auth, adminAuth], auditController.getLoginHistory);
router.get('/login-history/user/:userId', [auth, adminAuth], auditController.getUserLoginHistory);

// Data changes
router.get('/data-changes', [auth, adminAuth], auditController.getDataChanges);
router.get('/data-changes/table/:tableName', [auth, adminAuth], auditController.getTableChanges);

// Export logs
router.get('/export', [auth, adminAuth], auditController.exportAuditLogs);

// User own audit logs
router.get('/my-activities', auth, auditController.getMyActivities);

module.exports = router;
