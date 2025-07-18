// Frontend/components/shared/chat/ChatList.jsx
import React, { useState } from 'react';
import { useChat } from '../../../store/contexts/ChatContext';
import { formatTime, getRelativeTime, truncateText } from '../../../utils/helpers';
import SearchBar from '../forms/SearchBar';
import './ChatList.scss';

const ChatList = ({ 
  onSelectConversation,
  selectedConversationId,
  showSearch = true,
  emptyMessage = 'ไม่มีการสนทนา'
}) => {
  const { conversations, onlineUsers, isUserOnline } = useChat();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    
    const otherUser = conv.participants.find(p => p.id !== conv.currentUserId);
    return otherUser?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conv.lastMessage?.content.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const sortedConversations = [...filteredConversations].sort((a, b) => {
    const aTime = new Date(a.lastMessage?.createdAt || a.createdAt);
    const bTime = new Date(b.lastMessage?.createdAt || b.createdAt);
    return bTime - aTime;
  });

  const renderLastMessage = (conversation) => {
    const { lastMessage } = conversation;
    if (!lastMessage) return <span className="chat-list__empty-message">เริ่มการสนทนา</span>;

    const isOwnMessage = lastMessage.senderId === conversation.currentUserId;
    const prefix = isOwnMessage ? 'คุณ: ' : '';

    switch (lastMessage.type) {
      case 'image':
        return <span>{prefix}📷 รูปภาพ</span>;
      case 'file':
        return <span>{prefix}📎 ไฟล์แนบ</span>;
      case 'voice':
        return <span>{prefix}🎤 ข้อความเสียง</span>;
      case 'location':
        return <span>{prefix}📍 ตำแหน่ง</span>;
      default:
        return <span>{prefix}{truncateText(lastMessage.content, 50)}</span>;
    }
  };

  return (
    <div className="chat-list">
      {showSearch && (
        <div className="chat-list__search">
          <SearchBar
            placeholder="ค้นหาการสนทนา..."
            value={searchTerm}
            onChange={setSearchTerm}
            size="small"
          />
        </div>
      )}

      <div className="chat-list__conversations">
        {sortedConversations.length === 0 ? (
          <div className="chat-list__empty">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M8 14C8 11.7909 9.79086 10 12 10H36C38.2091 10 40 11.7909 40 14V26C40 28.2091 38.2091 30 36 30H12C9.79086 30 8 28.2091 8 26V14Z" stroke="currentColor" strokeWidth="3"/>
              <path d="M8 14L24 22L40 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <p>{emptyMessage}</p>
          </div>
        ) : (
          sortedConversations.map(conversation => {
            const otherUser = conversation.participants.find(p => p.id !== conversation.currentUserId);
            const isOnline = isUserOnline(otherUser?.id);
            const isSelected = conversation.id === selectedConversationId;

            return (
              <div
                key={conversation.id}
                className={`chat-list__item ${isSelected ? 'chat-list__item--selected' : ''}`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="chat-list__avatar">
                  <img 
                    src={otherUser?.profileImage || '/images/default-avatar.jpg'} 
                    alt={otherUser?.name}
                  />
                  {isOnline && <span className="chat-list__online-indicator"></span>}
                </div>

                <div className="chat-list__content">
                  <div className="chat-list__header">
                    <h4 className="chat-list__name">{otherUser?.name}</h4>
                    <span className="chat-list__time">
                      {conversation.lastMessage 
                        ? getRelativeTime(conversation.lastMessage.createdAt)
                        : ''}
                    </span>
                  </div>
                  
                  <div className="chat-list__preview">
                    <p className="chat-list__message">
                      {renderLastMessage(conversation)}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="chat-list__unread">{conversation.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
