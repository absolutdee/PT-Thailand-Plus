import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Paperclip, Image, Video, FileText, Download, Phone, 
  MoreVertical, Smile, Search, CheckCheck, Volume2, VolumeX, 
  Shield, Users, TrendingUp, AlertTriangle, Eye, Ban, 
  MessageSquare, Filter, Calendar, Clock, User, Crown,
  Headphones, HelpCircle, CheckCircle, XCircle, AlertCircle,
  Tag, Star, Archive, RefreshCw, UserCheck, Settings,
  Priority, Timer, Activity, CreditCard
} from 'lucide-react';

// API service functions
const supportApiService = {
  // ดึงข้อมูล Support Tickets
  getSupportTickets: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.userType) queryParams.append('userType', filters.userType);
      if (filters.search) queryParams.append('search', filters.search);
      
      const response = await fetch(`/api/admin/support/tickets?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch support tickets');
      return await response.json();
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      return [];
    }
  },

  // ดึงข้อมูลสถิติ Support
  getSupportStats: async () => {
    try {
      const response = await fetch('/api/admin/support/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch support stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching support stats:', error);
      return {
        totalTickets: 0,
        openTickets: 0,
        pendingTickets: 0,
        resolvedTickets: 0,
        highPriority: 0,
        avgResponseTime: 'N/A',
        satisfactionRate: 0
      };
    }
  },

  // ดึงข้อความของ Ticket
  getTicketMessages: async (ticketId) => {
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/messages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch ticket messages');
      return await response.json();
    } catch (error) {
      console.error('Error fetching ticket messages:', error);
      return [];
    }
  },

  // ส่งข้อความตอบกลับ
  sendAdminMessage: async (ticketId, messageData) => {
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });
      
      if (!response.ok) throw new Error('Failed to send admin message');
      return await response.json();
    } catch (error) {
      console.error('Error sending admin message:', error);
      return null;
    }
  },

  // อัพเดตสถานะ Ticket
  updateTicketStatus: async (ticketId, status) => {
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) throw new Error('Failed to update ticket status');
      return await response.json();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      return null;
    }
  },

  // อัพเดตระดับความสำคัญ
  updateTicketPriority: async (ticketId, priority) => {
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/priority`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ priority })
      });
      
      if (!response.ok) throw new Error('Failed to update ticket priority');
      return await response.json();
    } catch (error) {
      console.error('Error updating ticket priority:', error);
      return null;
    }
  },

  // อัพโหลดไฟล์
  uploadFile: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/admin/support/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to upload file');
      return await response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  },

  // อัพเดตสถานะข้อความเป็นอ่านแล้ว
  markMessagesAsRead: async (ticketId) => {
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}/mark-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to mark messages as read');
      return await response.json();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }
};

