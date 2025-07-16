// controllers/adminController.js
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Client = require('../models/Client');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Article = require('../models/Article');
const Event = require('../models/Event');
const Partner = require('../models/Partner');
const { sendEmail } = require('../utils/email');
const { sendNotification } = require('../utils/notification');

class AdminController {
  // Dashboard statistics
  async getDashboardStats(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const [
        totalUsers,
        totalTrainers,
        totalClients,
        newUsersToday,
        newUsersThisMonth,
        activeBookings,
        completedBookingsThisMonth,
        revenueThisMonth,
        platformFeesThisMonth,
        pendingPayouts,
        topTrainers,
        recentActivities
      ] = await Promise.all([
        // Total users
        User.countDocuments({ role: { $ne: 'admin' } }),
        
        // Total trainers
        User.countDocuments({ role: 'trainer' }),
        
        // Total clients
        User.countDocuments({ role: 'client' }),
        
        // New users today
        User.countDocuments({ 
          createdAt: { $gte: today },
          role: { $ne: 'admin' }
        }),
        
        // New users this month
        User.countDocuments({ 
          createdAt: { $gte: thisMonth },
          role: { $ne: 'admin' }
        }),
        
        // Active bookings
        Booking.countDocuments({
          status: 'confirmed',
          sessionDate: { $gte: new Date() }
        }),
        
        // Completed bookings this month
        Booking.countDocuments({
          status: 'completed',
          completedAt: { $gte: thisMonth }
        }),
        
        // Revenue this month
        Payment.aggregate([
          {
            $match: {
              status: 'completed',
              completedAt: { $gte: thisMonth }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]),
        
        // Platform fees this month
        Payment.aggregate([
          {
            $match: {
              status: 'completed',
              completedAt: { $gte: thisMonth }
            }
          },
          {
            $group: {
              _id: null,
              fees: { $sum: { $multiply: ['$amount', 0.2] } }
            }
          }
        ]),
        
        // Pending payouts
        Trainer.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: '$pendingBalance' }
            }
          }
        ]),
        
