// controllers/reviewController.js
const Review = require('../models/Review');
const Trainer = require('../models/Trainer');
const Booking = require('../models/Booking');
const { sendNotification } = require('../utils/notification');

class ReviewController {
  // Create review
  async createReview(req, res) {
    try {
      const clientId = req.user.clientId;
      const {
        trainerId,
        bookingId,
        rating,
        comment,
        tags
      } = req.body;

      // Verify booking exists and belongs to client
      const booking = await Booking.findOne({
        _id: bookingId,
        clientId,
        trainerId,
        status: 'completed'
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการจองหรือยังไม่เสร็จสิ้น'
        });
      }

      // Check if already reviewed
      const existingReview = await Review.findOne({
        clientId,
        trainerId,
        bookingId
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'คุณได้รีวิวการจองนี้แล้ว'
        });
      }

      // Create review
      const review = await Review.create({
        clientId,
        trainerId,
        bookingId,
        rating,
        comment,
        tags,
        isVerified: true // Since it's linked to a completed booking
      });

      // Update trainer rating
      await this.updateTrainerRating(trainerId);

      // Populate review data
      await review.populate([
        {
          path: 'clientId',
          populate: {
            path: 'userId',
            select: 'firstName lastName profilePicture'
          }
        },
        {
          path: 'trainerId',
          populate: {
            path: 'userId',
            select: 'firstName lastName'
          }
        }
      ]);

      // Send notification to trainer
      await sendNotification({
        userId: booking.trainerId.userId,
        title: 'รีวิวใหม่',
        message: `คุณได้รับรีวิว ${rating} ดาวจากลูกค้า`,
        type: 'new_review',
        relatedId: review._id
      });

