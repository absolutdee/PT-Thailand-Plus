// middleware/errorHandler.js
const logger = require('../utils/logger');

// Custom Error Class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async Error Handler Wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Not Found Error Handler
const notFound = (req, res, next) => {
  const error = new AppError(`ไม่พบ Route: ${req.originalUrl}`, 404);
  next(error);
};

// MongoDB CastError Handler
const handleCastErrorDB = (err) => {
  const message = `ข้อมูล ${err.path} ไม่ถูกต้อง: ${err.value}`;
  return new AppError(message, 400);
};

// MongoDB Duplicate Key Error Handler
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `ข้อมูล ${value} มีอยู่ในระบบแล้ว กรุณาใช้ข้อมูลอื่น`;
  return new AppError(message, 400);
};

// MongoDB Validation Error Handler
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `ข้อมูลไม่ถูกต้อง: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// JWT Error Handler
const handleJWTError = () => 
  new AppError('Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่', 401);

// JWT Expired Error Handler
const handleJWTExpiredError = () => 
  new AppError('Token หมดอายุ กรุณาเข้าสู่ระบบใหม่', 401);

// Multer Error Handler
const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('ไฟล์มีขนาดใหญ่เกินไป', 400);
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('จำนวนไฟล์เกินกำหนด', 400);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('ประเภทไฟล์ไม่ถูกต้อง', 400);
  }
  return new AppError('เกิดข้อผิดพลาดในการอัพโหลดไฟล์', 400);
};

// Send Error Response (Development)
const sendErrorDev = (err, req, res) => {
  // API Error
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      success: false,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  
  // Rendered Website Error
  logger.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'เกิดข้อผิดพลาด',
    message: err.message
  });
};

// Send Error Response (Production)
const sendErrorProd = (err, req, res) => {
  // API Error
  if (req.originalUrl.startsWith('/api')) {
    // Operational error - send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message
      });
    }
    
    // Programming error - don't leak details
    logger.error('ERROR 💥', err);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในระบบ'
    });
  }
  
  // Rendered Website Error
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'เกิดข้อผิดพลาด',
      message: err.message
    });
  }
  
  // Programming error - don't leak details
  logger.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'เกิดข้อผิดพลาด',
    message: 'กรุณาลองใหม่อีกครั้ง'
  });
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific errors
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'MulterError') error = handleMulterError(error);

    sendErrorProd(error, req, res);
  }
};

// Rate Limit Error Handler
const handleRateLimitError = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'คุณส่งคำขอมากเกินไป กรุณาลองใหม่ในภายหลัง'
  });
};

// CORS Error Handler
const handleCORSError = (req, res) => {
  res.status(403).json({
    success: false,
    message: 'CORS policy violation'
  });
};

module.exports = {
  AppError,
  asyncHandler,
  notFound,
  errorHandler,
  handleRateLimitError,
  handleCORSError
};