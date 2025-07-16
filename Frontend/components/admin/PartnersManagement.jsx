import React, { useState, useRef, useEffect } from 'react';
import { 
  Briefcase, Search, Filter, Plus, Edit, Trash2, Eye,
  CheckCircle, Clock, Phone, Mail, Globe, MapPin,
  Star, Users, DollarSign, Calendar, Image, ArrowLeft,
  Save, X, Upload, Percent, AlertCircle, Loader, RefreshCw
} from 'lucide-react';

// Main Partners Management Component
const PartnersManagement = ({ windowWidth }) => {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'add', 'edit'
  const [selectedPartner, setSelectedPartner] = useState(null);
  
  // Database connection states
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalPartners: 0,
    activePartners: 0,
    totalSales: 0,
    totalCustomers: 0
  });

  // API Functions
  const apiCall = async (url, method = 'GET', data = null) => {
    try {
      const config = {
        method,
        headers: {
          'Content-Type': data instanceof FormData ? undefined : 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };

      if (data && method !== 'GET') {
        config.body = data instanceof FormData ? data : JSON.stringify(data);
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

  // Fetch partners from database
  const fetchPartners = async () => {
    try {
      const response = await apiCall('/partners');
      if (response.success) {
        setPartners(response.data.partners);
        setStats(response.data.stats);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch partners');
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      throw error;
    }
  };

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchPartners();
    } catch (error) {
      setError(error.message);
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Add partner
  const handleAddPartner = () => {
    setSelectedPartner(null);
    setCurrentView('add');
  };

  // Edit partner
  const handleEditPartner = (partner) => {
    setSelectedPartner(partner);
    setCurrentView('edit');
  };

  // Save partner (create or update)
  const handleSavePartner = async (partnerData) => {
    try {
      if (selectedPartner) {
        // Update existing partner
        const response = await apiCall(`/partners/${selectedPartner.id}`, 'PUT', partnerData);
        if (response.success) {
          setPartners(prev => prev.map(p => 
            p.id === selectedPartner.id 
              ? { ...p, ...response.data }
              : p
          ));
        } else {
          throw new Error(response.message || 'Failed to update partner');
        }
      } else {
        // Add new partner
        const response = await apiCall('/partners', 'POST', partnerData);
        if (response.success) {
          setPartners(prev => [...prev, response.data]);
        } else {
          throw new Error(response.message || 'Failed to create partner');
        }
      }
      
      setCurrentView('list');
      // Refresh stats
      await fetchPartners();
    } catch (error) {
      console.error('Error saving partner:', error);
      throw error; // Re-throw to be handled by the form component
    }
  };

  // Delete partner
  const handleDeletePartner = async (partnerId) => {
    if (window.confirm('ต้องการลบพาร์ทเนอร์นี้หรือไม่?')) {
      try {
        const response = await apiCall(`/partners/${partnerId}`, 'DELETE');
        if (response.success) {
          setPartners(prev => prev.filter(p => p.id !== partnerId));
          // Refresh stats
          await fetchPartners();
        } else {
          throw new Error(response.message || 'Failed to delete partner');
        }
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleBack = () => {
    setCurrentView('list');
    setSelectedPartner(null);
  };

  // Loading Component
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
        <p style={{ color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูลพาร์ทเนอร์...</p>
      </div>
    );
  }

  // Error Component
  if (error) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '0.75rem',
        border: '1px solid var(--danger)'
      }}>
        <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>เกิดข้อผิดพลาด</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={loadData}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: '0 auto'
          }}
        >
          <RefreshCw size={16} />
          ลองใหม่
        </button>
      </div>
    );
  }

  if (currentView === 'add' || currentView === 'edit') {
    return (
      <AddEditPartner
        windowWidth={windowWidth}
        partner={selectedPartner}
        onBack={handleBack}
        onSave={handleSavePartner}
      />
    );
  }

  return (
    <PartnersList
      windowWidth={windowWidth}
      partners={partners}
      stats={stats}
      onAddPartner={handleAddPartner}
      onEditPartner={handleEditPartner}
      onDeletePartner={handleDeletePartner}
    />
  );
};

// Partners List Component
const PartnersList = ({ windowWidth, partners, stats, onAddPartner, onEditPartner, onDeletePartner }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const partnerTypes = [
    { value: 'supplement', label: 'อาหารเสริม', color: 'var(--success)' },
    { value: 'apparel', label: 'เสื้อผ้ากีฬา', color: 'var(--info)' },
    { value: 'food', label: 'อาหารสุขภาพ', color: 'var(--warning)' },
    { value: 'equipment', label: 'อุปกรณ์กีฬา', color: 'var(--accent)' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'var(--success)';
      case 'pending':
        return 'var(--warning)';
      case 'inactive':
        return 'var(--text-muted)';
      case 'suspended':
        return 'var(--danger)';
      default:
        return 'var(--text-muted)';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'ใช้งาน';
      case 'pending':
        return 'รอการอนุมัติ';
      case 'inactive':
        return 'ไม่ใช้งาน';
      case 'suspended':
        return 'ระงับการใช้งาน';
      default:
        return status;
    }
  };

  const getTypeInfo = (type) => {
    return partnerTypes.find(t => t.value === type) || { label: type, color: 'var(--text-muted)' };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || partner.status === statusFilter;
    const matchesType = typeFilter === 'all' || partner.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '1.75rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          marginBottom: '0.5rem' 
        }}>
          จัดการพาร์ทเนอร์
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          จัดการพาร์ทเนอร์ธุรกิจและข้อตกลงความร่วมมือ
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Briefcase size={20} color="var(--accent)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>พาร์ทเนอร์ทั้งหมด</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.totalPartners}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <CheckCircle size={20} color="var(--success)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ใช้งาน</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.activePartners}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <DollarSign size={20} color="var(--info)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ยอดขายรวม</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {formatCurrency(stats.totalSales)}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Users size={20} color="var(--warning)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ลูกค้าที่ใช้งาน</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.totalCustomers.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        flexDirection: windowWidth <= 768 ? 'column' : 'row',
        gap: '1rem',
        marginBottom: '1.5rem',
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
            placeholder="ค้นหาพาร์ทเนอร์..."
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
            minWidth: '140px'
          }}
        >
          <option value="all">ประเภททั้งหมด</option>
          {partnerTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
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
          <option value="all">สถานะทั้งหมด</option>
          <option value="active">ใช้งาน</option>
          <option value="pending">รอการอนุมัติ</option>
          <option value="inactive">ไม่ใช้งาน</option>
          <option value="suspended">ระงับการใช้งาน</option>
        </select>
        <button
          onClick={onAddPartner}
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--accent)',
            color: 'var(--text-white)',
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
          <Plus size={16} />
          เพิ่มพาร์ทเนอร์ใหม่
        </button>
      </div>

      {/* Partners Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(auto-fill, minmax(400px, 1fr))',
        gap: '1.5rem'
      }}>
        {filteredPartners.map((partner) => (
          <div key={partner.id} style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem'
          }}>
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              justifyContent: 'space-between',
              marginBottom: '1rem' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  backgroundImage: partner.logo_url ? `url(${partner.logo_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}>
                  {!partner.logo_url && <Image size={24} />}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.25rem'
                  }}>
                    {partner.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: `${getTypeInfo(partner.type).color}20`,
                      color: getTypeInfo(partner.type).color,
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {getTypeInfo(partner.type).label}
                    </span>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: `${getStatusColor(partner.status)}20`,
                      color: getStatusColor(partner.status),
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {getStatusText(partner.status)}
                    </span>
                  </div>
                  {partner.rating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Star size={14} fill="var(--warning)" color="var(--warning)" />
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {partner.rating}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => partner.website && window.open(`https://${partner.website}`, '_blank')}
                  disabled={!partner.website}
                  style={{
                    padding: '0.25rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: partner.website ? 'var(--text-muted)' : 'var(--text-disabled)',
                    cursor: partner.website ? 'pointer' : 'not-allowed'
                  }}
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => onEditPartner(partner)}
                  style={{
                    padding: '0.25rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => onDeletePartner(partner.id)}
                  style={{
                    padding: '0.25rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--danger)',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Description */}
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.5',
              marginBottom: '1rem'
            }}>
              {partner.description}
            </p>

            {/* Contact Info */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={14} color="var(--text-muted)" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {partner.email}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={14} color="var(--text-muted)" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {partner.phone}
                </span>
              </div>
              {partner.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Globe size={14} color="var(--text-muted)" />
                  <a 
                    href={`https://${partner.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--accent)',
                      textDecoration: 'none'
                    }}
                  >
                    {partner.website}
                  </a>
                </div>
              )}
            </div>

            {/* Performance Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-muted)',
                  marginBottom: '0.25rem'
                }}>
                  ยอดขายรวม
                </div>
                <div style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  {formatCurrency(partner.total_sales || 0)}
                </div>
              </div>
              <div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-muted)',
                  marginBottom: '0.25rem'
                }}>
                  ลูกค้า
                </div>
                <div style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  {partner.customers || 0} คน
                </div>
              </div>
            </div>

            {/* Commission & Discount */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)'
            }}>
              <div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-muted)',
                  marginBottom: '0.25rem'
                }}>
                  คอมมิชชั่น
                </div>
                <div style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600',
                  color: 'var(--success)'
                }}>
                  {partner.commission}%
                </div>
              </div>
              <div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-muted)',
                  marginBottom: '0.25rem'
                }}>
                  ส่วนลด
                </div>
                <div style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600',
                  color: 'var(--accent)'
                }}>
                  {partner.discount}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPartners.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: 'var(--text-secondary)'
        }}>
          <Briefcase size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>ไม่พบพาร์ทเนอร์ที่ตรงกับเงื่อนไขการค้นหา</p>
        </div>
      )}
    </div>
  );
};

// Add/Edit Partner Component
const AddEditPartner = ({ windowWidth, partner = null, onBack, onSave }) => {
  const [formData, setFormData] = useState({
    name: partner?.name || '',
    type: partner?.type || 'supplement',
    description: partner?.description || '',
    email: partner?.email || '',
    phone: partner?.phone || '',
    website: partner?.website || '',
    address: partner?.address || '',
    commission: partner?.commission || '',
    discount: partner?.discount || '',
    status: partner?.status || 'pending',
    logo: null
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState(partner?.logo_url || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const partnerTypes = [
    { value: 'supplement', label: 'อาหารเสริม' },
    { value: 'apparel', label: 'เสื้อผ้ากีฬา' },
    { value: 'food', label: 'อาหารสุขภาพ' },
    { value: 'equipment', label: 'อุปกรณ์กีฬา' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'รอการอนุมัติ' },
    { value: 'active', label: 'ใช้งาน' },
    { value: 'inactive', label: 'ไม่ใช้งาน' },
    { value: 'suspended', label: 'ระงับการใช้งาน' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          logo: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น'
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          logo: 'ขนาดไฟล์ต้องไม่เกิน 5MB'
        }));
        return;
      }

      try {
        setUploading(true);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewLogo(e.target.result);
        };
        reader.readAsDataURL(file);

        setFormData(prev => ({
          ...prev,
          logo: file
        }));
        
        // Clear logo error
        if (errors.logo) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.logo;
            return newErrors;
          });
        }
      } catch (error) {
        setErrors(prev => ({
          ...prev,
          logo: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์'
        }));
      } finally {
        setUploading(false);
      }
    }
  };

  const removeLogo = () => {
    setPreviewLogo(null);
    setFormData(prev => ({
      ...prev,
      logo: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'กรุณากรอกชื่อพาร์ทเนอร์';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'กรุณากรอกคำอธิบาย';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'กรุณากรอกอีเมล';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    }

    if (!formData.website.trim()) {
      newErrors.website = 'กรุณากรอกเว็บไซต์';
    } else if (!/^https?:\/\/.+\..+/.test(formData.website) && !formData.website.startsWith('www.')) {
      newErrors.website = 'รูปแบบเว็บไซต์ไม่ถูกต้อง';
    }

    if (!formData.commission.toString().trim()) {
      newErrors.commission = 'กรุณากรอกคอมมิชชั่น';
    } else if (isNaN(formData.commission) || parseFloat(formData.commission) < 0 || parseFloat(formData.commission) > 100) {
      newErrors.commission = 'คอมมิชชั่นต้องเป็นตัวเลข 0-100';
    }

    if (!formData.discount.toString().trim()) {
      newErrors.discount = 'กรุณากรอกส่วนลด';
    } else if (isNaN(formData.discount) || parseFloat(formData.discount) < 0 || parseFloat(formData.discount) > 100) {
      newErrors.discount = 'ส่วนลดต้องเป็นตัวเลข 0-100';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'logo' && formData[key]) {
          submitData.append('logo', formData[key]);
        } else if (key !== 'logo') {
          submitData.append(key, formData[key]);
        }
      });

      await onSave(submitData);
    } catch (error) {
      console.error('Error saving partner:', error);
      setErrors({ submit: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem',
        marginBottom: '2rem' 
      }}>
        <button
          onClick={onBack}
          disabled={loading}
          style={{
            padding: '0.5rem',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: loading ? 'not-allowed' : 'pointer',
            borderRadius: '0.5rem',
            opacity: loading ? 0.5 : 1
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ 
            fontSize: '1.75rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            marginBottom: '0.25rem' 
          }}>
            {partner ? 'แก้ไขพาร์ทเนอร์' : 'เพิ่มพาร์ทเนอร์ใหม่'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {partner ? 'แก้ไขข้อมูลพาร์ทเนอร์ธุรกิจ' : 'เพิ่มพาร์ทเนอร์ธุรกิจใหม่เข้าสู่ระบบ'}
          </p>
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--danger)',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={16} color="var(--danger)" />
          <span style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>
            {errors.submit}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 992 ? '1fr' : '2fr 1fr',
          gap: '2rem'
        }}>
          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Basic Information */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '1.5rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border-color)'
              }}>
                ข้อมูลพื้นฐาน
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ชื่อพาร์ทเนอร์ *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={loading}
                    placeholder="เช่น Supplement Plus"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.name ? 'var(--danger)' : 'var(--border-color)'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      opacity: loading ? 0.7 : 1
                    }}
                  />
                  {errors.name && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      marginTop: '0.25rem',
                      color: 'var(--danger)',
                      fontSize: '0.75rem'
                    }}>
                      <AlertCircle size={12} />
                      {errors.name}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ประเภทธุรกิจ *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {partnerTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    คำอธิบาย *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={loading}
                    placeholder="อธิบายเกี่ยวกับผลิตภัณฑ์และบริการของพาร์ทเนอร์"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.description ? 'var(--danger)' : 'var(--border-color)'}`,
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      resize: 'vertical',
                      opacity: loading ? 0.7 : 1
                    }}
                  />
                  {errors.description && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      marginTop: '0.25rem',
                      color: 'var(--danger)',
                      fontSize: '0.75rem'
                    }}>
                      <AlertCircle size={12} />
                      {errors.description}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '1.5rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border-color)'
              }}>
                ข้อมูลการติดต่อ
              </h3>

              <div style={{ 
                display: 'grid',
                gridTemplateColumns: windowWidth <= 576 ? '1fr' : 'repeat(2, 1fr)',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    อีเมล *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)'
                    }} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={loading}
                      placeholder="partner@example.com"
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                        border: `1px solid ${errors.email ? 'var(--danger)' : 'var(--border-color)'}`,
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        opacity: loading ? 0.7 : 1
                      }}
                    />
                  </div>
                  {errors.email && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      marginTop: '0.25rem',
                      color: 'var(--danger)',
                      fontSize: '0.75rem'
                    }}>
                      <AlertCircle size={12} />
                      {errors.email}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    เบอร์โทรศัพท์ *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)'
                    }} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={loading}
                      placeholder="02-123-4567"
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                        border: `1px solid ${errors.phone ? 'var(--danger)' : 'var(--border-color)'}`,
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        opacity: loading ? 0.7 : 1
                      }}
                    />
                  </div>
                  {errors.phone && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      marginTop: '0.25rem',
                      color: 'var(--danger)',
                      fontSize: '0.75rem'
                    }}>
                      <AlertCircle size={12} />
                      {errors.phone}
                    </div>
                  )}
                </div>

                <div style={{ gridColumn: windowWidth <= 576 ? 'span 1' : 'span 2' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    เว็บไซต์ *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Globe size={16} style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)'
                    }} />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      disabled={loading}
                      placeholder="www.example.com หรือ https://example.com"
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                        border: `1px solid ${errors.website ? 'var(--danger)' : 'var(--border-color)'}`,
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        opacity: loading ? 0.7 : 1
                      }}
                    />
                  </div>
                  {errors.website && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      marginTop: '0.25rem',
                      color: 'var(--danger)',
                      fontSize: '0.75rem'
                    }}>
                      <AlertCircle size={12} />
                      {errors.website}
                    </div>
                  )}
                </div>

                <div style={{ gridColumn: windowWidth <= 576 ? 'span 1' : 'span 2' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ที่อยู่
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '0.75rem',
                      color: 'var(--text-muted)'
                    }} />
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={loading}
                      placeholder="ที่อยู่ของบริษัทพาร์ทเนอร์"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        resize: 'vertical',
                        opacity: loading ? 0.7 : 1
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Terms */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '1.5rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border-color)'
              }}>
                เงื่อนไขทางธุรกิจ
              </h3>

              <div style={{ 
                display: 'grid',
                gridTemplateColumns: windowWidth <= 576 ? '1fr' : 'repeat(2, 1fr)',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    คอมมิชชั่น (%) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Percent size={16} style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)'
                    }} />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.commission}
                      onChange={(e) => handleInputChange('commission', e.target.value)}
                      disabled={loading}
                      placeholder="10"
                      style={{
                        width: '100%',
                        padding: '0.75rem 2.5rem 0.75rem 0.75rem',
                        border: `1px solid ${errors.commission ? 'var(--danger)' : 'var(--border-color)'}`,
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        opacity: loading ? 0.7 : 1
                      }}
                    />
                  </div>
                  {errors.commission && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      marginTop: '0.25rem',
                      color: 'var(--danger)',
                      fontSize: '0.75rem'
                    }}>
                      <AlertCircle size={12} />
                      {errors.commission}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ส่วนลดลูกค้า (%) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Percent size={16} style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)'
                    }} />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.discount}
                      onChange={(e) => handleInputChange('discount', e.target.value)}
                      disabled={loading}
                      placeholder="15"
                      style={{
                        width: '100%',
                        padding: '0.75rem 2.5rem 0.75rem 0.75rem',
                        border: `1px solid ${errors.discount ? 'var(--danger)' : 'var(--border-color)'}`,
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        opacity: loading ? 0.7 : 1
                      }}
                    />
                  </div>
                  {errors.discount && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      marginTop: '0.25rem',
                      color: 'var(--danger)',
                      fontSize: '0.75rem'
                    }}>
                      <AlertCircle size={12} />
                      {errors.discount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Logo Upload */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '1rem'
              }}>
                โลโก้พาร์ทเนอร์
              </h3>

              {previewLogo ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: '0.5rem',
                    backgroundColor: 'var(--border-color)',
                    margin: '0 auto 1rem',
                    backgroundImage: `url(${previewLogo})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}>
                    <button
                      type="button"
                      onClick={removeLogo}
                      disabled={loading}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--danger)',
                        color: 'white',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: loading ? 0.5 : 1
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || uploading}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      cursor: (loading || uploading) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      margin: '0 auto',
                      opacity: (loading || uploading) ? 0.5 : 1
                    }}
                  >
                    {uploading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={16} />}
                    {uploading ? 'กำลังอัปโหลด...' : 'เปลี่ยนโลโก้'}
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => !loading && !uploading && fileInputRef.current?.click()}
                  style={{
                    width: '100%',
                    height: '200px',
                    border: '2px dashed var(--border-color)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (loading || uploading) ? 'not-allowed' : 'pointer',
                    backgroundColor: 'var(--bg-tertiary)',
                    transition: 'all 0.2s ease',
                    opacity: (loading || uploading) ? 0.5 : 1
                  }}
                >
                  {uploading ? (
                    <Loader size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Image size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                  )}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'var(--text-primary)',
                      marginBottom: '0.25rem'
                    }}>
                      {uploading ? 'กำลังอัปโหลด...' : 'คลิกเพื่อเลือกโลโก้'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      PNG, JPG สูงสุด 5MB
                    </div>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={loading || uploading}
                style={{ display: 'none' }}
              />

              {errors.logo && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginTop: '0.5rem',
                  color: 'var(--danger)',
                  fontSize: '0.75rem'
                }}>
                  <AlertCircle size={12} />
                  {errors.logo}
                </div>
              )}
            </div>

            {/* Status */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '1rem'
              }}>
                สถานะ
              </h3>

              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="submit"
                  disabled={loading || uploading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: (loading || uploading) ? 'var(--text-muted)' : 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: (loading || uploading) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {loading ? (
                    <>
                      <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {partner ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มพาร์ทเนอร์'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onBack}
                  disabled={loading || uploading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: (loading || uploading) ? 'not-allowed' : 'pointer',
                    opacity: (loading || uploading) ? 0.5 : 1
                  }}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PartnersManagement;