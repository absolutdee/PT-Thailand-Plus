import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TrainerDetail = () => {
  const { trainerId } = useParams();
  const navigate = useNavigate();
  
  // State สำหรับข้อมูลเทรนเนอร์
  const [trainerData, setTrainerData] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [packages, setPackages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [skills, setSkills] = useState([]);
  
  // State สำหรับ UI
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API Base URL (ควรเก็บใน environment variables)
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // ฟังก์ชันสำหรับเรียก API
  const fetchTrainerData = async (id) => {
    try {
      setLoading(true);
      setError(null);

      // เรียกข้อมูลเทรนเนอร์หลัก
      const trainerResponse = await fetch(`${API_BASE_URL}/trainers/${id}`);
      if (!trainerResponse.ok) {
        throw new Error('ไม่พบข้อมูลเทรนเนอร์');
      }
      const trainer = await trainerResponse.json();
      setTrainerData(trainer);

      // เรียกข้อมูลรูปภาพแกลเลอรี่
      const galleryResponse = await fetch(`${API_BASE_URL}/trainers/${id}/gallery`);
      if (galleryResponse.ok) {
        const galleryData = await galleryResponse.json();
        setGalleryImages(galleryData);
      }

      // เรียกข้อมูลแพคเกจ
      const packagesResponse = await fetch(`${API_BASE_URL}/trainers/${id}/packages`);
      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json();
        setPackages(packagesData);
      }

      // เรียกข้อมูลรีวิว
      const reviewsResponse = await fetch(`${API_BASE_URL}/trainers/${id}/reviews`);
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);
      }

      // เรียกข้อมูลการศึกษา
      const educationResponse = await fetch(`${API_BASE_URL}/trainers/${id}/education`);
      if (educationResponse.ok) {
        const educationData = await educationResponse.json();
        setEducation(educationData);
      }

      // เรียกข้อมูลประสบการณ์ทำงาน
      const experienceResponse = await fetch(`${API_BASE_URL}/trainers/${id}/experience`);
      if (experienceResponse.ok) {
        const experienceData = await experienceResponse.json();
        setExperience(experienceData);
      }

      // เรียกข้อมูลใบรับรอง
      const certificationsResponse = await fetch(`${API_BASE_URL}/trainers/${id}/certifications`);
      if (certificationsResponse.ok) {
        const certificationsData = await certificationsResponse.json();
        setCertifications(certificationsData);
      }

      // เรียกข้อมูลทักษะ
      const skillsResponse = await fetch(`${API_BASE_URL}/trainers/${id}/skills`);
      if (skillsResponse.ok) {
        const skillsData = await skillsResponse.json();
        setSkills(skillsData);
      }

    } catch (err) {
      setError(err.message);
      console.error('Error fetching trainer data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับเลือกแพคเกจ
  const handlePackageSelect = async (packageId, packageName, packagePrice) => {
    try {
      // ส่งข้อมูลไปยัง API เพื่อสร้างการจอง
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // ถ้ามี authentication
        },
        body: JSON.stringify({
          trainer_id: trainerId,
          package_id: packageId,
          package_name: packageName,
          price: packagePrice
        })
      });

      if (response.ok) {
        const bookingData = await response.json();
        alert(`เลือกแพคเกจ: ${packageName} สำเร็จ!`);
        // นำทางไปยังหน้าชำระเงินหรือยืนยันการจอง
        navigate(`/booking-confirmation/${bookingData.booking_id}`);
      } else {
        throw new Error('ไม่สามารถสร้างการจองได้');
      }
    } catch (err) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  // ฟังก์ชันสำหรับติดต่อเทรนเนอร์
  const handleContact = async (type) => {
    if (type === 'chat') {
      try {
        // สร้างห้องแชทใหม่หรือเปิดห้องแชทที่มีอยู่
        const response = await fetch(`${API_BASE_URL}/chats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            trainer_id: trainerId,
            customer_id: localStorage.getItem('user_id') // ควรเก็บ user ID หลังจาก login
          })
        });

        if (response.ok) {
          const chatData = await response.json();
          navigate(`/chat/${chatData.chat_id}`);
        } else {
          throw new Error('ไม่สามารถเปิดแชทได้');
        }
      } catch (err) {
        alert(`เกิดข้อผิดพลาด: ${err.message}`);
      }
    } else if (type === 'call') {
      window.location.href = `tel:${trainerData?.phone || '+66123456789'}`;
    }
  };

  // โหลดข้อมูลเมื่อ component mount
  useEffect(() => {
    if (trainerId) {
      fetchTrainerData(trainerId);
    }
  }, [trainerId]);

  // Skill bars animation on mount
  useEffect(() => {
    if (skills.length > 0) {
      const skillBars = document.querySelectorAll('.skill-progress');
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const bar = entry.target;
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
              bar.style.width = width;
            }, 100);
          }
        });
      });

      skillBars.forEach(bar => {
        observer.observe(bar);
      });

      return () => observer.disconnect();
    }
  }, [skills]);

  // Handle keyboard navigation for gallery
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showModal) {
        if (e.key === 'ArrowLeft') {
          showPrevImage();
        } else if (e.key === 'ArrowRight') {
          showNextImage();
        } else if (e.key === 'Escape') {
          setShowModal(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, currentImageIndex]);

  const openGallery = (index) => {
    setCurrentImageIndex(index);
    setShowModal(true);
  };

  const showPrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const showNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  // แสดง Loading
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{minHeight: '100vh'}}>
        <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
          <span className="visually-hidden">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  // แสดง Error
  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h4>เกิดข้อผิดพลาด</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => fetchTrainerData(trainerId)}>
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // ถ้าไม่มีข้อมูลเทรนเนอร์
  if (!trainerData) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning text-center">
          <h4>ไม่พบข้อมูลเทรนเนอร์</h4>
          <p>ไม่พบข้อมูลเทรนเนอร์ที่คุณค้นหา</p>
          <button className="btn btn-primary" onClick={() => navigate('/search')}>
            กลับไปหน้าค้นหา
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
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

        H1, H4 {
        color: #ffffff;
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

        .btn-primary-custom {
          background: var(--secondary-color);
          border: none;
          color: white;
          padding: 0.7rem 2.5rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
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
        }

        .breadcrumb-item + .breadcrumb-item::before {
          content: "›";
          color: var(--text-light);
          margin: 0 0.5rem;
        }

        /* Main Content */
        .main-content {
          padding: 1.5rem 0 3rem;
          min-height: 100vh;
          margin: 0 auto;
        }

        /* Profile Card */
        .profile-card {
          background: white;
          border-radius: 16px;
          box-shadow: var(--shadow);
          overflow: hidden;
          position: sticky;
          top: 20px;
        }

        .profile-header {
          position: relative;
          padding: 2rem;
          text-align: center;
          background: linear-gradient(135deg, var(--primary-color) 0%, #1a1f4a 100%);
          color: white;
        }

        .profile-image {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          object-fit: cover;
          border: 6px solid rgba(255,255,255,0.2);
          margin-bottom: 1rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .profile-name {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .profile-title {
          font-size: 1.1rem;
          color: rgba(255,255,255,0.9);
          margin-bottom: 1.5rem;
        }

        .rating-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          margin-bottom: 1rem;
        }

        .stars {
          color: #ffc107;
          font-size: 1.2rem;
        }

        .rating-text {
          font-size: 1rem;
          font-weight: 600;
        }

        .profile-info {
          padding: 1.5rem 2rem;
        }

        .info-item {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .info-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .info-icon {
          width: 40px;
          height: 40px;
          background: var(--bg-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 1rem;
          color: var(--secondary-color);
        }

        .info-content h6 {
          margin: 0;
          color: var(--text-light);
          font-size: 0.85rem;
          font-weight: 500;
        }

        .info-content p {
          margin: 0;
          color: var(--text-dark);
          font-weight: 600;
        }

        .social-links {
          display: flex;
          justify-content: center;
          gap: 1rem;
          padding: 1.5rem 2rem 2rem;
          border-top: 1px solid #f0f0f0;
        }

        .social-link {
          width: 40px;
          height: 40px;
          background: var(--primary-color);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .social-link:hover {
          background: var(--secondary-color);
          color: white;
          transform: translateY(-2px);
        }

        /* Content Card */
        .content-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          margin-bottom: 2rem;
          overflow: hidden;
        }

        .content-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #f0f0f0;
          background: var(--bg-light);
        }

        .content-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary-color);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .content-body {
          padding: 2rem;
        }

        /* Skills Progress Bars */
        .skill-item {
          margin-bottom: 1.5rem;
        }

        .skill-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .skill-name {
          font-weight: 600;
          color: var(--text-dark);
        }

        .skill-percentage {
          font-weight: 700;
          color: var(--secondary-color);
        }

        .skill-bar {
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .skill-progress {
          height: 100%;
          background: linear-gradient(90deg, var(--secondary-color), var(--accent-color));
          border-radius: 4px;
          transition: width 1s ease-in-out;
        }

        /* Timeline */
        .timeline {
          position: relative;
          padding-left: 1rem;
        }

        .timeline::before {
          content: '';
          position: absolute;
          left: 15px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--secondary-color);
        }

        .timeline-item {
          position: relative;
          margin-bottom: 2rem;
          padding-left: 2rem;
        }

        .timeline-item::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 5px;
          width: 16px;
          height: 16px;
          background: var(--secondary-color);
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .timeline-content {
          background: var(--bg-light);
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .timeline-date {
          color: var(--secondary-color);
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .timeline-title {
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 0.5rem;
        }

        .timeline-organization {
          color: var(--text-light);
          font-style: italic;
          margin-bottom: 0.5rem;
        }

        .timeline-description {
          color: var(--text-light);
          line-height: 1.6;
          margin: 0;
        }

        /* Gallery */
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .gallery-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .gallery-item:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .gallery-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .gallery-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(35, 41, 86, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .gallery-item:hover .gallery-overlay {
          opacity: 1;
        }

        .gallery-icon {
          color: white;
          font-size: 2rem;
        }

        /* Package Cards */
        .packages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        @media (min-width: 992px) {
          .packages-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.2rem;
          }
        }

        @media (min-width: 768px) and (max-width: 991px) {
          .packages-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.3rem;
          }
        }

        .package-card {
          background: white;
          border-radius: 16px;
          border: 2px solid #f0f0f0;
          overflow: hidden;
          transition: all 0.3s ease;
          position: relative;
        }

        .package-card.recommended {
          border-color: var(--secondary-color);
          transform: scale(1.05);
        }

        .package-card.recommended::before {
          content: 'แนะนำ';
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: var(--secondary-color);
          color: white;
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          z-index: 1;
        }

        .package-card:hover {
          box-shadow: 0 15px 40px rgba(0,0,0,0.15);
          transform: translateY(-5px);
        }

        .package-card.recommended:hover {
          transform: scale(1.05) translateY(-5px);
        }

        .package-header {
          padding: 2rem;
          text-align: center;
          background: linear-gradient(135deg, var(--bg-light) 0%, #e8f0fe 100%);
        }

        .package-card.recommended .package-header {
          background: linear-gradient(135deg, var(--secondary-color) 0%, var(--accent-color) 100%);
          color: white;
        }

        .package-name {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .package-price {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }

        .package-period {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .package-features {
          padding: 2rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          margin-bottom: 0.8rem;
          padding: 0.5rem 0;
        }

        .feature-icon {
          width: 20px;
          height: 20px;
          background: var(--secondary-color);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 1rem;
          font-size: 0.7rem;
        }

        .feature-text {
          color: var(--text-dark);
        }

        .package-footer {
          padding: 1.5rem 2rem 2rem;
        }

        .btn-package {
          width: 100%;
          padding: 0.8rem;
          border-radius: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }

        .btn-package-primary {
          background: var(--secondary-color);
          color: white;
          border: 2px solid var(--secondary-color);
        }

        .btn-package-secondary {
          background: transparent;
          color: var(--secondary-color);
          border: 2px solid var(--secondary-color);
        }

        .btn-package:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(223, 37, 40, 0.3);
        }

        /* Reviews */
        .review-item {
          background: var(--bg-light);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          position: relative;
        }

        .review-header {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
        }

        .review-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
          margin-right: 1rem;
          border: 3px solid white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .review-info h6 {
          margin: 0;
          font-weight: 600;
          color: var(--text-dark);
        }

        .review-rating {
          color: #ffc107;
          margin: 0.2rem 0;
        }

        .review-date {
          font-size: 0.8rem;
          color: var(--text-light);
        }

        .review-text {
          color: var(--text-dark);
          line-height: 1.6;
          margin: 0;
          font-style: italic;
        }

        .review-item::before {
          content: '"';
          position: absolute;
          top: -10px;
          left: 20px;
          font-size: 4rem;
          color: var(--secondary-color);
          opacity: 0.3;
          font-family: serif;
        }

        /* Quote Block */
        .quote-block {
          background: linear-gradient(135deg, var(--secondary-color), var(--accent-color));
          color: white;
          padding: 2rem;
          border-radius: 12px;
          margin: 2rem 0;
          position: relative;
        }

        .quote-block::before {
          content: '';
          position: absolute;
          top: -9px;
          left: 0px;
          width: 0;
          height: 0;
          border-left: 10px solid var(--secondary-color);
          border-top: 10px solid transparent;
          border-bottom: 10px solid transparent;
        }

        /* Contact Action */
        .contact-action {
          background: linear-gradient(135deg, var(--primary-color), #1a1f4a);
          color: white;
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          margin-top: 2rem;
        }

        .contact-action h4 {
          margin-bottom: 1rem;
        }

        .contact-action p {
          margin-bottom: 1.5rem;
          opacity: 0.9;
        }

        .btn-contact {
          background: white;
          color: var(--primary-color);
          padding: 0.8rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          text-decoration: none;
          display: inline-block;
          transition: all 0.3s ease;
          margin: 0 0.5rem;
          border: none;
          cursor: pointer;
        }

        .btn-contact:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255,255,255,0.3);
          color: var(--primary-color);
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
        }

        .modal-content-custom {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
        }

        .modal-image {
          max-width: 100%;
          max-height: 90vh;
          border-radius: 8px;
        }

        .modal-close {
          position: absolute;
          top: 10px;
          right: 10px;
          background: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: white;
          border: none;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-nav.prev {
          left: 20px;
        }

        .modal-nav.next {
          right: 20px;
        }

        .modal-counter {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
        }

        /* Responsive */
        @media (max-width: 991px) {
          .profile-card {
            position: static;
            margin-bottom: 2rem;
          }

          .profile-header {
            padding: 1.5rem;
          }

          .profile-image {
            width: 150px;
            height: 150px;
          }

          .profile-name {
            font-size: 1.5rem;
          }

          .content-body {
            padding: 1.5rem;
          }

          .gallery-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .package-card.recommended {
            transform: none;
          }

          .package-card.recommended:hover {
            transform: translateY(-5px);
          }
        }

        @media (max-width: 767px) {
          .packages-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }

        @media (max-width: 576px) {
          .profile-header {
            padding: 1rem;
          }

          .profile-image {
            width: 120px;
            height: 120px;
          }

          .profile-name {
            font-size: 1.3rem;
          }

          .content-body {
            padding: 1rem;
          }

          .timeline {
            padding-left: 1rem;
          }

          .timeline-item {
            padding-left: 1.5rem;
          }

          .gallery-grid {
            grid-template-columns: 1fr;
          }

          .packages-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="main-content">
        <div className="container">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="mb-3">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/" style={{color: 'var(--secondary-color)', textDecoration: 'none'}}>หน้าแรก</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/search" style={{color: 'var(--secondary-color)', textDecoration: 'none'}}>ค้นหาเทรนเนอร์</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">รายละเอียดเทรนเนอร์</li>
            </ol>
          </nav>

          <div className="row">
            {/* Left Column - Profile Card */}
            <div className="col-lg-3">
              <div className="profile-card">
                <div className="profile-header">
                  <img 
                    src={trainerData.profile_image || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=400&fit=crop"} 
                    alt={trainerData.name || trainerData.first_name + ' ' + trainerData.last_name} 
                    className="profile-image" 
                  />
                  <h1 className="profile-name">
                    {trainerData.name || `${trainerData.first_name} ${trainerData.last_name}`}
                  </h1>
                  <p className="profile-title">{trainerData.specialization || trainerData.title}</p>
                  <div className="rating-display">
                    <div className="stars">
                      {[...Array(5)].map((_, i) => (
                        <i 
                          key={i} 
                          className={`fas fa-star ${i < Math.floor(trainerData.rating || 0) ? '' : 'far'}`}
                        />
                      ))}
                    </div>
                    <span className="rating-text">
                      {trainerData.rating || 0} ({trainerData.total_reviews || 0} รีวิว)
                    </span>
                  </div>
                </div>
                
                <div className="profile-info">
                  <div className="info-item">
                    <div className="info-icon">
                      <i className="fas fa-phone"></i>
                    </div>
                    <div className="info-content">
                      <h6>เบอร์โทรศัพท์</h6>
                      <p>{trainerData.phone || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-icon">
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <div className="info-content">
                      <h6>พื้นที่บริการ</h6>
                      <p>{trainerData.service_areas || trainerData.location || 'ไม่ระบุ'}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-icon">
                      <i className="fas fa-clock"></i>
                    </div>
                    <div className="info-content">
                      <h6>ประสบการณ์</h6>
                      <p>{trainerData.experience_years || 0} ปี</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-icon">
                      <i className="fas fa-tag"></i>
                    </div>
                    <div className="info-content">
                      <h6>ราคา (ต่อชั่วโมง)</h6>
                      <p style={{color: 'var(--secondary-color)', fontWeight: 700}}>
                        ฿{trainerData.hourly_rate ? Number(trainerData.hourly_rate).toLocaleString() : 'ไม่ระบุ'}
                      </p>
                    </div>
                  </div>
                </div>

                {trainerData.social_links && (
                  <div className="social-links">
                    {trainerData.social_links.facebook && (
                      <a href={trainerData.social_links.facebook} className="social-link" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-facebook-f"></i>
                      </a>
                    )}
                    {trainerData.social_links.instagram && (
                      <a href={trainerData.social_links.instagram} className="social-link" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-instagram"></i>
                      </a>
                    )}
                    {trainerData.social_links.line && (
                      <a href={trainerData.social_links.line} className="social-link" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-line"></i>
                      </a>
                    )}
                    {trainerData.social_links.tiktok && (
                      <a href={trainerData.social_links.tiktok} className="social-link" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-tiktok"></i>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="col-lg-9">
              {/* Personal Details & Skills */}
              <div className="content-card">
                <div className="content-header">
                  <h2 className="content-title">
                    <i className="fas fa-user"></i>
                    ข้อมูลส่วนตัวและความเชี่ยวชาญ
                  </h2>
                </div>
                <div className="content-body">
                  <p className="mb-4">{trainerData.bio || trainerData.description || 'ไม่มีข้อมูลส่วนตัว'}</p>
                  
                  {trainerData.quote && (
                    <div className="quote-block">
                      <p className="mb-0">"{trainerData.quote}"</p>
                    </div>
                  )}

                  {skills.length > 0 && (
                    <div className="row">
                      <div className="col-md-6">
                        {skills.slice(0, Math.ceil(skills.length / 2)).map((skill, index) => (
                          <div key={skill.id || index} className="skill-item">
                            <div className="skill-header">
                              <span className="skill-name">{skill.name}</span>
                              <span className="skill-percentage">{skill.percentage}%</span>
                            </div>
                            <div className="skill-bar">
                              <div className="skill-progress" style={{width: `${skill.percentage}%`}}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="col-md-6">
                        {skills.slice(Math.ceil(skills.length / 2)).map((skill, index) => (
                          <div key={skill.id || index} className="skill-item">
                            <div className="skill-header">
                              <span className="skill-name">{skill.name}</span>
                              <span className="skill-percentage">{skill.percentage}%</span>
                            </div>
                            <div className="skill-bar">
                              <div className="skill-progress" style={{width: `${skill.percentage}%`}}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Education */}
              {education.length > 0 && (
                <div className="content-card">
                  <div className="content-header">
                    <h2 className="content-title">
                      <i className="fas fa-graduation-cap"></i>
                      ประวัติการศึกษา
                    </h2>
                  </div>
                  <div className="content-body">
                    <div className="timeline">
                      {education.map((edu, index) => (
                        <div key={edu.id || index} className="timeline-item">
                          <div className="timeline-content">
                            <div className="timeline-date">{edu.start_year} - {edu.end_year || 'ปัจจุบัน'}</div>
                            <h5 className="timeline-title">{edu.degree}</h5>
                            <div className="timeline-organization">{edu.institution}</div>
                            {edu.description && (
                              <p className="timeline-description">{edu.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Work Experience */}
              {experience.length > 0 && (
                <div className="content-card">
                  <div className="content-header">
                    <h2 className="content-title">
                      <i className="fas fa-briefcase"></i>
                      ประวัติการทำงาน
                    </h2>
                  </div>
                  <div className="content-body">
                    <div className="timeline">
                      {experience.map((exp, index) => (
                        <div key={exp.id || index} className="timeline-item">
                          <div className="timeline-content">
                            <div className="timeline-date">{exp.start_year} - {exp.end_year || 'ปัจจุบัน'}</div>
                            <h5 className="timeline-title">{exp.position}</h5>
                            <div className="timeline-organization">{exp.company}</div>
                            {exp.description && (
                              <p className="timeline-description">{exp.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Certifications */}
              {certifications.length > 0 && (
                <div className="content-card">
                  <div className="content-header">
                    <h2 className="content-title">
                      <i className="fas fa-certificate"></i>
                      การอบรมและใบรับรอง
                    </h2>
                  </div>
                  <div className="content-body">
                    <div className="timeline">
                      {certifications.map((cert, index) => (
                        <div key={cert.id || index} className="timeline-item">
                          <div className="timeline-content">
                            <div className="timeline-date">{cert.year}</div>
                            <h5 className="timeline-title">{cert.name}</h5>
                            <div className="timeline-organization">{cert.issuing_organization}</div>
                            {cert.description && (
                              <p className="timeline-description">{cert.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Gallery */}
              {galleryImages.length > 0 && (
                <div className="content-card">
                  <div className="content-header">
                    <h2 className="content-title">
                      <i className="fas fa-images"></i>
                      แกลเลอรี่
                    </h2>
                  </div>
                  <div className="content-body">
                    <div className="gallery-grid">
                      {galleryImages.map((image, index) => (
                        <div key={image.id || index} className="gallery-item" onClick={() => openGallery(index)}>
                          <img src={image.image_url || image.url} alt={image.caption || image.alt || `Gallery ${index + 1}`} className="gallery-image" />
                          <div className="gallery-overlay">
                            <i className="fas fa-search-plus gallery-icon"></i>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Packages */}
              {packages.length > 0 && (
                <div className="content-card">
                  <div className="content-header">
                    <h2 className="content-title">
                      <i className="fas fa-box-open"></i>
                      แพคเกจบริการ
                    </h2>
                  </div>
                  <div className="content-body">
                    <div className="packages-grid">
                      {packages.map((pkg, index) => (
                        <div key={pkg.id || index} className={`package-card ${pkg.is_recommended ? 'recommended' : ''}`}>
                          <div className="package-header">
                            <h3 className="package-name">{pkg.name}</h3>
                            <div className="package-price">฿{Number(pkg.price).toLocaleString()}</div>
                            <div className="package-period">/ {pkg.sessions} เซสชั่น</div>
                          </div>
                          <div className="package-features">
                            {pkg.features && pkg.features.map((feature, featureIndex) => (
                              <div key={featureIndex} className="feature-item">
                                <div className="feature-icon">
                                  <i className="fas fa-check"></i>
                                </div>
                                <span className="feature-text">{feature}</span>
                              </div>
                            ))}
                          </div>
                          <div className="package-footer">
                            <button 
                              className={`btn-package ${pkg.is_recommended ? 'btn-package-primary' : 'btn-package-secondary'}`}
                              onClick={() => handlePackageSelect(pkg.id, pkg.name, `฿${Number(pkg.price).toLocaleString()}`)}
                            >
                              เลือกแพคเกจ
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <div className="content-card">
                  <div className="content-header">
                    <h2 className="content-title">
                      <i className="fas fa-star"></i>
                      รีวิวจากลูกค้า
                    </h2>
                  </div>
                  <div className="content-body">
                    {reviews.map((review, index) => (
                      <div key={review.id || index} className="review-item">
                        <div className="review-header">
                          <img 
                            src={review.customer_avatar || review.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"} 
                            alt={review.customer_name || review.name} 
                            className="review-avatar" 
                          />
                          <div className="review-info">
                            <h6>{review.customer_name || review.name}</h6>
                            <div className="review-rating">
                              {[...Array(5)].map((_, i) => (
                                <i 
                                  key={i} 
                                  className={`fas fa-star ${i < (review.rating || 0) ? '' : 'far'}`}
                                />
                              ))}
                            </div>
                            <div className="review-date">
                              {new Date(review.created_at || review.date).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                        <p className="review-text">{review.comment || review.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Action */}
              <div className="contact-action">
                <h4>พร้อมเริ่มต้นการเปลี่ยนแปลงแล้วหรือยัง?</h4>
                <p>ติดต่อผมวันนี้เพื่อเริ่มต้นการเดินทางสู่ร่างกายและสุขภาพที่ดีขึ้น</p>
                <button className="btn-contact" onClick={() => handleContact('chat')}>
                  <i className="fas fa-comments" style={{marginRight: '0.5rem'}}></i>แชทกับเทรนเนอร์
                </button>
                <button className="btn-contact" onClick={() => handleContact('call')}>
                  <i className="fas fa-phone" style={{marginRight: '0.5rem'}}></i>โทรเลย
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {showModal && galleryImages.length > 0 && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>
              <i className="fas fa-times"></i>
            </button>
            <img 
              src={galleryImages[currentImageIndex].image_url || galleryImages[currentImageIndex].url} 
              alt={galleryImages[currentImageIndex].caption || galleryImages[currentImageIndex].alt || 'Gallery'} 
              className="modal-image"
            />
            <button className="modal-nav prev" onClick={showPrevImage}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <button className="modal-nav next" onClick={showNextImage}>
              <i className="fas fa-chevron-right"></i>
            </button>
            <div className="modal-counter">
              {currentImageIndex + 1} / {galleryImages.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TrainerDetail;