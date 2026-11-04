import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  Calendar,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { ERPService } from '../../services/erpStorage';
import { AuditLogEntry, Job } from '../../types';
import { 
  PageHeader, 
  DataTable, 
  Badge, 
  Card, 
  Timeline 
} from '../../components/ui';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filterJob, setFilterJob] = useState('ALL');
  const [filterAction, setFilterAction] = useState('ALL');

  const loadData = () => {
    setLogs(ERPService.getAuditLogs());
    setJobs(ERPService.getJobs());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('apex_storage_update', loadData);
    return () => window.removeEventListener('apex_storage_update', loadData);
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (filterJob !== 'ALL' && l.jobId !== filterJob) return false;
    if (filterAction !== 'ALL' && l.action !== filterAction) return false;
    return true;
  });

  const actions = Array.from(new Set(logs.map((l) => l.action)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Global Audit Trail & Compliance Log"
        subtitle="Immutable single source of truth tracking every sensitive operation: price changes, approvals, status updates, and material allocations."
        icon={<History size={22} />}
      />

      {/* Filter Bar */}
      <div
        className="ui-card"
        style={{
          padding: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-gray-600)', marginBottom: 4 }}>
              Filter by Job ID:
            </label>
            <select
              value={filterJob}
              onChange={(e) => setFilterJob(e.target.value)}
              style={{
                height: 38,
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                fontSize: '0.88rem',
              }}
            >
              <option value="ALL">All Jobs</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.id} - {j.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-gray-600)', marginBottom: 4 }}>
              Filter by Action Type:
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              style={{
                height: 38,
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                fontSize: '0.88rem',
              }}
            >
              <option value="ALL">All Actions</option>
              {actions.map((act) => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)', fontWeight: 600 }}>
          Showing <strong>{filteredLogs.length}</strong> logged entries
        </div>
      </div>

      {/* Audit Log Table */}
      <DataTable<AuditLogEntry>
        data={filteredLogs}
        keyExtractor={(l) => l.id}
        searchField={(l) => `${l.action} ${l.entity} ${l.userName} ${l.jobId || ''} ${l.reason || ''}`}
        searchPlaceholder="Search audit entries..."
        columns={[
          {
            key: 'timestamp',
            header: 'Timestamp',
            render: (l) => (
              <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--color-gray-600)' }}>
                {l.timestamp}
              </span>
            ),
          },
          {
            key: 'action',
            header: 'Action & Entity',
            render: (l) => (
              <div>
                <Badge status={l.action} showIcon={false} />
                <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)', marginTop: 2 }}>{l.entity} ({l.entityId})</div>
              </div>
            ),
          },
          {
            key: 'user',
            header: 'Authorized By',
            render: (l) => (
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{l.userName}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-500)' }}>{l.role}</div>
              </div>
            ),
          },
          {
            key: 'jobId',
            header: 'Job ID Spine',
            render: (l) =>
              l.jobId ? (
                <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                  {l.jobId}
                </span>
              ) : (
                <span style={{ color: 'var(--color-gray-400)' }}>General</span>
              ),
          },
          {
            key: 'values',
            header: 'Value Modification',
            render: (l) => (
              <div style={{ fontSize: '0.82rem', maxWidth: 260 }}>
                {l.oldValue && <div>Old: <span style={{ textDecoration: 'line-through', color: 'var(--color-gray-500)' }}>{l.oldValue}</span></div>}
                {l.newValue && <div>New: <strong>{l.newValue}</strong></div>}
              </div>
            ),
          },
          {
            key: 'reason',
            header: 'Mandatory Reason Logged',
            render: (l) => (
              <div style={{ fontSize: '0.83rem', color: 'var(--color-gray-800)', maxWidth: 300, fontStyle: 'italic' }}>
                "{l.reason}"
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};
