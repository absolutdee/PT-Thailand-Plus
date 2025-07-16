import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Clock, Plus, ChevronLeft, ChevronRight, 
  MapPin, Users, Edit, Trash2, Check, X, Filter,
  Search, Download, Bell, RefreshCw, Eye, Copy,
  AlertCircle, CheckCircle, XCircle, Settings,
  Phone, Video, MessageCircle, MoreVertical
} from 'lucide-react';

const SchedulePage = ({ windowWidth }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week', 'month', 'day'
  const [showAddSession, setShowAddSession] = useState(false);
  const [showEditSession, setShowEditSession] = useState(false);
  const [showSessionDetail, setShowSessionDetail] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Database states
  const [sessions, setSessions] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchSessions(),
        fetchClients()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/trainer/sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/trainer/clients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchInitialData();
      addNotification('รีเฟรชข้อมูลเรียบร้อยแล้ว', 'success');
    } catch (error) {
      addNotification('เกิดข้อผิดพลาดในการรีเฟรชข้อมูล', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const createSession = async (sessionData) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/trainer/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const newSession = await response.json();
      setSessions(prev => [...prev, newSession]);
      addNotification('สร้างเซสชันใหม่เรียบร้อยแล้ว', 'success');
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      addNotification('เกิดข้อผิดพลาดในการสร้างเซสชัน', 'error');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const updateSession = async (sessionId, sessionData) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/trainer/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      const updatedSession = await response.json();
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId ? updatedSession : session
        )
      );
      addNotification('อัปเดตเซสชันเรียบร้อยแล้ว', 'success');
      return updatedSession;
    } catch (error) {
      console.error('Error updating session:', error);
      addNotification('เกิดข้อผิดพลาดในการอัปเดตเซสชัน', 'error');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบเซสชันนี้?')) return;

    try {
      const response = await fetch(`/api/trainer/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      setSessions(prev => prev.filter(session => session.id !== sessionId));
      addNotification('ลบเซสชันเรียบร้อยแล้ว', 'success');
      setShowSessionDetail(false);
      setSelectedSession(null);
    } catch (error) {
      console.error('Error deleting session:', error);
      addNotification('เกิดข้อผิดพลาดในการลบเซสชัน', 'error');
    }
  };

  const updateSessionStatus = async (sessionId, newStatus) => {
    try {
      const response = await fetch(`/api/trainer/sessions/${sessionId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update session status');
      }

      const updatedSession = await response.json();
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId ? updatedSession : session
        )
      );
      
      addNotification(`อัปเดตสถานะเซสชันเป็น "${getStatusText(newStatus)}" เรียบร้อยแล้ว`, 'success');
    } catch (error) {
      console.error('Error updating session status:', error);
      addNotification('เกิดข้อผิดพลาดในการอัปเดตสถานะ', 'error');
    }
  };

  const duplicateSession = async (session) => {
    try {
      const newSessionData = {
        clientId: session.clientId,
        date: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // Next week
        startTime: session.startTime,
        endTime: session.endTime,
        type: session.type,
        location: session.location,
        notes: session.notes,
        recurring: session.recurring
      };

      await createSession(newSessionData);
      addNotification('คัดลอกเซสชันเรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error('Error duplicating session:', error);
      addNotification('เกิดข้อผิดพลาดในการคัดลอกเซสชัน', 'error');
    }
  };

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00'
  ];

  const sessionTypes = [
    { value: 'personal', label: 'Personal Training', color: '#232956' },
    { value: 'weight-loss', label: 'Weight Loss Program', color: '#df2528' },
    { value: 'muscle-building', label: 'Muscle Building', color: '#28a745' },
    { value: 'rehabilitation', label: 'Rehabilitation', color: '#ffc107' },
    { value: 'group', label: 'Group Training', color: '#6f42c1' }
  ];

  // Utility Functions
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getWeekDates = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getMonthDates = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);

    // Adjust to start from Monday
    const startDayOfWeek = startDate.getDay();
    const daysToSubtract = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);

    // Adjust to end on Sunday
    const endDayOfWeek = endDate.getDay();
    const daysToAdd = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
    endDate.setDate(endDate.getDate() + daysToAdd);

    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  const getFilteredSessions = () => {
    return sessions.filter(session => {
      const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
      const matchesClient = filterClient === 'all' || session.clientId === filterClient;
      const matchesSearch = session.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          session.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          session.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesClient && matchesSearch;
    });
  };

  const getSessionsForDate = (date) => {
    const dateStr = formatDate(date);
    return getFilteredSessions().filter(session => session.date === dateStr);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#28a745';
      case 'pending':
        return '#ffc107';
      case 'cancelled':
        return '#dc3545';
      case 'completed':
        return '#6f42c1';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'ยืนยันแล้ว';
      case 'pending':
        return 'รอยืนยัน';
      case 'cancelled':
        return 'ยกเลิก';
      case 'completed':
        return 'เสร็จสิ้น';
      default:
        return status;
    }
  };

  // Navigation Functions
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction * 7));
    } else if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  // Session Management
  const handleUpdateSessionStatus = (sessionId, newStatus) => {
    updateSessionStatus(sessionId, newStatus);
  };

  const handleDeleteSession = (sessionId) => {
    deleteSession(sessionId);
  };

  const handleDuplicateSession = (session) => {
    duplicateSession(session);
  };

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Export Functions
  const exportSchedule = async () => {
    try {
      const response = await fetch('/api/trainer/sessions/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filters: {
            status: filterStatus,
            client: filterClient,
            search: searchTerm
          },
          period: viewMode,
          date: formatDate(currentDate)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export schedule');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `schedule_${formatDate(new Date())}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addNotification('ส่งออกตารางเรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error('Error exporting schedule:', error);
      addNotification('เกิดข้อผิดพลาดในการส่งออกตาราง', 'error');
    }
  };

  // Modal Components
  const SessionFormModal = ({ isEdit = false }) => {
    const [formData, setFormData] = useState(
      isEdit && selectedSession ? {
        clientId: selectedSession.clientId,
        date: selectedSession.date,
        startTime: selectedSession.startTime,
        endTime: selectedSession.endTime,
        type: selectedSession.type,
        location: selectedSession.location,
        notes: selectedSession.notes,
        recurring: selectedSession.recurring
      } : {
        clientId: '',
        date: formatDate(new Date()),
        startTime: '09:00',
        endTime: '10:00',
        type: 'personal',
        location: '',
        notes: '',
        recurring: false
      }
    );

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      try {
        if (isEdit) {
          await updateSession(selectedSession.id, formData);
          setShowEditSession(false);
        } else {
          await createSession(formData);
          setShowAddSession(false);
        }
        setSelectedSession(null);
      } catch (error) {
        // Error handling is done in the API functions
      }
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
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
              {isEdit ? 'แก้ไขเซสชัน' : 'เพิ่มเซสชันใหม่'}
            </h2>
            <button
              onClick={() => {
                if (isEdit) setShowEditSession(false);
                else setShowAddSession(false);
                setSelectedSession(null);
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
          
          <div style={{ padding: '1.5rem' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  ลูกค้า *
                </label>
                <select 
                  required
                  value={formData.clientId}
                  onChange={(e) => handleChange('clientId', e.target.value)}
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
                  <option value="">เลือกลูกค้า</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    วันที่ *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
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
                    ประเภท *
                  </label>
                  <select 
                    required
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
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
                    {sessionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    เวลาเริ่มต้น *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => handleChange('startTime', e.target.value)}
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
                    เวลาสิ้นสุด *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => handleChange('endTime', e.target.value)}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    สถานที่
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="เช่น ห้องยิม A"
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

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  หมายเหตุ
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติม..."
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.recurring}
                  onChange={(e) => handleChange('recurring', e.target.checked)}
                  style={{ width: '1rem', height: '1rem' }}
                />
                <label htmlFor="recurring" style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  เซสชันซ้ำ (รายสัปดาห์)
                </label>
              </div>

              <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginTop: '1rem'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    if (isEdit) setShowEditSession(false);
                    else setShowAddSession(false);
                    setSelectedSession(null);
                  }}
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
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    backgroundColor: submitting ? 'var(--text-muted)' : 'var(--accent)',
                    color: 'var(--text-white)',
                    border: 'none',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  {submitting ? 'กำลังบันทึก...' : (isEdit ? 'อัปเดต' : 'สร้างเซสชัน')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const SessionDetailModal = () => {
    if (!showSessionDetail || !selectedSession) return null;

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
          maxWidth: '500px',
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
              รายละเอียดเซสชัน
            </h2>
            <button
              onClick={() => {
                setShowSessionDetail(false);
                setSelectedSession(null);
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

          <div style={{ padding: '1.5rem' }}>
            {/* Client Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.75rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
                color: 'var(--text-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: '700'
              }}>
                {selectedSession.clientAvatar || selectedSession.clientName.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {selectedSession.clientName}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {selectedSession.clientPhone}
                </p>
              </div>
            </div>

            {/* Session Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>วันที่</label>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0.25rem 0 0' }}>
                    {new Date(selectedSession.date).toLocaleDateString('th-TH', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>เวลา</label>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0.25rem 0 0' }}>
                    {selectedSession.startTime} - {selectedSession.endTime}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ประเภท</label>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0.25rem 0 0' }}>
                    {selectedSession.type}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>สถานที่</label>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0.25rem 0 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={14} />
                    {selectedSession.location}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>สถานะ</label>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    margin: '0.25rem 0 0',
                    color: getStatusColor(selectedSession.status),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {selectedSession.status === 'confirmed' && <CheckCircle size={16} />}
                    {selectedSession.status === 'pending' && <AlertCircle size={16} />}
                    {selectedSession.status === 'cancelled' && <XCircle size={16} />}
                    {getStatusText(selectedSession.status)}
                  </p>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ความคืบหน้า</label>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0.25rem 0 0' }}>
                  เซสชันที่ {selectedSession.sessionNumber || 1} จาก {selectedSession.totalSessions || 10}
                </p>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '4px',
                  marginTop: '0.5rem',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${((selectedSession.sessionNumber || 1) / (selectedSession.totalSessions || 10)) * 100}%`,
                    height: '100%',
                    backgroundColor: 'var(--accent)',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>

              {selectedSession.notes && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>หมายเหตุ</label>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: '0.25rem 0 0', lineHeight: '1.5' }}>
                    {selectedSession.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: windowWidth <= 480 ? '1fr' : 'repeat(2, 1fr)',
              gap: '0.75rem',
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-color)'
            }}>
              <button
                onClick={() => {
                  setShowSessionDetail(false);
                  setShowEditSession(true);
                }}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Edit size={16} />
                แก้ไข
              </button>

              <button
                onClick={() => handleDuplicateSession(selectedSession)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Copy size={16} />
                คัดลอก
              </button>

              {selectedSession.status === 'pending' && (
                <button
                  onClick={() => handleUpdateSessionStatus(selectedSession.id, 'confirmed')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: 'var(--success)',
                    color: 'var(--text-white)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Check size={16} />
                  ยืนยัน
                </button>
              )}

              <button
                onClick={() => handleDeleteSession(selectedSession.id)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: 'var(--danger)',
                  color: 'var(--text-white)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Trash2 size={16} />
                ลบ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // View Renderers
  const renderDayView = () => {
    const dayDate = currentDate;
    const daySessions = getSessionsForDate(dayDate);

    return (
      <div>
        {/* Day Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => navigateDate(-1)}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            textAlign: 'center'
          }}>
            {dayDate.toLocaleDateString('th-TH', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>

          <button
            onClick={() => navigateDate(1)}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day Schedule */}
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
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              เซสชันวันนี้ ({daySessions.length})
            </h3>
          </div>

          <div style={{ padding: '1rem' }}>
            {daySessions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {daySessions
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        setSelectedSession(session);
                        setShowSessionDetail(true);
                      }}
                      style={{
                        padding: '1.5rem',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '0.75rem',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent)',
                            color: 'var(--text-white)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            fontWeight: '700'
                          }}>
                            {session.clientAvatar || session.clientName.charAt(0)}
                          </div>
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                              {session.clientName}
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              {session.type}
                            </p>
                          </div>
                        </div>
                        
                        <div style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: getStatusColor(session.status) + '20',
                          color: getStatusColor(session.status)
                        }}>
                          {getStatusText(session.status)}
                        </div>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: windowWidth <= 480 ? '1fr' : 'repeat(2, 1fr)',
                        gap: '1rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Clock size={16} />
                          {session.startTime} - {session.endTime}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <MapPin size={16} />
                          {session.location}
                        </div>
                      </div>

                      {session.notes && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '0.75rem',
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          color: 'var(--text-secondary)',
                          borderLeft: '3px solid var(--accent)'
                        }}>
                          {session.notes}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'var(--text-secondary)'
              }}>
                <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  ไม่มีเซสชันในวันนี้
                </h3>
                <p style={{ fontSize: '0.875rem' }}>
                  คลิก "เพิ่มเซสชัน" เพื่อสร้างเซสชันใหม่
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);

    return (
      <div>
        {/* Week Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => navigateDate(-1)}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            textAlign: 'center'
          }}>
            {weekDates[0].toLocaleDateString('th-TH', { day: 'numeric', month: 'long' })} - {' '}
            {weekDates[6].toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>

          <button
            onClick={() => navigateDate(1)}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Week Calendar */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          {/* Days Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? 'repeat(7, 1fr)' : '80px repeat(7, 1fr)',
            borderBottom: '1px solid var(--border-color)'
          }}>
            {windowWidth > 768 && (
              <div style={{
                padding: '1rem',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-secondary)'
              }}>
                เวลา
              </div>
            )}
            {weekDates.map((date, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  backgroundColor: formatDate(date) === formatDate(new Date()) ? 'rgba(223, 37, 40, 0.1)' : 'var(--bg-secondary)',
                  borderLeft: index > 0 || windowWidth > 768 ? '1px solid var(--border-color)' : 'none'
                }}
              >
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.25rem'
                }}>
                  {date.toLocaleDateString('th-TH', { weekday: 'short' })}
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: formatDate(date) === formatDate(new Date()) ? 'var(--accent)' : 'var(--text-primary)'
                }}>
                  {date.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots and Sessions */}
          {windowWidth > 768 ? (
            // Desktop view with time slots
            <div style={{ maxHeight: '600px', overflow: 'auto' }}>
              {timeSlots.map((time, timeIndex) => (
                <div
                  key={timeIndex}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px repeat(7, 1fr)',
                    minHeight: '60px',
                    borderBottom: timeIndex < timeSlots.length - 1 ? '1px solid var(--border-color)' : 'none'
                  }}
                >
                  <div style={{
                    padding: '1rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {time}
                  </div>
                  {weekDates.map((date, dayIndex) => {
                    const dateSessions = getSessionsForDate(date).filter(session => 
                      session.startTime.startsWith(time.split(':')[0])
                    );
                    
                    return (
                      <div
                        key={dayIndex}
                        style={{
                          padding: '0.5rem',
                          borderLeft: '1px solid var(--border-color)',
                          minHeight: '60px',
                          position: 'relative'
                        }}
                      >
                        {dateSessions.map((session) => (
                          <div
                            key={session.id}
                            onClick={() => {
                              setSelectedSession(session);
                              setShowSessionDetail(true);
                            }}
                            style={{
                              padding: '0.5rem',
                              margin: '0.25rem 0',
                              backgroundColor: getStatusColor(session.status) + '20',
                              border: `1px solid ${getStatusColor(session.status)}`,
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'scale(1.02)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'scale(1)';
                            }}
                          >
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                              {session.clientName}
                            </div>
                            <div style={{ color: 'var(--text-secondary)' }}>
                              {session.startTime}-{session.endTime}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            // Mobile view - show sessions for each day
            <div>
              {weekDates.map((date, dayIndex) => {
                const dateSessions = getSessionsForDate(date);
                
                return (
                  <div
                    key={dayIndex}
                    style={{
                      borderBottom: dayIndex < weekDates.length - 1 ? '1px solid var(--border-color)' : 'none'
                    }}
                  >
                    <div style={{
                      padding: '1rem',
                      backgroundColor: 'var(--bg-secondary)',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span>
                        {date.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </span>
                      <span style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        backgroundColor: 'var(--bg-primary)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem'
                      }}>
                        {dateSessions.length} เซสชัน
                      </span>
                    </div>
                    <div style={{ padding: '1rem' }}>
                      {dateSessions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {dateSessions
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((session) => (
                              <div
                                key={session.id}
                                onClick={() => {
                                  setSelectedSession(session);
                                  setShowSessionDetail(true);
                                }}
                                style={{
                                  padding: '1rem',
                                  backgroundColor: 'var(--bg-secondary)',
                                  borderRadius: '0.5rem',
                                  border: '1px solid var(--border-color)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: '0.5rem'
                                }}>
                                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                    {session.clientName}
                                  </div>
                                  <div style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.75rem',
                                    backgroundColor: getStatusColor(session.status) + '20',
                                    color: getStatusColor(session.status)
                                  }}>
                                    {getStatusText(session.status)}
                                  </div>
                                </div>
                                <div style={{
                                  fontSize: '0.875rem',
                                  color: 'var(--text-secondary)',
                                  marginBottom: '0.25rem'
                                }}>
                                  {session.startTime} - {session.endTime} • {session.type}
                                </div>
                                <div style={{
                                  fontSize: '0.875rem',
                                  color: 'var(--text-secondary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  <MapPin size={14} />
                                  {session.location}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div style={{
                          textAlign: 'center',
                          padding: '2rem',
                          color: 'var(--text-secondary)',
                          fontSize: '0.875rem'
                        }}>
                          ไม่มีเซสชันในวันนี้
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthDates = getMonthDates(currentDate);
    const weeks = [];
    
    for (let i = 0; i < monthDates.length; i += 7) {
      weeks.push(monthDates.slice(i, i + 7));
    }

    return (
      <div>
        {/* Month Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => navigateDate(-1)}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            textAlign: 'center'
          }}>
            {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
          </h2>

          <button
            onClick={() => navigateDate(1)}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Month Calendar */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          {/* Weekday Headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)'
          }}>
            {['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'].map((day, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  borderRight: index < 6 ? '1px solid var(--border-color)' : 'none'
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div>
            {weeks.map((week, weekIndex) => (
              <div
                key={weekIndex}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  borderBottom: weekIndex < weeks.length - 1 ? '1px solid var(--border-color)' : 'none'
                }}
              >
                {week.map((date, dayIndex) => {
                  const dateSessions = getSessionsForDate(date);
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                  const isToday = formatDate(date) === formatDate(new Date());

                  return (
                    <div
                      key={dayIndex}
                      style={{
                        minHeight: windowWidth <= 768 ? '80px' : '120px',
                        padding: '0.5rem',
                        borderRight: dayIndex < 6 ? '1px solid var(--border-color)' : 'none',
                        backgroundColor: isToday ? 'rgba(223, 37, 40, 0.1)' : (isCurrentMonth ? 'var(--bg-primary)' : 'var(--bg-secondary)'),
                        opacity: isCurrentMonth ? 1 : 0.6
                      }}
                    >
                      <div style={{
                        fontWeight: '600',
                        color: isToday ? 'var(--accent)' : (isCurrentMonth ? 'var(--text-primary)' : 'var(--text-secondary)'),
                        marginBottom: '0.5rem',
                        fontSize: windowWidth <= 768 ? '0.875rem' : '1rem'
                      }}>
                        {date.getDate()}
                      </div>

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}>
                        {dateSessions.slice(0, windowWidth <= 768 ? 2 : 3).map((session, sessionIndex) => (
                          <div
                            key={sessionIndex}
                            onClick={() => {
                              setSelectedSession(session);
                              setShowSessionDetail(true);
                            }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              backgroundColor: getStatusColor(session.status) + '20',
                              color: getStatusColor(session.status),
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {session.startTime} {session.clientName}
                          </div>
                        ))}
                        
                        {dateSessions.length > (windowWidth <= 768 ? 2 : 3) && (
                          <div style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            textAlign: 'center'
                          }}>
                            +{dateSessions.length - (windowWidth <= 768 ? 2 : 3)} เพิ่มเติม
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Notifications Component
  const NotificationToast = () => {
    if (notifications.length === 0) return null;

    return (
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: 
                notification.type === 'success' ? '#d4edda' :
                notification.type === 'error' ? '#f8d7da' :
                notification.type === 'warning' ? '#fff3cd' : '#d1ecf1',
              color: 
                notification.type === 'success' ? '#155724' :
                notification.type === 'error' ? '#721c24' :
                notification.type === 'warning' ? '#856404' : '#0c5460',
              border: `1px solid ${
                notification.type === 'success' ? '#c3e6cb' :
                notification.type === 'error' ? '#f5c6cb' :
                notification.type === 'warning' ? '#ffeeba' : '#bee5eb'
              }`,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              maxWidth: '300px',
              fontSize: '0.875rem',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem'
            }}>
              <span>{notification.message}</span>
              <button
                onClick={() => {
                  setNotifications(prev => prev.filter(n => n.id !== notification.id));
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',
                  fontSize: '1rem'
                }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // CSS animation for notifications
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
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '60vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--border-color)',
          borderTop: '4px solid var(--accent)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: 'var(--text-secondary)' }}>กำลังโหลดข้อมูลตาราง...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '1rem',
        padding: '2rem',
        textAlign: 'center',
        border: '1px solid var(--danger)',
        margin: '2rem 0'
      }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
        <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>เกิดข้อผิดพลาด</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={fetchInitialData}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--primary)',
            color: 'var(--text-white)',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div>
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
            ตารางการเทรน
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            จัดการและติดตามเซสชันการเทรนของคุณ
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: windowWidth <= 480 ? 'column' : 'row',
          gap: '0.75rem'
        }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-primary)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            {['day', 'week', 'month'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: viewMode === mode ? 'var(--accent)' : 'transparent',
                  color: viewMode === mode ? 'var(--text-white)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '0.375rem',
                  margin: '0.125rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {mode === 'day' ? 'วัน' : mode === 'week' ? 'สัปดาห์' : 'เดือน'}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: showFilters ? 'var(--accent)' : 'var(--bg-secondary)',
                color: showFilters ? 'var(--text-white)' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Filter size={16} />
            </button>

            <button
              onClick={exportSchedule}
              style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Download size={16} />
            </button>

            <button
              onClick={refreshData}
              disabled={refreshing}
              style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: refreshing ? 0.6 : 1
              }}
            >
              <RefreshCw size={16} style={{ 
                animation: refreshing ? 'spin 1s linear infinite' : 'none' 
              }} />
            </button>

            <button
              onClick={() => setShowAddSession(true)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: 'var(--accent)',
                color: 'var(--text-white)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap'
              }}
            >
              <Plus size={16} />
              เพิ่มเซสชัน
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? 
              (windowWidth <= 480 ? '1fr' : 'repeat(2, 1fr)') : 
              'repeat(4, 1fr)',
            gap: '1rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                ค้นหา
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={20} style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)'
                }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ชื่อลูกค้า, ประเภท, สถานที่..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-secondary)',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                สถานะ
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
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
                <option value="all">ทั้งหมด</option>
                <option value="pending">รอยืนยัน</option>
                <option value="confirmed">ยืนยันแล้ว</option>
                <option value="completed">เสร็จสิ้น</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                ลูกค้า
              </label>
              <select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
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
                <option value="all">ทั้งหมด</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterClient('all');
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <RefreshCw size={16} />
                ล้างตัวกรอง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? 
          (windowWidth <= 480 ? '1fr' : 'repeat(2, 1fr)') : 
          'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {getSessionsForDate(new Date()).length}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>เซสชันวันนี้</div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#28a745', marginBottom: '0.25rem' }}>
            {getFilteredSessions().filter(s => s.status === 'confirmed').length}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>ยืนยันแล้ว</div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#ffc107', marginBottom: '0.25rem' }}>
            {getFilteredSessions().filter(s => s.status === 'pending').length}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>รอยืนยัน</div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#17a2b8', marginBottom: '0.25rem' }}>
            92%
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>อัตราเข้าร่วม</div>
        </div>
      </div>

      {/* Calendar Views */}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}

      {/* Modals */}
      {showAddSession && <SessionFormModal />}
      {showEditSession && <SessionFormModal isEdit={true} />}
      {showSessionDetail && <SessionDetailModal />}

      {/* Notifications */}
      <NotificationToast />
    </div>
  );
};

export default SchedulePage;