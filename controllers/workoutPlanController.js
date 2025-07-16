// controllers/workoutPlanController.js
const WorkoutPlan = require('../models/WorkoutPlan');
const Client = require('../models/Client');
const Trainer = require('../models/Trainer');
const { sendNotification } = require('../utils/notification');

class WorkoutPlanController {
  // Create workout plan
  async createWorkoutPlan(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const {
        clientId,
        name,
        description,
        goal,
        duration,
        frequency,
        difficulty,
        exercises,
        notes
      } = req.body;

      // Verify trainer has access to client
      const booking = await Booking.findOne({
        trainerId,
        clientId,
        status: { $in: ['confirmed', 'completed'] }
      });

      if (!booking) {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์สร้างแผนการออกกำลังกายให้ลูกค้ารายนี้'
        });
      }

      // Deactivate previous active plans
      await WorkoutPlan.updateMany(
        { clientId, isActive: true },
        { isActive: false }
      );

      // Create new workout plan
      const workoutPlan = await WorkoutPlan.create({
        clientId,
        createdBy: trainerId,
        name,
        description,
        goal,
        duration,
        frequency,
        difficulty,
        exercises,
        notes,
        isActive: true
      });

      // Populate trainer info
      await workoutPlan.populate({
        path: 'createdBy',
        populate: {
          path: 'userId',
          select: 'firstName lastName'
        }
      });

      // Send notification to client
      const client = await Client.findById(clientId)
        .populate('userId', 'firstName');
      
      await sendNotification({
        userId: client.userId._id,
        title: 'แผนการออกกำลังกายใหม่',
        message: 'เทรนเนอร์ของคุณได้สร้างแผนการออกกำลังกายใหม่ให้คุณ',
        type: 'new_workout_plan',
        relatedId: workoutPlan._id
      });

      res.status(201).json({
        success: true,
        message: 'สร้างแผนการออกกำลังกายสำเร็จ',
        data: workoutPlan
      });

    } catch (error) {
      console.error('Create workout plan error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างแผนการออกกำลังกาย'
      });
    }
  }

  // Get workout plans
  async getWorkoutPlans(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { clientId, isActive, page = 1, limit = 10 } = req.query;

      let query = {};

      if (userRole === 'trainer') {
        query.createdBy = req.user.trainerId;
        if (clientId) {
          query.clientId = clientId;
        }
      } else if (userRole === 'client') {
        query.clientId = req.user.clientId;
      }

      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const workoutPlans = await WorkoutPlan.find(query)
        .populate([
          {
            path: 'clientId',
            populate: {
              path: 'userId',
              select: 'firstName lastName'
            }
          },
          {
            path: 'createdBy',
            populate: {
              path: 'userId',
              select: 'firstName lastName profilePicture'
            }
          }
        ])
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalCount = await WorkoutPlan.countDocuments(query);

      res.json({
        success: true,
        data: {
          workoutPlans,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Get workout plans error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแผนการออกกำลังกาย'
      });
    }
  }

  // Get workout plan by ID
  async getWorkoutPlanById(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.user.role;

      const workoutPlan = await WorkoutPlan.findById(id)
        .populate([
          {
            path: 'clientId',
            populate: {
              path: 'userId',
              select: 'firstName lastName profilePicture'
            }
          },
          {
            path: 'createdBy',
            populate: {
              path: 'userId',
              select: 'firstName lastName profilePicture'
            }
          },
          'progress'
        ]);

      if (!workoutPlan) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแผนการออกกำลังกาย'
        });
      }

      // Check authorization
      const isAuthorized = 
        (userRole === 'trainer' && workoutPlan.createdBy._id.toString() === req.user.trainerId) ||
        (userRole === 'client' && workoutPlan.clientId._id.toString() === req.user.clientId) ||
        userRole === 'admin';

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์ดูแผนการออกกำลังกายนี้'
        });
      }

      res.json({
        success: true,
        data: workoutPlan
      });

    } catch (error) {
      console.error('Get workout plan by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแผนการออกกำลังกาย'
      });
    }
  }

  // Update workout plan
  async updateWorkoutPlan(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { id } = req.params;
      const updates = req.body;

      const workoutPlan = await WorkoutPlan.findOne({
        _id: id,
        createdBy: trainerId
      });

      if (!workoutPlan) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแผนการออกกำลังกายหรือคุณไม่มีสิทธิ์แก้ไข'
        });
      }

      // Update workout plan
      Object.assign(workoutPlan, updates);
      workoutPlan.updatedAt = new Date();
      await workoutPlan.save();

      // Notify client about update
      await sendNotification({
        userId: workoutPlan.clientId.userId,
        title: 'แผนการออกกำลังกายได้รับการอัพเดท',
        message: 'เทรนเนอร์ของคุณได้อัพเดทแผนการออกกำลังกาย',
        type: 'workout_plan_updated',
        relatedId: workoutPlan._id
      });

      res.json({
        success: true,
        message: 'อัพเดทแผนการออกกำลังกายสำเร็จ',
        data: workoutPlan
      });

    } catch (error) {
      console.error('Update workout plan error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทแผนการออกกำลังกาย'
      });
    }
  }

  // Delete workout plan
  async deleteWorkoutPlan(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { id } = req.params;

      const workoutPlan = await WorkoutPlan.findOneAndDelete({
        _id: id,
        createdBy: trainerId
      });

      if (!workoutPlan) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแผนการออกกำลังกายหรือคุณไม่มีสิทธิ์ลบ'
        });
      }

      res.json({
        success: true,
        message: 'ลบแผนการออกกำลังกายสำเร็จ'
      });

    } catch (error) {
      console.error('Delete workout plan error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบแผนการออกกำลังกาย'
      });
    }
  }

  // Log workout completion
  async logWorkoutCompletion(req, res) {
    try {
      const clientId = req.user.clientId;
      const { id } = req.params;
      const {
        exercisesCompleted,
        duration,
        caloriesBurned,
        heartRate,
        notes,
        difficulty
      } = req.body;

      const workoutPlan = await WorkoutPlan.findOne({
        _id: id,
        clientId
      });

      if (!workoutPlan) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแผนการออกกำลังกายหรือคุณไม่มีสิทธิ์'
        });
      }

      // Add to progress
      const progressEntry = {
        completedAt: new Date(),
        exercisesCompleted,
        duration,
        caloriesBurned,
        heartRate,
        notes,
        difficulty
      };

      workoutPlan.progress.push(progressEntry);
      workoutPlan.totalCompleted = (workoutPlan.totalCompleted || 0) + 1;
      await workoutPlan.save();

      // Update client stats
      await Client.findByIdAndUpdate(clientId, {
        $inc: {
          totalWorkouts: 1,
          totalCaloriesBurned: caloriesBurned || 0
        }
      });

      res.json({
        success: true,
        message: 'บันทึกการออกกำลังกายสำเร็จ',
        data: progressEntry
      });

    } catch (error) {
      console.error('Log workout completion error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการบันทึกการออกกำลังกาย'
      });
    }
  }

  // Get workout progress
  async getWorkoutProgress(req, res) {
    try {
      const clientId = req.user.clientId;
      const { planId, startDate, endDate } = req.query;

      let query = { clientId };
      if (planId) {
        query._id = planId;
      }

      const workoutPlans = await WorkoutPlan.find(query)
        .select('name progress totalCompleted createdAt')
        .lean();

      // Filter progress by date if provided
      if (startDate && endDate) {
        workoutPlans.forEach(plan => {
          plan.progress = plan.progress.filter(p => 
            p.completedAt >= new Date(startDate) && 
            p.completedAt <= new Date(endDate)
          );
        });
      }

      // Calculate statistics
      const stats = workoutPlans.reduce((acc, plan) => {
        const planStats = plan.progress.reduce((pAcc, p) => ({
          totalDuration: pAcc.totalDuration + (p.duration || 0),
          totalCalories: pAcc.totalCalories + (p.caloriesBurned || 0),
          totalWorkouts: pAcc.totalWorkouts + 1
        }), { totalDuration: 0, totalCalories: 0, totalWorkouts: 0 });

        return {
          totalDuration: acc.totalDuration + planStats.totalDuration,
          totalCalories: acc.totalCalories + planStats.totalCalories,
          totalWorkouts: acc.totalWorkouts + planStats.totalWorkouts,
          plans: acc.plans + 1
        };
      }, { totalDuration: 0, totalCalories: 0, totalWorkouts: 0, plans: 0 });

      res.json({
        success: true,
        data: {
          plans: workoutPlans,
          statistics: {
            ...stats,
            avgDuration: stats.totalWorkouts > 0 ? Math.round(stats.totalDuration / stats.totalWorkouts) : 0,
            avgCalories: stats.totalWorkouts > 0 ? Math.round(stats.totalCalories / stats.totalWorkouts) : 0
          }
        }
      });

    } catch (error) {
      console.error('Get workout progress error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลความก้าวหน้า'
      });
    }
  }

  // Copy workout plan to another client
  async copyWorkoutPlan(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { id } = req.params;
      const { targetClientId } = req.body;

      // Get original plan
      const originalPlan = await WorkoutPlan.findOne({
        _id: id,
        createdBy: trainerId
      });

      if (!originalPlan) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแผนการออกกำลังกายหรือคุณไม่มีสิทธิ์'
        });
      }

      // Verify trainer has access to target client
      const booking = await Booking.findOne({
        trainerId,
        clientId: targetClientId,
        status: { $in: ['confirmed', 'completed'] }
      });

      if (!booking) {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์สร้างแผนให้ลูกค้ารายนี้'
        });
      }

      // Create copy
      const copiedPlan = await WorkoutPlan.create({
        clientId: targetClientId,
        createdBy: trainerId,
        name: `${originalPlan.name} (คัดลอก)`,
        description: originalPlan.description,
        goal: originalPlan.goal,
        duration: originalPlan.duration,
        frequency: originalPlan.frequency,
        difficulty: originalPlan.difficulty,
        exercises: originalPlan.exercises,
        notes: originalPlan.notes,
        isActive: true
      });

      res.status(201).json({
        success: true,
        message: 'คัดลอกแผนการออกกำลังกายสำเร็จ',
        data: copiedPlan
      });

    } catch (error) {
      console.error('Copy workout plan error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการคัดลอกแผนการออกกำลังกาย'
      });
    }
  }

  // Get exercise library
  async getExerciseLibrary(req, res) {
    try {
      const { category, muscle, equipment, search } = req.query;

      // This would typically fetch from a database of exercises
      // For now, returning sample data
      const exercises = [
        {
          id: 1,
          name: 'Push-ups',
          category: 'strength',
          muscle: ['chest', 'triceps', 'shoulders'],
          equipment: 'none',
          difficulty: 'beginner',
          instructions: 'วางมือบนพื้น...',
          videoUrl: 'https://example.com/pushups'
        },
        // More exercises...
      ];

      // Apply filters
      let filteredExercises = exercises;
      
      if (category) {
        filteredExercises = filteredExercises.filter(e => e.category === category);
      }
      
      if (muscle) {
        filteredExercises = filteredExercises.filter(e => e.muscle.includes(muscle));
      }
      
      if (equipment) {
        filteredExercises = filteredExercises.filter(e => e.equipment === equipment);
      }
      
      if (search) {
        filteredExercises = filteredExercises.filter(e => 
          e.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      res.json({
        success: true,
        data: filteredExercises
      });

    } catch (error) {
      console.error('Get exercise library error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลท่าออกกำลังกาย'
      });
    }
  }
}

module.exports = new WorkoutPlanController();
