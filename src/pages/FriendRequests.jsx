import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Check, X, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { i18nExtended } from '@/lib/i18n-extended';
import { useI18n } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FriendRequests() {
  const { user } = useOutletContext() || {};
  const { lang } = useI18n();
  const t = i18nExtended[lang]?.friend_requests || i18nExtended.en.friend_requests;

  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) loadRequests();
  }, [user?.email]);

  const loadRequests = async () => {
    try {
      const incomingReqs = await base44.entities.FriendRequest.filter({ to_email: user.email, status: 'pending' });
      const sentReqs = await base44.entities.FriendRequest.filter({ from_email: user.email, status: 'pending' });
      setIncoming(incomingReqs);
      setSent(sentReqs);
    } catch {}
    setLoading(false);
  };

  const acceptRequest = async (req) => {
    try {
      const newFriends = [...(user.friends || []), req.from_email];
      await base44.auth.updateMe({ friends: newFriends });
      await base44.entities.FriendRequest.update(req.id, { status: 'accepted' });
      await loadRequests();
      toast.success('Friend added');
    } catch {
      toast.error('Error');
    }
  };

  const rejectRequest = async (req) => {
    try {
      await base44.entities.FriendRequest.update(req.id, { status: 'rejected' });
      await loadRequests();
      toast.success('Request rejected');
    } catch {
      toast.error('Error');
    }
  };

  const cancelRequest = async (req) => {
    try {
      await base44.entities.FriendRequest.delete(req.id);
      await loadRequests();
      toast.success('Request cancelled');
    } catch {
      toast.error('Error');
    }
  };

  if (loading) return <div className="p-10 text-center">{lang === 'ru' ? 'Загрузка...' : 'Loading...'}</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="font-display text-3xl font-bold mb-8 flex items-center gap-3">
        <UserPlus className="w-8 h-8" /> {t.title}
      </h1>

      <Tabs defaultValue="incoming" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="incoming" className="rounded-lg">{t.pending}</TabsTrigger>
          <TabsTrigger value="sent" className="rounded-lg">{t.sent}</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-3">
          {incoming.length === 0 ? (
            <div className="text-center text-muted-foreground p-10">{t.no_requests}</div>
          ) : (
            incoming.map(req => (
              <div key={req.id} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                <div>
                  <div className="font-semibold">{req.from_name}</div>
                  <div className="text-sm text-muted-foreground">{req.from_email}</div>
                  {req.message && <div className="text-sm mt-2 text-foreground">{req.message}</div>}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => acceptRequest(req)} size="sm" className="rounded-lg gap-1">
                    <Check className="w-3.5 h-3.5" /> {t.accept}
                  </Button>
                  <Button onClick={() => rejectRequest(req)} variant="outline" size="sm" className="rounded-lg gap-1">
                    <X className="w-3.5 h-3.5" /> {t.reject}
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-3">
          {sent.length === 0 ? (
            <div className="text-center text-muted-foreground p-10">{t.no_requests}</div>
          ) : (
            sent.map(req => (
              <div key={req.id} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                <div>
                  <div className="font-semibold">{req.to_email}</div>
                  <div className="text-sm text-muted-foreground">{t.pending}</div>
                </div>
                <Button onClick={() => cancelRequest(req)} variant="outline" size="sm" className="rounded-lg">
                  {t.cancel}
                </Button>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}