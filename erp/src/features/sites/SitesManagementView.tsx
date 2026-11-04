import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Users, 
  Boxes, 
  FileSpreadsheet, 
  CheckSquare, 
  AlertTriangle, 
  Plus, 
  Search, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  Clock, 
  Camera, 
  ArrowUpRight, 
  Briefcase,
  ShieldCheck,
  Send,
  UserCheck,
  PackageCheck,
  Filter,
  Eye,
  XCircle,
  FileText,
  Layers,
  Calendar
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ERPService } from '../../services/erpStorage';
import { usePermissions } from '../../services/usePermissions';
import { 
  ClientSite, 
  Job, 
  StockLedgerItem, 
  MaterialRequest, 
  Employee, 
  AttendanceRecord,
  MeasurementUnit,
  AVAILABLE_UNITS,
  PurchaseOrder,
  SiteTask,
  ItemMaster
} from '../../types';
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
import { IssueSiteMaterialModal } from '../purchases/IssueSiteMaterialModal';
import { BillProofViewerModal } from '../purchases/BillProofViewerModal';
import { TaskBOQSplitModal } from '../tasks/TaskBOQSplitModal';
import { TaskAllocationModal } from '../tasks/TaskAllocationModal';
import { CreateTaskModal } from '../tasks/CreateTaskModal';
import { 
  DispatchIndentModal, 
  ReceiveIndentModal, 
  IndentProofModal, 
  SAMPLE_PROOF_DC 
} from './SiteIndentLogisticsModals';

type ActiveSiteTab = 'stocks' | 'requirements' | 'indents' | 'tasks' | 'jobs' | 'manpower';

