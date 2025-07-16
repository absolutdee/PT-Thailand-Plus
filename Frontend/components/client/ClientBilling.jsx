import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Download, Receipt, Calendar,
  CheckCircle, Clock, AlertTriangle, XCircle,
  Plus, Edit, Trash2, Eye, Filter,
  ArrowUpRight, ArrowDownRight, MoreVertical,
  Package, User, Target, Star, Zap, Gift,
  Bookmark, TrendingUp, Activity, Award,
  MessageCircle, Bell, Heart, Share2,
  RefreshCw, Search, ChevronDown, ChevronRight,
  PlayCircle, PauseCircle, MapPin, Phone, Mail, 
  Globe, Info, DollarSign, Percent, Timer, Users,
  Loader
} from 'lucide-react';

const ClientBilling = () => {
  const [activeTab, setActiveTab] = useState('packages');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  
  // API Data States
  const [currentPackages, setCurrentPackages] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [loading, setLoading] = useState({
    packages: false,
    history: false,
    available: false
  });
  const [error, setError] = useState({
    packages: null,
    history: null,
    available: null
  });

  const windowWidth = window.innerWidth;

  // Set CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', '#232956');
    root.style.setProperty('--accent', '#df2528');
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-secondary', '#fafafa');
    root.style.setProperty('--text-primary', '#1a202c');
    root.style.setProperty('--text-secondary', '#718096');
    root.style.setProperty('--text-muted', '#a0aec0');
    root.style.setProperty('--text-white', '#ffffff');
    root.style.setProperty('--border-color', '#e2e8f0');
    root.style.setProperty('--success', '#48bb78');
    root.style.setProperty('--warning', '#ed8936');
    root.style.setProperty('--info', '#4299e1');
    root.style.setProperty('--danger', '#f56565');
  }, []);

  // API Base URL - แก้ไขตาม environment ของคุณ
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  // API Helper Function
  const apiCall = async (endpoint, options = {}) => {
    try {
      const token = localStorage.getItem('authToken'); // หรือวิธีที่คุณเก็บ token
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Fetch Current Packages
  const fetchCurrentPackages = async () => {
    setLoading(prev => ({ ...prev, packages: true }));
    setError(prev => ({ ...prev, packages: null }));
    
    try {
      const data = await apiCall('/client/packages/current');
      setCurrentPackages(data.packages || []);
    } catch (err) {
      setError(prev => ({ ...prev, packages: 'ไม่สามารถโหลดข้อมูลแพคเกจได้' }));
      console.error('Error fetching current packages:', err);
    } finally {
      setLoading(prev => ({ ...prev, packages: false }));
    }
  };

  // Fetch Payment History
  const fetchPaymentHistory = async () => {
    setLoading(prev => ({ ...prev, history: true }));
    setError(prev => ({ ...prev, history: null }));
    
    try {
      const data = await apiCall(`/client/payments/history?period=${selectedPeriod}`);
      setPaymentHistory(data.payments || []);
    } catch (err) {
      setError(prev => ({ ...prev, history: 'ไม่สามารถโหลดประวัติการชำระเงินได้' }));
      console.error('Error fetching payment history:', err);
    } finally {
      setLoading(prev => ({ ...prev, history: false }));
    }
  };

  // Fetch Available Packages
  const fetchAvailablePackages = async () => {
    setLoading(prev => ({ ...prev, available: true }));
    setError(prev => ({ ...prev, available: null }));
    
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterLevel !== 'all') params.append('level', filterLevel);
      
      const data = await apiCall(`/packages/available?${params}`);
      setAvailablePackages(data.packages || []);
    } catch (err) {
      setError(prev => ({ ...prev, available: 'ไม่สามารถโหลดแพคเกจที่มีได้' }));
      console.error('Error fetching available packages:', err);
    } finally {
      setLoading(prev => ({ ...prev, available: false }));
    }
  };

  // Purchase Package
  const purchasePackage = async (packageId) => {
    try {
      setLoading(prev => ({ ...prev, packages: true }));
      
      const data = await apiCall('/client/packages/purchase', {
        method: 'POST',
        body: JSON.stringify({ packageId })
      });

      if (data.success) {
        // Refresh current packages and payment history
        await fetchCurrentPackages();
        await fetchPaymentHistory();
        setShowPackageModal(false);
        
        // Show success message (คุณอาจจะใช้ notification library)
        alert('ซื้อแพคเกจสำเร็จ!');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการซื้อแพคเกจ: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, packages: false }));
    }
  };

  // Download Invoice
  const downloadInvoice = async (invoiceId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/client/payments/invoice/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      alert('ไม่สามารถดาวน์โหลดใบเสร็จได้');
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCurrentPackages();
  }, []);

  // Fetch payment history when period changes
  useEffect(() => {
    if (activeTab === 'history') {
      fetchPaymentHistory();
    }
  }, [activeTab, selectedPeriod]);

  // Fetch available packages when search/filter changes
  useEffect(() => {
    if (activeTab === 'available') {
      const debounceTimer = setTimeout(() => {
        fetchAvailablePackages();
      }, 500); // Debounce search

      return () => clearTimeout(debounceTimer);
    }
  }, [activeTab, searchTerm, filterLevel]);

  const tabs = [
    { id: 'packages', label: 'แพคเกจของฉัน', icon: Package },
    { id: 'history', label: 'ประวัติการชำระ', icon: Receipt },
    { id: 'available', label: 'แพคเกจที่มี', icon: Gift }
  ];

  const periods = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'month', label: 'เดือนนี้' },
    { id: 'quarter', label: '3 เดือนที่แล้ว' },
    { id: 'year', label: 'ปีนี้' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--success)';
      case 'expired': return 'var(--danger)';
      case 'pending': return 'var(--warning)';
      case 'completed': return 'var(--success)';
      case 'failed': return 'var(--danger)';
      case 'processing': return 'var(--info)';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'ใช้งาน';
      case 'expired': return 'หมดอายุ';
      case 'pending': return 'รอดำเนินการ';
      case 'completed': return 'สำเร็จ';
      case 'failed': return 'ล้มเหลว';
      case 'processing': return 'กำลังดำเนินการ';
      default: return status;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'premium': return 'var(--warning)';
      case 'advanced': return 'var(--accent)';
      case 'standard': return 'var(--info)';
      case 'group': return 'var(--success)';
      default: return 'var(--text-muted)';
    }
  };

  const getLevelText = (level) => {
    switch (level) {
      case 'premium': return 'พรีเมียม';
      case 'advanced': return 'ขั้นสูง';
      case 'standard': return 'มาตรฐาน';
      case 'group': return 'กลุ่ม';
      default: return level;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredPackages = () => {
    return availablePackages.filter(pkg => {
      const matchesSearch = pkg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.trainer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLevel = filterLevel === 'all' || pkg.level === filterLevel;
      
      return matchesSearch && matchesLevel;
    });
  };

  // Loading Component
  const LoadingSpinner = ({ message = 'กำลังโหลด...' }) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem',
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '0.75rem',
      border: '1px solid var(--border-color)'
    }}>
      <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)', marginBottom: '1rem' }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{message}</p>
    </div>
  );

  // Error Component
  const ErrorMessage = ({ message, onRetry }) => (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '0.75rem',
      border: '1px solid var(--danger)',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <AlertTriangle size={32} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
      <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
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

  const renderCurrentPackages = () => {
    if (loading.packages) {
      return <LoadingSpinner message="กำลังโหลดแพคเกจของคุณ..." />;
    }

    if (error.packages) {
      return <ErrorMessage message={error.packages} onRetry={fetchCurrentPackages} />;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.5rem' }}>
              {currentPackages.filter(p => p.status === 'active').length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>แพคเกจใช้งาน</div>
          </div>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.5rem' }}>
              {currentPackages.reduce((sum, p) => sum + (p.sessionsUsed || 0), 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เซสชั่นที่ใช้</div>
          </div>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)', marginBottom: '0.5rem' }}>
              {currentPackages.reduce((sum, p) => sum + (p.sessionsRemaining || 0), 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เซสชั่นคงเหลือ</div>
          </div>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '0.5rem' }}>
              {currentPackages.length > 0 ? Math.round(currentPackages.reduce((sum, p) => sum + (p.completionRate || 0), 0) / currentPackages.length) : 0}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ความสำเร็จเฉลี่ย</div>
          </div>
        </div>

        {/* Package Cards */}
        {currentPackages.map(pkg => (
          <div key={pkg.id} style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: `2px solid ${pkg.status === 'active' ? 'var(--success)' : 'var(--border-color)'}`,
            padding: '1.5rem',
            position: 'relative',
            boxShadow: pkg.status === 'active' ? '0 4px 12px rgba(72, 187, 120, 0.15)' : 'none'
          }}>
            {/* Status Badge */}
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '1rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              backgroundColor: `${getStatusColor(pkg.status)}15`,
              color: getStatusColor(pkg.status),
              border: `1px solid ${getStatusColor(pkg.status)}30`
            }}>
              {getStatusText(pkg.status)}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: windowWidth <= 768 ? '1fr' : '2fr 1fr',
              gap: '2rem'
            }}>
              {/* Package Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '4rem',
                    height: '4rem',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'var(--text-white)'
                  }}>
                    {pkg.trainer?.avatar || pkg.trainer?.name?.charAt(0) || 'T'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {pkg.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        กับ {pkg.trainer?.name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Star size={12} fill="var(--warning)" color="var(--warning)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{pkg.trainer?.rating || 0}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {pkg.trainer?.specialization} • {pkg.trainer?.experience}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {formatCurrency(pkg.price)}
                    {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                      <span style={{ 
                        fontSize: '1rem', 
                        fontWeight: '400', 
                        color: 'var(--text-muted)', 
                        textDecoration: 'line-through',
                        marginLeft: '0.5rem'
                      }}>
                        {formatCurrency(pkg.originalPrice)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {formatDate(pkg.startDate)} - {formatDate(pkg.endDate)}
                  </div>
                  {pkg.nextSession && pkg.status === 'active' && (
                    <div style={{
                      fontSize: '0.875rem',
                      color: 'var(--accent)',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Calendar size={14} />
                      เซสชั่นถัดไป: {formatDateTime(pkg.nextSession)}
                    </div>
                  )}
                </div>

                {/* Achievements */}
                {pkg.achievements && pkg.achievements.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                      ความสำเร็จ
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {pkg.achievements.map((achievement, index) => (
                        <div key={index} style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: 'rgba(72, 187, 120, 0.1)',
                          color: 'var(--success)',
                          border: '1px solid rgba(72, 187, 120, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <Award size={12} />
                          {achievement}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                    สิ่งที่รวมอยู่ในแพคเกจ
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
                    gap: '0.5rem'
                  }}>
                    {(pkg.features || []).map((feature, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <CheckCircle size={14} color="var(--success)" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Usage Stats & Actions */}
              <div>
                <div style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                    การใช้งาน
                  </h4>

                  {/* Sessions Progress */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>เซสชั่น</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                        {pkg.sessionsUsed || 0}/{pkg.sessionsTotal || 0}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: 'var(--border-color)',
                      borderRadius: '1rem',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${pkg.sessionsTotal ? ((pkg.sessionsUsed || 0) / pkg.sessionsTotal) * 100 : 0}%`,
                        backgroundColor: pkg.status === 'active' ? 'var(--primary)' : 'var(--text-muted)',
                        borderRadius: '1rem',
                        transition: 'width 0.6s ease'
                      }}></div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1rem',
                    textAlign: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: pkg.status === 'active' ? 'var(--success)' : 'var(--text-muted)' }}>
                        {pkg.sessionsRemaining || 0}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เซสชั่นเหลือ</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: pkg.status === 'active' ? 'var(--warning)' : 'var(--text-muted)' }}>
                        {pkg.daysRemaining || 0}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>วันเหลือ</div>
                    </div>
                  </div>

                  {/* Additional Stats */}
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>แคลอรี่เผาผลาญ:</span>
                      <span style={{ fontWeight: '600', color: 'var(--accent)' }}>{(pkg.totalCaloriesBurned || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>เวลาเฉลี่ย/เซสชั่น:</span>
                      <span style={{ fontWeight: '600' }}>{pkg.averageWorkoutDuration || 0} นาที</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>ความสำเร็จ:</span>
                      <span style={{ fontWeight: '600', color: 'var(--success)' }}>{pkg.completionRate || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {pkg.status === 'active' && (
                    <>
                      <button style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--text-white)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}>
                        <Calendar size={16} />
                        จองเซสชั่น
                      </button>
                      <button style={{
                        backgroundColor: 'var(--accent)',
                        color: 'var(--text-white)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}>
                        <RefreshCw size={16} />
                        ต่ออายุแพคเกจ
                      </button>
                      <button style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}>
                        <MessageCircle size={16} />
                        แชทกับเทรนเนอร์
                      </button>
                    </>
                  )}
                  
                  {pkg.status === 'expired' && (
                    <>
                      {pkg.canRenew && (
                        <button style={{
                          backgroundColor: 'var(--accent)',
                          color: 'var(--text-white)',
                          border: 'none',
                          borderRadius: '0.5rem',
                          padding: '0.75rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}>
                          <RefreshCw size={16} />
                          ซื้อแพคเกจใหม่
                        </button>
                      )}
                      {pkg.rating && (
                        <div style={{
                          padding: '0.75rem',
                          backgroundColor: 'rgba(72, 187, 120, 0.1)',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(72, 187, 120, 0.3)',
                          fontSize: '0.875rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: '600', color: 'var(--success)' }}>รีวิวของคุณ:</span>
                            <div style={{ display: 'flex', gap: '0.125rem' }}>
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={12} 
                                  fill={i < pkg.rating ? 'var(--warning)' : 'none'} 
                                  color="var(--warning)" 
                                />
                              ))}
                            </div>
                          </div>
                          {pkg.review && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              "{pkg.review}"
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setShowPackageModal(true);
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Eye size={16} />
                    ดูรายละเอียด
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {currentPackages.length === 0 && !loading.packages && !error.packages && (
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <Package size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              ยังไม่มีแพคเกจ
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              เลือกแพคเกจที่เหมาะกับคุณเพื่อเริ่มต้นการออกกำลังกาย
            </p>
            <button
              onClick={() => setActiveTab('available')}
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ดูแพคเกจที่มี
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderPaymentHistory = () => {
    if (loading.history) {
      return <LoadingSpinner message="กำลังโหลดประวัติการชำระเงิน..." />;
    }

    if (error.history) {
      return <ErrorMessage message={error.history} onRetry={fetchPaymentHistory} />;
    }

    return (
      <div>
        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.5rem' }}>
              {formatCurrency(paymentHistory.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0))}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ยอดรวมที่จ่าย</div>
          </div>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.5rem' }}>
              {paymentHistory.filter(t => t.type === 'package_purchase').length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>แพคเกจที่ซื้อ</div>
          </div>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)', marginBottom: '0.5rem' }}>
              {formatCurrency(paymentHistory.filter(t => t.discount).reduce((sum, t) => sum + (t.discount || 0), 0))}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ส่วนลดทั้งหมด</div>
          </div>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--danger)', marginBottom: '0.5rem' }}>
              {formatCurrency(Math.abs(paymentHistory.filter(t => t.type === 'refund').reduce((sum, t) => sum + t.amount, 0)))}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เงินคืน</div>
          </div>
        </div>

        {/* Transactions List */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ 
            padding: '1.5rem 1.5rem 1rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                ประวัติการทำรายการ
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-primary)'
                  }}
                >
                  {periods.map(period => (
                    <option key={period.id} value={period.id}>{period.label}</option>
                  ))}
                </select>
                <button style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--text-white)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <Download size={16} />
                </button>
              </div>
            </div>
          </div>

          <div>
            {paymentHistory.map(transaction => (
              <div key={transaction.id} style={{
                padding: '1.5rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  backgroundColor: transaction.type === 'refund' ? 'rgba(245, 101, 101, 0.1)' : 'rgba(72, 187, 120, 0.1)',
                  borderRadius: '50%',
                  width: '2.5rem',
                  height: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: transaction.type === 'refund' ? 'var(--danger)' : 'var(--success)'
                }}>
                  {transaction.type === 'refund' ? <ArrowDownRight size={16} /> : 
                   transaction.type === 'package_purchase' ? <Package size={16} /> :
                   <Calendar size={16} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {transaction.description}
                      </h4>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem', 
                        fontSize: '0.875rem', 
                        color: 'var(--text-secondary)',
                        flexWrap: 'wrap'
                      }}>
                        <span>{formatDateTime(transaction.date)}</span>
                        <span>{transaction.method}</span>
                        {transaction.methodDetails && <span>{transaction.methodDetails}</span>}
                        <span style={{
                          padding: '0.125rem 0.5rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          backgroundColor: `${getStatusColor(transaction.status)}15`,
                          color: getStatusColor(transaction.status)
                        }}>
                          {getStatusText(transaction.status)}
                        </span>
                      </div>
                      {transaction.invoiceId && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Invoice: {transaction.invoiceId}
                          {transaction.transactionId && ` • TXN: ${transaction.transactionId}`}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: '700', 
                        color: transaction.amount < 0 ? 'var(--danger)' : 'var(--success)',
                        marginBottom: '0.25rem'
                      }}>
                        {transaction.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                      </div>
                      
                      {transaction.originalAmount && transaction.discount && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span style={{ textDecoration: 'line-through' }}>
                            {formatCurrency(transaction.originalAmount)}
                          </span>
                          <span style={{ color: 'var(--success)', marginLeft: '0.5rem' }}>
                            ลด {formatCurrency(transaction.discount)}
                          </span>
                        </div>
                      )}
                      
                      {transaction.vat && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          VAT: {formatCurrency(transaction.vat)}
                        </div>
                      )}
                    </div>
                  </div>

                  {transaction.discountReason && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--success)',
                      backgroundColor: 'rgba(72, 187, 120, 0.1)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      marginBottom: '0.5rem',
                      display: 'inline-block'
                    }}>
                      💡 {transaction.discountReason}
                    </div>
                  )}

                  {transaction.refundReason && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--danger)',
                      backgroundColor: 'rgba(245, 101, 101, 0.1)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      marginBottom: '0.5rem',
                      display: 'inline-block'
                    }}>
                      🔄 เหตุผลการคืนเงิน: {transaction.refundReason}
                    </div>
                  )}

                  {transaction.trainer && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      กับ {transaction.trainer}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button 
                    onClick={() => downloadInvoice(transaction.invoiceId)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Receipt size={14} />
                    ใบเสร็จ
                  </button>
                  <button style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    color: 'var(--text-muted)'
                  }}>
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {paymentHistory.length === 0 && !loading.history && !error.history && (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <Receipt size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                ยังไม่มีประวัติการชำระเงิน
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                ประวัติการทำรายการจะแสดงที่นี่เมื่อมีการซื้อแพคเกจ
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAvailablePackages = () => {
    if (loading.available) {
      return <LoadingSpinner message="กำลังโหลดแพคเกจที่มี..." />;
    }

    if (error.available) {
      return <ErrorMessage message={error.available} onRetry={fetchAvailablePackages} />;
    }

    const filteredPackages = getFilteredPackages();

    return (
      <div>
        {/* Search and Filters */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: windowWidth <= 768 ? 'column' : 'row',
            gap: '1rem',
            marginBottom: '1rem'
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
                placeholder="ค้นหาแพคเกจ เทรนเนอร์ หรือคำอธิบาย..."
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
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                backgroundColor: 'var(--bg-primary)',
                minWidth: '150px'
              }}
            >
              <option value="all">ทุกระดับ</option>
              <option value="group">กลุ่ม</option>
              <option value="standard">มาตรฐาน</option>
              <option value="advanced">ขั้นสูง</option>
              <option value="premium">พรีเมียม</option>
            </select>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            พบ {filteredPackages.length} แพคเกจ
          </div>
        </div>

        {/* Packages Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredPackages.map(pkg => (
            <div key={pkg.id} style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              position: 'relative',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              {/* Badges */}
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pkg.popular && (
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backgroundColor: 'var(--accent)',
                    color: 'var(--text-white)',
                    textAlign: 'center'
                  }}>
                    แนะนำ
                  </div>
                )}
                <div style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  backgroundColor: `${getLevelColor(pkg.level)}15`,
                  color: getLevelColor(pkg.level),
                  textAlign: 'center'
                }}>
                  {getLevelText(pkg.level)}
                </div>
              </div>

              {/* Trainer Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-white)'
                }}>
                  {pkg.trainer?.avatar || pkg.trainer?.name?.charAt(0) || 'T'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {pkg.trainer?.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Star size={10} fill="var(--warning)" color="var(--warning)" />
                      <span>{pkg.trainer?.rating || 0}</span>
                    </div>
                    <span>•</span>
                    <span>{pkg.trainer?.experience}</span>
                    <span>•</span>
                    <span>{pkg.trainer?.specialization}</span>
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {pkg.name}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
                  {pkg.description}
                </p>

                {/* Price */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {formatCurrency(pkg.price)}
                    </span>
                    {pkg.originalPrice && (
                      <span style={{ 
                        fontSize: '1.125rem', 
                        color: 'var(--text-muted)', 
                        textDecoration: 'line-through' 
                      }}>
                        {formatCurrency(pkg.originalPrice)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {pkg.duration} • {pkg.sessionsCount} เซสชั่น
                  </div>
                  {pkg.discountText && (
                    <div style={{
                      fontSize: '0.875rem',
                      color: 'var(--success)',
                      fontWeight: '600',
                      marginTop: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Percent size={14} />
                      {pkg.discountText}
                    </div>
                  )}
                </div>

                {/* Rating & Reviews */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Star size={14} color="var(--warning)" fill="var(--warning)" />
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{pkg.rating}</span>
                  </div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {pkg.reviews} รีวิว
                  </span>
                  {pkg.guarantee && (
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--success)',
                      backgroundColor: 'rgba(72, 187, 120, 0.1)',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '0.25rem'
                    }}>
                      รับประกัน
                    </span>
                  )}
                </div>

                {/* Average Results */}
                {pkg.averageResults && (
                  <div style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      ผลลัพธ์เฉลี่ย
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem' }}>
                      {pkg.averageResults.weightLoss && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>ลดน้ำหนัก:</span>
                          <span style={{ fontWeight: '600', color: 'var(--success)' }}>{pkg.averageResults.weightLoss}</span>
                        </div>
                      )}
                      {pkg.averageResults.muscleGain && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>เพิ่มกล้ามเนื้อ:</span>
                          <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{pkg.averageResults.muscleGain}</span>
                        </div>
                      )}
                      {pkg.averageResults.fatReduction && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>ลดไขมัน:</span>
                          <span style={{ fontWeight: '600', color: 'var(--accent)' }}>{pkg.averageResults.fatReduction}</span>
                        </div>
                      )}
                      {pkg.averageResults.strengthIncrease && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>เพิ่มความแข็งแรง:</span>
                          <span style={{ fontWeight: '600', color: 'var(--warning)' }}>{pkg.averageResults.strengthIncrease}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Package Info */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} />
                    {pkg.schedule}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={12} />
                    {pkg.location}
                  </div>
                </div>

                {/* Tags */}
                {pkg.tags && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {pkg.tags.map((tag, index) => (
                      <span key={index} style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Features - First 4 only */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                    สิ่งที่รวมอยู่ในแพคเกจ
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(pkg.features || []).slice(0, 4).map((feature, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <CheckCircle size={14} color="var(--success)" />
                        {feature}
                      </div>
                    ))}
                    {(pkg.features || []).length > 4 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        และอีก {pkg.features.length - 4} รายการ...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => purchasePackage(pkg.id)}
                  disabled={loading.packages}
                  style={{
                    flex: 1,
                    backgroundColor: loading.packages ? 'var(--text-muted)' : 'var(--primary)',
                    color: 'var(--text-white)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: loading.packages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {loading.packages ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  {loading.packages ? 'กำลังซื้อ...' : 'เลือกแพคเกจนี้'}
                </button>
                <button style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}>
                  <Heart size={16} />
                </button>
                <button style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}>
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredPackages.length === 0 && !loading.available && !error.available && (
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <Search size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              ไม่พบแพคเกจที่ค้นหา
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              ลองเปลี่ยนคำค้นหาหรือตัวกรองเพื่อดูแพคเกจที่มี
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterLevel('all');
              }}
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ดูแพคเกจทั้งหมด
            </button>
          </div>
        )}
      </div>
    );
  };

  // Package Detail Modal
  const PackageModal = () => {
    if (!showPackageModal || !selectedPackage) return null;

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
          borderRadius: '0.75rem',
          padding: '2rem',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              รายละเอียดแพคเกจ
            </h3>
            <button
              onClick={() => setShowPackageModal(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              ✕
            </button>
          </div>
          
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            <Package size={48} style={{ margin: '0 auto 1rem' }} />
            <p>รายละเอียดแพคเกจจะแสดงที่นี่</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setShowPackageModal(false)}
              style={{
                flex: 1,
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              ปิด
            </button>
            <button
              onClick={() => purchasePackage(selectedPackage.id)}
              disabled={loading.packages}
              style={{
                flex: 1,
                backgroundColor: loading.packages ? 'var(--text-muted)' : 'var(--primary)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: loading.packages ? 'not-allowed' : 'pointer'
              }}
            >
              {loading.packages ? 'กำลังซื้อ...' : 'เลือกแพคเกจนี้'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: windowWidth <= 768 ? '1rem' : '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: windowWidth <= 768 ? '1.5rem' : '1.75rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          marginBottom: '0.5rem' 
        }}>
          การเงินและแพคเกจ
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          จัดการแพคเกจ ประวัติการชำระเงิน และค้นหาแพคเกจใหม่
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
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-white)' : 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flex: windowWidth <= 768 ? '1' : 'auto',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <tab.icon size={16} />
            {windowWidth <= 768 ? tab.label.split(' ')[0] : tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'packages' && renderCurrentPackages()}
      {activeTab === 'history' && renderPaymentHistory()}
      {activeTab === 'available' && renderAvailablePackages()}

      {/* Package Modal */}
      <PackageModal />
      
      {/* CSS Animation for Loader */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ClientBilling;