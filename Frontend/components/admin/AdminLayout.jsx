import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Calendar, TrendingUp, 
  MessageSquare, Star, FileText, Settings,
  Menu, X, ChevronRight, Bell, ChevronDown,
  PieChart, Activity, Heart, Target, 
  CreditCard, MapPin, Image, Video, 
  Headphones, Briefcase, Shield, Globe,
  Receipt, BarChart3, Bot, Ticket, LogOut
} from 'lucide-react';
import logo from '../../assets/images/logo.png';
import { Link } from 'react-router-dom';

// Import page components
import DashboardOverview from './DashboardOverview';
import MembersManagement from './MembersManagement';
import ContentManagement from './ContentManagement';
import EventsManagement from './EventsManagement';
import GymsManagement from './GymsManagement';
import ReviewsManagement from './ReviewsManagement';
import PartnersManagement from './PartnersManagement';
import MediaManagement from './MediaManagement';
import FinanceManagement from './FinanceManagement';
import SessionsManagement from './SessionsManagement';
import ReportsPage from './ReportsPage';
import SupportManagement from './SupportManagement';
import AdminChatPage from './AdminChatPage';
import SystemSettings from './SystemSettings';

// Import Financial System components
import TrainerBillingSystem from './financial/TrainerBillingSystem';
import BillingAutomationSystem from './financial/BillingAutomationSystem';
import FinancialReportingDashboard from './financial/FinancialReportingDashboard';

// Import Coupon Management System
import CouponManagement from './CouponManagement';

// API service functions
const apiService = {
  // ดึงข้อมูลผู้ดูแลระบบ
  getAdminProfile: async () => {
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch admin profile');
      return await response.json();
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      return null;
    }
  },

  // ดึงข้อมูลการแจ้งเตือน
  getNotifications: async () => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { unreadCount: 0, notifications: [] };
    }
  },

  // อัพเดตสถานะการแจ้งเตือน
  markNotificationAsRead: async (notificationId) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to mark notification as read');
      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },

  // ออกจากระบบ
  logout: async () => {
    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }
};

// Create wrapper components for MembersManagement with specific tabs
const CustomersManagement = ({ windowWidth }) => (
  <MembersManagement windowWidth={windowWidth} initialTab="customers" />
);

const TrainersManagement = ({ windowWidth }) => (
  <MembersManagement windowWidth={windowWidth} initialTab="trainers" />
);

// Create wrapper components for SystemSettings with specific sections  
const CustomerSettings = ({ windowWidth }) => (
  <SystemSettings windowWidth={windowWidth} initialSection="customer-settings" />
);

const TrainerSettings = ({ windowWidth }) => (
  <SystemSettings windowWidth={windowWidth} initialSection="trainer-settings" />
);

const PaymentSettings = ({ windowWidth }) => (
  <SystemSettings windowWidth={windowWidth} initialSection="payment-settings" />
);

const HeroSettings = ({ windowWidth }) => (
  <SystemSettings windowWidth={windowWidth} initialSection="hero-settings" />
);

const SEOSettings = ({ windowWidth }) => (
  <SystemSettings windowWidth={windowWidth} initialSection="seo-settings" />
);

const ProfileSettings = ({ windowWidth }) => (
  <SystemSettings windowWidth={windowWidth} initialSection="profile-settings" />
);

