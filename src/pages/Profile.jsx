import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Check, Award, Trash2, Mail, Users, Plus, Copy } from 'lucide-react';
import { AvatarPicker } from '@/components/ui/avatar-picker';
import { generateUserID } from '@/lib/user-id';
import { Switch } from '@/components/ui/switch';
import SocialLinksEditor from '@/components/SocialLinksEditor';
import TelegramConnect from '@/components/TelegramConnect';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

const EDU_KEYS = ['school', 'bachelor', 'master', 'phd', 'other'];

export default function Profile() {
  const { user, setUser } = useOutletContext() || {};
  const { t } = useI18n();
  const EDU = EDU_KEYS.map(v => ({ value: v, label: t(`edu.${v}`) }));
  const [form, setForm] = useState({
    full_name: '', bio: '', city: '', age: '', education_level: '', education_place: '',
    interests: [], skills: [], goals: '', avatar_url: '', digest_subscribed: true,
    social_links: [], ai_system_prompt: '',
  });
  const [tagDraft, setTagDraft] = useState('');
  const [skillDraft, setSkillDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        bio: user.bio || '',
        city: user.city || '',
        age: user.age || '',
        education_level: user.education_level || '',
        education_place: user.education_place || '',
        interests: user.interests || [],
        skills: user.skills || [],
        goals: user.goals || '',
        avatar_url: user.avatar_url || '',
        digest_subscribed: user.digest_subscribed !== false,
        social_links: user.social_links || [],
        ai_system_prompt: user.ai_system_prompt || '',
      });
      setFriends(user.friends || []);
    }
  }, [user?.id]);



  const removeFriend = async (friendId) => {
    const newFriends = friends.filter(f => f !== friendId);
    try {
      await base44.auth.updateMe({ friends: newFriends });
      const u = await base44.auth.me();
      setUser?.(u);
      setFriends(newFriends);
      toast.success(t('profile.friend_removed'));
    } catch {
      toast.error(t('profile.remove_friend_error'));
    }
  };

  const save = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    const u = await base44.auth.me();
    setUser?.(u);
    setSaving(false);
    toast.success(t('profile.saved'));
  };

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [searchUserId, setSearchUserId] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  const userID = user ? generateUserID(user.email) : '';

  const searchByID = async () => {
    const id = searchUserId.trim().toUpperCase();
    if (!id) return;
    try {
      const users = await base44.entities.User.list();
      const found = users.find(u => generateUserID(u.email) === id);
      if (!found) return toast.error(t('profile.friend_not_found'));
      if (found.email === user?.email) return toast.error(t('profile.cannot_add_yourself'));
      setSearchResult(found);
    } catch {
      toast.error(t('profile.friend_not_found'));
    }
  };

  const addFriendFromSearch = async () => {
    if (!searchResult) return;
    try {
      // Создаём запрос в друзья вместо прямого добавления
      await base44.entities.FriendRequest.create({
        from_email: user.email,
        from_name: user.full_name,
        to_email: searchResult.email,
        status: 'pending',
      });
      setSearchUserId('');
      setSearchResult(null);
      toast.success('Запрос на дружбу отправлен');
    } catch {
      toast.error('Ошибка при отправке запроса');
    }
  };

  const uploadAvatar = async (file) => {
    if (!file) return;

    // 25 MB raw cap (compression brings most photos under 1 MB regardless)
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 25 МБ)');
      return;
    }

    setUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (!file_url) {
        toast.error('Ошибка загрузки: пустой URL');
        setUploadingAvatar(false);
        return;
      }

      // Обновляем форму сразу
      setForm(f => ({ ...f, avatar_url: file_url }));

      // Сохраняем в профиль
      await base44.auth.updateMe({ avatar_url: file_url });

      // Обновляем user в Layout
      const updated = await base44.auth.me();
      setUser?.(updated);
      window.dispatchEvent(new Event('user-updated'));
      toast.success(t('profile.photo_updated'));
    } catch (e) {
      console.error('Upload error:', e);
      toast.error(t('profile.photo_error'));
      // Откатываем форму при ошибке
      setForm(f => ({ ...f, avatar_url: user?.avatar_url || '' }));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const addTag = (type, value) => {
    const v = value.trim();
    if (!v) return;
    setForm(f => ({ ...f, [type]: Array.from(new Set([...(f[type] || []), v])) }));
  };

  const removeTag = (type, value) =>
    setForm(f => ({ ...f, [type]: f[type].filter(x => x !== value) }));

  const setSelectedAvatar = async (svgString) => {
    // Encode SVG properly — encodeURIComponent handles all unicode/special chars
    const dataUrl = `data:image/svg+xml,${encodeURIComponent(svgString)}`;
    setForm(f => ({ ...f, avatar_url: dataUrl }));
    
    // Сохраняем аватар автоматически
    try {
      await base44.auth.updateMe({ avatar_url: dataUrl });
      const updated = await base44.auth.me();
      setUser?.(updated);
      window.dispatchEvent(new Event('user-updated'));
      toast.success('Аватар обновлен');
    } catch (e) {
      console.error('Avatar save error:', e);
      toast.error('Ошибка при сохранении аватара');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-semibold">{t('profile.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('profile.subtitle')}</p>
      </div>

      <Link to="/portfolio" className="inline-flex items-center gap-2 mb-8 p-4 rounded-2xl border border-border hover:border-foreground/30 transition-colors w-full md:w-auto">
        <Award className="w-5 h-5" />
        <div className="flex-1">
          <div className="font-medium">{t('profile.portfolio')}</div>
          <div className="text-xs text-muted-foreground">{t('profile.portfolio_desc')}</div>
        </div>
      </Link>

      <div className="space-y-8">
         {/* User Header with Avatar */}
         <div className="flex items-end gap-4 pb-6 border-b border-border">
           <div className="relative w-32 h-32 rounded-2xl bg-secondary overflow-hidden flex items-center justify-center text-5xl font-semibold shrink-0 border-2 border-primary/20">
             {form.avatar_url ? (
               <img src={form.avatar_url} alt="avatar" className="w-full h-full object-cover" />
             ) : (
               <span className="text-primary">{(user?.full_name || '?')[0].toUpperCase()}</span>
             )}
           </div>
           <div className="flex-1 min-w-0">
             <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{t('profile.full_name')}</Label>
             <Input
               value={form.full_name}
               onChange={e => setForm({ ...form, full_name: e.target.value })}
               placeholder={t('profile.full_name_ph')}
               className="h-11 text-lg font-semibold rounded-xl bg-secondary border-transparent"
             />
             <div className="text-sm text-muted-foreground mt-2 truncate">{user?.email}</div>
           </div>
         </div>

         {/* Avatar Picker */}
         <div>
           <h3 className="text-sm font-semibold mb-4">Выбери аватар</h3>
           <AvatarPicker onAvatarSelect={setSelectedAvatar} />
         </div>
         
         {/* Upload custom photo option */}
         <div className="p-4 rounded-xl border border-border bg-card">
           <label className="flex items-center gap-3 cursor-pointer">
             <input type="file" accept="image/*" className="hidden" disabled={uploadingAvatar} onChange={e => uploadAvatar(e.target.files?.[0])} />
             <div className="flex-1">
               <div className="font-medium">Или загрузи свою фотографию</div>
               <div className="text-xs text-muted-foreground">PNG, JPG до 5 МБ</div>
             </div>
             <Button variant="outline" className="rounded-xl">{uploadingAvatar ? 'Загружаем...' : 'Выбрать'}</Button>
           </label>
         </div>

        {/* Bio */}
        <Field label={t('profile.bio')}>
          <Textarea
            rows={3}
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            placeholder={t('profile.bio_ph')}
            className="rounded-xl bg-secondary border-transparent"
          />
        </Field>

        {/* Basic */}
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={t('profile.city')}>
            <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="h-12 rounded-xl bg-secondary border-transparent" />
          </Field>
          <Field label={t('profile.age')}>
            <Input type="number" value={form.age} onChange={e => setForm({ ...form, age: Number(e.target.value) })} className="h-12 rounded-xl bg-secondary border-transparent" />
          </Field>
          <Field label={t('profile.edu_level')}>
            <Select value={form.education_level} onValueChange={v => setForm({ ...form, education_level: v })}>
              <SelectTrigger className="h-12 rounded-xl bg-secondary border-transparent"><SelectValue placeholder={t('profile.select_ph')} /></SelectTrigger>
              <SelectContent>{EDU.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label={t('profile.edu_place')}>
            <Input value={form.education_place} onChange={e => setForm({ ...form, education_place: e.target.value })} className="h-12 rounded-xl bg-secondary border-transparent" />
          </Field>
        </div>

        {/* Interests */}
        <Field label={t('profile.interests')}>
          <TagEditor
            tags={form.interests}
            draft={tagDraft}
            setDraft={setTagDraft}
            onAdd={v => addTag('interests', v)}
            onRemove={v => removeTag('interests', v)}
            placeholder="AI, дизайн, стартапы..."
            addLabel={t('profile.add')}
          />
        </Field>

        <Field label={t('profile.skills')}>
          <TagEditor
            tags={form.skills}
            draft={skillDraft}
            setDraft={setSkillDraft}
            onAdd={v => addTag('skills', v)}
            onRemove={v => removeTag('skills', v)}
            placeholder="Python, Figma, public speaking..."
            addLabel={t('profile.add')}
          />
        </Field>

        <Field label={t('profile.goals')}>
          <Textarea rows={3} value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} placeholder={t('profile.goals_ph')} className="rounded-xl bg-secondary border-transparent" />
        </Field>

        <Field label="ИИ-ассистент (системный промпт)">
          <Textarea 
            rows={4} 
            value={form.ai_system_prompt} 
            onChange={e => setForm({ ...form, ai_system_prompt: e.target.value })} 
            placeholder="Задай роль и стиль общения ИИ. Пример: 'Ты опытный career coach с 20-летним опытом...'" 
            className="rounded-xl bg-secondary border-transparent text-xs"
          />
          <p className="text-xs text-muted-foreground mt-2">Оставь пусто, чтобы использовать стандартный промпт</p>
        </Field>

        <Field label={t('profile.socials')}>
          <SocialLinksEditor
            links={form.social_links}
            onChange={links => setForm({ ...form, social_links: links })}
          />
        </Field>

        {/* Your ID */}
        <Field label={t('profile.my_id')}>
          <div className="flex gap-2 items-center">
            <div className="flex-1 p-3 rounded-xl bg-secondary font-mono text-sm font-semibold">
              {userID}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl h-11 w-11"
              onClick={() => {
                navigator.clipboard.writeText(userID);
                toast.success('ID скопирован');
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </Field>

        {/* Search friend by ID and send request */}
        <Field label={t('profile.search_friend')}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={searchUserId}
                onChange={e => setSearchUserId(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); searchByID(); }
                }}
                placeholder={t('profile.search_friend_ph')}
                className="h-11 rounded-xl bg-secondary border-transparent"
              />
              <Button onClick={searchByID} className="rounded-xl h-11">{t('profile.search_friend')}</Button>
            </div>
            {searchResult && (
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {searchResult.avatar_url ? (
                      <img src={searchResult.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-semibold">
                        {(searchResult.full_name || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{searchResult.full_name || searchResult.email}</div>
                      <div className="text-xs text-muted-foreground">{searchResult.city || 'Город не указан'}</div>
                    </div>
                  </div>
                  {!friends.includes(searchResult.email) && (
                    <Button onClick={addFriendFromSearch} size="sm" className="rounded-full gap-1">
                      <Plus className="w-3.5 h-3.5" /> {t('profile.send_request')}
                    </Button>
                  )}
                </div>
                {searchResult.bio && <p className="text-sm text-muted-foreground">{searchResult.bio}</p>}
              </div>
            )}
          </div>
        </Field>

        {/* Friends */}
        {friends.length > 0 && (
          <Field label={t('profile.friends')}>
            <div className="flex flex-wrap gap-2">
              {friends.map(f => (
                <span key={f} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-secondary text-sm">
                  <Users className="w-3.5 h-3.5" />
                  {f}
                  <button onClick={() => removeFriend(f)} className="hover:opacity-70">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </Field>
        )}

        {/* Notifications */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t('settings.notifications')}</h3>

          <div className="p-5 rounded-2xl border border-border bg-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">{t('settings.email_digest')}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t('settings.email_digest_desc')}</div>
                </div>
              </div>
              <Switch
                checked={form.digest_subscribed}
                onCheckedChange={v => setForm({ ...form, digest_subscribed: v })}
              />
            </div>
          </div>

          <TelegramConnect user={user} setUser={setUser} />
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving} className="rounded-full h-12 px-6 gap-2">
            {saving ? t('profile.saving') : t('profile.save')} <Check className="w-4 h-4" />
          </Button>
        </div>

        {/* Danger zone */}
        <div className="pt-8 border-t border-border">
          <h3 className="text-sm font-semibold text-destructive mb-2">{t('profile.danger')}</h3>
          <p className="text-xs text-muted-foreground mb-4">{t('profile.danger_desc')}</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="rounded-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" /> {t('profile.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('profile.delete_confirm')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('profile.delete_confirm_desc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">{t('profile.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-full bg-destructive hover:bg-destructive/90"
                  onClick={async () => {
                    await base44.auth.logout('/');
                  }}
                >
                  {t('profile.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      {children}
    </div>
  );
}

function TagEditor({ tags, draft, setDraft, onAdd, onRemove, placeholder, addLabel = 'Добавить' }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm">
            {t}
            <button onClick={() => onRemove(t)} className="hover:opacity-70">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); onAdd(draft); setDraft(''); }
          }}
          placeholder={placeholder}
          className="h-11 rounded-xl bg-secondary border-transparent"
        />
        <Button variant="outline" onClick={() => { onAdd(draft); setDraft(''); }} className="rounded-xl h-11">{addLabel}</Button>
      </div>
    </div>
  );
}