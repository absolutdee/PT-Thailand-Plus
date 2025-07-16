// utils/notificationUtils.js
const db = require('../config/database');
const { sendEmail } = require('./emailUtils');
const { sendSMS } = require('./smsUtils');
const { sendPushNotification } = require('./pushUtils');

const notificationUtils = {
  // Send notification through multiple channels
  sendNotification: async (userId, notification) => {
    const {
      title,
      message,
      type,
      priority = 'normal',
      data = {},
      channels = ['in_app']
    } = notification;

    // Get user notification preferences
    const [preferences] = await db.execute(`
      SELECT np.*, u.email, u.phone
      FROM users u
      LEFT JOIN notification_preferences np ON u.id = np.user_id
      WHERE u.id = ?
    `, [userId]);

    if (preferences.length === 0) {
      throw new Error('User not found');
    }

    const userPref = preferences[0];
    const results = {};

    // Check if notification type is enabled for user
    if (userPref.notification_types) {
      const enabledTypes = JSON.parse(userPref.notification_types);
      if (!enabledTypes.includes(type)) {
        return { success: false, message: 'Notification type disabled by user' };
      }
    }

    // Check quiet hours
    if (userPref.quiet_hours_start && userPref.quiet_hours_end) {
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();
      const quietStart = parseInt(userPref.quiet_hours_start.replace(':', ''));
      const quietEnd = parseInt(userPref.quiet_hours_end.replace(':', ''));

      if (currentTime >= quietStart || currentTime <= quietEnd) {
        if (priority !== 'urgent') {
          // Queue notification for later
          await notificationUtils.queueNotification(userId, notification);
          return { success: true, message: 'Notification queued for quiet hours' };
        }
      }
    }

    // Send through requested channels
    if (channels.includes('in_app')) {
      results.in_app = await notificationUtils.createInAppNotification(userId, {
        title,
        message,
        type,
        priority,
        data
      });
    }

    if (channels.includes('email') && userPref.email_enabled) {
      results.email = await notificationUtils.sendEmailNotification(
        userPref.email,
        title,
        message,
        type,
        data
      );
    }

    if (channels.includes('sms') && userPref.phone && userPref.sms_enabled) {
      results.sms = await notificationUtils.sendSMSNotification(
        userPref.phone,
        `${title}: ${message}`
      );
    }

    if (channels.includes('push') && userPref.push_enabled) {
      results.push = await notificationUtils.sendPushNotification(
        userId,
        title,
        message,
        data
      );
    }

    return {
      success: true,
      results
    };
  },

  // Create in-app notification
  createInAppNotification: async (userId, notification) => {
    try {
      const [result] = await db.execute(`
        INSERT INTO notifications (
          user_id, type, title, message, 
          priority, data, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'unread', NOW())
      `, [
        userId,
        notification.type,
        notification.title,
        notification.message,
        notification.priority,
        JSON.stringify(notification.data || {})
      ]);

      // Emit real-time notification if socket connected
      const io = global.io;
      if (io) {
        const userSocket = global.userSockets[userId];
        if (userSocket) {
          io.to(userSocket).emit('notification', {
            id: result.insertId,
            ...notification,
            created_at: new Date()
          });
        }
      }

      return { success: true, id: result.insertId };
    } catch (error) {
      console.error('Create in-app notification error:', error);
      return { success: false, error: error.message };
    }
  },

  // Send email notification
  sendEmailNotification: async (email, title, message, type, data) => {
    try {
      const template = notificationUtils.getEmailTemplate(type);
      
      await sendEmail({
        to: email,
        subject: title,
        template,
        data: {
          title,
          message,
          ...data
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Send email notification error:', error);
      return { success: false, error: error.message };
    }
  },

  // Send SMS notification
  sendSMSNotification: async (phone, message) => {
    try {
      await sendSMS({
        to: phone,
        message
      });

      return { success: true };
    } catch (error) {
      console.error('Send SMS notification error:', error);
      return { success: false, error: error.message };
    }
  },

  // Send push notification
  sendPushNotification: async (userId, title, body, data) => {
    try {
      await sendPushNotification({
        userId,
        title,
        body,
        data
      });

      return { success: true };
    } catch (error) {
      console.error('Send push notification error:', error);
      return { success: false, error: error.message };
    }
  },

  // Queue notification for later
  queueNotification: async (userId, notification) => {
    await db.execute(`
      INSERT INTO notification_queue (
        user_id, notification_data, 
        scheduled_for, created_at
      ) VALUES (?, ?, ?, NOW())
    `, [
      userId,
      JSON.stringify(notification),
      notification.scheduledFor || new Date()
    ]);
  },

  // Process queued notifications
  processQueuedNotifications: async () => {
    const [queued] = await db.execute(`
      SELECT * FROM notification_queue
      WHERE scheduled_for <= NOW() 
        AND status = 'pending'
      LIMIT 100
    `);

    for (const item of queued) {
      try {
        const notification = JSON.parse(item.notification_data);
        await notificationUtils.sendNotification(item.user_id, notification);
        
        await db.execute(
          'UPDATE notification_queue SET status = "sent", sent_at = NOW() WHERE id = ?',
          [item.id]
        );
      } catch (error) {
        console.error('Process queued notification error:', error);
        
        await db.execute(
          'UPDATE notification_queue SET status = "failed", error = ? WHERE id = ?',
          [error.message, item.id]
        );
      }
    }
  },

  // Get email template for notification type
  getEmailTemplate: (type) => {
    const templates = {
      'booking_confirmed': 'booking-confirmation',
      'booking_cancelled': 'booking-cancellation',
      'booking_reminder': 'booking-reminder',
      'payment_success': 'payment-success',
      'payment_failed': 'payment-failed',
      'workout_completed': 'workout-completed',
      'message_received': 'new-message',
      'review_received': 'new-review',
      'package_expiring': 'package-expiring',
      'welcome': 'welcome',
      'password_reset': 'password-reset',
      'email_verification': 'email-verification'
    };

    return templates[type] || 'default-notification';
  },

  // Mark notification as read
  markAsRead: async (notificationId, userId) => {
    const [result] = await db.execute(
      'UPDATE notifications SET status = "read", read_at = NOW() WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    return result.affectedRows > 0;
  },

  // Mark all notifications as read
  markAllAsRead: async (userId) => {
    await db.execute(
      'UPDATE notifications SET status = "read", read_at = NOW() WHERE user_id = ? AND status = "unread"',
      [userId]
    );
  },

  // Delete notification
  deleteNotification: async (notificationId, userId) => {
    const [result] = await db.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    return result.affectedRows > 0;
  },

  // Get unread count
  getUnreadCount: async (userId) => {
    const [result] = await db.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND status = "unread"',
      [userId]
    );

    return result[0].count;
  },

  // Notification templates
  templates: {
    // Booking notifications
    bookingConfirmed: (booking) => ({
      title: 'การจองได้รับการยืนยัน',
      message: `การจองของคุณกับ ${booking.trainerName} ในวันที่ ${booking.date} เวลา ${booking.time} ได้รับการยืนยันแล้ว`,
      type: 'booking_confirmed',
      data: { bookingId: booking.id }
    }),

    bookingCancelled: (booking, reason) => ({
      title: 'การจองถูกยกเลิก',
      message: `การจองของคุณในวันที่ ${booking.date} ถูกยกเลิก${reason ? `: ${reason}` : ''}`,
      type: 'booking_cancelled',
      data: { bookingId: booking.id }
    }),

    bookingReminder: (booking) => ({
      title: 'เตือนการนัดหมาย',
      message: `คุณมีนัดกับ ${booking.trainerName} ในอีก 1 ชั่วโมง`,
      type: 'booking_reminder',
      priority: 'high',
      data: { bookingId: booking.id }
    }),

    // Payment notifications
    paymentSuccess: (payment) => ({
      title: 'ชำระเงินสำเร็จ',
      message: `การชำระเงินจำนวน ฿${payment.amount} สำเร็จแล้ว`,
      type: 'payment_success',
      data: { paymentId: payment.id }
    }),

    paymentFailed: (payment) => ({
      title: 'การชำระเงินล้มเหลว',
      message: 'ไม่สามารถดำเนินการชำระเงินได้ กรุณาลองใหม่อีกครั้ง',
      type: 'payment_failed',
      priority: 'high',
      data: { paymentId: payment.id }
    }),

    // Workout notifications
    workoutCompleted: (workout) => ({
      title: 'เยี่ยมมาก! 🎉',
      message: `คุณเพิ่งออกกำลังกายเสร็จ ${workout.duration} นาที`,
      type: 'workout_completed',
      data: { workoutId: workout.id }
    }),

    // Message notifications
    newMessage: (message) => ({
      title: 'ข้อความใหม่',
      message: `${message.senderName}: ${message.preview}`,
      type: 'message_received',
      data: { 
        messageId: message.id,
        chatId: message.chatId
      }
    }),

    // Review notifications
    newReview: (review) => ({
      title: 'รีวิวใหม่',
      message: `${review.customerName} ให้คะแนน ${review.rating} ดาว`,
      type: 'review_received',
      data: { reviewId: review.id }
    }),

    // Package notifications
    packageExpiring: (package) => ({
      title: 'แพ็คเกจใกล้หมดอายุ',
      message: `แพ็คเกจ ${package.name} จะหมดอายุในอีก ${package.daysLeft} วัน`,
      type: 'package_expiring',
      priority: 'high',
      data: { packageId: package.id }
    })
  },

  // Batch notifications
  sendBatchNotifications: async (notifications) => {
    const results = [];

    for (const notification of notifications) {
      try {
        const result = await notificationUtils.sendNotification(
          notification.userId,
          notification
        );
        results.push({ 
          userId: notification.userId, 
          success: true, 
          result 
        });
      } catch (error) {
        results.push({ 
          userId: notification.userId, 
          success: false, 
          error: error.message 
        });
      }
    }

    return results;
  },

  // Schedule notification
  scheduleNotification: async (userId, notification, scheduledFor) => {
    await db.execute(`
      INSERT INTO scheduled_notifications (
        user_id, notification_data, scheduled_for,
        status, created_at
      ) VALUES (?, ?, ?, 'pending', NOW())
    `, [
      userId,
      JSON.stringify(notification),
      scheduledFor
    ]);
  },

  // Cancel scheduled notification
  cancelScheduledNotification: async (notificationId) => {
    const [result] = await db.execute(
      'UPDATE scheduled_notifications SET status = "cancelled" WHERE id = ? AND status = "pending"',
      [notificationId]
    );

    return result.affectedRows > 0;
  },

  // Process scheduled notifications
  processScheduledNotifications: async () => {
    const [scheduled] = await db.execute(`
      SELECT * FROM scheduled_notifications
      WHERE scheduled_for <= NOW() 
        AND status = 'pending'
      LIMIT 100
    `);

    for (const item of scheduled) {
      try {
        const notification = JSON.parse(item.notification_data);
        await notificationUtils.sendNotification(item.user_id, notification);
        
        await db.execute(
          'UPDATE scheduled_notifications SET status = "sent", sent_at = NOW() WHERE id = ?',
          [item.id]
        );
      } catch (error) {
        console.error('Process scheduled notification error:', error);
        
        await db.execute(
          'UPDATE scheduled_notifications SET status = "failed", error = ? WHERE id = ?',
          [error.message, item.id]
        );
      }
    }
  },

  // Get notification statistics
  getNotificationStats: async (userId, period = 7) => {
    const [stats] = await db.execute(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END) as unread_count
      FROM notifications
      WHERE user_id = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY type
    `, [userId, period]);

    return stats;
  }
};

module.exports = notificationUtils;
