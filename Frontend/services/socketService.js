// Frontend/services/socketService.js
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.emit('connection:established');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connected = false;
      this.emit('connection:lost', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      this.emit('connection:error', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.emit('connection:reconnected', attemptNumber);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      this.emit('connection:failed');
    });

    // Handle token expiry
    this.socket.on('token_expired', () => {
      console.log('Auth token expired');
      this.emit('auth:token_expired');
      this.disconnect();
    });

    // Handle forced disconnect
    this.socket.on('force_disconnect', (reason) => {
      console.log('Forced disconnect:', reason);
      this.emit('connection:forced_disconnect', reason);
      this.disconnect();
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit:', event);
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event).add(callback);
    
    if (this.socket) {
      this.socket.on(event, callback);
    }
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      
      if (this.listeners.get(event).size === 0) {
        this.listeners.delete(event);
      }
    }
    
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    
    this.on(event, wrapper);
  }

  // Join/Leave rooms
  joinRoom(room) {
    this.emit('join_room', room);
  }

  leaveRoom(room) {
    this.emit('leave_room', room);
  }

  // Get connection status
  isConnected() {
    return this.socket?.connected || false;
  }

  getSocketId() {
    return this.socket?.id || null;
  }

  // Reconnect with new token
  reconnect(token) {
    this.disconnect();
    this.connect(token);
  }
}

export default new SocketService();

// Frontend/services/realtimeService.js
import socketService from './socketService';
import { showNotification } from '../utils/helpers';

class RealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.initialized = false;
  }

  initialize(token) {
    if (this.initialized) return;

    socketService.connect(token);
    this.setupGlobalHandlers();
    this.initialized = true;
  }

  setupGlobalHandlers() {
    // Connection handlers
    socketService.on('connection:established', () => {
      console.log('Realtime service connected');
      this.resubscribeAll();
    });

    socketService.on('connection:lost', (reason) => {
      console.log('Realtime service disconnected:', reason);
    });

    socketService.on('connection:error', (error) => {
      console.error('Realtime service error:', error);
    });

    socketService.on('auth:token_expired', () => {
      // Handle token expiry - typically redirect to login
      window.location.href = '/login';
    });

    // Global notification handler
    socketService.on('notification', (notification) => {
      this.handleNotification(notification);
    });
  }

  handleNotification(notification) {
    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      showNotification(notification.title, {
        body: notification.message,
        tag: notification.id,
        data: notification,
      });
    }

    // Emit custom event for UI updates
    window.dispatchEvent(new CustomEvent('app:notification', {
      detail: notification,
    }));
  }

  // Subscribe to real-time updates
  subscribe(channel, callback) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }

    this.subscriptions.get(channel).add(callback);

    // Subscribe to socket events
    const unsubscribe = socketService.on(channel, callback);

    // Join channel room if needed
    if (channel.includes(':')) {
      const [type, id] = channel.split(':');
      socketService.joinRoom(channel);
    }

    return () => {
      this.unsubscribe(channel, callback);
      unsubscribe();
    };
  }

  unsubscribe(channel, callback) {
    if (this.subscriptions.has(channel)) {
      this.subscriptions.get(channel).delete(callback);
      
      if (this.subscriptions.get(channel).size === 0) {
        this.subscriptions.delete(channel);
        
        // Leave channel room if needed
        if (channel.includes(':')) {
          socketService.leaveRoom(channel);
        }
      }
    }
  }

  resubscribeAll() {
    // Rejoin all rooms after reconnection
    this.subscriptions.forEach((callbacks, channel) => {
      if (channel.includes(':')) {
        socketService.joinRoom(channel);
      }
    });
  }

  // Emit events
  emit(event, data) {
    socketService.emit(event, data);
  }

  // User status
  setUserOnline() {
    this.emit('user:online');
  }

  setUserOffline() {
    this.emit('user:offline');
  }

  updateUserStatus(status) {
    this.emit('user:status', { status });
  }

  // Typing indicators
  startTyping(conversationId) {
    this.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId) {
    this.emit('typing:stop', { conversationId });
  }

  // Presence
  subscribeToPresence(userIds) {
    this.emit('presence:subscribe', { userIds });
  }

  unsubscribeFromPresence(userIds) {
    this.emit('presence:unsubscribe', { userIds });
  }

  // Cleanup
  disconnect() {
    this.subscriptions.clear();
    socketService.disconnect();
    this.initialized = false;
  }
}

export default new RealtimeService();

// Frontend/services/notificationService.js
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

