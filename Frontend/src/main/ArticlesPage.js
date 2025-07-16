import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ArticlesPage = () => {
  const navigate = useNavigate();
  
  // Data States
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const [articlesPerPage] = useState(9);
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [error, setError] = useState(null);

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load data when filters change
  useEffect(() => {
    loadArticles();
  }, [currentPage, currentCategory, activeFilter, searchQuery]);

  // ฟังก์ชันโหลดข้อมูลเริ่มต้น
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load categories and initial articles in parallel
      const [categoriesRes, articlesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/articles/categories`),
        fetch(`${API_BASE_URL}/articles?page=1&limit=${articlesPerPage}`)
      ]);

      // Handle categories
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.data || getDefaultCategories());
      } else {
        setCategories(getDefaultCategories());
      }

      // Handle articles
      if (articlesRes.ok) {
        const articlesData = await articlesRes.json();
        setArticles(articlesData.data || []);
        setFilteredArticles(articlesData.data || []);
        setTotalPages(articlesData.meta?.last_page || 1);
        setTotalArticles(articlesData.meta?.total || 0);
      } else {
        const defaultArticles = getDefaultArticles();
        setArticles(defaultArticles);
        setFilteredArticles(defaultArticles);
        setTotalPages(Math.ceil(defaultArticles.length / articlesPerPage));
        setTotalArticles(defaultArticles.length);
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      
      // Use fallback data
      const defaultCategories = getDefaultCategories();
      const defaultArticles = getDefaultArticles();
      
      setCategories(defaultCategories);
      setArticles(defaultArticles);
      setFilteredArticles(defaultArticles);
      setTotalPages(Math.ceil(defaultArticles.length / articlesPerPage));
      setTotalArticles(defaultArticles.length);
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันโหลดบทความตามเงื่อนไข
  const loadArticles = async () => {
    try {
      setIsLoadingArticles(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: articlesPerPage.toString()
      });

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      if (currentCategory) {
        params.append('category', currentCategory);
      }

      if (activeFilter && activeFilter !== 'all') {
        params.append('filter', activeFilter);
      }

      const response = await fetch(`${API_BASE_URL}/articles?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setFilteredArticles(data.data || []);
        setTotalPages(data.meta?.last_page || 1);
        setTotalArticles(data.meta?.total || 0);
      } else {
        throw new Error('ไม่สามารถโหลดบทความได้');
      }

    } catch (error) {
      console.error('Error loading articles:', error);
      setError(error.message || 'เกิดข้อผิดพลาดในการโหลดบทความ');
    } finally {
      setIsLoadingArticles(false);
    }
  };

  // ฟังก์ชันติดตามการดูบทความ
  const trackArticleView = async (articleId) => {
    try {
      await fetch(`${API_BASE_URL}/articles/${articleId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error tracking article view:', error);
      // ไม่ต้องแสดง error เพราะไม่ใช่ฟีเจอร์หลัก
    }
  };

  // Default categories (fallback)
  const getDefaultCategories = () => [
    { id: 1, name: 'การฝึกกล้ามเนื้อ', icon: 'fas fa-dumbbell', articles_count: 45 },
    { id: 2, name: 'คาร์ดิโอ', icon: 'fas fa-heartbeat', articles_count: 38 },
    { id: 3, name: 'โภชนาการ', icon: 'fas fa-apple-alt', articles_count: 52 },
    { id: 4, name: 'โยคะ & พิลาทิส', icon: 'fas fa-spa', articles_count: 31 },
    { id: 5, name: 'วิ่ง', icon: 'fas fa-running', articles_count: 27 },
    { id: 6, name: 'สุขภาพจิต', icon: 'fas fa-brain', articles_count: 23 }
  ];

  // Default articles (fallback)
  const getDefaultArticles = () => [
    {
      id: 1,
      title: 'คู่มือการฝึกกล้ามเนื้อสำหรับมือใหม่',
      excerpt: 'เริ่มต้นการฝึกกล้ามเนื้ออย่างถูกวิธี พร้อมโปรแกรมการฝึกที่เหมาะสมสำหรับผู้เริ่มต้น เพื่อผลลัพธ์ที่ดีและปลอดภัย',
      category: 'การฝึกกล้ามเนื้อ',
      author: 'วิชัย ฟิตเนส',
      author_avatar: 'https://i.pravatar.cc/150?img=1',
      published_at: '2025-01-15',
      featured_image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=250&fit=crop',
      views_count: 5420,
      reading_time: 8,
      is_featured: false
    },
    {
      id: 2,
      title: 'อาหารคลีน 7 วัน ลดน้ำหนักได้จริง',
      excerpt: 'เมนูอาหารคลีนตลอด 7 วัน พร้อมวิธีการเตรียมที่ง่าย อร่อย และช่วยให้คุณลดน้ำหนักได้อย่างมีประสิทธิภาพ',
      category: 'โภชนาการ',
      author: 'สมหญิง เฮลท์ตี้',
      author_avatar: 'https://i.pravatar.cc/150?img=2',
      published_at: '2025-01-14',
      featured_image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=250&fit=crop',
      views_count: 8930,
      reading_time: 6,
      is_featured: true
    },
    {
      id: 3,
      title: 'วิธีวิ่งให้ได้ผล ไม่บาดเจ็บ',
      excerpt: 'เทคนิคการวิ่งที่ถูกต้อง การเลือกรองเท้า และการวอร์มอัพที่เหมาะสม เพื่อป้องกันการบาดเจ็บจากการวิ่ง',
      category: 'วิ่ง',
      author: 'ประเสริฐ นักวิ่ง',
      author_avatar: 'https://i.pravatar.cc/150?img=3',
      published_at: '2025-01-13',
      featured_image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=250&fit=crop',
      views_count: 6750,
      reading_time: 5,
      is_featured: false
    }
  ];

  // Filter articles by different criteria
  const filterArticles = (filter) => {
    setActiveFilter(filter);
    setCurrentCategory(null);
    setCurrentPage(1);
  };

  // Filter by category
  const filterByCategory = (categoryName) => {
    setCurrentCategory(categoryName);
    setActiveFilter('');
    setCurrentPage(1);
  };

  // Show all articles
  const showAllArticles = () => {
    setCurrentCategory(null);
    setActiveFilter('all');
    setCurrentPage(1);
    setSearchQuery('');
  };

  // Handle search with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // View article
  const viewArticle = async (articleId) => {
    // Track view count
    await trackArticleView(articleId);
    
    // Navigate to article detail
    navigate(`/articledetail/${articleId}`);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  // Article Card Component
  const ArticleCard = ({ article }) => {
    const handleCardClick = (e) => {
      if (e.target.closest('.article-category-badge')) {
        return;
      }
      viewArticle(article.id);
    };

    const handleCategoryClick = (e) => {
      e.stopPropagation();
      filterByCategory(article.category);
    };

    return (
      <div className="article-card" onClick={handleCardClick}>
        <div className="article-image-wrapper">
          <img 
            src={article.featured_image || article.image} 
            alt={article.title} 
            className="article-image" 
          />
          <span 
            className="article-category-badge" 
            onClick={handleCategoryClick}
          >
            {article.category}
          </span>
        </div>
        <div className="article-content">
          <h3 className="article-title">{article.title}</h3>
          <p className="article-excerpt">{article.excerpt}</p>
          <div className="article-footer">
            <div className="article-meta-info">
              <div className="meta-item">
                <i className="far fa-calendar"></i>
                <span>{formatDate(article.published_at || article.date)}</span>
              </div>
              <div className="meta-item">
                <i className="far fa-eye"></i>
                <span>{(article.views_count || article.views || 0).toLocaleString()}</span>
              </div>
              <div className="meta-item">
                <i className="far fa-clock"></i>
                <span>{article.reading_time || article.readTime} นาที</span>
              </div>
            </div>
            <div className="article-author">
              <img 
                src={article.author_avatar || article.authorAvatar} 
                alt={article.author} 
                className="author-avatar"
              />
              <span className="author-name">{article.author}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Category Card Component
  const CategoryCard = ({ category, isActive, onClick }) => (
    <div 
      className={`category-card ${isActive ? 'active' : ''}`}
      onClick={() => onClick(category.name)}
    >
      <i className={`${category.icon} category-icon`}></i>
      <h3 className="category-name">{category.name}</h3>
      <p className="category-count">
        {category.articles_count || category.count} บทความ
      </p>
    </div>
  );

  // Loading Component
  const LoadingSpinner = () => (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
      <p>กำลังโหลดข้อมูล...</p>
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
      <button 
        className="retry-btn"
        onClick={loadInitialData}
      >
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
          แสดง {((currentPage - 1) * articlesPerPage) + 1}-{Math.min(currentPage * articlesPerPage, totalArticles)} 
          จาก {totalArticles} บทความ
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            text-align: center;
          }

          .loading-spinner {
            margin-bottom: 1rem;
          }

          .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #df2528;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            text-align: center;
            color: #666;
          }

          .error-icon {
            font-size: 3rem;
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
        <div style={{ padding: '2rem 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 15px' }}>
            <LoadingSpinner />
          </div>
        </div>
      </>
    );
  }

  if (error && !articles.length) {
    return (
      <>
        <style jsx>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            text-align: center;
            color: #666;
          }

          .error-icon {
            font-size: 3rem;
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
        <div style={{ padding: '2rem 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 15px' }}>
            <ErrorMessage />
          </div>
        </div>
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

        /* Loading & Error States */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }

        .loading-spinner {
          margin-bottom: 1rem;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #df2528;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
          color: #666;
        }

        .error-icon {
          font-size: 3rem;
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

        /* Categories Section */
        .categories-section {
          margin-bottom: 3rem;
        }

        .section-title {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--primary-color);
          margin-bottom: 2rem;
          position: relative;
          padding-bottom: 1rem;
        }

        .section-title::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 60px;
          height: 4px;
          background: var(--secondary-color);
        }

        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .category-card {
          background: white;
          border-radius: 15px;
          padding: 1.5rem;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
          cursor: pointer;
          border: 2px solid transparent;
        }

        .category-card:hover,
        .category-card.active {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          background: var(--secondary-color);
          color: white;
          border-color: var(--secondary-color);
        }

        .category-icon {
          font-size: 2.5rem;
          color: var(--secondary-color);
          margin-bottom: 1rem;
          transition: all 0.3s ease;
        }

        .category-card:hover .category-icon,
        .category-card.active .category-icon {
          color: white;
          transform: scale(1.1);
        }

        .category-name {
          font-weight: 700;
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }

        .category-count {
          font-size: 0.85rem;
          color: var(--text-light);
          transition: all 0.3s ease;
        }

        .category-card:hover .category-count,
        .category-card.active .category-count {
          color: rgba(255,255,255,0.9);
        }

        /* Search & Filter */
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

        .filter-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 0.6rem 1.5rem;
          border: 2px solid #e0e0e0;
          background: white;
          border-radius: 25px;
          font-weight: 600;
          color: var(--text-dark);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .filter-btn.active,
        .filter-btn:hover {
          background: var(--secondary-color);
          color: white;
          border-color: var(--secondary-color);
        }

        .cancel-btn {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .cancel-btn:hover {
          background: #1a1f42;
          border-color: #1a1f42;
        }

        /* Articles Grid */
        .articles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-bottom: 3rem;
          position: relative;
        }

        .articles-grid.loading {
          opacity: 0.6;
          pointer-events: none;
        }

        .article-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          transition: all 0.4s ease;
          cursor: pointer;
        }

        .article-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        }

        .article-image-wrapper {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .article-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .article-card:hover .article-image {
          transform: scale(1.1);
        }

        .article-category-badge {
          position: absolute;
          top: 15px;
          left: 15px;
          background: var(--secondary-color);
          color: white;
          padding: 0.3rem 0.8rem;
          border-radius: 15px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 1;
        }

        .article-category-badge:hover {
          background: var(--primary-color);
          transform: scale(1.05);
        }

        .article-content {
          padding: 1.5rem;
        }

        .article-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 0.8rem;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .article-excerpt {
          color: var(--text-light);
          font-size: 0.95rem;
          line-height: 1.6;
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .article-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid #f0f0f0;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .article-meta-info {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          font-size: 0.85rem;
          color: var(--text-light);
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .meta-item i {
          color: var(--secondary-color);
          font-size: 0.9rem;
        }

        .article-author {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-dark);
        }

        .author-avatar {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          object-fit: cover;
        }

        .author-name {
          font-weight: 600;
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

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--text-light);
        }

        .empty-state i {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        /* Responsive */
        @media (max-width: 1199px) {
          .articles-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 991px) {
          .page-title {
            font-size: 2rem;
          }
        }

        @media (max-width: 767px) {
          .articles-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .article-footer {
            flex-direction: column;
            align-items: stretch;
          }

          .article-meta-info {
            justify-content: space-between;
            gap: 1rem;
          }

          .article-author {
            justify-content: center;
          }
        }

        @media (max-width: 576px) {
          .page-header {
            padding: 1rem 0;
          }

          .page-title {
            font-size: 1.8rem;
          }

          .categories-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .filter-buttons {
            justify-content: center;
          }

          .article-meta-info {
            gap: 1rem;
            font-size: 0.8rem;
          }

          .search-filter-section {
            padding: 1.5rem;
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
                บทความ
              </li>
            </ol>
          </nav>

          {/* Page Header */}
          <div className="page-header">
            <h1 className="page-title">บทความและข่าวสาร</h1>
            <p className="page-subtitle">
              อัปเดตข้อมูลด้านสุขภาพ ฟิตเนส และเทคนิคการออกกำลังกายที่น่าสนใจ
            </p>
          </div>

          {/* Categories Section */}
          <div className="categories-section">
            <h2 className="section-title">หมวดหมู่บทความ</h2>
            <div className="categories-grid">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id || category.name}
                  category={category}
                  isActive={currentCategory === category.name}
                  onClick={filterByCategory}
                />
              ))}
            </div>
          </div>

          {/* Search & Filter */}
          <div className="search-filter-section">
            <div className="search-wrapper">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                className="search-input"
                placeholder="ค้นหาบทความ..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => filterArticles('all')}
              >
                ทั้งหมด
              </button>
              <button
                className={`filter-btn ${activeFilter === 'latest' ? 'active' : ''}`}
                onClick={() => filterArticles('latest')}
              >
                ล่าสุด
              </button>
              <button
                className={`filter-btn ${activeFilter === 'popular' ? 'active' : ''}`}
                onClick={() => filterArticles('popular')}
              >
                ยอดนิยม
              </button>
              <button
                className={`filter-btn ${activeFilter === 'trending' ? 'active' : ''}`}
                onClick={() => filterArticles('trending')}
              >
                กำลังมาแรง
              </button>
              {(currentCategory || searchQuery) && (
                <button
                  className="filter-btn cancel-btn"
                  onClick={showAllArticles}
                >
                  <i className="fas fa-times-circle"></i> แสดงทั้งหมด
                </button>
              )}
            </div>
          </div>

          {/* Loading State for Articles */}
          {isLoadingArticles && (
            <div className="loading-container">
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
              <p>กำลังโหลดบทความ...</p>
            </div>
          )}

          {/* Articles Grid */}
          {!isLoadingArticles && (
            <>
              {filteredArticles.length > 0 ? (
                <div className={`articles-grid ${isLoadingArticles ? 'loading' : ''}`}>
                  {filteredArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="fas fa-search"></i>
                  <h3>ไม่พบบทความ</h3>
                  <p>ไม่พบบทความที่ตรงกับเงื่อนไขการค้นหา</p>
                  <button 
                    className="filter-btn"
                    onClick={showAllArticles}
                  >
                    แสดงบทความทั้งหมด
                  </button>
                </div>
              )}

              {/* Pagination */}
              {filteredArticles.length > 0 && (
                <Pagination />
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default ArticlesPage;