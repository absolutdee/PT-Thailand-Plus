import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Paperclip, Image,
  Phone, Video, MoreVertical, Search,
  ChevronLeft, Smile, Plus, Calendar,
  CheckCheck, Check, Clock, AlertCircle,
  Camera, Mic, File, MapPin
} from 'lucide-react';

const ClientMessages = () => {
  const [selectedChat, setSelectedChat] = useState(1);
  const [message, setMessage] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const messagesEndRef = useRef(null);
  const windowWidth = window.innerWidth;

  // Set CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', '#232956');
    root.style.setProperty('--accent', '#df2528');
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-secondary', '#fafafa');
    root.style.setProperty('--text-primary', '#1a202c');
    root.style.setProperty('--text-secondary', '#718096');
    root.style.setProperty('--text-muted', '#a0aec0');
    root.style.setProperty('--text-white', '#ffffff');
    root.style.setProperty('--border-color', '#e2e8f0');
    root.style.setProperty('--success', '#48bb78');
    root.style.setProperty('--warning', '#ed8936');
    root.style.setProperty('--info', '#4299e1');
    root.style.setProperty('--danger', '#f56565');
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Sample trainers data
  const trainers = [
    {
      id: 1,
      name: 'โค้ชมิกกี้ สมิท',
      avatar: 'MS',
      specialty: 'ลดน้ำหนัก & คาร์ดิโอ',
      status: 'online',
      lastSeen: null,
      unreadCount: 2,
      lastMessage: 'พรุ่งนี้เจอกัน 9 โมงเช้านะครับ',
      lastMessageTime: '14:30',
      isTyping: false
    },
    {
      id: 2,
      name: 'โค้ชจอห์น ดี',
      avatar: 'JD',
      specialty: 'เพิ่มกล้ามเนื้อ',
      status: 'offline',
      lastSeen: '2 ชั่วโมงที่แล้ว',
      unreadCount: 0,
      lastMessage: 'ครับ ขอบคุณครับ',
      lastMessageTime: '11:45',
      isTyping: false
    },
    {
      id: 3,
      name: 'โค้ชเอมม่า วิลสัน',
      avatar: 'EW',
      specialty: 'โยคะ & ความยืดหยุ่น',
      status: 'online',
      lastSeen: null,
      unreadCount: 0,
      lastMessage: 'วันนี้ทำได้ดีมากเลยค่ะ',
      lastMessageTime: 'เมื่อวาน',
      isTyping: false
    }
  ];

  // Sample messages data
  const conversations = {
    1: [
      {
        id: 1,
        senderId: 1,
        senderName: 'โค้ชมิกกี้',
        message: 'สวัสดีครับ สมชาย! เป็นอย่างไรบ้างครับวันนี้?',
        timestamp: '09:00',
        date: 'วันนี้',
        type: 'text',
        status: 'delivered'
      },
      {
        id: 2,
        senderId: 'me',
        senderName: 'ฉัน',
        message: 'สวัสดีครับโค้ช วันนี้รู้สึกดีครับ เมื่อวานออกกำลังกายตามที่โค้ชแนะนำ',
        timestamp: '09:15',
        date: 'วันนี้',
        type: 'text',
        status: 'read'
      },
      {
        id: 3,
        senderId: 1,
        senderName: 'โค้ชมิกกี้',
        message: 'เยี่ยมมากครับ! รู้สึกอย่างไรบ้างหลังจากเทรนเมื่อวาน? มีอาการเมื่อยหรือเปล่า?',
        timestamp: '09:18',
        date: 'วันนี้',
        type: 'text',
        status: 'delivered'
      },
      {
        id: 4,
        senderId: 'me',
        senderName: 'ฉัน',
        message: 'เมื่อยนิดหน่อยครับ แต่รู้สึกดี ไม่ได้เจ็บหรืออะไร',
        timestamp: '09:20',
        date: 'วันนี้',
        type: 'text',
        status: 'read'
      },
      {
        id: 5,
        senderId: 1,
        senderName: 'โค้ชมิกกี้',
        message: 'ดีครับ นั่นแสดงว่าร่างกายเริ่มปรับตัว ผมส่งโปรแกรมสำหรับสัปดาห์หน้าให้นะครับ',
        timestamp: '09:25',
        date: 'วันนี้',
        type: 'text',
        status: 'delivered'
      },
      {
        id: 6,
        senderId: 1,
        senderName: 'โค้ชมิกกี้',
        message: 'workout-plan-week2.pdf',
        timestamp: '09:26',
        date: 'วันนี้',
        type: 'file',
        fileName: 'โปรแกรมเทรนสัปดาห์ที่ 2',
        fileSize: '2.4 MB',
        status: 'delivered'
      },
      {
        id: 7,
        senderId: 'me',
        senderName: 'ฉัน',
        message: 'ขอบคุณครับโค้ช จะไปดูแล้วทำตามนะครับ',
        timestamp: '09:30',
        date: 'วันนี้',
        type: 'text',
        status: 'read'
      },
      {
        id: 8,
        senderId: 1,
        senderName: 'โค้ชมิกกี้',
        message: 'ครับ อย่าลืมบันทึกน้ำหนักก่อนเทรนด้วยนะครับ แล้วถ่ายรูปส่งมาให้ดูหน่อย',
        timestamp: '09:32',
        date: 'วันนี้',
        type: 'text',
        status: 'delivered'
      },
      {
        id: 9,
        senderId: 1,
        senderName: 'โค้ชมิกกี้',
        message: 'พรุ่งนี้เจอกัน 9 โมงเช้านะครับ อย่าลืมนะ',
        timestamp: '14:30',
        date: 'วันนี้',
        type: 'text',
        status: 'sent'
      }
    ],
    2: [
      {
        id: 1,
        senderId: 2,
        senderName: 'โค้ชจอห์น',
        message: 'สวัสดีครับ วันนี้พร้อมเทรนยัง?',
        timestamp: '10:00',
        date: 'เมื่อวาน',
        type: 'text',
        status: 'delivered'
      },
      {
        id: 2,
        senderId: 'me',
        senderName: 'ฉัน',
        message: 'พร้อมแล้วครับ',
        timestamp: '10:15',
        date: 'เมื่อวาน',
        type: 'text',
        status: 'read'
      },
      {
        id: 3,
        senderId: 2,
        senderName: 'โค้ชจอห์น',
        message: 'ครับ ขอบคุณครับ',
        timestamp: '11:45',
        date: 'เมื่อวาน',
        type: 'text',
        status: 'delivered'
      }
    ],
    3: [
      {
        id: 1,
        senderId: 3,
        senderName: 'โค้ชเอมม่า',
        message: 'วันนี้ทำได้ดีมากเลยค่ะ ความยืดหยุ่นดีขึ้นเยอะ',
        timestamp: '16:00',
        date: 'เมื่อวาน',
        type: 'text',
        status: 'delivered'
      }
    ]
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Check size={14} color="var(--text-muted)" />;
      case 'delivered':
        return <CheckCheck size={14} color="var(--text-muted)" />;
      case 'read':
        return <CheckCheck size={14} color="var(--primary)" />;
      default:
        return <Clock size={14} color="var(--text-muted)" />;
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      // Here you would typically send the message to your backend
      console.log('Sending message:', message);
      setMessage('');
      scrollToBottom();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderChatList = () => (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '0.75rem',
      border: '1px solid var(--border-color)',
      height: windowWidth <= 768 ? 'auto' : '600px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Chat List Header */}
      <div style={{ 
        padding: '1.5rem',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            แชท
          </h3>
          <button style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            color: 'var(--text-muted)'
          }}>
            <MoreVertical size={16} />
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)' 
            }} 
          />
          <input
            type="text"
            placeholder="ค้นหาแชท..."
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-primary)'
            }}
          />
        </div>
      </div>

      {/* Trainers List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {trainers.map(trainer => (
          <div
            key={trainer.id}
            onClick={() => setSelectedChat(trainer.id)}
            style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              cursor: 'pointer',
              backgroundColor: selectedChat === trainer.id ? 'var(--bg-secondary)' : 'transparent',
              transition: 'background-color 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-white)',
                  flexShrink: 0
                }}>
                  {trainer.avatar}
                </div>
                {trainer.status === 'online' && (
                  <div style={{
                    position: 'absolute',
                    bottom: '0.125rem',
                    right: '0.125rem',
                    width: '0.75rem',
                    height: '0.75rem',
                    backgroundColor: 'var(--success)',
                    borderRadius: '50%',
                    border: '2px solid var(--bg-primary)'
                  }}></div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                    {trainer.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {trainer.lastMessageTime}
                  </div>
                </div>
                
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  {trainer.specialty}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    marginRight: '0.5rem'
                  }}>
                    {trainer.isTyping ? (
                      <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>กำลังพิมพ์...</span>
                    ) : (
                      trainer.lastMessage
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {trainer.status === 'offline' && trainer.lastSeen && (
                      <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                        {trainer.lastSeen}
                      </span>
                    )}
                    {trainer.unreadCount > 0 && (
                      <div style={{
                        backgroundColor: 'var(--accent)',
                        color: 'var(--text-white)',
                        borderRadius: '50%',
                        width: '1.25rem',
                        height: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.625rem',
                        fontWeight: '600'
                      }}>
                        {trainer.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChatWindow = () => {
    const currentTrainer = trainers.find(t => t.id === selectedChat);
    const messages = conversations[selectedChat] || [];

    return (
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        height: windowWidth <= 768 ? '500px' : '600px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Chat Header */}
        <div style={{ 
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {windowWidth <= 768 && (
                <button
                  onClick={() => setSelectedChat(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-white)'
                }}>
                  {currentTrainer?.avatar}
                </div>
                {currentTrainer?.status === 'online' && (
                  <div style={{
                    position: 'absolute',
                    bottom: '0.125rem',
                    right: '0.125rem',
                    width: '0.5rem',
                    height: '0.5rem',
                    backgroundColor: 'var(--success)',
                    borderRadius: '50%',
                    border: '1px solid var(--bg-primary)'
                  }}></div>
                )}
              </div>

              <div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                  {currentTrainer?.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {currentTrainer?.status === 'online' ? 'ออนไลน์' : `เห็นล่าสุด ${currentTrainer?.lastSeen}`}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                color: 'var(--text-muted)'
              }}>
                <Phone size={16} />
              </button>
              <button style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                color: 'var(--text-muted)'
              }}>
                <Video size={16} />
              </button>
              <button style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                color: 'var(--text-muted)'
              }}>
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              display: 'flex',
              justifyContent: msg.senderId === 'me' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              gap: '0.5rem'
            }}>
              {msg.senderId !== 'me' && (
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--text-white)',
                  flexShrink: 0
                }}>
                  {currentTrainer?.avatar}
                </div>
              )}

              <div style={{
                maxWidth: '70%',
                backgroundColor: msg.senderId === 'me' ? 'var(--primary)' : 'var(--bg-secondary)',
                color: msg.senderId === 'me' ? 'var(--text-white)' : 'var(--text-primary)',
                padding: '0.75rem 1rem',
                borderRadius: msg.senderId === 'me' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                border: msg.senderId === 'me' ? 'none' : '1px solid var(--border-color)'
              }}>
                {msg.type === 'text' ? (
                  <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>
                    {msg.message}
                  </div>
                ) : msg.type === 'file' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      backgroundColor: msg.senderId === 'me' ? 'rgba(255,255,255,0.2)' : 'var(--primary)',
                      borderRadius: '50%',
                      width: '2.5rem',
                      height: '2.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: msg.senderId === 'me' ? 'var(--text-white)' : 'var(--text-white)'
                    }}>
                      <File size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        {msg.fileName}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        opacity: 0.8,
                        color: msg.senderId === 'me' ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'
                      }}>
                        {msg.fileSize}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  opacity: 0.8
                }}>
                  <span>{msg.timestamp}</span>
                  {msg.senderId === 'me' && (
                    <div>{getStatusIcon(msg.status)}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div style={{ 
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'end', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowAttachments(!showAttachments)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.75rem',
                  borderRadius: '50%',
                  color: 'var(--text-muted)',
                  fontSize: '1.25rem'
                }}
              >
                <Plus size={20} />
              </button>

              {showAttachments && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-color)',
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  minWidth: '150px'
                }}>
                  <button style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textAlign: 'left'
                  }}>
                    <Camera size={16} />
                    รูปภาพ
                  </button>
                  <button style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textAlign: 'left'
                  }}>
                    <File size={16} />
                    ไฟล์
                  </button>
                  <button style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textAlign: 'left'
                  }}>
                    <Calendar size={16} />
                    จองเซสชั่น
                  </button>
                </div>
              )}
            </div>

            <div style={{ 
              flex: 1, 
              position: 'relative',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '1.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="พิมพ์ข้อความ..."
                style={{
                  width: '100%',
                  padding: '0.75rem 3rem 0.75rem 1rem',
                  border: 'none',
                  borderRadius: '1.5rem',
                  fontSize: '0.875rem',
                  resize: 'none',
                  minHeight: '20px',
                  maxHeight: '100px',
                  backgroundColor: 'transparent',
                  outline: 'none'
                }}
                rows={1}
              />
              
              <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: message.trim() ? 'var(--primary)' : 'var(--border-color)',
                  color: 'var(--text-white)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '2rem',
                  height: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: message.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s'
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: windowWidth <= 768 ? '1rem' : '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: windowWidth <= 768 ? '1.5rem' : '1.75rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          marginBottom: '0.5rem' 
        }}>
          แชทกับเทรนเนอร์
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          สื่อสารกับเทรนเนอร์ของคุณ ขอคำแนะนำ และติดตามความก้าวหน้า
        </p>
      </div>

      {/* Chat Interface */}
      {windowWidth <= 768 ? (
        // Mobile Layout
        <div>
          {selectedChat ? renderChatWindow() : renderChatList()}
        </div>
      ) : (
        // Desktop Layout
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '1.5rem',
          height: '600px'
        }}>
          {renderChatList()}
          {selectedChat ? renderChatWindow() : (
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '1rem',
              color: 'var(--text-secondary)'
            }}>
              <MessageSquare size={48} style={{ opacity: 0.5 }} />
              <p>เลือกแชทเพื่อเริ่มการสนทนา</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientMessages;