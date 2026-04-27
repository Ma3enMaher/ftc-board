import React from 'react';

// Button Component Styles
const buttonStyles: Record<string, React.CSSProperties> = {
  base: {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  primary: {
    backgroundColor: '#e94560',
    color: 'white',
  },
  secondary: {
    backgroundColor: '#1a1a2e',
    color: 'white',
  },
  outline: {
    backgroundColor: 'transparent',
    color: '#1a1a2e',
    border: '2px solid #1a1a2e',
  },
  danger: {
    backgroundColor: '#dc2626',
    color: 'white',
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  small: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
  },
  fullWidth: {
    width: '100%',
  },
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  loading?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const baseStyle = {
    ...buttonStyles.base,
    ...buttonStyles[variant],
    ...(size === 'small' ? buttonStyles.small : {}),
    ...(fullWidth ? buttonStyles.fullWidth : {}),
    ...(disabled || loading ? buttonStyles.disabled : {}),
    ...style,
  };

  return (
    <button
      style={baseStyle}
      disabled={disabled || loading}
      onMouseOver={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.opacity = '0.9';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseOut={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
      {...props}
    >
      {loading && <LoadingSpinner size="small" />}
      {children}
    </button>
  );
}

// Loading Spinner Component
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

export function LoadingSpinner({ size = 'medium' }: LoadingSpinnerProps) {
  const sizes = {
    small: 16,
    medium: 24,
    large: 40,
  };

  const pixelSize = sizes[size];

  return (
    <div
      style={{
        width: pixelSize,
        height: pixelSize,
        border: `${pixelSize / 4}px solid rgba(255, 255, 255, 0.3)`,
        borderTopColor: 'white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
  );
}

// Keyframe animation for spinner (add to your global CSS)
// @keyframes spin {
//   from { transform: rotate(0deg); }
//   to { transform: rotate(360deg); }
// }
