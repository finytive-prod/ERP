import {
  User,
  UserRole,
  Job,
  Client,
  Vendor,
  ItemMaster,
  BOQVersion,
  PurchaseOrder,
  LocationMaster,
  StockLedgerItem,
  StockMovement,
  SiteTask,
  TaskAllocatedMaterial,
  TaskMemberAssignment,
  MaterialRequest,
  Employee,
  AttendanceRecord,
  ExpenseRecord,
  PettyCashAccount,
  ClientInvoice,
  ClientPayment,
  DynamicCostType,
  PriceHistoryRecord,
  AuditLogEntry,
  AppNotification,
  MeasurementUnit,
  ProcurableBOQItem,
  ClientSite,
  PrivilegeDefinition,
  RoleDefinition,
} from '../types';

import {
  INITIAL_USERS,
  INITIAL_CLIENTS,
  INITIAL_CLIENT_SITES,
  INITIAL_VENDORS,
  INITIAL_ITEMS,
  INITIAL_LOCATIONS,
  INITIAL_EMPLOYEES,
  INITIAL_COST_TYPES,
  INITIAL_JOBS,
  INITIAL_BOQS,
  INITIAL_PURCHASES,
  INITIAL_STOCK_LEDGER,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_TASKS,
  INITIAL_MATERIAL_REQUESTS,
  INITIAL_ATTENDANCE,
  INITIAL_EXPENSES,
  INITIAL_PETTY_CASH,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_PRICE_HISTORY,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  SYSTEM_PRIVILEGES,
  INITIAL_ROLES,
  DEFAULT_USER_PASSWORD,
} from './mockData';

// LocalStorage Keys
const KEYS = {
  CURRENT_USER: 'apex_erp_current_user',
  AUTH_SESSION: 'apex_erp_auth_session',
  MEMBERS: 'apex_erp_members',
  ROLES: 'apex_erp_roles',
  JOBS: 'apex_erp_jobs',
  CLIENTS: 'apex_erp_clients',
  CLIENT_SITES: 'apex_erp_client_sites',
  VENDORS: 'apex_erp_vendors',
  ITEMS: 'apex_erp_items',
  LOCATIONS: 'apex_erp_locations',
  EMPLOYEES: 'apex_erp_employees',
  COST_TYPES: 'apex_erp_cost_types',
  BOQS: 'apex_erp_boqs',
  PURCHASES: 'apex_erp_purchases',
  STOCK_LEDGER: 'apex_erp_stock_ledger',
  STOCK_MOVEMENTS: 'apex_erp_stock_movements',
  TASKS: 'apex_erp_tasks',
  MATERIAL_REQUESTS: 'apex_erp_material_requests',
  ATTENDANCE: 'apex_erp_attendance',
  EXPENSES: 'apex_erp_expenses',
  PETTY_CASH: 'apex_erp_petty_cash',
  INVOICES: 'apex_erp_invoices',
  PAYMENTS: 'apex_erp_payments',
  PRICE_HISTORY: 'apex_erp_price_history',
  AUDIT_LOGS: 'apex_erp_audit_logs',
  NOTIFICATIONS: 'apex_erp_notifications',
};

