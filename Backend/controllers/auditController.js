// auditController.js
const db = require('../config/database');
const { validationResult } = require('express-validator');
const geoip = require('geoip-lite');
const useragent = require('useragent');

const auditController = {
  // บันทึก Audit Log
  createAuditLog: async (userId, action, entity, entityId, details, request) => {
    try {
      // Extract request information
      const ip = request.ip || request.connection.remoteAddress;
      const userAgent = request.headers['user-agent'];
      const parsedUA = useragent.parse(userAgent);
      const geo = geoip.lookup(ip);

      const deviceInfo = {
        browser: parsedUA.toAgent(),
        os: parsedUA.os.toString(),
        device: parsedUA.device.toString()
      };

      const locationInfo = geo ? {
        country: geo.country,
        region: geo.region,
        city: geo.city,
        timezone: geo.timezone
      } : null;

      await db.execute(`
        INSERT INTO audit_logs (
          user_id, action, entity_type, entity_id,
          details, ip_address, user_agent,
          device_info, location_info, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        userId,
        action,
        entity,
        entityId,
        JSON.stringify(details || {}),
        ip,
        userAgent,
        JSON.stringify(deviceInfo),
        JSON.stringify(locationInfo)
      ]);

      return true;

    } catch (error) {
      console.error('Create audit log error:', error);
      return false;
    }
  },

  // ดึงรายการ Audit Logs
  getAuditLogs: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        userId,
        action,
        entityType,
        dateFrom,
        dateTo,
        search = '',
        sortBy = 'created_at',
        order = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;

      let query = `
        SELECT al.*,
               u.first_name, u.last_name, u.email, u.role
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;

      const queryParams = [];

      // User filter
      if (userId) {
        query += ` AND al.user_id = ?`;
        queryParams.push(userId);
      }

      // Action filter
      if (action) {
        query += ` AND al.action = ?`;
        queryParams.push(action);
      }

      // Entity type filter
      if (entityType) {
        query += ` AND al.entity_type = ?`;
        queryParams.push(entityType);
      }

      // Date range filter
      if (dateFrom) {
        query += ` AND al.created_at >= ?`;
        queryParams.push(dateFrom);
      }

      if (dateTo) {
        query += ` AND al.created_at <= ?`;
        queryParams.push(dateTo);
      }

      // Search filter
      if (search) {
        query += ` AND (al.details LIKE ? OR u.email LIKE ? OR al.ip_address LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Sorting
      const allowedSortFields = ['created_at', 'action', 'entity_type'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
      query += ` ORDER BY al.${sortField} ${order === 'ASC' ? 'ASC' : 'DESC'}`;

      // Pagination
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(parseInt(limit), parseInt(offset));

      // Execute main query
      const [logs] = await db.execute(query, queryParams);

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM audit_logs al WHERE 1=1`;
      const countParams = [];

      if (userId) {
        countQuery += ` AND al.user_id = ?`;
        countParams.push(userId);
      }

      if (action) {
        countQuery += ` AND al.action = ?`;
        countParams.push(action);
      }

      if (entityType) {
        countQuery += ` AND al.entity_type = ?`;
        countParams.push(entityType);
      }

      if (dateFrom) {
        countQuery += ` AND al.created_at >= ?`;
        countParams.push(dateFrom);
      }

      if (dateTo) {
        countQuery += ` AND al.created_at <= ?`;
        countParams.push(dateTo);
      }

      if (search) {
        countQuery += ` AND al.details LIKE ?`;
        countParams.push(`%${search}%`);
      }

      const [countResult] = await db.execute(countQuery, countParams);
      const totalLogs = countResult[0].total;

      // Process JSON fields
      logs.forEach(log => {
        if (log.details) {
          try {
            log.details = JSON.parse(log.details);
          } catch (e) {
            log.details = {};
          }
        }
        if (log.device_info) {
          try {
            log.device_info = JSON.parse(log.device_info);
          } catch (e) {
            log.device_info = {};
          }
        }
        if (log.location_info) {
          try {
            log.location_info = JSON.parse(log.location_info);
          } catch (e) {
            log.location_info = {};
          }
        }
      });

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalLogs / limit),
            totalItems: totalLogs,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs',
        error: error.message
      });
    }
  },

  // ดึง Activity Log ของผู้ใช้
  getUserActivityLog: async (req, res) => {
    try {
      const { userId } = req.params;
      const { days = 30 } = req.query;

      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      const [activities] = await db.execute(`
        SELECT action, entity_type, entity_id, details,
               ip_address, device_info, location_info, created_at
        FROM audit_logs
        WHERE user_id = ? AND created_at >= ?
        ORDER BY created_at DESC
        LIMIT 100
      `, [userId, dateLimit]);

      // Process JSON fields
      activities.forEach(activity => {
        if (activity.details) {
          try {
            activity.details = JSON.parse(activity.details);
          } catch (e) {
            activity.details = {};
          }
        }
        if (activity.device_info) {
          try {
            activity.device_info = JSON.parse(activity.device_info);
          } catch (e) {
            activity.device_info = {};
          }
        }
        if (activity.location_info) {
          try {
            activity.location_info = JSON.parse(activity.location_info);
          } catch (e) {
            activity.location_info = {};
          }
        }
      });

      res.json({
        success: true,
        data: activities
      });

    } catch (error) {
      console.error('Get user activity log error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user activity log',
        error: error.message
      });
    }
  },

  // ดึง Login History
  getLoginHistory: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        userId,
        status,
        dateFrom,
        dateTo
      } = req.query;

      const offset = (page - 1) * limit;

      let query = `
        SELECT lh.*,
               u.first_name, u.last_name, u.email, u.role
        FROM login_history lh
        JOIN users u ON lh.user_id = u.id
        WHERE 1=1
      `;

      const queryParams = [];

      if (userId) {
        query += ` AND lh.user_id = ?`;
        queryParams.push(userId);
      }

      if (status) {
        query += ` AND lh.status = ?`;
        queryParams.push(status);
      }

      if (dateFrom) {
        query += ` AND lh.login_time >= ?`;
        queryParams.push(dateFrom);
      }

      if (dateTo) {
        query += ` AND lh.login_time <= ?`;
        queryParams.push(dateTo);
      }

      query += ` ORDER BY lh.login_time DESC LIMIT ? OFFSET ?`;
      queryParams.push(parseInt(limit), parseInt(offset));

      const [loginHistory] = await db.execute(query, queryParams);

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM login_history lh WHERE 1=1`;
      const countParams = [];

      if (userId) {
        countQuery += ` AND lh.user_id = ?`;
        countParams.push(userId);
      }

      if (status) {
        countQuery += ` AND lh.status = ?`;
        countParams.push(status);
      }

      if (dateFrom) {
        countQuery += ` AND lh.login_time >= ?`;
        countParams.push(dateFrom);
      }

      if (dateTo) {
        countQuery += ` AND lh.login_time <= ?`;
        countParams.push(dateTo);
      }

      const [countResult] = await db.execute(countQuery, countParams);

      // Process JSON fields
      loginHistory.forEach(entry => {
        if (entry.device_info) {
          try {
            entry.device_info = JSON.parse(entry.device_info);
          } catch (e) {
            entry.device_info = {};
          }
        }
        if (entry.location_info) {
          try {
            entry.location_info = JSON.parse(entry.location_info);
          } catch (e) {
            entry.location_info = {};
          }
        }
      });

      res.json({
        success: true,
        data: {
          loginHistory,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(countResult[0].total / limit),
            totalItems: countResult[0].total,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get login history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch login history',
        error: error.message
      });
    }
  },

  // บันทึก Login Attempt
  recordLoginAttempt: async (email, success, request, userId = null) => {
    try {
      const ip = request.ip || request.connection.remoteAddress;
      const userAgent = request.headers['user-agent'];
      const parsedUA = useragent.parse(userAgent);
      const geo = geoip.lookup(ip);

      const deviceInfo = {
        browser: parsedUA.toAgent(),
        os: parsedUA.os.toString(),
        device: parsedUA.device.toString()
      };

      const locationInfo = geo ? {
        country: geo.country,
        region: geo.region,
        city: geo.city,
        timezone: geo.timezone
      } : null;

      await db.execute(`
        INSERT INTO login_history (
          user_id, email, status, ip_address,
          user_agent, device_info, location_info,
          login_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        userId,
        email,
        success ? 'success' : 'failed',
        ip,
        userAgent,
        JSON.stringify(deviceInfo),
        JSON.stringify(locationInfo)
      ]);

      // Check for suspicious activity
      if (!success) {
        const [recentFailures] = await db.execute(`
          SELECT COUNT(*) as count
          FROM login_history
          WHERE email = ? AND status = 'failed'
            AND login_time >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        `, [email]);

        if (recentFailures[0].count >= 5) {
          // Log security alert
          await db.execute(`
            INSERT INTO security_alerts (
              type, severity, description, details, created_at
            ) VALUES ('multiple_failed_logins', 'high', ?, ?, NOW())
          `, [
            `Multiple failed login attempts for ${email}`,
            JSON.stringify({
              email,
              attempts: recentFailures[0].count,
              ip_address: ip,
              location: locationInfo
            })
          ]);
        }
      }

      return true;

    } catch (error) {
      console.error('Record login attempt error:', error);
      return false;
    }
  },

  // ดึง System Logs
  getSystemLogs: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        level,
        category,
        dateFrom,
        dateTo,
        search = ''
      } = req.query;

      const offset = (page - 1) * limit;

      let query = `
        SELECT * FROM system_logs
        WHERE 1=1
      `;

      const queryParams = [];

      if (level) {
        query += ` AND level = ?`;
        queryParams.push(level);
      }

      if (category) {
        query += ` AND category = ?`;
        queryParams.push(category);
      }

      if (dateFrom) {
        query += ` AND created_at >= ?`;
        queryParams.push(dateFrom);
      }

      if (dateTo) {
        query += ` AND created_at <= ?`;
        queryParams.push(dateTo);
      }

      if (search) {
        query += ` AND (message LIKE ? OR details LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      queryParams.push(parseInt(limit), parseInt(offset));

      const [logs] = await db.execute(query, queryParams);

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM system_logs WHERE 1=1`;
      const countParams = [];

      if (level) {
        countQuery += ` AND level = ?`;
        countParams.push(level);
      }

      if (category) {
        countQuery += ` AND category = ?`;
        countParams.push(category);
      }

      if (dateFrom) {
        countQuery += ` AND created_at >= ?`;
        countParams.push(dateFrom);
      }

      if (dateTo) {
        countQuery += ` AND created_at <= ?`;
        countParams.push(dateTo);
      }

      if (search) {
        countQuery += ` AND (message LIKE ? OR details LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`);
      }

      const [countResult] = await db.execute(countQuery, countParams);

      // Process JSON fields
      logs.forEach(log => {
        if (log.details) {
          try {
            log.details = JSON.parse(log.details);
          } catch (e) {
            log.details = {};
          }
        }
      });

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(countResult[0].total / limit),
            totalItems: countResult[0].total,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get system logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system logs',
        error: error.message
      });
    }
  },

  // บันทึก System Log
  logSystemEvent: async (level, category, message, details = {}) => {
    try {
      await db.execute(`
        INSERT INTO system_logs (
          level, category, message, details, created_at
        ) VALUES (?, ?, ?, ?, NOW())
      `, [level, category, message, JSON.stringify(details)]);

      return true;

    } catch (error) {
      console.error('Log system event error:', error);
      return false;
    }
  },

  // ดึง Security Alerts
  getSecurityAlerts: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        severity,
        resolved,
        type
      } = req.query;

      const offset = (page - 1) * limit;

      let query = `
        SELECT sa.*,
               u.first_name as resolved_by_name,
               u.last_name as resolved_by_lastname
        FROM security_alerts sa
        LEFT JOIN users u ON sa.resolved_by = u.id
        WHERE 1=1
      `;

      const queryParams = [];

      if (severity) {
        query += ` AND sa.severity = ?`;
        queryParams.push(severity);
      }

      if (resolved !== undefined) {
        query += ` AND sa.resolved = ?`;
        queryParams.push(resolved === 'true' ? 1 : 0);
      }

      if (type) {
        query += ` AND sa.type = ?`;
        queryParams.push(type);
      }

      query += ` ORDER BY sa.created_at DESC LIMIT ? OFFSET ?`;
      queryParams.push(parseInt(limit), parseInt(offset));

      const [alerts] = await db.execute(query, queryParams);

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM security_alerts sa WHERE 1=1`;
      const countParams = [];

      if (severity) {
        countQuery += ` AND sa.severity = ?`;
        countParams.push(severity);
      }

      if (resolved !== undefined) {
        countQuery += ` AND sa.resolved = ?`;
        countParams.push(resolved === 'true' ? 1 : 0);
      }

      if (type) {
        countQuery += ` AND sa.type = ?`;
        countParams.push(type);
      }

      const [countResult] = await db.execute(countQuery, countParams);

      // Process JSON fields
      alerts.forEach(alert => {
        if (alert.details) {
          try {
            alert.details = JSON.parse(alert.details);
          } catch (e) {
            alert.details = {};
          }
        }
      });

      res.json({
        success: true,
        data: {
          alerts,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(countResult[0].total / limit),
            totalItems: countResult[0].total,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get security alerts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch security alerts',
        error: error.message
      });
    }
  },

  // Resolve Security Alert
  resolveSecurityAlert: async (req, res) => {
    try {
      const { id } = req.params;
      const { resolution_notes } = req.body;
      const resolvedBy = req.user.id;

      await db.execute(`
        UPDATE security_alerts
        SET resolved = 1,
            resolved_by = ?,
            resolved_at = NOW(),
            resolution_notes = ?
        WHERE id = ?
      `, [resolvedBy, resolution_notes, id]);

      res.json({
        success: true,
        message: 'Security alert resolved successfully'
      });

    } catch (error) {
      console.error('Resolve security alert error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve security alert',
        error: error.message
      });
    }
  },

  // Export Audit Logs
  exportAuditLogs: async (req, res) => {
    try {
      const {
        format = 'csv',
        dateFrom,
        dateTo,
        userId,
        action,
        entityType
      } = req.query;

      let query = `
        SELECT al.*,
               u.first_name, u.last_name, u.email
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;

      const queryParams = [];

      if (userId) {
        query += ` AND al.user_id = ?`;
        queryParams.push(userId);
      }

      if (action) {
        query += ` AND al.action = ?`;
        queryParams.push(action);
      }

      if (entityType) {
        query += ` AND al.entity_type = ?`;
        queryParams.push(entityType);
      }

      if (dateFrom) {
        query += ` AND al.created_at >= ?`;
        queryParams.push(dateFrom);
      }

      if (dateTo) {
        query += ` AND al.created_at <= ?`;
        queryParams.push(dateTo);
      }

      query += ` ORDER BY al.created_at DESC`;

      const [logs] = await db.execute(query, queryParams);

      if (format === 'csv') {
        // Generate CSV
        const csv = [
          'Date,User,Email,Action,Entity Type,Entity ID,IP Address,Location',
          ...logs.map(log => {
            const location = log.location_info ? JSON.parse(log.location_info) : {};
            return `"${log.created_at}","${log.first_name} ${log.last_name}","${log.email}","${log.action}","${log.entity_type}","${log.entity_id}","${log.ip_address}","${location.city || ''}, ${location.country || ''}"`;
          })
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
        res.send(csv);

      } else if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.json');
        res.json(logs);
      }

    } catch (error) {
      console.error('Export audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export audit logs',
        error: error.message
      });
    }
  },

  // Compliance Report
  generateComplianceReport: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      // User access summary
      const [userAccess] = await db.execute(`
        SELECT u.role, COUNT(DISTINCT al.user_id) as user_count,
               COUNT(al.id) as action_count
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        WHERE al.created_at BETWEEN ? AND ?
        GROUP BY u.role
      `, [startDate, endDate]);

      // Data access patterns
      const [dataAccess] = await db.execute(`
        SELECT entity_type, action, COUNT(*) as count
        FROM audit_logs
        WHERE created_at BETWEEN ? AND ?
          AND action IN ('view', 'create', 'update', 'delete')
        GROUP BY entity_type, action
      `, [startDate, endDate]);

      // Failed login attempts
      const [failedLogins] = await db.execute(`
        SELECT COUNT(*) as total_failures,
               COUNT(DISTINCT email) as unique_emails,
               COUNT(DISTINCT ip_address) as unique_ips
        FROM login_history
        WHERE status = 'failed'
          AND login_time BETWEEN ? AND ?
      `, [startDate, endDate]);

      // Security alerts
      const [securityAlerts] = await db.execute(`
        SELECT severity, COUNT(*) as count,
               SUM(CASE WHEN resolved = 1 THEN 1 ELSE 0 END) as resolved
        FROM security_alerts
        WHERE created_at BETWEEN ? AND ?
        GROUP BY severity
      `, [startDate, endDate]);

      // Data modifications
      const [dataModifications] = await db.execute(`
        SELECT DATE(created_at) as date,
               COUNT(CASE WHEN action = 'create' THEN 1 END) as creates,
               COUNT(CASE WHEN action = 'update' THEN 1 END) as updates,
               COUNT(CASE WHEN action = 'delete' THEN 1 END) as deletes
        FROM audit_logs
        WHERE created_at BETWEEN ? AND ?
          AND action IN ('create', 'update', 'delete')
        GROUP BY DATE(created_at)
      `, [startDate, endDate]);

      res.json({
        success: true,
        data: {
          period: {
            start: startDate,
            end: endDate
          },
          userAccess,
          dataAccess,
          failedLogins: failedLogins[0],
          securityAlerts,
          dataModifications
        }
      });

    } catch (error) {
      console.error('Generate compliance report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate compliance report',
        error: error.message
      });
    }
  },

  // Cleanup old logs
  cleanupOldLogs: async (req, res) => {
    try {
      const { days = 90, type = 'audit' } = req.body;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      let deletedCount = 0;

      if (type === 'audit' || type === 'all') {
        const [result] = await db.execute(
          'DELETE FROM audit_logs WHERE created_at < ?',
          [cutoffDate]
        );
        deletedCount += result.affectedRows;
      }

      if (type === 'login' || type === 'all') {
        const [result] = await db.execute(
          'DELETE FROM login_history WHERE login_time < ?',
          [cutoffDate]
        );
        deletedCount += result.affectedRows;
      }

      if (type === 'system' || type === 'all') {
        const [result] = await db.execute(
          'DELETE FROM system_logs WHERE created_at < ?',
          [cutoffDate]
        );
        deletedCount += result.affectedRows;
      }

      // Log the cleanup action
      await this.logSystemEvent('info', 'maintenance', 'Log cleanup performed', {
        type,
        days,
        deleted_count: deletedCount
      });

      res.json({
        success: true,
        message: `Cleaned up ${deletedCount} log entries older than ${days} days`
      });

    } catch (error) {
      console.error('Cleanup old logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup old logs',
        error: error.message
      });
    }
  }
};

module.exports = auditController;
