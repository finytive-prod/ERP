import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Briefcase,
  KeyRound,
  Check,
  Edit2,
  Trash2,
  Zap,
  Lock,
  Unlock,
  Info,
  MapPin,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { ERPService } from '../../services/erpStorage';
import { usePermissions } from '../../services/usePermissions';
import { DEFAULT_USER_PASSWORD } from '../../services/mockData';
import {
  User,
  RoleDefinition,
  PrivilegeDefinition,
  PrivilegeCategory,
  ClientSite,
} from '../../types';
import {
  PageHeader,
  Button,
  DataTable,
  Badge,
  Modal,
  Input,
  Select,
  Tabs,
  Card,
  StatCard,
  useToast,
} from '../../components/ui';

export const MembersView: React.FC = () => {
  const { showToast } = useToast();
  const {
    currentUser,
    roles,
    isAdmin,
    hasPermission,
    switchUser,
    allPrivileges,
  } = usePermissions();

  const [members, setMembers] = useState<User[]>([]);
  const [clientSites, setClientSites] = useState<ClientSite[]>([]);
  const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'matrix'>('members');

  // Filters for Members
  const [searchMember, setSearchMember] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Member Modal State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    password: DEFAULT_USER_PASSWORD,
    phone: '',
    roleId: '',
    department: 'Site Operations' as User['department'],
    designation: '',
    status: 'Active' as User['status'],
    assignedSiteIds: [] as string[],
  });

  // Role Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    color: '#0284c7',
    permissions: [] as string[],
  });

  // Selected Role for Matrix Tab
  const [matrixSelectedRoleId, setMatrixSelectedRoleId] = useState<string>('role-site-engineer');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const loadData = () => {
    setMembers(ERPService.getMembers());
    setClientSites(ERPService.getClientSites());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('apex_storage_update', loadData);
    return () => window.removeEventListener('apex_storage_update', loadData);
  }, []);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (filterRole !== 'ALL' && m.role !== filterRole && m.roleId !== filterRole) return false;
      if (filterDept !== 'ALL' && m.department !== filterDept) return false;
      if (filterStatus !== 'ALL' && m.status !== filterStatus) return false;
      if (searchMember.trim()) {
        const q = searchMember.toLowerCase();
        const matchName = m.name.toLowerCase().includes(q);
        const matchEmail = m.email.toLowerCase().includes(q);
        const matchPhone = m.phone.toLowerCase().includes(q);
        const matchRole = m.role.toLowerCase().includes(q);
        const matchDesig = (m.designation || '').toLowerCase().includes(q);
        return matchName || matchEmail || matchPhone || matchRole || matchDesig;
      }
      return true;
    });
  }, [members, searchMember, filterRole, filterDept, filterStatus]);

  // Statistics
  const activeCount = members.filter((m) => m.status === 'Active').length;
  const siteStaffCount = members.filter(
    (m) => m.role.toLowerCase().includes('site') || m.department === 'Site Operations'
  ).length;

  // Handler: Open Add Member Modal
  const handleOpenAddMember = () => {
    setEditingMember(null);
    setMemberForm({
      name: '',
      email: '',
      password: DEFAULT_USER_PASSWORD,
      phone: '',
      roleId: roles[0]?.id || 'role-site-supervisor',
      department: 'Site Operations',
      designation: '',
      status: 'Active',
      assignedSiteIds: [],
    });
    setIsMemberModalOpen(true);
  };

  // Handler: Open Edit Member Modal
  const handleOpenEditMember = (member: User) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      email: member.email,
      password: member.password || DEFAULT_USER_PASSWORD,
      phone: member.phone,
      roleId: member.roleId || roles.find((r) => r.name.toLowerCase() === member.role.toLowerCase())?.id || roles[0]?.id || '',
      department: member.department || 'Site Operations',
      designation: member.designation || '',
      status: member.status || 'Active',
      assignedSiteIds: member.assignedSiteIds || [],
    });
    setIsMemberModalOpen(true);
  };

  // Handler: Reset Password
  const handleResetPassword = (member: User) => {
    try {
      ERPService.updateMember(member.id, { password: DEFAULT_USER_PASSWORD });
      showToast('Password Reset', `Password for ${member.name} reset to default: "${DEFAULT_USER_PASSWORD}".`, 'success');
    } catch (err: any) {
      showToast('Action Failed', err.message, 'danger');
    }
  };

  // Handler: Save Member
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim()) {
      showToast('Validation Error', 'Member name is required.', 'danger');
      return;
    }
    if (!memberForm.email.trim()) {
      showToast('Validation Error', 'Email address is required.', 'danger');
      return;
    }

    const matchedRole = roles.find((r) => r.id === memberForm.roleId);
    const assignedSiteNames = clientSites
      .filter((s) => memberForm.assignedSiteIds.includes(s.id))
      .map((s) => s.siteName);

    if (editingMember) {
      ERPService.updateMember(editingMember.id, {
        name: memberForm.name.trim(),
        email: memberForm.email.trim(),
        password: memberForm.password.trim() || DEFAULT_USER_PASSWORD,
        phone: memberForm.phone.trim(),
        roleId: memberForm.roleId,
        role: matchedRole ? matchedRole.name : 'Site Staff',
        department: memberForm.department,
        designation: memberForm.designation.trim(),
        status: memberForm.status,
        assignedSiteIds: memberForm.assignedSiteIds,
        assignedSiteNames,
      });
      showToast('Member Updated', `Successfully updated profile for ${memberForm.name}.`, 'success');
    } else {
      ERPService.addMember({
        name: memberForm.name.trim(),
        email: memberForm.email.trim(),
        password: memberForm.password.trim() || DEFAULT_USER_PASSWORD,
        phone: memberForm.phone.trim(),
        roleId: memberForm.roleId,
        role: matchedRole ? matchedRole.name : 'Site Staff',
        department: memberForm.department,
        designation: memberForm.designation.trim(),
        status: memberForm.status,
        assignedSiteIds: memberForm.assignedSiteIds,
        assignedSiteNames,
      });
      showToast('Member Created', `Added ${memberForm.name} to team with role "${matchedRole?.name}".`, 'success');
    }

    setIsMemberModalOpen(false);
  };

  // Handler: Toggle Member Active/Inactive
  const handleToggleStatus = (member: User) => {
    const nextStatus = member.status === 'Active' ? 'Inactive' : 'Active';
    try {
      ERPService.updateMember(member.id, { status: nextStatus });
      showToast('Status Updated', `${member.name} marked as ${nextStatus}.`, 'info');
    } catch (err: any) {
      showToast('Action Failed', err.message, 'danger');
    }
  };

  // Handler: Delete Member
  const handleDeleteMember = (member: User) => {
    if (!window.confirm(`Are you sure you want to remove team member "${member.name}"?`)) return;
    try {
      ERPService.deleteMember(member.id);
      showToast('Member Removed', `${member.name} has been removed from organization.`, 'warning');
    } catch (err: any) {
      showToast('Cannot Remove Member', err.message, 'danger');
    }
  };

  // Handler: Open Add Role Modal
  const handleOpenAddRole = () => {
    setEditingRole(null);
    setRoleForm({
      name: '',
      description: '',
      color: '#0284c7',
      permissions: ['jobs.view', 'sites.view'],
    });
    setIsRoleModalOpen(true);
  };

  // Handler: Open Edit Role Modal
  const handleOpenEditRole = (role: RoleDefinition) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      color: role.color || '#0284c7',
      permissions: [...role.permissions],
    });
    setIsRoleModalOpen(true);
  };

  // Handler: Save Role
  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      showToast('Validation Error', 'Role name is required.', 'danger');
      return;
    }

    if (editingRole) {
      ERPService.updateRole(editingRole.id, {
        name: roleForm.name.trim(),
        description: roleForm.description.trim(),
        color: roleForm.color,
        permissions: roleForm.permissions,
      });
      showToast('Role Updated', `Privileges for "${roleForm.name}" updated.`, 'success');
    } else {
      ERPService.addRole({
        name: roleForm.name.trim(),
        description: roleForm.description.trim(),
        color: roleForm.color,
        permissions: roleForm.permissions,
      });
      showToast('Role Created', `Custom role "${roleForm.name}" configured with ${roleForm.permissions.length} privileges.`, 'success');
    }

    setIsRoleModalOpen(false);
  };

  // Handler: Delete Role
  const handleDeleteRole = (role: RoleDefinition) => {
    if (!window.confirm(`Are you sure you want to delete role "${role.name}"?`)) return;
    try {
      ERPService.deleteRole(role.id);
      showToast('Role Deleted', `Role "${role.name}" removed.`, 'warning');
    } catch (err: any) {
      showToast('Cannot Delete Role', err.message, 'danger');
    }
  };

  // Toggle single permission for matrix view
  const handleToggleMatrixPermission = (roleId: string, permKey: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    if (role.name.toLowerCase() === 'admin') {
      showToast('Protected Role', 'Admin role retains full system permissions.', 'info');
      return;
    }

    const exists = role.permissions.includes(permKey);
    const updatedPerms = exists
      ? role.permissions.filter((p) => p !== permKey)
      : [...role.permissions, permKey];

    ERPService.updateRole(role.id, { permissions: updatedPerms });
    showToast('Privilege Toggled', `${exists ? 'Removed' : 'Granted'} "${permKey}" for ${role.name}.`, 'success');
  };

  // Bulk Category Toggle for role modal
  const handleToggleCategoryInModal = (cat: PrivilegeCategory) => {
    const catKeys = allPrivileges.filter((p) => p.category === cat).map((p) => p.key);
    const allSelected = catKeys.every((k) => roleForm.permissions.includes(k));
    if (allSelected) {
      setRoleForm((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((k) => !catKeys.includes(k)),
      }));
    } else {
      setRoleForm((prev) => ({
        ...prev,
        permissions: Array.from(new Set([...prev.permissions, ...catKeys])),
      }));
    }
  };

  // Privilege categories
  const categories: PrivilegeCategory[] = [
    'Projects',
    'BOQ',
    'Procurement',
    'Sites',
    'Inventory',
    'Labour',
    'Partners',
    'Finance',
    'Governance',
  ];

  const selectedMatrixRole = roles.find((r) => r.id === matrixSelectedRoleId) || roles[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <PageHeader
        title="Team Members & Role Privilege Access Control"
        subtitle="Manage organization staff, allocate project sites, and configure granular privilege matrices for every ERP feature."
        icon={<ShieldCheck size={22} />}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              icon={<KeyRound size={16} />}
              onClick={handleOpenAddRole}
            >
              + Create Custom Role
            </Button>
            <Button
              variant="accent"
              icon={<Plus size={16} />}
              onClick={handleOpenAddMember}
            >
              + Add Team Member
            </Button>
          </div>
        }
      />

      {/* Top Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <StatCard
          label="Total Team Members"
          value={members.length}
          meta={<span>{activeCount} Active · {members.length - activeCount} Inactive</span>}
          icon={<Users size={20} />}
        />
        <StatCard
          label="Roles Configured"
          value={roles.length}
          meta={<span>{roles.filter((r) => r.isSystem).length} System Built-in · {roles.filter((r) => !r.isSystem).length} Custom</span>}
          icon={<KeyRound size={20} />}
        />
        <StatCard
          label="Site Heads & Field Staff"
          value={siteStaffCount}
          meta={<span>Assigned across project site stores</span>}
          icon={<Building2 size={20} />}
        />
        <div
          className="ui-card"
          style={{
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', fontWeight: 700 }}>
              Your Active Session
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.68rem',
                padding: '2px 6px',
                borderRadius: 4,
                backgroundColor: '#22c55e20',
                color: '#4ade80',
                fontWeight: 700,
              }}
            >
              <Zap size={11} /> Live Access
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                {currentUser.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '1px 6px',
                    borderRadius: 3,
                    backgroundColor: '#334155',
                    color: '#93c5fd',
                    fontWeight: 700,
                  }}
                >
                  {currentUser.role}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {isAdmin ? 'Full Unrestricted Access' : `${ERPService.getUserPermissions(currentUser).length} privileges`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
        tabs={[
          { id: 'members', label: `1. Team Members Directory (${filteredMembers.length})`, icon: <Users size={16} /> },
          { id: 'roles', label: `2. Roles & Definitions (${roles.length})`, icon: <KeyRound size={16} /> },
          { id: 'matrix', label: '3. Live Privilege Matrix & Access Enforcement', icon: <ShieldCheck size={16} /> },
        ]}
      />

      {/* ========================================================================= */}
      {/* TAB 1: MEMBERS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'members' && (
        <div className="ui-card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Default Password Policy Banner */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <KeyRound size={16} />
              </div>
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e3a8a' }}>
                  Default Staff Login Password: <code style={{ backgroundColor: '#dbeafe', padding: '1px 6px', borderRadius: 4, color: '#1d4ed8' }}>{DEFAULT_USER_PASSWORD}</code>
                </span>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#3b82f6' }}>
                  All registered team members can log in using their work email and this default password at <strong style={{ color: '#1e40af' }}>/login</strong>.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 600 }}>
                🔑 Click the key icon on any row to reset that user to default password.
              </span>
            </div>
          </div>

          {/* Filters Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 'var(--space-4)',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <div style={{ position: 'relative', minWidth: 260, flex: 1 }}>
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                placeholder="Search staff by name, email, phone, role..."
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  borderRadius: 6,
                  border: '1px solid var(--border-light)',
                  fontSize: '0.82rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-light)',
                  fontSize: '0.8rem',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="ALL">All Roles ({roles.length})</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>

              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-light)',
                  fontSize: '0.8rem',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="ALL">All Departments</option>
                <option value="Management">Management</option>
                <option value="Engineering">Engineering</option>
                <option value="Site Operations">Site Operations</option>
                <option value="Procurement">Procurement</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Accounts">Accounts</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-light)',
                  fontSize: '0.8rem',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="ALL">All Status</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <DataTable
            data={filteredMembers}
            keyExtractor={(m) => m.id}
            columns={[
              {
                key: 'member',
                header: 'Team Member',
                render: (m: User) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        color: '#0f172a',
                      }}
                    >
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        {m.name}
                        {m.id === currentUser.id && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: '0.66rem',
                              padding: '1px 5px',
                              borderRadius: 3,
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              fontWeight: 700,
                            }}
                          >
                            YOU
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {m.designation || m.department || 'Field Staff'} · {m.email}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'role',
                header: 'Assigned Role',
                render: (m: User) => {
                  const roleDef = roles.find((r) => r.id === m.roleId || r.name.toLowerCase() === m.role.toLowerCase());
                  const color = roleDef?.color || '#0284c7';
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 4,
                          backgroundColor: `${color}15`,
                          color: color,
                          border: `1px solid ${color}40`,
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          width: 'fit-content',
                        }}
                      >
                        <KeyRound size={12} />
                        {m.role}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {m.department}
                      </span>
                    </div>
                  );
                },
              },
              {
                key: 'sites',
                header: 'Assigned Project Sites',
                render: (m: User) => {
                  const siteNames = m.assignedSiteNames || [];
                  if (siteNames.length === 0) {
                    return <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>All Workspaces / HQ</span>;
                  }
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 220 }}>
                      {siteNames.slice(0, 2).map((site: string, i: number) => (
                        <span
                          key={i}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: '0.71rem',
                            padding: '2px 6px',
                            borderRadius: 3,
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: '#334155',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          <Building2 size={11} color="#64748b" />
                          {site}
                        </span>
                      ))}
                      {siteNames.length > 2 && (
                        <span style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 600 }}>
                          +{siteNames.length - 2} more sites
                        </span>
                      )}
                    </div>
                  );
                },
              },
              {
                key: 'phone',
                header: 'Phone',
                render: (m: User) => (
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {m.phone || '—'}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (m: User) => (
                  <Badge status={m.status} />
                ),
              },
              {
                key: 'actions',
                header: 'Actions & Switch User',
                render: (m: User) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* Instant User Switcher button */}
                    <button
                      onClick={() => {
                        switchUser(m);
                        showToast('Switched Active User', `Now viewing system as ${m.name} (${m.role}). Permissions updated!`, 'info');
                      }}
                      disabled={m.id === currentUser.id}
                      title={`Switch to ${m.name} view`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '4px 8px',
                        borderRadius: 4,
                        border: m.id === currentUser.id ? '1px solid #94a3b8' : '1px solid #2563eb',
                        backgroundColor: m.id === currentUser.id ? '#f1f5f9' : '#eff6ff',
                        color: m.id === currentUser.id ? '#64748b' : '#2563eb',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: m.id === currentUser.id ? 'default' : 'pointer',
                      }}
                    >
                      <Zap size={12} />
                      {m.id === currentUser.id ? 'Current' : 'Switch'}
                    </button>

                    <button
                      onClick={() => handleOpenEditMember(m)}
                      title="Edit member details & role"
                      style={{
                        padding: '4px 6px',
                        borderRadius: 4,
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        color: '#334155',
                      }}
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      onClick={() => handleResetPassword(m)}
                      title={`Reset password to default (${DEFAULT_USER_PASSWORD})`}
                      style={{
                        padding: '4px 6px',
                        borderRadius: 4,
                        border: '1px solid #bfdbfe',
                        backgroundColor: '#eff6ff',
                        cursor: 'pointer',
                        color: '#2563eb',
                      }}
                    >
                      <KeyRound size={13} />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(m)}
                      title={m.status === 'Active' ? 'Deactivate member' : 'Activate member'}
                      style={{
                        padding: '4px 6px',
                        borderRadius: 4,
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        color: m.status === 'Active' ? '#d97706' : '#16a34a',
                      }}
                    >
                      {m.status === 'Active' ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                    </button>

                    <button
                      onClick={() => handleDeleteMember(m)}
                      title="Delete member"
                      style={{
                        padding: '4px 6px',
                        borderRadius: 4,
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        color: '#dc2626',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ROLES & DEFINITIONS */}
      {/* ========================================================================= */}
      {activeTab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {roles.map((role) => {
              const assignedMembers = members.filter(
                (m) => m.roleId === role.id || m.role.toLowerCase() === role.name.toLowerCase()
              );
              return (
                <div
                  key={role.id}
                  className="ui-card"
                  style={{
                    padding: 'var(--space-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-3)',
                    borderLeft: `4px solid ${role.color || '#0284c7'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: role.color || '#0284c7',
                        }}
                      />
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {role.name}
                      </span>
                      {role.isSystem && (
                        <span
                          style={{
                            fontSize: '0.64rem',
                            padding: '1px 5px',
                            borderRadius: 3,
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            fontWeight: 700,
                          }}
                        >
                          SYSTEM
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => handleOpenEditRole(role)}
                        title="Edit role privileges"
                        style={{
                          padding: '3px 6px',
                          borderRadius: 4,
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                          color: '#334155',
                        }}
                      >
                        <Edit2 size={13} />
                      </button>
                      {!role.isSystem && (
                        <button
                          onClick={() => handleDeleteRole(role)}
                          title="Delete custom role"
                          style={{
                            padding: '3px 6px',
                            borderRadius: 4,
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            cursor: 'pointer',
                            color: '#dc2626',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, minHeight: 34 }}>
                    {role.description}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 6,
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.74rem',
                    }}
                  >
                    <span style={{ color: '#475569' }}>
                      <strong>{role.permissions.length}</strong> Granted Privileges
                    </span>
                    <span style={{ color: '#2563eb', fontWeight: 600 }}>
                      {assignedMembers.length} Active Member(s)
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {role.permissions.slice(0, 6).map((perm) => (
                      <span
                        key={perm}
                        style={{
                          fontSize: '0.68rem',
                          padding: '1px 6px',
                          borderRadius: 3,
                          backgroundColor: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        {perm}
                      </span>
                    ))}
                    {role.permissions.length > 6 && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                        +{role.permissions.length - 6} more
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
                    <button
                      onClick={() => {
                        setMatrixSelectedRoleId(role.id);
                        setActiveTab('matrix');
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: 5,
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#0f172a',
                        fontWeight: 700,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      <span>Configure Privilege Matrix</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LIVE PRIVILEGE MATRIX & ACCESS ENFORCEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="ui-card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Role Header Banner */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-4)',
              borderRadius: 8,
              backgroundColor: '#f8fafc',
              border: `1px solid #cbd5e1`,
              borderLeft: `5px solid ${selectedMatrixRole.color || '#2563eb'}`,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  Role Matrix: {selectedMatrixRole.name}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: 4,
                    backgroundColor: `${selectedMatrixRole.color || '#2563eb'}20`,
                    color: selectedMatrixRole.color || '#2563eb',
                    fontWeight: 700,
                  }}
                >
                  {selectedMatrixRole.permissions.length} Privileges Active
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                {selectedMatrixRole.description}
              </p>
            </div>

            {/* Role Switcher in Matrix */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#475569' }}>Inspect Role:</span>
              <select
                value={matrixSelectedRoleId}
                onChange={(e) => setMatrixSelectedRoleId(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  backgroundColor: '#ffffff',
                }}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.permissions.length} perms)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', marginRight: 4 }}>
              Filter Module:
            </span>
            <button
              onClick={() => setCategoryFilter('ALL')}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                border: categoryFilter === 'ALL' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                backgroundColor: categoryFilter === 'ALL' ? '#eff6ff' : '#ffffff',
                color: categoryFilter === 'ALL' ? '#1d4ed8' : '#334155',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              All Modules ({allPrivileges.length})
            </button>
            {categories.map((cat) => {
              const count = allPrivileges.filter((p) => p.category === cat).length;
              const isSel = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: isSel ? '1px solid #2563eb' : '1px solid #cbd5e1',
                    backgroundColor: isSel ? '#eff6ff' : '#ffffff',
                    color: isSel ? '#1d4ed8' : '#334155',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Matrix Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 6 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', width: '22%' }}>Feature Module</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', width: '28%' }}>Privilege Action</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', width: '35%' }}>Scope & Description</th>
                  <th style={{ textAlign: 'center', padding: '10px 14px', width: '15%' }}>
                    {selectedMatrixRole.name} Access
                  </th>
                </tr>
              </thead>
              <tbody>
                {allPrivileges
                  .filter((p) => categoryFilter === 'ALL' || p.category === categoryFilter)
                  .map((priv, idx) => {
                    const isGranted =
                      selectedMatrixRole.name.toLowerCase() === 'admin' ||
                      selectedMatrixRole.permissions.includes(priv.key);
                    return (
                      <tr
                        key={priv.key}
                        style={{
                          borderBottom: '1px solid var(--border-light)',
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        }}
                      >
                        <td style={{ padding: '8px 14px', fontWeight: 600, color: '#334155' }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 6px',
                              borderRadius: 3,
                              backgroundColor: '#e2e8f0',
                              color: '#0f172a',
                              fontWeight: 700,
                            }}
                          >
                            {priv.category}
                          </span>
                        </td>
                        <td style={{ padding: '8px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{priv.label}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                            {priv.key}
                          </div>
                        </td>
                        <td style={{ padding: '8px 14px', color: '#475569', fontSize: '0.75rem' }}>
                          {priv.description}
                        </td>
                        <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleToggleMatrixPermission(selectedMatrixRole.id, priv.key)}
                            disabled={selectedMatrixRole.name.toLowerCase() === 'admin'}
                            title={
                              selectedMatrixRole.name.toLowerCase() === 'admin'
                                ? 'Admin has all permissions by default'
                                : `Click to ${isGranted ? 'revoke' : 'grant'} ${priv.label}`
                            }
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              padding: '4px 10px',
                              borderRadius: 4,
                              border: isGranted ? '1px solid #16a34a' : '1px solid #cbd5e1',
                              backgroundColor: isGranted ? '#f0fdf4' : '#ffffff',
                              color: isGranted ? '#15803d' : '#64748b',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: selectedMatrixRole.name.toLowerCase() === 'admin' ? 'not-allowed' : 'pointer',
                              minWidth: 85,
                            }}
                          >
                            {isGranted ? (
                              <>
                                <Check size={12} strokeWidth={3} />
                                <span>Granted</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={12} />
                                <span>Denied</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT TEAM MEMBER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        title={editingMember ? `Edit Member: ${editingMember.name}` : 'Register New Team Member'}
        maxWidth="600px"
      >
        <form onSubmit={handleSaveMember} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Input
              label="Full Name *"
              value={memberForm.name}
              onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
              placeholder="e.g. Kavitha Ramanathan"
              required
            />
            <Input
              label="Email Address *"
              type="email"
              value={memberForm.email}
              onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
              placeholder="e.g. kavitha@apex.in"
              required
            />
          </div>

          {/* Password Credentials Section */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                Account Login Password
              </label>
              <button
                type="button"
                onClick={() => setMemberForm({ ...memberForm, password: DEFAULT_USER_PASSWORD })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Reset to default ({DEFAULT_USER_PASSWORD})
              </button>
            </div>
            <Input
              value={memberForm.password}
              onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })}
              placeholder="e.g. apex@123"
              required
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Default staff password is <code style={{ color: '#2563eb', fontWeight: 700 }}>{DEFAULT_USER_PASSWORD}</code>. The member can use this to sign into the ERP.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Input
              label="Phone Number"
              value={memberForm.phone}
              onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
              placeholder="+91 98401 22334"
            />
            <Input
              label="Designation / Title"
              value={memberForm.designation}
              onChange={(e) => setMemberForm({ ...memberForm, designation: e.target.value })}
              placeholder="e.g. Senior Electrical Site Engineer"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4 }}>
                Access Role *
              </label>
              <select
                value={memberForm.roleId}
                onChange={(e) => setMemberForm({ ...memberForm, roleId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-light)',
                  fontSize: '0.82rem',
                }}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.permissions.length} privileges)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4 }}>
                Department
              </label>
              <select
                value={memberForm.department}
                onChange={(e) => setMemberForm({ ...memberForm, department: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-light)',
                  fontSize: '0.82rem',
                }}
              >
                <option value="Management">Management</option>
                <option value="Engineering">Engineering</option>
                <option value="Site Operations">Site Operations</option>
                <option value="Procurement">Procurement</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Accounts">Accounts</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4 }}>
              Account Status
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="status"
                  checked={memberForm.status === 'Active'}
                  onChange={() => setMemberForm({ ...memberForm, status: 'Active' })}
                />
                <span style={{ color: '#16a34a', fontWeight: 700 }}>Active (Can login & access features)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="status"
                  checked={memberForm.status === 'Inactive'}
                  onChange={() => setMemberForm({ ...memberForm, status: 'Inactive' })}
                />
                <span style={{ color: '#64748b', fontWeight: 700 }}>Inactive (Locked)</span>
              </label>
            </div>
          </div>

          {/* Assigned Client Sites Multiselect */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 'var(--space-3)' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4 }}>
              Assigned Project Sites & Workspaces ({memberForm.assignedSiteIds.length} selected)
            </label>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Site Engineers and Supervisors assigned here will manage on-site stock, GRN inward checks, and worker attendance for these specific locations.
            </p>
            <div
              style={{
                maxHeight: 140,
                overflowY: 'auto',
                border: '1px solid var(--border-light)',
                borderRadius: 6,
                padding: '6px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                backgroundColor: '#f8fafc',
              }}
            >
              {clientSites.map((site) => {
                const isChecked = memberForm.assignedSiteIds.includes(site.id);
                return (
                  <label
                    key={site.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      padding: '3px 4px',
                      borderRadius: 4,
                      backgroundColor: isChecked ? '#eff6ff' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMemberForm({
                            ...memberForm,
                            assignedSiteIds: [...memberForm.assignedSiteIds, site.id],
                          });
                        } else {
                          setMemberForm({
                            ...memberForm,
                            assignedSiteIds: memberForm.assignedSiteIds.filter((id) => id !== site.id),
                          });
                        }
                      }}
                    />
                    <div>
                      <strong>{site.siteName}</strong>
                      <span style={{ marginLeft: 6, color: '#64748b' }}>({site.clientName})</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              borderTop: '1px solid var(--border-light)',
              paddingTop: 'var(--space-3)',
            }}
          >
            <Button variant="secondary" type="button" onClick={() => setIsMemberModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" type="submit">
              {editingMember ? 'Save Changes' : 'Create Member'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT CUSTOM ROLE */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={editingRole ? `Configure Role: ${editingRole.name}` : 'Create New Custom Role'}
        maxWidth="680px"
      >
        <form onSubmit={handleSaveRole} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)' }}>
            <Input
              label="Role Name *"
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              placeholder="e.g. Electrical Quality Inspector"
              required
            />
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4 }}>
                Role Color Theme
              </label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="color"
                  value={roleForm.color}
                  onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                  style={{ width: 36, height: 32, borderRadius: 4, cursor: 'pointer', border: '1px solid #cbd5e1' }}
                />
                <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: '#475569' }}>
                  {roleForm.color}
                </span>
              </div>
            </div>
          </div>

          <Input
            label="Role Description"
            value={roleForm.description}
            onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
            placeholder="Brief scope of responsibilities and privileges..."
          />

          {/* Privilege Selector */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                Select Privileges ({roleForm.permissions.length} of {allPrivileges.length} enabled)
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setRoleForm({ ...roleForm, permissions: allPrivileges.map((p) => p.key) })}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 3,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.7rem',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setRoleForm({ ...roleForm, permissions: [] })}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 3,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.7rem',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>

            <div
              style={{
                maxHeight: 280,
                overflowY: 'auto',
                border: '1px solid var(--border-light)',
                borderRadius: 6,
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                backgroundColor: '#f8fafc',
              }}
            >
              {categories.map((cat) => {
                const catPrivs = allPrivileges.filter((p) => p.category === cat);
                const allCatChecked = catPrivs.every((p) => roleForm.permissions.includes(p.key));
                return (
                  <div key={cat} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#1e293b' }}>
                        {cat}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleCategoryInModal(cat)}
                        style={{
                          fontSize: '0.68rem',
                          color: '#2563eb',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {allCatChecked ? 'Deselect Category' : 'Select Category'}
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {catPrivs.map((priv) => {
                        const checked = roleForm.permissions.includes(priv.key);
                        return (
                          <label
                            key={priv.key}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 6,
                              fontSize: '0.74rem',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              borderRadius: 4,
                              backgroundColor: checked ? '#eff6ff' : 'transparent',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRoleForm({
                                    ...roleForm,
                                    permissions: [...roleForm.permissions, priv.key],
                                  });
                                } else {
                                  setRoleForm({
                                    ...roleForm,
                                    permissions: roleForm.permissions.filter((k) => k !== priv.key),
                                  });
                                }
                              }}
                              style={{ marginTop: 2 }}
                            />
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{priv.label}</div>
                              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{priv.description}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              borderTop: '1px solid var(--border-light)',
              paddingTop: 'var(--space-3)',
            }}
          >
            <Button variant="secondary" type="button" onClick={() => setIsRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" type="submit">
              {editingRole ? 'Save Privileges' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
