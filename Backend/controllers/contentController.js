// controllers/contentController.js
const Article = require('../models/Article');
const Event = require('../models/Event');
const Partner = require('../models/Partner');
const Gym = require('../models/Gym');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const { generateSlug } = require('../utils/slug');

class ContentController {
  // ==================== ARTICLES ====================
  
  // Create article
  async createArticle(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์สร้างบทความ'
        });
      }

      const {
        title,
        content,
        excerpt,
        category,
        tags,
        status = 'draft',
        publishDate,
        metaTitle,
        metaDescription
      } = req.body;

      // Generate slug
      const slug = await generateSlug(title, Article);

      const article = await Article.create({
        title,
        slug,
        content,
        excerpt,
        category,
        tags,
        status,
        publishDate: publishDate || (status === 'published' ? new Date() : null),
        author: req.user.userId,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt,
        viewCount: 0
      });

      await article.populate('author', 'firstName lastName profilePicture');

      res.status(201).json({
        success: true,
        message: 'สร้างบทความสำเร็จ',
        data: article
      });

    } catch (error) {
      console.error('Create article error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างบทความ'
      });
    }
  }

  // Upload article cover image
  async uploadArticleCover(req, res) {
    try {
      const { articleId } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเลือกรูปภาพ'
        });
      }

      const article = await Article.findById(articleId);
      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบบทความ'
        });
      }

      // Delete old image if exists
      if (article.coverImage && article.coverImage.publicId) {
        await deleteFromCloudinary(article.coverImage.publicId);
      }

      // Upload new image
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'articles',
        transformation: [
          { width: 1200, height: 630, crop: 'fill' }
        ]
      });

      article.coverImage = {
        url: result.secure_url,
        publicId: result.public_id
      };
      await article.save();

      res.json({
        success: true,
        message: 'อัพโหลดรูปภาพสำเร็จ',
        data: article.coverImage
      });

    } catch (error) {
      console.error('Upload article cover error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ'
      });
    }
  }

  // Get articles
  async getArticles(req, res) {
    try {
      const {
        category,
        tag,
        status = 'published',
        search,
        sortBy = 'publishDate',
        order = 'desc',
        page = 1,
        limit = 12
      } = req.query;

      let query = {};

      // Only show published articles to non-admin users
      if (req.user?.role !== 'admin') {
        query.status = 'published';
        query.publishDate = { $lte: new Date() };
      } else if (status) {
        query.status = status;
      }

      if (category) {
        query.category = category;
      }

      if (tag) {
        query.tags = tag;
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { excerpt: { $regex: search, $options: 'i' } }
        ];
      }

      const articles = await Article.find(query)
        .populate('author', 'firstName lastName profilePicture')
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalCount = await Article.countDocuments(query);

      res.json({
        success: true,
        data: {
          articles,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Get articles error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบทความ'
      });
    }
  }

  // Get article by slug
  async getArticleBySlug(req, res) {
    try {
      const { slug } = req.params;

      const article = await Article.findOne({ slug })
        .populate('author', 'firstName lastName profilePicture bio');

      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบบทความ'
        });
      }

      // Check if article is published or user is admin
      if (article.status !== 'published' && req.user?.role !== 'admin') {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบบทความ'
        });
      }

      // Increment view count
      article.viewCount += 1;
      await article.save();

      // Get related articles
      const relatedArticles = await Article.find({
        _id: { $ne: article._id },
        status: 'published',
        $or: [
          { category: article.category },
          { tags: { $in: article.tags } }
        ]
      })
        .select('title slug excerpt coverImage publishDate')
        .limit(4)
        .sort({ publishDate: -1 });

      res.json({
        success: true,
        data: {
          article,
          relatedArticles
        }
      });

    } catch (error) {
      console.error('Get article by slug error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบทความ'
      });
    }
  }

  // Update article
  async updateArticle(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์แก้ไขบทความ'
        });
      }

      const { id } = req.params;
      const updates = req.body;

      // If title changed, regenerate slug
      if (updates.title) {
        updates.slug = await generateSlug(updates.title, Article, id);
      }

      const article = await Article.findByIdAndUpdate(
        id,
        {
          ...updates,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).populate('author', 'firstName lastName profilePicture');

      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบบทความ'
        });
      }

      res.json({
        success: true,
        message: 'อัพเดทบทความสำเร็จ',
        data: article
      });

    } catch (error) {
      console.error('Update article error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทบทความ'
      });
    }
  }

  // Delete article
  async deleteArticle(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์ลบบทความ'
        });
      }

      const { id } = req.params;

      const article = await Article.findById(id);
      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบบทความ'
        });
      }

      // Delete cover image if exists
      if (article.coverImage && article.coverImage.publicId) {
        await deleteFromCloudinary(article.coverImage.publicId);
      }

      await article.remove();

      res.json({
        success: true,
        message: 'ลบบทความสำเร็จ'
      });

    } catch (error) {
      console.error('Delete article error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบบทความ'
      });
    }
  }

  // ==================== EVENTS ====================

  // Create event
  async createEvent(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์สร้างอีเว้นท์'
        });
      }

      const {
        title,
        description,
        type,
        startDate,
        endDate,
        location,
        venue,
        capacity,
        price,
        registrationDeadline,
        organizer,
        speakers,
        agenda,
        tags,
        status = 'upcoming'
      } = req.body;

      const slug = await generateSlug(title, Event);

      const event = await Event.create({
        title,
        slug,
        description,
        type,
        startDate,
        endDate,
        location,
        venue,
        capacity,
        price,
        registrationDeadline,
        organizer,
        speakers,
        agenda,
        tags,
        status,
        createdBy: req.user.userId
      });

      res.status(201).json({
        success: true,
        message: 'สร้างอีเว้นท์สำเร็จ',
        data: event
      });

    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างอีเว้นท์'
      });
    }
  }

  // Get events
  async getEvents(req, res) {
    try {
      const {
        type,
        status,
        upcoming,
        search,
        sortBy = 'startDate',
        order = 'asc',
        page = 1,
        limit = 12
      } = req.query;

      let query = {};

      if (type) {
        query.type = type;
      }

      if (status) {
        query.status = status;
      }

      if (upcoming === 'true') {
        query.startDate = { $gte: new Date() };
        query.status = { $ne: 'cancelled' };
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'location.address': { $regex: search, $options: 'i' } }
        ];
      }

      const events = await Event.find(query)
        .populate('registrations.userId', 'firstName lastName profilePicture')
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalCount = await Event.countDocuments(query);

      res.json({
        success: true,
        data: {
          events,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลอีเว้นท์'
      });
    }
  }

  // Register for event
  async registerForEvent(req, res) {
    try {
      const userId = req.user.userId;
      const { eventId } = req.params;
      const { attendeeInfo } = req.body;

      const event = await Event.findById(eventId);
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบอีเว้นท์'
        });
      }

      // Check if event is full
      if (event.capacity && event.registrations.length >= event.capacity) {
        return res.status(400).json({
          success: false,
          message: 'อีเว้นท์เต็มแล้ว'
        });
      }

      // Check registration deadline
      if (event.registrationDeadline && new Date() > event.registrationDeadline) {
        return res.status(400).json({
          success: false,
          message: 'หมดเวลาลงทะเบียนแล้ว'
        });
      }

      // Check if already registered
      const alreadyRegistered = event.registrations.some(
        reg => reg.userId.toString() === userId
      );

      if (alreadyRegistered) {
        return res.status(400).json({
          success: false,
          message: 'คุณได้ลงทะเบียนอีเว้นท์นี้แล้ว'
        });
      }

      // Add registration
      event.registrations.push({
        userId,
        registeredAt: new Date(),
        attendeeInfo,
        status: event.price > 0 ? 'pending_payment' : 'confirmed'
      });

      await event.save();

      res.json({
        success: true,
        message: 'ลงทะเบียนอีเว้นท์สำเร็จ',
        data: {
          eventId: event._id,
          registrationId: event.registrations[event.registrations.length - 1]._id
        }
      });

    } catch (error) {
      console.error('Register for event error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลงทะเบียน'
      });
    }
  }

  // ==================== PARTNERS ====================

  // Get partners
  async getPartners(req, res) {
    try {
      const { type, isActive = true } = req.query;

      let query = {};
      
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      if (type) {
        query.type = type;
      }

      const partners = await Partner.find(query)
        .sort({ order: 1, createdAt: -1 });

      res.json({
        success: true,
        data: partners
      });

    } catch (error) {
      console.error('Get partners error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลพาร์ทเนอร์'
      });
    }
  }

  // Create partner (admin only)
  async createPartner(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์เพิ่มพาร์ทเนอร์'
        });
      }

      const partner = await Partner.create(req.body);

      res.status(201).json({
        success: true,
        message: 'เพิ่มพาร์ทเนอร์สำเร็จ',
        data: partner
      });

    } catch (error) {
      console.error('Create partner error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเพิ่มพาร์ทเนอร์'
      });
    }
  }

  // ==================== GYMS ====================

  // Search gyms
  async searchGyms(req, res) {
    try {
      const {
        search,
        lat,
        lng,
        radius = 5, // km
        amenities,
        type,
        page = 1,
        limit = 20
      } = req.query;

      let query = { isActive: true };

      // Text search
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'address.street': { $regex: search, $options: 'i' } },
          { 'address.district': { $regex: search, $options: 'i' } }
        ];
      }

      // Location-based search
      if (lat && lng) {
        query.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: radius * 1000 // Convert km to meters
          }
        };
      }

      // Filter by amenities
      if (amenities) {
        const amenityList = Array.isArray(amenities) ? amenities : [amenities];
        query.amenities = { $all: amenityList };
      }

      // Filter by type
      if (type) {
        query.type = type;
      }

      const gyms = await Gym.find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalCount = await Gym.countDocuments(query);

      res.json({
        success: true,
        data: {
          gyms,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Search gyms error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการค้นหายิม'
      });
    }
  }

  // Get gym details
  async getGymById(req, res) {
    try {
      const { id } = req.params;

      const gym = await Gym.findById(id)
        .populate('trainers', 'userId rating specializations');

      if (!gym) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบข้อมูลยิม'
        });
      }

      // Populate trainer user info
      await Trainer.populate(gym.trainers, {
        path: 'userId',
        select: 'firstName lastName profilePicture'
      });

      res.json({
        success: true,
        data: gym
      });

    } catch (error) {
      console.error('Get gym by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลยิม'
      });
    }
  }

  // ==================== CATEGORIES & TAGS ====================

  // Get article categories
  async getArticleCategories(req, res) {
    try {
      const categories = await Article.distinct('category');
      
      // Get count for each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const count = await Article.countDocuments({ 
            category, 
            status: 'published' 
          });
          return { name: category, count };
        })
      );

      res.json({
        success: true,
        data: categoriesWithCount.sort((a, b) => b.count - a.count)
      });

    } catch (error) {
      console.error('Get article categories error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่'
      });
    }
  }

  // Get popular tags
  async getPopularTags(req, res) {
    try {
      const tags = await Article.aggregate([
        { $match: { status: 'published' } },
        { $unwind: '$tags' },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]);

      res.json({
        success: true,
        data: tags.map(tag => ({
          name: tag._id,
          count: tag.count
        }))
      });

    } catch (error) {
      console.error('Get popular tags error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแท็ก'
      });
    }
  }
}

module.exports = new ContentController();
