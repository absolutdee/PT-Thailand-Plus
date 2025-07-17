// Frontend/utils/api.js
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from './constants';

// สร้าง axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - เพิ่ม auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - จัดการ error และ token expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        
        const { token } = response.data;
        localStorage.setItem('authToken', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token หมดอายุ - logout user
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function สำหรับ set auth token
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Auth API
export const authAPI = {
  login: (credentials) => api.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
  register: (userData) => api.post(API_ENDPOINTS.AUTH.REGISTER, userData),
  logout: () => api.post(API_ENDPOINTS.AUTH.LOGOUT),
  verifyToken: () => api.get(API_ENDPOINTS.AUTH.VERIFY),
  updateProfile: (data) => api.put(API_ENDPOINTS.AUTH.PROFILE, data),
  changePassword: (data) => api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data),
  forgotPassword: (email) => api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }),
  resetPassword: (token, password) => api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, password }),
};

// Trainer API
export const trainerAPI = {
  getAll: (params) => api.get(API_ENDPOINTS.TRAINERS.LIST, { params }),
  getById: (id) => api.get(API_ENDPOINTS.TRAINERS.DETAIL(id)),
  search: (query) => api.get(API_ENDPOINTS.TRAINERS.SEARCH, { params: { q: query } }),
  getPackages: (trainerId) => api.get(API_ENDPOINTS.TRAINERS.PACKAGES(trainerId)),
  createPackage: (data) => api.post(API_ENDPOINTS.TRAINERS.CREATE_PACKAGE, data),
  updatePackage: (packageId, data) => api.put(API_ENDPOINTS.TRAINERS.UPDATE_PACKAGE(packageId), data),
  deletePackage: (packageId) => api.delete(API_ENDPOINTS.TRAINERS.DELETE_PACKAGE(packageId)),
  uploadImages: (formData) => api.post(API_ENDPOINTS.TRAINERS.UPLOAD_IMAGES, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteImage: (imageId) => api.delete(API_ENDPOINTS.TRAINERS.DELETE_IMAGE(imageId)),
  updateSchedule: (schedule) => api.put(API_ENDPOINTS.TRAINERS.UPDATE_SCHEDULE, schedule),
  getReviews: (trainerId) => api.get(API_ENDPOINTS.TRAINERS.REVIEWS(trainerId)),
  getDashboardStats: () => api.get(API_ENDPOINTS.TRAINERS.DASHBOARD_STATS),
};

// Customer API
export const customerAPI = {
  getDashboard: () => api.get(API_ENDPOINTS.CUSTOMERS.DASHBOARD),
  getTrainingPlans: () => api.get(API_ENDPOINTS.CUSTOMERS.TRAINING_PLANS),
  getProgress: () => api.get(API_ENDPOINTS.CUSTOMERS.PROGRESS),
  updateHealthData: (data) => api.post(API_ENDPOINTS.CUSTOMERS.HEALTH_DATA, data),
  getHealthHistory: () => api.get(API_ENDPOINTS.CUSTOMERS.HEALTH_HISTORY),
  getAchievements: () => api.get(API_ENDPOINTS.CUSTOMERS.ACHIEVEMENTS),
  getNutritionPlans: () => api.get(API_ENDPOINTS.CUSTOMERS.NUTRITION_PLANS),
};

// Booking API
export const bookingAPI = {
  getAll: () => api.get(API_ENDPOINTS.BOOKINGS.LIST),
  getById: (id) => api.get(API_ENDPOINTS.BOOKINGS.DETAIL(id)),
  create: (data) => api.post(API_ENDPOINTS.BOOKINGS.CREATE, data),
  update: (id, data) => api.put(API_ENDPOINTS.BOOKINGS.UPDATE(id), data),
  confirm: (id) => api.post(API_ENDPOINTS.BOOKINGS.CONFIRM(id)),
  cancel: (id, data) => api.post(API_ENDPOINTS.BOOKINGS.CANCEL(id), data),
  reschedule: (id, data) => api.post(API_ENDPOINTS.BOOKINGS.RESCHEDULE(id), data),
  getAvailableSlots: (trainerId, date) => 
    api.get(API_ENDPOINTS.BOOKINGS.AVAILABLE_SLOTS(trainerId), { params: { date } }),
  completeSession: (id, data) => api.post(API_ENDPOINTS.BOOKINGS.COMPLETE_SESSION(id), data),
};

// Chat API
export const chatAPI = {
  getConversations: () => api.get(API_ENDPOINTS.CHAT.CONVERSATIONS),
  getMessages: (conversationId) => api.get(API_ENDPOINTS.CHAT.MESSAGES(conversationId)),
  sendMessage: (conversationId, data) => api.post(API_ENDPOINTS.CHAT.SEND_MESSAGE(conversationId), data),
  createConversation: (participantId) => api.post(API_ENDPOINTS.CHAT.CREATE_CONVERSATION, { participantId }),
  markAsRead: (conversationId) => api.post(API_ENDPOINTS.CHAT.MARK_AS_READ(conversationId)),
  uploadFile: (conversationId, formData) => 
    api.post(API_ENDPOINTS.CHAT.UPLOAD_FILE(conversationId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

// Notification API
export const notificationAPI = {
  getAll: () => api.get(API_ENDPOINTS.NOTIFICATIONS.LIST),
  markAsRead: (id) => api.post(API_ENDPOINTS.NOTIFICATIONS.MARK_AS_READ(id)),
  markAllAsRead: () => api.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_AS_READ),
  delete: (id) => api.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id)),
  clearAll: () => api.delete(API_ENDPOINTS.NOTIFICATIONS.CLEAR_ALL),
  updateSettings: (settings) => api.put(API_ENDPOINTS.NOTIFICATIONS.SETTINGS, settings),
};

// Review API
export const reviewAPI = {
  create: (data) => api.post(API_ENDPOINTS.REVIEWS.CREATE, data),
  update: (id, data) => api.put(API_ENDPOINTS.REVIEWS.UPDATE(id), data),
  delete: (id) => api.delete(API_ENDPOINTS.REVIEWS.DELETE(id)),
  getByTrainer: (trainerId) => api.get(API_ENDPOINTS.REVIEWS.BY_TRAINER(trainerId)),
  getByCustomer: (customerId) => api.get(API_ENDPOINTS.REVIEWS.BY_CUSTOMER(customerId)),
};

// Payment API
export const paymentAPI = {
  createPaymentIntent: (data) => api.post(API_ENDPOINTS.PAYMENTS.CREATE_INTENT, data),
  confirmPayment: (paymentId, data) => api.post(API_ENDPOINTS.PAYMENTS.CONFIRM(paymentId), data),
  getHistory: () => api.get(API_ENDPOINTS.PAYMENTS.HISTORY),
  getInvoice: (paymentId) => api.get(API_ENDPOINTS.PAYMENTS.INVOICE(paymentId)),
  createPromptPayQR: (data) => api.post(API_ENDPOINTS.PAYMENTS.PROMPTPAY_QR, data),
  verifyBankTransfer: (data) => api.post(API_ENDPOINTS.PAYMENTS.VERIFY_BANK_TRANSFER, data),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get(API_ENDPOINTS.ADMIN.DASHBOARD),
  getUsers: (params) => api.get(API_ENDPOINTS.ADMIN.USERS, { params }),
  updateUser: (userId, data) => api.put(API_ENDPOINTS.ADMIN.UPDATE_USER(userId), data),
  suspendUser: (userId, reason) => api.post(API_ENDPOINTS.ADMIN.SUSPEND_USER(userId), { reason }),
  getReports: (params) => api.get(API_ENDPOINTS.ADMIN.REPORTS, { params }),
  getFinancials: (params) => api.get(API_ENDPOINTS.ADMIN.FINANCIALS, { params }),
  getSystemSettings: () => api.get(API_ENDPOINTS.ADMIN.SETTINGS),
  updateSystemSettings: (settings) => api.put(API_ENDPOINTS.ADMIN.UPDATE_SETTINGS, settings),
};

// Content API (Blog, Events, Gym)
export const contentAPI = {
  // Blog
  getArticles: (params) => api.get(API_ENDPOINTS.CONTENT.ARTICLES, { params }),
  getArticle: (id) => api.get(API_ENDPOINTS.CONTENT.ARTICLE_DETAIL(id)),
  createArticle: (data) => api.post(API_ENDPOINTS.CONTENT.CREATE_ARTICLE, data),
  updateArticle: (id, data) => api.put(API_ENDPOINTS.CONTENT.UPDATE_ARTICLE(id), data),
  deleteArticle: (id) => api.delete(API_ENDPOINTS.CONTENT.DELETE_ARTICLE(id)),
  
  // Events
  getEvents: (params) => api.get(API_ENDPOINTS.CONTENT.EVENTS, { params }),
  getEvent: (id) => api.get(API_ENDPOINTS.CONTENT.EVENT_DETAIL(id)),
  createEvent: (data) => api.post(API_ENDPOINTS.CONTENT.CREATE_EVENT, data),
  updateEvent: (id, data) => api.put(API_ENDPOINTS.CONTENT.UPDATE_EVENT(id), data),
  deleteEvent: (id) => api.delete(API_ENDPOINTS.CONTENT.DELETE_EVENT(id)),
  registerEvent: (eventId) => api.post(API_ENDPOINTS.CONTENT.REGISTER_EVENT(eventId)),
  
  // Gyms
  getGyms: (params) => api.get(API_ENDPOINTS.CONTENT.GYMS, { params }),
  getGym: (id) => api.get(API_ENDPOINTS.CONTENT.GYM_DETAIL(id)),
  searchNearbyGyms: (lat, lng, radius) => 
    api.get(API_ENDPOINTS.CONTENT.NEARBY_GYMS, { params: { lat, lng, radius } }),
};

// Upload API
export const uploadAPI = {
  uploadImage: (formData) => api.post(API_ENDPOINTS.UPLOAD.IMAGE, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadDocument: (formData) => api.post(API_ENDPOINTS.UPLOAD.DOCUMENT, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteFile: (fileId) => api.delete(API_ENDPOINTS.UPLOAD.DELETE(fileId)),
};

export default api;

// Frontend/utils/constants.js
// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    VERIFY: '/auth/verify',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // Trainers
  TRAINERS: {
    LIST: '/trainers',
    DETAIL: (id) => `/trainers/${id}`,
    SEARCH: '/trainers/search',
    PACKAGES: (trainerId) => `/trainers/${trainerId}/packages`,
    CREATE_PACKAGE: '/trainers/packages',
    UPDATE_PACKAGE: (packageId) => `/trainers/packages/${packageId}`,
    DELETE_PACKAGE: (packageId) => `/trainers/packages/${packageId}`,
    UPLOAD_IMAGES: '/trainers/images',
    DELETE_IMAGE: (imageId) => `/trainers/images/${imageId}`,
    UPDATE_SCHEDULE: '/trainers/schedule',
    REVIEWS: (trainerId) => `/trainers/${trainerId}/reviews`,
    DASHBOARD_STATS: '/trainers/dashboard/stats',
  },
  
  // Customers
  CUSTOMERS: {
    DASHBOARD: '/customers/dashboard',
    TRAINING_PLANS: '/customers/training-plans',
    PROGRESS: '/customers/progress',
    HEALTH_DATA: '/customers/health-data',
    HEALTH_HISTORY: '/customers/health-history',
    ACHIEVEMENTS: '/customers/achievements',
    NUTRITION_PLANS: '/customers/nutrition-plans',
  },
  
  // Bookings
  BOOKINGS: {
    LIST: '/bookings',
    DETAIL: (id) => `/bookings/${id}`,
    CREATE: '/bookings',
    UPDATE: (id) => `/bookings/${id}`,
    CONFIRM: (id) => `/bookings/${id}/confirm`,
    CANCEL: (id) => `/bookings/${id}/cancel`,
    RESCHEDULE: (id) => `/bookings/${id}/reschedule`,
    AVAILABLE_SLOTS: (trainerId) => `/bookings/available-slots/${trainerId}`,
    COMPLETE_SESSION: (id) => `/bookings/${id}/complete`,
  },
  
  // Chat
  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    MESSAGES: (conversationId) => `/chat/conversations/${conversationId}/messages`,
    SEND_MESSAGE: (conversationId) => `/chat/conversations/${conversationId}/messages`,
    CREATE_CONVERSATION: '/chat/conversations',
    MARK_AS_READ: (conversationId) => `/chat/conversations/${conversationId}/read`,
    UPLOAD_FILE: (conversationId) => `/chat/conversations/${conversationId}/upload`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_AS_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_AS_READ: '/notifications/read-all',
    DELETE: (id) => `/notifications/${id}`,
    CLEAR_ALL: '/notifications',
    SETTINGS: '/notifications/settings',
  },
  
  // Reviews
  REVIEWS: {
    CREATE: '/reviews',
    UPDATE: (id) => `/reviews/${id}`,
    DELETE: (id) => `/reviews/${id}`,
    BY_TRAINER: (trainerId) => `/reviews/trainer/${trainerId}`,
    BY_CUSTOMER: (customerId) => `/reviews/customer/${customerId}`,
  },
  
  // Payments
  PAYMENTS: {
    CREATE_INTENT: '/payments/create-intent',
    CONFIRM: (paymentId) => `/payments/${paymentId}/confirm`,
    HISTORY: '/payments/history',
    INVOICE: (paymentId) => `/payments/${paymentId}/invoice`,
    PROMPTPAY_QR: '/payments/promptpay-qr',
    VERIFY_BANK_TRANSFER: '/payments/verify-bank-transfer',
  },
  
  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    UPDATE_USER: (userId) => `/admin/users/${userId}`,
    SUSPEND_USER: (userId) => `/admin/users/${userId}/suspend`,
    REPORTS: '/admin/reports',
    FINANCIALS: '/admin/financials',
    SETTINGS: '/admin/settings',
    UPDATE_SETTINGS: '/admin/settings',
  },
  
  // Content
  CONTENT: {
    ARTICLES: '/content/articles',
    ARTICLE_DETAIL: (id) => `/content/articles/${id}`,
    CREATE_ARTICLE: '/content/articles',
    UPDATE_ARTICLE: (id) => `/content/articles/${id}`,
    DELETE_ARTICLE: (id) => `/content/articles/${id}`,
    EVENTS: '/content/events',
    EVENT_DETAIL: (id) => `/content/events/${id}`,
    CREATE_EVENT: '/content/events',
    UPDATE_EVENT: (id) => `/content/events/${id}`,
    DELETE_EVENT: (id) => `/content/events/${id}`,
    REGISTER_EVENT: (eventId) => `/content/events/${eventId}/register`,
    GYMS: '/content/gyms',
    GYM_DETAIL: (id) => `/content/gyms/${id}`,
    NEARBY_GYMS: '/content/gyms/nearby',
  },
  
  // Upload
  UPLOAD: {
    IMAGE: '/upload/image',
    DOCUMENT: '/upload/document',
    DELETE: (fileId) => `/upload/${fileId}`,
  },
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'FitConnect',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@fitconnect.com',
  
  // Limits
  MAX_TRAINER_IMAGES: 12,
  MAX_TRAINER_PACKAGES: 3,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf'],
  
  // Timeouts
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  NOTIFICATION_TIMEOUT: 5000, // 5 seconds
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Maps
  DEFAULT_MAP_CENTER: { lat: 13.7563, lng: 100.5018 }, // Bangkok
  DEFAULT_MAP_ZOOM: 12,
  
  // Chat
  MESSAGE_MAX_LENGTH: 1000,
  TYPING_INDICATOR_TIMEOUT: 3000,
  
  // Booking
  MIN_BOOKING_ADVANCE: 24, // hours
  MAX_BOOKING_ADVANCE: 30, // days
  CANCELLATION_DEADLINE: 24, // hours before session
  
  // Review
  MIN_REVIEW_LENGTH: 10,
  MAX_REVIEW_LENGTH: 500,
};

