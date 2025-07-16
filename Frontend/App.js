import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import Main Website Components
import MainWebsite from './components/main/MainWebsite';
import HomePage from './pages/main/HomePage';
import SearchPage from './pages/main/TrainerSearchPage';
import TrainerDetail from './pages/main/TrainerDetailPage';
import EventsPage from './pages/main/EventsPage';  
import GymsPage from './pages/main/GymsPage';
import ArticlesPage from './pages/main/ArticlesPage';
import ContactPage from './pages/main/ContactPage';
import SignInPage from './pages/main/SignInPage';
import SignUpPage from './pages/main/SignUpPage';
import ForgotPassword from './pages/main/ForgotPasswordPage';

// Import Dashboard Systems 
import AdminDashboard from './components/admin/AdminLayout';
import TrainerDashboard from './components/trainer/TrainerMainDashboard';
import ClientDashboard from './components/client/MainClientDashboard';
/*
// Import Dashboard Pages - Admin
import DashboardOverview from './components/admin/DashboardOverview';
import MembersManagement from './components/admin/MembersManagement';
import ContentManagement from './components/admin/ContentManagement';
import EventsManagement from './components/admin/EventsManagement';
import GymsManagement from './components/admin/GymsManagement';
import ReviewsManagement from './components/admin/ReviewsManagement';
import PartnersManagement from './components/admin/PartnersManagement';
import MediaManagement from './components/admin/MediaManagement';
import FinanceManagement from './components/admin/FinanceManagement';
import SessionsManagement from './components/admin/SessionsManagement';
import ReportsPage from './components/admin/ReportsPage';
import SupportManagement from './components/admin/SupportManagement';
import AdminChatPage from './components/admin/AdminChatPage';
import SystemSettings from './components/admin/SystemSettings';
import CouponManagement from './components/admin/CouponManagement';

// Import Financial System Components
import TrainerBillingSystem from './components/admin/financial/TrainerBillingSystem';
import BillingAutomationSystem from './components/admin/financial/BillingAutomationSystem';
import FinancialReportingDashboard from './components/admin/financial/FinancialReportingDashboard';

// Import Trainer Dashboard Pages
import TrainerDashboardOverview from './components/trainer/DashboardOverview';
import ClientsPage from './components/trainer/ClientsPage';
import SchedulePage from './components/trainer/SchedulePage';
import NutritionPage from './components/trainer/NutritionPage';
import TrackingPage from './components/trainer/TrackingPage';
import TrainerChatPage from './components/trainer/ChatPage';
import RevenuePage from './components/trainer/TrainerFinanceDashboard';
import ProfilePage from './components/trainer/ProfilePage';
import TrainerSettingsPage from './components/trainer/SettingsPage';
import EIDCardPage from './components/trainer/EIDCardPage';
import TrainerReviewsPage from './components/trainer/ReviewsPage';
import TrainerCouponsPage from './components/trainer/CouponsPage';

// Import Client Dashboard Pages  
import ClientDashboardOverview from './components/client/ClientDashboardOverview';
import ClientWorkoutPlan from './components/client/ClientWorkoutPlan';
import ClientSchedule from './components/client/ClientSchedule';
import ClientProgress from './components/client/ClientProgress';
import ClientNutrition from './components/client/ClientNutrition';
import ClientMessages from './components/client/ClientChatPage';
import ClientReviews from './components/client/ClientReviews';
import ClientAchievements from './components/client/ClientAchievements';
import ClientNotifications from './components/client/ClientNotifications';
import ClientBilling from './components/client/ClientBilling';
import ClientSettings from './components/client/ClientSettings';
import ClientCoupons from './components/client/ClientCoupons';
*/
// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1 style={{ color: '#df2528' }}>⚠️ เกิดข้อผิดพลาด</h1>
          <p>กรุณาตรวจสอบ Console สำหรับรายละเอียด</p>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '1rem', 
            borderRadius: '5px', 
            marginBottom: '1rem',
            fontFamily: 'monospace',
            maxWidth: '600px',
            wordWrap: 'break-word'
          }}>
            {this.state.error?.toString()}
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#232956',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            รีโหลดหน้า
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState('checking');

  // Test API connection on component mount
  useEffect(() => {
    const testApiConnection = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/test');
        if (response.ok) {
          setApiStatus('connected');
        } else {
          setApiStatus('disconnected');
        }
      } catch (error) {
        console.error('API connection failed:', error);
        setApiStatus('disconnected');
      } finally {
        setIsLoading(false);
      }
    };

    testApiConnection();
  }, []);

  // Show loading screen while checking API
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
        background: 'linear-gradient(135deg, #232956 0%, #df2528 100%)',
        color: 'white'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '5px solid rgba(255,255,255,0.3)',
          borderTop: '5px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>กำลังโหลด...</h2>
        <div style={{ 
          fontSize: '0.875rem', 
          marginTop: '1rem',
          opacity: 0.8,
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '0.5rem' }}>
            ตรวจสอบการเชื่อมต่อ Backend API...
          </div>
          <div style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '20px',
            display: 'inline-block'
          }}>
            {apiStatus === 'connected' ? '✅ เชื่อมต่อสำเร็จ' :
             apiStatus === 'disconnected' ? '⚠️ ไม่พบการเชื่อมต่อ' :
             '🔄 กำลังตรวจสอบ...'}
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* ==================== MAIN WEBSITE ROUTES ==================== */}
          <Route path="/" element={<MainWebsite />}>
            {/* Home Page */}
            <Route index element={<HomePage />} />
            
            {/* Main Website Pages */}
            <Route path="search" element={<SearchPage />} />
            <Route path="trainerdetail" element={<TrainerDetail />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="gyms" element={<GymsPage />} />
            <Route path="articles" element={<ArticlesPage />} />
            <Route path="contact" element={<ContactPage />} />
            
            {/* Authentication Pages */}
            <Route path="signin" element={<SignInPage />} />
            <Route path="signup" element={<SignUpPage />} />
            <Route path="forgotpasswordpage" element={<ForgotPassword />} />
          </Route>

          {/* ==================== ADMIN DASHBOARD ROUTES ==================== */}
          <Route path="/admin/*" element={<AdminDashboard />} />

          {/* ==================== TRAINER DASHBOARD ROUTES ==================== */}
          <Route path="/trainer/*" element={<TrainerDashboard />} />

          {/* ==================== CLIENT DASHBOARD ROUTES ==================== */}
          <Route path="/client/*" element={<ClientDashboard />} />
          
          {/* ==================== 404 NOT FOUND ==================== */}
          <Route path="*" element={
            <div style={{ 
              padding: '4rem 2rem', 
              textAlign: 'center',
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
            }}>
              <div style={{
                background: 'white',
                padding: '3rem',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                maxWidth: '600px'
              }}>
                <h1 style={{ 
                  fontSize: '6rem', 
                  margin: '0', 
                  color: '#df2528',
                  fontWeight: '900',
                  textShadow: '0 5px 10px rgba(223,37,40,0.3)'
                }}>404</h1>
                <h2 style={{ 
                  color: '#232956', 
                  marginBottom: '1rem',
                  fontSize: '1.5rem'
                }}>ไม่พบหน้าที่คุณต้องการ</h2>
                <p style={{ 
                  color: '#6c757d', 
                  marginBottom: '2rem',
                  lineHeight: '1.6'
                }}>
                  หน้าที่คุณกำลังมองหาอาจถูกย้าย ลบ หรือไม่เคยมีอยู่จริง
                </p>

                {/* Quick Fixes Section */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  marginBottom: '2rem',
                  textAlign: 'left'
                }}>
                  <h4 style={{ color: '#232956', marginBottom: '1rem' }}>🔧 แก้ไข Errors ที่พบบ่อย:</h4>
                  <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    <strong>1. ติดตั้ง Dependencies:</strong>
                  </div>
                  <div style={{ 
                    backgroundColor: '#343a40', 
                    color: '#f8f9fa', 
                    padding: '0.5rem',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    marginBottom: '1rem'
                  }}>
                    npm install recharts lucide-react react-router-dom
                  </div>
                  <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    <strong>2. แก้ไข ESLint (ถ้ามี error):</strong>
                  </div>
                  <div style={{ 
                    backgroundColor: '#343a40', 
                    color: '#f8f9fa', 
                    padding: '0.5rem',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem'
                  }}>
                    npm install --save-dev eslint-plugin-react-hooks
                  </div>
                </div>

                <a 
                  href="/" 
                  style={{
                    display: 'inline-block',
                    padding: '1rem 2rem',
                    backgroundColor: '#232956',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '50px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 5px 15px rgba(35,41,86,0.3)'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  🏠 กลับสู่หน้าแรก
                </a>
              </div>
            </div>
          } />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;