
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
