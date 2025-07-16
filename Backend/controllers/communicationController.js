// communicationController.js
const db = require('../config/database');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const webpush = require('web-push');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

// Email configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// SMS configuration (Twilio)
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Push notification configuration
webpush.setVapidDetails(
  'mailto:' + process.env.PUSH_EMAIL,
  process.env.PUSH_PUBLIC_KEY,
  process.env.PUSH_PRIVATE_KEY
);

const communicationController = {
  // ส่ง Email
  sendEmail: async (req, res) => {
    try {
      const {
        to,
        subject,
        template,
        data,
        attachments = [],
        cc = [],
        bcc = [],
        priority = 'normal'
      } = req.body;

      // Load email template
      let htmlContent;
      let textContent;

      if (template) {
        const templatePath = path.join(__dirname, '../templates/emails', `${template}.hbs`);
        const templateContent = await fs.readFile(templatePath, 'utf8');
        const compiledTemplate = handlebars.compile(templateContent);
        htmlContent = compiledTemplate(data);
        
        // Generate text version
        textContent = htmlContent.replace(/<[^>]*>/g, '');
      } else {
        htmlContent = req.body.html;
        textContent = req.body.text;
      }

      // Send email
      const mailOptions = {
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        cc: cc.join(', '),
        bcc: bcc.join(', '),
        subject,
        text: textContent,
        html: htmlContent,
        attachments,
        priority
      };

      const info = await emailTransporter.sendMail(mailOptions);

      // Log email
      await db.execute(`
        INSERT INTO communication_logs (
          type, recipient, subject, template, status,
          message_id, sent_by, sent_at, created_at
        ) VALUES ('email', ?, ?, ?, 'sent', ?, ?, NOW(), NOW())
      `, [
        Array.isArray(to) ? to.join(', ') : to,
        subject,
        template,
        info.messageId,
        req.user.id
      ]);

      res.json({
        success: true,
        message: 'Email sent successfully',
        data: {
          messageId: info.messageId
        }
      });

    } catch (error) {
      console.error('Send email error:', error);
      
      // Log failed email
      await db.execute(`
        INSERT INTO communication_logs (
          type, recipient, subject, template, status,
          error_message, sent_by, created_at
        ) VALUES ('email', ?, ?, ?, 'failed', ?, ?, NOW())
      `, [
        req.body.to,
        req.body.subject,
        req.body.template,
        error.message,
        req.user.id
      ]);

      res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: error.message
      });
    }
  },

  // ส่ง SMS
  sendSMS: async (req, res) => {
    try {
      const {
        to,
        message,
        mediaUrl
      } = req.body;

      // Format phone number
      let phoneNumber = to;
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+66' + phoneNumber.replace(/^0/, '');
      }

      // Send SMS
      const smsOptions = {
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      };

      if (mediaUrl) {
        smsOptions.mediaUrl = [mediaUrl];
      }

      const result = await twilioClient.messages.create(smsOptions);

      // Log SMS
      await db.execute(`
        INSERT INTO communication_logs (
          type, recipient, message, status,
          message_id, sent_by, sent_at, created_at
        ) VALUES ('sms', ?, ?, 'sent', ?, ?, NOW(), NOW())
      `, [phoneNumber, message, result.sid, req.user.id]);

      res.json({
        success: true,
        message: 'SMS sent successfully',
        data: {
          sid: result.sid,
          status: result.status
        }
      });

    } catch (error) {
      console.error('Send SMS error:', error);
      
      // Log failed SMS
      await db.execute(`
        INSERT INTO communication_logs (
          type, recipient, message, status,
          error_message, sent_by, created_at
        ) VALUES ('sms', ?, ?, 'failed', ?, ?, NOW())
      `, [
        req.body.to,
        req.body.message,
        error.message,
        req.user.id
      ]);

      res.status(500).json({
        success: false,
        message: 'Failed to send SMS',
        error: error.message
      });
    }
  },

  // ส่ง Push Notification
  sendPushNotification: async (req, res) => {
    try {
      const {
        userId,
        title,
        body,
        icon,
        badge,
        data = {},
        actions = []
      } = req.body;

      // Get user's push subscriptions
      const [subscriptions] = await db.execute(
        'SELECT * FROM push_subscriptions WHERE user_id = ? AND active = 1',
        [userId]
      );

      if (subscriptions.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No active push subscriptions found for user'
        });
      }

      const payload = JSON.stringify({
        title,
        body,
        icon: icon || '/images/notification-icon.png',
        badge: badge || '/images/notification-badge.png',
        data,
        actions
      });

      const results = [];

      // Send to all user's devices
      for (const subscription of subscriptions) {
        try {
          const pushSubscription = JSON.parse(subscription.subscription);
          const result = await webpush.sendNotification(pushSubscription, payload);
          
          results.push({
            id: subscription.id,
            success: true,
            statusCode: result.statusCode
          });

        } catch (error) {
          results.push({
            id: subscription.id,
            success: false,
            error: error.message
          });

          // Remove invalid subscriptions
          if (error.statusCode === 410) {
            await db.execute(
              'UPDATE push_subscriptions SET active = 0 WHERE id = ?',
              [subscription.id]
            );
          }
        }
      }

      // Log push notification
      await db.execute(`
        INSERT INTO communication_logs (
          type, recipient, subject, message, status,
          data, sent_by, sent_at, created_at
        ) VALUES ('push', ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        userId,
        title,
        body,
        results.some(r => r.success) ? 'sent' : 'failed',
        JSON.stringify({ results, data }),
        req.user.id
      ]);

      res.json({
        success: true,
        message: 'Push notification sent',
        data: {
          sent: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results
        }
      });

    } catch (error) {
      console.error('Send push notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send push notification',
        error: error.message
      });
    }
  },

  // ส่งการแจ้งเตือนหลายช่องทาง
  sendMultiChannelNotification: async (req, res) => {
    try {
      const {
        userId,
        channels,
        title,
        message,
        data = {},
        template
      } = req.body;

      // Get user preferences and contact info
      const [users] = await db.execute(`
        SELECT u.*, np.email_enabled, np.sms_enabled, np.push_enabled
        FROM users u
        LEFT JOIN notification_preferences np ON u.id = np.user_id
        WHERE u.id = ?
      `, [userId]);

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = users[0];
      const results = {};

      // Send via email if enabled
      if (channels.includes('email') && user.email_enabled !== 0) {
        try {
          const emailData = {
            to: user.email,
            subject: title,
            template: template || 'notification',
            data: {
              ...data,
              name: user.first_name,
              title,
              message
            }
          };

          const templatePath = path.join(__dirname, '../templates/emails', `${emailData.template}.hbs`);
          const templateContent = await fs.readFile(templatePath, 'utf8');
          const compiledTemplate = handlebars.compile(templateContent);
          const htmlContent = compiledTemplate(emailData.data);

          await emailTransporter.sendMail({
            from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM}>`,
            to: emailData.to,
            subject: emailData.subject,
            html: htmlContent,
            text: htmlContent.replace(/<[^>]*>/g, '')
          });

          results.email = { success: true };
        } catch (error) {
          results.email = { success: false, error: error.message };
        }
      }

      // Send via SMS if enabled
      if (channels.includes('sms') && user.phone && user.sms_enabled !== 0) {
        try {
          let phoneNumber = user.phone;
          if (!phoneNumber.startsWith('+')) {
            phoneNumber = '+66' + phoneNumber.replace(/^0/, '');
          }

          await twilioClient.messages.create({
            body: `${title}\n\n${message}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
          });

          results.sms = { success: true };
        } catch (error) {
          results.sms = { success: false, error: error.message };
        }
      }

      // Send via push if enabled
      if (channels.includes('push') && user.push_enabled !== 0) {
        try {
          const [subscriptions] = await db.execute(
            'SELECT * FROM push_subscriptions WHERE user_id = ? AND active = 1',
            [userId]
          );

          const pushResults = [];
          const payload = JSON.stringify({
            title,
            body: message,
            data
          });

          for (const subscription of subscriptions) {
            try {
              const pushSubscription = JSON.parse(subscription.subscription);
              await webpush.sendNotification(pushSubscription, payload);
              pushResults.push({ success: true });
            } catch (error) {
              pushResults.push({ success: false, error: error.message });
            }
          }

          results.push = {
            success: pushResults.some(r => r.success),
            details: pushResults
          };
        } catch (error) {
          results.push = { success: false, error: error.message };
        }
      }

      // Save notification to database
      await db.execute(`
        INSERT INTO notifications (
          user_id, type, title, message, data,
          channels_used, status, created_at
        ) VALUES (?, 'multi_channel', ?, ?, ?, ?, 'sent', NOW())
      `, [
        userId,
        title,
        message,
        JSON.stringify(data),
        JSON.stringify(results)
      ]);

      res.json({
        success: true,
        message: 'Multi-channel notification sent',
        data: results
      });

    } catch (error) {
      console.error('Send multi-channel notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send multi-channel notification',
        error: error.message
      });
    }
  },

  // สร้าง Email Template
  createEmailTemplate: async (req, res) => {
    try {
      const {
        name,
        subject,
        html_content,
        text_content,
        category,
        variables = []
      } = req.body;

      // Check if template name already exists
      const [existing] = await db.execute(
        'SELECT id FROM email_templates WHERE name = ?',
        [name]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Template name already exists'
        });
      }

      // Save template to database
      const [result] = await db.execute(`
        INSERT INTO email_templates (
          name, subject, html_content, text_content,
          category, variables, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        name,
        subject,
        html_content,
        text_content,
        category,
        JSON.stringify(variables),
        req.user.id
      ]);

      // Save template file
      const templatePath = path.join(__dirname, '../templates/emails', `${name}.hbs`);
      await fs.writeFile(templatePath, html_content);

      res.status(201).json({
        success: true,
        message: 'Email template created successfully',
        data: { id: result.insertId }
      });

    } catch (error) {
      console.error('Create email template error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create email template',
        error: error.message
      });
    }
  },

  // ดึงรายการ Email Templates
  getEmailTemplates: async (req, res) => {
    try {
      const { category } = req.query;

      let query = 'SELECT * FROM email_templates WHERE 1=1';
      const queryParams = [];

      if (category) {
        query += ' AND category = ?';
        queryParams.push(category);
      }

      query += ' ORDER BY created_at DESC';

      const [templates] = await db.execute(query, queryParams);

      // Parse variables
      templates.forEach(template => {
        if (template.variables) {
          try {
            template.variables = JSON.parse(template.variables);
          } catch (e) {
            template.variables = [];
          }
        }
      });

      res.json({
        success: true,
        data: templates
      });

    } catch (error) {
      console.error('Get email templates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email templates',
        error: error.message
      });
    }
  },

  // Subscribe to Push Notifications
  subscribePushNotifications: async (req, res) => {
    try {
      const { subscription } = req.body;
      const userId = req.user.id;

      // Check if subscription already exists
      const endpoint = subscription.endpoint;
      const [existing] = await db.execute(
        'SELECT id FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
        [userId, endpoint]
      );

      if (existing.length > 0) {
        // Update existing subscription
        await db.execute(
          'UPDATE push_subscriptions SET subscription = ?, active = 1, updated_at = NOW() WHERE id = ?',
          [JSON.stringify(subscription), existing[0].id]
        );
      } else {
        // Create new subscription
        await db.execute(`
          INSERT INTO push_subscriptions (
            user_id, endpoint, subscription, device_info,
            active, created_at
          ) VALUES (?, ?, ?, ?, 1, NOW())
        `, [
          userId,
          endpoint,
          JSON.stringify(subscription),
          JSON.stringify({
            userAgent: req.headers['user-agent'],
            ip: req.ip
          })
        ]);
      }

      res.json({
        success: true,
        message: 'Push notification subscription saved'
      });

    } catch (error) {
      console.error('Subscribe push notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to subscribe to push notifications',
        error: error.message
      });
    }
  },

  // Unsubscribe from Push Notifications
  unsubscribePushNotifications: async (req, res) => {
    try {
      const { endpoint } = req.body;
      const userId = req.user.id;

      await db.execute(
        'UPDATE push_subscriptions SET active = 0 WHERE user_id = ? AND endpoint = ?',
        [userId, endpoint]
      );

      res.json({
        success: true,
        message: 'Unsubscribed from push notifications'
      });

    } catch (error) {
      console.error('Unsubscribe push notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unsubscribe from push notifications',
        error: error.message
      });
    }
  },

  // อัพเดท Notification Preferences
  updateNotificationPreferences: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        email_enabled,
        sms_enabled,
        push_enabled,
        email_frequency,
        quiet_hours_start,
        quiet_hours_end,
        notification_types
      } = req.body;

      // Check if preferences exist
      const [existing] = await db.execute(
        'SELECT id FROM notification_preferences WHERE user_id = ?',
        [userId]
      );

      if (existing.length > 0) {
        // Update existing preferences
        const updateFields = [];
        const updateValues = [];

        if (email_enabled !== undefined) {
          updateFields.push('email_enabled = ?');
          updateValues.push(email_enabled);
        }

        if (sms_enabled !== undefined) {
          updateFields.push('sms_enabled = ?');
          updateValues.push(sms_enabled);
        }

        if (push_enabled !== undefined) {
          updateFields.push('push_enabled = ?');
          updateValues.push(push_enabled);
        }

        if (email_frequency !== undefined) {
          updateFields.push('email_frequency = ?');
          updateValues.push(email_frequency);
        }

        if (quiet_hours_start !== undefined) {
          updateFields.push('quiet_hours_start = ?');
          updateValues.push(quiet_hours_start);
        }

        if (quiet_hours_end !== undefined) {
          updateFields.push('quiet_hours_end = ?');
          updateValues.push(quiet_hours_end);
        }

        if (notification_types !== undefined) {
          updateFields.push('notification_types = ?');
          updateValues.push(JSON.stringify(notification_types));
        }

        updateFields.push('updated_at = NOW()');
        updateValues.push(userId);

        await db.execute(
          `UPDATE notification_preferences SET ${updateFields.join(', ')} WHERE user_id = ?`,
          updateValues
        );
      } else {
        // Create new preferences
        await db.execute(`
          INSERT INTO notification_preferences (
            user_id, email_enabled, sms_enabled, push_enabled,
            email_frequency, quiet_hours_start, quiet_hours_end,
            notification_types, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          userId,
          email_enabled !== undefined ? email_enabled : 1,
          sms_enabled !== undefined ? sms_enabled : 1,
          push_enabled !== undefined ? push_enabled : 1,
          email_frequency || 'instant',
          quiet_hours_start || '22:00',
          quiet_hours_end || '08:00',
          JSON.stringify(notification_types || [])
        ]);
      }

      res.json({
        success: true,
        message: 'Notification preferences updated successfully'
      });

    } catch (error) {
      console.error('Update notification preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification preferences',
        error: error.message
      });
    }
  },

  // ดึงประวัติการส่งข้อความ
  getCommunicationHistory: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        status,
        recipient,
        dateFrom,
        dateTo
      } = req.query;

      const offset = (page - 1) * limit;

      let query = `
        SELECT cl.*,
               u.first_name as sender_name,
               u.last_name as sender_lastname
        FROM communication_logs cl
        LEFT JOIN users u ON cl.sent_by = u.id
        WHERE 1=1
      `;

      const queryParams = [];

      if (type) {
        query += ` AND cl.type = ?`;
        queryParams.push(type);
      }

      if (status) {
        query += ` AND cl.status = ?`;
        queryParams.push(status);
      }

      if (recipient) {
        query += ` AND cl.recipient LIKE ?`;
        queryParams.push(`%${recipient}%`);
      }

      if (dateFrom) {
        query += ` AND cl.sent_at >= ?`;
        queryParams.push(dateFrom);
      }

      if (dateTo) {
        query += ` AND cl.sent_at <= ?`;
        queryParams.push(dateTo);
      }

      query += ` ORDER BY cl.created_at DESC LIMIT ? OFFSET ?`;
      queryParams.push(parseInt(limit), parseInt(offset));

      const [logs] = await db.execute(query, queryParams);

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM communication_logs cl WHERE 1=1`;
      const countParams = [];

      if (type) {
        countQuery += ` AND cl.type = ?`;
        countParams.push(type);
      }

      if (status) {
        countQuery += ` AND cl.status = ?`;
        countParams.push(status);
      }

      if (recipient) {
        countQuery += ` AND cl.recipient LIKE ?`;
        countParams.push(`%${recipient}%`);
      }

      if (dateFrom) {
        countQuery += ` AND cl.sent_at >= ?`;
        countParams.push(dateFrom);
      }

      if (dateTo) {
        countQuery += ` AND cl.sent_at <= ?`;
        countParams.push(dateTo);
      }

      const [countResult] = await db.execute(countQuery, countParams);

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
      console.error('Get communication history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch communication history',
        error: error.message
      });
    }
  },

  // ส่ง Bulk Email
  sendBulkEmail: async (req, res) => {
    try {
      const {
        recipients,
        subject,
        template,
        data,
        schedule_at
      } = req.body;

      // Create email campaign
      const [campaignResult] = await db.execute(`
        INSERT INTO email_campaigns (
          name, subject, template, recipients_count,
          status, scheduled_at, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        subject,
        subject,
        template,
        recipients.length,
        schedule_at ? 'scheduled' : 'processing',
        schedule_at,
        req.user.id
      ]);

      const campaignId = campaignResult.insertId;

      if (schedule_at) {
        // Schedule for later
        for (const recipient of recipients) {
          await db.execute(`
            INSERT INTO email_queue (
              campaign_id, recipient_email, data,
              status, scheduled_at, created_at
            ) VALUES (?, ?, ?, 'pending', ?, NOW())
          `, [campaignId, recipient.email, JSON.stringify({ ...data, ...recipient }), schedule_at]);
        }

        res.json({
          success: true,
          message: `Bulk email scheduled for ${recipients.length} recipients`,
          data: { campaign_id: campaignId }
        });
      } else {
        // Send immediately
        let sent = 0;
        let failed = 0;

        for (const recipient of recipients) {
          try {
            const templatePath = path.join(__dirname, '../templates/emails', `${template}.hbs`);
            const templateContent = await fs.readFile(templatePath, 'utf8');
            const compiledTemplate = handlebars.compile(templateContent);
            const htmlContent = compiledTemplate({ ...data, ...recipient });

            await emailTransporter.sendMail({
              from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM}>`,
              to: recipient.email,
              subject,
              html: htmlContent,
              text: htmlContent.replace(/<[^>]*>/g, '')
            });

            sent++;

            await db.execute(`
              INSERT INTO email_queue (
                campaign_id, recipient_email, data,
                status, sent_at, created_at
              ) VALUES (?, ?, ?, 'sent', NOW(), NOW())
            `, [campaignId, recipient.email, JSON.stringify({ ...data, ...recipient })]);

          } catch (error) {
            failed++;

            await db.execute(`
              INSERT INTO email_queue (
                campaign_id, recipient_email, data,
                status, error_message, created_at
              ) VALUES (?, ?, ?, 'failed', ?, NOW())
            `, [campaignId, recipient.email, JSON.stringify({ ...data, ...recipient }), error.message]);
          }

          // Delay between emails to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Update campaign status
        await db.execute(
          'UPDATE email_campaigns SET status = "completed", sent_count = ?, failed_count = ?, completed_at = NOW() WHERE id = ?',
          [sent, failed, campaignId]
        );

        res.json({
          success: true,
          message: 'Bulk email sent',
          data: {
            campaign_id: campaignId,
            sent,
            failed,
            total: recipients.length
          }
        });
      }

    } catch (error) {
      console.error('Send bulk email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send bulk email',
        error: error.message
      });
    }
  },

  // ดึงสถิติการส่งข้อความ
  getCommunicationStatistics: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      let dateFilter = '';
      const queryParams = [];

      if (startDate && endDate) {
        dateFilter = ' AND sent_at BETWEEN ? AND ?';
        queryParams.push(startDate, endDate);
      }

      // Communication by type
      const [byType] = await db.execute(`
        SELECT type,
               COUNT(*) as total,
               SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
               SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM communication_logs
        WHERE 1=1 ${dateFilter}
        GROUP BY type
      `, queryParams);

      // Daily volume
      const [dailyVolume] = await db.execute(`
        SELECT DATE(sent_at) as date,
               type,
               COUNT(*) as count
        FROM communication_logs
        WHERE status = 'sent' ${dateFilter}
        GROUP BY DATE(sent_at), type
        ORDER BY date DESC
        LIMIT 30
      `, queryParams);

      // Email open rates (if tracking enabled)
      const [emailStats] = await db.execute(`
        SELECT 
          COUNT(*) as total_sent,
          SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as opened,
          SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) as clicked
        FROM communication_logs
        WHERE type = 'email' AND status = 'sent' ${dateFilter}
      `, queryParams);

      // Top templates
      const [topTemplates] = await db.execute(`
        SELECT template,
               COUNT(*) as usage_count,
               SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as success_count
        FROM communication_logs
        WHERE template IS NOT NULL ${dateFilter}
        GROUP BY template
        ORDER BY usage_count DESC
        LIMIT 10
      `, queryParams);

      res.json({
        success: true,
        data: {
          byType,
          dailyVolume,
          emailStats: emailStats[0],
          topTemplates
        }
      });

    } catch (error) {
      console.error('Get communication statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch communication statistics',
        error: error.message
      });
    }
  }
};

module.exports = communicationController;