      res.status(201).json({
        success: true,
        message: 'สร้างรีวิวสำเร็จ',
        data: review
      });

    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างรีวิว'
      });
    }
  }

  // Update trainer rating
  async updateTrainerRating(trainerId) {
    try {
      const reviews = await Review.find({ 
        trainerId, 
        isActive: true 
      });

      const totalReviews = reviews.length;
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalReviews > 0 ? (totalRating / totalReviews) : 0;

      await Trainer.findByIdAndUpdate(trainerId, {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews
      });

    } catch (error) {
      console.error('Update trainer rating error:', error);
    }
  }

  // Get trainer reviews
  async getTrainerReviews(req, res) {
    try {
      const { trainerId } = req.params;
      const { 
        rating,
        tags,
        sortBy = 'createdAt',
        order = 'desc',
        page = 1, 
        limit = 10 
      } = req.query;

      // Build query
      let query = { trainerId, isActive: true };
      
      if (rating) {
        query.rating = parseInt(rating);
      }

      if (tags) {
        query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
      }

      // Get reviews
      const reviews = await Review.find(query)
        .populate({
          path: 'clientId',
          populate: {
            path: 'userId',
            select: 'firstName lastName profilePicture'
          }
        })
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalCount = await Review.countDocuments(query);

      // Get rating distribution
      const ratingDistribution = await Review.aggregate([
        { $match: { trainerId: trainerId, isActive: true } },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } }
      ]);

      // Get tag statistics
      const tagStats = await Review.aggregate([
        { $match: { trainerId: trainerId, isActive: true } },
        { $unwind: '$tags' },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      res.json({
        success: true,
        data: {
          reviews,
          statistics: {
            ratingDistribution,
            tagStats
          },
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Get trainer reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว'
      });
    }
  }

  // Get review by ID
  async getReviewById(req, res) {
    try {
      const { id } = req.params;

      const review = await Review.findById(id)
        .populate([
          {
            path: 'clientId',
            populate: {
              path: 'userId',
              select: 'firstName lastName profilePicture'
            }
          },
          {
            path: 'trainerId',
            populate: {
              path: 'userId',
              select: 'firstName lastName profilePicture'
            }
          },
          {
            path: 'bookingId',
            select: 'packageId sessionDate'
          }
        ]);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบรีวิว'
        });
      }

      res.json({
        success: true,
        data: review
      });

    } catch (error) {
      console.error('Get review by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว'
      });
    }
  }

  // Update review
  async updateReview(req, res) {
    try {
      const clientId = req.user.clientId;
      const { id } = req.params;
      const { rating, comment, tags } = req.body;

      const review = await Review.findOne({
        _id: id,
        clientId,
        isActive: true
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบรีวิวหรือคุณไม่มีสิทธิ์แก้ไข'
        });
      }

      // Check if review is not too old (e.g., 30 days)
      const reviewAge = (new Date() - review.createdAt) / (1000 * 60 * 60 * 24);
      if (reviewAge > 30) {
        return res.status(400).json({
          success: false,
          message: 'ไม่สามารถแก้ไขรีวิวที่เขียนมานานกว่า 30 วัน'
        });
      }

      // Update review
      review.rating = rating;
      review.comment = comment;
      review.tags = tags;
      review.isEdited = true;
      review.editedAt = new Date();
      await review.save();

      // Update trainer rating
      await this.updateTrainerRating(review.trainerId);

      res.json({
        success: true,
        message: 'แก้ไขรีวิวสำเร็จ',
        data: review
      });

    } catch (error) {
      console.error('Update review error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการแก้ไขรีวิว'
      });
    }
  }

  // Delete review
  async deleteReview(req, res) {
    try {
      const clientId = req.user.clientId;
      const { id } = req.params;

      const review = await Review.findOne({
        _id: id,
        clientId
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบรีวิวหรือคุณไม่มีสิทธิ์ลบ'
        });
      }

      // Soft delete
      review.isActive = false;
      review.deletedAt = new Date();
      await review.save();

      // Update trainer rating
      await this.updateTrainerRating(review.trainerId);

      res.json({
        success: true,
        message: 'ลบรีวิวสำเร็จ'
      });

    } catch (error) {
      console.error('Delete review error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบรีวิว'
      });
    }
  }

  // Report review
  async reportReview(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { reason, details } = req.body;

      const review = await Review.findById(id);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบรีวิว'
        });
      }

      // Add report
      review.reports.push({
        reportedBy: userId,
        reason,
        details,
        reportedAt: new Date()
      });

      // If multiple reports, flag for admin review
      if (review.reports.length >= 3) {
        review.isFlagged = true;
      }

      await review.save();

      // Notify admin
      await sendNotification({
        userId: 'admin', // This would be actual admin ID
        title: 'รีวิวถูกรายงาน',
        message: `รีวิวถูกรายงานด้วยเหตุผล: ${reason}`,
        type: 'review_report',
        relatedId: review._id
      });

      res.json({
        success: true,
        message: 'รายงานรีวิวสำเร็จ'
      });

    } catch (error) {
      console.error('Report review error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการรายงานรีวิว'
      });
    }
  }

  // Get client reviews
  async getClientReviews(req, res) {
    try {
      const clientId = req.user.clientId;
      const { page = 1, limit = 10 } = req.query;

      const reviews = await Review.find({
        clientId,
        isActive: true
      })
        .populate({
          path: 'trainerId',
          populate: {
            path: 'userId',
            select: 'firstName lastName profilePicture'
          }
        })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalCount = await Review.countDocuments({
        clientId,
        isActive: true
      });

      res.json({
        success: true,
        data: {
          reviews,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Get client reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรีวิว'
      });
    }
  }

  // Get review summary for trainer
  async getTrainerReviewSummary(req, res) {
    try {
      const { trainerId } = req.params;

      const [
        ratingStats,
        recentReviews,
        topTags
      ] = await Promise.all([
        // Rating statistics
        Review.aggregate([
          { $match: { trainerId: trainerId, isActive: true } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 },
              fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
              fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
              threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
              twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
              oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
            }
          }
        ]),

        // Recent reviews
        Review.find({ trainerId, isActive: true })
          .populate({
            path: 'clientId',
            populate: {
              path: 'userId',
              select: 'firstName lastName profilePicture'
            }
          })
          .sort({ createdAt: -1 })
          .limit(3),

        // Top tags
        Review.aggregate([
          { $match: { trainerId: trainerId, isActive: true } },
          { $unwind: '$tags' },
          {
            $group: {
              _id: '$tags',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ])
      ]);

      res.json({
        success: true,
        data: {
          statistics: ratingStats[0] || {
            averageRating: 0,
            totalReviews: 0,
            fiveStars: 0,
            fourStars: 0,
            threeStars: 0,
            twoStars: 0,
            oneStar: 0
          },
          recentReviews,
          topTags
        }
      });

    } catch (error) {
      console.error('Get trainer review summary error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปรีวิว'
      });
    }
  }
}

module.exports = new ReviewController();
