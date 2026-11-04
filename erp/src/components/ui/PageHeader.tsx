import React from 'react';
import './ui.css';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  badge,
  actions,
}) => {
  return (
    <div className="ui-page-header">
      <div className="ui-page-title-box">
        {icon && (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="ui-page-title">{title}</h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && <p className="ui-page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="ui-page-actions">{actions}</div>}
    </div>
  );
};
