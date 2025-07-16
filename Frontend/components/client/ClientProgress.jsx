import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Target, Activity, Heart,
  Calendar, Clock, Award, BarChart3,
  LineChart, PieChart, Download, Share2,
  ChevronDown, Filter, Camera, Plus,
  Zap, Flame, Droplets, Scale, ChevronRight,
  Edit3, Save, X, Upload, FileText, Mail,
  Phone, MapPin, Settings, Bell, Star,
  Trophy, Medal, Gift, CheckCircle,
  AlertCircle, Info, Eye, Play, Pause,
  RotateCcw, ChevronLeft, Search, Grid,
  List, Timer,
  User, Share, MoreVertical, Bookmark,
  Loader
} from 'lucide-react';

const ClientProgress = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('month');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [workoutFilter, setWorkoutFilter] = useState('all');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data from API
  const [overviewStats, setOverviewStats] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [workoutTypes, setWorkoutTypes] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [bodyMetrics, setBodyMetrics] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [progressPhotos, setProgressPhotos] = useState([]);
  const [goals, setGoals] = useState([]);

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

  // Fetch all progress data
  useEffect(() => {
    fetchProgressData();
  }, [timeRange]);

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

      const response = await fetch(`/api/progress${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Fetch all progress data
  const fetchProgressData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [
        overviewResponse,
        weeklyResponse,
        monthlyResponse,
        workoutTypesResponse,
        workoutHistoryResponse,
        bodyMetricsResponse,
        achievementsResponse,
        photosResponse,
        goalsResponse
      ] = await Promise.all([
        apiCall(`/overview?timeRange=${timeRange}`),
        apiCall('/weekly'),
        apiCall('/monthly'),
        apiCall('/workout-types'),
        apiCall(`/workouts?filter=${workoutFilter}`),
        apiCall('/body-metrics'),
        apiCall('/achievements'),
        apiCall('/photos'),
        apiCall('/goals')
      ]);

      // Set Overview Stats
      setOverviewStats([
        { 
          icon: Activity, 
          label: 'เซสชั่นเสร็จสิ้น', 
          value: overviewResponse.sessionsCompleted?.toString() || '0', 
          change: overviewResponse.sessionsChange || '+0%', 
          changeType: overviewResponse.sessionsChange?.startsWith('+') ? 'increase' : 'decrease',
          color: 'var(--success)',
          description: 'จากเดือนที่แล้ว',
          trend: overviewResponse.sessionsTrend || [0, 0, 0, 0]
        },
        { 
          icon: Flame, 
          label: 'แคลอรี่เผาผลาญ', 
          value: overviewResponse.caloriesBurned?.toLocaleString() || '0', 
          change: overviewResponse.caloriesChange || '+0%', 
          changeType: overviewResponse.caloriesChange?.startsWith('+') ? 'increase' : 'decrease',
          color: 'var(--accent)',
          description: 'จากเดือนที่แล้ว',
          trend: overviewResponse.caloriesTrend || [0, 0, 0, 0]
        },
        { 
          icon: Clock, 
          label: 'เวลาออกกำลังกาย', 
          value: overviewResponse.workoutHours?.toString() || '0', 
          change: overviewResponse.hoursChange || '+0', 
          changeType: overviewResponse.hoursChange?.startsWith('+') ? 'increase' : 'decrease',
          color: 'var(--info)',
          description: 'ชั่วโมง/เดือน',
          trend: overviewResponse.hoursTrend || [0, 0, 0, 0]
        },
        { 
          icon: Heart, 
          label: 'HR เฉลี่ย', 
          value: overviewResponse.averageHR?.toString() || '0', 
          change: overviewResponse.hrChange || '0', 
          changeType: overviewResponse.hrChange?.startsWith('-') ? 'decrease' : 'increase',
          color: 'var(--warning)',
          description: 'bpm (ดีขึ้น)',
          trend: overviewResponse.hrTrend || [0, 0, 0, 0]
        }
      ]);

      setWeeklyProgress(weeklyResponse || []);
      setMonthlyData(monthlyResponse || []);
      setWorkoutTypes(workoutTypesResponse || []);
      setWorkoutHistory(workoutHistoryResponse || []);
      setBodyMetrics(bodyMetricsResponse || []);
      setAchievements(achievementsResponse || []);
      setProgressPhotos(photosResponse || []);
      setGoals(goalsResponse || []);

    } catch (err) {
      console.error('Error fetching progress data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await fetchProgressData();
    setRefreshing(false);
  };

  // Upload progress photo
  const uploadProgressPhoto = async (photoData) => {
    try {
      const formData = new FormData();
      formData.append('photo', photoData.file);
      formData.append('type', photoData.type);
      formData.append('notes', photoData.notes);
      formData.append('weight', photoData.weight);
      formData.append('bodyFat', photoData.bodyFat);
      formData.append('muscle', photoData.muscle);

      const response = await fetch('/api/progress/photos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const newPhoto = await response.json();
      setProgressPhotos(prev => [...prev, newPhoto]);
      setShowPhotoModal(false);
      
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('เกิดข้อผิดพลาดในการอัพโหลดรูป');
    }
  };

  // Create new goal
  const createGoal = async (goalData) => {
    try {
      const newGoal = await apiCall('/goals', 'POST', goalData);
      setGoals(prev => [...prev, newGoal]);
      setShowGoalModal(false);
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('เกิดข้อผิดพลาดในการสร้างเป้าหมาย');
    }
  };

  // Update goal
  const updateGoal = async (goalId, goalData) => {
    try {
      const updatedGoal = await apiCall(`/goals/${goalId}`, 'PUT', goalData);
      setGoals(prev => prev.map(goal => 
        goal.id === goalId ? updatedGoal : goal
      ));
    } catch (error) {
      console.error('Error updating goal:', error);
      alert('เกิดข้อผิดพลาดในการอัพเดตเป้าหมาย');
    }
  };

  // Share progress
  const shareProgress = async (platform) => {
    try {
      await apiCall('/share', 'POST', { 
        platform, 
        timeRange,
        activeTab 
      });
      setShowShareModal(false);
      alert('แชร์ความก้าวหน้าสำเร็จ!');
    } catch (error) {
      console.error('Error sharing progress:', error);
      alert('เกิดข้อผิดพลาดในการแชร์');
    }
  };

  const tabs = [
    { id: 'overview', label: 'ภาพรวม', icon: BarChart3 },
    { id: 'workouts', label: 'การออกกำลังกาย', icon: Activity },
    { id: 'body', label: 'ร่างกาย', icon: Target },
    { id: 'achievements', label: 'ความสำเร็จ', icon: Award }
  ];

  const timeRanges = [
    { id: 'week', label: 'สัปดาห์นี้' },
    { id: 'month', label: 'เดือนนี้' },
    { id: 'quarter', label: '3 เดือน' },
    { id: 'year', label: 'ปีนี้' }
  ];

  const workoutFilters = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'strength', label: 'ยกน้ำหนัก' },
    { id: 'cardio', label: 'คาร์ดิโอ' },
    { id: 'flexibility', label: 'ความยืดหยุ่น' },
    { id: 'sports', label: 'กีฬา' }
  ];

  const renderMiniChart = (data, color) => (
    <div style={{ display: 'flex', alignItems: 'end', gap: '2px', height: '30px' }}>
      {data.map((value, index) => (
        <div
          key={index}
          style={{
            width: '6px',
            height: `${(value / Math.max(...data)) * 30}px`,
            backgroundColor: color,
            borderRadius: '1px',
            opacity: 0.7
          }}
        />
      ))}
    </div>
  );

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
        <p style={{ color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูลความก้าวหน้า...</p>
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
          onClick={() => fetchProgressData()}
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
          <RotateCcw size={16} />
          ลองใหม่
        </button>
      </div>
    );
  }

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Key Stats with Mini Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '1rem'
      }}>
        {overviewStats.map((stat, index) => (
          <div key={index} style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{
                backgroundColor: `${stat.color}15`,
                borderRadius: '50%',
                width: '2.5rem',
                height: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stat.color
              }}>
                <stat.icon size={16} />
              </div>
              {renderMiniChart(stat.trend, stat.color)}
            </div>
            
            <div style={{ 
              fontSize: windowWidth <= 768 ? '1.25rem' : '1.5rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              marginBottom: '0.25rem' 
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              {stat.label}
            </div>
            <div style={{ 
              fontSize: '0.625rem', 
              color: stat.changeType === 'increase' ? 'var(--success)' : 'var(--warning)', 
              fontWeight: '500' 
            }}>
              {stat.change} {stat.description}
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Progress & Goals */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : '2fr 1fr',
        gap: '2rem'
      }}>
        {/* Weekly Progress Chart */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                ความก้าวหน้าสัปดาห์นี้
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                เสร็จสิ้น {weeklyProgress.filter(day => day.completed).length}/{weeklyProgress.filter(day => day.target > 0).length} วัน ({Math.round(weeklyProgress.filter(day => day.completed).length / Math.max(weeklyProgress.filter(day => day.target > 0).length, 1) * 100)}%)
              </p>
            </div>
            <button
              onClick={() => setShowGoalModal(true)}
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Target size={14} />
              เป้าหมาย
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem' }}>
            {weeklyProgress.map((day, index) => (
              <div key={index} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{
                  height: '100px',
                  display: 'flex',
                  alignItems: 'end',
                  justifyContent: 'center',
                  marginBottom: '0.5rem',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '100%',
                    maxWidth: '30px',
                    height: day.target === 0 ? '20px' : `${Math.max(20, (day.actual / Math.max(day.target, 1)) * 80)}px`,
                    backgroundColor: 
                      day.target === 0 ? 'var(--border-color)' :
                      day.completed ? 'var(--success)' : 
                      day.actual > 0 ? 'var(--warning)' : 'var(--border-color)',
                    borderRadius: '0.25rem',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    {day.target > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: `-${(1 - day.actual / day.target) * 80 + 20}px`,
                        left: '0',
                        right: '0',
                        height: '2px',
                        backgroundColor: 'var(--primary)',
                        borderRadius: '1px'
                      }}></div>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {day.day}
                </div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                  {day.target === 0 ? 'พัก' : `${day.actual}/${day.target}น`}
                </div>
                {day.workouts && day.workouts.length > 0 && (
                  <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {day.workouts.slice(0, 1).join(', ')}{day.workouts.length > 1 && '...'}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            fontSize: '0.75rem', 
            color: 'var(--text-secondary)',
            justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: 'var(--success)', 
                borderRadius: '2px' 
              }}></div>
              เสร็จสิ้น
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: 'var(--warning)', 
                borderRadius: '2px' 
              }}></div>
              กำลังทำ
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                backgroundColor: 'var(--primary)', 
                borderRadius: '2px' 
              }}></div>
              เป้าหมาย
            </div>
          </div>
        </div>

        {/* Current Goals */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            เป้าหมายปัจจุบัน
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {goals.slice(0, 3).map((goal, index) => (
              <div key={index} style={{
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{
                    backgroundColor: `${goal.color}15`,
                    borderRadius: '50%',
                    width: '2rem',
                    height: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: goal.color
                  }}>
                    <goal.icon size={14} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {goal.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {goal.current} / {goal.target} {goal.unit}
                    </div>
                  </div>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'var(--border-color)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    width: `${goal.progress}%`,
                    height: '100%',
                    backgroundColor: goal.color,
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  เป้าหมาย: {new Date(goal.deadline).toLocaleDateString('th-TH')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workout Types Distribution */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '1.5rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          การแจกจ่ายประเภทการออกกำลังกาย
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
          gap: '1.5rem'
        }}>
          {workoutTypes.map((type, index) => (
            <div key={index} style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                background: `conic-gradient(${type.color} ${type.percentage * 3.6}deg, var(--border-color) 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: type.color
                }}>
                  {type.percentage}%
                </div>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {type.name}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                {type.sessions} เซสชั่น
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {type.calories?.toLocaleString()} แคลอรี่ • {Math.floor(type.time / 60)}:{(type.time % 60).toString().padStart(2, '0')} ชม.
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            แนวโน้มรายเดือน
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setShowShareModal(true)}
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
              <Share2 size={16} />
            </button>
            <button style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              cursor: 'pointer'
            }}>
              <Download size={16} />
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '2rem', minWidth: '600px', alignItems: 'end', height: '200px' }}>
            {monthlyData.map((month, index) => (
              <div key={index} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{
                    height: `${month.workouts * 6}px`,
                    width: '20px',
                    backgroundColor: 'var(--primary)',
                    borderRadius: '0.25rem'
                  }}></div>
                  <div style={{
                    height: `${month.calories / 100}px`,
                    width: '20px',
                    backgroundColor: 'var(--accent)',
                    borderRadius: '0.25rem'
                  }}></div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {month.month}
                </div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                  {month.workouts} เซสชั่น
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          gap: '2rem', 
          marginTop: '1rem',
          fontSize: '0.75rem', 
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: 'var(--primary)', 
              borderRadius: '2px' 
            }}></div>
            เซสชั่น
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: 'var(--accent)', 
              borderRadius: '2px' 
            }}></div>
            แคลอรี่ (x100)
          </div>
        </div>
      </div>
    </div>
  );

  const renderWorkouts = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Workout Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {workoutFilters.map(filter => (
            <button
              key={filter.id}
              onClick={() => {
                setWorkoutFilter(filter.id);
                // Refresh workout data with new filter
                apiCall(`/workouts?filter=${filter.id}`)
                  .then(data => setWorkoutHistory(data))
                  .catch(err => console.error('Filter error:', err));
              }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '1rem',
                border: '1px solid var(--border-color)',
                backgroundColor: workoutFilter === filter.id ? 'var(--primary)' : 'var(--bg-primary)',
                color: workoutFilter === filter.id ? 'var(--text-white)' : 'var(--text-primary)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={{
              padding: '0.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              cursor: 'pointer'
            }}
          >
            {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
          </button>
          <button
            onClick={refreshData}
            disabled={refreshing}
            style={{
              padding: '0.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <RotateCcw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Workout Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '1rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.25rem' }}>
            {workoutHistory.length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>เซสชั่นทั้งหมด</div>
        </div>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '0.25rem' }}>
            {workoutHistory.reduce((sum, w) => sum + (w.duration || 0), 0)} น.
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>เวลารวม</div>
        </div>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.25rem' }}>
            {workoutHistory.reduce((sum, w) => sum + (w.calories || 0), 0)}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>แคลอรี่</div>
        </div>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)', marginBottom: '0.25rem' }}>
            {workoutHistory.length > 0 ? Math.round(workoutHistory.reduce((sum, w) => sum + (w.avgHR || 0), 0) / workoutHistory.length) : 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>HR เฉลี่ย</div>
        </div>
      </div>

      {/* Workout History */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '1.5rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          ประวัติการออกกำลังกาย
        </h3>

        {workoutHistory.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-muted)'
          }}>
            <Activity size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>ยังไม่มีข้อมูลการออกกำลังกาย</p>
            <p style={{ fontSize: '0.875rem' }}>เริ่มบันทึกการออกกำลังกายของคุณ</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {workoutHistory.map(workout => (
              <div
                key={workout.id}
                onClick={() => setSelectedWorkout(workout)}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-color)',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => e.target.style.borderColor = 'var(--primary)'}
                onMouseLeave={(e) => e.target.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                        {workout.name}
                      </h4>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: 
                          workout.type === 'strength' ? 'rgba(35, 41, 86, 0.1)' :
                          workout.type === 'cardio' ? 'rgba(223, 37, 40, 0.1)' :
                          'rgba(72, 187, 120, 0.1)',
                        color: 
                          workout.type === 'strength' ? 'var(--primary)' :
                          workout.type === 'cardio' ? 'var(--accent)' :
                          'var(--success)'
                      }}>
                        {workout.type === 'strength' ? 'ยกน้ำหนัก' :
                         workout.type === 'cardio' ? 'คาร์ดิโอ' : 'ความยืดหยุ่น'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {new Date(workout.date).toLocaleDateString('th-TH', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < (workout.rating || 0) ? '#ffc107' : 'none'}
                        color={i < (workout.rating || 0) ? '#ffc107' : 'var(--text-muted)'}
                      />
                    ))}
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--info)' }}>
                      {workout.duration || 0}น
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ระยะเวลา</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--accent)' }}>
                      {workout.calories || 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>แคลอรี่</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--primary)' }}>
                      {workout.exercises || 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ท่า</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--warning)' }}>
                      {workout.avgHR || 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>HR เฉลี่ย</div>
                  </div>
                </div>

                {workout.notes && (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: 'rgba(72, 187, 120, 0.1)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    border: '1px solid rgba(72, 187, 120, 0.2)'
                  }}>
                    💭 {workout.notes}
                  </div>
                )}

                <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                  <ChevronRight size={20} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderBodyMetrics = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Body Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '1rem'
      }}>
        {bodyMetrics.map((metric, index) => (
          <div key={index} style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              backgroundColor: `${metric.color}15`,
              borderRadius: '50%',
              width: '3rem',
              height: '3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: metric.color
            }}>
              <metric.icon size={20} />
            </div>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              marginBottom: '0.25rem' 
            }}>
              {metric.current} <span style={{ fontSize: '0.875rem', fontWeight: '400' }}>{metric.unit}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              {metric.label}
            </div>
            <div style={{ 
              fontSize: '0.625rem', 
              color: metric.changeType === 'increase' ? 'var(--success)' : 'var(--warning)', 
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}>
              {metric.change} {metric.unit}
            </div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              เป้าหมาย: {metric.target} {metric.unit}
            </div>
            
            {/* Mini trend chart */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {renderMiniChart(metric.history || [0, 0, 0, 0], metric.color)}
            </div>
          </div>
        ))}
      </div>

      {/* Body Composition Chart */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '1.5rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          การเปลี่ยนแปลงองค์ประกอบร่างกาย
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '3rem', minWidth: '700px', alignItems: 'end', height: '250px' }}>
            {monthlyData.map((month, index) => (
              <div key={index} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  {/* Weight bar */}
                  <div style={{
                    height: `${((month.weight || 0) / 80) * 150}px`,
                    width: '15px',
                    backgroundColor: 'var(--success)',
                    borderRadius: '0.25rem',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '0.6rem',
                      color: 'var(--success)',
                      fontWeight: '600'
                    }}>
                      {month.weight || 0}
                    </div>
                  </div>
                  
                  {/* Body fat bar */}
                  <div style={{
                    height: `${((month.bodyFat || 0) / 25) * 100}px`,
                    width: '15px',
                    backgroundColor: 'var(--warning)',
                    borderRadius: '0.25rem',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '0.6rem',
                      color: 'var(--warning)',
                      fontWeight: '600'
                    }}>
                      {month.bodyFat || 0}%
                    </div>
                  </div>
                  
                  {/* Muscle bar */}
                  <div style={{
                    height: `${((month.muscle || 0) / 50) * 120}px`,
                    width: '15px',
                    backgroundColor: 'var(--info)',
                    borderRadius: '0.25rem',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '0.6rem',
                      color: 'var(--info)',
                      fontWeight: '600'
                    }}>
                      {month.muscle || 0}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {month.month}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          gap: '2rem', 
          marginTop: '1.5rem',
          fontSize: '0.75rem', 
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: 'var(--success)', 
              borderRadius: '2px' 
            }}></div>
            น้ำหนัก (กก.)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: 'var(--warning)', 
              borderRadius: '2px' 
            }}></div>
            ไขมัน (%)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: 'var(--info)', 
              borderRadius: '2px' 
            }}></div>
            กล้ามเนื้อ (กก.)
          </div>
        </div>
      </div>

      {/* Progress Photos */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            รูปภาพความก้าวหน้า
          </h3>
          <button
            onClick={() => setShowPhotoModal(true)}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <Camera size={16} />
            เพิ่มรูป
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: '1rem'
        }}>
          {progressPhotos.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '3rem',
              color: 'var(--text-muted)'
            }}>
              <Camera size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>ยังไม่มีรูปภาพความก้าวหน้า</p>
              <p style={{ fontSize: '0.875rem' }}>เริ่มบันทึกการเปลี่ยนแปลงของคุณ</p>
            </div>
          ) : progressPhotos.map(photo => (
            <div key={photo.id} style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}>
              <div style={{
                aspectRatio: '3/4',
                backgroundColor: 'var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                position: 'relative'
              }}>
                {photo.url ? (
                  <img 
                    src={photo.url} 
                    alt={`Progress ${photo.type}`}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }}
                  />
                ) : (
                  <Camera size={32} />
                )}
                <div style={{
                  position: 'absolute',
                  bottom: '0.5rem',
                  right: '0.5rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem'
                }}>
                  {photo.type}
                </div>
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {new Date(photo.date).toLocaleDateString('th-TH')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {photo.weight} กก. • {photo.bodyFat}% ไขมัน • {photo.muscle} กก. กล้ามเนื้อ
                </div>
                {photo.notes && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    "{photo.notes}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAchievements = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Achievement Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '1rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#FFD700', marginBottom: '0.25rem' }}>
            {achievements.filter(a => a.completed && a.level === 'gold').length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ทอง</div>
        </div>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#C0C0C0', marginBottom: '0.25rem' }}>
            {achievements.filter(a => a.completed && a.level === 'silver').length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>เงิน</div>
        </div>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#CD7F32', marginBottom: '0.25rem' }}>
            {achievements.filter(a => a.completed && a.level === 'bronze').length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ทองแดง</div>
        </div>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.25rem' }}>
            {achievements.filter(a => a.completed).reduce((sum, a) => sum + a.points, 0)}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>แต้มรวม</div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
        gap: '1.5rem'
      }}>
        {achievements.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--text-muted)'
          }}>
            <Award size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>ยังไม่มีความสำเร็จ</p>
            <p style={{ fontSize: '0.875rem' }}>เริ่มออกกำลังกายเพื่อปลดล็อคความสำเร็จ</p>
          </div>
        ) : achievements.map(achievement => (
          <div key={achievement.id} style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
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
                color: 'var(--text-white)',
                fontSize: '0.75rem'
              }}>
                ✓
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                fontSize: '2.5rem',
                width: '3.5rem',
                height: '3.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `${
                  achievement.level === 'gold' ? '#FFD700' :
                  achievement.level === 'silver' ? '#C0C0C0' : '#CD7F32'
                }20`,
                borderRadius: '50%',
                border: `2px solid ${
                  achievement.level === 'gold' ? '#FFD700' :
                  achievement.level === 'silver' ? '#C0C0C0' : '#CD7F32'
                }`
              }}>
                {achievement.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {achievement.title}
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {achievement.description}
                </p>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: achievement.level === 'gold' ? '#FFD700' : 
                         achievement.level === 'silver' ? '#C0C0C0' : '#CD7F32',
                  fontWeight: '600'
                }}>
                  +{achievement.points} แต้ม
                </div>
              </div>
            </div>

            {achievement.completed ? (
              <div style={{ 
                fontSize: '0.875rem', 
                color: 'var(--success)', 
                fontWeight: '500',
                textAlign: 'center',
                padding: '0.75rem',
                backgroundColor: 'rgba(72, 187, 120, 0.1)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(72, 187, 120, 0.2)'
              }}>
                🎉 เสร็จสิ้นเมื่อ {achievement.completedDate}
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      ความก้าวหน้า
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{achievement.progress}%</span>
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
                      width: `${achievement.progress}%`,
                      background: `linear-gradient(90deg, ${
                        achievement.level === 'gold' ? '#FFD700' :
                        achievement.level === 'silver' ? '#C0C0C0' : '#CD7F32'
                      }, ${
                        achievement.level === 'gold' ? '#FFA500' :
                        achievement.level === 'silver' ? '#A0A0A0' : '#8B4513'
                      })`,
                      borderRadius: '1rem',
                      transition: 'width 0.6s ease'
                    }}></div>
                  </div>
                </div>
                
                {achievement.target && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-muted)', 
                    textAlign: 'center',
                    marginBottom: '0.5rem' 
                  }}>
                    {achievement.current?.toLocaleString()} / {achievement.target?.toLocaleString()}
                  </div>
                )}

                <div style={{
                  padding: '0.5rem',
                  backgroundColor: 'rgba(35, 41, 86, 0.05)',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center'
                }}>
                  ⏳ อีก {(achievement.target || 0) - (achievement.current || 0)} เพื่อปลดล็อค
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Modal Components
  const PhotoUploadModal = () => {
    const [photoData, setPhotoData] = useState({
      file: null,
      type: 'front',
      notes: '',
      weight: '',
      bodyFat: '',
      muscle: ''
    });
    const [uploading, setUploading] = useState(false);

    if (!showPhotoModal) return null;

    const handleUpload = async () => {
      if (!photoData.file) {
        alert('กรุณาเลือกรูปภาพ');
        return;
      }

      setUploading(true);
      try {
        await uploadProgressPhoto(photoData);
        setPhotoData({
          file: null,
          type: 'front',
          notes: '',
          weight: '',
          bodyFat: '',
          muscle: ''
        });
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setUploading(false);
      }
    };

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
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              เพิ่มรูปความก้าวหน้า
            </h3>
            <button
              onClick={() => setShowPhotoModal(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={24} />
            </button>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '0.75rem',
              padding: '3rem 1rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-secondary)'
            }}>
              <Camera size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                คลิกเพื่อเลือกรูปหรือลากไฟล์มาวาง
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoData(prev => ({ ...prev, file: e.target.files[0] }))}
                style={{ display: 'none' }}
                id="photo-upload"
              />
              <label 
                htmlFor="photo-upload"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--text-white)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'inline-block'
                }}
              >
                เลือกรูป
              </label>
              {photoData.file && (
                <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.5rem' }}>
                  ✓ เลือกไฟล์: {photoData.file.name}
                </p>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}>
              ประเภทรูป
            </label>
            <select 
              value={photoData.type}
              onChange={(e) => setPhotoData(prev => ({ ...prev, type: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}
            >
              <option value="front">ด้านหน้า</option>
              <option value="side">ด้านข้าง</option>
              <option value="back">ด้านหลัง</option>
              <option value="pose">โพส</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}>
              บันทึกเพิ่มเติม (ไม่บังคับ)
            </label>
            <textarea
              value={photoData.notes}
              onChange={(e) => setPhotoData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="เช่น รู้สึกอย่างไร มีการเปลี่ยนแปลงอะไรบ้าง..."
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

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setShowPhotoModal(false)}
              style={{
                flex: 1,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              ยกเลิก
            </button>
            <button 
              onClick={handleUpload}
              disabled={uploading || !photoData.file}
              style={{
                flex: 1,
                backgroundColor: uploading || !photoData.file ? 'var(--text-muted)' : 'var(--primary)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: uploading || !photoData.file ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {uploading ? (
                <>
                  <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  กำลังอัพโหลด...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  อัพโหลด
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const GoalModal = () => {
    if (!showGoalModal) return null;

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
              เป้าหมายของฉัน
            </h3>
            <button
              onClick={() => setShowGoalModal(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={24} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {goals.map(goal => (
              <div key={goal.id} style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    backgroundColor: `${goal.color}15`,
                    borderRadius: '50%',
                    width: '3rem',
                    height: '3rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: goal.color
                  }}>
                    <goal.icon size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {goal.title}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      เป้าหมาย: {new Date(goal.deadline).toLocaleDateString('th-TH')}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      // Handle goal editing
                      console.log('Edit goal:', goal.id);
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <Edit3 size={16} />
                  </button>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {goal.current} / {goal.target} {goal.unit}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{goal.progress}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'var(--border-color)',
                    borderRadius: '1rem',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${goal.progress}%`,
                      height: '100%',
                      backgroundColor: goal.color,
                      borderRadius: '1rem',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  เหลืออีก {Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24))} วัน
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => {
              // Handle creating new goal
              console.log('Create new goal');
            }}
            style={{
              width: '100%',
              backgroundColor: 'var(--primary)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={16} />
            เพิ่มเป้าหมายใหม่
          </button>
        </div>
      </div>
    );
  };

  const ShareModal = () => {
    if (!showShareModal) return null;

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
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              แชร์ความก้าวหน้า
            </h3>
            <button
              onClick={() => setShowShareModal(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={24} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { name: 'Facebook', color: '#1877f2', icon: 'f' },
              { name: 'Twitter', color: '#1DA1F2', icon: 'T' },
              { name: 'WhatsApp', color: '#25D366', icon: Phone },
              { name: 'Email', color: 'var(--text-secondary)', icon: Mail }
            ].map((platform, index) => (
              <button 
                key={index}
                onClick={() => shareProgress(platform.name.toLowerCase())}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                <div style={{
                  backgroundColor: platform.color,
                  borderRadius: '50%',
                  width: '2.5rem',
                  height: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  {typeof platform.icon === 'string' ? (
                    <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>{platform.icon}</span>
                  ) : (
                    <platform.icon size={16} />
                  )}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  แชร์ใน {platform.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Workout Detail Modal
  const WorkoutDetailModal = () => {
    if (!selectedWorkout) return null;

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
              รายละเอียดการออกกำลังกาย
            </h3>
            <button
              onClick={() => setSelectedWorkout(null)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={24} />
            </button>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {selectedWorkout.name}
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {new Date(selectedWorkout.date).toLocaleDateString('th-TH', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--info)' }}>
                  {selectedWorkout.duration || 0} นาที
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ระยะเวลา</div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent)' }}>
                  {selectedWorkout.calories || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>แคลอรี่</div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--warning)' }}>
                  {selectedWorkout.avgHR || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>HR เฉลี่ย</div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>
                  {selectedWorkout.maxHR || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>HR สูงสุด</div>
              </div>
            </div>
          </div>

          {selectedWorkout.exercises_detail && selectedWorkout.exercises_detail.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h5 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                รายการท่าออกกำลังกาย
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedWorkout.exercises_detail.map((exercise, index) => (
                  <div key={index} style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      {exercise.name}
                    </div>
                    {exercise.sets && exercise.reps && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {exercise.sets} เซต × {Array.isArray(exercise.reps) ? exercise.reps.join(', ') : exercise.reps} รอบ
                        {exercise.weight && exercise.weight.some(w => w > 0) && (
                          <span> • น้ำหนัก: {exercise.weight.join(', ')} กก.</span>
                        )}
                      </div>
                    )}
                    {exercise.rounds && exercise.duration && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {exercise.rounds} รอบ × {exercise.duration} • พัก: {exercise.rest}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedWorkout.notes && (
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(72, 187, 120, 0.1)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(72, 187, 120, 0.2)',
              marginBottom: '1.5rem'
            }}>
              <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--success)', marginBottom: '0.5rem' }}>
                บันทึกหลังออกกำลังกาย:
              </h5>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                {selectedWorkout.notes}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>คะแนน:</span>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                fill={i < (selectedWorkout.rating || 0) ? '#ffc107' : 'none'}
                color={i < (selectedWorkout.rating || 0) ? '#ffc107' : 'var(--text-muted)'}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: windowWidth <= 768 ? '1rem' : '2rem', backgroundColor: 'var(--bg-secondary)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h1 style={{ 
            fontSize: windowWidth <= 768 ? '1.5rem' : '1.75rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            margin: 0
          }}>
            ความก้าวหน้า
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
              <RotateCcw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              {windowWidth > 768 && 'รีเฟรช'}
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Share2 size={16} />
              {windowWidth > 768 && 'แชร์'}
            </button>
            <button style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              cursor: 'pointer'
            }}>
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
          ติดตามผลการออกกำลังกายและความก้าวหน้าของคุณ
        </p>
      </div>

      {/* Time Range Selector */}
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
        {timeRanges.map(range => (
          <button
            key={range.id}
            onClick={() => setTimeRange(range.id)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: timeRange === range.id ? 'var(--accent)' : 'transparent',
              color: timeRange === range.id ? 'var(--text-white)' : 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {range.label}
          </button>
        ))}
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
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              flex: windowWidth <= 768 ? '1' : 'auto'
            }}
          >
            <tab.icon size={16} />
            {windowWidth > 768 ? tab.label : tab.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'workouts' && renderWorkouts()}
      {activeTab === 'body' && renderBodyMetrics()}
      {activeTab === 'achievements' && renderAchievements()}

      {/* Modals */}
      <PhotoUploadModal />
      <GoalModal />
      <ShareModal />
      <WorkoutDetailModal />
    </div>
  );
};

export default ClientProgress;