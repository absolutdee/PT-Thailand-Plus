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

// Frontend/components/shared/LoadingSpinner.scss
.loading-spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.loading-spinner {
  display: inline-block;
  position: relative;
  
  &--small {
    width: 32px;
    height: 32px;
  }
  
  &--medium {
    width: 48px;
    height: 48px;
  }
  
  &--large {
    width: 64px;
    height: 64px;
  }

  &__circle {
    box-sizing: border-box;
    display: block;
    position: absolute;
    border-radius: 50%;
    animation: loading-spinner-animation 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    
    &:nth-child(1) {
      animation-delay: -0.45s;
    }
    
    &:nth-child(2) {
      animation-delay: -0.3s;
    }
    
    &:nth-child(3) {
      animation-delay: -0.15s;
    }
  }
  
  &--primary &__circle {
    border: 3px solid #232956;
    border-color: #232956 transparent transparent transparent;
  }
  
  &--secondary &__circle {
    border: 3px solid #df2528;
    border-color: #df2528 transparent transparent transparent;
  }
  
  &--white &__circle {
    border: 3px solid #ffffff;
    border-color: #ffffff transparent transparent transparent;
  }
}

.loading-spinner--small .loading-spinner__circle {
  width: 28px;
  height: 28px;
  margin: 2px;
  border-width: 2px;
}

.loading-spinner--medium .loading-spinner__circle {
  width: 44px;
  height: 44px;
  margin: 2px;
  border-width: 3px;
}

.loading-spinner--large .loading-spinner__circle {
  width: 56px;
  height: 56px;
  margin: 4px;
  border-width: 4px;
}

.loading-spinner__text {
  margin-top: 16px;
  color: #666;
  font-size: 14px;
  text-align: center;
}

.loading-spinner-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.95);
  z-index: 9999;
}

.loading-spinner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

@keyframes loading-spinner-animation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
