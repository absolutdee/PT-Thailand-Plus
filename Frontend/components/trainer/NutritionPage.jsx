import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Filter, Edit, Trash2, Copy, Share2, Download, Eye,
  Clock, Users, Target, ChefHat, Apple, Zap, Droplets, Calendar,
  TrendingUp, TrendingDown, MoreVertical, X, Check, AlertCircle,
  CheckCircle, RefreshCw, Star, BookOpen, Settings, Bell
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';

const NutritionPage = ({ windowWidth }) => {
  const [activeTab, setActiveTab] = useState('plans');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [showPlanDetail, setShowPlanDetail] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const [showMealPlanner, setShowMealPlanner] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedMealSlot, setSelectedMealSlot] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGoal, setFilterGoal] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for data from database
  const [nutritionPlans, setNutritionPlans] = useState([]);
  const [mealTemplates, setMealTemplates] = useState([]);
  const [clients, setClients] = useState([]);

  const nutritionData = [
    { name: 'โปรตีน', value: 30, color: '#10b981' },
    { name: 'คาร์โบไฮเดรต', value: 45, color: '#3b82f6' },
    { name: 'ไขมัน', value: 25, color: '#f59e0b' }
  ];

  const weeklyProgress = [
    { day: 'จ', calories: 1750, target: 1800, adherence: 85 },
    { day: 'อ', calories: 1820, target: 1800, adherence: 92 },
    { day: 'พ', calories: 1780, target: 1800, adherence: 88 },
    { day: 'พฤ', calories: 1850, target: 1800, adherence: 95 },
    { day: 'ศ', calories: 1790, target: 1800, adherence: 87 },
    { day: 'ส', calories: 1900, target: 1800, adherence: 78 },
    { day: 'อา', calories: 1650, target: 1800, adherence: 90 }
  ];

  const monthlyTrends = [
    { month: 'ม.ค.', weight: 75, body_fat: 18, muscle: 65 },
    { month: 'ก.พ.', weight: 73, body_fat: 17, muscle: 66 },
    { month: 'มี.ค.', weight: 71, body_fat: 16, muscle: 67 },
    { month: 'เม.ย.', weight: 70, body_fat: 15, muscle: 68 },
    { month: 'พ.ค.', weight: 69, body_fat: 14, muscle: 69 },
    { month: 'มิ.ย.', weight: 68, body_fat: 13, muscle: 70 }
  ];

  // API Functions
  const apiCall = async (endpoint, method = 'GET', data = null) => {
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('trainerToken')}`
        }
      };

      if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`/api/trainer/nutrition${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Load data from database - useEffect ต้องอยู่ก่อน early return
  useEffect(() => {
    loadInitialData();
  }, []);

  // Update stats when events change - useEffect ต้องอยู่ก่อน early return
  useEffect(() => {
    if (nutritionPlans.length > 0) {
      // Any stats update logic here
    }
  }, [nutritionPlans]);

  // CSS animation for modals and notifications - ย้ายมาไว้ก่อน early return
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes modalFadeIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      @keyframes overlayFadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Parallel API calls for better performance
      const [plansResponse, templatesResponse, clientsResponse] = await Promise.all([
        apiCall('/plans'),
        apiCall('/templates'),
        apiCall('/clients')
      ]);

      setNutritionPlans(plansResponse.data || []);
      setMealTemplates(templatesResponse.data || []);
      setClients(clientsResponse.data || []);

    } catch (error) {
      console.error('Failed to load data:', error);
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      
      // Fallback to sample data if API fails
      loadSampleData();
    } finally {
      setLoading(false);
    }
  };

  // Fallback sample data
  const loadSampleData = () => {
    setNutritionPlans([
      {
        id: 1,
        name: 'แผนลดน้ำหนัก - คุณสมชาย',
        client: 'คุณสมชาย ใจดี',
        clientId: 'client1',
        clientAvatar: 'S',
        goal: 'ลดน้ำหนัก',
        calories: 1800,
        protein: 120,
        carbs: 180,
        fat: 60,
        startDate: '2025-06-20',
        endDate: '2025-07-20',
        status: 'active',
        progress: 75,
        adherence: 85,
        lastUpdated: '2 วันที่แล้ว',
        notes: 'โฟกัสที่การลดน้ำหนักอย่างสม่ำเสมอ',
        mealPlan: {
          monday: { breakfast: [1], lunch: [2], dinner: [3], snacks: [4] },
          tuesday: { breakfast: [1], lunch: [2], dinner: [3], snacks: [] },
          wednesday: { breakfast: [1], lunch: [2], dinner: [3], snacks: [4] },
          thursday: { breakfast: [1], lunch: [2], dinner: [3], snacks: [] },
          friday: { breakfast: [1], lunch: [2], dinner: [3], snacks: [4] },
          saturday: { breakfast: [1], lunch: [2], dinner: [6], snacks: [4] },
          sunday: { breakfast: [1], lunch: [2], dinner: [3], snacks: [5] }
        }
      }
    ]);

    setMealTemplates([
      {
        id: 1,
        name: 'อาหารเช้าลดน้ำหนัก',
        category: 'เช้า',
        calories: 350,
        protein: 25,
        carbs: 40,
        fat: 12,
        ingredients: ['ไข่ขาว 3 ฟอง', 'ขนมปังโฮลวีต 2 แผ่น', 'อะโวคาโด 1/2 ลูก', 'ผักใบเขียว'],
        instructions: ['ทอดไข่ขาวให้สุก', 'ปิ้งขนมปัง', 'หั่นอะโวคาโดใส่จาน', 'เสิร์ฟพร้อมผักใบเขียว'],
        prepTime: '15 นาที',
        difficulty: 'ง่าย',
        tags: ['ลดน้ำหนัก', 'โปรตีนสูง', 'อิ่มนาน']
      }
    ]);

    setClients([
      { id: 'client1', name: 'คุณสมชาย ใจดี', avatar: 'S' },
      { id: 'client2', name: 'คุณแนน สวยงาม', avatar: 'N' },
      { id: 'client3', name: 'คุณโจ แข็งแรง', avatar: 'J' },
      { id: 'client4', name: 'คุณมาลี ดีใจ', avatar: 'M' },
      { id: 'client5', name: 'คุณดาว ใสใส', avatar: 'D' }
    ]);
  };

  // CRUD Operations for Plans
  const createNutritionPlan = async (planData) => {
    try {
      const response = await apiCall('/plans', 'POST', planData);
      setNutritionPlans(prev => [...prev, response.data]);
      addNotification('สร้างแผนโภชนาการใหม่เรียบร้อยแล้ว', 'success');
      return response.data;
    } catch (error) {
      addNotification('เกิดข้อผิดพลาดในการสร้างแผน', 'error');
      throw error;
    }
  };

  const updateNutritionPlan = async (planId, planData) => {
    try {
      const response = await apiCall(`/plans/${planId}`, 'PUT', planData);
      setNutritionPlans(prev => 
        prev.map(plan => plan.id === planId ? response.data : plan)
      );
      addNotification('อัปเดตแผนโภชนาการเรียบร้อยแล้ว', 'success');
      return response.data;
    } catch (error) {
      addNotification('เกิดข้อผิดพลาดในการอัปเดตแผน', 'error');
      throw error;
    }
  };

  const deleteNutritionPlan = async (planId) => {
    try {
      await apiCall(`/plans/${planId}`, 'DELETE');
      setNutritionPlans(prev => prev.filter(plan => plan.id !== planId));
      addNotification('ลบแผนโภชนาการเรียบร้อยแล้ว', 'success');
    } catch (error) {
      addNotification('เกิดข้อผิดพลาดในการลบแผน', 'error');
      throw error;
    }
  };

  // CRUD Operations for Templates
  const createMealTemplate = async (templateData) => {
    try {
      const response = await apiCall('/templates', 'POST', templateData);
      setMealTemplates(prev => [...prev, response.data]);
      addNotification('สร้างเทมเพลตใหม่เรียบร้อยแล้ว', 'success');
      return response.data;
    } catch (error) {
      addNotification('เกิดข้อผิดพลาดในการสร้างเทมเพลต', 'error');
      throw error;
    }
  };

  const updateMealTemplate = async (templateId, templateData) => {
    try {
      const response = await apiCall(`/templates/${templateId}`, 'PUT', templateData);
      setMealTemplates(prev => 
        prev.map(template => template.id === templateId ? response.data : template)
      );
      addNotification('อัปเดตเทมเพลตเรียบร้อยแล้ว', 'success');
      return response.data;
    } catch (error) {
      addNotification('เกิดข้อผิดพลาดในการอัปเดตเทมเพลต', 'error');
      throw error;
    }
  };

  const deleteMealTemplate = async (templateId) => {
    try {
      await apiCall(`/templates/${templateId}`, 'DELETE');
      setMealTemplates(prev => prev.filter(template => template.id !== templateId));
      addNotification('ลบเทมเพลตเรียบร้อยแล้ว', 'success');
    } catch (error) {
      addNotification('เกิดข้อผิดพลาดในการลบเทมเพลต', 'error');
      throw error;
    }
  };

  // Meal Planning Operations
  const updateMealPlan = async (planId, day, mealType, templateIds) => {
    try {
      const response = await apiCall(`/plans/${planId}/meal-plan`, 'PUT', {
        day,
        mealType,
        templateIds
      });
      
      setNutritionPlans(prev => 
        prev.map(plan => 
          plan.id === planId 
            ? { ...plan, mealPlan: response.data.mealPlan, lastUpdated: 'เมื่อสักครู่' }
            : plan
        )
      );
      
      return response.data;
    } catch (error) {
      addNotification('เกิดข้อผิดพลาดในการอัปเดตแผนมื้ออาหาร', 'error');
      throw error;
    }
  };

  // Utility Functions
  const getMealTypeText = (mealType) => {
    switch (mealType) {
      case 'breakfast': return 'เช้า';
      case 'lunch': return 'กลางวัน';
      case 'dinner': return 'เย็น';
      case 'snacks': return 'ขนม/ว่าง';
      default: return mealType;
    }
  };

  const getDayText = (day) => {
    switch (day) {
      case 'monday': return 'จันทร์';
      case 'tuesday': return 'อังคาร';
      case 'wednesday': return 'พุธ';
      case 'thursday': return 'พฤหัสบดี';
      case 'friday': return 'ศุกร์';
      case 'saturday': return 'เสาร์';
      case 'sunday': return 'อาทิตย์';
      default: return day;
    }
  };

  const calculateDayNutrition = (plan, day) => {
    if (!plan.mealPlan || !plan.mealPlan[day]) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    const dayMeals = plan.mealPlan[day];
    
    Object.values(dayMeals).forEach(mealTemplateIds => {
      mealTemplateIds.forEach(templateId => {
        const template = mealTemplates.find(t => t.id === templateId);
        if (template) {
          totalCalories += template.calories;
          totalProtein += template.protein;
          totalCarbs += template.carbs;
          totalFat += template.fat;
        }
      });
    });

    return {
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat
    };
  };

  const calculateWeeklyAverage = (plan) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    days.forEach(day => {
      const dayNutrition = calculateDayNutrition(plan, day);
      totalCalories += dayNutrition.calories;
      totalProtein += dayNutrition.protein;
      totalCarbs += dayNutrition.carbs;
      totalFat += dayNutrition.fat;
    });

    return {
      calories: Math.round(totalCalories / 7),
      protein: Math.round(totalProtein / 7),
      carbs: Math.round(totalCarbs / 7),
      fat: Math.round(totalFat / 7)
    };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#3b82f6';
      case 'paused': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'กำลังใช้งาน';
      case 'completed': return 'เสร็จสิ้น';
      case 'paused': return 'หยุดชั่วคราว';
      default: return status;
    }
  };

  const getGoalColor = (goal) => {
    switch (goal) {
      case 'ลดน้ำหนัก': return '#ef4444';
      case 'เพิ่มกล้ามเนื้อ': return '#10b981';
      case 'บำรุงร่างกาย': return '#3b82f6';
      case 'คัต/กระชับสัดส่วน': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'เช้า': return '#f59e0b';
      case 'กลางวัน': return '#10b981';
      case 'เย็น': return '#3b82f6';
      case 'ขนม': return '#8b5cf6';
      case 'เครื่องดื่ม': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  const getFilteredPlans = () => {
    return nutritionPlans.filter(plan => {
      const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          plan.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          plan.goal.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;
      const matchesGoal = filterGoal === 'all' || plan.goal === filterGoal;
      
      return matchesSearch && matchesStatus && matchesGoal;
    });
  };

  const getFilteredTemplates = () => {
    return mealTemplates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });
  };

  // Notification Management
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Meal Planning Functions
  const handleAddTemplateToMeal = async (planId, day, mealType, templateId) => {
    try {
      const plan = nutritionPlans.find(p => p.id === planId);
      const currentTemplates = plan?.mealPlan?.[day]?.[mealType] || [];
      
      if (!currentTemplates.includes(templateId)) {
        const updatedTemplates = [...currentTemplates, templateId];
        await updateMealPlan(planId, day, mealType, updatedTemplates);
        
        const template = mealTemplates.find(t => t.id === templateId);
        addNotification(`เพิ่ม "${template?.name}" ลงในมื้อ${getMealTypeText(mealType)}วัน${getDayText(day)}`, 'success');
      }
    } catch (error) {
      console.error('Failed to add template to meal:', error);
    }
  };

  const handleRemoveTemplateFromMeal = async (planId, day, mealType, templateId) => {
    try {
      const plan = nutritionPlans.find(p => p.id === planId);
      const currentTemplates = plan?.mealPlan?.[day]?.[mealType] || [];
      const updatedTemplates = currentTemplates.filter(id => id !== templateId);
      
      await updateMealPlan(planId, day, mealType, updatedTemplates);
      
      const template = mealTemplates.find(t => t.id === templateId);
      addNotification(`ลบ "${template?.name}" ออกจากแผน`, 'success');
    } catch (error) {
      console.error('Failed to remove template from meal:', error);
    }
  };

  const handleOpenTemplateSelector = (planId, day, mealType) => {
    setSelectedMealSlot({ planId, day, mealType });
    setShowTemplateSelector(true);
  };

  // Plan Management
  const handleDeletePlan = (planId) => {
    const plan = nutritionPlans.find(p => p.id === planId);
    setDeleteTarget({ type: 'plan', id: planId, name: plan.name });
    setShowDeleteConfirm(true);
  };

  const handleDeleteTemplate = (templateId) => {
    const template = mealTemplates.find(t => t.id === templateId);
    setDeleteTarget({ type: 'template', id: templateId, name: template.name });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteTarget.type === 'plan') {
        await deleteNutritionPlan(deleteTarget.id);
        if (showPlanDetail && selectedPlan?.id === deleteTarget.id) {
          setShowPlanDetail(false);
          setSelectedPlan(null);
        }
      } else if (deleteTarget.type === 'template') {
        await deleteMealTemplate(deleteTarget.id);
      }
    } catch (error) {
      console.error('Delete operation failed:', error);
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const handleDuplicatePlan = async (plan) => {
    try {
      const newPlanData = {
        ...plan,
        name: `${plan.name} (คัดลอก)`,
        status: 'paused',
        progress: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      delete newPlanData.id;
      
      await createNutritionPlan(newPlanData);
    } catch (error) {
      console.error('Failed to duplicate plan:', error);
    }
  };

  const handleUpdatePlanStatus = async (planId, newStatus) => {
    try {
      await updateNutritionPlan(planId, { status: newStatus });
      addNotification(`อัปเดตสถานะแผนเป็น "${getStatusText(newStatus)}" เรียบร้อยแล้ว`, 'success');
    } catch (error) {
      console.error('Failed to update plan status:', error);
    }
  };

  // Template Management
  const handleDuplicateTemplate = async (template) => {
    try {
      const newTemplateData = {
        ...template,
        name: `${template.name} (คัดลอก)`
      };
      delete newTemplateData.id;
      
      await createMealTemplate(newTemplateData);
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  // Export Functions
  const exportData = () => {
    const data = {
      plans: getFilteredPlans(),
      templates: getFilteredTemplates(),
      exportDate: new Date().toISOString()
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nutrition_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addNotification('ส่งออกข้อมูลเรียบร้อยแล้ว', 'success');
  };

  // Loading state - early return ต้องอยู่หลัง useEffect ทั้งหมด
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid var(--border-color)',
            borderTop: '3px solid var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Error state - early return ต้องอยู่หลัง useEffect ทั้งหมด
  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          textAlign: 'center'
        }}>
          <AlertCircle size={48} style={{ color: '#ef4444' }} />
          <p>{error}</p>
          <button
            onClick={loadInitialData}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: 'var(--accent)',
              color: 'var(--text-white)',
              border: 'none'
            }}
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  // Modal Components (keeping existing modals with updated handlers)
  const TemplateSelectorModal = () => {
    if (!showTemplateSelector || !selectedMealSlot) return null;

    const { planId, day, mealType } = selectedMealSlot;
    const plan = nutritionPlans.find(p => p.id === planId);
    const currentTemplates = plan?.mealPlan?.[day]?.[mealType] || [];

    const suggestedTemplates = mealTemplates.filter(template => {
      if (mealType === 'breakfast') return template.category === 'เช้า';
      if (mealType === 'lunch') return template.category === 'กลางวัน';
      if (mealType === 'dinner') return template.category === 'เย็น';
      if (mealType === 'snacks') return template.category === 'ขนม' || template.category === 'เครื่องดื่ม';
      return true;
    });

    const otherTemplates = mealTemplates.filter(template => !suggestedTemplates.includes(template));

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
        zIndex: 100,
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                เลือกเทมเพลตสำหรับมื้อ{getMealTypeText(mealType)}
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                วัน{getDayText(day)} - {plan?.name}
              </p>
            </div>
            <button
              onClick={() => {
                setShowTemplateSelector(false);
                setSelectedMealSlot(null);
              }}
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-secondary)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ padding: '1.5rem', maxHeight: '70vh', overflow: 'auto' }}>
            {currentTemplates.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  เทมเพลตที่เลือกแล้ว
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {currentTemplates.map(templateId => {
                    const template = mealTemplates.find(t => t.id === templateId);
                    if (!template) return null;
                    
                    return (
                      <div
                        key={templateId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: '0.5rem',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {template.name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {template.calories} kcal
                        </span>
                        <button
                          onClick={() => handleRemoveTemplateFromMeal(planId, day, mealType, templateId)}
                          style={{
                            width: '1.5rem',
                            height: '1.5rem',
                            borderRadius: '50%',
                            backgroundColor: '#ef4444',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {suggestedTemplates.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  เทมเพลตแนะนำสำหรับมื้อนี้
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1rem'
                }}>
                  {suggestedTemplates.map(template => (
                    <div
                      key={template.id}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => {
                        handleAddTemplateToMeal(planId, day, mealType, template.id);
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {template.name}
                        </h4>
                        <div style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: getCategoryColor(template.category) + '20',
                          color: getCategoryColor(template.category)
                        }}>
                          {template.category}
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '0.5rem',
                        fontSize: '0.75rem',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: '600', color: 'var(--accent)' }}>{template.calories}</div>
                          <div style={{ color: 'var(--text-secondary)' }}>kcal</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: '600', color: '#10b981' }}>{template.protein}g</div>
                          <div style={{ color: 'var(--text-secondary)' }}>โปรตีน</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: '600', color: '#3b82f6' }}>{template.carbs}g</div>
                          <div style={{ color: 'var(--text-secondary)' }}>คาร์บ</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: '600', color: '#f59e0b' }}>{template.fat}g</div>
                          <div style={{ color: 'var(--text-secondary)' }}>ไขมัน</div>
                        </div>
                      </div>

                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <Clock size={12} />
                        {template.prepTime} • {template.difficulty}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {otherTemplates.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  เทมเพลตอื่นๆ
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1rem'
                }}>
                  {otherTemplates.map(template => (
                    <div
                      key={template.id}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: 0.8
                      }}
                      onClick={() => {
                        handleAddTemplateToMeal(planId, day, mealType, template.id);
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.opacity = '1';
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.opacity = '0.8';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {template.name}
                        </h4>
                        <div style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: getCategoryColor(template.category) + '20',
                          color: getCategoryColor(template.category)
                        }}>
                          {template.category}
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        fontSize: '0.75rem'
                      }}>
                        <span style={{ color: 'var(--accent)', fontWeight: '600' }}>
                          {template.calories} kcal
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {template.prepTime}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const DeleteConfirmModal = () => {
    const confirmButtonRef = useRef(null);

    // ✅ useEffect ใน component นี้ไม่มีปัญหาเพราะอยู่ก่อน early return
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (!showDeleteConfirm) return;
        
        if (e.key === 'Escape') {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        } else if (e.key === 'Enter') {
          confirmDelete();
        }
      };

      if (showDeleteConfirm) {
        document.addEventListener('keydown', handleKeyDown);
        setTimeout(() => {
          confirmButtonRef.current?.focus();
        }, 100);
      }

      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showDeleteConfirm]);

    if (!showDeleteConfirm || !deleteTarget) return null;

    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 150,
          padding: '1rem',
          animation: 'overlayFadeIn 0.2s ease-out'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
          }
        }}
      >
        <div 
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '500px',
            width: '100%',
            overflow: 'hidden',
            animation: 'modalFadeIn 0.3s ease-out',
            position: 'relative'
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <button
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeleteTarget(null);
            }}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              zIndex: 10,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--border-color)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--bg-secondary)';
            }}
          >
            <X size={16} />
          </button>

          <div style={{
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <AlertCircle size={32} style={{ color: '#ef4444' }} />
            </div>

            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}>
              ยืนยันการลบ
            </h2>

            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              marginBottom: '1.5rem'
            }}>
              คุณแน่ใจหรือไม่ที่จะลบ
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                {deleteTarget.type === 'plan' ? 'แผนโภชนาการ' : 'เทมเพลต'}
              </span>
              <br />
              <span style={{ fontWeight: '600', color: 'var(--accent)' }}>
                "{deleteTarget.name}"
              </span>
              <br />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                การดำเนินการนี้ไม่สามารถยกเลิกได้
              </span>
            </p>

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--border-color)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-secondary)';
                }}
              >
                ยกเลิก
              </button>
              <button
                ref={confirmButtonRef}
                onClick={confirmDelete}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: '#ef4444',
                  color: 'var(--text-white)',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#dc2626';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#ef4444';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Trash2 size={16} />
                  ลบ{deleteTarget.type === 'plan' ? 'แผน' : 'เทมเพลต'}
                </div>
              </button>
            </div>

            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              textAlign: 'center'
            }}>
              กด <kbd style={{ 
                padding: '0.125rem 0.25rem', 
                backgroundColor: 'var(--border-color)', 
                borderRadius: '0.25rem',
                fontFamily: 'monospace'
              }}>Esc</kbd> เพื่อยกเลิก หรือ <kbd style={{ 
                padding: '0.125rem 0.25rem', 
                backgroundColor: 'var(--border-color)', 
                borderRadius: '0.25rem',
                fontFamily: 'monospace'
              }}>Enter</kbd> เพื่อยืนยัน
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ... รวมถึง modal components อื่นๆ ที่เหลือจากโค้ดเดิม (เพื่อความสั้น จึงข้ามไป)
  // PlanFormModal, TemplateFormModal, PlanDetailModal และฟังก์ชัน render อื่นๆ

  // ... (เนื่องจากไฟล์ยาวมาก จึงแสดงเฉพาะส่วนสำคัญที่แก้ไข)

  // Main render component
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
            โภชนาการ
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            จัดการแผนโภชนาการและมื้ออาหารสำหรับลูกค้า
          </p>
        </div>
      </div>

      {/* ... ส่วนอื่นๆ ของ component ตามเดิม */}

      {/* Modals */}
      <DeleteConfirmModal />
      <TemplateSelectorModal />
      {/* ... modal components อื่นๆ */}
    </div>
  );
};

export default NutritionPage;