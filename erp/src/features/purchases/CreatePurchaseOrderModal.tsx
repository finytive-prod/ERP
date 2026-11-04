import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Package, 
  Briefcase,
  FileSpreadsheet,
  Info,
  Ticket,
  Globe,
  Building2,
  ArrowRight,
  ArrowLeft,
  Check,
  ClipboardList
} from 'lucide-react';
import { ERPService } from '../../services/erpStorage';
import { 
  PurchaseOrder, 
  PurchaseLine, 
  Job, 
  Vendor, 
  ItemMaster, 
  MeasurementUnit, 
  ProcurableBOQItem 
} from '../../types';
import { Button, useToast } from '../../components/ui';
import { MaterialMappingModal } from './MaterialMappingModal';

export type ProcurementMode = 'job_based' | 'multi_job';

interface CreatePurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialJobId?: string;
  initialMode?: ProcurementMode;
  initialIndentId?: string;
  initialSelectedItems?: Array<{
    jobId?: string;
    jobTitle?: string;
    boqLineId?: string;
    boqLineSNo?: string;
    sectionTitle?: string;
    componentId?: string;
    isBomComponent?: boolean;
    parentLineDescription?: string;
    parentLineQty?: number;
    parentLineUnit?: MeasurementUnit;
    qtyPerUnit?: number;
    itemId?: string;
    name: string;
    specification?: string;
    unit: MeasurementUnit;
    targetQty: number;
    alreadyPurchasedQty?: number;
    purchaseQty?: number;
    targetRate: number;
    purchaseRate?: number;
    vendorId?: string;
  }>;
  onSuccess?: (po: PurchaseOrder) => void;
}

