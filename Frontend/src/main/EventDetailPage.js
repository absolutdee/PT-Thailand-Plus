import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Event Data States
  const [event, setEvent] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [eventGallery, setEventGallery] = useState([]);
  
  // UI States
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remainingSeats, setRemainingSeats] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isViewTracked, setIsViewTracked] = useState(false);

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // Load event data on component mount
  useEffect(() => {
    if (id) {
      loadEventData();
    } else {
      setError('ไม่พบ ID ของอีเว้นท์');
      setIsLoading(false);
    }
  }, [id]);

  // Track view when event is loaded
  useEffect(() => {
    if (event && !isViewTracked) {
      trackEventView();
      setIsViewTracked(true);
    }
  }, [event, isViewTracked]);

  // ฟังก์ชันโหลดข้อมูลอีเว้นท์
  const loadEventData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load event details, gallery, and related events in parallel
      const [eventRes, galleryRes, relatedRes] = await Promise.all([
        fetch(`${API_BASE_URL}/events/${id}`),
        fetch(`${API_BASE_URL}/events/${id}/gallery`),
        fetch(`${API_BASE_URL}/events/${id}/related?limit=3`)
      ]);

      // Handle event data
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        const eventInfo = eventData.data || getDefaultEvent();
        setEvent(eventInfo);
        setRemainingSeats(eventInfo.remaining_seats || eventInfo.max_participants || 0);
      } else if (eventRes.status === 404) {
        setError('ไม่พบอีเว้นท์ที่คุณต้องการ');
        return;
      } else {
        const defaultEvent = getDefaultEvent();
        setEvent(defaultEvent);
        setRemainingSeats(defaultEvent.remaining_seats);
      }

      // Handle gallery
      if (galleryRes.ok) {
        const galleryData = await galleryRes.json();
        setEventGallery(galleryData.data || getDefaultGallery());
      } else {
        setEventGallery(getDefaultGallery());
      }

      // Handle related events
      if (relatedRes.ok) {
        const relatedData = await relatedRes.json();
        setRelatedEvents(relatedData.data || getDefaultRelatedEvents());
      } else {
        setRelatedEvents(getDefaultRelatedEvents());
      }

    } catch (error) {
      console.error('Error loading event:', error);
      setError('เกิดข้อผิดพลาดในการโหลดอีเว้นท์ กรุณาลองใหม่อีกครั้ง');
      
      // Use fallback data
      const defaultEvent = getDefaultEvent();
      setEvent(defaultEvent);
      setEventGallery(getDefaultGallery());
      setRelatedEvents(getDefaultRelatedEvents());
      setRemainingSeats(defaultEvent.remaining_seats);
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันติดตามการดูอีเว้นท์
  const trackEventView = async () => {
    try {
      await fetch(`${API_BASE_URL}/events/${id}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error tracking event view:', error);
      // ไม่ต้องแสดง error เพราะไม่ใช่ฟีเจอร์หลัก
    }
  };

  // ฟังก์ชันสมัครเข้าร่วมอีเว้นท์
  const handleEventRegistration = async () => {
    try {
      setIsRegistering(true);
      
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        alert('กรุณาเข้าสู่ระบบก่อนสมัครเข้าร่วมอีเว้นท์');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/events/${id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        alert('สมัครเข้าร่วมอีเว้นท์สำเร็จ! เราจะส่งอีเมลยืนยันให้คุณ');
        // Update remaining seats
        if (remainingSeats > 0) {
          setRemainingSeats(prev => prev - 1);
        }
      } else {
        throw new Error(result.message || 'ไม่สามารถสมัครเข้าร่วมได้');
      }

    } catch (error) {
      console.error('Registration error:', error);
      alert(error.message || 'เกิดข้อผิดพลาดในการสมัครเข้าร่วม กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsRegistering(false);
    }
  };

  // Default event data (fallback)
  const getDefaultEvent = () => ({
    id: 1,
    title: "Marathon Training Workshop",
    description: `เวิร์กช็อปการฝึกซ้อมมาราธอนสำหรับผู้เริ่มต้นและนักวิ่งที่ต้องการพัฒนาทักษะ เรียนรู้เทคนิคการวิ่งที่ถูกต้อง การวางแผนการฝึกซ้อม และการป้องกันการบาดเจ็บ โดยผู้เชี่ยวชาญด้านการกีฬาและโค้ชมาราธอนระดับชาติ

ในเวิร์กช็อปนี้ คุณจะได้เรียนรู้วิธีการเตรียมร่างกายและจิตใจสำหรับการวิ่งมาราธอน เทคนิคการหายใจ การเลือกรองเท้าและอุปกรณ์ที่เหมาะสม รวมถึงการวางแผนโภชนาการก่อน ระหว่าง และหลังการวิ่ง

ไม่ว่าคุณจะเป็นมือใหม่ที่เพิ่งเริ่มวิ่ง หรือนักวิ่งที่มีประสบการณ์แล้วแต่ต้องการปรับปรุงเทคนิค เวิร์กช็อปนี้จะช่วยให้คุณบรรลุเป้าหมายในการวิ่งมาราธอนได้อย่างปลอดภัยและมีประสิทธิภาพ`,
    featured_image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=400&fit=crop',
    event_date: '2024-12-25',
    start_time: '09:00',
    end_time: '16:00',
    location: 'สวนลุมพินี, กรุงเทพฯ',
    location_address: 'สวนลุมพินี เขตปทุมวัน กรุงเทพมหานคร 10330',
    location_transport: 'รถไฟฟ้า BTS สถานีศาลาแดง ทางออก 3 เดินประมาณ 5 นาที หรือ รถไฟฟ้า MRT สถานีสีลม ทางออก 1 เดินประมาณ 8 นาที',
    price: 0,
    price_text: 'ฟรี',
    category: 'workshop',
    category_name: 'เวิร์กช็อป',
    organizer: {
      name: 'Bangkok Runners Club',
      contact_email: 'info@bangkokrunners.com',
      contact_phone: '02-123-4567'
    },
    max_participants: 150,
    remaining_seats: 45,
    language: 'ไทย / อังกฤษ',
    includes: [
      'เอกสารและคู่มือการฝึกซ้อม',
      'อาหารกลางวันและเครื่องดื่ม',
      'เสื้อยืดที่ระลึก',
      'ใบประกาศนียบัตรการเข้าร่วม',
      'หมายเลขซิบ (Race Bib) ที่ระลึก',
      'แผนการฝึกซ้อม 16 สัปดาห์',
      'คูปองส่วนลด running gear',
      'การปรึกษาออนไลน์ 1 เดือน'
    ],
    badges: ['เวิร์กช็อป', 'ฟรี', 'ทุกระดับ']
  });

  // Default gallery (fallback)
  const getDefaultGallery = () => [
    {
      id: 1,
      thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=200&fit=crop',
      full_image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
      alt_text: 'Marathon Training 1'
    },
    {
      id: 2,
      thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
      full_image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
      alt_text: 'Marathon Training 2'
    },
    {
      id: 3,
      thumbnail: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=300&h=200&fit=crop',
      full_image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=600&fit=crop',
      alt_text: 'Marathon Training 3'
    },
    {
      id: 4,
      thumbnail: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=300&h=200&fit=crop',
      full_image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&h=600&fit=crop',
      alt_text: 'Marathon Training 4'
    },
    {
      id: 5,
      thumbnail: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=300&h=200&fit=crop',
      full_image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&h=600&fit=crop',
      alt_text: 'Marathon Training 5'
    },
    {
      id: 6,
      thumbnail: 'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?w=300&h=200&fit=crop',
      full_image: 'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?w=800&h=600&fit=crop',
      alt_text: 'Marathon Training 6'
    }
  ];

  // Default related events (fallback)
  const getDefaultRelatedEvents = () => [
    {
      id: 2,
      title: 'Yoga Retreat Weekend',
      featured_image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&h=150&fit=crop',
      event_date: '2024-12-28'
    },
    {
      id: 3,
      title: 'CrossFit Competition 2024',
      featured_image: 'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?w=300&h=150&fit=crop',
      event_date: '2025-01-05'
    }
  ];

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Format date range for display
  const formatDateRange = (startDate, endDate) => {
    if (!startDate) return '';
    if (!endDate || startDate === endDate) {
      return formatDate(startDate);
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${start.getDate()}-${end.getDate()} ${start.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`;
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  // Format time range
  const formatTimeRange = (startTime, endTime) => {
    if (!startTime && !endTime) return 'เต็มวัน';
    if (!endTime || startTime === endTime) return startTime;
    return `${startTime} - ${endTime} น.`;
  };

  // Gallery functions
  const openGallery = (index) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const showPrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + eventGallery.length) % eventGallery.length);
  };

  const showNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % eventGallery.length);
  };

  // Event handlers - Updated with real data
  const handleRegister = () => {
    handleEventRegistration();
  };

  const handleContactOrganizer = () => {
    if (event?.organizer?.contact_email) {
      window.location.href = `mailto:${event.organizer.contact_email}?subject=สอบถามเกี่ยวกับ ${event.title}`;
    } else {
      alert('กำลังเปิดหน้าติดต่อผู้จัดงาน...');
    }
  };

  // Share functions - Updated with real event data
  const handleShare = (platform) => {
    const url = window.location.href;
    const title = event ? event.title : 'อีเว้นท์น่าสนใจ';
    const description = event ? event.description?.substring(0, 100) + '...' : '';

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'line':
        window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing, copy link instead
        navigator.clipboard.writeText(url).then(() => {
          alert('คัดลอกลิงก์เรียบร้อยแล้ว! สามารถนำไปแชร์ใน Instagram ได้');
        });
        break;
      default:
        console.log('Share to:', platform);
    }
  };

  // View related event
  const viewRelatedEvent = (eventId) => {
    navigate(`/eventdetail/${eventId}`);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isModalOpen) {
        if (e.key === 'ArrowLeft') {
          showPrevImage();
        } else if (e.key === 'ArrowRight') {
          showNextImage();
        } else if (e.key === 'Escape') {
          closeModal();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen, eventGallery.length]);

  // Simulate seat updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.1 && remainingSeats > 0) {
        const decrease = Math.floor(Math.random() * 3) + 1;
        setRemainingSeats(prev => Math.max(0, prev - decrease));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [remainingSeats]);

  // Loading Component
  const LoadingSpinner = () => (
    <div style={styles.loadingContainer}>
      <div style={styles.loadingSpinner}>
        <div style={styles.spinner}></div>
      </div>
      <p style={styles.loadingText}>กำลังโหลดข้อมูลอีเว้นท์...</p>
    </div>
  );

  // Error Component
  const ErrorMessage = () => (
    <div style={styles.errorContainer}>
      <div style={styles.errorIcon}>
        <i className="fas fa-exclamation-triangle"></i>
      </div>
      <h3 style={styles.errorTitle}>เกิดข้อผิดพลาด</h3>
      <p style={styles.errorMessage}>{error}</p>
      <div style={styles.errorActions}>
        <button 
          style={styles.retryBtn}
          onClick={loadEventData}
        >
          <i className="fas fa-redo"></i>
          ลองใหม่
        </button>
        <button 
          style={styles.backBtn}
          onClick={() => navigate('/events')}
        >
          <i className="fas fa-arrow-left"></i>
          กลับไปหน้าอีเว้นท์
        </button>
      </div>
    </div>
  );

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
      minHeight: '100vh'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 15px'
    },
    // Loading & Error States
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center'
    },
    loadingSpinner: {
      marginBottom: '1rem'
    },
    spinner: {
      width: '50px',
      height: '50px',
      border: '3px solid #f3f3f3',
      borderTop: '3px solid #df2528',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    loadingText: {
      color: '#666',
      fontSize: '1.1rem'
    },
    errorContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem'
    },
    errorIcon: {
      fontSize: '4rem',
      color: '#df2528',
      marginBottom: '1rem'
    },
    errorTitle: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: '#1a1a1a',
      marginBottom: '0.5rem'
    },
    errorMessage: {
      color: '#666',
      marginBottom: '2rem',
      fontSize: '1.1rem'
    },
    errorActions: {
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap',
      justifyContent: 'center'
    },
    retryBtn: {
      padding: '0.75rem 1.5rem',
      background: '#df2528',
      color: 'white',
      border: 'none',
      borderRadius: '25px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '1rem',
      fontWeight: 600,
      transition: 'all 0.3s ease'
    },
    backBtn: {
      padding: '0.75rem 1.5rem',
      background: '#232956',
      color: 'white',
      border: 'none',
      borderRadius: '25px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '1rem',
      fontWeight: 600,
      transition: 'all 0.3s ease'
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
    eventHero: {
      position: 'relative',
      height: '400px',
      background: 'linear-gradient(135deg, #232956 0%, #1a1f4a 100%)',
      borderRadius: '20px',
      overflow: 'hidden',
      marginBottom: '2rem'
    },
    heroBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      opacity: 0.3
    },
    heroOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, rgba(35, 41, 86, 0.75) 0%, rgba(35, 41, 86, 0.6) 30%, rgba(35, 41, 86, 0.3) 60%, rgba(35, 41, 86, 0.1) 80%, transparent 100%)'
    },
    heroContent: {
      position: 'relative',
      zIndex: 2,
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      color: 'white',
      padding: '2rem'
    },
    heroTitle: {
      fontSize: '2.5rem',
      fontWeight: 800,
      marginBottom: '1rem',
      textShadow: '0 2px 10px rgba(0,0,0,0.5)'
    },
    heroMeta: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '2rem',
      marginBottom: '1.5rem'
    },
    heroMetaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '1.1rem'
    },
    heroMetaIcon: {
      fontSize: '1.3rem',
      color: '#df2528'
    },
    heroBadges: {
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap'
    },
    heroBadge: {
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      fontWeight: 600,
      border: '1px solid rgba(255, 255, 255, 0.3)'
    },
    row: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '2rem'
    },
    mainColumn: {
      flex: '1 1 65%',
      minWidth: '300px'
    },
    sidebarColumn: {
      flex: '1 1 30%',
      minWidth: '280px'
    },
    contentCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      marginBottom: '2rem'
    },
    contentTitle: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: '#232956',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    contentText: {
      lineHeight: 1.8,
      color: '#1a1a1a',
      marginBottom: '1rem'
    },
    listUnstyled: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    listItem: {
      marginBottom: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    checkIcon: {
      color: '#28a745'
    },
    locationMap: {
      width: '100%',
      height: '250px',
      background: '#f8f9fa',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#666',
      marginBottom: '1rem',
      flexDirection: 'column'
    },
    locationDetails: {
      background: '#f8f9fa',
      padding: '1rem',
      borderRadius: '12px'
    },
    locationAddress: {
      fontWeight: 600,
      color: '#1a1a1a',
      marginBottom: '0.5rem'
    },
    locationTransport: {
      color: '#666',
      fontSize: '0.9rem'
    },
    eventGallery: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem'
    },
    galleryItem: {
      position: 'relative',
      aspectRatio: '4/3',
      borderRadius: '12px',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    galleryImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    galleryOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(35, 41, 86, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0,
      transition: 'opacity 0.3s ease'
    },
    galleryIcon: {
      color: 'white',
      fontSize: '2rem'
    },
    sidebarCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      marginBottom: '1.5rem'
    },
    priceSection: {
      textAlign: 'center',
      marginBottom: '2rem'
    },
    priceLabel: {
      fontSize: '0.9rem',
      color: '#666',
      marginBottom: '0.5rem'
    },
    priceAmount: {
      fontSize: '2.5rem',
      fontWeight: 800,
      color: '#df2528',
      marginBottom: '0.5rem'
    },
    priceNote: {
      fontSize: '0.85rem',
      color: '#666'
    },
    quickInfo: {
      borderTop: '1px solid #f0f0f0',
      paddingTop: '1.5rem'
    },
    infoItem: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '1rem',
      padding: '0.5rem 0'
    },
    infoIcon: {
      width: '40px',
      height: '40px',
      background: '#f8f9fa',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '1rem',
      color: '#df2528'
    },
    infoContent: {
      flex: 1
    },
    infoContentH6: {
      margin: 0,
      color: '#666',
      fontSize: '0.85rem',
      fontWeight: 500
    },
    infoContentP: {
      margin: 0,
      color: '#1a1a1a',
      fontWeight: 600
    },
    registerBtn: {
      width: '100%',
      background: 'linear-gradient(135deg, #df2528, #ff6b6b)',
      color: 'white',
      border: 'none',
      padding: '1rem 2rem',
      borderRadius: '12px',
      fontWeight: 700,
      fontSize: '1.1rem',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      transition: 'all 0.3s ease',
      marginTop: '1.5rem',
      cursor: 'pointer',
      opacity: 1
    },
    registerBtnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
      pointerEvents: 'none'
    },
    contactOrganizer: {
      width: '100%',
      background: 'transparent',
      color: '#232956',
      border: '2px solid #232956',
      padding: '0.8rem 2rem',
      borderRadius: '12px',
      fontWeight: 600,
      marginTop: '1rem',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    shareButtons: {
      display: 'flex',
      gap: '0.5rem'
    },
    shareBtn: {
      flex: 1,
      padding: '0.7rem',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    shareBtnFacebook: {
      background: '#1877f2'
    },
    shareBtnTwitter: {
      background: '#1da1f2'
    },
    shareBtnInstagram: {
      background: '#e4405f'
    },
    shareBtnLine: {
      background: '#00c300'
    },
    relatedEvents: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '1rem'
    },
    relatedEventCard: {
      background: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    relatedEventImage: {
      width: '100%',
      height: '150px',
      objectFit: 'cover'
    },
    relatedEventInfo: {
      padding: '1rem'
    },
    relatedEventTitle: {
      fontWeight: 600,
      color: '#1a1a1a',
      fontSize: '0.9rem',
      marginBottom: '0.5rem'
    },
    relatedEventDate: {
      color: '#df2528',
      fontSize: '0.85rem',
      fontWeight: 600
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1055
    },
    modalContent: {
      position: 'relative',
      maxWidth: '85vw',
      maxHeight: '85vh'
    },
    modalImage: {
      maxWidth: '85vw',
      maxHeight: '85vh',
      objectFit: 'contain',
      display: 'block'
    },
    modalNavigation: {
      position: 'absolute',
      top: '50%',
      left: '0',
      right: '0',
      transform: 'translateY(-50%)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 2rem',
      pointerEvents: 'none'
    },
    modalNavBtn: {
      opacity: 0.7,
      transition: 'all 0.3s ease',
      pointerEvents: 'auto',
      background: 'rgba(255, 255, 255, 0.9)',
      border: 'none',
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    },
    modalClose: {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      background: 'rgba(255, 255, 255, 0.9)',
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      opacity: 0.8,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#333'
    },
    modalFooter: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '1rem',
      textAlign: 'center',
      border: 'none',
      margin: 0
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={styles.root}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700;800;900&display=swap');
          @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <main style={styles.mainContent}>
          <div style={styles.container}>
            <LoadingSpinner />
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error && !event) {
    return (
      <div style={styles.root}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700;800;900&display=swap');
          @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
          
          .retry-btn:hover {
            background: #1a1f42 !important;
            transform: translateY(-2px);
          }
          
          .back-btn:hover {
            background: #1a1f42 !important;
            transform: translateY(-2px);
          }
        `}</style>
        <main style={styles.mainContent}>
          <div style={styles.container}>
            <ErrorMessage />
          </div>
        </main>
      </div>
    );
  }

  // Main render
  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        H1 {
        color: #ffffff;
        }
        
        .gallery-item:hover {
          transform: scale(1.05);
        }
        
        .gallery-item:hover .gallery-overlay {
          opacity: 1 !important;
        }
        
        .register-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(223, 37, 40, 0.3);
        }
        
        .contact-organizer:hover {
          background: #232956 !important;
          color: white !important;
        }
        
        .share-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        
        .related-event-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .modal-nav-btn:hover {
          opacity: 1 !important;
          transform: scale(1.1);
          background: white !important;
        }
        
        .modal-close:hover {
          opacity: 1 !important;
          transform: scale(1.1);
          background: white !important;
        }
        
        .retry-btn:hover {
          background: #1a1f42 !important;
          transform: translateY(-2px);
        }
        
        .back-btn:hover {
          background: #1a1f42 !important;
          transform: translateY(-2px);
        }
        
        @media (max-width: 991px) {
          .hero-content {
            padding: 1.5rem !important;
          }
          .hero-title {
            font-size: 2rem !important;
          }
          .hero-meta {
            gap: 1rem !important;
          }
          .content-card {
            padding: 1.5rem !important;
          }
          .row {
            flex-direction: column !important;
          }
        }
        
        @media (max-width: 576px) {
          .hero-content {
            padding: 1rem !important;
          }
          .hero-title {
            font-size: 1.8rem !important;
          }
          .hero-meta {
            flex-direction: column !important;
            gap: 0.5rem !important;
          }
          .price-amount {
            font-size: 2rem !important;
          }
          .content-card {
            padding: 1rem !important;
          }
          .sidebar-card {
            padding: 1.5rem !important;
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
                <a href="/events" style={styles.breadcrumbLink}>อีเว้นท์</a>
              </li>
              <span style={styles.breadcrumbSeparator}>›</span>
              <li style={styles.breadcrumbItem}>
                <span>{event?.title || 'อีเว้นท์'}</span>
              </li>
            </ol>
          </nav>

          {/* Event Hero */}
          <div style={styles.eventHero}>
            <img 
              src={event?.featured_image || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=400&fit=crop'} 
              alt={event?.title || 'Event'} 
              style={styles.heroBackground}
            />
            <div style={styles.heroOverlay}></div>
            <div style={styles.heroContent}>
              <div>
                <h1 style={styles.heroTitle} className="hero-title">{event?.title}</h1>
                <div style={styles.heroMeta} className="hero-meta">
                  <div style={styles.heroMetaItem}>
                    <i className="fas fa-calendar-alt" style={styles.heroMetaIcon}></i>
                    <span>{formatDateRange(event?.event_date, event?.end_date)}</span>
                  </div>
                  <div style={styles.heroMetaItem}>
                    <i className="fas fa-clock" style={styles.heroMetaIcon}></i>
                    <span>{formatTimeRange(event?.start_time, event?.end_time)}</span>
                  </div>
                  <div style={styles.heroMetaItem}>
                    <i className="fas fa-map-marker-alt" style={styles.heroMetaIcon}></i>
                    <span>{event?.location}</span>
                  </div>
                </div>
                <div style={styles.heroBadges}>
                  {event?.badges?.map((badge, index) => (
                    <span key={index} style={styles.heroBadge}>{badge}</span>
                  )) || (
                    <>
                      <span style={styles.heroBadge}>{event?.category_name}</span>
                      <span style={styles.heroBadge}>{event?.price_text}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={styles.row} className="row">
            {/* Main Content */}
            <div style={styles.mainColumn}>
              {/* Event Description */}
              <div style={styles.contentCard} className="content-card">
                <h2 style={styles.contentTitle}>
                  <i className="fas fa-info-circle"></i>
                  รายละเอียดอีเว้นท์
                </h2>
                {event?.description?.split('\n').map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index} style={styles.contentText}>
                      {paragraph.trim()}
                    </p>
                  )
                ))}
              </div>

              {/* What's Included */}
              {event?.includes && event.includes.length > 0 && (
                <div style={styles.contentCard} className="content-card">
                  <h2 style={styles.contentTitle}>
                    <i className="fas fa-gift"></i>
                    สิ่งที่ได้รับ
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                    <div>
                      <ul style={styles.listUnstyled}>
                        {event.includes.slice(0, Math.ceil(event.includes.length / 2)).map((item, index) => (
                          <li key={index} style={styles.listItem}>
                            <i className="fas fa-check-circle" style={styles.checkIcon}></i>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {event.includes.length > 1 && (
                      <div>
                        <ul style={styles.listUnstyled}>
                          {event.includes.slice(Math.ceil(event.includes.length / 2)).map((item, index) => (
                            <li key={index} style={styles.listItem}>
                              <i className="fas fa-check-circle" style={styles.checkIcon}></i>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Location */}
              <div style={styles.contentCard} className="content-card">
                <h2 style={styles.contentTitle}>
                  <i className="fas fa-map-marker-alt"></i>
                  สถานที่จัดงาน
                </h2>
                <div style={styles.locationMap}>
                  <div style={{ textAlign: 'center' }}>
                    <i className="fas fa-map" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
                    <p>แผนที่ {event?.location}</p>
                  </div>
                </div>
                <div style={styles.locationDetails}>
                  <div style={styles.locationAddress}>
                    {event?.location_address || event?.location}
                  </div>
                  {event?.location_transport && (
                    <div style={styles.locationTransport}>
                      <strong>การเดินทาง:</strong> {event.location_transport}
                    </div>
                  )}
                </div>
              </div>

              {/* Gallery */}
              {eventGallery.length > 0 && (
                <div style={styles.contentCard} className="content-card">
                  <h2 style={styles.contentTitle}>
                    <i className="fas fa-images"></i>
                    ภาพบรรยากาศจากอีเว้นท์ก่อนหน้า
                  </h2>
                  <div style={styles.eventGallery}>
                    {eventGallery.map((image, index) => (
                      <div 
                        key={image.id || index}
                        className="gallery-item"
                        style={styles.galleryItem}
                        onClick={() => openGallery(index)}
                      >
                        <img 
                          src={image.thumbnail || image.image} 
                          alt={image.alt_text || image.alt || `Gallery ${index + 1}`} 
                          style={styles.galleryImage} 
                        />
                        <div className="gallery-overlay" style={styles.galleryOverlay}>
                          <i className="fas fa-search-plus" style={styles.galleryIcon}></i>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div style={styles.sidebarColumn}>
              {/* Price & Registration */}
              <div style={styles.sidebarCard} className="sidebar-card">
                <div style={styles.priceSection}>
                  <div style={styles.priceLabel}>ค่าเข้าร่วม</div>
                  <div style={styles.priceAmount} className="price-amount">
                    {event?.price_text || (event?.price === 0 ? 'ฟรี' : `${event?.price?.toLocaleString()} บาท`)}
                  </div>
                  <div style={styles.priceNote}>
                    {event?.price === 0 ? 'ไม่มีค่าใช้จ่าย รวมอาหารกลางวัน' : 'รวมสิ่งที่ได้รับทั้งหมด'}
                  </div>
                </div>

                <div style={styles.quickInfo}>
                  <div style={styles.infoItem}>
                    <div style={styles.infoIcon}>
                      <i className="fas fa-calendar-alt"></i>
                    </div>
                    <div style={styles.infoContent}>
                      <h6 style={styles.infoContentH6}>วันที่</h6>
                      <p style={styles.infoContentP}>
                        {formatDateRange(event?.event_date, event?.end_date)}
                      </p>
                    </div>
                  </div>
                  <div style={styles.infoItem}>
                    <div style={styles.infoIcon}>
                      <i className="fas fa-clock"></i>
                    </div>
                    <div style={styles.infoContent}>
                      <h6 style={styles.infoContentH6}>เวลา</h6>
                      <p style={styles.infoContentP}>
                        {formatTimeRange(event?.start_time, event?.end_time)}
                      </p>
                    </div>
                  </div>
                  <div style={styles.infoItem}>
                    <div style={styles.infoIcon}>
                      <i className="fas fa-users"></i>
                    </div>
                    <div style={styles.infoContent}>
                      <h6 style={styles.infoContentH6}>จำนวนผู้เข้าร่วม</h6>
                      <p style={{
                        ...styles.infoContentP,
                        color: remainingSeats < 10 ? '#df2528' : '#1a1a1a',
                        fontWeight: remainingSeats < 10 ? '700' : '600'
                      }}>
                        {event?.max_participants} คน (เหลือ {remainingSeats} ที่นั่ง)
                      </p>
                    </div>
                  </div>
                  {event?.language && (
                    <div style={styles.infoItem}>
                      <div style={styles.infoIcon}>
                        <i className="fas fa-language"></i>
                      </div>
                      <div style={styles.infoContent}>
                        <h6 style={styles.infoContentH6}>ภาษา</h6>
                        <p style={styles.infoContentP}>{event.language}</p>
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  className="register-btn"
                  style={{
                    ...styles.registerBtn,
                    ...(isRegistering || remainingSeats === 0 ? styles.registerBtnDisabled : {})
                  }}
                  onClick={handleRegister}
                  disabled={isRegistering || remainingSeats === 0}
                >
                  {isRegistering ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      กำลังสมัคร...
                    </>
                  ) : remainingSeats === 0 ? (
                    'เต็มแล้ว'
                  ) : (
                    'สมัครเข้าร่วม'
                  )}
                </button>
                <button 
                  className="contact-organizer"
                  style={styles.contactOrganizer}
                  onClick={handleContactOrganizer}
                >
                  ติดต่อผู้จัดงาน
                </button>
              </div>

              {/* Share Event */}
              <div style={styles.sidebarCard} className="sidebar-card">
                <h4 style={{ marginBottom: '1rem' }}>แชร์อีเว้นท์</h4>
                <div style={styles.shareButtons}>
                  <button 
                    className="share-btn"
                    style={{...styles.shareBtn, ...styles.shareBtnFacebook}}
                    onClick={() => handleShare('facebook')}
                  >
                    <i className="fab fa-facebook-f"></i>
                  </button>
                  <button 
                    className="share-btn"
                    style={{...styles.shareBtn, ...styles.shareBtnTwitter}}
                    onClick={() => handleShare('twitter')}
                  >
                    <i className="fab fa-twitter"></i>
                  </button>
                  <button 
                    className="share-btn"
                    style={{...styles.shareBtn, ...styles.shareBtnInstagram}}
                    onClick={() => handleShare('instagram')}
                  >
                    <i className="fab fa-instagram"></i>
                  </button>
                  <button 
                    className="share-btn"
                    style={{...styles.shareBtn, ...styles.shareBtnLine}}
                    onClick={() => handleShare('line')}
                  >
                    <i className="fab fa-line"></i>
                  </button>
                </div>
              </div>

              {/* Related Events */}
              {relatedEvents.length > 0 && (
                <div style={styles.sidebarCard} className="sidebar-card">
                  <h4 style={{ marginBottom: '1rem' }}>อีเว้นท์ที่เกี่ยวข้อง</h4>
                  <div style={styles.relatedEvents}>
                    {relatedEvents.map((relatedEvent) => (
                      <div 
                        key={relatedEvent.id}
                        className="related-event-card" 
                        style={styles.relatedEventCard}
                        onClick={() => viewRelatedEvent(relatedEvent.id)}
                      >
                        <img 
                          src={relatedEvent.featured_image || relatedEvent.image} 
                          alt={relatedEvent.title} 
                          style={styles.relatedEventImage}
                        />
                        <div style={styles.relatedEventInfo}>
                          <div style={styles.relatedEventTitle}>{relatedEvent.title}</div>
                          <div style={styles.relatedEventDate}>
                            {formatDateRange(relatedEvent.event_date, relatedEvent.end_date)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Image Lightbox Modal */}
      {isModalOpen && eventGallery.length > 0 && (
        <div style={styles.modal} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              style={styles.modalClose}
              onClick={closeModal}
            >
              ×
            </button>
            <img 
              src={eventGallery[currentImageIndex]?.full_image || eventGallery[currentImageIndex]?.image} 
              alt={eventGallery[currentImageIndex]?.alt_text || eventGallery[currentImageIndex]?.alt}
              style={styles.modalImage}
            />
            <div style={styles.modalNavigation}>
              <button 
                className="modal-nav-btn"
                style={styles.modalNavBtn}
                onClick={showPrevImage}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button 
                className="modal-nav-btn"
                style={styles.modalNavBtn}
                onClick={showNextImage}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
            <div style={styles.modalFooter}>
              <span>{currentImageIndex + 1} / {eventGallery.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;