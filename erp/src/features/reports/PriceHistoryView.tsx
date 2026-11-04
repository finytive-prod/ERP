import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  TrendingUp, 
  Search, 
  Building2, 
  Briefcase, 
  Calendar,
  Filter
} from 'lucide-react';
import { ERPService } from '../../services/erpStorage';
import { PriceHistoryRecord, ItemMaster, Job } from '../../types';
import { 
  PageHeader, 
  DataTable, 
  Select, 
  Card, 
  ChartWrapper, 
  StatCard 
} from '../../components/ui';

export const PriceHistoryView: React.FC = () => {
  const [history, setHistory] = useState<PriceHistoryRecord[]>([]);
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('itm-001'); // 1.5 Sq.mm wire default
  const [filterJobId, setFilterJobId] = useState<string>('ALL');

  const loadData = () => {
    setHistory(ERPService.getPriceHistory());
    setItems(ERPService.getItems());
    setJobs(ERPService.getJobs());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('apex_storage_update', loadData);
    return () => window.removeEventListener('apex_storage_update', loadData);
  }, []);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  // Filter history
  const filteredHistory = history.filter((p) => {
    if (selectedItemId !== 'ALL' && p.itemId !== selectedItemId) return false;
    if (filterJobId !== 'ALL' && p.jobId !== filterJobId) return false;
    return true;
  });

  // Chart data for selected item rate trend over time
  const itemTrends = history
    .filter((p) => p.itemId === selectedItemId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((p) => ({
      label: p.date.substring(5), // MM-DD
      value: p.rate,
      vendor: p.vendorName,
    }));

  const lowestRate = itemTrends.length > 0 ? Math.min(...itemTrends.map((t) => t.value)) : 0;
  const highestRate = itemTrends.length > 0 ? Math.max(...itemTrends.map((t) => t.value)) : 0;
  const latestRate = itemTrends.length > 0 ? itemTrends[itemTrends.length - 1].value : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Material Price History & Trend Analytics"
        subtitle="Critical purchase intelligence: track commodity prices (copper, cables, switchgear) across jobs and vendors over time."
        icon={<Tag size={22} />}
      />

      {/* Selectors Toolbar */}
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
          <div style={{ minWidth: 260 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-gray-600)', marginBottom: 4 }}>
              Select Item to Inspect Price Trend:
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                fontSize: '0.88rem',
                fontWeight: 600,
              }}
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.specification})
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: 220 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-gray-600)', marginBottom: 4 }}>
              Filter by Job Context:
            </label>
            <select
              value={filterJobId}
              onChange={(e) => setFilterJobId(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                fontSize: '0.88rem',
              }}
            >
              <option value="ALL">All Contracting Jobs</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.id} - {j.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Rate Stats */}
        <div style={{ display: 'flex', gap: 16 }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: 700 }}>
              Latest Rate
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              ₹{latestRate}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: 700 }}>
              Lowest Procured
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-success)' }}>
              ₹{lowestRate}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', textTransform: 'uppercase', fontWeight: 700 }}>
              Highest Procured
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-danger)' }}>
              ₹{highestRate}
            </div>
          </div>
        </div>
      </div>

      {/* Price Trend Chart */}
      <ChartWrapper
        title={`Purchase Rate Trend: ${selectedItem?.name || ''}`}
        subtitle="Tracking purchase price fluctuations across vendors and delivery dates"
        type="line"
        data={itemTrends}
        valuePrefix="₹"
        primaryLabel="Purchase Rate"
      />

      {/* Historical Purchases Ledger */}
      <Card title="Historical Purchase Transactions">
        <DataTable<PriceHistoryRecord>
          data={filteredHistory}
          keyExtractor={(p) => p.id}
          columns={[
            { key: 'date', header: 'Purchase Date' },
            {
              key: 'item',
              header: 'Item Name',
              render: (p) => <strong>{p.itemName}</strong>,
            },
            {
              key: 'vendor',
              header: 'Vendor Name',
              render: (p) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={14} color="var(--color-gray-400)" />
                  <span>{p.vendorName}</span>
                </div>
              ),
            },
            {
              key: 'rate',
              header: 'Procured Rate',
              render: (p) => (
                <strong style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                  ₹{p.rate} / {p.unit}
                </strong>
              ),
            },
            { key: 'qty', header: 'Quantity Bought', render: (p) => `${p.qty} ${p.unit}` },
            {
              key: 'jobId',
              header: 'Charged to Job Spine',
              render: (p) => (
                <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                  {p.jobId}
                </span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
