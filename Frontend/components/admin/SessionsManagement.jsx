import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Search, Filter, Eye, 
  CheckCircle, XCircle, AlertTriangle, User, Target,
  MapPin, Play, Pause, RotateCcw, Edit, Loader
} from 'lucide-react';

const SessionsManagement = ({ windowWidth }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [trainerFilter, setTrainerFilter] = useState('all');

  // Database states
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0
  });
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);

  // API functions
  const fetchSessions = async (page = 1, search = '', status = 'all', date = 'today', trainer = 'all') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search,
        status: status !== 'all' ? status : '',
        date: date !== 'all' ? date : '',
        trainer: trainer !== 'all' ? trainer : ''
      });

      const response = await fetch(`/api/admin/sessions?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  };

  const fetchSessionStats = async () => {
    try {
      const response = await fetch('/api/admin/sessions/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching session stats:', error);
      throw error;
    }
  };

  const fetchTrainers = async () => {
    try {
      const response = await fetch('/api/admin/trainers/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trainers');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching trainers:', error);
      throw error;
    }
  };

  const updateSessionStatus = async (sessionId, status) => {
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update session status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating session status:', error);
      throw error;
    }
  };

  const rescheduleSession = async (sessionId, newDate, newTime) => {
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ 
          date: newDate, 
          time: newTime,
          status: 'rescheduled'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reschedule session');
      }

      return await response.json();
    } catch (error) {
      console.error('Error rescheduling session:', error);
      throw error;
    }
  };

  // Load data when component mounts or filters change
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [sessionsResult, statsResult, trainersResult] = await Promise.all([
          fetchSessions(currentPage, searchTerm, statusFilter, dateFilter, trainerFilter),
          fetchSessionStats(),
          fetchTrainers()
        ]);

        setSessions(sessionsResult.sessions || []);
        setTotalPages(sessionsResult.totalPages || 1);
        setStats(statsResult);
        setTrainers(trainersResult.trainers || []);
      } catch (error) {
        setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentPage, searchTerm, statusFilter, dateFilter, trainerFilter]);

  // Handle session status updates
  const handleStatusUpdate = async (sessionId, newStatus) => {
    setActionLoading(prev => ({ ...prev, [sessionId]: 'updating' }));
    try {
      await updateSessionStatus(sessionId, newStatus);
      
      // Update local state
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: newStatus }
          : session
      ));

      // Refresh stats
      const newStats = await fetchSessionStats();
      setStats(newStats);
    } catch (error) {
      setError('ไม่สามารถอัพเดทสถานะเซสชั่นได้');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: null }));
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

  const handleDateFilterChange = (date) => {
    setDateFilter(date);
    setCurrentPage(1);
  };

  const handleTrainerFilterChange = (trainer) => {
    setTrainerFilter(trainer);
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'var(--info)';
      case 'in-progress':
        return 'var(--warning)';
      case 'completed':
        return 'var(--success)';
      case 'cancelled':
        return 'var(--danger)';
      case 'rescheduled':
        return 'var(--accent)';
      default:
        return 'var(--text-muted)';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled':
        return 'กำหนดการ';
      case 'in-progress':
        return 'กำลังดำเนินการ';
      case 'completed':
        return 'เสร็จสิ้น';
      case 'cancelled':
        return 'ยกเลิก';
      case 'rescheduled':
        return 'เลื่อนเวลา';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Clock size={16} />;
      case 'in-progress':
        return <Play size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      case 'cancelled':
        return <XCircle size={16} />;
      case 'rescheduled':
        return <RotateCcw size={16} />;
      default:
        return <AlertTriangle size={16} />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    // Handle different time formats from database
    if (timeString.includes(' - ')) {
      return timeString;
    }
    // Assume it's a single time and format it
    return timeString;
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
          จัดการเซสชั่นทั้งหมด
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          ติดตามและจัดการเซสชั่นการเทรนทั้งหมดในระบบ
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)',
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
            <Calendar size={20} color="var(--accent)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ทั้งหมด</span>
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
            <Clock size={20} color="var(--info)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>กำหนดการ</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {loading ? (
              <Loader className="animate-spin" size={24} color="var(--text-muted)" />
            ) : (
              stats.scheduled.toLocaleString()
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
            <Play size={20} color="var(--warning)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>กำลังดำเนินการ</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {loading ? (
              <Loader className="animate-spin" size={24} color="var(--text-muted)" />
            ) : (
              stats.inProgress.toLocaleString()
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
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>เสร็จสิ้น</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {loading ? (
              <Loader className="animate-spin" size={24} color="var(--text-muted)" />
            ) : (
              stats.completed.toLocaleString()
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
            <XCircle size={20} color="var(--danger)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ยกเลิก</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {loading ? (
              <Loader className="animate-spin" size={24} color="var(--text-muted)" />
            ) : (
              stats.cancelled.toLocaleString()
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
            <Calendar size={20} color="var(--info)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>วันนี้</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {loading ? (
              <Loader className="animate-spin" size={24} color="var(--text-muted)" />
            ) : (
              stats.today.toLocaleString()
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
            placeholder="ค้นหาเซสชั่น..."
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
            minWidth: '140px',
            opacity: loading ? 0.7 : 1
          }}
        >
          <option value="all">สถานะทั้งหมด</option>
          <option value="scheduled">กำหนดการ</option>
          <option value="in-progress">กำลังดำเนินการ</option>
          <option value="completed">เสร็จสิ้น</option>
          <option value="cancelled">ยกเลิก</option>
          <option value="rescheduled">เลื่อนเวลา</option>
        </select>
        <select
          value={dateFilter}
          onChange={(e) => handleDateFilterChange(e.target.value)}
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
          <option value="all">วันที่ทั้งหมด</option>
          <option value="today">วันนี้</option>
          <option value="tomorrow">พรุ่งนี้</option>
          <option value="this-week">สัปดาห์นี้</option>
          <option value="this-month">เดือนนี้</option>
        </select>
        <select
          value={trainerFilter}
          onChange={(e) => handleTrainerFilterChange(e.target.value)}
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
          <option value="all">เทรนเนอร์ทั้งหมด</option>
          {trainers.map((trainer) => (
            <option key={trainer.id} value={trainer.id}>
              {trainer.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)'
        }}>
          <Loader className="animate-spin" size={48} style={{ color: 'var(--info)', marginBottom: '1rem' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>กำลังโหลดเซสชั่น...</div>
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)'
        }}>
          <Calendar size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>ไม่พบเซสชั่นที่ตรงกับเงื่อนไข</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sessions.map((session) => (
            <div key={session.id} style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              opacity: actionLoading[session.id] ? 0.7 : 1
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
                    backgroundColor: `${getStatusColor(session.status)}20`,
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    color: getStatusColor(session.status)
                  }}>
                    {getStatusIcon(session.status)}
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
                        {session.type || session.session_type}
                      </h3>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: `${getStatusColor(session.status)}20`,
                        color: getStatusColor(session.status),
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {getStatusText(session.status)}
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={14} />
                        <span><strong>ลูกค้า:</strong> {session.customer_name || session.customer}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Target size={14} />
                        <span><strong>เทรนเนอร์:</strong> {session.trainer_name || session.trainer}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} />
                        <span><strong>วันเวลา:</strong> {formatDate(session.date)} • {formatTime(session.time || session.start_time)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={14} />
                        <span><strong>สถานที่:</strong> {session.location || session.gym_location}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {session.status === 'scheduled' && (
                    <>
                      <button 
                        onClick={() => handleStatusUpdate(session.id, 'in-progress')}
                        disabled={!!actionLoading[session.id]}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: 'var(--warning)',
                          color: 'var(--text-white)',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: actionLoading[session.id] ? 'not-allowed' : 'pointer'
                        }}
                        title="เริ่มเซสชั่น"
                      >
                        {actionLoading[session.id] ? (
                          <Loader className="animate-spin" size={16} />
                        ) : (
                          <Play size={16} />
                        )}
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(session.id, 'cancelled')}
                        disabled={!!actionLoading[session.id]}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: 'var(--danger)',
                          color: 'var(--text-white)',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: actionLoading[session.id] ? 'not-allowed' : 'pointer'
                        }}
                        title="ยกเลิกเซสชั่น"
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  )}
                  
                  {session.status === 'in-progress' && (
                    <button 
                      onClick={() => handleStatusUpdate(session.id, 'completed')}
                      disabled={!!actionLoading[session.id]}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: 'var(--success)',
                        color: 'var(--text-white)',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: actionLoading[session.id] ? 'not-allowed' : 'pointer'
                      }}
                      title="จบเซสชั่น"
                    >
                      {actionLoading[session.id] ? (
                        <Loader className="animate-spin" size={16} />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                    </button>
                  )}
                  
                  <button style={{
                    padding: '0.5rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}>
                    <Eye size={16} />
                  </button>
                  <button style={{
                    padding: '0.5rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}>
                    <Edit size={16} />
                  </button>
                </div>
              </div>

              {/* Session Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-muted)',
                    marginBottom: '0.25rem'
                  }}>
                    แพคเกจ
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}>
                    {session.package_name || session.package}
                  </div>
                </div>
                <div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-muted)',
                    marginBottom: '0.25rem'
                  }}>
                    เซสชั่น
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}>
                    {session.session_number || session.sessionNumber || 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-muted)',
                    marginBottom: '0.25rem'
                  }}>
                    ระยะเวลา
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}>
                    {session.duration || 60} นาที
                  </div>
                </div>
              </div>

              {/* Notes */}
              {session.notes && (
                <div style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  borderLeft: '4px solid var(--accent)'
                }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-muted)',
                    marginBottom: '0.25rem'
                  }}>
                    หมายเหตุ
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: 'var(--text-secondary)',
                    lineHeight: '1.5'
                  }}>
                    {session.notes}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && sessions.length > 0 && totalPages > 1 && (
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

export default SessionsManagement;