import React, { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import './ui.css';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  renderMobileCard?: (item: T) => React.ReactNode;
  searchPlaceholder?: string;
  searchField?: (item: T) => string;
  emptyMessage?: string;
  actions?: React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  renderMobileCard,
  searchPlaceholder = 'Search...',
  searchField,
  emptyMessage = 'No records found.',
  actions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = React.useMemo(() => {
    if (!searchTerm || !searchField) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((item) => searchField(item).toLowerCase().includes(term));
  }, [data, searchTerm, searchField]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {(searchField || actions) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          {searchField && (
            <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }}
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  height: 40,
                  paddingLeft: 36,
                  paddingRight: 12,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          )}
          {actions && <div>{actions}</div>}
        </div>
      )}

      {/* Desktop & Tablet Table View */}
      <div className="ui-table-container" style={{ display: 'none' }}>
        <style>{`
          @media (min-width: 769px) {
            .ui-table-container { display: block !important; }
            .mobile-card-grid { display: none !important; }
          }
          @media (max-width: 768px) {
            .ui-table-container { display: none !important; }
            .mobile-card-grid { display: flex !important; }
          }
        `}</style>
        <table className="ui-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ textAlign: col.align || 'left' }}>
                  {col.header}
                </th>
              ))}
              {onRowClick && <th style={{ width: 40 }}></th>}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onRowClick ? 1 : 0)} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <div style={{ color: 'var(--color-gray-500)', fontSize: '0.95rem' }}>{emptyMessage}</div>
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick && onRowClick(item)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                  {onRowClick && (
                    <td style={{ textAlign: 'center' }}>
                      <ChevronRight size={18} style={{ color: 'var(--color-gray-400)' }} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="mobile-card-grid">
        {filteredData.length === 0 ? (
          <div className="ui-card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
            {emptyMessage}
          </div>
        ) : (
          filteredData.map((item) => {
            if (renderMobileCard) {
              return (
                <div key={keyExtractor(item)} onClick={() => onRowClick && onRowClick(item)}>
                  {renderMobileCard(item)}
                </div>
              );
            }
            return (
              <div
                key={keyExtractor(item)}
                className="ui-card"
                onClick={() => onRowClick && onRowClick(item)}
                style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((col) => (
                  <div key={col.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-gray-600)' }}>{col.header}:</span>
                    <span>{col.render ? col.render(item) : (item as any)[col.key]}</span>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
