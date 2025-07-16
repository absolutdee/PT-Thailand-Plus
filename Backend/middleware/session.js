// middleware/session.js
const session = require('express-session');
const MongoStore = require('connect-mongo');
const Redis = require('ioredis');
const RedisStore = require('connect-redis');

// กำหนดค่า session ตาม environment
const isProduction = process.env.NODE_ENV === 'production';

// Base session configuration
const baseSessionConfig = {
  name: 'fitness.sid', // ชื่อ cookie
  secret: process.env.SESSION_SECRET || 'fitness-trainer-secret-key-2024',
  resave: false, // ไม่บันทึก session ถ้าไม่มีการเปลี่ยนแปลง
  saveUninitialized: false, // ไม่บันทึก session ที่ยังไม่ได้ initialize
  rolling: true, // รีเซ็ต cookie expiration ทุกครั้งที่มี request
  proxy: isProduction, // trust proxy in production
  cookie: {
    secure: isProduction, // HTTPS only in production
    httpOnly: true, // ป้องกัน XSS
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 วัน
    sameSite: isProduction ? 'strict' : 'lax' // CSRF protection
  }
};

// MongoDB Session Store
const createMongoStore = () => {
  return MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/fitness-trainer',
    collection: 'sessions',
    ttl: 60 * 60 * 24 * 7, // 7 วัน
    touchAfter: 24 * 3600, // lazy session update (24 ชั่วโมง)
    crypto: {
      secret: process.env.SESSION_CRYPTO_SECRET || 'session-crypto-secret'
    },
    autoRemove: 'native', // ใช้ MongoDB TTL สำหรับลบ session หมดอายุ
    serialize: (obj) => {
      // Custom serialization ถ้าต้องการ
      return JSON.stringify(obj);
    },
    unserialize: (data) => {
      // Custom deserialization ถ้าต้องการ
      return JSON.parse(data);
    }
  });
};

// Redis Session Store (Alternative - เร็วกว่า MongoDB)
const createRedisStore = () => {
  const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_SESSION_DB || 0,
    keyPrefix: 'session:',
    enableOfflineQueue: false,
    maxRetriesPerRequest: 3
  });

  redisClient.on('error', (err) => {
    console.error('Redis Session Store Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis Session Store Connected');
  });

  return new RedisStore({
    client: redisClient,
    prefix: 'fitness:sess:',
    ttl: 60 * 60 * 24 * 7, // 7 วัน
    disableTouch: false
  });
};

// Memory Store (Development only)
const createMemoryStore = () => {
  console.warn('⚠️ Using memory store for sessions. This is not suitable for production!');
  return new session.MemoryStore();
};

// เลือก session store ตาม environment
const getSessionStore = () => {
  if (process.env.SESSION_STORE === 'redis' && process.env.REDIS_HOST) {
    return createRedisStore();
  } else if (process.env.MONGODB_URI) {
    return createMongoStore();
  } else if (!isProduction) {
    return createMemoryStore();
  } else {
    throw new Error('No session store configured for production');
  }
};

// Main session middleware
const sessionMiddleware = session({
  ...baseSessionConfig,
  store: getSessionStore()
});

// Session middleware สำหรับ API (ใช้ JWT แทน)
const apiSessionMiddleware = session({
  ...baseSessionConfig,
  name: 'fitness.api.sid',
  cookie: {
    ...baseSessionConfig.cookie,
    maxAge: 1000 * 60 * 30 // 30 นาทีสำหรับ API
  }
});

// Session middleware สำหรับ admin
const adminSessionMiddleware = session({
  ...baseSessionConfig,
  name: 'fitness.admin.sid',
  secret: process.env.ADMIN_SESSION_SECRET || baseSessionConfig.secret + '-admin',
  cookie: {
    ...baseSessionConfig.cookie,
    maxAge: 1000 * 60 * 60 * 2, // 2 ชั่วโมงสำหรับ admin
    path: '/admin' // จำกัดเฉพาะ admin path
  }
});

// Helper middleware สำหรับตรวจสอบ session
const requireSession = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: 'กรุณาเข้าสู่ระบบ'
    });
  }
  next();
};

