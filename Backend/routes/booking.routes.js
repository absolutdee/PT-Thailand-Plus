// routes/booking.routes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Client booking routes
router.get('/my-bookings', auth, bookingController.getMyBookings);
router.post('/create', auth, bookingController.createBooking);
router.put('/:id/confirm', auth, bookingController.confirmBooking);
router.put('/:id/cancel', auth, bookingController.cancelBooking);
router.put('/:id/reschedule', auth, bookingController.rescheduleBooking);
router.get('/:id', auth, bookingController.getBookingById);

// Trainer booking routes
router.get('/trainer/bookings', auth, bookingController.getTrainerBookings);
router.put('/trainer/:id/accept', auth, bookingController.acceptBooking);
router.put('/trainer/:id/reject', auth, bookingController.rejectBooking);
router.put('/trainer/:id/complete', auth, bookingController.completeBooking);
router.put('/trainer/:id/start', auth, bookingController.startSession);
router.post('/trainer/:id/reschedule', auth, bookingController.proposeReschedule);

// Availability management
router.get('/trainer/availability', auth, bookingController.getTrainerAvailability);
router.post('/trainer/availability', auth, bookingController.setAvailability);
router.put('/trainer/availability/:id', auth, bookingController.updateAvailability);
router.delete('/trainer/availability/:id', auth, bookingController.removeAvailability);

// Booking slots
router.get('/trainer/:trainerId/available-slots', bookingController.getAvailableSlots);
router.get('/trainer/:trainerId/slots/:date', bookingController.getDaySlots);

// Session notes and feedback
router.post('/:id/notes', auth, bookingController.addSessionNotes);
router.put('/:id/notes', auth, bookingController.updateSessionNotes);
router.get('/:id/notes', auth, bookingController.getSessionNotes);

// Recurring bookings
router.post('/recurring', auth, bookingController.createRecurringBooking);
router.put('/recurring/:id/update', auth, bookingController.updateRecurringBooking);
router.delete('/recurring/:id/cancel', auth, bookingController.cancelRecurringBooking);

// Admin booking management
router.get('/admin/all', [auth, adminAuth], bookingController.getAllBookings);
router.get('/admin/stats', [auth, adminAuth], bookingController.getBookingStats);
router.put('/admin/:id/resolve', [auth, adminAuth], bookingController.resolveDispute);

// Notifications
router.get('/:id/reminders', auth, bookingController.getBookingReminders);
router.post('/:id/send-reminder', auth, bookingController.sendBookingReminder);

module.exports = router;
