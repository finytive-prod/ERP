import {
  User,
  Job,
  Client,
  ClientSite,
  Vendor,
  ItemMaster,
  BOQVersion,
  PurchaseOrder,
  LocationMaster,
  StockLedgerItem,
  StockMovement,
  SiteTask,
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
  PrivilegeDefinition,
  RoleDefinition,
} from '../types';

export const SYSTEM_PRIVILEGES: PrivilegeDefinition[] = [
  // 1. Projects & Operations
  { key: 'jobs.view', label: 'View Jobs & Projects Spine', category: 'Projects', description: 'Access Job dashboard, scope, contract values, and linked tasks' },
  { key: 'jobs.create', label: 'Create New Jobs', category: 'Projects', description: 'Register new client contracts, assign project sites and supervisor' },
  { key: 'jobs.edit', label: 'Edit Job & Budget', category: 'Projects', description: 'Modify contract values, dates, milestones and job status' },
  { key: 'jobs.delete', label: 'Delete / Archive Jobs', category: 'Projects', description: 'Remove or archive completed / cancelled jobs' },

  // 2. BOQ & Estimation
  { key: 'boq.view', label: 'View BOQ Quotations', category: 'BOQ', description: 'Inspect client bill of quantities, line item rates and margin percentages' },
  { key: 'boq.create', label: 'Create BOQ & Import Excel', category: 'BOQ', description: 'Build new estimates and bulk upload electrical item schedules' },
  { key: 'boq.edit', label: 'Edit BOQ Rates & Quantities', category: 'BOQ', description: 'Adjust purchase estimates, client rates, and profit markup' },
  { key: 'boq.approve', label: 'Approve & Freeze BOQ', category: 'BOQ', description: 'Finalize estimates and lock BOQ baseline for procurement' },

  // 3. Procurement & POs
  { key: 'purchases.view', label: 'View Purchase Orders', category: 'Procurement', description: 'Monitor all vendor purchase orders, status and purchase register' },
  { key: 'purchases.create_po', label: 'Create Purchase Orders', category: 'Procurement', description: 'Draft and issue POs to vendors mapped to BOQ line items' },
  { key: 'purchases.approve_po', label: 'Approve POs & Budget Overruns', category: 'Procurement', description: 'Grant management approval on purchase orders exceeding budget' },
  { key: 'purchases.inward_verify', label: 'Inward GRN & Bill Photo Verification', category: 'Procurement', description: 'Physical item verification at site/store, capture photo proof of vendor bills' },

  // 4. Sites & Workspaces Execution
  { key: 'sites.view', label: 'Access Sites & Workspaces Hub', category: 'Sites', description: 'View project sites, on-site live stocks, and shortages' },
  { key: 'sites.create_site', label: 'Register New Project Sites', category: 'Sites', description: 'Add new client sites, addresses, and site in-charges' },
  { key: 'sites.raise_indent', label: 'Raise Material Indent Requisition', category: 'Sites', description: 'Site Head / Engineer can submit urgent material indent requisitions to Admin' },
  { key: 'sites.approve_indent', label: 'Approve / Reject Material Indents', category: 'Sites', description: 'Admin authorization to approve site indents and release POs' },
  { key: 'sites.issue_material', label: 'Issue Materials from Site Store', category: 'Sites', description: 'Dispense on-site materials to electricians and record job consumption' },
  { key: 'sites.manage_crew', label: 'Manage Site Workforce Crew', category: 'Sites', description: 'Assign site engineers, supervisors, and wiremen to project sites' },

  // 5. Central Inventory
  { key: 'inventory.view', label: 'View Central Warehouse Inventory', category: 'Inventory', description: 'Check warehouse stock balances, locations, and SKU ledgers' },
  { key: 'inventory.adjust', label: 'Manual Stock Adjustments', category: 'Inventory', description: 'Audit stock counts and correct physical discrepancies' },
  { key: 'inventory.transfer', label: 'Dispatch & Transfer Stock to Sites', category: 'Inventory', description: 'Transfer materials from central warehouse to project site stores' },

  // 6. Labour & Attendance
  { key: 'labour.view', label: 'View Labour Attendance & Wages', category: 'Labour', description: 'Monitor daily site labour logs, hours, and labour cost breakdown' },
  { key: 'labour.mark_attendance', label: 'Mark Daily Site Attendance', category: 'Labour', description: 'Log daily muster roll, present/half-day/overtime for electricians' },
  { key: 'labour.manage_wages', label: 'Manage Labourers & Wage Rates', category: 'Labour', description: 'Configure electrician wage categories and daily master rates' },

  // 7. Partners & CRM
  { key: 'partners.view', label: 'View Clients & Vendors', category: 'Partners', description: 'Access client directories and approved vendor catalogues' },
  { key: 'partners.manage', label: 'Create / Edit Clients & Vendors', category: 'Partners', description: 'Maintain company GST, payment terms, and vendor pricing' },

  // 8. Finance & Commercial
  { key: 'billing.view', label: 'View Invoices & Receivables', category: 'Finance', description: 'Monitor client billing status, outstanding balances, and age analysis' },
  { key: 'billing.create_invoice', label: 'Generate Client Tax Invoices', category: 'Finance', description: 'Create GST invoices against completed job milestones' },
  { key: 'billing.record_payment', label: 'Record Client Payment Receipts', category: 'Finance', description: 'Log client bank transfers, TDS deductions, and reconciliations' },
  { key: 'reports.pnl_view', label: 'View Profit & Loss Financial Reports', category: 'Finance', description: 'Analyze job gross margins, material spend vs quotation, and net profit' },

  // 9. Governance & System
  { key: 'members.manage', label: 'Manage Team Members & Assign Roles', category: 'Governance', description: 'Add, edit, activate/deactivate ERP users and allocate site access' },
  { key: 'roles.manage', label: 'Configure Roles & Privilege Matrix', category: 'Governance', description: 'Define custom access roles and toggle granular privilege flags' },
  { key: 'audit.view', label: 'View Global Audit Trail', category: 'Governance', description: 'Inspect immutable system event logs and transaction history' },
  { key: 'settings.manage', label: 'Configure Master System Settings', category: 'Governance', description: 'Manage dynamic cost heads, measurement units, and company profile' },
];

