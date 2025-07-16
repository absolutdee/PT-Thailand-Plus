// src/components/trainer/WorkoutPlanPage.jsx
import React, { useState, useEffect } from 'react';
import { useTrainer } from '../../contexts/TrainerContext';

const WorkoutPlanPage = () => {
  const { clients, loading: clientsLoading } = useTrainer();
  const [selectedClient, setSelectedClient] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('plans');

  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Data States
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [exercises, setExercises] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Get trainer ID from localStorage or context
  const trainerId = localStorage.getItem('trainerId') || 'current';

  const exerciseCategories = [
    { name: 'Upper Body', icon: 'fas fa-dumbbell', color: '#232956' },
    { name: 'Lower Body', icon: 'fas fa-running', color: '#df2528' },
    { name: 'Core', icon: 'fas fa-fire', color: '#28a745' },
    { name: 'Cardio', icon: 'fas fa-heartbeat', color: '#dc3545' },
    { name: 'Flexibility', icon: 'fas fa-leaf', color: '#17a2b8' },
    { name: 'Full Body', icon: 'fas fa-user', color: '#ffc107' }
  ];

  // API Functions
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`/api/trainer${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Fetch workout plans
  const fetchWorkoutPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall('/workout-plans');
      setWorkoutPlans(response.data || []);
    } catch (err) {
      console.error('Error fetching workout plans:', err);
      setError(err.message);
      
      // Fallback to demo data on error
      loadDemoData();
    } finally {
      setLoading(false);
    }
  };

  // Fetch exercises library
  const fetchExercises = async () => {
    try {
      const response = await apiCall('/exercises');
      const exercisesByCategory = {};
      
      exerciseCategories.forEach(category => {
        exercisesByCategory[category.name] = response.data.filter(
          exercise => exercise.category === category.name
        ) || [];
      });
      
      setExercises(exercisesByCategory);
    } catch (err) {
      console.error('Error fetching exercises:', err);
      
      // Fallback to demo exercises
      setExercises({
        'Upper Body': [
          { id: 1, name: 'Push-ups', sets: 3, reps: '10-15', category: 'Upper Body' },
          { id: 2, name: 'Pull-ups', sets: 3, reps: '5-10', category: 'Upper Body' },
          { id: 3, name: 'Chest Press', sets: 3, reps: '12-15', category: 'Upper Body' },
          { id: 4, name: 'Shoulder Press', sets: 3, reps: '10-12', category: 'Upper Body' }
        ],
        'Lower Body': [
          { id: 5, name: 'Squats', sets: 3, reps: '15-20', category: 'Lower Body' },
          { id: 6, name: 'Lunges', sets: 3, reps: '12-15', category: 'Lower Body' },
          { id: 7, name: 'Deadlifts', sets: 3, reps: '10-12', category: 'Lower Body' },
          { id: 8, name: 'Calf Raises', sets: 3, reps: '15-20', category: 'Lower Body' }
        ],
        'Core': [
          { id: 9, name: 'Plank', sets: 3, reps: '30-60 sec', category: 'Core' },
          { id: 10, name: 'Crunches', sets: 3, reps: '15-20', category: 'Core' },
          { id: 11, name: 'Russian Twists', sets: 3, reps: '20-30', category: 'Core' },
          { id: 12, name: 'Mountain Climbers', sets: 3, reps: '30 sec', category: 'Core' }
        ],
        'Cardio': [
          { id: 13, name: 'Jumping Jacks', sets: 3, reps: '30 sec', category: 'Cardio' },
          { id: 14, name: 'Burpees', sets: 3, reps: '10-15', category: 'Cardio' },
          { id: 15, name: 'High Knees', sets: 3, reps: '30 sec', category: 'Cardio' },
          { id: 16, name: 'Running', sets: 1, reps: '20-30 min', category: 'Cardio' }
        ]
      });
    }
  };

  // Load demo data as fallback
  const loadDemoData = () => {
    setWorkoutPlans([
      {
        id: 1,
        clientId: 1,
        clientName: 'สมชาย ใจดี',
        planName: 'แผนลดน้ำหนัก - สัปดาห์ที่ 1',
        goal: 'ลดน้ำหนัก',
        duration: '4 สัปดาห์',
        status: 'active',
        createdDate: '2024-01-15',
        exercises: [
          {
            id: 1,
            name: 'Push-ups',
            category: 'Upper Body',
            sets: 3,
            reps: '10-15',
            rest: '60 วินาที',
            instructions: 'ลงให้อกแตะพื้น แล้วดันขึ้นให้แขนตรง'
          },
          {
            id: 2,
            name: 'Squats',
            category: 'Lower Body',
            sets: 3,
            reps: '15-20',
            rest: '90 วินาที',
            instructions: 'นั่งลงให้เหมือนนั่งเก้าอี้ แล้วลุกขึ้น'
          },
          {
            id: 3,
            name: 'Plank',
            category: 'Core',
            sets: 3,
            reps: '30-60 วินาที',
            rest: '60 วินาที',
            instructions: 'ค้ำด้วยข้อศอกและปลายเท้า เก็บท้อง'
          }
        ]
      }
    ]);
  };

  // Create new workout plan
  const handleCreatePlan = async (planData) => {
    try {
      setSaving(true);
      setError(null);

      const response = await apiCall('/workout-plans', {
        method: 'POST',
        body: JSON.stringify(planData)
      });

      const newPlan = {
        ...response.data,
        exercises: []
      };

      setWorkoutPlans(prev => [...prev, newPlan]);
      setShowCreateModal(false);
      
      // Show success message
      alert('สร้างแผนการเทรนสำเร็จ!');
    } catch (err) {
      console.error('Error creating workout plan:', err);
      setError(err.message);
      alert('เกิดข้อผิดพลาดในการสร้างแผนการเทรน');
    } finally {
      setSaving(false);
    }
  };

  // Update workout plan
  const updateWorkoutPlan = async (planId, updateData) => {
    try {
      setSaving(true);
      setError(null);

      const response = await apiCall(`/workout-plans/${planId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      setWorkoutPlans(prev => prev.map(plan => 
        plan.id === planId ? { ...plan, ...response.data } : plan
      ));

      alert('อัปเดตแผนการเทรนสำเร็จ!');
    } catch (err) {
      console.error('Error updating workout plan:', err);
      setError(err.message);
      alert('เกิดข้อผิดพลาดในการอัปเดตแผนการเทรน');
    } finally {
      setSaving(false);
    }
  };

  // Delete workout plan
  const deleteWorkoutPlan = async (planId) => {
    if (!confirm('คุณต้องการลบแผนการเทรนนี้หรือไม่?')) return;

    try {
      setSaving(true);
      setError(null);

      await apiCall(`/workout-plans/${planId}`, {
        method: 'DELETE'
      });

      setWorkoutPlans(prev => prev.filter(plan => plan.id !== planId));
      alert('ลบแผนการเทรนสำเร็จ!');
    } catch (err) {
      console.error('Error deleting workout plan:', err);
      setError(err.message);
      alert('เกิดข้อผิดพลาดในการลบแผนการเทรน');
    } finally {
      setSaving(false);
    }
  };

  // Add exercise to plan
  const addExerciseToPlan = async (planId, exercise) => {
    try {
      setSaving(true);
      setError(null);

      const response = await apiCall(`/workout-plans/${planId}/exercises`, {
        method: 'POST',
        body: JSON.stringify(exercise)
      });

      setWorkoutPlans(prev => prev.map(plan => 
        plan.id === planId 
          ? { ...plan, exercises: [...plan.exercises, response.data] }
          : plan
      ));

      alert('เพิ่มท่าออกกำลังกายสำเร็จ!');
    } catch (err) {
      console.error('Error adding exercise to plan:', err);
      setError(err.message);
      alert('เกิดข้อผิดพลาดในการเพิ่มท่าออกกำลังกาย');
    } finally {
      setSaving(false);
    }
  };

  // Remove exercise from plan
  const removeExerciseFromPlan = async (planId, exerciseId) => {
    if (!confirm('คุณต้องการลบท่าออกกำลังกายนี้หรือไม่?')) return;

    try {
      setSaving(true);
      setError(null);

      await apiCall(`/workout-plans/${planId}/exercises/${exerciseId}`, {
        method: 'DELETE'
      });

      setWorkoutPlans(prev => prev.map(plan => 
        plan.id === planId 
          ? { ...plan, exercises: plan.exercises.filter(ex => ex.id !== exerciseId) }
          : plan
      ));

      alert('ลบท่าออกกำลังกายสำเร็จ!');
    } catch (err) {
      console.error('Error removing exercise from plan:', err);
      setError(err.message);
      alert('เกิดข้อผิดพลาดในการลบท่าออกกำลังกาย');
    } finally {
      setSaving(false);
    }
  };

  // Share workout plan
  const shareWorkoutPlan = async (planId) => {
    try {
      const response = await apiCall(`/workout-plans/${planId}/share`, {
        method: 'POST'
      });

      const shareUrl = response.data.shareUrl;
      
      // Copy to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        alert('คัดลอกลิงค์แชร์สำเร็จ!');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('คัดลอกลิงค์แชร์สำเร็จ!');
      }
    } catch (err) {
      console.error('Error sharing workout plan:', err);
      alert('เกิดข้อผิดพลาดในการแชร์แผนการเทรน');
    }
  };

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchWorkoutPlans(),
        fetchExercises()
      ]);
    };

    initializeData();
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { text: 'ใช้งาน', class: 'bg-success' },
      completed: { text: 'เสร็จสิ้น', class: 'bg-primary' },
      paused: { text: 'หยุดชั่วคราว', class: 'bg-warning' },
      draft: { text: 'ร่าง', class: 'bg-secondary' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  // Loading Component
  if (loading || clientsLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error Component
  if (error && workoutPlans.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          เกิดข้อผิดพลาดในการโหลดข้อมูล: {error}
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setError(null);
            fetchWorkoutPlans();
          }}
        >
          <i className="fas fa-refresh me-2"></i>ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="workout-plan-page">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-md-6">
          <h2 className="mb-3" style={{ color: '#232956' }}>แผนการเทรน</h2>
          <p className="text-muted">สร้างและจัดการแผนการออกกำลังกายสำหรับลูกค้า</p>
        </div>
        <div className="col-md-6 text-md-end">
          <button 
            className="btn btn-primary"
            style={{ backgroundColor: '#232956', borderColor: '#232956' }}
            onClick={() => setShowCreateModal(true)}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <i className="fas fa-plus me-2"></i>สร้างแผนใหม่
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* Tabs */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <ul className="nav nav-tabs nav-fill">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'plans' ? 'active' : ''}`}
                onClick={() => setActiveTab('plans')}
                style={{ 
                  color: activeTab === 'plans' ? '#232956' : '#6c757d',
                  borderColor: activeTab === 'plans' ? '#232956' : 'transparent'
                }}
              >
                <i className="fas fa-list me-2"></i>แผนการเทรน
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'exercises' ? 'active' : ''}`}
                onClick={() => setActiveTab('exercises')}
                style={{ 
                  color: activeTab === 'exercises' ? '#232956' : '#6c757d',
                  borderColor: activeTab === 'exercises' ? '#232956' : 'transparent'
                }}
              >
                <i className="fas fa-dumbbell me-2"></i>คลังท่าออกกำลังกาย
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Workout Plans Tab */}
      {activeTab === 'plans' && (
        <div className="row">
          {workoutPlans.length > 0 ? (
            workoutPlans.map((plan) => (
              <div key={plan.id} className="col-lg-6 mb-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1" style={{ color: '#232956' }}>{plan.planName}</h6>
                      <small className="text-muted">{plan.clientName}</small>
                    </div>
                    {getStatusBadge(plan.status)}
                  </div>
                  <div className="card-body">
                    <div className="row mb-3">
                      <div className="col-6">
                        <small className="text-muted">เป้าหมาย</small>
                        <div className="fw-bold">{plan.goal}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">ระยะเวลา</small>
                        <div className="fw-bold">{plan.duration}</div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <small className="text-muted">ท่าออกกำลังกาย ({plan.exercises?.length || 0} ท่า)</small>
                      {plan.exercises && plan.exercises.length > 0 ? (
                        <div className="exercise-list mt-2">
                          {plan.exercises.slice(0, 3).map((exercise, index) => (
                            <div key={index} className="d-flex justify-content-between align-items-center py-1">
                              <span className="small">{exercise.name}</span>
                              <span className="badge bg-light text-dark small">
                                {exercise.sets} x {exercise.reps}
                              </span>
                            </div>
                          ))}
                          {plan.exercises.length > 3 && (
                            <div className="text-muted small">และอีก {plan.exercises.length - 3} ท่า...</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-muted small mt-2">ยังไม่มีท่าออกกำลังกาย</div>
                      )}
                    </div>

                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-outline-primary btn-sm flex-fill"
                        onClick={() => setSelectedPlan(plan)}
                      >
                        <i className="fas fa-eye me-1"></i>ดู
                      </button>
                      <button 
                        className="btn btn-outline-success btn-sm flex-fill"
                        onClick={() => {
                          setSelectedPlan(plan);
                          setShowCreateModal(true);
                        }}
                        disabled={saving}
                      >
                        <i className="fas fa-edit me-1"></i>แก้ไข
                      </button>
                      <button 
                        className="btn btn-outline-info btn-sm flex-fill"
                        onClick={() => shareWorkoutPlan(plan.id)}
                        disabled={saving}
                      >
                        <i className="fas fa-share me-1"></i>แชร์
                      </button>
                    </div>
                  </div>
                  <div className="card-footer bg-light border-0 d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      สร้างเมื่อ: {new Date(plan.createdDate).toLocaleDateString('th-TH')}
                    </small>
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => deleteWorkoutPlan(plan.id)}
                      disabled={saving}
                      title="ลบแผน"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12">
              <div className="text-center py-5">
                <i className="fas fa-clipboard-list fa-4x text-muted mb-3"></i>
                <h5 className="text-muted">ยังไม่มีแผนการเทรน</h5>
                <p className="text-muted">สร้างแผนการเทรนแรกของคุณ</p>
                <button 
                  className="btn btn-primary"
                  style={{ backgroundColor: '#232956', borderColor: '#232956' }}
                  onClick={() => setShowCreateModal(true)}
                  disabled={saving}
                >
                  สร้างแผนใหม่
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Exercise Library Tab */}
      {activeTab === 'exercises' && (
        <div className="row">
          {exerciseCategories.map((category, index) => (
            <div key={index} className="col-lg-6 mb-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0">
                  <div className="d-flex align-items-center">
                    <div 
                      className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        backgroundColor: category.color + '20',
                        color: category.color
                      }}
                    >
                      <i className={category.icon}></i>
                    </div>
                    <h6 className="mb-0" style={{ color: '#232956' }}>{category.name}</h6>
                  </div>
                </div>
                <div className="card-body">
                  {exercises[category.name] && exercises[category.name].length > 0 ? (
                    <div className="exercise-list">
                      {exercises[category.name].map((exercise, exerciseIndex) => (
                        <div key={exerciseIndex} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <div>
                            <div className="fw-bold small">{exercise.name}</div>
                            <small className="text-muted">{exercise.sets} เซ็ต x {exercise.reps}</small>
                          </div>
                          <div className="dropdown">
                            <button 
                              className="btn btn-outline-primary btn-sm dropdown-toggle"
                              type="button"
                              data-bs-toggle="dropdown"
                              title="เพิ่มลงในแผน"
                              disabled={saving}
                            >
                              <i className="fas fa-plus"></i>
                            </button>
                            <ul className="dropdown-menu">
                              {workoutPlans.filter(plan => plan.status === 'active').map(plan => (
                                <li key={plan.id}>
                                  <button 
                                    className="dropdown-item"
                                    onClick={() => addExerciseToPlan(plan.id, {
                                      exerciseId: exercise.id,
                                      name: exercise.name,
                                      category: exercise.category,
                                      sets: exercise.sets,
                                      reps: exercise.reps,
                                      rest: '60 วินาที',
                                      instructions: ''
                                    })}
                                  >
                                    {plan.planName}
                                  </button>
                                </li>
                              ))}
                              {workoutPlans.filter(plan => plan.status === 'active').length === 0 && (
                                <li>
                                  <span className="dropdown-item-text text-muted">
                                    ไม่มีแผนการเทรนที่ใช้งานอยู่
                                  </span>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted small">กำลังอัพเดต...</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Plan Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedPlan ? 'แก้ไขแผนการเทรน' : 'สร้างแผนการเทรนใหม่'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedPlan(null);
                  }}
                ></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const client = clients.find(c => c.id === parseInt(formData.get('clientId')));
                const planData = {
                  clientId: parseInt(formData.get('clientId')),
                  clientName: client?.name,
                  planName: formData.get('planName'),
                  goal: formData.get('goal'),
                  duration: formData.get('duration'),
                  description: formData.get('description')
                };

                if (selectedPlan) {
                  updateWorkoutPlan(selectedPlan.id, planData);
                } else {
                  handleCreatePlan(planData);
                }
              }}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">ลูกค้า *</label>
                      <select 
                        className="form-select" 
                        name="clientId" 
                        required
                        defaultValue={selectedPlan?.clientId || ''}
                      >
                        <option value="">เลือกลูกค้า</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">ชื่อแผน *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="planName" 
                        placeholder="เช่น แผนลดน้ำหนัก - สัปดาห์ที่ 1"
                        defaultValue={selectedPlan?.planName || ''}
                        required 
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">เป้าหมาย *</label>
                      <select 
                        className="form-select" 
                        name="goal" 
                        required
                        defaultValue={selectedPlan?.goal || ''}
                      >
                        <option value="">เลือกเป้าหมาย</option>
                        <option value="ลดน้ำหนัก">ลดน้ำหนัก</option>
                        <option value="เพิ่มน้ำหนัก">เพิ่มน้ำหนัก</option>
                        <option value="เพิ่มกล้ามเนื้อ">เพิ่มกล้ามเนื้อ</option>
                        <option value="เพิ่มความแข็งแรง">เพิ่มความแข็งแรง</option>
                        <option value="เพิ่มความอดทน">เพิ่มความอดทน</option>
                        <option value="ปรับสัดส่วน">ปรับสัดส่วน</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">ระยะเวลา *</label>
                      <select 
                        className="form-select" 
                        name="duration" 
                        required
                        defaultValue={selectedPlan?.duration || ''}
                      >
                        <option value="">เลือกระยะเวลา</option>
                        <option value="1 สัปดาห์">1 สัปดาห์</option>
                        <option value="2 สัปดาห์">2 สัปดาห์</option>
                        <option value="4 สัปดาห์">4 สัปดาห์</option>
                        <option value="8 สัปดาห์">8 สัปดาห์</option>
                        <option value="12 สัปดาห์">12 สัปดาห์</option>
                      </select>
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">รายละเอียด</label>
                      <textarea 
                        className="form-control" 
                        name="description" 
                        rows="3"
                        placeholder="อธิบายรายละเอียดของแผนการเทรน..."
                        defaultValue={selectedPlan?.description || ''}
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      setSelectedPlan(null);
                    }}
                    disabled={saving}
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ backgroundColor: '#232956', borderColor: '#232956' }}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        กำลังบันทึก...
                      </>
                    ) : (
                      selectedPlan ? 'อัปเดตแผน' : 'สร้างแผน'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {showCreateModal && (
        <div className="modal-backdrop fade show"></div>
      )}
    </div>
  );
};

export default WorkoutPlanPage;