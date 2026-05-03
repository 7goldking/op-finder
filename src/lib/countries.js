// Map city names → country code. Used to group the city filter by country.
// Country emoji + label is the section header in the filter chip row.
// Cities not in this map fall under "🌐 Other".

const CITY_TO_COUNTRY = {
  // Kazakhstan
  'алматы': 'KZ', 'almaty': 'KZ',
  'астана': 'KZ', 'astana': 'KZ', 'нур-султан': 'KZ', 'nur-sultan': 'KZ',
  'шымкент': 'KZ', 'shymkent': 'KZ',
  'караганда': 'KZ', 'karaganda': 'KZ',
  'актобе': 'KZ', 'aktobe': 'KZ',
  'павлодар': 'KZ', 'pavlodar': 'KZ',
  'оскемен': 'KZ', 'усть-каменогорск': 'KZ', 'oskemen': 'KZ',
  'семей': 'KZ', 'semey': 'KZ',
  'тараз': 'KZ', 'taraz': 'KZ',
  'кокшетау': 'KZ', 'kokshetau': 'KZ',
  'туркестан': 'KZ', 'turkestan': 'KZ',
  'атырау': 'KZ', 'atyrau': 'KZ',
  'актау': 'KZ', 'aktau': 'KZ',
  'уральск': 'KZ', 'uralsk': 'KZ',
  'костанай': 'KZ', 'kostanay': 'KZ',
  'кызылорда': 'KZ', 'kyzylorda': 'KZ',
  'талдыкорган': 'KZ', 'taldykorgan': 'KZ',
  'жанаозен': 'KZ', 'zhanaozen': 'KZ',
  'kazakhstan': 'KZ', 'казахстан': 'KZ',
  // Russia
  'москва': 'RU', 'moscow': 'RU',
  'санкт-петербург': 'RU', 'спб': 'RU', 'saint petersburg': 'RU', 'st. petersburg': 'RU',
  'казань': 'RU', 'kazan': 'RU',
  'екатеринбург': 'RU', 'yekaterinburg': 'RU',
  'новосибирск': 'RU', 'novosibirsk': 'RU',
  'нижний новгород': 'RU', 'nizhny novgorod': 'RU',
  'великий новгород': 'RU', 'veliky novgorod': 'RU',
  'сочи': 'RU', 'sochi': 'RU',
  'владивосток': 'RU', 'vladivostok': 'RU',
  'россия': 'RU', 'russia': 'RU',
  // Uzbekistan
  'ташкент': 'UZ', 'tashkent': 'UZ',
  'самарканд': 'UZ', 'samarkand': 'UZ',
  'бухара': 'UZ', 'bukhara': 'UZ',
  'uzbekistan': 'UZ', 'узбекистан': 'UZ',
  // Kyrgyzstan
  'бишкек': 'KG', 'bishkek': 'KG',
  'kyrgyzstan': 'KG', 'кыргызстан': 'KG',
  // Belarus
  'минск': 'BY', 'minsk': 'BY',
  'belarus': 'BY', 'беларусь': 'BY',
  // Ukraine
  'киев': 'UA', 'kyiv': 'UA', 'kiev': 'UA',
  'ukraine': 'UA', 'украина': 'UA',
  // United States
  'new york': 'US', 'нью-йорк': 'US',
  'san francisco': 'US', 'сан-франциско': 'US',
  'boston': 'US', 'бостон': 'US',
  'chicago': 'US', 'чикаго': 'US',
  'los angeles': 'US', 'лос-анджелес': 'US',
  'washington': 'US', 'washington dc': 'US',
  'seattle': 'US', 'сиэтл': 'US',
  'grand rapids': 'US',
  'united states': 'US', 'usa': 'US', 'сша': 'US',
  // United Kingdom
  'london': 'GB', 'лондон': 'GB',
  'edinburgh': 'GB', 'эдинбург': 'GB',
  'glasgow': 'GB', 'глазго': 'GB',
  'manchester': 'GB', 'манчестер': 'GB',
  'bristol': 'GB',
  'oxford': 'GB', 'оксфорд': 'GB',
  'cambridge': 'GB', 'кембридж': 'GB',
  'uk': 'GB', 'united kingdom': 'GB', 'великобритания': 'GB', 'англия': 'GB',
  // Germany
  'берлин': 'DE', 'berlin': 'DE',
  'мюнхен': 'DE', 'munich': 'DE',
  'frankfurt': 'DE', 'франкфурт': 'DE',
  'hamburg': 'DE', 'гамбург': 'DE',
  'germany': 'DE', 'германия': 'DE',
  // France
  'париж': 'FR', 'paris': 'FR',
  'lyon': 'FR', 'лион': 'FR',
  'france': 'FR', 'франция': 'FR',
  // Italy
  'рим': 'IT', 'rome': 'IT',
  'милан': 'IT', 'milan': 'IT',
  'padua': 'IT',
  'italy': 'IT', 'италия': 'IT',
  // Spain
  'мадрид': 'ES', 'madrid': 'ES',
  'барселона': 'ES', 'barcelona': 'ES',
  'spain': 'ES', 'испания': 'ES',
  // Portugal
  'lisbon': 'PT', 'porto': 'PT', 'лиссабон': 'PT',
  'portugal': 'PT', 'португалия': 'PT',
  // Switzerland
  'geneva': 'CH', 'женева': 'CH',
  'zurich': 'CH', 'цюрих': 'CH',
  'switzerland': 'CH', 'швейцария': 'CH',
  // Norway / Finland
  'oslo': 'NO', 'осло': 'NO',
  'norway': 'NO', 'норвегия': 'NO',
  'helsinki': 'FI', 'хельсинки': 'FI',
  'finland': 'FI', 'финляндия': 'FI',
  // Greece
  'athens': 'GR', 'афины': 'GR',
  'greece': 'GR', 'греция': 'GR',
  // China
  'beijing': 'CN', 'пекин': 'CN',
  'shanghai': 'CN', 'шанхай': 'CN',
  'china': 'CN', 'китай': 'CN',
  // Japan
  'tokyo': 'JP', 'токио': 'JP',
  'japan': 'JP', 'япония': 'JP',
  // Korea
  'seoul': 'KR', 'сеул': 'KR',
  'korea': 'KR', 'корея': 'KR',
  // Australia
  'sydney': 'AU', 'сидней': 'AU',
  'melbourne': 'AU', 'мельбурн': 'AU',
  'adelaide': 'AU',
  'australia': 'AU', 'австралия': 'AU',
  // Other
  'bangkok': 'TH', 'бангкок': 'TH', 'thailand': 'TH', 'таиланд': 'TH',
  'jordan': 'JO', 'иордания': 'JO',
  'saudi arabia': 'SA',
  'lima': 'PE', 'peru': 'PE',
  'ethiopia': 'ET', 'эфиопия': 'ET',
  'africa': 'XX', // continent fallback
  'skopje': 'MK',
  'бухарест': 'RO', 'bucharest': 'RO', 'romania': 'RO',
  // Online / virtual
  'online': 'OL', 'онлайн': 'OL', 'remote': 'OL', 'виртуальный': 'OL',
};

