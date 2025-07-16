import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Target, 
  Heart, 
  Calendar, 
  Clock, 
  TrendingUp, 
  CheckCircle,
  AlertCircle, 
  BarChart3, 
  Plus, 
  Bell, 
  MessageCircle, 
  Star, 
  Utensils, 
  User, 
  ChevronRight, 
  MapPin, 
  DollarSign, 
  TrendingDown, 
  Package, 
  Send, 
  Edit, 
  Check, 
  X, 
  Trophy, 
  Dumbbell, 
  Apple, 
  CalendarDays, 
  Search, 
  Map, 
  Navigation,
  Loader
} from 'lucide-react';

// API service functions
const apiService = {
  // Base API URL - แก้ไขตาม environment ของคุณ
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  
  async getUserProfile() {
    const response = await fetch(`${this.baseURL}/client/profile`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch user profile');
    return response.json();
  },

  async getClientStats() {
    const response = await fetch(`${this.baseURL}/client/stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch client stats');
    return response.json();
  },

  async getUpcomingSessions() {
    const response = await fetch(`${this.baseURL}/client/sessions/upcoming`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch upcoming sessions');
    return response.json();
  },

  async getWeeklyProgress() {
    const response = await fetch(`${this.baseURL}/client/progress/weekly`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch weekly progress');
    return response.json();
  },

  async getHealthData() {
    const response = await fetch(`${this.baseURL}/client/health-data`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch health data');
    return response.json();
  },

  async getNutritionData() {
    const response = await fetch(`${this.baseURL}/client/nutrition/today`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch nutrition data');
    return response.json();
  },

  async getCurrentPackage() {
    const response = await fetch(`${this.baseURL}/client/package/current`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch current package');
    return response.json();
  },

  async getAchievements() {
    const response = await fetch(`${this.baseURL}/client/achievements`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch achievements');
    return response.json();
  },

  async getNotifications() {
    const response = await fetch(`${this.baseURL}/client/notifications`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },

  async getRecentChats() {
    const response = await fetch(`${this.baseURL}/client/chats/recent`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch recent chats');
    return response.json();
  },

  async getPendingReviews() {
    const response = await fetch(`${this.baseURL}/client/reviews/pending`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch pending reviews');
    return response.json();
  },

  async getWorkoutPlan() {
    const response = await fetch(`${this.baseURL}/client/workout-plan/current`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch workout plan');
    return response.json();
  },

  async getNearbyGyms() {
    const response = await fetch(`${this.baseURL}/client/gyms/nearby`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch nearby gyms');
    return response.json();
  },

  async updateSessionStatus(sessionId, status) {
    const response = await fetch(`${this.baseURL}/client/sessions/${sessionId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update session status');
    return response.json();
  },

  async submitReview(trainerId, sessionId, rating, comment) {
    const response = await fetch(`${this.baseURL}/client/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ trainerId, sessionId, rating, comment })
    });
    if (!response.ok) throw new Error('Failed to submit review');
    return response.json();
  },

  async sendChatMessage(trainerId, message) {
    const response = await fetch(`${this.baseURL}/client/chats/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ trainerId, message })
    });
    if (!response.ok) throw new Error('Failed to send chat message');
    return response.json();
  }
};

