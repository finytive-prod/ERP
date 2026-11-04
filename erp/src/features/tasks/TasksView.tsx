import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Briefcase,
  Users,
  Layers,
  Boxes,
  Calendar,
  Building2,
  Filter,
  Search,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ERPService } from '../../services/erpStorage';
import { SiteTask, MaterialRequest, Job, ItemMaster, ClientSite } from '../../types';
import { 
  PageHeader, 
  Button, 
  DataTable, 
  Badge, 
  Modal, 
  Tabs, 
  Card, 
  useToast, 
  Input, 
  Select 
} from '../../components/ui';
import { TaskBOQSplitModal } from './TaskBOQSplitModal';
import { TaskAllocationModal } from './TaskAllocationModal';
import { CreateTaskModal } from './CreateTaskModal';

export const TasksView: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState<SiteTask[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sites, setSites] = useState<ClientSite[]>([]);
  const [items, setItems] = useState<ItemMaster[]>([]);

  const [activeTab, setActiveTab] = useState<'tasks' | 'requests'>('tasks');

  // Filters
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>(
    searchParams.get('siteId') || 'ALL'
  );
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>(
    searchParams.get('jobId') || 'ALL'
  );
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state
  const [isBOQSplitModalOpen, setIsBOQSplitModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [selectedTaskForAllocation, setSelectedTaskForAllocation] = useState<SiteTask | undefined>(undefined);

  // Extra Material Request Modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    jobId: '',
    taskId: '',
    itemId: '',
    requestedExtraQty: '',
    reason: '',
  });

  const loadData = () => {
    setTasks(ERPService.getTasks());
    setMaterialRequests(ERPService.getMaterialRequests());
    setJobs(ERPService.getJobs());
    setSites(ERPService.getClientSites());
    setItems(ERPService.getItems());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('apex_storage_update', loadData);
    return () => window.removeEventListener('apex_storage_update', loadData);
  }, []);

  // Update selectedTaskForAllocation when tasks change
  useEffect(() => {
    if (selectedTaskForAllocation) {
      const fresh = tasks.find((t) => t.id === selectedTaskForAllocation.id);
      if (fresh) setSelectedTaskForAllocation(fresh);
    }
  }, [tasks]);

  const handleOpenAllocationModal = (task: SiteTask) => {
    setSelectedTaskForAllocation(task);
    setIsAllocationModalOpen(true);
  };

  const handleCreateExtraRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.jobId || !requestForm.itemId || !requestForm.requestedExtraQty || !requestForm.reason.trim()) {
      showToast('Validation Error', 'Please fill in Job, Item, Quantity, and Measured Reason.', 'danger');
      return;
    }
    const itm = items.find((i) => i.id === requestForm.itemId);
    const tsk = tasks.find((t) => t.id === requestForm.taskId);
    if (!itm) return;

    ERPService.requestExtraMaterial({
      jobId: requestForm.jobId,
      taskId: requestForm.taskId || undefined,
      taskTitle: tsk ? tsk.title : undefined,
      itemId: itm.id,
      itemName: itm.name,
      unit: itm.unit,
      allowedQty: 10,
      alreadyIssuedQty: 10,
      requestedExtraQty: parseFloat(requestForm.requestedExtraQty),
      reason: requestForm.reason.trim(),
      usageHistory: `Exhausted allocated material on job ${requestForm.jobId}`,
    });

    showToast('Request Submitted', 'Extra material request submitted to Admin.', 'success');
    setIsRequestModalOpen(false);
    setRequestForm({
      jobId: '',
      taskId: '',
      itemId: '',
      requestedExtraQty: '',
      reason: '',
    });
  };

  const handleApproveRequest = (req: MaterialRequest) => {
    const reason = window.prompt(`Approve extra material (+${req.requestedExtraQty} ${req.unit} ${req.itemName})?\nEnter approval justification:`, 'Site inspection verified requirement');
    if (reason) {
      ERPService.approveMaterialRequest(req.id, reason);
      showToast('Request Approved', 'Extra material request approved by Admin.', 'success');
    }
  };

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (selectedSiteFilter !== 'ALL') {
        if (task.siteId !== selectedSiteFilter) return false;
      }
      if (selectedJobFilter !== 'ALL') {
        if (task.jobId !== selectedJobFilter) return false;
      }
      if (statusFilter !== 'ALL') {
        if (task.status !== statusFilter) return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(query);
        const matchDesc = task.description.toLowerCase().includes(query);
        const matchSupervisor = task.assignedSupervisor.toLowerCase().includes(query);
        const matchBoq = task.boqSectionTitle?.toLowerCase().includes(query);
        const matchJob = task.jobId.toLowerCase().includes(query);
        const matchSite = task.siteName?.toLowerCase().includes(query);
        const matchMat = (task.allocatedMaterials || []).some((m) => m.itemName.toLowerCase().includes(query));
        const matchMember = (task.memberAssignments || []).some((m) => m.memberName.toLowerCase().includes(query));
        if (!matchTitle && !matchDesc && !matchSupervisor && !matchBoq && !matchJob && !matchSite && !matchMat && !matchMember) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, selectedSiteFilter, selectedJobFilter, statusFilter, searchTerm]);

  const pendingRequestsCount = materialRequests.filter((r) => r.status === 'Pending').length;

  // Stats
  const totalTasksCount = tasks.length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const totalMaterialsAllocated = tasks.reduce((acc, t) => acc + (t.allocatedMaterials?.length || 0), 0);
  const totalMemberShifts = tasks.reduce((acc, t) => acc + (t.memberAssignments?.length || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Site Task Execution & Material Allocation"
        subtitle="Create tasks site-by-site, split work packages from BOQ quotation (Transformers, DBs, Fans), allocate on-site stock, and schedule workers date-wise."
        icon={<CheckSquare size={22} />}
        actions={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              icon={<Layers size={16} />}
              onClick={() => setIsBOQSplitModalOpen(true)}
              style={{ fontWeight: 700 }}
            >
              ⚡ Split Tasks from BOQ
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setIsCreateTaskModalOpen(true)}
            >
              + Create Site Task
            </Button>
            <Button
              variant="secondary"
              icon={<AlertTriangle size={16} />}
              onClick={() => setIsRequestModalOpen(true)}
            >
              Request Extra Material
            </Button>
          </div>
        }
      />

      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="ui-card" style={{ padding: 16, borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Total Site Tasks
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
            {totalTasksCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
            Across {sites.length} project sites
          </div>
        </div>

        <div className="ui-card" style={{ padding: 16, borderLeft: '4px solid #0284c7' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            In Progress Execution
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', marginTop: 4 }}>
            {inProgressCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
            Active on site today
          </div>
        </div>

        <div className="ui-card" style={{ padding: 16, borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Completed Tasks
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
            {completedCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
            Finished & verified
          </div>
        </div>

        <div className="ui-card" style={{ padding: 16, borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Materials Allocated
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', marginTop: 4 }}>
            {totalMaterialsAllocated}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
            Items mapped to tasks
          </div>
        </div>

        <div className="ui-card" style={{ padding: 16, borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Member Date Shifts
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed', marginTop: 4 }}>
            {totalMemberShifts}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
            Date-wise worker schedules
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
        tabs={[
          { id: 'tasks', label: '1. Site Tasks & Material Workspace', icon: <CheckSquare size={16} />, badge: filteredTasks.length },
          { id: 'requests', label: '2. Extra Material Requests', icon: <AlertTriangle size={16} />, badge: pendingRequestsCount },
        ]}
      />

      {/* TAB 1: SITE TASKS */}
      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Filters Bar: Site-by-site, Job, Status, Search */}
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
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
              {/* Site Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={16} color="var(--color-primary)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Site:</span>
                <select
                  className="ui-select"
                  value={selectedSiteFilter}
                  onChange={(e) => {
                    const s = e.target.value;
                    setSelectedSiteFilter(s);
                    setSelectedJobFilter('ALL');
                  }}
                  style={{ height: 36, fontSize: '0.84rem', fontWeight: 700, minWidth: 200 }}
                >
                  <option value="ALL">All Project Sites ({sites.length})</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.siteName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Briefcase size={16} color="#64748b" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Job:</span>
                <select
                  className="ui-select"
                  value={selectedJobFilter}
                  onChange={(e) => setSelectedJobFilter(e.target.value)}
                  style={{ height: 36, fontSize: '0.84rem', minWidth: 160 }}
                >
                  <option value="ALL">All Contract Jobs</option>
                  {(selectedSiteFilter !== 'ALL' ? ERPService.getJobsForSite(selectedSiteFilter) : jobs).map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.id} - {j.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Filter size={16} color="#64748b" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Status:</span>
                <select
                  className="ui-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ height: 36, fontSize: '0.84rem', minWidth: 130 }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div style={{ minWidth: 240, position: 'relative' }}>
              <input
                type="text"
                className="ui-input"
                placeholder="Search task, material, worker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', height: 36, paddingLeft: 32, fontSize: '0.84rem' }}
              />
              <Search
                size={16}
                color="#94a3b8"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Tasks List */}
          {filteredTasks.length === 0 ? (
            <div
              className="ui-card"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                borderRadius: 8,
              }}
            >
              <CheckSquare size={48} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                No site tasks match the current filter
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4, maxWidth: 440, margin: '4px auto 16px' }}>
                Create a task site-by-site, or use "Split Tasks from BOQ" to generate tasks from the industrial offer quotation (Transformers, Cable Trays, Mancooler Fans).
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <Button
                  variant="primary"
                  icon={<Layers size={16} />}
                  onClick={() => setIsBOQSplitModalOpen(true)}
                >
                  Split Tasks from BOQ
                </Button>
                <Button
                  variant="secondary"
                  icon={<Plus size={16} />}
                  onClick={() => setIsCreateTaskModalOpen(true)}
                >
                  Create Task Site by Site
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filteredTasks.map((task) => {
                const pct = Math.round((task.completedQty / Math.max(1, task.targetQty)) * 100);
                const allocatedMats = task.allocatedMaterials || [];
                const memberAssignments = task.memberAssignments || [];

                return (
                  <div
                    key={task.id}
                    className="ui-card"
                    style={{
                      padding: '18px 20px',
                      backgroundColor: '#ffffff',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    {/* Top Row: Job, Site, Title, Status & Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 280 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}>
                            {task.jobId}
                          </span>
                          {task.siteName && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '2px 8px',
                                borderRadius: 12,
                                fontSize: '0.72rem',
                                backgroundColor: '#f1f5f9',
                                color: '#334155',
                                fontWeight: 700,
                              }}
                            >
                              📍 {task.siteName}
                            </span>
                          )}
                          {task.boqSectionTitle && (
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 12,
                                fontSize: '0.72rem',
                                backgroundColor: '#eff6ff',
                                color: '#1e40af',
                                fontWeight: 800,
                                border: '1px solid #bfdbfe',
                              }}
                            >
                              BOQ: {task.boqSectionTitle}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                          {task.title}
                        </div>

                        {task.description && (
                          <div style={{ fontSize: '0.84rem', color: '#475569', marginTop: 4, lineHeight: 1.4 }}>
                            {task.description}
                          </div>
                        )}

                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 6, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          <span>Supervisor: <strong>{task.assignedSupervisor}</strong></span>
                          <span>•</span>
                          <span>Target Due: <strong>{task.targetDate}</strong></span>
                        </div>
                      </div>

                      {/* Status and Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <Badge status={task.status} />
                        <Button
                          size="sm"
                          variant="primary"
                          icon={<Boxes size={14} />}
                          onClick={() => handleOpenAllocationModal(task)}
                          style={{ fontWeight: 700 }}
                        >
                          Manage Materials & Workers →
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: 4 }}>
                        <span style={{ color: '#475569' }}>
                          Target: <strong>{task.targetQty} {task.unit}</strong> | Completed: <strong>{task.completedQty} {task.unit}</strong>
                        </span>
                        <span style={{ fontWeight: 800, color: pct >= 100 ? '#16a34a' : 'var(--color-primary)' }}>
                          {pct}% Completed
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 7, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, pct)}%`,
                            height: '100%',
                            backgroundColor: pct >= 100 ? '#16a34a' : 'var(--color-primary)',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* Two-column overview: Allocated Materials & Date-wise Member Deployment */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginTop: 14 }}>
                      {/* Allocated Materials */}
                      <div
                        style={{
                          padding: '10px 14px',
                          backgroundColor: '#f8fafc',
                          borderRadius: 6,
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Boxes size={14} color="var(--color-primary)" />
                            Allocated Materials ({allocatedMats.length}):
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenAllocationModal(task)}
                            style={{ fontSize: '0.72rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                          >
                            + Allocate More
                          </button>
                        </div>

                        {allocatedMats.length === 0 ? (
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            No materials allocated yet. Click "+ Allocate More" to link site store inventory.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {allocatedMats.map((mat) => (
                              <span
                                key={mat.id}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  fontSize: '0.74rem',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  color: '#0f172a',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <strong>{mat.allocatedQty} {mat.unit}</strong> {mat.itemName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Date-wise Member Deployment */}
                      <div
                        style={{
                          padding: '10px 14px',
                          backgroundColor: '#f8fafc',
                          borderRadius: 6,
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Calendar size={14} color="#16a34a" />
                            Date-wise Worker Allocation ({memberAssignments.length}):
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenAllocationModal(task)}
                            style={{ fontSize: '0.72rem', color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                          >
                            + Schedule Member
                          </button>
                        </div>

                        {memberAssignments.length === 0 ? (
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            No workers scheduled for this task yet.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {memberAssignments.slice(0, 4).map((m) => (
                              <span
                                key={m.id}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  fontSize: '0.74rem',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid #bbf7d0',
                                  color: '#166534',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                📅 <strong>{m.assignedDate}:</strong> {m.memberName} ({m.role})
                              </span>
                            ))}
                            {memberAssignments.length > 4 && (
                              <span style={{ fontSize: '0.72rem', color: '#64748b', alignSelf: 'center' }}>
                                +{memberAssignments.length - 4} more
                              </span>
                            )}
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

      {/* TAB 2: EXTRA MATERIAL REQUESTS */}
      {activeTab === 'requests' && (
        <DataTable<MaterialRequest>
          data={materialRequests}
          keyExtractor={(r) => r.id}
          searchField={(r) => `${r.jobId} ${r.itemName} ${r.requestedBy} ${r.reason}`}
          searchPlaceholder="Search material requests..."
          columns={[
            {
              key: 'jobId',
              header: 'Job ID & Task',
              render: (r) => (
                <div>
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{r.jobId}</span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-600)' }}>{r.taskTitle || 'General Job Work'}</div>
                </div>
              ),
            },
            {
              key: 'item',
              header: 'Requested Extra Material',
              render: (r) => (
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-accent-text)' }}>
                    +{r.requestedExtraQty} {r.unit} ({r.itemName})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                    Allowed limit: {r.allowedQty} {r.unit}
                  </div>
                </div>
              ),
            },
            {
              key: 'reason',
              header: 'Measured Justification & Usage',
              render: (r) => (
                <div style={{ maxWidth: 320, fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 600 }}>{r.reason}</div>
                  <div style={{ color: 'var(--color-gray-500)', fontSize: '0.75rem' }}>{r.usageHistory}</div>
                </div>
              ),
            },
            {
              key: 'requestedBy',
              header: 'Requester',
              render: (r) => (
                <div style={{ fontSize: '0.82rem' }}>
                  <div>{r.requestedBy}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>{r.requestedAt}</div>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <Badge status={r.status} />,
            },
            {
              key: 'actions',
              header: 'Action',
              render: (r) =>
                r.status === 'Pending' ? (
                  <Button size="sm" variant="accent" onClick={() => handleApproveRequest(r)}>
                    Approve
                  </Button>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)' }}>
                    {r.approvedBy ? `Approved by ${r.approvedBy}` : 'Processed'}
                  </span>
                ),
            },
          ]}
        />
      )}

      {/* MODAL 1: SPLIT TASKS FROM BOQ */}
      <TaskBOQSplitModal
        isOpen={isBOQSplitModalOpen}
        onClose={() => setIsBOQSplitModalOpen(false)}
        defaultSiteId={selectedSiteFilter !== 'ALL' ? selectedSiteFilter : undefined}
        defaultJobId={selectedJobFilter !== 'ALL' ? selectedJobFilter : undefined}
        onTasksCreated={loadData}
      />

      {/* MODAL 2: CREATE TASK SITE-BY-SITE */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        defaultSiteId={selectedSiteFilter !== 'ALL' ? selectedSiteFilter : undefined}
        defaultJobId={selectedJobFilter !== 'ALL' ? selectedJobFilter : undefined}
        onTaskCreated={loadData}
      />

      {/* MODAL 3: TASK ALLOCATION MODAL (Materials & Date-wise Workers) */}
      <TaskAllocationModal
        isOpen={isAllocationModalOpen}
        onClose={() => {
          setIsAllocationModalOpen(false);
          setSelectedTaskForAllocation(undefined);
        }}
        task={selectedTaskForAllocation}
        onTaskUpdated={loadData}
      />

      {/* MODAL 4: EXTRA MATERIAL REQUEST MODAL */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Raise Extra Material Requisition"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateExtraRequest} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: 12, borderRadius: 6, fontSize: '0.84rem', color: '#92400e' }}>
            Requisitioning extra material beyond the approved BOQ limit requires Admin sign-off with clear justification.
          </div>

          <Select
            label="Target Contract Job"
            value={requestForm.jobId}
            onChange={(e) => setRequestForm({ ...requestForm, jobId: e.target.value })}
            options={jobs.map((j) => ({ label: `${j.id} - ${j.title}`, value: j.id }))}
            required
          />

          <Select
            label="Specific Site Task"
            value={requestForm.taskId}
            onChange={(e) => setRequestForm({ ...requestForm, taskId: e.target.value })}
            options={[
              { label: 'General / No specific task', value: '' },
              ...tasks.filter((t) => !requestForm.jobId || t.jobId === requestForm.jobId).map((t) => ({ label: `${t.id} - ${t.title}`, value: t.id })),
            ]}
          />

          <Select
            label="Material Item Required"
            value={requestForm.itemId}
            onChange={(e) => setRequestForm({ ...requestForm, itemId: e.target.value })}
            options={items.map((i) => ({ label: `${i.name} (${i.unit})`, value: i.id }))}
            required
          />

          <Input
            label="Requested Extra Quantity"
            type="number"
            value={requestForm.requestedExtraQty}
            onChange={(e) => setRequestForm({ ...requestForm, requestedExtraQty: e.target.value })}
            placeholder="Quantity to request"
            required
          />

          <Input
            label="Reason / Field Justification"
            value={requestForm.reason}
            onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
            placeholder="e.g. Architect layout change, extra conduit run required"
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={() => setIsRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" type="submit">
              Submit Requisition
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
