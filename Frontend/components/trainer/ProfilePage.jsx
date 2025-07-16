import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, Edit, Trash2, Plus, Check, X, Star,
  MapPin, Phone, Mail, Calendar, Award, Target, Clock,
  Briefcase, GraduationCap, Heart, Zap, Shield, Users,
  ChevronDown, Save, Loader
} from 'lucide-react';

const ProfilePage = ({ windowWidth }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [apiError, setApiError] = useState('');

  // Service areas data and state
  const availableAreas = {
    'กรุงเทพฯ': [
      'พระนคร', 'ดุสิต', 'หนองจอก', 'บางรัก', 'บางเขน', 'บางกะปิ', 'ปทุมวัน', 
      'ป้อมปราบศัตรูพ่าย', 'พระโขนง', 'มีนบุรี', 'ลาดกระบัง', 'ยานนาวา', 'สัมพันธวงศ์', 
      'พญาไท', 'ธนบุรี', 'บางกอกใหญ่', 'ห้วยขวาง', 'คลองเตย', 'สาทร', 'บางนา', 
      'บางพลัด', 'ดินแดง', 'บึงกุ่ม', 'ราชเทวี', 'ลาดพร้าว', 'วัฒนา', 'บางซื่อ', 
      'หลักสี่', 'ภาษีเจริญ', 'หนองแขม', 'ราษฎร์บูรณะ', 'บางโพ', 'ดอนเมือง', 'สวนหลวง', 
      'จตุจักร', 'สะพานพุทธ', 'วังธนบุรี', 'คันนายาว', 'ตลิ่งชัน', 'คลองสาน', 'จอมทอง', 
      'บางคอแหลม', 'ประเวศ', 'คลองสามวา', 'บางบอน', 'ทวีวัฒนา', 'บางขุนเทียน', 'ทุ่งครุ', 
      'บางแค', 'หนองเขม'
    ],
    'ภาคเหนือ': [
      'เชียงใหม่', 'เชียงราย', 'ลำปาง', 'ลำพูน', 'แม่ฮ่องสอน', 'น่าน', 'พะเยา', 'แพร่', 
      'อุตรดิตถ์', 'ตาก', 'สุโขทัย', 'พิษณุโลก', 'กำแพงเพชร', 'นครสวรรค์', 'อุทัยธานี', 
      'ชัยนาท', 'พิจิตร'
    ],
    'ภาคตะวันออกเฉียงเหนือ': [
      'นครราชสีมา', 'ชัยภูมิ', 'ขอนแก่น', 'มหาสารคาม', 'ร้อยเอ็ด', 'กาฬสินธุ์', 'สกลนคร', 
      'หนองคาย', 'เลย', 'หนองบัวลำภู', 'อุดรธานี', 'บึงกาฬ', 'ยโสธร', 'อำนาจเจริญ', 
      'มุกดาหาร', 'ศรีสะเกษ', 'สุรินทร์', 'บุรีรัมย์', 'อุบลราชธานี'
    ],
    'ภาคกลาง': [
      'ลพบุรี', 'ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด', 'ฉะเชิงเทรา', 'ปราจีนบุรี', 
      'นครนายก', 'สระแก้ว', 'อยุธยา', 'อ่างทอง', 'สิงห์บุรี', 'สระบุรี', 'นนทบุรี', 
      'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสงคราม', 'สมุทรสาคร', 'นครปทุม', 'สุพรรณบุรี', 
      'กาญจนบุรี', 'ราชบุรี', 'เพชรบุรี', 'ประจวบคีรีขันธ์'
    ],
    'ภาคใต้': [
      'ชุมพร', 'ระนอง', 'สุราษฎร์ธานี', 'พังงา', 'ภูเก็ต', 'กระบี่', 'นครศรีธรรมราช', 
      'ตรัง', 'พัทลุง', 'สตูล', 'สงขลา', 'ปัตตานี', 'ยะลา', 'นราธิวาส'
    ]
  };
  
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const areaDropdownRef = useRef(null);

  // Updated initial state with default values
  const [trainerInfo, setTrainerInfo] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: 'male',
    lineId: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    bio: '',
    
    // Business Info
    businessBio: '',
    experience: '',
    serviceAreas: [],
    educationHistory: '',
    workHistory: '',
    certifications: '',
    
    // Working Hours
    workingHours: {
      monday: { start: '09:00', end: '18:00', available: true },
      tuesday: { start: '09:00', end: '18:00', available: true },
      wednesday: { start: '09:00', end: '18:00', available: true },
      thursday: { start: '09:00', end: '18:00', available: true },
      friday: { start: '09:00', end: '18:00', available: true },
      saturday: { start: '09:00', end: '18:00', available: true },
      sunday: { start: '09:00', end: '18:00', available: false }
    },
    
    // Payment Info
    basicRate: 0,
    paymentMethods: {
      cash: false,
      bankTransfer: false,
      promptPay: false
    },
    bankAccounts: [],
    promptPay: {
      number: '',
      name: ''
    },
    termsConditions: ''
  });

  const [expertise, setExpertise] = useState([]);
  const [packages, setPackages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);

  const dayNames = {
    monday: 'จันทร์',
    tuesday: 'อังคาร',
    wednesday: 'พุธ',
    thursday: 'พฤหัสบดี',
    friday: 'ศุกร์',
    saturday: 'เสาร์',
    sunday: 'อาทิตย์'
  };

  // Switch Component
  const Switch = ({ checked, onChange, disabled = false }) => (
    <div 
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: '3rem',
        height: '1.5rem',
        backgroundColor: checked ? '#df2528' : '#d1d5db',
        borderRadius: '0.75rem',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s',
        opacity: disabled ? 0.5 : 1
      }}
    >
      <div style={{
        width: '1.25rem',
        height: '1.25rem',
        backgroundColor: 'white',
        borderRadius: '50%',
        position: 'absolute',
        top: '0.125rem',
        left: checked ? '1.625rem' : '0.125rem',
        transition: 'left 0.2s',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
      }} />
    </div>
  );

  // Radio Button Component
  const RadioButton = ({ checked, onChange, name, value, label }) => (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      cursor: 'pointer',
      fontSize: '0.875rem'
    }}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        style={{ display: 'none' }}
      />
      <div style={{
        width: '1.25rem',
        height: '1.25rem',
        borderRadius: '50%',
        border: `2px solid ${checked ? '#df2528' : '#d1d5db'}`,
        backgroundColor: 'white',
        position: 'relative',
        transition: 'border-color 0.2s'
      }}>
        {checked && (
          <div style={{
            width: '0.5rem',
            height: '0.5rem',
            borderRadius: '50%',
            backgroundColor: '#df2528',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }} />
        )}
      </div>
      {label}
    </label>
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(event.target)) {
        setShowAreaDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch trainer data on component mount
  useEffect(() => {
    fetchTrainerData();
  }, []);

  // Check if token exists
  const getAuthToken = () => {
    const token = localStorage.getItem('trainer_token') || localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found');
      setApiError('ไม่พบ token การยืนยันตัวตน กรุณาเข้าสู่ระบบใหม่');
      return null;
    }
    return token;
  };

  // Improved API call function with better error handling
  const apiCall = async (url, method = 'GET', data = null) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
      }

      console.log(`Making API call to: /api/trainer${url}`);
      
      const response = await fetch(`/api/trainer${url}`, config);
      
      // Handle different response types
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error ${response.status}:`, errorText);
        
        if (response.status === 401) {
          throw new Error('Authentication failed - Please login again');
        } else if (response.status === 404) {
          throw new Error(`Endpoint not found: ${url}`);
        } else if (response.status >= 500) {
          throw new Error('Server error - Please try again later');
        } else {
          throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`);
        }
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        console.warn('Non-JSON response received');
        return { success: true, data: {} };
      }
      
    } catch (error) {
      console.error(`API call failed for ${url}:`, error);
      throw error;
    }
  };

  // Improved fetch trainer data with individual error handling
  const fetchTrainerData = async () => {
    setIsDataLoading(true);
    setApiError('');
    
    try {
      const token = getAuthToken();
      if (!token) {
        return;
      }

      console.log('Starting to fetch trainer data...');

      // Fetch data individually to avoid failing all if one fails
      const fetchPersonalInfo = async () => {
        try {
          const data = await apiCall('/personal-info');
          console.log('Personal info response:', data);
          
          if (data && (data.success !== false)) {
            const personalData = data.data || data;
            setTrainerInfo(prev => ({
              ...prev,
              firstName: personalData.firstName || personalData.first_name || prev.firstName,
              lastName: personalData.lastName || personalData.last_name || prev.lastName,
              email: personalData.email || prev.email,
              phone: personalData.phone || prev.phone,
              birthDate: personalData.birthDate || personalData.birth_date || prev.birthDate,
              gender: personalData.gender || prev.gender,
              lineId: personalData.lineId || personalData.line_id || prev.lineId,
              facebook: personalData.facebook || prev.facebook,
              instagram: personalData.instagram || prev.instagram,
              tiktok: personalData.tiktok || prev.tiktok,
              bio: personalData.bio || prev.bio
            }));
          }
        } catch (error) {
          console.warn('Failed to fetch personal info:', error);
          // Set some default values if API fails
          setTrainerInfo(prev => ({
            ...prev,
            firstName: prev.firstName || 'ไม่ระบุ',
            lastName: prev.lastName || '',
            email: prev.email || ''
          }));
        }
      };

      const fetchBusinessInfo = async () => {
        try {
          const data = await apiCall('/business-info');
          console.log('Business info response:', data);
          
          if (data && (data.success !== false)) {
            const businessData = data.data || data;
            setTrainerInfo(prev => ({
              ...prev,
              businessBio: businessData.businessBio || businessData.business_bio || prev.businessBio,
              experience: businessData.experience || prev.experience,
              serviceAreas: businessData.serviceAreas || businessData.service_areas || prev.serviceAreas,
              educationHistory: businessData.educationHistory || businessData.education_history || prev.educationHistory,
              workHistory: businessData.workHistory || businessData.work_history || prev.workHistory,
              certifications: businessData.certifications || prev.certifications
            }));

            if (businessData.expertise && Array.isArray(businessData.expertise)) {
              setExpertise(businessData.expertise);
            }
          }
        } catch (error) {
          console.warn('Failed to fetch business info:', error);
        }
      };

      const fetchWorkingHours = async () => {
        try {
          const data = await apiCall('/working-hours');
          console.log('Working hours response:', data);
          
          if (data && (data.success !== false) && data.data && data.data.workingHours) {
            setTrainerInfo(prev => ({
              ...prev,
              workingHours: {
                ...prev.workingHours,
                ...data.data.workingHours
              }
            }));
          }
        } catch (error) {
          console.warn('Failed to fetch working hours:', error);
        }
      };

      const fetchPricingInfo = async () => {
        try {
          const data = await apiCall('/pricing-info');
          console.log('Pricing info response:', data);
          
          if (data && (data.success !== false)) {
            const pricingData = data.data || data;
            setTrainerInfo(prev => ({
              ...prev,
              basicRate: pricingData.basicRate || pricingData.basic_rate || prev.basicRate,
              paymentMethods: pricingData.paymentMethods || pricingData.payment_methods || prev.paymentMethods,
              bankAccounts: pricingData.bankAccounts || pricingData.bank_accounts || prev.bankAccounts,
              promptPay: pricingData.promptPay || pricingData.prompt_pay || prev.promptPay,
              termsConditions: pricingData.termsConditions || pricingData.terms_conditions || prev.termsConditions
            }));

            if (pricingData.packages && Array.isArray(pricingData.packages)) {
              setPackages(pricingData.packages);
            }
          }
        } catch (error) {
          console.warn('Failed to fetch pricing info:', error);
        }
      };

      const fetchMediaInfo = async () => {
        try {
          const data = await apiCall('/media');
          console.log('Media info response:', data);
          
          if (data && (data.success !== false) && data.data && data.data.images && Array.isArray(data.data.images)) {
            setUploadedImages(data.data.images);
          }
        } catch (error) {
          console.warn('Failed to fetch media info:', error);
        }
      };

      // Execute all fetches concurrently but handle errors individually
      await Promise.allSettled([
        fetchPersonalInfo(),
        fetchBusinessInfo(),
        fetchWorkingHours(),
        fetchPricingInfo(),
        fetchMediaInfo()
      ]);

      console.log('Finished fetching trainer data');
      
    } catch (error) {
      console.error('Critical error in fetchTrainerData:', error);
      
      // Only set error if it's a critical error (like no token)
      if (error.message.includes('token') || error.message.includes('Authentication')) {
        setApiError('ไม่สามารถยืนยันตัวตนได้ กรุณาเข้าสู่ระบบใหม่');
      } else {
        // For other errors, just log them but don't block the UI
        console.warn('Non-critical error, using default values');
        setTrainerInfo(prev => ({
          ...prev,
          firstName: prev.firstName || 'ผู้ใช้งาน',
          lastName: prev.lastName || '',
          email: prev.email || '',
          phone: prev.phone || ''
        }));
      }
    } finally {
      setIsDataLoading(false);
    }
  };

  // Save functions with improved error handling
  const savePersonalInfo = async () => {
    setIsLoading(true);
    setApiError('');
    
    try {
      const personalData = {
        firstName: trainerInfo.firstName,
        lastName: trainerInfo.lastName,
        email: trainerInfo.email,
        phone: trainerInfo.phone,
        birthDate: trainerInfo.birthDate,
        gender: trainerInfo.gender,
        lineId: trainerInfo.lineId,
        facebook: trainerInfo.facebook,
        instagram: trainerInfo.instagram,
        tiktok: trainerInfo.tiktok,
        bio: trainerInfo.bio
      };
      
      const response = await apiCall('/personal-info', 'PUT', personalData);
      
      setSaveMessage('บันทึกข้อมูลส่วนตัวสำเร็จ');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Save personal info error:', error);
      setSaveMessage(`เกิดข้อผิดพลาด: ${error.message}`);
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBusinessInfo = async () => {
    setIsLoading(true);
    setApiError('');
    
    try {
      const businessData = {
        businessBio: trainerInfo.businessBio,
        experience: trainerInfo.experience,
        serviceAreas: trainerInfo.serviceAreas,
        educationHistory: trainerInfo.educationHistory,
        workHistory: trainerInfo.workHistory,
        certifications: trainerInfo.certifications,
        expertise: expertise
      };
      
      const response = await apiCall('/business-info', 'PUT', businessData);
      
      setSaveMessage('บันทึกข้อมูลธุรกิจสำเร็จ');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Save business info error:', error);
      setSaveMessage(`เกิดข้อผิดพลาด: ${error.message}`);
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const saveWorkingHours = async () => {
    setIsLoading(true);
    setApiError('');
    
    try {
      const response = await apiCall('/working-hours', 'PUT', { workingHours: trainerInfo.workingHours });
      
      setSaveMessage('บันทึกเวลาทำงานสำเร็จ');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Save working hours error:', error);
      setSaveMessage(`เกิดข้อผิดพลาด: ${error.message}`);
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const savePricingInfo = async () => {
    setIsLoading(true);
    setApiError('');
    
    try {
      const pricingData = {
        basicRate: trainerInfo.basicRate,
        packages: packages,
        paymentMethods: trainerInfo.paymentMethods,
        bankAccounts: trainerInfo.bankAccounts,
        promptPay: trainerInfo.promptPay,
        termsConditions: trainerInfo.termsConditions
      };
      
      const response = await apiCall('/pricing-info', 'PUT', pricingData);
      
      setSaveMessage('บันทึกข้อมูลราคาและแพคเกจสำเร็จ');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Save pricing info error:', error);
      setSaveMessage(`เกิดข้อผิดพลาด: ${error.message}`);
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Save images with improved error handling
  const saveImages = async (newImages) => {
    setIsLoading(true);
    setApiError('');
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const formData = new FormData();
      newImages.forEach((image, index) => {
        formData.append(`images`, image);
      });
      
      const response = await fetch('/api/trainer/media', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.success !== false) {
        setUploadedImages(result.data?.images || result.images || []);
        setSaveMessage('บันทึกรูปภาพสำเร็จ');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        throw new Error(result.message || 'Failed to save images');
      }
    } catch (error) {
      console.error('Save images error:', error);
      setSaveMessage(`เกิดข้อผิดพลาดในการบันทึกรูปภาพ: ${error.message}`);
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Service area functions
  const toggleServiceArea = (area) => {
    const updatedAreas = trainerInfo.serviceAreas.includes(area)
      ? trainerInfo.serviceAreas.filter(item => item !== area)
      : [...trainerInfo.serviceAreas, area];
    
    setTrainerInfo(prev => ({
      ...prev,
      serviceAreas: updatedAreas
    }));
  };

  // Get all areas as flat array for filtering
  const getAllAreas = () => {
    return Object.values(availableAreas).flat();
  };

  const removeServiceArea = (area) => {
    setTrainerInfo(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter(item => item !== area)
    }));
  };

  // Package functions
  const addExpertise = () => {
    const newExpertise = {
      id: Date.now(),
      name: '',
      percentage: 50
    };
    setExpertise([...expertise, newExpertise]);
  };

  const updateExpertise = (id, field, value) => {
    setExpertise(expertise.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeExpertise = (id) => {
    setExpertise(expertise.filter(item => item.id !== id));
  };

  const updatePackage = (id, field, value) => {
    setPackages(packages.map(pkg => 
      pkg.id === id ? { ...pkg, [field]: value } : pkg
    ));
  };

  const togglePackageActive = (id) => {
    setPackages(packages.map(pkg => 
      pkg.id === id ? { ...pkg, isActive: !pkg.isActive } : pkg
    ));
  };

  const setRecommendedPackage = (id) => {
    setPackages(packages.map(pkg => ({
      ...pkg,
      isRecommended: pkg.id === id
    })));
  };

  // Input handlers
  const handleInputChange = (field, value) => {
    setTrainerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWorkingHourChange = (day, field, value) => {
    setTrainerInfo(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }));
  };

  // Loading Screen Component
  const LoadingScreen = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '1rem'
    }}>
      <Loader size={48} style={{ color: '#df2528', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        กำลังโหลดข้อมูล...
      </p>
    </div>
  );

  // Improved Error Screen Component
  const ErrorScreen = () => (
    <div style={{
      padding: '2rem',
      backgroundColor: 'var(--bg-primary)',
      borderRadius: '1rem',
      border: '1px solid #ef4444',
      textAlign: 'center'
    }}>
      <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>เกิดข้อผิดพลาด</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{apiError}</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        สาเหตุที่เป็นไปได้:
      </p>
      <ul style={{ 
        textAlign: 'left', 
        color: 'var(--text-muted)', 
        fontSize: '0.875rem', 
        marginBottom: '1.5rem',
        listStyle: 'none',
        padding: 0
      }}>
        <li>• ไม่มีการเชื่อมต่อกับเซิร์ฟเวอร์</li>
        <li>• Token การยืนยันตัวตนหมดอายุ</li>
        <li>• API endpoints ยังไม่ได้ตั้งค่า</li>
        <li>• เซิร์ฟเวอร์ไม่ตอบสนอง</li>
      </ul>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          onClick={fetchTrainerData}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            backgroundColor: '#df2528',
            color: 'white',
            border: 'none'
          }}
        >
          ลองใหม่อีกครั้ง
        </button>
        <button
          onClick={() => {
            setApiError('');
            setIsDataLoading(false);
          }}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)'
          }}
        >
          ใช้งานแบบ Demo
        </button>
      </div>
    </div>
  );

  // Service Area Multiselect Component
  const ServiceAreaSelect = () => {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filter areas based on search term
    const getFilteredAreas = () => {
      if (!searchTerm) return availableAreas;
      
      const filtered = {};
      Object.entries(availableAreas).forEach(([region, areas]) => {
        const filteredAreas = areas.filter(area => 
          area.toLowerCase().includes(searchTerm.toLowerCase()) ||
          region.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filteredAreas.length > 0) {
          filtered[region] = filteredAreas;
        }
      });
      return filtered;
    };

    const filteredAreas = getFilteredAreas();
    const allAreas = getAllAreas();
    const availableUnselectedAreas = allAreas.filter(area => !trainerInfo.serviceAreas.includes(area));

    return (
      <div style={{ position: 'relative' }} ref={areaDropdownRef}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          พื้นที่ให้บริการ
        </label>
        
        {/* Selected Areas Tags */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          {trainerInfo.serviceAreas.map((area, index) => (
            <span key={index} style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#232956',
              color: 'white',
              borderRadius: '1rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {area}
              <button 
                onClick={() => removeServiceArea(area)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0.125rem',
                  fontSize: '0.75rem'
                }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>

        {/* Dropdown Button */}
        <button
          type="button"
          onClick={() => setShowAreaDropdown(!showAreaDropdown)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            backgroundColor: 'var(--bg-secondary)',
            outline: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'left'
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>เลือกพื้นที่ให้บริการ...</span>
          <ChevronDown 
            size={16} 
            style={{ 
              color: 'var(--text-secondary)',
              transform: showAreaDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }} 
          />
        </button>

        {/* Dropdown Menu */}
        {showAreaDropdown && availableUnselectedAreas.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 50,
            maxHeight: '400px',
            overflow: 'hidden'
          }}>
            {/* Search Input */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <input
                type="text"
                placeholder="ค้นหาจังหวัดหรือเขต..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--bg-secondary)',
                  outline: 'none'
                }}
              />
            </div>
            
            {/* Areas List */}
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {Object.entries(filteredAreas).map(([region, areas]) => (
                <div key={region}>
                  {/* Region Header */}
                  <div style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-secondary)',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    {region}
                  </div>
                  
                  {/* Areas in Region */}
                  {areas
                    .filter(area => !trainerInfo.serviceAreas.includes(area))
                    .map((area, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        toggleServiceArea(area);
                        setSearchTerm('');
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2rem',
                        fontSize: '0.875rem',
                        textAlign: 'left',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        borderBottom: '1px solid var(--border-color)'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              ))}
              
              {Object.keys(filteredAreas).length === 0 && (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem'
                }}>
                  ไม่พบพื้นที่ที่ค้นหา
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Show message when all areas are selected */}
        {availableUnselectedAreas.length === 0 && (
          <div style={{
            padding: '0.75rem',
            marginTop: '0.5rem',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            color: '#10b981',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            textAlign: 'center',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            ✅ เลือกพื้นที่ให้บริการครบทุกจังหวัดแล้ว
          </div>
        )}
      </div>
    );
  };

  const AddPackageModal = () => {
    if (!showAddPackage) return null;

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
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              สร้างแพคเกจ
            </h2>
            <button
              onClick={() => setShowAddPackage(false)}
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
          
          <div style={{ padding: '1.5rem' }}>
            <form 
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              onSubmit={(e) => {
                e.preventDefault();
                // Handle form submission
                setShowAddPackage(false);
              }}
            >
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  ชื่อแพคเกจ
                </label>
                <input
                  type="text"
                  placeholder="Premium Package"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-secondary)',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  ราคา (บาท)
                </label>
                <input
                  type="number"
                  placeholder="8500"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-secondary)',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    จำนวนเซสชัน
                  </label>
                  <input
                    type="number"
                    placeholder="12"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      backgroundColor: 'var(--bg-secondary)',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    ระยะเวลา
                  </label>
                  <select style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-secondary)',
                    outline: 'none'
                  }}>
                    <option value="1">1 เดือน</option>
                    <option value="2">2 เดือน</option>
                    <option value="3">3 เดือน</option>
                  </select>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginTop: '1rem'
              }}>
                <button
                  type="button"
                  onClick={() => setShowAddPackage(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: '#df2528',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  บันทึกการปรับปรุงแพคเกจ
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Save Message Component
  const SaveMessage = () => {
    if (!saveMessage) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: '2rem',
        right: '2rem',
        padding: '1rem 1.5rem',
        backgroundColor: saveMessage.includes('สำเร็จ') ? '#10b981' : '#ef4444',
        color: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        fontSize: '0.875rem',
        fontWeight: '600',
        maxWidth: '400px',
        wordWrap: 'break-word'
      }}>
        {saveMessage}
      </div>
    );
  };

  // Show loading screen while fetching data
  if (isDataLoading) {
    return (
      <div>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            ข้อมูลส่วนตัว
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            จัดการข้อมูลส่วนตัวและโปรไฟล์ของคุณ
          </p>
        </div>
        <LoadingScreen />
      </div>
    );
  }

  // Show error screen if there's an API error
  if (apiError && !isDataLoading) {
    return (
      <div>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            ข้อมูลส่วนตัว
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            จัดการข้อมูลส่วนตัวและโปรไฟล์ของคุณ
          </p>
        </div>
        <ErrorScreen />
      </div>
    );
  }

  const renderPersonalInfo = () => (
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
          ข้อมูลส่วนตัว
        </h3>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Profile Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          marginBottom: '2rem',
          padding: '1.5rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.75rem'
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '5rem',
              height: '5rem',
              borderRadius: '50%',
              backgroundColor: '#232956',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '2rem',
              fontWeight: '600'
            }}>
              {trainerInfo.firstName ? trainerInfo.firstName.charAt(0) : 'T'}{trainerInfo.lastName ? trainerInfo.lastName.charAt(0) : 'R'}
            </div>
            <button style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              backgroundColor: '#df2528',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <Camera size={12} />
            </button>
          </div>
        </div>

        {/* Personal Details Form */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              ชื่อ
            </label>
            <input
              type="text"
              value={trainerInfo.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                backgroundColor: 'var(--bg-secondary)',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              นามสกุล
            </label>
            <input
              type="text"
              value={trainerInfo.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                backgroundColor: 'var(--bg-secondary)',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              อีเมล
            </label>
            <input
              type="email"
              value={trainerInfo.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                backgroundColor: 'var(--bg-secondary)',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              วันเกิด
            </label>
            <input
              type="date"
              value={trainerInfo.birthDate}
              onChange={(e) => handleInputChange('birthDate', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                backgroundColor: 'var(--bg-secondary)',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              เพศ
            </label>
            <select 
              value={trainerInfo.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                backgroundColor: 'var(--bg-secondary)',
                outline: 'none'
              }}
            >
              <option value="male">ชาย</option>
              <option value="female">หญิง</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>
        </div>

        {/* Contact Information */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            ข้อมูลติดต่อ
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
            gap: '1.5rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                เบอร์โทร
              </label>
              <input
                type="tel"
                value={trainerInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--bg-secondary)',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                LINE ID
              </label>
              <input
                type="text"
                value={trainerInfo.lineId}
                onChange={(e) => handleInputChange('lineId', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--bg-secondary)',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                Facebook
              </label>
              <input
                type="text"
                value={trainerInfo.facebook}
                onChange={(e) => handleInputChange('facebook', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--bg-secondary)',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                Instagram
              </label>
              <input
                type="text"
                value={trainerInfo.instagram}
                onChange={(e) => handleInputChange('instagram', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--bg-secondary)',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                TikTok
              </label>
              <input
                type="text"
                value={trainerInfo.tiktok}
                onChange={(e) => handleInputChange('tiktok', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--bg-secondary)',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            ข้อมูล
          </label>
          <textarea
            value={trainerInfo.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={4}
            placeholder="กรอกข้อมูลเพิ่มเติม..."
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-secondary)',
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button 
            onClick={fetchTrainerData}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            รีเซ็ต
          </button>
          <button 
            onClick={savePersonalInfo}
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              backgroundColor: isLoading ? '#9ca3af' : '#df2528',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isLoading && <div style={{ width: '1rem', height: '1rem', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
            บันทึกข้อมูลส่วนตัว
          </button>
        </div>
      </div>
    </div>
  );

  const renderBusinessInfo = () => (
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
          ข้อมูลธุรกิจ
        </h3>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Bio */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            แนะนำตัวและรายละเอียดเพิ่มเติม
          </label>
          <textarea
            value={trainerInfo.businessBio}
            onChange={(e) => handleInputChange('businessBio', e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-secondary)',
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Specialties */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            ความเชี่ยวชาญ
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {expertise.map((item) => (
              <div key={item.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)'
              }}>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateExpertise(item.id, 'name', e.target.value)}
                  placeholder="ความเชี่ยวชาญ"
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-primary)',
                    outline: 'none'
                  }}
                />
                <input
                  type="number"
                  value={item.percentage}
                  onChange={(e) => updateExpertise(item.id, 'percentage', parseInt(e.target.value))}
                  min="0"
                  max="100"
                  style={{
                    width: '4rem',
                    padding: '0.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-primary)',
                    outline: 'none',
                    textAlign: 'center'
                  }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', minWidth: '1rem' }}>%</span>
                <button 
                  onClick={() => removeExpertise(item.id)}
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '0.375rem',
                    backgroundColor: '#df2528',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button 
              onClick={addExpertise}
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px dashed var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Plus size={16} />
              เพิ่มความเชี่ยวชาญ
            </button>
          </div>
        </div>

        {/* Experience and Service Areas */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
            gap: '1.5rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                ประสบการณ์ (ปี)
              </label>
              <input
                type="number"
                value={trainerInfo.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--bg-secondary)',
                  outline: 'none'
                }}
              />
            </div>

            <ServiceAreaSelect />
          </div>
        </div>

        {/* Education and Certification */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            ประวัติการศึกษา
          </label>
          <textarea
            value={trainerInfo.educationHistory}
            onChange={(e) => handleInputChange('educationHistory', e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-secondary)',
              outline: 'none',
              resize: 'vertical',
              marginBottom: '1rem'
            }}
          />

          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            ประวัติการทำงาน
          </label>
          <textarea
            value={trainerInfo.workHistory}
            onChange={(e) => handleInputChange('workHistory', e.target.value)}
            placeholder="ประวัติการทำงาน ใบประกาศนียบัตร ประสบการณ์ต่าง ๆ"
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-secondary)',
              outline: 'none',
              resize: 'vertical',
              marginBottom: '1rem'
            }}
          />

          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            การรับรองและใบประกาศ
          </label>
          <textarea
            value={trainerInfo.certifications}
            onChange={(e) => handleInputChange('certifications', e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-secondary)',
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button 
            onClick={fetchTrainerData}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            รีเซ็ต
          </button>
          <button 
            onClick={saveBusinessInfo}
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              backgroundColor: isLoading ? '#9ca3af' : '#df2528',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isLoading && <div style={{ width: '1rem', height: '1rem', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
            บันทึกข้อมูลธุรกิจ
          </button>
        </div>
      </div>
    </div>
  );

  const renderSchedule = () => (
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
          เวลาทำงาน
        </h3>
      </div>

      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(trainerInfo.workingHours).map(([day, hours]) => (
            <div key={day} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <Switch
                checked={hours.available}
                onChange={(checked) => handleWorkingHourChange(day, 'available', checked)}
              />
              <div style={{ 
                minWidth: '5rem',
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: 'var(--text-primary)' 
              }}>
                {dayNames[day]}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {hours.available ? (
                  <>
                    <input
                      type="time"
                      value={hours.start}
                      onChange={(e) => handleWorkingHourChange(day, 'start', e.target.value)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        backgroundColor: 'var(--bg-primary)',
                        outline: 'none'
                      }}
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>-</span>
                    <input
                      type="time"
                      value={hours.end}
                      onChange={(e) => handleWorkingHourChange(day, 'end', e.target.value)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        backgroundColor: 'var(--bg-primary)',
                        outline: 'none'
                      }}
                    />
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>ปิดทำการ</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button 
            onClick={saveWorkingHours}
            disabled={isLoading}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              backgroundColor: isLoading ? '#9ca3af' : '#df2528',
              color: 'white',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isLoading && <div style={{ width: '1rem', height: '1rem', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
            บันทึกเวลาทำงาน
          </button>
        </div>
      </div>
    </div>
  );

  const renderPricing = () => (
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
          ราคาและแพคเกจ
        </h3>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Basic Rate */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            ราคาพื้นฐาน (ต่อเซสชัน)
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              value={trainerInfo.basicRate}
              onChange={(e) => handleInputChange('basicRate', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem',
                paddingRight: '3rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                backgroundColor: 'var(--bg-secondary)',
                outline: 'none'
              }}
            />
            <span style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)'
            }}>
              บาท
            </span>
          </div>
        </div>

        {/* Packages Section */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              แพคเกจ (สูงสุด 3 แพคเกจ)
            </h4>
            <button
              onClick={() => setShowAddPackage(true)}
              disabled={packages.length >= 3}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: packages.length >= 3 ? 'not-allowed' : 'pointer',
                backgroundColor: packages.length >= 3 ? 'var(--bg-secondary)' : '#df2528',
                color: packages.length >= 3 ? 'var(--text-muted)' : 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Plus size={16} />
              เพิ่มแพคเกจ
            </button>
          </div>

          {/* Package Cards Container */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            {/* Existing Package Forms */}
            {packages.map((pkg, index) => (
              <div key={pkg.id} style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: pkg.isRecommended ? '2px solid #df2528' : '1px solid var(--border-color)',
                position: 'relative'
              }}>
                {pkg.isRecommended && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '0.25rem 1rem',
                    backgroundColor: '#df2528',
                    color: 'white',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    แนะนำ
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    ชื่อแพคเกจ
                  </label>
                  <input
                    type="text"
                    value={pkg.name || ''}
                    onChange={(e) => updatePackage(pkg.id, 'name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      backgroundColor: 'var(--bg-primary)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    ราคา (บาท)
                  </label>
                  <input
                    type="number"
                    value={pkg.price || 0}
                    onChange={(e) => updatePackage(pkg.id, 'price', parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      backgroundColor: 'var(--bg-primary)',
                      outline: 'none',
                      marginBottom: '0.5rem'
                    }}
                  />
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '1rem', 
                  marginBottom: '1.5rem' 
                }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      จำนวนเซสชัน
                    </label>
                    <input
                      type="number"
                      value={pkg.sessions || 0}
                      onChange={(e) => updatePackage(pkg.id, 'sessions', parseInt(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        backgroundColor: 'var(--bg-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      ระยะเวลา
                    </label>
                    <select 
                      value={pkg.duration || '3 เดือน'}
                      onChange={(e) => updatePackage(pkg.id, 'duration', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        backgroundColor: 'var(--bg-primary)',
                        outline: 'none'
                      }}
                    >
                      <option value="1 เดือน">1 เดือน</option>
                      <option value="2 เดือน">2 เดือน</option>
                      <option value="3 เดือน">3 เดือน</option>
                      <option value="6 เดือน">6 เดือน</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    สิ่งที่ได้รับในแพคเกจ
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(pkg.features || []).map((feature, featureIndex) => (
                      <div key={featureIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => {
                            const newFeatures = [...(pkg.features || [])];
                            newFeatures[featureIndex] = e.target.value;
                            updatePackage(pkg.id, 'features', newFeatures);
                          }}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            backgroundColor: 'var(--bg-primary)',
                            outline: 'none'
                          }}
                        />
                        <button 
                          onClick={() => {
                            const newFeatures = pkg.features.filter((_, i) => i !== featureIndex);
                            updatePackage(pkg.id, 'features', newFeatures);
                          }}
                          style={{
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '0.375rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newFeatures = [...(pkg.features || []), ''];
                        updatePackage(pkg.id, 'features', newFeatures);
                      }}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Plus size={16} />
                      เพิ่มรายการ
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Switch
                      checked={pkg.isActive || false}
                      onChange={(checked) => togglePackageActive(pkg.id)}
                    />
                    <span style={{ fontSize: '0.875rem' }}>เปิดใช้งาน</span>
                  </div>
                  <RadioButton
                    checked={pkg.isRecommended || false}
                    onChange={() => setRecommendedPackage(pkg.id)}
                    name="recommendedPackage"
                    value={pkg.id}
                    label="แพคเกจแนะนำ"
                  />
                </div>
              </div>
            ))}

            {/* Add Package Card */}
            {packages.length < 3 && (
              <div
                onClick={() => setShowAddPackage(true)}
                style={{
                  padding: '3rem 1.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.75rem',
                  border: '2px dashed var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  color: 'var(--text-secondary)',
                  textAlign: 'center'
                }}
              >
                <Plus size={48} />
                <div style={{ fontSize: '0.875rem' }}>เพิ่มแพคเกจ</div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            วิธีการชำระเงิน
          </h4>
          
          {/* Payment Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Switch
                checked={trainerInfo.paymentMethods.cash}
                onChange={(checked) => setTrainerInfo(prev => ({
                  ...prev,
                  paymentMethods: { ...prev.paymentMethods, cash: checked }
                }))}
              />
              <span style={{ fontSize: '0.875rem' }}>เงินสด</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Switch
                checked={trainerInfo.paymentMethods.bankTransfer}
                onChange={(checked) => setTrainerInfo(prev => ({
                  ...prev,
                  paymentMethods: { ...prev.paymentMethods, bankTransfer: checked }
                }))}
              />
              <span style={{ fontSize: '0.875rem' }}>โอนเงินผ่านธนาคาร</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Switch
                checked={trainerInfo.paymentMethods.promptPay}
                onChange={(checked) => setTrainerInfo(prev => ({
                  ...prev,
                  paymentMethods: { ...prev.paymentMethods, promptPay: checked }
                }))}
              />
              <span style={{ fontSize: '0.875rem' }}>ชำระเงินผ่าน PromptPay</span>
            </div>
          </div>

          {/* Bank Account Information */}
          {trainerInfo.paymentMethods.bankTransfer && (
            <div style={{ marginBottom: '2rem' }}>
              <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                ข้อมูลบัญชีธนาคารสำหรับการโอนเงิน
              </h5>
              
              {trainerInfo.bankAccounts.map((account, index) => (
                <div key={account.id} style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-color)',
                  marginBottom: '1rem'
                }}>
                  <h6 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                    บัญชีธนาคาร #{index + 1}
                  </h6>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: windowWidth <= 768 ? '1fr' : '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        ธนาคาร
                      </label>
                      <select 
                        value={account.bankName}
                        onChange={(e) => {
                          const newAccounts = [...trainerInfo.bankAccounts];
                          newAccounts[index].bankName = e.target.value;
                          setTrainerInfo(prev => ({ ...prev, bankAccounts: newAccounts }));
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          backgroundColor: 'var(--bg-primary)',
                          outline: 'none'
                        }}
                      >
                        <option>ธนาคารกสิกรไทย</option>
                        <option>ธนาคารกรุงเทพ</option>
                        <option>ธนาคารไทยพาณิชย์</option>
                        <option>ธนาคารกรุงไทย</option>
                        <option>ธนาคารกรุงศรีอยุธยา</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        เลขที่บัญชี
                      </label>
                      <input
                        type="text"
                        value={account.accountNumber}
                        onChange={(e) => {
                          const newAccounts = [...trainerInfo.bankAccounts];
                          newAccounts[index].accountNumber = e.target.value;
                          setTrainerInfo(prev => ({ ...prev, bankAccounts: newAccounts }));
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          backgroundColor: 'var(--bg-primary)',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: windowWidth <= 768 ? '1fr' : '1fr 1fr',
                    gap: '1rem'
                  }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        ชื่อบัญชี
                      </label>
                      <input
                        type="text"
                        value={account.accountName}
                        onChange={(e) => {
                          const newAccounts = [...trainerInfo.bankAccounts];
                          newAccounts[index].accountName = e.target.value;
                          setTrainerInfo(prev => ({ ...prev, bankAccounts: newAccounts }));
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          backgroundColor: 'var(--bg-primary)',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        สาขา
                      </label>
                      <input
                        type="text"
                        value={account.branch}
                        onChange={(e) => {
                          const newAccounts = [...trainerInfo.bankAccounts];
                          newAccounts[index].branch = e.target.value;
                          setTrainerInfo(prev => ({ ...prev, bankAccounts: newAccounts }));
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          backgroundColor: 'var(--bg-primary)',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button 
                onClick={() => {
                  const newAccount = {
                    id: Date.now(),
                    bankName: 'ธนาคารกสิกรไทย',
                    accountNumber: '',
                    accountName: '',
                    branch: ''
                  };
                  setTrainerInfo(prev => ({
                    ...prev,
                    bankAccounts: [...prev.bankAccounts, newAccount]
                  }));
                }}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Plus size={16} />
                เพิ่มบัญชีธนาคาร
              </button>
            </div>
          )}

          {/* PromptPay Information */}
          {trainerInfo.paymentMethods.promptPay && (
            <div style={{ marginBottom: '2rem' }}>
              <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                ข้อมูล PromptPay
              </h5>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: windowWidth <= 768 ? '1fr' : '1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    หมายเลข PromptPay
                  </label>
                  <input
                    type="text"
                    value={trainerInfo.promptPay.number}
                    onChange={(e) => setTrainerInfo(prev => ({
                      ...prev,
                      promptPay: { ...prev.promptPay, number: e.target.value }
                    }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      backgroundColor: 'var(--bg-secondary)',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    ชื่อบัญชี PromptPay
                  </label>
                  <input
                    type="text"
                    value={trainerInfo.promptPay.name}
                    onChange={(e) => setTrainerInfo(prev => ({
                      ...prev,
                      promptPay: { ...prev.promptPay, name: e.target.value }
                    }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      backgroundColor: 'var(--bg-secondary)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Terms and Conditions */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            เงื่อนไขการให้บริการ
          </h4>
          <textarea
            value={trainerInfo.termsConditions}
            onChange={(e) => handleInputChange('termsConditions', e.target.value)}
            placeholder="ระบุเงื่อนไขการให้บริการ เช่น การยกเลิกล่วงหน้า, การคืนเงิน, ข้อตกลงต่างๆ"
            rows={6}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-secondary)',
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button 
            onClick={fetchTrainerData}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            รีเซ็ต
          </button>
          <button 
            onClick={savePricingInfo}
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              backgroundColor: isLoading ? '#9ca3af' : '#df2528',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isLoading && <div style={{ width: '1rem', height: '1rem', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
            บันทึกข้อมูลราคาและแพคเกจ
          </button>
        </div>
      </div>
    </div>
  );

  const renderPhotos = () => (
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
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            รูปภาพ
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {uploadedImages.length}/12 รูป
          </p>
        </div>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Uploaded Images Grid */}
        {uploadedImages.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {uploadedImages.map((image, index) => (
              <div key={index} style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                border: '1px solid var(--border-color)'
              }}>
                <img
                  src={image.url || image}
                  alt={`Trainer ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <button
                  onClick={() => {
                    const newImages = uploadedImages.filter((_, i) => i !== index);
                    setUploadedImages(newImages);
                  }}
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Area */}
        {uploadedImages.length < 12 && (
          <div style={{
            padding: '3rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            border: '2px dashed var(--border-color)',
            textAlign: 'center',
            cursor: 'pointer',
            marginBottom: '2rem'
          }}>
            <Upload size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              ลากไฟล์มาวางหรือคลิกเพื่อเลือกไฟล์
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              รองรับไฟล์ JPG, PNG, GIF ขนาดไม่เกิน 5MB
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                const files = Array.from(e.target.files);
                if (files.length + uploadedImages.length <= 12) {
                  saveImages(files);
                } else {
                  alert('สามารถอัพโหลดได้สูงสุด 12 รูปภาพ');
                }
              }}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label htmlFor="image-upload" style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              marginTop: '1rem',
              backgroundColor: '#df2528',
              color: 'white',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              เลือกไฟล์
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={fetchTrainerData}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            รีเซ็ต
          </button>
          <button 
            onClick={() => saveImages([])}
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              backgroundColor: isLoading ? '#9ca3af' : '#df2528',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isLoading && <div style={{ width: '1rem', height: '1rem', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
            บันทึกรูปภาพ
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <SaveMessage />
      
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          ข้อมูลส่วนตัว
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          จัดการข้อมูลส่วนตัวและโปรไฟล์ของคุณ
        </p>
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
          { id: 'personal', label: 'ข้อมูลส่วนตัว', icon: Users },
          { id: 'business', label: 'ข้อมูลธุรกิจ', icon: Briefcase },
          { id: 'schedule', label: 'เวลาทำงาน', icon: Clock },
          { id: 'pricing', label: 'ราคาและแพคเกจ', icon: Target },
          { id: 'photos', label: 'รูปภาพ', icon: Camera }
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
              backgroundColor: activeTab === tab.id ? '#232956' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
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
      {activeTab === 'personal' && renderPersonalInfo()}
      {activeTab === 'business' && renderBusinessInfo()}
      {activeTab === 'schedule' && renderSchedule()}
      {activeTab === 'pricing' && renderPricing()}
      {activeTab === 'photos' && renderPhotos()}

      <AddPackageModal />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;