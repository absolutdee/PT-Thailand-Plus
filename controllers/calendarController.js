// controllers/calendarController.js
const Booking = require('../models/Booking');
const Trainer = require('../models/Trainer');
const Client = require('../models/Client');
const WorkoutPlan = require('../models/WorkoutPlan');
const Event = require('../models/Event');
const moment = require('moment');
const ical = require('ical-generator');
const { google } = require('googleapis');

class CalendarController {
  // Get calendar events
  async getCalendarEvents(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { startDate, endDate, type = 'all' } = req.query;

      const dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };

      let events = [];

      // Get bookings
      if (type === 'all' || type === 'bookings') {
        const bookingQuery = userRole === 'trainer'
          ? { trainerId: req.user.trainerId }
          : { clientId: req.user.clientId };

        const bookings = await Booking.find({
          ...bookingQuery,
          sessionDate: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $in: ['confirmed', 'pending'] }
        })
          .populate({
            path: userRole === 'trainer' ? 'clientId' : 'trainerId',
            populate: {
              path: 'userId',
              select: 'firstName lastName profilePicture'
            }
          })
          .populate('packageId', 'name type');

        const bookingEvents = bookings.map(booking => ({
          id: booking._id,
          type: 'booking',
          title: userRole === 'trainer'
            ? `${booking.clientId.userId.firstName} ${booking.clientId.userId.lastName} - ${booking.packageId.name}`
            : `${booking.trainerId.userId.firstName} ${booking.trainerId.userId.lastName} - ${booking.packageId.name}`,
          start: booking.sessionDate,
          end: moment(booking.sessionDate).add(booking.duration || 60, 'minutes').toDate(),
          status: booking.status,
          color: this.getEventColor('booking', booking.status),
          details: {
            bookingId: booking._id,
            location: booking.location,
            packageType: booking.packageId.type,
            notes: booking.notes
          }
        }));

