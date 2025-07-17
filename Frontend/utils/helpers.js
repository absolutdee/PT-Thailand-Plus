// Frontend/utils/helpers.js
import { APP_CONFIG, BOOKING_STATUS } from './constants';

// Date & Time Helpers
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '';
  const d = new Date(date);
  
  const formats = {
    'DD/MM/YYYY': `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`,
    'YYYY-MM-DD': `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`,
    'DD MMM YYYY': d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
    'full': d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  };
  
  return formats[format] || formats['DD/MM/YYYY'];
};

export const formatTime = (time, format = '24h') => {
  if (!time) return '';
  const d = new Date(`2000-01-01T${time}`);
  
  if (format === '12h') {
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  const d = new Date(dateTime);
  return d.toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getRelativeTime = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'เมื่อสักครู่';
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} สัปดาห์ที่แล้ว`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} เดือนที่แล้ว`;
  return `${Math.floor(diffDays / 365)} ปีที่แล้ว`;
};

export const isToday = (date) => {
  const today = new Date();
  const compareDate = new Date(date);
  return today.toDateString() === compareDate.toDateString();
};

export const isTomorrow = (date) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const compareDate = new Date(date);
  return tomorrow.toDateString() === compareDate.toDateString();
};

export const isPast = (date) => {
  return new Date(date) < new Date();
};

export const isFuture = (date) => {
  return new Date(date) > new Date();
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const getDaysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

// Number & Currency Helpers
export const formatCurrency = (amount, currency = 'THB') => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (number, decimals = 0) => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

export const formatPercentage = (value, decimals = 0) => {
  return `${formatNumber(value, decimals)}%`;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// String Helpers
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + suffix;
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const getInitials = (name) => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
};

export const maskPhoneNumber = (phone) => {
  if (!phone || phone.length < 10) return phone;
  return `${phone.slice(0, 3)}-xxx-${phone.slice(-4)}`;
};

export const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [username, domain] = email.split('@');
  const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
  return `${maskedUsername}@${domain}`;
};

// Array & Object Helpers
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
};

export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    if (order === 'asc') {
      return a[key] > b[key] ? 1 : -1;
    }
    return a[key] < b[key] ? 1 : -1;
  });
};

export const unique = (array, key) => {
  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }
  return [...new Set(array)];
};

export const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// URL & Query Helpers
export const buildQueryString = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, value);
    }
  });
  return query.toString();
};

export const parseQueryString = (queryString) => {
  const params = new URLSearchParams(queryString);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
};

export const updateQueryParams = (updates) => {
  const url = new URL(window.location);
  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });
  window.history.pushState({}, '', url);
};

// Image Helpers
export const getImageUrl = (path) => {
  if (!path) return '/images/placeholder.jpg';
  if (path.startsWith('http')) return path;
  return `${process.env.REACT_APP_API_URL}/uploads/${path}`;
};

export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Booking Helpers
export const canCancelBooking = (booking) => {
  if (booking.status !== BOOKING_STATUS.CONFIRMED) return false;
  const hoursUntilSession = getDaysBetween(new Date(), new Date(booking.startTime)) * 24;
  return hoursUntilSession >= APP_CONFIG.CANCELLATION_DEADLINE;
};

export const getBookingStatusColor = (status) => {
  const colors = {
    [BOOKING_STATUS.PENDING]: 'warning',
    [BOOKING_STATUS.CONFIRMED]: 'success',
    [BOOKING_STATUS.CANCELLED]: 'danger',
    [BOOKING_STATUS.COMPLETED]: 'info',
    [BOOKING_STATUS.NO_SHOW]: 'secondary',
  };
  return colors[status] || 'secondary';
};

export const getBookingStatusText = (status) => {
  const texts = {
    [BOOKING_STATUS.PENDING]: 'รอยืนยัน',
    [BOOKING_STATUS.CONFIRMED]: 'ยืนยันแล้ว',
    [BOOKING_STATUS.CANCELLED]: 'ยกเลิก',
    [BOOKING_STATUS.COMPLETED]: 'เสร็จสิ้น',
    [BOOKING_STATUS.NO_SHOW]: 'ไม่มา',
  };
  return texts[status] || status;
};

// Rating Helpers
export const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / reviews.length).toFixed(1);
};

export const getRatingDistribution = (reviews) => {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(review => {
    distribution[review.rating]++;
  });
  return distribution;
};

// Storage Helpers
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// Session Storage Helpers
export const sessionStorage = {
  get: (key) => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return null;
    }
  },
  
  set: (key, value) => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to sessionStorage:', error);
    }
  },
  
  remove: (key) => {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
    }
  },
  
  clear: () => {
    try {
      window.sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
  },
};

// Debounce & Throttle
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Copy to Clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (error) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

