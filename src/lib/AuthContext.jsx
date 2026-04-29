import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { auth } from '@/api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings] = useState({ public_settings: {} });

  useEffect(() => {
    // Hard safety net: never hang on auth init for more than 5s.
    // If anything (network, stale token, slow Supabase) blocks getSession,
    // we still let the app render as anonymous so the user isn't stuck on a spinner.
    const watchdog = setTimeout(() => {
      setIsLoadingAuth(prev => {
        if (prev) {
          setAuthChecked(true);
          return false;
        }
        return prev;
      });
    }, 5000);
    checkUserAuth().finally(() => clearTimeout(watchdog));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null); setIsAuthenticated(false);
        setIsLoadingAuth(false); setAuthChecked(true);
      } else if (session?.user) {
        await loadProfile(session.user);
      }
    });
    return () => { clearTimeout(watchdog); subscription.unsubscribe(); };
  }, []);

  const withTimeout = (p, ms = 4000) => Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error('auth-timeout')), ms)),
  ]);

  const loadProfile = async (supabaseUser) => {
    try {
      let profile = await withTimeout(auth.me());
      if (!profile) {
        await withTimeout(supabase.from('profiles').upsert({
          id: supabaseUser.id,
          email: supabaseUser.email,
          full_name: supabaseUser.user_metadata?.full_name || '',
          avatar_url: supabaseUser.user_metadata?.avatar_url || '',
        }, { onConflict: 'id' }));
        profile = await withTimeout(auth.me());
      }
      setUser(profile);
      setIsAuthenticated(!!profile);
    } catch (e) {
      // Don't block the app on auth errors — just render as anonymous.
      console.warn('[auth] loadProfile failed:', e?.message);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    try {
      const { data: { session } } = await withTimeout(supabase.auth.getSession());
      if (session?.user) await loadProfile(session.user);
      else { setIsAuthenticated(false); setIsLoadingAuth(false); setAuthChecked(true); }
    } catch (e) {
      console.warn('[auth] getSession failed, rendering as anonymous:', e?.message);
      // Clear potentially corrupt tokens so subsequent requests don't keep hanging.
      try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = async (redirectTo) => {
    setUser(null); setIsAuthenticated(false);
    await auth.logout(redirectTo || '/');
  };

  const navigateToLogin = () => auth.redirectToLogin(window.location.href);

  return (
    <AuthContext.Provider value={{
      user, setUser, isAuthenticated, isLoadingAuth, isLoadingPublicSettings,
      authError, appPublicSettings, authChecked,
      logout, navigateToLogin, checkUserAuth, checkAppState: checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
