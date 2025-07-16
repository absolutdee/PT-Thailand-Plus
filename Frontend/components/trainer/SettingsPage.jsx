import React, { useState, useEffect } from 'react';
import { 
  Bell, Shield, Globe, Moon, Sun, Smartphone,
  Mail, MessageSquare, Calendar, Lock, Eye, EyeOff, Key,
  Trash2, Download, Upload, RefreshCw, Check, X, AlertTriangle,
  Loader
} from 'lucide-react';

const SettingsPage = ({ windowWidth }) => {
  const [activeTab, setActiveTab] = useState('notifications');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // เพิ่ม loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [settings, setSettings] = useState({
    notifications: {
      email: {
        newBooking: true,
        paymentReceived: true,
        sessionReminder: true,
        clientMessage: true,
        weeklyReport: false,
        marketing: false
      },
      push: {
        newBooking: true,
        paymentReceived: true,
        sessionReminder: true,
        clientMessage: true,
        weeklyReport: true,
        marketing: false
      },
      sms: {
        sessionReminder: true,
        paymentReceived: false,
        clientMessage: false
      }
    },
    privacy: {
      profileVisibility: 'public',
      showPhone: true,
      showEmail: false,
      showLocation: true,
      allowDirectBooking: true,
      requireApproval: false,
      dataCollection: true,
      analytics: true
    },
    appearance: {
      theme: 'light',
      language: 'th',
      fontSize: 'medium',
      compactMode: false
    },
    security: {
      twoFactorAuth: false,
      loginAlerts: true,
      sessionTimeout: 30
    }
  });

  // โหลดข้อมูลการตั้งค่าจากฐานข้อมูล
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        const response = await fetch('/api/trainer/settings', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดข้อมูลการตั้งค่าได้');
        }

        const data = await response.json();
        
        if (data.success && data.settings) {
          setSettings(prevSettings => ({
            ...prevSettings,
            ...data.settings
          }));
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // บันทึกการตั้งค่าไปยังฐานข้อมูล
  const saveSettings = async (updatedSettings) => {
    try {
      setIsSaving(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/trainer/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: updatedSettings })
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถบันทึกการตั้งค่าได้');
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('บันทึกการตั้งค่าเรียบร้อย');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // เปลี่ยนรหัสผ่าน
  const changePassword = async () => {
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('รหัสผ่านใหม่ไม่ตรงกัน');
        return;
      }

      if (newPassword.length < 6) {
        setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
      }

      setIsSaving(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/trainer/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
      }

      setSuccessMessage('เปลี่ยนรหัสผ่านเรียบร้อย');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ส่งออกข้อมูล
  const exportData = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/trainer/export-data', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถส่งออกข้อมูลได้');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trainer_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccessMessage('ส่งออกข้อมูลเรียบร้อย');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ลบบัญชี
  const deleteAccount = async (confirmText) => {
    try {
      if (confirmText !== 'ลบบัญชี') {
        setError('กรุณาพิมพ์ "ลบบัญชี" เพื่อยืนยัน');
        return;
      }

      setIsSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/trainer/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถลบบัญชีได้');
      }

      // ลบ token และ redirect ไปหน้า login
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err.message);
      setIsSaving(false);
    }
  };

  // Switch Component
  const Switch = ({ checked, onChange, disabled = false }) => (
    <div 
      onClick={() => !disabled && !isSaving && onChange(!checked)}
      style={{
        width: '3rem',
        height: '1.5rem',
        backgroundColor: checked ? '#df2528' : '#d1d5db',
        borderRadius: '0.75rem',
        position: 'relative',
        cursor: (disabled || isSaving) ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s',
        opacity: (disabled || isSaving) ? 0.5 : 1
      }}
    >
      <div style={{
        width: '1.25rem',
        height: '1.25rem',
        backgroundColor: 'white',
        borderRadius: '50%',
        position: 'absolute',
        top: '0.125rem',
        left: checked ? '1.625rem' : '0.125rem',
        transition: 'left 0.2s',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
      }} />
    </div>
  );

  const handleSettingChange = async (category, setting, value) => {
    const updatedSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: value
      }
    };
    
    setSettings(updatedSettings);
    await saveSettings(updatedSettings);
  };

  const handleNestedSettingChange = async (category, subcategory, setting, value) => {
    const updatedSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [subcategory]: {
          ...settings[category][subcategory],
          [setting]: value
        }
      }
    };
    
    setSettings(updatedSettings);
    await saveSettings(updatedSettings);
  };

  // Alert Component
  const Alert = ({ type, message, onClose }) => {
    if (!message) return null;
    
    const bgColor = type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)';
    const borderColor = type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)';
    const textColor = type === 'error' ? '#ef4444' : '#22c55e';
    const icon = type === 'error' ? <X size={16} /> : <Check size={16} />;

    return (
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 1000,
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '0.5rem',
        padding: '1rem',
        maxWidth: '400px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: textColor,
        fontSize: '0.875rem',
        fontWeight: '500'
      }}>
        {icon}
        {message}
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: textColor,
            cursor: 'pointer',
            marginLeft: '0.5rem'
          }}
        >
          <X size={16} />
        </button>
      </div>
    );
  };

  const DeleteAccountModal = () => {
    const [confirmText, setConfirmText] = useState('');
    
    if (!showDeleteModal) return null;

    return (
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
        zIndex: 100,
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={24} style={{ color: 'var(--danger)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                ลบบัญชีผู้ใช้
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
          </div>
          
          <div style={{ padding: '1.5rem' }}>
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--danger)', marginBottom: '0.5rem' }}>
                ข้อมูลที่จะถูกลบ:
              </h4>
              <ul style={{ fontSize: '0.875rem', color: 'var(--danger)', paddingLeft: '1rem', margin: 0 }}>
                <li>ข้อมูลส่วนตัวและโปรไฟล์ทั้งหมด</li>
                <li>ประวัติการทำงานและลูกค้า</li>
                <li>รูปภาพและเอกสารที่อัพโหลด</li>
                <li>ข้อมูลการเงินและรายได้</li>
                <li>การตั้งค่าและความชอบ</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                พิมพ์ "ลบบัญชี" เพื่อยืนยัน
              </label>
              <input
                type="text"
                placeholder="ลบบัญชี"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--bg-secondary)',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmText('');
                }}
                disabled={isSaving}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  opacity: isSaving ? 0.5 : 1
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => deleteAccount(confirmText)}
                disabled={isSaving}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  backgroundColor: 'var(--danger)',
                  color: 'var(--text-white)',
                  border: 'none',
                  opacity: isSaving ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {isSaving && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                ลบบัญชีถาวร
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNotifications = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Email Notifications */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.75rem',
            backgroundColor: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Mail size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              การแจ้งเตือนทางอีเมล
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              จัดการการแจ้งเตือนที่ส่งไปยังอีเมลของคุณ
            </p>
          </div>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { key: 'newBooking', label: 'การจองใหม่', description: 'เมื่อมีลูกค้าจองเซสชัน' },
              { key: 'paymentReceived', label: 'ได้รับการชำระเงิน', description: 'เมื่อได้รับการชำระเงินจากลูกค้า' },
              { key: 'sessionReminder', label: 'เตือนเซสชัน', description: 'เตือนก่อนเซสชัน 1 ชั่วโมง' },
              { key: 'clientMessage', label: 'ข้อความจากลูกค้า', description: 'เมื่อได้รับข้อความจากลูกค้า' },
              { key: 'weeklyReport', label: 'รายงานรายสัปดาห์', description: 'สรุปผลงานประจำสัปดาห์' },
              { key: 'marketing', label: 'ข่าวสารและโปรโมชัน', description: 'ข้อมูลข่าวสารจาก FitConnect' }
            ].map((item) => (
              <div key={item.key} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {item.description}
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.email[item.key]}
                  onChange={(checked) => handleNestedSettingChange('notifications', 'email', item.key, checked)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Push Notifications */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.75rem',
            backgroundColor: '#df2528',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Smartphone size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              การแจ้งเตือนบนมือถือ
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              การแจ้งเตือนแบบ Push Notification
            </p>
          </div>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { key: 'newBooking', label: 'การจองใหม่' },
              { key: 'paymentReceived', label: 'ได้รับการชำระเงิน' },
              { key: 'sessionReminder', label: 'เตือนเซสชัน' },
              { key: 'clientMessage', label: 'ข้อความจากลูกค้า' },
              { key: 'weeklyReport', label: 'รายงานรายสัปดาห์' }
            ].map((item) => (
              <div key={item.key} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {item.label}
                </span>
                <Switch
                  checked={settings.notifications.push[item.key]}
                  onChange={(checked) => handleNestedSettingChange('notifications', 'push', item.key, checked)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SMS Notifications */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.75rem',
            backgroundColor: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              การแจ้งเตือนทาง SMS
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              การแจ้งเตือนผ่านข้อความ SMS
            </p>
          </div>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { key: 'sessionReminder', label: 'เตือนเซสชัน', description: 'เตือนก่อนเซสชัน 30 นาที' },
              { key: 'paymentReceived', label: 'ได้รับการชำระเงิน', description: 'แจ้งเตือนเมื่อได้รับเงิน' },
              { key: 'clientMessage', label: 'ข้อความจากลูกค้า', description: 'แจ้งข้อความด่วน' }
            ].map((item) => (
              <div key={item.key} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {item.description}
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.sms[item.key]}
                  onChange={(checked) => handleNestedSettingChange('notifications', 'sms', item.key, checked)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Profile Visibility */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.75rem',
            backgroundColor: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Eye size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              การมองเห็นโปรไฟล์
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              ควบคุมใครสามารถเห็นโปรไฟล์ของคุณได้
            </p>
          </div>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { value: 'public', label: 'สาธารณะ', description: 'ทุกคนสามารถเห็นโปรไฟล์ได้' },
              { value: 'private', label: 'ส่วนตัว', description: 'เฉพาะลูกค้าที่อนุมัติแล้วเท่านั้น' }
            ].map((option) => (
              <label key={option.value} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: settings.privacy.profileVisibility === option.value ? 'rgba(223, 37, 40, 0.1)' : 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                border: settings.privacy.profileVisibility === option.value ? '1px solid #df2528' : '1px solid var(--border-color)',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.5 : 1
              }}>
                <input
                  type="radio"
                  name="profileVisibility"
                  value={option.value}
                  checked={settings.privacy.profileVisibility === option.value}
                  onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                  disabled={isSaving}
                  style={{ transform: 'scale(1.2)' }}
                />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
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
      </div>

      {/* Contact Information */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.75rem',
            backgroundColor: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Shield size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              ข้อมูลติดต่อ
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              เลือกข้อมูลที่จะแสดงในโปรไฟล์
            </p>
          </div>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { key: 'showPhone', label: 'แสดงเบอร์โทรศัพท์', description: 'ลูกค้าสามารถเห็นเบอร์โทรศัพท์ได้' },
              { key: 'showEmail', label: 'แสดงอีเมล', description: 'ลูกค้าสามารถเห็นอีเมลได้' },
              { key: 'showLocation', label: 'แสดงที่อยู่', description: 'แสดงพื้นที่ให้บริการ' },
              { key: 'allowDirectBooking', label: 'อนุญาตการจองโดยตรง', description: 'ลูกค้าสามารถจองได้ทันที' },
              { key: 'requireApproval', label: 'ต้องอนุมัติก่อนจอง', description: 'ต้องอนุมัติคำขอจองก่อน' }
            ].map((item) => (
              <div key={item.key} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {item.description}
                  </div>
                </div>
                <Switch
                  checked={settings.privacy[item.key]}
                  onChange={(checked) => handleSettingChange('privacy', item.key, checked)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Collection */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.75rem',
            backgroundColor: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Globe size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              การเก็บข้อมูล
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              จัดการการเก็บรวบรวมข้อมูลเพื่อปรับปรุงบริการ
            </p>
          </div>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  อนุญาตการเก็บข้อมูล
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  เก็บข้อมูลการใช้งานเพื่อปรับปรุงบริการ
                </div>
              </div>
              <Switch
                checked={settings.privacy.dataCollection}
                onChange={(checked) => handleSettingChange('privacy', 'dataCollection', checked)}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  การวิเคราะห์ข้อมูล
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  วิเคราะห์พฤติกรรมการใช้งานเพื่อให้คำแนะนำ
                </div>
              </div>
              <Switch
                checked={settings.privacy.analytics}
                onChange={(checked) => handleSettingChange('privacy', 'analytics', checked)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.75rem',
            backgroundColor: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Lock size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              ความปลอดภัย
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              การตั้งค่าความปลอดภัยบัญชี
            </p>
          </div>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  ยืนยันตัวตนสองขั้นตอน
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  เพิ่มความปลอดภัยด้วย SMS หรือ Authentication App
                </div>
              </div>
              <Switch
                checked={settings.security.twoFactorAuth}
                onChange={(checked) => handleSettingChange('security', 'twoFactorAuth', checked)}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  แจ้งเตือนการเข้าสู่ระบบ
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  แจ้งเตือนเมื่อมีการเข้าสู่ระบบจากอุปกรณ์ใหม่
                </div>
              </div>
              <Switch
                checked={settings.security.loginAlerts}
                onChange={(checked) => handleSettingChange('security', 'loginAlerts', checked)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccount = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Change Password */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.75rem',
            backgroundColor: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Key size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              เปลี่ยนรหัสผ่าน
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              อัพเดทรหัสผ่านเพื่อความปลอดภัย
            </p>
          </div>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              changePassword();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                รหัสผ่านปัจจุบัน
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '0.75rem 3rem 0.75rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-secondary)',
                    outline: 'none',
                    opacity: isSaving ? 0.5 : 1
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={isSaving}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    color: 'var(--text-secondary)',
                    opacity: isSaving ? 0.5 : 1
                  }}
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                รหัสผ่านใหม่
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '0.75rem 3rem 0.75rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-secondary)',
                    outline: 'none',
                    opacity: isSaving ? 0.5 : 1
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isSaving}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    color: 'var(--text-secondary)',
                    opacity: isSaving ? 0.5 : 1
                  }}
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                ยืนยันรหัสผ่านใหม่
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '0.75rem 3rem 0.75rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-secondary)',
                    outline: 'none',
                    opacity: isSaving ? 0.5 : 1
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSaving}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    color: 'var(--text-secondary)',
                    opacity: isSaving ? 0.5 : 1
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                backgroundColor: '#df2528',
                color: 'white',
                border: 'none',
                alignSelf: 'flex-start',
                opacity: isSaving ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isSaving && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              เปลี่ยนรหัสผ่าน
            </button>
          </form>
        </div>
      </div>

      {/* Appearance Settings */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.75rem',
            backgroundColor: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Sun size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              การแสดงผล
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              ปรับแต่งรูปแบบการแสดงผล
            </p>
          </div>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  โหมดกะทัดรัด
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  แสดงข้อมูลในรูปแบบที่กะทัดรัด
                </div>
              </div>
              <Switch
                checked={settings.appearance.compactMode}
                onChange={(checked) => handleSettingChange('appearance', 'compactMode', checked)}
              />
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  ธีมสี
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  เลือกธีมสีที่ต้องการ
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { value: 'light', label: 'สว่าง', icon: Sun },
                  { value: 'dark', label: 'มืด', icon: Moon },
                  { value: 'auto', label: 'อัตโนมัติ', icon: Smartphone }
                ].map((theme) => (
                  <label key={theme.value} style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '1rem',
                    backgroundColor: settings.appearance.theme === theme.value ? 'rgba(223, 37, 40, 0.1)' : 'var(--bg-primary)',
                    borderRadius: '0.5rem',
                    border: settings.appearance.theme === theme.value ? '1px solid #df2528' : '1px solid var(--border-color)',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    textAlign: 'center',
                    opacity: isSaving ? 0.5 : 1
                  }}>
                    <input
                      type="radio"
                      name="theme"
                      value={theme.value}
                      checked={settings.appearance.theme === theme.value}
                      onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                      disabled={isSaving}
                      style={{ display: 'none' }}
                    />
                    <theme.icon size={20} style={{ color: 'var(--text-primary)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                      {theme.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.75rem',
            backgroundColor: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Download size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              ส่งออกข้อมูล
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              ดาวน์โหลดข้อมูลทั้งหมดของคุณ
            </p>
          </div>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                ข้อมูลที่จะส่งออก:
              </h4>
              <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1rem', margin: 0 }}>
                <li>ข้อมูลส่วนตัวและโปรไฟล์</li>
                <li>ประวัติการทำงานและลูกค้า</li>
                <li>ข้อมูลการเงินและรายได้</li>
                <li>รูปภาพและเอกสาร</li>
                <li>การตั้งค่าและความชอบ</li>
              </ul>
            </div>
            <button 
              onClick={exportData}
              disabled={isSaving}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: isSaving ? 0.5 : 1
              }}
            >
              {isSaving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
              ส่งออกข้อมูล
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.75rem',
            backgroundColor: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Trash2 size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#ef4444' }}>
              ลบบัญชีผู้ใช้
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              ลบบัญชีและข้อมูลทั้งหมดอย่างถาวร
            </p>
          </div>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            marginBottom: '1rem'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#ef4444', margin: 0 }}>
              <strong>คำเตือน:</strong> การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลทั้งหมดจะถูกลบออกจากระบบอย่างถาวร
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={isSaving}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: isSaving ? 0.5 : 1
            }}
          >
            <Trash2 size={16} />
            ลบบัญชีถาวร
          </button>
        </div>
      </div>
    </div>
  );

  // แสดง Loading Screen ขณะโหลดข้อมูล
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '1rem'
      }}>
        <Loader size={48} style={{ 
          color: '#df2528',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          กำลังโหลดการตั้งค่า...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Alert Messages */}
      <Alert 
        type="error" 
        message={error} 
        onClose={() => setError(null)} 
      />
      <Alert 
        type="success" 
        message={successMessage} 
        onClose={() => setSuccessMessage('')} 
      />

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          การตั้งค่า
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          จัดการการตั้งค่าบัญชีและความเป็นส่วนตัว
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        marginBottom: '2rem',
        overflow: 'hidden'
      }}>
        {[
          { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
          { id: 'privacy', label: 'ความเป็นส่วนตัว', icon: Shield },
          { id: 'account', label: 'บัญชีผู้ใช้', icon: Lock }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            disabled={isSaving}
            style={{
              flex: 1,
              padding: '1rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              backgroundColor: activeTab === tab.id ? '#df2528' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: isSaving ? 0.5 : 1
            }}
          >
            <tab.icon size={16} />
            {windowWidth > 480 ? tab.label : ''}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'notifications' && renderNotifications()}
      {activeTab === 'privacy' && renderPrivacy()}
      {activeTab === 'account' && renderAccount()}

      <DeleteAccountModal />

      {/* Loading Overlay */}
      {isSaving && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99,
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <Loader size={48} style={{ 
            color: '#df2528',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: 'white', fontSize: '0.875rem' }}>
            กำลังบันทึก...
          </p>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;