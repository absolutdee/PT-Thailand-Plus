// controllers/bookingController.js
const Booking = require('../models/Booking');
const Package = require('../models/Package');
const Trainer = require('../models/Trainer');
const Client = require('../models/Client');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const { sendEmail } = require('../utils/email');
const { sendNotification } = require('../utils/notification');

class BookingController {
  // Create booking
  async createBooking(req, res) {
    try {
      const clientId = req.user.clientId;
      const {
        trainerId,
        packageId,
        sessionDate,
        sessionTime,
        location,
        notes
      } = req.body;

      // Validate package
      const package = await Package.findById(packageId);
      if (!package || !package.isActive) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแพคเกจหรือแพคเกจไม่พร้อมใช้งาน'
        });
      }

      // Check trainer availability
      const existingBooking = await Booking.findOne({
        trainerId,
        sessionDate,
        sessionTime,
        status: { $in: ['confirmed', 'pending'] }
      });

      if (existingBooking) {
        return res.status(400).json({
          success: false,
          message: 'เทรนเนอร์ไม่ว่างในช่วงเวลานี้'
        });
      }

      // Calculate package end date
      const packageEndDate = new Date(sessionDate);
      packageEndDate.setDate(packageEndDate.getDate() + (package.duration * 7));

      // Create booking
      const booking = await Booking.create({
        clientId,
        trainerId,
        packageId,
        sessionDate,
        sessionTime,
        location,
        notes,
        amount: package.price,
        remainingSessions: package.totalSessions,
        packageEndDate,
        status: 'pending'
      });

      // Populate booking details
      await booking.populate([
        {
          path: 'trainerId',
          populate: {
            path: 'userId',
            select: 'firstName lastName email'
          }
        },
        {
          path: 'clientId',
          populate: {
            path: 'userId',
            select: 'firstName lastName email'
          }
        },
        'packageId'
      ]);

      // Send notification to trainer
      await sendNotification({
        userId: booking.trainerId.userId._id,
        title: 'การจองใหม่',
        message: `คุณมีการจองใหม่จาก ${booking.clientId.userId.firstName} ${booking.clientId.userId.lastName}`,
        type: 'booking',
        relatedId: booking._id
      });

      // Send email to trainer
      await sendEmail({
        to: booking.trainerId.userId.email,
        subject: 'คุณมีการจองใหม่',
        template: 'newBooking',
        data: {
          trainerName: booking.trainerId.userId.firstName,
          clientName: `${booking.clientId.userId.firstName} ${booking.clientId.userId.lastName}`,
          packageName: package.name,
          sessionDate: booking.sessionDate,
          sessionTime: booking.sessionTime
        }
      });

      res.status(201).json({
        success: true,
        message: 'สร้างการจองสำเร็จ',
        data: booking
      });

    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างการจอง'
      });
    }
  }

  // Get bookings
  async getBookings(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

      let query = {};
      
      // Filter by user role
      if (userRole === 'trainer') {
        query.trainerId = req.user.trainerId;
      } else if (userRole === 'client') {
        query.clientId = req.user.clientId;
      }

      // Filter by status
      if (status) {
        query.status = status;
      }

      // Filter by date range
      if (startDate && endDate) {
        query.sessionDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const bookings = await Booking.find(query)
        .populate([
          {
            path: 'trainerId',
            populate: {
              path: 'userId',
              select: 'firstName lastName profilePicture'
            }
          },
          {
            path: 'clientId',
            populate: {
              path: 'userId',
              select: 'firstName lastName profilePicture'
            }
          },
          'packageId'
        ])
        .sort({ sessionDate: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalCount = await Booking.countDocuments(query);

      res.json({
        success: true,
        data: {
          bookings,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Get bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจอง'
      });
    }
  }

  // Get booking by ID
  async getBookingById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const booking = await Booking.findById(id)
        .populate([
          {
            path: 'trainerId',
            populate: {
              path: 'userId',
              select: 'firstName lastName profilePicture email phone'
            }
          },
          {
            path: 'clientId',
            populate: {
              path: 'userId',
              select: 'firstName lastName profilePicture email phone'
            }
          },
          'packageId',
          'sessionHistory'
        ]);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการจอง'
        });
      }

      // Check authorization
      const isAuthorized = 
        (userRole === 'trainer' && booking.trainerId._id.toString() === req.user.trainerId) ||
        (userRole === 'client' && booking.clientId._id.toString() === req.user.clientId) ||
        userRole === 'admin';

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์ดูการจองนี้'
        });
      }

      res.json({
        success: true,
        data: booking
      });

    } catch (error) {
      console.error('Get booking by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจอง'
      });
    }
  }

  // Update booking status (trainer confirms/rejects)
  async updateBookingStatus(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { id } = req.params;
      const { status, reason } = req.body;

      const booking = await Booking.findOne({ 
        _id: id, 
        trainerId 
      }).populate([
        {
          path: 'clientId',
          populate: {
            path: 'userId',
            select: 'firstName lastName email'
          }
        },
        'packageId'
      ]);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการจองหรือคุณไม่มีสิทธิ์'
        });
      }

      if (booking.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'ไม่สามารถเปลี่ยนสถานะการจองนี้ได้'
        });
      }

      booking.status = status;
      if (status === 'cancelled' && reason) {
        booking.cancellationReason = reason;
      }
      booking.updatedAt = new Date();
      await booking.save();

      // Send notification to client
      const notificationData = {
        userId: booking.clientId.userId._id,
        type: 'booking_update',
        relatedId: booking._id
      };

      if (status === 'confirmed') {
        notificationData.title = 'การจองได้รับการยืนยัน';
        notificationData.message = `เทรนเนอร์ยืนยันการจองของคุณแล้ว`;
      } else if (status === 'cancelled') {
        notificationData.title = 'การจองถูกยกเลิก';
        notificationData.message = `เทรนเนอร์ยกเลิกการจองของคุณ${reason ? `: ${reason}` : ''}`;
      }

      await sendNotification(notificationData);

      // Send email
      await sendEmail({
        to: booking.clientId.userId.email,
        subject: notificationData.title,
        template: 'bookingStatusUpdate',
        data: {
          clientName: booking.clientId.userId.firstName,
          status: status === 'confirmed' ? 'ยืนยัน' : 'ยกเลิก',
          packageName: booking.packageId.name,
          sessionDate: booking.sessionDate,
          sessionTime: booking.sessionTime,
          reason
        }
      });

      res.json({
        success: true,
        message: `${status === 'confirmed' ? 'ยืนยัน' : 'ยกเลิก'}การจองสำเร็จ`,
        data: booking
      });

    } catch (error) {
      console.error('Update booking status error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทสถานะ'
      });
    }
  }

  // Reschedule booking
  async rescheduleBooking(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { id } = req.params;
      const { newDate, newTime, reason } = req.body;

      const booking = await Booking.findById(id)
        .populate([
          {
            path: 'trainerId',
            populate: {
              path: 'userId',
              select: 'firstName lastName email'
            }
          },
          {
            path: 'clientId',
            populate: {
              path: 'userId',
              select: 'firstName lastName email'
            }
          }
        ]);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการจอง'
        });
      }

      // Check authorization
      const isAuthorized = 
        (userRole === 'trainer' && booking.trainerId._id.toString() === req.user.trainerId) ||
        (userRole === 'client' && booking.clientId._id.toString() === req.user.clientId);

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์เลื่อนการจองนี้'
        });
      }

      // Check if can reschedule (24 hours before)
      const hoursBefore = (new Date(booking.sessionDate) - new Date()) / (1000 * 60 * 60);
      if (hoursBefore < 24) {
        return res.status(400).json({
          success: false,
          message: 'ไม่สามารถเลื่อนนัดได้ ต้องเลื่อนล่วงหน้าอย่างน้อย 24 ชั่วโมง'
        });
      }

      // Check trainer availability for new time
      const existingBooking = await Booking.findOne({
        trainerId: booking.trainerId._id,
        sessionDate: newDate,
        sessionTime: newTime,
        status: { $in: ['confirmed', 'pending'] },
        _id: { $ne: id }
      });

      if (existingBooking) {
        return res.status(400).json({
          success: false,
          message: 'เทรนเนอร์ไม่ว่างในช่วงเวลาใหม่'
        });
      }

      // Update booking
      const oldDate = booking.sessionDate;
      const oldTime = booking.sessionTime;
      
      booking.sessionDate = newDate;
      booking.sessionTime = newTime;
      booking.rescheduleCount = (booking.rescheduleCount || 0) + 1;
      booking.rescheduleHistory.push({
        oldDate,
        oldTime,
        newDate,
        newTime,
        reason,
        requestedBy: userRole,
        requestedAt: new Date()
      });
      await booking.save();

      // Send notifications
      const notifyUser = userRole === 'trainer' ? booking.clientId.userId : booking.trainerId.userId;
      const requestedBy = userRole === 'trainer' ? 'เทรนเนอร์' : 'ลูกค้า';

      await sendNotification({
        userId: notifyUser._id,
        title: 'การจองถูกเลื่อน',
        message: `${requestedBy}ได้เลื่อนการจองจาก ${oldDate} เป็น ${newDate}`,
        type: 'booking_reschedule',
        relatedId: booking._id
      });

      res.json({
        success: true,
        message: 'เลื่อนการจองสำเร็จ',
        data: booking
      });

    } catch (error) {
      console.error('Reschedule booking error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเลื่อนการจอง'
      });
    }
  }

  // Cancel booking
  async cancelBooking(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { id } = req.params;
      const { reason } = req.body;

      const booking = await Booking.findById(id)
        .populate([
          {
            path: 'trainerId',
            populate: {
              path: 'userId',
              select: 'firstName lastName email'
            }
          },
          {
            path: 'clientId',
            populate: {
              path: 'userId',
              select: 'firstName lastName email'
            }
          },
          'packageId'
        ]);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการจอง'
        });
      }

      // Check authorization
      const isAuthorized = 
        (userRole === 'trainer' && booking.trainerId._id.toString() === req.user.trainerId) ||
        (userRole === 'client' && booking.clientId._id.toString() === req.user.clientId);

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์ยกเลิกการจองนี้'
        });
      }

      // Check cancellation policy
      const hoursBefore = (new Date(booking.sessionDate) - new Date()) / (1000 * 60 * 60);
      let refundAmount = 0;

      if (userRole === 'client') {
        if (hoursBefore >= 48) {
          refundAmount = booking.amount; // Full refund
        } else if (hoursBefore >= 24) {
          refundAmount = booking.amount * 0.5; // 50% refund
        }
        // No refund if less than 24 hours
      }

      // Update booking status
      booking.status = 'cancelled';
      booking.cancellationReason = reason;
      booking.cancelledBy = userRole;
      booking.cancelledAt = new Date();
      await booking.save();

      // Process refund if applicable
      if (refundAmount > 0 && booking.paymentId) {
        // Create refund record
        // This would integrate with your payment processor
      }

      // Send notifications
      const notifyUser = userRole === 'trainer' ? booking.clientId.userId : booking.trainerId.userId;
      const cancelledBy = userRole === 'trainer' ? 'เทรนเนอร์' : 'ลูกค้า';

      await sendNotification({
        userId: notifyUser._id,
        title: 'การจองถูกยกเลิก',
        message: `${cancelledBy}ได้ยกเลิกการจอง${reason ? `: ${reason}` : ''}`,
        type: 'booking_cancelled',
        relatedId: booking._id
      });

      res.json({
        success: true,
        message: 'ยกเลิกการจองสำเร็จ',
        data: {
          booking,
          refundAmount
        }
      });

    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการยกเลิกการจอง'
      });
    }
  }

  // Complete session
  async completeSession(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { id } = req.params;
      const { notes, exercises, duration } = req.body;

      const booking = await Booking.findOne({ 
        _id: id, 
        trainerId,
        status: 'confirmed'
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการจองหรือคุณไม่มีสิทธิ์'
        });
      }

      // Check if session date has passed
      if (new Date(booking.sessionDate) > new Date()) {
        return res.status(400).json({
          success: false,
          message: 'ยังไม่ถึงเวลาเซสชั่น'
        });
      }

      // Update booking
      booking.status = 'completed';
      booking.completedAt = new Date();
      booking.sessionNotes = notes;
      booking.remainingSessions = Math.max(0, booking.remainingSessions - 1);

      // Add to session history
      booking.sessionHistory.push({
        date: booking.sessionDate,
        time: booking.sessionTime,
        duration,
        exercises,
        notes,
        completedAt: new Date()
      });

      await booking.save();

      // Update trainer stats
      await Trainer.findByIdAndUpdate(trainerId, {
        $inc: { totalSessions: 1 }
      });

      res.json({
        success: true,
        message: 'บันทึกการเทรนสำเร็จ',
        data: booking
      });

    } catch (error) {
      console.error('Complete session error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการบันทึกการเทรน'
      });
    }
  }
}

module.exports = new BookingController();
