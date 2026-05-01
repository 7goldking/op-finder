export const CATEGORY_KEYS = [
  { value: 'hackathon', ru: 'Хакатоны', en: 'Hackathons' },
  { value: 'olympiad', ru: 'Олимпиады', en: 'Olympiads' },
  { value: 'volunteering', ru: 'Волонтёрство', en: 'Volunteering' },
  { value: 'internship', ru: 'Стажировки', en: 'Internships' },
  { value: 'grant', ru: 'Гранты', en: 'Grants' },
  { value: 'scholarship', ru: 'Стипендии', en: 'Scholarships' },
  { value: 'fellowship', ru: 'Феллоушипы', en: 'Fellowships' },
  { value: 'summer_school', ru: 'Летние школы', en: 'Summer Schools' },
  { value: 'mentorship', ru: 'Менторство', en: 'Mentorship' },
  { value: 'forum', ru: 'Форумы', en: 'Forums' },
  { value: 'conference', ru: 'Конференции', en: 'Conferences' },
  { value: 'workshop', ru: 'Воркшопы', en: 'Workshops' },
  { value: 'accelerator', ru: 'Акселераторы', en: 'Accelerators' },
  { value: 'exchange', ru: 'Обмены', en: 'Exchanges' },
  { value: 'competition', ru: 'Конкурсы', en: 'Competitions' },
  { value: 'mun', ru: 'Модель ООН', en: 'Model UN' },
  { value: 'custom', ru: 'Другое', en: 'Other' },
];

export const getCategories = (lang = 'ru') =>
  CATEGORY_KEYS.map(c => ({ value: c.value, label: lang === 'en' ? c.en : c.ru }));

// Backward compat — defaults to Russian
export const CATEGORIES = getCategories('ru');

export const FORMAT_KEYS = [
  { value: 'online', ru: 'Онлайн', en: 'Online' },
  { value: 'offline', ru: 'Офлайн', en: 'Offline' },
  { value: 'hybrid', ru: 'Гибрид', en: 'Hybrid' },
];

export const getFormats = (lang = 'ru') =>
  FORMAT_KEYS.map(f => ({ value: f.value, label: lang === 'en' ? f.en : f.ru }));

export const FORMATS = getFormats('ru');

export const LEVEL_KEYS = [
  { value: 'school', ru: 'Школьник', en: 'School' },
  { value: 'bachelor', ru: 'Бакалавр', en: 'Bachelor' },
  { value: 'master', ru: 'Магистр', en: 'Master' },
  { value: 'any', ru: 'Любой', en: 'Any' },
];

export const getLevels = (lang = 'ru') =>
  LEVEL_KEYS.map(l => ({ value: l.value, label: lang === 'en' ? l.en : l.ru }));

export const LEVELS = getLevels('ru');

export const STATUS_LABELS = {
  draft: { label: 'Черновик', color: 'bg-muted text-muted-foreground' },
  submitted: { label: 'Отправлена', color: 'bg-secondary text-secondary-foreground' },
  in_review: { label: 'На рассмотрении', color: 'bg-warning/10 text-warning' },
  accepted: { label: 'Принята', color: 'bg-success/10 text-success' },
  rejected: { label: 'Отклонена', color: 'bg-destructive/10 text-destructive' },
};

export const getCategory = (v, customLabel, lang = 'ru') => {
  const found = CATEGORY_KEYS.find(c => c.value === v);
  if (!found) return { label: v, value: v };
  if (v === 'custom' && customLabel) return { value: 'custom', label: customLabel };
  return { value: found.value, label: lang === 'en' ? found.en : found.ru };
};

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const d = new Date(dateStr);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}