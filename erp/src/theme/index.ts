// Theme Token Exports & Helper Functions

export const THEME = {
  colors: {
    primary: '#102a43',
    primaryHover: '#0b1f32',
    accent: '#d97706',
    accentSubtle: '#fef3c7',
    success: '#059669',
    successBg: '#ecfdf5',
    warning: '#d97706',
    warningBg: '#fffbeb',
    danger: '#dc2626',
    dangerBg: '#fef2f2',
    info: '#0284c7',
    infoBg: '#f0f9ff',
    bgApp: '#f1f5f9',
    bgSurface: '#ffffff',
    border: '#e2e8f0',
    textMain: '#0f172a',
    textMuted: '#475569',
  },
  touchTargetMin: '44px',
} as const;

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

export function getStatusStyle(status: string): { bg: string; text: string; border: string; variant: StatusVariant } {
  const s = (status || '').toLowerCase();
  if (['approved', 'completed', 'active', 'received', 'verified', 'paid', 'profit'].some(k => s.includes(k))) {
    return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', variant: 'success' };
  }
  if (['pending', 'in progress', 'revision', 'partial', 'partially', 'due', 'warning'].some(k => s.includes(k))) {
    return { bg: '#fffbeb', text: '#92400e', border: '#fde68a', variant: 'warning' };
  }
  if (['rejected', 'danger', 'loss', 'over budget', 'over-budget', 'blocked', 'critical'].some(k => s.includes(k))) {
    return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', variant: 'danger' };
  }
  if (['draft', 'quoted', 'rates pending', 'boq prepared', 'issued', 'dispatch'].some(k => s.includes(k))) {
    return { bg: '#f0f9ff', text: '#075985', border: '#bae6fd', variant: 'info' };
  }
  return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1', variant: 'neutral' };
}
