# Op Finder — независимый деплой (без Base44)

## Быстрый старт

### 1. Создай проект Supabase
- [supabase.com](https://supabase.com) → New Project
- Settings → API → скопируй **Project URL** и **anon key**

### 2. Создай .env
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. Запусти SQL миграцию
Supabase Dashboard → SQL Editor → вставь содержимое `supabase/migrations/001_schema.sql`

### 4. Создай Storage bucket
Storage → New bucket → имя: `files` → Public: ✓

### 5. Настрой Google OAuth (опционально)
Authentication → Providers → Google → включи и вставь Client ID + Secret

### 6. Задеплой Edge Functions (для AI-фич)
```bash
npm install -g supabase
supabase login
supabase link --project-ref ВАШ_PROJECT_REF
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set GROQ_API_KEY=gsk_...
supabase secrets set RESEND_API_KEY=re_...
supabase functions deploy invoke-llm
supabase functions deploy groq-chat
supabase functions deploy send-email
supabase functions deploy translate-content
```
- Groq API бесплатно: [console.groq.com](https://console.groq.com)
- Anthropic: [console.anthropic.com](https://console.anthropic.com)
- Resend (email): [resend.com](https://resend.com)

### 7. Запусти
```bash
npm install
npm run dev
```

### 8. Деплой фронтенда
**Vercel (рекомендуется):**
```bash
npx vercel
# Добавь VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в Settings → Environment Variables
```

**Netlify:** `npm run build` → перетащи папку `dist/` на netlify.com/drop

**Свой сервер:** `npm run build` → скопируй `dist/`, nginx с `try_files $uri /index.html`

## Что заменено
| Было (Base44) | Стало (Supabase) |
|---|---|
| `@base44/sdk` | `@supabase/supabase-js` |
| `base44.entities.*` | PostgreSQL через `src/api/db.js` |
| `base44.auth.*` | Supabase Auth через `src/api/auth.js` |
| `base44.integrations.Core.UploadFile` | Supabase Storage |
| `base44.integrations.Core.InvokeLLM` | Edge Function `invoke-llm` |
| `base44.functions.invoke('groqChat')` | Edge Function `groq-chat` |
| `base44.integrations.Core.SendEmail` | Edge Function `send-email` |
| CDN изображения base44 | Встроены как base64 |
