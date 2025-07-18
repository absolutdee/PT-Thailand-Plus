// RoleBasedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Container } from 'react-bootstrap';

const RoleBasedRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/unauthorized',
  showUnauthorized = true 
}) => {
  const { user, role } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    if (showUnauthorized) {
      return (
        <Container className="mt-5">
          <Alert variant="danger">
            <Alert.Heading>ไม่มีสิทธิ์เข้าถึง</Alert.Heading>
            <p>คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบ</p>
          </Alert>
        </Container>
      );
    }
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default RoleBasedRoute;
