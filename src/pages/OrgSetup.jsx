import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Briefcase } from 'lucide-react';

export default function OrgSetup() {
  const navigate = useNavigate();
  const { user, setUser } = useOutletContext() || {};
  const [form, setForm] = useState({ name: '', description: '', website: '', city: '', logo_url: '' });
  const [saving, setSaving] = useState(false);

  const uploadLogo = async (file) => {
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, logo_url: file_url }));
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const org = await base44.entities.Organization.create({ ...form, owner_email: user?.email, contact_email: user?.email });
    await base44.auth.updateMe({ account_type: 'organization', organization_id: org.id });
    const u = await base44.auth.me();
    setUser?.(u);
    navigate('/org');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-10">
      <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-6">
        <Briefcase className="w-5 h-5" />
      </div>
      <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">Создай организацию</h1>
      <p className="text-muted-foreground mb-8">Заполни информацию — после можно публиковать события</p>

      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary overflow-hidden flex items-center justify-center">
            {form.logo_url ? <img src={form.logo_url} alt="" className="w-full h-full object-cover" /> : <Briefcase className="w-6 h-6 text-muted-foreground" />}
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border cursor-pointer hover:border-foreground/30 text-sm">
            <Upload className="w-4 h-4" /> Логотип
            <input type="file" accept="image/*" className="hidden" onChange={e => uploadLogo(e.target.files?.[0])} />
          </label>
        </div>

        <div>
          <Label className="text-sm font-semibold">Название *</Label>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-12 rounded-xl bg-secondary border-transparent mt-2" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Описание</Label>
          <Textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl bg-secondary border-transparent mt-2" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold">Сайт</Label>
            <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="h-12 rounded-xl bg-secondary border-transparent mt-2" placeholder="https://..." />
          </div>
          <div>
            <Label className="text-sm font-semibold">Город</Label>
            <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="h-12 rounded-xl bg-secondary border-transparent mt-2" />
          </div>
        </div>

        <Button onClick={submit} disabled={saving || !form.name.trim()} className="w-full h-12 rounded-full">
          {saving ? 'Сохраняем...' : 'Создать организацию'}
        </Button>
      </div>
    </div>
  );
}