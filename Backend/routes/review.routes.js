// routes/review.routes.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public review routes
router.get('/trainer/:trainerId', reviewController.getTrainerReviews);
router.get('/trainer/:trainerId/summary', reviewController.getTrainerReviewSummary);
router.get('/package/:packageId', reviewController.getPackageReviews);
router.get('/gym/:gymId', reviewController.getGymReviews);

// Client review routes
router.get('/my-reviews', auth, reviewController.getMyReviews);
router.post('/trainer/:trainerId', auth, reviewController.createTrainerReview);
router.post('/package/:packageId', auth, reviewController.createPackageReview);
router.post('/gym/:gymId', auth, reviewController.createGymReview);
router.put('/:reviewId', auth, reviewController.updateReview);
router.delete('/:reviewId', auth, reviewController.deleteReview);

// Review interactions
router.post('/:reviewId/helpful', auth, reviewController.markAsHelpful);
router.delete('/:reviewId/helpful', auth, reviewController.removeHelpful);
router.post('/:reviewId/report', auth, reviewController.reportReview);

// Trainer review management
router.get('/trainer/my-reviews', auth, reviewController.getReviewsForTrainer);
router.post('/trainer/reply/:reviewId', auth, reviewController.replyToReview);
router.put('/trainer/reply/:replyId', auth, reviewController.updateReviewReply);
router.delete('/trainer/reply/:replyId', auth, reviewController.deleteReviewReply);

// Review statistics
router.get('/trainer/:trainerId/stats', reviewController.getTrainerReviewStats);
router.get('/package/:packageId/stats', reviewController.getPackageReviewStats);
router.get('/gym/:gymId/stats', reviewController.getGymReviewStats);

// Review filtering and sorting
router.get('/trainer/:trainerId/filtered', reviewController.getFilteredTrainerReviews);
router.get('/package/:packageId/filtered', reviewController.getFilteredPackageReviews);

// Review verification
router.get('/:reviewId/verification', auth, reviewController.getReviewVerification);
router.post('/:reviewId/verify', auth, reviewController.verifyReview);

// Admin review management
router.get('/admin/all', [auth, adminAuth], reviewController.getAllReviews);
router.get('/admin/pending', [auth, adminAuth], reviewController.getPendingReviews);
router.get('/admin/reported', [auth, adminAuth], reviewController.getReportedReviews);
router.put('/admin/:reviewId/approve', [auth, adminAuth], reviewController.approveReview);
router.put('/admin/:reviewId/reject', [auth, adminAuth], reviewController.rejectReview);
router.delete('/admin/:reviewId', [auth, adminAuth], reviewController.deleteReviewAdmin);

// Review moderation
router.put('/admin/:reviewId/moderate', [auth, adminAuth], reviewController.moderateReview);
router.post('/admin/:reviewId/flag', [auth, adminAuth], reviewController.flagReview);
router.delete('/admin/:reviewId/unflag', [auth, adminAuth], reviewController.unflagReview);

// Review analytics
router.get('/admin/analytics/overview', [auth, adminAuth], reviewController.getReviewAnalyticsOverview);
router.get('/admin/analytics/trends', [auth, adminAuth], reviewController.getReviewTrends);
router.get('/admin/analytics/sentiment', [auth, adminAuth], reviewController.getReviewSentimentAnalysis);

// Review templates and guidelines
router.get('/templates', reviewController.getReviewTemplates);
router.get('/guidelines', reviewController.getReviewGuidelines);

// Review reminders
router.post('/remind/:bookingId', auth, reviewController.sendReviewReminder);
router.get('/pending-reviews', auth, reviewController.getPendingReviewsForUser);

// Review aggregation
router.get('/trainer/:trainerId/aggregated', reviewController.getAggregatedTrainerReviews);
router.get('/platform/top-rated', reviewController.getTopRatedContent);
router.get('/platform/recent', reviewController.getRecentReviews);

// Review export
router.get('/admin/export/csv', [auth, adminAuth], reviewController.exportReviewsCsv);
router.get('/trainer/export/my-reviews', auth, reviewController.exportTrainerReviews);

// Review notifications
router.get('/notifications', auth, reviewController.getReviewNotifications);
router.put('/notifications/:notificationId/read', auth, reviewController.markNotificationAsRead);

// Review incentives
router.get('/incentives', auth, reviewController.getReviewIncentives);
router.post('/claim-incentive/:reviewId', auth, reviewController.claimReviewIncentive);

module.exports = router;
