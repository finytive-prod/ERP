// Master Types for Apex Electrical Supply & Contracting ERP

export type UserRole = 
  | 'Admin'
  | 'Project Manager'
  | 'Site Engineer'
  | 'Site Supervisor'
  | 'Purchase Manager'
  | 'Store Manager'
  | 'Accounts'
  | 'Viewer'
  | (string & {});

export type PrivilegeCategory = 
  | 'Projects'
  | 'BOQ'
  | 'Procurement'
  | 'Sites'
  | 'Inventory'
  | 'Labour'
  | 'Partners'
  | 'Finance'
  | 'Governance';

export interface PrivilegeDefinition {
  key: string;
  label: string;
  category: PrivilegeCategory;
  description: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
  isSystem?: boolean;
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  roleId?: string;
  phone: string;
  avatar?: string;
  status: 'Active' | 'Inactive';
  designation?: string;
  department?: 'Management' | 'Site Operations' | 'Procurement' | 'Warehouse' | 'Accounts' | 'Engineering' | 'General';
  assignedSiteIds?: string[];
  assignedSiteNames?: string[];
  assignedJobIds?: string[];
  customPermissions?: string[];
  createdAt?: string;
  lastActive?: string;
}

export type MeasurementUnit =
  | 'Nos'
  | 'Mtrs'
  | 'Sets'
  | 'Coil'
  | 'Kgs'
  | 'Lot'
  | 'Pkt'
  | 'Rolls'
  | 'Pts'
  | 'Pts.'
  | 'Mtr'
  | 'Set'
  | 'No'
  | "No's";

export const AVAILABLE_UNITS: MeasurementUnit[] = [
  'Mtr',
  'Mtrs',
  'Nos',
  'Sets',
  'Coil',
  'Kgs',
  'Lot',
  'Pkt',
  'Rolls',
  'Pts',
];

export const COMMON_CATEGORIES = [
  'Wires & Cables',
  'PVC Conduits & Fittings',
  'Modular Switches & Sockets',
  'Distribution Boards & MCBs',
  'Lighting & Luminaires',
  'Fans & Ventilation',
  'Earthing & Lightning Protection',
  'Hardware & Cable Management',
  'Electrical Accessories',
] as const;

export type ItemCategory = typeof COMMON_CATEGORIES[number];

export type JobStatus =
  | 'Draft'
  | 'BOQ Prepared'
  | 'Rates Pending'
  | 'Quoted'
  | 'Revision'
  | 'Approved'
  | 'In Progress'
  | 'Completed';

export interface ClientSite {
  id: string; // e.g. "SITE-001"
  clientId: string;
  clientName: string;
  siteName: string; // e.g. "Apex Grand City Mall"
  siteLocation: string; // e.g. "Guindy Industrial Estate, Chennai"
  city?: string;
  siteEngineerName?: string;
  siteSupervisorName?: string;
  contactPhone?: string;
  activeJobIds?: string[];
  createdAt: string;
}

export interface Job {
  id: string; // e.g. "JOB-2026-0001"
  title: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  siteId?: string; // Linked Client Site ID
  siteName?: string; // Linked Client Site Name
  siteLocation: string;
  scope: string;
  startDate: string;
  targetEndDate: string;
  assignedManager: string;
  assignedSupervisor: string;
  status: JobStatus;
  quotedAmount: number;
  actualSpend: number;
  progressPct: number;
  createdAt: string;
  notes?: string;
}

export interface Client {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  gstNumber: string;
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
  sites?: ClientSite[];
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  gstNumber: string;
  categories: string[];
  paymentTerms: string;
  rating: number;
  outstandingBalance: number;
}

export interface ItemMaster {
  id: string;
  slNo?: number; // Master product code / SL.NO from Excel (1 to 85)
  name: string;
  specification: string;
  category: string;
  unit: MeasurementUnit;
  defaultVendorId?: string;
  defaultVendorName?: string;
  minStockLevel: number;
  standardCost: number; // Price is separate from product definition
  currentStock: number;
}

export interface BOQComponent {
  id: string;
  slNoRef?: number; // Stock details SL.NO (1-85)
  itemId?: string; // Linked item master ID
  name: string; // Component / raw material name (e.g. 1.5 Sq.mm wire, 25mm PVC conduit, 6A switch)
  specification?: string; // Size, gauge, rating
  qtyPerUnit: number; // Consumption per 1 parent BOQ unit
  totalQty: number; // Total consumption = qtyPerUnit * parentLine.qty
  unit: MeasurementUnit;
  unitCost?: number; // Internal procurement cost (₹)
  totalCost?: number;
  notes?: string;
}