// Device Detection
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

export const isAndroid = () => {
  return /Android/i.test(navigator.userAgent);
};

// Browser Notification
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

export const showNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo192.png',
      badge: '/logo192.png',
      ...options,
    });
  }
};

// Frontend/utils/validators.js
import { APP_CONFIG } from './constants';

// Basic Validators
export const required = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'ข้อมูลนี้จำเป็น';
  }
  if (typeof value === 'string' && value.trim() === '') {
    return 'ข้อมูลนี้จำเป็น';
  }
  return null;
};

export const minLength = (min) => (value) => {
  if (!value) return null;
  if (value.length < min) {
    return `ต้องมีอย่างน้อย ${min} ตัวอักษร`;
  }
  return null;
};

export const maxLength = (max) => (value) => {
  if (!value) return null;
  if (value.length > max) {
    return `ต้องไม่เกิน ${max} ตัวอักษร`;
  }
  return null;
};

export const minValue = (min) => (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (Number(value) < min) {
    return `ต้องมีค่าอย่างน้อย ${min}`;
  }
  return null;
};

export const maxValue = (max) => (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (Number(value) > max) {
    return `ต้องไม่เกิน ${max}`;
  }
  return null;
};

export const between = (min, max) => (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (num < min || num > max) {
    return `ต้องอยู่ระหว่าง ${min} ถึง ${max}`;
  }
  return null;
};

// Email Validator
export const email = (value) => {
  if (!value) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'รูปแบบอีเมลไม่ถูกต้อง';
  }
  return null;
};

// Phone Number Validators
export const phoneNumber = (value) => {
  if (!value) return null;
  const phoneRegex = /^0[0-9]{9}$/;
  if (!phoneRegex.test(value.replace(/[-\s]/g, ''))) {
    return 'เบอร์โทรศัพท์ไม่ถูกต้อง (ตัวอย่าง: 0812345678)';
  }
  return null;
};

export const mobileNumber = (value) => {
  if (!value) return null;
  const mobileRegex = /^0[689][0-9]{8}$/;
  if (!mobileRegex.test(value.replace(/[-\s]/g, ''))) {
    return 'เบอร์มือถือไม่ถูกต้อง';
  }
  return null;
};

// Password Validators
export const password = (value) => {
  if (!value) return null;
  
  const errors = [];
  if (value.length < 8) {
    errors.push('ต้องมีอย่างน้อย 8 ตัวอักษร');
  }
  if (!/[A-Z]/.test(value)) {
    errors.push('ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว');
  }
  if (!/[a-z]/.test(value)) {
    errors.push('ต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว');
  }
  if (!/[0-9]/.test(value)) {
    errors.push('ต้องมีตัวเลขอย่างน้อย 1 ตัว');
  }
  if (!/[!@#$%^&*]/.test(value)) {
    errors.push('ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว');
  }
  
  return errors.length > 0 ? errors.join(', ') : null;
};

export const confirmPassword = (passwordField) => (value, formData) => {
  if (!value) return null;
  if (value !== formData[passwordField]) {
    return 'รหัสผ่านไม่ตรงกัน';
  }
  return null;
};

// ID Card Validator
export const idCard = (value) => {
  if (!value) return null;
  
  const cleaned = value.replace(/[-\s]/g, '');
  if (cleaned.length !== 13) {
    return 'เลขบัตรประชาชนต้องมี 13 หลัก';
  }
  
  // Thai ID card checksum validation
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;
  
  if (checkDigit !== parseInt(cleaned[12])) {
    return 'เลขบัตรประชาชนไม่ถูกต้อง';
  }
  
  return null;
};

// URL Validator
export const url = (value) => {
  if (!value) return null;
  
  try {
    new URL(value);
    return null;
  } catch (error) {
    return 'URL ไม่ถูกต้อง';
  }
};

// Date Validators
export const date = (value) => {
  if (!value) return null;
  
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return 'วันที่ไม่ถูกต้อง';
  }
  return null;
};

export const dateInFuture = (value) => {
  if (!value) return null;
  
  const date = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (date < today) {
    return 'ต้องเป็นวันที่ในอนาคต';
  }
  return null;
};

export const dateInPast = (value) => {
  if (!value) return null;
  
  const date = new Date(value);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (date > today) {
    return 'ต้องเป็นวันที่ในอดีต';
  }
  return null;
};

export const age = (minAge, maxAge) => (value) => {
  if (!value) return null;
  
  const birthDate = new Date(value);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  if (age < minAge) {
    return `อายุต้องมากกว่า ${minAge} ปี`;
  }
  if (maxAge && age > maxAge) {
    return `อายุต้องไม่เกิน ${maxAge} ปี`;
  }
  
  return null;
};

