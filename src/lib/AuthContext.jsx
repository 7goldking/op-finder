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
    checkUserAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null); setIsAuthenticated(false);
        setIsLoadingAuth(false); setAuthChecked(true);
      } else if (session?.user) {
        await loadProfile(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (supabaseUser) => {
    try {
      let profile = await auth.me();
      if (!profile) {
        await supabase.from('profiles').upsert({
          id: supabaseUser.id,
          email: supabaseUser.email,
          full_name: supabaseUser.user_metadata?.full_name || '',
          avatar_url: supabaseUser.user_metadata?.avatar_url || '',
        }, { onConflict: 'id' });
        profile = await auth.me();
      }
      setUser(profile);
      setIsAuthenticated(true);
    } catch (e) {
      setAuthError({ type: 'unknown', message: e.message });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await loadProfile(session.user);
      else { setIsAuthenticated(false); setIsLoadingAuth(false); setAuthChecked(true); }
    } catch { setIsLoadingAuth(false); setAuthChecked(true); }
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
