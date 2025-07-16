// partnerController.js
const db = require('../config/database');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// กำหนดการอัพโหลดโลโก้
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/partners/');
  },
  filename: (req, file, cb) => {
    cb(null, `partner-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const partnerController = {
  // ดึงรายการพาร์ทเนอร์ทั้งหมด
  getAllPartners: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        type = 'all',
        status = 'all',
        featured = 'all',
        search = '',
        sortBy = 'display_order',
        order = 'ASC'
      } = req.query;

      const offset = (page - 1) * limit;

      let query = `
        SELECT p.*,
               COUNT(DISTINCT pp.id) as product_count,
               COUNT(DISTINCT po.id) as offer_count
        FROM partners p
        LEFT JOIN partner_products pp ON p.id = pp.partner_id
        LEFT JOIN partner_offers po ON p.id = po.partner_id
        WHERE 1=1
      `;

      const queryParams = [];

      // Type filter
      if (type !== 'all') {
        query += ` AND p.type = ?`;
        queryParams.push(type);
      }

      // Status filter
      if (status !== 'all') {
        query += ` AND p.status = ?`;
        queryParams.push(status);
      }

      // Featured filter
      if (featured !== 'all') {
        query += ` AND p.is_featured = ?`;
        queryParams.push(featured === 'true' ? 1 : 0);
      }

      // Search filter
      if (search) {
        query += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.business_type LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Group by
      query += ` GROUP BY p.id`;

      // Sorting
      const allowedSortFields = ['name', 'created_at', 'display_order', 'type'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'display_order';
      query += ` ORDER BY p.${sortField} ${order === 'DESC' ? 'DESC' : 'ASC'}`;

      // Pagination
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(parseInt(limit), parseInt(offset));

      // Execute main query
      const [partners] = await db.execute(query, queryParams);

      // Get total count
      let countQuery = `SELECT COUNT(DISTINCT p.id) as total FROM partners p WHERE 1=1`;
      const countParams = [];

      if (type !== 'all') {
        countQuery += ` AND p.type = ?`;
        countParams.push(type);
      }

      if (status !== 'all') {
        countQuery += ` AND p.status = ?`;
        countParams.push(status);
      }

      if (featured !== 'all') {
        countQuery += ` AND p.is_featured = ?`;
        countParams.push(featured === 'true' ? 1 : 0);
      }

      if (search) {
        countQuery += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.business_type LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const [countResult] = await db.execute(countQuery, countParams);
      const totalPartners = countResult[0].total;

      // Process JSON fields
      partners.forEach(partner => {
        if (partner.contact_info) {
          try {
            partner.contact_info = JSON.parse(partner.contact_info);
          } catch (e) {
            partner.contact_info = {};
          }
        }
        if (partner.social_media) {
          try {
            partner.social_media = JSON.parse(partner.social_media);
          } catch (e) {
            partner.social_media = {};
          }
        }
      });

      res.json({
        success: true,
        data: {
          partners,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalPartners / limit),
            totalItems: totalPartners,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get all partners error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch partners',
        error: error.message
      });
    }
  },

  // ดึงข้อมูลพาร์ทเนอร์ตาม ID
  getPartnerById: async (req, res) => {
    try {
      const { id } = req.params;

      // Get partner details
      const [partners] = await db.execute(`
        SELECT p.*,
               COUNT(DISTINCT pp.id) as product_count,
               COUNT(DISTINCT po.id) as offer_count
        FROM partners p
        LEFT JOIN partner_products pp ON p.id = pp.partner_id
        LEFT JOIN partner_offers po ON p.id = po.partner_id
        WHERE p.id = ?
        GROUP BY p.id
      `, [id]);

      if (partners.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Partner not found'
        });
      }

      const partner = partners[0];

      // Parse JSON fields
      if (partner.contact_info) {
        try {
          partner.contact_info = JSON.parse(partner.contact_info);
        } catch (e) {
          partner.contact_info = {};
        }
      }

      if (partner.social_media) {
        try {
          partner.social_media = JSON.parse(partner.social_media);
        } catch (e) {
          partner.social_media = {};
        }
      }

      // Get products
      const [products] = await db.execute(`
        SELECT * FROM partner_products
        WHERE partner_id = ? AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 10
      `, [id]);

      // Get active offers
      const [offers] = await db.execute(`
        SELECT * FROM partner_offers
        WHERE partner_id = ? 
          AND status = 'active'
          AND (end_date IS NULL OR end_date > NOW())
        ORDER BY created_at DESC
      `, [id]);

      res.json({
        success: true,
        data: {
          ...partner,
          products,
          offers
        }
      });

    } catch (error) {
      console.error('Get partner by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch partner details',
        error: error.message
      });
    }
  },

  // สร้างพาร์ทเนอร์ใหม่
  createPartner: async (req, res) => {
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
        business_type,
        description,
        website,
        email,
        phone,
        address,
        contact_person,
        contact_position,
        social_media,
        commission_rate,
        contract_start_date,
        contract_end_date,
        is_featured = 0,
        status = 'pending'
      } = req.body;

      // Start transaction
      await db.beginTransaction();

      try {
        // Get max display order
        const [maxOrder] = await db.execute(
          'SELECT MAX(display_order) as max_order FROM partners'
        );
        const displayOrder = (maxOrder[0].max_order || 0) + 1;

        // Insert partner
        const [result] = await db.execute(`
          INSERT INTO partners (
            name, type, business_type, description, website,
            logo_url, contact_info, social_media,
            commission_rate, contract_start_date, contract_end_date,
            is_featured, display_order, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          name, type, business_type, description, website,
          req.file ? `/uploads/partners/${req.file.filename}` : null,
          JSON.stringify({
            email,
            phone,
            address,
            contact_person,
            contact_position
          }),
          JSON.stringify(social_media || {}),
          commission_rate,
          contract_start_date,
          contract_end_date,
          is_featured,
          displayOrder,
          status
        ]);

        const partnerId = result.insertId;

        // Create initial partnership agreement record
        await db.execute(`
          INSERT INTO partnership_agreements (
            partner_id, agreement_type, start_date, end_date,
            commission_rate, status, created_at
          ) VALUES (?, 'standard', ?, ?, ?, 'active', NOW())
        `, [partnerId, contract_start_date, contract_end_date, commission_rate]);

        await db.commit();

        res.status(201).json({
          success: true,
          message: 'Partner created successfully',
          data: { id: partnerId }
        });

      } catch (error) {
        await db.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Create partner error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create partner',
        error: error.message
      });
    }
  },

  // อัพเดทข้อมูลพาร์ทเนอร์
  updatePartner: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if partner exists
      const [partners] = await db.execute('SELECT * FROM partners WHERE id = ?', [id]);

      if (partners.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Partner not found'
        });
      }

      const updateFields = [];
      const updateValues = [];

      // Dynamic update fields
      const allowedFields = [
        'name', 'type', 'business_type', 'description', 'website',
        'commission_rate', 'contract_start_date', 'contract_end_date',
        'is_featured', 'display_order', 'status'
      ];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(req.body[field]);
        }
      });

      // Handle logo upload
      if (req.file) {
        updateFields.push('logo_url = ?');
        updateValues.push(`/uploads/partners/${req.file.filename}`);
      }

      // Handle JSON fields
      if (req.body.email || req.body.phone || req.body.address || 
          req.body.contact_person || req.body.contact_position) {
        const currentContact = JSON.parse(partners[0].contact_info || '{}');
        const contactInfo = {
          email: req.body.email || currentContact.email,
          phone: req.body.phone || currentContact.phone,
          address: req.body.address || currentContact.address,
          contact_person: req.body.contact_person || currentContact.contact_person,
          contact_position: req.body.contact_position || currentContact.contact_position
        };
        updateFields.push('contact_info = ?');
        updateValues.push(JSON.stringify(contactInfo));
      }

      if (req.body.social_media) {
        updateFields.push('social_media = ?');
        updateValues.push(JSON.stringify(req.body.social_media));
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
        `UPDATE partners SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      res.json({
        success: true,
        message: 'Partner updated successfully'
      });

    } catch (error) {
      console.error('Update partner error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update partner',
        error: error.message
      });
    }
  },

  // ลบพาร์ทเนอร์
  deletePartner: async (req, res) => {
    try {
      const { id } = req.params;

      // Soft delete
      await db.execute(
        'UPDATE partners SET status = "deleted", deleted_at = NOW() WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Partner deleted successfully'
      });

    } catch (error) {
      console.error('Delete partner error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete partner',
        error: error.message
      });
    }
  },

  // เพิ่มผลิตภัณฑ์ของพาร์ทเนอร์
  addPartnerProduct: async (req, res) => {
    try {
      const { partnerId } = req.params;
      const {
        name,
        description,
        category,
        price,
        discount_price,
        discount_for_members,
        sku,
        stock_quantity,
        status = 'active'
      } = req.body;

      // Check if partner exists
      const [partners] = await db.execute('SELECT * FROM partners WHERE id = ?', [partnerId]);

      if (partners.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Partner not found'
        });
      }

      // Insert product
      const [result] = await db.execute(`
        INSERT INTO partner_products (
          partner_id, name, description, category,
          price, discount_price, discount_for_members,
          sku, stock_quantity, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        partnerId, name, description, category,
        price, discount_price, discount_for_members,
        sku, stock_quantity, status
      ]);

      res.status(201).json({
        success: true,
        message: 'Product added successfully',
        data: { id: result.insertId }
      });

    } catch (error) {
      console.error('Add partner product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add product',
        error: error.message
      });
    }
  },

  // สร้างข้อเสนอพิเศษ
  createPartnerOffer: async (req, res) => {
    try {
      const { partnerId } = req.params;
      const {
        title,
        description,
        offer_type,
        discount_amount,
        discount_percentage,
        minimum_purchase,
        maximum_discount,
        start_date,
        end_date,
        terms_conditions,
        status = 'active'
      } = req.body;

      // Check if partner exists
      const [partners] = await db.execute('SELECT * FROM partners WHERE id = ?', [partnerId]);

      if (partners.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Partner not found'
        });
      }

      // Generate offer code
      const offerCode = `${partners[0].name.substring(0, 3).toUpperCase()}${Date.now().toString().slice(-6)}`;

      // Insert offer
      await db.execute(`
        INSERT INTO partner_offers (
          partner_id, offer_code, title, description, offer_type,
          discount_amount, discount_percentage, minimum_purchase,
          maximum_discount, start_date, end_date, terms_conditions,
          status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        partnerId, offerCode, title, description, offer_type,
        discount_amount, discount_percentage, minimum_purchase,
        maximum_discount, start_date, end_date, 
        JSON.stringify(terms_conditions || []),
        status
      ]);

      res.status(201).json({
        success: true,
        message: 'Offer created successfully',
        data: { offer_code: offerCode }
      });

    } catch (error) {
      console.error('Create partner offer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create offer',
        error: error.message
      });
    }
  },

  // ดึงรายการพาร์ทเนอร์ที่ featured
  getFeaturedPartners: async (req, res) => {
    try {
      const { limit = 6 } = req.query;

      const [partners] = await db.execute(`
        SELECT p.*,
               COUNT(DISTINCT po.id) as active_offers
        FROM partners p
        LEFT JOIN partner_offers po ON p.id = po.partner_id 
          AND po.status = 'active' 
          AND (po.end_date IS NULL OR po.end_date > NOW())
        WHERE p.is_featured = 1 
          AND p.status = 'active'
        GROUP BY p.id
        ORDER BY p.display_order ASC
        LIMIT ?
      `, [parseInt(limit)]);

      // Process JSON fields
      partners.forEach(partner => {
        if (partner.contact_info) {
          try {
            partner.contact_info = JSON.parse(partner.contact_info);
          } catch (e) {
            partner.contact_info = {};
          }
        }
      });

      res.json({
        success: true,
        data: partners
      });

    } catch (error) {
      console.error('Get featured partners error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch featured partners',
        error: error.message
      });
    }
  },

  // อัพเดทลำดับการแสดงผล
  updateDisplayOrder: async (req, res) => {
    try {
      const { partners } = req.body;

      if (!Array.isArray(partners)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid data format'
        });
      }

      // Start transaction
      await db.beginTransaction();

      try {
        // Update display order for each partner
        const updatePromises = partners.map((partner, index) => {
          return db.execute(
            'UPDATE partners SET display_order = ? WHERE id = ?',
            [index + 1, partner.id]
          );
        });

        await Promise.all(updatePromises);
        await db.commit();

        res.json({
          success: true,
          message: 'Display order updated successfully'
        });

      } catch (error) {
        await db.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Update display order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update display order',
        error: error.message
      });
    }
  },

  // Upload partner logo
  uploadPartnerLogo: [
    upload.single('logo'),
    async (req, res) => {
      try {
        const { partnerId } = req.params;

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No logo uploaded'
          });
        }

        // Update partner logo
        await db.execute(
          'UPDATE partners SET logo_url = ?, updated_at = NOW() WHERE id = ?',
          [`/uploads/partners/${req.file.filename}`, partnerId]
        );

        res.json({
          success: true,
          message: 'Logo uploaded successfully',
          data: {
            logo_url: `/uploads/partners/${req.file.filename}`
          }
        });

      } catch (error) {
        console.error('Upload partner logo error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to upload logo',
          error: error.message
        });
      }
    }
  ]
};

module.exports = partnerController;
