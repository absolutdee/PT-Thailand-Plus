
// Frontend/components/shared/booking/ScheduleView.jsx
import React, { useState, useMemo } from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
  parseISO
} from 'date-fns';
import { th } from 'date-fns/locale';
import './ScheduleView.scss';

const ScheduleView = ({
  schedule = [],
  onSlotClick,
  onEventClick,
  viewType = 'week', // 'day' | 'week' | 'month'
  showTimeSlots = true,
  timeSlotInterval = 30, // minutes
  startHour = 6,
  endHour = 22,
  disabledSlots = [],
  userType = 'customer' // 'customer' | 'trainer'
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);

  const timeSlots = useMemo(() => {
    const slots = [];
    const totalMinutes = (endHour - startHour) * 60;
    
    for (let minutes = 0; minutes < totalMinutes; minutes += timeSlotInterval) {
      const hours = startHour + Math.floor(minutes / 60);
      const mins = minutes % 60;
      slots.push({
        time: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`,
        hour: hours,
        minute: mins
      });
    }
    
    return slots;
  }, [startHour, endHour, timeSlotInterval]);

  const weekDays = useMemo(() => {
    const days = [];
    let day = weekStart;
    
    for (let i = 0; i < 7; i++) {
      days.push({
        date: day,
        dayName: format(day, 'EEE', { locale: th }),
        dayNumber: format(day, 'd'),
        isToday: isToday(day),
        events: schedule.filter(event => 
          isSameDay(parseISO(event.dateTime), day)
        )
      });
      day = addDays(day, 1);
    }
    
    return days;
  }, [weekStart, schedule]);

  const handlePrevWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const isSlotDisabled = (day, slot) => {
    const slotDateTime = new Date(day.date);
    slotDateTime.setHours(slot.hour, slot.minute, 0, 0);
    
    // Check if slot is in the past
    if (slotDateTime < new Date()) return true;
    
    // Check if slot is in disabled slots
    const slotKey = `${format(day.date, 'yyyy-MM-dd')}_${slot.time}`;
    return disabledSlots.includes(slotKey);
  };

  const isSlotBooked = (day, slot) => {
    return day.events.some(event => {
      const eventTime = format(parseISO(event.dateTime), 'HH:mm');
      return eventTime === slot.time;
    });
  };

  const getEventForSlot = (day, slot) => {
    return day.events.find(event => {
      const eventTime = format(parseISO(event.dateTime), 'HH:mm');
      return eventTime === slot.time;
    });
  };

  const renderWeekView = () => (
    <div className="schedule-view__week">
      <div className="schedule-view__header">
        <div className="schedule-view__nav">
          <button
            className="schedule-view__nav-btn"
            onClick={handlePrevWeek}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
            </svg>
          </button>
          
          <h3 className="schedule-view__title">
            {format(weekStart, 'd MMM', { locale: th })} - {format(weekEnd, 'd MMM yyyy', { locale: th })}
          </h3>
          
          <button
            className="schedule-view__nav-btn"
            onClick={handleNextWeek}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/>
            </svg>
          </button>
        </div>
        
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={handleToday}
        >
          วันนี้
        </button>
      </div>

      <div className="schedule-view__grid">
        <div className="schedule-view__time-column">
          <div className="schedule-view__day-header"></div>
          {showTimeSlots && timeSlots.map((slot, index) => (
            <div key={index} className="schedule-view__time-slot">
              {slot.time}
            </div>
          ))}
        </div>

        {weekDays.map((day, dayIndex) => (
          <div key={dayIndex} className="schedule-view__day-column">
            <div className={`schedule-view__day-header ${day.isToday ? 'schedule-view__day-header--today' : ''}`}>
              <span className="schedule-view__day-name">{day.dayName}</span>
              <span className="schedule-view__day-number">{day.dayNumber}</span>
            </div>
            
            {showTimeSlots ? (
              timeSlots.map((slot, slotIndex) => {
                const event = getEventForSlot(day, slot);
                const isDisabled = isSlotDisabled(day, slot);
                const isBooked = isSlotBooked(day, slot);

                return (
                  <div
                    key={slotIndex}
                    className={`
                      schedule-view__slot
                      ${isDisabled ? 'schedule-view__slot--disabled' : ''}
                      ${isBooked ? 'schedule-view__slot--booked' : ''}
                      ${event ? `schedule-view__slot--${event.status}` : ''}
                    `.trim()}
                    onClick={() => {
                      if (event) {
                        onEventClick?.(event);
                      } else if (!isDisabled && userType === 'customer') {
                        onSlotClick?.({
                          date: day.date,
                          time: slot.time,
                          dateTime: new Date(day.date.setHours(slot.hour, slot.minute))
                        });
                      }
                    }}
                  >
                    {event && (
                      <div className="schedule-view__event">
                        <span className="schedule-view__event-title">
                          {userType === 'trainer' ? event.customerName : event.trainerName}
                        </span>
                        <span className="schedule-view__event-service">
                          {event.serviceName}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="schedule-view__day-events">
                {day.events.map((event, eventIndex) => (
                  <div
                    key={eventIndex}
                    className={`schedule-view__event-card schedule-view__event-card--${event.status}`}
                    onClick={() => onEventClick?.(event)}
                  >
                    <span className="schedule-view__event-time">
                      {format(parseISO(event.dateTime), 'HH:mm')}
                    </span>
                    <span className="schedule-view__event-name">
                      {userType === 'trainer' ? event.customerName : event.trainerName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="schedule-view">
      {viewType === 'week' && renderWeekView()}
      {/* Add day and month views as needed */}
    </div>
  );
};

export default ScheduleView;
