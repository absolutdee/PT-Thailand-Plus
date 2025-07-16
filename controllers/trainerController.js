// controllers/trainerController.js
const Trainer = require('../models/Trainer');
const User = require('../models/User');
const Package = require('../models/Package');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

class TrainerController {
  // Get all trainers with filters
  async getAllTrainers(req, res) {
    try {
      const {
        search,
        specialization,
        minPrice,
        maxPrice,
        rating,
        experience,
        location,
        sortBy = 'rating',
        page = 1,
        limit = 12
      } = req.query;

      // Build query
      let query = {};
      
      // Search by name
      if (search) {
        const users = await User.find({
          role: 'trainer',
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');
        
        query.userId = { $in: users.map(u => u._id) };
      }

      // Filter by specialization
      if (specialization) {
        query.specializations = specialization;
      }

      // Filter by experience
      if (experience) {
        query.experience = { $gte: parseInt(experience) };
      }

      // Filter by rating
      if (rating) {
        query.rating = { $gte: parseFloat(rating) };
      }

      // Execute query with pagination
      const trainers = await Trainer.find(query)
        .populate({
          path: 'userId',
          select: 'firstName lastName profilePicture email phone address'
        })
        .populate({
          path: 'packages',
          match: {
            isActive: true,
            ...(minPrice && { price: { $gte: parseFloat(minPrice) } }),
            ...(maxPrice && { price: { $lte: parseFloat(maxPrice) } })
          }
        })
        .sort(sortBy === 'price' ? { 'packages.0.price': 1 } : { [sortBy]: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Get total count
      const totalCount = await Trainer.countDocuments(query);

      res.json({
        success: true,
        data: {
          trainers,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Get all trainers error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเทรนเนอร์'
      });
    }
  }

  // Get trainer by ID
  async getTrainerById(req, res) {
    try {
      const { id } = req.params;

      const trainer = await Trainer.findById(id)
        .populate('userId', 'firstName lastName profilePicture email phone address')
        .populate({
          path: 'packages',
          match: { isActive: true }
        })
        .populate({
          path: 'reviews',
          populate: {
            path: 'clientId',
            select: 'firstName lastName profilePicture'
          },
          options: { 
            sort: { createdAt: -1 },
            limit: 10 
          }
        });

      if (!trainer) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบเทรนเนอร์'
        });
      }

      res.json({
        success: true,
        data: trainer
      });

    } catch (error) {
      console.error('Get trainer by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเทรนเนอร์'
      });
    }
  }

  // Update trainer profile
  async updateTrainerProfile(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const {
        bio,
        specializations,
        certifications,
        experience,
        workingHours,
        services,
        languages
      } = req.body;

      const trainer = await Trainer.findByIdAndUpdate(
        trainerId,
        {
          bio,
          specializations,
          certifications,
          experience,
          workingHours,
          services,
          languages,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'อัพเดทข้อมูลเทรนเนอร์สำเร็จ',
        data: trainer
      });

    } catch (error) {
      console.error('Update trainer profile error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล'
      });
    }
  }

  // Upload trainer gallery images
  async uploadGalleryImages(req, res) {
    try {
      const trainerId = req.user.trainerId;
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเลือกรูปภาพ'
        });
      }

      const trainer = await Trainer.findById(trainerId);
      
      // Check gallery limit (max 12 images)
      if (trainer.gallery.length + req.files.length > 12) {
        return res.status(400).json({
          success: false,
          message: 'จำนวนรูปภาพเกินขีดจำกัด (สูงสุด 12 รูป)'
        });
      }

      // Upload images
      const uploadPromises = req.files.map(file => 
        uploadToCloudinary(file.buffer, {
          folder: 'trainer-gallery',
          transformation: [
            { width: 800, height: 600, crop: 'fill' }
          ]
        })
      );

      const results = await Promise.all(uploadPromises);

      // Add to gallery
      const newImages = results.map(result => ({
        url: result.secure_url,
        publicId: result.public_id,
        caption: '',
        uploadedAt: new Date()
      }));

      trainer.gallery.push(...newImages);
      await trainer.save();

      res.json({
        success: true,
        message: 'อัพโหลดรูปภาพสำเร็จ',
        data: trainer.gallery
      });

    } catch (error) {
      console.error('Upload gallery images error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ'
      });
    }
  }

  // Delete gallery image
  async deleteGalleryImage(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { imageId } = req.params;

      const trainer = await Trainer.findById(trainerId);
      const image = trainer.gallery.id(imageId);

      if (!image) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบรูปภาพ'
        });
      }

      // Delete from cloudinary
      await deleteFromCloudinary(image.publicId);

      // Remove from gallery
      trainer.gallery.pull(imageId);
      await trainer.save();

      res.json({
        success: true,
        message: 'ลบรูปภาพสำเร็จ'
      });

    } catch (error) {
      console.error('Delete gallery image error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบรูปภาพ'
      });
    }
  }

  // Get trainer stats
  async getTrainerStats(req, res) {
    try {
      const trainerId = req.user.trainerId;

      // Get current month dates
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      // Get stats
      const [
        totalClients,
        activeClients,
        completedSessions,
        upcomingSessions,
        monthlyRevenue,
        reviews
      ] = await Promise.all([
        // Total unique clients
        Booking.distinct('clientId', { trainerId, status: { $ne: 'cancelled' } }),
        
        // Active clients (have upcoming sessions)
        Booking.distinct('clientId', {
          trainerId,
          status: 'confirmed',
          sessionDate: { $gte: new Date() }
        }),
        
        // Completed sessions this month
        Booking.countDocuments({
          trainerId,
          status: 'completed',
          sessionDate: { $gte: startOfMonth, $lte: endOfMonth }
        }),
        
        // Upcoming sessions
        Booking.countDocuments({
          trainerId,
          status: 'confirmed',
          sessionDate: { $gte: new Date() }
        }),
        
        // Monthly revenue
        Booking.aggregate([
          {
            $match: {
              trainerId,
              status: 'completed',
              sessionDate: { $gte: startOfMonth, $lte: endOfMonth }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]),
        
        // Recent reviews
        Review.find({ trainerId })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('clientId', 'firstName lastName profilePicture')
      ]);

      const trainer = await Trainer.findById(trainerId);

      res.json({
        success: true,
        data: {
          overview: {
            totalClients: totalClients.length,
            activeClients: activeClients.length,
            rating: trainer.rating,
            totalReviews: trainer.totalReviews
          },
          sessions: {
            completedThisMonth: completedSessions,
            upcoming: upcomingSessions
          },
          revenue: {
            thisMonth: monthlyRevenue[0]?.total || 0
          },
          recentReviews: reviews
        }
      });

    } catch (error) {
      console.error('Get trainer stats error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ'
      });
    }
  }

  // Get trainer schedule
  async getTrainerSchedule(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { startDate, endDate } = req.query;

      const query = {
        trainerId,
        sessionDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };

      const bookings = await Booking.find(query)
        .populate('clientId', 'firstName lastName profilePicture')
        .populate('packageId', 'name')
        .sort({ sessionDate: 1 });

      res.json({
        success: true,
        data: bookings
      });

    } catch (error) {
      console.error('Get trainer schedule error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลตาราง'
      });
    }
  }

  // Update working hours
  async updateWorkingHours(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { workingHours } = req.body;

      const trainer = await Trainer.findByIdAndUpdate(
        trainerId,
        { workingHours },
        { new: true }
      );

      res.json({
        success: true,
        message: 'อัพเดทเวลาทำงานสำเร็จ',
        data: trainer.workingHours
      });

    } catch (error) {
      console.error('Update working hours error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทเวลาทำงาน'
      });
    }
  }

  // Get trainer clients
  async getTrainerClients(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { status = 'all', page = 1, limit = 10 } = req.query;

      // Get unique client IDs
      let bookingQuery = { trainerId };
      
      if (status === 'active') {
        bookingQuery.sessionDate = { $gte: new Date() };
        bookingQuery.status = 'confirmed';
      }

      const clientIds = await Booking.distinct('clientId', bookingQuery);

      // Get client details with their booking info
      const clients = await User.find({
        _id: { $in: clientIds },
        role: 'client'
      })
        .select('firstName lastName profilePicture email phone')
        .lean();

      // Add booking statistics for each client
      const clientsWithStats = await Promise.all(
        clients.map(async (client) => {
          const [totalSessions, completedSessions, nextSession] = await Promise.all([
            Booking.countDocuments({ 
              trainerId, 
              clientId: client._id 
            }),
            Booking.countDocuments({ 
              trainerId, 
              clientId: client._id,
              status: 'completed'
            }),
            Booking.findOne({
              trainerId,
              clientId: client._id,
              status: 'confirmed',
              sessionDate: { $gte: new Date() }
            })
            .sort({ sessionDate: 1 })
            .select('sessionDate')
          ]);

          return {
            ...client,
            stats: {
              totalSessions,
              completedSessions,
              nextSession: nextSession?.sessionDate
            }
          };
        })
      );

      res.json({
        success: true,
        data: {
          clients: clientsWithStats,
          total: clientsWithStats.length
        }
      });

    } catch (error) {
      console.error('Get trainer clients error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า'
      });
    }
  }
}

module.exports = new TrainerController();
