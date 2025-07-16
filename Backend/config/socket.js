// socket.js - Socket.io configuration and management

import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/errorUtils';
import redisConfig from './redis';

class SocketConfig {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map();
        this.rooms = new Map();
        this.messageQueue = new Map();
    }

    // Initialize Socket.io
    initialize(server) {
        try {
            // Create Socket.io server
            this.io = new Server(server, {
                cors: {
                    origin: process.env.CLIENT_URL || 'http://localhost:3000',
                    credentials: true,
                    methods: ['GET', 'POST'],
                },
                pingTimeout: 60000,
                pingInterval: 25000,
                transports: ['websocket', 'polling'],
                allowEIO3: true,
                maxHttpBufferSize: 1e6, // 1MB
                path: '/socket.io/',
            });

            // Setup Redis adapter for scaling
            if (process.env.REDIS_ENABLED === 'true') {
                this.setupRedisAdapter();
            }

            // Setup middleware
            this.setupMiddleware();

            // Setup event handlers
            this.setupEventHandlers();

            logger.info('Socket.io initialized successfully');
        } catch (error) {
            logger.error('Socket.io initialization error:', error);
            throw error;
        }
    }

    // Setup Redis adapter for horizontal scaling
    async setupRedisAdapter() {
        try {
            const pubClient = redisConfig.getClient();
            const subClient = pubClient.duplicate();
            
            await subClient.connect();
            
            this.io.adapter(createAdapter(pubClient, subClient));
            logger.info('Socket.io Redis adapter configured');
        } catch (error) {
            logger.error('Redis adapter setup error:', error);
        }
    }

    // Setup middleware
    setupMiddleware() {
        // Authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
                
                if (!token) {
                    return next(new Error('Authentication required'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.userId;
                socket.userRole = decoded.role;
                
                // Store user info
                socket.user = {
                    id: decoded.userId,
                    role: decoded.role,
                    name: decoded.name,
                };

                next();
            } catch (error) {
                logger.error('Socket authentication error:', error);
                next(new Error('Authentication failed'));
            }
        });

        // Rate limiting middleware
        this.io.use((socket, next) => {
            const clientId = socket.handshake.address;
            const now = Date.now();
            
            if (!this.rateLimiter) {
                this.rateLimiter = new Map();
            }

            const clientData = this.rateLimiter.get(clientId) || { count: 0, resetTime: now + 60000 };
            
            if (now > clientData.resetTime) {
                clientData.count = 0;
                clientData.resetTime = now + 60000;
            }

            if (clientData.count >= 100) { // 100 events per minute
                return next(new Error('Rate limit exceeded'));
            }

            clientData.count++;
            this.rateLimiter.set(clientId, clientData);
            next();
        });
    }

    // Setup event handlers
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            logger.info(`User ${socket.userId} connected`);
            
            // Store connected user
            this.connectedUsers.set(socket.userId, {
                socketId: socket.id,
                connectedAt: new Date(),
                status: 'online',
            });

            // Emit user status
            this.broadcastUserStatus(socket.userId, 'online');

            // Join user-specific room
            socket.join(`user:${socket.userId}`);

            // Handle joining rooms
            socket.on('join_room', (roomId) => this.handleJoinRoom(socket, roomId));
            socket.on('leave_room', (roomId) => this.handleLeaveRoom(socket, roomId));

            // Handle chat messages
            socket.on('send_message', (data) => this.handleSendMessage(socket, data));
            socket.on('typing', (data) => this.handleTyping(socket, data));
            socket.on('mark_as_read', (data) => this.handleMarkAsRead(socket, data));

            // Handle appointments
            socket.on('appointment_update', (data) => this.handleAppointmentUpdate(socket, data));
            socket.on('appointment_reminder', (data) => this.handleAppointmentReminder(socket, data));

            // Handle video calls
            socket.on('call_initiate', (data) => this.handleCallInitiate(socket, data));
            socket.on('call_accept', (data) => this.handleCallAccept(socket, data));
            socket.on('call_reject', (data) => this.handleCallReject(socket, data));
            socket.on('call_end', (data) => this.handleCallEnd(socket, data));
            socket.on('webrtc_offer', (data) => this.handleWebRTCOffer(socket, data));
            socket.on('webrtc_answer', (data) => this.handleWebRTCAnswer(socket, data));
            socket.on('webrtc_ice_candidate', (data) => this.handleWebRTCIceCandidate(socket, data));

            // Handle notifications
            socket.on('notification_read', (data) => this.handleNotificationRead(socket, data));

            // Handle presence
            socket.on('update_status', (status) => this.handleUpdateStatus(socket, status));
            socket.on('get_online_users', () => this.handleGetOnlineUsers(socket));

            // Handle disconnection
            socket.on('disconnect', () => this.handleDisconnect(socket));
            
            // Handle errors
            socket.on('error', (error) => {
                logger.error(`Socket error for user ${socket.userId}:`, error);
            });

            // Send queued messages
            this.sendQueuedMessages(socket);
        });
    }

    // Room management
    handleJoinRoom(socket, roomId) {
        try {
            socket.join(roomId);
            
            // Track room members
            if (!this.rooms.has(roomId)) {
                this.rooms.set(roomId, new Set());
            }
            this.rooms.get(roomId).add(socket.userId);

            // Notify room members
            socket.to(roomId).emit('user_joined_room', {
                roomId,
                userId: socket.userId,
                userName: socket.user.name,
            });

            logger.info(`User ${socket.userId} joined room ${roomId}`);
        } catch (error) {
            logger.error('Join room error:', error);
            socket.emit('error', { message: 'Failed to join room' });
        }
    }

    handleLeaveRoom(socket, roomId) {
        try {
            socket.leave(roomId);
            
            // Update room members
            if (this.rooms.has(roomId)) {
                this.rooms.get(roomId).delete(socket.userId);
                if (this.rooms.get(roomId).size === 0) {
                    this.rooms.delete(roomId);
                }
            }

            // Notify room members
            socket.to(roomId).emit('user_left_room', {
                roomId,
                userId: socket.userId,
                userName: socket.user.name,
            });

            logger.info(`User ${socket.userId} left room ${roomId}`);
        } catch (error) {
            logger.error('Leave room error:', error);
        }
    }

    // Message handling
    async handleSendMessage(socket, data) {
        try {
            const { recipientId, content, type = 'text', attachments = [] } = data;

            // Validate message
            if (!recipientId || !content) {
                throw new Error('Invalid message data');
            }

            // Create message object
            const message = {
                id: this.generateMessageId(),
                senderId: socket.userId,
                senderName: socket.user.name,
                recipientId,
                content,
                type,
                attachments,
                timestamp: new Date(),
                status: 'sent',
            };

            // Create room ID for private chat
            const roomId = this.getChatRoomId(socket.userId, recipientId);

            // Check if recipient is online
            const recipientSocket = this.getSocketByUserId(recipientId);
            
            if (recipientSocket) {
                // Send message to recipient
                recipientSocket.emit('new_message', message);
                message.status = 'delivered';
            } else {
                // Queue message for offline user
                this.queueMessage(recipientId, message);
            }

            // Send confirmation to sender
            socket.emit('message_sent', {
                tempId: data.tempId,
                message,
            });

            // Store message in database (implement in your message controller)
            // await messageController.createMessage(message);

            logger.info(`Message sent from ${socket.userId} to ${recipientId}`);
        } catch (error) {
            logger.error('Send message error:', error);
            socket.emit('message_error', {
                tempId: data.tempId,
                error: error.message,
            });
        }
    }

    handleTyping(socket, data) {
        const { recipientId, isTyping } = data;
        const recipientSocket = this.getSocketByUserId(recipientId);
        
        if (recipientSocket) {
            recipientSocket.emit('typing_indicator', {
                userId: socket.userId,
                userName: socket.user.name,
                isTyping,
            });
        }
    }

    handleMarkAsRead(socket, data) {
        const { messageIds, senderId } = data;
        const senderSocket = this.getSocketByUserId(senderId);
        
        if (senderSocket) {
            senderSocket.emit('messages_read', {
                messageIds,
                readBy: socket.userId,
                readAt: new Date(),
            });
        }
    }

    // Appointment handling
    handleAppointmentUpdate(socket, data) {
        const { appointmentId, clientId, trainerId, type, details } = data;
        
        // Notify both client and trainer
        const clientSocket = this.getSocketByUserId(clientId);
        const trainerSocket = this.getSocketByUserId(trainerId);
        
        const notification = {
            type: `appointment_${type}`,
            appointmentId,
            details,
            timestamp: new Date(),
        };

        if (clientSocket) {
            clientSocket.emit('appointment_notification', notification);
        }
        
        if (trainerSocket) {
            trainerSocket.emit('appointment_notification', notification);
        }
    }

    handleAppointmentReminder(socket, data) {
        const { userId, appointment } = data;
        const userSocket = this.getSocketByUserId(userId);
        
        if (userSocket) {
            userSocket.emit('appointment_reminder', {
                appointment,
                reminderType: data.reminderType,
                timestamp: new Date(),
            });
        }
    }

    // Video call handling
    handleCallInitiate(socket, data) {
        const { targetUserId, callType = 'video' } = data;
        const targetSocket = this.getSocketByUserId(targetUserId);
        
        if (targetSocket) {
            targetSocket.emit('incoming_call', {
                callerId: socket.userId,
                callerName: socket.user.name,
                callType,
                roomId: this.generateCallRoomId(),
            });
        } else {
            socket.emit('call_failed', {
                reason: 'User is offline',
            });
        }
    }

    handleCallAccept(socket, data) {
        const { callerId, roomId } = data;
        const callerSocket = this.getSocketByUserId(callerId);
        
        if (callerSocket) {
            callerSocket.emit('call_accepted', {
                acceptedBy: socket.userId,
                roomId,
            });
        }
    }

    handleCallReject(socket, data) {
        const { callerId, reason } = data;
        const callerSocket = this.getSocketByUserId(callerId);
        
        if (callerSocket) {
            callerSocket.emit('call_rejected', {
                rejectedBy: socket.userId,
                reason,
            });
        }
    }

    handleCallEnd(socket, data) {
        const { targetUserId, roomId } = data;
        const targetSocket = this.getSocketByUserId(targetUserId);
        
        if (targetSocket) {
            targetSocket.emit('call_ended', {
                endedBy: socket.userId,
                roomId,
            });
        }
    }

    // WebRTC signaling
    handleWebRTCOffer(socket, data) {
        const { targetUserId, offer, roomId } = data;
        const targetSocket = this.getSocketByUserId(targetUserId);
        
        if (targetSocket) {
            targetSocket.emit('webrtc_offer', {
                senderId: socket.userId,
                offer,
                roomId,
            });
        }
    }

    handleWebRTCAnswer(socket, data) {
        const { targetUserId, answer, roomId } = data;
        const targetSocket = this.getSocketByUserId(targetUserId);
        
        if (targetSocket) {
            targetSocket.emit('webrtc_answer', {
                senderId: socket.userId,
                answer,
                roomId,
            });
        }
    }

    handleWebRTCIceCandidate(socket, data) {
        const { targetUserId, candidate, roomId } = data;
        const targetSocket = this.getSocketByUserId(targetUserId);
        
        if (targetSocket) {
            targetSocket.emit('webrtc_ice_candidate', {
                senderId: socket.userId,
                candidate,
                roomId,
            });
        }
    }

    // Notification handling
    handleNotificationRead(socket, data) {
        const { notificationIds } = data;
        
        // Update notification status in database
        // await notificationController.markAsRead(notificationIds, socket.userId);
        
        socket.emit('notifications_marked_read', {
            notificationIds,
            readAt: new Date(),
        });
    }

    // User status handling
    handleUpdateStatus(socket, status) {
        const user = this.connectedUsers.get(socket.userId);
        if (user) {
            user.status = status;
            this.connectedUsers.set(socket.userId, user);
            this.broadcastUserStatus(socket.userId, status);
        }
    }

    handleGetOnlineUsers(socket) {
        const onlineUsers = Array.from(this.connectedUsers.entries()).map(([userId, data]) => ({
            userId,
            status: data.status,
            connectedAt: data.connectedAt,
        }));
        
        socket.emit('online_users', onlineUsers);
    }

    // Disconnect handling
    handleDisconnect(socket) {
        logger.info(`User ${socket.userId} disconnected`);
        
        // Remove from connected users
        this.connectedUsers.delete(socket.userId);
        
        // Remove from all rooms
        this.rooms.forEach((members, roomId) => {
            if (members.has(socket.userId)) {
                members.delete(socket.userId);
                socket.to(roomId).emit('user_left_room', {
                    roomId,
                    userId: socket.userId,
                });
            }
        });

        // Broadcast offline status
        this.broadcastUserStatus(socket.userId, 'offline');
    }

    // Helper methods
    getSocketByUserId(userId) {
        const user = this.connectedUsers.get(userId);
        return user ? this.io.sockets.sockets.get(user.socketId) : null;
    }

    getChatRoomId(userId1, userId2) {
        return [userId1, userId2].sort().join(':');
    }

    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateCallRoomId() {
        return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    broadcastUserStatus(userId, status) {
        this.io.emit('user_status_change', {
            userId,
            status,
            timestamp: new Date(),
        });
    }

    // Message queue management
    queueMessage(userId, message) {
        if (!this.messageQueue.has(userId)) {
            this.messageQueue.set(userId, []);
        }
        this.messageQueue.get(userId).push(message);
    }

    sendQueuedMessages(socket) {
        const messages = this.messageQueue.get(socket.userId);
        if (messages && messages.length > 0) {
            messages.forEach(message => {
                socket.emit('new_message', message);
            });
            this.messageQueue.delete(socket.userId);
        }
    }

    // Broadcast to all users
    broadcast(event, data) {
        this.io.emit(event, data);
    }

    // Broadcast to specific room
    broadcastToRoom(roomId, event, data) {
        this.io.to(roomId).emit(event, data);
    }

    // Send to specific user
    sendToUser(userId, event, data) {
        const socket = this.getSocketByUserId(userId);
        if (socket) {
            socket.emit(event, data);
        }
    }

    // Get statistics
    getStats() {
        return {
            connectedUsers: this.connectedUsers.size,
            activeRooms: this.rooms.size,
            queuedMessages: Array.from(this.messageQueue.values()).reduce((sum, messages) => sum + messages.length, 0),
        };
    }

    // Cleanup
    cleanup() {
        if (this.io) {
            this.io.close();
            logger.info('Socket.io server closed');
        }
    }
}

// Create and export singleton instance
const socketConfig = new SocketConfig();
export default socketConfig;
