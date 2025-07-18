// useOnClickOutside.js
import { useEffect, useRef } from 'react';

export const useOnClickOutside = (handler, listenCapturing = true) => {
  const ref = useRef();

  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener, listenCapturing);
    document.addEventListener('touchstart', listener, listenCapturing);

    return () => {
      document.removeEventListener('mousedown', listener, listenCapturing);
      document.removeEventListener('touchstart', listener, listenCapturing);
    };
  }, [handler, listenCapturing]);

  return ref;
};
