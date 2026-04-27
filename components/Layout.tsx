import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

// Styles object (inline styles for simplicity)
const styles: Record<string, React.CSSProperties> = {
  layout: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#1a1a2e',
    color: 'white',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#e94560',
    textDecoration: 'none',
  },
  nav: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  navLinkActive: {
    backgroundColor: '#e94560',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  roleBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  main: {
    flex: 1,
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  footer: {
    backgroundColor: '#1a1a2e',
    color: 'white',
    padding: '1rem',
    textAlign: 'center',
  },
};

// Role badge colors
const roleColors: Record<UserRole, { bg: string; color: string }> = {
  admin: { bg: '#e94560', color: 'white' },
  leader: { bg: '#0f3460', color: 'white' },
  member: { bg: '#533483', color: 'white' },
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => router.pathname === path;

  return (
    <div style={styles.layout}>
      <header style={styles.header}>
        <Link href="/dashboard" style={styles.logo}>
          FTC Board
        </Link>

        {!loading && user && (
          <nav style={styles.nav}>
            <Link
              href="/dashboard"
              style={{
                ...styles.navLink,
                ...(isActive('/dashboard') ? styles.navLinkActive : {}),
              }}
            >
              Dashboard
            </Link>

            {user.role === 'admin' && (
              <Link
                href="/admin"
                style={{
                  ...styles.navLink,
                  ...(isActive('/admin') ? styles.navLinkActive : {}),
                }}
              >
                Admin
              </Link>
            )}

            {user.role === 'leader' && (
              <Link
                href="/leader"
                style={{
                  ...styles.navLink,
                  ...(isActive('/leader') ? styles.navLinkActive : {}),
                }}
              >
                Tasks
              </Link>
            )}

            {user.role === 'member' && (
              <Link
                href="/member"
                style={{
                  ...styles.navLink,
                  ...(isActive('/member') ? styles.navLinkActive : {}),
                }}
              >
                My Tasks
              </Link>
            )}

            <div style={styles.userInfo}>
              <span
                style={{
                  ...styles.roleBadge,
                  backgroundColor: roleColors[user.role].bg,
                  color: roleColors[user.role].color,
                }}
              >
                {user.role}
              </span>
              <span>{user.name}</span>
              <button
                onClick={handleSignOut}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid white',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            </div>
          </nav>
        )}
      </header>

      <main style={styles.main}>{children}</main>

      <footer style={styles.footer}>
        <p>FTC Board System - Task Management for Teams</p>
      </footer>
    </div>
  );
}