const AdminSupportChat = ({ windowWidth }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [supportTickets, setSupportTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [notification, setNotification] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, open, pending, resolved, customer, trainer
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [supportStats, setSupportStats] = useState({});
  
  // Loading states
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingTicket, setUpdatingTicket] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ดึงข้อมูล Support Tickets จากฐานข้อมูล
  const loadSupportTickets = async (filters = {}) => {
    setLoadingTickets(true);
    try {
      const tickets = await supportApiService.getSupportTickets(filters);
      setSupportTickets(tickets);
      
      // เลือก ticket แรกหากยังไม่ได้เลือก
      if (!selectedTicket && tickets.length > 0) {
        setSelectedTicket(tickets[0]);
        await loadTicketMessages(tickets[0].id);
      }
    } catch (error) {
      console.error('Error loading support tickets:', error);
      setNotification({
        type: 'error',
        message: 'ไม่สามารถโหลดข้อมูล Support Tickets ได้'
      });
    } finally {
      setLoadingTickets(false);
    }
  };

  // ดึงข้อมูลสถิติ Support
  const loadSupportStats = async () => {
    try {
      const stats = await supportApiService.getSupportStats();
      setSupportStats(stats);
    } catch (error) {
      console.error('Error loading support stats:', error);
    }
  };

  // ดึงข้อความของ Ticket จากฐานข้อมูล
  const loadTicketMessages = async (ticketId) => {
    setLoadingMessages(true);
    try {
      const ticketMessages = await supportApiService.getTicketMessages(ticketId);
      setMessages(ticketMessages);
      
      // อัพเดตสถานะข้อความเป็นอ่านแล้ว
      await supportApiService.markMessagesAsRead(ticketId);
      
      // อัพเดต unread count ใน tickets list
      setSupportTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId ? { ...ticket, unreadCount: 0 } : ticket
        )
      );
    } catch (error) {
      console.error('Error loading ticket messages:', error);
      setNotification({
        type: 'error',
        message: 'ไม่สามารถโหลดข้อความได้'
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  // Initialize - โหลดข้อมูลเริ่มต้น
  useEffect(() => {
    const initializeData = async () => {
      setIsConnected(true);
      await Promise.all([
        loadSupportTickets(),
        loadSupportStats()
      ]);
    };

    initializeData();
  }, []);

  // Refresh data ทุก 30 วินาที
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      if (isConnected) {
        const currentFilters = {
          status: filterType !== 'all' && ['open', 'pending', 'resolved'].includes(filterType) ? filterType : undefined,
          userType: filterType !== 'all' && ['customer', 'trainer'].includes(filterType) ? filterType : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          search: searchQuery || undefined
        };
        
        await loadSupportTickets(currentFilters);
        await loadSupportStats();
      }
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [isConnected, filterType, priorityFilter, searchQuery]);

  // Apply filters เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    const applyFilters = async () => {
      const currentFilters = {
        status: filterType !== 'all' && ['open', 'pending', 'resolved'].includes(filterType) ? filterType : undefined,
        userType: filterType !== 'all' && ['customer', 'trainer'].includes(filterType) ? filterType : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: searchQuery || undefined
      };
      
      await loadSupportTickets(currentFilters);
    };

    const timeoutId = setTimeout(applyFilters, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [filterType, priorityFilter, searchQuery]);

  // Scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ส่งข้อความตอบกลับจาก Admin
  const sendAdminMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    setSendingMessage(true);
    try {
      const messageData = {
        text: newMessage.trim(),
        type: 'text',
        sender: 'admin',
        senderName: 'ทีมซัพพอร์ต'
      };

      // เพิ่มข้อความใน UI ก่อน
      const tempMessage = {
        id: `temp-${Date.now()}`,
        ...messageData,
        timestamp: new Date(),
        status: 'sending',
        isAdminMessage: true
      };

      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');

      // ส่งข้อความไปยัง API
      const sentMessage = await supportApiService.sendAdminMessage(selectedTicket.id, messageData);
      
      if (sentMessage) {
        // อัพเดตข้อความด้วยข้อมูลจาก server
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id ? { ...sentMessage, status: 'sent' } : msg
          )
        );

        // อัพเดต lastMessage ใน tickets list
        setSupportTickets(prev => 
          prev.map(ticket => 
            ticket.id === selectedTicket.id 
              ? { 
                  ...ticket, 
                  lastMessage: newMessage.trim(),
                  lastMessageTime: new Date(),
                  totalMessages: ticket.totalMessages + 1
                }
              : ticket
          )
        );

        // แจ้งเตือนเสียงหากเปิดใช้งาน
        if (soundEnabled) {
          // เล่นเสียงแจ้งเตือน
          const audio = new Audio('/notification.mp3');
          audio.catch(() => {}); // Ignore audio errors
        }
      } else {
        // ลบข้อความหากส่งไม่สำเร็จ
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        setNotification({
          type: 'error',
          message: 'ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง'
        });
      }
    } catch (error) {
      console.error('Error sending admin message:', error);
      setNotification({
        type: 'error',
        message: 'เกิดข้อผิดพลาดในการส่งข้อความ'
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // อัพเดตสถานะ Ticket
  const updateTicketStatus = async (ticketId, newStatus) => {
    setUpdatingTicket(true);
    try {
      const result = await supportApiService.updateTicketStatus(ticketId, newStatus);
      
      if (result) {
        setSupportTickets(prev => 
          prev.map(ticket => 
            ticket.id === ticketId 
              ? { ...ticket, status: newStatus, resolvedAt: newStatus === 'resolved' ? new Date() : null }
              : ticket
          )
        );
        setSelectedTicket(prev => 
          prev && prev.id === ticketId 
            ? { ...prev, status: newStatus, resolvedAt: newStatus === 'resolved' ? new Date() : null }
            : prev
        );

        setNotification({
          type: 'success',
          message: 'อัพเดตสถานะสำเร็จ'
        });
      } else {
        setNotification({
          type: 'error',
          message: 'ไม่สามารถอัพเดตสถานะได้'
        });
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      setNotification({
        type: 'error',
        message: 'เกิดข้อผิดพลาดในการอัพเดตสถานะ'
      });
    } finally {
      setUpdatingTicket(false);
    }
  };

  // อัพเดตระดับความสำคัญ
  const updateTicketPriority = async (ticketId, newPriority) => {
    setUpdatingTicket(true);
    try {
      const result = await supportApiService.updateTicketPriority(ticketId, newPriority);
      
      if (result) {
        setSupportTickets(prev => 
          prev.map(ticket => 
            ticket.id === ticketId ? { ...ticket, priority: newPriority } : ticket
          )
        );
        setSelectedTicket(prev => 
          prev && prev.id === ticketId ? { ...prev, priority: newPriority } : prev
        );

        setNotification({
          type: 'success',
          message: 'อัพเดตระดับความสำคัญสำเร็จ'
        });
      } else {
        setNotification({
          type: 'error',
          message: 'ไม่สามารถอัพเดตระดับความสำคัญได้'
        });
      }
    } catch (error) {
      console.error('Error updating ticket priority:', error);
      setNotification({
        type: 'error',
        message: 'เกิดข้อผิดพลาดในการอัพเดตระดับความสำคัญ'
      });
    } finally {
      setUpdatingTicket(false);
    }
  };

  // จัดการการเลือก Ticket
  const handleTicketSelect = async (ticket) => {
    setSelectedTicket(ticket);
    await loadTicketMessages(ticket.id);
  };

  // Filter support tickets
  const filteredTickets = supportTickets.filter(ticket => {
    const matchesSearch = ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || 
                       ticket.status === filterType ||
                       ticket.userType === filterType;
    
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'เมื่อสักครู่';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาทีที่แล้ว`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ชั่วโมงที่แล้ว`;
    return date.toLocaleDateString('th-TH');
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--danger)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--success)';
      default: return 'var(--text-muted)';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'var(--info)';
      case 'pending': return 'var(--warning)';
      case 'resolved': return 'var(--success)';
      default: return 'var(--text-muted)';
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'payment': return <CreditCard size={16} />;
      case 'technical': return <Settings size={16} />;
      case 'scheduling': return <Calendar size={16} />;
      case 'account': return <User size={16} />;
      case 'report': return <AlertTriangle size={16} />;
      default: return <HelpCircle size={16} />;
    }
  };

  // Render message status
  const renderMessageStatus = (status) => {
    switch (status) {
      case 'sending':
        return <div className="status-dot sending"></div>;
      case 'sent':
        return <CheckCheck size={16} style={{ color: 'var(--text-secondary)' }} />;
      case 'delivered':
        return <CheckCheck size={16} style={{ color: 'var(--info)' }} />;
      case 'read':
        return <CheckCheck size={16} style={{ color: 'var(--success)' }} />;
      default:
        return null;
    }
  };

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      height: 'calc(100vh - 140px)',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-primary)'
    }}>
      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '1rem 1.5rem',
          backgroundColor: notification.type === 'success' ? 'var(--success)' : 'var(--danger)',
          color: 'white',
          borderRadius: '0.5rem',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Headphones size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                ระบบซัพพอร์ต
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                จัดการคำถามและปัญหาจากลูกค้าและเทรนเนอร์
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                color: soundEnabled ? 'var(--success)' : 'var(--text-secondary)'
              }}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={() => {
                loadSupportTickets();
                loadSupportStats();
              }}
              disabled={loadingTickets}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                cursor: loadingTickets ? 'not-allowed' : 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <RefreshCw size={18} style={{
                animation: loadingTickets ? 'spin 1s linear infinite' : 'none'
              }} />
            </button>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: isConnected ? 'rgba(72, 187, 120, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: isConnected ? 'var(--success)' : 'var(--danger)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? 'var(--success)' : 'var(--danger)'
              }} />
              {isConnected ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)',
          gap: '1rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
              {supportStats.totalTickets || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              ทั้งหมด
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--info)' }}>
              {supportStats.openTickets || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              รอดำเนินการ
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)' }}>
              {supportStats.pendingTickets || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              ดำเนินการแล้ว
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
              {supportStats.resolvedTickets || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              แก้ไขแล้ว
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--danger)' }}>
              {supportStats.highPriority || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              ด่วน
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
              {supportStats.satisfactionRate || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              คะแนนเฉลี่ย
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '1.5rem' }}>
        {/* Support Tickets Sidebar */}
        <div style={{
          width: windowWidth <= 768 ? '100%' : '400px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Filters & Search */}
          <div style={{
            padding: '1.5rem',
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
                { key: 'all', label: 'ทั้งหมด', icon: MessageSquare },
                { key: 'open', label: 'รอดำเนินการ', icon: AlertCircle },
                { key: 'pending', label: 'ดำเนินการแล้ว', icon: Clock },
                { key: 'resolved', label: 'แก้ไขแล้ว', icon: CheckCircle }
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
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <filter.icon size={14} />
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Priority Filter */}
            <div style={{ marginBottom: '1rem' }}>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--bg-primary)'
                }}
              >
                <option value="all">ระดับความสำคัญ - ทั้งหมด</option>
                <option value="high">สูง</option>
                <option value="medium">กลาง</option>
                <option value="low">ต่ำ</option>
              </select>
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
                placeholder="ค้นหา Ticket..."
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

          {/* Support Tickets List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingTickets ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                color: 'var(--text-secondary)'
              }}>
                กำลังโหลด...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                color: 'var(--text-secondary)',
                textAlign: 'center'
              }}>
                ไม่พบ Support Tickets
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => handleTicketSelect(ticket)}
                  style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    backgroundColor: selectedTicket?.id === ticket.id ? 'var(--bg-primary)' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    {/* User Avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: ticket.userType === 'customer' ? 'var(--accent)' : 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                      }}>
                        {ticket.userAvatar || ticket.userName?.charAt(0) || '?'}
                      </div>
                      {/* Status indicator */}
                      <div style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-2px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(ticket.status),
                        border: '2px solid var(--bg-secondary)'
                      }} />
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          fontWeight: '600'
                        }}>
                          {ticket.id} • {ticket.userType === 'customer' ? 'ลูกค้า' : 'เทรนเนอร์'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <div style={{
                            padding: '0.125rem 0.5rem',
                            borderRadius: '1rem',
                            fontSize: '0.65rem',
                            fontWeight: '600',
                            backgroundColor: `${getPriorityColor(ticket.priority)}20`,
                            color: getPriorityColor(ticket.priority)
                          }}>
                            {ticket.priority === 'high' ? 'สูง' : ticket.priority === 'medium' ? 'กลาง' : 'ต่ำ'}
                          </div>
                          {ticket.flagged && (
                            <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
                          )}
                        </div>
                      </div>

                      <div style={{
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        marginBottom: '0.25rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {ticket.subject}
                      </div>

                      <div style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.25rem'
                      }}>
                        {ticket.userName}
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{
                          fontSize: '0.875rem',
                          color: 'var(--text-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1
                        }}>
                          {ticket.lastMessage}
                        </div>
                        {ticket.unreadCount > 0 && (
                          <div style={{
                            backgroundColor: 'var(--accent)',
                            color: 'white',
                            borderRadius: '50%',
                            minWidth: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            marginLeft: '0.5rem'
                          }}>
                            {ticket.unreadCount}
                          </div>
                        )}
                      </div>

                      {/* Ticket Info */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {getCategoryIcon(ticket.category)}
                          <span>{formatTime(ticket.lastMessageTime)}</span>
                        </div>
                        <div style={{
                          padding: '0.125rem 0.5rem',
                          borderRadius: '1rem',
                          fontSize: '0.65rem',
                          fontWeight: '600',
                          backgroundColor: `${getStatusColor(ticket.status)}20`,
                          color: getStatusColor(ticket.status)
                        }}>
                          {ticket.status === 'open' ? 'รอดำเนินการ' : 
                           ticket.status === 'pending' ? 'ดำเนินการแล้ว' : 'แก้ไขแล้ว'}
                        </div>
                      </div>

                      {/* Tags */}
                      {ticket.tags && ticket.tags.length > 0 && (
                        <div style={{
                          display: 'flex',
                          gap: '0.25rem',
                          marginTop: '0.5rem',
                          flexWrap: 'wrap'
                        }}>
                          {ticket.tags.map((tag, index) => (
                            <span
                              key={index}
                              style={{
                                padding: '0.125rem 0.375rem',
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-muted)',
                                borderRadius: '0.25rem',
                                fontSize: '0.625rem',
                                fontWeight: '500'
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Messages Area */}
        <div style={{ 
          flex: 1, 
          display: windowWidth <= 768 && selectedTicket ? 'flex' : windowWidth <= 768 ? 'none' : 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)'
        }}>
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {windowWidth <= 768 && (
                    <button
                      onClick={() => setSelectedTicket(null)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      ←
                    </button>
                  )}
                  
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: selectedTicket.userType === 'customer' ? 'var(--accent)' : 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    {selectedTicket.userAvatar || selectedTicket.userName?.charAt(0) || '?'}
                  </div>
                  
                  <div>
                    <div style={{
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      marginBottom: '0.25rem'
                    }}>
                      {selectedTicket.subject}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span>{selectedTicket.userName} ({selectedTicket.userType === 'customer' ? 'ลูกค้า' : 'เทรนเนอร์'})</span>
                      <span>•</span>
                      <span>{selectedTicket.id}</span>
                      <span>•</span>
                      <span style={{ color: getStatusColor(selectedTicket.status) }}>
                        {selectedTicket.status === 'open' ? 'รอดำเนินการ' : 
                         selectedTicket.status === 'pending' ? 'ดำเนินการแล้ว' : 'แก้ไขแล้ว'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ticket Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                    disabled={updatingTicket}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      backgroundColor: 'var(--bg-primary)',
                      cursor: updatingTicket ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="open">รอดำเนินการ</option>
                    <option value="pending">ดำเนินการแล้ว</option>
                    <option value="resolved">แก้ไขแล้ว</option>
                  </select>
                  
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => updateTicketPriority(selectedTicket.id, e.target.value)}
                    disabled={updatingTicket}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      backgroundColor: 'var(--bg-primary)',
                      cursor: updatingTicket ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="low">ต่ำ</option>
                    <option value="medium">กลาง</option>
                    <option value="high">สูง</option>
                  </select>

                  <button style={{
                    padding: '0.5rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)'
                  }}>
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div style={{
                flex: 1,
                padding: '1rem',
                overflowY: 'auto',
                backgroundColor: 'var(--bg-primary)'
              }}>
                {loadingMessages ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    color: 'var(--text-secondary)'
                  }}>
                    กำลังโหลดข้อความ...
                  </div>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        justifyContent: message.sender === 'admin' ? 'flex-end' : 'flex-start',
                        marginBottom: '1rem'
                      }}
                    >
                      <div style={{
                        maxWidth: '70%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}>
                        <div style={{
                          padding: message.type === 'text' ? '0.75rem 1rem' : '0.5rem',
                          backgroundColor: message.sender === 'admin' ? 'var(--primary)' : 'var(--bg-secondary)',
                          color: message.sender === 'admin' ? 'white' : 'var(--text-primary)',
                          borderRadius: message.sender === 'admin' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                          border: message.sender === 'user' ? '1px solid var(--border-color)' : 'none'
                        }}>
                          {/* Sender Name */}
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            marginBottom: '0.25rem',
                            opacity: 0.8
                          }}>
                            {message.senderName}
                          </div>

                          {message.type === 'text' && (
                            <div style={{ fontSize: '0.875rem' }}>
                              {message.text}
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
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          justifyContent: message.sender === 'admin' ? 'flex-end' : 'flex-start'
                        }}>
                          <span>{formatTime(message.timestamp)}</span>
                          {renderMessageStatus(message.status)}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Admin Message Input */}
              <div style={{
                padding: '1.5rem',
                borderTop: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '1rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendAdminMessage();
                        }
                      }}
                      placeholder="พิมพ์ข้อความตอบกลับ..."
                      disabled={sendingMessage}
                      style={{
                        width: '100%',
                        minHeight: '44px',
                        maxHeight: '120px',
                        padding: '0.75rem 1rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        resize: 'none',
                        outline: 'none',
                        fontFamily: 'inherit',
                        backgroundColor: 'var(--bg-primary)',
                        cursor: sendingMessage ? 'not-allowed' : 'text'
                      }}
                      rows={1}
                    />
                  </div>

                  <button
                    onClick={() => setShowFileUpload(!showFileUpload)}
                    disabled={sendingMessage}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      cursor: sendingMessage ? 'not-allowed' : 'pointer',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <Paperclip size={18} />
                  </button>

                  <button
                    onClick={sendAdminMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: (newMessage.trim() && !sendingMessage) ? 'var(--primary)' : 'var(--border-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: (newMessage.trim() && !sendingMessage) ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {sendingMessage ? (
                      <div style={{
                        width: '18px',
                        height: '18px',
                        border: '2px solid white',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
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
              color: 'var(--text-secondary)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <Headphones size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  เลือก Ticket เพื่อดูรายละเอียด
                </h3>
                <p>คลิกที่ Ticket ด้านซ้ายเพื่อดูการสนทนาและจัดการปัญหา</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .status-dot.sending {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--text-secondary);
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: var(--bg-primary);
        }

        ::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default AdminSupportChat;
