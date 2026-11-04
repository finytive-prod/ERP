import React from 'react';
import './ui.css';

export interface CardProps {
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  bodyClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  footer,
  hoverable = false,
  className = '',
  bodyClassName = '',
}) => {
  return (
    <div className={`ui-card ${hoverable ? 'ui-card-hover' : ''} ${className}`}>
      {(title || action) && (
        <div className="ui-card-header">
          <div>
            <div className="ui-card-title">{title}</div>
            {subtitle && <div style={{ fontSize: '0.82rem', color: 'var(--color-gray-500)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`ui-card-body ${bodyClassName}`}>{children}</div>
      {footer && <div className="ui-card-footer">{footer}</div>}
    </div>
  );
};
