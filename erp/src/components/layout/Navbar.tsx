import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  RotateCcw, 
  ShieldCheck, 
  ChevronDown, 
  Menu, 
  X,
  ExternalLink,
  Zap,
  LogOut,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ERPService } from '../../services/erpStorage';
import { User, UserRole, AppNotification, Job, RoleDefinition } from '../../types';
import { Button, IconButton, Badge } from '../ui';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User>(ERPService.getCurrentUser());
  const [members, setMembers] = useState<User[]>(ERPService.getMembers());
  const [roles, setRoles] = useState<RoleDefinition[]>(ERPService.getRoles());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Job[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [dbHealth, setDbHealth] = useState(ERPService.getDbHealth());
  const [showDbDropdown, setShowDbDropdown] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);

  const loadData = () => {
    setCurrentUser(ERPService.getCurrentUser());
    setMembers(ERPService.getMembers());
    setRoles(ERPService.getRoles());
    setNotifications(ERPService.getNotifications());
    setJobs(ERPService.getJobs());
  };

  useEffect(() => {
    loadData();
    ERPService.checkDbHealth().then(setDbHealth);

    const handleStorageUpdate = () => loadData();
    const handleDbUpdate = (e: any) => {
      if (e.detail) setDbHealth(e.detail);
      else ERPService.checkDbHealth().then(setDbHealth);
    };

    window.addEventListener('apex_storage_update', handleStorageUpdate);
    window.addEventListener('apex_db_status_change', handleDbUpdate);

    const interval = setInterval(() => {
      ERPService.checkDbHealth().then(setDbHealth);
    }, 15000);

    return () => {
      window.removeEventListener('apex_storage_update', handleStorageUpdate);
      window.removeEventListener('apex_db_status_change', handleDbUpdate);
      clearInterval(interval);
    };
  }, []);

  const unreadNotifs = notifications.filter((n) => !n.read);

  const handleSwitchMember = (member: User) => {
    ERPService.setCurrentUser(member);
    setCurrentUser(member);
    setShowRoleMenu(false);
  };

  const handleRoleChange = (roleName: string) => {
    const updated = ERPService.setCurrentUserRole(roleName);
    setCurrentUser(updated);
    setShowRoleMenu(false);
  };

  const handleLogout = () => {
    ERPService.logout();
    setShowRoleMenu(false);
    navigate('/login');
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const qLower = q.toLowerCase();
    const matches = jobs.filter(
      (j) =>
        j.id.toLowerCase().includes(qLower) ||
        j.title.toLowerCase().includes(qLower) ||
        j.clientName.toLowerCase().includes(qLower)
    );
    setSearchResults(matches);
    setShowSearchDropdown(true);
  };

  const handleSelectJob = (jobId: string) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    navigate(`/jobs/${jobId}`);
  };

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-4)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="ui-icon-button"
          style={{ display: 'flex' }}
          title="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        {/* Brand in Header for mobile */}
        <div 
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={18} fill="#f59e0b" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
            Apex<span style={{ color: 'var(--color-accent)' }}>ERP</span>
          </span>
        </div>
      </div>

      {/* Global Quick Job Search */}
      <div style={{ position: 'relative', width: 340, maxWidth: '40%' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, color: 'var(--color-gray-400)' }} />
          <input
            type="text"
            placeholder="Search Job ID (e.g. JOB-2026-0001)..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery && setShowSearchDropdown(true)}
            style={{
              width: '100%',
              height: 38,
              paddingLeft: 36,
              paddingRight: 12,
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-strong)',
              fontSize: '0.85rem',
              backgroundColor: '#f8fafc',
            }}
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearchDropdown && (
          <div
            style={{
              position: 'absolute',
              top: 44,
              left: 0,
              right: 0,
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-light)',
              maxHeight: 280,
              overflowY: 'auto',
              zIndex: 200,
            }}
          >
            {searchResults.length === 0 ? (
              <div style={{ padding: 'var(--space-3)', color: 'var(--color-gray-500)', fontSize: '0.85rem' }}>
                No jobs match "{searchQuery}"
              </div>
            ) : (
              searchResults.map((job) => (
                <div
                  key={job.id}
                  onClick={() => handleSelectJob(job.id)}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary)' }}>{job.id}</span>
                    <Badge status={job.status} showIcon={false} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {job.title}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right Action Icons: Role Switcher, Notifications, Demo Reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {/* PostgreSQL Database Live Status */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowDbDropdown(!showDbDropdown)}
            title={dbHealth.connected ? 'PostgreSQL Database Connected' : 'PostgreSQL Database Offline'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${dbHealth.connected ? '#bbf7d0' : '#fecaca'}`,
              backgroundColor: dbHealth.connected ? '#f0fdf4' : '#fef2f2',
              color: dbHealth.connected ? '#166534' : '#991b1b',
              fontSize: '0.75rem',
              fontWeight: 700,
              minHeight: 38,
              cursor: 'pointer',
            }}
          >
            <Database size={15} color={dbHealth.connected ? '#16a34a' : '#dc2626'} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: dbHealth.connected ? '#22c55e' : '#ef4444',
                  boxShadow: dbHealth.connected ? '0 0 6px rgba(34, 197, 94, 0.6)' : 'none',
                }}
              />
              <span>{dbHealth.connected ? 'PostgreSQL' : 'DB Offline'}</span>
            </span>
          </button>

          {showDbDropdown && (
            <div
              style={{
                position: 'absolute',
                top: 44,
                right: 0,
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-modal)',
                border: '1px solid var(--border-light)',
                width: 300,
                zIndex: 200,
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Database size={16} color={dbHealth.connected ? '#16a34a' : '#dc2626'} />
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                    PostgreSQL Database
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    backgroundColor: dbHealth.connected ? '#dcfce7' : '#fee2e2',
                    color: dbHealth.connected ? '#15803d' : '#b91c1c',
                  }}
                >
                  {dbHealth.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: 12, lineHeight: 1.5 }}>
                <div><strong>Database:</strong> {dbHealth.database || 'apex_erp'}</div>
                <div><strong>Port:</strong> {dbHealth.port || 5432}</div>
                {dbHealth.error && (
                  <div style={{ color: '#dc2626', marginTop: 4 }}>
                    ⚠️ {dbHealth.error}
                  </div>
                )}
              </div>

              {dbHealth.counts && (
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    padding: '8px 10px',
                    marginBottom: 12,
                    fontSize: '0.74rem',
                    color: '#334155',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4, color: '#0f172a' }}>Live Table Records:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
                    <div>• Items: <strong>{dbHealth.counts.items ?? 0}</strong></div>
                    <div>• Jobs: <strong>{dbHealth.counts.jobs ?? 0}</strong></div>
                    <div>• Clients: <strong>{dbHealth.counts.clients ?? 0}</strong></div>
                    <div>• Sites: <strong>{dbHealth.counts.client_sites ?? 0}</strong></div>
                    <div>• BOQs: <strong>{dbHealth.counts.boqs ?? 0}</strong></div>
                    <div>• Tasks: <strong>{dbHealth.counts.tasks ?? 0}</strong></div>
                    <div>• Purchases: <strong>{dbHealth.counts.purchases ?? 0}</strong></div>
                    <div>• Stock: <strong>{dbHealth.counts.stock_ledger ?? 0}</strong></div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  type="button"
                  disabled={isSyncingDb}
                  onClick={async () => {
                    setIsSyncingDb(true);
                    await ERPService.syncAllToPostgres();
                    const updated = await ERPService.checkDbHealth();
                    setDbHealth(updated);
                    setIsSyncingDb(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: 6,
                    border: '1px solid #2563eb',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: isSyncingDb ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Push State to PostgreSQL</span>
                </button>

                <button
                  type="button"
                  disabled={isSyncingDb}
                  onClick={async () => {
                    setIsSyncingDb(true);
                    await ERPService.forceReloadFromPostgres();
                    const updated = await ERPService.checkDbHealth();
                    setDbHealth(updated);
                    setIsSyncingDb(false);
                    setShowDbDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: isSyncingDb ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Reload from PostgreSQL</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active User & Role Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              backgroundColor: '#f8fafc',
              color: '#0f172a',
              fontSize: '0.82rem',
              fontWeight: 700,
              minHeight: 38,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 700, lineHeight: 1.2 }}>
                {currentUser.name.split(' ')[0]}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 600 }}>
                {currentUser.role}
              </span>
            </div>
            <ChevronDown size={14} color="#64748b" />
          </button>

          {showRoleMenu && (
            <div
              style={{
                position: 'absolute',
                top: 44,
                right: 0,
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-modal)',
                border: '1px solid var(--border-light)',
                width: 280,
                padding: 'var(--space-2)',
                zIndex: 200,
              }}
            >
              <div
                style={{
                  padding: '6px 8px 4px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: 'var(--color-gray-500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Switch Active Member</span>
                <span style={{ fontSize: '0.66rem', color: '#2563eb' }}>{members.length} Staff</span>
              </div>

              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {members.map((m) => {
                  const isCurrent = currentUser.id === m.id;
                  const roleDef = roles.find((r) => r.id === m.roleId || r.name.toLowerCase() === m.role.toLowerCase());
                  const roleColor = roleDef?.color || '#2563eb';
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSwitchMember(m)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        textAlign: 'left',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: isCurrent ? 700 : 500,
                        backgroundColor: isCurrent ? '#eff6ff' : 'transparent',
                        color: isCurrent ? '#1d4ed8' : '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        border: isCurrent ? '1px solid #bfdbfe' : '1px solid transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            backgroundColor: isCurrent ? '#2563eb' : '#f1f5f9',
                            color: isCurrent ? '#ffffff' : '#334155',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                          }}
                        >
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>{m.name}</div>
                          <div style={{ fontSize: '0.68rem', color: roleColor, fontWeight: 600 }}>
                            {m.role} {m.department ? `· ${m.department}` : ''}
                          </div>
                        </div>
                      </div>
                      {isCurrent && (
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            backgroundColor: '#2563eb',
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border-light)',
                  marginTop: 6,
                  paddingTop: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleMenu(false);
                    navigate('/members');
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 4,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    color: '#0f172a',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <ShieldCheck size={14} color="#2563eb" />
                  <span>Manage Members & Roles Matrix →</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 4,
                    border: '1px solid #fecaca',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <LogOut size={13} color="#dc2626" />
                  <span>Log Out of Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="ui-icon-button"
            title="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {unreadNotifs.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-danger)',
                  border: '2px solid #ffffff',
                }}
              />
            )}
          </button>

          {showNotifDropdown && (
            <div
              style={{
                position: 'absolute',
                top: 44,
                right: 0,
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-modal)',
                border: '1px solid var(--border-light)',
                width: 320,
                zIndex: 200,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                  Notifications ({unreadNotifs.length})
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                  Auto-updated
                </span>
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-gray-500)', fontSize: '0.85rem' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        ERPService.markNotificationRead(n.id);
                        if (n.link) navigate(n.link);
                        setShowNotifDropdown(false);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: n.read ? '#ffffff' : '#f0f9ff',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                          {n.title}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-gray-400)' }}>{n.timestamp}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-600)', margin: 0, lineHeight: 1.4 }}>
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reset Demo Data Button */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset all ERP data to initial factory demo? Any changes you made will be reloaded.')) {
              ERPService.resetToFactoryDemo();
            }
          }}
          className="ui-icon-button"
          title="Reset Demo Data"
          style={{ color: 'var(--color-gray-500)' }}
        >
          <RotateCcw size={16} />
        </button>

        {/* Quick Log Out Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="ui-icon-button"
          title="Sign Out / Log Out"
          style={{ color: '#ef4444', marginLeft: 2 }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};
