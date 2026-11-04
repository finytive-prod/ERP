import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  Camera,
  Upload,
  Building2,
  Warehouse,
  CheckCircle2,
  Calendar,
  FileText,
  AlertCircle,
  Hash,
  IndianRupee,
  Eye,
  Trash2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { PurchaseOrder, LocationMaster, Job } from '../../types';
import { ERPService } from '../../services/erpStorage';
import { Button, useToast } from '../../components/ui';

interface ReceiveBilledItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
  onSuccess?: (updatedPO: PurchaseOrder) => void;
}

// Sample realistic invoice images for one-click testing if user doesn't have camera/photo handy
const SAMPLE_BILLS = [
  {
    name: 'Standard GST Tax Invoice',
    url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=800&q=80',
    numberPrefix: 'TAX-INV-2026-',
  },
  {
    name: 'Material Delivery Challan (DC)',
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    numberPrefix: 'DC-BLR-',
  },
];

export const ReceiveBilledItemsModal: React.FC<ReceiveBilledItemsModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [billAmount, setBillAmount] = useState<string>('0');
  const [billPhotoUrl, setBillPhotoUrl] = useState<string>('');
  const [remarks, setRemarks] = useState('');

  // Destination configuration: 'site' (Job Site Store) vs 'warehouse' (Central Warehouse / Inventory)
  const [destinationType, setDestinationType] = useState<'site' | 'warehouse'>('site');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [locations, setLocations] = useState<LocationMaster[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Item received quantities
  const [receivedQtyMap, setReceivedQtyMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isOpen || !purchaseOrder) return;

    setLocations(ERPService.getLocations());
    setJobs(ERPService.getJobs());

    // Default bill number & amount from PO
    const randomBillNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setBillNumber(purchaseOrder.billNumber || randomBillNum);
    setBillDate(purchaseOrder.billDate || new Date().toISOString().split('T')[0]);
    setBillAmount(String(purchaseOrder.billAmount || purchaseOrder.grandTotal));
    setBillPhotoUrl(purchaseOrder.billPhotoUrl || '');
    setRemarks(purchaseOrder.receivedRemarks || `Materials received in good condition against PO ${purchaseOrder.id}.`);

    // Determine default destination from PO's deliveryLocation
    const locLower = (purchaseOrder.deliveryLocation || '').toLowerCase();
    if (locLower.includes('warehouse') || locLower.includes('central') || locLower.includes('ambattur')) {
      setDestinationType('warehouse');
    } else {
      setDestinationType('site');
    }

    const allLocs = ERPService.getLocations();
    if (allLocs.length > 0) {
      setSelectedWarehouseId(allLocs[0].name);
    }

    // Initialize received quantities to PO purchaseQty
    const qtyInit: Record<string, number> = {};
    purchaseOrder.items.forEach((item) => {
      qtyInit[item.id] = item.purchaseQty;
    });
    setReceivedQtyMap(qtyInit);
  }, [isOpen, purchaseOrder]);

  if (!isOpen || !purchaseOrder) return null;

  // Handle image upload from computer or camera snapshot
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please select an image file (JPG, PNG, WebP) of the purchased bill.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setBillPhotoUrl(dataUrl);
      showToast('Bill Photo Captured', 'Purchased bill photo attached successfully.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleUseSampleBill = (sample: typeof SAMPLE_BILLS[0]) => {
    setBillPhotoUrl(sample.url);
    if (!billNumber || billNumber.startsWith('INV-')) {
      setBillNumber(`${sample.numberPrefix}${Math.floor(1000 + Math.random() * 9000)}`);
    }
    showToast('Sample Bill Attached', `Using ${sample.name} for testing.`, 'info');
  };

  const handleUpdateQty = (itemId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setReceivedQtyMap((prev) => ({
      ...prev,
      [itemId]: num,
    }));
  };

  const handleReceiveAll = () => {
    const qtyInit: Record<string, number> = {};
    purchaseOrder.items.forEach((item) => {
      qtyInit[item.id] = item.purchaseQty;
    });
    setReceivedQtyMap(qtyInit);
    showToast('Quantities Filled', 'All items set to 100% full PO quantities.', 'info');
  };

  // Resolve final destination name
  const finalDestinationName =
    destinationType === 'site'
      ? `Site Store (${purchaseOrder.jobId}: ${purchaseOrder.jobTitle})`
      : (selectedWarehouseId || 'Central Warehouse (Ambattur)');

  // Form submission: Move to stock & verify bill
  const handleSubmitReceipt = (e: React.FormEvent) => {
    e.preventDefault();

    if (!billNumber.trim()) {
      showToast('Bill Number Required', 'Please enter the Vendor Bill / Tax Invoice Number.', 'danger');
      return;
    }

    if (!billPhotoUrl) {
      showToast(
        'Bill Photo Proof Required',
        'Please take or upload a photo of the purchased vendor bill / invoice to move items to stock.',
        'danger'
      );
      return;
    }

    const receivedItems = purchaseOrder.items.map((line) => ({
      itemId: line.itemId,
      itemName: line.itemName,
      unit: line.unit,
      receivedQty: receivedQtyMap[line.id] !== undefined ? receivedQtyMap[line.id] : line.purchaseQty,
      jobId: line.jobId || purchaseOrder.jobId,
    }));

    const totalQtyReceived = receivedItems.reduce((sum, i) => sum + i.receivedQty, 0);
    if (totalQtyReceived <= 0) {
      showToast('Quantity Required', 'At least one item must have a received quantity > 0.', 'danger');
      return;
    }

    try {
      const updatedPO = ERPService.receivePurchasedItems(purchaseOrder.id, {
        billNumber: billNumber.trim(),
        billDate,
        billAmount: parseFloat(billAmount) || purchaseOrder.grandTotal,
        billPhotoUrl,
        destinationType,
        destinationName: finalDestinationName,
        targetJobId: purchaseOrder.jobId !== 'MULTI-JOB' ? purchaseOrder.jobId : undefined,
        receivedItems,
        remarks: remarks.trim(),
      });

      showToast(
        'Items Inwarded to Stock',
        `PO ${purchaseOrder.id} successfully received against Bill #${billNumber.trim()} and moved to ${finalDestinationName}!`,
        'success'
      );

      if (onSuccess) {
        onSuccess(updatedPO);
      }
      onClose();
    } catch (err: any) {
      showToast('Receipt Failed', err.message || 'Error receiving purchased items', 'danger');
    }
  };

  return (
    <div className="ui-modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="ui-modal-content"
        style={{
          maxWidth: '920px',
          width: '95vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: 8,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 22px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.15rem', fontWeight: 800 }}>
              <PackageCheck size={22} color="#38bdf8" />
              <span>Material Inward & Bill Proof Verification</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 3 }}>
              Order: <strong style={{ color: '#ffffff' }}>{purchaseOrder.id}</strong> • Vendor:{' '}
              <strong style={{ color: '#ffffff' }}>{purchaseOrder.vendorName}</strong> • Value:{' '}
              <strong style={{ color: '#38bdf8' }}>₹{purchaseOrder.grandTotal.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              fontSize: '1.4rem',
              color: '#94a3b8',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmitReceipt}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* STEP 1: BILL PROOF & PHOTO CAPTURE */}
          <div
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              backgroundColor: '#f8fafc',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Camera size={18} color="var(--color-primary)" />
              <strong style={{ fontSize: '0.94rem', color: '#0f172a' }}>
                1. Vendor Purchased Bill & Photo Proof <span style={{ color: '#dc2626' }}>*</span>
              </strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Bill / Tax Invoice No. <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Hash size={14} style={{ position: 'absolute', left: 8, top: 10, color: '#94a3b8' }} />
                  <input
                    type="text"
                    required
                    className="ui-input"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    placeholder="e.g. INV-2026-8819"
                    style={{ paddingLeft: 28, fontSize: '0.86rem', fontWeight: 700 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Bill Date <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={14} style={{ position: 'absolute', left: 8, top: 10, color: '#94a3b8' }} />
                  <input
                    type="date"
                    required
                    className="ui-input"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    style={{ paddingLeft: 28, fontSize: '0.86rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Billed Amount (₹) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <IndianRupee size={14} style={{ position: 'absolute', left: 8, top: 10, color: '#94a3b8' }} />
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="ui-input"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    style={{ paddingLeft: 28, fontSize: '0.86rem', fontWeight: 700 }}
                  />
                </div>
              </div>
            </div>

            {/* Photo Capture / Upload Box */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                Take Photo / Upload Bill Proof:
              </label>

              {!billPhotoUrl ? (
                <div
                  style={{
                    border: '2px dashed #94a3b8',
                    borderRadius: 6,
                    padding: '16px 20px',
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Camera size={32} color="#64748b" />
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                    Capture or Upload Vendor Purchased Bill Photo
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Take a snapshot with your device camera or upload an image file (JPG, PNG).
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
                    <label
                      style={{
                        padding: '6px 14px',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        borderRadius: 4,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Upload size={14} />
                      <span>Take Photo / Choose File</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {/* Pre-set sample bills for quick demo */}
                    {SAMPLE_BILLS.map((sb, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleUseSampleBill(sb)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          borderRadius: 4,
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          border: '1px solid #cbd5e1',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <Sparkles size={12} color="#6366f1" />
                        <span>Use {sb.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 10,
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                  }}
                >
                  <div style={{ position: 'relative', width: 90, height: 70, borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                    <img
                      src={billPhotoUrl}
                      alt="Purchased Bill Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#166534', fontWeight: 800, fontSize: '0.85rem' }}>
                      <CheckCircle2 size={16} />
                      <span>Bill Photo Attached</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                      Verified for Bill #{billNumber || 'Pending Number'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <label
                      style={{
                        padding: '4px 10px',
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        borderRadius: 4,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: '1px solid #cbd5e1',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Camera size={13} />
                      <span>Retake / Change</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setBillPhotoUrl('')}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fca5a5',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                      title="Remove photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: DESTINATION CONFIGURATION (SITE STORE VS CENTRAL INVENTORY) */}
          <div
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              backgroundColor: '#f8fafc',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Warehouse size={18} color="var(--color-primary)" />
              <strong style={{ fontSize: '0.94rem', color: '#0f172a' }}>
                2. Material Movement Destination <span style={{ color: '#dc2626' }}>*</span>
              </strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Option A: Job Site Store */}
              <div
                onClick={() => setDestinationType('site')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 6,
                  border: destinationType === 'site' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  backgroundColor: destinationType === 'site' ? '#f0f9ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                    <Building2 size={16} color="#0284c7" />
                    <span>Job Site Store (Direct to Project)</span>
                  </div>
                  <input
                    type="radio"
                    name="destinationType"
                    checked={destinationType === 'site'}
                    onChange={() => setDestinationType('site')}
                  />
                </div>
                <div style={{ fontSize: '0.76rem', color: '#475569' }}>
                  Target Project:{' '}
                  <strong style={{ color: '#0369a1' }}>
                    {purchaseOrder.jobId} - {purchaseOrder.jobTitle}
                  </strong>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 3 }}>
                  ✓ Inwards stock directly to the project site ledger for site execution & task consumption.
                </div>
              </div>

              {/* Option B: Central Warehouse */}
              <div
                onClick={() => setDestinationType('warehouse')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 6,
                  border: destinationType === 'warehouse' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  backgroundColor: destinationType === 'warehouse' ? '#f0f9ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                    <Warehouse size={16} color="#6366f1" />
                    <span>Central Warehouse (Company Inventory)</span>
                  </div>
                  <input
                    type="radio"
                    name="destinationType"
                    checked={destinationType === 'warehouse'}
                    onChange={() => setDestinationType('warehouse')}
                  />
                </div>
                <div style={{ fontSize: '0.76rem', color: '#475569', marginBottom: 4 }}>
                  Target Warehouse / Yard:
                </div>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => {
                    setDestinationType('warehouse');
                    setSelectedWarehouseId(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: 4,
                    border: '1px solid #cbd5e1',
                  }}
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name} ({loc.type})
                    </option>
                  ))}
                  <option value="Central Warehouse (Ambattur)">Central Warehouse (Ambattur)</option>
                  <option value="Central Yard & Stockyard (Chennai)">Central Yard & Stockyard (Chennai)</option>
                </select>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                  ✓ Stored as unallocated company stock; can be transferred to jobs later.
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: ITEMS & RECEIVED QUANTITIES VERIFICATION */}
          <div
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              backgroundColor: '#ffffff',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '10px 16px',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #cbd5e1',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PackageCheck size={18} color="#0f172a" />
                <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>
                  3. Verify Received Material Quantities ({purchaseOrder.items.length} Lines)
                </strong>
              </div>

              <button
                type="button"
                onClick={handleReceiveAll}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#0284c7',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Receive 100% Full Quantities
              </button>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: 220 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ width: 40, padding: '8px 10px', textAlign: 'center' }}>#</th>
                    <th style={{ width: 85, padding: '8px' }}>BOQ S.No</th>
                    <th style={{ minWidth: 200, padding: '8px' }}>Product / Material Name</th>
                    <th style={{ width: 70 }}>Unit</th>
                    <th style={{ width: 100, textAlign: 'right', padding: '8px' }}>Ordered Qty</th>
                    <th style={{ width: 130, textAlign: 'right', padding: '8px' }}>Received Qty *</th>
                    <th style={{ width: 100, textAlign: 'right', padding: '8px' }}>Line Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrder.items.map((line, idx) => {
                    const currentVal = receivedQtyMap[line.id] !== undefined ? receivedQtyMap[line.id] : line.purchaseQty;
                    return (
                      <tr key={line.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ textAlign: 'center', padding: '6px 10px', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 700, padding: '6px 8px', color: '#475569' }}>
                          [{line.boqLineSNo || '-'}]
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{line.itemName}</div>
                          {line.specification && (
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{line.specification}</div>
                          )}
                        </td>
                        <td>{line.unit}</td>
                        <td style={{ textAlign: 'right', padding: '6px 8px', color: '#475569', fontWeight: 600 }}>
                          {line.purchaseQty} {line.unit}
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px 8px' }}>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={currentVal}
                            onChange={(e) => handleUpdateQty(line.id, e.target.value)}
                            style={{
                              width: 90,
                              padding: '4px 6px',
                              textAlign: 'right',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              borderRadius: 4,
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                            }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 700 }}>
                          ₹{line.totalAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remarks input */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              Receiving Remarks & Delivery Condition:
            </label>
            <input
              type="text"
              className="ui-input"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Inspected on delivery; materials intact without damage; test certificates verified."
              style={{ fontSize: '0.84rem' }}
            />
          </div>

          {/* Destination Movement Confirmation Banner */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.82rem',
              color: '#065f46',
            }}
          >
            <CheckCircle2 size={18} color="#059669" />
            <div>
              <strong>Stock Movement Route:</strong> Items will be recorded as received from{' '}
              <strong>{purchaseOrder.vendorName}</strong> and immediately inwarded into{' '}
              <strong style={{ textDecoration: 'underline' }}>{finalDestinationName}</strong>.
            </div>
          </div>

          {/* Modal Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              paddingTop: 8,
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              variant="accent"
              type="submit"
              icon={<ArrowRight size={16} />}
              disabled={!billPhotoUrl || !billNumber.trim()}
            >
              Confirm Bill Proof & Move to Stock
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
