import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Copy, Gift, Share2, Users } from 'lucide-react';
import { toast } from 'sonner';

const BADGES = [
  { threshold: 1, icon: '🌱', label: 'Первый друг' },
  { threshold: 3, icon: '🔥', label: 'Амбассадор' },
  { threshold: 5, icon: '⭐', label: 'Звезда' },
  { threshold: 10, icon: '👑', label: 'Легенда' },
];

function generateCode(email) {
  const base = (email || 'user').split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
  return base.slice(0, 8) + Math.random().toString(36).slice(2, 6);
}

export default function ReferralCard({ user }) {
  const [count, setCount] = useState(0);
  const [code, setCode] = useState(user?.referral_code || '');

  useEffect(() => {
    if (!user?.email) return;
    // Ensure code exists
    if (!user.referral_code) {
      const newCode = generateCode(user.email);
      base44.auth.updateMe({ referral_code: newCode }).then(() => setCode(newCode));
    } else {
      setCode(user.referral_code);
    }
    base44.entities.Referral.filter({ referrer_email: user.email }).then(list => {
      const signed = list.filter(r => r.status !== 'pending').length;
      setCount(signed);
    }).catch(() => {});
  }, [user]);

  const link = `${window.location.origin}/?ref=${code}`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    toast.success('Ссылка скопирована');
  };

  const share = async () => {
    if (navigator.share) {
      navigator.share({ title: 'Opfinder', text: 'Находи крутые возможности вместе со мной', url: link }).catch(() => {});
    } else copy();
  };

  const currentBadge = [...BADGES].reverse().find(b => count >= b.threshold);
  const nextBadge = BADGES.find(b => count < b.threshold);

  return (
    <div className="p-6 rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Gift className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold">Приглашай друзей</h3>
          <p className="text-xs text-muted-foreground">Открывай бейджи и помогай другим</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-secondary">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Users className="w-3 h-3" /> Приглашено</div>
          <div className="font-display text-3xl font-semibold mt-1">{count}</div>
        </div>
        <div className="p-4 rounded-xl bg-secondary">
          <div className="text-xs text-muted-foreground">Статус</div>
          <div className="font-display text-lg font-semibold mt-1 flex items-center gap-1.5">
            {currentBadge ? <>{currentBadge.icon} {currentBadge.label}</> : <span className="text-muted-foreground">Новичок</span>}
          </div>
        </div>
      </div>

      {nextBadge && (
        <div className="mt-3 text-xs text-muted-foreground">
          До бейджа <span className="font-medium text-foreground">{nextBadge.icon} {nextBadge.label}</span> осталось пригласить {nextBadge.threshold - count}
        </div>
      )}

      <div className="mt-5 p-3 rounded-xl bg-secondary font-mono text-xs break-all">
        {link}
      </div>

      <div className="mt-3 flex gap-2">
        <Button onClick={copy} variant="outline" className="rounded-full flex-1 gap-2"><Copy className="w-4 h-4" /> Копировать</Button>
        <Button onClick={share} className="rounded-full flex-1 gap-2"><Share2 className="w-4 h-4" /> Поделиться</Button>
      </div>

      <div className="mt-5 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground mb-2">Все бейджи</div>
        <div className="flex flex-wrap gap-2">
          {BADGES.map(b => {
            const unlocked = count >= b.threshold;
            return (
              <div key={b.threshold} className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 ${unlocked ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                <span className={unlocked ? '' : 'grayscale opacity-50'}>{b.icon}</span>
                {b.label}
                {!unlocked && <span className="opacity-60">· {b.threshold}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}