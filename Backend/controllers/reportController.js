// controllers/reportController.js
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const moment = require('moment');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Progress = require('../models/Progress');
const WorkoutPlan = require('../models/WorkoutPlan');
const NutritionPlan = require('../models/NutritionPlan');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Client = require('../models/Client');

class ReportController {
  // Generate trainer income report
  async generateIncomeReport(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { startDate, endDate, format = 'pdf' } = req.query;

      const dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };

      // Get payment data
      const payments = await Payment.find({
        trainerId,
        status: 'completed',
        completedAt: { $gte: dateRange.start, $lte: dateRange.end }
      })
        .populate('bookingId')
        .populate({
          path: 'clientId',
          populate: {
            path: 'userId',
            select: 'firstName lastName'
          }
        })
        .sort({ completedAt: -1 });

      // Calculate summary
      const summary = {
        totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
        totalEarnings: payments.reduce((sum, p) => sum + (p.amount * 0.8), 0),
        platformFees: payments.reduce((sum, p) => sum + (p.amount * 0.2), 0),
        totalTransactions: payments.length,
        avgTransaction: payments.length > 0 
          ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length 
          : 0
      };

      // Group by month
      const monthlyBreakdown = {};
      payments.forEach(payment => {
        const month = moment(payment.completedAt).format('YYYY-MM');
        if (!monthlyBreakdown[month]) {
          monthlyBreakdown[month] = {
            revenue: 0,
            earnings: 0,
            fees: 0,
            count: 0
          };
        }
        monthlyBreakdown[month].revenue += payment.amount;
        monthlyBreakdown[month].earnings += payment.amount * 0.8;
        monthlyBreakdown[month].fees += payment.amount * 0.2;
        monthlyBreakdown[month].count += 1;
      });

      // Get trainer info
      const trainer = await Trainer.findById(trainerId)
        .populate('userId', 'firstName lastName email');

      const reportData = {
        trainer: {
          name: `${trainer.userId.firstName} ${trainer.userId.lastName}`,
          email: trainer.userId.email
        },
        period: {
          start: dateRange.start,
          end: dateRange.end
        },
        summary,
        monthlyBreakdown,
        transactions: payments.map(p => ({
          date: p.completedAt,
          client: `${p.clientId.userId.firstName} ${p.clientId.userId.lastName}`,
          amount: p.amount,
          earnings: p.amount * 0.8,
          fees: p.amount * 0.2,
          status: p.status
        }))
      };

