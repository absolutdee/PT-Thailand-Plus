import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Calendar, Apple, BarChart3, MessageSquare, 
  DollarSign, Settings, Search, Bell, Menu, X, User, CreditCard, 
  Edit, LogOut, ChevronDown, Star, Ticket, AlertCircle, CheckCircle, 
  Clock, TrendingUp, RefreshCw, Wifi, WifiOff
} from 'lucide-react';
import logo from '../../assets/images/logo.png';
import { Link, useNavigate } from 'react-router-dom';

// Import Context Provider - Updated with API integration
import { TrainerProvider, useTrainer } from '../../contexts/TrainerContext';

// Import individual page components
import DashboardOverview from './DashboardOverview';
import ClientsPage from './ClientsPage';
import SchedulePage from './SchedulePage';
import NutritionPage from './NutritionPage';
import TrackingPage from './TrackingPage';
import ChatPage from './ChatPage';
import RevenuePage from './TrainerFinanceDashboard';
import ProfilePage from './ProfilePage';
import SettingsPage from './SettingsPage';
import EIDCardPage from './EIDCardPage';
import ReviewsPage from './ReviewsPage';
import CouponsPage from './CouponsPage';

// Loading Component
const LoadingSpinner = ({ size = 40, color = '#df2528' }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh'
  }}>
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      border: `3px solid #f3f3f3`,
      borderTop: `3px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);

// Error Component
const ErrorMessage = ({ error, onRetry, onClose }) => (
  <div style={{
    position: 'fixed',
    top: '90px',
    right: '20px',
    maxWidth: '400px',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '0.5rem',
    padding: '1rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    zIndex: 1000,
    animation: 'slideIn 0.3s ease-out'
  }}>
    <style>
      {`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}
    </style>
    <AlertCircle size={20} color="#dc2626" style={{ marginTop: '2px' }} />
    <div style={{ flex: 1 }}>
      <h4 style={{ margin: 0, color: '#dc2626', fontSize: '0.875rem', fontWeight: '600' }}>
        เกิดข้อผิดพลาด
      </h4>
      <p style={{ margin: '0.25rem 0 0.75rem 0', fontSize: '0.75rem', color: '#991b1b' }}>
        {error}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '0.375rem 0.75rem',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}
          >
            ลองอีกครั้ง
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '0.375rem 0.75rem',
              background: 'transparent',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            ปิด
          </button>
        )}
      </div>
    </div>
  </div>
);

