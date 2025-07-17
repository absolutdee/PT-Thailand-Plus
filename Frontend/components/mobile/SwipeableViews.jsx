// SwipeableViews.jsx
import React, { useState, useRef, useEffect } from 'react';
import './SwipeableViews.scss';

const SwipeableViews = ({ 
  children, 
  activeIndex = 0, 
  onChangeIndex, 
  threshold = 50,
  animationDuration = 300,
  enableMouseEvents = false,
  resistance = false,
  onSwitching,
  containerStyle = {},
  slideStyle = {},
  disabled = false,
  axis = 'x' // 'x' for horizontal, 'y' for vertical
}) => {
  const [currentIndex, setCurrentIndex] = useState(activeIndex);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  
  const containerRef = useRef(null);
  const slideRefs = useRef([]);
  
  const childrenArray = React.Children.toArray(children);
  const childrenCount = childrenArray.length;

  useEffect(() => {
    setCurrentIndex(activeIndex);
  }, [activeIndex]);

  useEffect(() => {
    // Update slide positions when index changes
    updateSlidePositions();
  }, [currentIndex]);

  const updateSlidePositions = () => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    
    slideRefs.current.forEach((slide, index) => {
      if (slide) {
        const offset = axis === 'x' 
          ? (index - currentIndex) * containerWidth + dragOffset
          : (index - currentIndex) * containerHeight + dragOffset;
        
        slide.style.transform = axis === 'x'
          ? `translateX(${offset}px)`
          : `translateY(${offset}px)`;
      }
    });
  };

  const handleTouchStart = (e) => {
    if (disabled) return;
    
    const touch = e.touches ? e.touches[0] : e;
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!touchStart || disabled) return;
    
    const touch = e.touches ? e.touches[0] : e;
    const currentTouch = {
      x: touch.clientX,
      y: touch.clientY
    };
    
    const diffX = touchStart.x - currentTouch.x;
    const diffY = touchStart.y - currentTouch.y;
    const diff = axis === 'x' ? diffX : diffY;
    
    // Start dragging if movement exceeds threshold
    if (!isDragging && Math.abs(diff) > 10) {
      setIsDragging(true);
    }
    
    if (isDragging) {
      e.preventDefault(); // Prevent scrolling
      
      let offset = -diff;
      
      // Apply resistance at edges
      if (resistance) {
        const atFirstIndex = currentIndex === 0 && diff < 0;
        const atLastIndex = currentIndex === childrenCount - 1 && diff > 0;
        
        if (atFirstIndex || atLastIndex) {
          offset = offset * 0.3; // Reduce movement at edges
        }
      }
      
      setDragOffset(offset);
      updateSlidePositions();
      
      if (onSwitching) {
        onSwitching(currentIndex, 'move');
      }
    }
    
    setTouchEnd(currentTouch);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart || !isDragging || disabled) return;
    
    const touchDuration = Date.now() - touchStart.time;
    const velocity = Math.abs(dragOffset) / touchDuration;
    
    let nextIndex = currentIndex;
    
    // Determine if we should change slides
    if (Math.abs(dragOffset) > threshold || velocity > 0.3) {
      if (dragOffset > 0 && currentIndex > 0) {
        nextIndex = currentIndex - 1;
      } else if (dragOffset < 0 && currentIndex < childrenCount - 1) {
        nextIndex = currentIndex + 1;
      }
    }
    
    // Animate to final position
    setIsAnimating(true);
    setDragOffset(0);
    
    if (nextIndex !== currentIndex) {
      setCurrentIndex(nextIndex);
      if (onChangeIndex) {
        onChangeIndex(nextIndex);
      }
    }
    
    setTimeout(() => {
      setIsAnimating(false);
    }, animationDuration);
    
    // Reset states
    setTouchStart(null);
    setTouchEnd(null);
    setIsDragging(false);
  };

  const handleMouseDown = (e) => {
    if (!enableMouseEvents) return;
    handleTouchStart(e);
  };

  const handleMouseMove = (e) => {
    if (!enableMouseEvents || !touchStart) return;
    handleTouchMove(e);
  };

  const handleMouseUp = (e) => {
    if (!enableMouseEvents) return;
    handleTouchEnd(e);
  };

  const handleMouseLeave = (e) => {
    if (!enableMouseEvents || !isDragging) return;
    handleTouchEnd(e);
  };

  // Public methods that can be accessed via ref
  const slideToIndex = (index) => {
    if (index >= 0 && index < childrenCount && index !== currentIndex) {
      setIsAnimating(true);
      setCurrentIndex(index);
      if (onChangeIndex) {
        onChangeIndex(index);
      }
      setTimeout(() => {
        setIsAnimating(false);
      }, animationDuration);
    }
  };

  const slideNext = () => {
    if (currentIndex < childrenCount - 1) {
      slideToIndex(currentIndex + 1);
    }
  };

  const slidePrev = () => {
    if (currentIndex > 0) {
      slideToIndex(currentIndex - 1);
    }
  };

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    slideToIndex,
    slideNext,
    slidePrev,
    getCurrentIndex: () => currentIndex
  }));

  return (
    <div 
      ref={containerRef}
      className={`swipeable-views-container ${axis === 'y' ? 'vertical' : 'horizontal'}`}
      style={containerStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`swipeable-views-wrapper ${isAnimating ? 'animating' : ''}`}>
        {childrenArray.map((child, index) => (
          <div
            key={index}
            ref={(el) => slideRefs.current[index] = el}
            className={`swipeable-view ${index === currentIndex ? 'active' : ''}`}
            style={{
              ...slideStyle,
              transitionDuration: isAnimating ? `${animationDuration}ms` : '0ms'
            }}
          >
            {child}
          </div>
        ))}
      </div>
      
      {/* Optional indicators */}
      {childrenCount > 1 && (
        <div className="swipeable-indicators">
          {childrenArray.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => slideToIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ForwardRef to allow parent components to access methods
const SwipeableViewsWithRef = React.forwardRef((props, ref) => {
  return <SwipeableViews {...props} ref={ref} />;
});

export default SwipeableViewsWithRef;
