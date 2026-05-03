import React, { useMemo, useState, useEffect } from 'react';
import { Search, X, MapPin, ChevronDown } from 'lucide-react';
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
  const [cityOpen, setCityOpen] = useState(false);
  // Lock body scroll when city sheet is open.
  useEffect(() => {
    if (!cityOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [cityOpen]);
  const cityLabel = city === 'all' ? (lang === 'en' ? 'Any city' : 'Любой город') : city;
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
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">{lang === 'en' ? 'City:' : 'Город:'}</span>
          <button
            type="button"
            onClick={() => setCityOpen(true)}
            className={cn(
              "flex-1 flex items-center justify-between gap-2 px-3.5 py-2 rounded-full border text-sm transition-colors",
              city === 'all'
                ? "bg-background border-border text-muted-foreground hover:border-foreground/30"
                : "bg-foreground text-background border-foreground"
            )}
          >
            <span className="flex items-center gap-2 truncate">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{cityLabel}</span>
            </span>
            <ChevronDown className="w-4 h-4 shrink-0 opacity-60" />
          </button>
          {city !== 'all' && (
            <button
              type="button"
              onClick={() => setCity('all')}
              aria-label={lang === 'en' ? 'Clear city filter' : 'Сбросить город'}
              className="shrink-0 w-8 h-8 rounded-full bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {cityOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center"
          onClick={() => setCityOpen(false)}
        >
          <div
            className="w-full md:max-w-md md:rounded-2xl rounded-t-2xl bg-background border border-border shadow-2xl flex flex-col max-h-[85vh] md:max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
              <h3 className="text-base font-semibold">
                {lang === 'en' ? 'Filter by city' : 'Фильтр по городу'}
              </h3>
              <button
                type="button"
                onClick={() => setCityOpen(false)}
                aria-label={lang === 'en' ? 'Close' : 'Закрыть'}
                className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/70 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain flex-1 px-2 py-2">
              <button
                type="button"
                onClick={() => { setCity('all'); setCityOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition-colors",
                  city === 'all' ? "bg-secondary font-medium" : "hover:bg-secondary/60"
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden="true">🌍</span>
                  <span>{lang === 'en' ? 'Any city' : 'Любой город'}</span>
                </span>
                {city === 'all' && <span className="text-xs text-primary">●</span>}
              </button>
              {groupedCities.map((group) => (
                <div key={group.code} className="mt-3 first:mt-1">
                  <div className="px-3 py-1.5 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground sticky top-0 bg-background/95 backdrop-blur z-10">
                    <span aria-hidden="true">{group.flag}</span>
                    <span>{group.name}</span>
                    <span className="ml-auto text-muted-foreground/60 normal-case tracking-normal">{group.cities.length}</span>
                  </div>
                  <div className="flex flex-col">
                    {group.cities.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => { setCity(city === c ? 'all' : c); setCityOpen(false); }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-colors",
                          city === c ? "bg-secondary font-medium" : "hover:bg-secondary/60"
                        )}
                      >
                        <span>{c}</span>
                        {city === c && <span className="text-xs text-primary">●</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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