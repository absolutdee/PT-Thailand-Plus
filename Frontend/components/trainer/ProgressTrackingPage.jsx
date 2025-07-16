// src/components/trainer/ProgressTrackingPage.jsx
import React, { useState, useEffect } from 'react';
import { useTrainer } from '../../contexts/TrainerContext';

const ProgressTrackingPage = () => {
  const { clients, loading } = useTrainer();
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [progressData, setProgressData] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [error, setError] = useState(null);

  // Fetch progress data when client is selected
  useEffect(() => {
    if (selectedClient) {
      fetchClientProgress(selectedClient.id);
    }
  }, [selectedClient]);

  const fetchClientProgress = async (clientId) => {
    setLoadingProgress(true);
    setError(null);
    try {
      const response = await fetch(`/api/trainer/clients/${clientId}/progress`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch progress data');
      }

      const data = await response.json();
      setProgressData(prev => ({
        ...prev,
        [clientId]: data
      }));
    } catch (error) {
      console.error('Error fetching progress:', error);
      setError('ไม่สามารถโหลดข้อมูลความก้าวหน้าได้');
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleRecordProgress = async (data) => {
    if (!selectedClient) return;

    try {
      const response = await fetch(`/api/trainer/clients/${selectedClient.id}/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: data.date,
          weight: parseFloat(data.weight),
          bodyFat: data.bodyFat ? parseFloat(data.bodyFat) : null,
          muscle: data.muscle ? parseFloat(data.muscle) : null,
          height: data.height ? parseFloat(data.height) : null,
          notes: data.notes || null,
          type: 'health_measurement'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to record progress');
      }

      const newRecord = await response.json();
      
      // Update local state
      setProgressData(prev => ({
        ...prev,
        [selectedClient.id]: {
          ...prev[selectedClient.id],
          healthData: [
            ...(prev[selectedClient.id]?.healthData || []), 
            newRecord
          ]
        }
      }));

      setShowRecordModal(false);
      
      // Show success message
      alert('บันทึกข้อมูลเรียบร้อยแล้ว');
      
    } catch (error) {
      console.error('Error recording progress:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const recordWorkoutProgress = async (workoutData) => {
    if (!selectedClient) return;

    try {
      const response = await fetch(`/api/trainer/clients/${selectedClient.id}/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...workoutData,
          type: 'workout_progress'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to record workout progress');
      }

      const newRecord = await response.json();
      
      // Update local state
      setProgressData(prev => ({
        ...prev,
        [selectedClient.id]: {
          ...prev[selectedClient.id],
          workoutProgress: [
            ...(prev[selectedClient.id]?.workoutProgress || []), 
            newRecord
          ]
        }
      }));
      
    } catch (error) {
      console.error('Error recording workout progress:', error);
    }
  };

  const addAchievement = async (achievementData) => {
    if (!selectedClient) return;

    try {
      const response = await fetch(`/api/trainer/clients/${selectedClient.id}/achievements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(achievementData)
      });

      if (!response.ok) {
        throw new Error('Failed to add achievement');
      }

      const newAchievement = await response.json();
      
      // Update local state
      setProgressData(prev => ({
        ...prev,
        [selectedClient.id]: {
          ...prev[selectedClient.id],
          achievements: [
            ...(prev[selectedClient.id]?.achievements || []), 
            newAchievement
          ]
        }
      }));
      
    } catch (error) {
      console.error('Error adding achievement:', error);
    }
  };

  const healthMetrics = [
    { key: 'weight', label: 'น้ำหนัก', unit: 'kg', color: '#232956', icon: 'fas fa-weight' },
    { key: 'bodyFat', label: 'ไขมัน', unit: '%', color: '#df2528', icon: 'fas fa-fire' },
    { key: 'muscle', label: 'กล้ามเนื้อ', unit: '%', color: '#28a745', icon: 'fas fa-dumbbell' }
  ];

  const getClientProgress = (clientId) => {
    return progressData[clientId] || { healthData: [], workoutProgress: [], achievements: [] };
  };

  const getLatestMetric = (clientId, metric) => {
    const data = getClientProgress(clientId).healthData;
    if (data.length === 0) return 0;
    return data[data.length - 1][metric] || 0;
  };

  const getMetricChange = (clientId, metric) => {
    const data = getClientProgress(clientId).healthData;
    if (data.length < 2) return 0;
    const latest = data[data.length - 1][metric] || 0;
    const previous = data[data.length - 2][metric] || 0;
    return latest - previous;
  };

  const renderMetricChart = (clientId, metric) => {
    const data = getClientProgress(clientId).healthData;
    if (data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d[metric] || 0));
    const minValue = Math.min(...data.map(d => d[metric] || 0));
    const range = maxValue - minValue || 1;

    return (
      <div className="chart-container" style={{ height: '100px' }}>
        <div className="d-flex align-items-end justify-content-between h-100">
          {data.slice(-8).map((point, index) => {
            const value = point[metric] || 0;
            const height = ((value - minValue) / range) * 80 + 10;
            return (
              <div key={index} className="text-center" style={{ flex: 1 }}>
                <div 
                  className="bg-primary rounded-top mx-1"
                  style={{ 
                    height: `${height}px`,
                    backgroundColor: healthMetrics.find(m => m.key === metric)?.color,
                    minHeight: '10px'
                  }}
                  title={`${value} ${healthMetrics.find(m => m.key === metric)?.unit}`}
                ></div>
                <small className="text-muted">
                  {new Date(point.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                </small>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-tracking-page">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-md-6">
          <h2 className="mb-3" style={{ color: '#232956' }}>ติดตามผลและรายงาน</h2>
          <p className="text-muted">ติดตามความก้าวหน้าของลูกค้าและบันทึกข้อมูลสุขภาพ</p>
        </div>
        <div className="col-md-6 text-md-end">
          <button 
            className="btn btn-primary"
            style={{ backgroundColor: '#232956', borderColor: '#232956' }}
            onClick={() => setShowRecordModal(true)}
            disabled={!selectedClient}
          >
            <i className="fas fa-plus me-2"></i>บันทึกข้อมูล
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      <div className="row">
        {/* Client Selection */}
        <div className="col-lg-3 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h6 className="mb-0" style={{ color: '#232956' }}>เลือกลูกค้า</h6>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    className={`list-group-item list-group-item-action border-0 d-flex align-items-center ${
                      selectedClient?.id === client.id ? 'active' : ''
                    }`}
                    style={{
                      backgroundColor: selectedClient?.id === client.id ? '#232956' : 'transparent',
                      color: selectedClient?.id === client.id ? 'white' : '#6c757d'
                    }}
                    onClick={() => setSelectedClient(client)}
                  >
                    <div 
                      className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        backgroundColor: selectedClient?.id === client.id ? 'white' : '#232956',
                        color: selectedClient?.id === client.id ? '#232956' : 'white',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <div className="fw-bold">{client.name}</div>
                      <small className={selectedClient?.id === client.id ? 'text-white-50' : 'text-muted'}>
                        {client.package}
                      </small>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Content */}
        <div className="col-lg-9">
          {selectedClient ? (
            <>
              {/* Loading Progress */}
              {loadingProgress && (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">กำลังโหลดข้อมูล...</span>
                  </div>
                </div>
              )}

              {!loadingProgress && (
                <>
                  {/* Tabs */}
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body">
                      <ul className="nav nav-tabs nav-fill">
                        <li className="nav-item">
                          <button 
                            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                            style={{ 
                              color: activeTab === 'overview' ? '#232956' : '#6c757d',
                              borderColor: activeTab === 'overview' ? '#232956' : 'transparent'
                            }}
                          >
                            <i className="fas fa-chart-line me-2"></i>ภาพรวม
                          </button>
                        </li>
                        <li className="nav-item">
                          <button 
                            className={`nav-link ${activeTab === 'health' ? 'active' : ''}`}
                            onClick={() => setActiveTab('health')}
                            style={{ 
                              color: activeTab === 'health' ? '#232956' : '#6c757d',
                              borderColor: activeTab === 'health' ? '#232956' : 'transparent'
                            }}
                          >
                            <i className="fas fa-heartbeat me-2"></i>สุขภาพ
                          </button>
                        </li>
                        <li className="nav-item">
                          <button 
                            className={`nav-link ${activeTab === 'workout' ? 'active' : ''}`}
                            onClick={() => setActiveTab('workout')}
                            style={{ 
                              color: activeTab === 'workout' ? '#232956' : '#6c757d',
                              borderColor: activeTab === 'workout' ? '#232956' : 'transparent'
                            }}
                          >
                            <i className="fas fa-dumbbell me-2"></i>การออกกำลังกาย
                          </button>
                        </li>
                        <li className="nav-item">
                          <button 
                            className={`nav-link ${activeTab === 'achievements' ? 'active' : ''}`}
                            onClick={() => setActiveTab('achievements')}
                            style={{ 
                              color: activeTab === 'achievements' ? '#232956' : '#6c757d',
                              borderColor: activeTab === 'achievements' ? '#232956' : 'transparent'
                            }}
                          >
                            <i className="fas fa-trophy me-2"></i>ความสำเร็จ
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="row">
                      {healthMetrics.map((metric) => {
                        const current = getLatestMetric(selectedClient.id, metric.key);
                        const change = getMetricChange(selectedClient.id, metric.key);
                        return (
                          <div key={metric.key} className="col-md-4 mb-4">
                            <div className="card border-0 shadow-sm">
                              <div className="card-body">
                                <div className="d-flex align-items-center mb-3">
                                  <div 
                                    className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                                    style={{ 
                                      width: '40px', 
                                      height: '40px', 
                                      backgroundColor: metric.color + '20',
                                      color: metric.color
                                    }}
                                  >
                                    <i className={metric.icon}></i>
                                  </div>
                                  <div>
                                    <h6 className="mb-0">{metric.label}</h6>
                                    <div className="d-flex align-items-center">
                                      <span className="h4 mb-0 me-2">{current}</span>
                                      <small className="text-muted">{metric.unit}</small>
                                    </div>
                                    {change !== 0 && (
                                      <small className={`${change > 0 ? 'text-success' : 'text-danger'}`}>
                                        {change > 0 ? '+' : ''}{change.toFixed(1)} {metric.unit}
                                      </small>
                                    )}
                                  </div>
                                </div>
                                {renderMetricChart(selectedClient.id, metric.key)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Health Tab */}
                  {activeTab === 'health' && (
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-white border-0">
                        <h6 className="mb-0" style={{ color: '#232956' }}>ประวัติข้อมูลสุขภาพ</h6>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>วันที่</th>
                                <th>น้ำหนัก (kg)</th>
                                <th>ไขมัน (%)</th>
                                <th>กล้ามเนื้อ (%)</th>
                                <th>BMI</th>
                                <th>หมายเหตุ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getClientProgress(selectedClient.id).healthData
                                .slice()
                                .reverse()
                                .map((record, index) => {
                                  const bmi = record.height ? (record.weight / Math.pow(record.height / 100, 2)).toFixed(1) : '-';
                                  return (
                                    <tr key={index}>
                                      <td>{new Date(record.date).toLocaleDateString('th-TH')}</td>
                                      <td>{record.weight || '-'}</td>
                                      <td>{record.bodyFat || '-'}</td>
                                      <td>{record.muscle || '-'}</td>
                                      <td>
                                        {bmi !== '-' && (
                                          <span className={`badge ${
                                            bmi < 18.5 ? 'bg-info' :
                                            bmi < 25 ? 'bg-success' :
                                            bmi < 30 ? 'bg-warning' : 'bg-danger'
                                          }`}>
                                            {bmi}
                                          </span>
                                        )}
                                        {bmi === '-' && '-'}
                                      </td>
                                      <td>{record.notes || '-'}</td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Workout Tab */}
                  {activeTab === 'workout' && (
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-white border-0">
                        <h6 className="mb-0" style={{ color: '#232956' }}>ความก้าวหน้าในการออกกำลังกาย</h6>
                      </div>
                      <div className="card-body">
                        {getClientProgress(selectedClient.id).workoutProgress.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table table-hover">
                              <thead>
                                <tr>
                                  <th>ท่าออกกำลังกาย</th>
                                  <th>วันที่</th>
                                  <th>เซ็ต</th>
                                  <th>ครั้ง</th>
                                  <th>น้ำหนัก (kg)</th>
                                  <th>ระยะเวลา (นาที)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {getClientProgress(selectedClient.id).workoutProgress
                                  .slice()
                                  .reverse()
                                  .map((record, index) => (
                                    <tr key={index}>
                                      <td className="fw-bold">{record.exercise || record.name}</td>
                                      <td>{new Date(record.date).toLocaleDateString('th-TH')}</td>
                                      <td>{record.sets || '-'}</td>
                                      <td>{record.reps || '-'}</td>
                                      <td>{record.weight || '-'}</td>
                                      <td>{record.duration || '-'}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <i className="fas fa-dumbbell fa-3x text-muted mb-3"></i>
                            <p className="text-muted">ยังไม่มีข้อมูลการออกกำลังกาย</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Achievements Tab */}
                  {activeTab === 'achievements' && (
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-white border-0">
                        <h6 className="mb-0" style={{ color: '#232956' }}>ความสำเร็จ</h6>
                      </div>
                      <div className="card-body">
                        {getClientProgress(selectedClient.id).achievements.length > 0 ? (
                          <div className="achievement-list">
                            {getClientProgress(selectedClient.id).achievements.map((achievement, index) => (
                              <div key={index} className="d-flex align-items-center mb-3 p-3 bg-light rounded">
                                <div 
                                  className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                                  style={{ 
                                    width: '50px', 
                                    height: '50px', 
                                    backgroundColor: '#ffc107',
                                    color: 'white'
                                  }}
                                >
                                  <i className="fas fa-trophy"></i>
                                </div>
                                <div className="flex-grow-1">
                                  <h6 className="mb-1">{achievement.title}</h6>
                                  <p className="mb-1 text-muted">{achievement.description}</p>
                                  <small className="text-muted">
                                    {new Date(achievement.date || achievement.completedDate).toLocaleDateString('th-TH')}
                                  </small>
                                </div>
                                <span className={`badge ${
                                  achievement.type === 'weight' || achievement.category === 'weight' ? 'bg-primary' :
                                  achievement.type === 'exercise' || achievement.category === 'workouts' ? 'bg-success' : 'bg-info'
                                }`}>
                                  {achievement.type === 'weight' || achievement.category === 'weight' ? 'น้ำหนัก' :
                                   achievement.type === 'exercise' || achievement.category === 'workouts' ? 'ออกกำลังกาย' : 'ความสม่ำเสมอ'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <i className="fas fa-trophy fa-3x text-muted mb-3"></i>
                            <p className="text-muted">ยังไม่มีความสำเร็จ</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <i className="fas fa-chart-line fa-4x text-muted mb-3"></i>
                <h5 className="text-muted">เลือกลูกค้าเพื่อดูความก้าวหน้า</h5>
                <p className="text-muted">คลิกที่รายชื่อลูกค้าด้านซ้ายเพื่อดูข้อมูลความก้าวหน้า</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Record Progress Modal */}
      {showRecordModal && selectedClient && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">บันทึกข้อมูลสุขภาพ - {selectedClient.name}</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowRecordModal(false)}
                ></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleRecordProgress({
                  date: formData.get('date'),
                  weight: formData.get('weight'),
                  bodyFat: formData.get('bodyFat'),
                  muscle: formData.get('muscle'),
                  height: formData.get('height'),
                  notes: formData.get('notes')
                });
              }}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">วันที่ *</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        name="date" 
                        defaultValue={new Date().toISOString().split('T')[0]}
                        required 
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">น้ำหนัก (kg) *</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        name="weight" 
                        step="0.1"
                        min="30"
                        max="200"
                        required 
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">เปอร์เซ็นต์ไขมัน (%)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        name="bodyFat" 
                        step="0.1"
                        min="5"
                        max="50"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">เปอร์เซ็นต์กล้ามเนื้อ (%)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        name="muscle" 
                        step="0.1"
                        min="20"
                        max="60"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">ส่วนสูง (cm)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        name="height" 
                        min="140"
                        max="220"
                        defaultValue="175"
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">หมายเหตุ</label>
                      <textarea 
                        className="form-control" 
                        name="notes" 
                        rows="3"
                        placeholder="บันทึกเพิ่มเติม..."
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowRecordModal(false)}
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ backgroundColor: '#232956', borderColor: '#232956' }}
                  >
                    บันทึกข้อมูล
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {showRecordModal && (
        <div className="modal-backdrop fade show"></div>
      )}
    </div>
  );
};

export default ProgressTrackingPage;