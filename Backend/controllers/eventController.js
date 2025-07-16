// eventController.js
const db = require('../config/database');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');

// กำหนดการอัพโหลดรูปภาพ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/events/');
  },
  filename: (req, file, cb) => {
    cb(null, `event-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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

const eventController = {
  // ดึงรายการอีเว้นท์ทั้งหมด
  getAllEvents: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status = 'all',
        category = 'all',
        search = '',
        sortBy = 'event_date',
        order = 'ASC' 
      } = req.query;

      const offset = (page - 1) * limit;

      let query = `
        SELECT e.*, 
               COUNT(DISTINCT ep.participant_id) as participant_count,
               u.first_name as organizer_name,
               u.profile_picture as organizer_avatar
        FROM events e
        LEFT JOIN event_participants ep ON e.id = ep.event_id
        LEFT JOIN users u ON e.organizer_id = u.id
        WHERE 1=1
      `;

      const queryParams = [];

      // Filter by status
      if (status !== 'all') {
        query += ` AND e.status = ?`;
        queryParams.push(status);
      }

      // Filter by category
      if (category !== 'all') {
        query += ` AND e.category = ?`;
        queryParams.push(category);
      }

      // Search
      if (search) {
        query += ` AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Group by
      query += ` GROUP BY e.id`;

      // Sorting
      const allowedSortFields = ['event_date', 'created_at', 'title', 'participant_count'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'event_date';
      query += ` ORDER BY ${sortField} ${order === 'DESC' ? 'DESC' : 'ASC'}`;

      // Pagination
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(parseInt(limit), parseInt(offset));

      // Execute main query
      const [events] = await db.execute(query, queryParams);

      // Get total count
      let countQuery = `SELECT COUNT(DISTINCT e.id) as total FROM events e WHERE 1=1`;
      const countParams = [];

      if (status !== 'all') {
        countQuery += ` AND e.status = ?`;
        countParams.push(status);
      }

      if (category !== 'all') {
        countQuery += ` AND e.category = ?`;
        countParams.push(category);
      }

      if (search) {
        countQuery += ` AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const [countResult] = await db.execute(countQuery, countParams);
      const totalEvents = countResult[0].total;

      res.json({
        success: true,
        data: {
          events,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalEvents / limit),
            totalItems: totalEvents,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get all events error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch events',
        error: error.message
      });
    }
  },

  // ดึงข้อมูลอีเว้นท์ตาม ID
  getEventById: async (req, res) => {
    try {
      const { id } = req.params;

      // Get event details
      const [events] = await db.execute(`
        SELECT e.*,
               u.first_name as organizer_name,
               u.last_name as organizer_lastname,
               u.profile_picture as organizer_avatar,
               COUNT(DISTINCT ep.participant_id) as participant_count
        FROM events e
        LEFT JOIN users u ON e.organizer_id = u.id
        LEFT JOIN event_participants ep ON e.id = ep.event_id
        WHERE e.id = ?
        GROUP BY e.id
      `, [id]);

      if (events.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Get participants list (limited)
      const [participants] = await db.execute(`
        SELECT u.id, u.first_name, u.last_name, u.profile_picture,
               ep.registered_at, ep.status
        FROM event_participants ep
        JOIN users u ON ep.participant_id = u.id
        WHERE ep.event_id = ?
        ORDER BY ep.registered_at DESC
        LIMIT 10
      `, [id]);

      // Get event images
      const [images] = await db.execute(`
        SELECT * FROM event_images
        WHERE event_id = ?
        ORDER BY display_order
      `, [id]);

      res.json({
        success: true,
        data: {
          ...events[0],
          participants,
          images
        }
      });

    } catch (error) {
      console.error('Get event by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch event',
        error: error.message
      });
    }
  },

  // สร้างอีเว้นท์ใหม่
  createEvent: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        title,
        description,
        category,
        event_date,
        event_time,
        end_date,
        end_time,
        location,
        venue_name,
        address,
        city,
        province,
        postal_code,
        max_participants,
        registration_deadline,
        price,
        requirements,
        agenda,
        tags,
        status = 'draft'
      } = req.body;

      const organizer_id = req.user.id;

      // Start transaction
      await db.beginTransaction();

      try {
        // Insert event
        const [result] = await db.execute(`
          INSERT INTO events (
            organizer_id, title, description, category,
            event_date, event_time, end_date, end_time,
            location, venue_name, address, city, province, postal_code,
            max_participants, registration_deadline,
            price, requirements, agenda, tags, status,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          organizer_id, title, description, category,
          event_date, event_time, end_date, end_time,
          location, venue_name, address, city, province, postal_code,
          max_participants, registration_deadline,
          price, requirements, agenda, JSON.stringify(tags), status
        ]);

        const eventId = result.insertId;

        // Handle image upload
        if (req.file) {
          await db.execute(`
            INSERT INTO event_images (event_id, image_url, is_primary, display_order)
            VALUES (?, ?, 1, 1)
          `, [eventId, `/uploads/events/${req.file.filename}`]);
        }

        await db.commit();

        res.status(201).json({
          success: true,
          message: 'Event created successfully',
          data: { id: eventId }
        });

      } catch (error) {
        await db.rollback();
        throw error;
      }

    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create event',
        error: error.message
      });
    }
  },

  // อัพเดทอีเว้นท์
  updateEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check ownership or admin
      const [events] = await db.execute(
        'SELECT * FROM events WHERE id = ? AND (organizer_id = ? OR ? IN (SELECT id FROM users WHERE role = "admin"))',
        [id, userId, userId]
      );

      if (events.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found or unauthorized'
        });
      }

      const updateFields = [];
      const updateValues = [];

      // Dynamic update fields
      const allowedFields = [
        'title', 'description', 'category', 'event_date', 'event_time',
        'end_date', 'end_time', 'location', 'venue_name', 'address',
        'city', 'province', 'postal_code', 'max_participants',
        'registration_deadline', 'price', 'requirements', 'agenda',
        'tags', 'status'
      ];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          updateValues.push(
            field === 'tags' ? JSON.stringify(req.body[field]) : req.body[field]
          );
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      updateFields.push('updated_at = NOW()');
      updateValues.push(id);

      await db.execute(
        `UPDATE events SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      res.json({
        success: true,
        message: 'Event updated successfully'
      });

    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update event',
        error: error.message
      });
    }
  },

  // ลบอีเว้นท์
  deleteEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check ownership or admin
      const [events] = await db.execute(
        'SELECT * FROM events WHERE id = ? AND (organizer_id = ? OR ? IN (SELECT id FROM users WHERE role = "admin"))',
        [id, userId, userId]
      );

      if (events.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found or unauthorized'
        });
      }

      // Soft delete
      await db.execute(
        'UPDATE events SET status = "deleted", deleted_at = NOW() WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Event deleted successfully'
      });

    } catch (error) {
      console.error('Delete event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete event',
        error: error.message
      });
    }
  },

  // ลงทะเบียนเข้าร่วมอีเว้นท์
  registerForEvent: async (req, res) => {
    try {
      const { eventId } = req.params;
      const participantId = req.user.id;
      const { notes } = req.body;

      // Check if event exists and is active
      const [events] = await db.execute(
        'SELECT * FROM events WHERE id = ? AND status = "active" AND event_date > NOW()',
        [eventId]
      );

      if (events.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found or registration closed'
        });
      }

      const event = events[0];

      // Check max participants
      const [participantCount] = await db.execute(
        'SELECT COUNT(*) as count FROM event_participants WHERE event_id = ? AND status = "confirmed"',
        [eventId]
      );

      if (event.max_participants && participantCount[0].count >= event.max_participants) {
        return res.status(400).json({
          success: false,
          message: 'Event is full'
        });
      }

      // Check if already registered
      const [existing] = await db.execute(
        'SELECT * FROM event_participants WHERE event_id = ? AND participant_id = ?',
        [eventId, participantId]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Already registered for this event'
        });
      }

      // Register participant
      await db.execute(`
        INSERT INTO event_participants (event_id, participant_id, status, notes, registered_at)
        VALUES (?, ?, 'confirmed', ?, NOW())
      `, [eventId, participantId, notes]);

      // Send notification
      await db.execute(`
        INSERT INTO notifications (user_id, type, title, message, data, created_at)
        VALUES (?, 'event_registration', 'ลงทะเบียนสำเร็จ', ?, ?, NOW())
      `, [
        participantId,
        `คุณได้ลงทะเบียนเข้าร่วม "${event.title}" เรียบร้อยแล้ว`,
        JSON.stringify({ event_id: eventId })
      ]);

      res.json({
        success: true,
        message: 'Successfully registered for event'
      });

    } catch (error) {
      console.error('Register for event error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register for event',
        error: error.message
      });
    }
  },

  // ยกเลิกการลงทะเบียน
  cancelRegistration: async (req, res) => {
    try {
      const { eventId } = req.params;
      const participantId = req.user.id;

      const [result] = await db.execute(
        'UPDATE event_participants SET status = "cancelled", cancelled_at = NOW() WHERE event_id = ? AND participant_id = ?',
        [eventId, participantId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found'
        });
      }

      res.json({
        success: true,
        message: 'Registration cancelled successfully'
      });

    } catch (error) {
      console.error('Cancel registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel registration',
        error: error.message
      });
    }
  },

  // ดึงรายการอีเว้นท์ที่กำลังจะมาถึง
  getUpcomingEvents: async (req, res) => {
    try {
      const { limit = 5 } = req.query;

      const [events] = await db.execute(`
        SELECT e.*, 
               COUNT(DISTINCT ep.participant_id) as participant_count,
               u.first_name as organizer_name
        FROM events e
        LEFT JOIN event_participants ep ON e.id = ep.event_id
        LEFT JOIN users u ON e.organizer_id = u.id
        WHERE e.status = 'active' 
          AND e.event_date > NOW()
        GROUP BY e.id
        ORDER BY e.event_date ASC
        LIMIT ?
      `, [parseInt(limit)]);

      res.json({
        success: true,
        data: events
      });

    } catch (error) {
      console.error('Get upcoming events error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch upcoming events',
        error: error.message
      });
    }
  },

  // Upload event images
  uploadEventImages: [
    upload.array('images', 10),
    async (req, res) => {
      try {
        const { eventId } = req.params;
        const userId = req.user.id;

        // Check ownership
        const [events] = await db.execute(
          'SELECT * FROM events WHERE id = ? AND organizer_id = ?',
          [eventId, userId]
        );

        if (events.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Event not found or unauthorized'
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
          'SELECT MAX(display_order) as max_order FROM event_images WHERE event_id = ?',
          [eventId]
        );

        let currentOrder = (maxOrder[0].max_order || 0) + 1;

        // Insert images
        const imagePromises = req.files.map((file, index) => {
          return db.execute(`
            INSERT INTO event_images (event_id, image_url, display_order, uploaded_at)
            VALUES (?, ?, ?, NOW())
          `, [eventId, `/uploads/events/${file.filename}`, currentOrder + index]);
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
        console.error('Upload event images error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to upload images',
          error: error.message
        });
      }
    }
  ]
};

module.exports = eventController;