export const CreatePurchaseOrderModal: React.FC<CreatePurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  initialJobId,
  initialMode,
  initialIndentId,
  initialSelectedItems,
  onSuccess,
}) => {
  const { showToast } = useToast();

  // Material Mapping Detail Modal target
  const [mappingModalTarget, setMappingModalTarget] = useState<{
    materialName: string;
    specification?: string;
    jobId?: string;
    componentId?: string;
  } | null>(null);

  // 2-Step Flow: 'items' (Full Screen Items Configurator) -> 'confirm' (PO Notes, Freight, GST & Final Issue)
  const [currentStep, setCurrentStep] = useState<'items' | 'confirm'>('items');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [itemCatalog, setItemCatalog] = useState<ItemMaster[]>([]);

  // Job Selection: Single Job by default; multi-job optional
  const [isMultiJob, setIsMultiJob] = useState<boolean>(initialMode === 'multi_job');
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || '');
  const [multiJobIds, setMultiJobIds] = useState<string[]>(initialJobId ? [initialJobId] : []);
  const [linkedIndentId, setLinkedIndentId] = useState<string | undefined>(initialIndentId);

  // Vendor & Delivery
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [deliveryLocation, setDeliveryLocation] = useState<string>('Site Store');
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [costType, setCostType] = useState<string>('Material');
  const [transportCost, setTransportCost] = useState<string>('0');
  const [taxPercent, setTaxPercent] = useState<number>(18);
  const [notes, setNotes] = useState<string>('');

  // PO Line Items (Main View Data)
  const [poLines, setPoLines] = useState<PurchaseLine[]>([]);

  // Mandatory Reason for Admin Approval Ticket when over limit / over price
  const [ticketReason, setTicketReason] = useState<string>('');

  // Available BOQ & BOM items for Item Picker
  const [boqItems, setBoqItems] = useState<Array<ProcurableBOQItem & { jobId: string; jobTitle: string }>>([]);
  const [boqSearchQ, setBoqSearchQ] = useState<string>('');
  const [selectedBoqKeys, setSelectedBoqKeys] = useState<Set<string>>(new Set());

  // Modals & Drawers
  const [isItemPickerOpen, setIsItemPickerOpen] = useState(false);
  const [isAddingCatalogItem, setIsAddingCatalogItem] = useState(false);
  const [catalogItemId, setCatalogItemId] = useState('');
  const [catalogQty, setCatalogQty] = useState('1');
  const [catalogRate, setCatalogRate] = useState('0');
  const [catalogTargetJobId, setCatalogTargetJobId] = useState('');

  const loadBaseData = () => {
    setJobs(ERPService.getJobs());
    setVendors(ERPService.getVendors());
    setItemCatalog(ERPService.getItems());
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  // Active Job IDs helper
  const activeJobIds = isMultiJob ? multiJobIds : (selectedJobId ? [selectedJobId] : []);

  // Set initial job and requisition indent when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setCurrentStep('items');
    setLinkedIndentId(initialIndentId);
    if (initialIndentId) {
      const allReqs = ERPService.getMaterialRequests();
      const req = allReqs.find((r) => r.id === initialIndentId);
      if (req) {
        if (req.jobId) {
          setSelectedJobId(req.jobId);
          setMultiJobIds([req.jobId]);
        }
        setDeliveryLocation(`Site Store - ${req.siteName || 'Site'} (Attn: ${req.siteEngineerName || 'Site Engineer'})`);
        setNotes(`Requisition Indent #${req.id} for Site: ${req.siteName || 'Site'}. Attn: ${req.siteEngineerName || 'Site Engineer'}. ${req.reason || ''}`);
      }
    }
    if (initialMode) {
      setIsMultiJob(initialMode === 'multi_job');
    }
    if (initialJobId) {
      setSelectedJobId(initialJobId);
      setMultiJobIds([initialJobId]);
    } else if (!initialIndentId) {
      const allJobs = ERPService.getJobs();
      if (allJobs.length > 0 && !selectedJobId) {
        setSelectedJobId(allJobs[0].id);
        setMultiJobIds([allJobs[0].id]);
      }
    }
  }, [isOpen, initialJobId, initialMode, initialIndentId]);

  // Load procurable items strictly for the active job(s)
  useEffect(() => {
    if (!isOpen) return;

    if (activeJobIds.length === 0) {
      setBoqItems([]);
      return;
    }

    if (!isMultiJob && selectedJobId) {
      // STRICT SINGLE JOB: Only load BOQ items belonging to this specific job!
      const currentJob = jobs.find((j) => j.id === selectedJobId);
      const jTitle = currentJob ? currentJob.title : '';
      const items = ERPService.getJobProcurementItems(selectedJobId).map((it) => ({
        ...it,
        jobId: selectedJobId,
        jobTitle: jTitle,
      }));
      setBoqItems(items);
    } else {
      // Multi-Job mode
      const combined: Array<ProcurableBOQItem & { jobId: string; jobTitle: string }> = [];
      multiJobIds.forEach((jId) => {
        const jObj = jobs.find((j) => j.id === jId);
        const jTitle = jObj ? jObj.title : '';
        const items = ERPService.getJobProcurementItems(jId).map((it) => ({
          ...it,
          jobId: jId,
          jobTitle: jTitle,
        }));
        combined.push(...items);
      });
      setBoqItems(combined);
    }
  }, [isOpen, isMultiJob, selectedJobId, multiJobIds, jobs]);

  // Handle initialSelectedItems when provided
  useEffect(() => {
    if (initialSelectedItems && initialSelectedItems.length > 0) {
      const converted: PurchaseLine[] = initialSelectedItems.map((it, idx) => {
        const jId = it.jobId || selectedJobId || (jobs[0]?.id || '');
        const jObj = jobs.find((j) => j.id === jId);
        const remaining = Math.max(0, it.targetQty - (it.alreadyPurchasedQty || 0));
        const pQty = it.purchaseQty !== undefined ? it.purchaseQty : (remaining > 0 ? remaining : it.targetQty);
        const pRate = it.purchaseRate !== undefined ? it.purchaseRate : it.targetRate;
        return {
          id: `poi-${Date.now()}-${idx}`,
          jobId: jId,
          jobTitle: it.jobTitle || jObj?.title || '',
          boqLineId: it.boqLineId,
          boqLineSNo: it.boqLineSNo,
          boqSectionTitle: it.sectionTitle,
          componentId: it.componentId,
          isBomComponent: it.isBomComponent,
          parentLineDescription: it.parentLineDescription,
          parentLineQty: it.parentLineQty,
          parentLineUnit: it.parentLineUnit,
          qtyPerUnit: it.qtyPerUnit,
          itemId: it.itemId || `itm-custom-${Date.now()}-${idx}`,
          itemName: it.name,
          specification: it.specification,
          unit: it.unit,
          boqQty: it.targetQty,
          alreadyPurchasedQty: it.alreadyPurchasedQty || 0,
          purchaseQty: pQty,
          quotedRate: it.targetRate,
          purchaseRate: pRate,
          totalAmount: Math.round(pQty * pRate * 100) / 100,
        };
      });
      setPoLines(converted);
      if (initialSelectedItems[0]?.vendorId) {
        setSelectedVendorId(initialSelectedItems[0].vendorId);
      }
    } else if (isOpen && (!initialSelectedItems || initialSelectedItems.length === 0)) {
      setPoLines([]);
      setTicketReason('');
    }
    setSelectedBoqKeys(new Set());
  }, [isOpen, initialSelectedItems]);

  const selectedVendorObj = vendors.find((v) => v.id === selectedVendorId);

  // Single Job selection handler: STRICTLY updates job and clears other job lines
  const handleSelectSingleJob = (newJobId: string) => {
    setSelectedJobId(newJobId);
    setMultiJobIds(newJobId ? [newJobId] : []);
    setPoLines([]); // Strict job isolation: reset lines so only this job's BOQ items are in order
    setSelectedBoqKeys(new Set());
  };

  // Multi-Job helpers
  const handleToggleMultiJob = (jobId: string) => {
    const next = multiJobIds.includes(jobId)
      ? multiJobIds.filter((id) => id !== jobId)
      : [...multiJobIds, jobId];
    setMultiJobIds(next);
  };

  const handleSelectAllJobs = () => {
    setMultiJobIds(jobs.map((j) => j.id));
  };

  const handleClearAllJobs = () => {
    setMultiJobIds([]);
  };

  // Toggle selection in BOQ items list (inside Item Picker Popup)
  const toggleSelectBoqKey = (key: string) => {
    const itm = filteredBoqItems.find((i) => i.key === key);
    if (itm && itm.balanceQty <= 0) {
      showToast(
        'Procurement Restricted',
        `"${itm.name}" is already 100% procured (${itm.orderedQty}/${itm.targetQty} ${itm.unit}). Ordering excess quantity is strictly prohibited!`,
        'danger'
      );
      return;
    }
    const next = new Set(selectedBoqKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedBoqKeys(next);
  };

  const handleSelectAllRemaining = () => {
    const remainingKeys = boqItems.filter((i) => i.balanceQty > 0).map((i) => i.key);
    setSelectedBoqKeys(new Set(remainingKeys));
  };

  // Add selected BOQ items to PO lines (with exact remaining BOQ limit pre-populated!)
  const handleAddSelectedBoqItemsToPO = () => {
    const toAdd = boqItems.filter((item) => selectedBoqKeys.has(item.key));
    if (toAdd.length === 0) {
      showToast('Selection Empty', 'Please check at least one product or material to add.', 'warning');
      return;
    }

    const exhausted = toAdd.filter((item) => item.balanceQty <= 0);
    const validToAdd = toAdd.filter((item) => item.balanceQty > 0);

    if (exhausted.length > 0 && validToAdd.length === 0) {
      showToast(
        'Procurement Restricted',
        `The selected item(s) (${exhausted.map((e) => e.name).join(', ')}) have already reached their full 100% BOQ limits. Ordering excess quantity is strictly not permitted!`,
        'danger'
      );
      return;
    }

    if (exhausted.length > 0) {
      showToast(
        'Some Items Skipped',
        `${exhausted.length} item(s) skipped because they are already 100% procured under BOQ limits.`,
        'warning'
      );
    }

    const newLines: PurchaseLine[] = [...poLines];
    let defaultVendorToSet = selectedVendorId;

    validToAdd.forEach((item, idx) => {
      const existsIdx = newLines.findIndex(
        (l) =>
          l.jobId === item.jobId &&
          ((item.componentId && l.componentId === item.componentId) ||
            (!item.componentId && l.boqLineId === item.boqLineId))
      );

      const remainingLimit = item.balanceQty;
      const rate = item.targetRate > 0 ? item.targetRate : 0;

      if (existsIdx >= 0) {
        newLines[existsIdx].purchaseQty = remainingLimit;
        newLines[existsIdx].totalAmount = Math.round(remainingLimit * newLines[existsIdx].purchaseRate * 100) / 100;
      } else {
        newLines.push({
          id: `poi-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          jobId: item.jobId,
          jobTitle: item.jobTitle,
          boqLineId: item.boqLineId,
          boqLineSNo: item.boqLineSNo,
          boqSectionTitle: item.sectionTitle,
          componentId: item.componentId,
          isBomComponent: item.isBomComponent,
          parentLineDescription: item.parentLineDescription,
          parentLineQty: item.parentLineQty,
          parentLineUnit: item.parentLineUnit,
          qtyPerUnit: item.qtyPerUnit,
          itemId: item.itemId || `itm-${Date.now()}-${idx}`,
          itemName: item.name,
          specification: item.specification,
          unit: item.unit,
          boqQty: item.targetQty,
          alreadyPurchasedQty: item.orderedQty,
          purchaseQty: remainingLimit,
          quotedRate: rate,
          purchaseRate: rate,
          totalAmount: Math.round(remainingLimit * rate * 100) / 100,
        });
      }

      if (!defaultVendorToSet && item.defaultVendorId) {
        defaultVendorToSet = item.defaultVendorId;
      }
    });

    setPoLines(newLines);
    if (!selectedVendorId && defaultVendorToSet) {
      setSelectedVendorId(defaultVendorToSet);
    }
    setSelectedBoqKeys(new Set());
    showToast('Products Added', `Added ${validToAdd.length} items to order with remaining project limit quantities.`, 'success');
  };

  // Add individual BOQ item directly
  const handleAddSingleBoqItem = (item: ProcurableBOQItem & { jobId: string; jobTitle: string }) => {
    if (item.balanceQty <= 0) {
      showToast(
        'Procurement Restricted',
        `"${item.name}" has already reached its full BOQ limit (${item.orderedQty}/${item.targetQty} ${item.unit} already ordered). Excess procurement is strictly prohibited!`,
        'danger'
      );
      return;
    }
    const remainingLimit = item.balanceQty;
    const rate = item.targetRate > 0 ? item.targetRate : 0;
    const newLine: PurchaseLine = {
      id: `poi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      jobId: item.jobId,
      jobTitle: item.jobTitle,
      boqLineId: item.boqLineId,
      boqLineSNo: item.boqLineSNo,
      boqSectionTitle: item.sectionTitle,
      componentId: item.componentId,
      isBomComponent: item.isBomComponent,
      parentLineDescription: item.parentLineDescription,
      parentLineQty: item.parentLineQty,
      parentLineUnit: item.parentLineUnit,
      qtyPerUnit: item.qtyPerUnit,
      itemId: item.itemId || `itm-${Date.now()}`,
      itemName: item.name,
      specification: item.specification,
      unit: item.unit,
      boqQty: item.targetQty,
      alreadyPurchasedQty: item.orderedQty,
      purchaseQty: remainingLimit,
      quotedRate: rate,
      purchaseRate: rate,
      totalAmount: Math.round(remainingLimit * rate * 100) / 100,
    };
    setPoLines([...poLines, newLine]);
    if (!selectedVendorId && item.defaultVendorId) {
      setSelectedVendorId(item.defaultVendorId);
    }
  };

  // Add custom catalog item
  const handleAddCatalogItem = () => {
    const itm = itemCatalog.find((x) => x.id === catalogItemId);
    if (!itm) return;
    const q = parseFloat(catalogQty) || 1;
    const r = parseFloat(catalogRate) || itm.standardCost || 0;
    const targetJob = catalogTargetJobId || selectedJobId || (jobs[0]?.id || '');
    const jObj = jobs.find((j) => j.id === targetJob);

    const newLine: PurchaseLine = {
      id: `poi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      jobId: targetJob,
      jobTitle: jObj?.title || '',
      itemId: itm.id,
      itemName: itm.name,
      specification: itm.specification,
      unit: itm.unit,
      boqQty: 0,
      alreadyPurchasedQty: 0,
      purchaseQty: q,
      quotedRate: r,
      purchaseRate: r,
      totalAmount: Math.round(q * r * 100) / 100,
    };
    setPoLines([...poLines, newLine]);
    setIsAddingCatalogItem(false);
    setCatalogItemId('');
    setCatalogQty('1');
    setCatalogRate('0');
  };

  // Update line field
  const updatePoLine = (index: number, field: 'purchaseQty' | 'purchaseRate', val: string) => {
    const copy = [...poLines];
    const line = copy[index];
    const num = parseFloat(val) || 0;
    line[field] = num;
    line.totalAmount = Math.round((line.purchaseQty || 0) * (line.purchaseRate || 0) * 100) / 100;
    setPoLines(copy);
  };

  // Remove line
  const removePoLine = (index: number) => {
    setPoLines(poLines.filter((_, idx) => idx !== index));
  };

  // Financial Calculations
  const subtotal = Math.round(poLines.reduce((sum, l) => sum + (l.totalAmount || 0), 0) * 100) / 100;
  const transport = parseFloat(transportCost) || 0;
  const taxAmount = Math.round(subtotal * (taxPercent / 100) * 100) / 100;
  const grandTotal = Math.round((subtotal + taxAmount + transport) * 100) / 100;

  // Real-time limit breach verification
  interface BreachInfo {
    lineIndex: number;
    itemName: string;
    jobId: string;
    unit: string;
    boqQty: number;
    alreadyPurchasedQty: number;
    purchaseQty: number;
    extraQty: number;
    quotedRate: number;
    purchaseRate: number;
    priceDiff: number;
    isQtyExceeded: boolean;
    isRateExceeded: boolean;
  }

  // Detect strictly prohibited BOQ quantity breaches
  const qtyBreaches = poLines.filter(
    (l) => l.boqQty > 0 && ((l.alreadyPurchasedQty || 0) + (l.purchaseQty || 0)) > l.boqQty
  );
  const hasQtyBreach = qtyBreaches.length > 0;

  // Rate breaches for Admin Approval ticket
  const breaches: BreachInfo[] = [];
  poLines.forEach((l, idx) => {
    const isRateExceeded = l.quotedRate > 0 && l.purchaseRate > l.quotedRate;
    if (isRateExceeded) {
      breaches.push({
        lineIndex: idx,
        itemName: l.itemName,
        jobId: l.jobId || selectedJobId,
        unit: l.unit,
        boqQty: l.boqQty,
        alreadyPurchasedQty: l.alreadyPurchasedQty || 0,
        purchaseQty: l.purchaseQty,
        extraQty: 0,
        quotedRate: l.quotedRate,
        purchaseRate: l.purchaseRate,
        priceDiff: Math.max(0, l.purchaseRate - l.quotedRate),
        isQtyExceeded: false,
        isRateExceeded: true,
      });
    }
  });

  const willTriggerApproval = breaches.length > 0;

  // Move to Confirm Step
  const handleProceedToConfirm = () => {
    if (activeJobIds.length === 0) {
      showToast('Job Required', 'Please select at least one Target Project Job.', 'danger');
      return;
    }
    if (!selectedVendorId) {
      showToast('Vendor Required', 'Please choose a Supplier / Vendor for this Purchase Order.', 'danger');
      return;
    }
    if (poLines.length === 0) {
      showToast('Items Required', 'Please add at least one line item to the order.', 'danger');
      return;
    }
    if (hasQtyBreach) {
      const first = qtyBreaches[0];
      const maxAllowed = Math.max(0, first.boqQty - (first.alreadyPurchasedQty || 0));
      const excess = (first.alreadyPurchasedQty || 0) + (first.purchaseQty || 0) - first.boqQty;
      showToast(
        'Procurement Restricted: BOQ Limit Exceeded',
        `"${first.itemName}" exceeds remaining BOQ limit! BOQ Total: ${first.boqQty} ${first.unit}, Already Purchased: ${first.alreadyPurchasedQty || 0} ${first.unit}, Remaining Allowed: ${maxAllowed} ${first.unit}. You requested ${first.purchaseQty} (+${excess} excess). Excess purchase is strictly not permitted!`,
        'danger'
      );
      return;
    }
    setCurrentStep('confirm');
  };

  // Submit Purchase Order
  const handleSubmitPO = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeJobIds.length === 0) {
      showToast('Validation Error', 'Please select a Target Project Job.', 'danger');
      return;
    }
    if (!selectedVendorId) {
      showToast('Validation Error', 'Please select a Supplier / Vendor.', 'danger');
      return;
    }
    if (poLines.length === 0) {
      showToast('Validation Error', 'Please add at least one line item to the Purchase Order.', 'danger');
      return;
    }

    if (hasQtyBreach) {
      const first = qtyBreaches[0];
      const maxAllowed = Math.max(0, first.boqQty - (first.alreadyPurchasedQty || 0));
      showToast(
        'Procurement Restricted: BOQ Limit Exceeded',
        `"${first.itemName}" exceeds remaining BOQ limit (Max allowed remaining: ${maxAllowed} ${first.unit}). Excess purchase is strictly prohibited!`,
        'danger'
      );
      return;
    }

    if (willTriggerApproval && !ticketReason.trim()) {
      showToast(
        'Reason Required for Admin Ticket',
        'You have requested purchase prices higher than the quoted target rate. Please provide a mandatory reason explaining the price exception for Admin approval.',
        'danger'
      );
      return;
    }

    const vendor = vendors.find((v) => v.id === selectedVendorId);
    if (!vendor) return;

    const isMultiJobPO = isMultiJob || activeJobIds.length > 1 || Array.from(new Set(poLines.map((l) => l.jobId))).length > 1;
    const primaryJob = jobs.find((j) => activeJobIds.includes(j.id)) || jobs[0];

    const activeBoq = !isMultiJob && selectedJobId ? ERPService.getCurrentBOQ(selectedJobId) : undefined;

    const newPO = ERPService.createPurchase(
      {
        jobId: isMultiJobPO ? 'MULTI-JOB' : (selectedJobId || primaryJob?.id || 'JOB-GENERAL'),
        jobTitle: isMultiJobPO
          ? `Multi-Job Order (${activeJobIds.length} Projects)`
          : (primaryJob?.title || 'Job Procurement'),
        isMultiJob: isMultiJobPO,
        jobIds: activeJobIds,
        boqId: activeBoq?.id,
        boqTitle: activeBoq?.title,
        linkedIndentId: linkedIndentId || initialIndentId,
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorGst: vendor.gstNumber,
        date: new Date().toISOString().split('T')[0],
        deliveryDate,
        deliveryLocation,
        costType,
        items: poLines,
        subtotal,
        taxAmount,
        transportCost: transport,
        grandTotal,
        status: willTriggerApproval ? 'Pending Approval' : 'Approved',
        approvalTriggered: willTriggerApproval,
        approvalReason: willTriggerApproval ? ticketReason.trim() : undefined,
        notes,
      },
      ticketReason.trim()
    );

    if (newPO.status === 'Pending Approval') {
      showToast(
        'Admin Approval Ticket Raised',
        `PO ${newPO.id} exceeds project limits (+extra material/rate). Approval ticket with reason & price submitted to Admin!`,
        'warning'
      );
    } else {
      showToast(
        'Purchase Order Issued',
        `PO ${newPO.id} (₹${newPO.grandTotal.toLocaleString('en-IN')}) successfully created and approved within BOQ limits.`,
        'success'
      );
    }

    if (onSuccess) {
      onSuccess(newPO);
    }
    onClose();
  };

  // Filtered BOQ items for Item Picker: STRICTLY filtered to active job(s)
  const filteredBoqItems = boqItems.filter((i) => {
    // Strict job verification:
    if (!isMultiJob && selectedJobId && i.jobId !== selectedJobId) {
      return false;
    }
    if (isMultiJob && !multiJobIds.includes(i.jobId)) {
      return false;
    }

    if (!boqSearchQ.trim()) return true;
    const q = boqSearchQ.toLowerCase();
    return (
      i.name.toLowerCase().includes(q) ||
      i.sectionTitle.toLowerCase().includes(q) ||
      i.boqLineSNo.toLowerCase().includes(q) ||
      i.jobId.toLowerCase().includes(q) ||
      i.jobTitle.toLowerCase().includes(q) ||
      (i.parentLineDescription && i.parentLineDescription.toLowerCase().includes(q))
    );
  });

  const selectedJobObj = jobs.find((j) => j.id === selectedJobId);

  if (!isOpen) return null;

  return (
    <div className="ui-modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="ui-modal-content"
        style={{
          maxWidth: '1380px',
          width: '98vw',
          height: '94vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: 8,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header with 2-Step Breadcrumb */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={22} color="#38bdf8" />
              <span style={{ fontSize: '1.18rem', fontWeight: 800 }}>
                Create Purchase Order & Procurement
              </span>
            </div>

            {/* Stepper Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#1e293b', padding: '3px 8px', borderRadius: 6 }}>
              <button
                type="button"
                onClick={() => setCurrentStep('items')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 4,
                  border: 'none',
                  backgroundColor: currentStep === 'items' ? '#0284c7' : 'transparent',
                  color: currentStep === 'items' ? '#ffffff' : '#94a3b8',
                  fontSize: '0.78rem',
                  fontWeight: currentStep === 'items' ? 800 : 600,
                  cursor: 'pointer',
                }}
              >
                <span>1. Configure PO Items</span>
                <span style={{ backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '50%', padding: '0 5px', fontSize: '0.7rem', fontWeight: 800 }}>
                  {poLines.length}
                </span>
              </button>

              <ArrowRight size={13} color="#64748b" />

              <button
                type="button"
                onClick={handleProceedToConfirm}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 4,
                  border: 'none',
                  backgroundColor: currentStep === 'confirm' ? '#0284c7' : 'transparent',
                  color: currentStep === 'confirm' ? '#ffffff' : '#94a3b8',
                  fontSize: '0.78rem',
                  fontWeight: currentStep === 'confirm' ? 800 : 600,
                  cursor: 'pointer',
                }}
              >
                <span>2. Notes, Taxes & Final Confirm</span>
                {willTriggerApproval && (
                  <span style={{ backgroundColor: '#f59e0b', color: '#000000', borderRadius: '50%', padding: '0 5px', fontSize: '0.7rem', fontWeight: 800 }}>
                    !
                  </span>
                )}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 4,
                backgroundColor: isMultiJob ? '#4338ca' : '#0369a1',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {isMultiJob ? <Globe size={12} /> : <Building2 size={12} />}
              {isMultiJob
                ? `Multi-Job (${multiJobIds.length} Projects)`
                : selectedJobId
                ? `Job: ${selectedJobId}`
                : 'Select Job'}
            </span>

            <button
              type="button"
              onClick={onClose}
              style={{
                fontSize: '1.4rem',
                color: '#94a3b8',
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                padding: '2px 6px',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* STEP 1: FULL SCREEN PO ITEMS TABLE CONFIGURATOR */}
        {currentStep === 'items' && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '14px 18px', gap: 12 }}>
            
            {/* Top Compact Configuration Bar */}
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 12,
                flexShrink: 0,
              }}
            >
              {/* Target Project Job(s) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                    Target Project Job <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <label style={{ fontSize: '0.72rem', color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                    <input
                      type="checkbox"
                      checked={isMultiJob}
                      onChange={(e) => {
                        setIsMultiJob(e.target.checked);
                        if (!e.target.checked && selectedJobId) {
                          setMultiJobIds([selectedJobId]);
                        }
                      }}
                    />
                    <span>Multi-Job PO</span>
                  </label>
                </div>

                {!isMultiJob ? (
                  <>
                    <select
                      value={selectedJobId}
                      onChange={(e) => handleSelectSingleJob(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: 4,
                        border: '1px solid #cbd5e1',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <option value="">-- Choose Job Spine --</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.id} - {j.title} ({j.clientName})
                        </option>
                      ))}
                    </select>
                    {selectedJobObj && (
                      <div style={{ fontSize: '0.72rem', color: '#0369a1', marginTop: 3, fontWeight: 700 }}>
                        ✓ Showing strictly BOQ items for: {selectedJobObj.title} ({boqItems.length} items available)
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: '0.72rem', color: '#4338ca', fontWeight: 700 }}>
                        {multiJobIds.length} projects selected
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button type="button" onClick={handleSelectAllJobs} style={{ fontSize: '0.68rem', color: '#4338ca', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>All</button>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <button type="button" onClick={handleClearAllJobs} style={{ fontSize: '0.68rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Clear</button>
                      </div>
                    </div>
                    <div
                      style={{
                        maxHeight: 52,
                        overflowY: 'auto',
                        border: '1px solid #e2e8f0',
                        borderRadius: 4,
                        padding: '3px 6px',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      {jobs.map((j) => {
                        const isChecked = multiJobIds.includes(j.id);
                        return (
                          <label
                            key={j.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: '0.74rem',
                              cursor: 'pointer',
                              fontWeight: isChecked ? 700 : 400,
                              color: isChecked ? '#1e40af' : '#475569',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleMultiJob(j.id)}
                            />
                            <span><strong>{j.id}</strong>: {j.title}</span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Vendor Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>
                  Supplier / Vendor <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: '1px solid #cbd5e1',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <option value="">-- Choose Registered Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.categories.slice(0, 2).join(', ')})
                    </option>
                  ))}
                </select>
                {selectedVendorObj && (
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                    GST: {selectedVendorObj.gstNumber || 'N/A'} • Payment Terms: {selectedVendorObj.paymentTerms}
                  </div>
                )}
              </div>

              {/* Delivery Destination */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>
                  Delivery Destination
                </label>
                <select
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <option value="Site Store">Site Store (Job Site Store)</option>
                  <option value="Central Warehouse">Central Warehouse</option>
                  <option value="Direct to Site">Direct to Site (Vendor Drop-ship)</option>
                </select>
              </div>

              {/* Target Delivery Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>
                  Target Delivery Date
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    borderRadius: 4,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    backgroundColor: '#ffffff',
                  }}
                />
              </div>
            </div>

            {/* FULL SCREEN MAIN TABLE CONTAINER */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              {/* Table Toolbar Header */}
              <div
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #cbd5e1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShoppingCart size={18} color="#0f172a" />
                  <strong style={{ fontSize: '0.94rem', color: '#0f172a' }}>
                    Purchase Order Items ({poLines.length} Items Configured)
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    • {!isMultiJob && selectedJobId ? `Job: ${selectedJobId}` : `${activeJobIds.length} Projects`}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Button
                    size="sm"
                    variant="accent"
                    icon={<Plus size={15} />}
                    onClick={() => setIsItemPickerOpen(true)}
                    title="Click to select items strictly from project BOQ"
                  >
                    + Add Items from BOQ {!isMultiJob && selectedJobId ? `(${selectedJobId})` : ''}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Package size={14} />}
                    onClick={() => setIsAddingCatalogItem(!isAddingCatalogItem)}
                  >
                    + Add Custom / Catalog Item
                  </Button>
                </div>
              </div>

              {/* Custom Item Drawer */}
              {isAddingCatalogItem && (
                <div
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#fffbeb',
                    borderBottom: '1px solid #fde68a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                    flexShrink: 0,
                  }}
                >
                  {isMultiJob && (
                    <div style={{ width: 170 }}>
                      <select
                        value={catalogTargetJobId}
                        onChange={(e) => setCatalogTargetJobId(e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', fontSize: '0.82rem', borderRadius: 4, border: '1px solid #d97706' }}
                      >
                        <option value="">-- Target Job Spine --</option>
                        {multiJobIds.map((jId) => {
                          const j = jobs.find((x) => x.id === jId);
                          return <option key={jId} value={jId}>{jId} - {j?.title || ''}</option>;
                        })}
                      </select>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <select
                      value={catalogItemId}
                      onChange={(e) => {
                        setCatalogItemId(e.target.value);
                        const itm = itemCatalog.find((x) => x.id === e.target.value);
                        if (itm) setCatalogRate(String(itm.standardCost || 0));
                      }}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '0.82rem', borderRadius: 4, border: '1px solid #d97706' }}
                    >
                      <option value="">-- Choose from Item Master Catalog --</option>
                      {itemCatalog.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} ({i.unit}) - ₹{i.standardCost}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: 85 }}>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={catalogQty}
                      onChange={(e) => setCatalogQty(e.target.value)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '0.82rem', borderRadius: 4, border: '1px solid #d97706', textAlign: 'right' }}
                    />
                  </div>
                  <div style={{ width: 105 }}>
                    <input
                      type="number"
                      placeholder="Rate ₹"
                      value={catalogRate}
                      onChange={(e) => setCatalogRate(e.target.value)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '0.82rem', borderRadius: 4, border: '1px solid #d97706', textAlign: 'right' }}
                    />
                  </div>
                  <Button size="sm" variant="accent" onClick={handleAddCatalogItem} disabled={!catalogItemId}>
                    Add to Order
                  </Button>
                </div>
              )}

              {/* SCROLLABLE TABLE BODY */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'auto', backgroundColor: '#ffffff' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ width: 35, padding: '8px 10px', textAlign: 'center' }}>#</th>
                      <th style={{ width: 85, padding: '8px' }}>BOQ S.No</th>
                      <th style={{ minWidth: 260, padding: '8px' }}>Product / Material Name</th>
                      <th style={{ width: 65, textAlign: 'center' }}>Unit</th>
                      <th style={{ width: 125, padding: '8px', textAlign: 'right' }}>
                        Project Limit
                      </th>
                      <th style={{ width: 130, padding: '8px', textAlign: 'right', backgroundColor: '#fef3c7' }}>
                        Purchase Qty *
                      </th>
                      <th style={{ width: 110, padding: '8px', textAlign: 'right' }}>Target Rate</th>
                      <th style={{ width: 130, padding: '8px', textAlign: 'right', backgroundColor: '#fef3c7' }}>
                        Purchase Rate (₹) *
                      </th>
                      <th style={{ width: 130, padding: '8px', textAlign: 'right', backgroundColor: '#f0fdf4' }}>
                        Line Total (₹)
                      </th>
                      <th style={{ width: 40, padding: '8px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {poLines.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ padding: '60px 16px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                          <ShoppingCart size={46} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                          <div style={{ fontWeight: 800, fontSize: '1.08rem', color: '#0f172a' }}>
                            No items added to this Purchase Order yet
                          </div>
                          <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: 6, marginBottom: 20 }}>
                            {!isMultiJob && selectedJobId
                              ? `Click below to select items strictly from Job ${selectedJobId}'s BOQ.`
                              : `Click below to select items from the project BOQ.`}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                            <Button
                              variant="accent"
                              size="md"
                              icon={<Plus size={16} />}
                              onClick={() => setIsItemPickerOpen(true)}
                            >
                              + Select Items from {!isMultiJob && selectedJobId ? `Job ${selectedJobId} BOQ` : 'Project BOQ'}
                            </Button>
                            <Button
                              variant="secondary"
                              size="md"
                              icon={<Package size={15} />}
                              onClick={() => setIsAddingCatalogItem(!isAddingCatalogItem)}
                            >
                              + Add Custom / Catalog Item
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      poLines.map((line, idx) => {
                        const totalPlanned = (line.alreadyPurchasedQty || 0) + (line.purchaseQty || 0);
                        const isQtyExceeded = line.boqQty > 0 && totalPlanned > line.boqQty;
                        const isRateExceeded = line.quotedRate > 0 && line.purchaseRate > line.quotedRate;
                        const extraQty = Math.max(0, totalPlanned - line.boqQty);
                        const allowedMax = Math.max(0, line.boqQty - (line.alreadyPurchasedQty || 0));

                        return (
                          <tr
                            key={line.id}
                            style={{
                              borderBottom: '1px solid #e2e8f0',
                              backgroundColor: isQtyExceeded || isRateExceeded ? '#fffbeb' : '#ffffff',
                            }}
                          >
                            <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b' }}>
                              {idx + 1}
                            </td>
                            <td style={{ padding: '8px' }}>
                              {line.boqLineSNo ? (
                                <span style={{ fontWeight: 800, color: '#0369a1', backgroundColor: '#e0f2fe', padding: '2px 6px', borderRadius: 4, fontSize: '0.74rem' }}>
                                  [{line.boqLineSNo}]
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Catalog</span>
                              )}
                            </td>
                            <td style={{ padding: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                                  {line.itemName}
                                </span>
                                {line.isBomComponent && (
                                  <span style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.7rem', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>
                                    📦 BOM Constituent
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setMappingModalTarget({ materialName: line.itemName, specification: line.specification, jobId: line.jobId, componentId: line.componentId })}
                                  style={{
                                    backgroundColor: '#f0fdf4',
                                    color: '#166534',
                                    border: '1px solid #bbf7d0',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: 3,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                  }}
                                  title="View BOQ Takeoff source and multiplication details"
                                >
                                  🔍 Where Mapped?
                                </button>
                                {isMultiJob && (
                                  <span style={{ backgroundColor: '#e0e7ff', color: '#3730a3', fontSize: '0.7rem', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>
                                    📁 {line.jobId}
                                  </span>
                                )}
                              </div>
                              {line.specification && (
                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{line.specification}</div>
                              )}
                              {line.parentLineDescription && (
                                <div style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 600, marginTop: 2 }}>
                                  Mapped to: {line.parentLineDescription} ({line.parentLineQty} {line.parentLineUnit || 'units'} × {line.qtyPerUnit} {line.unit})
                                </div>
                              )}

                              {/* Real-time Visual Badges */}
                              {isQtyExceeded && (
                                <div style={{ fontSize: '0.74rem', color: '#b91c1c', fontWeight: 800, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, backgroundColor: '#fee2e2', padding: '4px 8px', borderRadius: 4, border: '1px solid #fca5a5' }}>
                                  <AlertTriangle size={13} color="#dc2626" />
                                  <span>
                                    ⛔ BOQ Limit Exceeded by +{extraQty} {line.unit}! Max allowed remaining is {allowedMax} {line.unit}. Excess purchase is strictly not allowed.
                                  </span>
                                </div>
                              )}
                              {isRateExceeded && (
                                <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 800, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <AlertTriangle size={12} color="#d97706" />
                                  <span>
                                    Rate hike: ₹{line.purchaseRate} &gt; target ₹{line.quotedRate} (+₹{line.purchaseRate - line.quotedRate}/unit)
                                  </span>
                                </div>
                              )}
                              {!isQtyExceeded && !isRateExceeded && line.boqQty > 0 && (
                                <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700, marginTop: 2 }}>
                                  ✓ Within project limit (Allowed Max: {allowedMax} {line.unit})
                                </div>
                              )}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{line.unit}</td>
                            <td style={{ textAlign: 'right', padding: '8px', color: '#475569' }}>
                              {line.boqQty > 0 ? (
                                <div>
                                  <strong style={{ color: '#0f172a' }}>{line.boqQty} {line.unit}</strong>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                    ({line.alreadyPurchasedQty || 0} ordered prior)
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>-</span>
                              )}
                            </td>
                            <td style={{ backgroundColor: isQtyExceeded ? '#fee2e2' : '#fffbeb', padding: '6px 8px' }}>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={line.purchaseQty}
                                onChange={(e) => updatePoLine(idx, 'purchaseQty', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '5px 8px',
                                  textAlign: 'right',
                                  fontWeight: 800,
                                  fontSize: '0.9rem',
                                  color: isQtyExceeded ? '#dc2626' : '#0f172a',
                                  border: isQtyExceeded ? '2px solid #dc2626' : '1px solid #cbd5e1',
                                  borderRadius: 4,
                                  backgroundColor: isQtyExceeded ? '#fef2f2' : '#ffffff',
                                }}
                              />
                            </td>
                            <td style={{ textAlign: 'right', padding: '8px', color: '#64748b', fontWeight: 600 }}>
                              {line.quotedRate > 0 ? `₹${line.quotedRate.toLocaleString('en-IN')}` : '-'}
                            </td>
                            <td style={{ backgroundColor: '#fffbeb', padding: '6px 8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                                <span style={{ fontSize: '0.76rem', color: '#b45309', fontWeight: 700 }}>₹</span>
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={line.purchaseRate}
                                  onChange={(e) => updatePoLine(idx, 'purchaseRate', e.target.value)}
                                  style={{
                                    width: 90,
                                    padding: '5px 6px',
                                    textAlign: 'right',
                                    fontWeight: 800,
                                    fontSize: '0.9rem',
                                    color: isRateExceeded ? '#b45309' : '#0f172a',
                                    border: isRateExceeded ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                                    borderRadius: 4,
                                    backgroundColor: '#ffffff',
                                  }}
                                />
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', padding: '8px', fontWeight: 800, color: '#166534', backgroundColor: '#f0fdf4' }}>
                              ₹{line.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ textAlign: 'center', padding: '8px' }}>
                              <button
                                type="button"
                                onClick={() => removePoLine(idx)}
                                style={{ color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}
                                title="Remove item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Action Footer inside Items Table */}
              {poLines.length > 0 && (
                <div
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f8fafc',
                    borderTop: '1px solid #cbd5e1',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      size="sm"
                      variant="accent"
                      icon={<Plus size={14} />}
                      onClick={() => setIsItemPickerOpen(true)}
                    >
                      + Add More Items from BOQ {!isMultiJob && selectedJobId ? `(${selectedJobId})` : ''}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Package size={14} />}
                      onClick={() => setIsAddingCatalogItem(!isAddingCatalogItem)}
                    >
                      + Add Custom Item
                    </Button>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700 }}>
                    Items Subtotal: <span style={{ color: '#0369a1' }}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Bar for Step 1 */}
            <div
              style={{
                padding: '10px 16px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span>
                  Vendor: <strong>{selectedVendorObj?.name || 'Not selected'}</strong> • Total Items: <strong>{poLines.length}</strong>
                </span>
                {hasQtyBreach ? (
                  <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.78rem', backgroundColor: '#fee2e2', padding: '3px 8px', borderRadius: 4, border: '1px solid #fca5a5' }}>
                    ⛔ {qtyBreaches.length} item(s) exceed BOQ limit! Excess purchase strictly blocked.
                  </span>
                ) : willTriggerApproval ? (
                  <span style={{ color: '#b45309', fontWeight: 700, fontSize: '0.78rem' }}>
                    ⚠️ {breaches.length} item(s) exceed target rate (Admin approval ticket required)
                  </span>
                ) : null}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  icon={<ArrowRight size={16} />}
                  onClick={handleProceedToConfirm}
                  disabled={poLines.length === 0 || !selectedVendorId || activeJobIds.length === 0 || hasQtyBreach}
                  title={hasQtyBreach ? 'Cannot proceed while items exceed BOQ limits' : undefined}
                >
                  Proceed to Confirm & Issue PO →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PO NOTES, VENDOR INSTRUCTIONS, TAXES & FINAL CONFIRMATION */}
        {currentStep === 'confirm' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Header banner */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e3a8a' }}>
                  Finalize Purchase Order & Vendor Instructions
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#3b82f6' }}>
                  Review order total, vendor instructions, GST rate, and transport freight before generating PO voucher.
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowLeft size={14} />}
                onClick={() => setCurrentStep('items')}
              >
                ← Back to Edit Items ({poLines.length})
              </Button>
            </div>

            {/* Quick Order Header Details Summary */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                fontSize: '0.84rem',
              }}
            >
              <div>
                <span style={{ color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Supplier / Vendor
                </span>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.94rem' }}>
                  {selectedVendorObj?.name}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  GST: {selectedVendorObj?.gstNumber || 'N/A'} • {selectedVendorObj?.paymentTerms}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Destination & Date
                </span>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{deliveryLocation}</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Due: {deliveryDate}</div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Target Project
                </span>
                <div style={{ fontWeight: 800, color: '#4338ca' }}>
                  {!isMultiJob && selectedJobId ? selectedJobId : `${multiJobIds.length} Projects Combined`}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {!isMultiJob && selectedJobObj
                    ? selectedJobObj.title
                    : multiJobIds.map((id) => jobs.find((j) => j.id === id)?.title).filter(Boolean).slice(0, 2).join(', ')}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Configured Line Items
                </span>
                <div style={{ fontWeight: 800, color: '#166534' }}>{poLines.length} Products</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  Subtotal: ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* MANDATORY ADMIN APPROVAL TICKET SECTION (IF OVER LIMIT) */}
            {willTriggerApproval && (
              <div
                style={{
                  backgroundColor: '#fffbeb',
                  border: '2px solid #f59e0b',
                  borderRadius: 6,
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Ticket size={22} color="#d97706" />
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#92400e', margin: 0 }}>
                      Extra Material / Price Exception Ticket to Admin Required ({breaches.length} Item Breaches)
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#b45309', margin: '2px 0 0 0' }}>
                      You have requested extra quantity beyond the project's BOQ limit or a rate higher than the target rate. An approval ticket will be submitted to Admin with the product details and price.
                    </p>
                  </div>
                </div>

                {/* Breach Table Summary */}
                <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: 4, border: '1px solid #fde68a' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#fef3c7', textAlign: 'left', borderBottom: '1px solid #fde68a' }}>
                        <th style={{ padding: '6px 10px' }}>Product / Material</th>
                        <th style={{ padding: '6px 10px' }}>Project</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>BOQ Limit</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Requested Extra Qty</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Target Rate</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Purchase Price</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Extra Cost Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breaches.map((b, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #fef3c7' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 700 }}>{b.itemName}</td>
                          <td style={{ padding: '6px 10px' }}>{b.jobId}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right' }}>{b.boqQty} {b.unit}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800, color: b.extraQty > 0 ? '#b45309' : '#64748b' }}>
                            {b.extraQty > 0 ? `+${b.extraQty} ${b.unit}` : 'None (Rate Breach)'}
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'right' }}>₹{b.quotedRate}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800, color: b.priceDiff > 0 ? '#b45309' : '#0f172a' }}>
                            ₹{b.purchaseRate}
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>
                            ₹{(b.extraQty > 0 ? b.extraQty * b.purchaseRate : b.purchaseQty * b.priceDiff).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mandatory Reason Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#92400e', marginBottom: 4 }}>
                    Mandatory Justification / Reason for Extra Material & Price Exception <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <textarea
                    className="ui-input ui-textarea"
                    rows={2}
                    required
                    placeholder="e.g. Total 50 meter wire was allocated in BOQ, but site floor layout extended requiring additional 15 meter wire. Vendor quoted ₹45/m due to recent copper price rise. Approved by site supervisor for urgent commissioning."
                    value={ticketReason}
                    onChange={(e) => setTicketReason(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #d97706',
                      fontSize: '0.86rem',
                    }}
                  />
                  <div style={{ fontSize: '0.74rem', color: '#92400e', marginTop: 3 }}>
                    ℹ️ This reason will be logged in the permanent audit trail. Admin will review this ticket to approve or reject the purchase order.
                  </div>
                </div>
              </div>
            )}

            {/* PO NOTES & VENDOR INSTRUCTIONS + FINANCIALS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }}>
              {/* Notes & Extra Charges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="ui-form-group">
                  <label className="ui-label" style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1e293b' }}>
                    PO Notes & Vendor Instructions
                  </label>
                  <textarea
                    className="ui-input ui-textarea"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide detailed dispatch instructions, site contact details, test certificates required, packaging instructions..."
                    style={{ fontSize: '0.86rem', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>
                      Freight / Transport (₹)
                    </label>
                    <input
                      type="number"
                      value={transportCost}
                      onChange={(e) => setTransportCost(e.target.value)}
                      placeholder="0"
                      style={{ width: '100%', padding: '7px 10px', fontSize: '0.86rem', borderRadius: 4, border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 3 }}>
                      GST Tax Rate (%)
                    </label>
                    <select
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '7px 10px', fontSize: '0.86rem', borderRadius: 4, border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}
                    >
                      <option value={18}>18% GST (Standard Electrical)</option>
                      <option value={12}>12% GST</option>
                      <option value={5}>5% GST</option>
                      <option value={28}>28% GST</option>
                      <option value={0}>0% (Tax Exempt / Nil)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Totals Summary Box */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Items Subtotal:</span>
                    <strong>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>GST ({taxPercent}%):</span>
                    <strong>₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  {transport > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Transportation / Freight:</span>
                      <strong>₹{transport.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: 10,
                      borderTop: '2px solid #0f172a',
                      fontSize: '1.25rem',
                      color: '#0f172a',
                      fontWeight: 800,
                    }}
                  >
                    <span>Grand Total (INR):</span>
                    <span style={{ color: '#0369a1' }}>
                      ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Status footer inside summary */}
                <div style={{ marginTop: 14 }}>
                  {willTriggerApproval ? (
                    <div
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: 4,
                        fontSize: '0.8rem',
                        color: '#92400e',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <AlertTriangle size={18} color="#d97706" />
                      <span>
                        <strong>Pending Admin Approval</strong>: Limits exceeded. Will automatically generate an Admin Review Ticket upon issuing.
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 4,
                        fontSize: '0.8rem',
                        color: '#166534',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <CheckCircle2 size={18} color="#16a34a" />
                      <span>All items within project BOQ limit. Auto-approved and ready for issue.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions for Step 2 */}
            <div
              style={{
                padding: '14px 20px',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #cbd5e1',
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                Vendor: <strong>{selectedVendorObj?.name}</strong> • <strong>{poLines.length}</strong> Products
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="secondary" onClick={() => setCurrentStep('items')}>
                  ← Back to Edit Items
                </Button>
                <Button
                  variant="accent"
                  icon={willTriggerApproval ? <Ticket size={16} /> : <ShoppingCart size={16} />}
                  onClick={handleSubmitPO}
                  disabled={poLines.length === 0 || !selectedVendorId || activeJobIds.length === 0}
                >
                  {willTriggerApproval
                    ? `Submit PO & Raise Admin Approval Ticket (₹${grandTotal.toLocaleString('en-IN')})`
                    : `Confirm & Issue Purchase Order (₹${grandTotal.toLocaleString('en-IN')})`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* POPUP: SELECT ITEMS FROM BOQ / MATERIALS MODAL */}
        {isItemPickerOpen && (
          <div className="ui-modal-backdrop" onClick={() => setIsItemPickerOpen(false)} style={{ zIndex: 1200 }}>
            <div
              className="ui-modal-content"
              style={{
                maxWidth: '960px',
                width: '95vw',
                maxHeight: '88vh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#ffffff',
                borderRadius: 8,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: '14px 20px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '1.1rem' }}>
                    <Package size={20} color="#38bdf8" />
                    <span>Select Items strictly from Job BOQ</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                    {!isMultiJob && selectedJobId
                      ? `Project: ${selectedJobId} (${selectedJobObj?.title || ''}) • Showing only its ${filteredBoqItems.length} BOQ & BOM items`
                      : `Multi-Job (${multiJobIds.length} Projects) • Showing ${filteredBoqItems.length} items`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsItemPickerOpen(false)}
                  style={{
                    fontSize: '1.4rem',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    background: 'transparent',
                    border: 'none',
                    padding: '4px 8px',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Filter Toolbar */}
              <div
                style={{
                  padding: '12px 18px',
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #cbd5e1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                  <input
                    type="text"
                    placeholder="Search material, wire, conduit, switch, cable..."
                    value={boqSearchQ}
                    onChange={(e) => setBoqSearchQ(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 28px 7px 10px',
                      fontSize: '0.86rem',
                      borderRadius: 4,
                      border: '1px solid #cbd5e1',
                    }}
                    autoFocus
                  />
                  <Search size={14} color="#94a3b8" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }} />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="sm" variant="secondary" onClick={handleSelectAllRemaining}>
                    Select All Remaining
                  </Button>
                  <Button
                    size="sm"
                    variant="accent"
                    icon={<Plus size={14} />}
                    onClick={() => {
                      handleAddSelectedBoqItemsToPO();
                      setIsItemPickerOpen(false);
                    }}
                    disabled={selectedBoqKeys.size === 0}
                  >
                    Add Selected ({selectedBoqKeys.size}) to Order
                  </Button>
                </div>
              </div>

              {/* Table of Items strictly for this job */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ width: 36, padding: '8px 10px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedBoqKeys.size > 0 && selectedBoqKeys.size === filteredBoqItems.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBoqKeys(new Set(filteredBoqItems.map((i) => i.key)));
                            } else {
                              setSelectedBoqKeys(new Set());
                            }
                          }}
                        />
                      </th>
                      {isMultiJob && (
                        <th style={{ width: 110, padding: '8px' }}>Job Spine</th>
                      )}
                      <th style={{ width: 80, padding: '8px' }}>BOQ S.No</th>
                      <th style={{ minWidth: 240, padding: '8px' }}>Item / Raw Material Name</th>
                      <th style={{ width: 65 }}>Unit</th>
                      <th style={{ width: 95, textAlign: 'right', padding: '8px' }}>Project Limit</th>
                      <th style={{ width: 85, textAlign: 'right', padding: '8px' }}>Ordered</th>
                      <th style={{ width: 100, textAlign: 'right', padding: '8px', color: '#166534' }}>Allowed Limit</th>
                      <th style={{ width: 95, textAlign: 'right', padding: '8px' }}>Target Rate</th>
                      <th style={{ width: 70, textAlign: 'center', padding: '8px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBoqItems.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ padding: 28, textAlign: 'center', color: '#64748b' }}>
                          No BOQ items found for {!isMultiJob && selectedJobId ? `Job ${selectedJobId}` : 'selected job(s)'}.
                        </td>
                      </tr>
                    ) : (
                      filteredBoqItems.map((item) => {
                        const isChecked = selectedBoqKeys.has(item.key);
                        const isAlreadyInPO = poLines.some(
                          (l) =>
                            l.jobId === item.jobId &&
                            ((item.componentId && l.componentId === item.componentId) ||
                              (!item.componentId && l.boqLineId === item.boqLineId))
                        );

                        const isExhausted = item.balanceQty <= 0;
                        return (
                          <tr
                            key={item.key}
                            style={{
                              borderBottom: '1px solid #e2e8f0',
                              backgroundColor: isExhausted
                                ? '#fef2f2'
                                : isChecked
                                ? '#f0fdf4'
                                : isAlreadyInPO
                                ? '#f8fafc'
                                : '#ffffff',
                              opacity: isExhausted ? 0.82 : 1,
                            }}
                          >
                            <td style={{ textAlign: 'center', padding: '6px 10px' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isExhausted}
                                onChange={() => toggleSelectBoqKey(item.key)}
                                title={isExhausted ? '100% Procured: Cannot select' : ''}
                              />
                            </td>
                            {isMultiJob && (
                              <td style={{ padding: '6px 8px', fontWeight: 800, color: '#4338ca', fontSize: '0.74rem' }}>
                                {item.jobId}
                              </td>
                            )}
                            <td style={{ fontWeight: 700, padding: '6px 8px', color: '#475569' }}>
                              [{item.boqLineSNo || '-'}]
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.name}</span>
                                {item.isBomComponent && (
                                  <span style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.68rem', fontWeight: 800, padding: '1px 5px', borderRadius: 3 }}>
                                    📦 BOM
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setMappingModalTarget({ materialName: item.name, specification: item.specification, jobId: item.jobId, componentId: item.componentId })}
                                  style={{
                                    backgroundColor: '#f0fdf4',
                                    color: '#166534',
                                    border: '1px solid #bbf7d0',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '1px 5px',
                                    borderRadius: 3,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                  }}
                                  title="View where this item is mapped in BOQ and its multiplier formula"
                                >
                                  🔍 Where Mapped?
                                </button>
                                {isExhausted && (
                                  <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: 3, border: '1px solid #fca5a5' }}>
                                    ⛔ 100% Procured ({item.orderedQty}/{item.targetQty})
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                {item.specification || (item.isBomComponent ? '📦 BOM Constituent Material' : 'BOQ Supply Line')}
                              </div>
                              {item.parentLineDescription && (
                                <div style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 600, marginTop: 1 }}>
                                  For: {item.parentLineDescription} ({item.parentLineQty} {item.parentLineUnit || 'units'} × {item.qtyPerUnit} {item.unit})
                                </div>
                              )}
                            </td>
                            <td>{item.unit}</td>
                            <td style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>
                              {item.targetQty} {item.unit}
                            </td>
                            <td style={{ textAlign: 'right', padding: '6px 8px', color: '#64748b' }}>
                              {item.orderedQty}
                            </td>
                            <td style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 800, color: item.balanceQty > 0 ? '#166534' : '#dc2626' }}>
                              {item.balanceQty} {item.unit}
                            </td>
                            <td style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 700 }}>
                              ₹{item.targetRate.toLocaleString('en-IN')}
                            </td>
                            <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                              <button
                                type="button"
                                disabled={isExhausted || isAlreadyInPO}
                                onClick={() => {
                                  handleAddSingleBoqItem(item);
                                  showToast('Item Added', `Added ${item.name} to order.`, 'success');
                                }}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  borderRadius: 4,
                                  backgroundColor: isExhausted ? '#f1f5f9' : isAlreadyInPO ? '#e2e8f0' : '#2563eb',
                                  color: isExhausted ? '#94a3b8' : isAlreadyInPO ? '#475569' : '#ffffff',
                                  border: 'none',
                                  cursor: isExhausted || isAlreadyInPO ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {isExhausted ? 'Exhausted' : isAlreadyInPO ? '✓ Added' : '+ Add'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Actions Bar */}
              <div
                style={{
                  padding: '12px 18px',
                  backgroundColor: '#f8fafc',
                  borderTop: '1px solid #cbd5e1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                }}
              >
                <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                  {selectedBoqKeys.size} item(s) selected
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="secondary" onClick={() => setIsItemPickerOpen(false)}>
                    Close
                  </Button>
                  <Button
                    variant="accent"
                    icon={<Plus size={14} />}
                    onClick={() => {
                      handleAddSelectedBoqItemsToPO();
                      setIsItemPickerOpen(false);
                    }}
                    disabled={selectedBoqKeys.size === 0}
                  >
                    Add Selected ({selectedBoqKeys.size}) to Order
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Material Mapping Detail Modal */}
        {mappingModalTarget && (
          <MaterialMappingModal
            isOpen={!!mappingModalTarget}
            onClose={() => setMappingModalTarget(null)}
            materialName={mappingModalTarget.materialName}
            specification={mappingModalTarget.specification}
            jobId={mappingModalTarget.jobId}
            componentId={mappingModalTarget.componentId}
          />
        )}
      </div>
    </div>
  );
};
