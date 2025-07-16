// middleware/index.js
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { auth, optionalAuth } = require('./auth');
const errorHandler = require('./errorHandler');
const { roleCheck, checkResourceOwner } = require('./roleCheck');
const {
  apiLimiter,
  loginLimiter,
  registrationLimiter,
  messageLimiter,
  uploadLimiter
} = require('./rateLimiter');
const {
  validate,
  validateUserRegistration,
  validateTrainerRegistration,
  validatePackage,
  validateBooking,
  validateReview,
  validateNutritionPlan,
  validateSessionUpdate,
  validateHealthData
} = require('./validation');
const {
  uploadProfileImage,
  uploadTrainerPhotos,
  uploadCertificate,
  uploadEventImage,
  uploadArticleImage,
  uploadGymPhotos,
  uploadMixed,
  resizeImage,
  deleteOldFile
} = require('./uploadHandler');
const { httpLogger, errorLogger, logger } = require('./logger');
const cors = require('./cors');
const sanitizer = require('./sanitizer');
const compression = require('./compression');
const session = require('./session');

// สร้าง middleware configuration object
const middleware = {
  // ===== Express Built-in Middleware =====
  json: express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf.toString('utf8');
    }
  }),
  
  urlencoded: express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }),
  
  static: express.static,
  
  raw: express.raw({ 
    type: 'application/octet-stream', 
    limit: '50mb' 
  }),
  
  // ===== Third-party Core Middleware =====
  cookieParser: cookieParser(process.env.COOKIE_SECRET),
  
  morgan: morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'),
  
  // ===== Security Middleware =====
  security: {
    helmet: sanitizer.helmet,
    cors: cors,
    sanitize: sanitizer.all,
    mongoSanitize: sanitizer.mongoSanitize,
    xss: sanitizer.xss,
    hpp: sanitizer.hpp,
    apiSecurity: sanitizer.apiSecurity,
    authSecurity: sanitizer.authSecurity,
    uploadSecurity: sanitizer.uploadSecurity
  },
  
  // ===== Authentication & Authorization =====
  auth: {
    required: auth,
    optional: optionalAuth,
    roleCheck,
    checkResourceOwner,
    
    // Role-specific middleware
    adminOnly: roleCheck('admin'),
    trainerOnly: roleCheck('trainer'),
    clientOnly: roleCheck('client'),
    trainerOrAdmin: roleCheck('trainer', 'admin'),
    authenticated: auth
  },
  
  // ===== Rate Limiting =====
  rateLimit: {
    api: apiLimiter,
    login: loginLimiter,
    registration: registrationLimiter,
    message: messageLimiter,
    upload: uploadLimiter
  },
  
  // ===== Validation =====
  validate: {
    // Generic validator
    check: validate,
    
    // Specific validators
    userRegistration: validateUserRegistration,
    trainerRegistration: validateTrainerRegistration,
    package: validatePackage,
    booking: validateBooking,
    review: validateReview,
    nutritionPlan: validateNutritionPlan,
    sessionUpdate: validateSessionUpdate,
    healthData: validateHealthData
  },
  
  // ===== File Upload =====
  upload: {
    profileImage: uploadProfileImage,
    trainerPhotos: uploadTrainerPhotos,
    certificate: uploadCertificate,
    eventImage: uploadEventImage,
    articleImage: uploadArticleImage,
    gymPhotos: uploadGymPhotos,
    mixed: uploadMixed,
    
    // Helper functions
    resizeImage,
    deleteOldFile
  },
  
  // ===== Logging =====
  logging: {
    http: httpLogger,
    error: errorLogger,
    logger
  },
  
  // ===== Compression =====
  compression: {
    default: compression.default,
    api: compression.api,
    static: compression.static,
    image: compression.image,
    dynamic: compression.dynamic
  },
  
  // ===== Session Management =====
  session: {
    default: session.default,
    api: session.api,
    admin: session.admin,
    requireSession: session.requireSession,
    refreshSession: session.refreshSession,
    sessionData: session.sessionData,
    timeout: session.timeout,
    csrf: session.csrf
  },
  
  // ===== Error Handling =====
  errorHandler,
  
  // ===== Utility Functions =====
  utils: {
    asyncHandler: (fn) => (req, res, next) =>
      Promise.resolve(fn(req, res, next)).catch(next),
    
    notFound: (req, res) => {
      res.status(404).json({
        error: 'ไม่พบ endpoint ที่ร้องขอ',
        path: req.originalUrl,
        method: req.method
      });
    }
  }
};

