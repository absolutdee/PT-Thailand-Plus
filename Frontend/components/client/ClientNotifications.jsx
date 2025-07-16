import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, BellDot, BellOff, Settings, Search, Filter, Trash2, Archive, 
  Check, CheckCircle, Eye, X, ChevronUp, ChevronDown, MoreVertical,
  AlertCircle, AlertTriangle, Activity, Heart, Trophy, Target,
  Calendar, MessageSquare, Apple, Loader, Upload, Download,
  Wifi, WifiOff, Star, BarChart3, RefreshCw, Bookmark, BookmarkX
} from 'lucide-react';

// API service functions
const apiService = {
  // Base API URL - แก้ไขตาม environment ของคุณ
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  
  async getNotifications(params = {}) {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
      category: params.category || '',
      status: params.status || '',
      search: params.search || '',
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc'
    });

    const response = await fetch(`${this.baseURL}/client/notifications?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },

  async markAsRead(notificationIds) {
    const response = await fetch(`${this.baseURL}/client/notifications/mark-read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notificationIds })
    });
    if (!response.ok) throw new Error('Failed to mark notifications as read');
    return response.json();
  },

  async markAsUnread(notificationIds) {
    const response = await fetch(`${this.baseURL}/client/notifications/mark-unread`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notificationIds })
    });
    if (!response.ok) throw new Error('Failed to mark notifications as unread');
    return response.json();
  },

  async archiveNotifications(notificationIds) {
    const response = await fetch(`${this.baseURL}/client/notifications/archive`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notificationIds })
    });
    if (!response.ok) throw new Error('Failed to archive notifications');
    return response.json();
  },

  async unarchiveNotifications(notificationIds) {
    const response = await fetch(`${this.baseURL}/client/notifications/unarchive`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notificationIds })
    });
    if (!response.ok) throw new Error('Failed to unarchive notifications');
    return response.json();
  },

  async deleteNotifications(notificationIds) {
    const response = await fetch(`${this.baseURL}/client/notifications`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notificationIds })
    });
    if (!response.ok) throw new Error('Failed to delete notifications');
    return response.json();
  },

  async bookmarkNotification(notificationId, isBookmarked) {
    const response = await fetch(`${this.baseURL}/client/notifications/${notificationId}/bookmark`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isBookmarked })
    });
    if (!response.ok) throw new Error('Failed to bookmark notification');
    return response.json();
  },

  async getNotificationSettings() {
    const response = await fetch(`${this.baseURL}/client/notification-settings`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch notification settings');
    return response.json();
  },

  async updateNotificationSettings(settings) {
    const response = await fetch(`${this.baseURL}/client/notification-settings`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });
    if (!response.ok) throw new Error('Failed to update notification settings');
    return response.json();
  },

  async getNotificationStats() {
    const response = await fetch(`${this.baseURL}/client/notifications/stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch notification stats');
    return response.json();
  },

  async performNotificationAction(notificationId, action, data = {}) {
    const response = await fetch(`${this.baseURL}/client/notifications/${notificationId}/action`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action, data })
    });
    if (!response.ok) throw new Error('Failed to perform notification action');
    return response.json();
  }
};

const ClientNotifications = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [snackBar, setSnackBar] = useState({ show: false, message: '', type: 'success' });
  const [sortBy, setSortBy] = useState('time_desc');
  const [groupBy, setGroupBy] = useState('none');
  const [viewMode, setViewMode] = useState('list');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const scrollRef = useRef(null);

  // Data states
  const [notifications, setNotifications] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState({
    workoutReminders: true,
    nutritionReminders: true,
    progressUpdates: true,
    messages: true,
    achievements: true,
    promotions: false,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    reminderTime: '30',
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '07:00'
    },
    soundEnabled: true,
    vibrationEnabled: true,
    smartGrouping: true,
    autoArchive: true,
    archiveDays: 30,
    priorities: {
      high: true,
      medium: true,
      low: false
    }
  });
  const [notificationStats, setNotificationStats] = useState(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Set CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', '#232956');
    root.style.setProperty('--accent', '#df2528');
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-secondary', '#fafaba');
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

  // Fetch notifications on component mount and dependency changes
  useEffect(() => {
    fetchNotifications();
  }, [activeTab, searchTerm, sortBy, currentPage]);

  // Fetch notification settings on mount
  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  // Auto-refresh notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRefreshing && isOnline) {
        handleRefresh(true); // Silent refresh
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isRefreshing, isOnline]);

  const fetchNotifications = async (page = 1) => {
    try {
      if (page === 1) setLoading(true);
      setError(null);

      const params = {
        page,
        category: activeTab === 'all' ? '' : activeTab,
        status: activeTab === 'unread' ? 'unread' : activeTab === 'archived' ? 'archived' : '',
        search: searchTerm,
        sortBy: sortBy.includes('_') ? sortBy.split('_')[0] : 'createdAt',
        sortOrder: sortBy.includes('_desc') ? 'desc' : 'asc'
      };

      const data = await apiService.getNotifications(params);
      
      if (page === 1) {
        setNotifications(data.notifications || []);
      } else {
        setNotifications(prev => [...prev, ...(data.notifications || [])]);
      }
      
      setCurrentPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
      setHasMore(data.hasMore || false);

    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const settings = await apiService.getNotificationSettings();
      setNotificationSettings(settings);
    } catch (err) {
      console.error('Error fetching notification settings:', err);
    }
  };

  const fetchNotificationStats = async () => {
    try {
      const stats = await apiService.getNotificationStats();
      setNotificationStats(stats);
    } catch (err) {
      console.error('Error fetching notification stats:', err);
    }
  };

  const showSnackBar = (message, type = 'success') => {
    setSnackBar({ show: true, message, type });
    setTimeout(() => setSnackBar({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleRefresh = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    
    try {
      await fetchNotifications(1);
      
      if (!silent) {
        showSnackBar('อัพเดทการแจ้งเตือนแล้ว');
      }
    } catch (error) {
      showSnackBar('เกิดข้อผิดพลาดในการอัพเดท', 'error');
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        showSnackBar('เปิดใช้การแจ้งเตือนแล้ว');
      } else {
        showSnackBar('ไม่อนุญาตให้แจ้งเตือน', 'warning');
      }
    }
  };

  const filterNotifications = () => {
    let filtered = notifications;

    // Priority filter
    const enabledPriorities = Object.keys(notificationSettings.priorities)
      .filter(key => notificationSettings.priorities[key]);
    filtered = filtered.filter(n => enabledPriorities.includes(n.priority));

    return filtered;
  };

  const groupNotifications = (notifications) => {
    if (groupBy === 'none') return [{ title: null, notifications }];

    const groups = {};
    
    notifications.forEach(notification => {
      let groupKey;
      
      switch (groupBy) {
        case 'date':
          const date = new Date(notification.createdAt);
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (date.toDateString() === today.toDateString()) {
            groupKey = 'วันนี้';
          } else if (date.toDateString() === yesterday.toDateString()) {
            groupKey = 'เมื่อวาน';
          } else {
            groupKey = date.toLocaleDateString('th-TH');
          }
          break;
          
        case 'category':
          const categoryNames = {
            workouts: 'การเทรน',
            nutrition: 'โภชนาการ',
            social: 'สังคม',
            billing: 'การเงิน'
          };
          groupKey = categoryNames[notification.category] || 'อื่นๆ';
          break;
          
        case 'sender':
          groupKey = notification.sender?.name || 'ไม่ทราบผู้ส่ง';
          break;
          
        case 'priority':
          const priorityNames = { high: 'สำคัญมาก', medium: 'ปานกลาง', low: 'ทั่วไป' };
          groupKey = priorityNames[notification.priority];
          break;
          
        default:
          groupKey = 'ทั้งหมด';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    return Object.entries(groups).map(([title, notifications]) => ({
      title,
      notifications
    }));
  };

  const tabs = [
    { id: 'all', label: 'ทั้งหมด', icon: Bell },
    { id: 'unread', label: 'ยังไม่อ่าน', icon: AlertCircle },
    { id: 'workouts', label: 'การเทรน', icon: Activity },
    { id: 'nutrition', label: 'โภชนาการ', icon: Apple },
    { id: 'social', label: 'สังคม', icon: Heart },
    { id: 'archived', label: 'เก็บถาวร', icon: Archive }
  ];

  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;
  const archivedCount = notifications.filter(n => n.isArchived).length;

  const handleSelectNotification = (id) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(notifId => notifId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const filteredNotifications = filterNotifications();
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const handleMarkAsRead = async (ids = null) => {
    const targetIds = ids || selectedNotifications;
    if (targetIds.length === 0) return;

    try {
      setActionLoading(true);
      await apiService.markAsRead(targetIds);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          targetIds.includes(n.id) ? { ...n, isRead: true } : n
        )
      );
      setSelectedNotifications([]);
      showSnackBar(`ทำเครื่องหมาย ${targetIds.length} รายการว่าอ่านแล้ว`);
    } catch (err) {
      console.error('Error marking as read:', err);
      showSnackBar('ไม่สามารถทำเครื่องหมายว่าอ่านแล้วได้', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsUnread = async (ids = null) => {
    const targetIds = ids || selectedNotifications;
    if (targetIds.length === 0) return;

    try {
      setActionLoading(true);
      await apiService.markAsUnread(targetIds);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          targetIds.includes(n.id) ? { ...n, isRead: false } : n
        )
      );
      setSelectedNotifications([]);
      showSnackBar(`ทำเครื่องหมาย ${targetIds.length} รายการว่ายังไม่ได้อ่าน`);
    } catch (err) {
      console.error('Error marking as unread:', err);
      showSnackBar('ไม่สามารถทำเครื่องหมายว่ายังไม่ได้อ่านได้', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async (ids = null) => {
    const targetIds = ids || selectedNotifications;
    if (targetIds.length === 0) return;

    try {
      setActionLoading(true);
      await apiService.archiveNotifications(targetIds);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          targetIds.includes(n.id) ? { ...n, isArchived: true } : n
        )
      );
      setSelectedNotifications([]);
      showSnackBar(`เก็บ ${targetIds.length} รายการไว้ในที่เก็บถาวรแล้ว`);
    } catch (err) {
      console.error('Error archiving:', err);
      showSnackBar('ไม่สามารถเก็บถาวรได้', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnarchive = async (ids = null) => {
    const targetIds = ids || selectedNotifications;
    if (targetIds.length === 0) return;

    try {
      setActionLoading(true);
      await apiService.unarchiveNotifications(targetIds);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          targetIds.includes(n.id) ? { ...n, isArchived: false } : n
        )
      );
      setSelectedNotifications([]);
      showSnackBar(`นำ ${targetIds.length} รายการออกจากที่เก็บถาวรแล้ว`);
    } catch (err) {
      console.error('Error unarchiving:', err);
      showSnackBar('ไม่สามารถนำออกจากที่เก็บถาวรได้', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBookmark = async (id) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;

    try {
      await apiService.bookmarkNotification(id, !notification.isBookmarked);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === id ? { ...n, isBookmarked: !n.isBookmarked } : n
        )
      );
      
      showSnackBar(
        notification.isBookmarked 
          ? 'ลบออกจากรายการที่บันทึกแล้ว' 
          : 'บันทึกแล้ว'
      );
    } catch (err) {
      console.error('Error bookmarking:', err);
      showSnackBar('ไม่สามารถบันทึกได้', 'error');
    }
  };

  const handleDelete = async (ids = null) => {
    const targetIds = ids || selectedNotifications;
    if (targetIds.length === 0) return;

    if (!window.confirm(`คุณต้องการลบการแจ้งเตือน ${targetIds.length} รายการหรือไม่?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await apiService.deleteNotifications(targetIds);
      
      // Update local state
      setNotifications(prev => prev.filter(n => !targetIds.includes(n.id)));
      setSelectedNotifications([]);
      showSnackBar(`ลบ ${targetIds.length} รายการแล้ว`);
    } catch (err) {
      console.error('Error deleting:', err);
      showSnackBar('ไม่สามารถลบได้', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotificationAction = async (notification, action) => {
    try {
      console.log('Notification action:', action, notification);
      
      // Mark as read when action is taken
      if (!notification.isRead) {
        await handleMarkAsRead([notification.id]);
      }
      
      // Perform the specific action
      await apiService.performNotificationAction(notification.id, action);
      
      switch (action) {
        case 'view_details':
          showSnackBar('เปิดรายละเอียดเซสชั่น');
          break;
        case 'reschedule':
          showSnackBar('เปิดหน้าเลื่อนนัด');
          break;
        case 'reply':
          showSnackBar('เปิดหน้าแชท');
          break;
        case 'share':
          if (navigator.share) {
            navigator.share({
              title: notification.title,
              text: notification.message
            });
          } else {
            navigator.clipboard.writeText(notification.message);
            showSnackBar('คัดลอกข้อความแล้ว');
          }
          break;
        default:
          showSnackBar(`ดำเนินการ: ${action}`);
      }
    } catch (err) {
      console.error('Error performing action:', err);
      showSnackBar('ไม่สามารถดำเนินการได้', 'error');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await apiService.updateNotificationSettings(notificationSettings);
      setShowSettings(false);
      showSnackBar('บันทึกการตั้งค่าแล้ว');
    } catch (err) {
      console.error('Error saving settings:', err);
      showSnackBar('ไม่สามารถบันทึกการตั้งค่าได้', 'error');
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(notificationSettings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'notification-settings.json';
    link.click();
    
    URL.revokeObjectURL(url);
    showSnackBar('ส่งออกการตั้งค่าแล้ว');
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target.result);
          setNotificationSettings(settings);
          showSnackBar('นำเข้าการตั้งค่าสำเร็จ');
        } catch (error) {
          showSnackBar('ไฟล์การตั้งค่าไม่ถูกต้อง', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const getTimeDisplay = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notifTime) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} นาทีที่แล้ว`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} ชั่วโมงที่แล้ว`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} วันที่แล้ว`;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--danger)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--info)';
      default: return 'var(--text-muted)';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'workout_reminder': return Calendar;
      case 'message': return MessageSquare;
      case 'achievement': return Trophy;
      case 'nutrition_reminder': return Apple;
      case 'workout_completed': return CheckCircle;
      case 'progress_update': return Target;
      default: return Bell;
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'workout_reminder': return 'var(--primary)';
      case 'message': return 'var(--info)';
      case 'achievement': return 'var(--warning)';
      case 'nutrition_reminder': return 'var(--success)';
      case 'workout_completed': return 'var(--success)';
      case 'progress_update': return 'var(--primary)';
      default: return 'var(--text-muted)';
    }
  };

  // Loading component
  if (loading && notifications.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size={40} color="var(--primary)" className="animate-spin" />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>กำลังโหลดการแจ้งเตือน...</p>
        </div>
      </div>
    );
  }

  // Error component
  if (error && notifications.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div style={{ 
          textAlign: 'center', 
          backgroundColor: 'var(--bg-primary)',
          padding: '2rem',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)'
        }}>
          <AlertCircle size={40} color="var(--accent)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>เกิดข้อผิดพลาด</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error}</p>
          <button 
            onClick={() => fetchNotifications(1)}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer'
            }}
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  const renderNotificationCard = (notification) => {
    const IconComponent = getNotificationIcon(notification.type);
    const iconColor = getIconColor(notification.type);

    return (
      <div
        key={notification.id}
        style={{
          backgroundColor: notification.isRead ? 'var(--bg-primary)' : 'rgba(35, 41, 86, 0.02)',
          borderRadius: '0.75rem',
          border: `1px solid ${notification.isRead ? 'var(--border-color)' : 'var(--primary)'}`,
          borderLeft: `4px solid ${getPriorityColor(notification.priority)}`,
          padding: '1.5rem',
          position: 'relative',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onClick={() => !notification.isRead && handleMarkAsRead([notification.id])}
      >
        <div style={{ display: 'flex', gap: '1rem' }}>
          {/* Selection Checkbox */}
          <div style={{ display: 'flex', alignItems: 'start', paddingTop: '0.25rem' }}>
            <input
              type="checkbox"
              checked={selectedNotifications.includes(notification.id)}
              onChange={(e) => {
                e.stopPropagation();
                handleSelectNotification(notification.id);
              }}
              style={{
                width: '1rem',
                height: '1rem',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* Sender Avatar */}
          <div style={{
            backgroundColor: `${iconColor}15`,
            borderRadius: '50%',
            width: '2.5rem',
            height: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative'
          }}>
            {notification.sender?.role === 'trainer' ? (
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'white'
              }}>
                {notification.sender.avatar || notification.sender.name?.substring(0, 2) || 'T'}
              </div>
            ) : (
              <IconComponent size={16} color={iconColor} />
            )}
            
            {/* Priority indicator */}
            {notification.priority === 'high' && (
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--danger)',
                border: '2px solid white'
              }} />
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: notification.isRead ? '500' : '600', 
                color: 'var(--text-primary)',
                marginBottom: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {notification.title}
                {!notification.isRead && (
                  <span style={{
                    display: 'inline-block',
                    width: '0.5rem',
                    height: '0.5rem',
                    backgroundColor: 'var(--accent)',
                    borderRadius: '50%'
                  }}></span>
                )}
                {notification.isBookmarked && (
                  <Bookmark size={14} color="var(--warning)" fill="var(--warning)" />
                )}
              </h4>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {getTimeDisplay(notification.createdAt)}
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    // Show context menu
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '0.25rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  <MoreVertical size={14} />
                </button>
              </div>
            </div>

            {/* Sender info */}
            {notification.sender && (
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)', 
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                จาก {notification.sender.name}
                {notification.sender.role === 'trainer' && (
                  <span style={{
                    backgroundColor: 'rgba(35, 41, 86, 0.1)',
                    color: 'var(--primary)',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.625rem',
                    fontWeight: '500'
                  }}>
                    เทรนเนอร์
                  </span>
                )}
              </div>
            )}

            <p style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)', 
              lineHeight: '1.5',
              marginBottom: notification.actionable ? '1rem' : 0 
            }}>
              {notification.message}
            </p>

            {/* Metadata */}
            {notification.metadata && (
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
              }}>
                {notification.type === 'workout_reminder' && notification.metadata.location && (
                  <div>
                    📍 {notification.metadata.location} • 
                    ⏱️ {notification.metadata.duration} นาที
                  </div>
                )}
                {notification.type === 'achievement' && notification.metadata.points && (
                  <div>
                    🏆 +{notification.metadata.points} คะแนน • 
                    🔥 Streak {notification.metadata.streak} วัน
                  </div>
                )}
                {notification.type === 'workout_completed' && notification.metadata.calories && (
                  <div>
                    🔥 {notification.metadata.calories} แคลอรี่ • 
                    ⏱️ {notification.metadata.duration} นาที
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {notification.actionable && notification.actions && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {notification.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotificationAction(notification, action.action);
                    }}
                    style={{
                      backgroundColor: 
                        action.type === 'primary' ? 'var(--primary)' : 
                        action.type === 'danger' ? 'var(--danger)' : 'var(--bg-secondary)',
                      color: 
                        action.type === 'primary' || action.type === 'danger' ? 'var(--text-white)' : 'var(--text-primary)',
                      border: 
                        action.type === 'primary' || action.type === 'danger' ? 'none' : '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBookmark(notification.id);
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                color: notification.isBookmarked ? 'var(--warning)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={notification.isBookmarked ? 'ลบออกจากรายการบันทึก' : 'บันทึก'}
            >
              {notification.isBookmarked ? <Bookmark size={14} fill="currentColor" /> : <BookmarkX size={14} />}
            </button>
            
            {!notification.isRead ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsRead([notification.id]);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="ทำเครื่องหมายว่าอ่านแล้ว"
              >
                <Check size={14} />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsUnread([notification.id]);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: 'var(--info)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="ทำเครื่องหมายว่ายังไม่ได้อ่าน"
              >
                <Eye size={14} />
              </button>
            )}
            
            {activeTab !== 'archived' ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleArchive([notification.id]);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: 'var(--warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="เก็บถาวร"
              >
                <Archive size={14} />
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnarchive([notification.id]);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: 'var(--info)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="นำออกจากที่เก็บถาวร"
              >
                <ChevronUp size={14} />
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('คุณต้องการลบการแจ้งเตือนนี้หรือไม่?')) {
                  handleDelete([notification.id]);
                }
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="ลบ"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalyticsModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        padding: '2rem',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            📊 สถิติการแจ้งเตือน
          </h3>
          <button
            onClick={() => {
              setShowAnalytics(false);
              if (!notificationStats) {
                fetchNotificationStats();
              }
            }}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              color: 'var(--text-muted)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '1rem'
          }}>
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                {notificationStats?.total || notifications.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                ทั้งหมด
              </div>
            </div>
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
                {notificationStats?.unread || unreadCount}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                ยังไม่อ่าน
              </div>
            </div>
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
                {notificationStats?.read || notifications.filter(n => n.isRead).length}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                อ่านแล้ว
              </div>
            </div>
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)' }}>
                {notificationStats?.archived || archivedCount}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                เก็บถาวร
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              แยกตามหมวดหมู่
            </h4>
            {notificationStats?.categories ? (
              Object.entries(notificationStats.categories).map(([category, count]) => {
                const categoryNames = {
                  workouts: 'การเทรน',
                  nutrition: 'โภชนาการ',
                  social: 'สังคม',
                  billing: 'การเงิน'
                };
                
                return (
                  <div key={category} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span>{categoryNames[category] || category}</span>
                    <span style={{ fontWeight: '600' }}>{count}</span>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader size={20} className="animate-spin" />
                <div style={{ marginTop: '0.5rem' }}>กำลังโหลดข้อมูล...</div>
              </div>
            )}
          </div>

          {/* Response rate */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              อัตราการตอบสนอง
            </h4>
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>อ่านแล้ว</span>
                  <span>
                    {notificationStats?.readPercentage || 
                     Math.round((notifications.filter(n => n.isRead).length / (notifications.length || 1)) * 100)}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'var(--border-color)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginTop: '0.25rem'
                }}>
                  <div style={{
                    width: `${notificationStats?.readPercentage || 
                            Math.round((notifications.filter(n => n.isRead).length / (notifications.length || 1)) * 100)}%`,
                    height: '100%',
                    backgroundColor: 'var(--success)',
                    borderRadius: '3px'
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        padding: '2rem',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            ⚙️ ตั้งค่าการแจ้งเตือน
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={exportSettings}
              style={{
                backgroundColor: 'var(--info)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                cursor: 'pointer'
              }}
              title="ส่งออกการตั้งค่า"
            >
              <Download size={16} />
            </button>
            <label style={{
              backgroundColor: 'var(--success)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }} title="นำเข้าการตั้งค่า">
              <Upload size={16} />
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                style={{ display: 'none' }}
              />
            </label>
            <button
              onClick={() => setShowSettings(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                color: 'var(--text-muted)'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Permission Status */}
          {notificationPermission !== 'granted' && (
            <div style={{
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid var(--warning)',
              borderRadius: '0.75rem',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Bell size={16} color="var(--warning)" />
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--warning)' }}>
                  การแจ้งเตือนถูกปิดใช้งาน
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                เปิดใช้การแจ้งเตือนเพื่อรับข้อมูลสำคัญทันที
              </p>
              <button
                onClick={requestNotificationPermission}
                style={{
                  backgroundColor: 'var(--warning)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                เปิดใช้การแจ้งเตือน
              </button>
            </div>
          )}

          {/* Online Status */}
          <div style={{
            backgroundColor: isOnline ? 'rgba(72, 187, 120, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${isOnline ? 'var(--success)' : 'var(--danger)'}`,
            borderRadius: '0.75rem',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {isOnline ? <Wifi size={16} color="var(--success)" /> : <WifiOff size={16} color="var(--danger)" />}
            <span style={{ fontSize: '0.875rem', color: isOnline ? 'var(--success)' : 'var(--danger)' }}>
              {isOnline ? 'เชื่อมต่ออินเทอร์เน็ตแล้ว' : 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต'}
            </span>
          </div>

          {/* Notification Types */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              ประเภทการแจ้งเตือน
            </h4>
            
            {[
              { key: 'workoutReminders', label: 'เตือนการออกกำลังกาย', icon: Calendar, desc: 'แจ้งเตือนก่อนเซสชั่นการเทรน' },
              { key: 'nutritionReminders', label: 'เตือนบันทึกอาหาร', icon: Apple, desc: 'แจ้งเตือนบันทึกมื้ออาหาร' },
              { key: 'progressUpdates', label: 'อัพเดทความก้าวหน้า', icon: Target, desc: 'รายงานความก้าวหน้าประจำสัปดาห์' },
              { key: 'messages', label: 'ข้อความจากเทรนเนอร์', icon: MessageSquare, desc: 'ข้อความและการติดต่อ' },
              { key: 'achievements', label: 'ความสำเร็จใหม่', icon: Trophy, desc: 'ปลดล็อคความสำเร็จและรางวัล' },
              { key: 'promotions', label: 'โปรโมชั่นและข้อเสนอพิเศษ', icon: Star, desc: 'ข้อเสนอพิเศษและส่วนลด' }
            ].map(setting => (
              <div key={setting.key} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                marginBottom: '0.75rem',
                backgroundColor: notificationSettings[setting.key] ? 'rgba(72, 187, 120, 0.05)' : 'var(--bg-secondary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', flex: 1 }}>
                  <setting.icon size={20} color="var(--text-secondary)" style={{ marginTop: '0.125rem' }} />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {setting.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {setting.desc}
                    </div>
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notificationSettings[setting.key]}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      [setting.key]: e.target.checked
                    }))}
                    style={{ 
                      width: '1.25rem', 
                      height: '1.25rem',
                      cursor: 'pointer'
                    }}
                  />
                </label>
              </div>
            ))}
          </div>

          {/* Advanced Settings */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              ตั้งค่าขั้นสูง
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Priority Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  แสดงการแจ้งเตือนตามความสำคัญ
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {Object.entries({ high: 'สำคัญมาก', medium: 'ปานกลาง', low: 'ทั่วไป' }).map(([key, label]) => (
                    <label key={key} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-color)',
                      backgroundColor: notificationSettings.priorities[key] ? 'var(--primary)' : 'var(--bg-secondary)',
                      color: notificationSettings.priorities[key] ? 'white' : 'var(--text-primary)',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.priorities[key]}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          priorities: {
                            ...prev.priorities,
                            [key]: e.target.checked
                          }
                        }))}
                        style={{ display: 'none' }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Auto Archive */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Archive size={16} color="var(--text-secondary)" />
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                      เก็บถาวรอัตโนมัติ
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.autoArchive}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      autoArchive: e.target.checked
                    }))}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                
                {notificationSettings.autoArchive && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      เก็บถาวรหลังจาก (วัน)
                    </label>
                    <select
                      value={notificationSettings.archiveDays}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        archiveDays: parseInt(e.target.value)
                      }))}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        backgroundColor: 'var(--bg-secondary)'
                      }}
                    >
                      <option value="7">7 วัน</option>
                      <option value="14">14 วัน</option>
                      <option value="30">30 วัน</option>
                      <option value="90">90 วัน</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleSaveSettings}
            disabled={actionLoading}
            style={{
              flex: 1,
              backgroundColor: actionLoading ? 'var(--text-muted)' : 'var(--primary)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {actionLoading && <Loader size={16} className="animate-spin" />}
            บันทึกการตั้งค่า
          </button>
          <button
            onClick={() => {
              setNotificationSettings({
                workoutReminders: true,
                nutritionReminders: true,
                progressUpdates: true,
                messages: true,
                achievements: true,
                promotions: false,
                emailNotifications: true,
                pushNotifications: true,
                smsNotifications: false,
                reminderTime: '30',
                quietHours: {
                  enabled: true,
                  start: '22:00',
                  end: '07:00'
                },
                soundEnabled: true,
                vibrationEnabled: true,
                smartGrouping: true,
                autoArchive: true,
                archiveDays: 30,
                priorities: {
                  high: true,
                  medium: true,
                  low: false
                }
              });
              showSnackBar('รีเซ็ตการตั้งค่าเป็นค่าเริ่มต้นแล้ว');
            }}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            รีเซ็ต
          </button>
        </div>
      </div>
    </div>
  );

  const renderSnackBar = () => {
    if (!snackBar.show) return null;

    return (
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 
          snackBar.type === 'success' ? 'var(--success)' :
          snackBar.type === 'error' ? 'var(--danger)' :
          snackBar.type === 'warning' ? 'var(--warning)' : 'var(--info)',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        animation: 'slideUp 0.3s ease'
      }}>
        {snackBar.type === 'success' && <CheckCircle size={16} />}
        {snackBar.type === 'error' && <AlertCircle size={16} />}
        {snackBar.type === 'warning' && <AlertTriangle size={16} />}
        {snackBar.type === 'info' && <Bell size={16} />}
        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
          {snackBar.message}
        </span>
      </div>
    );
  };

  const filteredNotifications = filterNotifications();
  const groupedNotifications = groupNotifications(filteredNotifications);

  return (
    <div style={{ 
      padding: windowWidth <= 768 ? '1rem' : '2rem',
      backgroundColor: 'var(--bg-secondary)',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h1 style={{ 
            fontSize: windowWidth <= 768 ? '1.5rem' : '1.75rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            การแจ้งเตือน
            {unreadCount > 0 && (
              <span style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--text-white)',
                borderRadius: '50%',
                width: '2rem',
                height: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {unreadCount}
              </span>
            )}
          </h1>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => {
                setShowAnalytics(true);
                if (!notificationStats) {
                  fetchNotificationStats();
                }
              }}
              style={{
                backgroundColor: 'var(--info)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="สถิติ"
            >
              <BarChart3 size={16} />
            </button>
            <button
              onClick={() => handleRefresh()}
              disabled={isRefreshing}
              style={{
                backgroundColor: isRefreshing ? 'var(--text-muted)' : 'var(--success)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="รีเฟรช"
            >
              <RefreshCw size={16} style={{
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
              }} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Settings size={16} />
              ตั้งค่า
            </button>
          </div>
        </div>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          ติดตามการแจ้งเตือนและข้อความสำคัญทั้งหมด
          {!isOnline && (
            <span style={{ color: 'var(--danger)', fontWeight: '500', marginLeft: '0.5rem' }}>
              • ออฟไลน์
            </span>
          )}
        </p>
      </div>

      {/* Search */}
      {showSearch && (
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              type="text"
              placeholder="ค้นหาการแจ้งเตือน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                backgroundColor: 'var(--bg-secondary)'
              }}
            />
            <button
              onClick={() => {
                setSearchTerm('');
                setShowSearch(false);
              }}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <div style={{
          backgroundColor: 'var(--primary)',
          borderRadius: '0.75rem',
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'var(--text-white)',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
            เลือกแล้ว {selectedNotifications.length} รายการ
          </span>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleMarkAsRead()}
              disabled={actionLoading}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              {actionLoading ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
              อ่านแล้ว
            </button>
            <button
              onClick={() => handleArchive()}
              disabled={actionLoading}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Archive size={14} />
              เก็บถาวร
            </button>
            <button
              onClick={() => handleDelete()}
              disabled={actionLoading}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Trash2 size={14} />
              ลบ
            </button>
            <button
              onClick={() => setSelectedNotifications([])}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-white)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Tabs and Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Tabs */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '0.5rem',
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          flex: 1
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
                setSelectedNotifications([]);
              }}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-white)' : 'var(--text-primary)',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              <tab.icon size={16} />
              {windowWidth > 768 ? tab.label : tab.label.split(' ')[0]}
              {tab.id === 'unread' && unreadCount > 0 && (
                <span style={{
                  backgroundColor: activeTab === tab.id ? 'rgba(255, 255, 255, 0.3)' : 'var(--accent)',
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
                  {unreadCount}
                </span>
              )}
              {tab.id === 'archived' && archivedCount > 0 && (
                <span style={{
                  backgroundColor: activeTab === tab.id ? 'rgba(255, 255, 255, 0.3)' : 'var(--warning)',
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
                  {archivedCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{
              backgroundColor: showSearch ? 'var(--primary)' : 'var(--bg-secondary)',
              color: showSearch ? 'white' : 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Search size={16} />
          </button>

          {/* Sort & Group */}
          <select
            value={`${sortBy}|${groupBy}`}
            onChange={(e) => {
              const [sort, group] = e.target.value.split('|');
              setSortBy(sort);
              setGroupBy(group);
            }}
            style={{
              padding: '0.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-secondary)',
              cursor: 'pointer'
            }}
          >
            <option value="time_desc|none">ล่าสุด</option>
            <option value="time_asc|none">เก่าสุด</option>
            <option value="priority|none">ความสำคัญ</option>
            <option value="sender|none">ผู้ส่ง</option>
            <option value="time_desc|date">จัดกลุ่มตามวัน</option>
            <option value="time_desc|category">จัดกลุ่มตามหมวด</option>
            <option value="time_desc|sender">จัดกลุ่มตามผู้ส่ง</option>
            <option value="priority|priority">จัดกลุ่มตามความสำคัญ</option>
          </select>
          
          <button
            onClick={handleSelectAll}
            disabled={filteredNotifications.length === 0}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              cursor: filteredNotifications.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {selectedNotifications.length === filteredNotifications.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
          </button>
          
          {unreadCount > 0 && (
            <button
              onClick={() => handleMarkAsRead(notifications.filter(n => !n.isRead).map(n => n.id))}
              disabled={actionLoading}
              style={{
                backgroundColor: actionLoading ? 'var(--text-muted)' : 'var(--success)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {actionLoading ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
              อ่านทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div ref={scrollRef} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {groupedNotifications.length > 0 ? groupedNotifications.map((group, groupIndex) => (
          <div key={groupIndex}>
            {group.title && (
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '1rem',
                marginTop: groupIndex > 0 ? '1rem' : '0',
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Calendar size={14} />
                {group.title}
                <span style={{
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '1.25rem',
                  height: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  marginLeft: 'auto'
                }}>
                  {group.notifications.length}
                </span>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {group.notifications.map(renderNotificationCard)}
            </div>
          </div>
        )) : (
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <Bell size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {searchTerm ? 'ไม่พบการแจ้งเตือนที่ค้นหา' : 'ไม่มีการแจ้งเตือน'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {searchTerm ? (
                <>ลองค้นหาด้วยคำอื่น หรือ <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}>ล้างการค้นหา</button></>
              ) : (
                activeTab === 'unread' 
                  ? 'คุณอ่านการแจ้งเตือนทั้งหมดแล้ว' 
                  : `ไม่มีการแจ้งเตือนในหมวด${tabs.find(t => t.id === activeTab)?.label}`
              )}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                ล้างการค้นหา
              </button>
            )}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              onClick={() => fetchNotifications(currentPage + 1)}
              disabled={loading}
              style={{
                backgroundColor: loading ? 'var(--text-muted)' : 'var(--primary)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: '0 auto'
              }}
            >
              {loading && <Loader size={16} className="animate-spin" />}
              โหลดเพิ่มเติม
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showSettings && renderSettingsModal()}
      {showAnalytics && renderAnalyticsModal()}
      {renderSnackBar()}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes slideUp {
            from { 
              transform: translate(-50%, 100%);
              opacity: 0;
            }
            to { 
              transform: translate(-50%, 0);
              opacity: 1;
            }
          }

          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default ClientNotifications;