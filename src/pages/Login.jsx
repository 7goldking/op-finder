import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Mail, Chrome } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  const after = () => navigate(params.get('from') || '/');

  const handleGoogle = async () => {
    try { await auth.loginWithGoogle(); }
    catch (e) { toast.error(e.message); }
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await auth.loginWithEmail(email, password); after(); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await auth.signUpWithEmail(email, password, fullName); toast.success('Проверь почту для подтверждения'); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleMagic = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await auth.loginWithMagicLink(email); setMagicSent(true); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center gap-3">
          <Logo size={56} />
          <h1 className="text-2xl font-bold">Op Finder</h1>
          <p className="text-muted-foreground text-sm">Войди, чтобы продолжить</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <Button variant="outline" className="w-full h-11 mb-6 gap-2" onClick={handleGoogle}>
            <Chrome className="w-4 h-4" /> Войти через Google
          </Button>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">или</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1">
            {[['login','Вход'],['signup','Регистрация'],['magic','Magic Link']].map(([k,l]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`flex-1 text-sm py-1.5 rounded-lg transition-all font-medium ${tab===k?'bg-background shadow-sm':'text-muted-foreground'}`}>
                {l}
              </button>
            ))}
          </div>
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div><Label>Email</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-1" /></div>
              <div><Label>Пароль</Label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="mt-1" /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading?<Loader2 className="w-4 h-4 animate-spin"/>:'Войти'}</Button>
            </form>
          )}
          {tab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div><Label>Имя</Label><Input value={fullName} onChange={e=>setFullName(e.target.value)} required className="mt-1" /></div>
              <div><Label>Email</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-1" /></div>
              <div><Label>Пароль</Label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} className="mt-1" /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading?<Loader2 className="w-4 h-4 animate-spin"/>:'Зарегистрироваться'}</Button>
            </form>
          )}
          {tab === 'magic' && (magicSent ? (
            <div className="text-center py-4">
              <Mail className="w-10 h-10 mx-auto mb-3 text-primary" />
              <p className="font-medium">Письмо отправлено!</p>
              <p className="text-sm text-muted-foreground mt-1">Проверь <strong>{email}</strong></p>
            </div>
          ) : (
            <form onSubmit={handleMagic} className="space-y-4">
              <div><Label>Email</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-1" /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading?<Loader2 className="w-4 h-4 animate-spin"/>:'Отправить Magic Link'}</Button>
            </form>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
