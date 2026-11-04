import React from 'react';
import './ui.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  suffix?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  suffix,
  error,
  helperText,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="ui-form-group">
      {label && (
        <label htmlFor={inputId} className="ui-label">
          {label}
        </label>
      )}
      <div className="ui-input-wrapper">
        {icon && <span className="ui-input-icon">{icon}</span>}
        <input
          id={inputId}
          className={`ui-input ${icon ? 'ui-input-has-icon' : ''} ${suffix ? 'ui-input-has-suffix' : ''} ${error ? 'ui-input-error' : ''} ${className}`}
          {...props}
        />
        {suffix && <span className="ui-input-suffix">{suffix}</span>}
      </div>
      {error && <span className="ui-error-text">{error}</span>}
      {helperText && !error && <span className="ui-helper-text">{helperText}</span>}
    </div>
  );
};
