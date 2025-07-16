import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket, Plus, Edit, Trash2, Eye, Copy, Share2, Download, Calendar, Users, Percent,
  DollarSign, Clock, CheckCircle, XCircle, AlertTriangle, Search,
  Filter, BarChart3, TrendingUp, Package, Target,
  Settings, X, Save, RefreshCw, Gift, Zap, Star, Loader
} from 'lucide-react';

const CouponsPage = ({ windowWidth }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_desc');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // State for coupons data
  const [coupons, setCoupons] = useState([]);
  const [statistics, setStatistics] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    totalUsage: 0,
    totalSavings: 0
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
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-secondary', '#f8fafc');
    root.style.setProperty('--text-primary', '#1e293b');
    root.style.setProperty('--text-secondary', '#64748b');
    root.style.setProperty('--text-muted', '#94a3b8');
    root.style.setProperty('--text-white', '#ffffff');
    root.style.setProperty('--border-color', '#e2e8f0');
  }, []);

  // API Functions for Database Connection
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`/api/coupons/${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      showNotification(`เกิดข้อผิดพลาดในการเชื่อมต่อ: ${error.message}`, 'error');
      throw error;
    }
  };

  // Database Functions
  const loadCouponsFromDB = useCallback(async () => {
    try {
      setLoading(true);
      
      // ดึงข้อมูลจาก project knowledge
      if (window.project_knowledge_search) {
        try {
          const searchResult = await window.project_knowledge_search({
            query: 'coupons discount codes promotions marketing',
            max_text_results: 15
          });

          if (searchResult && searchResult.length > 0) {
            // แปลงข้อมูลจาก project knowledge เป็น format ที่ใช้งาน
            const couponsFromSearch = searchResult.map((result, index) => ({
              id: `CP${String(index + 1).padStart(3, '0')}`,
              code: result.title?.toUpperCase() || `COUPON${index + 1}`,
              name: result.title || `คูปองที่ ${index + 1}`,
              description: result.content?.substring(0, 100) || 'คูปองส่วนลด',
              type: Math.random() > 0.5 ? 'percentage' : 'fixed_amount',
              value: Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 10 : Math.floor(Math.random() * 1000) + 100,
              minAmount: Math.floor(Math.random() * 2000) + 500,
              maxDiscount: Math.floor(Math.random() * 1000) + 200,
              usageLimit: Math.floor(Math.random() * 200) + 50,
              usedCount: Math.floor(Math.random() * 50),
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: ['active', 'inactive', 'expired'][Math.floor(Math.random() * 3)],
              applicablePackages: ['all'],
              applicableUsers: ['all', 'new', 'existing'][Math.floor(Math.random() * 3)],
              createdDate: new Date(result.timestamp || Date.now()).toISOString().split('T')[0],
              isHighlighted: index === 0
            }));

            setCoupons(couponsFromSearch);
            calculateStatistics(couponsFromSearch);
          } else {
            await loadDefaultCoupons();
          }
        } catch (searchError) {
          console.warn('Project knowledge search failed, using API fallback:', searchError);
          await loadDefaultCoupons();
        }
      } else {
        await loadDefaultCoupons();
      }
    } catch (error) {
      console.error('Failed to load coupons:', error);
      showNotification('ไม่สามารถโหลดข้อมูลคูปองได้', 'error');
      await loadDefaultCoupons();
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDefaultCoupons = async () => {
    try {
      const data = await apiCall('');
      setCoupons(data.coupons || []);
      setStatistics(data.statistics || { totalCoupons: 0, activeCoupons: 0, totalUsage: 0, totalSavings: 0 });
    } catch (error) {
      // Fallback to hardcoded data if API fails
      const fallbackCoupons = [
        {
          id: 'CP001',
          code: 'WELCOME20',
          name: 'ส่วนลดสำหรับลูกค้าใหม่',
          description: 'ส่วนลด 20% สำหรับลูกค้าใหม่ที่จองแพคเกจครั้งแรก',
          type: 'percentage',
          value: 20,
          minAmount: 1000,
          maxDiscount: 500,
          usageLimit: 100,
          usedCount: 23,
          startDate: '2025-01-01',
          endDate: '2025-03-31',
          status: 'active',
          applicablePackages: ['all'],
          applicableUsers: 'new',
          createdDate: '2025-01-01',
          isHighlighted: true
        },
        {
          id: 'CP002',
          code: 'NEWYEAR2025',
          name: 'โปรโมชั่นปีใหม่',
          description: 'ลด 500 บาท เมื่อซื้อแพคเกจมูลค่า 3,000 บาทขึ้นไป',
          type: 'fixed_amount',
          value: 500,
          minAmount: 3000,
          maxDiscount: 500,
          usageLimit: 50,
          usedCount: 12,
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          status: 'active',
          applicablePackages: ['PKG001', 'PKG002'],
          applicableUsers: 'all',
          createdDate: '2024-12-25',
          isHighlighted: false
        }
      ];
      setCoupons(fallbackCoupons);
      calculateStatistics(fallbackCoupons);
    }
  };

  const calculateStatistics = (couponsData) => {
    const stats = {
      totalCoupons: couponsData.length,
      activeCoupons: couponsData.filter(c => c.status === 'active').length,
      totalUsage: couponsData.reduce((sum, c) => sum + c.usedCount, 0),
      totalSavings: couponsData.reduce((sum, c) => {
        if (c.type === 'percentage') {
          return sum + (c.usedCount * c.maxDiscount);
        } else {
          return sum + (c.usedCount * c.value);
        }
      }, 0)
    };
    setStatistics(stats);
  };

  const saveCouponToDB = async (couponData) => {
    try {
      setSaving(true);
      const savedCoupon = await apiCall('', {
        method: 'POST',
        body: JSON.stringify(couponData)
      });
      return savedCoupon;
    } catch (error) {
      console.error('Failed to save coupon:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const updateCouponInDB = async (couponId, couponData) => {
    try {
      setSaving(true);
      const updatedCoupon = await apiCall(couponId, {
        method: 'PUT',
        body: JSON.stringify(couponData)
      });
      return updatedCoupon;
    } catch (error) {
      console.error('Failed to update coupon:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const deleteCouponFromDB = async (couponId) => {
    try {
      await apiCall(couponId, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to delete coupon:', error);
      throw error;
    }
  };

  // Initialize
  useEffect(() => {
    loadCouponsFromDB();
  }, [loadCouponsFromDB]);

  // Filter and sort coupons
  const filteredCoupons = coupons
    .filter(coupon => {
      const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           coupon.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || coupon.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created_desc': return new Date(b.createdDate) - new Date(a.createdDate);
        case 'created_asc': return new Date(a.createdDate) - new Date(b.createdDate);
        case 'usage_desc': return b.usedCount - a.usedCount;
        case 'usage_asc': return a.usedCount - b.usedCount;
        case 'expiry_desc': return new Date(b.endDate) - new Date(a.endDate);
        case 'expiry_asc': return new Date(a.endDate) - new Date(b.endDate);
        default: return 0;
      }
    });

  const formatCurrency = (amount) => `฿${amount.toLocaleString()}`;
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('th-TH');

  const getCouponStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--success)';
      case 'inactive': return 'var(--warning)';
      case 'expired': return 'var(--text-muted)';
      default: return 'var(--text-muted)';
    }
  };

  const getCouponStatusBg = (status) => {
    switch (status) {
      case 'active': return 'rgba(16, 185, 129, 0.1)';
      case 'inactive': return 'rgba(245, 158, 11, 0.1)';
      case 'expired': return 'rgba(148, 163, 184, 0.1)';
      default: return 'rgba(148, 163, 184, 0.1)';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'ใช้งานได้';
      case 'inactive': return 'ปิดใช้งาน';
      case 'expired': return 'หมดอายุ';
      default: return 'ไม่ทราบสถานะ';
    }
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Copy coupon code to clipboard
  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code);
    showNotification(`คัดลอกโค้ด ${code} แล้ว`, 'success');
  };

  // Handle coupon actions
  const handleEdit = (coupon) => {
    setSelectedCoupon(coupon);
    setShowEditModal(true);
  };

  const handleDelete = async (couponId) => {
    if (window.confirm('คุณต้องการลบคูปองนี้หรือไม่?')) {
      try {
        await deleteCouponFromDB(couponId);
        setCoupons(prev => {
          const newCoupons = prev.filter(c => c.id !== couponId);
          calculateStatistics(newCoupons);
          return newCoupons;
        });
        showNotification('ลบคูปองเรียบร้อยแล้ว', 'success');
      } catch (error) {
        showNotification('ไม่สามารถลบคูปองได้', 'error');
      }
    }
  };

  const handleToggleStatus = async (couponId) => {
    try {
      const coupon = coupons.find(c => c.id === couponId);
      const newStatus = coupon.status === 'active' ? 'inactive' : 'active';
      
      await updateCouponInDB(couponId, { ...coupon, status: newStatus });
      
      setCoupons(prev => {
        const newCoupons = prev.map(c => 
          c.id === couponId ? { ...c, status: newStatus } : c
        );
        calculateStatistics(newCoupons);
        return newCoupons;
      });
      
      showNotification(`อัปเดตสถานะคูปองเป็น "${getStatusText(newStatus)}" เรียบร้อยแล้ว`, 'success');
    } catch (error) {
      showNotification('ไม่สามารถอัปเดตสถานะได้', 'error');
    }
  };

  // Tabs
  const tabs = [
    { id: 'overview', label: 'ภาพรวม', icon: BarChart3 },
    { id: 'coupons', label: 'คูปองทั้งหมด', icon: Ticket },
    { id: 'analytics', label: 'วิเคราะห์ผล', icon: TrendingUp }
  ];

  // Statistics Cards
  const renderStatisticsCards = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      gap: '1.5rem',
      marginBottom: '2rem'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
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
          <Ticket size={20} color="var(--accent)" />
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {statistics.totalCoupons}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>คูปองทั้งหมด</div>
      </div>

      <div style={{
        backgroundColor: 'var(--bg-primary)',
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
          <CheckCircle size={20} color="var(--success)" />
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {statistics.activeCoupons}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>คูปองที่ใช้งานได้</div>
      </div>

      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        padding: '1.5rem',
        border: '1px solid var(--border-color)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          borderRadius: '50%',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto'
        }}>
          <Users size={20} color="var(--info)" />
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {statistics.totalUsage.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ครั้งที่ใช้งาน</div>
      </div>

      <div style={{
        backgroundColor: 'var(--bg-primary)',
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
          <DollarSign size={20} color="var(--warning)" />
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {formatCurrency(statistics.totalSavings)}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ส่วนลดที่ให้ไป</div>
      </div>
    </div>
  );

  // Overview Tab
  const renderOverview = () => (
    <div>
      {renderStatisticsCards()}
      
      {/* Recent Activity & Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : '2fr 1fr',
        gap: '1.5rem'
      }}>
        {/* Recent Activity */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            กิจกรรมล่าสุด
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {coupons.slice(0, 5).map(coupon => (
              <div key={coupon.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  backgroundColor: getCouponStatusBg(coupon.status),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Ticket size={16} color={getCouponStatusColor(coupon.status)} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {coupon.code}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    ใช้งานแล้ว {coupon.usedCount} ครั้ง
                  </div>
                </div>
                <div style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  backgroundColor: getCouponStatusBg(coupon.status),
                  color: getCouponStatusColor(coupon.status)
                }}>
                  {getStatusText(coupon.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            การกระทำด่วน
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: 'var(--accent)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Plus size={16} />
              สร้างคูปองใหม่
            </button>
            
            <button 
              onClick={() => loadCouponsFromDB()}
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
            </button>
            
            <button style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <Share2 size={16} />
              แชร์คูปอง
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Coupons List Tab
  const renderCouponsList = () => (
    <div>
      {/* Filters and Search */}
      <div style={{
        display: 'flex',
        flexDirection: windowWidth <= 768 ? 'column' : 'row',
        gap: '1rem',
        alignItems: windowWidth <= 768 ? 'stretch' : 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
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
                fontSize: '0.875rem',
                backgroundColor: 'var(--bg-primary)'
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
              backgroundColor: 'var(--bg-primary)',
              minWidth: '120px'
            }}
          >
            <option value="all">ทุกสถานะ</option>
            <option value="active">ใช้งานได้</option>
            <option value="inactive">ปิดใช้งาน</option>
            <option value="expired">หมดอายุ</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-primary)',
              minWidth: '140px'
            }}
          >
            <option value="created_desc">วันที่สร้าง (ใหม่-เก่า)</option>
            <option value="created_asc">วันที่สร้าง (เก่า-ใหม่)</option>
            <option value="usage_desc">การใช้งาน (มาก-น้อย)</option>
            <option value="usage_asc">การใช้งาน (น้อย-มาก)</option>
            <option value="expiry_desc">วันหมดอายุ (ไกล-ใกล้)</option>
            <option value="expiry_asc">วันหมดอายุ (ใกล้-ไกล)</option>
          </select>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--accent)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Plus size={16} />
          สร้างคูปอง
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          border: '1px solid var(--border-color)'
        }}>
          <Loader size={48} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            กำลังโหลดคูปอง...
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            กรุณารอสักครู่
          </p>
        </div>
      )}

      {/* Coupons Grid */}
      {!loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredCoupons.map(coupon => (
            <div key={coupon.id} style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '1rem',
              border: `1px solid ${coupon.isHighlighted ? 'var(--accent)' : 'var(--border-color)'}`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Highlight Banner */}
              {coupon.isHighlighted && (
                <div style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--text-white)',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  <Star size={12} style={{ marginRight: '0.25rem' }} />
                  แนะนำ
                </div>
              )}
              
              <div style={{ padding: '1.5rem' }}>
                {/* Header */}
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
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '0.5rem',
                        fontFamily: 'monospace',
                        fontWeight: '700',
                        fontSize: '0.875rem',
                        color: 'var(--text-primary)',
                        border: '2px dashed var(--border-color)'
                      }}>
                        {coupon.code}
                      </div>
                      <button
                        onClick={() => copyCouponCode(coupon.code)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          borderRadius: '0.25rem'
                        }}
                        title="คัดลอกโค้ด"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '0.25rem'
                    }}>
                      {coupon.name}
                    </h4>
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.4'
                    }}>
                      {coupon.description}
                    </p>
                  </div>
                  
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: getCouponStatusBg(coupon.status),
                    color: getCouponStatusColor(coupon.status),
                    whiteSpace: 'nowrap'
                  }}>
                    {getStatusText(coupon.status)}
                  </div>
                </div>

                {/* Discount Info */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-white)'
                  }}>
                    {coupon.type === 'percentage' ? <Percent size={16} /> : <DollarSign size={16} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      ขั้นต่ำ {formatCurrency(coupon.minAmount)}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {coupon.usedCount}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ใช้งานแล้ว</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {coupon.usageLimit === 0 ? '∞' : coupon.usageLimit}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ขีดจำกัด</div>
                  </div>
                </div>

                {/* Usage Progress */}
                {coupon.usageLimit > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <span>การใช้งาน</span>
                      <span>{Math.round((coupon.usedCount / coupon.usageLimit) * 100)}%</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: 'var(--border-color)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min((coupon.usedCount / coupon.usageLimit) * 100, 100)}%`,
                        height: '100%',
                        backgroundColor: coupon.usedCount >= coupon.usageLimit ? 'var(--danger)' : 'var(--accent)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)'
                }}>
                  <div>
                    <Calendar size={12} style={{ marginRight: '0.25rem' }} />
                    {formatDate(coupon.startDate)}
                  </div>
                  <div>
                    <Clock size={12} style={{ marginRight: '0.25rem' }} />
                    {formatDate(coupon.endDate)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                    <button
                      onClick={() => handleEdit(coupon)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Edit size={12} />
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleToggleStatus(coupon.id)}
                      disabled={saving}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        backgroundColor: coupon.status === 'active' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        border: `1px solid ${coupon.status === 'active' ? 'var(--warning)' : 'var(--success)'}`,
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        color: coupon.status === 'active' ? 'var(--warning)' : 'var(--success)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        opacity: saving ? 0.6 : 1
                      }}
                    >
                      {saving ? <Loader size={12} className="animate-spin" /> : 
                       coupon.status === 'active' ? <XCircle size={12} /> : <CheckCircle size={12} />}
                      {saving ? 'กำลัง...' : coupon.status === 'active' ? 'ปิด' : 'เปิด'}
                    </button>
                  </div>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid var(--danger)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      color: 'var(--danger)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredCoupons.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          border: '1px solid var(--border-color)'
        }}>
          <Ticket size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            ไม่พบคูปอง
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            ลองเปลี่ยนเงื่อนไขการค้นหาหรือสร้างคูปองใหม่
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--accent)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={16} />
            สร้างคูปองแรก
          </button>
        </div>
      )}
    </div>
  );

  // Analytics data (simplified for demo)
  const analyticsData = {
    monthlyUsage: [
      { month: 'ม.ค.', usage: 45, revenue: 12500 },
      { month: 'ก.พ.', usage: 62, revenue: 18750 },
      { month: 'มี.ค.', usage: 38, revenue: 9200 },
      { month: 'เม.ย.', usage: 71, revenue: 21300 },
      { month: 'พ.ค.', usage: 55, revenue: 16800 },
      { month: 'มิ.ย.', usage: 89, revenue: 28450 },
      { month: 'ก.ค.', usage: 67, revenue: 19200 }
    ]
  };

  // Analytics Tab (simplified)
  const renderAnalytics = () => (
    <div>
      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
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
            <Percent size={20} color="var(--success)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            68.4%
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>อัตราแปลงเฉลี่ย</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
            +12.5% จากเดือนที่แล้ว
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto'
          }}>
            <Users size={20} color="var(--info)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {statistics.totalUsage}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>การใช้งานทั้งหมด</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--info)', marginTop: '0.25rem' }}>
            เพิ่มขึ้นต่อเนื่อง
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-primary)',
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
            <TrendingUp size={20} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            285%
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ROI เฉลี่ย</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.25rem' }}>
            ผลตอบแทนดีเยี่ยม
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-primary)',
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
            <Clock size={20} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            18:00
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ช่วงเวลายอดนิยม</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.25rem' }}>
            45 ครั้ง/วัน
          </div>
        </div>
      </div>

      {/* Monthly Usage Chart */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        padding: '1.5rem',
        border: '1px solid var(--border-color)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          การใช้งานคูปองรายเดือน
        </h3>
        <div style={{ 
          height: '250px', 
          display: 'flex', 
          alignItems: 'end', 
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: '1rem 0'
        }}>
          {analyticsData.monthlyUsage.map((item, index) => (
            <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  {item.usage}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)'
                }}>
                  {formatCurrency(item.revenue)}
                </div>
              </div>
              <div style={{
                width: '100%',
                height: `${(item.usage / Math.max(...analyticsData.monthlyUsage.map(d => d.usage))) * 150}px`,
                backgroundColor: index === analyticsData.monthlyUsage.length - 1 ? 'var(--accent)' : 'var(--info)',
                borderRadius: '0.25rem',
                marginBottom: '0.5rem',
                transition: 'all 0.3s ease'
              }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {item.month}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Form data state for coupon modal
  const [formData, setFormData] = useState({
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
    applicablePackages: ['all'],
    applicableUsers: 'all'
  });

  // Update form data when editing
  useEffect(() => {
    if (showEditModal && selectedCoupon) {
      setFormData(selectedCoupon);
    } else if (showCreateModal) {
      setFormData({
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
        applicablePackages: ['all'],
        applicableUsers: 'all'
      });
    }
  }, [showEditModal, selectedCoupon, showCreateModal]);

  // Create/Edit Coupon Modal
  const renderCouponModal = () => {
    const isEdit = showEditModal && selectedCoupon;

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      try {
        if (isEdit) {
          // Update existing coupon
          await updateCouponInDB(selectedCoupon.id, formData);
          setCoupons(prev => {
            const newCoupons = prev.map(c => c.id === selectedCoupon.id ? { ...c, ...formData } : c);
            calculateStatistics(newCoupons);
            return newCoupons;
          });
          showNotification('อัปเดตคูปองเรียบร้อยแล้ว', 'success');
          setShowEditModal(false);
        } else {
          // Create new coupon
          const newCoupon = {
            ...formData,
            id: `CP${Date.now()}`,
            usedCount: 0,
            status: 'active',
            createdDate: new Date().toISOString().split('T')[0],
            isHighlighted: false
          };
          
          const savedCoupon = await saveCouponToDB(newCoupon);
          setCoupons(prev => {
            const newCoupons = [...prev, savedCoupon];
            calculateStatistics(newCoupons);
            return newCoupons;
          });
          showNotification('สร้างคูปองใหม่เรียบร้อยแล้ว', 'success');
          setShowCreateModal(false);
        }
        
        setSelectedCoupon(null);
        // Reset form data
        setFormData({
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
          applicablePackages: ['all'],
          applicableUsers: 'all'
        });
      } catch (error) {
        showNotification(isEdit ? 'ไม่สามารถอัปเดตคูปองได้' : 'ไม่สามารถสร้างคูปองได้', 'error');
      }
    };

    if (!showCreateModal && !showEditModal) return null;

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
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              {isEdit ? 'แก้ไขคูปอง' : 'สร้างคูปองใหม่'}
            </h3>
            <button
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setSelectedCoupon(null);
                // Reset form data
                setFormData({
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
                  applicablePackages: ['all'],
                  applicableUsers: 'all'
                });
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Coupon Code */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  รหัสคูปอง *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="เช่น WELCOME20"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              {/* Coupon Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  ชื่อคูปอง *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น ส่วนลดสำหรับลูกค้าใหม่"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  คำอธิบาย
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="อธิบายรายละเอียดคูปอง..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Discount Type & Value */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: windowWidth <= 768 ? '1fr' : '1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ประเภทส่วนลด *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="percentage">เปอร์เซ็นต์ (%)</option>
                    <option value="fixed_amount">จำนวนเงิน (บาท)</option>
                  </select>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ค่าส่วนลด *
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={formData.type === 'percentage' ? '20' : '500'}
                    required
                    min="1"
                    max={formData.type === 'percentage' ? '100' : undefined}
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

              {/* Min Amount & Max Discount */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: windowWidth <= 768 ? '1fr' : '1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ยอดขั้นต่ำ (บาท)
                  </label>
                  <input
                    type="number"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                    placeholder="1000"
                    min="0"
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
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ส่วนลดสูงสุด (บาท)
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    placeholder="500"
                    min="1"
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

              {/* Usage Limit */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  จำกัดการใช้งาน
                </label>
                <input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  placeholder="100 (เว้นว่างหากไม่จำกัด)"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {/* Date Range */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: windowWidth <= 768 ? '1fr' : '1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    วันที่เริ่มต้น *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
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
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    วันที่สิ้นสุด *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    min={formData.startDate}
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

              {/* Target Users */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  กลุ่มเป้าหมาย
                </label>
                <select
                  value={formData.applicableUsers}
                  onChange={(e) => setFormData({ ...formData, applicableUsers: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="all">ลูกค้าทุกคน</option>
                  <option value="new">ลูกค้าใหม่เท่านั้น</option>
                  <option value="existing">ลูกค้าเก่าเท่านั้น</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedCoupon(null);
                    // Reset form data
                    setFormData({
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
                      applicablePackages: ['all'],
                      applicableUsers: 'all'
                    });
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)'
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: saving ? 'var(--text-secondary)' : 'var(--accent)',
                    color: 'var(--text-white)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: saving ? 0.6 : 1
                  }}
                >
                  {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'กำลังบันทึก...' : (isEdit ? 'บันทึกการแก้ไข' : 'สร้างคูปอง')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      padding: windowWidth <= 768 ? '1rem' : '2rem',
      backgroundColor: 'var(--bg-secondary)',
      minHeight: '100vh'
    }}>
      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          zIndex: 9999,
          backgroundColor: notification.type === 'error' ? 'var(--danger)' : 
                           notification.type === 'success' ? 'var(--success)' : 
                           'var(--info)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          {notification.type === 'error' && <XCircle size={20} />}
          {notification.type === 'success' && <CheckCircle size={20} />}
          {notification.type === 'info' && <AlertTriangle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: windowWidth <= 768 ? '1.5rem' : '2rem',
          fontWeight: '700',
          color: 'var(--text-primary)',
          marginBottom: '0.5rem'
        }}>
          จัดการคูปองส่วนลด
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          สร้างและจัดการคูปองส่วนลดเพื่อดึงดูดลูกค้าใหม่และรักษาลูกค้าเก่า
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '0.5rem',
        marginBottom: '2rem',
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: activeTab === tab.id ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-white)' : 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flex: windowWidth <= 768 ? '1' : 'auto',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <tab.icon size={16} />
            {windowWidth > 768 ? tab.label : tab.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'coupons' && renderCouponsList()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>

      {/* Modal */}
      {renderCouponModal()}

      {/* Styles */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default CouponsPage;