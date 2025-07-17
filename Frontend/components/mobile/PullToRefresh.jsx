// PullToRefresh.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import './PullToRefresh.scss';

const PullToRefresh = ({
  children,
  onRefresh,
  threshold = 80,
  maxPullDistance = 120,
  refreshTimeout = 2000,
  disabled = false,
  pullText = 'ดึงเพื่อรีเฟรช',
  releaseText = 'ปล่อยเพื่อรีเฟรช',
  refreshingText = 'กำลังรีเฟรช...',
  completeText = 'รีเฟรชสำเร็จ',
  containerStyle = {},
  indicatorStyle = {},
  contentStyle = {},
  resistance = 2.5
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [isPulling, setIsPulling] = useState(false);
  
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const refreshingRef = useRef(false);

  // Determine pull state
  const getPullState = () => {
    if (isComplete) return 'complete';
    if (isRefreshing) return 'refreshing';
    if (pullDistance >= threshold) return 'release';
    if (pullDistance > 0) return 'pull';
    return 'idle';
  };

  const pullState = getPullState();

  // Get status text based on state
  const getStatusText = () => {
    switch (pullState) {
      case 'pull':
        return pullText;
      case 'release':
        return releaseText;
      case 'refreshing':
        return refreshingText;
      case 'complete':
        return completeText;
      default:
        return '';
    }
  };

  // Check if we're at the top of the scrollable content
  const isAtTop = () => {
    if (!contentRef.current) return true;
    
    const scrollTop = contentRef.current.scrollTop || 
                     document.documentElement.scrollTop || 
                     document.body.scrollTop || 0;
    
    return scrollTop <= 0;
  };

  const handleTouchStart = (e) => {
    if (disabled || isRefreshing || !isAtTop()) return;
    
    const touch = e.touches[0];
    setTouchStart({
      y: touch.clientY,
      time: Date.now()
    });
  };

  const handleTouchMove = (e) => {
    if (!touchStart || disabled || isRefreshing || !isAtTop()) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStart.y;
    
    if (deltaY > 0) {
      e.preventDefault(); // Prevent browser pull-to-refresh
      
      if (!isPulling) {
        setIsPulling(true);
      }
      
      // Apply resistance to pull
      let distance = deltaY;
      if (deltaY > threshold) {
        distance = threshold + (deltaY - threshold) / resistance;
      }
      
      // Cap at max distance
      distance = Math.min(distance, maxPullDistance);
      
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async (e) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    setTouchStart(null);
    setIsPulling(false);
    
    if (pullDistance >= threshold) {
      // Trigger refresh
      setIsRefreshing(true);
      refreshingRef.current = true;
      
      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          // Default timeout if no onRefresh provided
          await new Promise(resolve => setTimeout(resolve, refreshTimeout));
        }
        
        // Show complete state briefly
        setIsComplete(true);
        setTimeout(() => {
          setIsComplete(false);
          setPullDistance(0);
          setIsRefreshing(false);
          refreshingRef.current = false;
        }, 500);
      } catch (error) {
        console.error('Refresh error:', error);
        setPullDistance(0);
        setIsRefreshing(false);
        refreshingRef.current = false;
      }
    } else {
      // Snap back
      setPullDistance(0);
    }
  };

  // Handle mouse events for desktop testing
  const handleMouseDown = (e) => {
    if (disabled || isRefreshing || !isAtTop()) return;
    
    setTouchStart({
      y: e.clientY,
      time: Date.now()
    });
  };

  const handleMouseMove = (e) => {
    if (!touchStart || disabled || isRefreshing || !isAtTop()) return;
    
    const deltaY = e.clientY - touchStart.y;
    
    if (deltaY > 0) {
      if (!isPulling) {
        setIsPulling(true);
      }
      
      let distance = deltaY;
      if (deltaY > threshold) {
        distance = threshold + (deltaY - threshold) / resistance;
      }
      
      distance = Math.min(distance, maxPullDistance);
      setPullDistance(distance);
    }
  };

  const handleMouseUp = handleTouchEnd;
  const handleMouseLeave = () => {
    if (isPulling && !isRefreshing) {
      setPullDistance(0);
      setIsPulling(false);
      setTouchStart(null);
    }
  };

  // Calculate indicator rotation
  const getIndicatorRotation = () => {
    if (pullState === 'refreshing') return null; // Use CSS animation
    if (pullState === 'complete') return 0;
    return (pullDistance / threshold) * 180;
  };

  const indicatorRotation = getIndicatorRotation();

  // Programmatic refresh method
  const refresh = useCallback(async () => {
    if (refreshingRef.current || disabled) return;
    
    setPullDistance(threshold);
    setIsRefreshing(true);
    refreshingRef.current = true;
    
    try {
      if (onRefresh) {
        await onRefresh();
      }
      
      setIsComplete(true);
      setTimeout(() => {
        setIsComplete(false);
        setPullDistance(0);
        setIsRefreshing(false);
        refreshingRef.current = false;
      }, 500);
    } catch (error) {
      console.error('Refresh error:', error);
      setPullDistance(0);
      setIsRefreshing(false);
      refreshingRef.current = false;
    }
  }, [onRefresh, disabled, threshold]);

  // Expose refresh method via ref
  React.useImperativeHandle(ref, () => ({
    refresh
  }));

  return (
    <div 
      ref={containerRef}
      className="pull-to-refresh-container"
      style={containerStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className={`pull-indicator ${pullState}`}
        style={{
          ...indicatorStyle,
          height: pullDistance,
          opacity: pullDistance > 20 ? 1 : pullDistance / 20
        }}
      >
        <div className="indicator-content">
          <div 
            className="indicator-icon"
            style={{
              transform: indicatorRotation !== null 
                ? `rotate(${indicatorRotation}deg)` 
                : undefined
            }}
          >
            <RefreshCw size={24} />
          </div>
          <div className="indicator-text">
            {getStatusText()}
          </div>
        </div>
      </div>
      
      <div 
        ref={contentRef}
        className="pull-content"
        style={{
          ...contentStyle,
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease'
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ForwardRef to allow parent components to trigger refresh programmatically
const PullToRefreshWithRef = React.forwardRef((props, ref) => {
  return <PullToRefresh {...props} ref={ref} />;
});

export default PullToRefreshWithRef;
