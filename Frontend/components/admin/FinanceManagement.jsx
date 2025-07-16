import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, CreditCard,
  Search, Filter, Calendar, Download, Eye, 
  CheckCircle, Clock, XCircle, User, Target,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
  Wallet, Receipt, FileText, Activity
} from 'lucide-react';

const FinanceManagement = ({ windowWidth }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('this-month');
  
  // Database connected states
  const [transactions, setTransactions] = useState([]);
  const [financeData, setFinanceData] = useState({
    revenue: 0,
    revenueGrowth: 0,
    pending: 0,
    pendingGrowth: 0,
    fees: 0,
    feesGrowth: 0,
    profit: 0,
    profitGrowth: 0
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [topTrainers, setTopTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API call functions
  const fetchFinanceData = async () => {
    try {
      const response = await fetch('/api/trainer/finance/overview', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('trainer_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch finance data');
      }

      const data = await response.json();
      setFinanceData(data);
    } catch (err) {
      console.error('Error fetching finance data:', err);
      setError(err.message);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/trainer/transactions?status=${statusFilter}&date=${dateFilter}&search=${searchTerm}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('trainer_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/trainer/finance/payment-methods', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('trainer_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError(err.message);
    }
  };

  const fetchTopTrainers = async () => {
    try {
      const response = await fetch('/api/trainer/finance/top-trainers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('trainer_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch top trainers');
      }

      const data = await response.json();
      setTopTrainers(data.topTrainers || []);
    } catch (err) {
      console.error('Error fetching top trainers:', err);
      setError(err.message);
    }
  };

  const exportReport = async () => {
    try {
      const response = await fetch('/api/trainer/finance/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('trainer_token')}`
        },
        body: JSON.stringify({
          status: statusFilter,
          dateRange: dateFilter,
          search: searchTerm
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `finance-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('เกิดข้อผิดพลาดในการส่งออกรายงาน');
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchFinanceData(),
          fetchTransactions(),
          fetchPaymentMethods(),
          fetchTopTrainers()
        ]);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Refetch transactions when filters change
  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, dateFilter, searchTerm]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return '#10b981';
      case 'processing':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success':
        return 'สำเร็จ';
      case 'processing':
        return 'รอดำเนินการ';
      case 'failed':
        return 'ไม่สำเร็จ';
      default:
        return status;
    }
  };

  const getGrowthColor = (growth) => {
    return growth > 0 ? '#10b981' : '#ef4444';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH').format(amount);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: '#6b7280'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Activity size={48} style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
          <div>กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '0.5rem',
        padding: '1rem',
        margin: '1rem 0'
      }}>
        <div style={{ color: '#dc2626', fontWeight: '600' }}>
          เกิดข้อผิดพลาด: {error}
        </div>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          โหลดใหม่
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
          color: '#232956', 
          marginBottom: '0.5rem' 
        }}>
          จัดการการเงิน
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          ติดตามรายได้ รายจ่าย และธุรกรรมทางการเงินทั้งหมด
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(4, 1fr)',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* รายได้เดือนนี้ */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              color: '#10b981'
            }}>
              <DollarSign size={20} />
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: getGrowthColor(financeData.revenueGrowth),
              fontWeight: '600',
              marginLeft: 'auto'
            }}>
              {financeData.revenueGrowth > 0 ? '+' : ''}{financeData.revenueGrowth}%
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#232956', marginBottom: '0.25rem' }}>
            ฿{formatCurrency(financeData.revenue)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>รายได้เดือนนี้</div>
        </div>

        {/* รออนุมัติ */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              color: '#f59e0b'
            }}>
              <Clock size={20} />
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: getGrowthColor(financeData.pendingGrowth),
              fontWeight: '600',
              marginLeft: 'auto'
            }}>
              {financeData.pendingGrowth > 0 ? '+' : ''}{financeData.pendingGrowth}%
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#232956', marginBottom: '0.25rem' }}>
            ฿{formatCurrency(financeData.pending)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>รออนุมัติ</div>
        </div>

        {/* ค่าธรรมเนียม */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              color: '#3b82f6'
            }}>
              <CreditCard size={20} />
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: getGrowthColor(financeData.feesGrowth),
              fontWeight: '600',
              marginLeft: 'auto'
            }}>
              {financeData.feesGrowth > 0 ? '+' : ''}{financeData.feesGrowth}%
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#232956', marginBottom: '0.25rem' }}>
            ฿{formatCurrency(financeData.fees)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>ค่าธรรมเนียม</div>
        </div>

        {/* กำไรสุทธิ */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              backgroundColor: 'rgba(223, 37, 40, 0.1)',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              color: '#df2528'
            }}>
              <TrendingUp size={20} />
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: getGrowthColor(financeData.profitGrowth),
              fontWeight: '600',
              marginLeft: 'auto'
            }}>
              {financeData.profitGrowth > 0 ? '+' : ''}{financeData.profitGrowth}%
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#232956', marginBottom: '0.25rem' }}>
            ฿{formatCurrency(financeData.profit)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>กำไรสุทธิ</div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : '2fr 1fr',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Revenue Chart */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            color: '#232956',
            marginBottom: '1.5rem'
          }}>
            รายได้ 12 เดือนที่ผ่านมา
          </h3>
          
          {/* Mock Chart */}
          <div style={{
            height: '280px',
            backgroundColor: '#f9fafb',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            position: 'relative'
          }}>
            <div style={{ textAlign: 'center' }}>
              <BarChart3 size={48} style={{ marginBottom: '0.5rem' }} />
              <div>แผนภูมิรายได้รายเดือน</div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            color: '#232956',
            marginBottom: '1.5rem'
          }}>
            วิธีการชำระเงิน
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {paymentMethods.length > 0 ? paymentMethods.map((method, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '0.75rem 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: method.color
                  }}></div>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    color: '#232956',
                    fontWeight: '500'
                  }}>
                    {method.name}
                  </span>
                </div>
                <div style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600',
                  color: method.color
                }}>
                  {method.percentage}%
                </div>
              </div>
            )) : (
              <div style={{ 
                textAlign: 'center', 
                color: '#6b7280', 
                padding: '2rem 0' 
              }}>
                ไม่มีข้อมูลวิธีการชำระเงิน
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
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
            color: '#232956'
          }}>
            ธุรกรรมล่าสุด
          </h3>
          <button 
            onClick={exportReport}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Download size={16} />
            ส่งออกรายงาน
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  วันที่
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  ลูกค้า
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'left', 
                  fontWeight: '600', 
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  แพคเกจ
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'right', 
                  fontWeight: '600', 
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  ยอดเงิน
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'right', 
                  fontWeight: '600', 
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  ค่าธรรมเนียม
                </th>
                <th style={{ 
                  padding: '0.75rem', 
                  textAlign: 'center', 
                  fontWeight: '600', 
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  สถานะ
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? transactions.map((transaction, index) => (
                <tr key={transaction.id} style={{ 
                  borderBottom: index < transactions.length - 1 ? '1px solid #f3f4f6' : 'none' 
                }}>
                  <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                    {new Date(transaction.created_at).toLocaleDateString('th-TH')}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#232956', fontWeight: '500' }}>
                    {transaction.customer_name}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                    {transaction.package_name}
                  </td>
                  <td style={{ 
                    padding: '0.75rem', 
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#232956'
                  }}>
                    ฿{formatCurrency(transaction.amount)}
                  </td>
                  <td style={{ 
                    padding: '0.75rem', 
                    textAlign: 'right',
                    color: '#6b7280'
                  }}>
                    ฿{formatCurrency(transaction.fee || 0)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: `${getStatusColor(transaction.status)}20`,
                      color: getStatusColor(transaction.status),
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {getStatusText(transaction.status)}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ 
                    padding: '2rem', 
                    textAlign: 'center', 
                    color: '#6b7280' 
                  }}>
                    ไม่มีธุรกรรม
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceManagement;