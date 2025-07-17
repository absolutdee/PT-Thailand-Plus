// MobileTabBar.jsx
import React, { useState, useEffect } from 'react';
import { 
  Home, Calendar, MessageSquare, User, Plus,
  Users, TrendingUp, BookOpen, BarChart3
} from 'lucide-react';
import './MobileTabBar.scss';

const MobileTabBar = ({ userType, currentTab, onTabChange, onActionClick }) => {
  const [messageCount, setMessageCount] = useState(0);
  
  // Define tabs based on user type
  const tabConfigs = {
    client: [
      { id: 'home', icon: Home, label: 'หน้าหลัก', path: '/client/dashboard' },
      { id: 'schedule', icon: Calendar, label: 'ตาราง', path: '/client/schedule' },
      { id: 'action', icon: Plus, label: '', isAction: true },
      { id: 'messages', icon: MessageSquare, label: 'แชท', path: '/client/messages', badge: true },
      { id: 'profile', icon: User, label: 'โปรไฟล์', path: '/client/profile' }
    ],
    trainer: [
      { id: 'home', icon: Home, label: 'หน้าหลัก', path: '/trainer/dashboard' },
      { id: 'clients', icon: Users, label: 'ลูกค้า', path: '/trainer/clients' },
      { id: 'action', icon: Plus, label: '', isAction: true },
      { id: 'messages', icon: MessageSquare, label: 'แชท', path: '/trainer/messages', badge: true },
      { id: 'profile', icon: User, label: 'โปรไฟล์', path: '/trainer/profile' }
    ],
    admin: [
      { id: 'home', icon: Home, label: 'หน้าหลัก', path: '/admin/dashboard' },
      { id: 'users', icon: Users, label: 'สมาชิก', path: '/admin/members' },
      { id: 'action', icon: Plus, label: '', isAction: true },
      { id: 'reports', icon: BarChart3, label: 'รายงาน', path: '/admin/reports' },
      { id: 'profile', icon: User, label: 'โปรไฟล์', path: '/admin/profile' }
    ]
  };

  const tabs = tabConfigs[userType] || tabConfigs.client;

  useEffect(() => {
    // Fetch unread message count
    fetchMessageCount();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchMessageCount, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [userType]);

  const fetchMessageCount = async () => {
    try {
      const response = await fetch('/api/messages/unread-count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setMessageCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching message count:', error);
    }
  };

  const handleTabClick = (tab) => {
    if (tab.isAction) {
      // Handle action button click
      if (onActionClick) {
        onActionClick();
      }
    } else {
      onTabChange(tab);
    }
  };

  const getActionMenu = () => {
    switch(userType) {
      case 'client':
        return [
          { id: 'book-session', label: 'จองเซสชั่น', icon: Calendar },
          { id: 'find-trainer', label: 'ค้นหาเทรนเนอร์', icon: Users },
          { id: 'progress-entry', label: 'บันทึกความก้าวหน้า', icon: TrendingUp }
        ];
      case 'trainer':
        return [
          { id: 'create-package', label: 'สร้างแพ็คเกจ', icon: BookOpen },
          { id: 'add-schedule', label: 'เพิ่มตารางเทรน', icon: Calendar },
          { id: 'create-nutrition', label: 'สร้างโปรแกรมอาหาร', icon: BookOpen }
        ];
      case 'admin':
        return [
          { id: 'add-article', label: 'เพิ่มบทความ', icon: BookOpen },
          { id: 'create-event', label: 'สร้างอีเวนต์', icon: Calendar },
          { id: 'add-gym', label: 'เพิ่มยิม/ฟิตเนส', icon: Home }
        ];
      default:
        return [];
    }
  };

  return (
    <>
      <div className="mobile-tab-bar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id && !tab.isAction;
          
          return (
            <button
              key={tab.id}
              className={`tab-item ${isActive ? 'active' : ''} ${tab.isAction ? 'action-btn' : ''}`}
              onClick={() => handleTabClick(tab)}
              aria-label={tab.label || 'Action menu'}
            >
              <div className="tab-icon">
                <Icon size={tab.isAction ? 28 : 24} />
                {tab.badge && messageCount > 0 && (
                  <span className="badge">{messageCount > 99 ? '99+' : messageCount}</span>
                )}
              </div>
              {!tab.isAction && <span className="tab-label">{tab.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Action Menu Overlay */}
      <ActionMenu 
        userType={userType}
        menuItems={getActionMenu()}
        onItemClick={onActionClick}
      />
    </>
  );
};

// Action Menu Component
const ActionMenu = ({ userType, menuItems, onItemClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Listen for action menu events
    const handleOpenMenu = () => setIsOpen(true);
    window.addEventListener('openActionMenu', handleOpenMenu);
    
    return () => {
      window.removeEventListener('openActionMenu', handleOpenMenu);
    };
  }, []);

  const handleItemClick = (item) => {
    setIsOpen(false);
    if (onItemClick) {
      onItemClick(item.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="action-menu-overlay" onClick={() => setIsOpen(false)}>
      <div className="action-menu" onClick={(e) => e.stopPropagation()}>
        <div className="menu-header">
          <h3>เมนูลัด</h3>
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            ✕
          </button>
        </div>
        <div className="menu-items">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className="menu-item"
                onClick={() => handleItemClick(item)}
              >
                <Icon size={24} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileTabBar;
