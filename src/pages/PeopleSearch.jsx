import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { generateUserID } from '@/lib/user-id';
import { i18nExtended } from '@/lib/i18n-extended';
import { useI18n } from '@/lib/i18n';

export default function PeopleSearch() {
  const { user } = useOutletContext() || {};
  const { lang } = useI18n();
  const t = i18nExtended[lang]?.search || i18nExtended.en.search;
  const tFr = i18nExtended[lang]?.friend_requests || i18nExtended.en.friend_requests;

  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ city: '', skill: '', interest: '' });
  const [people, setPeople] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    if (user?.email) {
      const f = user.friends || [];
      setFriends(f);
      loadSentRequests();
    }
  }, [user?.email]);

  const loadSentRequests = async () => {
    try {
      const reqs = await base44.entities.FriendRequest.filter({ from_email: user.email, status: 'pending' });
      setSentRequests(reqs.map(r => r.to_email));
    } catch {}
  };

  const search = async () => {
    if (!searchText.trim()) return;
    setLoading(true);
    try {
      let allUsers = await base44.entities.User.list();
      allUsers = allUsers.filter(u => u.email !== user.email);

      const searchLower = searchText.toLowerCase();
      allUsers = allUsers.filter(u => {
        const matchesName = (u.full_name || '').toLowerCase().includes(searchLower) || 
                           u.email.toLowerCase().includes(searchLower);
        const matchesCity = !filters.city || (u.city || '').toLowerCase() === filters.city.toLowerCase();
        const matchesSkill = !filters.skill || (u.skills || []).some(s => s.toLowerCase().includes(filters.skill.toLowerCase()));
        const matchesInterest = !filters.interest || (u.interests || []).some(i => i.toLowerCase().includes(filters.interest.toLowerCase()));
        
        return matchesName && matchesCity && matchesSkill && matchesInterest;
      });

      setPeople(allUsers);
    } catch {
      toast.error('Search error');
    }
    setLoading(false);
  };

  const sendFriendRequest = async (toEmail) => {
    try {
      const toUser = people.find(p => p.email === toEmail);
      await base44.entities.FriendRequest.create({
        from_email: user.email,
        from_name: user.full_name || user.email,
        to_email: toEmail,
        status: 'pending',
      });
      setSentRequests([...sentRequests, toEmail]);
      toast.success(t.request_sent);
    } catch {
      toast.error('Error sending request');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="font-display text-3xl font-bold mb-8">{t.title}</h1>

      {/* Search & Filters */}
      <div className="space-y-4 mb-8 p-6 rounded-2xl bg-card border border-border">
        <Input
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder={t.placeholder}
          className="h-11 rounded-xl bg-secondary border-transparent text-sm"
        />
        
        <div className="grid grid-cols-3 gap-3">
          <Input
            value={filters.city}
            onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
            placeholder={t.city}
            className="h-10 rounded-lg bg-secondary border-transparent text-sm"
          />
          <Input
            value={filters.skill}
            onChange={e => setFilters(f => ({ ...f, skill: e.target.value }))}
            placeholder={t.skills}
            className="h-10 rounded-lg bg-secondary border-transparent text-sm"
          />
          <Input
            value={filters.interest}
            onChange={e => setFilters(f => ({ ...f, interest: e.target.value }))}
            placeholder={t.interests}
            className="h-10 rounded-lg bg-secondary border-transparent text-sm"
          />
        </div>

        <Button onClick={search} disabled={loading} className="w-full rounded-xl h-11 gap-2">
          <Search className="w-4 h-4" /> {t.title}
        </Button>
      </div>

      {/* Results */}
      {people.length === 0 ? (
        <div className="text-center text-muted-foreground">{t.no_results}</div>
      ) : (
        <div className="grid gap-4">
          {people.map(p => (
            <div key={p.email} className="p-4 rounded-xl border border-border bg-card hover:border-foreground/30 transition-all">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} className="w-12 h-12 rounded-full object-cover shrink-0" alt="" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-semibold shrink-0">
                      {(p.full_name || '?')[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold">{p.full_name}</div>
                    <div className="text-xs text-muted-foreground">{p.city || 'City not specified'}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      ID: {generateUserID(p.email)}
                    </div>
                    {p.skills?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {p.skills.slice(0, 3).map(s => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-secondary">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {friends.includes(p.email) ? (
                  <Button disabled variant="ghost" size="sm" className="rounded-lg gap-1">
                    <Check className="w-3.5 h-3.5" /> Friends
                  </Button>
                ) : sentRequests.includes(p.email) ? (
                  <Button disabled variant="outline" size="sm" className="rounded-lg text-xs">
                    {tFr.pending}
                  </Button>
                ) : (
                  <Button onClick={() => sendFriendRequest(p.email)} size="sm" className="rounded-lg gap-1">
                    <Plus className="w-3.5 h-3.5" /> {t.send_request}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}