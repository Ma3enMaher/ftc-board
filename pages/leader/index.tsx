import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Card,
  CardBody,
  PageTitle,
  Badge,
  Grid,
  EmptyState,
} from '@/components/Card';
import { Button } from '@/components/Button';
import { Input, Textarea } from '@/components/Input';
import Modal, { ConfirmDialog } from '@/components/Modal';
import {
  getCommittees,
  getTasksByCommittee,
  getSubmissionsByTask,
  createTask,
  updateTask,
  deleteTask,
} from '@/lib/firestore';
import { Committee, Task, Submission } from '@/types';

export default function LeaderPage() {
  const { user } = useAuth();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskSubmissions, setTaskSubmissions] = useState<Submission[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    committeeId: '',
    deadline: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      // Get all committees (for leaders to create tasks across committees)
      const committeesData = await getCommittees();
      setCommittees(committeesData);

      // Get tasks for user's committee
      if (user.committeeId) {
        const tasksData = await getTasksByCommittee(user.committeeId);
        setTasks(tasksData);

        // Fetch submissions for each task
        const submissionsMap: Record<string, Submission[]> = {};
        for (const task of tasksData) {
          const taskSubmissionsData = await getSubmissionsByTask(task.id);
          submissionsMap[task.id] = taskSubmissionsData;
        }
        setSubmissions(submissionsMap);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMsg = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCreateTask = async () => {
    if (!user?.committeeId) return;
    setFormLoading(true);
    setError('');
    try {
      const task = await createTask({
        title: taskForm.title,
        description: taskForm.description,
        committeeId: user.committeeId,
        deadline: new Date(taskForm.deadline),
      });
      await fetchData();
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', committeeId: '', deadline: '' });
      showSuccessMsg('Task created successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;
    setFormLoading(true);
    setError('');
    try {
      await updateTask(selectedTask.id, {
        title: taskForm.title,
        description: taskForm.description,
        deadline: new Date(taskForm.deadline),
      });
      await fetchData();
      setShowTaskModal(false);
      setSelectedTask(null);
      setTaskForm({ title: '', description: '', committeeId: '', deadline: '' });
      showSuccessMsg('Task updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'open' ? 'closed' : 'open';
      await updateTask(task.id, { status: newStatus });
      await fetchData();
      showSuccessMsg(`Task marked as ${newStatus}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setFormLoading(true);
    try {
      await deleteTask(deleteTarget);
      await fetchData();
      setShowDeleteDialog(false);
      setDeleteTarget(null);
      showSuccessMsg('Task deleted successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditTask = (task: Task) => {
    setSelectedTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      committeeId: task.committeeId,
      deadline: new Date(task.deadline).toISOString().split('T')[0],
    });
    setShowTaskModal(true);
  };

  const openViewSubmissions = async (task: Task) => {
    setSelectedTask(task);
    setTaskSubmissions(submissions[task.id] || []);
    setShowSubmissionsModal(true);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (date: Date) => {
    return new Date(date) < new Date();
  };

  if (loading) {
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
        <title>Leader - FTC Board</title>
      </Head>

      <ProtectedRoute allowedRoles={['leader']}>
        <Layout>
          <PageTitle
            title="Task Management"
            subtitle={`Managing tasks for ${
              committees.find((c) => c.id === user?.committeeId)?.name || 'your committee'
            }`}
            action={
              <Button onClick={() => setShowTaskModal(true)}>+ Create Task</Button>
            }
          />

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Stats */}
          <Grid columns={4} gap="1rem" style={{ marginBottom: '2rem' }}>
            <Card>
              <CardBody>
                <div style={statStyles.icon}>📋</div>
                <h3 style={statStyles.number}>{tasks.length}</h3>
                <p style={statStyles.label}>Total Tasks</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div style={statStyles.icon}>✅</div>
                <h3 style={statStyles.number}>
                  {tasks.filter((t) => t.status === 'open').length}
                </h3>
                <p style={statStyles.label}>Open</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div style={statStyles.icon}>📤</div>
                <h3 style={statStyles.number}>
                  {Object.values(submissions).reduce((acc, arr) => acc + arr.length, 0)}
                </h3>
                <p style={statStyles.label}>Submissions</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div style={statStyles.icon}>⚠️</div>
                <h3 style={statStyles.number}>
                  {tasks.filter((t) => t.status === 'open' && isOverdue(t.deadline)).length}
                </h3>
                <p style={statStyles.label}>Overdue</p>
              </CardBody>
            </Card>
          </Grid>

          {/* Tasks List */}
          {tasks.length === 0 ? (
            <EmptyState
              icon="📝"
              title="No tasks yet"
              description="Create your first task to get started"
              action={
                <Button onClick={() => setShowTaskModal(true)}>Create Task</Button>
              }
            />
          ) : (
            <Grid columns={2} gap="1.5rem">
              {tasks.map((task) => (
                <Card
                  key={task.id}
                  style={{
                    borderLeft: `4px solid ${
                      task.status === 'open'
                        ? isOverdue(task.deadline)
                          ? '#f59e0b'
                          : '#10b981'
                        : '#6b7280'
                    }`,
                  }}
                >
                  <CardBody>
                    <div style={cardStyles.header}>
                      <h3 style={cardStyles.title}>{task.title}</h3>
                      <Badge
                        variant={
                          task.status === 'open'
                            ? isOverdue(task.deadline)
                              ? 'warning'
                              : 'success'
                            : 'default'
                        }
                      >
                        {task.status}
                      </Badge>
                    </div>
                    <p style={cardStyles.description}>{task.description}</p>
                    <div style={cardStyles.meta}>
                      <span>
                        <strong>Deadline:</strong>{' '}
                        <span
                          style={{
                            color: isOverdue(task.deadline) ? '#dc2626' : 'inherit',
                          }}
                        >
                          {formatDate(task.deadline)}
                        </span>
                      </span>
                      <span>
                        <strong>Submissions:</strong>{' '}
                        {submissions[task.id]?.length || 0}
                      </span>
                    </div>
                    <div style={cardStyles.actions}>
                      <Button
                        size="small"
                        onClick={() => openViewSubmissions(task)}
                      >
                        View Submissions
                      </Button>
                      <Button
                        size="small"
                        variant="outline"
                        onClick={() => openEditTask(task)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant={task.status === 'open' ? 'secondary' : 'primary'}
                        onClick={() => handleToggleStatus(task)}
                      >
                        {task.status === 'open' ? 'Close' : 'Reopen'}
                      </Button>
                      <Button
                        size="small"
                        variant="danger"
                        onClick={() => {
                          setDeleteTarget(task.id);
                          setShowDeleteDialog(true);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </Grid>
          )}

          {/* Create/Edit Task Modal */}
          <Modal
            isOpen={showTaskModal}
            onClose={() => {
              setShowTaskModal(false);
              setSelectedTask(null);
              setTaskForm({ title: '', description: '', committeeId: '', deadline: '' });
            }}
            title={selectedTask ? 'Edit Task' : 'Create Task'}
            footer={
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedTask(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={selectedTask ? handleUpdateTask : handleCreateTask}
                  loading={formLoading}
                >
                  {selectedTask ? 'Update' : 'Create'}
                </Button>
              </>
            }
          >
            <Input
              label="Task Title"
              value={taskForm.title}
              onChange={(e) =>
                setTaskForm({ ...taskForm, title: e.target.value })
              }
              placeholder="Enter task title"
              required
            />
            <Textarea
              label="Description"
              value={taskForm.description}
              onChange={(e) =>
                setTaskForm({ ...taskForm, description: e.target.value })
              }
              placeholder="Describe the task in detail..."
              required
            />
            <Input
              label="Deadline"
              type="date"
              value={taskForm.deadline}
              onChange={(e) =>
                setTaskForm({ ...taskForm, deadline: e.target.value })
              }
              required
            />
          </Modal>

          {/* View Submissions Modal */}
          <Modal
            isOpen={showSubmissionsModal}
            onClose={() => {
              setShowSubmissionsModal(false);
              setSelectedTask(null);
              setTaskSubmissions([]);
            }}
            title={`Submissions: ${selectedTask?.title || ''}`}
          >
            {taskSubmissions.length === 0 ? (
              <EmptyState
                icon="📭"
                title="No submissions yet"
                description="Members haven't submitted anything for this task"
              />
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {taskSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid #e5e7eb',
                    }}
                  >
                    <div style={submissionStyles.header}>
                      <strong>{submission.userName}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {formatDate(submission.submittedAt)}
                      </span>
                    </div>
                    <p style={{ marginTop: '0.5rem' }}>{submission.answer}</p>
                    {submission.fileUrl && (
                      <a
                        href={submission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#e94560', fontSize: '0.875rem' }}
                      >
                        View attached file
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Modal>

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            isOpen={showDeleteDialog}
            onClose={() => {
              setShowDeleteDialog(false);
              setDeleteTarget(null);
            }}
            onConfirm={handleDelete}
            title="Confirm Delete"
            message="Are you sure you want to delete this task? This will also delete all submissions."
            confirmText="Delete"
            loading={formLoading}
          />
        </Layout>
      </ProtectedRoute>
    </>
  );
}

// Styles
const statStyles: Record<string, React.CSSProperties> = {
  icon: {
    fontSize: '1.5rem',
    marginBottom: '0.5rem',
  },
  number: {
    fontSize: '2rem',
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

const cardStyles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  title: {
    fontWeight: 600,
    margin: 0,
  },
  description: {
    color: '#6b7280',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  },
  meta: {
    display: 'flex',
    gap: '1.5rem',
    fontSize: '0.875rem',
    color: '#374151',
    marginBottom: '1rem',
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
};

const submissionStyles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
};
