import React, { useState, useEffect } from 'react';

// Bootstrap Icons Component
const BootstrapIcon = ({ name, size = 16, color, style = {} }) => (
  <i 
    className={`bi bi-${name}`} 
    style={{ 
      fontSize: `${size}px`, 
      color: color,
      ...style 
    }}
  />
);

// API Functions for database operations
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = {
  // Coupons API
  coupons: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${API_BASE_URL}/coupons?${params}`);
      if (!response.ok) throw new Error('Failed to fetch coupons');
      return response.json();
    },
    getById: async (id) => {
      const response = await fetch(`${API_BASE_URL}/coupons/${id}`);
      if (!response.ok) throw new Error('Failed to fetch coupon');
      return response.json();
    },
    create: async (couponData) => {
      const response = await fetch(`${API_BASE_URL}/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponData)
      });
      if (!response.ok) throw new Error('Failed to create coupon');
      return response.json();
    },
    update: async (id, couponData) => {
      const response = await fetch(`${API_BASE_URL}/coupons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponData)
      });
      if (!response.ok) throw new Error('Failed to update coupon');
      return response.json();
    },
    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/coupons/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete coupon');
      return response.json();
    },
    getStats: async () => {
      const response = await fetch(`${API_BASE_URL}/coupons/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    getAnalytics: async (dateRange = '7days') => {
      const response = await fetch(`${API_BASE_URL}/coupons/analytics?range=${dateRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  },
  
  // Settings API
  settings: {
    get: async () => {
      const response = await fetch(`${API_BASE_URL}/settings/coupons`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
    update: async (settingsData) => {
      const response = await fetch(`${API_BASE_URL}/settings/coupons`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    }
  }
};

const CouponManagement = ({ windowWidth }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('created_desc');
  const [selectedDateRange, setSelectedDateRange] = useState('7days');

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Data from database
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    totalUsage: 0,
    totalSavings: 0,
    totalRevenue: 0,
    avgConversionRate: 0,
    topPerformers: 0
  });
  const [analytics, setAnalytics] = useState({
    usageTrends: [],
    topPerformers: [],
    performanceMetrics: {}
  });

  // Add Bootstrap Icons CSS if not already included
  useEffect(() => {
    if (!document.querySelector('link[href*="bootstrap-icons"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
      document.head.appendChild(link);
    }
  }, []);

  // Form state for coupon creation/editing
  const [couponForm, setCouponForm] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: '',
    minAmount: '',
    maxDiscount: '',
    usageLimit: '',
    startDate: '',
    endDate: '',
    scope: 'all_trainers',
    targetUsers: 'all_users',
    isActive: true
  });

  // Settings state
  const [systemSettings, setSystemSettings] = useState({
    general: {
      allowMultipleCoupons: false,
      requireMinimumAmount: true,
      enableFraudDetection: true,
      autoExpireCoupons: true,
      notifyBeforeExpiry: true,
      expiryNotificationDays: 3
    },
    limits: {
      maxCouponsPerUser: 5,
      maxDiscountPercentage: 80,
      maxDiscountAmount: 5000,
      maxUsageLimit: 10000,
      maxValidityDays: 365
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      webhookEnabled: false
    }
  });

  // Apply CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', '#232956');
    root.style.setProperty('--accent', '#df2528');
    root.style.setProperty('--success', '#10b981');
    root.style.setProperty('--warning', '#f59e0b');
    root.style.setProperty('--danger', '#ef4444');
    root.style.setProperty('--info', '#3b82f6');
    root.style.setProperty('--bg-primary', '#f8fafc');
    root.style.setProperty('--bg-secondary', '#ffffff');
    root.style.setProperty('--text-primary', '#1f2937');
    root.style.setProperty('--text-secondary', '#6b7280');
    root.style.setProperty('--text-muted', '#9ca3af');
    root.style.setProperty('--border-color', '#e5e7eb');
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchCoupons();
    fetchStats();
    fetchAnalytics();
    fetchSettings();
  }, []);

  // Fetch coupons with filters
  useEffect(() => {
    const filters = {};
    if (searchTerm) filters.search = searchTerm;
    if (filterStatus !== 'all') filters.status = filterStatus;
    if (filterType !== 'all') filters.type = filterType;
    if (sortBy) filters.sortBy = sortBy;
    
    const debounceTimer = setTimeout(() => {
      fetchCoupons(filters);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, filterStatus, filterType, sortBy]);

  // Fetch analytics when date range changes
  useEffect(() => {
    fetchAnalytics();
  }, [selectedDateRange]);

  // Database fetch functions
  const fetchCoupons = async (filters = {}) => {
    try {
      setCouponsLoading(true);
      setError(null);
      const data = await api.coupons.getAll(filters);
      setCoupons(data);
    } catch (err) {
      setError('ไม่สามารถโหลดคูปองได้: ' + err.message);
      console.error('Error fetching coupons:', err);
    } finally {
      setCouponsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const data = await api.coupons.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('ไม่สามารถโหลดสถิติได้: ' + err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const data = await api.coupons.getAnalytics(selectedDateRange);
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('ไม่สามารถโหลดข้อมูลวิเคราะห์ได้: ' + err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await api.settings.get();
      setSystemSettings(data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      await api.settings.update(systemSettings);
      setError(null);
      alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    } catch (err) {
      setError('ไม่สามารถบันทึกการตั้งค่าได้: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatCurrency = (amount) => `฿${amount.toLocaleString()}`;
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('th-TH');
  const formatPercent = (value) => `${value}%`;

  // Admin tabs
  const adminTabs = [
    { id: 'overview', label: 'ภาพรวม', icon: 'bar-chart' },
    { id: 'coupons', label: 'จัดการคูปอง', icon: 'tag' },
    { id: 'analytics', label: 'รายงาน', icon: 'graph-up' },
    { id: 'settings', label: 'ตั้งค่า', icon: 'gear' }
  ];

  // CRUD Functions with API integration
  const handleAddCoupon = () => {
    setEditingCoupon(null);
    setCouponForm({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: '',
      minAmount: '',
      maxDiscount: '',
      usageLimit: '',
      startDate: '',
      endDate: '',
      scope: 'all_trainers',
      targetUsers: 'all_users',
      isActive: true
    });
    setShowCreateModal(true);
  };

  const handleEditCoupon = async (coupon) => {
    try {
      setLoading(true);
      const fullCoupon = await api.coupons.getById(coupon.id);
      
      setEditingCoupon(fullCoupon);
      setCouponForm({
        code: fullCoupon.code,
        name: fullCoupon.name,
        description: fullCoupon.description,
        type: fullCoupon.type,
        value: fullCoupon.value,
        minAmount: fullCoupon.minAmount,
        maxDiscount: fullCoupon.maxDiscount,
        usageLimit: fullCoupon.usageLimit,
        startDate: fullCoupon.startDate,
        endDate: fullCoupon.endDate,
        scope: fullCoupon.scope,
        targetUsers: fullCoupon.targetUsers,
        isActive: fullCoupon.status === 'active'
      });
      setShowCreateModal(true);
      setError(null);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลคูปองได้: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCoupon = async () => {
    if (!couponForm.code.trim() || !couponForm.name.trim()) {
      alert('กรุณากรอกรหัสคูปองและชื่อคูปอง');
      return;
    }

    try {
      setLoading(true);
      const couponData = {
        ...couponForm,
        status: couponForm.isActive ? 'active' : 'inactive',
        value: parseFloat(couponForm.value) || 0,
        minAmount: parseFloat(couponForm.minAmount) || 0,
        maxDiscount: parseFloat(couponForm.maxDiscount) || 0,
        usageLimit: parseInt(couponForm.usageLimit) || 0
      };

      if (editingCoupon) {
        await api.coupons.update(editingCoupon.id, couponData);
      } else {
        await api.coupons.create(couponData);
      }

      await fetchCoupons();
      await fetchStats();
      setShowCreateModal(false);
      setError(null);
      alert(`คูปอง${editingCoupon ? 'แก้ไข' : 'สร้าง'}เรียบร้อยแล้ว`);
    } catch (err) {
      setError(`ไม่สามารถ${editingCoupon ? 'แก้ไข' : 'สร้าง'}คูปองได้: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = (coupon) => {
    setDeleteTarget(coupon);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setLoading(true);
      await api.coupons.delete(deleteTarget.id);
      await fetchCoupons();
      await fetchStats();
      setShowDeleteModal(false);
      setDeleteTarget(null);
      setError(null);
      alert('ลบคูปองเรียบร้อยแล้ว');
    } catch (err) {
      setError('ไม่สามารถลบคูปองได้: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Analytics calculations from API data
  const getAnalyticsData = () => {
    return {
      totalCoupons: stats.totalCoupons || 0,
      activeCoupons: stats.activeCoupons || 0,
      totalUsage: stats.totalUsage || 0,
      totalSavings: stats.totalSavings || 0,
      totalRevenue: stats.totalRevenue || 0,
      avgConversionRate: stats.avgConversionRate || 0,
      topPerformers: stats.topPerformers || 0
    };
  };

  // Modal Component
  const Modal = ({ show, onClose, title, children }) => {
    if (!show) return null;

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
        zIndex: 1000,
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
            >
              <BootstrapIcon name="x" size={20} />
            </button>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {children}
          </div>
        </div>
      </div>
    );
  };

  // Loading Spinner Component
  const LoadingSpinner = ({ size = 16 }) => (
    <BootstrapIcon 
      name="arrow-clockwise" 
      size={size} 
      style={{ 
        animation: 'spin 1s linear infinite',
        ...{ '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }
      }} 
    />
  );

  // Error Message Component
  const ErrorMessage = ({ message, onDismiss }) => {
    if (!message) return null;

    return (
      <div style={{
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        padding: '1rem',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        border: '1px solid #fecaca',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BootstrapIcon name="exclamation-triangle-fill" size={16} />
          {message}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <BootstrapIcon name="x" size={16} />
          </button>
        )}
      </div>
    );
  };

  // Admin Overview Component
  const AdminOverview = () => {
    const analyticsData = getAnalyticsData();

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Error Message */}
        <ErrorMessage message={error} onDismiss={() => setError(null)} />

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '1rem',
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(35, 41, 86, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <BootstrapIcon name="tag" size={24} color="var(--primary)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.5rem' }}>
              {statsLoading ? <LoadingSpinner size={24} /> : analyticsData.totalCoupons}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>คูปองทั้งหมด</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
              +12% จากเดือนที่แล้ว
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '1rem',
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <BootstrapIcon name="activity" size={24} color="var(--success)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.5rem' }}>
              {statsLoading ? <LoadingSpinner size={24} /> : analyticsData.totalUsage}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>การใช้งานรวม</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
              +28% จากสัปดาห์ที่แล้ว
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '1rem',
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(223, 37, 40, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <BootstrapIcon name="graph-up" size={24} color="var(--accent)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '0.5rem' }}>
              {statsLoading ? <LoadingSpinner size={24} /> : formatCurrency(analyticsData.totalRevenue)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>รายได้รวม</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
              +35% จากเดือนที่แล้ว
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '1rem',
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <BootstrapIcon name="percent" size={24} color="var(--warning)" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--warning)', marginBottom: '0.5rem' }}>
              {statsLoading ? <LoadingSpinner size={24} /> : `${analyticsData.avgConversionRate.toFixed(1)}%`}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>อัตราแปลงเฉลี่ย</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
              +5.2% จากเดือนที่แล้ว
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
          gap: '1rem'
        }}>
          <button
            onClick={handleAddCoupon}
            disabled={loading}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '1rem',
              padding: '1.5rem',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.borderColor = 'var(--accent)'}
            onMouseOut={(e) => e.target.style.borderColor = 'var(--border-color)'}
          >
            <BootstrapIcon name="plus-lg" size={32} color="var(--accent)" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              สร้างคูปองใหม่
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              เพิ่มโปรโมชั่นใหม่เพื่อดึงดูดลูกค้า
            </div>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '1rem',
              padding: '1.5rem',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.borderColor = 'var(--primary)'}
            onMouseOut={(e) => e.target.style.borderColor = 'var(--border-color)'}
          >
            <BootstrapIcon name="tag" size={32} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              จัดการคูปอง
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              ดู แก้ไข และจัดการคูปองทั้งหมด
            </div>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '1rem',
              padding: '1.5rem',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.borderColor = 'var(--success)'}
            onMouseOut={(e) => e.target.style.borderColor = 'var(--border-color)'}
          >
            <BootstrapIcon name="bar-chart" size={32} color="var(--success)" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              ดูรายงาน
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              วิเคราะห์ประสิทธิภาพคูปอง
            </div>
          </button>
        </div>

        {/* Popular Coupons */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              🏆 คูปองยอดนิยม
            </h3>
            {couponsLoading && <LoadingSpinner size={20} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {couponsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <LoadingSpinner size={24} />
                <div style={{ marginTop: '0.5rem' }}>กำลังโหลดข้อมูล...</div>
              </div>
            ) : (
              coupons
                .filter(c => c.status === 'active')
                .sort((a, b) => (b.usedCount || 0) - (a.usedCount || 0))
                .slice(0, 3)
                .map((coupon, index) => (
                <div key={coupon.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    backgroundColor: index === 0 ? 'var(--warning)' : index === 1 ? 'var(--text-secondary)' : 'var(--info)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700'
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {coupon.code}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      ใช้แล้ว {coupon.usedCount || 0} ครั้ง • อัตราแปลง {coupon.conversionRate || 0}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: 'var(--accent)' }}>
                      {coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      ส่วนลด
                    </div>
                  </div>
                </div>
              ))
            )}
            {!couponsLoading && coupons.filter(c => c.status === 'active').length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                ยังไม่มีคูปองที่ใช้งาน
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Coupon Management Component
  const CouponManagementComponent = () => {
    const filteredCoupons = coupons.filter(coupon => {
      const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (coupon.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || coupon.status === filterStatus;
      const matchesType = filterType === 'all' || coupon.type === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Error Message */}
        <ErrorMessage message={error} onDismiss={() => setError(null)} />

        {/* Search and Filters */}
        <div style={{
          display: 'flex',
          flexDirection: windowWidth <= 768 ? 'column' : 'row',
          gap: '1rem',
          alignItems: windowWidth <= 768 ? 'stretch' : 'center'
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <BootstrapIcon 
              name="search" 
              size={16} 
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} 
            />
            <input
              type="text"
              placeholder="ค้นหาคูปอง..."
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              minWidth: '140px'
            }}
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="active">ใช้งาน</option>
            <option value="inactive">ไม่ใช้งาน</option>
            <option value="expired">หมดอายุ</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              minWidth: '140px'
            }}
          >
            <option value="all">ประเภททั้งหมด</option>
            <option value="percentage">เปอร์เซ็นต์</option>
            <option value="fixed_amount">จำนวนคงที่</option>
          </select>
          <button 
            onClick={handleAddCoupon}
            disabled={loading}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? <LoadingSpinner size={16} /> : <BootstrapIcon name="plus-lg" size={16} />}
            เพิ่มคูปอง
          </button>
          <button
            onClick={() => fetchCoupons()}
            disabled={loading || couponsLoading}
            style={{
              padding: '0.75rem',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {couponsLoading ? <LoadingSpinner size={16} /> : <BootstrapIcon name="arrow-clockwise" size={16} />}
          </button>
        </div>

        {/* Loading State */}
        {couponsLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '3rem',
            color: 'var(--text-muted)'
          }}>
            <LoadingSpinner size={24} />
            <span style={{ marginLeft: '0.5rem' }}>กำลังโหลดคูปอง...</span>
          </div>
        )}

        {/* Coupons List */}
        {!couponsLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredCoupons.map((coupon) => (
              <div key={coupon.id} style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                padding: '1.5rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      marginBottom: '0.5rem'
                    }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        margin: 0
                      }}>
                        {coupon.code} - {coupon.name}
                      </h3>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: coupon.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 
                                       coupon.status === 'inactive' ? 'rgba(156, 163, 175, 0.1)' :
                                       'rgba(239, 68, 68, 0.1)',
                        color: coupon.status === 'active' ? 'var(--success)' :
                               coupon.status === 'inactive' ? 'var(--text-muted)' :
                               'var(--danger)',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {coupon.status === 'active' ? 'ใช้งาน' :
                         coupon.status === 'inactive' ? 'ไม่ใช้งาน' : 'หมดอายุ'}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: coupon.type === 'percentage' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: coupon.type === 'percentage' ? 'var(--warning)' : 'var(--info)',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {coupon.type === 'percentage' ? 'เปอร์เซ็นต์' : 'จำนวนคงที่'}
                      </span>
                    </div>
                    
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5',
                      marginBottom: '1rem'
                    }}>
                      {coupon.description}
                    </p>
                    
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
                      gap: '1rem',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <div>
                        <strong>ส่วนลด:</strong> {coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)}
                      </div>
                      <div>
                        <strong>ใช้แล้ว:</strong> {coupon.usedCount || 0}/{coupon.usageLimit} ครั้ง
                      </div>
                      <div>
                        <strong>วันหมดอายุ:</strong> {formatDate(coupon.endDate)}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEditCoupon(coupon)}
                      disabled={loading}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.375rem',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                      title="แก้ไข"
                    >
                      <BootstrapIcon name="pencil-square" size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(coupon)}
                      disabled={loading}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.375rem',
                        color: 'var(--danger)',
                        cursor: 'pointer'
                      }}
                      title="ลบ"
                    >
                      <BootstrapIcon name="trash" size={16} />
                    </button>
                  </div>
                </div>

                {/* Performance Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                  gap: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}>
                  <div>
                    <span style={{ fontWeight: '600', color: 'var(--accent)' }}>
                      {formatCurrency(coupon.totalSavings || 0)}
                    </span>
                    <br />ประหยัดรวม
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: 'var(--success)' }}>
                      {formatCurrency(coupon.revenue || 0)}
                    </span>
                    <br />รายได้
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: 'var(--warning)' }}>
                      {coupon.conversionRate || 0}%
                    </span>
                    <br />อัตราแปลง
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: 'var(--info)' }}>
                      {coupon.performance || 'new'}
                    </span>
                    <br />ประสิทธิภาพ
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!couponsLoading && filteredCoupons.length === 0 && (
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '1rem',
            padding: '3rem 2rem',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <BootstrapIcon name="tag" size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {searchTerm || filterStatus !== 'all' || filterType !== 'all' ? 'ไม่พบคูปองที่ค้นหา' : 'ยังไม่มีคูปอง'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
                ? 'ลองปรับเปลี่ยนเงื่อนไขการค้นหาหรือเพิ่มคูปองใหม่'
                : 'เริ่มต้นสร้างคูปองแรกของคุณ'
              }
            </p>
            {(!searchTerm && filterStatus === 'all' && filterType === 'all') && (
              <button 
                onClick={handleAddCoupon}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <BootstrapIcon name="plus-lg" size={16} />
                สร้างคูปองใหม่
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Analytics Component
  const AnalyticsComponent = () => {
    const analyticsData = getAnalyticsData();
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Error Message */}
        <ErrorMessage message={error} onDismiss={() => setError(null)} />

        {/* Date Range Selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            รายงานการวิเคราะห์
          </h2>
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <option value="7days">7 วันล่าสุด</option>
            <option value="30days">30 วันล่าสุด</option>
            <option value="90days">90 วันล่าสุด</option>
            <option value="1year">1 ปีล่าสุด</option>
          </select>
        </div>

        {/* Performance Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
          gap: '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '1rem',
            padding: '1.5rem',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              📊 ประสิทธิภาพรวม
            </h3>
            {analyticsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <LoadingSpinner size={24} />
                <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>คูปองทั้งหมด</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>
                    {analyticsData.totalCoupons}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>คูปองที่ใช้งาน</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--success)' }}>
                    {analyticsData.activeCoupons}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>การใช้งานรวม</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--info)' }}>
                    {analyticsData.totalUsage}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>คูปองที่มีประสิทธิภาพดี</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--warning)' }}>
                    {analyticsData.topPerformers}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '1rem',
            padding: '1.5rem',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              💰 ข้อมูลทางการเงิน
            </h3>
            {analyticsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <LoadingSpinner size={24} />
                <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>ยอดประหยัดรวม</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent)' }}>
                    {formatCurrency(analyticsData.totalSavings)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>รายได้รวม</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--success)' }}>
                    {formatCurrency(analyticsData.totalRevenue)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>อัตราแปลงเฉลี่ย</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--warning)' }}>
                    {analyticsData.avgConversionRate.toFixed(1)}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>ROI โดยประมาณ</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--info)' }}>
                    {((analyticsData.totalRevenue / Math.max(analyticsData.totalSavings, 1)) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Coupons */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            🏅 คูปองที่มีประสิทธิภาพสูงสุด
          </h3>
          {analyticsLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <LoadingSpinner size={24} />
              <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {coupons
                .sort((a, b) => (b.conversionRate || 0) - (a.conversionRate || 0))
                .slice(0, 5)
                .map((coupon, index) => (
                <div key={coupon.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    backgroundColor: index < 3 ? 'var(--warning)' : 'var(--info)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '700'
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {coupon.code}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {coupon.name}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: 'var(--success)' }}>
                      {coupon.conversionRate || 0}%
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      อัตราแปลง
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: 'var(--accent)' }}>
                      {formatCurrency(coupon.revenue || 0)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      รายได้
                    </div>
                  </div>
                </div>
              ))}
              {coupons.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  ยังไม่มีข้อมูลคูปอง
                </div>
              )}
            </div>
          )}
        </div>

        {/* Usage Trends */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            📈 แนวโน้มการใช้งาน {selectedDateRange === '7days' ? '7 วันล่าสุด' : 
                               selectedDateRange === '30days' ? '30 วันล่าสุด' :
                               selectedDateRange === '90days' ? '90 วันล่าสุด' : '1 ปีล่าสุด'}
          </h3>
          {analyticsLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <LoadingSpinner size={24} />
              <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</div>
            </div>
          ) : (
            <div style={{
              height: '200px',
              display: 'flex',
              alignItems: 'end',
              justifyContent: 'space-between',
              gap: '0.5rem',
              padding: '1rem 0'
            }}>
              {/* Sample data - replace with actual analytics.usageTrends */}
              {(analytics.usageTrends && analytics.usageTrends.length > 0 ? analytics.usageTrends : [45, 52, 38, 67, 73, 61, 58]).map((usage, index) => (
                <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    height: `${(usage / 73) * 150}px`,
                    backgroundColor: 'var(--accent)',
                    borderRadius: '0.25rem',
                    width: '100%',
                    marginBottom: '0.5rem'
                  }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {index + 1}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {usage}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Settings Component
  const SettingsComponent = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Error Message */}
        <ErrorMessage message={error} onDismiss={() => setError(null)} />

        {/* General Settings */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            ⚙️ การตั้งค่าทั่วไป
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>อนุญาตให้ใช้หลายคูปอง</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  ลูกค้าสามารถใช้คูปองมากกว่า 1 ใบในการสั่งซื้อเดียวกัน
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                <input
                  type="checkbox"
                  checked={systemSettings.general.allowMultipleCoupons}
                  onChange={(e) => setSystemSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, allowMultipleCoupons: e.target.checked }
                  }))}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: systemSettings.general.allowMultipleCoupons ? 'var(--success)' : '#ccc',
                  transition: '0.4s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '26px',
                    width: '26px',
                    left: systemSettings.general.allowMultipleCoupons ? '30px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '0.4s',
                    borderRadius: '50%'
                  }} />
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>กำหนดยอดขั้นต่ำ</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  บังคับให้ต้องมียอดขั้นต่ำสำหรับการใช้คูปอง
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                <input
                  type="checkbox"
                  checked={systemSettings.general.requireMinimumAmount}
                  onChange={(e) => setSystemSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, requireMinimumAmount: e.target.checked }
                  }))}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: systemSettings.general.requireMinimumAmount ? 'var(--success)' : '#ccc',
                  transition: '0.4s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '26px',
                    width: '26px',
                    left: systemSettings.general.requireMinimumAmount ? '30px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '0.4s',
                    borderRadius: '50%'
                  }} />
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>ตรวจจับการทุจริต</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  เปิดใช้งานระบบตรวจจับการใช้คูปองผิดปกติ
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                <input
                  type="checkbox"
                  checked={systemSettings.general.enableFraudDetection}
                  onChange={(e) => setSystemSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, enableFraudDetection: e.target.checked }
                  }))}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: systemSettings.general.enableFraudDetection ? 'var(--success)' : '#ccc',
                  transition: '0.4s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '26px',
                    width: '26px',
                    left: systemSettings.general.enableFraudDetection ? '30px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '0.4s',
                    borderRadius: '50%'
                  }} />
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Limits Settings */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            📏 ข้อจำกัดและวงเงิน
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
            gap: '1rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                คูปองสูงสุดต่อผู้ใช้
              </label>
              <input
                type="number"
                value={systemSettings.limits.maxCouponsPerUser}
                onChange={(e) => setSystemSettings(prev => ({
                  ...prev,
                  limits: { ...prev.limits, maxCouponsPerUser: parseInt(e.target.value) }
                }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                ส่วนลดสูงสุด (%)
              </label>
              <input
                type="number"
                value={systemSettings.limits.maxDiscountPercentage}
                onChange={(e) => setSystemSettings(prev => ({
                  ...prev,
                  limits: { ...prev.limits, maxDiscountPercentage: parseInt(e.target.value) }
                }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                ส่วนลดสูงสุด (บาท)
              </label>
              <input
                type="number"
                value={systemSettings.limits.maxDiscountAmount}
                onChange={(e) => setSystemSettings(prev => ({
                  ...prev,
                  limits: { ...prev.limits, maxDiscountAmount: parseInt(e.target.value) }
                }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                การใช้งานสูงสุด
              </label>
              <input
                type="number"
                value={systemSettings.limits.maxUsageLimit}
                onChange={(e) => setSystemSettings(prev => ({
                  ...prev,
                  limits: { ...prev.limits, maxUsageLimit: parseInt(e.target.value) }
                }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            🔔 การแจ้งเตือน
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { key: 'emailEnabled', label: 'อีเมล', desc: 'ส่งการแจ้งเตือนผ่านอีเมล' },
              { key: 'smsEnabled', label: 'SMS', desc: 'ส่งการแจ้งเตือนผ่าน SMS' },
              { key: 'pushEnabled', label: 'Push Notification', desc: 'ส่งการแจ้งเตือนแบบ Push' },
              { key: 'webhookEnabled', label: 'Webhook', desc: 'ส่งข้อมูลผ่าน Webhook API' }
            ].map(({ key, label, desc }) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{label}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{desc}</div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
                  <input
                    type="checkbox"
                    checked={systemSettings.notifications[key]}
                    onChange={(e) => setSystemSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, [key]: e.target.checked }
                    }))}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: systemSettings.notifications[key] ? 'var(--success)' : '#ccc',
                    transition: '0.4s',
                    borderRadius: '34px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '',
                      height: '26px',
                      width: '26px',
                      left: systemSettings.notifications[key] ? '30px' : '4px',
                      bottom: '4px',
                      backgroundColor: 'white',
                      transition: '0.4s',
                      borderRadius: '50%'
                    }} />
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={saveSettings}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--accent)',
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
            {loading ? <LoadingSpinner size={16} /> : <BootstrapIcon name="check" size={16} />}
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    );
  };

  // Coupon Form Modal Content
  const CouponFormModal = () => (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--text-primary)'
          }}>
            รหัสคูปอง *
          </label>
          <input
            type="text"
            value={couponForm.code}
            onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
            placeholder="เช่น SUMMER2025"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--text-primary)'
          }}>
            ชื่อคูปอง *
          </label>
          <input
            type="text"
            value={couponForm.name}
            onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}
            placeholder="เช่น โปรโมชั่นซัมเมอร์"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          display: 'block',
          marginBottom: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--text-primary)'
        }}>
          คำอธิบาย
        </label>
        <textarea
          value={couponForm.description}
          onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
          placeholder="อธิบายรายละเอียดของคูปอง"
          disabled={loading}
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            resize: 'vertical'
          }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--text-primary)'
          }}>
            ประเภทส่วนลด
          </label>
          <select
            value={couponForm.type}
            onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <option value="percentage">เปอร์เซ็นต์</option>
            <option value="fixed_amount">จำนวนคงที่</option>
          </select>
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--text-primary)'
          }}>
            มูลค่าส่วนลด *
          </label>
          <input
            type="number"
            value={couponForm.value}
            onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
            placeholder={couponForm.type === 'percentage' ? '50' : '500'}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--text-primary)'
          }}>
            จำกัดการใช้งาน
          </label>
          <input
            type="number"
            value={couponForm.usageLimit}
            onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
            placeholder="100"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--text-primary)'
          }}>
            ยอดขั้นต่ำ (บาท)
          </label>
          <input
            type="number"
            value={couponForm.minAmount}
            onChange={(e) => setCouponForm({ ...couponForm, minAmount: e.target.value })}
            placeholder="1000"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--text-primary)'
          }}>
            ส่วนลดสูงสุด (บาท)
          </label>
          <input
            type="number"
            value={couponForm.maxDiscount}
            onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })}
            placeholder="500"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--text-primary)'
          }}>
            วันที่เริ่มต้น
          </label>
          <input
            type="date"
            value={couponForm.startDate}
            onChange={(e) => setCouponForm({ ...couponForm, startDate: e.target.value })}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--text-primary)'
          }}>
            วันที่สิ้นสุด
          </label>
          <input
            type="date"
            value={couponForm.endDate}
            onChange={(e) => setCouponForm({ ...couponForm, endDate: e.target.value })}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1.5rem'
      }}>
        <input
          type="checkbox"
          id="isActive"
          checked={couponForm.isActive}
          onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
          disabled={loading}
          style={{ width: '1rem', height: '1rem' }}
        />
        <label htmlFor="isActive" style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
          เปิดใช้งานทันที
        </label>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setShowCreateModal(false)}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          ยกเลิก
        </button>
        <button
          onClick={handleSaveCoupon}
          disabled={!couponForm.code.trim() || !couponForm.name.trim() || loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: (couponForm.code.trim() && couponForm.name.trim() && !loading) ? 'var(--accent)' : 'var(--text-muted)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: (couponForm.code.trim() && couponForm.name.trim() && !loading) ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {loading ? <LoadingSpinner size={16} /> : <BootstrapIcon name="check" size={16} />}
          {editingCoupon ? 'บันทึก' : 'สร้างคูปอง'}
        </button>
      </div>
    </>
  );

  // Delete Confirmation Modal
  const DeleteConfirmationModal = () => (
    <>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem'
        }}>
          <BootstrapIcon name="exclamation-triangle" size={30} color="var(--danger)" />
        </div>
        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          ยืนยันการลบคูปอง
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          คุณแน่ใจหรือไม่ที่จะลบคูปอง "{deleteTarget?.name}"?
          <br />
          การดำเนินการนี้ไม่สามารถยกเลิกได้
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <button
          onClick={() => setShowDeleteModal(false)}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          ยกเลิก
        </button>
        <button
          onClick={confirmDelete}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--danger)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {loading ? <LoadingSpinner size={16} /> : <BootstrapIcon name="trash" size={16} />}
          ลบคูปอง
        </button>
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <AdminOverview />;
      case 'coupons': return <CouponManagementComponent />;
      case 'analytics': return <AnalyticsComponent />;
      case 'settings': return <SettingsComponent />;
      default: return <AdminOverview />;
    }
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '1.75rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          marginBottom: '0.5rem' 
        }}>
          ระบบจัดการคูปองส่วนลด
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          จัดการคูปองส่วนลด โปรโมชั่น และระบบแจ้งเตือน
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '2rem'
      }}>
        {adminTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <BootstrapIcon name={tab.icon} size={16} />
            {windowWidth > 768 ? tab.label : tab.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ paddingBottom: '2rem' }}>
        {renderContent()}
      </div>

      {/* Modals */}
      <Modal 
        show={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        title={editingCoupon ? 'แก้ไขคูปอง' : 'สร้างคูปองใหม่'}
      >
        <CouponFormModal />
      </Modal>

      <Modal 
        show={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)}
        title="ยืนยันการลบ"
      >
        <DeleteConfirmationModal />
      </Modal>
    </div>
  );
};

export default CouponManagement;