import React, { useState, useEffect } from 'react';
import logo from '../../assets/images/logo.png';
import { Link, useNavigate } from 'react-router-dom';

const SignInPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alerts, setAlerts] = useState({
    success: { show: false, message: '' },
    error: { show: false, message: '' }
  });
  const [roleNotification, setRoleNotification] = useState({
    show: false,
    message: ''
  });
  const [formErrors, setFormErrors] = useState({
    email: { show: false, message: '' },
    password: { show: false, message: '' }
  });

  // ✅ แก้ไข API Configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // ✅ แก้ไข API call helper function
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        },
        ...options
      });

      // ตรวจสอบ Content-Type ก่อน parse JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // ✅ แก้ไข Mock user database - เพิ่มข้อมูลจากฐานข้อมูล
  const mockUsers = [
    // Admin จากฐานข้อมูล schema.sql
    { email: 'admin@fitnessplatform.com', password: 'admin123', role: 'admin', name: 'Admin User', id: 1 },
    
    // ข้อมูลจาก seeds.sql
    { email: 'customer1@test.com', password: 'admin123', role: 'customer', name: 'สมชาย ใจดี', id: 2 },
    { email: 'customer2@test.com', password: 'admin123', role: 'customer', name: 'สมหญิง ใจงาม', id: 3 },
    { email: 'customer3@test.com', password: 'admin123', role: 'customer', name: 'มานะ พยายาม', id: 4 },
    { email: 'trainer1@test.com', password: 'admin123', role: 'trainer', name: 'จอห์น ฟิตเนส', id: 5 },
    { email: 'trainer2@test.com', password: 'admin123', role: 'trainer', name: 'ซาร่า แข็งแรง', id: 6 },
    { email: 'trainer3@test.com', password: 'admin123', role: 'trainer', name: 'ไมค์ มัสเซิล', id: 7 },
    
    // บัญชีทดสอบเดิม
    { email: 'customer@test.com', password: '12345678', role: 'customer', name: 'ลูกค้าทดสอบ', id: 8 },
    { email: 'trainer@test.com', password: '12345678', role: 'trainer', name: 'เทรนเนอร์ทดสอบ', id: 9 },
    { email: 'admin@test.com', password: '12345678', role: 'admin', name: 'ผู้ดูแลระบบ', id: 10 }
  ];

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear errors when user starts typing
    if (formErrors[name]?.show) {
      setFormErrors(prev => ({
        ...prev,
        [name]: { show: false, message: '' }
      }));
    }
  };

  // Toggle password visibility
  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      email: { show: false, message: '' },
      password: { show: false, message: '' }
    };

    if (!formData.email.trim()) {
      newErrors.email = { show: true, message: 'กรุณากรอกอีเมลหรือชื่อผู้ใช้' };
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = { show: true, message: 'รูปแบบอีเมลไม่ถูกต้อง' };
      isValid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = { show: true, message: 'กรุณากรอกรหัสผ่าน' };
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  // ✅ แก้ไข Authenticate user with API
  const authenticateUser = async (email, password) => {
    try {
      // พยายามเชื่อมต่อ API จริงก่อน
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      });

      return {
        success: true,
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken
      };
    } catch (error) {
      console.error('API Authentication failed:', error);
      console.log('🔄 Falling back to mock authentication...');
      
      // Fallback ไปใช้ mock data
      return authenticateUserMock(email, password);
    }
  };

  // ✅ แก้ไข Mock authentication พร้อม debugging
  const authenticateUserMock = (email, password) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('🔍 Mock Authentication Debug:');
        console.log('📧 Input email:', email);
        console.log('🔑 Input password:', password);
        console.log('👥 Available users:', mockUsers.map(u => ({ 
          email: u.email, 
          password: u.password, 
          role: u.role,
          name: u.name 
        })));
        
        // ตรวจสอบอีเมลและรหัสผ่านตรงกัน
        const user = mockUsers.find(u => 
          u.email === email.trim() && u.password === password
        );
        
        console.log('✅ Found user:', user);
        
        if (user) {
          const result = { 
            success: true, 
            user: user,
            token: `mock_token_${user.id}_${Date.now()}`,
            refreshToken: `mock_refresh_${user.id}_${Date.now()}`
          };
          console.log('🎉 Authentication successful:', result);
          resolve(result);
        } else {
          const errorResult = { success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
          console.log('❌ Authentication failed:', errorResult);
          resolve(errorResult);
        }
      }, 1000);
    });
  };

  // ✅ แก้ไข Database Authentication Function (ใหม่)
  const authenticateWithDatabase = async (email, password) => {
    try {
      const response = await fetch('http://localhost/fitness-trainer-platform/backend/api/auth/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            name: `${data.user.first_name} ${data.user.last_name}`,
            role: data.user.role
          },
          token: data.token,
          refreshToken: data.refreshToken
        };
      } else {
        return {
          success: false,
          message: data.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
        };
      }
    } catch (error) {
      console.error('Database authentication failed:', error);
      throw error;
    }
  };

  // Social login with API
  const authenticateSocialLogin = async (provider, accessToken) => {
    try {
      const response = await apiCall('/auth/social-login', {
        method: 'POST',
        body: JSON.stringify({
          provider: provider,
          accessToken: accessToken
        })
      });

      return {
        success: true,
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken
      };
    } catch (error) {
      console.error('Social authentication failed:', error);
      
      // Fallback to mock social login
      const demoUser = {
        id: Date.now(),
        role: 'customer',
        name: `ผู้ใช้ ${provider === 'google' ? 'Google' : 'Facebook'}`,
        email: `demo@${provider}.com`
      };
      
      return {
        success: true,
        user: demoUser,
        token: `mock_social_token_${demoUser.id}`,
        refreshToken: `mock_social_refresh_${demoUser.id}`
      };
    }
  };

  // Store user session
  const storeUserSession = (userData, token, refreshToken, rememberMe) => {
    const sessionData = {
      user: userData,
      token: token,
      refreshToken: refreshToken,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    if (rememberMe) {
      localStorage.setItem('fitconnect_session', JSON.stringify(sessionData));
    } else {
      sessionStorage.setItem('fitconnect_session', JSON.stringify(sessionData));
    }

    // Store token separately for API calls
    localStorage.setItem('fitconnect_token', token);
    
    // Store user data for easy access
    const userInfo = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      name: userData.name
    };
    
    if (rememberMe) {
      localStorage.setItem('fitconnect_user', JSON.stringify(userInfo));
    } else {
      sessionStorage.setItem('fitconnect_user', JSON.stringify(userInfo));
    }
  };

  // Clear user session
  const clearUserSession = () => {
    localStorage.removeItem('fitconnect_session');
    localStorage.removeItem('fitconnect_token');
    localStorage.removeItem('fitconnect_user');
    sessionStorage.removeItem('fitconnect_session');
    sessionStorage.removeItem('fitconnect_user');
  };

  // Refresh token
  const refreshAuthToken = async () => {
    try {
      const session = JSON.parse(
        localStorage.getItem('fitconnect_session') || 
        sessionStorage.getItem('fitconnect_session')
      );

      if (!session || !session.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiCall('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: session.refreshToken
        })
      });

      // Update stored tokens
      session.token = response.token;
      session.refreshToken = response.refreshToken;
      session.timestamp = Date.now();
      session.expiresAt = Date.now() + (24 * 60 * 60 * 1000);

      const storageType = localStorage.getItem('fitconnect_session') ? 'localStorage' : 'sessionStorage';
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
      
      storage.setItem('fitconnect_session', JSON.stringify(session));
      localStorage.setItem('fitconnect_token', response.token);

      return response.token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearUserSession();
      throw error;
    }
  };

  // Check session validity
  const isSessionValid = (session) => {
    if (!session || !session.timestamp || !session.expiresAt) {
      return false;
    }

    const now = Date.now();
    const isExpired = now > session.expiresAt;
    
    if (isExpired) {
      return false;
    }

    // Check if token needs refresh (refresh 1 hour before expiry)
    const oneHour = 60 * 60 * 1000;
    const shouldRefresh = now > (session.expiresAt - oneHour);
    
    if (shouldRefresh && session.refreshToken) {
      // Attempt to refresh token
      refreshAuthToken().catch(() => {
        console.log('Token refresh failed, session will expire soon');
      });
    }

    return true;
  };

  // Show alerts
  const showAlert = (type, message) => {
    setAlerts(prev => ({
      ...prev,
      [type]: { show: true, message },
      [type === 'success' ? 'error' : 'success']: { show: false, message: '' }
    }));
  };

  // Enhanced redirect function with better error handling
  const redirectUser = (userRole, userName) => {
    console.log('Redirecting user:', { userRole, userName });
    
    let redirectUrl = '';
    let message = '';
    
    // Determine redirect URL based on role
    switch(userRole) {
      case 'customer':
        redirectUrl = '/client';
        message = `<i class="fas fa-user-circle me-1"></i>ตรวจพบบัญชีลูกค้า - ${userName}`;
        break;
      case 'trainer':
        redirectUrl = '/trainer';
        message = `<i class="fas fa-dumbbell me-1"></i>ตรวจพบบัญชีเทรนเนอร์ - ${userName}`;
        break;
      case 'admin':
        redirectUrl = '/admin';
        message = `<i class="fas fa-cog me-1"></i>ตรวจพบบัญชีผู้ดูแลระบบ - ${userName}`;
        break;
      default:
        console.error('Unknown user role:', userRole);
        showAlert('error', 'เกิดข้อผิดพลาดในการระบุประเภทผู้ใช้');
        return;
    }

    // Show role notification
    setRoleNotification({ show: true, message });
    
    // Attempt navigation with error handling
    const performNavigation = () => {
      try {
        console.log(`Attempting to navigate to: ${redirectUrl}`);
        
        // Method 1: React Router navigate
        navigate(redirectUrl, { replace: true });
        
        // Fallback method: Direct window location change after a short delay
        setTimeout(() => {
          if (window.location.pathname === '/signin') {
            console.log('React Router navigation may have failed, using window.location');
            window.location.href = redirectUrl;
          }
        }, 500);
        
      } catch (error) {
        console.error('Navigation failed:', error);
        
        // Emergency fallback
        try {
          window.location.href = redirectUrl;
        } catch (fallbackError) {
          console.error('All navigation methods failed:', fallbackError);
          showAlert('error', 'เกิดข้อผิดพลาดในการเปลี่ยนหน้า กรุณาลองใหม่อีกครั้ง');
          
          // ให้ผู้ใช้สามารถคลิกไปยังหน้าที่ต้องการได้
          setTimeout(() => {
            const linkElement = document.createElement('a');
            linkElement.href = redirectUrl;
            linkElement.textContent = `คลิกที่นี่เพื่อไปยังหน้า ${userRole}`;
            linkElement.style.cssText = 'color: var(--primary-color); text-decoration: underline; cursor: pointer;';
            
            const alertDiv = document.querySelector('.alert-danger');
            if (alertDiv) {
              alertDiv.appendChild(document.createElement('br'));
              alertDiv.appendChild(linkElement);
            }
          }, 1000);
        }
      }
    };

    // Perform navigation after showing notification
    setTimeout(performNavigation, 1000);
  };

  // ✅ แก้ไข Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsLoading(true);
      setAlerts({
        success: { show: false, message: '' },
        error: { show: false, message: '' }
      });
      
      try {
        console.log('🚀 Starting authentication process...');
        
        // ลำดับการตรวจสอบ: Database -> API -> Mock
        let result = null;
        
        // 1. พยายามเชื่อมต่อฐานข้อมูลก่อน
        try {
          console.log('1️⃣ Trying database authentication...');
          result = await authenticateWithDatabase(formData.email, formData.password);
        } catch (dbError) {
          console.log('❌ Database authentication failed:', dbError);
          
          // 2. ถ้าฐานข้อมูลไม่ได้ ใช้ API
          try {
            console.log('2️⃣ Trying API authentication...');
            result = await authenticateUser(formData.email, formData.password);
          } catch (apiError) {
            console.log('❌ API authentication failed:', apiError);
            
            // 3. สุดท้าย fallback ไป mock
            console.log('3️⃣ Using mock authentication...');
            result = await authenticateUserMock(formData.email, formData.password);
          }
        }
        
        setIsLoading(false);
        
        if (result.success) {
          // Store user session
          storeUserSession(result.user, result.token, result.refreshToken, formData.rememberMe);
          
          showAlert('success', `ยินดีต้อนรับ ${result.user.name}! กำลังเข้าสู่ระบบ...`);
          
          // Log for debugging
          console.log('✅ Authentication successful:', result.user);
          
          // Redirect user
          redirectUser(result.user.role, result.user.name);
          
        } else {
          showAlert('error', result.message);
        }
      } catch (error) {
        setIsLoading(false);
        console.error('Login error:', error);
        showAlert('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  // Social login
  const socialLogin = async (provider) => {
    setIsLoading(true);
    showAlert('success', `กำลังเชื่อมต่อกับ ${provider === 'google' ? 'Google' : 'Facebook'}...`);
    
    try {
      // In a real implementation, you would integrate with Google/Facebook SDK
      // For demo purposes, we'll simulate the flow
      
      let accessToken = null;
      
      if (provider === 'google') {
        // Simulate Google OAuth flow
        // In real app: use google-auth-library or firebase auth
        accessToken = 'mock_google_token';
      } else if (provider === 'facebook') {
        // Simulate Facebook OAuth flow  
        // In real app: use facebook-js-sdk
        accessToken = 'mock_facebook_token';
      }
      
      const result = await authenticateSocialLogin(provider, accessToken);
      
      setIsLoading(false);
      
      if (result.success) {
        // Store user session
        storeUserSession(result.user, result.token, result.refreshToken, false);
        
        showAlert('success', `เข้าสู่ระบบด้วย ${provider === 'google' ? 'Google' : 'Facebook'} สำเร็จ!`);
        redirectUser(result.user.role, result.user.name);
      } else {
        showAlert('error', result.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบผ่าน Social Media');
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Social login error:', error);
      showAlert('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ Social Media');
    }
  };

  // Forgot password
  const showForgotPassword = () => {
    navigate('/forgotpasswordpage');
  };

  // Logout function (can be called from anywhere in the app)
  const logout = async () => {
    try {
      const session = JSON.parse(
        localStorage.getItem('fitconnect_session') || 
        sessionStorage.getItem('fitconnect_session')
      );

      if (session && session.token) {
        // Call logout API
        await apiCall('/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API fails
    } finally {
      clearUserSession();
      navigate('/signin');
    }
  };

  // Check for existing session on component mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const existingSession = 
          localStorage.getItem('fitconnect_session') || 
          sessionStorage.getItem('fitconnect_session');
          
        if (existingSession) {
          const sessionData = JSON.parse(existingSession);
          
          if (isSessionValid(sessionData)) {
            showAlert('success', `ยินดีต้อนรับกลับ ${sessionData.user.name}!`);
            setTimeout(() => {
              redirectUser(sessionData.user.role, sessionData.user.name);
            }, 500);
            return;
          } else {
            // Session expired, clear it
            clearUserSession();
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
        clearUserSession();
      }
    };

    checkExistingSession();

    // ✅ แก้ไข Log demo accounts
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Demo Accounts Available:');
      console.log('📧 Admin: admin@fitnessplatform.com / admin123');
      console.log('📧 Customer 1: customer1@test.com / admin123');
      console.log('📧 Customer 2: customer2@test.com / admin123');
      console.log('📧 Trainer 1: trainer1@test.com / admin123');
      console.log('📧 Trainer 2: trainer2@test.com / admin123');
      console.log('📧 Legacy - Customer: customer@test.com / 12345678');
      console.log('📧 Legacy - Trainer: trainer@test.com / 12345678'); 
      console.log('📧 Legacy - Admin: admin@test.com / 12345678');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-logout on token expiry
  useEffect(() => {
    const checkTokenExpiry = () => {
      const session = JSON.parse(
        localStorage.getItem('fitconnect_session') || 
        sessionStorage.getItem('fitconnect_session')
      );

      if (session && !isSessionValid(session)) {
        showAlert('error', 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        clearUserSession();
      }
    };

    // Check token expiry every 5 minutes
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []) ;

  return (
    <>
      <style jsx>{`
        /* Google Fonts Import */
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');

        :root {
          --primary-color: #232956;
          --accent-color: #df2528;
          --light-bg: #f8f9fa;
          --dark-text: #2c3e50;
          --border-color: #e9ecef;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Kanit', sans-serif;
          background: #e9ecef;
          min-height: 100vh;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .signin-wrapper {
          font-family: 'Kanit', sans-serif;
          background: #e9ecef;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .signin-wrapper::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grid)"/></svg>');
          pointer-events: none;
        }

        .auth-container {
          width: 100%;
          max-width: 420px;
          margin: 20px;
          position: relative;
          z-index: 1;
        }

        .auth-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 40px 30px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
          animation: slideInUp 0.6s ease;
        }

        .auth-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
        }

        .logo-section {
          text-align: center;
          margin-bottom: 30px;
        }

        .logo {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--primary-color);
          text-decoration: none;
          display: inline-block;
          margin-bottom: 10px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .logo:hover {
          color: var(--accent-color);
          transform: scale(1.05);
        }

        .logo-text {
          color: #6c757d;
          font-size: 1rem;
          font-weight: 400;
        }

        .page-title {
          text-align: center;
          color: var(--primary-color);
          font-weight: 600;
          font-size: 1.8rem;
          margin-bottom: 30px;
        }

        .welcome-text {
          text-align: center;
          color: #6c757d;
          margin-bottom: 30px;
          line-height: 1.5;
        }

        .form-group {
          margin-bottom: 20px;
          position: relative;
        }

        .form-label {
          color: var(--dark-text);
          font-weight: 500;
          margin-bottom: 8px;
          display: block;
        }

        .form-control {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid var(--border-color);
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: white;
          font-family: inherit;
        }

        .form-control:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(35, 41, 86, 0.1);
        }

        .form-control.error {
          border-color: var(--accent-color);
        }

        .input-group {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          font-size: 1.1rem;
          z-index: 2;
        }

        .form-control.with-icon {
          padding-left: 45px;
        }

        .input-group-text {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6c757d;
          cursor: pointer;
          z-index: 2;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .form-check {
          display: flex;
          align-items: center;
        }

        .form-check-input {
          margin-right: 8px;
          margin-top: 0;
        }

        .form-check-label {
          color: var(--dark-text);
          font-size: 0.9rem;
          cursor: pointer;
        }

        .forgot-password {
          color: var(--primary-color);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.3s ease;
          cursor: pointer;
        }

        .forgot-password:hover {
          color: var(--accent-color);
          text-decoration: underline;
        }

        .bbtn-primary {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, var(--primary-color), #1a1f3a);
          border: none;
          border-radius: 10px;
          color: white;
          font-weight: 600;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          margin-bottom: 25px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }

        .bbtn-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s ease;
        }

        .bbtn-primary:hover::before {
          left: 100%;
        }

        .bbtn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(35, 41, 86, 0.3);
        }

        .bbtn-primary.loading {
          pointer-events: none;
          opacity: 0.8;
        }

        .bbtn-primary.loading::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          animation: spin 1s linear infinite;
        }

        .social-login {
          margin-bottom: 25px;
        }

        .social-title {
          text-align: center;
          color: #6c757d;
          font-size: 0.9rem;
          margin-bottom: 15px;
          position: relative;
        }

        .social-title::before,
        .social-title::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 30%;
          height: 1px;
          background: var(--border-color);
        }

        .social-title::before {
          left: 0;
        }

        .social-title::after {
          right: 0;
        }

        .social-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .btn-social {
          padding: 10px;
          border: 2px solid var(--border-color);
          border-radius: 10px;
          background: white;
          color: var(--dark-text);
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .btn-social:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
          text-decoration: none;
          transform: translateY(-2px);
        }

        .btn-social.google:hover {
          background: #4285f4;
          color: white;
          border-color: #4285f4;
        }

        .btn-social.facebook:hover {
          background: #1877f2;
          color: white;
          border-color: #1877f2;
        }

        .btn-social:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .auth-footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
        }

        .auth-footer p {
          color: #6c757d;
          margin-bottom: 10px;
        }

        .auth-footer a {
          color: var(--primary-color);
          text-decoration: none;
          font-weight: 500;
          cursor: pointer;
        }

        .auth-footer a:hover {
          color: var(--accent-color);
          text-decoration: underline;
        }

        .form-error {
          color: var(--accent-color);
          font-size: 0.85rem;
          margin-top: 5px;
        }

        .alert {
          border-radius: 10px;
          border: none;
          margin-bottom: 20px;
          padding: 12px 15px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .alert-success {
          background: #d4edda;
          color: #155724;
        }

        .alert-danger {
          background: #f8d7da;
          color: #721c24;
        }

        .role-notification {
          background: linear-gradient(135deg, rgba(35, 41, 86, 0.1), rgba(223, 37, 40, 0.1));
          border: 1px solid rgba(35, 41, 86, 0.2);
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 20px;
          text-align: center;
          color: var(--primary-color);
          font-size: 0.9rem;
        }

        .role-notification i {
          color: var(--accent-color);
          margin-right: 8px;
        }

        .floating-shapes {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }

        .shape {
          position: absolute;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }

        .shape:nth-child(1) {
          width: 60px;
          height: 60px;
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        }

        .shape:nth-child(2) {
          width: 40px;
          height: 40px;
          top: 60%;
          right: 15%;
          animation-delay: 2s;
        }

        .shape:nth-child(3) {
          width: 30px;
          height: 30px;
          bottom: 20%;
          left: 15%;
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }

        @keyframes slideInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Mobile Responsive */
        @media (max-width: 576px) {
          .auth-container {
            margin: 10px;
          }

          .auth-card {
            padding: 30px 20px;
            border-radius: 15px;
          }

          .logo {
            font-size: 2rem;
          }

          .page-title {
            font-size: 1.5rem;
          }

          .social-buttons {
            grid-template-columns: 1fr;
          }

          .form-options {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="signin-wrapper">
        <div className="floating-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>

        <div className="auth-container">
          <div className="auth-card">
            <div className="logo-section">
              <Link to="/">
                <img src={logo} className="App-logo" alt="logo" style={{ height: "60px" }} />
              </Link>
              <p className="logo-text">เชื่อมต่อคุณกับเทรนเนอร์ที่เหมาะสม</p>
            </div>

            <h1 className="page-title">เข้าสู่ระบบ</h1>
            <p className="welcome-text">ยินดีต้อนรับกลับ! กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>

            {/* Role Detection Notification */}
            {roleNotification.show && (
              <div className="role-notification">
                <span dangerouslySetInnerHTML={{ __html: roleNotification.message || '<i class="fas fa-info-circle"></i>ระบบจะตรวจสอบประเภทบัญชีของคุณอัตโนมัติ' }}></span>
              </div>
            )}

            {/* Alerts */}
            {alerts.success.show && (
              <div className="alert alert-success">
                <i className="fas fa-check-circle"></i>
                <span>{alerts.success.message}</span>
              </div>
            )}

            {alerts.error.show && (
              <div className="alert alert-danger">
                <i className="fas fa-exclamation-circle"></i>
                <span>{alerts.error.message}</span>
              </div>
            )}

            <div>
              {/* Email/Username */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">อีเมลหรือชื่อผู้ใช้ *</label>
                <div className="input-group">
                  <i className="fas fa-envelope input-icon"></i>
                  <input
                    type="text"
                    className={`form-control with-icon ${formErrors.email.show ? 'error' : ''}`}
                    id="email"
                    name="email"
                    placeholder="กรอกอีเมลหรือชื่อผู้ใช้"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                {formErrors.email.show && (
                  <div className="form-error">{formErrors.email.message}</div>
                )}
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">รหัสผ่าน *</label>
                <div className="input-group">
                  <i className="fas fa-lock input-icon"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control with-icon ${formErrors.password.show ? 'error' : ''}`}
                    id="password"
                    name="password"
                    placeholder="กรอกรหัสผ่าน"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                  />
                  <span className="input-group-text" onClick={togglePassword}>
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </span>
                </div>
                {formErrors.password.show && (
                  <div className="form-error">{formErrors.password.message}</div>
                )}
              </div>

              {/* Form Options */}
              <div className="form-options">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <label className="form-check-label" htmlFor="rememberMe">
                    จดจำการเข้าสู่ระบบ
                  </label>
                </div>
                <span className="forgot-password" onClick={showForgotPassword}>
                  ลืมรหัสผ่าน?
                </span>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className={`bbtn-primary ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </div>

            {/* Social Login */}
            <div className="social-login">
              <div className="social-title">หรือเข้าสู่ระบบด้วย</div>
              <div className="social-buttons">
                <div 
                  className="btn-social google" 
                  onClick={() => socialLogin('google')}
                  style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                >
                  <i className="fab fa-google"></i>
                  Google
                </div>
                <div 
                  className="btn-social facebook" 
                  onClick={() => socialLogin('facebook')}
                  style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                >
                  <i className="fab fa-facebook-f"></i>
                  Facebook
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="auth-footer">
              <p>ยังไม่มีบัญชี? <span onClick={() => navigate('/signup')} style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: '500' }}>สมัครสมาชิก</span></p>
              <p><span onClick={() => navigate('/')} style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: '500' }}>กลับสู่หน้าแรก</span></p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignInPage;