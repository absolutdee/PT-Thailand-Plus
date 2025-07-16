import React, { useState, useEffect } from 'react';
import {
  Star, Filter, Search, MessageCircle, User, Calendar,
  TrendingUp, Award, Heart, ThumbsUp, Reply, Send,
  ChevronDown, ChevronUp, MoreVertical, Flag, Check,
  Clock, Eye, Sparkles, Target, AlertCircle, RefreshCw
} from 'lucide-react';

const ReviewsPage = ({ windowWidth }) => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [selectedRating, setSelectedRating] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState({});
  const [showReplyForm, setShowReplyForm] = useState({});
  const [expandedReviews, setExpandedReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingReply, setSubmittingReply] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Fetch reviews from database
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/trainer/reviews', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data);
      setFilteredReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('ไม่สามารถโหลดข้อมูลรีวิวได้');
    } finally {
      setLoading(false);
    }
  };

  const refreshReviews = async () => {
    setRefreshing(true);
    try {
      await fetchReviews();
    } finally {
      setRefreshing(false);
    }
  };

  // Handle reply submission
  const handleReply = async (reviewId) => {
    if (!replyText[reviewId]?.trim()) return;

    setSubmittingReply(prev => ({ ...prev, [reviewId]: true }));
    try {
      const response = await fetch(`/api/trainer/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reply: replyText[reviewId].trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit reply');
      }

      const updatedReview = await response.json();

      // Update local state
      const updatedReviews = reviews.map(review => {
        if (review.id === reviewId) {
          return {
            ...review,
            replied: true,
            reply: updatedReview.reply,
            replyDate: updatedReview.replyDate
          };
        }
        return review;
      });

      setReviews(updatedReviews);
      setReplyText(prev => ({ ...prev, [reviewId]: '' }));
      setShowReplyForm(prev => ({ ...prev, [reviewId]: false }));

      // Show success message
      alert('ตอบกลับรีวิวเรียบร้อยแล้ว');

    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('เกิดข้อผิดพลาดในการตอบกลับรีวิว');
    } finally {
      setSubmittingReply(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  // Handle helpful vote
  const handleHelpfulVote = async (reviewId) => {
    try {
      const response = await fetch(`/api/trainer/reviews/${reviewId}/helpful`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update helpful count');
      }

      const { helpful } = await response.json();

      // Update local state
      const updatedReviews = reviews.map(review => {
        if (review.id === reviewId) {
          return { ...review, helpful };
        }
        return review;
      });

      setReviews(updatedReviews);
    } catch (error) {
      console.error('Error updating helpful count:', error);
    }
  };

  // Delete reply
  const handleDeleteReply = async (reviewId) => {
    if (window.confirm('คุณต้องการลบการตอบกลับนี้หรือไม่?')) return;

    try {
      const response = await fetch(`/api/trainer/reviews/${reviewId}/reply`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete reply');
      }

      // Update local state
      const updatedReviews = reviews.map(review => {
        if (review.id === reviewId) {
          return {
            ...review,
            replied: false,
            reply: null,
            replyDate: null
          };
        }
        return review;
      });

      setReviews(updatedReviews);
      alert('ลบการตอบกลับเรียบร้อยแล้ว');

    } catch (error) {
      console.error('Error deleting reply:', error);
      alert('เกิดข้อผิดพลาดในการลบการตอบกลับ');
    }
  };

  // Report inappropriate review
  const handleReportReview = async (reviewId, reason) => {
    try {
      const response = await fetch(`/api/trainer/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error('Failed to report review');
      }

      alert('รายงานรีวิวเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error reporting review:', error);
      alert('เกิดข้อผิดพลาดในการรายงานรีวิว');
    }
  };

  // คำนวณสถิติ
  const stats = {
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : 0,
    ratingDistribution: [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length,
      percentage: reviews.length > 0 ? ((reviews.filter(r => r.rating === rating).length / reviews.length) * 100).toFixed(1) : 0
    })),
    replyRate: reviews.length > 0 ? ((reviews.filter(r => r.replied).length / reviews.length) * 100).toFixed(1) : 0
  };

  // ฟิลเตอร์รีวิว
  useEffect(() => {
    let filtered = reviews;

    if (selectedRating !== 'all') {
      filtered = filtered.filter(review => review.rating === parseInt(selectedRating));
    }

    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.packageName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReviews(filtered);
  }, [selectedRating, searchTerm, reviews]);

  // แสดงดาว
  const renderStars = (rating, size = 16) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={size}
            style={{
              color: star <= rating ? '#fbbf24' : '#e5e7eb',
              fill: star <= rating ? '#fbbf24' : 'none'
            }}
          />
        ))}
      </div>
    );
  };

  // การ์ดสถิติ
  const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'var(--primary)' }) => (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '1rem',
      padding: '1.5rem',
      border: '1px solid var(--border-color)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        width: '60px',
        height: '60px',
        backgroundColor: `${color}15`,
        borderRadius: '50%'
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: color,
            margin: '0'
          }}>{value}</h3>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            margin: '0.25rem 0 0 0'
          }}>{title}</p>
          {subtitle && (
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              margin: '0.25rem 0 0 0'
            }}>{subtitle}</p>
          )}
        </div>
        <Icon size={24} style={{ color: color, opacity: 0.7 }} />
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '60vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--border-color)',
          borderTop: '4px solid var(--accent)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูลรีวิว...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        padding: '2rem',
        textAlign: 'center',
        border: '1px solid var(--danger)',
        margin: '2rem 0'
      }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
        <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>เกิดข้อผิดพลาด</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={fetchReviews}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--primary)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '0', minHeight: '100vh' }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Header */}
      <div style={{
        marginBottom: '2rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: '0 0 0.5rem 0'
          }}>
            รีวิวจากลูกค้า
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            margin: '0',
            fontSize: '1rem'
          }}>
            จัดการและตอบกลับรีวิวจากลูกค้าของคุณ
          </p>
        </div>
        <button
          onClick={refreshReviews}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--primary)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '0.875rem',
            opacity: refreshing ? 0.6 : 1
          }}
        >
          <RefreshCw size={16} style={{ 
            animation: refreshing ? 'spin 1s linear infinite' : 'none' 
          }} />
          {refreshing ? 'กำลังรีเฟรช...' : 'รีเฟรช'}
        </button>
      </div>

      {/* สถิติรีวิว */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 
          ? '1fr' 
          : windowWidth <= 1024 
          ? 'repeat(2, 1fr)' 
          : 'repeat(4, 1fr)',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <StatsCard
          title="คะแนนเฉลี่ย"
          value={stats.averageRating}
          subtitle={`จาก ${stats.totalReviews} รีวิว`}
          icon={Award}
          color="var(--accent)"
        />
        <StatsCard
          title="รีวิวทั้งหมด"
          value={stats.totalReviews}
          subtitle="รีวิวที่ได้รับ"
          icon={MessageCircle}
          color="var(--primary)"
        />
        <StatsCard
          title="อัตราการตอบกลับ"
          value={`${stats.replyRate}%`}
          subtitle="ตอบกลับแล้ว"
          icon={Reply}
          color="var(--success)"
        />
        <StatsCard
          title="ความพึงพอใจ"
          value={`${stats.totalReviews > 0 ? ((stats.ratingDistribution[0].count + stats.ratingDistribution[1].count) / stats.totalReviews * 100).toFixed(0) : 0}%`}
          subtitle="4-5 ดาว"
          icon={Sparkles}
          color="var(--warning)"
        />
      </div>

      {/* การแจกแจงคะแนน */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        padding: '1.5rem',
        border: '1px solid var(--border-color)',
        marginBottom: '2rem'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '1rem'
        }}>การแจกแจงคะแนน</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {stats.ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '80px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{rating}</span>
                <Star size={14} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
              </div>
              
              <div style={{
                flex: 1,
                height: '8px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${percentage}%`,
                  backgroundColor: rating >= 4 ? 'var(--success)' : rating >= 3 ? 'var(--warning)' : 'var(--danger)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              
              <div style={{
                minWidth: '60px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}>
                <span>{count}</span>
                <span>({percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ตัวกรองและค้นหา */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        padding: '1.5rem',
        border: '1px solid var(--border-color)',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: windowWidth <= 768 ? 'column' : 'row',
          gap: '1rem',
          alignItems: windowWidth <= 768 ? 'stretch' : 'center'
        }}>
          {/* ค้นหา */}
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              type="text"
              placeholder="ค้นหารีวิว, ชื่อลูกค้า หรือแพคเกจ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          {/* ฟิลเตอร์คะแนน */}
          <div style={{ position: 'relative', minWidth: '200px' }}>
            <Filter size={16} style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '0.875rem',
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">คะแนนทั้งหมด</option>
              <option value="5">5 ดาว</option>
              <option value="4">4 ดาว</option>
              <option value="3">3 ดาว</option>
              <option value="2">2 ดาว</option>
              <option value="1">1 ดาว</option>
            </select>
          </div>
        </div>
      </div>

      {/* รายการรีวิว */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {filteredReviews.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            border: '1px solid var(--border-color)'
          }}>
            <Star size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem'
            }}>ไม่พบรีวิวที่ค้นหา</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              ลองเปลี่ยนคำค้นหาหรือตัวกรองดู
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '1rem',
              padding: '1.5rem',
              border: '1px solid var(--border-color)',
              transition: 'all 0.2s ease'
            }}>
              {/* ส่วนหัวรีวิว */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-white)',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {review.clientAvatar || review.clientName.charAt(0)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      margin: '0'
                    }}>{review.clientName}</h4>
                    {renderStars(review.rating, 16)}
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.5rem'
                    }}>
                      {review.sessionCount} เซสชั่น
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={14} />
                      {new Date(review.date).toLocaleDateString('th-TH')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Target size={14} />
                      {review.packageName}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {review.helpful > 0 && (
                    <button 
                      onClick={() => handleHelpfulVote(review.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem'
                      }}
                    >
                      <ThumbsUp size={12} />
                      {review.helpful}
                    </button>
                  )}
                  <button
                    onClick={() => handleReportReview(review.id, 'inappropriate')}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              {/* ความคิดเห็น */}
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                  color: 'var(--text-primary)',
                  margin: '0'
                }}>
                  {review.comment}
                </p>
              </div>

              {/* การตอบกลับ */}
              {review.replied ? (
                <div style={{
                  backgroundColor: 'rgba(223, 37, 40, 0.05)',
                  borderLeft: '3px solid var(--accent)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Reply size={14} style={{ color: 'var(--accent)' }} />
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'var(--accent)'
                      }}>
                        การตอบกลับของคุณ
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)'
                      }}>
                        {new Date(review.replyDate).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteReply(review.id)}
                      style={{
                        padding: '0.25rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        borderRadius: '0.25rem'
                      }}
                      title="ลบการตอบกลับ"
                    >
                      ×
                    </button>
                  </div>
                  <p style={{
                    fontSize: '0.875rem',
                    lineHeight: '1.6',
                    color: 'var(--text-primary)',
                    margin: '0'
                  }}>
                    {review.reply}
                  </p>
                </div>
              ) : (
                <div>
                  {!showReplyForm[review.id] ? (
                    <button
                      onClick={() => setShowReplyForm(prev => ({ ...prev, [review.id]: true }))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--accent)',
                        color: 'var(--text-white)',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#c41e3a';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'var(--accent)';
                      }}
                    >
                      <Reply size={16} />
                      ตอบกลับรีวิว
                    </button>
                  ) : (
                    <div style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '0.75rem',
                      padding: '1rem'
                    }}>
                      <textarea
                        value={replyText[review.id] || ''}
                        onChange={(e) => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                        placeholder="เขียนการตอบกลับ..."
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          padding: '0.75rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          resize: 'vertical',
                          outline: 'none',
                          marginBottom: '0.75rem',
                          fontFamily: 'inherit'
                        }}
                      />
                      <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        justifyContent: 'flex-end'
                      }}>
                        <button
                          onClick={() => {
                            setShowReplyForm(prev => ({ ...prev, [review.id]: false }));
                            setReplyText(prev => ({ ...prev, [review.id]: '' }));
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'transparent',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                          }}
                        >
                          ยกเลิก
                        </button>
                        <button
                          onClick={() => handleReply(review.id)}
                          disabled={!replyText[review.id]?.trim() || submittingReply[review.id]}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: (replyText[review.id]?.trim() && !submittingReply[review.id]) ? 'var(--accent)' : 'var(--text-muted)',
                            color: 'var(--text-white)',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            cursor: (replyText[review.id]?.trim() && !submittingReply[review.id]) ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <Send size={14} />
                          {submittingReply[review.id] ? 'กำลังส่ง...' : 'ส่งการตอบกลับ'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;