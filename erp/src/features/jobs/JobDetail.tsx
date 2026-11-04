import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Briefcase, 
  FileSpreadsheet, 
  ShoppingCart, 
  Boxes, 
  CheckSquare, 
  Users, 
  DollarSign, 
  TrendingUp, 
  History, 
  Mail, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Building2, 
  MapPin, 
  Calendar, 
  Clock, 
  Send,
  Edit3,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Receipt,
  Sparkles,
  Package
} from 'lucide-react';
import { BOQBuilderModal } from '../boq/BOQBuilderModal';
import { PreBOQBreakdownModal } from '../boq/PreBOQBreakdownModal';
import { CreatePurchaseOrderModal } from '../purchases/CreatePurchaseOrderModal';
import { PurchaseOrderDetailModal } from '../purchases/PurchaseOrderDetailModal';
import { ERPService } from '../../services/erpStorage';
import { 
  Job, 
  BOQVersion, 
  BOQSection,
  BOQLine,
  BOQComponent,
  PurchaseOrder, 
  StockLedgerItem, 
  StockMovement, 
  SiteTask, 
  AttendanceRecord, 
  ExpenseRecord, 
  ClientInvoice, 
  ClientPayment, 
  AuditLogEntry, 
  Vendor,
  MaterialRequest,
  MeasurementUnit
} from '../../types';
import { 
  PageHeader, 
  Tabs, 
  Card, 
  Badge, 
  Button, 
  DataTable, 
  Modal, 
  ConfirmDialog, 
  Input, 
  Select, 
  Timeline, 
  StatCard,
  useToast
} from '../../components/ui';

