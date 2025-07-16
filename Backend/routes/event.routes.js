// routes/event.routes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public event routes
router.get('/public', eventController.getPublicEvents);
router.get('/public/:id', eventController.getPublicEventById);
router.get('/public/featured', eventController.getFeaturedEvents);
router.get('/public/upcoming', eventController.getUpcomingEvents);
router.get('/public/category/:category', eventController.getEventsByCategory);

// Event registration
router.post('/:id/register', auth, eventController.registerForEvent);
router.delete('/:id/unregister', auth, eventController.unregisterFromEvent);
router.get('/:id/registration-status', auth, eventController.getRegistrationStatus);

// User event routes
router.get('/my-events', auth, eventController.getMyEvents);
router.get('/my-registrations', auth, eventController.getMyRegistrations);

// Trainer event routes
router.get('/trainer/my-events', auth, eventController.getTrainerEvents);
router.post('/trainer/create', auth, eventController.createTrainerEvent);
router.put('/trainer/:id', auth, eventController.updateTrainerEvent);
router.delete('/trainer/:id', auth, eventController.deleteTrainerEvent);
router.get('/trainer/:id/participants', auth, eventController.getEventParticipants);

// Admin event management
router.get('/admin/all', [auth, adminAuth], eventController.getAllEvents);
router.post('/admin/create', [auth, adminAuth], eventController.createEvent);
router.put('/admin/:id', [auth, adminAuth], eventController.updateEvent);
router.delete('/admin/:id', [auth, adminAuth], eventController.deleteEvent);
router.get('/admin/:id', [auth, adminAuth], eventController.getEventById);

// Event categories
router.get('/categories', eventController.getEventCategories);
router.post('/admin/categories', [auth, adminAuth], eventController.createEventCategory);
router.put('/admin/categories/:id', [auth, adminAuth], eventController.updateEventCategory);
router.delete('/admin/categories/:id', [auth, adminAuth], eventController.deleteEventCategory);

// Event status management
router.put('/admin/:id/publish', [auth, adminAuth], eventController.publishEvent);
router.put('/admin/:id/unpublish', [auth, adminAuth], eventController.unpublishEvent);
router.put('/admin/:id/cancel', [auth, adminAuth], eventController.cancelEvent);
router.put('/admin/:id/reschedule', [auth, adminAuth], eventController.rescheduleEvent);

// Event participants management
router.get('/admin/:id/participants', [auth, adminAuth], eventController.getEventParticipants);
router.post('/admin/:id/add-participant', [auth, adminAuth], eventController.addParticipant);
router.delete('/admin/:id/remove-participant/:userId', [auth, adminAuth], eventController.removeParticipant);

// Event notifications
router.post('/:id/send-notification', [auth, adminAuth], eventController.sendEventNotification);
router.post('/:id/send-reminder', [auth, adminAuth], eventController.sendEventReminder);

// Event check-in
router.post('/:id/check-in', auth, eventController.checkInToEvent);
router.get('/:id/check-in-status', auth, eventController.getCheckInStatus);
router.get('/admin/:id/check-ins', [auth, adminAuth], eventController.getEventCheckIns);

// Event feedback
router.post('/:id/feedback', auth, eventController.submitEventFeedback);
router.get('/admin/:id/feedback', [auth, adminAuth], eventController.getEventFeedback);

// Event analytics
router.get('/admin/:id/analytics', [auth, adminAuth], eventController.getEventAnalytics);
router.get('/admin/analytics/overview', [auth, adminAuth], eventController.getEventsAnalyticsOverview);

// Event search and filter
router.get('/search', eventController.searchEvents);
router.get('/filter', eventController.filterEvents);

module.exports = router;
