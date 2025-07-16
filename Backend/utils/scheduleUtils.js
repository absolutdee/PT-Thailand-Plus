// scheduleUtils.js - Utility functions for schedule and appointment management

import moment from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';

class ScheduleUtils {
    constructor() {
        this.defaultTimezone = 'Asia/Bangkok';
        this.workingHours = {
            start: '06:00',
            end: '22:00',
        };
        this.sessionDuration = 60; // minutes
        this.bufferTime = 15; // minutes between sessions
        this.maxAdvanceBooking = 90; // days
    }

    // Set timezone
    setTimezone(timezone) {
        this.defaultTimezone = timezone;
        moment.tz.setDefault(timezone);
    }

    // Generate time slots
    generateTimeSlots(date, options = {}) {
        const {
            startTime = this.workingHours.start,
            endTime = this.workingHours.end,
            duration = this.sessionDuration,
            interval = duration,
            timezone = this.defaultTimezone,
        } = options;

        const slots = [];
        const currentDate = moment.tz(date, timezone).startOf('day');
        const startMoment = currentDate.clone().add(moment.duration(startTime));
        const endMoment = currentDate.clone().add(moment.duration(endTime));

        let current = startMoment.clone();
        while (current.isBefore(endMoment)) {
            slots.push({
                start: current.format(),
                end: current.clone().add(duration, 'minutes').format(),
                startTime: current.format('HH:mm'),
                endTime: current.clone().add(duration, 'minutes').format('HH:mm'),
                duration,
            });
            current.add(interval, 'minutes');
        }

        return slots;
    }

    // Check availability
    async checkAvailability(trainerId, date, existingAppointments = []) {
        const allSlots = this.generateTimeSlots(date);
        const bookedSlots = existingAppointments.map(apt => ({
            start: moment(apt.startTime),
            end: moment(apt.endTime),
        }));

        const availableSlots = allSlots.filter(slot => {
            const slotStart = moment(slot.start);
            const slotEnd = moment(slot.end);

            // Check if slot overlaps with any booked appointment
            const isBooked = bookedSlots.some(booked => {
                return (
                    (slotStart.isBetween(booked.start, booked.end, null, '[)') ||
                     slotEnd.isBetween(booked.start, booked.end, null, '(]') ||
                     booked.start.isBetween(slotStart, slotEnd, null, '[)') ||
                     booked.end.isBetween(slotStart, slotEnd, null, '(]'))
                );
            });

            // Check if slot is in the past
            const isPast = slotEnd.isBefore(moment());

            return !isBooked && !isPast;
        });

        return availableSlots;
    }

    // Create appointment
    createAppointment(data) {
        const {
            trainerId,
            clientId,
            date,
            startTime,
            duration = this.sessionDuration,
            type = 'training',
            location,
            notes,
        } = data;

        const start = moment.tz(`${date} ${startTime}`, this.defaultTimezone);
        const end = start.clone().add(duration, 'minutes');

        return {
            id: uuidv4(),
            trainerId,
            clientId,
            date: start.format('YYYY-MM-DD'),
            startTime: start.format(),
            endTime: end.format(),
            duration,
            type,
            location,
            notes,
            status: 'scheduled',
            createdAt: moment().format(),
            reminders: this.generateDefaultReminders(start),
        };
    }

    // Generate default reminders
    generateDefaultReminders(appointmentTime) {
        return [
            {
                type: 'email',
                timing: 24 * 60, // 24 hours before
                sent: false,
                scheduledFor: appointmentTime.clone().subtract(24, 'hours').format(),
            },
            {
                type: 'notification',
                timing: 2 * 60, // 2 hours before
                sent: false,
                scheduledFor: appointmentTime.clone().subtract(2, 'hours').format(),
            },
            {
                type: 'notification',
                timing: 30, // 30 minutes before
                sent: false,
                scheduledFor: appointmentTime.clone().subtract(30, 'minutes').format(),
            },
        ];
    }

    // Reschedule appointment
    rescheduleAppointment(appointment, newDate, newStartTime) {
        const start = moment.tz(`${newDate} ${newStartTime}`, this.defaultTimezone);
        const end = start.clone().add(appointment.duration, 'minutes');

        return {
            ...appointment,
            date: start.format('YYYY-MM-DD'),
            startTime: start.format(),
            endTime: end.format(),
            status: 'rescheduled',
            rescheduledAt: moment().format(),
            previousStartTime: appointment.startTime,
            reminders: this.generateDefaultReminders(start),
        };
    }

    // Cancel appointment
    cancelAppointment(appointment, reason = '') {
        return {
            ...appointment,
            status: 'cancelled',
            cancelledAt: moment().format(),
            cancellationReason: reason,
        };
    }

