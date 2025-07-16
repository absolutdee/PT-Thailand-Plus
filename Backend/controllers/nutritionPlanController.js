// controllers/nutritionPlanController.js
const NutritionPlan = require('../models/NutritionPlan');
const Client = require('../models/Client');
const Trainer = require('../models/Trainer');
const Booking = require('../models/Booking');
const { sendNotification } = require('../utils/notification');

class NutritionPlanController {
  // Create nutrition plan
  async createNutritionPlan(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const {
        clientId,
        name,
        description,
        goal,
        dailyCalories,
        macros,
        meals,
        restrictions,
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
          message: 'คุณไม่มีสิทธิ์สร้างแผนโภชนาการให้ลูกค้ารายนี้'
        });
      }

      // Get client info for calculations
      const client = await Client.findById(clientId);

      // Deactivate previous active plans
      await NutritionPlan.updateMany(
        { clientId, isActive: true },
        { isActive: false }
      );

      // Create new nutrition plan
      const nutritionPlan = await NutritionPlan.create({
        clientId,
        createdBy: trainerId,
        name,
        description,
        goal,
        dailyCalories: dailyCalories || this.calculateDailyCalories(client),
        macros: macros || this.calculateMacros(dailyCalories, goal),
        meals,
        restrictions,
        notes,
        isActive: true
      });

      // Populate trainer info
      await nutritionPlan.populate({
        path: 'createdBy',
        populate: {
          path: 'userId',
          select: 'firstName lastName'
        }
      });

      // Send notification to client
      const clientUser = await Client.findById(clientId)
        .populate('userId', 'firstName');
      
      await sendNotification({
        userId: clientUser.userId._id,
        title: 'แผนโภชนาการใหม่',
        message: 'เทรนเนอร์ของคุณได้สร้างแผนโภชนาการใหม่ให้คุณ',
        type: 'new_nutrition_plan',
        relatedId: nutritionPlan._id
      });

      res.status(201).json({
        success: true,
        message: 'สร้างแผนโภชนาการสำเร็จ',
        data: nutritionPlan
      });

    } catch (error) {
      console.error('Create nutrition plan error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างแผนโภชนาการ'
      });
    }
  }

  // Calculate daily calories based on client data
  calculateDailyCalories(client) {
    // Basic Mifflin-St Jeor Equation
    const { weight, height, gender, age } = client;
    let bmr;

    if (gender === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    // Activity factor (moderate activity)
    const activityFactor = 1.55;
    return Math.round(bmr * activityFactor);
  }

  // Calculate macros based on goal
  calculateMacros(calories, goal) {
    let proteinPercent, carbPercent, fatPercent;

    switch (goal) {
      case 'weight_loss':
        proteinPercent = 0.30;
        carbPercent = 0.35;
        fatPercent = 0.35;
        break;
      case 'muscle_gain':
        proteinPercent = 0.30;
        carbPercent = 0.45;
        fatPercent = 0.25;
        break;
      case 'maintenance':
      default:
        proteinPercent = 0.25;
        carbPercent = 0.45;
        fatPercent = 0.30;
        break;
    }

    return {
      protein: Math.round((calories * proteinPercent) / 4), // 4 cal per gram
      carbs: Math.round((calories * carbPercent) / 4),
      fat: Math.round((calories * fatPercent) / 9), // 9 cal per gram
      fiber: 25 // Default fiber recommendation
    };
  }

  // Get nutrition plans
  async getNutritionPlans(req, res) {
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

      const nutritionPlans = await NutritionPlan.find(query)
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

      const totalCount = await NutritionPlan.countDocuments(query);

      res.json({
        success: true,
        data: {
          nutritionPlans,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Get nutrition plans error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแผนโภชนาการ'
      });
    }
  }

  // Get nutrition plan by ID
  async getNutritionPlanById(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.user.role;

      const nutritionPlan = await NutritionPlan.findById(id)
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
          }
        ]);

      if (!nutritionPlan) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแผนโภชนาการ'
        });
      }

      // Check authorization
      const isAuthorized = 
        (userRole === 'trainer' && nutritionPlan.createdBy._id.toString() === req.user.trainerId) ||
        (userRole === 'client' && nutritionPlan.clientId._id.toString() === req.user.clientId) ||
        userRole === 'admin';

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์ดูแผนโภชนาการนี้'
        });
      }

      res.json({
        success: true,
        data: nutritionPlan
      });

    } catch (error) {
      console.error('Get nutrition plan by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแผนโภชนาการ'
      });
    }
  }

  // Update nutrition plan
  async updateNutritionPlan(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { id } = req.params;
      const updates = req.body;

      const nutritionPlan = await NutritionPlan.findOne({
        _id: id,
        createdBy: trainerId
      });

      if (!nutritionPlan) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแผนโภชนาการหรือคุณไม่มีสิทธิ์แก้ไข'
        });
      }

      // Update nutrition plan
      Object.assign(nutritionPlan, updates);
      nutritionPlan.updatedAt = new Date();
      await nutritionPlan.save();

      // Notify client about update
      const client = await Client.findById(nutritionPlan.clientId)
        .populate('userId');
        
      await sendNotification({
        userId: client.userId._id,
        title: 'แผนโภชนาการได้รับการอัพเดท',
        message: 'เทรนเนอร์ของคุณได้อัพเดทแผนโภชนาการ',
        type: 'nutrition_plan_updated',
        relatedId: nutritionPlan._id
      });

      res.json({
        success: true,
        message: 'อัพเดทแผนโภชนาการสำเร็จ',
        data: nutritionPlan
      });

    } catch (error) {
      console.error('Update nutrition plan error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทแผนโภชนาการ'
      });
    }
  }

  // Delete nutrition plan
  async deleteNutritionPlan(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { id } = req.params;

      const nutritionPlan = await NutritionPlan.findOneAndDelete({
        _id: id,
        createdBy: trainerId
      });

      if (!nutritionPlan) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแผนโภชนาการหรือคุณไม่มีสิทธิ์ลบ'
        });
      }

      res.json({
        success: true,
        message: 'ลบแผนโภชนาการสำเร็จ'
      });

    } catch (error) {
      console.error('Delete nutrition plan error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบแผนโภชนาการ'
      });
    }
  }

  // Log daily meals
  async logDailyMeals(req, res) {
    try {
      const clientId = req.user.clientId;
      const { id } = req.params;
      const {
        date,
        meals,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        notes
      } = req.body;

      const nutritionPlan = await NutritionPlan.findOne({
        _id: id,
        clientId
      });

      if (!nutritionPlan) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแผนโภชนาการหรือคุณไม่มีสิทธิ์'
        });
      }

      // Check if already logged for this date
      const existingLog = nutritionPlan.dailyLogs.find(
        log => log.date.toDateString() === new Date(date).toDateString()
      );

      if (existingLog) {
        // Update existing log
        existingLog.meals = meals;
        existingLog.totalCalories = totalCalories;
        existingLog.totalProtein = totalProtein;
        existingLog.totalCarbs = totalCarbs;
        existingLog.totalFat = totalFat;
        existingLog.notes = notes;
        existingLog.updatedAt = new Date();
      } else {
        // Add new log
        nutritionPlan.dailyLogs.push({
          date: new Date(date),
          meals,
          totalCalories,
          totalProtein,
          totalCarbs,
          totalFat,
          notes
        });
      }

      await nutritionPlan.save();

      res.json({
        success: true,
        message: 'บันทึกมื้ออาหารสำเร็จ',
        data: nutritionPlan.dailyLogs[nutritionPlan.dailyLogs.length - 1]
      });

    } catch (error) {
      console.error('Log daily meals error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการบันทึกมื้ออาหาร'
      });
    }
  }

  // Get nutrition progress
  async getNutritionProgress(req, res) {
    try {
      const clientId = req.user.clientId;
      const { planId, startDate, endDate } = req.query;

      let query = { clientId };
      if (planId) {
        query._id = planId;
      }

      const nutritionPlans = await NutritionPlan.find(query)
        .select('name dailyCalories macros dailyLogs')
        .lean();

      // Filter logs by date if provided
      if (startDate && endDate) {
        nutritionPlans.forEach(plan => {
          plan.dailyLogs = plan.dailyLogs.filter(log => 
            log.date >= new Date(startDate) && 
            log.date <= new Date(endDate)
          );
        });
      }

      // Calculate adherence and statistics
      const stats = nutritionPlans.reduce((acc, plan) => {
        const planStats = plan.dailyLogs.reduce((pAcc, log) => {
          const calorieAdherence = Math.abs(1 - Math.abs(log.totalCalories - plan.dailyCalories) / plan.dailyCalories);
          const proteinAdherence = Math.abs(1 - Math.abs(log.totalProtein - plan.macros.protein) / plan.macros.protein);
          
          return {
            totalDays: pAcc.totalDays + 1,
            totalCalories: pAcc.totalCalories + log.totalCalories,
            totalProtein: pAcc.totalProtein + log.totalProtein,
            totalCarbs: pAcc.totalCarbs + log.totalCarbs,
            totalFat: pAcc.totalFat + log.totalFat,
            adherenceScore: pAcc.adherenceScore + ((calorieAdherence + proteinAdherence) / 2)
          };
        }, { 
          totalDays: 0, 
          totalCalories: 0, 
          totalProtein: 0, 
          totalCarbs: 0, 
          totalFat: 0,
          adherenceScore: 0 
        });

        return {
          totalDays: acc.totalDays + planStats.totalDays,
          avgCalories: acc.avgCalories + (planStats.totalDays > 0 ? planStats.totalCalories / planStats.totalDays : 0),
          avgProtein: acc.avgProtein + (planStats.totalDays > 0 ? planStats.totalProtein / planStats.totalDays : 0),
          avgCarbs: acc.avgCarbs + (planStats.totalDays > 0 ? planStats.totalCarbs / planStats.totalDays : 0),
          avgFat: acc.avgFat + (planStats.totalDays > 0 ? planStats.totalFat / planStats.totalDays : 0),
          adherenceScore: acc.adherenceScore + (planStats.totalDays > 0 ? planStats.adherenceScore / planStats.totalDays : 0)
        };
      }, { 
        totalDays: 0, 
        avgCalories: 0, 
        avgProtein: 0, 
        avgCarbs: 0, 
        avgFat: 0,
        adherenceScore: 0 
      });

      res.json({
        success: true,
        data: {
          plans: nutritionPlans,
          statistics: {
            ...stats,
            adherencePercentage: stats.totalDays > 0 ? Math.round(stats.adherenceScore / nutritionPlans.length * 100) : 0
          }
        }
      });

    } catch (error) {
      console.error('Get nutrition progress error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลความก้าวหน้า'
      });
    }
  }

  // Get food database
  async searchFoods(req, res) {
    try {
      const { query, category } = req.query;

      // This would typically integrate with a food database API
      // For now, returning sample data
      const foods = [
        {
          id: 1,
          name: 'ข้าวขาว',
          nameTh: 'ข้าวขาว',
          nameEn: 'White Rice',
          category: 'grains',
          serving: '1 ถ้วย (150g)',
          calories: 205,
          protein: 4.3,
          carbs: 44.5,
          fat: 0.4,
          fiber: 0.6
        },
        {
          id: 2,
          name: 'อกไก่',
          nameTh: 'อกไก่',
          nameEn: 'Chicken Breast',
          category: 'protein',
          serving: '100g',
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          fiber: 0
        }
        // More foods...
      ];

      // Apply filters
      let filteredFoods = foods;
      
      if (query) {
        filteredFoods = filteredFoods.filter(f => 
          f.nameTh.includes(query) || 
          f.nameEn.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      if (category) {
        filteredFoods = filteredFoods.filter(f => f.category === category);
      }

      res.json({
        success: true,
        data: filteredFoods
      });

    } catch (error) {
      console.error('Search foods error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการค้นหาอาหาร'
      });
    }
  }

  // Generate meal suggestions
  async generateMealSuggestions(req, res) {
    try {
      const { calories, macros, mealType, restrictions = [] } = req.body;

      // This would use an algorithm to generate meal suggestions
      // based on the target calories and macros
      const suggestions = [
        {
          name: 'อกไก่ย่างกับสลัดผัก',
          calories: 350,
          protein: 40,
          carbs: 15,
          fat: 12,
          foods: [
            { name: 'อกไก่', amount: '150g' },
            { name: 'สลัดผักรวม', amount: '200g' },
            { name: 'น้ำสลัด', amount: '2 ช้อนโต๊ะ' }
          ]
        }
        // More suggestions...
      ];

      res.json({
        success: true,
        data: suggestions
      });

    } catch (error) {
      console.error('Generate meal suggestions error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างคำแนะนำมื้ออาหาร'
      });
    }
  }

  // Copy nutrition plan to another client
  async copyNutritionPlan(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { id } = req.params;
      const { targetClientId } = req.body;

      // Get original plan
      const originalPlan = await NutritionPlan.findOne({
        _id: id,
        createdBy: trainerId
      });

      if (!originalPlan) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแผนโภชนาการหรือคุณไม่มีสิทธิ์'
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

      // Get target client info for recalculation
      const targetClient = await Client.findById(targetClientId);

      // Create copy with adjusted calories and macros
      const copiedPlan = await NutritionPlan.create({
        clientId: targetClientId,
        createdBy: trainerId,
        name: `${originalPlan.name} (คัดลอก)`,
        description: originalPlan.description,
        goal: originalPlan.goal,
        dailyCalories: this.calculateDailyCalories(targetClient),
        macros: this.calculateMacros(this.calculateDailyCalories(targetClient), originalPlan.goal),
        meals: originalPlan.meals,
        restrictions: originalPlan.restrictions,
        notes: originalPlan.notes,
        isActive: true
      });

      res.status(201).json({
        success: true,
        message: 'คัดลอกแผนโภชนาการสำเร็จ',
        data: copiedPlan
      });

    } catch (error) {
      console.error('Copy nutrition plan error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการคัดลอกแผนโภชนาการ'
      });
    }
  }
}

module.exports = new NutritionPlanController();