export interface BOQLine {
  id: string;
  slNoRef?: number; // Linked product SL.NO (e.g. 1 to 85 from Excel)
  itemId?: string; // Linked item master ID
  sNo: string; // Sequence in BOQ e.g. "1", "1.a", "2"
  description: string;
  qty: number;
  unit: MeasurementUnit;
  supplyRate: number;
  erectionRate: number;
  supplyAmount: number;
  erectionAmount: number;
  totalAmount: number;
  vendorId?: string;
  vendorName?: string;
  // Pre-BOQ Material Breakdown / Bill of Materials (BOM)
  components?: BOQComponent[];
}

export interface BOQSection {
  id: string;
  sectionNumber: string; // e.g. "1.0", "2.0"
  title: string; // e.g. "PSW Transformers", "Assembly Jig", "Circuit Mains"
  items: BOQLine[];
  sectionSupplyTotal: number;
  sectionErectionTotal: number;
  sectionGrandTotal: number;
}

export interface BOQVersion {
  id: string;
  jobId: string;
  title?: string; // e.g. "CNG Electrical Works - Revised Offer", "Shop Floor Lighting", "HT Substation"
  packageCode?: string; // e.g. "PKG-01", "BOQ-A"
  boqType?: 'Original Offer' | 'Revised Offer' | 'Variation / Extra Works' | 'Package Sub-BOQ';
  versionNumber: number; // 1, 2, 3
  versionLabel: string; // "v1", "v2"
  sections: BOQSection[];
  totalSupplyAmount: number;
  totalErectionAmount: number;
  grandTotal: number;
  createdBy: string;
  createdAt: string;
  revisionReason?: string;
  isCurrent: boolean;
  status: 'Draft' | 'Rates Pending' | 'BOQ Prepared' | 'Quoted' | 'Approved' | 'Revision Requested';
}

export interface PurchaseLine {
  id: string;
  jobId?: string; // Linked Job Spine ID (critical for Multi-Job POs)
  jobTitle?: string; // Linked Job Spine Title
  boqLineId?: string;
  boqLineSNo?: string; // e.g. "1.00", "2.00"
  boqSectionTitle?: string; // e.g. "CIRCUIT MAINS"
  componentId?: string; // Linked Pre-BOQ / BOM constituent component ID
  isBomComponent?: boolean; // True if constituent raw material
  parentLineDescription?: string;
  parentLineQty?: number; // Outer parent line quantity (e.g. 560 Nos)
  parentLineUnit?: MeasurementUnit;
  qtyPerUnit?: number; // Consumption multiplier per parent unit (e.g. 2 Mtrs per Nos)
  itemId: string;
  itemName: string;
  specification?: string;
  unit: MeasurementUnit;
  boqQty: number; // Target quantity in BOQ/BOM
  alreadyPurchasedQty: number; // Prior cumulative purchase quantity
  purchaseQty: number; // Quantity in this PO
  quotedRate: number; // BOQ supply rate or BOM component rate
  purchaseRate: number; // Actual negotiated vendor rate
  totalAmount: number; // purchaseQty * purchaseRate
  notes?: string;
}

export interface PurchaseOrder {
  id: string; // e.g. "PO-2026-0042"
  jobId: string; // Primary Job ID or "MULTI-JOB"
  jobTitle: string; // Primary Job Title or "Multi-Job Procurement"
  isMultiJob?: boolean; // True if purchasing across multiple jobs
  jobIds?: string[]; // Array of Job IDs included in this PO
  boqId?: string;
  boqTitle?: string;
  vendorId: string;
  vendorName: string;
  vendorGst?: string;
  date: string;
  deliveryDate?: string;
  deliveryLocation: string; // e.g. "Site Store" or "Central Warehouse" or "Direct to Site"
  costType: string; // "Material", "Transportation", "Loading", etc.
  items: PurchaseLine[];
  subtotal: number;
  taxAmount: number;
  transportCost: number;
  grandTotal: number;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Delivered' | 'Rejected';
  approvalTriggered: boolean;
  approvalReason?: string;
  extraMaterialTicketId?: string; // Link to MaterialRequest ticket raised for Admin
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;

