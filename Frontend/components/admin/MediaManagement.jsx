import React, { useState, useEffect } from 'react';
import { 
  Image, Video, File, Search, Upload, Eye, Download, 
  Trash2, Copy, FolderOpen, Clock, AlertTriangle, 
  CheckCircle, XCircle, RefreshCw, Filter, Calendar,
  MessageSquare, Users, BarChart3, Settings, Bell,
  Archive, Database, Shield, Timer, Activity, Loader
} from 'lucide-react';

const MediaManagement = ({ windowWidth }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('chat');
  const [autoCleanupEnabled, setAutoCleanupEnabled] = useState(true);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  
  // Database connection states
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({
    totalStorage: '0 GB',
    maxStorage: '10 GB',
    totalFiles: 0,
    chatFiles: 0,
    systemFiles: 0,
    expiredFiles: 0,
    expiringFiles: 0,
    activeFiles: 0,
    images: 0,
    videos: 0,
    documents: 0
  });

  // API Functions
  const apiCall = async (url, method = 'GET', data = null) => {
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };

      if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`/api/admin${url}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Fetch media files from database
  const fetchMediaFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCall('/media-files', 'GET');
      
      if (response.success) {
        setMediaFiles(response.data.files);
        setStats(response.data.stats);
      } else {
        throw new Error(response.message || 'Failed to fetch media files');
      }
    } catch (error) {
      setError(error.message);
      console.error('Error fetching media files:', error);
    } finally {
      setLoading(false);
    }
  };

  // Upload file to server
  const uploadFile = async (file, category = 'system') => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      
      const response = await fetch('/api/admin/media-files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh media files list
        await fetchMediaFiles();
        return result.data;
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Delete file from server
  const deleteFile = async (fileId) => {
    try {
      const response = await apiCall(`/media-files/${fileId}`, 'DELETE');
      
      if (response.success) {
        // Remove file from local state
        setMediaFiles(prev => prev.filter(file => file.id !== fileId));
        // Update stats
        await fetchMediaFiles();
        return true;
      } else {
        throw new Error(response.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };

  // Clean up expired files
  const cleanupExpiredFiles = async () => {
    try {
      const response = await apiCall('/media-files/cleanup-expired', 'POST');
      
      if (response.success) {
        // Refresh media files list
        await fetchMediaFiles();
        return response.data;
      } else {
        throw new Error(response.message || 'Cleanup failed');
      }
    } catch (error) {
      console.error('Error cleaning up expired files:', error);
      throw error;
    }
  };

  // Update auto cleanup setting
  const updateAutoCleanupSetting = async (enabled) => {
    try {
      const response = await apiCall('/settings/auto-cleanup', 'PUT', { enabled });
      
      if (response.success) {
        setAutoCleanupEnabled(enabled);
        return true;
      } else {
        throw new Error(response.message || 'Failed to update setting');
      }
    } catch (error) {
      console.error('Error updating auto cleanup setting:', error);
      throw error;
    }
  };

  // Load initial data
  useEffect(() => {
    fetchMediaFiles();
    
    // Load auto cleanup setting
    const loadAutoCleanupSetting = async () => {
      try {
        const response = await apiCall('/settings/auto-cleanup');
        if (response.success) {
          setAutoCleanupEnabled(response.data.enabled);
        }
      } catch (error) {
        console.error('Error loading auto cleanup setting:', error);
      }
    };
    
    loadAutoCleanupSetting();
  }, []);

  // Helper functions
  const addMonths = (date, months) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  };

  const getDaysUntilExpiry = (uploadDate) => {
    const uploaded = new Date(uploadDate);
    const expiry = addMonths(uploaded, 3);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getFileStatus = (uploadDate) => {
    const daysLeft = getDaysUntilExpiry(uploadDate);
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 7) return 'expiring';
    return 'active';
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('th-TH');

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const tabs = [
    { id: 'chat', label: 'ไฟล์แชท', icon: MessageSquare, count: stats.chatFiles },
    { id: 'system', label: 'ไฟล์ระบบ', icon: Settings, count: stats.systemFiles },
    { id: 'expiring', label: 'ใกล้หมดอายุ', icon: Clock, count: stats.expiringFiles },
    { id: 'expired', label: 'หมดอายุ', icon: XCircle, count: stats.expiredFiles }
  ];

  const getMediaIcon = (type) => {
    switch (type) {
      case 'image':
        return <Image size={32} color="var(--success)" />;
      case 'video':
        return <Video size={32} color="var(--warning)" />;
      case 'document':
        return <File size={32} color="var(--info)" />;
      default:
        return <File size={32} color="var(--text-muted)" />;
    }
  };

  const getStatusBadge = (file) => {
    const status = getFileStatus(file.upload_date);
    const daysLeft = getDaysUntilExpiry(file.upload_date);
    
    if (file.category === 'system') {
      return (
        <span style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '1rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          backgroundColor: 'rgba(66, 153, 225, 0.1)',
          color: 'var(--info)'
        }}>
          ระบบ
        </span>
      );
    }

    switch (status) {
      case 'expired':
        return (
          <span style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '1rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger)'
          }}>
            หมดอายุ
          </span>
        );
      case 'expiring':
        return (
          <span style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '1rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            color: 'var(--warning)'
          }}>
            {daysLeft} วัน
          </span>
        );
      case 'active':
        return (
          <span style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '1rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            backgroundColor: 'rgba(72, 187, 120, 0.1)',
            color: 'var(--success)'
          }}>
            {daysLeft} วัน
          </span>
        );
      default:
        return null;
    }
  };

  const filteredFiles = mediaFiles
    .filter(file => {
      // Filter by tab
      if (activeTab === 'chat' && file.category !== 'chat') return false;
      if (activeTab === 'system' && file.category !== 'system') return false;
      if (activeTab === 'expiring' && (file.category !== 'chat' || getFileStatus(file.upload_date) !== 'expiring')) return false;
      if (activeTab === 'expired' && (file.category !== 'chat' || getFileStatus(file.upload_date) !== 'expired')) return false;
      
      // Filter by type
      if (typeFilter !== 'all' && file.file_type !== typeFilter) return false;
      
      // Filter by status (only for chat files)
      if (statusFilter !== 'all' && file.category === 'chat' && getFileStatus(file.upload_date) !== statusFilter) return false;
      
      // Search filter
      return file.original_name.toLowerCase().includes(searchTerm.toLowerCase());
    });

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    for (const file of files) {
      try {
        await uploadFile(file, 'system');
      } catch (error) {
        alert(`Failed to upload ${file.name}: ${error.message}`);
      }
    }
    
    // Reset input
    event.target.value = '';
  };

  const handleDeleteFile = async (fileId) => {
    if (window.confirm('คุณต้องการลบไฟล์นี้หรือไม่?')) {
      try {
        await deleteFile(fileId);
      } catch (error) {
        alert(`Failed to delete file: ${error.message}`);
      }
    }
  };

  const handleCleanupExpired = async () => {
    try {
      const result = await cleanupExpiredFiles();
      setShowCleanupModal(false);
      alert(`ลบไฟล์หมดอายุเรียบร้อยแล้ว: ${result.deletedCount} ไฟล์`);
    } catch (error) {
      alert(`Failed to cleanup expired files: ${error.message}`);
    }
  };

  const handleAutoCleanupToggle = async () => {
    try {
      await updateAutoCleanupSetting(!autoCleanupEnabled);
    } catch (error) {
      alert(`Failed to update auto cleanup setting: ${error.message}`);
    }
  };

  const CleanupModal = () => (
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
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '0.75rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          ล้างไฟล์หมดอายุ
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          พบไฟล์หมดอายุ {stats.expiredFiles} ไฟล์ คุณต้องการลบไฟล์เหล่านี้หรือไม่?
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowCleanupModal(false)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleCleanupExpired}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--danger)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            ลบไฟล์
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <Loader size={48} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูลสื่อและมีเดีย...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '0.75rem',
        border: '1px solid var(--danger)'
      }}>
        <AlertTriangle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>เกิดข้อผิดพลาด</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={fetchMediaFiles}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '1.75rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          marginBottom: '0.5rem' 
        }}>
          สื่อและมีเดีย
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          จัดการไฟล์รูปภาพ วิดีโอ และเอกสาร แยกประเภทไฟล์แชท (หมดอายุ 3 เดือน) และไฟล์ระบบ
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: 'rgba(66, 153, 225, 0.1)',
            borderRadius: '0.75rem',
            padding: '0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <Database size={24} color="var(--info)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {stats.totalFiles}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            ไฟล์ทั้งหมด
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: 'rgba(72, 187, 120, 0.1)',
            borderRadius: '0.75rem',
            padding: '0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <CheckCircle size={24} color="var(--success)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {stats.activeFiles}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            ไฟล์ปกติ
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '0.75rem',
            padding: '0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <Clock size={24} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {stats.expiringFiles}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            ใกล้หมดอายุ
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '0.75rem',
            padding: '0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <XCircle size={24} color="var(--danger)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {stats.expiredFiles}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            หมดอายุแล้ว
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: autoCleanupEnabled ? 'rgba(72, 187, 120, 0.1)' : 'rgba(156, 163, 175, 0.1)',
            borderRadius: '0.75rem',
            padding: '0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <RefreshCw size={24} color={autoCleanupEnabled ? 'var(--success)' : 'var(--text-muted)'} />
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            color: autoCleanupEnabled ? 'var(--success)' : 'var(--text-muted)',
            marginBottom: '0.25rem' 
          }}>
            Auto Cleanup
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {autoCleanupEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
          </div>
        </div>
      </div>

      {/* Auto Cleanup Alert */}
      {stats.expiredFiles > 0 && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--danger)',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="var(--danger)" />
            <div>
              <div style={{ fontWeight: '600', color: 'var(--danger)' }}>
                พบไฟล์หมดอายุ {stats.expiredFiles} ไฟล์
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                ไฟล์แชทที่เก็บไว้เกิน 3 เดือนจะถูกลบอัตโนมัติ
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCleanupModal(true)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--danger)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Trash2 size={16} />
            ล้างไฟล์หมดอายุ
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '2rem',
        overflowX: 'auto'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
            <span style={{
              backgroundColor: activeTab === tab.id ? 'var(--accent)' : 'var(--bg-primary)',
              color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
              padding: '0.125rem 0.5rem',
              borderRadius: '1rem',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search and Controls */}
      <div style={{
        display: 'flex',
        flexDirection: windowWidth <= 768 ? 'column' : 'row',
        gap: '1rem',
        marginBottom: '2rem',
        alignItems: windowWidth <= 768 ? 'stretch' : 'center'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            placeholder="ค้นหาไฟล์..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            minWidth: '120px'
          }}
        >
          <option value="all">ทุกประเภท</option>
          <option value="image">รูปภาพ</option>
          <option value="video">วิดีโอ</option>
          <option value="document">เอกสาร</option>
        </select>

        {(activeTab === 'chat' || activeTab === 'expiring' || activeTab === 'expired') && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              minWidth: '120px'
            }}
          >
            <option value="all">ทุกสถานะ</option>
            <option value="active">ปกติ</option>
            <option value="expiring">ใกล้หมดอายุ</option>
            <option value="expired">หมดอายุ</option>
          </select>
        )}

        {(activeTab === 'chat' || activeTab === 'expiring' || activeTab === 'expired') && (
          <button
            onClick={handleAutoCleanupToggle}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: autoCleanupEnabled ? 'var(--success)' : 'var(--text-muted)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap'
            }}
          >
            <Settings size={16} />
            Auto Clean
          </button>
        )}

        <div style={{ position: 'relative' }}>
          <input
            type="file"
            id="fileUpload"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
          <button
            onClick={() => document.getElementById('fileUpload').click()}
            disabled={uploading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: uploading ? 'var(--text-muted)' : 'var(--accent)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap'
            }}
          >
            {uploading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={16} />}
            {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์'}
          </button>
        </div>
      </div>

      {/* Files Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '1.5rem'
      }}>
        {filteredFiles.map((file) => {
          const status = file.category === 'system' ? 'system' : getFileStatus(file.upload_date);
          
          return (
            <div key={file.id} style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              border: file.category === 'system' 
                ? '1px solid var(--border-color)' 
                : `1px solid ${status === 'expired' ? 'var(--danger)' : status === 'expiring' ? 'var(--warning)' : 'var(--border-color)'}`,
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              opacity: status === 'expired' ? 0.7 : 1,
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              {/* Status Badge */}
              {file.category === 'chat' && (
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  zIndex: 10
                }}>
                  {getStatusBadge(file)}
                </div>
              )}

              {/* File Icon */}
              <div style={{
                height: '140px',
                backgroundColor: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                position: 'relative'
              }}>
                {file.file_type === 'image' && file.file_url ? (
                  <img 
                    src={file.file_url} 
                    alt={file.original_name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.appendChild(getMediaIcon(file.file_type));
                    }}
                  />
                ) : getMediaIcon(file.file_type)}
                
                {file.category === 'chat' && status === 'expired' && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    หมดอายุ
                  </div>
                )}
              </div>
              
              {/* File Info */}
              <div style={{ padding: '1rem' }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem',
                  wordBreak: 'break-word',
                  lineHeight: '1.4'
                }}>
                  {file.original_name}
                </h4>
                
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.5rem'
                }}>
                  {formatFileSize(file.file_size)} • {formatDate(file.upload_date)}
                </div>

                {file.category === 'chat' && file.sender_name && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <MessageSquare size={12} />
                    {file.sender_name}
                  </div>
                )}

                {file.category === 'system' && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--info)',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontWeight: '500'
                  }}>
                    <Shield size={12} />
                    ไฟล์ระบบ - ไม่หมดอายุ
                  </div>
                )}
                
                {file.category === 'chat' && status !== 'expired' && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: status === 'expiring' ? 'var(--warning)' : 'var(--text-muted)',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <Timer size={12} />
                    หมดอายุ: {formatDate(addMonths(new Date(file.upload_date), 3))}
                  </div>
                )}
                
                {/* Actions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <button
                    title="ดู"
                    onClick={() => window.open(file.file_url, '_blank')}
                    style={{
                      padding: '0.375rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.375rem',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    title="ดาวน์โหลด"
                    disabled={file.category === 'chat' && status === 'expired'}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = file.file_url;
                      link.download = file.original_name;
                      link.click();
                    }}
                    style={{
                      padding: '0.375rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.375rem',
                      color: (file.category === 'chat' && status === 'expired') ? 'var(--text-muted)' : 'var(--text-secondary)',
                      cursor: (file.category === 'chat' && status === 'expired') ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: (file.category === 'chat' && status === 'expired') ? 0.5 : 1
                    }}
                  >
                    <Download size={14} />
                  </button>
                  <button
                    title="คัดลอกลิงก์"
                    disabled={file.category === 'chat' && status === 'expired'}
                    onClick={() => {
                      navigator.clipboard.writeText(file.file_url);
                      alert('คัดลอกลิงก์เรียบร้อยแล้ว');
                    }}
                    style={{
                      padding: '0.375rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.375rem',
                      color: (file.category === 'chat' && status === 'expired') ? 'var(--text-muted)' : 'var(--text-secondary)',
                      cursor: (file.category === 'chat' && status === 'expired') ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: (file.category === 'chat' && status === 'expired') ? 0.5 : 1
                    }}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    title="ลบ"
                    onClick={() => handleDeleteFile(file.id)}
                    style={{
                      padding: '0.375rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--danger)',
                      borderRadius: '0.375rem',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFiles.length === 0 && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: 'var(--text-muted)'
        }}>
          {activeTab === 'chat' && <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />}
          {activeTab === 'system' && <Settings size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />}
          {(activeTab === 'expiring' || activeTab === 'expired') && <Clock size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />}
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            {activeTab === 'chat' && 'ไม่พบไฟล์แชท'}
            {activeTab === 'system' && 'ไม่พบไฟล์ระบบ'}
            {activeTab === 'expiring' && 'ไม่มีไฟล์ใกล้หมดอายุ'}
            {activeTab === 'expired' && 'ไม่มีไฟล์หมดอายุ'}
          </h3>
          <p>
            {activeTab === 'chat' && 'ไฟล์ที่ส่งในแชทจะแสดงที่นี่'}
            {activeTab === 'system' && 'ไฟล์ระบบ เช่น โลโก้ แบนเนอร์ จะแสดงที่นี่'}
            {(activeTab === 'expiring' || activeTab === 'expired') && 'ลองปรับเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง'}
          </p>
        </div>
      )}

      {showCleanupModal && <CleanupModal />}
    </div>
  );
};

export default MediaManagement;