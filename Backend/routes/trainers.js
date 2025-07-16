const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const rateLimit = require('express-rate-limit');
const { body, query, param, validationResult } = require('express-validator');

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'fitness_app',
  password: process.env.DB_PASSWORD || 'fitness_password_123',
  database: process.env.DB_NAME || 'fitness_trainer_platform',
  charset: 'utf8mb4',
  timezone: '+07:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Rate limiting
const searchRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    error: 'Too many search requests',
    message: 'กรุณารอสักครู่แล้วลองค้นหาใหม่อีกครั้ง'
  }
});

const detailRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    error: 'Too many detail requests',
    message: 'กรุณารอสักครู่แล้วลองดูข้อมูลใหม่อีกครั้ง'
  }
});

// Helper function to create database connection
async function createConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    throw new Error('ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
  }
}

// Helper function to handle database errors
function handleDatabaseError(error, res) {
  console.error('Database error:', error);
  
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'Database connection refused',
      message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่ในภายหลัง'
    });
  }
  
  if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(503).json({
      error: 'Database access denied',
      message: 'ไม่สามารถเข้าถึงฐานข้อมูลได้'
    });
  }
  
  return res.status(500).json({
    error: 'Database error',
    message: 'เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง'
  });
}

// Helper function to build search query
function buildSearchQuery(filters) {
  let query = `
    SELECT DISTINCT
      t.id,
      t.user_id,
      u.first_name,
      u.last_name,
      u.profile_picture,
      u.email,
      u.phone,
      t.bio,
      t.experience_years,
      t.hourly_rate,
      t.gender,
      t.verified,
      t.available,
      t.response_time,
      t.completed_sessions,
      t.join_date,
      t.last_active,
      t.is_online,
      AVG(r.rating) as average_rating,
      COUNT(DISTINCT r.id) as review_count,
      GROUP_CONCAT(DISTINCT CONCAT(sa.area_name, ',', sa.province) SEPARATOR '|') as service_areas,
      GROUP_CONCAT(DISTINCT CONCAT(e.id, ':', e.name) SEPARATOR '|') as expertise,
      GROUP_CONCAT(DISTINCT CONCAT(a.id, ':', a.name) SEPARATOR '|') as activities
    FROM trainers t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN reviews r ON t.id = r.trainer_id AND r.status = 'approved'
    LEFT JOIN trainer_service_areas tsa ON t.id = tsa.trainer_id
    LEFT JOIN service_areas sa ON tsa.area_id = sa.id
    LEFT JOIN trainer_expertise te ON t.id = te.trainer_id
    LEFT JOIN expertise e ON te.expertise_id = e.id
    LEFT JOIN trainer_activities ta ON t.id = ta.trainer_id
    LEFT JOIN activities a ON ta.activity_id = a.id
    WHERE t.status = 'active' AND u.status = 'active'
  `;
  
  const params = [];
  
  // Text search
  if (filters.q) {
    query += ` AND (
      MATCH(u.first_name, u.last_name, t.bio) AGAINST (? IN NATURAL LANGUAGE MODE)
      OR u.first_name LIKE ?
      OR u.last_name LIKE ?
      OR t.bio LIKE ?
    )`;
    const searchTerm = `%${filters.q}%`;
    params.push(filters.q, searchTerm, searchTerm, searchTerm);
  }
  
  // Location filter
  if (filters.location) {
    query += ` AND sa.area_name LIKE ?`;
    params.push(`%${filters.location}%`);
  }
  
  // Gender filter
  if (filters.gender) {
    query += ` AND t.gender = ?`;
    params.push(filters.gender);
  }
  
  // Experience filter
  if (filters.experience) {
    const expRange = filters.experience.split('-');
    if (expRange.length === 2) {
      const min = parseInt(expRange[0]);
      const max = expRange[1] === '+' ? 999 : parseInt(expRange[1]);
      query += ` AND t.experience_years BETWEEN ? AND ?`;
      params.push(min, max);
    }
  }
  
  // Price range filter
  if (filters.min_price) {
    query += ` AND t.hourly_rate >= ?`;
    params.push(parseFloat(filters.min_price));
  }
  
  if (filters.max_price) {
    query += ` AND t.hourly_rate <= ?`;
    params.push(parseFloat(filters.max_price));
  }
  
  // Rating filter
  if (filters.min_rating) {
    query += ` HAVING average_rating >= ?`;
    params.push(parseFloat(filters.min_rating));
  }
  
  // Verification filter
  if (filters.verified !== undefined) {
    query += ` AND t.verified = ?`;
    params.push(filters.verified === 'true' ? 1 : 0);
  }
  
  // Availability filter
  if (filters.availability === 'available') {
    query += ` AND t.available = 1`;
  }
  
  // Group by
  query += ` GROUP BY t.id`;
  
  // Having clause for expertise and activities
  if (filters.expertise) {
    const expertiseIds = filters.expertise.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    if (expertiseIds.length > 0) {
      query += ` HAVING COUNT(DISTINCT CASE WHEN e.id IN (${expertiseIds.map(() => '?').join(',')}) THEN e.id END) >= ?`;
      params.push(...expertiseIds, expertiseIds.length);
    }
  }
  
  if (filters.activities) {
    const activityIds = filters.activities.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    if (activityIds.length > 0) {
      query += ` ${filters.expertise ? 'AND' : 'HAVING'} COUNT(DISTINCT CASE WHEN a.id IN (${activityIds.map(() => '?').join(',')}) THEN a.id END) >= ?`;
      params.push(...activityIds, activityIds.length);
    }
  }
  
  return { query, params };
}

