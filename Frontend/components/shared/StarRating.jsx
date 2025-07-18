// Frontend/components/shared/StarRating.jsx
import React, { useState } from 'react';
import './StarRating.scss';

const StarRating = ({ 
  value = 0, 
  onChange, 
  readOnly = false, 
  size = 'medium',
  showValue = false,
  max = 5,
  allowHalf = true
}) => {
  const [hoverValue, setHoverValue] = useState(null);

  const handleMouseMove = (e, index) => {
    if (readOnly) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    
    if (allowHalf) {
      const newValue = percent < 0.5 ? index + 0.5 : index + 1;
      setHoverValue(newValue);
    } else {
      setHoverValue(index + 1);
    }
  };

  const handleClick = (e, index) => {
    if (readOnly || !onChange) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    
    if (allowHalf) {
      const newValue = percent < 0.5 ? index + 0.5 : index + 1;
      onChange(newValue);
    } else {
      onChange(index + 1);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  const renderStar = (index) => {
    const filled = displayValue > index;
    const halfFilled = allowHalf && displayValue === index + 0.5;

    return (
      <div
        key={index}
        className="star-rating__star-wrapper"
        onMouseMove={(e) => handleMouseMove(e, index)}
        onClick={(e) => handleClick(e, index)}
      >
        <svg
          className={`star-rating__star ${filled || halfFilled ? 'star-rating__star--filled' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
        >
          <defs>
            <linearGradient id={`star-gradient-${index}`}>
              <stop offset={halfFilled ? '50%' : '100%'} stopColor="#ffc107" />
              <stop offset={halfFilled ? '50%' : '100%'} stopColor="#e0e0e0" />
            </linearGradient>
          </defs>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={halfFilled ? `url(#star-gradient-${index})` : filled ? '#ffc107' : '#e0e0e0'}
            stroke={filled || halfFilled ? '#ffc107' : '#e0e0e0'}
            strokeWidth="1"
          />
        </svg>
      </div>
    );
  };

  return (
    <div 
      className={`star-rating star-rating--${size} ${readOnly ? 'star-rating--readonly' : ''}`}
      onMouseLeave={handleMouseLeave}
    >
      <div className="star-rating__stars">
        {Array.from({ length: max }, (_, i) => renderStar(i))}
      </div>
      {showValue && (
        <span className="star-rating__value">
          {displayValue.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
