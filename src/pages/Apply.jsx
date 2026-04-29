import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, CheckCircle2, Loader2, FileText, X, Sparkles, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { getOrCreateConversation } from '@/lib/chat';

const DEFAULT_FIELDS = [
  { key: 'motivation', label: 'Почему ты хочешь участвовать?', type: 'textarea', required: true },
  { key: 'experience', label: 'Расскажи о релевантном опыте', type: 'textarea', required: false },
  { key: 'cv_file', label: 'Резюме (PDF / DOC)', type: 'file', required: false },
];

export default function Apply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useOutletContext() || {};
  const { t } = useI18n();
  const [event, setEvent] = useState(null);
  const [answers, setAnswers] = useState({});
  const [uploading, setUploading] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    base44.entities.Event.filter({ id }).then(list => setEvent(list[0]));
  }, [id]);

  const fields = event?.form_fields?.length ? event.form_fields : DEFAULT_FIELDS;

  const update = (key, value) => setAnswers(a => ({ ...a, [key]: value }));

  const handleFile = async (key, file) => {
    if (!file) return;
    setUploading(u => ({ ...u, [key]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update(key, { file_url, filename: file.name });
    setUploading(u => ({ ...u, [key]: false }));
  };

  const aiHelp = async (field) => {
    if (!event) return;
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Ты помогаешь студенту написать сильный, искренний ответ для заявки на событие.
Событие: "${event.title}" (${event.organization_name}).
Описание: ${event.short_description || event.description || ''}
Требования: ${event.requirements || '—'}

Профиль студента:
- Имя: ${user?.full_name || 'не указано'}
- Город: ${user?.city || 'не указан'}
- Образование: ${user?.education_level || 'не указано'}, ${user?.education_place || ''}
- Интересы: ${(user?.interests || []).join(', ') || 'не указаны'}
- Навыки: ${(user?.skills || []).join(', ') || 'не указаны'}
- Цели: ${user?.goals || 'не указаны'}

Задача: напиши черновик ответа на поле "${field.label}". Длина: 4–6 предложений. Тон: живой, конкретный, без штампов. Русский язык. Верни ТОЛЬКО сам текст ответа, без пояснений.`,
    });
    update(field.key, typeof res === 'string' ? res.trim() : res);
    setAiLoading(false);
    toast.success('ИИ сгенерировал черновик — отредактируй под себя');
  };

  const submit = async () => {
    for (const f of fields) {
      if (f.required && !answers[f.key]) {
        toast.error(`Заполните поле: ${f.label}`);
        return;
      }
    }
    setSubmitting(true);
    const answersArr = fields.map(f => {
      const v = answers[f.key];
      if (f.type === 'file' && v?.file_url) {
        return { field_key: f.key, field_label: f.label, value_file_url: v.file_url, value_text: v.filename };
      }
      return { field_key: f.key, field_label: f.label, value_text: typeof v === 'string' ? v : '' };
    });

    await base44.entities.Application.create({
      event_id: event.id,
      event_title: event.title,
      event_organization: event.organization_name,
      event_cover_url: event.cover_url,
      event_deadline: event.application_deadline,
      event_category: event.category,
      user_name: user?.full_name,
      user_email: user?.email,
      user_city: user?.city,
      user_education: user?.education_place,
      answers: answersArr,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    });

    await base44.entities.Event.update(event.id, {
      applications_count: (event.applications_count || 0) + 1,
    }).catch(() => {});

    setSubmitting(false);
    setSubmitted(true);
  };

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-muted-foreground">
        <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin mx-auto mb-4" />
        {t('apply.loading')}
      </div>
    );
  }

  if (submitted) {
    const messageOrg = async () => {
      if (!user || !event?.organization_name) return;
      // Try to find organization by name to get owner email
      const orgs = await base44.entities.Organization.filter({ name: event.organization_name }, '-created_date', 1);
      const ownerEmail = orgs[0]?.owner_email || orgs[0]?.contact_email;
      if (!ownerEmail) {
        toast.error('Контакт организации недоступен');
        return;
      }
      const convo = await getOrCreateConversation(user, {
        email: ownerEmail,
        name: event.organization_name,
      });
      if (convo) navigate(`/chat?c=${convo.id}`);
    };

    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold mb-3">{t('apply.submitted_title')}</h1>
        <p className="text-muted-foreground mb-8">
          {t('apply.submitted_desc')}
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button onClick={() => navigate('/dashboard')} className="rounded-full">{t('apply.to_dashboard')}</Button>
          <Button variant="outline" onClick={messageOrg} className="rounded-full gap-2">
            <MessageCircle className="w-4 h-4" /> {t('apply.message_org')}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/catalog')} className="rounded-full">{t('apply.to_catalog')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <Link to={`/event/${id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> {t('apply.back')}
      </Link>

      <div className="mb-8">
        <div className="text-sm text-muted-foreground mb-2">{event.organization_name}</div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-balance">{event.title}</h1>
      </div>

      <div className="space-y-6">
        {fields.map(field => (
          <div key={field.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {(field.type === 'textarea' || field.type === 'text') && (
                <button
                  type="button"
                  onClick={() => aiHelp(field)}
                  disabled={aiLoading}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {t('apply.ai_help')}
                </button>
              )}
            </div>

            {field.type === 'textarea' && (
              <Textarea
                value={answers[field.key] || ''}
                onChange={e => update(field.key, e.target.value)}
                rows={5}
                className="bg-secondary border-transparent rounded-xl focus-visible:bg-background focus-visible:border-border"
                placeholder={t('apply.answer_ph')}
              />
            )}
            {field.type === 'text' && (
              <Input
                value={answers[field.key] || ''}
                onChange={e => update(field.key, e.target.value)}
                className="bg-secondary border-transparent rounded-xl focus-visible:bg-background focus-visible:border-border h-12"
              />
            )}
            {field.type === 'select' && (
              <Select value={answers[field.key] || ''} onValueChange={v => update(field.key, v)}>
                <SelectTrigger className="h-12 rounded-xl bg-secondary border-transparent"><SelectValue placeholder={t('apply.select_ph')} /></SelectTrigger>
                <SelectContent>
                  {(field.options || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {field.type === 'date' && (
              <Input type="date" value={answers[field.key] || ''} onChange={e => update(field.key, e.target.value)} className="h-12 rounded-xl" />
            )}
            {field.type === 'file' && (
              <FileUpload
                value={answers[field.key]}
                onFile={f => handleFile(field.key, f)}
                onClear={() => update(field.key, null)}
                uploading={uploading[field.key]}
                t={t}
              />
            )}
          </div>
        ))}

        <div className="flex gap-3 pt-4">
          <Button onClick={submit} disabled={submitting} className="flex-1 h-12 rounded-full gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('apply.submit')}
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)} className="h-12 rounded-full">{t('apply.cancel')}</Button>
        </div>
      </div>
    </div>
  );
}

function FileUpload({ value, onFile, onClear, uploading, t }) {
  if (value?.file_url) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary/30">
        <FileText className="w-5 h-5 text-muted-foreground" />
        <span className="flex-1 text-sm truncate">{value.filename}</span>
        <button onClick={onClear} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }
  return (
    <label className="flex items-center justify-center gap-2 p-6 rounded-xl border border-dashed border-border hover:border-foreground/40 cursor-pointer bg-secondary/30 transition-colors">
      {uploading ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> {t('apply.uploading')}</>
      ) : (
        <><Upload className="w-4 h-4" /> <span className="text-sm">{t('apply.upload_file')}</span></>
      )}
      <input type="file" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
    </label>
  );
}