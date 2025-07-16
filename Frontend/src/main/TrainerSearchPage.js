import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../utils/axios';

const SearchTrainers = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [trainers, setTrainers] = useState([]);
  const [filteredTrainers, setFilteredTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [experienceFilter, setExperienceFilter] = useState(searchParams.get('experience') || '');
  const [genderFilter, setGenderFilter] = useState(searchParams.get('gender') || '');
  const [expertiseFilter, setExpertiseFilter] = useState(
    searchParams.get('expertise') ? searchParams.get('expertise').split(',') : []
  );
  const [activityFilter, setActivityFilter] = useState(
    searchParams.get('activity') ? searchParams.get('activity').split(',') : []
  );
  const [minPrice, setMinPrice] = useState(parseInt(searchParams.get('minPrice')) || 500);
  const [maxPrice, setMaxPrice] = useState(parseInt(searchParams.get('maxPrice')) || 3000);
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'recommended');
  const [expertiseDropdown, setExpertiseDropdown] = useState(false);
  const [activityDropdown, setActivityDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [itemsPerPage] = useState(20);

  // เพิ่ม state สำหรับ locations และ options ที่ดึงจาก API
  const [locations, setLocations] = useState([]);
  const [expertiseOptions, setExpertiseOptions] = useState([]);
  const [activityOptions, setActivityOptions] = useState([]);

  // ✅ แก้ไข: Fetch initial data และ filter options
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ แก้ไข: เปลี่ยน endpoint URLs และจัดการ parallel requests
        const filterRequests = await Promise.allSettled([
          axiosInstance.get('/api/filters/locations'),
          axiosInstance.get('/api/filters/expertise'),
          axiosInstance.get('/api/filters/activities')
        ]);

        // ✅ แก้ไข: จัดการ response จาก Promise.allSettled
        const [locationsResult, expertiseResult, activitiesResult] = filterRequests;

        // Process locations
        if (locationsResult.status === 'fulfilled') {
          const locationData = locationsResult.value.data;
          setLocations(Array.isArray(locationData) ? locationData : []);
        } else {
          console.warn('Failed to fetch locations:', locationsResult.reason);
          setLocations([]);
        }

        // Process expertise options
        if (expertiseResult.status === 'fulfilled') {
          const expertiseData = expertiseResult.value.data;
          setExpertiseOptions(
            Array.isArray(expertiseData) 
              ? expertiseData.map(item => ({
                  value: item.id || item.value || item.name || item,
                  label: item.name || item.label || item
                }))
              : []
          );
        } else {
          console.warn('Failed to fetch expertise options:', expertiseResult.reason);
          setExpertiseOptions([]);
        }

        // Process activity options
        if (activitiesResult.status === 'fulfilled') {
          const activityData = activitiesResult.value.data;
          setActivityOptions(
            Array.isArray(activityData) 
              ? activityData.map(item => ({
                  value: item.id || item.value || item.name || item,
                  label: item.name || item.label || item
                }))
              : []
          );
        } else {
          console.warn('Failed to fetch activity options:', activitiesResult.reason);
          setActivityOptions([]);
        }

      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('ไม่สามารถโหลดข้อมูลเริ่มต้นได้');
        
        // ตั้งค่า default options เมื่อเกิด error
        setLocations([]);
        setExpertiseOptions([]);
        setActivityOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch trainers data เมื่อ filters เปลี่ยน
  useEffect(() => {
    fetchTrainers();
  }, [searchInput, locationFilter, experienceFilter, genderFilter, expertiseFilter, activityFilter, minPrice, maxPrice, sortBy, currentPage]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchInput) params.set('search', searchInput);
    if (locationFilter) params.set('location', locationFilter);
    if (experienceFilter) params.set('experience', experienceFilter);
    if (genderFilter) params.set('gender', genderFilter);
    if (expertiseFilter.length > 0) params.set('expertise', expertiseFilter.join(','));
    if (activityFilter.length > 0) params.set('activity', activityFilter.join(','));
    if (minPrice !== 500) params.set('minPrice', minPrice.toString());
    if (maxPrice !== 3000) params.set('maxPrice', maxPrice.toString());
    if (sortBy !== 'recommended') params.set('sortBy', sortBy);
    if (currentPage !== 1) params.set('page', currentPage.toString());

    setSearchParams(params);
  }, [searchInput, locationFilter, experienceFilter, genderFilter, expertiseFilter, activityFilter, minPrice, maxPrice, sortBy, currentPage, setSearchParams]);

  // ✅ แก้ไข: fetchTrainers function
  const fetchTrainers = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ แก้ไข: สร้าง query parameters
      const queryParams = new URLSearchParams();
      
      if (searchInput && searchInput.trim()) {
        queryParams.append('q', searchInput.trim());
      }
      if (locationFilter) {
        queryParams.append('location', locationFilter);
      }
      if (experienceFilter) {
        queryParams.append('experience', experienceFilter);
      }
      if (genderFilter) {
        queryParams.append('gender', genderFilter);
      }
      if (expertiseFilter.length > 0) {
        queryParams.append('expertise', expertiseFilter.join(','));
      }
      if (activityFilter.length > 0) {
        queryParams.append('activities', activityFilter.join(','));
      }
      if (minPrice > 0) {
        queryParams.append('min_price', minPrice.toString());
      }
      if (maxPrice > 0) {
        queryParams.append('max_price', maxPrice.toString());
      }
      if (sortBy) {
        queryParams.append('sort', sortBy);
      }
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', itemsPerPage.toString());

      // ✅ แก้ไข: เรียก API endpoint ที่ถูกต้อง
      const response = await axiosInstance.get(`/api/trainers?${queryParams.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      });

      // ✅ แก้ไข: จัดการ response structure
      if (response.data && response.status === 200) {
        const data = response.data;
        
        // Handle different response structures
        const trainersData = data.trainers || data.data || data.results || data;
        const pagination = data.pagination || data.meta || {};
        
        if (Array.isArray(trainersData)) {
          setTrainers(trainersData);
          setFilteredTrainers(trainersData);
          setTotalResults(pagination.total || pagination.totalItems || trainersData.length);
          setTotalPages(pagination.totalPages || pagination.pageCount || Math.ceil(trainersData.length / itemsPerPage));
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error('Invalid response');
      }

    } catch (err) {
      console.error('Error fetching trainers:', err);
      
      // ✅ แก้ไข: จัดการ error cases
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const message = err.response.data?.message || err.response.data?.error;
        
        switch (status) {
          case 400:
            setError('คำขอไม่ถูกต้อง กรุณาตรวจสอบข้อมูลการค้นหา');
            break;
          case 401:
            setError('กรุณาเข้าสู่ระบบก่อนค้นหา');
            break;
          case 403:
            setError('ไม่มีสิทธิ์เข้าถึงข้อมูล');
            break;
          case 404:
            // No trainers found - not an error
            setTrainers([]);
            setFilteredTrainers([]);
            setTotalResults(0);
            setTotalPages(1);
            setError(null);
            return;
          case 429:
            setError('มีการร้องขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่');
            break;
          case 500:
            setError('เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่อีกครั้งในภายหลัง');
            break;
          default:
            setError(message || `เกิดข้อผิดพลาด (${status})`);
        }
      } else if (err.request) {
        // Network error
        setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      } else {
        // Other error
        setError('เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง');
      }
      
      // Reset data on error
      setTrainers([]);
      setFilteredTrainers([]);
      setTotalResults(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchTrainers();
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setLocationFilter('');
    setExperienceFilter('');
    setGenderFilter('');
    setExpertiseFilter([]);
    setActivityFilter([]);
    setMinPrice(500);
    setMaxPrice(3000);
    setSortBy('recommended');
    setCurrentPage(1);
  };

  const handleExpertiseChange = (value) => {
    setExpertiseFilter(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const handleActivityChange = (value) => {
    setActivityFilter(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  // ✅ แก้ไข: handleTrainerClick function
  const handleTrainerClick = async (trainerId) => {
    if (!trainerId) return;

    try {
      // บันทึกการคลิกใน analytics (optional) - ไม่ block การ navigate
      axiosInstance.post(`/api/trainers/${trainerId}/view`, {
        timestamp: new Date().toISOString(),
        source: 'search_page',
        searchParams: {
          search: searchInput,
          location: locationFilter,
          page: currentPage
        }
      }, {
        timeout: 5000 // Short timeout for analytics
      }).catch(err => {
        console.warn('Failed to record trainer view:', err);
      });
    } catch (err) {
      console.warn('Error recording trainer view:', err);
    }

    // Navigate ไปหน้า trainer detail
    navigate(`/trainer/${trainerId}`);
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPaginationItems = () => {
    const items = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      items.push(1);
      
      if (currentPage > 4) {
        items.push('...');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        items.push(i);
      }
      
      if (currentPage < totalPages - 3) {
        items.push('...');
      }
      
      items.push(totalPages);
    }
    
    return items;
  };

  const getPriceTrackStyle = () => {
    const minPercent = (minPrice / 5000) * 100;
    const maxPercent = (maxPrice / 5000) * 100;
    return {
      left: `${minPercent}%`,
      width: `${maxPercent - minPercent}%`
    };
  };

  // ✅ แก้ไข: TrainerCard component - รองรับ response structure หลากหลาย
  const TrainerCard = ({ trainer }) => {
    const trainerId = trainer.id || trainer._id || trainer.trainer_id;
    const trainerName = trainer.full_name || trainer.fullName || trainer.name || trainer.first_name + ' ' + trainer.last_name || 'ไม่ระบุชื่อ';
    const trainerImage = trainer.profile_picture || trainer.profilePicture || trainer.image || trainer.avatar || trainer.photo;
    const trainerRating = trainer.rating || trainer.average_rating || trainer.averageRating || trainer.score || 0;
    const trainerLocation = trainer.service_areas?.[0] || trainer.serviceAreas?.[0] || trainer.location || trainer.city || trainer.area || 'ไม่ระบุ';
    const trainerExperience = trainer.experience || trainer.years_of_experience || trainer.yearsOfExperience || trainer.experience_years || 0;
    const trainerSpecialties = trainer.specialties || trainer.expertise || trainer.skills || trainer.categories || [];
    const trainerPrice = trainer.hourly_rate || trainer.hourlyRate || trainer.price || trainer.price_per_hour || trainer.pricePerHour || trainer.rate || 0;

    return (
      <div className="trainer-card-search" onClick={() => handleTrainerClick(trainerId)}>
        <div className="trainer-image-wrapper">
          <img 
            src={trainerImage || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop'} 
            alt={trainerName} 
            className="trainer-image"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop';
            }}
          />
          <div className="trainer-rating">
            <i className="fas fa-star"></i>
            {Number(trainerRating).toFixed(1)}
          </div>
          <h3 className="trainer-name-overlay">{trainerName}</h3>
        </div>
        <div className="trainer-info-search">
          <div className="trainer-info-row">
            <i className="fas fa-map-marker-alt"></i>
            <span className="trainer-info-label">พื้นที่บริการ</span>
            <span className="trainer-info-value">{trainerLocation}</span>
          </div>
          <div className="trainer-info-row">
            <i className="fas fa-briefcase"></i>
            <span className="trainer-info-label">ประสบการณ์</span>
            <span className="trainer-info-value">{trainerExperience} ปี</span>
          </div>
          <div className="trainer-info-row">
            <i className="fas fa-dumbbell"></i>
            <span className="trainer-info-label">ความเชี่ยวชาญ</span>
            <span className="trainer-info-value">
              {Array.isArray(trainerSpecialties) && trainerSpecialties.length > 0
                ? trainerSpecialties.slice(0, 2).map(s => s.name || s).join(', ') + (trainerSpecialties.length > 2 ? ' +อื่นๆ' : '')
                : 'ไม่ระบุ'
              }
            </span>
          </div>
          <div className="trainer-info-row">
            <i className="fas fa-tag"></i>
            <span className="trainer-info-label">ราคา (ต่อชั่วโมง)</span>
            <span className="trainer-info-value trainer-price">
              ฿{Number(trainerPrice).toLocaleString()} <span>บาท</span>
            </span>
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
        <div className="skeleton skeleton-line short"></div>
        <div className="skeleton skeleton-line"></div>
        <div className="skeleton skeleton-line short"></div>
      </div>
    </div>
  );

  const NoResults = () => (
    <div className="no-results">
      <i className="fas fa-search"></i>
      <h4>ไม่พบเทรนเนอร์ที่ตรงกับเงื่อนไขการค้นหา</h4>
      <p>ลองเปลี่ยนคำค้นหาหรือกรองผลลัพธ์ใหม่อีกครั้ง</p>
      <button className="btn btn-primary-custom mt-3" onClick={clearAllFilters}>
        ล้างตัวกรองทั้งหมด
      </button>
    </div>
  );

  const ErrorDisplay = () => (
    <div className="no-results">
      <i className="fas fa-exclamation-triangle" style={{ color: 'var(--secondary-color)' }}></i>
      <h4>เกิดข้อผิดพลาด</h4>
      <p>{error}</p>
      <button className="btn btn-primary-custom mt-3" onClick={fetchTrainers}>
        ลองใหม่อีกครั้ง
      </button>
    </div>
  );

  const MultiSelectDropdown = ({ id, label, options, selectedValues, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const getDisplayText = () => {
      if (selectedValues.length === 0) return placeholder;
      return `เลือกแล้ว ${selectedValues.length} รายการ`;
    };

    return (
      <div className="multi-select-wrapper">
        <div 
          className={`multi-select-dropdown ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="multi-select-label">{getDisplayText()}</span>
          <i className="fas fa-chevron-down"></i>
        </div>
        <div className={`multi-select-options ${isOpen ? 'show' : ''}`}>
          {options.map(option => (
            <label key={option.value} className="multi-option">
              <input 
                type="checkbox" 
                value={option.value}
                checked={selectedValues.includes(option.value)}
                onChange={(e) => onChange(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="search-trainers-page">
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

        .search-trainers-page {
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

        /* Filter Bar */
        .filter-bar {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          border: 1px solid #f0f0f0;
          margin-bottom: 1.5rem;
        }

        .search-wrapper {
          margin-bottom: 0.5rem;
        }

        .search-wrapper .input-group {
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
          display: flex;
        }

        .search-wrapper .input-group:focus-within {
          border-color: var(--secondary-color);
          box-shadow: 0 0 0 3px rgba(223, 37, 40, 0.1);
        }

        .search-wrapper .input-group-text {
          border: none;
          padding: 0.8rem 1rem;
          background: white;
        }

        .search-wrapper .form-control {
          border: none;
          box-shadow: none;
          padding: 0.8rem 0;
          font-size: 1rem;
          flex: 1;
        }

        .search-wrapper .form-control:focus {
          box-shadow: none;
          outline: none;
        }

        .filter-select {
          width: 100%;
          padding: 0.7rem 1rem;
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

        .filter-select:hover {
          border-color: #ccc;
        }

        /* Multi-Select Dropdown */
        .multi-select-wrapper {
          position: relative;
        }

        .multi-select-dropdown {
          width: 100%;
          padding: 0.7rem 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .multi-select-dropdown:hover {
          border-color: #ccc;
        }

        .multi-select-dropdown.active {
          border-color: var(--secondary-color);
          box-shadow: 0 0 0 3px rgba(223, 37, 40, 0.1);
        }

        .multi-select-dropdown i {
          font-size: 0.7rem;
          transition: transform 0.3s ease;
        }

        .multi-select-dropdown.active i {
          transform: rotate(180deg);
        }

        .multi-select-options {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          margin-top: 5px;
          max-height: 200px;
          overflow-y: auto;
          display: none;
          z-index: 10;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }

        .multi-select-options.show {
          display: block;
        }

        .multi-option {
          display: flex;
          align-items: center;
          padding: 0.6rem 1rem;
          cursor: pointer;
          transition: background 0.2s ease;
          font-size: 0.9rem;
        }

        .multi-option:hover {
          background: var(--bg-light);
        }

        .multi-option input[type="checkbox"] {
          margin-right: 0.6rem;
          cursor: pointer;
          accent-color: var(--secondary-color);
        }

        /* Price Filter Bar */
        .price-filter-bar {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 0.8rem 1rem;
          background: var(--bg-light);
          border-radius: 8px;
        }

        .price-label {
          font-weight: 600;
          color: var(--primary-color);
          font-size: 0.9rem;
        }

        .price-range-inline {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .range-slider-inline {
          flex: 1;
          position: relative;
          height: 6px;
          background: #e0e0e0;
          border-radius: 3px;
        }

        .range-track-inline {
          position: absolute;
          height: 100%;
          background: var(--secondary-color);
          border-radius: 3px;
        }

        .range-input {
          position: absolute;
          width: 100%;
          height: 6px;
          background: none;
          pointer-events: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          top: 0;
          z-index: 2;
        }

        .range-input::-webkit-slider-thumb {
          width: 18px;
          height: 18px;
          background: var(--secondary-color);
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          pointer-events: auto;
          -webkit-appearance: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }

        .range-input::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 10px rgba(223, 37, 40, 0.3);
        }

        .range-input::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: var(--secondary-color);
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          pointer-events: auto;
          -moz-appearance: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        }

        .range-input::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 10px rgba(223, 37, 40, 0.3);
        }

        .clear-filters {
          color: var(--secondary-color);
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .clear-filters:hover {
          color: var(--primary-color);
        }

        /* Results Section */
        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.2rem 1.5rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          border: 1px solid #f0f0f0;
          margin-bottom: 1.5rem;
        }

        .results-count {
          font-size: 0.9rem;
          color: var(--text-light);
        }

        .results-count strong {
          color: var(--primary-color);
          font-weight: 700;
        }

        .sort-dropdown .form-select {
          width: auto;
          min-width: 200px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          padding: 0.5rem 1rem;
        }

        /* Trainers Grid */
        .trainers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.2rem;
          width: 100%;
          margin: 0;
          padding: 0;
        }

        @media (min-width: 1200px) {
          .trainers-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
          }
        }

        @media (min-width: 992px) and (max-width: 1199px) {
          .trainers-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.3rem;
          }
        }

        @media (min-width: 768px) and (max-width: 991px) {
          .trainers-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.2rem;
          }
        }

        @media (min-width: 577px) and (max-width: 767px) {
          .trainers-grid {
            grid-template-columns: 1fr;
            gap: 1.2rem;
          }
        }

        /* Trainer Card - เพิ่ม hover effect และ cursor pointer */
        .trainer-card-search {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          border: 1px solid rgba(0,0,0,0.05);
          position: relative;
          max-width: 100%;
        }

        .trainer-card-search:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          border-color: rgba(223, 37, 40, 0.2);
        }

        /* เพิ่ม effect พิเศษสำหรับการ click */
        .trainer-card-search:active {
          transform: translateY(-4px);
          transition: transform 0.1s ease;
        }

        .trainer-image-wrapper {
          position: relative;
          height: 280px;
          overflow: hidden;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        @media (min-width: 1200px) {
          .trainer-image-wrapper {
            height: 300px;
          }
        }

        @media (min-width: 992px) and (max-width: 1199px) {
          .trainer-image-wrapper {
            height: 280px;
          }
        }

        @media (min-width: 768px) and (max-width: 991px) {
          .trainer-image-wrapper {
            height: 260px;
          }
        }

        @media (min-width: 577px) and (max-width: 767px) {
          .trainer-image-wrapper {
            height: 220px;
          }
        }

        .trainer-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .trainer-card-search:hover .trainer-image {
          transform: scale(1.1);
        }

        .trainer-image-wrapper::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 100%;
          background: linear-gradient(to top, 
            rgba(35, 41, 86, 0.9) 0%, 
            rgba(35, 41, 86, 0.7) 30%, 
            rgba(35, 41, 86, 0.3) 60%,
            transparent 100%);
          z-index: 1;
        }

        .trainer-name-overlay {
          position: absolute;
          bottom: 20px;
          left: 20px;
          right: 20px;
          z-index: 2;
          color: white;
          font-size: 1.3rem;
          font-weight: 700;
          text-shadow: 0 2px 12px rgba(0,0,0,0.6);
          line-height: 1.2;
          letter-spacing: 0.3px;
        }

        .trainer-info-search {
          padding: 1.2rem 1.3rem;
          background: white;
        }

        .trainer-info-row {
          display: flex;
          align-items: center;
          margin-bottom: 0.6rem;
          font-size: 0.9rem;
          color: var(--text-light);
        }

        .trainer-info-row:last-child {
          margin-bottom: 0;
          margin-top: 0.8rem;
        }

        .trainer-info-row i {
          width: 22px;
          margin-right: 0.7rem;
          color: var(--secondary-color);
          font-size: 0.9rem;
          text-align: center;
        }

        .trainer-info-label {
          color: var(--text-light);
          font-size: 0.85rem;
          min-width: 85px;
          font-weight: 400;
        }

        .trainer-info-value {
          color: var(--text-dark);
          font-weight: 500;
          font-size: 0.9rem;
        }

        .trainer-price {
          color: var(--secondary-color);
          font-weight: 700;
          font-size: 1.1rem;
        }

        .trainer-price span {
          font-size: 0.8rem;
          font-weight: 400;
          color: var(--text-light);
        }

        .trainer-rating {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          color: var(--primary-color);
          padding: 0.4rem 0.7rem;
          border-radius: 18px;
          font-weight: 600;
          font-size: 0.8rem;
          z-index: 2;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .trainer-rating i {
          color: #ffc107;
          margin-right: 0.3rem;
          font-size: 0.75rem;
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

        .page-item.disabled .page-link {
          cursor: default;
          pointer-events: none;
          color: var(--text-light);
          background: #f5f5f5;
          border-color: #f5f5f5;
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
          height: 280px;
        }

        .skeleton-content {
          padding: 1.2rem 1.3rem;
        }

        .skeleton-line {
          height: 16px;
          margin-bottom: 0.8rem;
          border-radius: 4px;
        }

        .skeleton-line.short {
          width: 70%;
        }

        @media (min-width: 1200px) {
          .skeleton-image {
            height: 300px;
          }
          
          .skeleton-content {
            padding: 1.3rem 1.4rem;
          }
          
          .skeleton-line {
            height: 18px;
            margin-bottom: 0.9rem;
          }
        }

        @media (min-width: 992px) and (max-width: 1199px) {
          .skeleton-image {
            height: 280px;
          }
        }

        @media (min-width: 768px) and (max-width: 991px) {
          .skeleton-image {
            height: 260px;
          }
          
          .skeleton-content {
            padding: 1.1rem 1.2rem;
          }
        }

        @media (min-width: 577px) and (max-width: 767px) {
          .skeleton-image {
            height: 220px;
          }
          
          .skeleton-content {
            padding: 1rem 1.1rem;
          }
          
          .skeleton-line {
            height: 14px;
            margin-bottom: 0.7rem;
          }
        }

        .filters-label {
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 0.5rem;
          margin-bottom: 0.8rem;
        }

        #minPriceDisplay, #maxPriceDisplay {
          font-weight: 600;
          color: var(--primary-color);
          font-size: 0.9rem;
          min-width: 70px;
        }

        /* No Results State */
        .no-results {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--text-light);
        }

        .no-results i {
          font-size: 3rem;
          color: var(--secondary-color);
          margin-bottom: 1rem;
        }

        .no-results h4 {
          color: var(--primary-color);
          margin-bottom: 0.5rem;
        }

        /* Grid utilities */
        .row {
          display: flex;
          flex-wrap: wrap;
          margin: 0 -7.5px;
        }

        .col-12 {
          flex: 0 0 100%;
          max-width: 100%;
          padding: 0 7.5px;
        }

        .col-md-2 {
          flex: 0 0 16.666667%;
          max-width: 16.666667%;
          padding: 0 7.5px;
        }

        .g-3 > * {
          margin-bottom: 1rem;
        }

        .g-2 > * {
          margin-bottom: 0.5rem;
        }

        .mb-0 { margin-bottom: 0; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 1rem; }
        .mt-1 { margin-top: 0.25rem; }
        .mt-3 { margin-top: 1rem; }
        .mt-5 { margin-top: 3rem; }
        .me-1 { margin-right: 0.25rem; }
        .me-2 { margin-right: 0.5rem; }
        .w-100 { width: 100%; }
        .d-flex { display: flex; }
        .justify-content-center { justify-content: center; }
        .align-items-center { align-items: center; }
        .text-center { text-align: center; }

        /* Responsive */
        @media (max-width: 991px) {
          .col-md-2 {
            flex: 0 0 100%;
            max-width: 100%;
            margin-bottom: 0.5rem;
          }

          .price-filter-bar {
            flex-wrap: wrap;
          }

          .results-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .sort-dropdown {
            width: 100%;
          }

          .sort-dropdown select {
            width: 100%;
          }
        }

        @media (max-width: 576px) {
          .trainers-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .trainer-image-wrapper {
            height: 240px;
          }

          .trainer-name-overlay {
            font-size: 1.2rem;
            bottom: 15px;
            left: 15px;
            right: 15px;
          }

          .trainer-info-search {
            padding: 1rem 1.1rem;
          }

          .trainer-info-row {
            font-size: 0.85rem;
            margin-bottom: 0.5rem;
          }

          .trainer-info-label {
            min-width: 75px;
            font-size: 0.8rem;
          }

          .trainer-info-value {
            font-size: 0.85rem;
          }

          .trainer-price {
            font-size: 1.05rem;
          }

          .price-range-inline {
            flex-direction: column;
            gap: 0.5rem;
          }

          .range-slider-inline {
            width: 100%;
          }

          .trainer-rating {
            padding: 0.35rem 0.6rem;
            font-size: 0.75rem;
            top: 12px;
            right: 12px;
          }
        }
      `}</style>

      <div className="container">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="/" style={{ color: 'var(--secondary-color)', textDecoration: 'none' }}>หน้าแรก</a></li>
            <li className="breadcrumb-item active" aria-current="page">ค้นหาเทรนเนอร์</li>
          </ol>
        </nav>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="row g-3">
            {/* Search Input */}
            <div className="col-12">
              <div className="search-wrapper">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="fas fa-search text-muted"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control border-start-0 ps-0" 
                    placeholder="ค้นหาชื่อเทรนเนอร์ หรือความเชี่ยวชาญ..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                  />
                </div>
              </div>
            </div>
            
            {/* Filters Row */}
            <div className="col-12">
              <div className="filters-label mb-2">
                <h5 className="mb-0" style={{ fontWeight: 600, color: 'var(--primary-color)', fontSize: '1rem' }}>
                  <i className="fas fa-filter me-2"></i>กรองผลลัพธ์
                </h5>
              </div>
              <div className="row g-2">
                {/* Location Filter */}
                <div className="col-md-2">
                  <select 
                    className="form-select filter-select"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  >
                    <option value="">เขตพื้นที่ทั้งหมด</option>
                    {locations.map((location, index) => (
                      <option key={location.id || location.name || index} value={location.name || location.value || location}>
                        {location.name || location.label || location}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expertise Multi-Select */}
                <div className="col-md-2">
                  <MultiSelectDropdown
                    id="expertise"
                    label="ความเชี่ยวชาญ"
                    options={expertiseOptions}
                    selectedValues={expertiseFilter}
                    onChange={handleExpertiseChange}
                    placeholder="ความเชี่ยวชาญ"
                  />
                </div>

                {/* Activity Multi-Select */}
                <div className="col-md-2">
                  <MultiSelectDropdown
                    id="activity"
                    label="กิจกรรม"
                    options={activityOptions}
                    selectedValues={activityFilter}
                    onChange={handleActivityChange}
                    placeholder="กิจกรรม"
                  />
                </div>

                {/* Experience Filter */}
                <div className="col-md-2">
                  <select 
                    className="form-select filter-select"
                    value={experienceFilter}
                    onChange={(e) => setExperienceFilter(e.target.value)}
                  >
                    <option value="">ประสบการณ์ทั้งหมด</option>
                    <option value="0-2">0-2 ปี</option>
                    <option value="3-5">3-5 ปี</option>
                    <option value="5-10">5-10 ปี</option>
                    <option value="10+">มากกว่า 10 ปี</option>
                  </select>
                </div>

                {/* Gender Filter */}
                <div className="col-md-2">
                  <select 
                    className="form-select filter-select"
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                  >
                    <option value="">เพศทั้งหมด</option>
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>

                {/* Search Button */}
                <div className="col-md-2">
                  <button className="btn btn-primary-custom w-100" style={{ padding: '0.7rem 1rem' }} onClick={applyFilters}>
                    <i className="fas fa-search me-2"></i>ค้นหา
                  </button>
                </div>
              </div>
            </div>

            {/* Price Range */}
            <div className="col-12">
              <div className="price-filter-bar">
                <span className="price-label">งบประมาณ:</span>
                <div className="price-range-inline">
                  <span id="minPriceDisplay">฿{minPrice.toLocaleString()}</span>
                  <div className="range-slider-inline">
                    <div className="range-track-inline" style={getPriceTrackStyle()}></div>
                    <input 
                      type="range" 
                      className="range-input" 
                      min="0" 
                      max="5000" 
                      value={minPrice} 
                      step="100"
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value <= maxPrice - 100) {
                          setMinPrice(value);
                        }
                      }}
                    />
                    <input 
                      type="range" 
                      className="range-input" 
                      min="0" 
                      max="5000" 
                      value={maxPrice} 
                      step="100"
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value >= minPrice + 100) {
                          setMaxPrice(value);
                        }
                      }}
                    />
                  </div>
                  <span id="maxPriceDisplay">฿{maxPrice.toLocaleString()}</span>
                </div>
                <a href="#" className="clear-filters" onClick={(e) => { e.preventDefault(); clearAllFilters(); }}>
                  <i className="fas fa-times me-1"></i>ล้างตัวกรองทั้งหมด
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="results-header">
          <div>
            <h4 className="mb-0" style={{ fontWeight: 700, color: 'var(--primary-color)' }}>เทรนเนอร์ทั้งหมด</h4>
            <div className="results-count mt-1">
              พบ <strong>{totalResults}</strong> เทรนเนอร์
              {currentPage > 1 && (
                <span> (หน้า {currentPage} จาก {totalPages})</span>
              )}
            </div>
          </div>
          <div className="sort-dropdown">
            <select 
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recommended">เรียงตาม: แนะนำ</option>
              <option value="rating">คะแนนสูงสุด</option>
              <option value="price-low">ราคาต่ำสุด</option>
              <option value="price-high">ราคาสูงสุด</option>
              <option value="experience">ประสบการณ์มากสุด</option>
              <option value="newest">ใหม่ล่าสุด</option>
            </select>
          </div>
        </div>

        {/* Trainers Grid */}
        {loading ? (
          <div className="trainers-grid">
            {[...Array(20)].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : error ? (
          <ErrorDisplay />
        ) : filteredTrainers.length === 0 ? (
          <NoResults />
        ) : (
          <div className="trainers-grid">
            {filteredTrainers.map((trainer, index) => (
              <TrainerCard key={trainer.id || trainer._id || index} trainer={trainer} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && filteredTrainers.length > 0 && totalPages > 1 && (
          <div className="pagination-wrapper">
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <span 
                  className="page-link" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label="Previous"
                >
                  <i className="fas fa-chevron-left"></i>
                </span>
              </li>
              
              {getPaginationItems().map((item, index) => (
                <li 
                  key={index} 
                  className={`page-item ${item === '...' ? 'disabled' : ''} ${item === currentPage ? 'active' : ''}`}
                >
                  <span 
                    className="page-link" 
                    onClick={() => typeof item === 'number' && handlePageChange(item)}
                  >
                    {item}
                  </span>
                </li>
              ))}
              
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <span 
                  className="page-link" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label="Next"
                >
                  <i className="fas fa-chevron-right"></i>
                </span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchTrainers;