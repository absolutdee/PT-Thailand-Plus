import React, { useState, useEffect } from 'react';
import {
  Gift, Tag, CheckCircle, XCircle, Copy, Share2,
  Download, DollarSign, Calendar, Info, AlertTriangle,
  Star, User, Package, Clock, TrendingUp, Search,
  Filter, RefreshCw, Smartphone, Mail, Bell,
  Award, Zap, Heart, Percent, Plus, Eye,
  ShoppingCart, CreditCard, History, X, Loader,
  AlertCircle, WifiOff
} from 'lucide-react';

const ClientCoupons = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [activeTab, setActiveTab] = useState('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showCouponDetail, setShowCouponDetail] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  // Database Connection States
  const [customerCoupons, setCustomerCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // API Base URL - adjust according to your backend
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Apply CSS variables and handle mobile responsiveness
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', '#232956');
    root.style.setProperty('--accent', '#df2528');
    root.style.setProperty('--tab-active', '#232956');
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

    // Close mobile menu on outside click
    const handleClickOutside = (event) => {
      if (showCouponDetail && event.target.closest('.coupon-modal') === null) {
        // Don't close modal if clicking inside it
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCouponDetail]);

  // API Functions
  const apiRequest = async (endpoint, options = {}) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  // Get current user info
  const getCurrentUser = async () => {
    try {
      const userData = await apiRequest('/auth/me');
      setCurrentUser(userData);
      return userData;
    } catch (error) {
      setError('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
      console.error('Failed to get current user:', error);
    }
  };

  // Load coupons from database
  const loadCoupons = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      
      const response = await apiRequest('/coupons/my-coupons');
      
      if (response.success) {
        const coupons = response.data.map(coupon => ({
          id: coupon.id,
          code: coupon.code,
          discount: coupon.type === 'percentage' 
            ? `${coupon.value}%` 
            : `${coupon.value} บาท`,
          minAmount: coupon.minAmount || 0,
          maxDiscount: coupon.maxDiscount || null,
          expiryDate: new Date(coupon.expiryDate).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          status: coupon.status,
          category: coupon.category || 'ทั่วไป',
          description: coupon.description || 'ส่วนลดพิเศษ',
          terms: coupon.terms || [],
          daysLeft: Math.ceil((new Date(coupon.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)),
          isNew: coupon.isNew || false,
          type: coupon.type,
          value: coupon.value,
          trainerName: coupon.trainer?.name || 'ทุกเทรนเนอร์',
          usedDate: coupon.usedDate ? new Date(coupon.usedDate).toLocaleDateString('th-TH') : null,
          savedAmount: coupon.savedAmount || 0,
          orderNumber: coupon.orderNumber || null,
          trainerId: coupon.trainerId,
          packageId: coupon.packageId,
          createdAt: coupon.createdAt,
          updatedAt: coupon.updatedAt
        }));

        setCustomerCoupons(coupons);
      } else {
        throw new Error(response.message || 'ไม่สามารถดึงข้อมูลคูปองได้');
      }
    } catch (error) {
      setError('ไม่สามารถดึงข้อมูลคูปองได้');
      console.error('Failed to load coupons:', error);
      
      // Fallback to empty array
      setCustomerCoupons([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Use coupon
  const useCoupon = async (couponId, packageId = null) => {
    try {
      setActionLoading(couponId);
      setError(null);

      const response = await apiRequest('/coupons/use', {
        method: 'POST',
        body: JSON.stringify({
          couponId,
          packageId
        })
      });

      if (response.success) {
        // Update coupon status locally
        setCustomerCoupons(prev => 
          prev.map(coupon => 
            coupon.id === couponId 
              ? { 
                  ...coupon, 
                  status: 'used',
                  usedDate: new Date().toLocaleDateString('th-TH'),
                  savedAmount: response.data.savedAmount,
                  orderNumber: response.data.orderNumber
                }
              : coupon
          )
        );

        // Show success message
        console.log('ใช้คูปองเรียบร้อยแล้ว');
        
        // Navigate to payment or order confirmation
        if (response.data.redirectUrl) {
          window.location.href = response.data.redirectUrl;
        }

        return response.data;
      } else {
        throw new Error(response.message || 'ไม่สามารถใช้คูปองได้');
      }
    } catch (error) {
      setError('ไม่สามารถใช้คูปองได้: ' + error.message);
      console.error('Failed to use coupon:', error);
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  // Validate coupon
  const validateCoupon = async (couponCode, packageId = null) => {
    try {
      const response = await apiRequest('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: couponCode,
          packageId
        })
      });

      return response.data;
    } catch (error) {
      console.error('Failed to validate coupon:', error);
      throw error;
    }
  };

  // Download receipt
  const downloadReceipt = async (orderNumber) => {
    try {
      setActionLoading(orderNumber);
      const response = await apiRequest(`/receipts/${orderNumber}/download`, {
        method: 'GET'
      });

      if (response.success) {
        // Create download link
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = `receipt-${orderNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      setError('ไม่สามารถดาวน์โหลดใบเสร็จได้');
      console.error('Failed to download receipt:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        // Get current user first
        const user = await getCurrentUser();
        if (user) {
          // Load coupons
          await loadCoupons();
        }
      } catch (error) {
        setError('ไม่สามารถเริ่มต้นแอปพลิเคชันได้');
        console.error('Initialization failed:', error);
      }
    };

    init();
  }, []);

  // Refresh coupons
  const handleRefresh = () => {
    loadCoupons(false);
  };

  // Clear copy success message
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  // Tabs configuration
  const tabs = [
    { id: 'available', label: 'ใช้ได้', icon: Gift, count: customerCoupons.filter(c => c.status === 'available').length },
    { id: 'used', label: 'ใช้แล้ว', icon: CheckCircle, count: customerCoupons.filter(c => c.status === 'used').length },
    { id: 'expired', label: 'หมดอายุ', icon: XCircle, count: customerCoupons.filter(c => c.status === 'expired').length }
  ];

  // Filter coupons
  const filteredCoupons = customerCoupons.filter(coupon => {
    const matchesTab = coupon.status === activeTab;
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || coupon.category === filterCategory;
    return matchesTab && matchesSearch && matchesCategory;
  });

  // Categories for filter (with validation)
  const categories = ['all', ...new Set(customerCoupons.map(c => c.category).filter(Boolean))];

  // Format currency with validation
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '฿0';
    return `฿${amount.toLocaleString()}`;
  };

  // Handle copy coupon code
  const handleCopyCoupon = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(code);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(code);
    }
  };

  // Handle use coupon
  const handleUseCoupon = async (coupon) => {
    try {
      if (coupon.status !== 'available') {
        setError('คูปองนี้ไม่สามารถใช้งานได้');
        return;
      }

      // Navigate to package selection or checkout with coupon
      console.log(`กำลังไปยังหน้าเลือกแพคเกจเพื่อใช้คูปอง ${coupon.code}`);
      
      // Store coupon in session storage for use in checkout
      sessionStorage.setItem('selectedCoupon', JSON.stringify(coupon));
      
      // Navigate to packages page
      // Example: navigate('/packages', { state: { coupon } });
      // For now, just log the action
      console.log('นำทางไปหน้าเลือกแพคเกจ');
    } catch (error) {
      setError('ไม่สามารถใช้คูปองได้: ' + error.message);
    }
  };

  // Handle view coupon detail
  const handleViewDetail = (coupon) => {
    setSelectedCoupon(coupon);
    setShowCouponDetail(true);
  };

  // Loading screen
  if (loading && customerCoupons.length === 0) {
    return (
      <div style={{
        padding: windowWidth <= 768 ? '1rem' : '2rem',
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <Loader size={48} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          กำลังโหลดคูปอง...
        </div>
      </div>
    );
  }

  // Error screen (only if no data and error exists)
  if (error && customerCoupons.length === 0) {
    return (
      <div style={{
        padding: windowWidth <= 768 ? '1rem' : '2rem',
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)' }} />
        <div style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '600', textAlign: 'center' }}>
          เกิดข้อผิดพลาด
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', textAlign: 'center' }}>
          {error}
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleRefresh}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <RefreshCw size={16} />
            ลองใหม่อีกครั้ง
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            รีเฟรชหน้า
          </button>
        </div>
      </div>
    );
  }

  // Render coupon card
  const renderCouponCard = (coupon) => (
    <div key={coupon.id} style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '1rem',
      padding: '1.5rem',
      border: '1px solid var(--border-color)',
      position: 'relative',
      opacity: coupon.status === 'expired' ? 0.6 : 1,
      background: coupon.status === 'expired' ? 
        'linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(209, 213, 219, 0.1) 100%)' :
        coupon.isNew ? 
        'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)' :
        'var(--bg-secondary)'
    }}>
      {/* New Badge */}
      {coupon.isNew && coupon.status === 'available' && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          padding: '0.25rem 0.75rem',
          backgroundColor: 'var(--success)',
          color: 'white',
          borderRadius: '1rem',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}>
          ใหม่
        </div>
      )}

      {/* Status Badge */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: coupon.isNew && coupon.status === 'available' ? '4rem' : '1rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '1rem',
        fontSize: '0.75rem',
        fontWeight: '600',
        backgroundColor: 
          coupon.status === 'available' ? 'rgba(16, 185, 129, 0.1)' :
          coupon.status === 'used' ? 'rgba(59, 130, 246, 0.1)' :
          'rgba(156, 163, 175, 0.1)',
        color: 
          coupon.status === 'available' ? 'var(--success)' :
          coupon.status === 'used' ? 'var(--info)' :
          'var(--text-muted)'
      }}>
        {coupon.status === 'available' ? 'ใช้ได้' :
         coupon.status === 'used' ? 'ใช้แล้ว' : 'หมดอายุ'}
      </div>

      {/* Coupon Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        paddingRight: '6rem'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent)',
              color: 'white',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '700',
              letterSpacing: '0.5px'
            }}>
              {coupon.code}
              {copySuccess === coupon.code && (
                <span style={{
                  marginLeft: '0.5rem',
                  fontSize: '0.75rem',
                  opacity: 0.8
                }}>
                  ✓ คัดลอกแล้ว!
                </span>
              )}
            </div>
            <div style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: 'rgba(35, 41, 86, 0.1)',
              color: 'var(--primary)',
              borderRadius: '1rem',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {coupon.category}
            </div>
          </div>
          <h4 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '0.25rem'
          }}>
            ส่วนลด {coupon.discount}
          </h4>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.5rem'
          }}>
            {coupon.description}
          </p>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)'
          }}>
            จาก {coupon.trainerName}
          </p>
        </div>
      </div>

      {/* Discount Highlight */}
      <div style={{
        padding: '1rem',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        textAlign: 'center',
        marginBottom: '1rem',
        border: '2px dashed var(--border-color)'
      }}>
        <div style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: 'var(--accent)',
          marginBottom: '0.25rem'
        }}>
          {coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          ส่วนลด{coupon.type === 'percentage' ? '' : 'คงที่'}
        </div>
        {coupon.minAmount > 0 && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            ซื้อขั้นต่ำ {formatCurrency(coupon.minAmount)}
          </div>
        )}
      </div>

      {/* Terms */}
      {coupon.terms && coupon.terms.length > 0 && (
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <h5 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Info size={14} />
            เงื่อนไขการใช้:
          </h5>
          <ul style={{ margin: 0, paddingLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {coupon.terms.map((term, index) => (
              <li key={index} style={{ marginBottom: '0.25rem' }}>{term}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {coupon.status === 'used' ? (
            <div>
              <div>ใช้เมื่อ: {coupon.usedDate}</div>
              {coupon.savedAmount > 0 && (
                <div style={{ color: 'var(--success)', fontWeight: '600' }}>
                  ประหยัด: {formatCurrency(coupon.savedAmount)}
                </div>
              )}
            </div>
          ) : coupon.status === 'available' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={14} />
              <span>
                หมดอายุ: {coupon.expiryDate}
                {coupon.daysLeft && coupon.daysLeft > 0 && (
                  <span style={{ 
                    color: coupon.daysLeft <= 7 ? 'var(--danger)' : 'var(--warning)',
                    fontWeight: '600',
                    marginLeft: '0.5rem'
                  }}>
                    (เหลือ {coupon.daysLeft} วัน)
                  </span>
                )}
              </span>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>
              หมดอายุ: {coupon.expiryDate}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => handleViewDetail(coupon)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <Eye size={14} />
            ดูรายละเอียด
          </button>
          
          {coupon.status === 'available' && (
            <>
              <button
                onClick={() => handleCopyCoupon(coupon.code)}
                disabled={actionLoading === coupon.id}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  color: 'var(--info)',
                  border: '1px solid var(--info)',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: actionLoading === coupon.id ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  opacity: actionLoading === coupon.id ? 0.6 : 1
                }}
              >
                {actionLoading === coupon.id ? (
                  <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Copy size={14} />
                )}
                คัดลอก
              </button>
              <button
                onClick={() => handleUseCoupon(coupon)}
                disabled={actionLoading === coupon.id}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: actionLoading === coupon.id ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  opacity: actionLoading === coupon.id ? 0.6 : 1
                }}
              >
                {actionLoading === coupon.id ? (
                  <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <ShoppingCart size={14} />
                )}
                ใช้เลย
              </button>
            </>
          )}
          
          {coupon.status === 'used' && coupon.orderNumber && (
            <button
              onClick={() => downloadReceipt(coupon.orderNumber)}
              disabled={actionLoading === coupon.orderNumber}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--info)',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: actionLoading === coupon.orderNumber ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                opacity: actionLoading === coupon.orderNumber ? 0.6 : 1
              }}
            >
              {actionLoading === coupon.orderNumber ? (
                <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Download size={14} />
              )}
              ใบเสร็จ
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Render coupon detail modal
  const renderCouponDetailModal = () => {
    if (!showCouponDetail || !selectedCoupon) return null;

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
        <div 
          className="coupon-modal"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              รายละเอียดคูปอง
            </h2>
            <button
              onClick={() => setShowCouponDetail(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Coupon Display */}
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            border: '2px dashed var(--accent)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: 'var(--accent)',
              marginBottom: '0.5rem',
              letterSpacing: '2px'
            }}>
              {selectedCoupon.code}
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '1rem'
            }}>
              {selectedCoupon.description}
            </div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: 'var(--primary)',
              marginBottom: '0.5rem'
            }}>
              {selectedCoupon.type === 'percentage' 
                ? `${selectedCoupon.value}%` 
                : formatCurrency(selectedCoupon.value)}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)'
            }}>
              ส่วนลด{selectedCoupon.type === 'percentage' ? '' : 'คงที่'}
            </div>
          </div>

          {/* Details */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>หมวดหมู่:</span>
              <span style={{ fontWeight: '600' }}>{selectedCoupon.category}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>เทรนเนอร์:</span>
              <span style={{ fontWeight: '600' }}>{selectedCoupon.trainerName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ยอดขั้นต่ำ:</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(selectedCoupon.minAmount)}</span>
            </div>
            {selectedCoupon.maxDiscount && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>ส่วนลดสูงสุด:</span>
                <span style={{ fontWeight: '600' }}>{formatCurrency(selectedCoupon.maxDiscount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>หมดอายุ:</span>
              <span style={{ fontWeight: '600' }}>{selectedCoupon.expiryDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>สถานะ:</span>
              <span style={{
                fontWeight: '600',
                color: 
                  selectedCoupon.status === 'available' ? 'var(--success)' :
                  selectedCoupon.status === 'used' ? 'var(--info)' :
                  'var(--text-muted)'
              }}>
                {selectedCoupon.status === 'available' ? 'ใช้ได้' :
                 selectedCoupon.status === 'used' ? 'ใช้แล้ว' : 'หมดอายุ'}
              </span>
            </div>
          </div>

          {/* Terms */}
          {selectedCoupon.terms && selectedCoupon.terms.length > 0 && (
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                เงื่อนไขการใช้งาน
              </h4>
              <ul style={{
                margin: 0,
                paddingLeft: '1rem',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                lineHeight: '1.5'
              }}>
                {selectedCoupon.terms.map((term, index) => (
                  <li key={index} style={{ marginBottom: '0.25rem' }}>{term}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem'
          }}>
            <button
              onClick={() => setShowCouponDetail(false)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              ปิด
            </button>
            {selectedCoupon.status === 'available' && (
              <>
                <button
                  onClick={() => {
                    handleCopyCoupon(selectedCoupon.code);
                    setShowCouponDetail(false);
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--info)',
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
                  <Copy size={16} />
                  คัดลอกรหัส
                </button>
                <button
                  onClick={() => {
                    handleUseCoupon(selectedCoupon);
                    setShowCouponDetail(false);
                  }}
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
                  <ShoppingCart size={16} />
                  ใช้คูปอง
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '1rem',
      padding: '3rem 2rem',
      border: '1px solid var(--border-color)',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
        {activeTab === 'available' ? '🎫' : activeTab === 'used' ? '✅' : '⏰'}
      </div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        {activeTab === 'available' ? 'ไม่มีคูปองที่ใช้ได้' :
         activeTab === 'used' ? 'ยังไม่เคยใช้คูปอง' :
         'ไม่มีคูปองหมดอายุ'}
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        {activeTab === 'available' 
          ? 'คูปองส่วนลดจะปรากฏที่นี่เมื่อคุณได้รับ'
          : activeTab === 'used'
          ? 'ประวัติการใช้คูปองจะแสดงที่นี่'
          : 'คูปองที่หมดอายุจะแสดงที่นี่'
        }
      </p>
      {activeTab === 'available' && (
        <button 
          onClick={() => {
            console.log('นำทางไปหน้าค้นหาเทรนเนอร์');
            // Add navigation logic here
            // Example: navigate('/trainers');
          }}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--accent)',
            color: 'white',
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
          <Search size={16} />
          ค้นหาเทรนเนอร์
        </button>
      )}
    </div>
  );

  return (
    <div style={{ 
      padding: windowWidth <= 768 ? '1rem' : '2rem',
      backgroundColor: 'var(--bg-primary)',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h1 style={{ 
            fontSize: windowWidth <= 768 ? '1.5rem' : '1.75rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            margin: 0
          }}>
            คูปองส่วนลด
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: refreshing ? 0.6 : 1
            }}
          >
            <RefreshCw size={16} style={{ 
              animation: refreshing ? 'spin 1s linear infinite' : 'none' 
            }} />
            {!windowWidth <= 768 && 'รีเฟรช'}
          </button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
          จัดการและใช้คูปองส่วนลดของคุณ
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--danger)',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--danger)'
        }}>
          <AlertTriangle size={16} />
          <span style={{ fontSize: '0.875rem' }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: 'auto',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--danger)',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <Gift size={24} color="var(--accent)" style={{ margin: '0 auto 0.5rem auto' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '0.25rem' }}>
            {loading ? '...' : customerCoupons.filter(c => c.status === 'available').length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>คูปองที่ใช้ได้</div>
        </div>
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <CheckCircle size={24} color="var(--success)" style={{ margin: '0 auto 0.5rem auto' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.25rem' }}>
            {loading ? '...' : customerCoupons.filter(c => c.status === 'used').length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ใช้แล้ว</div>
        </div>
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <DollarSign size={24} color="var(--warning)" style={{ margin: '0 auto 0.5rem auto' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)', marginBottom: '0.25rem' }}>
            {loading ? '...' : formatCurrency(customerCoupons.filter(c => c.savedAmount).reduce((sum, c) => sum + c.savedAmount, 0))}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ประหยัดทั้งหมด</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '0.75rem',
        padding: '0.5rem',
        marginBottom: '1.5rem',
        border: '1px solid var(--border-color)',
        display: 'flex',
        overflowX: 'auto'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: activeTab === tab.id ? 'var(--tab-active)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              minWidth: 'max-content',
              transition: 'all 0.2s ease'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--tab-active)',
                color: 'white',
                borderRadius: '50%',
                width: '1.25rem',
                height: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexDirection: windowWidth <= 768 ? 'column' : 'row'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={20} style={{
            position: 'absolute',
            left: '1rem',
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
              padding: '0.75rem 1rem 0.75rem 3rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            minWidth: '150px'
          }}
        >
          <option value="all">ทุกหมวดหมู่</option>
          {categories.slice(1).map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Coupons List */}
      {filteredCoupons.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 
            windowWidth <= 640 ? '1fr' : 
            windowWidth <= 1024 ? 'repeat(2, 1fr)' :
            windowWidth <= 1440 ? 'repeat(3, 1fr)' :
            'repeat(4, 1fr)',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {filteredCoupons.map(renderCouponCard)}
        </div>
      ) : (
        renderEmptyState()
      )}

      {/* Coupon Detail Modal */}
      {renderCouponDetailModal()}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default ClientCoupons;