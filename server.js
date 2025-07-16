// Backend API Server สำหรับ Fitness Trainer Platform
// server.js

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Database Configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'fitness_app',
  password: process.env.DB_PASSWORD || 'fitness_password_123',
  database: process.env.DB_NAME || 'fitness_trainer_platform',
  charset: 'utf8mb4',
  timezone: '+07:00',
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 30000
};

// Create connection pool
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database');
    
    // Test query
    const [rows] = await connection.execute('SELECT 1 + 1 AS result');
    console.log('✅ Database test query successful:', rows[0].result);
    
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// File Upload Configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = 'uploads/';
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ===================================
// Helper Functions
// ===================================

// Response helper
const sendResponse = (res, statusCode, data, message = '') => {
  res.status(statusCode).json({
    success: statusCode < 400,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// Error handler
const handleError = (res, error, message = 'Internal server error') => {
  console.error('Error:', error);
  sendResponse(res, 500, null, message);
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

// ===================================
// Basic Routes
// ===================================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1 + 1 AS result');
    sendResponse(res, 200, {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      result: rows[0].result
    }, 'API is running successfully');
  } catch (error) {
    handleError(res, error, 'Health check failed');
  }
});

// ===================================
// Authentication Routes
// ===================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role = 'customer', firstName, lastName } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return sendResponse(res, 400, null, 'กรุณากรอกข้อมูลให้ครบถ้วน');
    }

    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return sendResponse(res, 400, null, 'อีเมลนี้ถูกใช้งานแล้ว');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [userResult] = await pool.execute(
      'INSERT INTO users (email, password, role, status, email_verified) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, role, 'active', 1]
    );

    const userId = userResult.insertId;

    // Create profile based on role
    if (role === 'customer') {
      await pool.execute(
        'INSERT INTO customers (user_id, first_name, last_name, display_name) VALUES (?, ?, ?, ?)',
        [userId, firstName, lastName, `${firstName} ${lastName}`]
      );
    } else if (role === 'trainer') {
      await pool.execute(
        'INSERT INTO trainers (user_id, first_name, last_name, display_name) VALUES (?, ?, ?, ?)',
        [userId, firstName, lastName, `${firstName} ${lastName}`]
      );
    }

    // Generate token
    const token = generateToken({ id: userId, email, role });

    sendResponse(res, 201, {
      token,
      user: { id: userId, email, role, firstName, lastName }
    }, 'สมัครสมาชิกสำเร็จ');

  } catch (error) {
    handleError(res, error, 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendResponse(res, 400, null, 'กรุณากรอกอีเมลและรหัสผ่าน');
    }

    // Get user
    const [users] = await pool.execute(
      'SELECT id, email, password, role, status FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return sendResponse(res, 401, null, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    const user = users[0];

    // Check account status
    if (user.status !== 'active') {
      return sendResponse(res, 401, null, 'บัญชีของคุณถูกระงับ');
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return sendResponse(res, 401, null, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    // Update last login
    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Generate token
    const token = generateToken(user);

    sendResponse(res, 200, {
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      }
    }, 'เข้าสู่ระบบสำเร็จ');

  } catch (error) {
    handleError(res, error, 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
  }
});

// ===================================
// Trainer Routes
// ===================================

// Get featured trainers
app.get('/api/trainers/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    const [trainers] = await pool.execute(`
      SELECT 
        t.id,
        t.display_name,
        t.first_name,
        t.last_name,
        t.specialties,
        t.city,
        t.province,
        t.experience_years,
        t.rating,
        t.total_reviews,
        t.hourly_rate,
        t.avatar_url,
        u.email
      FROM trainers t
      JOIN users u ON t.user_id = u.id
      WHERE u.status = 'active' 
        AND t.verification_status = 'verified'
        AND t.is_available = 1
      ORDER BY t.is_featured DESC, t.rating DESC, t.total_reviews DESC
      LIMIT ?
    `, [limit]);

    sendResponse(res, 200, trainers, 'ดึงข้อมูลเทรนเนอร์แนะนำสำเร็จ');

  } catch (error) {
    handleError(res, error, 'เกิดข้อผิดพลาดในการดึงข้อมูลเทรนเนอร์');
  }
});

// Search trainers
app.get('/api/trainers', async (req, res) => {
  try {
    const { 
      location, 
      specialty, 
      price, 
      rating, 
      page = 1, 
      limit = 12 
    } = req.query;

    let query = `
      SELECT 
        t.id,
        t.display_name,
        t.first_name,
        t.last_name,
        t.specialties,
        t.city,
        t.province,
        t.experience_years,
        t.rating,
        t.total_reviews,
        t.hourly_rate,
        t.avatar_url
      FROM trainers t
      JOIN users u ON t.user_id = u.id
      WHERE u.status = 'active' 
        AND t.verification_status = 'verified'
        AND t.is_available = 1
    `;

    const params = [];

    // Add filters
    if (location) {
      query += ` AND (t.city LIKE ? OR t.province LIKE ?)`;
      params.push(`%${location}%`, `%${location}%`);
    }

    if (specialty) {
      query += ` AND t.specialties LIKE ?`;
      params.push(`%${specialty}%`);
    }

    if (price) {
      const [minPrice, maxPrice] = price.split('-');
      if (maxPrice) {
        query += ` AND t.hourly_rate BETWEEN ? AND ?`;
        params.push(parseFloat(minPrice), parseFloat(maxPrice));
      } else {
        query += ` AND t.hourly_rate >= ?`;
        params.push(parseFloat(minPrice));
      }
    }

    if (rating) {
      query += ` AND t.rating >= ?`;
      params.push(parseFloat(rating));
    }

    // Add ordering and pagination
    query += ` ORDER BY t.is_featured DESC, t.rating DESC`;
    
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [trainers] = await pool.execute(query, params);

    // Get total count for pagination
    let countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY[\s\S]*/, '');
    const countParams = params.slice(0, -2); // Remove limit and offset
    const [countResult] = await pool.execute(countQuery, countParams);

    sendResponse(res, 200, {
      trainers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    }, 'ค้นหาเทรนเนอร์สำเร็จ');

  } catch (error) {
    handleError(res, error, 'เกิดข้อผิดพลาดในการค้นหาเทรนเนอร์');
  }
});

// Get trainer profile
app.get('/api/trainers/:id', async (req, res) => {
  try {
    const trainerId = req.params.id;

    // Get trainer info
    const [trainers] = await pool.execute(`
      SELECT 
        t.*,
        u.email,
        u.last_login
      FROM trainers t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ? AND u.status = 'active'
    `, [trainerId]);

    if (trainers.length === 0) {
      return sendResponse(res, 404, null, 'ไม่พบเทรนเนอร์');
    }

    const trainer = trainers[0];

    // Get trainer photos
    const [photos] = await pool.execute(`
      SELECT photo_url, caption, is_primary, order_index
      FROM trainer_photos
      WHERE trainer_id = ?
      ORDER BY is_primary DESC, order_index ASC
    `, [trainerId]);

    // Get packages
    const [packages] = await pool.execute(`
      SELECT *
      FROM training_packages
      WHERE trainer_id = ? AND is_active = 1
      ORDER BY is_featured DESC, price ASC
    `, [trainerId]);

    // Get recent reviews
    const [reviews] = await pool.execute(`
      SELECT 
        r.rating,
        r.comment,
        r.created_at,
        c.first_name,
        c.last_name,
        c.avatar_url
      FROM reviews r
      JOIN customers c ON r.customer_id = c.id
      WHERE r.trainer_id = ? AND r.is_public = 1
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [trainerId]);

    // Get working hours
    const [workingHours] = await pool.execute(`
      SELECT day_of_week, start_time, end_time, is_available
      FROM trainer_working_hours
      WHERE trainer_id = ?
      ORDER BY day_of_week
    `, [trainerId]);

    sendResponse(res, 200, {
      ...trainer,
      photos,
      packages,
      reviews,
      working_hours: workingHours
    }, 'ดึงข้อมูลเทรนเนอร์สำเร็จ');

  } catch (error) {
    handleError(res, error, 'เกิดข้อผิดพลาดในการดึงข้อมูลเทรนเนอร์');
  }
});