const ClientDashboardOverview = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [activeTab, setActiveTab] = useState('overview');
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');

  // Data states
  const [userProfile, setUserProfile] = useState(null);
  const [statsData, setStatsData] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [healthData, setHealthData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [currentPackage, setCurrentPackage] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [nearbyGyms, setNearbyGyms] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data concurrently
        const [
          profileData,
          stats,
          sessions,
          progress,
          health,
          nutrition,
          packageData,
          achievementsData,
          notifications,
          chats,
          reviews,
          workout,
          gyms
        ] = await Promise.all([
          apiService.getUserProfile(),
          apiService.getClientStats(),
          apiService.getUpcomingSessions(),
          apiService.getWeeklyProgress(),
          apiService.getHealthData(),
          apiService.getNutritionData(),
          apiService.getCurrentPackage(),
          apiService.getAchievements(),
          apiService.getNotifications(),
          apiService.getRecentChats(),
          apiService.getPendingReviews(),
          apiService.getWorkoutPlan(),
          apiService.getNearbyGyms()
        ]);

        // Set all data
        setUserProfile(profileData);
        setStatsData(stats);
        setUpcomingSessions(sessions);
        setWeeklyProgress(progress);
        setHealthData(health);
        setNutritionData(nutrition);
        setCurrentPackage(packageData);
        setAchievements(achievementsData);
        setRecentNotifications(notifications);
        setRecentChats(chats);
        setPendingReviews(reviews);
        setWorkoutPlan(workout);
        setNearbyGyms(gyms);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleSessionAction = async (sessionId, action) => {
    try {
      if (action === 'confirm') {
        await apiService.updateSessionStatus(sessionId, 'confirmed');
        // Refresh upcoming sessions
        const sessions = await apiService.getUpcomingSessions();
        setUpcomingSessions(sessions);
      } else if (action === 'reschedule') {
        // Handle reschedule logic here
        console.log(`Reschedule session ${sessionId}`);
      }
    } catch (err) {
      console.error('Error handling session action:', err);
      setError('ไม่สามารถอัปเดตเซสชั่นได้');
    }
  };

  const handleChatSend = async () => {
    if (chatMessage.trim() && selectedTrainer) {
      try {
        await apiService.sendChatMessage(selectedTrainer, chatMessage);
        setChatMessage('');
        setSelectedTrainer('');
        setShowChatModal(false);
        
        // Refresh chat data
        const chats = await apiService.getRecentChats();
        setRecentChats(chats);
      } catch (err) {
        console.error('Error sending chat message:', err);
        setError('ไม่สามารถส่งข้อความได้');
      }
    }
  };

  const handleReviewSubmit = async () => {
    if (selectedReview && reviewRating > 0) {
      try {
        await apiService.submitReview(
          selectedReview.trainerId, 
          selectedReview.sessionId, 
          reviewRating, 
          reviewComment
        );
        
        setShowReviewModal(false);
        setSelectedReview(null);
        setReviewRating(0);
        setReviewComment('');
        
        // Refresh pending reviews
        const reviews = await apiService.getPendingReviews();
        setPendingReviews(reviews);
      } catch (err) {
        console.error('Error submitting review:', err);
        setError('ไม่สามารถส่งรีวิวได้');
      }
    }
  };

  const openReviewModal = (review) => {
    setSelectedReview(review);
    setShowReviewModal(true);
  };

  // Loading component
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size={40} color="var(--primary)" className="animate-spin" />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Error component
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div style={{ 
          textAlign: 'center', 
          backgroundColor: 'var(--bg-primary)',
          padding: '2rem',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)'
        }}>
          <AlertCircle size={40} color="var(--accent)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>เกิดข้อผิดพลาด</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer'
            }}
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: windowWidth <= 768 ? '1rem' : '2rem',
      backgroundColor: 'var(--bg-secondary)',
      minHeight: '100vh'
    }}>
      {/* Welcome Header - Only for Desktop */}
      {windowWidth > 768 && userProfile && (
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '1.75rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            marginBottom: '0.5rem' 
          }}>
            สวัสดี {userProfile.firstName} {userProfile.lastName}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            มาดูความก้าวหน้าของคุณกันเถอะ • เป้าหมายวันนี้: {workoutPlan?.todayWorkout?.name || 'ไม่มีแผนการเทรน'}
          </p>
        </div>
      )}

      {/* Mobile Welcome Card */}
      {windowWidth <= 768 && userProfile && (
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            marginBottom: '0.25rem' 
          }}>
            สวัสดี {userProfile.firstName}! 👋
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            เป้าหมายวันนี้: {workoutPlan?.todayWorkout?.name || 'ไม่มีแผนการเทรน'}
          </p>
        </div>
      )}

      {/* Quick Stats */}
      {statsData.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {statsData.map((stat, index) => (
            <div key={index} style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '0.75rem',
              padding: windowWidth <= 768 ? '1rem' : '1.5rem',
              border: '1px solid var(--border-color)',
              textAlign: 'center',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{
                backgroundColor: `${stat.color}15`,
                borderRadius: '50%',
                width: windowWidth <= 768 ? '2.5rem' : '3rem',
                height: windowWidth <= 768 ? '2.5rem' : '3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                color: stat.color
              }}>
                {stat.icon === 'Target' && <Target size={windowWidth <= 768 ? 18 : 20} />}
                {stat.icon === 'Activity' && <Activity size={windowWidth <= 768 ? 18 : 20} />}
                {stat.icon === 'Heart' && <Heart size={windowWidth <= 768 ? 18 : 20} />}
                {stat.icon === 'TrendingUp' && <TrendingUp size={windowWidth <= 768 ? 18 : 20} />}
              </div>
              <div style={{ 
                fontSize: windowWidth <= 768 ? '1.125rem' : '1.5rem', 
                fontWeight: '700', 
                color: 'var(--text-primary)', 
                marginBottom: '0.25rem' 
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '0.625rem', color: stat.color, fontWeight: '500' }}>
                {stat.change}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Package Status */}
      {currentPackage && (
        <div style={{
          background: 'linear-gradient(135deg, #232956 0%, #df2528 100%)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          color: 'var(--text-white)',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: windowWidth <= 768 ? 'flex-start' : 'center',
            flexDirection: windowWidth <= 768 ? 'column' : 'row',
            gap: '1rem'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Package size={20} />
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>แพคเกจปัจจุบัน</span>
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '1rem',
                  fontSize: '0.625rem',
                  fontWeight: '600'
                }}>
                  {currentPackage.status === 'active' ? 'ใช้งานอยู่' : 'หมดอายุ'}
                </div>
              </div>
              <h3 style={{ fontSize: windowWidth <= 768 ? '1.125rem' : '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--bs-white)' }}>
                {currentPackage.name}
              </h3>
              <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '1rem' }}>
                กับ {currentPackage.trainerName} • ซื้อเมื่อ {new Date(currentPackage.purchaseDate).toLocaleDateString('th-TH')}
              </p>
              
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>เซสชั่นที่ใช้</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600' }}>
                    {currentPackage.sessionsUsed}/{currentPackage.sessionsTotal}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>หมดอายุ</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600' }}>
                    {new Date(currentPackage.expiryDate).toLocaleDateString('th-TH')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>มูลค่า</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600' }}>
                    ฿{currentPackage.price?.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: '0.5rem', 
              padding: '1rem',
              textAlign: 'center',
              minWidth: windowWidth <= 768 ? '100%' : '150px'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                {Math.round((currentPackage.sessionsUsed / currentPackage.sessionsTotal) * 100)}%
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                ความคืบหน้า
              </div>
              <button style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                color: 'var(--text-white)',
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}>
                ต่ออายุแพคเกจ
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : '2fr 1fr',
        gap: '1.5rem'
      }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Upcoming Sessions */}
          {upcomingSessions.length > 0 && (
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              overflow: 'hidden'
            }}>
              <div style={{ 
                padding: '1.5rem 1.5rem 1rem', 
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={20} color="var(--primary)" />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      เซสชั่นที่กำลังจะมาถึง
                    </h3>
                  </div>
                  <button style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: 'var(--text-primary)'
                  }}>
                    <CalendarDays size={14} />
                    ดูปฏิทิน
                  </button>
                </div>
              </div>
              
              <div>
                {upcomingSessions.map((session, index) => (
                  <div key={session.id} style={{
                    padding: '1rem 1.5rem',
                    borderBottom: index < upcomingSessions.length - 1 ? '1px solid var(--border-color)' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        backgroundColor: session.status === 'confirmed' ? 'var(--success)' : 'var(--warning)',
                        borderRadius: '50%',
                        width: '0.5rem',
                        height: '0.5rem'
                      }}></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                            {new Date(session.scheduledAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(session.scheduledAt).toLocaleDateString('th-TH')}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            • {session.duration} นาที
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          {session.workoutType}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                          กับ {session.trainerName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={12} />
                          {session.location}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: session.status === 'confirmed' ? 'rgba(72, 187, 120, 0.1)' : 'rgba(237, 137, 54, 0.1)',
                          color: session.status === 'confirmed' ? 'var(--success)' : 'var(--warning)'
                        }}>
                          {session.status === 'confirmed' ? 'ยืนยันแล้ว' : 'รอยืนยัน'}
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {session.status === 'pending' && (
                            <button 
                              onClick={() => handleSessionAction(session.id, 'confirm')}
                              style={{
                                backgroundColor: 'var(--success)',
                                color: 'var(--text-white)',
                                border: 'none',
                                borderRadius: '0.25rem',
                                padding: '0.25rem',
                                cursor: 'pointer'
                              }}
                            >
                              <Check size={12} />
                            </button>
                          )}
                          {session.canReschedule && (
                            <button 
                              onClick={() => handleSessionAction(session.id, 'reschedule')}
                              style={{
                                backgroundColor: 'var(--info)',
                                color: 'var(--text-white)',
                                border: 'none',
                                borderRadius: '0.25rem',
                                padding: '0.25rem',
                                cursor: 'pointer'
                              }}
                            >
                              <Edit size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Progress */}
          {weeklyProgress.length > 0 && workoutPlan && (
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <BarChart3 size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  แผนการเทรนสัปดาห์นี้
                </h3>
                <div style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--text-white)',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '1rem',
                  fontSize: '0.625rem',
                  fontWeight: '600'
                }}>
                  สัปดาห์ {workoutPlan.currentWeek}/{workoutPlan.totalWeeks}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                {weeklyProgress.map((day, index) => (
                  <div key={index} style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '50%',
                      backgroundColor: 
                        day.completed ? 'var(--success)' : 
                        day.planned ? 'var(--border-color)' : '#f8f9fa',
                      border: day.planned && !day.completed ? '2px solid var(--primary)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.5rem',
                      color: day.completed ? 'var(--text-white)' : 'var(--text-secondary)',
                      cursor: day.planned ? 'pointer' : 'default'
                    }}>
                      {day.completed ? <CheckCircle size={16} /> : day.planned ? <Dumbbell size={14} /> : ''}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      {day.dayName}
                    </div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                      {day.workoutType}
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '0.5rem' 
              }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  เป้าหมายสัปดาห์นี้: {workoutPlan.weeklyGoal} วัน • วันนี้: {workoutPlan.todayWorkout?.name || 'วันพัก'}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  เสร็จสิ้นแล้ว {workoutPlan.completedDays}/{workoutPlan.weeklyGoal} วัน ({Math.round((workoutPlan.completedDays / workoutPlan.weeklyGoal) * 100)}%)
                </div>
                {workoutPlan.todayWorkout && (
                  <button style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--text-white)',
                    border: 'none',
                    borderRadius: '0.375rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <Dumbbell size={14} />
                    เริ่มออกกำลังกายวันนี้
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Health Metrics */}
          {healthData && (
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    ข้อมูลสุขภาพ
                  </h3>
                </div>
                <button style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  color: 'var(--text-primary)'
                }}>
                  บันทึกข้อมูล
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {healthData.weight?.current}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    น้ำหนัก (กก.)
                  </div>
                  <div style={{ 
                    fontSize: '0.625rem', 
                    color: healthData.weight?.change < 0 ? 'var(--success)' : 'var(--warning)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem'
                  }}>
                    {healthData.weight?.change < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                    {Math.abs(healthData.weight?.change || 0)} กก.
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {healthData.bodyFat?.current}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    ไขมัน
                  </div>
                  <div style={{ 
                    fontSize: '0.625rem', 
                    color: healthData.bodyFat?.change < 0 ? 'var(--success)' : 'var(--warning)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem'
                  }}>
                    <TrendingDown size={12} />
                    {Math.abs(healthData.bodyFat?.change || 0)}%
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {healthData.muscle?.current}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    กล้ามเนื้อ (กก.)
                  </div>
                  <div style={{ 
                    fontSize: '0.625rem', 
                    color: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem'
                  }}>
                    <TrendingUp size={12} />
                    +{healthData.muscle?.change || 0} กก.
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {healthData.bmi?.current}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    BMI
                  </div>
                  <div style={{ 
                    fontSize: '0.625rem', 
                    color: 'var(--success)',
                    textTransform: 'capitalize'
                  }}>
                    {healthData.bmi?.status}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Today's Nutrition Plan */}
          {nutritionData && (
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Utensils size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    แผนโภชนาการวันนี้
                  </h3>
                </div>
                <button style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  color: 'var(--text-primary)'
                }}>
                  แก้ไขแผน
                </button>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                {nutritionData.meals?.slice(0, 3).map((meal, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: meal.completed ? 'rgba(72, 187, 120, 0.05)' : 'var(--bg-secondary)',
                    borderRadius: '0.5rem',
                    marginBottom: '0.5rem',
                    border: meal.completed ? '1px solid rgba(72, 187, 120, 0.2)' : '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        backgroundColor: meal.completed ? 'var(--success)' : 'var(--border-color)',
                        borderRadius: '50%',
                        width: '1.5rem',
                        height: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: meal.completed ? 'var(--text-white)' : 'var(--text-secondary)'
                      }}>
                        {meal.completed ? <Check size={12} /> : <Apple size={12} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                          {meal.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {meal.time} • {meal.calories} แคลอรี่
                        </div>
                      </div>
                    </div>
                    {!meal.completed && (
                      <button style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--text-white)',
                        border: 'none',
                        borderRadius: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}>
                        บันทึก
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {nutritionData.consumed?.calories || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    แคลอรี่
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                    /{nutritionData.dailyGoal?.calories || 0}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {nutritionData.consumed?.protein || 0}g
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    โปรตีน
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                    /{nutritionData.dailyGoal?.protein || 0}g
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {nutritionData.consumed?.carbs || 0}g
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    คาร์บ
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                    /{nutritionData.dailyGoal?.carbs || 0}g
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {nutritionData.consumed?.water || 0}L
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    น้ำ
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                    /{nutritionData.dailyGoal?.water || 0}L
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Actions */}
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              marginBottom: '1rem' 
            }}>
              การดำเนินการด่วน
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>📊 ดูความก้าวหน้า</span>
                <ChevronRight size={16} />
              </button>
              
              <button style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>💳 ประวัติการชำระเงิน</span>
                <ChevronRight size={16} />
              </button>
              
              <button style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>🏆 ความสำเร็จ</span>
                <ChevronRight size={16} />
              </button>
              
              <button style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>⚙️ การตั้งค่า</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Notifications */}
          {recentNotifications.length > 0 && (
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    การแจ้งเตือน
                  </h3>
                </div>
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}>
                  ดูทั้งหมด
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentNotifications.slice(0, 4).map((notification, index) => (
                  <div key={notification.id} style={{
                    padding: '0.75rem',
                    backgroundColor: notification.isRead ? 'var(--bg-secondary)' : 'rgba(35, 41, 86, 0.05)',
                    borderRadius: '0.5rem',
                    border: notification.isRead ? '1px solid var(--border-color)' : '1px solid rgba(35, 41, 86, 0.1)',
                    cursor: 'pointer'
                  }}>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--text-primary)', 
                      marginBottom: '0.25rem',
                      fontWeight: notification.isRead ? '400' : '500'
                    }}>
                      {notification.message}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(notification.createdAt).toLocaleString('th-TH')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat with Trainers */}
          {recentChats.length > 0 && (
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageCircle size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    แชทกับเทรนเนอร์
                  </h3>
                </div>
                <button 
                  onClick={() => setShowChatModal(true)}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--text-white)',
                    border: 'none',
                    borderRadius: '0.375rem',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  แชทใหม่
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentChats.map((chat, index) => (
                  <div key={chat.id} style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {chat.trainerName}
                      </div>
                      {chat.unreadCount > 0 && (
                        <div style={{
                          backgroundColor: 'var(--accent)',
                          borderRadius: '50%',
                          width: '1rem',
                          height: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.625rem',
                          color: 'var(--text-white)',
                          fontWeight: '700'
                        }}>
                          {chat.unreadCount}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      {chat.lastMessage}
                    </div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                      {new Date(chat.lastMessageAt).toLocaleString('th-TH')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Reviews */}
          {pendingReviews.length > 0 && (
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Star size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  รีวิวที่รอดำเนินการ
                </h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingReviews.map((review, index) => (
                  <div key={review.id} style={{
                    padding: '0.75rem',
                    backgroundColor: 'rgba(223, 37, 40, 0.05)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(223, 37, 40, 0.1)'
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {review.trainerName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {review.workoutType} • {new Date(review.sessionDate).toLocaleDateString('th-TH')}
                    </div>
                    <button 
                      onClick={() => openReviewModal(review)}
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: 'var(--text-white)',
                        border: 'none',
                        borderRadius: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Star size={12} />
                      ให้คะแนน
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Achievements */}
          {achievements.length > 0 && (
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trophy size={20} color="var(--accent)" />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    ความสำเร็จ
                  </h3>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  คะแนนรวม: {achievements.reduce((total, achievement) => total + (achievement.points || 0), 0)}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {achievements.slice(0, 3).map((achievement, index) => (
                  <div key={achievement.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: achievement.completed ? 'rgba(72, 187, 120, 0.05)' : 'var(--bg-secondary)',
                    borderRadius: '0.5rem',
                    border: achievement.completed ? '1px solid rgba(72, 187, 120, 0.2)' : '1px solid var(--border-color)'
                  }}>
                    <div style={{
                      backgroundColor: achievement.completed ? 'var(--success)' : 'var(--border-color)',
                      borderRadius: '50%',
                      width: '2rem',
                      height: '2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: achievement.completed ? 'var(--text-white)' : 'var(--text-secondary)'
                    }}>
                      {achievement.completed ? <Trophy size={16} /> : <Target size={16} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: 'var(--text-primary)', 
                        marginBottom: '0.25rem' 
                      }}>
                        {achievement.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        {achievement.description}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {achievement.completed ? 
                          `เสร็จสิ้น ${new Date(achievement.completedAt).toLocaleDateString('th-TH')}` : 
                          `${achievement.progress}/${achievement.target}`}
                        {achievement.completed && achievement.points && (
                          <span style={{ color: 'var(--accent)', marginLeft: '0.5rem' }}>
                            +{achievement.points} คะแนน
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {showChatModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '90%',
            maxHeight: '500px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                แชทกับเทรนเนอร์
              </h3>
              <button 
                onClick={() => setShowChatModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <select 
                value={selectedTrainer}
                onChange={(e) => setSelectedTrainer(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem'
                }}
              >
                <option value="">เลือกเทรนเนอร์</option>
                {recentChats.map(chat => (
                  <option key={chat.trainerId} value={chat.trainerId}>
                    {chat.trainerName}
                  </option>
                ))}
              </select>
              
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="พิมพ์ข้อความ..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  resize: 'vertical',
                  minHeight: '100px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setShowChatModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleChatSend}
                disabled={!selectedTrainer || !chatMessage.trim()}
                style={{
                  flex: 1,
                  backgroundColor: selectedTrainer && chatMessage.trim() ? 'var(--primary)' : 'var(--border-color)',
                  color: 'var(--text-white)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  cursor: selectedTrainer && chatMessage.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem'
                }}
              >
                <Send size={16} />
                ส่ง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedReview && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '90%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                รีวิวเทรนเนอร์
              </h3>
              <button 
                onClick={() => setShowReviewModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {selectedReview.trainerName} - {selectedReview.workoutType}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {new Date(selectedReview.sessionDate).toLocaleDateString('th-TH')}
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    size={24} 
                    color={star <= reviewRating ? "#fbbf24" : "#e5e7eb"} 
                    fill={star <= reviewRating ? "#fbbf24" : "none"}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setReviewRating(star)}
                  />
                ))}
              </div>
              
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="เขียนรีวิว (ไม่บังคับ)"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  resize: 'vertical',
                  minHeight: '80px',
                  marginBottom: '1rem'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setShowReviewModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleReviewSubmit}
                disabled={reviewRating === 0}
                style={{
                  flex: 1,
                  backgroundColor: reviewRating > 0 ? 'var(--accent)' : 'var(--border-color)',
                  color: 'var(--text-white)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  cursor: reviewRating > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                ส่งรีวิว
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboardOverview;