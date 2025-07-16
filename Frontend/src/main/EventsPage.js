import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EventsPage = () => {
  const navigate = useNavigate();
  
  // Data States
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [eventsPerPage] = useState(9);
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState(null);

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load events when filters or pagination changes
  useEffect(() => {
    if (!loading) { // Only filter after initial load
      loadEvents();
    }
  }, [currentPage, categoryFilter, locationFilter, timeFilter, sortBy]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!loading) {
        setCurrentPage(1);
        loadEvents();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // ฟังก์ชันโหลดข้อมูลเริ่มต้น
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load events, categories, and locations in parallel
      const [eventsRes, categoriesRes, locationsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/events?page=1&limit=${eventsPerPage}`),
        fetch(`${API_BASE_URL}/events/categories`),
        fetch(`${API_BASE_URL}/events/locations`)
      ]);

      // Handle events
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.data || []);
        setFilteredEvents(eventsData.data || []);
        setTotalPages(eventsData.meta?.last_page || 1);
        setTotalEvents(eventsData.meta?.total || 0);
      } else {
        const defaultEvents = getDefaultEvents();
        setEvents(defaultEvents);
        setFilteredEvents(defaultEvents);
        setTotalPages(Math.ceil(defaultEvents.length / eventsPerPage));
        setTotalEvents(defaultEvents.length);
      }

      // Handle categories
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.data || getDefaultCategories());
      } else {
        setCategories(getDefaultCategories());
      }

      // Handle locations
      if (locationsRes.ok) {
        const locationsData = await locationsRes.json();
        setLocations(locationsData.data || getDefaultLocations());
      } else {
        setLocations(getDefaultLocations());
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      
      // Use fallback data
      const defaultEvents = getDefaultEvents();
      setEvents(defaultEvents);
      setFilteredEvents(defaultEvents);
      setCategories(getDefaultCategories());
      setLocations(getDefaultLocations());
      setTotalPages(Math.ceil(defaultEvents.length / eventsPerPage));
      setTotalEvents(defaultEvents.length);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันโหลดอีเว้นท์ตามเงื่อนไข
  const loadEvents = async () => {
    try {
      setIsFiltering(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: eventsPerPage.toString()
      });

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      if (categoryFilter) {
        params.append('category', categoryFilter);
      }

      if (locationFilter) {
        params.append('location', locationFilter);
      }

      if (timeFilter) {
        params.append('time_filter', timeFilter);
      }

      if (sortBy) {
        params.append('sort', sortBy);
      }

      const response = await fetch(`${API_BASE_URL}/events?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setFilteredEvents(data.data || []);
        setTotalPages(data.meta?.last_page || 1);
        setTotalEvents(data.meta?.total || 0);
      } else {
        throw new Error('ไม่สามารถโหลดอีเว้นท์ได้');
      }

    } catch (error) {
      console.error('Error loading events:', error);
      setError(error.message || 'เกิดข้อผิดพลาดในการโหลดอีเว้นท์');
    } finally {
      setIsFiltering(false);
    }
  };

  // ฟังก์ชันติดตามการดูอีเว้นท์
  const trackEventView = async (eventId) => {
    try {
      await fetch(`${API_BASE_URL}/events/${eventId}/view`, {
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

  // Default events (fallback)
  const getDefaultEvents = () => [
    {
      id: 1,
      title: "Marathon Training Workshop",
      description: "เวิร์กช็อปการฝึกซ้อมมาราธอนสำหรับผู้เริ่มต้น เรียนรู้เทคนิคการวิ่ง การวางแผนการฝึกซ้อม และการป้องกันการบาดเจ็บ",
      featured_image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
      event_date: "2024-12-25",
      start_time: "09:00",
      end_time: "16:00",
      location: "สวนลุมพินี, กรุงเทพฯ",
      price: 0,
      price_text: "ฟรี",
      category: "workshop",
      category_name: "เวิร์กช็อป",
      organizer: "Bangkok Runners Club",
      is_featured: false
    },
    {
      id: 2,
      title: "Yoga Retreat Weekend",
      description: "เข้าค่ายโยคะสุดสัปดาห์ที่เขาใหญ่ ผ่อนคลายร่างกายและจิตใจ พร้อมกิจกรรมสมาธิและการนวดแผนไทย",
      featured_image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop",
      event_date: "2024-12-28",
      start_time: "09:00",
      end_time: "17:00",
      location: "เขาใหญ่, นครราชสีมา",
      price: 3500,
      price_text: "3,500 บาท",
      category: "workshop",
      category_name: "เวิร์กช็อป",
      organizer: "Peaceful Mind Studio",
      is_featured: true
    },
    {
      id: 3,
      title: "CrossFit Competition 2024",
      description: "การแข่งขันครอสฟิตระดับประเทศ สำหรับนักกีฬาทุกระดับ แข่งขันในหมวดต่างๆ พร้อมของรางวัลมูลค่ารวมกว่า 100,000 บาท",
      featured_image: "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?w=400&h=300&fit=crop",
      event_date: "2025-01-05",
      start_time: "08:00",
      end_time: "18:00",
      location: "Impact Arena, เมืองทองธานี",
      price: 1200,
      price_text: "1,200 บาท",
      category: "competition",
      category_name: "การแข่งขัน",
      organizer: "CrossFit Thailand",
      is_featured: true
    }
  ];

  // Default categories (fallback)
  const getDefaultCategories = () => [
    { value: 'workshop', label: 'เวิร์กช็อป' },
    { value: 'competition', label: 'การแข่งขัน' },
    { value: 'training', label: 'การฝึกอบรม' },
    { value: 'seminar', label: 'สัมมนา' },
    { value: 'outdoor', label: 'กิจกรรมกลางแจ้ง' }
  ];

  // Default locations (fallback)
  const getDefaultLocations = () => [
    { value: 'bangkok', label: 'กรุงเทพฯ' },
    { value: 'nonthaburi', label: 'นนทบุรี' },
    { value: 'pathumthani', label: 'ปทุมธานี' },
    { value: 'samutprakan', label: 'สมุทรปราการ' },
    { value: 'chiangmai', label: 'เชียงใหม่' },
    { value: 'phuket', label: 'ภูเก็ต' }
  ];

  // Get Category Name in Thai
  const getCategoryName = (category) => {
    const categories = {
      'workshop': 'เวิร์กช็อป',
      'competition': 'การแข่งขัน',
      'training': 'การฝึกอบรม',
      'seminar': 'สัมมนา',
      'outdoor': 'กิจกรรมกลางแจ้ง'
    };
    return categories[category] || category;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format time range
  const formatTimeRange = (startTime, endTime) => {
    if (!startTime && !endTime) return 'เต็มวัน';
    if (startTime === endTime) return startTime;
    return `${startTime} - ${endTime}`;
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    loadEvents();
  };

  // Handle sort
  const handleSort = (sortValue) => {
    setSortBy(sortValue);
    setCurrentPage(1);
  };

  // View event detail
  const viewEventDetail = async (eventId) => {
    // Track view count
    await trackEventView(eventId);
    
    // Navigate to event detail
    navigate(`/eventdetail/${eventId}`);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Enter key search
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Retry function
  const retryLoad = () => {
    setError(null);
    loadInitialData();
  };

  // Event Card Component
  const EventCard = ({ event }) => {
    const handleCardClick = (e) => {
      if (e.target.closest('.event-btn')) {
        return;
      }
      viewEventDetail(event.id);
    };

    const handleButtonClick = (e) => {
      e.stopPropagation();
      viewEventDetail(event.id);
    };

    return (
      <div 
        className="event-card" 
        onClick={handleCardClick}
        style={{ cursor: 'pointer' }}
      >
        <div className="event-image-wrapper">
          <img 
            src={event.featured_image || event.image} 
            alt={event.title} 
            className="event-image" 
          />
          <div className="event-date-badge">
            {formatDate(event.event_date || event.date)}
          </div>
          <div className="event-category">
            {event.category_name || getCategoryName(event.category)}
          </div>
        </div>
        <div className="event-info">
          <h3 className="event-title">{event.title}</h3>
          <p className="event-description">{event.description}</p>
          <div className="event-details">
            <div className="event-detail-row">
              <i className="fas fa-clock event-detail-icon"></i>
              <span className="event-detail-text">
                {formatTimeRange(event.start_time, event.end_time) || event.time}
              </span>
            </div>
            <div className="event-detail-row">
              <i className="fas fa-map-marker-alt event-detail-icon"></i>
              <span className="event-detail-text">{event.location}</span>
            </div>
            <div className="event-detail-row">
              <i className="fas fa-users event-detail-icon"></i>
              <span className="event-detail-text">{event.organizer}</span>
            </div>
            {(event.price_text || event.price !== undefined) && (
              <div className="event-detail-row">
                <i className="fas fa-ticket-alt event-detail-icon"></i>
                <span className="event-detail-text">
                  {event.price_text || (event.price === 0 ? 'ฟรี' : `${event.price.toLocaleString()} บาท`)}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="event-footer">
          <button 
            className="event-btn"
            onClick={handleButtonClick}
          >
            ดูรายละเอียด
          </button>
        </div>
      </div>
    );
  };

  // Skeleton Card Component
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

  // No Results Component
  const NoResults = () => (
    <div className="no-results" style={{ gridColumn: '1 / -1' }}>
      <i className="fas fa-calendar-times"></i>
      <h4>ไม่พบอีเว้นท์ที่ตรงกับเงื่อนไขการค้นหา</h4>
      <p>ลองเปลี่ยนคำค้นหาหรือปรับตัวกรองใหม่อีกครั้ง</p>
      <button 
        className="clear-filters-btn"
        onClick={() => {
          setSearchQuery('');
          setCategoryFilter('');
          setLocationFilter('');
          setTimeFilter('');
          setCurrentPage(1);
        }}
      >
        ล้างตัวกรองทั้งหมด
      </button>
    </div>
  );

  // Error Component
  const ErrorMessage = () => (
    <div className="error-container">
      <div className="error-icon">
        <i className="fas fa-exclamation-triangle"></i>
      </div>
      <h3>เกิดข้อผิดพลาด</h3>
      <p>{error}</p>
      <button className="retry-btn" onClick={retryLoad}>
        <i className="fas fa-redo"></i>
        ลองใหม่
      </button>
    </div>
  );

  // Pagination component
  const Pagination = () => {
    const getPageNumbers = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); 
           i <= Math.min(totalPages - 1, currentPage + delta); 
           i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    if (totalPages <= 1) return null;

    return (
      <div className="pagination-wrapper">
        <ul className="pagination">
          <li className="page-item">
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
          </li>
          
          {getPageNumbers().map((page, index) => (
            <li key={index} className={`page-item ${currentPage === page ? 'active' : ''}`}>
              {page === '...' ? (
                <span className="page-dots">...</span>
              ) : (
                <button
                  className="page-link"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              )}
            </li>
          ))}
          
          <li className="page-item">
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </li>
        </ul>
        
        <div className="pagination-info">
          แสดง {((currentPage - 1) * eventsPerPage) + 1}-{Math.min(currentPage * eventsPerPage, totalEvents)} 
          จาก {totalEvents} อีเว้นท์
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            text-align: center;
          }

          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #df2528;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .loading-text {
            color: #666;
            font-size: 1.1rem;
          }
        `}</style>
        <main className="main-content">
          <div className="container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">กำลังโหลดอีเว้นท์...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Error state
  if (error && !events.length) {
    return (
      <>
        <style jsx>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            text-align: center;
            color: #666;
          }

          .error-icon {
            font-size: 4rem;
            color: #df2528;
            margin-bottom: 1rem;
          }

          .retry-btn {
            margin-top: 1rem;
            padding: 0.75rem 1.5rem;
            background: #df2528;
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
          }

          .retry-btn:hover {
            background: #232956;
          }
        `}</style>
        <main className="main-content">
          <div className="container">
            <ErrorMessage />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <style jsx>{`
        /* Google Fonts Import */
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

        /* Breadcrumb */
        .breadcrumb {
          background: transparent;
          padding: 0;
          margin-bottom: 1rem;
          font-size: 0.9rem;
          display: flex;
          list-style: none;
          flex-wrap: wrap;
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

        /* Main Content */
        .main-content {
          padding: 1.5rem 0 3rem;
          margin: 0 auto;
          min-height: 100vh;
          background: var(--bg-light);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 15px;
        }

        /* Page Header */
        .page-header {
          text-align: center;
          margin-bottom: 3rem;
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

        /* Search Section */
        .search-section {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          margin-bottom: 2rem;
        }

        .search-wrapper {
          position: relative;
          max-width: 800px;
          margin: 0 auto;
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

        /* Filter Section */
        .filter-section {
          background: white;
          padding: 1.5rem 2rem;
          border-radius: 16px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          margin-bottom: 2rem;
        }

        .filter-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--primary-color);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
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

        /* Events Grid */
        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
          position: relative;
        }

        .events-grid.filtering {
          opacity: 0.6;
          pointer-events: none;
        }

        @media (min-width: 1200px) {
          .events-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 768px) and (max-width: 1199px) {
          .events-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Event Card */
        .event-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
          position: relative;
        }

        .event-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }

        .event-image-wrapper {
          position: relative;
          height: 250px;
          overflow: hidden;
        }

        .event-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .event-card:hover .event-image {
          transform: scale(1.1);
        }

        .event-date-badge {
          position: absolute;
          top: 15px;
          left: 15px;
          background: var(--secondary-color);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.85rem;
          z-index: 2;
          box-shadow: 0 2px 10px rgba(223, 37, 40, 0.3);
        }

        .event-category {
          position: absolute;
          bottom: 15px;
          left: 15px;
          background: rgba(35, 41, 86, 0.9);
          color: white;
          padding: 0.3rem 0.8rem;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 500;
          z-index: 2;
        }

        .event-info {
          padding: 1.5rem;
        }

        .event-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 0.8rem;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .event-description {
          color: var(--text-light);
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .event-details {
          margin-bottom: 1.5rem;
        }

        .event-detail-row {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .event-detail-icon {
          width: 20px;
          margin-right: 0.8rem;
          color: var(--secondary-color);
          text-align: center;
        }

        .event-detail-text {
          color: var(--text-dark);
          font-weight: 500;
        }

        .event-footer {
          padding: 0 1.5rem 1.5rem;
        }

        .event-btn {
          width: 100%;
          background: linear-gradient(135deg, var(--secondary-color), var(--accent-color));
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .event-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(223, 37, 40, 0.3);
          color: white;
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

        .sort-dropdown select {
          padding: 0.5rem 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          color: var(--text-dark);
          cursor: pointer;
        }

        /* Pagination */
        .pagination-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
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

        .page-link:hover:not(:disabled) {
          background: var(--secondary-color);
          color: white;
          border-color: var(--secondary-color);
        }

        .page-link:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-item.active .page-link {
          background: var(--secondary-color);
          color: white;
          border-color: var(--secondary-color);
        }

        .page-dots {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          color: var(--text-light);
        }

        .pagination-info {
          font-size: 0.9rem;
          color: var(--text-light);
          text-align: center;
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
          height: 250px;
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

        /* No Results */
        .no-results {
          text-align: center;
          padding: 4rem 1rem;
          color: var(--text-light);
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

        .no-results p {
          font-size: 1.1rem;
          margin-bottom: 2rem;
        }

        .clear-filters-btn {
          padding: 0.75rem 1.5rem;
          background: var(--secondary-color);
          color: white;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .clear-filters-btn:hover {
          background: var(--primary-color);
        }

        /* Error States */
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
          color: #666;
        }

        .error-icon {
          font-size: 4rem;
          color: #df2528;
          margin-bottom: 1rem;
        }

        .retry-btn {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: #df2528;
          color: white;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .retry-btn:hover {
          background: #232956;
        }

        /* Responsive */
        @media (max-width: 991px) {
          .page-title {
            font-size: 2rem;
          }

          .search-section {
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

          .event-image-wrapper {
            height: 200px;
          }

          .events-grid {
            gap: 1.5rem;
          }
        }

        @media (max-width: 576px) {
          .page-header {
            padding: 1rem 0;
            margin-bottom: 2rem;
          }

          .page-title {
            font-size: 1.8rem;
          }

          .search-section {
            padding: 1rem;
          }

          .filter-section {
            padding: 1rem;
          }

          .filter-row {
            grid-template-columns: 1fr;
          }

          .events-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .event-info {
            padding: 1rem;
          }

          .event-footer {
            padding: 0 1rem 1rem;
          }
        }
      `}</style>

      <main className="main-content">
        <div className="container">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="mb-3">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/">หน้าแรก</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                อีเว้นท์
              </li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="page-header">
            <h1 className="page-title">อีเว้นท์ฟิตเนสและสุขภาพ</h1>
            <p className="page-subtitle">
              ค้นพบอีเว้นท์ที่น่าสนใจ เวิร์กช็อป และกิจกรรมฟิตเนสรอบตัวคุณ เพื่อสุขภาพที่ดีและการเรียนรู้ใหม่ๆ
            </p>
          </div>

          {/* Search Section */}
          <div className="search-section">
            <div className="search-wrapper">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                className="search-input"
                placeholder="ค้นหาอีเว้นท์ เวิร์กช็อป หรือกิจกรรมที่สนใจ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className="search-btn" onClick={handleSearch}>
                ค้นหา
              </button>
            </div>
          </div>

          {/* Filter Section */}
          <div className="filter-section">
            <div className="filter-title">
              <i className="fas fa-filter"></i>
              กรองผลลัพธ์
            </div>
            <div className="filter-row">
              <select
                className="filter-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">หมวดหมู่ทั้งหมด</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <select
                className="filter-select"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="">สถานที่ทั้งหมด</option>
                {locations.map((location) => (
                  <option key={location.value} value={location.value}>
                    {location.label}
                  </option>
                ))}
              </select>
              <select
                className="filter-select"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
              >
                <option value="">เวลาทั้งหมด</option>
                <option value="today">วันนี้</option>
                <option value="tomorrow">พรุ่งนี้</option>
                <option value="this-week">สัปดาห์นี้</option>
                <option value="this-month">เดือนนี้</option>
                <option value="next-month">เดือนหน้า</option>
              </select>
            </div>
          </div>

          {/* Results Header */}
          <div className="results-header">
            <div className="results-count">
              พบ <strong>{totalEvents}</strong> อีเว้นท์
            </div>
            <div className="sort-dropdown">
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
              >
                <option value="date">เรียงตาม: วันที่ใกล้ที่สุด</option>
                <option value="popularity">ความนิยม</option>
                <option value="price-low">ราคาต่ำสุด</option>
                <option value="price-high">ราคาสูงสุด</option>
                <option value="name">ชื่ออีเว้นท์</option>
              </select>
            </div>
          </div>

          {/* Events Grid */}
          <div className={`events-grid ${isFiltering ? 'filtering' : ''}`}>
            {isFiltering
              ? Array(6).fill().map((_, index) => <SkeletonCard key={index} />)
              : filteredEvents.length === 0
              ? <NoResults />
              : filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
            }
          </div>

          {/* Pagination */}
          {filteredEvents.length > 0 && (
            <Pagination />
          )}
        </div>
      </main>
    </>
  );
};

export default EventsPage;