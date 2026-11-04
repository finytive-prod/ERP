import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  Building2, 
  MapPin, 
  Calendar,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ERPService } from '../../services/erpStorage';
import { usePermissions } from '../../services/usePermissions';
import { Job, Client, ClientSite, JobStatus } from '../../types';
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

export const JobsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Client sites state for Job creation
  const [clientSites, setClientSites] = useState<ClientSite[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [isAddingNewSite, setIsAddingNewSite] = useState(false);
  const [newSiteData, setNewSiteData] = useState({
    siteName: '',
    siteLocation: '',
    city: 'Chennai',
    siteEngineerName: 'Vignesh S',
  });

  // New Job Form State
  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    siteLocation: '',
    scope: '',
    startDate: new Date().toISOString().split('T')[0],
    targetEndDate: '',
    assignedManager: 'Tamim Ansar',
    assignedSupervisor: 'Vignesh S',
    quotedAmount: '',
    notes: '',
  });

  const loadData = () => {
    setJobs(ERPService.getJobs());
    setClients(ERPService.getClients());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('apex_storage_update', loadData);
    return () => window.removeEventListener('apex_storage_update', loadData);
  }, []);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  // Handle Client Selection -> Dynamically load that client's sites!
  const handleClientChange = (clientId: string) => {
    setFormData((prev) => ({ ...prev, clientId }));
    if (!clientId) {
      setClientSites([]);
      setSelectedSiteId('');
      setIsAddingNewSite(false);
      return;
    }

    const sites = ERPService.getClientSites(clientId);
    setClientSites(sites);

    if (sites.length > 0) {
      const defaultSite = sites[0];
      setSelectedSiteId(defaultSite.id);
      setIsAddingNewSite(false);
      setFormData((prev) => ({
        ...prev,
        clientId,
        siteLocation: defaultSite.siteLocation,
        assignedSupervisor: defaultSite.siteSupervisorName || defaultSite.siteEngineerName || prev.assignedSupervisor,
      }));
    } else {
      setSelectedSiteId('NEW');
      setIsAddingNewSite(true);
      setFormData((prev) => ({ ...prev, clientId, siteLocation: '' }));
    }
  };

  // Handle Site Selection
  const handleSiteSelect = (siteId: string) => {
    if (siteId === 'NEW') {
      setIsAddingNewSite(true);
      setSelectedSiteId('NEW');
      setFormData((prev) => ({ ...prev, siteLocation: '' }));
    } else {
      setIsAddingNewSite(false);
      setSelectedSiteId(siteId);
      const chosenSite = clientSites.find((s) => s.id === siteId);
      if (chosenSite) {
        setFormData((prev) => ({
          ...prev,
          siteLocation: chosenSite.siteLocation,
          assignedSupervisor: chosenSite.siteSupervisorName || chosenSite.siteEngineerName || prev.assignedSupervisor,
        }));
      }
    }
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.clientId || !formData.siteLocation) {
      showToast('Validation Error', 'Please fill in Job Title, Client, and Site Location.', 'danger');
      return;
    }

    const selectedClient = clients.find((c) => c.id === formData.clientId);
    let finalSiteId = selectedSiteId;
    let finalSiteName = '';

    // If creating a brand new site for this client
    if (isAddingNewSite && newSiteData.siteName.trim()) {
      const createdSite = ERPService.addClientSite({
        clientId: formData.clientId,
        clientName: selectedClient?.companyName || 'Client',
        siteName: newSiteData.siteName.trim(),
        siteLocation: newSiteData.siteLocation.trim() || formData.siteLocation,
        city: newSiteData.city || 'Chennai',
        siteEngineerName: newSiteData.siteEngineerName,
      });
      finalSiteId = createdSite.id;
      finalSiteName = createdSite.siteName;
    } else if (selectedSiteId && selectedSiteId !== 'NEW') {
      const site = clientSites.find((s) => s.id === selectedSiteId);
      if (site) finalSiteName = site.siteName;
    }

    const newJob = ERPService.createJob({
      title: formData.title,
      clientId: formData.clientId,
      clientName: selectedClient ? selectedClient.companyName : 'Unknown Client',
      clientEmail: selectedClient ? selectedClient.email : '',
      siteId: finalSiteId !== 'NEW' ? finalSiteId : undefined,
      siteName: finalSiteName || undefined,
      siteLocation: formData.siteLocation,
      scope: formData.scope,
      startDate: formData.startDate,
      targetEndDate: formData.targetEndDate || formData.startDate,
      assignedManager: formData.assignedManager,
      assignedSupervisor: formData.assignedSupervisor,
      status: 'Draft',
      quotedAmount: parseFloat(formData.quotedAmount) || 0,
      notes: formData.notes,
    });

    showToast('Job Created', `Job ${newJob.id} was created and mapped to site "${finalSiteName || newJob.siteLocation}".`, 'success');
    setIsCreateModalOpen(false);
    setSearchParams({});
    navigate(`/jobs/${newJob.id}`);
  };

  const filteredJobs = jobs.filter((j) => {
    if (statusFilter !== 'ALL' && j.status !== statusFilter) return false;
    return true;
  });

  const statuses: { value: string; label: string }[] = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'Draft', label: 'Draft' },
    { value: 'BOQ Prepared', label: 'BOQ Prepared' },
    { value: 'Rates Pending', label: 'Rates Pending' },
    { value: 'Quoted', label: 'Quoted' },
    { value: 'Approved', label: 'Approved' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Contracting Jobs (The Central Spine)"
        subtitle="Every BOQ, purchase order, stock movement, site task, employee hour, and rupee links to a unique Job ID."
        icon={<Briefcase size={22} />}
        actions={
          hasPermission('jobs.create') ? (
            <Button
              variant="accent"
              size="md"
              icon={<Plus size={18} />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create New Job
            </Button>
          ) : undefined
        }
      />

      {/* Filter Toolbar */}
      <div
        className="ui-card"
        style={{
          padding: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-600)' }}>
            <Filter size={16} /> Filter by Status:
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {statuses.map((st) => (
              <button
                key={st.value}
                type="button"
                onClick={() => setStatusFilter(st.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  fontWeight: statusFilter === st.value ? 700 : 500,
                  backgroundColor: statusFilter === st.value ? 'var(--color-primary)' : '#f1f5f9',
                  color: statusFilter === st.value ? '#ffffff' : 'var(--color-gray-700)',
                  border: '1px solid',
                  borderColor: statusFilter === st.value ? 'var(--color-primary)' : 'var(--border-light)',
                  cursor: 'pointer',
                  minHeight: 34,
                }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)', fontWeight: 600 }}>
          Showing <strong>{filteredJobs.length}</strong> of {jobs.length} Jobs
        </div>
      </div>

      {/* Jobs DataTable with responsive mobile stacked cards */}
      <DataTable<Job>
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => navigate(`/jobs/${item.id}`)}
        searchField={(item) => `${item.id} ${item.title} ${item.clientName} ${item.siteLocation}`}
        searchPlaceholder="Search jobs by ID, client, location..."
        columns={[
          {
            key: 'id',
            header: 'Job ID',
            render: (item) => (
              <div>
                <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                  {item.id}
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                  Created {item.createdAt}
                </div>
              </div>
            ),
          },
          {
            key: 'title',
            header: 'Project Title & Client',
            render: (item) => (
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-gray-900)', fontSize: '0.92rem' }}>
                  {item.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--color-gray-600)', marginTop: 2 }}>
                  <span><Building2 size={12} style={{ display: 'inline', marginRight: 2 }} /> {item.clientName}</span>
                  <span>•</span>
                  <span><MapPin size={12} style={{ display: 'inline', marginRight: 2 }} /> {item.siteLocation}</span>
                </div>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (item) => <Badge status={item.status} />,
          },
          {
            key: 'financials',
            header: 'Quoted vs Spend',
            render: (item) => {
              const pnl = ERPService.getJobPnL(item.id);
              const isOver = pnl ? pnl.isOverBudget : false;
              const pct = item.quotedAmount > 0 ? Math.round((item.actualSpend / item.quotedAmount) * 100) : 0;
              return (
                <div style={{ minWidth: 140 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 700, color: isOver ? 'var(--color-danger)' : 'var(--color-gray-800)' }}>
                      ₹{item.actualSpend.toLocaleString('en-IN')}
                    </span>
                    <span style={{ color: 'var(--color-gray-500)' }}>
                      / ₹{item.quotedAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 5, backgroundColor: '#e2e8f0', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        height: '100%',
                        backgroundColor: isOver ? 'var(--color-danger)' : 'var(--color-accent)',
                      }}
                    />
                  </div>
                  {isOver && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', color: 'var(--color-danger)', fontWeight: 700, marginTop: 2 }}>
                      <AlertTriangle size={11} /> Over Budget
                    </div>
                  )}
                </div>
              );
            },
          },
          {
            key: 'assigned',
            header: 'Assigned',
            render: (item) => (
              <div style={{ fontSize: '0.82rem' }}>
                <div>Mgr: <strong>{item.assignedManager}</strong></div>
                <div style={{ color: 'var(--color-gray-500)' }}>Sup: {item.assignedSupervisor}</div>
              </div>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (item) => {
              const jBoqs = ERPService.getBOQsForJob(item.id);
              return (
                <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  {jBoqs.length === 0 ? (
                    <Button
                      size="sm"
                      variant="accent"
                      onClick={() => navigate(`/jobs/${item.id}?tab=boq`)}
                    >
                      + Build BOQ
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/jobs/${item.id}`)}
                    >
                      Open Hub
                    </Button>
                  )}
                </div>
              );
            },
          },
        ]}
        renderMobileCard={(job) => {
          const pnl = ERPService.getJobPnL(job.id);
          const isOver = pnl ? pnl.isOverBudget : false;
          return (
            <div
              className="ui-card"
              style={{
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                    {job.id}
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-gray-900)', marginTop: 2 }}>
                    {job.title}
                  </div>
                </div>
                <Badge status={job.status} />
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>
                <div><strong>Client:</strong> {job.clientName}</div>
                <div><strong>Location:</strong> {job.siteLocation}</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: 8, borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                  <span>Spend: <strong>₹{job.actualSpend.toLocaleString('en-IN')}</strong></span>
                  <span>Quoted: ₹{job.quotedAmount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ width: '100%', height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, job.quotedAmount > 0 ? (job.actualSpend / job.quotedAmount) * 100 : 0)}%`,
                      height: '100%',
                      backgroundColor: isOver ? 'var(--color-danger)' : 'var(--color-accent)',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-gray-500)', paddingTop: 4, borderTop: '1px solid var(--border-subtle)' }}>
                <span>Supervisor: {job.assignedSupervisor}</span>
                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-primary)', fontWeight: 700 }}>
                  Open Hub <ChevronRight size={16} />
                </span>
              </div>
            </div>
          );
        }}
      />

      {/* Create Job Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSearchParams({});
        }}
        title="Create New Contracting Job"
        maxWidth="680px"
      >
        <form onSubmit={handleCreateJob}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input
              label="Project / Job Title *"
              placeholder="e.g. 11KV Substation & Distribution Panel Cabling"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
              <Select
                label="Client (from Client Master) *"
                options={[
                  { value: '', label: '-- Select Registered Client --' },
                  ...clients.map((c) => ({ value: c.id, label: `${c.companyName} (${c.contactPerson})` })),
                ]}
                value={formData.clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                required
              />

              {formData.clientId ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
                    Assigned Project Site *
                  </label>
                  <select
                    className="ui-select"
                    value={selectedSiteId}
                    onChange={(e) => handleSiteSelect(e.target.value)}
                    required
                    style={{ width: '100%', fontWeight: 600, height: 38 }}
                  >
                    {clientSites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.siteName} ({s.city || 'Site'})
                      </option>
                    ))}
                    <option value="NEW">+ Register New Site for this Client...</option>
                  </select>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', color: '#64748b', fontSize: '0.82rem', padding: '10px 0' }}>
                  👈 Select a Client to load assigned project sites
                </div>
              )}
            </div>

            {/* If adding a new site for this client */}
            {formData.clientId && isAddingNewSite && (
              <div
                style={{
                  padding: 12,
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0369a1' }}>
                  + Register New Client Site:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Input
                    label="Site / Project Name *"
                    placeholder="e.g. Apex High-Rise Residency Phase 1"
                    value={newSiteData.siteName}
                    onChange={(e) => setNewSiteData({ ...newSiteData, siteName: e.target.value })}
                    required={isAddingNewSite}
                  />
                  <Input
                    label="City / Region"
                    placeholder="e.g. Chennai / Hosur"
                    value={newSiteData.city}
                    onChange={(e) => setNewSiteData({ ...newSiteData, city: e.target.value })}
                  />
                </div>
                <Input
                  label="Site Physical Address / Location *"
                  placeholder="e.g. Plot 42, Guindy Estate, Chennai"
                  value={formData.siteLocation}
                  onChange={(e) => {
                    setFormData({ ...formData, siteLocation: e.target.value });
                    setNewSiteData({ ...newSiteData, siteLocation: e.target.value });
                  }}
                  required
                />
              </div>
            )}

            {/* If existing site selected, show site details card */}
            {formData.clientId && !isAddingNewSite && selectedSiteId && (
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>Assigned Site Location:</span>{' '}
                  <strong style={{ color: '#0f172a' }}>{formData.siteLocation}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingNewSite(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}
                >
                  + Add Different Site
                </button>
              </div>
            )}

            <div className="ui-form-group">
              <label className="ui-label">Scope of Work</label>
              <textarea
                className="ui-input ui-textarea"
                rows={3}
                placeholder="Describe scope: transformers, cable tray runs, number of points, panels..."
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
              <Input
                type="date"
                label="Start Date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <Input
                type="date"
                label="Target Completion Date"
                value={formData.targetEndDate}
                onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
              <Select
                label="Assigned Project Manager"
                options={[
                  { value: 'Tamim Ansar', label: 'Tamim Ansar (Admin)' },
                  { value: 'Karthik Raja', label: 'Karthik Raja (Manager)' },
                ]}
                value={formData.assignedManager}
                onChange={(e) => setFormData({ ...formData, assignedManager: e.target.value })}
              />
              <Select
                label="Assigned Site Supervisor"
                options={[
                  { value: 'Vignesh S', label: 'Vignesh S (Supervisor)' },
                  { value: 'Rajesh Verma', label: 'Rajesh Verma (Foreman)' },
                ]}
                value={formData.assignedSupervisor}
                onChange={(e) => setFormData({ ...formData, assignedSupervisor: e.target.value })}
              />
            </div>

            <Input
              type="number"
              label="Estimated / Initial Quoted Amount (₹)"
              placeholder="e.g. 1450000 (Can be updated via BOQ)"
              value={formData.quotedAmount}
              onChange={(e) => setFormData({ ...formData, quotedAmount: e.target.value })}
              suffix="INR"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setSearchParams({});
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="accent" icon={<Plus size={18} />}>
                Create Job & Open Hub
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
