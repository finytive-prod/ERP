import React from 'react';
import { 
  Briefcase, 
  FileSpreadsheet, 
  ShoppingCart, 
  Boxes, 
  CheckSquare, 
  Users, 
  Building2, 
  Landmark, 
  DollarSign, 
  TrendingUp, 
  History, 
  ShieldAlert, 
  Settings, 
  LayoutDashboard, 
  Zap,
  Tag,
  LogOut
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ERPService } from '../../services/erpStorage';
import { usePermissions } from '../../services/usePermissions';
import { UserRole } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemConfig {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  roles?: string[];
  permission?: string;
}

interface NavModuleGroup {
  id: string;
  title: string;
  shortCode?: string;
  items: NavItemConfig[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { currentUser, currentRole, hasPermission, isAdmin, logout } = usePermissions();
  const members = ERPService.getMembers();
  const activeMembersCount = members.filter((m) => m.status === 'Active').length;

  const modules: NavModuleGroup[] = [
    {
      id: 'projects',
      title: 'Projects & Operations',
      shortCode: 'MOD-01',
      items: [
        {
          path: '/',
          label: 'Home Dashboard',
          icon: <LayoutDashboard size={18} />,
        },
        {
          path: '/jobs',
          label: 'Jobs (Core Hub)',
          icon: <Briefcase size={18} />,
          badge: 'Spine',
          permission: 'jobs.view',
        },
        {
          path: '/boq',
          label: 'BOQ & Quotations',
          icon: <FileSpreadsheet size={18} />,
          permission: 'boq.view',
        },
      ],
    },
    {
      id: 'procurement',
      title: 'Procurement & Materials',
      shortCode: 'MOD-02',
      items: [
        {
          path: '/purchases',
          label: 'Purchases & POs',
          icon: <ShoppingCart size={18} />,
          permission: 'purchases.view',
        },
        {
          path: '/inventory',
          label: 'Inventory & Stock',
          icon: <Boxes size={18} />,
          permission: 'inventory.view',
        },
        {
          path: '/vendors',
          label: 'Vendors & Rates',
          icon: <Building2 size={18} />,
          permission: 'partners.view',
        },
      ],
    },
    {
      id: 'site_execution',
      title: 'Site Execution',
      shortCode: 'MOD-03',
      items: [
        {
          path: '/sites',
          label: 'Sites & Workspaces',
          icon: <Building2 size={18} />,
          badge: 'Hub',
          permission: 'sites.view',
        },
        {
          path: '/tasks',
          label: 'Site Tasks & Material',
          icon: <CheckSquare size={18} />,
          permission: 'sites.view',
        },
      ],
    },
    {
      id: 'finance',
      title: 'Billing & Commercial',
      shortCode: 'MOD-04',
      items: [
        {
          path: '/clients',
          label: 'Clients Master',
          icon: <Landmark size={18} />,
          permission: 'partners.view',
        },
        {
          path: '/accounts',
          label: 'Accounts & Invoices',
          icon: <DollarSign size={18} />,
          permission: 'billing.view',
        },
        {
          path: '/reports/pnl',
          label: 'Profit & Loss Reports',
          icon: <TrendingUp size={18} />,
          permission: 'reports.pnl_view',
        },
        {
          path: '/reports/price-history',
          label: 'Price History & Trends',
          icon: <Tag size={18} />,
          permission: 'purchases.view',
        },
      ],
    },
    {
      id: 'system',
      title: 'System & Governance',
      shortCode: 'MOD-05',
      items: [
        {
          path: '/members',
          label: 'Team & Roles',
          icon: <Users size={18} />,
          badge: `${activeMembersCount}`,
          permission: 'members.manage',
        },
        {
          path: '/audit',
          label: 'Global Audit Log',
          icon: <History size={18} />,
          permission: 'audit.view',
        },
        {
          path: '/settings',
          label: 'System Settings',
          icon: <Settings size={18} />,
          permission: 'settings.manage',
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            zIndex: 150,
            display: 'block',
          }}
        />
      )}

      <aside
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--bg-sidebar)',
          color: '#ffffff',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 160,
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform var(--transition-normal)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <style>{`
          @media (min-width: 1024px) {
            aside {
              transform: translateX(0) !important;
            }
          }
        `}</style>

        {/* Company Header */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minHeight: 'var(--topbar-height)',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#162d46',
              border: '1px solid #1e3a8a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
            }}
          >
            <Zap size={22} fill="#f59e0b" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Apex Electricals
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Supply & Contracting ERP
            </div>
          </div>
        </div>

        {/* User Role Card */}
        <div
          style={{
            margin: 'var(--space-3) var(--space-4)',
            padding: '10px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em' }}>
              Active Profile
            </span>
            <NavLink
              to="/members"
              onClick={onClose}
              style={{
                fontSize: '0.68rem',
                color: '#60a5fa',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Switch Role
            </NavLink>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff', marginTop: 3 }}>
            {currentUser.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: currentRole?.color || 'var(--color-accent)',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              {currentUser.role}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              {isAdmin ? 'Super Admin' : `${ERPService.getUserPermissions(currentUser).length} privs`}
            </span>
          </div>
        </div>

        {/* Navigation Menu Grouped by Modules */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-2) var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {modules.map((mod) => {
            const visibleModItems = mod.items.filter((item) => {
              if (item.permission) {
                return hasPermission(item.permission);
              }
              if (item.roles) {
                return item.roles.includes(currentUser.role as any);
              }
              return true;
            });
            if (visibleModItems.length === 0) return null;

            return (
              <div
                key={mod.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {/* Module Section Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 10px 4px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.67rem',
                      fontWeight: 800,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                    }}
                  >
                    {mod.title}
                  </span>
                  {mod.shortCode && (
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        color: 'rgba(255, 255, 255, 0.4)',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        padding: '1px 5px',
                        borderRadius: 3,
                      }}
                    >
                      {mod.shortCode}
                    </span>
                  )}
                </div>

                {/* Module Items */}
                {visibleModItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onClose}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      color: isActive ? '#ffffff' : '#cbd5e1',
                      backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.85rem',
                      minHeight: '36px',
                      textDecoration: 'none',
                      transition: 'all var(--transition-fast)',
                    })}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        style={{
                          backgroundColor: 'rgba(217, 119, 6, 0.25)',
                          color: '#f59e0b',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 4,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User profile & Sign Out in Sidebar footer */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                  {currentUser.role}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
                navigate('/login');
              }}
              title="Sign Out"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                borderRadius: 4,
                border: '1px solid rgba(239, 68, 68, 0.35)',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#f87171',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <LogOut size={12} />
              <span>Logout</span>
            </button>
          </div>

          <div
            style={{
              fontSize: '0.68rem',
              color: '#64748b',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Job ID Spine System</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