      if (format === 'pdf') {
        const pdf = await this.generateIncomePDF(reportData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=income-report-${moment().format('YYYY-MM-DD')}.pdf`);
        pdf.pipe(res);
      } else if (format === 'excel') {
        const excel = await this.generateIncomeExcel(reportData);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=income-report-${moment().format('YYYY-MM-DD')}.xlsx`);
        await excel.xlsx.write(res);
      } else {
        res.json({
          success: true,
          data: reportData
        });
      }

    } catch (error) {
      console.error('Generate income report error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างรายงาน'
      });
    }
  }

  // Generate client progress report
  async generateProgressReport(req, res) {
    try {
      const clientId = req.user.clientId || req.query.clientId;
      const { startDate, endDate, format = 'pdf' } = req.query;

      // Verify trainer access if clientId provided
      if (req.query.clientId && req.user.role === 'trainer') {
        const hasAccess = await Booking.findOne({
          trainerId: req.user.trainerId,
          clientId: req.query.clientId,
          status: { $in: ['confirmed', 'completed'] }
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลลูกค้ารายนี้'
          });
        }
      }

      const dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };

      // Get progress data
      const progressData = await Progress.find({
        clientId,
        recordedAt: { $gte: dateRange.start, $lte: dateRange.end }
      }).sort({ recordedAt: 1 });

      // Get workout data
      const workouts = await Booking.find({
        clientId,
        status: 'completed',
        completedAt: { $gte: dateRange.start, $lte: dateRange.end }
      })
        .populate('trainerId')
        .populate('packageId');

      // Get nutrition logs
      const nutritionPlan = await NutritionPlan.findOne({
        clientId,
        isActive: true
      });

      const nutritionLogs = nutritionPlan?.dailyLogs.filter(log => 
        log.date >= dateRange.start && log.date <= dateRange.end
      ) || [];

      // Get client info
      const client = await Client.findById(clientId)
        .populate('userId', 'firstName lastName email');

      // Calculate analytics
      const analytics = this.calculateProgressAnalytics(progressData);

      const reportData = {
        client: {
          name: `${client.userId.firstName} ${client.userId.lastName}`,
          email: client.userId.email,
          goals: client.goals,
          targetWeight: client.targetWeight
        },
        period: {
          start: dateRange.start,
          end: dateRange.end
        },
        progress: {
          measurements: progressData,
          analytics
        },
        workouts: {
          total: workouts.length,
          byType: this.groupWorkoutsByType(workouts),
          consistency: this.calculateWorkoutConsistency(workouts, dateRange)
        },
        nutrition: {
          adherence: this.calculateNutritionAdherence(nutritionLogs, nutritionPlan),
          averages: this.calculateNutritionAverages(nutritionLogs)
        }
      };

      if (format === 'pdf') {
        const pdf = await this.generateProgressPDF(reportData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=progress-report-${moment().format('YYYY-MM-DD')}.pdf`);
        pdf.pipe(res);
      } else if (format === 'excel') {
        const excel = await this.generateProgressExcel(reportData);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=progress-report-${moment().format('YYYY-MM-DD')}.xlsx`);
        await excel.xlsx.write(res);
      } else {
        res.json({
          success: true,
          data: reportData
        });
      }

    } catch (error) {
      console.error('Generate progress report error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างรายงาน'
      });
    }
  }

  // Generate booking summary report
  async generateBookingSummary(req, res) {
    try {
      const { startDate, endDate, format = 'pdf' } = req.query;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };

      let bookingQuery = {
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      };

      if (userRole === 'trainer') {
        bookingQuery.trainerId = req.user.trainerId;
      } else if (userRole === 'client') {
        bookingQuery.clientId = req.user.clientId;
      }

      const bookings = await Booking.find(bookingQuery)
        .populate({
          path: 'trainerId',
          populate: {
            path: 'userId',
            select: 'firstName lastName'
          }
        })
        .populate({
          path: 'clientId',
          populate: {
            path: 'userId',
            select: 'firstName lastName'
          }
        })
        .populate('packageId')
        .sort({ sessionDate: -1 });

      // Group by status
      const statusBreakdown = bookings.reduce((acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {});

      // Group by package
      const packageBreakdown = bookings.reduce((acc, booking) => {
        const packageName = booking.packageId?.name || 'Unknown';
        acc[packageName] = (acc[packageName] || 0) + 1;
        return acc;
      }, {});

      // Calculate revenue
      const revenue = bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.amount || 0), 0);

      const reportData = {
        period: {
          start: dateRange.start,
          end: dateRange.end
        },
        summary: {
          total: bookings.length,
          completed: statusBreakdown.completed || 0,
          cancelled: statusBreakdown.cancelled || 0,
          pending: statusBreakdown.pending || 0,
          revenue
        },
        statusBreakdown,
        packageBreakdown,
        bookings: bookings.map(b => ({
          date: b.sessionDate,
          client: userRole === 'trainer' 
            ? `${b.clientId.userId.firstName} ${b.clientId.userId.lastName}`
            : null,
          trainer: userRole === 'client'
            ? `${b.trainerId.userId.firstName} ${b.trainerId.userId.lastName}`
            : null,
          package: b.packageId?.name,
          status: b.status,
          amount: b.amount
        }))
      };

      if (format === 'pdf') {
        const pdf = await this.generateBookingPDF(reportData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=booking-summary-${moment().format('YYYY-MM-DD')}.pdf`);
        pdf.pipe(res);
      } else if (format === 'excel') {
        const excel = await this.generateBookingExcel(reportData);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=booking-summary-${moment().format('YYYY-MM-DD')}.xlsx`);
        await excel.xlsx.write(res);
      } else {
        res.json({
          success: true,
          data: reportData
        });
      }

    } catch (error) {
      console.error('Generate booking summary error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างรายงาน'
      });
    }
  }

  // Generate admin overview report
  async generateAdminReport(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'ไม่มีสิทธิ์เข้าถึง'
        });
      }

      const { period = 'month', format = 'pdf' } = req.query;
      const dateRange = this.getDateRangeFromPeriod(period);

      // Get comprehensive stats
      const [
        userStats,
        bookingStats,
        revenueStats,
        trainerPerformance,
        platformGrowth
      ] = await Promise.all([
        this.getUserStatistics(dateRange),
        this.getBookingStatistics(dateRange),
        this.getRevenueStatistics(dateRange),
        this.getTrainerPerformance(dateRange),
        this.getPlatformGrowth(dateRange)
      ]);

      const reportData = {
        period: {
          name: period,
          start: dateRange.start,
          end: dateRange.end
        },
        users: userStats,
        bookings: bookingStats,
        revenue: revenueStats,
        trainers: trainerPerformance,
        growth: platformGrowth
      };

      if (format === 'pdf') {
        const pdf = await this.generateAdminPDF(reportData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=admin-report-${moment().format('YYYY-MM-DD')}.pdf`);
        pdf.pipe(res);
      } else {
        res.json({
          success: true,
          data: reportData
        });
      }

    } catch (error) {
      console.error('Generate admin report error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างรายงาน'
      });
    }
  }

  // ==================== PDF GENERATION ====================

  // Generate income PDF
  async generateIncomePDF(data) {
    const doc = new PDFDocument();

    // Add logo and header
    doc.fontSize(20).text('รายงานรายได้', 50, 50);
    doc.fontSize(12).text(`${data.trainer.name}`, 50, 80);
    doc.text(`ระหว่างวันที่ ${moment(data.period.start).format('DD/MM/YYYY')} - ${moment(data.period.end).format('DD/MM/YYYY')}`, 50, 100);

    // Summary section
    doc.fontSize(16).text('สรุปรายได้', 50, 140);
    doc.fontSize(12);
    doc.text(`รายได้รวม: ${this.formatCurrency(data.summary.totalRevenue)}`, 50, 170);
    doc.text(`รายได้สุทธิ: ${this.formatCurrency(data.summary.totalEarnings)}`, 50, 190);
    doc.text(`ค่าธรรมเนียมแพลตฟอร์ม: ${this.formatCurrency(data.summary.platformFees)}`, 50, 210);
    doc.text(`จำนวนรายการ: ${data.summary.totalTransactions}`, 50, 230);
    doc.text(`รายได้เฉลี่ยต่อรายการ: ${this.formatCurrency(data.summary.avgTransaction)}`, 50, 250);

    // Monthly breakdown
    doc.fontSize(16).text('รายได้รายเดือน', 50, 290);
    let yPos = 320;
    
    Object.entries(data.monthlyBreakdown).forEach(([month, stats]) => {
      doc.fontSize(12);
      doc.text(`${moment(month).format('MMMM YYYY')}`, 50, yPos);
      doc.text(`รายได้: ${this.formatCurrency(stats.revenue)}`, 200, yPos);
      doc.text(`รายได้สุทธิ: ${this.formatCurrency(stats.earnings)}`, 350, yPos);
      yPos += 20;
    });

    // Transaction details
    doc.addPage();
    doc.fontSize(16).text('รายละเอียดรายการ', 50, 50);
    
    // Table header
    doc.fontSize(10);
    doc.text('วันที่', 50, 90);
    doc.text('ลูกค้า', 150, 90);
    doc.text('จำนวนเงิน', 300, 90);
    doc.text('รายได้สุทธิ', 400, 90);
    doc.text('ค่าธรรมเนียม', 500, 90);

    // Table data
    yPos = 110;
    data.transactions.forEach(transaction => {
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }
      
      doc.text(moment(transaction.date).format('DD/MM/YYYY'), 50, yPos);
      doc.text(transaction.client, 150, yPos);
      doc.text(this.formatCurrency(transaction.amount), 300, yPos);
      doc.text(this.formatCurrency(transaction.earnings), 400, yPos);
      doc.text(this.formatCurrency(transaction.fees), 500, yPos);
      yPos += 20;
    });

    doc.end();
    return doc;
  }

  // Generate progress PDF
  async generateProgressPDF(data) {
    const doc = new PDFDocument();

    // Header
    doc.fontSize(20).text('รายงานความก้าวหน้า', 50, 50);
    doc.fontSize(12).text(`${data.client.name}`, 50, 80);
    doc.text(`ระหว่างวันที่ ${moment(data.period.start).format('DD/MM/YYYY')} - ${moment(data.period.end).format('DD/MM/YYYY')}`, 50, 100);

    // Goals
    doc.fontSize(16).text('เป้าหมาย', 50, 140);
    doc.fontSize(12);
    data.client.goals.forEach((goal, index) => {
      doc.text(`• ${goal}`, 70, 170 + (index * 20));
    });

    // Progress summary
    doc.fontSize(16).text('สรุปความก้าวหน้า', 50, 250);
    if (data.progress.analytics.weight) {
      doc.fontSize(12);
      doc.text(`น้ำหนักเริ่มต้น: ${data.progress.analytics.weight.start} kg`, 50, 280);
      doc.text(`น้ำหนักปัจจุบัน: ${data.progress.analytics.weight.current} kg`, 50, 300);
      doc.text(`เปลี่ยนแปลง: ${data.progress.analytics.weight.change} kg (${data.progress.analytics.weight.changePercent}%)`, 50, 320);
    }

    // Workout summary
    doc.fontSize(16).text('สรุปการออกกำลังกาย', 50, 370);
    doc.fontSize(12);
    doc.text(`จำนวนครั้งทั้งหมด: ${data.workouts.total}`, 50, 400);
    doc.text(`อัตราความสม่ำเสมอ: ${data.workouts.consistency}%`, 50, 420);

    // Nutrition summary
    if (data.nutrition.adherence) {
      doc.fontSize(16).text('สรุปโภชนาการ', 50, 470);
      doc.fontSize(12);
      doc.text(`การปฏิบัติตามแผน: ${data.nutrition.adherence}%`, 50, 500);
      doc.text(`แคลอรี่เฉลี่ย: ${Math.round(data.nutrition.averages.calories)}`, 50, 520);
      doc.text(`โปรตีนเฉลี่ย: ${Math.round(data.nutrition.averages.protein)}g`, 50, 540);
    }

    // Progress chart (would need chart library integration)
    doc.addPage();
    doc.fontSize(16).text('กราฟแสดงความก้าวหน้า', 50, 50);
    // Add chart here

    doc.end();
    return doc;
  }

  // ==================== EXCEL GENERATION ====================

  // Generate income Excel
  async generateIncomeExcel(data) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงานรายได้');

    // Header
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = 'รายงานรายได้';
    worksheet.getCell('A1').font = { size: 16, bold: true };

    worksheet.getCell('A2').value = `ชื่อเทรนเนอร์: ${data.trainer.name}`;
    worksheet.getCell('A3').value = `ระหว่างวันที่: ${moment(data.period.start).format('DD/MM/YYYY')} - ${moment(data.period.end).format('DD/MM/YYYY')}`;

    // Summary
    worksheet.getCell('A5').value = 'สรุปรายได้';
    worksheet.getCell('A5').font = { bold: true };

    const summaryData = [
      ['รายได้รวม', data.summary.totalRevenue],
      ['รายได้สุทธิ', data.summary.totalEarnings],
      ['ค่าธรรมเนียมแพลตฟอร์ม', data.summary.platformFees],
      ['จำนวนรายการ', data.summary.totalTransactions],
      ['รายได้เฉลี่ยต่อรายการ', data.summary.avgTransaction]
    ];

    summaryData.forEach((row, index) => {
      worksheet.getCell(`A${6 + index}`).value = row[0];
      worksheet.getCell(`B${6 + index}`).value = row[1];
      worksheet.getCell(`B${6 + index}`).numFmt = '#,##0.00';
    });

    // Monthly breakdown
    worksheet.getCell('A12').value = 'รายได้รายเดือน';
    worksheet.getCell('A12').font = { bold: true };

    const monthlyHeaders = ['เดือน', 'รายได้', 'รายได้สุทธิ', 'ค่าธรรมเนียม', 'จำนวนรายการ'];
    monthlyHeaders.forEach((header, index) => {
      worksheet.getCell(`${String.fromCharCode(65 + index)}13`).value = header;
      worksheet.getCell(`${String.fromCharCode(65 + index)}13`).font = { bold: true };
    });

    let rowNum = 14;
    Object.entries(data.monthlyBreakdown).forEach(([month, stats]) => {
      worksheet.getCell(`A${rowNum}`).value = moment(month).format('MMMM YYYY');
      worksheet.getCell(`B${rowNum}`).value = stats.revenue;
      worksheet.getCell(`C${rowNum}`).value = stats.earnings;
      worksheet.getCell(`D${rowNum}`).value = stats.fees;
      worksheet.getCell(`E${rowNum}`).value = stats.count;

      ['B', 'C', 'D'].forEach(col => {
        worksheet.getCell(`${col}${rowNum}`).numFmt = '#,##0.00';
      });

      rowNum++;
    });

    // Transaction details
    const detailsSheet = workbook.addWorksheet('รายละเอียดรายการ');
    const detailHeaders = ['วันที่', 'ลูกค้า', 'จำนวนเงิน', 'รายได้สุทธิ', 'ค่าธรรมเนียม'];
    
    detailHeaders.forEach((header, index) => {
      detailsSheet.getCell(`${String.fromCharCode(65 + index)}1`).value = header;
      detailsSheet.getCell(`${String.fromCharCode(65 + index)}1`).font = { bold: true };
    });

    data.transactions.forEach((transaction, index) => {
      const row = index + 2;
      detailsSheet.getCell(`A${row}`).value = moment(transaction.date).format('DD/MM/YYYY');
      detailsSheet.getCell(`B${row}`).value = transaction.client;
      detailsSheet.getCell(`C${row}`).value = transaction.amount;
      detailsSheet.getCell(`D${row}`).value = transaction.earnings;
      detailsSheet.getCell(`E${row}`).value = transaction.fees;

      ['C', 'D', 'E'].forEach(col => {
        detailsSheet.getCell(`${col}${row}`).numFmt = '#,##0.00';
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15;
    });

    detailsSheet.columns.forEach(column => {
      column.width = 20;
    });

    return workbook;
  }

  // ==================== HELPER FUNCTIONS ====================

  // Calculate progress analytics
  calculateProgressAnalytics(progressData) {
    if (progressData.length === 0) return {};

    const first = progressData[0];
    const last = progressData[progressData.length - 1];

    return {
      weight: {
        start: first.weight,
        current: last.weight,
        change: last.weight - first.weight,
        changePercent: ((last.weight - first.weight) / first.weight * 100).toFixed(2)
      },
      bodyFat: {
        start: first.bodyFat,
        current: last.bodyFat,
        change: (last.bodyFat || 0) - (first.bodyFat || 0)
      },
      muscleMass: {
        start: first.muscleMass,
        current: last.muscleMass,
        change: (last.muscleMass || 0) - (first.muscleMass || 0)
      }
    };
  }

  // Group workouts by type
  groupWorkoutsByType(workouts) {
    return workouts.reduce((acc, workout) => {
      const type = workout.packageId?.type || 'general';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  }

  // Calculate workout consistency
  calculateWorkoutConsistency(workouts, dateRange) {
    const totalDays = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
    const workoutDays = new Set(
      workouts.map(w => moment(w.sessionDate).format('YYYY-MM-DD'))
    ).size;

    return Math.round((workoutDays / totalDays) * 100);
  }

  // Calculate nutrition adherence
  calculateNutritionAdherence(logs, plan) {
    if (!logs.length || !plan) return null;

    const adherenceScores = logs.map(log => {
      const calorieAdherence = 1 - Math.abs(log.totalCalories - plan.dailyCalories) / plan.dailyCalories;
      return Math.max(0, Math.min(1, calorieAdherence));
    });

    return Math.round(adherenceScores.reduce((sum, score) => sum + score, 0) / logs.length * 100);
  }

  // Calculate nutrition averages
  calculateNutritionAverages(logs) {
    if (!logs.length) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

    return {
      calories: logs.reduce((sum, log) => sum + log.totalCalories, 0) / logs.length,
      protein: logs.reduce((sum, log) => sum + log.totalProtein, 0) / logs.length,
      carbs: logs.reduce((sum, log) => sum + log.totalCarbs, 0) / logs.length,
      fat: logs.reduce((sum, log) => sum + log.totalFat, 0) / logs.length
    };
  }

  // Get date range from period
  getDateRangeFromPeriod(period) {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return { start, end };
  }

  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  }

  // Get user statistics
  async getUserStatistics(dateRange) {
    const [totalUsers, newUsers, activeUsers] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({
        role: { $ne: 'admin' },
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      }),
      User.countDocuments({
        role: { $ne: 'admin' },
        lastLogin: { $gte: dateRange.start, $lte: dateRange.end }
      })
    ]);

    return {
      total: totalUsers,
      new: newUsers,
      active: activeUsers,
      growth: totalUsers > 0 ? (newUsers / totalUsers * 100).toFixed(2) : 0
    };
  }

  // Get booking statistics
  async getBookingStatistics(dateRange) {
    const bookings = await Booking.find({
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    });

    const statusBreakdown = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    return {
      total: bookings.length,
      completed: statusBreakdown.completed || 0,
      cancelled: statusBreakdown.cancelled || 0,
      cancellationRate: bookings.length > 0 
        ? ((statusBreakdown.cancelled || 0) / bookings.length * 100).toFixed(2)
        : 0
    };
  }

  // Get revenue statistics
  async getRevenueStatistics(dateRange) {
    const payments = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          platformFees: { $sum: { $multiply: ['$amount', 0.2] } },
          trainerEarnings: { $sum: { $multiply: ['$amount', 0.8] } },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    return payments[0] || {
      totalRevenue: 0,
      platformFees: 0,
      trainerEarnings: 0,
      transactionCount: 0
    };
  }

  // Get trainer performance
  async getTrainerPerformance(dateRange) {
    const topTrainers = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: '$trainerId',
          revenue: { $sum: '$amount' },
          sessions: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'trainers',
          localField: '_id',
          foreignField: '_id',
          as: 'trainer'
        }
      },
      { $unwind: '$trainer' },
      {
        $lookup: {
          from: 'users',
          localField: 'trainer.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ]);

    return topTrainers.map(t => ({
      name: `${t.user.firstName} ${t.user.lastName}`,
      revenue: t.revenue,
      sessions: t.sessions,
      rating: t.trainer.rating
    }));
  }

  // Get platform growth
  async getPlatformGrowth(dateRange) {
    // This would calculate month-over-month growth metrics
    // Simplified version
    return {
      userGrowth: 15.5, // percentage
      revenueGrowth: 22.3,
      bookingGrowth: 18.7
    };
  }

  // Generate tax report
  async generateTaxReport(req, res) {
    try {
      const { year, format = 'pdf' } = req.query;
      const userRole = req.user.role;
      const userId = req.user.userId;

      let taxData;

      if (userRole === 'trainer') {
        taxData = await this.getTrainerTaxData(req.user.trainerId, year);
      } else if (userRole === 'admin') {
        taxData = await this.getPlatformTaxData(year);
      } else {
        return res.status(403).json({
          success: false,
          message: 'ไม่มีสิทธิ์เข้าถึงรายงานภาษี'
        });
      }

      if (format === 'pdf') {
        const pdf = await this.generateTaxPDF(taxData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=tax-report-${year}.pdf`);
        pdf.pipe(res);
      } else {
        res.json({
          success: true,
          data: taxData
        });
      }

    } catch (error) {
      console.error('Generate tax report error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างรายงานภาษี'
      });
    }
  }

  // Get trainer tax data
  async getTrainerTaxData(trainerId, year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const payments = await Payment.find({
      trainerId,
      status: 'completed',
      completedAt: { $gte: startDate, $lte: endDate }
    });

    const monthlyIncome = {};
    let totalIncome = 0;
    let totalFees = 0;

    payments.forEach(payment => {
      const month = moment(payment.completedAt).format('MM');
      if (!monthlyIncome[month]) {
        monthlyIncome[month] = {
          gross: 0,
          fees: 0,
          net: 0
        };
      }
      
      const earnings = payment.amount * 0.8;
      const fees = payment.amount * 0.2;
      
      monthlyIncome[month].gross += payment.amount;
      monthlyIncome[month].fees += fees;
      monthlyIncome[month].net += earnings;
      
      totalIncome += earnings;
      totalFees += fees;
    });

    // Get trainer info
    const trainer = await Trainer.findById(trainerId)
      .populate('userId', 'firstName lastName taxId address');

    return {
      year,
      trainer: {
        name: `${trainer.userId.firstName} ${trainer.userId.lastName}`,
        taxId: trainer.userId.taxId,
        address: trainer.userId.address
      },
      income: {
        gross: totalIncome + totalFees,
        platformFees: totalFees,
        net: totalIncome,
        taxable: totalIncome, // All income is taxable
        withholdingTax: totalIncome * 0.03 // 3% withholding tax
      },
      monthlyBreakdown: monthlyIncome
    };
  }
}

module.exports = new ReportController();