// ===================================
// Article Routes
// ===================================

// Get featured articles
app.get('/api/articles/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;

    const [articles] = await pool.execute(`
      SELECT 
        id,
        title,
        slug,
        excerpt,
        featured_image_url as image_url,
        category,
        published_at,
        view_count
      FROM articles
      WHERE status = 'published'
      ORDER BY is_featured DESC, published_at DESC
      LIMIT ?
    `, [limit]);

    sendResponse(res, 200, articles, 'ดึงข้อมูลบทความแนะนำสำเร็จ');

  } catch (error) {
    handleError(res, error, 'เกิดข้อผิดพลาดในการดึงข้อมูลบทความ');
  }
});

// ===================================
// Event Routes
// ===================================

// Get featured events
app.get('/api/events/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 2;

    const [events] = await pool.execute(`
      SELECT 
        id,
        title,
        description,
        featured_image_url as image_url,
        event_date,
        start_date,
        start_time,
        location_name,
        location_address
      FROM events
      WHERE status = 'published' 
        AND start_date >= NOW()
      ORDER BY is_featured DESC, start_date ASC
      LIMIT ?
    `, [limit]);

    sendResponse(res, 200, events, 'ดึงข้อมูลอีเว้นท์แนะนำสำเร็จ');

  } catch (error) {
    handleError(res, error, 'เกิดข้อผิดพลาดในการดึงข้อมูลอีเว้นท์');
  }
});

