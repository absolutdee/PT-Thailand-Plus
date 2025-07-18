// useTimer.js
import { useState, useEffect, useCallback } from 'react';

export const useTimer = (initialTime = 0, interval = 1000) => {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let intervalId;

    if (isRunning) {
      intervalId = setInterval(() => {
        setTime(prevTime => prevTime + interval);
      }, interval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, interval]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setTime(initialTime);
    setIsRunning(false);
  }, [initialTime]);

  return { time, isRunning, start, pause, reset };
};