// Frontend/services/chatService.js
import realtimeService from './realtimeService';
import { chatAPI } from '../utils/api';
import { APP_CONFIG } from '../utils/constants';

class ChatService {
  constructor() {
    this.conversations = new Map();
    this.activeConversation = null;
    this.typingTimeouts = new Map();
    this.subscribers = new Set();
    this.messageQueue = [];
    this.onlineUsers = new Set();
  }

  initialize() {
    this.subscribeToRealtimeEvents();
    this.loadConversations();
  }

  subscribeToRealtimeEvents() {
    // Message events
    realtimeService.subscribe('chat:message', (message) => {
      this.handleNewMessage(message);
    });

    realtimeService.subscribe('chat:message_read', ({ conversationId, userId, messageIds }) => {
      this.handleMessagesRead(conversationId, userId, messageIds);
    });

    realtimeService.subscribe('chat:message_deleted', ({ conversationId, messageId }) => {
      this.handleMessageDeleted(conversationId, messageId);
    });

    // Typing events
    realtimeService.subscribe('chat:typing_start', ({ conversationId, userId }) => {
      this.handleTypingStart(conversationId, userId);
    });

    realtimeService.subscribe('chat:typing_stop', ({ conversationId, userId }) => {
      this.handleTypingStop(conversationId, userId);
    });

    // Presence events
    realtimeService.subscribe('presence:online', ({ userId }) => {
      this.onlineUsers.add(userId);
      this.notifySubscribers();
    });

    realtimeService.subscribe('presence:offline', ({ userId }) => {
      this.onlineUsers.delete(userId);
      this.notifySubscribers();
    });

    // Conversation events
    realtimeService.subscribe('chat:conversation_created', (conversation) => {
      this.addConversation(conversation);
    });

    realtimeService.subscribe('chat:conversation_updated', (conversation) => {
      this.updateConversation(conversation);
    });
  }

  async loadConversations() {
    try {
      const response = await chatAPI.getConversations();
      response.data.forEach(conversation => {
        this.conversations.set(conversation.id, {
          ...conversation,
          messages: [],
          typingUsers: new Set(),
          unreadCount: conversation.unreadCount || 0,
        });
      });
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }

  async loadMessages(conversationId) {
    try {
      const response = await chatAPI.getMessages(conversationId);
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.messages = response.data;
        this.notifySubscribers();
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      throw error;
    }
  }

  async sendMessage(conversationId, content, type = 'text', attachments = []) {
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const message = {
      id: tempId,
      conversationId,
      content,
      type,
      attachments,
      senderId: this.getCurrentUserId(),
      createdAt: new Date().toISOString(),
      status: 'sending',
      read: false,
    };

    // Add to local state immediately
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.messages.push(message);
      conversation.lastMessage = message;
      this.notifySubscribers();
    }

    try {
      // Send via API
      const response = await chatAPI.sendMessage(conversationId, {
        content,
        type,
        attachments,
      });

      // Update with server response
      if (conversation) {
        const index = conversation.messages.findIndex(m => m.id === tempId);
        if (index !== -1) {
          conversation.messages[index] = response.data;
        }
        conversation.lastMessage = response.data;
      }

      // Emit via socket for real-time delivery
      realtimeService.emit('chat:send_message', response.data);

      this.notifySubscribers();
      return response.data;
    } catch (error) {
      // Mark message as failed
      if (conversation) {
        const message = conversation.messages.find(m => m.id === tempId);
        if (message) {
          message.status = 'failed';
        }
      }
      this.notifySubscribers();
      throw error;
    }
  }

  handleNewMessage(message) {
    const conversation = this.conversations.get(message.conversationId);
    if (conversation) {
      // Check if message already exists
      const exists = conversation.messages.some(m => m.id === message.id);
      if (!exists) {
        conversation.messages.push(message);
        conversation.lastMessage = message;
        
        // Increment unread count if not in active conversation
        if (this.activeConversation !== message.conversationId && 
            message.senderId !== this.getCurrentUserId()) {
          conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        }
      }
    } else {
      // New conversation, fetch it
      this.loadConversations();
    }
    
    this.notifySubscribers();
  }

