// Type definitions for the FTC Board System

// User roles in the system
export type UserRole = 'admin' | 'leader' | 'member';

// User document in Firestore
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  committeeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Committee document in Firestore
export interface Committee {
  id: string;
  name: string;
  description?: string;
  leaderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Task document in Firestore
export interface Task {
  id: string;
  title: string;
  description: string;
  committeeId: string;
  createdBy: string; // leaderId
  deadline: Date;
  status: 'open' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

// Submission document in Firestore
export interface Submission {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  answer: string;
  fileUrl?: string;
  submittedAt: Date;
  updatedAt: Date;
}

// Form input types
export interface CreateCommitteeInput {
  name: string;
  description?: string;
  leaderId?: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  committeeId: string;
  deadline: Date;
}

export interface SubmitTaskInput {
  taskId: string;
  answer: string;
  fileUrl?: string;
}

// Auth context type
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserRole: (userId: string, role: UserRole, committeeId?: string) => Promise<void>;
}

// Permission helpers
export const ROLE_PERMISSIONS = {
  admin: {
    canManageCommittees: true,
    canManageUsers: true,
    canCreateTasks: true,
    canViewAllTasks: true,
    canSubmitTasks: true,
  },
  leader: {
    canManageCommittees: false,
    canManageUsers: false,
    canCreateTasks: true,
    canViewAllTasks: false, // Only their committee
    canSubmitTasks: false,
  },
  member: {
    canManageCommittees: false,
    canManageUsers: false,
    canCreateTasks: false,
    canViewAllTasks: false, // Only their own
    canSubmitTasks: true,
  },
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS.admin;

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role][permission];
}
