import React, { useState, useEffect } from 'react';
import { 
  Settings, User, Users, Target, CreditCard, 
  Image, Globe, Shield, Bell, Save,
  Upload, Eye, EyeOff, Edit, Trash2,
  BarChart3, PieChart, Mail, Phone,
  Plus, XCircle, Play, Pause, RotateCcw,
  Clock, Layers, Smartphone, Tablet,
  Monitor, Palette, Type, Move,
  ZoomIn, ZoomOut, SkipBack, SkipForward,
  Settings as SettingsIcon, Copy, Download
} from 'lucide-react';

const SystemSettings = ({ windowWidth }) => {
  const [activeSection, setActiveSection] = useState('customer-settings');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Hero Banner Management States (Enhanced)
  const [heroBanners, setHeroBanners] = useState([]);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);
  const [bannerLoading, setBannerLoading] = useState(false);
  
  // Advanced Banner Editor States
  const [activeTab, setActiveTab] = useState('general'); // general, layers, animation, responsive
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // desktop, tablet, mobile
  const [animationPreview, setAnimationPreview] = useState(false);

  // Animation and Effects Options
  const animationTypes = [
    { value: 'fade', label: 'Fade In/Out' },
    { value: 'slide-left', label: 'Slide from Left' },
    { value: 'slide-right', label: 'Slide from Right' },
    { value: 'slide-up', label: 'Slide from Bottom' },
    { value: 'slide-down', label: 'Slide from Top' },
    { value: 'zoom-in', label: 'Zoom In' },
    { value: 'zoom-out', label: 'Zoom Out' },
    { value: 'bounce', label: 'Bounce' },
    { value: 'flip', label: 'Flip' },
    { value: 'rotate', label: 'Rotate' }
  ];

  const transitionTypes = [
    { value: 'none', label: 'None' },
    { value: 'fade', label: 'Fade' },
    { value: 'slide', label: 'Slide' },
    { value: 'parallax', label: 'Parallax' },
    { value: 'kenburns', label: 'Ken Burns' },
    { value: 'cube', label: '3D Cube' },
    { value: 'carousel', label: 'Carousel' }
  ];

  // Database API Functions
  const apiCall = async (endpoint, method = 'GET', data = null) => {
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      };

      if (data) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`/api/admin/${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  };

  // Load Hero Banners from Database
  const loadHeroBanners = async () => {
    setBannerLoading(true);
    try {
      const response = await apiCall('hero-banners');
      setHeroBanners(response.data || []);
    } catch (error) {
      setError('ไม่สามารถโหลดข้อมูล Hero Banner ได้');
      console.error('Load banners error:', error);
    } finally {
      setBannerLoading(false);
    }
  };

  // Save Hero Banner to Database
  const saveBannerToDatabase = async (bannerData, isEdit = false) => {
    setSaving(true);
    try {
      const endpoint = isEdit ? `hero-banners/${bannerData.id}` : 'hero-banners';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await apiCall(endpoint, method, bannerData);
      
      if (isEdit) {
        setHeroBanners(banners =>
          banners.map(banner =>
            banner.id === bannerData.id ? response.data : banner
          )
        );
      } else {
        setHeroBanners(banners => [...banners, response.data]);
      }
      
      return response.data;
    } catch (error) {
      throw new Error('ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSaving(false);
    }
  };

  // Delete Hero Banner from Database
  const deleteBannerFromDatabase = async (bannerId) => {
    try {
      await apiCall(`hero-banners/${bannerId}`, 'DELETE');
      setHeroBanners(banners => banners.filter(banner => banner.id !== bannerId));
    } catch (error) {
      throw new Error('ไม่สามารถลบข้อมูลได้');
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadHeroBanners();
  }, []);

  const settingSections = [
    { id: 'customer-settings', label: 'ตั้งค่าระบบฝั่งลูกค้า', icon: Users },
    { id: 'trainer-settings', label: 'ตั้งค่าระบบฝั่งเทรนเนอร์', icon: Target },
    { id: 'payment-settings', label: 'ตั้งค่าการเงิน', icon: CreditCard },
    { id: 'hero-settings', label: 'ตั้งค่า Hero Banner', icon: Image },
    { id: 'seo-settings', label: 'ตั้งค่า SEO และโฆษณา', icon: Globe },
    { id: 'profile-settings', label: 'ข้อมูลส่วนตัว', icon: User }
  ];

  // Enhanced Hero Banner Management
  const renderHeroSettings = () => (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            backgroundColor: 'rgba(237, 137, 54, 0.1)',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            color: 'var(--warning)'
          }}>
            <Image size={20} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            จัดการ Hero Banners (Slider Revolution Style)
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setAnimationPreview(!animationPreview)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: animationPreview ? 'var(--success)' : 'var(--info)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {animationPreview ? <Pause size={16} /> : <Play size={16} />}
            {animationPreview ? 'หยุด Preview' : 'Preview All'}
          </button>
          <button
            onClick={() => {
              setEditingBanner(null);
              setShowBannerModal(true);
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={16} />
            สร้าง Slider
          </button>
        </div>
      </div>

      {/* Banner Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
            {heroBanners.length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Total Slides
          </div>
        </div>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
            {heroBanners.filter(b => b.isActive).length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Active Slides
          </div>
        </div>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--info)' }}>
            {heroBanners.filter(b => b.layers && b.layers.length > 0).length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            With Layers
          </div>
        </div>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)' }}>
            {heroBanners.filter(b => b.animation && b.animation !== 'none').length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Animated
          </div>
        </div>
      </div>
      
      {/* Loading State */}
      {bannerLoading && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{
            display: 'inline-block',
            width: '32px',
            height: '32px',
            border: '3px solid var(--border-color)',
            borderTop: '3px solid var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '1rem' }}>กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          border: '1px solid var(--danger)',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1rem',
          color: 'var(--danger)'
        }}>
          {error}
          <button
            onClick={() => {
              setError(null);
              loadHeroBanners();
            }}
            style={{
              marginLeft: '1rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: 'var(--danger)',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            ลองใหม่
          </button>
        </div>
      )}

      {/* Banners List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {heroBanners
          .sort((a, b) => a.order - b.order)
          .map((banner, index) => (
          <div key={banner.id} style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-color)',
            padding: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              {/* Enhanced Banner Preview */}
              <div style={{
                width: '150px',
                height: '100px',
                backgroundColor: 'var(--border-color)',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                flexShrink: 0,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {banner.backgroundImage ? (
                  <img 
                    src={banner.backgroundImage} 
                    alt={banner.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <Image size={32} />
                )}
                
                {/* Preview Overlay */}
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  display: 'flex',
                  gap: '0.25rem'
                }}>
                  {banner.animation && banner.animation !== 'none' && (
                    <span style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: 'var(--warning)',
                      borderRadius: '50%',
                      animation: animationPreview ? 'pulse 2s infinite' : 'none'
                    }}></span>
                  )}
                  {banner.layers && banner.layers.length > 0 && (
                    <span style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: 'var(--info)',
                      borderRadius: '50%'
                    }}></span>
                  )}
                </div>
              </div>
              
              {/* Enhanced Banner Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    {banner.title}
                  </h4>
                  {banner.isActive && (
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      backgroundColor: 'rgba(72, 187, 120, 0.1)',
                      color: 'var(--success)',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      ใช้งาน
                    </span>
                  )}
                  {banner.featured && (
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      backgroundColor: 'rgba(237, 137, 54, 0.1)',
                      color: 'var(--warning)',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      แนะนำ
                    </span>
                  )}
                </div>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  margin: '0 0 0.5rem 0',
                  lineHeight: '1.4'
                }}>
                  {banner.subtitle ? (banner.subtitle.length > 80 ? banner.subtitle.substring(0, 80) + '...' : banner.subtitle) : 'ไม่มีคำอธิบาย'}
                </p>
                
                {/* Enhanced Banner Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}>
                  <span>🎯 ปุ่ม: {banner.buttonText || 'ไม่มี'}</span>
                  <span>📊 ลำดับ: {banner.order}</span>
                  <span>🎬 แอนิเมชั่น: {banner.animation || 'ไม่มี'}</span>
                  <span>🕒 ระยะเวลา: {banner.duration || 5000}ms</span>
                  <span>📱 Responsive: {banner.responsive ? 'เปิด' : 'ปิด'}</span>
                  <span>🎨 Layers: {banner.layers ? banner.layers.length : 0}</span>
                  {banner.showSearchBox && <span>🔍 มีช่องค้นหา</span>}
                </div>
              </div>
              
              {/* Enhanced Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                {/* Preview Button */}
                <button
                  onClick={() => setPreviewBanner(banner)}
                  style={{
                    padding: '0.375rem',
                    backgroundColor: 'rgba(66, 153, 225, 0.1)',
                    border: '1px solid var(--info)',
                    borderRadius: '0.375rem',
                    color: 'var(--info)',
                    cursor: 'pointer'
                  }}
                >
                  <Play size={14} />
                </button>

                {/* Move Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <button
                    onClick={() => moveBanner(banner.id, 'up')}
                    disabled={index === 0}
                    style={{
                      padding: '0.25rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      color: index === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveBanner(banner.id, 'down')}
                    disabled={index === heroBanners.length - 1}
                    style={{
                      padding: '0.25rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      color: index === heroBanners.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                      cursor: index === heroBanners.length - 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    ↓
                  </button>
                </div>

                {/* Clone Button */}
                <button
                  onClick={() => cloneBanner(banner)}
                  style={{
                    padding: '0.375rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  <Copy size={14} />
                </button>
                
                {/* Toggle Active */}
                <button
                  onClick={() => toggleBannerActive(banner.id)}
                  style={{
                    padding: '0.375rem',
                    backgroundColor: banner.isActive ? 'rgba(72, 187, 120, 0.1)' : 'transparent',
                    border: `1px solid ${banner.isActive ? 'var(--success)' : 'var(--border-color)'}`,
                    borderRadius: '0.375rem',
                    color: banner.isActive ? 'var(--success)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <Eye size={14} />
                </button>
                
                {/* Edit */}
                <button
                  onClick={() => {
                    setEditingBanner(banner);
                    setShowBannerModal(true);
                  }}
                  style={{
                    padding: '0.375rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  <Edit size={14} />
                </button>
                
                {/* Delete */}
                <button
                  onClick={() => deleteBanner(banner.id)}
                  style={{
                    padding: '0.375rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--danger)',
                    borderRadius: '0.375rem',
                    color: 'var(--danger)',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {heroBanners.length === 0 && !bannerLoading && (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--text-muted)'
          }}>
            <Image size={48} style={{ marginBottom: '1rem' }} />
            <p>ยังไม่มี Hero Banner</p>
            <p style={{ fontSize: '0.875rem' }}>คลิกปุ่ม "สร้าง Slider" เพื่อสร้าง Banner แรก</p>
          </div>
        )}
      </div>
      
      {/* Enhanced Banner Modal */}
      {showBannerModal && renderAdvancedBannerModal()}
      
      {/* Preview Modal */}
      {previewBanner && renderPreviewModal()}
    </div>
  );

  // Enhanced Banner Modal with Slider Revolution-style features
  const renderAdvancedBannerModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        maxWidth: '95vw',
        maxHeight: '95vh',
        overflow: 'hidden',
        margin: '1rem',
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              {editingBanner ? `แก้ไข Slider: ${editingBanner.title}` : 'สร้าง Slider ใหม่'}
            </h3>
            {editingBanner && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: editingBanner.isActive ? 'rgba(72, 187, 120, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                  color: editingBanner.isActive ? 'var(--success)' : 'var(--danger)',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {editingBanner.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </span>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: 'rgba(66, 153, 225, 0.1)',
                  color: 'var(--info)',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  ID: {editingBanner.id}
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setPreviewBanner(editingBanner || getFormData())}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--info)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Play size={16} />
              Preview
            </button>
            <button
              onClick={() => {
                setShowBannerModal(false);
                setEditingBanner(null);
                setActiveTab('general');
                setSelectedLayer(null);
              }}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}>
          {/* Sidebar Tabs */}
          <div style={{
            width: '200px',
            backgroundColor: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-color)',
            padding: '1rem'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { id: 'general', label: 'ทั่วไป', icon: SettingsIcon },
                { id: 'layers', label: 'Layers', icon: Layers },
                { id: 'animation', label: 'Animation', icon: Play },
                { id: 'responsive', label: 'Responsive', icon: Smartphone }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: activeTab === tab.id ? 'rgba(223, 37, 40, 0.1)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%'
                  }}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div style={{
            flex: 1,
            padding: '1.5rem',
            overflow: 'auto'
          }}>
            {renderTabContent()}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              💡 Tip: ใช้แท็บ Layers เพื่อเพิ่มข้อความและรูปภาพ
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => {
                setShowBannerModal(false);
                setEditingBanner(null);
                setActiveTab('general');
                setSelectedLayer(null);
              }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'transparent',
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
              onClick={handleSaveBanner}
              disabled={saving}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: saving ? 'var(--text-muted)' : 'var(--accent)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid currentColor',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {editingBanner ? 'บันทึกการแก้ไข' : 'สร้าง Slider'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Tab Content Renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab();
      case 'layers':
        return renderLayersTab();
      case 'animation':
        return renderAnimationTab();
      case 'responsive':
        return renderResponsiveTab();
      default:
        return renderGeneralTab();
    }
  };

  // General Tab Content
  const renderGeneralTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          ชื่อ Slider *
        </label>
        <input
          id="bannerTitle"
          type="text"
          defaultValue={editingBanner?.title || ''}
          placeholder="เช่น: หาเทรนเนอร์ที่ใช่สำหรับคุณ"
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
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          คำอธิบาย
        </label>
        <textarea
          id="bannerSubtitle"
          rows="3"
          defaultValue={editingBanner?.subtitle || ''}
          placeholder="คำอธิบายเพิ่มเติมเกี่ยวกับ slider นี้"
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : '2fr 1fr',
        gap: '1rem'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            ข้อความปุ่ม
          </label>
          <input
            id="bannerButtonText"
            type="text"
            defaultValue={editingBanner?.buttonText || ''}
            placeholder="เช่น: ค้นหาเทรนเนอร์"
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
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            ลำดับการแสดง
          </label>
          <input
            id="bannerOrder"
            type="number"
            min="1"
            defaultValue={editingBanner?.order || heroBanners.length + 1}
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

      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          ลิงก์ปุ่ม
        </label>
        <input
          id="bannerButtonLink"
          type="text"
          defaultValue={editingBanner?.buttonLink || ''}
          placeholder="/trainers"
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
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          รูปภาพพื้นหลัง
        </label>
        <div style={{
          border: '2px dashed var(--border-color)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          textAlign: 'center',
          cursor: 'pointer'
        }}>
          <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            คลิกเพื่ออัปโหลดรูปภาพ หรือลากและวางที่นี่
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
            รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB • ขนาดแนะนำ: 1920x1080px
          </p>
          <input
            id="bannerBackgroundImage"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
        gap: '1rem'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          <input 
            id="bannerIsActive"
            type="checkbox" 
            defaultChecked={editingBanner?.isActive !== false}
            style={{ width: '1rem', height: '1rem' }} 
          />
          🔴 เปิดใช้งาน Slider
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          <input 
            id="bannerShowSearchBox"
            type="checkbox" 
            defaultChecked={editingBanner?.showSearchBox !== false}
            style={{ width: '1rem', height: '1rem' }} 
          />
          🔍 แสดงช่องค้นหา
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          <input 
            id="bannerFeatured"
            type="checkbox" 
            defaultChecked={editingBanner?.featured || false}
            style={{ width: '1rem', height: '1rem' }} 
          />
          ⭐ Slider แนะนำ
        </label>
      </div>
    </div>
  );

  // Animation Tab Content
  const renderAnimationTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          🎬 การตั้งค่า Animation
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? '1fr' : '1fr 1fr',
          gap: '1rem'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              ประเภท Animation
            </label>
            <select
              id="bannerAnimation"
              defaultValue={editingBanner?.animation || 'fade'}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}
            >
              {animationTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Transition Effect
            </label>
            <select
              id="bannerTransition"
              defaultValue={editingBanner?.transition || 'fade'}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}
            >
              {transitionTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
        gap: '1rem'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            ระยะเวลาแสดง (ms)
          </label>
          <input
            id="bannerDuration"
            type="number"
            min="1000"
            max="10000"
            step="500"
            defaultValue={editingBanner?.duration || 5000}
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
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Animation Speed (ms)
          </label>
          <input
            id="bannerAnimationSpeed"
            type="number"
            min="100"
            max="2000"
            step="100"
            defaultValue={editingBanner?.animationSpeed || 800}
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
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Delay (ms)
          </label>
          <input
            id="bannerDelay"
            type="number"
            min="0"
            max="5000"
            step="100"
            defaultValue={editingBanner?.delay || 0}
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
        gap: '1rem'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          <input 
            id="bannerAutoplay"
            type="checkbox" 
            defaultChecked={editingBanner?.autoplay !== false}
            style={{ width: '1rem', height: '1rem' }} 
          />
          🔄 Auto Play
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          <input 
            id="bannerLoop"
            type="checkbox" 
            defaultChecked={editingBanner?.loop !== false}
            style={{ width: '1rem', height: '1rem' }} 
          />
          🔁 Loop Animation
        </label>
      </div>

      {/* Animation Preview */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '0.5rem',
        padding: '1rem',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            🎭 Animation Preview
          </h5>
          <button
            onClick={() => setAnimationPreview(!animationPreview)}
            style={{
              padding: '0.375rem 0.75rem',
              backgroundColor: animationPreview ? 'var(--danger)' : 'var(--success)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}
          >
            {animationPreview ? <Pause size={12} /> : <Play size={12} />}
            {animationPreview ? 'หยุด' : 'เล่น'}
          </button>
        </div>
        
        <div style={{
          height: '80px',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.375rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--accent)',
            color: 'var(--text-white)',
            borderRadius: '0.25rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            animation: animationPreview ? `${document.getElementById('bannerAnimation')?.value || 'fade'} 2s infinite` : 'none'
          }}>
            Sample Animation
          </div>
        </div>
      </div>
    </div>
  );

  // Layers Tab Content
  const renderLayersTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
          🎨 Layer Management
        </h4>
        <button
          onClick={() => addNewLayer()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--accent)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={16} />
          เพิ่ม Layer
        </button>
      </div>

      {/* Layer List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {(editingBanner?.layers || []).map((layer, index) => (
          <div
            key={layer.id}
            onClick={() => setSelectedLayer(layer)}
            style={{
              padding: '1rem',
              backgroundColor: selectedLayer?.id === layer.id ? 'rgba(223, 37, 40, 0.1)' : 'var(--bg-secondary)',
              border: `1px solid ${selectedLayer?.id === layer.id ? 'var(--accent)' : 'var(--border-color)'}`,
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: layer.type === 'text' ? 'var(--info)' : 'var(--warning)',
                  borderRadius: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-white)',
                  fontSize: '0.75rem'
                }}>
                  {layer.type === 'text' ? <Type size={12} /> : <Image size={12} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                    {layer.name || `${layer.type === 'text' ? 'Text' : 'Image'} Layer ${index + 1}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {layer.type === 'text' ? layer.content?.substring(0, 30) + '...' : layer.src}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayer(layer.id, 'up');
                  }}
                  disabled={index === 0}
                  style={{
                    padding: '0.25rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.25rem',
                    color: index === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
                    cursor: index === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  ↑
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayer(layer.id, 'down');
                  }}
                  disabled={index === (editingBanner?.layers || []).length - 1}
                  style={{
                    padding: '0.25rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.25rem',
                    color: index === (editingBanner?.layers || []).length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                    cursor: index === (editingBanner?.layers || []).length - 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  ↓
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLayer(layer.id);
                  }}
                  style={{
                    padding: '0.25rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--danger)',
                    borderRadius: '0.25rem',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}

        {(!editingBanner?.layers || editingBanner.layers.length === 0) && (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-color)'
          }}>
            <Layers size={32} style={{ marginBottom: '1rem' }} />
            <p>ยังไม่มี Layer</p>
            <p style={{ fontSize: '0.875rem' }}>คลิกปุ่ม "เพิ่ม Layer" เพื่อเริ่มต้น</p>
          </div>
        )}
      </div>

      {/* Layer Properties */}
      {selectedLayer && (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1rem',
          border: '1px solid var(--border-color)'
        }}>
          <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            ⚙️ Layer Properties: {selectedLayer.name || `${selectedLayer.type} Layer`}
          </h5>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                ชื่อ Layer
              </label>
              <input
                type="text"
                value={selectedLayer.name || ''}
                onChange={(e) => updateLayer(selectedLayer.id, { name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {selectedLayer.type === 'text' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    เนื้อหาข้อความ
                  </label>
                  <textarea
                    value={selectedLayer.content || ''}
                    onChange={(e) => updateLayer(selectedLayer.id, { content: e.target.value })}
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.5rem'
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      ขนาดตัวอักษร
                    </label>
                    <input
                      type="number"
                      value={selectedLayer.fontSize || 16}
                      onChange={(e) => updateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      สีข้อความ
                    </label>
                    <input
                      type="color"
                      value={selectedLayer.color || '#000000'}
                      onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })}
                      style={{
                        width: '100%',
                        height: '2.5rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {selectedLayer.type === 'image' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  URL รูปภาพ
                </label>
                <input
                  type="text"
                  value={selectedLayer.src || ''}
                  onChange={(e) => updateLayer(selectedLayer.id, { src: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            )}

            {/* Position and Size */}
            <div>
              <h6 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                ตำแหน่งและขนาด
              </h6>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    X (px)
                  </label>
                  <input
                    type="number"
                    value={selectedLayer.x || 0}
                    onChange={(e) => updateLayer(selectedLayer.id, { x: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.375rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Y (px)
                  </label>
                  <input
                    type="number"
                    value={selectedLayer.y || 0}
                    onChange={(e) => updateLayer(selectedLayer.id, { y: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.375rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Width (px)
                  </label>
                  <input
                    type="number"
                    value={selectedLayer.width || 'auto'}
                    onChange={(e) => updateLayer(selectedLayer.id, { width: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.375rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Height (px)
                  </label>
                  <input
                    type="number"
                    value={selectedLayer.height || 'auto'}
                    onChange={(e) => updateLayer(selectedLayer.id, { height: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.375rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Responsive Tab Content
  const renderResponsiveTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
          📱 Responsive Settings
        </h4>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'desktop', icon: Monitor, label: 'Desktop' },
            { id: 'tablet', icon: Tablet, label: 'Tablet' },
            { id: 'mobile', icon: Smartphone, label: 'Mobile' }
          ].map((device) => (
            <button
              key={device.id}
              onClick={() => setPreviewDevice(device.id)}
              style={{
                padding: '0.5rem',
                backgroundColor: previewDevice === device.id ? 'var(--accent)' : 'transparent',
                color: previewDevice === device.id ? 'var(--text-white)' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem'
              }}
            >
              <device.icon size={16} />
              {windowWidth > 768 && device.label}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Preview */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '0.5rem',
        padding: '1rem',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.375rem',
          border: '1px solid var(--border-color)',
          position: 'relative'
        }}>
          <div style={{
            width: previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? '70%' : '40%',
            height: '80%',
            backgroundColor: 'var(--accent)',
            borderRadius: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-white)',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}>
            {previewDevice.charAt(0).toUpperCase() + previewDevice.slice(1)} Preview
          </div>
        </div>
      </div>

      {/* Responsive Settings */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
        gap: '1rem'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            ความสูง {previewDevice} (px)
          </label>
          <input
            type="number"
            min="200"
            max="1000"
            defaultValue={getResponsiveValue('height', previewDevice)}
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
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            ขนาดตัวอักษรหลัก (px)
          </label>
          <input
            type="number"
            min="12"
            max="72"
            defaultValue={getResponsiveValue('fontSize', previewDevice)}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          <input 
            type="checkbox" 
            defaultChecked={editingBanner?.responsive !== false}
            style={{ width: '1rem', height: '1rem' }} 
          />
          📱 เปิดใช้งาน Responsive
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          <input 
            type="checkbox" 
            defaultChecked={editingBanner?.hideOnMobile !== true}
            style={{ width: '1rem', height: '1rem' }} 
          />
          📱 แสดงบนมือถือ
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          <input 
            type="checkbox" 
            defaultChecked={editingBanner?.hideOnTablet !== true}
            style={{ width: '1rem', height: '1rem' }} 
          />
          📱 แสดงบนแท็บเล็ต
        </label>
      </div>
    </div>
  );

  // Helper Functions
  const getResponsiveValue = (property, device) => {
    const values = {
      height: { desktop: 600, tablet: 400, mobile: 300 },
      fontSize: { desktop: 48, tablet: 36, mobile: 24 }
    };
    return editingBanner?.responsive?.[device]?.[property] || values[property][device];
  };

  const addNewLayer = () => {
    const newLayer = {
      id: Date.now(),
      type: 'text',
      name: `Text Layer ${(editingBanner?.layers || []).length + 1}`,
      content: 'New Text Layer',
      x: 100,
      y: 100,
      fontSize: 24,
      color: '#000000'
    };

    if (editingBanner) {
      setEditingBanner({
        ...editingBanner,
        layers: [...(editingBanner.layers || []), newLayer]
      });
    }
  };

  const updateLayer = (layerId, updates) => {
    if (editingBanner) {
      setEditingBanner({
        ...editingBanner,
        layers: (editingBanner.layers || []).map(layer =>
          layer.id === layerId ? { ...layer, ...updates } : layer
        )
      });
      
      // Update selected layer if it's the one being updated
      if (selectedLayer?.id === layerId) {
        setSelectedLayer({ ...selectedLayer, ...updates });
      }
    }
  };

  const deleteLayer = (layerId) => {
    if (editingBanner && window.confirm('คุณแน่ใจหรือไม่ที่จะลบ Layer นี้?')) {
      setEditingBanner({
        ...editingBanner,
        layers: (editingBanner.layers || []).filter(layer => layer.id !== layerId)
      });
      
      if (selectedLayer?.id === layerId) {
        setSelectedLayer(null);
      }
    }
  };

  const moveLayer = (layerId, direction) => {
    if (!editingBanner?.layers) return;
    
    const layers = [...editingBanner.layers];
    const currentIndex = layers.findIndex(layer => layer.id === layerId);
    
    if (direction === 'up' && currentIndex > 0) {
      [layers[currentIndex], layers[currentIndex - 1]] = [layers[currentIndex - 1], layers[currentIndex]];
    } else if (direction === 'down' && currentIndex < layers.length - 1) {
      [layers[currentIndex], layers[currentIndex + 1]] = [layers[currentIndex + 1], layers[currentIndex]];
    }
    
    setEditingBanner({
      ...editingBanner,
      layers
    });
  };

  const getFormData = () => {
    return {
      title: document.getElementById('bannerTitle')?.value || '',
      subtitle: document.getElementById('bannerSubtitle')?.value || '',
      buttonText: document.getElementById('bannerButtonText')?.value || '',
      buttonLink: document.getElementById('bannerButtonLink')?.value || '',
      order: parseInt(document.getElementById('bannerOrder')?.value) || 1,
      isActive: document.getElementById('bannerIsActive')?.checked || false,
      showSearchBox: document.getElementById('bannerShowSearchBox')?.checked || false,
      featured: document.getElementById('bannerFeatured')?.checked || false,
      animation: document.getElementById('bannerAnimation')?.value || 'fade',
      transition: document.getElementById('bannerTransition')?.value || 'fade',
      duration: parseInt(document.getElementById('bannerDuration')?.value) || 5000,
      animationSpeed: parseInt(document.getElementById('bannerAnimationSpeed')?.value) || 800,
      delay: parseInt(document.getElementById('bannerDelay')?.value) || 0,
      autoplay: document.getElementById('bannerAutoplay')?.checked || false,
      loop: document.getElementById('bannerLoop')?.checked || false,
      layers: editingBanner?.layers || [],
      responsive: editingBanner?.responsive || true
    };
  };

  const handleSaveBanner = async () => {
    try {
      const formData = getFormData();
      const isEdit = !!editingBanner;
      
      if (isEdit) {
        formData.id = editingBanner.id;
      }
      
      await saveBannerToDatabase(formData, isEdit);
      
      setShowBannerModal(false);
      setEditingBanner(null);
      setActiveTab('general');
      setSelectedLayer(null);
    } catch (error) {
      alert(error.message);
    }
  };

  // Preview Modal
  const renderPreviewModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1001
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          zIndex: 1002,
          display: 'flex',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => setPreviewBanner(null)}
            style={{
              padding: '0.5rem',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            <XCircle size={20} />
          </button>
        </div>
        
        <div style={{
          width: '800px',
          height: '400px',
          backgroundColor: 'var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-primary)',
          fontSize: '1.5rem',
          fontWeight: '600',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {previewBanner?.backgroundImage ? (
            <img 
              src={previewBanner.backgroundImage} 
              alt={previewBanner.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div>Banner Preview: {previewBanner?.title}</div>
          )}
          
          {/* Render Layers */}
          {previewBanner?.layers?.map((layer) => (
            <div
              key={layer.id}
              style={{
                position: 'absolute',
                left: `${layer.x || 0}px`,
                top: `${layer.y || 0}px`,
                fontSize: layer.type === 'text' ? `${layer.fontSize || 16}px` : undefined,
                color: layer.type === 'text' ? (layer.color || '#000000') : undefined,
                animation: animationPreview ? `${previewBanner.animation || 'fade'} 2s infinite` : 'none'
              }}
            >
              {layer.type === 'text' ? layer.content : (
                <img 
                  src={layer.src} 
                  alt="Layer"
                  style={{
                    width: layer.width || 'auto',
                    height: layer.height || 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Enhanced Banner Functions
  const cloneBanner = async (banner) => {
    try {
      const clonedBanner = {
        ...banner,
        id: undefined,
        title: `${banner.title} (Copy)`,
        order: heroBanners.length + 1,
        isActive: false,
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      await saveBannerToDatabase(clonedBanner, false);
    } catch (error) {
      alert('ไม่สามารถคัดลอก Banner ได้: ' + error.message);
    }
  };

  const deleteBanner = async (bannerId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบ Banner นี้? การกระทำนี้ไม่สามารถยกเลิกได้')) {
      try {
        await deleteBannerFromDatabase(bannerId);
      } catch (error) {
        alert('ไม่สามารถลบ Banner ได้: ' + error.message);
      }
    }
  };

  const toggleBannerActive = async (bannerId) => {
    try {
      const banner = heroBanners.find(b => b.id === bannerId);
      if (banner) {
        await saveBannerToDatabase({ ...banner, isActive: !banner.isActive }, true);
      }
    } catch (error) {
      alert('ไม่สามารถอัปเดตสถานะได้: ' + error.message);
    }
  };

  const moveBanner = async (bannerId, direction) => {
    try {
      const sortedBanners = [...heroBanners].sort((a, b) => a.order - b.order);
      const currentIndex = sortedBanners.findIndex(banner => banner.id === bannerId);
      
      if (direction === 'up' && currentIndex > 0) {
        const currentBanner = sortedBanners[currentIndex];
        const previousBanner = sortedBanners[currentIndex - 1];
        
        await saveBannerToDatabase({ ...currentBanner, order: previousBanner.order }, true);
        await saveBannerToDatabase({ ...previousBanner, order: currentBanner.order }, true);
      } else if (direction === 'down' && currentIndex < sortedBanners.length - 1) {
        const currentBanner = sortedBanners[currentIndex];
        const nextBanner = sortedBanners[currentIndex + 1];
        
        await saveBannerToDatabase({ ...currentBanner, order: nextBanner.order }, true);
        await saveBannerToDatabase({ ...nextBanner, order: currentBanner.order }, true);
      }
      
      await loadHeroBanners(); // Reload to get updated order
    } catch (error) {
      alert('ไม่สามารถเปลี่ยนลำดับได้: ' + error.message);
    }
  };

  // Keep existing render functions for other sections...
  const renderCustomerSettings = () => (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{
          backgroundColor: 'rgba(72, 187, 120, 0.1)',
          borderRadius: '0.5rem',
          padding: '0.5rem',
          color: 'var(--success)'
        }}>
          <Users size={20} />
        </div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          การตั้งค่าระบบฝั่งลูกค้า
        </h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            จำนวนเซสชั่นสูงสุดต่อแพคเกจ
          </label>
          <input
            type="number"
            defaultValue="20"
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
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            ระยะเวลาการยกเลิกก่อนเซสชั่น (ชั่วโมง)
          </label>
          <input
            type="number"
            defaultValue="24"
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
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            จำนวนครั้งที่สามารถเลื่อนนัดได้
          </label>
          <input
            type="number"
            defaultValue="3"
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
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            <input type="checkbox" defaultChecked style={{ width: '1rem', height: '1rem' }} />
            อนุญาตให้ลูกค้ารีวิวเทรนเนอร์
          </label>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            <input type="checkbox" defaultChecked style={{ width: '1rem', height: '1rem' }} />
            ส่งการแจ้งเตือนทาง Email
          </label>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            <input type="checkbox" defaultChecked style={{ width: '1rem', height: '1rem' }} />
            ส่งการแจ้งเตือนทาง SMS
          </label>
        </div>
      </div>
    </div>
  );

  const renderTrainerSettings = () => (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{
          backgroundColor: 'rgba(223, 37, 40, 0.1)',
          borderRadius: '0.5rem',
          padding: '0.5rem',
          color: 'var(--accent)'
        }}>
          <Target size={20} />
        </div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          การตั้งค่าระบบฝั่งเทรนเนอร์
        </h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            จำนวนแพคเกจสูงสุดต่อเทรนเนอร์
          </label>
          <input
            type="number"
            defaultValue="3"
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
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            จำนวนรูปภาพสูงสุดในโปรไฟล์
          </label>
          <input
            type="number"
            defaultValue="12"
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
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            อัตราค่าคอมมิชชั่น (%)
          </label>
          <input
            type="number"
            defaultValue="15"
            step="0.1"
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
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            ระยะเวลาการชำระเงินให้เทรนเนอร์ (วัน)
          </label>
          <input
            type="number"
            defaultValue="7"
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
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            <input type="checkbox" defaultChecked style={{ width: '1rem', height: '1rem' }} />
            ต้องการการอนุมัติก่อนเผยแพร่โปรไฟล์
          </label>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            <input type="checkbox" defaultChecked style={{ width: '1rem', height: '1rem' }} />
            อนุญาตให้เทรนเนอร์เลือกแพคเกจแนะนำได้
          </label>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{
          backgroundColor: 'rgba(66, 153, 225, 0.1)',
          borderRadius: '0.5rem',
          padding: '0.5rem',
          color: 'var(--info)'
        }}>
          <CreditCard size={20} />
        </div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          การตั้งค่าการเงิน
        </h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* General Settings */}
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            ตั้งค่าทั่วไป
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                ค่าธรรมเนียมแพลตฟอร์ม (%)
              </label>
              <input
                type="number"
                defaultValue="5"
                step="0.1"
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
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                สกุลเงิน
              </label>
              <select
                defaultValue="THB"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="THB">บาทไทย (THB)</option>
                <option value="USD">ดอลลาร์สหรัฐ (USD)</option>
                <option value="EUR">ยูโร (EUR)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Credit Card Payment (Stripe) */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="checkbox" 
              defaultChecked 
              style={{ width: '1rem', height: '1rem' }} 
            />
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              💳 บัตรเครดิต/เดบิต (Stripe)
            </h4>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Stripe Secret Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  defaultValue="sk_test_4eC39HqLyjWDarjtT1zdp7dc"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    paddingRight: '3rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Stripe Publishable Key
              </label>
              <input
                type="text"
                defaultValue="pk_test_TYooMQauvdEDq54NiTphI7jx"
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
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Webhook Endpoint URL
              </label>
              <input
                type="text"
                defaultValue="https://your-domain.com/api/stripe/webhook"
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
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                ค่าธรรมเนียม Stripe (%)
              </label>
              <input
                type="number"
                defaultValue="3.65"
                step="0.01"
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

        {/* Bank Transfer */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="checkbox" 
              defaultChecked 
              style={{ width: '1rem', height: '1rem' }} 
            />
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              🏦 การโอนเงินผ่านธนาคาร
            </h4>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: windowWidth <= 768 ? '1fr' : '1fr 1fr',
              gap: '1rem'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  ชื่อธนาคาร
                </label>
                <input
                  type="text"
                  defaultValue="ธนาคารกสิกรไทย"
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
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  เลขที่บัญชี
                </label>
                <input
                  type="text"
                  defaultValue="123-4-56789-0"
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
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  ชื่อบัญชี
                </label>
                <input
                  type="text"
                  defaultValue="บริษัท ฟิตคอนเนค จำกัด"
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
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  สาขา
                </label>
                <input
                  type="text"
                  defaultValue="สาขาสยาม"
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

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                คำแนะนำการโอนเงิน
              </label>
              <textarea
                rows="3"
                defaultValue="โปรดโอนเงินเข้าบัญชีข้างต้น และส่งหลักฐานการโอนเงินพร้อมระบุหมายเลขคำสั่งซื้อในช่องหมายเหตุ"
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

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                ระยะเวลาการยืนยันการชำระเงิน (ชั่วโมง)
              </label>
              <input
                type="number"
                defaultValue="24"
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

        {/* PromptPay */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="checkbox" 
              defaultChecked 
              style={{ width: '1rem', height: '1rem' }} 
            />
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              📱 พร้อมเพย์ (PromptPay)
            </h4>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: windowWidth <= 768 ? '1fr' : '1fr 1fr',
              gap: '1rem'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  หมายเลขพร้อมเพย์
                </label>
                <input
                  type="text"
                  defaultValue="0812345678"
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
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  ชื่อบัญชีพร้อมเพย์
                </label>
                <input
                  type="text"
                  defaultValue="บริษัท ฟิตคอนเนค จำกัด"
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

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                QR Code PromptPay
              </label>
              <div style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '0.5rem',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer'
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  backgroundColor: 'var(--border-color)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: 'var(--text-muted)'
                }}>
                  <Image size={32} />
                </div>
                <button style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--info)',
                  color: 'var(--text-white)',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  margin: '0 auto'
                }}>
                  <Upload size={16} />
                  อัปโหลด QR Code
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                คำแนะนำการใช้พร้อมเพย์
              </label>
              <textarea
                rows="3"
                defaultValue="สแกน QR Code ด้านบน หรือโอนเงินไปยังหมายเลขพร้อมเพย์ แล้วส่งหลักฐานการโอนเงินพร้อมหมายเลขคำสั่งซื้อ"
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

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                ระยะเวลาการยืนยันการชำระเงิน (นาที)
              </label>
              <input
                type="number"
                defaultValue="30"
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

        {/* Additional Settings */}
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            การตั้งค่าเพิ่มเติม
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                <input type="checkbox" defaultChecked style={{ width: '1rem', height: '1rem' }} />
                ส่งอีเมลยืนยันการชำระเงินให้ลูกค้า
              </label>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                <input type="checkbox" defaultChecked style={{ width: '1rem', height: '1rem' }} />
                ส่ง SMS แจ้งเตือนการชำระเงินสำเร็จ
              </label>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                <input type="checkbox" defaultChecked style={{ width: '1rem', height: '1rem' }} />
                แจ้งเตือนแอดมินเมื่อมีการชำระเงินใหม่
              </label>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                <input type="checkbox" style={{ width: '1rem', height: '1rem' }} />
                อนุญาตให้ยกเลิกการสั่งซื้อหลังชำระเงิน
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSEOSettings = () => (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{
          backgroundColor: 'rgba(66, 153, 225, 0.1)',
          borderRadius: '0.5rem',
          padding: '0.5rem',
          color: 'var(--info)'
        }}>
          <BarChart3 size={20} />
        </div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          Analytics & Tracking
        </h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Google Analytics ID
          </label>
          <input
            type="text"
            defaultValue="GA-XXXXXXXXX-X"
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
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Facebook Pixel ID
          </label>
          <input
            type="text"
            defaultValue="123456789012345"
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
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Google Tag Manager ID
          </label>
          <input
            type="text"
            defaultValue="GTM-XXXXXXX"
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
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            SEO Settings
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Site Title
              </label>
              <input
                type="text"
                defaultValue="FitConnect - แพลตฟอร์มหาเทรนเนอร์ออกกำลังกาย"
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
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Meta Description
              </label>
              <textarea
                defaultValue="พบเทรนเนอร์ออกกำลังกายมืออาชีพ จองเซสชั่นได้ง่าย ราคาโปร่งใส มีแพคเกจให้เลือกหลากหลาย เหมาะกับทุกระดับและเป้าหมาย"
                rows="3"
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
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Keywords
              </label>
              <input
                type="text"
                defaultValue="เทรนเนอร์, ออกกำลังกาย, ฟิตเนส, โยคะ, ลดน้ำหนัก"
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
      </div>
    </div>
  );

  const renderProfileSettings = () => (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      border: '1px solid var(--border-color)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{
          backgroundColor: 'rgba(223, 37, 40, 0.1)',
          borderRadius: '0.5rem',
          padding: '0.5rem',
          color: 'var(--accent)'
        }}>
          <User size={20} />
        </div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          ข้อมูลส่วนตัว
        </h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-white)',
            fontSize: '2rem',
            fontWeight: '600'
          }}>
            A
          </div>
          <div>
            <button style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--info)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              marginRight: '0.5rem'
            }}>
              เปลี่ยนรูปภาพ
            </button>
            <button style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: 'var(--danger)',
              border: '1px solid var(--danger)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              ลบรูปภาพ
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? '1fr' : '1fr 1fr',
          gap: '1rem'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              ชื่อ
            </label>
            <input
              type="text"
              defaultValue="Admin"
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
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              นามสกุล
            </label>
            <input
              type="text"
              defaultValue="System"
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
        
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            อีเมล
          </label>
          <input
            type="email"
            defaultValue="admin@fitconnect.com"
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
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            เบอร์โทรศัพท์
          </label>
          <input
            type="tel"
            defaultValue="02-123-4567"
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
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            เปลี่ยนรหัสผ่าน
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                รหัสผ่านปัจจุบัน
              </label>
              <input
                type="password"
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
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                รหัสผ่านใหม่
              </label>
              <input
                type="password"
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
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                ยืนยันรหัสผ่านใหม่
              </label>
              <input
                type="password"
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
      </div>
    </div>
  );

  // Main content renderer
  const renderContent = () => {
    switch (activeSection) {
      case 'customer-settings':
        return renderCustomerSettings();
      case 'trainer-settings':
        return renderTrainerSettings();
      case 'payment-settings':
        return renderPaymentSettings();
      case 'hero-settings':
        return renderHeroSettings();
      case 'seo-settings':
        return renderSEOSettings();
      case 'profile-settings':
        return renderProfileSettings();
      default:
        return renderCustomerSettings();
    }
  };

  // Save all settings
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Collect all form data based on active section
      const formData = new FormData();
      
      // Add section-specific data collection logic here
      switch (activeSection) {
        case 'customer-settings':
          // Collect customer settings
          break;
        case 'trainer-settings':
          // Collect trainer settings
          break;
        case 'payment-settings':
          // Collect payment settings
          break;
        case 'seo-settings':
          // Collect SEO settings
          break;
        case 'profile-settings':
          // Collect profile settings
          break;
      }

      // Save to database
      const response = await apiCall(`settings/${activeSection}`, 'PUT', formData);
      
      if (response.success) {
        alert('บันทึกการตั้งค่าสำเร็จ');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Add CSS for animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          @keyframes fade {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          
          @keyframes slide-left {
            0% { transform: translateX(-100%); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }
          
          @keyframes slide-right {
            0% { transform: translateX(100%); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }
          
          @keyframes slide-up {
            0% { transform: translateY(100%); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          
          @keyframes slide-down {
            0% { transform: translateY(-100%); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          
          @keyframes zoom-in {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          
          @keyframes zoom-out {
            0% { transform: scale(2); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
            40%, 43% { transform: translate3d(0, -15px, 0); }
            70% { transform: translate3d(0, -7px, 0); }
            90% { transform: translate3d(0, -2px, 0); }
          }
          
          @keyframes flip {
            0% { transform: perspective(400px) rotateY(-90deg); opacity: 0; }
            40% { transform: perspective(400px) rotateY(-10deg); }
            70% { transform: perspective(400px) rotateY(10deg); }
            100% { transform: perspective(400px) rotateY(0deg); opacity: 1; }
          }
          
          @keyframes rotate {
            0% { transform: rotate(-180deg); opacity: 0; }
            100% { transform: rotate(0deg); opacity: 1; }
          }
        `}
      </style>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '1.75rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          marginBottom: '0.5rem' 
        }}>
          การตั้งค่าระบบ
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          จัดการการตั้งค่าต่างๆ ของระบบและการกำหนดค่าส่วนบุคคล
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : '280px 1fr',
        gap: '2rem'
      }}>
        {/* Settings Navigation */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          height: 'fit-content'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '1rem'
          }}>
            หมวดหมู่การตั้งค่า
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {settingSections.map((section) => (
              <button
                key={section.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: activeSection === section.id ? 'rgba(223, 37, 40, 0.1)' : 'transparent',
                  color: activeSection === section.id ? 'var(--accent)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  width: '100%'
                }}
                onClick={() => setActiveSection(section.id)}
              >
                <section.icon size={18} />
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div>
          {renderContent()}
          
          {/* Save Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'transparent',
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
              onClick={handleSaveSettings}
              disabled={saving}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: saving ? 'var(--text-muted)' : 'var(--accent)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid currentColor',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save size={16} />
                  บันทึกการตั้งค่า
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;