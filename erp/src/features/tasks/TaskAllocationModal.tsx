import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Boxes, 
  Users, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Briefcase,
  ShieldCheck,
  Send
} from 'lucide-react';
import { ERPService } from '../../services/erpStorage';
import { 
  SiteTask, 
  StockLedgerItem, 
  Employee, 
  TaskAllocatedMaterial, 
  TaskMemberAssignment,
  MeasurementUnit,
  AVAILABLE_UNITS
} from '../../types';
import { Modal, Button, Badge, useToast } from '../../components/ui';

interface TaskAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: SiteTask;
  onTaskUpdated?: () => void;
}

export const TaskAllocationModal: React.FC<TaskAllocationModalProps> = ({
  isOpen,
  onClose,
  task,
  onTaskUpdated,
}) => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'materials' | 'members' | 'progress'>('materials');

  // Site inventory available for this task's site
  const [siteStocks, setSiteStocks] = useState<StockLedgerItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Daily Progress Log Form
  const [logQty, setLogQty] = useState('');
  const [logNotes, setLogNotes] = useState('');

  // Material Allocation Form
  const [matForm, setMatForm] = useState({
    stockItemKey: '',
    customName: '',
    specification: '',
    unit: 'Mtr' as MeasurementUnit,
    allocatedQty: '',
    sourceType: 'SiteStore' as 'SiteStore' | 'JobBOQ',
  });

  // Date-wise Member Allocation Form
  const [memberForm, setMemberForm] = useState({
    memberId: '',
    assignedDate: new Date().toISOString().split('T')[0],
    shiftOrHours: 'Full Day (8 hrs)',
    status: 'On Site Duty' as 'Scheduled' | 'On Site Duty' | 'Completed',
    notes: '',
  });

  useEffect(() => {
    if (isOpen && task) {
      if (task.siteId) {
        const stocks = ERPService.getSiteStocksForSite(task.siteId);
        setSiteStocks(stocks);
      } else {
        setSiteStocks(ERPService.getStockLedger());
      }
      setEmployees(ERPService.getEmployees());
    }
  }, [isOpen, task]);

  if (!task) return null;

  // Handle Log Progress
  const handleLogProgress = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(logQty);
    if (!qty || qty <= 0) {
      showToast('Validation Error', 'Please enter a valid positive progress quantity.', 'danger');
      return;
    }

    ERPService.logTaskProgress(task.id, qty, logNotes || 'Daily site progress');
    showToast('Progress Logged', `Logged +${qty} ${task.unit} completed on "${task.title}".`, 'success');
    setLogQty('');
    setLogNotes('');
    if (onTaskUpdated) onTaskUpdated();
  };

  // Handle Allocate Material
  const handleAllocateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(matForm.allocatedQty);
    if (!qty || qty <= 0) {
      showToast('Quantity Error', 'Please enter a valid allocated quantity > 0.', 'danger');
      return;
    }

    let itemName = matForm.customName.trim();
    let unit = matForm.unit;
    let spec = matForm.specification.trim();
    let itemId: string | undefined;

    if (matForm.stockItemKey) {
      const selectedStock = siteStocks.find((s) => s.id === matForm.stockItemKey);
      if (selectedStock) {
        itemName = selectedStock.itemName;
        unit = selectedStock.unit;
        spec = selectedStock.specification || spec;
        itemId = selectedStock.itemId;
      }
    }

    if (!itemName) {
      showToast('Material Required', 'Please select a stock item or enter material name.', 'danger');
      return;
    }

    ERPService.allocateMaterialToTask(task.id, {
      itemId,
      itemName,
      specification: spec,
      unit,
      allocatedQty: qty,
      consumedQty: 0,
      sourceType: matForm.sourceType,
    });

    showToast('Material Allocated', `Allocated ${qty} ${unit} of "${itemName}" to this task.`, 'success');
    setMatForm({
      stockItemKey: '',
      customName: '',
      specification: '',
      unit: 'Mtr',
      allocatedQty: '',
      sourceType: 'SiteStore',
    });
    if (onTaskUpdated) onTaskUpdated();
  };

  // Handle Remove Material
  const handleRemoveMaterial = (materialId: string) => {
    if (window.confirm('Remove this allocated material from task?')) {
      ERPService.removeMaterialFromTask(task.id, materialId);
      showToast('Material Removed', 'Allocated material item removed.', 'info');
      if (onTaskUpdated) onTaskUpdated();
    }
  };

  // Handle Assign Member Date-wise
  const handleAssignMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.memberId) {
      showToast('Member Required', 'Please choose a team member/worker.', 'danger');
      return;
    }
    if (!memberForm.assignedDate) {
      showToast('Date Required', 'Please choose the assignment date.', 'danger');
      return;
    }

    const emp = employees.find((e) => e.id === memberForm.memberId);
    if (!emp) return;

    ERPService.assignMemberToTask(task.id, {
      memberId: emp.id,
      memberName: emp.name,
      role: emp.role,
      assignedDate: memberForm.assignedDate,
      shiftOrHours: memberForm.shiftOrHours,
      status: memberForm.status,
      notes: memberForm.notes.trim() || undefined,
    });

    showToast(
      'Member Assigned',
      `Assigned ${emp.name} (${emp.role}) to work on ${memberForm.assignedDate}.`,
      'success'
    );
    setMemberForm((prev) => ({
      ...prev,
      memberId: '',
      notes: '',
    }));
    if (onTaskUpdated) onTaskUpdated();
  };

  // Handle Remove Member Assignment
  const handleRemoveMember = (assignmentId: string) => {
    ERPService.removeMemberFromTask(task.id, assignmentId);
    showToast('Assignment Removed', 'Member date assignment removed.', 'info');
    if (onTaskUpdated) onTaskUpdated();
  };

  const pct = Math.round((task.completedQty / Math.max(1, task.targetQty)) * 100);
  const allocatedList = task.allocatedMaterials || [];
  const memberList = (task.memberAssignments || []).slice().sort((a, b) => b.assignedDate.localeCompare(a.assignedDate));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Task Workspace: ${task.title}`}
      maxWidth="920px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Task Header Summary Card */}
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                {task.jobId}
              </span>
              {task.siteName && (
                <>
                  <span style={{ color: '#94a3b8' }}>•</span>
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                    📍 {task.siteName}
                  </span>
                </>
              )}
              {task.boqSectionTitle && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: '0.72rem',
                    backgroundColor: '#e0e7ff',
                    color: '#3730a3',
                    fontWeight: 800,
                  }}
                >
                  BOQ: {task.boqSectionTitle}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 4 }}>
              Supervisor: <strong>{task.assignedSupervisor}</strong> | Dates: {task.startDate} to {task.targetDate}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Progress
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                {task.completedQty} / {task.targetQty} {task.unit} ({pct}%)
              </div>
            </div>
            <Badge status={task.status} />
          </div>
        </div>

        {/* Sub-tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '2px solid #e2e8f0',
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveSubTab('materials')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeSubTab === 'materials' ? '3px solid var(--color-primary)' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeSubTab === 'materials' ? 'var(--color-primary)' : '#64748b',
              fontWeight: activeSubTab === 'materials' ? 800 : 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Boxes size={16} />
            <span>1. Task Materials ({allocatedList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('members')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeSubTab === 'members' ? '3px solid var(--color-primary)' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeSubTab === 'members' ? 'var(--color-primary)' : '#64748b',
              fontWeight: activeSubTab === 'members' ? 800 : 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Users size={16} />
            <span>2. Team Member Allocation (Date-wise) ({memberList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('progress')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeSubTab === 'progress' ? '3px solid var(--color-primary)' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeSubTab === 'progress' ? 'var(--color-primary)' : '#64748b',
              fontWeight: activeSubTab === 'progress' ? 800 : 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CheckSquare size={16} />
            <span>3. Progress & Daily Logs ({task.dailyLogs?.length || 0})</span>
          </button>
        </div>

        {/* SUBTAB 1: TASK MATERIALS */}
        {activeSubTab === 'materials' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Form to allocate material */}
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: 8,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0369a1', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} /> Allocate Site Material to this Task
              </div>

              <form onSubmit={handleAllocateMaterial} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 100px 100px auto', gap: 10, alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>
                    Pick from Site Live Inventory:
                  </label>
                  <select
                    className="ui-select"
                    value={matForm.stockItemKey}
                    onChange={(e) => {
                      const key = e.target.value;
                      setMatForm((prev) => {
                        const st = siteStocks.find((s) => s.id === key);
                        return {
                          ...prev,
                          stockItemKey: key,
                          customName: st ? st.itemName : prev.customName,
                          unit: st ? st.unit : prev.unit,
                          specification: st?.specification || prev.specification,
                        };
                      });
                    }}
                    style={{ width: '100%', height: 38, fontSize: '0.84rem' }}
                  >
                    <option value="">-- Choose Site Store Item --</option>
                    {siteStocks.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.itemName} ({s.stockOnSite ?? (s.receivedQty - s.issuedQty)} {s.unit} in store)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>
                    Or Custom Item Name:
                  </label>
                  <input
                    type="text"
                    className="ui-input"
                    value={matForm.customName}
                    onChange={(e) => setMatForm({ ...matForm, customName: e.target.value })}
                    placeholder="e.g. 1CX95 Cu Flex Cable"
                    style={{ width: '100%', height: 38, fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>
                    Unit:
                  </label>
                  <select
                    className="ui-select"
                    value={matForm.unit}
                    onChange={(e) => setMatForm({ ...matForm, unit: e.target.value as any })}
                    style={{ width: '100%', height: 38, fontSize: '0.84rem' }}
                  >
                    {AVAILABLE_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>
                    Allocated Qty:
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    className="ui-input"
                    value={matForm.allocatedQty}
                    onChange={(e) => setMatForm({ ...matForm, allocatedQty: e.target.value })}
                    placeholder="Qty"
                    style={{ width: '100%', height: 38, fontSize: '0.84rem', fontWeight: 700 }}
                    required
                  />
                </div>

                <div>
                  <Button variant="primary" type="submit" size="sm" icon={<Plus size={14} />}>
                    Allocate
                  </Button>
                </div>
              </form>
            </div>

            {/* Table of allocated materials */}
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                Allocated Materials for this Task ({allocatedList.length}):
              </div>

              {allocatedList.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 8, color: '#64748b', fontSize: '0.86rem' }}>
                  No materials allocated to this task yet. Use the form above to allocate materials from the site stock.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Material / Description</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Specification</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Allocated Qty</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Consumed</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Source</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Allocated At</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocatedList.map((m) => (
                        <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>
                            {m.itemName}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.8rem' }}>
                            {m.specification || '—'}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 800, color: '#0369a1' }}>
                            {m.allocatedQty} {m.unit}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#166534', fontWeight: 700 }}>
                            {m.consumedQty || 0} {m.unit}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 12,
                                fontSize: '0.72rem',
                                backgroundColor: m.sourceType === 'SiteStore' ? '#dcfce7' : '#e0e7ff',
                                color: m.sourceType === 'SiteStore' ? '#166534' : '#3730a3',
                                fontWeight: 700,
                              }}
                            >
                              {m.sourceType === 'SiteStore' ? 'Site Inventory' : 'Job BOQ'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.78rem' }}>
                            {m.allocatedAt}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterial(m.id)}
                              style={{
                                border: 'none',
                                background: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: 4,
                              }}
                              title="Remove Material"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 2: MEMBER ALLOCATION DATE-WISE */}
        {activeSubTab === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Form to assign member date-wise */}
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 8,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#166534', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={16} /> Assign Team Member (Date-wise Duty)
              </div>

              <form onSubmit={handleAssignMember} style={{ display: 'grid', gridTemplateColumns: '140px 1.2fr 140px 120px 1fr auto', gap: 10, alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#166534', marginBottom: 4 }}>
                    Work Date:
                  </label>
                  <input
                    type="date"
                    className="ui-input"
                    value={memberForm.assignedDate}
                    onChange={(e) => setMemberForm({ ...memberForm, assignedDate: e.target.value })}
                    style={{ width: '100%', height: 38, fontSize: '0.84rem' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#166534', marginBottom: 4 }}>
                    Team Member:
                  </label>
                  <select
                    className="ui-select"
                    value={memberForm.memberId}
                    onChange={(e) => setMemberForm({ ...memberForm, memberId: e.target.value })}
                    style={{ width: '100%', height: 38, fontSize: '0.84rem', fontWeight: 700 }}
                    required
                  >
                    <option value="">-- Choose Member --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#166534', marginBottom: 4 }}>
                    Shift / Hours:
                  </label>
                  <select
                    className="ui-select"
                    value={memberForm.shiftOrHours}
                    onChange={(e) => setMemberForm({ ...memberForm, shiftOrHours: e.target.value })}
                    style={{ width: '100%', height: 38, fontSize: '0.84rem' }}
                  >
                    <option value="Full Day (8 hrs)">Full Day (8 hrs)</option>
                    <option value="Half Day (4 hrs)">Half Day (4 hrs)</option>
                    <option value="Morning Shift (4 hrs)">Morning Shift (4 hrs)</option>
                    <option value="Overtime (2 hrs)">Overtime (2 hrs)</option>
                    <option value="Overtime (4 hrs)">Overtime (4 hrs)</option>
                    <option value="Night Shift (8 hrs)">Night Shift (8 hrs)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#166534', marginBottom: 4 }}>
                    Status:
                  </label>
                  <select
                    className="ui-select"
                    value={memberForm.status}
                    onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value as any })}
                    style={{ width: '100%', height: 38, fontSize: '0.84rem' }}
                  >
                    <option value="On Site Duty">On Site Duty</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#166534', marginBottom: 4 }}>
                    Specific Task Work / Area:
                  </label>
                  <input
                    type="text"
                    className="ui-input"
                    value={memberForm.notes}
                    onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
                    placeholder="e.g. Tray erection bay 2"
                    style={{ width: '100%', height: 38, fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <Button variant="primary" type="submit" size="sm" icon={<Plus size={14} />}>
                    Assign
                  </Button>
                </div>
              </form>
            </div>

            {/* List of date-wise assignments */}
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                Date-wise Member Deployment ({memberList.length}):
              </div>

              {memberList.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 8, color: '#64748b', fontSize: '0.86rem' }}>
                  No team members scheduled yet. Use the form above to allocate members date-wise.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Date</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Team Member</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Role</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Shift / Hours</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Status</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569' }}>Work Notes</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberList.map((m) => (
                        <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--color-primary)' }}>
                            📅 {m.assignedDate}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>
                            {m.memberName}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#475569' }}>
                            {m.role}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                            {m.shiftOrHours || 'Full Day'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 12,
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                backgroundColor: m.status === 'On Site Duty' ? '#dcfce7' : m.status === 'Completed' ? '#e2e8f0' : '#fef3c7',
                                color: m.status === 'On Site Duty' ? '#166534' : m.status === 'Completed' ? '#475569' : '#92400e',
                              }}
                            >
                              {m.status || 'Scheduled'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.8rem' }}>
                            {m.notes || 'General installation duty'}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.id)}
                              style={{
                                border: 'none',
                                background: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: 4,
                              }}
                              title="Remove Assignment"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 3: PROGRESS & DAILY LOGS */}
        {activeSubTab === 'progress' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Visual Progress Bar */}
            <div style={{ backgroundColor: '#ffffff', padding: 14, border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: 6 }}>
                <span>
                  Work Completed: <strong>{task.completedQty}</strong> / {task.targetQty} {task.unit}
                </span>
                <span style={{ fontWeight: 800, color: pct >= 100 ? '#16a34a' : 'var(--color-primary)' }}>
                  {pct}%
                </span>
              </div>
              <div style={{ width: '100%', height: 10, backgroundColor: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
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

            {/* Log Daily Progress Form */}
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', marginBottom: 10 }}>
                + Record Daily Site Progress:
              </div>

              <form onSubmit={handleLogProgress} style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: 10, alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Completed Today ({task.unit}):
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    className="ui-input"
                    value={logQty}
                    onChange={(e) => setLogQty(e.target.value)}
                    placeholder={`e.g. 2 ${task.unit}`}
                    style={{ width: '100%', height: 38, fontWeight: 700 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Field Supervisor Notes:
                  </label>
                  <input
                    type="text"
                    className="ui-input"
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    placeholder="Details of section installed, testing verified, etc."
                    style={{ width: '100%', height: 38 }}
                  />
                </div>

                <div>
                  <Button variant="primary" type="submit" size="sm" icon={<CheckSquare size={14} />}>
                    Log Entry
                  </Button>
                </div>
              </form>
            </div>

            {/* Daily logs history */}
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                Daily Progress History ({task.dailyLogs?.length || 0}):
              </div>

              {(!task.dailyLogs || task.dailyLogs.length === 0) ? (
                <div style={{ padding: 20, textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 8, color: '#64748b', fontSize: '0.86rem' }}>
                  No daily progress logs entered yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {task.dailyLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 6,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.84rem',
                      }}
                    >
                      <div>
                        <strong>{log.date}:</strong> +{log.completedQtyToday} {task.unit} completed — {log.notes}
                      </div>
                      <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                        👤 {log.supervisorName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
          <Button variant="secondary" onClick={onClose}>
            Close Workspace
          </Button>
        </div>
      </div>
    </Modal>
  );
};
