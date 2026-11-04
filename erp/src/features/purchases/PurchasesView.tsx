import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Building2, 
  Briefcase,
  FileSpreadsheet,
  Layers,
  Package,
  Eye,
  Filter,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  PackageCheck,
  Camera,
  ShieldCheck,
  Boxes,
  MapPin,
  ArrowUpRight
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ERPService } from '../../services/erpStorage';
import { usePermissions } from '../../services/usePermissions';
import { PurchaseOrder, Job, Vendor, ItemMaster, ProcurableBOQItem, StockLedgerItem } from '../../types';
import { 
  PageHeader, 
  Button, 
  DataTable, 
  Badge, 
  Modal, 
  Input, 
  Select, 
  Card,
  useToast
} from '../../components/ui';
import { CreatePurchaseOrderModal } from './CreatePurchaseOrderModal';
import { PurchaseOrderDetailModal } from './PurchaseOrderDetailModal';
import { ReceiveBilledItemsModal } from './ReceiveBilledItemsModal';
import { BillProofViewerModal } from './BillProofViewerModal';
import { IssueSiteMaterialModal } from './IssueSiteMaterialModal';
import { MaterialMappingModal } from './MaterialMappingModal';
import { 
  DispatchIndentModal, 
  ReceiveIndentModal, 
  IndentProofModal 
} from '../sites/SiteIndentLogisticsModals';

type ActiveTab = 'orders' | 'boq_procurement' | 'site_stocks' | 'site_indents';
type ProcurementStatusFilter = 'all' | 'pending' | 'partial' | 'fulfilled' | 'over';