// Theme Colors
export const THEME_COLORS = {
  primary: '#232956',
  secondary: '#df2528',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40',
  white: '#ffffff',
  black: '#000000',
  
  // Gradients
  primaryGradient: 'linear-gradient(135deg, #232956 0%, #1a1f3a 100%)',
  secondaryGradient: 'linear-gradient(135deg, #df2528 0%, #c41e1e 100%)',
};

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  TRAINER: 'trainer',
  ADMIN: 'admin',
};

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// Package Types
export const PACKAGE_TYPES = {
  SINGLE_SESSION: 'single_session',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  CUSTOM: 'custom',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  BOOKING: 'booking',
  CHAT: 'chat',
  PAYMENT: 'payment',
  REVIEW: 'review',
  SYSTEM: 'system',
  PROMOTION: 'promotion',
};

// Activity Types
export const ACTIVITY_TYPES = {
  WEIGHT_TRAINING: 'weight_training',
  CARDIO: 'cardio',
  YOGA: 'yoga',
  PILATES: 'pilates',
  CROSSFIT: 'crossfit',
  BOXING: 'boxing',
  SWIMMING: 'swimming',
  RUNNING: 'running',
  CYCLING: 'cycling',
  FUNCTIONAL: 'functional',
  OTHER: 'other',
};

