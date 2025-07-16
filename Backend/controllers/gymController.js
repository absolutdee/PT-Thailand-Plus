// gymController.js
const db = require('../config/database');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const axios = require('axios');

// กำหนดการอัพโหลดรูปภาพ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/gyms/');
  },
  filename: (req, file, cb) => {
    cb(null, `gym-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const gymController = {
  // ดึงรายการยิมทั้งหมด
  getAllGyms: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 12,
        search = '',
        province = '',
        type = 'all',
        minPrice = 0,
        maxPrice = 10000,
        facilities = '',
        rating = 0,
        status = 'all',
        lat,
        lng,
        radius = 10, // km
        sortBy = 'name',
        order = 'ASC'
      } = req.query;

      const offset = (page - 1) * limit;

      let query = `
        SELECT g.*,
               AVG(gr.rating) as average_rating,
               COUNT(DISTINCT gr.id) as review_count,
               COUNT(DISTINCT gi.id) as image_count
        FROM gyms g
        LEFT JOIN gym_reviews gr ON g.id = gr.gym_id
        LEFT JOIN gym_images gi ON g.id = gi.gym_id
        WHERE 1=1
      `;

      const queryParams = [];

      // Search filter
      if (search) {
        query += ` AND (g.name LIKE ? OR g.address LIKE ? OR g.description LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Province filter
      if (province) {
        query += ` AND g.province = ?`;
        queryParams.push(province);
      }

      // Type filter
      if (type !== 'all') {
        query += ` AND g.type = ?`;
        queryParams.push(type);
      }

      // Price range filter
      query += ` AND g.monthly_price BETWEEN ? AND ?`;
      queryParams.push(minPrice, maxPrice);

      // Status filter
      if (status !== 'all') {
        query += ` AND g.status = ?`;
        queryParams.push(status);
      }

      // Facilities filter (JSON search)
      if (facilities) {
        const facilitiesArray = facilities.split(',');
        facilitiesArray.forEach(facility => {
          query += ` AND JSON_CONTAINS(g.facilities, ?)`;
          queryParams.push(`"${facility}"`);
        });
      }

      // Location-based search
      if (lat && lng) {
        query += ` AND (
          6371 * acos(
            cos(radians(?)) * cos(radians(g.latitude)) *
            cos(radians(g.longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(g.latitude))
          )
        ) <= ?`;
        queryParams.push(lat, lng, lat, radius);
      }

      // Group by
      query += ` GROUP BY g.id`;

      // Having clause for rating
      if (rating > 0) {
        query += ` HAVING average_rating >= ?`;
        queryParams.push(rating);
      }

      // Sorting
      let orderByClause = '';
      switch (sortBy) {
        case 'price':
          orderByClause = `g.monthly_price ${order}`;
          break;
        case 'rating':
          orderByClause = `average_rating ${order}`;
          break;
        case 'distance':
          if (lat && lng) {
            orderByClause = `(6371 * acos(cos(radians(${lat})) * cos(radians(g.latitude)) * cos(radians(g.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(g.latitude)))) ${order}`;
          } else {
            orderByClause = `g.name ${order}`;
          }
          break;
        default:
          orderByClause = `g.name ${order}`;
      }
      query += ` ORDER BY ${orderByClause}`;

      // Pagination
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(parseInt(limit), parseInt(offset));

      // Execute main query
      const [gyms] = await db.execute(query, queryParams);

      // Get total count
      let countQuery = `SELECT COUNT(DISTINCT g.id) as total FROM gyms g WHERE 1=1`;
      const countParams = [];

      if (search) {
        countQuery += ` AND (g.name LIKE ? OR g.address LIKE ? OR g.description LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (province) {
        countQuery += ` AND g.province = ?`;
        countParams.push(province);
      }

      if (type !== 'all') {
        countQuery += ` AND g.type = ?`;
        countParams.push(type);
      }

      countQuery += ` AND g.monthly_price BETWEEN ? AND ?`;
      countParams.push(minPrice, maxPrice);

      if (status !== 'all') {
        countQuery += ` AND g.status = ?`;
        countParams.push(status);
      }

      if (lat && lng) {
        countQuery += ` AND (6371 * acos(cos(radians(?)) * cos(radians(g.latitude)) * cos(radians(g.longitude) - radians(?)) + sin(radians(?)) * sin(radians(g.latitude)))) <= ?`;
        countParams.push(lat, lng, lat, radius);
      }

      const [countResult] = await db.execute(countQuery, countParams);
      const totalGyms = countResult[0].total;

      // Process facilities from JSON
      gyms.forEach(gym => {
        if (gym.facilities) {
          try {
            gym.facilities = JSON.parse(gym.facilities);
          } catch (e) {
            gym.facilities = [];
          }
        }
        if (gym.operating_hours) {
          try {
            gym.operating_hours = JSON.parse(gym.operating_hours);
          } catch (e) {
            gym.operating_hours = {};
          }
        }
      });

      res.json({
        success: true,
        data: {
          gyms,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalGyms / limit),
            totalItems: totalGyms,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get all gyms error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch gyms',
        error: error.message
      });
    }
  },

  // ดึงข้อมูลยิมตาม ID
  getGymById: async (req, res) => {
    try {
      const { id } = req.params;

      // Get gym details
      const [gyms] = await db.execute(`
        SELECT g.*,
               AVG(gr.rating) as average_rating,
               COUNT(DISTINCT gr.id) as review_count
        FROM gyms g
        LEFT JOIN gym_reviews gr ON g.id = gr.gym_id
        WHERE g.id = ?
        GROUP BY g.id
      `, [id]);

      if (gyms.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Gym not found'
        });
      }

      const gym = gyms[0];

      // Parse JSON fields
      if (gym.facilities) {
        try {
          gym.facilities = JSON.parse(gym.facilities);
        } catch (e) {
          gym.facilities = [];
        }
      }

      if (gym.operating_hours) {
        try {
          gym.operating_hours = JSON.parse(gym.operating_hours);
        } catch (e) {
          gym.operating_hours = {};
        }
      }

      if (gym.contact_info) {
        try {
          gym.contact_info = JSON.parse(gym.contact_info);
        } catch (e) {
          gym.contact_info = {};
        }
      }

      // Get images
      const [images] = await db.execute(`
        SELECT * FROM gym_images
        WHERE gym_id = ?
        ORDER BY is_primary DESC, display_order ASC
      `, [id]);

      // Get recent reviews
      const [reviews] = await db.execute(`
        SELECT gr.*, u.first_name, u.last_name, u.profile_picture
        FROM gym_reviews gr
        JOIN users u ON gr.user_id = u.id
        WHERE gr.gym_id = ?
        ORDER BY gr.created_at DESC
        LIMIT 5
      `, [id]);

      // Get trainers at this gym
      const [trainers] = await db.execute(`
        SELECT t.*, u.first_name, u.last_name, u.profile_picture,
               AVG(r.rating) as average_rating
        FROM trainers t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN reviews r ON t.id = r.trainer_id
        WHERE t.gym_id = ?
        GROUP BY t.id
        LIMIT 6
      `, [id]);

      // Get membership plans
      const [membershipPlans] = await db.execute(`
        SELECT * FROM gym_membership_plans
        WHERE gym_id = ? AND status = 'active'
        ORDER BY price ASC
      `, [id]);

      res.json({
        success: true,
        data: {
          ...gym,
          images,
          reviews,
          trainers,
          membershipPlans
        }
      });

    } catch (error) {
      console.error('Get gym by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch gym details',
        error: error.message
      });
    }
  },

  // สร้างยิมใหม่ (Admin only)
  createGym: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        name,
        type,
        description,
        address,
        city,
        province,
        postal_code,
        latitude,
        longitude,
        phone,
        email,
        website,
        facilities,
        operating_hours,
        monthly_price,
        daily_price,
        status = 'pending'
      } = req.body;

      // Start transaction
      await db.beginTransaction();

      try {
        // Insert gym
        const [result] = await db.execute(`
          INSERT INTO gyms (
            name, type, description, address, city, province, postal_code,
            latitude, longitude, facilities, operating_hours,
            monthly_price, daily_price, status,
            contact_info, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          name, type, description, address, city, province, postal_code,
          latitude, longitude, 
          JSON.stringify(facilities || []),
          JSON.stringify(operating_hours || {}),
          monthly_price, daily_price, status,
          JSON.stringify({ phone, email, website })
        ]);

        const gymId = result.insertId;

        // Handle image upload
        if (req.files && req.files.length > 0) {
          const imagePromises = req.files.map((file, index) => {
            return db.execute(`
              INSERT INTO gym_images (gym_id, image_url, is_primary, display_order)
              VALUES (?, ?, ?, ?)
            `, [gymId, `/uploads/gyms/${file.filename}`, index === 0 ? 1 : 0, index + 1]);
          });

          await Promise.all(imagePromises);
        }

        await db.commit();

        res.status(201).json({
          success: true,
          message: 'Gym created successfully',
          data: { id: gymId }
        });

      } catch (error) {
        await db.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Create gym error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create gym',
        error: error.message
      });
    }
  },

  // อัพเดทข้อมูลยิม
  updateGym: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if gym exists
      const [gyms] = await db.execute('SELECT * FROM gyms WHERE id = ?', [id]);

      if (gyms.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Gym not found'
        });
      }

      const updateFields = [];
      const updateValues = [];

      // Dynamic update fields
      const allowedFields = [
        'name', 'type', 'description', 'address', 'city', 'province',
        'postal_code', 'latitude', 'longitude', 'monthly_price',
        'daily_price', 'status'
      ];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(req.body[field]);
        }
      });

      // Handle JSON fields
      if (req.body.facilities !== undefined) {
        updateFields.push('facilities = ?');
        updateValues.push(JSON.stringify(req.body.facilities));
      }

      if (req.body.operating_hours !== undefined) {
        updateFields.push('operating_hours = ?');
        updateValues.push(JSON.stringify(req.body.operating_hours));
      }

      if (req.body.phone || req.body.email || req.body.website) {
        const contactInfo = {
          phone: req.body.phone || gyms[0].phone,
          email: req.body.email || gyms[0].email,
          website: req.body.website || gyms[0].website
        };
        updateFields.push('contact_info = ?');
        updateValues.push(JSON.stringify(contactInfo));
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      updateFields.push('updated_at = NOW()');
      updateValues.push(id);

      await db.execute(
        `UPDATE gyms SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      res.json({
        success: true,
        message: 'Gym updated successfully'
      });

    } catch (error) {
      console.error('Update gym error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update gym',
        error: error.message
      });
    }
  },

  // ลบยิม (Soft delete)
  deleteGym: async (req, res) => {
    try {
      const { id } = req.params;

      await db.execute(
        'UPDATE gyms SET status = "deleted", deleted_at = NOW() WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Gym deleted successfully'
      });

    } catch (error) {
      console.error('Delete gym error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete gym',
        error: error.message
      });
    }
  },

  // ค้นหายิมใกล้เคียง
  searchNearbyGyms: async (req, res) => {
    try {
      const {
        lat,
        lng,
        radius = 5, // km
        type = 'all',
        limit = 10
      } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      let query = `
        SELECT g.*,
               AVG(gr.rating) as average_rating,
               COUNT(DISTINCT gr.id) as review_count,
               (
                 6371 * acos(
                   cos(radians(?)) * cos(radians(g.latitude)) *
                   cos(radians(g.longitude) - radians(?)) +
                   sin(radians(?)) * sin(radians(g.latitude))
                 )
               ) AS distance
        FROM gyms g
        LEFT JOIN gym_reviews gr ON g.id = gr.gym_id
        WHERE g.status = 'active'
          AND (
            6371 * acos(
              cos(radians(?)) * cos(radians(g.latitude)) *
              cos(radians(g.longitude) - radians(?)) +
              sin(radians(?)) * sin(radians(g.latitude))
            )
          ) <= ?
      `;

      const queryParams = [lat, lng, lat, lat, lng, lat, radius];

      if (type !== 'all') {
        query += ` AND g.type = ?`;
        queryParams.push(type);
      }

      query += ` GROUP BY g.id ORDER BY distance ASC LIMIT ?`;
      queryParams.push(parseInt(limit));

      const [gyms] = await db.execute(query, queryParams);

      // Process JSON fields
      gyms.forEach(gym => {
        if (gym.facilities) {
          try {
            gym.facilities = JSON.parse(gym.facilities);
          } catch (e) {
            gym.facilities = [];
          }
        }
      });

      res.json({
        success: true,
        data: gyms
      });

    } catch (error) {
      console.error('Search nearby gyms error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search nearby gyms',
        error: error.message
      });
    }
  },

  // เพิ่มรีวิวยิม
  addGymReview: async (req, res) => {
    try {
      const { gymId } = req.params;
      const userId = req.user.id;
      const {
        rating,
        title,
        comment,
        pros,
        cons
      } = req.body;

      // Check if gym exists
      const [gyms] = await db.execute('SELECT * FROM gyms WHERE id = ?', [gymId]);

      if (gyms.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Gym not found'
        });
      }

      // Check if user already reviewed
      const [existing] = await db.execute(
        'SELECT * FROM gym_reviews WHERE gym_id = ? AND user_id = ?',
        [gymId, userId]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this gym'
        });
      }

      // Insert review
      await db.execute(`
        INSERT INTO gym_reviews (gym_id, user_id, rating, title, comment, pros, cons, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [gymId, userId, rating, title, comment, pros, cons]);

      res.status(201).json({
        success: true,
        message: 'Review added successfully'
      });

    } catch (error) {
      console.error('Add gym review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add review',
        error: error.message
      });
    }
  },

  // Upload gym images
  uploadGymImages: [
    upload.array('images', 20),
    async (req, res) => {
      try {
        const { gymId } = req.params;

        // Check if gym exists
        const [gyms] = await db.execute('SELECT * FROM gyms WHERE id = ?', [gymId]);

        if (gyms.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Gym not found'
          });
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No images uploaded'
          });
        }

        // Get current max display order
        const [maxOrder] = await db.execute(
          'SELECT MAX(display_order) as max_order FROM gym_images WHERE gym_id = ?',
          [gymId]
        );

        let currentOrder = (maxOrder[0].max_order || 0) + 1;

        // Insert images
        const imagePromises = req.files.map((file, index) => {
          return db.execute(`
            INSERT INTO gym_images (gym_id, image_url, display_order, uploaded_at)
            VALUES (?, ?, ?, NOW())
          `, [gymId, `/uploads/gyms/${file.filename}`, currentOrder + index]);
        });

        await Promise.all(imagePromises);

        res.json({
          success: true,
          message: 'Images uploaded successfully',
          data: {
            count: req.files.length
          }
        });

      } catch (error) {
        console.error('Upload gym images error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to upload images',
          error: error.message
        });
      }
    }
  ],

  // สร้างแพลนสมาชิกยิม
  createMembershipPlan: async (req, res) => {
    try {
      const { gymId } = req.params;
      const {
        name,
        description,
        duration_months,
        price,
        features,
        status = 'active'
      } = req.body;

      // Check if gym exists
      const [gyms] = await db.execute('SELECT * FROM gyms WHERE id = ?', [gymId]);

      if (gyms.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Gym not found'
        });
      }

      await db.execute(`
        INSERT INTO gym_membership_plans 
        (gym_id, name, description, duration_months, price, features, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [gymId, name, description, duration_months, price, JSON.stringify(features), status]);

      res.status(201).json({
        success: true,
        message: 'Membership plan created successfully'
      });

    } catch (error) {
      console.error('Create membership plan error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create membership plan',
        error: error.message
      });
    }
  }
};

module.exports = gymController;
