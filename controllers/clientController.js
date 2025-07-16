// controllers/clientController.js
const Client = require('../models/Client');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Progress = require('../models/Progress');
const NutritionPlan = require('../models/NutritionPlan');
const WorkoutPlan = require('../models/WorkoutPlan');

class ClientController {
  // Get client profile
  async getClientProfile(req, res) {
    try {
      const clientId = req.user.clientId;

      const client = await Client.findById(clientId)
        .populate('userId', 'firstName lastName email phone profilePicture');

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบข้อมูลลูกค้า'
        });
      }

      res.json({
        success: true,
        data: client
      });

    } catch (error) {
      console.error('Get client profile error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
      });
    }
  }

  // Update client profile
  async updateClientProfile(req, res) {
    try {
      const clientId = req.user.clientId;
      const {
        goals,
        healthConditions,
        fitnessLevel,
        height,
        weight,
        targetWeight,
        medicalHistory,
        allergies,
        injuries,
        preferences
      } = req.body;

      const client = await Client.findByIdAndUpdate(
        clientId,
        {
          goals,
          healthConditions,
          fitnessLevel,
          height,
          weight,
          targetWeight,
          medicalHistory,
          allergies,
          injuries,
          preferences,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'อัพเดทข้อมูลสำเร็จ',
        data: client
      });

    } catch (error) {
      console.error('Update client profile error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล'
      });
    }
  }

  // Get client dashboard stats
  async getClientDashboard(req, res) {
    try {
      const clientId = req.user.clientId;

      // Get current month dates
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const [
        upcomingSessions,
        completedSessions,
        totalTrainers,
        latestProgress,
        activePackages,
        currentPlans
      ] = await Promise.all([
        // Upcoming sessions
        Booking.find({
          clientId,
          status: 'confirmed',
          sessionDate: { $gte: new Date() }
        })
        .sort({ sessionDate: 1 })
        .limit(5)
        .populate('trainerId', 'userId')
        .populate({
          path: 'trainerId',
          populate: {
            path: 'userId',
            select: 'firstName lastName profilePicture'
          }
        }),

        // Completed sessions this month
        Booking.countDocuments({
          clientId,
          status: 'completed',
          sessionDate: { $gte: startOfMonth, $lte: endOfMonth }
        }),

        // Total trainers worked with
        Booking.distinct('trainerId', { clientId }),

        // Latest progress
        Progress.findOne({ clientId })
          .sort({ recordedAt: -1 }),

        // Active packages
        Booking.find({
          clientId,
          status: { $in: ['confirmed', 'pending'] },
          packageEndDate: { $gte: new Date() }
        })
        .populate('packageId')
        .populate({
          path: 'trainerId',
          populate: {
            path: 'userId',
            select: 'firstName lastName'
          }
        }),

        // Current nutrition and workout plans
        Promise.all([
          NutritionPlan.findOne({ 
            clientId, 
            isActive: true 
          }),
          WorkoutPlan.findOne({ 
            clientId, 
            isActive: true 
          })
        ])
      ]);

      const client = await Client.findById(clientId);

      res.json({
        success: true,
        data: {
          overview: {
            upcomingSessionsCount: upcomingSessions.length,
            completedSessionsThisMonth: completedSessions,
            totalTrainers: totalTrainers.length,
            currentWeight: client.weight,
            targetWeight: client.targetWeight
          },
          upcomingSessions,
          latestProgress,
          activePackages,
          activePlans: {
            nutrition: currentPlans[0],
            workout: currentPlans[1]
          }
        }
      });

    } catch (error) {
      console.error('Get client dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
      });
    }
  }

  // Record health data
  async recordHealthData(req, res) {
    try {
      const clientId = req.user.clientId;
      const {
        weight,
        bodyFat,
        muscleMass,
        bloodPressure,
        heartRate,
        sleepHours,
        waterIntake,
        notes
      } = req.body;

      const healthData = await Progress.create({
        clientId,
        weight,
        bodyFat,
        muscleMass,
        bloodPressure,
        heartRate,
        sleepHours,
        waterIntake,
        notes,
        recordedAt: new Date()
      });

      // Update current weight in client profile
      if (weight) {
        await Client.findByIdAndUpdate(clientId, { 
          weight,
          lastWeightUpdate: new Date()
        });
      }

      res.json({
        success: true,
        message: 'บันทึกข้อมูลสุขภาพสำเร็จ',
        data: healthData
      });

    } catch (error) {
      console.error('Record health data error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
      });
    }
  }

  // Get progress history
  async getProgressHistory(req, res) {
    try {
      const clientId = req.user.clientId;
      const { 
        startDate, 
        endDate, 
        metric = 'all',
        page = 1, 
        limit = 30 
      } = req.query;

      let query = { clientId };

      if (startDate && endDate) {
        query.recordedAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Select specific metrics if requested
      let selectFields = '';
      if (metric !== 'all') {
        selectFields = `${metric} recordedAt`;
      }

      const progress = await Progress.find(query)
        .select(selectFields)
        .sort({ recordedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalCount = await Progress.countDocuments(query);

      // Calculate statistics
      const stats = await Progress.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            avgWeight: { $avg: '$weight' },
            minWeight: { $min: '$weight' },
            maxWeight: { $max: '$weight' },
            avgBodyFat: { $avg: '$bodyFat' },
            avgMuscleMass: { $avg: '$muscleMass' }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          progress,
          stats: stats[0] || {},
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

  // Get client's trainers
  async getClientTrainers(req, res) {
    try {
      const clientId = req.user.clientId;
      const { status = 'all' } = req.query;

      let bookingQuery = { clientId };
      
      if (status === 'active') {
        bookingQuery.$or = [
          { sessionDate: { $gte: new Date() } },
          { packageEndDate: { $gte: new Date() } }
        ];
      }

      const trainerIds = await Booking.distinct('trainerId', bookingQuery);

      const trainers = await Trainer.find({ _id: { $in: trainerIds } })
        .populate('userId', 'firstName lastName profilePicture email phone')
        .lean();

      // Add booking info for each trainer
      const trainersWithInfo = await Promise.all(
        trainers.map(async (trainer) => {
          const [totalSessions, completedSessions, nextSession, activePackage] = await Promise.all([
            Booking.countDocuments({ 
              clientId, 
              trainerId: trainer._id 
            }),
            Booking.countDocuments({ 
              clientId, 
              trainerId: trainer._id,
              status: 'completed'
            }),
            Booking.findOne({
              clientId,
              trainerId: trainer._id,
              status: 'confirmed',
              sessionDate: { $gte: new Date() }
            })
            .sort({ sessionDate: 1 })
            .select('sessionDate'),
            Booking.findOne({
              clientId,
              trainerId: trainer._id,
              packageEndDate: { $gte: new Date() }
            })
            .populate('packageId')
          ]);

          return {
            ...trainer,
            bookingInfo: {
              totalSessions,
              completedSessions,
              nextSession: nextSession?.sessionDate,
              activePackage: activePackage?.packageId
            }
          };
        })
      );

      res.json({
        success: true,
        data: trainersWithInfo
      });

    } catch (error) {
      console.error('Get client trainers error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเทรนเนอร์'
      });
    }
  }

  // Get workout plans
  async getWorkoutPlans(req, res) {
    try {
      const clientId = req.user.clientId;
      const { isActive } = req.query;

      let query = { clientId };
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const plans = await WorkoutPlan.find(query)
        .populate({
          path: 'createdBy',
          populate: {
            path: 'userId',
            select: 'firstName lastName'
          }
        })
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: plans
      });

    } catch (error) {
      console.error('Get workout plans error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแผนการออกกำลังกาย'
      });
    }
  }

  // Get nutrition plans
  async getNutritionPlans(req, res) {
    try {
      const clientId = req.user.clientId;
      const { isActive } = req.query;

      let query = { clientId };
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const plans = await NutritionPlan.find(query)
        .populate({
          path: 'createdBy',
          populate: {
            path: 'userId',
            select: 'firstName lastName'
          }
        })
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: plans
      });

    } catch (error) {
      console.error('Get nutrition plans error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแผนโภชนาการ'
      });
    }
  }

  // Get achievements
  async getAchievements(req, res) {
    try {
      const clientId = req.user.clientId;

      // Calculate various achievements
      const [
        totalWorkouts,
        consecutiveDays,
        weightLost,
        muscleGained,
        totalTrainers
      ] = await Promise.all([
        // Total completed workouts
        Booking.countDocuments({
          clientId,
          status: 'completed'
        }),

        // Consecutive workout days
        // This is simplified - in real app would need more complex logic
        Booking.aggregate([
          {
            $match: {
              clientId,
              status: 'completed'
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { 
                  format: '%Y-%m-%d', 
                  date: '$sessionDate' 
                }
              }
            }
          },
          { $count: 'days' }
        ]),

        // Weight loss progress
        Progress.aggregate([
          { $match: { clientId } },
          { $sort: { recordedAt: 1 } },
          {
            $group: {
              _id: null,
              firstWeight: { $first: '$weight' },
              lastWeight: { $last: '$weight' }
            }
          }
        ]),

        // Muscle gain
        Progress.aggregate([
          { $match: { clientId } },
          { $sort: { recordedAt: 1 } },
          {
            $group: {
              _id: null,
              firstMuscle: { $first: '$muscleMass' },
              lastMuscle: { $last: '$muscleMass' }
            }
          }
        ]),

        // Total trainers worked with
        Booking.distinct('trainerId', { clientId })
      ]);

      const achievements = {
        workoutWarrior: {
          name: 'นักรบการออกกำลังกาย',
          description: 'ออกกำลังกายครบ 50 ครั้ง',
          progress: totalWorkouts,
          target: 50,
          achieved: totalWorkouts >= 50,
          icon: 'trophy'
        },
        consistencyKing: {
          name: 'ราชาแห่งความสม่ำเสมอ',
          description: 'ออกกำลังกายต่อเนื่อง 30 วัน',
          progress: consecutiveDays[0]?.days || 0,
          target: 30,
          achieved: (consecutiveDays[0]?.days || 0) >= 30,
          icon: 'calendar'
        },
        weightLossHero: {
          name: 'ฮีโร่ลดน้ำหนัก',
          description: 'ลดน้ำหนักได้ 5 กิโลกรัม',
          progress: Math.abs(weightLost[0]?.firstWeight - weightLost[0]?.lastWeight || 0),
          target: 5,
          achieved: Math.abs(weightLost[0]?.firstWeight - weightLost[0]?.lastWeight || 0) >= 5,
          icon: 'scale'
        },
        muscleBuilder: {
          name: 'นักสร้างกล้ามเนื้อ',
          description: 'เพิ่มกล้ามเนื้อได้ 2 กิโลกรัม',
          progress: muscleGained[0]?.lastMuscle - muscleGained[0]?.firstMuscle || 0,
          target: 2,
          achieved: (muscleGained[0]?.lastMuscle - muscleGained[0]?.firstMuscle || 0) >= 2,
          icon: 'muscle'
        },
        socialButterfly: {
          name: 'ผีเสื้อสังคม',
          description: 'เทรนกับเทรนเนอร์ 3 คนขึ้นไป',
          progress: totalTrainers.length,
          target: 3,
          achieved: totalTrainers.length >= 3,
          icon: 'users'
        }
      };

      res.json({
        success: true,
        data: {
          achievements,
          stats: {
            totalAchievements: Object.values(achievements).filter(a => a.achieved).length,
            totalPossible: Object.keys(achievements).length
          }
        }
      });

    } catch (error) {
      console.error('Get achievements error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลความสำเร็จ'
      });
    }
  }
}

module.exports = new ClientController();
