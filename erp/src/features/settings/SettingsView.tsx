import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  ShieldCheck, 
  Tag, 
  Boxes, 
  Sliders, 
  CheckCircle2,
  Lock
} from 'lucide-react';
import { ERPService } from '../../services/erpStorage';
import { DynamicCostType, UserRole } from '../../types';
import { 
  PageHeader, 
  Button, 
  DataTable, 
  Badge, 
  Modal, 
  Input, 
  Tabs,
  Card,
  useToast
} from '../../components/ui';

export const SettingsView: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'costtypes' | 'roles' | 'units'>('costtypes');
  const [costTypes, setCostTypes] = useState<DynamicCostType[]>([]);
  const [isAddCostTypeOpen, setIsAddCostTypeOpen] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [typeDesc, setTypeDesc] = useState('');

  const loadData = () => {
    setCostTypes(ERPService.getCostTypes());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('apex_storage_update', loadData);
    return () => window.removeEventListener('apex_storage_update', loadData);
  }, []);

  const handleAddCostType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim()) {
      showToast('Validation Error', 'Cost type name is required.', 'danger');
      return;
    }
    ERPService.addCostType(typeName.trim(), typeDesc.trim());
    showToast('Cost Type Added', `Added dynamic cost type "${typeName}".`, 'success');
    setIsAddCostTypeOpen(false);
    setTypeName('');
    setTypeDesc('');
  };

  // Role & Privilege Matrix
  const rolePermissions: { module: string; admin: boolean; purchase: boolean; store: boolean; site: boolean; accounts: boolean }[] = [
    { module: 'Job Creation & Hub Management', admin: true, purchase: false, store: false, site: false, accounts: false },
    { module: 'BOQ Rate Enquiry & Admin Approval', admin: true, purchase: true, store: false, site: false, accounts: false },
    { module: 'Raise Purchase Orders', admin: true, purchase: true, store: true, site: false, accounts: false },
    { module: 'Approve Purchase Limit Exceptions', admin: true, purchase: false, store: false, site: false, accounts: false },
    { module: 'Stock Inward / Receiving & Dispatch', admin: true, purchase: false, store: true, site: false, accounts: false },
    { module: 'Site Daily Log & Extra Material Request', admin: true, purchase: false, store: false, site: true, accounts: false },
    { module: 'Approve Extra Material on Site', admin: true, purchase: false, store: false, site: false, accounts: false },
    { module: 'Site Electrician Attendance Marking', admin: true, purchase: false, store: false, site: true, accounts: false },
    { module: 'Expense Recording & Petty Cash', admin: true, purchase: false, store: false, site: false, accounts: true },
    { module: 'Client Invoicing & Payment Reconciliation', admin: true, purchase: false, store: false, site: false, accounts: true },
    { module: 'Profit & Loss Financial Reporting', admin: true, purchase: false, store: false, site: false, accounts: true },
    { module: 'System Audit Log & Settings Management', admin: true, purchase: false, store: false, site: false, accounts: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="System Settings & Master Configuration"
        subtitle="Manage dynamic cost types, role-based privileges, measurement units, and industrial system tokens."
        icon={<Settings size={22} />}
        actions={
          <Button
            variant="accent"
            icon={<Plus size={18} />}
            onClick={() => setIsAddCostTypeOpen(true)}
          >
            Create New Cost Type
          </Button>
        }
      />

      <Tabs
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
        tabs={[
          { id: 'costtypes', label: '1. Dynamic Cost Types', icon: <Tag size={16} />, badge: costTypes.length },
          { id: 'roles', label: '2. Role Privileges Matrix', icon: <ShieldCheck size={16} /> },
          { id: 'units', label: '3. Measurement Units', icon: <Boxes size={16} /> },
        ]}
      />

      {/* TAB 1: DYNAMIC COST TYPES */}
      {activeTab === 'costtypes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ fontSize: '0.88rem', color: 'var(--color-gray-600)' }}>
            Dynamic cost categories can be attached to any purchase, dispatch, or job expense without code modifications.
          </div>

          <DataTable<DynamicCostType>
            data={costTypes}
            keyExtractor={(ct) => ct.id}
            columns={[
              {
                key: 'name',
                header: 'Cost Category Name',
                render: (ct) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary)' }}>{ct.name}</span>
                    {ct.isSystem && <Badge status="System Default" showIcon={false} variant="neutral" />}
                  </div>
                ),
              },
              { key: 'description', header: 'Description / Usage' },
            ]}
          />
        </div>
      )}

      {/* TAB 2: ROLE PRIVILEGE MATRIX */}
      {activeTab === 'roles' && (
        <Card title="Role-Based Access Control (RBAC) Matrix">
          <div style={{ overflowX: 'auto' }}>
            <table className="ui-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 260 }}>Module / Sensitive Operation</th>
                  <th style={{ textAlign: 'center' }}>Admin</th>
                  <th style={{ textAlign: 'center' }}>Purchase Mgr</th>
                  <th style={{ textAlign: 'center' }}>Store Mgr</th>
                  <th style={{ textAlign: 'center' }}>Site Supervisor</th>
                  <th style={{ textAlign: 'center' }}>Accounts</th>
                </tr>
              </thead>
              <tbody>
                {rolePermissions.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{row.module}</td>
                    <td style={{ textAlign: 'center' }}>
                      {row.admin ? <CheckCircle2 size={18} color="var(--color-success)" style={{ display: 'inline' }} /> : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.purchase ? <CheckCircle2 size={18} color="var(--color-success)" style={{ display: 'inline' }} /> : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.store ? <CheckCircle2 size={18} color="var(--color-success)" style={{ display: 'inline' }} /> : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.site ? <CheckCircle2 size={18} color="var(--color-success)" style={{ display: 'inline' }} /> : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.accounts ? <CheckCircle2 size={18} color="var(--color-success)" style={{ display: 'inline' }} /> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: UNITS */}
      {activeTab === 'units' && (
        <Card title="Standard Electrical Measurement Units">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            {[
              { unit: 'Coil', desc: 'Standard 90m / 100m wire coils' },
              { unit: 'Mtrs', desc: 'Linear meters for cables & conduits' },
              { unit: 'Nos', desc: 'Piece count for fans, battens, MCBs' },
              { unit: 'Kgs', desc: 'Weight for copper strips, earthing plates' },
              { unit: 'Set', desc: 'Assembly sets, earthing chemical pits' },
              { unit: 'Lot', desc: 'Bulk lumpsum quantities for accessories' },
            ].map((u) => (
              <div key={u.unit} style={{ padding: 'var(--space-4)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', backgroundColor: '#fafbfc' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{u.unit}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-gray-600)', marginTop: 4 }}>{u.desc}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Cost Type Modal */}
      <Modal
        isOpen={isAddCostTypeOpen}
        onClose={() => setIsAddCostTypeOpen(false)}
        title="Create New Dynamic Cost Type"
      >
        <form onSubmit={handleAddCostType}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input
              label="Cost Type Name *"
              placeholder="e.g. Crane & Heavy Rigging"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              required
            />

            <div className="ui-form-group">
              <label className="ui-label">Description & Application</label>
              <textarea
                className="ui-input ui-textarea"
                rows={3}
                placeholder="Where this cost applies (e.g. mobile hydraulic cranes, plinth lifting)..."
                value={typeDesc}
                onChange={(e) => setTypeDesc(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button type="button" variant="secondary" onClick={() => setIsAddCostTypeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent">
                Save Dynamic Cost Type
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
