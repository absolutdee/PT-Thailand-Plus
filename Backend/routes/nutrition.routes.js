// routes/nutrition.routes.js
const express = require('express');
const router = express.Router();
const nutritionController = require('../controllers/nutrition.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Client nutrition routes
router.get('/my-plans', auth, nutritionController.getMyNutritionPlans);
router.get('/my-logs', auth, nutritionController.getMyNutritionLogs);
router.post('/log-meal', auth, nutritionController.logMeal);
router.put('/log/:logId', auth, nutritionController.updateMealLog);
router.delete('/log/:logId', auth, nutritionController.deleteMealLog);

// Daily nutrition tracking
router.get('/daily/:date', auth, nutritionController.getDailyNutrition);
router.get('/weekly/:startDate', auth, nutritionController.getWeeklyNutrition);
router.get('/monthly/:year/:month', auth, nutritionController.getMonthlyNutrition);

// Nutrition goals
router.get('/goals', auth, nutritionController.getNutritionGoals);
router.post('/goals', auth, nutritionController.setNutritionGoals);
router.put('/goals', auth, nutritionController.updateNutritionGoals);

// Food database
router.get('/foods/search', nutritionController.searchFoods);
router.get('/foods/:id', nutritionController.getFoodById);
router.get('/foods/barcode/:barcode', nutritionController.getFoodByBarcode);
router.get('/foods/popular', nutritionController.getPopularFoods);

// Custom foods
router.get('/my-foods', auth, nutritionController.getMyCustomFoods);
router.post('/foods/create', auth, nutritionController.createCustomFood);
router.put('/foods/:id', auth, nutritionController.updateCustomFood);
router.delete('/foods/:id', auth, nutritionController.deleteCustomFood);

// Recipes
router.get('/recipes', nutritionController.getRecipes);
router.get('/recipes/:id', nutritionController.getRecipeById);
router.post('/recipes', auth, nutritionController.createRecipe);
router.put('/recipes/:id', auth, nutritionController.updateRecipe);
router.delete('/recipes/:id', auth, nutritionController.deleteRecipe);
router.get('/my-recipes', auth, nutritionController.getMyRecipes);

// Meal plans
router.get('/meal-plans/templates', nutritionController.getMealPlanTemplates);
router.get('/meal-plans/:id', auth, nutritionController.getMealPlanById);

// Trainer nutrition management
router.get('/trainer/clients', auth, nutritionController.getTrainerClients);
router.get('/trainer/client/:clientId/nutrition', auth, nutritionController.getClientNutrition);
router.post('/trainer/meal-plan', auth, nutritionController.createMealPlan);
router.put('/trainer/meal-plan/:id', auth, nutritionController.updateMealPlan);
router.delete('/trainer/meal-plan/:id', auth, nutritionController.deleteMealPlan);

// Nutrition recommendations
router.get('/recommendations', auth, nutritionController.getNutritionRecommendations);
router.get('/recommendations/supplements', auth, nutritionController.getSupplementRecommendations);

// Water tracking
router.get('/water/daily/:date', auth, nutritionController.getDailyWaterIntake);
router.post('/water/log', auth, nutritionController.logWaterIntake);
router.put('/water/goal', auth, nutritionController.updateWaterGoal);

// Nutrition analysis
router.get('/analysis/nutrients/:period', auth, nutritionController.getNutrientAnalysis);
router.get('/analysis/calories/:period', auth, nutritionController.getCalorieAnalysis);
router.get('/analysis/macros/:period', auth, nutritionController.getMacroAnalysis);

// Food allergies and restrictions
router.get('/restrictions', auth, nutritionController.getDietaryRestrictions);
router.post('/restrictions', auth, nutritionController.addDietaryRestriction);
router.delete('/restrictions/:id', auth, nutritionController.removeDietaryRestriction);

// Nutrition education
router.get('/education/articles', nutritionController.getNutritionArticles);
router.get('/education/tips', nutritionController.getNutritionTips);

// Admin nutrition management
router.get('/admin/foods', [auth, adminAuth], nutritionController.getAllFoods);
router.post('/admin/foods', [auth, adminAuth], nutritionController.createFood);
router.put('/admin/foods/:id', [auth, adminAuth], nutritionController.updateFood);
router.delete('/admin/foods/:id', [auth, adminAuth], nutritionController.deleteFood);

// Admin meal plan templates
router.get('/admin/meal-plan-templates', [auth, adminAuth], nutritionController.getAllMealPlanTemplates);
router.post('/admin/meal-plan-templates', [auth, adminAuth], nutritionController.createMealPlanTemplate);

// Nutrition reports
router.get('/reports/client-progress', auth, nutritionController.getClientNutritionProgress);
router.get('/reports/trainer-overview', auth, nutritionController.getTrainerNutritionOverview);

module.exports = router;
