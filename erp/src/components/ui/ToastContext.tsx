import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import './ui.css';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (title: string, message?: string, type?: 'success' | 'warning' | 'danger' | 'info') => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, message?: string, type: 'success' | 'warning' | 'danger' | 'info' = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newToast: ToastItem = { id, title, message, type };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success': return 'var(--color-success)';
      case 'warning': return 'var(--color-warning)';
      case 'danger': return 'var(--color-danger)';
      default: return 'var(--color-info)';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={20} color="var(--color-success)" />;
      case 'warning': return <AlertTriangle size={20} color="var(--color-warning)" />;
      case 'danger': return <XCircle size={20} color="var(--color-danger)" />;
      default: return <Info size={20} color="var(--color-info)" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="ui-toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="ui-toast"
            style={{ borderLeftColor: getBorderColor(t.type) }}
          >
            <div style={{ flexShrink: 0, marginTop: 2 }}>{getIcon(t.type)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-primary)' }}>{t.title}</div>
              {t.message && <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)', marginTop: 2 }}>{t.message}</div>}
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              style={{ color: 'var(--color-gray-400)', padding: 4, display: 'flex', alignItems: 'center' }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
