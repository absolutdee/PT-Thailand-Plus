/ DataProvider.jsx
import React, { useState, useEffect } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { useAsync } from '../hooks/useAsync';

const DataProvider = ({ 
  children, 
  fetchData, 
  dependencies = [],
  loadingComponent,
  errorComponent,
  emptyComponent,
  emptyMessage = 'ไม่พบข้อมูล' 
}) => {
  const { execute, status, value: data, error } = useAsync(fetchData, false);

  useEffect(() => {
    execute();
  }, dependencies);

  // Loading state
  if (status === 'idle' || status === 'pending') {
    return loadingComponent || (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return errorComponent || (
      <Alert variant="danger">
        <Alert.Heading>เกิดข้อผิดพลาด</Alert.Heading>
        <p>{error?.message || 'ไม่สามารถโหลดข้อมูลได้'}</p>
      </Alert>
    );
  }

  // Empty state
  if (status === 'success' && (!data || (Array.isArray(data) && data.length === 0))) {
    return emptyComponent || (
      <Alert variant="info">
        {emptyMessage}
      </Alert>
    );
  }

  // Success state - render children with data
  return typeof children === 'function' ? children(data) : children;
};

export default DataProvider;
