# Op Finder — отчёт о платформенных фичах для B2B

**Деплой**: https://op-finder-1777440052.netlify.app
**Дата**: 2026-04-29

---

## Что сделано

### 1. Казахский язык (KZ) ✅
- 329 строк UI переведены через Groq на казахский (Cyrillic).
- Переключатель языка в шапке: **RU / EN / KZ**.
- Файл: `src/lib/i18n.jsx` (LANGS добавлен `kz`).

![KZ language switch](https://app.devin.ai/attachments/8448c48b-234e-4dbf-b38b-69294dabebe6/screenshot_2fadd59a30f24b98a856e9cda6c2bebd.png)

### 2. Верификация организаций ✅
- Колонка `organizations.verified` (boolean), денормализованная в `events.organization_verified` через триггер.
- Синий бейдж «Проверено» с иконкой `BadgeCheck` отображается в:
  - Карточках событий (каталог)
  - Странице деталей события
  - Маркетинговой ленте организаций
  - Бренд-странице (с подписью)
- Файл: `src/components/VerifiedBadge.jsx`.

![Verified badges in catalog](https://app.devin.ai/attachments/d237af6d-1b40-4730-86e8-9d2c5e15ccd2/screenshot_6e180b4858ee4dd3b20346c2c83d89ab.png)

### 3. Бренд-страница организации `/o/:slug` ✅
- Лого, название, статус «Проверено», описание, кнопки **Сайт / Поделиться / Встроить на сайт**.
- Все события организации в виде сетки карточек.
- Auto-generated SEO-friendly slug при INSERT (`gen_org_slug`).
- Backwards-compatible: принимает и slug, и uuid.
- Пример: https://op-finder-1777440052.netlify.app/o/astana-hub-111111

![Astana Hub brand page](https://app.devin.ai/attachments/2b78d06d-9468-441c-b960-8b617f7f0d39/screenshot_402aa749162b4b03911d210da03568e1.png)

### 4. Кабинет организации ✅
- Существующая аналитика расширена блоком **«Публичная страница»**:
  - Кликабельный URL `/o/:slug` (копирование в буфер)
  - Готовый embed-код для копирования
- Дашборд уже содержит: просмотры, заявки, конверсия, демография, аналитика по событиям.

### 5. Embed-виджет `/embed/org/:slug` ✅
- Standalone iframable страница (без Layout, без auth).
- Минималистичный дизайн на инлайн-стилях, не наследует темы родителя.
- Готовый `<iframe>`-snippet с `width:100%`, `min-height:520px`, `border-radius:16px`.
- Виден на бренд-странице по кнопке «Встроить на сайт».
- Пример: https://op-finder-1777440052.netlify.app/embed/org/astana-hub-111111

![Embed snippet on brand page](https://app.devin.ai/attachments/3e8d4587-d5bf-43af-9c34-974019c8b889/screenshot_de4dcaf2edba45458995de3bde9bd4aa.png)

![Standalone embed widget](https://app.devin.ai/attachments/0b869cf9-71af-4b85-9d20-6d82966dd9f1/screenshot_91462edf142f4a69b34896f7c35697a1.png)

### 6. Email-дайджест через Resend ✅
- Edge Function `weekly-digest` (Deno).
  - Берёт события за последние 7 дней.
  - Для каждого подписанного юзера ранжирует события по интересам и городу.
  - Отправляет HTML-письмо через Resend API.
  - Логирует в таблицу `digest_log`.
- pg_cron расписание: **`0 9 * * 5`** = пятница 09:00 UTC = 14:00 Алматы.
- Переключатель в Профиле: «Email-дайджест по пятницам».
- **Тест dry-run**: `{"ok":true,"sent":0/N,"events_in_window":3}` — функция работает.
- **Боевая отправка**: блокируется Resend пока не верифицирован домен (`kazyouthdiplomacy.com`).
  - **Что нужно сделать**: зайти в https://resend.com/domains, добавить домен, прописать DNS-записи (SPF, DKIM). После этого отправка работает на любые email.
  - До верификации: сейчас Resend разрешает отправку только на email-владельца Resend-аккаунта (`gqk726@gmail.com`).

### 7. Telegram-бот — dormant ⏸
- По запросу пользователя пока не активирован.
- Edge Functions `telegram-webhook` и `notify-new-event` написаны, схема БД готова (`profiles.telegram_chat_id`, `telegram_subscribed`, `telegram_link_token`).
- UI-кнопка «Подключить Telegram» скрыта пока `VITE_TELEGRAM_BOT_USERNAME` не задан.
- **Чтобы включить**: получить токен у [@BotFather](https://t.me/botfather), задать секреты `TELEGRAM_BOT_TOKEN` и переменную окружения `VITE_TELEGRAM_BOT_USERNAME`, развернуть webhook, прописать `setWebhook` в Telegram.

---

## Дополнительно (бонусы)

- **Кликабельные ссылки на бренд-страницы**: имя организации в EventDetail и в OrgMarquee теперь ведёт на `/o/:slug`.
- **Public RLS policy** на `organizations` — анонимные посетители видят бренд-страницы и embed-виджеты без логина.
- **SEO slug-генератор**: `gen_org_slug(name, id)` — транслитерирует кириллицу в латиницу, создаёт уникальный slug.
- **Триггер денормализации**: `verified` копируется из `organizations` в `events.organization_verified` автоматически.
- **digest_log** для аудита кому и когда уходили дайджесты.

---

## E2E-тест

- ✅ Бренд-страница рендерится с бейджем «Проверено» и событиями
- ✅ Embed-snippet виден и копируется
- ✅ Standalone embed-виджет работает в iframe
- ✅ Verified-бейджи в каталоге событий
- ✅ Переключение языка RU/EN/KZ
- ✅ Имя организации на странице события — кликабельная ссылка с verified-чеком
- ✅ Edge Function `weekly-digest` отвечает корректно
- ✅ pg_cron расписан на пятницу 9:00 UTC

---

## Что нужно от пользователя для полного запуска

1. **Resend domain verification** — для боевой email-рассылки.
   Зайти на https://resend.com/domains → добавить `kazyouthdiplomacy.com` (или другой домен) → прописать DNS (SPF, DKIM, MX) → дождаться верификации.
2. **Telegram-бот** (опционально, когда понадобится):
   - Создать бота через [@BotFather](https://t.me/botfather)
   - Прислать `TELEGRAM_BOT_TOKEN` и username бота
   - Я зарегистрирую webhook в Telegram и включу UI.
3. **GitHub-репо** (опционально) — для автодеплоя через Netlify CI и истории PR.

---

## Технические детали

**Новые таблицы / колонки**:
- `organizations.slug` (text, unique, auto-generated)
- `organizations.verified` (boolean, существовала)
- `events.organization_verified` (boolean, denormalized)
- `profiles.digest_subscribed` (boolean)
- `profiles.telegram_chat_id`, `telegram_subscribed`, `telegram_link_token`
- `digest_log` (audit log)

**Новые маршруты фронта**:
- `/o/:slug` — бренд-страница (с Layout)
- `/embed/org/:slug` — iframable widget (без Layout)

**Новые Edge Functions**:
- `weekly-digest` — еженедельный email-дайджест
- `notify-new-event` — push-нотификация в Telegram о новых событиях
- `telegram-webhook` — обработка команд бота (`/start`, `/stop`, `/events`, `/interests`)

**pg_cron**: `op_finder_weekly_digest`, расписание `0 9 * * 5`.