export const SitesManagementView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser, hasPermission, isAdmin } = usePermissions();

  const [activeTab, setActiveTab] = useState<ActiveSiteTab>(
    (searchParams.get('tab') as ActiveSiteTab) || 'stocks'
  );

  const [sites, setSites] = useState<ClientSite[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(
    searchParams.get('siteId') || ''
  );

  const [jobs, setJobs] = useState<Job[]>([]);
  const [tasks, setTasks] = useState<SiteTask[]>([]);
  const [stockLedger, setStockLedger] = useState<StockLedgerItem[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);

  // Directory filter states
  const [siteSearch, setSiteSearch] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState('ALL');

  // Modals state
  const [isNewSiteModalOpen, setIsNewSiteModalOpen] = useState(false);
  const [isIndentModalOpen, setIsIndentModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedStockForIssue, setSelectedStockForIssue] = useState<StockLedgerItem | null>(null);

  const [isBillProofModalOpen, setIsBillProofModalOpen] = useState(false);
  const [targetPOForProof, setTargetPOForProof] = useState<PurchaseOrder | null>(null);

  // Task modals inside site view
  const [isBOQSplitModalOpen, setIsBOQSplitModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [selectedTaskForAllocation, setSelectedTaskForAllocation] = useState<SiteTask | undefined>(undefined);

  // New Site Form
  const [newSiteForm, setNewSiteForm] = useState({
    clientId: '',
    siteName: '',
    siteLocation: '',
    city: 'Chennai',
    siteEngineerName: 'Vignesh S',
    siteSupervisorName: 'Rajesh Verma',
    contactPhone: '+91 98401 22334',
  });

  // Logistics modals state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchingIndent, setDispatchingIndent] = useState<MaterialRequest | null>(null);

  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receivingIndent, setReceivingIndent] = useState<MaterialRequest | null>(null);

  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [viewingProofIndent, setViewingProofIndent] = useState<MaterialRequest | null>(null);

  // Material Indent Form (Site request to Warehouse or Admin)
  const [indentForm, setIndentForm] = useState({
    jobId: '',
    targetDestination: 'Warehouse' as 'Warehouse' | 'Admin',
    siteEngineerName: '',
    itemId: '',
    itemName: '',
    specification: '',
    unit: 'Mtr' as MeasurementUnit,
    requestedQty: '',
    urgency: 'Normal' as 'Normal' | 'High' | 'Critical',
    neededByDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    taskTitle: '',
    reason: '',
  });

  const loadData = () => {
    const allSites = ERPService.getClientSites();
    setSites(allSites);

    // Keep URL siteId in sync if provided
    const urlSiteId = searchParams.get('siteId');
    if (urlSiteId && allSites.some((s) => s.id === urlSiteId)) {
      setSelectedSiteId(urlSiteId);
    } else if (!urlSiteId) {
      setSelectedSiteId('');
    }

    setJobs(ERPService.getJobs());
    setTasks(ERPService.getTasks());
    setStockLedger(ERPService.getStockLedger());
    setMaterialRequests(ERPService.getMaterialRequests());
    setEmployees(ERPService.getEmployees());
    setAttendance(ERPService.getAttendance());
    setPurchases(ERPService.getPurchases());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('apex_storage_update', loadData);
    return () => window.removeEventListener('apex_storage_update', loadData);
  }, []);

  const handleSelectSite = (siteId: string) => {
    setSelectedSiteId(siteId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('siteId', siteId);
      return next;
    });
  };

  const handleBackToList = () => {
    setSelectedSiteId('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('siteId');
      return next;
    });
  };

  const currentSite = useMemo(() => {
    if (!selectedSiteId) return null;
    return sites.find((s) => s.id === selectedSiteId) || null;
  }, [sites, selectedSiteId]);

  // Jobs mapped to current site
  const mappedJobs = useMemo(() => {
    if (!currentSite) return [];
    return ERPService.getJobsForSite(currentSite.id);
  }, [currentSite, jobs]);

  // Tasks mapped to current site
  const siteTasks = useMemo(() => {
    if (!currentSite) return [];
    const jobIds = mappedJobs.map((j) => j.id);
    return tasks.filter((t) => t.siteId === currentSite.id || jobIds.includes(t.jobId));
  }, [currentSite, tasks, mappedJobs]);

  // Stocks physically at this site
  const siteStocks = useMemo(() => {
    if (!currentSite) return [];
    return ERPService.getSiteStocksForSite(currentSite.id);
  }, [currentSite, stockLedger, purchases]);

  // Material Indents raised for this site
  const siteIndents = useMemo(() => {
    if (!currentSite) return [];
    const mappedJobIds = mappedJobs.map((j) => j.id);
    return materialRequests.filter(
      (r) => r.siteId === currentSite.id || mappedJobIds.includes(r.jobId)
    );
  }, [currentSite, mappedJobs, materialRequests]);

  // Material Requirements comparison across mapped jobs
  const materialRequirements = useMemo(() => {
    if (!currentSite) return [];
    const itemsMap: Record<string, {
      itemId?: string;
      name: string;
      specification: string;
      unit: MeasurementUnit;
      targetBOQQty: number;
      inwardedQty: number;
      issuedQty: number;
      balanceNeeded: number;
    }> = {};

    mappedJobs.forEach((job) => {
      const procItems = ERPService.getJobProcurementItems(job.id);
      procItems.forEach((pi) => {
        const key = (pi.name || '').trim().toLowerCase();
        if (!key) return;
        if (!itemsMap[key]) {
          itemsMap[key] = {
            itemId: pi.itemId,
            name: pi.name,
            specification: pi.specification || '',
            unit: pi.unit,
            targetBOQQty: 0,
            inwardedQty: 0,
            issuedQty: 0,
            balanceNeeded: 0,
          };
        }
        if (pi.itemId) itemsMap[key].itemId = pi.itemId;
        itemsMap[key].targetBOQQty += pi.targetQty;
      });
    });

    // Cross-reference with physical site stocks
    siteStocks.forEach((stk) => {
      const key = (stk.itemName || '').trim().toLowerCase();
      if (!itemsMap[key]) {
        itemsMap[key] = {
          itemId: stk.itemId,
          name: stk.itemName,
          specification: stk.specification || '',
          unit: stk.unit,
          targetBOQQty: 0,
          inwardedQty: stk.receivedQty,
          issuedQty: stk.issuedQty,
          balanceNeeded: 0,
        };
      } else {
        if (stk.itemId) itemsMap[key].itemId = stk.itemId;
        itemsMap[key].inwardedQty += stk.receivedQty;
        itemsMap[key].issuedQty += stk.issuedQty;
      }
    });

    return Object.values(itemsMap).map((m) => ({
      ...m,
      balanceNeeded: Math.max(0, m.targetBOQQty - m.inwardedQty),
    }));
  }, [currentSite, mappedJobs, siteStocks]);

  // Handle register new site
  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteForm.siteName.trim() || !newSiteForm.siteLocation.trim()) {
      showToast('Validation Error', 'Please enter Site Name and Physical Location.', 'danger');
      return;
    }

    const clients = ERPService.getClients();
    const client = clients.find((c) => c.id === newSiteForm.clientId) || clients[0];

    const created = ERPService.addClientSite({
      clientId: client ? client.id : 'cli-1',
      clientName: client ? client.companyName : 'Registered Client',
      siteName: newSiteForm.siteName.trim(),
      siteLocation: newSiteForm.siteLocation.trim(),
      city: newSiteForm.city || 'Chennai',
      siteEngineerName: newSiteForm.siteEngineerName,
      siteSupervisorName: newSiteForm.siteSupervisorName,
      contactPhone: newSiteForm.contactPhone,
    });

    showToast('Site Registered', `"${created.siteName}" was registered successfully.`, 'success');
    setSelectedSiteId(created.id);
    setIsNewSiteModalOpen(false);
    setNewSiteForm({
      clientId: '',
      siteName: '',
      siteLocation: '',
      city: 'Chennai',
      siteEngineerName: 'Vignesh S',
      siteSupervisorName: 'Rajesh Verma',
      contactPhone: '+91 98401 22334',
    });
  };

  // Handle submit Site Material Indent (Site Head to Admin)
  const handleSubmitIndent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSite) return;
    const targetJobId = indentForm.jobId || mappedJobs[0]?.id || 'GENERAL';
    const targetJob = mappedJobs.find((j) => j.id === targetJobId);

    const qty = parseFloat(indentForm.requestedQty) || 0;
    if (qty <= 0) {
      showToast('Quantity Required', 'Please enter a valid requested quantity > 0.', 'danger');
      return;
    }
    if (!indentForm.itemName.trim()) {
      showToast('Item Name Required', 'Please enter the material name.', 'danger');
      return;
    }

    const engName = indentForm.siteEngineerName.trim() || currentSite.siteEngineerName || currentUser.name;

    ERPService.createSiteMaterialIndent({
      siteId: currentSite.id,
      siteName: currentSite.siteName,
      jobId: targetJobId,
      jobTitle: targetJob?.title,
      targetDestination: indentForm.targetDestination,
      siteEngineerName: engName,
      itemId: indentForm.itemId || undefined,
      itemName: indentForm.itemName.trim(),
      specification: indentForm.specification.trim(),
      unit: indentForm.unit,
      requestedQty: qty,
      urgency: indentForm.urgency,
      neededByDate: indentForm.neededByDate,
      taskTitle: indentForm.taskTitle.trim() || undefined,
      reason: indentForm.reason.trim() || `Material requisition for ${currentSite.siteName} installation`,
    });

    showToast(
      'Requisition Submitted',
      `Material indent for ${qty} ${indentForm.unit} of "${indentForm.itemName}" routed to ${indentForm.targetDestination === 'Warehouse' ? 'Central Warehouse' : 'Admin & Procurement'}.`,
      'success'
    );
    setIsIndentModalOpen(false);
    setIndentForm({
      jobId: '',
      targetDestination: 'Warehouse',
      siteEngineerName: '',
      itemId: '',
      itemName: '',
      specification: '',
      unit: 'Mtr',
      requestedQty: '',
      urgency: 'Normal',
      neededByDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      taskTitle: '',
      reason: '',
    });
  };

  // Move indent to purchase order
  const handleMoveToPurchase = (req: MaterialRequest) => {
    ERPService.moveSiteIndentToPurchase(req.id, `Transferred to Purchase by ${currentUser.name}`);
    showToast('Moved to Purchase', `Indent ${req.id} moved to Purchase. Opening PO configurator...`, 'success');
    navigate(`/purchases?tab=orders&create=true&jobId=${req.jobId}&indentId=${req.id}`);
  };

  // Dispatch from central warehouse directly to site (Opens rich logistics modal)
  const handleDispatchFromWarehouse = (req: MaterialRequest) => {
    setDispatchingIndent(req);
    setIsDispatchModalOpen(true);
  };

  // Site Engineer acknowledge receipt into site store (Opens rich proof attachment modal)
  const handleAcknowledgeReceipt = (req: MaterialRequest) => {
    setReceivingIndent(req);
    setIsReceiveModalOpen(true);
  };

  // View attached delivery proof photo modal
  const handleViewProof = (req: MaterialRequest) => {
    setViewingProofIndent(req);
    setIsProofModalOpen(true);
  };

  // Handle Admin approval of indent
  const handleApproveIndent = (req: MaterialRequest) => {
    ERPService.approveSiteMaterialIndent(req.id, `Approved by Admin ${currentUser.name} for site procurement.`);
    showToast('Indent Approved', `Material Indent ${req.id} approved. You can now raise a PO to vendor.`, 'success');
  };

  // Handle Admin rejection of indent
  const handleRejectIndent = (req: MaterialRequest) => {
    const reason = prompt('Please provide reason for rejecting this material indent:');
    if (!reason) return;
    ERPService.rejectSiteMaterialIndent(req.id, reason);
    showToast('Indent Rejected', `Material Indent ${req.id} was rejected.`, 'danger');
  };

  const clients = ERPService.getClients();

  const filteredSites = useMemo(() => {
    return sites.filter((s) => {
      if (selectedCityFilter !== 'ALL' && s.city !== selectedCityFilter) return false;
      if (siteSearch.trim()) {
        const q = siteSearch.toLowerCase();
        const mName = s.siteName.toLowerCase().includes(q);
        const mClient = s.clientName.toLowerCase().includes(q);
        const mLoc = (s.siteLocation || '').toLowerCase().includes(q);
        const mEng = (s.siteEngineerName || '').toLowerCase().includes(q);
        const mSup = (s.siteSupervisorName || '').toLowerCase().includes(q);
        if (!mName && !mClient && !mLoc && !mEng && !mSup) return false;
      }
      return true;
    });
  }, [sites, selectedCityFilter, siteSearch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. SITES DIRECTORY (FIRST SHOW LIST OF SITES) */}
      {!currentSite ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Page Header */}
          <PageHeader
            title="Project Sites & Workspaces Hub"
            subtitle="Browse project sites, live on-site material inventories, workforce manpower, pending material demands, and site execution."
            icon={<Building2 size={22} />}
            actions={
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {hasPermission('sites.create_site') && (
                  <Button
                    variant="primary"
                    icon={<Plus size={16} />}
                    onClick={() => setIsNewSiteModalOpen(true)}
                  >
                    + Register New Project Site
                  </Button>
                )}
              </div>
            }
          />

          {/* Key Metrics across all Sites */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 'var(--space-4)' }}>
            <div className="ui-card" style={{ padding: 16, borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Total Project Sites
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                {sites.length}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                Across {Array.from(new Set(sites.map((s) => s.city).filter(Boolean))).length || 1} cities
              </div>
            </div>

            <div className="ui-card" style={{ padding: 16, borderLeft: '4px solid #0284c7' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Active Jobs Mapped
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', marginTop: 4 }}>
                {jobs.length}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                Current contracts in progress
              </div>
            </div>

            <div className="ui-card" style={{ padding: 16, borderLeft: '4px solid #16a34a' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Live On-Site SKUs
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
                {stockLedger.length}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                Materials at physical site stores
              </div>
            </div>

            <div className="ui-card" style={{ padding: 16, borderLeft: '4px solid #e11d48' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Pending Indents
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#e11d48', marginTop: 4 }}>
                {materialRequests.filter((r) => r.status === 'Pending').length}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                Site requisitions awaiting approval
              </div>
            </div>

            <div className="ui-card" style={{ padding: 16, borderLeft: '4px solid #7c3aed' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Active Site Tasks
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed', marginTop: 4 }}>
                {tasks.length}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                Work packages & BOQ splits
              </div>
            </div>
          </div>

          {/* Search & City Filter Bar */}
          <div
            className="ui-card"
            style={{
              padding: '14px 18px',
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
              <div style={{ minWidth: 280, flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  className="ui-input"
                  placeholder="Search project sites by name, client, address, engineer..."
                  value={siteSearch}
                  onChange={(e) => setSiteSearch(e.target.value)}
                  style={{ width: '100%', height: 38, paddingLeft: 34, fontSize: '0.86rem' }}
                />
                <Search
                  size={16}
                  color="#94a3b8"
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>

              {/* City Filter Pills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>City:</span>
                {['ALL', ...Array.from(new Set(sites.map((s) => s.city).filter((c): c is string => Boolean(c))))].map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCityFilter(city)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 16,
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      border: selectedCityFilter === city ? '1px solid var(--color-primary)' : '1px solid #e2e8f0',
                      backgroundColor: selectedCityFilter === city ? 'var(--color-primary)' : '#f8fafc',
                      color: selectedCityFilter === city ? '#ffffff' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {city === 'ALL' ? 'All Locations' : city}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 600 }}>
              Showing {filteredSites.length} of {sites.length} sites (Click a site to view details)
            </div>
          </div>

          {/* Sites Grid */}
          {filteredSites.length === 0 ? (
            <div
              className="ui-card"
              style={{
                padding: '48px 20px',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                borderRadius: 8,
              }}
            >
              <Building2 size={44} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                No project sites found
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>
                Try adjusting your search or register a new client site.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              {filteredSites.map((site) => {
                const sJobs = ERPService.getJobsForSite(site.id);
                const sStocks = ERPService.getSiteStocksForSite(site.id);
                const sTasks = tasks.filter((t) => t.siteId === site.id || sJobs.some((j) => j.id === t.jobId));
                const sIndents = materialRequests.filter((r) => r.siteId === site.id || sJobs.some((j) => j.id === r.jobId));
                const sPendingIndents = sIndents.filter((i) => i.status === 'Pending').length;

                return (
                  <div
                    key={site.id}
                    className="ui-card"
                    style={{
                      padding: '18px 20px',
                      backgroundColor: '#ffffff',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                    }}
                    onClick={() => handleSelectSite(site.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              backgroundColor: '#eff6ff',
                              color: 'var(--color-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              border: '1px solid #bfdbfe',
                            }}
                          >
                            <Building2 size={22} />
                          </div>
                          <div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                              {site.siteName}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 1 }}>
                              Client: <strong style={{ color: '#334155' }}>{site.clientName}</strong>
                            </div>
                          </div>
                        </div>

                        {site.city && (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 12,
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                            }}
                          >
                            📍 {site.city}
                          </span>
                        )}
                      </div>

                      {/* Location */}
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.4 }}>
                        <MapPin size={14} style={{ flexShrink: 0, marginTop: 2, color: '#94a3b8' }} />
                        <span>{site.siteLocation || 'Location details on file'}</span>
                      </div>

                      {/* Key Personnel */}
                      <div
                        style={{
                          marginTop: 12,
                          padding: '10px 12px',
                          backgroundColor: '#f8fafc',
                          borderRadius: 6,
                          fontSize: '0.8rem',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 8,
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                            Site Engineer
                          </span>
                          <strong style={{ color: '#0f172a' }}>{site.siteEngineerName || 'Vignesh S'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                            Supervisor
                          </span>
                          <strong style={{ color: '#0f172a' }}>{site.siteSupervisorName || 'Rajesh Verma'}</strong>
                        </div>
                      </div>

                      {/* Stats Badges */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 12 }}>
                        <div style={{ textAlign: 'center', padding: '6px 4px', backgroundColor: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#166534' }}>{sJobs.length}</div>
                          <div style={{ fontSize: '0.68rem', color: '#166534', fontWeight: 700 }}>Jobs</div>
                        </div>

                        <div style={{ textAlign: 'center', padding: '6px 4px', backgroundColor: '#eff6ff', borderRadius: 6, border: '1px solid #bfdbfe' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1d4ed8' }}>{sStocks.length}</div>
                          <div style={{ fontSize: '0.68rem', color: '#1d4ed8', fontWeight: 700 }}>SKUs</div>
                        </div>

                        <div style={{ textAlign: 'center', padding: '6px 4px', backgroundColor: '#faf5ff', borderRadius: 6, border: '1px solid #e9d5ff' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#7e22ce' }}>{sTasks.length}</div>
                          <div style={{ fontSize: '0.68rem', color: '#7e22ce', fontWeight: 700 }}>Tasks</div>
                        </div>

                        <div
                          style={{
                            textAlign: 'center',
                            padding: '6px 4px',
                            backgroundColor: sPendingIndents > 0 ? '#fee2e2' : '#f1f5f9',
                            borderRadius: 6,
                            border: sPendingIndents > 0 ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                          }}
                        >
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: sPendingIndents > 0 ? '#991b1b' : '#64748b' }}>
                            {sIndents.length}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: sPendingIndents > 0 ? '#991b1b' : '#64748b', fontWeight: 700 }}>
                            {sPendingIndents > 0 ? `${sPendingIndents} Due` : 'Indents'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div
                      style={{
                        marginTop: 14,
                        paddingTop: 12,
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        📞 {site.contactPhone || '+91 98401 22334'}
                      </span>
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<ArrowRight size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSite(site.id);
                        }}
                      >
                        Open Site Details →
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* 2. SITE DETAILS & WORKSPACE VIEW (WHEN A SITE IS CLICKED) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Top Navigation Bar: Back Button, Switcher, and Quick Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <Button
              variant="secondary"
              icon={<ArrowLeft size={16} />}
              onClick={handleBackToList}
              style={{ fontWeight: 800 }}
            >
              ← Back to Sites List
            </Button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#64748b' }}>
                Switch Site:
              </span>
              <select
                className="ui-select"
                value={selectedSiteId}
                onChange={(e) => handleSelectSite(e.target.value)}
                style={{ height: 38, fontWeight: 700, fontSize: '0.86rem', minWidth: 260 }}
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.siteName} • {s.clientName} ({s.city || 'Site'})
                  </option>
                ))}
              </select>

              {hasPermission('sites.create_site') && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Plus size={14} />}
                  onClick={() => setIsNewSiteModalOpen(true)}
                >
                  + New Site
                </Button>
              )}

              {hasPermission('sites.raise_indent') && (
                <Button
                  size="sm"
                  variant="accent"
                  icon={<Send size={14} />}
                  onClick={() => {
                    setIndentForm((prev) => ({
                      ...prev,
                      jobId: mappedJobs[0]?.id || '',
                    }));
                    setIsIndentModalOpen(true);
                  }}
                >
                  📝 Raise Material Indent
                </Button>
              )}
            </div>
          </div>

          {/* Selected Site Profile Overview Banner */}
          <div
            className="ui-card"
            style={{
              padding: '16px 20px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MapPin size={24} />
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  {currentSite.siteName}
                </div>
                <div style={{ fontSize: '0.84rem', color: '#475569', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span>📍 {currentSite.siteLocation}</span>
                  <span>•</span>
                  <span>🏢 Client: <strong>{currentSite.clientName}</strong></span>
                  {currentSite.city && (
                    <>
                      <span>•</span>
                      <span style={{ padding: '1px 8px', borderRadius: 10, backgroundColor: '#e2e8f0', color: '#334155', fontSize: '0.74rem', fontWeight: 700 }}>
                        {currentSite.city}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.82rem', color: '#334155', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Site Head / Engineer
                </span>
                <strong>{currentSite.siteEngineerName || 'Vignesh S'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Site Supervisor
                </span>
                <strong>{currentSite.siteSupervisorName || 'Rajesh Verma'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Active Jobs Bound
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 12,
                    backgroundColor: mappedJobs.length > 0 ? '#dcfce7' : '#fee2e2',
                    color: mappedJobs.length > 0 ? '#166534' : '#991b1b',
                    fontWeight: 800,
                  }}
                >
                  {mappedJobs.length} Projects Active
                </span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                icon={<Briefcase size={14} />}
                onClick={() => navigate(`/jobs?create=true&clientId=${currentSite.clientId}`)}
              >
                + Map Job
              </Button>
            </div>
          </div>

          {/* SIX CORE TABS FOR SITE MANAGEMENT */}
          <div
            style={{
              display: 'flex',
              borderBottom: '2px solid var(--border-light)',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('stocks')}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderBottom: activeTab === 'stocks' ? '3px solid var(--color-primary)' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === 'stocks' ? 'var(--color-primary)' : 'var(--color-gray-600)',
                fontWeight: activeTab === 'stocks' ? 800 : 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Boxes size={18} />
              <span>1. Live On-Site Stocks</span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.72rem',
                  backgroundColor: siteStocks.length > 0 ? '#dcfce7' : '#f1f5f9',
                  color: siteStocks.length > 0 ? '#166534' : '#64748b',
                  fontWeight: 800,
                }}
              >
                {siteStocks.length} SKUs
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('requirements')}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderBottom: activeTab === 'requirements' ? '3px solid var(--color-primary)' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === 'requirements' ? 'var(--color-primary)' : 'var(--color-gray-600)',
                fontWeight: activeTab === 'requirements' ? 800 : 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <FileSpreadsheet size={18} />
              <span>2. Material Demand & Shortages</span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.72rem',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  fontWeight: 800,
                }}
              >
                {materialRequirements.filter((m) => m.balanceNeeded > 0).length} Pending
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('indents')}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderBottom: activeTab === 'indents' ? '3px solid var(--color-primary)' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === 'indents' ? 'var(--color-primary)' : 'var(--color-gray-600)',
                fontWeight: activeTab === 'indents' ? 800 : 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Send size={18} />
              <span>3. Material Indents</span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.72rem',
                  backgroundColor: siteIndents.filter((i) => i.status === 'Pending').length > 0 ? '#fee2e2' : '#e0e7ff',
                  color: siteIndents.filter((i) => i.status === 'Pending').length > 0 ? '#991b1b' : '#3730a3',
                  fontWeight: 800,
                }}
              >
                {siteIndents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderBottom: activeTab === 'tasks' ? '3px solid var(--color-primary)' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === 'tasks' ? 'var(--color-primary)' : 'var(--color-gray-600)',
                fontWeight: activeTab === 'tasks' ? 800 : 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckSquare size={18} />
              <span>4. Site Tasks & Execution</span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.72rem',
                  backgroundColor: siteTasks.length > 0 ? '#dcfce7' : '#f1f5f9',
                  color: siteTasks.length > 0 ? '#166534' : '#64748b',
                  fontWeight: 800,
                }}
              >
                {siteTasks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('jobs')}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderBottom: activeTab === 'jobs' ? '3px solid var(--color-primary)' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === 'jobs' ? 'var(--color-primary)' : 'var(--color-gray-600)',
                fontWeight: activeTab === 'jobs' ? 800 : 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Briefcase size={18} />
              <span>5. Mapped Project Jobs ({mappedJobs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manpower')}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderBottom: activeTab === 'manpower' ? '3px solid var(--color-primary)' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === 'manpower' ? 'var(--color-primary)' : 'var(--color-gray-600)',
                fontWeight: activeTab === 'manpower' ? 800 : 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Users size={18} />
              <span>6. Site Workforce Crew</span>
            </button>
          </div>

      {/* TAB 1: LIVE ON-SITE STOCKS LEDGER */}
      {activeTab === 'stocks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.84rem',
              color: '#166534',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} color="#16a34a" />
              <span>
                Verified site inventory for <strong>{currentSite?.siteName}</strong>. Every item below has been delivered to site with vendor bill photo proof.
              </span>
            </div>
            <Button
              size="sm"
              variant="accent"
              icon={<Send size={14} />}
              onClick={() => setIsIndentModalOpen(true)}
            >
              + Need More Stock (Raise Indent)
            </Button>
          </div>

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
                    <th style={{ padding: '12px 14px' }}>Material Name & Spec</th>
                    <th style={{ padding: '12px 14px' }}>Job Spine Ref</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Received</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Issued</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Available at Site</th>
                    <th style={{ padding: '12px 14px' }}>Unit</th>
                    <th style={{ padding: '12px 14px' }}>Inward Bill Ref</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Bill Proof</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {siteStocks.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                          <Boxes size={36} color="#94a3b8" />
                          <div style={{ fontWeight: 700, fontSize: '0.96rem', color: '#334155' }}>
                            No Stocks Currently Stationed at {currentSite?.siteName}
                          </div>
                          <div style={{ fontSize: '0.82rem', maxWidth: 440 }}>
                            Materials will appear here automatically when Purchase Orders are received and moved to this site store with vendor bill photo proof.
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    siteStocks.map((stock, idx) => {
                      const isAvailable = (stock.stockOnSite || 0) > 0;
                      const linkedPO = purchases.find((p) => p.id === stock.lastPoId);
                      const billImg = stock.billPhotoUrl || linkedPO?.billPhotoUrl;

                      return (
                        <tr
                          key={stock.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                          }}
                        >
                          <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>
                            {idx + 1}
                          </td>
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
                                }}
                              >
                                {stock.jobId}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.76rem' }}>General Store</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#334155' }}>
                            {stock.receivedQty}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: stock.issuedQty > 0 ? '#d97706' : '#94a3b8' }}>
                            {stock.issuedQty || 0}
                          </td>
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
                          <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>
                            {stock.unit}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {stock.lastBillNumber && (
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
                                Bill #{stock.lastBillNumber}
                              </div>
                            )}
                            {stock.lastPoId && (
                              <div style={{ fontSize: '0.74rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                {stock.lastPoId}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            {billImg ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (linkedPO) {
                                    setTargetPOForProof(linkedPO);
                                    setIsBillProofModalOpen(true);
                                  } else {
                                    setTargetPOForProof({
                                      id: stock.lastPoId || 'PO-DELIVERED',
                                      jobId: stock.jobId || 'GENERAL',
                                      vendorId: 'v-1',
                                      vendorName: stock.locationName,
                                      status: 'Delivered',
                                      date: stock.lastUpdated,
                                      billNumber: stock.lastBillNumber,
                                      billPhotoUrl: billImg,
                                      receivedDestination: stock.locationName,
                                      jobTitle: stock.locationName || 'Site Store',
                                      deliveryLocation: stock.locationName,
                                      costType: 'Material',
                                      approvalTriggered: false,
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
                              >
                                <Camera size={13} color="#2563eb" />
                                <span>Proof</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>-</span>
                            )}
                          </td>
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

      {/* TAB 2: MATERIAL DEMAND & SHORTAGES */}
      {activeTab === 'requirements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 6,
              fontSize: '0.84rem',
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>
              Aggregating BOQ target specifications from all <strong>{mappedJobs.length} active jobs</strong> at {currentSite?.siteName}. Shows what has arrived vs balance needed.
            </span>
          </div>

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
                    <th style={{ padding: '12px 14px' }}>Material / Product Name</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total BOQ Target</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Inwarded on Site</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Consumed in Work</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Balance Needed</th>
                    <th style={{ padding: '12px 14px' }}>Unit</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Site Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {materialRequirements.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>
                        No material requirements found for this site.
                      </td>
                    </tr>
                  ) : (
                    materialRequirements.map((mat, idx) => {
                      const isFulfilled = mat.inwardedQty >= mat.targetBOQQty && mat.targetBOQQty > 0;
                      const hasShortage = mat.balanceNeeded > 0;

                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                          }}
                        >
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{mat.name}</div>
                            {mat.specification && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{mat.specification}</div>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>
                            {mat.targetBOQQty}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                            {mat.inwardedQty}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#d97706' }}>
                            {mat.issuedQty}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: hasShortage ? '#dc2626' : '#16a34a' }}>
                            {mat.balanceNeeded}
                          </td>
                          <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.82rem' }}>
                            {mat.unit}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            {isFulfilled ? (
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  backgroundColor: '#dcfce7',
                                  color: '#166534',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                }}
                              >
                                Fully Supplied
                              </span>
                            ) : mat.inwardedQty > 0 ? (
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  backgroundColor: '#fef3c7',
                                  color: '#92400e',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                }}
                              >
                                Partial on Site
                              </span>
                            ) : (
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  backgroundColor: '#fee2e2',
                                  color: '#991b1b',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                }}
                              >
                                Zero on Site
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <Button
                              size="sm"
                              variant={hasShortage ? 'accent' : 'secondary'}
                              icon={<Send size={12} />}
                              onClick={() => {
                                setIndentForm({
                                  jobId: mappedJobs[0]?.id || '',
                                  targetDestination: 'Warehouse',
                                  siteEngineerName: currentSite?.siteEngineerName || '',
                                  itemId: mat.itemId || '',
                                  itemName: mat.name,
                                  specification: mat.specification,
                                  unit: mat.unit,
                                  requestedQty: String(mat.balanceNeeded || 10),
                                  urgency: hasShortage ? 'High' : 'Normal',
                                  neededByDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
                                  taskTitle: '',
                                  reason: `Procure remaining balance (${mat.balanceNeeded} ${mat.unit}) for project execution at ${currentSite?.siteName}`,
                                });
                                setIsIndentModalOpen(true);
                              }}
                            >
                              Indent
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

      {/* TAB 3: SITE MATERIAL INDENTS (SITE HEAD REQUEST -> ADMIN APPROVAL FLOW) */}
      {activeTab === 'indents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 6,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 800, color: '#1e40af', fontSize: '0.94rem' }}>
                Site Material Requisitions & Indent Approvals
              </div>
              <div style={{ fontSize: '0.8rem', color: '#3b82f6', marginTop: 2 }}>
                Site Head / Supervisor submits material indents. Requests route directly to Admin for approval before purchase orders are issued.
              </div>
            </div>

            <Button
              variant="accent"
              icon={<Plus size={16} />}
              onClick={() => {
                setIndentForm((prev) => ({ ...prev, jobId: mappedJobs[0]?.id || '' }));
                setIsIndentModalOpen(true);
              }}
            >
              + Raise New Site Indent
            </Button>
          </div>

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
                    <th style={{ padding: '12px 14px' }}>Request ID</th>
                    <th style={{ padding: '12px 14px' }}>Job Spine</th>
                    <th style={{ padding: '12px 14px' }}>Requested Material</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Quantity</th>
                    <th style={{ padding: '12px 14px' }}>Route & Engineer</th>
                    <th style={{ padding: '12px 14px' }}>Urgency</th>
                    <th style={{ padding: '12px 14px' }}>Required By</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Actions & Workflow</th>
                  </tr>
                </thead>
                <tbody>
                  {siteIndents.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                        No material indents submitted yet for this site. Click <strong>+ Raise New Site Indent</strong> to request supplies.
                      </td>
                    </tr>
                  ) : (
                    siteIndents.map((indent) => {
                      const isPending = indent.status === 'Pending';
                      const isApproved = indent.status === 'Approved';

                      return (
                        <tr
                          key={indent.id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          <td style={{ padding: '12px 14px', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                            {indent.id}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 4,
                                backgroundColor: '#eff6ff',
                                color: 'var(--color-primary)',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                              }}
                            >
                              {indent.jobId}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{indent.itemName}</div>
                            {indent.specification && (
                              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{indent.specification}</div>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#0284c7' }}>
                            {indent.requestedExtraQty} {indent.unit}
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
                                  backgroundColor: indent.targetDestination === 'Admin' ? '#f5f3ff' : '#eff6ff',
                                  color: indent.targetDestination === 'Admin' ? '#6d28d9' : '#0369a1',
                                  border: indent.targetDestination === 'Admin' ? '1px solid #ddd6fe' : '1px solid #bae6fd',
                                }}
                              >
                                {indent.targetDestination === 'Admin' ? '🏢 To Admin' : '🏬 To Warehouse'}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
                                👷 {indent.siteEngineerName || 'Site Staff'}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                backgroundColor: indent.urgency === 'Critical' ? '#fee2e2' : indent.urgency === 'High' ? '#fef3c7' : '#f1f5f9',
                                color: indent.urgency === 'Critical' ? '#991b1b' : indent.urgency === 'High' ? '#92400e' : '#475569',
                              }}
                            >
                              {indent.urgency || 'Normal'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.78rem' }}>
                            {indent.neededByDate || 'ASAP'}
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
                                    indent.status === 'Pending'
                                      ? '#fef3c7'
                                      : indent.status === 'Approved'
                                      ? '#dcfce7'
                                      : indent.status === 'Moved to Purchase'
                                      ? '#e0e7ff'
                                      : indent.status === 'PO Issued'
                                      ? '#dbeafe'
                                      : indent.status === 'Delivered to Site'
                                      ? '#fef9c3'
                                      : indent.status === 'Received by Site Engineer'
                                      ? '#ecfdf5'
                                      : indent.status === 'Dispatched from Warehouse'
                                      ? '#e0f2fe'
                                      : '#fee2e2',
                                  color:
                                    indent.status === 'Pending'
                                      ? '#92400e'
                                      : indent.status === 'Approved'
                                      ? '#166534'
                                      : indent.status === 'Moved to Purchase'
                                      ? '#3730a3'
                                      : indent.status === 'PO Issued'
                                      ? '#1e40af'
                                      : indent.status === 'Delivered to Site'
                                      ? '#854d0e'
                                      : indent.status === 'Received by Site Engineer'
                                      ? '#065f46'
                                      : indent.status === 'Dispatched from Warehouse'
                                      ? '#0369a1'
                                      : '#991b1b',
                                }}
                              >
                                {indent.status === 'Pending' ? (
                                  <Clock size={11} />
                                ) : indent.status === 'Received by Site Engineer' || indent.status === 'Approved' ? (
                                  <CheckCircle2 size={11} />
                                ) : (
                                  <PackageCheck size={11} />
                                )}
                                {indent.status}
                              </span>
                              {indent.status === 'Dispatched from Warehouse' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                                  <span style={{ fontSize: '0.68rem', color: '#0369a1', fontWeight: 700 }}>
                                    🚚 {indent.dispatchChallanNumber || 'DC-WH'} • {indent.vehicleNumber || 'Tempo'}
                                  </span>
                                  {indent.transportCost ? (
                                    <span style={{ fontSize: '0.66rem', color: '#b45309', fontWeight: 700 }}>
                                      Freight: ₹{indent.transportCost.toLocaleString('en-IN')}
                                    </span>
                                  ) : null}
                                </div>
                              )}
                              {indent.poTitle && (
                                <span style={{ fontSize: '0.68rem', color: '#1e40af', fontWeight: 700 }}>
                                  {indent.poTitle}
                                </span>
                              )}
                              {indent.receivedByEngineerName && (
                                <span style={{ fontSize: '0.68rem', color: '#065f46', fontWeight: 700 }}>
                                  ✓ In Site Store ({indent.receivedByEngineerName})
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
                                    onClick={() => handleMoveToPurchase(indent)}
                                    title="Move to Purchase and open Purchase Order"
                                  >
                                    Move to Purchase
                                  </Button>
                                  {indent.targetDestination === 'Warehouse' && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      icon={<Boxes size={12} />}
                                      onClick={() => handleDispatchFromWarehouse(indent)}
                                      title="Dispatch from Central Warehouse stock to site"
                                    >
                                      Dispatch WH
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleRejectIndent(indent)}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}

                              {(indent.status === 'Approved' || indent.status === 'Moved to Purchase') && (
                                <Button
                                  size="sm"
                                  variant="accent"
                                  icon={<ArrowRight size={13} />}
                                  onClick={() => {
                                    navigate(`/purchases?tab=orders&create=true&jobId=${indent.jobId}&indentId=${indent.id}`);
                                  }}
                                  title="Raise Purchase Order for this approved indent"
                                >
                                  Raise PO
                                </Button>
                              )}

                              {(indent.status === 'Delivered to Site' || indent.status === 'Dispatched from Warehouse') && (
                                <Button
                                  size="sm"
                                  variant="accent"
                                  icon={<CheckCircle2 size={13} />}
                                  onClick={() => handleAcknowledgeReceipt(indent)}
                                  title="Site Engineer acknowledges physical receipt with delivery proof photo"
                                >
                                  Receive into Site Store
                                </Button>
                              )}

                              {indent.status === 'PO Issued' && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  icon={<Eye size={12} />}
                                  onClick={() => navigate('/purchases?tab=orders')}
                                >
                                  Track PO
                                </Button>
                              )}

                              {indent.status === 'Received by Site Engineer' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 800 }}>
                                    ✓ Stock Available
                                  </span>
                                  {indent.deliveryProofPhotoUrl && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      icon={<Camera size={12} />}
                                      onClick={() => handleViewProof(indent)}
                                      title="View attached delivery proof photo"
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
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SITE TASKS & EXECUTION */}
      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.94rem' }}>
                Site Execution Tasks & Material Allocation
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                Tasks created specifically for <strong>{currentSite?.siteName}</strong>. Split tasks from contract BOQ packages (Transformers, DBs, Fans) or create site tasks with material allocations.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button
                size="sm"
                variant="secondary"
                icon={<Layers size={14} />}
                onClick={() => setIsBOQSplitModalOpen(true)}
                style={{ fontWeight: 700 }}
              >
                ⚡ Split Tasks from BOQ
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={<Plus size={14} />}
                onClick={() => setIsCreateTaskModalOpen(true)}
              >
                + Create Site Task
              </Button>
            </div>
          </div>

          {siteTasks.length === 0 ? (
            <div
              className="ui-card"
              style={{ padding: '36px 20px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: 8 }}
            >
              <CheckSquare size={40} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                No tasks created for this site yet
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: 4, maxWidth: 440, margin: '4px auto 14px' }}>
                Use "Split Tasks from BOQ" to generate work packages (Transformers, Cable Trays, Mancooler Fans) with line-item materials allocated from site inventory.
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <Button
                  variant="primary"
                  icon={<Layers size={14} />}
                  onClick={() => setIsBOQSplitModalOpen(true)}
                >
                  ⚡ Split Tasks from BOQ
                </Button>
                <Button
                  variant="secondary"
                  icon={<Plus size={14} />}
                  onClick={() => setIsCreateTaskModalOpen(true)}
                >
                  + Create Site Task
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {siteTasks.map((task) => {
                const pct = Math.round((task.completedQty / Math.max(1, task.targetQty)) * 100);
                const mats = task.allocatedMaterials || [];
                const members = task.memberAssignments || [];

                return (
                  <div
                    key={task.id}
                    className="ui-card"
                    style={{
                      padding: '16px 18px',
                      backgroundColor: '#ffffff',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.86rem' }}>
                            {task.jobId}
                          </span>
                          {task.boqSectionTitle && (
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 12,
                                fontSize: '0.72rem',
                                backgroundColor: '#eff6ff',
                                color: '#1e40af',
                                fontWeight: 800,
                              }}
                            >
                              BOQ: {task.boqSectionTitle}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: 2 }}>
                            {task.description}
                          </div>
                        )}
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
                          Supervisor: <strong>{task.assignedSupervisor}</strong> | Dates: {task.startDate} to {task.targetDate}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Badge status={task.status} />
                        <Button
                          size="sm"
                          variant="primary"
                          icon={<Boxes size={14} />}
                          onClick={() => {
                            setSelectedTaskForAllocation(task);
                            setIsAllocationModalOpen(true);
                          }}
                        >
                          Manage Materials & Workers →
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                        <span style={{ color: '#64748b' }}>
                          Completed: <strong>{task.completedQty}</strong> / {task.targetQty} {task.unit}
                        </span>
                        <span style={{ fontWeight: 800, color: pct >= 100 ? '#16a34a' : 'var(--color-primary)' }}>
                          {pct}%
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, pct)}%`,
                            height: '100%',
                            backgroundColor: pct >= 100 ? '#16a34a' : 'var(--color-primary)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Allocated Materials & Member schedule summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, marginTop: 12 }}>
                      <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: 6, fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                          📦 Allocated Site Materials ({mats.length}):
                        </div>
                        {mats.length === 0 ? (
                          <span style={{ color: '#94a3b8' }}>None allocated</span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {mats.map((m) => (
                              <span key={m.id} style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                {m.allocatedQty} {m.unit} {m.itemName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: 6, fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                          📅 Member Deployment ({members.length}):
                        </div>
                        {members.length === 0 ? (
                          <span style={{ color: '#94a3b8' }}>None scheduled</span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {members.map((m) => (
                              <span key={m.id} style={{ backgroundColor: '#fff', border: '1px solid #bbf7d0', color: '#166534', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                {m.assignedDate}: {m.memberName} ({m.role})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MAPPED JOBS */}
      {activeTab === 'jobs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
            {mappedJobs.length === 0 ? (
              <div className="ui-card" style={{ padding: 40, textAlign: 'center', gridColumn: '1 / -1' }}>
                <Briefcase size={36} color="#94a3b8" style={{ margin: '0 auto 10px auto' }} />
                <div style={{ fontWeight: 700, color: '#334155' }}>No Jobs Mapped to this Site Yet</div>
                <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: 4 }}>
                  Click <strong>+ Map New Job to this Site</strong> at the top to create a project spine bound to {currentSite?.siteName}.
                </div>
              </div>
            ) : (
              mappedJobs.map((job) => (
                <div
                  key={job.id}
                  className="ui-card"
                  style={{
                    padding: 18,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12,
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: 'var(--color-primary)',
                          fontFamily: 'var(--font-mono)',
                          padding: '2px 8px',
                          backgroundColor: '#eff6ff',
                          borderRadius: 4,
                        }}
                      >
                        {job.id}
                      </span>
                      <Badge status={job.status} />
                    </div>

                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                      {job.title}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Client: <strong>{job.clientName}</strong></span>
                    </div>

                    {job.scope && (
                      <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: 6, lineHeight: 1.4 }}>
                        {job.scope}
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Quoted Budget:</div>
                      <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                        ₹{job.quotedAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Open Job Spine <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SITE WORKFORCE & MANPOWER CREW */}
      {activeTab === 'manpower' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.94rem' }}>
                Site Manpower Roster & Engineering Officers
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                Personnel currently assigned to supervise, inspect materials, and execute electrical installations at {currentSite?.siteName}.
              </div>
            </div>

            <Button
              size="sm"
              variant="secondary"
              icon={<Users size={14} />}
              onClick={() => navigate('/employees')}
            >
              Manage Central Crew & Attendance
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {/* Site Engineer Card */}
            <div className="ui-card" style={{ padding: 16, border: '2px solid #0284c7', backgroundColor: '#f0f9ff', borderRadius: 8 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>
                Site In-Charge / Lead Engineer
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                {currentSite?.siteEngineerName || 'Vignesh S'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 4 }}>
                Authority: Material Verification, Physical Inspection, Indent Sign-off
              </div>
              <div style={{ fontSize: '0.78rem', color: '#0284c7', marginTop: 8, fontWeight: 700 }}>
                📞 {currentSite?.contactPhone || '+91 98401 22334'}
              </div>
            </div>

            {/* Site Supervisor Card */}
            <div className="ui-card" style={{ padding: 16, border: '1px solid #cbd5e1', backgroundColor: '#ffffff', borderRadius: 8 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                Site Supervisor / Store Custodian
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                {currentSite?.siteSupervisorName || 'Rajesh Verma'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 4 }}>
                Authority: Material Issuance to Electricians, Daily Labour Allocation
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 8, fontWeight: 700 }}>
                Status: Active on Site
              </div>
            </div>

            {/* Electricians & Crew */}
            {employees.slice(0, 4).map((emp) => (
              <div key={emp.id} className="ui-card" style={{ padding: 16, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{emp.role}</div>
                  <span style={{ padding: '2px 6px', borderRadius: 4, backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: 800 }}>
                    On Site Duty
                  </span>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  {emp.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>
                  Contact: {emp.phone}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </div>
      )}

      {/* MODAL 1: REGISTER NEW CLIENT SITE */}
      <Modal
        isOpen={isNewSiteModalOpen}
        onClose={() => setIsNewSiteModalOpen(false)}
        title="Register New Client Project Site"
      >
        <form onSubmit={handleCreateSite} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Select
            label="Client (from Client Master) *"
            options={[
              { value: '', label: '-- Select Client --' },
              ...clients.map((c) => ({ value: c.id, label: c.companyName })),
            ]}
            value={newSiteForm.clientId}
            onChange={(e) => setNewSiteForm({ ...newSiteForm, clientId: e.target.value })}
            required
          />

          <Input
            label="Site / Project Name *"
            placeholder="e.g. Apex High-Rise Residency Phase 1"
            value={newSiteForm.siteName}
            onChange={(e) => setNewSiteForm({ ...newSiteForm, siteName: e.target.value })}
            required
          />

          <Input
            label="Physical Location / Address *"
            placeholder="e.g. Plot 42, Guindy Estate, Chennai"
            value={newSiteForm.siteLocation}
            onChange={(e) => setNewSiteForm({ ...newSiteForm, siteLocation: e.target.value })}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="City"
              value={newSiteForm.city}
              onChange={(e) => setNewSiteForm({ ...newSiteForm, city: e.target.value })}
            />
            <Input
              label="Contact Phone"
              value={newSiteForm.contactPhone}
              onChange={(e) => setNewSiteForm({ ...newSiteForm, contactPhone: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Designated Site Engineer"
              value={newSiteForm.siteEngineerName}
              onChange={(e) => setNewSiteForm({ ...newSiteForm, siteEngineerName: e.target.value })}
            />
            <Input
              label="Designated Site Supervisor"
              value={newSiteForm.siteSupervisorName}
              onChange={(e) => setNewSiteForm({ ...newSiteForm, siteSupervisorName: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <Button variant="secondary" onClick={() => setIsNewSiteModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="accent" type="submit">
              Register Site
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: RAISE MATERIAL INDENT (SITE HEAD TO ADMIN) */}
      <Modal
        isOpen={isIndentModalOpen}
        onClose={() => setIsIndentModalOpen(false)}
        title={`📝 Material Indent Requisition - ${currentSite?.siteName}`}
      >
        <form onSubmit={handleSubmitIndent} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: 10, backgroundColor: '#f0f9ff', borderRadius: 6, fontSize: '0.82rem', color: '#0369a1' }}>
            Site Head / Engineer requests supplies needed at the project site. You can route to the Central Warehouse or to Admin / Procurement.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="Request Destination *"
              options={[
                { value: 'Warehouse', label: '🏬 Central Warehouse (Ambattur Stock)' },
                { value: 'Admin', label: '🏢 Admin / Procurement (Raise PO to Vendor)' },
              ]}
              value={indentForm.targetDestination}
              onChange={(e) => setIndentForm({ ...indentForm, targetDestination: e.target.value as 'Warehouse' | 'Admin' })}
              required
            />
            <Input
              label="Site Engineer Name *"
              placeholder={currentSite?.siteEngineerName || 'e.g. Vignesh S'}
              value={indentForm.siteEngineerName}
              onChange={(e) => setIndentForm({ ...indentForm, siteEngineerName: e.target.value })}
            />
          </div>

          <Select
            label="Target Project Job *"
            options={[
              ...mappedJobs.map((j) => ({ value: j.id, label: `${j.id} - ${j.title}` })),
            ]}
            value={indentForm.jobId}
            onChange={(e) => setIndentForm({ ...indentForm, jobId: e.target.value })}
            required
          />

          {/* Master Item Catalog Selector & Quick Pick */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4, color: '#0f172a' }}>
              Select Item from Master Catalog / Project BOQ *
            </label>
            <select
              className="ui-input"
              style={{ width: '100%', marginBottom: 8, fontWeight: 600 }}
              value={indentForm.itemId}
              onChange={(e) => {
                const selectedId = e.target.value;
                const itemsList = ERPService.getItems();
                const matched = itemsList.find((it) => it.id === selectedId);
                if (matched) {
                  setIndentForm((prev) => ({
                    ...prev,
                    itemId: matched.id,
                    itemName: matched.name,
                    specification: matched.specification || prev.specification,
                    unit: matched.unit,
                  }));
                } else {
                  setIndentForm((prev) => ({
                    ...prev,
                    itemId: '',
                  }));
                }
              }}
            >
              <option value="">-- Choose Item Master (e.g. 1.5 Sq.mm FRLS Copper Wire) --</option>
              {ERPService.getItems().map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.unit}) • {item.category}
                </option>
              ))}
            </select>

            <Input
              label="Material Name (as printed on DC & indent) *"
              placeholder="e.g. 1.5 Sq.mm FRLS Copper Wire"
              value={indentForm.itemName}
              onChange={(e) => setIndentForm({ ...indentForm, itemName: e.target.value })}
              required
            />
          </div>

          {/* 3-Way Live Stock & BOQ Breakdown Panel */}
          {(() => {
            const ledger = ERPService.getStockLedger();
            const q = indentForm.itemName.toLowerCase().trim();
            const itemId = indentForm.itemId;

            // Warehouse stock (Central Warehouse / Unallocated)
            const whItem = ledger.find(
              (l) =>
                (l.isUnallocated || l.locationName.toLowerCase().includes('warehouse')) &&
                (itemId ? l.itemId === itemId : l.itemName.toLowerCase().includes(q) || q.includes(l.itemName.toLowerCase()))
            );
            const whStock = whItem?.stockOnSite || 0;

            // Site Store stock for this site/job
            const siteItem = ledger.find(
              (l) =>
                (l.jobId === indentForm.jobId || l.locationId === currentSite?.id || l.locationName.toLowerCase().includes('site')) &&
                (itemId ? l.itemId === itemId : l.itemName.toLowerCase().includes(q) || q.includes(l.itemName.toLowerCase()))
            );
            const siteStock = siteItem?.stockOnSite || 0;

            // BOQ Target Limit for this job
            const procurable = indentForm.jobId ? ERPService.getJobProcurementItems(indentForm.jobId) : [];
            const boqMatched = procurable.find(
              (it) => (itemId && (it.itemId === itemId || it.boqLineId === itemId)) || it.name.toLowerCase().includes(q) || q.includes(it.name.toLowerCase())
            );
            const boqTarget = boqMatched?.targetQty || 0;
            const boqOrdered = boqMatched?.orderedQty || 0;
            const boqBalance = boqMatched?.balanceQty || 0;

            if (!indentForm.itemName.trim()) return null;

            return (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>
                    📊 Live Inventory &amp; BOQ Availability Snapshot:
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700 }}>
                    Unit: {indentForm.unit}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div style={{ backgroundColor: '#ffffff', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>🏬 WAREHOUSE STOCK</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: whStock > 0 ? '#0284c7' : '#94a3b8' }}>
                      {whStock} {indentForm.unit}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Central Warehouse</div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>🏗️ SITE STORE STOCK</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#166534' }}>
                      {siteStock} {indentForm.unit}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Current On-Site</div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>📋 BOQ TARGET LIMIT</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                      {boqTarget > 0 ? `${boqTarget} ${indentForm.unit}` : '100 Mtr'}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                      {boqTarget > 0 ? `Ordered: ${boqOrdered} • Bal: ${boqBalance}` : 'BOQ contract limit'}
                    </div>
                  </div>
                </div>

                {indentForm.targetDestination === 'Warehouse' && whStock >= (parseFloat(indentForm.requestedQty) || 0) && (
                  <div style={{ fontSize: '0.74rem', color: '#166534', backgroundColor: '#f0fdf4', padding: '6px 10px', borderRadius: 4, border: '1px solid #bbf7d0' }}>
                    ✓ Sufficient warehouse stock available ({whStock} {indentForm.unit}). Warehouse can dispatch directly with vehicle transport cost.
                  </div>
                )}
              </div>
            );
          })()}

          <Input
            label="Technical Specification / Grade"
            placeholder="e.g. 1100V Grade, IS 694, Multi-strand PVC Insulated Red/Black/Yellow"
            value={indentForm.specification}
            onChange={(e) => setIndentForm({ ...indentForm, specification: e.target.value })}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              type="number"
              step="any"
              min="0.1"
              label={`Quantity Needed (${indentForm.unit}) *`}
              placeholder="e.g. 20"
              value={indentForm.requestedQty}
              onChange={(e) => setIndentForm({ ...indentForm, requestedQty: e.target.value })}
              required
            />
            <Select
              label="Measurement Unit *"
              options={AVAILABLE_UNITS.map((u) => ({ value: u, label: u }))}
              value={indentForm.unit}
              onChange={(e) => setIndentForm({ ...indentForm, unit: e.target.value as MeasurementUnit })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="Urgency Level *"
              options={[
                { value: 'Normal', label: 'Normal (Standard Delivery)' },
                { value: 'High', label: 'High Priority (Work Blocked)' },
                { value: 'Critical', label: 'Critical Urgent (Site Stalled)' },
              ]}
              value={indentForm.urgency}
              onChange={(e) => setIndentForm({ ...indentForm, urgency: e.target.value as any })}
              required
            />
            <Input
              type="date"
              label="Required By Date"
              value={indentForm.neededByDate}
              onChange={(e) => setIndentForm({ ...indentForm, neededByDate: e.target.value })}
              required
            />
          </div>

          <Input
            label="Site Task / Work Area (Optional)"
            placeholder="e.g. Ground Floor Main Distribution Board Wiring"
            value={indentForm.taskTitle}
            onChange={(e) => setIndentForm({ ...indentForm, taskTitle: e.target.value })}
          />

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
              Site Engineer Reason / Notes
            </label>
            <textarea
              rows={2}
              className="ui-input"
              placeholder="e.g. Additional conduit required for revised architectural lighting layout on wing B."
              value={indentForm.reason}
              onChange={(e) => setIndentForm({ ...indentForm, reason: e.target.value })}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <Button variant="secondary" onClick={() => setIsIndentModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="accent" type="submit" icon={<Send size={14} />}>
              Submit Requisition to {indentForm.targetDestination === 'Warehouse' ? 'Warehouse' : 'Admin'}
            </Button>
          </div>
        </form>
      </Modal>

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

      {/* BILL PHOTO PROOF VIEWER MODAL */}
      <BillProofViewerModal
        isOpen={isBillProofModalOpen}
        onClose={() => {
          setIsBillProofModalOpen(false);
          setTargetPOForProof(null);
        }}
        purchaseOrder={targetPOForProof}
      />

      {/* TASK MODALS FOR SITE WORKSPACE */}
      <TaskBOQSplitModal
        isOpen={isBOQSplitModalOpen}
        onClose={() => setIsBOQSplitModalOpen(false)}
        defaultSiteId={currentSite?.id}
        defaultJobId={mappedJobs[0]?.id}
        onTasksCreated={loadData}
      />

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        defaultSiteId={currentSite?.id}
        defaultJobId={mappedJobs[0]?.id}
        onTaskCreated={loadData}
      />

      <TaskAllocationModal
        isOpen={isAllocationModalOpen}
        onClose={() => {
          setIsAllocationModalOpen(false);
          setSelectedTaskForAllocation(undefined);
        }}
        task={selectedTaskForAllocation}
        onTaskUpdated={loadData}
      />

      {/* MATERIAL INDENT LOGISTICS MODALS: DISPATCH, RECEIVE WITH PROOF, VIEW PROOF */}
      <DispatchIndentModal
        isOpen={isDispatchModalOpen}
        onClose={() => {
          setIsDispatchModalOpen(false);
          setDispatchingIndent(null);
        }}
        indent={dispatchingIndent}
        onDispatched={loadData}
      />

      <ReceiveIndentModal
        isOpen={isReceiveModalOpen}
        onClose={() => {
          setIsReceiveModalOpen(false);
          setReceivingIndent(null);
        }}
        indent={receivingIndent}
        onReceived={loadData}
      />

      <IndentProofModal
        isOpen={isProofModalOpen}
        onClose={() => {
          setIsProofModalOpen(false);
          setViewingProofIndent(null);
        }}
        indent={viewingProofIndent}
      />
    </div>
  );
};
