import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp, user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{isLogin ? 'Login' : 'Sign Up'} - FTC Board</title>
        <meta name="description" content="FTC Board - Task Management System" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logo}>
            <h1 style={styles.logoText}>FTC Board</h1>
            <p style={styles.tagline}>Team Task Management System</p>
          </div>

          <h2 style={styles.title}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            {!isLogin && (
              <Input
                label="Full Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            )}

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              helper={!isLogin ? 'At least 6 characters' : undefined}
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
              style={{ marginTop: '1rem' }}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div style={styles.toggle}>
            <p style={styles.toggleText}>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                style={styles.toggleButton}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          <div style={styles.info}>
            <p style={styles.infoTitle}>Demo Credentials:</p>
            <p style={styles.infoText}>
              Admin: admin@ftc.com / password123
            </p>
            <p style={styles.infoText}>
              Leader: leader@ftc.com / password123
            </p>
            <p style={styles.infoText}>
              Member: member@ftc.com / password123
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    padding: '1rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  logo: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
  },
  logoText: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#e94560',
    margin: 0,
  },
  tagline: {
    color: '#6b7280',
    marginTop: '0.5rem',
    fontSize: '0.875rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: '1.5rem',
    textAlign: 'center' as const,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  toggle: {
    marginTop: '1.5rem',
    textAlign: 'center' as const,
  },
  toggleText: {
    color: '#6b7280',
    fontSize: '0.875rem',
  },
  toggleButton: {
    background: 'none',
    border: 'none',
    color: '#e94560',
    fontWeight: 600,
    cursor: 'pointer',
    marginLeft: '0.25rem',
    fontSize: '0.875rem',
  },
  info: {
    marginTop: '2rem',
    padding: '1rem',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    fontSize: '0.75rem',
  },
  infoTitle: {
    fontWeight: 600,
    color: '#374151',
    marginBottom: '0.5rem',
  },
  infoText: {
    color: '#6b7280',
    margin: '0.25rem 0',
  },
};
