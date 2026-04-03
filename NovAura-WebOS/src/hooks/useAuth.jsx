import { useState, useEffect, createContext, useContext } from 'react';
import { auth, isFirebaseConfigured } from '../config/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { kernelStorage } from '../kernel/kernelStorage.js';

const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Firebase is the only source of truth — no localStorage auth bypass
    if (!isFirebaseConfigured || !auth) {
      setState({ user: null, loading: false, isAuthenticated: false });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          photoURL: firebaseUser.photoURL,
          avatar: firebaseUser.photoURL,
        };
        // Cache for faster re-renders only — never used to bypass auth
        kernelStorage.setItem('novaura_user_cache', JSON.stringify(userData));
        setState({ user: userData, loading: false, isAuthenticated: true });
      } else {
        kernelStorage.removeItem('novaura_user_cache');
        setState({ user: null, loading: false, isAuthenticated: false });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
