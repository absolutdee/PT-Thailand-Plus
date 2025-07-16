import React, { useState, useEffect } from 'react';
import { 
  Apple, Coffee, Utensils, Plus, 
  Target, PieChart, BarChart3, Clock,
  Search, Filter, Camera, Edit,
  ChevronDown, ChevronRight, Star,
  AlertCircle, CheckCircle, Droplets,
  Zap, Activity, Heart, X, Save,
  Share2, Download, Bell, Settings,
  QrCode, Calendar, Timer, Award,
  TrendingUp, MapPin, Users, Bookmark,
  PlayCircle, Pause, RotateCcw, Info,
  Smartphone, Mail, Phone, MessageSquare,
  Upload, FileText, Eye, EyeOff,
  ChevronLeft, Grid, List, MoreVertical,
  Sliders, RefreshCw, User, Send,
  Trash2, MinusCircle, PlusCircle,
  Copy, Link, Facebook, Twitter,
  Instagram, Volume2, VolumeX, Image,
  Maximize2, Minimize2, SkipBack, SkipForward,
  Pill, Beaker, Thermometer, Scale,
  ScanLine, Mic, MicOff,
  CameraOff, Focus,
  Loader, Sparkles, Flame,
  BookOpen, ChefHat, Lightbulb,
  LineChart, ShoppingCart, AlertTriangle,
  Scissors, ArrowUp, ArrowDown,
  TrendingDown, Layers, Package,
  CheckSquare, Clock3, Check // เพิ่ม Check ที่นี่
} from 'lucide-react';

