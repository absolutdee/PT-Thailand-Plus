import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Article States
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isViewTracked, setIsViewTracked] = useState(false);

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // Load article data on component mount
  useEffect(() => {
    if (id) {
      loadArticleData();
    } else {
      setError('ไม่พบ ID ของบทความ');
      setIsLoading(false);
    }
  }, [id]);

  // Track view when article is loaded
  useEffect(() => {
    if (article && !isViewTracked) {
      trackArticleView();
      setIsViewTracked(true);
    }
  }, [article, isViewTracked]);

  // ฟังก์ชันโหลดข้อมูลบทความ
  const loadArticleData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load article and related articles in parallel
      const [articleRes, relatedRes] = await Promise.all([
        fetch(`${API_BASE_URL}/articles/${id}`),
        fetch(`${API_BASE_URL}/articles/${id}/related?limit=3`)
      ]);

      // Handle article data
      if (articleRes.ok) {
        const articleData = await articleRes.json();
        setArticle(articleData.data || getDefaultArticle());
      } else if (articleRes.status === 404) {
        setError('ไม่พบบทความที่คุณต้องการ');
        return;
      } else {
        setArticle(getDefaultArticle());
      }

      // Handle related articles
      if (relatedRes.ok) {
        const relatedData = await relatedRes.json();
        setRelatedArticles(relatedData.data || getDefaultRelatedArticles());
      } else {
        setRelatedArticles(getDefaultRelatedArticles());
      }

    } catch (error) {
      console.error('Error loading article:', error);
      setError('เกิดข้อผิดพลาดในการโหลดบทความ กรุณาลองใหม่อีกครั้ง');
      
      // Use fallback data
      setArticle(getDefaultArticle());
      setRelatedArticles(getDefaultRelatedArticles());
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันติดตามการดูบทความ
  const trackArticleView = async () => {
    try {
      await fetch(`${API_BASE_URL}/articles/${id}/view`, {
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

  // Default article data (fallback)
  const getDefaultArticle = () => ({
    id: 1,
    title: '10 เทรนด์การออกกำลังกายที่มาแรงในปี 2025',
    subtitle: 'มาดูกันว่าในปี 2025 นี้ เทรนด์การออกกำลังกายแบบไหนที่กำลังได้รับความนิยม ตั้งแต่การฝึกแบบ HIIT ไปจนถึงการออกกำลังกายด้วย VR Technology',
    content: `ในปี 2025 วงการฟิตเนสและการออกกำลังกายมีการเปลี่ยนแปลงอย่างมาก ด้วยเทคโนโลยีที่ก้าวหน้าและความตระหนักด้านสุขภาพที่เพิ่มขึ้น ทำให้เกิดเทรนด์การออกกำลังกายใหม่ๆ ที่น่าสนใจ วันนี้เราจะมาดูกันว่า 10 เทรนด์ไหนที่กำลังมาแรงและน่าจับตามองในปีนี้

## 1. Virtual Reality Fitness

การออกกำลังกายด้วย VR กำลังเป็นที่นิยมอย่างมาก ด้วยเทคโนโลยีที่ทำให้การออกกำลังกายสนุกและท้าทายมากขึ้น ผู้ใช้สามารถออกกำลังกายในโลกเสมือนจริง ไม่ว่าจะเป็นการปีนเขา วิ่งในป่า หรือแม้แต่ต่อสู้กับซอมบี้

## 2. AI Personal Training

เทรนเนอร์ส่วนตัวแบบ AI ที่สามารถวิเคราะห์การเคลื่อนไหว แนะนำท่าออกกำลังกาย และปรับโปรแกรมให้เหมาะกับแต่ละบุคคล โดยใช้ข้อมูลจากการออกกำลังกาย อาหาร และการพักผ่อน`,
    category: 'เทรนด์ฟิตเนส',
    author: {
      name: 'สมชาย ฟิตเนส',
      bio: 'ผู้เชี่ยวชาญด้านฟิตเนสและสุขภาพ มีประสบการณ์ในวงการฟิตเนสมากกว่า 10 ปี เป็นเทรนเนอร์ส่วนตัวที่ได้รับการรับรอง และนักเขียนบทความด้านสุขภาพ',
      avatar: 'https://i.pravatar.cc/150?img=1',
      social_links: {
        facebook: '#',
        instagram: '#',
        twitter: '#',
        youtube: '#'
      }
    },
    featured_image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&h=600&fit=crop',
    published_at: '2025-01-15',
    views_count: 1547,
    reading_time: 8,
    tags: ['เทรนด์ฟิตเนส', 'VRFitness', 'AI', 'MicroWorkouts', 'Recovery', 'OutdoorFitness', 'MindfulMovement', 'Wearable', 'SustainableFitness']
  });

  // Default related articles (fallback)
  const getDefaultRelatedArticles = () => [
    {
      id: 2,
      title: 'HIIT Workout 20 นาที เผาผลาญไขมันสูง',
      category: 'คาร์ดิโอ',
      featured_image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=200&fit=crop',
      published_at: '2025-01-11'
    },
    {
      id: 3,
      title: 'วิธีดูแลสุขภาพจิตด้วยการออกกำลังกาย',
      category: 'สุขภาพจิต',
      featured_image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=200&fit=crop',
      published_at: '2025-01-10'
    },
    {
      id: 4,
      title: 'เทคนิคการยืดเหยียดหลังออกกำลังกาย',
      category: 'การฝึกกล้ามเนื้อ',
      featured_image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
      published_at: '2025-01-09'
    }
  ];

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Parse content to JSX with proper formatting
  const parseContent = (content) => {
    if (!content) return '';
    
    const lines = content.split('\n');
    return lines.map((line, index) => {
      line = line.trim();
      if (!line) return <br key={index} />;
      
      if (line.startsWith('## ')) {
        return <h2 key={index} style={styles.articleH2}>{line.substring(3)}</h2>;
      } else if (line.startsWith('### ')) {
        return <h3 key={index} style={styles.articleH3}>{line.substring(4)}</h3>;
      } else {
        return <p key={index} style={styles.articleP}>{line}</p>;
      }
    });
  };

  // Share Functions - Updated to use real article data
  const shareOnFacebook = () => {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnTwitter = () => {
    const url = window.location.href;
    const text = article ? article.title : 'บทความน่าสนใจจาก FitConnect';
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnLine = () => {
    const url = window.location.href;
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('คัดลอกลิงก์เรียบร้อยแล้ว!');
    }).catch(() => {
      // Fallback for older browsers
      const tempInput = document.createElement('input');
      tempInput.value = window.location.href;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      alert('คัดลอกลิงก์เรียบร้อยแล้ว!');
    });
  };

  // View Article - Updated with API call
  const viewArticle = (articleId) => {
    navigate(`/articledetail/${articleId}`);
  };

  // Loading Component
  const LoadingSpinner = () => (
    <div style={styles.loadingContainer}>
      <div style={styles.loadingSpinner}>
        <div style={styles.spinner}></div>
      </div>
      <p style={styles.loadingText}>กำลังโหลดบทความ...</p>
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
          onClick={loadArticleData}
        >
          <i className="fas fa-redo"></i>
          ลองใหม่
        </button>
        <button 
          style={styles.backBtn}
          onClick={() => navigate('/articles')}
        >
          <i className="fas fa-arrow-left"></i>
          กลับไปหน้าบทความ
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
      padding: '3rem 0 4rem',
      minHeight: '100vh',
      background: 'white'
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
      marginBottom: '2rem',
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
    articleContainer: {
      maxWidth: '800px',
      margin: '0 auto'
    },
    articleHeader: {
      textAlign: 'center',
      padding: '3rem 0',
      marginBottom: '2rem'
    },
    articleCategoryBadge: {
      display: 'inline-block',
      color: '#df2528',
      fontSize: '0.9rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '1rem'
    },
    articleTitle: {
      fontSize: '3rem',
      fontWeight: 800,
      color: '#1a1a1a',
      lineHeight: 1.2,
      marginBottom: '1rem'
    },
    articleSubtitle: {
      fontSize: '1.3rem',
      color: '#666',
      lineHeight: 1.5,
      marginBottom: '2rem',
      maxWidth: '600px',
      marginLeft: 'auto',
      marginRight: 'auto'
    },
    articleMeta: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      flexWrap: 'wrap',
      color: '#666',
      fontSize: '0.9rem'
    },
    articleMetaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    metaBadge: {
      display: 'inline-block',
      color: '#df2528',
      fontSize: '0.85rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      padding: '0.3rem 0.8rem',
      background: 'rgba(223, 37, 40, 0.1)',
      borderRadius: '15px'
    },
    authorLink: {
      color: '#1a1a1a',
      textDecoration: 'none',
      fontWeight: 600
    },
    articleImageWrapper: {
      marginBottom: '3rem'
    },
    articleFeaturedImage: {
      width: '100%',
      height: 'auto',
      display: 'block',
      borderRadius: '16px'
    },
    articleContent: {
      marginBottom: '3rem'
    },
    articleBody: {
      fontSize: '1.1rem',
      lineHeight: 1.8,
      color: '#1a1a1a'
    },
    articleH2: {
      fontSize: '1.8rem',
      fontWeight: 700,
      color: '#232956',
      margin: '3rem 0 1.5rem'
    },
    articleH3: {
      fontSize: '1.4rem',
      fontWeight: 600,
      color: '#232956',
      margin: '2rem 0 1rem'
    },
    articleP: {
      marginBottom: '1.5rem'
    },
    articleUl: {
      marginBottom: '1.5rem',
      paddingLeft: '2rem'
    },
    articleLi: {
      marginBottom: '0.8rem'
    },
    articleBlockquote: {
      borderLeft: '4px solid #df2528',
      padding: '1.5rem 2rem',
      margin: '2rem 0',
      background: '#f8f9fa',
      borderRadius: '0 10px 10px 0',
      fontStyle: 'italic',
      color: '#1a1a1a',
      fontSize: '1.2rem'
    },
    articleImg: {
      maxWidth: '100%',
      height: 'auto',
      borderRadius: '15px',
      margin: '2rem 0'
    },
    highlightBox: {
      background: '#fef5f5',
      borderLeft: '4px solid #df2528',
      padding: '1.5rem',
      borderRadius: '0 10px 10px 0',
      margin: '2rem 0'
    },
    highlightBoxH4: {
      color: '#df2528',
      fontWeight: 600,
      marginBottom: '0.8rem',
      fontSize: '1.1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    highlightBoxUl: {
      margin: 0,
      paddingLeft: '1.5rem'
    },
    highlightBoxLi: {
      marginBottom: '0.5rem'
    },
    highlightBoxP: {
      margin: 0
    },
    authorBox: {
      borderTop: '1px solid #e0e0e0',
      borderBottom: '1px solid #e0e0e0',
      padding: '2rem 0',
      margin: '3rem 0',
      display: 'flex',
      gap: '1.5rem'
    },
    authorBoxAvatar: {
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      objectFit: 'cover',
      flexShrink: 0
    },
    authorBoxContent: {
      flex: 1
    },
    authorBoxName: {
      fontSize: '1.3rem',
      fontWeight: 700,
      color: '#232956',
      marginBottom: '0.5rem'
    },
    authorBoxBio: {
      color: '#666',
      lineHeight: 1.6,
      marginBottom: '1rem'
    },
    authorSocialLinks: {
      display: 'flex',
      gap: '0.8rem'
    },
    authorSocialLink: {
      width: '35px',
      height: '35px',
      borderRadius: '50%',
      background: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#1a1a1a',
      textDecoration: 'none',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    tagsSection: {
      marginBottom: '2rem'
    },
    tagsTitle: {
      fontSize: '1.1rem',
      fontWeight: 600,
      color: '#232956',
      marginBottom: '1rem'
    },
    tagsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.8rem'
    },
    tag: {
      display: 'inline-block',
      background: '#f8f9fa',
      color: '#1a1a1a',
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      fontSize: '0.85rem',
      fontWeight: 600,
      textDecoration: 'none',
      transition: 'all 0.3s ease',
      border: '2px solid transparent',
      cursor: 'pointer'
    },
    shareSection: {
      textAlign: 'center',
      padding: '2rem 0',
      marginBottom: '3rem'
    },
    shareTitle: {
      fontSize: '1.1rem',
      fontWeight: 600,
      color: '#232956',
      marginBottom: '1rem'
    },
    shareButtons: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem'
    },
    shareBtn: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      textDecoration: 'none',
      transition: 'all 0.3s ease',
      fontSize: '1.2rem',
      cursor: 'pointer',
      border: 'none'
    },
    shareBtnFacebook: {
      background: '#1877f2'
    },
    shareBtnTwitter: {
      background: '#1da1f2'
    },
    shareBtnLine: {
      background: '#00c300'
    },
    shareBtnLink: {
      background: '#232956'
    },
    relatedSection: {
      marginBottom: '3rem'
    },
    sectionTitle: {
      fontSize: '1.8rem',
      fontWeight: 700,
      color: '#232956',
      marginBottom: '2rem',
      textAlign: 'center'
    },
    relatedGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '2rem'
    },
    relatedArticleCard: {
      background: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    relatedArticleImage: {
      width: '100%',
      height: '200px',
      objectFit: 'cover'
    },
    relatedArticleContent: {
      padding: '1.5rem'
    },
    relatedArticleCategory: {
      color: '#df2528',
      fontSize: '0.8rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '0.5rem'
    },
    relatedArticleTitle: {
      fontSize: '1.1rem',
      fontWeight: 700,
      color: '#1a1a1a',
      marginBottom: '0.5rem',
      lineHeight: 1.4,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    },
    relatedArticleDate: {
      fontSize: '0.85rem',
      color: '#666'
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
            <LoadingSpinner />
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error && !article) {
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
        
        .author-social-link:hover {
          background: #df2528 !important;
          color: white !important;
          transform: translateY(-2px);
        }
        
        .tag:hover {
          background: #df2528 !important;
          color: white !important;
          border-color: #df2528 !important;
        }
        
        .share-btn:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        
        .related-article-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        }
        
        .author-link:hover {
          color: #df2528 !important;
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
          .article-title {
            font-size: 2.5rem !important;
          }
          .article-subtitle {
            font-size: 1.1rem !important;
          }
          .related-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .author-box {
            flex-direction: column !important;
            text-align: center !important;
          }
          .author-box-avatar {
            margin: 0 auto !important;
          }
          .author-social-links {
            justify-content: center !important;
          }
        }
        
        @media (max-width: 767px) {
          .article-title {
            font-size: 2rem !important;
          }
          .article-subtitle {
            font-size: 1rem !important;
          }
          .article-meta {
            gap: 1rem !important;
            font-size: 0.85rem !important;
          }
          .related-grid {
            grid-template-columns: 1fr !important;
          }
        }
        
        @media (max-width: 576px) {
          .article-header {
            padding: 2rem 0 !important;
          }
          .article-title {
            font-size: 1.8rem !important;
          }
          .article-body {
            font-size: 1rem !important;
          }
          .share-buttons {
            gap: 0.5rem !important;
          }
          .share-btn {
            width: 45px !important;
            height: 45px !important;
          }
          .author-box-avatar {
            width: 80px !important;
            height: 80px !important;
          }
          .meta-badge {
            font-size: 0.75rem !important;
            padding: 0.2rem 0.6rem !important;
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
                <a href="/articles" style={styles.breadcrumbLink}>บทความ</a>
              </li>
              <span style={styles.breadcrumbSeparator}>›</span>
              <li style={styles.breadcrumbItem}>
                <span>{article?.title || 'บทความ'}</span>
              </li>
            </ol>
          </nav>

          {/* Article Container */}
          <div style={styles.articleContainer}>
            {/* Article Header */}
            <div style={styles.articleHeader} className="article-header">
              <span style={styles.articleCategoryBadge}>{article?.category}</span>
              <h1 style={styles.articleTitle} className="article-title">{article?.title}</h1>
              {article?.subtitle && (
                <p style={styles.articleSubtitle} className="article-subtitle">{article.subtitle}</p>
              )}
              <div style={styles.articleMeta} className="article-meta">
                <div style={styles.articleMetaItem}>
                  <span style={styles.metaBadge} className="meta-badge">
                    {article?.category?.toUpperCase() || 'ARTICLE'}
                  </span>
                </div>
                <div style={styles.articleMetaItem}>
                  by <a href="#" style={styles.authorLink} className="author-link">
                    {article?.author?.name || 'Unknown Author'}
                  </a>
                </div>
                <div style={styles.articleMetaItem}>
                  <span>{formatDate(article?.published_at)}</span>
                </div>
                {article?.views_count && (
                  <div style={styles.articleMetaItem}>
                    <i className="far fa-eye" style={{ marginRight: '0.3rem' }}></i>
                    <span>{article.views_count.toLocaleString()} views</span>
                  </div>
                )}
              </div>
            </div>

            {/* Article Image */}
            {article?.featured_image && (
              <div style={styles.articleImageWrapper}>
                <img 
                  src={article.featured_image} 
                  alt={article.title} 
                  style={styles.articleFeaturedImage}
                />
              </div>
            )}

            {/* Article Content */}
            <div style={styles.articleContent}>
              <div style={styles.articleBody} className="article-body">
                {parseContent(article?.content)}
              </div>
            </div>

            {/* Author Box */}
            {article?.author && (
              <div style={styles.authorBox} className="author-box">
                <img 
                  src={article.author.avatar || 'https://i.pravatar.cc/150?img=1'} 
                  alt={article.author.name} 
                  style={styles.authorBoxAvatar}
                  className="author-box-avatar"
                />
                <div style={styles.authorBoxContent}>
                  <h3 style={styles.authorBoxName}>{article.author.name}</h3>
                  <p style={styles.authorBoxBio}>{article.author.bio}</p>
                  {article.author.social_links && (
                    <div style={styles.authorSocialLinks} className="author-social-links">
                      {article.author.social_links.facebook && (
                        <a href={article.author.social_links.facebook} style={styles.authorSocialLink} className="author-social-link">
                          <i className="fab fa-facebook-f"></i>
                        </a>
                      )}
                      {article.author.social_links.instagram && (
                        <a href={article.author.social_links.instagram} style={styles.authorSocialLink} className="author-social-link">
                          <i className="fab fa-instagram"></i>
                        </a>
                      )}
                      {article.author.social_links.twitter && (
                        <a href={article.author.social_links.twitter} style={styles.authorSocialLink} className="author-social-link">
                          <i className="fab fa-twitter"></i>
                        </a>
                      )}
                      {article.author.social_links.youtube && (
                        <a href={article.author.social_links.youtube} style={styles.authorSocialLink} className="author-social-link">
                          <i className="fab fa-youtube"></i>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags Section */}
            {article?.tags && article.tags.length > 0 && (
              <div style={styles.tagsSection}>
                <h3 style={styles.tagsTitle}>แท็ก</h3>
                <div style={styles.tagsContainer}>
                  {article.tags.map((tag, index) => (
                    <a key={index} href="#" style={styles.tag} className="tag">
                      #{tag}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Share Section */}
            <div style={styles.shareSection}>
              <h3 style={styles.shareTitle}>แชร์บทความนี้</h3>
              <div style={styles.shareButtons} className="share-buttons">
                <button 
                  style={{...styles.shareBtn, ...styles.shareBtnFacebook}} 
                  className="share-btn"
                  onClick={shareOnFacebook}
                >
                  <i className="fab fa-facebook-f"></i>
                </button>
                <button 
                  style={{...styles.shareBtn, ...styles.shareBtnTwitter}} 
                  className="share-btn"
                  onClick={shareOnTwitter}
                >
                  <i className="fab fa-twitter"></i>
                </button>
                <button 
                  style={{...styles.shareBtn, ...styles.shareBtnLine}} 
                  className="share-btn"
                  onClick={shareOnLine}
                >
                  <i className="fab fa-line"></i>
                </button>
                <button 
                  style={{...styles.shareBtn, ...styles.shareBtnLink}} 
                  className="share-btn"
                  onClick={copyLink}
                >
                  <i className="fas fa-link"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div style={styles.relatedSection}>
              <h2 style={styles.sectionTitle}>บทความที่เกี่ยวข้อง</h2>
              <div style={styles.relatedGrid} className="related-grid">
                {relatedArticles.map((relatedArticle) => (
                  <div 
                    key={relatedArticle.id}
                    style={styles.relatedArticleCard} 
                    className="related-article-card"
                    onClick={() => viewArticle(relatedArticle.id)}
                  >
                    <img 
                      src={relatedArticle.featured_image} 
                      alt={relatedArticle.title} 
                      style={styles.relatedArticleImage}
                    />
                    <div style={styles.relatedArticleContent}>
                      <p style={styles.relatedArticleCategory}>{relatedArticle.category}</p>
                      <h3 style={styles.relatedArticleTitle}>{relatedArticle.title}</h3>
                      <p style={styles.relatedArticleDate}>{formatDate(relatedArticle.published_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ArticleDetail;
