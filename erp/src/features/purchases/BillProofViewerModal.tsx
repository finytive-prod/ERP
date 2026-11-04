import React from 'react';
import {
  FileText,
  Calendar,
  Building2,
  Warehouse,
  CheckCircle2,
  ExternalLink,
  Printer,
  X,
  Hash,
  IndianRupee,
  ShieldCheck
} from 'lucide-react';
import { PurchaseOrder } from '../../types';
import { Button } from '../../components/ui';

interface BillProofViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
}

export const BillProofViewerModal: React.FC<BillProofViewerModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
}) => {
  if (!isOpen || !purchaseOrder || !purchaseOrder.billPhotoUrl) return null;

  return (
    <div className="ui-modal-backdrop" onClick={onClose} style={{ zIndex: 1250 }}>
      <div
        className="ui-modal-content"
        style={{
          maxWidth: '820px',
          width: '95vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: 8,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={20} color="#38bdf8" />
            <span style={{ fontSize: '1.08rem', fontWeight: 800 }}>
              Verified Purchased Bill Proof • {purchaseOrder.id}
            </span>
          </div>

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

        {/* Content Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Bill Meta Card */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Vendor Bill / Invoice #
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {purchaseOrder.billNumber || 'N/A'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                Vendor: {purchaseOrder.vendorName}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Bill Date & Value
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0284c7', marginTop: 2 }}>
                ₹{(purchaseOrder.billAmount || purchaseOrder.grandTotal).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                Billed on: {purchaseOrder.billDate || purchaseOrder.date}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Stock Destination
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#166534', marginTop: 2 }}>
                {purchaseOrder.receivedDestination || purchaseOrder.deliveryLocation || 'Site Store'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                Received by: {purchaseOrder.receivedBy || 'Store Officer'} ({purchaseOrder.receivedAt || 'Delivered'})
              </div>
            </div>
          </div>

          {/* Photo Preview Container */}
          <div
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              backgroundColor: '#0f172a',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                padding: '8px 14px',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.78rem',
              }}
            >
              <span>Captured Vendor Bill Document</span>
              <a
                href={purchaseOrder.billPhotoUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#38bdf8',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 700,
                }}
              >
                <ExternalLink size={12} />
                <span>Open Full Size</span>
              </a>
            </div>

            <div style={{ padding: 12, maxWidth: '100%', maxHeight: '480px', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
              <img
                src={purchaseOrder.billPhotoUrl}
                alt="Purchased Bill Proof"
                style={{
                  maxWidth: '100%',
                  maxHeight: '440px',
                  objectFit: 'contain',
                  borderRadius: 4,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                }}
              />
            </div>
          </div>

          {purchaseOrder.receivedRemarks && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: '0.82rem',
                color: '#475569',
              }}
            >
              <strong>Receiving Remarks:</strong> {purchaseOrder.receivedRemarks}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
