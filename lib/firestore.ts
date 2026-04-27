import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Committee,
  Task,
  Submission,
  User,
  CreateCommitteeInput,
  CreateTaskInput,
  SubmitTaskInput,
} from '@/types';

// ============================================
// COMMITTEES
// ============================================

/**
 * Create a new committee
 */
export async function createCommittee(data: CreateCommitteeInput): Promise<Committee> {
  const docRef = await addDoc(collection(db, 'committees'), {
    name: data.name,
    description: data.description || '',
    leaderId: data.leaderId || null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  const docSnap = await getDoc(docRef);
  return {
    id: docRef.id,
    ...docSnap.data(),
    createdAt: docSnap.data()?.createdAt?.toDate() || new Date(),
    updatedAt: docSnap.data()?.updatedAt?.toDate() || new Date(),
  } as Committee;
}

/**
 * Get all committees
 */
export async function getCommittees(): Promise<Committee[]> {
  const q = query(collection(db, 'committees'), orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data()?.createdAt?.toDate() || new Date(),
    updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
  })) as Committee[];
}

/**
 * Get a single committee by ID
 */
export async function getCommittee(id: string): Promise<Committee | null> {
  const docSnap = await getDoc(doc(db, 'committees', id));
  if (!docSnap.exists()) return null;
  return {
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: docSnap.data()?.createdAt?.toDate() || new Date(),
    updatedAt: docSnap.data()?.updatedAt?.toDate() || new Date(),
  } as Committee;
}

/**
 * Update a committee
 */
export async function updateCommittee(
  id: string,
  data: Partial<CreateCommitteeInput>
): Promise<void> {
  await updateDoc(doc(db, 'committees', id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a committee
 */
export async function deleteCommittee(id: string): Promise<void> {
  await deleteDoc(doc(db, 'committees', id));
}

/**
 * Assign a leader to a committee
 */
export async function assignLeaderToCommittee(
  committeeId: string,
  leaderId: string | null
): Promise<void> {
  await updateDoc(doc(db, 'committees', committeeId), {
    leaderId,
    updatedAt: Timestamp.now(),
  });
}

// ============================================
// TASKS
// ============================================

/**
 * Create a new task (leader only)
 */
export async function createTask(data: CreateTaskInput): Promise<Task> {
  const docRef = await addDoc(collection(db, 'tasks'), {
    title: data.title,
    description: data.description,
    committeeId: data.committeeId,
    createdBy: '', // Will be set by the caller
    deadline: Timestamp.fromDate(data.deadline),
    status: 'open',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  const docSnap = await getDoc(docRef);
  return {
    id: docRef.id,
    ...docSnap.data(),
    createdAt: docSnap.data()?.createdAt?.toDate() || new Date(),
    updatedAt: docSnap.data()?.updatedAt?.toDate() || new Date(),
    deadline: docSnap.data()?.deadline?.toDate() || new Date(),
  } as Task;
}

/**
 * Get tasks for a specific committee (for leaders)
 */
export async function getTasksByCommittee(committeeId: string): Promise<Task[]> {
  const q = query(
    collection(db, 'tasks'),
    where('committeeId', '==', committeeId),
    orderBy('deadline', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data()?.createdAt?.toDate() || new Date(),
    updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
    deadline: doc.data()?.deadline?.toDate() || new Date(),
  })) as Task[];
}

/**
 * Get tasks for a member (their committee's tasks)
 */
export async function getTasksForMember(committeeId: string): Promise<Task[]> {
  const q = query(
    collection(db, 'tasks'),
    where('committeeId', '==', committeeId),
    where('status', '==', 'open'),
    orderBy('deadline', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data()?.createdAt?.toDate() || new Date(),
    updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
    deadline: doc.data()?.deadline?.toDate() || new Date(),
  })) as Task[];
}

/**
 * Get all tasks (admin only)
 */
export async function getAllTasks(): Promise<Task[]> {
  const q = query(collection(db, 'tasks'), orderBy('deadline', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data()?.createdAt?.toDate() || new Date(),
    updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
    deadline: doc.data()?.deadline?.toDate() || new Date(),
  })) as Task[];
}

/**
 * Get a single task by ID
 */
export async function getTask(id: string): Promise<Task | null> {
  const docSnap = await getDoc(doc(db, 'tasks', id));
  if (!docSnap.exists()) return null;
  return {
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: docSnap.data()?.createdAt?.toDate() || new Date(),
    updatedAt: docSnap.data()?.updatedAt?.toDate() || new Date(),
    deadline: docSnap.data()?.deadline?.toDate() || new Date(),
  } as Task;
}

/**
 * Update a task
 */
export async function updateTask(
  id: string,
  data: Partial<Pick<Task, 'title' | 'description' | 'status' | 'deadline'>>
): Promise<void> {
  const updateData: DocumentData = { ...data, updatedAt: Timestamp.now() };
  if (data.deadline) {
    updateData.deadline = Timestamp.fromDate(data.deadline);
  }
  await updateDoc(doc(db, 'tasks', id), updateData);
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db, 'tasks', id));
}

