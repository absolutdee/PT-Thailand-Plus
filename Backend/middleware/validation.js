// middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');

// Validation Result Handler
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'ข้อมูลไม่ถูกต้อง',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// User Registration Validation
const validateUserRegistration = [
  body('email')
    .isEmail()
    .withMessage('อีเมลไม่ถูกต้อง')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('รหัสผ่านต้องประกอบด้วยตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และตัวเลข'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('รหัสผ่านไม่ตรงกัน'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('กรุณากรอกชื่อ')
    .isLength({ max: 50 })
    .withMessage('ชื่อต้องไม่เกิน 50 ตัวอักษร'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('กรุณากรอกนามสกุล')
    .isLength({ max: 50 })
    .withMessage('นามสกุลต้องไม่เกิน 50 ตัวอักษร'),
  body('phoneNumber')
    .matches(/^[0-9]{10}$/)
    .withMessage('เบอร์โทรศัพท์ไม่ถูกต้อง'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('วันเกิดไม่ถูกต้อง')
    .custom((value) => {
      const age = new Date().getFullYear() - new Date(value).getFullYear();
      return age >= 13;
    })
    .withMessage('อายุต้องไม่ต่ำกว่า 13 ปี'),
  validateRequest
];

// Trainer Registration Validation
const validateTrainerRegistration = [
  ...validateUserRegistration.slice(0, -1), // Include all user validations except validateRequest
  body('specializations')
    .isArray({ min: 1 })
    .withMessage('กรุณาเลือกความเชี่ยวชาญอย่างน้อย 1 ด้าน'),
  body('experience')
    .isInt({ min: 0 })
    .withMessage('ประสบการณ์ต้องเป็นตัวเลข'),
  body('certifications')
    .optional()
    .isArray()
    .withMessage('ใบรับรองต้องเป็น Array'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('ประวัติต้องไม่เกิน 500 ตัวอักษร'),
  validateRequest
];

// Login Validation
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('อีเมลไม่ถูกต้อง')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('กรุณากรอกรหัสผ่าน'),
  validateRequest
];

// Update Profile Validation
const validateUpdateProfile = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('ชื่อต้องไม่เกิน 50 ตัวอักษร'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('นามสกุลต้องไม่เกิน 50 ตัวอักษร'),
  body('phoneNumber')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('เบอร์โทรศัพท์ไม่ถูกต้อง'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('วันเกิดไม่ถูกต้อง'),
  validateRequest
];

// Package Validation
const validatePackage = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('กรุณากรอกชื่อแพคเกจ')
    .isLength({ max: 100 })
    .withMessage('ชื่อแพคเกจต้องไม่เกิน 100 ตัวอักษร'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('กรุณากรอกรายละเอียดแพคเกจ')
    .isLength({ max: 1000 })
    .withMessage('รายละเอียดต้องไม่เกิน 1000 ตัวอักษร'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('ราคาต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('ระยะเวลาต้องเป็นตัวเลขที่มากกว่า 0'),
  body('sessionsPerWeek')
    .isInt({ min: 1, max: 7 })
    .withMessage('จำนวนครั้งต่อสัปดาห์ต้องอยู่ระหว่าง 1-7'),
  body('features')
    .isArray()
    .withMessage('Features ต้องเป็น Array'),
  validateRequest
];

// Booking Validation
const validateBooking = [
  body('packageId')
    .isMongoId()
    .withMessage('Package ID ไม่ถูกต้อง'),
  body('startDate')
    .isISO8601()
    .withMessage('วันที่เริ่มต้นไม่ถูกต้อง')
    .custom((value) => new Date(value) >= new Date())
    .withMessage('วันที่เริ่มต้นต้องไม่เป็นวันที่ผ่านมาแล้ว'),
  body('paymentMethod')
    .isIn(['credit_card', 'debit_card', 'promptpay', 'bank_transfer'])
    .withMessage('วิธีการชำระเงินไม่ถูกต้อง'),
  validateRequest
];

// Schedule Validation
const validateSchedule = [
  body('date')
    .isISO8601()
    .withMessage('วันที่ไม่ถูกต้อง'),
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('เวลาเริ่มต้นไม่ถูกต้อง'),
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('เวลาสิ้นสุดไม่ถูกต้อง')
    .custom((value, { req }) => {
      const start = req.body.startTime.split(':');
      const end = value.split(':');
      const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
      const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
      return endMinutes > startMinutes;
    })
    .withMessage('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('สถานที่ต้องไม่เกิน 200 ตัวอักษร'),
  validateRequest
];

// Review Validation
const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('คะแนนต้องอยู่ระหว่าง 1-5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('ความคิดเห็นต้องไม่เกิน 500 ตัวอักษร'),
  validateRequest
];

// Chat Message Validation
const validateChatMessage = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('กรุณากรอกข้อความ')
    .isLength({ max: 1000 })
    .withMessage('ข้อความต้องไม่เกิน 1000 ตัวอักษร'),
  validateRequest
];

// ID Parameter Validation
const validateIdParam = [
  param('id')
    .isMongoId()
    .withMessage('ID ไม่ถูกต้อง'),
  validateRequest
];

// Pagination Validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('หน้าต้องเป็นตัวเลขที่มากกว่า 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('จำนวนต่อหน้าต้องอยู่ระหว่าง 1-100'),
  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'price', '-price', 'rating', '-rating'])
    .withMessage('การเรียงลำดับไม่ถูกต้อง'),
  validateRequest
];

// Search Validation
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('คำค้นหาต้องมีความยาว 2-100 ตัวอักษร'),
  query('location')
    .optional()
    .trim(),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('ราคาต่ำสุดต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('ราคาสูงสุดต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0')
    .custom((value, { req }) => {
      if (req.query.minPrice) {
        return parseFloat(value) >= parseFloat(req.query.minPrice);
      }
      return true;
    })
    .withMessage('ราคาสูงสุดต้องมากกว่าหรือเท่ากับราคาต่ำสุด'),
  query('specializations')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) return true;
      if (typeof value === 'string') return true;
      return false;
    })
    .withMessage('ความเชี่ยวชาญต้องเป็น String หรือ Array'),
  validateRequest
];

// File Upload Validation
const validateFileUpload = (fieldName, maxFiles = 1) => {
  return (req, res, next) => {
    if (!req.files || !req.files[fieldName]) {
      return res.status(400).json({
        success: false,
        message: `กรุณาเลือกไฟล์สำหรับ ${fieldName}`
      });
    }

    const files = Array.isArray(req.files[fieldName]) 
      ? req.files[fieldName] 
      : [req.files[fieldName]];

    if (files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        message: `จำนวนไฟล์เกินกำหนด (สูงสุด ${maxFiles} ไฟล์)`
      });
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.mimetype));

    if (invalidFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'ประเภทไฟล์ไม่ถูกต้อง (รองรับเฉพาะ JPEG, PNG, WebP)'
      });
    }

    next();
  };
};

// Sanitize Input
const sanitizeInput = (req, res, next) => {
  // Recursively sanitize all string inputs
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove any HTML tags
        obj[key] = obj[key].replace(/<[^>]*>?/gm, '');
        // Trim whitespace
        obj[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  
  next();
};

module.exports = {
  validateRequest,
  validateUserRegistration,
  validateTrainerRegistration,
  validateLogin,
  validateUpdateProfile,
  validatePackage,
  validateBooking,
  validateSchedule,
  validateReview,
  validateChatMessage,
  validateIdParam,
  validatePagination,
  validateSearch,
  validateFileUpload,
  sanitizeInput
};