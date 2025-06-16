// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isLoadingAuth: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; errorMsg?: string }>;
  logout: () => void;
}

 

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fetch Firestore user details & map to app User type
const loadUserRole = async (firebaseUser: FirebaseUser): Promise<User> => {
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  const role = userDoc.exists() ? userDoc.data().role : 'user'; // fallback

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email ?? '',
    name: firebaseUser.displayName ?? '',
    role,
    avatarUrl: firebaseUser.photoURL ?? undefined,
    password: undefined, // always undefined for safety
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userWithRole = await loadUserRole(firebaseUser);
        setCurrentUser(userWithRole);
      } else {
        setCurrentUser(null);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  console.log(currentUser)

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; errorMsg?: string }> => {
    setIsLoadingAuth(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const userWithRole = await loadUserRole(user);
      setCurrentUser(userWithRole);
      setIsLoadingAuth(false);
      return { success: true };
    } catch (error: any) {
      setIsLoadingAuth(false);
      let message = 'Login failed. Please try again.';

      switch (error.code) {
        case 'auth/user-not-found':
          message = 'No user found with this email.';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address.';
          break;
        case 'auth/too-many-requests':
          message = 'Too many failed attempts. Try again later.';
          break;
        default:
          message = error.message || message;
          break;
      }

      return { success: false, errorMsg: message };
    }
  };

  const logout = () => {
    signOut(auth);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoadingAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
