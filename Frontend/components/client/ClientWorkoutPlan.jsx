import React, { useState, useEffect } from 'react';
import { 
  Target, Clock, Dumbbell, PlayCircle, 
  CheckCircle, ChevronRight, Filter,
  MoreVertical, Star, User, Calendar,
  TrendingUp, Heart, Activity, Pause,
  RotateCcw, Plus, Edit, Share2,
  Video, Timer, Trophy,
  MessageSquare, Download, Settings,
  ChevronLeft, ChevronDown, X, Save,
  BarChart3, Send, Camera, Ruler,
  MapPin, Users, Clock3, Image,
  FileText, Zap, Weight, Eye, ChevronUp,
  Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// API Service Functions
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiService = {
  // Get current workout plan
  getCurrentPlan: async (clientId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/${clientId}/workout-plan/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch current plan');
      return await response.json();
    } catch (error) {
      console.error('Error fetching current plan:', error);
      throw error;
    }
  },

  // Get booked sessions
  getBookedSessions: async (clientId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/${clientId}/sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  },

  // Get workout data
  getWorkoutData: async (clientId, planId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/${clientId}/workout-plan/${planId}/workouts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch workout data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching workout data:', error);
      throw error;
    }
  },

  // Get progress data
  getProgressData: async (clientId, planId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/${clientId}/workout-plan/${planId}/progress`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch progress data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching progress data:', error);
      throw error;
    }
  },

  // Update workout completion
  updateWorkoutCompletion: async (clientId, workoutId, completionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clients/${clientId}/workouts/${workoutId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(completionData)
      });
      if (!response.ok) throw new Error('Failed to update workout completion');
      return await response.json();
    } catch (error) {
      console.error('Error updating workout completion:', error);
      throw error;
    }
  },

  // Get session details
  getSessionDetails: async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch session details');
      return await response.json();
    } catch (error) {
      console.error('Error fetching session details:', error);
      throw error;
    }
  },

  // Reschedule session
  rescheduleSession: async (sessionId, newDateTime) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newDateTime })
      });
      if (!response.ok) throw new Error('Failed to reschedule session');
      return await response.json();
    } catch (error) {
      console.error('Error rescheduling session:', error);
      throw error;
    }
  }
};

const ClientWorkoutPlan = () => {
  const [activeTab, setActiveTab] = useState('current');
  const [selectedDay, setSelectedDay] = useState('monday');
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timerTime, setTimerTime] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Database state
  const [currentPlan, setCurrentPlan] = useState(null);
  const [bookedSessions, setBookedSessions] = useState([]);
  const [workoutData, setWorkoutData] = useState({});
  const [progressData, setProgressData] = useState({
    measurements: [],
    photos: [],
    goals: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Get client ID from auth context or localStorage
  const clientId = localStorage.getItem('clientId') || 'client_001';

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

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [clientId]);

  // Load data when plan changes
  useEffect(() => {
    if (currentPlan?.id) {
      loadWorkoutData();
      loadProgressData();
    }
  }, [currentPlan?.id]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerTime(time => time + 1);
      }, 1000);
    } else if (!timerActive && timerTime !== 0) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timerTime]);

  // Load initial data function
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load current plan and sessions concurrently
      const [planData, sessionsData] = await Promise.all([
        apiService.getCurrentPlan(clientId),
        apiService.getBookedSessions(clientId)
      ]);
      
      setCurrentPlan(planData);
      setBookedSessions(sessionsData);
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  // Load workout data function
  const loadWorkoutData = async () => {
    try {
      if (!currentPlan?.id) return;
      
      const data = await apiService.getWorkoutData(clientId, currentPlan.id);
      setWorkoutData(data);
      
    } catch (error) {
      console.error('Error loading workout data:', error);
      setError('ไม่สามารถโหลดข้อมูลการเทรนได้');
    }
  };

  // Load progress data function
  const loadProgressData = async () => {
    try {
      if (!currentPlan?.id) return;
      
      const data = await apiService.getProgressData(clientId, currentPlan.id);
      setProgressData(data);
      
    } catch (error) {
      console.error('Error loading progress data:', error);
      setError('ไม่สามารถโหลดข้อมูลความก้าวหน้าได้');
    }
  };

  // Refresh data function
  const refreshData = async () => {
    try {
      setRefreshing(true);
      await loadInitialData();
      
      // Refresh workout and progress data if plan exists
      if (currentPlan?.id) {
        await Promise.all([
          loadWorkoutData(),
          loadProgressData()
        ]);
      }
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('ไม่สามารถรีเฟรชข้อมูลได้');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle workout completion
  const handleWorkoutCompletion = async (workoutId, completionData) => {
    try {
      await apiService.updateWorkoutCompletion(clientId, workoutId, completionData);
      
      // Refresh workout data
      await loadWorkoutData();
      
      // Show success message
      alert('บันทึกการเทรนเสร็จสิ้น!');
      
    } catch (error) {
      console.error('Error completing workout:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกการเทรน');
    }
  };

  // Handle session reschedule
  const handleSessionReschedule = async (sessionId, newDateTime) => {
    try {
      await apiService.rescheduleSession(sessionId, newDateTime);
      
      // Refresh sessions data
      const sessionsData = await apiService.getBookedSessions(clientId);
      setBookedSessions(sessionsData);
      
      alert('เลื่อนนัดหมายเสร็จสิ้น!');
      
    } catch (error) {
      console.error('Error rescheduling session:', error);
      alert('เกิดข้อผิดพลาดในการเลื่อนนัดหมาย');
    }
  };

  // View session details
  const viewSession = async (session) => {
    try {
      const sessionDetails = await apiService.getSessionDetails(session.id);
      setSelectedSession(sessionDetails);
      setShowSessionModal(true);
    } catch (error) {
      console.error('Error fetching session details:', error);
      alert('ไม่สามารถโหลดรายละเอียดเซสชั่นได้');
    }
  };

  const tabs = [
    { id: 'current', label: 'แผนปัจจุบัน', icon: Target },
    { id: 'sessions', label: 'เซสชั่น', icon: Calendar },
    { id: 'progress', label: 'ความก้าวหน้า', icon: TrendingUp }
  ];

  const weekDays = [
    { id: 'monday', label: 'จันทร์', short: 'จ' },
    { id: 'tuesday', label: 'อังคาร', short: 'อ' },
    { id: 'wednesday', label: 'พุธ', short: 'พ' },
    { id: 'thursday', label: 'พฤหัสบดี', short: 'พฤ' },
    { id: 'friday', label: 'ศุกร์', short: 'ศ' },
    { id: 'saturday', label: 'เสาร์', short: 'ส' },
    { id: 'sunday', label: 'อาทิตย์', short: 'อา' }
  ];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startWorkout = (workout) => {
    setActiveWorkout(workout);
    setShowWorkoutModal(true);
    setCurrentExerciseIndex(0);
    setTimerTime(0);
  };

  // เตรียมข้อมูลสำหรับกราฟ
  const prepareChartData = () => {
    return progressData.measurements.map(item => ({
      ...item,
      dateFormatted: new Date(item.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })
    }));
  };

  // Custom Tooltip สำหรับกราฟ
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              fontSize: '0.875rem', 
              color: entry.color, 
              margin: '0.25rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{
                width: '0.75rem',
                height: '0.75rem',
                backgroundColor: entry.color,
                borderRadius: '50%'
              }}></span>
              {entry.name}: {entry.value} {entry.dataKey === 'bodyFat' ? '%' : 'kg'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Loading Component
  const LoadingSpinner = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem',
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '0.75rem',
      border: '1px solid var(--border-color)'
    }}>
      <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูล...</p>
    </div>
  );

  // Error Component
  const ErrorMessage = ({ message, onRetry }) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem',
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '0.75rem',
      border: '1px solid var(--border-color)',
      textAlign: 'center'
    }}>
      <AlertCircle size={32} color="var(--danger)" />
      <p style={{ marginTop: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>เกิดข้อผิดพลาด</p>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{message}</p>
      <button
        onClick={onRetry}
        style={{
          backgroundColor: 'var(--primary)',
          color: 'var(--text-white)',
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

  const renderSessionModal = () => {
    if (!showSessionModal || !selectedSession) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              รายละเอียดเซสชั่น
            </h3>
            <button 
              onClick={() => setShowSessionModal(false)}
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

          {/* Session Info */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                {selectedSession.sessionType}
              </span>
              <span style={{
                marginLeft: '0.5rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                backgroundColor: 
                  selectedSession.status === 'completed' ? 'rgba(72, 187, 120, 0.1)' :
                  selectedSession.status === 'confirmed' ? 'rgba(66, 153, 225, 0.1)' :
                  'rgba(237, 137, 54, 0.1)',
                color: 
                  selectedSession.status === 'completed' ? 'var(--success)' :
                  selectedSession.status === 'confirmed' ? 'var(--info)' :
                  'var(--warning)'
              }}>
                {selectedSession.status === 'completed' ? 'เสร็จสิ้น' :
                 selectedSession.status === 'confirmed' ? 'ยืนยันแล้ว' : 'รอยืนยัน'}
              </span>
            </div>
            
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              📅 {new Date(selectedSession.date).toLocaleDateString('th-TH')} เวลา {selectedSession.time} น.
            </div>
            
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              ⏱️ ระยะเวลา {selectedSession.duration} นาที
            </div>
            
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              📍 {selectedSession.location}
            </div>
            
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              👨‍🏫 {selectedSession.trainerName} • เซสชั่นที่ {selectedSession.packageSession}
            </div>
          </div>

          {/* Session Notes */}
          {selectedSession.sessionNotes && (
            <div style={{
              backgroundColor: 'rgba(35, 41, 86, 0.1)',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                คำแนะนำจากเทรนเนอร์:
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                {selectedSession.sessionNotes}
              </div>
            </div>
          )}

          {/* Workout Plan */}
          {selectedSession.workoutPlan && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                แผนการเทรน
              </h4>
              
              {selectedSession.workoutPlan.warmUp && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--warning)', marginBottom: '0.25rem' }}>
                    🔥 Warm Up:
                  </div>
                  <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1rem' }}>
                    {selectedSession.workoutPlan.warmUp.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                  💪 Main Workout:
                </div>
                {selectedSession.workoutPlan.mainWorkout.map((exercise, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.375rem',
                    marginBottom: '0.5rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                        {exercise.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {exercise.sets} เซต × {exercise.reps} • {exercise.weight}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedSession.workoutPlan.coolDown && (
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--info)', marginBottom: '0.25rem' }}>
                    🧘‍♂️ Cool Down:
                  </div>
                  <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1rem' }}>
                    {selectedSession.workoutPlan.coolDown.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Session Report */}
          {selectedSession.sessionReport && (
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                รายงานผลการเทรน
              </h4>
              
              <div style={{
                backgroundColor: 'rgba(72, 187, 120, 0.1)',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--success)', marginBottom: '0.5rem' }}>
                  ผลการประเมิน: {selectedSession.sessionReport.performance}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {selectedSession.sessionReport.notes}
                </div>
              </div>

              {/* Measurements */}
              {selectedSession.sessionReport.measurements && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    📏 การวัดผล:
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem'
                  }}>
                    <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.375rem' }}>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--primary)' }}>
                        {selectedSession.sessionReport.measurements.weight}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>น้ำหนัก (kg)</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.375rem' }}>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--accent)' }}>
                        {selectedSession.sessionReport.measurements.bodyFat}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ไขมัน (%)</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.375rem' }}>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--success)' }}>
                        {selectedSession.sessionReport.measurements.muscle}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>กล้ามเนื้อ (kg)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Photos */}
              {selectedSession.sessionReport.photos && selectedSession.sessionReport.photos.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    📸 ภาพการเทรน:
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: '0.5rem'
                  }}>
                    {selectedSession.sessionReport.photos.map((photo, index) => (
                      <div key={index} style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '0.375rem',
                        padding: '0.5rem',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          backgroundColor: 'var(--border-color)',
                          borderRadius: '0.375rem',
                          height: '80px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '0.25rem'
                        }}>
                          <Camera size={24} color="var(--text-muted)" />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {photo.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            {selectedSession.status === 'confirmed' && (
              <button style={{
                flex: 1,
                backgroundColor: 'var(--primary)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                เตรียมตัวสำหรับเซสชั่น
              </button>
            )}
            
            <button style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <MessageSquare size={16} />
              ติดต่อเทรนเนอร์
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderProgressModal = () => {
    if (!showProgressModal) return null;

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
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              ความก้าวหน้าโดยรวม
            </h3>
            <button 
              onClick={() => setShowProgressModal(false)}
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

          {/* Goals Progress */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              🎯 เป้าหมาย
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {progressData.goals.map((goal, index) => (
                <div key={index} style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {goal.name}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {goal.current > 0 ? '+' : ''}{goal.current} / {goal.target > 0 ? '+' : ''}{goal.target} {goal.unit}
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
                      width: `${goal.progress}%`,
                      backgroundColor: 'var(--primary)',
                      borderRadius: '1rem',
                      transition: 'width 0.6s ease'
                    }}></div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {goal.progress}% ของเป้าหมาย
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Measurements Chart */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              📊 กราฟความก้าวหน้า
            </h4>
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              height: '400px'
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="dateFormatted" 
                    tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                    stroke="var(--text-secondary)"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                    stroke="var(--text-secondary)"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ 
                      fontSize: '14px',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#232956" 
                    strokeWidth={3}
                    name="น้ำหนัก"
                    dot={{ fill: '#232956', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, stroke: '#232956', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bodyFat" 
                    stroke="#df2528" 
                    strokeWidth={3}
                    name="ไขมัน"
                    dot={{ fill: '#df2528', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, stroke: '#df2528', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="muscle" 
                    stroke="#48bb78" 
                    strokeWidth={3}
                    name="กล้ามเนื้อ"
                    dot={{ fill: '#48bb78', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, stroke: '#48bb78', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Progress Photos */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              📸 ภาพความก้าวหน้า
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem'
            }}>
              {progressData.photos.map((photo, index) => (
                <div key={index} style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    backgroundColor: 'var(--border-color)',
                    borderRadius: '0.5rem',
                    height: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <Camera size={32} color="var(--text-muted)" />
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                    {photo.description}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {new Date(photo.date).toLocaleDateString('th-TH')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentPlan = () => {
    if (!currentPlan) return null;

    return (
      <div>
        {/* Plan Header */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              backgroundColor: 'var(--primary)',
              borderRadius: '50%',
              width: '3rem',
              height: '3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-white)'
            }}>
              <Target size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {currentPlan.name}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                สร้างโดย {currentPlan.trainer} • ได้รับเมื่อ {currentPlan.assignedDate}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowProgressModal(true)}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <BarChart3 size={18} />
              </button>
              <button style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MessageSquare size={18} />
              </button>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {currentPlan.description}
          </p>

          {/* Progress Chart */}
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                📊 กราฟความก้าวหน้า
              </h4>
              <button
                onClick={() => setShowProgressModal(true)}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--text-white)',
                  border: 'none',
                  borderRadius: '0.375rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                ดูแบบเต็ม
              </button>
            </div>
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              padding: '1rem',
              height: '250px'
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="dateFormatted" 
                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                    stroke="var(--text-secondary)"
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                    stroke="var(--text-secondary)"
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#232956" 
                    strokeWidth={2}
                    name="น้ำหนัก"
                    dot={{ fill: '#232956', strokeWidth: 1, r: 3 }}
                    activeDot={{ r: 5, stroke: '#232956', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bodyFat" 
                    stroke="#df2528" 
                    strokeWidth={2}
                    name="ไขมัน"
                    dot={{ fill: '#df2528', strokeWidth: 1, r: 3 }}
                    activeDot={{ r: 5, stroke: '#df2528', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="muscle" 
                    stroke="#48bb78" 
                    strokeWidth={2}
                    name="กล้ามเนื้อ"
                    dot={{ fill: '#48bb78', strokeWidth: 1, r: 3 }}
                    activeDot={{ r: 5, stroke: '#48bb78', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Chart Legend */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1.5rem',
              marginTop: '1rem',
              fontSize: '0.875rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '0.75rem',
                  height: '0.75rem',
                  backgroundColor: '#232956',
                  borderRadius: '50%'
                }}></div>
                <span style={{ color: 'var(--text-primary)' }}>น้ำหนัก (kg)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '0.75rem',
                  height: '0.75rem',
                  backgroundColor: '#df2528',
                  borderRadius: '50%'
                }}></div>
                <span style={{ color: 'var(--text-primary)' }}>ไขมัน (%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '0.75rem',
                  height: '0.75rem',
                  backgroundColor: '#48bb78',
                  borderRadius: '50%'
                }}></div>
                <span style={{ color: 'var(--text-primary)' }}>กล้ามเนื้อ (kg)</span>
              </div>
            </div>
          </div>

          {currentPlan.latestMeasurements && (
            <div style={{
              backgroundColor: 'rgba(72, 187, 120, 0.1)',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1rem',
              border: '1px solid rgba(72, 187, 120, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Ruler size={16} color="var(--success)" />
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--success)' }}>
                  การวัดผลล่าสุด ({new Date(currentPlan.latestMeasurements.date).toLocaleDateString('th-TH')}):
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--primary)' }}>
                    {currentPlan.latestMeasurements.weight} kg
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>น้ำหนัก</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--accent)' }}>
                    {currentPlan.latestMeasurements.bodyFat}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ไขมัน</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--success)' }}>
                    {currentPlan.latestMeasurements.muscle} kg
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>กล้ามเนื้อ</div>
                </div>
              </div>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                {currentPlan.progress}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ความก้าวหน้า</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
                {currentPlan.completedSessions}/{currentPlan.totalSessions}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เซสชั่น</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
                {currentPlan.startDate}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เริ่มต้น</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)' }}>
                {currentPlan.endDate}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>สิ้นสุด</div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ความก้าวหน้า</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{currentPlan.progress}%</span>
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
                width: `${currentPlan.progress}%`,
                backgroundColor: 'var(--primary)',
                borderRadius: '1rem',
                transition: 'width 0.6s ease'
              }}></div>
            </div>
          </div>
        </div>

        {/* Week Days Navigation */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '1rem',
          marginBottom: '1.5rem',
          overflowX: 'auto'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', minWidth: 'max-content' }}>
            {weekDays.map(day => {
              const hasWorkout = workoutData[day.id] && workoutData[day.id].length > 0;
              const isCompleted = workoutData[day.id] && workoutData[day.id][0]?.completed;
              const isSession = workoutData[day.id] && workoutData[day.id][0]?.type === 'session';
              
              return (
                <button
                  key={day.id}
                  onClick={() => setSelectedDay(day.id)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    backgroundColor: selectedDay === day.id ? 'var(--primary)' : 'transparent',
                    color: selectedDay === day.id ? 'var(--text-white)' : 'var(--text-primary)',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    position: 'relative',
                    minWidth: '80px',
                    textAlign: 'center'
                  }}
                >
                  <div>{windowWidth <= 768 ? day.short : day.label}</div>
                  {hasWorkout && (
                    <div style={{
                      position: 'absolute',
                      top: '0.25rem',
                      right: '0.25rem',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 
                        isCompleted ? 'var(--success)' : 
                        isSession ? 'var(--info)' : 'var(--warning)'
                    }}></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Content */}
        {workoutData[selectedDay] && workoutData[selectedDay].map(workout => (
          <div key={workout.id} style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {workout.name}
                  </h4>
                  {workout.type === 'session' && (
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      backgroundColor: 'rgba(66, 153, 225, 0.1)',
                      color: 'var(--info)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Users size={12} />
                      เซสชั่น
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={14} />
                    {workout.duration} นาที
                  </span>
                  {workout.exercises > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Dumbbell size={14} />
                      {workout.exercises} ท่า
                    </span>
                  )}
                  {workout.calories > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Zap size={14} />
                      {workout.calories} แคลอรี่
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {workout.completed ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={20} color="var(--success)" />
                    <button 
                      onClick={() => workout.sessionId && viewSession(bookedSessions.find(s => s.id === workout.sessionId))}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
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
                      <Eye size={16} />
                      ดูผล
                    </button>
                  </div>
                ) : workout.scheduledAt ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: 'rgba(66, 153, 225, 0.1)',
                      color: 'var(--info)'
                    }}>
                      จองแล้ว
                    </span>
                    <button 
                      onClick={() => workout.sessionId && viewSession(bookedSessions.find(s => s.id === workout.sessionId))}
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
                      <Calendar size={16} />
                      ดูเซสชั่น
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => startWorkout(workout)}
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
                    <PlayCircle size={16} />
                    เริ่ม
                  </button>
                )}
              </div>
            </div>

            {/* Session/Workout Notes */}
            {(workout.notes || workout.trainerNotes) && (
              <div style={{
                backgroundColor: workout.completed ? 'rgba(72, 187, 120, 0.1)' : 'rgba(35, 41, 86, 0.1)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                border: `1px solid ${workout.completed ? 'rgba(72, 187, 120, 0.2)' : 'rgba(35, 41, 86, 0.2)'}`
              }}>
                {workout.trainerNotes && (
                  <div style={{ marginBottom: workout.notes ? '0.5rem' : '0' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '0.25rem' }}>
                      คำแนะนำจากเทรนเนอร์:
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {workout.trainerNotes}
                    </div>
                  </div>
                )}
                {workout.notes && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: workout.completed ? 'var(--success)' : 'var(--primary)', fontWeight: '600', marginBottom: '0.25rem' }}>
                      {workout.completed ? 'บันทึกหลังเทรน:' : 'หมายเหตุ:'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {workout.notes}
                    </div>
                  </div>
                )}
                {workout.completedAt && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    เสร็จสิ้นเมื่อ: {new Date(workout.completedAt).toLocaleString('th-TH')}
                  </div>
                )}
              </div>
            )}

            {/* Measurements (for measurement sessions) */}
            {workout.measurements && (
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  📏 ผลการวัด:
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {Object.entries(workout.measurements).map(([key, value]) => (
                    <div key={key} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--primary)' }}>
                        {value}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {key === 'weight' ? 'น้ำหนัก (kg)' :
                         key === 'bodyFat' ? 'ไขมัน (%)' :
                         key === 'muscle' ? 'กล้ามเนื้อ (kg)' :
                         key === 'chest' ? 'อก (cm)' :
                         key === 'waist' ? 'เอว (cm)' :
                         key === 'hips' ? 'สะโพก (cm)' : key}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderSessions = () => (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          เซสชั่นกับเทรนเนอร์
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          เซสชั่นที่จองไว้และประวัติการเทรนกับเทรนเนอร์
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {bookedSessions.map((session, index) => (
          <div key={index} style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {session.sessionType}
                  </h4>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: 
                      session.status === 'completed' ? 'rgba(72, 187, 120, 0.1)' :
                      session.status === 'confirmed' ? 'rgba(66, 153, 225, 0.1)' :
                      'rgba(237, 137, 54, 0.1)',
                    color: 
                      session.status === 'completed' ? 'var(--success)' :
                      session.status === 'confirmed' ? 'var(--info)' :
                      'var(--warning)'
                  }}>
                    {session.status === 'completed' ? 'เสร็จสิ้น' :
                     session.status === 'confirmed' ? 'ยืนยันแล้ว' : 'รอยืนยัน'}
                  </span>
                </div>
                
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  👨‍🏫 {session.trainerName} • เซสชั่นที่ {session.packageSession}
                </div>
                
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  📅 {new Date(session.date).toLocaleDateString('th-TH')} เวลา {session.time} น.
                </div>
                
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  ⏱️ {session.duration} นาที • 📍 {session.location}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                {session.completed && session.sessionReport && (
                  <div style={{
                    backgroundColor: 'rgba(72, 187, 120, 0.1)',
                    borderRadius: '50%',
                    width: '2rem',
                    height: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Trophy size={16} color="var(--success)" />
                  </div>
                )}
              </div>
            </div>

            {session.sessionNotes && (
              <div style={{
                backgroundColor: 'rgba(35, 41, 86, 0.1)',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                  📝 คำแนะนำจากเทรนเนอร์:
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {session.sessionNotes}
                </div>
              </div>
            )}

            {/* Quick workout preview */}
            {session.workoutPlan && session.workoutPlan.mainWorkout && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  💪 แผนการเทรน:
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {session.workoutPlan.mainWorkout.slice(0, 3).map((exercise, index) => (
                    <span key={index} style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-color)'
                    }}>
                      {exercise.name}
                    </span>
                  ))}
                  {session.workoutPlan.mainWorkout.length > 3 && (
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)'
                    }}>
                      +{session.workoutPlan.mainWorkout.length - 3} ท่า
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Session Results Preview */}
            {session.sessionReport && (
              <div style={{
                backgroundColor: 'rgba(72, 187, 120, 0.1)',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--success)', marginBottom: '0.5rem' }}>
                  🏆 ผลการประเมิน: {session.sessionReport.performance}
                </div>
                {session.sessionReport.measurements && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary)' }}>
                        {session.sessionReport.measurements.weight}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>น้ำหนัก (kg)</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--accent)' }}>
                        {session.sessionReport.measurements.bodyFat}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ไขมัน (%)</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--success)' }}>
                        {session.sessionReport.measurements.muscle}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>กล้ามเนื้อ (kg)</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => viewSession(session)}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--text-white)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  flex: windowWidth <= 768 ? '1' : 'auto'
                }}
              >
                ดูรายละเอียด
              </button>
              
              {session.status === 'confirmed' && (
                <button 
                  onClick={() => handleSessionReschedule(session.id, new Date())}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Calendar size={16} />
                  เลื่อนนัด
                </button>
              )}
              
              <button style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <MessageSquare size={16} />
                แชท
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProgress = () => (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          ความก้าวหน้า
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          ติดตามความก้าวหน้าของการออกกำลังกายและการเปลี่ยนแปลงของร่างกาย
        </p>
      </div>

      {/* Goals Progress */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          🎯 เป้าหมาย
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {progressData.goals.map((goal, index) => (
            <div key={index}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {goal.name}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {goal.current > 0 ? '+' : ''}{goal.current} / {goal.target > 0 ? '+' : ''}{goal.target} {goal.unit}
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
                  width: `${goal.progress}%`,
                  backgroundColor: 'var(--primary)',
                  borderRadius: '1rem',
                  transition: 'width 0.6s ease'
                }}></div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {goal.progress}% ของเป้าหมาย
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Measurements */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          📏 การวัดผลล่าสุด
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: '1rem'
        }}>
          {currentPlan && currentPlan.latestMeasurements && (
            <>
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                  {currentPlan.latestMeasurements.weight}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>น้ำหนัก (kg)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                  -2.5 kg
                </div>
              </div>
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
                  {currentPlan.latestMeasurements.bodyFat}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ไขมัน (%)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                  -1.8%
                </div>
              </div>
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
                  {currentPlan.latestMeasurements.muscle}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>กล้ามเนื้อ (kg)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                  +1.2 kg
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress Photos */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            📸 ความก้าวหน้าจากภาพ
          </h4>
          <button
            onClick={() => setShowProgressModal(true)}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            ดูทั้งหมด
          </button>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '1rem'
        }}>
          {progressData.photos.slice(0, 4).map((photo, index) => (
            <div key={index} style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{
                backgroundColor: 'var(--border-color)',
                borderRadius: '0.5rem',
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.5rem'
              }}>
                <Camera size={24} color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                {photo.description}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {new Date(photo.date).toLocaleDateString('th-TH')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Show loading state
  if (loading) {
    return (
      <div style={{ 
        padding: windowWidth <= 768 ? '1rem' : '2rem',
        backgroundColor: 'var(--bg-secondary)',
        minHeight: '100vh'
      }}>
        <LoadingSpinner />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{ 
        padding: windowWidth <= 768 ? '1rem' : '2rem',
        backgroundColor: 'var(--bg-secondary)',
        minHeight: '100vh'
      }}>
        <ErrorMessage message={error} onRetry={loadInitialData} />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: windowWidth <= 768 ? '1rem' : '2rem',
      backgroundColor: 'var(--bg-secondary)',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ 
              fontSize: windowWidth <= 768 ? '1.5rem' : '1.75rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              marginBottom: '0.5rem' 
            }}>
              แผนการเทรน
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              จัดการและติดตามแผนการออกกำลังกายของคุณ
            </p>
          </div>
          <button
            onClick={refreshData}
            disabled={refreshing}
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: refreshing ? 0.6 : 1
            }}
          >
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {windowWidth > 768 && 'รีเฟรช'}
          </button>
        </div>
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
              padding: '0.75rem 1.5rem',
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
              gap: '0.5rem'
            }}
          >
            <tab.icon size={16} />
            {windowWidth > 768 ? tab.label : tab.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'current' && renderCurrentPlan()}
        {activeTab === 'sessions' && renderSessions()}
        {activeTab === 'progress' && renderProgress()}
      </div>

      {/* Modals */}
      {renderSessionModal()}
      {renderProgressModal()}
    </div>
  );
};

export default ClientWorkoutPlan;