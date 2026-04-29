import React, { useState } from 'react';
import { Send, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '';
// When VITE_TELEGRAM_BOT_USERNAME is unset, the Telegram section is hidden.

function makeToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '');
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export default function TelegramConnect({ user, setUser }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  if (!TELEGRAM_BOT_USERNAME) return null;

  const isConnected = !!user?.telegram_chat_id;

  const connect = async () => {
    setBusy(true);
    try {
      const token = makeToken();
      await base44.auth.updateMe({
        telegram_link_token: token,
        telegram_subscribed: true,
      });
      const link = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${token}`;
      // Refresh user
      const u = await base44.auth.me();
      setUser?.(u);
      window.open(link, '_blank', 'noopener,noreferrer');
      toast.success('Открой Telegram и нажми Start, чтобы привязать аккаунт');
    } catch (e) {
      toast.error('Не удалось создать ссылку');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (v) => {
    setBusy(true);
    try {
      await base44.auth.updateMe({ telegram_subscribed: v });
      const u = await base44.auth.me();
      setUser?.(u);
    } finally { setBusy(false); }
  };

  return (
    <div className="p-5 rounded-2xl border border-border bg-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3 min-w-0">
          <Send className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="font-medium flex items-center gap-2 flex-wrap">
              {t('settings.telegram')}
              {isConnected && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> {t('settings.telegram_connected')}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{t('settings.telegram_desc')}</div>
          </div>
        </div>
        {isConnected ? (
          <Switch
            checked={!!user?.telegram_subscribed}
            onCheckedChange={toggle}
            disabled={busy}
          />
        ) : (
          <Button onClick={connect} disabled={busy} variant="outline" className="rounded-full gap-2 shrink-0">
            <ExternalLink className="w-4 h-4" />
            {t('settings.telegram_connect')}
          </Button>
        )}
      </div>
    </div>
  );
}
