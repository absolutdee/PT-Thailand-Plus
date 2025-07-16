// utils/validationUtils.js
const validator = require('validator');

const validationUtils = {
  // Validate Email
  isValidEmail: (email) => {
    return validator.isEmail(email);
  },

  // Validate Thai Phone Number
  isValidThaiPhone: (phone) => {
    // Remove spaces and dashes
    const cleaned = phone.replace(/[\s-]/g, '');
    
    // Thai phone patterns: 08x-xxx-xxxx, 09x-xxx-xxxx, 06x-xxx-xxxx
    const thaiMobilePattern = /^(08|09|06)\d{8}$/;
    const thaiMobileWithCountryCode = /^(\+66|66)(8|9|6)\d{8}$/;
    const thaiMobileWithZero = /^0(8|9|6)\d{8}$/;
    
    return thaiMobilePattern.test(cleaned) || 
           thaiMobileWithCountryCode.test(cleaned) || 
           thaiMobileWithZero.test(cleaned);
  },

  // Format Thai Phone Number
  formatThaiPhone: (phone) => {
    const cleaned = phone.replace(/[\s-]/g, '');
    
    if (cleaned.startsWith('+66')) {
      const number = cleaned.substring(3);
      return `+66 ${number.substring(0, 1)} ${number.substring(1, 5)} ${number.substring(5)}`;
    } else if (cleaned.startsWith('66')) {
      const number = cleaned.substring(2);
      return `+66 ${number.substring(0, 1)} ${number.substring(1, 5)} ${number.substring(5)}`;
    } else if (cleaned.startsWith('0')) {
      const number = cleaned.substring(1);
      return `0${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5)}`;
    }
    
    return phone;
  },

  // Validate Password Strength
  validatePassword: (password) => {
    const minLength = 8;
    const errors = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: calculatePasswordStrength(password)
    };
  },

  // Calculate Password Strength
  calculatePasswordStrength: (password) => {
    let strength = 0;

    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

    const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return {
      score: strength,
      level: strengthLevels[Math.min(strength, strengthLevels.length - 1)]
    };
  },

  // Validate Thai ID Card
  isValidThaiID: (id) => {
    if (!id || id.length !== 13) return false;

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(id[i]) * (13 - i);
    }

    const checkDigit = (11 - (sum % 11)) % 10;
    return checkDigit === parseInt(id[12]);
  },

  // Validate Date
  isValidDate: (date, format = 'YYYY-MM-DD') => {
    return validator.isDate(date, { format });
  },

  // Validate Age
  isValidAge: (birthDate, minAge = 18, maxAge = 100) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age >= minAge && age <= maxAge;
  },

  // Validate URL
  isValidURL: (url) => {
    return validator.isURL(url);
  },

  // Validate Image File
  isValidImageFile: (filename) => {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return validExtensions.includes(ext);
  },

  // Validate File Size
  isValidFileSize: (sizeInBytes, maxSizeInMB = 10) => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return sizeInBytes <= maxSizeInBytes;
  },

  // Sanitize Input
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  },

  // Validate Price
  isValidPrice: (price) => {
    return !isNaN(price) && price >= 0 && price <= 999999.99;
  },

  // Validate Coordinates
  isValidCoordinates: (lat, lng) => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  },

  // Validate Thai Postal Code
  isValidThaiPostalCode: (postalCode) => {
    return /^\d{5}$/.test(postalCode);
  },

  // Validate Time Format
  isValidTime: (time, format = '24') => {
    if (format === '24') {
      return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
    } else {
      return /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM|am|pm)$/.test(time);
    }
  },

  // Validate Username
  isValidUsername: (username) => {
    // Username: 3-20 characters, alphanumeric and underscore only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  },

  // Validate Bank Account (Thai)
  isValidThaiBankAccount: (accountNumber, bankCode) => {
    const bankFormats = {
      'SCB': /^\d{10}$/, // Siam Commercial Bank
      'KBANK': /^\d{10}$/, // Kasikorn Bank
      'BBL': /^\d{10}$/, // Bangkok Bank
      'KTB': /^\d{10}$/, // Krung Thai Bank
      'TMB': /^\d{10}$/, // TMB Bank
      'BAY': /^\d{10}$/, // Bank of Ayudhya
      'GSB': /^\d{12}$/, // Government Savings Bank
      'BAAC': /^\d{11}$/ // Bank for Agriculture
    };

    if (bankFormats[bankCode]) {
      return bankFormats[bankCode].test(accountNumber);
    }

    // Default validation for unknown banks
    return /^\d{10,15}$/.test(accountNumber);
  },

  // Validate JSON
  isValidJSON: (str) => {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Validate Hex Color
  isValidHexColor: (color) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  },

  // Validate Workout Duration
  isValidWorkoutDuration: (minutes) => {
    return !isNaN(minutes) && minutes >= 15 && minutes <= 480; // 15 mins to 8 hours
  },

  // Validate Calories
  isValidCalories: (calories) => {
    return !isNaN(calories) && calories >= 0 && calories <= 10000;
  },

  // Clean HTML
  cleanHTML: (html) => {
    // Remove script tags and event handlers
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/on\w+='[^']*'/g, '');
  },

  // Validate Package Duration
  isValidPackageDuration: (days) => {
    const validDurations = [1, 7, 14, 30, 60, 90, 180, 365];
    return validDurations.includes(parseInt(days));
  },

  // Validate Session Times
  isValidSessionTime: (startTime, endTime) => {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
    return start < end && (end - start) >= 30 * 60 * 1000; // Minimum 30 minutes
  },

  // Validate Rating
  isValidRating: (rating) => {
    return !isNaN(rating) && rating >= 1 && rating <= 5;
  },

  // Batch Validation
  validateFields: (data, rules) => {
    const errors = {};
    
    for (const field in rules) {
      const value = data[field];
      const fieldRules = rules[field];
      
      if (fieldRules.required && !value) {
        errors[field] = `${field} is required`;
        continue;
      }
      
      if (value && fieldRules.type) {
        switch (fieldRules.type) {
          case 'email':
            if (!validationUtils.isValidEmail(value)) {
              errors[field] = 'Invalid email format';
            }
            break;
          case 'phone':
            if (!validationUtils.isValidThaiPhone(value)) {
              errors[field] = 'Invalid phone number';
            }
            break;
          case 'number':
            if (isNaN(value)) {
              errors[field] = 'Must be a number';
            }
            break;
          case 'date':
            if (!validationUtils.isValidDate(value)) {
              errors[field] = 'Invalid date format';
            }
            break;
        }
      }
      
      if (value && fieldRules.min && value.length < fieldRules.min) {
        errors[field] = `Minimum length is ${fieldRules.min}`;
      }
      
      if (value && fieldRules.max && value.length > fieldRules.max) {
        errors[field] = `Maximum length is ${fieldRules.max}`;
      }
      
      if (value && fieldRules.custom) {
        const customError = fieldRules.custom(value);
        if (customError) {
          errors[field] = customError;
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

// Helper function for password strength calculation
function calculatePasswordStrength(password) {
  let strength = 0;

  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

  const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  return {
    score: strength,
    level: strengthLevels[Math.min(strength, strengthLevels.length - 1)]
  };
}

module.exports = validationUtils;
