import { useState, useEffect, createContext, useContext } from 'react';
import { auth, isFirebaseConfigured } from '../config/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext({
  user: null,
  loading: false,
  isAuthenticated: false,
});

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Check localStorage first
    let storedUser = null;
    try {
      const stored = localStorage.getItem('user_data');
      if (stored) {
        storedUser = JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }

    if (storedUser) {
      setState({
        user: storedUser,
        loading: false,
        isAuthenticated: true,
      });
    }

    // If Firebase is not configured, stop here
    if (!isFirebaseConfigured || !auth) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    // Subscribe to Firebase auth
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
        localStorage.setItem('user_data', JSON.stringify(userData));
        setState({
          user: userData,
          loading: false,
          isAuthenticated: true,
        });
      } else {
        localStorage.removeItem('user_data');
        setState({
          user: null,
          loading: false,
          isAuthenticated: false,
        });
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
