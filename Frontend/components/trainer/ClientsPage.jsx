import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Paperclip, Image, Video, FileText, Download, Phone, 
  MoreVertical, Smile, Search, CheckCheck, Volume2, VolumeX, 
  Users, Calendar, Clock, Dumbbell, Apple, BarChart3, 
  Plus, Star, Target, Award, Heart, Camera, Mic, MessageSquare,
  X, Edit, Copy, Reply, Forward, Archive, Pin, Flag,
  Settings, Info, Shield, Zap, BookOpen, Headphones,
  MicOff, PhoneCall, File, ChevronDown,
  AlertCircle, CheckCircle, XCircle, Loader, Eye,
  Trash2, RotateCcw, Filter, SortAsc, Bell, BellOff,
  Maximize2, Minimize2, Share, ExternalLink, Hash,
  AtSign, MapPin, Gift, Bookmark, AlertTriangle
} from 'lucide-react';

const EnhancedTrainerChatSystem = ({ windowWidth = 1200, setNotifications }) => {
  // State Management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [notification, setNotification] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [messageDrafts, setMessageDrafts] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [chatSettings, setChatSettings] = useState({
    theme: 'light',
    fontSize: 'medium',
    enterToSend: true,
    readReceipts: true,
    typing: true,
    sounds: true,
    translation: false
  });
  const [expandedView, setExpandedView] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState(new Set());
  const [archivedChats, setArchivedChats] = useState(new Set());
  const [blockedUsers, setBlockedUsers] = useState(new Set());
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [messageReactions, setMessageReactions] = useState({});
  const [offlineQueue, setOfflineQueue] = useState([]);
  
  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageInputRef = useRef(null);

  // API Functions for Database Connection
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`/api/chat/${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      showNotification(`เกิดข้อผิดพลาดในการเชื่อมต่อ: ${error.message}`, 'error');
      throw error;
    }
  };

  // Database Functions
  const loadChatRoomsFromDB = useCallback(async () => {
    try {
      setLoading(true);
      
      // ดึงข้อมูลจาก project knowledge
      if (window.project_knowledge_search) {
        try {
          const searchResult = await window.project_knowledge_search({
            query: 'chat rooms clients trainer conversations',
            max_text_results: 10
          });

          if (searchResult && searchResult.length > 0) {
            // แปลงข้อมูลจาก project knowledge เป็น format ที่ใช้งาน
            const roomsFromSearch = searchResult.map((result, index) => ({
              id: index + 1,
              clientName: result.title || `ลูกค้า ${index + 1}`,
              avatar: result.title ? result.title.charAt(0).toUpperCase() : 'C',
              lastMessage: result.content?.substring(0, 50) || 'ไม่มีข้อความ',
              lastMessageTime: new Date(result.timestamp || Date.now()),
              unreadCount: Math.floor(Math.random() * 5),
              isOnline: Math.random() > 0.5,
              packageType: ['Premium', 'Standard', 'Basic'][Math.floor(Math.random() * 3)],
              progressScore: Math.floor(Math.random() * 100),
              totalSessions: Math.floor(Math.random() * 20) + 5,
              completedSessions: Math.floor(Math.random() * 15) + 1,
              nextSession: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
              clientSince: `${Math.floor(Math.random() * 12) + 1} เดือน`,
              status: 'active'
            }));

            setChatRooms(roomsFromSearch);
            if (!selectedRoom && roomsFromSearch.length > 0) {
              setSelectedRoom(roomsFromSearch[0]);
            }
          } else {
            // Fallback ถ้าไม่มีข้อมูลใน project knowledge
            await loadDefaultChatRooms();
          }
        } catch (searchError) {
          console.warn('Project knowledge search failed, using API fallback:', searchError);
          await loadDefaultChatRooms();
        }
      } else {
        await loadDefaultChatRooms();
      }

      setOnlineUsers(new Set(chatRooms.filter(r => r.isOnline).map(r => r.id)));
      
      // Update notifications count
      const totalUnread = chatRooms.reduce((sum, r) => sum + r.unreadCount, 0);
      if (setNotifications) {
        setNotifications(totalUnread);
      }
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
      showNotification('ไม่สามารถโหลดข้อมูลแชทได้', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedRoom, setNotifications, chatRooms]);

  const loadDefaultChatRooms = async () => {
    try {
      const rooms = await apiCall('rooms');
      setChatRooms(rooms);
      if (!selectedRoom && rooms.length > 0) {
        setSelectedRoom(rooms[0]);
      }
    } catch (error) {
      // Fallback to empty array instead of hardcoded data
      setChatRooms([]);
    }
  };

  const loadMessagesFromDB = useCallback(async (roomId) => {
    if (!roomId) return;

    try {
      setLoading(true);

      // ดึงข้อมูลข้อความจาก project knowledge
      if (window.project_knowledge_search) {
        try {
          const searchResult = await window.project_knowledge_search({
            query: `messages chat room ${roomId} conversation history`,
            max_text_results: 20
          });

          if (searchResult && searchResult.length > 0) {
            const messagesFromSearch = searchResult.map((result, index) => ({
              id: index + 1,
              text: result.content || result.title || 'ข้อความ',
              sender: index % 2 === 0 ? 'trainer' : 'client',
              timestamp: new Date(result.timestamp || Date.now() - (index * 1000000)),
              type: 'text',
              status: 'read',
              isEdited: false,
              replyTo: null,
              reactions: {},
              isPinned: false
            }));

            setMessages(messagesFromSearch);
          } else {
            await loadDefaultMessages(roomId);
          }
        } catch (searchError) {
          console.warn('Message search failed, using API fallback:', searchError);
          await loadDefaultMessages(roomId);
        }
      } else {
        await loadDefaultMessages(roomId);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      showNotification('ไม่สามารถโหลดข้อความได้', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDefaultMessages = async (roomId) => {
    try {
      const messages = await apiCall(`rooms/${roomId}/messages`);
      setMessages(messages);
    } catch (error) {
      // Fallback to hardcoded messages
      const fallbackMessages = [
        {
          id: 1,
          text: 'สวัสดีครับ! เป็นไงบ้างครับการเทรนเมื่อวาน?',
          sender: 'trainer',
          timestamp: new Date(Date.now() - 7200000),
          type: 'text',
          status: 'read',
          isEdited: false,
          replyTo: null,
          reactions: {},
          isPinned: false
        }
      ];
      setMessages(fallbackMessages);
    }
  };

  const saveMessageToDB = async (message) => {
    try {
      const savedMessage = await apiCall('messages', {
        method: 'POST',
        body: JSON.stringify({
          ...message,
          roomId: selectedRoom?.id,
          senderId: 'trainer', // หรือ userId ของ trainer ที่ล็อกอิน
          timestamp: new Date().toISOString()
        })
      });

      return savedMessage;
    } catch (error) {
      console.error('Failed to save message:', error);
      // เก็บข้อความไว้ใน offline queue
      setOfflineQueue(prev => [...prev, message]);
      return message;
    }
  };

  const updateChatRoomInDB = async (roomId, updates) => {
    try {
      await apiCall(`rooms/${roomId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.error('Failed to update chat room:', error);
    }
  };

  const syncOfflineMessages = async () => {
    if (offlineQueue.length === 0) return;

    try {
      for (const message of offlineQueue) {
        await saveMessageToDB(message);
      }
      setOfflineQueue([]);
      showNotification('ซิงค์ข้อความออฟไลน์เรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error('Failed to sync offline messages:', error);
    }
  };

  // Enhanced message templates for trainers
  const messageTemplates = [
    {
      category: 'การเทรน',
      icon: Dumbbell,
      color: 'var(--primary)',
      templates: [
        {
          id: 'workout_great',
          text: 'เยี่ยมมากครับ! ให้พักตามเวลาที่กำหนดนะครับ 💪',
          shortcut: '/great'
        },
        {
          id: 'workout_hydrate',
          text: 'วันนี้เทรนหนักมาก อย่าลืมดื่มน้ำเยอะๆ นะครับ 💧',
          shortcut: '/water'
        },
        {
          id: 'form_good',
          text: 'ฟอร์มการออกกำลังกายดีมากแล้วครับ ทำต่อแบบนี้เลย ✅',
          shortcut: '/form'
        },
        {
          id: 'increase_weight',
          text: 'พรุ่งนี้เราจะเพิ่มน้ำหนักอีกนิดนะครับ พร้อมไหม? 🏋️‍♂️',
          shortcut: '/increase'
        },
        {
          id: 'warm_up',
          text: 'อย่าลืมวอร์มอัพก่อนเทรนนะครับ ป้องกันการบาดเจ็บ 🔥',
          shortcut: '/warmup'
        },
        {
          id: 'cool_down',
          text: 'คูลดาวน์ให้ดีนะครับ ยืดเส้นยืดสายเพื่อกล้ามเนื้อ 🧘‍♂️',
          shortcut: '/cooldown'
        }
      ]
    },
    {
      category: 'โภชนาการ',
      icon: Apple,
      color: 'var(--success)',
      templates: [
        {
          id: 'protein_reminder',
          text: 'อย่าลืมกินโปรตีนหลังเทรนภายใน 30 นาที นะครับ 🥤',
          shortcut: '/protein'
        },
        {
          id: 'water_check',
          text: 'วันนี้ดื่มน้ำครบ 2-3 ลิตรไหมครับ? 💧',
          shortcut: '/hydration'
        },
        {
          id: 'meal_plan',
          text: 'แผนอาหารสัปดาห์หน้าจะส่งให้เย็นนี้นะครับ 📋',
          shortcut: '/mealplan'
        },
        {
          id: 'avoid_junk',
          text: 'เลี่ยงของหวานและของทอดในช่วงนี้นะครับ 🚫🍟',
          shortcut: '/avoid'
        },
        {
          id: 'meal_timing',
          text: 'กินข้าวให้ตรงเวลานะครับ ร่างกายจะได้พลังงานสม่ำเสมอ ⏰',
          shortcut: '/timing'
        },
        {
          id: 'supplements',
          text: 'ถ้าทานวิตามินหรือซัพพลีเมนต์ อย่าลืมแจ้งให้ฉันทราบนะครับ 💊',
          shortcut: '/supplements'
        }
      ]
    },
    {
      category: 'กำลังใจ',
      icon: Heart,
      color: 'var(--accent)',
      templates: [
        {
          id: 'encourage_effort',
          text: 'เก่งมากครับ! เห็นความพยายามชัดเจน ภูมิใจในตัวมากเลย 💪✨',
          shortcut: '/great'
        },
        {
          id: 'patience',
          text: 'อย่าท้อนะครับ ความก้าวหน้าต้องใช้เวลา เชื่อในกระบวนการ 🌱',
          shortcut: '/patience'
        },
        {
          id: 'proud',
          text: 'ภูมิใจในตัวคุณมากเลยครับ ทำได้ดีมาก! 🎉👏',
          shortcut: '/proud'
        },
        {
          id: 'rest_important',
          text: 'วันนี้พักผ่อนให้เพียงพอนะครับ การพักก็สำคัญเท่าการเทรน 😴',
          shortcut: '/rest'
        },
        {
          id: 'progress_visible',
          text: 'ความก้าวหน้าของคุณเห็นได้ชัดเลยครับ เดินหน้าต่อไป! 📈',
          shortcut: '/progress'
        },
        {
          id: 'believe',
          text: 'เชื่อในตัวเองนะครับ คุณทำได้แน่นอน! 🌟',
          shortcut: '/believe'
        }
      ]
    },
    {
      category: 'การนัดหมาย',
      icon: Calendar,
      color: 'var(--info)',
      templates: [
        {
          id: 'schedule_session',
          text: 'จองเซสชั่นถัดไปได้แล้วครับ เลือกเวลาที่สะดวก 📅',
          shortcut: '/schedule'
        },
        {
          id: 'confirm_appointment',
          text: 'ยืนยันนัดพรุ่งนี้นะครับ เวลา XX:XX น. 📝',
          shortcut: '/confirm'
        },
        {
          id: 'reschedule',
          text: 'ถ้าต้องการเลื่อนนัด แจ้งล่วงหน้า 24 ชั่วโมงนะครับ 🔄',
          shortcut: '/reschedule'
        },
        {
          id: 'session_reminder',
          text: 'เตือนความจำ: นัดเทรนพรุ่งนี้ เวลา XX:XX น. ⏰',
          shortcut: '/reminder'
        },
        {
          id: 'bring_items',
          text: 'อย่าลืมเอาเสื้อผ้าออกกำลังกายและขวดน้ำมาด้วยนะครับ 🎒',
          shortcut: '/bring'
        }
      ]
    },
    {
      category: 'ความปลอดภัย',
      icon: Shield,
      color: 'var(--warning)',
      templates: [
        {
          id: 'safety_first',
          text: 'ความปลอดภัยเป็นสิ่งสำคัญที่สุด หยุดได้ทันทีถ้ารู้สึกไม่สบาย ⚠️',
          shortcut: '/safety'
        },
        {
          id: 'listen_body',
          text: 'ฟังร่างกายตัวเอง ถ้าเจ็บหรือเมื่อยผิดปกติ แจ้งให้ทราบ 🩺',
          shortcut: '/listen'
        },
        {
          id: 'proper_form',
          text: 'ท่าทางที่ถูกต้องสำคัญกว่าน้ำหนักหนัก ความปลอดภัยก่อน 🎯',
          shortcut: '/properform'
        },
        {
          id: 'medical_check',
          text: 'ถ้ามีอาการผิดปกติ ควรปรึกษาแพทย์ก่อนออกกำลังกายต่อ 👨‍⚕️',
          shortcut: '/medical'
        }
      ]
    }
  ];

  // Emoji picker data
  const emojiCategories = [
    {
      name: 'ออกกำลังกาย',
      emojis: ['💪', '🏋️‍♂️', '🏋️‍♀️', '🏃‍♂️', '🏃‍♀️', '🤸‍♂️', '🤸‍♀️', '🚴‍♂️', '🚴‍♀️', '🏊‍♂️', '🏊‍♀️', '🧘‍♂️', '🧘‍♀️']
    },
    {
      name: 'อาหาร',
      emojis: ['🥗', '🍎', '🍌', '🥑', '🥤', '💧', '🍳', '🥛', '🍗', '🐟', '🥜', '🍓', '🥕']
    },
    {
      name: 'อารมณ์',
      emojis: ['😊', '😄', '👏', '🎉', '✨', '💯', '🔥', '⚡', '🌟', '👍', '👌', '✅', '❤️']
    },
    {
      name: 'เวลา',
      emojis: ['⏰', '⏳', '📅', '📆', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗']
    }
  ];

  // Initialize and load data
  useEffect(() => {
    const initializeChat = async () => {
      setIsConnected(false);
      setLoading(true);
      
      try {
        await loadChatRoomsFromDB();
        
        // ซิงค์ข้อความออฟไลน์หากมี
        if (offlineQueue.length > 0) {
          await syncOfflineMessages();
        }
        
        setIsConnected(true);
        showNotification('เชื่อมต่อระบบแชทเรียบร้อยแล้ว', 'success');
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        showNotification('เชื่อมต่อระบบไม่สำเร็จ กำลังใช้งานออฟไลน์', 'warning');
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [loadChatRoomsFromDB, offlineQueue, syncOfflineMessages]);

  // Load messages when room changes
  useEffect(() => {
    if (selectedRoom) {
      loadMessagesFromDB(selectedRoom.id);
    }
  }, [selectedRoom, loadMessagesFromDB]);

  // Check connection status periodically
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await apiCall('health');
        if (!isConnected) {
          setIsConnected(true);
          await syncOfflineMessages();
        }
      } catch (error) {
        setIsConnected(false);
      }
    };

    const interval = setInterval(checkConnection, 30000); // ตรวจสอบทุก 30 วินาที
    return () => clearInterval(interval);
  }, [isConnected, syncOfflineMessages]);

  // Apply CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', '#232956');
    root.style.setProperty('--accent', '#df2528');
    root.style.setProperty('--success', '#10b981');
    root.style.setProperty('--warning', '#f59e0b');
    root.style.setProperty('--danger', '#ef4444');
    root.style.setProperty('--info', '#3b82f6');
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-secondary', '#f8fafc');
    root.style.setProperty('--text-primary', '#1e293b');
    root.style.setProperty('--text-secondary', '#64748b');
    root.style.setProperty('--text-muted', '#94a3b8');
    root.style.setProperty('--text-white', '#ffffff');
    root.style.setProperty('--border-color', '#e2e8f0');
  }, []);

  // Auto-save message drafts
  useEffect(() => {
    if (selectedRoom && newMessage.trim()) {
      setMessageDrafts(prev => ({
        ...prev,
        [selectedRoom.id]: newMessage
      }));
    }
  }, [newMessage, selectedRoom]);

  // Load message draft when changing rooms
  useEffect(() => {
    if (selectedRoom && messageDrafts[selectedRoom.id]) {
      setNewMessage(messageDrafts[selectedRoom.id]);
    } else {
      setNewMessage('');
    }
  }, [selectedRoom, messageDrafts]);

  // Voice recording timer
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message with database integration
  const sendMessage = useCallback(async (messageText = newMessage, messageType = 'text', fileData = null) => {
    if (!messageText.trim() && !fileData) return;

    const tempId = Date.now() + Math.random();
    const message = {
      id: tempId,
      text: messageText,
      sender: 'trainer',
      timestamp: new Date(),
      type: messageType,
      status: 'sending',
      isEdited: false,
      replyTo: replyingTo?.id || null,
      reactions: {},
      isPinned: false,
      ...fileData
    };

    // เพิ่มข้อความลงใน UI ทันที
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setReplyingTo(null);
    setShowTemplates(false);
    setShowEmojiPicker(false);

    // Clear draft
    if (selectedRoom) {
      setMessageDrafts(prev => {
        const newDrafts = { ...prev };
        delete newDrafts[selectedRoom.id];
        return newDrafts;
      });
    }

    try {
      // บันทึกข้อความลงฐานข้อมูล
      const savedMessage = await saveMessageToDB(message);
      
      // อัปเดต message ด้วย ID จริงจากฐานข้อมูล
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...savedMessage, status: 'sent' } : msg
        )
      );

      // อัปเดต chat room
      if (selectedRoom) {
        const roomUpdates = {
          lastMessage: messageText,
          lastMessageTime: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        };
        
        await updateChatRoomInDB(selectedRoom.id, roomUpdates);
        
        setChatRooms(prev => 
          prev.map(room => 
            room.id === selectedRoom.id 
              ? { ...room, lastMessage: messageText, lastMessageTime: new Date() }
              : room
          )
        );
      }

      // อัปเดตสถานะเป็น delivered
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === savedMessage.id ? { ...msg, status: 'delivered' } : msg
          )
        );
      }, 1000);

      // จำลองการตอบกลับจากลูกค้า (สำหรับ demo)
      if (selectedRoom?.isOnline && messageType === 'text') {
        setTimeout(() => {
          const responses = [
            'ขอบคุณครับโค้ช',
            'รับทราบค่ะ',
            'เข้าใจแล้วครับ',
            'ได้เลยค่ะ',
            'โอเคครับ',
            'ขอบคุณมากค่ะ',
            'เก็บไว้ครับ'
          ];
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          
          const clientMessage = {
            id: Date.now() + Math.random(),
            text: randomResponse,
            sender: 'client',
            timestamp: new Date(),
            type: 'text',
            status: 'delivered',
            isEdited: false,
            replyTo: null,
            reactions: {},
            isPinned: false
          };
          
          setMessages(prev => [...prev, clientMessage]);
          
          // บันทึกข้อความของลูกค้าลงฐานข้อมูลด้วย
          saveMessageToDB({
            ...clientMessage,
            sender: 'client',
            senderId: selectedRoom.clientId
          });

          if (soundEnabled) {
            playNotificationSound();
          }

          // Mark trainer message as read
          setTimeout(() => {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === savedMessage.id ? { ...msg, status: 'read' } : msg
              )
            );
          }, 2000);
        }, 2000 + Math.random() * 3000);
      }

    } catch (error) {
      // หากบันทึกล้มเหลว อัปเดตสถานะเป็น error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...msg, status: 'error' } : msg
        )
      );
      showNotification('ส่งข้อความไม่สำเร็จ จะลองส่งใหม่อัตโนมัติ', 'error');
    }
  }, [newMessage, replyingTo, selectedRoom, soundEnabled, messageDrafts]);

  // Handle quick actions
  const sendQuickAction = (actionType) => {
    let message = '';
    let fileData = null;

    switch (actionType) {
      case 'workout_plan':
        message = 'ส่งแผนการเทรนใหม่ให้แล้วครับ กรุณาตรวจสอบ';
        fileData = {
          type: 'file',
          fileUrl: '#',
          fileName: 'workout_plan_new.pdf',
          fileSize: '3.2 MB'
        };
        break;
      case 'nutrition_plan':
        message = 'อัพเดทแผนโภชนาการใหม่แล้วครับ';
        fileData = {
          type: 'file',
          fileUrl: '#',
          fileName: 'nutrition_plan_updated.pdf',
          fileSize: '2.8 MB'
        };
        break;
      case 'schedule_session':
        message = 'จองเซสชั่นถัดไปได้แล้วครับ เลือกเวลาที่สะดวก 📅';
        break;
      case 'progress_check':
        message = 'ขอดูความก้าวหน้าล่าสุดหน่อยครับ ส่งรูปมาได้ไหม 📸';
        break;
    }
    
    if (message) {
      sendMessage(message, fileData?.type || 'text', fileData);
    }
    setShowQuickActions(false);
  };

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setNewMessage(template.text);
    setShowTemplates(false);
    // Auto-focus input
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileData = {
      fileUrl: URL.createObjectURL(file),
      fileName: file.name,
      fileSize: formatFileSize(file.size)
    };

    let messageType = 'file';
    if (file.type.startsWith('image/')) {
      messageType = 'image';
    } else if (file.type.startsWith('video/')) {
      messageType = 'video';
      // Get video duration (simplified)
      fileData.duration = 60; // placeholder
    } else if (file.type.startsWith('audio/')) {
      messageType = 'voice';
      fileData.duration = 30; // placeholder
    }

    sendMessage('', messageType, fileData);
    setShowFileUpload(false);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/m4a' });
        const fileData = {
          fileUrl: URL.createObjectURL(blob),
          fileName: `voice_${Date.now()}.m4a`,
          fileSize: formatFileSize(blob.size),
          duration: recordingTime
        };
        
        sendMessage('', 'voice', fileData);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      showNotification('ไม่สามารถเข้าถึงไมโครโฟนได้', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+TyvmAaATqDz/PQeBsFTHjT8d+VPwgXcbTotWAYAUWm5+a3ZxkDUqb');
    audio.play().catch(e => console.log('Could not play notification sound'));
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Message actions
  const toggleMessageReaction = (messageId, emoji) => {
    setMessageReactions(prev => {
      const messageReactions = prev[messageId] || {};
      const emojiReactions = messageReactions[emoji] || [];
      const userId = 'trainer'; // Current user
      
      const newReactions = emojiReactions.includes(userId)
        ? emojiReactions.filter(id => id !== userId)
        : [...emojiReactions, userId];
      
      return {
        ...prev,
        [messageId]: {
          ...messageReactions,
          [emoji]: newReactions.length > 0 ? newReactions : undefined
        }
      };
    });

    // Update messages with reactions
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              reactions: {
                ...msg.reactions,
                [emoji]: messageReactions[messageId]?.[emoji] || []
              }
            }
          : msg
      )
    );
  };

  const deleteMessage = async (messageId) => {
    try {
      await apiCall(`messages/${messageId}`, { method: 'DELETE' });
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      showNotification('ลบข้อความแล้ว', 'success');
    } catch (error) {
      showNotification('ไม่สามารถลบข้อความได้', 'error');
    }
  };

  const editMessage = async (messageId, newText) => {
    try {
      await apiCall(`messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ text: newText })
      });

      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, text: newText, isEdited: true }
            : msg
        )
      );
      setEditingMessage(null);
      showNotification('แก้ไขข้อความแล้ว', 'success');
    } catch (error) {
      showNotification('ไม่สามารถแก้ไขข้อความได้', 'error');
    }
  };

  const pinMessage = (messageId) => {
    setPinnedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
        showNotification('ยกเลิกการปักหมุดแล้ว', 'info');
      } else {
        newSet.add(messageId);
        showNotification('ปักหมุดข้อความแล้ว', 'success');
      }
      return newSet;
    });

    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isPinned: !msg.isPinned }
          : msg
      )
    );
  };

  const forwardMessage = (messageId) => {
    // Implementation for forwarding message
    showNotification('ฟีเจอร์ส่งต่อจะพร้อมใช้งานเร็วๆ นี้', 'info');
  };

  const copyMessage = (messageText) => {
    navigator.clipboard.writeText(messageText);
    showNotification('คัดลอกข้อความแล้ว', 'success');
  };

  // Filter chat rooms
  const filteredRooms = chatRooms.filter(room => {
    if (archivedChats.has(room.id) && filterType !== 'archived') return false;
    if (blockedUsers.has(room.id) && filterType !== 'blocked') return false;
    
    const matchesSearch = room.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (filterType) {
      case 'active':
        return matchesSearch && room.status === 'active';
      case 'premium':
        return matchesSearch && room.packageType === 'Premium';
      case 'new':
        return matchesSearch && room.status === 'new';
      case 'pinned':
        return matchesSearch && room.isPinned;
      case 'archived':
        return matchesSearch && archivedChats.has(room.id);
      case 'blocked':
        return matchesSearch && blockedUsers.has(room.id);
      default:
        return matchesSearch;
    }
  });

  // Filter messages based on search
  const filteredMessages = messages.filter(message => {
    if (!messageSearchQuery) return true;
    return message.text.toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
           message.fileName?.toLowerCase().includes(messageSearchQuery.toLowerCase());
  });

  // Format timestamp
  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'เมื่อสักครู่';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาทีที่แล้ว`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ชั่วโมงที่แล้ว`;
    return timestamp.toLocaleDateString('th-TH');
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render message status
  const renderMessageStatus = (status) => {
    switch (status) {
      case 'sending':
        return <Loader size={14} className="animate-spin" style={{ color: '#94a3b8' }} />;
      case 'sent':
        return <CheckCheck size={16} style={{ color: '#718096' }} />;
      case 'delivered':
        return <CheckCheck size={16} style={{ color: '#4299e1' }} />;
      case 'read':
        return <CheckCheck size={16} style={{ color: '#48bb78' }} />;
      case 'error':
        return <AlertCircle size={16} style={{ color: '#ef4444' }} />;
      default:
        return null;
    }
  };

  // Get package color
  const getPackageColor = (packageType) => {
    switch (packageType) {
      case 'Premium': return 'var(--accent)';
      case 'Standard': return 'var(--primary)';
      case 'Basic': return 'var(--success)';
      default: return 'var(--text-secondary)';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        padding: windowWidth <= 768 ? '1rem' : '2rem',
        backgroundColor: 'var(--bg-secondary)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size={48} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            กำลังโหลดข้อมูลแชท...
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            กรุณารอสักครู่
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: windowWidth <= 768 ? '1rem' : '2rem',
      backgroundColor: 'var(--bg-secondary)',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          zIndex: 9999,
          backgroundColor: notification.type === 'error' ? 'var(--danger)' : 
                           notification.type === 'success' ? 'var(--success)' : 
                           notification.type === 'warning' ? 'var(--warning)' :
                           'var(--info)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          {notification.type === 'error' && <XCircle size={20} />}
          {notification.type === 'success' && <CheckCircle size={20} />}
          {notification.type === 'warning' && <AlertTriangle size={20} />}
          {notification.type === 'info' && <Info size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h1 style={{
              fontSize: windowWidth <= 768 ? '1.5rem' : '2rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}>
              แชทกับลูกค้า
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              สื่อสารและให้คำแนะนำกับลูกค้าของคุณ
            </p>
          </div>
          
          {/* Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Connection Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${isConnected ? 'var(--success)' : 'var(--danger)'}`
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? 'var(--success)' : 'var(--danger)'
              }} />
              <span style={{
                fontSize: '0.75rem',
                color: isConnected ? 'var(--success)' : 'var(--danger)',
                fontWeight: '600'
              }}>
                {isConnected ? 'เชื่อมต่อแล้ว' : 'ออฟไลน์'}
              </span>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{
                padding: '0.75rem',
                backgroundColor: soundEnabled ? 'var(--success)' : 'var(--text-secondary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            
            <button
              onClick={() => setExpandedView(!expandedView)}
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {expandedView ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            backgroundColor: 'rgba(35, 41, 86, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto'
          }}>
            <Users size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {chatRooms.length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ลูกค้าทั้งหมด</div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto'
          }}>
            <Heart size={20} color="var(--success)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {chatRooms.filter(r => r.isOnline).length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ออนไลน์</div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            backgroundColor: 'rgba(223, 37, 40, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto'
          }}>
            <MessageSquare size={20} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {chatRooms.reduce((sum, r) => sum + r.unreadCount, 0)}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ข้อความใหม่</div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(223, 37, 40, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto'
          }}>
            <Volume2 size={20} color={isConnected ? 'var(--success)' : 'var(--accent)'} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {isConnected ? 'เชื่อมต่อ' : 'ออฟไลน์'}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>สถานะระบบ</div>
        </div>
      </div>

      {/* Offline Queue Notification */}
      {offlineQueue.length > 0 && (
        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid var(--warning)',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} color="var(--warning)" />
          <div style={{ flex: 1 }}>
            <span style={{ color: 'var(--warning)', fontWeight: '600' }}>
              มีข้อความ {offlineQueue.length} ข้อความรอการซิงค์
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
              ระบบจะซิงค์อัตโนมัติเมื่อเชื่อมต่อสำเร็จ
            </span>
          </div>
          <button
            onClick={syncOfflineMessages}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--warning)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            ซิงค์ตอนนี้
          </button>
        </div>
      )}

      {/* Chat Interface */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        border: '1px solid var(--border-color)',
        height: expandedView ? '80vh' : (windowWidth <= 768 ? '600px' : '700px'),
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Client List Sidebar */}
        <div style={{
          width: windowWidth <= 768 ? '100%' : '380px',
          borderRight: windowWidth <= 768 ? 'none' : '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          {/* Filters & Search */}
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid var(--border-color)'
          }}>
            {/* Filter Buttons */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1rem',
              flexWrap: 'wrap'
            }}>
              {[
                { key: 'all', label: 'ทั้งหมด', icon: Users },
                { key: 'active', label: 'ใช้งาน', icon: Heart },
                { key: 'premium', label: 'Premium', icon: Star },
                { key: 'new', label: 'ลูกค้าใหม่', icon: Plus },
                { key: 'pinned', label: 'ปักหมุด', icon: Pin },
                { key: 'archived', label: 'เก็บถาวร', icon: Archive }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterType(filter.key)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.75rem',
                    backgroundColor: filterType === filter.key ? 'var(--primary)' : 'transparent',
                    color: filterType === filter.key ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <filter.icon size={14} />
                  {windowWidth <= 768 ? filter.label.split(' ')[0] : filter.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search 
                size={18} 
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)'
                }}
              />
              <input
                type="text"
                placeholder="ค้นหาลูกค้า..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--bg-primary)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Client List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredRooms.length > 0 ? (
              filteredRooms.map(room => (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    backgroundColor: selectedRoom?.id === room.id ? 'var(--bg-primary)' : 'transparent',
                    transition: 'background-color 0.2s',
                    position: 'relative'
                  }}
                >
                  {/* Pin indicator */}
                  {room.isPinned && (
                    <Pin 
                      size={14} 
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        color: 'var(--accent)'
                      }}
                    />
                  )}
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    {/* Avatar with online status */}
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        backgroundColor: getPackageColor(room.packageType),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '1.25rem'
                      }}>
                        {room.avatar}
                      </div>
                      {room.isOnline && (
                        <div style={{
                          position: 'absolute',
                          bottom: '2px',
                          right: '2px',
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--success)',
                          border: '2px solid var(--bg-primary)'
                        }} />
                      )}
                      {/* Package indicator */}
                      <div style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: getPackageColor(room.packageType),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        color: 'white',
                        fontWeight: '700'
                      }}>
                        {room.packageType === 'Premium' ? 'P' : 
                         room.packageType === 'Standard' ? 'S' : 'B'}
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.25rem'
                      }}>
                        <div style={{
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem'
                        }}>
                          {room.clientName}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)'
                        }}>
                          {formatTime(room.lastMessageTime)}
                        </div>
                      </div>
                      
                      <div style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '0.5rem'
                      }}>
                        {room.lastMessage}
                      </div>

                      {/* Client Quick Info */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.5rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <BarChart3 size={12} />
                          <span>{room.progressScore}%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={12} />
                          <span>{room.completedSessions}/{room.totalSessions}</span>
                        </div>
                      </div>

                      {/* Unread badge */}
                      {room.unreadCount > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '1rem',
                          right: '1rem',
                          backgroundColor: 'var(--accent)',
                          color: 'white',
                          borderRadius: '50%',
                          minWidth: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {room.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // แสดงข้อความเมื่อไม่มีข้อมูลลูกค้า
              !loading && (
                <div style={{
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  <MessageSquare size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ยังไม่มีข้อมูลลูกค้าในขณะนี้!
                  </h3>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                  }}>
                    รอลูกค้าติดต่อเข้ามา หรือเชิญลูกค้าใหม่เข้าร่วมระบบ
                  </p>
                </div>
              )
            )}
            
            {/* Loading indicator for rooms */}
            {loading && (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                <Loader size={24} className="animate-spin" />
                <div style={{ marginTop: '0.5rem' }}>กำลังโหลดลูกค้า...</div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Messages Area - แสดงเฉพาะใน desktop */}
        {windowWidth > 768 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedRoom ? (
              <>
                {/* Chat Header */}
                <div style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: getPackageColor(selectedRoom.packageType),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '1.25rem'
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
                          border: '2px solid var(--bg-secondary)'
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
                        {selectedRoom.clientName}
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: getPackageColor(selectedRoom.packageType),
                          color: 'white',
                          borderRadius: '0.25rem'
                        }}>
                          {selectedRoom.packageType}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>{selectedRoom.isOnline ? 'ออนไลน์' : `ออนไลน์ล่าสุด ${formatTime(selectedRoom.lastMessageTime)}`}</span>
                        <span>•</span>
                        <span>ลูกค้ามา {selectedRoom.clientSince}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Message Search */}
                    <div style={{ position: 'relative' }}>
                      <Search 
                        size={16} 
                        style={{
                          position: 'absolute',
                          left: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-secondary)'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="ค้นหาข้อความ..."
                        value={messageSearchQuery}
                        onChange={(e) => setMessageSearchQuery(e.target.value)}
                        style={{
                          width: '200px',
                          padding: '0.5rem 0.5rem 0.5rem 2rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          backgroundColor: 'var(--bg-primary)',
                          outline: 'none'
                        }}
                      />
                    </div>
                    
                    <button 
                      onClick={() => setShowQuickActions(!showQuickActions)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: showQuickActions ? 'var(--primary)' : 'transparent',
                        color: showQuickActions ? 'white' : 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      เมนูด่วน
                    </button>
                    
                    <button 
                      onClick={() => setShowClientProfile(!showClientProfile)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <Info size={18} />
                    </button>
                    
                    <button style={{
                      padding: '0.5rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)'
                    }}>
                      <Phone size={18} />
                    </button>
                    
                    <button style={{
                      padding: '0.5rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)'
                    }}>
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>

                {/* Quick Actions Panel */}
                {showQuickActions && (
                  <div style={{
                    padding: '1rem 1.5rem',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    gap: '1rem',
                    overflowX: 'auto'
                  }}>
                    <button
                      onClick={() => sendQuickAction('workout_plan')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        color: 'white',
                        minWidth: 'max-content'
                      }}
                    >
                      <Dumbbell size={20} />
                      <span style={{ fontSize: '0.75rem' }}>แผนเทรน</span>
                    </button>
                    <button
                      onClick={() => sendQuickAction('nutrition_plan')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        color: 'white',
                        minWidth: 'max-content'
                      }}
                    >
                      <Apple size={20} />
                      <span style={{ fontSize: '0.75rem' }}>แผนอาหาร</span>
                    </button>
                    <button
                      onClick={() => sendQuickAction('schedule_session')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        color: 'white',
                        minWidth: 'max-content'
                      }}
                    >
                      <Calendar size={20} />
                      <span style={{ fontSize: '0.75rem' }}>จองเซสชั่น</span>
                    </button>
                    <button
                      onClick={() => sendQuickAction('progress_check')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        color: 'white',
                        minWidth: 'max-content'
                      }}
                    >
                      <Target size={20} />
                      <span style={{ fontSize: '0.75rem' }}>เช็คความก้าวหน้า</span>
                    </button>
                  </div>
                )}

                {/* Messages Container */}
                <div 
                  ref={messagesContainerRef}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    overflowY: 'auto',
                    backgroundColor: 'var(--bg-secondary)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Reply Banner */}
                  {replyingTo && (
                    <div style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          ตอบกลับ {replyingTo.sender === 'trainer' ? 'คุณ' : selectedRoom.clientName}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {replyingTo.text.substring(0, 100)}...
                        </div>
                      </div>
                      <button
                        onClick={() => setReplyingTo(null)}
                        style={{
                          padding: '0.25rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {/* Messages */}
                  {filteredMessages.map(message => (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        justifyContent: message.sender === 'trainer' ? 'flex-end' : 'flex-start',
                        marginBottom: '1rem',
                        position: 'relative'
                      }}
                    >
                      {/* Pin indicator */}
                      {message.isPinned && (
                        <Pin 
                          size={12} 
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            left: message.sender === 'trainer' ? 'auto' : '0',
                            right: message.sender === 'trainer' ? '0' : 'auto',
                            color: 'var(--accent)',
                            zIndex: 1
                          }}
                        />
                      )}

                      <div style={{
                        maxWidth: '70%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}>
                        {/* Reply reference */}
                        {message.replyTo && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            padding: '0.5rem',
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            borderRadius: '0.5rem',
                            borderLeft: '3px solid var(--primary)',
                            marginBottom: '0.5rem'
                          }}>
                            ตอบกลับ: {messages.find(m => m.id === message.replyTo)?.text.substring(0, 50)}...
                          </div>
                        )}

                        <div 
                          onDoubleClick={() => message.sender === 'trainer' && setEditingMessage(message)}
                          style={{
                            padding: message.type === 'text' ? '0.75rem 1rem' : '0.5rem',
                            backgroundColor: message.sender === 'trainer' ? 'var(--primary)' : 'var(--bg-primary)',
                            color: message.sender === 'trainer' ? 'white' : 'var(--text-primary)',
                            borderRadius: message.sender === 'trainer' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                            border: message.sender === 'client' ? '1px solid var(--border-color)' : 'none',
                            position: 'relative',
                            cursor: 'pointer'
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            // Show context menu
                          }}
                        >
                          {/* Message Content */}
                          {message.type === 'text' && (
                            <div style={{ fontSize: '0.875rem' }}>
                              {editingMessage?.id === message.id ? (
                                <input
                                  type="text"
                                  defaultValue={message.text}
                                  autoFocus
                                  onBlur={(e) => {
                                    editMessage(message.id, e.target.value);
                                  }}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      editMessage(message.id, e.target.value);
                                    }
                                  }}
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: 'inherit',
                                    fontSize: 'inherit',
                                    width: '100%',
                                    outline: 'none'
                                  }}
                                />
                              ) : (
                                <>
                                  {message.text}
                                  {message.isEdited && (
                                    <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: '0.5rem' }}>
                                      (แก้ไขแล้ว)
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {message.type === 'image' && (
                            <div>
                              <img
                                src={message.fileUrl}
                                alt={message.fileName}
                                style={{
                                  width: '100%',
                                  maxWidth: '300px',
                                  borderRadius: '0.5rem',
                                  cursor: 'pointer'
                                }}
                                onClick={() => window.open(message.fileUrl, '_blank')}
                              />
                              {message.text && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                  {message.text}
                                </div>
                              )}
                            </div>
                          )}

                          {message.type === 'voice' && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.5rem',
                              minWidth: '200px'
                            }}>
                              <button style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'inherit',
                                cursor: 'pointer'
                              }}>
                                <Headphones size={20} />
                              </button>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                                  เสียงบันทึก
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                  {formatDuration(message.duration)}
                                </div>
                              </div>
                            </div>
                          )}

                          {(message.type === 'file' || message.type === 'video') && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.5rem'
                            }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '0.5rem',
                                backgroundColor: message.type === 'video' ? 'var(--info)' : 'var(--accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                              }}>
                                {message.type === 'video' ? <Video size={20} /> : <FileText size={20} />}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                                  {message.fileName}
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                  {message.fileSize}
                                  {message.duration && ` • ${formatDuration(message.duration)}`}
                                </div>
                              </div>
                              <button style={{
                                padding: '0.5rem',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                                color: message.sender === 'trainer' ? 'white' : 'var(--text-secondary)'
                              }}>
                                <Download size={16} />
                              </button>
                            </div>
                          )}

                          {/* Message Actions Menu */}
                          <div style={{
                            position: 'absolute',
                            top: '-10px',
                            right: message.sender === 'trainer' ? '-40px' : 'auto',
                            left: message.sender === 'client' ? '-40px' : 'auto',
                            display: 'flex',
                            gap: '0.25rem',
                            opacity: 0,
                            transition: 'opacity 0.2s'
                          }}
                          className="message-actions">
                            <button
                              onClick={() => setReplyingTo(message)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              <Reply size={12} />
                            </button>
                            
                            <button
                              onClick={() => pinMessage(message.id)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: message.isPinned ? 'var(--accent)' : 'var(--text-secondary)'
                              }}
                            >
                              <Pin size={12} />
                            </button>
                            
                            <button
                              onClick={() => copyMessage(message.text)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              <Copy size={12} />
                            </button>
                            
                            {message.sender === 'trainer' && (
                              <button
                                onClick={() => deleteMessage(message.id)}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--bg-primary)',
                                  border: '1px solid var(--border-color)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  color: 'var(--danger)'
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Message Reactions */}
                        {Object.keys(message.reactions || {}).length > 0 && (
                          <div style={{
                            display: 'flex',
                            gap: '0.25rem',
                            flexWrap: 'wrap',
                            marginTop: '0.25rem'
                          }}>
                            {Object.entries(message.reactions).map(([emoji, users]) => (
                              users.length > 0 && (
                                <button
                                  key={emoji}
                                  onClick={() => toggleMessageReaction(message.id, emoji)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.25rem 0.5rem',
                                    backgroundColor: users.includes('trainer') ? 'var(--primary)' : 'var(--bg-primary)',
                                    color: users.includes('trainer') ? 'white' : 'var(--text-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '1rem',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <span>{emoji}</span>
                                  <span>{users.length}</span>
                                </button>
                              )
                            ))}
                          </div>
                        )}

                        {/* Quick Reaction Buttons */}
                        <div style={{
                          display: 'flex',
                          gap: '0.25rem',
                          marginTop: '0.25rem',
                          opacity: 0
                        }}
                        className="quick-reactions">
                          {['👍', '❤️', '😊', '🔥', '💪'].map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => toggleMessageReaction(message.id, emoji)}
                              style={{
                                padding: '0.25rem',
                                backgroundColor: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          justifyContent: message.sender === 'trainer' ? 'flex-end' : 'flex-start'
                        }}>
                          <span>{formatTime(message.timestamp)}</span>
                          {message.sender === 'trainer' && renderMessageStatus(message.status)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
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
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <div style={{
                          display: 'flex',
                          gap: '0.25rem'
                        }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--text-secondary)',
                            animation: 'bounce 1.4s infinite ease-in-out both'
                          }}></div>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--text-secondary)',
                            animation: 'bounce 1.4s infinite ease-in-out both',
                            animationDelay: '-0.32s'
                          }}></div>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--text-secondary)',
                            animation: 'bounce 1.4s infinite ease-in-out both',
                            animationDelay: '-0.16s'
                          }}></div>
                        </div>
                        <span>กำลังพิมพ์...</span>
                      </div>
                    </div>
                  )}

                  {/* Loading indicator for messages */}
                  {loading && (
                    <div style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <Loader size={24} className="animate-spin" />
                      <div style={{ marginTop: '0.5rem' }}>กำลังโหลดข้อความ...</div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Templates Panel */}
                {showTemplates && (
                  <div style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                    backgroundColor: 'var(--bg-primary)',
                    borderTop: '1px solid var(--border-color)',
                    padding: '1rem'
                  }}>
                    {messageTemplates.map(category => (
                      <div key={category.category} style={{ marginBottom: '1.5rem' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.75rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: category.color
                        }}>
                          <category.icon size={16} />
                          <span>{category.category}</span>
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                          gap: '0.5rem'
                        }}>
                          {category.templates.map(template => (
                            <button
                              key={template.id}
                              onClick={() => handleTemplateSelect(template)}
                              style={{
                                padding: '0.75rem',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontSize: '0.875rem',
                                color: 'var(--text-primary)',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'var(--primary)';
                                e.target.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'var(--bg-secondary)';
                                e.target.style.color = 'var(--text-primary)';
                              }}
                            >
                              <div style={{ marginBottom: '0.25rem', fontSize: '0.75rem', color: 'inherit', opacity: 0.7 }}>
                                {template.shortcut}
                              </div>
                              {template.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div style={{
                    position: 'absolute',
                    bottom: '80px',
                    left: '1rem',
                    width: '300px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    zIndex: 1000
                  }}>
                    {emojiCategories.map(category => (
                      <div key={category.name} style={{ marginBottom: '1rem' }}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          marginBottom: '0.5rem'
                        }}>
                          {category.name}
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(6, 1fr)',
                          gap: '0.5rem'
                        }}>
                          {category.emojis.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => {
                                setNewMessage(prev => prev + emoji);
                                setShowEmojiPicker(false);
                              }}
                              style={{
                                padding: '0.5rem',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '0.25rem',
                                cursor: 'pointer',
                                fontSize: '1.25rem',
                                textAlign: 'center'
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* File Upload Options */}
                {showFileUpload && (
                  <div style={{
                    position: 'absolute',
                    bottom: '80px',
                    left: '1rem',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    minWidth: '200px'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      <button
                        onClick={() => {
                          fileInputRef.current.accept = 'image/*';
                          fileInputRef.current.click();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem'
                        }}
                      >
                        <Image size={18} color="var(--success)" />
                        รูปภาพ
                      </button>
                      
                      <button
                        onClick={() => {
                          fileInputRef.current.accept = 'video/*';
                          fileInputRef.current.click();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem'
                        }}
                      >
                        <Video size={18} color="var(--info)" />
                        วิดีโอ
                      </button>
                      
                      <button
                        onClick={() => {
                          fileInputRef.current.accept = '.pdf,.doc,.docx,.txt';
                          fileInputRef.current.click();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem'
                        }}
                      >
                        <FileText size={18} color="var(--accent)" />
                        เอกสาร
                      </button>
                      
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem',
                          backgroundColor: isRecording ? 'var(--accent)' : 'transparent',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          color: isRecording ? 'white' : 'var(--text-primary)',
                          fontSize: '0.875rem'
                        }}
                      >
                        {isRecording ? <MicOff size={18} /> : <Mic size={18} color="var(--warning)" />}
                        {isRecording ? `หยุดบันทึก (${formatDuration(recordingTime)})` : 'บันทึกเสียง'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '1rem'
                  }}>
                    <button
                      onClick={() => setShowFileUpload(!showFileUpload)}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Paperclip size={18} />
                    </button>

                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: showTemplates ? 'var(--primary)' : 'transparent',
                        color: showTemplates ? 'white' : 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <BookOpen size={18} />
                    </button>

                    <div style={{ flex: 1, position: 'relative' }}>
                      <textarea
                        ref={messageInputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && chatSettings.enterToSend) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="พิมพ์ข้อความ..."
                        disabled={!isConnected}
                        style={{
                          width: '100%',
                          minHeight: '44px',
                          maxHeight: '120px',
                          padding: '0.75rem 4rem 0.75rem 1rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '1rem',
                          fontSize: '0.875rem',
                          resize: 'none',
                          outline: 'none',
                          fontFamily: 'inherit',
                          backgroundColor: !isConnected ? 'var(--bg-secondary)' : 'white',
                          opacity: !isConnected ? 0.6 : 1
                        }}
                        rows={1}
                      />
                      
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        disabled={!isConnected}
                        style={{
                          position: 'absolute',
                          right: '2.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          padding: '0.25rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          opacity: !isConnected ? 0.5 : 1
                        }}
                      >
                        <Smile size={18} />
                      </button>

                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={!isConnected}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          padding: '0.25rem',
                          backgroundColor: isRecording ? 'var(--accent)' : 'transparent',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          color: isRecording ? 'white' : 'var(--text-secondary)',
                          opacity: !isConnected ? 0.5 : 1
                        }}
                      >
                        {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                      </button>
                    </div>

                    <button
                      onClick={() => sendMessage()}
                      disabled={(!newMessage.trim() && !isRecording) || !isConnected}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: (newMessage.trim() || isRecording) && isConnected ? 'var(--primary)' : 'var(--text-secondary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: ((newMessage.trim() || isRecording) && isConnected) ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <Send size={18} />
                    </button>
                  </div>

                  {/* Connection Status */}
                  {!isConnected && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--warning)',
                      marginTop: '0.5rem',
                      textAlign: 'center'
                    }}>
                      ⚠️ ไม่สามารถเชื่อมต่อได้ - ข้อความจะถูกส่งเมื่อเชื่อมต่อสำเร็จ
                    </div>
                  )}

                  {/* Draft indicator */}
                  {selectedRoom && messageDrafts[selectedRoom.id] && !newMessage && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      marginTop: '0.5rem'
                    }}>
                      💾 แก้ไขข้อความร่างไว้
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <MessageSquare size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    เลือกลูกค้าเพื่อเริ่มสนทนา
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    คลิกที่รายชื่อลูกค้าด้านซ้ายเพื่อเริ่มแชท
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Client Profile Sidebar */}
        {showClientProfile && selectedRoom && windowWidth > 768 && (
          <div style={{
            width: '320px',
            borderLeft: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Profile Header */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'var(--bg-primary)',
              borderBottom: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <button
                onClick={() => setShowClientProfile(false)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '1rem',
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                <X size={18} />
              </button>
              
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: getPackageColor(selectedRoom.packageType),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '700',
                fontSize: '2rem',
                margin: '0 auto 1rem auto'
              }}>
                {selectedRoom.avatar}
              </div>
              
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                {selectedRoom.clientName}
              </h3>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: getPackageColor(selectedRoom.packageType),
                  color: 'white',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {selectedRoom.packageType}
                </span>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: selectedRoom.isOnline ? 'var(--success)' : 'var(--text-secondary)',
                  color: 'white',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {selectedRoom.isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                    {selectedRoom.progressScore}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ความก้าวหน้า</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
                    {selectedRoom.completedSessions}/{selectedRoom.totalSessions}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>เซสชั่น</div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  ข้อมูลส่วนตัว
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>อายุ:</span>
                    <span style={{ fontWeight: '600' }}>{selectedRoom.age || 'ไม่ระบุ'} ปี</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>น้ำหนัก:</span>
                    <span style={{ fontWeight: '600' }}>{selectedRoom.weight || 'ไม่ระบุ'} กก.</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>ส่วนสูง:</span>
                    <span style={{ fontWeight: '600' }}>{selectedRoom.height || 'ไม่ระบุ'} ซม.</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>สถานที่:</span>
                    <span style={{ fontWeight: '600' }}>{selectedRoom.location || 'ไม่ระบุ'}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>เวลาที่ชอบ:</span>
                    <span style={{ fontWeight: '600' }}>{selectedRoom.preferredTime || 'ไม่ระบุ'}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  เป้าหมาย
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(selectedRoom.goals || ['ออกกำลังกาย', 'เพิ่มความแข็งแรง']).map((goal, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'var(--success)',
                        color: 'white',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        textAlign: 'center'
                      }}
                    >
                      {goal}
                    </div>
                  ))}
                </div>
              </div>

              {selectedRoom.medicalConditions && selectedRoom.medicalConditions.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '1rem'
                  }}>
                    ข้อควรระวัง
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedRoom.medicalConditions.map((condition, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'var(--warning)',
                          color: 'white',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          textAlign: 'center'
                        }}
                      >
                        ⚠️ {condition}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  บันทึกเพิ่มเติม
                </h4>
                
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5'
                }}>
                  {selectedRoom.notes || 'ไม่มีบันทึกเพิ่มเติม'}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  ข้อมูลติดต่อ
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)'
                  }}>
                    <Phone size={16} color="var(--primary)" />
                    <span style={{ fontSize: '0.875rem' }}>{selectedRoom.emergencyContact || 'ไม่ระบุ'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  การเข้าร่วม
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>เริ่มเป็นสมาชิก:</span>
                    <span style={{ fontWeight: '600' }}>{selectedRoom.joinDate ? selectedRoom.joinDate.toLocaleDateString('th-TH') : 'ไม่ระบุ'}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>เซสชั่นถัดไป:</span>
                    <span style={{ fontWeight: '600' }}>{selectedRoom.nextSession ? selectedRoom.nextSession.toLocaleDateString('th-TH') : 'ไม่ระบุ'}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>กิจกรรมล่าสุด:</span>
                    <span style={{ fontWeight: '600' }}>{formatTime(selectedRoom.lastActivity || selectedRoom.lastMessageTime)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Styles */}
      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .message-actions,
        .quick-reactions {
          transition: opacity 0.2s ease;
        }

        .message-actions:hover,
        .quick-reactions:hover {
          opacity: 1 !important;
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
          background: var(--text-secondary);
        }

        /* Hover effects for message bubbles */
        div:hover .message-actions {
          opacity: 1;
        }

        div:hover .quick-reactions {
          opacity: 0.7;
        }

        /* Animation for loading */
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default EnhancedTrainerChatSystem;
                