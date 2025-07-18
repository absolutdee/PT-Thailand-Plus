// Frontend/components/shared/TrainerCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import { formatCurrency } from '../../utils/helpers';
import './TrainerCard.scss';

const TrainerCard = ({ 
  trainer,
  viewType = 'grid', // grid | list
  showActions = false,
  onFavorite,
  onMessage,
  onBook
}) => {
  const specialties = trainer.specialties || [];
  const displaySpecialties = specialties.slice(0, 3);
  const moreCount = specialties.length - displaySpecialties.length;

  if (viewType === 'list') {
    return (
      <div className="trainer-card trainer-card--list">
        <Link to={`/trainers/${trainer.id}`} className="trainer-card__image-wrapper">
          <img 
            src={trainer.profileImage || '/images/default-trainer.jpg'} 
            alt={trainer.name}
            className="trainer-card__image"
          />
          {trainer.verified && (
            <span className="trainer-card__verified" title="เทรนเนอร์ที่ผ่านการยืนยัน">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </span>
          )}
        </Link>

        <div className="trainer-card__content">
          <div className="trainer-card__header">
            <Link to={`/trainers/${trainer.id}`} className="trainer-card__name">
              {trainer.name}
            </Link>
            <p className="trainer-card__title">{trainer.title}</p>
          </div>

          <div className="trainer-card__details">
            <p className="trainer-card__bio">{trainer.bio}</p>
            
            <div className="trainer-card__specialties">
              {displaySpecialties.map((specialty, index) => (
                <span key={index} className="trainer-card__specialty">
                  {specialty}
                </span>
              ))}
              {moreCount > 0 && (
                <span className="trainer-card__specialty trainer-card__specialty--more">
                  +{moreCount} อื่นๆ
                </span>
              )}
            </div>

            <div className="trainer-card__info">
              <div className="trainer-card__info-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#666">
                  <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM3.5 8A4.5 4.5 0 118 12.5V8h4.5z"/>
                </svg>
                <span>{trainer.experience} ปีประสบการณ์</span>
              </div>
              
              <div className="trainer-card__info-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#666">
                  <path d="M8 0C5.814 0 4 1.814 4 4c0 2.416 3.316 7.084 3.47 7.283a.748.748 0 001.06 0C8.684 11.084 12 6.416 12 4c0-2.186-1.814-4-4-4zm0 6a2 2 0 110-4 2 2 0 010 4z"/>
                </svg>
                <span>{trainer.location}</span>
              </div>
              
              <div className="trainer-card__info-item">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#666">
                  <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 100-6 3 3 0 000 6z"/>
                </svg>
                <span>{trainer.totalClients} ลูกค้า</span>
              </div>
            </div>
          </div>

          <div className="trainer-card__footer">
            <div className="trainer-card__rating">
              <StarRating value={trainer.rating} readOnly size="small" />
              <span className="trainer-card__rating-text">
                {trainer.rating} ({trainer.reviewCount})
              </span>
            </div>

            <div className="trainer-card__price">
              <span className="trainer-card__price-label">เริ่มต้น</span>
              <span className="trainer-card__price-amount">
                {formatCurrency(trainer.priceRange.min)}/ชม.
              </span>
            </div>

            {showActions && (
              <div className="trainer-card__actions">
                <button
                  className="trainer-card__action trainer-card__action--favorite"
                  onClick={() => onFavorite?.(trainer.id)}
                  title="บันทึกเทรนเนอร์"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill={trainer.isFavorited ? '#df2528' : 'none'} stroke={trainer.isFavorited ? '#df2528' : 'currentColor'}>
                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
                  </svg>
                </button>
                
                <button
                  className="trainer-card__action"
                  onClick={() => onMessage?.(trainer.id)}
                  title="ส่งข้อความ"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                </button>
                
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onBook?.(trainer.id)}
                >
                  จองเลย
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="trainer-card">
      <Link to={`/trainers/${trainer.id}`} className="trainer-card__image-wrapper">
        <img 
          src={trainer.profileImage || '/images/default-trainer.jpg'} 
          alt={trainer.name}
          className="trainer-card__image"
        />
        {trainer.verified && (
          <span className="trainer-card__verified" title="เทรนเนอร์ที่ผ่านการยืนยัน">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </span>
        )}
        {showActions && (
          <button
            className="trainer-card__favorite"
            onClick={(e) => {
              e.preventDefault();
              onFavorite?.(trainer.id);
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={trainer.isFavorited ? '#df2528' : 'none'} stroke={trainer.isFavorited ? '#df2528' : 'white'} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </button>
        )}
      </Link>

      <div className="trainer-card__content">
        <Link to={`/trainers/${trainer.id}`} className="trainer-card__name">
          {trainer.name}
        </Link>
        <p className="trainer-card__title">{trainer.title}</p>

        <div className="trainer-card__specialties">
          {displaySpecialties.map((specialty, index) => (
            <span key={index} className="trainer-card__specialty">
              {specialty}
            </span>
          ))}
          {moreCount > 0 && (
            <span className="trainer-card__specialty trainer-card__specialty--more">
              +{moreCount}
            </span>
          )}
        </div>

        <div className="trainer-card__rating">
          <StarRating value={trainer.rating} readOnly size="small" />
          <span className="trainer-card__rating-text">
            {trainer.rating} ({trainer.reviewCount})
          </span>
        </div>

        <div className="trainer-card__footer">
          <div className="trainer-card__price">
            <span className="trainer-card__price-label">เริ่มต้น</span>
            <span className="trainer-card__price-amount">
              {formatCurrency(trainer.priceRange.min)}
            </span>
          </div>
          
          <div className="trainer-card__location">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="#666">
              <path d="M7 0C4.814 0 3 1.814 3 4c0 2.416 3.316 6.084 3.47 6.283a.748.748 0 001.06 0C7.684 10.084 11 5.416 11 4c0-2.186-1.814-4-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
            </svg>
            <span>{trainer.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerCard;
