
// Frontend/components/shared/chat/TypingIndicator.jsx
import React from 'react';
import './TypingIndicator.scss';

const TypingIndicator = ({ user }) => {
  return (
    <div className="typing-indicator">
      <img 
        src={user?.profileImage || '/images/default-avatar.jpg'} 
        alt={user?.name}
        className="typing-indicator__avatar"
      />
      <div className="typing-indicator__bubble">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};

export default TypingIndicator;
