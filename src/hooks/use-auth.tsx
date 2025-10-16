

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserType } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: UserType | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setLoading(true);
      setFirebaseUser(user);
      if (!user) {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (firebaseUser) {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
        // Não defina 'loading' aqui, para permitir atualizações em tempo real
        if (doc.exists()) {
          setUser({ id: doc.id, ...doc.data() } as UserType);
        } else {
          setUser(null);
        }
        // O carregamento inicial é finalizado apenas uma vez
        if (loading) {
            setLoading(false);
        }
      }, (error) => {
          console.error("Error listening to user document:", error);
          setUser(null);
          setLoading(false);
      });
      
      return () => unsubscribeFirestore();
    }
  }, [firebaseUser]);

  const value = { firebaseUser, user, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
