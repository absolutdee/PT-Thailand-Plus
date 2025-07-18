// Frontend/components/shared/booking/BookingCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate, formatTime, getBookingStatusColor, getBookingStatusText } from '../../../utils/helpers';
import './BookingCard.scss';

const BookingCard = ({
  booking,
  viewType = 'customer', // 'customer' | 'trainer'
  onCancel,
  onConfirm,
  onReschedule,
  onViewDetails,
  onStartSession,
  showActions = true,
  compact = false
}) => {
  const isUpcoming = new Date(booking.dateTime) > new Date();
  const canCancel = isUpcoming && booking.status === 'confirmed';
  const canConfirm = booking.status === 'pending';
  const canReschedule = isUpcoming && ['pending', 'confirmed'].includes(booking.status);
  const canStartSession = booking.status === 'confirmed' && 
    new Date(booking.dateTime) <= new Date() && 
    new Date(booking.dateTime) > new Date(Date.now() - 24 * 60 * 60 * 1000);

  const user = viewType === 'customer' ? booking.trainer : booking.customer;

  if (compact) {
    return (
      <div className="booking-card booking-card--compact" onClick={onViewDetails}>
        <div className="booking-card__time">
          <span className="booking-card__time-text">{formatTime(booking.dateTime)}</span>
        </div>
        <div className="booking-card__info">
          <h4 className="booking-card__title">{user.name}</h4>
          <p className="booking-card__service">{booking.packageName}</p>
        </div>
        <div className={`booking-card__status booking-card__status--${getBookingStatusColor(booking.status)}`}>
          {getBookingStatusText(booking.status)}
        </div>
      </div>
    );
  }

  return (
    <div className="booking-card">
      <div className="booking-card__header">
        <div className="booking-card__date-time">
          <div className="booking-card__date">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.5 0a.5.5 0 01.5.5V1h8V.5a.5.5 0 011 0V1h1a2 2 0 012 2v11a2 2 0 01-2 2H2a2 2 0 01-2-2V3a2 2 0 012-2h1V.5a.5.5 0 01.5-.5zM1 4v10a1 1 0 001 1h12a1 1 0 001-1V4H1z"/>
            </svg>
            <span>{formatDate(booking.dateTime, 'DD MMM YYYY')}</span>
          </div>
          <div className="booking-card__time">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3.5a.5.5 0 00-1 0V9a.5.5 0 00.252.434l3.5 2a.5.5 0 00.496-.868L8 8.71V3.5z"/>
              <path d="M8 16A8 8 0 108 0a8 8 0 000 16zm7-8A7 7 0 111 8a7 7 0 0114 0z"/>
            </svg>
            <span>{formatTime(booking.dateTime)} ({booking.duration} นาที)</span>
          </div>
        </div>
        
        <div className={`booking-card__status booking-card__status--${getBookingStatusColor(booking.status)}`}>
          {getBookingStatusText(booking.status)}
        </div>
      </div>

      <div className="booking-card__body">
        <div className="booking-card__user">
          <img 
            src={user.profileImage || '/images/default-avatar.jpg'} 
            alt={user.name}
            className="booking-card__user-avatar"
          />
          <div className="booking-card__user-info">
            <Link to={`/${viewType === 'customer' ? 'trainers' : 'profile'}/${user.id}`} className="booking-card__user-name">
              {user.name}
            </Link>
            <p className="booking-card__user-role">
              {viewType === 'customer' ? 'เทรนเนอร์' : 'ลูกค้า'}
            </p>
          </div>
        </div>

        <div className="booking-card__details">
          <div className="booking-card__detail">
            <span className="booking-card__detail-label">แพ็คเกจ:</span>
            <span className="booking-card__detail-value">{booking.packageName}</span>
          </div>
          
          {booking.location && (
            <div className="booking-card__detail">
              <span className="booking-card__detail-label">สถานที่:</span>
              <span className="booking-card__detail-value">{booking.location}</span>
            </div>
          )}
          
          {booking.sessionNumber && (
            <div className="booking-card__detail">
              <span className="booking-card__detail-label">เซสชันที่:</span>
              <span className="booking-card__detail-value">
                {booking.sessionNumber}/{booking.totalSessions}
              </span>
            </div>
          )}

          {booking.note && (
            <div className="booking-card__detail booking-card__detail--full">
              <span className="booking-card__detail-label">หมายเหตุ:</span>
              <span className="booking-card__detail-value">{booking.note}</span>
            </div>
          )}
        </div>
      </div>

      {showActions && (
        <div className="booking-card__footer">
          <div className="booking-card__actions">
            {canStartSession && viewType === 'trainer' && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onStartSession?.(booking)}
              >
                เริ่มเซสชัน
              </button>
            )}
            
            {canConfirm && viewType === 'trainer' && (
              <button
                className="btn btn-success btn-sm"
                onClick={() => onConfirm?.(booking)}
              >
                ยืนยัน
              </button>
            )}
            
            {canReschedule && (
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => onReschedule?.(booking)}
              >
                เลื่อนนัด
              </button>
            )}
            
            {canCancel && (
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={() => onCancel?.(booking)}
              >
                ยกเลิก
              </button>
            )}
            
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => onViewDetails?.(booking)}
            >
              รายละเอียด
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCard;
