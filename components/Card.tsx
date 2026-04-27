import React from 'react';

// Card Component Styles
const cardStyles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  header: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#1a1a2e',
    margin: 0,
  },
  body: {
    padding: '1.5rem',
  },
  footer: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },
};

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Card({ children, style, onClick }: CardProps) {
  return (
    <div
      style={{
        ...cardStyles.card,
        ...(onClick ? { cursor: 'pointer' } : {}),
        ...style,
      }}
      onClick={onClick}
      onMouseOver={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseOut={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        }
      }}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, action }: CardHeaderProps) {
  return (
    <div
      style={{
        ...cardStyles.header,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <h3 style={cardStyles.title}>{title}</h3>
      {action}
    </div>
  );
}

interface CardBodyProps {
  children: React.ReactNode;
}

export function CardBody({ children }: CardBodyProps) {
  return <div style={cardStyles.body}>{children}</div>;
}

interface CardFooterProps {
  children: React.ReactNode;
}

export function CardFooter({ children }: CardFooterProps) {
  return <div style={cardStyles.footer}>{children}</div>;
}

// Badge Component
const badgeStyles: Record<string, React.CSSProperties> = {
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
};

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

const badgeVariants: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: '#dcfce7', color: '#166534' },
  warning: { bg: '#fef3c7', color: '#92400e' },
  error: { bg: '#fee2e2', color: '#991b1b' },
  info: { bg: '#dbeafe', color: '#1e40af' },
  default: { bg: '#f3f4f6', color: '#374151' },
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const colors = badgeVariants[variant];

  return (
    <span
      style={{
        ...badgeStyles.badge,
        backgroundColor: colors.bg,
        color: colors.color,
      }}
    >
      {children}
    </span>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
      }}
    >
      {icon && (
        <div
          style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            opacity: 0.5,
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#374151',
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            color: '#6b7280',
            marginBottom: '1.5rem',
            maxWidth: '400px',
          }}
        >
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

// Grid Layout
interface GridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: string;
}

export function Grid({ children, columns = 3, gap = '1.5rem' }: GridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
      }}
    >
      {children}
    </div>
  );
}

// Page Title Component
interface PageTitleProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageTitle({ title, subtitle, action }: PageTitleProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
      }}
    >
      <div>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#1a1a2e',
            margin: 0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              color: '#6b7280',
              margin: '0.5rem 0 0 0',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
