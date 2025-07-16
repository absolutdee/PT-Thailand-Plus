import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Search, Filter, Eye, Edit, 
  CheckCircle, Clock, XCircle, AlertTriangle,
  User, Target, Mail, Phone, Calendar, Flag,
  MessageCircle, Send, Paperclip, Star, Plus,
  ArrowLeft, Save, Trash2, Users, FileText,
  MoreVertical, Reply, Forward, Archive,
  Upload, Download, Print, RefreshCw, X,
  Loader
} from 'lucide-react';

// API Service Functions
const supportAPI = {
  // Tickets API
  getTickets: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.priority && filters.priority !== 'all') queryParams.append('priority', filters.priority);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category) queryParams.append('category', filters.category);
      
      const response = await fetch(`/api/support/tickets?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch tickets');
      return await response.json();
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  },

  getTicketById: async (id) => {
    try {
      const response = await fetch(`/api/support/tickets/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch ticket');
      return await response.json();
    } catch (error) {
      console.error('Error fetching ticket:', error);
      throw error;
    }
  },

  createTicket: async (ticketData) => {
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(ticketData)
      });
      
      if (!response.ok) throw new Error('Failed to create ticket');
      return await response.json();
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  },

  updateTicket: async (id, ticketData) => {
    try {
      const response = await fetch(`/api/support/tickets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(ticketData)
      });
      
      if (!response.ok) throw new Error('Failed to update ticket');
      return await response.json();
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  },

  deleteTicket: async (id) => {
    try {
      const response = await fetch(`/api/support/tickets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete ticket');
      return await response.json();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      throw error;
    }
  },

  addTicketReply: async (ticketId, messageData) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(messageData)
      });
      
      if (!response.ok) throw new Error('Failed to add reply');
      return await response.json();
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  },

  // FAQ API
  getFAQs: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.category && filters.category !== 'all') queryParams.append('category', filters.category);
      if (filters.search) queryParams.append('search', filters.search);
      
      const response = await fetch(`/api/support/faqs?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch FAQs');
      return await response.json();
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      throw error;
    }
  },

  createFAQ: async (faqData) => {
    try {
      const response = await fetch('/api/support/faqs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(faqData)
      });
      
      if (!response.ok) throw new Error('Failed to create FAQ');
      return await response.json();
    } catch (error) {
      console.error('Error creating FAQ:', error);
      throw error;
    }
  },

  updateFAQ: async (id, faqData) => {
    try {
      const response = await fetch(`/api/support/faqs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(faqData)
      });
      
      if (!response.ok) throw new Error('Failed to update FAQ');
      return await response.json();
    } catch (error) {
      console.error('Error updating FAQ:', error);
      throw error;
    }
  },

  deleteFAQ: async (id) => {
    try {
      const response = await fetch(`/api/support/faqs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete FAQ');
      return await response.json();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      throw error;
    }
  },

  // Stats API
  getStats: async () => {
    try {
      const response = await fetch('/api/support/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
};

const SupportManagement = ({ windowWidth }) => {
  const [activeTab, setActiveTab] = useState('tickets');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [showAddFAQ, setShowAddFAQ] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [editingTicket, setEditingTicket] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [faqLoading, setFaqLoading] = useState(false);

  // Data states
  const [tickets, setTickets] = useState([]);
  const [faqData, setFaqData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    pending: 0,
    resolved: 0
  });

  // Form states
  const [newTicketData, setNewTicketData] = useState({
    title: '',
    description: '',
    customer: '',
    customerType: 'customer',
    email: '',
    phone: '',
    priority: 'medium',
    category: 'general',
    assignedTo: 'Support Team A'
  });

  const [newFAQData, setNewFAQData] = useState({
    question: '',
    answer: '',
    category: 'general'
  });

  const categories = [
    { value: 'general', label: 'ทั่วไป' },
    { value: 'account', label: 'บัญชีผู้ใช้' },
    { value: 'payment', label: 'การชำระเงิน' },
    { value: 'refund', label: 'การคืนเงิน' },
    { value: 'technical', label: 'ปัญหาทางเทคนิค' },
    { value: 'service', label: 'บริการ' },
    { value: 'billing', label: 'การเรียกเก็บเงิน' }
  ];

  const statusOptions = [
    { value: 'open', label: 'เปิด', color: 'var(--info)' },
    { value: 'in-progress', label: 'กำลังดำเนินการ', color: 'var(--warning)' },
    { value: 'pending', label: 'รอข้อมูล', color: 'var(--accent)' },
    { value: 'resolved', label: 'แก้ไขแล้ว', color: 'var(--success)' },
    { value: 'closed', label: 'ปิด', color: 'var(--text-muted)' }
  ];

  const priorityOptions = [
    { value: 'urgent', label: 'เร่งด่วน', color: 'var(--danger)' },
    { value: 'high', label: 'สูง', color: 'var(--accent)' },
    { value: 'medium', label: 'ปานกลาง', color: 'var(--warning)' },
    { value: 'low', label: 'ต่ำ', color: 'var(--success)' }
  ];

  const supportTeams = [
    { value: 'Support Team A', label: 'Support Team A' },
    { value: 'Support Team B', label: 'Support Team B' },
    { value: 'Tech Support', label: 'Tech Support' },
    { value: 'Billing Support', label: 'Billing Support' }
  ];

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load data when filters change
  useEffect(() => {
    if (activeTab === 'tickets') {
      loadTickets();
    } else if (activeTab === 'faq') {
      loadFAQs();
    }
  }, [activeTab, statusFilter, priorityFilter, searchTerm]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadTickets(),
        loadFAQs()
      ]);
    } catch (error) {
      setError('ไม่สามารถโหลดข้อมูลได้: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await supportAPI.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadTickets = async () => {
    setTicketsLoading(true);
    try {
      const filters = {
        status: statusFilter,
        priority: priorityFilter,
        search: searchTerm
      };
      const ticketsData = await supportAPI.getTickets(filters);
      setTickets(ticketsData.data || ticketsData);
    } catch (error) {
      setError('ไม่สามารถโหลดตั๋วซัพพอร์ตได้: ' + error.message);
    } finally {
      setTicketsLoading(false);
    }
  };

  const loadFAQs = async () => {
    setFaqLoading(true);
    try {
      const filters = {
        search: searchTerm
      };
      const faqsData = await supportAPI.getFAQs(filters);
      setFaqData(faqsData.data || faqsData);
    } catch (error) {
      setError('ไม่สามารถโหลด FAQ ได้: ' + error.message);
    } finally {
      setFaqLoading(false);
    }
  };

  const loadTicketDetail = async (ticketId) => {
    try {
      const ticketDetail = await supportAPI.getTicketById(ticketId);
      setSelectedTicket(ticketDetail);
    } catch (error) {
      setError('ไม่สามารถโหลดรายละเอียดตั๋วได้: ' + error.message);
    }
  };

  // Ticket CRUD functions
  const handleAddTicket = () => {
    setEditingTicket(null);
    setNewTicketData({
      title: '',
      description: '',
      customer: '',
      customerType: 'customer',
      email: '',
      phone: '',
      priority: 'medium',
      category: 'general',
      assignedTo: 'Support Team A'
    });
    setShowTicketModal(true);
  };

  const handleEditTicket = (ticket) => {
    setEditingTicket(ticket);
    setNewTicketData({
      title: ticket.title,
      description: ticket.description,
      customer: ticket.customer,
      customerType: ticket.customerType,
      email: ticket.email,
      phone: ticket.phone,
      priority: ticket.priority,
      category: ticket.category,
      assignedTo: ticket.assignedTo
    });
    setShowTicketModal(true);
  };

  const handleSaveTicket = async () => {
    if (!newTicketData.title.trim() || !newTicketData.description.trim()) {
      setError('กรุณากรอกหัวข้อและรายละเอียดปัญหา');
      return;
    }

    setLoading(true);
    try {
      if (editingTicket) {
        // Update existing ticket
        const updatedTicket = await supportAPI.updateTicket(editingTicket.id, newTicketData);
        setTickets(prev => prev.map(ticket =>
          ticket.id === editingTicket.id ? updatedTicket : ticket
        ));
      } else {
        // Add new ticket
        const newTicket = await supportAPI.createTicket(newTicketData);
        setTickets(prev => [newTicket, ...prev]);
      }
      
      await loadStats(); // Refresh stats
      setShowTicketModal(false);
      setError(null);
    } catch (error) {
      setError('ไม่สามารถบันทึกตั๋วซัพพอร์ตได้: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTicket = (ticket) => {
    setDeleteTarget({ type: 'ticket', data: ticket });
    setShowDeleteModal(true);
  };

  // FAQ CRUD functions
  const handleAddFAQ = () => {
    setEditingFAQ(null);
    setNewFAQData({
      question: '',
      answer: '',
      category: 'general'
    });
    setShowAddFAQ(true);
  };

  const handleEditFAQ = (faq) => {
    setEditingFAQ(faq);
    setShowAddFAQ(true);
  };

  const handleSaveFAQ = async () => {
    const data = editingFAQ || newFAQData;
    if (!data.question.trim() || !data.answer.trim()) {
      setError('กรุณากรอกคำถามและคำตอบ');
      return;
    }

    setLoading(true);
    try {
      if (editingFAQ) {
        // Update existing FAQ
        const updatedFAQ = await supportAPI.updateFAQ(editingFAQ.id, editingFAQ);
        setFaqData(prev => prev.map(faq =>
          faq.id === editingFAQ.id ? updatedFAQ : faq
        ));
      } else {
        // Add new FAQ
        const newFAQ = await supportAPI.createFAQ(newFAQData);
        setFaqData(prev => [newFAQ, ...prev]);
      }
      
      setShowAddFAQ(false);
      setEditingFAQ(null);
      setError(null);
    } catch (error) {
      setError('ไม่สามารถบันทึก FAQ ได้: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFAQ = (faq) => {
    setDeleteTarget({ type: 'faq', data: faq });
    setShowDeleteModal(true);
  };

  // Delete confirmation
  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      if (deleteTarget.type === 'ticket') {
        await supportAPI.deleteTicket(deleteTarget.data.id);
        setTickets(prev => prev.filter(t => t.id !== deleteTarget.data.id));
        await loadStats(); // Refresh stats
      } else if (deleteTarget.type === 'faq') {
        await supportAPI.deleteFAQ(deleteTarget.data.id);
        setFaqData(prev => prev.filter(f => f.id !== deleteTarget.data.id));
      }
      
      setShowDeleteModal(false);
      setDeleteTarget(null);
      setError(null);
    } catch (error) {
      setError('ไม่สามารถลบข้อมูลได้: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const updatedTicket = await supportAPI.updateTicket(ticketId, { status: newStatus });
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? updatedTicket : ticket
      ));
      
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
      
      await loadStats(); // Refresh stats
    } catch (error) {
      setError('ไม่สามารถอัปเดตสถานะได้: ' + error.message);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      const messageData = {
        message: replyMessage,
        sender: 'support'
      };
      
      const newMessage = await supportAPI.addTicketReply(selectedTicket.id, messageData);
      
      // Update local state
      const updatedConversation = [...(selectedTicket.conversation || []), newMessage];
      setSelectedTicket(prev => ({
        ...prev,
        conversation: updatedConversation,
        responses: (prev.responses || 0) + 1
      }));

      setTickets(prev => prev.map(ticket =>
        ticket.id === selectedTicket.id
          ? {
              ...ticket,
              conversation: updatedConversation,
              responses: (ticket.responses || 0) + 1
            }
          : ticket
      ));

      setReplyMessage('');
    } catch (error) {
      setError('ไม่สามารถส่งข้อความได้: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.color : 'var(--text-muted)';
  };

  const getStatusText = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const getPriorityColor = (priority) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option ? option.color : 'var(--text-muted)';
  };

  const getPriorityText = (priority) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option ? option.label : priority;
  };

  const getCategoryText = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  // Error Alert Component
  const ErrorAlert = () => {
    if (!error) return null;
    
    return (
      <div style={{
        backgroundColor: 'var(--danger)20',
        border: '1px solid var(--danger)',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <AlertTriangle size={20} color="var(--danger)" />
        <span style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>
          {error}
        </span>
        <button
          onClick={() => setError(null)}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: 'var(--danger)',
            cursor: 'pointer'
          }}
        >
          <X size={16} />
        </button>
      </div>
    );
  };

  // Loading Component
  const LoadingSpinner = ({ size = 20 }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <Loader size={size} className="animate-spin" color="var(--accent)" />
    </div>
  );

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
          maxWidth: '600px',
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
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.25rem'
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

  // Ticket Modal Content
  const TicketModalContent = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            หัวข้อ *
          </label>
          <input
            type="text"
            value={newTicketData.title}
            onChange={(e) => setNewTicketData({ ...newTicketData, title: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
            placeholder="กรอกหัวข้อปัญหา"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            ประเภทลูกค้า
          </label>
          <select
            value={newTicketData.customerType}
            onChange={(e) => setNewTicketData({ ...newTicketData, customerType: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <option value="customer">ลูกค้า</option>
            <option value="trainer">เทรนเนอร์</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          รายละเอียดปัญหา *
        </label>
        <textarea
          value={newTicketData.description}
          onChange={(e) => setNewTicketData({ ...newTicketData, description: e.target.value })}
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            resize: 'vertical'
          }}
          placeholder="อธิบายรายละเอียดปัญหา"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            ชื่อลูกค้า *
          </label>
          <input
            type="text"
            value={newTicketData.customer}
            onChange={(e) => setNewTicketData({ ...newTicketData, customer: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
            placeholder="กรอกชื่อลูกค้า"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            อีเมล *
          </label>
          <input
            type="email"
            value={newTicketData.email}
            onChange={(e) => setNewTicketData({ ...newTicketData, email: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
            placeholder="กรอกอีเมล"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            เบอร์โทร
          </label>
          <input
            type="tel"
            value={newTicketData.phone}
            onChange={(e) => setNewTicketData({ ...newTicketData, phone: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
            placeholder="กรอกเบอร์โทร"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            ความสำคัญ
          </label>
          <select
            value={newTicketData.priority}
            onChange={(e) => setNewTicketData({ ...newTicketData, priority: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            หมวดหมู่
          </label>
          <select
            value={newTicketData.category}
            onChange={(e) => setNewTicketData({ ...newTicketData, category: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          มอบหมายให้
        </label>
        <select
          value={newTicketData.assignedTo}
          onChange={(e) => setNewTicketData({ ...newTicketData, assignedTo: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          {supportTeams.map(team => (
            <option key={team.value} value={team.value}>
              {team.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setShowTicketModal(false)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          ยกเลิก
        </button>
        <button
          onClick={handleSaveTicket}
          disabled={loading || !newTicketData.title.trim() || !newTicketData.description.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: loading ? 'var(--bg-tertiary)' : 'var(--accent)',
            color: loading ? 'var(--text-muted)' : 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
          {editingTicket ? 'บันทึก' : 'สร้างตั๋ว'}
        </button>
      </div>
    </>
  );

  // FAQ Modal Content
  const FAQModalContent = () => (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--text-primary)',
          marginBottom: '0.5rem'
        }}>
          คำถาม *
        </label>
        <input
          type="text"
          value={editingFAQ ? editingFAQ.question : newFAQData.question}
          onChange={(e) => {
            if (editingFAQ) {
              setEditingFAQ(prev => ({ ...prev, question: e.target.value }));
            } else {
              setNewFAQData(prev => ({ ...prev, question: e.target.value }));
            }
          }}
          placeholder="กรอกคำถาม..."
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem'
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--text-primary)',
          marginBottom: '0.5rem'
        }}>
          คำตอบ *
        </label>
        <textarea
          value={editingFAQ ? editingFAQ.answer : newFAQData.answer}
          onChange={(e) => {
            if (editingFAQ) {
              setEditingFAQ(prev => ({ ...prev, answer: e.target.value }));
            } else {
              setNewFAQData(prev => ({ ...prev, answer: e.target.value }));
            }
          }}
          placeholder="กรอกคำตอบ..."
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            resize: 'vertical'
          }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--text-primary)',
          marginBottom: '0.5rem'
        }}>
          หมวดหมู่
        </label>
        <select
          value={editingFAQ ? editingFAQ.category : newFAQData.category}
          onChange={(e) => {
            if (editingFAQ) {
              setEditingFAQ(prev => ({ ...prev, category: e.target.value }));
            } else {
              setNewFAQData(prev => ({ ...prev, category: e.target.value }));
            }
          }}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '1rem'
      }}>
        <button
          onClick={() => {
            setShowAddFAQ(false);
            setEditingFAQ(null);
            setNewFAQData({ question: '', answer: '', category: 'general' });
          }}
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          ยกเลิก
        </button>
        <button
          onClick={handleSaveFAQ}
          disabled={
            loading || (
              editingFAQ
                ? !editingFAQ.question.trim() || !editingFAQ.answer.trim()
                : !newFAQData.question.trim() || !newFAQData.answer.trim()
            )
          }
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: loading ? 'var(--bg-tertiary)' : 'var(--accent)',
            color: loading ? 'var(--text-muted)' : 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
          {editingFAQ ? 'บันทึก' : 'เพิ่ม FAQ'}
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
          คุณแน่ใจหรือไม่ที่จะลบ{deleteTarget?.type === 'ticket' ? 'ตั๋วซัพพอร์ต' : 'FAQ'} "{deleteTarget?.data?.title || deleteTarget?.data?.question}"?
          <br />
          การดำเนินการนี้ไม่สามารถยกเลิกได้
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <button
          onClick={() => setShowDeleteModal(false)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          ยกเลิก
        </button>
        <button
          onClick={handleConfirmDelete}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: loading ? 'var(--bg-tertiary)' : 'var(--danger)',
            color: loading ? 'var(--text-muted)' : 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {loading ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
          ลบ
        </button>
      </div>
    </>
  );

  const renderTicketDetail = () => (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <button
          onClick={() => {
            setShowTicketDetail(false);
            setSelectedTicket(null);
          }}
          style={{
            padding: '0.5rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.375rem',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            ตั๋วซัพพอร์ต #{selectedTicket.id}
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            margin: 0
          }}>
            {selectedTicket.title}
          </p>
        </div>
      </div>

      <ErrorAlert />

      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 1024 ? '1fr' : '1fr 300px',
        gap: '2rem'
      }}>
        {/* Conversation Area */}
        <div>
          {/* Ticket Info Header */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  {selectedTicket.title}
                </h3>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  lineHeight: '1.5'
                }}>
                  {selectedTicket.description}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: `${getStatusColor(selectedTicket.status)}20`,
                  color: getStatusColor(selectedTicket.status),
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {getStatusText(selectedTicket.status)}
                </span>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: `${getPriorityColor(selectedTicket.priority)}20`,
                  color: getPriorityColor(selectedTicket.priority),
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {getPriorityText(selectedTicket.priority)}
                </span>
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(3, 1fr)',
              gap: '1rem',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)'
            }}>
              <div>
                <strong>ลูกค้า:</strong> {selectedTicket.customer}
              </div>
              <div>
                <strong>อีเมล:</strong> {selectedTicket.email}
              </div>
              <div>
                <strong>เบอร์โทร:</strong> {selectedTicket.phone}
              </div>
            </div>
          </div>

          {/* Conversation */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '1rem'
            }}>
              บทสนทนา
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(selectedTicket.conversation || []).map((message) => (
                <div key={message.id} style={{
                  display: 'flex',
                  flexDirection: message.sender === 'support' ? 'row-reverse' : 'row',
                  gap: '1rem'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: message.sender === 'support' ? 'var(--accent)' : 'var(--info)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {message.sender === 'support' ? 'S' : 'C'}
                  </div>
                  
                  <div style={{
                    flex: 1,
                    maxWidth: '70%'
                  }}>
                    <div style={{
                      backgroundColor: message.sender === 'support' 
                        ? 'var(--accent)' 
                        : 'var(--bg-tertiary)',
                      color: message.sender === 'support' 
                        ? 'white' 
                        : 'var(--text-primary)',
                      padding: '0.75rem 1rem',
                      borderRadius: '1rem',
                      fontSize: '0.875rem',
                      lineHeight: '1.5'
                    }}>
                      {message.message}
                    </div>
                    
                    {message.attachments && message.attachments.length > 0 && (
                      <div style={{
                        marginTop: '0.5rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                        {message.attachments.map((attachment, index) => (
                          <span key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)'
                          }}>
                            <Paperclip size={12} />
                            {attachment}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginTop: '0.25rem',
                      textAlign: message.sender === 'support' ? 'right' : 'left'
                    }}>
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reply Box */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem'
          }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '1rem'
            }}>
              ตอบกลับ
            </h4>
            
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="พิมพ์ข้อความตอบกลับ..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                marginBottom: '1rem',
                resize: 'vertical'
              }}
            />
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={{
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.375rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}>
                  <Paperclip size={16} />
                </button>
              </div>
              
              <button
                onClick={sendReply}
                disabled={loading || !replyMessage.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: (!replyMessage.trim() || loading) ? 'var(--bg-tertiary)' : 'var(--accent)',
                  color: (!replyMessage.trim() || loading) ? 'var(--text-muted)' : 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: (!replyMessage.trim() || loading) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                ส่งข้อความ
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Quick Actions */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '1rem'
            }}>
              การดำเนินการ
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <select
                value={selectedTicket.status}
                onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedTicket.priority}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedTicket.assignedTo}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                {supportTeams.map(team => (
                  <option key={team.value} value={team.value}>
                    {team.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ticket Info */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '1.5rem'
          }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '1rem'
            }}>
              ข้อมูลตั๋ว
            </h4>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              fontSize: '0.875rem'
            }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>หมวดหมู่:</span>
                <br />
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                  {getCategoryText(selectedTicket.category)}
                </span>
              </div>
              
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>สร้างเมื่อ:</span>
                <br />
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                  {selectedTicket.createdAt}
                </span>
              </div>
              
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>อัปเดตล่าสุด:</span>
                <br />
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                  {selectedTicket.updatedAt}
                </span>
              </div>
              
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>จำนวนข้อความ:</span>
                <br />
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                  {selectedTicket.responses || 0} ข้อความ
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTicketsTab = () => (
    <div>
      <ErrorAlert />
      
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
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
            <MessageSquare size={20} color="var(--accent)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ทั้งหมด</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.total}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={20} color="var(--info)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>เปิด</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.open}
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
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>กำลังดำเนินการ</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.inProgress}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Flag size={20} color="var(--accent)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>รอข้อมูล</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.pending}
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
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>แก้ไขแล้ว</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.resolved}
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
            placeholder="ค้นหาตั๋วซัพพอร์ต..."
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
            minWidth: '140px'
          }}
        >
          <option value="all">สถานะทั้งหมด</option>
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            minWidth: '120px'
          }}
        >
          <option value="all">ความสำคัญทั้งหมด</option>
          {priorityOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button 
          onClick={handleAddTicket}
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={16} />
          เพิ่มตั๋วใหม่
        </button>
      </div>

      {/* Loading State for Tickets */}
      {ticketsLoading && <LoadingSpinner />}

      {/* Tickets List */}
      {!ticketsLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tickets.map((ticket) => (
            <div key={ticket.id} style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem'
            }}>
              {/* Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                  <div style={{
                    backgroundColor: `${getPriorityColor(ticket.priority)}20`,
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    color: getPriorityColor(ticket.priority)
                  }}>
                    {ticket.customerType === 'customer' ? <User size={20} /> : <Target size={20} />}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem',
                      marginBottom: '0.5rem'
                    }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        margin: 0
                      }}>
                        #{ticket.id} - {ticket.title}
                      </h3>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: `${getStatusColor(ticket.status)}20`,
                        color: getStatusColor(ticket.status),
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {getStatusText(ticket.status)}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: `${getPriorityColor(ticket.priority)}20`,
                        color: getPriorityColor(ticket.priority),
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {getPriorityText(ticket.priority)}
                      </span>
                    </div>
                    
                    <p style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5',
                      marginBottom: '1rem'
                    }}>
                      {ticket.description}
                    </p>
                    
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(2, 1fr)',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span><strong>ลูกค้า:</strong> {ticket.customer}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span><strong>หมวดหมู่:</strong> {getCategoryText(ticket.category)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={14} />
                        <span>{ticket.email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={14} />
                        <span>{ticket.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.375rem',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                    onClick={async () => {
                      await loadTicketDetail(ticket.id);
                      setShowTicketDetail(true);
                    }}
                    title="ดูรายละเอียด"
                  >
                    <Eye size={16} />
                  </button>
                  <button 
                    onClick={() => handleEditTicket(ticket)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.375rem',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                    title="แก้ไข"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteTicket(ticket)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.375rem',
                      color: 'var(--danger)',
                      cursor: 'pointer'
                    }}
                    title="ลบ"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={12} />
                    <span>สร้าง: {ticket.createdAt}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} />
                    <span>อัปเดต: {ticket.updatedAt}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MessageCircle size={12} />
                    <span>{ticket.responses || 0} ข้อความ</span>
                  </div>
                  {ticket.attachments > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Paperclip size={12} />
                      <span>{ticket.attachments} ไฟล์แนบ</span>
                    </div>
                  )}
                </div>
                <div>
                  <span>มอบหมายให้: {ticket.assignedTo}</span>
                </div>
              </div>
            </div>
          ))}

          {!ticketsLoading && tickets.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'var(--text-secondary)'
            }}>
              <MessageSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                ไม่พบตั๋วซัพพอร์ต
              </h3>
              <p style={{ fontSize: '0.875rem' }}>
                ยังไม่มีตั๋วซัพพอร์ตในระบบ หรือลองปรับเปลี่ยนเงื่อนไขการค้นหา
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderFAQTab = () => (
    <div>
      <ErrorAlert />
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: 'var(--text-primary)'
        }}>
          คำถามที่พบบ่อย
        </h2>
        <button
          onClick={handleAddFAQ}
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
            gap: '0.5rem'
          }}
        >
          <Plus size={16} />
          เพิ่ม FAQ ใหม่
        </button>
      </div>

      {/* Search and Filter for FAQ */}
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
            placeholder="ค้นหา FAQ..."
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
        <select style={{
          padding: '0.75rem',
          border: '1px solid var(--border-color)',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          minWidth: '140px'
        }}>
          <option value="all">หมวดหมู่ทั้งหมด</option>
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State for FAQs */}
      {faqLoading && <LoadingSpinner />}

      {/* FAQ List */}
      {!faqLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqData.map((faq) => (
            <div key={faq.id} style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  flex: 1
                }}>
                  {faq.question}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleEditFAQ(faq)}
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
                    onClick={() => handleDeleteFAQ(faq)}
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
              </div>

              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                marginBottom: '1rem'
              }}>
                {faq.answer}
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span>หมวดหมู่: {getCategoryText(faq.category)}</span>
                  <span>👁️ {faq.views || 0} ครั้ง</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Star size={12} fill="var(--warning)" color="var(--warning)" />
                    <span>{faq.helpful || 0} คนว่าเป็นประโยชน์</span>
                  </div>
                </div>
                <span>อัปเดตล่าสุด: {faq.lastUpdated}</span>
              </div>
            </div>
          ))}

          {!faqLoading && faqData.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'var(--text-secondary)'
            }}>
              <MessageCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                ไม่พบ FAQ
              </h3>
              <p style={{ fontSize: '0.875rem' }}>
                ยังไม่มี FAQ ในระบบ หรือลองปรับเปลี่ยนเงื่อนไขการค้นหา
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <LoadingSpinner size={32} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          กำลังโหลดข้อมูล...
        </p>
      </div>
    );
  }

  if (showTicketDetail && selectedTicket) {
    return renderTicketDetail();
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '1.75rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          marginBottom: '0.5rem' 
        }}>
          ซัพพอร์ต
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          จัดการตั๋วซัพพอร์ต คำถามที่พบบ่อย และการสนับสนุนลูกค้า
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
            borderBottom: activeTab === 'tickets' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'tickets' ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onClick={() => setActiveTab('tickets')}
        >
          <MessageSquare size={16} />
          ตั๋วซัพพอร์ต
        </button>
        <button
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'faq' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'faq' ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onClick={() => setActiveTab('faq')}
        >
          <MessageCircle size={16} />
          คำถามที่พบบ่อย
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'tickets' && renderTicketsTab()}
      {activeTab === 'faq' && renderFAQTab()}

      {/* Modals */}
      <Modal 
        show={showTicketModal} 
        onClose={() => setShowTicketModal(false)}
        title={editingTicket ? 'แก้ไขตั๋วซัพพอร์ต' : 'เพิ่มตั๋วซัพพอร์ตใหม่'}
      >
        <TicketModalContent />
      </Modal>

      <Modal 
        show={showAddFAQ} 
        onClose={() => {
          setShowAddFAQ(false);
          setEditingFAQ(null);
          setNewFAQData({ question: '', answer: '', category: 'general' });
        }}
        title={editingFAQ ? 'แก้ไข FAQ' : 'เพิ่ม FAQ ใหม่'}
      >
        <FAQModalContent />
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

export default SupportManagement;