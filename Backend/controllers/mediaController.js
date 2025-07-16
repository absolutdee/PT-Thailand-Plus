// mediaController.js
const db = require('../config/database');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

// กำหนดการอัพโหลดไฟล์
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const type = req.body.type || 'general';
    const uploadPath = `uploads/media/${type}`;
    
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `media-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});

const mediaController = {
  // ดึงรายการมีเดียทั้งหมด
  getAllMedia: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        type = 'all',
        category = 'all',
        uploaded_by = 'all',
        search = '',
        sortBy = 'created_at',
        order = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;

      let query = `
        SELECT m.*,
               u.first_name as uploader_name,
               u.last_name as uploader_lastname,
               COUNT(DISTINCT mu.id) as usage_count
        FROM media m
        LEFT JOIN users u ON m.uploaded_by = u.id
        LEFT JOIN media_usage mu ON m.id = mu.media_id
        WHERE m.deleted_at IS NULL
      `;

      const queryParams = [];

      // Type filter
      if (type !== 'all') {
        query += ` AND m.type = ?`;
        queryParams.push(type);
      }

      // Category filter
      if (category !== 'all') {
        query += ` AND m.category = ?`;
        queryParams.push(category);
      }

      // Uploaded by filter
      if (uploaded_by !== 'all') {
        query += ` AND m.uploaded_by = ?`;
        queryParams.push(uploaded_by);
      }

      // Search filter
      if (search) {
        query += ` AND (m.filename LIKE ? OR m.title LIKE ? OR m.description LIKE ? OR m.tags LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }

      // Group by
      query += ` GROUP BY m.id`;

      // Sorting
      const allowedSortFields = ['created_at', 'filename', 'file_size', 'usage_count'];
      const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
      
      if (sortField === 'usage_count') {
        query += ` ORDER BY usage_count ${order === 'ASC' ? 'ASC' : 'DESC'}`;
      } else {
        query += ` ORDER BY m.${sortField} ${order === 'ASC' ? 'ASC' : 'DESC'}`;
      }

      // Pagination
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(parseInt(limit), parseInt(offset));

      // Execute main query
      const [media] = await db.execute(query, queryParams);

      // Get total count
      let countQuery = `SELECT COUNT(DISTINCT m.id) as total FROM media m WHERE m.deleted_at IS NULL`;
      const countParams = [];

      if (type !== 'all') {
        countQuery += ` AND m.type = ?`;
        countParams.push(type);
      }

      if (category !== 'all') {
        countQuery += ` AND m.category = ?`;
        countParams.push(category);
      }

      if (uploaded_by !== 'all') {
        countQuery += ` AND m.uploaded_by = ?`;
        countParams.push(uploaded_by);
      }

      if (search) {
        countQuery += ` AND (m.filename LIKE ? OR m.title LIKE ? OR m.description LIKE ? OR m.tags LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }

      const [countResult] = await db.execute(countQuery, countParams);
      const totalMedia = countResult[0].total;

      // Process metadata
      media.forEach(item => {
        if (item.metadata) {
          try {
            item.metadata = JSON.parse(item.metadata);
          } catch (e) {
            item.metadata = {};
          }
        }
        if (item.tags) {
          try {
            item.tags = JSON.parse(item.tags);
          } catch (e) {
            item.tags = [];
          }
        }
      });

      res.json({
        success: true,
        data: {
          media,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalMedia / limit),
            totalItems: totalMedia,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get all media error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch media',
        error: error.message
      });
    }
  },

  // ดึงข้อมูลมีเดียตาม ID
  getMediaById: async (req, res) => {
    try {
      const { id } = req.params;

      const [media] = await db.execute(`
        SELECT m.*,
               u.first_name as uploader_name,
               u.last_name as uploader_lastname
        FROM media m
        LEFT JOIN users u ON m.uploaded_by = u.id
        WHERE m.id = ? AND m.deleted_at IS NULL
      `, [id]);

      if (media.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Media not found'
        });
      }

      const mediaItem = media[0];

      // Parse JSON fields
      if (mediaItem.metadata) {
        try {
          mediaItem.metadata = JSON.parse(mediaItem.metadata);
        } catch (e) {
          mediaItem.metadata = {};
        }
      }

      if (mediaItem.tags) {
        try {
          mediaItem.tags = JSON.parse(mediaItem.tags);
        } catch (e) {
          mediaItem.tags = [];
        }
      }

      // Get usage history
      const [usage] = await db.execute(`
        SELECT mu.*, u.first_name, u.last_name
        FROM media_usage mu
        JOIN users u ON mu.used_by = u.id
        WHERE mu.media_id = ?
        ORDER BY mu.used_at DESC
        LIMIT 10
      `, [id]);

      res.json({
        success: true,
        data: {
          ...mediaItem,
          usage_history: usage
        }
      });

    } catch (error) {
      console.error('Get media by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch media details',
        error: error.message
      });
    }
  },

  // อัพโหลดมีเดีย
  uploadMedia: [
    upload.array('files', 10),
    async (req, res) => {
      try {
        const userId = req.user.id;
        const { category, tags, description } = req.body;

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No files uploaded'
          });
        }

        const uploadedMedia = [];

        // Process each uploaded file
        for (const file of req.files) {
          const fileType = file.mimetype.split('/')[0];
          let metadata = {
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype
          };

          // Process images for thumbnails and metadata
          if (fileType === 'image') {
            try {
              const imagePath = file.path;
              const thumbnailPath = file.path.replace(
                path.extname(file.filename),
                '_thumb' + path.extname(file.filename)
              );

              // Create thumbnail
              const imageMetadata = await sharp(imagePath)
                .resize(300, 300, { fit: 'cover' })
                .toFile(thumbnailPath);

              // Get original image metadata
              const originalMetadata = await sharp(imagePath).metadata();

              metadata = {
                ...metadata,
                width: originalMetadata.width,
                height: originalMetadata.height,
                format: originalMetadata.format,
                thumbnailPath: thumbnailPath.replace('uploads/', '/')
              };

            } catch (imageError) {
              console.error('Image processing error:', imageError);
            }
          }

          // Insert media record
          const [result] = await db.execute(`
            INSERT INTO media (
              filename, original_name, file_path, file_size,
              mime_type, type, category, title, description,
              tags, metadata, uploaded_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
          `, [
            file.filename,
            file.originalname,
            '/' + file.path.replace(/\\/g, '/'),
            file.size,
            file.mimetype,
            fileType,
            category || 'general',
            path.parse(file.originalname).name,
            description || null,
            JSON.stringify(tags ? tags.split(',').map(t => t.trim()) : []),
            JSON.stringify(metadata),
            userId
          ]);

          uploadedMedia.push({
            id: result.insertId,
            filename: file.filename,
            url: '/' + file.path.replace(/\\/g, '/')
          });
        }

        res.json({
          success: true,
          message: 'Files uploaded successfully',
          data: uploadedMedia
        });

      } catch (error) {
        console.error('Upload media error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to upload media',
          error: error.message
        });
      }
    }
  ],

  // อัพเดทข้อมูลมีเดีย
  updateMedia: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        category,
        tags,
        alt_text
      } = req.body;

      // Check if media exists
      const [media] = await db.execute(
        'SELECT * FROM media WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (media.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Media not found'
        });
      }

      const updateFields = [];
      const updateValues = [];

      if (title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(title);
      }

      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }

      if (category !== undefined) {
        updateFields.push('category = ?');
        updateValues.push(category);
      }

      if (tags !== undefined) {
        updateFields.push('tags = ?');
        const tagsArray = tags ? tags.split(',').map(t => t.trim()) : [];
        updateValues.push(JSON.stringify(tagsArray));
      }

      if (alt_text !== undefined) {
        updateFields.push('alt_text = ?');
        updateValues.push(alt_text);
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
        `UPDATE media SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      res.json({
        success: true,
        message: 'Media updated successfully'
      });

    } catch (error) {
      console.error('Update media error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update media',
        error: error.message
      });
    }
  },

  // ลบมีเดีย (Soft delete)
  deleteMedia: async (req, res) => {
    try {
      const { id } = req.params;

      await db.execute(
        'UPDATE media SET deleted_at = NOW() WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Media deleted successfully'
      });

    } catch (error) {
      console.error('Delete media error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete media',
        error: error.message
      });
    }
  },

  // ลบมีเดียหลายรายการ
  bulkDeleteMedia: async (req, res) => {
    try {
      const { mediaIds } = req.body;

      if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No media IDs provided'
        });
      }

      const placeholders = mediaIds.map(() => '?').join(',');
      await db.execute(
        `UPDATE media SET deleted_at = NOW() WHERE id IN (${placeholders})`,
        mediaIds
      );

      res.json({
        success: true,
        message: `${mediaIds.length} media items deleted successfully`
      });

    } catch (error) {
      console.error('Bulk delete media error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete media',
        error: error.message
      });
    }
  },

  // ดึงรายการ Media Library สำหรับ selector
  getMediaLibrary: async (req, res) => {
    try {
      const {
        type = 'image',
        search = '',
        page = 1,
        limit = 20
      } = req.query;

      const offset = (page - 1) * limit;

      let query = `
        SELECT id, filename, title, file_path, mime_type, 
               file_size, metadata, created_at
        FROM media
        WHERE deleted_at IS NULL
      `;

      const queryParams = [];

      // Filter by type
      if (type !== 'all') {
        query += ` AND type = ?`;
        queryParams.push(type);
      }

      // Search
      if (search) {
        query += ` AND (filename LIKE ? OR title LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      queryParams.push(parseInt(limit), parseInt(offset));

      const [media] = await db.execute(query, queryParams);

      // Process metadata for thumbnails
      media.forEach(item => {
        if (item.metadata) {
          try {
            item.metadata = JSON.parse(item.metadata);
            if (item.metadata.thumbnailPath) {
              item.thumbnail = item.metadata.thumbnailPath;
            }
          } catch (e) {
            item.metadata = {};
          }
        }
      });

      res.json({
        success: true,
        data: media
      });

    } catch (error) {
      console.error('Get media library error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch media library',
        error: error.message
      });
    }
  },

  // บันทึกการใช้งานมีเดีย
  recordMediaUsage: async (req, res) => {
    try {
      const { mediaId } = req.params;
      const { usedIn, usedFor, referenceId } = req.body;
      const userId = req.user.id;

      // Check if media exists
      const [media] = await db.execute(
        'SELECT * FROM media WHERE id = ? AND deleted_at IS NULL',
        [mediaId]
      );

      if (media.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Media not found'
        });
      }

      // Record usage
      await db.execute(`
        INSERT INTO media_usage (media_id, used_by, used_in, used_for, reference_id, used_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [mediaId, userId, usedIn, usedFor, referenceId]);

      res.json({
        success: true,
        message: 'Media usage recorded'
      });

    } catch (error) {
      console.error('Record media usage error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record media usage',
        error: error.message
      });
    }
  },

  // ดึงสถิติการใช้งานมีเดีย
  getMediaStatistics: async (req, res) => {
    try {
      // Total media by type
      const [mediaByType] = await db.execute(`
        SELECT type, COUNT(*) as count, SUM(file_size) as total_size
        FROM media
        WHERE deleted_at IS NULL
        GROUP BY type
      `);

      // Total storage used
      const [totalStorage] = await db.execute(`
        SELECT SUM(file_size) as total_size
        FROM media
        WHERE deleted_at IS NULL
      `);

      // Media uploaded this month
      const [monthlyUploads] = await db.execute(`
        SELECT COUNT(*) as count
        FROM media
        WHERE deleted_at IS NULL
          AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
      `);

      // Most used media
      const [mostUsed] = await db.execute(`
        SELECT m.id, m.filename, m.title, COUNT(mu.id) as usage_count
        FROM media m
        LEFT JOIN media_usage mu ON m.id = mu.media_id
        WHERE m.deleted_at IS NULL
        GROUP BY m.id
        ORDER BY usage_count DESC
        LIMIT 10
      `);

      // Media by category
      const [mediaByCategory] = await db.execute(`
        SELECT category, COUNT(*) as count
        FROM media
        WHERE deleted_at IS NULL
        GROUP BY category
      `);

      res.json({
        success: true,
        data: {
          totalStorage: totalStorage[0].total_size || 0,
          monthlyUploads: monthlyUploads[0].count,
          byType: mediaByType,
          byCategory: mediaByCategory,
          mostUsed: mostUsed
        }
      });

    } catch (error) {
      console.error('Get media statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch media statistics',
        error: error.message
      });
    }
  },

  // ล้างไฟล์ที่ไม่ใช้งาน
  cleanupUnusedMedia: async (req, res) => {
    try {
      const { daysOld = 90 } = req.body;

      // Find unused media older than specified days
      const [unusedMedia] = await db.execute(`
        SELECT m.*
        FROM media m
        LEFT JOIN media_usage mu ON m.id = mu.media_id
        WHERE m.deleted_at IS NULL
          AND mu.id IS NULL
          AND m.created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      `, [daysOld]);

      if (unusedMedia.length === 0) {
        return res.json({
          success: true,
          message: 'No unused media found',
          data: { count: 0 }
        });
      }

      // Soft delete unused media
      const mediaIds = unusedMedia.map(m => m.id);
      const placeholders = mediaIds.map(() => '?').join(',');
      
      await db.execute(
        `UPDATE media SET deleted_at = NOW() WHERE id IN (${placeholders})`,
        mediaIds
      );

      res.json({
        success: true,
        message: `${unusedMedia.length} unused media items cleaned up`,
        data: {
          count: unusedMedia.length,
          totalSize: unusedMedia.reduce((sum, m) => sum + m.file_size, 0)
        }
      });

    } catch (error) {
      console.error('Cleanup unused media error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup unused media',
        error: error.message
      });
    }
  }
};

module.exports = mediaController;
