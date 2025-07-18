// AuthWrapper.jsx
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthWrapper = ({ children, requiredPermissions = [] }) => {
  const { user, permissions, checkPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission => 
        checkPermission(permission)
      );

      if (!hasAllPermissions) {
        navigate('/unauthorized');
      }
    }
  }, [user, permissions, requiredPermissions, navigate, location]);

  if (!user) {
    return null;
  }

  return children;
};

export default AuthWrapper;
