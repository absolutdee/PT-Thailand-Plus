import React, { useState, useEffect } from 'react';
import { 
  Users, Target, DollarSign, Calendar,
  TrendingUp, Activity, Clock, Award,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
  RefreshCw, AlertCircle, Loader
} from 'lucide-react';

// API Functions for database operations
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = {
  // Dashboard API
  dashboard: {
    getMetrics: async () => {
      const response = await fetch(`${API_BASE_URL}/dashboard/metrics`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    getActivities: async (limit = 10) => {
      const response = await fetch(`${API_BASE_URL}/dashboard/activities?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    },
    getTopTrainers: async (limit = 5) => {
      const response = await fetch(`${API_BASE_URL}/dashboard/top-trainers?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch top trainers');
      return response.json();
    },
    getQuickStats: async () => {
      const response = await fetch(`${API_BASE_URL}/dashboard/quick-stats`);
      if (!response.ok) throw new Error('Failed to fetch quick stats');
      return response.json();
    },
    getRevenueChart: async (period = '30days') => {
      const response = await fetch(`${API_BASE_URL}/dashboard/revenue-chart?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch revenue chart');
      return response.json();
    }
  }
};

const DashboardOverview = ({ windowWidth }) => {
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [trainersLoading, setTrainersLoading] = useState(false);

  // Data from database
  const [keyMetrics, setKeyMetrics] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [topTrainers, setTopTrainers] = useState([]);
  const [quickStats, setQuickStats] = useState({
    todaySessions: 0,
    averageRating: 0,
    onlineTrainers: 0,
    pendingApprovals: 0
  });
  const [revenueChart, setRevenueChart] = useState({
    data: [],
    period: '30days'
  });

  // Fetch all dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Main function to fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data concurrently
      const [metrics, activities, trainers, stats, revenue] = await Promise.all([
        api.dashboard.getMetrics().catch(err => {
          console.error('Error fetching metrics:', err);
          return getDefaultMetrics();
        }),
        api.dashboard.getActivities(4).catch(err => {
          console.error('Error fetching activities:', err);
          return [];
        }),
        api.dashboard.getTopTrainers(3).catch(err => {
          console.error('Error fetching trainers:', err);
          return [];
        }),
        api.dashboard.getQuickStats().catch(err => {
          console.error('Error fetching quick stats:', err);
          return getDefaultQuickStats();
        }),
        api.dashboard.getRevenueChart().catch(err => {
          console.error('Error fetching revenue chart:', err);
          return { data: [], period: '30days' };
        })
      ]);

      setKeyMetrics(metrics);
      setRecentActivities(activities);
      setTopTrainers(trainers);
      setQuickStats(stats);
      setRevenueChart(revenue);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('ไม่สามารถโหลดข้อมูลได้: ' + err.message);
      // Set default data on error
      setKeyMetrics(getDefaultMetrics());
      setQuickStats(getDefaultQuickStats());
    } finally {
      setLoading(false);
    }
  };

  // Individual fetch functions for specific sections
  const fetchMetrics = async () => {
    try {
      setMetricsLoading(true);
      const data = await api.dashboard.getMetrics();
      setKeyMetrics(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('ไม่สามารถโหลดข้อมูลหลักได้: ' + err.message);
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      const data = await api.dashboard.getActivities(4);
      setRecentActivities(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('ไม่สามารถโหลดกิจกรรมล่าสุดได้: ' + err.message);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const fetchTopTrainers = async () => {
    try {
      setTrainersLoading(true);
      const data = await api.dashboard.getTopTrainers(3);
      setTopTrainers(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching top trainers:', err);
      setError('ไม่สามารถโหลดข้อมูลเทรนเนอร์ยอดนิยมได้: ' + err.message);
    } finally {
      setTrainersLoading(false);
    }
  };

  // Default data functions (fallback when API fails)
  const getDefaultMetrics = () => [
    {
      title: 'สมาชิกทั้งหมด',
      value: '0',
      change: '+0%',
      icon: Users,
      color: 'var(--accent)',
      bgColor: 'rgba(223, 37, 40, 0.1)'
    },
    {
      title: 'เทรนเนอร์ใหม่',
      value: '0',
      change: '+0%',
      icon: Target,
      color: 'var(--success)',
      bgColor: 'rgba(72, 187, 120, 0.1)'
    },
    {
      title: 'รายได้รวม',
      value: '฿0',
      change: '+0%',
      icon: DollarSign,
      color: 'var(--info)',
      bgColor: 'rgba(66, 153, 225, 0.1)'
    },
    {
      title: 'เซสชั่นเสร็จสิ้น',
      value: '0',
      change: '+0%',
      icon: Calendar,
      color: 'var(--warning)',
      bgColor: 'rgba(237, 137, 54, 0.1)'
    }
  ];

  const getDefaultQuickStats = () => ({
    todaySessions: 0,
    averageRating: 0,
    onlineTrainers: 0,
    pendingApprovals: 0
  });

  // Helper function to format numbers
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper function to get relative time
  const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} วินาทีที่แล้ว`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
  };

  // Helper function to get activity icon
  const getActivityIcon = (type) => {
    switch (type) {
      case 'new_trainer':
      case 'new_user':
        return Users;
      case 'session_completed':
      case 'session_started':
        return Activity;
      case 'review':
      case 'rating':
        return Award;
      case 'payment':
      case 'subscription':
        return DollarSign;
      case 'package_purchased':
        return Target;
      default:
        return Clock;
    }
  };

  // Helper function to get activity color
  const getActivityColor = (type) => {
    switch (type) {
      case 'new_trainer':
      case 'new_user':
        return 'var(--success)';
      case 'session_completed':
      case 'session_started':
        return 'var(--info)';
      case 'review':
      case 'rating':
        return 'var(--warning)';
      case 'payment':
      case 'subscription':
      case 'package_purchased':
        return 'var(--accent)';
      default:
        return 'var(--text-muted)';
    }
  };

  // Error Message Component
  const ErrorMessage = ({ message, onDismiss }) => {
    if (!message) return null;

    return (
      <div style={{
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        padding: '1rem',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        border: '1px solid #fecaca',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          {message}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        )}
      </div>
    );
  };

  // Loading Spinner Component
  const LoadingSpinner = ({ size = 16 }) => (
    <Loader 
      size={size} 
      style={{ 
        animation: 'spin 1s linear infinite',
        color: 'var(--text-muted)'
      }} 
    />
  );

  // If initial loading, show loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: 'var(--text-muted)'
      }}>
        <LoadingSpinner size={48} />
        <div style={{ marginTop: '1rem', fontSize: '1.125rem' }}>
          กำลังโหลดข้อมูล...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem' 
      }}>
        <div>
          <h1 style={{ 
            fontSize: '1.75rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            marginBottom: '0.5rem' 
          }}>
            ภาพรวมระบบ
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            สถิติและข้อมูลสำคัญของแพลตฟอร์ม FitConnect
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          style={{
            padding: '0.75rem',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw size={16} style={{ 
            animation: loading ? 'spin 1s linear infinite' : 'none' 
          }} />
          {windowWidth > 768 && 'รีเฟรช'}
        </button>
      </div>

      {/* Error Message */}
      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(4, 1fr)',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {keyMetrics.map((metric, index) => (
          <div key={index} style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            position: 'relative'
          }}>
            {metricsLoading && (
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem'
              }}>
                <LoadingSpinner size={16} />
              </div>
            )}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: '1rem' 
            }}>
              <div style={{
                backgroundColor: metric.bgColor,
                borderRadius: '0.75rem',
                padding: '0.75rem',
                color: metric.color
              }}>
                <metric.icon size={24} />
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                fontSize: '0.75rem', 
                color: metric.change.startsWith('+') ? 'var(--success)' : 'var(--danger)',
                fontWeight: '600' 
              }}>
                {metric.change.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {metric.change}
              </div>
            </div>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              marginBottom: '0.25rem' 
            }}>
              {metric.value}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {metric.title}
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Analytics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : '2fr 1fr',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Revenue Chart */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '1.5rem' 
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              color: 'var(--text-primary)' 
            }}>
              รายได้รายเดือน
            </h3>
            <div style={{
              backgroundColor: 'rgba(66, 153, 225, 0.1)',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              color: 'var(--info)'
            }}>
              <BarChart3 size={20} />
            </div>
          </div>
          
          {/* Mock Chart - Replace with actual chart library */}
          <div style={{
            height: '200px',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <BarChart3 size={48} style={{ marginBottom: '0.5rem' }} />
              <div>แผนภูมิรายได้</div>
              {revenueChart.data.length > 0 && (
                <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  ข้อมูล {revenueChart.data.length} จุด
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            marginBottom: '1.5rem'
          }}>
            สถิติด่วน
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                เซสชั่นวันนี้
              </span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                {quickStats.todaySessions || 0}
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                คะแนนเฉลี่ย
              </span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                {quickStats.averageRating ? `${quickStats.averageRating}/5` : '0/5'}
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                เทรนเนอร์ออนไลน์
              </span>
              <span style={{ fontWeight: '600', color: 'var(--success)' }}>
                {quickStats.onlineTrainers || 0}
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                รอการอนุมัติ
              </span>
              <span style={{ fontWeight: '600', color: 'var(--warning)' }}>
                {quickStats.pendingApprovals || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities & Top Trainers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : '1fr 1fr',
        gap: '1.5rem'
      }}>
        {/* Recent Activities */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              color: 'var(--text-primary)',
              margin: 0
            }}>
              กิจกรรมล่าสุด
            </h3>
            {activitiesLoading && <LoadingSpinner size={16} />}
            {!activitiesLoading && (
              <button
                onClick={fetchActivities}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
                title="รีเฟรชกิจกรรม"
              >
                <RefreshCw size={16} />
              </button>
            )}
          </div>
          
          {activitiesLoading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
              color: 'var(--text-muted)'
            }}>
              <LoadingSpinner size={24} />
              <span style={{ marginLeft: '0.5rem' }}>กำลังโหลด...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  const activityColor = getActivityColor(activity.type);
                  
                  return (
                    <div key={activity.id} style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '0.75rem' 
                    }}>
                      <div style={{
                        backgroundColor: `${activityColor}20`,
                        borderRadius: '50%',
                        padding: '0.5rem',
                        color: activityColor,
                        minWidth: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <ActivityIcon size={16} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: '0.875rem', 
                          color: 'var(--text-primary)',
                          marginBottom: '0.25rem'
                        }}>
                          {activity.message || activity.description}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--text-muted)' 
                        }}>
                          {getRelativeTime(activity.createdAt || activity.time)}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: 'var(--text-muted)'
                }}>
                  ไม่มีกิจกรรมล่าสุด
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top Trainers */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              color: 'var(--text-primary)',
              margin: 0
            }}>
              เทรนเนอร์ยอดนิยม
            </h3>
            {trainersLoading && <LoadingSpinner size={16} />}
            {!trainersLoading && (
              <button
                onClick={fetchTopTrainers}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
                title="รีเฟรชเทรนเนอร์"
              >
                <RefreshCw size={16} />
              </button>
            )}
          </div>
          
          {trainersLoading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
              color: 'var(--text-muted)'
            }}>
              <LoadingSpinner size={24} />
              <span style={{ marginLeft: '0.5rem' }}>กำลังโหลด...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {topTrainers.length > 0 ? (
                topTrainers.map((trainer, index) => (
                  <div key={trainer.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem' 
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: trainer.avatar ? 'transparent' : 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-white)',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      backgroundImage: trainer.avatar ? `url(${trainer.avatar})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}>
                      {!trainer.avatar && (trainer.name ? trainer.name.charAt(0) : 'T')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        marginBottom: '0.25rem'
                      }}>
                        {trainer.name || `เทรนเนอร์ ${index + 1}`}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-secondary)' 
                      }}>
                        {trainer.sessions || 0} เซสชั่น · {trainer.rating || 0} ⭐
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600',
                      color: 'var(--success)'
                    }}>
                      {formatCurrency(trainer.revenue || 0)}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: 'var(--text-muted)'
                }}>
                  ไม่มีข้อมูลเทรนเนอร์
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;