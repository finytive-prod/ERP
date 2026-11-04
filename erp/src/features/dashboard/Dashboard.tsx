import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  AlertTriangle, 
  CheckCircle2, 
  ShoppingCart, 
  Boxes, 
  TrendingUp, 
  Users, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  Plus,
  CheckSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ERPService } from '../../services/erpStorage';
import { Job, PurchaseOrder, MaterialRequest, StockLedgerItem, SiteTask } from '../../types';
import { PageHeader, StatCard, Card, Badge, Button, DataTable } from '../../components/ui';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = ERPService.getCurrentUser();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrder[]>([]);
  const [pendingRequests, setPendingRequests] = useState<MaterialRequest[]>([]);
  const [lowStockItems, setLowStockItems] = useState<StockLedgerItem[]>([]);
  const [tasks, setTasks] = useState<SiteTask[]>([]);

  const loadData = () => {
    const allJobs = ERPService.getJobs();
    setJobs(allJobs);
    setPendingPOs(ERPService.getPurchases().filter((p) => p.status === 'Pending Approval'));
    setPendingRequests(ERPService.getMaterialRequests().filter((r) => r.status === 'Pending'));
    setLowStockItems(ERPService.getStockLedger().filter((s) => s.stockOnSite <= s.minStockLevel && s.minStockLevel > 0));
    setTasks(ERPService.getTasks().filter((t) => t.status !== 'Completed'));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('apex_storage_update', loadData);
    return () => window.removeEventListener('apex_storage_update', loadData);
  }, []);

  const totalQuoted = jobs.reduce((sum, j) => sum + j.quotedAmount, 0);
  const totalSpend = jobs.reduce((sum, j) => sum + j.actualSpend, 0);
  const activeJobs = jobs.filter((j) => j.status === 'In Progress' || j.status === 'Approved');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header with Welcome and Primary Action */}
      <PageHeader
        title={`Welcome back, ${currentUser.name}`}
        subtitle={`Role: ${currentUser.role} | Real-time Electrical Contracting Job Tracking`}
        badge={<Badge status={currentUser.role} showIcon={false} />}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button
              variant="accent"
              icon={<Plus size={18} />}
              onClick={() => navigate('/jobs?create=true')}
            >
              Create New Job
            </Button>
            <Button
              variant="secondary"
              icon={<ShoppingCart size={18} />}
              onClick={() => navigate('/purchases?create=true')}
            >
              Raise Purchase
            </Button>
          </div>
        }
      />

      {/* Critical Approval Alerts Banner (If any approvals pending) */}
      {(pendingPOs.length > 0 || pendingRequests.length > 0) && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4) var(--space-5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: 'var(--color-warning-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-warning)',
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.98rem' }}>
                Action Required: {pendingPOs.length + pendingRequests.length} Pending Approval Request(s)
              </div>
              <div style={{ fontSize: '0.85rem', color: '#b45309' }}>
                {pendingPOs.length} Purchase Order(s) exceeding BOQ limits & {pendingRequests.length} Extra Material Request(s) from site.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {pendingPOs.length > 0 && (
              <Button size="sm" variant="accent" onClick={() => navigate('/purchases')}>
                Review POs ({pendingPOs.length})
              </Button>
            )}
            {pendingRequests.length > 0 && (
              <Button size="sm" variant="primary" onClick={() => navigate('/tasks')}>
                Review Requests ({pendingRequests.length})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Key Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <StatCard
          label="Active Contracting Jobs"
          value={activeJobs.length}
          meta={`${jobs.length} Total Jobs on Record`}
          icon={<Briefcase size={24} />}
          iconBg="var(--color-primary-subtle)"
          iconColor="var(--color-primary)"
          onClick={() => navigate('/jobs')}
        />
        <StatCard
          label="Total Quoted Pipeline"
          value={`₹${(totalQuoted / 100000).toFixed(2)} L`}
          meta={`Across ${jobs.length} projects`}
          icon={<TrendingUp size={24} />}
          iconBg="#ecfdf5"
          iconColor="#059669"
          onClick={() => navigate('/reports/pnl')}
        />
        <StatCard
          label="Actual Total Spend"
          value={`₹${(totalSpend / 100000).toFixed(2)} L`}
          meta={`Materials + Labour + Logistics`}
          icon={<ShoppingCart size={24} />}
          iconBg="#fef3c7"
          iconColor="#d97706"
          onClick={() => navigate('/reports/pnl')}
        />
        <StatCard
          label="Low Stock Alerts"
          value={lowStockItems.length}
          meta={lowStockItems.length > 0 ? 'Below safety threshold' : 'All levels adequate'}
          icon={<Boxes size={24} />}
          iconBg={lowStockItems.length > 0 ? '#fef2f2' : '#f0fdf4'}
          iconColor={lowStockItems.length > 0 ? '#dc2626' : '#16a34a'}
          onClick={() => navigate('/inventory')}
        />
      </div>

      {/* Active Jobs Hub Preview & Quick Jump */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Active Jobs Card */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={18} color="var(--color-primary)" />
              <span>Active Contracting Jobs (Spine)</span>
            </div>
          }
          action={
            <Button size="sm" variant="ghost" onClick={() => navigate('/jobs')} icon={<ArrowRight size={14} />} iconPosition="right">
              View All Jobs
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {activeJobs.map((job) => {
              const pnl = ERPService.getJobPnL(job.id);
              const isOver = pnl ? pnl.isOverBudget : false;
              return (
                <div
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    backgroundColor: '#ffffff',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-light)';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                        {job.id}
                      </span>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-gray-900)', marginTop: 2 }}>
                        {job.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-600)' }}>
                        Client: {job.clientName} | Site: {job.siteLocation}
                      </div>
                    </div>
                    <Badge status={job.status} />
                  </div>

                  {/* Progress & Budget Bar */}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                      <span style={{ color: 'var(--color-gray-600)' }}>
                        Spend: <strong>₹{job.actualSpend.toLocaleString('en-IN')}</strong> / Quoted: ₹{job.quotedAmount.toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontWeight: 700, color: isOver ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                        {job.quotedAmount > 0 ? Math.round((job.actualSpend / job.quotedAmount) * 100) : 0}% Budget
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, job.quotedAmount > 0 ? (job.actualSpend / job.quotedAmount) * 100 : 0)}%`,
                          height: '100%',
                          backgroundColor: isOver ? 'var(--color-danger)' : 'var(--color-accent)',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Site Tasks & Material Actions */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckSquare size={18} color="var(--color-primary)" />
              <span>Today's Site Execution & Tasks</span>
            </div>
          }
          action={
            <Button size="sm" variant="ghost" onClick={() => navigate('/tasks')} icon={<ArrowRight size={14} />} iconPosition="right">
              View Tasks
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-primary)' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', marginTop: 2 }}>
                    Job: <strong>{task.jobId}</strong> | Supervisor: {task.assignedSupervisor}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-700)', marginTop: 4 }}>
                    Progress: <strong>{task.completedQty}</strong> / {task.targetQty} {task.unit} completed
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge status={task.status} />
                  <div style={{ marginTop: 8 }}>
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/tasks?taskId=${task.id}`)}>
                      Update Log
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
