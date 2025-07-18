// Frontend/components/shared/chat/ChatWindow.jsx
import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { useChat } from '../../../store/contexts/ChatContext';
import { formatDate, isToday, getRelativeTime } from '../../../utils/helpers';
import './ChatWindow.scss';

const ChatWindow = ({
  conversationId,
  onClose,
  isFullscreen = false,
  showHeader = true
}) => {
  const { 
    getConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    getTypingUsers,
    isUserOnline
  } = useChat();
  
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const conversation = getConversation(conversationId);
  const typingUsers = getTypingUsers(conversationId);
  const otherUser = conversation?.participants?.find(p => p.id !== conversation.currentUserId);

  useEffect(() => {
    markAsRead(conversationId);
    scrollToBottom();
  }, [conversationId, conversation?.messages?.length]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        stopTyping(conversationId);
      }
    };
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      startTyping(conversationId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(conversationId);
    }, 1000);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if (!message.trim()) return;

    try {
      await sendMessage(conversationId, message.trim());
      setMessage('');
      setIsTyping(false);
      stopTyping(conversationId);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Handle file upload logic here
    console.log('File upload:', file);
  };

  const renderMessageDate = (message, index, messages) => {
    const currentDate = new Date(message.createdAt);
    const previousMessage = index > 0 ? messages[index - 1] : null;
    
    if (!previousMessage || 
        !isToday(new Date(previousMessage.createdAt)) || 
        currentDate.toDateString() !== new Date(previousMessage.createdAt).toDateString()) {
      return (
        <div className="chat-window__date-divider">
          <span>{isToday(currentDate) ? 'วันนี้' : formatDate(currentDate, 'DD MMM YYYY')}</span>
        </div>
      );
    }
    
    return null;
  };

  if (!conversation) {
    return (
      <div className="chat-window__empty">
        <p>ไม่พบการสนทนา</p>
      </div>
    );
  }

  return (
    <div className={`chat-window ${isFullscreen ? 'chat-window--fullscreen' : ''}`}>
      {showHeader && (
        <div className="chat-window__header">
          <div className="chat-window__user">
            <div className="chat-window__user-avatar">
              <img 
                src={otherUser?.profileImage || '/images/default-avatar.jpg'} 
                alt={otherUser?.name}
              />
              {isUserOnline(otherUser?.id) && (
                <span className="chat-window__online-indicator"></span>
              )}
            </div>
            <div className="chat-window__user-info">
              <h4 className="chat-window__user-name">{otherUser?.name}</h4>
              <p className="chat-window__user-status">
                {typingUsers.length > 0 ? 'กำลังพิมพ์...' : 
                 isUserOnline(otherUser?.id) ? 'ออนไลน์' : 
                 `ออนไลน์ล่าสุด ${getRelativeTime(otherUser?.lastSeen)}`}
              </p>
            </div>
          </div>
          
          <div className="chat-window__actions">
            <button className="chat-window__action" title="โทร">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
              </svg>
            </button>
            <button className="chat-window__action" title="วิดีโอคอล">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
              </svg>
            </button>
            {onClose && (
              <button className="chat-window__action" onClick={onClose} title="ปิด">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="chat-window__messages">
        {conversation.messages.map((msg, index) => (
          <React.Fragment key={msg.id}>
            {renderMessageDate(msg, index, conversation.messages)}
            <MessageBubble
              message={msg}
              isOwn={msg.senderId === conversation.currentUserId}
              showAvatar={index === 0 || conversation.messages[index - 1].senderId !== msg.senderId}
              user={msg.senderId === conversation.currentUserId ? null : otherUser}
            />
          </React.Fragment>
        ))}
        
        {typingUsers.length > 0 && (
          <TypingIndicator user={otherUser} />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-window__input-area" onSubmit={handleSendMessage}>
        <div className="chat-window__input-actions">
          <label className="chat-window__file-input">
            <input
              type="file"
              onChange={handleFileUpload}
              accept="image/*,video/*,.pdf,.doc,.docx"
              style={{ display: 'none' }}
            />
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a2 2 0 01-2 2H1.89A7.002 7.002 0 018 2v2zm2 0v2a7.002 7.002 0 016.11 7H15a2 2 0 01-2-2V7a3 3 0 00-3-3z" clipRule="evenodd"/>
              <path d="M8 12a1 1 0 00-1 1v2H5a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2H9v-2a1 1 0 00-1-1z"/>
            </svg>
          </label>
          
          <button
            type="button"
            className="chat-window__emoji-button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>

        <textarea
          ref={inputRef}
          value={message}
          onChange={handleTyping}
          onKeyPress={handleKeyPress}
          placeholder="พิมพ์ข้อความ..."
          className="chat-window__input"
          rows="1"
        />

        <button
          type="submit"
          className="chat-window__send-button"
          disabled={!message.trim()}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
          </svg>
        </button>

        {showEmojiPicker && (
          <div className="chat-window__emoji-picker">
            {['😊', '😂', '❤️', '👍', '😭', '🙏', '😘', '🥰', '😍', '😢'].map(emoji => (
              <button
                key={emoji}
                type="button"
                className="chat-window__emoji"
                onClick={() => handleEmojiSelect(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatWindow;
