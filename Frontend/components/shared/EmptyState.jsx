// Frontend/components/shared/EmptyState.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './EmptyState.scss';

const EmptyState = ({
  icon,
  title,
  message,
  actionText,
  actionLink,
  onAction,
  image,
  size = 'medium'
}) => {
  const defaultIcons = {
    search: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="28" cy="28" r="20" stroke="currentColor" strokeWidth="4"/>
        <path d="M42 42L54 54" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      </svg>
    ),
    bookings: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect x="8" y="12" width="48" height="44" rx="4" stroke="currentColor" strokeWidth="4"/>
        <path d="M8 24H56" stroke="currentColor" strokeWidth="4"/>
        <path d="M20 4V12M44 4V12" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        <rect x="24" y="36" width="16" height="8" rx="2" fill="currentColor"/>
      </svg>
    ),
    messages: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <path d="M8 20C8 15.5817 11.5817 12 16 12H48C52.4183 12 56 15.5817 56 20V36C56 40.4183 52.4183 44 48 44H16C11.5817 44 8 40.4183 8 36V20Z" stroke="currentColor" strokeWidth="4"/>
        <path d="M8 20L32 32L56 20" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      </svg>
    ),
    trainers: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="20" r="12" stroke="currentColor" strokeWidth="4"/>
        <path d="M16 52C16 43.1634 23.1634 36 32 36C40.8366 36 48 43.1634 48 52" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      </svg>
    ),
    error: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="4"/>
        <path d="M32 20V32M32 44H32.01" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      </svg>
    )
  };

  const getIcon = () => {
    if (icon) return icon;
    if (image) return <img src={image} alt="Empty state" className="empty-state__image" />;
    return defaultIcons.search;
  };

  return (
    <div className={`empty-state empty-state--${size}`}>
      <div className="empty-state__icon">
        {getIcon()}
      </div>
      
      <h3 className="empty-state__title">
        {title || 'ไม่พบข้อมูล'}
      </h3>
      
      <p className="empty-state__message">
        {message || 'ไม่พบข้อมูลที่คุณกำลังค้นหา'}
      </p>
      
      {(actionText && (actionLink || onAction)) && (
        <div className="empty-state__action">
          {actionLink ? (
            <Link to={actionLink} className="btn btn-primary">
              {actionText}
            </Link>
          ) : (
            <button onClick={onAction} className="btn btn-primary">
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
