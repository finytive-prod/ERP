import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  ExternalLink, 
  Download, 
  Upload, 
  Briefcase,
  Building2,
  DollarSign,
  Plus,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ERPService } from '../../services/erpStorage';
import { BOQVersion, Job } from '../../types';
import { 
  PageHeader, 
  Button, 
  DataTable, 
  Badge, 
  Card, 
  StatCard,
  Modal,
  Select,
  useToast
} from '../../components/ui';
import { BOQBuilderModal } from './BOQBuilderModal';

export const BOQListView: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [boqs, setBoqs] = useState<BOQVersion[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // BOQ Builder state
  const [isJobSelectModalOpen, setIsJobSelectModalOpen] = useState(false);
  const [selectedJobIdForBuilder, setSelectedJobIdForBuilder] = useState('');
  const [builderTargetBOQ, setBuilderTargetBOQ] = useState<BOQVersion | undefined>(undefined);
  const [isBOQBuilderOpen, setIsBOQBuilderOpen] = useState(false);

  const loadData = () => {
    const allJobs = ERPService.getJobs();
    setJobs(allJobs);
    const allBOQs: BOQVersion[] = [];
    allJobs.forEach((j) => {
      const bList = ERPService.getBOQsForJob(j.id);
      allBOQs.push(...bList);
    });
    setBoqs(allBOQs);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('apex_storage_update', loadData);
    return () => window.removeEventListener('apex_storage_update', loadData);
  }, []);

  const totalQuoted = boqs.filter((b) => b.isCurrent).reduce((sum, b) => sum + b.grandTotal, 0);

  // Find jobs without any BOQs
  const jobsWithoutBOQ = jobs.filter((j) => {
    const jBoqs = boqs.filter((b) => b.jobId === j.id);
    return jBoqs.length === 0;
  });

  const selectedJobObj = jobs.find((j) => j.id === selectedJobIdForBuilder);

  const handleOpenCreateBuilder = (jobId: string) => {
    setSelectedJobIdForBuilder(jobId);
    setBuilderTargetBOQ(undefined); // Fresh template
    setIsBOQBuilderOpen(true);
  };

  const handleOpenEditBuilder = (b: BOQVersion) => {
    setSelectedJobIdForBuilder(b.jobId);
    setBuilderTargetBOQ(b); // Edit existing BOQ
    setIsBOQBuilderOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Bill of Quantities (BOQ) & Quotations"
        subtitle="Manage multi-section electrical BOQs, version histories (v1, v2), admin rate enquiries, and client quotation exports."
        icon={<FileSpreadsheet size={22} />}
        actions={
          <Button
            variant="accent"
            icon={<Plus size={18} />}
            onClick={() => {
              if (jobsWithoutBOQ.length > 0) {
                setSelectedJobIdForBuilder(jobsWithoutBOQ[0].id);
              } else if (jobs.length > 0) {
                setSelectedJobIdForBuilder(jobs[0].id);
              }
              setIsJobSelectModalOpen(true);
            }}
          >
            + Create Full Detailed BOQ
          </Button>
        }
      />

      {/* Banner for Jobs missing BOQ */}
      {jobsWithoutBOQ.length > 0 && (
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
            <AlertTriangle size={22} color="var(--color-primary)" />
            <div>
              <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                {jobsWithoutBOQ.length} Job(s) Pending Initial BOQ
              </div>
              <div style={{ fontSize: '0.82rem', color: '#1e40af' }}>
                {jobsWithoutBOQ.map((j) => `${j.id} (${j.title})`).join('; ')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              size="sm"
              variant="accent"
              icon={<Plus size={14} />}
              onClick={() => handleOpenCreateBuilder(jobsWithoutBOQ[0].id)}
            >
              Build BOQ for {jobsWithoutBOQ[0].id}
            </Button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard
          label="Active BOQ Quotations"
          value={boqs.filter((b) => b.isCurrent).length}
          meta="Current baseline versions"
          icon={<FileSpreadsheet size={22} />}
        />
        <StatCard
          label="Total Active Quoted Value"
          value={`₹${(totalQuoted / 100000).toFixed(2)} Lakhs`}
          meta="Combined supply and erection value"
          icon={<DollarSign size={22} />}
          iconBg="#f0f9ff"
          iconColor="#0284c7"
        />
        <StatCard
          label="Total Revisions On Record"
          value={boqs.length}
          meta="Full version control history"
          icon={<Briefcase size={22} />}
        />
      </div>

      <DataTable<BOQVersion>
        data={boqs}
        keyExtractor={(b) => b.id}
        searchField={(b) => `${b.jobId} ${b.versionLabel} ${b.createdBy} ${b.status}`}
        searchPlaceholder="Search BOQs by Job ID, version..."
        columns={[
          {
            key: 'jobId',
            header: 'Linked Job Spine',
            render: (b) => {
              const j = jobs.find((x) => x.id === b.jobId);
              return (
                <div
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleOpenEditBuilder(b)}
                  title="Click to open BOQ Builder"
                >
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                    {b.jobId}
                  </span>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{j?.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>Client: {j?.clientName}</div>
                </div>
              );
            },
          },
          {
            key: 'package',
            header: 'Package & Scope',
            render: (b) => (
              <div>
                <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                  {b.title || `Package ${b.versionLabel}`}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                  {b.packageCode && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', backgroundColor: '#f1f5f9', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>
                      {b.packageCode}
                    </span>
                  )}
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-600)' }}>{b.boqType || 'Offer'}</span>
                </div>
              </div>
            ),
          },
          {
            key: 'version',
            header: 'Version',
            render: (b) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{b.versionLabel}</span>
                {b.isCurrent && <Badge status="Active" showIcon={false} variant="success" />}
              </div>
            ),
          },
          {
            key: 'sections',
            header: 'Sections & Line Items',
            render: (b) => (
              <div style={{ fontSize: '0.82rem' }}>
                {b.sections.length} Sections ({b.sections.reduce((acc, s) => acc + s.items.length, 0)} Items)
              </div>
            ),
          },
          {
            key: 'grandTotal',
            header: 'Grand Total',
            render: (b) => (
              <div>
                {b.status === 'Rates Pending' ? (
                  <span style={{ color: '#d97706', fontWeight: 800, fontSize: '0.88rem' }}>⏳ Rates Pending</span>
                ) : (
                  <strong style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>₹{b.grandTotal.toLocaleString('en-IN')}</strong>
                )}
                <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-500)' }}>
                  Supply: ₹{b.totalSupplyAmount.toLocaleString('en-IN')} | Erec: ₹{b.totalErectionAmount.toLocaleString('en-IN')}
                </div>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (b) => (
              <Badge
                status={b.status}
                variant={b.status === 'Rates Pending' ? 'warning' : b.status === 'Approved' ? 'success' : 'info'}
              />
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (b) => (
              <div style={{ display: 'flex', gap: 6 }}>
                <Button
                  size="sm"
                  variant={b.status === 'Rates Pending' ? 'accent' : 'secondary'}
                  onClick={() => handleOpenEditBuilder(b)}
                  title={b.status === 'Rates Pending' ? 'Enter Admin Rates' : 'Edit this BOQ'}
                >
                  {b.status === 'Rates Pending' ? '⚡ Fill Rates' : 'Edit / Revise'}
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<ExternalLink size={14} />}
                  onClick={() => navigate(`/jobs/${b.jobId}`)}
                  title="Open Job Hub"
                >
                  Job Hub
                </Button>
              </div>
            ),
          },
        ]}
      />

      {/* Select Job Modal before opening builder */}
      <Modal
        isOpen={isJobSelectModalOpen}
        onClose={() => setIsJobSelectModalOpen(false)}
        title="Create Full Detailed BOQ"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-gray-600)' }}>
            Choose the contracting Job to build a Bill of Quantities for:
          </p>

          <Select
            label="Target Job ID *"
            options={jobs.map((j) => {
              const hasBoq = boqs.some((b) => b.jobId === j.id);
              return {
                value: j.id,
                label: `${j.id} - ${j.title} ${hasBoq ? '(Has existing BOQ)' : '(NEW: Needs BOQ)'}`,
              };
            })}
            value={selectedJobIdForBuilder}
            onChange={(e) => setSelectedJobIdForBuilder(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button variant="secondary" onClick={() => setIsJobSelectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              icon={<Plus size={16} />}
              onClick={() => {
                setIsJobSelectModalOpen(false);
                setBuilderTargetBOQ(undefined); // Fresh template
                setIsBOQBuilderOpen(true);
              }}
            >
              Open BOQ Builder (Quotation Template)
            </Button>
          </div>
        </div>
      </Modal>

      {/* Full Detailed BOQ Builder Modal */}
      {isBOQBuilderOpen && selectedJobObj && (
        <BOQBuilderModal
          isOpen={isBOQBuilderOpen}
          onClose={() => setIsBOQBuilderOpen(false)}
          job={selectedJobObj}
          initialBOQ={builderTargetBOQ}
          onSaved={() => {
            loadData();
            setIsBOQBuilderOpen(false);
          }}
        />
      )}
    </div>
  );
};
