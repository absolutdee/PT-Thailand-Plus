// useInfiniteScroll.js
import { useState, useEffect, useCallback } from 'react';

export const useInfiniteScroll = (callback, hasMore) => {
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop 
          !== document.documentElement.offsetHeight || isFetching) {
        return;
      }
      setIsFetching(true);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFetching]);

  useEffect(() => {
    if (!isFetching || !hasMore) return;
    fetchMoreData();
  }, [isFetching, hasMore]);

  const fetchMoreData = useCallback(async () => {
    await callback();
    setIsFetching(false);
  }, [callback]);

  return [isFetching, setIsFetching];
};
