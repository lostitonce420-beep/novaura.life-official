import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, LogIn, UserPlus, Chrome, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { toast } from 'sonner';

import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';
import { kernelStorage } from '../kernel/kernelStorage.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
} from 'firebase/auth';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'https://us-central1-novaura-systems.cloudfunctions.net/api').replace(/\/$/, '');

export default function AuthPage({ onAuthComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    username: '',
    backupEmail: ''
  });

  useEffect(() => {
    // Allow scrolling on auth page
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'hidden'; };
  }, []);

  useEffect(() => {
    // Check if already logged in
    const token = kernelStorage.getItem('auth_token');
    const user = kernelStorage.getItem('user_data');
    if (token && user) {
      try {
        onAuthComplete(JSON.parse(user));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Check for redirect result (Google Sign-In with redirect)
    if (isFirebaseConfigured && auth) {
      getRedirectResult(auth)
        .then((result) => {
          if (result && result.user) {
            completeAuth(result.user);
            toast.success('Welcome!', {
              description: `Signed in as ${result.user.email}`
            });
          }
        })
        .catch((error) => {
          console.error('Redirect auth error:', error);
          if (error.code === 'auth/unauthorized-domain') {
            toast.error('Domain not authorized', {
              description: 'Add this domain to Firebase Auth settings'
            });
          }
        });
    }
  }, []);

  // Helper to build a user object from Firebase user and persist it
  const completeAuth = (firebaseUser, displayName) => {
    const userData = {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      displayName: displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      photoURL: firebaseUser.photoURL || null,
      avatar: firebaseUser.photoURL || null,
    };
    // Get a real ID token (auto-refreshes; works with backend auth middleware)
    firebaseUser.getIdToken().then(token => {
      kernelStorage.setItem('auth_token', token);
      kernelStorage.setItem('novaura-auth-token', token); // aiService reads this key
    }).catch(() => {
      const fallback = firebaseUser.uid;
      kernelStorage.setItem('auth_token', fallback);
      kernelStorage.setItem('novaura-auth-token', fallback);
    });
    kernelStorage.setItem('user_data', JSON.stringify(userData));
    onAuthComplete(userData);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!isFirebaseConfigured || !auth) {
        throw new Error('Firebase is not configured. Please set VITE_FIREBASE_* env vars.');
      }
      const credential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      completeAuth(credential.user);
      toast.success('Welcome back!', {
        description: `Logged in as ${credential.user.email}`
      });
    } catch (error) {
      console.error('Login error:', error);
      const msg = error.code === 'auth/invalid-credential' ? 'Invalid email or password'
        : error.code === 'auth/user-not-found' ? 'No account found with that email'
        : error.code === 'auth/wrong-password' ? 'Incorrect password'
        : error.code === 'auth/too-many-requests' ? 'Too many attempts — try again later'
        : error.message || 'Login failed';
      toast.error('Login failed', { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!isFirebaseConfigured || !auth) {
        throw new Error('Firebase is not configured. Please set VITE_FIREBASE_* env vars.');
      }
      const username = (formData.username || formData.name || '').trim().toLowerCase();
      const usernameCheck = await fetch(`${BACKEND_URL}/auth/check-username?username=${encodeURIComponent(username)}`);
      const usernameData = await usernameCheck.json();
      if (!usernameData.available) throw new Error('Username is already taken');

      const credential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      // Set display name on the newly created user
      if (formData.name) {
        await updateProfile(credential.user, { displayName: formData.name });
      }
      completeAuth(credential.user, formData.name);
      // Persist profile extended metadata
      try {
        const idToken = await credential.user.getIdToken();
        await fetch(`${BACKEND_URL}/auth/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`
          },
          body: JSON.stringify({
            displayName: formData.name || formData.username,
            username: username,
            backupEmail: formData.backupEmail || null
          })
        });
      } catch (innerErr) {
        console.warn('Profile sync failed', innerErr);
      }


      toast.success('Account created!', {
        description: 'Welcome to NovAura AI OS'
      });
    } catch (error) {
      console.error('Signup error:', error);
      const msg = error.code === 'auth/email-already-in-use' ? 'An account with that email already exists'
        : error.code === 'auth/weak-password' ? 'Password must be at least 6 characters'
        : error.code === 'auth/invalid-email' ? 'Please enter a valid email address'
        : error.message || 'Could not create account';
      toast.error('Signup failed', { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);

    try {
      if (!isFirebaseConfigured || !auth || !googleProvider) {
        throw new Error('Firebase/Google auth is not configured. Check VITE_FIREBASE_* env vars.');
      }
      
      console.log('[Auth] Starting Google sign-in...');
      console.log('[Auth] Firebase project:', auth.app?.options?.projectId);
      console.log('[Auth] Auth domain:', auth.app?.options?.authDomain);
      
      // Try popup first (better UX), fall back to redirect if blocked
      try {
        const result = await signInWithPopup(auth, googleProvider);
        completeAuth(result.user);
        toast.success('Welcome!', {
          description: `Signed in as ${result.user.email}`
        });
      } catch (popupError) {
        console.error('[Auth] Popup error:', popupError.code, popupError.message);
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/cancelled-popup-request') {
          // Fall back to redirect method
          console.log('[Auth] Popup blocked, using redirect...');
          await signInWithRedirect(auth, googleProvider);
          // Page will reload, auth handled in useEffect
        } else {
          throw popupError;
        }
      }
    } catch (error) {
      console.error('Google auth error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code !== 'auth/popup-closed-by-user') {
        const msg = error.code === 'auth/unauthorized-domain'
          ? 'This domain is not authorized. Add it in Firebase Console → Auth → Settings → Authorized domains.'
          : error.code === 'auth/configuration-not-found'
          ? 'Google OAuth not configured. Go to Firebase Console → Auth → Sign-in method → Enable Google.'
          : error.code === 'auth/internal-error'
          ? 'OAuth configuration error. Check Google Cloud Console → OAuth consent screen is complete.'
          : error.message || 'Google authentication failed';
        toast.error('Google sign-in failed', { description: msg });
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background p-6 overflow-y-auto">
      {/* Animated background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="relative z-10 w-full max-w-md p-8 glass border-primary/30 shadow-[0_0_60px_rgba(0,217,255,0.2)]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">
            NovAura AI OS
          </h1>
          <p className="text-muted-foreground">Sign in to access your workspace</p>

        {/* Cinematic intro */}
        <div className="mb-6 rounded-xl overflow-hidden border border-white/10">
          <video
            src={import.meta.env.VITE_CINEMATIC_CLIP_URL || '/assets/cinematic-intro.mp4'}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-54 object-cover"
          />
        </div>

                </div>

        {/* Auth Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* Login Form */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="pl-10 bg-window-bg border-primary/20"
                    required
                    data-testid="login-email-input"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="pl-10 bg-window-bg border-primary/20"
                    required
                    data-testid="login-password-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(0,217,255,0.3)]"
                data-testid="login-submit-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Signup Form */}
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4" data-testid="signup-form">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Name
                </label>              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="username"
                    className="pl-10 mt-1 bg-window-bg border-primary/20"
                    required
                    data-testid="signup-username-input"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Backup Email (optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={formData.backupEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, backupEmail: e.target.value }))}
                    placeholder="backup@example.com"
                    className="pl-10 mt-1 bg-window-bg border-primary/20"
                    data-testid="signup-backup-email-input"
                  />
                </div>
              </div>


                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your name"
                    className="pl-10 bg-window-bg border-primary/20"
                    required
                    data-testid="signup-name-input"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="pl-10 bg-window-bg border-primary/20"
                    required
                    data-testid="signup-email-input"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="pl-10 bg-window-bg border-primary/20"
                    required
                    minLength={6}
                    data-testid="signup-password-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(0,217,255,0.3)]"
                data-testid="signup-submit-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sign Up
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        {/* Google Auth */}
        <Button
          onClick={handleGoogleAuth}
          disabled={isLoading}
          variant="outline"
          className="w-full border-primary/30 hover:bg-primary/10"
        >
          <Chrome className="w-4 h-4 mr-2" />
          Google
        </Button>

        {/* Dev bypass */}
        {import.meta.env.DEV && (
          <Button
            onClick={() => {
              const devUser = { name: 'Dillan', email: 'dev@novaura.life', id: 'dev-1' };
              kernelStorage.setItem('auth_token', 'dev-token');
              kernelStorage.setItem('user_data', JSON.stringify(devUser));
              onAuthComplete(devUser);
            }}
            variant="ghost"
            className="w-full mt-4 text-muted-foreground hover:text-primary text-xs"
          >
            Skip Login (Dev Mode)
          </Button>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </Card>
    </div>
  );
}
