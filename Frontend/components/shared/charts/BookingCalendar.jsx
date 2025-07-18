// Frontend/components/shared/charts/BookingCalendar.jsx
import React, { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO
} from 'date-fns';
import { th } from 'date-fns/locale';
import './BookingCalendar.scss';

const BookingCalendar = ({
  bookings = [],
  onDateSelect,
  onBookingSelect,
  selectedDate = new Date(),
  view = 'month', // 'month' | 'week' | 'day'
  showLegend = true
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState(view);

  const bookingTypes = {
    confirmed: { color: '#28a745', label: 'ยืนยันแล้ว' },
    pending: { color: '#ffc107', label: 'รอยืนยัน' },
    completed: { color: '#17a2b8', label: 'เสร็จสิ้น' },
    cancelled: { color: '#dc3545', label: 'ยกเลิก' }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "MMMM yyyy";
  const dayFormat = "EEEEEE";
  const dateNumFormat = "d";

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const formattedDate = format(day, 'yyyy-MM-dd');
      const dayBookings = bookings.filter(booking => 
        format(parseISO(booking.date), 'yyyy-MM-dd') === formattedDate
      );

      days.push({
        date: day,
        formattedDate,
        bookings: dayBookings,
        isCurrentMonth: isSameMonth(day, monthStart),
        isToday: isToday(day),
        isSelected: isSameDay(day, selectedDate)
      });

      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date) => {
    onDateSelect?.(date);
  };

  const handleBookingClick = (booking, e) => {
    e.stopPropagation();
    onBookingSelect?.(booking);
  };

  const renderMonthView = () => (
    <div className="booking-calendar__month">
      <div className="booking-calendar__weekdays">
        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, index) => (
          <div key={index} className="booking-calendar__weekday">
            {day}
          </div>
        ))}
      </div>
      <div className="booking-calendar__dates">
        {rows.map((week, weekIndex) => (
          <div key={weekIndex} className="booking-calendar__week">
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`booking-calendar__day ${
                  !day.isCurrentMonth ? 'booking-calendar__day--other-month' : ''
                } ${day.isToday ? 'booking-calendar__day--today' : ''} ${
                  day.isSelected ? 'booking-calendar__day--selected' : ''
                }`}
                onClick={() => handleDateClick(day.date)}
              >
                <span className="booking-calendar__day-number">
                  {format(day.date, dateNumFormat)}
                </span>
                {day.bookings.length > 0 && (
                  <div className="booking-calendar__day-bookings">
                    {day.bookings.slice(0, 3).map((booking, index) => (
                      <div
                        key={booking.id}
                        className="booking-calendar__booking-dot"
                        style={{ backgroundColor: bookingTypes[booking.status]?.color }}
                        onClick={(e) => handleBookingClick(booking, e)}
                        title={`${booking.time} - ${booking.clientName}`}
                      />
                    ))}
                    {day.bookings.length > 3 && (
                      <span className="booking-calendar__more">+{day.bookings.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const renderWeekView = () => {
    // Implementation for week view
    return <div className="booking-calendar__week-view">Week View - To be implemented</div>;
  };

  const renderDayView = () => {
    // Implementation for day view
    return <div className="booking-calendar__day-view">Day View - To be implemented</div>;
  };

  const todayBookings = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return bookings.filter(booking => 
      format(parseISO(booking.date), 'yyyy-MM-dd') === today
    );
  }, [bookings]);

  return (
    <div className="booking-calendar">
      <div className="booking-calendar__header">
        <div className="booking-calendar__nav">
          <button
            className="booking-calendar__nav-btn"
            onClick={handlePrevMonth}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
            </svg>
          </button>
          <h2 className="booking-calendar__title">
            {format(currentDate, dateFormat, { locale: th })}
          </h2>
          <button
            className="booking-calendar__nav-btn"
            onClick={handleNextMonth}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/>
            </svg>
          </button>
        </div>
        
        <div className="booking-calendar__view-controls">
          <button
            className={`booking-calendar__view-btn ${viewType === 'month' ? 'active' : ''}`}
            onClick={() => setViewType('month')}
          >
            เดือน
          </button>
          <button
            className={`booking-calendar__view-btn ${viewType === 'week' ? 'active' : ''}`}
            onClick={() => setViewType('week')}
          >
            สัปดาห์
          </button>
          <button
            className={`booking-calendar__view-btn ${viewType === 'day' ? 'active' : ''}`}
            onClick={() => setViewType('day')}
          >
            วัน
          </button>
        </div>
      </div>

      <div className="booking-calendar__content">
        {viewType === 'month' && renderMonthView()}
        {viewType === 'week' && renderWeekView()}
        {viewType === 'day' && renderDayView()}
      </div>

      {showLegend && (
        <div className="booking-calendar__legend">
          {Object.entries(bookingTypes).map(([key, value]) => (
            <div key={key} className="booking-calendar__legend-item">
              <span 
                className="booking-calendar__legend-dot"
                style={{ backgroundColor: value.color }}
              />
              <span className="booking-calendar__legend-label">{value.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="booking-calendar__summary">
        <div className="booking-calendar__summary-item">
          <span className="booking-calendar__summary-label">วันนี้</span>
          <span className="booking-calendar__summary-value">{todayBookings.length} นัดหมาย</span>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