export const PurchasesView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { currentUser, hasPermission, isAdmin } = usePermissions();

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    (searchParams.get('tab') as ActiveTab) || 'orders'
  );

  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [siteStocks, setSiteStocks] = useState<StockLedgerItem[]>([]);
  const [materialRequests, setMaterialRequests] = useState<any[]>([]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createPOMode, setCreatePOMode] = useState<'job_based' | 'multi_job'>('job_based');
  const [targetJobIdForPO, setTargetJobIdForPO] = useState<string>('');
  const [targetIndentIdForPO, setTargetIndentIdForPO] = useState<string>('');
  const [selectedItemsForPO, setSelectedItemsForPO] = useState<any[]>([]);

  const [detailPO, setDetailPO] = useState<PurchaseOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Inward & Bill photo proof modals state
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [targetPOForReceive, setTargetPOForReceive] = useState<PurchaseOrder | null>(null);

  const [isBillProofModalOpen, setIsBillProofModalOpen] = useState(false);
  const [targetPOForBillProof, setTargetPOForBillProof] = useState<PurchaseOrder | null>(null);

  // Issue site material modal state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedStockForIssue, setSelectedStockForIssue] = useState<StockLedgerItem | null>(null);

  // Requisition Indent logistics modals
  const [isIndentDispatchModalOpen, setIsIndentDispatchModalOpen] = useState(false);
  const [dispatchingIndent, setDispatchingIndent] = useState<any>(null);

  const [isIndentReceiveModalOpen, setIsIndentReceiveModalOpen] = useState(false);
  const [receivingIndent, setReceivingIndent] = useState<any>(null);

  const [isIndentProofModalOpen, setIsIndentProofModalOpen] = useState(false);
  const [viewingProofIndent, setViewingProofIndent] = useState<any>(null);

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvalTargetPO, setApprovalTargetPO] = useState<PurchaseOrder | null>(null);
  const [approvalReason, setApprovalReason] = useState('');

  // BOQ Procurement Matrix filters & selection
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>(searchParams.get('jobId') || '');
  const [procurementStatusFilter, setProcurementStatusFilter] = useState<ProcurementStatusFilter>('all');
  const [matrixSearchQ, setMatrixSearchQ] = useState<string>('');
  const [selectedProcurementKeys, setSelectedProcurementKeys] = useState<Set<string>>(new Set());
  const [mappingModalTarget, setMappingModalTarget] = useState<{
    materialName: string;
    specification?: string;
    jobId?: string;
    componentId?: string;
  } | null>(null);

  // Site stocks filters
  const [siteStockStatusFilter, setSiteStockStatusFilter] = useState<'all' | 'in_stock' | 'depleted'>('all');
  const [siteStockSearchQ, setSiteStockSearchQ] = useState<string>('');

  // Site Indents filters
  const [indentDestinationFilter, setIndentDestinationFilter] = useState<'all' | 'Warehouse' | 'Admin'>('all');
  const [indentStatusFilter, setIndentStatusFilter] = useState<string>('all');
  const [indentSearchQ, setIndentSearchQ] = useState<string>('');

  const loadData = () => {
    setPurchases(ERPService.getPurchases());
    setJobs(ERPService.getJobs());
    setVendors(ERPService.getVendors());
    setItems(ERPService.getItems());
    setSiteStocks(ERPService.getSiteStocks(selectedJobFilter || undefined));
    setMaterialRequests(ERPService.getMaterialRequests());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('apex_storage_update', loadData);
    return () => window.removeEventListener('apex_storage_update', loadData);
  }, []);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      const jId = searchParams.get('jobId') || '';
      const indentId = searchParams.get('indentId') || '';
      setTargetJobIdForPO(jId);
      setTargetIndentIdForPO(indentId);
      setCreatePOMode(jId ? 'job_based' : 'multi_job');
      setSelectedItemsForPO([]);
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  // Handle PO approval by Admin
  const handleApprovePO = () => {
    if (!approvalTargetPO || !approvalReason.trim()) {
      showToast('Reason Required', 'Mandatory reason is required to approve this limit breach.', 'danger');
      return;
    }

    ERPService.approvePurchase(approvalTargetPO.id, approvalReason.trim());
    showToast('Approved', `Purchase Order ${approvalTargetPO.id} approved by Admin.`, 'success');
    setIsApproveModalOpen(false);
    setApprovalReason('');
    setApprovalTargetPO(null);
  };

  // Handle PO rejection by Admin
  const handleRejectPO = () => {
    if (!approvalTargetPO || !approvalReason.trim()) {
      showToast('Reason Required', 'Mandatory reason is required to reject this PO exception.', 'danger');
      return;
    }

    ERPService.rejectPurchase(approvalTargetPO.id, approvalReason.trim());
    showToast('PO Rejected', `Purchase Order ${approvalTargetPO.id} rejected by Admin.`, 'danger');
    setIsApproveModalOpen(false);
    setApprovalReason('');
    setApprovalTargetPO(null);
  };

  // Get procurable items list based on selected job filter
  const allProcurementItems: Array<ProcurableBOQItem & { jobId: string; jobTitle: string }> = React.useMemo(() => {
    if (selectedJobFilter) {
      const currentJob = jobs.find((j) => j.id === selectedJobFilter);
      const jTitle = currentJob ? currentJob.title : '';
      return ERPService.getJobProcurementItems(selectedJobFilter).map((it) => ({
        ...it,
        jobId: selectedJobFilter,
        jobTitle: jTitle,
      }));
    } else {
      return ERPService.getAllProcurementItems();
    }
  }, [selectedJobFilter, jobs, purchases]);

  // Filter procurement items
  const filteredProcurementItems = React.useMemo(() => {
    return allProcurementItems.filter((item) => {
      // Status filter
      if (procurementStatusFilter === 'pending' && item.orderedQty > 0) return false;
      if (procurementStatusFilter === 'partial' && (item.orderedQty === 0 || item.orderedQty >= item.targetQty)) return false;
      if (procurementStatusFilter === 'fulfilled' && (item.orderedQty < item.targetQty || item.orderedQty > item.targetQty)) return false;
      if (procurementStatusFilter === 'over' && item.orderedQty <= item.targetQty) return false;

      // Search filter
      if (matrixSearchQ.trim()) {
        const q = matrixSearchQ.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesSpec = (item.specification || '').toLowerCase().includes(q);
        const matchesSection = item.sectionTitle.toLowerCase().includes(q);
        const matchesSNo = item.boqLineSNo.toLowerCase().includes(q);
        const matchesJob = item.jobId.toLowerCase().includes(q) || item.jobTitle.toLowerCase().includes(q);
        if (!matchesName && !matchesSpec && !matchesSection && !matchesSNo && !matchesJob) {
          return false;
        }
      }

      return true;
    });
  }, [allProcurementItems, procurementStatusFilter, matrixSearchQ]);

  // Refresh site stocks when selected job changes
  useEffect(() => {
    setSiteStocks(ERPService.getSiteStocks(selectedJobFilter || undefined));
  }, [selectedJobFilter]);

  // Filter site stocks
  const filteredSiteStocks = React.useMemo(() => {
    return siteStocks.filter((s) => {
      // Status filter
      if (siteStockStatusFilter === 'in_stock' && s.stockOnSite <= 0) return false;
      if (siteStockStatusFilter === 'depleted' && s.stockOnSite > 0) return false;

      // Search query filter
      if (siteStockSearchQ.trim()) {
        const q = siteStockSearchQ.toLowerCase();
        const matchesName = (s.itemName || '').toLowerCase().includes(q);
        const matchesSpec = (s.specification || '').toLowerCase().includes(q);
        const matchesLoc = (s.locationName || '').toLowerCase().includes(q);
        const matchesJob = (s.jobId || '').toLowerCase().includes(q);
        const matchesBill = (s.lastBillNumber || '').toLowerCase().includes(q);
        const matchesPO = (s.lastPoId || '').toLowerCase().includes(q);
        const matchesPerson = (s.responsiblePerson || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSpec && !matchesLoc && !matchesJob && !matchesBill && !matchesPO && !matchesPerson) {
          return false;
        }
      }

      return true;
    });
  }, [siteStocks, siteStockStatusFilter, siteStockSearchQ]);

  // Site stocks metrics
  const totalSiteMaterialsCount = siteStocks.length;
  const inStockCount = siteStocks.filter((s) => s.stockOnSite > 0).length;
  const depletedCount = siteStocks.filter((s) => s.stockOnSite <= 0).length;
  const totalAvailableStockQty = siteStocks.reduce((sum, s) => sum + (s.stockOnSite || 0), 0);
  const totalIssuedStockQty = siteStocks.reduce((sum, s) => sum + (s.issuedQty || 0), 0);
  const totalSiteStockValuation = siteStocks.reduce((sum, s) => sum + ((s.stockOnSite || 0) * (s.unitCost || 0)), 0);
  const totalWithBillProofs = siteStocks.filter((s) => Boolean(s.billPhotoUrl || s.lastBillNumber)).length;

  // Filter purchases by selected job if set
  const filteredPurchases = React.useMemo(() => {
    if (!selectedJobFilter) return purchases;
    return purchases.filter(
      (p) => p.jobId === selectedJobFilter || (p.isMultiJob && p.jobIds?.includes(selectedJobFilter))
    );
  }, [purchases, selectedJobFilter]);

  // Procurement metrics calculations
  const totalProcurementItemsCount = allProcurementItems.length;
  const pendingItemsCount = allProcurementItems.filter((i) => i.orderedQty === 0).length;
  const partiallyOrderedCount = allProcurementItems.filter((i) => i.orderedQty > 0 && i.orderedQty < i.targetQty).length;
  const fulfilledCount = allProcurementItems.filter((i) => i.orderedQty >= i.targetQty).length;
  const totalBudgetEst = allProcurementItems.reduce((sum, i) => sum + (i.targetQty * i.targetRate), 0);
  const totalPOSpend = (selectedJobFilter ? filteredPurchases : purchases)
    .filter((p) => p.status !== 'Rejected')
    .reduce((sum, p) => sum + p.grandTotal, 0);

  // Selection toggle handlers
  const handleToggleSelectAll = () => {
    if (selectedProcurementKeys.size === filteredProcurementItems.length) {
      setSelectedProcurementKeys(new Set());
    } else {
      setSelectedProcurementKeys(new Set(filteredProcurementItems.map((i) => i.key)));
    }
  };

  const handleToggleSelectItem = (key: string) => {
    const next = new Set(selectedProcurementKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedProcurementKeys(next);
  };

  // Launch PO creation for a single item
  const handleProcureSingleItem = (item: ProcurableBOQItem & { jobId: string; jobTitle: string }) => {
    setCreatePOMode('job_based');
    setTargetJobIdForPO(item.jobId);
    setSelectedItemsForPO([
      {
        jobId: item.jobId,
        jobTitle: item.jobTitle,
        boqLineId: item.boqLineId,
        boqLineSNo: item.boqLineSNo,
        sectionTitle: item.sectionTitle,
        componentId: item.componentId,
        isBomComponent: item.isBomComponent,
        parentLineDescription: item.parentLineDescription,
        parentLineQty: item.parentLineQty,
        parentLineUnit: item.parentLineUnit,
        qtyPerUnit: item.qtyPerUnit,
        itemId: item.itemId,
        name: item.name,
        specification: item.specification,
        unit: item.unit,
        targetQty: item.targetQty,
        alreadyPurchasedQty: item.orderedQty,
        purchaseQty: item.balanceQty > 0 ? item.balanceQty : 1,
        targetRate: item.targetRate,
        purchaseRate: item.targetRate,
        vendorId: item.defaultVendorId,
      },
    ]);
    setIsCreateModalOpen(true);
  };

  // Launch PO creation for selected batch of items
  const handleProcureBatchSelected = () => {
    const selectedList = allProcurementItems.filter((i) => selectedProcurementKeys.has(i.key));
    if (selectedList.length === 0) return;

    const jobIds = Array.from(new Set(selectedList.map((i) => i.jobId)));
    const isMultiJob = jobIds.length > 1;

    const linesToOrder = selectedList.map((item) => ({
      jobId: item.jobId,
      jobTitle: item.jobTitle,
      boqLineId: item.boqLineId,
      boqLineSNo: item.boqLineSNo,
      sectionTitle: item.sectionTitle,
      componentId: item.componentId,
      isBomComponent: item.isBomComponent,
      parentLineDescription: item.parentLineDescription,
      parentLineQty: item.parentLineQty,
      parentLineUnit: item.parentLineUnit,
      qtyPerUnit: item.qtyPerUnit,
      itemId: item.itemId,
      name: item.name,
      specification: item.specification,
      unit: item.unit,
      targetQty: item.targetQty,
      alreadyPurchasedQty: item.orderedQty,
      purchaseQty: item.balanceQty > 0 ? item.balanceQty : 1,
      targetRate: item.targetRate,
      purchaseRate: item.targetRate,
      vendorId: item.defaultVendorId,
    }));

    setCreatePOMode(isMultiJob ? 'multi_job' : 'job_based');
    setTargetJobIdForPO(jobIds[0]);
    setSelectedItemsForPO(linesToOrder);
    setIsCreateModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <PageHeader
        title="Purchase Orders & Procurement Management"
        subtitle="Manage vendor purchase orders mapped directly to Job Bill of Quantities (BOQ) & constituent BOM materials. Tracks target quantities, rates, and approval limits."
        icon={<ShoppingCart size={22} />}
        actions={
          hasPermission('purchases.create_po') ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button
                variant="accent"
                icon={<Plus size={16} />}
                onClick={() => {
                  setCreatePOMode('job_based');
                  setTargetJobIdForPO(selectedJobFilter || (jobs[0]?.id || ''));
                  setSelectedItemsForPO([]);
                  setIsCreateModalOpen(true);
                }}
              >
                {selectedJobFilter ? `+ Create PO for ${selectedJobFilter}` : '+ Create Purchase Order'}
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* GLOBAL JOB SPINE SELECTOR BANNER */}
      <div
        className="ui-card"
        style={{
          padding: '12px 18px',
          backgroundColor: '#ffffff',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={18} color="var(--color-primary)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>
              Select Job Spine:
            </span>
          </div>

          <div style={{ minWidth: 280, maxWidth: 440, flex: 1 }}>
            <select
              className="ui-select"
              value={selectedJobFilter}
              onChange={(e) => {
                setSelectedJobFilter(e.target.value);
                setSelectedProcurementKeys(new Set());
              }}
              style={{
                width: '100%',
                fontWeight: 700,
                fontSize: '0.86rem',
                border: selectedJobFilter ? '2px solid var(--color-primary)' : '1px solid #cbd5e1',
                backgroundColor: selectedJobFilter ? '#f0f9ff' : '#ffffff',
              }}
            >
              <option value="">-- All Active Jobs ({jobs.length} Projects) --</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.id} - {j.title} ({j.clientName})
                </option>
              ))}
            </select>
          </div>

          {selectedJobFilter ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CheckCircle2 size={14} color="#0284c7" />
                Strict Job Filter Active: Showing strictly BOQ & POs for {selectedJobFilter}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedJobFilter('');
                  setSelectedProcurementKeys(new Set());
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontWeight: 700,
                }}
              >
                Clear Filter (Show All)
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              💡 Select a job to strictly isolate its BOQ items & POs.
            </span>
          )}
        </div>

        {selectedJobFilter && (
          <Button
            size="sm"
            variant="accent"
            icon={<Plus size={14} />}
            onClick={() => {
              setCreatePOMode('job_based');
              setTargetJobIdForPO(selectedJobFilter);
              setSelectedItemsForPO([]);
              setIsCreateModalOpen(true);
            }}
          >
            + New PO for {selectedJobFilter}
          </Button>
        )}
      </div>

      {/* Top Tab Bar: Orders vs BOQ Procurement Tracking */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid var(--border-light)',
          paddingBottom: 0,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 16 }}>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'orders' ? '3px solid var(--color-primary)' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'orders' ? 'var(--color-primary)' : 'var(--color-gray-600)',
              fontWeight: activeTab === 'orders' ? 800 : 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <ShoppingCart size={18} />
            <span>Purchase Orders ({filteredPurchases.length}{selectedJobFilter ? ` / ${purchases.length}` : ''})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('boq_procurement')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'boq_procurement' ? '3px solid var(--color-primary)' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'boq_procurement' ? 'var(--color-primary)' : 'var(--color-gray-600)',
              fontWeight: activeTab === 'boq_procurement' ? 800 : 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={18} />
            <span>BOQ Procurement Matrix</span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: '0.72rem',
                backgroundColor: pendingItemsCount > 0 ? '#fef3c7' : '#e0e7ff',
                color: pendingItemsCount > 0 ? '#92400e' : '#3730a3',
                fontWeight: 800,
              }}
            >
              {pendingItemsCount} unfulfilled
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('site_stocks')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'site_stocks' ? '3px solid var(--color-primary)' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'site_stocks' ? 'var(--color-primary)' : 'var(--color-gray-600)',
              fontWeight: activeTab === 'site_stocks' ? 800 : 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <Boxes size={18} />
            <span>On-Site Stocks</span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: '0.72rem',
                backgroundColor: totalAvailableStockQty > 0 ? '#dcfce7' : '#f1f5f9',
                color: totalAvailableStockQty > 0 ? '#166534' : '#64748b',
                fontWeight: 800,
              }}
            >
              {filteredSiteStocks.length} SKUs ({totalAvailableStockQty} units)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('site_indents')}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'site_indents' ? '3px solid var(--color-primary)' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'site_indents' ? 'var(--color-primary)' : 'var(--color-gray-600)',
              fontWeight: activeTab === 'site_indents' ? 800 : 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <MapPin size={18} />
            <span>Site Requisitions & Indents</span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: '0.72rem',
                backgroundColor: materialRequests.filter((r) => r.status === 'Pending').length > 0 ? '#fee2e2' : '#f1f5f9',
                color: materialRequests.filter((r) => r.status === 'Pending').length > 0 ? '#991b1b' : '#64748b',
                fontWeight: 800,
              }}
            >
              {materialRequests.filter((r) => r.status === 'Pending').length} pending
            </span>
          </button>
        </div>

        {/* Quick info right side */}
        <div style={{ fontSize: '0.84rem', color: 'var(--color-gray-500)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>Total Committed Spend: <strong style={{ color: 'var(--color-primary)' }}>₹{totalPOSpend.toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      {/* VIEW 1: PURCHASE ORDERS LIST */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <DataTable<PurchaseOrder>
            data={filteredPurchases}
            keyExtractor={(p) => p.id}
            searchField={(p) => `${p.id} ${p.jobId} ${p.jobTitle} ${p.vendorName} ${p.notes || ''}`}
            searchPlaceholder="Search purchases by PO #, Job ID, Vendor, Items..."
            columns={[
              {
                key: 'id',
                header: 'PO Number & Date',
                render: (p) => (
                  <div
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setDetailPO(p);
                      setIsDetailModalOpen(true);
                    }}
                  >
                    <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                      {p.id}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>Date: {p.date}</div>
                    {p.boqTitle && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-600)', marginTop: 2 }}>
                        Package: {p.boqTitle}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: 'jobId',
                header: 'Linked Job Spine',
                render: (p) => (
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{p.jobId}</span>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--color-gray-600)',
                        maxWidth: 220,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={p.jobTitle}
                    >
                      {p.jobTitle}
                    </div>
                  </div>
                ),
              },
              {
                key: 'vendorName',
                header: 'Vendor & Destination',
                render: (p) => (
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.vendorName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)' }}>Destination: {p.deliveryLocation}</div>
                    {p.status === 'Delivered' && p.receivedDestination && (
                      <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 800, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} color="#16a34a" />
                        <span>Moved to: {p.receivedDestination}</span>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: 'items',
                header: 'Procured Materials & BOQ Mapping',
                render: (p) => (
                  <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {p.items.map((i) => (
                      <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {i.boqLineSNo && (
                          <span
                            style={{
                              padding: '1px 5px',
                              borderRadius: 4,
                              backgroundColor: i.isBomComponent ? '#fdf4ff' : '#eff6ff',
                              color: i.isBomComponent ? '#86198f' : '#1d4ed8',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              border: i.isBomComponent ? '1px solid #f0abfc' : '1px solid #bfdbfe',
                            }}
                          >
                            {i.isBomComponent ? `BOM [${i.boqLineSNo}]` : `BOQ [${i.boqLineSNo}]`}
                          </span>
                        )}
                        <span>
                          <strong>{i.purchaseQty} {i.unit}</strong> {i.itemName} @ ₹{i.purchaseRate}
                        </span>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: 'grandTotal',
                header: 'Total Value',
                render: (p) => (
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                      ₹{p.grandTotal.toLocaleString('en-IN')}
                    </div>
                    {p.transportCost > 0 && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-500)' }}>
                        +₹{p.transportCost.toLocaleString('en-IN')} Transport
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status & Approval',
                render: (p) => (
                  <div>
                    <Badge status={p.status} />
                    {p.approvalTriggered && (
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: p.status === 'Approved' ? 'var(--color-success)' : 'var(--color-warning-text)',
                          marginTop: 3,
                          fontWeight: 700,
                        }}
                      >
                        {p.status === 'Approved' ? '✓ Over-Limit Approved' : '⚠️ Limit Breach Detected'}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: 'action',
                header: 'Actions',
                render: (p) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Eye size={14} />}
                      onClick={() => {
                        setDetailPO(p);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      View PO
                    </Button>

                    {/* Receive Billed Items button for Approved POs */}
                    {p.status === 'Approved' && hasPermission('purchases.inward_verify') && (
                      <Button
                        size="sm"
                        variant="accent"
                        icon={<PackageCheck size={14} />}
                        onClick={() => {
                          setTargetPOForReceive(p);
                          setIsReceiveModalOpen(true);
                        }}
                        title="Capture bill photo and move items to site store or warehouse"
                      >
                        📦 Receive Items
                      </Button>
                    )}

                    {/* View Bill Photo Proof button for Delivered POs */}
                    {p.billPhotoUrl && (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Camera size={14} />}
                        onClick={() => {
                          setTargetPOForBillProof(p);
                          setIsBillProofModalOpen(true);
                        }}
                        style={{ backgroundColor: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}
                        title="View photo proof of purchased bill"
                      >
                        📷 Bill #{p.billNumber || 'Proof'}
                      </Button>
                    )}

                    {p.status === 'Pending Approval' && hasPermission('purchases.approve_po') && (
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() => {
                          setApprovalTargetPO(p);
                          setIsApproveModalOpen(true);
                        }}
                      >
                        Review
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* VIEW 2: BOQ PROCUREMENT TRACKING MATRIX */}
      {activeTab === 'boq_procurement' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Metrics summary cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            <div className="ui-card" style={{ padding: '14px 18px', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', fontWeight: 600 }}>Total BOQ Materials</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: 4 }}>
                {totalProcurementItemsCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginTop: 2 }}>
                Across {selectedJobFilter ? 'Selected Job' : `${jobs.length} Active Jobs`}
              </div>
            </div>

            <div className="ui-card" style={{ padding: '14px 18px', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', fontWeight: 600 }}>Pending Procurement</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309', marginTop: 4 }}>
                {pendingItemsCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: 2 }}>
                No PO raised yet ({Math.round((pendingItemsCount / (totalProcurementItemsCount || 1)) * 100)}%)
              </div>
            </div>

            <div className="ui-card" style={{ padding: '14px 18px', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', fontWeight: 600 }}>Partially Procured</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1d4ed8', marginTop: 4 }}>
                {partiallyOrderedCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginTop: 2 }}>
                Partial quantity remaining
              </div>
            </div>

            <div className="ui-card" style={{ padding: '14px 18px', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', fontWeight: 600 }}>Procurement Fulfilled</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d', marginTop: 4 }}>
                {fulfilledCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: 2 }}>
                100% target quantity ordered
              </div>
            </div>

            <div className="ui-card" style={{ padding: '14px 18px', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', fontWeight: 600 }}>Target Material Budget</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: 4 }}>
                ₹{totalBudgetEst.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)', marginTop: 2 }}>
                Quoted supply value
              </div>
            </div>
          </div>

          {/* Filtering Bar */}
          <div
            className="ui-card"
            style={{
              padding: '14px 18px',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
                {/* Job filter dropdown */}
                <div style={{ minWidth: 260 }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-gray-600)', display: 'block', marginBottom: 4 }}>
                    Filter by Job Spine:
                  </label>
                  <select
                    className="ui-select"
                    value={selectedJobFilter}
                    onChange={(e) => {
                      setSelectedJobFilter(e.target.value);
                      setSelectedProcurementKeys(new Set());
                    }}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    <option value="">-- All Active Jobs ({jobs.length}) --</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.id} - {j.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status filter chips */}
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-gray-600)', display: 'block', marginBottom: 4 }}>
                    Order Status:
                  </label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(
                      [
                        { id: 'all', label: 'All Items' },
                        { id: 'pending', label: 'Pending Only' },
                        { id: 'partial', label: 'Partially Ordered' },
                        { id: 'fulfilled', label: 'Fulfilled' },
                        { id: 'over', label: 'Over-Ordered' },
                      ] as Array<{ id: ProcurementStatusFilter; label: string }>
                    ).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setProcurementStatusFilter(st.id)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 6,
                          fontSize: '0.78rem',
                          fontWeight: procurementStatusFilter === st.id ? 800 : 600,
                          backgroundColor: procurementStatusFilter === st.id ? 'var(--color-primary)' : '#f1f5f9',
                          color: procurementStatusFilter === st.id ? '#ffffff' : 'var(--color-gray-700)',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Search Box */}
              <div style={{ minWidth: 280 }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-gray-600)', display: 'block', marginBottom: 4 }}>
                  Search Materials:
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-gray-400)' }} />
                  <input
                    type="text"
                    className="ui-input"
                    placeholder="Search wire, conduit, switch, BOQ S.No..."
                    value={matrixSearchQ}
                    onChange={(e) => setMatrixSearchQ(e.target.value)}
                    style={{ paddingLeft: 34, fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Batch Selection Action Bar (appears when items are checked) */}
            {selectedProcurementKeys.size > 0 && (
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#166534' }}>
                    {selectedProcurementKeys.size} materials selected for purchase
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedProcurementKeys(new Set())}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    size="sm"
                    variant="accent"
                    icon={<ShoppingCart size={16} />}
                    onClick={handleProcureBatchSelected}
                  >
                    🛒 Create Purchase Order for Selected ({selectedProcurementKeys.size})
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Table of Procurable Materials */}
          <div className="ui-card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="ui-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={
                          filteredProcurementItems.length > 0 &&
                          selectedProcurementKeys.size === filteredProcurementItems.length
                        }
                        onChange={handleToggleSelectAll}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ minWidth: 140 }}>Job Spine</th>
                    <th style={{ minWidth: 150 }}>BOQ Section & S.No</th>
                    <th style={{ minWidth: 260 }}>Material / Item Description</th>
                    <th style={{ width: 70 }}>Unit</th>
                    <th style={{ width: 90, textAlign: 'right' }}>BOQ Target</th>
                    <th style={{ width: 140, textAlign: 'left' }}>Ordered Progress</th>
                    <th style={{ width: 90, textAlign: 'right' }}>Balance</th>
                    <th style={{ width: 100, textAlign: 'right' }}>Target Rate</th>
                    <th style={{ width: 110, textAlign: 'right' }}>Est. Total (₹)</th>
                    <th style={{ width: 120 }}>Status</th>
                    <th style={{ width: 110, textAlign: 'center' }}>Procure Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProcurementItems.length === 0 ? (
                    <tr>
                      <td colSpan={12} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--color-gray-500)' }}>
                        <FileSpreadsheet size={32} style={{ margin: '0 auto 8px', color: 'var(--color-gray-300)' }} />
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>No procurable BOQ items found</div>
                        <div style={{ fontSize: '0.82rem', marginTop: 4 }}>
                          {selectedJobFilter
                            ? 'The selected job has no BOQ lines or constituent BOM materials defined yet.'
                            : 'Try adjusting your search query or filter selection.'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProcurementItems.map((item) => {
                      const isSelected = selectedProcurementKeys.has(item.key);
                      const pctProcured = item.targetQty > 0
                        ? Math.min(100, Math.round((item.orderedQty / item.targetQty) * 100))
                        : 0;

                      return (
                        <tr
                          key={item.key}
                          style={{
                            backgroundColor: isSelected ? '#f0fdf4' : undefined,
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectItem(item.key)}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{item.jobId}</span>
                            <div
                              style={{
                                fontSize: '0.74rem',
                                color: 'var(--color-gray-500)',
                                maxWidth: 130,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={item.jobTitle}
                            >
                              {item.jobTitle}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span
                                style={{
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  backgroundColor: item.isBomComponent ? '#fdf4ff' : '#eff6ff',
                                  color: item.isBomComponent ? '#86198f' : '#1d4ed8',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  border: item.isBomComponent ? '1px solid #f0abfc' : '1px solid #bfdbfe',
                                }}
                              >
                                {item.isBomComponent ? 'BOM Breakdown' : `BOQ [${item.boqLineSNo}]`}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-gray-600)',
                                marginTop: 2,
                                maxWidth: 160,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={item.sectionTitle}
                            >
                              {item.sectionTitle}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => setMappingModalTarget({ materialName: item.name, specification: item.specification, jobId: item.jobId, componentId: item.componentId })}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  padding: 0,
                                  fontWeight: 700,
                                  fontSize: '0.88rem',
                                  color: '#0f172a',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  textDecoration: 'underline',
                                  textDecorationColor: '#cbd5e1',
                                }}
                                title="Click to view full BOQ Mapping & Multiplier details"
                              >
                                {item.name}
                              </button>
                              <button
                                type="button"
                                onClick={() => setMappingModalTarget({ materialName: item.name, specification: item.specification, jobId: item.jobId, componentId: item.componentId })}
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
                                title="Click to view full BOQ Mapping & Multiplier calculation details"
                              >
                                🔍 Where Mapped?
                              </button>
                            </div>
                            {item.specification && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: 2 }}>
                                Spec: {item.specification}
                              </div>
                            )}
                            {item.parentLineDescription && (
                              <div style={{ fontSize: '0.72rem', color: '#9333ea', fontWeight: 600, marginTop: 2 }}>
                                From: {item.parentLineDescription} ({item.parentLineQty} {item.parentLineUnit || 'units'} × {item.qtyPerUnit} {item.unit})
                              </div>
                            )}
                          </td>
                          <td>{item.unit}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            {item.targetQty.toLocaleString('en-IN')}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                <span>{item.orderedQty.toLocaleString('en-IN')} ordered</span>
                                <span style={{ fontWeight: 700 }}>{pctProcured}%</span>
                              </div>
                              <div
                                style={{
                                  width: '100%',
                                  height: 6,
                                  backgroundColor: '#e2e8f0',
                                  borderRadius: 3,
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${pctProcured}%`,
                                    backgroundColor:
                                      pctProcured >= 100
                                        ? '#16a34a'
                                        : pctProcured > 0
                                        ? '#2563eb'
                                        : '#cbd5e1',
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span
                              style={{
                                fontWeight: 800,
                                color: item.balanceQty === 0 ? '#16a34a' : item.balanceQty < 0 ? '#dc2626' : '#d97706',
                              }}
                            >
                              {item.balanceQty.toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>₹{item.targetRate.toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                            ₹{(item.targetQty * item.targetRate).toLocaleString('en-IN')}
                          </td>
                          <td>
                            {item.orderedQty === 0 ? (
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  backgroundColor: '#fef3c7',
                                  color: '#92400e',
                                }}
                              >
                                Unordered
                              </span>
                            ) : item.orderedQty < item.targetQty ? (
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  backgroundColor: '#e0e7ff',
                                  color: '#3730a3',
                                }}
                              >
                                Partial
                              </span>
                            ) : item.orderedQty === item.targetQty ? (
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  backgroundColor: '#dcfce7',
                                  color: '#166534',
                                }}
                              >
                                Fulfilled
                              </span>
                            ) : (
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  backgroundColor: '#fee2e2',
                                  color: '#991b1b',
                                }}
                              >
                                Over-Ordered
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <Button
                              size="sm"
                              variant={item.balanceQty > 0 ? 'accent' : 'secondary'}
                              icon={<ShoppingCart size={13} />}
                              onClick={() => handleProcureSingleItem(item)}
                              title="Raise Purchase Order connected to this BOQ item"
                            >
                              Procure
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: ON-SITE STOCKS LEDGER & CONSUMPTION */}
      {activeTab === 'site_stocks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Top Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            <div
              className="ui-card"
              style={{
                padding: 'var(--space-4)',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  backgroundColor: '#eff6ff',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Boxes size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Materials On Site
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
                  {totalSiteMaterialsCount} <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>SKUs</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                  {inStockCount} available in store
                </div>
              </div>
            </div>

            <div
              className="ui-card"
              style={{
                padding: 'var(--space-4)',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  backgroundColor: '#f0fdf4',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PackageCheck size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Available Site Balance
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#16a34a' }}>
                  {totalAvailableStockQty.toLocaleString('en-IN')} <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>Units</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  Ready for installation
                </div>
              </div>
            </div>

            <div
              className="ui-card"
              style={{
                padding: 'var(--space-4)',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArrowUpRight size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Issued to Work / Tasks
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#d97706' }}>
                  {totalIssuedStockQty.toLocaleString('en-IN')} <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>Units</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  Consumed by site labour
                </div>
              </div>
            </div>

            <div
              className="ui-card"
              style={{
                padding: 'var(--space-4)',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  backgroundColor: '#faf5ff',
                  color: '#9333ea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Verified Inward Bills
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#9333ea' }}>
                  {totalWithBillProofs} <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>Bills</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  With camera photo proof
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div
            className="ui-card"
            style={{
              padding: '12px 16px',
              backgroundColor: '#ffffff',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
              {/* Search input */}
              <div style={{ position: 'relative', minWidth: 260, flex: 1, maxWidth: 400 }}>
                <Search
                  size={16}
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                />
                <input
                  type="text"
                  placeholder="Search material name, spec, bill #, location..."
                  value={siteStockSearchQ}
                  onChange={(e) => setSiteStockSearchQ(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.86rem',
                  }}
                />
                {siteStockSearchQ && (
                  <button
                    type="button"
                    onClick={() => setSiteStockSearchQ('')}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status filter buttons */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setSiteStockStatusFilter('all')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: siteStockStatusFilter === 'all' ? 'var(--color-primary)' : '#e2e8f0',
                    backgroundColor: siteStockStatusFilter === 'all' ? 'var(--color-primary)' : '#ffffff',
                    color: siteStockStatusFilter === 'all' ? '#ffffff' : '#475569',
                  }}
                >
                  All ({totalSiteMaterialsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSiteStockStatusFilter('in_stock')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: siteStockStatusFilter === 'in_stock' ? '#16a34a' : '#e2e8f0',
                    backgroundColor: siteStockStatusFilter === 'in_stock' ? '#f0fdf4' : '#ffffff',
                    color: siteStockStatusFilter === 'in_stock' ? '#166534' : '#475569',
                  }}
                >
                  Available In Stock ({inStockCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSiteStockStatusFilter('depleted')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: siteStockStatusFilter === 'depleted' ? '#dc2626' : '#e2e8f0',
                    backgroundColor: siteStockStatusFilter === 'depleted' ? '#fef2f2' : '#ffffff',
                    color: siteStockStatusFilter === 'depleted' ? '#991b1b' : '#475569',
                  }}
                >
                  Depleted (0) ({depletedCount})
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {selectedJobFilter && (
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}
                >
                  Filtered by Job: {selectedJobFilter}
                </span>
              )}
              <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                Showing <strong>{filteredSiteStocks.length}</strong> items
              </span>
            </div>
          </div>

          {/* Site Stocks Table */}
          <div
            className="ui-card"
            style={{
              padding: 0,
              backgroundColor: '#ffffff',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px', width: 50 }}>#</th>
                    <th style={{ padding: '12px 14px' }}>Material / Product Name</th>
                    <th style={{ padding: '12px 14px' }}>Job Spine & Site Store</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Received</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Issued</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Available on Site</th>
                    <th style={{ padding: '12px 14px' }}>Unit</th>
                    <th style={{ padding: '12px 14px' }}>Inward Bill / Ref</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Bill Proof</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSiteStocks.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                          <Boxes size={36} color="#94a3b8" />
                          <div style={{ fontWeight: 700, fontSize: '0.96rem', color: '#334155' }}>
                            No Site Stocks Found {selectedJobFilter ? `for Job ${selectedJobFilter}` : ''}
                          </div>
                          <div style={{ fontSize: '0.82rem', maxWidth: 440 }}>
                            Materials arrive at the site store once Purchase Orders are received with a vendor bill photo proof. Check approved POs in the <strong>Purchase Orders</strong> tab and click <strong>Receive Items</strong>!
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSiteStocks.map((stock, idx) => {
                      const isAvailable = (stock.stockOnSite || 0) > 0;
                      const linkedPO = purchases.find((p) => p.id === stock.lastPoId);
                      const billImg = stock.billPhotoUrl || linkedPO?.billPhotoUrl;

                      return (
                        <tr
                          key={stock.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#fafafa')}
                        >
                          {/* Sl No */}
                          <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>
                            {idx + 1}
                          </td>

                          {/* Material Name & Spec */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                              {stock.itemName}
                            </div>
                            {stock.specification && (
                              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2 }}>
                                {stock.specification}
                              </div>
                            )}
                          </td>

                          {/* Job Spine & Site Store */}
                          <td style={{ padding: '12px 14px' }}>
                            {stock.jobId ? (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  backgroundColor: '#eff6ff',
                                  color: 'var(--color-primary)',
                                  fontWeight: 800,
                                  fontSize: '0.76rem',
                                  fontFamily: 'var(--font-mono)',
                                  marginBottom: 3,
                                }}
                              >
                                {stock.jobId}
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  backgroundColor: '#f1f5f9',
                                  color: '#64748b',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                }}
                              >
                                General Store
                              </span>
                            )}
                            <div style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                              {stock.locationName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              In-charge: {stock.responsiblePerson}
                            </div>
                          </td>

                          {/* Received Qty */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#334155' }}>
                            {stock.receivedQty}
                          </td>

                          {/* Issued Qty */}
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: stock.issuedQty > 0 ? '#d97706' : '#94a3b8' }}>
                            {stock.issuedQty || 0}
                          </td>

                          {/* Available Stock on Site */}
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                borderRadius: 16,
                                backgroundColor: isAvailable ? '#dcfce7' : '#fee2e2',
                                color: isAvailable ? '#166534' : '#991b1b',
                                fontWeight: 800,
                                fontSize: '0.88rem',
                              }}
                            >
                              {isAvailable ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                              {stock.stockOnSite} {stock.unit}
                            </span>
                          </td>

                          {/* Unit */}
                          <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>
                            {stock.unit}
                          </td>

                          {/* Inward Bill / Ref */}
                          <td style={{ padding: '12px 14px' }}>
                            {stock.lastBillNumber ? (
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
                                Bill #{stock.lastBillNumber}
                              </div>
                            ) : null}
                            {stock.lastPoId && (
                              <button
                                type="button"
                                onClick={() => {
                                  const po = purchases.find((p) => p.id === stock.lastPoId);
                                  if (po) {
                                    setDetailPO(po);
                                    setIsDetailModalOpen(true);
                                  }
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--color-primary)',
                                  fontSize: '0.75rem',
                                  padding: 0,
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  fontWeight: 600,
                                }}
                              >
                                {stock.lastPoId}
                              </button>
                            )}
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                              {stock.lastUpdated}
                            </div>
                          </td>

                          {/* Bill Proof Thumbnail */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            {billImg ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (linkedPO) {
                                    setTargetPOForBillProof(linkedPO);
                                    setIsBillProofModalOpen(true);
                                  } else {
                                    setTargetPOForBillProof({
                                      id: stock.lastPoId || 'PO-DELIVERED',
                                      jobId: stock.jobId || 'GENERAL',
                                      jobTitle: stock.locationName || 'Site Store',
                                      vendorId: 'v-1',
                                      vendorName: stock.locationName,
                                      deliveryLocation: stock.locationName,
                                      costType: 'Material',
                                      status: 'Delivered',
                                      approvalTriggered: false,
                                      date: stock.lastUpdated,
                                      billNumber: stock.lastBillNumber,
                                      billPhotoUrl: billImg,
                                      receivedDestination: stock.locationName,
                                      items: [],
                                      subtotal: 0,
                                      taxAmount: 0,
                                      transportCost: 0,
                                      grandTotal: 0,
                                      createdAt: stock.lastUpdated,
                                    });
                                    setIsBillProofModalOpen(true);
                                  }
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  backgroundColor: '#f1f5f9',
                                  border: '1px solid #cbd5e1',
                                  color: '#0f172a',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                                title="Click to view verified bill photo"
                              >
                                <Camera size={13} color="#2563eb" />
                                <span>Proof</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>-</span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <Button
                              size="sm"
                              variant={isAvailable && hasPermission('sites.issue_material') ? 'accent' : 'secondary'}
                              icon={<ArrowUpRight size={13} />}
                              disabled={!isAvailable || !hasPermission('sites.issue_material')}
                              onClick={() => {
                                setSelectedStockForIssue(stock);
                                setIsIssueModalOpen(true);
                              }}
                              title={
                                !hasPermission('sites.issue_material')
                                  ? 'Requires sites.issue_material privilege to dispense stock'
                                  : isAvailable
                                  ? 'Issue material from site store to work task'
                                  : 'No available stock to issue'
                              }
                            >
                              Issue to Work
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SITE MATERIAL INDENTS & DIRECT FULFILLMENT */}
      {activeTab === 'site_indents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Header banner */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={20} color="#2563eb" />
                Site Requisitions & Material Fulfillment
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#3b82f6' }}>
                On-site material demands raised by Site Engineers. Fulfill directly from Central Warehouse inventory or convert to Purchase Orders for suppliers.
              </p>
            </div>

            <Button
              variant="accent"
              icon={<Plus size={15} />}
              onClick={() => {
                setTargetJobIdForPO('');
                setTargetIndentIdForPO('');
                setCreatePOMode('job_based');
                setSelectedItemsForPO([]);
                setIsCreateModalOpen(true);
              }}
            >
              + Create Direct PO
            </Button>
          </div>

          {/* Filter toolbar */}
          <div
            className="ui-card"
            style={{
              padding: '12px 18px',
              backgroundColor: '#ffffff',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
              <div style={{ minWidth: 260, flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  className="ui-input"
                  placeholder="Search requisitions by material, site, job, engineer..."
                  value={indentSearchQ}
                  onChange={(e) => setIndentSearchQ(e.target.value)}
                  style={{ width: '100%', height: 36, paddingLeft: 32, fontSize: '0.84rem' }}
                />
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              </div>

              <select
                value={indentDestinationFilter}
                onChange={(e) => setIndentDestinationFilter(e.target.value as any)}
                style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}
              >
                <option value="all">All Routes (Warehouse & Admin)</option>
                <option value="Warehouse">🏬 Route: Central Warehouse</option>
                <option value="Admin">🏢 Route: Admin / Procurement</option>
              </select>

              <select
                value={indentStatusFilter}
                onChange={(e) => setIndentStatusFilter(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}
              >
                <option value="all">All Request Statuses</option>
                <option value="Pending">⏳ Pending Review</option>
                <option value="Approved">✓ Approved</option>
                <option value="Moved to Purchase">📦 Moved to Purchase</option>
                <option value="PO Issued">📄 PO Issued</option>
                <option value="Delivered to Site">🚚 Delivered to Site</option>
                <option value="Received by Site Engineer">✓ Received in Site Store</option>
              </select>
            </div>
          </div>

          {/* Requisitions Table */}
          <div className="ui-card" style={{ padding: 0, backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px' }}>Request ID</th>
                    <th style={{ padding: '12px 14px' }}>Site & Project Job</th>
                    <th style={{ padding: '12px 14px' }}>Route & Engineer</th>
                    <th style={{ padding: '12px 14px' }}>Requested Material</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Quantity</th>
                    <th style={{ padding: '12px 14px' }}>Urgency</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Admin / Warehouse Action</th>
                  </tr>
                </thead>
                <tbody>
                  {materialRequests
                    .filter((r) => {
                      if (indentDestinationFilter !== 'all' && (r.targetDestination || 'Warehouse') !== indentDestinationFilter) return false;
                      if (indentStatusFilter !== 'all' && r.status !== indentStatusFilter) return false;
                      if (indentSearchQ.trim()) {
                        const q = indentSearchQ.toLowerCase();
                        const mName = (r.itemName || '').toLowerCase().includes(q);
                        const mSite = (r.siteName || '').toLowerCase().includes(q);
                        const mJob = (r.jobId || '').toLowerCase().includes(q);
                        const mEng = (r.siteEngineerName || '').toLowerCase().includes(q);
                        if (!mName && !mSite && !mJob && !mEng) return false;
                      }
                      return true;
                    })
                    .map((req) => {
                      const isPending = req.status === 'Pending';
                      return (
                        <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                            {req.id}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{req.siteName || 'Project Site'}</div>
                            <span style={{ fontSize: '0.74rem', color: '#4338ca', fontWeight: 700 }}>{req.jobId}</span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 7px',
                                  borderRadius: 4,
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  backgroundColor: req.targetDestination === 'Admin' ? '#f5f3ff' : '#eff6ff',
                                  color: req.targetDestination === 'Admin' ? '#6d28d9' : '#0369a1',
                                  border: req.targetDestination === 'Admin' ? '1px solid #ddd6fe' : '1px solid #bae6fd',
                                }}
                              >
                                {req.targetDestination === 'Admin' ? '🏢 To Admin' : '🏬 To Warehouse'}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
                                👷 {req.siteEngineerName || 'Site Engineer'}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{req.itemName}</div>
                            {req.specification && (
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{req.specification}</div>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#0284c7' }}>
                            {req.requestedExtraQty} {req.unit}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                backgroundColor: req.urgency === 'Critical' ? '#fee2e2' : req.urgency === 'High' ? '#fef3c7' : '#f1f5f9',
                                color: req.urgency === 'Critical' ? '#991b1b' : req.urgency === 'High' ? '#92400e' : '#475569',
                              }}
                            >
                              {req.urgency || 'Normal'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '3px 8px',
                                  borderRadius: 12,
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  backgroundColor:
                                    req.status === 'Pending'
                                      ? '#fef3c7'
                                      : req.status === 'Approved'
                                      ? '#dcfce7'
                                      : req.status === 'Moved to Purchase'
                                      ? '#e0e7ff'
                                      : req.status === 'PO Issued'
                                      ? '#dbeafe'
                                      : req.status === 'Delivered to Site'
                                      ? '#fef9c3'
                                      : req.status === 'Received by Site Engineer'
                                      ? '#ecfdf5'
                                      : req.status === 'Dispatched from Warehouse'
                                      ? '#e0f2fe'
                                      : '#fee2e2',
                                  color:
                                    req.status === 'Pending'
                                      ? '#92400e'
                                      : req.status === 'Approved'
                                      ? '#166534'
                                      : req.status === 'Moved to Purchase'
                                      ? '#3730a3'
                                      : req.status === 'PO Issued'
                                      ? '#1e40af'
                                      : req.status === 'Delivered to Site'
                                      ? '#854d0e'
                                      : req.status === 'Received by Site Engineer'
                                      ? '#065f46'
                                      : req.status === 'Dispatched from Warehouse'
                                      ? '#0369a1'
                                      : '#991b1b',
                                }}
                              >
                                {req.status === 'Pending' ? <Clock size={11} /> : <CheckCircle2 size={11} />}
                                {req.status}
                              </span>
                              {req.status === 'Dispatched from Warehouse' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                                  <span style={{ fontSize: '0.68rem', color: '#0369a1', fontWeight: 700 }}>
                                    🚚 {req.dispatchChallanNumber || 'DC-WH'} • {req.vehicleNumber || 'Tempo'}
                                  </span>
                                  {req.transportCost ? (
                                    <span style={{ fontSize: '0.66rem', color: '#b45309', fontWeight: 700 }}>
                                      Freight: ₹{req.transportCost.toLocaleString('en-IN')}
                                    </span>
                                  ) : null}
                                </div>
                              )}
                              {req.poTitle && (
                                <span style={{ fontSize: '0.68rem', color: '#1e40af', fontWeight: 700 }}>
                                  {req.poTitle}
                                </span>
                              )}
                              {req.receivedByEngineerName && (
                                <span style={{ fontSize: '0.68rem', color: '#065f46', fontWeight: 700 }}>
                                  ✓ In Store ({req.receivedByEngineerName})
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                              {isPending && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="accent"
                                    icon={<ArrowRight size={12} />}
                                    onClick={() => {
                                      ERPService.moveSiteIndentToPurchase(req.id, 'Moved to Purchase from Purchases Center');
                                      setTargetJobIdForPO(req.jobId);
                                      setTargetIndentIdForPO(req.id);
                                      setCreatePOMode('job_based');
                                      setSelectedItemsForPO([]);
                                      setIsCreateModalOpen(true);
                                    }}
                                  >
                                    Move to Purchase
                                  </Button>
                                  {req.targetDestination === 'Warehouse' && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      icon={<Boxes size={12} />}
                                      onClick={() => {
                                        setDispatchingIndent(req);
                                        setIsIndentDispatchModalOpen(true);
                                      }}
                                    >
                                      Dispatch WH
                                    </Button>
                                  )}
                                </>
                              )}

                              {(req.status === 'Approved' || req.status === 'Moved to Purchase') && (
                                <Button
                                  size="sm"
                                  variant="accent"
                                  icon={<ShoppingCart size={12} />}
                                  onClick={() => {
                                    setTargetJobIdForPO(req.jobId);
                                    setTargetIndentIdForPO(req.id);
                                    setCreatePOMode('job_based');
                                    setSelectedItemsForPO([]);
                                    setIsCreateModalOpen(true);
                                  }}
                                >
                                  Generate PO
                                </Button>
                              )}

                              {(req.status === 'Delivered to Site' || req.status === 'Dispatched from Warehouse') && (
                                <Button
                                  size="sm"
                                  variant="accent"
                                  icon={<CheckCircle2 size={12} />}
                                  onClick={() => {
                                    setReceivingIndent(req);
                                    setIsIndentReceiveModalOpen(true);
                                  }}
                                >
                                  Receive into Store
                                </Button>
                              )}

                              {req.status === 'PO Issued' && req.poId && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  icon={<Eye size={12} />}
                                  onClick={() => {
                                    const foundPO = purchases.find((p) => p.id === req.poId);
                                    if (foundPO) {
                                      setDetailPO(foundPO);
                                      setIsDetailModalOpen(true);
                                    }
                                  }}
                                >
                                  View PO
                                </Button>
                              )}

                              {req.status === 'Received by Site Engineer' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 800 }}>
                                    ✓ Stock Inwarded
                                  </span>
                                  {req.deliveryProofPhotoUrl && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      icon={<Camera size={12} />}
                                      onClick={() => {
                                        setViewingProofIndent(req);
                                        setIsIndentProofModalOpen(true);
                                      }}
                                    >
                                      View Proof
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-ITEM / BOQ-CONNECTED CREATE PURCHASE ORDER MODAL */}
      <CreatePurchaseOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setTargetIndentIdForPO('');
          setSearchParams({});
        }}
        initialJobId={targetJobIdForPO}
        initialMode={createPOMode}
        initialIndentId={targetIndentIdForPO}
        initialSelectedItems={selectedItemsForPO}
        onSuccess={(po) => {
          loadData();
          setSelectedProcurementKeys(new Set());
          setTargetIndentIdForPO('');
          setDetailPO(po);
          setIsDetailModalOpen(true);
        }}
      />

      {/* PURCHASE ORDER DETAIL & VOUCHER PRINT MODAL */}
      <PurchaseOrderDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        purchaseOrder={detailPO}
        onApprove={(po) => {
          setApprovalTargetPO(po);
          setIsApproveModalOpen(true);
        }}
        onReceive={(po) => {
          setIsDetailModalOpen(false);
          setTargetPOForReceive(po);
          setIsReceiveModalOpen(true);
        }}
        onViewBillProof={(po) => {
          setTargetPOForBillProof(po);
          setIsBillProofModalOpen(true);
        }}
      />

      {/* RECEIVE BILLED ITEMS & INWARD MODAL */}
      <ReceiveBilledItemsModal
        isOpen={isReceiveModalOpen}
        onClose={() => {
          setIsReceiveModalOpen(false);
          setTargetPOForReceive(null);
        }}
        purchaseOrder={targetPOForReceive}
        onSuccess={(updatedPO) => {
          loadData();
          setDetailPO(updatedPO);
        }}
      />

      {/* BILL PHOTO PROOF VIEWER MODAL */}
      <BillProofViewerModal
        isOpen={isBillProofModalOpen}
        onClose={() => {
          setIsBillProofModalOpen(false);
          setTargetPOForBillProof(null);
        }}
        purchaseOrder={targetPOForBillProof}
      />

      {/* ISSUE SITE MATERIAL MODAL */}
      <IssueSiteMaterialModal
        isOpen={isIssueModalOpen}
        onClose={() => {
          setIsIssueModalOpen(false);
          setSelectedStockForIssue(null);
        }}
        stockItem={selectedStockForIssue}
        onSuccess={() => {
          loadData();
        }}
      />

      {/* REVIEW & APPROVE PO MODAL */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => {
          setIsApproveModalOpen(false);
          setApprovalTargetPO(null);
        }}
        title="Admin Approval: Purchase Limit Breach"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {approvalTargetPO && (
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                padding: 12,
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                color: '#92400e',
              }}
            >
              <strong>Trigger Reason:</strong> {approvalTargetPO.approvalReason}
            </div>
          )}

          <p style={{ fontSize: '0.9rem', color: 'var(--color-gray-700)' }}>
            As Admin, you are reviewing Purchase Order <strong>{approvalTargetPO?.id}</strong>. Please enter an explanation for approving or rejecting this cost or quantity exception into the audit ledger.
          </p>

          <div className="ui-form-group">
            <label className="ui-label">
              Admin Approval / Rejection Justification <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <textarea
              className="ui-input ui-textarea"
              rows={3}
              placeholder="e.g. Price escalation verified from multiple vendors; critical for substation commissioning."
              value={approvalReason}
              onChange={(e) => setApprovalReason(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button
              variant="secondary"
              onClick={() => {
                setIsApproveModalOpen(false);
                setApprovalTargetPO(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={<XCircle size={16} />}
              onClick={handleRejectPO}
            >
              Reject PO Exception
            </Button>
            <Button variant="accent" icon={<CheckCircle2 size={16} />} onClick={handleApprovePO}>
              Approve Limit Exception
            </Button>
          </div>
        </div>
      </Modal>

      {/* REQUISITION INDENT LOGISTICS MODALS */}
      <DispatchIndentModal
        isOpen={isIndentDispatchModalOpen}
        onClose={() => {
          setIsIndentDispatchModalOpen(false);
          setDispatchingIndent(null);
        }}
        indent={dispatchingIndent}
        onDispatched={loadData}
      />

      <ReceiveIndentModal
        isOpen={isIndentReceiveModalOpen}
        onClose={() => {
          setIsIndentReceiveModalOpen(false);
          setReceivingIndent(null);
        }}
        indent={receivingIndent}
        onReceived={loadData}
      />

      <IndentProofModal
        isOpen={isIndentProofModalOpen}
        onClose={() => {
          setIsIndentProofModalOpen(false);
          setViewingProofIndent(null);
        }}
        indent={viewingProofIndent}
      />

      {/* Material Mapping & Multiplier Detail Modal */}
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
  );
};
