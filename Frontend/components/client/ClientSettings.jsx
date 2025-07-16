import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Lock, 
  Target, 
  HelpCircle, 
  Save,
  Camera,
  MessageCircle,
  Phone,
  Mail,
  Trash2,
  Eye,
  EyeOff,
  Smartphone,
  Clock,
  MapPin,
  Key,
  AlertTriangle,
  CheckCircle,
  X,
  Loader
} from 'lucide-react';

const ClientSettings = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [activeSection, setActiveSection] = useState('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showTwoFASetup, setShowTwoFASetup] = useState(false);

  // Database-related states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const settingSections = [
    { 
      id: 'profile', 
      label: 'ข้อมูลส่วนตัว', 
      icon: User,
      description: 'จัดการข้อมูลโปรไฟล์และรายละเอียดส่วนตัว'
    },
    { 
      id: 'preferences', 
      label: 'การตั้งค่าทั่วไป', 
      icon: Settings,
      description: 'ภาษา ธีม และการตั้งค่าการใช้งาน'
    },
    { 
      id: 'notifications', 
      label: 'การแจ้งเตือน', 
      icon: Bell,
      description: 'จัดการการแจ้งเตือนและการส่งข้อความ'
    },
    { 
      id: 'privacy', 
      label: 'ความเป็นส่วนตัว', 
      icon: Shield,
      description: 'การมองเห็นโปรไฟล์และการแชร์ข้อมูล'
    },
    { 
      id: 'security', 
      label: 'ความปลอดภัย', 
      icon: Lock,
      description: 'รหัสผ่าน การยืนยันตัวตน และความปลอดภัยบัญชี'
    },
    { 
      id: 'goals', 
      label: 'เป้าหมายการออกกำลังกาย', 
      icon: Target,
      description: 'ตั้งค่าเป้าหมายและการติดตามผล'
    },
    { 
      id: 'support', 
      label: 'ช่วยเหลือและสนับสนุน', 
      icon: HelpCircle,
      description: 'คำถามที่พบบ่อย การติดต่อสนับสนุน'
    }
  ];

  // User data state
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    location: '',
    bio: '',
    profileImage: '',
    emergencyContact: {
      name: '',
      relation: '',
      phone: ''
    }
  });

  // Settings state
  const [settings, setSettings] = useState({
    // General preferences
    language: 'th',
    theme: 'light',
    timezone: 'Asia/Bangkok',
    measurementUnit: 'metric',
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    workoutReminders: true,
    nutritionReminders: true,
    progressUpdates: true,
    promotionalEmails: false,
    sessionReminders: true,
    trainerMessages: true,
    packageExpiry: true,
    
    // Privacy
    profileVisibility: 'friends',
    showRealName: true,
    shareProgress: true,
    shareWorkouts: false,
    shareNutrition: false,
    showOnlineStatus: true,
    searchByEmail: false,
    searchByPhone: false,
    
    // Security
    twoFactorEnabled: false,
    loginNotifications: true,
    sessionTimeout: 30,
    deviceTrust: true,
    
    // Goals
    primaryGoal: 'weight_loss',
    weeklyWorkoutGoal: 5,
    weeklyDurationGoal: 300, // minutes
    targetWeight: 70,
    activityLevel: 'moderate'
  });

  // Security state
  const [securityData, setSecurityData] = useState({
    lastPasswordChange: '',
    activeSessions: [],
    loginHistory: []
  });

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  // API Functions
  const api = {
    // Get user profile
    getUserProfile: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/client/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error('Failed to fetch user profile');
        return await response.json();
      } catch (error) {
        throw new Error(`Error fetching user profile: ${error.message}`);
      }
    },

    // Update user profile
    updateUserProfile: async (profileData) => {
      try {
        const response = await fetch(`${API_BASE_URL}/client/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(profileData)
        });
        if (!response.ok) throw new Error('Failed to update user profile');
        return await response.json();
      } catch (error) {
        throw new Error(`Error updating user profile: ${error.message}`);
      }
    },

    // Get user settings
    getUserSettings: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/client/settings`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error('Failed to fetch user settings');
        return await response.json();
      } catch (error) {
        throw new Error(`Error fetching user settings: ${error.message}`);
      }
    },

    // Update user settings
    updateUserSettings: async (settingsData) => {
      try {
        const response = await fetch(`${API_BASE_URL}/client/settings`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(settingsData)
        });
        if (!response.ok) throw new Error('Failed to update user settings');
        return await response.json();
      } catch (error) {
        throw new Error(`Error updating user settings: ${error.message}`);
      }
    },

    // Get security data
    getSecurityData: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/client/security`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error('Failed to fetch security data');
        return await response.json();
      } catch (error) {
        throw new Error(`Error fetching security data: ${error.message}`);
      }
    },

    // Change password
    changePassword: async (oldPassword, newPassword) => {
      try {
        const response = await fetch(`${API_BASE_URL}/client/change-password`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ oldPassword, newPassword })
        });
        if (!response.ok) throw new Error('Failed to change password');
        return await response.json();
      } catch (error) {
        throw new Error(`Error changing password: ${error.message}`);
      }
    },

    // Toggle 2FA
    toggle2FA: async (enable) => {
      try {
        const response = await fetch(`${API_BASE_URL}/client/2fa`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ enable })
        });
        if (!response.ok) throw new Error('Failed to toggle 2FA');
        return await response.json();
      } catch (error) {
        throw new Error(`Error toggling 2FA: ${error.message}`);
      }
    },

    // Terminate session
    terminateSession: async (sessionId) => {
      try {
        const response = await fetch(`${API_BASE_URL}/client/sessions/${sessionId}/terminate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) throw new Error('Failed to terminate session');
        return await response.json();
      } catch (error) {
        throw new Error(`Error terminating session: ${error.message}`);
      }
    },

    // Delete account
    deleteAccount: async (password) => {
      try {
        const response = await fetch(`${API_BASE_URL}/client/account`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password })
        });
        if (!response.ok) throw new Error('Failed to delete account');
        return await response.json();
      } catch (error) {
        throw new Error(`Error deleting account: ${error.message}`);
      }
    },

    // Upload profile image
    uploadProfileImage: async (imageFile) => {
      try {
        const formData = new FormData();
        formData.append('profileImage', imageFile);

        const response = await fetch(`${API_BASE_URL}/client/profile/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        if (!response.ok) throw new Error('Failed to upload profile image');
        return await response.json();
      } catch (error) {
        throw new Error(`Error uploading profile image: ${error.message}`);
      }
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load all data in parallel
        const [profileData, settingsData, securityDataResult] = await Promise.all([
          api.getUserProfile(),
          api.getUserSettings(),
          api.getSecurityData()
        ]);

        setUserData(profileData.user || userData);
        setSettings(settingsData.settings || settings);
        setSecurityData(securityDataResult.security || securityData);
      } catch (err) {
        setError(err.message);
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Updated handlers
  const handleSaveProfile = async () => {
    try {
      setSaveLoading(true);
      setError(null);

      await api.updateUserProfile(userData);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: var(--success);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        z-index: 1000;
        font-size: 0.875rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      `;
      successDiv.textContent = 'บันทึกข้อมูลเรียบร้อยแล้ว';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        document.body.removeChild(successDiv);
      }, 3000);
    } catch (err) {
      setError(err.message);
      console.error('Error saving profile:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaveLoading(true);
      setError(null);

      await api.updateUserSettings(settings);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: var(--success);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        z-index: 1000;
        font-size: 0.875rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      `;
      successDiv.textContent = 'บันทึกการตั้งค่าเรียบร้อยแล้ว';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        document.body.removeChild(successDiv);
      }, 3000);
    } catch (err) {
      setError(err.message);
      console.error('Error saving settings:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleChangePassword = async (oldPassword, newPassword) => {
    try {
      setActionLoading(true);
      setError(null);

      await api.changePassword(oldPassword, newPassword);
      
      // Refresh security data
      const securityDataResult = await api.getSecurityData();
      setSecurityData(securityDataResult.security || securityData);
      
      setShowPasswordChange(false);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: var(--success);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        z-index: 1000;
        font-size: 0.875rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      `;
      successDiv.textContent = 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        document.body.removeChild(successDiv);
      }, 3000);
    } catch (err) {
      setError(err.message);
      console.error('Error changing password:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      setActionLoading(true);
      setError(null);

      const newStatus = !settings.twoFactorEnabled;
      await api.toggle2FA(newStatus);
      
      setSettings(prev => ({ ...prev, twoFactorEnabled: newStatus }));
      setShowTwoFASetup(false);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: var(--success);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        z-index: 1000;
        font-size: 0.875rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      `;
      successDiv.textContent = newStatus ? 'เปิดใช้งาน 2FA เรียบร้อยแล้ว' : 'ปิดใช้งาน 2FA เรียบร้อยแล้ว';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        document.body.removeChild(successDiv);
      }, 3000);
    } catch (err) {
      setError(err.message);
      console.error('Error toggling 2FA:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      setActionLoading(true);
      setError(null);

      await api.terminateSession(sessionId);
      
      // Refresh security data
      const securityDataResult = await api.getSecurityData();
      setSecurityData(securityDataResult.security || securityData);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: var(--success);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        z-index: 1000;
        font-size: 0.875rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      `;
      successDiv.textContent = 'ออกจากระบบเรียบร้อยแล้ว';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        document.body.removeChild(successDiv);
      }, 3000);
    } catch (err) {
      setError(err.message);
      console.error('Error terminating session:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = async (password) => {
    try {
      setActionLoading(true);
      setError(null);

      await api.deleteAccount(password);
      
      // Clear local storage and redirect
      localStorage.clear();
      window.location.href = '/login';
    } catch (err) {
      setError(err.message);
      console.error('Error deleting account:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProfileImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setSaveLoading(true);
      setError(null);

      const result = await api.uploadProfileImage(file);
      
      setUserData(prev => ({
        ...prev,
        profileImage: result.imageUrl
      }));
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: var(--success);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        z-index: 1000;
        font-size: 0.875rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      `;
      successDiv.textContent = 'อัปโหลดรูปโปรไฟล์เรียบร้อยแล้ว';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        document.body.removeChild(successDiv);
      }, 3000);
    } catch (err) {
      setError(err.message);
      console.error('Error uploading profile image:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  // Loading component
  const LoadingSpinner = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      color: 'var(--text-secondary)'
    }}>
      <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ marginLeft: '0.5rem' }}>กำลังโหลด...</span>
    </div>
  );

  // Error component
  const ErrorMessage = ({ message, onRetry }) => (
    <div style={{
      backgroundColor: 'rgba(245, 101, 101, 0.1)',
      borderRadius: '0.5rem',
      padding: '1rem',
      margin: '1rem 0',
      border: '1px solid var(--danger)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <AlertTriangle size={20} color="var(--danger)" />
        <span style={{ fontWeight: '600', color: 'var(--danger)' }}>เกิดข้อผิดพลาด</span>
      </div>
      <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            backgroundColor: 'var(--danger)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.375rem',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          ลองใหม่
        </button>
      )}
    </div>
  );

  // Main loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)',
        '--primary': '#232956',
        '--accent': '#df2528',
        '--success': '#22c55e',
        '--warning': '#f59e0b',
        '--danger': '#f56565',
        '--bg-primary': '#ffffff',
        '--bg-secondary': '#f8fafc',
        '--text-primary': '#1a202c',
        '--text-secondary': '#64748b',
        '--text-white': '#ffffff',
        '--border-color': '#e2e8f0'
      }}>
        <div style={{ padding: windowWidth <= 768 ? '1rem' : '2rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ 
              fontSize: windowWidth <= 768 ? '1.5rem' : '1.75rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              marginBottom: '0.5rem' 
            }}>
              การตั้งค่า
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              จัดการข้อมูลส่วนตัว การตั้งค่า และบัญชีของคุณ
            </p>
          </div>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Notification Settings Section
  const renderNotificationsSection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Error Display */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => {
            setError(null);
            window.location.reload();
          }} 
        />
      )}

      {/* Push Notifications */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          การแจ้งเตือนผ่านแอป
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[
            { key: 'pushNotifications', label: 'การแจ้งเตือนผ่านแอป', description: 'รับการแจ้งเตือนผ่านมือถือ' },
            { key: 'workoutReminders', label: 'การแจ้งเตือนการออกกำลังกาย', description: 'แจ้งเตือนก่อนเซสชั่นเทรนนิ่ง' },
            { key: 'sessionReminders', label: 'การแจ้งเตือนนัดหมาย', description: 'แจ้งเตือนก่อนนัดกับเทรนเนอร์ 30 นาที' },
            { key: 'trainerMessages', label: 'ข้อความจากเทรนเนอร์', description: 'แจ้งเตือนเมื่อเทรนเนอร์ส่งข้อความ' },
            { key: 'progressUpdates', label: 'อัปเดตความก้าวหน้า', description: 'แจ้งเตือนผลการออกกำลังกายรายสัปดาห์' }
          ].map(item => (
            <div key={item.key} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {item.description}
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '3rem', height: '1.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings[item.key]}
                  onChange={(e) => setSettings({...settings, [item.key]: e.target.checked})}
                  disabled={saveLoading}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: saveLoading ? 'not-allowed' : 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: settings[item.key] ? 'var(--primary)' : '#ccc',
                  borderRadius: '1.5rem',
                  transition: '0.3s',
                  opacity: saveLoading ? 0.6 : 1
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '1.25rem',
                    width: '1.25rem',
                    left: settings[item.key] ? '1.625rem' : '0.125rem',
                    bottom: '0.125rem',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.3s'
                  }} />
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Email Notifications */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          การแจ้งเตือนผ่านอีเมล
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[
            { key: 'emailNotifications', label: 'อีเมลแจ้งเตือนทั่วไป', description: 'รับข้อมูลสำคัญผ่านอีเมล' },
            { key: 'nutritionReminders', label: 'แจ้งเตือนโภชนาการ', description: 'คำแนะนำและเตือนการกินอาหาร' },
            { key: 'packageExpiry', label: 'แจ้งหมดอายุแพคเกจ', description: 'แจ้งเตือนก่อนแพคเกจหมดอายุ 7 วัน' },
            { key: 'promotionalEmails', label: 'อีเมลโปรโมชั่น', description: 'ข้อเสนอพิเศษและส่วนลด' }
          ].map(item => (
            <div key={item.key} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {item.description}
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '3rem', height: '1.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings[item.key]}
                  onChange={(e) => setSettings({...settings, [item.key]: e.target.checked})}
                  disabled={saveLoading}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: saveLoading ? 'not-allowed' : 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: settings[item.key] ? 'var(--primary)' : '#ccc',
                  borderRadius: '1.5rem',
                  transition: '0.3s',
                  opacity: saveLoading ? 0.6 : 1
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '1.25rem',
                    width: '1.25rem',
                    left: settings[item.key] ? '1.625rem' : '0.125rem',
                    bottom: '0.125rem',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.3s'
                  }} />
                </span>
              </label>
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saveLoading}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: saveLoading ? 'not-allowed' : 'pointer',
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: saveLoading ? 0.6 : 1
          }}
        >
          {saveLoading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
          {saveLoading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
    </div>
  );

  // Privacy Settings Section
  const renderPrivacySection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Error Display */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => {
            setError(null);
            window.location.reload();
          }} 
        />
      )}

      {/* Profile Visibility */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          การมองเห็นโปรไฟล์
        </h3>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            ใครสามารถดูโปรไฟล์ของคุณได้
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { id: 'public', label: 'สาธารณะ', description: 'ทุกคนสามารถดูโปรไฟล์ของคุณได้' },
              { id: 'friends', label: 'เฉพาะเพื่อน', description: 'เฉพาะเทรนเนอร์ที่คุณเคยใช้บริการ' },
              { id: 'private', label: 'ส่วนตัว', description: 'เฉพาะเทรนเนอร์ปัจจุบันเท่านั้น' }
            ].map(option => (
              <label key={option.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: settings.profileVisibility === option.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: settings.profileVisibility === option.id ? 'rgba(35, 41, 86, 0.05)' : 'transparent',
                cursor: saveLoading ? 'not-allowed' : 'pointer',
                opacity: saveLoading ? 0.6 : 1
              }}>
                <input
                  type="radio"
                  name="profileVisibility"
                  value={option.id}
                  checked={settings.profileVisibility === option.id}
                  onChange={(e) => setSettings({...settings, profileVisibility: e.target.value})}
                  disabled={saveLoading}
                  style={{ marginRight: '1rem' }}
                />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                    {option.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {option.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Profile Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            การตั้งค่าการแสดงข้อมูล
          </h4>
          {[
            { key: 'showRealName', label: 'แสดงชื่อจริง', description: 'แสดงชื่อจริงแทนชื่อเล่น' },
            { key: 'showOnlineStatus', label: 'แสดงสถานะออนไลน์', description: 'แสดงเมื่อคุณออนไลน์' },
            { key: 'shareProgress', label: 'แชร์ความก้าวหน้า', description: 'ให้เทรนเนอร์เห็นผลการออกกำลังกาย' },
            { key: 'shareWorkouts', label: 'แชร์ประวัติการเทรน', description: 'แสดงประวัติการออกกำลังกายที่ผ่านมา' },
            { key: 'shareNutrition', label: 'แชร์ข้อมูลโภชนาการ', description: 'แสดงบันทึกการกินของคุณ' }
          ].map(item => (
            <div key={item.key} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {item.description}
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '3rem', height: '1.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings[item.key]}
                  onChange={(e) => setSettings({...settings, [item.key]: e.target.checked})}
                  disabled={saveLoading}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: saveLoading ? 'not-allowed' : 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: settings[item.key] ? 'var(--primary)' : '#ccc',
                  borderRadius: '1.5rem',
                  transition: '0.3s',
                  opacity: saveLoading ? 0.6 : 1
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '1.25rem',
                    width: '1.25rem',
                    left: settings[item.key] ? '1.625rem' : '0.125rem',
                    bottom: '0.125rem',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.3s'
                  }} />
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Search Settings */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          การค้นหา
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[
            { key: 'searchByEmail', label: 'ค้นหาด้วยอีเมล', description: 'ให้คนอื่นค้นหาคุณด้วยอีเมล' },
            { key: 'searchByPhone', label: 'ค้นหาด้วยเบอร์โทร', description: 'ให้คนอื่นค้นหาคุณด้วยเบอร์โทรศัพท์' }
          ].map(item => (
            <div key={item.key} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {item.description}
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '3rem', height: '1.5rem' }}>
                <input
                  type="checkbox"
                  checked={settings[item.key]}
                  onChange={(e) => setSettings({...settings, [item.key]: e.target.checked})}
                  disabled={saveLoading}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: saveLoading ? 'not-allowed' : 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: settings[item.key] ? 'var(--primary)' : '#ccc',
                  borderRadius: '1.5rem',
                  transition: '0.3s',
                  opacity: saveLoading ? 0.6 : 1
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '1.25rem',
                    width: '1.25rem',
                    left: settings[item.key] ? '1.625rem' : '0.125rem',
                    bottom: '0.125rem',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.3s'
                  }} />
                </span>
              </label>
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saveLoading}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: saveLoading ? 'not-allowed' : 'pointer',
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: saveLoading ? 0.6 : 1
          }}
        >
          {saveLoading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
          {saveLoading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
    </div>
  );

  // Security Settings Section
  const renderSecuritySection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Error Display */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => {
            setError(null);
            window.location.reload();
          }} 
        />
      )}

      {/* Password & Authentication */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          รหัสผ่านและการยืนยันตัวตน
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Password Settings */}
          <div style={{
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                  รหัสผ่าน
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  เปลี่ยนแปลงล่าสุด: {securityData.lastPasswordChange ? new Date(securityData.lastPasswordChange).toLocaleDateString('th-TH') : 'ไม่ทราบ'}
                </div>
              </div>
              <button
                onClick={() => setShowPasswordChange(true)}
                disabled={actionLoading}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--text-white)',
                  border: 'none',
                  borderRadius: '0.375rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.75rem',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.6 : 1
                }}
              >
                เปลี่ยนรหัสผ่าน
              </button>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div style={{
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                  การยืนยันตัวตนแบบสองปัจจัย (2FA)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {settings.twoFactorEnabled ? 'เปิดใช้งานแล้ว' : 'เพิ่มความปลอดภัยให้บัญชีของคุณ'}
                </div>
              </div>
              <button
                onClick={handleToggle2FA}
                disabled={actionLoading}
                style={{
                  backgroundColor: settings.twoFactorEnabled ? 'var(--danger)' : 'var(--success)',
                  color: 'var(--text-white)',
                  border: 'none',
                  borderRadius: '0.375rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.75rem',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.6 : 1
                }}
              >
                {actionLoading ? 'กำลังประมวลผล...' : (settings.twoFactorEnabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน')}
              </button>
            </div>
          </div>

          {/* Security Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { key: 'loginNotifications', label: 'แจ้งเตือนการเข้าสู่ระบบ', description: 'รับแจ้งเตือนเมื่อมีการเข้าสู่ระบบจากอุปกรณ์ใหม่' },
              { key: 'deviceTrust', label: 'จดจำอุปกรณ์', description: 'ไม่ต้องยืนยันตัวตนซ้ำในอุปกรณ์ที่เชื่อถือได้' }
            ].map(item => (
              <div key={item.key} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {item.description}
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '3rem', height: '1.5rem' }}>
                  <input
                    type="checkbox"
                    checked={settings[item.key]}
                    onChange={(e) => setSettings({...settings, [item.key]: e.target.checked})}
                    disabled={saveLoading}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: saveLoading ? 'not-allowed' : 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: settings[item.key] ? 'var(--primary)' : '#ccc',
                    borderRadius: '1.5rem',
                    transition: '0.3s',
                    opacity: saveLoading ? 0.6 : 1
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '',
                      height: '1.25rem',
                      width: '1.25rem',
                      left: settings[item.key] ? '1.625rem' : '0.125rem',
                      bottom: '0.125rem',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      transition: '0.3s'
                    }} />
                  </span>
                </label>
              </div>
            ))}
          </div>

          {/* Session Timeout */}
          <div style={{
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-color)'
          }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              หมดเวลาเซสชั่นอัตโนมัติ (นาที)
            </label>
            <select
              value={settings.sessionTimeout}
              onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
              disabled={saveLoading}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                opacity: saveLoading ? 0.6 : 1,
                cursor: saveLoading ? 'not-allowed' : 'pointer'
              }}
            >
              <option value={15}>15 นาที</option>
              <option value={30}>30 นาที</option>
              <option value={60}>1 ชั่วโมง</option>
              <option value={120}>2 ชั่วโมง</option>
              <option value={0}>ไม่หมดเวลา</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          เซสชั่นที่ใช้งานอยู่
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {securityData.activeSessions && securityData.activeSessions.length > 0 ? securityData.activeSessions.map(session => (
            <div key={session.id} style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              backgroundColor: session.current ? 'rgba(35, 41, 86, 0.05)' : 'transparent'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Smartphone size={20} color="var(--text-secondary)" />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {session.device} {session.current && '(อุปกรณ์นี้)'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {session.location} • ใช้งานล่าสุด {new Date(session.lastActivity).toLocaleString('th-TH')}
                    </div>
                  </div>
                </div>
                {!session.current && (
                  <button 
                    onClick={() => handleTerminateSession(session.id)}
                    disabled={actionLoading}
                    style={{
                      backgroundColor: 'var(--danger)',
                      color: 'var(--text-white)',
                      border: 'none',
                      borderRadius: '0.375rem',
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.75rem',
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      opacity: actionLoading ? 0.6 : 1
                    }}
                  >
                    {actionLoading ? 'กำลังออก...' : 'ออกจากระบบ'}
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              ไม่มีเซสชั่นที่ใช้งานอยู่
            </div>
          )}
        </div>
      </div>

      {/* Login History */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          ประวัติการเข้าสู่ระบบ
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {securityData.loginHistory && securityData.loginHistory.length > 0 ? securityData.loginHistory.map((login, index) => (
            <div key={index} style={{
              padding: '0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {login.status === 'success' ? (
                    <CheckCircle size={16} color="var(--success)" />
                  ) : (
                    <AlertTriangle size={16} color="var(--danger)" />
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                    {new Date(login.date).toLocaleString('th-TH')}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {login.device} • {login.location}
                </div>
              </div>
            </div>
          )) : (
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              ไม่มีประวัติการเข้าสู่ระบบ
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Keep existing sections (Profile, Preferences, Goals, Support) - Updated with loading states
  const renderProfileSection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Error Display */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => {
            setError(null);
            window.location.reload();
          }} 
        />
      )}

      {/* Profile Picture */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
          {userData.profileImage ? (
            <img 
              src={userData.profileImage} 
              alt="Profile" 
              style={{
                width: '6rem',
                height: '6rem',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: '6rem',
              height: '6rem',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: '700',
              color: 'var(--text-white)',
              margin: '0 auto'
            }}>
              {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
            </div>
          )}
          <label style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            backgroundColor: 'var(--primary)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '50%',
            width: '2rem',
            height: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: saveLoading ? 'not-allowed' : 'pointer',
            opacity: saveLoading ? 0.6 : 1
          }}>
            {saveLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={14} />}
            <input
              type="file"
              accept="image/*"
              onChange={handleProfileImageUpload}
              disabled={saveLoading}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          {userData.firstName} {userData.lastName}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {userData.email}
        </p>
      </div>

      {/* Personal Information */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          ข้อมูลส่วนตัว
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
          gap: '1.5rem'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              ชื่อจริง
            </label>
            <input
              type="text"
              value={userData.firstName}
              onChange={(e) => setUserData({...userData, firstName: e.target.value})}
              disabled={saveLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                opacity: saveLoading ? 0.6 : 1,
                cursor: saveLoading ? 'not-allowed' : 'text'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              นามสกุล
            </label>
            <input
              type="text"
              value={userData.lastName}
              onChange={(e) => setUserData({...userData, lastName: e.target.value})}
              disabled={saveLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                opacity: saveLoading ? 0.6 : 1,
                cursor: saveLoading ? 'not-allowed' : 'text'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              อีเมล
            </label>
            <input
              type="email"
              value={userData.email}
              onChange={(e) => setUserData({...userData, email: e.target.value})}
              disabled={saveLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                opacity: saveLoading ? 0.6 : 1,
                cursor: saveLoading ? 'not-allowed' : 'text'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              value={userData.phone}
              onChange={(e) => setUserData({...userData, phone: e.target.value})}
              disabled={saveLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                opacity: saveLoading ? 0.6 : 1,
                cursor: saveLoading ? 'not-allowed' : 'text'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              วันเกิด
            </label>
            <input
              type="date"
              value={userData.dateOfBirth}
              onChange={(e) => setUserData({...userData, dateOfBirth: e.target.value})}
              disabled={saveLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                opacity: saveLoading ? 0.6 : 1,
                cursor: saveLoading ? 'not-allowed' : 'text'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              เพศ
            </label>
            <select
              value={userData.gender}
              onChange={(e) => setUserData({...userData, gender: e.target.value})}
              disabled={saveLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                opacity: saveLoading ? 0.6 : 1,
                cursor: saveLoading ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="male">ชาย</option>
              <option value="female">หญิง</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            ที่อยู่
          </label>
          <input
            type="text"
            value={userData.location}
            onChange={(e) => setUserData({...userData, location: e.target.value})}
            disabled={saveLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              opacity: saveLoading ? 0.6 : 1,
              cursor: saveLoading ? 'not-allowed' : 'text'
            }}
          />
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            แนะนำตัว
          </label>
          <textarea
            value={userData.bio}
            onChange={(e) => setUserData({...userData, bio: e.target.value})}
            disabled={saveLoading}
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              resize: 'vertical',
              opacity: saveLoading ? 0.6 : 1,
              cursor: saveLoading ? 'not-allowed' : 'text'
            }}
          />
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saveLoading}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: saveLoading ? 'not-allowed' : 'pointer',
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: saveLoading ? 0.6 : 1
          }}
        >
          {saveLoading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
          {saveLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
        </button>
      </div>

      {/* Emergency Contact */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          ติดต่อฉุกเฉิน
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
          gap: '1.5rem'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              ชื่อ-นามสกุล
            </label>
            <input
              type="text"
              value={userData.emergencyContact.name}
              onChange={(e) => setUserData({
                ...userData, 
                emergencyContact: {...userData.emergencyContact, name: e.target.value}
              })}
              disabled={saveLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                opacity: saveLoading ? 0.6 : 1,
                cursor: saveLoading ? 'not-allowed' : 'text'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              ความสัมพันธ์
            </label>
            <input
              type="text"
              value={userData.emergencyContact.relation}
              onChange={(e) => setUserData({
                ...userData, 
                emergencyContact: {...userData.emergencyContact, relation: e.target.value}
              })}
              disabled={saveLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                opacity: saveLoading ? 0.6 : 1,
                cursor: saveLoading ? 'not-allowed' : 'text'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              value={userData.emergencyContact.phone}
              onChange={(e) => setUserData({
                ...userData, 
                emergencyContact: {...userData.emergencyContact, phone: e.target.value}
              })}
              disabled={saveLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                opacity: saveLoading ? 0.6 : 1,
                cursor: saveLoading ? 'not-allowed' : 'text'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferencesSection = () => (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '0.75rem',
      border: '1px solid var(--border-color)',
      padding: '2rem'
    }}>
      {/* Error Display */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => {
            setError(null);
            window.location.reload();
          }} 
        />
      )}

      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
        การตั้งค่าทั่วไป
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Language & Region */}
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            ภาษาและภูมิภาค
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
            gap: '1rem'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                ภาษา
              </label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({...settings, language: e.target.value})}
                disabled={saveLoading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  opacity: saveLoading ? 0.6 : 1,
                  cursor: saveLoading ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="th">ไทย</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                ธีม
              </label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings({...settings, theme: e.target.value})}
                disabled={saveLoading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  opacity: saveLoading ? 0.6 : 1,
                  cursor: saveLoading ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="light">สว่าง</option>
                <option value="dark">มืด</option>
                <option value="auto">อัตโนมัติ</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                เขตเวลา
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                disabled={saveLoading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  opacity: saveLoading ? 0.6 : 1,
                  cursor: saveLoading ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="Asia/Bangkok">กรุงเทพฯ (GMT+7)</option>
                <option value="Asia/Seoul">โซล (GMT+9)</option>
                <option value="Asia/Tokyo">โตเกียว (GMT+9)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Measurement Units */}
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            หน่วยการวัด
          </h4>
          
          <div style={{ display: 'flex', borderRadius: '0.5rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            {[
              { id: 'metric', label: 'เมตริก (กิโลกรัม, เซนติเมตร)' },
              { id: 'imperial', label: 'อิมพีเรียล (ปอนด์, ฟุต)' }
            ].map(unit => (
              <button
                key={unit.id}
                onClick={() => setSettings({...settings, measurementUnit: unit.id})}
                disabled={saveLoading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '0.25rem',
                  backgroundColor: settings.measurementUnit === unit.id ? 'var(--primary)' : 'transparent',
                  color: settings.measurementUnit === unit.id ? 'var(--text-white)' : 'var(--text-primary)',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: saveLoading ? 'not-allowed' : 'pointer',
                  opacity: saveLoading ? 0.6 : 1
                }}
              >
                {unit.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saveLoading}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: saveLoading ? 'not-allowed' : 'pointer',
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: saveLoading ? 0.6 : 1
          }}
        >
          {saveLoading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
          {saveLoading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
    </div>
  );

  const renderGoalsSection = () => (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '0.75rem',
      border: '1px solid var(--border-color)',
      padding: '2rem'
    }}>
      {/* Error Display */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => {
            setError(null);
            window.location.reload();
          }} 
        />
      )}

      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
        เป้าหมายการออกกำลังกาย
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Primary Goal */}
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            เป้าหมายหลัก
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
            gap: '1rem'
          }}>
            {[
              { id: 'weight_loss', label: 'ลดน้ำหนัก', icon: '📉', color: 'var(--accent)' },
              { id: 'muscle_gain', label: 'เพิ่มกล้ามเนื้อ', icon: '💪', color: 'var(--primary)' },
              { id: 'fitness', label: 'เพิ่มความฟิต', icon: '❤️', color: 'var(--success)' }
            ].map(goal => (
              <button
                key={goal.id}
                onClick={() => setSettings({...settings, primaryGoal: goal.id})}
                disabled={saveLoading}
                style={{
                  padding: '1.5rem',
                  border: settings.primaryGoal === goal.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  backgroundColor: settings.primaryGoal === goal.id ? 'rgba(35, 41, 86, 0.05)' : 'var(--bg-secondary)',
                  cursor: saveLoading ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  opacity: saveLoading ? 0.6 : 1
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{goal.icon}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {goal.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Weekly Goals */}
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            เป้าหมายรายสัปดาห์
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
            gap: '1rem'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                จำนวนครั้งต่อสัปดาห์
              </label>
              <input
                type="number"
                min="1"
                max="7"
                value={settings.weeklyWorkoutGoal}
                onChange={(e) => setSettings({...settings, weeklyWorkoutGoal: parseInt(e.target.value)})}
                disabled={saveLoading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  opacity: saveLoading ? 0.6 : 1,
                  cursor: saveLoading ? 'not-allowed' : 'text'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                เวลา (นาที/สัปดาห์)
              </label>
              <input
                type="number"
                min="30"
                step="30"
                value={settings.weeklyDurationGoal}
                onChange={(e) => setSettings({...settings, weeklyDurationGoal: parseInt(e.target.value)})}
                disabled={saveLoading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  opacity: saveLoading ? 0.6 : 1,
                  cursor: saveLoading ? 'not-allowed' : 'text'
                }}
              />
            </div>
          </div>
        </div>

        {/* Target Weight */}
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            น้ำหนักเป้าหมาย (กิโลกรัม)
          </label>
          <input
            type="number"
            min="30"
            max="200"
            step="0.1"
            value={settings.targetWeight}
            onChange={(e) => setSettings({...settings, targetWeight: parseFloat(e.target.value)})}
            disabled={saveLoading}
            style={{
              width: windowWidth <= 768 ? '100%' : '200px',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              opacity: saveLoading ? 0.6 : 1,
              cursor: saveLoading ? 'not-allowed' : 'text'
            }}
          />
        </div>

        {/* Activity Level */}
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            ระดับการออกกำลังกาย
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { id: 'beginner', label: 'มือใหม่', description: 'ไม่มีประสบการณ์หรือออกกำลังกายน้อยกว่า 6 เดือน' },
              { id: 'intermediate', label: 'ปานกลาง', description: 'ออกกำลังกายมา 6 เดือน - 2 ปี' },
              { id: 'advanced', label: 'ขั้นสูง', description: 'ออกกำลังกายมากกว่า 2 ปี และมีประสบการณ์' }
            ].map(level => (
              <button
                key={level.id}
                onClick={() => setSettings({...settings, activityLevel: level.id})}
                disabled={saveLoading}
                style={{
                  padding: '1rem',
                  border: settings.activityLevel === level.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  backgroundColor: settings.activityLevel === level.id ? 'rgba(35, 41, 86, 0.05)' : 'var(--bg-secondary)',
                  cursor: saveLoading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  opacity: saveLoading ? 0.6 : 1
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {level.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {level.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saveLoading}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: saveLoading ? 'not-allowed' : 'pointer',
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: saveLoading ? 0.6 : 1
          }}
        >
          {saveLoading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
          {saveLoading ? 'กำลังบันทึก...' : 'บันทึกเป้าหมาย'}
        </button>
      </div>
    </div>
  );

  const renderSupportSection = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Error Display */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => {
            setError(null);
            window.location.reload();
          }} 
        />
      )}

      {/* FAQ */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          คำถามที่พบบ่อย
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { q: 'ฉันจะเปลี่ยนเทรนเนอร์ได้อย่างไร?', a: 'คุณสามารถติดต่อทีมสนับสนุนเพื่อขอเปลี่ยนเทรนเนอร์ได้' },
            { q: 'การยกเลิกแพคเกจทำอย่างไร?', a: 'สามารถยกเลิกได้ผ่านหน้าจัดการแพคเกจหรือติดต่อทีมสนับสนุน' },
            { q: 'ฉันสามารถเลื่อนเซสชั่นได้กี่ครั้ง?', a: 'สามารถเลื่อนได้ไม่เกิน 3 ครั้งต่อแพคเกจ โดยต้องแจ้งล่วงหน้า 24 ชม.' }
          ].map((faq, index) => (
            <div key={index} style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {faq.q}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          ติดต่อทีมสนับสนุน
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
          gap: '1rem'
        }}>
          <button style={{
            padding: '1rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--bg-secondary)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <MessageCircle size={24} color="var(--primary)" />
            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-primary)' }}>แชทออนไลน์</span>
          </button>

          <button style={{
            padding: '1rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--bg-secondary)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Mail size={24} color="var(--primary)" />
            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-primary)' }}>อีเมล</span>
          </button>

          <button style={{
            padding: '1rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--bg-secondary)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Phone size={24} color="var(--primary)" />
            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-primary)' }}>โทรศัพท์</span>
          </button>
        </div>
      </div>

      {/* Account Deletion */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          ลบบัญชี
        </h3>
        
        <div style={{ 
          padding: '1rem', 
          backgroundColor: 'rgba(245, 101, 101, 0.05)', 
          borderRadius: '0.5rem', 
          border: '1px solid rgba(245, 101, 101, 0.2)', 
          marginBottom: '1rem' 
        }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--danger)', margin: 0 }}>
            การลบบัญชีจะไม่สามารถกู้คืนได้ ข้อมูลทั้งหมดของคุณจะถูกลบอย่างถาวร
          </p>
        </div>

        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={actionLoading}
          style={{
            padding: '1rem',
            border: '1px solid var(--danger)',
            borderRadius: '0.5rem',
            backgroundColor: 'rgba(245, 101, 101, 0.05)',
            cursor: actionLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.875rem',
            color: 'var(--danger)',
            opacity: actionLoading ? 0.6 : 1
          }}
        >
          {actionLoading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />}
          {actionLoading ? 'กำลังลบ...' : 'ลบบัญชี'}
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile': return renderProfileSection();
      case 'preferences': return renderPreferencesSection();
      case 'notifications': return renderNotificationsSection();
      case 'privacy': return renderPrivacySection();
      case 'security': return renderSecuritySection();
      case 'goals': return renderGoalsSection();
      case 'support': return renderSupportSection();
      default: return renderProfileSection();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-secondary)',
      '--primary': '#232956',
      '--accent': '#df2528',
      '--success': '#22c55e',
      '--warning': '#f59e0b',
      '--danger': '#f56565',
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f8fafc',
      '--text-primary': '#1a202c',
      '--text-secondary': '#64748b',
      '--text-white': '#ffffff',
      '--border-color': '#e2e8f0'
    }}>
      <div style={{ padding: windowWidth <= 768 ? '1rem' : '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: windowWidth <= 768 ? '1.5rem' : '1.75rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            marginBottom: '0.5rem' 
          }}>
            การตั้งค่า
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            จัดการข้อมูลส่วนตัว การตั้งค่า และบัญชีของคุณ
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? '1fr' : '300px 1fr',
          gap: '2rem'
        }}>
          {/* Settings Menu */}
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1rem',
            height: 'fit-content'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {settingSections.map(section => {
                const IconComponent = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    style={{
                      padding: '1rem',
                      border: 'none',
                      borderRadius: '0.5rem',
                      backgroundColor: activeSection === section.id ? 'var(--primary)' : 'transparent',
                      color: activeSection === section.id ? 'var(--text-white)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    <IconComponent size={18} />
                    <div>
                      <div>{section.label}</div>
                      {windowWidth > 768 && (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          opacity: 0.7, 
                          marginTop: '0.25rem',
                          color: activeSection === section.id ? 'var(--text-white)' : 'var(--text-secondary)'
                        }}>
                          {section.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertTriangle size={24} color="var(--danger)" />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                ยืนยันการลบบัญชี
              </h3>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              การกระทำนี้ไม่สามารถยกเลิกได้ ข้อมูลทั้งหมดของคุณจะถูกลบอย่างถาวร
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                กรุณายืนยันรหัสผ่าน
              </label>
              <input
                type="password"
                placeholder="รหัสผ่านของคุณ"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  opacity: actionLoading ? 0.6 : 1
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  // Get password from input
                  const password = document.querySelector('input[type="password"]').value;
                  handleDeleteAccount(password);
                }}
                disabled={actionLoading}
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--danger)',
                  color: 'var(--text-white)',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: actionLoading ? 0.6 : 1
                }}
              >
                {actionLoading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                {actionLoading ? 'กำลังลบ...' : 'ลบบัญชี'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSettings;