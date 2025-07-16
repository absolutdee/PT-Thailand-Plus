import React, { useState, useEffect } from 'react';
import {
  CreditCard, Wallet, QrCode, Building2, CheckCircle, Clock, 
  AlertTriangle, Lock, Shield, Star, User, Package, Calendar,
  ArrowRight, Copy, Download, Receipt, Info, Phone, Mail,
  MapPin, Globe, ChevronLeft, ChevronRight, Eye, EyeOff,
  Smartphone, Camera, Upload, FileText, Send, RefreshCw,
  Loader, X, AlertCircle
} from 'lucide-react';

const ClientPaymentSystem = ({ bookingId, packageId, trainerId }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [showCardForm, setShowCardForm] = useState(false);
  const [showSecurityCode, setShowSecurityCode] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data from API
  const [trainerData, setTrainerData] = useState(null);
  const [packageData, setPackageData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [paymentSlip, setPaymentSlip] = useState(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate QR Code when payment method changes or step 3 is reached
  useEffect(() => {
    if (selectedMethod === 'promptpay' && currentStep === 3 && trainerData && packageData) {
      generateQRCode();
    }
  }, [selectedMethod, currentStep, trainerData, packageData]);

  // Apply CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', '#232956');
    root.style.setProperty('--accent', '#df2528');
    root.style.setProperty('--success', '#10b981');
    root.style.setProperty('--warning', '#f59e0b');
    root.style.setProperty('--danger', '#ef4444');
    root.style.setProperty('--info', '#3b82f6');
    root.style.setProperty('--bg-primary', '#f8fafc');
    root.style.setProperty('--bg-secondary', '#ffffff');
    root.style.setProperty('--text-primary', '#1f2937');
    root.style.setProperty('--text-secondary', '#6b7280');
    root.style.setProperty('--text-muted', '#9ca3af');
    root.style.setProperty('--border-color', '#e5e7eb');
  }, []);

  // Fetch data from API
  useEffect(() => {
    fetchPaymentData();
  }, [bookingId, packageId, trainerId]);

  const fetchPaymentData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch trainer data
      const trainerResponse = await fetch(`/api/trainers/${trainerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!trainerResponse.ok) throw new Error('Failed to fetch trainer data');
      const trainer = await trainerResponse.json();
      
      // Fetch package data
      const packageResponse = await fetch(`/api/packages/${packageId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!packageResponse.ok) throw new Error('Failed to fetch package data');
      const packageInfo = await packageResponse.json();
      
      // Fetch customer data
      const customerResponse = await fetch('/api/customer/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (!customerResponse.ok) throw new Error('Failed to fetch customer data');
      const customer = await customerResponse.json();
      
      setTrainerData({
        id: trainer.id,
        name: trainer.name,
        avatar: trainer.name.charAt(0),
        rating: trainer.rating,
        reviews: trainer.totalReviews,
        phone: trainer.phone,
        email: trainer.email,
        verified: trainer.verified,
        // Payment info
        promptPayPhone: trainer.promptPayPhone,
        promptPayId: trainer.promptPayId,
        preferredPromptPay: trainer.preferredPromptPay || 'phone',
        bankName: trainer.bankName,
        bankAccount: trainer.bankAccount,
        accountName: trainer.accountName
      });
      
      setPackageData({
        id: packageInfo.id,
        name: packageInfo.name,
        description: packageInfo.description,
        sessions: packageInfo.sessions,
        duration: packageInfo.duration,
        price: packageInfo.price,
        originalPrice: packageInfo.originalPrice,
        discount: packageInfo.discount || 0,
        features: packageInfo.features || []
      });
      
      setCustomerData({
        name: customer.fullName,
        phone: customer.phone,
        email: customer.email
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching payment data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Generate QR Code data
  const generateQRCode = async () => {
    if (selectedMethod !== 'promptpay' || !trainerData) return;
    
    try {
      const response = await fetch('/api/payment/generate-qr', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          trainerId: trainerData.id,
          amount: packageData.price,
          bookingId: bookingId,
          preferredMethod: trainerData.preferredPromptPay
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate QR code');
      
      const data = await response.json();
      setQrCodeData(data);
      setShowQRCode(true);
    } catch (err) {
      console.error('Error generating QR code:', err);
      // Use demo QR code generation as fallback
      generateDemoQRCode();
    }
  };

  // Demo QR Code generation (fallback)
  const generateDemoQRCode = () => {
    const promptPayId = trainerData.preferredPromptPay === 'phone' 
      ? trainerData.promptPayPhone 
      : trainerData.promptPayId;
    
    const qrData = generateEMVCoData(promptPayId, packageData.price, trainerData.preferredPromptPay === 'phone');
    
    setQrCodeData({
      qrString: qrData,
      qrImage: null, // Would be base64 image from real API
      amount: packageData.price,
      ref: `REF${bookingId || Date.now()}`
    });
    setShowQRCode(true);
  };

  // CRC16 calculation for PromptPay
  const crc16 = (data) => {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  };

  // Generate EMVCo QR data
  const generateEMVCoData = (promptPayId, amount, isPhone = true) => {
    let formattedId = promptPayId.replace(/\D/g, '');
    if (isPhone && formattedId.startsWith('0')) {
      formattedId = '66' + formattedId.substring(1);
    }

    let payload = '00020101021129370016A000000677010111';
    
    if (isPhone) {
      payload += '01' + formattedId.length.toString().padStart(2, '0') + formattedId;
    } else {
      payload += '02' + formattedId.length.toString().padStart(2, '0') + formattedId;
    }
    
    payload += '5303764';
    
    if (amount && parseFloat(amount) > 0) {
      const formattedAmount = parseFloat(amount).toFixed(2);
      payload += '54' + formattedAmount.length.toString().padStart(2, '0') + formattedAmount;
    }
    
    payload += '6304';
    const checksum = crc16(payload);
    payload = payload.slice(0, -4) + checksum;
    
    return payload;
  };

  // Create QR Code SVG (simplified - use real QR library in production)
  const createQRCodeSVG = (data, size = 256) => {
    const modules = 25;
    const cellSize = size / modules;
    const padding = cellSize * 2;
    
    const pattern = [];
    for (let i = 0; i < modules * modules; i++) {
      const byte = data.charCodeAt(i % data.length);
      pattern.push((byte * (i + 1)) % 2 === 0);
    }

    return (
      <svg
        width={size + padding * 2}
        height={size + padding * 2}
        viewBox={`0 0 ${size + padding * 2} ${size + padding * 2}`}
        style={{ backgroundColor: 'white' }}
      >
        <rect width={size + padding * 2} height={size + padding * 2} fill="white" />
        
        {pattern.map((filled, index) => {
          const row = Math.floor(index / modules);
          const col = index % modules;
          return filled ? (
            <rect
              key={index}
              x={padding + col * cellSize}
              y={padding + row * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#000"
            />
          ) : null;
        })}
        
        <rect x={padding} y={padding} width={cellSize * 7} height={cellSize * 7} fill="#000" />
        <rect x={padding + cellSize} y={padding + cellSize} width={cellSize * 5} height={cellSize * 5} fill="#fff" />
        <rect x={padding + cellSize * 2} y={padding + cellSize * 2} width={cellSize * 3} height={cellSize * 3} fill="#000" />
        
        <rect x={size + padding - cellSize * 7} y={padding} width={cellSize * 7} height={cellSize * 7} fill="#000" />
        <rect x={size + padding - cellSize * 6} y={padding + cellSize} width={cellSize * 5} height={cellSize * 5} fill="#fff" />
        <rect x={size + padding - cellSize * 5} y={padding + cellSize * 2} width={cellSize * 3} height={cellSize * 3} fill="#000" />
        
        <rect x={padding} y={size + padding - cellSize * 7} width={cellSize * 7} height={cellSize * 7} fill="#000" />
        <rect x={padding + cellSize} y={size + padding - cellSize * 6} width={cellSize * 5} height={cellSize * 5} fill="#fff" />
        <rect x={padding + cellSize * 2} y={size + padding - cellSize * 5} width={cellSize * 3} height={cellSize * 3} fill="#000" />
      </svg>
    );
  };

  // Payment methods
  const paymentMethods = [
    {
      id: 'promptpay',
      name: 'พร้อมเพย์',
      icon: QrCode,
      description: 'สแกน QR Code จ่ายทันที',
      fee: 0,
      processingTime: 'ทันที',
      popular: true
    },
    {
      id: 'bank_transfer',
      name: 'โอนผ่านธนาคาร',
      icon: Building2,
      description: 'โอนเงินผ่านบัญชีธนาคาร',
      fee: 0,
      processingTime: '1-3 วันทำการ',
      popular: false
    },
    {
      id: 'card',
      name: 'บัตรเครดิต/เดบิต',
      icon: CreditCard,
      description: 'Visa, Mastercard, JCB',
      fee: 0,
      processingTime: 'ทันที',
      popular: false,
      disabled: true,
      note: 'เร็วๆ นี้'
    }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handlePaymentMethodSelect = (methodId) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (method.disabled) return;
    
    setSelectedMethod(methodId);
    if (methodId === 'promptpay') {
      generateQRCode();
    }
  };

  const handlePaymentSubmit = async () => {
    setPaymentProcessing(true);
    
    try {
      const response = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          bookingId: bookingId,
          packageId: packageId,
          trainerId: trainerId,
          amount: packageData.price,
          paymentMethod: selectedMethod,
          paymentSlip: paymentSlip,
          customerData: customerData,
          qrData: qrCodeData
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payment confirmation failed');
      }
      
      const result = await response.json();
      setPaymentComplete(true);
      setCurrentStep(4);
      
      // Store payment reference for tracking
      if (result.paymentId) {
        localStorage.setItem('lastPaymentId', result.paymentId);
      }
      
    } catch (err) {
      console.error('Payment error:', err);
      setError(`เกิดข้อผิดพลาดในการชำระเงิน: ${err.message}`);
      alert('เกิดข้อผิดพลาดในการชำระเงิน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleSlipUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, GIF)');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentSlip(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Steps component
  const Steps = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '2rem',
      padding: '0 1rem'
    }}>
      {[
        { step: 1, label: 'ข้อมูลแพ็คเกจ' },
        { step: 2, label: 'เลือกการชำระ' },
        { step: 3, label: 'ยืนยันการชำระ' },
        { step: 4, label: 'เสร็จสิ้น' }
      ].map((item, index) => (
        <React.Fragment key={item.step}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              backgroundColor: currentStep >= item.step ? 'var(--accent)' : 'var(--border-color)',
              color: currentStep >= item.step ? 'white' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}>
              {currentStep > item.step ? <CheckCircle size={16} /> : item.step}
            </div>
            <span style={{
              fontSize: '0.75rem',
              color: currentStep >= item.step ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: currentStep === item.step ? '600' : '400',
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }}>
              {item.label}
            </span>
          </div>
          {index < 3 && (
            <div style={{
              width: windowWidth <= 768 ? '1rem' : '3rem',
              height: '2px',
              backgroundColor: currentStep > item.step ? 'var(--accent)' : 'var(--border-color)',
              margin: '0 0.5rem'
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Package Information Step
  const PackageStep = () => (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '1rem',
      padding: '2rem',
      border: '1px solid var(--border-color)',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2rem', textAlign: 'center' }}>
        ข้อมูลแพ็คเกจที่เลือก
      </h2>

      {/* Trainer Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1.5rem',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          width: '4rem',
          height: '4rem',
          borderRadius: '50%',
          backgroundColor: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: '700'
        }}>
          {trainerData?.avatar}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              {trainerData?.name}
            </h3>
            {trainerData?.verified && (
              <CheckCircle size={16} color="var(--success)" />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Star size={14} color="#ffc107" fill="#ffc107" />
              <span>{trainerData?.rating} ({trainerData?.reviews} รีวิว)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Phone size={14} />
              <span>{trainerData?.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Package Details */}
      <div style={{
        border: '1px solid var(--border-color)',
        borderRadius: '1rem',
        overflow: 'hidden',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1.5rem',
          backgroundColor: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {packageData?.name}
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            {packageData?.description}
          </p>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
                {packageData?.sessions}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>เซสชั่น</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--info)' }}>
                {packageData?.duration}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ระยะเวลา</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
                {formatCurrency(packageData?.discount || 0)}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ส่วนลด</div>
            </div>
          </div>

          {packageData?.features && packageData.features.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                สิ่งที่คุณจะได้รับ:
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {packageData.features.map((feature, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={16} color="var(--success)" />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(223, 37, 40, 0.05)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(223, 37, 40, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ราคาปกติ:</span>
              <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                {formatCurrency(packageData?.originalPrice || 0)}
              </span>
            </div>
            {packageData?.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>ส่วนลด:</span>
                <span style={{ color: 'var(--success)', fontWeight: '600' }}>
                  -{formatCurrency(packageData?.discount)}
                </span>
              </div>
            )}
            <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                ยอดที่ต้องชำระ:
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
                {formatCurrency(packageData?.price || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button 
          onClick={() => setCurrentStep(2)}
          style={{
            padding: '1rem 2rem',
            backgroundColor: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '0.75rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(223, 37, 40, 0.3)'
          }}
        >
          ดำเนินการชำระเงิน
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  // Payment Method Selection Step
  const PaymentMethodStep = () => (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '1rem',
      padding: '2rem',
      border: '1px solid var(--border-color)',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2rem', textAlign: 'center' }}>
        เลือกวิธีการชำระเงิน
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {paymentMethods.map(method => (
          <div
            key={method.id}
            onClick={() => handlePaymentMethodSelect(method.id)}
            style={{
              padding: '1.5rem',
              border: `2px solid ${selectedMethod === method.id ? 'var(--accent)' : 'var(--border-color)'}`,
              borderRadius: '1rem',
              cursor: method.disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              backgroundColor: selectedMethod === method.id ? 'rgba(223, 37, 40, 0.05)' : 'var(--bg-primary)',
              position: 'relative',
              opacity: method.disabled ? 0.6 : 1
            }}
          >
            {method.popular && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '1rem',
                padding: '0.25rem 0.75rem',
                backgroundColor: 'var(--accent)',
                color: 'white',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                แนะนำ
              </div>
            )}
            {method.disabled && method.note && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '1rem',
                padding: '0.25rem 0.75rem',
                backgroundColor: 'var(--warning)',
                color: 'white',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {method.note}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                backgroundColor: selectedMethod === method.id ? 'var(--accent)' : 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: selectedMethod === method.id ? 'white' : 'var(--text-secondary)'
              }}>
                <method.icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {method.name}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  {method.description}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ประมวลผล: {method.processingTime} • ค่าธรรมเนียม: {method.fee === 0 ? 'ฟรี' : formatCurrency(method.fee)}
                </div>
              </div>
              {selectedMethod === method.id && (
                <CheckCircle size={24} color="var(--accent)" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button 
          onClick={() => setCurrentStep(1)}
          style={{
            padding: '0.75rem 1.5rem',
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
          <ChevronLeft size={16} />
          ย้อนกลับ
        </button>
        <button 
          onClick={() => setCurrentStep(3)}
          disabled={!selectedMethod}
          style={{
            padding: '0.75rem 2rem',
            backgroundColor: selectedMethod ? 'var(--accent)' : 'var(--text-muted)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: selectedMethod ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          ยืนยันการชำระ
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  // Payment Confirmation Step
  const PaymentConfirmationStep = () => (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '1rem',
      padding: '2rem',
      border: '1px solid var(--border-color)',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2rem', textAlign: 'center' }}>
        ยืนยันการชำระเงิน
      </h2>

      {/* Payment Summary */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          สรุปการชำระเงิน
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>แพ็คเกจ:</span>
            <span style={{ fontWeight: '600' }}>{packageData?.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>เทรนเนอร์:</span>
            <span style={{ fontWeight: '600' }}>{trainerData?.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>วิธีการชำระ:</span>
            <span style={{ fontWeight: '600' }}>
              {paymentMethods.find(m => m.id === selectedMethod)?.name}
            </span>
          </div>
          <hr style={{ margin: '0.5rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              ยอดรวม:
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
              {formatCurrency(packageData?.price || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Method Details */}
      {selectedMethod === 'promptpay' && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          border: '1px solid var(--border-color)',
          borderRadius: '1rem',
          marginBottom: '2rem'
        }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            สแกน QR Code เพื่อชำระเงิน
          </h4>
          
          {!qrCodeData ? (
            <div style={{ padding: '2rem' }}>
              <Loader size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>กำลังสร้าง QR Code...</p>
            </div>
          ) : (
            <>
              {/* QR Code Image */}
              <div style={{
                display: 'inline-block',
                padding: '1rem',
                backgroundColor: 'white',
                borderRadius: '1rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                marginBottom: '1rem'
              }}>
                {qrCodeData.qrImage ? (
                  <img 
                    src={qrCodeData.qrImage} 
                    alt="PromptPay QR Code" 
                    style={{ width: '250px', height: '250px' }}
                  />
                ) : (
                  createQRCodeSVG(qrCodeData.qrString || '', 250)
                )}
              </div>
              
              <div style={{
                padding: '1rem',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginBottom: '1rem'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  ยอดที่ต้องชำระ: <span style={{ fontWeight: '700', color: 'var(--accent)', fontSize: '1.125rem' }}>
                    {formatCurrency(packageData?.price || 0)}
                  </span>
                </div>
                <div>ผู้รับเงิน: {trainerData?.accountName || trainerData?.name}</div>
                {qrCodeData.ref && (
                  <div style={{ marginTop: '0.5rem' }}>
                    Ref: {qrCodeData.ref}
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <button
                  onClick={() => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = 400;
                    canvas.height = 500;
                    
                    // Draw QR Code
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Add text
                    ctx.fillStyle = '#232956';
                    ctx.font = 'bold 20px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(trainerData?.accountName || trainerData?.name, 200, 350);
                    ctx.fillText(`${formatCurrency(packageData?.price || 0)}`, 200, 380);
                    
                    // Download
                    canvas.toBlob((blob) => {
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `promptpay-${qrCodeData.ref || Date.now()}.png`;
                      a.click();
                      URL.revokeObjectURL(url);
                    });
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Download size={16} />
                  บันทึก QR
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(trainerData?.promptPayPhone || trainerData?.promptPayId);
                    alert('คัดลอกเลขพร้อมเพย์แล้ว');
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'white',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Copy size={16} />
                  คัดลอกเลข
                </button>
              </div>
              
              <div style={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid var(--warning)',
                borderRadius: '0.5rem',
                padding: '1rem',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                textAlign: 'left',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Info size={16} color="var(--warning)" />
                  <span style={{ fontWeight: '600' }}>วิธีชำระเงิน:</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
                  <li>เปิดแอปธนาคารหรือ e-Wallet</li>
                  <li>เลือกเมนู "สแกน" หรือ "Scan"</li>
                  <li>สแกน QR Code ด้านบน</li>
                  <li>ตรวจสอบจำนวนเงินและผู้รับ</li>
                  <li>ยืนยันการโอนเงิน</li>
                  <li>บันทึกสลิปเพื่อแนบด้านล่าง</li>
                </ol>
              </div>

              {/* Upload Slip */}
              <div style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '0.5rem',
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-primary)'
              }}>
                <input
                  type="file"
                  id="slip-upload"
                  accept="image/*"
                  onChange={handleSlipUpload}
                  style={{ display: 'none' }}
                />
                {paymentSlip ? (
                  <div>
                    <img 
                      src={paymentSlip} 
                      alt="Payment slip" 
                      style={{ 
                        maxWidth: '200px', 
                        maxHeight: '200px',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <label
                        htmlFor="slip-upload"
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'white',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        เปลี่ยนรูป
                      </label>
                      <button
                        onClick={() => setPaymentSlip(null)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--danger)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="slip-upload" style={{ cursor: 'pointer' }}>
                    <Upload size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      แนบหลักฐานการโอนเงิน
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      คลิกเพื่อเลือกรูปภาพ (JPG, PNG, GIF - สูงสุด 5MB)
                    </p>
                  </label>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {selectedMethod === 'bank_transfer' && (
        <div style={{
          padding: '1.5rem',
          border: '1px solid var(--border-color)',
          borderRadius: '1rem',
          marginBottom: '2rem'
        }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            ข้อมูลบัญชีสำหรับโอนเงิน
          </h4>
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ธนาคาร:</span>
              <span style={{ fontWeight: '600' }}>{trainerData?.bankName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>เลขที่บัญชี:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: '600' }}>{trainerData?.bankAccount}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(trainerData?.bankAccount?.replace(/-/g, ''));
                    alert('คัดลอกเลขบัญชีแล้ว');
                  }}
                  style={{
                    padding: '0.25rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer'
                  }}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ชื่อบัญชี:</span>
              <span style={{ fontWeight: '600' }}>{trainerData?.accountName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>จำนวนเงิน:</span>
              <span style={{ fontWeight: '700', color: 'var(--accent)' }}>{formatCurrency(packageData?.price || 0)}</span>
            </div>
          </div>
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid var(--warning)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Info size={16} color="var(--warning)" />
              <span style={{ fontWeight: '600' }}>ข้อควรระวัง:</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1rem' }}>
              <li>โอนเงินตามจำนวนที่ระบุเท่านั้น</li>
              <li>อัพโหลดหลักฐานการโอนหลังจากโอนเงินเสร็จ</li>
              <li>การยืนยันจะใช้เวลา 1-3 วันทำการ</li>
            </ul>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div style={{
        padding: '1rem',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid var(--success)',
        borderRadius: '0.75rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Shield size={16} color="var(--success)" />
          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--success)' }}>
            การชำระเงินปลอดภัย
          </span>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
          ข้อมูลการชำระเงินของคุณได้รับการเข้ารหัสและปกป้องด้วยมาตรฐาน SSL 256-bit
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button 
          onClick={() => setCurrentStep(2)}
          style={{
            padding: '0.75rem 1.5rem',
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
          <ChevronLeft size={16} />
          ย้อนกลับ
        </button>
        <button 
          onClick={handlePaymentSubmit}
          disabled={paymentProcessing || (selectedMethod === 'promptpay' && !paymentSlip)}
          style={{
            padding: '0.75rem 2rem',
            backgroundColor: paymentProcessing || (selectedMethod === 'promptpay' && !paymentSlip) ? 'var(--text-muted)' : 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: paymentProcessing || (selectedMethod === 'promptpay' && !paymentSlip) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {paymentProcessing ? (
            <>
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
              กำลังประมวลผล...
            </>
          ) : (
            <>
              <Lock size={16} />
              ยืนยันการชำระเงิน
            </>
          )}
        </button>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );

  // Payment Success Step
  const PaymentSuccessStep = () => (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '1rem',
      padding: '3rem 2rem',
      border: '1px solid var(--border-color)',
      maxWidth: '600px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      <div style={{
        width: '4rem',
        height: '4rem',
        borderRadius: '50%',
        backgroundColor: 'var(--success)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 2rem auto'
      }}>
        <CheckCircle size={32} color="white" />
      </div>

      <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>
        ส่งข้อมูลการชำระเงินสำเร็จ!
      </h2>
      
      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        เราได้รับข้อมูลการชำระเงินของคุณแล้ว รอการตรวจสอบจากเทรนเนอร์
      </p>

      <div style={{
        padding: '2rem',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        marginBottom: '2rem',
        textAlign: 'left'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>
          ข้อมูลการชำระเงิน
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>รหัสการจอง:</span>
            <span style={{ fontWeight: '600' }}>{bookingId || `BK${Date.now().toString().slice(-8)}`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>วันที่:</span>
            <span style={{ fontWeight: '600' }}>{new Date().toLocaleDateString('th-TH')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>จำนวนเงิน:</span>
            <span style={{ fontWeight: '700', color: 'var(--accent)' }}>{formatCurrency(packageData?.price || 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>สถานะ:</span>
            <span style={{ color: 'var(--warning)', fontWeight: '600' }}>รอการตรวจสอบ</span>
          </div>
        </div>
      </div>

      <div style={{
        padding: '1.5rem',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid var(--info)',
        borderRadius: '1rem',
        marginBottom: '2rem',
        textAlign: 'left'
      }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--info)', marginBottom: '1rem' }}>
          ขั้นตอนถัดไป:
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} color="var(--info)" />
            <span>เทรนเนอร์จะตรวจสอบการชำระเงินภายใน 1-3 ชั่วโมง</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={16} color="var(--success)" />
            <span>เมื่อยืนยันแล้ว คุณจะได้รับการแจ้งเตือนทันที</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} color="var(--warning)" />
            <span>เทรนเนอร์จะติดต่อเพื่อนัดหมายเซสชั่นแรก</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={16} color="var(--info)" />
            <span>คุณจะได้รับอีเมลยืนยันและใบเสร็จรับเงิน</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Receipt size={16} />
          ดูประวัติการชำระ
        </button>
        <button style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: 'var(--info)',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <User size={16} />
          ไปหน้าโปรไฟล์เทรนเนอร์
        </button>
        <button style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: 'var(--accent)',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Calendar size={16} />
          ดูตารางเทรน
        </button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '1rem'
        }}>
          <Loader size={48} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูล...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '1rem',
          padding: '2rem',
          border: '1px solid var(--border-color)',
          maxWidth: '600px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--danger)', marginBottom: '0.5rem' }}>
            เกิดข้อผิดพลาด
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {error || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง'}
          </p>
          <button
            onClick={() => fetchPaymentData()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            ลองใหม่
          </button>
        </div>
      );
    }

    if (paymentComplete) return <PaymentSuccessStep />;
    
    switch (currentStep) {
      case 1: return <PackageStep />;
      case 2: return <PaymentMethodStep />;
      case 3: return <PaymentConfirmationStep />;
      case 4: return <PaymentSuccessStep />;
      default: return <PackageStep />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '2rem 1rem'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        marginBottom: '2rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.5rem' }}>
            💳 ชำระเงินแพ็คเกจ
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
            ชำระเงินโดยตรงให้กับเทรนเนอร์ของคุณอย่างปลอดภัย
          </p>
        </div>

        {!loading && !error && <Steps />}
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {renderCurrentStep()}
      </div>

      {/* Footer */}
      <div style={{
        maxWidth: '800px',
        margin: '2rem auto 0',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: 'var(--text-muted)'
      }}>
        <p>
          หากคุณมีปัญหาในการชำระเงิน โปรดติดต่อฝ่ายสนับสนุน: 
          <a href="tel:02-123-4567" style={{ color: 'var(--accent)', textDecoration: 'none', marginLeft: '0.25rem' }}>
            02-123-4567
          </a>
        </p>
      </div>
    </div>
  );
};

export default ClientPaymentSystem;