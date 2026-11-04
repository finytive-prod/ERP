import React, { useState } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import './ui.css';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  requireReason?: boolean;
  reasonPlaceholder?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Yes, Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  requireReason = false,
  reasonPlaceholder = 'Please explain the reason for this action (Mandatory)...',
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError('A clear reason is required to proceed.');
      return;
    }
    onConfirm(reason.trim());
    setReason('');
    setError('');
  };

  const isDanger = variant === 'danger';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: isDanger ? 'var(--color-danger)' : 'var(--color-primary)' }}>
          {isDanger ? <AlertTriangle size={20} /> : <HelpCircle size={20} />}
          {title}
        </span>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <p style={{ color: 'var(--color-gray-700)', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {message}
        </p>

        {requireReason && (
          <div style={{ marginTop: 'var(--space-2)' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-800)', marginBottom: 4 }}>
              Reason for this change / approval <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <textarea
              className="ui-input ui-textarea"
              rows={3}
              placeholder={reasonPlaceholder}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setError('');
              }}
              style={{ borderColor: error ? 'var(--color-danger)' : undefined }}
            />
            {error && <span className="ui-error-text">{error}</span>}
          </div>
        )}
      </div>
    </Modal>
  );
};