export const INITIAL_ROLES: RoleDefinition[] = [
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Full administrative access with unrestricted privileges across all ERP modules',
    color: '#dc2626',
    isSystem: true,
    permissions: [
      'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.delete',
      'boq.view', 'boq.create', 'boq.edit', 'boq.approve',
      'purchases.view', 'purchases.create_po', 'purchases.approve_po', 'purchases.inward_verify',
      'sites.view', 'sites.create_site', 'sites.raise_indent', 'sites.approve_indent', 'sites.issue_material', 'sites.manage_crew',
      'inventory.view', 'inventory.adjust', 'inventory.transfer',
      'labour.view', 'labour.mark_attendance', 'labour.manage_wages',
      'partners.view', 'partners.manage',
      'billing.view', 'billing.create_invoice', 'billing.record_payment', 'reports.pnl_view',
      'members.manage', 'roles.manage', 'audit.view', 'settings.manage',
    ],
    createdAt: '2026-01-01',
  },
  {
    id: 'role-project-manager',
    name: 'Project Manager',
    description: 'Manages jobs spine, BOQ estimation, site progress, workforce, and procurement oversight',
    color: '#7c3aed',
    isSystem: true,
    permissions: [
      'jobs.view', 'jobs.create', 'jobs.edit',
      'boq.view', 'boq.create', 'boq.edit', 'boq.approve',
      'purchases.view', 'purchases.create_po', 'purchases.approve_po', 'purchases.inward_verify',
      'sites.view', 'sites.create_site', 'sites.raise_indent', 'sites.approve_indent', 'sites.issue_material', 'sites.manage_crew',
      'inventory.view', 'inventory.transfer',
      'labour.view', 'labour.mark_attendance',
      'partners.view',
      'billing.view', 'reports.pnl_view',
      'audit.view',
    ],
    createdAt: '2026-01-01',
  },
  {
    id: 'role-site-engineer',
    name: 'Site Engineer',
    description: 'Manages on-site execution, raises material indents, checks delivered items with photo proof, and issues materials',
    color: '#0284c7',
    isSystem: true,
    permissions: [
      'jobs.view',
      'sites.view', 'sites.raise_indent', 'sites.issue_material', 'sites.manage_crew',
      'purchases.inward_verify',
      'inventory.view',
      'labour.view', 'labour.mark_attendance',
    ],
    createdAt: '2026-01-01',
  },
  {
    id: 'role-site-supervisor',
    name: 'Site Supervisor',
    description: 'Physical supervision at site, checks received goods against PO bills, logs attendance, and dispenses stock',
    color: '#059669',
    isSystem: true,
    permissions: [
      'jobs.view',
      'sites.view',
      'purchases.inward_verify',
      'sites.issue_material',
      'labour.view', 'labour.mark_attendance',
    ],
    createdAt: '2026-01-01',
  },
  {
    id: 'role-purchase-manager',
    name: 'Purchase Manager',
    description: 'Handles vendor price comparisons, creates POs, manages supplier terms and central inventory',
    color: '#d97706',
    isSystem: true,
    permissions: [
      'jobs.view',
      'boq.view',
      'purchases.view', 'purchases.create_po',
      'inventory.view', 'inventory.adjust', 'inventory.transfer',
      'partners.view', 'partners.manage',
    ],
    createdAt: '2026-01-01',
  },
  {
    id: 'role-store-manager',
    name: 'Store Manager',
    description: 'Maintains central warehouse stocks, handles inward goods verification, stock transfers, and store ledger',
    color: '#0d9488',
    isSystem: true,
    permissions: [
      'inventory.view', 'inventory.adjust', 'inventory.transfer',
      'purchases.view', 'purchases.inward_verify',
      'sites.view', 'sites.issue_material',
    ],
    createdAt: '2026-01-01',
  },
  {
    id: 'role-accounts',
    name: 'Accounts',
    description: 'Client billing, payment receipts, vendor bill reconciliation, and Job P&L profitability',
    color: '#2563eb',
    isSystem: true,
    permissions: [
      'jobs.view',
      'billing.view', 'billing.create_invoice', 'billing.record_payment',
      'reports.pnl_view',
      'partners.view',
      'purchases.view', 'purchases.approve_po',
      'labour.view',
    ],
    createdAt: '2026-01-01',
  },
  {
    id: 'role-viewer',
    name: 'Viewer',
    description: 'Read-only access to view jobs, BOQs, inventory, and site progress without editing rights',
    color: '#64748b',
    isSystem: true,
    permissions: [
      'jobs.view',
      'boq.view',
      'sites.view',
      'inventory.view',
      'audit.view',
    ],
    createdAt: '2026-01-01',
  },
];

