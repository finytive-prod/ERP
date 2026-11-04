import React from 'react';
import './ui.css';

export interface TrendDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  vendor?: string;
}

export interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  data: TrendDataPoint[];
  type?: 'line' | 'bar' | 'comparison';
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  subtitle,
  data,
  type = 'line',
  height = 220,
  valuePrefix = '₹',
  valueSuffix = '',
  primaryLabel = 'Rate',
  secondaryLabel = 'Baseline',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="ui-card" style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-gray-400)' }}>
        No chart data available
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, ...(data.map((d) => d.secondaryValue || 0))) * 1.15 || 100;
  const minVal = 0;
  const range = maxVal - minVal;

  const width = 600;
  const paddingX = 40;
  const paddingY = 30;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  // Calculate coordinates for SVG line
  const points = data.map((d, index) => {
    const x = paddingX + (index / Math.max(data.length - 1, 1)) * chartW;
    const y = height - paddingY - ((d.value - minVal) / range) * chartH;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  return (
    <div className="ui-card">
      <div className="ui-card-header">
        <div>
          <div className="ui-card-title">{title}</div>
          {subtitle && <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-primary)' }} />
            <span>{primaryLabel}</span>
          </div>
          {secondaryLabel && data.some(d => d.secondaryValue !== undefined) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-accent)' }} />
              <span>{secondaryLabel}</span>
            </div>
          )}
        </div>
      </div>
      <div className="ui-card-body" style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxHeight: height, minWidth: 420 }}>
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = paddingY + chartH * (1 - pct);
              const val = Math.round(minVal + range * pct);
              return (
                <g key={idx}>
                  <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="var(--border-light)" strokeDasharray="3 3" />
                  <text x={paddingX - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--color-gray-400)">
                    {valuePrefix}{val.toLocaleString('en-IN')}{valueSuffix}
                  </text>
                </g>
              );
            })}

            {type === 'bar' ? (
              // Bar chart renderer
              data.map((d, idx) => {
                const barWidth = Math.min(32, chartW / (data.length * 2));
                const x = paddingX + (idx + 0.5) * (chartW / data.length) - barWidth / 2;
                const barH = ((d.value - minVal) / range) * chartH;
                const y = height - paddingY - barH;
                return (
                  <g key={idx}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barH}
                      rx="4"
                      fill="var(--color-primary)"
                    />
                    <text x={x + barWidth / 2} y={height - paddingY + 16} textAnchor="middle" fontSize="10" fill="var(--color-gray-600)" fontWeight="600">
                      {d.label}
                    </text>
                  </g>
                );
              })
            ) : (
              // Line chart renderer
              <>
                <path d={pathD} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((pt, idx) => (
                  <g key={idx}>
                    <circle cx={pt.x} cy={pt.y} r="5" fill="#ffffff" stroke="var(--color-accent)" strokeWidth="3" />
                    <text x={pt.x} y={height - paddingY + 16} textAnchor="middle" fontSize="10" fill="var(--color-gray-600)" fontWeight="600">
                      {pt.label}
                    </text>
                    <text x={pt.x} y={pt.y - 10} textAnchor="middle" fontSize="10" fill="var(--color-primary)" fontWeight="700">
                      {valuePrefix}{pt.value.toLocaleString('en-IN')}
                    </text>
                  </g>
                ))}
              </>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};
