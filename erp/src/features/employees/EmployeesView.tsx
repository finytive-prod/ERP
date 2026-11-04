import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign,
  Briefcase
} from 'lucide-react';
import { ERPService } from '../../services/erpStorage';
import { Employee, AttendanceRecord, Job } from '../../types';
import { 
  PageHeader, 
  Button, 
  DataTable, 
  Badge, 
  Modal, 
  Input, 
  Select, 
  Tabs,
  StatCard,
  useToast
} from '../../components/ui';

export const EmployeesView: React.FC = () => {
  const { showToast } = useToast();
  const currentUser = ERPService.getCurrentUser();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const [activeTab, setActiveTab] = useState<'attendance' | 'master'>('attendance');
  const [filterJob, setFilterJob] = useState('ALL');

  // Quick Attendance Modal
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attForm, setAttForm] = useState({
    employeeId: '',
    jobId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Present' as AttendanceRecord['status'],
  });

  const loadData = () => {
    setEmployees(ERPService.getEmployees());
    setAttendance(ERPService.getAttendance());
    setJobs(ERPService.getJobs());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('apex_storage_update', loadData);
    return () => window.removeEventListener('apex_storage_update', loadData);
  }, []);

  const totalLabourSpend = attendance.reduce((acc, a) => acc + a.dailyCost, 0);

  const filteredAttendance = attendance.filter((a) => {
    if (filterJob !== 'ALL' && a.jobId !== filterJob) return false;
    return true;
  });

  const handleMarkAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attForm.employeeId || !attForm.jobId) {
      showToast('Validation Error', 'Please select Employee and Job ID.', 'danger');
      return;
    }
    const emp = employees.find((e) => e.id === attForm.employeeId);
    if (!emp) return;

    ERPService.recordAttendance({
      employeeId: emp.id,
      employeeName: emp.name,
      jobId: attForm.jobId,
      date: attForm.date,
      status: attForm.status,
      hoursWorked: attForm.status === 'Present' ? 8 : attForm.status === 'Half Day' ? 4 : attForm.status === 'Overtime' ? 11 : 0,
      recordedBy: currentUser.name,
    });

    showToast('Attendance Logged', `Recorded ${attForm.status} for ${emp.name} on ${attForm.jobId}.`, 'success');
    setIsAttendanceModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Employee Labour & Daily Site Attendance"
        subtitle="Track site electrician and helper presence against Job IDs. Labour costs are automatically calculated from daily wage rates and flow into Job P&L."
        icon={<Users size={22} />}
        actions={
          <Button
            variant="accent"
            icon={<Plus size={18} />}
            onClick={() => setIsAttendanceModalOpen(true)}
          >
            Mark Site Attendance
          </Button>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard
          label="Registered Workers"
          value={employees.length}
          meta="Electricians, Fitters, Helpers, Foremen"
          icon={<Users size={22} />}
        />
        <StatCard
          label="Total Labour Spend"
          value={`₹${totalLabourSpend.toLocaleString('en-IN')}`}
          meta="Wages credited across all jobs"
          icon={<DollarSign size={22} />}
          iconBg="#ecfdf5"
          iconColor="#059669"
        />
        <StatCard
          label="Attendance Entries"
          value={attendance.length}
          meta="Logged days across job sites"
          icon={<Calendar size={22} />}
        />
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
        tabs={[
          { id: 'attendance', label: '1. Daily Attendance Ledger', icon: <Calendar size={16} /> },
          { id: 'master', label: '2. Employee Master & Wage Rates', icon: <Users size={16} />, badge: employees.length },
        ]}
      />

      {/* TAB 1: ATTENDANCE LEDGER */}
      {activeTab === 'attendance' && (
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
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                Filter by Job Spine:
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
                <option value="ALL">All Jobs</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.id} - {j.title}</option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)', fontWeight: 600 }}>
              Showing {filteredAttendance.length} records
            </div>
          </div>

          <DataTable<AttendanceRecord>
            data={filteredAttendance}
            keyExtractor={(a) => a.id}
            searchField={(a) => `${a.employeeName} ${a.jobId} ${a.status} ${a.date}`}
            searchPlaceholder="Search attendance by worker, Job ID..."
            columns={[
              { key: 'date', header: 'Date', render: (a) => a.date },
              {
                key: 'employeeName',
                header: 'Worker Name',
                render: (a) => <strong>{a.employeeName}</strong>,
              },
              {
                key: 'jobId',
                header: 'Job ID Spine',
                render: (a) => <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{a.jobId}</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (a) => <Badge status={a.status} />,
              },
              {
                key: 'hoursWorked',
                header: 'Hours Worked',
                render: (a) => `${a.hoursWorked} hrs`,
              },
              {
                key: 'dailyCost',
                header: 'Labour Cost (Wages)',
                render: (a) => <strong style={{ color: 'var(--color-primary)' }}>₹{a.dailyCost.toLocaleString('en-IN')}</strong>,
              },
              { key: 'recordedBy', header: 'Recorded By' },
            ]}
          />
        </div>
      )}

      {/* TAB 2: EMPLOYEE MASTER */}
      {activeTab === 'master' && (
        <DataTable<Employee>
          data={employees}
          keyExtractor={(e) => e.id}
          searchField={(e) => `${e.name} ${e.role} ${e.phone}`}
          searchPlaceholder="Search employees..."
          columns={[
            {
              key: 'name',
              header: 'Worker Name',
              render: (e) => (
                <div>
                  <div style={{ fontWeight: 700 }}>{e.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)' }}>Phone: {e.phone}</div>
                </div>
              ),
            },
            { key: 'role', header: 'Designation / Skill', render: (e) => <Badge status={e.role} showIcon={false} /> },
            {
              key: 'dailyWage',
              header: 'Daily Wage Rate',
              render: (e) => <strong>₹{e.dailyWage} / day</strong>,
            },
            {
              key: 'active',
              header: 'Status',
              render: (e) => <Badge status={e.active ? 'Active' : 'Inactive'} />,
            },
          ]}
        />
      )}

      {/* Mark Attendance Modal */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title="Mark Site Worker Attendance"
      >
        <form onSubmit={handleMarkAttendance}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Select
              label="Select Worker *"
              options={[
                { value: '', label: '-- Choose Worker --' },
                ...employees.map((e) => ({ value: e.id, label: `${e.name} (${e.role} - ₹${e.dailyWage}/day)` })),
              ]}
              value={attForm.employeeId}
              onChange={(e) => setAttForm({ ...attForm, employeeId: e.target.value })}
              required
            />

            <Select
              label="Assigned Job ID *"
              options={[
                { value: '', label: '-- Select Job ID --' },
                ...jobs.map((j) => ({ value: j.id, label: `${j.id} - ${j.title}` })),
              ]}
              value={attForm.jobId}
              onChange={(e) => setAttForm({ ...attForm, jobId: e.target.value })}
              required
            />

            <Select
              label="Attendance Status *"
              options={[
                { value: 'Present', label: 'Present (Full Day - 100% Wage)' },
                { value: 'Half Day', label: 'Half Day (50% Wage)' },
                { value: 'Overtime', label: 'Overtime (140% Wage)' },
                { value: 'Absent', label: 'Absent (0 Wage)' },
              ]}
              value={attForm.status}
              onChange={(e) => setAttForm({ ...attForm, status: e.target.value as any })}
            />

            <Input
              type="date"
              label="Work Date"
              value={attForm.date}
              onChange={(e) => setAttForm({ ...attForm, date: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <Button type="button" variant="secondary" onClick={() => setIsAttendanceModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent">
                Log Attendance
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