  // Goods Receipt / Billed Items Inward & Photo Proof
  billNumber?: string; // Vendor Invoice / Bill Number
  billDate?: string; // Date of Vendor Bill
  billAmount?: number; // Total billed amount
  billPhotoUrl?: string; // Captured / uploaded photo of purchased bill (data url or image path)
  receivedAt?: string; // Date / timestamp of receipt & inward
  receivedBy?: string; // Name of staff who received & verified items
  receivedDestination?: string; // Destination: e.g. "Site Store (JOB-2024-001)" or "Central Warehouse (Ambattur)"
  receivedLocationType?: 'site' | 'warehouse'; // 'site' for project job site or 'warehouse' for central inventory
  receivedRemarks?: string;
  linkedIndentId?: string; // Link to Site Material Requisition / Indent
}

export interface ProcurableBOQItem {
  key: string;
  boqLineId: string;
  boqLineSNo: string;
  sectionTitle: string;
  componentId?: string;
  isBomComponent: boolean;
  parentLineDescription?: string;
  parentLineQty?: number; // Outer parent line quantity (e.g. 560 Nos)
  parentLineUnit?: MeasurementUnit;
  qtyPerUnit?: number; // Consumption multiplier per parent unit (e.g. 2 Mtrs per Nos)
  itemId?: string;
  name: string;
  specification?: string;
  unit: MeasurementUnit;
  targetQty: number; // Target from BOQ or BOM
  orderedQty: number; // Prior total purchased
  balanceQty: number; // Remaining to buy
  targetRate: number; // BOQ supply rate or BOM admin rate
  defaultVendorId?: string;
  defaultVendorName?: string;
}

export interface LocationMaster {
  id: string;
  name: string;
  type: 'Warehouse' | 'Store' | 'Site';
  address: string;
  responsiblePerson: string;
  contactPhone: string;
}

export interface StockLedgerItem {
  id: string;
  slNo: number;
  itemId: string;
  itemName: string;
  specification: string;
  unit: MeasurementUnit;
  receivedQty: number;
  issuedQty: number;
  stockOnSite: number; // received minus issued
  locationId: string;
  locationName: string;
  responsiblePerson: string;
  jobId?: string; // Optional: mapped to job or unallocated general stock
  isUnallocated: boolean;
  minStockLevel: number;
  lastUpdated: string;
  lastPoId?: string;
  lastBillNumber?: string;
  billPhotoUrl?: string;
  unitCost?: number;
}

export interface StockMovement {
  id: string;
  date: string;
  type: 'Receive' | 'Issue' | 'Transfer' | 'Return';
  itemId: string;
  itemName: string;
  qty: number;
  unit: MeasurementUnit;
  fromLocation: string;
  toLocation: string;
  jobId?: string;
  responsibleUser: string;
  remarks: string;
}

export interface TaskDailyLog {
  id: string;
  date: string;
  completedQtyToday: number;
  supervisorName: string;
  notes: string;
  photoUrl?: string;
}

export interface TaskMaterialMapping {
  itemId: string;
  itemName: string;
  unit: MeasurementUnit;
  allowedPerUnit: number; // e.g. for 1 Fan = 1 bracket, 1 down rod, 12m wire
}

export interface TaskAllocatedMaterial {
  id: string;
  itemId?: string;
  itemName: string;
  specification?: string;
  unit: MeasurementUnit;
  allocatedQty: number;
  consumedQty?: number;
  sourceType: 'SiteStore' | 'JobBOQ';
  allocatedAt: string;
}

export interface TaskMemberAssignment {
  id: string;
  memberId: string;
  memberName: string;
  role: string;
  assignedDate: string; // YYYY-MM-DD
  endDate?: string;
  shiftOrHours?: string; // e.g. "Full Day (8 hrs)", "Morning Shift", "Overtime (2 hrs)"
  status?: 'Scheduled' | 'On Site Duty' | 'Completed';
  notes?: string;
}

export interface SiteTask {
  id: string;
  jobId: string;
  jobTitle?: string;
  siteId?: string;
  siteName?: string;
  boqSectionId?: string;
  boqSectionTitle?: string;
  title: string; // e.g. "Fix 15 Ceiling Fans in Hall A"
  description: string;
  assignedSupervisor: string;
  assignedWorkers: string[];
  unit: string; // e.g. "Fans", "Points", "Meters", "Nos", "Lots"
  targetQty: number;
  completedQty: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'On Hold';
  startDate: string;
  targetDate: string;
  allowedMaterials: TaskMaterialMapping[];
  dailyLogs: TaskDailyLog[];
  allocatedMaterials?: TaskAllocatedMaterial[];
  memberAssignments?: TaskMemberAssignment[];
}

