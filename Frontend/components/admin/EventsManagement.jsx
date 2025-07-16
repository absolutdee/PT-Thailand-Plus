import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, Filter, Plus, Edit, Trash2, Eye,
  CheckCircle, Clock, XCircle, AlertTriangle, Users,
  MapPin, DollarSign, Tag, Image, Copy, Share2,
  PlayCircle, Pause, RotateCcw, Download, Upload,
  Star, MessageSquare, TrendingUp, Activity,
  ArrowLeft, Save, Send, X, Info, Globe,
  Phone, Mail, FileText, ImageIcon, ExternalLink,
  Link, RefreshCw, Loader
} from 'lucide-react';

const EventsManagement = ({ windowWidth }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit'
  const [editingEvent, setEditingEvent] = useState(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    draft: 0,
    cancelled: 0,
    totalParticipants: 0,
    totalRevenue: 0
  });
  
  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    address: '',
    latitude: '',
    longitude: '',
    category: '',
    maxParticipants: '',
    price: '',
    earlyBirdPrice: '',
    earlyBirdEndDate: '',
    organizer: '',
    contactEmail: '',
    contactPhone: '',
    registrationLink: '',
    tags: [],
    features: [],
    image: null,
    additionalImages: [],
    status: 'draft',
    isPublished: false,
    isFeatured: false
  });

  // Event editor state
  const [newTag, setNewTag] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  // API endpoints - แก้ไข URL ให้ตรงกับ backend ของคุณ
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  const API_ENDPOINTS = {
    events: `${API_BASE_URL}/events`,
    eventsStats: `${API_BASE_URL}/events/stats`,
    uploadImage: `${API_BASE_URL}/upload/image`,
    categories: `${API_BASE_URL}/event-categories`
  };

  const eventCategories = [
    { value: 'running', label: 'วิ่ง', color: '#28a745' },
    { value: 'yoga', label: 'โยคะ', color: '#17a2b8' },
    { value: 'crossfit', label: 'CrossFit', color: '#df2528' },
    { value: 'workshop', label: 'เวิร์คชอป', color: '#ffc107' },
    { value: 'challenge', label: 'ชาเลนจ์', color: '#28a745' },
    { value: 'competition', label: 'แข่งขัน', color: '#dc3545' }
  ];

  // Fetch events from database
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.events);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        console.error('Failed to fetch events');
        // Fallback to sample data หากไม่สามารถเชื่อมต่อ API ได้
        setEvents(getSampleEvents());
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      // Fallback to sample data
      setEvents(getSampleEvents());
    } finally {
      setLoading(false);
    }
  };

  // Fetch event statistics
  const fetchEventStats = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.eventsStats);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Calculate stats from events data
        calculateStatsFromEvents();
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      calculateStatsFromEvents();
    }
  };

  // Calculate statistics from events data
  const calculateStatsFromEvents = () => {
    const calculatedStats = {
      total: events.length,
      upcoming: events.filter(e => e.status === 'upcoming').length,
      ongoing: events.filter(e => e.status === 'ongoing').length,
      completed: events.filter(e => e.status === 'completed').length,
      draft: events.filter(e => e.status === 'draft').length,
      cancelled: events.filter(e => e.status === 'cancelled').length,
      totalParticipants: events.reduce((sum, e) => sum + (e.participants || 0), 0),
      totalRevenue: events.reduce((sum, e) => sum + ((e.participants || 0) * (e.price || 0)), 0)
    };
    setStats(calculatedStats);
  };

  // Sample events data (fallback)
  const getSampleEvents = () => [
    {
      id: 1,
      title: 'FitConnect Marathon 2024',
      description: '<p>งานวิ่งมาราธอนประจำปี รับสมัครแล้ววันนี้ ระยะทาง <strong>5KM, 10KM, 21KM และ 42KM</strong></p><p>ร่วมสนุกกับการวิ่งในบรรยากาศที่ดีที่สุดของกรุงเทพฯ พร้อมเส้นทางที่ผ่านจุดสำคัญและสวยงามของเมือง</p>',
      shortDescription: 'งานวิ่งมาราธอนประจำปี รับสมัครแล้ววันนี้',
      startDate: '2024-08-15',
      endDate: '2024-08-15',
      startTime: '05:00',
      endTime: '12:00',
      location: 'สวนลุมพินี, กรุงเทพฯ',
      address: 'สวนลุมพินี ถนนราชดำริ เขตปทุมวัน กรุงเทพมหานคร 10330',
      latitude: '13.7317',
      longitude: '100.5400',
      status: 'upcoming',
      category: 'running',
      participants: 245,
      maxParticipants: 500,
      price: 500,
      earlyBirdPrice: 400,
      earlyBirdEndDate: '2024-07-15',
      image: '/images/marathon.jpg',
      additionalImages: ['/images/marathon-route.jpg', '/images/marathon-medal.jpg', '/images/marathon-start.jpg'],
      organizer: 'FitConnect Team',
      contactEmail: 'events@fitconnect.com',
      contactPhone: '02-123-4567',
      registrationLink: 'https://events.fitconnect.com/marathon2024/register',
      tags: ['marathon', 'running', 'outdoor', 'competition'],
      features: ['เสื้อผ้าฟรี', 'เหรียญรางวัล', 'น้ำดื่มฟรี', 'ของว่างหลังงาน'],
      createdAt: '2024-05-15',
      rating: 4.8,
      reviews: 23,
      isPublished: true,
      isFeatured: true
    },
    // ... other sample events
  ];

  // Upload image to server
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(API_ENDPOINTS.uploadImage, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.imageUrl;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      // Fallback: create object URL for preview
      return URL.createObjectURL(file);
    }
  };

  // Save event to database
  const saveEventToDatabase = async (eventData) => {
    setSaving(true);
    try {
      const method = editingEvent ? 'PUT' : 'POST';
      const url = editingEvent ? `${API_ENDPOINTS.events}/${editingEvent.id}` : API_ENDPOINTS.events;
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        const savedEvent = await response.json();
        
        // Update local events list
        if (editingEvent) {
          setEvents(prev => prev.map(event => 
            event.id === editingEvent.id ? savedEvent : event
          ));
        } else {
          setEvents(prev => [...prev, savedEvent]);
        }
        
        return true;
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Delete event from database
  const deleteEvent = async (eventId) => {
    if (!window.confirm('คุณต้องการลบอีเว้นท์นี้หรือไม่?')) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.events}/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEvents(prev => prev.filter(event => event.id !== eventId));
        alert('ลบอีเว้นท์เรียบร้อยแล้ว');
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('เกิดข้อผิดพลาดในการลบอีเว้นท์');
    }
  };

  // Initialize component
  useEffect(() => {
    fetchEvents();
  }, []);

  // Update stats when events change
  useEffect(() => {
    if (events.length > 0) {
      fetchEventStats();
    }
  }, [events]);

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      shortDescription: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      location: '',
      address: '',
      latitude: '',
      longitude: '',
      category: '',
      maxParticipants: '',
      price: '',
      earlyBirdPrice: '',
      earlyBirdEndDate: '',
      organizer: '',
      contactEmail: '',
      contactPhone: '',
      registrationLink: '',
      tags: [],
      features: [],
      image: null,
      additionalImages: [],
      status: 'draft',
      isPublished: false,
      isFeatured: false
    });
  };

  const handleCreateEvent = () => {
    resetEventForm();
    setEditingEvent(null);
    setCurrentView('create');
  };

  const handleEditEvent = (event) => {
    setEventForm({
      title: event.title,
      description: event.description,
      shortDescription: event.shortDescription,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      address: event.address,
      latitude: event.latitude || '',
      longitude: event.longitude || '',
      category: event.category,
      maxParticipants: event.maxParticipants.toString(),
      price: event.price.toString(),
      earlyBirdPrice: event.earlyBirdPrice.toString(),
      earlyBirdEndDate: event.earlyBirdEndDate || '',
      organizer: event.organizer,
      contactEmail: event.contactEmail,
      contactPhone: event.contactPhone,
      registrationLink: event.registrationLink || '',
      tags: event.tags,
      features: event.features,
      image: event.image,
      additionalImages: event.additionalImages || [],
      status: event.status,
      isPublished: event.isPublished,
      isFeatured: event.isFeatured
    });
    setEditingEvent(event);
    setCurrentView('edit');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setEditingEvent(null);
    resetEventForm();
  };

  const handleFormChange = (field, value) => {
    setEventForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagAdd = (tagText) => {
    if (tagText.trim() && !eventForm.tags.includes(tagText.trim())) {
      setEventForm(prev => ({
        ...prev,
        tags: [...prev.tags, tagText.trim()]
      }));
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setEventForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFeatureAdd = (featureText) => {
    if (featureText.trim() && !eventForm.features.includes(featureText.trim())) {
      setEventForm(prev => ({
        ...prev,
        features: [...prev.features, featureText.trim()]
      }));
    }
  };

  const handleFeatureRemove = (featureToRemove) => {
    setEventForm(prev => ({
      ...prev,
      features: prev.features.filter(feature => feature !== featureToRemove)
    }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = await uploadImage(file);
      setEventForm(prev => ({
        ...prev,
        image: imageUrl
      }));
    }
  };

  const handleAdditionalImagesUpload = async (event) => {
    const files = Array.from(event.target.files);
    const uploadPromises = files.map(file => uploadImage(file));
    
    try {
      const newImages = await Promise.all(uploadPromises);
      setEventForm(prev => ({
        ...prev,
        additionalImages: [...prev.additionalImages, ...newImages]
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
    }
  };

  const removeAdditionalImage = (indexToRemove) => {
    setEventForm(prev => ({
      ...prev,
      additionalImages: prev.additionalImages.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSave = async (status = 'draft') => {
    const eventData = {
      ...eventForm,
      status,
      id: editingEvent ? editingEvent.id : undefined,
      participants: editingEvent ? editingEvent.participants : 0,
      maxParticipants: parseInt(eventForm.maxParticipants),
      price: parseFloat(eventForm.price) || 0,
      earlyBirdPrice: parseFloat(eventForm.earlyBirdPrice) || 0,
      createdAt: editingEvent ? editingEvent.createdAt : new Date().toISOString().split('T')[0],
      rating: editingEvent ? editingEvent.rating : 0,
      reviews: editingEvent ? editingEvent.reviews : 0
    };

    const success = await saveEventToDatabase(eventData);
    
    if (success) {
      alert(`อีเว้นท์${status === 'upcoming' ? 'เผยแพร่' : 'บันทึก'}เรียบร้อยแล้ว`);
      handleBackToList();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return '#17a2b8';
      case 'ongoing':
        return '#28a745';
      case 'completed':
        return '#6c757d';
      case 'cancelled':
        return '#dc3545';
      case 'draft':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'upcoming':
        return 'กำลังจะมาถึง';
      case 'ongoing':
        return 'กำลังดำเนินการ';
      case 'completed':
        return 'เสร็จสิ้นแล้ว';
      case 'cancelled':
        return 'ยกเลิก';
      case 'draft':
        return 'แบบร่าง';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'upcoming':
        return <Clock size={16} />;
      case 'ongoing':
        return <PlayCircle size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      case 'cancelled':
        return <XCircle size={16} />;
      case 'draft':
        return <Edit size={16} />;
      default:
        return <AlertTriangle size={16} />;
    }
  };

  const getCategoryInfo = (category) => {
    return eventCategories.find(c => c.value === category) || { label: category, color: '#6c757d' };
  };

  const formatCurrency = (amount) => {
    if (amount === 0) return 'ฟรี';
    return `฿${amount.toLocaleString()}`;
  };

  // Filter events based on search and filters
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const renderEventEditor = () => {
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
                {editingEvent ? 'แก้ไขอีเว้นท์' : 'สร้างอีเว้นท์ใหม่'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {editingEvent ? 'แก้ไขข้อมูลอีเว้นท์' : 'สร้างอีเว้นท์ใหม่สำหรับเว็บไซต์'}
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
              onClick={() => handleSave('draft')}
              disabled={saving}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid #ffc107',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#ffc107',
                opacity: saving ? 0.6 : 1
              }}
            >
              {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              บันทึกแบบร่าง
            </button>
            <button
              onClick={() => handleSave('upcoming')}
              disabled={saving}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#df2528',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: saving ? 0.6 : 1
              }}
            >
              {saving ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
              เผยแพร่
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
              {/* Event Header */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#232956',
                    color: 'white',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {getCategoryInfo(eventForm.category).label || 'ไม่ระบุหมวดหมู่'}
                  </span>
                  <span style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)'
                  }}>
                    โดย {eventForm.organizer || 'ไม่ระบุผู้จัด'}
                  </span>
                </div>
                
                <h1 style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem',
                  lineHeight: '1.2'
                }}>
                  {eventForm.title || 'ไม่มีหัวข้อ'}
                </h1>
                
                <p style={{
                  fontSize: '1.125rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  marginBottom: '1.5rem'
                }}>
                  {eventForm.shortDescription || 'ไม่มีคำอธิบายย่อ'}
                </p>

                {/* Event Image */}
                {eventForm.image && (
                  <div style={{
                    width: '100%',
                    height: '400px',
                    backgroundColor: 'var(--border-color)',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    backgroundImage: `url(${eventForm.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }} />
                )}

                {/* Description with plain text */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>รายละเอียด</h3>
                  <div style={{
                    fontSize: '1rem',
                    lineHeight: '1.8',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {eventForm.description || 'ไม่มีรายละเอียด'}
                  </div>
                </div>

                {/* Rest of preview content remains the same */}
              </div>
            </div>
          </div>
        ) : (
          // Edit Mode with textarea instead of ReactQuill
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

                {/* Title */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ชื่ออีเว้นท์ *
                  </label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="ใส่ชื่ออีเว้นท์..."
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

                {/* Short Description */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    คำอธิบายย่อ
                  </label>
                  <textarea
                    value={eventForm.shortDescription}
                    onChange={(e) => handleFormChange('shortDescription', e.target.value)}
                    placeholder="คำอธิบายย่อของอีเว้นท์..."
                    rows={2}
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

                {/* Textarea for Full Description instead of ReactQuill */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    รายละเอียดอีเว้นท์ *
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="เขียนรายละเอียดของอีเว้นท์..."
                    rows={8}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      resize: 'vertical',
                      minHeight: '200px'
                    }}
                  />
                  <small style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                    display: 'block'
                  }}>
                    เขียนรายละเอียดเนื้อหาของอีเว้นท์ แบ่งบรรทัดเพื่อจัดรูปแบบ
                  </small>
                </div>
              </div>

              {/* Date & Time - เหมือนเดิม */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  วันเวลา
                </h3>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: windowWidth <= 768 ? '1fr' : '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem'
                    }}>
                      วันที่เริ่ม *
                    </label>
                    <input
                      type="date"
                      value={eventForm.startDate}
                      onChange={(e) => handleFormChange('startDate', e.target.value)}
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
                      value={eventForm.endDate}
                      onChange={(e) => handleFormChange('endDate', e.target.value)}
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
                      เวลาเริ่ม
                    </label>
                    <input
                      type="time"
                      value={eventForm.startTime}
                      onChange={(e) => handleFormChange('startTime', e.target.value)}
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
                      เวลาสิ้นสุด
                    </label>
                    <input
                      type="time"
                      value={eventForm.endTime}
                      onChange={(e) => handleFormChange('endTime', e.target.value)}
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

              {/* Location - เหมือนเดิม */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  สถานที่
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    สถานที่ *
                  </label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="เช่น สวนลุมพินี, FitConnect Studio"
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
                    ที่อยู่เต็ม
                  </label>
                  <textarea
                    value={eventForm.address}
                    onChange={(e) => handleFormChange('address', e.target.value)}
                    placeholder="ที่อยู่เต็มของสถานที่จัดงาน..."
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
                  gap: '1rem',
                  marginTop: '1rem'
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
                      value={eventForm.latitude}
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
                      value={eventForm.longitude}
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
                
                {eventForm.latitude && eventForm.longitude && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <a 
                      href={`https://www.google.com/maps?q=${eventForm.latitude},${eventForm.longitude}`}
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

              {/* Event Image Upload - เหมือนเดิม */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  รูปภาพหลักอีเว้นท์
                </label>
                
                {eventForm.image ? (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '250px',
                    backgroundColor: 'var(--border-color)',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    backgroundImage: `url(${eventForm.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}>
                    <button
                      onClick={() => handleFormChange('image', null)}
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
                    height: '250px',
                    border: '2px dashed var(--border-color)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    color: 'var(--text-muted)'
                  }}>
                    <Upload size={48} style={{ marginBottom: '0.5rem' }} />
                    <span>คลิกเพื่ออัพโหลดรูปภาพหลัก</span>
                    <span style={{ fontSize: '0.75rem' }}>JPG, PNG หรือ GIF (ขนาดไม่เกิน 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>

              {/* Additional Images Upload - เหมือนเดิม */}
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
                {eventForm.additionalImages.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    {eventForm.additionalImages.map((img, index) => (
                      <div key={index} style={{
                        position: 'relative',
                        height: '120px',
                        backgroundColor: 'var(--border-color)',
                        borderRadius: '0.5rem',
                        overflow: 'hidden',
                        backgroundImage: `url(${img})`,
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
                {eventForm.additionalImages.length < 10 && (
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
                    <span style={{ fontSize: '0.625rem' }}>({eventForm.additionalImages.length}/10)</span>
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

            {/* Sidebar - เหมือนเดิม ยกเว้นการเพิ่ม loading states */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Publish Settings */}
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
                  การเผยแพร่
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
                    สถานะ
                  </label>
                  <select
                    value={eventForm.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="draft">แบบร่าง</option>
                    <option value="upcoming">กำลังจะมาถึง</option>
                    <option value="ongoing">กำลังดำเนินการ</option>
                    <option value="completed">เสร็จสิ้นแล้ว</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>
                </div>

                {/* Published */}
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
                      checked={eventForm.isPublished}
                      onChange={(e) => handleFormChange('isPublished', e.target.checked)}
                      style={{ margin: 0 }}
                    />
                    เผยแพร่ในเว็บไซต์
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
                      checked={eventForm.isFeatured}
                      onChange={(e) => handleFormChange('isFeatured', e.target.checked)}
                      style={{ margin: 0 }}
                    />
                    อีเว้นท์แนะนำ
                  </label>
                </div>
              </div>

              {/* Category & Pricing */}
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
                  หมวดหมู่และราคา
                </h3>

                {/* Category */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    หมวดหมู่
                  </label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {eventCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Max Participants */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    จำนวนผู้เข้าร่วมสูงสุด
                  </label>
                  <input
                    type="number"
                    value={eventForm.maxParticipants}
                    onChange={(e) => handleFormChange('maxParticipants', e.target.value)}
                    placeholder="จำนวนคน"
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

                {/* Price */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ราคา (฿)
                  </label>
                  <input
                    type="number"
                    value={eventForm.price}
                    onChange={(e) => handleFormChange('price', e.target.value)}
                    placeholder="0 = ฟรี"
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

                {/* Early Bird Price */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ราคา Early Bird (฿)
                  </label>
                  <input
                    type="number"
                    value={eventForm.earlyBirdPrice}
                    onChange={(e) => handleFormChange('earlyBirdPrice', e.target.value)}
                    placeholder="ราคาพิเศษ"
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

                {/* Early Bird End Date */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    วันสิ้นสุด Early Bird
                  </label>
                  <input
                    type="date"
                    value={eventForm.earlyBirdEndDate}
                    onChange={(e) => handleFormChange('earlyBirdEndDate', e.target.value)}
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

              {/* Organizer */}
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
                  ผู้จัดงาน
                </h3>

                {/* Organizer Name */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ชื่อผู้จัด
                  </label>
                  <input
                    type="text"
                    value={eventForm.organizer}
                    onChange={(e) => handleFormChange('organizer', e.target.value)}
                    placeholder="ชื่อผู้จัดงาน"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                {/* Contact Email */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    อีเมลติดต่อ
                  </label>
                  <input
                    type="email"
                    value={eventForm.contactEmail}
                    onChange={(e) => handleFormChange('contactEmail', e.target.value)}
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

                {/* Contact Phone */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    เบอร์โทรติดต่อ
                  </label>
                  <input
                    type="tel"
                    value={eventForm.contactPhone}
                    onChange={(e) => handleFormChange('contactPhone', e.target.value)}
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

                {/* Registration Link */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ลิงค์สมัครอีเว้นท์
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="url"
                      value={eventForm.registrationLink}
                      onChange={(e) => handleFormChange('registrationLink', e.target.value)}
                      placeholder="https://example.com/register"
                      style={{
                        width: '100%',
                        padding: '0.75rem 2.5rem 0.75rem 0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    />
                    <Link size={16} style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)'
                    }} />
                  </div>
                  <small style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                    display: 'block'
                  }}>
                    ลิงค์นี้จะใช้สำหรับปุ่ม "สมัครเข้าร่วม" ในหน้ารายละเอียดอีเว้นท์
                  </small>
                </div>
              </div>

              {/* Tags */}
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
                  แท็ก
                </h3>
                
                {/* Add Tag Input */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTagAdd(newTag);
                        setNewTag('');
                      }
                    }}
                    placeholder="เพิ่มแท็ก..."
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  />
                  <button
                    onClick={() => {
                      handleTagAdd(newTag);
                      setNewTag('');
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

                {/* Tags List */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  {eventForm.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#df252820',
                        color: '#df2528',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}
                    >
                      #{tag}
                      <button
                        onClick={() => handleTagRemove(tag)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#df2528',
                          cursor: 'pointer',
                          padding: '0',
                          marginLeft: '0.25rem'
                        }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Features */}
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
                  สิ่งที่ได้รับ
                </h3>
                
                {/* Add Feature Input */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFeatureAdd(newFeature);
                        setNewFeature('');
                      }
                    }}
                    placeholder="เพิ่มสิ่งที่ได้รับ..."
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  />
                  <button
                    onClick={() => {
                      handleFeatureAdd(newFeature);
                      setNewFeature('');
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

                {/* Features List */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {eventForm.features.map((feature, index) => (
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
                      <span>• {feature}</span>
                      <button
                        onClick={() => handleFeatureRemove(feature)}
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
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEventCard = (event) => (
    <div key={event.id} style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '0.75rem',
      border: '1px solid var(--border-color)',
      overflow: 'hidden',
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
      {/* Event Image */}
      <div style={{
        height: '200px',
        backgroundColor: 'var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        position: 'relative'
      }}>
        <Calendar size={48} />
        {event.isFeatured && (
          <div style={{
            position: 'absolute',
            top: '0.75rem',
            left: '0.75rem',
            backgroundColor: '#df2528',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            แนะนำ
          </div>
        )}
        {!event.isPublished && (
          <div style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            backgroundColor: '#ffc107',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            ไม่เผยแพร่
          </div>
        )}
      </div>
      
      {/* Event Content */}
      <div style={{ padding: '1.5rem' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '0.75rem' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: `${getStatusColor(event.status)}20`,
              color: getStatusColor(event.status),
              borderRadius: '1rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              {getStatusIcon(event.status)}
              {getStatusText(event.status)}
            </span>
            <span style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: `${getCategoryInfo(event.category).color}20`,
              color: getCategoryInfo(event.category).color,
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {getCategoryInfo(event.category).label}
            </span>
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
              setSelectedEvent(event);
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
                handleEditEvent(event);
              }}
            >
              <Edit size={16} />
            </button>
            <button style={{
              padding: '0.25rem',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}>
              <Copy size={16} />
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
                deleteEvent(event.id);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
          lineHeight: '1.4'
        }}>
          {event.title}
        </h3>
        
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          marginBottom: '1rem',
          lineHeight: '1.5'
        }}>
          {event.shortDescription}
        </p>
        
        {/* Event Details */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.5rem', 
          marginBottom: '1rem' 
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Calendar size={14} />
            <span>
              {event.startDate === event.endDate ? 
                `${event.startDate} • ${event.startTime} - ${event.endTime}` : 
                `${event.startDate} - ${event.endDate}`
              }
            </span>
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <MapPin size={14} />
            <span>{event.location}</span>
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Users size={14} />
            <span>{event.participants}/{event.maxParticipants} คน</span>
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <DollarSign size={14} />
            <span>{formatCurrency(event.price)}</span>
            {event.earlyBirdPrice < event.price && event.price > 0 && (
              <span style={{ color: '#df2528', fontSize: '0.75rem' }}>
                (Early Bird: {formatCurrency(event.earlyBirdPrice)})
              </span>
            )}
          </div>
          {event.registrationLink && (
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Link size={14} />
              <span style={{ color: '#28a745' }}>มีลิงค์สมัคร</span>
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.25rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)'
          }}>
            <span>ผู้เข้าร่วม</span>
            <span>{Math.round((event.participants / event.maxParticipants) * 100)}%</span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'var(--border-color)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(event.participants / event.maxParticipants) * 100}%`,
              height: '100%',
              backgroundColor: getStatusColor(event.status),
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
        
        {/* Tags */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '0.25rem', 
          marginBottom: '1rem' 
        }}>
          {event.tags.slice(0, 3).map((tag, index) => (
            <span key={index} style={{
              padding: '0.125rem 0.375rem',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              borderRadius: '0.25rem',
              fontSize: '0.625rem'
            }}>
              #{tag}
            </span>
          ))}
          {event.tags.length > 3 && (
            <span style={{
              padding: '0.125rem 0.375rem',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              borderRadius: '0.25rem',
              fontSize: '0.625rem'
            }}>
              +{event.tags.length - 3}
            </span>
          )}
        </div>
        
        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>👤 {event.organizer}</span>
            {event.rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Star size={12} fill="#ffc107" color="#ffc107" />
                <span>{event.rating} ({event.reviews})</span>
              </div>
            )}
          </div>
          <span>สร้าง: {event.createdAt}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {currentView === 'list' ? (
        <>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <h1 style={{ 
                fontSize: '1.75rem', 
                fontWeight: '700', 
                color: 'var(--text-primary)'
              }}>
                จัดการอีเว้นท์
              </h1>
              {/* Refresh Button */}
              <button 
                onClick={fetchEvents}
                disabled={loading}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  color: 'var(--text-secondary)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              จัดการอีเว้นท์ กิจกรรม และการแข่งขันต่างๆ ในระบบ
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
                <Calendar size={20} color="#df2528" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>อีเว้นท์ทั้งหมด</span>
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
                <Clock size={20} color="#17a2b8" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>กำลังจะมาถึง</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {stats.upcoming}
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Users size={20} color="#28a745" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ผู้เข้าร่วมรวม</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {stats.totalParticipants.toLocaleString()}
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <TrendingUp size={20} color="#ffc107" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>รายได้รวม</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                ฿{stats.totalRevenue.toLocaleString()}
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
                placeholder="ค้นหาอีเว้นท์..."
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
                minWidth: '140px'
              }}
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="upcoming">กำลังจะมาถึง</option>
              <option value="ongoing">กำลังดำเนินการ</option>
              <option value="completed">เสร็จสิ้นแล้ว</option>
              <option value="draft">แบบร่าง</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                minWidth: '120px'
              }}
            >
              <option value="all">หมวดหมู่ทั้งหมด</option>
              {eventCategories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
            <button 
              onClick={handleCreateEvent}
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
              สร้างอีเว้นท์ใหม่
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: 'var(--text-muted)'
            }}>
              <Loader size={24} className="animate-spin" style={{ marginRight: '0.5rem' }} />
              กำลังโหลดข้อมูล...
            </div>
          ) : (
            /* Events Grid */
            <div style={{
              display: 'grid',
              gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: '1.5rem'
            }}>
              {filteredEvents.length > 0 ? (
                filteredEvents.map(renderEventCard)
              ) : (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '3rem',
                  color: 'var(--text-muted)'
                }}>
                  <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>ไม่พบอีเว้นท์ที่ตรงกับเงื่อนไขการค้นหา</p>
                </div>
              )}
            </div>
          )}

          {/* Event Detail Modal */}
          {selectedEvent && (
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
            onClick={() => setSelectedEvent(null)}>
              <div style={{
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '0.75rem',
                padding: '2rem',
                maxWidth: '600px',
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
                    {selectedEvent.title}
                  </h2>
                  <button
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedEvent(null)}
                  >
                    <XCircle size={24} />
                  </button>
                </div>
                
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div 
                      dangerouslySetInnerHTML={{ __html: selectedEvent.description }}
                      style={{ marginBottom: '1rem', whiteSpace: 'pre-wrap' }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div><strong>วันเวลา:</strong> {selectedEvent.startDate} {selectedEvent.startTime} - {selectedEvent.endTime}</div>
                    <div><strong>สถานที่:</strong> {selectedEvent.address}</div>
                    <div><strong>ผู้จัด:</strong> {selectedEvent.organizer}</div>
                    <div><strong>ราคา:</strong> {formatCurrency(selectedEvent.price)}</div>
                    <div><strong>ผู้เข้าร่วม:</strong> {selectedEvent.participants}/{selectedEvent.maxParticipants} คน</div>
                    {selectedEvent.registrationLink && (
                      <div><strong>ลิงค์สมัคร:</strong> <a href={selectedEvent.registrationLink} target="_blank" rel="noopener noreferrer" style={{ color: '#df2528' }}>ไปยังหน้าสมัคร</a></div>
                    )}
                    {selectedEvent.latitude && selectedEvent.longitude && (
                      <div>
                        <strong>พิกัด:</strong> 
                        <a 
                          href={`https://www.google.com/maps?q=${selectedEvent.latitude},${selectedEvent.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#df2528', marginLeft: '0.5rem' }}
                        >
                          ดูในแผนที่ ({selectedEvent.latitude}, {selectedEvent.longitude})
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Additional Images in Modal */}
                  {selectedEvent.additionalImages && selectedEvent.additionalImages.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>รูปภาพเพิ่มเติม:</strong>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                        gap: '0.5rem',
                        marginTop: '0.5rem'
                      }}>
                        {selectedEvent.additionalImages.map((img, index) => (
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
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>สิ่งที่ได้รับ:</strong>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                      {selectedEvent.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    {selectedEvent.tags.map((tag, index) => (
                      <span key={index} style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem'
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        renderEventEditor()
      )}
    </div>
  );
};

export default EventsManagement;