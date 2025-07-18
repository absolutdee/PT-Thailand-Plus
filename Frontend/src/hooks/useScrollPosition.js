// useScrollPosition.js
import { useState, useEffect } from 'react';

export const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition({
        x: window.pageXOffset,
        y: window.pageYOffset
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return scrollPosition;
};
