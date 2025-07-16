// chatUtils.js - Utility functions for chat system

import { io } from 'socket.io-client';
import { encryptData, decryptData } from './cryptoUtils';
import { formatDateTime } from './dateUtils';

class ChatUtils {
    constructor() {
        this.socket = null;
        this.activeChats = new Map();
        this.messageQueue = [];
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    // Initialize socket connection
    initializeSocket(serverUrl, authToken) {
        try {
            this.socket = io(serverUrl, {
                auth: { token: authToken },
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: 1000,
            });

            this.setupSocketListeners();
            return this.socket;
        } catch (error) {
            console.error('Socket initialization failed:', error);
            throw error;
        }
    }

    // Setup socket event listeners
    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Socket connected');
            this.processMessageQueue();
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    }

    // Send message
    sendMessage(recipientId, message, type = 'text', attachments = []) {
        const messageData = {
            recipientId,
            content: encryptData(message),
            type,
            attachments,
            timestamp: new Date().toISOString(),
            tempId: this.generateTempMessageId(),
        };

        if (this.socket && this.socket.connected) {
            this.socket.emit('send_message', messageData);
        } else {
            this.messageQueue.push(messageData);
        }

        return messageData;
    }

    // Process queued messages
    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.socket.emit('send_message', message);
        }
    }

    // Format chat message
    formatMessage(message) {
        return {
            id: message._id || message.id,
            senderId: message.senderId,
            recipientId: message.recipientId,
            content: decryptData(message.content),
            type: message.type || 'text',
            attachments: message.attachments || [],
            timestamp: formatDateTime(message.timestamp),
            status: message.status || 'sent',
            isRead: message.isRead || false,
        };
    }

    // Mark messages as read
    markAsRead(messageIds) {
        if (!Array.isArray(messageIds)) {
            messageIds = [messageIds];
        }

        this.socket.emit('mark_as_read', { messageIds });
    }

    // Join chat room
    joinChatRoom(roomId) {
        if (this.socket) {
            this.socket.emit('join_room', { roomId });
            this.activeChats.set(roomId, true);
        }
    }

    // Leave chat room
    leaveChatRoom(roomId) {
        if (this.socket) {
            this.socket.emit('leave_room', { roomId });
            this.activeChats.delete(roomId);
        }
    }

    // Get chat history
    async getChatHistory(recipientId, page = 1, limit = 50) {
        return new Promise((resolve, reject) => {
            this.socket.emit('get_chat_history', { recipientId, page, limit });
            
            this.socket.once('chat_history', (data) => {
                if (data.error) {
                    reject(data.error);
                } else {
                    const formattedMessages = data.messages.map(msg => this.formatMessage(msg));
                    resolve({
                        messages: formattedMessages,
                        hasMore: data.hasMore,
                        totalMessages: data.totalMessages,
                    });
                }
            });
        });
    }

    // Search messages
    async searchMessages(query, filters = {}) {
        return new Promise((resolve, reject) => {
            this.socket.emit('search_messages', { query, filters });
            
            this.socket.once('search_results', (data) => {
                if (data.error) {
                    reject(data.error);
                } else {
                    resolve(data.results.map(msg => this.formatMessage(msg)));
                }
            });
        });
    }

    // Get unread message count
    getUnreadCount(userId) {
        return new Promise((resolve, reject) => {
            this.socket.emit('get_unread_count', { userId });
            
            this.socket.once('unread_count', (data) => {
                if (data.error) {
                    reject(data.error);
                } else {
                    resolve(data.count);
                }
            });
        });
    }

    // Typing indicator
    sendTypingIndicator(recipientId, isTyping) {
        if (this.socket) {
            this.socket.emit('typing', { recipientId, isTyping });
        }
    }

    // Upload chat attachment
    async uploadAttachment(file, onProgress) {
        const formData = new FormData();
        formData.append('file', file);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    onProgress(percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } else {
                    reject(new Error(`Upload failed: ${xhr.statusText}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.open('POST', '/api/chat/upload');
            xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);
            xhr.send(formData);
        });
    }

    // Generate temporary message ID
    generateTempMessageId() {
        return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Format chat list item
    formatChatListItem(chat) {
        return {
            id: chat._id || chat.id,
            userId: chat.userId,
            userName: chat.userName,
            userAvatar: chat.userAvatar,
            lastMessage: chat.lastMessage ? decryptData(chat.lastMessage.content) : '',
            lastMessageTime: chat.lastMessage ? formatDateTime(chat.lastMessage.timestamp) : '',
            unreadCount: chat.unreadCount || 0,
            isOnline: chat.isOnline || false,
            lastSeen: chat.lastSeen ? formatDateTime(chat.lastSeen) : null,
        };
    }

    // Get active chats
    async getActiveChats(userId) {
        try {
            const response = await fetch(`/api/chat/active/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch active chats');
            }

            const chats = await response.json();
            return chats.map(chat => this.formatChatListItem(chat));
        } catch (error) {
            console.error('Error fetching active chats:', error);
            throw error;
        }
    }

    // Block/Unblock user
    async toggleBlockUser(userId, isBlocked) {
        try {
            const response = await fetch('/api/chat/block', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ userId, isBlocked }),
            });

            if (!response.ok) {
                throw new Error('Failed to update block status');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating block status:', error);
            throw error;
        }
    }

    // Delete message
    deleteMessage(messageId) {
        if (this.socket) {
            this.socket.emit('delete_message', { messageId });
        }
    }

    // Clear chat history
    async clearChatHistory(recipientId) {
        return new Promise((resolve, reject) => {
            this.socket.emit('clear_chat_history', { recipientId });
            
            this.socket.once('chat_history_cleared', (data) => {
                if (data.error) {
                    reject(data.error);
                } else {
                    resolve(data);
                }
            });
        });
    }

    // Disconnect socket
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.activeChats.clear();
        this.messageQueue = [];
    }
}

// Export singleton instance
const chatUtils = new ChatUtils();
export default chatUtils;

// Export individual functions for convenience
export const {
    initializeSocket,
    sendMessage,
    formatMessage,
    markAsRead,
    joinChatRoom,
    leaveChatRoom,
    getChatHistory,
    searchMessages,
    getUnreadCount,
    sendTypingIndicator,
    uploadAttachment,
    getActiveChats,
    toggleBlockUser,
    deleteMessage,
    clearChatHistory,
    disconnect,
} = chatUtils;
