import React, { useState, useEffect } from 'react';
import { 
  Star, Edit, Trash2, Plus, 
  Calendar, User, Target, Award,
  ChevronDown, Filter, Search,
  ThumbsUp, MessageSquare, MoreVertical,
  CheckCircle, Clock, AlertTriangle,
  X, Send, Share2, Copy, Heart,
  AlertCircle, RefreshCw, BookOpen,
  Loader
} from 'lucide-react';

const ClientReviews = () => {
  const [activeTab, setActiveTab] = useState('my-reviews');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState({});
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Data from API
  const [myReviews, setMyReviews] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    totalHelpful: 0,
    totalSessions: 0
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', '#232956');
    root.style.setProperty('--accent', '#df2528');
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-secondary', '#fafafa');
    root.style.setProperty('--text-primary', '#1a202c');
    root.style.setProperty('--text-secondary', '#718096');
    root.style.setProperty('--text-muted', '#a0aec0');
    root.style.setProperty('--text-white', '#ffffff');
    root.style.setProperty('--border-color', '#e2e8f0');
    root.style.setProperty('--success', '#48bb78');
    root.style.setProperty('--warning', '#ed8936');
    root.style.setProperty('--info', '#4299e1');
    root.style.setProperty('--danger', '#f56565');
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchReviewsData();
  }, []);

  // API Helper Function
  const apiCall = async (endpoint, method = 'GET', data = null) => {
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      };

      if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`/api/reviews${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Fetch all reviews data
  const fetchReviewsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [myReviewsResponse, pendingResponse] = await Promise.all([
        apiCall('/my'),
        apiCall('/pending')
      ]);

      setMyReviews(myReviewsResponse || []);
      setPendingReviews(pendingResponse || []);

      // Calculate stats
      if (myReviewsResponse && myReviewsResponse.length > 0) {
        const stats = {
          totalReviews: myReviewsResponse.length,
          averageRating: myReviewsResponse.reduce((sum, r) => sum + r.rating, 0) / myReviewsResponse.length,
          totalHelpful: myReviewsResponse.reduce((sum, r) => sum + r.helpfulCount, 0),
          totalSessions: myReviewsResponse.reduce((sum, r) => sum + r.sessionsCompleted, 0)
        };
        setReviewStats(stats);
      }

      // Initialize helpful votes state
      const votesState = {};
      myReviewsResponse?.forEach(review => {
        votesState[review.id] = review.userHasVoted || false;
      });
      setHelpfulVotes(votesState);

    } catch (err) {
      console.error('Error fetching reviews data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await fetchReviewsData();
    setRefreshing(false);
  };

  const tabs = [
    { id: 'my-reviews', label: 'รีวิวของฉัน', icon: Star },
    { id: 'pending', label: 'รอรีวิว', icon: Clock }
  ];

  const renderStars = (rating, size = 16, interactive = false, onRatingChange = null) => {
    return (
      <div style={{ display: 'flex', gap: '0.125rem' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={size}
            style={{
              cursor: interactive ? 'pointer' : 'default',
              fill: star <= rating ? '#fbbf24' : 'none',
              color: star <= rating ? '#fbbf24' : '#d1d5db',
              transition: 'all 0.2s ease'
            }}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
            onMouseEnter={interactive ? (e) => e.target.style.transform = 'scale(1.1)' : undefined}
            onMouseLeave={interactive ? (e) => e.target.style.transform = 'scale(1)' : undefined}
          />
        ))}
      </div>
    );
  };

  const handleSubmitReview = async () => {
    if (rating > 0 && reviewText.trim() && selectedTrainer) {
      setIsSubmitting(true);
      
      try {
        const reviewData = {
          trainerId: selectedTrainer.trainerId,
          packageId: selectedTrainer.packageId,
          rating,
          review: reviewText.trim(),
          packageName: selectedTrainer.packageName,
          sessionsCompleted: selectedTrainer.sessionsCompleted
        };

        const newReview = await apiCall('', 'POST', reviewData);

        // Add to my reviews
        setMyReviews(prev => [newReview, ...prev]);

        // Remove from pending reviews
        setPendingReviews(prev => prev.filter(p => p.id !== selectedTrainer.id));

        // Update stats
        setReviewStats(prev => ({
          totalReviews: prev.totalReviews + 1,
          averageRating: ((prev.averageRating * prev.totalReviews) + rating) / (prev.totalReviews + 1),
          totalHelpful: prev.totalHelpful,
          totalSessions: prev.totalSessions + selectedTrainer.sessionsCompleted
        }));

        // Reset form
        setRating(0);
        setReviewText('');
        setSelectedTrainer(null);
        setShowReviewModal(false);
        
        alert('รีวิวถูกส่งเรียบร้อยแล้ว!');
      } catch (error) {
        console.error('Error submitting review:', error);
        alert('เกิดข้อผิดพลาดในการส่งรีวิว');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setRating(review.rating);
    setReviewText(review.review);
    setShowEditModal(true);
  };

  const handleUpdateReview = async () => {
    if (rating > 0 && reviewText.trim() && editingReview) {
      setIsSubmitting(true);
      
      try {
        const updateData = {
          rating,
          review: reviewText.trim()
        };

        const updatedReview = await apiCall(`/${editingReview.id}`, 'PUT', updateData);
        
        // Update review in state
        setMyReviews(prev => prev.map(review => 
          review.id === editingReview.id 
            ? { ...review, ...updatedReview }
            : review
        ));

        // Update stats
        const oldRating = editingReview.rating;
        const newAverage = ((reviewStats.averageRating * reviewStats.totalReviews) - oldRating + rating) / reviewStats.totalReviews;
        setReviewStats(prev => ({
          ...prev,
          averageRating: newAverage
        }));

        // Reset form
        setRating(0);
        setReviewText('');
        setEditingReview(null);
        setShowEditModal(false);
        
        alert('รีวิวถูกอัพเดทเรียบร้อยแล้ว!');
      } catch (error) {
        console.error('Error updating review:', error);
        alert('เกิดข้อผิดพลาดในการอัพเดทรีวิว');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('คุณต้องการลบรีวิวนี้หรือไม่?')) {
      try {
        await apiCall(`/${reviewId}`, 'DELETE');
        
        const deletedReview = myReviews.find(r => r.id === reviewId);
        setMyReviews(prev => prev.filter(review => review.id !== reviewId));

        // Update stats
        if (deletedReview) {
          setReviewStats(prev => ({
            totalReviews: prev.totalReviews - 1,
            averageRating: prev.totalReviews > 1 
              ? ((prev.averageRating * prev.totalReviews) - deletedReview.rating) / (prev.totalReviews - 1)
              : 0,
            totalHelpful: prev.totalHelpful - deletedReview.helpfulCount,
            totalSessions: prev.totalSessions - deletedReview.sessionsCompleted
          }));
        }

        alert('รีวิวถูกลบเรียบร้อยแล้ว!');
      } catch (error) {
        console.error('Error deleting review:', error);
        alert('เกิดข้อผิดพลาดในการลบรีวิว');
      }
    }
  };

  const handleHelpfulVote = async (reviewId) => {
    try {
      const isCurrentlyVoted = helpfulVotes[reviewId];
      
      await apiCall(`/${reviewId}/helpful`, 'POST', {
        helpful: !isCurrentlyVoted
      });

      setHelpfulVotes(prev => ({
        ...prev,
        [reviewId]: !prev[reviewId]
      }));

      setMyReviews(prev => prev.map(review =>
        review.id === reviewId
          ? {
              ...review,
              helpfulCount: isCurrentlyVoted
                ? review.helpfulCount - 1
                : review.helpfulCount + 1,
              userHasVoted: !isCurrentlyVoted
            }
          : review
      ));

      // Update stats
      setReviewStats(prev => ({
        ...prev,
        totalHelpful: isCurrentlyVoted 
          ? prev.totalHelpful - 1
          : prev.totalHelpful + 1
      }));

    } catch (error) {
      console.error('Error voting helpful:', error);
      alert('เกิดข้อผิดพลาดในการโหวต');
    }
  };

  const handleSkipReview = async (pendingId) => {
    if (window.confirm('คุณต้องการข้ามการรีวิวนี้หรือไม่?')) {
      try {
        await apiCall(`/pending/${pendingId}/skip`, 'POST');
        setPendingReviews(prev => prev.filter(p => p.id !== pendingId));
      } catch (error) {
        console.error('Error skipping review:', error);
        alert('เกิดข้อผิดพลาดในการข้ามรีวิว');
      }
    }
  };

  const handleShareReview = async (review) => {
    try {
      await apiCall(`/${review.id}/share`, 'POST', {
        platform: 'web'
      });

      if (navigator.share) {
        navigator.share({
          title: `รีวิว ${review.trainerName}`,
          text: review.review,
          url: window.location.href
        });
      } else {
        // Fallback to copy to clipboard
        navigator.clipboard.writeText(`รีวิว ${review.trainerName}: ${review.review}`);
        alert('คัดลอกลิงก์รีวิวแล้ว!');
      }
    } catch (error) {
      console.error('Error sharing review:', error);
      alert('เกิดข้อผิดพลาดในการแชร์รีวิว');
    }
  };

  // Loading State
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)',
        gap: '1rem'
      }}>
        <Loader size={48} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูลรีวิว...</p>
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)',
        gap: '1rem',
        padding: '2rem'
      }}>
        <AlertCircle size={48} color="var(--danger)" />
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--danger)', textAlign: 'center' }}>
          เกิดข้อผิดพลาดในการโหลดข้อมูล
        </h3>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1rem' }}>
          {error || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'}
        </p>
        <button
          onClick={() => fetchReviewsData()}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <RefreshCw size={16} />
          ลองใหม่
        </button>
      </div>
    );
  }

  const renderMyReviews = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Stats Summary */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '1.5rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '1rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.25rem' }}>
              {reviewStats.totalReviews}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>รีวิวทั้งหมด</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)', marginBottom: '0.25rem' }}>
              {reviewStats.averageRating.toFixed(1)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>คะแนนเฉลี่ย</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.25rem' }}>
              {reviewStats.totalHelpful}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>คนเห็นว่าเป็นประโยชน์</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '0.25rem' }}>
              {reviewStats.totalSessions}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>เซสชั่นทั้งหมด</div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {myReviews.length > 0 ? myReviews.map(review => (
        <div key={review.id} style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Review Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-white)'
              }}>
                {review.trainerAvatar || review.trainerName?.charAt(0)}
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {review.trainerName}
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {review.trainerSpecialty}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {review.canEdit && (
                <>
                  <button
                    onClick={() => handleEditReview(review)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      color: 'var(--info)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(66, 153, 225, 0.1)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      color: 'var(--danger)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(245, 101, 101, 0.1)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
              <button
                onClick={() => handleShareReview(review)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: 'var(--text-muted)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>

          {/* Rating and Date */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {renderStars(review.rating)}
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                {review.rating}.0
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {new Date(review.date || review.createdAt).toLocaleDateString('th-TH')}
            </div>
          </div>

          {/* Package Info */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                {review.packageName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                เสร็จสิ้น {review.sessionsCompleted} เซสชั่น
              </div>
            </div>
            <CheckCircle size={20} color="var(--success)" />
          </div>

          {/* Review Text */}
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
              {review.review}
            </p>
          </div>

          {/* Trainer Response */}
          {review.trainerResponse && (
            <div style={{
              backgroundColor: 'rgba(35, 41, 86, 0.05)',
              borderLeft: '3px solid var(--primary)',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.625rem',
                  fontWeight: '600',
                  color: 'var(--text-white)'
                }}>
                  {review.trainerAvatar || review.trainerName?.charAt(0)}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  ตอบกลับจาก {review.trainerName}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  • {new Date(review.trainerResponseDate).toLocaleDateString('th-TH')}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                {review.trainerResponse}
              </p>
            </div>
          )}

          {/* Review Stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => handleHelpfulVote(review.id)}
                style={{
                  backgroundColor: helpfulVotes[review.id] ? 'rgba(72, 187, 120, 0.1)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  color: helpfulVotes[review.id] ? 'var(--success)' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                <ThumbsUp size={14} fill={helpfulVotes[review.id] ? 'currentColor' : 'none'} />
                เป็นประโยชน์ ({review.helpfulCount || 0})
              </button>
            </div>
            
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              รีวิวนี้ช่วยคนอื่น {review.helpfulCount || 0} คน
            </div>
          </div>
        </div>
      )) : (
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <Star size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            ยังไม่มีรีวิว
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            เมื่อคุณเสร็จสิ้นแพคเกจการเทรน คุณจะสามารถรีวิวเทรนเนอร์ได้
          </p>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ดูแพคเกจที่รอรีวิว
          </button>
        </div>
      )}
    </div>
  );

  const renderPendingReviews = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Pending Summary */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Clock size={24} color="var(--warning)" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            แพคเกจที่รอรีวิว
          </h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          คุณมีแพคเกจที่เสร็จสิ้นแล้ว {pendingReviews.length} แพคเกจ ที่รอการรีวิว
        </p>
        {pendingReviews.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(237, 137, 54, 0.1)',
            border: '1px solid var(--warning)',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertTriangle size={16} color="var(--warning)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--warning)' }}>
              โปรดรีวิวภายใน 14 วันหลังเสร็จสิ้นแพคเกจ
            </span>
          </div>
        )}
      </div>

      {/* Pending Reviews List */}
      {pendingReviews.length > 0 ? pendingReviews.map(pending => (
        <div key={pending.id} style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-white)'
              }}>
                {pending.trainerAvatar || pending.trainerName?.charAt(0)}
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {pending.trainerName}
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {pending.trainerSpecialty}
                </p>
              </div>
            </div>

            <div style={{
              backgroundColor: pending.daysRemaining <= 3 ? 'rgba(245, 101, 101, 0.1)' : 'rgba(237, 137, 54, 0.1)',
              color: pending.daysRemaining <= 3 ? 'var(--danger)' : 'var(--warning)',
              padding: '0.25rem 0.75rem',
              borderRadius: '1rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Clock size={12} />
              {pending.daysRemaining} วันเหลือ
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {pending.packageName}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                เสร็จสิ้นเมื่อ {new Date(pending.completedDate).toLocaleDateString('th-TH')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '500' }}>
                ✓ {pending.sessionsCompleted} เซสชั่น
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => {
                setSelectedTrainer(pending);
                setShowReviewModal(true);
              }}
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                flex: 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--accent)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary)'}
            >
              เขียนรีวิว
            </button>
            <button
              onClick={() => handleSkipReview(pending.id)}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--border-color)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
            >
              ข้าม
            </button>
          </div>
        </div>
      )) : (
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <CheckCircle size={48} style={{ margin: '0 auto 1rem', color: 'var(--success)', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            ไม่มีรีวิวที่รอดำเนินการ
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            คุณได้รีวิวเทรนเนอร์ทั้งหมดแล้ว หรือยังไม่มีแพคเกจที่เสร็จสิ้น
          </p>
          <button
            onClick={() => setActiveTab('my-reviews')}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ดูรีวิวของฉัน
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ 
      padding: windowWidth <= 768 ? '1rem' : '2rem',
      backgroundColor: 'var(--bg-secondary)',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h1 style={{ 
            fontSize: windowWidth <= 768 ? '1.5rem' : '1.75rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            margin: 0
          }}>
            รีวิวเทรนเนอร์
          </h1>
          <button
            onClick={refreshData}
            disabled={refreshing}
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {windowWidth > 768 && 'รีเฟรช'}
          </button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          แบ่งปันประสบการณ์การเทรนของคุณและช่วยเหลือคนอื่น
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '0.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-white)' : 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flex: windowWidth <= 768 ? '1' : 'auto',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.id === 'pending' && pendingReviews.length > 0 && (
              <span style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--text-white)',
                borderRadius: '50%',
                width: '1.25rem',
                height: '1.25rem',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {pendingReviews.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'my-reviews' && renderMyReviews()}
      {activeTab === 'pending' && renderPendingReviews()}

      {/* Review Modal */}
      {showReviewModal && selectedTrainer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  รีวิวเทรนเนอร์
                </h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '0.25rem'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-white)'
                }}>
                  {selectedTrainer.trainerAvatar || selectedTrainer.trainerName?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                    {selectedTrainer.trainerName}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {selectedTrainer.packageName}
                  </div>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                ให้คะแนน
              </label>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                {renderStars(rating, 32, true, setRating)}
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {rating === 0 && 'เลือกคะแนน'}
                {rating === 1 && 'แย่มาก'}
                {rating === 2 && 'แย่'}
                {rating === 3 && 'ปานกลาง'}
                {rating === 4 && 'ดี'}
                {rating === 5 && 'ดีเยี่ยม'}
              </div>
            </div>

            {/* Review Text */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                เขียนรีวิว
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="แบ่งปันประสบการณ์ของคุณ..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  minHeight: '120px',
                  backgroundColor: 'var(--bg-secondary)'
                }}
                maxLength={500}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.25rem' }}>
                {reviewText.length}/500 ตัวอักษร
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowReviewModal(false)}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={rating === 0 || !reviewText.trim() || isSubmitting}
                style={{
                  flex: 1,
                  backgroundColor: (rating > 0 && reviewText.trim() && !isSubmitting) ? 'var(--primary)' : 'var(--border-color)',
                  color: 'var(--text-white)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: (rating > 0 && reviewText.trim() && !isSubmitting) ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    ส่งรีวิว
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {showEditModal && editingReview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  แก้ไขรีวิว
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '0.25rem'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-white)'
                }}>
                  {editingReview.trainerAvatar || editingReview.trainerName?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                    {editingReview.trainerName}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {editingReview.packageName}
                  </div>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                แก้ไขคะแนน
              </label>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                {renderStars(rating, 32, true, setRating)}
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {rating === 0 && 'เลือกคะแนน'}
                {rating === 1 && 'แย่มาก'}
                {rating === 2 && 'แย่'}
                {rating === 3 && 'ปานกลาง'}
                {rating === 4 && 'ดี'}
                {rating === 5 && 'ดีเยี่ยม'}
              </div>
            </div>

            {/* Review Text */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                แก้ไขรีวิว
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="แบ่งปันประสบการณ์ของคุณ..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  minHeight: '120px',
                  backgroundColor: 'var(--bg-secondary)'
                }}
                maxLength={500}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.25rem' }}>
                {reviewText.length}/500 ตัวอักษร
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpdateReview}
                disabled={rating === 0 || !reviewText.trim() || isSubmitting}
                style={{
                  flex: 1,
                  backgroundColor: (rating > 0 && reviewText.trim() && !isSubmitting) ? 'var(--info)' : 'var(--border-color)',
                  color: 'var(--text-white)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: (rating > 0 && reviewText.trim() && !isSubmitting) ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    กำลังอัพเดท...
                  </>
                ) : (
                  <>
                    <Edit size={16} />
                    อัพเดทรีวิว
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ClientReviews;