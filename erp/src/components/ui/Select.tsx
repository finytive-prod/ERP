import React from 'react';
import './ui.css';

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: React.ReactNode;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  icon,
  options,
  error,
  helperText,
  id,
  className = '',
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="ui-form-group">
      {label && (
        <label htmlFor={selectId} className="ui-label">
          {label}
        </label>
      )}
      <div className="ui-input-wrapper">
        {icon && <span className="ui-input-icon">{icon}</span>}
        <select
          id={selectId}
          className={`ui-input ${icon ? 'ui-input-has-icon' : ''} ${error ? 'ui-input-error' : ''} ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && <span className="ui-error-text">{error}</span>}
      {helperText && !error && <span className="ui-helper-text">{helperText}</span>}
    </div>
  );
};
