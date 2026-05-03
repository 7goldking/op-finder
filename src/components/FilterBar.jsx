import React, { useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getCategories, getFormats } from '@/lib/categories';
import { groupCitiesByCountry } from '@/lib/countries';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

export default function FilterBar({ search, setSearch, category, setCategory, format, setFormat, city, setCity, cities = [] }) {
  const { lang, t } = useI18n();
  const CATEGORIES = getCategories(lang);
  const FORMATS = getFormats(lang);
  const groupedCities = useMemo(() => groupCitiesByCountry(cities, lang), [cities, lang]);
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'en' ? 'Search opportunities — hackathons, grants, internships...' : 'Поиск возможностей — хакатоны, гранты, стажировки...'}
          className="pl-11 pr-11 h-12 bg-secondary border-transparent rounded-full text-sm focus-visible:bg-background focus-visible:border-border"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40 flex items-center justify-center"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="fade-right-edge md:[&::after]:hidden">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1 snap-x">
          <button
            onClick={() => setCategory('all')}
            className={cn(
              "shrink-0 snap-start px-3.5 py-2 rounded-full text-sm font-medium border transition-all",
              category === 'all'
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:border-foreground/30"
            )}
          >
            {lang === 'en' ? 'All' : 'Все'}
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(category === c.value ? 'all' : c.value)}
              className={cn(
                "shrink-0 snap-start px-3.5 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap",
                category === c.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-foreground/30"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {cities.length > 0 && (
        <div className="fade-right-edge md:[&::after]:hidden">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1 snap-x">
            <span className="text-xs text-muted-foreground shrink-0">{lang === 'en' ? 'City:' : 'Город:'}</span>
            <button
              onClick={() => setCity('all')}
              className={cn("shrink-0 snap-start text-xs px-3 py-1.5 rounded-full border transition-colors",
                city === 'all' ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground")}
            >{lang === 'en' ? 'Any' : 'Любой'}</button>
            {groupedCities.map((group, gi) => (
              <React.Fragment key={group.code}>
                {gi > 0 && <span className="shrink-0 h-5 w-px bg-border mx-1" aria-hidden="true" />}
                <span className="shrink-0 inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground/80 px-1">
                  <span aria-hidden="true">{group.flag}</span>
                  <span>{group.name}</span>
                </span>
                {group.cities.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCity(city === c ? 'all' : c)}
                    className={cn(
                      "shrink-0 snap-start text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap",
                      city === c
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="fade-right-edge md:[&::after]:hidden">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1 snap-x">
          <span className="text-xs text-muted-foreground shrink-0">{lang === 'en' ? 'Format:' : 'Формат:'}</span>
          {[{ value: 'all', label: lang === 'en' ? 'Any' : 'Любой' }, ...FORMATS].map(f => (
            <button
              key={f.value}
              onClick={() => setFormat(f.value)}
              className={cn(
                "shrink-0 snap-start text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap",
                format === f.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}