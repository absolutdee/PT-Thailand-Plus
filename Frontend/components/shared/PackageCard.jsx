// Frontend/components/shared/PackageCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/helpers';
import './PackageCard.scss';

const PackageCard = ({ 
  package: pkg,
  trainer,
  onSelect,
  selected = false,
  showTrainerInfo = true,
  editable = false,
  onEdit,
  onDelete,
  onToggleRecommended
}) => {
  const getPackageIcon = (type) => {
    switch (type) {
      case 'single_session':
        return '🎯';
      case 'monthly':
        return '📅';
      case 'quarterly':
        return '📊';
      case 'yearly':
        return '🏆';
      default:
        return '💪';
    }
  };

  const getPackageTypeName = (type) => {
    switch (type) {
      case 'single_session':
        return 'ครั้งเดียว';
      case 'monthly':
        return 'รายเดือน';
      case 'quarterly':
        return 'ราย 3 เดือน';
      case 'yearly':
        return 'รายปี';
      default:
        return 'แพ็คเกจพิเศษ';
    }
  };

  const getDurationText = () => {
    if (pkg.sessions === 1) return '1 เซสชัน';
    if (pkg.duration === 1) return '1 เดือน';
    if (pkg.duration === 3) return '3 เดือน';
    if (pkg.duration === 12) return '1 ปี';
    return `${pkg.sessions} เซสชัน`;
  };

  return (
    <div 
      className={`package-card ${selected ? 'package-card--selected' : ''} ${pkg.recommended ? 'package-card--recommended' : ''}`}
      onClick={() => onSelect?.(pkg)}
    >
      {pkg.recommended && (
        <div className="package-card__badge">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1l2.092 4.236L15 6.033l-3.5 3.413.826 4.82L8 12l-4.326 2.274.826-4.82L1 6.033l4.908-.797L8 1z"/>
          </svg>
          แนะนำ
        </div>
      )}

      {editable && (
        <div className="package-card__actions">
          <button
            className="package-card__action"
            onClick={(e) => {
              e.stopPropagation();
              onToggleRecommended?.(pkg.id);
            }}
            title={pkg.recommended ? 'ยกเลิกแนะนำ' : 'ตั้งเป็นแพ็คเกจแนะนำ'}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <path d="M9 1l2.092 4.236L16 6.033l-3.5 3.413.826 4.82L9 12l-4.326 2.274.826-4.82L1 6.033l4.908-.797L9 1z" fill={pkg.recommended ? '#ffc107' : 'none'} stroke={pkg.recommended ? '#ffc107' : 'currentColor'}/>
            </svg>
          </button>
          <button
            className="package-card__action"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(pkg);
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <path d="M12.146 1.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10A.5.5 0 015.5 15H2.5a.5.5 0 01-.5-.5v-3a.5.5 0 01.146-.354l10-10zM13.5 4L14 4.5 5.5 13H4v-1.5L12.5 3l1 1z"/>
            </svg>
          </button>
          <button
            className="package-card__action package-card__action--danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(pkg.id);
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <path d="M6 2V1h6v1h3v1h-1v11a2 2 0 01-2 2H6a2 2 0 01-2-2V3H3V2h3zm2 3v8h1V5H8zm3 0v8h1V5h-1z"/>
            </svg>
          </button>
        </div>
      )}

      <div className="package-card__header">
        <span className="package-card__icon">{getPackageIcon(pkg.type)}</span>
        <h3 className="package-card__name">{pkg.name}</h3>
        <span className="package-card__type">{getPackageTypeName(pkg.type)}</span>
      </div>

      <div className="package-card__content">
        <p className="package-card__description">{pkg.description}</p>
        
        <div className="package-card__features">
          <div className="package-card__feature">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="#28a745">
              <path d="M13.485 1.929a.5.5 0 010 .707L5.793 10.328a.5.5 0 01-.707 0L1.515 6.757a.5.5 0 11.707-.707l3.217 3.217 7.339-7.338a.5.5 0 01.707 0z"/>
            </svg>
            <span>{getDurationText()}</span>
          </div>
          
          <div className="package-card__feature">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="#28a745">
              <path d="M13.485 1.929a.5.5 0 010 .707L5.793 10.328a.5.5 0 01-.707 0L1.515 6.757a.5.5 0 11.707-.707l3.217 3.217 7.339-7.338a.5.5 0 01.707 0z"/>
            </svg>
            <span>{pkg.sessionDuration} นาที/เซสชัน</span>
          </div>

          {pkg.features?.map((feature, index) => (
            <div key={index} className="package-card__feature">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="#28a745">
                <path d="M13.485 1.929a.5.5 0 010 .707L5.793 10.328a.5.5 0 01-.707 0L1.515 6.757a.5.5 0 11.707-.707l3.217 3.217 7.339-7.338a.5.5 0 01.707 0z"/>
              </svg>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="package-card__footer">
        <div className="package-card__price">
          <span className="package-card__price-amount">
            {formatCurrency(pkg.price)}
          </span>
          <span className="package-card__price-unit">
            {pkg.type === 'single_session' ? '/ครั้ง' : `/${getDurationText()}`}
          </span>
        </div>

        {showTrainerInfo && trainer && (
          <Link 
            to={`/trainers/${trainer.id}`} 
            className="package-card__trainer"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={trainer.avatar} alt={trainer.name} />
            <span>{trainer.name}</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default PackageCard;
