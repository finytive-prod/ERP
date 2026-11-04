import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, KeyRound, Zap } from 'lucide-react';
import { usePermissions } from '../../services/usePermissions';
import { ERPService } from '../../services/erpStorage';
import { Button, Card } from '../ui';

interface ProtectedRouteProps {
  permission?: string;
  permissions?: string[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  permission,
  permissions = [],
  children,
}) => {
  const navigate = useNavigate();
  const { currentUser, hasPermission, hasAnyPermission, switchUser } = usePermissions();
  const allMembers = ERPService.getMembers();

  const requiredPerms = permission ? [permission, ...permissions] : permissions;

  const isAuthorized =
    requiredPerms.length === 0 ||
    hasAnyPermission(requiredPerms);

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '65vh',
        padding: 'var(--space-6)',
      }}
    >
      <div
        className="ui-card"
        style={{
          maxWidth: 520,
          width: '100%',
          padding: 'var(--space-6)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-4)',
          border: '1px solid #fecaca',
          boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.08)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#dc2626',
          }}
        >
          <ShieldAlert size={30} />
        </div>

        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991b1b', margin: '0 0 6px 0' }}>
            Privilege Access Restricted
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            Your active role <strong>"{currentUser.role}"</strong> ({currentUser.name}) has not been granted the required privilege for this module.
          </p>
        </div>

        <div
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 6,
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            fontSize: '0.76rem',
            textAlign: 'left',
          }}
        >
          <div style={{ fontWeight: 700, color: '#b91c1c', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <KeyRound size={13} />
            Required Privileges:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {requiredPerms.map((k) => (
              <span
                key={k}
                style={{
                  padding: '2px 6px',
                  borderRadius: 3,
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  fontFamily: 'monospace',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {k}
              </span>
            ))}
          </div>
        </div>

        {/* Quick Demo Switcher */}
        <div
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 6,
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
            ⚡ Switch to an Authorized User to Test:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {allMembers
              .filter((m) => m.status === 'Active')
              .map((m) => (
                <button
                  key={m.id}
                  onClick={() => switchUser(m)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: '1px solid #cbd5e1',
                    backgroundColor: m.role.toLowerCase() === 'admin' ? '#eff6ff' : '#ffffff',
                    color: m.role.toLowerCase() === 'admin' ? '#1d4ed8' : '#334155',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Zap size={11} />
                  <span>{m.name.split(' ')[0]} ({m.role})</span>
                </button>
              ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="accent"
            icon={<KeyRound size={16} />}
            onClick={() => navigate('/members')}
          >
            Manage Permissions
          </Button>
        </div>
      </div>
    </div>
  );
};
