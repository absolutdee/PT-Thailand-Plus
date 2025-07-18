
// Frontend/components/shared/forms/FormDatePicker.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  format, 
  parse, 
  isValid, 
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
  isBefore,
  isAfter
} from 'date-fns';
import { th } from 'date-fns/locale';
import './FormDatePicker.scss';

const FormDatePicker = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder = 'เลือกวันที่',
  required = false,
  disabled = false,
  readOnly = false,
  minDate,
  maxDate,
  disabledDates = [],
  showTime = false,
  timeInterval = 30,
  dateFormat = 'dd/MM/yyyy',
  timeFormat = 'HH:mm',
  size = 'medium',
  variant = 'default',
  hint,
  icon,
  clearable = true,
  onFocus
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('00:00');
  const [isFocused, setIsFocused] = useState(false);
  const datePickerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value && showTime) {
      const dateObj = parse(value, `${dateFormat} ${timeFormat}`, new Date());
      if (isValid(dateObj)) {
        setSelectedTime(format(dateObj, timeFormat));
      }
    }
  }, [value, showTime, dateFormat, timeFormat]);

  const handleDateSelect = (date) => {
    let formattedValue = format(date, dateFormat);
    
    if (showTime) {
      formattedValue = `${formattedValue} ${selectedTime}`;
    }
    
    onChange({ target: { name, value: formattedValue } });
    
    if (!showTime) {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (time) => {
    setSelectedTime(time);
    
    if (value) {
      const dateStr = value.split(' ')[0];
      const formattedValue = `${dateStr} ${time}`;
      onChange({ target: { name, value: formattedValue } });
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ target: { name, value: '' } });
    setSelectedTime('00:00');
  };

  const handleInputClick = () => {
    if (!disabled && !readOnly) {
      setIsOpen(!isOpen);
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dateStr = format(cloneDay, dateFormat);
        const isDisabled = 
          (minDate && isBefore(cloneDay, minDate)) ||
          (maxDate && isAfter(cloneDay, maxDate)) ||
          disabledDates.includes(dateStr);

        days.push({
          date: cloneDay,
          dateStr,
          isCurrentMonth: isSameMonth(cloneDay, monthStart),
          isToday: isToday(cloneDay),
          isSelected: value && isSameDay(cloneDay, parse(value.split(' ')[0], dateFormat, new Date())),
          isDisabled
        });

        day = addDays(day, 1);
      }
      rows.push(days);
      days = [];
    }

    return rows;
  };

  const generateTimeOptions = () => {
    const times = [];
    const totalMinutes = 24 * 60;
    
    for (let minutes = 0; minutes < totalMinutes; minutes += timeInterval) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const time = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      times.push(time);
    }
    
    return times;
  };

  const inputClasses = `
    form-date-picker__input
    form-date-picker__input--${size}
    form-date-picker__input--${variant}
    ${error ? 'form-date-picker__input--error' : ''}
    ${icon ? 'form-date-picker__input--with-icon' : ''}
  `.trim();

  return (
    <div className="form-date-picker" ref={datePickerRef}>
      {label && (
        <label className="form-date-picker__label" htmlFor={name}>
          {label}
          {required && <span className="form-date-picker__required">*</span>}
        </label>
      )}

      <div className="form-date-picker__wrapper">
        {icon && <div className="form-date-picker__icon">{icon}</div>}
        
        <input
          ref={inputRef}
          id={name}
          type="text"
          value={value || ''}
          onClick={handleInputClick}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={() => {}} // Controlled by date picker
          className={inputClasses}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
        />

        <div className="form-date-picker__actions">
          {clearable && value && (
            <button
              type="button"
              className="form-date-picker__clear"
              onClick={handleClear}
              tabIndex={-1}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
              </svg>
            </button>
          )}
          
          <div className="form-date-picker__calendar-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 7h12v9H4V7z" clipRule="evenodd"/>
            </svg>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="form-date-picker__dropdown">
          <div className="form-date-picker__calendar">
            <div className="form-date-picker__header">
              <button
                type="button"
                className="form-date-picker__nav-btn"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.354 1.646a.5.5 0 010 .708L5.707 8l5.647 5.646a.5.5 0 01-.708.708l-6-6a.5.5 0 010-.708l6-6a.5.5 0 01.708 0z"/>
                </svg>
              </button>
              
              <div className="form-date-picker__month-year">
                {format(currentMonth, 'MMMM yyyy', { locale: th })}
              </div>
              
              <button
                type="button"
                className="form-date-picker__nav-btn"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.646 1.646a.5.5 0 01.708 0l6 6a.5.5 0 010 .708l-6 6a.5.5 0 01-.708-.708L10.293 8 4.646 2.354a.5.5 0 010-.708z"/>
                </svg>
              </button>
            </div>

            <div className="form-date-picker__weekdays">
              {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, index) => (
                <div key={index} className="form-date-picker__weekday">
                  {day}
                </div>
              ))}
            </div>

            <div className="form-date-picker__days">
              {generateCalendarDays().map((week, weekIndex) => (
                <div key={weekIndex} className="form-date-picker__week">
                  {week.map((day, dayIndex) => (
                    <button
                      key={dayIndex}
                      type="button"
                      className={`
                        form-date-picker__day
                        ${!day.isCurrentMonth ? 'form-date-picker__day--other-month' : ''}
                        ${day.isToday ? 'form-date-picker__day--today' : ''}
                        ${day.isSelected ? 'form-date-picker__day--selected' : ''}
                        ${day.isDisabled ? 'form-date-picker__day--disabled' : ''}
                      `.trim()}
                      onClick={() => !day.isDisabled && handleDateSelect(day.date)}
                      disabled={day.isDisabled}
                    >
                      {format(day.date, 'd')}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {showTime && (
              <div className="form-date-picker__time">
                <label className="form-date-picker__time-label">เวลา:</label>
                <select
                  className="form-date-picker__time-select"
                  value={selectedTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                >
                  {generateTimeOptions().map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {hint && !error && <p className="form-date-picker__hint">{hint}</p>}
      {error && <p className="form-date-picker__error">{error}</p>}
    </div>
  );
};

export default FormDatePicker;
