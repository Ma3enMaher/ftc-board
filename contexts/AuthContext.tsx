import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, UserRole, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch user data safely
  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      if (!db) throw new Error("Firestore not initialized");

      const userRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        return {
          id: userDoc.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          committeeId: userData.committeeId || null,
          createdAt: userData.createdAt?.toDate?.() || new Date(),
          updatedAt: userData.updatedAt?.toDate?.() || new Date(),
        };
      }

      return null;
    } catch (err) {
      console.error('Error fetching user data:', err);
      return null;
    }
  };

  // ✅ Listen for auth state changes
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await fetchUserData(firebaseUser);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Sign Up
  const signUp = async (email: string, password: string, name: string) => {
    setError(null);
    setLoading(true);

    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');

      if (!auth) throw new Error("Auth not initialized");
      if (!db) throw new Error("Firestore not initialized");

      const credential = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(credential.user, {
        displayName: name,
      });

      const userDocData: Omit<User, 'id'> = {
        name,
        email,
        role: 'member',
        committeeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'users', credential.user.uid), userDocData);

      setUser({
        id: credential.user.uid,
        ...userDocData,
      });

    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Sign In
  const signIn = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');

      if (!auth) throw new Error("Auth not initialized");

      const credential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await fetchUserData(credential.user);

      setUser(userData);

    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Sign Out
  const signOut = async () => {
    setError(null);

    try {
      const { signOut: firebaseSignOut } = await import('firebase/auth');

      if (!auth) throw new Error("Auth not initialized");

      await firebaseSignOut(auth);
      setUser(null);

    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      throw err;
    }
  };

  // ✅ Update Role
  const updateUserRole = async (
    userId: string,
    role: UserRole,
    committeeId?: string
  ) => {
    setError(null);

    try {
      if (!db) throw new Error("Firestore not initialized");

      await updateDoc(doc(db, 'users', userId), {
        role,
        committeeId: committeeId || null,
        updatedAt: new Date(),
      });

    } catch (err: any) {
      setError(err.message || 'Failed to update user role');
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ✅ Hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}