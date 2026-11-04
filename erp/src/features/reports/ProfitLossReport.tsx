import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  DollarSign, 
  Building2, 
  Briefcase, 
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { ERPService } from '../../services/erpStorage';
import { Job, Client } from '../../types';
import { 
  PageHeader, 
  Button, 
  DataTable, 
  Badge, 
  StatCard, 
  Card,
  ChartWrapper,
  useToast
} from '../../components/ui';

export const ProfitLossReport: React.FC = () => {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const loadData = () => {
    setJobs(ERPService.getJobs());
    setClients(ERPService.getClients());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('apex_storage_update', loadData);
    return () => window.removeEventListener('apex_storage_update', loadData);
  }, []);

  const jobPnLs = jobs.map((j) => {
    const p = ERPService.getJobPnL(j.id);
    return {
      job: j,
      pnl: p,
    };
  });

  const totalQuoted = jobs.reduce((sum, j) => sum + j.quotedAmount, 0);
  const totalActualCost = jobPnLs.reduce((sum, j) => sum + (j.pnl?.totalActualCost || 0), 0);
  const netProfit = totalQuoted - totalActualCost;
  const overallMargin = totalQuoted > 0 ? (netProfit / totalQuoted) * 100 : 0;

  // Chart data: Job P&L Comparison
  const chartData = jobPnLs.map((j) => ({
    label: j.job.id.replace('JOB-2026-', 'J-'),
    value: Math.max(0, j.pnl?.profit || 0),
    secondaryValue: j.pnl?.totalActualCost || 0,
  }));

  const handleExportCSV = () => {
    let csv = 'Job ID,Project Title,Client,Quoted Revenue (INR),Actual Material Spend,Transportation Spend,Labour Spend,Petty Cash Spend,Other Spend,Total Cost (INR),Net Profit / Loss (INR),Margin %\n';
    jobPnLs.forEach(({ job, pnl }) => {
      if (!pnl) return;
      csv += `"${job.id}","${job.title.replace(/"/g, '""')}","${job.clientName}",${pnl.quotedRevenue},${pnl.materialSpend},${pnl.transportSpend},${pnl.laborSpend},${pnl.pettyCashSpend},${pnl.otherSpend},${pnl.totalActualCost},${pnl.profit},${pnl.marginPct.toFixed(2)}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Apex_Contracting_PnL_Report.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported', 'P&L CSV downloaded successfully.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Profit & Loss Reports (By Job & Overall)"
        subtitle="Revenue (approved quote) minus actual costs (material, transport, labour, petty cash, other) yields accurate real-time profit margins."
        icon={<TrendingUp size={22} />}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              icon={<Download size={16} />}
              onClick={() => window.print()}
            >
              Print Report
            </Button>
            <Button
              variant="accent"
              icon={<Download size={16} />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Top Level Financial Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard
          label="Total Quoted Pipeline"
          value={`₹${(totalQuoted / 100000).toFixed(2)} Lakhs`}
          meta={`Across ${jobs.length} projects`}
          icon={<DollarSign size={22} />}
        />
        <StatCard
          label="Total Actual Spend"
          value={`₹${(totalActualCost / 100000).toFixed(2)} Lakhs`}
          meta="Materials + Labour + Logistics"
          icon={<DollarSign size={22} />}
          iconBg="#fef3c7"
          iconColor="#d97706"
        />
        <StatCard
          label="Cumulative Net Profit"
          value={`₹${(netProfit / 100000).toFixed(2)} Lakhs`}
          meta={`Average Margin: ${overallMargin.toFixed(1)}%`}
          icon={<TrendingUp size={22} />}
          iconBg={netProfit >= 0 ? '#ecfdf5' : '#fef2f2'}
          iconColor={netProfit >= 0 ? '#059669' : '#dc2626'}
        />
      </div>

      {/* P&L Comparison Chart */}
      <ChartWrapper
        title="Projected Profit by Job ID"
        subtitle="Visual representation of margin profitability across current contracting jobs"
        type="bar"
        data={chartData}
        valuePrefix="₹"
        primaryLabel="Net Profit"
      />

      {/* Detailed P&L Breakdown Table */}
      <Card title="Contracting Jobs Profit & Loss Ledger">
        <DataTable
          data={jobPnLs}
          keyExtractor={(item) => item.job.id}
          searchField={(item) => `${item.job.id} ${item.job.title} ${item.job.clientName}`}
          searchPlaceholder="Search P&L by Job ID or client..."
          columns={[
            {
              key: 'id',
              header: 'Job ID & Client',
              render: ({ job }) => (
                <div>
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                    {job.id}
                  </span>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-gray-900)' }}>{job.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>Client: {job.clientName}</div>
                </div>
              ),
            },
            {
              key: 'quoted',
              header: 'Quoted Revenue',
              render: ({ pnl }) => <strong>₹{(pnl?.quotedRevenue || 0).toLocaleString('en-IN')}</strong>,
            },
            {
              key: 'actualSpend',
              header: 'Total Actual Spend',
              render: ({ pnl }) => (
                <div>
                  <div style={{ fontWeight: 700, color: pnl?.isOverBudget ? 'var(--color-danger)' : 'var(--color-gray-900)' }}>
                    ₹{(pnl?.totalActualCost || 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-gray-500)' }}>
                    Mat: ₹{(pnl?.materialSpend || 0).toLocaleString('en-IN')} | Lab: ₹{(pnl?.laborSpend || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              ),
            },
            {
              key: 'profit',
              header: 'Net Profit / (Loss)',
              render: ({ pnl }) => {
                if (!pnl) return null;
                const isPositive = pnl.profit >= 0;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isPositive ? <TrendingUp size={16} color="var(--color-success)" /> : <TrendingDown size={16} color="var(--color-danger)" />}
                    <span style={{ fontWeight: 800, color: isPositive ? 'var(--color-success)' : 'var(--color-danger)', fontSize: '0.95rem' }}>
                      {isPositive ? '+' : '-'} ₹{Math.abs(pnl.profit).toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              },
            },
            {
              key: 'margin',
              header: 'Margin %',
              render: ({ pnl }) => {
                if (!pnl) return null;
                const isPositive = pnl.marginPct >= 0;
                return (
                  <Badge
                    status={`${pnl.marginPct.toFixed(1)}%`}
                    variant={isPositive ? 'success' : 'danger'}
                    showIcon={false}
                  />
                );
              },
            },
            {
              key: 'status',
              header: 'Job Status',
              render: ({ job }) => <Badge status={job.status} />,
            },
          ]}
        />
      </Card>
    </div>
  );
};