export const COUNTRIES = {
  KZ: { flag: '🇰🇿', name: 'Казахстан', nameEn: 'Kazakhstan' },
  RU: { flag: '🇷🇺', name: 'Россия', nameEn: 'Russia' },
  UZ: { flag: '🇺🇿', name: 'Узбекистан', nameEn: 'Uzbekistan' },
  KG: { flag: '🇰🇬', name: 'Кыргызстан', nameEn: 'Kyrgyzstan' },
  BY: { flag: '🇧🇾', name: 'Беларусь', nameEn: 'Belarus' },
  UA: { flag: '🇺🇦', name: 'Украина', nameEn: 'Ukraine' },
  US: { flag: '🇺🇸', name: 'США', nameEn: 'USA' },
  GB: { flag: '🇬🇧', name: 'Великобритания', nameEn: 'UK' },
  DE: { flag: '🇩🇪', name: 'Германия', nameEn: 'Germany' },
  FR: { flag: '🇫🇷', name: 'Франция', nameEn: 'France' },
  IT: { flag: '🇮🇹', name: 'Италия', nameEn: 'Italy' },
  ES: { flag: '🇪🇸', name: 'Испания', nameEn: 'Spain' },
  PT: { flag: '🇵🇹', name: 'Португалия', nameEn: 'Portugal' },
  CH: { flag: '🇨🇭', name: 'Швейцария', nameEn: 'Switzerland' },
  NO: { flag: '🇳🇴', name: 'Норвегия', nameEn: 'Norway' },
  FI: { flag: '🇫🇮', name: 'Финляндия', nameEn: 'Finland' },
  GR: { flag: '🇬🇷', name: 'Греция', nameEn: 'Greece' },
  CN: { flag: '🇨🇳', name: 'Китай', nameEn: 'China' },
  JP: { flag: '🇯🇵', name: 'Япония', nameEn: 'Japan' },
  KR: { flag: '🇰🇷', name: 'Корея', nameEn: 'Korea' },
  AU: { flag: '🇦🇺', name: 'Австралия', nameEn: 'Australia' },
  TH: { flag: '🇹🇭', name: 'Таиланд', nameEn: 'Thailand' },
  JO: { flag: '🇯🇴', name: 'Иордания', nameEn: 'Jordan' },
  SA: { flag: '🇸🇦', name: 'Саудовская Аравия', nameEn: 'Saudi Arabia' },
  PE: { flag: '🇵🇪', name: 'Перу', nameEn: 'Peru' },
  ET: { flag: '🇪🇹', name: 'Эфиопия', nameEn: 'Ethiopia' },
  RO: { flag: '🇷🇴', name: 'Румыния', nameEn: 'Romania' },
  MK: { flag: '🇲🇰', name: 'Северная Македония', nameEn: 'North Macedonia' },
  OL: { flag: '🌐', name: 'Онлайн', nameEn: 'Online' },
  XX: { flag: '🌍', name: 'Другое', nameEn: 'Other' },
};