export const DEFAULT_USER_PASSWORD = 'apex@123';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Tamim Ansar (Admin)',
    email: 'admin@apex.in',
    password: DEFAULT_USER_PASSWORD,
    role: 'Admin',
    roleId: 'role-admin',
    phone: '+91 98765 43210',
    status: 'Active',
    designation: 'Managing Director & Lead Admin',
    department: 'Management',
    createdAt: '2026-01-01',
    lastActive: 'Just now',
  },
  {
    id: 'usr-2',
    name: 'Kavitha R (Site Head)',
    email: 'kavitha.site@apex.in',
    password: DEFAULT_USER_PASSWORD,
    role: 'Site Engineer',
    roleId: 'role-site-engineer',
    phone: '+91 98401 55667',
    status: 'Active',
    designation: 'Senior Electrical Site Engineer & Site Head',
    department: 'Engineering',
    assignedSiteIds: ['site-apex-mall', 'site-apex-techpark'],
    assignedSiteNames: ['Apex Grand City Mall (Phase 2)', 'Apex Horizon Tech Park (Tower B)'],
    assignedJobIds: ['JOB-2026-0001', 'JOB-2026-0002'],
    createdAt: '2026-01-05',
    lastActive: '10 mins ago',
  },
  {
    id: 'usr-3',
    name: 'Murugan P (Site Supv)',
    email: 'murugan.site@apex.in',
    password: DEFAULT_USER_PASSWORD,
    role: 'Site Supervisor',
    roleId: 'role-site-supervisor',
    phone: '+91 98402 33445',
    status: 'Active',
    designation: 'Lead Electrical Field Supervisor',
    department: 'Site Operations',
    assignedSiteIds: ['site-apex-mall'],
    assignedSiteNames: ['Apex Grand City Mall (Phase 2)'],
    assignedJobIds: ['JOB-2026-0001'],
    createdAt: '2026-01-10',
    lastActive: '25 mins ago',
  },
  {
    id: 'usr-4',
    name: 'Karthik Raja (Procurement)',
    email: 'karthik@apex.in',
    password: DEFAULT_USER_PASSWORD,
    role: 'Purchase Manager',
    roleId: 'role-purchase-manager',
    phone: '+91 98403 44556',
    status: 'Active',
    designation: 'Chief Procurement Officer',
    department: 'Procurement',
    createdAt: '2026-01-08',
    lastActive: '1 hour ago',
  },
  {
    id: 'usr-5',
    name: 'Priya Natarajan (Accounts)',
    email: 'priya.acc@apex.in',
    password: DEFAULT_USER_PASSWORD,
    role: 'Accounts',
    roleId: 'role-accounts',
    phone: '+91 98404 77889',
    status: 'Active',
    designation: 'Senior Accounts & Billing Manager',
    department: 'Accounts',
    createdAt: '2026-01-08',
    lastActive: '2 hours ago',
  },
  {
    id: 'usr-6',
    name: 'Vignesh S (Project Manager)',
    email: 'vignesh.pm@apex.in',
    password: DEFAULT_USER_PASSWORD,
    role: 'Project Manager',
    roleId: 'role-project-manager',
    phone: '+91 98401 22334',
    status: 'Active',
    designation: 'Senior Project Operations Manager',
    department: 'Site Operations',
    assignedSiteIds: ['site-apex-mall', 'site-apex-techpark', 'site-lt-campus', 'site-titan-hosur'],
    assignedSiteNames: ['Apex Grand City Mall (Phase 2)', 'Apex Horizon Tech Park (Tower B)', 'L&T Innovation Campus', 'Titan Smart Watch Plant'],
    createdAt: '2026-01-03',
    lastActive: '30 mins ago',
  },
  {
    id: 'usr-7',
    name: 'Suresh Kumar (Central Store)',
    email: 'suresh.store@apex.in',
    password: DEFAULT_USER_PASSWORD,
    role: 'Store Manager',
    roleId: 'role-store-manager',
    phone: '+91 98405 88990',
    status: 'Active',
    designation: 'Central Warehouse & Store Keeper',
    department: 'Warehouse',
    createdAt: '2026-01-12',
    lastActive: '3 hours ago',
  },
];

