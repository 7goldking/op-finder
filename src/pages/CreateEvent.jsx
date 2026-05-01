import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, Sparkles, Loader2 } from 'lucide-react';
import { CATEGORIES, FORMATS, LEVELS } from '@/lib/categories';
import { toast } from 'sonner';

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user } = useOutletContext() || {};
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState({
    title: '', short_description: '', description: '', category: '', format: 'online',
    city: '', language: 'ru', level: [], cover_url: '', requirements: '',
    application_deadline: '', event_start: '', event_end: '', tags: [],
  });
  const [tagDraft, setTagDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    if (isEdit) {
      base44.entities.Event.filter({ id }).then(list => {
        if (list[0]) setForm({ ...form, ...list[0] });
      });
    }
  }, [id]);

  const uploadCover = async (file) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (!file_url) throw new Error('Пустой URL после загрузки');
      setForm(f => ({ ...f, cover_url: file_url }));
      toast.success('Обложка загружена');
    } catch (e) {
      console.error('Cover upload error:', e);
      toast.error('Ошибка загрузки: ' + (e?.message || 'попробуй другое фото'));
    } finally {
      setUploadingCover(false);
    }
  };

  const aiFill = async () => {
    if (!form.title) { toast.error('Сначала введи название'); return; }
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Ты помогаешь организации создать карточку события на платформе OpportunityHub.
Название: "${form.title}"
Категория: ${form.category || 'не указана'}
Формат: ${form.format}

Сгенерируй короткое описание (1-2 предложения) и полное описание (3-5 абзацев, живой текст, русский язык). Также предложи 5 релевантных тегов и список требований к участникам (3-5 пунктов).`,
      response_json_schema: {
        type: 'object',
        properties: {
          short_description: { type: 'string' },
          description: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          requirements: { type: 'string' },
        },
      },
    });
    setForm(f => ({ ...f, ...res }));
    setAiLoading(false);
    toast.success('Поля заполнены ИИ');
  };

  const save = async (status = 'published') => {
    if (!form.title || !form.category) {
      toast.error('Заполни название и категорию'); return;
    }
    setSaving(true);
    try {
      let org_name = form.organization_name;
      if (!org_name && user?.organization_id) {
        const orgs = await base44.entities.Organization.filter({ id: user.organization_id });
        org_name = orgs[0]?.name || '';
      }
      const payload = {
        ...form,
        status,
        organization_id: user?.organization_id,
        organization_name: org_name,
      };
      if (isEdit) await base44.entities.Event.update(id, payload);
      else await base44.entities.Event.create(payload);
      toast.success(status === 'published' ? 'Событие опубликовано' : 'Черновик сохранён');
      navigate('/org');
    } catch (e) {
      toast.error('Ошибка сохранения: ' + (e.message || 'попробуй ещё'));
    }
    setSaving(false);
  };

  const addTag = () => {
    const v = tagDraft.trim();
    if (!v) return;
    setForm(f => ({ ...f, tags: Array.from(new Set([...(f.tags || []), v])) }));
    setTagDraft('');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <button onClick={() => navigate('/org')} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> К панели
      </button>

      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <h1 className="font-display text-3xl md:text-4xl font-semibold">
          {isEdit ? 'Редактировать событие' : 'Новое событие'}
        </h1>
        <Button variant="outline" onClick={aiFill} disabled={aiLoading} className="rounded-full gap-2">
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Заполнить ИИ
        </Button>
      </div>

      <div className="space-y-6">
        {/* Cover */}
        <div>
          <Label className="text-sm font-semibold mb-2 block">Обложка</Label>
          {form.cover_url ? (
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
              <img src={form.cover_url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setForm({ ...form, cover_url: '' })} className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-background/90 text-xs">Удалить</button>
            </div>
          ) : (
            <label className={`flex items-center justify-center aspect-[16/9] rounded-2xl border border-dashed border-border bg-secondary/30 ${uploadingCover ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:border-foreground/40'}`}>
              <div className="text-center">
                {uploadingCover ? <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" /> : <Upload className="w-5 h-5 mx-auto mb-2" />}
                <div className="text-sm">{uploadingCover ? 'Загружается…' : 'Загрузить обложку'}</div>
                <div className="text-[10px] text-muted-foreground mt-1">JPG/PNG, до 25 МБ</div>
              </div>
              <input
                type="file"
                accept="image/*"
                disabled={uploadingCover}
                className="hidden"
                onChange={e => { uploadCover(e.target.files?.[0]); e.target.value = ''; }}
              />
            </label>
          )}
        </div>

        <Field label="Название *">
          <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-12 rounded-xl bg-secondary border-transparent" />
        </Field>

        <Field label="Краткое описание">
          <Textarea rows={2} value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} className="rounded-xl bg-secondary border-transparent" />
        </Field>

        <Field label="Полное описание">
          <Textarea rows={6} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl bg-secondary border-transparent" />
        </Field>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Категория *">
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger className="h-12 rounded-xl bg-secondary border-transparent"><SelectValue placeholder="Выбери" /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}</SelectContent>
            </Select>
            {form.category === 'custom' && (
              <Input
                value={form.category_custom || ''}
                onChange={e => setForm({ ...form, category_custom: e.target.value })}
                placeholder="Укажи свою категорию"
                className="mt-2 h-11 rounded-xl bg-secondary border-transparent"
              />
            )}
          </Field>
          <Field label="Формат">
            <Select value={form.format} onValueChange={v => setForm({ ...form, format: v })}>
              <SelectTrigger className="h-12 rounded-xl bg-secondary border-transparent"><SelectValue /></SelectTrigger>
              <SelectContent>{FORMATS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Город">
            <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="h-12 rounded-xl bg-secondary border-transparent" />
          </Field>
          <Field label="Язык">
            <Select value={form.language} onValueChange={v => setForm({ ...form, language: v })}>
              <SelectTrigger className="h-12 rounded-xl bg-secondary border-transparent"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="multi">Мультиязычное</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Уровень участников">
          <div className="flex flex-wrap gap-2">
            {LEVELS.map(l => {
              const active = form.level.includes(l.value);
              return (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setForm(f => ({
                    ...f, level: active ? f.level.filter(x => x !== l.value) : [...f.level, l.value],
                  }))}
                  className={`px-4 py-2 rounded-full border text-sm ${active ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Дедлайн подачи">
            <Input type="date" value={form.application_deadline?.split('T')[0] || ''} onChange={e => setForm({ ...form, application_deadline: e.target.value ? new Date(e.target.value).toISOString() : '' })} className="h-12 rounded-xl" />
          </Field>
          <Field label="Начало">
            <Input type="date" value={form.event_start?.split('T')[0] || ''} onChange={e => setForm({ ...form, event_start: e.target.value ? new Date(e.target.value).toISOString() : '' })} className="h-12 rounded-xl" />
          </Field>
          <Field label="Окончание">
            <Input type="date" value={form.event_end?.split('T')[0] || ''} onChange={e => setForm({ ...form, event_end: e.target.value ? new Date(e.target.value).toISOString() : '' })} className="h-12 rounded-xl" />
          </Field>
        </div>

        <Field label="Теги">
          <div className="flex flex-wrap gap-2 mb-2">
            {(form.tags || []).map(t => (
              <span key={t} className="px-3 py-1 rounded-full bg-secondary text-sm inline-flex items-center gap-1.5">
                {t}
                <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}>×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={tagDraft} onChange={e => setTagDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="AI, startup..." className="h-11 rounded-xl bg-secondary border-transparent" />
            <Button variant="outline" onClick={addTag} className="rounded-xl h-11">Добавить</Button>
          </div>
        </Field>

        <Field label="Требования к участникам">
          <Textarea rows={4} value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} className="rounded-xl bg-secondary border-transparent" />
        </Field>

        <div className="flex gap-3 pt-4">
          <Button onClick={() => save('published')} disabled={saving} className="flex-1 h-12 rounded-full">
            {saving ? 'Публикуем...' : 'Опубликовать'}
          </Button>
          <Button variant="outline" onClick={() => save('draft')} disabled={saving} className="h-12 rounded-full">Черновик</Button>
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