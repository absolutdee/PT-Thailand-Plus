import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axios';

const GymDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [gymData, setGymData] = useState(null);
  const [relatedGyms, setRelatedGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch gym data from API
  useEffect(() => {
    const fetchGymData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch gym details
        const gymResponse = await axiosInstance.get(`/gyms/${id}`);
        setGymData(gymResponse.data);
        
        // Fetch related gyms
        const relatedResponse = await axiosInstance.get(`/gyms/${id}/related`);
        setRelatedGyms(relatedResponse.data);
        
      } catch (err) {
        console.error('Error fetching gym data:', err);
        setError('ไม่สามารถโหลดข้อมูลยิมได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGymData();
    }
  }, [id]);

  // Gallery Images - ใช้ข้อมูลจาก API หรือ fallback
  const galleryImages = gymData?.images?.large || [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=500&fit=crop',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&h=500&fit=crop',
    'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&h=500&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=500&fit=crop',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&h=500&fit=crop',
    'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=1200&h=500&fit=crop'
  ];

  const thumbnailImages = gymData?.images?.thumbnails || [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=120&h=80&fit=crop',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=120&h=80&fit=crop',
    'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=120&h=80&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&h=80&fit=crop',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=120&h=80&fit=crop',
    'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=120&h=80&fit=crop'
  ];

  // Change Image
  const changeImage = (direction) => {
    let newIndex = currentImageIndex + direction;
    if (newIndex < 0) {
      newIndex = galleryImages.length - 1;
    } else if (newIndex >= galleryImages.length) {
      newIndex = 0;
    }
    setCurrentImageIndex(newIndex);
  };

  // Select Image
  const selectImage = (index) => {
    setCurrentImageIndex(index);
  };

  // View Gym Detail - ใช้ navigate แทน console.log
  const viewGymDetail = (gymId) => {
    navigate(`/gyms/${gymId}`);
  };

  // Contact gym - เรียก API
  const handleContact = async () => {
    try {
      await axiosInstance.post(`/gyms/${id}/contact`, {
        timestamp: new Date().toISOString()
      });
      // สามารถเปิดหน้าต่างโทรศัพท์หรือแสดง modal ติดต่อ
      if (gymData?.contact?.phone) {
        window.location.href = `tel:${gymData.contact.phone}`;
      }
    } catch (err) {
      console.error('Error contacting gym:', err);
    }
  };

  // Save/Favorite gym
  const handleSaveGym = async () => {
    try {
      await axiosInstance.post(`/gyms/${id}/favorite`);
      // อัพเดท UI หรือแสดงข้อความสำเร็จ
      alert('บันทึกยิมแล้ว');
    } catch (err) {
      console.error('Error saving gym:', err);
      alert('ไม่สามารถบันทึกยิมได้');
    }
  };

  // Share gym
  const handleShareGym = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: gymData?.name || 'ยิม',
          text: gymData?.description || 'ยิมที่น่าสนใจ',
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('คัดลอกลิงก์แล้ว');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        changeImage(-1);
      } else if (e.key === 'ArrowRight') {
        changeImage(1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentImageIndex]);

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: "'Noto Sans Thai', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #df2528',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>กำลังโหลดข้อมูลยิม...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: "'Noto Sans Thai', sans-serif",
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div>
          <i className="fas fa-exclamation-triangle" style={{
            fontSize: '3rem',
            color: '#df2528',
            marginBottom: '1rem'
          }}></i>
          <h3 style={{ color: '#232956', marginBottom: '1rem' }}>เกิดข้อผิดพลาด</h3>
          <p style={{ color: '#666', marginBottom: '2rem' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#df2528',
              color: 'white',
              border: 'none',
              padding: '0.8rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  // Return null if no data
  if (!gymData) {
    return null;
  }

  const styles = {
    root: {
      fontFamily: "'Noto Sans Thai', sans-serif",
      color: '#1a1a1a',
      background: '#f8f9fa',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    },
    mainContent: {
      padding: '1.5rem 0 3rem',
      minHeight: '100vh',
      background: '#f8f9fa'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 15px'
    },
    breadcrumb: {
      background: 'transparent',
      padding: 0,
      marginBottom: '1rem',
      fontSize: '0.9rem',
      display: 'flex',
      alignItems: 'center',
      listStyle: 'none'
    },
    breadcrumbItem: {
      display: 'flex',
      alignItems: 'center'
    },
    breadcrumbLink: {
      color: '#df2528',
      textDecoration: 'none'
    },
    breadcrumbSeparator: {
      margin: '0 0.5rem',
      color: '#666'
    },
    gallerySection: {
      marginBottom: '3rem'
    },
    mainImageContainer: {
      position: 'relative',
      height: '500px',
      borderRadius: '16px',
      overflow: 'hidden',
      marginBottom: '1rem'
    },
    mainImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    galleryNav: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'rgba(0,0,0,0.5)',
      color: 'white',
      border: 'none',
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    galleryNavPrev: {
      left: '20px'
    },
    galleryNavNext: {
      right: '20px'
    },
    thumbnailContainer: {
      display: 'flex',
      gap: '0.5rem',
      overflowX: 'auto',
      paddingBottom: '0.5rem'
    },
    thumbnail: {
      minWidth: '120px',
      height: '80px',
      borderRadius: '8px',
      overflow: 'hidden',
      cursor: 'pointer',
      opacity: '0.7',
      transition: 'all 0.3s ease',
      border: '2px solid transparent'
    },
    thumbnailActive: {
      opacity: 1,
      borderColor: '#df2528'
    },
    thumbnailImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    infoSection: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      padding: '2rem',
      marginBottom: '2rem'
    },
    gymHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '2rem',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    gymTitleBlock: {
      flex: 1,
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1.5rem'
    },
    gymLogo: {
      width: '100px',
      height: '100px',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      flexShrink: 0
    },
    gymLogoImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    gymTitleInfo: {
      flex: 1
    },
    gymTitle: {
      fontSize: '2.5rem',
      fontWeight: 800,
      color: '#232956',
      marginBottom: '0.5rem'
    },
    gymStatusBadge: {
      display: 'inline-block',
      padding: '0.4rem 1rem',
      borderRadius: '20px',
      fontSize: '0.9rem',
      fontWeight: 600,
      marginRight: '1rem'
    },
    gymStatusOpen: {
      background: '#e8f5e9',
      color: '#2e7d32'
    },
    gymStatusClosed: {
      background: '#ffebee',
      color: '#c62828'
    },
    gymRating: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontWeight: 600,
      color: '#232956'
    },
    stars: {
      color: '#ffc107'
    },
    gymActions: {
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap'
    },
    actionBtn: {
      padding: '0.8rem 1.5rem',
      borderRadius: '12px',
      fontWeight: 600,
      transition: 'all 0.3s ease',
      textDecoration: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      border: '2px solid transparent',
      cursor: 'pointer'
    },
    actionBtnPrimary: {
      background: '#df2528',
      color: 'white'
    },
    actionBtnSecondary: {
      background: 'white',
      color: '#232956',
      borderColor: '#e0e0e0'
    },
    contactInfo: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem',
      paddingTop: '2rem',
      borderTop: '1px solid #e0e0e0'
    },
    contactItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1rem'
    },
    contactIcon: {
      width: '40px',
      height: '40px',
      background: '#f8f9fa',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#df2528',
      flexShrink: 0
    },
    contactDetails: {
      flex: 1
    },
    contactDetailsH6: {
      fontWeight: 600,
      color: '#232956',
      marginBottom: '0.25rem',
      margin: 0
    },
    contactDetailsP: {
      margin: 0,
      color: '#666',
      fontSize: '0.95rem'
    },
    descriptionSection: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      padding: '2rem',
      marginBottom: '2rem'
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: '#232956',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    descriptionText: {
      color: '#1a1a1a',
      lineHeight: 1.8,
      fontSize: '1rem',
      marginBottom: '1rem'
    },
    facilitiesSection: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      padding: '2rem',
      marginBottom: '2rem'
    },
    facilitiesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '1rem'
    },
    facilityItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.6rem 0.8rem',
      background: '#f8f9fa',
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      fontSize: '0.9rem'
    },
    facilityIcon: {
      fontSize: '1.1rem',
      color: '#df2528'
    },
    facilityName: {
      fontWeight: 500,
      color: '#1a1a1a',
      fontSize: '0.85rem'
    },
    mapDetailSection: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      padding: '2rem',
      marginBottom: '2rem'
    },
    mapDetailContainer: {
      height: '400px',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      borderRadius: '12px',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      textAlign: 'center'
    },
    mapPlaceholder: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    },
    mapIcon: {
      fontSize: '4rem',
      color: '#df2528',
      marginBottom: '1rem'
    },
    mapTitle: {
      color: '#232956',
      marginBottom: '0.5rem'
    },
    mapSubtitle: {
      color: '#666'
    },
    relatedSection: {
      marginBottom: '3rem'
    },
    relatedGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem'
    },
    relatedCard: {
      background: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    relatedImage: {
      width: '100%',
      height: '200px',
      objectFit: 'cover'
    },
    relatedInfo: {
      padding: '1.5rem'
    },
    relatedName: {
      fontSize: '1.2rem',
      fontWeight: 700,
      color: '#1a1a1a',
      marginBottom: '0.5rem'
    },
    relatedAddress: {
      color: '#666',
      fontSize: '0.9rem',
      marginBottom: '1rem'
    },
    relatedRating: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontWeight: 600,
      color: '#232956'
    }
  };

  // Helper function to render stars
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={i} className="fas fa-star"></i>);
    }

    if (hasHalfStar) {
      stars.push(<i key="half" className="fas fa-star-half-alt"></i>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="far fa-star"></i>);
    }

    return stars;
  };

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        
        .gallery-nav:hover {
          background: rgba(0,0,0,0.8) !important;
        }
        
        .thumbnail:hover {
          opacity: 1 !important;
          border-color: #df2528 !important;
        }
        
        .facility-item:hover {
          background: #e3f2fd !important;
          transform: translateY(-2px);
        }
        
        .action-btn:hover {
          text-decoration: none !important;
        }
        
        .action-btn.primary:hover {
          background: #232956 !important;
          transform: translateY(-2px);
        }
        
        .action-btn.secondary:hover {
          border-color: #df2528 !important;
          color: #df2528 !important;
        }
        
        .related-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        
        @media (max-width: 991px) {
          .gym-title {
            font-size: 2rem !important;
          }
          .main-image-container {
            height: 300px !important;
          }
          .gym-header {
            flex-direction: column !important;
          }
        }
        
        @media (max-width: 576px) {
          .gym-title {
            font-size: 1.5rem !important;
          }
          .gym-logo {
            width: 60px !important;
            height: 60px !important;
          }
          .info-section,
          .description-section,
          .facilities-section,
          .map-detail-section {
            padding: 1.5rem !important;
          }
          .contact-info {
            grid-template-columns: 1fr !important;
          }
          .facilities-grid {
            grid-template-columns: 1fr !important;
          }
          .main-image-container {
            height: 250px !important;
          }
          .gallery-nav {
            width: 40px !important;
            height: 40px !important;
          }
        }
      `}</style>
      
      <main style={styles.mainContent}>
        <div style={styles.container}>
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" style={{ marginBottom: '1rem' }}>
            <ol style={styles.breadcrumb}>
              <li style={styles.breadcrumbItem}>
                <a href="/" style={styles.breadcrumbLink}>หน้าแรก</a>
              </li>
              <span style={styles.breadcrumbSeparator}>›</span>
              <li style={styles.breadcrumbItem}>
                <a href="/gyms" style={styles.breadcrumbLink}>ยิม&ฟิตเนส</a>
              </li>
              <span style={styles.breadcrumbSeparator}>›</span>
              <li style={styles.breadcrumbItem}>
                <span>{gymData.name}</span>
              </li>
            </ol>
          </nav>

          {/* Gallery Section */}
          <div style={styles.gallerySection}>
            <div style={styles.mainImageContainer}>
              <img 
                src={galleryImages[currentImageIndex]} 
                alt={gymData.name} 
                style={styles.mainImage}
              />
              <button 
                style={{...styles.galleryNav, ...styles.galleryNavPrev}} 
                className="gallery-nav prev"
                onClick={() => changeImage(-1)}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button 
                style={{...styles.galleryNav, ...styles.galleryNavNext}} 
                className="gallery-nav next"
                onClick={() => changeImage(1)}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
            <div style={styles.thumbnailContainer}>
              {thumbnailImages.map((image, index) => (
                <div 
                  key={index}
                  className="thumbnail"
                  style={{
                    ...styles.thumbnail,
                    ...(index === currentImageIndex ? styles.thumbnailActive : {})
                  }}
                  onClick={() => selectImage(index)}
                >
                  <img src={image} alt={`Thumbnail ${index + 1}`} style={styles.thumbnailImg} />
                </div>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div style={styles.infoSection}>
            <div style={styles.gymHeader} className="gym-header">
              <div style={styles.gymTitleBlock}>
                <div style={styles.gymLogo} className="gym-logo">
                  <img 
                    src={gymData.logo || "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=200&h=200&fit=crop"} 
                    alt={`${gymData.name} Logo`} 
                    style={styles.gymLogoImg}
                  />
                </div>
                <div style={styles.gymTitleInfo}>
                  <h1 style={styles.gymTitle} className="gym-title">{gymData.name}</h1>
                  <div>
                    <span style={{
                      ...styles.gymStatusBadge, 
                      ...(gymData.isOpen ? styles.gymStatusOpen : styles.gymStatusClosed)
                    }}>
                      {gymData.isOpen ? 'เปิดอยู่' : 'ปิดแล้ว'}
                    </span>
                    <span style={styles.gymRating}>
                      <span style={styles.stars}>
                        {renderStars(gymData.rating || 0)}
                      </span>
                      {gymData.rating || 0} ({gymData.reviewCount || 0} รีวิว)
                    </span>
                  </div>
                </div>
              </div>
              <div style={styles.gymActions}>
                <button 
                  onClick={handleContact}
                  style={{...styles.actionBtn, ...styles.actionBtnPrimary}} 
                  className="action-btn primary"
                >
                  <i className="fas fa-phone"></i>
                  ติดต่อ
                </button>
                <button 
                  onClick={handleShareGym}
                  style={{...styles.actionBtn, ...styles.actionBtnSecondary}} 
                  className="action-btn secondary"
                >
                  <i className="fas fa-share-alt"></i>
                  แชร์
                </button>
                <button 
                  onClick={handleSaveGym}
                  style={{...styles.actionBtn, ...styles.actionBtnSecondary}} 
                  className="action-btn secondary"
                >
                  <i className="far fa-heart"></i>
                  บันทึก
                </button>
              </div>
            </div>

            <div style={styles.contactInfo} className="contact-info">
              <div style={styles.contactItem}>
                <div style={styles.contactIcon}>
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <div style={styles.contactDetails}>
                  <h6 style={styles.contactDetailsH6}>ที่อยู่</h6>
                  <p style={styles.contactDetailsP}>
                    {gymData.address?.full || 'ไม่มีข้อมูลที่อยู่'}
                  </p>
                </div>
              </div>
              <div style={styles.contactItem}>
                <div style={styles.contactIcon}>
                  <i className="fas fa-clock"></i>
                </div>
                <div style={styles.contactDetails}>
                  <h6 style={styles.contactDetailsH6}>เวลาทำการ</h6>
                  <p style={styles.contactDetailsP}>
                    {gymData.openingHours || 'จันทร์ - ศุกร์: 06:00 - 22:00\nเสาร์ - อาทิตย์: 07:00 - 21:00'}
                  </p>
                </div>
              </div>
              <div style={styles.contactItem}>
                <div style={styles.contactIcon}>
                  <i className="fas fa-phone"></i>
                </div>
                <div style={styles.contactDetails}>
                  <h6 style={styles.contactDetailsH6}>ติดต่อ</h6>
                  <p style={styles.contactDetailsP}>
                    {gymData.contact?.phone && `โทร: ${gymData.contact.phone}\n`}
                    {gymData.contact?.email && `อีเมล: ${gymData.contact.email}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div style={styles.descriptionSection} className="description-section">
            <h2 style={styles.sectionTitle}>
              <i className="fas fa-info-circle"></i>
              เกี่ยวกับเรา
            </h2>
            <div style={styles.descriptionText}>
              {gymData.description || 'ไม่มีข้อมูลรายละเอียด'}
            </div>
          </div>

          {/* Facilities Section */}
          <div style={styles.facilitiesSection} className="facilities-section">
            <h2 style={styles.sectionTitle}>
              <i className="fas fa-dumbbell"></i>
              สิ่งอำนวยความสะดวก
            </h2>
            <div style={styles.facilitiesGrid} className="facilities-grid">
              {(gymData.facilities || []).map((facility, index) => (
                <div key={index} style={styles.facilityItem} className="facility-item">
                  <i className={facility.icon || 'fas fa-check'} style={styles.facilityIcon}></i>
                  <span style={styles.facilityName}>{facility.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map Section */}
          <div style={styles.mapDetailSection} className="map-detail-section">
            <h2 style={styles.sectionTitle}>
              <i className="fas fa-map-marked-alt"></i>
              แผนที่
            </h2>
            <div style={styles.mapDetailContainer}>
              <div style={styles.mapPlaceholder}>
                <i className="fas fa-map-marked-alt" style={styles.mapIcon}></i>
                <h4 style={styles.mapTitle}>{gymData.name}</h4>
                <p style={styles.mapSubtitle}>{gymData.address?.district || 'ไม่มีข้อมูลตำแหน่ง'}</p>
              </div>
            </div>
          </div>

          {/* Related Gyms */}
          <div style={styles.relatedSection}>
            <h2 style={styles.sectionTitle}>
              <i className="fas fa-th-large"></i>
              ยิมอื่นๆ ที่น่าสนใจ
            </h2>
            <div style={styles.relatedGrid}>
              {relatedGyms.map((gym) => (
                <div 
                  key={gym.id}
                  style={styles.relatedCard} 
                  className="related-card"
                  onClick={() => viewGymDetail(gym.id)}
                >
                  <img 
                    src={gym.image || gym.images?.[0] || 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=200&fit=crop'} 
                    alt={gym.name} 
                    style={styles.relatedImage} 
                  />
                  <div style={styles.relatedInfo}>
                    <h3 style={styles.relatedName}>{gym.name}</h3>
                    <p style={styles.relatedAddress}>{gym.address}</p>
                    <div style={styles.relatedRating}>
                      <i className="fas fa-star" style={{ color: '#ffc107' }}></i>
                      {gym.rating || 0} ({gym.reviewCount || 0} รีวิว)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GymDetail;