import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ERPService } from '../../services/erpStorage';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(ERPService.isAuthenticated());
  const location = useLocation();

  useEffect(() => {
    const handleUpdate = () => {
      setIsAuthenticated(ERPService.isAuthenticated());
    };
    window.addEventListener('apex_storage_update', handleUpdate);
    return () => window.removeEventListener('apex_storage_update', handleUpdate);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
