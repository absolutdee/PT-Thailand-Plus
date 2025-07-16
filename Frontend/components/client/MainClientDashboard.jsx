import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, User, Calendar, TrendingUp, 
  MessageSquare, Star, Trophy, Bell, 
  CreditCard, Settings, Menu, X, ChevronRight,
  Activity, Target, Heart, Users, Clock,
  Dumbbell, Apple, LogOut, Gift, Ticket,
  Loader
} from 'lucide-react';
import logo from '../../assets/images/logo.png';
import { Link } from 'react-router-dom';

// Import all client dashboard components
import ClientDashboardOverview from './ClientDashboardOverview';
import ClientWorkoutPlan from './ClientWorkoutPlan';
import ClientSchedule from './ClientSchedule';
import ClientProgress from './ClientProgress';
import ClientNutrition from './ClientNutrition';
import ClientMessages from './ClientChatPage';
import ClientReviews from './ClientReviews';
import ClientAchievements from './ClientAchievements';
import ClientNotifications from './ClientNotifications';
import ClientBilling from './ClientBilling';
import ClientSettings from './ClientSettings';
import ClientCoupons from './ClientCoupons';

// API Base URL - ปรับตามการตั้งค่าของโปรเจค
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// API Service Functions - แก้ไขให้เชื่อมต่อฐานข้อมูลได้ถูกต้อง
const apiService = {
  // ดึงข้อมูลผู้ใช้
  getUserProfile: async (userId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('ไม่พบ authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/client/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token หมดอายุ - redirect ไป login
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
          window.location.href = '/signin';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || data; // รองรับทั้ง response format ที่มี data wrapper และไม่มี
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // ดึงข้อมูล badge counts สำหรับเมนู
  getBadgeCounts: async (userId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return {
          scheduleCount: 0,
          messagesCount: 0,
          notificationsCount: 0,
          couponsCount: 0
        };
      }

      const response = await fetch(`${API_BASE_URL}/client/badge-counts/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
          window.location.href = '/signin';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || data || {
        scheduleCount: 0,
        messagesCount: 0,
        notificationsCount: 0,
        couponsCount: 0
      };
    } catch (error) {
      console.error('Error fetching badge counts:', error);
      return {
        scheduleCount: 0,
        messagesCount: 0,
        notificationsCount: 0,
        couponsCount: 0
      };
    }
  },

  // ดึงข้อมูลแพคเกจปัจจุบัน
  getCurrentPackage: async (userId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/client/current-package/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
          window.location.href = '/signin';
          return;
        }
        if (response.status === 404) {
          // ไม่มีแพคเกจ - return null
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error fetching current package:', error);
      return null;
    }
  },

  // Update badge counts (สำหรับ real-time updates)
  updateBadgeCount: async (userId, badgeType, increment = true) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      await fetch(`${API_BASE_URL}/client/badge-counts/${userId}/${badgeType}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ increment })
      });
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  },

  // Logout
  logout: async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // ลบข้อมูลใน localStorage และ redirect
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      window.location.href = '/signin';
    }
  }
};

