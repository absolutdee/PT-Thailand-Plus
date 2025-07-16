import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, MapPin, 
  CheckCircle, AlertCircle, XCircle,
  ChevronLeft, ChevronRight, Plus,
  MoreVertical, Edit, Trash2, Phone,
  MessageSquare, Filter, Search, X,
  Eye, Star, Users, Dumbbell, Camera,
  Heart, Activity, Timer, Trophy,
  Bell, Settings, Download, Share2, RefreshCw,
  Loader
} from 'lucide-react';

const ClientSchedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Database-related states
  const [scheduleData, setScheduleData] = useState([]);
  const [availableTrainers, setAvailableTrainers] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [packageOptions, setPackageOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Booking form states
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingNotes, setBookingNotes] = useState('');

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

  // API service functions
  const scheduleApiService = {
    // Base API URL
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',

    // Get client's sessions
    async getClientSessions() {
      const response = await fetch(`${this.baseURL}/client/schedule/sessions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },

    // Get available trainers
    async getAvailableTrainers(date = null) {
      const params = date ? `?date=${date}` : '';
      const response = await fetch(`${this.baseURL}/client/schedule/trainers${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch trainers');
      return response.json();
    },

    // Get available time slots for a trainer on a specific date
    async getAvailableTimeSlots(trainerId, date) {
      const response = await fetch(`${this.baseURL}/client/schedule/timeslots?trainerId=${trainerId}&date=${date}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch time slots');
      return response.json();
    },

    // Get package options for a trainer
    async getPackageOptions(trainerId) {
      const response = await fetch(`${this.baseURL}/client/schedule/packages?trainerId=${trainerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch packages');
      return response.json();
    },

    // Book new session
    async bookSession(sessionData) {
      const response = await fetch(`${this.baseURL}/client/schedule/book`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
      });
      if (!response.ok) throw new Error('Failed to book session');
      return response.json();
    },

    // Update session status
    async updateSessionStatus(sessionId, status, reason = '') {
      const response = await fetch(`${this.baseURL}/client/schedule/sessions/${sessionId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, reason })
      });
      if (!response.ok) throw new Error('Failed to update session status');
      return response.json();
    },

    // Reschedule session
    async rescheduleSession(sessionId, newDate, newTime, reason = '') {
      const response = await fetch(`${this.baseURL}/client/schedule/sessions/${sessionId}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          newDate, 
          newTime, 
          reason 
        })
      });
      if (!response.ok) throw new Error('Failed to reschedule session');
      return response.json();
    },

    // Get session details
    async getSessionDetails(sessionId) {
      const response = await fetch(`${this.baseURL}/client/schedule/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch session details');
      return response.json();
    },

    // Search sessions
    async searchSessions(query, filters = {}) {
      const params = new URLSearchParams({ query, ...filters });
      const response = await fetch(`${this.baseURL}/client/schedule/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to search sessions');
      return response.json();
    },

    // Get schedule statistics
    async getScheduleStats() {
      const response = await fetch(`${this.baseURL}/client/schedule/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch schedule stats');
      return response.json();
    },

    // Cancel session
    async cancelSession(sessionId, reason = '') {
      const response = await fetch(`${this.baseURL}/client/schedule/sessions/${sessionId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      if (!response.ok) throw new Error('Failed to cancel session');
      return response.json();
    },

    // Confirm session
    async confirmSession(sessionId) {
      const response = await fetch(`${this.baseURL}/client/schedule/sessions/${sessionId}/confirm`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to confirm session');
      return response.json();
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load sessions and trainers in parallel
        const [sessionsData, trainersData] = await Promise.all([
          scheduleApiService.getClientSessions(),
          scheduleApiService.getAvailableTrainers()
        ]);

        setScheduleData(sessionsData.sessions || []);
        setAvailableTrainers(trainersData.trainers || []);
      } catch (err) {
        setError(err.message);
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const sessionsData = await scheduleApiService.getClientSessions();
        setScheduleData(sessionsData.sessions || []);
      } catch (err) {
        console.error('Auto-refresh error:', err);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Load trainer-specific data when trainer is selected
  useEffect(() => {
    const loadTrainerData = async () => {
      if (selectedTrainer && bookingDate) {
        try {
          setActionLoading(true);
          
          const [timeSlotsData, packagesData] = await Promise.all([
            scheduleApiService.getAvailableTimeSlots(selectedTrainer.id, bookingDate),
            scheduleApiService.getPackageOptions(selectedTrainer.id)
          ]);

          setAvailableTimeSlots(timeSlotsData.timeSlots || []);
          setPackageOptions(packagesData.packages || []);
        } catch (err) {
          setError(err.message);
          console.error('Error loading trainer data:', err);
        } finally {
          setActionLoading(false);
        }
      }
    };

    loadTrainerData();
  }, [selectedTrainer, bookingDate]);

  // Refresh data function
  const refreshData = async () => {
    try {
      const sessionsData = await scheduleApiService.getClientSessions();
      setScheduleData(sessionsData.sessions || []);
    } catch (err) {
      setError(err.message);
      console.error('Error refreshing data:', err);
    }
  };

  // Filter and search functions
  const filteredSessions = scheduleData.filter(session => {
    const matchesFilter = filterStatus === 'all' || session.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      session.workoutType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.trainerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.location?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const upcomingSessions = filteredSessions
    .filter(session => {
      const sessionDateTime = new Date(`${session.date}T${session.time}`);
      return sessionDateTime >= new Date();
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA - dateB;
    });

  const todaySessions = filteredSessions.filter(session => 
    session.date === new Date().toISOString().split('T')[0]
  );

  // Calendar functions
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getSessionsForDate = (day) => {
    if (!day) return [];
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredSessions.filter(session => session.date === dateString);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'var(--success)';
      case 'pending': return 'var(--warning)';
      case 'cancelled': return 'var(--danger)';
      case 'completed': return 'var(--info)';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'ยืนยันแล้ว';
      case 'pending': return 'รอยืนยัน';
      case 'cancelled': return 'ยกเลิก';
      case 'completed': return 'เสร็จสิ้น';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle size={16} />;
      case 'pending': return <AlertCircle size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      default: return null;
    }
  };

  // Session action handlers
  const handleSessionAction = async (sessionId, action, reason = '') => {
    try {
      setActionLoading(true);
      
      switch (action) {
        case 'confirm':
          await scheduleApiService.confirmSession(sessionId);
          break;
        case 'cancel':
          await scheduleApiService.cancelSession(sessionId, reason);
          break;
        default:
          console.log(`${action} session ${sessionId}`);
      }
      
      await refreshData();
    } catch (err) {
      setError(err.message);
      console.error(`Error ${action} session:`, err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewSession = async (session) => {
    try {
      setActionLoading(true);
      // If session doesn't have complete details, fetch them
      if (!session.workoutPlan) {
        const sessionDetails = await scheduleApiService.getSessionDetails(session.id);
        setSelectedSession(sessionDetails);
      } else {
        setSelectedSession(session);
      }
      setShowSessionModal(true);
    } catch (err) {
      setError(err.message);
      console.error('Error viewing session:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = (session) => {
    setSelectedSession(session);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async (newDate, newTime, reason) => {
    try {
      setActionLoading(true);
      await scheduleApiService.rescheduleSession(selectedSession.id, newDate, newTime, reason);
      await refreshData();
      setShowRescheduleModal(false);
      setSelectedSession(null);
    } catch (err) {
      setError(err.message);
      console.error('Error rescheduling session:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBookSession = async () => {
    try {
      if (!selectedTrainer || !selectedTimeSlot || !selectedPackage) {
        setError('กรุณาเลือกเทรนเนอร์ เวลา และแพคเกจ');
        return;
      }

      setActionLoading(true);
      
      const sessionData = {
        trainerId: selectedTrainer.id,
        packageId: selectedPackage.id,
        date: bookingDate,
        time: selectedTimeSlot,
        notes: bookingNotes,
        duration: selectedPackage.duration,
        price: selectedPackage.price
      };

      await scheduleApiService.bookSession(sessionData);
      await refreshData();
      
      // Reset booking form
      setSelectedTrainer(null);
      setSelectedPackage(null);
      setSelectedTimeSlot(null);
      setBookingNotes('');
      setShowBookingModal(false);
    } catch (err) {
      setError(err.message);
      console.error('Error booking session:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Search functionality
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchTerm('');
      return;
    }

    try {
      setSearchTerm(query);
      const searchResults = await scheduleApiService.searchSessions(query, { status: filterStatus });
      setScheduleData(searchResults.sessions || []);
    } catch (err) {
      console.error('Search error:', err);
      // Fall back to local filtering if search fails
      setSearchTerm(query);
    }
  };

  // Loading component
  const LoadingSpinner = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      color: 'var(--text-secondary)'
    }}>
      <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ marginLeft: '0.5rem' }}>กำลังโหลด...</span>
    </div>
  );

  // Error component
  const ErrorMessage = ({ message, onRetry }) => (
    <div style={{
      backgroundColor: 'rgba(245, 101, 101, 0.1)',
      borderRadius: '0.5rem',
      padding: '1rem',
      margin: '1rem 0',
      border: '1px solid var(--danger)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <AlertCircle size={20} color="var(--danger)" />
        <span style={{ fontWeight: '600', color: 'var(--danger)' }}>เกิดข้อผิดพลาด</span>
      </div>
      <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            backgroundColor: 'var(--danger)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.375rem',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          ลองใหม่
        </button>
      )}
    </div>
  );

  // Main loading state
  if (loading) {
    return (
      <div style={{ 
        padding: windowWidth <= 768 ? '1rem' : '2rem',
        backgroundColor: 'var(--bg-secondary)',
        minHeight: '100vh'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: windowWidth <= 768 ? '1.5rem' : '1.75rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            marginBottom: '0.5rem' 
          }}>
            ตารางเทรน
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            จัดการเซสชั่นการออกกำลังกายของคุณ
          </p>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  // Render Booking Modal
  const renderBookingModal = () => {
    if (!showBookingModal) return null;

    return (
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
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              จองเซสชั่นใหม่
            </h3>
            <button
              onClick={() => {
                setShowBookingModal(false);
                setSelectedTrainer(null);
                setSelectedPackage(null);
                setSelectedTimeSlot(null);
                setBookingNotes('');
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                color: 'var(--text-muted)'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Step 1: Select Date */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              1. เลือกวันที่
            </h4>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Step 2: Select Trainer */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              2. เลือกเทรนเนอร์
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
              {availableTrainers.map(trainer => (
                <div 
                  key={trainer.id} 
                  onClick={() => setSelectedTrainer(trainer)}
                  style={{
                    border: selectedTrainer?.id === trainer.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: selectedTrainer?.id === trainer.id ? 'rgba(35, 41, 86, 0.05)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      backgroundColor: 'var(--primary)',
                      borderRadius: '50%',
                      width: '3rem',
                      height: '3rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-white)',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}>
                      {trainer.avatar || trainer.name?.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {trainer.name}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        {trainer.specialization} • {trainer.experience}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Star size={14} fill="var(--warning)" color="var(--warning)" />
                          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{trainer.rating}</span>
                        </div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          • เริ่มต้น ฿{trainer.basePrice}/เซสชั่น
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Select Package (if trainer selected) */}
          {selectedTrainer && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                3. เลือกแพคเกจ
              </h4>
              {actionLoading ? (
                <LoadingSpinner />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {packageOptions.map(pkg => (
                    <div 
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      style={{
                        border: selectedPackage?.id === pkg.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: selectedPackage?.id === pkg.id ? 'rgba(35, 41, 86, 0.05)' : 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                            {pkg.name}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            {pkg.description}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {pkg.duration} นาที • {pkg.sessions} เซสชั่น
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent)' }}>
                            ฿{pkg.price}
                          </div>
                          {pkg.originalPrice && (
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                              ฿{pkg.originalPrice}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Select Time (if package selected) */}
          {selectedPackage && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                4. เลือกเวลา
              </h4>
              {actionLoading ? (
                <LoadingSpinner />
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
                  gap: '0.5rem' 
                }}>
                  {availableTimeSlots.map(timeSlot => (
                    <button
                      key={timeSlot.time}
                      onClick={() => setSelectedTimeSlot(timeSlot.time)}
                      disabled={!timeSlot.available}
                      style={{
                        padding: '0.75rem',
                        border: selectedTimeSlot === timeSlot.time ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: timeSlot.available ? 'pointer' : 'not-allowed',
                        backgroundColor: selectedTimeSlot === timeSlot.time ? 'rgba(35, 41, 86, 0.05)' : 
                                       timeSlot.available ? 'transparent' : 'var(--bg-secondary)',
                        color: timeSlot.available ? 'var(--text-primary)' : 'var(--text-muted)',
                        opacity: timeSlot.available ? 1 : 0.6
                      }}
                    >
                      {timeSlot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Notes */}
          {selectedTimeSlot && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                5. หมายเหตุ (ไม่บังคับ)
              </h4>
              <textarea
                placeholder="เพิ่มรายละเอียดหรือความต้องการพิเศษ..."
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  minHeight: '80px'
                }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => {
                setShowBookingModal(false);
                setSelectedTrainer(null);
                setSelectedPackage(null);
                setSelectedTimeSlot(null);
                setBookingNotes('');
              }}
              disabled={actionLoading}
              style={{
                flex: '1',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                color: 'var(--text-primary)',
                opacity: actionLoading ? 0.6 : 1
              }}
            >
              ยกเลิก
            </button>
            <button 
              onClick={handleBookSession}
              disabled={actionLoading || !selectedTrainer || !selectedPackage || !selectedTimeSlot}
              style={{
                flex: '1',
                backgroundColor: 'var(--primary)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: (actionLoading || !selectedTrainer || !selectedPackage || !selectedTimeSlot) ? 'not-allowed' : 'pointer',
                opacity: (actionLoading || !selectedTrainer || !selectedPackage || !selectedTimeSlot) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem'
              }}
            >
              {actionLoading ? (
                <>
                  <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  กำลังจอง...
                </>
              ) : (
                'ยืนยันการจอง'
              )}
            </button>
          </div>

          {/* Booking Summary */}
          {selectedTrainer && selectedPackage && selectedTimeSlot && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                สรุปการจอง
              </h5>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                <div>เทรนเนอร์: {selectedTrainer.name}</div>
                <div>แพคเกจ: {selectedPackage.name}</div>
                <div>วันที่: {new Date(bookingDate).toLocaleDateString('th-TH')}</div>
                <div>เวลา: {selectedTimeSlot} น.</div>
                <div>ระยะเวลา: {selectedPackage.duration} นาที</div>
                <div style={{ marginTop: '0.5rem', fontSize: '1rem', fontWeight: '600', color: 'var(--accent)' }}>
                  ราคา: ฿{selectedPackage.price}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Continue with the rest of the component (renderSessionModal, renderRescheduleModal, etc.)
  // ... (keeping all other render functions as they were)

  return (
    <div style={{ 
      padding: windowWidth <= 768 ? '1rem' : '2rem',
      backgroundColor: 'var(--bg-secondary)',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: windowWidth <= 768 ? '1.5rem' : '1.75rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          marginBottom: '0.5rem' 
        }}>
          ตารางเทรน
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          จัดการเซสชั่นการออกกำลังกายของคุณ
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => {
            setError(null);
            window.location.reload();
          }} 
        />
      )}

      {/* View Mode Tabs */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '0.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '0.5rem'
      }}>
        {[
          { id: 'month', label: 'เดือน' },
          { id: 'week', label: 'สัปดาห์' },
          { id: 'day', label: 'วัน' }
        ].map(mode => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: viewMode === mode.id ? 'var(--primary)' : 'transparent',
              color: viewMode === mode.id ? 'var(--text-white)' : 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              flex: windowWidth <= 768 ? '1' : 'auto'
            }}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={() => setShowBookingModal(true)}
          disabled={actionLoading}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '1rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: actionLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            opacity: actionLoading ? 0.6 : 1
          }}
        >
          {actionLoading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
          จองเซสชั่น
        </button>
        
        <div style={{ position: 'relative' }}>
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
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem 0.75rem 1rem 2.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-primary)'
            }}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '1rem 0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            backgroundColor: 'var(--bg-primary)'
          }}
        >
          <option value="all">ทุกสถานะ</option>
          <option value="confirmed">ยืนยันแล้ว</option>
          <option value="pending">รอยืนยัน</option>
          <option value="completed">เสร็จสิ้น</option>
          <option value="cancelled">ยกเลิก</option>
        </select>

        <button
          onClick={refreshData}
          disabled={actionLoading}
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            padding: '1rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: actionLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            opacity: actionLoading ? 0.6 : 1
          }}
        >
          <RefreshCw size={16} style={{ animation: actionLoading ? 'spin 1s linear infinite' : 'none' }} />
          รีเฟรช
        </button>
      </div>

      {/* Session Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.5rem' }}>
            {scheduleData.length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>เซสชั่นทั้งหมด</div>
        </div>
        
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.5rem' }}>
            {scheduleData.filter(s => s.status === 'confirmed').length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ยืนยันแล้ว</div>
        </div>
        
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--warning)', marginBottom: '0.5rem' }}>
            {scheduleData.filter(s => s.status === 'pending').length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>รอยืนยัน</div>
        </div>
        
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--info)', marginBottom: '0.5rem' }}>
            {scheduleData.filter(s => s.status === 'completed').length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>เสร็จสิ้น</div>
        </div>
      </div>

      {/* Upcoming Sessions List */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ 
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            เซสชั่นที่กำลังจะมาถึง
          </h3>
        </div>

        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {upcomingSessions.length > 0 ? upcomingSessions.map(session => (
            <div key={session.id} style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                backgroundColor: getStatusColor(session.status),
                borderRadius: '50%',
                width: '4px',
                height: '4px',
                flexShrink: 0
              }}></div>

              <div style={{
                backgroundColor: 'var(--primary)',
                borderRadius: '50%',
                width: '2.5rem',
                height: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-white)',
                flexShrink: 0
              }}>
                {session.trainerAvatar || session.trainerName?.charAt(0)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {session.workoutType || 'การออกกำลังกาย'}
                  </span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: `${getStatusColor(session.status)}20`,
                    color: getStatusColor(session.status)
                  }}>
                    {getStatusIcon(session.status)}
                    {getStatusText(session.status)}
                  </div>
                </div>
                
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  กับ {session.trainerName}
                  {session.trainerRating && (
                    <span style={{ marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Star size={12} fill="var(--warning)" color="var(--warning)" />
                      {session.trainerRating}
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={12} />
                    {new Date(session.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} />
                    {session.time} ({session.duration || 60} นาที)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={12} />
                    {session.location || 'ยิม'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => handleViewSession(session)}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Eye size={14} />
                  {windowWidth > 768 && 'ดู'}
                </button>

                {session.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleSessionAction(session.id, 'confirm')}
                      disabled={actionLoading}
                      style={{
                        backgroundColor: 'var(--success)',
                        color: 'var(--text-white)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                        opacity: actionLoading ? 0.6 : 1
                      }}
                    >
                      ยืนยัน
                    </button>
                    <button
                      onClick={() => handleSessionAction(session.id, 'cancel')}
                      disabled={actionLoading}
                      style={{
                        backgroundColor: 'var(--danger)',
                        color: 'var(--text-white)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                        opacity: actionLoading ? 0.6 : 1
                      }}
                    >
                      ยกเลิก
                    </button>
                  </>
                )}
                
                {session.canReschedule && session.status !== 'completed' && session.status !== 'cancelled' && (
                  <button
                    onClick={() => handleReschedule(session)}
                    disabled={actionLoading}
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      padding: '0.5rem',
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      opacity: actionLoading ? 0.6 : 1
                    }}
                  >
                    <Edit size={14} />
                    {windowWidth > 768 && 'เลื่อน'}
                  </button>
                )}

                <button style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  color: 'var(--text-muted)'
                }}>
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          )) : (
            <div style={{ 
              padding: '3rem', 
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>ไม่มีเซสชั่นที่กำลังจะมาถึง</p>
              <button
                onClick={() => setShowBookingModal(true)}
                disabled={actionLoading}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--text-white)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  marginTop: '1rem',
                  opacity: actionLoading ? 0.6 : 1
                }}
              >
                จองเซสชั่นแรก
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {renderBookingModal()}
      
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

export default ClientSchedule;