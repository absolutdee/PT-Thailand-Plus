import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../utils/axios';

const ForgotPasswordPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userEmail, setUserEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [resetToken, setResetToken] = useState(''); // เพิ่ม state สำหรับ reset token
  const [loading, setLoading] = useState({
    email: false,
    otp: false,
    reset: false
  });
  const [alerts, setAlerts] = useState({
    email: { show: false, message: '' },
    otp: { show: false, message: '' },
    reset: { show: false, message: '' }
  });
  const [formErrors, setFormErrors] = useState({
    email: { show: false, message: '' },
    newPassword: { show: false, message: '' },
    confirmPassword: { show: false, message: '' }
  });

  const otpRefs = useRef([]);
  const countdownInterval = useRef(null);

  // Utility functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const showAlert = (step, message) => {
    setAlerts(prev => ({
      ...prev,
      [step]: { show: true, message }
    }));
  };

  const hideAlert = (step) => {
    setAlerts(prev => ({
      ...prev,
      [step]: { show: false, message: '' }
    }));
  };

  const setLoadingState = (step, isLoading) => {
    setLoading(prev => ({
      ...prev,
      [step]: isLoading
    }));
  };

  // Step navigation
  const showStep = (step) => {
    setCurrentStep(step);
  };

  // Countdown timer
  const startCountdown = () => {
    setCountdown(60);
    setIsCountdownActive(true);
    
    countdownInterval.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsCountdownActive(false);
          clearInterval(countdownInterval.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Email step - เชื่อมต่อ API
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    hideAlert('email');
    setFormErrors(prev => ({
      ...prev,
      email: { show: false, message: '' }
    }));

    if (!validateEmail(userEmail)) {
      setFormErrors(prev => ({
        ...prev,
        email: { show: true, message: 'กรุณากรอกอีเมลที่ถูกต้อง' }
      }));
      return;
    }

    setLoadingState('email', true);

    try {
      // เรียก API เพื่อส่ง OTP ไปยังอีเมล
      const response = await axiosInstance.post('/auth/forgot-password/send-otp', {
        email: userEmail
      });

      if (response.data.success) {
        // เก็บ reset token ที่ได้จาก API
        setResetToken(response.data.resetToken);
        startCountdown();
        showStep(2);
        showAlert('otp', `รหัส OTP ได้ถูกส่งไปยัง ${userEmail} แล้ว`);
      } else {
        showAlert('email', response.data.message || 'เกิดข้อผิดพลาดในการส่ง OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      
      if (error.response?.status === 404) {
        showAlert('email', 'ไม่พบอีเมลนี้ในระบบ กรุณาตรวจสอบหรือสมัครสมาชิกใหม่');
      } else if (error.response?.status === 429) {
        showAlert('email', 'คุณส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่');
      } else {
        showAlert('email', error.response?.data?.message || 'เกิดข้อผิดพลาดในการส่ง OTP กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoadingState('email', false);
    }
  };

  // OTP input handling
  const handleOtpChange = (index, value) => {
    if (!/^\d$/.test(value) && value !== '') return;

    const newOtpInputs = [...otpInputs];
    newOtpInputs[index] = value;
    setOtpInputs(newOtpInputs);

    // Move to next input
    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }

    // Auto-submit when all inputs filled
    if (newOtpInputs.every(input => input)) {
      setTimeout(() => {
        handleOtpSubmit(newOtpInputs.join(''));
      }, 100);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (index, e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    const pasteArray = paste.split('').filter(char => /^\d$/.test(char));
    
    const newOtpInputs = [...otpInputs];
    pasteArray.forEach((char, pasteIndex) => {
      if (index + pasteIndex < 6) {
        newOtpInputs[index + pasteIndex] = char;
      }
    });
    setOtpInputs(newOtpInputs);

    const nextEmpty = newOtpInputs.findIndex(input => !input);
    if (nextEmpty !== -1) {
      otpRefs.current[nextEmpty].focus();
    } else {
      otpRefs.current[5].focus();
    }
  };

  // OTP submission - เชื่อมต่อ API
  const handleOtpSubmit = async (enteredOtp = null) => {
    const otp = enteredOtp || otpInputs.join('');
    
    hideAlert('otp');

    if (otp.length !== 6) {
      showAlert('otp', 'กรุณากรอกรหัส OTP ให้ครบ 6 หลัก');
      return;
    }

    setLoadingState('otp', true);

    try {
      // เรียก API เพื่อยืนยัน OTP
      const response = await axiosInstance.post('/auth/forgot-password/verify-otp', {
        email: userEmail,
        otp: otp,
        resetToken: resetToken
      });

      if (response.data.success) {
        // อัพเดท reset token หากมีการเปลี่ยนแปลง
        if (response.data.resetToken) {
          setResetToken(response.data.resetToken);
        }
        showStep(3);
      } else {
        showAlert('otp', response.data.message || 'รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่');
        setOtpInputs(['', '', '', '', '', '']);
        otpRefs.current[0].focus();
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      
      if (error.response?.status === 400) {
        showAlert('otp', 'รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว');
      } else if (error.response?.status === 429) {
        showAlert('otp', 'ป้อนรหัส OTP ผิดหลายครั้งเกินไป กรุณารอสักครู่');
      } else {
        showAlert('otp', error.response?.data?.message || 'เกิดข้อผิดพลาดในการยืนยัน OTP');
      }
      
      setOtpInputs(['', '', '', '', '', '']);
      otpRefs.current[0].focus();
    } finally {
      setLoadingState('otp', false);
    }
  };

  // Resend OTP - เชื่อมต่อ API
  const resendOTP = async () => {
    if (isCountdownActive) return;

    try {
      const response = await axiosInstance.post('/auth/forgot-password/resend-otp', {
        email: userEmail,
        resetToken: resetToken
      });

      if (response.data.success) {
        // อัพเดท reset token หากมีการเปลี่ยนแปลง
        if (response.data.resetToken) {
          setResetToken(response.data.resetToken);
        }
        
        setOtpInputs(['', '', '', '', '', '']);
        startCountdown();
        hideAlert('otp');
        showAlert('otp', 'ส่งรหัส OTP ใหม่แล้ว กรุณาตรวจสอบอีเมลของคุณ');
        
        // Clear alert after 3 seconds
        setTimeout(() => {
          hideAlert('otp');
        }, 3000);
      } else {
        showAlert('otp', response.data.message || 'ไม่สามารถส่งรหัส OTP ใหม่ได้');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      
      if (error.response?.status === 429) {
        showAlert('otp', 'คุณส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่');
      } else {
        showAlert('otp', error.response?.data?.message || 'เกิดข้อผิดพลาดในการส่ง OTP ใหม่');
      }
    }
  };

  // Reset password - เชื่อมต่อ API
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    
    hideAlert('reset');
    setFormErrors(prev => ({
      ...prev,
      newPassword: { show: false, message: '' },
      confirmPassword: { show: false, message: '' }
    }));

    let isValid = true;

    if (!validatePassword(newPassword)) {
      setFormErrors(prev => ({
        ...prev,
        newPassword: { show: true, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }
      }));
      isValid = false;
    }

    if (newPassword !== confirmPassword) {
      setFormErrors(prev => ({
        ...prev,
        confirmPassword: { show: true, message: 'รหัสผ่านไม่ตรงกัน' }
      }));
      isValid = false;
    }

    if (!isValid) return;

    setLoadingState('reset', true);

    try {
      // เรียก API เพื่อรีเซ็ตรหัสผ่าน
      const response = await axiosInstance.post('/auth/forgot-password/reset-password', {
        email: userEmail,
        newPassword: newPassword,
        resetToken: resetToken
      });

      if (response.data.success) {
        showStep(4);
      } else {
        showAlert('reset', response.data.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      
      if (error.response?.status === 400) {
        showAlert('reset', 'ข้อมูลไม่ถูกต้องหรือหมดอายุแล้ว กรุณาเริ่มใหม่');
      } else if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        if (validationErrors?.newPassword) {
          setFormErrors(prev => ({
            ...prev,
            newPassword: { show: true, message: validationErrors.newPassword[0] }
          }));
        } else {
          showAlert('reset', 'ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่');
        }
      } else {
        showAlert('reset', error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    } finally {
      setLoadingState('reset', false);
    }
  };

  // Navigation functions
  const goBackToEmail = () => {
    showStep(1);
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    setIsCountdownActive(false);
    // Clear states when going back
    setOtpInputs(['', '', '', '', '', '']);
    setResetToken('');
    hideAlert('otp');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, []);

  // Step components
  const StepIndicator = ({ step }) => {
    const getStepClass = (stepNumber) => {
      if (stepNumber < step) return 'step completed';
      if (stepNumber === step) return 'step active';
      return 'step pending';
    };

    const getLineClass = (lineNumber) => {
      if (lineNumber < step) return 'step-line completed';
      return 'step-line';
    };

    return (
      <>
        <div className="step-indicator">
          <div className={getStepClass(1)}>
            {step > 1 ? <i className="fas fa-check"></i> : '1'}
          </div>
          <div className={getLineClass(2)}></div>
          <div className={getStepClass(2)}>
            {step > 2 ? <i className="fas fa-check"></i> : '2'}
          </div>
          <div className={getLineClass(3)}></div>
          <div className={getStepClass(3)}>
            {step > 3 ? <i className="fas fa-check"></i> : '3'}
          </div>
        </div>
        <div className="step-labels">
          <span className={`step-label ${step === 1 ? 'active' : ''}`}>ยืนยันอีเมล</span>
          <span className={`step-label ${step === 2 ? 'active' : ''}`}>รหัสยืนยัน</span>
          <span className={`step-label ${step === 3 ? 'active' : ''}`}>รหัสผ่านใหม่</span>
        </div>
      </>
    );
  };

  return (
    <>
      <style jsx>{`
        /* Google Fonts Import */
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');

        :root {
          --primary-color: #232956;
          --accent-color: #df2528;
          --light-bg: #f8f9fa;
          --dark-text: #2c3e50;
          --border-color: #e9ecef;
          --success-color: #28a745;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Kanit', sans-serif;
          background: #e9ecef;
          min-height: 100vh;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .forgot-password-wrapper {
          font-family: 'Kanit', sans-serif;
          background: #e9ecef;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .forgot-password-wrapper::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grid)"/></svg>');
          pointer-events: none;
        }

        .auth-container {
          width: 100%;
          max-width: 450px;
          margin: 20px;
          position: relative;
          z-index: 1;
        }

        .auth-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 40px 30px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          animation: slideInUp 0.6s ease;
        }

        .auth-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
        }

        .logo-section {
          text-align: center;
          margin-bottom: 30px;
        }

        .logo {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--primary-color);
          text-decoration: none;
          display: inline-block;
          margin-bottom: 10px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .logo:hover {
          color: var(--accent-color);
          transform: scale(1.05);
        }

        .logo-text {
          color: #6c757d;
          font-size: 1rem;
          font-weight: 400;
        }

        .page-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .page-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-color), #1a1f3a);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 10px 30px rgba(35, 41, 86, 0.3);
        }

        .page-icon i {
          font-size: 2rem;
          color: white;
        }

        .page-title {
          color: var(--primary-color);
          font-weight: 600;
          font-size: 1.8rem;
          margin-bottom: 10px;
        }

        .page-subtitle {
          color: #6c757d;
          line-height: 1.5;
          font-size: 0.95rem;
        }

        .step-indicator {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 30px;
          position: relative;
        }

        .step {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
          position: relative;
          z-index: 2;
          transition: all 0.3s ease;
        }

        .step.active {
          background: linear-gradient(135deg, var(--primary-color), #1a1f3a);
          color: white;
          box-shadow: 0 5px 15px rgba(35, 41, 86, 0.3);
        }

        .step.completed {
          background: var(--success-color);
          color: white;
        }

        .step.pending {
          background: #e9ecef;
          color: #6c757d;
          border: 2px solid var(--border-color);
        }

        .step-line {
          width: 60px;
          height: 2px;
          background: var(--border-color);
          margin: 0 10px;
          position: relative;
        }

        .step-line.completed {
          background: var(--success-color);
        }

        .step-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          font-size: 0.8rem;
          color: #6c757d;
        }

        .step-label.active {
          color: var(--primary-color);
          font-weight: 500;
        }

        .form-group {
          margin-bottom: 20px;
          position: relative;
        }

        .form-label {
          color: var(--dark-text);
          font-weight: 500;
          margin-bottom: 8px;
          display: block;
        }

        .form-control {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid var(--border-color);
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: white;
          font-family: inherit;
        }

        .form-control:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(35, 41, 86, 0.1);
        }

        .form-control.error {
          border-color: var(--accent-color);
        }

        .input-group {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          font-size: 1.1rem;
          z-index: 2;
        }

        .form-control.with-icon {
          padding-left: 45px;
        }

        .fbtn-primary {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, var(--primary-color), #1a1f3a);
          border: none;
          border-radius: 10px;
          color: white;
          font-weight: 600;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          margin-bottom: 20px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }

        .fbtn-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s ease;
        }

        .fbtn-primary:hover::before {
          left: 100%;
        }

        .fbtn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(35, 41, 86, 0.3);
        }

        .fbtn-primary.loading {
          pointer-events: none;
          opacity: 0.8;
        }

        .fbtn-primary.loading::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          animation: spin 1s linear infinite;
        }

        .btn-secondary {
          width: 100%;
          padding: 12px;
          background: white;
          border: 2px solid var(--border-color);
          border-radius: 10px;
          color: var(--dark-text);
          font-weight: 500;
          font-size: 1rem;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
          text-align: center;
          cursor: pointer;
        }

        .btn-secondary:hover {
          border-color: #df2528;
          color: #ffffff;
          text-decoration: none;
          transform: translateY(-2px);
        }

        .alert {
          border-radius: 10px;
          border: none;
          margin-bottom: 20px;
          padding: 12px 15px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .alert-success {
          background: #d4edda;
          color: #155724;
        }

        .alert-danger {
          background: #f8d7da;
          color: #721c24;
        }

        .alert-info {
          background: #cce7ff;
          color: #004085;
        }

        .form-error {
          color: var(--accent-color);
          font-size: 0.85rem;
          margin-top: 5px;
        }

        .auth-footer {
          text-align: center;
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
        }

        .auth-footer p {
          color: #6c757d;
          margin-bottom: 10px;
          font-size: 0.9rem;
        }

        .auth-footer a, .auth-footer span {
          color: var(--primary-color);
          text-decoration: none;
          font-weight: 500;
          cursor: pointer;
        }

        .auth-footer a:hover, .auth-footer span:hover {
          color: var(--accent-color);
          text-decoration: underline;
        }

        .success-state {
          text-align: center;
          animation: fadeInUp 0.5s ease;
        }

        .success-icon {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--success-color), #20c997);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 25px;
          box-shadow: 0 15px 40px rgba(40, 167, 69, 0.3);
          animation: pulse 2s infinite;
        }

        .success-icon i {
          font-size: 2.5rem;
          color: white;
        }

        .success-title {
          color: var(--success-color);
          font-weight: 600;
          font-size: 1.5rem;
          margin-bottom: 15px;
        }

        .success-message {
          color: #6c757d;
          line-height: 1.6;
          margin-bottom: 25px;
        }

        .email-highlight {
          color: var(--primary-color);
          font-weight: 600;
          background: rgba(35, 41, 86, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .otp-inputs {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .otp-input {
          width: 50px;
          height: 50px;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          text-align: center;
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--primary-color);
          transition: all 0.3s ease;
        }

        .otp-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(35, 41, 86, 0.1);
        }

        .resend-section {
          text-align: center;
          margin-bottom: 20px;
        }

        .resend-text {
          color: #6c757d;
          font-size: 0.9rem;
          margin-bottom: 10px;
        }

        .resend-link {
          color: var(--primary-color);
          text-decoration: none;
          font-weight: 500;
          cursor: pointer;
        }

        .resend-link:hover {
          color: var(--accent-color);
          text-decoration: underline;
        }

        .resend-link.disabled {
          color: #6c757d;
          cursor: not-allowed;
          text-decoration: none;
        }

        .countdown {
          color: var(--accent-color);
          font-weight: 600;
        }

        .floating-shapes {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }

        .shape {
          position: absolute;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }

        .shape:nth-child(1) {
          width: 60px;
          height: 60px;
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        }

        .shape:nth-child(2) {
          width: 40px;
          height: 40px;
          top: 60%;
          right: 15%;
          animation-delay: 2s;
        }

        .shape:nth-child(3) {
          width: 30px;
          height: 30px;
          bottom: 20%;
          left: 15%;
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Mobile Responsive */
        @media (max-width: 576px) {
          .auth-container {
            margin: 10px;
          }

          .auth-card {
            padding: 30px 20px;
            border-radius: 15px;
          }

          .logo {
            font-size: 2rem;
          }

          .page-title {
            font-size: 1.5rem;
          }

          .page-icon {
            width: 70px;
            height: 70px;
          }

          .page-icon i {
            font-size: 1.8rem;
          }

          .step-indicator {
            margin-bottom: 25px;
          }

          .step {
            width: 35px;
            height: 35px;
            font-size: 0.8rem;
          }

          .step-line {
            width: 40px;
          }

          .otp-inputs {
            gap: 8px;
          }

          .otp-input {
            width: 45px;
            height: 45px;
            font-size: 1.1rem;
          }

          .success-icon {
            width: 80px;
            height: 80px;
          }

          .success-icon i {
            font-size: 2rem;
          }
        }
      `}</style>

      <div className="forgot-password-wrapper">
        <div className="floating-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>

        <div className="auth-container">
          <div className="auth-card">
            <div className="logo-section">
              <div className="logo" onClick={() => window.location.href = '/'}>
                FitConnect
              </div>
              <p className="logo-text">เชื่อมต่อคุณกับเทรนเนอร์ที่เหมาะสม</p>
            </div>

            {/* Step 1: Email Input */}
            {currentStep === 1 && (
              <div className="step-content">
                <div className="page-header">
                  <div className="page-icon">
                    <i className="fas fa-key"></i>
                  </div>
                  <h1 className="page-title">ลืมรหัสผ่าน</h1>
                  <p className="page-subtitle">กรอกอีเมลที่ใช้ลงทะเบียนเพื่อรับรหัสยืนยันการรีเซ็ตรหัสผ่าน</p>
                </div>

                <StepIndicator step={1} />

                {alerts.email.show && (
                  <div className="alert alert-danger">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{alerts.email.message}</span>
                  </div>
                )}

                <div>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">อีเมล *</label>
                    <div className="input-group">
                      <i className="fas fa-envelope input-icon"></i>
                      <input
                        type="email"
                        className={`form-control with-icon ${formErrors.email.show ? 'error' : ''}`}
                        id="email"
                        placeholder="กรอกอีเมลของคุณ"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        required
                      />
                    </div>
                    {formErrors.email.show && (
                      <div className="form-error">{formErrors.email.message}</div>
                    )}
                  </div>

                  <button 
                    onClick={handleEmailSubmit}
                    className={`fbtn-primary ${loading.email ? 'loading' : ''}`}
                    disabled={loading.email}
                  >
                    {loading.email ? 'กำลังส่งรหัส...' : 'ส่งรหัสยืนยัน'}
                  </button>
                </div>

                <div className="btn-secondary" onClick={() => window.location.href = '/signin'}>
                  <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>กลับไปเข้าสู่ระบบ
                </div>
              </div>
            )}

            {/* Step 2: OTP Verification */}
            {currentStep === 2 && (
              <div className="step-content">
                <div className="page-header">
                  <div className="page-icon">
                    <i className="fas fa-shield-alt"></i>
                  </div>
                  <h1 className="page-title">ยืนยันรหัส OTP</h1>
                  <p className="page-subtitle">
                    ระบบได้ส่งรหัสยืนยัน 6 หลักไปยังอีเมล <span className="email-highlight">{userEmail}</span> แล้ว
                  </p>
                </div>

                <StepIndicator step={2} />

                {alerts.otp.show && (
                  <div className={`alert ${alerts.otp.message.includes('ส่งรหัส OTP ใหม่แล้ว') ? 'alert-success' : 'alert-danger'}`}>
                    <i className={`fas ${alerts.otp.message.includes('ส่งรหัส OTP ใหม่แล้ว') ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                    <span>{alerts.otp.message}</span>
                  </div>
                )}

                <div>
                  <div className="form-group">
                    <label className="form-label">รหัส OTP (6 หลัก) *</label>
                    <div className="otp-inputs">
                      {otpInputs.map((value, index) => (
                        <input
                          key={index}
                          ref={el => otpRefs.current[index] = el}
                          type="text"
                          className="otp-input"
                          maxLength="1"
                          value={value}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={(e) => handleOtpPaste(index, e)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="resend-section">
                    <p className="resend-text">ไม่ได้รับรหัส?</p>
                    <span 
                      className={`resend-link ${isCountdownActive ? 'disabled' : ''}`}
                      onClick={resendOTP}
                    >
                      ส่งรหัสใหม่ {isCountdownActive && <span className="countdown">({countdown}s)</span>}
                    </span>
                  </div>

                  <button 
                    onClick={() => handleOtpSubmit()}
                    className={`fbtn-primary ${loading.otp ? 'loading' : ''}`}
                    disabled={loading.otp}
                  >
                    {loading.otp ? 'กำลังยืนยัน...' : 'ยืนยันรหัส'}
                  </button>
                </div>

                <div className="btn-secondary" onClick={goBackToEmail}>
                  <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>เปลี่ยนอีเมล
                </div>
              </div>
            )}

            {/* Step 3: Reset Password */}
            {currentStep === 3 && (
              <div className="step-content">
                <div className="page-header">
                  <div className="page-icon">
                    <i className="fas fa-lock"></i>
                  </div>
                  <h1 className="page-title">รหัสผ่านใหม่</h1>
                  <p className="page-subtitle">สร้างรหัสผ่านใหม่ที่ปลอดภัยสำหรับบัญชีของคุณ</p>
                </div>

                <StepIndicator step={3} />

                {alerts.reset.show && (
                  <div className="alert alert-danger">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{alerts.reset.message}</span>
                  </div>
                )}

                <div>
                  <div className="form-group">
                    <label htmlFor="newPassword" className="form-label">รหัสผ่านใหม่ *</label>
                    <div className="input-group">
                      <i className="fas fa-lock input-icon"></i>
                      <input
                        type="password"
                        className={`form-control with-icon ${formErrors.newPassword.show ? 'error' : ''}`}
                        id="newPassword"
                        placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    {formErrors.newPassword.show && (
                      <div className="form-error">{formErrors.newPassword.message}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmNewPassword" className="form-label">ยืนยันรหัสผ่านใหม่ *</label>
                    <div className="input-group">
                      <i className="fas fa-lock input-icon"></i>
                      <input
                        type="password"
                        className={`form-control with-icon ${formErrors.confirmPassword.show ? 'error' : ''}`}
                        id="confirmNewPassword"
                        placeholder="ยืนยันรหัสผ่านใหม่"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    {formErrors.confirmPassword.show && (
                      <div className="form-error">{formErrors.confirmPassword.message}</div>
                    )}
                  </div>

                  <button 
                    onClick={handleResetSubmit}
                    className={`fbtn-primary ${loading.reset ? 'loading' : ''}`}
                    disabled={loading.reset}
                  >
                    {loading.reset ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'เปลี่ยนรหัสผ่าน'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Success State */}
            {currentStep === 4 && (
              <div className="step-content success-state">
                <div className="success-icon">
                  <i className="fas fa-check"></i>
                </div>
                <h2 className="success-title">เปลี่ยนรหัสผ่านสำเร็จ!</h2>
                <p className="success-message">
                  รหัสผ่านของคุณได้รับการอัพเดทเรียบร้อยแล้ว<br />
                  คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที
                </p>
                <div className="fbtn-primary" onClick={() => window.location.href = '/signin'}>
                  <i className="fas fa-sign-in-alt" style={{ marginRight: '8px' }}></i>เข้าสู่ระบบ
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="auth-footer">
              <p>จำรหัสผ่านได้แล้ว? <span onClick={() => window.location.href = '/signin'}>เข้าสู่ระบบ</span></p>
              <p><span onClick={() => window.location.href = '/'}>กลับสู่หน้าแรก</span></p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;