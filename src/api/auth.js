import { supabase } from './supabaseClient';

async function loadProfile(user) {
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!data) return null;
  return { id: user.id, email: user.email, ...data };
}

export const auth = {
  async me() {
    const { data: { user } } = await supabase.auth.getUser();
    return loadProfile(user);
  },
  async updateMe(updates) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('profiles')
      .upsert({ id: user.id, ...updates }, { onConflict: 'id' }).select().single();
    if (error) throw error;
    return { id: user.id, email: user.email, ...data };
  },
  async loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  },
  async loginWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signUpWithEmail(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  },
  async loginWithMagicLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email, options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  },
  async logout(redirectTo) {
    await supabase.auth.signOut();
    window.location.href = redirectTo || '/';
  },
  redirectToLogin(from) {
    window.location.href = '/login' + (from ? '?from=' + encodeURIComponent(from) : '');
  },
  onAuthStateChange(cb) { return supabase.auth.onAuthStateChange(cb); },
};
