import React, { useState, useEffect } from 'react';

const ContactPage = () => {
  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  // UI States
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Contact Info State - ดึงจากฐานข้อมูล
  const [contactInfo, setContactInfo] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [quickContactCards, setQuickContactCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // Load contact information from database
  useEffect(() => {
    loadContactData();
  }, []);

  // ฟังก์ชันดึงข้อมูลติดต่อจากฐานข้อมูล
  const loadContactData = async () => {
    try {
      setIsLoading(true);
      
      // Parallel API calls to load all contact data
      const [contactInfoRes, socialLinksRes, quickContactRes] = await Promise.all([
        fetch(`${API_BASE_URL}/contact/info`),
        fetch(`${API_BASE_URL}/contact/social-links`),
        fetch(`${API_BASE_URL}/contact/quick-contact`)
      ]);

      if (contactInfoRes.ok) {
        const contactData = await contactInfoRes.json();
        setContactInfo(contactData.data || getDefaultContactInfo());
      } else {
        setContactInfo(getDefaultContactInfo());
      }

      if (socialLinksRes.ok) {
        const socialData = await socialLinksRes.json();
        setSocialLinks(socialData.data || getDefaultSocialLinks());
      } else {
        setSocialLinks(getDefaultSocialLinks());
      }

      if (quickContactRes.ok) {
        const quickData = await quickContactRes.json();
        setQuickContactCards(quickData.data || getDefaultQuickContact());
      } else {
        setQuickContactCards(getDefaultQuickContact());
      }

    } catch (error) {
      console.error('Error loading contact data:', error);
      // ใช้ข้อมูล default หากไม่สามารถโหลดจาก API ได้
      setContactInfo(getDefaultContactInfo());
      setSocialLinks(getDefaultSocialLinks());
      setQuickContactCards(getDefaultQuickContact());
    } finally {
      setIsLoading(false);
    }
  };

  // Default contact info (fallback)
  const getDefaultContactInfo = () => [
    {
      icon: 'fas fa-map-marker-alt',
      title: 'ที่อยู่',
      content: ['123/45 อาคารฟิตเนสเซ็นเตอร์ ชั้น 5', 'ถนนสุขุมวิท แขวงคลองเตย', 'เขตคลองเตย กรุงเทพฯ 10110']
    },
    {
      icon: 'fas fa-phone',
      title: 'โทรศัพท์',
      content: ['02-123-4567', '089-123-4567'],
      links: ['tel:021234567', 'tel:0891234567']
    },
    {
      icon: 'fas fa-envelope',
      title: 'อีเมล',
      content: ['info@fitconnect.co.th', 'support@fitconnect.co.th'],
      links: ['mailto:info@fitconnect.co.th', 'mailto:support@fitconnect.co.th']
    },
    {
      icon: 'fas fa-clock',
      title: 'เวลาทำการ',
      content: ['จันทร์ - ศุกร์: 09:00 - 18:00', 'เสาร์ - อาทิตย์: 10:00 - 17:00']
    }
  ];

  // Default social links (fallback)
  const getDefaultSocialLinks = () => [
    { icon: 'fab fa-facebook-f', href: '#', name: 'Facebook' },
    { icon: 'fab fa-instagram', href: '#', name: 'Instagram' },
    { icon: 'fab fa-twitter', href: '#', name: 'Twitter' },
    { icon: 'fab fa-youtube', href: '#', name: 'YouTube' },
    { icon: 'fab fa-line', href: '#', name: 'Line' }
  ];

  // Default quick contact cards (fallback)
  const getDefaultQuickContact = () => [
    {
      icon: 'fas fa-headset',
      title: 'ฝ่ายบริการลูกค้า',
      description: 'ทีมงานพร้อมให้บริการและตอบคำถามของคุณ ทุกวันจันทร์-ศุกร์ เวลา 09:00-18:00',
      linkText: 'โทร 02-123-4567',
      href: 'tel:021234567'
    },
    {
      icon: 'fas fa-comments',
      title: 'แชทกับเรา',
      description: 'สอบถามข้อมูลและรับคำปรึกษาผ่าน Line Official Account ตอบกลับภายใน 1 ชั่วโมง',
      linkText: 'เพิ่มเพื่อน Line',
      href: '#'
    },
    {
      icon: 'fas fa-users',
      title: 'สมัครเป็นเทรนเนอร์',
      description: 'สนใจร่วมเป็นส่วนหนึ่งของทีมเทรนเนอร์มืออาชีพ สมัครได้ที่นี่',
      linkText: 'สมัครเลย',
      href: '#'
    }
  ];

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'กรุณากรอกชื่อ';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'กรุณากรอกนามสกุล';
    }

    if (!formData.email.trim()) {
      errors.email = 'กรุณากรอกอีเมล';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    } else if (!/^[0-9\-\+\s\(\)]+$/.test(formData.phone)) {
      errors.phone = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';
    }

    if (!formData.subject) {
      errors.subject = 'กรุณาเลือกหัวข้อ';
    }

    if (!formData.message.trim()) {
      errors.message = 'กรุณากรอกข้อความ';
    } else if (formData.message.trim().length < 10) {
      errors.message = 'ข้อความต้องมีอย่างน้อย 10 ตัวอักษร';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission with API call
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setShowSuccess(false);
    setShowError(false);
    setErrorMessage('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API
      const submitData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
        submitted_at: new Date().toISOString()
      };

      // Send to API
      const response = await fetch(`${API_BASE_URL}/contact/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (response.ok) {
        // Success
        setShowSuccess(true);
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });

        // Clear form errors
        setFormErrors({});
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 5000);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        console.log('Contact form submitted successfully:', result);
      } else {
        // API returned error
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการส่งข้อความ');
      }

    } catch (error) {
      console.error('Error submitting contact form:', error);
      setShowError(true);
      setErrorMessage(error.message || 'เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง');
      
      // Hide error message after 5 seconds
      setTimeout(() => {
        setShowError(false);
        setErrorMessage('');
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          padding: 2rem 0 3rem;
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

        /* Loading Spinner */
        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 400px;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid var(--secondary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Contact Container */
        .contact-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .contact-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          margin-bottom: 3rem;
        }

        /* Contact Info Section */
        .contact-info-section {
          background: white;
          border-radius: 20px;
          padding: 3rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .contact-info-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--primary-color);
          margin-bottom: 2rem;
        }

        .contact-info-item {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: var(--bg-light);
          border-radius: 15px;
          transition: all 0.3s ease;
        }

        .contact-info-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          background: white;
        }

        .contact-icon {
          width: 50px;
          height: 50px;
          background: var(--secondary-color);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.3rem;
          flex-shrink: 0;
        }

        .contact-details h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--primary-color);
          margin-bottom: 0.5rem;
        }

        .contact-details p {
          margin: 0;
          color: var(--text-dark);
          line-height: 1.6;
        }

        .contact-details a {
          color: var(--text-dark);
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .contact-details a:hover {
          color: var(--secondary-color);
        }

        /* Social Links */
        .social-links-contact {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e0e0e0;
        }

        .social-links h3 {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--primary-color);
          margin-bottom: 1rem;
        }

        .social-icons {
          display: flex;
          gap: 1rem;
        }

        .social-icon {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: var(--bg-light);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-dark);
          text-decoration: none;
          transition: all 0.3s ease;
          font-size: 1.2rem;
        }

        .social-icon:hover {
          background: var(--secondary-color);
          color: white;
          transform: translateY(-5px);
        }

        /* Contact Form Section */
        .contact-form-section {
          background: white;
          border-radius: 20px;
          padding: 3rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .contact-form-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--primary-color);
          margin-bottom: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          font-weight: 600;
          color: var(--text-dark);
          margin-bottom: 0.5rem;
          display: block;
        }

        .form-control, .form-select {
          width: 100%;
          padding: 0.8rem 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s ease;
          font-family: 'Noto Sans Thai', sans-serif;
        }

        .form-control:focus, .form-select:focus {
          outline: none;
          border-color: var(--secondary-color);
          box-shadow: 0 0 0 3px rgba(223, 37, 40, 0.1);
        }

        .form-control.error, .form-select.error {
          border-color: #dc3545;
        }

        .form-select {
          cursor: pointer;
          background-color: white;
        }

        textarea.form-control {
          resize: vertical;
          min-height: 120px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-error {
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .submit-btn {
          background: var(--secondary-color);
          color: white;
          border: none;
          padding: 1rem 3rem;
          border-radius: 30px;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.3s ease;
          cursor: pointer;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          position: relative;
        }

        .submit-btn:hover:not(:disabled) {
          background: var(--primary-color);
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(35, 41, 86, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Quick Contact Cards */
        .quick-contact-section {
          margin-top: 4rem;
        }

        .quick-contact-title {
          text-align: center;
          font-size: 2rem;
          font-weight: 700;
          color: var(--primary-color);
          margin-bottom: 3rem;
        }

        .quick-contact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        .quick-contact-card {
          background: white;
          border-radius: 20px;
          padding: 2.5rem;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
        }

        .quick-contact-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        }

        .quick-contact-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, var(--secondary-color), var(--accent-color));
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 2rem;
          margin: 0 auto 1.5rem;
        }

        .quick-contact-card h3 {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--primary-color);
          margin-bottom: 1rem;
        }

        .quick-contact-card p {
          color: var(--text-light);
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .quick-contact-link {
          color: var(--secondary-color);
          text-decoration: none;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .quick-contact-link:hover {
          gap: 1rem;
          color: var(--primary-color);
        }

        /* Success Message */
        .success-message {
          background: #d4edda;
          color: #155724;
          padding: 1rem;
          border-radius: 10px;
          margin-bottom: 1rem;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        /* Error Message */
        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 1rem;
          border-radius: 10px;
          margin-bottom: 1rem;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        /* Responsive */
        @media (max-width: 991px) {
          .contact-content {
            grid-template-columns: 1fr;
          }

          .quick-contact-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 767px) {
          .page-title {
            font-size: 2rem;
          }

          .contact-info-section,
          .contact-form-section {
            padding: 2rem;
          }

          .quick-contact-card {
            padding: 2rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 576px) {
          .page-header {
            padding: 1rem 0;
          }

          .page-title {
            font-size: 1.8rem;
          }

          .contact-info-section,
          .contact-form-section {
            padding: 1.5rem;
          }

          .contact-info-item {
            gap: 1rem;
            padding: 1rem;
          }

          .contact-icon {
            width: 40px;
            height: 40px;
            font-size: 1.1rem;
          }

          .social-icon {
            width: 40px;
            height: 40px;
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
                ติดต่อเรา
              </li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="page-header">
            <h1 className="page-title">ติดต่อเรา</h1>
            <p className="page-subtitle">
              พร้อมให้บริการและตอบคำถามของคุณ ติดต่อเราได้ทุกช่องทาง
            </p>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="contact-container">
              <div className="contact-content">
                {/* Contact Info */}
                <div className="contact-info-section">
                  <h2 className="contact-info-title">ข้อมูลติดต่อ</h2>
                  
                  {contactInfo.map((info, index) => (
                    <div key={index} className="contact-info-item">
                      <div className="contact-icon">
                        <i className={info.icon}></i>
                      </div>
                      <div className="contact-details">
                        <h3>{info.title}</h3>
                        <p>
                          {info.content.map((line, i) => (
                            <React.Fragment key={i}>
                              {info.links && info.links[i] ? (
                                <a href={info.links[i]}>{line}</a>
                              ) : (
                                line
                              )}
                              {i < info.content.length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="social-links-contact">
                    <h3>ติดตามเราได้ที่</h3>
                    <div className="social-icons">
                      {socialLinks.map((social, index) => (
                        <a key={index} href={social.href} className="social-icon" title={social.name}>
                          <i className={social.icon}></i>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <div className="contact-form-section">
                  <h2 className="contact-form-title">ส่งข้อความถึงเรา</h2>
                  
                  {showSuccess && (
                    <div className="success-message">
                      <i className="fas fa-check-circle"></i>
                      ส่งข้อความเรียบร้อยแล้ว เราจะติดต่อกลับโดยเร็วที่สุด
                    </div>
                  )}

                  {showError && (
                    <div className="error-message">
                      <i className="fas fa-exclamation-circle"></i>
                      {errorMessage}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">ชื่อ *</label>
                        <input
                          type="text"
                          name="firstName"
                          className={`form-control ${formErrors.firstName ? 'error' : ''}`}
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                        />
                        {formErrors.firstName && (
                          <div className="form-error">{formErrors.firstName}</div>
                        )}
                      </div>
                      <div className="form-group">
                        <label className="form-label">นามสกุล *</label>
                        <input
                          type="text"
                          name="lastName"
                          className={`form-control ${formErrors.lastName ? 'error' : ''}`}
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                        />
                        {formErrors.lastName && (
                          <div className="form-error">{formErrors.lastName}</div>
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">อีเมล *</label>
                      <input
                        type="email"
                        name="email"
                        className={`form-control ${formErrors.email ? 'error' : ''}`}
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                      {formErrors.email && (
                        <div className="form-error">{formErrors.email}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">เบอร์โทรศัพท์ *</label>
                      <input
                        type="tel"
                        name="phone"
                        className={`form-control ${formErrors.phone ? 'error' : ''}`}
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                      {formErrors.phone && (
                        <div className="form-error">{formErrors.phone}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">หัวข้อ *</label>
                      <select
                        name="subject"
                        className={`form-select ${formErrors.subject ? 'error' : ''}`}
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">เลือกหัวข้อ</option>
                        <option value="general">สอบถามข้อมูลทั่วไป</option>
                        <option value="trainer">สอบถามเกี่ยวกับเทรนเนอร์</option>
                        <option value="membership">สอบถามเกี่ยวกับการสมัครสมาชิก</option>
                        <option value="partnership">ความร่วมมือทางธุรกิจ</option>
                        <option value="complaint">ร้องเรียน/แนะนำ</option>
                        <option value="other">อื่นๆ</option>
                      </select>
                      {formErrors.subject && (
                        <div className="form-error">{formErrors.subject}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">ข้อความ *</label>
                      <textarea
                        name="message"
                        className={`form-control ${formErrors.message ? 'error' : ''}`}
                        rows="5"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                      ></textarea>
                      {formErrors.message && (
                        <div className="form-error">{formErrors.message}</div>
                      )}
                    </div>

                    <button type="submit" className="submit-btn" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          กำลังส่ง...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane"></i>
                          ส่งข้อความ
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Quick Contact Cards */}
              <div className="quick-contact-section">
                <h2 className="quick-contact-title">ช่องทางติดต่อด่วน</h2>
                <div className="quick-contact-grid">
                  {quickContactCards.map((card, index) => (
                    <div key={index} className="quick-contact-card">
                      <div className="quick-contact-icon">
                        <i className={card.icon}></i>
                      </div>
                      <h3>{card.title}</h3>
                      <p>{card.description}</p>
                      <a href={card.href} className="quick-contact-link">
                        {card.linkText} <i className="fas fa-arrow-right"></i>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default ContactPage;