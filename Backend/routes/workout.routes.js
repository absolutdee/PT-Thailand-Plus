// routes/workout.routes.js
const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workout.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public workout routes
router.get('/public/templates', workoutController.getPublicWorkoutTemplates);
router.get('/public/exercises', workoutController.getPublicExercises);
router.get('/public/categories', workoutController.getWorkoutCategories);

// Client workout routes
router.get('/my-workouts', auth, workoutController.getMyWorkouts);
router.get('/my-plans', auth, workoutController.getMyWorkoutPlans);
router.post('/log', auth, workoutController.logWorkout);
router.put('/log/:id', auth, workoutController.updateWorkoutLog);
router.delete('/log/:id', auth, workoutController.deleteWorkoutLog);
router.get('/log/:id', auth, workoutController.getWorkoutLogById);

// Workout planning
router.get('/plans', auth, workoutController.getWorkoutPlans);
router.post('/plans', auth, workoutController.createWorkoutPlan);
router.put('/plans/:id', auth, workoutController.updateWorkoutPlan);
router.delete('/plans/:id', auth, workoutController.deleteWorkoutPlan);
router.get('/plans/:id', auth, workoutController.getWorkoutPlanById);

// Workout sessions
router.post('/sessions/start', auth, workoutController.startWorkoutSession);
router.put('/sessions/:id/complete', auth, workoutController.completeWorkoutSession);
router.put('/sessions/:id/pause', auth, workoutController.pauseWorkoutSession);
router.put('/sessions/:id/resume', auth, workoutController.resumeWorkoutSession);
router.get('/sessions/active', auth, workoutController.getActiveWorkoutSession);

// Exercise management
router.get('/exercises', workoutController.getExercises);
router.get('/exercises/:id', workoutController.getExerciseById);
router.get('/exercises/category/:category', workoutController.getExercisesByCategory);
router.get('/exercises/muscle-group/:muscleGroup', workoutController.getExercisesByMuscleGroup);
router.get('/exercises/search', workoutController.searchExercises);

// Custom exercises
router.get('/my-exercises', auth, workoutController.getMyCustomExercises);
router.post('/exercises/create', auth, workoutController.createCustomExercise);
router.put('/exercises/:id', auth, workoutController.updateCustomExercise);
router.delete('/exercises/:id', auth, workoutController.deleteCustomExercise);

// Workout templates
router.get('/templates', workoutController.getWorkoutTemplates);
router.get('/templates/:id', workoutController.getWorkoutTemplateById);
router.post('/templates', auth, workoutController.createWorkoutTemplate);
router.put('/templates/:id', auth, workoutController.updateWorkoutTemplate);
router.delete('/templates/:id', auth, workoutController.deleteWorkoutTemplate);

// Trainer workout management
router.get('/trainer/clients', auth, workoutController.getTrainerClients);
router.get('/trainer/client/:clientId/workouts', auth, workoutController.getClientWorkouts);
router.post('/trainer/assign-plan', auth, workoutController.assignWorkoutPlan);
router.put('/trainer/modify-plan/:planId', auth, workoutController.modifyClientWorkoutPlan);

// Workout scheduling
router.get('/schedule', auth, workoutController.getWorkoutSchedule);
router.post('/schedule', auth, workoutController.scheduleWorkout);
router.put('/schedule/:id', auth, workoutController.updateScheduledWorkout);
router.delete('/schedule/:id', auth, workoutController.deleteScheduledWorkout);

// Workout progress tracking
router.get('/progress/overview', auth, workoutController.getWorkoutProgressOverview);
router.get('/progress/exercise/:exerciseId', auth, workoutController.getExerciseProgress);
router.get('/progress/volume', auth, workoutController.getVolumeProgress);
router.get('/progress/strength', auth, workoutController.getStrengthProgress);

// Workout analytics
router.get('/analytics/summary/:period', auth, workoutController.getWorkoutSummary);
router.get('/analytics/frequency', auth, workoutController.getWorkoutFrequency);
router.get('/analytics/duration', auth, workoutController.getWorkoutDuration);

// Workout recommendations
router.get('/recommendations', auth, workoutController.getWorkoutRecommendations);
router.get('/recommendations/exercises', auth, workoutController.getExerciseRecommendations);

// Workout history
router.get('/history', auth, workoutController.getWorkoutHistory);
router.get('/history/calendar/:year/:month', auth, workoutController.getWorkoutCalendar);

// Workout goals
router.get('/goals', auth, workoutController.getWorkoutGoals);
router.post('/goals', auth, workoutController.setWorkoutGoal);
router.put('/goals/:id', auth, workoutController.updateWorkoutGoal);
router.delete('/goals/:id', auth, workoutController.deleteWorkoutGoal);

// Personal records
router.get('/personal-records', auth, workoutController.getPersonalRecords);
router.post('/personal-records', auth, workoutController.logPersonalRecord);
router.put('/personal-records/:id', auth, workoutController.updatePersonalRecord);

// Admin workout management
router.get('/admin/exercises', [auth, adminAuth], workoutController.getAllExercises);
router.post('/admin/exercises', [auth, adminAuth], workoutController.createExercise);
router.put('/admin/exercises/:id', [auth, adminAuth], workoutController.updateExercise);
router.delete('/admin/exercises/:id', [auth, adminAuth], workoutController.deleteExercise);

// Admin workout categories
router.get('/admin/categories', [auth, adminAuth], workoutController.getAllCategories);
router.post('/admin/categories', [auth, adminAuth], workoutController.createWorkoutCategory);
router.put('/admin/categories/:id', [auth, adminAuth], workoutController.updateWorkoutCategory);
router.delete('/admin/categories/:id', [auth, adminAuth], workoutController.deleteWorkoutCategory);

// Workout sharing
router.post('/share/:workoutId', auth, workoutController.shareWorkout);
router.get('/shared/:shareToken', workoutController.getSharedWorkout);

// Workout export
router.get('/export/csv', auth, workoutController.exportWorkoutsCsv);
router.get('/export/pdf/:workoutId', auth, workoutController.exportWorkoutPdf);

module.exports = router;
