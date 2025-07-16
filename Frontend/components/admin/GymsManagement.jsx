import React, { useState, useEffect } from 'react';
import { 
  MapPin, Search, Filter, Plus, Edit, Trash2, Eye,
  CheckCircle, Clock, Phone, Globe, Star, Users,
  Navigation, Building, Calendar, Activity, ArrowLeft,
  Save, Send, X, Upload, ImageIcon, Link, Mail,
  DollarSign, Wifi, Car, AirVent, Dumbbell, 
  Coffee, ShowerHead, Zap, Shield, Heart
} from 'lucide-react';

const GymsManagement = ({ windowWidth }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedGym, setSelectedGym] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit'
  const [editingGym, setEditingGym] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Database connected states
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Gym form state
  const [gymForm, setGymForm] = useState({
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    website: '',
    facebook: '',
    instagram: '',
    lineId: '',
    operatingHours: {
      monday: { open: '06:00', close: '22:00', closed: false },
      tuesday: { open: '06:00', close: '22:00', closed: false },
      wednesday: { open: '06:00', close: '22:00', closed: false },
      thursday: { open: '06:00', close: '22:00', closed: false },
      friday: { open: '06:00', close: '22:00', closed: false },
      saturday: { open: '07:00', close: '21:00', closed: false },
      sunday: { open: '07:00', close: '21:00', closed: false }
    },
    monthlyFee: '',
    yearlyFee: '',
    dailyFee: '',
    facilities: [],
    amenities: [],
    equipment: [],
    classes: [],
    logo: null,
    additionalImages: [],
    status: 'pending',
    isVerified: false,
    isFeatured: false
  });

  // Available facilities and amenities
  const availableFacilities = [
    { id: 'weight-room', name: 'ห้องยกน้ำหนัก', icon: Dumbbell },
    { id: 'cardio', name: 'เครื่องออกกำลังกายแบบแอโรบิก', icon: Heart },
    { id: 'pool', name: 'สระว่ายน้ำ', icon: Activity },
    { id: 'sauna', name: 'ห้องซาวน่า', icon: AirVent },
    { id: 'steam', name: 'ห้องอบไอน้ำ', icon: AirVent },
    { id: 'jacuzzi', name: 'อ่างจากุซซี่', icon: Activity },
    { id: 'group-classes', name: 'คลาสกลุ่ม', icon: Users },
    { id: 'personal-training', name: 'เพอร์สนัลเทรนนิ่ง', icon: Users },
    { id: 'locker', name: 'ล็อกเกอร์', icon: Shield },
    { id: 'shower', name: 'ห้องอาบน้ำ', icon: ShowerHead },
    { id: 'parking', name: 'ที่จอดรถ', icon: Car },
    { id: 'wifi', name: 'Wi-Fi ฟรี', icon: Wifi },
    { id: 'cafe', name: 'คาเฟ่/น้ำดื่ม', icon: Coffee },
    { id: 'supplement', name: 'ร้านขายอาหารเสริม', icon: Coffee }
  ];

  // Available equipment
  const availableEquipment = [
    'ดัมเบล', 'บาร์เบล', 'เครื่องวิ่ง', 'จักรยานออกกำลังกาย', 'เครื่องรุ่ง',
    'เครื่องยกน้ำหนัก', 'เครื่องบริหารกล้ามเนื้อ', 'ลูกบอลโยคะ', 'แผ่นโยคะ',
    'ยางยืด', 'เครื่องวัดน้ำหนัก', 'เครื่องวัดมวลกล้ามเนื้อ'
  ];

  // Available classes
  const availableClasses = [
    'โยคะ', 'พิลาทิส', 'แอโรบิก', 'ซุมบ้า', 'สปินไบค์', 'ออกกำลังกายแบบฟังก์ชั่นแนล',
    'มวยไทย', 'คิกบ็อกซิ่ง', 'เต้นแอโรบิก', 'Body Pump', 'CrossFit', 'TRX'
  ];

  const [newFacility, setNewFacility] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [newClass, setNewClass] = useState('');

  // API Functions
  const fetchGyms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/gyms?search=${searchTerm}&status=${statusFilter}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch gyms');
      }

      const data = await response.json();
      setGyms(data.gyms || []);
    } catch (err) {
      console.error('Error fetching gyms:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createGym = async (gymData) => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      
      // Append gym data
      Object.keys(gymData).forEach(key => {
        if (key === 'logo' && gymData[key] instanceof File) {
          formData.append('logo', gymData[key]);
        } else if (key === 'additionalImages' && Array.isArray(gymData[key])) {
          gymData[key].forEach((file, index) => {
            if (file instanceof File) {
              formData.append(`additionalImages`, file);
            }
          });
        } else if (typeof gymData[key] === 'object') {
          formData.append(key, JSON.stringify(gymData[key]));
        } else {
          formData.append(key, gymData[key]);
        }
      });

      const response = await fetch('/api/admin/gyms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to create gym');
      }

      const result = await response.json();
      
      // Refresh gyms list
      await fetchGyms();
      
      return result;
    } catch (err) {
      console.error('Error creating gym:', err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const updateGym = async (id, gymData) => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      
      // Append gym data
      Object.keys(gymData).forEach(key => {
        if (key === 'logo' && gymData[key] instanceof File) {
          formData.append('logo', gymData[key]);
        } else if (key === 'additionalImages' && Array.isArray(gymData[key])) {
          gymData[key].forEach((file, index) => {
            if (file instanceof File) {
              formData.append(`additionalImages`, file);
            }
          });
        } else if (typeof gymData[key] === 'object') {
          formData.append(key, JSON.stringify(gymData[key]));
        } else {
          formData.append(key, gymData[key]);
        }
      });

      const response = await fetch(`/api/admin/gyms/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update gym');
      }

      const result = await response.json();
      
      // Refresh gyms list
      await fetchGyms();
      
      return result;
    } catch (err) {
      console.error('Error updating gym:', err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteGym = async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบยิมนี้?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/gyms/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete gym');
      }

      // Refresh gyms list
      await fetchGyms();
      
      alert('ลบยิมเรียบร้อยแล้ว');
    } catch (err) {
      console.error('Error deleting gym:', err);
      alert('เกิดข้อผิดพลาดในการลบยิม');
    }
  };

  const updateGymStatus = async (id, status) => {
    try {
      const response = await fetch(`/api/admin/gyms/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update gym status');
      }

      // Refresh gyms list
      await fetchGyms();
      
      alert(`อัพเดทสถานะเป็น ${getStatusText(status)} เรียบร้อยแล้ว`);
    } catch (err) {
      console.error('Error updating gym status:', err);
      alert('เกิดข้อผิดพลาดในการอัพเดทสถานะ');
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchGyms();
  }, []);

  // Refetch when search term or status filter changes
  useEffect(() => {
    const delayedFetch = setTimeout(() => {
      fetchGyms();
    }, 500); // Debounce search

    return () => clearTimeout(delayedFetch);
  }, [searchTerm, statusFilter]);

  const resetGymForm = () => {
    setGymForm({
      name: '',
      description: '',
      address: '',
      latitude: '',
      longitude: '',
      phone: '',
      email: '',
      website: '',
      facebook: '',
      instagram: '',
      lineId: '',
      operatingHours: {
        monday: { open: '06:00', close: '22:00', closed: false },
        tuesday: { open: '06:00', close: '22:00', closed: false },
        wednesday: { open: '06:00', close: '22:00', closed: false },
        thursday: { open: '06:00', close: '22:00', closed: false },
        friday: { open: '06:00', close: '22:00', closed: false },
        saturday: { open: '07:00', close: '21:00', closed: false },
        sunday: { open: '07:00', close: '21:00', closed: false }
      },
      monthlyFee: '',
      yearlyFee: '',
      dailyFee: '',
      facilities: [],
      amenities: [],
      equipment: [],
      classes: [],
      logo: null,
      additionalImages: [],
      status: 'pending',
      isVerified: false,
      isFeatured: false
    });
  };

  const handleCreateGym = () => {
    resetGymForm();
    setEditingGym(null);
    setCurrentView('create');
  };

  const handleEditGym = (gym) => {
    setGymForm({
      name: gym.name || '',
      description: gym.description || '',
      address: gym.address || '',
      latitude: gym.latitude || '',
      longitude: gym.longitude || '',
      phone: gym.phone || '',
      email: gym.email || '',
      website: gym.website || '',
      facebook: gym.facebook || '',
      instagram: gym.instagram || '',
      lineId: gym.lineId || '',
      operatingHours: gym.operating_hours || gym.operatingHours || {
        monday: { open: '06:00', close: '22:00', closed: false },
        tuesday: { open: '06:00', close: '22:00', closed: false },
        wednesday: { open: '06:00', close: '22:00', closed: false },
        thursday: { open: '06:00', close: '22:00', closed: false },
        friday: { open: '06:00', close: '22:00', closed: false },
        saturday: { open: '07:00', close: '21:00', closed: false },
        sunday: { open: '07:00', close: '21:00', closed: false }
      },
      monthlyFee: (gym.monthly_fee || gym.monthlyFee || '').toString(),
      yearlyFee: (gym.yearly_fee || gym.yearlyFee || '').toString(),
      dailyFee: (gym.daily_fee || gym.dailyFee || '').toString(),
      facilities: gym.facilities || [],
      equipment: gym.equipment || [],
      classes: gym.classes || [],
      logo: gym.logo_url || gym.logo || null,
      additionalImages: gym.additional_images || gym.additionalImages || [],
      status: gym.status || 'pending',
      isVerified: gym.is_verified || gym.isVerified || false,
      isFeatured: gym.is_featured || gym.isFeatured || false
    });
    setEditingGym(gym);
    setCurrentView('edit');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setEditingGym(null);
    resetGymForm();
  };

  const handleFormChange = (field, value) => {
    setGymForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOperatingHoursChange = (day, field, value) => {
    setGymForm(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleFacilityToggle = (facilityId) => {
    setGymForm(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facilityId)
        ? prev.facilities.filter(f => f !== facilityId)
        : [...prev.facilities, facilityId]
    }));
  };

  const handleEquipmentAdd = (equipment) => {
    if (equipment.trim() && !gymForm.equipment.includes(equipment.trim())) {
      setGymForm(prev => ({
        ...prev,
        equipment: [...prev.equipment, equipment.trim()]
      }));
    }
  };

  const handleEquipmentRemove = (equipmentToRemove) => {
    setGymForm(prev => ({
      ...prev,
      equipment: prev.equipment.filter(e => e !== equipmentToRemove)
    }));
  };

  const handleClassAdd = (className) => {
    if (className.trim() && !gymForm.classes.includes(className.trim())) {
      setGymForm(prev => ({
        ...prev,
        classes: [...prev.classes, className.trim()]
      }));
    }
  };

  const handleClassRemove = (classToRemove) => {
    setGymForm(prev => ({
      ...prev,
      classes: prev.classes.filter(c => c !== classToRemove)
    }));
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setGymForm(prev => ({
        ...prev,
        logo: file
      }));
    }
  };

  const handleAdditionalImagesUpload = (event) => {
    const files = Array.from(event.target.files);
    
    setGymForm(prev => ({
      ...prev,
      additionalImages: [...prev.additionalImages, ...files]
    }));
  };

  const removeAdditionalImage = (indexToRemove) => {
    setGymForm(prev => ({
      ...prev,
      additionalImages: prev.additionalImages.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSave = async (status = 'pending') => {
    try {
      const gymData = {
        ...gymForm,
        status,
        monthly_fee: parseFloat(gymForm.monthlyFee) || 0,
        yearly_fee: parseFloat(gymForm.yearlyFee) || 0,
        daily_fee: parseFloat(gymForm.dailyFee) || 0,
        operating_hours: gymForm.operatingHours,
        is_verified: gymForm.isVerified,
        is_featured: gymForm.isFeatured
      };

      if (editingGym) {
        await updateGym(editingGym.id, gymData);
        alert(`อัพเดทยิม${status === 'verified' ? ' และยืนยัน' : ''}เรียบร้อยแล้ว`);
      } else {
        await createGym(gymData);
        alert(`เพิ่มยิม${status === 'verified' ? ' และยืนยัน' : ''}เรียบร้อยแล้ว`);
      }
      
      handleBackToList();
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return '#28a745';
      case 'pending':
        return '#ffc107';
      case 'rejected':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'verified':
        return 'ยืนยันแล้ว';
      case 'pending':
        return 'รอการอนุมัติ';
      case 'rejected':
        return 'ปฏิเสธ';
      default:
        return status;
    }
  };

  const getFacilityInfo = (facilityId) => {
    return availableFacilities.find(f => f.id === facilityId) || { name: facilityId, icon: Building };
  };

  const formatCurrency = (amount) => {
    if (amount === 0) return 'ฟรี';
    return `฿${amount.toLocaleString()}`;
  };

  const getGymStats = () => {
    return {
      total: gyms.length,
      verified: gyms.filter(g => g.status === 'verified').length,
      pending: gyms.filter(g => g.status === 'pending').length,
      rejected: gyms.filter(g => g.status === 'rejected').length,
      totalMembers: gyms.reduce((sum, g) => sum + (g.total_members || g.totalMembers || 0), 0)
    };
  };

  const stats = getGymStats();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: '#6b7280'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Activity size={48} style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
          <div>กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '0.5rem',
        padding: '1rem',
        margin: '1rem 0'
      }}>
        <div style={{ color: '#dc2626', fontWeight: '600' }}>
          เกิดข้อผิดพลาด: {error}
        </div>
        <button 
          onClick={() => {
            setError(null);
            fetchGyms();
          }}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          โหลดใหม่
        </button>
      </div>
    );
  }

  const renderGymEditor = () => {
    return (
      <div>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={handleBackToList}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
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
                {editingGym ? 'แก้ไขข้อมูลยิม' : 'เพิ่มยิมใหม่'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {editingGym ? 'แก้ไขข้อมูลยิมและฟิตเนส' : 'เพิ่มยิมและฟิตเนสใหม่ในระบบ'}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setPreviewMode(!previewMode)}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-secondary)'
              }}
            >
              <Eye size={16} />
              {previewMode ? 'แก้ไข' : 'ดูตัวอย่าง'}
            </button>
            <button
              onClick={() => handleSave('pending')}
              disabled={submitting}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid #ffc107',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#ffc107',
                opacity: submitting ? 0.6 : 1
              }}
            >
              <Save size={16} />
              {submitting ? 'กำลังบันทึก...' : 'บันทึกร่าง'}
            </button>
            <button
              onClick={() => handleSave('verified')}
              disabled={submitting}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#df2528',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: submitting ? 0.6 : 1
              }}
            >
              <Send size={16} />
              {submitting ? 'กำลังเผยแพร่...' : 'เผยแพร่'}
            </button>
          </div>
        </div>

        {previewMode ? (
          // Preview Mode
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '2rem'
          }}>
            <div style={{
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              {/* Gym Header */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  {/* Logo Display */}
                  <div style={{
                    width: '4rem',
                    height: '4rem',
                    borderRadius: '0.75rem',
                    padding: '0.5rem',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {gymForm.logo ? (
                      gymForm.logo instanceof File ? (
                        <img 
                          src={URL.createObjectURL(gymForm.logo)} 
                          alt="Logo"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      ) : (
                        <img 
                          src={gymForm.logo} 
                          alt="Logo"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      )
                    ) : (
                      <Building size={32} color="#232956" />
                    )}
                  </div>
                  <div>
                    <h1 style={{
                      fontSize: '2.5rem',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem',
                      lineHeight: '1.2'
                    }}>
                      {gymForm.name || 'ไม่มีชื่อยิม'}
                    </h1>
                    <span style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: `${getStatusColor(gymForm.status)}20`,
                      color: getStatusColor(gymForm.status),
                      borderRadius: '1rem',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      {getStatusText(gymForm.status)}
                    </span>
                  </div>
                </div>
                
                <p style={{
                  fontSize: '1.125rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  marginBottom: '1.5rem'
                }}>
                  {gymForm.description || 'ไม่มีคำอธิบาย'}
                </p>

                {/* Additional Images Gallery */}
                {gymForm.additionalImages.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                  }}>
                    {gymForm.additionalImages.map((img, index) => (
                      <div key={index} style={{
                        height: '150px',
                        backgroundColor: 'var(--border-color)',
                        borderRadius: '0.5rem',
                        backgroundImage: `url(${img instanceof File ? URL.createObjectURL(img) : img})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }} />
                    ))}
                  </div>
                )}

                {/* Gym Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)'
                  }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>📍 ที่อยู่</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {gymForm.address || 'ไม่ระบุที่อยู่'}
                      {gymForm.latitude && gymForm.longitude && (
                        <>
                          <br />
                          <a 
                            href={`https://www.google.com/maps?q=${gymForm.latitude},${gymForm.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                              color: '#df2528', 
                              textDecoration: 'none',
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              marginTop: '0.5rem'
                            }}
                          >
                            <MapPin size={12} />
                            ดูในแผนที่
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)'
                  }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>⏰ เวลาทำการ</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {Object.entries(gymForm.operatingHours).map(([day, hours]) => {
                        const dayNames = {
                          monday: 'จันทร์',
                          tuesday: 'อังคาร',
                          wednesday: 'พุธ',
                          thursday: 'พฤหัสบดี',
                          friday: 'ศุกร์',
                          saturday: 'เสาร์',
                          sunday: 'อาทิตย์'
                        };
                        return (
                          <div key={day}>
                            {dayNames[day]}: {hours.closed ? 'ปิด' : `${hours.open}-${hours.close}`}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)'
                  }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>💰 ค่าบริการ</h3>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {gymForm.monthlyFee && <div>รายเดือน: {formatCurrency(parseFloat(gymForm.monthlyFee))}</div>}
                      {gymForm.yearlyFee && <div>รายปี: {formatCurrency(parseFloat(gymForm.yearlyFee))}</div>}
                      {gymForm.dailyFee && <div>รายวัน: {formatCurrency(parseFloat(gymForm.dailyFee))}</div>}
                    </div>
                  </div>
                </div>

                {/* Facilities */}
                {gymForm.facilities.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>สิ่งอำนวยความสะดวก</h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '0.75rem'
                    }}>
                      {gymForm.facilities.map((facilityId) => {
                        const facility = getFacilityInfo(facilityId);
                        const IconComponent = facility.icon;
                        return (
                          <div key={facilityId} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            backgroundColor: 'var(--bg-primary)',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border-color)'
                          }}>
                            <IconComponent size={16} color="#232956" />
                            <span style={{ fontSize: '0.875rem' }}>{facility.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Equipment */}
                {gymForm.equipment.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>อุปกรณ์ออกกำลังกาย</h3>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      {gymForm.equipment.map((equipment, index) => (
                        <span key={index} style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#23295620',
                          color: '#232956',
                          borderRadius: '1rem',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {equipment}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Classes */}
                {gymForm.classes.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>คลาสออกกำลังกาย</h3>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      {gymForm.classes.map((className, index) => (
                        <span key={index} style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#df252820',
                          color: '#df2528',
                          borderRadius: '1rem',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {className}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact */}
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>ติดต่อ</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {gymForm.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={16} />
                        <span>{gymForm.phone}</span>
                      </div>
                    )}
                    {gymForm.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={16} />
                        <span>{gymForm.email}</span>
                      </div>
                    )}
                    {gymForm.website && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Globe size={16} />
                        <a href={`https://${gymForm.website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#df2528' }}>
                          {gymForm.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Edit Mode
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? '1fr' : '2fr 1fr',
            gap: '2rem'
          }}>
            {/* Main Content */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '2rem'
            }}>
              {/* Basic Information */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  ข้อมูลพื้นฐาน
                </h3>

                {/* Name */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ชื่อยิม *
                  </label>
                  <input
                    type="text"
                    value={gymForm.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="ใส่ชื่อยิม..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom: '1.5rem' }}>
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
                    value={gymForm.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="เขียนคำอธิบายเกี่ยวกับยิม..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              {/* Location */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  ที่อยู่และตำแหน่ง
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ที่อยู่ *
                  </label>
                  <textarea
                    value={gymForm.address}
                    onChange={(e) => handleFormChange('address', e.target.value)}
                    placeholder="ที่อยู่เต็มของยิม..."
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

                {/* Map Coordinates */}
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
                      ละติจูด (Latitude)
                    </label>
                    <input
                      type="text"
                      value={gymForm.latitude}
                      onChange={(e) => handleFormChange('latitude', e.target.value)}
                      placeholder="13.7367"
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
                      ลองจิจูด (Longitude)
                    </label>
                    <input
                      type="text"
                      value={gymForm.longitude}
                      onChange={(e) => handleFormChange('longitude', e.target.value)}
                      placeholder="100.5231"
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
                
                {gymForm.latitude && gymForm.longitude && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <a 
                      href={`https://www.google.com/maps?q=${gymForm.latitude},${gymForm.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#df2528', 
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <MapPin size={16} />
                      ดูตำแหน่งในแผนที่
                    </a>
                  </div>
                )}
              </div>

              {/* Logo Upload */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  รูปโลโก้
                </label>
                
                {gymForm.logo ? (
                  <div style={{
                    position: 'relative',
                    width: '200px',
                    height: '150px',
                    backgroundColor: 'var(--border-color)',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                  }}>
                    <img 
                      src={gymForm.logo instanceof File ? URL.createObjectURL(gymForm.logo) : gymForm.logo} 
                      alt="Logo"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                    <button
                      onClick={() => handleFormChange('logo', null)}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        padding: '0.25rem',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '200px',
                    height: '150px',
                    border: '2px dashed var(--border-color)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-primary)'
                  }}>
                    <Upload size={24} style={{ marginBottom: '0.5rem' }} />
                    <span style={{ fontSize: '0.875rem', textAlign: 'center' }}>คลิกเพื่ออัพโหลดโลโก้</span>
                    <span style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: '0.25rem' }}>PNG, JPG หรือ SVG (ขนาดไม่เกิน 2MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>

              {/* Additional Images Upload */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  รูปภาพเพิ่มเติม (สูงสุด 10 รูป)
                </label>
                
                {/* Existing Additional Images */}
                {gymForm.additionalImages.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    {gymForm.additionalImages.map((img, index) => (
                      <div key={index} style={{
                        position: 'relative',
                        height: '120px',
                        backgroundColor: 'var(--border-color)',
                        borderRadius: '0.5rem',
                        overflow: 'hidden',
                        backgroundImage: `url(${img instanceof File ? URL.createObjectURL(img) : img})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}>
                        <button
                          onClick={() => removeAdditionalImage(index)}
                          style={{
                            position: 'absolute',
                            top: '0.25rem',
                            right: '0.25rem',
                            padding: '0.25rem',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button for Additional Images */}
                {gymForm.additionalImages.length < 10 && (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '120px',
                    border: '2px dashed var(--border-color)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    color: 'var(--text-muted)'
                  }}>
                    <ImageIcon size={24} style={{ marginBottom: '0.25rem' }} />
                    <span style={{ fontSize: '0.75rem' }}>เพิ่มรูปภาพ</span>
                    <span style={{ fontSize: '0.625rem' }}>({gymForm.additionalImages.length}/10)</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAdditionalImagesUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Contact Information */}
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                padding: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  ข้อมูลติดต่อ
                </h3>

                {/* Phone */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    เบอร์โทรศัพท์ *
                  </label>
                  <input
                    type="tel"
                    value={gymForm.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    placeholder="02-xxx-xxxx"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                {/* Email */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    อีเมล
                  </label>
                  <input
                    type="email"
                    value={gymForm.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    placeholder="contact@example.com"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                {/* Website */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    เว็บไซต์
                  </label>
                  <input
                    type="text"
                    value={gymForm.website}
                    onChange={(e) => handleFormChange('website', e.target.value)}
                    placeholder="www.example.com"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                {/* Social Media */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={gymForm.facebook}
                    onChange={(e) => handleFormChange('facebook', e.target.value)}
                    placeholder="username"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={gymForm.instagram}
                    onChange={(e) => handleFormChange('instagram', e.target.value)}
                    placeholder="username"
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
                    Line ID
                  </label>
                  <input
                    type="text"
                    value={gymForm.lineId}
                    onChange={(e) => handleFormChange('lineId', e.target.value)}
                    placeholder="@lineid"
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

              {/* Pricing */}
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                padding: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  ราคาค่าบริการ
                </h3>

                {/* Monthly Fee */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ค่าสมาชิกรายเดือน (฿)
                  </label>
                  <input
                    type="number"
                    value={gymForm.monthlyFee}
                    onChange={(e) => handleFormChange('monthlyFee', e.target.value)}
                    placeholder="1500"
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

                {/* Yearly Fee */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ค่าสมาชิกรายปี (฿)
                  </label>
                  <input
                    type="number"
                    value={gymForm.yearlyFee}
                    onChange={(e) => handleFormChange('yearlyFee', e.target.value)}
                    placeholder="15000"
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

                {/* Daily Fee */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ค่าเข้าใช้รายวัน (฿)
                  </label>
                  <input
                    type="number"
                    value={gymForm.dailyFee}
                    onChange={(e) => handleFormChange('dailyFee', e.target.value)}
                    placeholder="100"
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
              </div>

              {/* Operating Hours */}
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                padding: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  เวลาทำการ
                </h3>

                {Object.entries(gymForm.operatingHours).map(([day, hours]) => {
                  const dayNames = {
                    monday: 'จันทร์',
                    tuesday: 'อังคาร', 
                    wednesday: 'พุธ',
                    thursday: 'พฤหัสบดี',
                    friday: 'ศุกร์',
                    saturday: 'เสาร์',
                    sunday: 'อาทิตย์'
                  };
                  
                  return (
                    <div key={day} style={{ marginBottom: '1rem' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}>
                        <label style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: 'var(--text-primary)'
                        }}>
                          {dayNames[day]}
                        </label>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            checked={hours.closed}
                            onChange={(e) => handleOperatingHoursChange(day, 'closed', e.target.checked)}
                            style={{ margin: 0 }}
                          />
                          ปิด
                        </label>
                      </div>
                      
                      {!hours.closed && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.5rem'
                        }}>
                          <input
                            type="time"
                            value={hours.open}
                            onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                            style={{
                              padding: '0.5rem',
                              border: '1px solid var(--border-color)',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem'
                            }}
                          />
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                            style={{
                              padding: '0.5rem',
                              border: '1px solid var(--border-color)',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Facilities */}
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                padding: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  สิ่งอำนวยความสะดวก
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '0.5rem'
                }}>
                  {availableFacilities.map((facility) => {
                    const IconComponent = facility.icon;
                    return (
                      <label key={facility.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        backgroundColor: gymForm.facilities.includes(facility.id) ? '#df252810' : 'transparent'
                      }}>
                        <input
                          type="checkbox"
                          checked={gymForm.facilities.includes(facility.id)}
                          onChange={() => handleFacilityToggle(facility.id)}
                          style={{ margin: 0 }}
                        />
                        <IconComponent size={16} color={gymForm.facilities.includes(facility.id) ? '#df2528' : '#6c757d'} />
                        <span style={{
                          fontSize: '0.875rem',
                          color: gymForm.facilities.includes(facility.id) ? '#df2528' : 'var(--text-primary)'
                        }}>
                          {facility.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Equipment */}
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                padding: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  อุปกรณ์ออกกำลังกาย
                </h3>
                
                {/* Add Equipment Input */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <select
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">เลือกอุปกรณ์...</option>
                    {availableEquipment.filter(eq => !gymForm.equipment.includes(eq)).map((equipment) => (
                      <option key={equipment} value={equipment}>{equipment}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (newEquipment) {
                        handleEquipmentAdd(newEquipment);
                        setNewEquipment('');
                      }
                    }}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#232956',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Equipment List */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {gymForm.equipment.map((equipment, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      <span>{equipment}</span>
                      <button
                        onClick={() => handleEquipmentRemove(equipment)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#dc3545',
                          cursor: 'pointer',
                          padding: '0.25rem'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Classes */}
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                padding: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  คลาสออกกำลังกาย
                </h3>
                
                {/* Add Class Input */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <select
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">เลือกคลาส...</option>
                    {availableClasses.filter(cls => !gymForm.classes.includes(cls)).map((className) => (
                      <option key={className} value={className}>{className}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (newClass) {
                        handleClassAdd(newClass);
                        setNewClass('');
                      }
                    }}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#232956',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Classes List */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {gymForm.classes.map((className, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      <span>{className}</span>
                      <button
                        onClick={() => handleClassRemove(className)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#dc3545',
                          cursor: 'pointer',
                          padding: '0.25rem'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                padding: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  สถานะ
                </h3>

                {/* Status */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    สถานะการอนุมัติ
                  </label>
                  <select
                    value={gymForm.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="pending">รอการอนุมัติ</option>
                    <option value="verified">ยืนยันแล้ว</option>
                    <option value="rejected">ปฏิเสธ</option>
                  </select>
                </div>

                {/* Verified */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={gymForm.isVerified}
                      onChange={(e) => handleFormChange('isVerified', e.target.checked)}
                      style={{ margin: 0 }}
                    />
                    ยิมที่ได้รับการยืนยัน
                  </label>
                </div>

                {/* Featured */}
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={gymForm.isFeatured}
                      onChange={(e) => handleFormChange('isFeatured', e.target.checked)}
                      style={{ margin: 0 }}
                    />
                    ยิมแนะนำ
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGymCard = (gym) => (
    <div key={gym.id} style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '0.75rem',
      border: '1px solid var(--border-color)',
      padding: '1.5rem',
      transition: 'transform 0.2s, box-shadow 0.2s',
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
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '1rem' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Logo Display */}
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            {(gym.logo_url || gym.logo) ? (
              <img 
                src={gym.logo_url || gym.logo} 
                alt="Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <Building size={20} color="#232956" />
            )}
          </div>
          <div>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '0.25rem'
            }}>
              {gym.name}
            </h3>
            <span style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: `${getStatusColor(gym.status)}20`,
              color: getStatusColor(gym.status),
              borderRadius: '1rem',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {getStatusText(gym.status)}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button style={{
            padding: '0.25rem',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedGym(gym);
          }}>
            <Eye size={16} />
          </button>
          <button 
            style={{
              padding: '0.25rem',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleEditGym(gym);
            }}
          >
            <Edit size={16} />
          </button>
          <button 
            style={{
              padding: '0.25rem',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#dc3545',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              e.stopPropagation();
              deleteGym(gym.id);
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Rating */}
      {(gym.rating || gym.average_rating) > 0 && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <Star size={16} fill="#ffc107" color="#ffc107" />
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
            {gym.rating || gym.average_rating}
          </span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            ({gym.total_members || gym.totalMembers || 0} สมาชิก)
          </span>
        </div>
      )}

      {/* Address */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <MapPin size={16} style={{ color: 'var(--text-muted)', marginTop: '0.125rem' }} />
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          {gym.address}
        </span>
      </div>

      {/* Contact Info */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Phone size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {gym.phone}
          </span>
        </div>
        {gym.website && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={14} color="var(--text-muted)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {gym.website}
            </span>
          </div>
        )}
      </div>

      {/* Facilities */}
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ 
          fontSize: '0.875rem', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          marginBottom: '0.5rem'
        }}>
          สิ่งอำนวยความสะดวก
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {(gym.facilities || []).slice(0, 4).map((facilityId, index) => {
            const facility = getFacilityInfo(facilityId);
            return (
              <span key={index} style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                borderRadius: '0.25rem',
                fontSize: '0.75rem'
              }}>
                {facility.name}
              </span>
            );
          })}
          {(gym.facilities || []).length > 4 && (
            <span style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              borderRadius: '0.25rem',
              fontSize: '0.75rem'
            }}>
              +{(gym.facilities || []).length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Operating Hours & Fee */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        fontSize: '0.875rem'
      }}>
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.25rem'
          }}>
            <Clock size={14} color="var(--text-muted)" />
            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
              เวลาทำการ
            </span>
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>
            {gym.operating_hours?.monday?.open || gym.operatingHours?.monday?.open || '06:00'}-{gym.operating_hours?.monday?.close || gym.operatingHours?.monday?.close || '22:00'}
          </span>
        </div>
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.25rem'
          }}>
            <DollarSign size={14} color="var(--text-muted)" />
            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
              ค่าสมาชิก/เดือน
            </span>
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>
            {formatCurrency(gym.monthly_fee || gym.monthlyFee || 0)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {currentView === 'list' ? (
        <>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ 
              fontSize: '1.75rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              marginBottom: '0.5rem' 
            }}>
              จัดการยิมและฟิตเนส
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              จัดการข้อมูลยิมและศูนย์ออกกำลังกายในระบบ
            </p>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
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
                <Building size={20} color="#232956" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ยิมทั้งหมด</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {stats.total}
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <CheckCircle size={20} color="#28a745" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ยืนยันแล้ว</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {stats.verified}
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Clock size={20} color="#ffc107" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>รอการอนุมัติ</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {stats.pending}
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Users size={20} color="#17a2b8" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>สมาชิกรวม</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {stats.totalMembers.toLocaleString()}
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
                placeholder="ค้นหายิม..."
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
              <option value="verified">ยืนยันแล้ว</option>
              <option value="pending">รอการอนุมัติ</option>
              <option value="rejected">ปฏิเสธ</option>
            </select>
            <button 
              onClick={handleCreateGym}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#df2528',
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
              <Plus size={16} />
              เพิ่มยิมใหม่
            </button>
          </div>

          {/* Gyms Grid */}
          {gyms.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: '1.5rem'
            }}>
              {gyms.map(renderGymCard)}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'var(--text-secondary)'
            }}>
              <Building size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>ไม่พบยิม</div>
              <div style={{ fontSize: '0.875rem' }}>
                {searchTerm || statusFilter !== 'all' 
                  ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง' 
                  : 'ยังไม่มียิมในระบบ'}
              </div>
            </div>
          )}

          {/* Gym Detail Modal */}
          {selectedGym && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            onClick={() => setSelectedGym(null)}>
              <div style={{
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '0.75rem',
                padding: '2rem',
                maxWidth: '800px',
                maxHeight: '80vh',
                overflow: 'auto',
                margin: '1rem'
              }}
              onClick={(e) => e.stopPropagation()}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.5rem'
                }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {selectedGym.name}
                  </h2>
                  <button
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedGym(null)}
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  <p style={{ marginBottom: '1rem' }}>{selectedGym.description}</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div><strong>ที่อยู่:</strong> {selectedGym.address}</div>
                    <div><strong>โทรศัพท์:</strong> {selectedGym.phone}</div>
                    {selectedGym.email && <div><strong>อีเมล:</strong> {selectedGym.email}</div>}
                    {selectedGym.website && <div><strong>เว็บไซต์:</strong> {selectedGym.website}</div>}
                    <div><strong>ค่าสมาชิกรายเดือน:</strong> {formatCurrency(selectedGym.monthly_fee || selectedGym.monthlyFee || 0)}</div>
                    {(selectedGym.latitude || selectedGym.longitude) && (
                      <div>
                        <strong>พิกัด:</strong> 
                        <a 
                          href={`https://www.google.com/maps?q=${selectedGym.latitude},${selectedGym.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#df2528', marginLeft: '0.5rem' }}
                        >
                          ดูในแผนที่ ({selectedGym.latitude}, {selectedGym.longitude})
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Additional Images in Modal */}
                  {(selectedGym.additional_images || selectedGym.additionalImages) && (selectedGym.additional_images || selectedGym.additionalImages).length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>รูปภาพเพิ่มเติม:</strong>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                        gap: '0.5rem',
                        marginTop: '0.5rem'
                      }}>
                        {(selectedGym.additional_images || selectedGym.additionalImages).map((img, index) => (
                          <div key={index} style={{
                            height: '80px',
                            backgroundColor: 'var(--border-color)',
                            borderRadius: '0.25rem',
                            backgroundImage: `url(${img})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }} />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {(selectedGym.facilities || []).length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>สิ่งอำนวยความสะดวก:</strong>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginTop: '0.5rem'
                      }}>
                        {selectedGym.facilities.map((facilityId, index) => {
                          const facility = getFacilityInfo(facilityId);
                          return (
                            <span key={index} style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: 'var(--bg-secondary)',
                              color: 'var(--text-secondary)',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem'
                            }}>
                              {facility.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(selectedGym.equipment || []).length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>อุปกรณ์:</strong>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginTop: '0.5rem'
                      }}>
                        {selectedGym.equipment.map((equipment, index) => (
                          <span key={index} style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem'
                          }}>
                            {equipment}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedGym.classes || []).length > 0 && (
                    <div>
                      <strong>คลาสออกกำลังกาย:</strong>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginTop: '0.5rem'
                      }}>
                        {selectedGym.classes.map((className, index) => (
                          <span key={index} style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem'
                          }}>
                            {className}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Status Actions */}
                {selectedGym.status === 'pending' && (
                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    <button
                      onClick={() => {
                        updateGymStatus(selectedGym.id, 'verified');
                        setSelectedGym(null);
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      อนุมัติ
                    </button>
                    <button
                      onClick={() => {
                        updateGymStatus(selectedGym.id, 'rejected');
                        setSelectedGym(null);
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      ปฏิเสธ
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        renderGymEditor()
      )}
    </div>
  );
};

export default GymsManagement;