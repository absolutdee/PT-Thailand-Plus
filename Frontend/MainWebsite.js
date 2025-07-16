// src/components/main/MainWebsite.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Users, Activity, MessageSquare, Settings, Home, Search, MapPin, Star, ChevronRight, Menu, X, Clock, Award, TrendingUp, Heart, DollarSign, Book, Phone, Mail, Facebook, Instagram, Twitter, Youtube, Bell, User, LogOut, BarChart, ChevronDown, ArrowUp } from 'lucide-react';
import logo from '../../images/logo-new2020.png';
import logowhite from '../../images/logo-new2020-white.png';

// Helper function สำหรับ API calls - แก้ไขให้รองรับ error handling ที่ดีขึ้น
const apiCall = async (endpoint, options = {}) => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // เพิ่ม Authorization header หากมี token
    const token = localStorage.getItem('authToken');
    if (token && !options.skipAuth) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        ...defaultHeaders,
        ...options.headers
      },
      signal: controller.signal,
      ...options
    });

    clearTimeout(timeoutId);

    // Handle specific HTTP status codes
    if (response.status === 401) {
      // Unauthorized - remove token and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/signin';
      throw new Error('Session expired - please login again');
    }

    if (response.status === 403) {
      throw new Error('Access denied');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - เซิร์ฟเวอร์ใช้เวลานานเกินไป');
    }
    throw error;
  }
};