export const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUser = ERPService.getCurrentUser();

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [job, setJob] = useState<Job | undefined>(undefined);
  const [boqs, setBoqs] = useState<BOQVersion[]>([]);
  const [selectedBoq, setSelectedBoq] = useState<BOQVersion | undefined>(undefined);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [stockLedger, setStockLedger] = useState<StockLedgerItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [tasks, setTasks] = useState<SiteTask[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Modals state
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<Job['status']>('Draft');
  const [statusReason, setStatusReason] = useState('');

  // Rate Editing & BOQ Revision State
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [editedBoq, setEditedBoq] = useState<BOQVersion | undefined>(undefined);
  const [isSaveRevisionModalOpen, setIsSaveRevisionModalOpen] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [isBOQBuilderOpen, setIsBOQBuilderOpen] = useState(false);
  const [boqBuilderMode, setBoqBuilderMode] = useState<'create' | 'edit'>('create');
  const [breakdownTarget, setBreakdownTarget] = useState<{ sIdx: number; lIdx: number } | null>(null);

  const handleSaveBreakdownComponentsFromJob = (comps: BOQComponent[], applyRateToParent?: boolean) => {
    if (!breakdownTarget || !selectedBoq) return;
    const copy = JSON.parse(JSON.stringify(selectedBoq)) as BOQVersion;
    const targetItem = copy.sections[breakdownTarget.sIdx]?.items[breakdownTarget.lIdx];
    if (!targetItem) return;
    const parentQty = targetItem.qty || 1;
    targetItem.components = comps.map((c) => {
      const qtyPerUnit = c.qtyPerUnit !== undefined && c.qtyPerUnit !== null ? Number(c.qtyPerUnit) : 1;
      const totalQty = Math.round(qtyPerUnit * parentQty * 100) / 100;
      const totalCost = Math.round(totalQty * (Number(c.unitCost) || 0) * 100) / 100;
      return {
        ...c,
        qtyPerUnit,
        totalQty,
        totalCost,
      };
    });
    if (applyRateToParent) {
      const totalCost = targetItem.components.reduce((sum, c) => sum + (c.totalCost || ((c.totalQty || 0) * (c.unitCost || 0))), 0);
      const unitRate = Math.round((totalCost / parentQty) * 100) / 100;
      targetItem.supplyRate = unitRate;
    }
    let grandSupply = 0;
    let grandErection = 0;
    copy.sections = copy.sections.map((sec) => {
      let secSupply = 0;
      let secErection = 0;
      sec.items = sec.items.map((it) => {
        const sAmt = (it.qty || 0) * (it.supplyRate || 0);
        const eAmt = (it.qty || 0) * (it.erectionRate || 0);
        secSupply += sAmt;
        secErection += eAmt;
        return {
          ...it,
          supplyAmount: Math.round(sAmt * 100) / 100,
          erectionAmount: Math.round(eAmt * 100) / 100,
          totalAmount: Math.round((sAmt + eAmt) * 100) / 100,
        };
      });
      sec.sectionSupplyTotal = Math.round(secSupply * 100) / 100;
      sec.sectionErectionTotal = Math.round(secErection * 100) / 100;
      sec.sectionGrandTotal = Math.round((secSupply + secErection) * 100) / 100;
      grandSupply += secSupply;
      grandErection += secErection;
      return sec;
    });
    copy.totalSupplyAmount = Math.round(grandSupply * 100) / 100;
    copy.totalErectionAmount = Math.round(grandErection * 100) / 100;
    copy.grandTotal = Math.round((grandSupply + grandErection) * 100) / 100;

    ERPService.saveBOQVersion(copy, 'Updated component material breakdown & admin rates');
    setSelectedBoq(copy);
    setEditedBoq(JSON.parse(JSON.stringify(copy)));
    setBreakdownTarget(null);
    showToast('BOM Saved', 'Constituent material breakdown saved directly to BOQ line.', 'success');
  };

  // Extra Material Request Modal State
  const [isExtraMaterialModalOpen, setIsExtraMaterialModalOpen] = useState(false);
  const [extraMaterialData, setExtraMaterialData] = useState({
    itemId: '',
    requestedExtraQty: '',
    reason: '',
  });

  // Attendance Modal State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState({
    employeeId: '',
    status: 'Present' as AttendanceRecord['status'],
    date: new Date().toISOString().split('T')[0],
  });

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseData, setExpenseData] = useState({
    category: 'Transportation',
    amount: '',
    paidBy: currentUser.name,
    notes: '',
  });

  // Purchase Order Modals State
  const [isJobPOModalOpen, setIsJobPOModalOpen] = useState(false);
  const [poInitialItems, setPoInitialItems] = useState<any[]>([]);
  const [selectedJobPOForDetail, setSelectedJobPOForDetail] = useState<PurchaseOrder | null>(null);
  const [isJobPODetailModalOpen, setIsJobPODetailModalOpen] = useState(false);

  const handleProcureBOQLine = (line: BOQLine, section: BOQSection) => {
    if (!job) return;
    const parentQty = Number(line.qty) || 1;
    if (line.components && line.components.length > 0) {
      const items = line.components.map((c) => {
        const qtyPerUnit = c.qtyPerUnit !== undefined && c.qtyPerUnit !== null ? Number(c.qtyPerUnit) : 1;
        const total = Math.round(qtyPerUnit * parentQty * 100) / 100;
        return {
          jobId: job.id,
          jobTitle: job.title,
          boqLineId: line.id,
          boqLineSNo: line.sNo || '',
          sectionTitle: section.title,
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
          targetQty: total > 0 ? total : (c.totalQty || line.qty),
          targetRate: c.unitCost || 0,
        };
      });
      setPoInitialItems(items);
    } else {
      setPoInitialItems([
        {
          jobId: job.id,
          jobTitle: job.title,
          boqLineId: line.id,
          boqLineSNo: line.sNo || '',
          sectionTitle: section.title,
          isBomComponent: false,
          parentLineDescription: undefined,
          parentLineQty: parentQty,
          parentLineUnit: line.unit,
          qtyPerUnit: 1,
          itemId: line.itemId,
          name: line.description,
          specification: '',
          unit: line.unit,
          targetQty: parentQty,
          targetRate: line.supplyRate || 0,
          vendorId: line.vendorId,
        },
      ]);
    }
    setIsJobPOModalOpen(true);
  };

  const loadJobData = () => {
    if (!id) return;
    const j = ERPService.getJobById(id);
    setJob(j);
    if (!j) return;

    const bList = ERPService.getBOQsForJob(id);
    setBoqs(bList);
    const currBoq = bList.find((b) => b.isCurrent) || bList[0];
    setSelectedBoq(currBoq);
    setEditedBoq(JSON.parse(JSON.stringify(currBoq || null)));

    setPurchases(ERPService.getPurchases(id));
    setStockLedger(ERPService.getStockLedger(id));
    setStockMovements(ERPService.getStockMovements(id));
    setTasks(ERPService.getTasks(id));
    setMaterialRequests(ERPService.getMaterialRequests(id));
    setAttendance(ERPService.getAttendance(id));
    setExpenses(ERPService.getExpenses(id));
    setInvoices(ERPService.getInvoices(id));
    setAuditLogs(ERPService.getAuditLogs(id));
    setVendors(ERPService.getVendors());
  };

  useEffect(() => {
    loadJobData();
    window.addEventListener('apex_storage_update', loadJobData);
    return () => window.removeEventListener('apex_storage_update', loadJobData);
  }, [id]);

  if (!job) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-primary)' }}>Job Not Found</h2>
        <p style={{ color: 'var(--color-gray-500)', marginTop: 8 }}>Job ID {id} does not exist in the database.</p>
        <Button variant="primary" style={{ marginTop: 16 }} onClick={() => navigate('/jobs')}>
          Back to Jobs List
        </Button>
      </div>
    );
  }

  const pnl = ERPService.getJobPnL(job.id);
  const isOverBudget = pnl ? pnl.isOverBudget : false;

  // Handle Status Update with reason
  const handleConfirmStatusUpdate = () => {
    if (!statusReason.trim()) {
      showToast('Reason Required', 'Please provide a clear reason for the status change.', 'danger');
      return;
    }
    ERPService.updateJobStatus(job.id, newStatus, statusReason.trim());
    showToast('Status Updated', `Job moved to ${newStatus}.`, 'success');
    setIsUpdateStatusModalOpen(false);
    setStatusReason('');
  };

  // Handle BOQ Line Rate Edit
  const handleRateChange = (sectionIdx: number, lineIdx: number, field: 'supplyRate' | 'erectionRate' | 'vendorId', val: any) => {
    if (!editedBoq) return;
    const copy = JSON.parse(JSON.stringify(editedBoq)) as BOQVersion;
    const line = copy.sections[sectionIdx].items[lineIdx];

    if (field === 'vendorId') {
      line.vendorId = val;
      const v = vendors.find((x) => x.id === val);
      line.vendorName = v ? v.name : '';
    } else {
      line[field] = parseFloat(val) || 0;
      line.supplyAmount = line.qty * line.supplyRate;
      line.erectionAmount = line.qty * line.erectionRate;
      line.totalAmount = line.supplyAmount + line.erectionAmount;
    }

    // Recalculate Section Totals
    let secSupply = 0;
    let secErection = 0;
    copy.sections[sectionIdx].items.forEach((item) => {
      secSupply += item.supplyAmount;
      secErection += item.erectionAmount;
    });
    copy.sections[sectionIdx].sectionSupplyTotal = secSupply;
    copy.sections[sectionIdx].sectionErectionTotal = secErection;
    copy.sections[sectionIdx].sectionGrandTotal = secSupply + secErection;

    // Recalculate Grand Total
    let grandSupply = 0;
    let grandErection = 0;
    copy.sections.forEach((sec) => {
      grandSupply += sec.sectionSupplyTotal;
      grandErection += sec.sectionErectionTotal;
    });
    copy.totalSupplyAmount = grandSupply;
    copy.totalErectionAmount = grandErection;
    copy.grandTotal = grandSupply + grandErection;

    setEditedBoq(copy);
  };

  // Save new BOQ revision
  const handleSaveBOQRevision = () => {
    if (!editedBoq || !revisionReason.trim()) {
      showToast('Reason Required', 'Please provide a mandatory explanation for this rate/quote revision.', 'danger');
      return;
    }
    const nextVerNum = boqs.length + 1;
    const newVersion: BOQVersion = {
      ...editedBoq,
      id: `boq-${job.id.toLowerCase()}-v${nextVerNum}`,
      versionNumber: nextVerNum,
      versionLabel: `v${nextVerNum}`,
      revisionReason: revisionReason.trim(),
      createdBy: currentUser.name,
      createdAt: new Date().toISOString().split('T')[0],
      isCurrent: true,
      status: 'Quoted',
    };

    ERPService.saveBOQVersion(newVersion, revisionReason.trim());
    showToast('Revision Saved', `BOQ version ${newVersion.versionLabel} created and published.`, 'success');
    setIsEditingRates(false);
    setIsSaveRevisionModalOpen(false);
    setRevisionReason('');
  };

  // Send to Client mailto
  const handleSendToClient = () => {
    const subject = encodeURIComponent(`Quotation & BOQ Proposal for ${job.title} [${job.id}]`);
    const body = encodeURIComponent(
      `Dear ${job.clientName},\n\nPlease find attached the official electrical supply and installation quotation for Job ID: ${job.id} (${job.title}).\n\nTotal Quoted Amount: ₹${(selectedBoq?.grandTotal || job.quotedAmount).toLocaleString('en-IN')}\n\nScope of Work:\n${job.scope}\n\nKindly review and let us know your approval or any adjustments.\n\nWarm regards,\nTamim Ansar\nApex Electrical Contracting & Supply`
    );
    const mailtoUrl = `mailto:${job.clientEmail}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;

    ERPService.addAuditLog('CLIENT_SHARE', 'BOQ', selectedBoq?.id || job.id, job.id, undefined, job.clientEmail, 'Generated client quotation email draft');
    showToast('Mail Client Opened', `Client email draft opened for ${job.clientEmail}`, 'info');
  };

  // Export BOQ CSV
  const handleExportCSV = () => {
    if (!selectedBoq) return;
    let csv = 'Section,S.No,Description,Qty,Unit,Supply Rate (INR),Erection Rate (INR),Supply Amount (INR),Erection Amount (INR),Total Amount (INR),Vendor\n';
    
    selectedBoq.sections.forEach((sec) => {
      sec.items.forEach((item) => {
        csv += `"${sec.title}","${item.sNo}","${item.description.replace(/"/g, '""')}",${item.qty},"${item.unit}",${item.supplyRate},${item.erectionRate},${item.supplyAmount},${item.erectionAmount},${item.totalAmount},"${item.vendorName || ''}"\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BOQ_${job.id}_${selectedBoq.versionLabel}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('CSV Exported', `BOQ ${selectedBoq.versionLabel} CSV downloaded.`, 'success');
  };

  // Print Quotation
  const handlePrintQuotation = () => {
    window.print();
  };

  // Handle Submit Extra Material Request
  const handleSubmitExtraMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraMaterialData.itemId || !extraMaterialData.requestedExtraQty || !extraMaterialData.reason.trim()) {
      showToast('Error', 'Please fill in item, extra quantity, and measured reason.', 'danger');
      return;
    }
    const item = ERPService.getItems().find((i) => i.id === extraMaterialData.itemId);
    if (!item) return;

    ERPService.requestExtraMaterial({
      jobId: job.id,
      itemId: item.id,
      itemName: item.name,
      unit: item.unit,
      allowedQty: 10,
      alreadyIssuedQty: 10,
      requestedExtraQty: parseFloat(extraMaterialData.requestedExtraQty),
      reason: extraMaterialData.reason.trim(),
      usageHistory: `Allocated limit exhausted on site at ${job.siteLocation}`,
    });

    showToast('Request Submitted', 'Extra material request sent to Admin for approval.', 'success');
    setIsExtraMaterialModalOpen(false);
    setExtraMaterialData({ itemId: '', requestedExtraQty: '', reason: '' });
  };

  // Handle Mark Attendance
  const handleMarkAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceData.employeeId) {
      showToast('Error', 'Please choose an employee.', 'danger');
      return;
    }
    const emp = ERPService.getEmployees().find((e) => e.id === attendanceData.employeeId);
    if (!emp) return;

    ERPService.recordAttendance({
      employeeId: emp.id,
      employeeName: emp.name,
      jobId: job.id,
      date: attendanceData.date,
      status: attendanceData.status,
      hoursWorked: attendanceData.status === 'Present' ? 8 : attendanceData.status === 'Half Day' ? 4 : attendanceData.status === 'Overtime' ? 11 : 0,
      recordedBy: currentUser.name,
    });

    showToast('Attendance Marked', `Recorded ${attendanceData.status} for ${emp.name}.`, 'success');
    setIsAttendanceModalOpen(false);
  };

  // Handle Add Expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseData.amount || parseFloat(expenseData.amount) <= 0) {
      showToast('Error', 'Please enter a valid expense amount.', 'danger');
      return;
    }

    ERPService.createExpense({
      jobId: job.id,
      category: expenseData.category,
      amount: parseFloat(expenseData.amount),
      paidBy: expenseData.paidBy,
      date: new Date().toISOString().split('T')[0],
      notes: expenseData.notes,
      status: 'Approved',
      isOverhead: false,
    });

    showToast('Expense Recorded', `Recorded ₹${expenseData.amount} for ${expenseData.category}.`, 'success');
    setIsExpenseModalOpen(false);
    setExpenseData({ category: 'Transportation', amount: '', paidBy: currentUser.name, notes: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Hub Page Header */}
      <PageHeader
        title={`${job.id}: ${job.title}`}
        subtitle={`Client: ${job.clientName} | Site: ${job.siteLocation}`}
        icon={<Briefcase size={22} />}
        badge={<Badge status={job.status} />}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button
              variant="accent"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => {
                setActiveTab('boq');
                setIsBOQBuilderOpen(true);
              }}
            >
              {boqs.length === 0 ? '+ Create Detailed BOQ' : '+ Revise / Build BOQ'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Edit3 size={15} />}
              onClick={() => {
                setNewStatus(job.status);
                setIsUpdateStatusModalOpen(true);
              }}
            >
              Update Status
            </Button>
            <Button
              variant="accent"
              size="sm"
              icon={<ShoppingCart size={15} />}
              onClick={() => navigate(`/purchases?create=true&jobId=${job.id}`)}
            >
              Raise Purchase
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Mail size={15} />}
              onClick={handleSendToClient}
            >
              Send to Client
            </Button>
          </div>
        }
      />

      {/* Over-Budget Alert Banner (if actualSpend > quotedAmount) */}
      {isOverBudget && (
        <div
          style={{
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4) var(--space-5)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: 'var(--color-danger-text)',
          }}
        >
          <AlertTriangle size={24} color="var(--color-danger)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>
              CRITICAL BUDGET WARNING: Job Spend Exceeds Quoted Amount
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: 2 }}>
              Current Actual Spend is <strong>₹{job.actualSpend.toLocaleString('en-IN')}</strong> vs Quoted Revenue of <strong>₹{job.quotedAmount.toLocaleString('en-IN')}</strong> (Deficit: ₹{(job.actualSpend - job.quotedAmount).toLocaleString('en-IN')}).
            </div>
          </div>
        </div>
      )}

      {/* The 10 Hub Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'overview', label: '1. Overview', icon: <Briefcase size={16} /> },
          { id: 'boq', label: '2. BOQ / Quotation', icon: <FileSpreadsheet size={16} />, badge: selectedBoq?.versionLabel },
          { id: 'purchases', label: '3. Purchases', icon: <ShoppingCart size={16} />, badge: purchases.length },
          { id: 'stock', label: '4. Stock & Store', icon: <Boxes size={16} />, badge: stockLedger.length },
          { id: 'tasks', label: '5. Tasks & Progress', icon: <CheckSquare size={16} />, badge: tasks.length },
          { id: 'employees', label: '6. Labour & Attendance', icon: <Users size={16} />, badge: attendance.length },
          { id: 'expenses', label: '7. Expenses', icon: <DollarSign size={16} />, badge: expenses.length },
          { id: 'billing', label: '8. Billing & Invoices', icon: <Receipt size={16} />, badge: invoices.length },
          { id: 'pnl', label: '9. Profit & Loss', icon: <TrendingUp size={16} /> },
          { id: 'activity', label: '10. Activity Log', icon: <History size={16} />, badge: auditLogs.length },
        ]}
      />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* BOQ Prompt Banner if no BOQ exists */}
          {boqs.length === 0 && (
            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4) var(--space-5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    backgroundColor: '#dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                  }}
                >
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1rem' }}>
                    Step 1 Required: Create Bill of Quantities (BOQ)
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#1e40af' }}>
                    This new job currently has no BOQ. Define sections, quantities, and rates to enable purchases, site tasks, and profit tracking.
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button
                  size="sm"
                  variant="accent"
                  icon={<Plus size={16} />}
                  onClick={() => {
                    setActiveTab('boq');
                    setIsBOQBuilderOpen(true);
                  }}
                >
                  + Create Full Detailed BOQ
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Sparkles size={16} />}
                  onClick={() => {
                    ERPService.createDefaultTemplateBOQ(job.id);
                    loadJobData();
                    showToast('Template Loaded', 'Populated standard electrical BOQ template with 3 sections.', 'success');
                  }}
                >
                  ⚡ Load Standard Template
                </Button>
              </div>
            </div>
          )}

          {/* Top Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            <StatCard
              label="Quoted Amount"
              value={`₹${job.quotedAmount.toLocaleString('en-IN')}`}
              meta={selectedBoq ? `Based on BOQ ${selectedBoq.versionLabel}` : 'Initial Quote'}
              icon={<DollarSign size={22} />}
              iconBg="#f0f9ff"
              iconColor="#0284c7"
            />
            <StatCard
              label="Actual Spend So Far"
              value={`₹${job.actualSpend.toLocaleString('en-IN')}`}
              meta={`${job.quotedAmount > 0 ? Math.round((job.actualSpend / job.quotedAmount) * 100) : 0}% of Quoted Budget`}
              icon={<ShoppingCart size={22} />}
              iconBg={isOverBudget ? '#fef2f2' : '#fef3c7'}
              iconColor={isOverBudget ? '#dc2626' : '#d97706'}
            />
            <StatCard
              label="Net Projected P&L"
              value={`₹${(pnl?.profit || 0).toLocaleString('en-IN')}`}
              meta={`Margin: ${(pnl?.marginPct || 0).toFixed(1)}%`}
              icon={<TrendingUp size={22} />}
              iconBg={pnl && pnl.profit >= 0 ? '#ecfdf5' : '#fef2f2'}
              iconColor={pnl && pnl.profit >= 0 ? '#059669' : '#dc2626'}
            />
            <StatCard
              label="Site Progress"
              value={`${job.progressPct}%`}
              meta={`${tasks.filter((t) => t.status === 'Completed').length} / ${tasks.length} Tasks Finished`}
              icon={<CheckSquare size={22} />}
              iconBg="var(--color-primary-subtle)"
              iconColor="var(--color-primary)"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
            {/* Job Metadata Card */}
            <Card title="Contract & Site Details">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: '0.9rem' }}>
                <div><strong>Client Company:</strong> {job.clientName}</div>
                <div><strong>Client Contact Email:</strong> {job.clientEmail}</div>
                <div><strong>Site Location:</strong> {job.siteLocation}</div>
                <div><strong>Project Scope:</strong> {job.scope}</div>
                <div><strong>Target Timeline:</strong> {job.startDate} to {job.targetEndDate}</div>
                <div><strong>Project Manager:</strong> {job.assignedManager}</div>
                <div><strong>Site Supervisor:</strong> {job.assignedSupervisor}</div>
                {job.notes && (
                  <div style={{ background: '#f8fafc', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginTop: 4 }}>
                    <strong>Special Notes:</strong> {job.notes}
                  </div>
                )}
              </div>
            </Card>

            {/* Spend Breakdown by Cost Type */}
            <Card title="Spend Breakdown by Cost Category">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                  { label: 'Materials & Equipment', amount: pnl?.materialSpend || 0, color: 'var(--color-primary)' },
                  { label: 'Transportation & Logistics', amount: pnl?.transportSpend || 0, color: 'var(--color-accent)' },
                  { label: 'Labour & Daily Wages', amount: pnl?.laborSpend || 0, color: '#059669' },
                  { label: 'Petty Cash & Site Food', amount: pnl?.pettyCashSpend || 0, color: '#0284c7' },
                  { label: 'Other Operational Expenses', amount: pnl?.otherSpend || 0, color: '#64748b' },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-gray-700)' }}>{item.label}</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-gray-900)' }}>₹{item.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ width: '100%', height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, (pnl?.totalActualCost || 1) > 0 ? (item.amount / (pnl?.totalActualCost || 1)) * 100 : 0)}%`,
                          height: '100%',
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: BOQ / QUOTATION */}
      {activeTab === 'boq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {boqs.length === 0 || !selectedBoq ? (
            <div
              className="ui-card"
              style={{
                padding: 'var(--space-10) var(--space-6)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: '#ffffff',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                  marginBottom: 16,
                }}
              >
                <FileSpreadsheet size={32} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 8 }}>
                No BOQ Created for {job.id} Yet
              </h3>
              <p style={{ color: 'var(--color-gray-600)', maxWidth: 540, fontSize: '0.95rem', marginBottom: 24, lineHeight: 1.5 }}>
                Every rupee, purchase order, and material allocation in this electrical job connects directly to the Bill of Quantities. Build a detailed BOQ with custom sections (Transformers, Circuit Mains, Lighting & Fans), line quantities, and supply & erection rates.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  variant="accent"
                  size="lg"
                  icon={<Plus size={20} />}
                  onClick={() => setIsBOQBuilderOpen(true)}
                >
                  + Create Full Detailed BOQ
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  icon={<Sparkles size={20} />}
                  onClick={() => {
                    const template = ERPService.createDefaultTemplateBOQ(job.id);
                    loadJobData();
                    setSelectedBoq(template);
                    setEditedBoq(JSON.parse(JSON.stringify(template)));
                    showToast('Template Loaded', 'Populated standard electrical contracting template.', 'success');
                  }}
                >
                  ⚡ Load Standard Electrical Template
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Header Bar with Multiple BOQ Packages & Actions */}
              <div
                className="ui-card"
                style={{
                  padding: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-primary)' }}>
                      Job BOQ Packages ({boqs.length}):
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {boqs.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setSelectedBoq(b);
                            setEditedBoq(JSON.parse(JSON.stringify(b)));
                            setIsEditingRates(false);
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            backgroundColor: selectedBoq?.id === b.id ? '#ffffff' : '#f8fafc',
                            color: selectedBoq?.id === b.id ? 'var(--color-primary)' : 'var(--color-gray-700)',
                            border: selectedBoq?.id === b.id ? '2px solid var(--color-primary)' : '1px solid var(--border-light)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: selectedBoq?.id === b.id ? 'var(--shadow-xs)' : 'none',
                          }}
                        >
                          <span>{b.packageCode ? `[${b.packageCode}]` : b.versionLabel} {b.title || 'Package'}</span>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              backgroundColor: b.status === 'Rates Pending' ? '#fef3c7' : b.status === 'Approved' ? '#dcfce7' : '#e0e7ff',
                              color: b.status === 'Rates Pending' ? '#92400e' : b.status === 'Approved' ? '#166534' : '#3730a3',
                            }}
                          >
                            {b.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Plus size={14} />}
                      onClick={() => {
                        setBoqBuilderMode('create');
                        setIsBOQBuilderOpen(true);
                      }}
                      title="Add another package or variation BOQ to this job"
                    >
                      + New BOQ Package
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Edit3 size={14} />}
                      onClick={() => {
                        setBoqBuilderMode('edit');
                        setIsBOQBuilderOpen(true);
                      }}
                      title="Edit this BOQ in Full Builder"
                    >
                      Edit Package
                    </Button>
                    {!isEditingRates ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<DollarSign size={14} />}
                        onClick={() => setIsEditingRates(true)}
                        title="Quickly fill or adjust supply & erection rates"
                      >
                        Inline Rate Mode
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsEditingRates(false);
                            setEditedBoq(JSON.parse(JSON.stringify(selectedBoq)));
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="accent"
                          icon={<CheckCircle2 size={14} />}
                          onClick={() => setIsSaveRevisionModalOpen(true)}
                        >
                          Save Rates
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="accent"
                      icon={<ShoppingCart size={14} />}
                      onClick={() => {
                        setPoInitialItems([]);
                        setIsJobPOModalOpen(true);
                      }}
                      title="Create Purchase Order mapped to this BOQ"
                    >
                      🛒 Raise PO from BOQ
                    </Button>
                    <Button size="sm" variant="secondary" icon={<Download size={14} />} onClick={handleExportCSV}>
                      Export CSV
                    </Button>
                  </div>
                </div>

                {/* Subtitle info and Rates Pending alert */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontSize: '0.84rem', color: 'var(--color-gray-600)' }}>
                    Active: <strong>{selectedBoq?.title}</strong> ({selectedBoq?.packageCode || selectedBoq?.versionLabel}) • Classification: <strong>{selectedBoq?.boqType || 'Standard Offer'}</strong>
                    {selectedBoq?.revisionReason && <span style={{ fontStyle: 'italic', marginLeft: 8 }}>— "{selectedBoq.revisionReason}"</span>}
                  </div>

                  {selectedBoq?.status === 'Rates Pending' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: 6, fontSize: '0.82rem', color: '#92400e', fontWeight: 700 }}>
                      <Clock size={14} />
                      Step 1 Done: Takeoff Complete. Waiting for Admin Supply & Erection Rates!
                    </div>
                  )}
                </div>
              </div>

              {/* BOQ Table / Sections Display */}
          {(isEditingRates ? editedBoq : selectedBoq)?.sections.map((section, sIdx) => (
            <div key={section.id} className="ui-card" style={{ overflow: 'hidden' }}>
              <div
                style={{
                  backgroundColor: 'var(--color-primary-subtle)',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1rem' }}>
                  {section.sectionNumber} {section.title}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-primary)' }}>
                  Section Total: ₹{section.sectionGrandTotal.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="ui-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 50 }}>S.No</th>
                      <th style={{ minWidth: 260 }}>Description of Item</th>
                      <th style={{ width: 70, textAlign: 'right' }}>Qty</th>
                      <th style={{ width: 70 }}>Unit</th>
                      <th style={{ width: 110, textAlign: 'right' }}>Supply Rate (₹)</th>
                      <th style={{ width: 110, textAlign: 'right' }}>Erection Rate (₹)</th>
                      <th style={{ width: 120, textAlign: 'right' }}>Supply Amt (₹)</th>
                      <th style={{ width: 120, textAlign: 'right' }}>Erection Amt (₹)</th>
                      <th style={{ width: 130, textAlign: 'right' }}>Total Amt (₹)</th>
                      <th style={{ minWidth: 160 }}>Assigned Vendor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((line, lIdx) => (
                      <tr key={line.id}>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setBreakdownTarget({ sIdx, lIdx })}
                            style={{
                              padding: '2px 6px',
                              borderRadius: 4,
                              backgroundColor: line.components && line.components.length > 0 ? '#f0fdf4' : '#eff6ff',
                              color: line.components && line.components.length > 0 ? '#166534' : '#1d4ed8',
                              border: line.components && line.components.length > 0 ? '1px solid #86efac' : '1px solid #bfdbfe',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                            title={`Click to open Add Component / BOM Breakdown for [${line.sNo}]`}
                          >
                            <span>{line.sNo}</span>
                            <Package size={11} />
                          </button>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {line.slNoRef && (
                            <span
                              style={{
                                marginRight: 6,
                                padding: '1px 6px',
                                borderRadius: 4,
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                border: '1px solid #bfdbfe',
                              }}
                              title="Mapped from Excel Stock Details (Stock details1 - Copy.xls)"
                            >
                              Excel #{line.slNoRef}
                            </span>
                          )}
                          {line.description}
                          <div style={{ marginTop: 4 }}>
                            <button
                              type="button"
                              onClick={() => setBreakdownTarget({ sIdx, lIdx })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: '0.73rem',
                                fontWeight: 700,
                                color: line.components && line.components.length > 0 ? '#15803d' : '#1d4ed8',
                                backgroundColor: line.components && line.components.length > 0 ? '#f0fdf4' : '#eff6ff',
                                padding: '2px 8px',
                                borderRadius: 4,
                                border: line.components && line.components.length > 0 ? '1px solid #bbf7d0' : '1px dashed #bfdbfe',
                                cursor: 'pointer',
                              }}
                              title="Click to view or add constituent materials & admin prices"
                            >
                              <Package size={12} />
                              {line.components && line.components.length > 0 ? (
                                <span>
                                  📦 Pre-BOQ Breakdown ({line.components.length} materials)
                                  {line.components.some(c => (c.unitCost || 0) > 0) && (
                                    <span style={{ marginLeft: 4, color: '#166534', fontWeight: 800 }}>
                                      (₹{line.components.reduce((sum, c) => {
                                        const pQty = Number(line.qty) || 0;
                                        const ratio = c.qtyPerUnit !== undefined && c.qtyPerUnit !== null ? Number(c.qtyPerUnit) : (pQty > 0 ? (Number(c.totalQty) / pQty) : Number(c.totalQty) || 1);
                                        return sum + (ratio * pQty * (c.unitCost || 0));
                                      }, 0).toLocaleString('en-IN')})
                                    </span>
                                  )}
                                  : {line.components.map(c => {
                                    const pQty = Number(line.qty) || 0;
                                    const ratio = c.qtyPerUnit !== undefined && c.qtyPerUnit !== null ? Number(c.qtyPerUnit) : (pQty > 0 ? (Number(c.totalQty) / pQty) : Number(c.totalQty) || 1);
                                    const total = Math.round(ratio * pQty * 100) / 100;
                                    return `${total} ${c.unit} ${c.name}`;
                                  }).slice(0, 3).join(', ')}{line.components.length > 3 ? '...' : ''}
                                </span>
                              ) : (
                                <span>+ Add Components / BOM Breakdown (Admin Rates)</span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleProcureBOQLine(line, section)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: '0.73rem',
                                fontWeight: 700,
                                color: '#0369a1',
                                backgroundColor: '#e0f2fe',
                                padding: '2px 8px',
                                borderRadius: 4,
                                border: '1px solid #bae6fd',
                                cursor: 'pointer',
                                marginLeft: 6,
                              }}
                              title={`Create Purchase Order for [${line.sNo}]`}
                            >
                              <ShoppingCart size={11} />
                              <span>{line.components && line.components.length > 0 ? '🛒 Procure BOM' : '🛒 Procure'}</span>
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{line.qty}</td>
                        <td>{line.unit}</td>
                        <td style={{ textAlign: 'right' }}>
                          {isEditingRates ? (
                            <input
                              type="number"
                              value={line.supplyRate}
                              onChange={(e) => handleRateChange(sIdx, lIdx, 'supplyRate', e.target.value)}
                              style={{ width: 90, padding: 4, borderRadius: 4, border: '1px solid var(--border-strong)', textAlign: 'right' }}
                            />
                          ) : (
                            `₹${line.supplyRate.toLocaleString('en-IN')}`
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {isEditingRates ? (
                            <input
                              type="number"
                              value={line.erectionRate}
                              onChange={(e) => handleRateChange(sIdx, lIdx, 'erectionRate', e.target.value)}
                              style={{ width: 90, padding: 4, borderRadius: 4, border: '1px solid var(--border-strong)', textAlign: 'right' }}
                            />
                          ) : (
                            `₹${line.erectionRate.toLocaleString('en-IN')}`
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ₹{line.supplyAmount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ₹{line.erectionAmount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-primary)' }}>
                          ₹{line.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td>
                          {isEditingRates ? (
                            <select
                              value={line.vendorId || ''}
                              onChange={(e) => handleRateChange(sIdx, lIdx, 'vendorId', e.target.value)}
                              style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid var(--border-strong)' }}
                            >
                              <option value="">-- Choose Vendor --</option>
                              {vendors.map((v) => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                              ))}
                            </select>
                          ) : (
                            line.vendorName || <span style={{ color: 'var(--color-gray-400)' }}>Unassigned</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Grand Totals Summary Card */}
          <div
            className="ui-card"
            style={{
              padding: 'var(--space-5)',
              backgroundColor: '#fafbfc',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <div style={{ minWidth: 320, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.92rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Supply Amount:</span>
                <strong>₹{(isEditingRates ? editedBoq : selectedBoq)?.totalSupplyAmount.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Erection Amount:</span>
                <strong>₹{(isEditingRates ? editedBoq : selectedBoq)?.totalErectionAmount.toLocaleString('en-IN')}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  borderTop: '2px solid var(--color-primary)',
                  fontSize: '1.15rem',
                  color: 'var(--color-primary)',
                  fontWeight: 800,
                }}
              >
                <span>Grand Total Quoted:</span>
                <span>₹{(isEditingRates ? editedBoq : selectedBoq)?.grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )}

      {/* TAB 3: PURCHASES */}
      {activeTab === 'purchases' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                Purchase Orders against {job.id}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>
                Tracks partial purchases against BOQ line quantities with approval trigger rules.
              </p>
            </div>
            <Button
              variant="accent"
              icon={<Plus size={16} />}
              onClick={() => {
                setPoInitialItems([]);
                setIsJobPOModalOpen(true);
              }}
            >
              Raise Purchase Order
            </Button>
          </div>

          <DataTable<PurchaseOrder>
            data={purchases}
            keyExtractor={(item) => item.id}
            columns={[
              {
                key: 'id',
                header: 'PO Number',
                render: (p) => (
                  <div
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedJobPOForDetail(p);
                      setIsJobPODetailModalOpen(true);
                    }}
                  >
                    <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{p.id}</span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>Date: {p.date}</div>
                  </div>
                ),
              },
              {
                key: 'vendorName',
                header: 'Vendor Name',
                render: (p) => (
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.vendorName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>Location: {p.deliveryLocation}</div>
                  </div>
                ),
              },
              {
                key: 'items',
                header: 'Items Purchased',
                render: (p) => (
                  <div style={{ fontSize: '0.82rem' }}>
                    {p.items.map((i) => (
                      <div key={i.id}>
                        • {i.purchaseQty} {i.unit} - {i.itemName} @ ₹{i.purchaseRate}
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: 'grandTotal',
                header: 'Total (INR)',
                render: (p) => (
                  <div style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                    ₹{p.grandTotal.toLocaleString('en-IN')}
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (p) => <Badge status={p.status} />,
              },
              {
                key: 'action',
                header: 'Action',
                render: (p) => (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedJobPOForDetail(p);
                      setIsJobPODetailModalOpen(true);
                    }}
                  >
                    View PO
                  </Button>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* TAB 4: STOCK */}
      {activeTab === 'stock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                Site Stock Ledger for {job.id}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>
                Stock on Site = Received Quantity minus Issued Quantity.
              </p>
            </div>
            <Button variant="secondary" icon={<Boxes size={16} />} onClick={() => navigate('/inventory')}>
              Go to Full Inventory
            </Button>
          </div>

          <DataTable<StockLedgerItem>
            data={stockLedger}
            keyExtractor={(s) => s.id}
            columns={[
              { key: 'slNo', header: 'Sl No', render: (s) => s.slNo },
              {
                key: 'itemName',
                header: 'Item & Specification',
                render: (s) => (
                  <div>
                    <div style={{ fontWeight: 700 }}>{s.itemName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)' }}>{s.specification}</div>
                  </div>
                ),
              },
              { key: 'unit', header: 'Unit' },
              { key: 'receivedQty', header: 'Received Qty', render: (s) => <strong>{s.receivedQty}</strong> },
              { key: 'issuedQty', header: 'Issued Qty', render: (s) => <strong>{s.issuedQty}</strong> },
              {
                key: 'stockOnSite',
                header: 'Stock On Site',
                render: (s) => (
                  <span style={{ fontWeight: 800, color: s.stockOnSite <= s.minStockLevel ? 'var(--color-danger)' : 'var(--color-success)', fontSize: '0.95rem' }}>
                    {s.stockOnSite}
                  </span>
                ),
              },
              { key: 'responsiblePerson', header: 'Site Custodian' },
            ]}
          />

          {/* Stock Movements for this Job */}
          <Card title="Recent Stock Movements (In & Out of Site)">
            <DataTable<StockMovement>
              data={stockMovements}
              keyExtractor={(m) => m.id}
              columns={[
                { key: 'date', header: 'Date' },
                { key: 'type', header: 'Type', render: (m) => <Badge status={m.type} /> },
                { key: 'item', header: 'Item & Qty', render: (m) => <strong>{m.qty} {m.unit} of {m.itemName}</strong> },
                { key: 'route', header: 'From / To Location', render: (m) => <div style={{ fontSize: '0.82rem' }}>{m.fromLocation} → {m.toLocation}</div> },
                { key: 'responsibleUser', header: 'Authorized By' },
                { key: 'remarks', header: 'Remarks' },
              ]}
            />
          </Card>
        </div>
      )}

      {/* TAB 5: SITE TASKS & EXTRA MATERIAL */}
      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                Site Tasks & Daily Progress Logs
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>
                Each task has allowed material per unit of work. Extra material requires measured justification.
              </p>
            </div>
            <Button
              variant="accent"
              icon={<Plus size={16} />}
              onClick={() => setIsExtraMaterialModalOpen(true)}
            >
              Request Extra Material
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {tasks.map((task) => (
              <div key={task.id} className="ui-card" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary)' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)', marginTop: 2 }}>
                      {task.description}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-gray-500)', marginTop: 4 }}>
                      Supervisor: <strong>{task.assignedSupervisor}</strong> | Assigned Crew: {task.assignedWorkers.join(', ')}
                    </div>
                  </div>
                  <Badge status={task.status} />
                </div>

                {/* Material Mapping Rule */}
                <div style={{ marginTop: 12, backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-gray-600)', textTransform: 'uppercase' }}>
                    Material Consumption Mapping Formula:
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
                    {task.allowedMaterials.map((mat) => (
                      <span key={mat.itemId} style={{ fontSize: '0.85rem', color: 'var(--color-gray-800)' }}>
                        • 1 {task.unit} = <strong>{mat.allowedPerUnit} {mat.unit}</strong> of {mat.itemName}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                    <span>Progress: <strong>{task.completedQty}</strong> / {task.targetQty} {task.unit}</span>
                    <span style={{ fontWeight: 700 }}>{Math.round((task.completedQty / task.targetQty) * 100)}%</span>
                  </div>
                  <div style={{ width: '100%', height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, (task.completedQty / task.targetQty) * 100)}%`,
                        height: '100%',
                        backgroundColor: 'var(--color-success)',
                      }}
                    />
                  </div>
                </div>

                {/* Daily log entries */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-gray-600)', marginBottom: 6 }}>
                    Supervisor Daily Logs:
                  </div>
                  {task.dailyLogs.map((log) => (
                    <div key={log.id} style={{ fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px dashed var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>{log.date}:</strong> Completed {log.completedQtyToday} {task.unit} — {log.notes}</span>
                      <span style={{ color: 'var(--color-gray-500)' }}>{log.supervisorName}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pending Material Requests for this job */}
          {materialRequests.length > 0 && (
            <Card title="Extra Material Requests History (Audit Trail)">
              <DataTable<MaterialRequest>
                data={materialRequests}
                keyExtractor={(r) => r.id}
                columns={[
                  { key: 'requestedAt', header: 'Requested At' },
                  { key: 'item', header: 'Item & Qty', render: (r) => <strong>+{r.requestedExtraQty} {r.unit} ({r.itemName})</strong> },
                  { key: 'reason', header: 'Measured Reason', render: (r) => <span style={{ color: 'var(--color-gray-700)' }}>{r.reason}</span> },
                  { key: 'requestedBy', header: 'Requested By' },
                  { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
                  {
                    key: 'actions',
                    header: 'Admin Action',
                    render: (r) =>
                      r.status === 'Pending' && currentUser.role === 'Admin' ? (
                        <Button
                          size="sm"
                          variant="accent"
                          onClick={() => {
                            const reason = window.prompt('Enter reason for approving extra material:');
                            if (reason) {
                              ERPService.approveMaterialRequest(r.id, reason);
                              showToast('Approved', 'Extra material request approved.', 'success');
                            }
                          }}
                        >
                          Approve
                        </Button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                          {r.approvedBy ? `By ${r.approvedBy}` : '—'}
                        </span>
                      ),
                  },
                ]}
              />
            </Card>
          )}
        </div>
      )}

      {/* TAB 6: EMPLOYEES & ATTENDANCE */}
      {activeTab === 'employees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                Site Attendance & Labour Cost Flow
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>
                Attendance recorded here calculates daily wages and flows directly into Job Spend and P&L.
              </p>
            </div>
            <Button
              variant="accent"
              icon={<Plus size={16} />}
              onClick={() => setIsAttendanceModalOpen(true)}
            >
              Mark Site Attendance
            </Button>
          </div>

          <DataTable<AttendanceRecord>
            data={attendance}
            keyExtractor={(a) => a.id}
            columns={[
              { key: 'date', header: 'Date' },
              { key: 'employeeName', header: 'Worker Name', render: (a) => <strong>{a.employeeName}</strong> },
              { key: 'status', header: 'Attendance Status', render: (a) => <Badge status={a.status} /> },
              { key: 'hoursWorked', header: 'Hours Worked', render: (a) => `${a.hoursWorked} hrs` },
              {
                key: 'dailyCost',
                header: 'Labour Cost (Flows to Job P&L)',
                render: (a) => <strong style={{ color: 'var(--color-primary)' }}>₹{a.dailyCost.toLocaleString('en-IN')}</strong>,
              },
              { key: 'recordedBy', header: 'Supervisor Recorded' },
            ]}
          />
        </div>
      )}

      {/* TAB 7: EXPENSES */}
      {activeTab === 'expenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                Expenses Charged to {job.id}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>
                Transportation, site food cash, crane lifting, fuel, and miscellaneous site spends.
              </p>
            </div>
            <Button
              variant="accent"
              icon={<Plus size={16} />}
              onClick={() => setIsExpenseModalOpen(true)}
            >
              Record New Expense
            </Button>
          </div>

          <DataTable<ExpenseRecord>
            data={expenses}
            keyExtractor={(e) => e.id}
            columns={[
              { key: 'date', header: 'Date' },
              { key: 'category', header: 'Cost Category', render: (e) => <Badge status={e.category} showIcon={false} /> },
              {
                key: 'amount',
                header: 'Amount (INR)',
                render: (e) => <strong style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>₹{e.amount.toLocaleString('en-IN')}</strong>,
              },
              { key: 'paidBy', header: 'Paid By' },
              { key: 'notes', header: 'Purpose / Bill Notes' },
              { key: 'status', header: 'Approval Status', render: (e) => <Badge status={e.status} /> },
            ]}
          />
        </div>
      )}

      {/* TAB 8: BILLING & INVOICES */}
      {activeTab === 'billing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                Client Billing, Invoices & Collections
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>
                Progress payment requests and payment collection tracking against {job.id}.
              </p>
            </div>
            <Button
              variant="accent"
              icon={<Plus size={16} />}
              onClick={() => navigate(`/accounts?createInvoice=true&jobId=${job.id}`)}
            >
              Create Client Invoice
            </Button>
          </div>

          <DataTable<ClientInvoice>
            data={invoices}
            keyExtractor={(inv) => inv.id}
            columns={[
              {
                key: 'id',
                header: 'Invoice #',
                render: (inv) => <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{inv.id}</span>,
              },
              { key: 'date', header: 'Invoice Date' },
              { key: 'dueDate', header: 'Due Date' },
              {
                key: 'grandTotal',
                header: 'Invoice Amount',
                render: (inv) => <strong>₹{inv.grandTotal.toLocaleString('en-IN')}</strong>,
              },
              {
                key: 'paidAmount',
                header: 'Paid Amount',
                render: (inv) => <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>₹{inv.paidAmount.toLocaleString('en-IN')}</span>,
              },
              {
                key: 'balanceDue',
                header: 'Balance Due',
                render: (inv) => <span style={{ color: inv.balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-gray-500)', fontWeight: 700 }}>₹{inv.balanceDue.toLocaleString('en-IN')}</span>,
              },
              { key: 'status', header: 'Status', render: (inv) => <Badge status={inv.status} /> },
            ]}
          />
        </div>
      )}

      {/* TAB 9: PROFIT & LOSS */}
      {activeTab === 'pnl' && pnl && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            <StatCard
              label="Quoted Revenue"
              value={`₹${pnl.quotedRevenue.toLocaleString('en-IN')}`}
              icon={<DollarSign size={22} />}
              iconBg="#f0f9ff"
              iconColor="#0284c7"
            />
            <StatCard
              label="Total Actual Spend"
              value={`₹${pnl.totalActualCost.toLocaleString('en-IN')}`}
              icon={<ShoppingCart size={22} />}
              iconBg="#fef3c7"
              iconColor="#d97706"
            />
            <StatCard
              label={pnl.profit >= 0 ? 'Net Profit' : 'Net Loss'}
              value={`₹${Math.abs(pnl.profit).toLocaleString('en-IN')}`}
              meta={`Margin: ${pnl.marginPct.toFixed(1)}%`}
              icon={<TrendingUp size={22} />}
              iconBg={pnl.profit >= 0 ? '#ecfdf5' : '#fef2f2'}
              iconColor={pnl.profit >= 0 ? '#059669' : '#dc2626'}
            />
          </div>

          <Card title="Comprehensive Job P&L Breakdown">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: '0.92rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span>1. Materials & Equipment Purchased</span>
                <strong>₹{pnl.materialSpend.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span>2. Transportation, Freight & Delivery</span>
                <strong>₹{pnl.transportSpend.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span>3. Site Labour & Electrician Wages</span>
                <strong>₹{pnl.laborSpend.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span>4. Petty Cash, Tea & Site Allowances</span>
                <strong>₹{pnl.pettyCashSpend.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span>5. Other Operational Costs</span>
                <strong>₹{pnl.otherSpend.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid var(--border-strong)', fontSize: '1.05rem', fontWeight: 800 }}>
                <span>Total Expenditure</span>
                <span>₹{pnl.totalActualCost.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid var(--color-primary)', fontSize: '1.2rem', fontWeight: 800, color: pnl.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                <span>Net Margin ({pnl.marginPct.toFixed(1)}%)</span>
                <span>{pnl.profit >= 0 ? '+' : '-'} ₹{Math.abs(pnl.profit).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 10: ACTIVITY & AUDIT LOG */}
      {activeTab === 'activity' && (
        <Card title={`Full Audit Trail for ${job.id}`}>
          <Timeline
            events={auditLogs.map((log) => ({
              id: log.id,
              title: `${log.action}: ${log.entity}`,
              timestamp: log.timestamp,
              user: log.userName,
              role: log.role,
              reason: log.reason,
              details: (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-700)' }}>
                  {log.oldValue && <div>Old Value: <span style={{ textDecoration: 'line-through' }}>{log.oldValue}</span></div>}
                  {log.newValue && <div>New Value: <strong>{log.newValue}</strong></div>}
                </div>
              ),
            }))}
          />
        </Card>
      )}

      {/* Update Job Status Modal */}
      <Modal
        isOpen={isUpdateStatusModalOpen}
        onClose={() => setIsUpdateStatusModalOpen(false)}
        title="Update Job Lifecycle Status"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Select
            label="Select New Status"
            value={newStatus}
            options={[
              { value: 'Draft', label: 'Draft' },
              { value: 'BOQ Prepared', label: 'BOQ Prepared' },
              { value: 'Rates Pending', label: 'Rates Pending' },
              { value: 'Quoted', label: 'Quoted' },
              { value: 'Approved', label: 'Approved (Client Signed)' },
              { value: 'In Progress', label: 'In Progress (On-site Work)' },
              { value: 'Completed', label: 'Completed' },
            ]}
            onChange={(e) => setNewStatus(e.target.value as any)}
          />

          <div className="ui-form-group">
            <label className="ui-label">
              Reason for Status Update <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <textarea
              className="ui-input ui-textarea"
              rows={3}
              placeholder="e.g. Client signed agreement letter ref #APX-491; work commencing."
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button variant="secondary" onClick={() => setIsUpdateStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmStatusUpdate}>
              Save Status Update
            </Button>
          </div>
        </div>
      </Modal>

      {/* Save Revision Modal */}
      <Modal
        isOpen={isSaveRevisionModalOpen}
        onClose={() => setIsSaveRevisionModalOpen(false)}
        title="Save New BOQ Revision"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-gray-700)' }}>
            Saving this will create version <strong>v{boqs.length + 1}</strong> with total quoted amount <strong>₹{editedBoq?.grandTotal.toLocaleString('en-IN')}</strong>. All previous revisions remain preserved in history.
          </p>

          <div className="ui-form-group">
            <label className="ui-label">
              Mandatory Reason for Revision <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <textarea
              className="ui-input ui-textarea"
              rows={3}
              placeholder="e.g. Client negotiated 5% discount on erection charges; updated transformer vendor rate."
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button variant="secondary" onClick={() => setIsSaveRevisionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={handleSaveBOQRevision}>
              Confirm & Save Revision
            </Button>
          </div>
        </div>
      </Modal>

      {/* Request Extra Material Modal */}
      <Modal
        isOpen={isExtraMaterialModalOpen}
        onClose={() => setIsExtraMaterialModalOpen(false)}
        title="Request Extra Material for Site"
      >
        <form onSubmit={handleSubmitExtraMaterial}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Select
              label="Item Needed *"
              options={[
                { value: '', label: '-- Select Item from Master --' },
                ...ERPService.getItems().map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` })),
              ]}
              value={extraMaterialData.itemId}
              onChange={(e) => setExtraMaterialData({ ...extraMaterialData, itemId: e.target.value })}
              required
            />

            <Input
              type="number"
              label="Extra Quantity Required *"
              placeholder="e.g. 5"
              value={extraMaterialData.requestedExtraQty}
              onChange={(e) => setExtraMaterialData({ ...extraMaterialData, requestedExtraQty: e.target.value })}
              required
            />

            <div className="ui-form-group">
              <label className="ui-label">
                Measured Reason on Site <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <textarea
                className="ui-input ui-textarea"
                rows={3}
                placeholder="Explain what was measured at site that caused extra requirement..."
                value={extraMaterialData.reason}
                onChange={(e) => setExtraMaterialData({ ...extraMaterialData, reason: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button type="button" variant="secondary" onClick={() => setIsExtraMaterialModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent">
                Submit Request to Admin
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Mark Attendance Modal */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title={`Mark Site Attendance for ${job.id}`}
      >
        <form onSubmit={handleMarkAttendance}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Select
              label="Select Worker / Electrician *"
              options={[
                { value: '', label: '-- Choose Employee --' },
                ...ERPService.getEmployees().map((e) => ({ value: e.id, label: `${e.name} (${e.role} - ₹${e.dailyWage}/day)` })),
              ]}
              value={attendanceData.employeeId}
              onChange={(e) => setAttendanceData({ ...attendanceData, employeeId: e.target.value })}
              required
            />

            <Select
              label="Status *"
              options={[
                { value: 'Present', label: 'Present (Full Day)' },
                { value: 'Half Day', label: 'Half Day' },
                { value: 'Overtime', label: 'Overtime (1.4x Wage)' },
                { value: 'Absent', label: 'Absent' },
              ]}
              value={attendanceData.status}
              onChange={(e) => setAttendanceData({ ...attendanceData, status: e.target.value as any })}
            />

            <Input
              type="date"
              label="Date"
              value={attendanceData.date}
              onChange={(e) => setAttendanceData({ ...attendanceData, date: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button type="button" variant="secondary" onClick={() => setIsAttendanceModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Attendance Record
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title={`Record Expense against ${job.id}`}
      >
        <form onSubmit={handleAddExpense}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Select
              label="Cost Category *"
              options={ERPService.getCostTypes().map((ct) => ({ value: ct.name, label: ct.name }))}
              value={expenseData.category}
              onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
            />

            <Input
              type="number"
              label="Amount (₹) *"
              placeholder="e.g. 1500"
              value={expenseData.amount}
              onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
              required
            />

            <Input
              label="Paid By"
              value={expenseData.paidBy}
              onChange={(e) => setExpenseData({ ...expenseData, paidBy: e.target.value })}
            />

            <div className="ui-form-group">
              <label className="ui-label">Purpose / Notes</label>
              <textarea
                className="ui-input ui-textarea"
                rows={2}
                placeholder="Details of expense..."
                value={expenseData.notes}
                onChange={(e) => setExpenseData({ ...expenseData, notes: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button type="button" variant="secondary" onClick={() => setIsExpenseModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Charge Expense to Job
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Full Detailed BOQ Builder Modal */}
      {isBOQBuilderOpen && (
        <BOQBuilderModal
          isOpen={isBOQBuilderOpen}
          onClose={() => setIsBOQBuilderOpen(false)}
          job={job}
          initialBOQ={boqBuilderMode === 'edit' ? selectedBoq : undefined}
          onSaved={(savedBoq) => {
            loadJobData();
            setSelectedBoq(savedBoq);
            setEditedBoq(JSON.parse(JSON.stringify(savedBoq)));
            setIsBOQBuilderOpen(false);
          }}
        />
      )}

      {/* Pre-BOQ Breakdown & Component Modal directly from Job BOQ view */}
      {breakdownTarget && selectedBoq?.sections[breakdownTarget.sIdx]?.items[breakdownTarget.lIdx] && (
        <PreBOQBreakdownModal
          isOpen={Boolean(breakdownTarget)}
          onClose={() => setBreakdownTarget(null)}
          parentLine={selectedBoq.sections[breakdownTarget.sIdx].items[breakdownTarget.lIdx]}
          onSaveComponents={handleSaveBreakdownComponentsFromJob}
        />
      )}

      {/* Create Purchase Order Modal directly from Job Spine */}
      <CreatePurchaseOrderModal
        isOpen={isJobPOModalOpen}
        onClose={() => setIsJobPOModalOpen(false)}
        initialJobId={job.id}
        initialMode="job_based"
        initialSelectedItems={poInitialItems}
        onSuccess={() => {
          loadJobData();
          setIsJobPOModalOpen(false);
        }}
      />

      {/* Purchase Order Detail & Voucher Modal */}
      <PurchaseOrderDetailModal
        isOpen={isJobPODetailModalOpen}
        onClose={() => setIsJobPODetailModalOpen(false)}
        purchaseOrder={selectedJobPOForDetail}
      />
    </div>
  );
};