// Safe local storage helpers
function getStored<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.warn(`Error reading localStorage key ${key}`, e);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Asynchronously sync directly to PostgreSQL
    fetch(`/api/data/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    }).catch((err) => console.warn('PostgreSQL sync error:', err));
    // Dispatch custom event so reactive components can subscribe
    window.dispatchEvent(new Event('apex_storage_update'));
  } catch (e) {
    console.error(`Error saving localStorage key ${key}`, e);
  }
}

// Initial Sync from PostgreSQL database on app load
export const initPostgresSync = async () => {
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const allData = await res.json();
      Object.entries(allData).forEach(([key, val]) => {
        localStorage.setItem(key, JSON.stringify(val));
      });
      window.dispatchEvent(new Event('apex_storage_update'));
    }
  } catch (err) {
    console.warn('PostgreSQL connection check failed, using local copy:', err);
  }
};

export const ERPService = {
  // Clear all mock data and reset to fresh clean PostgreSQL database
  clearAllData: async () => {
    try {
      await fetch('/api/clear-all', { method: 'POST' });
    } catch (e) {
      console.warn('PostgreSQL clear-all error:', e);
    }
    localStorage.clear();
    setStored(KEYS.CURRENT_USER, INITIAL_USERS[0]);
    setStored(KEYS.MEMBERS, INITIAL_USERS);
    setStored(KEYS.ROLES, INITIAL_ROLES);
    setStored(KEYS.JOBS, []);
    setStored(KEYS.CLIENTS, []);
    setStored(KEYS.VENDORS, []);
    setStored(KEYS.ITEMS, []);
    setStored(KEYS.LOCATIONS, INITIAL_LOCATIONS);
    setStored(KEYS.EMPLOYEES, []);
    setStored(KEYS.COST_TYPES, INITIAL_COST_TYPES);
    setStored(KEYS.BOQS, []);
    setStored(KEYS.PURCHASES, []);
    setStored(KEYS.STOCK_LEDGER, []);
    setStored(KEYS.STOCK_MOVEMENTS, []);
    setStored(KEYS.TASKS, []);
    setStored(KEYS.MATERIAL_REQUESTS, []);
    setStored(KEYS.ATTENDANCE, []);
    setStored(KEYS.EXPENSES, []);
    setStored(KEYS.PETTY_CASH, []);
    setStored(KEYS.INVOICES, []);
    setStored(KEYS.PAYMENTS, []);
    setStored(KEYS.PRICE_HISTORY, []);
    setStored(KEYS.AUDIT_LOGS, []);
    setStored(KEYS.NOTIFICATIONS, []);
    window.location.reload();
  },
  resetToFactoryDemo: () => {
    ERPService.clearAllData();
  },

  // Authentication & Session
  getDefaultPassword: (): string => {
    return DEFAULT_USER_PASSWORD;
  },

  isAuthenticated: (): boolean => {
    const session = localStorage.getItem(KEYS.AUTH_SESSION);
    if (session === null) {
      localStorage.setItem(KEYS.AUTH_SESSION, 'true');
      return true;
    }
    return session === 'true';
  },

  login: (email: string, password?: string): User => {
    const members = ERPService.getMembers();
    const found = members.find(
      (m) => m.email.trim().toLowerCase() === email.trim().toLowerCase()
    );
    if (!found) {
      throw new Error(`Account not found for email "${email}". Please verify or select a demo user.`);
    }
    if (found.status === 'Inactive') {
      throw new Error(`Account for "${found.name}" is deactivated. Please contact an Administrator.`);
    }
    const expectedPassword = found.password || DEFAULT_USER_PASSWORD;
    if (password && password !== expectedPassword) {
      throw new Error(`Incorrect password. (Default password for all staff is "${DEFAULT_USER_PASSWORD}")`);
    }

    setStored(KEYS.CURRENT_USER, found);
    localStorage.setItem(KEYS.AUTH_SESSION, 'true');
    ERPService.addAuditLog('USER_LOGIN', 'User', found.id, undefined, undefined, `${found.name} (${found.role})`, 'User logged in successfully');
    return found;
  },

  logout: (): void => {
    const user = ERPService.getCurrentUser();
    ERPService.addAuditLog('USER_LOGOUT', 'User', user.id, undefined, undefined, `${user.name} (${user.role})`, 'User logged out');
    localStorage.setItem(KEYS.AUTH_SESSION, 'false');
    window.dispatchEvent(new Event('apex_storage_update'));
  },

  // Users, Members & Roles Management
  getCurrentUser: (): User => {
    return getStored<User>(KEYS.CURRENT_USER, INITIAL_USERS[0]);
  },

  setCurrentUser: (user: User): void => {
    setStored(KEYS.CURRENT_USER, user);
    localStorage.setItem(KEYS.AUTH_SESSION, 'true');
    ERPService.addAuditLog('SWITCH_USER', 'User', user.id, undefined, undefined, `${user.name} (${user.role})`, 'Switched active workspace user');
  },

  getMembers: (): User[] => {
    return getStored<User[]>(KEYS.MEMBERS, INITIAL_USERS);
  },

  getAllUsers: (): User[] => {
    return ERPService.getMembers();
  },

  getMemberById: (id: string): User | undefined => {
    return ERPService.getMembers().find((m) => m.id === id);
  },

  addMember: (memberData: Partial<User>): User => {
    const members = ERPService.getMembers();
    const roles = ERPService.getRoles();
    const matchedRole = roles.find((r) => r.id === memberData.roleId || r.name.toLowerCase() === (memberData.role || '').toLowerCase());
    
    const newMember: User = {
      id: `usr-${Date.now()}`,
      name: memberData.name || 'New Member',
      email: memberData.email || '',
      password: memberData.password || DEFAULT_USER_PASSWORD,
      phone: memberData.phone || '',
      role: matchedRole ? matchedRole.name : (memberData.role || 'Site Supervisor'),
      roleId: matchedRole ? matchedRole.id : (memberData.roleId || 'role-site-supervisor'),
      status: memberData.status || 'Active',
      designation: memberData.designation || 'Field Staff',
      department: memberData.department || 'Site Operations',
      assignedSiteIds: memberData.assignedSiteIds || [],
      assignedSiteNames: memberData.assignedSiteNames || [],
      assignedJobIds: memberData.assignedJobIds || [],
      customPermissions: memberData.customPermissions || [],
      createdAt: new Date().toISOString().split('T')[0],
      lastActive: 'Just added',
    };

    const updated = [newMember, ...members];
    setStored(KEYS.MEMBERS, updated);
    ERPService.addAuditLog('CREATE_MEMBER', 'Member', newMember.id, undefined, undefined, `${newMember.name} (${newMember.role})`, 'Added new team member');
    return newMember;
  },

  updateMember: (id: string, updates: Partial<User>): User => {
    const members = ERPService.getMembers();
    const idx = members.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Member not found');

    const roles = ERPService.getRoles();
    let roleName = updates.role || members[idx].role;
    let roleId = updates.roleId || members[idx].roleId;
    if (updates.roleId) {
      const matched = roles.find((r) => r.id === updates.roleId);
      if (matched) roleName = matched.name;
    } else if (updates.role) {
      const matched = roles.find((r) => r.name.toLowerCase() === updates.role!.toLowerCase());
      if (matched) roleId = matched.id;
    }

    const updatedMember: User = {
      ...members[idx],
      ...updates,
      role: roleName,
      roleId: roleId,
    };

    members[idx] = updatedMember;
    setStored(KEYS.MEMBERS, members);

    // If updating current active user, sync current user storage
    const currentUser = ERPService.getCurrentUser();
    if (currentUser.id === id) {
      setStored(KEYS.CURRENT_USER, updatedMember);
    }

    ERPService.addAuditLog('UPDATE_MEMBER', 'Member', id, undefined, members[idx].role, updatedMember.role, `Updated member ${updatedMember.name}`);
    return updatedMember;
  },

  deleteMember: (id: string): boolean => {
    const members = ERPService.getMembers();
    const member = members.find((m) => m.id === id);
    if (!member) return false;
    
    // Safety check: Cannot delete last active admin
    const activeAdmins = members.filter((m) => m.role.toLowerCase() === 'admin' && m.status === 'Active');
    if (member.role.toLowerCase() === 'admin' && activeAdmins.length <= 1) {
      throw new Error('Cannot delete the last active Administrator account.');
    }

    const filtered = members.filter((m) => m.id !== id);
    setStored(KEYS.MEMBERS, filtered);

    // If current user was deleted, fallback to first member
    const currentUser = ERPService.getCurrentUser();
    if (currentUser.id === id) {
      setStored(KEYS.CURRENT_USER, filtered[0] || INITIAL_USERS[0]);
    }

    ERPService.addAuditLog('DELETE_MEMBER', 'Member', id, undefined, member.name, undefined, 'Deleted team member');
    return true;
  },

  setCurrentUserRole: (role: string): User => {
    const members = ERPService.getMembers();
    const foundMember = members.find((u) => u.role.toLowerCase() === role.toLowerCase() && u.status === 'Active');
    if (foundMember) {
      setStored(KEYS.CURRENT_USER, foundMember);
      ERPService.addAuditLog('SWITCH_ROLE', 'User', foundMember.id, undefined, undefined, role, `Switched to ${foundMember.name} (${foundMember.role})`);
      return foundMember;
    }

    // If no specific member, update current user's role on the fly
    const currentUser = ERPService.getCurrentUser();
    const roles = ERPService.getRoles();
    const matchedRole = roles.find((r) => r.name.toLowerCase() === role.toLowerCase());
    const updatedUser: User = {
      ...currentUser,
      role: matchedRole ? matchedRole.name : role,
      roleId: matchedRole ? matchedRole.id : undefined,
    };
    setStored(KEYS.CURRENT_USER, updatedUser);
    ERPService.addAuditLog('SWITCH_ROLE', 'User', currentUser.id, undefined, currentUser.role, role, 'User switched test role view');
    return updatedUser;
  },

  // Roles & Privileges
  getRoles: (): RoleDefinition[] => {
    return getStored<RoleDefinition[]>(KEYS.ROLES, INITIAL_ROLES);
  },

  getRoleById: (id: string): RoleDefinition | undefined => {
    return ERPService.getRoles().find((r) => r.id === id);
  },

  addRole: (roleData: Omit<RoleDefinition, 'id' | 'createdAt'>): RoleDefinition => {
    const roles = ERPService.getRoles();
    const newRole: RoleDefinition = {
      ...roleData,
      id: `role-${roleData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      isSystem: false,
    };
    const updated = [...roles, newRole];
    setStored(KEYS.ROLES, updated);
    ERPService.addAuditLog('CREATE_ROLE', 'Role', newRole.id, undefined, undefined, newRole.name, `Created custom role with ${newRole.permissions.length} privileges`);
    return newRole;
  },

  updateRole: (id: string, updates: Partial<RoleDefinition>): RoleDefinition => {
    const roles = ERPService.getRoles();
    const idx = roles.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Role not found');

    const updatedRole: RoleDefinition = {
      ...roles[idx],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    roles[idx] = updatedRole;
    setStored(KEYS.ROLES, roles);
    ERPService.addAuditLog('UPDATE_ROLE', 'Role', id, undefined, undefined, updatedRole.name, `Updated privileges for role ${updatedRole.name}`);
    return updatedRole;
  },

  deleteRole: (id: string): boolean => {
    const roles = ERPService.getRoles();
    const role = roles.find((r) => r.id === id);
    if (!role) return false;
    if (role.isSystem) {
      throw new Error(`Cannot delete built-in system role "${role.name}".`);
    }

    const members = ERPService.getMembers();
    const membersWithRole = members.filter((m) => m.roleId === id || m.role.toLowerCase() === role.name.toLowerCase());
    if (membersWithRole.length > 0) {
      throw new Error(`Cannot delete role "${role.name}" because it is currently assigned to ${membersWithRole.length} member(s). Reassign them first.`);
    }

    const filtered = roles.filter((r) => r.id !== id);
    setStored(KEYS.ROLES, filtered);
    ERPService.addAuditLog('DELETE_ROLE', 'Role', id, undefined, role.name, undefined, 'Deleted custom role');
    return true;
  },

  getAllPrivileges: (): PrivilegeDefinition[] => {
    return SYSTEM_PRIVILEGES;
  },

  getUserPermissions: (user?: User): string[] => {
    const targetUser = user || ERPService.getCurrentUser();
    if (!targetUser) return [];

    // Admin role has all privileges unlocked by default
    if (targetUser.role.toLowerCase() === 'admin') {
      return SYSTEM_PRIVILEGES.map((p) => p.key);
    }

    const roles = ERPService.getRoles();
    const matchedRole = roles.find((r) => 
      (targetUser.roleId && r.id === targetUser.roleId) ||
      r.name.toLowerCase() === targetUser.role.toLowerCase()
    );

    const basePermissions = matchedRole ? matchedRole.permissions : [];
    const customPermissions = targetUser.customPermissions || [];
    const combined = Array.from(new Set([...basePermissions, ...customPermissions]));
    return combined;
  },

  hasPermission: (permissionKey: string, user?: User): boolean => {
    const targetUser = user || ERPService.getCurrentUser();
    if (!targetUser) return false;
    if (targetUser.role.toLowerCase() === 'admin') return true;

    const permissions = ERPService.getUserPermissions(targetUser);
    return permissions.includes('*') || permissions.includes(permissionKey);
  },

  // Audit Logs (Central Spine)
  addAuditLog: (
    action: string,
    entity: string,
    entityId: string,
    jobId?: string,
    oldValue?: string,
    newValue?: string,
    reason?: string
  ) => {
    const user = ERPService.getCurrentUser();
    const logs = getStored<AuditLogEntry[]>(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    const newEntry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      role: user.role,
      action,
      entity,
      entityId,
      jobId,
      oldValue,
      newValue,
      reason: reason || 'Standard operation',
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    };
    setStored(KEYS.AUDIT_LOGS, [newEntry, ...logs]);
  },

  getAuditLogs: (jobId?: string): AuditLogEntry[] => {
    const logs = getStored<AuditLogEntry[]>(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    return jobId ? logs.filter((l) => l.jobId === jobId) : logs;
  },

  // Notifications
  getNotifications: (): AppNotification[] => {
    return getStored<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  markNotificationRead: (id: string) => {
    const notifs = getStored<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    setStored(
      KEYS.NOTIFICATIONS,
      notifs.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  },

  addNotification: (title: string, message: string, type: 'info' | 'warning' | 'success' | 'danger', link?: string, jobId?: string) => {
    const notifs = getStored<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      read: false,
      timestamp: 'Just now',
      link,
      jobId,
    };
    setStored(KEYS.NOTIFICATIONS, [newNotif, ...notifs]);
  },

  getJobs: (): Job[] => {
    return getStored<Job[]>(KEYS.JOBS, []);
  },

  getJobById: (id: string): Job | undefined => {
    const jobs = ERPService.getJobs();
    return jobs.find((j) => j.id === id);
  },

  createJob: (jobData: Omit<Job, 'id' | 'actualSpend' | 'progressPct' | 'createdAt'>): Job => {
    const jobs = ERPService.getJobs();
    const nextNum = jobs.length + 1;
    const padded = String(nextNum).padStart(4, '0');
    const newId = `JOB-2026-${padded}`;
    const newJob: Job = {
      ...jobData,
      id: newId,
      actualSpend: 0,
      progressPct: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setStored(KEYS.JOBS, [newJob, ...jobs]);

    // If job is linked to a site, register job in that site's activeJobIds
    if (newJob.siteId) {
      const sites = ERPService.getClientSites();
      const updatedSites = sites.map((s) =>
        s.id === newJob.siteId ? { ...s, activeJobIds: Array.from(new Set([...(s.activeJobIds || []), newId])) } : s
      );
      setStored(KEYS.CLIENT_SITES, updatedSites);
    }

    ERPService.addAuditLog('CREATE', 'Job', newId, newId, undefined, newJob.title, 'New Job created');
    ERPService.addNotification('New Job Created', `Job ${newId} (${newJob.title}) was created.`, 'info', `/jobs/${newId}`, newId);
    return newJob;
  },

  updateJobStatus: (id: string, newStatus: Job['status'], reason: string) => {
    const jobs = ERPService.getJobs();
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    const oldStatus = job.status;
    const updated = jobs.map((j) => (j.id === id ? { ...j, status: newStatus } : j));
    setStored(KEYS.JOBS, updated);
    ERPService.addAuditLog('UPDATE_STATUS', 'Job', id, id, oldStatus, newStatus, reason);
    ERPService.addNotification('Job Status Updated', `Job ${id} moved from ${oldStatus} to ${newStatus}.`, 'info', `/jobs/${id}`, id);
  },

  // BOQ
  getBOQsForJob: (jobId: string): BOQVersion[] => {
    const stored = getStored<BOQVersion[]>(KEYS.BOQS, []);
    const matching = stored.filter((b) => b.jobId === jobId);
    // Dynamically guarantee all BOM child components are synchronized with parent line.qty
    return matching.map((b) => ({
      ...b,
      sections: (b.sections || []).map((sec) => ({
        ...sec,
        items: (sec.items || []).map((line) => {
          if (!line.components || line.components.length === 0) return line;
          const parentQty = Number(line.qty) || 0;
          return {
            ...line,
            components: line.components.map((c) => {
              const qtyPerUnit = c.qtyPerUnit !== undefined && c.qtyPerUnit !== null
                ? Number(c.qtyPerUnit)
                : (parentQty > 0 ? (Number(c.totalQty) / parentQty) : Number(c.totalQty) || 1);
              const totalQty = Math.round(qtyPerUnit * parentQty * 100) / 100;
              const totalCost = Math.round(totalQty * (Number(c.unitCost) || 0) * 100) / 100;
              return {
                ...c,
                qtyPerUnit,
                totalQty,
                totalCost,
              };
            }),
          };
        }),
      })),
    }));
  },

  getCurrentBOQ: (jobId: string): BOQVersion | undefined => {
    const boqs = ERPService.getBOQsForJob(jobId);
    return boqs.find((b) => b.isCurrent) || boqs[0];
  },

  saveBOQVersion: (newBOQ: BOQVersion, reason: string): BOQVersion => {
    // Ensure all BOM constituent components have synchronized totalQty & totalCost based on parent outer qty
    if (newBOQ && newBOQ.sections) {
      newBOQ.sections.forEach((sec) => {
        if (!sec.items) return;
        sec.items.forEach((line) => {
          if (line.components && line.components.length > 0) {
            const parentQty = Number(line.qty) || 0;
            line.components = line.components.map((c) => {
              const qtyPerUnit = c.qtyPerUnit !== undefined && c.qtyPerUnit !== null
                ? Number(c.qtyPerUnit)
                : (parentQty > 0 ? (Number(c.totalQty) / parentQty) : Number(c.totalQty) || 1);
              const totalQty = Math.round(qtyPerUnit * parentQty * 100) / 100;
              const totalCost = Math.round(totalQty * (Number(c.unitCost) || 0) * 100) / 100;
              return {
                ...c,
                qtyPerUnit,
                totalQty,
                totalCost,
              };
            });
          }
        });
      });
    }

    const allBOQs = getStored<BOQVersion[]>(KEYS.BOQS, INITIAL_BOQS);
    
    // Check if updating existing BOQ by id
    const existingIndex = allBOQs.findIndex((b) => b.id === newBOQ.id);
    let updatedList: BOQVersion[];
    
    if (existingIndex >= 0) {
      updatedList = allBOQs.map((b) => (b.id === newBOQ.id ? newBOQ : b));
    } else {
      // Supersede older versions of the same package / title if applicable
      const deact = allBOQs.map((b) => {
        if (b.jobId === newBOQ.jobId && ((newBOQ.packageCode && b.packageCode === newBOQ.packageCode) || (newBOQ.title && b.title === newBOQ.title))) {
          return { ...b, isCurrent: false };
        }
        return b;
      });
      updatedList = [{ ...newBOQ, isCurrent: true }, ...deact];
    }
    
    setStored(KEYS.BOQS, updatedList);
    
    // Calculate total job value from all active BOQs for this job
    const jobActiveBOQs = updatedList.filter((b) => b.jobId === newBOQ.jobId && b.isCurrent);
    const combinedTotal = jobActiveBOQs.reduce((sum, b) => sum + (b.grandTotal || 0), 0);

    const jobs = ERPService.getJobs();
    setStored(
      KEYS.JOBS,
      jobs.map((j) => {
        if (j.id === newBOQ.jobId) {
          const nextStatus = j.status === 'Draft' ? (newBOQ.status === 'Rates Pending' ? 'Rates Pending' : 'BOQ Prepared') : j.status;
          return { ...j, quotedAmount: combinedTotal > 0 ? combinedTotal : newBOQ.grandTotal, status: nextStatus };
        }
        return j;
      })
    );

    ERPService.addAuditLog('BOQ_SAVED', 'BOQ', newBOQ.id, newBOQ.jobId, undefined, `${newBOQ.title || newBOQ.versionLabel} (${newBOQ.status}) - ₹${newBOQ.grandTotal.toLocaleString('en-IN')}`, reason);
    ERPService.addNotification('BOQ Updated', `BOQ "${newBOQ.title || newBOQ.versionLabel}" saved for ${newBOQ.jobId} (Status: ${newBOQ.status})`, 'info', `/jobs/${newBOQ.jobId}`, newBOQ.jobId);
    return newBOQ;
  },

  createDefaultTemplateBOQ: (jobId: string): BOQVersion => {
    const user = ERPService.getCurrentUser();
    const existing = ERPService.getBOQsForJob(jobId);
    const verNum = existing.length + 1;
    const templateBOQ: BOQVersion = {
      id: `boq-${jobId.toLowerCase()}-v${verNum}`,
      jobId,
      versionNumber: verNum,
      versionLabel: `v${verNum}`,
      isCurrent: true,
      status: 'BOQ Prepared',
      createdBy: user.name,
      createdAt: new Date().toISOString().split('T')[0],
      revisionReason: 'Initialized from Standard Electrical Contracting Master Template',
      totalSupplyAmount: 846000,
      totalErectionAmount: 200500,
      grandTotal: 1046500,
      sections: [
        {
          id: `sec-${Date.now()}-1`,
          sectionNumber: '1.0',
          title: 'PSW Transformers & HT Equipment',
          sectionSupplyTotal: 420000,
          sectionErectionTotal: 85000,
          sectionGrandTotal: 505000,
          items: [
            {
              id: `line-${Date.now()}-1`,
              sNo: '1',
              description: '250 kVA Oil Cooled Step Down Transformer 11kV/433V with first filling of oil',
              qty: 1,
              unit: 'Nos',
              supplyRate: 380000,
              erectionRate: 65000,
              supplyAmount: 380000,
              erectionAmount: 65000,
              totalAmount: 445000,
              vendorId: 'ven-004',
              vendorName: 'Bharat Transformers & Heavy Equipments',
            },
            {
              id: `line-${Date.now()}-2`,
              sNo: '2',
              description: 'Chemical Maintenance-Free Earthing Electrode with Bentonite Compound',
              qty: 8,
              unit: 'Set',
              supplyRate: 5000,
              erectionRate: 2500,
              supplyAmount: 40000,
              erectionAmount: 20000,
              totalAmount: 60000,
              vendorId: 'ven-004',
              vendorName: 'Bharat Transformers & Heavy Equipments',
            },
          ],
        },
        {
          id: `sec-${Date.now()}-2`,
          sectionNumber: '2.0',
          title: 'Circuit Mains & HT Cabling',
          sectionSupplyTotal: 206000,
          sectionErectionTotal: 57500,
          sectionGrandTotal: 263500,
          items: [
            {
              id: `line-${Date.now()}-3`,
              sNo: '1',
              description: '16 Sq.mm 4 Core Armoured Aluminium Cable laying in ground / trench',
              qty: 400,
              unit: 'Mtrs',
              supplyRate: 195,
              erectionRate: 75,
              supplyAmount: 78000,
              erectionAmount: 30000,
              totalAmount: 108000,
              vendorId: 'ven-001',
              vendorName: 'Polycab Wires & Cables Ltd',
            },
            {
              id: `line-${Date.now()}-4`,
              sNo: '2.a',
              description: 'GI Perforated Cable Tray 150mm x 50mm suspended from ceiling',
              qty: 250,
              unit: 'Mtrs',
              supplyRate: 280,
              erectionRate: 110,
              supplyAmount: 70000,
              erectionAmount: 27500,
              totalAmount: 97500,
              vendorId: 'ven-003',
              vendorName: 'Havells Electricals Supply Co',
            },
            {
              id: `line-${Date.now()}-5`,
              sNo: '2.b',
              description: '32A Four Pole MCBs with Enclosure & busbar connections',
              qty: 40,
              unit: 'Nos',
              supplyRate: 1450,
              erectionRate: 250,
              supplyAmount: 58000,
              erectionAmount: 10000,
              totalAmount: 68000,
              vendorId: 'ven-002',
              vendorName: 'Schneider Electric Dist. (South)',
            },
          ],
        },
        {
          id: `sec-${Date.now()}-3`,
          sectionNumber: '3.0',
          title: 'Fans, Lighting & Point Wiring',
          sectionSupplyTotal: 220000,
          sectionErectionTotal: 58000,
          sectionGrandTotal: 278000,
          items: [
            {
              id: `line-${Date.now()}-6`,
              sNo: '1',
              description: '1200mm Heavy Duty Ceiling Fan with down rod and regulator',
              qty: 25,
              unit: 'Nos',
              supplyRate: 2100,
              erectionRate: 400,
              supplyAmount: 52500,
              erectionAmount: 10000,
              totalAmount: 62500,
              vendorId: 'ven-003',
              vendorName: 'Havells Electricals Supply Co',
            },
            {
              id: `line-${Date.now()}-7`,
              sNo: '2',
              description: '1.5 Sq.mm FR Copper Wire in conduits for light point wiring',
              qty: 50,
              unit: 'Coil',
              supplyRate: 1550,
              erectionRate: 500,
              supplyAmount: 77500,
              erectionAmount: 25000,
              totalAmount: 102500,
              vendorId: 'ven-001',
              vendorName: 'Polycab Wires & Cables Ltd',
            },
            {
              id: `line-${Date.now()}-8`,
              sNo: '3',
              description: '40W LED Industrial Batten 4ft with suspension hooks',
              qty: 90,
              unit: 'Nos',
              supplyRate: 1000,
              erectionRate: 255.56,
              supplyAmount: 90000,
              erectionAmount: 23000,
              totalAmount: 113000,
              vendorId: 'ven-003',
              vendorName: 'Havells Electricals Supply Co',
            },
          ],
        },
      ],
    };
    return ERPService.saveBOQVersion(templateBOQ, 'Loaded standard electrical contracting master template');
  },

  // Purchases & POs
  getPurchases: (jobId?: string): PurchaseOrder[] => {
    const pos = getStored<PurchaseOrder[]>(KEYS.PURCHASES, INITIAL_PURCHASES);
    return jobId ? pos.filter((p) => p.jobId === jobId) : pos;
  },

  getPurchasedQuantitiesForJob: (jobId: string): Record<string, number> => {
    const pos = ERPService.getPurchases(jobId);
    const map: Record<string, number> = {};
    pos.forEach((po) => {
      if (po.status === 'Rejected') return;
      po.items.forEach((item) => {
        const qty = item.purchaseQty || 0;
        if (item.componentId) {
          map[item.componentId] = (map[item.componentId] || 0) + qty;
        }
        if (item.boqLineId) {
          map[item.boqLineId] = (map[item.boqLineId] || 0) + qty;
        }
        if (item.itemId) {
          map[item.itemId] = (map[item.itemId] || 0) + qty;
        }
        const nameKey = (item.itemName || '').trim().toLowerCase();
        if (nameKey) {
          map[nameKey] = (map[nameKey] || 0) + qty;
        }
      });
    });
    return map;
  },

  getJobProcurementItems: (jobId: string): ProcurableBOQItem[] => {
    const boqs = ERPService.getBOQsForJob(jobId);
    if (!boqs || boqs.length === 0) return [];

    // Support both single-package and multi-package active BOQs for this job
    const activeBoqs = boqs.filter((b) => b.isCurrent);
    const boqsToProcess = activeBoqs.length > 0 ? activeBoqs : [boqs[0]];

    const purchasedMap = ERPService.getPurchasedQuantitiesForJob(jobId);
    const itemsList: ProcurableBOQItem[] = [];

    boqsToProcess.forEach((currBoq) => {
      if (!currBoq || !currBoq.sections) return;

      currBoq.sections.forEach((sec) => {
        sec.items.forEach((line) => {
          const parentQty = Number(line.qty) || 0;

          // If line has BOM constituent components, include each raw material
          if (line.components && line.components.length > 0) {
            line.components.forEach((c) => {
              const cName = c.name.trim();
              const ordered = purchasedMap[c.id] || (cName ? purchasedMap[cName.toLowerCase()] : 0) || 0;
              const qtyPerUnit = c.qtyPerUnit !== undefined && c.qtyPerUnit !== null
                ? Number(c.qtyPerUnit)
                : (parentQty > 0 ? (Number(c.totalQty) / parentQty) : Number(c.totalQty) || 1);
              // Dynamic multiplier: parent outer quantity * consumption ratio per unit
              const computedTarget = Math.round(qtyPerUnit * parentQty * 100) / 100;
              const target = computedTarget > 0 ? computedTarget : (Number(c.totalQty) || 0);
              const balance = Math.max(0, target - ordered);

              itemsList.push({
                key: `bom-${currBoq.id || 'b'}-${line.id}-${c.id}`,
                boqLineId: line.id,
                boqLineSNo: line.sNo || '',
                sectionTitle: `${currBoq.packageCode ? `[${currBoq.packageCode}] ` : ''}${sec.title}`,
                componentId: c.id,
                isBomComponent: true,
                parentLineDescription: line.description,
                parentLineQty: parentQty,
                parentLineUnit: line.unit,
                qtyPerUnit: qtyPerUnit,
                itemId: c.itemId,
                name: c.name,
                specification: c.specification || '',
                unit: c.unit,
                targetQty: target,
                orderedQty: ordered,
                balanceQty: balance,
                targetRate: c.unitCost || 0,
              });
            });
          }

          // Also include the BOQ line itself
          const lineName = (line.description || '').trim();
          if (lineName) {
            const ordered = purchasedMap[line.id] || purchasedMap[lineName.toLowerCase()] || 0;
            const target = parentQty;
            const balance = Math.max(0, target - ordered);
            itemsList.push({
              key: `line-${currBoq.id || 'b'}-${line.id}`,
              boqLineId: line.id,
              boqLineSNo: line.sNo || '',
              sectionTitle: `${currBoq.packageCode ? `[${currBoq.packageCode}] ` : ''}${sec.title}`,
              componentId: undefined,
              isBomComponent: false,
              parentLineDescription: undefined,
              parentLineQty: parentQty,
              parentLineUnit: line.unit,
              qtyPerUnit: 1,
              itemId: line.itemId,
              name: line.description,
              specification: '',
              unit: line.unit,
              targetQty: target,
              orderedQty: ordered,
              balanceQty: balance,
              targetRate: line.supplyRate || 0,
              defaultVendorId: line.vendorId,
              defaultVendorName: line.vendorName,
            });
          }
        });
      });
    });

    return itemsList;
  },

  getAllProcurementItems: (): Array<ProcurableBOQItem & { jobId: string; jobTitle: string }> => {
    const jobs = ERPService.getJobs();
    const result: Array<ProcurableBOQItem & { jobId: string; jobTitle: string }> = [];
    jobs.forEach((j) => {
      const items = ERPService.getJobProcurementItems(j.id);
      items.forEach((it) => {
        result.push({
          ...it,
          jobId: j.id,
          jobTitle: j.title,
        });
      });
    });
    return result;
  },

  getMaterialMappingDetails: (
    materialName: string,
    jobId?: string,
    componentId?: string,
    itemId?: string
  ) => {
    const jobs = ERPService.getJobs();
    const targetJobs = jobId ? jobs.filter((j) => j.id === jobId) : jobs;
    const cleanName = (materialName || '').trim().toLowerCase();

    interface MappingRow {
      jobId: string;
      jobTitle: string;
      packageCode?: string;
      sectionTitle: string;
      lineId: string;
      lineSNo: string;
      parentDescription: string;
      parentQty: number;
      parentUnit: string;
      qtyPerUnit: number;
      componentUnit: string;
      totalRequiredQty: number;
      unitCost: number;
      totalCost: number;
      isBomComponent: boolean;
      componentId?: string;
    }

    const mappings: MappingRow[] = [];

    targetJobs.forEach((j) => {
      const boqs = ERPService.getBOQsForJob(j.id);
      const activeBoqs = boqs.filter((b) => b.isCurrent);
      const boqsToProcess = activeBoqs.length > 0 ? activeBoqs : boqs;

      boqsToProcess.forEach((b) => {
        (b.sections || []).forEach((sec) => {
          (sec.items || []).forEach((line) => {
            const pQty = Number(line.qty) || 0;

            // Check BOM constituent components
            if (line.components && line.components.length > 0) {
              line.components.forEach((c) => {
                const cName = (c.name || '').trim().toLowerCase();
                const isMatch =
                  (componentId && c.id === componentId) ||
                  (itemId && c.itemId === itemId) ||
                  (cleanName && (cName === cleanName || cName.includes(cleanName) || cleanName.includes(cName)));

                if (isMatch) {
                  const ratio = c.qtyPerUnit !== undefined && c.qtyPerUnit !== null
                    ? Number(c.qtyPerUnit)
                    : (pQty > 0 ? (Number(c.totalQty) / pQty) : Number(c.totalQty) || 1);
                  const totalReq = Math.round(ratio * pQty * 100) / 100;
                  const cost = Math.round(totalReq * (Number(c.unitCost) || 0) * 100) / 100;

                  mappings.push({
                    jobId: j.id,
                    jobTitle: j.title,
                    packageCode: b.packageCode,
                    sectionTitle: sec.title,
                    lineId: line.id,
                    lineSNo: line.sNo || '',
                    parentDescription: line.description || 'BOQ Line Item',
                    parentQty: pQty,
                    parentUnit: line.unit,
                    qtyPerUnit: ratio,
                    componentUnit: c.unit,
                    totalRequiredQty: totalReq > 0 ? totalReq : (c.totalQty || 0),
                    unitCost: c.unitCost || 0,
                    totalCost: cost,
                    isBomComponent: true,
                    componentId: c.id,
                  });
                }
              });
            }

            // Check if direct line matches
            const lDesc = (line.description || '').trim().toLowerCase();
            const isLineMatch =
              (itemId && line.itemId === itemId) ||
              (!line.components?.length && cleanName && (lDesc === cleanName || lDesc.includes(cleanName) || cleanName.includes(lDesc)));

            if (isLineMatch) {
              const cost = Math.round(pQty * (line.supplyRate || 0) * 100) / 100;
              mappings.push({
                jobId: j.id,
                jobTitle: j.title,
                packageCode: b.packageCode,
                sectionTitle: sec.title,
                lineId: line.id,
                lineSNo: line.sNo || '',
                parentDescription: line.description,
                parentQty: pQty,
                parentUnit: line.unit,
                qtyPerUnit: 1,
                componentUnit: line.unit,
                totalRequiredQty: pQty,
                unitCost: line.supplyRate || 0,
                totalCost: cost,
                isBomComponent: false,
              });
            }
          });
        });
      });
    });

    // Check Purchase Orders
    const allPOs = ERPService.getPurchases();
    const relevantPOs = allPOs.filter((po) => {
      if (po.status === 'Rejected') return false;
      if (jobId && po.jobId !== jobId && !(po.jobIds || []).includes(jobId)) return false;
      return po.items.some((it) => {
        const itName = (it.itemName || '').trim().toLowerCase();
        return (
          (componentId && it.componentId === componentId) ||
          (itemId && it.itemId === itemId) ||
          (cleanName && (itName === cleanName || itName.includes(cleanName) || cleanName.includes(itName)))
        );
      });
    });

    const poItemsList: Array<{
      poId: string;
      jobId: string;
      jobTitle: string;
      vendorName: string;
      date: string;
      purchaseQty: number;
      unit: string;
      purchaseRate: number;
      totalAmount: number;
      status: string;
      billNumber?: string;
      receivedAt?: string;
    }> = [];

    relevantPOs.forEach((po) => {
      po.items.forEach((it) => {
        const itName = (it.itemName || '').trim().toLowerCase();
        const matches =
          (componentId && it.componentId === componentId) ||
          (itemId && it.itemId === itemId) ||
          (cleanName && (itName === cleanName || itName.includes(cleanName) || cleanName.includes(itName)));

        if (matches) {
          poItemsList.push({
            poId: po.id,
            jobId: it.jobId || po.jobId,
            jobTitle: it.jobTitle || po.jobTitle,
            vendorName: po.vendorName,
            date: po.date,
            purchaseQty: it.purchaseQty,
            unit: it.unit,
            purchaseRate: it.purchaseRate,
            totalAmount: it.totalAmount,
            status: po.status,
            billNumber: po.billNumber,
            receivedAt: po.receivedAt,
          });
        }
      });
    });

    const totalRequiredQty = mappings.reduce((sum, m) => sum + m.totalRequiredQty, 0);
    const totalOrderedQty = poItemsList.reduce((sum, p) => sum + p.purchaseQty, 0);
    const balanceQty = Math.max(0, totalRequiredQty - totalOrderedQty);
    const totalEstBudget = mappings.reduce((sum, m) => sum + m.totalCost, 0);

    return {
      materialName,
      unit: mappings[0]?.componentUnit || 'Nos',
      totalRequiredQty,
      totalOrderedQty,
      balanceQty,
      totalEstBudget,
      mappings,
      purchaseOrders: poItemsList,
    };
  },

  createPurchase: (poData: Omit<PurchaseOrder, 'id' | 'createdAt'>, reason?: string): PurchaseOrder => {
    const pos = getStored<PurchaseOrder[]>(KEYS.PURCHASES, INITIAL_PURCHASES);
    const nextNum = pos.length + 1;
    const padded = String(nextNum).padStart(4, '0');
    const newId = `PO-2026-${padded}`;
    const user = ERPService.getCurrentUser();
    
    // Check if multi-job
    const itemJobIds = Array.from(new Set(poData.items.map((i) => i.jobId).filter(Boolean))) as string[];
    const isMultiJob = poData.isMultiJob || itemJobIds.length > 1;
    const allJobIds = Array.from(new Set([...itemJobIds, ...(poData.jobIds || []), poData.jobId].filter(Boolean)));

    // Strict BOQ limit check: Do NOT allow raising purchase request beyond BOQ balance
    for (const item of poData.items) {
      if (item.boqQty && item.boqQty > 0) {
        const prior = item.alreadyPurchasedQty || 0;
        const maxAllowed = Math.max(0, item.boqQty - prior);
        if (item.purchaseQty > maxAllowed) {
          throw new Error(
            `Procurement Restricted: "${item.itemName}" exceeds BOQ limit (${item.boqQty} ${item.unit}). Already ordered prior: ${prior} ${item.unit}. Max remaining allowed: ${maxAllowed} ${item.unit}. Excess purchase is strictly not permitted.`
          );
        }
      }
    }

    // Check approval trigger: rate escalations (purchaseRate > quotedRate)
    let approvalTriggered = false;
    let approvalReason = '';
    const breachedItems: Array<{
      item: typeof poData.items[0];
      extraQty: number;
      priceDiff: number;
      reasonStr: string;
    }> = [];
    
    for (const item of poData.items) {
      if (item.quotedRate > 0 && item.purchaseRate > item.quotedRate) {
        approvalTriggered = true;
        const linePriceDiff = item.purchaseRate - item.quotedRate;
        const msg = `Purchase Rate ₹${item.purchaseRate} exceeds BOQ quoted rate ₹${item.quotedRate} for "${item.itemName}". `;
        approvalReason += msg;
        breachedItems.push({
          item,
          extraQty: 0,
          priceDiff: linePriceDiff,
          reasonStr: msg,
        });
      }
    }

    // Auto-create Rate Escalation Ticket for Admin if rate exceeded
    let createdTicketId: string | undefined = undefined;
    if (approvalTriggered && breachedItems.length > 0) {
      const firstBreach = breachedItems[0];
      const mrRequests = getStored<MaterialRequest[]>(KEYS.MATERIAL_REQUESTS, INITIAL_MATERIAL_REQUESTS);
      createdTicketId = `ticket-${Date.now()}`;
      const newTicket: MaterialRequest = {
        id: createdTicketId,
        jobId: firstBreach.item.jobId || poData.jobId,
        jobTitle: firstBreach.item.jobTitle || poData.jobTitle,
        poId: newId,
        requestType: 'RateEscalation',
        itemId: firstBreach.item.itemId || `itm-${Date.now()}`,
        itemName: firstBreach.item.itemName,
        specification: firstBreach.item.specification,
        unit: firstBreach.item.unit,
        allowedQty: firstBreach.item.boqQty || 0,
        alreadyIssuedQty: firstBreach.item.alreadyPurchasedQty || 0,
        requestedExtraQty: 0,
        proposedRate: firstBreach.item.purchaseRate,
        totalExtraCost: firstBreach.item.purchaseQty * firstBreach.priceDiff,
        reason: reason || approvalReason,
        usageHistory: `Rate escalation on PO ${newId} (${poData.vendorName}).`,
        requestedBy: `${user.name} (${user.role})`,
        requestedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        status: 'Pending',
      };
      setStored(KEYS.MATERIAL_REQUESTS, [newTicket, ...mrRequests]);
    }

    const newPO: PurchaseOrder = {
      ...poData,
      id: newId,
      isMultiJob,
      jobIds: allJobIds,
      createdAt: new Date().toISOString().split('T')[0],
      status: approvalTriggered ? 'Pending Approval' : 'Approved',
      approvalTriggered,
      approvalReason: approvalReason || reason,
      extraMaterialTicketId: createdTicketId,
    };

    setStored(KEYS.PURCHASES, [newPO, ...pos]);

    // If PO was raised from a Site Material Requisition / Indent, update requisition status to PO Issued
    if (poData.linkedIndentId) {
      const allRequests = getStored<MaterialRequest[]>(KEYS.MATERIAL_REQUESTS, INITIAL_MATERIAL_REQUESTS);
      const updatedReqs = allRequests.map((r) =>
        r.id === poData.linkedIndentId
          ? {
              ...r,
              status: 'PO Issued' as const,
              poId: newId,
              poTitle: `PO ${newId} (${newPO.vendorName})`,
              adminNotes: `${r.adminNotes || ''} | PO ${newId} issued for ₹${newPO.grandTotal.toLocaleString('en-IN')}`,
            }
          : r
      );
      setStored(KEYS.MATERIAL_REQUESTS, updatedReqs);
    }

    // Record price history for purchased items
    if (!approvalTriggered) {
      newPO.items.forEach((item) => {
        ERPService.recordPriceHistory(
          item.itemId,
          item.itemName,
          newPO.vendorId,
          newPO.vendorName,
          item.purchaseRate,
          item.purchaseQty,
          item.unit,
          item.jobId || newPO.jobId
        );
      });
      // Update actual spend on job(s)
      if (allJobIds.length > 0) {
        allJobIds.forEach((jId) => ERPService.recalculateJobSpend(jId));
      } else {
        ERPService.recalculateJobSpend(newPO.jobId);
      }
    }

    ERPService.addAuditLog(
      'CREATE',
      'Purchase',
      newId,
      newPO.jobId,
      undefined,
      `₹${newPO.grandTotal.toLocaleString('en-IN')} (${newPO.vendorName})`,
      approvalTriggered ? `APPROVAL TICKET RAISED: ${approvalReason}` : reason || 'Purchase Order Created'
    );

    if (approvalTriggered) {
      ERPService.addNotification(
        'Purchase Approval Required',
        `PO ${newId} (${breachedItems.length} items over BOQ limit/rate) submitted to Admin with explanation: ${approvalReason}`,
        'warning',
        `/purchases`,
        newPO.jobId
      );
    }

    return newPO;
  },

  approvePurchase: (poId: string, reason: string) => {
    const pos = getStored<PurchaseOrder[]>(KEYS.PURCHASES, INITIAL_PURCHASES);
    const po = pos.find((p) => p.id === poId);
    if (!po) return;
    const user = ERPService.getCurrentUser();

    const updated = pos.map((p) =>
      p.id === poId
        ? {
            ...p,
            status: 'Approved' as const,
            approvedBy: user.name,
            approvedAt: new Date().toLocaleString('en-IN'),
          }
        : p
    );
    setStored(KEYS.PURCHASES, updated);

    // Also update any linked MaterialRequest ticket to Approved
    if (po.extraMaterialTicketId) {
      ERPService.approveMaterialRequest(po.extraMaterialTicketId, reason);
    } else {
      // Check if any MaterialRequest matches poId
      const requests = getStored<MaterialRequest[]>(KEYS.MATERIAL_REQUESTS, INITIAL_MATERIAL_REQUESTS);
      const linkedReq = requests.find((r) => r.poId === poId);
      if (linkedReq && linkedReq.status === 'Pending') {
        ERPService.approveMaterialRequest(linkedReq.id, reason);
      }
    }

    // Record price history
    po.items.forEach((item) => {
      ERPService.recordPriceHistory(
        item.itemId,
        item.itemName,
        po.vendorId,
        po.vendorName,
        item.purchaseRate,
        item.purchaseQty,
        item.unit,
        item.jobId || po.jobId
      );
    });

    // Update actual spend for all affected jobs
    const affectedJobIds = po.jobIds && po.jobIds.length > 0 ? po.jobIds : [po.jobId];
    affectedJobIds.forEach((jId) => {
      if (jId && jId !== 'MULTI-JOB') {
        ERPService.recalculateJobSpend(jId);
      }
    });

    ERPService.addAuditLog('APPROVE', 'Purchase', poId, po.jobId, 'Pending Approval', 'Approved', reason);
    ERPService.addNotification('Purchase Approved', `PO ${poId} was approved by ${user.name}.`, 'success', `/purchases`, po.jobId);
  },

  rejectPurchase: (poId: string, reason: string) => {
    const pos = getStored<PurchaseOrder[]>(KEYS.PURCHASES, INITIAL_PURCHASES);
    const po = pos.find((p) => p.id === poId);
    if (!po) return;
    const user = ERPService.getCurrentUser();

    const updated = pos.map((p) =>
      p.id === poId
        ? {
            ...p,
            status: 'Rejected' as const,
            rejectionReason: reason,
          }
        : p
    );
    setStored(KEYS.PURCHASES, updated);

    // Also reject linked ticket
    const requests = getStored<MaterialRequest[]>(KEYS.MATERIAL_REQUESTS, INITIAL_MATERIAL_REQUESTS);
    const updatedReqs = requests.map((r) =>
      (r.poId === poId || r.id === po.extraMaterialTicketId) && r.status === 'Pending'
        ? {
            ...r,
            status: 'Rejected' as const,
            adminNotes: `PO Rejected: ${reason}`,
          }
        : r
    );
    setStored(KEYS.MATERIAL_REQUESTS, updatedReqs);

    ERPService.addAuditLog('REJECT', 'Purchase', poId, po.jobId, 'Pending Approval', 'Rejected', reason);
    ERPService.addNotification('Purchase Rejected', `PO ${poId} was rejected by ${user.name}: ${reason}`, 'danger', `/purchases`, po.jobId);
  },

  receivePurchasedItems: (
    poId: string,
    receiptData: {
      billNumber: string;
      billDate: string;
      billAmount: number;
      billPhotoUrl: string;
      destinationType: 'site' | 'warehouse';
      destinationName: string;
      targetJobId?: string;
      receivedItems: Array<{
        itemId: string;
        itemName: string;
        unit: MeasurementUnit;
        receivedQty: number;
        jobId?: string;
      }>;
      remarks?: string;
    }
  ): PurchaseOrder => {
    const pos = getStored<PurchaseOrder[]>(KEYS.PURCHASES, INITIAL_PURCHASES);
    const po = pos.find((p) => p.id === poId);
    if (!po) throw new Error(`PO ${poId} not found`);

    const user = ERPService.getCurrentUser();
    const today = new Date().toISOString().split('T')[0];

    // Record stock movements for all received items
    receiptData.receivedItems.forEach((item) => {
      if (item.receivedQty > 0) {
        const poItem = po.items.find((pi) => pi.itemId === item.itemId || pi.itemName.toLowerCase() === item.itemName.toLowerCase());
        ERPService.recordStockMovement(
          {
            type: 'Receive',
            itemId: item.itemId,
            itemName: item.itemName,
            qty: item.receivedQty,
            unit: item.unit,
            fromLocation: po.vendorName,
            toLocation: receiptData.destinationName,
            jobId: receiptData.destinationType === 'site' ? (item.jobId || receiptData.targetJobId || (po.jobId !== 'MULTI-JOB' ? po.jobId : undefined)) : undefined,
            responsibleUser: user.name,
            remarks: `Inward from PO ${po.id} against Vendor Bill #${receiptData.billNumber} to ${receiptData.destinationName}`,
          },
          {
            lastPoId: po.id,
            lastBillNumber: receiptData.billNumber,
            billPhotoUrl: receiptData.billPhotoUrl,
            unitCost: poItem?.purchaseRate,
            specification: poItem?.specification,
          }
        );
      }
    });

    // Update PO status to Delivered and store bill photo proof
    const updatedPO: PurchaseOrder = {
      ...po,
      status: 'Delivered',
      billNumber: receiptData.billNumber,
      billDate: receiptData.billDate,
      billAmount: receiptData.billAmount,
      billPhotoUrl: receiptData.billPhotoUrl,
      receivedAt: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      receivedBy: user.name,
      receivedDestination: receiptData.destinationName,
      receivedLocationType: receiptData.destinationType,
      receivedRemarks: receiptData.remarks,
    };

    const updatedList = pos.map((p) => (p.id === poId ? updatedPO : p));
    setStored(KEYS.PURCHASES, updatedList);

    ERPService.addAuditLog(
      'PO_RECEIVED',
      'Purchase',
      po.id,
      po.jobId,
      po.status,
      'Delivered',
      `Materials received & moved to ${receiptData.destinationName}. Bill #${receiptData.billNumber} verified with photo proof.`
    );

    ERPService.addNotification(
      'Materials Inward & Bill Verified',
      `PO ${po.id} materials received and inwarded to ${receiptData.destinationName}. Vendor Bill #${receiptData.billNumber} attached with photo proof.`,
      'success',
      `/purchases`,
      po.jobId !== 'MULTI-JOB' ? po.jobId : undefined
    );

    // Auto-update linked or matching site requisitions to Delivered to Site for Site Engineer
    const allRequests = getStored<MaterialRequest[]>(KEYS.MATERIAL_REQUESTS, INITIAL_MATERIAL_REQUESTS);
    let matchedAny = false;
    const updatedReqs = allRequests.map((r) => {
      const isDirectLink = r.id === po.linkedIndentId || r.poId === po.id;
      const isJobItemMatch =
        ['Pending', 'Approved', 'Moved to Purchase', 'PO Issued'].includes(r.status) &&
        r.jobId === po.jobId &&
        receiptData.receivedItems.some(
          (ri) => ri.itemName.toLowerCase() === r.itemName.toLowerCase() && ri.receivedQty > 0
        );

      if (isDirectLink || isJobItemMatch) {
        matchedAny = true;
        return {
          ...r,
          status: 'Delivered to Site' as const,
          dispatchedFrom: receiptData.destinationName,
          dispatchedAt: today,
          adminNotes: `${r.adminNotes || ''} | Delivered to site from PO ${po.id} against Bill #${receiptData.billNumber}. Handed over for Site Engineer verification.`,
        };
      }
      return r;
    });

    if (matchedAny) {
      setStored(KEYS.MATERIAL_REQUESTS, updatedReqs);
      ERPService.addNotification(
        'Material Delivered to Site Engineer',
        `Materials from PO ${po.id} have arrived at ${receiptData.destinationName}. Site Engineer can now physically inspect and acknowledge receipt on site.`,
        'success',
        `/sites?tab=indents`,
        po.jobId !== 'MULTI-JOB' ? po.jobId : undefined
      );
    }

    return updatedPO;
  },

  // Inventory & Stock
  getStockLedger: (jobId?: string): StockLedgerItem[] => {
    const siteStocks = ERPService.getSiteStocks(jobId);
    const ledger = getStored<StockLedgerItem[]>(KEYS.STOCK_LEDGER, INITIAL_STOCK_LEDGER);
    if (jobId) return siteStocks;

    // Combine site stocks and warehouse stocks without duplicate IDs
    const combined = [...siteStocks];
    ledger.forEach((item) => {
      if (!combined.some((c) => c.id === item.id || (c.itemId === item.itemId && c.jobId === item.jobId))) {
        combined.push(item);
      }
    });
    return combined;
  },

  getSiteStocks: (jobId?: string): StockLedgerItem[] => {
    const ledger = getStored<StockLedgerItem[]>(KEYS.STOCK_LEDGER, INITIAL_STOCK_LEDGER);
    // Find all stock assigned to site stores or specific jobs
    const siteItems: StockLedgerItem[] = ledger.filter((l) => {
      const isSite = !l.isUnallocated || (l.locationName && l.locationName.toLowerCase().includes('site')) || Boolean(l.jobId);
      if (!isSite) return false;
      if (jobId) return l.jobId === jobId;
      return true;
    });

    // Also check delivered POs: if any delivered PO to site has items that are not yet in siteItems, auto-include them
    const purchases = ERPService.getPurchases();
    const deliveredPOs = purchases.filter((p) => p.status === 'Delivered' && (!jobId || p.jobId === jobId || p.jobIds?.includes(jobId)));
    
    deliveredPOs.forEach((po) => {
      po.items.forEach((poItem) => {
        const itemJob = poItem.jobId || po.jobId;
        if (jobId && itemJob !== jobId) return;
        const exists = siteItems.some((s) => (s.itemId === poItem.itemId || s.itemName.toLowerCase() === poItem.itemName.toLowerCase()) && s.jobId === itemJob);
        if (!exists) {
          siteItems.push({
            id: `stk-po-${po.id}-${poItem.id}`,
            slNo: siteItems.length + 1,
            itemId: poItem.itemId,
            itemName: poItem.itemName,
            specification: poItem.specification || '',
            unit: poItem.unit,
            receivedQty: poItem.purchaseQty,
            issuedQty: 0,
            stockOnSite: poItem.purchaseQty,
            locationId: `site-store-${(itemJob || 'general').toLowerCase()}`,
            locationName: po.receivedDestination || `Site Store (${itemJob || 'Project Site'})`,
            responsiblePerson: po.receivedBy || 'Site Store Keeper',
            jobId: itemJob,
            isUnallocated: false,
            minStockLevel: 0,
            lastUpdated: po.receivedAt ? po.receivedAt.split(' ')[0] : po.date,
            lastPoId: po.id,
            lastBillNumber: po.billNumber,
            billPhotoUrl: po.billPhotoUrl,
            unitCost: poItem.purchaseRate,
          });
        }
      });
    });

    return siteItems;
  },

  issueSiteStock: (
    stockId: string,
    issueQty: number,
    issuedTo: string,
    taskTitle?: string,
    remarks?: string
  ) => {
    let ledger = getStored<StockLedgerItem[]>(KEYS.STOCK_LEDGER, INITIAL_STOCK_LEDGER);
    let item = ledger.find((l) => l.id === stockId);

    // If item was derived from delivered PO, ensure it is persisted in ledger first
    if (!item) {
      const siteStocks = ERPService.getSiteStocks();
      const virtualItem = siteStocks.find((s) => s.id === stockId);
      if (virtualItem) {
        ledger = [...ledger, virtualItem];
        setStored(KEYS.STOCK_LEDGER, ledger);
        item = virtualItem;
      }
    }

    if (!item) throw new Error('Stock item not found');
    if (issueQty <= 0) throw new Error('Invalid quantity');
    if (issueQty > item.stockOnSite) throw new Error(`Cannot issue ${issueQty} ${item.unit}. Only ${item.stockOnSite} ${item.unit} available on site.`);

    const user = ERPService.getCurrentUser();
    ERPService.recordStockMovement({
      type: 'Issue',
      itemId: item.itemId,
      itemName: item.itemName,
      qty: issueQty,
      unit: item.unit,
      fromLocation: item.locationName,
      toLocation: taskTitle || `Site Task / Electrician (${issuedTo})`,
      jobId: item.jobId,
      responsibleUser: user.name,
      remarks: remarks || `Issued to ${issuedTo} for ${taskTitle || 'installation on site'}`,
    });
  },

  getStockMovements: (jobId?: string): StockMovement[] => {
    const movs = getStored<StockMovement[]>(KEYS.STOCK_MOVEMENTS, INITIAL_STOCK_MOVEMENTS);
    return jobId ? movs.filter((m) => m.jobId === jobId) : movs;
  },

  recordStockMovement: (
    movement: Omit<StockMovement, 'id' | 'date'>,
    meta?: {
      lastPoId?: string;
      lastBillNumber?: string;
      billPhotoUrl?: string;
      unitCost?: number;
      specification?: string;
    }
  ) => {
    const movs = getStored<StockMovement[]>(KEYS.STOCK_MOVEMENTS, INITIAL_STOCK_MOVEMENTS);
    const ledger = getStored<StockLedgerItem[]>(KEYS.STOCK_LEDGER, INITIAL_STOCK_LEDGER);

    const newMov: StockMovement = {
      ...movement,
      id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: new Date().toISOString().split('T')[0],
    };
    setStored(KEYS.STOCK_MOVEMENTS, [newMov, ...movs]);

    // Update or insert into stock ledger
    const existing = ledger.find(
      (l) =>
        (l.itemId === movement.itemId || l.itemName.toLowerCase() === movement.itemName.toLowerCase()) &&
        (movement.jobId ? l.jobId === movement.jobId : l.isUnallocated)
    );
    if (existing) {
      let rec = existing.receivedQty;
      let iss = existing.issuedQty;
      if (movement.type === 'Receive') rec += movement.qty;
      if (movement.type === 'Issue') iss += movement.qty;
      if (movement.type === 'Return') iss -= movement.qty;

      const updated = ledger.map((l) =>
        l.id === existing.id
          ? {
              ...l,
              receivedQty: rec,
              issuedQty: iss,
              stockOnSite: rec - iss,
              lastUpdated: newMov.date,
              lastPoId: meta?.lastPoId || l.lastPoId,
              lastBillNumber: meta?.lastBillNumber || l.lastBillNumber,
              billPhotoUrl: meta?.billPhotoUrl || l.billPhotoUrl,
              unitCost: meta?.unitCost || l.unitCost,
            }
          : l
      );
      setStored(KEYS.STOCK_LEDGER, updated);
    } else if (movement.type === 'Receive') {
      const newItem: StockLedgerItem = {
        id: `stk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        slNo: ledger.length + 1,
        itemId: movement.itemId,
        itemName: movement.itemName,
        specification: meta?.specification || '',
        unit: movement.unit,
        receivedQty: movement.qty,
        issuedQty: 0,
        stockOnSite: movement.qty,
        locationId: movement.toLocation.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        locationName: movement.toLocation,
        responsiblePerson: movement.responsibleUser || 'Store In-charge',
        jobId: movement.jobId,
        isUnallocated: !movement.jobId,
        minStockLevel: 0,
        lastUpdated: newMov.date,
        lastPoId: meta?.lastPoId,
        lastBillNumber: meta?.lastBillNumber,
        billPhotoUrl: meta?.billPhotoUrl,
        unitCost: meta?.unitCost,
      };
      setStored(KEYS.STOCK_LEDGER, [newItem, ...ledger]);
    }

    ERPService.addAuditLog('STOCK_MOVE', 'Stock', newMov.id, movement.jobId, undefined, `${movement.type} ${movement.qty} ${movement.unit} (${movement.itemName})`, movement.remarks);
  },

  // Site Tasks & Material Requests
  getTasks: (filter?: string | { jobId?: string; siteId?: string }): SiteTask[] => {
    const tasks = getStored<SiteTask[]>(KEYS.TASKS, INITIAL_TASKS);
    if (!filter) return tasks;
    if (typeof filter === 'string') {
      return tasks.filter((t) => t.jobId === filter || t.siteId === filter);
    }
    return tasks.filter((t) => {
      if (filter.jobId && t.jobId !== filter.jobId) return false;
      if (filter.siteId && t.siteId !== filter.siteId) return false;
      return true;
    });
  },

  createTask: (data: Partial<SiteTask> & { jobId: string; title: string }): SiteTask => {
    const tasks = getStored<SiteTask[]>(KEYS.TASKS, INITIAL_TASKS);
    const user = ERPService.getCurrentUser();
    const newTask: SiteTask = {
      id: `tsk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      jobId: data.jobId,
      jobTitle: data.jobTitle || 'Active Project Job',
      siteId: data.siteId,
      siteName: data.siteName,
      boqSectionId: data.boqSectionId,
      boqSectionTitle: data.boqSectionTitle,
      title: data.title,
      description: data.description || '',
      assignedSupervisor: data.assignedSupervisor || user.name,
      assignedWorkers: data.assignedWorkers || [],
      unit: data.unit || 'Nos',
      targetQty: Number(data.targetQty) || 1,
      completedQty: Number(data.completedQty) || 0,
      status: (data.status as any) || 'Pending',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      targetDate: data.targetDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      allowedMaterials: data.allowedMaterials || [],
      allocatedMaterials: data.allocatedMaterials || [],
      memberAssignments: data.memberAssignments || [],
      dailyLogs: data.dailyLogs || [],
    };
    setStored(KEYS.TASKS, [newTask, ...tasks]);
    ERPService.addAuditLog('CREATE_TASK', 'Task', newTask.id, newTask.jobId, undefined, newTask.title, `Site: ${newTask.siteName || newTask.siteId || 'General'}`);
    return newTask;
  },

  updateTask: (taskId: string, updates: Partial<SiteTask>): SiteTask | undefined => {
    const tasks = getStored<SiteTask[]>(KEYS.TASKS, INITIAL_TASKS);
    let updatedTask: SiteTask | undefined;
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        updatedTask = { ...t, ...updates };
        return updatedTask;
      }
      return t;
    });
    if (updatedTask) {
      setStored(KEYS.TASKS, updated);
      ERPService.addAuditLog('UPDATE_TASK', 'Task', taskId, updatedTask.jobId, undefined, updatedTask.title, 'Task details updated');
    }
    return updatedTask;
  },

  deleteTask: (taskId: string): void => {
    const tasks = getStored<SiteTask[]>(KEYS.TASKS, INITIAL_TASKS);
    const target = tasks.find((t) => t.id === taskId);
    setStored(KEYS.TASKS, tasks.filter((t) => t.id !== taskId));
    if (target) {
      ERPService.addAuditLog('DELETE_TASK', 'Task', taskId, target.jobId, undefined, target.title, 'Task deleted');
    }
  },

  allocateMaterialToTask: (
    taskId: string,
    material: Omit<TaskAllocatedMaterial, 'id' | 'allocatedAt'>
  ): TaskAllocatedMaterial => {
    const tasks = getStored<SiteTask[]>(KEYS.TASKS, INITIAL_TASKS);
    const newMat: TaskAllocatedMaterial = {
      ...material,
      id: `tam-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      allocatedAt: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
    };
    const updated = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            allocatedMaterials: [...(t.allocatedMaterials || []), newMat],
          }
        : t
    );
    setStored(KEYS.TASKS, updated);
    ERPService.addAuditLog('ALLOCATE_MATERIAL', 'Task', taskId, undefined, undefined, `${newMat.allocatedQty} ${newMat.unit} ${newMat.itemName}`, `Allocated for task`);
    return newMat;
  },

  removeMaterialFromTask: (taskId: string, materialId: string): void => {
    const tasks = getStored<SiteTask[]>(KEYS.TASKS, INITIAL_TASKS);
    const updated = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            allocatedMaterials: (t.allocatedMaterials || []).filter((m) => m.id !== materialId),
          }
        : t
    );
    setStored(KEYS.TASKS, updated);
  },

  assignMemberToTask: (
    taskId: string,
    assignment: Omit<TaskMemberAssignment, 'id'>
  ): TaskMemberAssignment => {
    const tasks = getStored<SiteTask[]>(KEYS.TASKS, INITIAL_TASKS);
    const newAssignment: TaskMemberAssignment = {
      ...assignment,
      id: `tma-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: assignment.status || 'Scheduled',
    };
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const workerLabel = `${newAssignment.memberName} (${newAssignment.role})`;
        const assignedWorkers = Array.from(new Set([...t.assignedWorkers, workerLabel]));
        return {
          ...t,
          assignedWorkers,
          memberAssignments: [...(t.memberAssignments || []), newAssignment],
        };
      }
      return t;
    });
    setStored(KEYS.TASKS, updated);
    ERPService.addAuditLog('ASSIGN_MEMBER', 'Task', taskId, undefined, undefined, `${newAssignment.memberName} on ${newAssignment.assignedDate}`, `Scheduled: ${newAssignment.shiftOrHours || 'Regular'}`);
    return newAssignment;
  },

  removeMemberFromTask: (taskId: string, assignmentId: string): void => {
    const tasks = getStored<SiteTask[]>(KEYS.TASKS, INITIAL_TASKS);
    const updated = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            memberAssignments: (t.memberAssignments || []).filter((a) => a.id !== assignmentId),
          }
        : t
    );
    setStored(KEYS.TASKS, updated);
  },

  logTaskProgress: (taskId: string, completedQtyToday: number, notes: string) => {
    const tasks = getStored<SiteTask[]>(KEYS.TASKS, INITIAL_TASKS);
    const user = ERPService.getCurrentUser();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newCompleted = Math.min(task.targetQty, task.completedQty + completedQtyToday);
    const newStatus = newCompleted >= task.targetQty ? 'Completed' : 'In Progress';

    const updated = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            completedQty: newCompleted,
            status: newStatus as any,
            dailyLogs: [
              ...t.dailyLogs,
              {
                id: `log-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                completedQtyToday,
                supervisorName: user.name,
                notes,
              },
            ],
          }
        : t
    );
    setStored(KEYS.TASKS, updated);
    ERPService.addAuditLog('LOG_TASK_PROGRESS', 'Task', taskId, task.jobId, `${task.completedQty}`, `${newCompleted}`, notes);
  },

  getMaterialRequests: (jobId?: string): MaterialRequest[] => {
    const requests = getStored<MaterialRequest[]>(KEYS.MATERIAL_REQUESTS, INITIAL_MATERIAL_REQUESTS);
    return jobId ? requests.filter((r) => r.jobId === jobId) : requests;
  },

  requestExtraMaterial: (data: Omit<MaterialRequest, 'id' | 'status' | 'requestedAt' | 'requestedBy'>): MaterialRequest => {
    const requests = getStored<MaterialRequest[]>(KEYS.MATERIAL_REQUESTS, INITIAL_MATERIAL_REQUESTS);
    const user = ERPService.getCurrentUser();
    const newReq: MaterialRequest = {
      ...data,
      id: `mr-${Date.now()}`,
      status: 'Pending',
      requestedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      requestedBy: `${user.name} (${user.role})`,
    };
    setStored(KEYS.MATERIAL_REQUESTS, [newReq, ...requests]);

    ERPService.addAuditLog('EXTRA_MATERIAL_REQUEST', 'MaterialRequest', newReq.id, newReq.jobId, undefined, `Requested +${newReq.requestedExtraQty} ${newReq.unit} (${newReq.itemName})`, newReq.reason);
    ERPService.addNotification('Extra Material Requested', `Supervisor requested +${newReq.requestedExtraQty} ${newReq.unit} for ${newReq.itemName} on ${newReq.jobId}`, 'warning', `/tasks`, newReq.jobId);
    return newReq;
  },

  approveMaterialRequest: (reqId: string, reason: string) => {
    const requests = getStored<MaterialRequest[]>(KEYS.MATERIAL_REQUESTS, INITIAL_MATERIAL_REQUESTS);
    const user = ERPService.getCurrentUser();
    const req = requests.find((r) => r.id === reqId);
    if (!req) return;

    const updated = requests.map((r) =>
      r.id === reqId
        ? {
            ...r,
            status: 'Approved' as const,
            approvedBy: user.name,
            approvedAt: new Date().toLocaleString('en-IN'),
            adminNotes: reason,
          }
        : r
    );
    setStored(KEYS.MATERIAL_REQUESTS, updated);

    ERPService.addAuditLog('APPROVE', 'MaterialRequest', reqId, req.jobId, 'Pending', 'Approved', reason);
    ERPService.addNotification('Material Request Approved', `Request for +${req.requestedExtraQty} ${req.unit} ${req.itemName} was approved.`, 'success', `/tasks`, req.jobId);
  },

  // Employees & Attendance
  getEmployees: (): Employee[] => {
    return getStored<Employee[]>(KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
  },

  getAttendance: (jobId?: string): AttendanceRecord[] => {
    const atts = getStored<AttendanceRecord[]>(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    return jobId ? atts.filter((a) => a.jobId === jobId) : atts;
  },

  recordAttendance: (record: Omit<AttendanceRecord, 'id' | 'dailyCost'>): AttendanceRecord => {
    const atts = getStored<AttendanceRecord[]>(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    const employees = ERPService.getEmployees();
    const emp = employees.find((e) => e.id === record.employeeId);
    const baseWage = emp ? emp.dailyWage : 800;

    let dailyCost = baseWage;
    if (record.status === 'Half Day') dailyCost = baseWage * 0.5;
    if (record.status === 'Absent') dailyCost = 0;
    if (record.status === 'Overtime') dailyCost = baseWage * 1.4;

    const newRecord: AttendanceRecord = {
      ...record,
      id: `att-${Date.now()}`,
      dailyCost,
    };
    setStored(KEYS.ATTENDANCE, [newRecord, ...atts]);

    // Recalculate job spend
    ERPService.recalculateJobSpend(record.jobId);
    ERPService.addAuditLog('ATTENDANCE', 'Employee', record.employeeId, record.jobId, undefined, `${record.employeeName} (${record.status})`, `Recorded by ${record.recordedBy}`);
    return newRecord;
  },

  // Expenses & Accounts
  getExpenses: (jobId?: string): ExpenseRecord[] => {
    const exps = getStored<ExpenseRecord[]>(KEYS.EXPENSES, INITIAL_EXPENSES);
    return jobId ? exps.filter((e) => e.jobId === jobId) : exps;
  },

  createExpense: (expense: Omit<ExpenseRecord, 'id'>): ExpenseRecord => {
    const exps = getStored<ExpenseRecord[]>(KEYS.EXPENSES, INITIAL_EXPENSES);
    const newExp: ExpenseRecord = {
      ...expense,
      id: `exp-${Date.now()}`,
    };
    setStored(KEYS.EXPENSES, [newExp, ...exps]);

    if (expense.jobId) {
      ERPService.recalculateJobSpend(expense.jobId);
    }

    ERPService.addAuditLog('EXPENSE', 'Expense', newExp.id, expense.jobId, undefined, `₹${expense.amount} (${expense.category})`, expense.notes);
    return newExp;
  },

  getPettyCashAccounts: (): PettyCashAccount[] => {
    return getStored<PettyCashAccount[]>(KEYS.PETTY_CASH, INITIAL_PETTY_CASH);
  },

  // Invoices & Billing
  getInvoices: (jobId?: string): ClientInvoice[] => {
    const invs = getStored<ClientInvoice[]>(KEYS.INVOICES, INITIAL_INVOICES);
    return jobId ? invs.filter((i) => i.jobId === jobId) : invs;
  },

  createInvoice: (invoiceData: Omit<ClientInvoice, 'id' | 'paidAmount' | 'balanceDue' | 'status'>): ClientInvoice => {
    const invs = getStored<ClientInvoice[]>(KEYS.INVOICES, INITIAL_INVOICES);
    const nextNum = invs.length + 1;
    const padded = String(nextNum).padStart(4, '0');
    const newId = `INV-2026-${padded}`;
    const newInv: ClientInvoice = {
      ...invoiceData,
      id: newId,
      paidAmount: 0,
      balanceDue: invoiceData.grandTotal,
      status: 'Sent',
    };
    setStored(KEYS.INVOICES, [newInv, ...invs]);
    ERPService.addAuditLog('CREATE', 'Invoice', newId, newInv.jobId, undefined, `₹${newInv.grandTotal.toLocaleString('en-IN')}`, `Billed to ${newInv.clientName}`);
    return newInv;
  },

  recordPayment: (payment: Omit<ClientPayment, 'id'>) => {
    const payments = getStored<ClientPayment[]>(KEYS.PAYMENTS, INITIAL_PAYMENTS);
    const invs = getStored<ClientInvoice[]>(KEYS.INVOICES, INITIAL_INVOICES);
    const newPay: ClientPayment = {
      ...payment,
      id: `pay-${Date.now()}`,
    };
    setStored(KEYS.PAYMENTS, [newPay, ...payments]);

    // Update invoice balance
    const updatedInvs = invs.map((inv) => {
      if (inv.id === payment.invoiceId) {
        const newPaid = inv.paidAmount + payment.amount;
        const newBal = Math.max(0, inv.grandTotal - newPaid);
        const newStatus: ClientInvoice['status'] = newBal === 0 ? 'Paid' : 'Partially Paid';
        return {
          ...inv,
          paidAmount: newPaid,
          balanceDue: newBal,
          status: newStatus,
        };
      }
      return inv;
    });
    setStored(KEYS.INVOICES, updatedInvs);

    ERPService.addAuditLog('PAYMENT', 'Payment', newPay.id, payment.jobId, undefined, `Received ₹${payment.amount} (${payment.mode})`, `Ref: ${payment.referenceNumber}`);
  },

  // Price History
  recordPriceHistory: (
    itemId: string,
    itemName: string,
    vendorId: string,
    vendorName: string,
    rate: number,
    qty: number,
    unit: any,
    jobId: string
  ) => {
    const history = getStored<PriceHistoryRecord[]>(KEYS.PRICE_HISTORY, INITIAL_PRICE_HISTORY);
    const newRecord: PriceHistoryRecord = {
      id: `ph-${Date.now()}`,
      itemId,
      itemName,
      vendorId,
      vendorName,
      rate,
      qty,
      unit,
      date: new Date().toISOString().split('T')[0],
      jobId,
    };
    setStored(KEYS.PRICE_HISTORY, [newRecord, ...history]);
  },

  getPriceHistory: (itemId?: string, jobId?: string): PriceHistoryRecord[] => {
    const list = getStored<PriceHistoryRecord[]>(KEYS.PRICE_HISTORY, INITIAL_PRICE_HISTORY);
    return list.filter((p) => {
      if (itemId && p.itemId !== itemId) return false;
      if (jobId && p.jobId !== jobId) return false;
      return true;
    });
  },

  // Recalculate Job Spend dynamically
  recalculateJobSpend: (jobId: string) => {
    const pos = ERPService.getPurchases(jobId).filter((p) => p.status === 'Approved' || p.status === 'Delivered');
    const atts = ERPService.getAttendance(jobId);
    const exps = ERPService.getExpenses(jobId);

    const purchaseTotal = pos.reduce((sum, p) => sum + p.grandTotal, 0);
    const laborTotal = atts.reduce((sum, a) => sum + a.dailyCost, 0);
    const expenseTotal = exps.reduce((sum, e) => sum + e.amount, 0);

    const totalSpend = purchaseTotal + laborTotal + expenseTotal;

    const jobs = ERPService.getJobs();
    const updated = jobs.map((j) => (j.id === jobId ? { ...j, actualSpend: totalSpend } : j));
    setStored(KEYS.JOBS, updated);
  },

  getClients: (): Client[] => getStored<Client[]>(KEYS.CLIENTS, []),

  addClient: (
    clientData: Omit<Client, 'id' | 'totalBilled' | 'totalPaid' | 'outstandingBalance'> & {
      createDefaultSite?: boolean;
      defaultSiteName?: string;
      defaultSiteCity?: string;
    }
  ): { client: Client; defaultSite?: ClientSite } => {
    const clients = ERPService.getClients();
    const newId = `cli-${Date.now()}`;
    const newClient: Client = {
      id: newId,
      companyName: clientData.companyName,
      contactPerson: clientData.contactPerson,
      email: clientData.email,
      phone: clientData.phone,
      address: clientData.address,
      gstNumber: clientData.gstNumber,
      totalBilled: 0,
      totalPaid: 0,
      outstandingBalance: 0,
      sites: [],
    };

    let defaultSite: ClientSite | undefined;
    if (clientData.createDefaultSite) {
      const siteName = clientData.defaultSiteName?.trim() || `${newClient.companyName} - Main Site`;
      const siteLocation = clientData.address?.trim() || 'Head Office / Main Site';
      const city = clientData.defaultSiteCity?.trim() || 'Chennai';
      defaultSite = {
        id: `site-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        clientId: newId,
        clientName: newClient.companyName,
        siteName: siteName,
        siteLocation: siteLocation,
        city: city,
        siteEngineerName: clientData.contactPerson || 'Assigned Engineer',
        siteSupervisorName: 'Murugan P',
        contactPhone: clientData.phone || '',
        activeJobIds: [],
        createdAt: new Date().toISOString().split('T')[0],
      };
      newClient.sites = [defaultSite];

      const sites = ERPService.getClientSites();
      setStored(KEYS.CLIENT_SITES, [defaultSite, ...sites]);
    }

    setStored(KEYS.CLIENTS, [newClient, ...clients]);
    ERPService.addAuditLog(
      'CREATE_CLIENT',
      'Client',
      newClient.id,
      undefined,
      undefined,
      newClient.companyName,
      defaultSite ? `New client registered with default site: ${defaultSite.siteName}` : 'New client registered'
    );

    return { client: newClient, defaultSite };
  },

  deleteClient: (clientId: string): void => {
    const clients = ERPService.getClients();
    const target = clients.find((c) => c.id === clientId);
    setStored(KEYS.CLIENTS, clients.filter((c) => c.id !== clientId));
    if (target) {
      ERPService.addAuditLog('DELETE_CLIENT', 'Client', clientId, undefined, undefined, target.companyName, 'Client deleted');
    }
  },
  
  getClientSites: (clientId?: string): ClientSite[] => {
    const sites = getStored<ClientSite[]>(KEYS.CLIENT_SITES, []);
    return clientId ? sites.filter((s) => s.clientId === clientId) : sites;
  },

  getClientSiteById: (siteId: string): ClientSite | undefined => {
    const sites = ERPService.getClientSites();
    return sites.find((s) => s.id === siteId);
  },

  addClientSite: (siteData: Omit<ClientSite, 'id' | 'createdAt'>): ClientSite => {
    const sites = ERPService.getClientSites();
    const newSite: ClientSite = {
      ...siteData,
      id: `site-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString().split('T')[0],
      activeJobIds: siteData.activeJobIds || [],
    };
    const updated = [newSite, ...sites];
    setStored(KEYS.CLIENT_SITES, updated);

    // Also attach to client
    const clients = ERPService.getClients();
    const updatedClients = clients.map((c) =>
      c.id === siteData.clientId ? { ...c, sites: [...(c.sites || []), newSite] } : c
    );
    setStored(KEYS.CLIENTS, updatedClients);

    ERPService.addAuditLog('CREATE_SITE', 'ClientSite', newSite.id, undefined, undefined, newSite.siteName, `New site registered for client ${siteData.clientName}`);
    return newSite;
  },

  updateClientSite: (siteId: string, updates: Partial<ClientSite>): ClientSite | undefined => {
    const sites = ERPService.getClientSites();
    let updatedSite: ClientSite | undefined;
    const updatedSites = sites.map((s) => {
      if (s.id === siteId) {
        updatedSite = { ...s, ...updates };
        return updatedSite;
      }
      return s;
    });
    setStored(KEYS.CLIENT_SITES, updatedSites);

    const clients = ERPService.getClients();
    const updatedClients = clients.map((c) => ({
      ...c,
      sites: (c.sites || []).map((s) => (s.id === siteId ? { ...s, ...updates } : s)),
    }));
    setStored(KEYS.CLIENTS, updatedClients);

    return updatedSite;
  },

  deleteClientSite: (siteId: string): void => {
    const sites = ERPService.getClientSites();
    const target = sites.find((s) => s.id === siteId);
    setStored(KEYS.CLIENT_SITES, sites.filter((s) => s.id !== siteId));
    const clients = ERPService.getClients();
    const updatedClients = clients.map((c) => ({
      ...c,
      sites: (c.sites || []).filter((s) => s.id !== siteId),
    }));
    setStored(KEYS.CLIENTS, updatedClients);
    if (target) {
      ERPService.addAuditLog('DELETE_SITE', 'ClientSite', siteId, undefined, undefined, target.siteName, 'Site deleted');
    }
  },

  getJobsForSite: (siteId: string): Job[] => {
    const jobs = ERPService.getJobs();
    const site = ERPService.getClientSiteById(siteId);
    return jobs.filter((j) => {
      if (j.siteId === siteId) return true;
      if (site && (j.siteLocation === site.siteLocation || j.title.toLowerCase().includes(site.siteName.toLowerCase()))) return true;
      if (site?.activeJobIds?.includes(j.id)) return true;
      return false;
    });
  },

  getSiteStocksForSite: (siteId: string): StockLedgerItem[] => {
    const site = ERPService.getClientSiteById(siteId);
    const jobs = ERPService.getJobsForSite(siteId);
    const jobIds = jobs.map((j) => j.id);
    const ledger = ERPService.getStockLedger();

    return ledger.filter((l) => {
      if (l.jobId && jobIds.includes(l.jobId)) return true;
      if (site && l.locationName && (l.locationName.toLowerCase().includes(site.siteName.toLowerCase()) || (site.siteLocation && l.locationName.toLowerCase().includes(site.siteLocation.toLowerCase())))) return true;
      return false;
    });
  },

  createSiteMaterialIndent: (indentData: {
    siteId: string;
    siteName: string;
    jobId: string;
    jobTitle?: string;
    itemId?: string;
    itemName: string;
    specification?: string;
    unit: MeasurementUnit;
    requestedQty: number;
    urgency?: 'Normal' | 'High' | 'Critical';
    neededByDate?: string;
    taskTitle?: string;
    reason: string;
    targetDestination?: 'Warehouse' | 'Admin' | 'DirectPO';
    siteEngineerName?: string;
  }): MaterialRequest => {
    const user = ERPService.getCurrentUser();
    const requests = getStored<MaterialRequest[]>(KEYS.MATERIAL_REQUESTS, INITIAL_MATERIAL_REQUESTS);
    const newId = `req-site-${Date.now()}`;
    // Look up BOQ limit if available for this job & item
    let boqAllowedQty = 0;
    let boqOrderedQty = 0;
    if (indentData.jobId) {
      const procurable = ERPService.getJobProcurementItems(indentData.jobId);
      const match = procurable.find(
        (p) =>
          (indentData.itemId && (p.itemId === indentData.itemId || p.boqLineId === indentData.itemId)) ||
          p.name.toLowerCase().trim() === indentData.itemName.toLowerCase().trim() ||
          indentData.itemName.toLowerCase().includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(indentData.itemName.toLowerCase())
      );
      if (match) {
        boqAllowedQty = match.targetQty;
        boqOrderedQty = match.orderedQty;
      }
    }

    const newReq: MaterialRequest = {
      id: newId,
      siteId: indentData.siteId,
      siteName: indentData.siteName,
      jobId: indentData.jobId,
      jobTitle: indentData.jobTitle,
      siteEngineerName: indentData.siteEngineerName || user.name,
      targetDestination: indentData.targetDestination || 'Warehouse',
      requestType: 'SiteRequisition',
      urgency: indentData.urgency || 'Normal',
      neededByDate: indentData.neededByDate,
      taskTitle: indentData.taskTitle,
      itemId: indentData.itemId || `itm-custom-${Date.now()}`,
      itemName: indentData.itemName,
      specification: indentData.specification || '',
      unit: indentData.unit,
      allowedQty: boqAllowedQty,
      alreadyIssuedQty: boqOrderedQty,
      requestedExtraQty: indentData.requestedQty,
      reason: indentData.reason,
      usageHistory: `Requested by Site Engineer (${indentData.siteEngineerName || user.name}) for ${indentData.siteName}`,
      requestedBy: user.name,
      requestedAt: new Date().toISOString().split('T')[0],
      status: 'Pending',
    };

    setStored(KEYS.MATERIAL_REQUESTS, [newReq, ...requests]);
    const routeText = indentData.targetDestination === 'Admin' ? 'Admin / Head Office' : 'Central Warehouse';
    ERPService.addNotification(
      'New Site Material Indent',
      `Site Engineer ${indentData.siteEngineerName || user.name} requested ${indentData.requestedQty} ${indentData.unit} of "${indentData.itemName}" for ${indentData.siteName} (Route: ${routeText}).`,
      'warning',
      `/sites?siteId=${indentData.siteId}&tab=indents`,
      indentData.jobId
    );
    ERPService.addAuditLog('SITE_INDENT', 'MaterialRequest', newId, indentData.jobId, 'Draft', 'Pending', `Site indent raised for ${indentData.itemName} to ${routeText}`);
    return newReq;
  },

  approveSiteMaterialIndent: (requestId: string, adminNotes?: string): MaterialRequest => {
    const user = ERPService.getCurrentUser();
    const requests = getStored<MaterialRequest[]>(KEYS.MATERIAL_REQUESTS, INITIAL_MATERIAL_REQUESTS);
    const req = requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Request not found');

    const updated = requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: 'Approved' as const,
            approvedBy: user.name,
            approvedAt: new Date().toISOString().split('T')[0],
            adminNotes: adminNotes || 'Approved by Admin for procurement',
          }
        : r
    );
    setStored(KEYS.MATERIAL_REQUESTS, updated);

    ERPService.addNotification(
      'Site Material Indent Approved',
      `Admin approved material indent for ${req.requestedExtraQty} ${req.unit} of "${req.itemName}" (${req.siteName || req.jobId}). Ready for Purchase Order.`,
      'success',
      `/sites?siteId=${req.siteId || ''}&tab=indents`,
      req.jobId
    );
    ERPService.addAuditLog('APPROVE_INDENT', 'MaterialRequest', req.id, req.jobId, 'Pending', 'Approved', adminNotes);
    return updated.find((r) => r.id === requestId)!;
  },

  moveSiteIndentToPurchase: (requestId: string, adminNotes?: string): MaterialRequest => {
    const user = ERPService.getCurrentUser();
    const requests = getStored<MaterialRequest[]>(KEYS.MATERIAL_REQUESTS, INITIAL_MATERIAL_REQUESTS);
    const req = requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Request not found');

    const updated = requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: 'Moved to Purchase' as const,
            adminNotes: adminNotes || 'Admin transferred this site requisition to Purchase Order generation',
            approvedBy: user.name,
            approvedAt: new Date().toISOString().split('T')[0],
          }
        : r
    );
    setStored(KEYS.MATERIAL_REQUESTS, updated);

    ERPService.addNotification(
      'Site Indent Moved to Purchase',
      `Admin approved and moved site requisition for ${req.requestedExtraQty} ${req.unit} of "${req.itemName}" (${req.siteName || req.jobId}) to Purchase Order issue.`,
      'info',
      `/purchases?tab=orders`,
      req.jobId
    );
    ERPService.addAuditLog('MOVE_TO_PURCHASE', 'MaterialRequest', req.id, req.jobId, req.status, 'Moved to Purchase', adminNotes);
    return updated.find((r) => r.id === requestId)!;
  },

  dispatchSiteIndentFromWarehouse: (
    requestId: string,
    dispatchDataOrWhName?:
      | {
          warehouseName?: string;
          dispatchQty?: number;
          transportCost?: number;
          vehicleNumber?: string;
          driverOrContact?: string;
          dispatchChallanNumber?: string;
          notes?: string;
        }
      | string,
    legacyNotes?: string
  ): MaterialRequest => {
    const user = ERPService.getCurrentUser();
    const requests = getStored<MaterialRequest[]>(KEYS.MATERIAL_REQUESTS, INITIAL_MATERIAL_REQUESTS);
    const req = requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Request not found');

    const isObj = typeof dispatchDataOrWhName === 'object' && dispatchDataOrWhName !== null;
    const fromWh = isObj
      ? dispatchDataOrWhName.warehouseName || 'Central Warehouse (Ambattur)'
      : typeof dispatchDataOrWhName === 'string'
      ? dispatchDataOrWhName
      : 'Central Warehouse (Ambattur)';

    const dispatchQty = isObj && dispatchDataOrWhName.dispatchQty != null
      ? Number(dispatchDataOrWhName.dispatchQty)
      : req.requestedExtraQty;

    const transportCost = isObj && dispatchDataOrWhName.transportCost != null
      ? Number(dispatchDataOrWhName.transportCost)
      : 0;

    const vehicleNumber = isObj ? dispatchDataOrWhName.vehicleNumber || '' : '';
    const driverOrContact = isObj ? dispatchDataOrWhName.driverOrContact || '' : '';
    const dispatchChallanNumber = isObj ? dispatchDataOrWhName.dispatchChallanNumber || '' : '';
    const notes = isObj ? dispatchDataOrWhName.notes || '' : legacyNotes || '';

    const today = new Date().toISOString().split('T')[0];

    // Decrement stock from warehouse in stock ledger
    let ledger = getStored<StockLedgerItem[]>(KEYS.STOCK_LEDGER, INITIAL_STOCK_LEDGER);
    if ((!ledger || ledger.length === 0) && INITIAL_STOCK_LEDGER.length > 0) {
      ledger = INITIAL_STOCK_LEDGER;
    }
    let stockFound = false;
    const updatedLedger = ledger.map((item) => {
      const match =
        (item.isUnallocated || (item.locationName && item.locationName.toLowerCase().includes('warehouse')) || item.locationName === fromWh) &&
        (item.itemId === req.itemId || item.itemName.toLowerCase() === req.itemName.toLowerCase());
      if (match && !stockFound) {
        stockFound = true;
        const newIssued = (item.issuedQty || 0) + dispatchQty;
        const newStock = Math.max(0, (item.stockOnSite || 0) - dispatchQty);
        return {
          ...item,
          issuedQty: newIssued,
          stockOnSite: newStock,
          lastUpdated: today,
        };
      }
      return item;
    });
    setStored(KEYS.STOCK_LEDGER, updatedLedger);

    // Record stock movement (Transfer)
    ERPService.recordStockMovement(
      {
        type: 'Transfer',
        itemId: req.itemId,
        itemName: req.itemName,
        qty: dispatchQty,
        unit: req.unit,
        fromLocation: fromWh,
        toLocation: req.siteName || `Site Store (${req.jobId})`,
        jobId: req.jobId,
        responsibleUser: user.name,
        remarks: `Dispatched Indent #${req.id} (${dispatchQty} ${req.unit} of ${req.itemName}) to ${req.siteName || req.jobId}. Challan: ${dispatchChallanNumber || 'N/A'}, Vehicle: ${vehicleNumber || 'N/A'}. Transport Freight: ₹${transportCost}`,
      },
      {
        specification: req.specification,
      }
    );

    // If transport cost is provided, automatically record it under Job Expenses (Category: Transportation)
    if (transportCost > 0) {
      ERPService.createExpense({
        jobId: req.jobId,
        category: 'Transportation',
        amount: transportCost,
        paidBy: user.name,
        date: today,
        receiptNumber: dispatchChallanNumber || `TRN-${Date.now().toString(36).toUpperCase()}`,
        notes: `Transport & Freight charges for material dispatch (Indent #${req.id}: ${dispatchQty} ${req.unit} ${req.itemName}). Vehicle: ${vehicleNumber || 'N/A'}, Driver: ${driverOrContact || 'N/A'}`,
        status: 'Approved',
        isOverhead: false,
        approvedBy: user.name,
      });
    }

    const updated = requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: 'Dispatched from Warehouse' as const,
            dispatchedFrom: fromWh,
            dispatchedAt: today,
            transportCost: transportCost,
            vehicleNumber: vehicleNumber,
            driverOrContact: driverOrContact,
            dispatchChallanNumber: dispatchChallanNumber,
            adminNotes: notes || `Dispatched from ${fromWh} via ${vehicleNumber || 'transport'}. Freight: ₹${transportCost}`,
          }
        : r
    );
    setStored(KEYS.MATERIAL_REQUESTS, updated);

    ERPService.addNotification(
      'Material Dispatched from Warehouse',
      `${dispatchQty} ${req.unit} of "${req.itemName}" dispatched from ${fromWh} for ${req.siteName || req.jobId} (Challan: ${dispatchChallanNumber || 'N/A'}, Vehicle: ${vehicleNumber || 'N/A'}). Freight: ₹${transportCost}.`,
      'success',
      `/sites?siteId=${req.siteId || ''}&tab=indents`,
      req.jobId
    );
    ERPService.addAuditLog(
      'DISPATCH_FROM_WAREHOUSE',
      'MaterialRequest',
      req.id,
      req.jobId,
      req.status,
      'Dispatched from Warehouse',
      `From ${fromWh} to ${req.siteName || req.jobId}. Transport Cost: ₹${transportCost}, DC: ${dispatchChallanNumber}`
    );
    window.dispatchEvent(new Event('apex_storage_update'));
    return updated.find((r) => r.id === requestId)!;
  },

  acknowledgeSiteMaterialReceivedByEngineer: (
    requestId: string,
    receiveDataOrEngName?:
      | {
          engineerName?: string;
          receivedQty?: number;
          deliveryProofPhotoUrl?: string;
          notes?: string;
        }
      | string,
    legacyNotes?: string
  ): MaterialRequest => {
    const user = ERPService.getCurrentUser();
    const requests = getStored<MaterialRequest[]>(KEYS.MATERIAL_REQUESTS, INITIAL_MATERIAL_REQUESTS);
    const req = requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Request not found');

    const isObj = typeof receiveDataOrEngName === 'object' && receiveDataOrEngName !== null;
    const eng = isObj
      ? receiveDataOrEngName.engineerName || req.siteEngineerName || user.name
      : typeof receiveDataOrEngName === 'string'
      ? receiveDataOrEngName
      : req.siteEngineerName || user.name;

    const receivedQty = isObj && receiveDataOrEngName.receivedQty != null
      ? Number(receiveDataOrEngName.receivedQty)
      : req.requestedExtraQty;

    const deliveryProofPhotoUrl = isObj ? receiveDataOrEngName.deliveryProofPhotoUrl : undefined;
    const notes = isObj ? receiveDataOrEngName.notes || '' : legacyNotes || '';

    const today = new Date().toISOString().split('T')[0];

    // Inward stock into Site Store in stock ledger
    let ledger = getStored<StockLedgerItem[]>(KEYS.STOCK_LEDGER, INITIAL_STOCK_LEDGER);
    if ((!ledger || ledger.length === 0) && INITIAL_STOCK_LEDGER.length > 0) {
      ledger = INITIAL_STOCK_LEDGER;
    }
    const existingSiteItem = ledger.find(
      (l) =>
        (l.jobId === req.jobId || (req.siteId && l.locationId === req.siteId) || (l.locationName && l.locationName.toLowerCase().includes('site'))) &&
        (l.itemId === req.itemId || l.itemName.toLowerCase() === req.itemName.toLowerCase())
    );

    let updatedLedger: StockLedgerItem[];
    if (existingSiteItem) {
      updatedLedger = ledger.map((l) =>
        l.id === existingSiteItem.id
          ? {
              ...l,
              receivedQty: (l.receivedQty || 0) + receivedQty,
              stockOnSite: (l.stockOnSite || 0) + receivedQty,
              lastUpdated: today,
              billPhotoUrl: deliveryProofPhotoUrl || l.billPhotoUrl,
            }
          : l
      );
    } else {
      const newSiteItem: StockLedgerItem = {
        id: `stk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        slNo: ledger.length + 1,
        itemId: req.itemId,
        itemName: req.itemName,
        specification: req.specification || '',
        unit: req.unit,
        receivedQty: receivedQty,
        issuedQty: 0,
        stockOnSite: receivedQty,
        locationId: req.siteId || 'site-store',
        locationName: `${req.siteName || 'Site Store'} (Site Stock)`,
        responsiblePerson: eng,
        jobId: req.jobId,
        isUnallocated: false,
        minStockLevel: 0,
        lastUpdated: today,
        billPhotoUrl: deliveryProofPhotoUrl,
      };
      updatedLedger = [newSiteItem, ...ledger];
    }
    setStored(KEYS.STOCK_LEDGER, updatedLedger);

    // Record stock movement (Receive)
    ERPService.recordStockMovement(
      {
        type: 'Receive',
        itemId: req.itemId,
        itemName: req.itemName,
        qty: receivedQty,
        unit: req.unit,
        fromLocation: req.dispatchedFrom || 'Central Warehouse (Ambattur)',
        toLocation: req.siteName || `Site Store (${req.jobId})`,
        jobId: req.jobId,
        responsibleUser: eng,
        remarks: `Received & inwarded by Site Engineer ${eng}. Proof attached: ${deliveryProofPhotoUrl ? 'YES' : 'NO'}. ${notes}`,
      },
      {
        specification: req.specification,
        billPhotoUrl: deliveryProofPhotoUrl,
      }
    );

    const updated = requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: 'Received by Site Engineer' as const,
            receivedByEngineerName: eng,
            receivedByEngineerAt: today,
            receivedQty: receivedQty,
            deliveryProofPhotoUrl: deliveryProofPhotoUrl,
            receivedRemarks: notes,
            adminNotes: notes ? `${r.adminNotes || ''} | Received by Engineer: ${notes}` : r.adminNotes,
          }
        : r
    );
    setStored(KEYS.MATERIAL_REQUESTS, updated);

    ERPService.addNotification(
      'Material Received by Site Engineer',
      `Site Engineer ${eng} acknowledged and inwarded ${receivedQty} ${req.unit} of "${req.itemName}" into site store at ${req.siteName || req.jobId}. Proof attached and verified!`,
      'success',
      `/sites?siteId=${req.siteId || ''}&tab=indents`,
      req.jobId
    );
    ERPService.addAuditLog(
      'SITE_ENGINEER_RECEIPT',
      'MaterialRequest',
      req.id,
      req.jobId,
      req.status,
      'Received by Site Engineer',
      `Handed over to ${eng}. Proof attached: ${Boolean(deliveryProofPhotoUrl)}`
    );
    window.dispatchEvent(new Event('apex_storage_update'));
    return updated.find((r) => r.id === requestId)!;
  },

  rejectSiteMaterialIndent: (requestId: string, reason: string): MaterialRequest => {
    const user = ERPService.getCurrentUser();
    const requests = getStored<MaterialRequest[]>(KEYS.MATERIAL_REQUESTS, INITIAL_MATERIAL_REQUESTS);
    const req = requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Request not found');

    const updated = requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: 'Rejected' as const,
            adminNotes: reason,
          }
        : r
    );
    setStored(KEYS.MATERIAL_REQUESTS, updated);
    ERPService.addAuditLog('REJECT_INDENT', 'MaterialRequest', req.id, req.jobId, 'Pending', 'Rejected', reason);
    return updated.find((r) => r.id === requestId)!;
  },
  getVendors: (): Vendor[] => {
    return getStored<Vendor[]>(KEYS.VENDORS, []);
  },
  getItems: (): ItemMaster[] => {
    return getStored<ItemMaster[]>(KEYS.ITEMS, []);
  },
  addItem: (itemData: Partial<ItemMaster> & { name: string; unit: MeasurementUnit }): ItemMaster => {
    const items = ERPService.getItems();
    const maxSlNo = items.reduce((max, i) => Math.max(max, i.slNo || 0), 0);
    const newSlNo = maxSlNo + 1;
    const newItem: ItemMaster = {
      id: `itm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      slNo: itemData.slNo || newSlNo,
      name: itemData.name.trim(),
      specification: itemData.specification || '',
      category: itemData.category || 'Electrical Accessories',
      unit: itemData.unit,
      minStockLevel: Number(itemData.minStockLevel) || 0,
      standardCost: Number(itemData.standardCost) || 0,
      currentStock: Number(itemData.currentStock) || 0,
    };
    const updated = [...items, newItem];
    setStored(KEYS.ITEMS, updated);

    // Also register in stock ledger
    const ledger = getStored<StockLedgerItem[]>(KEYS.STOCK_LEDGER, INITIAL_STOCK_LEDGER);
    const newLedgerItem: StockLedgerItem = {
      id: `stk-${newItem.id}`,
      slNo: newItem.slNo || 0,
      itemId: newItem.id,
      itemName: newItem.name,
      specification: newItem.specification || '',
      unit: newItem.unit,
      receivedQty: newItem.currentStock || 0,
      issuedQty: 0,
      stockOnSite: newItem.currentStock || 0,
      locationId: 'loc-01',
      locationName: 'Central Warehouse (Ambattur)',
      responsiblePerson: 'Store Manager',
      isUnallocated: true,
      minStockLevel: newItem.minStockLevel || 0,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setStored(KEYS.STOCK_LEDGER, [newLedgerItem, ...ledger]);

    ERPService.addAuditLog('CREATE_ITEM', 'Inventory', newItem.id, undefined, undefined, newItem.name, `New product created: ${newItem.name}`);
    window.dispatchEvent(new Event('apex_storage_update'));
    return newItem;
  },
  getLocations: (): LocationMaster[] => getStored<LocationMaster[]>(KEYS.LOCATIONS, INITIAL_LOCATIONS),
  getCostTypes: (): DynamicCostType[] => getStored<DynamicCostType[]>(KEYS.COST_TYPES, INITIAL_COST_TYPES),

  addCostType: (name: string, description: string) => {
    const types = ERPService.getCostTypes();
    const newType: DynamicCostType = {
      id: `ct-${Date.now()}`,
      name,
      description,
      isSystem: false,
    };
    setStored(KEYS.COST_TYPES, [...types, newType]);
    ERPService.addAuditLog('CREATE_COST_TYPE', 'Settings', newType.id, undefined, undefined, name, description);
    return newType;
  },

  // P&L calculation for a job
  getJobPnL: (jobId: string) => {
    const job = ERPService.getJobById(jobId);
    if (!job) return null;

    const pos = ERPService.getPurchases(jobId).filter((p) => p.status === 'Approved' || p.status === 'Delivered');
    const atts = ERPService.getAttendance(jobId);
    const exps = ERPService.getExpenses(jobId);

    const materialSpend = pos.reduce((acc, p) => acc + p.subtotal, 0);
    const transportSpend = pos.reduce((acc, p) => acc + p.transportCost, 0) + exps.filter((e) => e.category.toLowerCase().includes('transport')).reduce((acc, e) => acc + e.amount, 0);
    const laborSpend = atts.reduce((acc, a) => acc + a.dailyCost, 0);
    const pettyCashSpend = exps.filter((e) => e.category.toLowerCase().includes('petty') || e.category.toLowerCase().includes('food')).reduce((acc, e) => acc + e.amount, 0);
    const otherSpend = exps.filter((e) => !e.category.toLowerCase().includes('transport') && !e.category.toLowerCase().includes('petty') && !e.category.toLowerCase().includes('food')).reduce((acc, e) => acc + e.amount, 0);

    const totalActualCost = materialSpend + transportSpend + laborSpend + pettyCashSpend + otherSpend;
    const quotedRevenue = job.quotedAmount;
    const profit = quotedRevenue - totalActualCost;
    const marginPct = quotedRevenue > 0 ? (profit / quotedRevenue) * 100 : 0;

    return {
      jobId,
      jobTitle: job.title,
      clientName: job.clientName,
      quotedRevenue,
      materialSpend,
      transportSpend,
      laborSpend,
      pettyCashSpend,
      otherSpend,
      totalActualCost,
      profit,
      marginPct,
      isOverBudget: totalActualCost > quotedRevenue,
    };
  },
};
