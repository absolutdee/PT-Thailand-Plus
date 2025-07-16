// controllers/packageController.js
const Package = require('../models/Package');
const Trainer = require('../models/Trainer');
const Booking = require('../models/Booking');

class PackageController {
  // Create package
  async createPackage(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const {
        name,
        description,
        price,
        duration,
        sessionsPerWeek,
        totalSessions,
        features,
        type,
        isRecommended
      } = req.body;

      // Check package limit (max 3 packages)
      const packageCount = await Package.countDocuments({ 
        trainerId, 
        isActive: true 
      });

      if (packageCount >= 3) {
        return res.status(400).json({
          success: false,
          message: 'จำนวนแพคเกจถึงขีดจำกัดแล้ว (สูงสุด 3 แพคเกจ)'
        });
      }

      // If isRecommended is true, unset other recommended packages
      if (isRecommended) {
        await Package.updateMany(
          { trainerId, isRecommended: true },
          { isRecommended: false }
        );
      }

      const package = await Package.create({
        trainerId,
        name,
        description,
        price,
        duration,
        sessionsPerWeek,
        totalSessions,
        features,
        type,
        isRecommended,
        isActive: true
      });

      res.status(201).json({
        success: true,
        message: 'สร้างแพคเกจสำเร็จ',
        data: package
      });

    } catch (error) {
      console.error('Create package error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างแพคเกจ'
      });
    }
  }

  // Get trainer packages
  async getTrainerPackages(req, res) {
    try {
      const { trainerId } = req.params;

      const packages = await Package.find({ 
        trainerId, 
        isActive: true 
      }).sort({ isRecommended: -1, price: 1 });

      res.json({
        success: true,
        data: packages
      });

    } catch (error) {
      console.error('Get trainer packages error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแพคเกจ'
      });
    }
  }

  // Get package by ID
  async getPackageById(req, res) {
    try {
      const { id } = req.params;

      const package = await Package.findById(id)
        .populate({
          path: 'trainerId',
          populate: {
            path: 'userId',
            select: 'firstName lastName profilePicture'
          }
        });

      if (!package) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแพคเกจ'
        });
      }

      res.json({
        success: true,
        data: package
      });

    } catch (error) {
      console.error('Get package by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแพคเกจ'
      });
    }
  }

  // Update package
  async updatePackage(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { id } = req.params;
      const updates = req.body;

      // Check ownership
      const package = await Package.findOne({ _id: id, trainerId });
      if (!package) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแพคเกจหรือคุณไม่มีสิทธิ์แก้ไข'
        });
      }

      // If setting as recommended, unset others
      if (updates.isRecommended) {
        await Package.updateMany(
          { trainerId, isRecommended: true, _id: { $ne: id } },
          { isRecommended: false }
        );
      }

      // Update package
      Object.assign(package, updates);
      package.updatedAt = new Date();
      await package.save();

      res.json({
        success: true,
        message: 'อัพเดทแพคเกจสำเร็จ',
        data: package
      });

    } catch (error) {
      console.error('Update package error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทแพคเกจ'
      });
    }
  }

  // Delete package (soft delete)
  async deletePackage(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { id } = req.params;

      // Check ownership
      const package = await Package.findOne({ _id: id, trainerId });
      if (!package) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแพคเกจหรือคุณไม่มีสิทธิ์ลบ'
        });
      }

      // Check if package has active bookings
      const activeBookings = await Booking.countDocuments({
        packageId: id,
        status: { $in: ['pending', 'confirmed'] },
        sessionDate: { $gte: new Date() }
      });

      if (activeBookings > 0) {
        return res.status(400).json({
          success: false,
          message: 'ไม่สามารถลบแพคเกจที่มีการจองที่ยังใช้งานอยู่'
        });
      }

      // Soft delete
      package.isActive = false;
      package.deletedAt = new Date();
      await package.save();

      res.json({
        success: true,
        message: 'ลบแพคเกจสำเร็จ'
      });

    } catch (error) {
      console.error('Delete package error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบแพคเกจ'
      });
    }
  }

  // Get package statistics
  async getPackageStats(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { packageId } = req.params;

      // Check ownership
      const package = await Package.findOne({ 
        _id: packageId, 
        trainerId 
      });
      
      if (!package) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแพคเกจหรือคุณไม่มีสิทธิ์ดูข้อมูล'
        });
      }

      const [
        totalBookings,
        activeBookings,
        completedBookings,
        revenue,
        uniqueClients
      ] = await Promise.all([
        // Total bookings
        Booking.countDocuments({ packageId }),

        // Active bookings
        Booking.countDocuments({
          packageId,
          status: 'confirmed',
          packageEndDate: { $gte: new Date() }
        }),

        // Completed bookings
        Booking.countDocuments({
          packageId,
          status: 'completed'
        }),

        // Total revenue
        Booking.aggregate([
          {
            $match: {
              packageId: package._id,
              status: { $in: ['completed', 'confirmed'] }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]),

        // Unique clients
        Booking.distinct('clientId', { packageId })
      ]);

      res.json({
        success: true,
        data: {
          package: {
            id: package._id,
            name: package.name,
            price: package.price
          },
          stats: {
            totalBookings,
            activeBookings,
            completedBookings,
            totalRevenue: revenue[0]?.total || 0,
            uniqueClients: uniqueClients.length,
            averageRevenue: revenue[0]?.total ? (revenue[0].total / totalBookings) : 0
          }
        }
      });

    } catch (error) {
      console.error('Get package stats error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ'
      });
    }
  }

  // Compare packages performance
  async comparePackages(req, res) {
    try {
      const trainerId = req.user.trainerId;

      const packages = await Package.find({ 
        trainerId, 
        isActive: true 
      });

      const packageStats = await Promise.all(
        packages.map(async (pkg) => {
          const [bookings, revenue, clients] = await Promise.all([
            Booking.countDocuments({ packageId: pkg._id }),
            Booking.aggregate([
              {
                $match: {
                  packageId: pkg._id,
                  status: { $in: ['completed', 'confirmed'] }
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$amount' }
                }
              }
            ]),
            Booking.distinct('clientId', { packageId: pkg._id })
          ]);

          return {
            package: {
              id: pkg._id,
              name: pkg.name,
              price: pkg.price,
              isRecommended: pkg.isRecommended
            },
            performance: {
              totalBookings: bookings,
              totalRevenue: revenue[0]?.total || 0,
              totalClients: clients.length,
              conversionRate: bookings > 0 ? ((bookings / clients.length) * 100).toFixed(2) : 0
            }
          };
        })
      );

      // Sort by revenue
      packageStats.sort((a, b) => b.performance.totalRevenue - a.performance.totalRevenue);

      res.json({
        success: true,
        data: packageStats
      });

    } catch (error) {
      console.error('Compare packages error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเปรียบเทียบแพคเกจ'
      });
    }
  }
}

module.exports = new PackageController();
