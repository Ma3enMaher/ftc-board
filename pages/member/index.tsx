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
import { Textarea, Input } from '@/components/Input';
import Modal from '@/components/Modal';
import {
  getCommittees,
  getTasksForMember,
  submitTask,
  updateSubmission,
  getUserSubmissionForTask,
} from '@/lib/firestore';
import { Committee, Task, Submission } from '@/types';

export default function MemberPage() {
  const { user } = useAuth();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);

  // Form state
  const [submissionForm, setSubmissionForm] = useState({
    answer: '',
    fileUrl: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      // Get committees
      const committeesData = await getCommittees();
      setCommittees(committeesData);

      // Get tasks for user's committee
      if (user.committeeId) {
        const tasksData = await getTasksForMember(user.committeeId);
        setTasks(tasksData);

        // Get user's submissions for each task
        const submissionsMap: Record<string, Submission> = {};
        for (const task of tasksData) {
          const submission = await getUserSubmissionForTask(task.id, user.id);
          if (submission) {
            submissionsMap[task.id] = submission;
          }
        }
        setUserSubmissions(submissionsMap);
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

  const handleSubmitTask = async () => {
    if (!user || !selectedTask) return;
    setFormLoading(true);
    setError('');
    try {
      if (existingSubmission) {
        // Update existing submission
        await updateSubmission(existingSubmission.id, {
          answer: submissionForm.answer,
          fileUrl: submissionForm.fileUrl || undefined,
        });
        showSuccessMsg('Submission updated successfully!');
      } else {
        // Create new submission
        await submitTask(selectedTask.id, user.id, user.name, {
          taskId: selectedTask.id,
          answer: submissionForm.answer,
          fileUrl: submissionForm.fileUrl || undefined,
        });
        showSuccessMsg('Task submitted successfully!');
      }
      await fetchData();
      setShowSubmitModal(false);
      setSelectedTask(null);
      setExistingSubmission(null);
      setSubmissionForm({ answer: '', fileUrl: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to submit task');
    } finally {
      setFormLoading(false);
    }
  };

  const openSubmitModal = (task: Task) => {
    setSelectedTask(task);
    const existing = userSubmissions[task.id];
    setExistingSubmission(existing || null);
    setSubmissionForm({
      answer: existing?.answer || '',
      fileUrl: existing?.fileUrl || '',
    });
    setShowSubmitModal(true);
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

  const getCommitteeName = () => {
    if (!user?.committeeId) return 'No committee';
    return committees.find((c) => c.id === user.committeeId)?.name || 'Unknown';
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
        <title>Member - FTC Board</title>
      </Head>

      <ProtectedRoute allowedRoles={['member']}>
        <Layout>
          <PageTitle
            title="My Tasks"
            subtitle={`Tasks assigned to ${getCommitteeName()}`}
          />

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Stats */}
          <Grid columns={3} gap="1rem" style={{ marginBottom: '2rem' }}>
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
                <h3 style={statStyles.number}>{Object.keys(userSubmissions).length}</h3>
                <p style={statStyles.label}>Submitted</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div style={statStyles.icon}>⏳</div>
                <h3 style={statStyles.number}>
                  {tasks.length - Object.keys(userSubmissions).length}
                </h3>
                <p style={statStyles.label}>Pending</p>
              </CardBody>
            </Card>
          </Grid>

          {/* Not assigned to committee */}
          {!user?.committeeId && (
            <EmptyState
              icon="👋"
              title="Not Assigned to Committee"
              description="You haven't been assigned to a committee yet. Please contact an admin to get assigned to a committee."
            />
          )}

          {/* Tasks List */}
          {user?.committeeId && tasks.length === 0 ? (
            <EmptyState
              icon="🎉"
              title="No tasks available"
              description="There are no open tasks for your committee right now. Check back later!"
            />
          ) : (
            <Grid columns={2} gap="1.5rem">
              {tasks.map((task) => {
                const hasSubmitted = !!userSubmissions[task.id];
                const submission = userSubmissions[task.id];

                return (
                  <Card
                    key={task.id}
                    style={{
                      borderLeft: `4px solid ${
                        hasSubmitted
                          ? '#10b981'
                          : isOverdue(task.deadline)
                          ? '#dc2626'
                          : '#3b82f6'
                      }`,
                    }}
                  >
                    <CardBody>
                      <div style={cardStyles.header}>
                        <h3 style={cardStyles.title}>{task.title}</h3>
                        {hasSubmitted ? (
                          <Badge variant="success">Submitted</Badge>
                        ) : isOverdue(task.deadline) ? (
                          <Badge variant="error">Overdue</Badge>
                        ) : (
                          <Badge variant="info">Pending</Badge>
                        )}
                      </div>
                      <p style={cardStyles.description}>{task.description}</p>
                      <div style={cardStyles.meta}>
                        <span>
                          <strong>Deadline:</strong>{' '}
                          <span
                            style={{
                              color: hasSubmitted
                                ? '#10b981'
                                : isOverdue(task.deadline)
                                ? '#dc2626'
                                : 'inherit',
                            }}
                          >
                            {formatDate(task.deadline)}
                          </span>
                        </span>
                      </div>

                      {hasSubmitted ? (
                        <div style={submittedSection}>
                          <p style={submittedLabel}>Your Submission:</p>
                          <p style={submittedText}>{submission?.answer}</p>
                          {submission?.fileUrl && (
                            <a
                              href={submission.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={linkStyle}
                            >
                              View attached file
                            </a>
                          )}
                          <p style={submittedDate}>
                            Submitted: {formatDate(submission?.submittedAt || new Date())}
                          </p>
                          <Button
                            size="small"
                            variant="outline"
                            onClick={() => openSubmitModal(task)}
                            style={{ marginTop: '0.75rem' }}
                          >
                            Edit Submission
                          </Button>
                        </div>
                      ) : (
                        <Button
                          fullWidth
                          onClick={() => openSubmitModal(task)}
                          disabled={isOverdue(task.deadline)}
                        >
                          {isOverdue(task.deadline) ? 'Task Closed' : 'Submit Task'}
                        </Button>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </Grid>
          )}

          {/* Submit Task Modal */}
          <Modal
            isOpen={showSubmitModal}
            onClose={() => {
              setShowSubmitModal(false);
              setSelectedTask(null);
              setExistingSubmission(null);
              setSubmissionForm({ answer: '', fileUrl: '' });
            }}
            title={existingSubmission ? 'Edit Submission' : 'Submit Task'}
            footer={
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowSubmitModal(false);
                    setSelectedTask(null);
                    setExistingSubmission(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitTask} loading={formLoading}>
                  {existingSubmission ? 'Update' : 'Submit'}
                </Button>
              </>
            }
          >
            {selectedTask && (
              <>
                <div style={modalTaskInfo}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{selectedTask.title}</h4>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                    {selectedTask.description}
                  </p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    Deadline: {formatDate(selectedTask.deadline)}
                  </p>
                </div>
                <Textarea
                  label="Your Answer"
                  value={submissionForm.answer}
                  onChange={(e) =>
                    setSubmissionForm({ ...submissionForm, answer: e.target.value })
                  }
                  placeholder="Enter your answer or work description..."
                  required
                  style={{ minHeight: '120px' }}
                />
                <Input
                  label="File URL (Optional)"
                  type="url"
                  value={submissionForm.fileUrl}
                  onChange={(e) =>
                    setSubmissionForm({ ...submissionForm, fileUrl: e.target.value })
                  }
                  placeholder="https://drive.google.com/... or any file URL"
                  helper="You can paste a Google Drive, Dropbox, or any public file link"
                />
              </>
            )}
          </Modal>
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
    fontSize: '0.875rem',
    color: '#374151',
    marginBottom: '1rem',
  },
};

const submittedSection: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  padding: '1rem',
  borderRadius: '8px',
  marginTop: '0.5rem',
};

const submittedLabel: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#166534',
  marginBottom: '0.5rem',
};

const submittedText: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#374151',
  marginBottom: '0.5rem',
};

const submittedDate: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#6b7280',
  marginTop: '0.5rem',
};

const modalTaskInfo: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  padding: '1rem',
  borderRadius: '8px',
  marginBottom: '1.5rem',
};

const linkStyle: React.CSSProperties = {
  color: '#e94560',
  fontSize: '0.875rem',
  textDecoration: 'underline',
};
