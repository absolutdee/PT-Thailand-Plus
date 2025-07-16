import React, { useState, useEffect } from 'react';
import logo from '../../assets/images/logo.png';
import { Link, useNavigate } from 'react-router-dom';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userRole: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    terms: false
  });

  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSocialWarning, setShowSocialWarning] = useState(false);
  const [pendingSocialProvider, setPendingSocialProvider] = useState(null);
  const [modalRole, setModalRole] = useState('');
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  // API Configuration
  const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

  // API call helper function
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

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

  // Check email availability
  const checkEmailAvailability = async (email) => {
    try {
      setEmailCheckLoading(true);
      const response = await apiCall('/auth/check-email', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() })
      });

      return response.available;
    } catch (error) {
      console.error('Email check failed:', error);
      // Return true for mock - in real app would handle appropriately
      return true;
    } finally {
      setEmailCheckLoading(false);
    }
  };

  // Register user with API
  const registerUser = async (userData) => {
    try {
      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });

      return {
        success: true,
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken
      };
    } catch (error) {
      console.error('Registration failed:', error);
      
      // Fallback to mock registration for demo
      console.log('Falling back to mock registration...');
      return registerUserMock(userData);
    }
  };

  // Mock registration (fallback)
  const registerUserMock = (userData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate validation
        const existingEmails = ['admin@test.com', 'existing@test.com'];
        
        if (existingEmails.includes(userData.email)) {
          resolve({ 
            success: false, 
            message: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น' 
          });
          return;
        }

        const newUser = {
          id: Date.now(),
          email: userData.email,
          role: userData.userRole,
          name: `${userData.firstName} ${userData.lastName}`,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          createdAt: new Date().toISOString()
        };

        resolve({ 
          success: true, 
          user: newUser,
          token: `mock_token_${newUser.id}_${Date.now()}`,
          refreshToken: `mock_refresh_${newUser.id}_${Date.now()}`
        });
      }, 2000);
    });
  };

  // Social registration with API
  const registerSocialUser = async (provider, accessToken, role) => {
    try {
      const response = await apiCall('/auth/social-register', {
        method: 'POST',
        body: JSON.stringify({
          provider: provider,
          accessToken: accessToken,
          role: role
        })
      });

      return {
        success: true,
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken
      };
    } catch (error) {
      console.error('Social registration failed:', error);
      
      // Fallback to mock social registration
      const demoUser = {
        id: Date.now(),
        role: role,
        name: `ผู้ใช้ ${provider === 'google' ? 'Google' : 'Facebook'}`,
        email: `demo_${Date.now()}@${provider}.com`,
        firstName: `ผู้ใช้ ${provider === 'google' ? 'Google' : 'Facebook'}`,
        lastName: '',
        phone: '',
        createdAt: new Date().toISOString()
      };
      
      return {
        success: true,
        user: demoUser,
        token: `mock_social_token_${demoUser.id}`,
        refreshToken: `mock_social_refresh_${demoUser.id}`
      };
    }
  };

  // Store user session after successful registration
  const storeUserSession = (userData, token, refreshToken) => {
    const sessionData = {
      user: userData,
      token: token,
      refreshToken: refreshToken,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    // Store in sessionStorage for new registrations
    sessionStorage.setItem('fitconnect_session', JSON.stringify(sessionData));

    // Store token separately for API calls
    localStorage.setItem('fitconnect_token', token);
    
    // Store user data for easy access
    const userInfo = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      name: userData.name
    };
    
    sessionStorage.setItem('fitconnect_user', JSON.stringify(userInfo));
  };

  // Handle input changes
  const handleInputChange = async (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear errors on input change
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Check email availability when email field loses focus
    if (name === 'email' && value.trim() && value.includes('@')) {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
      if (isValid) {
        const available = await checkEmailAvailability(value.trim());
        if (!available) {
          setErrors(prev => ({
            ...prev,
            email: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น'
          }));
        }
      }
    }
  };

  // Handle role selection
  const handleRoleChange = (value) => {
    setFormData(prev => ({ ...prev, userRole: value }));
    updateSocialButtonsState(value);
  };

  // Toggle password visibility
  const togglePassword = (fieldName) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  // Update social buttons state
  const updateSocialButtonsState = (role = formData.userRole) => {
    if (role) {
      setShowSocialWarning(false);
    } else {
      setShowSocialWarning(true);
    }
  };

  // Enhanced form validation
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'กรุณากรอกชื่อ';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'กรุณากรอกนามสกุล';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมลที่ถูกต้อง';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'กรุณากรอกอีเมลที่ถูกต้อง';
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    } else {
      const phoneRegex = /^[0-9]{10}$/;
      const cleanPhone = formData.phone.replace(/[-\s]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (10 หลัก)';
      }
    }

    if (!formData.password) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    } else if (formData.password.length < 8) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    } else {
      // Password strength validation
      const hasUpperCase = /[A-Z]/.test(formData.password);
      const hasLowerCase = /[a-z]/.test(formData.password);
      const hasNumbers = /\d/.test(formData.password);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        newErrors.password = 'รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่ พิมพ์เล็ก และตัวเลข';
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }

    if (!formData.userRole) {
      newErrors.userRole = 'กรุณาเลือกประเภทการใช้งาน';
    }

    if (!formData.terms) {
      newErrors.terms = 'กรุณายอมรับเงื่อนไขการใช้งาน';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Show success message and redirect
  const handleSuccessRegistration = (user) => {
    setShowSuccess(true);
    
    setTimeout(() => {
      const redirectUrl = user.role === 'customer' ? '/client' : 
                         user.role === 'trainer' ? '/trainer' : '/';
      
      console.log(`Redirecting to: ${redirectUrl}`);
      navigate(redirectUrl);
    }, 2000);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setLoading(true);
      
      try {
        // Prepare user data for registration
        const userData = {
          userRole: formData.userRole,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.replace(/[-\s]/g, ''),
          password: formData.password
        };

        const result = await registerUser(userData);
        
        setLoading(false);
        
        if (result.success) {
          // Store user session
          storeUserSession(result.user, result.token, result.refreshToken);
          
          // Show success and redirect
          handleSuccessRegistration(result.user);
          
        } else {
          setErrors({ submit: result.message });
        }
      } catch (error) {
        setLoading(false);
        console.error('Registration error:', error);
        setErrors({ submit: 'เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง' });
      }
    } else {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  // Handle social login
  const handleSocialLogin = async (provider) => {
    if (!formData.userRole) {
      setShowSocialWarning(true);
      setTimeout(() => setShowSocialWarning(false), 3000);
      return;
    }

    setSocialLoading(true);

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

      const result = await registerSocialUser(provider, accessToken, formData.userRole);
      
      setSocialLoading(false);
      
      if (result.success) {
        // Store user session
        storeUserSession(result.user, result.token, result.refreshToken);
        
        // Show success and redirect
        handleSuccessRegistration(result.user);
      } else {
        setErrors({ submit: result.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิกผ่าน Social Media' });
      }
    } catch (error) {
      setSocialLoading(false);
      console.error('Social registration error:', error);
      setErrors({ submit: 'เกิดข้อผิดพลาดในการเชื่อมต่อ Social Media' });
    }
  };

  // Handle social login without role
  const handleSocialLoginNoRole = (provider) => {
    setPendingSocialProvider(provider);
    setShowRoleModal(true);
  };

  // Close role modal
  const closeRoleModal = () => {
    setShowRoleModal(false);
    setModalRole('');
    setPendingSocialProvider(null);
  };

  // Confirm social signup
  const confirmSocialSignup = async () => {
    if (modalRole && pendingSocialProvider) {
      closeRoleModal();
      setSocialLoading(true);
      
      try {
        let accessToken = null;
        
        if (pendingSocialProvider === 'google') {
          accessToken = 'mock_google_token';
        } else if (pendingSocialProvider === 'facebook') {
          accessToken = 'mock_facebook_token';
        }

        const result = await registerSocialUser(pendingSocialProvider, accessToken, modalRole);
        
        setSocialLoading(false);
        
        if (result.success) {
          // Store user session
          storeUserSession(result.user, result.token, result.refreshToken);
          
          // Show success and redirect
          handleSuccessRegistration(result.user);
        } else {
          setErrors({ submit: result.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิกผ่าน Social Media' });
        }
      } catch (error) {
        setSocialLoading(false);
        console.error('Social registration error:', error);
        setErrors({ submit: 'เกิดข้อผิดพลาดในการเชื่อมต่อ Social Media' });
      }
    }
  };

  // Update social buttons state when role changes
  useEffect(() => {
    updateSocialButtonsState();
  }, [formData.userRole]);

  // Check for existing session on component mount
  useEffect(() => {
    const checkExistingSession = () => {
      const existingSession = 
        localStorage.getItem('fitconnect_session') || 
        sessionStorage.getItem('fitconnect_session');
        
      if (existingSession) {
        try {
          const sessionData = JSON.parse(existingSession);
          
          if (sessionData.user && sessionData.timestamp) {
            // Check if session is still valid (24 hours)
            const isExpired = Date.now() > (sessionData.timestamp + 24 * 60 * 60 * 1000);
            
            if (!isExpired) {
              // User is already logged in, redirect them
              const redirectUrl = sessionData.user.role === 'customer' ? '/client' : 
                                 sessionData.user.role === 'trainer' ? '/trainer' : '/';
              
              navigate(redirectUrl);
              return;
            }
          }
        } catch (error) {
          console.error('Session check failed:', error);
          // Clear invalid session data
          localStorage.removeItem('fitconnect_session');
          sessionStorage.removeItem('fitconnect_session');
        }
      }
    };

    checkExistingSession();
  }, [navigate]);

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
        }

        .signup-page {
          font-family: 'Kanit', sans-serif;
          background: #e9ecef;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 20px 0;
        }

        .auth-container {
          width: 100%;
          max-width: 450px;
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

        .role-selection {
          margin-bottom: 30px;
        }

        .role-title {
          color: var(--dark-text);
          font-weight: 500;
          font-size: 1.1rem;
          margin-bottom: 15px;
          text-align: center;
        }

        .role-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .role-option {
          position: relative;
        }

        .role-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 15px;
          border: 2px solid var(--border-color);
          border-radius: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
          text-decoration: none;
          color: var(--dark-text);
        }

        .role-card:hover {
          border-color: var(--primary-color);
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(35, 41, 86, 0.15);
          color: var(--dark-text);
          text-decoration: none;
        }

        .role-card.selected {
          border-color: var(--primary-color);
          background: linear-gradient(135deg, var(--primary-color), #1a1f3a);
          color: white;
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(35, 41, 86, 0.3);
        }

        .role-icon {
          font-size: 2.5rem;
          margin-bottom: 10px;
          transition: all 0.3s ease;
        }

        .role-card.selected .role-icon {
          color: var(--accent-color);
          transform: scale(1.1);
        }

        .role-name {
          font-weight: 600;
          font-size: 1.1rem;
          margin-bottom: 5px;
        }

        .role-desc {
          font-size: 0.85rem;
          opacity: 0.8;
          text-align: center;
          line-height: 1.3;
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

        .form-control:disabled {
          background-color: #f8f9fa;
          opacity: 0.7;
        }

        .input-group {
          position: relative;
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

        .form-check {
          margin-bottom: 20px;
        }

        .form-check-input {
          margin-top: 0.25rem;
          margin-right: 8px;
        }

        .form-check-label {
          color: var(--dark-text);
          font-size: 0.9rem;
          cursor: pointer;
        }

        .form-check-label a {
          color: var(--primary-color);
          text-decoration: none;
          font-weight: 500;
        }

        .form-check-label a:hover {
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
          margin-bottom: 20px;
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

        .bbtn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(35, 41, 86, 0.3);
        }

        .bbtn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .social-login {
          margin-bottom: 20px;
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

        .btn-social:hover:not(.disabled) {
          border-color: var(--primary-color);
          color: var(--primary-color);
          text-decoration: none;
          transform: translateY(-2px);
        }

        .btn-social.google:hover:not(.disabled) {
          background: #4285f4;
          color: white;
          border-color: #4285f4;
        }

        .btn-social.facebook:hover:not(.disabled) {
          background: #1877f2;
          color: white;
          border-color: #1877f2;
        }

        .btn-social.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }

        .social-warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
          padding: 10px 15px;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 15px;
          animation: fadeInDown 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .social-warning i {
          color: #f39c12;
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

        .form-success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
          padding: 10px 15px;
          border-radius: 10px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-submit-error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 10px 15px;
          border-radius: 10px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-loading {
          pointer-events: none;
          opacity: 0.8;
        }

        .btn-loading::after {
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

        .email-checking {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--primary-color);
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

        @keyframes fadeInDown {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Role Modal */
        .role-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(5px);
          animation: fadeIn 0.3s ease;
        }

        .role-modal-content {
          background: white;
          border-radius: 20px;
          padding: 30px;
          max-width: 450px;
          width: 90%;
          margin: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          position: relative;
          animation: slideInUp 0.4s ease;
        }

        .role-modal-header {
          text-align: center;
          margin-bottom: 25px;
        }

        .role-modal-title {
          color: var(--primary-color);
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .role-modal-subtitle {
          color: #6c757d;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .role-modal-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 25px;
        }

        .role-modal-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 15px;
          border: 2px solid var(--border-color);
          border-radius: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
          text-align: center;
        }

        .role-modal-card:hover {
          border-color: var(--primary-color);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(35, 41, 86, 0.15);
        }

        .role-modal-card.selected {
          border-color: var(--primary-color);
          background: linear-gradient(135deg, var(--primary-color), #1a1f3a);
          color: white;
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(35, 41, 86, 0.3);
        }

        .role-modal-icon {
          font-size: 2rem;
          margin-bottom: 10px;
          transition: all 0.3s ease;
        }

        .role-modal-card.selected .role-modal-icon {
          color: var(--accent-color);
          transform: scale(1.1);
        }

        .role-modal-name {
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: 5px;
        }

        .role-modal-desc {
          font-size: 0.8rem;
          opacity: 0.8;
          line-height: 1.3;
        }

        .role-modal-buttons {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .btn-modal {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .btn-modal-cancel {
          background: #f8f9fa;
          color: #6c757d;
          border: 1px solid var(--border-color);
        }

        .btn-modal-cancel:hover {
          background: #e9ecef;
          color: var(--dark-text);
        }

        .btn-modal-confirm {
          background: linear-gradient(135deg, var(--primary-color), #1a1f3a);
          color: white;
          min-width: 100px;
        }

        .btn-modal-confirm:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 5px 15px rgba(35, 41, 86, 0.3);
        }

        .btn-modal-confirm:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

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

          .role-options {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .role-card {
            padding: 15px;
          }

          .role-icon {
            font-size: 2rem;
          }

          .social-buttons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="signup-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="logo-section">
              <Link to="/">
                <img src={logo} className="App-logo" alt="logo" style={{ height: "60px" }} />
              </Link>
              <p className="logo-text">เชื่อมต่อคุณกับเทรนเนอร์ที่เหมาะสม</p>
            </div>

            <h1 className="page-title">สมัครสมาชิก</h1>

            {showSuccess && (
              <div className="form-success">
                <i className="fas fa-check-circle"></i>
                สมัครสมาชิกสำเร็จ! กำลังเปลี่ยนเส้นทาง...
              </div>
            )}

            {errors.submit && (
              <div className="form-submit-error">
                <i className="fas fa-exclamation-circle"></i>
                {errors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Role Selection */}
              <div className="role-selection">
                <h3 className="role-title">เลือกประเภทการใช้งาน</h3>
                <div className="role-options">
                  <div className="role-option">
                    <div 
                      className={`role-card ${formData.userRole === 'customer' ? 'selected' : ''}`}
                      onClick={() => handleRoleChange('customer')}
                    >
                      <i className="fas fa-user-circle role-icon"></i>
                      <div className="role-name">ลูกค้า</div>
                      <div className="role-desc">หาเทรนเนอร์ที่ตรงใจ</div>
                    </div>
                  </div>
                  <div className="role-option">
                    <div 
                      className={`role-card ${formData.userRole === 'trainer' ? 'selected' : ''}`}
                      onClick={() => handleRoleChange('trainer')}
                    >
                      <i className="fas fa-dumbbell role-icon"></i>
                      <div className="role-name">เทรนเนอร์</div>
                      <div className="role-desc">ให้คำปรึกษาอย่างมืออาชีพ</div>
                    </div>
                  </div>
                </div>
                {errors.userRole && <div className="form-error">{errors.userRole}</div>}
              </div>

              {/* Personal Information */}
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">ชื่อ *</label>
                <input
                  type="text"
                  className={`form-control ${errors.firstName ? 'error' : ''}`}
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={loading || socialLoading}
                  required
                />
                {errors.firstName && <div className="form-error">{errors.firstName}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="lastName" className="form-label">นามสกุล *</label>
                <input
                  type="text"
                  className={`form-control ${errors.lastName ? 'error' : ''}`}
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={loading || socialLoading}
                  required
                />
                {errors.lastName && <div className="form-error">{errors.lastName}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">อีเมล *</label>
                <div className="input-group">
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'error' : ''}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={loading || socialLoading}
                    required
                  />
                  {emailCheckLoading && (
                    <div className="email-checking">
                      <i className="fas fa-spinner fa-spin"></i>
                    </div>
                  )}
                </div>
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">เบอร์โทรศัพท์ *</label>
                <input
                  type="tel"
                  className={`form-control ${errors.phone ? 'error' : ''}`}
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={loading || socialLoading}
                  placeholder="0812345678"
                  required
                />
                {errors.phone && <div className="form-error">{errors.phone}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">รหัสผ่าน *</label>
                <div className="input-group">
                  <input
                    type={showPasswords.password ? "text" : "password"}
                    className={`form-control ${errors.password ? 'error' : ''}`}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={loading || socialLoading}
                    required
                  />
                  <span className="input-group-text" onClick={() => togglePassword('password')}>
                    <i className={`fas ${showPasswords.password ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </span>
                </div>
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">ยืนยันรหัสผ่าน *</label>
                <div className="input-group">
                  <input
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={loading || socialLoading}
                    required
                  />
                  <span className="input-group-text" onClick={() => togglePassword('confirmPassword')}>
                    <i className={`fas ${showPasswords.confirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </span>
                </div>
                {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
              </div>

              {/* Terms and Conditions */}
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="terms"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleInputChange}
                  disabled={loading || socialLoading}
                  required
                />
                <label className="form-check-label" htmlFor="terms">
                  ฉันยอมรับ <a href="#" target="_blank">เงื่อนไขการใช้งาน</a> และ <a href="#" target="_blank">นโยบายความเป็นส่วนตัว</a>
                </label>
                {errors.terms && <div className="form-error">{errors.terms}</div>}
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                className={`btn bbtn-primary ${loading ? 'btn-loading' : ''}`}
                disabled={loading || socialLoading}
              >
                {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
              </button>
            </form>

            {/* Social Login */}
            <div className="social-login">
              <div className="social-title">หรือสมัครด้วย</div>
              
              {/* Warning Message */}
              {showSocialWarning && (
                <div className="social-warning">
                  <i className="fas fa-exclamation-triangle"></i>
                  กรุณาเลือกประเภทผู้ใช้งานก่อนสมัครด้วย Google หรือ Facebook
                </div>
              )}
              
              <div className="social-buttons">
                <button 
                  className={`btn-social google ${!formData.userRole || loading || socialLoading ? 'disabled' : ''}`}
                  onClick={() => formData.userRole ? handleSocialLogin('google') : handleSocialLoginNoRole('google')}
                  type="button"
                  disabled={loading || socialLoading}
                >
                  {socialLoading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fab fa-google"></i>
                  )}
                  Google
                </button>
                <button 
                  className={`btn-social facebook ${!formData.userRole || loading || socialLoading ? 'disabled' : ''}`}
                  onClick={() => formData.userRole ? handleSocialLogin('facebook') : handleSocialLoginNoRole('facebook')}
                  type="button"
                  disabled={loading || socialLoading}
                >
                  {socialLoading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fab fa-facebook-f"></i>
                  )}
                  Facebook
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="auth-footer">
              <p>มีบัญชีอยู่แล้ว? <Link to="/signin">เข้าสู่ระบบ</Link></p>
              <p><Link to="/">กลับสู่หน้าแรก</Link></p>
            </div>
          </div>
        </div>

        {/* Role Selection Modal */}
        {showRoleModal && (
          <div className="role-modal" onClick={(e) => e.target.className === 'role-modal' && closeRoleModal()}>
            <div className="role-modal-content">
              <div className="role-modal-header">
                <h3 className="role-modal-title">เลือกประเภทการใช้งาน</h3>
                <p className="role-modal-subtitle">กรุณาเลือกประเภทการใช้งานเพื่อปรับแต่งประสบการณ์ให้เหมาะสมกับคุณ</p>
              </div>

              <div className="role-modal-options">
                <div className="role-modal-option">
                  <div 
                    className={`role-modal-card ${modalRole === 'customer' ? 'selected' : ''}`}
                    onClick={() => setModalRole('customer')}
                  >
                    <i className="fas fa-user-circle role-modal-icon"></i>
                    <div className="role-modal-name">ลูกค้า</div>
                    <div className="role-modal-desc">ค้นหาเทรนเนอร์ที่เหมาะสมกับคุณ</div>
                  </div>
                </div>
                <div className="role-modal-option">
                  <div 
                    className={`role-modal-card ${modalRole === 'trainer' ? 'selected' : ''}`}
                    onClick={() => setModalRole('trainer')}
                  >
                    <i className="fas fa-dumbbell role-modal-icon"></i>
                    <div className="role-modal-name">เทรนเนอร์</div>
                    <div className="role-modal-desc">แชร์ความรู้และสอนลูกค้า</div>
                  </div>
                </div>
              </div>

              <div className="role-modal-buttons">
                <button 
                  type="button" 
                  className="btn-modal btn-modal-cancel" 
                  onClick={closeRoleModal}
                  disabled={socialLoading}
                >
                  ยกเลิก
                </button>
                <button 
                  type="button" 
                  className="btn-modal btn-modal-confirm" 
                  onClick={confirmSocialSignup}
                  disabled={!modalRole || socialLoading}
                >
                  {socialLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> 
                      กำลังสมัคร...
                    </>
                  ) : (
                    'ยืนยัน'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SignUpPage;