// Helper function to add sorting
function addSorting(query, sortBy) {
  switch (sortBy) {
    case 'rating':
      return query + ` ORDER BY average_rating DESC, review_count DESC`;
    case 'price-low':
      return query + ` ORDER BY t.hourly_rate ASC`;
    case 'price-high':
      return query + ` ORDER BY t.hourly_rate DESC`;
    case 'experience':
      return query + ` ORDER BY t.experience_years DESC`;
    case 'newest':
      return query + ` ORDER BY t.join_date DESC`;
    case 'distance':
      return query + ` ORDER BY distance_km ASC`;
    case 'recommended':
    default:
      return query + ` ORDER BY 
        (CASE WHEN t.verified = 1 THEN 1 ELSE 0 END) DESC,
        (CASE WHEN t.available = 1 THEN 1 ELSE 0 END) DESC,
        average_rating DESC,
        review_count DESC,
        t.completed_sessions DESC`;
  }
}

// Helper function to format trainer data
function formatTrainerData(trainer) {
  return {
    id: trainer.id,
    name: `${trainer.first_name} ${trainer.last_name}`.trim(),
    firstName: trainer.first_name,
    lastName: trainer.last_name,
    profileImage: trainer.profile_picture,
    email: trainer.email,
    phone: trainer.phone,
    bio: trainer.bio,
    rating: parseFloat(trainer.average_rating) || 0,
    reviewCount: parseInt(trainer.review_count) || 0,
    experience: parseInt(trainer.experience_years) || 0,
    hourlyRate: parseFloat(trainer.hourly_rate) || 0,
    gender: trainer.gender,
    verified: Boolean(trainer.verified),
    available: Boolean(trainer.available),
    responseTime: trainer.response_time,
    completedSessions: parseInt(trainer.completed_sessions) || 0,
    joinDate: trainer.join_date,
    lastActive: trainer.last_active,
    isOnline: Boolean(trainer.is_online),
    serviceAreas: trainer.service_areas ? trainer.service_areas.split('|').map(area => {
      const [name, province] = area.split(',');
      return { name, province };
    }) : [],
    specialties: trainer.expertise ? trainer.expertise.split('|').map(exp => {
      const [id, name] = exp.split(':');
      return { id: parseInt(id), name };
    }) : [],
    activities: trainer.activities ? trainer.activities.split('|').map(act => {
      const [id, name] = act.split(':');
      return { id: parseInt(id), name };
    }) : [],
    distanceKm: parseFloat(trainer.distance_km) || 0
  };
}