const MainClientDashboard = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [hoveredItem, setHoveredItem] = useState(null);
  
  // Database-related states
  const [userData, setUserData] = useState(null);
  const [badgeCounts, setBadgeCounts] = useState({
    scheduleCount: 0,
    messagesCount: 0,
    notificationsCount: 0,
    couponsCount: 0
  });
  const [currentPackage, setCurrentPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Responsive breakpoints
  const breakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
  };

  const isMobile = windowWidth <= breakpoints.mobile;
  const isTablet = windowWidth > breakpoints.mobile && windowWidth <= breakpoints.tablet;
  const isDesktop = windowWidth > breakpoints.tablet;

  // ดึง userId จาก localStorage
  const userId = localStorage.getItem('userId');

  // ตรวจสอบ authentication
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token || !userId) {
      window.location.href = '/signin';
      return;
    }
  }, [userId]);

  // Load data from database - แก้ไขให้มีประสิทธิภาพมากขึ้น
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        setError('ไม่พบข้อมูลผู้ใช้');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // ดึงข้อมูลแบบ parallel พร้อมจัดการ error แยกต่างหาก
        const [userProfileResult, badgeDataResult, packageDataResult] = await Promise.allSettled([
          apiService.getUserProfile(userId),
          apiService.getBadgeCounts(userId),
          apiService.getCurrentPackage(userId)
        ]);

        // จัดการ user profile
        if (userProfileResult.status === 'fulfilled' && userProfileResult.value) {
          setUserData(userProfileResult.value);
        } else {
          console.error('Failed to load user profile:', userProfileResult.reason);
          setError('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
        }

        // จัดการ badge counts
        if (badgeDataResult.status === 'fulfilled' && badgeDataResult.value) {
          setBadgeCounts(prevCounts => ({
            ...prevCounts,
            ...badgeDataResult.value
          }));
        } else {
          console.error('Failed to load badge counts:', badgeDataResult.reason);
        }

        // จัดการ current package
        if (packageDataResult.status === 'fulfilled') {
          setCurrentPackage(packageDataResult.value);
        } else {
          console.error('Failed to load current package:', packageDataResult.reason);
        }

      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  // Auto-refresh badge counts every 30 seconds - ปรับปรุงให้มีประสิทธิภาพมากขึ้น
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(async () => {
      try {
        const badgeData = await apiService.getBadgeCounts(userId);
        if (badgeData) {
          setBadgeCounts(prevCounts => ({
            ...prevCounts,
            ...badgeData
          }));
        }
      } catch (err) {
        console.error('Error refreshing badge counts:', err);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [userId]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > breakpoints.mobile) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoints.mobile]);

  // Set CSS variables and add custom styles
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

    // Add custom scrollbar styles
    const style = document.createElement('style');
    style.textContent = `
      /* Custom scrollbar for webkit browsers */
      ::-webkit-scrollbar {
        width: 6px;
      }
      ::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }
      ::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Refresh data function - สำหรับให้ child components เรียกใช้
  const refreshData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const [userProfileResult, badgeDataResult, packageDataResult] = await Promise.allSettled([
        apiService.getUserProfile(userId),
        apiService.getBadgeCounts(userId),
        apiService.getCurrentPackage(userId)
      ]);

      if (userProfileResult.status === 'fulfilled' && userProfileResult.value) {
        setUserData(userProfileResult.value);
      }
      if (badgeDataResult.status === 'fulfilled' && badgeDataResult.value) {
        setBadgeCounts(prevCounts => ({ ...prevCounts, ...badgeDataResult.value }));
      }
      if (packageDataResult.status === 'fulfilled') {
        setCurrentPackage(packageDataResult.value);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update badge count function - สำหรับ real-time updates
  const updateBadgeCount = (badgeType, count) => {
    setBadgeCounts(prevCounts => ({
      ...prevCounts,
      [badgeType]: count
    }));
  };

  // Navigation items for client - ใช้ข้อมูลจากฐานข้อมูล
  const getNavItems = () => [
    { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard, badge: null },
    { id: 'workout-plan', label: 'แผนการเทรน', icon: Target, badge: null },
    { id: 'schedule', label: 'ตารางเทรน', icon: Calendar, badge: badgeCounts.scheduleCount || null },
    { id: 'progress', label: 'ความก้าวหน้า', icon: TrendingUp, badge: null },
    { id: 'nutrition', label: 'โภชนาการ', icon: Apple, badge: null },
    { id: 'coupons', label: 'คูปองส่วนลด', icon: Gift, badge: badgeCounts.couponsCount || null },
    { id: 'messages', label: 'แชทกับเทรนเนอร์', icon: MessageSquare, badge: badgeCounts.messagesCount || null },
    { id: 'reviews', label: 'รีวิวเทรนเนอร์', icon: Star, badge: null },
    { id: 'achievements', label: 'ความสำเร็จ', icon: Trophy, badge: null },
    { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell, badge: badgeCounts.notificationsCount || null },
    { id: 'billing', label: 'ประวัติการชำระเงิน', icon: CreditCard, badge: null },
    { id: 'settings', label: 'การตั้งค่า', icon: Settings, badge: null }
  ];

  // Default user data สำหรับกรณีที่ยังโหลดไม่เสร็จ
  const defaultUserData = {
    name: 'กำลังโหลด...',
    avatar: '...',
    email: '...',
    firstName: '',
    lastName: ''
  };

  // ใช้ข้อมูลจากฐานข้อมูลหรือค่า default
  const displayUserData = userData || defaultUserData;

  // สร้าง avatar initials
  const getAvatarInitials = (user) => {
    if (!user || loading) return '...';
    
    if (user.firstName && user.lastName) {
      return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
    } else if (user.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
      }
      return user.name.charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  // Handle navigation
  const handleNavigation = (sectionId) => {
    setActiveSection(sectionId);
    setHoveredItem(null);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (window.confirm('คุณต้องการออกจากระบบหรือไม่?')) {
      await apiService.logout();
    }
  };

  // Function to get background color for nav item
  const getNavItemBackgroundColor = (itemId) => {
    if (activeSection === itemId) {
      return 'var(--primary)';
    }
    if (hoveredItem === itemId) {
      return 'var(--bg-secondary)';
    }
    return 'transparent';
  };

  // Function to get text color for nav item
  const getNavItemTextColor = (itemId) => {
    if (activeSection === itemId) {
      return 'var(--text-white)';
    }
    return 'var(--text-secondary)';
  };

  // Loading component
  const renderLoading = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <Loader size={40} style={{ animation: 'spin 1s linear infinite' }} />
      <div style={{ color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูล...</div>
    </div>
  );

  // Error component
  const renderError = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ color: 'var(--danger)', fontSize: '1.125rem', fontWeight: '600' }}>
        เกิดข้อผิดพลาด
      </div>
      <div style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '400px' }}>
        {error}
      </div>
      <button
        onClick={refreshData}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: 'var(--primary)',
          color: 'var(--text-white)',
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

  // Show loading or error state
  if (loading && !userData) {
    return renderLoading();
  }

  if (error && !userData) {
    return renderError();
  }

  const navItems = getNavItems();

  // Render navigation items
  const renderNavItem = (item) => (
    <button
      key={item.id}
      onClick={() => handleNavigation(item.id)}
      onMouseEnter={() => setHoveredItem(item.id)}
      onMouseLeave={() => setHoveredItem(null)}
      style={{
        width: '100%',
        padding: '0.75rem 1rem',
        border: 'none',
        borderRadius: '0.5rem',
        backgroundColor: getNavItemBackgroundColor(item.id),
        color: getNavItemTextColor(item.id),
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'left',
        marginBottom: '0.25rem',
        position: 'relative'
      }}
    >
      <item.icon size={18} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge && item.badge > 0 && (
        <span style={{
          backgroundColor: activeSection === item.id ? 'rgba(255,255,255,0.2)' : 'var(--accent)',
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
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </button>
  );

  // Render sidebar navigation
  const renderSidebar = () => (
    <div style={{
      width: isMobile && mobileMenuOpen ? '100%' : isMobile ? '0' : '280px',
      height: '100vh',
      backgroundColor: 'var(--bg-primary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: isMobile ? 1000 : 100,
      transform: isMobile ? (mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
      transition: 'transform 0.3s ease',
      boxShadow: isDesktop ? 'none' : '2px 0 10px rgba(0,0,0,0.1)',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '1.5rem', 
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/">
            <img src={logo} className="App-logo" alt="logo" style={{ height: "40px" }} />
          </Link>
        </div>
        
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(false)}
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
        )}
      </div>

      {/* User Profile */}
      <div style={{ 
        padding: '1.5rem', 
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '50%',
            background: loading ? 'var(--bg-secondary)' : 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--text-white)'
          }}>
            {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : getAvatarInitials(displayUserData)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              {loading ? 'กำลังโหลด...' : (displayUserData.name || `${displayUserData.firstName || ''} ${displayUserData.lastName || ''}`.trim() || 'ผู้ใช้')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {loading ? '...' : displayUserData.email || ''}
            </div>
          </div>
        </div>
        
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            แพคเกจปัจจุบัน
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {loading ? 'กำลังโหลด...' : (currentPackage?.packageName || 'ไม่มีแพคเกจ')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {loading ? '...' : (currentPackage?.trainerName ? `กับ ${currentPackage.trainerName}` : '')}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ 
        flex: 1, 
        padding: '1rem',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ 
            fontSize: '0.75rem', 
            fontWeight: '600', 
            color: 'var(--text-muted)', 
            marginBottom: '0.75rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            paddingLeft: '0.25rem'
          }}>
            เมนูหลัก
          </div>
          {navItems.slice(0, 6).map(renderNavItem)}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ 
            fontSize: '0.75rem', 
            fontWeight: '600', 
            color: 'var(--text-muted)', 
            marginBottom: '0.75rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            paddingLeft: '0.25rem'
          }}>
            การสื่อสาร
          </div>
          {navItems.slice(6, 8).map(renderNavItem)}
        </div>

        <div>
          <div style={{ 
            fontSize: '0.75rem', 
            fontWeight: '600', 
            color: 'var(--text-muted)', 
            marginBottom: '0.75rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            paddingLeft: '0.25rem'
          }}>
            บัญชี
          </div>
          {navItems.slice(8).map(renderNavItem)}
        </div>
      </nav>

      {/* Footer */}
      <div style={{ 
        padding: '1rem', 
        borderTop: '1px solid var(--border-color)',
        flexShrink: 0,
        backgroundColor: 'var(--bg-primary)'
      }}>
        <button 
          onClick={handleLogout}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <LogOut size={18} />}
          ออกจากระบบ
        </button>
      </div>
    </div>
  );

  // Render mobile bottom navigation
  const renderMobileBottomNav = () => (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'var(--bg-primary)',
      borderTop: '1px solid var(--border-color)',
      padding: '0.75rem',
      display: isMobile ? 'block' : 'none',
      zIndex: 100,
      boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '0.5rem',
        alignItems: 'center'
      }}>
        {navItems.slice(0, 4).map(item => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.id)}
            style={{
              padding: '0.5rem',
              border: 'none',
              borderRadius: '0.5rem',
              backgroundColor: 'transparent',
              color: activeSection === item.id ? 'var(--primary)' : 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.625rem',
              fontWeight: '500',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span style={{
                position: 'absolute',
                top: '0.25rem',
                right: '0.75rem',
                backgroundColor: 'var(--accent)',
                color: 'var(--text-white)',
                borderRadius: '50%',
                width: '1rem',
                height: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.625rem',
                fontWeight: '600'
              }}>
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => setMobileMenuOpen(true)}
          style={{
            padding: '0.5rem',
            border: 'none',
            borderRadius: '0.5rem',
            backgroundColor: 'transparent',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.625rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <Menu size={20} />
          <span>เมนู</span>
        </button>
      </div>
    </div>
  );

  // Render mobile header
  const renderMobileHeader = () => (
    <div style={{
      display: isMobile ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 1.5rem',
      backgroundColor: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      minHeight: '70px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={() => setMobileMenuOpen(true)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            color: 'var(--text-primary)'
          }}
        >
          <Menu size={20} />
        </button>
        <div>
          <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--primary)' }}>
            FitConnect
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={() => handleNavigation('notifications')}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            color: 'var(--text-primary)',
            position: 'relative'
          }}
        >
          <Bell size={20} />
          {badgeCounts.notificationsCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '0.25rem',
              right: '0.25rem',
              backgroundColor: 'var(--accent)',
              color: 'var(--text-white)',
              borderRadius: '50%',
              width: '0.75rem',
              height: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.625rem',
              fontWeight: '600'
            }}>
              {badgeCounts.notificationsCount > 9 ? '9+' : badgeCounts.notificationsCount}
            </span>
          )}
        </button>
        
        <div style={{
          width: '2rem',
          height: '2rem',
          borderRadius: '50%',
          background: loading ? 'var(--bg-secondary)' : 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: 'var(--text-white)'
        }}>
          {loading ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : getAvatarInitials(displayUserData)}
        </div>
      </div>
    </div>
  );

  // Render content based on active section
  const renderContent = () => {
    // ส่ง props ที่จำเป็นไปยัง child components
    const commonProps = {
      userData: displayUserData,
      currentPackage,
      badgeCounts,
      loading,
      userId,
      refreshData,
      updateBadgeCount,
      apiService
    };

    switch (activeSection) {
      case 'dashboard':
        return <ClientDashboardOverview {...commonProps} />;
      case 'workout-plan':
        return <ClientWorkoutPlan {...commonProps} />;
      case 'schedule':
        return <ClientSchedule {...commonProps} />;
      case 'progress':
        return <ClientProgress {...commonProps} />;
      case 'nutrition':
        return <ClientNutrition {...commonProps} />;
      case 'coupons':
        return <ClientCoupons {...commonProps} />;
      case 'messages':
        return <ClientMessages {...commonProps} />;
      case 'reviews':
        return <ClientReviews {...commonProps} />;
      case 'achievements':
        return <ClientAchievements {...commonProps} />;
      case 'notifications':
        return <ClientNotifications {...commonProps} />;
      case 'billing':
        return <ClientBilling {...commonProps} />;
      case 'settings':
        return <ClientSettings {...commonProps} />;
      default:
        return <ClientDashboardOverview {...commonProps} />;
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-secondary)',
      display: 'flex',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      position: 'relative'
    }}>
      {/* Sidebar */}
      {renderSidebar()}
      
      {/* Mobile overlay */}
      {isMobile && mobileMenuOpen && (
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
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        marginLeft: isMobile ? '0' : '280px',
        paddingBottom: isMobile ? '80px' : '0',
        width: isMobile ? '100%' : 'calc(100% - 280px)'
      }}>
        {/* Mobile Header */}
        {renderMobileHeader()}
        
        {/* Content Area */}
        <main style={{
          flex: 1,
          backgroundColor: 'var(--bg-secondary)',
          padding: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: '100vh',
          width: '100%'
        }}>
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {renderMobileBottomNav()}
    </div>
  );
};

export default MainClientDashboard;