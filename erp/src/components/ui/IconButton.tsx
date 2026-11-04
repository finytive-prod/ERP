import React from 'react';
import './ui.css';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  title: string;
  variant?: 'default' | 'danger' | 'primary';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  title,
  variant = 'default',
  className = '',
  ...props
}) => {
  return (
    <button
      type="button"
      className={`ui-icon-button ${className}`}
      title={title}
      aria-label={title}
      {...props}
    >
      {icon}
    </button>
  );
};
