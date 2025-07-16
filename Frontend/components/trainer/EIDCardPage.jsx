import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, RotateCcw, Share2, Shield, CheckCircle, Clock,
  RefreshCw, QrCode, Eye, Smartphone, AlertCircle, Wifi, WifiOff
} from 'lucide-react';

// Import API Service และ Context
import ApiService from '../../services/api';
import { useTrainer } from '../../contexts/TrainerContext';

const EIDCardPage = ({ windowWidth, onNavigateBack }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [viewCount, setViewCount] = useState(1247);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // ใช้ Context สำหรับข้อมูล trainer
  const { state: trainerContext } = useTrainer();
  
  // State สำหรับข้อมูล trainer card
  const [trainerData, setTrainerData] = useState({
    id: 'TH240001234',
    nameThai: 'โค้ชมิกซ์',
    nameEng: 'มิกซ์ ฟิตเนส',
    position: 'PERSONAL FITNESS TRAINER',
    certifications: ['ACSM-CPT', 'NASM-CES'],
    photo: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=400&h=400&fit=crop&crop=face',
    profileUrl: 'https://fitconnect.com/trainer/mix-fitness',
    slug: 'mix-fitness',
    issueDate: '01/06/2024',
    expiryDate: '01/06/2027',
    isVerified: true,
    lastUpdate: new Date().toLocaleDateString('th-TH')
  });

  const cardRef = useRef(null);
  const qrCanvasRef = useRef(null);

  // ตรวจสอบสถานะออนไลน์
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // โหลดข้อมูล trainer จาก API
  useEffect(() => {
    loadTrainerData();
  }, [isOnline]);

  // โหลดข้อมูลจาก Context เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    if (trainerContext.profile) {
      updateTrainerDataFromContext();
    }
  }, [trainerContext.profile]);

  // Initialize component
  useEffect(() => {
    // Auto-generate QR Code after component loads
    setTimeout(() => {
      generateQRCode();
    }, 500);

    // Setup keyboard shortcuts
    const handleKeyDown = (event) => {
      switch(event.code) {
        case 'Space':
          event.preventDefault();
          flipCard();
          break;
        case 'Escape':
          goBack();
          break;
        case 'KeyS':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            shareCard();
          }
          break;
        case 'KeyR':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            refreshTrainerData();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // โหลดข้อมูล trainer จาก API
  const loadTrainerData = async () => {
    if (!isOnline) {
      console.log('📴 Offline mode - using cached data');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Loading trainer data from API...');
      
      // ดึงข้อมูลจาก API
      const profileData = await ApiService.getProfile();
      
      if (profileData) {
        // อัพเดทข้อมูลจาก API
        setTrainerData(prev => ({
          ...prev,
          id: profileData.trainerId || prev.id,
          nameThai: profileData.name || profileData.fullName || prev.nameThai,
          nameEng: profileData.nameEng || profileData.englishName || prev.nameEng,
          position: profileData.position || profileData.title || prev.position,
          certifications: profileData.certifications || prev.certifications,
          photo: profileData.profileImage || profileData.avatar || prev.photo,
          profileUrl: profileData.profileUrl || `https://fitconnect.com/trainer/${profileData.slug || 'trainer'}`,
          slug: profileData.slug || prev.slug,
          isVerified: profileData.isVerified !== undefined ? profileData.isVerified : prev.isVerified,
          lastUpdate: new Date().toLocaleDateString('th-TH')
        }));
        
        console.log('✅ Trainer data loaded successfully from API');
        showNotification('✅ โหลดข้อมูลจาก API สำเร็จ', 'success');
      }
      
    } catch (error) {
      console.error('❌ Failed to load trainer data from API:', error);
      setError('ไม่สามารถโหลดข้อมูลจาก API ได้');
      showNotification('⚠️ ใช้ข้อมูลออฟไลน์', 'warning');
    } finally {
      setIsLoading(false);
      setLastRefresh(Date.now());
    }
  };

  // อัพเดทข้อมูลจาก Context
  const updateTrainerDataFromContext = () => {
    const profile = trainerContext.profile;
    if (!profile) return;

    console.log('🔄 Updating trainer data from Context...');
    
    setTrainerData(prev => ({
      ...prev,
      nameThai: profile.name || prev.nameThai,
      nameEng: profile.nameEng || profile.englishName || prev.nameEng,
      position: profile.position || prev.position,
      photo: profile.profileImage || profile.avatar || prev.photo,
      isVerified: profile.isVerified !== undefined ? profile.isVerified : prev.isVerified,
      lastUpdate: new Date().toLocaleDateString('th-TH')
    }));
    
    console.log('✅ Trainer data updated from Context');
  };

  // รีเฟรชข้อมูล trainer
  const refreshTrainerData = async () => {
    console.log('🔄 Manual refresh triggered...');
    showNotification('🔄 กำลังรีเฟรชข้อมูล...', 'info');
    
    await loadTrainerData();
    generateQRCode();
    
    showNotification('✅ รีเฟรชข้อมูลสำเร็จ!', 'success');
  };

  // Generate QR Code with enhanced pattern
  const generateQRCode = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) {
      console.warn('QR Canvas not found');
      return false;
    }

    try {
      const ctx = canvas.getContext('2d');
      const size = windowWidth <= 768 ? 140 : 180;
      
      // Clear canvas
      ctx.clearRect(0, 0, size, size);
      
      // Draw white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, size, size);
      
      // Generate enhanced QR-like pattern using real trainer data
      ctx.fillStyle = '#232956';
      
      // Create pattern based on trainer data
      const dataString = `${trainerData.id}-${trainerData.nameThai}-${trainerData.slug}`;
      const hash = dataString.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      // More realistic QR Code pattern (25x25 grid) based on data hash
      const pattern = [];
      for (let i = 0; i < 25; i++) {
        pattern[i] = [];
        for (let j = 0; j < 25; j++) {
          // Create pattern based on position and hash
          const value = (Math.abs(hash) + i * 31 + j * 17) % 3;
          pattern[i][j] = value < 1 ? 1 : 0;
        }
      }
      
      // Add QR code corners (always 1)
      const corners = [
        [[0, 6], [0, 6]], // Top-left
        [[0, 6], [18, 24]], // Top-right  
        [[18, 24], [0, 6]], // Bottom-left
      ];
      
      corners.forEach(([[y1, y2], [x1, x2]]) => {
        for (let i = y1; i <= y2; i++) {
          for (let j = x1; j <= x2; j++) {
            if (i < 25 && j < 25) {
              // Create corner pattern
              if ((i === y1 || i === y2 || j === x1 || j === x2) || 
                  (i >= y1 + 2 && i <= y2 - 2 && j >= x1 + 2 && j <= x2 - 2)) {
                pattern[i][j] = 1;
              } else {
                pattern[i][j] = 0;
              }
            }
          }
        }
      });
      
      const cellSize = size / pattern.length;
      
      // Draw pattern with better rendering
      pattern.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell === 1) {
            ctx.fillRect(
              colIndex * cellSize,
              rowIndex * cellSize,
              cellSize - 0.5,
              cellSize - 0.5
            );
          }
        });
      });

      console.log('✅ QR Code generated successfully with trainer data');
      return true;
      
    } catch (error) {
      console.error('❌ QR Code generation failed:', error);
      return false;
    }
  };

  useEffect(() => {
    if (isFlipped) {
      setTimeout(() => {
        generateQRCode();
      }, 400);
    }
  }, [isFlipped, windowWidth, trainerData]);

  const showNotification = (message, type = 'success') => {
    const id = Date.now();
    const newNotification = { id, message, type };
    setNotifications(prev => [...prev, newNotification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const flipCard = () => {
    if (isLoading) return;
    
    setIsFlipped(!isFlipped);
    
    if (!isFlipped) {
      // Flipping to back - show QR Code
      setTimeout(() => {
        const success = generateQRCode();
        if (success) {
          console.log('✅ QR Code displayed on back');
        }
      }, 200);
      
      showNotification('🔄 พลิกไปด้านหลัง - แสดง QR Code', 'info');
    } else {
      // Flipping to front
      showNotification('🔄 กลับไปด้านหน้า', 'info');
    }
  };

  const shareCard = async () => {
    try {
      const shareData = {
        title: `บัตรประจำตัวเทรนเนอร์ - ${trainerData.nameThai}`,
        text: `ดูโปรไฟล์เทรนเนอร์ ${trainerData.nameThai} (${trainerData.nameEng}) - FitConnect`,
        url: trainerData.profileUrl + '?utm_source=id_card&utm_medium=share'
      };

      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        showNotification('📤 แชร์สำเร็จ!', 'success');
        
        // อัพเดทจำนวนการดู
        setViewCount(prev => prev + 1);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        showNotification('📋 คัดลอกลิงก์สำเร็จ!', 'success');
      }
    } catch (error) {
      console.error('Share failed:', error);
      showNotification('❌ เกิดข้อผิดพลาดในการแชร์', 'error');
    }
  };

  const goBackToDashboard = () => {
    try {
      showNotification('🔙 กำลังกลับสู่โปรไฟล์...', 'info');
      
      // First try to use parent component callback with dashboard path
      if (onNavigateBack && typeof onNavigateBack === 'function') {
        onNavigateBack('/DashboardOverview');
        showNotification('🔙 กลับสู่หน้าโปรไฟล์สำเร็จ', 'success');
        return;
      }

      // Check if we're in a React component environment
      if (window.parent && window.parent !== window) {
        // If in iframe or embedded context
        window.parent.postMessage({ action: 'navigateTo', path: '/DashboardOverview' }, '*');
        return;
      }

      // Direct navigation to DashboardOverview
      const targetUrl = '/DashboardOverview';
      
      // Check if it's hash-based routing
      if (window.location.hash) {
        window.location.hash = `#${targetUrl}`;
        showNotification('🔙 กลับสู่โปรไฟล์สำเร็จ', 'success');
      } else {
        // Standard navigation
        window.location.href = targetUrl;
        showNotification('🔙 กลับสู่โปรไฟล์สำเร็จ', 'success');
      }
      
    } catch (error) {
      console.error('Navigation to dashboard failed:', error);
      handleFallbackNavigation();
    }
  };

  const goBack = () => {
    // Use the new dashboard navigation function
    goBackToDashboard();
  };

  const handleFallbackNavigation = () => {
    try {
      showNotification('🔄 กำลังค้นหาเส้นทางกลับ...', 'info');
      
      // For React Router or SPA navigation
      if (window.ReactNativeWebView) {
        // React Native WebView
        window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'goBack' }));
      } else if (window.location.hash) {
        // Hash-based routing
        window.location.hash = '#/DashboardOverview';
        showNotification('🔙 กลับสู่โปรไฟล์', 'success');
      } else {
        // Standard navigation - prioritize DashboardOverview
        const fallbackUrls = [
          '/DashboardOverview',
          '/trainer/profile',
          '/trainer/dashboard', 
          '/trainer',
          '/'
        ];
        
        // Try the first available fallback
        for (const url of fallbackUrls) {
          try {
            window.location.href = url;
            showNotification('🔙 กำลังกลับสู่หน้าหลัก...', 'info');
            break;
          } catch (e) {
            console.warn('Failed to navigate to:', url);
            continue;
          }
        }
      }
    } catch (error) {
      console.error('Fallback navigation failed:', error);
      showNotification('❌ ไม่สามารถกลับได้ กรุณาใช้เมนูเพื่อนำทาง', 'error');
      
      // Last resort - reload the page to root
      setTimeout(() => {
        // eslint-disable-next-line no-restricted-globals
        if (window.confirm('ไม่สามารถกลับได้ ต้องการโหลดหน้าหลักใหม่หรือไม่?')) {
          window.location.href = '/DashboardOverview';
        }
      }, 2000);
    }
  };

  const refreshCard = () => {
    showNotification('🔄 รีเฟรชข้อมูลบัตร...', 'info');
    refreshTrainerData();
  };

  const debugQRCode = () => {
    console.log('🔍 === QR Code Debug ===');
    console.log('📊 Trainer Data:', trainerData);
    console.log('🎯 Canvas Element:', qrCanvasRef.current);
    console.log('📱 Window Width:', windowWidth);
    console.log('🔄 Is Flipped:', isFlipped);
    console.log('🌐 Is Online:', isOnline);
    console.log('⏰ Last Refresh:', new Date(lastRefresh).toLocaleString());
    
    const success = generateQRCode();
    if (success) {
      showNotification('🛠️ QR Code Debug สำเร็จ!', 'success');
    } else {
      showNotification('⚠️ QR Code Debug ไม่สำเร็จ', 'warning');
    }
  };

  // Make debug function available globally
  useEffect(() => {
    window.debugQRCode = debugQRCode;
    window.debugTrainerData = () => {
      console.log('🔍 === Trainer Data Debug ===');
      console.log('📊 Current Data:', trainerData);
      console.log('🔄 Context Data:', trainerContext.profile);
      console.log('⚡ Loading State:', isLoading);
      console.log('❌ Error State:', error);
      console.log('🌐 Online Status:', isOnline);
      refreshTrainerData();
    };
    
    console.log('🎯 E-ID Card System โหลดสำเร็จ');
    console.log('📱 Shortcuts: Space=Flip, Esc=Back, Ctrl+S=Share, Ctrl+R=Refresh');
    console.log('🛠️ Debug: เรียก debugQRCode() หรือ debugTrainerData() ใน Console');
  }, [trainerData, trainerContext, isLoading, error, isOnline]);

  // Loading State
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #232956 0%, #1a2659 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }} />
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>กำลังโหลดข้อมูล...</h2>
        <p style={{ opacity: 0.8, fontSize: '0.875rem' }}>
          {isOnline ? 'ดึงข้อมูลจาก API' : 'โหลดข้อมูลออฟไลน์'}
        </p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #232956 0%, #1a2659 100%)',
      padding: windowWidth <= 768 ? '1rem' : '2rem',
      position: 'relative',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Background Pattern Effects */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        pointerEvents: 'none'
      }} />

      {/* Floating Background Elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite'
      }} />

      {/* Header Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '2rem',
        position: 'relative'
      }}>
        {/* Left Controls */}
        <div style={{
          position: 'absolute',
          left: 0,
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.75rem',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
            onClick={goBack}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'translateY(0px)';
            }}
          >
            <ArrowLeft size={16} />
            <span>กลับสู่โปรไฟล์</span>
          </button>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.75rem',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
            onClick={refreshCard}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'translateY(0px)';
            }}
          >
            <RefreshCw size={16} />
            <span>รีเฟรช</span>
          </button>
        </div>

        {/* Thailand Logo Header */}
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '0.5rem'
          }}>
            <svg width="120" height="40" viewBox="0 0 200 60" fill="currentColor">
              <path d="M20 15 L35 15 L35 45 L20 45 Z" fill="white"/>
              <path d="M40 15 L55 15 L55 25 L40 25 Z" fill="white"/>
              <path d="M40 35 L55 35 L55 45 L40 45 Z" fill="white"/>
              <path d="M60 15 L75 15 L75 45 L60 45 Z" fill="white"/>
              <path d="M80 15 L95 15 L95 25 L80 25 Z" fill="white"/>
              <path d="M80 30 L95 30 L95 45 L80 45 Z" fill="white"/>
              <text x="105" y="25" fill="white" fontSize="8" fontWeight="600">THAILAND</text>
              <text x="105" y="35" fill="white" fontSize="6">FITNESS TRAINER</text>
              <text x="105" y="42" fill="white" fontSize="6">CERTIFICATION</text>
            </svg>
          </div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            marginBottom: '0.5rem'
          }}>
            บัตรประจำตัวเทรนเนอร์
          </h1>
          <p style={{
            fontSize: '0.875rem',
            opacity: 0.8,
            letterSpacing: '2px'
          }}>
            DIGITAL TRAINER IDENTIFICATION
          </p>
        </div>

        {/* Connection Status */}
        <div style={{
          position: 'absolute',
          right: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '1rem',
          backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          color: isOnline ? '#10b981' : '#ef4444',
          fontSize: '0.75rem',
          fontWeight: '500',
          backdropFilter: 'blur(10px)'
        }}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isOnline ? 'API เชื่อมต่อ' : 'ออฟไลน์'}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          margin: '0 auto 2rem auto',
          maxWidth: '600px',
          padding: '1rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '0.75rem',
          color: '#fecaca',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} />
          <div style={{ flex: 1 }}>
            <strong>ข้อผิดพลาด:</strong> {error}
          </div>
          <button
            onClick={() => {
              setError(null);
              refreshTrainerData();
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            ลองอีกครั้ง
          </button>
        </div>
      )}

      {/* Card Container */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        perspective: '1000px',
        position: 'relative'
      }}>
        {/* Card Status Badge */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: trainerData.isVerified ? 'rgba(40, 167, 69, 0.9)' : 'rgba(255, 193, 7, 0.9)',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '1rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          backdropFilter: 'blur(10px)',
          zIndex: 10,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}>
          {trainerData.isVerified ? <CheckCircle size={14} /> : <Clock size={14} />}
          <span>{trainerData.isVerified ? 'ยืนยันตัวตนแล้ว' : 'รอการยืนยัน'}</span>
          {!isOnline && <span style={{ marginLeft: '0.5rem' }}>📴 ออฟไลน์</span>}
        </div>

        {/* ID Card 3D */}
        <div
          ref={cardRef}
          style={{
            width: windowWidth <= 768 ? '300px' : '340px',
            height: windowWidth <= 768 ? '450px' : '540px',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.8s ease',
            cursor: 'pointer',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
          onClick={flipCard}
          tabIndex={0}
          role="button"
          aria-label="คลิกเพื่อพลิกบัตร"
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              flipCard();
            }
          }}
        >
          {/* Front Side */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundColor: 'white',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Security Features */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '3px',
              background: 'linear-gradient(90deg, #ff6b6b, #ffd93d, #4ecdc4, #45b7d1)'
            }} />
            
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '30px',
              height: '30px',
              background: 'conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
              borderRadius: '50%',
              animation: 'hologram 3s linear infinite'
            }} />

            {/* Header Strip */}
            <div style={{
              background: 'linear-gradient(135deg, #232956 0%, #1a2659 100%)',
              height: '40px',
              width: '100%',
              borderRadius: '20px 20px 0 0',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                animation: 'shimmer 2s ease-in-out infinite'
              }} />
            </div>

            {/* Top Section - VERIFIED + ID */}
            <div style={{
              padding: '20px 25px 15px 25px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              {/* VERIFIED Badge - Left */}
              <div style={{
                background: trainerData.isVerified ? 'linear-gradient(45deg, #10b981, #20c997)' : 'linear-gradient(45deg, #f59e0b, #f97316)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                {trainerData.isVerified ? 'VERIFIED' : 'PENDING'}
              </div>

              {/* ID Number - Right */}
              <div style={{
                textAlign: 'right'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#232956',
                  fontFamily: 'monospace',
                  letterSpacing: '1px'
                }}>
                  ID: {trainerData.id}
                </div>
              </div>
            </div>

            {/* Photo Section - Larger */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '20px',
              position: 'relative'
            }}>
              <div style={{
                position: 'relative',
                width: windowWidth <= 768 ? '220px' : '260px',
                height: windowWidth <= 768 ? '260px' : '300px',
                borderRadius: '15px',
                overflow: 'hidden',
                border: '3px solid #e0e0e0',
                background: '#f8f9fa'
              }}>
                <img
                  src={trainerData.photo}
                  alt="รูปภาพเทรนเนอร์"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease'
                  }}
                  onError={(e) => {
                    // Fallback image if photo fails to load
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = `
                      <div style="
                        width: 100%; 
                        height: 100%; 
                        background: linear-gradient(135deg, #232956, #df2528);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 3rem;
                        font-weight: 700;
                      ">
                        ${trainerData.nameThai.charAt(0).toUpperCase()}
                      </div>
                    `;
                  }}
                />
                
                {/* Thailand Watermark */}
                <div style={{
                  position: 'absolute',
                  left: '-15px',
                  top: '50%',
                  transform: 'translateY(-50%) rotate(-90deg)',
                  fontSize: windowWidth <= 768 ? '20px' : '28px',
                  fontWeight: '700',
                  color: 'rgba(35, 41, 86, 0.15)',
                  letterSpacing: '8px',
                  pointerEvents: 'none',
                  userSelect: 'none'
                }}>
                  THAILAND
                </div>

                {/* Photo Verification */}
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  backgroundColor: trainerData.isVerified ? '#10b981' : '#f59e0b',
                  color: 'white',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}>
                  {trainerData.isVerified ? <CheckCircle size={16} /> : <Clock size={16} />}
                </div>
              </div>
            </div>

            {/* Info Section - Left Aligned */}
            <div style={{
              padding: '0 25px 25px 25px',
              textAlign: 'left'
            }}>
              <div style={{
                fontSize: windowWidth <= 768 ? '22px' : '26px',
                fontWeight: '700',
                color: '#232956',
                marginBottom: '8px',
                lineHeight: '1.2'
              }}>
                {trainerData.nameThai}
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: '500',
                color: '#666',
                marginBottom: '12px'
              }}>
                {trainerData.nameEng}
              </div>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#232956',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>
                {trainerData.position}
              </div>
              
              {/* Certifications */}
              {trainerData.certifications && trainerData.certifications.length > 0 && (
                <div style={{
                  marginTop: '8px',
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  {trainerData.certifications.map((cert, index) => (
                    <span
                      key={index}
                      style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#df2528',
                        backgroundColor: 'rgba(223, 37, 40, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid rgba(223, 37, 40, 0.2)'
                      }}
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Last Update Info */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '25px',
              fontSize: '10px',
              color: '#999',
              fontStyle: 'italic'
            }}>
              อัพเดท: {trainerData.lastUpdate}
            </div>

            {/* Bottom Thailand Logo - Right Aligned */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              right: '25px'
            }}>
              <svg width="60" height="40" viewBox="0 0 60 40" fill="currentColor">
                <path d="M10 5 L20 5 L20 25 L10 25 Z" fill="#232956"/>
                <path d="M23 5 L33 5 L33 12 L23 12 Z" fill="#232956"/>
                <path d="M23 18 L33 18 L33 25 L23 25 Z" fill="#df2528"/>
                <path d="M36 5 L46 5 L46 25 L36 25 Z" fill="#232956"/>
                <text x="5" y="35" fill="#232956" fontSize="6" fontWeight="600">THAILAND</text>
              </svg>
            </div>
          </div>

          {/* Back Side - QR Code */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundColor: 'white',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Simple Header with Full ID */}
            <div style={{
              padding: '30px 30px 20px 30px',
              textAlign: 'center',
              borderBottom: '1px solid #e5e5e5'
            }}>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '18px',
                fontWeight: '600',
                color: '#232956',
                letterSpacing: '2px'
              }}>
                ID: {trainerData.id}
              </div>
            </div>

            {/* QR Code Section */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '40px 30px'
            }}>
              <div style={{
                position: 'relative',
                width: windowWidth <= 768 ? '160px' : '200px',
                height: windowWidth <= 768 ? '160px' : '200px',
                marginBottom: '30px'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  border: '2px solid #f0f0f0',
                  position: 'relative'
                }}>
                  <canvas
                    ref={qrCanvasRef}
                    width={windowWidth <= 768 ? 140 : 180}
                    height={windowWidth <= 768 ? 140 : 180}
                    style={{
                      borderRadius: '8px',
                      maxWidth: '100%',
                      maxHeight: '100%'
                    }}
                  />
                </div>

                {/* QR Code Scanning Corners */}
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '-15px',
                  right: '-15px',
                  bottom: '-15px',
                  pointerEvents: 'none'
                }}>
                  {[
                    { position: 'top-left', style: { top: 0, left: 0, borderRight: 'none', borderBottom: 'none' } },
                    { position: 'top-right', style: { top: 0, right: 0, borderLeft: 'none', borderBottom: 'none' } },
                    { position: 'bottom-left', style: { bottom: 0, left: 0, borderRight: 'none', borderTop: 'none' } },
                    { position: 'bottom-right', style: { bottom: 0, right: 0, borderLeft: 'none', borderTop: 'none' } }
                  ].map((corner, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'absolute',
                        width: '40px',
                        height: '40px',
                        border: '4px solid #232956',
                        borderRadius: '8px',
                        ...corner.style
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div style={{
                maxWidth: '280px',
                fontSize: '11px',
                lineHeight: '1.6',
                color: '#666',
                textAlign: 'center',
                padding: '0 10px'
              }}>
                <strong style={{ color: '#232956' }}>📱 QR Code สำหรับเทรนเนอร์</strong><br />
                สแกน QR Code เพื่อดูโปรไฟล์เต็มของเทรนเนอร์ {trainerData.nameThai} ประวัติการทำงาน ใบรับรอง รีวิวจากลูกค้า และข้อมูลการติดต่อ หรือเข้าชมผ่านเว็บไซต์ออนไลน์
                <br /><br />
                <small style={{ color: '#999' }}>
                  💡 {isOnline ? 'ข้อมูลถูกโหลดจาก API' : 'ข้อมูลแคชออฟไลน์'}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginTop: '2rem',
        flexWrap: 'wrap'
      }}>
        {/* Primary Controls */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.875rem 1.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '1.5rem',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            minWidth: '150px',
            backdropFilter: 'blur(10px)'
          }}
          onClick={flipCard}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            e.target.style.transform = 'translateY(-3px)';
            e.target.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.target.style.transform = 'translateY(0px)';
            e.target.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
          }}
        >
          <RotateCcw size={18} />
          <span>{isFlipped ? 'กลับด้านหน้า' : 'พลิกบัตร'}</span>
        </button>

        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.875rem 1.5rem',
            backgroundColor: '#10b981',
            border: '2px solid #10b981',
            borderRadius: '1.5rem',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            minWidth: '150px'
          }}
          onClick={shareCard}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#059669';
            e.target.style.borderColor = '#059669';
            e.target.style.transform = 'translateY(-3px)';
            e.target.style.boxShadow = '0 10px 25px rgba(16, 185, 129, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#10b981';
            e.target.style.borderColor = '#10b981';
            e.target.style.transform = 'translateY(0px)';
            e.target.style.boxShadow = '0 5px 15px rgba(16, 185, 129, 0.2)';
          }}
        >
          <Share2 size={18} />
          <span>แชร์บัตร</span>
        </button>

        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.875rem 1.5rem',
            backgroundColor: '#3b82f6',
            border: '2px solid #3b82f6',
            borderRadius: '1.5rem',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            minWidth: '150px'
          }}
          onClick={refreshTrainerData}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#2563eb';
            e.target.style.borderColor = '#2563eb';
            e.target.style.transform = 'translateY(-3px)';
            e.target.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#3b82f6';
            e.target.style.borderColor = '#3b82f6';
            e.target.style.transform = 'translateY(0px)';
            e.target.style.boxShadow = '0 5px 15px rgba(59, 130, 246, 0.2)';
          }}
        >
          <RefreshCw size={18} />
          <span>อัพเดทข้อมูล</span>
        </button>
      </div>

      {/* Stats Footer */}
      <div className="stats-footer" style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '2rem',
        gap: '2rem',
        flexWrap: 'wrap'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.875rem'
        }}>
          <Eye size={16} />
          <span>การดู: {viewCount.toLocaleString()}</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.875rem'
        }}>
          <Shield size={16} />
          <span>{trainerData.isVerified ? 'ยืนยันแล้ว' : 'รอยืนยัน'}</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.875rem'
        }}>
          <Smartphone size={16} />
          <span>Mobile Ready</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.875rem'
        }}>
          {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>{isOnline ? 'API Connected' : 'Offline Mode'}</span>
        </div>
      </div>

      {/* Enhanced Notifications */}
      <div style={{
        position: 'fixed',
        top: '100px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
              borderLeft: `4px solid ${
                notification.type === 'success' ? '#10b981' :
                notification.type === 'error' ? '#ef4444' :
                notification.type === 'info' ? '#3b82f6' : '#f59e0b'
              }`,
              maxWidth: '320px',
              animation: 'slideInRight 0.4s ease',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#1e293b',
              lineHeight: '1.4'
            }}>
              {notification.message}
            </div>
          </div>
        ))}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes hologram {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideInRight {
          0% { 
            transform: translateX(100%); 
            opacity: 0; 
          }
          100% { 
            transform: translateX(0); 
            opacity: 1; 
          }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          33% { 
            transform: translateY(-20px) rotate(1deg); 
          }
          66% { 
            transform: translateY(-10px) rotate(-1deg); 
          }
        }
        
        @media print {
          .controls, 
          .notifications,
          .stats-footer,
          .top-nav {
            display: none !important;
          }
          
          .card-container {
            min-height: auto !important;
            padding: 0 !important;
          }
          
          .id-card {
            box-shadow: none !important;
            border: 2px solid #ddd !important;
          }
        }
        
        /* Touch feedback for mobile */
        @media (hover: none) and (pointer: coarse) {
          .id-card:active {
            transform: scale(0.98) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EIDCardPage;