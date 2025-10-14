

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
      setFirebaseUser(user);
      if (!user) {
        // Se o usuário do Firebase for nulo (logout ou não autenticado),
        // paramos de carregar imediatamente.
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
        if (doc.exists()) {
          setUser({ id: doc.id, ...doc.data() } as UserType);
        } else {
          // Usuário do Firebase existe, mas não o documento do Firestore (ex: durante o cadastro)
          setUser(null);
        }
        // O estado de carregamento só termina DEPOIS que a busca no Firestore é concluída.
        setLoading(false);
      });
      return () => unsubscribeFirestore();
    }
    // Não alteramos o 'loading' para 'false' aqui se firebaseUser for nulo,
    // pois o onAuthStateChanged já cuida disso.
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
