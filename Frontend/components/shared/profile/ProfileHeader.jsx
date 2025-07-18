// Frontend/components/shared/profile/ProfileHeader.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../StarRating';
import { formatDate } from '../../../utils/helpers';
import './ProfileHeader.scss';

const ProfileHeader = ({
  user,
  isOwn = false,
  onEditProfile,
  onFollow,
  onMessage,
  onBook,
  showActions = true,
  type = 'trainer' // 'trainer' | 'customer'
}) => {
  const [isFollowing, setIsFollowing] = useState(user?.isFollowing || false);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    onFollow?.(!isFollowing);
  };

  const getSocialIcon = (platform) => {
    const icons = {
      facebook: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"/>
        </svg>
      ),
      instagram: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 1.802c2.67 0 2.987.01 4.042.059 2.71.123 3.975 1.409 4.099 4.099.048 1.054.057 1.37.057 4.04 0 2.672-.01 2.988-.057 4.042-.124 2.687-1.387 3.975-4.1 4.099-1.054.048-1.37.058-4.041.058-2.67 0-2.987-.01-4.04-.058-2.718-.124-3.977-1.416-4.1-4.1-.048-1.054-.058-1.37-.058-4.041 0-2.67.01-2.986.058-4.04.124-2.69 1.387-3.977 4.1-4.1 1.054-.048 1.37-.058 4.04-.058zM10 0C7.284 0 6.944.012 5.877.06 2.246.227.227 2.242.061 5.877.01 6.944 0 7.284 0 10s.012 3.057.06 4.123c.167 3.632 2.182 5.65 5.817 5.817 1.067.048 1.407.06 4.123.06s3.057-.012 4.123-.06c3.629-.167 5.652-2.182 5.816-5.817.05-1.066.061-1.407.061-4.123s-.012-3.056-.06-4.122C19.777 2.249 17.76.228 14.124.06 13.057.01 12.716 0 10 0zm0 4.865a5.135 5.135 0 100 10.27 5.135 5.135 0 000-10.27zm0 8.468a3.333 3.333 0 110-6.666 3.333 3.333 0 010 6.666zm5.338-9.87a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z"/>
        </svg>
      ),
      line: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 0C4.477 0 0 3.582 0 8c0 3.535 2.862 6.533 6.838 7.565.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 3.868c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.7 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.481C17.14 14.53 20 11.534 20 8c0-4.418-4.477-8-10-8z"/>
        </svg>
      ),
      youtube: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M19.543 5.748c-.228-.866-.899-1.548-1.752-1.78C16.244 3.5 10 3.5 10 3.5s-6.244 0-7.791.418c-.853.232-1.524.914-1.752 1.78C0 7.263 0 10.5 0 10.5s0 3.237.457 4.802c.228.866.899 1.548 1.752 1.78C3.756 17.5 10 17.5 10 17.5s6.244 0 7.791-.418c.853-.232 1.524-.914 1.752-1.78C20 13.737 20 10.5 20 10.5s0-3.237-.457-4.752zM8 13.5v-6l5.2 3-5.2 3z"/>
        </svg>
      )
    };
    return icons[platform] || null;
  };

  return (
    <div className="profile-header">
      <div className="profile-header__banner">
        {user?.bannerImage && (
          <img src={user.bannerImage} alt="Profile banner" />
        )}
      </div>

      <div className="profile-header__content">
        <div className="profile-header__main">
          <div className="profile-header__avatar">
            <img 
              src={user?.profileImage || '/images/default-avatar.jpg'} 
              alt={user?.name}
            />
            {user?.verified && (
              <span className="profile-header__verified" title="ยืนยันแล้ว">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </span>
            )}
          </div>

          <div className="profile-header__info">
            <h1 className="profile-header__name">{user?.name}</h1>
            <p className="profile-header__title">{user?.title || (type === 'trainer' ? 'เทรนเนอร์' : 'สมาชิก')}</p>
            
            {type === 'trainer' && user?.rating && (
              <div className="profile-header__rating">
                <StarRating value={user.rating} readOnly size="small" />
                <span className="profile-header__rating-text">
                  {user.rating} ({user.reviewCount} รีวิว)
                </span>
              </div>
            )}

            <div className="profile-header__meta">
              {user?.location && (
                <div className="profile-header__meta-item">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C5.814 0 4 1.814 4 4c0 2.416 3.316 7.084 3.47 7.283a.748.748 0 001.06 0C8.684 11.084 12 6.416 12 4c0-2.186-1.814-4-4-4zm0 6a2 2 0 110-4 2 2 0 010 4z"/>
                  </svg>
                  <span>{user.location}</span>
                </div>
              )}
              
              <div className="profile-header__meta-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3.5 0a.5.5 0 01.5.5V1h8V.5a.5.5 0 011 0V1h1a2 2 0 012 2v11a2 2 0 01-2 2H2a2 2 0 01-2-2V3a2 2 0 012-2h1V.5a.5.5 0 01.5-.5zM1 4v10a1 1 0 001 1h12a1 1 0 001-1V4H1z"/>
                </svg>
                <span>เข้าร่วมเมื่อ {formatDate(user?.joinedDate, 'MMM YYYY')}</span>
              </div>
            </div>
          </div>

          {showActions && (
            <div className="profile-header__actions">
              {isOwn ? (
                <button 
                  className="btn btn-outline-primary"
                  onClick={onEditProfile}
                >
                  แก้ไขโปรไฟล์
                </button>
              ) : (
                <>
                  {type === 'trainer' && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => onBook?.(user)}
                    >
                      จองเซสชัน
                    </button>
                  )}
                  
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => onMessage?.(user)}
                  >
                    ส่งข้อความ
                  </button>
                  
                  <button 
                    className={`btn ${isFollowing ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={handleFollow}
                  >
                    {isFollowing ? 'กำลังติดตาม' : 'ติดตาม'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {user?.bio && (
          <div className="profile-header__bio">
            <p>{user.bio}</p>
          </div>
        )}

        {type === 'trainer' && user?.specialties && (
          <div className="profile-header__specialties">
            <h3 className="profile-header__section-title">ความเชี่ยวชาญ</h3>
            <div className="profile-header__tags">
              {user.specialties.map((specialty, index) => (
                <span key={index} className="profile-header__tag">
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}

        {user?.socialMedia && Object.keys(user.socialMedia).length > 0 && (
          <div className="profile-header__social">
            {Object.entries(user.socialMedia).map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="profile-header__social-link"
                title={platform}
              >
                {getSocialIcon(platform)}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
