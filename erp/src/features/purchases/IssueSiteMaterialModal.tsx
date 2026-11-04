import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  Boxes, 
  MapPin, 
  UserCheck, 
  FileText, 
  AlertCircle, 
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import { StockLedgerItem } from '../../types';
import { ERPService } from '../../services/erpStorage';
import { Modal, Button, Input, Select, useToast } from '../../components/ui';

interface IssueSiteMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItem: StockLedgerItem | null;
  onSuccess?: () => void;
}

export const IssueSiteMaterialModal: React.FC<IssueSiteMaterialModalProps> = ({
  isOpen,
  onClose,
  stockItem,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [issueQty, setIssueQty] = useState('');
  const [issuedTo, setIssuedTo] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!stockItem) return null;

  const availableStock = stockItem.stockOnSite || 0;
  const numQty = parseFloat(issueQty) || 0;
  const isOverLimit = numQty > availableStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numQty <= 0) {
      showToast('Validation Error', 'Please enter a valid issue quantity greater than 0.', 'danger');
      return;
    }
    if (isOverLimit) {
      showToast(
        'Insufficient Stock',
        `Cannot issue ${numQty} ${stockItem.unit}. Only ${availableStock} ${stockItem.unit} available at site.`,
        'danger'
      );
      return;
    }
    if (!issuedTo.trim()) {
      showToast('Recipient Required', 'Please specify who is receiving this material (Electrician / Wireman / Subcontractor).', 'danger');
      return;
    }

    setIsSubmitting(true);
    try {
      ERPService.issueSiteStock(
        stockItem.id,
        numQty,
        issuedTo.trim(),
        taskTitle.trim() || undefined,
        remarks.trim() || undefined
      );

      showToast(
        'Stock Issued to Work',
        `Successfully issued ${numQty} ${stockItem.unit} of "${stockItem.itemName}" to ${issuedTo}. Site balance: ${availableStock - numQty} ${stockItem.unit}.`,
        'success'
      );
      
      setIssueQty('');
      setIssuedTo('');
      setTaskTitle('');
      setRemarks('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast('Issue Error', err?.message || 'Failed to issue material', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📤 Issue Material from Site Stock to Work"
      maxWidth="540px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Material Summary Card */}
        <div
          style={{
            padding: 14,
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                {stockItem.itemName}
              </div>
              {stockItem.specification && (
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                  {stockItem.specification}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: 16,
                  backgroundColor: availableStock > 0 ? '#dcfce7' : '#fee2e2',
                  color: availableStock > 0 ? '#166534' : '#991b1b',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                }}
              >
                Available: {availableStock} {stockItem.unit}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 16,
              fontSize: '0.78rem',
              color: '#475569',
              borderTop: '1px dashed #cbd5e1',
              paddingTop: 8,
              flexWrap: 'wrap',
            }}
          >
            {stockItem.jobId && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Briefcase size={13} color="var(--color-primary)" />
                <strong>Job:</strong> {stockItem.jobId}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={13} color="#64748b" />
              <strong>Location:</strong> {stockItem.locationName}
            </span>
            {stockItem.lastBillNumber && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <FileText size={13} color="#64748b" />
                <strong>Inward Bill:</strong> #{stockItem.lastBillNumber}
              </span>
            )}
          </div>
        </div>

        {/* Input: Quantity to Issue */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
            Quantity to Issue ({stockItem.unit}) <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="number"
            step="any"
            min="0.1"
            max={availableStock}
            value={issueQty}
            onChange={(e) => setIssueQty(e.target.value)}
            placeholder={`Enter quantity (Max ${availableStock} ${stockItem.unit})`}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: isOverLimit ? '2px solid #ef4444' : '1px solid #cbd5e1',
              fontSize: '0.9rem',
              fontWeight: 700,
            }}
          />
          {isOverLimit && (
            <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertCircle size={13} />
              Cannot exceed available site stock of {availableStock} {stockItem.unit}.
            </div>
          )}
          {!isOverLimit && numQty > 0 && (
            <div style={{ color: '#16a34a', fontSize: '0.75rem', marginTop: 4 }}>
              Remaining site balance after issue: <strong>{(availableStock - numQty).toFixed(2)} {stockItem.unit}</strong>
            </div>
          )}
        </div>

        {/* Input: Issued To */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
            Issued To (Electrician / Wireman / Subcontractor) <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="text"
            value={issuedTo}
            onChange={(e) => setIssuedTo(e.target.value)}
            placeholder="e.g. Ramesh (Lead Wireman) / Star Subcontractor"
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
            }}
          />
        </div>

        {/* Input: Task / Activity on Site */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
            Site Task / Installation Location (Optional)
          </label>
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="e.g. Ground Floor Conduiting / Main Panel Cable Laying"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
            }}
          />
        </div>

        {/* Input: Remarks */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
            Remarks / Supervisor Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Issued for emergency testing on wing B"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="accent"
            type="submit"
            icon={<ArrowUpRight size={16} />}
            disabled={isSubmitting || numQty <= 0 || isOverLimit}
          >
            {isSubmitting ? 'Recording...' : `Issue ${numQty || 0} ${stockItem.unit}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
