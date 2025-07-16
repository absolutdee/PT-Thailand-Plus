// routes/calendar.routes.js
const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendar.controller');
const auth = require('../middleware/auth');

// Calendar views
router.get('/month/:year/:month', auth, calendarController.getMonthView);
router.get('/week/:year/:week', auth, calendarController.getWeekView);
router.get('/day/:date', auth, calendarController.getDayView);

// Events management
router.get('/events', auth, calendarController.getEvents);
router.post('/events', auth, calendarController.createEvent);
router.put('/events/:id', auth, calendarController.updateEvent);
router.delete('/events/:id', auth, calendarController.deleteEvent);
router.get('/events/:id', auth, calendarController.getEventById);

// Trainer schedule management
router.get('/trainer/schedule', auth, calendarController.getTrainerSchedule);
router.post('/trainer/schedule', auth, calendarController.createTrainerSchedule);
router.put('/trainer/schedule/:id', auth, calendarController.updateTrainerSchedule);
router.delete('/trainer/schedule/:id', auth, calendarController.deleteTrainerSchedule);

// Working hours
router.get('/trainer/working-hours', auth, calendarController.getWorkingHours);
router.post('/trainer/working-hours', auth, calendarController.setWorkingHours);
router.put('/trainer/working-hours', auth, calendarController.updateWorkingHours);

// Time slots
router.get('/trainer/time-slots/:date', auth, calendarController.getTimeSlots);
router.post('/trainer/time-slots', auth, calendarController.createTimeSlot);
router.put('/trainer/time-slots/:id', auth, calendarController.updateTimeSlot);
router.delete('/trainer/time-slots/:id', auth, calendarController.deleteTimeSlot);

// Availability
router.get('/trainer/availability/:date', auth, calendarController.getDayAvailability);
router.post('/trainer/availability', auth, calendarController.setAvailability);
router.put('/trainer/availability/:id', auth, calendarController.updateAvailability);

// Breaks and time off
router.get('/trainer/breaks', auth, calendarController.getBreaks);
router.post('/trainer/breaks', auth, calendarController.createBreak);
router.put('/trainer/breaks/:id', auth, calendarController.updateBreak);
router.delete('/trainer/breaks/:id', auth, calendarController.deleteBreak);

// Client calendar
router.get('/client/schedule', auth, calendarController.getClientSchedule);
router.get('/client/upcoming', auth, calendarController.getUpcomingEvents);

// Sync and integration
router.post('/sync/google', auth, calendarController.syncWithGoogleCalendar);
router.post('/sync/outlook', auth, calendarController.syncWithOutlook);
router.get('/sync/status', auth, calendarController.getSyncStatus);

// Calendar sharing
router.get('/share/:shareToken', calendarController.getSharedCalendar);
router.post('/share', auth, calendarController.createShareLink);
router.delete('/share/:id', auth, calendarController.removeShareLink);

// Recurring events
router.post('/recurring-events', auth, calendarController.createRecurringEvent);
router.put('/recurring-events/:id', auth, calendarController.updateRecurringEvent);
router.delete('/recurring-events/:id', auth, calendarController.deleteRecurringEvent);

module.exports = router;
