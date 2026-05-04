import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Send, Loader2, ExternalLink } from 'lucide-react';

const CATEGORIES = [
  'hackathon', 'olympiad', 'grant', 'scholarship', 'fellowship',
  'internship', 'summer_school', 'competition', 'exchange',
  'mentorship', 'forum', 'conference', 'workshop', 'accelerator',
  'mun', 'volunteering', 'custom',
];

export default function Submit() {
  const { user } = useOutletContext() || {};
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    url: '',
    category: 'custom',
    deadline: '',
    city: '',
    organization_name: '',
  });

  const submit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error(t('submit.login_required'));
      navigate('/login');
      return;
    }
    if (form.title.trim().length < 5) {
      toast.error(t('submit.err_title'));
      return;
    }
    if (!/^https?:\/\//i.test(form.url)) {
      toast.error(t('submit.err_url'));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.rpc('submit_opportunity', {
        p_title: form.title.trim(),
        p_description: form.description.trim(),
        p_url: form.url.trim(),
        p_category: form.category,
        p_deadline: form.deadline || null,
        p_city: form.city.trim() || null,
        p_organization_name: form.organization_name.trim() || null,
      });
      if (error) throw error;
      setDone(true);
      toast.success(t('submit.thanks'));
    } catch (err) {
      toast.error(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">🙏</div>
        <h1 className="text-3xl font-bold mb-2">{t('submit.thanks')}</h1>
        <p className="text-gray-600 mb-8">{t('submit.thanks_desc')}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { setDone(false); setForm({ title: '', description: '', url: '', category: 'custom', deadline: '', city: '', organization_name: '' }); }}>
            {t('submit.add_another')}
          </Button>
          <Button variant="outline" onClick={() => navigate('/catalog')}>
            {t('submit.go_catalog')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t('submit.title')}</h1>
        <p className="text-gray-600">{t('submit.subtitle')}</p>
      </div>

      <form onSubmit={submit} className="space-y-4 bg-white rounded-2xl p-6 border">
        <div>
          <label className="block text-sm font-medium mb-1">{t('submit.f_title')} *</label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={t('submit.f_title_ph')}
            required
            maxLength={250}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('submit.f_url')} *</label>
          <Input
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">{t('submit.f_url_hint')}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('submit.f_desc')}</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={t('submit.f_desc_ph')}
            rows={4}
            maxLength={2000}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('submit.f_category')}</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`category.${c}`) !== `category.${c}` ? t(`category.${c}`) : c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('submit.f_deadline')}</label>
            <Input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('submit.f_city')}</label>
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Алматы / Online"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('submit.f_org')}</label>
            <Input
              value={form.organization_name}
              onChange={(e) => setForm({ ...form, organization_name: e.target.value })}
              placeholder={t('submit.f_org_ph')}
            />
          </div>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {t('submit.send')}
          </Button>
          <span className="text-xs text-gray-500">{t('submit.review_note')}</span>
        </div>
      </form>
    </div>
  );
}