// Success Message Component
const SuccessMessage = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: '90px',
      right: '20px',
      maxWidth: '400px',
      background: '#dcfce7',
      border: '1px solid #bbf7d0',
      borderRadius: '0.5rem',
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease-out'
    }}>
      <CheckCircle size={20} color="#16a34a" />
      <span style={{ color: '#15803d', fontSize: '0.875rem', fontWeight: '500' }}>
        {message}
      </span>
      <button
        onClick={onClose}
        style={{
          marginLeft: 'auto',
          background: 'transparent',
          border: 'none',
          color: '#15803d',
          cursor: 'pointer',
          padding: '0.25rem'
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Connection Status Component
const ConnectionStatus = ({ isOnline }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '1rem',
    backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
    color: isOnline ? '#059669' : '#dc2626',
    fontSize: '0.75rem',
    fontWeight: '500'
  }}>
    {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
    {isOnline ? 'เชื่อมต่อแล้ว' : 'ไม่สามารถเชื่อมต่อได้'}
  </div>
);

// Main Dashboard Component with Context
const TrainerMainDashboard = () => {
  return (
    <TrainerProvider>
      <TrainerDashboardContent />
    </TrainerProvider>
  );
};

const TrainerDashboardContent = () => {
  // React Router Navigate Hook
  const navigate = useNavigate();
  
  // Local State
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Context State & Actions - Now uses real API data
  const { state, actions } = useTrainer();

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuOpen && !event.target.closest('.profile-dropdown')) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  // CSS Variables
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

  // Load initial dashboard data from API
  useEffect(() => {
    if (isOnline && !state.dashboard) {
      loadInitialData();
    }
  }, [isOnline, state.dashboard]);

  // Auto-refresh data when coming back online
  useEffect(() => {
    if (isOnline && Date.now() - lastRefresh > 60000) { // Refresh if offline for more than 1 minute
      refreshData();
    }
  }, [isOnline, lastRefresh]);

  // Load section-specific data when switching sections - Now uses API
  useEffect(() => {
    if (!isOnline) return;

    const loadSectionData = async () => {
      try {
        switch (activeSection) {
          case 'clients':
            if (state.clients.length === 0 && !state.clientsLoading) {
              await actions.loadClients();
            }
            break;
          case 'schedule':
            if (!state.scheduleLoading) {
              const today = new Date().toISOString().split('T')[0];
              await actions.loadSchedule(today);
            }
            break;
          case 'revenue':
            if (!state.revenue.monthly) {
              await actions.loadRevenue();
            }
            break;
          case 'reviews':
            if (state.reviews.length === 0) {
              await actions.loadReviews();
            }
            break;
          case 'coupons':
            if (state.coupons.length === 0) {
              await actions.loadCoupons();
            }
            break;
          case 'profile':
            if (!state.profile) {
              await Promise.all([
                actions.loadProfile(),
                actions.loadPackages()
              ]);
            }
            break;
          case 'chat':
            await actions.loadConversations();
            break;
        }
      } catch (error) {
        console.error(`Error loading ${activeSection} data:`, error);
      }
    };

    loadSectionData();
  }, [activeSection, state, actions, isOnline]);

  // Helper functions - Now use real API calls
  const loadInitialData = async () => {
    try {
      console.log('🚀 Loading initial dashboard data from API...');
      await actions.loadDashboardData();
      setLastRefresh(Date.now());
      console.log('✅ Initial data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      showSuccess('⚠️ กำลังใช้ข้อมูลออฟไลน์');
    }
  };

  const refreshData = async () => {
    try {
      console.log('🔄 Refreshing dashboard data from API...');
      await actions.refreshDashboard();
      setLastRefresh(Date.now());
      showSuccess('✅ ข้อมูลได้รับการอัพเดทแล้ว');
      console.log('✅ Data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      showSuccess('⚠️ ไม่สามารถอัพเดทข้อมูลได้');
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
  };

  const handleRetry = () => {
    actions.clearError();
    loadInitialData();
  };

  // แก้ไขฟังก์ชัน handleLogout
  const handleLogout = async () => {
    if (window.confirm('คุณต้องการออกจากระบบหรือไม่?')) {
      setIsLoggingOut(true);
      try {
        // 1. เรียก logout API (ถ้ามี)
        try {
          if (actions.logout) {
            await actions.logout();
          }
        } catch (apiError) {
          console.warn('Logout API error (continuing with local logout):', apiError);
        }

        // 2. Clear local storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        
        // 3. Clear session storage
        sessionStorage.clear();
        
        // 4. Clear context state
        if (actions.clearAllData) {
          actions.clearAllData();
        }
        
        // 5. Show success message
        showSuccess('✅ ออกจากระบบสำเร็จ');
        
        // 6. Navigate to login page
        setTimeout(() => {
          navigate('/signin', { replace: true });
        }, 1000);
        
      } catch (error) {
        console.error('Logout error:', error);
        setIsLoggingOut(false);
        
        // Force logout even if there's an error
        localStorage.clear();
        sessionStorage.clear();
        showSuccess('⚠️ บังคับออกจากระบบ');
        
        setTimeout(() => {
          navigate('/signin', { replace: true });
        }, 1000);
      }
    }
  };

  // Menu items with dynamic badges from API data
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'ภาพรวม', 
      icon: LayoutDashboard 
    },
    { 
      id: 'clients', 
      label: 'ลูกค้า', 
      icon: Users, 
      badge: state.stats?.totalClients > 0 ? state.stats.totalClients : null 
    },
    { 
      id: 'schedule', 
      label: 'ตารางการเทรน', 
      icon: Calendar,
      badge: state.stats?.pendingBookings > 0 ? state.stats.pendingBookings : null
    },
    { 
      id: 'nutrition', 
      label: 'โภชนาการ', 
      icon: Apple 
    },
    { 
      id: 'tracking', 
      label: 'ติดตามผลและรายงาน', 
      icon: BarChart3 
    },
    { 
      id: 'reviews', 
      label: 'รีวิวจากลูกค้า', 
      icon: Star,
      badge: state.totalReviews > 0 ? state.totalReviews : null
    },
    { 
      id: 'coupons', 
      label: 'คูปองส่วนลด', 
      icon: Ticket,
      badge: state.activeCoupons?.length > 0 ? state.activeCoupons.length : null
    },
    { 
      id: 'chat', 
      label: 'แชทข้อความ', 
      icon: MessageSquare, 
      badge: state.unreadCount > 0 ? state.unreadCount : null 
    },
    { 
      id: 'revenue', 
      label: 'การเงินและรายได้', 
      icon: DollarSign 
    },
    { 
      id: 'profile', 
      label: 'ข้อมูลส่วนตัว', 
      icon: User 
    },
    { 
      id: 'settings', 
      label: 'การตั้งค่า', 
      icon: Settings 
    }
  ];

  // Profile dropdown items - แก้ไข logout action
  const profileDropdownItems = [
    { 
      id: 'id-card', 
      label: 'แสดง ID Card ส่วนตัว', 
      icon: CreditCard, 
      action: () => {
        setActiveSection('id-card');
        setProfileMenuOpen(false);
        if (windowWidth <= 768) {
          setMobileMenuOpen(false);
        }
      }
    },
    { 
      id: 'edit-profile', 
      label: 'แก้ไขโปรไฟล์', 
      icon: Edit, 
      action: () => {
        setActiveSection('profile');
        setProfileMenuOpen(false);
        if (windowWidth <= 768) {
          setMobileMenuOpen(false);
        }
      }
    },
    { 
      id: 'logout', 
      label: isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ', 
      icon: LogOut, 
      action: handleLogout,
      danger: true,
      disabled: isLoggingOut
    }
  ];

  // Render Navigation
  const renderNavigation = () => (
    <div style={{
      position: 'fixed',
      top: '73px',
      left: windowWidth <= 768 ? (mobileMenuOpen ? '0' : '-280px') : (sidebarOpen ? '0' : '-280px'),
      width: '280px',
      height: 'calc(100vh - 73px)',
      backgroundColor: 'var(--bg-primary)',
      borderRight: '1px solid var(--border-color)',
      transition: 'left 0.3s ease',
      zIndex: 40,
      overflowY: 'auto'
    }}>
      <nav style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: activeSection === item.id ? 'var(--accent)' : 'var(--text-secondary)',
                backgroundColor: activeSection === item.id ? 'rgba(223, 37, 40, 0.1)' : 'transparent',
                borderRight: activeSection === item.id ? '3px solid var(--accent)' : 'none',
                fontSize: '0.875rem',
                fontWeight: activeSection === item.id ? '600' : '500'
              }}
              onClick={() => {
                setActiveSection(item.id);
                if (windowWidth <= 768) {
                  setMobileMenuOpen(false);
                }
              }}
              onMouseEnter={(e) => {
                if (activeSection !== item.id) {
                  e.target.style.backgroundColor = 'var(--bg-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== item.id) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <item.icon size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  padding: '0.2rem 0.5rem',
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );

  // Render Profile Dropdown - แก้ไขเพื่อรองรับ disabled state
  const renderProfileDropdown = () => (
    <div style={{
      position: 'absolute',
      top: '100%',
      right: '0',
      marginTop: '0.5rem',
      minWidth: '200px',
      backgroundColor: 'var(--bg-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: '0.75rem',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      zIndex: 100
    }}>
      <div style={{ padding: '0.5rem' }}>
        {profileDropdownItems.map((item, index) => (
          <div key={item.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                color: item.danger ? 'var(--danger)' : 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: '500',
                opacity: item.disabled ? 0.6 : 1
              }}
              onClick={item.disabled ? undefined : item.action}
              onMouseEnter={(e) => {
                if (!item.disabled) {
                  e.target.style.backgroundColor = item.danger ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!item.disabled) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </div>
            {index < profileDropdownItems.length - 1 && (
              <div style={{
                height: '1px',
                backgroundColor: 'var(--border-color)',
                margin: '0.25rem 0'
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Render content with real API data and loading states
  const renderContent = () => {
    if (!isOnline) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <WifiOff size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>ไม่สามารถเชื่อมต่อได้</h2>
          <p style={{ marginBottom: '1.5rem' }}>กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            ลองอีกครั้ง
          </button>
        </div>
      );
    }

    if (state.loading && !state.dashboard) {
      return <LoadingSpinner />;
    }

    // Pass real API data to components
    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardOverview 
            data={state.dashboard} 
            stats={state.stats}
            todaySchedule={state.todaySchedule}
            windowWidth={windowWidth}
            onRefresh={refreshData}
            loading={state.loading}
          />
        );
      case 'clients':
        return (
          <ClientsPage 
            clients={state.clients}
            loading={state.clientsLoading}
            windowWidth={windowWidth}
            onAddClient={actions.addClient}
            onUpdateClient={actions.updateClient}
            onRemoveClient={actions.removeClient}
            onSuccess={showSuccess}
          />
        );
      case 'schedule':
        return (
          <SchedulePage 
            schedule={state.schedule}
            loading={state.scheduleLoading}
            windowWidth={windowWidth}
            onCreateSession={actions.createSession}
            onUpdateSession={actions.updateSession}
            onLoadSchedule={actions.loadSchedule}
            onSuccess={showSuccess}
          />
        );
      case 'nutrition':
        return <NutritionPage windowWidth={windowWidth} />;
      case 'tracking':
        return <TrackingPage windowWidth={windowWidth} />;
      case 'reviews':
        return (
          <ReviewsPage 
            reviews={state.reviews}
            averageRating={state.averageRating}
            totalReviews={state.totalReviews}
            windowWidth={windowWidth}
            onRespondToReview={actions.respondToReview}
            onSuccess={showSuccess}
          />
        );
      case 'coupons':
        return (
          <CouponsPage 
            coupons={state.coupons}
            activeCoupons={state.activeCoupons}
            windowWidth={windowWidth}
            onCreateCoupon={actions.createCoupon}
            onUpdateCoupon={actions.updateCoupon}
            onDeleteCoupon={actions.deleteCoupon}
            onToggleCoupon={actions.toggleCoupon}
            onSuccess={showSuccess}
          />
        );
      case 'chat':
        return (
          <ChatPage 
            conversations={state.conversations}
            unreadCount={state.unreadCount}
            windowWidth={windowWidth} 
            setNotifications={actions.updateUnreadCount}
            onLoadConversations={actions.loadConversations}
          />
        );
      case 'revenue':
        return (
          <RevenuePage 
            revenue={state.revenue}
            windowWidth={windowWidth}
            onLoadRevenue={actions.loadRevenue}
          />
        );
      case 'profile':
        return (
          <ProfilePage 
            profile={state.profile}
            packages={state.packages}
            windowWidth={windowWidth}
            onUpdateProfile={actions.updateProfile}
            onSuccess={showSuccess}
          />
        );
      case 'settings':
        return <SettingsPage windowWidth={windowWidth} />;
      case 'id-card':
        return <EIDCardPage windowWidth={windowWidth} />;
      default:
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>กำลังพัฒนา</h2>
            <p>หน้านี้อยู่ระหว่างการพัฒนา</p>
          </div>
        );
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-secondary)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Success Message */}
      {successMessage && (
        <SuccessMessage 
          message={successMessage} 
          onClose={() => setSuccessMessage(null)} 
        />
      )}

      {/* Error Message */}
      {state.error && (
        <ErrorMessage 
          error={state.error} 
          onRetry={handleRetry}
          onClose={actions.clearError} 
        />
      )}

      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '73px',
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        zIndex: 50,
        padding: '0 1rem'
      }}>
        <div style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              style={{
                display: windowWidth <= 768 ? 'flex' : (sidebarOpen ? 'none' : 'flex'),
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
              onClick={() => windowWidth <= 768 ? setMobileMenuOpen(!mobileMenuOpen) : setSidebarOpen(!sidebarOpen)}
            >
              {windowWidth <= 768 && mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
              <img src={logo} alt="FitConnect" style={{ height: '40px' }} />
            </Link>
          </div>

          {/* Search Bar */}
          <div style={{
            flex: 1,
            maxWidth: '400px',
            position: 'relative',
            display: windowWidth <= 768 ? 'none' : 'block',
            margin: '0 2rem'
          }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                placeholder="ค้นหาลูกค้า, เซสชั่น..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 1rem 0.625rem 2.75rem',
                  borderRadius: '2rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>
          </div>

          {/* Header Stats & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Connection Status */}
            {windowWidth > 1024 && <ConnectionStatus isOnline={isOnline} />}

            {/* Quick Stats (Desktop only) - From real API data */}
            {windowWidth > 1200 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} color="var(--info)" />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    วันนี้: {state.stats?.todaySessions || 0} เซสชั่น
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={16} color="var(--success)" />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    ฿{(state.stats?.monthlyRevenue || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={refreshData}
              disabled={state.loading}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: state.loading ? 'not-allowed' : 'pointer',
                color: 'var(--text-secondary)',
                opacity: state.loading ? 0.5 : 1
              }}
              title="อัพเดทข้อมูล"
            >
              <RefreshCw 
                size={18} 
                style={{ 
                  animation: state.loading ? 'spin 1s linear infinite' : 'none' 
                }} 
              />
            </button>

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                position: 'relative'
              }}>
                <Bell size={20} style={{ color: 'var(--text-secondary)' }} />
                {state.unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '0.25rem',
                    right: '0.25rem',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    borderRadius: '50%',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {state.unreadCount > 99 ? '99+' : state.unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Dropdown */}
            <div
              className="profile-dropdown"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem',
                borderRadius: '2rem',
                cursor: 'pointer',
                backgroundColor: profileMenuOpen ? 'var(--bg-secondary)' : 'transparent',
                transition: 'background-color 0.2s ease'
              }}
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-white)',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {state.profile?.name ? state.profile.name.charAt(0).toUpperCase() : 'T'}
              </div>
              {windowWidth > 768 && (
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                    {state.profile?.name || 'โค้ชทรนิ่ง'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Trainer
                  </div>
                </div>
              )}
              <ChevronDown 
                size={16} 
                style={{ 
                  color: 'var(--text-muted)',
                  transform: profileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  display: windowWidth <= 768 ? 'none' : 'block'
                }} 
              />
              
              {/* Dropdown Menu */}
              {profileMenuOpen && renderProfileDropdown()}
            </div>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div style={{
        display: 'flex',
        minHeight: 'calc(100vh - 73px)',
        position: 'relative',
        paddingTop: '73px'
      }}>
        {/* Sidebar */}
        {renderNavigation()}

        {/* Main Content */}
        <main style={{
          flex: 1,
          marginLeft: windowWidth <= 768 ? '0' : (sidebarOpen ? '280px' : '0'),
          marginRight: '0px' ,
          width: '100%',
          maxWidth: '100%',
          padding: windowWidth <= 768 ? '1rem' : '2rem',
          overflowY: 'auto',
          minHeight: 'calc(100vh - 73px)',
          transition: 'margin-left 0.3s ease',
          position: 'relative'
        }}>
          {renderContent()}
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && windowWidth <= 768 && (
        <div
          style={{
            position: 'fixed',
            top: '73px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 30
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default TrainerMainDashboard;