export const INITIAL_CLIENT_SITES: ClientSite[] = [];

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_VENDORS: Vendor[] = [];

export const INITIAL_ITEMS: ItemMaster[] = [];

export const INITIAL_LOCATIONS: LocationMaster[] = [
  {
    id: 'loc-01',
    name: 'Central Warehouse (Ambattur)',
    type: 'Warehouse',
    address: 'Industrial Estate, Ambattur, Chennai',
    responsiblePerson: 'Store Manager',
    contactPhone: '+91 98401 11223',
  },
];

export const INITIAL_EMPLOYEES: Employee[] = [];

export const INITIAL_COST_TYPES: DynamicCostType[] = [
  { id: 'ct-1', name: 'Material', description: 'Wires, conduits, switchgear, fixtures', isSystem: true },
  { id: 'ct-2', name: 'Labor', description: 'Electricians, helpers, technicians, wiremen', isSystem: true },
  { id: 'ct-3', name: 'Transportation', description: 'Freight, tempo, vehicle hire', isSystem: true },
  { id: 'ct-4', name: 'Equipment Hire', description: 'Scaffolding, drill machines, crimping tools', isSystem: true },
  { id: 'ct-5', name: 'Consumables', description: 'Insulation tape, raw plugs, screws, glues', isSystem: true },
];

export const INITIAL_JOBS: Job[] = [];

export const INITIAL_BOQS: BOQVersion[] = [];

export const INITIAL_PURCHASES: PurchaseOrder[] = [];

export const INITIAL_STOCK_LEDGER: StockLedgerItem[] = [];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];

export const INITIAL_TASKS: SiteTask[] = [];

export const INITIAL_MATERIAL_REQUESTS: MaterialRequest[] = [];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_EXPENSES: ExpenseRecord[] = [];

export const INITIAL_PETTY_CASH: PettyCashAccount[] = [];

export const INITIAL_INVOICES: ClientInvoice[] = [];

export const INITIAL_PAYMENTS: ClientPayment[] = [];

export const INITIAL_PRICE_HISTORY: PriceHistoryRecord[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
