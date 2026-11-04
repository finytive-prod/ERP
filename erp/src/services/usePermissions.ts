import { useState, useEffect, useMemo, useCallback } from 'react';
import { ERPService } from './erpStorage';
import { User, RoleDefinition, PrivilegeDefinition } from '../types';

export interface UsePermissionsReturn {
  currentUser: User;
  roles: RoleDefinition[];
  currentRole: RoleDefinition | undefined;
  userPermissions: string[];
  isAdmin: boolean;
  isAuthenticated: boolean;
  hasPermission: (permissionKey: string) => boolean;
  hasAnyPermission: (permissionKeys: string[]) => boolean;
  hasAllPermissions: (permissionKeys: string[]) => boolean;
  login: (email: string, password?: string) => User;
  logout: () => void;
  switchUser: (user: User) => void;
  switchRole: (roleName: string) => void;
  allPrivileges: PrivilegeDefinition[];
  defaultPassword: string;
}

export const usePermissions = (): UsePermissionsReturn => {
  const [currentUser, setCurrentUser] = useState<User>(ERPService.getCurrentUser());
  const [roles, setRoles] = useState<RoleDefinition[]>(ERPService.getRoles());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(ERPService.isAuthenticated());

  const sync = useCallback(() => {
    setCurrentUser(ERPService.getCurrentUser());
    setRoles(ERPService.getRoles());
    setIsAuthenticated(ERPService.isAuthenticated());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener('apex_storage_update', sync);
    return () => window.removeEventListener('apex_storage_update', sync);
  }, [sync]);

  const currentRole = useMemo(() => {
    return roles.find(
      (r) =>
        (currentUser.roleId && r.id === currentUser.roleId) ||
        r.name.toLowerCase() === currentUser.role.toLowerCase()
    );
  }, [roles, currentUser]);

  const userPermissions = useMemo(() => {
    return ERPService.getUserPermissions(currentUser);
  }, [currentUser]);

  const isAdmin = useMemo(() => {
    return currentUser.role.toLowerCase() === 'admin';
  }, [currentUser]);

  const hasPermission = useCallback(
    (permissionKey: string): boolean => {
      if (isAdmin) return true;
      return userPermissions.includes('*') || userPermissions.includes(permissionKey);
    },
    [isAdmin, userPermissions]
  );

  const hasAnyPermission = useCallback(
    (permissionKeys: string[]): boolean => {
      if (isAdmin) return true;
      if (userPermissions.includes('*')) return true;
      return permissionKeys.some((k) => userPermissions.includes(k));
    },
    [isAdmin, userPermissions]
  );

  const hasAllPermissions = useCallback(
    (permissionKeys: string[]): boolean => {
      if (isAdmin) return true;
      if (userPermissions.includes('*')) return true;
      return permissionKeys.every((k) => userPermissions.includes(k));
    },
    [isAdmin, userPermissions]
  );

  const switchUser = useCallback((user: User) => {
    ERPService.setCurrentUser(user);
    setCurrentUser(user);
  }, []);

  const switchRole = useCallback((roleName: string) => {
    const updated = ERPService.setCurrentUserRole(roleName);
    setCurrentUser(updated);
  }, []);

  return {
    currentUser,
    roles,
    currentRole,
    userPermissions,
    isAdmin,
    isAuthenticated,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    login: ERPService.login,
    logout: ERPService.logout,
    switchUser,
    switchRole,
    allPrivileges: ERPService.getAllPrivileges(),
    defaultPassword: ERPService.getDefaultPassword(),
  };
};