// File Validators
export const fileSize = (maxSizeMB) => (file) => {
  if (!file) return null;
  
  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  if (file.size > maxSize) {
    return `ขนาดไฟล์ต้องไม่เกิน ${maxSizeMB} MB`;
  }
  return null;
};

export const fileType = (allowedTypes) => (file) => {
  if (!file) return null;
  
  if (!allowedTypes.includes(file.type)) {
    return `ประเภทไฟล์ไม่ถูกต้อง (อนุญาตเฉพาะ: ${allowedTypes.join(', ')})`;
  }
  return null;
};

export const imageFile = (file) => {
  if (!file) return null;
  
  const validTypes = APP_CONFIG.ALLOWED_IMAGE_TYPES;
  if (!validTypes.includes(file.type)) {
    return 'อนุญาตเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP)';
  }
  
  if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
    return `ขนาดรูปภาพต้องไม่เกิน ${APP_CONFIG.MAX_FILE_SIZE / (1024 * 1024)} MB`;
  }
  
  return null;
};

// Array Validators
export const arrayMinLength = (min) => (value) => {
  if (!value || !Array.isArray(value)) return null;
  
  if (value.length < min) {
    return `ต้องมีอย่างน้อย ${min} รายการ`;
  }
  return null;
};

export const arrayMaxLength = (max) => (value) => {
  if (!value || !Array.isArray(value)) return null;
  
  if (value.length > max) {
    return `ต้องไม่เกิน ${max} รายการ`;
  }
  return null;
};

// Custom Business Validators
export const trainerPackages = (packages) => {
  if (!packages || !Array.isArray(packages)) return null;
  
  if (packages.length > APP_CONFIG.MAX_TRAINER_PACKAGES) {
    return `สามารถสร้างแพ็คเกจได้ไม่เกิน ${APP_CONFIG.MAX_TRAINER_PACKAGES} แพ็คเกจ`;
  }
  
  const recommendedCount = packages.filter(p => p.recommended).length;
  if (recommendedCount > 1) {
    return 'สามารถเลือกแพ็คเกจแนะนำได้เพียง 1 แพ็คเกจ';
  }
  
  return null;
};

export const bookingTime = (value, formData) => {
  if (!value) return null;
  
  const bookingDate = new Date(`${formData.date} ${value}`);
  const now = new Date();
  const hoursInAdvance = (bookingDate - now) / (1000 * 60 * 60);
  
  if (hoursInAdvance < APP_CONFIG.MIN_BOOKING_ADVANCE) {
    return `ต้องจองล่วงหน้าอย่างน้อย ${APP_CONFIG.MIN_BOOKING_ADVANCE} ชั่วโมง`;
  }
  
  const daysInAdvance = hoursInAdvance / 24;
  if (daysInAdvance > APP_CONFIG.MAX_BOOKING_ADVANCE) {
    return `สามารถจองล่วงหน้าได้ไม่เกิน ${APP_CONFIG.MAX_BOOKING_ADVANCE} วัน`;
  }
  
  return null;
};

export const reviewText = (value) => {
  if (!value) return null;
  
  const trimmed = value.trim();
  if (trimmed.length < APP_CONFIG.MIN_REVIEW_LENGTH) {
    return `รีวิวต้องมีอย่างน้อย ${APP_CONFIG.MIN_REVIEW_LENGTH} ตัวอักษร`;
  }
  
  if (trimmed.length > APP_CONFIG.MAX_REVIEW_LENGTH) {
    return `รีวิวต้องไม่เกิน ${APP_CONFIG.MAX_REVIEW_LENGTH} ตัวอักษร`;
  }
  
  return null;
};

// Form Validation Helper
export const validateForm = (formData, validationRules) => {
  const errors = {};
  
  Object.entries(validationRules).forEach(([field, rules]) => {
    const value = formData[field];
    const fieldRules = Array.isArray(rules) ? rules : [rules];
    
    for (const rule of fieldRules) {
      const error = typeof rule === 'function' 
        ? rule(value, formData) 
        : null;
      
      if (error) {
        errors[field] = error;
        break; // Stop at first error
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Async Validators
export const createAsyncValidator = (validatorFn, debounceMs = 300) => {
  let timeoutId;
  
  return (value) => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        try {
          const error = await validatorFn(value);
          resolve(error);
        } catch (error) {
          resolve('เกิดข้อผิดพลาดในการตรวจสอบ');
        }
      }, debounceMs);
    });
  };
};

// Example async validator
export const checkEmailExists = createAsyncValidator(async (email) => {
  if (!email) return null;
  
  // This would be an API call in real implementation
  const response = await fetch(`/api/auth/check-email?email=${email}`);
  const data = await response.json();
  
  if (data.exists) {
    return 'อีเมลนี้ถูกใช้งานแล้ว';
  }
  
  return null;
});
