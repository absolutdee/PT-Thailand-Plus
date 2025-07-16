import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GymsFitness = () => {
  const navigate = useNavigate();
  const [gyms, setGyms] = useState([]);
  const [filteredGyms, setFilteredGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [amenityFilter, setAmenityFilter] = useState('');
  const [viewType, setViewType] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // API URL - แก้ไข URL ตามที่ใช้งานจริง
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // ฟังก์ชันดึงข้อมูลยิมจากฐานข้อมูล
  const fetchGyms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // เรียก API เพื่อดึงข้อมูลยิม
      const response = await fetch(`${API_BASE_URL}/gyms`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // เพิ่ม Authorization header หากจำเป็น
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // ตรวจสอบโครงสร้างข้อมูลที่ได้รับ
      const gymsData = data.data || data.gyms || data;
      
      setGyms(gymsData);
      setFilteredGyms(gymsData);
      
    } catch (error) {
      console.error('Error fetching gyms:', error);
      setError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      
      // ใช้ข้อมูลตัวอย่างในกรณีที่เชื่อมต่อฐานข้อมูลไม่ได้
      const fallbackData = getFallbackGymsData();
      setGyms(fallbackData);
      setFilteredGyms(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันค้นหายิมด้วยตัวกรอง
  const searchGymsWithFilters = async (filters = {}) => {
    try {
      setLoading(true);
      
      // สร้าง query parameters
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.amenity) queryParams.append('amenity', filters.amenity);
      if (filters.page) queryParams.append('page', filters.page);
      
      const url = `${API_BASE_URL}/gyms/search?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const gymsData = data.data || data.gyms || data;
      
      setFilteredGyms(gymsData);
      
    } catch (error) {
      console.error('Error searching gyms:', error);
      // ใช้การกรองแบบ client-side เป็น fallback
      applyClientSideFilters();
    } finally {
      setLoading(false);
    }
  };

  // ข้อมูลตัวอย่างสำหรับกรณี fallback
  const getFallbackGymsData = () => {
    return [
      {
        id: 1,
        name: 'Fitness First Platinum',
        address: 'CentralWorld ชั้น 7, เขตปทุมวัน กรุงเทพฯ',
        type: 'fitness',
        status: 'open',
        rating: 4.5,
        price: 2890,
        period: 'เดือน',
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop',
        features: ['สระว่ายน้ำ', 'ซาวน่า', 'คลาสกรุ๊ป', 'เทรนเนอร์ส่วนตัว'],
        hours: '06:00 - 22:00',
        phone: '02-123-4567'
      },
      {
        id: 2,
        name: 'Virgin Active',
        address: 'เอ็มสเฟียร์ ชั้น 5, เขตปทุมวัน กรุงเทพฯ',
        type: 'fitness',
        status: 'open',
        rating: 4.7,
        price: 3200,
        period: 'เดือน',
        image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=250&fit=crop',
        features: ['สระว่ายน้ำ', 'สปา', 'โยคะ', 'พิลาทิส'],
        hours: '05:30 - 23:00',
        phone: '02-234-5678'
      },
      {
        id: 3,
        name: 'Anytime Fitness',
        address: 'ถนนสุขุมวิท 31, เขตวัฒนา กรุงเทพฯ',
        type: 'gym',
        status: 'open',
        rating: 4.3,
        price: 1590,
        period: 'เดือน',
        image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&h=250&fit=crop',
        features: ['เปิด 24 ชั่วโมง', 'ที่จอดรถ', 'เทรนเนอร์'],
        hours: '24 ชั่วโมง',
        phone: '02-345-6789'
      },
      {
        id: 4,
        name: 'California WOW',
        address: 'เซ็นทรัลพลาซา แกรนด์ พระราม 9, เขตห้วยขวาง กรุงเทพฯ',
        type: 'fitness',
        status: 'closed',
        rating: 4.1,
        price: 2300,
        period: 'เดือน',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop',
        features: ['สระว่ายน้ำ', 'แอโรบิค', 'ซาวน่า', 'ที่จอดรถ'],
        hours: '06:00 - 22:00',
        phone: '02-456-7890'
      },
      {
        id: 5,
        name: 'True Fitness',
        address: 'เซ็นทรัลเวิลด์ ชั้น 7, เขตปทุมวัน กรุงเทพฯ',
        type: 'fitness',
        status: 'open',
        rating: 4.4,
        price: 2650,
        period: 'เดือน',
        image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=250&fit=crop',
        features: ['คลาสกรุ๊ป', 'เทรนเนอร์', 'ซาวน่า'],
        hours: '06:00 - 22:30',
        phone: '02-567-8901'
      },
      {
        id: 6,
        name: 'CrossFit Bangkok',
        address: 'ถนนเอกมัย เขตวัฒนา กรุงเทพฯ',
        type: 'crossfit',
        status: 'open',
        rating: 4.8,
        price: 3500,
        period: 'เดือน',
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop',
        features: ['ครอสฟิต', 'เทรนเนอร์เฉพาะทาง', 'ที่จอดรถ'],
        hours: '05:30 - 21:30',
        phone: '02-678-9012'
      },
      {
        id: 7,
        name: 'Pure Yoga',
        address: 'เซ็นทรัลชิดลม ชั้น 4, เขตปทุมวัน กรุงเทพฯ',
        type: 'yoga',
        status: 'open',
        rating: 4.6,
        price: 2200,
        period: 'เดือน',
        image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=250&fit=crop',
        features: ['โยคะ', 'พิลาทิส', 'สมาธิ'],
        hours: '06:30 - 21:30',
        phone: '02-789-0123'
      },
      {
        id: 8,
        name: 'Elite Fitness',
        address: 'ถนนรัชดาภิเษก เขตดินแดง กรุงเทพฯ',
        type: 'gym',
        status: 'open',
        rating: 4.2,
        price: 1200,
        period: 'เดือน',
        image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&h=250&fit=crop',
        features: ['ยิมพื้นฐาน', 'ที่จอดรถ', 'ราคาประหยัด'],
        hours: '05:00 - 23:00',
        phone: '02-890-1234'
      }
    ];
  };

  // โหลดข้อมูลครั้งแรก
  useEffect(() => {
    fetchGyms();
  }, []);

  // ใช้สำหรับการกรองแบบ client-side (fallback)
  const applyClientSideFilters = () => {
    let filtered = [...gyms];

    // Text search
    if (searchQuery) {
      filtered = filtered.filter(gym => 
        gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gym.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gym.features.some(feature => feature.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(gym => gym.type === typeFilter);
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(gym => 
        gym.address.toLowerCase().includes(locationFilter)
      );
    }

    // Amenity filter
    if (amenityFilter) {
      const amenityName = getAmenityName(amenityFilter);
      filtered = filtered.filter(gym => 
        gym.features.some(feature => feature.includes(amenityName))
      );
    }

    setFilteredGyms(filtered);
    setCurrentPage(1);
  };

  // เมื่อมีการเปลี่ยนแปลงตัวกรอง
  useEffect(() => {
    // ใช้ server-side search หากพร้อมใช้งาน ไม่เช่นนั้นใช้ client-side
    const filters = {
      search: searchQuery,
      location: locationFilter,
      type: typeFilter,
      amenity: amenityFilter,
      page: currentPage
    };

    // ตรวจสอบว่ามีตัวกรองหรือไม่
    const hasFilters = searchQuery || locationFilter || typeFilter || amenityFilter;
    
    if (hasFilters) {
      // ลองใช้ server-side search ก่อน
      if (process.env.REACT_APP_USE_SERVER_SEARCH === 'true') {
        searchGymsWithFilters(filters);
      } else {
        // ใช้ client-side filtering
        applyClientSideFilters();
      }
    } else {
      // แสดงข้อมูลทั้งหมด
      setFilteredGyms(gyms);
    }
  }, [searchQuery, locationFilter, typeFilter, amenityFilter, gyms]);

  const getAmenityName = (amenity) => {
    const amenities = {
      'pool': 'สระว่ายน้ำ',
      'sauna': 'ซาวน่า',
      'parking': 'ที่จอดรถ',
      '24h': '24 ชั่วโมง',
      'personal': 'เทรนเนอร์',
      'classes': 'คลาส'
    };
    return amenities[amenity] || amenity;
  };

  const handleSearch = () => {
    const filters = {
      search: searchQuery,
      location: locationFilter,
      type: typeFilter,
      amenity: amenityFilter,
      page: 1
    };

    if (process.env.REACT_APP_USE_SERVER_SEARCH === 'true') {
      searchGymsWithFilters(filters);
    } else {
      setLoading(true);
      setTimeout(() => {
        applyClientSideFilters();
        setLoading(false);
      }, 500);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleMarkerClick = (gymId) => {
    console.log('Show gym info on map:', gymId);
    // สามารถเพิ่มการทำงานเพิ่มเติม เช่น แสดง popup บนแผนที่
  };

  // View gym detail - Updated with proper navigation
  const viewGymDetail = (gymId) => {
    // ใช้ React Router navigation
    // navigate(`/gym/${gymId}`);
    navigate(`/gymdetail`);
    
    // หรือหากไม่ใช้ React Router สามารถใช้วิธีอื่นได้:
    // window.location.href = `/gym-detail.html?id=${gymId}`;
    // หรือ window.open(`/gym/${gymId}`, '_blank'); สำหรับเปิดหน้าใหม่
  };

  // Retry function สำหรับกรณีที่เกิดข้อผิดพลาด
  const handleRetry = () => {
    setError(null);
    fetchGyms();
  };

  // Components
  const GymCard = ({ gym }) => {
    const statusClass = gym.status === 'open' ? 'open' : 'closed';
    const statusText = gym.status === 'open' ? 'เปิด' : 'ปิด';
    
    // Handle card click - Updated with better click handling
    const handleCardClick = (e) => {
      // ป้องกันการ click หากต้องการเพิ่มปุ่มหรือ element อื่นในอนาคต
      e.preventDefault();
      viewGymDetail(gym.id);
    };
    
    return (
      <div className="gym-card" onClick={handleCardClick}>
        <div className="gym-image-wrapper">
          <img 
            src={gym.image} 
            alt={gym.name} 
            className="gym-image"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop';
            }}
          />
          <div className={`gym-status ${statusClass}`}>{statusText}</div>
          <div className="gym-rating">
            <i className="fas fa-star"></i>
            {gym.rating}
          </div>
        </div>
        <div className="gym-info">
          <h3 className="gym-name">{gym.name}</h3>
          <div className="gym-address">
            <i className="fas fa-map-marker-alt"></i>
            <span>{gym.address}</span>
          </div>
          <div className="gym-details">
            <div className="detail-row">
              <i className="fas fa-clock detail-icon"></i>
              <span className="detail-text">{gym.hours}</span>
            </div>
            <div className="detail-row">
              <i className="fas fa-phone detail-icon"></i>
              <span className="detail-text">{gym.phone}</span>
            </div>
          </div>
          {/* เพิ่มปุ่มสำหรับข้อมูลเพิ่มเติม */}
          <div className="gym-price">
            <span className="price-amount">฿{gym.price.toLocaleString()}</span>
            <span className="price-period">/{gym.period}</span>
          </div>
        </div>
      </div>
    );
  };

  const SkeletonCard = () => (
    <div className="skeleton-card">
      <div className="skeleton skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton skeleton-line"></div>
        <div className="skeleton skeleton-line medium"></div>
        <div className="skeleton skeleton-line short"></div>
        <div className="skeleton skeleton-line"></div>
      </div>
    </div>
  );

  const NoResults = () => (
    <div className="no-results">
      <i className="fas fa-search"></i>
      <h4>ไม่พบยิมที่ตรงกับเงื่อนไขการค้นหา</h4>
      <p>ลองเปลี่ยนคำค้นหาหรือปรับตัวกรองใหม่อีกครั้ง</p>
    </div>
  );

  const ErrorComponent = () => (
    <div className="error-container" style={{
      textAlign: 'center',
      padding: '4rem 1rem',
      color: 'var(--text-light)',
      gridColumn: '1 / -1'
    }}>
      <i className="fas fa-exclamation-triangle" style={{
        fontSize: '4rem',
        color: 'var(--secondary-color)',
        marginBottom: '1.5rem'
      }}></i>
      <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem', fontWeight: 700 }}>
        เกิดข้อผิดพลาดในการโหลดข้อมูล
      </h4>
      <p style={{ marginBottom: '2rem' }}>{error}</p>
      <button 
        className="btn-primary-custom" 
        onClick={handleRetry}
        style={{
          background: 'var(--secondary-color)',
          border: 'none',
          color: 'white',
          padding: '0.7rem 2.5rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          transition: 'all 0.3s ease',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ลองใหม่อีกครั้ง
      </button>
    </div>
  );

  const MapMarkers = () => {
    const markers = [
      { id: 1, top: '20%', left: '25%' },
      { id: 2, top: '35%', left: '45%' },
      { id: 3, top: '60%', left: '30%' },
      { id: 4, top: '45%', left: '65%' },
      { id: 5, top: '75%', left: '55%' },
      { id: 6, top: '25%', left: '70%' },
      { id: 7, top: '80%', left: '20%' },
      { id: 8, top: '15%', left: '50%' }
    ];

    return (
      <>
        {markers.map(marker => (
          <div
            key={marker.id}
            className="map-marker"
            style={{ top: marker.top, left: marker.left }}
            onClick={() => handleMarkerClick(marker.id)}
          />
        ))}
      </>
    );
  };

  return (
    <div className="gyms-fitness-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        
        :root {
          --primary-color: #232956;
          --secondary-color: #df2528;
          --accent-color: #ff6b6b;
          --text-dark: #1a1a1a;
          --text-light: #666;
          --bg-light: #f8f9fa;
          --white: #ffffff;
          --shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Noto Sans Thai', sans-serif;
          color: var(--text-dark);
          background: var(--bg-light);
        }

        .gyms-fitness-page {
          background: var(--bg-light);
          min-height: 100vh;
          padding: 1.5rem 0 3rem;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 15px;
        }

        .btn-primary-custom {
          background: var(--secondary-color);
          border: none;
          color: white;
          padding: 0.7rem 2.5rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          border-radius: 4px;
        }

        .btn-primary-custom:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(223, 37, 40, 0.3);
        }

        /* Breadcrumb */
        .breadcrumb {
          background: transparent;
          padding: 0;
          margin-bottom: 1rem;
          font-size: 0.9rem;
          display: flex;
          list-style: none;
        }

        .breadcrumb-item {
          display: flex;
          align-items: center;
        }

        .breadcrumb-item + .breadcrumb-item::before {
          content: "›";
          color: var(--text-light);
          margin: 0 0.5rem;
        }

        .breadcrumb-item a {
          color: var(--secondary-color);
          text-decoration: none;
        }

        .breadcrumb-item.active {
          color: var(--text-light);
        }

        /* Page Header */
        .page-header {
          text-align: center;
          margin-bottom: 2rem;
          padding: 2rem 0;
        }

        .page-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--primary-color);
          margin-bottom: 1rem;
        }

        .page-subtitle {
          font-size: 1.1rem;
          color: var(--text-light);
          max-width: 600px;
          margin: 0 auto;
        }

        /* Map Section */
        .map-section {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          margin-bottom: 2rem;
          overflow: hidden;
        }

        .map-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #f0f0f0;
          background: var(--bg-light);
        }

        .map-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--primary-color);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .map-container {
          height: 400px;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .map-placeholder {
          text-align: center;
          color: var(--text-light);
        }

        .map-placeholder i {
          font-size: 4rem;
          margin-bottom: 1rem;
          color: var(--secondary-color);
        }

        .map-placeholder h4 {
          color: var(--primary-color);
          margin-bottom: 0.5rem;
        }

        /* Map Markers */
        .map-marker {
          position: absolute;
          width: 30px;
          height: 30px;
          background: var(--secondary-color);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          cursor: pointer;
          transition: all 0.3s ease;
          border: 3px solid white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }

        .map-marker::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
        }

        .map-marker:hover {
          transform: rotate(-45deg) scale(1.2);
          z-index: 10;
        }

        /* Search & Filter Section */
        .search-filter-section {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          margin-bottom: 2rem;
        }

        .search-wrapper {
          position: relative;
          margin-bottom: 1.5rem;
        }

        .search-input {
          width: 100%;
          padding: 1rem 1.5rem 1rem 4rem;
          border: 2px solid #e0e0e0;
          border-radius: 50px;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          background: var(--bg-light);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--secondary-color);
          box-shadow: 0 0 0 3px rgba(223, 37, 40, 0.1);
          background: white;
        }

        .search-icon {
          position: absolute;
          left: 1.5rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-light);
          font-size: 1.2rem;
        }

        .search-btn {
          position: absolute;
          right: 8px;
          top: 8px;
          bottom: 8px;
          background: var(--secondary-color);
          color: white;
          border: none;
          border-radius: 50px;
          padding: 0 2rem;
          font-weight: 600;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .search-btn:hover {
          background: var(--primary-color);
          transform: translateX(-2px);
        }

        .filters-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--primary-color);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-select {
          width: 100%;
          padding: 0.8rem 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          cursor: pointer;
          background-color: white;
        }

        .filter-select:focus {
          border-color: var(--secondary-color);
          box-shadow: 0 0 0 3px rgba(223, 37, 40, 0.1);
          outline: none;
        }

        /* Results Header */
        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding: 1rem 0;
        }

        .results-count {
          font-size: 1rem;
          color: var(--text-light);
        }

        .results-count strong {
          color: var(--primary-color);
          font-weight: 700;
        }

        .view-toggle {
          display: flex;
          gap: 0.5rem;
        }

        .view-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #e0e0e0;
          background: white;
          color: var(--text-dark);
          border-radius: 8px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .view-btn.active,
        .view-btn:hover {
          background: var(--secondary-color);
          color: white;
          border-color: var(--secondary-color);
        }

        /* Gyms Grid */
        .gyms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
          width: 100%;
        }

        @media (min-width: 1200px) {
          .gyms-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (min-width: 992px) and (max-width: 1199px) {
          .gyms-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 768px) and (max-width: 991px) {
          .gyms-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Gym Card */
        .gym-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
          position: relative;
        }

        .gym-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }

        .gym-image-wrapper {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .gym-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .gym-card:hover .gym-image {
          transform: scale(1.1);
        }

        .gym-status {
          position: absolute;
          top: 15px;
          left: 15px;
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          z-index: 2;
        }

        .gym-status.open {
          background: #4caf50;
          color: white;
        }

        .gym-status.closed {
          background: #f44336;
          color: white;
        }

        .gym-rating {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(255, 255, 255, 0.95);
          color: var(--primary-color);
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.85rem;
          z-index: 2;
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .gym-rating i {
          color: #ffc107;
          margin-right: 0.3rem;
        }

        .gym-info {
          padding: 1.5rem;
        }

        .gym-name {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }

        .gym-address {
          color: var(--text-light);
          font-size: 0.9rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .gym-address i {
          color: var(--secondary-color);
          margin-top: 0.2rem;
        }

        .gym-details {
          margin-bottom: 1rem;
        }

        .detail-row {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .detail-icon {
          width: 20px;
          margin-right: 0.8rem;
          color: var(--secondary-color);
          text-align: center;
        }

        .detail-text {
          color: var(--text-dark);
          font-weight: 500;
        }

        /* Gym Price - เพิ่มส่วนนี้ */
        .gym-price {
          display: flex;
          align-items: baseline;
          gap: 0.3rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #f0f0f0;
        }

        .price-amount {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--secondary-color);
        }

        .price-period {
          font-size: 0.9rem;
          color: var(--text-light);
          font-weight: 500;
        }

        /* Loading Skeleton */
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }

        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .skeleton-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .skeleton-image {
          height: 200px;
        }

        .skeleton-content {
          padding: 1.5rem;
        }

        .skeleton-line {
          height: 16px;
          margin-bottom: 0.8rem;
          border-radius: 4px;
        }

        .skeleton-line.short {
          width: 70%;
        }

        .skeleton-line.medium {
          width: 85%;
        }

        /* Pagination */
        .pagination-wrapper {
          display: flex;
          justify-content: center;
          margin-top: 3rem;
        }

        .pagination {
          display: flex;
          gap: 0.5rem;
          list-style: none;
        }

        .page-item {
          list-style: none;
        }

        .page-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: white;
          color: var(--text-dark);
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
          border: 1px solid #e0e0e0;
          cursor: pointer;
        }

        .page-link:hover {
          background: var(--secondary-color);
          color: white;
          border-color: var(--secondary-color);
        }

        .page-item.active .page-link {
          background: var(--secondary-color);
          color: white;
          border-color: var(--secondary-color);
        }

        /* No Results */
        .no-results {
          text-align: center;
          padding: 4rem 1rem;
          color: var(--text-light);
          grid-column: 1 / -1;
        }

        .no-results i {
          font-size: 4rem;
          color: var(--secondary-color);
          margin-bottom: 1.5rem;
        }

        .no-results h4 {
          color: var(--primary-color);
          margin-bottom: 1rem;
          font-weight: 700;
        }

        /* Grid utilities */
        .row {
          display: flex;
          flex-wrap: wrap;
          margin: 0 -7.5px;
        }

        .col-md-4 {
          flex: 0 0 33.333333%;
          max-width: 33.333333%;
          padding: 0 7.5px;
        }

        .g-3 > * {
          margin-bottom: 1rem;
        }

        .mb-3 { margin-bottom: 1rem; }
        .mb-0 { margin-bottom: 0; }

        /* Responsive */
        @media (max-width: 991px) {
          .page-title {
            font-size: 2rem;
          }

          .search-filter-section {
            padding: 1.5rem;
          }

          .search-input {
            padding: 0.8rem 1rem 0.8rem 3.5rem;
            font-size: 1rem;
          }

          .search-btn {
            padding: 0 1.5rem;
          }

          .results-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .gym-image-wrapper {
            height: 180px;
          }

          .map-container {
            height: 300px;
          }

          .col-md-4 {
            flex: 0 0 100%;
            max-width: 100%;
          }
        }

        @media (max-width: 576px) {
          .page-header {
            padding: 1rem 0;
            margin-bottom: 1.5rem;
          }

          .page-title {
            font-size: 1.8rem;
          }

          .search-filter-section {
            padding: 1rem;
          }

          .gyms-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .gym-info {
            padding: 1rem;
          }

          .map-container {
            height: 250px;
          }
        }
      `}</style>

      <div className="container">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a href="#" style={{ color: 'var(--secondary-color)', textDecoration: 'none' }}>หน้าแรก</a>
            </li>
            <li className="breadcrumb-item active" aria-current="page">ยิม&ฟิตเนส</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">ยิมและฟิตเนสเซ็นเตอร์</h1>
          <p className="page-subtitle">ค้นหายิมและฟิตเนสเซ็นเตอร์ใกล้คุณ พร้อมสิ่งอำนวยความสะดวกครบครันและราคาที่เหมาะสม</p>
        </div>

        {/* Map Section */}
        <div className="map-section">
          <div className="map-header">
            <h2 className="map-title">
              <i className="fas fa-map-marked-alt"></i>
              แผนที่ยิมและฟิตเนส
            </h2>
          </div>
          <div className="map-container">
            <div className="map-placeholder">
              <i className="fas fa-map-marked-alt"></i>
              <h4>แผนที่ยิมและฟิตเนสในกรุงเทพฯ</h4>
              <p>แสดงตำแหน่งยิมทั้งหมดในพื้นที่</p>
            </div>
            <MapMarkers />
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="search-filter-section">
          <div className="search-wrapper">
            <i className="fas fa-search search-icon"></i>
            <input 
              type="text" 
              className="search-input" 
              placeholder="ค้นหายิม ฟิตเนส หรือสถานที่..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
            />
            <button className="search-btn" onClick={handleSearch}>ค้นหา</button>
          </div>
          
          <div className="filters-title">
            <i className="fas fa-filter"></i>
            กรองผลลัพธ์
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <select 
                className="filter-select"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="">พื้นที่ทั้งหมด</option>
                <option value="กรุงเทพ">กรุงเทพฯ</option>
                <option value="นนทบุรี">นนทบุรี</option>
                <option value="ปทุมธานี">ปทุมธานี</option>
                <option value="สมุทรปราการ">สมุทรปราการ</option>
                <option value="เชียงใหม่">เชียงใหม่</option>
                <option value="ภูเก็ต">ภูเก็ต</option>
              </select>
            </div>
            <div className="col-md-4">
              <select 
                className="filter-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">ประเภททั้งหมด</option>
                <option value="gym">ยิมทั่วไป</option>
                <option value="fitness">ฟิตเนสเซ็นเตอร์</option>
                <option value="crossfit">ครอสฟิต</option>
                <option value="yoga">โยคะสตูดิโอ</option>
                <option value="pilates">พิลาทิส</option>
                <option value="boxing">มวยไทย/มวยสากล</option>
              </select>
            </div>
            <div className="col-md-4">
              <select 
                className="filter-select"
                value={amenityFilter}
                onChange={(e) => setAmenityFilter(e.target.value)}
              >
                <option value="">สิ่งอำนวยความสะดวก</option>
                <option value="pool">สระว่ายน้ำ</option>
                <option value="sauna">ซาวน่า</option>
                <option value="parking">ที่จอดรถ</option>
                <option value="24h">เปิด 24 ชั่วโมง</option>
                <option value="personal">เทรนเนอร์ส่วนตัว</option>
                <option value="classes">คลาสกรุ๊ป</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="results-header">
          <div className="results-count">
            พบ <strong>{filteredGyms.length}</strong> ยิมและฟิตเนส
          </div>
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewType === 'grid' ? 'active' : ''}`}
              onClick={() => setViewType('grid')}
            >
              <i className="fas fa-th-large"></i> ตาราง
            </button>
            <button 
              className={`view-btn ${viewType === 'list' ? 'active' : ''}`}
              onClick={() => setViewType('list')}
            >
              <i className="fas fa-list"></i> รายการ
            </button>
          </div>
        </div>

        {/* Gyms Grid */}
        {loading ? (
          <div className="gyms-grid">
            {[...Array(8)].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="gyms-grid">
            <ErrorComponent />
          </div>
        ) : filteredGyms.length === 0 ? (
          <div className="gyms-grid">
            <NoResults />
          </div>
        ) : (
          <div className="gyms-grid">
            {filteredGyms.map(gym => (
              <GymCard key={gym.id} gym={gym} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && filteredGyms.length > 0 && (
          <div className="pagination-wrapper">
            <ul className="pagination">
              <li className="page-item">
                <button className="page-link" aria-label="Previous">
                  <i className="fas fa-chevron-left"></i>
                </button>
              </li>
              <li className="page-item active">
                <button className="page-link">1</button>
              </li>
              <li className="page-item">
                <button className="page-link">2</button>
              </li>
              <li className="page-item">
                <button className="page-link">3</button>
              </li>
              <li className="page-item">
                <button className="page-link">4</button>
              </li>
              <li className="page-item">
                <button className="page-link">5</button>
              </li>
              <li className="page-item">
                <button className="page-link">6</button>
              </li>
              <li className="page-item">
                <button className="page-link" aria-label="Next">
                  <i className="fas fa-chevron-right"></i>
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default GymsFitness;