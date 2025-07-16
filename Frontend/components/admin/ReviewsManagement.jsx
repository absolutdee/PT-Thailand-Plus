import React, { useState, useEffect } from 'react';
import { 
  Star, Search, Filter, Eye, Edit, Trash2, 
  CheckCircle, XCircle, Clock, User, MessageSquare,
  ThumbsUp, ThumbsDown, Flag, MoreVertical, Loader
} from 'lucide-react';

const ReviewsManagement = ({ windowWidth }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Database states
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    reported: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);

  // API functions
  const fetchReviews = async (page = 1, search = '', status = 'all', rating = 'all') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search,
        status: status !== 'all' ? status : '',
        rating: rating !== 'all' ? rating : ''
      });

      const response = await fetch(`/api/admin/reviews?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  };

  const fetchReviewStats = async () => {
    try {
      const response = await fetch('/api/admin/reviews/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch review stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching review stats:', error);
      throw error;
    }
  };

  const updateReviewStatus = async (reviewId, status) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update review status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating review status:', error);
      throw error;
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete review');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  };

  // Load data when component mounts or filters change
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [reviewsResult, statsResult] = await Promise.all([
          fetchReviews(currentPage, searchTerm, statusFilter, ratingFilter),
          fetchReviewStats()
        ]);

        setReviews(reviewsResult.reviews || []);
        setTotalPages(reviewsResult.totalPages || 1);
        setStats(statsResult);
      } catch (error) {
        setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentPage, searchTerm, statusFilter, ratingFilter]);

  // Handle review approval
  const handleApproveReview = async (reviewId) => {
    setActionLoading(prev => ({ ...prev, [reviewId]: 'approving' }));
    try {
      await updateReviewStatus(reviewId, 'approved');
      
      // Update local state
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, status: 'approved' }
          : review
      ));

      // Refresh stats
      const newStats = await fetchReviewStats();
      setStats(newStats);
    } catch (error) {
      setError('ไม่สามารถอนุมัติรีวิวได้');
    } finally {
      setActionLoading(prev => ({ ...prev, [reviewId]: null }));
    }
  };

  // Handle review rejection
  const handleRejectReview = async (reviewId) => {
    setActionLoading(prev => ({ ...prev, [reviewId]: 'rejecting' }));
    try {
      await updateReviewStatus(reviewId, 'rejected');
      
      // Update local state
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, status: 'rejected' }
          : review
      ));

      // Refresh stats
      const newStats = await fetchReviewStats();
      setStats(newStats);
    } catch (error) {
      setError('ไม่สามารถปฏิเสธรีวิวได้');
    } finally {
      setActionLoading(prev => ({ ...prev, [reviewId]: null }));
    }
  };

  // Handle review deletion
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบรีวิวนี้?')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [reviewId]: 'deleting' }));
    try {
      await deleteReview(reviewId);
      
      // Remove from local state
      setReviews(prev => prev.filter(review => review.id !== reviewId));

      // Refresh stats
      const newStats = await fetchReviewStats();
      setStats(newStats);
    } catch (error) {
      setError('ไม่สามารถลบรีวิวได้');
    } finally {
      setActionLoading(prev => ({ ...prev, [reviewId]: null }));
    }
  };

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle filter changes
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleRatingFilterChange = (rating) => {
    setRatingFilter(rating);
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'var(--success)';
      case 'pending':
        return 'var(--warning)';
      case 'rejected':
        return 'var(--danger)';
      case 'reported':
        return 'var(--accent)';
      default:
        return 'var(--text-muted)';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'อนุมัติแล้ว';
      case 'pending':
        return 'รอการอนุมัติ';
      case 'rejected':
        return 'ปฏิเสธ';
      case 'reported':
        return 'มีการรายงาน';
      default:
        return status;
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        fill={index < rating ? 'var(--warning)' : 'none'}
        color={index < rating ? 'var(--warning)' : 'var(--border-color)'}
      />
    ));
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'var(--success)';
    if (rating >= 3) return 'var(--warning)';
    return 'var(--danger)';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ 
          color: 'var(--danger)', 
          fontSize: '1.125rem', 
          fontWeight: '600',
          marginBottom: '0.5rem'
        }}>
          เกิดข้อผิดพลาด
        </div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          {error}
        </div>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--primary)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          รีเฟรชหน้า
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '1.75rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          marginBottom: '0.5rem' 
        }}>
          จัดการรีวิว
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          จัดการและตรวจสอบรีวิวจากลูกค้าในระบบ
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(5, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <MessageSquare size={20} color="var(--accent)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>รีวิวทั้งหมด</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {loading ? (
              <Loader className="animate-spin" size={24} color="var(--text-muted)" />
            ) : (
              stats.total.toLocaleString()
            )}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <CheckCircle size={20} color="var(--success)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>อนุมัติแล้ว</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {loading ? (
              <Loader className="animate-spin" size={24} color="var(--text-muted)" />
            ) : (
              stats.approved.toLocaleString()
            )}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Clock size={20} color="var(--warning)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>รอการอนุมัติ</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {loading ? (
              <Loader className="animate-spin" size={24} color="var(--text-muted)" />
            ) : (
              stats.pending.toLocaleString()
            )}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Flag size={20} color="var(--danger)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>มีการรายงาน</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {loading ? (
              <Loader className="animate-spin" size={24} color="var(--text-muted)" />
            ) : (
              stats.reported.toLocaleString()
            )}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Star size={20} color="var(--info)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>คะแนนเฉลี่ย</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {loading ? (
              <Loader className="animate-spin" size={24} color="var(--text-muted)" />
            ) : (
              stats.averageRating.toFixed(1)
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        flexDirection: windowWidth <= 768 ? 'column' : 'row',
        gap: '1rem',
        marginBottom: '1.5rem',
        alignItems: windowWidth <= 768 ? 'stretch' : 'center'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            placeholder="ค้นหารีวิว..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              opacity: loading ? 0.7 : 1
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          disabled={loading}
          style={{
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            minWidth: '120px',
            opacity: loading ? 0.7 : 1
          }}
        >
          <option value="all">สถานะทั้งหมด</option>
          <option value="approved">อนุมัติแล้ว</option>
          <option value="pending">รอการอนุมัติ</option>
          <option value="reported">มีการรายงาน</option>
          <option value="rejected">ปฏิเสธ</option>
        </select>
        <select
          value={ratingFilter}
          onChange={(e) => handleRatingFilterChange(e.target.value)}
          disabled={loading}
          style={{
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            minWidth: '100px',
            opacity: loading ? 0.7 : 1
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

      {/* Reviews List */}
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)'
        }}>
          <Loader className="animate-spin" size={48} style={{ color: 'var(--info)', marginBottom: '1rem' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>กำลังโหลดรีวิว...</div>
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)'
        }}>
          <MessageSquare size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>ไม่พบรีวิวที่ตรงกับเงื่อนไข</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {reviews.map((review) => (
            <div key={review.id} style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              opacity: actionLoading[review.id] ? 0.7 : 1
            }}>
              {/* Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-white)',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}>
                    {review.customer_name?.charAt(0) || review.customer?.charAt(0) || 'U'}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      marginBottom: '0.5rem'
                    }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        margin: 0
                      }}>
                        {review.customer_name || review.customer}
                      </h3>
                      <span style={{ 
                        fontSize: '0.875rem', 
                        color: 'var(--text-secondary)' 
                      }}>
                        → {review.trainer_name || review.trainer}
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      {renderStars(review.rating)}
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: getRatingColor(review.rating)
                      }}>
                        {review.rating}.0
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)'
                    }}>
                      <span>{formatDate(review.created_at || review.date)}</span>
                      <span>{review.package_name || review.packageType}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: `${getStatusColor(review.status)}20`,
                    color: getStatusColor(review.status),
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {getStatusText(review.status)}
                  </span>
                  
                  <div style={{ position: 'relative' }}>
                    <button style={{
                      padding: '0.25rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}>
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  {review.title}
                </h4>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {review.comment}
                </p>
              </div>

              {/* Review Stats & Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ThumbsUp size={16} color="var(--success)" />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {review.likes || 0}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ThumbsDown size={16} color="var(--danger)" />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {review.dislikes || 0}
                    </span>
                  </div>
                  {(review.reports || 0) > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Flag size={16} color="var(--accent)" />
                      <span style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>
                        {review.reports} รายงาน
                      </span>
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {review.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleApproveReview(review.id)}
                        disabled={!!actionLoading[review.id]}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--success)',
                          color: 'var(--text-white)',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: actionLoading[review.id] ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {actionLoading[review.id] === 'approving' ? (
                          <Loader className="animate-spin" size={14} />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        อนุมัติ
                      </button>
                      <button 
                        onClick={() => handleRejectReview(review.id)}
                        disabled={!!actionLoading[review.id]}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--danger)',
                          color: 'var(--text-white)',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: actionLoading[review.id] ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {actionLoading[review.id] === 'rejecting' ? (
                          <Loader className="animate-spin" size={14} />
                        ) : (
                          <XCircle size={14} />
                        )}
                        ปฏิเสธ
                      </button>
                    </>
                  )}
                  
                  <button style={{
                    padding: '0.25rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}>
                    <Eye size={16} />
                  </button>
                  
                  <button 
                    onClick={() => handleDeleteReview(review.id)}
                    disabled={!!actionLoading[review.id]}
                    style={{
                      padding: '0.25rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--danger)',
                      cursor: actionLoading[review.id] ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {actionLoading[review.id] === 'deleting' ? (
                      <Loader className="animate-spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && reviews.length > 0 && totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: currentPage === 1 ? 'var(--bg-secondary)' : 'var(--primary)',
              color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-white)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.375rem',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ก่อนหน้า
          </button>
          
          <span style={{ 
            fontSize: '0.875rem', 
            color: 'var(--text-secondary)',
            padding: '0 1rem'
          }}>
            หน้า {currentPage} จาก {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: currentPage === totalPages ? 'var(--bg-secondary)' : 'var(--primary)',
              color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-white)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.375rem',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewsManagement;