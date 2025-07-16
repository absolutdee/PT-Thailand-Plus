import React, { useState, useRef, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Target, Activity, Heart, Zap,
  Calendar, Users, Download, Filter, Eye, BarChart3,
  Scale, Ruler, Percent, Award, Clock, ArrowUp, ArrowDown,
  Search, Bell, AlertTriangle, CheckCircle, XCircle,
  Mail, Phone, MapPin, Edit, Star, MessageSquare,
  Package, DollarSign, FileText, Share2, Printer,
  Plus, Minus, X, RefreshCw, Settings, Info, Save, Loader
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, ComposedChart, RadialBarChart, RadialBar, 
  ScatterChart, Scatter
} from 'recharts';

const TrackingPage = ({ windowWidth }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedClient, setSelectedClient] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGoal, setFilterGoal] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClientDetail, setSelectedClientDetail] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('attendance');
  const [chartType, setChartType] = useState('area');
  const downloadRef = useRef(null);

  // เพิ่ม state สำหรับการเชื่อมต่อฐานข้อมูล
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // State สำหรับข้อมูลจากฐานข้อมูล
  const [overviewData, setOverviewData] = useState({
    totalSessions: 0,
    completedSessions: 0,
    cancelledSessions: 0,
    attendanceRate: 0,
    avgRating: 0,
    clientRetention: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    newClients: 0,
    completionRate: 0
  });

  const [periodData, setPeriodData] = useState({
    month: {
      totalSessions: 0,
      attendanceRate: 0,
      avgRating: 0,
      clientRetention: 0,
      totalRevenue: 0,
      monthlyGrowth: 0,
      completionRate: 0,
      timeData: [],
      revenueData: []
    },
    quarter: {
      totalSessions: 0,
      attendanceRate: 0,
      avgRating: 0,
      clientRetention: 0,
      totalRevenue: 0,
      monthlyGrowth: 0,
      completionRate: 0,
      timeData: [],
      revenueData: []
    },
    year: {
      totalSessions: 0,
      attendanceRate: 0,
      avgRating: 0,
      clientRetention: 0,
      totalRevenue: 0,
      monthlyGrowth: 0,
      completionRate: 0,
      timeData: [],
      revenueData: []
    }
  });

  const [clientProgress, setClientProgress] = useState([]);
  const [monthlyProgress, setMonthlyProgress] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [goalAchievements, setGoalAchievements] = useState([]);

  // โหลดข้อมูลเมื่อ component mount และเมื่อเปลี่ยน selectedPeriod
  useEffect(() => {
    loadTrackingData();
  }, [selectedPeriod]);

  // API helper function
  const apiCall = async (url, method = 'GET', data = null) => {
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };

      if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`/api/trainer${url}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // โหลดข้อมูลติดตามผลจากฐานข้อมูล
  const loadTrackingData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // ดึงข้อมูลภาพรวม
      const overviewResponse = await apiCall(`/tracking/overview?period=${selectedPeriod}`);
      if (overviewResponse.success) {
        setOverviewData(overviewResponse.data);
      }

      // ดึงข้อมูลตามช่วงเวลา
      const periodResponse = await apiCall(`/tracking/period-data?period=${selectedPeriod}`);
      if (periodResponse.success) {
        setPeriodData(prev => ({
          ...prev,
          [selectedPeriod]: periodResponse.data
        }));
      }

      // ดึงข้อมูลลูกค้า
      const clientsResponse = await apiCall('/tracking/clients');
      if (clientsResponse.success) {
        setClientProgress(clientsResponse.data);
      }

      // ดึงข้อมูลความคืบหน้ารายเดือน
      const monthlyResponse = await apiCall('/tracking/monthly-progress');
      if (monthlyResponse.success) {
        setMonthlyProgress(monthlyResponse.data);
      }

      // ดึงข้อมูลรายได้
      const revenueResponse = await apiCall('/tracking/revenue');
      if (revenueResponse.success) {
        setRevenueData(revenueResponse.data);
      }

      // ดึงสถิติรายสัปดาห์
      const weeklyResponse = await apiCall('/tracking/weekly-stats');
      if (weeklyResponse.success) {
        setWeeklyStats(weeklyResponse.data);
      }

      // ดึงข้อมูลความสำเร็จตามเป้าหมาย
      const goalsResponse = await apiCall('/tracking/goal-achievements');
      if (goalsResponse.success) {
        setGoalAchievements(goalsResponse.data);
      }

    } catch (err) {
      console.error('Error loading tracking data:', err);
      setError('ไม่สามารถโหลดข้อมูลได้ กำลังใช้ข้อมูลตัวอย่าง');
      
      // ใช้ข้อมูลตัวอย่างเมื่อไม่สามารถดึงจาก API ได้
      loadDemoData();
    } finally {
      setIsLoading(false);
    }
  };

  // โหลดข้อมูลตัวอย่าง (fallback)
  const loadDemoData = () => {
    setOverviewData({
      totalSessions: 156,
      completedSessions: 142,
      cancelledSessions: 14,
      attendanceRate: 91,
      avgRating: 4.7,
      clientRetention: 85,
      totalRevenue: 234000,
      monthlyGrowth: 12,
      newClients: 5,
      completionRate: 93
    });

    setPeriodData({
      month: {
        totalSessions: 156,
        attendanceRate: 91,
        avgRating: 4.7,
        clientRetention: 85,
        totalRevenue: 234000,
        monthlyGrowth: 12,
        completionRate: 93,
        timeData: [
          { period: 'สัปดาห์ 1', sessions: 35, attendance: 89, revenue: 52000, satisfaction: 4.5 },
          { period: 'สัปดาห์ 2', sessions: 42, attendance: 92, revenue: 61000, satisfaction: 4.6 },
          { period: 'สัปดาห์ 3', sessions: 38, attendance: 88, revenue: 58000, satisfaction: 4.4 },
          { period: 'สัปดาห์ 4', sessions: 41, attendance: 95, revenue: 63000, satisfaction: 4.8 }
        ],
        revenueData: [
          { period: 'สัปดาห์ 1', revenue: 52000, commission: 5200, net: 46800 },
          { period: 'สัปดาห์ 2', revenue: 61000, commission: 6100, net: 54900 },
          { period: 'สัปดาห์ 3', revenue: 58000, commission: 5800, net: 52200 },
          { period: 'สัปดาห์ 4', revenue: 63000, commission: 6300, net: 56700 }
        ]
      },
      quarter: {
        totalSessions: 456,
        attendanceRate: 89,
        avgRating: 4.6,
        clientRetention: 88,
        totalRevenue: 678000,
        monthlyGrowth: 15,
        completionRate: 91,
        timeData: [
          { period: 'เม.ย.', sessions: 142, attendance: 87, revenue: 210000, satisfaction: 4.4 },
          { period: 'พ.ค.', sessions: 156, attendance: 91, revenue: 234000, satisfaction: 4.7 },
          { period: 'มิ.ย.', sessions: 158, attendance: 89, revenue: 234000, satisfaction: 4.7 }
        ],
        revenueData: [
          { period: 'เม.ย.', revenue: 210000, commission: 21000, net: 189000 },
          { period: 'พ.ค.', revenue: 234000, commission: 23400, net: 210600 },
          { period: 'มิ.ย.', revenue: 234000, commission: 23400, net: 210600 }
        ]
      },
      year: {
        totalSessions: 1824,
        attendanceRate: 87,
        avgRating: 4.5,
        clientRetention: 92,
        totalRevenue: 2890000,
        monthlyGrowth: 18,
        completionRate: 89,
        timeData: [
          { period: 'ไตรมาส 1', sessions: 420, attendance: 85, revenue: 650000, satisfaction: 4.3 },
          { period: 'ไตรมาส 2', sessions: 456, attendance: 89, revenue: 678000, satisfaction: 4.6 },
          { period: 'ไตรมาส 3', sessions: 478, attendance: 87, revenue: 720000, satisfaction: 4.5 },
          { period: 'ไตรมาส 4', sessions: 470, attendance: 87, revenue: 842000, satisfaction: 4.6 }
        ],
        revenueData: [
          { period: 'ไตรมาส 1', revenue: 650000, commission: 65000, net: 585000 },
          { period: 'ไตรมาส 2', revenue: 678000, commission: 67800, net: 610200 },
          { period: 'ไตรมาส 3', revenue: 720000, commission: 72000, net: 648000 },
          { period: 'ไตรมาส 4', revenue: 842000, commission: 84200, net: 757800 }
        ]
      }
    });

    setMonthlyProgress([
      { month: 'ม.ค.', sessions: 32, attendance: 89, revenue: 45000, newClients: 2, satisfaction: 4.5 },
      { month: 'ก.พ.', sessions: 38, attendance: 92, revenue: 52000, newClients: 3, satisfaction: 4.6 },
      { month: 'มี.ค.', sessions: 35, attendance: 88, revenue: 48000, newClients: 1, satisfaction: 4.4 },
      { month: 'เม.ย.', sessions: 42, attendance: 95, revenue: 61000, newClients: 4, satisfaction: 4.8 },
      { month: 'พ.ค.', sessions: 39, attendance: 91, revenue: 58000, newClients: 2, satisfaction: 4.7 },
      { month: 'มิ.ย.', sessions: 45, attendance: 93, revenue: 67000, newClients: 3, satisfaction: 4.7 }
    ]);

    setRevenueData([
      { month: 'ม.ค.', revenue: 45000, commission: 4500, net: 40500 },
      { month: 'ก.พ.', revenue: 52000, commission: 5200, net: 46800 },
      { month: 'มี.ค.', revenue: 48000, commission: 4800, net: 43200 },
      { month: 'เม.ย.', revenue: 61000, commission: 6100, net: 54900 },
      { month: 'พ.ค.', revenue: 58000, commission: 5800, net: 52200 },
      { month: 'มิ.ย.', revenue: 67000, commission: 6700, net: 60300 }
    ]);

    setClientProgress([
      {
        id: 1,
        name: 'คุณสมชาย ใจดี',
        avatar: 'S',
        email: 'somchai@email.com',
        phone: '081-234-5678',
        age: 35,
        goal: 'ลดน้ำหนัก',
        package: 'แพคเกจลดน้ำหนัก Premium',
        packagePrice: 15000,
        startDate: '2024-01-15',
        endDate: '2024-04-15',
        startWeight: 85,
        currentWeight: 78,
        targetWeight: 70,
        weightLoss: 7,
        bodyFat: 18,
        muscleMass: 65,
        sessionsCompleted: 8,
        totalSessions: 12,
        progressPercentage: 67,
        trend: 'improving',
        lastSession: '2024-06-28',
        nextSession: '2024-07-02',
        rating: 4.8,
        totalPaid: 15000,
        status: 'active',
        notes: 'ลูกค้าใหม่ที่มีแรงจูงใจสูง ควรเน้นการออกกำลังกายแบบคาร์ดิโอ',
        address: '123/45 ถนนสุขุมวิท กรุงเทพ 10110',
        emergencyContact: 'คุณสมหญิง (ภรรยา) 081-111-1111',
        medicalHistory: 'ไม่มีประวัติการเจ็บป่วย',
        bodyComposition: [
          { date: '2024-01', weight: 85, bodyFat: 25, muscleMass: 60 },
          { date: '2024-02', weight: 83, bodyFat: 23, muscleMass: 62 },
          { date: '2024-03', weight: 81, bodyFat: 21, muscleMass: 63 },
          { date: '2024-04', weight: 79, bodyFat: 19, muscleMass: 64 },
          { date: '2024-05', weight: 78, bodyFat: 18, muscleMass: 65 }
        ],
        workoutHistory: [
          { date: '2024-06-28', type: 'คาร์ดิโอ', duration: 45, calories: 380, rating: 5 },
          { date: '2024-06-26', type: 'ยกน้ำหนัก', duration: 50, calories: 320, rating: 4 },
          { date: '2024-06-24', type: 'HIIT', duration: 30, calories: 450, rating: 5 }
        ]
      },
      {
        id: 2,
        name: 'คุณแนน สวยงาม',
        avatar: 'N',
        email: 'nan@email.com',
        phone: '081-987-6543',
        age: 28,
        goal: 'เพิ่มกล้ามเนื้อ',
        package: 'แพคเกจเพิ่มกล้ามเนื้อ',
        packagePrice: 12000,
        startDate: '2024-02-01',
        endDate: '2024-04-01',
        startWeight: 55,
        currentWeight: 58,
        targetWeight: 62,
        weightGain: 3,
        bodyFat: 22,
        muscleMass: 42,
        sessionsCompleted: 6,
        totalSessions: 8,
        progressPercentage: 75,
        trend: 'improving',
        lastSession: '2024-06-29',
        nextSession: '2024-07-01',
        rating: 4.6,
        totalPaid: 12000,
        status: 'active',
        notes: 'มีความมุ่งมั่นสูง ต้องเน้นการเพิ่มปริมาณโปรตีน',
        address: '456/78 ถนนพหลโยธิน กรุงเทพ 10400',
        emergencyContact: 'คุณนาน (พี่สาว) 081-222-2222',
        medicalHistory: 'แพ้ถั่วลิสง',
        bodyComposition: [
          { date: '2024-02', weight: 55, bodyFat: 25, muscleMass: 38 },
          { date: '2024-03', weight: 56, bodyFat: 24, muscleMass: 39 },
          { date: '2024-04', weight: 57, bodyFat: 23, muscleMass: 40 },
          { date: '2024-05', weight: 58, bodyFat: 22, muscleMass: 42 }
        ],
        workoutHistory: [
          { date: '2024-06-29', type: 'ยกน้ำหนัก', duration: 60, calories: 280, rating: 5 },
          { date: '2024-06-27', type: 'ฟังก์ชันนัล', duration: 45, calories: 250, rating: 4 },
          { date: '2024-06-25', type: 'ยกน้ำหนัก', duration: 60, calories: 290, rating: 5 }
        ]
      },
      {
        id: 3,
        name: 'คุณโจ แข็งแรง',
        avatar: 'J',
        email: 'joe@email.com',
        phone: '081-555-1234',
        age: 42,
        goal: 'ฟื้นฟูร่างกาย',
        package: 'แพคเกจฟื้นฟูและบำบัด',
        packagePrice: 18000,
        startDate: '2024-01-01',
        endDate: '2024-06-01',
        startWeight: 72,
        currentWeight: 72,
        targetWeight: 72,
        recovery: 85,
        flexibility: 78,
        strength: 82,
        sessionsCompleted: 10,
        totalSessions: 12,
        progressPercentage: 83,
        trend: 'stable',
        lastSession: '2024-06-27',
        nextSession: '2024-07-03',
        rating: 4.9,
        totalPaid: 18000,
        status: 'active',
        notes: 'มีประวัติอาการบาดเจ็บที่หลัง ต้องระมัดระวังในการออกแรง',
        address: '789/12 ถนนลาดพร้าว กรุงเทพ 10230',
        emergencyContact: 'คุณจิน (ลูกชาย) 081-333-3333',
        medicalHistory: 'ประวัติอาการบาดเจ็บกระดูกสันหลัง, กรดไหลย้อน',
        bodyComposition: [
          { date: '2024-01', weight: 72, bodyFat: 20, muscleMass: 55 },
          { date: '2024-02', weight: 72, bodyFat: 19, muscleMass: 56 },
          { date: '2024-03', weight: 72, bodyFat: 18, muscleMass: 57 },
          { date: '2024-04', weight: 72, bodyFat: 18, muscleMass: 57 },
          { date: '2024-05', weight: 72, bodyFat: 17, muscleMass: 58 }
        ],
        workoutHistory: [
          { date: '2024-06-27', type: 'ฟื้นฟู', duration: 45, calories: 180, rating: 5 },
          { date: '2024-06-25', type: 'โยคะ', duration: 60, calories: 120, rating: 5 },
          { date: '2024-06-23', type: 'ฟื้นฟู', duration: 45, calories: 170, rating: 4 }
        ]
      }
    ]);

    setWeeklyStats([
      { day: 'จ', sessions: 6, calories: 4200, revenue: 8500 },
      { day: 'อ', sessions: 8, calories: 5600, revenue: 12000 },
      { day: 'พ', sessions: 7, calories: 4900, revenue: 10500 },
      { day: 'พฤ', sessions: 9, calories: 6300, revenue: 13500 },
      { day: 'ศ', sessions: 6, calories: 4200, revenue: 9000 },
      { day: 'ส', sessions: 8, calories: 5600, revenue: 12000 },
      { day: 'อา', sessions: 4, calories: 2800, revenue: 6000 }
    ]);

    setGoalAchievements([
      { name: 'ลดน้ำหนัก', achieved: 12, total: 15, percentage: 80, color: '#10b981' },
      { name: 'เพิ่มกล้ามเนื้อ', achieved: 8, total: 10, percentage: 80, color: '#3b82f6' },
      { name: 'ฟื้นฟูร่างกาย', achieved: 5, total: 6, percentage: 83, color: '#f59e0b' },
      { name: 'บำรุงร่างกาย', achieved: 7, total: 8, percentage: 88, color: '#8b5cf6' }
    ]);
  };

  const currentPeriodData = periodData[selectedPeriod];

  // Filter clients based on search and filters
  const filteredClients = clientProgress.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    const matchesGoal = filterGoal === 'all' || client.goal === filterGoal;
    
    return matchesSearch && matchesStatus && matchesGoal;
  });

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp size={16} style={{ color: 'var(--success)' }} />;
      case 'declining':
        return <TrendingDown size={16} style={{ color: 'var(--danger)' }} />;
      default:
        return <Activity size={16} style={{ color: 'var(--warning)' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--success)';
      case 'inactive': return 'var(--warning)';
      case 'completed': return 'var(--info)';
      default: return 'var(--text-secondary)';
    }
  };

  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    try {
      setIsSaving(true);
      
      const reportData = {
        title: 'รายงานการติดตามผล',
        period: selectedPeriod,
        generatedAt: new Date().toLocaleString('th-TH'),
        summary: currentPeriodData,
        clients: filteredClients.length,
        revenue: currentPeriodData.totalRevenue
      };

      // เรียก API สำหรับสร้าง PDF
      const response = await apiCall('/tracking/export-pdf', 'POST', reportData);
      
      if (response.success) {
        // ดาวน์โหลดไฟล์ PDF
        const blob = new Blob([response.pdfData], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tracking-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setSuccessMessage('ส่งออกรายงาน PDF เรียบร้อย');
      }
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('ไม่สามารถส่งออกรายงาน PDF ได้');
      
      // Fallback: แสดงข้อความแทน
      alert('กำลังสร้างไฟล์ PDF... (ฟีเจอร์นี้จะเชื่อมต่อกับระบบสร้าง PDF จริงในการพัฒนาจริง)');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClientEdit = async (updatedClient) => {
    try {
      setIsSaving(true);
      setError(null);

      // บันทึกข้อมูลลูกค้าที่แก้ไข
      const response = await apiCall(`/tracking/clients/${updatedClient.id}`, 'PUT', updatedClient);
      
      if (response.success) {
        // อัปเดต state ในหน้า
        setClientProgress(prev => 
          prev.map(client => 
            client.id === updatedClient.id ? { ...client, ...updatedClient } : client
          )
        );
        
        setSuccessMessage('บันทึกข้อมูลลูกค้าเรียบร้อย');
        setShowEditModal(false);
        setEditingClient(null);
      }
    } catch (err) {
      console.error('Error updating client:', err);
      setError('ไม่สามารถบันทึกข้อมูลลูกค้าได้');
    } finally {
      setIsSaving(false);
    }
  };

  // Alert Component
  const Alert = ({ type, message, onClose }) => {
    if (!message) return null;
    
    const bgColor = type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)';
    const borderColor = type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)';
    const textColor = type === 'error' ? '#ef4444' : '#22c55e';
    const icon = type === 'error' ? <X size={16} /> : <CheckCircle size={16} />;

    return (
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 1000,
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '0.5rem',
        padding: '1rem',
        maxWidth: '400px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: textColor,
        fontSize: '0.875rem',
        fontWeight: '500'
      }}>
        {icon}
        {message}
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: textColor,
            cursor: 'pointer',
            marginLeft: '0.5rem'
          }}
        >
          <X size={16} />
        </button>
      </div>
    );
  };

  const EditClientModal = ({ client, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      name: client?.name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      age: client?.age || '',
      goal: client?.goal || '',
      package: client?.package || '',
      targetWeight: client?.targetWeight || '',
      notes: client?.notes || '',
      address: client?.address || '',
      emergencyContact: client?.emergencyContact || '',
      medicalHistory: client?.medicalHistory || ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave({ ...client, ...formData });
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
          borderRadius: '1rem',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              แก้ไขข้อมูลลูกค้า
            </h3>
            <button
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: 'var(--bg-secondary)',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.5 : 1
              }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
                  ชื่อ-นามสกุล
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    opacity: isSaving ? 0.5 : 1
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
                  อีเมล
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    opacity: isSaving ? 0.5 : 1
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    opacity: isSaving ? 0.5 : 1
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
                  อายุ
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})}
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    opacity: isSaving ? 0.5 : 1
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
                  เป้าหมาย
                </label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({...formData, goal: e.target.value})}
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    opacity: isSaving ? 0.5 : 1
                  }}
                  required
                >
                  <option value="">เลือกเป้าหมาย</option>
                  <option value="ลดน้ำหนัก">ลดน้ำหนัก</option>
                  <option value="เพิ่มกล้ามเนื้อ">เพิ่มกล้ามเนื้อ</option>
                  <option value="ฟื้นฟูร่างกาย">ฟื้นฟูร่างกาย</option>
                  <option value="บำรุงร่างกาย">บำรุงร่างกาย</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
                  น้ำหนักเป้าหมาย (kg)
                </label>
                <input
                  type="number"
                  value={formData.targetWeight}
                  onChange={(e) => setFormData({...formData, targetWeight: parseFloat(e.target.value)})}
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    opacity: isSaving ? 0.5 : 1
                  }}
                  step="0.1"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
                ที่อยู่
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                disabled={isSaving}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  opacity: isSaving ? 0.5 : 1
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
                ผู้ติดต่อฉุกเฉิน
              </label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                disabled={isSaving}
                placeholder="ชื่อ (ความสัมพันธ์) เบอร์โทร"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  opacity: isSaving ? 0.5 : 1
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
                ประวัติการเจ็บป่วย / แพ้อาหาร
              </label>
              <textarea
                value={formData.medicalHistory}
                onChange={(e) => setFormData({...formData, medicalHistory: e.target.value})}
                disabled={isSaving}
                placeholder="ระบุประวัติการเจ็บป่วย โรคประจำตัว หรือการแพ้อาหาร"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  minHeight: '80px',
                  resize: 'vertical',
                  opacity: isSaving ? 0.5 : 1
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
                หมายเหตุ
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                disabled={isSaving}
                placeholder="หมายเหตุเพิ่มเติมเกี่ยวกับลูกค้า"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  minHeight: '80px',
                  resize: 'vertical',
                  opacity: isSaving ? 0.5 : 1
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  opacity: isSaving ? 0.5 : 1
                }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--text-white)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: isSaving ? 0.5 : 1
                }}
              >
                {isSaving && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                <Save size={16} />
                บันทึก
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ClientDetailModal = ({ client, onClose }) => (
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
        borderRadius: '1rem',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-white)',
              fontSize: '1.25rem',
              fontWeight: '600'
            }}>
              {client.avatar}
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                {client.name}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {client.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: 'var(--bg-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Client Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Basic Info */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                ข้อมูลพื้นฐาน
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={16} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{client.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>อายุ {client.age} ปี</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Target size={16} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{client.goal}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={16} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{client.package}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{client.address}</span>
                </div>
              </div>
            </div>

            {/* Progress Stats */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                สถิติความคืบหน้า
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
                    {client.sessionsCompleted}/{client.totalSessions}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>เซสชันเสร็จ</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
                    {client.progressPercentage}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ความคืบหน้า</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <Star size={16} style={{ color: 'var(--warning)' }} />
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)' }}>
                      {client.rating}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>คะแนนเฉลี่ย</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--info)' }}>
                    ฿{client.totalPaid.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ยอดชำระ</div>
                </div>
              </div>
            </div>
          </div>

          {/* Medical & Emergency Info */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              ข้อมูลสุขภาพและการติดต่อฉุกเฉิน
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  ผู้ติดต่อฉุกเฉิน
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {client.emergencyContact}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  ประวัติการเจ็บป่วย
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {client.medicalHistory}
                </div>
              </div>
            </div>
          </div>

          {/* Body Composition Chart */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              การเปลี่ยนแปลงองค์ประกอบร่างกาย
            </h4>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={client.bodyComposition}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="weight" stroke="var(--primary)" strokeWidth={3} name="น้ำหนัก (kg)" />
                  <Line type="monotone" dataKey="bodyFat" stroke="var(--warning)" strokeWidth={2} name="ไขมัน (%)" />
                  <Bar dataKey="muscleMass" fill="var(--success)" name="กล้ามเนื้อ (kg)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Workouts */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              การเทรนล่าสุด
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {client.workoutHistory.map((workout, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {workout.type}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {workout.date} • {workout.duration} นาที • {workout.calories} kcal
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        style={{ 
                          color: i < workout.rating ? 'var(--warning)' : 'var(--border-color)',
                          fill: i < workout.rating ? 'var(--warning)' : 'transparent'
                        }} 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              หมายเหตุ
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {client.notes}
            </p>
          </div>

          {/* Action Button */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => {
                setEditingClient(client);
                setShowEditModal(true);
                onClose();
              }}
              disabled={isSaving}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                backgroundColor: 'var(--accent)',
                color: 'var(--text-white)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: isSaving ? 0.5 : 1
              }}
            >
              <Edit size={16} />
              แก้ไขข้อมูล
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ExportModal = ({ onClose }) => (
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
        borderRadius: '1rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            ส่งออกรายงาน
          </h3>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: 'var(--bg-secondary)',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.5 : 1
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
              รูปแบบไฟล์
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '2px solid var(--accent)',
                backgroundColor: 'var(--accent)',
                color: 'var(--text-white)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <FileText size={16} />
                PDF
              </button>
              <button style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '2px solid var(--border-color)',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <Download size={16} />
                CSV
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
              ช่วงเวลา
            </label>
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              disabled={isSaving}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '0.875rem',
                outline: 'none',
                opacity: isSaving ? 0.5 : 1
              }}
            >
              <option value="month">เดือนนี้</option>
              <option value="quarter">ไตรมาสนี้</option>
              <option value="year">ปีนี้</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
              ข้อมูลที่ต้องการ
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                'ข้อมูลภาพรวม',
                'ความคืบหน้าลูกค้า',
                'ข้อมูลรายได้',
                'สถิติการเข้าร่วม',
                'คะแนนความพึงพอใจ'
              ].map((item, index) => (
                <label key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)'
                }}>
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    disabled={isSaving}
                    style={{
                      width: '1rem',
                      height: '1rem',
                      accentColor: 'var(--accent)'
                    }}
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={onClose}
              disabled={isSaving}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                opacity: isSaving ? 0.5 : 1
              }}
            >
              ยกเลิก
            </button>
            <button
              onClick={() => {
                exportToPDF();
                onClose();
              }}
              disabled={isSaving}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                backgroundColor: 'var(--accent)',
                color: 'var(--text-white)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: isSaving ? 0.5 : 1
              }}
            >
              {isSaving && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              <Download size={16} />
              ส่งออก
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div>
      {/* Key Metrics */}
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
              <Target size={24} />
            </div>
            <ArrowUp size={20} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {overviewData.attendanceRate}%
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            อัตราเข้าร่วมเซสชัน
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>
            +5% จากเดือนที่แล้ว
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
              <Award size={24} />
            </div>
            <ArrowUp size={20} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {overviewData.avgRating}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            คะแนนเฉลี่ย
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>
            +0.3 จากเดือนที่แล้ว
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
              <Users size={24} />
            </div>
            <ArrowDown size={20} style={{ color: 'var(--danger)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {overviewData.clientRetention}%
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            อัตราการกลับมา
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: '600' }}>
            -2% จากเดือนที่แล้ว
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
              background: 'linear-gradient(135deg, var(--accent) 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-white)'
            }}>
              <DollarSign size={24} />
            </div>
            <ArrowUp size={20} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            ฿{(overviewData.totalRevenue / 1000).toFixed(0)}K
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            รายได้รวม
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>
            +{overviewData.monthlyGrowth}% จากเดือนที่แล้ว
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
        {/* Performance Chart */}
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
              ประสิทธิภาพรายเดือน
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              >
                <option value="attendance">อัตราเข้าร่วม</option>
                <option value="sessions">จำนวนเซสชัน</option>
                <option value="revenue">รายได้</option>
                <option value="satisfaction">ความพึงพอใจ</option>
              </select>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              >
                <option value="area">พื้นที่</option>
                <option value="line">เส้น</option>
                <option value="bar">แท่ง</option>
              </select>
            </div>
          </div>
          <div style={{ padding: '1.5rem', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={monthlyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="month" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke="var(--accent)" 
                    fill="var(--accent)"
                    fillOpacity={0.2}
                    strokeWidth={3}
                  />
                </AreaChart>
              ) : chartType === 'line' ? (
                <LineChart data={monthlyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="month" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke="var(--accent)" 
                    strokeWidth={3}
                    dot={{ fill: 'var(--accent)', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={monthlyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="month" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Bar dataKey={selectedMetric} fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Goal Achievements */}
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
              ความสำเร็จตามเป้าหมาย
            </h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {goalAchievements.map((goal, index) => (
                <div key={index} style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {goal.name}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {goal.achieved}/{goal.total}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '0.5rem',
                    backgroundColor: 'var(--border-color)',
                    borderRadius: '0.25rem',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${goal.percentage}%`,
                      height: '100%',
                      backgroundColor: goal.color,
                      borderRadius: '0.25rem'
                    }} />
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: goal.color,
                    fontWeight: '600',
                    marginTop: '0.25rem'
                  }}>
                    {goal.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue and Weekly Activity */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : '1fr 1fr',
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
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              รายได้รายเดือน
            </h3>
            <DollarSign size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ padding: '1.5rem', height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem'
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="var(--accent)" name="รายได้รวม" />
                <Line type="monotone" dataKey="net" stroke="var(--success)" strokeWidth={3} name="รายได้สุทธิ" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Activity */}
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
              กิจกรรมรายสัปดาห์
            </h3>
            <Activity size={20} style={{ color: 'var(--info)' }} />
          </div>
          <div style={{ padding: '1.5rem', height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="day" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem'
                  }}
                />
                <Bar dataKey="sessions" fill="var(--primary)" radius={[4, 4, 0, 0]} name="เซสชัน" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderClientProgress = () => (
    <div>
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
            ความคืบหน้าลูกค้า
          </h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '0.75rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)' 
                }} 
              />
              <input
                type="text"
                placeholder="ค้นหาลูกค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
                style={{
                  paddingLeft: '2.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  width: '200px',
                  opacity: isLoading ? 0.5 : 1
                }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              disabled={isLoading}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '0.875rem',
                outline: 'none',
                opacity: isLoading ? 0.5 : 1
              }}
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="active">ใช้งานอยู่</option>
              <option value="inactive">ไม่ใช้งาน</option>
              <option value="completed">เสร็จสิ้น</option>
            </select>
            <select
              value={filterGoal}
              onChange={(e) => setFilterGoal(e.target.value)}
              disabled={isLoading}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '0.875rem',
                outline: 'none',
                opacity: isLoading ? 0.5 : 1
              }}
            >
              <option value="all">เป้าหมายทั้งหมด</option>
              <option value="ลดน้ำหนัก">ลดน้ำหนัก</option>
              <option value="เพิ่มกล้ามเนื้อ">เพิ่มกล้ามเนื้อ</option>
              <option value="ฟื้นฟูร่างกาย">ฟื้นฟูร่างกาย</option>
            </select>
            <button 
              onClick={() => setShowExportModal(true)}
              disabled={isLoading || isSaving}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: (isLoading || isSaving) ? 'not-allowed' : 'pointer',
                backgroundColor: 'var(--accent)',
                color: 'var(--text-white)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: (isLoading || isSaving) ? 0.5 : 1
              }}
            >
              {isSaving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
              ส่งออกรายงาน
            </button>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {isLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'var(--text-secondary)'
            }}>
              <Loader size={48} style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
              <p>กำลังโหลดข้อมูลลูกค้า...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'var(--text-secondary)'
            }}>
              <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>ไม่พบลูกค้าที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '1.5rem'
            }}>
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  style={{
                    padding: '1.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px -8px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Client Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1.5rem'
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
                      fontSize: '1.25rem',
                      fontWeight: '600'
                    }}>
                      {client.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        marginBottom: '0.25rem'
                      }}>
                        {client.name}
                      </h4>
                      <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.5rem'
                      }}>
                        {client.goal} • {client.package}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getTrendIcon(client.trend)}
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: client.trend === 'improving' ? 'var(--success)' : 
                                 client.trend === 'declining' ? 'var(--danger)' : 'var(--warning)'
                        }}>
                          {client.trend === 'improving' ? 'ดีขึ้น' : 
                           client.trend === 'declining' ? 'ลดลง' : 'คงที่'}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          backgroundColor: getStatusColor(client.status),
                          color: 'var(--text-white)',
                          marginLeft: '0.5rem'
                        }}>
                          {client.status === 'active' ? 'ใช้งาน' : 
                           client.status === 'inactive' ? 'ไม่ใช้งาน' : 'เสร็จสิ้น'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    {client.goal === 'ลดน้ำหนัก' && (
                      <>
                        <div style={{
                          padding: '1rem',
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: '0.5rem',
                          textAlign: 'center'
                        }}>
                          <Scale size={20} style={{ color: 'var(--accent)', marginBottom: '0.5rem' }} />
                          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            -{client.weightLoss} kg
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            น้ำหนักลด
                          </div>
                        </div>
                        <div style={{
                          padding: '1rem',
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: '0.5rem',
                          textAlign: 'center'
                        }}>
                          <Percent size={20} style={{ color: 'var(--warning)', marginBottom: '0.5rem' }} />
                          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {client.bodyFat}%
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            ไขมัน
                          </div>
                        </div>
                      </>
                    )}

                    {client.goal === 'เพิ่มกล้ามเนื้อ' && (
                      <>
                        <div style={{
                          padding: '1rem',
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: '0.5rem',
                          textAlign: 'center'
                        }}>
                          <Scale size={20} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
                          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            +{client.weightGain} kg
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            น้ำหนักเพิ่ม
                          </div>
                        </div>
                        <div style={{
                          padding: '1rem',
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: '0.5rem',
                          textAlign: 'center'
                        }}>
                          <Activity size={20} style={{ color: 'var(--info)', marginBottom: '0.5rem' }} />
                          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {client.muscleMass} kg
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            กล้ามเนื้อ
                          </div>
                        </div>
                      </>
                    )}

                    {client.goal === 'ฟื้นฟูร่างกาย' && (
                      <>
                        <div style={{
                          padding: '1rem',
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: '0.5rem',
                          textAlign: 'center'
                        }}>
                          <Heart size={20} style={{ color: 'var(--success)', marginBottom: '0.5rem' }} />
                          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {client.recovery}%
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            การฟื้นฟู
                          </div>
                        </div>
                        <div style={{
                          padding: '1rem',
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: '0.5rem',
                          textAlign: 'center'
                        }}>
                          <Activity size={20} style={{ color: 'var(--info)', marginBottom: '0.5rem' }} />
                          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {client.flexibility}%
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            ความยืดหยุ่น
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Session Progress */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        เซสชันที่เสร็จ
                      </span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {client.sessionsCompleted}/{client.totalSessions}
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '0.5rem',
                      backgroundColor: 'var(--border-color)',
                      borderRadius: '0.25rem',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${client.progressPercentage}%`,
                        height: '100%',
                        backgroundColor: 'var(--success)',
                        borderRadius: '0.25rem'
                      }} />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => {
                        setSelectedClientDetail(client);
                        setShowDetailModal(true);
                      }}
                      disabled={isSaving}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        backgroundColor: 'var(--primary)',
                        color: 'var(--text-white)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        opacity: isSaving ? 0.5 : 1
                      }}
                    >
                      <Eye size={16} />
                      ดูรายละเอียด
                    </button>
                    <button 
                      onClick={() => {
                        setEditingClient(client);
                        setShowEditModal(true);
                      }}
                      disabled={isSaving}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        backgroundColor: 'var(--accent)',
                        color: 'var(--text-white)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isSaving ? 0.5 : 1
                      }}
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
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
            รายงานประสิทธิภาพ
          </h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              disabled={isLoading || isSaving}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '0.875rem',
                outline: 'none',
                opacity: (isLoading || isSaving) ? 0.5 : 1
              }}
            >
              <option value="month">เดือนนี้</option>
              <option value="quarter">ไตรมาสนี้</option>
              <option value="year">ปีนี้</option>
            </select>
            <button 
              onClick={() => setShowExportModal(true)}
              disabled={isLoading || isSaving}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: (isLoading || isSaving) ? 'not-allowed' : 'pointer',
                backgroundColor: 'var(--accent)',
                color: 'var(--text-white)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: (isLoading || isSaving) ? 0.5 : 1
              }}
            >
              {isSaving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
              ส่งออก PDF
            </button>
            <button 
              onClick={() => exportToCSV(clientProgress, 'client-progress')}
              disabled={isLoading || isSaving}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: (isLoading || isSaving) ? 'not-allowed' : 'pointer',
                backgroundColor: 'var(--success)',
                color: 'var(--text-white)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: (isLoading || isSaving) ? 0.5 : 1
              }}
            >
              <Share2 size={16} />
              ส่งออก CSV
            </button>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {isLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'var(--text-secondary)'
            }}>
              <Loader size={48} style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
              <p>กำลังโหลดรายงาน...</p>
            </div>
          ) : (
            <>
              {/* Report Summary - แสดงข้อมูลตามช่วงเวลาที่เลือก */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: windowWidth <= 768 ? 
                  (windowWidth <= 480 ? '1fr' : 'repeat(2, 1fr)') : 
                  'repeat(4, 1fr)',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {currentPeriodData.totalSessions}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    เซสชันทั้งหมด
                    {selectedPeriod === 'month' && ' (เดือนนี้)'}
                    {selectedPeriod === 'quarter' && ' (ไตรมาสนี้)'}
                    {selectedPeriod === 'year' && ' (ปีนี้)'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                    +{currentPeriodData.monthlyGrowth}% จาก
                    {selectedPeriod === 'month' && 'เดือนที่แล้ว'}
                    {selectedPeriod === 'quarter' && 'ไตรมาสที่แล้ว'}
                    {selectedPeriod === 'year' && 'ปีที่แล้ว'}
                  </div>
                </div>

                <div style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--success)' }}>
                    {currentPeriodData.attendanceRate}%
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    อัตราเข้าร่วม
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                    {selectedPeriod === 'month' && '+5% จากเดือนที่แล้ว'}
                    {selectedPeriod === 'quarter' && '+3% จากไตรมาสที่แล้ว'}
                    {selectedPeriod === 'year' && '+8% จากปีที่แล้ว'}
                  </div>
                </div>

                <div style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--warning)' }}>
                    {currentPeriodData.avgRating}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    คะแนนเฉลี่ย
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                    {selectedPeriod === 'month' && '+0.3 จากเดือนที่แล้ว'}
                    {selectedPeriod === 'quarter' && '+0.2 จากไตรมาสที่แล้ว'}
                    {selectedPeriod === 'year' && '+0.5 จากปีที่แล้ว'}
                  </div>
                </div>

                <div style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--info)' }}>
                    ฿{(currentPeriodData.totalRevenue / 1000).toFixed(0)}K
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    รายได้รวม
                    {selectedPeriod === 'month' && ' (เดือนนี้)'}
                    {selectedPeriod === 'quarter' && ' (ไตรมาสนี้)'}
                    {selectedPeriod === 'year' && ' (ปีนี้)'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                    +{currentPeriodData.monthlyGrowth}% จาก
                    {selectedPeriod === 'month' && 'เดือนที่แล้ว'}
                    {selectedPeriod === 'quarter' && 'ไตรมาสที่แล้ว'}
                    {selectedPeriod === 'year' && 'ปีที่แล้ว'}
                  </div>
                </div>
              </div>

              {/* Detailed Charts - แสดงข้อมูลตามช่วงเวลา */}
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
                    แนวโน้มการเข้าร่วม ({selectedPeriod === 'month' ? 'รายสัปดาห์' : selectedPeriod === 'quarter' ? 'รายเดือน' : 'รายไตรมาส'})
                  </h4>
                  <div style={{ height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={currentPeriodData.timeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="period" stroke="var(--text-secondary)" />
                        <YAxis stroke="var(--text-secondary)" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '0.5rem'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="attendance" 
                          stroke="var(--success)" 
                          strokeWidth={3}
                          dot={{ fill: 'var(--success)', strokeWidth: 2, r: 4 }}
                          name="อัตราเข้าร่วม (%)"
                        />
                      </LineChart>
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
                    รายได้ ({selectedPeriod === 'month' ? 'รายสัปดาห์' : selectedPeriod === 'quarter' ? 'รายเดือน' : 'รายไตรมาส'})
                  </h4>
                  <div style={{ height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={currentPeriodData.revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="period" stroke="var(--text-secondary)" />
                        <YAxis stroke="var(--text-secondary)" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '0.5rem'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="revenue" fill="var(--accent)" name="รายได้รวม" />
                        <Line type="monotone" dataKey="net" stroke="var(--success)" strokeWidth={3} name="รายได้สุทธิ" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Additional Analysis for each period */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                marginBottom: '2rem'
              }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  สรุปผลการดำเนินงาน
                  {selectedPeriod === 'month' && ' (เดือนนี้)'}
                  {selectedPeriod === 'quarter' && ' (ไตรมาสนี้)'}
                  {selectedPeriod === 'year' && ' (ปีนี้)'}
                </h4>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '0.5rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      อัตราการเสร็จสิ้นแพคเกจ
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
                      {currentPeriodData.completionRate}%
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '0.5rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      อัตราการกลับมาของลูกค้า
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--info)' }}>
                      {currentPeriodData.clientRetention}%
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '0.5rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {selectedPeriod === 'month' ? 'เวลาเฉลี่ยต่อเซสชัน' : 
                       selectedPeriod === 'quarter' ? 'เซสชันเฉลี่ยต่อเดือน' : 
                       'เซสชันเฉลี่ยต่อไตรมาส'}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                      {selectedPeriod === 'month' ? '52 นาที' : 
                       selectedPeriod === 'quarter' ? '152 เซสชัน' : 
                       '456 เซสชัน'}
                    </div>
                  </div>
                </div>

                {/* Period-specific insights */}
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    💡 ข้อมูลเชิงลึก
                  </h5>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {selectedPeriod === 'month' && (
                      <div>
                        • สัปดาห์ที่ 4 มีอัตราเข้าร่วมสูงสุด (95%) จากการปรับเปลี่ยนตารางเวลา<br/>
                        • รายได้เพิ่มขึ้นต่อเนื่อง โดยเฉพาะจากแพคเกจลดน้ำหนัก<br/>
                        • ลูกค้าใหม่ 5 คน โดย 3 คนเลือกแพคเกจเพิ่มกล้ามเนื้อ
                      </div>
                    )}
                    {selectedPeriod === 'quarter' && (
                      <div>
                        • เดือนมิถุนายนมีผลงานดีสุดในไตรมาส โดยอัตราเข้าร่วมและความพึงพอใจอยู่ในระดับสูง<br/>
                        • รายได้เติบโต 15% เมื่อเทียบกับไตรมาสที่แล้ว จากการเพิ่มแพคเกจใหม่<br/>
                        • ลูกค้ากลับมาใช้บริการ 88% แสดงถึงความพึงพอใจที่ดี
                      </div>
                    )}
                    {selectedPeriod === 'year' && (
                      <div>
                        • ไตรมาส 4 มีรายได้สูงสุดของปี จากช่วงเทศกาลปีใหม่และโปรโมชันพิเศษ<br/>
                        • จำนวนเซสชันรวมเพิ่มขึ้น 18% จากปีที่แล้ว แสดงถึงการเติบโตของธุรกิจ<br/>
                        • อัตราการกลับมาของลูกค้า 92% ซึ่งสูงกว่าเป้าหมายที่กำหนดไว้ (85%)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Period comparison chart */}
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
                  การเปรียบเทียบประสิทธิภาพ
                </h4>
                <div style={{ height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentPeriodData.timeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="period" stroke="var(--text-secondary)" />
                      <YAxis stroke="var(--text-secondary)" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '0.5rem'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="sessions" fill="var(--primary)" name="จำนวนเซสชัน" />
                      <Bar dataKey="satisfaction" fill="var(--warning)" name="ความพึงพอใจ (x10)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // แสดง Loading Screen เมื่อกำลังโหลดข้อมูลครั้งแรก
  if (isLoading && clientProgress.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '1rem'
      }}>
        <Loader size={48} style={{ 
          color: '#df2528',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          กำลังโหลดข้อมูลการติดตามผล...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Alert Messages */}
      <Alert 
        type="error" 
        message={error} 
        onClose={() => setError(null)} 
      />
      <Alert 
        type="success" 
        message={successMessage} 
        onClose={() => setSuccessMessage('')} 
      />

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
            ติดตามผลและรายงาน
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            ติดตามความคืบหน้าและประสิทธิภาพการทำงาน
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            onClick={loadTrackingData}
            disabled={isLoading || isSaving}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: (isLoading || isSaving) ? 'not-allowed' : 'pointer',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: (isLoading || isSaving) ? 0.5 : 1
            }}
          >
            {(isLoading || isSaving) ? 
              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 
              <RefreshCw size={16} />
            }
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        marginBottom: '2rem',
        overflow: windowWidth <= 768 ? 'auto' : 'hidden'
      }}>
        {[
          { id: 'overview', label: 'ภาพรวม', icon: BarChart3 },
          { id: 'clients', label: 'ความคืบหน้าลูกค้า', icon: Users },
          { id: 'reports', label: 'รายงาน', icon: Download }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            disabled={isLoading}
            style={{
              flex: windowWidth <= 768 ? '0 0 auto' : 1,
              padding: '1rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              backgroundColor: activeTab === tab.id ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-white)' : 'var(--text-secondary)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            <tab.icon size={16} />
            {windowWidth > 480 || activeTab === tab.id ? tab.label : ''}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'clients' && renderClientProgress()}
      {activeTab === 'reports' && renderReports()}

      {/* Modals */}
      {showDetailModal && selectedClientDetail && (
        <ClientDetailModal 
          client={selectedClientDetail} 
          onClose={() => {
            setShowDetailModal(false);
            setSelectedClientDetail(null);
          }} 
        />
      )}

      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}

      {showEditModal && editingClient && (
        <EditClientModal 
          client={editingClient}
          onClose={() => {
            setShowEditModal(false);
            setEditingClient(null);
          }}
          onSave={handleSaveClientEdit}
        />
      )}

      {/* Loading Overlay */}
      {isSaving && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99,
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <Loader size={48} style={{ 
            color: '#df2528',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: 'white', fontSize: '0.875rem' }}>
            กำลังบันทึกข้อมูล...
          </p>
        </div>
      )}
    </div>
  );
};

export default TrackingPage;