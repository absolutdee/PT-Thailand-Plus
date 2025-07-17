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