        events.push(...bookingEvents);
      }

      // Get workout plans (for clients)
      if (userRole === 'client' && (type === 'all' || type === 'workouts')) {
        const workoutPlans = await WorkoutPlan.find({
          clientId: req.user.clientId,
          isActive: true
        });

        workoutPlans.forEach(plan => {
          // Generate recurring workout events based on frequency
          const workoutDays = this.generateWorkoutDays(plan, dateRange);
          
          const workoutEvents = workoutDays.map(date => ({
            id: `workout_${plan._id}_${date.toISOString()}`,
            type: 'workout',
            title: plan.name,
            start: date,
            end: moment(date).add(plan.estimatedDuration || 60, 'minutes').toDate(),
            color: this.getEventColor('workout'),
            recurring: true,
            details: {
              planId: plan._id,
              exercises: plan.exercises,
              duration: plan.estimatedDuration
            }
          }));

          events.push(...workoutEvents);
        });
      }

      // Get platform events
      if (type === 'all' || type === 'events') {
        const platformEvents = await Event.find({
          startDate: { $lte: dateRange.end },
          endDate: { $gte: dateRange.start },
          status: 'published'
        });

        const eventItems = platformEvents.map(event => ({
          id: event._id,
          type: 'event',
          title: event.title,
          start: event.startDate,
          end: event.endDate,
          allDay: event.allDay,
          color: this.getEventColor('event'),
          details: {
            eventId: event._id,
            description: event.description,
            location: event.location,
            registrationRequired: event.registrationRequired
          }
        }));

        events.push(...eventItems);
      }

      // Get reminders
      if (type === 'all' || type === 'reminders') {
        const reminders = await this.getUserReminders(userId, userRole, dateRange);
        events.push(...reminders);
      }

      // Sort events by start date
      events.sort((a, b) => new Date(a.start) - new Date(b.start));

      res.json({
        success: true,
        data: {
          events,
          dateRange
        }
      });

    } catch (error) {
      console.error('Get calendar events error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลปฏิทิน'
      });
    }
  }

  // Get trainer availability
  async getTrainerAvailability(req, res) {
    try {
      const { trainerId, date } = req.query;

      const trainer = await Trainer.findById(trainerId);
      if (!trainer) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบเทรนเนอร์'
        });
      }

      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      
      // Get working hours for the day
      const workingHours = trainer.workingHours[dayOfWeek];
      if (!workingHours || !workingHours.isAvailable) {
        return res.json({
          success: true,
          data: {
            available: false,
            slots: []
          }
        });
      }

      // Get existing bookings for the day
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingBookings = await Booking.find({
        trainerId,
        sessionDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['confirmed', 'pending'] }
      });

      // Generate available time slots
      const slots = this.generateTimeSlots(
        workingHours.startTime,
        workingHours.endTime,
        60, // 60 minutes per slot
        existingBookings,
        targetDate
      );

      res.json({
        success: true,
        data: {
          available: true,
          date: targetDate,
          workingHours: {
            start: workingHours.startTime,
            end: workingHours.endTime
          },
          slots
        }
      });

    } catch (error) {
      console.error('Get trainer availability error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการตรวจสอบเวลาว่าง'
      });
    }
  }

  // Get schedule summary
  async getScheduleSummary(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { period = 'week' } = req.query;

      const dateRange = this.getDateRangeForPeriod(period);

      let summary = {};

      if (userRole === 'trainer') {
        const trainerId = req.user.trainerId;
        
        // Get booking stats
        const bookings = await Booking.find({
          trainerId,
          sessionDate: { $gte: dateRange.start, $lte: dateRange.end }
        });

        const bookingsByStatus = bookings.reduce((acc, booking) => {
          acc[booking.status] = (acc[booking.status] || 0) + 1;
          return acc;
        }, {});

        // Get busiest times
        const bookingsByHour = bookings.reduce((acc, booking) => {
          const hour = booking.sessionDate.getHours();
          acc[hour] = (acc[hour] || 0) + 1;
          return acc;
        }, {});

        const busiestHours = Object.entries(bookingsByHour)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([hour, count]) => ({
            hour: parseInt(hour),
            count,
            time: `${hour}:00`
          }));

        // Get revenue
        const revenue = await Payment.aggregate([
          {
            $match: {
              trainerId,
              status: 'completed',
              completedAt: { $gte: dateRange.start, $lte: dateRange.end }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        summary = {
          period: {
            start: dateRange.start,
            end: dateRange.end,
            name: period
          },
          bookings: {
            total: bookings.length,
            byStatus: bookingsByStatus,
            confirmed: bookingsByStatus.confirmed || 0,
            pending: bookingsByStatus.pending || 0,
            completed: bookingsByStatus.completed || 0
          },
          schedule: {
            busiestHours,
            utilizationRate: await this.calculateUtilization(trainerId, dateRange)
          },
          revenue: revenue[0]?.total || 0
        };

      } else if (userRole === 'client') {
        const clientId = req.user.clientId;

        // Get upcoming sessions
        const upcomingSessions = await Booking.countDocuments({
          clientId,
          status: 'confirmed',
          sessionDate: { $gte: new Date(), $lte: dateRange.end }
        });

        // Get completed workouts
        const completedWorkouts = await Booking.countDocuments({
          clientId,
          status: 'completed',
          sessionDate: { $gte: dateRange.start, $lte: dateRange.end }
        });

        // Get workout streak
        const streak = await this.calculateWorkoutStreak(clientId);

        summary = {
          period: {
            start: dateRange.start,
            end: dateRange.end,
            name: period
          },
          sessions: {
            upcoming: upcomingSessions,
            completed: completedWorkouts
          },
          streak: {
            current: streak.current,
            longest: streak.longest
          }
        };
      }

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Get schedule summary error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุป'
      });
    }
  }

  // Sync with Google Calendar
  async syncGoogleCalendar(req, res) {
    try {
      const userId = req.user.userId;
      const { code } = req.body;

      // Initialize Google OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Save tokens to user profile
      await User.findByIdAndUpdate(userId, {
        googleCalendarTokens: tokens,
        googleCalendarSync: true
      });

      // Initial sync
      await this.performGoogleCalendarSync(userId, oauth2Client);

      res.json({
        success: true,
        message: 'เชื่อมต่อ Google Calendar สำเร็จ'
      });

    } catch (error) {
      console.error('Sync Google Calendar error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google Calendar'
      });
    }
  }

  // Export calendar (iCal format)
  async exportCalendar(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { startDate, endDate } = req.query;

      const dateRange = {
        start: new Date(startDate || moment().startOf('month').toDate()),
        end: new Date(endDate || moment().endOf('month').toDate())
      };

      // Get user info
      const user = await User.findById(userId);

      // Create calendar
      const calendar = ical({
        name: 'FitConnect Calendar',
        timezone: 'Asia/Bangkok'
      });

      // Get events
      const events = await this.getCalendarEventsForExport(userId, userRole, dateRange);

      // Add events to calendar
      events.forEach(event => {
        calendar.createEvent({
          start: event.start,
          end: event.end,
          summary: event.title,
          description: event.description,
          location: event.location,
          url: event.url,
          organizer: {
            name: 'FitConnect',
            email: 'calendar@fitconnect.com'
          }
        });
      });

      // Set response headers
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename=fitconnect-calendar-${moment().format('YYYY-MM')}.ics`);

      // Send calendar
      res.send(calendar.toString());

    } catch (error) {
      console.error('Export calendar error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการส่งออกปฏิทิน'
      });
    }
  }

  // Create recurring booking
  async createRecurringBooking(req, res) {
    try {
      const clientId = req.user.clientId;
      const {
        trainerId,
        packageId,
        startDate,
        endDate,
        dayOfWeek,
        time,
        location,
        notes
      } = req.body;

      // Validate package
      const package = await Package.findById(packageId);
      if (!package || !package.isActive) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแพคเกจ'
        });
      }

      // Generate recurring dates
      const recurringDates = this.generateRecurringDates(
        startDate,
        endDate,
        dayOfWeek
      );

      // Check trainer availability for all dates
      const unavailableDates = [];
      for (const date of recurringDates) {
        const isAvailable = await this.checkTrainerAvailability(
          trainerId,
          date,
          time
        );
        if (!isAvailable) {
          unavailableDates.push(date);
        }
      }

      if (unavailableDates.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'เทรนเนอร์ไม่ว่างในบางวัน',
          data: {
            unavailableDates: unavailableDates.map(d => moment(d).format('YYYY-MM-DD'))
          }
        });
      }

      // Create bookings
      const bookings = await Promise.all(
        recurringDates.map(date => {
          const sessionDate = new Date(date);
          const [hours, minutes] = time.split(':');
          sessionDate.setHours(parseInt(hours), parseInt(minutes));

          return Booking.create({
            clientId,
            trainerId,
            packageId,
            sessionDate,
            sessionTime: time,
            location,
            notes,
            amount: package.price,
            status: 'pending',
            recurringGroupId: new Date().getTime().toString()
          });
        })
      );

      res.json({
        success: true,
        message: `สร้างการจองแบบต่อเนื่อง ${bookings.length} รายการสำเร็จ`,
        data: {
          bookings: bookings.map(b => ({
            id: b._id,
            date: b.sessionDate,
            status: b.status
          }))
        }
      });

    } catch (error) {
      console.error('Create recurring booking error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างการจองแบบต่อเนื่อง'
      });
    }
  }

  // Update calendar preferences
  async updateCalendarPreferences(req, res) {
    try {
      const userId = req.user.userId;
      const {
        defaultView,
        weekStartsOn,
        timeFormat,
        showWeekends,
        colorScheme,
        reminderSettings
      } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        {
          calendarPreferences: {
            defaultView,
            weekStartsOn,
            timeFormat,
            showWeekends,
            colorScheme,
            reminderSettings
          }
        },
        { new: true }
      ).select('calendarPreferences');

      res.json({
        success: true,
        message: 'อัพเดทการตั้งค่าปฏิทินสำเร็จ',
        data: user.calendarPreferences
      });

    } catch (error) {
      console.error('Update calendar preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่า'
      });
    }
  }

  // ==================== HELPER FUNCTIONS ====================

  // Get event color based on type and status
  getEventColor(type, status) {
    const colors = {
      booking: {
        confirmed: '#4CAF50',
        pending: '#FFC107',
        cancelled: '#F44336',
        completed: '#9E9E9E'
      },
      workout: '#2196F3',
      event: '#9C27B0',
      reminder: '#FF9800'
    };

    if (type === 'booking') {
      return colors.booking[status] || colors.booking.pending;
    }
    return colors[type] || '#607D8B';
  }

  // Generate workout days based on plan
  generateWorkoutDays(plan, dateRange) {
    const days = [];
    const frequency = plan.frequency; // e.g., 3 times per week
    const preferredDays = plan.preferredDays || [1, 3, 5]; // Mon, Wed, Fri

    let currentDate = new Date(dateRange.start);
    while (currentDate <= dateRange.end) {
      const dayOfWeek = currentDate.getDay();
      if (preferredDays.includes(dayOfWeek)) {
        days.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  // Generate time slots
  generateTimeSlots(startTime, endTime, duration, existingBookings, date) {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMin, 0);

    const endDateTime = new Date(date);
    endDateTime.setHours(endHour, endMin, 0);

    while (currentTime < endDateTime) {
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);

      // Check if slot conflicts with existing bookings
      const isAvailable = !existingBookings.some(booking => {
        const bookingStart = booking.sessionDate;
        const bookingEnd = new Date(bookingStart);
        bookingEnd.setMinutes(bookingEnd.getMinutes() + (booking.duration || 60));

        return (currentTime < bookingEnd && slotEnd > bookingStart);
      });

      slots.push({
        start: new Date(currentTime),
        end: new Date(slotEnd),
        time: moment(currentTime).format('HH:mm'),
        available: isAvailable
      });

      currentTime.setMinutes(currentTime.getMinutes() + duration);
    }

    return slots;
  }

  // Get date range for period
  getDateRangeForPeriod(period) {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() + (6 - end.getDay()));
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }

  // Calculate trainer utilization
  async calculateUtilization(trainerId, dateRange) {
    const trainer = await Trainer.findById(trainerId);
    if (!trainer.workingHours) return 0;

    let totalAvailableHours = 0;
    let currentDate = new Date(dateRange.start);

    while (currentDate <= dateRange.end) {
      const dayOfWeek = currentDate.getDay();
      const workingHours = trainer.workingHours[dayOfWeek];
      
      if (workingHours && workingHours.isAvailable) {
        const [startHour, startMin] = workingHours.startTime.split(':').map(Number);
        const [endHour, endMin] = workingHours.endTime.split(':').map(Number);
        const hours = (endHour + endMin / 60) - (startHour + startMin / 60);
        totalAvailableHours += hours;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const bookings = await Booking.countDocuments({
      trainerId,
      sessionDate: { $gte: dateRange.start, $lte: dateRange.end },
      status: { $in: ['confirmed', 'completed'] }
    });

    const bookedHours = bookings; // Assuming 1 hour per session
    
    return totalAvailableHours > 0
      ? Math.round((bookedHours / totalAvailableHours) * 100)
      : 0;
  }

  // Calculate workout streak
  async calculateWorkoutStreak(clientId) {
    const bookings = await Booking.find({
      clientId,
      status: 'completed'
    }).sort({ sessionDate: -1 });

    if (bookings.length === 0) {
      return { current: 0, longest: 0 };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    let lastDate = bookings[0].sessionDate;

    for (let i = 1; i < bookings.length; i++) {
      const daysDiff = Math.floor(
        (lastDate - bookings[i].sessionDate) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= 2) { // Allow 1 day gap
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }

      lastDate = bookings[i].sessionDate;
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate current streak
    const today = new Date();
    const daysSinceLastWorkout = Math.floor(
      (today - bookings[0].sessionDate) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastWorkout <= 2) {
      currentStreak = tempStreak;
    }

    return { current: currentStreak, longest: longestStreak };
  }

  // Get user reminders
  async getUserReminders(userId, userRole, dateRange) {
    const reminders = [];

    if (userRole === 'client') {
      const client = await Client.findOne({ userId });
      if (client && client.reminderSettings) {
        const settings = client.reminderSettings;

        // Water reminder
        if (settings.waterReminder) {
          settings.reminderTimes?.water?.forEach(time => {
            let currentDate = new Date(dateRange.start);
            while (currentDate <= dateRange.end) {
              const reminderDate = new Date(currentDate);
              const [hours, minutes] = time.split(':');
              reminderDate.setHours(parseInt(hours), parseInt(minutes));

              reminders.push({
                id: `water_${currentDate.toISOString()}_${time}`,
                type: 'reminder',
                title: 'ดื่มน้ำ',
                start: reminderDate,
                end: moment(reminderDate).add(5, 'minutes').toDate(),
                color: this.getEventColor('reminder'),
                details: {
                  reminderType: 'water'
                }
              });

              currentDate.setDate(currentDate.getDate() + 1);
            }
          });
        }

        // Meal reminder
        if (settings.mealReminder) {
          settings.reminderTimes?.meals?.forEach(meal => {
            let currentDate = new Date(dateRange.start);
            while (currentDate <= dateRange.end) {
              const reminderDate = new Date(currentDate);
              const [hours, minutes] = meal.time.split(':');
              reminderDate.setHours(parseInt(hours), parseInt(minutes));

              reminders.push({
                id: `meal_${currentDate.toISOString()}_${meal.name}`,
                type: 'reminder',
                title: meal.name,
                start: reminderDate,
                end: moment(reminderDate).add(30, 'minutes').toDate(),
                color: this.getEventColor('reminder'),
                details: {
                  reminderType: 'meal',
                  mealName: meal.name
                }
              });

              currentDate.setDate(currentDate.getDate() + 1);
            }
          });
        }
      }
    }

    return reminders;
  }

  // Generate recurring dates
  generateRecurringDates(startDate, endDate, daysOfWeek) {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      if (daysOfWeek.includes(currentDate.getDay())) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  // Check trainer availability
  async checkTrainerAvailability(trainerId, date, time) {
    const existingBooking = await Booking.findOne({
      trainerId,
      sessionDate: date,
      sessionTime: time,
      status: { $in: ['confirmed', 'pending'] }
    });

    return !existingBooking;
  }

  // Get calendar events for export
  async getCalendarEventsForExport(userId, userRole, dateRange) {
    const events = [];

    // Get bookings
    const bookingQuery = userRole === 'trainer'
      ? { trainerId: userId }
      : { clientId: userId };

    const bookings = await Booking.find({
      ...bookingQuery,
      sessionDate: { $gte: dateRange.start, $lte: dateRange.end }
    })
      .populate('trainerId clientId packageId');

    bookings.forEach(booking => {
      events.push({
        title: `Training Session - ${booking.packageId.name}`,
        start: booking.sessionDate,
        end: moment(booking.sessionDate).add(booking.duration || 60, 'minutes').toDate(),
        description: `Package: ${booking.packageId.name}\nStatus: ${booking.status}`,
        location: booking.location,
        url: `${process.env.CLIENT_URL}/bookings/${booking._id}`
      });
    });

    return events;
  }

  // Perform Google Calendar sync
  async performGoogleCalendarSync(userId, oauth2Client) {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get upcoming bookings
    const bookings = await Booking.find({
      $or: [{ clientId: userId }, { trainerId: userId }],
      sessionDate: { $gte: new Date() },
      status: 'confirmed'
    }).populate('trainerId clientId packageId');

    // Create/update events in Google Calendar
    for (const booking of bookings) {
      const event = {
        summary: `FitConnect: ${booking.packageId.name}`,
        description: `Training session\nLocation: ${booking.location}`,
        start: {
          dateTime: booking.sessionDate.toISOString(),
          timeZone: 'Asia/Bangkok'
        },
        end: {
          dateTime: moment(booking.sessionDate)
            .add(booking.duration || 60, 'minutes')
            .toISOString(),
          timeZone: 'Asia/Bangkok'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 60 }
          ]
        }
      };

      try {
        if (booking.googleEventId) {
          // Update existing event
          await calendar.events.update({
            calendarId: 'primary',
            eventId: booking.googleEventId,
            resource: event
          });
        } else {
          // Create new event
          const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event
          });

          // Save Google event ID
          booking.googleEventId = response.data.id;
          await booking.save();
        }
      } catch (error) {
        console.error('Google Calendar sync error for booking:', booking._id, error);
      }
    }
  }
}

module.exports = new CalendarController();
