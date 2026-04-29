import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Globe, Star } from 'lucide-react';

export default function MentorCard({ mentor }) {
  const free = !mentor.price_per_session;
  return (
    <Link to={`/mentors/${mentor.id}`} className="block group">
      <div className="p-5 rounded-2xl border border-border bg-card hover:border-foreground/30 transition-all hover:-translate-y-0.5 h-full flex flex-col">
        <div className="flex items-start gap-4 mb-3">
          <div className="w-14 h-14 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-lg font-semibold shrink-0">
            {mentor.avatar_url ? (
              <img src={mentor.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (mentor.name || '?')[0].toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-semibold leading-snug line-clamp-1 group-hover:underline underline-offset-4">
              {mentor.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{mentor.headline}</p>
            {mentor.rating_avg > 0 && (
              <div className="flex items-center gap-1 mt-1 text-xs">
                <Star className="w-3 h-3 fill-warning text-warning" />
                <span className="font-semibold">{mentor.rating_avg.toFixed(1)}</span>
                <span className="text-muted-foreground">({mentor.rating_count})</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {(mentor.expertise || []).slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-secondary text-xs">#{tag}</span>
          ))}
        </div>

        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {mentor.years_experience > 0 && (
              <span className="inline-flex items-center gap-1"><Briefcase className="w-3 h-3" /> {mentor.years_experience} лет</span>
            )}
            <span className="inline-flex items-center gap-1"><Globe className="w-3 h-3" /> {mentor.session_format === 'online' ? 'Онлайн' : mentor.session_format === 'offline' ? 'Очно' : 'Гибрид'}</span>
          </div>
          <span className={`font-semibold ${free ? 'text-success' : 'text-foreground'}`}>
            {free ? 'Бесплатно' : `${mentor.price_per_session}₽`}
          </span>
        </div>
      </div>
    </Link>
  );
}