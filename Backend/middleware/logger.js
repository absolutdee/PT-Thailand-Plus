// middleware/logger.js
const morgan = require('morgan');
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const rfs = require('rotating-file-stream');

// Create logs directory if it doesn't exist
const logDirectory = path.join(__dirname, '../logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'trainer-finder-api' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logDirectory, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(logDirectory, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Create rotating write stream for Morgan
const accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // Rotate daily
  path: logDirectory,
  maxFiles: 30, // Keep 30 days of logs
  compress: 'gzip' // Compress rotated files
});

// Custom Morgan tokens
morgan.token('user-id', (req) => req.userId || 'anonymous');
morgan.token('user-role', (req) => req.userRole || 'guest');
morgan.token('request-id', (req) => req.id || '-');
morgan.token('response-time-ms', (req, res) => {
  if (!req._startTime) return '-';
  const diff = process.hrtime(req._startTime);
  const ms = diff[0] * 1e3 + diff[1] * 1e-6;
  return ms.toFixed(3);
});

// Morgan format for development
const morganDevFormat = ':method :url :status :response-time ms - :res[content-length]';

// Morgan format for production
const morganProdFormat = JSON.stringify({
  timestamp: ':date[iso]',
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time-ms',
  contentLength: ':res[content-length]',
  userAgent: ':user-agent',
  ip: ':remote-addr',
  userId: ':user-id',
  userRole: ':user-role',
  requestId: ':request-id',
  referrer: ':referrer'
});

// Request logger middleware
const requestLogger = (req, res, next) => {
  // Generate request ID
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Set start time for response time calculation
  req._startTime = process.hrtime();
  
  // Log request
  logger.info('Incoming request', {
    requestId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.userId,
    userRole: req.userRole
  });
  
  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;
    
    // Calculate response time
    const diff = process.hrtime(req._startTime);
    const responseTime = diff[0] * 1e3 + diff[1] * 1e-6;
    
    // Log based on status code
    const logData = {
      requestId: req.id,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime.toFixed(3)}ms`,
      userId: req.userId,
      userRole: req.userRole
    };
    
    if (res.statusCode >= 400) {
      logger.error('Request failed', logData);
    } else {
      logger.info('Request completed', logData);
    }
    
    return res.send(data);
  };
  
  next();
};

// Error logger middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Error occurred', {
    requestId: req.id,
    method: req.method,
    url: req.url,
    error: {
      message: err.message,
      stack: err.stack,
      status: err.status || err.statusCode || 500
    },
    userId: req.userId,
    userRole: req.userRole,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  next(err);
};

// Security event logger
const securityLogger = {
  logFailedLogin: (email, ip, reason) => {
    logger.warn('Failed login attempt', {
      event: 'failed_login',
      email,
      ip,
      reason,
      timestamp: new Date().toISOString()
    });
  },
  
  logSuccessfulLogin: (userId, userRole, ip) => {
    logger.info('Successful login', {
      event: 'successful_login',
      userId,
      userRole,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  logPasswordReset: (userId, ip) => {
    logger.info('Password reset requested', {
      event: 'password_reset',
      userId,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  logSuspiciousActivity: (userId, activity, ip) => {
    logger.error('Suspicious activity detected', {
      event: 'suspicious_activity',
      userId,
      activity,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  logUnauthorizedAccess: (userId, resource, ip) => {
    logger.warn('Unauthorized access attempt', {
      event: 'unauthorized_access',
      userId,
      resource,
      ip,
      timestamp: new Date().toISOString()
    });
  }
};

// Performance logger
const performanceLogger = {
  logSlowQuery: (query, duration) => {
    logger.warn('Slow database query', {
      event: 'slow_query',
      query,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  },
  
  logSlowRequest: (req, duration) => {
    logger.warn('Slow request', {
      event: 'slow_request',
      method: req.method,
      url: req.url,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  }
};

// Activity logger
const activityLogger = {
  logUserActivity: (userId, action, details = {}) => {
    logger.info('User activity', {
      event: 'user_activity',
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  },
  
  logTrainerActivity: (trainerId, action, details = {}) => {
    logger.info('Trainer activity', {
      event: 'trainer_activity',
      trainerId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  },
  
  logAdminActivity: (adminId, action, details = {}) => {
    logger.info('Admin activity', {
      event: 'admin_activity',
      adminId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }
};

// Morgan middleware based on environment
const morganMiddleware = () => {
  if (process.env.NODE_ENV === 'production') {
    return morgan(morganProdFormat, { stream: accessLogStream });
  }
  return morgan(morganDevFormat);
};

// Combined logging middleware
const loggingMiddleware = [
  morganMiddleware(),
  requestLogger
];

module.exports = {
  logger,
  loggingMiddleware,
  errorLogger,
  securityLogger,
  performanceLogger,
  activityLogger,
  requestLogger
};