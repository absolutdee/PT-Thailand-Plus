// controllers/notificationController.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPushNotification } = require('../utils/push');

class NotificationController {
  // Get user notifications
  async getNotifications(req, res) {
    try {
      const userId = req.user.userId;
      const { 
        type, 
        isRead, 
        startDate, 
        endDate,
        page = 1, 
        limit = 20 
      } = req.query;

      // Build query
      let query = { userId };

      if (type) {
        query.type = type;
      }

      if (isRead !== undefined) {
        query.isRead = isRead === 'true';
      }

      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('relatedUser', 'firstName lastName profilePicture');

      const totalCount = await Notification.countDocuments(query);

      // Get unread count
      const unreadCount = await Notification.countDocuments({
        userId,
        isRead: false
      });

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน'
      });
    }
  }

  // Mark notification as read
  async markAsRead(req, res) {
    try {
      const userId = req.user.userId;
      const { notificationIds } = req.body;

      await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          userId
        },
        {
          isRead: true,
          readAt: new Date()
        }
      );

      res.json({
        success: true,
        message: 'อ่านการแจ้งเตือนแล้ว'
      });

    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทสถานะการอ่าน'
      });
    }
  }

  // Mark all as read
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.userId;

      await Notification.updateMany(
        { userId, isRead: false },
        { 
          isRead: true, 
          readAt: new Date() 
        }
      );

      res.json({
        success: true,
        message: 'อ่านการแจ้งเตือนทั้งหมดแล้ว'
      });

    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทสถานะการอ่าน'
      });
    }
  }

  // Delete notification
  async deleteNotification(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const notification = await Notification.findOneAndDelete({
        _id: id,
        userId
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการแจ้งเตือน'
        });
      }

      res.json({
        success: true,
        message: 'ลบการแจ้งเตือนสำเร็จ'
      });

    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบการแจ้งเตือน'
      });
    }
  }

  // Clear all notifications
  async clearAllNotifications(req, res) {
    try {
      const userId = req.user.userId;

      await Notification.deleteMany({ userId });

      res.json({
        success: true,
        message: 'ลบการแจ้งเตือนทั้งหมดสำเร็จ'
      });

    } catch (error) {
      console.error('Clear all notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบการแจ้งเตือน'
      });
    }
  }

  // Get notification preferences
  async getNotificationPreferences(req, res) {
    try {
      const userId = req.user.userId;

      const user = await User.findById(userId)
        .select('notificationSettings');

      res.json({
        success: true,
        data: user.notificationSettings || {
          email: {
            bookings: true,
            messages: true,
            reminders: true,
            marketing: false
          },
          push: {
            bookings: true,
            messages: true,
            reminders: true,
            marketing: false
          },
          sms: {
            bookings: true,
            reminders: true
          }
        }
      });

    } catch (error) {
      console.error('Get notification preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า'
      });
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(req, res) {
    try {
      const userId = req.user.userId;
      const { email, push, sms } = req.body;

      await User.findByIdAndUpdate(userId, {
        notificationSettings: {
          email,
          push,
          sms
        }
      });

      res.json({
        success: true,
        message: 'อัพเดทการตั้งค่าการแจ้งเตือนสำเร็จ'
      });

    } catch (error) {
      console.error('Update notification preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่า'
      });
    }
  }

  // Register device for push notifications
  async registerDevice(req, res) {
    try {
      const userId = req.user.userId;
      const { deviceToken, deviceType, deviceId } = req.body;

      await User.findByIdAndUpdate(userId, {
        $addToSet: {
          devices: {
            token: deviceToken,
            type: deviceType,
            deviceId,
            registeredAt: new Date()
          }
        }
      });

      res.json({
        success: true,
        message: 'ลงทะเบียนอุปกรณ์สำเร็จ'
      });

    } catch (error) {
      console.error('Register device error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลงทะเบียนอุปกรณ์'
      });
    }
  }

  // Unregister device
  async unregisterDevice(req, res) {
    try {
      const userId = req.user.userId;
      const { deviceId } = req.body;

      await User.findByIdAndUpdate(userId, {
        $pull: {
          devices: { deviceId }
        }
      });

      res.json({
        success: true,
        message: 'ยกเลิกลงทะเบียนอุปกรณ์สำเร็จ'
      });

    } catch (error) {
      console.error('Unregister device error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการยกเลิกลงทะเบียนอุปกรณ์'
      });
    }
  }

  // Send test notification
  async sendTestNotification(req, res) {
    try {
      const userId = req.user.userId;

      // Create test notification
      const notification = await Notification.create({
        userId,
        title: 'ทดสอบการแจ้งเตือน',
        message: 'นี่คือการแจ้งเตือนทดสอบ',
        type: 'test',
        priority: 'low'
      });

      // Send push notification
      const user = await User.findById(userId);
      if (user.devices && user.devices.length > 0) {
        await Promise.all(
          user.devices.map(device => 
            sendPushNotification({
              token: device.token,
              title: notification.title,
              body: notification.message,
              data: {
                notificationId: notification._id.toString(),
                type: notification.type
              }
            })
          )
        );
      }

      res.json({
        success: true,
        message: 'ส่งการแจ้งเตือนทดสอบสำเร็จ'
      });

    } catch (error) {
      console.error('Send test notification error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือนทดสอบ'
      });
    }
  }

  // Get notification statistics
  async getNotificationStats(req, res) {
    try {
      const userId = req.user.userId;

      const stats = await Notification.aggregate([
        { $match: { userId } },
        {
          $facet: {
            byType: [
              {
                $group: {
                  _id: '$type',
                  count: { $sum: 1 },
                  unread: {
                    $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
                  }
                }
              }
            ],
            byPriority: [
              {
                $group: {
                  _id: '$priority',
                  count: { $sum: 1 }
                }
              }
            ],
            total: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  unread: {
                    $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
                  }
                }
              }
            ]
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          byType: stats[0].byType,
          byPriority: stats[0].byPriority,
          total: stats[0].total[0] || { total: 0, unread: 0 }
        }
      });

    } catch (error) {
      console.error('Get notification stats error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ'
      });
    }
  }

  // Create announcement (admin only)
  async createAnnouncement(req, res) {
    try {
      const { title, message, targetRole, priority = 'medium' } = req.body;

      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์สร้างประกาศ'
        });
      }

      // Get target users
      let query = { isActive: true };
      if (targetRole && targetRole !== 'all') {
        query.role = targetRole;
      }

      const users = await User.find(query).select('_id devices');

      // Create notifications for all users
      const notifications = await Promise.all(
        users.map(user => 
          Notification.create({
            userId: user._id,
            title,
            message,
            type: 'announcement',
            priority
          })
        )
      );

      // Send push notifications
      const pushPromises = users
        .filter(user => user.devices && user.devices.length > 0)
        .flatMap(user => 
          user.devices.map(device =>
            sendPushNotification({
              token: device.token,
              title,
              body: message,
              data: {
                type: 'announcement',
                priority
              }
            })
          )
        );

      await Promise.all(pushPromises);

      res.json({
        success: true,
        message: `ส่งประกาศไปยังผู้ใช้ ${notifications.length} คนสำเร็จ`
      });

    } catch (error) {
      console.error('Create announcement error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างประกาศ'
      });
    }
  }
}

module.exports = new NotificationController();
