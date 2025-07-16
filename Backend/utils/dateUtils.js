// utils/dateUtils.js
const moment = require('moment-timezone');

// Set default timezone to Bangkok
moment.tz.setDefault('Asia/Bangkok');

const dateUtils = {
  // Format date to Thai format
  formatThaiDate: (date, includeTime = false) => {
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 
      'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
      'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const d = new Date(date);
    const day = d.getDate();
    const month = thaiMonths[d.getMonth()];
    const year = d.getFullYear() + 543; // Buddhist Era

    if (includeTime) {
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`;
    }

    return `${day} ${month} ${year}`;
  },

  // Format relative time in Thai
  formatRelativeTimeThai: (date) => {
    const now = moment();
    const targetDate = moment(date);
    const diffMinutes = now.diff(targetDate, 'minutes');
    const diffHours = now.diff(targetDate, 'hours');
    const diffDays = now.diff(targetDate, 'days');

    if (diffMinutes < 1) return 'เมื่อสักครู่';
    if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} สัปดาห์ที่แล้ว`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} เดือนที่แล้ว`;
    return `${Math.floor(diffDays / 365)} ปีที่แล้ว`;
  },

  // Get start and end of period
  getPeriodDates: (period = 'month', date = new Date()) => {
    const m = moment(date);
    
    switch (period) {
      case 'day':
        return {
          start: m.startOf('day').toDate(),
          end: m.endOf('day').toDate()
        };
      case 'week':
        return {
          start: m.startOf('week').toDate(),
          end: m.endOf('week').toDate()
        };
      case 'month':
        return {
          start: m.startOf('month').toDate(),
          end: m.endOf('month').toDate()
        };
      case 'quarter':
        return {
          start: m.startOf('quarter').toDate(),
          end: m.endOf('quarter').toDate()
        };
      case 'year':
        return {
          start: m.startOf('year').toDate(),
          end: m.endOf('year').toDate()
        };
      default:
        return {
          start: m.startOf('day').toDate(),
          end: m.endOf('day').toDate()
        };
    }
  },

  // Calculate age from birthdate
  calculateAge: (birthDate) => {
    return moment().diff(moment(birthDate), 'years');
  },

  // Check if date is in the past
  isPast: (date) => {
    return moment(date).isBefore(moment());
  },

  // Check if date is in the future
  isFuture: (date) => {
    return moment(date).isAfter(moment());
  },

  // Check if date is today
  isToday: (date) => {
    return moment(date).isSame(moment(), 'day');
  },

  // Check if date is within range
  isDateInRange: (date, startDate, endDate) => {
    const m = moment(date);
    return m.isSameOrAfter(moment(startDate)) && m.isSameOrBefore(moment(endDate));
  },

  // Add business days
  addBusinessDays: (date, days) => {
    const m = moment(date);
    let daysAdded = 0;
    
    while (daysAdded < days) {
      m.add(1, 'day');
      if (m.day() !== 0 && m.day() !== 6) { // Skip weekends
        daysAdded++;
      }
    }
    
    return m.toDate();
  },

  // Get working hours between two dates
  getWorkingHours: (startDate, endDate, workingHours = { start: '09:00', end: '18:00' }) => {
    const start = moment(startDate);
    const end = moment(endDate);
    let totalHours = 0;
    
    while (start.isSameOrBefore(end)) {
      if (start.day() !== 0 && start.day() !== 6) { // Weekdays only
        const dayStart = moment(start).set({
          hour: parseInt(workingHours.start.split(':')[0]),
          minute: parseInt(workingHours.start.split(':')[1])
        });
        
        const dayEnd = moment(start).set({
          hour: parseInt(workingHours.end.split(':')[0]),
          minute: parseInt(workingHours.end.split(':')[1])
        });
        
        if (start.isSame(end, 'day')) {
          const actualStart = moment.max(start, dayStart);
          const actualEnd = moment.min(end, dayEnd);
          totalHours += actualEnd.diff(actualStart, 'hours', true);
        } else if (start.isSame(startDate, 'day')) {
          const actualStart = moment.max(start, dayStart);
          totalHours += dayEnd.diff(actualStart, 'hours', true);
        } else if (start.isSame(endDate, 'day')) {
          const actualEnd = moment.min(end, dayEnd);
          totalHours += actualEnd.diff(dayStart, 'hours', true);
        } else {
          totalHours += dayEnd.diff(dayStart, 'hours', true);
        }
      }
      
      start.add(1, 'day').startOf('day');
    }
    
    return Math.max(0, totalHours);
  },

  // Format duration
  formatDuration: (minutes) => {
    if (minutes < 60) {
      return `${minutes} นาที`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours} ชั่วโมง ${mins} นาที` : `${hours} ชั่วโมง`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return hours > 0 ? `${days} วัน ${hours} ชั่วโมง` : `${days} วัน`;
    }
  },

  // Get available time slots
  getAvailableTimeSlots: (date, bookedSlots, duration = 60, workingHours = { start: '09:00', end: '18:00' }) => {
    const slots = [];
    const startTime = moment(date).set({
      hour: parseInt(workingHours.start.split(':')[0]),
      minute: parseInt(workingHours.start.split(':')[1])
    });
    
    const endTime = moment(date).set({
      hour: parseInt(workingHours.end.split(':')[0]),
      minute: parseInt(workingHours.end.split(':')[1])
    });
    
    let currentSlot = startTime.clone();
    
    while (currentSlot.add(duration, 'minutes').isSameOrBefore(endTime)) {
      currentSlot.subtract(duration, 'minutes');
      
      const slotEnd = currentSlot.clone().add(duration, 'minutes');
      const isBooked = bookedSlots.some(booked => {
        const bookedStart = moment(booked.start);
        const bookedEnd = moment(booked.end);
        return (currentSlot.isSameOrAfter(bookedStart) && currentSlot.isBefore(bookedEnd)) ||
               (slotEnd.isAfter(bookedStart) && slotEnd.isSameOrBefore(bookedEnd)) ||
               (currentSlot.isSameOrBefore(bookedStart) && slotEnd.isSameOrAfter(bookedEnd));
      });
      
      if (!isBooked) {
        slots.push({
          start: currentSlot.format('HH:mm'),
          end: slotEnd.format('HH:mm'),
          datetime: currentSlot.toISOString()
        });
      }
      
      currentSlot.add(duration, 'minutes');
    }
    
    return slots;
  },

  // Calculate recurring dates
  getRecurringDates: (startDate, endDate, frequency, interval = 1) => {
    const dates = [];
    const current = moment(startDate);
    const end = moment(endDate);
    
    while (current.isSameOrBefore(end)) {
      dates.push(current.toDate());
      
      switch (frequency) {
        case 'daily':
          current.add(interval, 'days');
          break;
        case 'weekly':
          current.add(interval, 'weeks');
          break;
        case 'monthly':
          current.add(interval, 'months');
          break;
        case 'yearly':
          current.add(interval, 'years');
          break;
        default:
          return dates;
      }
    }
    
    return dates;
  },

  // Format date for database
  formatForDB: (date) => {
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
  },

  // Format date for API
  formatForAPI: (date) => {
    return moment(date).toISOString();
  },

  // Parse date from various formats
  parseDate: (dateString, formats = ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']) => {
    for (const format of formats) {
      const parsed = moment(dateString, format, true);
      if (parsed.isValid()) {
        return parsed.toDate();
      }
    }
    return null;
  },

  // Get calendar weeks
  getCalendarWeeks: (year, month) => {
    const weeks = [];
    const firstDay = moment([year, month]).startOf('month');
    const lastDay = moment([year, month]).endOf('month');
    
    let currentWeek = [];
    let currentDate = firstDay.clone().startOf('week');
    
    while (currentDate.isSameOrBefore(lastDay.endOf('week'))) {
      currentWeek.push({
        date: currentDate.date(),
        month: currentDate.month(),
        year: currentDate.year(),
        isCurrentMonth: currentDate.month() === month,
        isToday: currentDate.isSame(moment(), 'day')
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentDate.add(1, 'day');
    }
    
    return weeks;
  },

  // Convert minutes to time format
  minutesToTime: (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  },

  // Convert time format to minutes
  timeToMinutes: (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  },

  // Get next occurrence of day
  getNextDayOccurrence: (dayOfWeek) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(dayOfWeek.toLowerCase());
    
    if (targetDay === -1) return null;
    
    const today = moment();
    const todayDay = today.day();
    
    let daysToAdd = targetDay - todayDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    return today.add(daysToAdd, 'days').toDate();
  },

  // Check if time slot overlaps
  isTimeSlotOverlap: (slot1Start, slot1End, slot2Start, slot2End) => {
    const s1Start = moment(slot1Start);
    const s1End = moment(slot1End);
    const s2Start = moment(slot2Start);
    const s2End = moment(slot2End);
    
    return (s1Start.isBefore(s2End) && s1End.isAfter(s2Start));
  },

  // Get date range labels
  getDateRangeLabel: (startDate, endDate) => {
    const start = moment(startDate);
    const end = moment(endDate);
    
    if (start.isSame(end, 'day')) {
      return start.format('D MMMM YYYY');
    } else if (start.isSame(end, 'month')) {
      return `${start.format('D')} - ${end.format('D MMMM YYYY')}`;
    } else if (start.isSame(end, 'year')) {
      return `${start.format('D MMM')} - ${end.format('D MMM YYYY')}`;
    } else {
      return `${start.format('D MMM YYYY')} - ${end.format('D MMM YYYY')}`;
    }
  },

  // Get timezone offset
  getTimezoneOffset: () => {
    return moment.tz('Asia/Bangkok').format('Z');
  },

  // Convert to user timezone
  toUserTimezone: (date, userTimezone = 'Asia/Bangkok') => {
    return moment(date).tz(userTimezone).toDate();
  },

  // Calculate days between dates
  daysBetween: (date1, date2) => {
    return Math.abs(moment(date1).diff(moment(date2), 'days'));
  },

  // Get week number
  getWeekNumber: (date) => {
    return moment(date).week();
  },

  // Format countdown
  formatCountdown: (futureDate) => {
    const now = moment();
    const future = moment(futureDate);
    
    if (future.isBefore(now)) {
      return 'หมดเวลาแล้ว';
    }
    
    const duration = moment.duration(future.diff(now));
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    
    if (days > 0) {
      return `${days} วัน ${hours} ชั่วโมง ${minutes} นาที`;
    } else if (hours > 0) {
      return `${hours} ชั่วโมง ${minutes} นาที`;
    } else {
      return `${minutes} นาที`;
    }
  }
};

module.exports = dateUtils;
