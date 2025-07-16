// middleware/compression.js
const compression = require('compression');
const zlib = require('zlib');

// ตั้งค่า compression level
const compressionLevel = {
  default: 6,    // ค่าเริ่มต้น (1-9)
  speed: 1,      // เน้นความเร็ว
  balanced: 6,   // สมดุล
  best: 9        // บีบอัดสูงสุด
};

// กำหนดขนาดไฟล์ขั้นต่ำที่จะ compress
const threshold = {
  default: 1024,    // 1KB
  small: 512,       // 512 bytes
  medium: 2048,     // 2KB
  large: 4096       // 4KB
};

// Default compression options
const defaultOptions = {
  // กำหนด compression algorithm
  level: compressionLevel.balanced,
  
  // ขนาดไฟล์ขั้นต่ำที่จะ compress
  threshold: threshold.default,
  
  // Memory level (1-9)
  memLevel: 8,
  
  // Strategy
  strategy: zlib.constants.Z_DEFAULT_STRATEGY,
  
  // Window bits
  windowBits: zlib.constants.Z_DEFAULT_WINDOWBITS,
  
  // Chunk size
  chunkSize: zlib.constants.Z_DEFAULT_CHUNK,
  
  // Filter function
  filter: (req, res) => {
    // ไม่ compress ถ้า client ส่ง x-no-compression header
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // ไม่ compress server-sent events
    if (res.getHeader('Content-Type') === 'text/event-stream') {
      return false;
    }
    
    // ไม่ compress WebSocket
    if (req.headers.upgrade === 'websocket') {
      return false;
    }
    
    // ใช้ default compression filter
    return compression.filter(req, res);
  }
};

// Compression middleware สำหรับ API responses
const apiCompression = compression({
  ...defaultOptions,
  filter: (req, res) => {
    // เพิ่มการตรวจสอบสำหรับ API
    const contentType = res.getHeader('Content-Type');
    
    // Compress JSON responses
    if (contentType && contentType.includes('application/json')) {
      return true;
    }
    
    // ใช้ default filter
    return defaultOptions.filter(req, res);
  }
});

// Compression middleware สำหรับ static files
const staticCompression = compression({
  ...defaultOptions,
  level: compressionLevel.best,
  threshold: threshold.small,
  filter: (req, res) => {
    const contentType = res.getHeader('Content-Type') || '';
    
    // รายการ content types ที่ควร compress
    const compressibleTypes = [
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript',
      'application/json',
      'application/xml',
      'text/xml',
      'text/plain',
      'image/svg+xml',
      'application/vnd.ms-fontobject',
      'application/x-font-ttf',
      'font/opentype'
    ];
    
    // ตรวจสอบว่าควร compress หรือไม่
    return compressibleTypes.some(type => contentType.includes(type));
  }
});

// Compression middleware สำหรับ images (ใช้ compression น้อย)
const imageCompression = compression({
  ...defaultOptions,
  level: compressionLevel.speed,
  threshold: threshold.large,
  filter: (req, res) => {
    const contentType = res.getHeader('Content-Type') || '';
    
    // Compress only uncompressed image formats
    const compressibleImageTypes = [
      'image/bmp',
      'image/tiff',
      'image/x-icon'
    ];
    
    return compressibleImageTypes.some(type => contentType.includes(type));
  }
});

// Dynamic compression based on content size
const dynamicCompression = compression({
  ...defaultOptions,
  filter: (req, res) => {
    // ใช้ default filter ก่อน
    if (!defaultOptions.filter(req, res)) {
      return false;
    }
    
    // ดูขนาดของ content
    const contentLength = res.getHeader('Content-Length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      
      // ถ้าไฟล์ใหญ่มาก ใช้ compression สูง
      if (size > 1024 * 1024) { // > 1MB
        res.locals.compressionLevel = compressionLevel.best;
      }
      // ถ้าไฟล์เล็ก ใช้ compression เร็ว
      else if (size < 10 * 1024) { // < 10KB
        res.locals.compressionLevel = compressionLevel.speed;
      }
    }
    
    return true;
  },
  level: (req, res) => {
    return res.locals.compressionLevel || compressionLevel.balanced;
  }
});

// Middleware สำหรับเพิ่ม compression headers
const compressionHeaders = (req, res, next) => {
  // แจ้ง client ว่า server รองรับ compression อะไรบ้าง
  res.setHeader('Accept-Encoding', 'gzip, deflate, br');
  
  // Cache compressed content
  if (req.method === 'GET' && res.getHeader('Content-Encoding')) {
    res.setHeader('Vary', 'Accept-Encoding');
  }
  
  next();
};

// Helper function สำหรับ manual compression
const compressData = (data, encoding = 'gzip') => {
  return new Promise((resolve, reject) => {
    const buffer = Buffer.from(JSON.stringify(data));
    
    if (encoding === 'gzip') {
      zlib.gzip(buffer, (err, compressed) => {
        if (err) reject(err);
        else resolve(compressed);
      });
    } else if (encoding === 'deflate') {
      zlib.deflate(buffer, (err, compressed) => {
        if (err) reject(err);
        else resolve(compressed);
      });
    } else if (encoding === 'br') {
      zlib.brotliCompress(buffer, (err, compressed) => {
        if (err) reject(err);
        else resolve(compressed);
      });
    } else {
      reject(new Error('Unsupported encoding'));
    }
  });
};

// Helper function สำหรับ decompress data
const decompressData = (data, encoding = 'gzip') => {
  return new Promise((resolve, reject) => {
    if (encoding === 'gzip') {
      zlib.gunzip(data, (err, decompressed) => {
        if (err) reject(err);
        else resolve(decompressed.toString());
      });
    } else if (encoding === 'deflate') {
      zlib.inflate(data, (err, decompressed) => {
        if (err) reject(err);
        else resolve(decompressed.toString());
      });
    } else if (encoding === 'br') {
      zlib.brotliDecompress(data, (err, decompressed) => {
        if (err) reject(err);
        else resolve(decompressed.toString());
      });
    } else {
      reject(new Error('Unsupported encoding'));
    }
  });
};

// Export configurations
module.exports = {
  // Main compression middleware
  default: compression(defaultOptions),
  
  // Specific compression middleware
  api: apiCompression,
  static: staticCompression,
  image: imageCompression,
  dynamic: dynamicCompression,
  
  // Helper middleware
  headers: compressionHeaders,
  
  // Utility functions
  compress: compressData,
  decompress: decompressData,
  
  // Configuration presets
  presets: {
    speed: compression({
      ...defaultOptions,
      level: compressionLevel.speed
    }),
    balanced: compression({
      ...defaultOptions,
      level: compressionLevel.balanced
    }),
    best: compression({
      ...defaultOptions,
      level: compressionLevel.best
    })
  },
  
  // Custom configuration function
  custom: (options) => compression({
    ...defaultOptions,
    ...options
  })
};