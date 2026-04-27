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

// ✅ حماية: لو db مش متعرف
if (!db) {
  throw new Error('Firestore (db) is not initialized');
}

// ============================================
// COMMITTEES
// ============================================

export async function createCommittee(data: CreateCommitteeInput): Promise<Committee> {
  const docRef = await addDoc(collection(db!, 'committees'), {
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

export async function getCommittees(): Promise<Committee[]> {
  const q = query(collection(db!, 'committees'), orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data()?.createdAt?.toDate() || new Date(),
    updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
  })) as Committee[];
}

export async function getCommittee(id: string): Promise<Committee | null> {
  const docSnap = await getDoc(doc(db!, 'committees', id));
  if (!docSnap.exists()) return null;

  return {
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: docSnap.data()?.createdAt?.toDate() || new Date(),
    updatedAt: docSnap.data()?.updatedAt?.toDate() || new Date(),
  } as Committee;
}

export async function updateCommittee(
  id: string,
  data: Partial<CreateCommitteeInput>
): Promise<void> {
  await updateDoc(doc(db!, 'committees', id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteCommittee(id: string): Promise<void> {
  await deleteDoc(doc(db!, 'committees', id));
}

export async function assignLeaderToCommittee(
  committeeId: string,
  leaderId: string | null
): Promise<void> {
  await updateDoc(doc(db!, 'committees', committeeId), {
    leaderId,
    updatedAt: Timestamp.now(),
  });
}

// ============================================
// TASKS
// ============================================

export async function createTask(data: CreateTaskInput): Promise<Task> {
  const docRef = await addDoc(collection(db!, 'tasks'), {
    title: data.title,
    description: data.description,
    committeeId: data.committeeId,
    createdBy: '',
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

export async function getTasksByCommittee(committeeId: string): Promise<Task[]> {
  const q = query(
    collection(db!, 'tasks'),
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

export async function getTasksForMember(committeeId: string): Promise<Task[]> {
  const q = query(
    collection(db!, 'tasks'),
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

export async function getAllTasks(): Promise<Task[]> {
  const q = query(collection(db!, 'tasks'), orderBy('deadline', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data()?.createdAt?.toDate() || new Date(),
    updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
    deadline: doc.data()?.deadline?.toDate() || new Date(),
  })) as Task[];
}

export async function getTask(id: string): Promise<Task | null> {
  const docSnap = await getDoc(doc(db!, 'tasks', id));
  if (!docSnap.exists()) return null;

  return {
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: docSnap.data()?.createdAt?.toDate() || new Date(),
    updatedAt: docSnap.data()?.updatedAt?.toDate() || new Date(),
    deadline: docSnap.data()?.deadline?.toDate() || new Date(),
  } as Task;
}

export async function updateTask(
  id: string,
  data: Partial<Pick<Task, 'title' | 'description' | 'status' | 'deadline'>>
): Promise<void> {
  const updateData: DocumentData = {
    ...data,
    updatedAt: Timestamp.now(),
  };

  if (data.deadline) {
    updateData.deadline = Timestamp.fromDate(data.deadline);
  }

  await updateDoc(doc(db!, 'tasks', id), updateData);
}

export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db!, 'tasks', id));
}

// ============================================
// SUBMISSIONS
// ============================================

export async function submitTask(
  taskId: string,
  userId: string,
  userName: string,
  data: SubmitTaskInput
): Promise<Submission> {
  const docRef = await addDoc(collection(db!, 'submissions'), {
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