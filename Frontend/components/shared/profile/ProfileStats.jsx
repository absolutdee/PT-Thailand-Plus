
// Frontend/components/shared/profile/ProfileStats.jsx
import React from 'react';
import './ProfileStats.scss';

const ProfileStats = ({
  stats,
  type = 'trainer' // 'trainer' | 'customer'
}) => {
  const renderTrainerStats = () => (
    <>
      <div className="profile-stats__item">
        <div className="profile-stats__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
        </div>
        <div className="profile-stats__content">
          <span className="profile-stats__value">{stats.totalClients || 0}</span>
          <span className="profile-stats__label">ลูกค้าทั้งหมด</span>
        </div>
      </div>

      <div className="profile-stats__item">
        <div className="profile-stats__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div className="profile-stats__content">
          <span className="profile-stats__value">{stats.completedSessions || 0}</span>
          <span className="profile-stats__label">เซสชันสำเร็จ</span>
        </div>
      </div>

      <div className="profile-stats__item">
        <div className="profile-stats__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
          </svg>
        </div>
        <div className="profile-stats__content">
          <span className="profile-stats__value">{stats.satisfactionRate || 0}%</span>
          <span className="profile-stats__label">ความพึงพอใจ</span>
        </div>
      </div>

      <div className="profile-stats__item">
        <div className="profile-stats__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
          </svg>
        </div>
        <div className="profile-stats__content">
          <span className="profile-stats__value">{stats.experienceYears || 0}</span>
          <span className="profile-stats__label">ปีประสบการณ์</span>
        </div>
      </div>
    </>
  );

  const renderCustomerStats = () => (
    <>
      <div className="profile-stats__item">
        <div className="profile-stats__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
          </svg>
        </div>
        <div className="profile-stats__content">
          <span className="profile-stats__value">{stats.totalWorkouts || 0}</span>
          <span className="profile-stats__label">การออกกำลังกาย</span>
        </div>
      </div>

      <div className="profile-stats__item">
        <div className="profile-stats__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
          </svg>
        </div>
        <div className="profile-stats__content">
          <span className="profile-stats__value">{stats.caloriesBurned || 0}</span>
          <span className="profile-stats__label">แคลอรี่ที่เผาผลาญ</span>
        </div>
      </div>

      <div className="profile-stats__item">
        <div className="profile-stats__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div className="profile-stats__content">
          <span className="profile-stats__value">{stats.goalsAchieved || 0}</span>
          <span className="profile-stats__label">เป้าหมายสำเร็จ</span>
        </div>
      </div>

      <div className="profile-stats__item">
        <div className="profile-stats__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
          </svg>
        </div>
        <div className="profile-stats__content">
          <span className="profile-stats__value">{stats.trainingDays || 0}</span>
          <span className="profile-stats__label">วันที่เทรน</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="profile-stats">
      <h3 className="profile-stats__title">สถิติ</h3>
      <div className="profile-stats__grid">
        {type === 'trainer' ? renderTrainerStats() : renderCustomerStats()}
      </div>
    </div>
  );
};

export default ProfileStats;