// ===== Middleware Stack Presets =====

// Basic middleware stack สำหรับ API
middleware.basicStack = [
  middleware.security.helmet,
  middleware.security.cors,
  middleware.compression.api,
  middleware.json,
  middleware.urlencoded,
  middleware.cookieParser,
  middleware.security.sanitize,
  middleware.logging.http
];

// Authentication required stack
middleware.authStack = [
  ...middleware.basicStack,
  middleware.auth.required
];

// Public API stack (ไม่ต้อง auth แต่มี rate limit)
middleware.publicStack = [
  ...middleware.basicStack,
  middleware.rateLimit.api,
  middleware.auth.optional
];

// Admin panel stack
middleware.adminStack = [
  ...middleware.basicStack,
  middleware.session.admin,
  middleware.session.csrf,
  middleware.auth.required,
  middleware.auth.adminOnly
];

// File upload stack
middleware.uploadStack = [
  ...middleware.basicStack,
  middleware.rateLimit.upload,
  middleware.auth.required,
  middleware.security.uploadSecurity
];

// WebSocket/Real-time stack
middleware.realtimeStack = [
  middleware.security.cors,
  middleware.cookieParser,
  middleware.session.default,
  middleware.auth.optional
];

// ===== Helper Functions สำหรับ Setup Middleware =====

// Setup all basic middleware
middleware.setupBasic = (app) => {
  middleware.basicStack.forEach(mw => app.use(mw));
  return app;
};

// Setup middleware with custom configuration
middleware.setup = (app, options = {}) => {
  const {
    enableSession = true,
    enableCompression = true,
    enableSecurity = true,
    enableLogging = true,
    enableRateLimit = true,
    staticPath = 'public'
  } = options;

  // Security
  if (enableSecurity) {
    app.use(middleware.security.helmet);
    app.use(middleware.security.cors);
    app.use(middleware.security.sanitize);
  }

  // Compression
  if (enableCompression) {
    app.use(middleware.compression.default);
  }

  // Body parsing
  app.use(middleware.json);
  app.use(middleware.urlencoded);
  app.use(middleware.cookieParser);

  // Static files
  if (staticPath) {
    app.use(express.static(staticPath));
  }

  // Session
  if (enableSession) {
    app.use(middleware.session.default);
    app.use(middleware.session.sessionData);
  }

  // Logging
  if (enableLogging) {
    app.use(middleware.morgan);
    app.use(middleware.logging.http);
  }

  // Rate limiting
  if (enableRateLimit) {
    app.use('/api/', middleware.rateLimit.api);
  }

  return app;
};

// ===== Export Everything =====
module.exports = middleware;

// ===== Usage Examples =====
/*
// Basic setup
const app = express();
middleware.setupBasic(app);

// Custom setup
middleware.setup(app, {
  enableSession: true,
  enableCompression: true,
  staticPath: 'public'
});

// Using specific middleware
app.post('/api/auth/register',
  middleware.rateLimit.registration,
  middleware.validate.userRegistration,
  registerController
);

// Using middleware stacks
app.use('/api/trainers', middleware.authStack, trainerRoutes);
app.use('/api/public', middleware.publicStack, publicRoutes);
app.use('/admin', middleware.adminStack, adminRoutes);

// Error handling (ต้องอยู่ท้ายสุด)
app.use(middleware.utils.notFound);
app.use(middleware.logging.error);
app.use(middleware.errorHandler);
*/