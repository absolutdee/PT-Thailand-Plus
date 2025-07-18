/ Frontend/components/shared/ImageGallery.jsx
import React, { useState, useRef, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import './ImageGallery.scss';

const ImageGallery = ({
  images = [],
  maxImages = 12,
  onImagesChange,
  editable = false,
  showMainImage = true,
  aspectRatio = '16/9'
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const fileInputRef = useRef(null);
  const [touchStart, setTouchStart] = useState(null);

  const handleImageUpload = async (e, index = null) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newImages = [...images];
    let currentIndex = index !== null ? index : images.length;

    for (const file of files) {
      if (currentIndex >= maxImages) break;

      setUploadingIndex(currentIndex);

      try {
        // อ่านไฟล์เป็น base64
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });

        const imageData = {
          id: Date.now() + Math.random(),
          url: base64,
          file: file,
          isNew: true
        };

        if (index !== null) {
          newImages[index] = imageData;
        } else {
          newImages.push(imageData);
        }

        currentIndex++;
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    setUploadingIndex(null);
    onImagesChange?.(newImages);
    fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange?.(newImages);
    
    if (selectedIndex >= newImages.length) {
      setSelectedIndex(Math.max(0, newImages.length - 1));
    }
  };

  const handleMainImageChange = (index) => {
    const newImages = [...images];
    const [selected] = newImages.splice(index, 1);
    newImages.unshift(selected);
    onImagesChange?.(newImages);
    setSelectedIndex(0);
  };

  const handleKeyDown = (e) => {
    if (!isFullscreen) return;

    switch (e.key) {
      case 'Escape':
        setIsFullscreen(false);
        break;
      case 'ArrowLeft':
        navigateImage(-1);
        break;
      case 'ArrowRight':
        navigateImage(1);
        break;
    }
  };

  const navigateImage = (direction) => {
    setSelectedIndex((prev) => {
      const newIndex = prev + direction;
      if (newIndex < 0) return images.length - 1;
      if (newIndex >= images.length) return 0;
      return newIndex;
    });
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        navigateImage(1);
      } else {
        navigateImage(-1);
      }
    }

    setTouchStart(null);
  };

  useEffect(() => {
    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullscreen, images.length]);

  const renderEmptySlot = (index) => (
    <div
      key={`empty-${index}`}
      className="image-gallery__empty-slot"
      onClick={() => editable && fileInputRef.current?.click()}
    >
      {uploadingIndex === index ? (
        <LoadingSpinner size="small" />
      ) : (
        <>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 4V20M20 12L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>เพิ่มรูปภาพ</span>
        </>
      )}
    </div>
  );

  return (
    <div className="image-gallery" style={{ '--aspect-ratio': aspectRatio }}>
      {showMainImage && images.length > 0 && (
        <div className="image-gallery__main">
          <div 
            className="image-gallery__main-image"
            onClick={() => setIsFullscreen(true)}
          >
            <img
              src={images[selectedIndex]?.url}
              alt={`Image ${selectedIndex + 1}`}
              loading="lazy"
            />
            {editable && (
              <div className="image-gallery__main-actions">
                <button
                  className="image-gallery__action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(selectedIndex);
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="image-gallery__thumbnails">
        {images.map((image, index) => (
          <div
            key={image.id || index}
            className={`image-gallery__thumbnail ${selectedIndex === index ? 'image-gallery__thumbnail--active' : ''}`}
            onClick={() => setSelectedIndex(index)}
          >
            <img src={image.url} alt={`Thumbnail ${index + 1}`} loading="lazy" />
            {editable && (
              <div className="image-gallery__thumbnail-actions">
                {index !== 0 && (
                  <button
                    className="image-gallery__action-btn image-gallery__action-btn--primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMainImageChange(index);
                    }}
                    title="ตั้งเป็นรูปหลัก"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1l2.092 4.236L15 6.033l-3.5 3.413.826 4.82L8 12l-4.326 2.274.826-4.82L1 6.033l4.908-.797L8 1z"/>
                    </svg>
                  </button>
                )}
                <button
                  className="image-gallery__action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(index);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
        
        {editable && images.length < maxImages && renderEmptySlot(images.length)}
      </div>

      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      )}

      {isFullscreen && (
        <div 
          className="image-gallery__fullscreen"
          onClick={() => setIsFullscreen(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            className="image-gallery__fullscreen-close"
            onClick={() => setIsFullscreen(false)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41z"/>
            </svg>
          </button>

          <button
            className="image-gallery__fullscreen-nav image-gallery__fullscreen-nav--prev"
            onClick={(e) => {
              e.stopPropagation();
              navigateImage(-1);
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
              <path d="M20 24L12 16l8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <img
            src={images[selectedIndex]?.url}
            alt={`Fullscreen ${selectedIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
          />

          <button
            className="image-gallery__fullscreen-nav image-gallery__fullscreen-nav--next"
            onClick={(e) => {
              e.stopPropagation();
              navigateImage(1);
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
              <path d="M12 24l8-8-8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="image-gallery__fullscreen-counter">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
