import React from 'react';

// Input Component Styles
const inputStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '1rem',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  inputFocus: {
    borderColor: '#e94560',
    boxShadow: '0 0 0 3px rgba(233, 69, 96, 0.1)',
    outline: 'none',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  error: {
    fontSize: '0.75rem',
    color: '#dc2626',
    marginTop: '0.25rem',
  },
  helper: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '0.25rem',
  },
  textarea: {
    minHeight: '100px',
    resize: 'vertical',
  },
  select: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '1rem',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export function Input({ label, error, helper, style, ...props }: InputProps) {
  const [focused, setFocused] = React.useState(false);

  return (
    <div style={inputStyles.wrapper}>
      {label && <label style={inputStyles.label}>{label}</label>}
      <input
        style={{
          ...inputStyles.input,
          ...(focused ? inputStyles.inputFocus : {}),
          ...(error ? inputStyles.inputError : {}),
          ...style,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <span style={inputStyles.error}>{error}</span>}
      {helper && !error && <span style={inputStyles.helper}>{helper}</span>}
    </div>
  );
}

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export function Textarea({ label, error, helper, style, ...props }: TextareaProps) {
  const [focused, setFocused] = React.useState(false);

  return (
    <div style={inputStyles.wrapper}>
      {label && <label style={inputStyles.label}>{label}</label>}
      <textarea
        style={{
          ...inputStyles.input,
          ...inputStyles.textarea,
          ...(focused ? inputStyles.inputFocus : {}),
          ...(error ? inputStyles.inputError : {}),
          ...style,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <span style={inputStyles.error}>{error}</span>}
      {helper && !error && <span style={inputStyles.helper}>{helper}</span>}
    </div>
  );
}

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder,
  style,
  ...props
}: SelectProps) {
  return (
    <div style={inputStyles.wrapper}>
      {label && <label style={inputStyles.label}>{label}</label>}
      <select
        style={{
          ...inputStyles.select,
          ...(error ? inputStyles.inputError : {}),
          ...style,
        }}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span style={inputStyles.error}>{error}</span>}
    </div>
  );
}