const AdminLayout = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState({});
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  // สถานะสำหรับข้อมูลจากฐานข้อมูล
  const [adminProfile, setAdminProfile] = useState({
    name: 'Admin',
    role: 'ผู้ดูแลระบบ',
    avatar: null,
    initials: 'A'
  });
  const [notifications, setNotifications] = useState({
    unreadCount: 0,
    notifications: []
  });
  const [loading, setLoading] = useState(true);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ดึงข้อมูลเริ่มต้นจากฐานข้อมูล
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      
      try {
        // ดึงข้อมูลผู้ดูแลระบบและการแจ้งเตือนพร้อมกัน
        const [profileData, notificationsData] = await Promise.all([
          apiService.getAdminProfile(),
          apiService.getNotifications()
        ]);

        // อัพเดตข้อมูลผู้ดูแลระบบ
        if (profileData) {
          setAdminProfile({
            name: profileData.name || 'Admin',
            role: profileData.role || 'ผู้ดูแลระบบ',
            avatar: profileData.avatar || null,
            initials: profileData.name ? profileData.name.charAt(0).toUpperCase() : 'A'
          });
        }

        // อัพเดตข้อมูลการแจ้งเตือน
        if (notificationsData) {
          setNotifications(notificationsData);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // อัพเดตการแจ้งเตือนทุก 30 วินาที
  useEffect(() => {
    const notificationInterval = setInterval(async () => {
      const notificationsData = await apiService.getNotifications();
      if (notificationsData) {
        setNotifications(notificationsData);
      }
    }, 30000); // 30 วินาที

    return () => clearInterval(notificationInterval);
  }, []);

  // จัดการคลิกข้างนอก dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownOpen && !event.target.closest('.user-dropdown-container')) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  // Set CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', '#232956');
    root.style.setProperty('--accent', '#df2528');
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-secondary', '#f8fafc');
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

  // Toggle submenu expansion
  const toggleSubmenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // จัดการคลิกการแจ้งเตือน
  const handleNotificationClick = async () => {
    // ที่นี่สามารถเพิ่มโค้ดสำหรับแสดง popup การแจ้งเตือนได้
    console.log('Notification clicked', notifications);
    
    // ตัวอย่าง: อัพเดตการแจ้งเตือนเป็นอ่านแล้ว
    if (notifications.unreadCount > 0) {
      const updatedNotifications = await apiService.getNotifications();
      if (updatedNotifications) {
        setNotifications(updatedNotifications);
      }
    }
  };

  // จัดการออกจากระบบ
  const handleLogout = async () => {
    const confirmLogout = window.confirm('คุณต้องการออกจากระบบหรือไม่?');
    
    if (confirmLogout) {
      try {
        // เรียก API ออกจากระบบ
        const success = await apiService.logout();
        
        // ลบ token ออกจาก localStorage
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUserData');
        
        // เคลียร์ session storage ถ้ามี
        sessionStorage.clear();
        
        // Redirect ไปหน้า login หรือหน้าแรก
        window.location.href = '/signin';
        
        if (success) {
          console.log('Logout successful');
        }
      } catch (error) {
        console.error('Error during logout:', error);
        // แม้จะมีข้อผิดพลาด ก็ยังให้ logout ในฝั่ง client
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUserData');
        sessionStorage.clear();
        window.location.href = '/signin';
      }
    }
  };

  // Navigation items for admin - แยกเมนูบทความและอีเว้นท์
  const navItems = [
    { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
    { id: 'articles', label: 'ข่าวสารและบทความ', icon: FileText },
    { id: 'events', label: 'อีเว้นท์', icon: Calendar },
    { id: 'gyms', label: 'ยิมและฟิตเนส', icon: MapPin },
    { 
      id: 'members', 
      label: 'จัดการสมาชิก', 
      icon: Users,
      
    },
    { id: 'reviews', label: 'จัดการรีวิว', icon: Star },
    { id: 'partners', label: 'จัดการพาร์ทเนอร์', icon: Briefcase },
    { id: 'media', label: 'จัดการสื่อและมีเดีย', icon: Image },
    { id: 'coupons', label: 'จัดการคูปองส่วนลด', icon: Ticket },
    { 
      id: 'finance', 
      label: 'จัดการการเงิน', 
      icon: CreditCard,
      subItems: [
        { id: 'finance-overview', label: 'ภาพรวมการเงิน' },
        { id: 'trainer-billing', label: 'ระบบเรียกเก็บเงินเทรนเนอร์' },
        { id: 'billing-automation', label: 'ระบบ Billing อัตโนมัติ' },
        { id: 'financial-reports', label: 'รายงานการเงิน' }
      ]
    },
    { id: 'sessions', label: 'จัดการเซสชั่น', icon: Activity },
    { id: 'reports', label: 'รายงาน', icon: TrendingUp },
    { id: 'support', label: 'ซัพพอร์ต', icon: MessageSquare },
    { id: 'chat', label: 'จัดการแชทระบบ', icon: MessageSquare },
    { 
      id: 'settings', 
      label: 'การตั้งค่า', 
      icon: Settings,
      
    }
  ];

  // Render Navigation Sidebar
  const renderNavigation = () => (
    <div style={{
      position: windowWidth <= 768 ? 'fixed' : 'relative',
      left: windowWidth <= 768 ? (mobileMenuOpen ? '0' : '-100%') : '0',
      top: windowWidth <= 768 ? '73px' : '0',
      width: windowWidth <= 768 ? '280px' : '280px',
      height: windowWidth <= 768 ? 'calc(100vh - 73px)' : '100%',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      transition: 'left 0.3s ease',
      zIndex: windowWidth <= 768 ? 999 : 1,
      overflowY: 'auto'
    }}>
      {/* Mobile Overlay */}
      {windowWidth <= 768 && mobileMenuOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: -1
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <nav style={{ padding: '1.5rem 0' }}>
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            color: 'var(--text-muted)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em' 
          }}>
            เมนูหลัก
          </h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {navItems.map((item) => (
            <div key={item.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  color: activeSection === item.id || 
                         (item.subItems && item.subItems.some(sub => sub.id === activeSection)) ? 
                         'var(--accent)' : 'var(--text-secondary)',
                  backgroundColor: activeSection === item.id || 
                                 (item.subItems && item.subItems.some(sub => sub.id === activeSection)) ? 
                                 'rgba(223, 37, 40, 0.05)' : 'transparent',
                  borderRight: activeSection === item.id || 
                             (item.subItems && item.subItems.some(sub => sub.id === activeSection)) ? 
                             '3px solid var(--accent)' : '3px solid transparent',
                  transition: 'all 0.2s',
                  fontWeight: activeSection === item.id || 
                            (item.subItems && item.subItems.some(sub => sub.id === activeSection)) ? 
                            '600' : '500'
                }}
                onClick={() => {
                  if (item.subItems) {
                    toggleSubmenu(item.id);
                  } else {
                    setActiveSection(item.id);
                    if (windowWidth <= 768) setMobileMenuOpen(false);
                  }
                }}
              >
                <item.icon size={20} />
                <span style={{ fontSize: '0.875rem', flex: 1 }}>{item.label}</span>
                {item.subItems && (
                  <ChevronDown 
                    size={16} 
                    style={{ 
                      transform: expandedMenus[item.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }} 
                  />
                )}
              </div>
              
              {/* Submenu */}
              {item.subItems && expandedMenus[item.id] && (
                <div style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderTop: '1px solid var(--border-color)',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  {item.subItems.map((subItem) => (
                    <div
                      key={subItem.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem 1.5rem 0.5rem 3.25rem',
                        cursor: 'pointer',
                        color: activeSection === subItem.id ? 'var(--accent)' : 'var(--text-secondary)',
                        backgroundColor: activeSection === subItem.id ? 'rgba(223, 37, 40, 0.05)' : 'transparent',
                        fontSize: '0.875rem',
                        transition: 'all 0.2s',
                        fontWeight: activeSection === subItem.id ? '600' : '400'
                      }}
                      onClick={() => {
                        setActiveSection(subItem.id);
                        if (windowWidth <= 768) setMobileMenuOpen(false);
                      }}
                    >
                      <span>•</span>
                      <span>{subItem.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );

  // Render active content based on current section
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview windowWidth={windowWidth} />;
      
      // Members Management
      case 'members':
        return <MembersManagement windowWidth={windowWidth} />;
      case 'customers':
        return <CustomersManagement windowWidth={windowWidth} />;
      case 'trainers':
        return <TrainersManagement windowWidth={windowWidth} />;
      
      // Content Management
      case 'articles':
        return <ContentManagement windowWidth={windowWidth} />;
      case 'events':
        return <EventsManagement windowWidth={windowWidth} />;
      case 'gyms':
        return <GymsManagement windowWidth={windowWidth} />;
      case 'reviews':
        return <ReviewsManagement windowWidth={windowWidth} />;
      case 'partners':
        return <PartnersManagement windowWidth={windowWidth} />;
      case 'media':
        return <MediaManagement windowWidth={windowWidth} />;
      
      // Coupon Management
      case 'coupons':
        return <CouponManagement windowWidth={windowWidth} />;
      
      // Finance Management
      case 'finance':
      case 'finance-overview':
        return <FinanceManagement windowWidth={windowWidth} />;
      case 'trainer-billing':
        return <TrainerBillingSystem windowWidth={windowWidth} />;
      case 'billing-automation':
        return <BillingAutomationSystem windowWidth={windowWidth} />;
      case 'financial-reports':
        return <FinancialReportingDashboard windowWidth={windowWidth} />;
      
      // Other Management
      case 'sessions':
        return <SessionsManagement windowWidth={windowWidth} />;
      case 'reports':
        return <ReportsPage windowWidth={windowWidth} />;
      case 'support':
        return <SupportManagement windowWidth={windowWidth} />;
      case 'chat':
        return <AdminChatPage windowWidth={windowWidth} />;
      
      // Settings Management
      case 'settings':
        return <SystemSettings windowWidth={windowWidth} />;
      case 'customer-settings':
        return <CustomerSettings windowWidth={windowWidth} />;
      case 'trainer-settings':
        return <TrainerSettings windowWidth={windowWidth} />;
      case 'payment-settings':
        return <PaymentSettings windowWidth={windowWidth} />;
      case 'hero-settings':
        return <HeroSettings windowWidth={windowWidth} />;
      case 'seo-settings':
        return <SEOSettings windowWidth={windowWidth} />;
      case 'profile-settings':
        return <ProfileSettings windowWidth={windowWidth} />;
      
      default:
        return <DashboardOverview windowWidth={windowWidth} />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: 'var(--text-primary)',
      position: 'relative'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '1rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          maxWidth: '100%',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              style={{
                display: windowWidth <= 768 ? 'block' : 'none',
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--primary)'
            }}>
              <Link to="/">
                <img src={logo} className="App-logo" alt="logo" style={{ height: "40px" }} />
              </Link>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            {/* Notification Bell with real data */}
            <div style={{
              position: 'relative',
              display: windowWidth <= 768 ? 'none' : 'block',
              cursor: 'pointer'
            }}
            onClick={handleNotificationClick}>
              <Bell size={20} color="var(--text-secondary)" />
              {notifications.unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-0.25rem',
                  right: '-0.25rem',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--text-white)',
                  fontSize: '0.625rem',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '0.75rem',
                  fontWeight: '700',
                  minWidth: '1.25rem',
                  textAlign: 'center'
                }}>
                  {notifications.unreadCount > 99 ? '99+' : notifications.unreadCount}
                </span>
              )}
            </div>
            
            {/* Admin Profile Dropdown */}
            <div style={{ position: 'relative' }} className="user-dropdown-container">
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  transition: 'background-color 0.2s',
                  backgroundColor: userDropdownOpen ? 'rgba(223, 37, 40, 0.05)' : 'transparent'
                }}
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                onMouseEnter={(e) => {
                  if (!userDropdownOpen) {
                    e.target.style.backgroundColor = 'rgba(223, 37, 40, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!userDropdownOpen) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: adminProfile.avatar ? 'transparent' : 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-white)',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  backgroundImage: adminProfile.avatar ? `url(${adminProfile.avatar})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}>
                  {!adminProfile.avatar && adminProfile.initials}
                </div>
                <div style={{ display: windowWidth <= 768 ? 'none' : 'block' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                    {loading ? 'กำลังโหลด...' : adminProfile.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {adminProfile.role}
                  </div>
                </div>
                <ChevronDown 
                  size={16} 
                  style={{ 
                    color: 'var(--text-muted)',
                    transform: userDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }} 
                />
              </div>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  marginTop: '0.5rem',
                  width: '200px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  zIndex: 1001,
                  overflow: 'hidden'
                }}>
                  {/* Profile Option */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      borderBottom: '1px solid var(--border-color)'
                    }}
                    onClick={() => {
                      setActiveSection('profile-settings');
                      setUserDropdownOpen(false);
                      if (windowWidth <= 768) setMobileMenuOpen(false);
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--bg-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Settings size={16} color="var(--text-secondary)" />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      ข้อมูลส่วนตัว
                    </span>
                  </div>

                  {/* Settings Option */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      borderBottom: '1px solid var(--border-color)'
                    }}
                    onClick={() => {
                      setActiveSection('settings');
                      setUserDropdownOpen(false);
                      if (windowWidth <= 768) setMobileMenuOpen(false);
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--bg-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Settings size={16} color="var(--text-secondary)" />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      การตั้งค่าระบบ
                    </span>
                  </div>

                  {/* Logout Option */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      color: 'var(--accent)'
                    }}
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleLogout();
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(223, 37, 40, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    <LogOut size={16} color="var(--accent)" />
                    <span style={{ fontSize: '0.875rem', color: 'var(--accent)', fontWeight: '500' }}>
                      ออกจากระบบ
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div style={{
        display: 'flex',
        minHeight: 'calc(100vh - 73px)',
        position: 'relative'
      }}>
        {/* Sidebar */}
        {renderNavigation()}

        {/* Main Content */}
        <main style={{
          flex: 1,
          padding: windowWidth <= 768 ? '1rem' : '2rem',
          overflowY: 'auto',
          minHeight: '100%'
        }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;