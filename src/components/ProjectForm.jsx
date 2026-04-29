import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'hackathon', label: 'Хакатон' },
  { value: 'startup', label: 'Стартап' },
  { value: 'research', label: 'Исследование' },
  { value: 'design', label: 'Дизайн' },
  { value: 'open_source', label: 'Open source' },
  { value: 'course', label: 'Курсовой/дипломный' },
  { value: 'other', label: 'Другое' },
];

export default function ProjectForm({ project, onSave, onCancel }) {
  const [data, setData] = useState(project || {
    title: '', description: '', role: '', category: 'hackathon',
    cover_url: '', github_url: '', demo_url: '', tags: [], date: '', award: '',
  });
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const uploadCover = async (file) => {
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setData(d => ({ ...d, cover_url: file_url }));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!(data.tags || []).includes(t)) setData(d => ({ ...d, tags: [...(d.tags || []), t] }));
    setTagInput('');
  };

  const submit = async () => {
    if (!data.title.trim()) return toast.error('Укажите название');
    setSaving(true);
    if (project?.id) {
      await base44.entities.Project.update(project.id, data);
    } else {
      await base44.entities.Project.create(data);
    }
    toast.success('Проект сохранён');
    setSaving(false);
    onSave?.();
  };

  return (
    <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Название *</label>
        <Input value={data.title} onChange={e => setData(d => ({ ...d, title: e.target.value }))} placeholder="AI-ассистент для врачей" />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Категория</label>
          <Select value={data.category} onValueChange={v => setData(d => ({ ...d, category: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Дата</label>
          <Input type="date" value={data.date || ''} onChange={e => setData(d => ({ ...d, date: e.target.value }))} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Роль в проекте</label>
        <Input value={data.role} onChange={e => setData(d => ({ ...d, role: e.target.value }))} placeholder="Frontend разработчик" />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Описание</label>
        <Textarea rows={4} value={data.description} onChange={e => setData(d => ({ ...d, description: e.target.value }))} placeholder="Что сделали, какие технологии использовали, результат" />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">GitHub</label>
          <Input value={data.github_url} onChange={e => setData(d => ({ ...d, github_url: e.target.value }))} placeholder="https://github.com/..." />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Демо / сайт</label>
          <Input value={data.demo_url} onChange={e => setData(d => ({ ...d, demo_url: e.target.value }))} placeholder="https://..." />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Награда / место</label>
        <Input value={data.award} onChange={e => setData(d => ({ ...d, award: e.target.value }))} placeholder="1 место / Top 10 / Grand Prix" />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Обложка</label>
        {data.cover_url ? (
          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-muted">
            <img src={data.cover_url} alt="" className="w-full h-full object-cover" />
            <button onClick={() => setData(d => ({ ...d, cover_url: '' }))} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 p-6 border border-dashed border-border rounded-xl cursor-pointer hover:border-foreground/30">
            <Upload className="w-4 h-4" /> <span className="text-sm">Загрузить изображение</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => uploadCover(e.target.files?.[0])} />
          </label>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Теги</label>
        <div className="flex gap-2 mb-2">
          <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="React, Figma, Python..." />
          <Button type="button" variant="outline" onClick={addTag} className="rounded-full">Добавить</Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(data.tags || []).map(t => (
            <span key={t} className="px-2.5 py-1 rounded-full bg-secondary text-xs flex items-center gap-1">
              #{t}
              <button onClick={() => setData(d => ({ ...d, tags: d.tags.filter(x => x !== t) }))}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={submit} disabled={saving} className="rounded-full">
          {saving ? 'Сохранение...' : 'Сохранить'}
        </Button>
        <Button variant="ghost" onClick={onCancel} className="rounded-full">Отмена</Button>
      </div>
    </div>
  );
}