// Gender Options
export const GENDER_OPTIONS = [
  { value: 'male', label: 'ชาย' },
  { value: 'female', label: 'หญิง' },
  { value: 'other', label: 'อื่นๆ' },
];

// Experience Levels
export const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'ผู้เริ่มต้น' },
  { value: 'intermediate', label: 'ระดับกลาง' },
  { value: 'advanced', label: 'ระดับสูง' },
  { value: 'professional', label: 'มืออาชีพ' },
];

// Goals
export const FITNESS_GOALS = [
  { value: 'weight_loss', label: 'ลดน้ำหนัก' },
  { value: 'muscle_gain', label: 'เพิ่มกล้ามเนื้อ' },
  { value: 'endurance', label: 'เพิ่มความทนทาน' },
  { value: 'flexibility', label: 'เพิ่มความยืดหยุ่น' },
  { value: 'strength', label: 'เพิ่มความแข็งแรง' },
  { value: 'general_fitness', label: 'สุขภาพทั่วไป' },
  { value: 'rehabilitation', label: 'ฟื้นฟูร่างกาย' },
  { value: 'competition', label: 'เตรียมแข่งขัน' },
];

// Days of Week
export const DAYS_OF_WEEK = [
  { value: 0, label: 'อาทิตย์', short: 'อา' },
  { value: 1, label: 'จันทร์', short: 'จ' },
  { value: 2, label: 'อังคาร', short: 'อ' },
  { value: 3, label: 'พุธ', short: 'พ' },
  { value: 4, label: 'พฤหัสบดี', short: 'พฤ' },
  { value: 5, label: 'ศุกร์', short: 'ศ' },
  { value: 6, label: 'เสาร์', short: 'ส' },
];

// Time Slots
export const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return {
    value: `${hour.toString().padStart(2, '0')}:${minute}`,
    label: `${hour.toString().padStart(2, '0')}:${minute}`,
  };
});

// Social Media Platforms
export const SOCIAL_PLATFORMS = {
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
  LINE: 'line',
  TWITTER: 'twitter',
  YOUTUBE: 'youtube',
};