// ===================================
// Review Routes
// ===================================

// Get featured reviews
app.get('/api/reviews/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const [reviews] = await pool.execute(`
      SELECT 
        r.id,
        r.rating,
        r.comment as review_text,
        r.created_at,
        c.first_name,
        c.last_name,
        c.avatar_url as customer_avatar,
        CONCAT(c.first_name, ' ', c.last_name) as customer_name,
        t.display_name as trainer_name,
        p.name as package_name
      FROM reviews r
      JOIN customers c ON r.customer_id = c.id
      JOIN trainers t ON r.trainer_id = t.id
      LEFT JOIN training_sessions ts ON r.session_id = ts.id
      LEFT JOIN bookings b ON ts.booking_id = b.id
      LEFT JOIN training_packages p ON b.package_id = p.id
      WHERE r.is_public = 1 AND r.is_featured = 1
      ORDER BY r.created_at DESC
      LIMIT ?
    `, [limit]);

    sendResponse(res, 200, reviews, 'ดึงข้อมูลรีวิวแนะนำสำเร็จ');

  } catch (error) {
    handleError(res, error, 'เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว');
  }
});

// ===================================
// Error Handler
// ===================================
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  sendResponse(res, 500, null, 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์');
});

// 404 Handler
app.use('*', (req, res) => {
  sendResponse(res, 404, null, 'ไม่พบ API endpoint ที่ต้องการ');
});

// ===================================
// Start Server
// ===================================
async function startServer() {
  try {
    await testConnection();
    
    app.listen(PORT, () => {
      console.log('🚀 Server started successfully!');
      console.log('═══════════════════════════════════════');
      console.log(`📡 API Server: http://localhost:${PORT}`);
      console.log(`🗄️  Database: ${dbConfig.database}`);
      console.log(`🔗 phpMyAdmin: http://localhost/phpmyadmin`);
      console.log('═══════════════════════════════════════');
      console.log('📋 Available endpoints:');
      console.log('   GET  /api/health               - Health check');
      console.log('   POST /api/auth/register        - สมัครสมาชิก');
      console.log('   POST /api/auth/login           - เข้าสู่ระบบ');
      console.log('   GET  /api/trainers/featured    - เทรนเนอร์แนะนำ');
      console.log('   GET  /api/trainers             - ค้นหาเทรนเนอร์');
      console.log('   GET  /api/trainers/:id         - รายละเอียดเทรนเนอร์');
      console.log('   GET  /api/articles/featured    - บทความแนะนำ');
      console.log('   GET  /api/events/featured      - อีเว้นท์แนะนำ');
      console.log('   GET  /api/reviews/featured     - รีวิวแนะนำ');
      console.log('═══════════════════════════════════════');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();