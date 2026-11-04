import React from 'react';
import './ui.css';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  meta?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  iconBg = 'var(--color-primary-subtle)',
  iconColor = 'var(--color-primary)',
  meta,
  onClick,
  className = '',
}) => {
  return (
    <div
      className={`ui-stat-card ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div
        className="ui-stat-icon-box"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="ui-stat-info">
        <span className="ui-stat-label">{label}</span>
        <span className="ui-stat-value">{value}</span>
        {meta && <span className="ui-stat-meta">{meta}</span>}
      </div>
    </div>
  );
};
