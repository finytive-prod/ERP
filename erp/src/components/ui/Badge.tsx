import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Info
} from 'lucide-react';
import { getStatusStyle, StatusVariant } from '../../theme';
import './ui.css';

export interface BadgeProps {
  status: string;
  variant?: StatusVariant;
  customIcon?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  customIcon,
  showIcon = true,
  className = '',
}) => {
  const styleInfo = getStatusStyle(status);
  const activeVariant = variant || styleInfo.variant;

  const renderIcon = () => {
    if (customIcon) return customIcon;
    const s = (status || '').toLowerCase();
    if (s.includes('profit')) return <TrendingUp size={13} />;
    if (s.includes('loss') || s.includes('over')) return <TrendingDown size={13} />;
    if (activeVariant === 'success') return <CheckCircle2 size={13} />;
    if (activeVariant === 'warning') return <Clock size={13} />;
    if (activeVariant === 'danger') return <XCircle size={13} />;
    if (activeVariant === 'info') return <FileText size={13} />;
    return <Info size={13} />;
  };

  return (
    <span className={`ui-badge ui-badge-${activeVariant} ${className}`}>
      {showIcon && renderIcon()}
      <span>{status}</span>
    </span>
  );
};
