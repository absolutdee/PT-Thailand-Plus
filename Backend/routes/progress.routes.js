// routes/progress.routes.js
const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progress.controller');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Client progress tracking
router.get('/overview', auth, progressController.getProgressOverview);
router.get('/timeline', auth, progressController.getProgressTimeline);
router.get('/stats/:period', auth, progressController.getProgressStats);

// Weight tracking
router.get('/weight', auth, progressController.getWeightProgress);
router.post('/weight', auth, progressController.logWeight);
router.put('/weight/:id', auth, progressController.updateWeightLog);
router.delete('/weight/:id', auth, progressController.deleteWeightLog);

// Body measurements
router.get('/measurements', auth, progressController.getBodyMeasurements);
router.post('/measurements', auth, progressController.logBodyMeasurement);
router.put('/measurements/:id', auth, progressController.updateBodyMeasurement);
router.delete('/measurements/:id', auth, progressController.deleteBodyMeasurement);

// Progress photos
router.get('/photos', auth, progressController.getProgressPhotos);
router.post('/photos', [auth, upload.single('photo')], progressController.uploadProgressPhoto);
router.delete('/photos/:id', auth, progressController.deleteProgressPhoto);
router.put('/photos/:id', auth, progressController.updateProgressPhoto);

// Fitness goals
router.get('/goals', auth, progressController.getFitnessGoals);
router.post('/goals', auth, progressController.setFitnessGoal);
router.put('/goals/:id', auth, progressController.updateFitnessGoal);
router.delete('/goals/:id', auth, progressController.deleteFitnessGoal);
router.put('/goals/:id/complete', auth, progressController.completeGoal);

// Workout progress
router.get('/workouts', auth, progressController.getWorkoutProgress);
router.get('/workouts/summary/:period', auth, progressController.getWorkoutSummary);
router.get('/workouts/personal-records', auth, progressController.getPersonalRecords);
router.post('/workouts/personal-record', auth, progressController.logPersonalRecord);

// Strength progress
router.get('/strength', auth, progressController.getStrengthProgress);
router.get('/strength/exercise/:exerciseId', auth, progressController.getExerciseProgress);
router.post('/strength/log', auth, progressController.logStrengthProgress);

// Cardio progress
router.get('/cardio', auth, progressController.getCardioProgress);
router.get('/cardio/summary/:period', auth, progressController.getCardioSummary);
router.post('/cardio/log', auth, progressController.logCardioProgress);

// Health metrics
router.get('/health-metrics', auth, progressController.getHealthMetrics);
router.post('/health-metrics', auth, progressController.logHealthMetric);
router.put('/health-metrics/:id', auth, progressController.updateHealthMetric);
router.delete('/health-metrics/:id', auth, progressController.deleteHealthMetric);

// Progress reports
router.get('/reports/monthly/:year/:month', auth, progressController.getMonthlyReport);
router.get('/reports/quarterly/:year/:quarter', auth, progressController.getQuarterlyReport);
router.get('/reports/yearly/:year', auth, progressController.getYearlyReport);
router.get('/reports/custom', auth, progressController.getCustomReport);

// Achievements and milestones
router.get('/achievements', auth, progressController.getAchievements);
router.get('/milestones', auth, progressController.getMilestones);
router.post('/milestones/:id/celebrate', auth, progressController.celebrateMilestone);

// Progress sharing
router.post('/share', auth, progressController.shareProgress);
router.get('/shared/:shareToken', progressController.getSharedProgress);

// Trainer access to client progress
router.get('/trainer/clients', auth, progressController.getTrainerClientsList);
router.get('/trainer/client/:clientId/overview', auth, progressController.getClientProgressOverview);
router.get('/trainer/client/:clientId/weight', auth, progressController.getClientWeightProgress);
router.get('/trainer/client/:clientId/measurements', auth, progressController.getClientMeasurements);
router.get('/trainer/client/:clientId/photos', auth, progressController.getClientProgressPhotos);
router.get('/trainer/client/:clientId/goals', auth, progressController.getClientGoals);
router.post('/trainer/client/:clientId/note', auth, progressController.addProgressNote);

// Progress analytics
router.get('/analytics/trends', auth, progressController.getProgressTrends);
router.get('/analytics/correlations', auth, progressController.getProgressCorrelations);
router.get('/analytics/predictions', auth, progressController.getProgressPredictions);

// Data export
router.get('/export/csv', auth, progressController.exportProgressCsv);
router.get('/export/pdf', auth, progressController.exportProgressPdf);

// Progress reminders
router.get('/reminders', auth, progressController.getProgressReminders);
router.post('/reminders', auth, progressController.setProgressReminder);
router.put('/reminders/:id', auth, progressController.updateProgressReminder);
router.delete('/reminders/:id', auth, progressController.deleteProgressReminder);

module.exports = router;