    // Get recurring dates
    getRecurringDates(startDate, recurrenceRule, endDate) {
        const dates = [];
        const start = moment(startDate);
        const end = endDate ? moment(endDate) : start.clone().add(3, 'months');

        switch (recurrenceRule.frequency) {
            case 'daily':
                for (let d = start.clone(); d.isSameOrBefore(end); d.add(recurrenceRule.interval || 1, 'days')) {
                    dates.push(d.format('YYYY-MM-DD'));
                }
                break;

            case 'weekly':
                const weekdays = recurrenceRule.weekdays || [start.day()];
                for (let d = start.clone(); d.isSameOrBefore(end); d.add(1, 'days')) {
                    if (weekdays.includes(d.day())) {
                        dates.push(d.format('YYYY-MM-DD'));
                    }
                }
                break;

            case 'monthly':
                for (let d = start.clone(); d.isSameOrBefore(end); d.add(recurrenceRule.interval || 1, 'months')) {
                    dates.push(d.format('YYYY-MM-DD'));
                }
                break;

            default:
                dates.push(start.format('YYYY-MM-DD'));
        }

        return dates.slice(0, recurrenceRule.count || dates.length);
    }

    // Create recurring appointments
    createRecurringAppointments(baseAppointment, recurrenceRule) {
        const dates = this.getRecurringDates(
            baseAppointment.date,
            recurrenceRule,
            recurrenceRule.endDate
        );

        return dates.map((date, index) => {
            const start = moment.tz(`${date} ${moment(baseAppointment.startTime).format('HH:mm')}`, this.defaultTimezone);
            return {
                ...baseAppointment,
                id: uuidv4(),
                date,
                startTime: start.format(),
                endTime: start.clone().add(baseAppointment.duration, 'minutes').format(),
                recurrenceId: baseAppointment.id,
                recurrenceIndex: index,
            };
        });
    }

    // Check for conflicts
    checkConflicts(newAppointment, existingAppointments) {
        const newStart = moment(newAppointment.startTime);
        const newEnd = moment(newAppointment.endTime);

        const conflicts = existingAppointments.filter(apt => {
            if (apt.status === 'cancelled') return false;
            
            const aptStart = moment(apt.startTime);
            const aptEnd = moment(apt.endTime);

            return (
                (newStart.isBetween(aptStart, aptEnd, null, '[)') ||
                 newEnd.isBetween(aptStart, aptEnd, null, '(]') ||
                 aptStart.isBetween(newStart, newEnd, null, '[)') ||
                 aptEnd.isBetween(newStart, newEnd, null, '(]'))
            );
        });

        return {
            hasConflicts: conflicts.length > 0,
            conflicts,
        };
    }

    // Get schedule for date range
    getScheduleForDateRange(appointments, startDate, endDate) {
        const start = moment(startDate).startOf('day');
        const end = moment(endDate).endOf('day');

        return appointments.filter(apt => {
            const aptDate = moment(apt.startTime);
            return aptDate.isBetween(start, end, null, '[]');
        }).sort((a, b) => moment(a.startTime).diff(moment(b.startTime)));
    }

    // Get daily schedule
    getDailySchedule(appointments, date) {
        const targetDate = moment(date).format('YYYY-MM-DD');
        return appointments
            .filter(apt => moment(apt.startTime).format('YYYY-MM-DD') === targetDate)
            .sort((a, b) => moment(a.startTime).diff(moment(b.startTime)));
    }

    // Get weekly schedule
    getWeeklySchedule(appointments, weekStart) {
        const start = moment(weekStart).startOf('week');
        const end = start.clone().endOf('week');
        
        const schedule = {};
        for (let i = 0; i < 7; i++) {
            const date = start.clone().add(i, 'days');
            schedule[date.format('YYYY-MM-DD')] = this.getDailySchedule(appointments, date);
        }
        
        return schedule;
    }

    // Get monthly schedule
    getMonthlySchedule(appointments, month, year) {
        const start = moment({ year, month: month - 1 }).startOf('month');
        const end = start.clone().endOf('month');
        
        return this.getScheduleForDateRange(appointments, start, end);
    }

    // Calculate total hours
    calculateTotalHours(appointments) {
        return appointments.reduce((total, apt) => {
            if (apt.status !== 'cancelled') {
                return total + (apt.duration / 60);
            }
            return total;
        }, 0);
    }

    // Get next available slot
    getNextAvailableSlot(trainerId, existingAppointments, preferredTime = null) {
        const now = moment();
        const searchStart = preferredTime ? moment(preferredTime) : now;
        const searchEnd = searchStart.clone().add(this.maxAdvanceBooking, 'days');

        for (let date = searchStart.clone(); date.isSameOrBefore(searchEnd); date.add(1, 'day')) {
            const availableSlots = this.checkAvailability(trainerId, date, existingAppointments);
            if (availableSlots.length > 0) {
                return availableSlots[0];
            }
        }

        return null;
    }

