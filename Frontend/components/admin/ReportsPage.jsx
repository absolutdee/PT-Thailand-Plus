import React, { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, Download, 
  Calendar, Filter, Users, DollarSign, Target,
  Activity, Star, Clock, FileText, Eye, Loader
} from 'lucide-react';

const ReportsPage = ({ windowWidth }) => {
  const [reportType, setReportType] = useState('revenue');
  const [dateRange, setDateRange] = useState('this-month');
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'sessions', 'customers']);
  
  // Database states
  const [reportData, setReportData] = useState(null);
  const [topPerformers, setTopPerformers] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API functions
  const fetchReportData = async (type, range) => {
    try {
      const response = await fetch(`/api/admin/reports/${type}?range=${range}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching report data:', error);
      throw error;
    }
  };

  const fetchTopPerformers = async (range) => {
    try {
      const response = await fetch(`/api/admin/reports/top-performers?range=${range}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch top performers');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching top performers:', error);
      throw error;
    }
  };

  const fetchInsights = async (range) => {
    try {
      const response = await fetch(`/api/admin/reports/insights?range=${range}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching insights:', error);
      throw error;
    }
  };

  const exportReport = async (format) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/reports/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          reportType,
          dateRange,
          format
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `report_${reportType}_${dateRange}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      setError('ไม่สามารถส่งออกรายงานได้');
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts or parameters change
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [reportResult, performersResult, insightsResult] = await Promise.all([
          fetchReportData(reportType, dateRange),
          fetchTopPerformers(dateRange),
          fetchInsights(dateRange)
        ]);

        setReportData(reportResult);
        setTopPerformers(performersResult);
        setInsights(insightsResult);
      } catch (error) {
        setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [reportType, dateRange]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('th-TH').format(number);
  };

  const getChangeColor = (change) => {
    return change > 0 ? 'var(--success)' : change < 0 ? 'var(--danger)' : 'var(--text-muted)';
  };

  const getCurrentReport = () => {
    return reportData?.[reportType] || null;
  };

  const getIconForInsight = (type) => {
    switch (type) {
      case 'revenue': return TrendingUp;
      case 'sessions': return Activity;
      case 'rating': return Star;
      case 'time': return Clock;
      default: return Activity;
    }
  };

  const renderChart = () => {
    const report = getCurrentReport();
    
    if (!report) {
      return (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <Loader className="animate-spin" size={32} style={{ color: 'var(--info)', marginBottom: '1rem' }} />
          <div style={{ color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</div>
        </div>
      );
    }

    return (
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
            {report.title}
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

        {/* Mock Chart */}
        <div style={{
          height: '300px',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          marginBottom: '1.5rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <BarChart3 size={64} style={{ marginBottom: '1rem' }} />
            <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
              แผนภูมิ{report.title}
            </div>
            <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              ข้อมูล {report.data?.length || 0} ช่วงเวลา
            </div>
          </div>
        </div>

        {/* Data Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
          gap: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.5rem',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '0.25rem'
            }}>
              {reportType === 'revenue' ? formatCurrency(report.total) : formatNumber(report.total)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              รวมทั้งหมด
            </div>
          </div>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.5rem',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '0.25rem'
            }}>
              {reportType === 'revenue' ? formatCurrency(report.average) : formatNumber(report.average)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              เฉลี่ยต่อเดือน
            </div>
          </div>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.5rem',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: getChangeColor(report.lastChange || 0),
              marginBottom: '0.25rem'
            }}>
              {(report.lastChange || 0) > 0 ? '+' : ''}{report.lastChange || 0}%
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              การเปลี่ยนแปลง
            </div>
          </div>
        </div>
      </div>
    );
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
          รายงาน
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          สรุปผลการดำเนินงานและสถิติต่างๆ ของแพลตฟอร์ม
        </p>
      </div>

      {/* Report Controls */}
      <div style={{
        display: 'flex',
        flexDirection: windowWidth <= 768 ? 'column' : 'row',
        gap: '1rem',
        marginBottom: '2rem',
        alignItems: windowWidth <= 768 ? 'stretch' : 'center'
      }}>
        <div style={{ flex: 1 }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            ประเภทรายงาน
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              opacity: loading ? 0.7 : 1
            }}
          >
            <option value="revenue">รายงานรายได้</option>
            <option value="sessions">รายงานเซสชั่น</option>
            <option value="customers">รายงานลูกค้า</option>
            <option value="trainers">รายงานเทรนเนอร์</option>
          </select>
        </div>
        
        <div style={{ flex: 1 }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            ช่วงเวลา
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              opacity: loading ? 0.7 : 1
            }}
          >
            <option value="this-month">เดือนนี้</option>
            <option value="last-month">เดือนที่แล้ว</option>
            <option value="last-3-months">3 เดือนล่าสุด</option>
            <option value="last-6-months">6 เดือนล่าสุด</option>
            <option value="this-year">ปีนี้</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
          <button 
            onClick={() => exportReport('pdf')}
            disabled={loading}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--info)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? <Loader className="animate-spin" size={16} /> : <Download size={16} />}
            ส่งออก PDF
          </button>
          
          <button 
            onClick={() => exportReport('excel')}
            disabled={loading}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--success)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? <Loader className="animate-spin" size={16} /> : <FileText size={16} />}
            ส่งออก Excel
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div style={{ marginBottom: '2rem' }}>
        {renderChart()}
      </div>

      {/* Insights and Top Performers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : '1fr 1fr',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Key Insights */}
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
            ข้อมูลเชิงลึก
          </h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Loader className="animate-spin" size={32} style={{ color: 'var(--info)', marginBottom: '1rem' }} />
              <div style={{ color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</div>
            </div>
          ) : insights.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {insights.map((insight, index) => {
                const IconComponent = getIconForInsight(insight.icon);
                return (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '1rem',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '0.5rem'
                  }}>
                    <div style={{
                      backgroundColor: insight.type === 'positive' ? 'rgba(72, 187, 120, 0.1)' : 'rgba(66, 153, 225, 0.1)',
                      borderRadius: '50%',
                      padding: '0.5rem',
                      color: insight.type === 'positive' ? 'var(--success)' : 'var(--info)'
                    }}>
                      <IconComponent size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        marginBottom: '0.25rem'
                      }}>
                        {insight.title}
                      </h4>
                      <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.4',
                        margin: 0
                      }}>
                        {insight.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              ไม่มีข้อมูลเชิงลึกในขณะนี้
            </div>
          )}
        </div>

        {/* Top Performers */}
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
            อันดับผู้มีผลงานดีเด่น
          </h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Loader className="animate-spin" size={32} style={{ color: 'var(--info)', marginBottom: '1rem' }} />
              <div style={{ color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล...</div>
            </div>
          ) : topPerformers ? (
            <>
              {/* Trainers */}
              {topPerformers.trainers && topPerformers.trainers.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '1rem'
                  }}>
                    เทรนเนอร์ยอดเยี่ยม
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {topPerformers.trainers.slice(0, 3).map((trainer, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: index === 0 ? 'var(--warning)' : index === 1 ? 'var(--text-muted)' : 'var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-white)',
                          fontWeight: '600',
                          fontSize: '0.875rem'
                        }}>
                          {index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: 'var(--text-primary)'
                          }}>
                            {trainer.name}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)'
                          }}>
                            {trainer.period}
                          </div>
                        </div>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: 'var(--success)'
                        }}>
                          {formatCurrency(trainer.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Packages */}
              {topPerformers.packages && topPerformers.packages.length > 0 && (
                <div>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '1rem'
                  }}>
                    แพคเกจยอดนิยม
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {topPerformers.packages.map((pkg, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--info)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-white)',
                          fontWeight: '600',
                          fontSize: '0.875rem'
                        }}>
                          {index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: 'var(--text-primary)'
                          }}>
                            {pkg.name}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)'
                          }}>
                            {pkg.period}
                          </div>
                        </div>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: 'var(--info)'
                        }}>
                          {pkg.value} ยอดขาย
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              ไม่มีข้อมูลผู้มีผลงานดีเด่นในขณะนี้
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;