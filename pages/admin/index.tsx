import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Card,
  CardBody,
  CardHeader,
  PageTitle,
  Badge,
  Grid,
  EmptyState,
} from '@/components/Card';
import { Button } from '@/components/Button';
import { Input, Textarea, Select } from '@/components/Input';
import Modal, { ConfirmDialog } from '@/components/Modal';
import {
  getCommittees,
  getUsers,
  createCommittee,
  updateCommittee,
  deleteCommittee,
  assignLeaderToCommittee,
  updateUserRole,
} from '@/lib/firestore';
import { Committee, User, UserRole } from '@/types';

export default function AdminPage() {
  const { user } = useAuth();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showCommitteeModal, setShowCommitteeModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'committee' | 'user'; id: string } | null>(null);

  // Form states
  const [committeeForm, setCommitteeForm] = useState({
    name: '',
    description: '',
    leaderId: '',
  });
  const [userForm, setUserForm] = useState({
    role: 'member' as UserRole,
    committeeId: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [committeesData, usersData] = await Promise.all([
        getCommittees(),
        getUsers(),
      ]);
      setCommittees(committeesData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Committee handlers
  const handleCreateCommittee = async () => {
    setFormLoading(true);
    setError('');
    try {
      await createCommittee({
        name: committeeForm.name,
        description: committeeForm.description,
        leaderId: committeeForm.leaderId || null,
      });
      await fetchData();
      setShowCommitteeModal(false);
      setCommitteeForm({ name: '', description: '', leaderId: '' });
      showSuccess('Committee created successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to create committee');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateCommittee = async () => {
    if (!selectedCommittee) return;
    setFormLoading(true);
    setError('');
    try {
      await updateCommittee(selectedCommittee.id, {
        name: committeeForm.name,
        description: committeeForm.description,
      });
      if (committeeForm.leaderId !== selectedCommittee.leaderId) {
        await assignLeaderToCommittee(
          selectedCommittee.id,
          committeeForm.leaderId || null
        );
      }
      await fetchData();
      setShowCommitteeModal(false);
      setSelectedCommittee(null);
      setCommitteeForm({ name: '', description: '', leaderId: '' });
      showSuccess('Committee updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update committee');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditCommittee = (committee: Committee) => {
    setSelectedCommittee(committee);
    setCommitteeForm({
      name: committee.name,
      description: committee.description || '',
      leaderId: committee.leaderId || '',
    });
    setShowCommitteeModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setFormLoading(true);
    try {
      if (deleteTarget.type === 'committee') {
        await deleteCommittee(deleteTarget.id);
        showSuccess('Committee deleted successfully!');
      }
      await fetchData();
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    } finally {
      setFormLoading(false);
    }
  };

  // User handlers
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setFormLoading(true);
    setError('');
    try {
      await updateUserRole(selectedUser.id, userForm.role, userForm.committeeId);
      await fetchData();
      setShowUserModal(false);
      setSelectedUser(null);
      setUserForm({ role: 'member', committeeId: '' });
      showSuccess('User updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditUser = (user: User) => {
    setSelectedUser(user);
    setUserForm({
      role: user.role,
      committeeId: user.committeeId || '',
    });
    setShowUserModal(true);
  };

  const getLeaderName = (leaderId: string | null) => {
    if (!leaderId) return 'Not assigned';
    const leader = users.find((u) => u.id === leaderId);
    return leader?.name || 'Unknown';
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
        <title>Admin - FTC Board</title>
      </Head>

      <ProtectedRoute allowedRoles={['admin']}>
        <Layout>
          <PageTitle
            title="Admin Dashboard"
            subtitle="Manage committees and user roles"
            action={
              <Button onClick={() => setShowCommitteeModal(true)}>
                + New Committee
              </Button>
            }
          />

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Committees Section */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={sectionStyles.title}>Committees</h2>
            {committees.length === 0 ? (
              <EmptyState
                icon="🏢"
                title="No committees yet"
                description="Create your first committee to get started"
                action={
                  <Button onClick={() => setShowCommitteeModal(true)}>
                    Create Committee
                  </Button>
                }
              />
            ) : (
              <Grid columns={3} gap="1.5rem">
                {committees.map((committee) => (
                  <Card key={committee.id}>
                    <CardBody>
                      <div style={cardHeaderStyles}>
                        <h3 style={{ fontWeight: 600, margin: 0 }}>
                          {committee.name}
                        </h3>
                        <Badge variant="info">
                          {users.filter((u) => u.committeeId === committee.id).length} members
                        </Badge>
                      </div>
                      {committee.description && (
                        <p style={cardDescription}>{committee.description}</p>
                      )}
                      <div style={cardMeta}>
                        <span style={cardMetaLabel}>Leader:</span>
                        <span>{getLeaderName(committee.leaderId)}</span>
                      </div>
                      <div style={cardActions}>
                        <Button
                          size="small"
                          variant="outline"
                          onClick={() => openEditCommittee(committee)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="danger"
                          onClick={() => {
                            setDeleteTarget({ type: 'committee', id: committee.id });
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
          </div>

          {/* Users Section */}
          <div>
            <h2 style={sectionStyles.title}>Users</h2>
            <Card>
              <div style={tableStyles.wrapper}>
                <table style={tableStyles.table}>
                  <thead>
                    <tr style={tableStyles.headerRow}>
                      <th style={tableStyles.header}>Name</th>
                      <th style={tableStyles.header}>Email</th>
                      <th style={tableStyles.header}>Role</th>
                      <th style={tableStyles.header}>Committee</th>
                      <th style={tableStyles.header}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} style={tableStyles.row}>
                        <td style={tableStyles.cell}>{user.name}</td>
                        <td style={tableStyles.cell}>{user.email}</td>
                        <td style={tableStyles.cell}>
                          <Badge
                            variant={
                              user.role === 'admin'
                                ? 'error'
                                : user.role === 'leader'
                                ? 'info'
                                : 'default'
                            }
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td style={tableStyles.cell}>
                          {user.committeeId
                            ? committees.find((c) => c.id === user.committeeId)?.name || 'Unknown'
                            : '-'}
                        </td>
                        <td style={tableStyles.cell}>
                          <Button
                            size="small"
                            variant="outline"
                            onClick={() => openEditUser(user)}
                          >
                            Edit Role
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Create/Edit Committee Modal */}
          <Modal
            isOpen={showCommitteeModal}
            onClose={() => {
              setShowCommitteeModal(false);
              setSelectedCommittee(null);
              setCommitteeForm({ name: '', description: '', leaderId: '' });
            }}
            title={selectedCommittee ? 'Edit Committee' : 'Create Committee'}
            footer={
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCommitteeModal(false);
                    setSelectedCommittee(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={selectedCommittee ? handleUpdateCommittee : handleCreateCommittee}
                  loading={formLoading}
                >
                  {selectedCommittee ? 'Update' : 'Create'}
                </Button>
              </>
            }
          >
            <Input
              label="Committee Name"
              value={committeeForm.name}
              onChange={(e) =>
                setCommitteeForm({ ...committeeForm, name: e.target.value })
              }
              placeholder="e.g., HR, Marketing"
              required
            />
            <Textarea
              label="Description"
              value={committeeForm.description}
              onChange={(e) =>
                setCommitteeForm({ ...committeeForm, description: e.target.value })
              }
              placeholder="Optional description..."
            />
            <Select
              label="Assign Leader"
              value={committeeForm.leaderId}
              onChange={(e) =>
                setCommitteeForm({ ...committeeForm, leaderId: e.target.value })
              }
              options={[
                { value: '', label: 'No leader assigned' },
                ...users
                  .filter((u) => u.role === 'leader' || u.role === 'admin')
                  .map((u) => ({ value: u.id, label: u.name })),
              ]}
              placeholder="Select a leader"
            />
          </Modal>

          {/* Edit User Role Modal */}
          <Modal
            isOpen={showUserModal}
            onClose={() => {
              setShowUserModal(false);
              setSelectedUser(null);
            }}
            title="Edit User Role"
            footer={
              <>
                <Button variant="secondary" onClick={() => setShowUserModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser} loading={formLoading}>
                  Update
                </Button>
              </>
            }
          >
            {selectedUser && (
              <>
                <p style={{ marginBottom: '1rem' }}>
                  <strong>User:</strong> {selectedUser.name}
                  <br />
                  <strong>Email:</strong> {selectedUser.email}
                </p>
                <Select
                  label="Role"
                  value={userForm.role}
                  onChange={(e) =>
                    setUserForm({ ...userForm, role: e.target.value as UserRole })
                  }
                  options={[
                    { value: 'admin', label: 'Admin' },
                    { value: 'leader', label: 'Leader' },
                    { value: 'member', label: 'Member' },
                  ]}
                />
                <Select
                  label="Committee"
                  value={userForm.committeeId}
                  onChange={(e) =>
                    setUserForm({ ...userForm, committeeId: e.target.value })
                  }
                  options={[
                    { value: '', label: 'No committee' },
                    ...committees.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </>
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
            message="Are you sure you want to delete this committee? This action cannot be undone."
            confirmText="Delete"
            loading={formLoading}
          />
        </Layout>
      </ProtectedRoute>
    </>
  );
}

// Styles
const sectionStyles: Record<string, React.CSSProperties> = {
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: '1rem',
  },
};

const cardHeaderStyles: Record<string, React.CSSProperties> = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.5rem',
};

const cardDescription: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '0.875rem',
  marginBottom: '1rem',
};

const cardMeta: React.CSSProperties = {
  fontSize: '0.875rem',
  marginBottom: '1rem',
};

const cardMetaLabel: React.CSSProperties = {
  fontWeight: 600,
  marginRight: '0.5rem',
};

const cardActions: Record<string, React.CSSProperties> = {
  display: 'flex',
  gap: '0.5rem',
};

const tableStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  headerRow: {
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  header: {
    padding: '1rem',
    textAlign: 'left' as const,
    fontWeight: 600,
    color: '#374151',
  },
  row: {
    borderBottom: '1px solid #e5e7eb',
  },
  cell: {
    padding: '1rem',
    fontSize: '0.875rem',
  },
};