// Helper middleware สำหรับ refresh session
const refreshSession = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.session.lastActivity = new Date();
    req.session.touch(); // อัพเดท session expiration
  }
  next();
};

// Helper middleware สำหรับจัดการ session data
const sessionDataMiddleware = (req, res, next) => {
  // Helper functions สำหรับจัดการ session data
  req.sessionData = {
    // เพิ่มข้อมูลใน session
    set: (key, value) => {
      if (req.session) {
        req.session[key] = value;
      }
    },
    
    // ดึงข้อมูลจาก session
    get: (key) => {
      return req.session ? req.session[key] : null;
    },
    
    // ลบข้อมูลจาก session
    remove: (key) => {
      if (req.session && req.session[key]) {
        delete req.session[key];
      }
    },
    
    // ล้าง session ทั้งหมด
    clear: () => {
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error('Session destroy error:', err);
          }
        });
      }
    },
    
    // ตรวจสอบว่ามี session หรือไม่
    exists: () => {
      return !!req.session;
    },
    
    // regenerate session ID (security)
    regenerate: () => {
      return new Promise((resolve, reject) => {
        if (req.session) {
          const sessionData = { ...req.session };
          req.session.regenerate((err) => {
            if (err) {
              reject(err);
            } else {
              // คืนค่า session data เดิม
              Object.assign(req.session, sessionData);
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    }
  };
  
  next();
};

// Session timeout middleware
const sessionTimeout = (timeout = 30) => {
  return (req, res, next) => {
    if (req.session && req.session.lastActivity) {
      const now = Date.now();
      const lastActivity = new Date(req.session.lastActivity).getTime();
      const diff = now - lastActivity;
      const maxInactive = timeout * 60 * 1000; // แปลงเป็น milliseconds
      
      if (diff > maxInactive) {
        req.session.destroy((err) => {
          if (err) {
            console.error('Session timeout destroy error:', err);
          }
          return res.status(401).json({
            error: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่'
          });
        });
        return;
      }
    }
    
    if (req.session) {
      req.session.lastActivity = new Date();
    }
    
    next();
  };
};

// CSRF Protection for sessions
const csrfProtection = (req, res, next) => {
  if (req.session) {
    // Generate CSRF token if not exists
    if (!req.session.csrfToken) {
      req.session.csrfToken = require('crypto').randomBytes(32).toString('hex');
    }
    
    // ตรวจสอบ CSRF token สำหรับ state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const token = req.headers['x-csrf-token'] || req.body._csrf;
      
      if (!token || token !== req.session.csrfToken) {
        return res.status(403).json({
          error: 'Invalid CSRF token'
        });
      }
    }
    
    // ส่ง CSRF token ใน response header
    res.setHeader('X-CSRF-Token', req.session.csrfToken);
  }
  
  next();
};

module.exports = {
  // Main session middlewares
  default: sessionMiddleware,
  api: apiSessionMiddleware,
  admin: adminSessionMiddleware,
  
  // Helper middlewares
  requireSession,
  refreshSession,
  sessionData: sessionDataMiddleware,
  timeout: sessionTimeout,
  csrf: csrfProtection,
  
  // Store creators (for custom configuration)
  stores: {
    mongo: createMongoStore,
    redis: createRedisStore,
    memory: createMemoryStore
  },
  
  // Session configuration presets
  presets: {
    // Short session (30 minutes)
    short: session({
      ...baseSessionConfig,
      cookie: {
        ...baseSessionConfig.cookie,
        maxAge: 1000 * 60 * 30
      },
      store: getSessionStore()
    }),
    
    // Medium session (1 day)
    medium: session({
      ...baseSessionConfig,
      cookie: {
        ...baseSessionConfig.cookie,
        maxAge: 1000 * 60 * 60 * 24
      },
      store: getSessionStore()
    }),
    
    // Long session (30 days)
    long: session({
      ...baseSessionConfig,
      cookie: {
        ...baseSessionConfig.cookie,
        maxAge: 1000 * 60 * 60 * 24 * 30
      },
      store: getSessionStore()
    })
  },
  
  // Custom session creator
  custom: (options) => session({
    ...baseSessionConfig,
    ...options,
    store: options.store || getSessionStore()
  })
};