// Navbar Component - เชื่อมต่อกับ database
const Navbar = ({ isAuthenticated, user, notifications, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', label: 'หน้าแรก', exact: true },
    { path: '/search', label: 'ค้นหาเทรนเนอร์' },
    { path: '/events', label: 'อีเว้นท์' },
    { path: '/gyms', label: 'ยิม & ฟิตเนส' },
    { path: '/articles', label: 'บทความ' },
    { path: '/contact', label: 'ติดต่อเรา' }
  ];

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const handleDashboardRedirect = () => {
    if (user?.role === 'trainer') {
      navigate('/trainer');
    } else if (user?.role === 'client') {
      navigate('/client');
    } else if (user?.role === 'admin') {
      navigate('/admin');
    }
  };

  // นับจำนวน notifications ที่ยังไม่ได้อ่าน
  const unreadCount = notifications?.filter(notif => !notif.is_read).length || 0;

  return (
    <nav className={`navbar navbar-expand-lg fixed-top ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img src={logo} className="App-logo" alt="logo" style={{ height: "38px" }} />
        </Link>
        
        <button 
          className="navbar-toggler border-0"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`navbar-collapse ${isMobileMenuOpen ? 'show' : ''}`}>
          <ul className="navbar-nav ms-auto align-items-center">
            {navItems.map((item, index) => (
              <li key={index} className="nav-item">
                <Link 
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`} 
                  to={item.path}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {!isAuthenticated ? (
              <>
                <li className="nav-item ms-3">
                  <Link to="/signin" className="btn btn-outline-primary">เข้าสู่ระบบ</Link>
                </li>
                <li className="nav-item ms-2">
                  <Link to="/signup" className="btn btn-primary">สมัครสมาชิก</Link>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item ms-3">
                  <button className="btn btn-notification position-relative">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="notification-badge">{unreadCount}</span>
                    )}
                  </button>
                </li>
                <li className="nav-item dropdown ms-2">
                  <button 
                    className="btn btn-user-profile"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                  >
                    <img 
                      src={user?.avatar_url || user?.avatar || 'https://via.placeholder.com/40x40'} 
                      alt={user?.display_name || user?.name}
                      className="user-avatar"
                    />
                    <span className="user-name d-none d-lg-inline">
                      {user?.display_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.name}
                    </span>
                    <ChevronDown size={16} className="ms-1" />
                  </button>
                  {showUserDropdown && (
                    <ul className="dropdown-menu show">
                      <li className="dropdown-header">
                        <div className="user-info">
                          <img 
                            src={user?.avatar_url || user?.avatar || 'https://via.placeholder.com/40x40'} 
                            alt={user?.display_name || user?.name} 
                            className="dropdown-avatar" 
                          />
                          <div>
                            <div className="user-name-dropdown">
                              {user?.display_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.name}
                            </div>
                            <div className="user-email">{user?.email}</div>
                          </div>
                        </div>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <a className="dropdown-item" href="#" onClick={handleDashboardRedirect}>
                          <Home size={16} className="me-2" />
                          ภาพรวม
                        </a>
                      </li>
                      <li>
                        <a className="dropdown-item" href="#" onClick={() => setShowUserDropdown(false)}>
                          <Settings size={16} className="me-2" />
                          ตั้งค่า
                        </a>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <a className="dropdown-item text-danger" href="#" onClick={handleLogout}>
                          <LogOut size={16} className="me-2" />
                          ออกจากระบบ
                        </a>
                      </li>
                    </ul>
                  )}
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

// Footer Component - เชื่อมต่อกับ newsletter API
const Footer = ({ onNewsletterSubscribe }) => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [message, setMessage] = useState('');

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage('กรุณากรอกอีเมล');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }

    setIsSubscribing(true);
    try {
      await onNewsletterSubscribe(email);
      setMessage('สมัครรับข่าวสารสำเร็จ!');
      setEmail('');
    } catch (error) {
      setMessage(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsSubscribing(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 col-md-6 mb-4">
            <div className="footer-widget">
              <img src={logowhite} className="App-logo" alt="logo" style={{ width: "200px" }} />
              <p className="mt-3">
                แพลตฟอร์มค้นหาเทรนเนอร์ออกกำลังกายที่ดีที่สุดในประเทศไทย 
                พบกับเทรนเนอร์มืออาชีพที่พร้อมช่วยให้คุณบรรลุเป้าหมายสุขภาพ
              </p>
              <div className="social-links mt-4">
                <a href="#" className="social-link"><Facebook size={20} /></a>
                <a href="#" className="social-link"><Instagram size={20} /></a>
                <a href="#" className="social-link"><Twitter size={20} /></a>
                <a href="#" className="social-link"><Youtube size={20} /></a>
              </div>
            </div>
          </div>
          
          <div className="col-lg-2 col-md-6 mb-4">
            <div className="footer-widget">
              <h5 className="widget-title" style={{color:"#ffffff"}}>เมนูลัด</h5>
              <ul className="footer-links">
                <li><a href="#about">เกี่ยวกับเรา</a></li>
                <li><a href="#how-it-works">วิธีใช้งาน</a></li>
                <li><a href="#pricing">ราคาแพคเกจ</a></li>
                <li><a href="#testimonials">รีวิวจากลูกค้า</a></li>
                <li><a href="#partners">พาร์ทเนอร์</a></li>
              </ul>
            </div>
          </div>
          
          <div className="col-lg-2 col-md-6 mb-4">
            <div className="footer-widget">
              <h5 className="widget-title" style={{color:"#ffffff"}}>สำหรับเทรนเนอร์</h5>
              <ul className="footer-links">
                <li><a href="#become-trainer">สมัครเป็นเทรนเนอร์</a></li>
                <li><a href="#trainer-guide">คู่มือเทรนเนอร์</a></li>
                <li><a href="#trainer-benefits">สิทธิประโยชน์</a></li>
                <li><a href="#trainer-support">ศูนย์ช่วยเหลือ</a></li>
              </ul>
            </div>
          </div>
          
          <div className="col-lg-4 col-md-6 mb-4">
            <div className="footer-widget">
              <h5 className="widget-title" style={{color:"#ffffff"}}>ติดต่อเรา</h5>
              <ul className="contact-info">
                <li>
                  <MapPin size={16} className="me-2" />
                  123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110
                </li>
                <li>
                  <Phone size={16} className="me-2" />
                  02-123-4567
                </li>
                <li>
                  <Mail size={16} className="me-2" />
                  info@fitfinder.com
                </li>
              </ul>

            </div>
          </div>
        </div>
        
        <hr className="footer-divider" />
        
        <div className="row">
          <div className="col-md-6">
            <p className="copyright mb-0">
              © 2025 PT Tailand Plus. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <ul className="footer-bottom-links">
              <li><a href="#privacy">นโยบายความเป็นส่วนตัว</a></li>
              <li><a href="#terms">ข้อกำหนดการใช้งาน</a></li>
              <li><a href="#cookies">นโยบายคุกกี้</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

const MainWebsite = () => {
  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  
  // UI States
  const [show, setShow] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // API Functions - แก้ไขให้เชื่อมต่อกับฐานข้อมูลจริง
  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAuthLoading(false);
        return;
      }

      const userData = await apiCall('/auth/verify', { skipAuth: false });
      
      if (userData.success && userData.user) {
        setIsAuthenticated(true);
        setUser(userData.user);
        await loadNotifications(userData.user.id);
      } else {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.warn('Authentication check failed:', error);
      localStorage.removeItem('authToken');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const loadNotifications = async (userId) => {
    try {
      if (!userId) return;

      const notificationsData = await apiCall(`/notifications/user/${userId}?limit=10&unread_only=false`);
      
      if (notificationsData.success && notificationsData.data) {
        // Map database notification format
        const mappedNotifications = notificationsData.data.map(notification => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          is_read: notification.is_read || notification.read,
          created_at: notification.created_at,
          updated_at: notification.updated_at
        }));
        
        setNotifications(mappedNotifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.warn('Failed to load notifications:', error);
      setNotifications([]);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await apiCall('/auth/logout', {
          method: 'POST',
          skipAuth: false
        });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('authToken');
      setIsAuthenticated(false);
      setUser(null);
      setNotifications([]);
    }
  };

  const handleNewsletterSubscribe = async (email) => {
    try {
      const response = await apiCall('/newsletter/subscribe', {
        method: 'POST',
        skipAuth: true, // Newsletter subscription ไม่จำเป็นต้อง authenticate
        body: JSON.stringify({ 
          email: email.trim(),
          source: 'website_footer',
          subscribed_at: new Date().toISOString()
        })
      });

      if (!response.success) {
        throw new Error(response.message || 'Subscription failed');
      }

      return response;
    } catch (error) {
      // Re-throw with proper error message
      throw error;
    }
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check authentication on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Periodic refresh of notifications for authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      const refreshInterval = setInterval(() => {
        loadNotifications(user.id);
      }, 60000); // Refresh every minute

      return () => clearInterval(refreshInterval);
    }
  }, [isAuthenticated, user]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8f9fa'
      }}>
        <div style={{
          padding: '2rem',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e9ecef',
            borderTop: '4px solid #232956',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        :root {
          --primary-color: #232956;
          --secondary-color: #df2528;
          --light-bg: #f8f9fa;
          --text-dark: #333;
          --text-light: #6c757d;
          --border-color: #e9ecef;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Prompt', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--text-dark);
          line-height: 1.6;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 15px;
        }

        .row {
          display: flex;
          flex-wrap: wrap;
          margin: 0 -15px;
        }

        .col-md-4, .col-md-6, .col-lg-2, .col-lg-3, .col-lg-4, .col-lg-6 {
          padding: 0 15px;
          width: 100%;
          text-align: left;
        }

        @media (min-width: 768px) {
          .col-md-4 { width: 33.333%; }
          .col-md-6 { width: 50%; }
        }

        @media (min-width: 992px) {
          .col-lg-2 { width: 16.667%; }
          .col-lg-3 { width: 25%; }
          .col-lg-4 { width: 33.333%; }
          .col-lg-6 { width: 50%; }
        }

        .d-flex {
          display: flex;
        }

        .d-none {
          display: none;
        }

        .d-inline {
          display: inline;
        }

        .d-block {
          display: block;
        }

        @media (min-width: 992px) {
          .d-lg-inline {
            display: inline !important;
          }
          
          .d-lg-block {
            display: block !important;
          }
        }

        .align-items-center {
          align-items: center;
        }

        .justify-content-center {
          justify-content: center;
        }

        .justify-content-between {
          justify-content: space-between;
        }

        .gap-2 {
          gap: 0.5rem;
        }

        .gap-3 {
          gap: 1rem;
        }

        .ms-auto {
          margin-left: auto;
        }

        .ms-1 { margin-left: 0.25rem; }
        .ms-2 { margin-left: 0.5rem; }
        .ms-3 { margin-left: 1rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-3 { margin-top: 1rem; }
        .mt-4 { margin-top: 1.5rem; }
        .mb-0 { margin-bottom: 0; }
        .mb-4 { margin-bottom: 1.5rem; }
        .mb-5 { margin-bottom: 3rem; }
        .me-2 { margin-right: 0.5rem; }

        .text-center { text-align: center; }
        .text-md-end { text-align: right; }
        .text-success { color: #28a745; }
        .text-warning { color: #ffc107; }

        /* Navbar Styles */
        .navbar {
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 1rem 0;
          transition: all 0.3s ease;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          overflow: visible;
        }

        .navbar-scrolled {
          padding: 0.5rem 0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .navbar-brand {
          text-decoration: none;
        }

        .navbar-nav {
          list-style: none;
          display: flex;
          align-items: center;
          margin: 0;
          padding: 0;
          overflow: visible;
        }

        .nav-item {
          list-style: none;
          overflow: visible;
        }

        .nav-link {
          color: var(--text-dark);
          font-weight: 500;
          padding: 0.5rem 1rem;
          height: 40px;
          transition: color 0.3s ease;
          text-decoration: none;
          display: block;
        }

        .nav-link:hover {
          color: var(--secondary-color);
        }

        .navbar-toggler {
          display: none;
        }

        .dropdown {
          position: relative;
        }

        /* Button Styles */
        .btn {
          padding: 0.5rem 1.5rem;
          border-radius: 5px;
          font-weight: 500;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-lg {
          padding: 0.75rem 2rem;
          font-size: 1.125rem;
        }

        .btn-primary {
          background-color: var(--secondary-color);
          color: white;
          height: 40px;
        }

        .btn-primary:hover {
          background-color: #c51e1e;
          transform: translateY(-2px);
        }

        .btn-primary:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
          transform: none;
        }

        .btn-outline-primary {
          background-color: transparent;
          border: 2px solid var(--primary-color);
          color: var(--primary-color);
          height: 40px;
        }

        .btn-outline-primary:hover {
          background-color: var(--primary-color);
          color: white;
        }

        .btn-outline-light {
          background-color: transparent;
          border: 2px solid white;
          color: white;
        }

        .btn-outline-light:hover {
          background-color: white;
          color: var(--primary-color);
        }

        .btn-icon {
          background: transparent;
          border: none;
          padding: 0.5rem;
          position: relative;
        }

        /* Notification Button */
        .btn-notification {
          background: transparent;
          border: none;
          padding: 0.5rem;
          position: relative;
          transition: all 0.3s ease;
          color: var(--primary-color);
          border-radius: 8px;
          overflow: visible;
        }

        .btn-notification:hover {
          background: rgba(35, 41, 86, 0.1);
          transform: translateY(-1px);
        }

        .notification-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: var(--secondary-color);
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          border-radius: 50%;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
          box-shadow: 0 2px 4px rgba(223, 37, 40, 0.3);
          z-index: 10;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        /* User Profile Button */
        .btn-user-profile {
          background: rgba(35, 41, 86, 0.05);
          border: 1px solid rgba(35, 41, 86, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 25px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.3s ease;
          color: var(--text-dark);
          font-weight: 500;
        }

        .btn-user-profile:hover {
          background: rgba(35, 41, 86, 0.1);
          border-color: rgba(35, 41, 86, 0.2);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(35, 41, 86, 0.1);
        }

        .user-name {
          font-size: 0.9rem;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Dropdown Improvements */
        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          padding: 0.5rem 0;
          min-width: 280px;
          z-index: 1001;
          list-style: none;
          margin-top: 0.5rem;
        }

        .dropdown-header {
          padding: 1rem 1.5rem 0.5rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          margin-bottom: 0.5rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .dropdown-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-name-dropdown {
          font-weight: 600;
          color: var(--text-dark);
          font-size: 0.95rem;
        }

        .user-email {
          font-size: 0.8rem;
          color: var(--text-light);
        }

        .dropdown-item {
          padding: 0.75rem 1.5rem;
          color: var(--text-dark);
          text-decoration: none;
          display: flex;
          align-items: center;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }

        .dropdown-item:hover {
          background: rgba(35, 41, 86, 0.05);
          color: var(--primary-color);
        }

        .dropdown-item.text-danger {
          color: var(--secondary-color);
        }

        .dropdown-item.text-danger:hover {
          background: rgba(223, 37, 40, 0.05);
          color: var(--secondary-color);
        }

        .dropdown-divider {
          margin: 0.5rem 0;
          border: 0;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }

        .badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 50px;
        }

        .bg-danger {
          background-color: #dc3545;
        }

        .position-relative { position: relative; }
        .position-absolute { position: absolute; }
        .top-0 { top: 0; }
        .start-100 { left: 100%; }
        .translate-middle { transform: translate(-50%, -50%); }

        /* Footer */
        .footer {
          background-color: var(--primary-color);
          color: white;
          padding: 60px 0 20px;
        }

        .footer-widget h5 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          text-align: left;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          text-align: left;
        }

        .footer-links li {
          margin-bottom: 0.75rem;
          text-align: left;
        }

        .footer-links a {
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .footer-links a:hover {
          color: white;
        }

        .social-links {
          display: flex;
          gap: 1rem;
        }

        .social-link {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: background 0.3s ease;
          text-decoration: none;
        }

        .social-link:hover {
          background: var(--secondary-color);
        }

        .contact-info {
          list-style: none;
          padding: 0;
        }

        .contact-info li {
          margin-bottom: 1rem;
          display: flex;
          align-items: flex-start;
          color: rgba(255, 255, 255, 0.8);
        }

        .footer-divider {
          border: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin: 40px 0 20px;
        }

        .footer-bottom-links {
          list-style: none;
          padding: 0;
          display: flex;
          gap: 2rem;
          justify-content: flex-end;
          margin: 0;
        }

        .footer-bottom-links a {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 0.875rem;
        }

        .copyright {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.875rem;
        }

        .form-control {
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: 5px;
          font-size: 1rem;
          width: 100%;
        }

        .form-control:focus {
          outline: none;
          border-color: var(--secondary-color);
          box-shadow: 0 0 0 0.2rem rgba(223, 37, 40, 0.25);
        }

        .form-control:disabled {
          background-color: #e9ecef;
          opacity: 1;
        }

        /* Newsletter Section */
        .newsletter-section h6 {
          font-weight: 600;
          margin-bottom: 1rem;
        }

        /* Back to Top Button */
        .back-to-top {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 50px;
          height: 50px;
          background: var(--secondary-color);
          color: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 1000;
          opacity: 0;
          transform: translateY(100px);
        }

        .back-to-top.show {
          opacity: 1;
          transform: translateY(0);
        }

        .back-to-top:hover {
          background: #c21e21;
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(223, 37, 40, 0.4);
        }

        /* Mobile Sidebar */
        .mobile-sidebar {
          position: fixed;
          top: 0;
          right: -100%;
          width: 300px;
          height: 100vh;
          background: var(--primary-color);
          z-index: 1001;
          transition: right 0.3s ease;
          overflow-y: auto;
          padding: 2rem;
        }

        .mobile-sidebar.show {
          right: 0;
        }

        .mobile-sidebar .nav-link {
          color: rgba(255,255,255,0.9) !important;
          padding: 1rem 0 !important;
          margin: 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          display: block;
        }

        .mobile-sidebar .nav-link:hover {
          color: var(--secondary-color) !important;
          padding-left: 1rem !important;
        }

        .sidebar-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
        }

        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.7);
          z-index: 1000;
          display: none;
        }

        .overlay.show {
          display: block;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .navbar-toggler {
            display: block;
          }
          
          .navbar-collapse {
            position: fixed;
            top: 70px;
            left: 0;
            right: 0;
            background: white;
            padding: 1rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: none;
          }
          
          .navbar-collapse.show {
            display: block;
          }
          
          .navbar-nav {
            flex-direction: column;
          }
          
          .nav-item {
            width: 100%;
          }

          /* Mobile Navigation Items */
          .btn-notification {
            padding: 0.4rem;
            border-radius: 6px;
          }

          .btn-user-profile {
            padding: 0.5rem 0.75rem;
            border-radius: 20px;
          }

          .user-name {
            display: none;
          }

          .dropdown-menu {
            min-width: 250px;
            right: -20px;
          }

          .dropdown-header {
            padding: 0.75rem 1rem 0.5rem;
          }

          .user-info {
            gap: 0.5rem;
          }

          .dropdown-avatar {
            width: 36px;
            height: 36px;
          }

          .user-name-dropdown {
            font-size: 0.9rem;
          }

          .user-email {
            font-size: 0.75rem;
          }

          .dropdown-item {
            padding: 0.6rem 1rem;
            font-size: 0.85rem;
          }
          
          .footer-bottom-links {
            justify-content: center;
            margin-top: 1rem;
          }
          
          .text-md-end {
            text-align: center;
          }
        }

        @media (max-width: 576px) {
          .btn-notification {
            padding: 0.3rem;
            overflow: visible;
          }

          .btn-user-profile {
            padding: 0.4rem 0.6rem;
          }

          .user-avatar {
            width: 28px;
            height: 28px;
          }

          .dropdown-menu {
            min-width: 220px;
            right: -30px;
          }

          .notification-badge {
            font-size: 0.65rem;
            min-width: 16px;
            height: 16px;
            top: -5px;
            right: -5px;
            z-index: 10;
          }
        }

        @media (min-width: 769px) {
          .mobile-sidebar,
          .overlay {
            display: none !important;
          }
        }
      `}</style>

      <div className="main-website">
        {/* Navigation Bar */}
        <Navbar 
          isAuthenticated={isAuthenticated}
          user={user}
          notifications={notifications}
          onLogout={handleLogout}
        />

        {/* Mobile Sidebar */}
        <div className={`mobile-sidebar ${show ? 'show' : ''}`}>
          <button className="sidebar-close" onClick={handleClose}>
            <X size={24} />
          </button>
          
          <h4 style={{color: 'white', marginBottom: '2rem'}}>
            <span style={{color: '#df2528'}}>FIT</span>FINDER
          </h4>
          
          <nav>
            {[
              { path: '/', label: 'หน้าแรก' },
              { path: '/search', label: 'ค้นหาเทรนเนอร์' },
              { path: '/events', label: 'อีเว้นท์' },
              { path: '/gyms', label: 'ยิม & ฟิตเนส' },
              { path: '/articles', label: 'บทความ' },
              { path: '/contact', label: 'ติดต่อเรา' }
            ].map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="nav-link"
                onClick={handleClose}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <hr style={{borderColor: 'rgba(255,255,255,0.3)', margin: '2rem 0'}} />

          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {!isAuthenticated ? (
              <>
                <Link 
                  to="/signin" 
                  className="btn btn-outline-light" 
                  onClick={handleClose}
                  style={{textAlign: 'center'}}
                >
                  เข้าสู่ระบบ
                </Link>
                <Link 
                  to="/signup" 
                  className="btn btn-primary" 
                  onClick={handleClose}
                  style={{textAlign: 'center'}}
                >
                  สมัครสมาชิก
                </Link>
              </>
            ) : (
              <button 
                className="btn btn-outline-light" 
                onClick={() => {
                  handleLogout();
                  handleClose();
                }}
                style={{textAlign: 'center'}}
              >
                ออกจากระบบ
              </button>
            )}
          </div>
        </div>

        {/* Overlay */}
        <div className={`overlay ${show ? 'show' : ''}`} onClick={handleClose}></div>

        {/* Main Content */}
        <main className="main-content" style={{ paddingTop: '80px', paddingLeft: '0px', paddingRight:'0px', paddingBottom: '0px', marginLeft:'0px', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
          <Outlet />
        </main>

        {/* Footer */}
        <Footer onNewsletterSubscribe={handleNewsletterSubscribe} />

        {/* Back to Top Button */}
        <button
          className={`back-to-top ${scrolled ? 'show' : ''}`}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp size={20} />
        </button>
      </div>
    </>
  );
};

export default MainWebsite;