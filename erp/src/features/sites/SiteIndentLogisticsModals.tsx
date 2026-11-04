import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  FileText, 
  CheckCircle2, 
  Camera, 
  UploadCloud, 
  AlertCircle, 
  MapPin, 
  Boxes, 
  Eye, 
  X,
  IndianRupee,
  Calendar,
  User,
  ShieldCheck
} from 'lucide-react';
import { Modal, Button, Input, Select, useToast } from '../../components/ui';
import { MaterialRequest, StockLedgerItem } from '../../types';
import { ERPService } from '../../services/erpStorage';

export const SAMPLE_PROOF_DC = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420"><rect width="600" height="420" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="2"/><rect x="20" y="20" width="560" height="380" fill="%23ffffff" stroke="%2394a3b8" stroke-dasharray="4"/><text x="40" y="55" font-family="sans-serif" font-size="16" font-weight="bold" fill="%230f172a">CENTRAL WAREHOUSE DELIVERY CHALLAN</text><text x="40" y="75" font-family="sans-serif" font-size="12" fill="%2364748b">Apex Electrical Supply &amp; Contracting - Logistics Division</text><line x1="40" y1="90" x2="560" y2="90" stroke="%23e2e8f0" stroke-width="2"/><text x="40" y="120" font-family="sans-serif" font-size="12" fill="%23334155">DC Number: <tspan font-weight="bold" fill="%230284c7">DC-2026-WH-089</tspan></text><text x="320" y="120" font-family="sans-serif" font-size="12" fill="%23334155">Vehicle: <tspan font-weight="bold">TN-09-CB-4521 (Tata Ace)</tspan></text><text x="40" y="150" font-family="sans-serif" font-size="12" fill="%23334155">Material: <tspan font-weight="bold">1.5 Sq.mm FRLS Copper Wire (Mtr)</tspan></text><text x="320" y="150" font-family="sans-serif" font-size="12" fill="%23334155">Dispatch Qty: <tspan font-weight="bold" fill="%23166534">20 Mtr (1 Coil)</tspan></text><text x="40" y="180" font-family="sans-serif" font-size="12" fill="%23334155">Driver: Murugan (+91 98401 55667)</text><text x="320" y="180" font-family="sans-serif" font-size="12" fill="%23334155">Freight Paid: <tspan font-weight="bold">₹500 (Transport Exp)</tspan></text><rect x="40" y="220" width="260" height="150" fill="%23f0fdf4" stroke="%2316a34a" stroke-width="2" rx="8"/><circle cx="80" cy="260" r="24" fill="%2316a34a" opacity="0.15"/><text x="115" y="255" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23166534">VERIFIED &amp; RECEIVED</text><text x="115" y="272" font-family="sans-serif" font-size="11" fill="%2315803d">APEX SITE STORE INWARD</text><text x="60" y="310" font-family="sans-serif" font-size="11" fill="%23334155">Site: Apex Grand City Mall Store</text><text x="60" y="330" font-family="sans-serif" font-size="11" fill="%23334155">Engineer Signature: Vignesh S</text><text x="60" y="350" font-family="sans-serif" font-size="10" fill="%2364748b">Date: 27-Oct-2026 | Physical Count: 20 Mtr OK</text><rect x="330" y="220" width="230" height="150" fill="%23f8fafc" stroke="%23cbd5e1" rx="8"/><text x="350" y="250" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23475569">SECURITY GATE PASS</text><text x="350" y="280" font-family="sans-serif" font-size="11" fill="%2364748b">Gate Entry No: GP-SITE-849</text><text x="350" y="305" font-family="sans-serif" font-size="11" fill="%2364748b">Driver In-Time: 11:45 AM</text><text x="350" y="330" font-family="sans-serif" font-size="11" fill="%2316a34a" font-weight="bold">✓ MATERIAL UNLOADED</text></svg>`;

