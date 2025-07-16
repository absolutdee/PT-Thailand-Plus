// controllers/analyticsController.js
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Progress = require('../models/Progress');
const WorkoutPlan = require('../models/WorkoutPlan');
const NutritionPlan = require('../models/NutritionPlan');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

class AnalyticsController {
  // ==================== TRAINER ANALYTICS ====================

  // Get trainer dashboard analytics
  async getTrainerAnalytics(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { period = 'month', startDate, endDate } = req.query;

      // Calculate date range
      const dateRange = this.getDateRange(period, startDate, endDate);

      const [
        revenue,
        bookings,
        clients,
        reviews,
        performance,
        trends
      ] = await Promise.all([
        this.getRevenueAnalytics(trainerId, dateRange),
        this.getBookingAnalytics(trainerId, dateRange),
        this.getClientAnalytics(trainerId, dateRange),
        this.getReviewAnalytics(trainerId, dateRange),
        this.getPerformanceMetrics(trainerId, dateRange),
        this.getTrendAnalytics(trainerId, dateRange)
      ]);

      res.json({
        success: true,
        data: {
          period,
          dateRange,
          revenue,
          bookings,
          clients,
          reviews,
          performance,
          trends
        }
      });

    } catch (error) {
      console.error('Get trainer analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลวิเคราะห์'
      });
    }
  }

  // Get revenue analytics
  async getRevenueAnalytics(trainerId, dateRange) {
    const revenueData = await Payment.aggregate([
      {
        $match: {
          trainerId,
          status: 'completed',
          completedAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalEarnings: { $sum: { $multiply: ['$amount', 0.8] } },
          platformFees: { $sum: { $multiply: ['$amount', 0.2] } },
          transactionCount: { $sum: 1 },
          avgTransaction: { $avg: '$amount' }
        }
      }
    ]);

    // Revenue by day/week/month
    const revenueByPeriod = await Payment.aggregate([
      {
        $match: {
          trainerId,
          status: 'completed',
          completedAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateRange.groupFormat,
              date: '$completedAt'
            }
          },
          revenue: { $sum: '$amount' },
          earnings: { $sum: { $multiply: ['$amount', 0.8] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Revenue by package
    const revenueByPackage = await Payment.aggregate([
      {
        $match: {
          trainerId,
          status: 'completed',
          completedAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
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
          _id: {
            packageId: '$package._id',
            packageName: '$package.name'
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    return {
      summary: revenueData[0] || {
        totalRevenue: 0,
        totalEarnings: 0,
        platformFees: 0,
        transactionCount: 0,
        avgTransaction: 0
      },
      byPeriod: revenueByPeriod,
      byPackage: revenueByPackage,
      growth: await this.calculateGrowthRate(trainerId, 'revenue', dateRange)
    };
  }

  // Get booking analytics
  async getBookingAnalytics(trainerId, dateRange) {
    const bookingStats = await Booking.aggregate([
      {
        $match: {
          trainerId,
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Sessions by day of week
    const sessionsByDayOfWeek = await Booking.aggregate([
      {
        $match: {
          trainerId,
          status: 'completed',
          sessionDate: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$sessionDate' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Sessions by time of day
    const sessionsByTimeOfDay = await Booking.aggregate([
      {
        $match: {
          trainerId,
          status: 'completed',
          sessionDate: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: { $hour: '$sessionDate' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Booking conversion rate
    const totalInquiries = await Booking.countDocuments({
      trainerId,
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    });

    const confirmedBookings = await Booking.countDocuments({
      trainerId,
      status: { $in: ['confirmed', 'completed'] },
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    });

    const conversionRate = totalInquiries > 0 
      ? ((confirmedBookings / totalInquiries) * 100).toFixed(2)
      : 0;

    // Cancellation and no-show rates
    const cancellations = bookingStats.find(s => s._id === 'cancelled')?.count || 0;
    const noShows = bookingStats.find(s => s._id === 'no_show')?.count || 0;
    
    const totalSessions = bookingStats.reduce((sum, s) => sum + s.count, 0);
    const cancellationRate = totalSessions > 0 
      ? ((cancellations / totalSessions) * 100).toFixed(2)
      : 0;
    const noShowRate = totalSessions > 0 
      ? ((noShows / totalSessions) * 100).toFixed(2)
      : 0;

    return {
      summary: {
        total: totalSessions,
        confirmed: bookingStats.find(s => s._id === 'confirmed')?.count || 0,
        completed: bookingStats.find(s => s._id === 'completed')?.count || 0,
        cancelled: cancellations,
        noShow: noShows
      },
      rates: {
        conversion: parseFloat(conversionRate),
        cancellation: parseFloat(cancellationRate),
        noShow: parseFloat(noShowRate)
      },
      patterns: {
        byDayOfWeek: sessionsByDayOfWeek,
        byTimeOfDay: sessionsByTimeOfDay
      },
      utilizationRate: await this.calculateUtilizationRate(trainerId, dateRange)
    };
  }

  // Get client analytics
  async getClientAnalytics(trainerId, dateRange) {
    // Active clients
    const activeClients = await Booking.distinct('clientId', {
      trainerId,
      status: { $in: ['confirmed', 'completed'] },
      sessionDate: { $gte: dateRange.start, $lte: dateRange.end }
    });

    // New clients
    const newClients = await Booking.aggregate([
      {
        $match: { trainerId }
      },
      {
        $group: {
          _id: '$clientId',
          firstBooking: { $min: '$createdAt' }
        }
      },
      {
        $match: {
          firstBooking: { $gte: dateRange.start, $lte: dateRange.end }
        }
      }
    ]);

    // Client retention
    const previousPeriod = {
      start: new Date(dateRange.start.getTime() - (dateRange.end - dateRange.start)),
      end: dateRange.start
    };

    const previousClients = await Booking.distinct('clientId', {
      trainerId,
      status: { $in: ['confirmed', 'completed'] },
      sessionDate: { $gte: previousPeriod.start, $lte: previousPeriod.end }
    });

    const retainedClients = activeClients.filter(clientId => 
      previousClients.includes(clientId.toString())
    );

    const retentionRate = previousClients.length > 0
      ? ((retainedClients.length / previousClients.length) * 100).toFixed(2)
      : 0;

    // Client lifetime value
    const clientLTV = await Payment.aggregate([
      {
        $match: {
          trainerId,
          status: 'completed'
        }
      },
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
        $group: {
          _id: '$booking.clientId',
          totalSpent: { $sum: '$amount' },
          sessionCount: { $sum: 1 },
          firstSession: { $min: '$completedAt' },
          lastSession: { $max: '$completedAt' }
        }
      },
      {
        $group: {
          _id: null,
          avgLTV: { $avg: '$totalSpent' },
          avgSessions: { $avg: '$sessionCount' }
        }
      }
    ]);

    // Client demographics
    const clientDemographics = await this.getClientDemographics(trainerId);

    return {
      summary: {
        active: activeClients.length,
        new: newClients.length,
        retained: retainedClients.length,
        retentionRate: parseFloat(retentionRate)
      },
      lifetime: clientLTV[0] || { avgLTV: 0, avgSessions: 0 },
      demographics: clientDemographics,
      churnRisk: await this.identifyChurnRisk(trainerId, activeClients)
    };
  }

  // Get review analytics
  async getReviewAnalytics(trainerId, dateRange) {
    const reviews = await Review.find({
      trainerId,
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    });

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Rating distribution
    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length
    }));

    // Tag analysis
    const tagFrequency = {};
    reviews.forEach(review => {
      review.tags?.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Sentiment analysis (simplified)
    const sentimentKeywords = {
      positive: ['ดีมาก', 'ยอดเยี่ยม', 'ประทับใจ', 'แนะนำ', 'excellent', 'amazing'],
      negative: ['แย่', 'ไม่ดี', 'ผิดหวัง', 'ปรับปรุง', 'bad', 'poor']
    };

    let positiveCount = 0;
    let negativeCount = 0;

    reviews.forEach(review => {
      const comment = review.comment?.toLowerCase() || '';
      if (sentimentKeywords.positive.some(keyword => comment.includes(keyword))) {
        positiveCount++;
      }
      if (sentimentKeywords.negative.some(keyword => comment.includes(keyword))) {
        negativeCount++;
      }
    });

    return {
      summary: {
        total: totalReviews,
        avgRating: avgRating.toFixed(2),
        distribution: ratingDistribution
      },
      tags: topTags,
      sentiment: {
        positive: positiveCount,
        negative: negativeCount,
        neutral: totalReviews - positiveCount - negativeCount
      },
      recent: reviews.slice(0, 5).map(r => ({
        rating: r.rating,
        comment: r.comment,
        tags: r.tags,
        createdAt: r.createdAt
      }))
    };
  }

  // Get performance metrics
  async getPerformanceMetrics(trainerId, dateRange) {
    // Response time
    const messageResponseTimes = await Message.aggregate([
      {
        $match: {
          sender: { $ne: trainerId },
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $lookup: {
          from: 'messages',
          let: { chatId: '$chatId', sentAt: '$createdAt' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$chatId', '$$chatId'] },
                    { $eq: ['$sender', trainerId] },
                    { $gt: ['$createdAt', '$$sentAt'] }
                  ]
                }
              }
            },
            { $sort: { createdAt: 1 } },
            { $limit: 1 }
          ],
          as: 'response'
        }
      },
      {
        $match: { 'response.0': { $exists: true } }
      },
      {
        $project: {
          responseTime: {
            $subtract: [
              { $arrayElemAt: ['$response.createdAt', 0] },
              '$createdAt'
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' }
        }
      }
    ]);

    // Session punctuality
    const sessionPunctuality = await Booking.aggregate([
      {
        $match: {
          trainerId,
          status: 'completed',
          completedAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $project: {
          onTime: {
            $lte: [
              { $abs: { $subtract: ['$completedAt', '$sessionDate'] } },
              15 * 60 * 1000 // 15 minutes
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          onTime: { $sum: { $cond: ['$onTime', 1, 0] } }
        }
      }
    ]);

    const punctualityRate = sessionPunctuality[0]
      ? ((sessionPunctuality[0].onTime / sessionPunctuality[0].total) * 100).toFixed(2)
      : 100;

    // Client satisfaction indicators
    const repeatBookingRate = await this.calculateRepeatBookingRate(trainerId, dateRange);
    const referralRate = await this.estimateReferralRate(trainerId, dateRange);

    return {
      communication: {
        avgResponseTime: messageResponseTimes[0]?.avgResponseTime 
          ? Math.round(messageResponseTimes[0].avgResponseTime / (1000 * 60)) // minutes
          : null,
        responseRate: await this.calculateResponseRate(trainerId, dateRange)
      },
      reliability: {
        punctualityRate: parseFloat(punctualityRate),
        completionRate: await this.calculateCompletionRate(trainerId, dateRange)
      },
      clientSatisfaction: {
        repeatBookingRate,
        referralRate,
        nps: await this.calculateNPS(trainerId, dateRange)
      }
    };
  }

  // Get trend analytics
  async getTrendAnalytics(trainerId, dateRange) {
    // Compare with previous period
    const previousPeriod = {
      start: new Date(dateRange.start.getTime() - (dateRange.end - dateRange.start)),
      end: dateRange.start
    };

    const [currentMetrics, previousMetrics] = await Promise.all([
      this.getPeriodMetrics(trainerId, dateRange),
      this.getPeriodMetrics(trainerId, previousPeriod)
    ]);

    const trends = {};
    Object.keys(currentMetrics).forEach(key => {
      const current = currentMetrics[key];
      const previous = previousMetrics[key];
      
      if (previous > 0) {
        const change = ((current - previous) / previous * 100).toFixed(2);
        trends[key] = {
          current,
          previous,
          change: parseFloat(change),
          trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        };
      } else {
        trends[key] = {
          current,
          previous: 0,
          change: current > 0 ? 100 : 0,
          trend: current > 0 ? 'up' : 'stable'
        };
      }
    });

    // Seasonal patterns
    const seasonalPatterns = await this.analyzeSeasonalPatterns(trainerId);

    return {
      periodComparison: trends,
      seasonal: seasonalPatterns,
      predictions: await this.generatePredictions(trainerId, trends)
    };
  }

  // ==================== CLIENT ANALYTICS ====================

  // Get client dashboard analytics
  async getClientAnalytics(req, res) {
    try {
      const clientId = req.user.clientId;
      const { period = 'month', startDate, endDate } = req.query;

      const dateRange = this.getDateRange(period, startDate, endDate);

      const [
        workoutStats,
        progressStats,
        nutritionStats,
        goalProgress,
        consistency,
        achievements
      ] = await Promise.all([
        this.getWorkoutStats(clientId, dateRange),
        this.getProgressStats(clientId, dateRange),
        this.getNutritionStats(clientId, dateRange),
        this.getGoalProgress(clientId),
        this.getConsistencyMetrics(clientId, dateRange),
        this.getAchievementProgress(clientId)
      ]);

      res.json({
        success: true,
        data: {
          period,
          dateRange,
          workouts: workoutStats,
          progress: progressStats,
          nutrition: nutritionStats,
          goals: goalProgress,
          consistency,
          achievements
        }
      });

    } catch (error) {
      console.error('Get client analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลวิเคราะห์'
      });
    }
  }

  // Get workout statistics
  async getWorkoutStats(clientId, dateRange) {
    const workouts = await Booking.find({
      clientId,
      status: 'completed',
      completedAt: { $gte: dateRange.start, $lte: dateRange.end }
    }).populate('trainerId packageId');

    const totalWorkouts = workouts.length;
    
    // Workouts by type
    const workoutTypes = {};
    workouts.forEach(workout => {
      const type = workout.packageId?.type || 'general';
      workoutTypes[type] = (workoutTypes[type] || 0) + 1;
    });

    // Calculate total duration and calories
    const workoutPlans = await WorkoutPlan.find({
      clientId,
      'progress.completedAt': { $gte: dateRange.start, $lte: dateRange.end }
    });

    let totalDuration = 0;
    let totalCalories = 0;

    workoutPlans.forEach(plan => {
      plan.progress.forEach(entry => {
        if (entry.completedAt >= dateRange.start && entry.completedAt <= dateRange.end) {
          totalDuration += entry.duration || 0;
          totalCalories += entry.caloriesBurned || 0;
        }
      });
    });

    // Favorite exercises
    const exerciseFrequency = {};
    workoutPlans.forEach(plan => {
      plan.exercises?.forEach(exercise => {
        exerciseFrequency[exercise.name] = (exerciseFrequency[exercise.name] || 0) + 1;
      });
    });

    const topExercises = Object.entries(exerciseFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      summary: {
        total: totalWorkouts,
        duration: totalDuration,
        calories: totalCalories,
        avgDuration: totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0,
        avgCalories: totalWorkouts > 0 ? Math.round(totalCalories / totalWorkouts) : 0
      },
      byType: workoutTypes,
      topExercises,
      intensity: await this.analyzeWorkoutIntensity(clientId, dateRange)
    };
  }

  // Get progress statistics
  async getProgressStats(clientId, dateRange) {
    const progressData = await Progress.find({
      clientId,
      recordedAt: { $gte: dateRange.start, $lte: dateRange.end }
    }).sort({ recordedAt: 1 });

    if (progressData.length === 0) {
      return { noData: true };
    }

    const firstEntry = progressData[0];
    const lastEntry = progressData[progressData.length - 1];

    // Body composition changes
    const bodyComposition = {
      weight: {
        start: firstEntry.weight,
        end: lastEntry.weight,
        change: lastEntry.weight - firstEntry.weight,
        changePercent: ((lastEntry.weight - firstEntry.weight) / firstEntry.weight * 100).toFixed(2)
      },
      bodyFat: {
        start: firstEntry.bodyFat,
        end: lastEntry.bodyFat,
        change: (lastEntry.bodyFat || 0) - (firstEntry.bodyFat || 0)
      },
      muscleMass: {
        start: firstEntry.muscleMass,
        end: lastEntry.muscleMass,
        change: (lastEntry.muscleMass || 0) - (firstEntry.muscleMass || 0)
      }
    };

    // Measurement changes
    const measurements = {};
    if (firstEntry.measurements && lastEntry.measurements) {
      Object.keys(firstEntry.measurements).forEach(key => {
        if (lastEntry.measurements[key]) {
          measurements[key] = {
            start: firstEntry.measurements[key],
            end: lastEntry.measurements[key],
            change: lastEntry.measurements[key] - firstEntry.measurements[key]
          };
        }
      });
    }

    // Performance improvements
    const performanceImprovements = this.analyzePerformanceImprovements(progressData);

    return {
      bodyComposition,
      measurements,
      performance: performanceImprovements,
      wellness: this.analyzeWellnessMetrics(progressData)
    };
  }

  // Get nutrition statistics
  async getNutritionStats(clientId, dateRange) {
    const nutritionPlans = await NutritionPlan.find({
      clientId,
      isActive: true
    });

    if (nutritionPlans.length === 0) {
      return { noActivePlan: true };
    }

    const activePlan = nutritionPlans[0];
    
    // Get logs within date range
    const logs = activePlan.dailyLogs.filter(log => 
      log.date >= dateRange.start && log.date <= dateRange.end
    );

    if (logs.length === 0) {
      return { 
        plan: {
          name: activePlan.name,
          dailyCalories: activePlan.dailyCalories,
          macros: activePlan.macros
        },
        noLogs: true 
      };
    }

    // Calculate adherence
    const adherenceScores = logs.map(log => {
      const calorieAdherence = 1 - Math.abs(log.totalCalories - activePlan.dailyCalories) / activePlan.dailyCalories;
      const proteinAdherence = 1 - Math.abs(log.totalProtein - activePlan.macros.protein) / activePlan.macros.protein;
      const carbAdherence = 1 - Math.abs(log.totalCarbs - activePlan.macros.carbs) / activePlan.macros.carbs;
      const fatAdherence = 1 - Math.abs(log.totalFat - activePlan.macros.fat) / activePlan.macros.fat;
      
      return {
        date: log.date,
        overall: (calorieAdherence + proteinAdherence + carbAdherence + fatAdherence) / 4,
        calories: calorieAdherence,
        protein: proteinAdherence,
        carbs: carbAdherence,
        fat: fatAdherence
      };
    });

    const avgAdherence = adherenceScores.reduce((sum, score) => sum + score.overall, 0) / adherenceScores.length;

    // Macro averages
    const avgMacros = {
      calories: logs.reduce((sum, log) => sum + log.totalCalories, 0) / logs.length,
      protein: logs.reduce((sum, log) => sum + log.totalProtein, 0) / logs.length,
      carbs: logs.reduce((sum, log) => sum + log.totalCarbs, 0) / logs.length,
      fat: logs.reduce((sum, log) => sum + log.totalFat, 0) / logs.length
    };

    return {
      plan: {
        name: activePlan.name,
        dailyCalories: activePlan.dailyCalories,
        macros: activePlan.macros
      },
      adherence: {
        overall: (avgAdherence * 100).toFixed(2),
        byMacro: {
          calories: (adherenceScores.reduce((sum, s) => sum + s.calories, 0) / logs.length * 100).toFixed(2),
          protein: (adherenceScores.reduce((sum, s) => sum + s.protein, 0) / logs.length * 100).toFixed(2),
          carbs: (adherenceScores.reduce((sum, s) => sum + s.carbs, 0) / logs.length * 100).toFixed(2),
          fat: (adherenceScores.reduce((sum, s) => sum + s.fat, 0) / logs.length * 100).toFixed(2)
        }
      },
      averages: avgMacros,
      loggingFrequency: logs.length,
      expectedLogs: Math.floor((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24))
    };
  }

  // ==================== HELPER FUNCTIONS ====================

  // Get date range based on period
  getDateRange(period, startDate, endDate) {
    if (startDate && endDate) {
      return {
        start: new Date(startDate),
        end: new Date(endDate),
        groupFormat: '%Y-%m-%d'
      };
    }

    const end = new Date();
    let start = new Date();
    let groupFormat = '%Y-%m-%d';

    switch (period) {
      case 'week':
        start.setDate(start.getDate() - 7);
        groupFormat = '%Y-%m-%d';
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        groupFormat = '%Y-%m-%d';
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        groupFormat = '%Y-%m-%W';
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        groupFormat = '%Y-%m';
        break;
      default:
        start.setMonth(start.getMonth() - 1);
    }

    return { start, end, groupFormat };
  }

  // Calculate growth rate
  async calculateGrowthRate(trainerId, metric, dateRange) {
    const previousPeriod = {
      start: new Date(dateRange.start.getTime() - (dateRange.end - dateRange.start)),
      end: dateRange.start
    };

    let currentValue = 0;
    let previousValue = 0;

    switch (metric) {
      case 'revenue':
        const [current, previous] = await Promise.all([
          Payment.aggregate([
            {
              $match: {
                trainerId,
                status: 'completed',
                completedAt: { $gte: dateRange.start, $lte: dateRange.end }
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' }
              }
            }
          ]),
          Payment.aggregate([
            {
              $match: {
                trainerId,
                status: 'completed',
                completedAt: { $gte: previousPeriod.start, $lte: previousPeriod.end }
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' }
              }
            }
          ])
        ]);
        
        currentValue = current[0]?.total || 0;
        previousValue = previous[0]?.total || 0;
        break;
    }

    if (previousValue === 0) {
      return currentValue > 0 ? 100 : 0;
    }

    return ((currentValue - previousValue) / previousValue * 100).toFixed(2);
  }

  // Calculate utilization rate
  async calculateUtilizationRate(trainerId, dateRange) {
    const trainer = await Trainer.findById(trainerId);
    if (!trainer.workingHours) return 0;

    // Calculate available hours
    let availableHours = 0;
    const days = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < days; i++) {
      const date = new Date(dateRange.start);
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      
      const schedule = trainer.workingHours[dayOfWeek];
      if (schedule && schedule.isAvailable) {
        const start = new Date(`2000-01-01 ${schedule.startTime}`);
        const end = new Date(`2000-01-01 ${schedule.endTime}`);
        const hours = (end - start) / (1000 * 60 * 60);
        availableHours += hours;
      }
    }

    // Calculate booked hours
    const sessions = await Booking.countDocuments({
      trainerId,
      status: { $in: ['confirmed', 'completed'] },
      sessionDate: { $gte: dateRange.start, $lte: dateRange.end }
    });

    const bookedHours = sessions; // Assuming 1 hour per session

    return availableHours > 0 
      ? ((bookedHours / availableHours) * 100).toFixed(2)
      : 0;
  }

  // Get client demographics
  async getClientDemographics(trainerId) {
    const clients = await Booking.distinct('clientId', {
      trainerId,
      status: { $in: ['confirmed', 'completed'] }
    });

    const clientData = await Client.find({ _id: { $in: clients } })
      .populate('userId', 'gender dateOfBirth');

    const demographics = {
      gender: {},
      ageGroups: {},
      fitnessLevel: {},
      goals: {}
    };

    clientData.forEach(client => {
      // Gender
      const gender = client.userId.gender || 'unspecified';
      demographics.gender[gender] = (demographics.gender[gender] || 0) + 1;

      // Age groups
      if (client.userId.dateOfBirth) {
        const age = Math.floor((new Date() - client.userId.dateOfBirth) / (1000 * 60 * 60 * 24 * 365));
        let ageGroup;
        if (age < 25) ageGroup = '18-24';
        else if (age < 35) ageGroup = '25-34';
        else if (age < 45) ageGroup = '35-44';
        else if (age < 55) ageGroup = '45-54';
        else ageGroup = '55+';
        
        demographics.ageGroups[ageGroup] = (demographics.ageGroups[ageGroup] || 0) + 1;
      }

      // Fitness level
      const level = client.fitnessLevel || 'beginner';
      demographics.fitnessLevel[level] = (demographics.fitnessLevel[level] || 0) + 1;

      // Goals
      client.goals?.forEach(goal => {
        demographics.goals[goal] = (demographics.goals[goal] || 0) + 1;
      });
    });

    return demographics;
  }

  // Identify churn risk
  async identifyChurnRisk(trainerId, activeClients) {
    const churnRiskClients = [];

    for (const clientId of activeClients) {
      const lastSession = await Booking.findOne({
        trainerId,
        clientId,
        status: 'completed'
      }).sort({ completedAt: -1 });

      if (lastSession) {
        const daysSinceLastSession = Math.floor(
          (new Date() - lastSession.completedAt) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastSession > 14) {
          const client = await Client.findById(clientId)
            .populate('userId', 'firstName lastName');

          churnRiskClients.push({
            clientId,
            name: `${client.userId.firstName} ${client.userId.lastName}`,
            daysSinceLastSession,
            riskLevel: daysSinceLastSession > 30 ? 'high' : 'medium'
          });
        }
      }
    }

    return churnRiskClients.sort((a, b) => b.daysSinceLastSession - a.daysSinceLastSession);
  }

  // Get period metrics
  async getPeriodMetrics(trainerId, period) {
    const [revenue, bookings, clients, avgRating] = await Promise.all([
      // Revenue
      Payment.aggregate([
        {
          $match: {
            trainerId,
            status: 'completed',
            completedAt: { $gte: period.start, $lte: period.end }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),

      // Bookings
      Booking.countDocuments({
        trainerId,
        status: 'completed',
        completedAt: { $gte: period.start, $lte: period.end }
      }),

      // Unique clients
      Booking.distinct('clientId', {
        trainerId,
        status: { $in: ['confirmed', 'completed'] },
        sessionDate: { $gte: period.start, $lte: period.end }
      }),

      // Average rating
      Review.aggregate([
        {
          $match: {
            trainerId,
            createdAt: { $gte: period.start, $lte: period.end }
          }
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' }
          }
        }
      ])
    ]);

    return {
      revenue: revenue[0]?.total || 0,
      bookings,
      clients: clients.length,
      avgRating: avgRating[0]?.avgRating || 0
    };
  }

  // Generate predictions
  async generatePredictions(trainerId, trends) {
    // Simple linear projection based on trends
    const predictions = {};

    Object.entries(trends).forEach(([metric, data]) => {
      const growthRate = data.change / 100;
      const nextPeriodValue = data.current * (1 + growthRate);
      
      predictions[metric] = {
        nextPeriod: Math.round(nextPeriodValue),
        confidence: Math.abs(growthRate) < 0.5 ? 'high' : 'medium'
      };
    });

    return predictions;
  }

  // Calculate repeat booking rate
  async calculateRepeatBookingRate(trainerId, dateRange) {
    const clients = await Booking.distinct('clientId', {
      trainerId,
      status: { $in: ['confirmed', 'completed'] },
      sessionDate: { $gte: dateRange.start, $lte: dateRange.end }
    });

    let repeatClients = 0;

    for (const clientId of clients) {
      const bookingCount = await Booking.countDocuments({
        trainerId,
        clientId,
        status: { $in: ['confirmed', 'completed'] }
      });

      if (bookingCount > 1) {
        repeatClients++;
      }
    }

    return clients.length > 0
      ? ((repeatClients / clients.length) * 100).toFixed(2)
      : 0;
  }

  // Analyze seasonal patterns
  async analyzeSeasonalPatterns(trainerId) {
    // Get data for the past year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const monthlyData = await Booking.aggregate([
      {
        $match: {
          trainerId,
          status: 'completed',
          completedAt: { $gte: oneYearAgo }
        }
      },
      {
        $group: {
          _id: { $month: '$completedAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 
      'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
      'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    return monthlyData.map(data => ({
      month: monthNames[data._id - 1],
      bookings: data.count
    }));
  }

  // Export analytics data
  async exportAnalytics(req, res) {
    try {
      const { type, format = 'json', period = 'month' } = req.query;
      const userId = req.user.userId;
      const userRole = req.user.role;

      let data;

      if (userRole === 'trainer') {
        const dateRange = this.getDateRange(period);
        data = await this.getTrainerAnalytics(req.user.trainerId, dateRange);
      } else if (userRole === 'client') {
        const dateRange = this.getDateRange(period);
        data = await this.getClientAnalytics(req.user.clientId, dateRange);
      } else {
        return res.status(403).json({
          success: false,
          message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลวิเคราะห์'
        });
      }

      if (format === 'csv') {
        // Convert to CSV format
        const csv = this.convertAnalyticsToCSV(data, type);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-${type}-${period}.csv`);
        return res.send(csv);
      }

      res.json({
        success: true,
        data
      });

    } catch (error) {
      console.error('Export analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการส่งออกข้อมูล'
      });
    }
  }
}

module.exports = new AnalyticsController();
