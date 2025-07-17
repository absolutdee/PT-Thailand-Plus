// MobileNavigation.jsx
import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Home, Search, Calendar, MessageSquare, 
  User, Settings, LogOut, Bell, Award, TrendingUp,
  BookOpen, DollarSign, Users, BarChart3
} from 'lucide-react';
import './MobileNavigation.scss';

const MobileNavigation = ({ userType, currentPage, onNavigate, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);

  // Define menu items based on user type
  const menuItems = {
    client: [
      { id: 'dashboard', label: 'ภาพรวม', icon: Home, path: '/client/dashboard' },
      { id: 'workout-plan', label: 'แผนการเทรน', icon: Calendar, path: '/client/workout-plan' },
      { id: 'schedule', label: 'ตารางเทรน', icon: Calendar, path: '/client/schedule' },
      { id: 'progress', label: 'ความก้าวหน้า', icon: TrendingUp, path: '/client/progress' },
      { id: 'nutrition', label: 'โภชนาการ', icon: BookOpen, path: '/client/nutrition' },
      { id: 'messages', label: 'แชท', icon: MessageSquare, path: '/client/messages' },
      { id: 'achievements', label: 'ความสำเร็จ', icon: Award, path: '/client/achievements' },
      { id: 'settings', label: 'ตั้งค่า', icon: Settings, path: '/client/settings' }
    ],
    trainer: [
      { id: 'dashboard', label: 'ภาพรวม', icon: Home, path: '/trainer/dashboard' },
      { id: 'clients', label: 'ลูกค้า', icon: Users, path: '/trainer/clients' },
      { id: 'schedule', label: 'ตารางเทรน', icon: Calendar, path: '/trainer/schedule' },
      { id: 'nutrition', label: 'โภชนาการ', icon: BookOpen, path: '/trainer/nutrition' },
      { id: 'tracking', label: 'ติดตามผล', icon: BarChart3, path: '/trainer/tracking' },
      { id: 'messages', label: 'แชท', icon: MessageSquare, path: '/trainer/messages' },
      { id: 'revenue', label: 'การเงิน', icon: DollarSign, path: '/trainer/revenue' },
      { id: 'settings', label: 'ตั้งค่า', icon: Settings, path: '/trainer/settings' }
    ],
    admin: [
      { id: 'dashboard', label: 'ภาพรวม', icon: Home, path: '/admin/dashboard' },
      { id: 'members', label: 'จัดการสมาชิก', icon: Users, path: '/admin/members' },
      { id: 'content', label: 'จัดการเนื้อหา', icon: BookOpen, path: '/admin/content' },
      { id: 'finance', label: 'การเงิน', icon: DollarSign, path: '/admin/finance' },
      { id: 'reports', label: 'รายงาน', icon: BarChart3, path: '/admin/reports' },
      { id: 'settings', label: 'ตั้งค่าระบบ', icon: Settings, path: '/admin/settings' }
    ]
  };

  const currentMenuItems = menuItems[userType] || [];

  useEffect(() => {
    // Fetch notifications count
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setNotifications(data.count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNavigation = (item) => {
    onNavigate(item.path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    window.location.href = '/signin';
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="mobile-header">
        <button 
          className="menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <div className="header-logo">
          <h1>FitConnect</h1>
        </div>

        <div className="header-actions">
          <button className="notification-btn" onClick={() => onNavigate(`/${userType}/notifications`)}>
            <Bell size={20} />
            {notifications > 0 && (
              <span className="notification-badge">{notifications}</span>
            )}
          </button>
        </div>
      </header>

      {/* Slide-out Navigation Drawer */}
      <div className={`mobile-nav-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-overlay" onClick={() => setIsOpen(false)} />
        
        <nav className="drawer-content">
          <div className="drawer-header">
            <div className="user-info">
              <div className="user-avatar">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} />
                ) : (
                  <User size={32} />
                )}
              </div>
              <div className="user-details">
                <h3>{user?.name || 'ผู้ใช้'}</h3>
                <p>{user?.email || ''}</p>
              </div>
            </div>
          </div>

          <div className="drawer-menu">
            {currentMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  className={`menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavigation(item)}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="drawer-footer">
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={20} />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};

export default MobileNavigation;
