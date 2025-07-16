import React, { useState, useEffect, useRef } from 'react';

const HomePage = () => {
  const [currentTrainerIndex, setCurrentTrainerIndex] = useState(0);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const trainersSliderRef = useRef(null);
  const reviewsSliderRef = useRef(null);

  // Database States - เพิ่ม loading และ error states
  const [trainers, setTrainers] = useState([]);
  const [trainersLoading, setTrainersLoading] = useState(true);
  const [trainersError, setTrainersError] = useState(null);

  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesError, setArticlesError] = useState(null);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);

  // API Base URL - แก้ไขให้เชื่อมต่อกับ backend จริง
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  // Helper function สำหรับ API calls
  const apiCall = async (endpoint, options = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal,
        ...options
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - เซิร์ฟเวอร์ใช้เวลานานเกินไป');
      }
      throw error;
    }
  };

  // API Functions - แก้ไขให้เชื่อมต่อกับฐานข้อมูลจริง
  const fetchFeaturedTrainers = async () => {
    setTrainersLoading(true);
    setTrainersError(null);
    
    try {
      const data = await apiCall('/trainers/featured?limit=8');
      
      if (data.success && data.data && Array.isArray(data.data)) {
        // Map database data to component format
        const mappedTrainers = data.data.map(trainer => ({
          id: trainer.id,
          name: trainer.display_name || 
                `${trainer.first_name || ''} ${trainer.last_name || ''}`.trim().toUpperCase() || 
                'เทรนเนอร์',
          specialty: trainer.specialties || 'ฟิตเนส • ออกกำลังกาย',
          location: `${trainer.city || ''} ${trainer.province || ''}`.trim() || 'กรุงเทพฯ',
          experience: trainer.experience_years > 10 ? 'มากกว่า 10 ปี' : 
                     trainer.experience_years >= 5 ? '5-10 ปี' : 
                     trainer.experience_years >= 3 ? '3-5 ปี' : 'น้อยกว่า 3 ปี',
          rating: `${parseFloat(trainer.rating || 4.5).toFixed(1)} ⭐⭐⭐⭐⭐`,
          reviews: `${trainer.total_reviews || 0} รีวิว`,
          price: `${parseInt(trainer.hourly_rate || 1000).toLocaleString()} บาท/เซสชั่น`,
          image: trainer.avatar_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=1000&fit=crop'
        }));
        
        setTrainers(mappedTrainers);
      } else {
        console.warn('No trainers found or invalid response format');
        setDemoTrainers();
      }
      
    } catch (err) {
      console.error('Error fetching trainers:', err);
      setTrainersError(err.message);
      // Use demo data if API fails
      setDemoTrainers();
    } finally {
      setTrainersLoading(false);
    }
  };

  const fetchFeaturedArticles = async () => {
    setArticlesLoading(true);
    setArticlesError(null);
    
    try {
      const data = await apiCall('/articles/featured?limit=3');
      
      if (data.success && data.data && Array.isArray(data.data)) {
        // Map database data to component format
        const mappedArticles = data.data.map(article => ({
          id: article.id,
          title: article.title,
          excerpt: article.excerpt || article.content?.substring(0, 150) + '...' || '',
          date: article.published_at ? 
                new Date(article.published_at).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 
                new Date().toLocaleDateString('th-TH'),
          category: (article.category?.toUpperCase() || 'ARTICLE'),
          image: article.featured_image_url || 
                 article.image_url || 
                 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=400&fit=crop'
        }));
        
        setArticles(mappedArticles);
      } else {
        console.warn('No articles found or invalid response format');
        setDemoArticles();
      }
      
    } catch (err) {
      console.error('Error fetching articles:', err);
      setArticlesError(err.message);
      setDemoArticles();
    } finally {
      setArticlesLoading(false);
    }
  };

  const fetchFeaturedEvents = async () => {
    setEventsLoading(true);
    setEventsError(null);
    
    try {
      const data = await apiCall('/events/featured?limit=2');
      
      if (data.success && data.data && Array.isArray(data.data)) {
        // Map database data to component format
        const mappedEvents = data.data.map(event => {
          const eventDate = new Date(event.start_date || event.event_date);
          return {
            id: event.id,
            day: eventDate.getDate().toString().padStart(2, '0'),
            month: eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
            title: event.title,
            time: event.start_time || '06:00 AM',
            location: event.location_name ? 
                     `${event.location_name}${event.location_address ? ', ' + event.location_address : ''}` :
                     (event.location || 'สถานที่จัดงาน'),
            description: event.description || event.excerpt || '',
            image: event.featured_image_url || 
                   event.image_url || 
                   'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=400&fit=crop'
          };
        });
        
        setEvents(mappedEvents);
      } else {
        console.warn('No events found or invalid response format');
        setDemoEvents();
      }
      
    } catch (err) {
      console.error('Error fetching events:', err);
      setEventsError(err.message);
      setDemoEvents();
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchFeaturedReviews = async () => {
    setReviewsLoading(true);
    setReviewsError(null);
    
    try {
      const data = await apiCall('/reviews/featured?limit=6');
      
      if (data.success && data.data && Array.isArray(data.data)) {
        // Map database data to component format
        const mappedReviews = data.data.map(review => ({
          id: review.id,
          stars: '⭐'.repeat(Math.min(5, Math.max(1, review.rating || 5))),
          content: review.comment || review.review_text || 'รีวิวที่ยอดเยี่ยม',
          name: review.customer_name || 
                (review.customer ? `${review.customer.first_name || ''} ${review.customer.last_name || ''}`.trim() : '') ||
                'ลูกค้า',
          program: review.trainer_name ? 
                  `${review.trainer_name} • ${review.package_name || 'แพคเกจ'}` :
                  `เทรนเนอร์ • ${review.package_name || 'แพคเกจ'}`,
          image: review.customer_avatar || 
                 (review.customer?.avatar_url) ||
                 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
        }));
        
        setReviews(mappedReviews);
      } else {
        console.warn('No reviews found or invalid response format');
        setDemoReviews();
      }
      
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setReviewsError(err.message);
      setDemoReviews();
    } finally {
      setReviewsLoading(false);
    }
  };

  // Demo Data Functions (fallback when API fails) - คงไว้เป็น fallback
  const setDemoTrainers = () => {
    const demoTrainers = [
      { 
        id: 1, 
        name: 'DAVID BRANDON', 
        specialty: 'ลดน้ำหนัก • เพิ่มกล้ามเนื้อ', 
        location: 'กรุงเทพฯ', 
        experience: '5-10 ปี', 
        rating: '5.0 ⭐⭐⭐⭐⭐', 
        reviews: '127 รีวิว', 
        price: '1,500 บาท/เซสชั่น',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=1000&fit=crop'
      },
      { 
        id: 2, 
        name: 'SOPHIA CHEN', 
        specialty: 'โยคะ • พิลาทิส', 
        location: 'เชียงใหม่', 
        experience: '3-5 ปี', 
        rating: '4.9 ⭐⭐⭐⭐⭐', 
        reviews: '89 รีวิว', 
        price: '1,200 บาท/เซสชั่น',
        image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&h=1000&fit=crop'
      },
      { 
        id: 3, 
        name: 'JACK MILLER', 
        specialty: 'มวยไทย • คาร์ดิโอ', 
        location: 'กรุงเทพฯ', 
        experience: 'มากกว่า 10 ปี', 
        rating: '5.0 ⭐⭐⭐⭐⭐', 
        reviews: '156 รีวิว', 
        price: '1,800 บาท/เซสชั่น',
        image: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=800&h=1000&fit=crop'
      },
      { 
        id: 4, 
        name: 'EMMA WILSON', 
        specialty: 'ฟิตเนส • ลดน้ำหนัก', 
        location: 'ปทุมธานี', 
        experience: '5-10 ปี', 
        rating: '4.8 ⭐⭐⭐⭐⭐', 
        reviews: '98 รีวิว', 
        price: '1,400 บาท/เซสชั่น',
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=1000&fit=crop'
      },
      { 
        id: 5, 
        name: 'MIKE JOHNSON', 
        specialty: 'เพาเวอร์ลิฟติ้ง', 
        location: 'นครราชสีมา', 
        experience: '3-5 ปี', 
        rating: '4.9 ⭐⭐⭐⭐⭐', 
        reviews: '74 รีวิว', 
        price: '1,600 บาท/เซสชั่น',
        image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&h=1000&fit=crop'
      },
      { 
        id: 6, 
        name: 'JANE DAVIS', 
        specialty: 'ครอสเทรนนิ่ง', 
        location: 'กรุงเทพฯ', 
        experience: '5-10 ปี', 
        rating: '5.0 ⭐⭐⭐⭐⭐', 
        reviews: '112 รีวิว', 
        price: '1,700 บาท/เซสชั่น',
        image: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=800&h=1000&fit=crop'
      },
      { 
        id: 7, 
        name: 'LISA MARTIN', 
        specialty: 'ดันซ์ฟิตเนส', 
        location: 'นนทบุรี', 
        experience: '3-5 ปี', 
        rating: '4.8 ⭐⭐⭐⭐⭐', 
        reviews: '85 รีวิว', 
        price: '1,300 บาท/เซสชั่น',
        image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&h=1000&fit=crop'
      },
      { 
        id: 8, 
        name: 'BEN TAYLOR', 
        specialty: 'ว่ายน้ำ • ไตรกีฬา', 
        location: 'กรุงเทพฯ', 
        experience: 'มากกว่า 10 ปี', 
        rating: '5.0 ⭐⭐⭐⭐⭐', 
        reviews: '143 รีวิว', 
        price: '2,000 บาท/เซสชั่น',
        image: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=800&h=1000&fit=crop'
      }
    ];
    setTrainers(demoTrainers);
  };

  const setDemoArticles = () => {
    const demoArticles = [
      { 
        id: 1, 
        title: '10 วิธีลดน้ำหนักอย่างยั่งยืน', 
        excerpt: 'เรียนรู้เทคนิคการลดน้ำหนักที่ได้ผลจริง พร้อมคำแนะนำจากผู้เชี่ยวชาญ', 
        date: '15 ม.ค. 2024',
        category: 'WEIGHT LOSS',
        image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=400&fit=crop'
      },
      { 
        id: 2, 
        title: 'โยคะสำหรับผู้เริ่มต้น', 
        excerpt: 'คู่มือเริ่มต้นฝึกโยคะ พร้อมท่าพื้นฐานที่ทำได้ที่บ้าน', 
        date: '12 ม.ค. 2024',
        category: 'YOGA',
        image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&h=400&fit=crop'
      },
      { 
        id: 3, 
        title: 'อาหารเสริมโปรตีน คู่หูนักกีฬา', 
        excerpt: 'ทำความรู้จักกับอาหารเสริมโปรตีน วิธีเลือกและการใช้ที่ถูกต้อง', 
        date: '10 ม.ค. 2024',
        category: 'NUTRITION',
        image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&h=400&fit=crop'
      }
    ];
    setArticles(demoArticles);
  };

  const setDemoEvents = () => {
    const demoEvents = [
      { 
        id: 1, 
        day: '25', 
        month: 'JAN', 
        title: 'FitConnect Marathon 2024', 
        time: '06:00 AM', 
        location: 'สวนลุมพินี, กรุงเทพฯ', 
        description: 'ร่วมวิ่งมาราธอนการกุศล ระยะทาง 5K, 10K และ 21K',
        image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=400&fit=crop'
      },
      { 
        id: 2, 
        day: '5', 
        month: 'FEB', 
        title: 'Yoga Festival Thailand', 
        time: '07:00 AM', 
        location: 'หาดเจ้าหลาว, จันทบุรี', 
        description: 'เทศกาลโยคะริมทะเล พร้อมเวิร์คช็อปจากครูผู้เชี่ยวชาญ',
        image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&h=400&fit=crop'
      }
    ];
    setEvents(demoEvents);
  };

  const setDemoReviews = () => {
    const demoReviews = [
      { 
        id: 1, 
        stars: '⭐⭐⭐⭐⭐', 
        content: 'โค้ชมิกซ์ช่วยให้ผมลดน้ำหนักได้ 15 กิโลใน 3 เดือน! โปรแกรมการเทรนและคำแนะนำด้านอาหารดีมาก เข้าใจง่าย ทำตามได้จริง', 
        name: 'คุณอเล็กซ์', 
        program: 'ลดน้ำหนัก • 3 เดือน',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
      },
      { 
        id: 2, 
        stars: '⭐⭐⭐⭐⭐', 
        content: 'โยคะกับโค้ชนิกกี้ทำให้ร่างกายยืดหยุ่นขึ้นมาก ปวดหลังที่เป็นมา 2 ปีหายไปเลย การสอนเข้าใจง่าย อดทนมาก', 
        name: 'คุณนิดา', 
        program: 'โยคะ • 6 เดือน',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop'
      },
      { 
        id: 3, 
        stars: '⭐⭐⭐⭐⭐', 
        content: 'เทรนมวยกับโค้ชแจ็คสนุกมาก! นอกจากได้ออกกำลังกายแล้ว ยังได้เรียนรู้เทคนิคการป้องกันตัวด้วย รู้สึกมั่นใจในตัวเองมากขึ้น', 
        name: 'คุณแป้ง', 
        program: 'มวย • 4 เดือน',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop'
      },
      { 
        id: 4, 
        stars: '⭐⭐⭐⭐⭐', 
        content: 'ระบบจัดการในแอพใช้งานง่ายมาก ดูตารางเทรน บันทึกผลการออกกำลังกาย และติดต่อเทรนเนอร์ได้สะดวก คุ้มค่ามาก!', 
        name: 'คุณสมชาย', 
        program: 'เพิ่มกล้ามเนื้อ • 8 เดือน',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop'
      },
      { 
        id: 5, 
        stars: '⭐⭐⭐⭐⭐', 
        content: 'ประทับใจมากที่มีเทรนเนอร์หลากหลายให้เลือก ราคาไม่แพง คุณภาพดี เทรนเนอร์ใส่ใจในรายละเอียด ให้คำปรึกษาตลอด 24 ชม.', 
        name: 'คุณสมหญิง', 
        program: 'พิลาทิส • 5 เดือน',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop'
      },
      { 
        id: 6, 
        stars: '⭐⭐⭐⭐⭐', 
        content: 'แอพนี้เปลี่ยนชีวิตผมจริงๆ จากคนที่ไม่เคยออกกำลังกายเลย ตอนนี้ออกกำลังกายเป็นประจำ น้ำหนักลด สุขภาพดีขึ้นมาก', 
        name: 'คุณวิชัย', 
        program: 'ลดน้ำหนัก • 9 เดือน',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop'
      }
    ];
    setReviews(demoReviews);
  };

  // Fetch all data on component mount - เรียกใช้ API เมื่อ component โหลด
  useEffect(() => {
    const fetchAllData = async () => {
      // เรียกใช้ API ทั้งหมดพร้อมกัน
      await Promise.allSettled([
        fetchFeaturedTrainers(),
        fetchFeaturedArticles(),
        fetchFeaturedEvents(),
        fetchFeaturedReviews()
      ]);
    };

    fetchAllData();
  }, []);

  // Get items per view based on screen size
  const getItemsPerView = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth <= 576) return 1;
      if (window.innerWidth <= 991) return 2;
      return 4;
    }
    return 4;
  };

  const getReviewItemsPerView = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth <= 576) return 1;
      if (window.innerWidth <= 991) return 2;
      return 3;
    }
    return 3;
  };

  // Auto-play functionality - แก้ไข dependency ให้ใช้ loading state
  useEffect(() => {
    if (trainers.length > 0 && !trainersLoading) {
      const trainersInterval = setInterval(() => {
        const itemsPerView = getItemsPerView();
        const maxIndex = Math.max(0, trainers.length - itemsPerView);
        setCurrentTrainerIndex(prev => prev + itemsPerView > maxIndex ? 0 : prev + itemsPerView);
      }, 4000);

      return () => clearInterval(trainersInterval);
    }
  }, [trainers.length, trainersLoading]);

  useEffect(() => {
    if (reviews.length > 0 && !reviewsLoading) {
      const reviewsInterval = setInterval(() => {
        const itemsPerView = getReviewItemsPerView();
        const maxIndex = Math.max(0, reviews.length - itemsPerView);
        setCurrentReviewIndex(prev => prev + itemsPerView > maxIndex ? 0 : prev + itemsPerView);
      }, 5000);

      return () => clearInterval(reviewsInterval);
    }
  }, [reviews.length, reviewsLoading]);

  // Generate particles
  const generateParticles = () => {
    const particles = [];
    for (let i = 0; i < 20; i++) {
      particles.push(
        React.createElement('div', {
          key: i,
          className: 'particle',
          style: {
            left: Math.random() * 100 + '%',
            animationDelay: Math.random() * 15 + 's',
            animationDuration: 15 + Math.random() * 10 + 's'
          }
        })
      );
    }
    return particles;
  };

  // Handle search button click
  const handleSearchSubmit = () => {
    const location = document.getElementById('location')?.value || '';
    const specialty = document.getElementById('specialty')?.value || '';
    const price = document.getElementById('price')?.value || '';
    
    const searchParams = new URLSearchParams();
    if (location) searchParams.append('location', location);
    if (specialty) searchParams.append('specialty', specialty);
    if (price) searchParams.append('price', price);
    
    // เปลี่ยนจาก alert เป็น navigation
    window.location.href = `/trainers?${searchParams.toString()}`;
  };

  // Trainer Card Component
  const TrainerCard = ({ trainer }) => {
    const getTrainerCategory = (specialty) => {
      if (specialty.includes('ลดน้ำหนัก')) return 'WEIGHT LOSS COACH';
      if (specialty.includes('โยคะ')) return 'YOGA INSTRUCTOR';
      if (specialty.includes('มวย')) return 'BOXING COACH';
      if (specialty.includes('ฟิตเนส')) return 'FITNESS TRAINER';
      if (specialty.includes('เพาเวอร์')) return 'POWERLIFTING COACH';
      if (specialty.includes('ครอส')) return 'CROSSFIT COACH';
      if (specialty.includes('ดันซ์')) return 'DANCE FITNESS';
      if (specialty.includes('ว่ายน้ำ')) return 'SWIMMING COACH';
      return 'FITNESS COACH';
    };

    return (
      <div className="slider-item">
        <div className="trainer-card">
          <div className="trainer-image" style={{ backgroundImage: `url(${trainer.image})` }}>
            <div className="trainer-social">
              <a href="#" className="social-link">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="social-link">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="social-link">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="social-link">
                <i className="fab fa-youtube"></i>
              </a>
            </div>

            <div className="trainer-info">
              <div className="trainer-meta-top">
                <span><i className="fas fa-map-marker-alt"></i> {trainer.location}</span>
                <span><i className="fas fa-star"></i> {trainer.rating.replace(/⭐/g, '').trim()}</span>
              </div>
              <p className="trainer-specialty">
                {getTrainerCategory(trainer.specialty)}
              </p>
              <h3 className="trainer-name">{trainer.name}</h3>
              <p className="trainer-price">{trainer.price}</p>
            </div>
            
            <button 
              className="btn-view-profile"
              onClick={() => window.location.href = `/trainerdetail/${trainer.id}`}
            >
              ดูโปรไฟล์
            </button>
            <div className="trainer-accent"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fitconnect-homepage">
      {/* CSS Styles - ไม่เปลี่ยนแปลง */}
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
          overflow-x: hidden;
          background: var(--white);
        }

        /* Particles Background */
        .particles {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 10px;
          height: 10px;
          background: rgba(223, 37, 40, 0.3);
          border-radius: 50%;
          animation: float 15s infinite;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(100px) rotate(720deg);
            opacity: 0;
          }
        }

        /* Button Styles */
        .btn-primary-custom {
          background: var(--secondary-color);
          border: none;
          color: white;
          padding: 0.7rem 2.5rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .btn-primary-custom::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: rgba(255,255,255,0.2);
          transition: left 0.3s ease;
        }

        .btn-primary-custom:hover::before {
          left: 100%;
        }

        .btn-primary-custom:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(223, 37, 40, 0.3);
        }

        /* Hero Section */
        .hero-section {
          min-height: 100vh;
          background: linear-gradient(rgba(35, 41, 86, 0.85), rgba(223, 37, 40, 0.7)), url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop');
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .hero-title {
          font-size: clamp(3rem, 10vw, 7rem);
          font-weight: 900;
          line-height: 0.9;
          color: transparent;
          -webkit-text-stroke: 3px var(--white);
          text-transform: uppercase;
          letter-spacing: 5px;
          margin-bottom: 2rem;
        }

        .hero-title span {
          color: var(--secondary-color);
          -webkit-text-stroke: 0;
          display: block;
        }

        .hero-subtitle {
          font-size: 1.2rem;
          color: rgba(255,255,255,0.9);
          margin-bottom: 3rem;
          font-weight: 300;
          letter-spacing: 1px;
        }

        .hero-buttons {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .btn-hero {
          padding: 1rem 3rem;
          font-size: 1.1rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2px;
          border: 3px solid transparent;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .btn-hero-primary {
          background: var(--secondary-color);
          color: white;
          border-color: var(--secondary-color);
        }

        .btn-hero-outline {
          background: transparent;
          color: white;
          border-color: white;
        }

        .btn-hero:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.3);
        }

        /* Search Section */
        .search-section {
          padding: 4rem 0;
          background: var(--bg-light);
        }

        .search-container {
          background: white;
          border-radius: 0;
          padding: 3rem;
          box-shadow: var(--shadow);
          border-left: 5px solid var(--secondary-color);
        }

        .search-form {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          align-items: end;
        }

        .form-group label {
          font-weight: 600;
          color: var(--primary-color);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          font-size: 0.9rem;
          letter-spacing: 1px;
        }

        .form-control, .form-select {
          border: 2px solid #e0e0e0;
          border-radius: 0;
          padding: 0.8rem 1rem;
          transition: all 0.3s ease;
          font-size: 1rem;
        }

        .form-control:focus, .form-select:focus {
          border-color: var(--secondary-color);
          box-shadow: 0 0 0 0.2rem rgba(223, 37, 40, 0.25);
        }

        /* Section Styles */
        .section-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .section-title {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 3px;
          color: var(--primary-color);
          position: relative;
          display: inline-block;
        }

        .section-title::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 5px;
          background: var(--secondary-color);
        }

        .section-subtitle {
          text-align: center;
          color: var(--text-light);
          margin-bottom: 3rem;
          font-size: 1.1rem;
        }

        /* Trainer Cards */
        .trainer-card {
          background: #000;
          overflow: hidden;
          position: relative;
          transition: all 0.3s ease;
          border: none;
          box-shadow: 0 5px 20px rgba(0,0,0,0.3);
          height: 500px;
          border-radius: 0;
        }

        .trainer-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.4);
        }

        .trainer-card:hover .trainer-image::before {
          height: 70%;
        }

        .trainer-image {
          height: 100%;
          background-size: cover;
          background-position: center top;
          position: relative;
          overflow: hidden;
          transition: transform 0.5s ease;
        }

        .trainer-card:hover .trainer-image {
          transform: scale(1.05);
        }

        .trainer-image::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60%;
          background: linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.7) 50%, transparent);
          z-index: 1;
          transition: height 0.3s ease;
        }

        .trainer-social {
          position: absolute;
          right: 20px;
          top: 40px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          z-index: 3;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .trainer-card:hover .trainer-social {
          opacity: 1;
        }

        .social-link {
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .social-link:hover {
          background: var(--secondary-color);
          transform: scale(1.1);
          color: white;
          border-color: var(--secondary-color);
        }

        .trainer-info {
          position: absolute;
          bottom: 20px;
          left: 0;
          right: 0;
          padding: 2rem;
          z-index: 2;
          transition: all 0.3s ease;
        }

        .trainer-card:hover .trainer-info {
          bottom: 80px;
        }

        .trainer-meta-top {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 1rem;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.7);
        }

        .trainer-meta-top span {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .trainer-name {
          font-size: 2rem;
          font-weight: 800;
          color: white;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 0.3rem;
          line-height: 1;
        }

        .trainer-specialty {
          color: var(--secondary-color);
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 1rem;
        }

        .trainer-accent {
          position: absolute;
          left: 0;
          bottom: 0;
          width: 5px;
          height: 100px;
          background: var(--secondary-color);
          z-index: 3;
          transition: height 0.3s ease;
        }

        .trainer-card:hover .trainer-accent {
          height: 170px;
        }

        .trainer-price {
          color: rgba(255,255,255,0.8);
          font-size: 1.1rem;
          font-weight: 500;
          margin-bottom: 0;
        }

        .btn-view-profile {
          position: absolute;
          bottom: 20px;
          left: 2rem;
          right: 2rem;
          background: transparent;
          color: white;
          padding: 0.8rem 2.5rem;
          width: calc(100% - 4rem);
          border: 2px solid var(--secondary-color);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-align: center;
          transition: all 0.3s ease;
          border-radius: 0;
          opacity: 0;
          transform: translateY(20px);
          z-index: 4;
        }

        .trainer-card:hover .btn-view-profile {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 0.1s;
        }

        .btn-view-profile:hover {
          background: var(--secondary-color);
          transform: translateY(-2px);
          border-color: var(--secondary-color);
        }

        /* Articles Section */
        .article-card {
          background: white;
          border-radius: 0;
          overflow: hidden;
          box-shadow: var(--shadow);
          transition: all 0.3s ease;
          height: 100%;
        }

        .article-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.2);
        }

        .article-image {
          position: relative;
          overflow: hidden;
          height: 250px;
          background-size: cover;
          background-position: center;
        }

        .article-category {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: var(--secondary-color);
          color: white;
          padding: 0.5rem 1rem;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .article-content {
          padding: 2rem;
        }

        .article-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--primary-color);
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .article-excerpt {
          color: var(--text-light);
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .article-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--text-light);
          font-size: 0.9rem;
        }

        /* Events Section */
        .events-section {
          padding: 5rem 0;
          background: var(--bg-light);
        }

        .event-card {
          background: var(--white);
          overflow: hidden;
          position: relative;
          transition: all 0.3s ease;
          height: 100%;
          border: none;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }

        .event-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.2);
        }

        .event-image {
          height: 250px;
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
        }

        .event-date {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: var(--secondary-color);
          color: white;
          padding: 1rem;
          text-align: center;
          min-width: 80px;
        }

        .event-date .day {
          font-size: 2rem;
          font-weight: 900;
          line-height: 1;
        }

        .event-date .month {
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .event-content {
          padding: 2rem;
        }

        .event-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary-color);
          margin-bottom: 1rem;
          text-transform: uppercase;
        }

        .event-info {
          display: flex;
          gap: 2rem;
          margin-bottom: 1rem;
          color: var(--text-light);
          font-size: 0.9rem;
        }

        .event-info i {
          color: var(--secondary-color);
        }

        /* Review Section */
        .review-section {
          padding: 5rem 0;
          background: var(--white);
        }

        .review-card {
          background: var(--bg-light);
          border-radius: 0;
          padding: 2.5rem;
          position: relative;
          height: 100%;
          transition: all 0.3s ease;
          border-left: 4px solid var(--secondary-color);
        }

        .review-card:hover {
          transform: translateX(10px);
          box-shadow: var(--shadow);
        }

        .review-quote {
          font-size: 3rem;
          color: var(--secondary-color);
          position: absolute;
          top: 1rem;
          left: 1rem;
          opacity: 0.2;
        }

        .review-stars {
          color: #ffc107;
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }

        .review-content {
          position: relative;
          z-index: 1;
          font-style: italic;
          margin-bottom: 1.5rem;
          color: var(--text-dark);
          line-height: 1.8;
        }

        .review-author {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .review-avatar {
          width: 60px;
          height: 60px;
          background-size: cover;
          background-position: center;
          border-radius: 50%;
          border: 3px solid var(--secondary-color);
        }

        .review-author-info h5 {
          margin: 0;
          color: var(--primary-color);
          font-weight: 700;
        }

        .review-author-info p {
          margin: 0;
          color: var(--text-light);
          font-size: 0.9rem;
        }

        /* Partners Section */
        .partners-section {
          background: var(--bg-light);
          padding: 2rem 0;
        }

        .partner-logo {
          background: white;
          border-radius: 10px;
          padding: 1.5rem;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--text-light);
        }

        .partner-logo:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
          color: var(--secondary-color);
        }

        /* CTA Section */
        .cta-section {
          background: linear-gradient(135deg, var(--secondary-color), #ff4444);
          padding: 5rem 0;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .cta-content {
          position: relative;
          z-index: 1;
        }

        .cta-title {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          color: white;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin-bottom: 1rem;
        }

        .cta-subtitle {
          font-size: 1.3rem;
          color: rgba(255,255,255,0.9);
          margin-bottom: 3rem;
          font-weight: 300;
        }

        .btn-cta {
          background: white;
          color: var(--secondary-color);
          padding: 1rem 3rem;
          font-size: 1.1rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          border: 3px solid white;
          transition: all 0.3s ease;
        }

        .btn-cta:hover {
          background: transparent;
          color: white;
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.3);
        }

        /* Slider Styles */
        .slider-container {
          position: relative;
          overflow: hidden;
          padding-bottom: 3rem;
        }

        .slider-wrapper {
          display: flex;
          transition: transform 0.5s ease;
        }

        .slider-item {
          min-width: 25%;
          padding: 0 15px;
        }

        .slider-item.review-item {
          min-width: 33.333%;
        }

        @media (max-width: 991px) {
          .slider-item {
            min-width: 50%;
          }
          .slider-item.review-item {
            min-width: 50%;
          }
        }

        @media (max-width: 576px) {
          .slider-item {
            min-width: 100%;
          }
          .slider-item.review-item {
            min-width: 100%;
          }
        }

        /* Pagination Bullets */
        .pagination-bullets {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 2rem;
        }

        .bullet {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ddd;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .bullet.active {
          background: var(--secondary-color);
          width: 30px;
          border-radius: 5px;
        }

        /* Trainers section specific bullets */
        .trainers-section .bullet {
          background: rgba(255,255,255,0.3);
        }

        .trainers-section .bullet.active {
          background: var(--secondary-color);
        }

        /* Partner Slider */
        .partners-slider {
          overflow: hidden;
          padding: 2rem 0;
        }

        .partners-track {
          display: flex;
          animation: scrollPartners 30s linear infinite;
        }

        @keyframes scrollPartners {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .partner-item {
          min-width: 200px;
          margin: 0 1rem;
        }

        /* Loading States - เพิ่ม CSS สำหรับ loading */
        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-text {
          text-align: center;
          padding: 2rem;
          color: var(--text-light);
        }

        .error-text {
          text-align: center;
          padding: 2rem;
          color: var(--secondary-color);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .search-form {
            grid-template-columns: 1fr;
          }

          .btn-hero {
            padding: 0.8rem 2rem;
            font-size: 1rem;
          }

          .event-info {
            flex-direction: column;
            gap: 0.5rem;
          }

          .trainer-card {
            height: 450px;
          }

          .trainer-name {
            font-size: 1.5rem;
          }

          .trainer-social {
            right: 10px;
            top: 20px;
          }

          .social-link {
            width: 35px;
            height: 35px;
            font-size: 0.9rem;
          }

          .trainer-info {
            padding: 1.5rem;
            bottom: 15px;
          }

          .trainer-card:hover .trainer-info {
            bottom: 65px;
          }

          .btn-view-profile {
            padding: 0.7rem 2rem;
            bottom: 15px;
            left: 1.5rem;
            right: 1.5rem;
            width: calc(100% - 3rem);
          }

          .trainer-card:hover .trainer-accent {
            height: 130px;
          }

          .trainer-image::before {
            height: 45%;
          }

          .trainer-card:hover .trainer-image::before {
            height: 55%;
          }
        }
      `}</style>

      {/* Hero Section */}
      <section className="hero-section" id="home">
        <div className="particles">
          {generateParticles()}
        </div>
        <div className="container">
          <div className="row align-items-center min-vh-100">
            <div className="col-lg-7">
              <h1 className="hero-title">
                ค้นหาเทรนเนอร์<br />
                <span>ที่ใช่สำหรับคุณ</span>
              </h1>
              <p className="hero-subtitle">
                แพลตฟอร์มครบวงจรสำหรับการออกกำลังกาย พบกับเทรนเนอร์มืออาชีพ 
                จัดการโปรแกรมเทรน และติดตามความก้าวหน้า
              </p>
              <div className="hero-buttons">
                <button className="btn btn-hero btn-hero-primary" onClick={() => window.location.href = "/search"}>ค้นหาเทรนเนอร์</button>
                <button className="btn btn-hero btn-hero-outline" onClick={() => window.location.href = "/signup-trainer"}>สมัครเป็นเทรนเนอร์</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="search-section" id="search">
        <div className="container">
          <div className="search-container">
            <h2 className="section-title">ค้นหาเทรนเนอร์ที่เหมาะกับคุณ</h2>
            <div className="search-form">
              <div className="form-group">
                <label htmlFor="location">สถานที่</label>
                <input type="text" className="form-control" id="location" placeholder="กรุงเทพฯ, เชียงใหม่..." />
              </div>
              <div className="form-group">
                <label htmlFor="specialty">ความเชี่ยวชาญ</label>
                <select className="form-select" id="specialty">
                  <option value="">เลือกความเชี่ยวชาญ</option>
                  <option value="weight-loss">ลดน้ำหนัก</option>
                  <option value="muscle-gain">เพิ่มกล้ามเนื้อ</option>
                  <option value="cardio">คาร์ดิโอ</option>
                  <option value="yoga">โยคะ</option>
                  <option value="pilates">พิลาทิส</option>
                  <option value="boxing">มวยไทย</option>
                  <option value="crossfit">ครอสฟิต</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="price">งบประมาณ</label>
                <select className="form-select" id="price">
                  <option value="">เลือกงบประมาณ</option>
                  <option value="0-500">0-500 บาท</option>
                  <option value="500-1000">500-1,000 บาท</option>
                  <option value="1000-2000">1,000-2,000 บาท</option>
                  <option value="2000-3000">2,000-3,000 บาท</option>
                  <option value="3000+">3,000+ บาท</option>
                </select>
              </div>
              <div className="form-group">
                <label>&nbsp;</label>
                <button type="button" className="btn btn-primary-custom w-100" onClick={handleSearchSubmit}>
                  <i className="fas fa-search me-2"></i>ค้นหา
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Trainers Section - เพิ่ม loading states */}
      <section className="py-5 trainers-section" id="trainers" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title" style={{ color: 'white' }}>เทรนเนอร์แนะนำ</h2>
            <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.7)' }}>พบกับเทรนเนอร์คุณภาพที่ผ่านการคัดเลือก</p>
          </div>
          
          {trainersLoading ? (
            <div className="loading-text">
              <div className="loading-spinner"></div>
              <p style={{ color: 'white' }}>กำลังโหลดเทรนเนอร์...</p>
            </div>
          ) : trainersError ? (
            <div className="error-text">
              <p style={{ color: 'white' }}>เกิดข้อผิดพลาดในการโหลดข้อมูล กำลังใช้ข้อมูลตัวอย่าง</p>
            </div>
          ) : trainers.length === 0 ? (
            <div className="loading-text">
              <p style={{ color: 'white' }}>ไม่พบเทรนเนอร์แนะนำในขณะนี้</p>
            </div>
          ) : (
            <div className="slider-container">
              <div 
                className="slider-wrapper" 
                ref={trainersSliderRef}
                style={{
                  transform: `translateX(-${currentTrainerIndex * (100 / getItemsPerView())}%)`
                }}
              >
                {trainers.map(trainer => (
                  <TrainerCard key={trainer.id} trainer={trainer} />
                ))}
              </div>
              <div className="pagination-bullets">
                {Array.from({ length: Math.ceil(trainers.length / getItemsPerView()) }, (_, index) => (
                  <div
                    key={index}
                    className={`bullet ${Math.floor(currentTrainerIndex / getItemsPerView()) === index ? 'active' : ''}`}
                    onClick={() => setCurrentTrainerIndex(index * getItemsPerView())}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="text-center mt-5">
            <button className="btn btn-primary-custom" style={{ background: 'transparent', border: '2px solid var(--secondary-color)', color: 'white' }} onClick={() => window.location.href = "/search"}>
              ดูเทรนเนอร์ทั้งหมด
            </button>
          </div>
        </div>
      </section>

      {/* Events Section - เพิ่ม loading states */}
      <section className="events-section" id="events">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">อีเว้นท์</h2>
            <p className="section-subtitle">กิจกรรมและการแข่งขันที่น่าสนใจ</p>
          </div>
          
          {eventsLoading ? (
            <div className="loading-text">
              <div className="loading-spinner"></div>
              <p>กำลังโหลดอีเว้นท์...</p>
            </div>
          ) : eventsError ? (
            <div className="error-text">
              <p>เกิดข้อผิดพลาดในการโหลดข้อมูล กำลังใช้ข้อมูลตัวอย่าง</p>
            </div>
          ) : events.length === 0 ? (
            <div className="loading-text">
              <p>ไม่พบอีเว้นท์ในขณะนี้</p>
            </div>
          ) : (
            <div className="row g-4">
              {events.map(event => (
                <div key={event.id} className="col-lg-6">
                  <div className="event-card fade-in">
                    <div 
                      className="event-image" 
                      style={{
                        backgroundImage: `linear-gradient(rgba(35, 41, 86, 0.3), rgba(35, 41, 86, 0.7)), url(${event.image})`
                      }}
                    >
                      <div className="event-date">
                        <div className="day">{event.day}</div>
                        <div className="month">{event.month}</div>
                      </div>
                    </div>
                    <div className="event-content">
                      <h3 className="event-title">{event.title}</h3>
                      <div className="event-info">
                        <span><i className="fas fa-clock me-2"></i>{event.time}</span>
                        <span><i className="fas fa-map-marker-alt me-2"></i>{event.location}</span>
                      </div>
                      <p>{event.description}</p>
                      <button 
                        className="btn btn-primary-custom"
                        onClick={() => window.location.href = `/events/${event.id}`}
                      >
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-5">
            <button className="btn btn-primary-custom" onClick={() => window.location.href = "/events"}>ดูอีเว้นท์ทั้งหมด</button>
          </div>
        </div>
      </section>

      {/* Articles Section - เพิ่ม loading states */}
      <section className="py-5 bg-light" id="articles">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">ข่าวสารและบทความ</h2>
            <p className="section-subtitle">อัพเดทข้อมูลด้านสุขภาพและการออกกำลังกาย</p>
          </div>
          
          {articlesLoading ? (
            <div className="loading-text">
              <div className="loading-spinner"></div>
              <p>กำลังโหลดบทความ...</p>
            </div>
          ) : articlesError ? (
            <div className="error-text">
              <p>เกิดข้อผิดพลาดในการโหลดข้อมูล กำลังใช้ข้อมูลตัวอย่าง</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="loading-text">
              <p>ไม่พบบทความในขณะนี้</p>
            </div>
          ) : (
            <div className="row g-4">
              {articles.map(article => (
                <div key={article.id} className="col-lg-4 col-md-6">
                  <div className="article-card fade-in">
                    <div 
                      className="article-image" 
                      style={{ backgroundImage: `url(${article.image})` }}
                    >
                      <div className="article-category">{article.category}</div>
                    </div>
                    <div className="article-content">
                      <h4 className="article-title">{article.title}</h4>
                      <p className="article-excerpt">{article.excerpt}</p>
                      <div className="article-meta">
                        <span><i className="fas fa-calendar me-1"></i>{article.date}</span>
                        <a 
                          href={`/articles/${article.id}`} 
                          className="text-decoration-none" 
                          style={{ color: 'var(--secondary-color)' }}
                        >
                          อ่านต่อ →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-5">
            <button className="btn btn-primary-custom" onClick={() => window.location.href = "/articles"}>อ่านบทความทั้งหมด</button>
          </div>
        </div>
      </section>

      {/* Reviews Section - เพิ่ม loading states */}
      <section className="review-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">รีวิวจากลูกค้า</h2>
            <p className="section-subtitle">เสียงจากผู้ใช้งานจริง</p>
          </div>
          
          {reviewsLoading ? (
            <div className="loading-text">
              <div className="loading-spinner"></div>
              <p>กำลังโหลดรีวิว...</p>
            </div>
          ) : reviewsError ? (
            <div className="error-text">
              <p>เกิดข้อผิดพลาดในการโหลดข้อมูล กำลังใช้ข้อมูลตัวอย่าง</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="loading-text">
              <p>ไม่พบรีวิวในขณะนี้</p>
            </div>
          ) : (
            <div className="slider-container">
              <div 
                className="slider-wrapper" 
                ref={reviewsSliderRef}
                style={{
                  transform: `translateX(-${currentReviewIndex * (100 / getReviewItemsPerView())}%)`
                }}
              >
                {reviews.map(review => (
                  <div key={review.id} className="slider-item review-item">
                    <div className="review-card">
                      <div className="review-quote">
                        <i className="fas fa-quote-left"></i>
                      </div>
                      <div className="review-stars">
                        {review.stars}
                      </div>
                      <p className="review-content">{review.content}</p>
                      <div className="review-author">
                        <div 
                          className="review-avatar" 
                          style={{ backgroundImage: `url(${review.image})` }}
                        />
                        <div className="review-author-info">
                          <h5>{review.name}</h5>
                          <p>{review.program}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pagination-bullets">
                {Array.from({ length: Math.ceil(reviews.length / getReviewItemsPerView()) }, (_, index) => (
                  <div
                    key={index}
                    className={`bullet ${Math.floor(currentReviewIndex / getReviewItemsPerView()) === index ? 'active' : ''}`}
                    onClick={() => setCurrentReviewIndex(index * getReviewItemsPerView())}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Partners Section - ไม่เปลี่ยนแปลง */}
      <section className="partners-section">
        <div className="container">
          <div className="partners-slider">
            <div className="partners-track">
              {/* First set */}
              <div className="partner-item">
                <div className="partner-logo">
                  <i className="fas fa-dumbbell me-2"></i>Fitness First
                </div>
              </div>
              <div className="partner-item">
                <div className="partner-logo">
                  <i className="fas fa-heartbeat me-2"></i>Virgin Active
                </div>
              </div>
              <div className="partner-item">
                <div className="partner-logo">
                  <i className="fas fa-running me-2"></i>True Fitness
                </div>
              </div>
              <div className="partner-item">
                <div className="partner-logo">
                  <i className="fas fa-spa me-2"></i>Yoga Master
                </div>
              </div>
              <div className="partner-item">
                <div className="partner-logo">
                  <i className="fas fa-bicycle me-2"></i>Spin Studio
                </div>
              </div>
              <div className="partner-item">
                <div className="partner-logo">
                  <i className="fas fa-swimmer me-2"></i>Aqua Fitness
                </div>
              </div>
              {/* Duplicate for infinite scroll */}
              <div className="partner-item">
                <div className="partner-logo">
                  <i className="fas fa-dumbbell me-2"></i>Fitness First
                </div>
              </div>
              <div className="partner-item">
                <div className="partner-logo">
                  <i className="fas fa-heartbeat me-2"></i>Virgin Active
                </div>
              </div>
              <div className="partner-item">
                <div className="partner-logo">
                  <i className="fas fa-running me-2"></i>True Fitness
                </div>
              </div>
              <div className="partner-item">
                <div className="partner-logo">
                  <i className="fas fa-spa me-2"></i>Yoga Master
                </div>
              </div>
              <div className="partner-item">
                <div className="partner-logo">
                  <i className="fas fa-bicycle me-2"></i>Spin Studio
                </div>
              </div>
              <div className="partner-item">
                <div className="partner-logo">
                  <i className="fas fa-swimmer me-2"></i>Aqua Fitness
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">สมัครเป็นเทรนเนอร์กับเรา</h2>
          <p className="cta-subtitle">เข้าร่วมกับเครือข่ายเทรนเนอร์มืออาชีพ และเข้าถึงลูกค้าได้มากขึ้น</p>
          <button className="btn btn-cta" onClick={() => window.location.href = "/signup-trainer"}>สมัครเป็นเทรนเนอร์</button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;