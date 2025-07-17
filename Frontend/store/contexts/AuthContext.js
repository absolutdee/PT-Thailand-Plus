// Frontend/store/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../../utils/api';
import { setAuthToken } from '../../utils/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ตรวจสอบ token เมื่อโหลดแอป
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        setAuthToken(token);
        const response = await authAPI.verifyToken();
        if (response.data.valid) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          logout();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('authToken', token);
      setAuthToken(token);
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true, user };
    } catch (error) {
      setError(error.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.register(userData);
      const { token, user } = response.data;
      
      localStorage.setItem('authToken', token);
      setAuthToken(token);
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true, user };
    } catch (error) {
      setError(error.response?.data?.message || 'ลงทะเบียนไม่สำเร็จ');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const response = await authAPI.updateProfile(profileData);
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      setError(error.response?.data?.message || 'อัพเดทโปรไฟล์ไม่สำเร็จ');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    checkAuth,
    userType: user?.role, // 'customer', 'trainer', 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Frontend/store/contexts/NotificationContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { notificationAPI } from '../../utils/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({});

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);

  // เชื่อมต่อ Socket.io เมื่อ login
  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(process.env.REACT_APP_SOCKET_URL, {
        auth: {
          token: localStorage.getItem('authToken')
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to notification server');
      });

      newSocket.on('notification', handleNewNotification);
      
      setSocket(newSocket);
      fetchNotifications();

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getAll();
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // แสดง browser notification ถ้าได้รับอนุญาต
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo192.png'
      });
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationAPI.delete(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const clearAll = async () => {
    try {
      await notificationAPI.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const sendNotification = useCallback((userId, notification) => {
    if (socket) {
      socket.emit('sendNotification', { userId, notification });
    }
  }, [socket]);

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    sendNotification,
    fetchNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Frontend/store/contexts/ChatContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { chatAPI } from '../../utils/api';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const ChatContext = createContext({});

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { sendNotification } = useNotification();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(process.env.REACT_APP_SOCKET_URL + '/chat', {
        auth: {
          token: localStorage.getItem('authToken')
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to chat server');
        newSocket.emit('userOnline', user.id);
      });

      newSocket.on('newMessage', handleNewMessage);
      newSocket.on('userTyping', handleUserTyping);
      newSocket.on('userStoppedTyping', handleUserStoppedTyping);
      newSocket.on('usersOnline', setOnlineUsers);
      newSocket.on('messageRead', handleMessageRead);

      setSocket(newSocket);
      fetchConversations();

      return () => {
        newSocket.emit('userOffline', user.id);
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getConversations();
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await chatAPI.getMessages(conversationId);
      setMessages(response.data);
      setActiveConversation(conversationId);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    // อัพเดทข้อความในการสนทนาที่เปิดอยู่
    if (message.conversationId === activeConversation) {
      setMessages(prev => [...prev, message]);
    }
    
    // อัพเดทรายการการสนทนา
    setConversations(prev => {
      const index = prev.findIndex(c => c.id === message.conversationId);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          lastMessage: message,
          unreadCount: activeConversation === message.conversationId 
            ? 0 
            : (updated[index].unreadCount || 0) + 1
        };
        // เรียงลำดับให้การสนทนาล่าสุดขึ้นมาบนสุด
        return updated.sort((a, b) => 
          new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0)
        );
      }
      return prev;
    });
  };

  const sendMessage = async (conversationId, content, type = 'text') => {
    try {
      const message = {
        conversationId,
        content,
        type,
        senderId: user.id,
        createdAt: new Date().toISOString()
      };

      // ส่งข้อความผ่าน socket
      socket.emit('sendMessage', message);
      
      // บันทึกข้อความลง database
      const response = await chatAPI.sendMessage(conversationId, { content, type });
      
      // ส่ง notification ให้ผู้รับ
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        const recipientId = conversation.participants.find(p => p.id !== user.id)?.id;
        if (recipientId) {
          sendNotification(recipientId, {
            title: 'ข้อความใหม่',
            message: `${user.name}: ${content}`,
            type: 'chat',
            link: `/chat/${conversationId}`
          });
        }
      }

      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const startTyping = (conversationId) => {
    if (socket) {
      socket.emit('startTyping', { conversationId, userId: user.id });
    }
  };

  const stopTyping = (conversationId) => {
    if (socket) {
      socket.emit('stopTyping', { conversationId, userId: user.id });
    }
  };

  const handleUserTyping = ({ conversationId, userId }) => {
    setTypingUsers(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), userId]
    }));
  };

  const handleUserStoppedTyping = ({ conversationId, userId }) => {
    setTypingUsers(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).filter(id => id !== userId)
    }));
  };

  const markAsRead = async (conversationId) => {
    try {
      await chatAPI.markAsRead(conversationId);
      socket.emit('markAsRead', { conversationId, userId: user.id });
      
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const handleMessageRead = ({ conversationId, userId }) => {
    if (activeConversation === conversationId) {
      setMessages(prev =>
        prev.map(msg =>
          msg.senderId === user.id && !msg.read
            ? { ...msg, read: true }
            : msg
        )
      );
    }
  };

  const createConversation = async (participantId) => {
    try {
      const response = await chatAPI.createConversation(participantId);
      await fetchConversations();
      return response.data;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  };

  const value = {
    conversations,
    activeConversation,
    messages,
    loading,
    typingUsers,
    onlineUsers,
    fetchConversations,
    fetchMessages,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    createConversation,
    setActiveConversation
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Frontend/store/contexts/BookingContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { bookingAPI } from '../../utils/api';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const BookingContext = createContext({});

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { sendNotification } = useNotification();
  const [bookings, setBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchBookings();
    }
  }, [isAuthenticated, user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bookingAPI.getAll();
      const allBookings = response.data;
      
      setBookings(allBookings);
      
      // แยกประเภท bookings
      const now = new Date();
      const upcoming = allBookings.filter(b => new Date(b.startTime) > now);
      const past = allBookings.filter(b => new Date(b.startTime) <= now);
      
      setUpcomingBookings(upcoming);
      setPastBookings(past);
    } catch (error) {
      setError(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลการจองได้');
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (bookingData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await bookingAPI.create(bookingData);
      const newBooking = response.data;
      
      setBookings(prev => [...prev, newBooking]);
      
      // ส่ง notification ให้ trainer
      if (user.role === 'customer') {
        sendNotification(bookingData.trainerId, {
          title: 'การจองใหม่',
          message: `${user.name} ได้จองเซสชันกับคุณ`,
          type: 'booking',
          link: `/trainer/bookings/${newBooking.id}`
        });
      }
      
      await fetchBookings();
      return { success: true, booking: newBooking };
    } catch (error) {
      setError(error.response?.data?.message || 'ไม่สามารถสร้างการจองได้');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const updateBooking = async (bookingId, updateData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await bookingAPI.update(bookingId, updateData);
      const updatedBooking = response.data;
      
      setBookings(prev =>
        prev.map(booking =>
          booking.id === bookingId ? updatedBooking : booking
        )
      );
      
      await fetchBookings();
      return { success: true, booking: updatedBooking };
    } catch (error) {
      setError(error.response?.data?.message || 'ไม่สามารถอัพเดทการจองได้');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async (bookingId) => {
    try {
      const response = await bookingAPI.confirm(bookingId);
      
      // ส่ง notification ให้ customer
      const booking = bookings.find(b => b.id === bookingId);
      if (booking && user.role === 'trainer') {
        sendNotification(booking.customerId, {
          title: 'ยืนยันการจอง',
          message: `${user.name} ได้ยืนยันการจองของคุณแล้ว`,
          type: 'booking',
          link: `/customer/bookings/${bookingId}`
        });
      }
      
      await fetchBookings();
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'ไม่สามารถยืนยันการจองได้');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const cancelBooking = async (bookingId, reason) => {
    try {
      const response = await bookingAPI.cancel(bookingId, { reason });
      
      // ส่ง notification ให้อีกฝ่าย
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        const recipientId = user.role === 'trainer' 
          ? booking.customerId 
          : booking.trainerId;
        
        sendNotification(recipientId, {
          title: 'ยกเลิกการจอง',
          message: `${user.name} ได้ยกเลิกการจอง: ${reason}`,
          type: 'booking',
          link: `/bookings/${bookingId}`
        });
      }
      
      await fetchBookings();
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'ไม่สามารถยกเลิกการจองได้');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const rescheduleBooking = async (bookingId, newDateTime) => {
    try {
      const response = await bookingAPI.reschedule(bookingId, { newDateTime });
      
      // ส่ง notification
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        const recipientId = user.role === 'customer' 
          ? booking.trainerId 
          : booking.customerId;
        
        sendNotification(recipientId, {
          title: 'เลื่อนการจอง',
          message: `${user.name} ขอเลื่อนการจองไปเป็นวันที่ ${new Date(newDateTime).toLocaleString('th-TH')}`,
          type: 'booking',
          link: `/bookings/${bookingId}`
        });
      }
      
      await fetchBookings();
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'ไม่สามารถเลื่อนการจองได้');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const getAvailableSlots = async (trainerId, date) => {
    try {
      const response = await bookingAPI.getAvailableSlots(trainerId, date);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch available slots:', error);
      return [];
    }
  };

  const completeSession = async (bookingId, sessionData) => {
    try {
      const response = await bookingAPI.completeSession(bookingId, sessionData);
      
      // ส่ง notification ให้ customer
      const booking = bookings.find(b => b.id === bookingId);
      if (booking && user.role === 'trainer') {
        sendNotification(booking.customerId, {
          title: 'เซสชันเสร็จสิ้น',
          message: `${user.name} ได้บันทึกข้อมูลการเทรนของคุณแล้ว`,
          type: 'session',
          link: `/customer/sessions/${bookingId}`
        });
      }
      
      await fetchBookings();
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลเซสชันได้');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const value = {
    bookings,
    upcomingBookings,
    pastBookings,
    loading,
    error,
    fetchBookings,
    createBooking,
    updateBooking,
    confirmBooking,
    cancelBooking,
    rescheduleBooking,
    getAvailableSlots,
    completeSession
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

// Frontend/store/contexts/index.js
import React from 'react';
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import { ChatProvider } from './ChatContext';
import { BookingProvider } from './BookingContext';

export const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ChatProvider>
          <BookingProvider>
            {children}
          </BookingProvider>
        </ChatProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

// Export all hooks
export { useAuth } from './AuthContext';
export { useNotification } from './NotificationContext';
export { useChat } from './ChatContext';
export { useBooking } from './BookingContext';
