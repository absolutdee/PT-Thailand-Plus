import React from 'react';
import { 
  TrendingUp, TrendingDown, Users, Calendar, DollarSign, Clock,
  Activity, Target, Award, Star, AlertCircle, RefreshCw
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardOverview = ({ windowWidth, data, stats, todaySchedule, onRefresh, loading }) => {
  // Use props data with enhanced fallbacks for API integration
  const statsData = stats || {
    totalClients: 0,
    todaySessions: 0,
    monthlyRevenue: 0,
    pendingBookings: 0,
    upcomingSessions: 0,
    activeClients: 0,
    completionRate: 0
  };

  // Chart data - try to use real data first, then fallback to sample
  const revenueData = data?.revenueChart || [
    { month: 'ม.ค.', revenue: 45000 },
    { month: 'ก.พ.', revenue: 52000 },
    { month: 'มี.ค.', revenue: 48000 },
    { month: 'เม.ย.', revenue: 61000 },
    { month: 'พ.ค.', revenue: 58000 },
    { month: 'มิ.ย.', revenue: 67000 }
  ];

  const sessionsData = data?.sessionsChart || [
    { day: 'จ', sessions: 8 },
    { day: 'อ', sessions: 12 },
    { day: 'พ', sessions: 10 },
    { day: 'พฤ', sessions: 15 },
    { day: 'ศ', sessions: 9 },
    { day: 'ส', sessions: 14 },
    { day: 'อา', sessions: 6 }
  ];

  // Enhanced upcoming sessions with API data
  const upcomingSessions = todaySchedule?.length > 0 ? todaySchedule : [
    {
      id: 1,
      clientName: 'คุณสมชาย',
      time: '09:00',
      type: 'Personal Training',
      status: 'confirmed',
      avatar: 'S'
    },
    {
      id: 2,
      clientName: 'คุณแนน',
      time: '11:00',
      type: 'Weight Loss Program',
      status: 'pending',
      avatar: 'N'
    },
    {
      id: 3,
      clientName: 'คุณโจ',
      time: '14:00',
      type: 'Muscle Building',
      status: 'confirmed',
      avatar: 'J'
    }
  ];

  // Enhanced recent activities with API data
  const recentActivities = data?.recentActivities || [
    {
      id: 1,
      type: 'session',
      message: 'เซสชันกับคุณสมชายเสร็จสิ้น',
      time: '30 นาทีที่แล้ว',
      icon: Activity
    },
    {
      id: 2,
      type: 'payment',
      message: 'ได้รับการชำระเงินจากคุณแนน',
      time: '2 ชั่วโมงที่แล้ว',
      icon: DollarSign
    },
    {
      id: 3,
      type: 'review',
      message: 'คุณโจให้คะแนนรีวิว 5 ดาว',
      time: '1 วันที่แล้ว',
      icon: Star
    }
  ];

  // Loading State Component
  const LoadingCard = () => (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '120px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #f3f3f3',
        borderTop: '3px solid var(--accent)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );

  // Error State Component
  const ErrorCard = ({ message, onRetry }) => (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid var(--border-color)',
      textAlign: 'center'
    }}>
      <AlertCircle size={32} style={{ color: 'var(--danger)', marginBottom: '0.5rem' }} />
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          ลองอีกครั้ง
        </button>
      )}
    </div>
  );

  // Calculate trends for display
  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Get trend data from API or calculate from chart data
  const clientsTrend = data?.trends?.clients || '+2';
  const sessionsTrend = data?.trends?.sessions || (statsData.upcomingSessions > 0 ? `+${statsData.upcomingSessions}` : '0');
  const revenueTrend = data?.trends?.revenue || '+15.2';

  return (
    <div>
      {/* Header with refresh button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            สวัสดี, โค้ชมิกซ์
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            นี่คือภาพรวมการทำงานของคุณวันนี้
            {loading && <span style={{ color: 'var(--info)', marginLeft: '0.5rem' }}>🔄 กำลังอัพเดท...</span>}
          </p>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: loading ? 'var(--bg-secondary)' : 'var(--accent)',
            color: loading ? 'var(--text-muted)' : 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw 
            size={16} 
            style={{ 
              animation: loading ? 'spin 1s linear infinite' : 'none' 
            }} 
          />
          {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? 
          (windowWidth <= 480 ? '1fr' : 'repeat(2, 1fr)') : 
          'repeat(4, 1fr)',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Total Clients Card */}
        {loading ? <LoadingCard /> : (
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border-color)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: 'var(--text-white)',
              marginBottom: '1rem'
            }}>
              <Users size={24} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {statsData.totalClients}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>ลูกค้าทั้งหมด</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <TrendingUp size={16} style={{ color: 'var(--success)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>
                {clientsTrend.includes('+') ? clientsTrend : '+' + clientsTrend} คนใหม่
              </span>
            </div>
          </div>
        )}

        {/* Today Sessions Card */}
        {loading ? <LoadingCard /> : (
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border-color)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, var(--accent) 0%, #f56565 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: 'var(--text-white)',
              marginBottom: '1rem'
            }}>
              <Calendar size={24} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {statsData.todaySessions}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>เซสชันวันนี้</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Activity size={16} style={{ color: 'var(--info)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--info)', fontWeight: '600' }}>
                {statsData.upcomingSessions} กำลังจะมาถึง
              </span>
            </div>
          </div>
        )}

        {/* Monthly Revenue Card */}
        {loading ? <LoadingCard /> : (
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border-color)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, var(--success) 0%, #38a169 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: 'var(--text-white)',
              marginBottom: '1rem'
            }}>
              <DollarSign size={24} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              ฿{statsData.monthlyRevenue.toLocaleString()}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>รายได้เดือนนี้</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <TrendingUp size={16} style={{ color: 'var(--success)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>
                {revenueTrend.includes('+') ? revenueTrend : '+' + revenueTrend}%
              </span>
            </div>
          </div>
        )}

        {/* Pending Bookings Card */}
        {loading ? <LoadingCard /> : (
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border-color)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, var(--warning) 0%, #f6ad55 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: 'var(--text-white)',
              marginBottom: '1rem'
            }}>
              <Clock size={24} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {statsData.pendingBookings}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>รอการยืนยัน</div>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : '2fr 1fr',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Revenue Chart */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>รายได้รายเดือน</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <TrendingUp size={16} style={{ color: 'var(--success)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--success)', fontWeight: '600' }}>
                {revenueTrend.includes('+') ? revenueTrend : '+' + revenueTrend}%
              </span>
            </div>
          </div>
          <div style={{ padding: '1.5rem', height: '300px' }}>
            {loading ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%' 
              }}>
                <RefreshCw size={32} style={{ 
                  color: 'var(--text-muted)', 
                  animation: 'spin 1s linear infinite' 
                }} />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="month" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem'
                    }}
                    formatter={(value) => [`฿${value.toLocaleString()}`, 'รายได้']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--accent)" 
                    strokeWidth={3}
                    dot={{ fill: 'var(--accent)', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Sessions This Week */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>เซสชันสัปดาห์นี้</h3>
          </div>
          <div style={{ padding: '1.5rem', height: '300px' }}>
            {loading ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%' 
              }}>
                <RefreshCw size={32} style={{ 
                  color: 'var(--text-muted)', 
                  animation: 'spin 1s linear infinite' 
                }} />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="day" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem'
                    }}
                    formatter={(value) => [`${value} เซสชัน`, 'จำนวน']}
                  />
                  <Bar dataKey="sessions" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : '1fr 1fr',
        gap: '1.5rem'
      }}>
        {/* Upcoming Sessions */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>เซสชันที่กำลังจะมาถึง</h3>
            <button style={{
              fontSize: '0.875rem',
              color: 'var(--accent)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}>
              ดูทั้งหมด
            </button>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {loading ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '200px' 
              }}>
                <RefreshCw size={32} style={{ 
                  color: 'var(--text-muted)', 
                  animation: 'spin 1s linear infinite' 
                }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {upcomingSessions.slice(0, 3).map((session) => (
                  <div key={session.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-white)',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}>
                      {session.avatar || session.clientName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {session.clientName}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        {session.type}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {session.time}
                      </div>
                    </div>
                    <div style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: session.status === 'confirmed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: session.status === 'confirmed' ? 'var(--success)' : 'var(--warning)'
                    }}>
                      {session.status === 'confirmed' ? 'ยืนยัน' : 'รอยืนยัน'}
                    </div>
                  </div>
                ))}
                
                {upcomingSessions.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <Calendar size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p>ไม่มีเซสชันที่กำลังจะมาถึง</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>กิจกรรมล่าสุด</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {loading ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '200px' 
              }}>
                <RefreshCw size={32} style={{ 
                  color: 'var(--text-muted)', 
                  animation: 'spin 1s linear infinite' 
                }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentActivities.map((activity) => (
                  <div key={activity.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)'
                    }}>
                      <activity.icon size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {activity.message}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {activity.time}
                      </div>
                    </div>
                  </div>
                ))}
                
                {recentActivities.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <Activity size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p>ยังไม่มีกิจกรรมล่าสุด</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;