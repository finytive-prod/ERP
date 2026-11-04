import React from 'react';
import './ui.css';

export interface TimelineEvent {
  id: string;
  title: string;
  timestamp: string;
  user?: string;
  role?: string;
  reason?: string;
  details?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'primary' | 'accent' | 'success' | 'danger';
}

export interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ events, className = '' }) => {
  if (events.length === 0) {
    return <div style={{ color: 'var(--color-gray-500)', fontStyle: 'italic', padding: 'var(--space-4)' }}>No activity recorded yet.</div>;
  }

  return (
    <div className={`ui-timeline ${className}`}>
      {events.map((evt) => (
        <div key={evt.id} className="ui-timeline-item">
          <div className="ui-timeline-dot">
            {evt.icon || (
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: evt.variant === 'danger' ? 'var(--color-danger)' : evt.variant === 'success' ? 'var(--color-success)' : 'var(--color-primary)',
                }}
              />
            )}
          </div>
          <div className="ui-timeline-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.92rem' }}>
                {evt.title}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-gray-500)', fontFamily: 'var(--font-mono)' }}>
                {evt.timestamp}
              </span>
            </div>
            {(evt.user || evt.role) && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-600)', marginBottom: evt.reason || evt.details ? 6 : 0 }}>
                By: <strong>{evt.user}</strong> {evt.role ? `(${evt.role})` : ''}
              </div>
            )}
            {evt.reason && (
              <div style={{ background: '#f8fafc', borderLeft: '3px solid var(--color-accent)', padding: '6px 10px', fontSize: '0.83rem', color: 'var(--color-gray-800)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', marginTop: 4 }}>
                <strong>Reason:</strong> {evt.reason}
              </div>
            )}
            {evt.details && <div style={{ marginTop: 6 }}>{evt.details}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};
