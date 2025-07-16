// middleware/sanitizer.js
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const helmet = require('helmet');

// Sanitize request data - ป้องกัน NoSQL injection
const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️ Potential NoSQL injection attempt sanitized in ${key}`);
  }
});

// XSS Protection - ป้องกัน Cross-Site Scripting
const xssClean = xss();

// HPP Protection - ป้องกัน HTTP Parameter Pollution
const hppProtection = hpp({
  whitelist: [
    'sort',
    'fields',
    'page',
    'limit',
    'filter',
    'search',
    'category',
    'specialization',
    'priceMin',
    'priceMax',
    'rating',
    'location'
  ]
});

// Helmet configuration - HTTP headers security
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "wss:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
      blockAllMixedContent: []
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// Custom HTML sanitizer for rich text content
const sanitizeHtml = require('sanitize-html');

const htmlSanitizeOptions = {
  allowedTags: [
    'b', 'i', 'em', 'strong', 'a', 'p', 'br',
    'ul', 'ol', 'li', 'blockquote', 'h3', 'h4', 'h5', 'h6'
  ],
  allowedAttributes: {
    'a': ['href', 'target', 'rel']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    'a': (tagName, attribs) => {
      return {
        tagName: 'a',
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      };
    }
  }
};

// Middleware สำหรับ sanitize rich text fields
const sanitizeRichText = (fields) => {
  return (req, res, next) => {
    if (req.body) {
      fields.forEach(field => {
        if (req.body[field]) {
          req.body[field] = sanitizeHtml(req.body[field], htmlSanitizeOptions);
        }
      });
    }
    next();
  };
};

// SQL Injection Protection (ถ้าใช้ SQL database ร่วมด้วย)
const sqlInjectionProtection = (req, res, next) => {
  const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/gi;
  
  const checkValue = (value) => {
    if (typeof value === 'string' && sqlPattern.test(value)) {
      console.warn(`⚠️ Potential SQL injection attempt detected: ${value}`);
      return false;
    }
    return true;
  };

  const checkObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
          if (!checkObject(value)) return false;
        } else if (!checkValue(value)) {
          return false;
        }
      }
    }
    return true;
  };

  // Check all request inputs
  const inputs = [req.body, req.query, req.params];
  for (const input of inputs) {
    if (input && !checkObject(input)) {
      return res.status(400).json({
        error: 'คำขอมีข้อมูลที่ไม่ปลอดภัย'
      });
    }
  }

  next();
};

// Path Traversal Protection
const pathTraversalProtection = (req, res, next) => {
  const pathPattern = /(\.\.|\.\/|\.\\)/;
  
  // Check params that might contain file paths
  const pathParams = ['filename', 'path', 'file', 'image', 'document'];
  
  for (const param of pathParams) {
    if (req.params[param] && pathPattern.test(req.params[param])) {
      return res.status(400).json({
        error: 'ชื่อไฟล์ไม่ถูกต้อง'
      });
    }
    if (req.query[param] && pathPattern.test(req.query[param])) {
      return res.status(400).json({
        error: 'ชื่อไฟล์ไม่ถูกต้อง'
      });
    }
  }
  
  next();
};

// Command Injection Protection
const commandInjectionProtection = (req, res, next) => {
  const dangerousChars = /[;&|`$()]/;
  
  const checkForDangerousInput = (value) => {
    return typeof value === 'string' && dangerousChars.test(value);
  };

  const inputs = [req.body, req.query, req.params];
  for (const input of inputs) {
    if (input) {
      for (const key in input) {
        if (checkForDangerousInput(input[key])) {
          console.warn(`⚠️ Potential command injection attempt: ${input[key]}`);
          return res.status(400).json({
            error: 'คำขอมีอักขระที่ไม่อนุญาต'
          });
        }
      }
    }
  }

  next();
};

// LDAP Injection Protection
const ldapInjectionProtection = (req, res, next) => {
  const ldapChars = /[*()\\]/;
  
  // Check authentication fields
  if (req.body.username && ldapChars.test(req.body.username)) {
    return res.status(400).json({
      error: 'ชื่อผู้ใช้มีอักขระที่ไม่อนุญาต'
    });
  }
  
  next();
};

// Combined security middleware
const securityMiddleware = [
  helmetConfig,
  mongoSanitizeMiddleware,
  xssClean,
  hppProtection,
  sqlInjectionProtection,
  pathTraversalProtection,
  commandInjectionProtection,
  ldapInjectionProtection
];

module.exports = {
  // Individual middleware exports
  helmet: helmetConfig,
  mongoSanitize: mongoSanitizeMiddleware,
  xss: xssClean,
  hpp: hppProtection,
  sqlInjectionProtection,
  pathTraversalProtection,
  commandInjectionProtection,
  ldapInjectionProtection,
  
  // Helper functions
  sanitizeRichText,
  sanitizeHtml: (html) => sanitizeHtml(html, htmlSanitizeOptions),
  
  // Combined middleware
  all: securityMiddleware,
  
  // Presets for different routes
  apiSecurity: [
    mongoSanitizeMiddleware,
    xssClean,
    hppProtection
  ],
  
  authSecurity: [
    mongoSanitizeMiddleware,
    xssClean,
    ldapInjectionProtection
  ],
  
  uploadSecurity: [
    mongoSanitizeMiddleware,
    pathTraversalProtection
  ]
};