// Простой локальный движок рекомендаций на основе совпадения ключевых слов
// между профилем пользователя (interests/skills/goals/search_history) и сущностью.

const STOP = new Set(['и','в','на','с','по','для','о','об','из','к','но','а','the','of','to','in','and','or','a','an','for']);

function normalizeTokens(str) {
  if (!str) return [];
  return String(str)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s#]/gu, ' ')
    .split(/\s+/)
    .map(t => t.replace(/^#/, '').trim())
    .filter(t => t.length > 2 && !STOP.has(t));
}

export function buildUserKeywords(user) {
  if (!user) return { set: new Set(), weights: new Map() };
  const sources = [
    ...(user.interests || []).flatMap(t => [t, ...normalizeTokens(t)]).map(t => ({ t, w: 3 })),
    ...(user.skills || []).flatMap(t => [t, ...normalizeTokens(t)]).map(t => ({ t, w: 2 })),
    ...normalizeTokens(user.goals).map(t => ({ t, w: 2 })),
    ...normalizeTokens(user.bio).map(t => ({ t, w: 1 })),
    ...(user.search_history || []).flatMap(q => normalizeTokens(q)).map(t => ({ t, w: 2 })),
  ];
  const weights = new Map();
  for (const { t, w } of sources) {
    const key = String(t).toLowerCase().trim();
    if (!key || key.length < 2) continue;
    weights.set(key, (weights.get(key) || 0) + w);
  }
  return { set: new Set(weights.keys()), weights };
}

function entityTokens(...parts) {
  const tokens = new Set();
  for (const p of parts) {
    if (!p) continue;
    if (Array.isArray(p)) p.forEach(x => x && String(x).toLowerCase().trim() && tokens.add(String(x).toLowerCase().trim()));
    else normalizeTokens(p).forEach(t => tokens.add(t));
  }
  return tokens;
}

export function scoreMentor(mentor, userKw) {
  const tokens = entityTokens(mentor.expertise, mentor.headline, mentor.bio, mentor.languages);
  return scoreTokens(tokens, userKw);
}

export function scoreArticle(article, userKw) {
  const tokens = entityTokens(article.tags, article.title, article.excerpt, article.category);
  return scoreTokens(tokens, userKw);
}

export function scoreEvent(event, userKw) {
  const tokens = entityTokens(event.tags, event.title, event.short_description, event.category, event.category_custom);
  return scoreTokens(tokens, userKw);
}

function scoreTokens(tokens, userKw) {
  let score = 0;
  for (const t of tokens) {
    if (userKw.weights.has(t)) score += userKw.weights.get(t);
    else {
      // частичное совпадение
      for (const k of userKw.set) {
        if (t.length > 3 && k.length > 3 && (t.includes(k) || k.includes(t))) {
          score += 0.5;
          break;
        }
      }
    }
  }
  return score;
}

export function topBy(items, scoreFn, userKw, n = 3) {
  const scored = items
    .map(item => ({ item, score: scoreFn(item, userKw) }))
    .sort((a, b) => b.score - a.score);
  const hasMatches = scored.some(s => s.score > 0);
  const pick = hasMatches ? scored.filter(s => s.score > 0) : scored;
  return pick.slice(0, n).map(s => s.item);
}