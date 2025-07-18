/ LoadingWrapper.jsx
import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingWrapper = ({ 
  loading, 
  children, 
  size = 'md',
  text = 'กำลังโหลด...',
  overlay = false,
  className = '' 
}) => {
  if (!loading) {
    return children;
  }

  const spinner = (
    <div className={`loading-wrapper ${className}`}>
      <Spinner 
        animation="border" 
        variant="primary" 
        size={size === 'sm' ? 'sm' : undefined}
      />
      {text && <p className="mt-2 mb-0">{text}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div className="position-relative">
        {children}
        <div className="loading-overlay">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingWrapper;
