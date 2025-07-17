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
