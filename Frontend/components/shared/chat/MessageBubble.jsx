
// Frontend/components/shared/chat/MessageBubble.jsx
import React, { useState } from 'react';
import { formatTime, getRelativeTime } from '../../../utils/helpers';
import './MessageBubble.scss';

const MessageBubble = ({
  message,
  isOwn = false,
  showAvatar = true,
  user
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="message-bubble__image">
            {!isImageLoaded && (
              <div className="message-bubble__image-placeholder">
                <div className="message-bubble__image-spinner" />
              </div>
            )}
            <img 
              src={message.content} 
              alt="Shared image"
              onLoad={() => setIsImageLoaded(true)}
              style={{ display: isImageLoaded ? 'block' : 'none' }}
            />
          </div>
        );

      case 'file':
        return (
          <a href={message.content.url} className="message-bubble__file" download>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            <div className="message-bubble__file-info">
              <span className="message-bubble__file-name">{message.content.name}</span>
              <span className="message-bubble__file-size">{message.content.size}</span>
            </div>
          </a>
        );

      case 'voice':
        return (
          <div className="message-bubble__voice">
            <button className="message-bubble__voice-play">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.717 3.55A.5.5 0 017 4v8a.5.5 0 01-.812.39L3.825 10.5H1.5A.5.5 0 011 10V6a.5.5 0 01.5-.5h2.325l2.363-1.89a.5.5 0 01.529-.06z"/>
              </svg>
            </button>
            <div className="message-bubble__voice-wave">
              {[...Array(20)].map((_, i) => (
                <span key={i} style={{ height: `${Math.random() * 20 + 10}px` }} />
              ))}
            </div>
            <span className="message-bubble__voice-duration">{message.content.duration}</span>
          </div>
        );

      case 'location':
        return (
          <div className="message-bubble__location">
            <img 
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${message.content.lat},${message.content.lng}&zoom=15&size=200x150&markers=${message.content.lat},${message.content.lng}`}
              alt="Location"
            />
            <p>{message.content.address}</p>
          </div>
        );

      default:
        return <p className="message-bubble__text">{message.content}</p>;
    }
  };

  return (
    <div 
      className={`message-bubble ${isOwn ? 'message-bubble--own' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isOwn && showAvatar && (
        <img 
          src={user?.profileImage || '/images/default-avatar.jpg'} 
          alt={user?.name}
          className="message-bubble__avatar"
        />
      )}
      
      <div className="message-bubble__content">
        <div className="message-bubble__wrapper">
          {renderMessageContent()}
          
          <div className="message-bubble__meta">
            <span className="message-bubble__time">
              {formatTime(message.createdAt)}
            </span>
            {isOwn && (
              <span className="message-bubble__status">
                {message.read ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M12.354 4.354a.5.5 0 00-.708-.708L5 10.293 1.854 7.146a.5.5 0 10-.708.708l3.5 3.5a.5.5 0 00.708 0l7-7zm-4.208 7l-.896-.897.707-.707.543.543 6.646-6.647a.5.5 0 01.708.708l-7 7a.5.5 0 01-.708 0z"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M10.97 4.97a.75.75 0 011.07 1.05l-3.99 4.99a.75.75 0 01-1.08.02L4.324 8.384a.75.75 0 111.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 01.02-.022z"/>
                  </svg>
                )}
              </span>
            )}
          </div>
        </div>

        {showActions && (
          <div className="message-bubble__actions">
            <button className="message-bubble__action" title="ตอบกลับ">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.83 5.146a.5.5 0 000 .708L7.975 8l-2.147 2.146a.5.5 0 00.707.708l2.147-2.147a.5.5 0 000-.707L6.537 5.854a.5.5 0 00-.707 0z"/>
                <path d="M1 8a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9A.5.5 0 011 8z"/>
              </svg>
            </button>
            <button className="message-bubble__action" title="คัดลอก">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 1.5H3a2 2 0 00-2 2V14a2 2 0 002 2h10a2 2 0 002-2V3.5a2 2 0 00-2-2h-1v1h1a1 1 0 011 1V14a1 1 0 01-1 1H3a1 1 0 01-1-1V3.5a1 1 0 011-1h1v-1z"/>
                <path d="M9.5 1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5h3zm-3-1A1.5 1.5 0 005 1.5v1A1.5 1.5 0 006.5 4h3A1.5 1.5 0 0011 2.5v-1A1.5 1.5 0 009.5 0h-3z"/>
              </svg>
            </button>
            <button className="message-bubble__action" title="ลบ">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {!isOwn && !showAvatar && <div className="message-bubble__avatar-space" />}
    </div>
  );
};

export default MessageBubble;
