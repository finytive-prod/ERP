import React, { useState, useEffect, useMemo } from 'react';
import { 
  Landmark, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  DollarSign,
  Building2,
  CheckSquare,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Boxes,
  ExternalLink,
  Trash2,
  Search,
  Filter,
  Layers,
  Calendar,
  Percent
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ERPService } from '../../services/erpStorage';
import { Client, Job, ClientSite, SiteTask } from '../../types';
import { 
  PageHeader, 
  Button, 
  DataTable, 
  Modal, 
  Input, 
  Select,
  StatCard,
  Badge,
  Card,
  ConfirmDialog,
  useToast
} from '../../components/ui';
import { CreateTaskModal } from '../tasks/CreateTaskModal';
import { TaskAllocationModal } from '../tasks/TaskAllocationModal';

export const ClientsView: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<ClientSite[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [tasks, setTasks] = useState<SiteTask[]>([]);

  // Selected client for drill-down view
  const [selectedClientId, setSelectedClientId] = useState<string>(
    searchParams.get('clientId') || ''
  );

  // Sub-tab inside client workspace: 'hierarchy' | 'jobs' | 'tasks'
  const [activeSubTab, setActiveSubTab] = useState<'hierarchy' | 'jobs' | 'tasks'>('hierarchy');

  // Directory / Workspace Modals
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isAddSiteModalOpen, setIsAddSiteModalOpen] = useState(false);
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);

  // Tasks Modals
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [selectedTaskForAllocation, setSelectedTaskForAllocation] = useState<SiteTask | undefined>(undefined);
  const [defaultTaskSiteId, setDefaultTaskSiteId] = useState<string | undefined>(undefined);
  const [defaultTaskJobId, setDefaultTaskJobId] = useState<string | undefined>(undefined);

  // Delete Confirmations
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<SiteTask | null>(null);
  const [deleteSiteTarget, setDeleteSiteTarget] = useState<ClientSite | null>(null);

  // Form State: Register New Client
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    createDefaultSite: true,
    defaultSiteName: '',
    defaultSiteCity: 'Chennai',
  });

  // Form State: Add Site to Client
  const [siteFormData, setSiteFormData] = useState({
    siteName: '',
    siteLocation: '',
    city: 'Chennai',
    siteEngineerName: '',
    siteSupervisorName: 'Murugan P',
    contactPhone: '',
  });

  // Form State: Create Job for Client Site
  const [jobFormData, setJobFormData] = useState({
    title: '',
    siteId: '',
    scope: '',
    quotedAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    targetEndDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    assignedManager: 'Murugan P',
    assignedSupervisor: 'Rajesh Verma',
  });

  // Task filtering inside Client Workspace
  const [taskSiteFilter, setTaskSiteFilter] = useState('ALL');
  const [taskJobFilter, setTaskJobFilter] = useState('ALL');
  const [taskStatusFilter, setTaskStatusFilter] = useState('ALL');
  const [taskSearchTerm, setTaskSearchTerm] = useState('');

  // Expanded site cards in hierarchy view
  const [expandedSiteIds, setExpandedSiteIds] = useState<Record<string, boolean>>({});

  const loadData = () => {
    const allClients = ERPService.getClients();
    const allSites = ERPService.getClientSites();
    const allJobs = ERPService.getJobs();
    const allTasks = ERPService.getTasks();

    setClients(allClients);
    setSites(allSites);
    setJobs(allJobs);
    setTasks(allTasks);

    const urlClientId = searchParams.get('clientId');
    if (urlClientId && allClients.some((c) => c.id === urlClientId)) {
      setSelectedClientId(urlClientId);
    } else if (!urlClientId && selectedClientId) {
      if (!allClients.some((c) => c.id === selectedClientId)) {
        setSelectedClientId('');
      }
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('apex_storage_update', loadData);
    return () => window.removeEventListener('apex_storage_update', loadData);
  }, []);

  // Sync selected task for allocation when tasks change
  useEffect(() => {
    if (selectedTaskForAllocation) {
      const fresh = tasks.find((t) => t.id === selectedTaskForAllocation.id);
      if (fresh) setSelectedTaskForAllocation(fresh);
    }
  }, [tasks]);

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setTaskSiteFilter('ALL');
    setTaskJobFilter('ALL');
    setTaskStatusFilter('ALL');
    setTaskSearchTerm('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('clientId', clientId);
      return next;
    });
  };

  const handleBackToDirectory = () => {
    setSelectedClientId('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('clientId');
      return next;
    });
  };

  // Selected client object
  const currentClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Sites belonging to selected client
  const clientSites = useMemo(() => {
    if (!currentClient) return [];
    return sites.filter((s) => s.clientId === currentClient.id);
  }, [sites, currentClient]);

  const clientSiteIds = useMemo(() => clientSites.map((s) => s.id), [clientSites]);

  // Jobs belonging to selected client
  const clientJobs = useMemo(() => {
    if (!currentClient) return [];
    return jobs.filter(
      (j) => j.clientId === currentClient.id || (j.siteId && clientSiteIds.includes(j.siteId))
    );
  }, [jobs, currentClient, clientSiteIds]);

  const clientJobIds = useMemo(() => clientJobs.map((j) => j.id), [clientJobs]);

  // Tasks belonging to selected client (linked via siteId or jobId)
  const clientTasks = useMemo(() => {
    if (!currentClient) return [];
    return tasks.filter(
      (t) => (t.siteId && clientSiteIds.includes(t.siteId)) || clientJobIds.includes(t.jobId)
    );
  }, [tasks, currentClient, clientSiteIds, clientJobIds]);

  // Filtered tasks for the Tasks Tab
  const filteredClientTasks = useMemo(() => {
    return clientTasks.filter((t) => {
      if (taskSiteFilter !== 'ALL' && t.siteId !== taskSiteFilter) return false;
      if (taskJobFilter !== 'ALL' && t.jobId !== taskJobFilter) return false;
      if (taskStatusFilter !== 'ALL' && t.status !== taskStatusFilter) return false;
      if (taskSearchTerm.trim()) {
        const query = taskSearchTerm.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = (t.description || '').toLowerCase().includes(query);
        const matchesSuper = (t.assignedSupervisor || '').toLowerCase().includes(query);
        const matchesSite = (t.siteName || '').toLowerCase().includes(query);
        const matchesJob = (t.jobTitle || t.jobId || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesSuper && !matchesSite && !matchesJob) {
          return false;
        }
      }
      return true;
    });
  }, [clientTasks, taskSiteFilter, taskJobFilter, taskStatusFilter, taskSearchTerm]);

  // Toggle site accordion
  const toggleSiteExpand = (siteId: string) => {
    setExpandedSiteIds((prev) => ({
      ...prev,
      [siteId]: !prev[siteId],
    }));
  };

  // Status badge styling helper
  const renderTaskStatusBadge = (status: SiteTask['status']) => {
    switch (status) {
      case 'Completed':
        return <Badge status="Completed" variant="success" />;
      case 'In Progress':
        return <Badge status="In Progress" variant="info" />;
      case 'Pending':
        return <Badge status="Pending" variant="warning" />;
      case 'On Hold':
        return <Badge status="On Hold" variant="neutral" />;
      default:
        return <Badge status={status} variant="neutral" />;
    }
  };

  const renderJobStatusBadge = (status: Job['status']) => {
    return <Badge status={status} />;
  };

  // Handle Register Client
  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim() || !formData.email.trim()) {
      showToast('Validation Error', 'Please enter Company Name and Client Email.', 'danger');
      return;
    }

    const { client, defaultSite } = ERPService.addClient({
      companyName: formData.companyName.trim(),
      contactPerson: formData.contactPerson.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      gstNumber: formData.gstNumber.trim(),
      createDefaultSite: formData.createDefaultSite,
      defaultSiteName: formData.defaultSiteName.trim() || `${formData.companyName.trim()} - Main Site`,
      defaultSiteCity: formData.defaultSiteCity.trim() || 'Chennai',
    });

    window.dispatchEvent(new Event('apex_storage_update'));
    showToast(
      'Client Registered',
      defaultSite
        ? `${client.companyName} registered with default site "${defaultSite.siteName}".`
        : `${client.companyName} registered successfully.`,
      'success'
    );

    setIsAddClientModalOpen(false);
    setFormData({
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      gstNumber: '',
      createDefaultSite: true,
      defaultSiteName: '',
      defaultSiteCity: 'Chennai',
    });
  };

  // Handle Add Site for Client
  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient) return;
    if (!siteFormData.siteName.trim()) {
      showToast('Validation Error', 'Please enter Site Name.', 'danger');
      return;
    }

    const newSite = ERPService.addClientSite({
      clientId: currentClient.id,
      clientName: currentClient.companyName,
      siteName: siteFormData.siteName.trim(),
      siteLocation: siteFormData.siteLocation.trim() || currentClient.address || 'Project Location',
      city: siteFormData.city.trim() || 'Chennai',
      siteEngineerName: siteFormData.siteEngineerName.trim() || currentClient.contactPerson || 'Assigned Site Engineer',
      siteSupervisorName: siteFormData.siteSupervisorName.trim() || 'Murugan P',
      contactPhone: siteFormData.contactPhone.trim() || currentClient.phone || '',
      activeJobIds: [],
    });

    window.dispatchEvent(new Event('apex_storage_update'));
    showToast('Site Created', `Site "${newSite.siteName}" registered for ${currentClient.companyName}.`, 'success');
    setIsAddSiteModalOpen(false);
    setSiteFormData({
      siteName: '',
      siteLocation: '',
      city: 'Chennai',
      siteEngineerName: '',
      siteSupervisorName: 'Murugan P',
      contactPhone: '',
    });
  };

  // Handle Create Job for Client Site
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient) return;
    if (!jobFormData.title.trim()) {
      showToast('Validation Error', 'Please enter Job Title.', 'danger');
      return;
    }

    const chosenSite = clientSites.find((s) => s.id === jobFormData.siteId) || clientSites[0];
    const newJob = ERPService.createJob({
      title: jobFormData.title.trim(),
      clientId: currentClient.id,
      clientName: currentClient.companyName,
      clientEmail: currentClient.email,
      siteId: chosenSite ? chosenSite.id : undefined,
      siteName: chosenSite ? chosenSite.siteName : undefined,
      siteLocation: chosenSite ? chosenSite.siteLocation : currentClient.address || 'Chennai',
      scope: jobFormData.scope.trim() || 'Electrical Installation & Contracting Works',
      startDate: jobFormData.startDate,
      targetEndDate: jobFormData.targetEndDate,
      assignedManager: jobFormData.assignedManager.trim() || 'Murugan P',
      assignedSupervisor: jobFormData.assignedSupervisor.trim() || chosenSite?.siteSupervisorName || 'Murugan P',
      status: 'In Progress',
      quotedAmount: parseFloat(jobFormData.quotedAmount) || 0,
    });

    window.dispatchEvent(new Event('apex_storage_update'));
    showToast('Job Created', `Job ${newJob.id} (${newJob.title}) created successfully.`, 'success');
    setIsAddJobModalOpen(false);
    setJobFormData({
      title: '',
      siteId: '',
      scope: '',
      quotedAmount: '',
      startDate: new Date().toISOString().split('T')[0],
      targetEndDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      assignedManager: 'Murugan P',
      assignedSupervisor: 'Rajesh Verma',
    });
  };

  // Handle Quick Task Status Change
  const handleQuickStatusChange = (taskId: string, newStatus: SiteTask['status']) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const updates: Partial<SiteTask> = { status: newStatus };
    if (newStatus === 'Completed' && target.completedQty < target.targetQty) {
      updates.completedQty = target.targetQty;
    }
    ERPService.updateTask(taskId, updates);
    window.dispatchEvent(new Event('apex_storage_update'));
    showToast('Task Updated', `Task status changed to ${newStatus}.`, 'success');
  };

  // Open Task Modal with presets
  const handleOpenCreateTask = (siteId?: string, jobId?: string) => {
    setDefaultTaskSiteId(siteId || clientSites[0]?.id || undefined);
    setDefaultTaskJobId(jobId || undefined);
    setIsCreateTaskModalOpen(true);
  };

  // Confirm delete task
  const handleConfirmDeleteTask = () => {
    if (!deleteTaskTarget) return;
    ERPService.deleteTask(deleteTaskTarget.id);
    window.dispatchEvent(new Event('apex_storage_update'));
    showToast('Task Deleted', `Task "${deleteTaskTarget.title}" was removed.`, 'info');
    setDeleteTaskTarget(null);
  };

  // Confirm delete site
  const handleConfirmDeleteSite = () => {
    if (!deleteSiteTarget) return;
    ERPService.deleteClientSite(deleteSiteTarget.id);
    window.dispatchEvent(new Event('apex_storage_update'));
    showToast('Site Deleted', `Site "${deleteSiteTarget.siteName}" removed.`, 'info');
    setDeleteSiteTarget(null);
  };

  // Aggregate stats
  const totalBilled = clients.reduce((sum, c) => sum + c.totalBilled, 0);
  const totalOutstanding = clients.reduce((sum, c) => sum + c.outstandingBalance, 0);

  // -------------------------------------------------------------
  // VIEW: SINGLE CLIENT WORKSPACE & SITES / JOBS / TASKS DRILLDOWN
  // -------------------------------------------------------------
  if (currentClient) {
    const completedTasksCount = clientTasks.filter((t) => t.status === 'Completed').length;
    const inProgressTasksCount = clientTasks.filter((t) => t.status === 'In Progress').length;
    const pendingTasksCount = clientTasks.filter((t) => t.status === 'Pending').length;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {/* Navigation & Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Button
              variant="secondary"
              icon={<ArrowLeft size={16} />}
              onClick={handleBackToDirectory}
            >
              Back to Client Directory
            </Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)' }}>Client /</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                {currentClient.companyName}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              icon={<Building2 size={16} />}
              onClick={() => {
                setSiteFormData({
                  siteName: '',
                  siteLocation: currentClient.address || '',
                  city: 'Chennai',
                  siteEngineerName: currentClient.contactPerson || '',
                  siteSupervisorName: 'Murugan P',
                  contactPhone: currentClient.phone || '',
                });
                setIsAddSiteModalOpen(true);
              }}
            >
              + Add New Site
            </Button>

            <Button
              variant="secondary"
              icon={<Briefcase size={16} />}
              onClick={() => {
                setJobFormData({
                  title: '',
                  siteId: clientSites[0]?.id || '',
                  scope: '',
                  quotedAmount: '',
                  startDate: new Date().toISOString().split('T')[0],
                  targetEndDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
                  assignedManager: 'Murugan P',
                  assignedSupervisor: clientSites[0]?.siteSupervisorName || 'Rajesh Verma',
                });
                setIsAddJobModalOpen(true);
              }}
              disabled={clientSites.length === 0}
            >
              + Create Job for Site
            </Button>

            <Button
              variant="accent"
              icon={<Plus size={16} />}
              onClick={() => handleOpenCreateTask()}
              disabled={clientSites.length === 0 || clientJobs.length === 0}
            >
              + Create Site Task
            </Button>
          </div>
        </div>

        {/* Client Profile Card */}
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
                    {currentClient.companyName}
                  </h1>
                  {currentClient.gstNumber && (
                    <Badge status={`GST: ${currentClient.gstNumber}`} variant="neutral" showIcon={false} />
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', marginTop: 'var(--space-2)', fontSize: '0.86rem', color: 'var(--color-gray-600)' }}>
                  {currentClient.contactPerson && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Users size={14} color="var(--color-gray-500)" />
                      <strong>Contact:</strong> {currentClient.contactPerson}
                    </span>
                  )}
                  {currentClient.email && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Mail size={14} color="var(--color-gray-500)" />
                      {currentClient.email}
                    </span>
                  )}
                  {currentClient.phone && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Phone size={14} color="var(--color-gray-500)" />
                      {currentClient.phone}
                    </span>
                  )}
                  {currentClient.address && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={14} color="var(--color-gray-500)" />
                      {currentClient.address}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>Total Billed</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    ₹{currentClient.totalBilled.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-subtle)', paddingLeft: 'var(--space-4)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: 600 }}>Receivables Due</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: currentClient.outstandingBalance > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    ₹{currentClient.outstandingBalance.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--space-3)',
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', fontWeight: 600 }}>OPERATIONAL SITES</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>{clientSites.length} Sites</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                  <Briefcase size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', fontWeight: 600 }}>CONTRACTING JOBS</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>{clientJobs.length} Jobs</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <CheckSquare size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', fontWeight: 600 }}>TOTAL SITE TASKS</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {clientTasks.length} Tasks
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', fontWeight: 600 }}>EXECUTION STATUS</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    <span style={{ color: 'var(--color-success)' }}>{completedTasksCount} Done</span> • <span style={{ color: 'var(--color-info)' }}>{inProgressTasksCount} Active</span> • <span style={{ color: 'var(--color-warning)' }}>{pendingTasksCount} Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border-subtle)', gap: 'var(--space-4)' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('hierarchy')}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'none',
              border: 'none',
              borderBottom: activeSubTab === 'hierarchy' ? '3px solid var(--color-primary)' : '3px solid transparent',
              fontWeight: activeSubTab === 'hierarchy' ? 700 : 500,
              color: activeSubTab === 'hierarchy' ? 'var(--color-primary)' : 'var(--color-gray-500)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: '0.95rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Layers size={18} />
            Sites & Jobs Hierarchy ({clientSites.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('jobs')}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'none',
              border: 'none',
              borderBottom: activeSubTab === 'jobs' ? '3px solid var(--color-primary)' : '3px solid transparent',
              fontWeight: activeSubTab === 'jobs' ? 700 : 500,
              color: activeSubTab === 'jobs' ? 'var(--color-primary)' : 'var(--color-gray-500)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: '0.95rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Briefcase size={18} />
            Contracting Jobs ({clientJobs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('tasks')}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'none',
              border: 'none',
              borderBottom: activeSubTab === 'tasks' ? '3px solid var(--color-primary)' : '3px solid transparent',
              fontWeight: activeSubTab === 'tasks' ? 700 : 500,
              color: activeSubTab === 'tasks' ? 'var(--color-primary)' : 'var(--color-gray-500)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: '0.95rem',
              transition: 'all 0.15s ease'
            }}
          >
            <CheckSquare size={18} />
            Site Tasks & Execution ({clientTasks.length})
          </button>
        </div>

        {/* -------------------------------------------------------- */}
        {/* TAB 1: SITES & JOBS HIERARCHY EXPLORER                   */}
        {/* -------------------------------------------------------- */}
        {activeSubTab === 'hierarchy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {clientSites.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 'var(--space-10)',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--border-strong)'
              }}>
                <Building2 size={44} style={{ color: 'var(--color-gray-400)', margin: '0 auto var(--space-3)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  No Operational Sites for {currentClient.companyName}
                </h3>
                <p style={{ color: 'var(--color-gray-500)', fontSize: '0.9rem', maxWidth: 450, margin: 'var(--space-2) auto var(--space-4)' }}>
                  Create an operational site to manage on-site contracting jobs, material indents, and field tasks.
                </p>
                <Button
                  variant="accent"
                  icon={<Plus size={16} />}
                  onClick={() => setIsAddSiteModalOpen(true)}
                >
                  Create First Site
                </Button>
              </div>
            ) : (
              clientSites.map((site) => {
                const siteJobs = jobs.filter((j) => {
                  if (j.siteId === site.id) return true;
                  if (site.activeJobIds?.includes(j.id)) return true;
                  if (j.clientId === currentClient.id && j.siteLocation === site.siteLocation) return true;
                  return false;
                });
                const siteTasks = clientTasks.filter((t) => t.siteId === site.id || siteJobs.some((j) => j.id === t.jobId));
                const isExpanded = expandedSiteIds[site.id] !== false; // expanded by default

                return (
                  <div
                    key={site.id}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-light)',
                      boxShadow: 'var(--shadow-sm)',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Site Header Row */}
                    <div
                      style={{
                        padding: 'var(--space-4) var(--space-5)',
                        backgroundColor: '#fafbfc',
                        borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 'var(--space-3)'
                      }}
                    >
                      <div
                        onClick={() => toggleSiteExpand(site.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer', flex: 1 }}
                      >
                        <div style={{ color: 'var(--color-gray-400)' }}>
                          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </div>
                        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                          <Building2 size={20} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                              {site.siteName}
                            </h3>
                            {site.city && <Badge status={site.city} variant="neutral" showIcon={false} />}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', fontSize: '0.8rem', color: 'var(--color-gray-600)', marginTop: 4 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <MapPin size={13} color="var(--color-gray-400)" />
                              {site.siteLocation}
                            </span>
                            {site.siteSupervisorName && (
                              <span>
                                <strong>Supervisor:</strong> {site.siteSupervisorName}
                              </span>
                            )}
                            {site.contactPhone && (
                              <span>
                                <strong>Phone:</strong> {site.contactPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Site Metrics & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <Badge status={`${siteJobs.length} Jobs`} variant="info" showIcon={false} />
                          <Badge status={`${siteTasks.length} Tasks`} variant="warning" showIcon={false} />
                        </div>

                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Plus size={14} />}
                          onClick={() => {
                            setJobFormData({
                              title: '',
                              siteId: site.id,
                              scope: '',
                              quotedAmount: '',
                              startDate: new Date().toISOString().split('T')[0],
                              targetEndDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
                              assignedManager: 'Murugan P',
                              assignedSupervisor: site.siteSupervisorName || 'Rajesh Verma',
                            });
                            setIsAddJobModalOpen(true);
                          }}
                        >
                          + Add Job
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<CheckSquare size={14} />}
                          onClick={() => handleOpenCreateTask(site.id, siteJobs[0]?.id)}
                          disabled={siteJobs.length === 0}
                        >
                          + Add Task
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<ExternalLink size={14} />}
                          onClick={() => navigate(`/sites?siteId=${site.id}`)}
                          title="Open full site operations workspace"
                        >
                          Sites Hub ↗
                        </Button>

                        <button
                          type="button"
                          onClick={() => setDeleteSiteTarget(site)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-gray-400)',
                            cursor: 'pointer',
                            padding: '6px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Delete Site"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Site Contents: Jobs & Tasks Tree */}
                    {isExpanded && (
                      <div style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        {siteJobs.length === 0 ? (
                          <div style={{ padding: 'var(--space-4)', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                            <div style={{ fontSize: '0.88rem', color: 'var(--color-gray-600)', marginBottom: 'var(--space-2)' }}>
                              No contracting jobs linked to <strong>{site.siteName}</strong> yet.
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Plus size={14} />}
                              onClick={() => {
                                setJobFormData({
                                  title: '',
                                  siteId: site.id,
                                  scope: '',
                                  quotedAmount: '',
                                  startDate: new Date().toISOString().split('T')[0],
                                  targetEndDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
                                  assignedManager: 'Murugan P',
                                  assignedSupervisor: site.siteSupervisorName || 'Rajesh Verma',
                                });
                                setIsAddJobModalOpen(true);
                              }}
                            >
                              Create Contracting Job for this Site
                            </Button>
                          </div>
                        ) : (
                          siteJobs.map((job) => {
                            const jobTasks = siteTasks.filter((t) => t.jobId === job.id);
                            const jobCompletedTasks = jobTasks.filter((t) => t.status === 'Completed').length;

                            return (
                              <div
                                key={job.id}
                                style={{
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 'var(--radius-md)',
                                  backgroundColor: '#ffffff',
                                  padding: 'var(--space-4)'
                                }}
                              >
                                {/* Job Header Bar */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                      <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--color-primary)' }}>
                                        {job.title}
                                      </span>
                                      <span style={{ padding: '2px 7px', borderRadius: 'var(--radius-sm)', backgroundColor: '#f1f5f9', color: '#334155', fontWeight: 600, fontSize: '0.75rem' }}>
                                        {job.id}
                                      </span>
                                      {renderJobStatusBadge(job.status)}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', marginTop: 4 }}>
                                      Scope: {job.scope || 'Standard Contracting Scope'} • Quoted: <strong>₹{job.quotedAmount.toLocaleString('en-IN')}</strong> • Progress: <strong>{job.progressPct}%</strong>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      icon={<Plus size={14} />}
                                      onClick={() => handleOpenCreateTask(site.id, job.id)}
                                    >
                                      + Add Task
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      icon={<ExternalLink size={14} />}
                                      onClick={() => navigate(`/jobs/${job.id}`)}
                                    >
                                      Job Spine ↗
                                    </Button>
                                  </div>
                                </div>

                                {/* Job Tasks Sub-list */}
                                <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid #f1f5f9' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-gray-700)', textTransform: 'uppercase' }}>
                                      Site Execution Tasks ({jobCompletedTasks}/{jobTasks.length} Completed)
                                    </div>
                                    {jobTasks.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setTaskSiteFilter(site.id);
                                          setTaskJobFilter(job.id);
                                          setActiveSubTab('tasks');
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: 'var(--color-info)',
                                          fontSize: '0.8rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 4
                                        }}
                                      >
                                        Manage in Full Tasks View <ArrowRight size={14} />
                                      </button>
                                    )}
                                  </div>

                                  {jobTasks.length === 0 ? (
                                    <div style={{ fontSize: '0.82rem', color: 'var(--color-gray-500)', fontStyle: 'italic', padding: 'var(--space-2) 0' }}>
                                      No tasks created under this job yet. Click "+ Add Task" to allocate field execution work.
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                      {jobTasks.map((task) => (
                                        <div
                                          key={task.id}
                                          style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px 12px',
                                            backgroundColor: '#f8fafc',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.85rem',
                                            gap: 'var(--space-2)',
                                            flexWrap: 'wrap'
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: 220 }}>
                                            <CheckSquare size={16} color="var(--color-primary)" />
                                            <div>
                                              <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{task.title}</span>
                                              <div style={{ fontSize: '0.74rem', color: 'var(--color-gray-500)' }}>
                                                Target: {task.targetQty} {task.unit} • Completed: {task.completedQty} {task.unit} ({Math.round((task.completedQty / (task.targetQty || 1)) * 100)}%) • Supervisor: {task.assignedSupervisor}
                                              </div>
                                            </div>
                                          </div>

                                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            {renderTaskStatusBadge(task.status)}

                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              icon={<Boxes size={13} />}
                                              onClick={() => {
                                                setSelectedTaskForAllocation(task);
                                                setIsAllocationModalOpen(true);
                                              }}
                                            >
                                              Materials & Crew
                                            </Button>

                                            <select
                                              value={task.status}
                                              onChange={(e) => handleQuickStatusChange(task.id, e.target.value as any)}
                                              style={{
                                                height: 28,
                                                fontSize: '0.78rem',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--border-strong)',
                                                padding: '0 6px',
                                                backgroundColor: '#fff',
                                                fontWeight: 600
                                              }}
                                            >
                                              <option value="Pending">Pending</option>
                                              <option value="In Progress">In Progress</option>
                                              <option value="Completed">Completed</option>
                                              <option value="On Hold">On Hold</option>
                                            </select>

                                            <button
                                              type="button"
                                              onClick={() => setDeleteTaskTarget(task)}
                                              style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--color-gray-400)',
                                                cursor: 'pointer',
                                                padding: 4,
                                                display: 'flex',
                                                alignItems: 'center'
                                              }}
                                              title="Delete Task"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* TAB 2: CONTRACTING JOBS LIST                             */}
        {/* -------------------------------------------------------- */}
        {activeSubTab === 'jobs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                  Contracting Jobs for {currentClient.companyName}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)', margin: '4px 0 0' }}>
                  All jobs, quoted amounts, execution progress, and on-site task allocations.
                </p>
              </div>

              <Button
                variant="accent"
                icon={<Plus size={16} />}
                onClick={() => {
                  setJobFormData({
                    title: '',
                    siteId: clientSites[0]?.id || '',
                    scope: '',
                    quotedAmount: '',
                    startDate: new Date().toISOString().split('T')[0],
                    targetEndDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
                    assignedManager: 'Murugan P',
                    assignedSupervisor: clientSites[0]?.siteSupervisorName || 'Rajesh Verma',
                  });
                  setIsAddJobModalOpen(true);
                }}
                disabled={clientSites.length === 0}
              >
                + Create New Job
              </Button>
            </div>

            <DataTable<Job>
              data={clientJobs}
              keyExtractor={(j) => j.id}
              searchField={(j) => `${j.id} ${j.title} ${j.siteName || ''} ${j.siteLocation || ''}`}
              searchPlaceholder="Search jobs by ID, title, site..."
              emptyMessage="No contracting jobs found for this client."
              columns={[
                {
                  key: 'id',
                  header: 'Job ID & Title',
                  render: (j) => (
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{j.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)' }}>ID: {j.id}</div>
                    </div>
                  ),
                },
                {
                  key: 'site',
                  header: 'Linked Site & Location',
                  render: (j) => {
                    const matchedSite = clientSites.find((s) => s.id === j.siteId);
                    return (
                      <div>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Building2 size={13} color="var(--color-gray-500)" />
                          {matchedSite?.siteName || j.siteName || 'Project Site'}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--color-gray-500)' }}>
                          {matchedSite?.siteLocation || j.siteLocation}
                        </div>
                      </div>
                    );
                  },
                },
                {
                  key: 'tasksCount',
                  header: 'Tasks Allocated',
                  render: (j) => {
                    const jTasks = clientTasks.filter((t) => t.jobId === j.id);
                    const done = jTasks.filter((t) => t.status === 'Completed').length;
                    return (
                      <div>
                        <strong>{jTasks.length} Tasks</strong>
                        <div style={{ fontSize: '0.75rem', color: done === jTasks.length && jTasks.length > 0 ? 'var(--color-success)' : 'var(--color-gray-500)' }}>
                          {done} Completed
                        </div>
                      </div>
                    );
                  },
                },
                {
                  key: 'quotedAmount',
                  header: 'Quoted (₹)',
                  render: (j) => `₹${j.quotedAmount.toLocaleString('en-IN')}`,
                },
                {
                  key: 'progressPct',
                  header: 'Progress',
                  render: (j) => (
                    <div style={{ width: 110 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 2 }}>
                        <span>Progress</span>
                        <strong>{j.progressPct}%</strong>
                      </div>
                      <div style={{ width: '100%', height: 6, backgroundColor: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, j.progressPct)}%`,
                            height: '100%',
                            backgroundColor: j.progressPct === 100 ? 'var(--color-success)' : 'var(--color-info)',
                          }}
                        />
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (j) => renderJobStatusBadge(j.status),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (j) => (
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<CheckSquare size={13} />}
                        onClick={() => {
                          setTaskJobFilter(j.id);
                          if (j.siteId) setTaskSiteFilter(j.siteId);
                          setActiveSubTab('tasks');
                        }}
                      >
                        Tasks
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<ExternalLink size={13} />}
                        onClick={() => navigate(`/jobs/${j.id}`)}
                      >
                        Spine ↗
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* TAB 3: FULL SITE TASKS & EXECUTION MANAGEMENT            */}
        {/* -------------------------------------------------------- */}
        {activeSubTab === 'tasks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Task Filters & Create Action */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: '#fafbfc',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)' }}>
                {/* Site Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-gray-600)' }}>Site:</span>
                  <select
                    className="ui-select"
                    value={taskSiteFilter}
                    onChange={(e) => setTaskSiteFilter(e.target.value)}
                    style={{ height: 34, fontSize: '0.85rem' }}
                  >
                    <option value="ALL">All Sites ({clientSites.length})</option>
                    {clientSites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.siteName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-gray-600)' }}>Job:</span>
                  <select
                    className="ui-select"
                    value={taskJobFilter}
                    onChange={(e) => setTaskJobFilter(e.target.value)}
                    style={{ height: 34, fontSize: '0.85rem', maxWidth: 220 }}
                  >
                    <option value="ALL">All Contracting Jobs ({clientJobs.length})</option>
                    {clientJobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.id} - {j.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-gray-600)' }}>Status:</span>
                  <select
                    className="ui-select"
                    value={taskStatusFilter}
                    onChange={(e) => setTaskStatusFilter(e.target.value)}
                    style={{ height: 34, fontSize: '0.85rem' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              <Button
                variant="accent"
                icon={<Plus size={16} />}
                onClick={() => handleOpenCreateTask(
                  taskSiteFilter !== 'ALL' ? taskSiteFilter : undefined,
                  taskJobFilter !== 'ALL' ? taskJobFilter : undefined
                )}
                disabled={clientSites.length === 0 || clientJobs.length === 0}
              >
                + Create Site Task
              </Button>
            </div>

            {/* Tasks DataTable */}
            <DataTable<SiteTask>
              data={filteredClientTasks}
              keyExtractor={(t) => t.id}
              searchField={(t) => `${t.title} ${t.description} ${t.assignedSupervisor} ${t.siteName || ''} ${t.jobTitle || ''}`}
              searchPlaceholder="Search client tasks..."
              emptyMessage="No tasks found matching current filters. Click '+ Create Site Task' to assign tasks to this client's sites."
              columns={[
                {
                  key: 'title',
                  header: 'Task & Description',
                  render: (t) => (
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.92rem' }}>
                        {t.title}
                      </div>
                      {t.description && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)', maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.description}
                        </div>
                      )}
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-400)', marginTop: 2 }}>
                        Start: {t.startDate} • Target: {t.targetDate}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'siteAndJob',
                  header: 'Site & Job Spine',
                  render: (t) => {
                    const matchedSite = sites.find((s) => s.id === t.siteId);
                    const matchedJob = jobs.find((j) => j.id === t.jobId);
                    return (
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Building2 size={13} color="var(--color-gray-500)" />
                          {matchedSite?.siteName || t.siteName || 'Assigned Site'}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--color-gray-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Briefcase size={12} color="var(--color-gray-400)" />
                          {matchedJob?.title || t.jobTitle || t.jobId}
                        </div>
                      </div>
                    );
                  },
                },
                {
                  key: 'supervisor',
                  header: 'Supervisor & Crew',
                  render: (t) => (
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{t.assignedSupervisor}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--color-gray-500)' }}>
                        {t.assignedWorkers?.length || 0} crew assigned
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'progress',
                  header: 'Physical Progress',
                  render: (t) => {
                    const pct = Math.round((t.completedQty / (t.targetQty || 1)) * 100);
                    return (
                      <div style={{ minWidth: 120 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 3 }}>
                          <strong>{t.completedQty} / {t.targetQty} {t.unit}</strong>
                          <span style={{ fontWeight: 700, color: pct >= 100 ? 'var(--color-success)' : 'var(--color-primary)' }}>
                            {pct}%
                          </span>
                        </div>
                        <div style={{ width: '100%', height: 6, backgroundColor: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              height: '100%',
                              backgroundColor: pct >= 100 ? 'var(--color-success)' : 'var(--color-accent)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  },
                },
                {
                  key: 'status',
                  header: 'Status & Update',
                  render: (t) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <select
                        value={t.status}
                        onChange={(e) => handleQuickStatusChange(t.id, e.target.value as any)}
                        style={{
                          height: 30,
                          fontSize: '0.8rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-strong)',
                          padding: '0 6px',
                          backgroundColor: '#fff',
                          fontWeight: 700,
                          color: t.status === 'Completed' ? 'var(--color-success)' : t.status === 'In Progress' ? 'var(--color-info)' : 'var(--color-primary)'
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                      </select>
                    </div>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (t) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Boxes size={14} />}
                        onClick={() => {
                          setSelectedTaskForAllocation(t);
                          setIsAllocationModalOpen(true);
                        }}
                        title="Allocate site inventory, assign crew, and log daily progress"
                      >
                        Manage Task
                      </Button>

                      <button
                        type="button"
                        onClick={() => setDeleteTaskTarget(t)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-gray-400)',
                          cursor: 'pointer',
                          padding: 6,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Delete Task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: ADD SITE FOR CURRENT CLIENT                       */}
        {/* ======================================================== */}
        <Modal
          isOpen={isAddSiteModalOpen}
          onClose={() => setIsAddSiteModalOpen(false)}
          title={`Register New Site for ${currentClient.companyName}`}
          maxWidth="580px"
        >
          <form onSubmit={handleAddSite}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input
                label="Site Name *"
                placeholder="e.g. Apex Horizon Tech Park (Tower C)"
                value={siteFormData.siteName}
                onChange={(e) => setSiteFormData({ ...siteFormData, siteName: e.target.value })}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                <Input
                  label="City / Region *"
                  placeholder="e.g. Chennai"
                  value={siteFormData.city}
                  onChange={(e) => setSiteFormData({ ...siteFormData, city: e.target.value })}
                  required
                />
                <Input
                  label="Contact Phone"
                  placeholder="+91 98401 22334"
                  value={siteFormData.contactPhone}
                  onChange={(e) => setSiteFormData({ ...siteFormData, contactPhone: e.target.value })}
                />
              </div>

              <Input
                label="Site Physical Location / Address *"
                placeholder="Plot 42, Guindy Industrial Estate, Chennai"
                value={siteFormData.siteLocation}
                onChange={(e) => setSiteFormData({ ...siteFormData, siteLocation: e.target.value })}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                <Input
                  label="Site Engineer Name"
                  placeholder="e.g. Vignesh S"
                  value={siteFormData.siteEngineerName}
                  onChange={(e) => setSiteFormData({ ...siteFormData, siteEngineerName: e.target.value })}
                />
                <Input
                  label="Site Supervisor Name"
                  placeholder="e.g. Murugan P"
                  value={siteFormData.siteSupervisorName}
                  onChange={(e) => setSiteFormData({ ...siteFormData, siteSupervisorName: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                <Button type="button" variant="secondary" onClick={() => setIsAddSiteModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent">
                  Register Site
                </Button>
              </div>
            </div>
          </form>
        </Modal>

        {/* ======================================================== */}
        {/* MODAL: CREATE JOB FOR CLIENT SITE                        */}
        {/* ======================================================== */}
        <Modal
          isOpen={isAddJobModalOpen}
          onClose={() => setIsAddJobModalOpen(false)}
          title={`Create Contracting Job for ${currentClient.companyName}`}
          maxWidth="600px"
        >
          <form onSubmit={handleCreateJob}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: 4 }}>
                  Target Client Site *
                </label>
                <select
                  className="ui-select"
                  value={jobFormData.siteId}
                  onChange={(e) => {
                    const sId = e.target.value;
                    const matched = clientSites.find((s) => s.id === sId);
                    setJobFormData({
                      ...jobFormData,
                      siteId: sId,
                      assignedSupervisor: matched?.siteSupervisorName || jobFormData.assignedSupervisor,
                    });
                  }}
                  style={{ width: '100%', height: 40 }}
                  required
                >
                  {clientSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.siteName} ({s.city})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Contracting Job Title *"
                placeholder="e.g. Substation HT/LT Panel Erection & Cabling"
                value={jobFormData.title}
                onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                required
              />

              <Input
                label="Scope of Work"
                placeholder="e.g. Supply, erection, testing and commissioning of 11kV substation"
                value={jobFormData.scope}
                onChange={(e) => setJobFormData({ ...jobFormData, scope: e.target.value })}
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                <Input
                  label="Quoted Amount (₹)"
                  type="number"
                  placeholder="e.g. 1500000"
                  value={jobFormData.quotedAmount}
                  onChange={(e) => setJobFormData({ ...jobFormData, quotedAmount: e.target.value })}
                />
                <Input
                  label="Assigned Project Manager"
                  placeholder="e.g. Murugan P"
                  value={jobFormData.assignedManager}
                  onChange={(e) => setJobFormData({ ...jobFormData, assignedManager: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                <Input
                  label="Start Date"
                  type="date"
                  value={jobFormData.startDate}
                  onChange={(e) => setJobFormData({ ...jobFormData, startDate: e.target.value })}
                />
                <Input
                  label="Target Completion Date"
                  type="date"
                  value={jobFormData.targetEndDate}
                  onChange={(e) => setJobFormData({ ...jobFormData, targetEndDate: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                <Button type="button" variant="secondary" onClick={() => setIsAddJobModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent">
                  Create Job
                </Button>
              </div>
            </div>
          </form>
        </Modal>

        {/* Modal: Create Task Scoped to Client Sites */}
        <CreateTaskModal
          isOpen={isCreateTaskModalOpen}
          onClose={() => setIsCreateTaskModalOpen(false)}
          defaultSiteId={defaultTaskSiteId}
          defaultJobId={defaultTaskJobId}
          allowedSiteIds={clientSiteIds}
          onTaskCreated={() => {
            loadData();
            showToast('Success', 'Site execution task created successfully.', 'success');
          }}
        />

        {/* Modal: Task Allocation (Materials, Crew & Daily Logs) */}
        <TaskAllocationModal
          isOpen={isAllocationModalOpen}
          onClose={() => setIsAllocationModalOpen(false)}
          task={selectedTaskForAllocation}
          onTaskUpdated={() => {
            loadData();
          }}
        />

        {/* Delete Task Confirmation */}
        <ConfirmDialog
          isOpen={Boolean(deleteTaskTarget)}
          onClose={() => setDeleteTaskTarget(null)}
          onConfirm={handleConfirmDeleteTask}
          title="Delete Site Task?"
          message={`Are you sure you want to delete "${deleteTaskTarget?.title}"? Any allocated materials and progress records will be removed.`}
          confirmText="Yes, Delete Task"
          variant="danger"
        />

        {/* Delete Site Confirmation */}
        <ConfirmDialog
          isOpen={Boolean(deleteSiteTarget)}
          onClose={() => setDeleteSiteTarget(null)}
          onConfirm={handleConfirmDeleteSite}
          title="Delete Operational Site?"
          message={`Are you sure you want to delete "${deleteSiteTarget?.siteName}" from ${currentClient.companyName}?`}
          confirmText="Yes, Delete Site"
          variant="danger"
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: MAIN CLIENT MASTER DIRECTORY
  // -------------------------------------------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Client Master Directory"
        subtitle="Manage client contracts, operational sites, contracting jobs, task allocations, and receivable balances."
        icon={<Landmark size={22} />}
        actions={
          <Button
            variant="accent"
            icon={<Plus size={18} />}
            onClick={() => setIsAddClientModalOpen(true)}
          >
            Register New Client
          </Button>
        }
      />

      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard
          label="Registered Clients"
          value={clients.length}
          meta="Commercial complexes, malls, factories"
          icon={<Landmark size={22} />}
        />
        <StatCard
          label="Operational Sites"
          value={sites.length}
          meta="Site-by-site execution locations"
          icon={<Building2 size={22} />}
          iconBg="#eff6ff"
          iconColor="#2563eb"
        />
        <StatCard
          label="Total Billed"
          value={`₹${(totalBilled / 100000).toFixed(2)} L`}
          meta="Cumulative invoicing value"
          icon={<DollarSign size={22} />}
          iconBg="#f0f9ff"
          iconColor="#0284c7"
        />
        <StatCard
          label="Receivables Outstanding"
          value={`₹${(totalOutstanding / 100000).toFixed(2)} L`}
          meta="Pending client payments"
          icon={<DollarSign size={22} />}
          iconBg="#fef3c7"
          iconColor="#d97706"
        />
      </div>

      {/* Helper Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-4)',
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.88rem',
        color: '#0369a1',
        gap: 'var(--space-2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Layers size={18} />
          <span>
            <strong>Client Operations:</strong> Click on any client to view all operational sites, inspect linked contracting jobs, and manage full execution tasks.
          </span>
        </div>
      </div>

      {/* Clients DataTable */}
      <DataTable<Client>
        data={clients}
        keyExtractor={(c) => c.id}
        onRowClick={(c) => handleSelectClient(c.id)}
        searchField={(c) => `${c.companyName} ${c.contactPerson} ${c.email} ${c.gstNumber} ${c.address}`}
        searchPlaceholder="Search clients by company, contact person, email, GST..."
        columns={[
          {
            key: 'companyName',
            header: 'Client Company',
            render: (c) => (
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--color-primary)' }}>
                  {c.companyName}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)' }}>
                  GST: {c.gstNumber || 'Not Registered'}
                </div>
              </div>
            ),
          },
          {
            key: 'contact',
            header: 'Primary Contact & Email',
            render: (c) => (
              <div>
                <div style={{ fontWeight: 600 }}>{c.contactPerson || 'Direct Client'}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-600)' }}>
                  {c.email} • {c.phone}
                </div>
              </div>
            ),
          },
          {
            key: 'sites',
            header: 'Operational Sites',
            render: (c) => {
              const clientSiteList = sites.filter((s) => s.clientId === c.id);
              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: '0.86rem', color: 'var(--color-primary)' }}>
                    <Building2 size={14} color="#0284c7" />
                    <span>{clientSiteList.length} Sites</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-gray-500)', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {clientSiteList.map((s) => s.siteName).join(', ') || 'No active sites'}
                  </div>
                </div>
              );
            },
          },
          {
            key: 'linkedJobs',
            header: 'Contracting Jobs',
            render: (c) => {
              const clientJobList = jobs.filter((j) => j.clientId === c.id);
              return (
                <div style={{ fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                    <Briefcase size={14} color="#7c3aed" />
                    <span>{clientJobList.length} Jobs</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-gray-500)' }}>
                    {clientJobList.map((j) => j.id).join(', ') || 'None'}
                  </div>
                </div>
              );
            },
          },
          {
            key: 'tasksSummary',
            header: 'Active Tasks',
            render: (c) => {
              const clientSiteIdsList = sites.filter((s) => s.clientId === c.id).map((s) => s.id);
              const clientJobList = jobs.filter((j) => j.clientId === c.id).map((j) => j.id);
              const cTasks = tasks.filter(
                (t) => (t.siteId && clientSiteIdsList.includes(t.siteId)) || clientJobList.includes(t.jobId)
              );
              const done = cTasks.filter((t) => t.status === 'Completed').length;
              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: '0.84rem' }}>
                    <CheckSquare size={14} color="#059669" />
                    <span>{cTasks.length} Tasks</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: done === cTasks.length && cTasks.length > 0 ? 'var(--color-success)' : 'var(--color-gray-500)' }}>
                    {done}/{cTasks.length} Completed
                  </div>
                </div>
              );
            },
          },
          {
            key: 'totalBilled',
            header: 'Total Billed',
            render: (c) => `₹${c.totalBilled.toLocaleString('en-IN')}`,
          },
          {
            key: 'outstanding',
            header: 'Outstanding Balance',
            render: (c) => (
              <strong style={{ color: c.outstandingBalance > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                ₹{c.outstandingBalance.toLocaleString('en-IN')}
              </strong>
            ),
          },
          {
            key: 'actions',
            header: 'Manage',
            render: (c) => (
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowRight size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectClient(c.id);
                }}
              >
                Sites & Tasks
              </Button>
            ),
          },
        ]}
      />

      {/* ======================================================== */}
      {/* MODAL: REGISTER NEW CLIENT (WITH AUTO-SITE CHECKBOX)     */}
      {/* ======================================================== */}
      <Modal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        title="Register New Client Company"
        maxWidth="640px"
      >
        <form onSubmit={handleAddClient}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input
              label="Company Name *"
              placeholder="e.g. Tata Consultancy Services Ltd"
              value={formData.companyName}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  companyName: val,
                  defaultSiteName: prev.defaultSiteName && !prev.defaultSiteName.includes('Main Site')
                    ? prev.defaultSiteName
                    : val ? `${val} - Main Site` : '',
                }));
              }}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
              <Input
                label="Primary Contact Person"
                placeholder="e.g. Arvind Swamy"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
              <Input
                label="Client Email (For Quotations & Reports) *"
                type="email"
                placeholder="projects@client.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
              <Input
                label="Contact Phone"
                placeholder="+91 98401 22334"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="GST Number"
                placeholder="33AAACA1234F1Z5"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              />
            </div>

            <Input
              label="Billing / Company Address"
              placeholder="Plot 42, Guindy Estate, Chennai"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />

            {/* Checkbox for Auto-creating Default Site */}
            <div style={{
              marginTop: 'var(--space-2)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                <input
                  type="checkbox"
                  checked={formData.createDefaultSite}
                  onChange={(e) => setFormData({ ...formData, createDefaultSite: e.target.checked })}
                  style={{ width: 17, height: 17, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                />
                <span>Automatically create default site using company address</span>
              </label>

              <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-600)', paddingLeft: '25px' }}>
                Initializes an active operational site at the company's address, ready for immediate contracting jobs, material indents, and task allocations.
              </div>

              {formData.createDefaultSite && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-2)', paddingLeft: '25px' }}>
                  <Input
                    label="Default Site Name"
                    placeholder={formData.companyName ? `${formData.companyName} - Main Site` : 'Main Project Site'}
                    value={formData.defaultSiteName}
                    onChange={(e) => setFormData({ ...formData, defaultSiteName: e.target.value })}
                  />
                  <Input
                    label="Site City / Region"
                    placeholder="e.g. Chennai"
                    value={formData.defaultSiteCity}
                    onChange={(e) => setFormData({ ...formData, defaultSiteCity: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Button type="button" variant="secondary" onClick={() => setIsAddClientModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent">
                Register Client & Site
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
