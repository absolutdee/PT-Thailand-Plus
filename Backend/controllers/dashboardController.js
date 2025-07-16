// controllers/dashboardController.js
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Client = require('../models/Client');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Progress = require('../models/Progress');
const WorkoutPlan = require('../models/WorkoutPlan');
const NutritionPlan = require('../models/NutritionPlan');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const moment = require('moment');

class DashboardController {
  // ==================== TRAINER DASHBOARD ====================

  // Get trainer dashboard data
  async getTrainerDashboard(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { period = 'week' } = req.query;

      const dateRange = this.getDateRange(period);

      const [
        overview,
        schedule,
        revenueStats,
        clientStats,
        performanceMetrics,
        notifications,
        recentActivities
      ] = await Promise.all([
        this.getTrainerOverview(trainerId, dateRange),
        this.getTrainerSchedule(trainerId),
        this.getRevenueStats(trainerId, dateRange),
        this.getClientStats(trainerId, dateRange),
        this.getPerformanceMetrics(trainerId, dateRange),
        this.getRecentNotifications(req.user.userId),
        this.getRecentActivities(trainerId, 'trainer')
      ]);

      res.json({
        success: true,
        data: {
          overview,
          schedule,
          revenue: revenueStats,
          clients: clientStats,
          performance: performanceMetrics,
          notifications,
          recentActivities,
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      console.error('Get trainer dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด'
      });
    }
  }

  // Get trainer overview
  async getTrainerOverview(trainerId, dateRange) {
    const [
      todayBookings,
      weekBookings,
      monthRevenue,
      totalClients,
      rating,
      unreadMessages
    ] = await Promise.all([
      // Today's bookings
      Booking.countDocuments({
        trainerId,
        sessionDate: {
          $gte: moment().startOf('day').toDate(),
          $lte: moment().endOf('day').toDate()
        },
        status: 'confirmed'
      }),

      // This week's bookings
      Booking.countDocuments({
        trainerId,
        sessionDate: {
          $gte: moment().startOf('week').toDate(),
          $lte: moment().endOf('week').toDate()
        },
        status: { $in: ['confirmed', 'completed'] }
      }),

      // This month's revenue
      Payment.aggregate([
        {
          $match: {
            trainerId,
            status: 'completed',
            completedAt: {
              $gte: moment().startOf('month').toDate(),
              $lte: moment().endOf('month').toDate()
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            earnings: { $sum: { $multiply: ['$amount', 0.8] } }
          }
        }
      ]),

      // Total active clients
      Booking.distinct('clientId', {
        trainerId,
        status: { $in: ['confirmed', 'completed'] },
        sessionDate: { $gte: moment().subtract(30, 'days').toDate() }
      }),

      // Trainer rating
      Trainer.findById(trainerId).select('rating totalReviews'),

      // Unread messages
      Chat.aggregate([
        { $match: { participants: trainerId } },
        {
          $lookup: {
            from: 'messages',
            let: { chatId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$chatId', '$$chatId'] },
                      { $ne: ['$sender', trainerId] },
                      { $not: { $in: [trainerId, '$readBy'] } }
                    ]
                  }
                }
              }
            ],
            as: 'unreadMessages'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $size: '$unreadMessages' } }
          }
        }
      ])
    ]);

    return {
      todaySchedule: todayBookings,
      weeklyBookings: weekBookings,
      monthlyRevenue: monthRevenue[0]?.total || 0,
      monthlyEarnings: monthRevenue[0]?.earnings || 0,
      activeClients: totalClients.length,
      rating: rating?.rating || 0,
      totalReviews: rating?.totalReviews || 0,
      unreadMessages: unreadMessages[0]?.total || 0
    };
  }

  // Get trainer schedule
  async getTrainerSchedule(trainerId) {
    const today = moment().startOf('day');
    const endOfWeek = moment().endOf('week');

    const bookings = await Booking.find({
      trainerId,
      sessionDate: {
        $gte: today.toDate(),
        $lte: endOfWeek.toDate()
      },
      status: { $in: ['confirmed', 'pending'] }
    })
      .populate({
        path: 'clientId',
        populate: {
          path: 'userId',
          select: 'firstName lastName profilePicture'
        }
      })
      .populate('packageId', 'name type')
      .sort({ sessionDate: 1 })
      .limit(10);

    // Group by day
    const schedule = {};
    bookings.forEach(booking => {
      const day = moment(booking.sessionDate).format('YYYY-MM-DD');
      if (!schedule[day]) {
        schedule[day] = [];
      }
      schedule[day].push({
        id: booking._id,
        time: moment(booking.sessionDate).format('HH:mm'),
        client: {
          id: booking.clientId._id,
          name: `${booking.clientId.userId.firstName} ${booking.clientId.userId.lastName}`,
          profilePicture: booking.clientId.userId.profilePicture
        },
        package: booking.packageId.name,
        status: booking.status,
        location: booking.location
      });
    });

    return {
      upcoming: bookings.slice(0, 5),
      byDay: schedule
    };
  }

  // Get revenue statistics
  async getRevenueStats(trainerId, dateRange) {
    // Revenue trend
    const revenueTrend = await Payment.aggregate([
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
    const packageRevenue = await Payment.aggregate([
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
          _id: '$package.name',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // Compare with previous period
    const previousRange = this.getPreviousDateRange(dateRange);
    const [currentTotal, previousTotal] = await Promise.all([
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
            completedAt: { $gte: previousRange.start, $lte: previousRange.end }
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

    const currentRevenue = currentTotal[0]?.total || 0;
    const previousRevenue = previousTotal[0]?.total || 0;
    const growth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(2)
      : 0;

    return {
      total: currentRevenue,
      earnings: currentRevenue * 0.8,
      growth: parseFloat(growth),
      trend: revenueTrend,
      byPackage: packageRevenue
    };
  }

  // Get client statistics
  async getClientStats(trainerId, dateRange) {
    // Active clients
    const activeClients = await Booking.aggregate([
      {
        $match: {
          trainerId,
          status: { $in: ['confirmed', 'completed'] },
          sessionDate: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: '$clientId',
          sessionCount: { $sum: 1 },
          lastSession: { $max: '$sessionDate' }
        }
      },
      {
        $lookup: {
          from: 'clients',
          localField: '_id',
          foreignField: '_id',
          as: 'client'
        }
      },
      { $unwind: '$client' },
      {
        $lookup: {
          from: 'users',
          localField: 'client.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          profilePicture: '$user.profilePicture',
          sessionCount: 1,
          lastSession: 1,
          goals: '$client.goals'
        }
      },
      { $sort: { sessionCount: -1 } },
      { $limit: 10 }
    ]);

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
    const retentionData = await this.calculateClientRetention(trainerId, dateRange);

    // At-risk clients (no booking in last 2 weeks)
    const twoWeeksAgo = moment().subtract(2, 'weeks').toDate();
    const atRiskClients = await Booking.aggregate([
      {
        $match: {
          trainerId,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$clientId',
          lastSession: { $max: '$sessionDate' },
          totalSessions: { $sum: 1 }
        }
      },
      {
        $match: {
          lastSession: { $lt: twoWeeksAgo },
          totalSessions: { $gte: 3 } // Only consider regular clients
        }
      },
      {
        $lookup: {
          from: 'clients',
          localField: '_id',
          foreignField: '_id',
          as: 'client'
        }
      },
      { $unwind: '$client' },
      {
        $lookup: {
          from: 'users',
          localField: 'client.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          daysSinceLastSession: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$lastSession'] },
                1000 * 60 * 60 * 24
              ]
            }
          },
          totalSessions: 1
        }
      },
      { $sort: { daysSinceLastSession: -1 } },
      { $limit: 5 }
    ]);

    return {
      active: activeClients.length,
      new: newClients.length,
      retention: retentionData,
      topClients: activeClients.slice(0, 5),
      atRisk: atRiskClients
    };
  }

  // Get performance metrics
  async getPerformanceMetrics(trainerId, dateRange) {
    // Session completion rate
    const [completed, cancelled] = await Promise.all([
      Booking.countDocuments({
        trainerId,
        status: 'completed',
        sessionDate: { $gte: dateRange.start, $lte: dateRange.end }
      }),
      Booking.countDocuments({
        trainerId,
        status: 'cancelled',
        sessionDate: { $gte: dateRange.start, $lte: dateRange.end }
      })
    ]);

    const total = completed + cancelled;
    const completionRate = total > 0 ? (completed / total * 100).toFixed(2) : 100;

    // Average response time
    const responseTime = await this.calculateAverageResponseTime(trainerId, dateRange);

    // Review scores
    const reviews = await Review.find({
      trainerId,
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Booking conversion rate
    const [inquiries, confirmed] = await Promise.all([
      Booking.countDocuments({
        trainerId,
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      }),
      Booking.countDocuments({
        trainerId,
        status: { $in: ['confirmed', 'completed'] },
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      })
    ]);

    const conversionRate = inquiries > 0 ? (confirmed / inquiries * 100).toFixed(2) : 0;

    // Utilization rate
    const utilizationRate = await this.calculateUtilizationRate(trainerId, dateRange);

    return {
      completionRate: parseFloat(completionRate),
      responseTime,
      avgRating: avgRating.toFixed(1),
      reviewCount: reviews.length,
      conversionRate: parseFloat(conversionRate),
      utilizationRate
    };
  }

  // ==================== CLIENT DASHBOARD ====================

  // Get client dashboard data
  async getClientDashboard(req, res) {
    try {
      const clientId = req.user.clientId;
      const { period = 'month' } = req.query;

      const dateRange = this.getDateRange(period);

      const [
        overview,
        upcomingSessions,
        progressSummary,
        workoutStats,
        nutritionSummary,
        achievements,
        recommendations
      ] = await Promise.all([
        this.getClientOverview(clientId, dateRange),
        this.getUpcomingSessions(clientId),
        this.getProgressSummary(clientId, dateRange),
        this.getWorkoutStats(clientId, dateRange),
        this.getNutritionSummary(clientId, dateRange),
        this.getRecentAchievements(clientId),
        this.getPersonalizedRecommendations(clientId)
      ]);

      res.json({
        success: true,
        data: {
          overview,
          upcomingSessions,
          progress: progressSummary,
          workouts: workoutStats,
          nutrition: nutritionSummary,
          achievements,
          recommendations,
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      console.error('Get client dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด'
      });
    }
  }

  // Get client overview
  async getClientOverview(clientId, dateRange) {
    const client = await Client.findById(clientId);
    
    const [
      completedWorkouts,
      upcomingBookings,
      currentStreak,
      progressEntry,
      activeTrainers
    ] = await Promise.all([
      // Completed workouts this period
      Booking.countDocuments({
        clientId,
        status: 'completed',
        completedAt: { $gte: dateRange.start, $lte: dateRange.end }
      }),

      // Upcoming bookings
      Booking.countDocuments({
        clientId,
        status: 'confirmed',
        sessionDate: { $gte: new Date() }
      }),

      // Current workout streak
      this.calculateWorkoutStreak(clientId),

      // Latest progress entry
      Progress.findOne({ clientId }).sort({ recordedAt: -1 }),

      // Active trainers
      Booking.distinct('trainerId', {
        clientId,
        status: { $in: ['confirmed', 'completed'] },
        sessionDate: { $gte: moment().subtract(30, 'days').toDate() }
      })
    ]);

    // Calculate progress towards goals
    let weightProgress = null;
    if (client.targetWeight && progressEntry) {
      const startWeight = client.initialWeight || progressEntry.weight;
      const currentWeight = progressEntry.weight;
      const targetWeight = client.targetWeight;
      
      const totalChange = Math.abs(targetWeight - startWeight);
      const currentChange = Math.abs(currentWeight - startWeight);
      
      weightProgress = {
        current: currentWeight,
        target: targetWeight,
        progress: totalChange > 0 ? (currentChange / totalChange * 100).toFixed(2) : 0
      };
    }

    return {
      completedWorkouts,
      upcomingBookings,
      currentStreak,
      activeTrainers: activeTrainers.length,
      goals: client.goals,
      weightProgress,
      lastWeightUpdate: progressEntry?.recordedAt
    };
  }

  // Get upcoming sessions
  async getUpcomingSessions(clientId) {
    const sessions = await Booking.find({
      clientId,
      status: 'confirmed',
      sessionDate: { $gte: new Date() }
    })
      .populate({
        path: 'trainerId',
        populate: {
          path: 'userId',
          select: 'firstName lastName profilePicture'
        }
      })
      .populate('packageId', 'name type')
      .sort({ sessionDate: 1 })
      .limit(5);

    return sessions.map(session => ({
      id: session._id,
      date: session.sessionDate,
      time: moment(session.sessionDate).format('HH:mm'),
      trainer: {
        id: session.trainerId._id,
        name: `${session.trainerId.userId.firstName} ${session.trainerId.userId.lastName}`,
        profilePicture: session.trainerId.userId.profilePicture
      },
      package: session.packageId.name,
      location: session.location,
      daysUntil: moment(session.sessionDate).diff(moment(), 'days')
    }));
  }

  // Get progress summary
  async getProgressSummary(clientId, dateRange) {
    const progressEntries = await Progress.find({
      clientId,
      recordedAt: { $gte: dateRange.start, $lte: dateRange.end }
    }).sort({ recordedAt: 1 });

    if (progressEntries.length === 0) {
      return { noData: true };
    }

    const first = progressEntries[0];
    const last = progressEntries[progressEntries.length - 1];

    // Calculate changes
    const changes = {
      weight: {
        start: first.weight,
        current: last.weight,
        change: last.weight - first.weight,
        trend: this.calculateTrend(progressEntries.map(p => p.weight))
      }
    };

    if (first.bodyFat && last.bodyFat) {
      changes.bodyFat = {
        start: first.bodyFat,
        current: last.bodyFat,
        change: last.bodyFat - first.bodyFat
      };
    }

    if (first.muscleMass && last.muscleMass) {
      changes.muscleMass = {
        start: first.muscleMass,
        current: last.muscleMass,
        change: last.muscleMass - first.muscleMass
      };
    }

    // Progress chart data
    const chartData = progressEntries.map(entry => ({
      date: entry.recordedAt,
      weight: entry.weight,
      bodyFat: entry.bodyFat,
      muscleMass: entry.muscleMass
    }));

    return {
      changes,
      chartData,
      entriesCount: progressEntries.length
    };
  }

  // Get workout statistics
  async getWorkoutStats(clientId, dateRange) {
    const workouts = await Booking.find({
      clientId,
      status: 'completed',
      completedAt: { $gte: dateRange.start, $lte: dateRange.end }
    }).populate('packageId');

    // Group by type
    const byType = {};
    workouts.forEach(workout => {
      const type = workout.packageId?.type || 'general';
      byType[type] = (byType[type] || 0) + 1;
    });

    // Calculate consistency
    const totalDays = moment(dateRange.end).diff(moment(dateRange.start), 'days') + 1;
    const workoutDays = new Set(
      workouts.map(w => moment(w.sessionDate).format('YYYY-MM-DD'))
    ).size;
    const consistency = (workoutDays / totalDays * 100).toFixed(2);

    // Get workout plan progress
    const activePlans = await WorkoutPlan.find({
      clientId,
      isActive: true
    });

    const planProgress = activePlans.map(plan => ({
      name: plan.name,
      totalCompleted: plan.totalCompleted || 0,
      frequency: plan.frequency,
      adherence: plan.progress.filter(p => 
        p.completedAt >= dateRange.start && p.completedAt <= dateRange.end
      ).length
    }));

    return {
      total: workouts.length,
      byType,
      consistency: parseFloat(consistency),
      planProgress,
      avgPerWeek: (workouts.length / (totalDays / 7)).toFixed(1)
    };
  }

  // Get nutrition summary
  async getNutritionSummary(clientId, dateRange) {
    const nutritionPlan = await NutritionPlan.findOne({
      clientId,
      isActive: true
    });

    if (!nutritionPlan) {
      return { noPlan: true };
    }

    const logs = nutritionPlan.dailyLogs.filter(log =>
      log.date >= dateRange.start && log.date <= dateRange.end
    );

    if (logs.length === 0) {
      return {
        plan: {
          name: nutritionPlan.name,
          dailyCalories: nutritionPlan.dailyCalories,
          macros: nutritionPlan.macros
        },
        noLogs: true
      };
    }

    // Calculate averages and adherence
    const totals = logs.reduce((acc, log) => ({
      calories: acc.calories + log.totalCalories,
      protein: acc.protein + log.totalProtein,
      carbs: acc.carbs + log.totalCarbs,
      fat: acc.fat + log.totalFat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const averages = {
      calories: Math.round(totals.calories / logs.length),
      protein: Math.round(totals.protein / logs.length),
      carbs: Math.round(totals.carbs / logs.length),
      fat: Math.round(totals.fat / logs.length)
    };

    // Calculate adherence
    const adherenceScores = logs.map(log => {
      const calorieAdherence = 1 - Math.abs(log.totalCalories - nutritionPlan.dailyCalories) / nutritionPlan.dailyCalories;
      const proteinAdherence = 1 - Math.abs(log.totalProtein - nutritionPlan.macros.protein) / nutritionPlan.macros.protein;
      return Math.max(0, Math.min(1, (calorieAdherence + proteinAdherence) / 2));
    });

    const avgAdherence = adherenceScores.reduce((sum, score) => sum + score, 0) / logs.length;

    return {
      plan: {
        name: nutritionPlan.name,
        dailyCalories: nutritionPlan.dailyCalories,
        macros: nutritionPlan.macros
      },
      averages,
      adherence: (avgAdherence * 100).toFixed(2),
      logsCount: logs.length,
      expectedLogs: Math.floor((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24))
    };
  }

  // Get recent achievements
  async getRecentAchievements(clientId) {
    const achievements = [];

    // Check workout milestones
    const totalWorkouts = await Booking.countDocuments({
      clientId,
      status: 'completed'
    });

    const milestones = [10, 25, 50, 100, 200, 500];
    milestones.forEach(milestone => {
      if (totalWorkouts >= milestone) {
        achievements.push({
          type: 'workout_milestone',
          title: `${milestone} Workouts Completed`,
          description: `You've completed ${milestone} training sessions!`,
          icon: 'trophy',
          unlockedAt: new Date() // Would need to track actual unlock date
        });
      }
    });

    // Check streak achievements
    const streak = await this.calculateWorkoutStreak(clientId);
    const streakMilestones = [7, 14, 30, 60, 90];
    
    streakMilestones.forEach(milestone => {
      if (streak.longest >= milestone) {
        achievements.push({
          type: 'streak_milestone',
          title: `${milestone} Day Streak`,
          description: `Maintained a ${milestone} day workout streak!`,
          icon: 'fire',
          unlockedAt: new Date()
        });
      }
    });

    // Weight loss achievements
    const progressData = await Progress.find({ clientId }).sort({ recordedAt: 1 });
    if (progressData.length > 1) {
      const weightLoss = progressData[0].weight - progressData[progressData.length - 1].weight;
      const weightMilestones = [5, 10, 15, 20, 25];
      
      weightMilestones.forEach(milestone => {
        if (weightLoss >= milestone) {
          achievements.push({
            type: 'weight_milestone',
            title: `${milestone}kg Weight Loss`,
            description: `You've lost ${milestone} kilograms!`,
            icon: 'scale',
            unlockedAt: new Date()
          });
        }
      });
    }

    return achievements.slice(0, 5); // Return latest 5 achievements
  }

  // Get personalized recommendations
  async getPersonalizedRecommendations(clientId) {
    const recommendations = [];

    // Get client data
    const client = await Client.findById(clientId);
    const recentWorkouts = await Booking.find({
      clientId,
      status: 'completed',
      completedAt: { $gte: moment().subtract(14, 'days').toDate() }
    });

    // Workout frequency recommendation
    if (recentWorkouts.length < 3) {
      recommendations.push({
        type: 'workout_frequency',
        priority: 'high',
        title: 'Increase Workout Frequency',
        description: 'Try to maintain at least 3 workouts per week for optimal results',
        action: 'Book more sessions'
      });
    }

    // Progress tracking recommendation
    const lastProgress = await Progress.findOne({ clientId }).sort({ recordedAt: -1 });
    const daysSinceLastProgress = lastProgress
      ? moment().diff(moment(lastProgress.recordedAt), 'days')
      : 999;

    if (daysSinceLastProgress > 7) {
      recommendations.push({
        type: 'progress_tracking',
        priority: 'medium',
        title: 'Update Your Progress',
        description: 'Track your measurements weekly to monitor your progress',
        action: 'Record progress'
      });
    }

    // Nutrition tracking
    const nutritionPlan = await NutritionPlan.findOne({ clientId, isActive: true });
    if (nutritionPlan) {
      const recentLogs = nutritionPlan.dailyLogs.filter(log =>
        log.date >= moment().subtract(7, 'days').toDate()
      );

      if (recentLogs.length < 5) {
        recommendations.push({
          type: 'nutrition_tracking',
          priority: 'medium',
          title: 'Track Your Nutrition',
          description: 'Log your meals regularly to stay on track with your nutrition goals',
          action: 'Log meals'
        });
      }
    }

    // Trainer diversity
    const uniqueTrainers = await Booking.distinct('trainerId', {
      clientId,
      status: 'completed'
    });

    if (uniqueTrainers.length === 1) {
      recommendations.push({
        type: 'trainer_diversity',
        priority: 'low',
        title: 'Try Different Trainers',
        description: 'Working with different trainers can bring fresh perspectives and techniques',
        action: 'Explore trainers'
      });
    }

    return recommendations;
  }

  // ==================== ADMIN DASHBOARD ====================

  // Get admin dashboard data
  async getAdminDashboard(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'ไม่มีสิทธิ์เข้าถึง'
        });
      }

      const { period = 'month' } = req.query;
      const dateRange = this.getDateRange(period);

      const [
        platformStats,
        userGrowth,
        revenueMetrics,
        topPerformers,
        systemHealth,
        recentIssues
      ] = await Promise.all([
        this.getPlatformStats(dateRange),
        this.getUserGrowth(dateRange),
        this.getPlatformRevenue(dateRange),
        this.getTopPerformers(dateRange),
        this.getSystemHealth(),
        this.getRecentIssues()
      ]);

      res.json({
        success: true,
        data: {
          platform: platformStats,
          users: userGrowth,
          revenue: revenueMetrics,
          topPerformers,
          system: systemHealth,
          issues: recentIssues,
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      console.error('Get admin dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด'
      });
    }
  }

  // ==================== HELPER FUNCTIONS ====================

  // Get date range
  getDateRange(period) {
    const end = new Date();
    let start = new Date();
    let groupFormat = '%Y-%m-%d';

    switch (period) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        groupFormat = '%H:00';
        break;
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
        groupFormat = '%Y-%W';
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        groupFormat = '%Y-%m';
        break;
    }

    return { start, end, groupFormat };
  }

  // Get previous date range
  getPreviousDateRange(currentRange) {
    const duration = currentRange.end - currentRange.start;
    return {
      start: new Date(currentRange.start - duration),
      end: new Date(currentRange.start)
    };
  }

  // Calculate trend
  calculateTrend(values) {
    if (values.length < 2) return 'stable';

    const validValues = values.filter(v => v != null);
    const firstHalf = validValues.slice(0, Math.floor(validValues.length / 2));
    const secondHalf = validValues.slice(Math.floor(validValues.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  // Calculate workout streak
  async calculateWorkoutStreak(clientId) {
    const workouts = await Booking.find({
      clientId,
      status: 'completed'
    }).sort({ sessionDate: -1 });

    if (workouts.length === 0) {
      return { current: 0, longest: 0 };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    let lastDate = workouts[0].sessionDate;

    // Check if current streak is active
    const daysSinceLastWorkout = moment().diff(moment(lastDate), 'days');
    if (daysSinceLastWorkout <= 2) {
      currentStreak = 1;
    }

    for (let i = 1; i < workouts.length; i++) {
      const daysDiff = moment(lastDate).diff(moment(workouts[i].sessionDate), 'days');
      
      if (daysDiff <= 2) { // Allow 1 day gap
        tempStreak++;
        if (currentStreak > 0) {
          currentStreak = tempStreak;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
        if (currentStreak > 0) {
          currentStreak = 0; // Streak broken
        }
      }
      
      lastDate = workouts[i].sessionDate;
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    return { current: currentStreak, longest: longestStreak };
  }

  // Calculate average response time
  async calculateAverageResponseTime(trainerId, dateRange) {
    const messages = await Message.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $lookup: {
          from: 'chats',
          localField: 'chatId',
          foreignField: '_id',
          as: 'chat'
        }
      },
      { $unwind: '$chat' },
      {
        $match: {
          'chat.participants': trainerId,
          sender: { $ne: trainerId }
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
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    if (messages.length > 0 && messages[0].avgResponseTime) {
      // Convert to hours
      return Math.round(messages[0].avgResponseTime / (1000 * 60 * 60));
    }

    return null;
  }

  // Calculate utilization rate
  async calculateUtilizationRate(trainerId, dateRange) {
    const trainer = await Trainer.findById(trainerId);
    if (!trainer.workingHours) return 0;

    let totalAvailableHours = 0;
    let currentDate = new Date(dateRange.start);

    while (currentDate <= dateRange.end) {
      const dayOfWeek = currentDate.getDay();
      const workingHours = trainer.workingHours[dayOfWeek];
      
      if (workingHours && workingHours.isAvailable) {
        const [startHour, startMin] = workingHours.startTime.split(':').map(Number);
        const [endHour, endMin] = workingHours.endTime.split(':').map(Number);
        const hours = (endHour + endMin / 60) - (startHour + startMin / 60);
        totalAvailableHours += hours;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const bookings = await Booking.countDocuments({
      trainerId,
      sessionDate: { $gte: dateRange.start, $lte: dateRange.end },
      status: { $in: ['confirmed', 'completed'] }
    });

    const bookedHours = bookings; // Assuming 1 hour per session
    
    return totalAvailableHours > 0
      ? Math.round((bookedHours / totalAvailableHours) * 100)
      : 0;
  }

  // Calculate client retention
  async calculateClientRetention(trainerId, dateRange) {
    const previousRange = this.getPreviousDateRange(dateRange);

    const [previousClients, currentClients] = await Promise.all([
      Booking.distinct('clientId', {
        trainerId,
        status: { $in: ['confirmed', 'completed'] },
        sessionDate: { $gte: previousRange.start, $lte: previousRange.end }
      }),
      Booking.distinct('clientId', {
        trainerId,
        status: { $in: ['confirmed', 'completed'] },
        sessionDate: { $gte: dateRange.start, $lte: dateRange.end }
      })
    ]);

    const retainedClients = currentClients.filter(clientId =>
      previousClients.includes(clientId.toString())
    );

    const retentionRate = previousClients.length > 0
      ? (retainedClients.length / previousClients.length * 100).toFixed(2)
      : 0;

    return {
      rate: parseFloat(retentionRate),
      retained: retainedClients.length,
      lost: previousClients.length - retainedClients.length,
      new: currentClients.length - retainedClients.length
    };
  }

  // Get recent notifications
  async getRecentNotifications(userId) {
    const notifications = await Notification.find({
      userId,
      isRead: false
    })
      .sort({ createdAt: -1 })
      .limit(5);

    return notifications.map(n => ({
      id: n._id,
      title: n.title,
      message: n.message,
      type: n.type,
      createdAt: n.createdAt
    }));
  }

  // Get recent activities
  async getRecentActivities(entityId, entityType) {
    const activities = [];

    if (entityType === 'trainer') {
      // Recent bookings
      const recentBookings = await Booking.find({
        trainerId: entityId,
        createdAt: { $gte: moment().subtract(7, 'days').toDate() }
      })
        .populate('clientId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(5);

      recentBookings.forEach(booking => {
        activities.push({
          type: 'new_booking',
          message: `New booking from client`,
          timestamp: booking.createdAt
        });
      });

      // Recent reviews
      const recentReviews = await Review.find({
        trainerId: entityId,
        createdAt: { $gte: moment().subtract(7, 'days').toDate() }
      })
        .sort({ createdAt: -1 })
        .limit(3);

      recentReviews.forEach(review => {
        activities.push({
          type: 'new_review',
          message: `New ${review.rating}-star review`,
          timestamp: review.createdAt
        });
      });
    }

    // Sort by timestamp
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    return activities.slice(0, 10);
  }

  // Platform statistics (Admin)
  async getPlatformStats(dateRange) {
    const [
      totalUsers,
      activeUsers,
      totalBookings,
      completedBookings,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      
      User.countDocuments({
        role: { $ne: 'admin' },
        lastLogin: { $gte: dateRange.start }
      }),
      
      Booking.countDocuments({
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      }),
      
      Booking.countDocuments({
        status: 'completed',
        completedAt: { $gte: dateRange.start, $lte: dateRange.end }
      }),
      
      Payment.aggregate([
        {
          $match: {
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
      ])
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        activeRate: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(2) : 0
      },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        completionRate: totalBookings > 0 ? (completedBookings / totalBookings * 100).toFixed(2) : 100
      },
      revenue: totalRevenue[0]?.total || 0
    };
  }

  // User growth metrics (Admin)
  async getUserGrowth(dateRange) {
    const newUsers = await User.aggregate([
      {
        $match: {
          role: { $ne: 'admin' },
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateRange.groupFormat,
              date: '$createdAt'
            }
          },
          trainers: {
            $sum: { $cond: [{ $eq: ['$role', 'trainer'] }, 1, 0] }
          },
          clients: {
            $sum: { $cond: [{ $eq: ['$role', 'client'] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalByRole = await User.aggregate([
      {
        $match: { role: { $ne: 'admin' } }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      trend: newUsers,
      total: totalByRole,
      newThisPeriod: newUsers.reduce((sum, day) => sum + day.total, 0)
    };
  }

  // Platform revenue metrics (Admin)
  async getPlatformRevenue(dateRange) {
    const revenue = await Payment.aggregate([
      {
        $match: {
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
          platformFees: { $sum: { $multiply: ['$amount', 0.2] } },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totals = revenue.reduce((acc, day) => ({
      revenue: acc.revenue + day.revenue,
      fees: acc.fees + day.platformFees,
      transactions: acc.transactions + day.transactions
    }), { revenue: 0, fees: 0, transactions: 0 });

    return {
      trend: revenue,
      totals,
      avgTransaction: totals.transactions > 0 ? (totals.revenue / totals.transactions) : 0
    };
  }

  // Top performers (Admin)
  async getTopPerformers(dateRange) {
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
      { $limit: 5 },
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
      { $unwind: '$user' },
      {
        $project: {
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          revenue: 1,
          sessions: 1,
          rating: '$trainer.rating'
        }
      }
    ]);

    return topTrainers;
  }

  // System health metrics (Admin)
  async getSystemHealth() {
    // This would integrate with monitoring tools
    return {
      status: 'healthy',
      uptime: '99.9%',
      responseTime: '250ms',
      errorRate: '0.1%',
      activeConnections: 1250
    };
  }

  // Recent issues (Admin)
  async getRecentIssues() {
    // Get flagged reviews
    const flaggedReviews = await Review.countDocuments({ isFlagged: true });

    // Get cancelled bookings
    const cancelledBookings = await Booking.countDocuments({
      status: 'cancelled',
      cancelledAt: { $gte: moment().subtract(7, 'days').toDate() }
    });

    // Get failed payments
    const failedPayments = await Payment.countDocuments({
      status: 'failed',
      createdAt: { $gte: moment().subtract(7, 'days').toDate() }
    });

    return {
      flaggedReviews,
      cancelledBookings,
      failedPayments,
      total: flaggedReviews + cancelledBookings + failedPayments
    };
  }
}

module.exports = new DashboardController();
