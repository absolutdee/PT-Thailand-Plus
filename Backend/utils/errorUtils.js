// utils/errorUtils.js
const winston = require('winston');
const path = require('path');
const db = require('../config/database');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Write to error file
    new winston.transports.File({ 
      filename: path.join('logs', 'error.log'), 
      level: 'error' 
    }),
    // Write to combined file
    new winston.transports.File({ 
      filename: path.join('logs', 'combined.log') 
    })
  ]
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

const errorUtils = {
  // Custom error classes
  AppError: class AppError extends Error {
    constructor(message, statusCode, code = null) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
      this.isOperational = true;
      Error.captureStackTrace(this, this.constructor);
    }
  },

  ValidationError: class ValidationError extends Error {
    constructor(errors) {
      super('Validation failed');
      this.statusCode = 400;
      this.errors = errors;
      this.isOperational = true;
      Error.captureStackTrace(this, this.constructor);
    }
  },

  AuthenticationError: class AuthenticationError extends Error {
    constructor(message = 'Authentication failed') {
      super(message);
      this.statusCode = 401;
      this.isOperational = true;
      Error.captureStackTrace(this, this.constructor);
    }
  },

  AuthorizationError: class AuthorizationError extends Error {
    constructor(message = 'Access denied') {
      super(message);
      this.statusCode = 403;
      this.isOperational = true;
      Error.captureStackTrace(this, this.constructor);
    }
  },

  NotFoundError: class NotFoundError extends Error {
    constructor(resource = 'Resource') {
      super(`${resource} not found`);
      this.statusCode = 404;
      this.isOperational = true;
      Error.captureStackTrace(this, this.constructor);
    }
  },

  ConflictError: class ConflictError extends Error {
    constructor(message = 'Resource conflict') {
      super(message);
      this.statusCode = 409;
      this.isOperational = true;
      Error.captureStackTrace(this, this.constructor);
    }
  },

  RateLimitError: class RateLimitError extends Error {
    constructor(message = 'Too many requests') {
      super(message);
      this.statusCode = 429;
      this.isOperational = true;
      Error.captureStackTrace(this, this.constructor);
    }
  },

  // Error handler middleware
  errorHandler: (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error({
      error: {
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode || 500,
        code: err.code,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id
      }
    });

    // Save critical errors to database
    if (!err.isOperational || err.statusCode >= 500) {
      errorUtils.logErrorToDatabase(err, req).catch(console.error);
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
      const message = 'Invalid ID format';
      error = new errorUtils.AppError(message, 400);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const message = `${field} already exists`;
      error = new errorUtils.ConflictError(message);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
      error = new errorUtils.ValidationError(errors);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      error = new errorUtils.AuthenticationError('Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
      error = new errorUtils.AuthenticationError('Token expired');
    }

    // Send error response
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        message: error.message || 'Server Error',
        code: error.code,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        ...(error.errors && { errors: error.errors })
      }
    });
  },

  // Async error handler wrapper
  asyncHandler: (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  },

  // Log error to database
  logErrorToDatabase: async (error, request) => {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        code: error.code,
        statusCode: error.statusCode || 500,
        url: request.originalUrl,
        method: request.method,
        headers: JSON.stringify(request.headers),
        body: JSON.stringify(request.body),
        query: JSON.stringify(request.query),
        ip: request.ip,
        userAgent: request.get('user-agent'),
        userId: request.user?.id || null
      };

      await db.execute(`
        INSERT INTO error_logs (
          message, stack, code, status_code,
          url, method, headers, body, query,
          ip_address, user_agent, user_id,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        errorData.message,
        errorData.stack,
        errorData.code,
        errorData.statusCode,
        errorData.url,
        errorData.method,
        errorData.headers,
        errorData.body,
        errorData.query,
        errorData.ip,
        errorData.userAgent,
        errorData.userId
      ]);
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError);
    }
  },

  // Handle uncaught exceptions
  handleUncaughtException: () => {
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      
      // Log to database
      errorUtils.logErrorToDatabase(error, { 
        originalUrl: 'uncaughtException',
        method: 'SYSTEM',
        ip: 'localhost'
      }).then(() => {
        process.exit(1);
      });
    });
  },

  // Handle unhandled rejections
  handleUnhandledRejection: () => {
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      
      // Log to database
      errorUtils.logErrorToDatabase(new Error(reason), { 
        originalUrl: 'unhandledRejection',
        method: 'SYSTEM',
        ip: 'localhost'
      }).then(() => {
        process.exit(1);
      });
    });
  },

  // API error responses
  apiError: {
    badRequest: (message = 'Bad Request') => {
      throw new errorUtils.AppError(message, 400);
    },

    unauthorized: (message = 'Unauthorized') => {
      throw new errorUtils.AuthenticationError(message);
    },

    forbidden: (message = 'Forbidden') => {
      throw new errorUtils.AuthorizationError(message);
    },

    notFound: (resource = 'Resource') => {
      throw new errorUtils.NotFoundError(resource);
    },

    conflict: (message = 'Conflict') => {
      throw new errorUtils.ConflictError(message);
    },

    tooManyRequests: (message = 'Too Many Requests') => {
      throw new errorUtils.RateLimitError(message);
    },

    internal: (message = 'Internal Server Error') => {
      throw new errorUtils.AppError(message, 500);
    }
  },

  // Validation error formatter
  formatValidationErrors: (errors) => {
    const formatted = {};
    
    errors.forEach(error => {
      const field = error.param || error.path;
      if (!formatted[field]) {
        formatted[field] = [];
      }
      formatted[field].push(error.msg || error.message);
    });

    return formatted;
  },

  // Error response formatter
  formatErrorResponse: (error) => {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        field: error.field,
        timestamp: new Date().toISOString()
      }
    };
  },

  // Database error handler
  handleDatabaseError: (error) => {
    // MySQL error codes
    const errorCodes = {
      'ER_DUP_ENTRY': {
        message: 'Duplicate entry',
        statusCode: 409
      },
      'ER_NO_REFERENCED_ROW_2': {
        message: 'Referenced record not found',
        statusCode: 400
      },
      'ER_DATA_TOO_LONG': {
        message: 'Data too long for field',
        statusCode: 400
      },
      'ER_BAD_NULL_ERROR': {
        message: 'Required field cannot be null',
        statusCode: 400
      },
      'ER_NO_DEFAULT_FOR_FIELD': {
        message: 'Field requires a value',
        statusCode: 400
      }
    };

    const errorInfo = errorCodes[error.code];
    
    if (errorInfo) {
      throw new errorUtils.AppError(errorInfo.message, errorInfo.statusCode, error.code);
    }

    throw error;
  },

  // Log levels
  log: {
    error: (message, meta = {}) => {
      logger.error(message, meta);
    },

    warn: (message, meta = {}) => {
      logger.warn(message, meta);
    },

    info: (message, meta = {}) => {
      logger.info(message, meta);
    },

    debug: (message, meta = {}) => {
      logger.debug(message, meta);
    }
  },

  // Error monitoring integration
  captureException: (error, context = {}) => {
    // Integrate with error monitoring service (e.g., Sentry)
    if (process.env.SENTRY_DSN) {
      const Sentry = require('@sentry/node');
      Sentry.captureException(error, {
        extra: context
      });
    }

    // Log locally
    logger.error('Exception captured:', {
      error: error.message,
      stack: error.stack,
      context
    });
  },

  // Retry mechanism
  retry: async (fn, options = {}) => {
    const {
      attempts = 3,
      delay = 1000,
      backoff = 2,
      onError = null
    } = options;

    let lastError;

    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (onError) {
          onError(error, i + 1);
        }

        if (i < attempts - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, delay * Math.pow(backoff, i))
          );
        }
      }
    }

    throw lastError;
  },

  // Circuit breaker pattern
  createCircuitBreaker: (fn, options = {}) => {
    const {
      threshold = 5,
      timeout = 60000,
      resetTimeout = 30000
    } = options;

    let failures = 0;
    let lastFailureTime = null;
    let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN

    return async (...args) => {
      if (state === 'OPEN') {
        if (Date.now() - lastFailureTime > resetTimeout) {
          state = 'HALF_OPEN';
        } else {
          throw new Error('Circuit breaker is OPEN');
        }
      }

      try {
        const result = await Promise.race([
          fn(...args),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeout)
          )
        ]);

        if (state === 'HALF_OPEN') {
          state = 'CLOSED';
          failures = 0;
        }

        return result;
      } catch (error) {
        failures++;
        lastFailureTime = Date.now();

        if (failures >= threshold) {
          state = 'OPEN';
        }

        throw error;
      }
    };
  },

  // Sanitize error messages for production
  sanitizeError: (error) => {
    if (process.env.NODE_ENV === 'production') {
      // Don't expose sensitive information in production
      const sanitized = {
        message: 'An error occurred',
        statusCode: error.statusCode || 500
      };

      // Safe error messages
      const safeMessages = [
        'Invalid credentials',
        'Access denied',
        'Resource not found',
        'Validation failed',
        'Too many requests'
      ];

      if (safeMessages.includes(error.message)) {
        sanitized.message = error.message;
      }

      return sanitized;
    }

    return error;
  }
};

module.exports = errorUtils;