export const SAMPLE_PROOF_PHOTO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420"><rect width="600" height="420" fill="%230f172a"/><rect x="30" y="30" width="540" height="360" fill="%231e293b" rx="10"/><circle cx="300" cy="180" r="90" fill="%23334155" stroke="%23f59e0b" stroke-width="12"/><circle cx="300" cy="180" r="50" fill="%231e293b" stroke="%23ef4444" stroke-width="8"/><text x="300" y="185" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23ffffff">1.5 SQ.MM WIRE COIL</text><rect x="60" y="290" width="480" height="80" fill="%23000000" opacity="0.75" rx="6"/><text x="80" y="318" font-family="sans-serif" font-size="13" font-weight="bold" fill="%234ade80">✓ SITE STORE INWARD PHOTO PROOF</text><text x="80" y="340" font-family="sans-serif" font-size="11" fill="%23cbd5e1">Item: 1.5 Sq.mm FRLS Copper Wire (20 Mtr Coil)</text><text x="80" y="358" font-family="sans-serif" font-size="10" fill="%2394a3b8">Photo captured at Site Store • Receiver: Vignesh S (Site Engineer) • 27-Oct-2026</text></svg>`;

// ==========================================
// 1. DISPATCH INDENT FROM WAREHOUSE MODAL
// ==========================================
interface DispatchIndentModalProps {
  isOpen: boolean;
  onClose: () => void;
  indent: MaterialRequest | null;
  onDispatched?: () => void;
}

export const DispatchIndentModal: React.FC<DispatchIndentModalProps> = ({
  isOpen,
  onClose,
  indent,
  onDispatched,
}) => {
  const { showToast } = useToast();
  const [warehouseName, setWarehouseName] = useState('Central Warehouse (Ambattur)');
  const [dispatchQty, setDispatchQty] = useState('');
  const [transportCost, setTransportCost] = useState('500');
  const [vehicleNumber, setVehicleNumber] = useState('TN-09-CB-4521');
  const [driverOrContact, setDriverOrContact] = useState('Murugan (+91 98401 55667)');
  const [dispatchChallanNumber, setDispatchChallanNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Lookup available stock in warehouse
  const [whStock, setWhStock] = useState<number>(0);

  useEffect(() => {
    if (indent) {
      setDispatchQty(String(indent.requestedExtraQty));
      setDispatchChallanNumber(`DC-${new Date().getFullYear()}-WH-${Math.floor(100 + Math.random() * 900)}`);
      setTransportCost('500');
      setVehicleNumber('TN-09-CB-4521');
      setDriverOrContact('Murugan (+91 98401 55667)');
      setNotes(`Fulfillment of Indent #${indent.id} for ${indent.siteName || indent.jobId}`);

      const ledger = ERPService.getStockLedger();
      const match = ledger.find(
        (l) =>
          (l.isUnallocated || l.locationName.toLowerCase().includes('warehouse')) &&
          (l.itemId === indent.itemId || l.itemName.toLowerCase() === indent.itemName.toLowerCase())
      );
      setWhStock(match?.stockOnSite || 0);
    }
  }, [indent, isOpen]);

  if (!indent) return null;

  const numQty = parseFloat(dispatchQty) || 0;
  const numFreight = parseFloat(transportCost) || 0;
  const isStockInsufficient = whStock < numQty && whStock > 0;
  const isZeroStock = whStock <= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numQty <= 0) {
      showToast('Invalid Quantity', 'Please enter a valid dispatch quantity > 0.', 'danger');
      return;
    }

    ERPService.dispatchSiteIndentFromWarehouse(indent.id, {
      warehouseName,
      dispatchQty: numQty,
      transportCost: numFreight,
      vehicleNumber: vehicleNumber.trim(),
      driverOrContact: driverOrContact.trim(),
      dispatchChallanNumber: dispatchChallanNumber.trim(),
      notes: notes.trim(),
    });

    showToast(
      'Dispatched & Exported from Warehouse',
      `Dispatched ${numQty} ${indent.unit} of "${indent.itemName}". Travel & freight cost ₹${numFreight} automatically added to Job expenses.`,
      'success'
    );

    if (onDispatched) onDispatched();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🚚 Dispatch & Export Material from Warehouse"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Indent Header Summary */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 8,
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            fontSize: '0.84rem',
            color: '#1e3a8a',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontWeight: 800 }}>Requisition #{indent.id}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#dbeafe', padding: '2px 8px', borderRadius: 10 }}>
              Job: {indent.jobId}
            </span>
          </div>
          <div>
            Destination Site: <strong>{indent.siteName || 'Project Site'}</strong> • Site Engineer: <strong>{indent.siteEngineerName || 'Site Staff'}</strong>
          </div>
          <div style={{ marginTop: 4 }}>
            Material: <strong>{indent.itemName}</strong> ({indent.specification || 'Standard Spec'})
          </div>
        </div>

        {/* Warehouse Selection & Live Stock Indicator */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, alignItems: 'end' }}>
          <Select
            label="Dispatching Warehouse *"
            options={[
              { value: 'Central Warehouse (Ambattur)', label: '🏬 Central Warehouse (Ambattur)' },
              { value: 'Secondary Hub (Guindy)', label: '🏬 Secondary Logistics Hub (Guindy)' },
            ]}
            value={warehouseName}
            onChange={(e) => setWarehouseName(e.target.value)}
            required
          />

          <div
            style={{
              padding: '8px 12px',
              backgroundColor: isZeroStock ? '#fef2f2' : '#f0fdf4',
              border: isZeroStock ? '1px solid #fecaca' : '1px solid #bbf7d0',
              borderRadius: 6,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: isZeroStock ? '#991b1b' : '#166534', fontWeight: 700 }}>
              AVAILABLE WH STOCK
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isZeroStock ? '#dc2626' : '#15803d' }}>
              {whStock} {indent.unit}
            </div>
          </div>
        </div>

        {isZeroStock && (
          <div style={{ padding: '8px 12px', borderRadius: 6, backgroundColor: '#fffbeb', border: '1px solid #fde68a', fontSize: '0.78rem', color: '#92400e' }}>
            ⚠️ Note: Central Warehouse recorded 0 stock for this item. Dispatching will mark stock as transferred. Consider purchasing via PO if physical stock is unavailable.
          </div>
        )}

        {/* Dispatch Quantity & Delivery Challan */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input
            type="number"
            step="any"
            min="0.1"
            label={`Dispatch Quantity (${indent.unit}) *`}
            placeholder="e.g. 20"
            value={dispatchQty}
            onChange={(e) => setDispatchQty(e.target.value)}
            required
          />

          <Input
            label="Delivery Challan (DC) / Gate Pass # *"
            placeholder="e.g. DC-2026-WH-089"
            value={dispatchChallanNumber}
            onChange={(e) => setDispatchChallanNumber(e.target.value)}
            required
          />
        </div>

        {/* Transport / Freight Cost & Vehicle Info (User Flow Requirement) */}
        <div
          style={{
            padding: 12,
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
            <Truck size={16} color="#0284c7" />
            Transportation & Travel Logistics
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0284c7', backgroundColor: '#e0f2fe', padding: '1px 6px', borderRadius: 4 }}>
              Auto-booked to Job Expenses
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Input
              type="number"
              step="any"
              min="0"
              label="Travel / Freight Cost (₹) *"
              placeholder="e.g. 500"
              value={transportCost}
              onChange={(e) => setTransportCost(e.target.value)}
              required
            />

            <Input
              label="Vehicle / Tempo No. *"
              placeholder="e.g. TN-09-CB-4521"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              required
            />

            <Input
              label="Driver Name & Contact"
              placeholder="e.g. Murugan (+91 98401...)"
              value={driverOrContact}
              onChange={(e) => setDriverOrContact(e.target.value)}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
            Dispatch Remarks / Gate Instructions
          </label>
          <textarea
            rows={2}
            className="ui-input"
            placeholder="e.g. 20 Mtr coil loaded onto tempo. DC copy handed to driver."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>

        {/* Impact Summary Pill */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 6,
            fontSize: '0.78rem',
            color: '#166534',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <div style={{ fontWeight: 800 }}>✓ Immediate System Updates on Export:</div>
          <div>• Central Warehouse stock decreases: <strong>{whStock} {indent.unit} ➔ {Math.max(0, whStock - numQty)} {indent.unit}</strong></div>
          <div>• Transport freight cost: <strong>₹{numFreight.toLocaleString('en-IN')}</strong> booked to <strong>{indent.jobId}</strong> under Transportation Expense</div>
          <div>• Requisition moves to <strong>Dispatched from Warehouse</strong> waiting for Site Engineer proof acknowledgment</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" type="submit" icon={<Truck size={14} />}>
            Confirm Dispatch & Export
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ==========================================
// 2. RECEIVE MATERIAL AT SITE & PROOF MODAL
// ==========================================
interface ReceiveIndentModalProps {
  isOpen: boolean;
  onClose: () => void;
  indent: MaterialRequest | null;
  onReceived?: () => void;
}

export const ReceiveIndentModal: React.FC<ReceiveIndentModalProps> = ({
  isOpen,
  onClose,
  indent,
  onReceived,
}) => {
  const { showToast } = useToast();
  const [receivedQty, setReceivedQty] = useState('');
  const [deliveryProofPhotoUrl, setDeliveryProofPhotoUrl] = useState('');
  const [notes, setNotes] = useState('20 Mtr wire coil physically verified and received in good order. Verified with DC copy.');
  const [engineerName, setEngineerName] = useState('');

  // Lookup current site store stock
  const [siteStock, setSiteStock] = useState<number>(0);

  useEffect(() => {
    if (indent) {
      setReceivedQty(String(indent.requestedExtraQty));
      setEngineerName(indent.siteEngineerName || 'Vignesh S');
      setDeliveryProofPhotoUrl(SAMPLE_PROOF_DC); // default ready-to-test signed DC proof
      setNotes(`Physically received ${indent.requestedExtraQty} ${indent.unit} of ${indent.itemName} at Site Store. Verified with DC ${indent.dispatchChallanNumber || 'N/A'}.`);

      const ledger = ERPService.getStockLedger(indent.jobId);
      const match = ledger.find(
        (l) =>
          l.itemId === indent.itemId || l.itemName.toLowerCase() === indent.itemName.toLowerCase()
      );
      setSiteStock(match?.stockOnSite || 0);
    }
  }, [indent, isOpen]);

  if (!indent) return null;

  const numReceived = parseFloat(receivedQty) || 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setDeliveryProofPhotoUrl(event.target.result as string);
        showToast('Proof Photo Loaded', `${file.name} successfully attached as delivery proof.`, 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numReceived <= 0) {
      showToast('Invalid Quantity', 'Please enter a valid received quantity > 0.', 'danger');
      return;
    }
    if (!deliveryProofPhotoUrl) {
      showToast('Delivery Proof Required', 'Please attach a photo or select a proof preset before receiving.', 'danger');
      return;
    }

    ERPService.acknowledgeSiteMaterialReceivedByEngineer(indent.id, {
      engineerName: engineerName.trim() || 'Site Engineer',
      receivedQty: numReceived,
      deliveryProofPhotoUrl,
      notes: notes.trim(),
    });

    showToast(
      'Material Received into Site Store',
      `Site Engineer ${engineerName} acknowledged receipt of ${numReceived} ${indent.unit} of "${indent.itemName}". Site stock updated and indent closed!`,
      'success'
    );

    if (onReceived) onReceived();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📦 Receive Material & Attach Proof (Site Engineer)"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Dispatch Details Banner */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 8,
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            fontSize: '0.84rem',
            color: '#1e3a8a',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontWeight: 800 }}>🚚 Dispatched from {indent.dispatchedFrom || 'Central Warehouse'}</span>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#2563eb' }}>
              DC: {indent.dispatchChallanNumber || 'DC-WH-089'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4, fontSize: '0.78rem' }}>
            <div>Vehicle: <strong>{indent.vehicleNumber || 'TN-09-CB-4521'}</strong></div>
            <div>Driver: <strong>{indent.driverOrContact || 'Murugan'}</strong></div>
            <div>Dispatched Qty: <strong>{indent.requestedExtraQty} {indent.unit}</strong></div>
            <div>Freight Exp: <strong>₹{indent.transportCost || 500}</strong></div>
          </div>
        </div>

        {/* Received Quantity & Receiving Engineer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input
            type="number"
            step="any"
            min="0.1"
            label={`Physically Received Qty (${indent.unit}) *`}
            placeholder="e.g. 20"
            value={receivedQty}
            onChange={(e) => setReceivedQty(e.target.value)}
            required
          />

          <Input
            label="Receiving Site Engineer Name *"
            placeholder="e.g. Vignesh S"
            value={engineerName}
            onChange={(e) => setEngineerName(e.target.value)}
            required
          />
        </div>

        {/* ATTACH DELIVERY PROOF PHOTO (Mandatory User Requirement) */}
        <div
          style={{
            padding: 12,
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
              <Camera size={16} color="#0284c7" />
              Delivery Proof / Stamped DC Photo (Required) *
            </div>
            {deliveryProofPhotoUrl && (
              <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700, backgroundColor: '#dcfce7', padding: '1px 8px', borderRadius: 10 }}>
                ✓ Proof Attached
              </span>
            )}
          </div>

          {/* Quick presets for immediate testing */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', alignSelf: 'center' }}>Quick demo presets:</span>
            <button
              type="button"
              className="ui-button"
              onClick={() => setDeliveryProofPhotoUrl(SAMPLE_PROOF_DC)}
              style={{
                fontSize: '0.74rem',
                padding: '4px 8px',
                borderRadius: 4,
                backgroundColor: deliveryProofPhotoUrl === SAMPLE_PROOF_DC ? '#e0f2fe' : '#ffffff',
                border: deliveryProofPhotoUrl === SAMPLE_PROOF_DC ? '1px solid #0284c7' : '1px solid #cbd5e1',
                color: deliveryProofPhotoUrl === SAMPLE_PROOF_DC ? '#0369a1' : '#475569',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              📋 Stamped DC Copy
            </button>
            <button
              type="button"
              className="ui-button"
              onClick={() => setDeliveryProofPhotoUrl(SAMPLE_PROOF_PHOTO)}
              style={{
                fontSize: '0.74rem',
                padding: '4px 8px',
                borderRadius: 4,
                backgroundColor: deliveryProofPhotoUrl === SAMPLE_PROOF_PHOTO ? '#e0f2fe' : '#ffffff',
                border: deliveryProofPhotoUrl === SAMPLE_PROOF_PHOTO ? '1px solid #0284c7' : '1px solid #cbd5e1',
                color: deliveryProofPhotoUrl === SAMPLE_PROOF_PHOTO ? '#0369a1' : '#475569',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              📦 Site Store Photo
            </button>
          </div>

          {/* File Upload Input */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="file"
              accept="image/*,.pdf"
              id="proof-upload-input"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <label
              htmlFor="proof-upload-input"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 4,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              <UploadCloud size={14} color="#0284c7" />
              Upload Photo from Device...
            </label>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>PNG, JPG, or PDF scan</span>
          </div>

          {/* Image Thumbnail Preview */}
          {deliveryProofPhotoUrl && (
            <div
              style={{
                position: 'relative',
                borderRadius: 6,
                overflow: 'hidden',
                border: '1px solid #cbd5e1',
                maxHeight: 180,
                backgroundColor: '#ffffff',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <img
                src={deliveryProofPhotoUrl}
                alt="Delivery proof preview"
                style={{ maxHeight: 180, width: '100%', objectFit: 'contain' }}
              />
              <button
                type="button"
                onClick={() => setDeliveryProofPhotoUrl('')}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#ffffff',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Remarks */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
            Site Store Receiving Notes
          </label>
          <textarea
            rows={2}
            className="ui-input"
            placeholder="e.g. 20 Mtr wire received in good condition. Unloaded in electrical room store."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>

        {/* Stock Inward Impact Card */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 6,
            fontSize: '0.78rem',
            color: '#166534',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <div style={{ fontWeight: 800 }}>✓ Immediate Stock Update into Site Store:</div>
          <div>• Current Site Store stock: <strong>{siteStock} {indent.unit}</strong></div>
          <div>• Inwarding quantity: <strong>+{numReceived} {indent.unit}</strong></div>
          <div>• New Site Store stock after confirmation: <strong>{siteStock + numReceived} {indent.unit}</strong></div>
          <div>• Indent requisition marked <strong>✓ Received by Site Engineer</strong> (Closed)</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="accent" type="submit" icon={<CheckCircle2 size={14} />}>
            Confirm Receipt & Close Indent
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ==========================================
// 3. VIEW ATTACHED DELIVERY PROOF MODAL
// ==========================================
interface IndentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  indent: MaterialRequest | null;
}

export const IndentProofModal: React.FC<IndentProofModalProps> = ({
  isOpen,
  onClose,
  indent,
}) => {
  if (!indent) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📸 Delivery Proof Photo - Requisition #${indent.id}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Proof Header Info */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 8,
            padding: 10,
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            fontSize: '0.78rem',
          }}
        >
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Material</span>
            <strong style={{ color: '#0f172a' }}>{indent.itemName}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Received Qty</span>
            <strong style={{ color: '#166534' }}>{indent.receivedQty || indent.requestedExtraQty} {indent.unit}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Delivery Challan</span>
            <strong style={{ color: '#0284c7' }}>{indent.dispatchChallanNumber || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Vehicle No</span>
            <strong style={{ color: '#475569' }}>{indent.vehicleNumber || 'N/A'}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Freight Cost</span>
            <strong style={{ color: '#b45309' }}>₹{indent.transportCost || 0}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Received By</span>
            <strong style={{ color: '#065f46' }}>{indent.receivedByEngineerName || 'Site Engineer'}</strong>
          </div>
        </div>

        {/* Large Proof Preview */}
        {indent.deliveryProofPhotoUrl ? (
          <div
            style={{
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid #cbd5e1',
              backgroundColor: '#0f172a',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 280,
            }}
          >
            <img
              src={indent.deliveryProofPhotoUrl}
              alt="Signed Delivery Challan proof"
              style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain' }}
            />
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            No proof photo was attached to this requisition.
          </div>
        )}

        {/* Remarks */}
        {indent.receivedRemarks && (
          <div style={{ padding: '8px 12px', backgroundColor: '#f0fdf4', borderRadius: 6, fontSize: '0.8rem', color: '#166534' }}>
            <strong>Site Engineer Remark:</strong> {indent.receivedRemarks}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