    // Format schedule for calendar view
    formatForCalendar(appointments) {
        return appointments.map(apt => ({
            id: apt.id,
            title: apt.type === 'training' ? 'Training Session' : apt.type,
            start: apt.startTime,
            end: apt.endTime,
            extendedProps: {
                trainerId: apt.trainerId,
                clientId: apt.clientId,
                status: apt.status,
                location: apt.location,
                notes: apt.notes,
            },
            backgroundColor: this.getStatusColor(apt.status),
            borderColor: this.getStatusColor(apt.status),
        }));
    }

    // Get status color
    getStatusColor(status) {
        const colors = {
            scheduled: '#4CAF50',
            confirmed: '#2196F3',
            in_progress: '#FF9800',
            completed: '#9E9E9E',
            cancelled: '#F44336',
            rescheduled: '#9C27B0',
        };
        return colors[status] || '#757575';
    }

    // Get working hours for date
    getWorkingHours(date, customHours = null) {
        const dayOfWeek = moment(date).format('dddd').toLowerCase();
        const hours = customHours?.[dayOfWeek] || this.workingHours;
        
        return {
            start: hours.start,
            end: hours.end,
            isWorkingDay: hours.isWorkingDay !== false,
        };
    }

    // Validate appointment time
    validateAppointmentTime(date, startTime, duration, workingHours = null) {
        const appointmentStart = moment.tz(`${date} ${startTime}`, this.defaultTimezone);
        const appointmentEnd = appointmentStart.clone().add(duration, 'minutes');
        const dayWorkingHours = this.getWorkingHours(date, workingHours);

        if (!dayWorkingHours.isWorkingDay) {
            return { valid: false, error: 'Not a working day' };
        }

        const workStart = moment.tz(`${date} ${dayWorkingHours.start}`, this.defaultTimezone);
        const workEnd = moment.tz(`${date} ${dayWorkingHours.end}`, this.defaultTimezone);

        if (appointmentStart.isBefore(workStart)) {
            return { valid: false, error: 'Appointment starts before working hours' };
        }

        if (appointmentEnd.isAfter(workEnd)) {
            return { valid: false, error: 'Appointment ends after working hours' };
        }

        if (appointmentStart.isBefore(moment())) {
            return { valid: false, error: 'Cannot book appointments in the past' };
        }

        const maxBookingDate = moment().add(this.maxAdvanceBooking, 'days');
        if (appointmentStart.isAfter(maxBookingDate)) {
            return { valid: false, error: `Cannot book more than ${this.maxAdvanceBooking} days in advance` };
        }

        return { valid: true };
    }

    // Get appointment reminders due
    getRemindersdue(appointments) {
        const now = moment();
        const reminders = [];

        appointments.forEach(apt => {
            if (apt.status === 'scheduled' && apt.reminders) {
                apt.reminders.forEach((reminder, index) => {
                    const reminderTime = moment(reminder.scheduledFor);
                    if (!reminder.sent && reminderTime.isSameOrBefore(now)) {
                        reminders.push({
                            appointmentId: apt.id,
                            reminderIndex: index,
                            type: reminder.type,
                            appointment: apt,
                        });
                    }
                });
            }
        });

        return reminders;
    }

    // Get schedule statistics
    getScheduleStatistics(appointments, startDate, endDate) {
        const filtered = this.getScheduleForDateRange(appointments, startDate, endDate);
        
        const stats = {
            total: filtered.length,
            scheduled: 0,
            completed: 0,
            cancelled: 0,
            totalHours: 0,
            byType: {},
            byDay: {},
            utilizationRate: 0,
        };

        filtered.forEach(apt => {
            // Status counts
            if (apt.status === 'scheduled') stats.scheduled++;
            else if (apt.status === 'completed') stats.completed++;
            else if (apt.status === 'cancelled') stats.cancelled++;

            // Type counts
            stats.byType[apt.type] = (stats.byType[apt.type] || 0) + 1;

            // Day counts
            const day = moment(apt.startTime).format('dddd');
            stats.byDay[day] = (stats.byDay[day] || 0) + 1;

            // Total hours (excluding cancelled)
            if (apt.status !== 'cancelled') {
                stats.totalHours += apt.duration / 60;
            }
        });

        // Calculate utilization rate
        const workDays = moment(endDate).diff(moment(startDate), 'days') + 1;
        const availableHours = workDays * 8; // Assuming 8 working hours per day
        stats.utilizationRate = (stats.totalHours / availableHours) * 100;

        return stats;
    }
}

// Export singleton instance
const scheduleUtils = new ScheduleUtils();
export default scheduleUtils;

// Export individual functions
export const {
    generateTimeSlots,
    checkAvailability,
    createAppointment,
    rescheduleAppointment,
    cancelAppointment,
    createRecurringAppointments,
    checkConflicts,
    getScheduleForDateRange,
    getDailySchedule,
    getWeeklySchedule,
    getMonthlySchedule,
    calculateTotalHours,
    getNextAvailableSlot,
    formatForCalendar,
    validateAppointmentTime,
    getRemindersdue,
    getScheduleStatistics,
} = scheduleUtils;
