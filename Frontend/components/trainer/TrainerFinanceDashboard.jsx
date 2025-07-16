import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Receipt, CreditCard,
  Calendar, Clock, CheckCircle, AlertTriangle, Download,
  Eye, EyeOff, RefreshCw, Settings, Mail, Phone, Building2,
  Target, Award, BarChart3, PieChart, Activity, Zap, FileText,
  Bell, Users, Calculator, Wallet, X, Copy, Check, Smartphone,
  Landmark, Shield, Lock, Info, Loader
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart } from 'recharts';

const TrainerFinanceDashboard = ({ windowWidth }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [accountSuspended, setAccountSuspended] = useState(false);
  const [selectedReportPeriod, setSelectedReportPeriod] = useState('month');
  const [paymentMethod, setPaymentMethod] = useState('promptpay');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1);
  const [copied, setCopied] = useState(false);

  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Data States
  const [trainerData, setTrainerData] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [periodData, setPeriodData] = useState({});
  const [monthlyData, setMonthlyData] = useState([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [billingHistory, setBillingHistory] = useState([]);

  // Get trainer ID from localStorage or context
  const trainerId = localStorage.getItem('trainerId') || 'current';

  // API Functions
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`/api/trainer/finance${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Fetch all financial data
  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch trainer profile data
      const trainerProfile = await apiCall(`/profile`);
      
      // Fetch financial summary
      const summary = await apiCall(`/summary`);
      
      // Fetch period data
      const periods = await apiCall(`/periods`);
      
      // Fetch monthly chart data
      const monthlyChartData = await apiCall(`/monthly-data`);
      
      // Fetch expense breakdown
      const expenses = await apiCall(`/expenses`);
      
      // Fetch recent transactions
      const transactions = await apiCall(`/transactions/recent?limit=5`);
      
      // Fetch billing history
      const billing = await apiCall(`/billing/history`);

      // Update states
      setTrainerData(trainerProfile.data);
      setFinancialSummary(summary.data);
      setPeriodData(periods.data);
      setMonthlyData(monthlyChartData.data);
      setExpenseBreakdown(expenses.data);
      setRecentTransactions(transactions.data);
      setBillingHistory(billing.data);
      setAccountSuspended(trainerProfile.data.status === 'suspended');

    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError(err.message);
      
      // Fallback to demo data on error
      loadDemoData();
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await fetchFinancialData();
    setRefreshing(false);
  };

  // Load demo data as fallback
  const loadDemoData = () => {
    setTrainerData({
      name: 'โค้ชแมท',
      email: 'matt@example.com',
      phone: '081-234-5678',
      registrationDate: '2024-01-15',
      status: 'active',
      serviceFeeRate: 0.10,
      vatRate: 0.07,
      billingDay: 25,
      paymentMethod: 'bank_transfer'
    });

    setFinancialSummary({
      thisMonth: {
        totalRevenue: 45000,
        totalSessions: 32,
        averagePerSession: 1406,
        serviceFees: 4500,
        vat: 3150,
        netIncome: 37350,
        growth: 12.5
      },
      lastMonth: {
        totalRevenue: 40000,
        totalSessions: 28,
        averagePerSession: 1429,
        serviceFees: 4000,
        vat: 2800,
        netIncome: 33200
      },
      outstanding: -7650,
      nextBillingDate: '2024-07-25',
      daysUntilBilling: 5
    });

    setPeriodData({
      month: {
        title: 'เดือนนี้',
        totalRevenue: 45000,
        totalSessions: 32,
        averagePerSession: 1406,
        serviceFees: 4500,
        vat: 3150,
        netIncome: 37350,
        growth: 12.5,
        chartData: [
          { period: 'สัปดาห์ 1', revenue: 10000, expenses: 1000, netIncome: 9000, sessions: 7 },
          { period: 'สัปดาห์ 2', revenue: 12000, expenses: 1200, netIncome: 10800, sessions: 8 },
          { period: 'สัปดาห์ 3', revenue: 11000, expenses: 1100, netIncome: 9900, sessions: 8 },
          { period: 'สัปดาห์ 4', revenue: 12000, expenses: 1200, netIncome: 10800, sessions: 9 }
        ]
      },
      quarter: {
        title: 'ไตรมาสนี้',
        totalRevenue: 132000,
        totalSessions: 89,
        averagePerSession: 1483,
        serviceFees: 13200,
        vat: 9240,
        netIncome: 109560,
        growth: 18.2,
        chartData: [
          { period: 'เม.ย.', revenue: 42000, expenses: 4200, netIncome: 37800, sessions: 28 },
          { period: 'พ.ค.', revenue: 45000, expenses: 4500, netIncome: 40500, sessions: 29 },
          { period: 'มิ.ย.', revenue: 45000, expenses: 4500, netIncome: 40500, sessions: 32 }
        ]
      },
      year: {
        title: 'ปีนี้',
        totalRevenue: 485000,
        totalSessions: 342,
        averagePerSession: 1418,
        serviceFees: 48500,
        vat: 33950,
        netIncome: 402550,
        growth: 22.8,
        chartData: [
          { period: 'ไตรมาส 1', revenue: 115000, expenses: 11500, netIncome: 103500, sessions: 82 },
          { period: 'ไตรมาส 2', revenue: 132000, expenses: 13200, netIncome: 118800, sessions: 89 },
          { period: 'ไตรมาส 3', revenue: 128000, expenses: 12800, netIncome: 115200, sessions: 86 },
          { period: 'ไตรมาส 4', revenue: 110000, expenses: 11000, netIncome: 99000, sessions: 85 }
        ]
      }
    });

    setMonthlyData([
      { month: 'ม.ค.', revenue: 38000, expenses: 3800, netIncome: 34200, sessions: 28 },
      { month: 'ก.พ.', revenue: 42000, expenses: 4200, netIncome: 37800, sessions: 30 },
      { month: 'มี.ค.', revenue: 39000, expenses: 3900, netIncome: 35100, sessions: 29 },
      { month: 'เม.ย.', revenue: 45000, expenses: 4500, netIncome: 40500, sessions: 33 },
      { month: 'พ.ค.', revenue: 40000, expenses: 4000, netIncome: 36000, sessions: 28 },
      { month: 'มิ.ย.', revenue: 45000, expenses: 4500, netIncome: 40500, sessions: 32 }
    ]);

    setExpenseBreakdown([
      { name: 'ค่าบริการแพลตฟอร์ม', value: 60, amount: 4500, color: '#ef4444' },
      { name: 'ภาษีมูลค่าเพิ่ม', value: 40, amount: 3150, color: '#f59e0b' }
    ]);

    setRecentTransactions([
      {
        id: 'TXN-001',
        date: '2024-06-24',
        customer: 'สมชาย ใจดี',
        package: 'Premium Package',
        amount: 8500,
        serviceFee: 850,
        vat: 595,
        netAmount: 7055,
        status: 'completed'
      },
      {
        id: 'TXN-002',
        date: '2024-06-22',
        customer: 'มานี สุขใจ',
        package: 'Standard Package',
        amount: 5200,
        serviceFee: 520,
        vat: 364,
        netAmount: 4316,
        status: 'completed'
      },
      {
        id: 'TXN-003',
        date: '2024-06-20',
        customer: 'วิชัย แข็งแรง',
        package: 'Basic Package',
        amount: 3200,
        serviceFee: 320,
        vat: 224,
        netAmount: 2656,
        status: 'completed'
      },
      {
        id: 'TXN-004',
        date: '2024-06-18',
        customer: 'นิดา สวยดี',
        package: 'Premium Package',
        amount: 8500,
        serviceFee: 850,
        vat: 595,
        netAmount: 7055,
        status: 'pending'
      },
      {
        id: 'TXN-005',
        date: '2024-06-16',
        customer: 'ปราชญ์ ฉลาด',
        package: 'Standard Package',
        amount: 5200,
        serviceFee: 520,
        vat: 364,
        netAmount: 4316,
        status: 'completed'
      }
    ]);

    setBillingHistory([
      {
        id: 'BILL-2024-06',
        period: 'มิถุนายน 2024',
        issueDate: '2024-06-25',
        dueDate: '2024-07-10',
        status: 'overdue',
        totalRevenue: 45000,
        serviceFee: 4500,
        vat: 3150,
        totalDue: 7650,
        daysOverdue: 16
      },
      {
        id: 'BILL-2024-05',
        period: 'พฤษภาคม 2024',
        issueDate: '2024-05-25',
        dueDate: '2024-06-10',
        status: 'paid',
        totalRevenue: 40000,
        serviceFee: 4000,
        vat: 2800,
        totalDue: 6800,
        paymentDate: '2024-06-08'
      },
      {
        id: 'BILL-2024-04',
        period: 'เมษายน 2024',
        issueDate: '2024-04-25',
        dueDate: '2024-05-10',
        status: 'paid',
        totalRevenue: 38000,
        serviceFee: 3800,
        vat: 2660,
        totalDue: 6460,
        paymentDate: '2024-05-05'
      }
    ]);
  };

  // Fetch new transactions by period
  const fetchTransactionsByPeriod = async (period) => {
    try {
      const transactions = await apiCall(`/transactions?period=${period}`);
      setRecentTransactions(transactions.data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  // Fetch period data when period changes
  const fetchPeriodData = async (period) => {
    try {
      const data = await apiCall(`/periods/${period}`);
      setPeriodData(prev => ({
        ...prev,
        [period]: data.data
      }));
    } catch (err) {
      console.error('Error fetching period data:', err);
    }
  };

  // Process payment
  const processPayment = async (paymentData) => {
    try {
      setIsProcessingPayment(true);
      
      const response = await apiCall('/payment/process', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });

      if (response.success) {
        // Refresh financial data after successful payment
        await fetchFinancialData();
        setShowPaymentModal(false);
        setPaymentStep(1);
        alert('ชำระเงินสำเร็จ! ระบบจะอัปเดตสถานะภายใน 24 ชั่วโมง');
      } else {
        throw new Error(response.message || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('เกิดข้อผิดพลาดในการชำระเงิน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Export financial report
  const exportFinancialReport = async (period) => {
    try {
      const response = await fetch(`/api/trainer/finance/export?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Export failed');
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('เกิดข้อผิดพลาดในการส่งออกรายงาน');
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchFinancialData();
  }, []);

  // Fetch period data when period changes
  useEffect(() => {
    if (selectedReportPeriod && periodData[selectedReportPeriod]) {
      fetchPeriodData(selectedReportPeriod);
    }
  }, [selectedReportPeriod]);

  // Helper functions
  const currentPeriodData = periodData[selectedReportPeriod] || {};
  const formatCurrency = (amount) => `฿${amount?.toLocaleString() || '0'}`;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': case 'paid': return 'var(--success)';
      case 'pending': return 'var(--warning)';
      case 'overdue': return 'var(--danger)';
      case 'processing': return 'var(--info)';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'สำเร็จ';
      case 'paid': return 'ชำระแล้ว';
      case 'pending': return 'รอดำเนินการ';
      case 'overdue': return 'เกินกำหนด';
      case 'processing': return 'กำลังดำเนินการ';
      default: return status;
    }
  };

  // Payment methods
  const paymentMethods = [
    {
      id: 'promptpay',
      name: 'พร้อมเพย์ (PromptPay)',
      icon: Smartphone,
      description: 'ชำระผ่าน QR Code หรือเบอร์โทรศัพท์',
      fee: 0,
      processingTime: 'ทันที'
    },
    {
      id: 'bank_transfer',
      name: 'โอนธนาคาร',
      icon: Landmark,
      description: 'โอนเงินผ่านธนาคาร',
      fee: 15,
      processingTime: '1-2 วันทำการ'
    },
    {
      id: 'credit_card',
      name: 'บัตรเครดิต/เดบิต',
      icon: CreditCard,
      description: 'ชำระด้วยบัตรเครดิตหรือเดบิต',
      fee: 25,
      processingTime: 'ทันที'
    }
  ];

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayment = async () => {
    const selectedPaymentMethod = paymentMethods.find(method => method.id === paymentMethod);
    const totalAmount = parseFloat(paymentAmount) + (selectedPaymentMethod?.fee || 0);

    const paymentData = {
      amount: parseFloat(paymentAmount),
      method: paymentMethod,
      fee: selectedPaymentMethod?.fee || 0,
      totalAmount: totalAmount,
      billId: financialSummary?.outstanding < 0 ? 'BILL-2024-06' : null
    };

    await processPayment(paymentData);
  };

  // Loading Component
  const LoadingSpinner = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <Loader size={40} style={{ 
        color: 'var(--accent)', 
        animation: 'spin 1s linear infinite' 
      }} />
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        กำลังโหลดข้อมูลการเงิน...
      </div>
    </div>
  );

  // Error Component
  const ErrorMessage = () => (
    <div style={{
      padding: '2rem',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid var(--danger)',
      borderRadius: '1rem',
      textAlign: 'center',
      marginBottom: '2rem'
    }}>
      <AlertTriangle size={40} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
      <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--danger)', marginBottom: '0.5rem' }}>
        เกิดข้อผิดพลาดในการโหลดข้อมูล
      </div>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        {error}
      </div>
      <button
        onClick={refreshData}
        disabled={refreshing}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: 'var(--accent)',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          cursor: refreshing ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: '0 auto'
        }}
      >
        <RefreshCw size={16} style={{ 
          animation: refreshing ? 'spin 1s linear infinite' : 'none' 
        }} />
        {refreshing ? 'กำลังโหลด...' : 'ลองใหม่'}
      </button>
    </div>
  );

  // Account Status Banner Component
  const AccountStatusBanner = () => {
    if (!financialSummary) return null;
    
    return (
      <div style={{
        padding: '1.5rem',
        backgroundColor: accountSuspended ? 'rgba(239, 68, 68, 0.1)' : financialSummary.outstanding < 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
        border: `1px solid ${accountSuspended ? 'var(--danger)' : financialSummary.outstanding < 0 ? 'var(--warning)' : 'var(--success)'}`,
        borderRadius: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {accountSuspended ? (
            <AlertTriangle size={24} style={{ color: 'var(--danger)' }} />
          ) : financialSummary.outstanding < 0 ? (
            <Clock size={24} style={{ color: 'var(--warning)' }} />
          ) : (
            <CheckCircle size={24} style={{ color: 'var(--success)' }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {accountSuspended ? 'บัญชีถูกระงับ' : 
               financialSummary.outstanding < 0 ? 'มีค่าบริการค้างชำระ' : 'สถานะปกติ'}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {accountSuspended ? 'กรุณาติดต่อฝ่ายสนับสนุนเพื่อเปิดใช้งานบัญชี' :
               financialSummary.outstanding < 0 ? `ยอดค้างชำระ ${formatCurrency(Math.abs(financialSummary.outstanding))} ครบกำหนดชำระ ${financialSummary.nextBillingDate}` :
               'บัญชีของคุณอยู่ในสถานะปกติ สามารถใช้งานได้เต็มรูปแบบ'}
            </div>
          </div>
          {financialSummary.outstanding < 0 && !accountSuspended && (
            <button
              onClick={() => {
                setPaymentAmount(Math.abs(financialSummary.outstanding).toString());
                setShowPaymentModal(true);
              }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ชำระเงิน
            </button>
          )}
        </div>
      </div>
    );
  };

  // Enhanced Payment Modal Component
  const PaymentModal = () => {
    if (!showPaymentModal) return null;

    const selectedPaymentMethod = paymentMethods.find(method => method.id === paymentMethod);
    const totalAmount = parseFloat(paymentAmount) + (selectedPaymentMethod?.fee || 0);

    const renderPaymentStep = () => {
      switch (paymentStep) {
        case 1:
          return (
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
                ระบุจำนวนเงินที่ต้องการชำระ
              </h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  จำนวนเงิน (บาท)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="กรอกจำนวนเงิน"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              {financialSummary?.outstanding < 0 && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    ยอดค้างชำระปัจจุบัน
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent)' }}>
                    {formatCurrency(Math.abs(financialSummary.outstanding))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => setPaymentStep(2)}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: !paymentAmount || parseFloat(paymentAmount) <= 0 ? 'var(--text-muted)' : 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: !paymentAmount || parseFloat(paymentAmount) <= 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ถัดไป
                </button>
              </div>
            </div>
          );

        case 2:
          return (
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
                เลือกวิธีการชำระเงิน
              </h3>

              <div style={{ marginBottom: '1.5rem' }}>
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      style={{
                        padding: '1rem',
                        border: `2px solid ${paymentMethod === method.id ? 'var(--accent)' : 'var(--border-color)'}`,
                        borderRadius: '0.75rem',
                        marginBottom: '0.75rem',
                        cursor: 'pointer',
                        backgroundColor: paymentMethod === method.id ? 'rgba(223, 37, 40, 0.05)' : 'var(--bg-primary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <Icon size={24} style={{ color: paymentMethod === method.id ? 'var(--accent)' : 'var(--text-secondary)' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                            {method.name}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {method.description}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            ค่าธรรมเนียม: {method.fee === 0 ? 'ฟรี' : `฿${method.fee}`}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {method.processingTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>จำนวนเงิน</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(parseFloat(paymentAmount))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>ค่าธรรมเนียม</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {selectedPaymentMethod?.fee === 0 ? 'ฟรี' : `฿${selectedPaymentMethod?.fee}`}
                  </span>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>ยอดรวม</span>
                  <span style={{ fontWeight: '700', color: 'var(--accent)', fontSize: '1.125rem' }}>
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setPaymentStep(1)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={() => setPaymentStep(3)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          );

        case 3:
          return (
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
                ยืนยันการชำระเงิน
              </h3>

              {paymentMethod === 'promptpay' && (
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '200px',
                    height: '200px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '2px dashed var(--border-color)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                  }}>
                    QR Code PromptPay
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      หมายเลข PromptPay: 081-234-5678
                    </span>
                    <button
                      onClick={() => handleCopyToClipboard('0812345678')}
                      style={{
                        padding: '0.25rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--accent)'
                      }}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      ข้อมูลบัญชีปลายทาง
                    </h4>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      ธนาคาร: กสิกรไทย<br/>
                      ชื่อบัญชี: บริษัท ฟิทคอนเนค จำกัด<br/>
                      เลขที่บัญชี: 123-4-56789-0
                      <button
                        onClick={() => handleCopyToClipboard('1234567890')}
                        style={{
                          marginLeft: '0.5rem',
                          padding: '0.25rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--accent)'
                        }}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  รายละเอียดการชำระ
                </h4>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  วิธีการชำระ: {selectedPaymentMethod?.name}<br/>
                  จำนวนเงิน: {formatCurrency(parseFloat(paymentAmount))}<br/>
                  ค่าธรรมเนียม: {selectedPaymentMethod?.fee === 0 ? 'ฟรี' : formatCurrency(selectedPaymentMethod?.fee)}<br/>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    ยอดรวม: {formatCurrency(totalAmount)}
                  </strong>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                <Info size={16} style={{ color: 'var(--info)' }} />
                <div style={{ fontSize: '0.875rem', color: 'var(--info)' }}>
                  กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยันการชำระเงิน
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setPaymentStep(2)}
                  disabled={isProcessingPayment}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    cursor: isProcessingPayment ? 'not-allowed' : 'pointer'
                  }}
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={handlePayment}
                  disabled={isProcessingPayment}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: isProcessingPayment ? 'var(--text-muted)' : 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isProcessingPayment ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      กำลังดำเนินการ...
                    </>
                  ) : (
                    <>
                      <Shield size={16} />
                      ยืนยันการชำระ
                    </>
                  )}
                </button>
              </div>
            </div>
          );

        default:
          return null;
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
          padding: '2rem',
          borderRadius: '1rem',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative'
        }}>
          <button
            onClick={() => {
              setShowPaymentModal(false);
              setPaymentStep(1);
            }}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            <X size={20} />
          </button>

          {/* Progress Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  backgroundColor: step <= paymentStep ? 'var(--accent)' : 'var(--border-color)',
                  color: step <= paymentStep ? 'white' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {step}
                </div>
                {step < 3 && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: step < paymentStep ? 'var(--accent)' : 'var(--border-color)',
                    margin: '0 0.5rem'
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {renderPaymentStep()}
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  };

  // Render Overview Tab
  const renderOverview = () => {
    if (!financialSummary) return null;
    
    return (
      <div>
        <AccountStatusBanner />

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
              {formatCurrency(financialSummary.thisMonth.totalRevenue)}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              รายได้รวมเดือนนี้
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>
              +{financialSummary.thisMonth.growth}% จากเดือนที่แล้ว
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
                background: 'linear-gradient(135deg, var(--primary) 0%, #4c1d95 100%)',
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
              {formatCurrency(financialSummary.thisMonth.netIncome)}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              รายได้สุทธิ
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>
              หลังหักค่าบริการ
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
                background: 'linear-gradient(135deg, var(--info) 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-white)'
              }}>
                <Activity size={24} />
              </div>
              <TrendingUp size={20} style={{ color: 'var(--success)' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {financialSummary.thisMonth.totalSessions}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              เซสชั่นทั้งหมด
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>
              เฉลี่ย {formatCurrency(financialSummary.thisMonth.averagePerSession)}/เซสชั่น
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
                background: 'linear-gradient(135deg, var(--warning) 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-white)'
              }}>
                <Award size={24} />
              </div>
              {accountSuspended ? 
                <AlertTriangle size={20} style={{ color: 'var(--danger)' }} /> :
                <CheckCircle size={20} style={{ color: 'var(--success)' }} />
              }
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: accountSuspended ? 'var(--danger)' : 'var(--success)',
              marginBottom: '0.25rem'
            }}>
              {accountSuspended ? 'ระงับ' : 'ปกติ'}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              สถานะบัญชี
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {accountSuspended ? 'ติดต่อฝ่ายสนับสนุน' : 'ใช้งานได้ปกติ'}
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
              <button
                onClick={refreshData}
                disabled={refreshing}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                <RefreshCw size={16} style={{ 
                  animation: refreshing ? 'spin 1s linear infinite' : 'none' 
                }} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
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
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--success)" 
                    fill="var(--success)"
                    fillOpacity={0.2}
                    strokeWidth={3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="netIncome" 
                    stroke="var(--primary)" 
                    fill="var(--primary)"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Breakdown */}
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
                ค่าใช้จ่าย
              </h3>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ height: '200px', marginBottom: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseBreakdown.map((entry, index) => (
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
                {expenseBreakdown.map((item, index) => (
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
              รายการล่าสุด
            </h3>
            <button 
              onClick={() => setActiveTab('billing')}
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
              {recentTransactions.slice(0, 5).map((transaction) => (
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
                    {transaction.customer.charAt(2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {transaction.customer}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      {transaction.package} • {transaction.date}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {transaction.id}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {formatCurrency(transaction.amount)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--success)', marginBottom: '0.25rem' }}>
                      สุทธิ: {formatCurrency(transaction.netAmount)}
                    </div>
                    <div style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: transaction.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
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
  };

  // Render Billing Tab
  const renderBilling = () => (
    <div>
      <AccountStatusBanner />
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          ประวัติการเรียกเก็บเงิน
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => exportFinancialReport('billing')}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
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
      </div>

      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {billingHistory.map((bill, index) => (
          <div key={bill.id} style={{
            padding: '1.5rem',
            borderBottom: index < billingHistory.length - 1 ? '1px solid var(--border-color)' : 'none',
            backgroundColor: bill.status === 'overdue' ? 
              'rgba(239, 68, 68, 0.05)' : 'transparent'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                    {bill.period}
                  </h4>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: `color-mix(in srgb, ${getStatusColor(bill.status)} 15%, transparent)`,
                    color: getStatusColor(bill.status),
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {getStatusText(bill.status)}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  ออกใบแจ้งหนี้: {bill.issueDate} • ครบกำหนด: {bill.dueDate}
                </div>
                {bill.paymentDate && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--success)' }}>
                    ชำระเมื่อ: {bill.paymentDate}
                  </div>
                )}
                {bill.daysOverdue && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--danger)' }}>
                    เกินกำหนด: {bill.daysOverdue} วัน
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {formatCurrency(bill.totalDue)}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  จากรายได้ {formatCurrency(bill.totalRevenue)}
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  ค่าบริการ (10%)
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {formatCurrency(bill.serviceFee)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  ภาษีมูลค่าเพิ่ม (7%)
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {formatCurrency(bill.vat)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  ยอดรวมที่ต้องชำระ
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: bill.status === 'overdue' ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {formatCurrency(bill.totalDue)}
                </div>
              </div>
            </div>

            {bill.status === 'overdue' && (
              <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                <button
                  onClick={() => {
                    setPaymentAmount(bill.totalDue.toString());
                    setShowPaymentModal(true);
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ชำระเงิน
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Render Settings Tab
  const renderSettings = () => {
    if (!trainerData) return null;
    
    return (
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2rem' }}>
          ตั้งค่าการเงิน
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
          gap: '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            padding: '1.5rem',
            borderRadius: '1rem',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
              ข้อมูลการเรียกเก็บเงิน
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  อัตราค่าบริการ
                </label>
                <input
                  type="text"
                  value={`${trainerData.serviceFeeRate * 100}%`}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-muted)'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  อัตราภาษีมูลค่าเพิ่ม
                </label>
                <input
                  type="text"
                  value={`${trainerData.vatRate * 100}%`}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-muted)'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  วันเรียกเก็บเงิน
                </label>
                <input
                  type="text"
                  value={`วันที่ ${trainerData.billingDay} ของทุกเดือน`}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-muted)'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  วิธีการชำระเงิน
                </label>
                <select
                  value={trainerData.paymentMethod}
                  onChange={async (e) => {
                    try {
                      await apiCall('/profile/payment-method', {
                        method: 'PUT',
                        body: JSON.stringify({ paymentMethod: e.target.value })
                      });
                      setTrainerData(prev => ({ ...prev, paymentMethod: e.target.value }));
                    } catch (err) {
                      console.error('Failed to update payment method:', err);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-primary)'
                  }}
                >
                  <option value="bank_transfer">โอนธนาคาร</option>
                  <option value="promptpay">พร้อมเพย์</option>
                  <option value="credit_card">บัตรเครดิต</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-primary)',
            padding: '1.5rem',
            borderRadius: '1rem',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
              การติดต่อ
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={20} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>อีเมล:</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{trainerData.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Phone size={20} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>โทรศัพท์:</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{trainerData.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={20} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>สมัครเมื่อ:</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{trainerData.registrationDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Reports Tab
  const renderReports = () => {
    if (!currentPeriodData.title) return null;
    
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            รายงานทางการเงิน
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select 
              value={selectedReportPeriod}
              onChange={(e) => setSelectedReportPeriod(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="month">เดือนนี้</option>
              <option value="quarter">ไตรมาสนี้</option>
              <option value="year">ปีนี้</option>
            </select>
            <button 
              onClick={() => exportFinancialReport(selectedReportPeriod)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: 'var(--accent)',
                color: 'var(--text-white)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Download size={16} />
              ส่งออกรายงาน
            </button>
          </div>
        </div>

        {/* Period Summary Cards */}
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
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.5rem' }}>
              {formatCurrency(currentPeriodData.totalRevenue)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              รายได้รวม ({currentPeriodData.title})
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
              +{currentPeriodData.growth}% จาก{selectedReportPeriod === 'month' ? 'เดือนที่แล้ว' : selectedReportPeriod === 'quarter' ? 'ไตรมาสที่แล้ว' : 'ปีที่แล้ว'}
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.5rem' }}>
              {formatCurrency(currentPeriodData.netIncome)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              รายได้สุทธิ ({currentPeriodData.title})
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
              หลังหักค่าบริการและภาษี
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--info)', marginBottom: '0.5rem' }}>
              {currentPeriodData.totalSessions}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              เซสชั่นทั้งหมด ({currentPeriodData.title})
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--info)' }}>
              เฉลี่ย {formatCurrency(currentPeriodData.averagePerSession)}/เซสชั่น
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '0.5rem' }}>
              {formatCurrency(currentPeriodData.serviceFees + currentPeriodData.vat)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              ค่าใช้จ่ายรวม ({currentPeriodData.title})
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>
              ค่าบริการ + ภาษี
            </div>
          </div>
        </div>

        {/* Period Chart */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          marginBottom: '2rem'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              สรุป{currentPeriodData.title} ({selectedReportPeriod === 'month' ? 'รายสัปดาห์' : selectedReportPeriod === 'quarter' ? 'รายเดือน' : 'รายไตรมาส'})
            </h3>
          </div>
          <div style={{ padding: '1.5rem', height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={currentPeriodData.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="period" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem'
                  }}
                  formatter={(value, name) => {
                    if (name === 'sessions') {
                      return [value, 'เซสชั่น'];
                    }
                    return [`฿${value.toLocaleString()}`, name === 'revenue' ? 'รายได้รวม' : name === 'expenses' ? 'ค่าใช้จ่าย' : 'รายได้สุทธิ'];
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="var(--success)" name="รายได้รวม" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="var(--accent)" name="ค่าใช้จ่าย" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="netIncome" stroke="var(--primary)" strokeWidth={3} name="รายได้สุทธิ" />
                <Line type="monotone" dataKey="sessions" stroke="var(--info)" strokeWidth={2} name="เซสชั่น" yAxisId="right" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Insights */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          marginBottom: '2rem'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              ข้อมูลเชิงลึก{currentPeriodData.title}
            </h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
              gap: '1.5rem'
            }}>
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.5rem' }}>
                  {((currentPeriodData.netIncome / currentPeriodData.totalRevenue) * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  อัตรากำไรสุทธิ
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                  หลังหักค่าใช้จ่ายทั้งหมด
                </div>
              </div>

              <div style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--info)', marginBottom: '0.5rem' }}>
                  {Math.round(currentPeriodData.totalSessions / (selectedReportPeriod === 'month' ? 4 : selectedReportPeriod === 'quarter' ? 3 : 4))}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  เซสชั่นเฉลี่ยต่อ{selectedReportPeriod === 'month' ? 'สัปดาห์' : selectedReportPeriod === 'quarter' ? 'เดือน' : 'ไตรมาส'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--info)' }}>
                  {selectedReportPeriod === 'year' ? '+15% จากปีที่แล้ว' : '+8% จากช่วงก่อน'}
                </div>
              </div>

              <div style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--warning)', marginBottom: '0.5rem' }}>
                  {(((currentPeriodData.serviceFees + currentPeriodData.vat) / currentPeriodData.totalRevenue) * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  อัตราค่าใช้จ่าย
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>
                  เทียบกับรายได้รวม
                </div>
              </div>
            </div>

            {/* Period-specific insights */}
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--info)', marginBottom: '0.5rem' }}>
                💡 ข้อมูลเชิงลึก{currentPeriodData.title}
              </h4>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {selectedReportPeriod === 'month' && (
                  <div>
                    • รายได้เดือนนี้เพิ่มขึ้น {currentPeriodData.growth}% จากเดือนที่แล้ว แสดงถึงการเติบโตที่แข็งแกร่ง<br/>
                    • เซสชันเฉลี่ยต่อสัปดาห์อยู่ที่ {Math.round(currentPeriodData.totalSessions / 4)} เซสชัน ซึ่งเป็นระดับที่ดี<br/>
                    • อัตรากำไรสุทธิ {((currentPeriodData.netIncome / currentPeriodData.totalRevenue) * 100).toFixed(1)}% อยู่ในเกณฑ์ที่ยอมรับได้สำหรับธุรกิจบริการ
                  </div>
                )}
                {selectedReportPeriod === 'quarter' && (
                  <div>
                    • ไตรมาสนี้มีการเติบโต {currentPeriodData.growth}% เทียบกับไตรมาสที่แล้ว แสดงถึงเทรนด์ที่ดี<br/>
                    • รายได้เฉลี่ยต่อเดือนอยู่ที่ {formatCurrency(Math.round(currentPeriodData.totalRevenue / 3))} ซึ่งสูงกว่าเป้าหมาย<br/>
                    • จำนวนเซสชันมีแนวโน้มเพิ่มขึ้นอย่างต่อเนื่อง โดยเฉพาะในช่วงปลายไตรมาส
                  </div>
                )}
                {selectedReportPeriod === 'year' && (
                  <div>
                    • ปีนี้มีการเติบโต {currentPeriodData.growth}% จากปีที่แล้ว เป็นการเติบโตที่น่าประทับใจ<br/>
                    • รายได้รวมทั้งปีใกล้จะแตะหลัก 500,000 บาท ซึ่งเกินเป้าหมายที่วางไว้<br/>
                    • ไตรมาส 2 และ 3 มีผลงานโดดเด่นที่สุด ควรวิเคราะห์ปัจจัยที่ทำให้สำเร็จเพื่อนำไปขยายผล
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trend Comparison */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? '1fr' : '1fr 1fr',
          gap: '1.5rem'
        }}>
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
                แนวโน้มรายได้
              </h3>
            </div>
            <div style={{ padding: '1.5rem', height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentPeriodData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="period" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem'
                    }}
                    formatter={(value) => [`฿${value.toLocaleString()}`, 'รายได้']}
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
                จำนวนเซสชั่น
              </h3>
            </div>
            <div style={{ padding: '1.5rem', height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentPeriodData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="period" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem'
                    }}
                    formatter={(value) => [value, 'เซสชั่น']}
                  />
                  <Bar dataKey="sessions" fill="var(--info)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Show loading spinner while data is loading
  if (loading) return <LoadingSpinner />;
  
  // Show error message if there's an error
  if (error && !trainerData) return <ErrorMessage />;

  return (
    <div>
      {/* CSS Variables */}
      <style>{`
        :root {
          --primary: #232956;
          --accent: #df2528;
          --success: #10b981;
          --warning: #f59e0b;
          --danger: #ef4444;
          --info: #3b82f6;
          --bg-primary: #ffffff;
          --bg-secondary: #f8fafc;
          --text-primary: #1e293b;
          --text-secondary: #64748b;
          --text-muted: #94a3b8;
          --text-white: #ffffff;
          --border-color: #e2e8f0;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
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
            จัดการและติดตามการเงิน ค่าบริการ และการชำระเงิน
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <RefreshCw size={16} style={{ 
            animation: refreshing ? 'spin 1s linear infinite' : 'none' 
          }} />
          {refreshing ? 'กำลังอัปเดต...' : 'อัปเดตข้อมูล'}
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
          { id: 'billing', label: 'การเรียกเก็บ', icon: Receipt },
          { id: 'reports', label: 'รายงาน', icon: BarChart3 },
          { id: 'settings', label: 'ตั้งค่า', icon: Settings }
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
      {activeTab === 'billing' && renderBilling()}
      {activeTab === 'reports' && renderReports()}
      {activeTab === 'settings' && renderSettings()}

      <PaymentModal />
    </div>
  );
};

export default TrainerFinanceDashboard;