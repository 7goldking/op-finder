import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Upload, X, Plus } from 'lucide-react';
import SocialLinksEditor from '@/components/SocialLinksEditor';
import { toast } from 'sonner';

export default function MentorEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useOutletContext() || {};
  const [form, setForm] = useState({
    name: '', headline: '', bio: '', avatar_url: '', expertise: [], languages: [],
    years_experience: 0, price_per_session: 0, session_format: 'online',
    linkedin_url: '', telegram: '', accepting_requests: true,
    social_links: [], services: [],
  });
  const [tagDraft, setTagDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [serviceDraft, setServiceDraft] = useState({ title: '', description: '', price: '' });

  useEffect(() => {
    if (!user) return;
    if (id) {
      base44.entities.Mentor.filter({ id }).then(list => {
        const m = list[0];
        if (m) setForm(f => ({ ...f, ...m }));
      });
    } else {
      setForm(f => ({ ...f, name: user.full_name || '', avatar_url: user.avatar_url || '' }));
    }
  }, [id, user]);

  const upload = async (file) => {
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, avatar_url: file_url }));
  };

  const addTag = () => {
    const v = tagDraft.trim();
    if (!v) return;
    setForm(f => ({ ...f, expertise: Array.from(new Set([...(f.expertise || []), v])) }));
    setTagDraft('');
  };

  const save = async () => {
    if (!form.name || !form.headline) { toast.error('Имя и описание обязательны'); return; }
    setSaving(true);
    const data = { ...form, user_email: user.email };
    const saved = id
      ? await base44.entities.Mentor.update(id, data)
      : await base44.entities.Mentor.create(data);
    setSaving(false);
    toast.success('Сохранено');
    navigate(`/mentors/${saved.id || id}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <h1 className="font-display text-3xl font-semibold mb-8">{id ? 'Редактировать профиль ментора' : 'Стать ментором'}</h1>

      <div className="space-y-5">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-2xl font-semibold">
            {form.avatar_url ? <img src={form.avatar_url} alt="" className="w-full h-full object-cover" /> : (form.name || '?')[0].toUpperCase()}
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border cursor-pointer hover:border-foreground/30 text-sm">
            <Upload className="w-4 h-4" /> Фото
            <input type="file" accept="image/*" className="hidden" onChange={e => upload(e.target.files?.[0])} />
          </label>
        </div>

        <Field label="Имя *"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-12 rounded-xl bg-secondary border-transparent" /></Field>
        <Field label="Короткое описание *"><Input value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} placeholder="Senior Product Designer · 8 лет опыта" className="h-12 rounded-xl bg-secondary border-transparent" /></Field>
        <Field label="О себе"><Textarea rows={4} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="rounded-xl bg-secondary border-transparent" placeholder="Расскажи про опыт, что готов дать менти" /></Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Лет опыта"><Input type="number" value={form.years_experience} onChange={e => setForm({ ...form, years_experience: Number(e.target.value) })} className="h-12 rounded-xl bg-secondary border-transparent" /></Field>
          <Field label="Цена за сессию (₽, 0 = бесплатно)"><Input type="number" value={form.price_per_session} onChange={e => setForm({ ...form, price_per_session: Number(e.target.value) })} className="h-12 rounded-xl bg-secondary border-transparent" /></Field>
        </div>

        <Field label="Формат сессий">
          <Select value={form.session_format} onValueChange={v => setForm({ ...form, session_format: v })}>
            <SelectTrigger className="h-12 rounded-xl bg-secondary border-transparent"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="online">Онлайн</SelectItem>
              <SelectItem value="offline">Очно</SelectItem>
              <SelectItem value="hybrid">Гибрид</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Экспертиза">
          <div className="flex flex-wrap gap-2 mb-2">
            {(form.expertise || []).map(t => (
              <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm">
                {t}
                <button onClick={() => setForm(f => ({ ...f, expertise: f.expertise.filter(x => x !== t) }))}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={tagDraft} onChange={e => setTagDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Product, UX, Python..." className="h-11 rounded-xl bg-secondary border-transparent" />
            <Button variant="outline" onClick={addTag} className="rounded-xl h-11">Добавить</Button>
          </div>
        </Field>

        <Field label="Услуги / форматы работы">
          <div className="space-y-3">
            {(form.services || []).map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{s.title}</div>
                  {s.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.description}</div>}
                  {s.price && <div className="text-xs font-semibold mt-1">{s.price}</div>}
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, services: f.services.filter((_, idx) => idx !== i) }))}
                  className="shrink-0 p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="p-4 rounded-xl border border-dashed border-border space-y-2">
              <Input
                value={serviceDraft.title}
                onChange={e => setServiceDraft(d => ({ ...d, title: e.target.value }))}
                placeholder="Название услуги (напр. Карьерная консультация)"
                className="h-10 rounded-xl bg-secondary border-transparent text-sm"
              />
              <Input
                value={serviceDraft.description}
                onChange={e => setServiceDraft(d => ({ ...d, description: e.target.value }))}
                placeholder="Описание (необязательно)"
                className="h-10 rounded-xl bg-secondary border-transparent text-sm"
              />
              <div className="flex gap-2">
                <Input
                  value={serviceDraft.price}
                  onChange={e => setServiceDraft(d => ({ ...d, price: e.target.value }))}
                  placeholder="Цена (напр. 5000 ₸ / бесплатно)"
                  className="h-10 rounded-xl bg-secondary border-transparent text-sm"
                />
                <Button
                  variant="outline"
                  className="rounded-xl h-10 gap-1 shrink-0"
                  onClick={() => {
                    if (!serviceDraft.title.trim()) return;
                    setForm(f => ({ ...f, services: [...(f.services || []), { ...serviceDraft }] }));
                    setServiceDraft({ title: '', description: '', price: '' });
                  }}
                >
                  <Plus className="w-4 h-4" /> Добавить
                </Button>
              </div>
            </div>
          </div>
        </Field>

        <Field label="Соцсети и ссылки">
          <SocialLinksEditor
            links={form.social_links}
            onChange={links => setForm({ ...form, social_links: links })}
          />
        </Field>

        <div className="flex items-center justify-between p-4 rounded-xl border border-border">
          <div>
            <div className="font-medium text-sm">Принимаю заявки</div>
            <div className="text-xs text-muted-foreground">Студенты смогут подавать заявки на сессии</div>
          </div>
          <Switch checked={form.accepting_requests} onCheckedChange={v => setForm({ ...form, accepting_requests: v })} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full">Отмена</Button>
          <Button onClick={save} disabled={saving} className="rounded-full h-12 px-6">{saving ? 'Сохраняем...' : 'Сохранить'}</Button>
        </div>

        {id && (
          <div className="pt-8 border-t border-border">
            <h3 className="text-sm font-semibold text-destructive mb-2">Удалить профиль</h3>
            <p className="text-xs text-muted-foreground mb-4">Это действие невозможно отменить</p>
            <Button
              variant="outline"
              className="rounded-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={async () => {
                if (!window.confirm('Вы уверены? Профиль ментора будет удалён')) return;
                try {
                  await base44.entities.Mentor.delete(id);
                  toast.success('Профиль удалён');
                  navigate('/mentors');
                } catch (e) {
                  console.error('Delete error:', e);
                  toast.error('Ошибка удаления');
                }
              }}
            >
              <X className="w-4 h-4" /> Удалить профиль
            </Button>
          </div>
        )}
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