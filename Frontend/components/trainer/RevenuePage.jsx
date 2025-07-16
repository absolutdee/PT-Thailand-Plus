import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, Download, 
  Filter, Eye, Check, Clock, X, CreditCard, Banknote,
  PieChart, BarChart3, Receipt, Target, AlertCircle, Plus
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const RevenuePage = ({ windowWidth }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'transactions', 'analytics'
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Database states
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    avgSessionPrice: 0,
    totalSessions: 0,
    growthRate: 0
  });
  const [monthlyRevenueData, setMonthlyRevenueData] = useState([]);
  const [revenueByPackage, setRevenueByPackage] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all revenue data
  useEffect(() => {
    fetchRevenueData();
  }, [selectedPeriod]);

  const fetchRevenueData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchRevenueSummary(),
        fetchMonthlyRevenue(),
        fetchRevenueByPackage(),
        fetchTransactions()
      ]);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      setError('ไม่สามารถโหลดข้อมูลรายได้ได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueSummary = async () => {
    try {
      const response = await fetch(`/api/trainer/revenue/summary?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch revenue summary');
      }

      const data = await response.json();
      setRevenueData(data);
    } catch (error) {
      console.error('Error fetching revenue summary:', error);
      throw error;
    }
  };

  const fetchMonthlyRevenue = async () => {
    try {
      const response = await fetch(`/api/trainer/revenue/monthly?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch monthly revenue');
      }

      const data = await response.json();
      setMonthlyRevenueData(data);
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      throw error;
    }
  };

  const fetchRevenueByPackage = async () => {
    try {
      const response = await fetch(`/api/trainer/revenue/by-package?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch revenue by package');
      }

      const data = await response.json();
      setRevenueByPackage(data);
    } catch (error) {
      console.error('Error fetching revenue by package:', error);
      throw error;
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/trainer/transactions?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchRevenueData();
    } finally {
      setRefreshing(false);
    }
  };

  const exportTransactions = async () => {
    try {
      const response = await fetch(`/api/trainer/transactions/export?period=${selectedPeriod}&status=${filterStatus}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export transactions');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `transactions_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      alert('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  const exportRevenueReport = async () => {
    try {
      const response = await fetch(`/api/trainer/revenue/export?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export revenue report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `revenue_report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting revenue report:', error);
      alert('เกิดข้อผิดพลาดในการส่งออกรายงาน');
    }
  };

  const updateTransactionStatus = async (transactionId, newStatus) => {
    try {
      const response = await fetch(`/api/trainer/transactions/${transactionId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update transaction status');
      }

      // Refresh transactions data
      await fetchTransactions();
      await fetchRevenueSummary(); // Also refresh summary as it might be affected
    } catch (error) {
      console.error('Error updating transaction status:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filterStatus === 'all') return true;
    return transaction.status === filterStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'var(--success)';
      case 'pending':
        return 'var(--warning)';
      case 'failed':
        return 'var(--danger)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'สำเร็จ';
      case 'pending':
        return 'รอชำระ';
      case 'failed':
        return 'ล้มเหลว';
      default:
        return status;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'credit_card':
        return <CreditCard size={16} />;
      case 'bank_transfer':
        return <Banknote size={16} />;
      case 'cash':
        return <DollarSign size={16} />;
      default:
        return <DollarSign size={16} />;
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'credit_card':
        return 'บัตรเครดิต';
      case 'bank_transfer':
        return 'โอนเงิน';
      case 'cash':
        return 'เงินสด';
      default:
        return method;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          border: '3px solid var(--border-color)',
          borderTop: '3px solid var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูลรายได้...</p>
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
  }

  // Error state
  if (error) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        padding: '2rem',
        textAlign: 'center',
        border: '1px solid var(--danger)',
        margin: '2rem 0'
      }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
        <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>เกิดข้อผิดพลาด</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={fetchRevenueData}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--primary)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  const renderOverview = () => (
    <div>
      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? 
          (windowWidth <= 480 ? '1fr' : 'repeat(2, 1fr)') : 
          'repeat(4, 1fr)',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, var(--success) 0%, #38a169 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-white)'
            }}>
              <DollarSign size={24} />
            </div>
            <TrendingUp size={20} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            ฿{revenueData.totalRevenue.toLocaleString()}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            รายได้รวมเดือนนี้
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>
            {revenueData.growthRate > 0 ? '+' : ''}{revenueData.growthRate}% จากเดือนที่แล้ว
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, var(--warning) 0%, #f6ad55 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-white)'
            }}>
              <Clock size={24} />
            </div>
            <AlertCircle size={20} style={{ color: 'var(--warning)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            ฿{revenueData.pendingPayments.toLocaleString()}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            รอการชำระเงิน
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: '600' }}>
            {filteredTransactions.filter(t => t.status === 'pending').length} รายการ
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, var(--info) 0%, #4299e1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-white)'
            }}>
              <Target size={24} />
            </div>
            <TrendingUp size={20} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            ฿{revenueData.avgSessionPrice.toLocaleString()}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            ราคาเฉลี่ยต่อเซสชัน
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>
            +2.5% จากเดือนที่แล้ว
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, var(--accent) 0%, #f56565 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-white)'
            }}>
              <BarChart3 size={24} />
            </div>
            <TrendingUp size={20} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {revenueData.totalSessions}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            เซสชันรวมเดือนนี้
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>
            +12 เซสชันจากเดือนที่แล้ว
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : '2fr 1fr',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Revenue Trend */}
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
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              แนวโน้มรายได้
            </h3>
            <select style={{
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              fontSize: '0.875rem',
              outline: 'none'
            }}>
              <option value="revenue">รายได้</option>
              <option value="sessions">เซสชัน</option>
              <option value="avgPrice">ราคาเฉลี่ย</option>
            </select>
          </div>
          <div style={{ padding: '1.5rem', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem'
                  }}
                  formatter={(value, name) => [
                    name === 'revenue' ? `฿${value.toLocaleString()}` : value,
                    name === 'revenue' ? 'รายได้' : 'เซสชัน'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--success)" 
                  fill="var(--success)"
                  fillOpacity={0.2}
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Package */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              รายได้ตามแพคเกจ
            </h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ height: '200px', marginBottom: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={revenueByPackage}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {revenueByPackage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value}%`,
                      props.payload.name
                    ]}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {revenueByPackage.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '0.75rem',
                      height: '0.75rem',
                      borderRadius: '50%',
                      backgroundColor: item.color
                    }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {item.name}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      ฿{item.amount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {item.value}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
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
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            ธุรกรรมล่าสุด
          </h3>
          <button 
            onClick={() => setActiveTab('transactions')}
            style={{
              fontSize: '0.875rem',
              color: 'var(--accent)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            ดูทั้งหมด
          </button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} style={{
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
                  {transaction.clientAvatar || transaction.clientName.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {transaction.clientName}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    {transaction.package} • {transaction.sessions} เซสชัน
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {getPaymentMethodIcon(transaction.paymentMethod)}
                    <span>{getPaymentMethodText(transaction.paymentMethod)}</span>
                    <span>•</span>
                    <span>{new Date(transaction.date).toLocaleDateString('th-TH')} {transaction.time}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    ฿{transaction.amount.toLocaleString()}
                  </div>
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backgroundColor: transaction.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 
                                     transaction.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: getStatusColor(transaction.status)
                  }}>
                    {getStatusText(transaction.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div>
      {/* Filters */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border-color)',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: windowWidth <= 768 ? 'column' : 'row',
          alignItems: windowWidth <= 768 ? 'stretch' : 'center',
          gap: '1rem',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            ธุรกรรมทั้งหมด
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: windowWidth <= 480 ? 'column' : 'row',
            gap: '1rem'
          }}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="completed">สำเร็จ</option>
              <option value="pending">รอชำระ</option>
              <option value="failed">ล้มเหลว</option>
            </select>
            <button 
              onClick={exportTransactions}
              disabled={refreshing}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                backgroundColor: 'var(--accent)',
                color: 'var(--text-white)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: refreshing ? 0.6 : 1
              }}
            >
              <Download size={16} />
              ส่งออก
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div style={{ padding: '1.5rem' }}>
          {windowWidth > 768 ? (
            // Desktop Table
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      ลูกค้า
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      แพคเกจ
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      จำนวนเงิน
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      วิธีชำระ
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      สถานะ
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      วันที่
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-white)',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}>
                            {transaction.clientAvatar || transaction.clientName.charAt(0)}
                          </div>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                            {transaction.clientName}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                        <div>
                          <div style={{ fontWeight: '600' }}>{transaction.package}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {transaction.sessions} เซสชัน
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        ฿{transaction.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                          {getPaymentMethodIcon(transaction.paymentMethod)}
                          <span>{getPaymentMethodText(transaction.paymentMethod)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: transaction.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 
                                           transaction.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: getStatusColor(transaction.status)
                        }}>
                          {getStatusText(transaction.status)}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        <div>
                          <div>{new Date(transaction.date).toLocaleDateString('th-TH')}</div>
                          <div style={{ fontSize: '0.75rem' }}>{transaction.time}</div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button style={{
                            padding: '0.5rem',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Eye size={14} style={{ color: 'var(--text-secondary)' }} />
                          </button>
                          <button style={{
                            padding: '0.5rem',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Receipt size={14} style={{ color: 'var(--text-secondary)' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Mobile Cards
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-white)',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        {transaction.clientAvatar || transaction.clientName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {transaction.clientName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {transaction.transactionId}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: transaction.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 
                                       transaction.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: getStatusColor(transaction.status)
                    }}>
                      {getStatusText(transaction.status)}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        แพคเกจ
                      </div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {transaction.package}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        จำนวนเงิน
                      </div>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                        ฿{transaction.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getPaymentMethodIcon(transaction.paymentMethod)}
                      <span>{getPaymentMethodText(transaction.paymentMethod)}</span>
                    </div>
                    <span>{new Date(transaction.date).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: windowWidth <= 768 ? 'column' : 'row',
          alignItems: windowWidth <= 768 ? 'stretch' : 'center',
          gap: '1rem',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            การวิเคราะห์รายได้
          </h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="week">สัปดาห์นี้</option>
              <option value="month">เดือนนี้</option>
              <option value="quarter">ไตรมาสนี้</option>
              <option value="year">ปีนี้</option>
            </select>
            <button 
              onClick={exportRevenueReport}
              disabled={refreshing}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                backgroundColor: 'var(--accent)',
                color: 'var(--text-white)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: refreshing ? 0.6 : 1
              }}
            >
              <Download size={16} />
              ส่งออกรายงาน
            </button>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Revenue Comparison */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? '1fr' : '1fr 1fr',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)'
            }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '1rem'
              }}>
                เปรียบเทียบรายได้
              </h4>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenueData}>
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
                    <Bar dataKey="revenue" fill="var(--success)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{
              padding: '1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)'
            }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '1rem'
              }}>
                ข้อมูลสถิติ
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '0.5rem'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>รายได้เฉลี่ยต่อเดือน</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                    ฿{monthlyRevenueData.length > 0 ? Math.round(monthlyRevenueData.reduce((acc, curr) => acc + curr.revenue, 0) / monthlyRevenueData.length).toLocaleString() : '0'}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '0.5rem'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>เดือนที่มีรายได้สูงสุด</span>
                  <span style={{ fontWeight: '700', color: 'var(--success)' }}>
                    {monthlyRevenueData.length > 0 ? 
                      monthlyRevenueData.reduce((max, curr) => curr.revenue > max.revenue ? curr : max, monthlyRevenueData[0]).month : 
                      'ไม่มีข้อมูล'
                    }
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '0.5rem'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>อัตราการเติบโต</span>
                  <span style={{ fontWeight: '700', color: revenueData.growthRate >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {revenueData.growthRate > 0 ? '+' : ''}{revenueData.growthRate}%
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '0.5rem'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>อัตราการชำระเงิน</span>
                  <span style={{ fontWeight: '700', color: 'var(--warning)' }}>
                    {transactions.length > 0 ? 
                      Math.round((transactions.filter(t => t.status === 'completed').length / transactions.length) * 100) : 0
                    }%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Forecast */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)'
          }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '1rem'
            }}>
              คาดการณ์รายได้
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
              gap: '1rem'
            }}>
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.5rem' }}>
                  ฿{Math.round(revenueData.totalRevenue * 1.07).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  คาดการณ์เดือนหน้า
                </div>
              </div>
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--info)', marginBottom: '0.5rem' }}>
                  ฿{Math.round(revenueData.totalRevenue * 3.1).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  คาดการณ์ไตรมาสหน้า
                </div>
              </div>
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '0.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '0.5rem' }}>
                  ฿{Math.round(revenueData.totalRevenue * 12).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  เป้าหมายรายได้ต่อปี
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{
        display: 'flex',
        flexDirection: windowWidth <= 768 ? 'column' : 'row',
        alignItems: windowWidth <= 768 ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            การเงินและรายได้
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            ติดตามและจัดการรายได้และธุรกรรมการเงิน
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--primary)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '0.875rem',
            opacity: refreshing ? 0.6 : 1
          }}
        >
          {refreshing ? 'กำลังรีเฟรช...' : 'รีเฟรชข้อมูล'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        marginBottom: '2rem',
        overflow: 'hidden'
      }}>
        {[
          { id: 'overview', label: 'ภาพรวม', icon: DollarSign },
          { id: 'transactions', label: 'ธุรกรรม', icon: Receipt },
          { id: 'analytics', label: 'การวิเคราะห์', icon: BarChart3 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '1rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: activeTab === tab.id ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-white)' : 'var(--text-secondary)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <tab.icon size={16} />
            {windowWidth > 480 ? tab.label : ''}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'transactions' && renderTransactions()}
      {activeTab === 'analytics' && renderAnalytics()}
    </div>
  );
};

export default RevenuePage;