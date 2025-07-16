import React, { useState, useEffect } from 'react';
import { 
  Award, Trophy, Star, Target, 
  Flame, Calendar, Activity, Heart,
  Lock, CheckCircle, ProgressCircle,
  Share2, Download, Filter, Search,
  TrendingUp, Users, Clock, Zap, Loader
} from 'lucide-react';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// API Service Functions
const apiService = {
  // ดึงข้อมูล achievements ของ user
  getUserAchievements: async (userId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/client/achievements/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching achievements:', error);
      throw error;
    }
  },

  // ดึงข้อมูลสถิติผู้ใช้
  getUserStats: async (userId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/client/achievement-stats/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  },

  // แชร์ achievement
  shareAchievement: async (userId, achievementId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/client/achievements/${userId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ achievementId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to share achievement');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sharing achievement:', error);
      throw error;
    }
  },

  // อัพเดท achievement progress (สำหรับ real-time update)
  updateAchievementProgress: async (userId, achievementId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/client/achievements/${userId}/update-progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ achievementId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update achievement progress');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating achievement progress:', error);
      throw error;
    }
  }
};

const ClientAchievements = ({ userData, loading: parentLoading, refreshData }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  
  // Database-related states
  const [achievements, setAchievements] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sharing, setSharing] = useState(false);
  
  const windowWidth = window.innerWidth;
  const userId = localStorage.getItem('userId');

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

  // Load achievements data from database
  useEffect(() => {
    const loadAchievements = async () => {
      if (!userId) {
        setError('User not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // ดึงข้อมูลแบบ parallel
        const [achievementsData, statsData] = await Promise.allSettled([
          apiService.getUserAchievements(userId),
          apiService.getUserStats(userId)
        ]);

        // จัดการ achievements data
        if (achievementsData.status === 'fulfilled') {
          setAchievements(achievementsData.value.achievements || []);
        } else {
          console.error('Failed to load achievements:', achievementsData.reason);
          setAchievements([]);
        }

        // จัดการ user stats
        if (statsData.status === 'fulfilled') {
          setUserStats(statsData.value);
        } else {
          console.error('Failed to load user stats:', statsData.reason);
          // ใช้ค่า default ถ้าไม่สามารถดึงข้อมูลได้
          setUserStats({
            totalPoints: 0,
            completedAchievements: 0,
            totalAchievements: 0,
            currentLevel: 'Beginner',
            nextLevel: 'Bronze Warrior',
            pointsToNext: 0,
            pointsForNext: 100
          });
        }

      } catch (err) {
        console.error('Error loading achievements:', err);
        setError('Failed to load achievements data');
        setAchievements([]);
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, [userId]);

  // Auto-refresh achievements every 60 seconds
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(async () => {
      try {
        const [achievementsData, statsData] = await Promise.allSettled([
          apiService.getUserAchievements(userId),
          apiService.getUserStats(userId)
        ]);

        if (achievementsData.status === 'fulfilled') {
          setAchievements(achievementsData.value.achievements || []);
        }

        if (statsData.status === 'fulfilled') {
          setUserStats(statsData.value);
        }
      } catch (err) {
        console.error('Error refreshing achievements:', err);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [userId]);

  // Handle achievement sharing
  const handleShareAchievement = async (achievement) => {
    if (!achievement.completed) return;

    try {
      setSharing(true);
      await apiService.shareAchievement(userId, achievement.id);
      
      // Show success message or handle sharing UI
      if (navigator.share) {
        await navigator.share({
          title: `ฉันได้รับความสำเร็จ: ${achievement.title}`,
          text: achievement.description,
          url: window.location.href
        });
      } else {
        // Fallback sharing method
        const text = `ฉันได้รับความสำเร็จ: ${achievement.title} - ${achievement.description}`;
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
          alert('คัดลอกลิงค์แล้ว!');
        }
      }
    } catch (error) {
      console.error('Error sharing achievement:', error);
      alert('ไม่สามารถแชร์ได้ในขณะนี้');
    } finally {
      setSharing(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'completed', label: 'ที่เสร็จแล้ว' },
    { id: 'in-progress', label: 'กำลังทำ' },
    { id: 'locked', label: 'ล็อค' }
  ];

  const categories = [
    { id: 'all', label: 'ทุกหมวดหมู่', icon: Award },
    { id: 'workouts', label: 'การออกกำลังกาย', icon: Activity },
    { id: 'goals', label: 'เป้าหมาย', icon: Target },
    { id: 'streaks', label: 'ความต่อเนื่อง', icon: Flame },
    { id: 'social', label: 'สังคม', icon: Users },
    { id: 'special', label: 'พิเศษ', icon: Star }
  ];

  // Default user stats สำหรับกรณีที่ยังโหลดไม่เสร็จ
  const defaultUserStats = {
    totalPoints: 0,
    completedAchievements: 0,
    totalAchievements: 0,
    currentLevel: 'กำลังโหลด...',
    nextLevel: '...',
    pointsToNext: 0,
    pointsForNext: 100
  };

  const displayUserStats = userStats || defaultUserStats;

  const getLevelColor = (level) => {
    switch (level) {
      case 'bronze': return '#CD7F32';
      case 'silver': return '#C0C0C0';
      case 'gold': return '#FFD700';
      case 'special': return '#9B59B6';
      default: return 'var(--text-muted)';
    }
  };

  const getLevelBg = (level) => {
    switch (level) {
      case 'bronze': return 'rgba(205, 127, 50, 0.1)';
      case 'silver': return 'rgba(192, 192, 192, 0.1)';
      case 'gold': return 'rgba(255, 215, 0, 0.1)';
      case 'special': return 'rgba(155, 89, 182, 0.1)';
      default: return 'var(--bg-secondary)';
    }
  };

  const filterAchievements = () => {
    let filtered = achievements;

    // Filter by tab
    if (activeTab === 'completed') {
      filtered = filtered.filter(a => a.completed);
    } else if (activeTab === 'in-progress') {
      filtered = filtered.filter(a => !a.completed && !a.locked);
    } else if (activeTab === 'locked') {
      filtered = filtered.filter(a => a.locked);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(a => a.category === filterCategory);
    }

    return filtered;
  };

  // Loading component
  const renderLoading = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '50vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <Loader size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
      <div style={{ color: 'var(--text-secondary)' }}>กำลังโหลดความสำเร็จ...</div>
    </div>
  );

  // Error component
  const renderError = () => (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '0.75rem',
      border: '1px solid var(--danger)',
      padding: '2rem',
      textAlign: 'center',
      marginBottom: '2rem'
    }}>
      <div style={{ color: 'var(--danger)', fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
        เกิดข้อผิดพลาด
      </div>
      <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error}</div>
      <button
        onClick={() => {
          setError(null);
          if (refreshData) refreshData();
        }}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: 'var(--primary)',
          color: 'var(--text-white)',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}
      >
        ลองใหม่
      </button>
    </div>
  );

  const renderUserStats = () => (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '0.75rem',
      border: '1px solid var(--border-color)',
      padding: '1.5rem',
      marginBottom: '2rem'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : '2fr 1fr',
        gap: '2rem',
        alignItems: 'center'
      }}>
        {/* Level and Progress */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              background: loading ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #CD7F32 0%, #FFD700 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              {loading ? <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} /> : '🏆'}
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {loading ? 'กำลังโหลด...' : displayUserStats.currentLevel}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {loading ? '...' : `${displayUserStats.totalPoints} คะแนน`}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {loading ? 'กำลังโหลด...' : `ความก้าวหน้าไปยัง ${displayUserStats.nextLevel}`}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                {loading ? '...' : `${displayUserStats.pointsToNext}/${displayUserStats.pointsForNext}`}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--border-color)',
              borderRadius: '1rem',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: loading ? '0%' : `${(displayUserStats.pointsToNext / displayUserStats.pointsForNext) * 100}%`,
                background: 'linear-gradient(90deg, #CD7F32 0%, #FFD700 100%)',
                borderRadius: '1rem',
                transition: 'width 0.6s ease'
              }}></div>
            </div>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {loading ? 'กำลังโหลด...' : `เหลืออีก ${displayUserStats.pointsForNext - displayUserStats.pointsToNext} คะแนนเพื่อเลื่อนระดับ`}
          </p>
        </div>

        {/* Achievement Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.25rem' }}>
              {loading ? '...' : displayUserStats.completedAchievements}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เสร็จสิ้น</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)', marginBottom: '0.25rem' }}>
              {loading ? '...' : achievements.filter(a => !a.completed && !a.locked).length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>กำลังทำ</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              {loading ? '...' : achievements.filter(a => a.locked).length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ล็อค</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAchievementCard = (achievement) => (
    <div
      key={achievement.id}
      onClick={() => setSelectedAchievement(achievement)}
      style={{
        backgroundColor: achievement.completed ? getLevelBg(achievement.level) : 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: `2px solid ${achievement.completed ? getLevelColor(achievement.level) : 'var(--border-color)'}`,
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        opacity: achievement.locked ? 0.6 : 1,
        position: 'relative'
      }}
    >
      {achievement.locked && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          backgroundColor: 'var(--text-muted)',
          borderRadius: '50%',
          width: '1.5rem',
          height: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-white)'
        }}>
          <Lock size={12} />
        </div>
      )}

      {achievement.completed && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          backgroundColor: 'var(--success)',
          borderRadius: '50%',
          width: '1.5rem',
          height: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-white)'
        }}>
          <CheckCircle size={12} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{
          fontSize: '2rem',
          width: '3rem',
          height: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: achievement.completed ? 'transparent' : 'var(--bg-secondary)',
          borderRadius: '50%',
          filter: achievement.locked ? 'grayscale(1)' : 'none'
        }}>
          {achievement.icon}
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            color: 'var(--text-primary)', 
            marginBottom: '0.25rem',
            textDecoration: achievement.locked ? 'none' : 'none'
          }}>
            {achievement.title}
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {achievement.description}
          </p>
        </div>
      </div>

      {!achievement.locked && (
        <>
          {achievement.completed ? (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <div style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                backgroundColor: getLevelColor(achievement.level),
                color: 'var(--text-white)'
              }}>
                {achievement.level === 'bronze' ? 'บรอนซ์' :
                 achievement.level === 'silver' ? 'เงิน' :
                 achievement.level === 'gold' ? 'ทอง' : 'พิเศษ'}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--success)', fontWeight: '600' }}>
                +{achievement.points} คะแนน
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ความก้าวหน้า</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                  {achievement.current?.toLocaleString() || 0}/{achievement.target?.toLocaleString() || 0}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'var(--border-color)',
                borderRadius: '1rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${achievement.progress || 0}%`,
                  backgroundColor: 'var(--primary)',
                  borderRadius: '1rem',
                  transition: 'width 0.6s ease'
                }}></div>
              </div>
            </div>
          )}
        </>
      )}

      {achievement.locked && achievement.unlockRequirement && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'rgba(107, 114, 128, 0.1)',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            ปลดล็อคเมื่อ:
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            {achievement.unlockRequirement}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {achievement.completed ? `เสร็จสิ้น ${achievement.completedDate}` : 
           achievement.locked ? 'ล็อค' : `${achievement.progress || 0}% เสร็จสิ้น`}
        </div>
        {achievement.completed && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleShareAchievement(achievement);
            }}
            disabled={sharing}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: sharing ? 'not-allowed' : 'pointer',
              padding: '0.25rem',
              borderRadius: '0.25rem',
              color: 'var(--text-muted)',
              opacity: sharing ? 0.6 : 1
            }}
          >
            {sharing ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Share2 size={14} />}
          </button>
        )}
      </div>
    </div>
  );

  // Show loading state
  if (loading && achievements.length === 0) {
    return (
      <div style={{ padding: windowWidth <= 768 ? '1rem' : '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: windowWidth <= 768 ? '1.5rem' : '1.75rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            marginBottom: '0.5rem' 
          }}>
            ความสำเร็จ
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            ติดตามความก้าวหน้าและปลดล็อกความสำเร็จในการออกกำลังกาย
          </p>
        </div>
        {renderLoading()}
      </div>
    );
  }

  return (
    <div style={{ padding: windowWidth <= 768 ? '1rem' : '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: windowWidth <= 768 ? '1.5rem' : '1.75rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          marginBottom: '0.5rem' 
        }}>
          ความสำเร็จ
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          ติดตามความก้าวหน้าและปลดล็อกความสำเร็จในการออกกำลังกาย
        </p>
      </div>

      {/* Error State */}
      {error && renderError()}

      {/* User Stats */}
      {renderUserStats()}

      {/* Filters */}
      <div style={{ marginBottom: '1.5rem' }}>
        {/* Tabs */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '0.5rem',
          marginBottom: '1rem',
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
                textAlign: 'center'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-color)',
          padding: '0.25rem',
          display: 'inline-flex',
          gap: '0.25rem',
          overflowX: 'auto'
        }}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setFilterCategory(category.id)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.25rem',
                border: 'none',
                backgroundColor: filterCategory === category.id ? 'var(--primary)' : 'transparent',
                color: filterCategory === category.id ? 'var(--text-white)' : 'var(--text-primary)',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                whiteSpace: 'nowrap'
              }}
            >
              <category.icon size={14} />
              {windowWidth > 768 && category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '1.5rem'
      }}>
        {filterAchievements().map(renderAchievementCard)}
      </div>

      {filterAchievements().length === 0 && !loading && (
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <Award size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {achievements.length === 0 ? 'ยังไม่มีความสำเร็จ' : 'ไม่พบความสำเร็จ'}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {achievements.length === 0 ? 
              'เริ่มออกกำลังกายเพื่อปลดล็อกความสำเร็จใหม่' : 
              'ลองเปลี่ยนตัวกรองหรือเริ่มออกกำลังกายเพื่อปลดล็อกความสำเร็จใหม่'
            }
          </p>
        </div>
      )}

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
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
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: '1rem',
                filter: selectedAchievement.locked ? 'grayscale(1)' : 'none'
              }}>
                {selectedAchievement.icon}
              </div>
              
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: 'var(--text-primary)', 
                marginBottom: '0.5rem' 
              }}>
                {selectedAchievement.title}
              </h3>
              
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {selectedAchievement.description}
              </p>

              {selectedAchievement.completed && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: getLevelBg(selectedAchievement.level),
                  borderRadius: '1rem',
                  border: `1px solid ${getLevelColor(selectedAchievement.level)}`
                }}>
                  <Trophy size={16} color={getLevelColor(selectedAchievement.level)} />
                  <span style={{ 
                    fontWeight: '600', 
                    color: getLevelColor(selectedAchievement.level),
                    fontSize: '0.875rem'
                  }}>
                    {selectedAchievement.level === 'bronze' ? 'บรอนซ์' :
                     selectedAchievement.level === 'silver' ? 'เงิน' :
                     selectedAchievement.level === 'gold' ? 'ทอง' : 'พิเศษ'}
                  </span>
                </div>
              )}
            </div>

            {/* Progress */}
            {!selectedAchievement.locked && !selectedAchievement.completed && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ความก้าวหน้า</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    {selectedAchievement.current?.toLocaleString() || 0}/{selectedAchievement.target?.toLocaleString() || 0}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '12px',
                  backgroundColor: 'var(--border-color)',
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${selectedAchievement.progress || 0}%`,
                    backgroundColor: 'var(--primary)',
                    borderRadius: '1rem',
                    transition: 'width 0.6s ease'
                  }}></div>
                </div>
                <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {selectedAchievement.progress || 0}% เสร็จสิ้น
                </div>
              </div>
            )}

            {/* Requirements */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                {selectedAchievement.locked ? 'เงื่อนไขการปลดล็อค' : 'เงื่อนไข'}
              </h4>
              
              {selectedAchievement.locked && selectedAchievement.unlockRequirement ? (
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'rgba(107, 114, 128, 0.1)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {selectedAchievement.unlockRequirement}
                  </div>
                </div>
              ) : (
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0, 
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {selectedAchievement.requirements?.map((req, index) => (
                    <li key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-color)'
                    }}>
                      <CheckCircle 
                        size={16} 
                        color={selectedAchievement.completed ? 'var(--success)' : 'var(--text-muted)'} 
                      />
                      <span style={{ 
                        fontSize: '0.875rem', 
                        color: 'var(--text-primary)',
                        textDecoration: selectedAchievement.completed ? 'line-through' : 'none'
                      }}>
                        {req}
                      </span>
                    </li>
                  )) || []}
                </ul>
              )}
            </div>

            {/* Reward */}
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(72, 187, 120, 0.1)',
              borderRadius: '0.5rem',
              border: '1px solid var(--success)',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Award size={16} color="var(--success)" />
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--success)' }}>
                  รางวัล
                </span>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                {selectedAchievement.reward || 'ไม่ระบุรางวัล'}
              </div>
              {!selectedAchievement.locked && (
                <div style={{ fontSize: '0.875rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                  +{selectedAchievement.points || 0} คะแนน
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setSelectedAchievement(null)}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                ปิด
              </button>
              
              {selectedAchievement.completed && (
                <button 
                  onClick={() => handleShareAchievement(selectedAchievement)}
                  disabled={sharing}
                  style={{
                    flex: 1,
                    backgroundColor: sharing ? 'var(--text-muted)' : 'var(--primary)',
                    color: 'var(--text-white)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: sharing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {sharing ? (
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Share2 size={16} />
                  )}
                  แชร์
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientAchievements;
