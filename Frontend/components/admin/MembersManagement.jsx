import React, { useState, useEffect } from 'react';
import { 
  Users, User, Target, Search, Filter, 
  Plus, Edit, Trash2, Eye, MoreVertical,
  CheckCircle, XCircle, Clock, Mail, Phone,
  Calendar, Star, DollarSign, Activity,
  X, Save, AlertTriangle, Loader, RefreshCw
} from 'lucide-react';

const MembersManagement = ({ windowWidth }) => {
  const [activeTab, setActiveTab] = useState('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Database connection states
  const [customers, setCustomers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalSessions: 0,
    totalRevenue: 0,
    totalTrainers: 0,
    verifiedTrainers: 0,
    pendingTrainers: 0,
    avgRating: 0
  });

  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active',
    trainer: '',
    package: ''
  });

  const [trainerForm, setTrainerForm] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'pending',
    specialties: [],
    rating: 0
  });

  // API Functions
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

      const response = await fetch(`/api/admin${url}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Fetch data functions
  const fetchCustomers = async () => {
    try {
      const response = await apiCall('/customers');
      if (response.success) {
        setCustomers(response.data.customers);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  };

  const fetchTrainers = async () => {
    try {
      const response = await apiCall('/trainers');
      if (response.success) {
        setTrainers(response.data.trainers);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch trainers');
      }
    } catch (error) {
      console.error('Error fetching trainers:', error);
      throw error;
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiCall('/members/stats');
      if (response.success) {
        setStats(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  };

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchCustomers(),
        fetchTrainers(),
        fetchStats()
      ]);
    } catch (error) {
      setError(error.message);
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Customer CRUD functions
  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({
      name: '',
      email: '',
      phone: '',
      status: 'active',
      trainer: '',
      package: ''
    });
    setShowCustomerModal(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      trainer: customer.trainer || '',
      package: customer.package || ''
    });
    setShowCustomerModal(true);
  };

  const handleSaveCustomer = async () => {
    try {
      setSaving(true);
      
      if (editingCustomer) {
        // Update existing customer
        const response = await apiCall(`/customers/${editingCustomer.id}`, 'PUT', customerForm);
        if (response.success) {
          setCustomers(customers.map(customer => 
            customer.id === editingCustomer.id 
              ? { ...customer, ...customerForm }
              : customer
          ));
        } else {
          throw new Error(response.message || 'Failed to update customer');
        }
      } else {
        // Add new customer
        const response = await apiCall('/customers', 'POST', customerForm);
        if (response.success) {
          setCustomers([...customers, response.data]);
        } else {
          throw new Error(response.message || 'Failed to create customer');
        }
      }
      
      setShowCustomerModal(false);
      // Refresh stats
      await fetchStats();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = (customer) => {
    setDeleteTarget({ type: 'customer', data: customer });
    setShowDeleteModal(true);
  };

  // Trainer CRUD functions
  const handleAddTrainer = () => {
    setEditingTrainer(null);
    setTrainerForm({
      name: '',
      email: '',
      phone: '',
      status: 'pending',
      specialties: [],
      rating: 0
    });
    setShowTrainerModal(true);
  };

  const handleEditTrainer = (trainer) => {
    setEditingTrainer(trainer);
    setTrainerForm({
      name: trainer.name,
      email: trainer.email,
      phone: trainer.phone,
      status: trainer.status,
      specialties: trainer.specialties || [],
      rating: trainer.rating || 0
    });
    setShowTrainerModal(true);
  };

  const handleSaveTrainer = async () => {
    try {
      setSaving(true);
      
      if (editingTrainer) {
        // Update existing trainer
        const response = await apiCall(`/trainers/${editingTrainer.id}`, 'PUT', trainerForm);
        if (response.success) {
          setTrainers(trainers.map(trainer => 
            trainer.id === editingTrainer.id 
              ? { ...trainer, ...trainerForm }
              : trainer
          ));
        } else {
          throw new Error(response.message || 'Failed to update trainer');
        }
      } else {
        // Add new trainer
        const response = await apiCall('/trainers', 'POST', trainerForm);
        if (response.success) {
          setTrainers([...trainers, response.data]);
        } else {
          throw new Error(response.message || 'Failed to create trainer');
        }
      }
      
      setShowTrainerModal(false);
      // Refresh stats
      await fetchStats();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrainer = (trainer) => {
    setDeleteTarget({ type: 'trainer', data: trainer });
    setShowDeleteModal(true);
  };

  const handleApproveTrainer = async (trainerId) => {
    try {
      const response = await apiCall(`/trainers/${trainerId}/approve`, 'PUT');
      if (response.success) {
        setTrainers(trainers.map(trainer => 
          trainer.id === trainerId 
            ? { ...trainer, status: 'verified' }
            : trainer
        ));
        // Refresh stats
        await fetchStats();
      } else {
        throw new Error(response.message || 'Failed to approve trainer');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  // Delete confirmation
  const handleConfirmDelete = async () => {
    try {
      setSaving(true);
      
      if (deleteTarget.type === 'customer') {
        const response = await apiCall(`/customers/${deleteTarget.data.id}`, 'DELETE');
        if (response.success) {
          setCustomers(customers.filter(c => c.id !== deleteTarget.data.id));
        } else {
          throw new Error(response.message || 'Failed to delete customer');
        }
      } else if (deleteTarget.type === 'trainer') {
        const response = await apiCall(`/trainers/${deleteTarget.data.id}`, 'DELETE');
        if (response.success) {
          setTrainers(trainers.filter(t => t.id !== deleteTarget.data.id));
        } else {
          throw new Error(response.message || 'Failed to delete trainer');
        }
      }
      
      setShowDeleteModal(false);
      setDeleteTarget(null);
      // Refresh stats
      await fetchStats();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'verified':
        return 'var(--success)';
      case 'inactive':
        return 'var(--danger)';
      case 'pending':
        return 'var(--warning)';
      default:
        return 'var(--text-muted)';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'ใช้งาน';
      case 'inactive':
        return 'ไม่ใช้งาน';
      case 'verified':
        return 'ยืนยันแล้ว';
      case 'pending':
        return 'รอการอนุมัติ';
      default:
        return status;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Modal Component
  const Modal = ({ show, onClose, title, children }) => {
    if (!show) return null;

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
          border: '1px solid var(--border-color)',
          width: '100%',
          maxWidth: '500px',
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              disabled={saving}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: saving ? 'not-allowed' : 'pointer',
                padding: '0.25rem',
                opacity: saving ? 0.5 : 1
              }}
            >
              <X size={20} />
            </button>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {children}
          </div>
        </div>
      </div>
    );
  };

  // Customer Modal Content
  const CustomerModalContent = () => (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          ชื่อ-นามสกุล
        </label>
        <input
          type="text"
          value={customerForm.name}
          onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
          disabled={saving}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            opacity: saving ? 0.7 : 1
          }}
          placeholder="กรอกชื่อ-นามสกุล"
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          อีเมล
        </label>
        <input
          type="email"
          value={customerForm.email}
          onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
          disabled={saving}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            opacity: saving ? 0.7 : 1
          }}
          placeholder="กรอกอีเมล"
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          เบอร์โทรศัพท์
        </label>
        <input
          type="tel"
          value={customerForm.phone}
          onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
          disabled={saving}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            opacity: saving ? 0.7 : 1
          }}
          placeholder="กรอกเบอร์โทรศัพท์"
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          เทรนเนอร์
        </label>
        <input
          type="text"
          value={customerForm.trainer}
          onChange={(e) => setCustomerForm({ ...customerForm, trainer: e.target.value })}
          disabled={saving}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            opacity: saving ? 0.7 : 1
          }}
          placeholder="กรอกชื่อเทรนเนอร์"
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          แพคเกจ
        </label>
        <select
          value={customerForm.package}
          onChange={(e) => setCustomerForm({ ...customerForm, package: e.target.value })}
          disabled={saving}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            opacity: saving ? 0.7 : 1
          }}
        >
          <option value="">เลือกแพคเกจ</option>
          <option value="Basic">Basic</option>
          <option value="Premium">Premium</option>
          <option value="VIP">VIP</option>
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          สถานะ
        </label>
        <select
          value={customerForm.status}
          onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value })}
          disabled={saving}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            opacity: saving ? 0.7 : 1
          }}
        >
          <option value="active">ใช้งาน</option>
          <option value="inactive">ไม่ใช้งาน</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setShowCustomerModal(false)}
          disabled={saving}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1
          }}
        >
          ยกเลิก
        </button>
        <button
          onClick={handleSaveCustomer}
          disabled={saving}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: saving ? 'var(--text-muted)' : 'var(--accent)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>
    </>
  );

  // Trainer Modal Content
  const TrainerModalContent = () => (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          ชื่อ-นามสกุล
        </label>
        <input
          type="text"
          value={trainerForm.name}
          onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
          disabled={saving}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            opacity: saving ? 0.7 : 1
          }}
          placeholder="กรอกชื่อ-นามสกุล"
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          อีเมล
        </label>
        <input
          type="email"
          value={trainerForm.email}
          onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
          disabled={saving}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            opacity: saving ? 0.7 : 1
          }}
          placeholder="กรอกอีเมล"
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          เบอร์โทรศัพท์
        </label>
        <input
          type="tel"
          value={trainerForm.phone}
          onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })}
          disabled={saving}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            opacity: saving ? 0.7 : 1
          }}
          placeholder="กรอกเบอร์โทรศัพท์"
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          ความเชี่ยวชาญ
        </label>
        <input
          type="text"
          value={trainerForm.specialties.join(', ')}
          onChange={(e) => setTrainerForm({ 
            ...trainerForm, 
            specialties: e.target.value.split(',').map(s => s.trim()).filter(s => s)
          })}
          disabled={saving}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            opacity: saving ? 0.7 : 1
          }}
          placeholder="เช่น Weight Training, Cardio (คั่นด้วยจุลภาค)"
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          สถานะ
        </label>
        <select
          value={trainerForm.status}
          onChange={(e) => setTrainerForm({ ...trainerForm, status: e.target.value })}
          disabled={saving}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            opacity: saving ? 0.7 : 1
          }}
        >
          <option value="pending">รอการอนุมัติ</option>
          <option value="verified">ยืนยันแล้ว</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setShowTrainerModal(false)}
          disabled={saving}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1
          }}
        >
          ยกเลิก
        </button>
        <button
          onClick={handleSaveTrainer}
          disabled={saving}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: saving ? 'var(--text-muted)' : 'var(--accent)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>
    </>
  );

  // Delete Confirmation Modal
  const DeleteModalContent = () => (
    <>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'var(--danger)20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem'
        }}>
          <AlertTriangle size={30} color="var(--danger)" />
        </div>
        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          ยืนยันการลบ
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          คุณแน่ใจหรือไม่ที่จะลบ{deleteTarget?.type === 'customer' ? 'ลูกค้า' : 'เทรนเนอร์'} "{deleteTarget?.data?.name}"?
          <br />
          การดำเนินการนี้ไม่สามารถยกเลิกได้
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <button
          onClick={() => setShowDeleteModal(false)}
          disabled={saving}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1
          }}
        >
          ยกเลิก
        </button>
        <button
          onClick={handleConfirmDelete}
          disabled={saving}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: saving ? 'var(--text-muted)' : 'var(--danger)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {saving ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />}
          {saving ? 'กำลังลบ...' : 'ลบ'}
        </button>
      </div>
    </>
  );

  // Loading Component
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
        <Loader size={48} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูลสมาชิก...</p>
      </div>
    );
  }

  // Error Component
  if (error) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '0.75rem',
        border: '1px solid var(--danger)'
      }}>
        <AlertTriangle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>เกิดข้อผิดพลาด</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={loadData}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: '0 auto'
          }}
        >
          <RefreshCw size={16} />
          ลองใหม่
        </button>
      </div>
    );
  }

  const renderCustomersTab = () => (
    <div>
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Users size={20} color="var(--accent)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ลูกค้าทั้งหมด</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.totalCustomers}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <CheckCircle size={20} color="var(--success)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ลูกค้าใช้งาน</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.activeCustomers}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Activity size={20} color="var(--info)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>เซสชั่นเสร็จสิ้น</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.totalSessions}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <DollarSign size={20} color="var(--warning)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>รายได้รวม</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {formatCurrency(stats.totalRevenue)}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        flexDirection: windowWidth <= 768 ? 'column' : 'row',
        gap: '1rem',
        marginBottom: '1.5rem',
        alignItems: windowWidth <= 768 ? 'stretch' : 'center'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            placeholder="ค้นหาลูกค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            minWidth: '120px'
          }}
        >
          <option value="all">สถานะทั้งหมด</option>
          <option value="active">ใช้งาน</option>
          <option value="inactive">ไม่ใช้งาน</option>
        </select>
        <button 
          onClick={handleAddCustomer}
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--accent)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Plus size={16} />
          เพิ่มลูกค้าใหม่
        </button>
      </div>

      {/* Customers Table */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>
                  ลูกค้า
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>
                  ติดต่อ
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>
                  เทรนเนอร์
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>
                  แพคเกจ
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>
                  สถานะ
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: 'var(--text-primary)' }}>
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody>
              {customers
                .filter(customer => {
                  const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
                  return matchesSearch && matchesStatus;
                })
                .map((customer, index) => (
                <tr key={customer.id} style={{ 
                  borderBottom: index < customers.length - 1 ? '1px solid var(--border-color)' : 'none' 
                }}>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-white)',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                      }}>
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                          {customer.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          สมัคร: {customer.join_date || customer.joinDate}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div>{customer.email}</div>
                    <div style={{ fontSize: '0.75rem' }}>{customer.phone}</div>
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                    {customer.trainer || '-'}
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                    {customer.package || '-'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: `${getStatusColor(customer.status)}20`,
                      color: getStatusColor(customer.status),
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {getStatusText(customer.status)}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleEditCustomer(customer)}
                        style={{
                          padding: '0.25rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                        title="แก้ไข"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCustomer(customer)}
                        style={{
                          padding: '0.25rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer'
                        }}
                        title="ลบ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTrainersTab = () => (
    <div>
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Target size={20} color="var(--accent)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>เทรนเนอร์ทั้งหมด</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.totalTrainers}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <CheckCircle size={20} color="var(--success)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ยืนยันแล้ว</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.verifiedTrainers}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Clock size={20} color="var(--warning)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>รอการอนุมัติ</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.pendingTrainers}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Star size={20} color="var(--info)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>คะแนนเฉลี่ย</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.avgRating.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        flexDirection: windowWidth <= 768 ? 'column' : 'row',
        gap: '1rem',
        marginBottom: '1.5rem',
        alignItems: windowWidth <= 768 ? 'stretch' : 'center'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            placeholder="ค้นหาเทรนเนอร์..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            minWidth: '120px'
          }}
        >
          <option value="all">สถานะทั้งหมด</option>
          <option value="verified">ยืนยันแล้ว</option>
          <option value="pending">รอการอนุมัติ</option>
        </select>
        <button 
          onClick={handleAddTrainer}
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--accent)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Plus size={16} />
          เพิ่มเทรนเนอร์ใหม่
        </button>
      </div>

      {/* Trainers Table */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>
                  เทรนเนอร์
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>
                  ติดต่อ
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>
                  ความเชี่ยวชาญ
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>
                  คะแนน
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-primary)' }}>
                  สถานะ
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: 'var(--text-primary)' }}>
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody>
              {trainers
                .filter(trainer => {
                  const matchesSearch = trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      trainer.email.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesStatus = statusFilter === 'all' || trainer.status === statusFilter;
                  return matchesSearch && matchesStatus;
                })
                .map((trainer, index) => (
                <tr key={trainer.id} style={{ 
                  borderBottom: index < trainers.length - 1 ? '1px solid var(--border-color)' : 'none' 
                }}>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-white)',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                      }}>
                        {trainer.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                          {trainer.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          สมัคร: {trainer.join_date || trainer.joinDate}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div>{trainer.email}</div>
                    <div style={{ fontSize: '0.75rem' }}>{trainer.phone}</div>
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                    {trainer.specialties?.join(', ') || '-'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Star size={14} fill="var(--warning)" color="var(--warning)" />
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {trainer.rating || '-'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: `${getStatusColor(trainer.status)}20`,
                      color: getStatusColor(trainer.status),
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {getStatusText(trainer.status)}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleEditTrainer(trainer)}
                        style={{
                          padding: '0.25rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                        title="แก้ไข"
                      >
                        <Edit size={16} />
                      </button>
                      {trainer.status === 'pending' && (
                        <button 
                          onClick={() => handleApproveTrainer(trainer.id)}
                          style={{
                            padding: '0.25rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: 'var(--success)',
                            cursor: 'pointer'
                          }}
                          title="อนุมัติ"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteTrainer(trainer)}
                        style={{
                          padding: '0.25rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer'
                        }}
                        title="ลบ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '1.75rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          marginBottom: '0.5rem' 
        }}>
          จัดการสมาชิก
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          จัดการข้อมูลลูกค้าและเทรนเนอร์ในระบบ
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '2rem'
      }}>
        <button
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'customers' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'customers' ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onClick={() => setActiveTab('customers')}
        >
          <User size={16} />
          ลูกค้า
        </button>
        <button
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'trainers' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'trainers' ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onClick={() => setActiveTab('trainers')}
        >
          <Target size={16} />
          เทรนเนอร์
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'customers' && renderCustomersTab()}
      {activeTab === 'trainers' && renderTrainersTab()}

      {/* Modals */}
      <Modal 
        show={showCustomerModal} 
        onClose={() => setShowCustomerModal(false)}
        title={editingCustomer ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}
      >
        <CustomerModalContent />
      </Modal>

      <Modal 
        show={showTrainerModal} 
        onClose={() => setShowTrainerModal(false)}
        title={editingTrainer ? 'แก้ไขข้อมูลเทรนเนอร์' : 'เพิ่มเทรนเนอร์ใหม่'}
      >
        <TrainerModalContent />
      </Modal>

      <Modal 
        show={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)}
        title="ยืนยันการลบ"
      >
        <DeleteModalContent />
      </Modal>
    </div>
  );
};

export default MembersManagement;