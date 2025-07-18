
// Frontend/components/shared/booking/SessionCard.jsx
import React from 'react';
import { formatDate, formatTime } from '../../../utils/helpers';
import StarRating from '../StarRating';
import './SessionCard.scss';

const SessionCard = ({
  session,
  viewType = 'customer', // 'customer' | 'trainer'
  onViewDetails,
  onAddNote,
  onViewWorkout,
  showActions = true,
  compact = false
}) => {
  const user = viewType === 'customer' ? session.trainer : session.customer;

  const renderMetrics = () => {
    if (!session.metrics) return null;

    return (
      <div className="session-card__metrics">
        {session.metrics.caloriesBurned && (
          <div className="session-card__metric">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 16c3.314 0 6-2 6-5.5 0-1.5-.5-4-2.5-6 .25 1.5-1.25 2-1.25 2C11 4 9 .5 6 0c.357 2 .5 4-2 6-1.25 1-2 2.729-2 4.5C2 14 4.686 16 8 16zm0-1c-1.657 0-3-1-3-2.75 0-.75.25-2 1.25-3C6.125 10 7 10.5 7 10.5c-.375-1.25.5-3.25 2-3.5-.179 1-.25 2 1 3 .625.5 1 1.364 1 2.25C11 14 9.657 15 8 15z"/>
            </svg>
            <span>{session.metrics.caloriesBurned} kcal</span>
          </div>
        )}
        
        {session.metrics.duration && (
          <div className="session-card__metric">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3.5a.5.5 0 00-1 0V9a.5.5 0 00.252.434l3.5 2a.5.5 0 00.496-.868L8 8.71V3.5z"/>
              <path d="M8 16A8 8 0 108 0a8 8 0 000 16zm7-8A7 7 0 111 8a7 7 0 0114 0z"/>
            </svg>
            <span>{session.metrics.duration} นาที</span>
          </div>
        )}
        
        {session.metrics.heartRate && (
          <div className="session-card__metric">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
            </svg>
            <span>{session.metrics.heartRate} bpm</span>
          </div>
        )}
      </div>
    );
  };

  if (compact) {
    return (
      <div className="session-card session-card--compact" onClick={onViewDetails}>
        <div className="session-card__date-compact">
          <span className="session-card__day">{formatDate(session.date, 'DD')}</span>
          <span className="session-card__month">{formatDate(session.date, 'MMM')}</span>
        </div>
        <div className="session-card__info">
          <h4 className="session-card__title">{session.workoutType}</h4>
          <p className="session-card__trainer">{user.name}</p>
        </div>
        {renderMetrics()}
      </div>
    );
  }

  return (
    <div className="session-card">
      <div className="session-card__header">
        <div className="session-card__date-time">
          <span className="session-card__date">{formatDate(session.date, 'DD MMM YYYY')}</span>
          <span className="session-card__time">{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
        </div>
        
        {session.rating && (
          <StarRating value={session.rating} readOnly size="small" />
        )}
      </div>

      <div className="session-card__body">
        <div className="session-card__user">
          <img 
            src={user.profileImage || '/images/default-avatar.jpg'} 
            alt={user.name}
            className="session-card__user-avatar"
          />
          <div className="session-card__user-info">
            <h4 className="session-card__user-name">{user.name}</h4>
            <p className="session-card__user-role">
              {viewType === 'customer' ? 'เทรนเนอร์' : 'ลูกค้า'}
            </p>
          </div>
        </div>

        <div className="session-card__details">
          <div className="session-card__workout">
            <h5 className="session-card__workout-type">{session.workoutType}</h5>
            <p className="session-card__package">{session.packageName}</p>
          </div>

          {renderMetrics()}

          {session.exercises && session.exercises.length > 0 && (
            <div className="session-card__exercises">
              <h6 className="session-card__exercises-title">แบบฝึกหัด:</h6>
              <ul className="session-card__exercises-list">
                {session.exercises.slice(0, 3).map((exercise, index) => (
                  <li key={index}>
                    {exercise.name} - {exercise.sets} x {exercise.reps}
                  </li>
                ))}
                {session.exercises.length > 3 && (
                  <li className="session-card__more">
                    +{session.exercises.length - 3} แบบฝึกหัดอื่นๆ
                  </li>
                )}
              </ul>
            </div>
          )}

          {session.notes && (
            <div className="session-card__notes">
              <h6 className="session-card__notes-title">บันทึก:</h6>
              <p className="session-card__notes-text">{session.notes}</p>
            </div>
          )}
        </div>
      </div>

      {showActions && (
        <div className="session-card__footer">
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => onViewWorkout?.(session)}
          >
            ดูรายละเอียด
          </button>
          
          {viewType === 'trainer' && !session.notes && (
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => onAddNote?.(session)}
            >
              เพิ่มบันทึก
            </button>
          )}
          
          {viewType === 'customer' && !session.rating && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onViewDetails?.(session)}
            >
              ให้คะแนน
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionCard;
