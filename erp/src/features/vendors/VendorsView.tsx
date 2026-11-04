import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Tag, 
  Star,
  DollarSign
} from 'lucide-react';
import { ERPService } from '../../services/erpStorage';
import { Vendor } from '../../types';
import { 
  PageHeader, 
  Button, 
  DataTable, 
  Badge, 
  Modal, 
  Input, 
  StatCard,
  useToast
} from '../../components/ui';

export const VendorsView: React.FC = () => {
  const { showToast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    categories: '',
    paymentTerms: '30 Days Net',
  });

  const loadData = () => {
    setVendors(ERPService.getVendors());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('apex_storage_update', loadData);
    return () => window.removeEventListener('apex_storage_update', loadData);
  }, []);

  const totalOutstanding = vendors.reduce((sum, v) => sum + v.outstandingBalance, 0);

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      showToast('Validation Error', 'Please enter Vendor Name and Contact Phone.', 'danger');
      return;
    }

    const newVendor: Vendor = {
      id: `ven-${Date.now()}`,
      name: formData.name,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      gstNumber: formData.gstNumber,
      categories: formData.categories.split(',').map((c) => c.trim()).filter(Boolean),
      paymentTerms: formData.paymentTerms,
      rating: 4.8,
      outstandingBalance: 0,
    };

    const currentVendors = ERPService.getVendors();
    localStorage.setItem('apex_erp_vendors', JSON.stringify([...currentVendors, newVendor]));
    window.dispatchEvent(new Event('apex_storage_update'));

    ERPService.addAuditLog('CREATE_VENDOR', 'Vendor', newVendor.id, undefined, undefined, newVendor.name, 'New vendor registered');
    showToast('Vendor Added', `${newVendor.name} added to vendor registry.`, 'success');
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      gstNumber: '',
      categories: '',
      paymentTerms: '30 Days Net',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Vendor Directory & Suppliers"
        subtitle="Manage electrical equipment suppliers, rate histories, GST records, and payment balances."
        icon={<Building2 size={22} />}
        actions={
          <Button
            variant="accent"
            icon={<Plus size={18} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Register New Vendor
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard
          label="Registered Vendors"
          value={vendors.length}
          meta="Cables, Switchgear, Lighting, Transformers"
          icon={<Building2 size={22} />}
        />
        <StatCard
          label="Total Vendor Outstanding"
          value={`₹${totalOutstanding.toLocaleString('en-IN')}`}
          meta="Pending bills payable across vendors"
          icon={<DollarSign size={22} />}
          iconBg="#fef3c7"
          iconColor="#d97706"
        />
      </div>

      <DataTable<Vendor>
        data={vendors}
        keyExtractor={(v) => v.id}
        searchField={(v) => `${v.name} ${v.contactPerson} ${v.gstNumber} ${v.categories.join(' ')}`}
        searchPlaceholder="Search vendors by name, GST, category..."
        columns={[
          {
            key: 'name',
            header: 'Vendor Name',
            render: (v) => (
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary)' }}>{v.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)' }}>GST: {v.gstNumber}</div>
              </div>
            ),
          },
          {
            key: 'contact',
            header: 'Contact Person & Phone',
            render: (v) => (
              <div>
                <div style={{ fontWeight: 600 }}>{v.contactPerson}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)' }}>{v.phone} • {v.email}</div>
              </div>
            ),
          },
          {
            key: 'categories',
            header: 'Categories Supplied',
            render: (v) => (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {v.categories.map((c) => (
                  <span key={c} style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                    {c}
                  </span>
                ))}
              </div>
            ),
          },
          {
            key: 'paymentTerms',
            header: 'Payment Terms',
            render: (v) => v.paymentTerms,
          },
          {
            key: 'outstanding',
            header: 'Outstanding Balance',
            render: (v) => (
              <span style={{ fontWeight: 700, color: v.outstandingBalance > 0 ? 'var(--color-accent)' : 'var(--color-success)' }}>
                ₹{v.outstandingBalance.toLocaleString('en-IN')}
              </span>
            ),
          },
        ]}
      />

      {/* Add Vendor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Electrical Vendor"
      >
        <form onSubmit={handleAddVendor}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input
              label="Vendor Company Name *"
              placeholder="e.g. Polycab Wires Ltd"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
              <Input
                label="Contact Person"
                placeholder="e.g. Ramanathan G"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
              <Input
                label="Phone Number *"
                placeholder="+91 98410 55667"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
              <Input
                label="Email Address"
                placeholder="sales@vendor.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="GST Number"
                placeholder="33AAACP2345K1Z2"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              />
            </div>

            <Input
              label="Categories (comma separated)"
              placeholder="Cables, Wires, Switchgear, Fans"
              value={formData.categories}
              onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
            />

            <Input
              label="Payment Terms"
              placeholder="e.g. 30 Days Net or 50% Advance"
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent">
                Register Vendor
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
