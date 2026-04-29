import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Users, Mail, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function FriendsCard({ user }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [invited, setInvited] = useState([]);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.Referral.filter({ referrer_email: user.email })
      .then(list => setInvited(list))
      .catch(() => {});
  }, [user]);

  const invite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      toast.error('Введи корректный email');
      return;
    }
    if (trimmed === user.email) {
      toast.error('Нельзя пригласить себя');
      return;
    }
    if (invited.find(r => r.referred_email === trimmed)) {
      toast.error('Этот человек уже приглашён');
      return;
    }
    setSending(true);
    try {
      await base44.entities.Referral.create({
        referrer_email: user.email,
        referred_email: trimmed,
        code: '',
        status: 'pending',
      });
      await base44.integrations.Core.SendEmail({
        to: trimmed,
        subject: `${user.full_name || 'Твой друг'} приглашает тебя в Opfinder`,
        body: `Привет!\n\n${user.full_name || 'Твой знакомый'} приглашает тебя на платформу Opfinder — место, где студенты находят хакатоны, гранты, стажировки и многое другое.\n\nПерейди по ссылке и зарегистрируйся:\n${window.location.origin}\n\nДо встречи на платформе!`,
      });
      const list = await base44.entities.Referral.filter({ referrer_email: user.email });
      setInvited(list);
      setEmail('');
      toast.success('Приглашение отправлено!');
    } catch {
      toast.error('Не удалось отправить приглашение');
    } finally {
      setSending(false);
    }
  };

  const accepted = invited.filter(r => r.status !== 'pending').length;

  return (
    <div className="p-6 rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold">Пригласи друзей</h3>
          <p className="text-xs text-muted-foreground">Отправь приглашение прямо на email</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        <Input
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && invite()}
          placeholder="email@example.com"
          className="h-11 rounded-xl bg-secondary border-transparent"
        />
        <Button onClick={invite} disabled={sending} className="rounded-xl h-11 px-4 gap-2 shrink-0">
          <UserPlus className="w-4 h-4" />
          {sending ? '...' : 'Пригласить'}
        </Button>
      </div>

      {invited.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground mb-2">
            Приглашено: {invited.length} · Присоединились: {accepted}
          </div>
          {invited.map(r => (
            <div key={r.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-secondary text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{r.referred_email}</span>
              </div>
              {r.status !== 'pending' ? (
                <span className="flex items-center gap-1 text-xs text-success shrink-0">
                  <Check className="w-3 h-3" /> Зарегистрирован
                </span>
              ) : (
                <span className="text-xs text-muted-foreground shrink-0">Ожидает</span>
              )}
            </div>
          ))}
        </div>
      )}

      {invited.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Ещё никого не приглашено. Введи email выше!
        </p>
      )}
    </div>
  );
}