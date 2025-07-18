// Frontend/components/shared/LoadingSpinner.jsx
import React from 'react';
import './LoadingSpinner.scss';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  fullScreen = false,
  overlay = false,
  text = null 
}) => {
  const spinnerClass = `loading-spinner loading-spinner--${size} loading-spinner--${color}`;
  
  const spinner = (
    <div className="loading-spinner-container">
      <div className={spinnerClass}>
        <div className="loading-spinner__circle"></div>
        <div className="loading-spinner__circle"></div>
        <div className="loading-spinner__circle"></div>
        <div className="loading-spinner__circle"></div>
      </div>
      {text && <p className="loading-spinner__text">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-spinner-fullscreen">
        {spinner}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="loading-spinner-overlay">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
