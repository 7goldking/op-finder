import React from 'react';
import { Github, ExternalLink, Trophy, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const CAT_LABELS = {
  hackathon: 'Хакатон', startup: 'Стартап', research: 'Исследование',
  design: 'Дизайн', open_source: 'Open source', course: 'Учебный', other: 'Проект',
};

export default function ProjectCard({ project, onEdit, onDelete, editable }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden group">
      {project.cover_url && (
        <div className="aspect-[16/9] bg-muted overflow-hidden">
          <img src={project.cover_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
            <span>{CAT_LABELS[project.category] || 'Проект'}</span>
            {project.date && <><span>·</span><span>{format(new Date(project.date), 'LLL yyyy', { locale: ru })}</span></>}
          </div>
          {editable && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
              <button onClick={() => onEdit(project)} className="w-7 h-7 rounded-full hover:bg-secondary flex items-center justify-center">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(project)} className="w-7 h-7 rounded-full hover:bg-destructive/10 flex items-center justify-center text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <h3 className="font-display text-lg font-semibold leading-snug mb-1">{project.title}</h3>
        {project.role && <div className="text-xs text-muted-foreground mb-2">{project.role}</div>}
        {project.award && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium mb-2">
            <Trophy className="w-3 h-3" /> {project.award}
          </div>
        )}
        {project.description && <p className="text-sm text-foreground/80 line-clamp-3 mt-2">{project.description}</p>}

        {(project.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {project.tags.map(t => <span key={t} className="px-2 py-0.5 rounded-full bg-secondary text-xs">#{t}</span>)}
          </div>
        )}

        {(project.github_url || project.demo_url) && (
          <div className="flex gap-3 mt-4 pt-3 border-t border-border text-xs">
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <Github className="w-3.5 h-3.5" /> GitHub
              </a>
            )}
            {project.demo_url && (
              <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <ExternalLink className="w-3.5 h-3.5" /> Демо
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}