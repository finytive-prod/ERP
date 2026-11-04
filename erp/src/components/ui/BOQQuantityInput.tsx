import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Zap } from 'lucide-react';

export interface BOQQuantityInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  componentCount?: number;
  componentSummary?: string;
  unit?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const BOQQuantityInput: React.FC<BOQQuantityInputProps> = ({
  value,
  onChange,
  min = 0,
  step = 1,
  placeholder = '0',
  disabled = false,
  componentCount = 0,
  componentSummary = '',
  unit = '',
  style,
  className = '',
}) => {
  const [textVal, setTextVal] = useState<string>(value === 0 ? '0' : String(value));
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes when not actively typing
  useEffect(() => {
    if (!isFocused) {
      setTextVal(value === 0 ? '0' : String(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow empty string or valid decimal number while typing
    setTextVal(raw);

    if (raw.trim() === '') {
      onChange(0);
      return;
    }

    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Instant select-all so typing replaces the number immediately without backspacing
    e.target.select();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (textVal.trim() === '' || isNaN(parseFloat(textVal))) {
      setTextVal('0');
      onChange(0);
    } else {
      const num = Math.max(min, parseFloat(textVal));
      setTextVal(String(num));
      onChange(num);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleNudge(step);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleNudge(-step);
    }
  };

  const handleNudge = (delta: number) => {
    if (disabled) return;
    const current = parseFloat(textVal) || 0;
    const next = Math.max(min, Math.round((current + delta) * 100) / 100);
    setTextVal(String(next));
    onChange(next);
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 3, ...style }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: disabled ? '#f1f5f9' : '#ffffff',
          border: isFocused ? '1.5px solid #0284c7' : '1.5px solid #cbd5e1',
          borderRadius: 6,
          boxShadow: isFocused ? '0 0 0 3px rgba(14, 165, 233, 0.2)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.15s ease',
          overflow: 'hidden',
          width: '100%',
          minWidth: '125px',
        }}
        className={className}
      >
        {/* Decrement Button */}
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled || (parseFloat(textVal) || 0) <= min}
          onClick={() => handleNudge(-step)}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '5px 6px',
            color: (parseFloat(textVal) || 0) <= min ? '#cbd5e1' : '#475569',
            cursor: (parseFloat(textVal) || 0) <= min || disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            transition: 'background 0.12s ease',
          }}
          title={`Decrease by ${step} (or press Down arrow)`}
        >
          <Minus size={12} strokeWidth={2.5} />
        </button>

        {/* Number Input */}
        <input
          ref={inputRef}
          type="number"
          step="any"
          min={min}
          value={textVal}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          style={{
            border: 'none',
            outline: 'none',
            textAlign: 'right',
            fontWeight: 800,
            fontSize: '0.92rem',
            fontFamily: 'var(--font-mono, monospace)',
            color: '#0f172a',
            backgroundColor: 'transparent',
            padding: '5px 8px',
            width: '100%',
            minWidth: '55px',
          }}
        />

        {/* Unit Tag (if provided) */}
        {unit && (
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#64748b',
              paddingRight: 6,
              userSelect: 'none',
            }}
          >
            {unit}
          </span>
        )}

        {/* Increment Button */}
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => handleNudge(step)}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '5px 6px',
            color: '#475569',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderLeft: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            transition: 'background 0.12s ease',
          }}
          title={`Increase by ${step} (or press Up arrow)`}
        >
          <Plus size={12} strokeWidth={2.5} />
        </button>
      </div>

      {/* Dynamic multiplier indicator if line has child BOM materials */}
      {componentCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.68rem',
            color: '#15803d',
            fontWeight: 700,
            backgroundColor: '#f0fdf4',
            padding: '2px 5px',
            borderRadius: 3,
            border: '1px solid #bbf7d0',
            whiteSpace: 'nowrap',
          }}
          title={componentSummary || `Automatically multiplies ${componentCount} constituent BOM raw materials by this quantity`}
        >
          <Zap size={10} color="#16a34a" />
          <span>Multiplies {componentCount} items ({value}x)</span>
        </div>
      )}
    </div>
  );
};
