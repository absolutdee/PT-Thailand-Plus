// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

// Create Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  keyPrefix: 'rl:',
  enableOfflineQueue: false
});

// Handle Redis connection errors
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Default rate limiter
const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'คุณส่งคำขอมากเกินไป กรุณาลองใหม่ในภายหลัง'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.userRole === 'admin';
  }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'พยายามเข้าสู่ระบบมากเกินไป กรุณาลองใหม่ใน 15 นาที'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  store: new RedisStore({
    client: redisClient,
    prefix: 'auth:'
  })
});

// Rate limiter for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'ส่งคำขอรีเซ็ตรหัสผ่านมากเกินไป กรุณาลองใหม่ในอีก 1 ชั่วโมง'
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'pwreset:'
  })
});

// Rate limiter for email verification
const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 email verification requests per hour
  message: {
    success: false,
    message: 'ส่งคำขอยืนยันอีเมลมากเกินไป กรุณาลองใหม่ในภายหลัง'
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'emailverify:'
  })
});

// Rate limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per minute
  message: {
    success: false,
    message: 'คุณส่งคำขอ API มากเกินไป กรุณาลองใหม่ในภายหลัง'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redisClient,
    prefix: 'api:'
  }),
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.userRole === 'admin';
  }
});

// Rate limiter for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 upload requests per 15 minutes
  message: {
    success: false,
    message: 'อัพโหลดไฟล์มากเกินไป กรุณาลองใหม่ในภายหลัง'
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'upload:'
  })
});

// Rate limiter for chat messages
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each user to 30 messages per minute
  message: {
    success: false,
    message: 'ส่งข้อความมากเกินไป กรุณาลองใหม่ในภายหลัง'
  },
  keyGenerator: (req) => {
    // Use user ID instead of IP for authenticated users
    return req.userId || req.ip;
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'chat:'
  })
});

// Rate limiter for search endpoints
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 search requests per minute
  message: {
    success: false,
    message: 'ค้นหามากเกินไป กรุณาลองใหม่ในภายหลัง'
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'search:'
  })
});

// Rate limiter for review submissions
const reviewLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // Limit each user to 5 reviews per day
  message: {
    success: false,
    message: 'เขียนรีวิวมากเกินไปในวันนี้ กรุณาลองใหม่พรุ่งนี้'
  },
  keyGenerator: (req) => {
    // Use user ID for authenticated users
    return req.userId || req.ip;
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'review:'
  })
});

// Dynamic rate limiter based on user role
const dynamicLimiter = (options = {}) => {
  return (req, res, next) => {
    let limit = options.max || 100;
    
    // Adjust limits based on user role
    if (req.userRole === 'admin') {
      return next(); // No limit for admin
    } else if (req.userRole === 'trainer') {
      limit = limit * 2; // Double limit for trainers
    } else if (req.userRole === 'customer') {
      limit = limit * 1.5; // 1.5x limit for customers
    }
    
    const limiter = rateLimit({
      windowMs: options.windowMs || 15 * 60 * 1000,
      max: limit,
      message: options.message || {
        success: false,
        message: 'คุณส่งคำขอมากเกินไป กรุณาลองใหม่ในภายหลัง'
      },
      store: new RedisStore({
        client: redisClient,
        prefix: options.prefix || 'dynamic:'
      }),
      keyGenerator: (req) => {
        // Use user ID for authenticated users, IP for others
        return req.userId || req.ip;
      }
    });
    
    limiter(req, res, next);
  };
};

// Create custom limiter
const createLimiter = (options) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      success: false,
      message: 'คุณส่งคำขอมากเกินไป กรุณาลองใหม่ในภายหลัง'
    },
    standardHeaders: true,
    legacyHeaders: false
  };

  const limiterOptions = { ...defaultOptions, ...options };

  // Use Redis store if available
  if (redisClient.status === 'ready') {
    limiterOptions.store = new RedisStore({
      client: redisClient,
      prefix: options.prefix || 'custom:'
    });
  }

  return rateLimit(limiterOptions);
};

// Cleanup function
const cleanup = () => {
  if (redisClient) {
    redisClient.disconnect();
  }
};

module.exports = {
  defaultLimiter,
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  apiLimiter,
  uploadLimiter,
  chatLimiter,
  searchLimiter,
  reviewLimiter,
  dynamicLimiter,
  createLimiter,
  cleanup
};