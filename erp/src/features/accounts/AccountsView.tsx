import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  Receipt, 
  CreditCard, 
  Landmark, 
  FileText, 
  Wallet,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ERPService } from '../../services/erpStorage';
import { 
  ExpenseRecord, 
  ClientInvoice, 
  ClientPayment, 
  PettyCashAccount, 
  Job, 
  Client 
} from '../../types';
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

export const AccountsView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const currentUser = ERPService.getCurrentUser();

  const [activeTab, setActiveTab] = useState<'expenses' | 'invoices' | 'pettycash'>('expenses');
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [pettyCash, setPettyCash] = useState<PettyCashAccount[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    jobId: searchParams.get('jobId') || '',
    category: 'Transportation',
    amount: '',
    paidBy: currentUser.name,
    notes: '',
    isOverhead: false,
  });

  // Client Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    jobId: searchParams.get('jobId') || '',
    description: '',
    amount: '',
    dueDate: '',
  });

  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ClientInvoice | undefined>(undefined);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<ClientPayment['mode']>('Bank Transfer');
  const [referenceNo, setReferenceNo] = useState('');

  const loadData = () => {
    setExpenses(ERPService.getExpenses());
    setInvoices(ERPService.getInvoices());
    setPettyCash(ERPService.getPettyCashAccounts());
    setJobs(ERPService.getJobs());
    setClients(ERPService.getClients());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('apex_storage_update', loadData);
    return () => window.removeEventListener('apex_storage_update', loadData);
  }, []);

  useEffect(() => {
    if (searchParams.get('createInvoice') === 'true') {
      setActiveTab('invoices');
      setIsInvoiceModalOpen(true);
      if (searchParams.get('jobId')) {
        setInvoiceForm((prev) => ({ ...prev, jobId: searchParams.get('jobId') || '' }));
      }
    }
  }, [searchParams]);

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalInvoiced = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalReceived = invoices.reduce((sum, i) => sum + i.paidAmount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      showToast('Validation Error', 'Please enter a valid expense amount.', 'danger');
      return;
    }

    ERPService.createExpense({
      jobId: expenseForm.isOverhead ? undefined : expenseForm.jobId || undefined,
      category: expenseForm.category,
      amount: parseFloat(expenseForm.amount),
      paidBy: expenseForm.paidBy,
      date: new Date().toISOString().split('T')[0],
      notes: expenseForm.notes || 'Recorded via Accounts module',
      status: 'Approved',
      isOverhead: expenseForm.isOverhead,
    });

    showToast('Expense Logged', `Recorded ₹${expenseForm.amount} for ${expenseForm.category}.`, 'success');
    setIsExpenseModalOpen(false);
    setExpenseForm({
      jobId: '',
      category: 'Transportation',
      amount: '',
      paidBy: currentUser.name,
      notes: '',
      isOverhead: false,
    });
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.jobId || !invoiceForm.amount || parseFloat(invoiceForm.amount) <= 0) {
      showToast('Validation Error', 'Please fill in Job ID, Description, and Amount.', 'danger');
      return;
    }

    const jobObj = jobs.find((j) => j.id === invoiceForm.jobId);
    if (!jobObj) return;

    const sub = parseFloat(invoiceForm.amount);
    const tax = sub * 0.18; // 18% GST standard
    const grand = sub + tax;

    ERPService.createInvoice({
      jobId: jobObj.id,
      jobTitle: jobObj.title,
      clientId: jobObj.clientId,
      clientName: jobObj.clientName,
      clientEmail: jobObj.clientEmail,
      clientGst: '33AAACA1234F1Z5',
      date: new Date().toISOString().split('T')[0],
      dueDate: invoiceForm.dueDate || new Date().toISOString().split('T')[0],
      items: [
        {
          description: invoiceForm.description || 'Project Progress Billing',
          qty: 1,
          unit: 'Lot',
          rate: sub,
          amount: sub,
        },
      ],
      subtotal: sub,
      gstAmount: tax,
      grandTotal: grand,
    });

    showToast('Invoice Generated', `Created progress invoice for ₹${grand.toLocaleString('en-IN')}.`, 'success');
    setIsInvoiceModalOpen(false);
    setSearchParams({});
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      showToast('Validation Error', 'Please enter a valid payment amount.', 'danger');
      return;
    }

    ERPService.recordPayment({
      invoiceId: selectedInvoice.id,
      jobId: selectedInvoice.jobId,
      amount: parseFloat(paymentAmount),
      date: new Date().toISOString().split('T')[0],
      mode: paymentMode,
      referenceNumber: referenceNo || `REF-${Date.now()}`,
      receivedBy: currentUser.name,
    });

    showToast('Payment Recorded', `Received ₹${paymentAmount} against ${selectedInvoice.id}.`, 'success');
    setIsPaymentModalOpen(false);
    setPaymentAmount('');
    setReferenceNo('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Accounts, Expenses & Client Billing"
        subtitle="Manage all financial records tied to Job IDs: expenses, petty cash allocations, client progress invoices, and payment collections."
        icon={<DollarSign size={22} />}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              icon={<Receipt size={16} />}
              onClick={() => setIsInvoiceModalOpen(true)}
            >
              Generate Client Invoice
            </Button>
            <Button
              variant="accent"
              icon={<Plus size={16} />}
              onClick={() => setIsExpenseModalOpen(true)}
            >
              Record Expense
            </Button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard
          label="Total Expenses Recorded"
          value={`₹${totalExpenseAmount.toLocaleString('en-IN')}`}
          meta="Site spends, food, freight, crane"
          icon={<DollarSign size={22} />}
        />
        <StatCard
          label="Total Invoiced to Clients"
          value={`₹${totalInvoiced.toLocaleString('en-IN')}`}
          meta="Progress billing generated"
          icon={<Receipt size={22} />}
          iconBg="#f0f9ff"
          iconColor="#0284c7"
        />
        <StatCard
          label="Total Payments Received"
          value={`₹${totalReceived.toLocaleString('en-IN')}`}
          meta="Collected from clients"
          icon={<CheckCircle2 size={22} />}
          iconBg="#ecfdf5"
          iconColor="#059669"
        />
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
        tabs={[
          { id: 'expenses', label: '1. Expense Entries (By Job ID)', icon: <DollarSign size={16} />, badge: expenses.length },
          { id: 'invoices', label: '2. Client Invoices & Billing', icon: <Receipt size={16} />, badge: invoices.length },
          { id: 'pettycash', label: '3. Petty Cash Accounts', icon: <Wallet size={16} />, badge: pettyCash.length },
        ]}
      />

      {/* TAB 1: EXPENSES */}
      {activeTab === 'expenses' && (
        <DataTable<ExpenseRecord>
          data={expenses}
          keyExtractor={(e) => e.id}
          searchField={(e) => `${e.category} ${e.jobId || 'Overhead'} ${e.paidBy} ${e.notes}`}
          searchPlaceholder="Search expenses..."
          columns={[
            { key: 'date', header: 'Date' },
            {
              key: 'jobId',
              header: 'Job Spine',
              render: (e) =>
                e.isOverhead ? (
                  <Badge status="General Overhead" variant="neutral" />
                ) : (
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                    {e.jobId}
                  </span>
                ),
            },
            {
              key: 'category',
              header: 'Category',
              render: (e) => <Badge status={e.category} showIcon={false} />,
            },
            {
              key: 'amount',
              header: 'Amount',
              render: (e) => <strong style={{ color: 'var(--color-primary)' }}>₹{e.amount.toLocaleString('en-IN')}</strong>,
            },
            { key: 'paidBy', header: 'Paid By' },
            { key: 'notes', header: 'Purpose / Bill Notes' },
            { key: 'status', header: 'Status', render: (e) => <Badge status={e.status} /> },
          ]}
        />
      )}

      {/* TAB 2: INVOICES */}
      {activeTab === 'invoices' && (
        <DataTable<ClientInvoice>
          data={invoices}
          keyExtractor={(inv) => inv.id}
          searchField={(inv) => `${inv.id} ${inv.jobId} ${inv.clientName}`}
          searchPlaceholder="Search invoices..."
          columns={[
            {
              key: 'id',
              header: 'Invoice # & Date',
              render: (inv) => (
                <div>
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{inv.id}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>{inv.date} (Due: {inv.dueDate})</div>
                </div>
              ),
            },
            {
              key: 'client',
              header: 'Client & Job',
              render: (inv) => (
                <div>
                  <div style={{ fontWeight: 700 }}>{inv.clientName}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-600)' }}>{inv.jobId} - {inv.jobTitle}</div>
                </div>
              ),
            },
            {
              key: 'grandTotal',
              header: 'Invoice Amount',
              render: (inv) => <strong>₹{inv.grandTotal.toLocaleString('en-IN')}</strong>,
            },
            {
              key: 'paidAmount',
              header: 'Paid Amount',
              render: (inv) => <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>₹{inv.paidAmount.toLocaleString('en-IN')}</span>,
            },
            {
              key: 'balanceDue',
              header: 'Balance Due',
              render: (inv) => <span style={{ color: inv.balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-gray-500)', fontWeight: 700 }}>₹{inv.balanceDue.toLocaleString('en-IN')}</span>,
            },
            { key: 'status', header: 'Status', render: (inv) => <Badge status={inv.status} /> },
            {
              key: 'actions',
              header: 'Action',
              render: (inv) =>
                inv.balanceDue > 0 ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setSelectedInvoice(inv);
                      setPaymentAmount(String(inv.balanceDue));
                      setIsPaymentModalOpen(true);
                    }}
                  >
                    Record Payment
                  </Button>
                ) : null,
            },
          ]}
        />
      )}

      {/* TAB 3: PETTY CASH */}
      {activeTab === 'pettycash' && (
        <DataTable<PettyCashAccount>
          data={pettyCash}
          keyExtractor={(pc) => pc.id}
          columns={[
            {
              key: 'custodian',
              header: 'Custodian & Role',
              render: (pc) => (
                <div>
                  <div style={{ fontWeight: 700 }}>{pc.custodianName}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)' }}>{pc.custodianRole}</div>
                </div>
              ),
            },
            {
              key: 'allocated',
              header: 'Issued Cash',
              render: (pc) => `₹${pc.allocatedAmount.toLocaleString('en-IN')}`,
            },
            {
              key: 'spent',
              header: 'Spent on Jobs',
              render: (pc) => `₹${pc.spentAmount.toLocaleString('en-IN')}`,
            },
            {
              key: 'balance',
              header: 'Remaining In Hand',
              render: (pc) => <strong style={{ color: 'var(--color-primary)' }}>₹{pc.balanceAmount.toLocaleString('en-IN')}</strong>,
            },
            { key: 'lastReconciled', header: 'Last Reconciled' },
          ]}
        />
      )}

      {/* Record Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Record Site / Operations Expense"
      >
        <form onSubmit={handleCreateExpense}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
              <input
                type="checkbox"
                id="isOverhead"
                checked={expenseForm.isOverhead}
                onChange={(e) => setExpenseForm({ ...expenseForm, isOverhead: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <label htmlFor="isOverhead" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                This is a General / Office Overhead (not charged to a specific Job ID)
              </label>
            </div>

            {!expenseForm.isOverhead && (
              <Select
                label="Target Job Spine *"
                options={[
                  { value: '', label: '-- Select Job ID --' },
                  ...jobs.map((j) => ({ value: j.id, label: `${j.id} - ${j.title}` })),
                ]}
                value={expenseForm.jobId}
                onChange={(e) => setExpenseForm({ ...expenseForm, jobId: e.target.value })}
                required={!expenseForm.isOverhead}
              />
            )}

            <Select
              label="Cost Category *"
              options={ERPService.getCostTypes().map((ct) => ({ value: ct.name, label: ct.name }))}
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
            />

            <Input
              type="number"
              label="Amount (₹) *"
              placeholder="e.g. 2500"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              required
            />

            <Input
              label="Paid By"
              value={expenseForm.paidBy}
              onChange={(e) => setExpenseForm({ ...expenseForm, paidBy: e.target.value })}
            />

            <div className="ui-form-group">
              <label className="ui-label">Purpose / Receipt Details</label>
              <textarea
                className="ui-input ui-textarea"
                rows={2}
                placeholder="Details of expense, bill number..."
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button type="button" variant="secondary" onClick={() => setIsExpenseModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent">
                Save Expense
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSearchParams({});
        }}
        title="Generate Progress Client Invoice"
      >
        <form onSubmit={handleCreateInvoice}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Select
              label="Select Job ID *"
              options={[
                { value: '', label: '-- Select Job ID --' },
                ...jobs.map((j) => ({ value: j.id, label: `${j.id} - ${j.title}` })),
              ]}
              value={invoiceForm.jobId}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, jobId: e.target.value })}
              required
            />

            <Input
              label="Billing Stage Description *"
              placeholder="e.g. Stage 2: Transformer Commissioning & Cable Laying"
              value={invoiceForm.description}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
              required
            />

            <Input
              type="number"
              label="Taxable Amount (₹) *"
              placeholder="e.g. 250000"
              value={invoiceForm.amount}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
              suffix="+18% GST"
              required
            />

            <Input
              type="date"
              label="Payment Due Date"
              value={invoiceForm.dueDate}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <Button type="button" variant="secondary" onClick={() => setIsInvoiceModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent">
                Create & Send Invoice
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Client Payment for ${selectedInvoice?.id}`}
      >
        <form onSubmit={handleRecordPayment}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-gray-600)' }}>
              Balance due on this invoice is <strong>₹{selectedInvoice?.balanceDue.toLocaleString('en-IN')}</strong>.
            </p>

            <Input
              type="number"
              label="Amount Received (₹) *"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              required
            />

            <Select
              label="Payment Mode *"
              options={[
                { value: 'Bank Transfer', label: 'NEFT / RTGS / Bank Transfer' },
                { value: 'UPI', label: 'UPI' },
                { value: 'Cheque', label: 'Cheque' },
                { value: 'Cash', label: 'Cash' },
              ]}
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as any)}
            />

            <Input
              label="Bank Reference / Transaction ID *"
              placeholder="e.g. NEFT/HDFC/9928172635"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <Button type="button" variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Record Payment
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
