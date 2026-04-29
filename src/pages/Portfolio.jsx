import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Award, Download, ArrowLeft, Share2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { getCategory } from '@/lib/categories';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import ProjectForm from '@/components/ProjectForm';
import ProjectCard from '@/components/ProjectCard';
import SocialLinksDisplay from '@/components/SocialLinksDisplay';

export default function Portfolio() {
  const { user } = useOutletContext() || {};
  const { lang } = useI18n();
  const dateLocale = lang === 'en' ? enUS : ru;
  const [apps, setApps] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadProjects = () => {
    base44.entities.Project.list('-created_date', 100).then(setProjects);
  };

  useEffect(() => {
    base44.entities.Application.filter({ status: 'accepted' }, '-created_date', 100).then(setApps);
    loadProjects();
  }, []);

  const deleteProject = async (p) => {
    if (!confirm(`Удалить проект "${p.title}"?`)) return;
    await base44.entities.Project.delete(p.id);
    toast.success('Проект удалён');
    loadProjects();
  };

  const handleSave = () => {
    setShowForm(false);
    setEditing(null);
    loadProjects();
  };

  const handlePrint = () => window.print();

  const share = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Ссылка на портфолио скопирована');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 print:hidden">
        <ArrowLeft className="w-4 h-4" /> В кабинет
      </Link>

      <div className="flex items-start justify-between gap-4 mb-10">
        <div>
          <div className="text-sm text-muted-foreground mb-2">Цифровое портфолио</div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold">{user?.full_name || 'Мои достижения'}</h1>
          {user?.bio && <p className="text-muted-foreground mt-3 max-w-xl">{user.bio}</p>}
          <div className="flex flex-wrap gap-3 mt-4 text-sm text-muted-foreground">
            {user?.city && <span>{user.city}</span>}
            {user?.education_place && <><span>·</span><span>{user.education_place}</span></>}
          </div>
          {user?.social_links?.length > 0 && (
            <div className="mt-4">
              <SocialLinksDisplay links={user.social_links} />
            </div>
          )}
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={share} className="rounded-full gap-2"><Share2 className="w-4 h-4" /> Поделиться</Button>
          <Button onClick={handlePrint} className="rounded-full gap-2"><Download className="w-4 h-4" /> PDF</Button>
        </div>
      </div>

      {/* Skills */}
      {(user?.skills || []).length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Навыки</h2>
          <div className="flex flex-wrap gap-2">
            {user.skills.map(s => (
              <span key={s} className="px-3 py-1.5 rounded-full bg-secondary text-sm">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Мои проекты ({projects.length})
          </h2>
          {!showForm && (
            <Button size="sm" variant="outline" className="rounded-full gap-1.5 print:hidden" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus className="w-3.5 h-3.5" /> Добавить проект
            </Button>
          )}
        </div>

        {showForm && (
          <div className="mb-5 print:hidden">
            <ProjectForm project={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
          </div>
        )}

        {projects.length === 0 && !showForm ? (
          <div className="p-8 border border-dashed border-border rounded-2xl text-center">
            <p className="text-muted-foreground text-sm">Добавь свои проекты, хакатоны, стартапы — они усилят твои заявки</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {projects.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                editable
                onEdit={(pr) => { setEditing(pr); setShowForm(true); }}
                onDelete={deleteProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Участие и достижения ({apps.length})
        </h2>
        {apps.length === 0 ? (
          <div className="p-8 border border-dashed border-border rounded-2xl text-center">
            <Award className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Пока нет принятых заявок</p>
            <p className="text-sm text-muted-foreground mt-1">Достижения появятся автоматически после одобрения</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map(a => {
              const cat = getCategory(a.event_category, a.event_category_custom);
              return (
                <div key={a.id} className="p-5 rounded-2xl border border-border bg-card">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0">
                      {cat.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{cat.label}</div>
                      <h3 className="font-display text-lg font-semibold leading-snug mb-1">{a.event_title}</h3>
                      <div className="text-sm text-muted-foreground">{a.event_organization}</div>
                      {a.submitted_at && (
                        <div className="text-xs text-muted-foreground mt-2">
                          {format(new Date(a.submitted_at), 'LLLL yyyy', { locale: dateLocale })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}