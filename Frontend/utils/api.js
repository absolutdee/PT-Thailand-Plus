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
