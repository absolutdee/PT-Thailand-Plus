// controllers/progressController.js
const Progress = require('../models/Progress');
const Client = require('../models/Client');
const Trainer = require('../models/Trainer');
const Booking = require('../models/Booking');
const { uploadToCloudinary } = require('../utils/cloudinary');

class ProgressController {
  // Record progress entry
  async recordProgress(req, res) {
    try {
      const clientId = req.user.clientId;
      const {
        weight,
        bodyFat,
        muscleMass,
        measurements,
        performanceMetrics,
        bloodPressure,
        heartRate,
        sleepHours,
        waterIntake,
        energyLevel,
        mood,
        notes
      } = req.body;

      // Create progress entry
      const progress = await Progress.create({
        clientId,
        weight,
        bodyFat,
        muscleMass,
        measurements,
        performanceMetrics,
        bloodPressure,
        heartRate,
        sleepHours,
        waterIntake,
        energyLevel,
        mood,
        notes,
        recordedAt: new Date()
      });

      // Update client's current weight
      if (weight) {
        await Client.findByIdAndUpdate(clientId, {
          weight,
          lastWeightUpdate: new Date()
        });
      }

      res.status(201).json({
        success: true,
        message: 'บันทึกความก้าวหน้าสำเร็จ',
        data: progress
      });

    } catch (error) {
      console.error('Record progress error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการบันทึกความก้าวหน้า'
      });
    }
  }

  // Upload progress photos
  async uploadProgressPhotos(req, res) {
    try {
      const clientId = req.user.clientId;
      const { progressId } = req.params;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเลือกรูปภาพ'
        });
      }

      const progress = await Progress.findOne({
        _id: progressId,
        clientId
      });

      if (!progress) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบข้อมูลความก้าวหน้า'
        });
      }

      // Upload photos
      const uploadPromises = req.files.map(file => 
        uploadToCloudinary(file.buffer, {
          folder: 'progress-photos',
          transformation: [
            { width: 800, height: 1000, crop: 'limit' }
          ]
        })
      );

      const results = await Promise.all(uploadPromises);

      // Add photos to progress
      progress.photos = results.map(result => ({
        url: result.secure_url,
        publicId: result.public_id,
        uploadedAt: new Date()
      }));

      await progress.save();

      res.json({
        success: true,
        message: 'อัพโหลดรูปภาพสำเร็จ',
        data: progress.photos
      });

    } catch (error) {
      console.error('Upload progress photos error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ'
      });
    }
  }

  // Get progress history
  async getProgressHistory(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { 
        clientId,
        startDate, 
        endDate,
        metrics = 'all',
        page = 1, 
        limit = 30 
      } = req.query;

      let query = {};

      // Handle authorization
      if (userRole === 'client') {
        query.clientId = req.user.clientId;
      } else if (userRole === 'trainer') {
        // Verify trainer has access to client
        if (!clientId) {
          return res.status(400).json({
            success: false,
            message: 'กรุณาระบุ clientId'
          });
        }

        const hasAccess = await Booking.findOne({
          trainerId: req.user.trainerId,
          clientId,
          status: { $in: ['confirmed', 'completed'] }
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'คุณไม่มีสิทธิ์ดูข้อมูลลูกค้ารายนี้'
          });
        }

        query.clientId = clientId;
      }

      // Date filter
      if (startDate && endDate) {
        query.recordedAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Select specific metrics
      let selectFields = '';
      if (metrics !== 'all') {
        const metricsList = metrics.split(',');
        selectFields = metricsList.join(' ') + ' recordedAt';
      }

      const progressData = await Progress.find(query)
        .select(selectFields)
        .sort({ recordedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalCount = await Progress.countDocuments(query);

      res.json({
        success: true,
        data: {
          progress: progressData,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Get progress history error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลความก้าวหน้า'
      });
    }
  }

  // Get progress analytics
  async getProgressAnalytics(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { clientId, period = '3months' } = req.query;

      let targetClientId;

      if (userRole === 'client') {
        targetClientId = req.user.clientId;
      } else if (userRole === 'trainer') {
        if (!clientId) {
          return res.status(400).json({
            success: false,
            message: 'กรุณาระบุ clientId'
          });
        }

        // Verify access
        const hasAccess = await Booking.findOne({
          trainerId: req.user.trainerId,
          clientId,
          status: { $in: ['confirmed', 'completed'] }
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'คุณไม่มีสิทธิ์ดูข้อมูลลูกค้ารายนี้'
          });
        }

        targetClientId = clientId;
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '1week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '1month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Get progress data
      const progressData = await Progress.find({
        clientId: targetClientId,
        recordedAt: { $gte: startDate, $lte: endDate }
      }).sort({ recordedAt: 1 });

      // Calculate analytics
      const analytics = this.calculateAnalytics(progressData);

      // Get client info
      const client = await Client.findById(targetClientId)
        .populate('userId', 'firstName lastName');

      res.json({
        success: true,
        data: {
          client: {
            name: `${client.userId.firstName} ${client.userId.lastName}`,
            goals: client.goals,
            targetWeight: client.targetWeight
          },
          period,
          dateRange: {
            start: startDate,
            end: endDate
          },
          analytics,
          rawData: progressData
        }
      });

    } catch (error) {
      console.error('Get progress analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการวิเคราะห์ความก้าวหน้า'
      });
    }
  }

  // Calculate analytics from progress data
  calculateAnalytics(progressData) {
    if (progressData.length === 0) {
      return {
        weight: {},
        bodyComposition: {},
        performance: {},
        wellness: {}
      };
    }

    const firstEntry = progressData[0];
    const lastEntry = progressData[progressData.length - 1];

    // Weight analytics
    const weightChange = lastEntry.weight - firstEntry.weight;
    const weightChangePercent = ((weightChange / firstEntry.weight) * 100).toFixed(2);

    // Body composition
    const bodyFatChange = (lastEntry.bodyFat || 0) - (firstEntry.bodyFat || 0);
    const muscleMassChange = (lastEntry.muscleMass || 0) - (firstEntry.muscleMass || 0);

    // Calculate averages
    const avgSleep = progressData.reduce((sum, p) => sum + (p.sleepHours || 0), 0) / progressData.length;
    const avgWater = progressData.reduce((sum, p) => sum + (p.waterIntake || 0), 0) / progressData.length;
    const avgEnergy = progressData.reduce((sum, p) => sum + (p.energyLevel || 0), 0) / progressData.length;

    // Measurements changes
    const measurementChanges = {};
    if (firstEntry.measurements && lastEntry.measurements) {
      Object.keys(firstEntry.measurements).forEach(key => {
        if (lastEntry.measurements[key]) {
          measurementChanges[key] = lastEntry.measurements[key] - firstEntry.measurements[key];
        }
      });
    }

    return {
      weight: {
        start: firstEntry.weight,
        current: lastEntry.weight,
        change: weightChange,
        changePercent: parseFloat(weightChangePercent),
        trend: this.calculateTrend(progressData.map(p => p.weight))
      },
      bodyComposition: {
        bodyFat: {
          start: firstEntry.bodyFat,
          current: lastEntry.bodyFat,
          change: bodyFatChange
        },
        muscleMass: {
          start: firstEntry.muscleMass,
          current: lastEntry.muscleMass,
          change: muscleMassChange
        }
      },
      measurements: measurementChanges,
      wellness: {
        avgSleepHours: avgSleep.toFixed(1),
        avgWaterIntake: avgWater.toFixed(1),
        avgEnergyLevel: avgEnergy.toFixed(1)
      },
      performance: this.calculatePerformanceMetrics(progressData)
    };
  }

  // Calculate trend (simplified linear regression)
  calculateTrend(values) {
    const validValues = values.filter(v => v != null);
    if (validValues.length < 2) return 'stable';

    const n = validValues.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = validValues.reduce((sum, val) => sum + val, 0);
    const sumXY = validValues.reduce((sum, val, i) => sum + (i * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    if (slope > 0.1) return 'increasing';
    if (slope < -0.1) return 'decreasing';
    return 'stable';
  }

  // Calculate performance metrics
  calculatePerformanceMetrics(progressData) {
    const metrics = {};
    
    progressData.forEach(entry => {
      if (entry.performanceMetrics) {
        Object.entries(entry.performanceMetrics).forEach(([key, value]) => {
          if (!metrics[key]) {
            metrics[key] = {
              values: [],
              improvement: 0
            };
          }
          metrics[key].values.push(value);
        });
      }
    });

    // Calculate improvements
    Object.keys(metrics).forEach(key => {
      const values = metrics[key].values;
      if (values.length >= 2) {
        const first = values[0];
        const last = values[values.length - 1];
        metrics[key].improvement = ((last - first) / first * 100).toFixed(2);
        metrics[key].current = last;
        metrics[key].start = first;
      }
    });

    return metrics;
  }

  // Compare progress between periods
  async compareProgress(req, res) {
    try {
      const clientId = req.user.clientId;
      const { period1Start, period1End, period2Start, period2End } = req.query;

      // Get progress for both periods
      const [period1Data, period2Data] = await Promise.all([
        Progress.find({
          clientId,
          recordedAt: { $gte: new Date(period1Start), $lte: new Date(period1End) }
        }).sort({ recordedAt: 1 }),
        
        Progress.find({
          clientId,
          recordedAt: { $gte: new Date(period2Start), $lte: new Date(period2End) }
        }).sort({ recordedAt: 1 })
      ]);

      // Calculate analytics for both periods
      const period1Analytics = this.calculateAnalytics(period1Data);
      const period2Analytics = this.calculateAnalytics(period2Data);

      // Compare results
      const comparison = {
        weight: {
          period1Change: period1Analytics.weight.change,
          period2Change: period2Analytics.weight.change,
          difference: period2Analytics.weight.change - period1Analytics.weight.change
        },
        bodyFat: {
          period1Change: period1Analytics.bodyComposition.bodyFat.change,
          period2Change: period2Analytics.bodyComposition.bodyFat.change,
          difference: period2Analytics.bodyComposition.bodyFat.change - period1Analytics.bodyComposition.bodyFat.change
        },
        muscleMass: {
          period1Change: period1Analytics.bodyComposition.muscleMass.change,
          period2Change: period2Analytics.bodyComposition.muscleMass.change,
          difference: period2Analytics.bodyComposition.muscleMass.change - period1Analytics.bodyComposition.muscleMass.change
        }
      };

      res.json({
        success: true,
        data: {
          period1: {
            dateRange: { start: period1Start, end: period1End },
            analytics: period1Analytics
          },
          period2: {
            dateRange: { start: period2Start, end: period2End },
            analytics: period2Analytics
          },
          comparison
        }
      });

    } catch (error) {
      console.error('Compare progress error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเปรียบเทียบความก้าวหน้า'
      });
    }
  }

  // Get progress milestones
  async getProgressMilestones(req, res) {
    try {
      const clientId = req.user.clientId;

      const client = await Client.findById(clientId);
      const progressData = await Progress.find({ clientId })
        .sort({ recordedAt: 1 });

      if (progressData.length === 0) {
        return res.json({
          success: true,
          data: {
            milestones: [],
            nextMilestones: []
          }
        });
      }

      const milestones = [];
      const firstWeight = progressData[0].weight;
      const currentWeight = progressData[progressData.length - 1].weight;
      const totalWeightLoss = firstWeight - currentWeight;

      // Weight loss milestones
      const weightMilestones = [5, 10, 15, 20, 25, 30];
      weightMilestones.forEach(milestone => {
        if (totalWeightLoss >= milestone) {
          const achievedEntry = progressData.find(p => 
            firstWeight - p.weight >= milestone
          );
          milestones.push({
            type: 'weight_loss',
            value: milestone,
            unit: 'kg',
            achievedAt: achievedEntry?.recordedAt,
            description: `ลดน้ำหนักได้ ${milestone} กิโลกรัม`
          });
        }
      });

      // Target weight milestone
      if (client.targetWeight && currentWeight <= client.targetWeight) {
        const achievedEntry = progressData.find(p => 
          p.weight <= client.targetWeight
        );
        milestones.push({
          type: 'target_weight',
          value: client.targetWeight,
          unit: 'kg',
          achievedAt: achievedEntry?.recordedAt,
          description: 'บรรลุเป้าหมายน้ำหนัก'
        });
      }

      // Consistency milestones
      const recordingDates = progressData.map(p => 
        p.recordedAt.toDateString()
      );
      const uniqueDates = [...new Set(recordingDates)];
      const consistencyMilestones = [7, 30, 60, 90, 180, 365];
      
      consistencyMilestones.forEach(days => {
        if (uniqueDates.length >= days) {
          milestones.push({
            type: 'consistency',
            value: days,
            unit: 'days',
            achievedAt: progressData[days - 1]?.recordedAt,
            description: `บันทึกความก้าวหน้าต่อเนื่อง ${days} วัน`
          });
        }
      });

      // Next milestones
      const nextMilestones = [];
      
      // Next weight milestone
      const nextWeightMilestone = weightMilestones.find(m => totalWeightLoss < m);
      if (nextWeightMilestone) {
        nextMilestones.push({
          type: 'weight_loss',
          value: nextWeightMilestone,
          remaining: nextWeightMilestone - totalWeightLoss,
          description: `อีก ${(nextWeightMilestone - totalWeightLoss).toFixed(1)} กก. จะครบ ${nextWeightMilestone} กก.`
        });
      }

      // Target weight
      if (client.targetWeight && currentWeight > client.targetWeight) {
        nextMilestones.push({
          type: 'target_weight',
          value: client.targetWeight,
          remaining: currentWeight - client.targetWeight,
          description: `อีก ${(currentWeight - client.targetWeight).toFixed(1)} กก. จะถึงเป้าหมาย`
        });
      }

      res.json({
        success: true,
        data: {
          milestones: milestones.sort((a, b) => b.achievedAt - a.achievedAt),
          nextMilestones,
          summary: {
            totalRecords: progressData.length,
            daysSinceStart: Math.floor((new Date() - progressData[0].recordedAt) / (1000 * 60 * 60 * 24)),
            totalWeightChange: totalWeightLoss
          }
        }
      });

    } catch (error) {
      console.error('Get progress milestones error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลความสำเร็จ'
      });
    }
  }

  // Export progress data
  async exportProgressData(req, res) {
    try {
      const clientId = req.user.clientId;
      const { format = 'json', startDate, endDate } = req.query;

      let query = { clientId };
      if (startDate && endDate) {
        query.recordedAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const progressData = await Progress.find(query)
        .sort({ recordedAt: 1 })
        .lean();

      // Get client info
      const client = await Client.findById(clientId)
        .populate('userId', 'firstName lastName email');

      const exportData = {
        client: {
          name: `${client.userId.firstName} ${client.userId.lastName}`,
          email: client.userId.email,
          exportDate: new Date()
        },
        progress: progressData
      };

      if (format === 'csv') {
        // Convert to CSV
        const csvData = this.convertToCSV(progressData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=progress-data.csv');
        return res.send(csvData);
      }

      res.json({
        success: true,
        data: exportData
      });

    } catch (error) {
      console.error('Export progress data error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการส่งออกข้อมูล'
      });
    }
  }

  // Convert progress data to CSV
  convertToCSV(data) {
    if (data.length === 0) return '';

    // Headers
    const headers = [
      'Date',
      'Weight (kg)',
      'Body Fat %',
      'Muscle Mass (kg)',
      'Sleep Hours',
      'Water Intake (L)',
      'Energy Level',
      'Mood',
      'Notes'
    ];

    // Add measurement headers if available
    const measurementKeys = data.reduce((keys, entry) => {
      if (entry.measurements) {
        Object.keys(entry.measurements).forEach(key => {
          if (!keys.includes(key)) keys.push(key);
        });
      }
      return keys;
    }, []);

    headers.push(...measurementKeys.map(key => `${key} (cm)`));

    // Convert data to rows
    const rows = data.map(entry => {
      const row = [
        new Date(entry.recordedAt).toLocaleDateString(),
        entry.weight || '',
        entry.bodyFat || '',
        entry.muscleMass || '',
        entry.sleepHours || '',
        entry.waterIntake || '',
        entry.energyLevel || '',
        entry.mood || '',
        entry.notes || ''
      ];

      // Add measurements
      measurementKeys.forEach(key => {
        row.push(entry.measurements?.[key] || '');
      });

      return row;
    });

    // Combine headers and rows
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }
}

module.exports = new ProgressController();
