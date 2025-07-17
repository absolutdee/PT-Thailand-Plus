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
