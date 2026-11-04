import React from 'react';
import { 
  ShoppingCart, 
  Printer, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  FileSpreadsheet, 
  Clock, 
  ShieldCheck,
  Package,
  Camera,
  PackageCheck,
  Eye,
  Warehouse
} from 'lucide-react';
import { PurchaseOrder } from '../../types';
import { Button, Badge } from '../../components/ui';
import { MaterialMappingModal } from './MaterialMappingModal';

interface PurchaseOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
  onApprove?: (po: PurchaseOrder) => void;
  onReceive?: (po: PurchaseOrder) => void;
  onViewBillProof?: (po: PurchaseOrder) => void;
}

export const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onApprove,
  onReceive,
  onViewBillProof,
}) => {
  const [mappingModalTarget, setMappingModalTarget] = React.useState<{
    materialName: string;
    specification?: string;
    jobId?: string;
    componentId?: string;
  } | null>(null);

  if (!isOpen || !purchaseOrder) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="ui-modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="ui-modal-content"
        style={{
          maxWidth: '850px',
          width: '95vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: 8,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Actions Bar */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingCart size={20} color="#38bdf8" />
            <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {purchaseOrder.id}
            </span>
            <Badge status={purchaseOrder.status} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button size="sm" variant="secondary" icon={<Printer size={14} />} onClick={handlePrint}>
              Print / Save PDF
            </Button>
            <button
              type="button"
              onClick={onClose}
              style={{
                fontSize: '1.3rem',
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
        </div>

        {/* Printable PO Voucher Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', backgroundColor: '#ffffff' }}>
          {/* Header section with Company and PO Meta */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0f172a',
              paddingBottom: 16,
              marginBottom: 18,
            }}
          >
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
                APEX ELECTRICAL CONTRACTING & AUTOMATION
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 3 }}>
                Licensed Electrical Engineers & Industrial EPC Contractors
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                GSTIN: 33AAAAA0000A1Z5 • Email: purchase@apexelectricals.com
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7' }}>
                PURCHASE ORDER
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: 4 }}>
                PO Ref: <span style={{ fontFamily: 'var(--font-mono)' }}>{purchaseOrder.id}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Date: {purchaseOrder.date}</div>
              {purchaseOrder.deliveryDate && (
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Target Delivery: {purchaseOrder.deliveryDate}
                </div>
              )}
            </div>
          </div>

          {/* Grid: Vendor & Job Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Vendor Details */}
            <div style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                Vendor / Supplier Details:
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                {purchaseOrder.vendorName}
              </div>
              {purchaseOrder.vendorGst && (
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 2 }}>
                  GSTIN: {purchaseOrder.vendorGst}
                </div>
              )}
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 2 }}>
                Cost Category: {purchaseOrder.costType}
              </div>
            </div>

            {/* Job & Delivery Details */}
            <div style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                Job Spine & Destination:
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0284c7' }}>
                {purchaseOrder.jobId}: {purchaseOrder.jobTitle}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 2 }}>
                Ship To: <strong>{purchaseOrder.deliveryLocation}</strong>
              </div>
              {purchaseOrder.boqTitle && (
                <div style={{ fontSize: '0.8rem', color: '#0369a1', marginTop: 2 }}>
                  Linked BOQ: {purchaseOrder.boqTitle}
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                  <th style={{ width: 40, padding: '8px 10px', textAlign: 'center' }}>#</th>
                  <th style={{ width: 110, padding: '8px' }}>BOQ Ref</th>
                  <th style={{ minWidth: 260, padding: '8px' }}>Description of Material</th>
                  <th style={{ width: 70, textAlign: 'center', padding: '8px' }}>UOM</th>
                  <th style={{ width: 90, textAlign: 'right', padding: '8px' }}>PO Qty</th>
                  <th style={{ width: 110, textAlign: 'right', padding: '8px' }}>Unit Rate (₹)</th>
                  <th style={{ width: 130, textAlign: 'right', padding: '8px' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrder.items.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b', padding: '8px 10px' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {item.boqLineSNo ? (
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: 4 }}>
                          [{item.boqLineSNo}] {item.isBomComponent ? 'BOM' : 'BOQ'}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.itemName}</div>
                        <button
                          type="button"
                          onClick={() => setMappingModalTarget({ materialName: item.itemName, specification: item.specification, jobId: item.jobId || purchaseOrder.jobId, componentId: item.componentId })}
                          style={{
                            backgroundColor: '#f0fdf4',
                            color: '#166534',
                            border: '1px solid #bbf7d0',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 3,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                          title="Click to view full BOQ Mapping & Multiplier details"
                        >
                          🔍 Where Mapped?
                        </button>
                      </div>
                      {item.specification && (
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{item.specification}</div>
                      )}
                      {item.parentLineDescription && (
                        <div style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 600, marginTop: 2 }}>
                          From: {item.parentLineDescription} ({item.parentLineQty} {item.parentLineUnit || 'units'} × {item.qtyPerUnit} {item.unit})
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600, padding: '8px' }}>{item.unit}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, padding: '8px' }}>
                      {item.purchaseQty}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, padding: '8px' }}>
                      ₹{item.purchaseRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', padding: '8px' }}>
                      ₹{item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Summary: Notes and Total Amounts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
            <div>
              {purchaseOrder.notes && (
                <div style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                  <strong>Special Notes / Instructions:</strong>
                  <p style={{ marginTop: 4, color: '#475569', margin: 0 }}>{purchaseOrder.notes}</p>
                </div>
              )}

              {purchaseOrder.approvalReason && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 12,
                    backgroundColor: '#fffbeb',
                    borderRadius: 6,
                    border: '1px solid #fde68a',
                    fontSize: '0.8rem',
                    color: '#92400e',
                  }}
                >
                  <strong>Approval Notes:</strong> {purchaseOrder.approvalReason}
                </div>
              )}
            </div>

            <div
              style={{
                padding: 14,
                backgroundColor: '#f8fafc',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: '0.88rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Subtotal:</span>
                <strong>₹{purchaseOrder.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>GST Tax:</span>
                <strong>₹{purchaseOrder.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
              {purchaseOrder.transportCost > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Transportation:</span>
                  <strong>₹{purchaseOrder.transportCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 8,
                  borderTop: '2px solid #0f172a',
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  color: '#0f172a',
                }}
              >
                <span>Total Value:</span>
                <span style={{ color: '#0284c7' }}>
                  ₹{purchaseOrder.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* VERIFIED VENDOR BILL & STOCK MOVEMENT PROOF */}
          {purchaseOrder.billPhotoUrl && (
            <div
              style={{
                marginTop: 18,
                padding: '12px 16px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 60,
                    height: 50,
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: '1px solid #86efac',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  onClick={() => onViewBillProof && onViewBillProof(purchaseOrder)}
                >
                  <img
                    src={purchaseOrder.billPhotoUrl}
                    alt="Bill Proof"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={16} color="#16a34a" />
                    <strong style={{ fontSize: '0.88rem', color: '#166534' }}>
                      Vendor Bill Verified & Inwarded to Stock
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: 2 }}>
                    Bill #{purchaseOrder.billNumber} • Moved to:{' '}
                    <strong>{purchaseOrder.receivedDestination || 'Site Store'}</strong> • On:{' '}
                    {purchaseOrder.receivedAt}
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                variant="secondary"
                icon={<Eye size={14} />}
                onClick={() => onViewBillProof && onViewBillProof(purchaseOrder)}
              >
                View Full Bill Photo
              </Button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
          }}
        >
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Generated on {purchaseOrder.createdAt} • Apex ERP System
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {purchaseOrder.status === 'Approved' && onReceive && (
              <Button
                variant="accent"
                icon={<PackageCheck size={16} />}
                onClick={() => onReceive(purchaseOrder)}
              >
                📦 Receive Billed Items & Inward
              </Button>
            )}
            {purchaseOrder.status === 'Pending Approval' && onApprove && (
              <Button
                variant="accent"
                icon={<CheckCircle2 size={16} />}
                onClick={() => onApprove(purchaseOrder)}
              >
                Review & Approve
              </Button>
            )}
          </div>
        </div>

        {/* Material Mapping Detail Modal */}
        {mappingModalTarget && (
          <MaterialMappingModal
            isOpen={!!mappingModalTarget}
            onClose={() => setMappingModalTarget(null)}
            materialName={mappingModalTarget.materialName}
            specification={mappingModalTarget.specification}
            jobId={mappingModalTarget.jobId}
            componentId={mappingModalTarget.componentId}
          />
        )}
      </div>
    </div>
  );
};