  handleMessagesRead(conversationId, userId, messageIds) {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.messages.forEach(message => {
        if (messageIds.includes(message.id)) {
          message.read = true;
          if (!message.readBy) message.readBy = [];
          if (!message.readBy.includes(userId)) {
            message.readBy.push(userId);
          }
        }
      });
      this.notifySubscribers();
    }
  }

  handleMessageDeleted(conversationId, messageId) {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.messages = conversation.messages.filter(m => m.id !== messageId);
      this.notifySubscribers();
    }
  }

  // Typing indicators
  startTyping(conversationId) {
    // Clear existing timeout
    this.stopTyping(conversationId);
    
    // Emit typing start
    realtimeService.emit('chat:typing_start', { conversationId });
    
    // Set timeout to stop typing
    const timeout = setTimeout(() => {
      this.stopTyping(conversationId);
    }, APP_CONFIG.TYPING_INDICATOR_TIMEOUT);
    
    this.typingTimeouts.set(conversationId, timeout);
  }

  stopTyping(conversationId) {
    const timeout = this.typingTimeouts.get(conversationId);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(conversationId);
    }
    
    realtimeService.emit('chat:typing_stop', { conversationId });
  }

  handleTypingStart(conversationId, userId) {
    const conversation = this.conversations.get(conversationId);
    if (conversation && userId !== this.getCurrentUserId()) {
      conversation.typingUsers.add(userId);
      this.notifySubscribers();
    }
  }

  handleTypingStop(conversationId, userId) {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.typingUsers.delete(userId);
      this.notifySubscribers();
    }
  }

  // Mark messages as read
  async markAsRead(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    const unreadMessages = conversation.messages.filter(
      m => !m.read && m.senderId !== this.getCurrentUserId()
    );

    if (unreadMessages.length === 0) return;

    try {
      await chatAPI.markAsRead(conversationId);
      
      // Update local state
      unreadMessages.forEach(m => m.read = true);
      conversation.unreadCount = 0;
      
      // Emit read status
      realtimeService.emit('chat:mark_read', {
        conversationId,
        messageIds: unreadMessages.map(m => m.id),
      });
      
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }

  // Create new conversation
  async createConversation(participantId) {
    try {
      const response = await chatAPI.createConversation(participantId);
      this.addConversation(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  }

  addConversation(conversation) {
    this.conversations.set(conversation.id, {
      ...conversation,
      messages: [],
      typingUsers: new Set(),
      unreadCount: conversation.unreadCount || 0,
    });
    this.notifySubscribers();
  }

  updateConversation(updates) {
    const conversation = this.conversations.get(updates.id);
    if (conversation) {
      Object.assign(conversation, updates);
      this.notifySubscribers();
    }
  }

  // Active conversation management
  setActiveConversation(conversationId) {
    this.activeConversation = conversationId;
    
    if (conversationId) {
      // Join conversation room
      realtimeService.emit('chat:join_conversation', { conversationId });
      
      // Mark messages as read
      this.markAsRead(conversationId);
      
      // Load messages if not loaded
      const conversation = this.conversations.get(conversationId);
      if (conversation && conversation.messages.length === 0) {
        this.loadMessages(conversationId);
      }
    } else {
      // Leave previous conversation
      if (this.activeConversation) {
        realtimeService.emit('chat:leave_conversation', { 
          conversationId: this.activeConversation 
        });
      }
    }
    
    this.notifySubscribers();
  }

  // Subscribe to updates
  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.getState());
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  notifySubscribers() {
    const state = this.getState();
    this.subscribers.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in chat subscriber:', error);
      }
    });
  }

  getState() {
    return {
      conversations: Array.from(this.conversations.values()),
      activeConversation: this.activeConversation,
      onlineUsers: Array.from(this.onlineUsers),
      totalUnread: this.getTotalUnreadCount(),
    };
  }

  getTotalUnreadCount() {
    let total = 0;
    this.conversations.forEach(conv => {
      total += conv.unreadCount || 0;
    });
    return total;
  }

  getConversation(conversationId) {
    return this.conversations.get(conversationId);
  }

  getTypingUsers(conversationId) {
    const conversation = this.conversations.get(conversationId);
    return conversation ? Array.from(conversation.typingUsers) : [];
  }

  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  // Helper to get current user ID
  getCurrentUserId() {
    // This should be implemented based on your auth system
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  }

  // File upload
  async uploadFile(conversationId, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await chatAPI.uploadFile(conversationId, formData);
      return response.data;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }

  // Search messages
  searchMessages(query) {
    const results = [];
    
    this.conversations.forEach(conversation => {
      const matches = conversation.messages.filter(message => 
        message.content.toLowerCase().includes(query.toLowerCase())
      );
      
      if (matches.length > 0) {
        results.push({
          conversation,
          matches,
        });
      }
    });
    
    return results;
  }

  // Cleanup
  cleanup() {
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
    this.conversations.clear();
    this.subscribers.clear();
    this.activeConversation = null;
  }
}

export default new ChatService();
