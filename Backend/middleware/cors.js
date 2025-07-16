// middleware/cors.js
const cors = require('cors');

// Allowed origins based on environment
const getAllowedOrigins = () => {
  const origins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173', // Vite dev server
    'http://localhost:5174',
  ];

  // Add production domains
  if (process.env.NODE_ENV === 'production') {
    origins.push(
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
      process.env.MOBILE_URL,
      'https://yourdomain.com',
      'https://www.yourdomain.com',
      'https://admin.yourdomain.com',
      'https://trainer.yourdomain.com',
      'https://app.yourdomain.com'
    );
  }

  // Add staging domains
  if (process.env.NODE_ENV === 'staging') {
    origins.push(
      'https://staging.yourdomain.com',
      'https://staging-admin.yourdomain.com'
    );
  }

  // Filter out undefined values
  return origins.filter(origin => origin);
};

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy violation: Origin ${origin} is not allowed`));
    }
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Auth-Token',
    'X-CSRF-Token',
    'X-HTTP-Method-Override'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Per-Page',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Development CORS (allow all origins)
const corsOptionsDev = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Current-Page', 'X-Per-Page'],
  maxAge: 86400
};

// CORS middleware based on environment
const corsMiddleware = () => {
  if (process.env.NODE_ENV === 'development') {
    return cors(corsOptionsDev);
  }
  return cors(corsOptions);
};

// Custom CORS for specific routes
const customCors = (options = {}) => {
  const customOptions = {
    ...corsOptions,
    ...options
  };
  return cors(customOptions);
};

// CORS for file uploads
const uploadCors = () => {
  return cors({
    ...corsOptions,
    methods: ['POST', 'OPTIONS'],
    exposedHeaders: [...corsOptions.exposedHeaders, 'Location']
  });
};

// CORS for public API
const publicApiCors = () => {
  return cors({
    origin: '*', // Allow all origins for public API
    credentials: false,
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    maxAge: 3600 // 1 hour
  });
};

// CORS error handler
const corsErrorHandler = (err, req, res, next) => {
  if (err && err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  next(err);
};

// Preflight handler
const preflightHandler = (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
};

// Check origin middleware
const checkOrigin = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  // Skip check for same-origin requests or no origin
  if (!origin || req.headers.host === origin.replace(/^https?:\/\//, '')) {
    return next();
  }

  // Check if origin is allowed
  if (process.env.NODE_ENV !== 'development' && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      success: false,
      message: 'Origin not allowed',
      origin: process.env.NODE_ENV === 'development' ? origin : undefined
    });
  }

  next();
};

// WebSocket CORS configuration
const websocketCors = (socket, next) => {
  const origin = socket.handshake.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  // Allow in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // Check origin
  if (!origin || !allowedOrigins.includes(origin)) {
    return next(new Error('CORS policy violation'));
  }

  next();
};

module.exports = {
  corsMiddleware,
  customCors,
  uploadCors,
  publicApiCors,
  corsErrorHandler,
  preflightHandler,
  checkOrigin,
  websocketCors,
  getAllowedOrigins
};