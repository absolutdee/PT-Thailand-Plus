// couponController.js
const db = require('../config/database');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

const couponController = {
  // ดึงรายการคูปองทั้งหมด
  getAllCoupons: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status = 'all',
        type = 'all',
        search = '',
        isActive = 'all',
        createdBy = 'all',
        sortBy = 'created_at',
        order = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const currentDate = new Date().toISOString();

      let query = `
        SELECT c.*,
               u.first_name as creator_name,
               u.last_name as creator_lastname,
               COUNT(DISTINCT cu.id) as usage_count,
               COUNT(DISTINCT cu2.id) as unique_users
        FROM coupons c
        LEFT JOIN users u ON c.created_by = u.id
        LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
        LEFT JOIN coupon_usage cu2 ON c.id = cu2.coupon_id
        WHERE 1=1
      `;

      const queryParams = [];

      // Status filter
      if (status !== 'all') {
        query += ` AND c.status = ?`;
        queryParams.push(status);
      }

      // Type filter
      if (type !== 'all') {
        query += ` AND c.type = ?`;
        queryParams.push(type);
      }

      // Active filter (check dates)
      if (isActive === 'active') {
        query += ` AND c.status = 'active' AND c.start_date <= ? AND (c.end_date IS NULL OR c.end_date >= ?)`;
        queryParams.push(currentDate, currentDate);
      } else if (isActive === 'expired') {
        query += ` AND (c.status = 'expired' OR (c.end_date IS NOT NULL AND c.end_date < ?))`;
        queryParams.push(currentDate);
      }

      // Created by filter
      if (createdBy !== 'all') {
        query += ` AND c.created_by = ?`;
        queryParams.push(createdBy);
      }

      // Search filter
      if (search) {
        query += ` AND (c.code LIKE ? OR c.name LIKE ? OR c.description LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Group by
      query += ` GROUP BY c.id`;

      // Sorting
      const allowedSortFields = ['created_at', 'code', 'name', 'start_date', 'end_date', 'usage_count'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
      
      if (sortField === 'usage_count') {
        query += ` ORDER BY usage_count ${order === 'ASC' ? 'ASC' : 'DESC'}`;
      } else {
        query += ` ORDER BY c.${sortField} ${order === 'ASC' ? 'ASC' : 'DESC'}`;
      }

      // Pagination
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(parseInt(limit), parseInt(offset));

      // Execute main query
      const [coupons] = await db.execute(query, queryParams);

      // Get total count
      let countQuery = `SELECT COUNT(DISTINCT c.id) as total FROM coupons c WHERE 1=1`;
      const countParams = [];

      if (status !== 'all') {
        countQuery += ` AND c.status = ?`;
        countParams.push(status);
      }

      if (type !== 'all') {
        countQuery += ` AND c.type = ?`;
        countParams.push(type);
      }

      if (isActive === 'active') {
        countQuery += ` AND c.status = 'active' AND c.start_date <= ? AND (c.end_date IS NULL OR c.end_date >= ?)`;
        countParams.push(currentDate, currentDate);
      } else if (isActive === 'expired') {
        countQuery += ` AND (c.status = 'expired' OR (c.end_date IS NOT NULL AND c.end_date < ?))`;
        countParams.push(currentDate);
      }

      if (createdBy !== 'all') {
        countQuery += ` AND c.created_by = ?`;
        countParams.push(createdBy);
      }

      if (search) {
        countQuery += ` AND (c.code LIKE ? OR c.name LIKE ? OR c.description LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const [countResult] = await db.execute(countQuery, countParams);
      const totalCoupons = countResult[0].total;

      // Process applicable_to field
      coupons.forEach(coupon => {
        if (coupon.applicable_to) {
          try {
            coupon.applicable_to = JSON.parse(coupon.applicable_to);
          } catch (e) {
            coupon.applicable_to = [];
          }
        }
      });

      res.json({
        success: true,
        data: {
          coupons,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCoupons / limit),
            totalItems: totalCoupons,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get all coupons error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch coupons',
        error: error.message
      });
    }
  },

  // ดึงข้อมูลคูปองตาม ID
  getCouponById: async (req, res) => {
    try {
      const { id } = req.params;

      const [coupons] = await db.execute(`
        SELECT c.*,
               u.first_name as creator_name,
               u.last_name as creator_lastname,
               COUNT(DISTINCT cu.id) as total_usage,
               COUNT(DISTINCT cu.user_id) as unique_users
        FROM coupons c
        LEFT JOIN users u ON c.created_by = u.id
        LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
        WHERE c.id = ?
        GROUP BY c.id
      `, [id]);

      if (coupons.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }

      const coupon = coupons[0];

      // Parse applicable_to
      if (coupon.applicable_to) {
        try {
          coupon.applicable_to = JSON.parse(coupon.applicable_to);
        } catch (e) {
          coupon.applicable_to = [];
        }
      }

      // Get usage history
      const [usageHistory] = await db.execute(`
        SELECT cu.*, u.first_name, u.last_name, u.email,
               b.id as booking_id, b.total_amount
        FROM coupon_usage cu
        JOIN users u ON cu.user_id = u.id
        LEFT JOIN bookings b ON cu.booking_id = b.id
        WHERE cu.coupon_id = ?
        ORDER BY cu.used_at DESC
        LIMIT 20
      `, [id]);

      res.json({
        success: true,
        data: {
          ...coupon,
          usage_history: usageHistory
        }
      });

    } catch (error) {
      console.error('Get coupon by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch coupon details',
        error: error.message
      });
    }
  },

  // สร้างคูปองใหม่
  createCoupon: async (req, res) => {
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
        description,
        type,
        discount_type,
        discount_value,
        minimum_amount,
        maximum_discount,
        usage_limit,
        usage_limit_per_user,
        start_date,
        end_date,
        applicable_to,
        auto_generate_code = false,
        code_prefix = '',
        code_length = 8,
        status = 'active'
      } = req.body;

      const createdBy = req.user.id;

      // Generate coupon code
      let couponCode;
      if (auto_generate_code) {
        const randomCode = crypto.randomBytes(code_length / 2).toString('hex').toUpperCase();
        couponCode = code_prefix ? `${code_prefix}${randomCode}` : randomCode;
      } else {
        couponCode = req.body.code;
        
        // Check if code already exists
        const [existing] = await db.execute(
          'SELECT id FROM coupons WHERE code = ?',
          [couponCode]
        );

        if (existing.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Coupon code already exists'
          });
        }
      }

      // Insert coupon
      const [result] = await db.execute(`
        INSERT INTO coupons (
          code, name, description, type, discount_type,
          discount_value, minimum_amount, maximum_discount,
          usage_limit, usage_limit_per_user, used_count,
          start_date, end_date, applicable_to,
          status, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        couponCode, name, description, type, discount_type,
        discount_value, minimum_amount, maximum_discount,
        usage_limit, usage_limit_per_user,
        start_date, end_date, 
        JSON.stringify(applicable_to || []),
        status, createdBy
      ]);

      res.status(201).json({
        success: true,
        message: 'Coupon created successfully',
        data: {
          id: result.insertId,
          code: couponCode
        }
      });

    } catch (error) {
      console.error('Create coupon error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create coupon',
        error: error.message
      });
    }
  },

  // อัพเดทคูปอง
  updateCoupon: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if coupon exists
      const [coupons] = await db.execute('SELECT * FROM coupons WHERE id = ?', [id]);

      if (coupons.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }

      const updateFields = [];
      const updateValues = [];

      // Dynamic update fields
      const allowedFields = [
        'name', 'description', 'discount_type', 'discount_value',
        'minimum_amount', 'maximum_discount', 'usage_limit',
        'usage_limit_per_user', 'start_date', 'end_date', 'status'
      ];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(req.body[field]);
        }
      });

      // Handle applicable_to
      if (req.body.applicable_to !== undefined) {
        updateFields.push('applicable_to = ?');
        updateValues.push(JSON.stringify(req.body.applicable_to));
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
        `UPDATE coupons SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      res.json({
        success: true,
        message: 'Coupon updated successfully'
      });

    } catch (error) {
      console.error('Update coupon error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update coupon',
        error: error.message
      });
    }
  },

  // ลบคูปอง (เปลี่ยนสถานะเป็น deleted)
  deleteCoupon: async (req, res) => {
    try {
      const { id } = req.params;

      await db.execute(
        'UPDATE coupons SET status = "deleted", deleted_at = NOW() WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Coupon deleted successfully'
      });

    } catch (error) {
      console.error('Delete coupon error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete coupon',
        error: error.message
      });
    }
  },

  // ตรวจสอบและใช้คูปอง
  validateAndUseCoupon: async (req, res) => {
    try {
      const {
        code,
        userId,
        bookingId,
        amount
      } = req.body;

      // Get coupon details
      const [coupons] = await db.execute(
        'SELECT * FROM coupons WHERE code = ? AND status = "active"',
        [code]
      );

      if (coupons.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Invalid or inactive coupon code'
        });
      }

      const coupon = coupons[0];
      const currentDate = new Date();

      // Check validity period
      if (coupon.start_date && new Date(coupon.start_date) > currentDate) {
        return res.status(400).json({
          success: false,
          message: 'Coupon is not yet valid'
        });
      }

      if (coupon.end_date && new Date(coupon.end_date) < currentDate) {
        return res.status(400).json({
          success: false,
          message: 'Coupon has expired'
        });
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return res.status(400).json({
          success: false,
          message: 'Coupon usage limit reached'
        });
      }

      // Check user usage limit
      if (coupon.usage_limit_per_user) {
        const [userUsage] = await db.execute(
          'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
          [coupon.id, userId]
        );

        if (userUsage[0].count >= coupon.usage_limit_per_user) {
          return res.status(400).json({
            success: false,
            message: 'You have already used this coupon the maximum number of times'
          });
        }
      }

      // Check minimum amount
      if (coupon.minimum_amount && amount < coupon.minimum_amount) {
        return res.status(400).json({
          success: false,
          message: `Minimum purchase amount is ฿${coupon.minimum_amount}`
        });
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (amount * coupon.discount_value) / 100;
        if (coupon.maximum_discount && discountAmount > coupon.maximum_discount) {
          discountAmount = coupon.maximum_discount;
        }
      } else if (coupon.discount_type === 'fixed') {
        discountAmount = coupon.discount_value;
      }

      // Start transaction
      await db.beginTransaction();

      try {
        // Record usage
        await db.execute(`
          INSERT INTO coupon_usage (coupon_id, user_id, booking_id, discount_amount, used_at)
          VALUES (?, ?, ?, ?, NOW())
        `, [coupon.id, userId, bookingId, discountAmount]);

        // Update used count
        await db.execute(
          'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
          [coupon.id]
        );

        await db.commit();

        res.json({
          success: true,
          data: {
            discount_amount: discountAmount,
            final_amount: amount - discountAmount,
            coupon_name: coupon.name
          }
        });

      } catch (error) {
        await db.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Validate and use coupon error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply coupon',
        error: error.message
      });
    }
  },

  // ตรวจสอบคูปอง (ไม่ใช้)
  validateCoupon: async (req, res) => {
    try {
      const { code, amount } = req.body;
      const userId = req.user.id;

      // Get coupon details
      const [coupons] = await db.execute(
        'SELECT * FROM coupons WHERE code = ? AND status = "active"',
        [code]
      );

      if (coupons.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Invalid or inactive coupon code'
        });
      }

      const coupon = coupons[0];
      const currentDate = new Date();

      // Check validity period
      if (coupon.start_date && new Date(coupon.start_date) > currentDate) {
        return res.status(400).json({
          success: false,
          message: 'Coupon is not yet valid'
        });
      }

      if (coupon.end_date && new Date(coupon.end_date) < currentDate) {
        return res.status(400).json({
          success: false,
          message: 'Coupon has expired'
        });
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return res.status(400).json({
          success: false,
          message: 'Coupon usage limit reached'
        });
      }

      // Check user usage limit
      if (coupon.usage_limit_per_user) {
        const [userUsage] = await db.execute(
          'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
          [coupon.id, userId]
        );

        if (userUsage[0].count >= coupon.usage_limit_per_user) {
          return res.status(400).json({
            success: false,
            message: 'You have already used this coupon the maximum number of times'
          });
        }
      }

      // Check minimum amount
      if (coupon.minimum_amount && amount < coupon.minimum_amount) {
        return res.status(400).json({
          success: false,
          message: `Minimum purchase amount is ฿${coupon.minimum_amount}`
        });
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (amount * coupon.discount_value) / 100;
        if (coupon.maximum_discount && discountAmount > coupon.maximum_discount) {
          discountAmount = coupon.maximum_discount;
        }
      } else if (coupon.discount_type === 'fixed') {
        discountAmount = coupon.discount_value;
      }

      res.json({
        success: true,
        data: {
          valid: true,
          coupon_name: coupon.name,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          discount_amount: discountAmount,
          final_amount: amount - discountAmount
        }
      });

    } catch (error) {
      console.error('Validate coupon error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate coupon',
        error: error.message
      });
    }
  },

  // สร้างคูปองจำนวนมาก
  bulkCreateCoupons: async (req, res) => {
    try {
      const {
        baseConfig,
        quantity,
        codePrefix,
        codeLength = 8
      } = req.body;

      const createdBy = req.user.id;
      const createdCoupons = [];

      // Start transaction
      await db.beginTransaction();

      try {
        for (let i = 0; i < quantity; i++) {
          // Generate unique code
          let couponCode;
          let isUnique = false;
          
          while (!isUnique) {
            const randomCode = crypto.randomBytes(codeLength / 2).toString('hex').toUpperCase();
            couponCode = codePrefix ? `${codePrefix}${randomCode}` : randomCode;
            
            const [existing] = await db.execute(
              'SELECT id FROM coupons WHERE code = ?',
              [couponCode]
            );
            
            if (existing.length === 0) {
              isUnique = true;
            }
          }

          // Insert coupon
          const [result] = await db.execute(`
            INSERT INTO coupons (
              code, name, description, type, discount_type,
              discount_value, minimum_amount, maximum_discount,
              usage_limit, usage_limit_per_user, used_count,
              start_date, end_date, applicable_to,
              status, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, NOW(), NOW())
          `, [
            couponCode,
            `${baseConfig.name} #${i + 1}`,
            baseConfig.description,
            baseConfig.type,
            baseConfig.discount_type,
            baseConfig.discount_value,
            baseConfig.minimum_amount,
            baseConfig.maximum_discount,
            baseConfig.usage_limit,
            baseConfig.usage_limit_per_user,
            baseConfig.start_date,
            baseConfig.end_date,
            JSON.stringify(baseConfig.applicable_to || []),
            baseConfig.status || 'active',
            createdBy
          ]);

          createdCoupons.push({
            id: result.insertId,
            code: couponCode
          });
        }

        await db.commit();

        res.status(201).json({
          success: true,
          message: `${quantity} coupons created successfully`,
          data: {
            count: createdCoupons.length,
            coupons: createdCoupons
          }
        });

      } catch (error) {
        await db.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Bulk create coupons error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create coupons',
        error: error.message
      });
    }
  },

  // ดึงคูปองที่ผู้ใช้สามารถใช้ได้
  getAvailableCouponsForUser: async (req, res) => {
    try {
      const userId = req.user.id;
      const { amount = 0 } = req.query;
      const currentDate = new Date().toISOString();

      const [coupons] = await db.execute(`
        SELECT c.*,
               COUNT(cu.id) as user_usage_count
        FROM coupons c
        LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id AND cu.user_id = ?
        WHERE c.status = 'active'
          AND c.start_date <= ?
          AND (c.end_date IS NULL OR c.end_date >= ?)
          AND (c.usage_limit IS NULL OR c.used_count < c.usage_limit)
          AND (c.minimum_amount IS NULL OR c.minimum_amount <= ?)
        GROUP BY c.id
        HAVING (c.usage_limit_per_user IS NULL OR user_usage_count < c.usage_limit_per_user)
        ORDER BY c.discount_value DESC
      `, [userId, currentDate, currentDate, amount]);

      // Process applicable_to
      coupons.forEach(coupon => {
        if (coupon.applicable_to) {
          try {
            coupon.applicable_to = JSON.parse(coupon.applicable_to);
          } catch (e) {
            coupon.applicable_to = [];
          }
        }

        // Calculate potential discount
        if (amount > 0) {
          if (coupon.discount_type === 'percentage') {
            coupon.potential_discount = (amount * coupon.discount_value) / 100;
            if (coupon.maximum_discount && coupon.potential_discount > coupon.maximum_discount) {
              coupon.potential_discount = coupon.maximum_discount;
            }
          } else if (coupon.discount_type === 'fixed') {
            coupon.potential_discount = coupon.discount_value;
          }
        }
      });

      res.json({
        success: true,
        data: coupons
      });

    } catch (error) {
      console.error('Get available coupons error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available coupons',
        error: error.message
      });
    }
  },

  // สถิติการใช้งานคูปอง
  getCouponStatistics: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      let dateFilter = '';
      const queryParams = [];

      if (startDate && endDate) {
        dateFilter = ' AND cu.used_at BETWEEN ? AND ?';
        queryParams.push(startDate, endDate);
      }

      // Total coupons by status
      const [couponsByStatus] = await db.execute(`
        SELECT status, COUNT(*) as count
        FROM coupons
        GROUP BY status
      `);

      // Total usage
      const [totalUsage] = await db.execute(`
        SELECT COUNT(*) as total_usage,
               SUM(discount_amount) as total_discount,
               COUNT(DISTINCT user_id) as unique_users
        FROM coupon_usage cu
        WHERE 1=1 ${dateFilter}
      `, queryParams);

      // Top performing coupons
      const [topCoupons] = await db.execute(`
        SELECT c.id, c.code, c.name,
               COUNT(cu.id) as usage_count,
               SUM(cu.discount_amount) as total_discount
        FROM coupons c
        LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
        WHERE 1=1 ${dateFilter}
        GROUP BY c.id
        ORDER BY usage_count DESC
        LIMIT 10
      `, queryParams);

      // Usage by type
      const [usageByType] = await db.execute(`
        SELECT c.type,
               COUNT(cu.id) as usage_count,
               SUM(cu.discount_amount) as total_discount
        FROM coupons c
        LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
        WHERE cu.id IS NOT NULL ${dateFilter}
        GROUP BY c.type
      `, queryParams);

      // Monthly usage trend
      const [monthlyTrend] = await db.execute(`
        SELECT DATE_FORMAT(cu.used_at, '%Y-%m') as month,
               COUNT(*) as usage_count,
               SUM(cu.discount_amount) as total_discount
        FROM coupon_usage cu
        WHERE 1=1 ${dateFilter}
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `, queryParams);

      res.json({
        success: true,
        data: {
          summary: {
            byStatus: couponsByStatus,
            totalUsage: totalUsage[0]
          },
          topPerforming: topCoupons,
          byType: usageByType,
          monthlyTrend: monthlyTrend
        }
      });

    } catch (error) {
      console.error('Get coupon statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch coupon statistics',
        error: error.message
      });
    }
  },

  // Export coupon codes
  exportCouponCodes: async (req, res) => {
    try {
      const { couponIds } = req.body;

      let query = 'SELECT code, name, discount_type, discount_value, status FROM coupons';
      const queryParams = [];

      if (couponIds && couponIds.length > 0) {
        const placeholders = couponIds.map(() => '?').join(',');
        query += ` WHERE id IN (${placeholders})`;
        queryParams.push(...couponIds);
      }

      const [coupons] = await db.execute(query, queryParams);

      // Format as CSV
      const csv = [
        'Code,Name,Discount Type,Discount Value,Status',
        ...coupons.map(c => 
          `${c.code},"${c.name}",${c.discount_type},${c.discount_value},${c.status}`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=coupons.csv');
      res.send(csv);

    } catch (error) {
      console.error('Export coupon codes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export coupon codes',
        error: error.message
      });
    }
  }
};

module.exports = couponController;
