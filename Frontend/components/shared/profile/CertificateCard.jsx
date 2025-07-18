
// Frontend/components/shared/profile/CertificateCard.jsx
import React, { useState } from 'react';
import { formatDate } from '../../../utils/helpers';
import './CertificateCard.scss';

const CertificateCard = ({
  certificate,
  onView,
  onEdit,
  onDelete,
  isOwn = false,
  showActions = true
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="certificate-card">
      <div className="certificate-card__image" onClick={() => onView?.(certificate)}>
        {!imageError && certificate.imageUrl ? (
          <img 
            src={certificate.imageUrl} 
            alt={certificate.name}
            onError={handleImageError}
          />
        ) : (
          <div className="certificate-card__placeholder">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="currentColor">
              <path d="M24 4L6 14v16c0 9.9 7.2 19.1 18 21.4 10.8-2.3 18-11.5 18-21.4V14L24 4zm0 20h14c-.9 7.2-5.7 13.5-14 15.8V24H10V16.1l14-8.2v16.1z"/>
            </svg>
          </div>
        )}
        {certificate.verified && (
          <span className="certificate-card__verified">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10.97 4.97a.75.75 0 011.07 1.05l-3.99 4.99a.75.75 0 01-1.08.02L4.324 8.384a.75.75 0 111.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 01.02-.022z"/>
            </svg>
          </span>
        )}
      </div>

      <div className="certificate-card__content">
        <h4 className="certificate-card__name">{certificate.name}</h4>
        <p className="certificate-card__issuer">{certificate.issuer}</p>
        
        <div className="certificate-card__details">
          <div className="certificate-card__detail">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.5 0a.5.5 0 01.5.5V1h8V.5a.5.5 0 011 0V1h1a2 2 0 012 2v11a2 2 0 01-2 2H2a2 2 0 01-2-2V3a2 2 0 012-2h1V.5a.5.5 0 01.5-.5zM1 4v10a1 1 0 001 1h12a1 1 0 001-1V4H1z"/>
            </svg>
            <span>{formatDate(certificate.issueDate, 'MMM YYYY')}</span>
          </div>
          
          {certificate.expiryDate && (
            <div className="certificate-card__detail">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3.5a.5.5 0 00-1 0V9a.5.5 0 00.252.434l3.5 2a.5.5 0 00.496-.868L8 8.71V3.5z"/>
                <path d="M8 16A8 8 0 108 0a8 8 0 000 16zm7-8A7 7 0 111 8a7 7 0 0114 0z"/>
              </svg>
              <span>หมดอายุ {formatDate(certificate.expiryDate, 'MMM YYYY')}</span>
            </div>
          )}
        </div>

        {certificate.credentialId && (
          <p className="certificate-card__credential">
            ID: {certificate.credentialId}
          </p>
        )}
      </div>

      {showActions && isOwn && (
        <div className="certificate-card__actions">
          <button
            className="certificate-card__action"
            onClick={() => onEdit?.(certificate)}
            title="แก้ไข"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10A.5.5 0 015.5 14H2.5a.5.5 0 01-.5-.5v-3a.5.5 0 01.146-.354l10-10zM13.5 3L14 3.5 5.5 12H4v-1.5L12.5 2l1 1z"/>
            </svg>
          </button>
          <button
            className="certificate-card__action certificate-card__action--danger"
            onClick={() => onDelete?.(certificate)}
            title="ลบ"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
              <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default CertificateCard;
