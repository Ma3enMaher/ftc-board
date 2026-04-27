import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardBody, PageTitle, Badge, Grid, EmptyState } from '@/components/Card';
import { Button } from '@/components/Button';
import { getCommittees, getAllTasks, getTasksByCommittee, getTasksForMember } from '@/lib/firestore';
import { Committee, Task } from '@/types';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch committees
        const committeesData = await getCommittees();
        setCommittees(committeesData);

        // Fetch tasks based on role
        if (user.role === 'admin') {
          const tasksData = await getAllTasks();
          setTasks(tasksData);
        } else if (user.role === 'leader' && user.committeeId) {
          const tasksData = await getTasksByCommittee(user.committeeId);
          setTasks(tasksData);
        } else if (user.role === 'member' && user.committeeId) {
          const tasksData = await getTasksForMember(user.committeeId);
          setTasks(tasksData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const getCommitteeName = (committeeId: string) => {
    const committee = committees.find((c) => c.id === committeeId);
    return committee?.name || 'Unknown';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const roleBasedContent = () => {
    if (!user) return null;

    switch (user.role) {
      case 'admin':
        return (
          <>
            <Grid columns={3} gap="1.5rem">
              <Card>
                <CardBody>
                  <div style={statStyles.icon}>📊</div>
                  <h3 style={statStyles.number}>{tasks.length}</h3>
                  <p style={statStyles.label}>Total Tasks</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <div style={statStyles.icon}>🏢</div>
                  <h3 style={statStyles.number}>{committees.length}</h3>
                  <p style={statStyles.label}>Committees</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <div style={statStyles.icon}>📋</div>
                  <h3 style={statStyles.number}>
                    {tasks.filter((t) => t.status === 'open').length}
                  </h3>
                  <p style={statStyles.label}>Open Tasks</p>
                </CardBody>
              </Card>
            </Grid>
            <div style={{ marginTop: '2rem' }}>
              <PageTitle title="Quick Actions" />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button onClick={() => router.push('/admin')}>
                  Manage Committees
                </Button>
                <Button variant="secondary" onClick={() => router.push('/leader')}>
                  View All Tasks
                </Button>
              </div>
            </div>
          </>
        );

      case 'leader':
        return (
          <>
            <Grid columns={2} gap="1.5rem">
              <Card>
                <CardBody>
                  <div style={statStyles.icon}>📋</div>
                  <h3 style={statStyles.number}>{tasks.length}</h3>
                  <p style={statStyles.label}>My Committee Tasks</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <div style={statStyles.icon}>📤</div>
                  <h3 style={statStyles.number}>
                    {tasks.filter((t) => t.status === 'open').length}
                  </h3>
                  <p style={statStyles.label}>Pending Submissions</p>
                </CardBody>
              </Card>
            </Grid>
            <div style={{ marginTop: '2rem' }}>
              <Button onClick={() => router.push('/leader')}>
                Create New Task
              </Button>
            </div>
          </>
        );

      case 'member':
        return (
          <>
            <Grid columns={2} gap="1.5rem">
              <Card>
                <CardBody>
                  <div style={statStyles.icon}>📋</div>
                  <h3 style={statStyles.number}>{tasks.length}</h3>
                  <p style={statStyles.label}>Available Tasks</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <div style={statStyles.icon}>✅</div>
                  <h3 style={statStyles.number}>
                    {tasks.filter((t) => {
                      // Filter out completed tasks - for demo purposes
                      return true;
                    }).length}
                  </h3>
                  <p style={statStyles.label}>Your Tasks</p>
                </CardBody>
              </Card>
            </Grid>
            <div style={{ marginTop: '2rem' }}>
              <Button onClick={() => router.push('/member')}>
                View My Tasks
              </Button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  if (loading || authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - FTC Board</title>
        <meta name="description" content="FTC Board Dashboard" />
      </Head>

      <ProtectedRoute>
        <Layout>
          <PageTitle
            title={`${getGreeting()}, ${user?.name}!`}
            subtitle={`You're logged in as ${user?.role}`}
          />

          {/* Role Badge */}
          <div style={{ marginBottom: '2rem' }}>
            <Badge
              variant={
                user?.role === 'admin'
                  ? 'error'
                  : user?.role === 'leader'
                  ? 'info'
                  : 'default'
              }
            >
              {user?.role}
            </Badge>
            {user?.committeeId && (
              <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
                Committee: {getCommitteeName(user.committeeId)}
              </span>
            )}
          </div>

          {/* Role-based content */}
          {roleBasedContent()}

          {/* Recent Tasks (for all roles) */}
          {tasks.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <PageTitle title="Recent Tasks" />
              <Grid columns={2} gap="1rem">
                {tasks.slice(0, 4).map((task) => (
                  <Card key={task.id} style={{ borderLeft: '4px solid #e94560' }}>
                    <CardBody>
                      <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                        {task.title}
                      </h4>
                      <p
                        style={{
                          color: '#6b7280',
                          fontSize: '0.875rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {task.description.substring(0, 80)}...
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Badge
                          variant={task.status === 'open' ? 'warning' : 'success'}
                        >
                          {task.status}
                        </Badge>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          Due: {formatDate(task.deadline)}
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </Grid>
            </div>
          )}

          {/* Empty state for members without committee */}
          {user?.role === 'member' && !user?.committeeId && (
            <EmptyState
              icon="👋"
              title="Welcome to FTC Board!"
              description="You haven't been assigned to a committee yet. Please contact an admin to get assigned."
            />
          )}
        </Layout>
      </ProtectedRoute>
    </>
  );
}

const statStyles: Record<string, React.CSSProperties> = {
  icon: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
  },
  number: {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: '#1a1a2e',
    margin: 0,
  },
  label: {
    color: '#6b7280',
    fontSize: '0.875rem',
    margin: 0,
  },
};