// Display order of country sections in the filter — KZ first as primary audience.
export const COUNTRY_ORDER = [
  'KZ', 'RU', 'UZ', 'KG', 'BY', 'UA',
  'US', 'GB', 'DE', 'FR', 'IT', 'ES', 'PT', 'CH', 'NO', 'FI', 'GR', 'RO', 'MK',
  'CN', 'JP', 'KR', 'AU', 'TH', 'JO', 'SA', 'PE', 'ET',
  'OL', 'XX',
];

export function countryForCity(city) {
  if (!city) return 'XX';
  const k = city.toLowerCase().trim();
  return CITY_TO_COUNTRY[k] || 'XX';
}

// Group an array of city strings by country, returning an array of
// { country, flag, name, cities: [...] } objects in COUNTRY_ORDER.
export function groupCitiesByCountry(cities, lang = 'ru') {
  const buckets = {};
  for (const c of cities) {
    const code = countryForCity(c);
    if (!buckets[code]) buckets[code] = [];
    buckets[code].push(c);
  }
  return COUNTRY_ORDER
    .filter((code) => buckets[code]?.length)
    .map((code) => ({
      code,
      flag: COUNTRIES[code]?.flag ?? '🌍',
      name: lang === 'en' ? (COUNTRIES[code]?.nameEn ?? 'Other') : (COUNTRIES[code]?.name ?? 'Другое'),
      cities: buckets[code].sort(),
    }));
}
