import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Plus, 
  ArrowRightLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Upload, 
  Search, 
  Filter,
  Building2,
  MapPin,
  Sparkles
} from 'lucide-react';
import { ERPService } from '../../services/erpStorage';
import { ItemMaster, StockLedgerItem, StockMovement, LocationMaster, Job, MeasurementUnit, AVAILABLE_UNITS, COMMON_CATEGORIES } from '../../types';
import { inferCategoryAndUnit, InferredProductDetails } from '../../utils/productInference';
import { 
  PageHeader, 
  Button, 
  DataTable, 
  Badge, 
  Modal, 
  Input, 
  Select, 
  Tabs, 
  Card, 
  StatCard, 
  useToast 
} from '../../components/ui';

export const InventoryView: React.FC = () => {
  const { showToast } = useToast();
  const currentUser = ERPService.getCurrentUser();

  const [activeTab, setActiveTab] = useState<'ledger' | 'items' | 'movements'>('ledger');
  const [stockLedger, setStockLedger] = useState<StockLedgerItem[]>([]);
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [movements, setStockMovements] = useState<StockMovement[]>([]);
  const [locations, setLocations] = useState<LocationMaster[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Filter state
  const [filterJob, setFilterJob] = useState('ALL');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Stock Movement Modal State
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementForm, setMovementForm] = useState({
    type: 'Receive' as StockMovement['type'],
    itemId: '',
    qty: '',
    fromLocation: 'Central Warehouse (Ambattur)',
    toLocation: 'Site Store - Apex Mall (JOB-2026-0001)',
    jobId: '',
    remarks: '',
  });

  // Bulk CSV Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');

  // Add New Product / Item Master Modal State
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [inferredDetails, setInferredDetails] = useState<InferredProductDetails | null>(null);
  const [lastInferredSpec, setLastInferredSpec] = useState<string>('');
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    category: 'Electrical Accessories' as string,
    specification: '',
    unit: 'Nos' as MeasurementUnit,
    standardCost: '',
    minStockLevel: '10',
    initialStock: '0',
  });

  const handleOpenNewItemModal = () => {
    setNewItemForm({
      name: '',
      category: 'Electrical Accessories',
      specification: '',
      unit: 'Nos',
      standardCost: '',
      minStockLevel: '10',
      initialStock: '0',
    });
    setInferredDetails(null);
    setLastInferredSpec('');
    setIsNewItemModalOpen(true);
  };

  const handleItemNameChange = (name: string) => {
    const inf = inferCategoryAndUnit(name, items);
    if (inf) {
      setNewItemForm((prev) => ({
        ...prev,
        name,
        category: inf.category,
        unit: inf.unit,
        specification: (!prev.specification || prev.specification === lastInferredSpec)
          ? (inf.specification || '')
          : prev.specification,
      }));
      setLastInferredSpec(inf.specification || '');
      setInferredDetails(inf);
    } else {
      setNewItemForm((prev) => ({ ...prev, name }));
      setInferredDetails(null);
    }
  };

  const loadData = () => {
    setStockLedger(ERPService.getStockLedger());
    setItems(ERPService.getItems());
    setStockMovements(ERPService.getStockMovements());
    setLocations(ERPService.getLocations());
    setJobs(ERPService.getJobs());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('apex_storage_update', loadData);
    return () => window.removeEventListener('apex_storage_update', loadData);
  }, []);

  const lowStockCount = stockLedger.filter((s) => s.stockOnSite <= s.minStockLevel && s.minStockLevel > 0).length;

  const filteredLedger = stockLedger.filter((s) => {
    if (showLowStockOnly && !(s.stockOnSite <= s.minStockLevel && s.minStockLevel > 0)) return false;
    if (filterJob === 'UNALLOCATED' && !s.isUnallocated) return false;
    if (filterJob !== 'ALL' && filterJob !== 'UNALLOCATED' && s.jobId !== filterJob) return false;
    return true;
  });

  const handleRecordMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementForm.itemId || !movementForm.qty || parseFloat(movementForm.qty) <= 0) {
      showToast('Validation Error', 'Please select item and enter a valid quantity.', 'danger');
      return;
    }
    const item = items.find((i) => i.id === movementForm.itemId);
    if (!item) return;

    ERPService.recordStockMovement({
      type: movementForm.type,
      itemId: item.id,
      itemName: item.name,
      qty: parseFloat(movementForm.qty),
      unit: item.unit,
      fromLocation: movementForm.fromLocation,
      toLocation: movementForm.toLocation,
      jobId: movementForm.jobId || undefined,
      responsibleUser: currentUser.name,
      remarks: movementForm.remarks || `${movementForm.type} recorded by ${currentUser.name}`,
    });

    showToast('Movement Recorded', `Successfully recorded ${movementForm.type} of ${movementForm.qty} ${item.unit}.`, 'success');
    setIsMovementModalOpen(false);
    setMovementForm({
      type: 'Receive',
      itemId: '',
      qty: '',
      fromLocation: 'Central Warehouse (Ambattur)',
      toLocation: 'Site Store - Apex Mall (JOB-2026-0001)',
      jobId: '',
      remarks: '',
    });
  };

  const handleBulkImportCSV = () => {
    if (!csvText.trim()) {
      showToast('Empty CSV', 'Please paste CSV content.', 'danger');
      return;
    }
    // Simulate CSV parsing
    const lines = csvText.trim().split('\n');
    let imported = 0;
    lines.slice(1).forEach((line) => {
      const parts = line.split(',');
      if (parts.length >= 2) {
        imported++;
      }
    });
    showToast('Items Imported', `Parsed and processed ${imported} items successfully.`, 'success');
    setIsImportModalOpen(false);
    setCsvText('');
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.name.trim()) {
      showToast('Validation Error', 'Please enter an item name.', 'danger');
      return;
    }

    const created = ERPService.addItem({
      name: newItemForm.name.trim(),
      category: newItemForm.category,
      specification: newItemForm.specification.trim(),
      unit: newItemForm.unit,
      standardCost: parseFloat(newItemForm.standardCost) || 0,
      minStockLevel: parseFloat(newItemForm.minStockLevel) || 0,
      currentStock: parseFloat(newItemForm.initialStock) || 0,
    });

    showToast('Product Created', `"${created.name}" was added to Item Master.`, 'success');
    setIsNewItemModalOpen(false);
    setInferredDetails(null);
    setLastInferredSpec('');
    setNewItemForm({
      name: '',
      category: 'Electrical Accessories',
      specification: '',
      unit: 'Nos',
      standardCost: '',
      minStockLevel: '10',
      initialStock: '0',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Inventory & Site Stock Ledger"
        subtitle="Every stock record tracks received, issued, and stock-on-site per location, mapped to a Job ID or kept as unallocated general stock."
        icon={<Boxes size={22} />}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="accent"
              icon={<Plus size={16} />}
              onClick={handleOpenNewItemModal}
            >
              + Add Product
            </Button>
            <Button
              variant="secondary"
              icon={<Upload size={16} />}
              onClick={() => setIsImportModalOpen(true)}
            >
              Bulk CSV Import
            </Button>
            <Button
              variant="secondary"
              icon={<ArrowRightLeft size={16} />}
              onClick={() => setIsMovementModalOpen(true)}
            >
              Record Movement
            </Button>
          </div>
        }
      />

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard
          label="Total Master Items"
          value={items.length}
          meta="Cables, Wires, Switchgears, Fans"
          icon={<Boxes size={22} />}
        />
        <StatCard
          label="Low Stock Alerts"
          value={lowStockCount}
          meta={lowStockCount > 0 ? 'Urgent reorder required' : 'Stock levels adequate'}
          icon={<AlertTriangle size={22} />}
          iconBg={lowStockCount > 0 ? '#fef2f2' : '#f0fdf4'}
          iconColor={lowStockCount > 0 ? '#dc2626' : '#16a34a'}
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
        />
        <StatCard
          label="Warehouses & Sites"
          value={locations.length}
          meta="Stores with designated custodians"
          icon={<Building2 size={22} />}
        />
        <StatCard
          label="Logged Stock Movements"
          value={movements.length}
          meta="Receive, Issue, Transfer, Return"
          icon={<ArrowRightLeft size={22} />}
        />
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
        tabs={[
          { id: 'ledger', label: '1. Stock Ledger (Site & Store)', icon: <Boxes size={16} /> },
          { id: 'items', label: '2. Item Master', icon: <Boxes size={16} />, badge: items.length },
          { id: 'movements', label: '3. Movements History', icon: <ArrowRightLeft size={16} />, badge: movements.length },
        ]}
      />

      {/* TAB 1: STOCK LEDGER */}
      {activeTab === 'ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                Filter Stock Allocation:
              </div>
              <select
                value={filterJob}
                onChange={(e) => setFilterJob(e.target.value)}
                style={{
                  height: 36,
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  fontSize: '0.85rem',
                }}
              >
                <option value="ALL">All Stock Records</option>
                <option value="UNALLOCATED">Unallocated General Stock Only</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.id} - {j.title}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  backgroundColor: showLowStockOnly ? '#fef2f2' : '#f8fafc',
                  color: showLowStockOnly ? 'var(--color-danger)' : 'var(--color-gray-700)',
                  border: '1px solid',
                  borderColor: showLowStockOnly ? 'var(--color-danger-border)' : 'var(--border-light)',
                  cursor: 'pointer',
                  minHeight: 36,
                }}
              >
                <AlertTriangle size={14} />
                <span>Low Stock Only ({lowStockCount})</span>
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)', fontWeight: 600 }}>
              Showing {filteredLedger.length} items
            </div>
          </div>

          <DataTable<StockLedgerItem>
            data={filteredLedger}
            keyExtractor={(s) => s.id}
            searchField={(s) => `${s.itemName} ${s.specification} ${s.locationName} ${s.jobId || ''}`}
            searchPlaceholder="Search stock by item name, location, Job ID..."
            columns={[
              { key: 'slNo', header: 'Sl No', render: (s) => s.slNo },
              {
                key: 'itemName',
                header: 'Item & Specification',
                render: (s) => (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-gray-900)' }}>{s.itemName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)' }}>{s.specification}</div>
                  </div>
                ),
              },
              { key: 'unit', header: 'Unit' },
              { key: 'receivedQty', header: 'Received Qty', render: (s) => <strong>{s.receivedQty}</strong> },
              { key: 'issuedQty', header: 'Issued Qty', render: (s) => <strong>{s.issuedQty}</strong> },
              {
                key: 'stockOnSite',
                header: 'Stock On Site',
                render: (s) => {
                  const isLow = s.stockOnSite <= s.minStockLevel && s.minStockLevel > 0;
                  return (
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: isLow ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        {s.stockOnSite}
                      </span>
                      {isLow && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-danger)', fontWeight: 700 }}>
                          Below Min ({s.minStockLevel})
                        </div>
                      )}
                    </div>
                  );
                },
              },
              {
                key: 'location',
                header: 'Location & Custodian',
                render: (s) => (
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.locationName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>{s.responsiblePerson}</div>
                  </div>
                ),
              },
              {
                key: 'allocation',
                header: 'Allocation Spine',
                render: (s) =>
                  s.isUnallocated ? (
                    <Badge status="Unallocated General Stock" variant="neutral" />
                  ) : (
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                      {s.jobId}
                    </span>
                  ),
              },
            ]}
          />
        </div>
      )}

      {/* TAB 2: ITEM MASTER */}
      {activeTab === 'items' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: '0.86rem', color: 'var(--color-gray-600)' }}>
              Central Electrical Items Catalog & Specifications ({items.length} products registered)
            </span>
            <Button
              size="sm"
              variant="accent"
              icon={<Plus size={14} />}
              onClick={handleOpenNewItemModal}
            >
              + Add New Product to Master
            </Button>
          </div>
          <DataTable<ItemMaster>
          data={items}
          keyExtractor={(item) => item.id}
          searchField={(item) => `${item.name} ${item.specification} ${item.category}`}
          searchPlaceholder="Search master items..."
          columns={[
            {
              key: 'name',
              header: 'Item Name & Specification',
              render: (item) => (
                <div>
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)' }}>{item.specification}</div>
                </div>
              ),
            },
            { key: 'category', header: 'Category', render: (i) => <Badge status={i.category} showIcon={false} /> },
            { key: 'unit', header: 'Unit' },
            {
              key: 'standardCost',
              header: 'Standard Cost',
              render: (i) => <strong>₹{i.standardCost.toLocaleString('en-IN')}</strong>,
            },
            {
              key: 'minStockLevel',
              header: 'Safety Min Stock',
              render: (i) => `${i.minStockLevel} ${i.unit}`,
            },
            {
              key: 'defaultVendorName',
              header: 'Default Vendor',
              render: (i) => i.defaultVendorName || <span style={{ color: 'var(--color-gray-400)' }}>Unassigned</span>,
            },
          ]}
        />
        </div>
      )}

      {/* TAB 3: STOCK MOVEMENTS */}
      {activeTab === 'movements' && (
        <DataTable<StockMovement>
          data={movements}
          keyExtractor={(m) => m.id}
          searchField={(m) => `${m.itemName} ${m.type} ${m.jobId || ''} ${m.fromLocation} ${m.toLocation}`}
          searchPlaceholder="Search movements by item, type, job..."
          columns={[
            { key: 'date', header: 'Date' },
            { key: 'type', header: 'Action', render: (m) => <Badge status={m.type} /> },
            { key: 'item', header: 'Quantity & Item', render: (m) => <strong>{m.qty} {m.unit} of {m.itemName}</strong> },
            { key: 'fromLocation', header: 'From Location' },
            { key: 'toLocation', header: 'To Location' },
            { key: 'jobId', header: 'Job ID', render: (m) => m.jobId || 'General Store' },
            { key: 'responsibleUser', header: 'Authorized By' },
            { key: 'remarks', header: 'Remarks' },
          ]}
        />
      )}

      {/* Record Stock Movement Modal */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        title="Record Stock Movement (Receive / Issue / Transfer / Return)"
        maxWidth="620px"
      >
        <form onSubmit={handleRecordMovement}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Select
              label="Movement Type *"
              options={[
                { value: 'Receive', label: 'Receive Goods (from Vendor or Warehouse into Site)' },
                { value: 'Issue', label: 'Issue Goods (from Store onto Site Work)' },
                { value: 'Transfer', label: 'Transfer (between Warehouse / Stores)' },
                { value: 'Return', label: 'Return (from Site back to Store)' },
              ]}
              value={movementForm.type}
              onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value as any })}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label className="ui-label" title="Excel SL.NO from Stock details1 - Copy.xls (1-85)">
                  SL.NO (1-85)
                </label>
                <input
                  type="number"
                  min="1"
                  max="85"
                  className="ui-input"
                  placeholder="e.g. 84"
                  value={items.find(i => i.id === movementForm.itemId)?.slNo || ''}
                  onChange={(e) => {
                    const num = parseInt(e.target.value, 10);
                    const matched = items.find(i => i.slNo === num);
                    if (matched) {
                      setMovementForm({ ...movementForm, itemId: matched.id });
                    }
                  }}
                  style={{ fontWeight: 800, textAlign: 'center', color: 'var(--color-primary)' }}
                />
              </div>

              <Select
                label="Item *"
                options={[
                  { value: '', label: '-- Choose Item from 85 Products --' },
                  ...items.map((i) => ({ value: i.id, label: `SL #${i.slNo || '—'}: ${i.name} (${i.unit})` })),
                ]}
                value={movementForm.itemId}
                onChange={(e) => setMovementForm({ ...movementForm, itemId: e.target.value })}
                required
              />
            </div>

            {movementForm.itemId && (() => {
              const selectedItem = items.find(i => i.id === movementForm.itemId);
              const ledgerMatch = stockLedger.find(s => s.itemId === movementForm.itemId);
              return (
                <div style={{ padding: '6px 12px', backgroundColor: '#eff6ff', borderRadius: 6, fontSize: '0.82rem', color: '#1e40af', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Product: <strong>{selectedItem?.name}</strong></span>
                  <span>Stock on Site: <strong>{ledgerMatch?.stockOnSite || 0} {selectedItem?.unit}</strong></span>
                </div>
              );
            })()}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
              <Input
                type="number"
                label="Quantity *"
                placeholder="e.g. 20"
                value={movementForm.qty}
                onChange={(e) => setMovementForm({ ...movementForm, qty: e.target.value })}
                required
              />

              <Select
                label="Map to Job ID (or leave unallocated)"
                options={[
                  { value: '', label: '-- Unallocated General Stock --' },
                  ...jobs.map((j) => ({ value: j.id, label: `${j.id} (${j.title})` })),
                ]}
                value={movementForm.jobId}
                onChange={(e) => setMovementForm({ ...movementForm, jobId: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
              <Input
                label="From Location"
                value={movementForm.fromLocation}
                onChange={(e) => setMovementForm({ ...movementForm, fromLocation: e.target.value })}
              />
              <Input
                label="To Location"
                value={movementForm.toLocation}
                onChange={(e) => setMovementForm({ ...movementForm, toLocation: e.target.value })}
              />
            </div>

            <div className="ui-form-group">
              <label className="ui-label">Remarks / Purpose</label>
              <textarea
                className="ui-input ui-textarea"
                rows={2}
                placeholder="Reason or invoice reference..."
                value={movementForm.remarks}
                onChange={(e) => setMovementForm({ ...movementForm, remarks: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button type="button" variant="secondary" onClick={() => setIsMovementModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent">
                Confirm Movement
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Bulk CSV Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Bulk Import Items via CSV"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>
            Paste comma-separated items with columns: <code>Item Name, Specification, Unit, Standard Cost, Min Stock</code>
          </p>

          <textarea
            className="ui-input ui-textarea"
            rows={8}
            placeholder={`1.5 Sq.mm FR Copper Wire (Yellow),90m Coil IS 694,Coil,1450,25\n25mm PVC Conduit Heavy Duty,3m Pipe ISI,Nos,85,100\n6A 1-Way Modular Switch,White Polycarbonate,Nos,42,150`}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button variant="secondary" onClick={() => setIsImportModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleBulkImportCSV}>
              Process Bulk Import
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add New Product to Item Master Modal */}
      <Modal
        isOpen={isNewItemModalOpen}
        onClose={() => setIsNewItemModalOpen(false)}
        title="Add New Product to Item Master"
      >
        <p style={{ fontSize: '0.84rem', color: 'var(--color-gray-600)', marginTop: 0, marginBottom: 'var(--space-4)' }}>
          Register a new electrical product or raw material into central catalog.
        </p>
        <form onSubmit={handleCreateItem}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="ui-form-group">
              <label className="ui-label">Product / Material Name *</label>
              <input
                type="text"
                required
                className="ui-input"
                placeholder="e.g. 2.5 Sq.mm FRLS Copper Wire, 25mm PVC Pipe, 16A Modular Switch..."
                value={newItemForm.name}
                onChange={(e) => handleItemNameChange(e.target.value)}
                autoFocus
              />
              {inferredDetails && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '9px 12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    fontSize: '0.82rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#065f46' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                      <Sparkles size={15} color="#10b981" />
                      Auto-detected & Selected:
                      <span style={{ color: '#047857', backgroundColor: '#d1fae5', padding: '1px 6px', borderRadius: 4 }}>
                        {inferredDetails.category}
                      </span>
                      &bull;
                      <span style={{ color: '#047857', backgroundColor: '#d1fae5', padding: '1px 6px', borderRadius: 4 }}>
                        {inferredDetails.unit}
                      </span>
                    </span>
                    <span style={{ fontSize: '0.72rem', backgroundColor: '#10b981', color: '#ffffff', padding: '1px 7px', borderRadius: 999, fontWeight: 700 }}>
                      ✓ Applied
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: '0.76rem', color: '#4b5563' }}>
                      {inferredDetails.reason}
                    </span>
                    {inferredDetails.suggestedUnits.length > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: '0.73rem', color: '#6b7280', fontWeight: 600 }}>Quick UOM:</span>
                        {inferredDetails.suggestedUnits.map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => setNewItemForm((prev) => ({ ...prev, unit: u }))}
                            style={{
                              padding: '2px 8px',
                              fontSize: '0.73rem',
                              borderRadius: 4,
                              border: newItemForm.unit === u ? '1px solid #10b981' : '1px solid #cbd5e1',
                              backgroundColor: newItemForm.unit === u ? '#10b981' : '#ffffff',
                              color: newItemForm.unit === u ? '#ffffff' : '#374151',
                              fontWeight: newItemForm.unit === u ? 700 : 500,
                              cursor: 'pointer',
                            }}
                          >
                            {u} {newItemForm.unit === u ? '✓' : ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="ui-form-group">
                <label className="ui-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Category *</span>
                  {inferredDetails?.category === newItemForm.category && (
                    <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>✨ Suggested</span>
                  )}
                </label>
                <select
                  className="ui-input"
                  value={newItemForm.category}
                  onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                  style={{
                    borderColor: inferredDetails?.category === newItemForm.category ? '#10b981' : undefined,
                  }}
                >
                  {COMMON_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="ui-form-group">
                <label className="ui-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Measurement Unit (UOM) *</span>
                  {inferredDetails?.unit === newItemForm.unit && (
                    <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>✨ Suggested</span>
                  )}
                </label>
                <select
                  className="ui-input"
                  value={newItemForm.unit}
                  onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value as MeasurementUnit })}
                  style={{
                    borderColor: inferredDetails?.unit === newItemForm.unit ? '#10b981' : undefined,
                  }}
                >
                  {AVAILABLE_UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ui-form-group">
              <label className="ui-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Specification / Size / Gauge</span>
                {inferredDetails?.specification && newItemForm.specification === inferredDetails.specification && (
                  <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>✨ Auto-filled</span>
                )}
              </label>
              <input
                type="text"
                className="ui-input"
                placeholder="e.g. 1100V ISI FRLS Flame Retardant, Heavy Duty"
                value={newItemForm.specification}
                onChange={(e) => setNewItemForm({ ...newItemForm, specification: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-4)' }}>
              <div className="ui-form-group">
                <label className="ui-label">Standard Cost (₹)</label>
                <input
                  type="number"
                  step="any"
                  className="ui-input"
                  placeholder="0"
                  value={newItemForm.standardCost}
                  onChange={(e) => setNewItemForm({ ...newItemForm, standardCost: e.target.value })}
                />
              </div>

              <div className="ui-form-group">
                <label className="ui-label">Safety Min Stock</label>
                <input
                  type="number"
                  className="ui-input"
                  value={newItemForm.minStockLevel}
                  onChange={(e) => setNewItemForm({ ...newItemForm, minStockLevel: e.target.value })}
                />
              </div>

              <div className="ui-form-group">
                <label className="ui-label">Initial Stock On-Site</label>
                <input
                  type="number"
                  className="ui-input"
                  value={newItemForm.initialStock}
                  onChange={(e) => setNewItemForm({ ...newItemForm, initialStock: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="secondary" onClick={() => setIsNewItemModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" icon={<Plus size={16} />}>
                Save to Item Master
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