        // Top trainers by revenue
        Payment.aggregate([
          {
            $match: {
              status: 'completed',
              completedAt: { $gte: thisMonth }
            }
          },
          {
            $group: {
              _id: '$trainerId',
              revenue: { $sum: '$amount' },
              bookings: { $sum: 1 }
            }
          },
          {
            $sort: { revenue: -1 }
          },
          {
            $limit: 5
          },
          {
            $lookup: {
              from: 'trainers',
              localField: '_id',
              foreignField: '_id',
              as: 'trainer'
            }
          },
          {
            $unwind: '$trainer'
          },
          {
            $lookup: {
              from: 'users',
              localField: 'trainer.userId',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: '$user'
          }
        ]),
        
        // Recent activities
        this.getRecentActivities()
      ]);

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            trainers: totalTrainers,
            clients: totalClients,
            newToday: newUsersToday,
            newThisMonth: newUsersThisMonth
          },
          bookings: {
            active: activeBookings,
            completedThisMonth: completedBookingsThisMonth
          },
          revenue: {
            thisMonth: revenueThisMonth[0]?.total || 0,
            platformFees: platformFeesThisMonth[0]?.fees || 0,
            pendingPayouts: pendingPayouts[0]?.total || 0
          },
          topTrainers,
          recentActivities
        }
      });

    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ'
      });
    }
  }

  // Get recent activities
  async getRecentActivities() {
    const activities = [];
    
    // Recent registrations
    const recentUsers = await User.find({ role: { $ne: 'admin' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName role createdAt');
    
    recentUsers.forEach(user => {
      activities.push({
        type: 'user_registration',
        message: `${user.firstName} ${user.lastName} ลงทะเบียนเป็น${user.role === 'trainer' ? 'เทรนเนอร์' : 'ลูกค้า'}`,
        timestamp: user.createdAt
      });
    });

    // Recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('clientId trainerId', 'firstName lastName');
    
    recentBookings.forEach(booking => {
      activities.push({
        type: 'new_booking',
        message: `มีการจองใหม่`,
        timestamp: booking.createdAt
      });
    });

    // Sort by timestamp
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    return activities.slice(0, 10);
  }

  // User management
  async getUsers(req, res) {
    try {
      const {
        role,
        status,
        search,
        sortBy = 'createdAt',
        order = 'desc',
        page = 1,
        limit = 20
      } = req.query;

      let query = { role: { $ne: 'admin' } };

      if (role) {
        query.role = role;
      }

      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }

      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.find(query)
        .select('-password')
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalCount = await User.countDocuments(query);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
      });
    }
  }

  // Update user status
  async updateUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { isActive, reason } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          isActive,
          statusUpdatedAt: new Date(),
          statusReason: reason
        },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบผู้ใช้'
        });
      }

      // Send notification
      await sendNotification({
        userId: user._id,
        title: isActive ? 'บัญชีถูกเปิดใช้งาน' : 'บัญชีถูกระงับ',
        message: reason || (isActive ? 'บัญชีของคุณได้รับการเปิดใช้งานแล้ว' : 'บัญชีของคุณถูกระงับการใช้งาน'),
        type: 'account_status',
        priority: 'high'
      });

      res.json({
        success: true,
        message: `${isActive ? 'เปิด' : 'ระงับ'}การใช้งานบัญชีสำเร็จ`,
        data: user
      });

    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทสถานะผู้ใช้'
      });
    }
  }

  // Verify trainer
  async verifyTrainer(req, res) {
    try {
      const { trainerId } = req.params;
      const { isVerified, verificationNotes } = req.body;

      const trainer = await Trainer.findByIdAndUpdate(
        trainerId,
        {
          isVerified,
          verificationNotes,
          verifiedAt: isVerified ? new Date() : null,
          verifiedBy: req.user.userId
        },
        { new: true }
      ).populate('userId', 'firstName lastName email');

      if (!trainer) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบเทรนเนอร์'
        });
      }

      // Send email
      await sendEmail({
        to: trainer.userId.email,
        subject: isVerified ? 'บัญชีเทรนเนอร์ได้รับการยืนยัน' : 'การยืนยันบัญชีเทรนเนอร์',
        template: 'trainerVerification',
        data: {
          name: trainer.userId.firstName,
          isVerified,
          notes: verificationNotes
        }
      });

      res.json({
        success: true,
        message: `${isVerified ? 'ยืนยัน' : 'ปฏิเสธการยืนยัน'}เทรนเนอร์สำเร็จ`,
        data: trainer
      });

    } catch (error) {
      console.error('Verify trainer error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการยืนยันเทรนเนอร์'
      });
    }
  }

  // Financial management
  async getFinancialOverview(req, res) {
    try {
      const { year = new Date().getFullYear() } = req.query;

      // Monthly revenue
      const monthlyRevenue = await Payment.aggregate([
        {
          $match: {
            status: 'completed',
            completedAt: {
              $gte: new Date(year, 0, 1),
              $lte: new Date(year, 11, 31, 23, 59, 59)
            }
          }
        },
        {
          $group: {
            _id: { $month: '$completedAt' },
            revenue: { $sum: '$amount' },
            platformFees: { $sum: { $multiply: ['$amount', 0.2] } },
            trainerEarnings: { $sum: { $multiply: ['$amount', 0.8] } },
            transactions: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Payment method distribution
      const paymentMethods = await Payment.aggregate([
        {
          $match: {
            status: 'completed',
            completedAt: {
              $gte: new Date(year, 0, 1),
              $lte: new Date(year, 11, 31, 23, 59, 59)
            }
          }
        },
        {
          $group: {
            _id: '$method',
            count: { $sum: 1 },
            total: { $sum: '$amount' }
          }
        }
      ]);

      // Pending payouts
      const pendingPayouts = await Trainer.aggregate([
        {
          $match: { pendingBalance: { $gt: 0 } }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            trainerId: '$_id',
            name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
            pendingBalance: 1,
            lastPayoutDate: 1
          }
        },
        { $sort: { pendingBalance: -1 } }
      ]);

      res.json({
        success: true,
        data: {
          monthlyRevenue,
          paymentMethods,
          pendingPayouts,
          year
        }
      });

    } catch (error) {
      console.error('Get financial overview error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการเงิน'
      });
    }
  }

  // Process trainer payout
  async processTrainerPayout(req, res) {
    try {
      const { trainerId } = req.params;
      const { amount, method, accountDetails, notes } = req.body;

      const trainer = await Trainer.findById(trainerId);
      
      if (!trainer) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบเทรนเนอร์'
        });
      }

      if (trainer.pendingBalance < amount) {
        return res.status(400).json({
          success: false,
          message: 'ยอดเงินไม่เพียงพอ'
        });
      }

      // Create payout record
      const payout = {
        trainerId,
        amount,
        method,
        accountDetails,
        notes,
        processedBy: req.user.userId,
        processedAt: new Date(),
        status: 'completed'
      };

      // Update trainer balance
      trainer.pendingBalance -= amount;
      trainer.totalPaidOut = (trainer.totalPaidOut || 0) + amount;
      trainer.lastPayoutDate = new Date();
      trainer.payoutHistory.push(payout);
      await trainer.save();

      // Update related payments
      await Payment.updateMany(
        {
          trainerId,
          status: 'completed',
          payoutStatus: { $ne: 'paid' }
        },
        {
          payoutStatus: 'paid',
          payoutDate: new Date()
        }
      );

      res.json({
        success: true,
        message: 'ดำเนินการจ่ายเงินสำเร็จ',
        data: payout
      });

    } catch (error) {
      console.error('Process trainer payout error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการจ่ายเงิน'
      });
    }
  }

  // Review management
  async getReportedReviews(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const reviews = await Review.find({
        'reports.0': { $exists: true }
      })
        .populate('clientId trainerId', 'firstName lastName')
        .sort({ 'reports.length': -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalCount = await Review.countDocuments({
        'reports.0': { $exists: true }
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
      console.error('Get reported reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรีวิวที่ถูกรายงาน'
      });
    }
  }

  // Handle reported review
  async handleReportedReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { action, adminNotes } = req.body;

      const review = await Review.findById(reviewId);
      
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบรีวิว'
        });
      }

      if (action === 'remove') {
        review.isActive = false;
        review.removedBy = req.user.userId;
        review.removedAt = new Date();
        review.removalReason = adminNotes;
      } else if (action === 'dismiss') {
        review.reports = [];
        review.isFlagged = false;
      }

      review.adminReviewNotes = adminNotes;
      review.adminReviewedAt = new Date();
      review.adminReviewedBy = req.user.userId;
      await review.save();

      res.json({
        success: true,
        message: action === 'remove' ? 'ลบรีวิวสำเร็จ' : 'ยกเลิกการรายงานสำเร็จ',
        data: review
      });

    } catch (error) {
      console.error('Handle reported review error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการจัดการรีวิว'
      });
    }
  }

  // System settings
  async getSystemSettings(req, res) {
    try {
      // Fetch system settings from database or config
      const settings = {
        platform: {
          name: 'FitConnect',
          commissionRate: 0.2,
          minPayoutAmount: 1000,
          currency: 'THB'
        },
        booking: {
          cancellationHours: 24,
          rescheduleHours: 24,
          maxReschedules: 3
        },
        trainer: {
          maxPackages: 3,
          maxGalleryImages: 12,
          verificationRequired: true
        },
        client: {
          freeTrialDays: 7,
          referralBonus: 100
        }
      };

      res.json({
        success: true,
        data: settings
      });

    } catch (error) {
      console.error('Get system settings error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า'
      });
    }
  }

  // Update system settings
  async updateSystemSettings(req, res) {
    try {
      const { category, settings } = req.body;

      // Update settings in database
      // This is a simplified version - in production, store in DB

      res.json({
        success: true,
        message: 'อัพเดทการตั้งค่าระบบสำเร็จ'
      });

    } catch (error) {
      console.error('Update system settings error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่า'
      });
    }
  }

  // Generate reports
  async generateReport(req, res) {
    try {
      const { type, startDate, endDate, format = 'json' } = req.query;

      let reportData;

      switch (type) {
        case 'revenue':
          reportData = await this.generateRevenueReport(startDate, endDate);
          break;
        case 'users':
          reportData = await this.generateUsersReport(startDate, endDate);
          break;
        case 'bookings':
          reportData = await this.generateBookingsReport(startDate, endDate);
          break;
        case 'trainers':
          reportData = await this.generateTrainersReport(startDate, endDate);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'ประเภทรายงานไม่ถูกต้อง'
          });
      }

      if (format === 'csv') {
        // Convert to CSV format
        // Implementation depends on CSV library
      } else if (format === 'pdf') {
        // Generate PDF
        // Implementation depends on PDF library
      }

      res.json({
        success: true,
        data: reportData
      });

    } catch (error) {
      console.error('Generate report error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างรายงาน'
      });
    }
  }

  // Generate revenue report
  async generateRevenueReport(startDate, endDate) {
    const dateQuery = {
      completedAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const [summary, daily, byTrainer, byPackage] = await Promise.all([
      // Summary
      Payment.aggregate([
        { $match: { status: 'completed', ...dateQuery } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            totalTransactions: { $sum: 1 },
            avgTransaction: { $avg: '$amount' },
            platformFees: { $sum: { $multiply: ['$amount', 0.2] } },
            trainerEarnings: { $sum: { $multiply: ['$amount', 0.8] } }
          }
        }
      ]),

      // Daily breakdown
      Payment.aggregate([
        { $match: { status: 'completed', ...dateQuery } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
            revenue: { $sum: '$amount' },
            transactions: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // By trainer
      Payment.aggregate([
        { $match: { status: 'completed', ...dateQuery } },
        {
          $group: {
            _id: '$trainerId',
            revenue: { $sum: '$amount' },
            transactions: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 20 }
      ]),

      // By package type
      Payment.aggregate([
        { $match: { status: 'completed', ...dateQuery } },
        {
          $lookup: {
            from: 'bookings',
            localField: 'bookingId',
            foreignField: '_id',
            as: 'booking'
          }
        },
        { $unwind: '$booking' },
        {
          $lookup: {
            from: 'packages',
            localField: 'booking.packageId',
            foreignField: '_id',
            as: 'package'
          }
        },
        { $unwind: '$package' },
        {
          $group: {
            _id: '$package.type',
            revenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    return {
      summary: summary[0],
      daily,
      byTrainer,
      byPackage
    };
  }
}

module.exports = new AdminController();
