// Frontend/components/shared/profile/ReviewCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../StarRating';
import { formatDate, getRelativeTime, truncateText } from '../../../utils/helpers';
import './ReviewCard.scss';

const ReviewCard = ({
  review,
  onReply,
  onEdit,
  onDelete,
  onReport,
  onHelpful,
  showActions = true,
  isOwn = false,
  showReviewer = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0);
  const [isHelpful, setIsHelpful] = useState(review.isHelpful || false);

  const handleHelpful = () => {
    const newIsHelpful = !isHelpful;
    setIsHelpful(newIsHelpful);
    setHelpfulCount(prev => newIsHelpful ? prev + 1 : prev - 1);
    onHelpful?.(review.id, newIsHelpful);
  };

  const shouldTruncate = review.content.length > 200;
  const displayContent = shouldTruncate && !isExpanded 
    ? truncateText(review.content, 200)
    : review.content;

  return (
    <div className="review-card">
      <div className="review-card__header">
        {showReviewer && (
          <Link to={`/profile/${review.reviewer.id}`} className="review-card__reviewer">
            <img 
              src={review.reviewer.profileImage || '/images/default-avatar.jpg'} 
              alt={review.reviewer.name}
              className="review-card__avatar"
            />
            <div className="review-card__reviewer-info">
              <h4 className="review-card__reviewer-name">{review.reviewer.name}</h4>
              <p className="review-card__date">{getRelativeTime(review.createdAt)}</p>
            </div>
          </Link>
        )}
        
        <div className="review-card__rating">
          <StarRating value={review.rating} readOnly size="small" />
          {review.verified && (
            <span className="review-card__verified" title="ซื้อแพ็คเกจแล้ว">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M10.97 4.97a.75.75 0 011.07 1.05l-3.99 4.99a.75.75 0 01-1.08.02L4.324 8.384a.75.75 0 111.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 01.02-.022z"/>
              </svg>
              ซื้อแพ็คเกจแล้ว
            </span>
          )}
        </div>
      </div>

      <div className="review-card__content">
        <p className="review-card__text">{displayContent}</p>
        
        {shouldTruncate && (
          <button
            className="review-card__toggle"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'แสดงน้อยลง' : 'อ่านเพิ่มเติม'}
          </button>
        )}

        {review.images && review.images.length > 0 && (
          <div className="review-card__images">
            {review.images.map((image, index) => (
              <img 
                key={index}
                src={image}
                alt={`Review image ${index + 1}`}
                className="review-card__image"
              />
            ))}
          </div>
        )}

        {review.tags && review.tags.length > 0 && (
          <div className="review-card__tags">
            {review.tags.map((tag, index) => (
              <span key={index} className="review-card__tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {review.reply && (
        <div className="review-card__reply">
          <div className="review-card__reply-header">
            <img 
              src={review.reply.author.profileImage || '/images/default-avatar.jpg'} 
              alt={review.reply.author.name}
              className="review-card__reply-avatar"
            />
            <div className="review-card__reply-info">
              <h5 className="review-card__reply-author">{review.reply.author.name}</h5>
              <p className="review-card__reply-date">{getRelativeTime(review.reply.createdAt)}</p>
            </div>
          </div>
          <p className="review-card__reply-text">{review.reply.content}</p>
        </div>
      )}

      {showActions && (
        <div className="review-card__footer">
          <div className="review-card__actions">
            <button
              className={`review-card__action ${isHelpful ? 'review-card__action--active' : ''}`}
              onClick={handleHelpful}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8.864.046C7.908-.193 7.02.53 6.956 1.466c-.072 1.051-.23 2.016-.428 2.59-.125.36-.479 1.013-1.04 1.639-.557.623-1.282 1.178-2.131 1.41C2.685 7.288 2 7.87 2 8.72v4.001c0 .845.682 1.464 1.448 1.545 1.07.114 1.564.415 2.068.723l.048.03c.272.165.578.348.97.484.397.136.861.217 1.466.217h3.5c.937 0 1.599-.477 1.934-1.064a1.86 1.86 0 00.254-.912c0-.152-.023-.312-.077-.464.201-.263.38-.578.488-.901.11-.33.172-.762.004-1.149.069-.13.12-.269.159-.403.077-.27.113-.568.113-.857 0-.288-.036-.585-.113-.856a2.144 2.144 0 00-.138-.362 1.9 1.9 0 00.234-1.734c-.206-.592-.682-1.1-1.2-1.272-.847-.282-1.803-.276-2.516-.211a9.84 9.84 0 00-.443.05 9.365 9.365 0 00-.062-4.509A1.38 1.38 0 009.125.111L8.864.046zM11.5 14.721H8c-.51 0-.863-.069-1.14-.164-.281-.097-.506-.228-.776-.393l-.04-.024c-.555-.339-1.198-.731-2.49-.868-.333-.036-.554-.29-.554-.55V8.72c0-.254.226-.543.62-.65 1.095-.3 1.977-.996 2.614-1.708.635-.71 1.064-1.475 1.238-1.978.243-.7.407-1.768.482-2.85.025-.362.36-.594.667-.518l.262.066c.16.04.258.143.288.255a8.34 8.34 0 01-.145 4.725.5.5 0 00.595.644l.003-.001.014-.003.058-.014a8.908 8.908 0 011.036-.157c.663-.06 1.457-.054 2.11.164.175.058.45.3.57.65.107.308.087.67-.266 1.022l-.353.353.353.354c.043.043.105.141.154.315.048.167.075.37.075.581 0 .212-.027.414-.075.582-.05.174-.111.272-.154.315l-.353.353.353.354c.047.047.109.177.005.488a2.224 2.224 0 01-.505.805l-.353.353.353.354c.006.005.041.05.041.17a.866.866 0 01-.121.416c-.165.288-.503.56-1.066.56z"/>
              </svg>
              <span>มีประโยชน์ ({helpfulCount})</span>
            </button>

            {!review.reply && !isOwn && (
              <button
                className="review-card__action"
                onClick={() => onReply?.(review)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.83 5.146a.5.5 0 000 .708L7.975 8l-2.147 2.146a.5.5 0 00.707.708l2.147-2.147a.5.5 0 000-.707L6.537 5.854a.5.5 0 00-.707 0z"/>
                  <path d="M1 8a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9A.5.5 0 011 8z"/>
                </svg>
                <span>ตอบกลับ</span>
              </button>
            )}

            {isOwn && (
              <>
                <button
                  className="review-card__action"
                  onClick={() => onEdit?.(review)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10A.5.5 0 015.5 14H2.5a.5.5 0 01-.5-.5v-3a.5.5 0 01.146-.354l10-10zM13.5 3L14 3.5 5.5 12H4v-1.5L12.5 2l1 1z"/>
                  </svg>
                  <span>แก้ไข</span>
                </button>
                <button
                  className="review-card__action review-card__action--danger"
                  onClick={() => onDelete?.(review)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                  </svg>
                  <span>ลบ</span>
                </button>
              </>
            )}

            {!isOwn && (
              <button
                className="review-card__action"
                onClick={() => onReport?.(review)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M7.938 2.016A.13.13 0 018.002 2a.13.13 0 01.063.016.146.146 0 01.054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 01-.054.06.116.116 0 01-.066.017H1.146a.115.115 0 01-.066-.017.163.163 0 01-.054-.06.176.176 0 01.002-.183L7.884 2.073a.147.147 0 01.054-.057zm1.044-.45a1.13 1.13 0 00-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
                  <path d="M7.002 12a1 1 0 112 0 1 1 0 01-2 0zM7.1 5.995a.905.905 0 111.8 0l-.35 3.507a.552.552 0 01-1.1 0L7.1 5.995z"/>
                </svg>
                <span>รายงาน</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