// ========================================
// ROUTES
// ========================================

/**
 * GET /api/trainers/search - ค้นหาเทรนเนอร์
 */
router.get('/search', 
  searchRateLimit,
  [
    query('q').optional().isString().trim().isLength({ max: 100 }),
    query('location').optional().isString().trim().isLength({ max: 50 }),
    query('gender').optional().isIn(['male', 'female', 'other']),
    query('experience').optional().matches(/^(\d+-\d+|\d+\+)$/),
    query('min_price').optional().isFloat({ min: 0 }),
    query('max_price').optional().isFloat({ min: 0 }),
    query('min_rating').optional().isFloat({ min: 0, max: 5 }),
    query('expertise').optional().isString(),
    query('activities').optional().isString(),
    query('sort').optional().isIn(['recommended', 'rating', 'price-low', 'price-high', 'experience', 'newest', 'distance']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('lat').optional().isFloat({ min: -90, max: 90 }),
    query('lng').optional().isFloat({ min: -180, max: 180 }),
    query('radius').optional().isInt({ min: 1, max: 100 }),
    query('verified').optional().isBoolean(),
    query('availability').optional().isIn(['available', 'all'])
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Invalid parameters',
          message: 'ข้อมูลที่ส่งมาไม่ถูกต้อง',
          details: errors.array()
        });
      }

      const filters = req.query;
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const offset = (page - 1) * limit;

      const connection = await createConnection();

      try {
        // Build search query
        const { query: searchQuery, params } = buildSearchQuery(filters);
        
        // Add distance calculation if location provided
        let finalQuery = searchQuery;
        if (filters.lat && filters.lng) {
          const lat = parseFloat(filters.lat);
          const lng = parseFloat(filters.lng);
          const radius = parseInt(filters.radius) || 50;
          
          finalQuery = finalQuery.replace(
            'SELECT DISTINCT',
            `SELECT DISTINCT, 
             (6371 * acos(cos(radians(${lat})) * cos(radians(sa.latitude)) * 
             cos(radians(sa.longitude) - radians(${lng})) + 
             sin(radians(${lat})) * sin(radians(sa.latitude)))) AS distance_km`
          );
          
          finalQuery += ` HAVING distance_km <= ${radius}`;
        }
        
        // Add sorting
        finalQuery = addSorting(finalQuery, filters.sort);
        
        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM (${finalQuery}) as counted`;
        const [countResult] = await connection.execute(countQuery, params);
        const total = countResult[0].total;
        
        // Add pagination
        finalQuery += ` LIMIT ${limit} OFFSET ${offset}`;
        
        // Execute search
        const startTime = Date.now();
        const [trainers] = await connection.execute(finalQuery, params);
        const searchTime = Date.now() - startTime;
        
        // Format results
        const formattedTrainers = trainers.map(formatTrainerData);
        
        res.json({
          success: true,
          trainers: formattedTrainers,
          pagination: {
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            limit,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          },
          meta: {
            searchTime: `${searchTime}ms`,
            totalResults: total,
            query: filters.q || null,
            filters: {
              location: filters.location || null,
              expertise: filters.expertise || null,
              activities: filters.activities || null,
              priceRange: {
                min: filters.min_price || null,
                max: filters.max_price || null
              }
            }
          }
        });

      } finally {
        await connection.end();
      }

    } catch (error) {
      console.error('Search trainers error:', error);
      handleDatabaseError(error, res);
    }
  }
);

/**
 * GET /api/trainers/featured - ดึงเทรนเนอร์แนะนำ
 */
router.get('/featured', 
  detailRateLimit,
  [
    query('limit').optional().isInt({ min: 1, max: 20 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Invalid parameters',
          message: 'ข้อมูลที่ส่งมาไม่ถูกต้อง'
        });
      }

      const limit = parseInt(req.query.limit) || 8;
      const connection = await createConnection();

      try {
        const query = `
          SELECT DISTINCT
            t.id,
            t.user_id,
            u.first_name,
            u.last_name,
            u.profile_picture,
            t.bio,
            t.experience_years,
            t.hourly_rate,
            t.gender,
            t.verified,
            t.available,
            t.response_time,
            t.completed_sessions,
            AVG(r.rating) as average_rating,
            COUNT(DISTINCT r.id) as review_count,
            GROUP_CONCAT(DISTINCT CONCAT(sa.area_name, ',', sa.province) SEPARATOR '|') as service_areas,
            GROUP_CONCAT(DISTINCT CONCAT(e.id, ':', e.name) SEPARATOR '|') as expertise
          FROM trainers t
          LEFT JOIN users u ON t.user_id = u.id
          LEFT JOIN reviews r ON t.id = r.trainer_id AND r.status = 'approved'
          LEFT JOIN trainer_service_areas tsa ON t.id = tsa.trainer_id
          LEFT JOIN service_areas sa ON tsa.area_id = sa.id
          LEFT JOIN trainer_expertise te ON t.id = te.trainer_id
          LEFT JOIN expertise e ON te.expertise_id = e.id
          WHERE t.status = 'active' 
            AND u.status = 'active'
            AND t.verified = 1
            AND t.available = 1
          GROUP BY t.id
          HAVING average_rating >= 4.0 OR average_rating IS NULL
          ORDER BY 
            t.verified DESC,
            average_rating DESC,
            review_count DESC,
            t.completed_sessions DESC,
            RAND()
          LIMIT ?
        `;

        const [trainers] = await connection.execute(query, [limit]);
        const formattedTrainers = trainers.map(formatTrainerData);

        res.json({
          success: true,
          trainers: formattedTrainers
        });

      } finally {
        await connection.end();
      }

    } catch (error) {
      console.error('Get featured trainers error:', error);
      handleDatabaseError(error, res);
    }
  }
);

/**
 * GET /api/trainers/:id - ดึงข้อมูลเทรนเนอร์ตาม ID
 */
router.get('/:id',
  detailRateLimit,
  [
    param('id').isInt({ min: 1 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Invalid trainer ID',
          message: 'รหัสเทรนเนอร์ไม่ถูกต้อง'
        });
      }

      const trainerId = parseInt(req.params.id);
      const connection = await createConnection();

      try {
        const query = `
          SELECT 
            t.*,
            u.first_name,
            u.last_name,
            u.profile_picture,
            u.email,
            u.phone,
            AVG(r.rating) as average_rating,
            COUNT(DISTINCT r.id) as review_count,
            GROUP_CONCAT(DISTINCT CONCAT(sa.area_name, ',', sa.province) SEPARATOR '|') as service_areas,
            GROUP_CONCAT(DISTINCT CONCAT(e.id, ':', e.name) SEPARATOR '|') as expertise,
            GROUP_CONCAT(DISTINCT CONCAT(a.id, ':', a.name) SEPARATOR '|') as activities
          FROM trainers t
          LEFT JOIN users u ON t.user_id = u.id
          LEFT JOIN reviews r ON t.id = r.trainer_id AND r.status = 'approved'
          LEFT JOIN trainer_service_areas tsa ON t.id = tsa.trainer_id
          LEFT JOIN service_areas sa ON tsa.area_id = sa.id
          LEFT JOIN trainer_expertise te ON t.id = te.trainer_id
          LEFT JOIN expertise e ON te.expertise_id = e.id
          LEFT JOIN trainer_activities ta ON t.id = ta.trainer_id
          LEFT JOIN activities a ON ta.activity_id = a.id
          WHERE t.id = ? AND t.status = 'active' AND u.status = 'active'
          GROUP BY t.id
        `;

        const [trainers] = await connection.execute(query, [trainerId]);

        if (trainers.length === 0) {
          return res.status(404).json({
            error: 'Trainer not found',
            message: 'ไม่พบข้อมูลเทรนเนอร์ที่ค้นหา'
          });
        }

        const trainer = formatTrainerData(trainers[0]);

        res.json({
          success: true,
          trainer
        });

      } finally {
        await connection.end();
      }

    } catch (error) {
      console.error('Get trainer by ID error:', error);
      handleDatabaseError(error, res);
    }
  }
);

/**
 * GET /api/trainers/filters - ดึงตัวเลือกการกรอง
 */
router.get('/filters', async (req, res) => {
  try {
    const connection = await createConnection();

    try {
      // Get all filter options in parallel
      const [
        [expertise],
        [activities],
        [serviceAreas],
        [priceRanges]
      ] = await Promise.all([
        connection.execute('SELECT id, name, icon FROM expertise WHERE status = "active" ORDER BY name'),
        connection.execute('SELECT id, name, icon, category FROM activities WHERE status = "active" ORDER BY category, name'),
        connection.execute(`
          SELECT DISTINCT sa.area_name as name, sa.province, COUNT(tsa.trainer_id) as trainer_count
          FROM service_areas sa
          LEFT JOIN trainer_service_areas tsa ON sa.id = tsa.area_id
          LEFT JOIN trainers t ON tsa.trainer_id = t.id AND t.status = 'active'
          GROUP BY sa.id
          HAVING trainer_count > 0
          ORDER BY trainer_count DESC, sa.area_name
        `),
        connection.execute(`
          SELECT 
            CASE 
              WHEN hourly_rate < 500 THEN '0-500'
              WHEN hourly_rate < 1000 THEN '500-1000'
              WHEN hourly_rate < 2000 THEN '1000-2000'
              WHEN hourly_rate < 3000 THEN '2000-3000'
              ELSE '3000+'
            END as range,
            COUNT(*) as count
          FROM trainers 
          WHERE status = 'active' AND hourly_rate > 0
          GROUP BY range
          ORDER BY MIN(hourly_rate)
        `)
      ]);

      res.json({
        success: true,
        expertise: expertise.map(e => ({
          id: e.id,
          name: e.name,
          icon: e.icon
        })),
        activities: activities.map(a => ({
          id: a.id,
          name: a.name,
          icon: a.icon,
          category: a.category
        })),
        locations: serviceAreas.map(sa => ({
          name: sa.name,
          province: sa.province,
          trainerCount: sa.trainer_count
        })),
        priceRanges: priceRanges.map(pr => ({
          range: pr.range,
          count: pr.count,
          label: this.getPriceRangeLabel(pr.range)
        }))
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('Get filters error:', error);
    handleDatabaseError(error, res);
  }
});

/**
 * POST /api/trainers/:id/views - บันทึกการดูโปรไฟล์
 */
router.post('/:id/views',
  [
    param('id').isInt({ min: 1 }),
    body('source').optional().isString(),
    body('timestamp').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Invalid parameters'
        });
      }

      const trainerId = parseInt(req.params.id);
      const { source = 'unknown', timestamp = new Date().toISOString() } = req.body;
      const userAgent = req.get('User-Agent') || '';
      const ipAddress = req.ip || req.connection.remoteAddress;

      const connection = await createConnection();

      try {
        // Insert view record (fire and forget for analytics)
        const insertQuery = `
          INSERT INTO trainer_views (trainer_id, ip_address, user_agent, source, viewed_at)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE view_count = view_count + 1
        `;

        await connection.execute(insertQuery, [
          trainerId,
          ipAddress,
          userAgent,
          source,
          timestamp
        ]);

        res.status(201).json({
          success: true,
          message: 'View recorded'
        });

      } finally {
        await connection.end();
      }

    } catch (error) {
      console.error('Record view error:', error);
      // Don't return error for analytics
      res.status(201).json({
        success: true,
        message: 'View recorded'
      });
    }
  }
);

// Helper function for price range labels
function getPriceRangeLabel(range) {
  const labels = {
    '0-500': 'ต่ำกว่า 500 บาท',
    '500-1000': '500-1,000 บาท',
    '1000-2000': '1,000-2,000 บาท',
    '2000-3000': '2,000-3,000 บาท',
    '3000+': 'มากกว่า 3,000 บาท'
  };
  return labels[range] || range;
}

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Trainers API Error:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'ข้อมูล JSON ไม่ถูกต้อง'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
  });
});

module.exports = router;