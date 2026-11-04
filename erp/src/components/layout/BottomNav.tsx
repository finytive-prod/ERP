import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  ShoppingCart, 
  Boxes, 
  CheckSquare, 
  Building2,
  MoreHorizontal 
} from 'lucide-react';
import { ERPService } from '../../services/erpStorage';

interface BottomNavProps {
  onOpenMore: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenMore }) => {
  const user = ERPService.getCurrentUser();
  const role = user.role;

  // Adapt bottom buttons according to role
  const getNavLinks = () => {
    if (role === 'Site Supervisor') {
      return [
        { path: '/', label: 'Home', icon: <LayoutDashboard size={20} /> },
        { path: '/jobs', label: 'Jobs', icon: <Briefcase size={20} /> },
        { path: '/tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
        { path: '/sites', label: 'Sites', icon: <Building2 size={20} /> },
      ];
    }
    if (role === 'Store Manager') {
      return [
        { path: '/', label: 'Home', icon: <LayoutDashboard size={20} /> },
        { path: '/inventory', label: 'Stock', icon: <Boxes size={20} /> },
        { path: '/purchases', label: 'Purchases', icon: <ShoppingCart size={20} /> },
        { path: '/jobs', label: 'Jobs', icon: <Briefcase size={20} /> },
      ];
    }
    if (role === 'Purchase Manager') {
      return [
        { path: '/', label: 'Home', icon: <LayoutDashboard size={20} /> },
        { path: '/purchases', label: 'Purchases', icon: <ShoppingCart size={20} /> },
        { path: '/boq', label: 'BOQ', icon: <Boxes size={20} /> },
        { path: '/jobs', label: 'Jobs', icon: <Briefcase size={20} /> },
      ];
    }
    // Admin / Accounts default
    return [
      { path: '/', label: 'Home', icon: <LayoutDashboard size={20} /> },
      { path: '/jobs', label: 'Jobs', icon: <Briefcase size={20} /> },
      { path: '/purchases', label: 'Purchases', icon: <ShoppingCart size={20} /> },
      { path: '/inventory', label: 'Stock', icon: <Boxes size={20} /> },
    ];
  };

  return (
    <nav
      className="bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottomnav-height)',
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 90,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
      }}
    >
      <style>{`
        @media (min-width: 1024px) {
          .bottom-nav { display: none !important; }
        }
      `}</style>

      {getNavLinks().map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          end={link.path === '/'}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: isActive ? 'var(--color-primary)' : 'var(--color-gray-500)',
            textDecoration: 'none',
            fontSize: '0.72rem',
            fontWeight: isActive ? 700 : 500,
            gap: 3,
            minWidth: 54,
            minHeight: 'var(--touch-target-min)',
          })}
        >
          {link.icon}
          <span>{link.label}</span>
        </NavLink>
      ))}

      <button
        type="button"
        onClick={onOpenMore}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-gray-500)',
          fontSize: '0.72rem',
          fontWeight: 500,
          gap: 3,
          minWidth: 54,
          minHeight: 'var(--touch-target-min)',
        }}
      >
        <MoreHorizontal size={20} />
        <span>More</span>
      </button>
    </nav>
  );
};
