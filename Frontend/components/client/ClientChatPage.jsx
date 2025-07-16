import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Paperclip, Image, Video, FileText, Download, Phone, 
  MoreVertical, Smile, Search, CheckCheck, Volume2, VolumeX, 
  Dumbbell, Apple, Calendar, Clock, Heart, Star, Award, 
  Camera, Mic, MessageSquare, User, Target, TrendingUp,
  HelpCircle, Settings, BookOpen, Play, X, ArrowLeft,
  Menu, Bell, Shield, AlertCircle, Plus, Trash2,
  Eye, EyeOff, Copy, Share2, Info, Filter, Archive,
  Upload, Zap, Activity, CheckCircle, XCircle, Timer,
  MapPin, Globe, Smartphone, Monitor, Headphones,
  Maximize2, Minimize2, RotateCcw, Save, Edit3, Loader
} from 'lucide-react';

const ClientChatPage = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [notification, setNotification] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showQuickQuestions, setShowQuickQuestions] = useState(false);
  const [showProgressUpload, setShowProgressUpload] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showFileManager, setShowFileManager] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [chatFilter, setChatFilter] = useState('all');
  const [showChatInfo, setShowChatInfo] = useState(false);
  
  // Database Connection States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [socketConnection, setSocketConnection] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // API Base URL - adjust according to your backend
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';

  // Responsive breakpoints
  const breakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
  };

  const isMobile = windowWidth <= breakpoints.mobile;
  const isTablet = windowWidth > breakpoints.mobile && windowWidth <= breakpoints.tablet;
  const isDesktop = windowWidth > breakpoints.tablet;

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth <= breakpoints.mobile) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoints.mobile]);

  // Apply CSS variables
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

  // API Functions
  const apiRequest = async (endpoint, options = {}) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  // Get current user info
  const getCurrentUser = async () => {
    try {
      setLoading(true);
      const userData = await apiRequest('/auth/me');
      setCurrentUser(userData);
      return userData;
    } catch (error) {
      setError('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
      console.error('Failed to get current user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load chat rooms from database
  const loadChatRooms = async () => {
    try {
      setRoomsLoading(true);
      setError(null);
      
      const response = await apiRequest('/chat/rooms');
      
      if (response.success) {
        const rooms = response.data.map(room => ({
          id: room.id,
          trainerName: room.trainer?.name || 'ไม่ระบุชื่อ',
          speciality: room.trainer?.speciality || 'General Training',
          avatar: room.trainer?.avatar || room.trainer?.name?.charAt(0)?.toUpperCase() || 'T',
          lastMessage: room.lastMessage?.content || 'ยังไม่มีข้อความ',
          lastMessageTime: room.lastMessage?.createdAt ? new Date(room.lastMessage.createdAt) : new Date(),
          unreadCount: room.unreadCount || 0,
          isOnline: room.trainer?.isOnline || false,
          rating: room.trainer?.rating || 0,
          experience: room.trainer?.experience || 'ไม่ระบุ',
          nextSession: room.nextSession ? new Date(room.nextSession) : null,
          sessionsLeft: room.sessionsLeft || 0,
          totalSessions: room.totalSessions || 0,
          isPrimary: room.isPrimary || false,
          verified: room.trainer?.verified || false,
          responseRate: room.trainer?.responseRate || 0,
          avgResponseTime: room.trainer?.avgResponseTime || 'ไม่ระบุ',
          totalClients: room.trainer?.totalClients || 0,
          location: room.trainer?.location || 'ไม่ระบุ',
          certificates: room.trainer?.certificates || [],
          isSupport: room.type === 'support',
          trainerId: room.trainer?.id
        }));

        setChatRooms(rooms);
        
        // Set first room as selected if no room is currently selected
        if (rooms.length > 0 && !selectedRoom) {
          setSelectedRoom(rooms[0]);
        }
        
        // Update online users
        const onlineTrainerIds = new Set(rooms.filter(r => r.isOnline).map(r => r.id));
        setOnlineUsers(onlineTrainerIds);
      } else {
        throw new Error(response.message || 'ไม่สามารถดึงข้อมูลแชทได้');
      }
    } catch (error) {
      setError('ไม่สามารถดึงข้อมูลแชทได้');
      console.error('Failed to load chat rooms:', error);
      
      // Fallback to empty array
      setChatRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  // Load messages for selected room
  const loadMessages = async (roomId, page = 1) => {
    try {
      setMessagesLoading(true);
      setError(null);
      
      const response = await apiRequest(`/chat/rooms/${roomId}/messages?page=${page}&limit=50`);
      
      if (response.success) {
        const loadedMessages = response.data.map(msg => ({
          id: msg.id,
          text: msg.content,
          sender: msg.senderId === currentUser?.id ? 'client' : 'trainer',
          timestamp: new Date(msg.createdAt),
          type: msg.type || 'text',
          status: msg.status || 'read',
          reactions: msg.reactions || [],
          edited: msg.edited || false,
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
          duration: msg.duration,
          thumbnail: msg.thumbnail
        }));

        if (page === 1) {
          setMessages(loadedMessages);
        } else {
          setMessages(prev => [...loadedMessages, ...prev]);
        }
      } else {
        throw new Error(response.message || 'ไม่สามารถดึงข้อความได้');
      }
    } catch (error) {
      setError('ไม่สามารถดึงข้อความได้');
      console.error('Failed to load messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Send message to database
  const sendMessage = async (messageText = newMessage) => {
    if (!messageText.trim() || !selectedRoom || sendingMessage) return;

    try {
      setSendingMessage(true);
      setError(null);

      // Create temporary message for immediate UI update
      const tempMessage = {
        id: `temp-${Date.now()}`,
        text: messageText,
        sender: 'client',
        timestamp: new Date(),
        type: 'text',
        status: 'sending',
        reactions: [],
        edited: false
      };

      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      setShowQuickQuestions(false);

      // Send to database
      const response = await apiRequest(`/chat/rooms/${selectedRoom.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: messageText,
          type: 'text'
        })
      });

      if (response.success) {
        const savedMessage = {
          id: response.data.id,
          text: response.data.content,
          sender: 'client',
          timestamp: new Date(response.data.createdAt),
          type: response.data.type || 'text',
          status: 'sent',
          reactions: response.data.reactions || [],
          edited: false
        };

        // Replace temporary message with real message
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id ? savedMessage : msg
          )
        );

        // Send through WebSocket if connected
        if (socketConnection) {
          socketConnection.send(JSON.stringify({
            type: 'message',
            roomId: selectedRoom.id,
            message: savedMessage
          }));
        }

        // Update last message in chat rooms
        setChatRooms(prev => 
          prev.map(room => 
            room.id === selectedRoom.id 
              ? { ...room, lastMessage: messageText, lastMessageTime: new Date() }
              : room
          )
        );

      } else {
        throw new Error(response.message || 'ไม่สามารถส่งข้อความได้');
      }
    } catch (error) {
      setError('ไม่สามารถส่งข้อความได้');
      console.error('Failed to send message:', error);
      
      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`));
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle file upload to database
  const handleFileUpload = async (files, type = 'file') => {
    if (!selectedRoom || files.length === 0) return;

    try {
      setError(null);

      for (const file of Array.from(files)) {
        // Create temporary message for immediate UI update
        const tempMessage = {
          id: `temp-${Date.now()}-${Math.random()}`,
          text: type === 'image' ? 'ส่งรูปความก้าวหน้า 📸' : `ส่งไฟล์: ${file.name}`,
          sender: 'client',
          timestamp: new Date(),
          type: type,
          fileName: file.name,
          fileUrl: URL.createObjectURL(file),
          fileSize: formatFileSize(file.size),
          status: 'sending',
          reactions: [],
          edited: false
        };

        setMessages(prev => [...prev, tempMessage]);

        // Upload file
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        formData.append('roomId', selectedRoom.id);

        const response = await fetch(`${API_BASE_URL}/chat/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          const savedMessage = {
            id: result.data.id,
            text: result.data.content,
            sender: 'client',
            timestamp: new Date(result.data.createdAt),
            type: result.data.type,
            fileName: result.data.fileName,
            fileUrl: result.data.fileUrl,
            fileSize: result.data.fileSize,
            status: 'sent',
            reactions: [],
            edited: false
          };

          // Replace temporary message with real message
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempMessage.id ? savedMessage : msg
            )
          );

          // Send through WebSocket if connected
          if (socketConnection) {
            socketConnection.send(JSON.stringify({
              type: 'file',
              roomId: selectedRoom.id,
              message: savedMessage
            }));
          }
        } else {
          throw new Error(result.message || 'ไม่สามารถอัพโหลดไฟล์ได้');
        }
      }
    } catch (error) {
      setError('ไม่สามารถอัพโหลดไฟล์ได้');
      console.error('Failed to upload file:', error);
    }
  };

  // Initialize WebSocket connection
  const initializeWebSocket = () => {
    try {
      const token = localStorage.getItem('authToken');
      const ws = new WebSocket(`${WS_URL}?token=${token}`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setSocketConnection(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'message':
              // Only add message if it's for the current room and not from current user
              if (data.roomId === selectedRoom?.id && data.message.sender !== 'client') {
                setMessages(prev => [...prev, data.message]);
                if (soundEnabled) {
                  playNotificationSound();
                }
              }
              break;
              
            case 'typing':
              if (data.roomId === selectedRoom?.id) {
                setTypingUsers(data.isTyping ? [data.userName] : []);
              }
              break;
              
            case 'online_status':
              setOnlineUsers(prev => {
                const newSet = new Set(prev);
                if (data.isOnline) {
                  newSet.add(data.userId);
                } else {
                  newSet.delete(data.userId);
                }
                return newSet;
              });
              break;
              
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setSocketConnection(null);
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (!socketConnection) {
            initializeWebSocket();
          }
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      return ws;
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setIsConnected(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (roomId) => {
    try {
      await apiRequest(`/chat/rooms/${roomId}/read`, {
        method: 'POST'
      });
      
      // Update unread count
      setChatRooms(prev => 
        prev.map(room => 
          room.id === roomId ? { ...room, unreadCount: 0 } : room
        )
      );
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        
        // Get current user first
        const user = await getCurrentUser();
        if (user) {
          // Load chat rooms
          await loadChatRooms();
          
          // Initialize WebSocket
          initializeWebSocket();
        }
      } catch (error) {
        setError('ไม่สามารถเริ่มต้นแอปพลิเคชันได้');
        console.error('Initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    init();

    // Auto-hide sidebar on mobile
    if (isMobile) {
      setShowSidebar(false);
    }

    // Cleanup WebSocket on unmount
    return () => {
      if (socketConnection) {
        socketConnection.close();
      }
    };
  }, [isMobile]);

  // Load messages when room changes
  useEffect(() => {
    if (selectedRoom && currentUser) {
      loadMessages(selectedRoom.id);
      markMessagesAsRead(selectedRoom.id);
    }
  }, [selectedRoom, currentUser]);

  // Scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Quick questions for clients
  const quickQuestions = [
    {
      category: 'การเทรน',
      icon: Dumbbell,
      color: 'var(--primary)',
      questions: [
        'วันนี้ควรเทรนอะไรครับ/คะ?',
        'รู้สึกเมื่อยหลังเทรนเมื่อวาน เป็นปกติไหม?',
        'ขอเพิ่มความเข้มข้นการเทรนได้ไหม?',
        'ทำไมถึงรู้สึกเหนื่อยเร็วในวันนี้?',
        'ควรพักกี่วันระหว่างการเทรน?'
      ]
    },
    {
      category: 'โภชนาการ',
      icon: Apple,
      color: 'var(--success)',
      questions: [
        'วันนี้ควรกินอะไรดี?',
        'กินอาหารเสริมตัวไหนดี?',
        'ควรดื่มน้ำวันละเท่าไหร่?',
        'อาหารที่ควรเลี่ยงมีอะไรบ้าง?',
        'กินผลไม้ตอนไหนดีที่สุด?'
      ]
    },
    {
      category: 'ตารางเวลา',
      icon: Calendar,
      color: 'var(--warning)',
      questions: [
        'ขอเปลี่ยนเวลาเทรนได้ไหม?',
        'สัปดาห์หน้าเทรนวันไหนบ้าง?',
        'ขอเลื่อนนัดพรุ่งนี้ได้ไหม?',
        'วันนี้เทรนกี่โมง?',
        'ช่วงไหนที่โค้ชว่าง?'
      ]
    },
    {
      category: 'อื่นๆ',
      icon: HelpCircle,
      color: 'var(--info)',
      questions: [
        'ขอคำแนะนำการออกกำลังกายที่บ้าน',
        'รู้สึกเครียด มีวิธีผ่อนคลายไหม?',
        'ควรซื้ออุปกรณ์เทรนอะไรเพิ่ม?',
        'มีปัญหาการนอนหลับ ช่วยแนะนำได้ไหม?',
        'ขอบคุณสำหรับความช่วยเหลือ'
      ]
    }
  ];

  // File types
  const fileTypes = [
    { type: 'image', icon: Image, label: 'รูปภาพ', accept: 'image/*', color: 'var(--success)' },
    { type: 'video', icon: Video, label: 'วิดีโอ', accept: 'video/*', color: 'var(--info)' },
    { type: 'audio', icon: Headphones, label: 'เสียง', accept: 'audio/*', color: 'var(--warning)' },
    { type: 'document', icon: FileText, label: 'เอกสาร', accept: '.pdf,.doc,.docx,.txt', color: 'var(--accent)' }
  ];

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Play notification sound
  const playNotificationSound = () => {
    if ('vibrate' in navigator && isMobile) {
      navigator.vibrate(200);
    }
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+TyvmAaATqDz/PQeBsFTHjT8d+VPwgXcbTotWAYAUWm5+a3ZxkDUqb');
    audio.play().catch(e => console.log('Could not play notification sound'));
  };

  // Filter chat rooms
  const filteredRooms = chatRooms.filter(room => {
    const matchesSearch = room.trainerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      chatFilter === 'all' || 
      (chatFilter === 'online' && room.isOnline) ||
      (chatFilter === 'primary' && room.isPrimary) ||
      (chatFilter === 'support' && room.isSupport);
    
    return matchesSearch && matchesFilter;
  });

  // Format timestamp
  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'เมื่อสักครู่';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาทีที่แล้ว`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ชั่วโมงที่แล้ว`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} วันที่แล้ว`;
    return timestamp.toLocaleDateString('th-TH');
  };

  // Format full timestamp
  const formatFullTime = (timestamp) => {
    return timestamp.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render message status
  const renderMessageStatus = (status) => {
    switch (status) {
      case 'sending':
        return <Loader size={14} style={{ 
          color: 'var(--text-muted)',
          animation: 'spin 1s linear infinite'
        }} />;
      case 'sent':
        return <CheckCheck size={14} style={{ color: 'var(--text-muted)' }} />;
      case 'delivered':
        return <CheckCheck size={14} style={{ color: 'var(--info)' }} />;
      case 'read':
        return <CheckCheck size={14} style={{ color: 'var(--success)' }} />;
      default:
        return null;
    }
  };

  // Get trainer specialty color
  const getSpecialtyColor = (room) => {
    if (room.isSupport) return 'var(--info)';
    if (room.isPrimary) return 'var(--primary)';
    return 'var(--accent)';
  };

  // Add reaction to message
  const addReaction = (messageId, emoji) => {
    setMessages(prev => 
      prev.map(msg => {
        if (msg.id === messageId) {
          const reactions = [...msg.reactions];
          if (reactions.includes(emoji)) {
            reactions.splice(reactions.indexOf(emoji), 1);
          } else {
            reactions.push(emoji);
          }
          return { ...msg, reactions };
        }
        return msg;
      })
    );
  };

  // Loading screen
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-secondary)',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <Loader size={48} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          กำลังเชื่อมต่อ...
        </div>
      </div>
    );
  }

  // Error screen
  if (error && !currentUser) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-secondary)',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem'
      }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)' }} />
        <div style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '600', textAlign: 'center' }}>
          เกิดข้อผิดพลาด
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', textAlign: 'center' }}>
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  // Render sidebar for trainers list
  const renderSidebar = () => (
    <div style={{
      width: isMobile ? '100%' : '380px',
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      borderRight: isMobile ? 'none' : '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      position: isMobile ? 'absolute' : 'relative',
      top: 0,
      left: 0,
      zIndex: isMobile ? 1000 : 1,
      transform: isMobile ? (showSidebar ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
      transition: 'transform 0.3s ease'
    }}>
      {/* Sidebar Header */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '1rem' 
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <MessageSquare size={20} style={{ color: 'var(--accent)' }} />
            แชทของฉัน
            {/* Connection status */}
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? 'var(--success)' : 'var(--danger)',
              marginLeft: '0.5rem'
            }} />
          </h2>
          {isMobile && (
            <button
              onClick={() => setShowSidebar(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Search and Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
              placeholder="ค้นหาเทรนเนอร์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                backgroundColor: 'var(--bg-secondary)',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', overflow: 'auto' }}>
            {[
              { id: 'all', label: 'ทั้งหมด', icon: null },
              { id: 'online', label: 'ออนไลน์', icon: Activity },
              { id: 'primary', label: 'หลัก', icon: Star },
              { id: 'support', label: 'ซัพพอร์ต', icon: HelpCircle }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setChatFilter(filter.id)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '1rem',
                  border: 'none',
                  backgroundColor: chatFilter === filter.id ? 'var(--primary)' : 'var(--bg-secondary)',
                  color: chatFilter === filter.id ? 'var(--text-white)' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {filter.icon && <filter.icon size={12} />}
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: 'var(--danger)',
            color: 'white',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* Chat Statistics */}
      <div style={{
        padding: '1rem 1.5rem',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--success)' }}>
              {roomsLoading ? '...' : chatRooms.filter(r => r.isOnline && !r.isSupport).length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ออนไลน์</div>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent)' }}>
              {roomsLoading ? '...' : chatRooms.reduce((sum, r) => sum + r.unreadCount, 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ข้อความใหม่</div>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>
              {roomsLoading ? '...' : chatRooms.filter(r => !r.isSupport).reduce((sum, r) => sum + (r.sessionsLeft || 0), 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เซสชั่นเหลือ</div>
          </div>
        </div>
      </div>

      {/* Trainers List */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        backgroundColor: 'var(--bg-primary)'
      }}>
        {roomsLoading ? (
          <div style={{
            padding: '2rem 1.5rem',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            <Loader size={32} style={{ marginBottom: '1rem', color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: '0.875rem' }}>กำลังโหลดรายการแชท...</div>
          </div>
        ) : filteredRooms.length > 0 ? (
          filteredRooms.map(room => (
            <div
              key={room.id}
              onClick={() => {
                setSelectedRoom(room);
                if (isMobile) setShowSidebar(false);
              }}
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                backgroundColor: selectedRoom?.id === room.id ? 'var(--bg-secondary)' : 'transparent',
                transition: 'background-color 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                {/* Enhanced Avatar with status */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${getSpecialtyColor(room)}, ${getSpecialtyColor(room)}dd)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: room.isSupport ? '0.75rem' : '1.125rem',
                    border: room.isPrimary ? '2px solid var(--warning)' : 'none'
                  }}>
                    {room.avatar}
                  </div>
                  
                  {/* Online status */}
                  {room.isOnline && (
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--success)',
                      border: '2px solid var(--bg-primary)',
                      animation: 'pulse 2s infinite'
                    }} />
                  )}
                  
                  {/* Verified badge */}
                  {room.verified && (
                    <div style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid var(--bg-primary)'
                    }}>
                      <CheckCircle size={8} color="white" />
                    </div>
                  )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Name and badges */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.25rem',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}>
                      {room.trainerName}
                    </span>
                    
                    {room.isPrimary && (
                      <span style={{
                        fontSize: '0.625rem',
                        padding: '0.125rem 0.375rem',
                        backgroundColor: 'var(--warning)',
                        color: 'white',
                        borderRadius: '0.25rem',
                        fontWeight: '600'
                      }}>
                        หลัก
                      </span>
                    )}
                    
                    {room.isSupport && (
                      <span style={{
                        fontSize: '0.625rem',
                        padding: '0.125rem 0.375rem',
                        backgroundColor: 'var(--info)',
                        color: 'white',
                        borderRadius: '0.25rem',
                        fontWeight: '600'
                      }}>
                        ซัพพอร์ต
                      </span>
                    )}
                  </div>
                  
                  {/* Specialty and rating */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span>{room.speciality}</span>
                    {!room.isSupport && (
                      <>
                        <span>•</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Star size={10} fill="var(--warning)" style={{ color: 'var(--warning)' }} />
                          <span>{room.rating}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Last message */}
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: '0.5rem',
                    lineHeight: '1.3'
                  }}>
                    {room.lastMessage}
                  </div>

                  {/* Footer info */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span>{formatTime(room.lastMessageTime)}</span>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {room.avgResponseTime && (
                        <span>ตอบภายใน {room.avgResponseTime}</span>
                      )}
                      {room.unreadCount > 0 && (
                        <div style={{
                          backgroundColor: 'var(--accent)',
                          color: 'white',
                          borderRadius: '50%',
                          minWidth: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.625rem',
                          fontWeight: '700'
                        }}>
                          {room.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{
            padding: '2rem 1.5rem',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            <MessageSquare size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <div style={{ fontSize: '0.875rem' }}>ไม่พบเทรนเนอร์ที่ตรงกับเงื่อนไข</div>
          </div>
        )}
      </div>
    </div>
  );

  // Render main chat area
  const renderChatArea = () => (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--bg-secondary)'
    }}>
      {selectedRoom ? (
        <>
          {/* Enhanced Chat Header */}
          <div style={{
            padding: '1rem 1.5rem',
            backgroundColor: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {isMobile && (
                <button
                  onClick={() => setShowSidebar(true)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    color: 'var(--text-primary)'
                  }}
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${getSpecialtyColor(selectedRoom)}, ${getSpecialtyColor(selectedRoom)}dd)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: selectedRoom.isSupport ? '0.875rem' : '1.125rem'
                }}>
                  {selectedRoom.avatar}
                </div>
                {selectedRoom.isOnline && (
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success)',
                    border: '2px solid var(--bg-primary)'
                  }} />
                )}
              </div>
              
              <div>
                <div style={{
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {selectedRoom.trainerName}
                  {selectedRoom.verified && (
                    <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                  )}
                  {selectedRoom.isPrimary && (
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: 'var(--warning)',
                      color: 'white',
                      borderRadius: '0.25rem',
                      fontWeight: '600'
                    }}>
                      เทรนเนอร์หลัก
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  <span>{selectedRoom.isOnline ? 'ออนไลน์อยู่' : `ออนไลน์ล่าสุด ${formatTime(selectedRoom.lastMessageTime)}`}</span>
                  <span>•</span>
                  <span>{selectedRoom.speciality}</span>
                  {!selectedRoom.isSupport && (
                    <>
                      <span>•</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Star size={12} fill="var(--warning)" style={{ color: 'var(--warning)' }} />
                        <span>{selectedRoom.rating}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {!selectedRoom.isSupport && (
                <>
                  <button 
                    onClick={() => setShowQuickQuestions(!showQuickQuestions)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: showQuickQuestions ? 'var(--primary)' : 'transparent',
                      color: showQuickQuestions ? 'white' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <HelpCircle size={14} />
                    {!isMobile && 'คำถาม'}
                  </button>
                  <button 
                    onClick={() => setShowProgressUpload(!showProgressUpload)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: showProgressUpload ? 'var(--accent)' : 'transparent',
                      color: showProgressUpload ? 'white' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Camera size={14} />
                    {!isMobile && 'รูป'}
                  </button>
                </>
              )}
              
              <button 
                onClick={() => setShowFileManager(!showFileManager)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: showFileManager ? 'var(--info)' : 'transparent',
                  color: showFileManager ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Archive size={14} />
              </button>
              
              <button 
                onClick={() => setShowChatInfo(!showChatInfo)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Info size={14} />
              </button>
              
              <button style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}>
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          {/* Quick Questions Panel */}
          {showQuickQuestions && (
            <div style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <div style={{ padding: '1rem 1.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '1rem' 
                }}>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>
                    คำถามด่วน
                  </h4>
                  <button
                    onClick={() => setShowQuickQuestions(false)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                  gap: '1rem'
                }}>
                  {quickQuestions.map((category, categoryIndex) => (
                    <div key={categoryIndex}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        opacity: 0.9
                      }}>
                        <category.icon size={14} />
                        {category.category}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {category.questions.slice(0, 3).map((question, questionIndex) => (
                          <button
                            key={questionIndex}
                            onClick={() => sendMessage(question)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: 'white',
                              textAlign: 'left',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                            }}
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Progress Upload Panel */}
          {showProgressUpload && (
            <div style={{
              backgroundColor: 'var(--accent)',
              color: 'white'
            }}>
              <div style={{ padding: '1rem 1.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '1rem' 
                }}>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>
                    ส่งรูปความก้าวหน้า
                  </h4>
                  <button
                    onClick={() => setShowProgressUpload(false)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files, 'image')}
                    style={{ display: 'none' }}
                    multiple
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '1rem',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      color: 'white',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <Camera size={24} />
                    <span style={{ fontSize: '0.75rem' }}>ถ่ายรูป</span>
                  </button>
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.multiple = true;
                      input.onchange = (e) => handleFileUpload(e.target.files, 'image');
                      input.click();
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '1rem',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      color: 'white',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <Image size={24} />
                    <span style={{ fontSize: '0.75rem' }}>เลือกรูป</span>
                  </button>
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'video/*';
                      input.onchange = (e) => handleFileUpload(e.target.files, 'video');
                      input.click();
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '1rem',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      color: 'white',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <Video size={24} />
                    <span style={{ fontSize: '0.75rem' }}>วิดีโอ</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '1rem 1.5rem',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-secondary)',
            backgroundImage: 'linear-gradient(45deg, rgba(35, 41, 86, 0.02) 25%, transparent 25%), linear-gradient(-45deg, rgba(35, 41, 86, 0.02) 25%, transparent 25%)',
            backgroundSize: '20px 20px'
          }}>
            {/* Messages loading */}
            {messagesLoading && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '2rem',
                color: 'var(--text-muted)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  กำลังโหลดข้อความ...
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.sender === 'client' ? 'flex-end' : 'flex-start',
                  marginBottom: '1rem'
                }}
              >
                <div style={{
                  maxWidth: isMobile ? '85%' : '70%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  <div
                    style={{
                      position: 'relative',
                      padding: message.type === 'text' ? '0.75rem 1rem' : '0.5rem',
                      backgroundColor: message.sender === 'client' 
                        ? 'var(--primary)' 
                        : 'var(--bg-primary)',
                      color: message.sender === 'client' ? 'white' : 'var(--text-primary)',
                      borderRadius: message.sender === 'client' 
                        ? '1rem 1rem 0.25rem 1rem' 
                        : '1rem 1rem 1rem 0.25rem',
                      border: message.sender === 'trainer' ? '1px solid var(--border-color)' : 'none',
                      boxShadow: message.sender === 'client' 
                        ? '0 2px 8px rgba(35, 41, 86, 0.2)' 
                        : '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                    onDoubleClick={() => setShowChatInfo(true)}
                  >
                    {/* Text message */}
                    {message.type === 'text' && (
                      <div style={{ 
                        fontSize: '0.875rem',
                        lineHeight: '1.4',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {message.text}
                      </div>
                    )}

                    {/* Image message */}
                    {message.type === 'image' && (
                      <div>
                        <img
                          src={message.fileUrl}
                          alt={message.fileName}
                          style={{
                            width: '100%',
                            maxWidth: '300px',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            display: 'block'
                          }}
                          onClick={() => window.open(message.fileUrl, '_blank')}
                        />
                        {message.text && (
                          <div style={{ 
                            marginTop: '0.5rem', 
                            fontSize: '0.875rem',
                            color: message.sender === 'client' ? 'white' : 'var(--text-primary)'
                          }}>
                            {message.text}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Video message */}
                    {message.type === 'video' && (
                      <div>
                        <div style={{
                          position: 'relative',
                          width: '100%',
                          maxWidth: '300px',
                          borderRadius: '0.5rem',
                          overflow: 'hidden',
                          cursor: 'pointer'
                        }}>
                          {message.thumbnail ? (
                            <img
                              src={message.thumbnail}
                              alt="Video thumbnail"
                              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '200px',
                              backgroundColor: 'var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Video size={40} color="var(--text-muted)" />
                            </div>
                          )}
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Play size={20} color="white" />
                          </div>
                          {message.duration && (
                            <div style={{
                              position: 'absolute',
                              bottom: '0.5rem',
                              right: '0.5rem',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              color: 'white',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem'
                            }}>
                              {message.duration}
                            </div>
                          )}
                        </div>
                        {message.text && (
                          <div style={{ 
                            marginTop: '0.5rem', 
                            fontSize: '0.875rem',
                            color: message.sender === 'client' ? 'white' : 'var(--text-primary)'
                          }}>
                            {message.text}
                          </div>
                        )}
                      </div>
                    )}

                    {/* File message */}
                    {(message.type === 'file' || (message.type !== 'text' && message.type !== 'image' && message.type !== 'video')) && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem',
                        minWidth: '200px'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '0.5rem',
                          backgroundColor: 'var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          flexShrink: 0
                        }}>
                          <FileText size={20} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontWeight: '600', 
                            fontSize: '0.875rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {message.fileName}
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            opacity: 0.7,
                            color: message.sender === 'client' ? 'white' : 'var(--text-secondary)'
                          }}>
                            {message.fileSize}
                          </div>
                        </div>
                        <button style={{
                          padding: '0.5rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          color: message.sender === 'client' ? 'white' : 'var(--text-secondary)'
                        }}>
                          <Download size={16} />
                        </button>
                      </div>
                    )}

                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div style={{
                        display: 'flex',
                        gap: '0.25rem',
                        marginTop: '0.5rem',
                        flexWrap: 'wrap'
                      }}>
                        {message.reactions.map((reaction, reactionIndex) => (
                          <span
                            key={reactionIndex}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.125rem 0.375rem',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '1rem',
                              cursor: 'pointer'
                            }}
                            onClick={() => addReaction(message.id, reaction)}
                          >
                            {reaction}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message metadata */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    justifyContent: message.sender === 'client' ? 'flex-end' : 'flex-start',
                    paddingTop: '0.25rem'
                  }}>
                    <span>{formatTime(message.timestamp)}</span>
                    {message.edited && (
                      <>
                        <span>•</span>
                        <span>แก้ไขแล้ว</span>
                      </>
                    )}
                    {message.sender === 'client' && renderMessageStatus(message.status)}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '1rem 1rem 1rem 0.25rem',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '0.25rem'
                  }}>
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--text-secondary)',
                          animation: `typing 1.5s infinite ${i * 0.3}s`
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {selectedRoom.trainerName} กำลังพิมพ์...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Message Input */}
          <div style={{
            padding: '1rem 1.5rem',
            backgroundColor: 'var(--bg-primary)',
            borderTop: '1px solid var(--border-color)'
          }}>
            {/* File Upload Options */}
            {showFileUpload && (
              <div style={{
                marginBottom: '1rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                  gap: '1rem',
                  justifyContent: 'center'
                }}>
                  {fileTypes.map((fileType, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = fileType.accept;
                        input.multiple = fileType.type !== 'video';
                        input.onchange = (e) => handleFileUpload(e.target.files, fileType.type);
                        input.click();
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '1rem',
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = fileType.color + '10';
                        e.target.style.borderColor = fileType.color;
                        e.target.style.color = fileType.color;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'var(--bg-primary)';
                        e.target.style.borderColor = 'var(--border-color)';
                        e.target.style.color = 'var(--text-primary)';
                      }}
                    >
                      <fileType.icon size={24} />
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{fileType.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setShowFileUpload(!showFileUpload)}
                style={{
                  padding: '0.75rem',
                  backgroundColor: showFileUpload ? 'var(--primary)' : 'transparent',
                  color: showFileUpload ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <Paperclip size={18} />
              </button>

              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="พิมพ์ข้อความ..."
                  disabled={sendingMessage}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    maxHeight: '120px',
                    padding: '0.75rem 3rem 0.75rem 1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '1.5rem',
                    fontSize: '0.875rem',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    backgroundColor: 'var(--bg-secondary)',
                    opacity: sendingMessage ? 0.7 : 1
                  }}
                  rows={1}
                />
                <button
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '0.375rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--text-secondary)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                >
                  <Smile size={18} />
                </button>
              </div>

              <button
                onClick={() => sendMessage()}
                disabled={!newMessage.trim() || sendingMessage}
                style={{
                  padding: '0.75rem',
                  backgroundColor: (newMessage.trim() && !sendingMessage) ? 'var(--primary)' : 'var(--text-muted)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  cursor: (newMessage.trim() && !sendingMessage) ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  opacity: (newMessage.trim() && !sendingMessage) ? 1 : 0.6
                }}
              >
                {sendingMessage ? (
                  <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
            <MessageSquare size={64} style={{ 
              color: 'var(--accent)', 
              marginBottom: '1.5rem',
              opacity: 0.6 
            }} />
            <h3 style={{ 
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}>
              เลือกเทรนเนอร์เพื่อเริ่มสนทนา
            </h3>
            <p style={{ 
              color: 'var(--text-secondary)',
              lineHeight: '1.5',
              marginBottom: '2rem'
            }}>
              คลิกที่รายชื่อเทรนเนอร์ด้านซ้ายเพื่อเริ่มแชท พูดคุยเกี่ยวกับแผนการเทรน การโภชนาการ และความก้าวหน้าของคุณ
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              fontSize: '0.875rem',
              color: 'var(--text-muted)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Shield size={16} />
                ปลอดภัย
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Zap size={16} />
                รวดเร็ว
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Heart size={16} />
                เป็นมิตร
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      backgroundColor: 'var(--bg-secondary)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Mobile overlay */}
      {isMobile && showSidebar && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Chat Header for Mobile */}
      {isMobile && !showSidebar && !selectedRoom && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-color)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setShowSidebar(true)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                color: 'var(--text-primary)'
              }}
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                แชทกับเทรนเนอร์
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                color: soundEnabled ? 'var(--success)' : 'var(--text-muted)'
              }}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? 'var(--success)' : 'var(--accent)'
            }} />
          </div>
        </div>
      )}

      {/* Sidebar */}
      {(showSidebar || !isMobile) && renderSidebar()}

      {/* Main Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        paddingTop: isMobile && !showSidebar && !selectedRoom ? '80px' : '0'
      }}>
        {renderChatArea()}
      </div>

      <style jsx>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.95);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: var(--bg-secondary);
        }

        ::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }

        /* Message hover effects */
        .message-bubble:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(35, 41, 86, 0.15);
        }

        /* Button hover effects */
        button:hover {
          transform: translateY(-1px);
        }

        button:active {
          transform: translateY(0);
        }

        /* Smooth transitions */
        * {
          transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default ClientChatPage;