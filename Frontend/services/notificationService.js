import realtimeService from './realtimeService';
import { notificationAPI } from '../utils/api';
import { requestNotificationPermission, showNotification } from '../utils/helpers';
import { NOTIFICATION_TYPES } from '../utils/constants';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.subscribers = new Set();
    this.soundEnabled = true;
    this.desktopEnabled = true;
    this.notificationSound = new Audio('/sounds/notification.mp3');
  }

  async initialize() {
    // Request permission for browser notifications
    await this.requestPermission();
    
    // Load notification settings
    await this.loadSettings();
    
    // Subscribe to real-time notifications
    this.subscribeToRealtimeNotifications();
    
    // Fetch initial notifications
    await this.fetchNotifications();
  }

  async requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await requestNotificationPermission();
      this.desktopEnabled = permission;
    }
  }

  async loadSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
      this.soundEnabled = settings.soundEnabled !== false;
      this.desktopEnabled = settings.desktopEnabled !== false && Notification.permission === 'granted';
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  async saveSettings(settings) {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      this.soundEnabled = settings.soundEnabled;
      this.desktopEnabled = settings.desktopEnabled && Notification.permission === 'granted';
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  subscribeToRealtimeNotifications() {
    // Subscribe to different notification channels
    const channels = [
      'notification:new',
      'notification:booking',
      'notification:chat',
      'notification:payment',
      'notification:review',
      'notification:system',
    ];

    channels.forEach(channel => {
      realtimeService.subscribe(channel, (notification) => {
        this.handleNewNotification(notification);
      });
    });

    // Subscribe to notification updates
    realtimeService.subscribe('notification:read', ({ notificationId }) => {
      this.markAsReadLocally(notificationId);
    });

    realtimeService.subscribe('notification:deleted', ({ notificationId }) => {
      this.removeNotificationLocally(notificationId);
    });
  }

  async fetchNotifications() {
    try {
      const response = await notificationAPI.getAll();
      this.notifications = response.data.notifications;
      this.unreadCount = response.data.unreadCount;
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }

  handleNewNotification(notification) {
    // Add to local store
    this.notifications.unshift(notification);
    if (!notification.read) {
      this.unreadCount++;
    }

    // Play sound if enabled
    if (this.soundEnabled && !notification.read) {
      this.playNotificationSound();
    }

    // Show desktop notification if enabled
    if (this.desktopEnabled && !notification.read) {
      this.showDesktopNotification(notification);
    }

    // Notify subscribers
    this.notifySubscribers();
  }

  playNotificationSound() {
    try {
      this.notificationSound.play().catch(error => {
        console.log('Could not play notification sound:', error);
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  showDesktopNotification(notification) {
    const options = {
      body: notification.message,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: notification.id,
      data: notification,
      requireInteraction: false,
      silent: !this.soundEnabled,
    };

    const desktopNotification = new Notification(notification.title, options);

    desktopNotification.onclick = () => {
      window.focus();
      if (notification.link) {
        window.location.href = notification.link;
      }
      desktopNotification.close();
    };
  }

  async markAsRead(notificationId) {
    try {
      await notificationAPI.markAsRead(notificationId);
      this.markAsReadLocally(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  markAsReadLocally(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notifySubscribers();
    }
  }

  async markAllAsRead() {
    try {
      await notificationAPI.markAllAsRead();
      this.notifications.forEach(n => n.read = true);
      this.unreadCount = 0;
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId) {
    try {
      await notificationAPI.delete(notificationId);
      this.removeNotificationLocally(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  removeNotificationLocally(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      const notification = this.notifications[index];
      if (!notification.read) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
      this.notifications.splice(index, 1);
      this.notifySubscribers();
    }
  }

  async clearAll() {
    try {
      await notificationAPI.clearAll();
      this.notifications = [];
      this.unreadCount = 0;
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      throw error;
    }
  }

  // Subscribe to notification updates
  subscribe(callback) {
    this.subscribers.add(callback);
    // Immediately call with current state
    callback({
      notifications: this.notifications,
      unreadCount: this.unreadCount,
    });

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  notifySubscribers() {
    const state = {
      notifications: this.notifications,
      unreadCount: this.unreadCount,
    };

    this.subscribers.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in notification subscriber:', error);
      }
    });
  }

  // Filter notifications
  getNotificationsByType(type) {
    return this.notifications.filter(n => n.type === type);
  }

  getUnreadNotifications() {
    return this.notifications.filter(n => !n.read);
  }

  getRecentNotifications(limit = 10) {
    return this.notifications.slice(0, limit);
  }

  // Create notification helper
  async createNotification(userId, notification) {
    const payload = {
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || NOTIFICATION_TYPES.SYSTEM,
      link: notification.link,
      data: notification.data,
    };

    realtimeService.emit('notification:send', payload);
  }
}

export default new NotificationService();
