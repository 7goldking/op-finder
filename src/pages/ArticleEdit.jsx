import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'career', label: 'Карьера' },
  { value: 'education', label: 'Обучение' },
  { value: 'hackathons', label: 'Хакатоны' },
  { value: 'internships', label: 'Стажировки' },
  { value: 'soft_skills', label: 'Soft skills' },
  { value: 'tech', label: 'Технологии' },
  { value: 'other', label: 'Разное' },
];

function estimateReadTime(content) {
  const words = (content || '').trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export default function ArticleEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useOutletContext() || {};
  const [form, setForm] = useState({
    title: '', cover_url: '', excerpt: '', content: '',
    category: 'career', tags: [], status: 'published',
  });
  const [tagDraft, setTagDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      base44.entities.Article.filter({ id }).then(list => {
        const a = list[0];
        if (a) setForm(f => ({ ...f, ...a }));
      });
    }
  }, [id]);

  const upload = async (file) => {
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, cover_url: file_url }));
  };

  const addTag = () => {
    const v = tagDraft.trim();
    if (!v) return;
    setForm(f => ({ ...f, tags: Array.from(new Set([...(f.tags || []), v])) }));
    setTagDraft('');
  };

  const save = async (status) => {
    if (!form.title || !form.content) { toast.error('Заголовок и текст обязательны'); return; }
    setSaving(true);
    const authorType = user?.role === 'admin' ? 'admin' : user?.account_type === 'organization' ? 'organization' : 'expert';
    const data = {
      ...form,
      status,
      read_time_min: estimateReadTime(form.content),
      author_name: form.author_name || user?.full_name || 'Автор',
      author_email: form.author_email || user?.email || '',
      author_type: form.author_type || authorType,
      author_avatar_url: form.author_avatar_url || user?.avatar_url || '',
    };
    const saved = id
      ? await base44.entities.Article.update(id, data)
      : await base44.entities.Article.create(data);
    setSaving(false);
    toast.success(status === 'draft' ? 'Черновик сохранён' : 'Статья опубликована');
    navigate(`/blog/${saved.id || id}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <h1 className="font-display text-3xl font-semibold mb-8">{id ? 'Редактировать статью' : 'Новая статья'}</h1>

      <div className="space-y-5">
        <Field label="Заголовок *">
          <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-12 rounded-xl bg-secondary border-transparent" />
        </Field>

        <Field label="Обложка">
          {form.cover_url ? (
            <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-muted">
              <img src={form.cover_url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setForm({ ...form, cover_url: '' })} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-foreground/30 text-sm text-muted-foreground">
              <Upload className="w-4 h-4" /> Загрузить обложку
              <input type="file" accept="image/*" className="hidden" onChange={e => upload(e.target.files?.[0])} />
            </label>
          )}
        </Field>

        <Field label="Краткое описание">
          <Textarea rows={2} value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} placeholder="Превью на карточке" className="rounded-xl bg-secondary border-transparent" />
        </Field>

        <Field label="Категория">
          <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
            <SelectTrigger className="h-12 rounded-xl bg-secondary border-transparent"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>

        <Field label="Теги">
          <div className="flex flex-wrap gap-2 mb-2">
            {(form.tags || []).map(t => (
              <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm">
                {t}
                <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={tagDraft} onChange={e => setTagDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="career, python..." className="h-11 rounded-xl bg-secondary border-transparent" />
            <Button variant="outline" onClick={addTag} className="rounded-xl h-11">Добавить</Button>
          </div>
        </Field>

        <Field label="Текст (поддерживается Markdown) *">
          <Textarea rows={16} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="rounded-xl bg-secondary border-transparent font-mono text-sm" placeholder="# Заголовок&#10;&#10;Текст статьи..." />
          <div className="text-xs text-muted-foreground">~{estimateReadTime(form.content)} мин чтения</div>
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full">Отмена</Button>
          <Button variant="outline" onClick={() => save('draft')} disabled={saving} className="rounded-full">В черновик</Button>
          <Button onClick={() => save('published')} disabled={saving} className="rounded-full h-12 px-6">{saving ? 'Сохраняем...' : 'Опубликовать'}</Button>
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