// API service functions
const apiService = {
  // Base API URL - แก้ไขตาม environment ของคุณ
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  
  async getDailyGoals() {
    const response = await fetch(`${this.baseURL}/client/nutrition/daily-goals`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch daily goals');
    return response.json();
  },

  async getMeals(date = new Date().toISOString().split('T')[0]) {
    const response = await fetch(`${this.baseURL}/client/nutrition/meals?date=${date}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch meals');
    return response.json();
  },

  async addFoodToMeal(mealId, foodId, quantity = 1) {
    const response = await fetch(`${this.baseURL}/client/nutrition/meals/${mealId}/foods`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ foodId, quantity })
    });
    if (!response.ok) throw new Error('Failed to add food to meal');
    return response.json();
  },

  async removeFoodFromMeal(mealId, foodId) {
    const response = await fetch(`${this.baseURL}/client/nutrition/meals/${mealId}/foods/${foodId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to remove food from meal');
    return response.json();
  },

  async markMealCompleted(mealId) {
    const response = await fetch(`${this.baseURL}/client/nutrition/meals/${mealId}/complete`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to mark meal as completed');
    return response.json();
  },

  async searchFoods(query) {
    const response = await fetch(`${this.baseURL}/client/nutrition/foods/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to search foods');
    return response.json();
  },

  async getFoodDatabase(category = 'all') {
    const response = await fetch(`${this.baseURL}/client/nutrition/foods?category=${category}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch food database');
    return response.json();
  },

  async addCustomFood(foodData) {
    const response = await fetch(`${this.baseURL}/client/nutrition/foods/custom`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(foodData)
    });
    if (!response.ok) throw new Error('Failed to add custom food');
    return response.json();
  },

  async scanBarcode(barcode) {
    const response = await fetch(`${this.baseURL}/client/nutrition/foods/barcode/${barcode}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to scan barcode');
    return response.json();
  },

  async analyzeFood(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch(`${this.baseURL}/client/nutrition/foods/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    if (!response.ok) throw new Error('Failed to analyze food');
    return response.json();
  },

  async getWaterIntake(date = new Date().toISOString().split('T')[0]) {
    const response = await fetch(`${this.baseURL}/client/nutrition/water?date=${date}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch water intake');
    return response.json();
  },

  async addWaterIntake(amount) {
    const response = await fetch(`${this.baseURL}/client/nutrition/water`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount })
    });
    if (!response.ok) throw new Error('Failed to add water intake');
    return response.json();
  },

  async getSupplements() {
    const response = await fetch(`${this.baseURL}/client/nutrition/supplements`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch supplements');
    return response.json();
  },

  async addSupplement(supplementData) {
    const response = await fetch(`${this.baseURL}/client/nutrition/supplements`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(supplementData)
    });
    if (!response.ok) throw new Error('Failed to add supplement');
    return response.json();
  },

  async updateSupplementStatus(supplementId, taken) {
    const response = await fetch(`${this.baseURL}/client/nutrition/supplements/${supplementId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ taken })
    });
    if (!response.ok) throw new Error('Failed to update supplement status');
    return response.json();
  },

  async getNutritionPlan() {
    const response = await fetch(`${this.baseURL}/client/nutrition/plan`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch nutrition plan');
    return response.json();
  },

  async getRecipes(category = 'all') {
    const response = await fetch(`${this.baseURL}/client/nutrition/recipes?category=${category}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch recipes');
    return response.json();
  },

  async getProgressHistory(days = 30) {
    const response = await fetch(`${this.baseURL}/client/nutrition/progress?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch progress history');
    return response.json();
  },

  async getRecommendations() {
    const response = await fetch(`${this.baseURL}/client/nutrition/recommendations`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch recommendations');
    return response.json();
  },

  async updateDailyGoals(goals) {
    const response = await fetch(`${this.baseURL}/client/nutrition/daily-goals`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(goals)
    });
    if (!response.ok) throw new Error('Failed to update daily goals');
    return response.json();
  }
};

const ClientNutrition = () => {
  const [activeTab, setActiveTab] = useState('today');
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showFoodCamera, setShowFoodCamera] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSupplementModal, setShowSupplementModal] = useState(false);
  const [showCreateFoodModal, setShowCreateFoodModal] = useState(false);
  const [showWaterTracker, setShowWaterTracker] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [foodFilter, setFoodFilter] = useState('all');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [scanning, setScanning] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [waterSoundEnabled, setWaterSoundEnabled] = useState(true);
  const [cameraStream, setCameraStream] = useState(null);
  const [analyzingFood, setAnalyzingFood] = useState(false);
  const [waterHistory, setWaterHistory] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [planViewMode, setPlanViewMode] = useState('weekly'); // weekly, daily

  // Data states
  const [dailyGoals, setDailyGoals] = useState({
    calories: { target: 2200, consumed: 0, remaining: 2200, burned: 0 },
    protein: { target: 150, consumed: 0, remaining: 150, percentage: 0 },
    carbs: { target: 275, consumed: 0, remaining: 275, percentage: 0 },
    fat: { target: 73, consumed: 0, remaining: 73, percentage: 0 },
    water: { target: 2500, consumed: 0, remaining: 2500, glasses: 0 },
    fiber: { target: 25, consumed: 0, remaining: 25 },
    sugar: { target: 50, consumed: 0, remaining: 50 },
    sodium: { target: 2300, consumed: 0, remaining: 2300 }
  });
  const [meals, setMeals] = useState([]);
  const [foodDatabase, setFoodDatabase] = useState([]);
  const [supplements, setSupplements] = useState([]);
  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [recipeDatabase, setRecipeDatabase] = useState([]);
  const [progressHistory, setProgressHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle window resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set CSS variables
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
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

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data concurrently
        const [
          goalsData,
          mealsData,
          foodsData,
          supplementsData,
          planData,
          recipesData,
          progressData,
          recommendationsData,
          waterData
        ] = await Promise.all([
          apiService.getDailyGoals(),
          apiService.getMeals(),
          apiService.getFoodDatabase(),
          apiService.getSupplements(),
          apiService.getNutritionPlan(),
          apiService.getRecipes(),
          apiService.getProgressHistory(),
          apiService.getRecommendations(),
          apiService.getWaterIntake()
        ]);

        // Set all data
        setDailyGoals(goalsData);
        setMeals(mealsData);
        setFoodDatabase(foodsData);
        setSupplements(supplementsData);
        setNutritionPlan(planData);
        setRecipeDatabase(recipesData);
        setProgressHistory(progressData);
        setRecommendations(recommendationsData);
        setWaterHistory(waterData.history || []);

      } catch (err) {
        console.error('Error fetching nutrition data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const tabs = [
    { id: 'today', label: 'วันนี้', icon: Calendar },
    { id: 'plan', label: 'แผนโภชนาการ', icon: Target },
    { id: 'history', label: 'ประวัติ', icon: BarChart3 },
    { id: 'recommendations', label: 'คำแนะนำ', icon: Award }
  ];

  // Helper functions
  const getMacroPercentage = (consumed, target) => {
    return Math.min(100, (consumed / target) * 100);
  };

  const addWaterGlass = async (amount = 250) => {
    try {
      setActionLoading(true);
      await apiService.addWaterIntake(amount);
      
      const newConsumed = dailyGoals.water.consumed + amount;
      const timestamp = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      
      setDailyGoals(prev => ({
        ...prev,
        water: {
          ...prev.water,
          consumed: Math.min(newConsumed, prev.water.target + 1000),
          remaining: Math.max(0, prev.water.target - Math.min(newConsumed, prev.water.target)),
          glasses: Math.min(newConsumed, prev.water.target + 1000) / 250
        }
      }));

      setWaterHistory(prev => [...prev, { amount, timestamp, id: Date.now() }]);

      if (waterSoundEnabled) {
        console.log('💧 Water sound effect played');
      }
    } catch (err) {
      console.error('Error adding water intake:', err);
      setError('ไม่สามารถบันทึกการดื่มน้ำได้');
    } finally {
      setActionLoading(false);
    }
  };

  const addFoodToMeal = async (food, mealType, quantity = 1) => {
    try {
      setActionLoading(true);
      
      const meal = meals.find(m => m.name.toLowerCase().includes(mealType.toLowerCase()));
      if (!meal) {
        throw new Error('ไม่พบมื้ออาหารที่ระบุ');
      }

      await apiService.addFoodToMeal(meal.id, food.id, quantity);
      
      // Refresh meals data
      const updatedMeals = await apiService.getMeals();
      setMeals(updatedMeals);
      
      // Refresh daily goals
      const updatedGoals = await apiService.getDailyGoals();
      setDailyGoals(updatedGoals);
      
    } catch (err) {
      console.error('Error adding food to meal:', err);
      setError('ไม่สามารถเพิ่มอาหารได้');
    } finally {
      setActionLoading(false);
    }
  };

  const addCustomFood = async (customFood) => {
    try {
      const newFood = await apiService.addCustomFood(customFood);
      setFoodDatabase(prev => [...prev, newFood]);
      return newFood;
    } catch (err) {
      console.error('Error adding custom food:', err);
      setError('ไม่สามารถเพิ่มอาหารใหม่ได้');
      return null;
    }
  };

  const addSupplement = async (newSupplement) => {
    try {
      const supplement = await apiService.addSupplement(newSupplement);
      setSupplements(prev => [...prev, supplement]);
    } catch (err) {
      console.error('Error adding supplement:', err);
      setError('ไม่สามารถเพิ่มซัพพลีเมนต์ได้');
    }
  };

  const removeFoodFromMeal = async (mealId, foodId) => {
    try {
      setActionLoading(true);
      await apiService.removeFoodFromMeal(mealId, foodId);
      
      // Refresh meals data
      const updatedMeals = await apiService.getMeals();
      setMeals(updatedMeals);
      
      // Refresh daily goals
      const updatedGoals = await apiService.getDailyGoals();
      setDailyGoals(updatedGoals);
      
    } catch (err) {
      console.error('Error removing food from meal:', err);
      setError('ไม่สามารถลบอาหารได้');
    } finally {
      setActionLoading(false);
    }
  };

  const markMealCompleted = async (mealId) => {
    try {
      setActionLoading(true);
      await apiService.markMealCompleted(mealId);
      
      // Update local state
      const updatedMeals = meals.map(meal => {
        if (meal.id === mealId) {
          return { ...meal, completed: true };
        }
        return meal;
      });
      setMeals(updatedMeals);
      
    } catch (err) {
      console.error('Error marking meal as completed:', err);
      setError('ไม่สามารถทำเครื่องหมายเสร็จสิ้นได้');
    } finally {
      setActionLoading(false);
    }
  };

  const updateSupplementStatus = async (supplementId) => {
    try {
      const supplement = supplements.find(s => s.id === supplementId);
      if (!supplement) return;

      await apiService.updateSupplementStatus(supplementId, !supplement.taken);
      
      const updatedSupplements = supplements.map(supplement => {
        if (supplement.id === supplementId) {
          return { ...supplement, taken: !supplement.taken };
        }
        return supplement;
      });
      setSupplements(updatedSupplements);
      
    } catch (err) {
      console.error('Error updating supplement status:', err);
      setError('ไม่สามารถอัพเดตสถานะซัพพลีเมนต์ได้');
    }
  };

  const simulateBarcodeScan = async () => {
    setScanning(true);
    try {
      // Simulate barcode scanning
      setTimeout(async () => {
        try {
          const scannedFood = await apiService.scanBarcode('8851234567891');
          setFoodDatabase(prev => [...prev, scannedFood]);
          setShowBarcodeScanner(false);
          setShowFoodSearch(true);
        } catch (err) {
          console.error('Barcode scan error:', err);
          setError('ไม่สามารถสแกนบาร์โค้ดได้');
        } finally {
          setScanning(false);
        }
      }, 2000);
    } catch (err) {
      setScanning(false);
      setError('ไม่สามารถเปิดกล้องสแกนได้');
    }
  };

  const simulateFoodAnalysis = async (imageFile) => {
    setAnalyzingFood(true);
    try {
      const analyzedFood = await apiService.analyzeFood(imageFile);
      setFoodDatabase(prev => [...prev, analyzedFood]);
      setShowFoodCamera(false);
      setShowFoodSearch(true);
    } catch (err) {
      console.error('Food analysis error:', err);
      setError('ไม่สามารถวิเคราะห์อาหารจากรูปภาพได้');
    } finally {
      setAnalyzingFood(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCameraStream(stream);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('ไม่สามารถเปิดกล้องได้');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  useEffect(() => {
    if (showFoodCamera) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => stopCamera();
  }, [showFoodCamera]);

  // Loading component
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size={40} color="var(--primary)" className="animate-spin" />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูลโภชนาการ...</p>
        </div>
      </div>
    );
  }

  // Error component
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div style={{ 
          textAlign: 'center', 
          backgroundColor: 'var(--bg-primary)',
          padding: '2rem',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)'
        }}>
          <AlertCircle size={40} color="var(--accent)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>เกิดข้อผิดพลาด</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer'
            }}
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  // Render Today Tab (แก้ไขเล็กน้อยเพื่อใช้ข้อมูลจาก API)
  const renderTodayTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '1rem'
      }}>
        <button
          onClick={() => setShowFoodSearch(true)}
          style={{
            padding: '1rem',
            backgroundColor: 'var(--primary)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'transform 0.2s'
          }}
        >
          <Search size={24} />
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>ค้นหาอาหาร</span>
        </button>
        <button
          onClick={() => setShowBarcodeScanner(true)}
          style={{
            padding: '1rem',
            backgroundColor: 'var(--accent)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <QrCode size={24} />
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>สแกนบาร์โค้ด</span>
        </button>
        <button
          onClick={() => setShowFoodCamera(true)}
          style={{
            padding: '1rem',
            backgroundColor: 'var(--success)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Camera size={24} />
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>ถ่ายรูปอาหาร</span>
        </button>
        <button
          onClick={() => setShowWaterTracker(true)}
          style={{
            padding: '1rem',
            backgroundColor: 'var(--info)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Droplets size={24} />
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>ดื่มน้ำ</span>
        </button>
      </div>

      {/* Daily Progress Overview */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              ความก้าวหน้าวันนี้
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setShowStatsModal(true)}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <BarChart3 size={16} />
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* Calories Progress */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {dailyGoals.calories.consumed?.toLocaleString() || 0}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                จาก {dailyGoals.calories.target?.toLocaleString() || 0} แคลอรี่
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--accent)' }}>
                {dailyGoals.calories.remaining || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เหลือ</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--warning)' }}>
                {dailyGoals.calories.burned || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เผาผลาญ</div>
            </div>
          </div>

          <div style={{
            width: '100%',
            height: '12px',
            backgroundColor: 'var(--border-color)',
            borderRadius: '1rem',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              height: '100%',
              width: `${getMacroPercentage(dailyGoals.calories.consumed || 0, dailyGoals.calories.target || 1)}%`,
              backgroundColor: 'var(--primary)',
              borderRadius: '1rem',
              transition: 'width 0.6s ease'
            }}></div>
          </div>
        </div>

        {/* Macros Progress */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '1rem'
        }}>
          {[
            { name: 'โปรตีน', data: dailyGoals.protein, unit: 'g', color: 'var(--accent)' },
            { name: 'คาร์บ', data: dailyGoals.carbs, unit: 'g', color: 'var(--info)' },
            { name: 'ไขมัน', data: dailyGoals.fat, unit: 'g', color: 'var(--warning)' },
            { name: 'น้ำ', data: dailyGoals.water, unit: 'ml', color: 'var(--success)' }
          ].map((macro, index) => (
            <div key={index} style={{
              textAlign: 'center',
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              cursor: 'pointer'
            }}
            onClick={() => macro.name === 'น้ำ' && setShowWaterTracker(true)}
            >
              <div style={{
                width: '60px',
                height: '60px',
                margin: '0 auto 0.75rem',
                position: 'relative'
              }}>
                <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="30"
                    cy="30"
                    r="25"
                    fill="none"
                    stroke="var(--border-color)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="25"
                    fill="none"
                    stroke={macro.color}
                    strokeWidth="6"
                    strokeDasharray={`${getMacroPercentage(macro.data?.consumed || 0, macro.data?.target || 1) * 1.57} 157`}
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '0.625rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  {Math.round(getMacroPercentage(macro.data?.consumed || 0, macro.data?.target || 1))}%
                </div>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.25rem' }}>
                {macro.name === 'น้ำ' ? `${((macro.data?.consumed || 0) / 1000).toFixed(1)}L` : `${macro.data?.consumed || 0}${macro.unit}`}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {macro.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meals Section */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            มื้ออาหารวันนี้
          </h3>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {meals.length > 0 ? meals.map((meal, index) => (
              <div key={meal.id} style={{
                padding: '1.5rem',
                backgroundColor: meal.completed ? 'rgba(72, 187, 120, 0.05)' : 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: meal.completed ? '1px solid rgba(72, 187, 120, 0.2)' : '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {meal.name}
                    </h4>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {meal.time} • {meal.calories || 0} แคลอรี่
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {meal.completed ? (
                      <CheckCircle size={24} color="var(--success)" />
                    ) : (
                      <button
                        onClick={() => markMealCompleted(meal.id)}
                        disabled={actionLoading}
                        style={{
                          backgroundColor: 'var(--primary)',
                          color: 'var(--text-white)',
                          border: 'none',
                          borderRadius: '0.5rem',
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        {actionLoading ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                        เสร็จสิ้น
                      </button>
                    )}
                  </div>
                </div>

                {meal.foods && meal.foods.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    {meal.foods.map((food, foodIndex) => (
                      <div key={food.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                            {food.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {food.calories || 0} cal • {food.protein || 0}g โปรตีน
                          </div>
                        </div>
                        <button
                          onClick={() => removeFoodFromMeal(meal.id, food.id)}
                          disabled={actionLoading}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                            color: 'var(--danger)',
                            padding: '0.25rem'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem', 
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    marginBottom: '1rem'
                  }}>
                    ยังไม่มีอาหารในมื้อนี้
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedMeal(meal);
                    setShowFoodSearch(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'var(--accent)',
                    color: 'var(--text-white)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Plus size={16} />
                  เพิ่มอาหาร
                </button>
              </div>
            )) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem', 
                color: 'var(--text-muted)' 
              }}>
                <Utensils size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  ยังไม่มีมื้ออาหาร
                </h3>
                <p style={{ marginBottom: '1.5rem' }}>
                  เริ่มต้นบันทึกมื้ออาหารของคุณวันนี้
                </p>
                <button
                  onClick={() => setShowFoodSearch(true)}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--text-white)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  เพิ่มอาหาร
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Supplements Section */}
      {supplements.length > 0 && (
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                ซัพพลีเมนต์วันนี้
              </h3>
              <button
                onClick={() => setShowSupplementModal(true)}
                style={{
                  backgroundColor: 'var(--accent)',
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
                <Plus size={16} />
                เพิ่ม
              </button>
            </div>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {supplements.map(supplement => (
                <div key={supplement.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: supplement.taken ? 'rgba(72, 187, 120, 0.05)' : 'var(--bg-secondary)',
                  borderRadius: '0.5rem',
                  border: supplement.taken ? '1px solid rgba(72, 187, 120, 0.2)' : '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '50%',
                      backgroundColor: supplement.color || 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-white)'
                    }}>
                      <Pill size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {supplement.name}
                      </h4>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {supplement.dosage} • {supplement.frequency}
                      </div>
                      {supplement.notes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {supplement.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => updateSupplementStatus(supplement.id)}
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '50%',
                      border: supplement.taken ? 'none' : '2px solid var(--border-color)',
                      backgroundColor: supplement.taken ? 'var(--success)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {supplement.taken && <Check size={14} color="white" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render Nutrition Plan Tab
  const renderPlanTab = () => {
    if (!nutritionPlan) {
      return (
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <Target size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            ยังไม่มีแผนโภชนาการ
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            ติดต่อเทรนเนอร์ของคุณเพื่อขอแผนโภชนาการ
          </p>
          <button style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}>
            ติดต่อเทรนเนอร์
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Plan Header */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-white)',
              fontSize: '1.5rem',
              fontWeight: '700'
            }}>
              {nutritionPlan.trainer?.avatar || nutritionPlan.trainer?.name?.charAt(0) || 'T'}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {nutritionPlan.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <User size={14} />
                  <span>{nutritionPlan.trainer?.name}</span>
                </div>
                {nutritionPlan.trainer?.rating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Star size={14} color="#ffc107" fill="#ffc107" />
                    <span>{nutritionPlan.trainer.rating}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={14} />
                  <span>{nutritionPlan.duration}</span>
                </div>
              </div>
            </div>
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(72, 187, 120, 0.1)',
              color: 'var(--success)',
              borderRadius: '1rem',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              สัปดาห์ที่ {nutritionPlan.currentWeek}
            </div>
          </div>

          <div style={{
            padding: '1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              🎯 เป้าหมายของคุณ
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {nutritionPlan.description}
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
                  {nutritionPlan.targetWeight} kg
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>น้ำหนักเป้าหมาย</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                  {nutritionPlan.currentWeight} kg
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>น้ำหนักปัจจุบัน</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)' }}>
                  -{nutritionPlan.weeklyGoals?.calorieDeficit || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>แคลอรี่/วัน</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--info)' }}>
                  {nutritionPlan.weeklyGoals?.proteinIntake || 0}g
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>โปรตีน/วัน</div>
              </div>
            </div>

            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--border-color)',
              borderRadius: '1rem',
              overflow: 'hidden',
              marginBottom: '1rem'
            }}>
              <div style={{
                height: '100%',
                width: `${((nutritionPlan.currentWeight - nutritionPlan.targetWeight) / (nutritionPlan.currentWeight - nutritionPlan.targetWeight + 5)) * 100}%`,
                backgroundColor: 'var(--success)',
                borderRadius: '1rem'
              }}></div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              ความคืบหน้า: {nutritionPlan.currentWeight - nutritionPlan.targetWeight} kg เหลือ
            </div>
          </div>

          {nutritionPlan.guidelines && (
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'rgba(35, 41, 86, 0.05)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(35, 41, 86, 0.1)'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '1rem' }}>
                📋 หลักการและแนวทาง
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {nutritionPlan.guidelines.map((guideline, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <CheckCircle size={16} color="var(--success)" style={{ marginTop: '0.125rem', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{guideline}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-color)',
            padding: '0.25rem'
          }}>
            <button
              onClick={() => setPlanViewMode('weekly')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: planViewMode === 'weekly' ? 'var(--primary)' : 'transparent',
                color: planViewMode === 'weekly' ? 'var(--text-white)' : 'var(--text-primary)',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              รายสัปดาห์
            </button>
            <button
              onClick={() => setPlanViewMode('daily')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: planViewMode === 'daily' ? 'var(--primary)' : 'transparent',
                color: planViewMode === 'daily' ? 'var(--text-white)' : 'var(--text-primary)',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              รายวัน
            </button>
          </div>
          <button
            onClick={() => setShowRecipeModal(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <ChefHat size={16} />
            สูตรอาหาร
          </button>
        </div>

        {/* Weekly/Daily Meal Plan */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            แผนอาหาร{planViewMode === 'weekly' ? 'สัปดาห์นี้' : 'วันนี้'}
          </h3>
          
          {nutritionPlan.weeklyMeals && nutritionPlan.weeklyMeals.length > 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem', 
              color: 'var(--text-secondary)' 
            }}>
              แผนอาหารจะแสดงที่นี่ (ข้อมูลจาก API)
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              color: 'var(--text-muted)' 
            }}>
              <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                ยังไม่มีแผนอาหาร
              </h3>
              <p style={{ marginBottom: '1.5rem' }}>
                เทรนเนอร์ของคุณยังไม่ได้สร้างแผนอาหารรายละเอียด
              </p>
              <button style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--text-white)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}>
                ขอแผนอาหารจากเทรนเนอร์
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render History Tab
  const renderHistoryTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Progress Chart */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            📈 ความก้าวหน้า 30 วันที่ผ่านมา
          </h3>
          <button
            onClick={() => setShowProgressModal(true)}
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
            <BarChart3 size={16} />
            ดูรายละเอียด
          </button>
        </div>

        {progressHistory.length > 0 ? (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)', marginBottom: '0.5rem' }}>
                  -{(progressHistory[0]?.weight - progressHistory[progressHistory.length - 1]?.weight || 0).toFixed(1)}kg
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>การเปลี่ยนแปลงน้ำหนัก</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                  ↓ ลดลง {((progressHistory[0]?.weight - progressHistory[progressHistory.length - 1]?.weight || 0) / progressHistory[0]?.weight * 100).toFixed(1)}%
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                  {Math.round(progressHistory.reduce((sum, entry) => sum + entry.calories, 0) / progressHistory.length)}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>แคลอรี่เฉลี่ย/วัน</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                  ตรงเป้าหมาย 99%
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent)', marginBottom: '0.5rem' }}>
                  {Math.round(progressHistory.reduce((sum, entry) => sum + entry.protein, 0) / progressHistory.length)}g
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>โปรตีนเฉลี่ย/วัน</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                  ↑ เพิ่มขึ้น 12%
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--info)', marginBottom: '0.5rem' }}>
                  {(progressHistory.reduce((sum, entry) => sum + entry.water, 0) / progressHistory.length / 1000).toFixed(1)}L
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>น้ำเฉลี่ย/วัน</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.25rem' }}>
                  ต่ำกว่าเป้า 8%
                </div>
              </div>
            </div>

            {/* Progress History List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {progressHistory.slice(0, 5).map((entry, index) => (
                <div key={index} style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {new Date(entry.date).toLocaleDateString('th-TH', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          อารมณ์: <span style={{ 
                            color: entry.mood === 'ดี' ? 'var(--success)' : 
                                 entry.mood === 'ปกติ' ? 'var(--info)' : 'var(--warning)' 
                          }}>
                            {entry.mood}
                          </span>
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          พลังงาน: <span style={{ color: 'var(--primary)' }}>{entry.energy}/10</span>
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {entry.weight} kg
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        น้ำหนัก
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--accent)' }}>
                        {entry.calories}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>แคลอรี่</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--primary)' }}>
                        {entry.protein}g
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>โปรตีน</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--info)' }}>
                        {(entry.water / 1000).toFixed(1)}L
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>น้ำ</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--success)' }}>
                        {entry.bodyFat}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ไขมัน</div>
                    </div>
                  </div>

                  {entry.notes && (
                    <div style={{
                      padding: '0.75rem',
                      backgroundColor: 'rgba(35, 41, 86, 0.05)',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(35, 41, 86, 0.1)'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '0.25rem' }}>
                        📝 บันทึกเพิ่มเติม:
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {entry.notes}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            color: 'var(--text-muted)' 
          }}>
            <BarChart3 size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              ยังไม่มีประวัติ
            </h3>
            <p>
              เริ่มบันทึกอาหารเพื่อดูความก้าวหน้าของคุณ
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Render Recommendations Tab
  const renderRecommendationsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* AI Recommendations */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              🤖 คำแนะนำจาก AI และเทรนเนอร์
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              คำแนะนำที่ปรับแต่งเฉพาะสำหรับคุณ อิงจากข้อมูลการบริโภคและเป้าหมาย
            </p>
          </div>
          <button
            onClick={() => setShowGoalsModal(true)}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--text-white)',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <Target size={16} />
            ตั้งเป้าหมายใหม่
          </button>
        </div>

        {recommendations.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recommendations.map(rec => (
              <div key={rec.id} style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: `1px solid ${rec.color}20`,
                borderLeft: `4px solid ${rec.color}`
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    backgroundColor: `${rec.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <rec.icon size={16} color={rec.color} />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {rec.title}
                      </h4>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: 
                          rec.priority === 'สูง' ? 'rgba(239, 68, 68, 0.1)' :
                          rec.priority === 'กลาง' ? 'rgba(245, 158, 11, 0.1)' :
                          'rgba(156, 163, 175, 0.1)',
                        color: 
                          rec.priority === 'สูง' ? 'var(--danger)' :
                          rec.priority === 'กลาง' ? 'var(--warning)' :
                          'var(--text-muted)'
                      }}>
                        {rec.priority}
                      </span>
                    </div>
                    
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
                      {rec.description}
                    </p>
                    
                    <div style={{
                      padding: '1rem',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-color)',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        💡 คำแนะนำ:
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {rec.suggestion}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      เหตุผล: {rec.reason}
                    </div>
                    
                    <button style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: rec.color,
                      color: 'var(--text-white)',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}>
                      {rec.action}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            color: 'var(--text-muted)' 
          }}>
            <Lightbulb size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              ยังไม่มีคำแนะนำ
            </h3>
            <p>
              บันทึกอาหารเป็นประจำเพื่อรับคำแนะนำที่เหมาะสม
            </p>
          </div>
        )}
      </div>

      {/* Recipe Recommendations */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            👨‍🍳 สูตรอาหารแนะนำ
          </h3>
          <button
            onClick={() => setShowRecipeModal(true)}
            style={{
              backgroundColor: 'var(--accent)',
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
            <ChefHat size={16} />
            ดูทั้งหมด
          </button>
        </div>

        {recipeDatabase.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {recipeDatabase.slice(0, 3).map(recipe => (
              <div key={recipe.id} style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onClick={() => {
                setSelectedRecipe(recipe);
                setShowRecipeModal(true);
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <div style={{
                  height: '150px',
                  backgroundColor: 'var(--border-color)',
                  backgroundImage: `url(${recipe.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    left: '0.75rem',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {recipe.category}
                  </div>
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    borderRadius: '1rem',
                    fontSize: '0.75rem'
                  }}>
                    <Star size={12} fill="#ffc107" color="#ffc107" />
                    {recipe.rating}
                  </div>
                </div>
                
                <div style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {recipe.name}
                  </h4>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--accent)' }}>
                        {recipe.calories}
                      </div>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>cal</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary)' }}>
                        {recipe.protein}g
                      </div>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>โปรตีน</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--info)' }}>
                        {recipe.cookTime}
                      </div>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>นาที</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--success)' }}>
                        {recipe.difficulty}
                      </div>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>ระดับ</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {recipe.tags?.slice(0, 2).map((tag, index) => (
                      <span key={index} style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'rgba(35, 41, 86, 0.1)',
                        color: 'var(--primary)',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            color: 'var(--text-muted)' 
          }}>
            <ChefHat size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              ยังไม่มีสูตรอาหาร
            </h3>
            <p>
              สูตรอาหารจะปรากฏเมื่อมีข้อมูลจากเทรนเนอร์
            </p>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          💡 เคล็ดลับและความรู้
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
          gap: '1rem'
        }}>
          {[
            {
              icon: '🥗',
              title: 'กินผักให้หลากหลาย',
              tip: 'รับประทานผักอย่างน้อย 5 สี ต่อวัน เพื่อได้วิตามินและแร่ธาตุครบถ้วน'
            },
            {
              icon: '🏃‍♂️',
              title: 'ออกกำลังกายหลังอาหาร',
              tip: 'เดิน 10-15 นาทีหลังอาหาร ช่วยควบคุมระดับน้ำตาลในเลือด'
            },
            {
              icon: '💧',
              title: 'ดื่มน้ำก่อนอาหาร',
              tip: 'ดื่มน้ำ 1 แก้วก่อนอาหาร 30 นาที ช่วยเพิ่มความรู้สึกอิ่ม'
            },
            {
              icon: '🍽️',
              title: 'กินช้าๆ เคี้ยวดีๆ',
              tip: 'ใช้เวลาอย่างน้อย 20 นาทีต่อมื้อ ช่วยให้สมองรับรู้ความอิ่ม'
            }
          ].map((tip, index) => (
            <div key={index} style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{tip.icon}</div>
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {tip.title}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {tip.tip}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Simple Recipe Modal
  const RecipeModal = () => {
    if (!showRecipeModal) return null;

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
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              📚 คลังสูตรอาหาร
            </h2>
            <button
              onClick={() => {
                setShowRecipeModal(false);
                setSelectedRecipe(null);
              }}
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

          {recipeDatabase.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {recipeDatabase.map(recipe => (
                <div key={recipe.id} style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}>
                  <div style={{
                    height: '150px',
                    backgroundColor: 'var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ChefHat size={48} color="var(--text-muted)" />
                  </div>
                  
                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      {recipe.name}
                    </h3>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {recipe.calories} cal • {recipe.cookTime} นาที • {recipe.difficulty}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              color: 'var(--text-muted)' 
            }}>
              <ChefHat size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                ยังไม่มีสูตรอาหาร
              </h3>
              <p>
                สูตรอาหารจะปรากฏเมื่อมีข้อมูลจากระบบ
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      padding: windowWidth <= 768 ? '1rem' : '2rem',
      backgroundColor: 'var(--bg-secondary)',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: windowWidth <= 768 ? '1.5rem' : '1.75rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          marginBottom: '0.5rem' 
        }}>
          โภชนาการ
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          ติดตามและจัดการโภชนาการของคุณ พร้อมแผนจากเทรนเนอร์
        </p>
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
        {activeTab === 'today' && renderTodayTab()}
        {activeTab === 'plan' && renderPlanTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'recommendations' && renderRecommendationsTab()}
      </div>

      {/* Modals */}
      <RecipeModal />

      <style>
        {`
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ClientNutrition;