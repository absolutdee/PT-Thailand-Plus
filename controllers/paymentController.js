// controllers/paymentController.js
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Trainer = require('../models/Trainer');
const User = require('../models/User');
const { processPayment, createPaymentIntent, refundPayment } = require('../utils/payment');
const { sendEmail } = require('../utils/email');
const { sendNotification } = require('../utils/notification');

class PaymentController {
  // Create payment intent
  async createPaymentIntent(req, res) {
    try {
      const clientId = req.user.clientId;
      const { bookingId, paymentMethod } = req.body;

      // Get booking details
      const booking = await Booking.findOne({
        _id: bookingId,
        clientId,
        status: 'pending'
      }).populate('packageId');

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการจองหรือการจองไม่อยู่ในสถานะรอชำระเงิน'
        });
      }

      // Create payment intent with payment provider
      const paymentIntent = await createPaymentIntent({
        amount: booking.amount,
        currency: 'THB',
        metadata: {
          bookingId: booking._id.toString(),
          clientId: clientId.toString(),
          trainerId: booking.trainerId.toString()
        }
      });

      // Create payment record
      const payment = await Payment.create({
        bookingId,
        clientId,
        trainerId: booking.trainerId,
        amount: booking.amount,
        method: paymentMethod,
        status: 'pending',
        paymentIntentId: paymentIntent.id
      });

      res.json({
        success: true,
        data: {
          paymentId: payment._id,
          clientSecret: paymentIntent.client_secret,
          amount: booking.amount
        }
      });

    } catch (error) {
      console.error('Create payment intent error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างการชำระเงิน'
      });
    }
  }

  // Confirm payment
  async confirmPayment(req, res) {
    try {
      const { paymentId, paymentIntentId } = req.body;

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบข้อมูลการชำระเงิน'
        });
      }

      // Verify payment with payment provider
      const paymentStatus = await processPayment(paymentIntentId);

      if (paymentStatus.status === 'succeeded') {
        // Update payment record
        payment.status = 'completed';
        payment.completedAt = new Date();
        payment.transactionId = paymentStatus.id;
        await payment.save();

        // Update booking status
        const booking = await Booking.findByIdAndUpdate(
          payment.bookingId,
          { 
            status: 'confirmed',
            paymentId: payment._id,
            paidAt: new Date()
          },
          { new: true }
        ).populate([
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

        // Calculate trainer commission (e.g., 80% to trainer, 20% platform fee)
        const trainerAmount = payment.amount * 0.8;
        const platformFee = payment.amount * 0.2;

        // Update trainer balance
        await Trainer.findByIdAndUpdate(payment.trainerId, {
          $inc: { 
            totalEarnings: trainerAmount,
            pendingBalance: trainerAmount
          }
        });

        // Send notifications
        await Promise.all([
          // Notify trainer
          sendNotification({
            userId: booking.trainerId.userId._id,
            title: 'การชำระเงินสำเร็จ',
            message: `ได้รับการชำระเงินจาก ${booking.clientId.userId.firstName} จำนวน ${payment.amount} บาท`,
            type: 'payment_received',
            relatedId: payment._id
          }),

          // Send receipt to client
          sendEmail({
            to: booking.clientId.userId.email,
            subject: 'ใบเสร็จรับเงิน - การจองเทรนเนอร์',
            template: 'paymentReceipt',
            data: {
              clientName: booking.clientId.userId.firstName,
              packageName: booking.packageId.name,
              trainerName: `${booking.trainerId.userId.firstName} ${booking.trainerId.userId.lastName}`,
              amount: payment.amount,
              paymentDate: payment.completedAt,
              receiptNumber: payment._id
            }
          })
        ]);

        res.json({
          success: true,
          message: 'ชำระเงินสำเร็จ',
          data: {
            payment,
            booking
          }
        });

      } else {
        payment.status = 'failed';
        payment.failureReason = paymentStatus.error;
        await payment.save();

        res.status(400).json({
          success: false,
          message: 'การชำระเงินไม่สำเร็จ'
        });
      }

    } catch (error) {
      console.error('Confirm payment error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการยืนยันการชำระเงิน'
      });
    }
  }

  // Get payment history
  async getPaymentHistory(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

      let query = {};
      
      if (userRole === 'trainer') {
        query.trainerId = req.user.trainerId;
      } else if (userRole === 'client') {
        query.clientId = req.user.clientId;
      }

      if (status) {
        query.status = status;
      }

      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const payments = await Payment.find(query)
        .populate({
          path: 'bookingId',
          populate: [
            {
              path: 'packageId',
              select: 'name'
            },
            {
              path: 'trainerId',
              populate: {
                path: 'userId',
                select: 'firstName lastName'
              }
            },
            {
              path: 'clientId',
              populate: {
                path: 'userId',
                select: 'firstName lastName'
              }
            }
          ]
        })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalCount = await Payment.countDocuments(query);

      // Calculate total amounts
      const totals = await Payment.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          payments,
          totals,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงประวัติการชำระเงิน'
      });
    }
  }

  // Get payment receipt
  async getPaymentReceipt(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const payment = await Payment.findById(id)
        .populate({
          path: 'bookingId',
          populate: [
            {
              path: 'packageId'
            },
            {
              path: 'trainerId',
              populate: {
                path: 'userId',
                select: 'firstName lastName email phone'
              }
            },
            {
              path: 'clientId',
              populate: {
                path: 'userId',
                select: 'firstName lastName email phone address'
              }
            }
          ]
        });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบข้อมูลการชำระเงิน'
        });
      }

      // Check authorization
      const isAuthorized = 
        (userRole === 'trainer' && payment.trainerId._id.toString() === req.user.trainerId) ||
        (userRole === 'client' && payment.clientId._id.toString() === req.user.clientId) ||
        userRole === 'admin';

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์ดูใบเสร็จนี้'
        });
      }

      res.json({
        success: true,
        data: payment
      });

    } catch (error) {
      console.error('Get payment receipt error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลใบเสร็จ'
      });
    }
  }

  // Process refund
  async processRefund(req, res) {
    try {
      const { paymentId, amount, reason } = req.body;
      const userRole = req.user.role;

      // Only admin or system can process refunds
      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์ทำการคืนเงิน'
        });
      }

      const payment = await Payment.findById(paymentId)
        .populate('bookingId');

      if (!payment || payment.status !== 'completed') {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการชำระเงินหรือไม่สามารถคืนเงินได้'
        });
      }

      // Check if already refunded
      if (payment.refundedAmount >= payment.amount) {
        return res.status(400).json({
          success: false,
          message: 'การชำระเงินนี้ได้รับการคืนเงินเต็มจำนวนแล้ว'
        });
      }

      // Process refund with payment provider
      const refundResult = await refundPayment({
        paymentIntentId: payment.paymentIntentId,
        amount: amount || payment.amount,
        reason
      });

      if (refundResult.status === 'succeeded') {
        // Update payment record
        payment.refundedAmount = (payment.refundedAmount || 0) + (amount || payment.amount);
        payment.refundHistory.push({
          amount: amount || payment.amount,
          reason,
          refundedAt: new Date(),
          refundedBy: req.user.userId
        });
        
        if (payment.refundedAmount >= payment.amount) {
          payment.status = 'refunded';
        } else {
          payment.status = 'partially_refunded';
        }
        
        await payment.save();

        // Update trainer balance
        const refundAmount = amount || payment.amount;
        const trainerDeduction = refundAmount * 0.8; // 80% from trainer
        
        await Trainer.findByIdAndUpdate(payment.trainerId, {
          $inc: { 
            totalEarnings: -trainerDeduction,
            pendingBalance: -trainerDeduction
          }
        });

        // Send notifications
        const booking = await Booking.findById(payment.bookingId)
          .populate([
            {
              path: 'clientId',
              populate: {
                path: 'userId',
                select: 'email firstName'
              }
            },
            {
              path: 'trainerId',
              populate: {
                path: 'userId',
                select: 'email firstName'
              }
            }
          ]);

        await Promise.all([
          sendNotification({
            userId: booking.clientId.userId._id,
            title: 'การคืนเงินสำเร็จ',
            message: `คุณได้รับการคืนเงินจำนวน ${refundAmount} บาท`,
            type: 'refund_processed',
            relatedId: payment._id
          }),
          sendEmail({
            to: booking.clientId.userId.email,
            subject: 'แจ้งการคืนเงิน',
            template: 'refundNotification',
            data: {
              clientName: booking.clientId.userId.firstName,
              amount: refundAmount,
              reason,
              refundDate: new Date()
            }
          })
        ]);

        res.json({
          success: true,
          message: 'คืนเงินสำเร็จ',
          data: payment
        });

      } else {
        res.status(400).json({
          success: false,
          message: 'ไม่สามารถคืนเงินได้'
        });
      }

    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการคืนเงิน'
      });
    }
  }

  // Get trainer earnings
  async getTrainerEarnings(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { year = new Date().getFullYear(), month } = req.query;

      // Build date range
      let dateRange = {};
      if (month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        dateRange = {
          completedAt: {
            $gte: startDate,
            $lte: endDate
          }
        };
      } else {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        dateRange = {
          completedAt: {
            $gte: startDate,
            $lte: endDate
          }
        };
      }

      // Get earnings by month
      const earningsByMonth = await Payment.aggregate([
        {
          $match: {
            trainerId,
            status: 'completed',
            ...dateRange
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$completedAt' },
              month: { $month: '$completedAt' }
            },
            totalAmount: { $sum: '$amount' },
            trainerEarnings: { $sum: { $multiply: ['$amount', 0.8] } },
            platformFees: { $sum: { $multiply: ['$amount', 0.2] } },
            transactionCount: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      // Get current balance
      const trainer = await Trainer.findById(trainerId);

      // Get pending payouts
      const pendingPayouts = await Payment.aggregate([
        {
          $match: {
            trainerId,
            status: 'completed',
            payoutStatus: { $ne: 'paid' }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$amount', 0.8] } }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          currentBalance: trainer.pendingBalance || 0,
          totalEarnings: trainer.totalEarnings || 0,
          pendingAmount: pendingPayouts[0]?.total || 0,
          earningsByMonth,
          year: parseInt(year)
        }
      });

    } catch (error) {
      console.error('Get trainer earnings error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายได้'
      });
    }
  }

  // Request payout
  async requestPayout(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { amount, bankAccount } = req.body;

      const trainer = await Trainer.findById(trainerId);

      if (trainer.pendingBalance < amount) {
        return res.status(400).json({
          success: false,
          message: 'ยอดเงินที่ขอถอนมากกว่ายอดคงเหลือ'
        });
      }

      // Minimum payout amount (e.g., 1000 THB)
      if (amount < 1000) {
        return res.status(400).json({
          success: false,
          message: 'ยอดถอนขั้นต่ำ 1,000 บาท'
        });
      }

      // Create payout request
      const payoutRequest = {
        trainerId,
        amount,
        bankAccount,
        status: 'pending',
        requestedAt: new Date()
      };

      // Notify admin
      await sendNotification({
        userId: 'admin',
        title: 'คำขอถอนเงินใหม่',
        message: `เทรนเนอร์ขอถอนเงินจำนวน ${amount} บาท`,
        type: 'payout_request',
        relatedId: trainerId
      });

      res.json({
        success: true,
        message: 'ส่งคำขอถอนเงินสำเร็จ จะได้รับเงินภายใน 3-5 วันทำการ',
        data: payoutRequest
      });

    } catch (error) {
      console.error('Request payout error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการส่งคำขอถอนเงิน'
      });
    }
  }
}

module.exports = new PaymentController();