// ============================================
// SUBMISSIONS
// ============================================

/**
 * Submit a task (member)
 */
export async function submitTask(
  taskId: string,
  userId: string,
  userName: string,
  data: SubmitTaskInput
): Promise<Submission> {
  const docRef = await addDoc(collection(db, 'submissions'), {
    taskId,
    userId,
    userName,
    answer: data.answer,
    fileUrl: data.fileUrl || null,
    submittedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  const docSnap = await getDoc(docRef);
  return {
    id: docRef.id,
    ...docSnap.data(),
    submittedAt: docSnap.data()?.submittedAt?.toDate() || new Date(),
    updatedAt: docSnap.data()?.updatedAt?.toDate() || new Date(),
  } as Submission;
}

/**
 * Get submissions for a task (for leaders/admin)
 */
export async function getSubmissionsByTask(taskId: string): Promise<Submission[]> {
  const q = query(
    collection(db, 'submissions'),
    where('taskId', '==', taskId),
    orderBy('submittedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    submittedAt: doc.data()?.submittedAt?.toDate() || new Date(),
    updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
  })) as Submission[];
}

/**
 * Get submissions by a user
 */
export async function getSubmissionsByUser(userId: string): Promise<Submission[]> {
  const q = query(
    collection(db, 'submissions'),
    where('userId', '==', userId),
    orderBy('submittedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    submittedAt: doc.data()?.submittedAt?.toDate() || new Date(),
    updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
  })) as Submission[];
}

/**
 * Get a user's submission for a specific task
 */
export async function getUserSubmissionForTask(
  taskId: string,
  userId: string
): Promise<Submission | null> {
  const q = query(
    collection(db, 'submissions'),
    where('taskId', '==', taskId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    submittedAt: doc.data()?.submittedAt?.toDate() || new Date(),
    updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
  } as Submission;
}

/**
 * Update a submission
 */
export async function updateSubmission(
  id: string,
  data: Partial<Pick<Submission, 'answer' | 'fileUrl'>>
): Promise<void> {
  await updateDoc(doc(db, 'submissions', id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// ============================================
// USERS
// ============================================

/**
 * Get all users
 */
export async function getUsers(): Promise<User[]> {
  const q = query(collection(db, 'users'), orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data()?.createdAt?.toDate() || new Date(),
    updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
  })) as User[];
}

/**
 * Get users by committee
 */
export async function getUsersByCommittee(committeeId: string): Promise<User[]> {
  const q = query(
    collection(db, 'users'),
    where('committeeId', '==', committeeId),
    orderBy('name')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data()?.createdAt?.toDate() || new Date(),
    updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
  })) as User[];
}

/**
 * Get a single user by ID
 */
export async function getUser(id: string): Promise<User | null> {
  const docSnap = await getDoc(doc(db, 'users', id));
  if (!docSnap.exists()) return null;
  return {
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: docSnap.data()?.createdAt?.toDate() || new Date(),
    updatedAt: docSnap.data()?.updatedAt?.toDate() || new Date(),
  } as User;
}
