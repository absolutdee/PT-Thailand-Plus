
// Frontend/components/shared/booking/TimeSlotPicker.jsx
import React, { useState, useMemo } from 'react';
import { format, addMinutes, isBefore, isAfter, parseISO } from 'date-fns';
import './TimeSlotPicker.scss';

const TimeSlotPicker = ({
  date,
  availableSlots = [],
  selectedSlot,
  onSelectSlot,
  duration = 60, // minutes
  interval = 30, // minutes
  startHour = 6,
  endHour = 22,
  bookedSlots = [],
  minAdvanceBooking = 24, // hours
  maxAdvanceBooking = 30 * 24, // hours
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('morning'); // 'morning' | 'afternoon' | 'evening'

  const periods = {
    morning: { label: 'เช้า', start: 6, end: 12 },
    afternoon: { label: 'บ่าย', start: 12, end: 18 },
    evening: { label: 'เย็น', start: 18, end: 22 }
  };

  const generateTimeSlots = useMemo(() => {
    if (!date) return [];

    const slots = [];
    const selectedDate = new Date(date);
    const now = new Date();
    const minBookingTime = addMinutes(now, minAdvanceBooking * 60);
    const maxBookingTime = addMinutes(now, maxAdvanceBooking);

    // Generate slots for selected period
    const period = periods[selectedPeriod];
    const startMinutes = period.start * 60;
    const endMinutes = period.end * 60;

    for (let minutes = startMinutes; minutes < endMinutes; minutes += interval) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hours, mins, 0, 0);
      
      const slotEndTime = addMinutes(slotTime, duration);
      const timeString = format(slotTime, 'HH:mm');

      // Check availability
      let isAvailable = true;
      let reason = '';

      // Check if slot is in the past or too soon
      if (isBefore(slotTime, minBookingTime)) {
        isAvailable = false;
        reason = 'ผ่านมาแล้ว';
      }
      // Check if slot is too far in the future
      else if (isAfter(slotTime, maxBookingTime)) {
        isAvailable = false;
        reason = 'เกินระยะจอง';
      }
      // Check if slot is booked
      else if (bookedSlots.some(booked => {
        const bookedStart = parseISO(booked.startTime);
        const bookedEnd = parseISO(booked.endTime);
        return (slotTime >= bookedStart && slotTime < bookedEnd) ||
               (slotEndTime > bookedStart && slotEndTime <= bookedEnd);
      })) {
        isAvailable = false;
        reason = 'จองแล้ว';
      }
      // Check if slot is in available slots (if provided)
      else if (availableSlots.length > 0 && !availableSlots.includes(timeString)) {
        isAvailable = false;
        reason = 'ไม่ว่าง';
      }

      slots.push({
        time: timeString,
        dateTime: slotTime,
        isAvailable,
        reason,
        isPast: isBefore(slotTime, now)
      });
    }

    return slots;
  }, [date, selectedPeriod, availableSlots, bookedSlots, duration, interval, minAdvanceBooking, maxAdvanceBooking]);

  const availableCount = useMemo(() => {
    return generateTimeSlots.filter(slot => slot.isAvailable).length;
  }, [generateTimeSlots]);

  const handleSlotClick = (slot) => {
    if (slot.isAvailable) {
      onSelectSlot(slot);
    }
  };

  return (
    <div className="time-slot-picker">
      <div className="time-slot-picker__header">
        <h3 className="time-slot-picker__title">
          เลือกเวลา
          {date && (
            <span className="time-slot-picker__date">
              {format(new Date(date), 'dd/MM/yyyy')}
            </span>
          )}
        </h3>
        
        <div className="time-slot-picker__summary">
          ว่าง {availableCount} ช่วงเวลา
        </div>
      </div>

      <div className="time-slot-picker__periods">
        {Object.entries(periods).map(([key, period]) => (
          <button
            key={key}
            className={`time-slot-picker__period ${selectedPeriod === key ? 'active' : ''}`}
            onClick={() => setSelectedPeriod(key)}
          >
            <span className="time-slot-picker__period-label">{period.label}</span>
            <span className="time-slot-picker__period-time">
              {period.start}:00 - {period.end}:00
            </span>
          </button>
        ))}
      </div>

      <div className="time-slot-picker__slots">
        {generateTimeSlots.length === 0 ? (
          <div className="time-slot-picker__empty">
            ไม่มีช่วงเวลาว่าง
          </div>
        ) : (
          <div className="time-slot-picker__grid">
            {generateTimeSlots.map((slot, index) => (
              <button
                key={index}
                className={`
                  time-slot-picker__slot
                  ${!slot.isAvailable ? 'time-slot-picker__slot--disabled' : ''}
                  ${selectedSlot?.time === slot.time ? 'time-slot-picker__slot--selected' : ''}
                `.trim()}
                onClick={() => handleSlotClick(slot)}
                disabled={!slot.isAvailable}
              >
                <span className="time-slot-picker__slot-time">{slot.time}</span>
                {!slot.isAvailable && (
                  <span className="time-slot-picker__slot-reason">{slot.reason}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="time-slot-picker__legend">
        <div className="time-slot-picker__legend-item">
          <span className="time-slot-picker__legend-dot time-slot-picker__legend-dot--available"></span>
          <span>ว่าง</span>
        </div>
        <div className="time-slot-picker__legend-item">
          <span className="time-slot-picker__legend-dot time-slot-picker__legend-dot--selected"></span>
          <span>เลือกแล้ว</span>
        </div>
        <div className="time-slot-picker__legend-item">
          <span className="time-slot-picker__legend-dot time-slot-picker__legend-dot--disabled"></span>
          <span>ไม่ว่าง</span>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotPicker;