export interface MaterialRequest {
  id: string;
  jobId: string;
  jobTitle?: string;
  siteId?: string;
  siteName?: string;
  siteEngineerName?: string;
  targetDestination?: 'Warehouse' | 'Admin' | 'DirectPO';
  poId?: string; // Linked PO if triggered from purchase order limit breach or moved to purchase
  poTitle?: string;
  requestType?: 'SiteExtra' | 'PurchaseExtraLimit' | 'RateEscalation' | 'SiteRequisition';
  urgency?: 'Normal' | 'High' | 'Critical';
  neededByDate?: string;
  taskId?: string;
  taskTitle?: string;
  itemId: string;
  itemName: string;
  specification?: string;
  unit: MeasurementUnit;
  allowedQty: number; // BOQ limit
  alreadyIssuedQty: number; // Already purchased or issued
  requestedExtraQty: number; // Extra beyond BOQ limit / requested indent qty
  proposedRate?: number; // Quoted/actual vendor price per unit
  totalExtraCost?: number; // requestedExtraQty * proposedRate
  reason: string; // Mandatory measured explanation
  usageHistory: string; // Summary of where material has been used or site reason
  requestedBy: string;
  requestedAt: string;
  status:
    | 'Pending'
    | 'Approved'
    | 'Moved to Purchase'
    | 'PO Issued'
    | 'Delivered to Site'
    | 'Received by Site Engineer'
    | 'Dispatched from Warehouse'
    | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
  adminNotes?: string;
  dispatchedAt?: string;
  dispatchedFrom?: string;
  transportCost?: number;
  vehicleNumber?: string;
  driverOrContact?: string;
  dispatchChallanNumber?: string;
  receivedByEngineerName?: string;
  receivedByEngineerAt?: string;
  receivedQty?: number;
  deliveryProofPhotoUrl?: string;
  receivedRemarks?: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: 'Electrician' | 'Helper' | 'Supervisor' | 'Fitter' | 'Foreman';
  dailyWage: number;
  active: boolean;
  aadharOrId?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  jobId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Half Day' | 'Absent' | 'Overtime';
  hoursWorked: number;
  dailyCost: number; // days x wage (+ overtime)
  recordedBy: string;
}

export interface ExpenseRecord {
  id: string;
  jobId?: string; // Optional: empty = General/Overhead
  category: string; // Transportation, Food, Petty Cash, Site Tools, Fuel, Travel, Misc
  amount: number;
  paidBy: string;
  date: string;
  receiptNumber?: string;
  notes: string;
  status: 'Pending' | 'Approved' | 'Reimbursed';
  isOverhead: boolean;
  approvedBy?: string;
}

export interface PettyCashAccount {
  id: string;
  custodianName: string;
  custodianRole: string;
  allocatedAmount: number;
  spentAmount: number;
  balanceAmount: number;
  lastReconciled: string;
}

export interface ClientInvoice {
  id: string; // INV-2026-001
  jobId: string;
  jobTitle: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientGst: string;
  date: string;
  dueDate: string;
  items: {
    description: string;
    qty: number;
    unit: string;
    rate: number;
    amount: number;
  }[];
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  status: 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue';
}

export interface ClientPayment {
  id: string;
  invoiceId: string;
  jobId: string;
  amount: number;
  date: string;
  mode: 'Bank Transfer' | 'Cheque' | 'UPI' | 'Cash';
  referenceNumber: string;
  receivedBy: string;
}

export interface DynamicCostType {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
}

export interface PriceHistoryRecord {
  id: string;
  itemId: string;
  itemName: string;
  vendorId: string;
  vendorName: string;
  rate: number;
  qty: number;
  unit: MeasurementUnit;
  date: string;
  jobId: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string; // 'CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'DELETE', 'EXPORT'
  entity: string; // 'Job', 'BOQ', 'Purchase', 'Stock', 'MaterialRequest', 'Expense'
  entityId: string;
  jobId?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  read: boolean;
  timestamp: string;
  link?: string;
  jobId?: string;
}
