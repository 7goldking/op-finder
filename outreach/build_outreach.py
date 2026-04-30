#!/usr/bin/env python3
"""Build outreach HTML document with Gmail compose links and copy buttons."""
import json
import urllib.parse
import html as html_lib
from textwrap import dedent

# Sender info
SENDER = {
    "name_ru": "Бахтияр Каниев",
    "name_en": "Bakhtiyar Kaniev",
    "phone": "+7 775 920 0757",
    "email": "kanievbahtiar02@gmail.com",
    "title_ru": "Основатель",
    "title_en": "Founder",
    "linkedin": "https://www.linkedin.com/in/bakhtiyar-kaniyev-b36048405/",
    "site": "https://op-finder.online",
    "age": 16,
}

SIG_RU = f"""С уважением,
{SENDER['name_ru']}
{SENDER['title_ru']}, Op Finder
{SENDER['site']}
{SENDER['phone']} (WhatsApp/Telegram)
LinkedIn: {SENDER['linkedin']}"""

SIG_EN = f"""Best regards,
{SENDER['name_en']}
{SENDER['title_en']}, Op Finder
{SENDER['site']}
{SENDER['phone']} (WhatsApp/Telegram)
LinkedIn: {SENDER['linkedin']}"""

# All drafts: [category, recipient_name, email, subject, body, lang]
DRAFTS = [
    # ============ АКСЕЛЕРАТОРЫ / ХАБЫ ============
    {
        "category": "Акселераторы / Хабы",
        "org": "Astana Hub — отдел партнёрств",
        "email": "ceo@astanahub.com",
        "cc": "info@astanahub.com",
        "subject": "Op Finder × Astana Hub: единая площадка возможностей для резидентов",
        "body": f"""Здравствуйте!

Меня зовут {SENDER['name_ru']}, мне {SENDER['age']} лет, и я основатель Op Finder ({SENDER['site']}) — AI-платформы возможностей для молодёжи Казахстана: хакатоны, гранты, стажировки, летние школы, конкурсы. Платформа уже работает на трёх языках (RU/EN/KZ), запущена на собственном домене, есть встраиваемые виджеты и AI-агент для персональных рекомендаций.

Хочу предложить Astana Hub партнёрство — все ваши события (Tech Orda, Hero Training, Decentrathon, Silkway Accelerator) бесплатно агрегируются на одной странице с верифицированной галочкой:

1. Бесплатная brand-страница `op-finder.online/o/astana-hub` с логотипом, описанием и всеми вашими событиями.
2. Встраиваемый виджет (`<iframe>`) на astanahub.com — без интеграции, копи-паст одной строки.
3. AI-рекомендации ваших событий релевантным студентам (по специальности, городу, навыкам).
4. Аналитика заявок: демография, конверсия, ВУЗы участников.

Готов прийти в офис на Mangilik El 55/8 с 30-минутным демо или прислать видео-обзор. Когда удобно созвониться на этой/следующей неделе?

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Акселераторы / Хабы",
        "org": "Astana Hub — пресс-служба",
        "email": "media@astanahub.com",
        "subject": "Питч для Astana Hub Daily: 16-летний казахстанец построил AI-стартап Op Finder",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']} лет, основатель Op Finder ({SENDER['site']}) — AI-платформы возможностей для молодёжи Казахстана. Думаю, может получиться сильный кейс для Astana Hub Daily / соцсетей Astana Hub:

«Школьник из Казахстана за пару месяцев построил AI-агент, который собирает все хакатоны, гранты и стажировки страны и подбирает их под профиль студента».

Что могу предоставить:
— цифры (рост, события, регистрации, демография),
— скриншоты + 5-минутное видео-демо,
— технический стек (React + Supabase + Llama 3.3 70B на Groq),
— ответы на любые вопросы по процессу разработки и решениям.

Готов на интервью, видео-съёмку или просто отдать материал в формате ready-to-publish.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Акселераторы / Хабы",
        "org": "nFactorial School / Incubator (Арман Сулейменов)",
        "email": "suleimenov@gmail.com",
        "cc": "nfactorialschool@gmail.com",
        "subject": "От 16-летнего фаундера: Op Finder для участников nFactorial",
        "body": f"""Арман, привет!

Меня зовут {SENDER['name_ru']}, мне {SENDER['age']}. Очень уважаю то, что вы построили в nFactorial. Сам строю Op Finder ({SENDER['site']}) — AI-агрегатор возможностей: хакатоны, гранты, стажировки, летние школы. Уже на трёх языках (RU/EN/KZ), есть AI-чат для персональных рекомендаций.

Хотел бы:
1. Добавить все события nFactorial (Summer School, Winter School, Incubator) с верифицированной галочкой и логотипом — бесплатно.
2. Сделать бренд-страницу `op-finder.online/o/nfactorial` со всеми программами и применом.
3. Дать вам встраиваемый виджет для nfactorial.school — события подтягиваются автоматически.

Если интересно, готов на 20-минутный звонок, или просто пройдусь по платформе сам и покажу через демо-видео. Я доступен в любое время.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Акселераторы / Хабы",
        "org": "Tech Garden Almaty",
        "email": "info@astanahub.com",
        "subject": "Op Finder × Tech Garden: события резидентов на единой площадке",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']} лет, основатель Op Finder ({SENDER['site']}) — AI-платформы возможностей. Хочу предложить Tech Garden Almaty партнёрство для продвижения событий резидентов и собственных программ:

— Бесплатная brand-страница на op-finder.online/o/tech-garden со всеми вашими хакатонами, лабораториями, демо-днями.
— Встраиваемый виджет для techgarden.kz (одна строка iframe).
— AI-распределение ваших событий релевантной аудитории по специальностям.

У вас 60+ резидентов — могу также сделать каждому из них верифицированную страницу при желании.

Готов на 20-минутный звонок или встречу на Жибек Жолы 135. Когда удобно?

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Акселераторы / Хабы",
        "org": "MOST Holding",
        "email": "info@mostecosystem.com",
        "subject": "Op Finder для портфельных компаний MOST",
        "body": f"""Здравствуйте!

{SENDER['name_ru']}, {SENDER['age']} лет, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей для молодёжи Казахстана.

Хочу предложить MOST Holding/MOST Ventures партнёрство для продвижения IRA-акселератора, портфельных стартапов и собственных событий MOST Hub. Бесплатно: brand-страница, виджет, AI-рекомендации, аналитика.

Готов на 20-минутный звонок или встречу. Когда удобно?

{SIG_RU}""",
        "lang": "ru",
    },

    # ============ УНИВЕРСИТЕТСКИЕ КАРЬЕРНЫЕ ЦЕНТРЫ ============
    {
        "category": "Университетские карьерные центры",
        "org": "Nazarbayev University Career Center",
        "email": "cac@nu.edu.kz",
        "subject": "Бесплатный виджет возможностей для студентов NU",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']} лет, основатель Op Finder ({SENDER['site']}) — платформы, где студенты находят актуальные хакатоны, гранты, стажировки и летние школы по Казахстану и за рубежом. AI подбирает релевантное под профиль (специальность, курс, интересы).

Хочу предложить **бесплатный встраиваемый виджет** для сайта Career and Advising Center NU:

```html
<iframe src="https://op-finder.online/embed?audience=student&city=astana"
        width="100%" height="600" frameborder="0"></iframe>
```

→ ваши студенты видят актуальные возможности прямо на странице CAC, без ручного обновления.

Бонусом могу сделать вашу brand-страницу на платформе (логотип, описание, ваши спецсобытия) и запустить email-дайджест для студентов NU.

Когда можно показать 5-минутное демо? Готов созвониться или приехать в Block 1.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Университетские карьерные центры",
        "org": "KIMEP Career Center (Elmira Kabiyeva)",
        "email": "plof@kimep.kz",
        "cc": "uao@kimep.kz",
        "subject": "Бесплатный виджет возможностей для студентов KIMEP",
        "body": f"""Эльмира, здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']} лет, основатель Op Finder ({SENDER['site']}) — AI-платформы, на которой студенты находят хакатоны, гранты, стажировки в Казахстане и за рубежом. Уже работает на трёх языках, есть AI-агент для персональных рекомендаций.

Хочу предложить KIMEP бесплатный встраиваемый виджет для Career Center и страницу сообщества KIMEP на платформе с верифицированной галочкой. Студенты получают актуальные возможности без ручного обновления.

Также могу запустить email-дайджест для подписавшихся студентов KIMEP.

Когда удобно показать 5-минутное демо? Я в Алматы, могу подъехать на Абая 4.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Университетские карьерные центры",
        "org": "AlmaU Career Development Center",
        "email": "career@almau.edu.kz",
        "subject": "Бесплатный виджет Op Finder для студентов AlmaU",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']} лет, основатель Op Finder ({SENDER['site']}) — AI-платформы возможностей для молодёжи KZ.

Предлагаю Career Development Center AlmaU **бесплатный встраиваемый виджет** актуальных хакатонов, грантов и стажировок для сайта career.almau.edu.kz, плюс верифицированную страницу AlmaU на платформе со всеми вашими событиями и программами обмена.

Когда можно показать 5-минутное демо? Готов созвониться или подъехать.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Университетские карьерные центры",
        "org": "KBTU Career Center",
        "email": "info@kbtu.kz",
        "subject": "Бесплатный виджет возможностей для студентов KBTU",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']} лет, основатель Op Finder ({SENDER['site']}) — AI-платформы возможностей. Технические специальности KBTU — самая активная аудитория наших хакатонов.

Хочу предложить KBTU бесплатный встраиваемый виджет для карьерного центра + бренд-страницу с верифицированной галочкой. Технические студенты получают релевантные хакатоны, IT-стажировки и гранты на исследования.

Готов на 20-минутный звонок или приехать на Толе би 59. Когда удобно?

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Университетские карьерные центры",
        "org": "Satbayev University",
        "email": "info@satbayev.university",
        "subject": "Op Finder для студентов Satbayev University",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-платформы возможностей для молодёжи KZ.

Предлагаю карьерному центру Satbayev University бесплатный встраиваемый виджет с актуальными хакатонами, IT/инженерными стажировками и грантами + верифицированную страницу на платформе.

Когда можно показать демо? Готов созвониться или приехать в офис.

{SIG_RU}""",
        "lang": "ru",
    },

    # ============ КОРПОРАЦИИ ============
    {
        "category": "Корпорации",
        "org": "Halyk Bank — Halyk Start program",
        "email": "pr@halykbank.kz",
        "cc": "info@halykbank.kz",
        "subject": "Op Finder × Halyk Start: канал к десяткам тысяч IT-студентов KZ",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']} лет, основатель Op Finder ({SENDER['site']}) — AI-платформы возможностей для молодёжи KZ. Аудитория — IT-студенты, школьники старших классов, ранние карьеристы.

Что могу предложить Halyk Start:

| Что | Зачем Halyk |
|---|---|
| Verified-бейдж и brand-страница на op-finder.online/o/halyk-start | Доверие → больше качественных заявок |
| Все программы Halyk (Halyk Start, Halyk Internship) в одном месте | HR-кампании в одном фиде |
| AI-рекомендации программ релевантным IT-студентам | Меньше отсева, выше конверсия |
| Аналитика заявок (ВУЗы, города, специальности) | Понимаете кто реально откликается |

Базовый функционал — бесплатно. Спонсорский пакет с приоритетным размещением — обсуждаемо.

Готов на 30-минутный звонок или встречу. Когда удобно?

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Корпорации",
        "org": "Kaspi.kz",
        "email": "press@kaspi.kz",
        "subject": "Op Finder для образовательных программ Kaspi",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']} лет, основатель Op Finder ({SENDER['site']}) — AI-платформы возможностей для молодёжи Казахстана.

Хочу предложить Kaspi разместить ваши образовательные/HR-программы (Kaspi Lab, стажировки, олимпиады) на платформе с верифицированной галочкой. Получите доступ к десяткам тысяч активных студентов KZ.

Базовый функционал бесплатный. Готов на короткий звонок или встречу.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Корпорации",
        "org": "Beeline Kazakhstan",
        "email": "press@beeline.kz",
        "subject": "Op Finder × Beeline: HR-канал к молодёжной аудитории KZ",
        "body": f"""Здравствуйте!

{SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-платформы возможностей для молодёжи KZ.

Предлагаю Beeline разместить программы BeInTech, стажировки, хакатоны на платформе с верифицированным бейджем. AI-агент будет рекомендовать ваши программы релевантным студентам.

Бесплатно для базовых функций. Когда удобно созвониться?

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Корпорации",
        "org": "Forte Bank — корпоративные программы",
        "email": "info@fortebank.com",
        "subject": "Op Finder: платформа для студенческих программ Forte",
        "body": f"""Здравствуйте!

{SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей для молодёжи KZ.

Предлагаю Forte Bank размещать стажировки, спонсируемые хакатоны, студенческие конкурсы на платформе с верифицированной галочкой. Бесплатно для базовых функций, аналитика по заявкам включена.

Готов на 20-минутный звонок. Когда удобно?

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Корпорации",
        "org": "Jusan Bank",
        "email": "press@jusan.kz",
        "subject": "Op Finder × Jusan: HR-канал и стажировки для IT-студентов",
        "body": f"""Здравствуйте!

{SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей для молодёжи KZ.

Предлагаю разместить программы Jusan для студентов (стажировки, акселератор, спонсорские хакатоны) на платформе с верифицированным бейджем. Бесплатный базовый функционал + аналитика заявок.

Готов на короткий звонок. Когда удобно?

{SIG_RU}""",
        "lang": "ru",
    },

    # ============ ГОСУДАРСТВЕННЫЕ ============
    {
        "category": "Государственные программы",
        "org": "Bolashak / Центр международных программ",
        "email": "info@bolashak.gov.kz",
        "subject": "Op Finder × Bolashak: единый канал доступа к стипендиям и программам",
        "body": f"""Уважаемые коллеги!

Меня зовут {SENDER['name_ru']}, мне {SENDER['age']} лет. Я основатель Op Finder ({SENDER['site']}) — отечественной AI-платформы для молодёжи Казахстана: хакатоны, гранты, стажировки, стипендии, летние школы. Платформа работает на трёх языках, включая казахский.

Хочу предложить Bolashak / Центру международных программ партнёрство:

1. Все программы (Bolashak, научные стажировки, межправительственные гранты) — в одном месте с верифицированной галочкой.
2. AI-агент рекомендует ваши программы студентам по специальности и интересам.
3. Email-дайджест об открытии новых наборов для всех подписавшихся.
4. Аналитика интереса: какие специальности, города, курсы наиболее активно подают заявки.

Соответствует приоритетам стратегии «Цифровой Казахстан» и молодёжной политики РК.

Готов представить проект очно в Астане (Сыганак 70) или провести онлайн-демо. Когда удобно?

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Государственные программы",
        "org": "Министерство цифрового развития РК",
        "email": "kense@mdai.gov.kz",
        "subject": "Op Finder — отечественный AI-стартап в поддержку «Цифрового Казахстана»",
        "body": f"""Уважаемые коллеги!

{SENDER['name_ru']}, {SENDER['age']} лет, основатель Op Finder ({SENDER['site']}) — отечественной AI-платформы возможностей для молодёжи Казахстана. Платформа работает на трёх языках (включая казахский), агрегирует хакатоны, гранты, стажировки, конкурсы.

Соответствие приоритетам МЦРИАП:
— отечественный AI-продукт на казахском языке (стратегия «Цифровой Казахстан»),
— вовлечение молодёжи в IT-индустрию (нужно для роста ICT-экспорта).

Готов представить проект на встрече, обсудить возможные форматы поддержки или партнёрства (включение государственных программ в каталог, верифицированный бейдж от министерства, и др.).

Когда удобно? Я в Казахстане.

{SIG_RU}""",
        "lang": "ru",
    },

    # ============ ВЕНЧУРНЫЕ ФОНДЫ ============
    {
        "category": "Венчурные фонды (KZ + регион)",
        "org": "Quest Ventures (Ruslan Rakymbay, Kazakhstan)",
        "email": "ruslan@questventures.com",
        "cc": "hello@questventures.com",
        "subject": "16-y/o founder: Op Finder seed — AI opportunities platform for Kazakhstan",
        "body": f"""Hi Ruslan,

I'm {SENDER['name_en']}, {SENDER['age']} years old, founder of Op Finder ({SENDER['site']}) — an AI agent that aggregates hackathons, grants, internships and summer schools for students across Kazakhstan and Central Asia.

**TL;DR:**
- **Problem:** students miss 80% of opportunities — they're scattered across hundreds of Instagram and Telegram channels.
- **Solution:** unified catalogue + AI agent that personalises recommendations by major, interests, skills.
- **Stack:** React + Supabase + Llama 3.3 70B (Groq), three languages (RU/EN/KZ), embed widgets, weekly email digest.
- **Built solo at 16** in a few months — fully production-ready and live on op-finder.online.

**Looking for:** $200–500K seed for HR-marketing, growth team, expansion to Uzbekistan/Kyrgyzstan.

Would love a 30-minute call. Available any day this or next week. Could also drop a Loom walkthrough if that's easier.

{SIG_EN}""",
        "lang": "en",
    },
    {
        "category": "Венчурные фонды (KZ + регион)",
        "org": "Sturgeon Capital (Saad Hasan, Principal)",
        "email": "saad@sturgeoncapital.com",
        "subject": "16-y/o founder: Op Finder — AI opportunities platform for Central Asia (seed)",
        "body": f"""Hi Saad,

I'm {SENDER['name_en']}, {SENDER['age']}, founder of Op Finder ({SENDER['site']}) — AI-powered agent for student opportunities in Kazakhstan and broader Central Asia. Hackathons, grants, internships, summer schools — all in one place, in three languages, with personalised recommendations.

Why it fits Sturgeon's frontier-markets thesis:
- 8M+ Central Asian student population, growing fast.
- Information lives in disconnected Telegram/Instagram channels.
- Llama 3.3 makes personalised matching cheap (~$0.02 per match).
- Built solo at 16, production-ready, live on op-finder.online.

Raising **$300K seed** for growth and expansion to Uzbekistan/Kyrgyzstan.

Open to a 30-min call or a Loom walkthrough if easier.

{SIG_EN}""",
        "lang": "en",
    },
    {
        "category": "Венчурные фонды (KZ + регион)",
        "org": "MOST Ventures",
        "email": "info@mostfund.vc",
        "subject": "Op Finder — AI-платформа возможностей для молодёжи KZ (seed)",
        "body": f"""Здравствуйте!

{SENDER['name_ru']}, {SENDER['age']} лет, основатель Op Finder ({SENDER['site']}) — AI-агрегатор возможностей для молодёжи Казахстана.

TL;DR:
— Проблема: студенты пропускают 80% возможностей, они разбросаны по сотням TG/IG-каналов.
— Решение: единый каталог + AI-агент, который персонализирует под профиль.
— Стек: React + Supabase + Llama 3.3 70B (Groq), три языка, embed-виджеты.
— Сделал соло в {SENDER['age']} лет, production-ready, работает на op-finder.online.

Ищу seed $200–500K на HR-маркетинг и масштабирование в Узбекистан/Кыргызстан.

Готов на 30-минутный звонок или Loom-демо. Когда удобно?

{SIG_RU}""",
        "lang": "ru",
    },

    # ============ МЕЖДУНАРОДНЫЕ ПРОГРАММЫ ============
    {
        "category": "Международные программы",
        "org": "DAAD Information Center Almaty",
        "email": "info@daad.kz",
        "subject": "Op Finder — Free distribution channel for DAAD scholarships in Kazakhstan",
        "body": f"""Hello,

I'm {SENDER['name_en']}, {SENDER['age']}, founder of Op Finder ({SENDER['site']}) — Kazakhstan's AI-powered platform for student opportunities. We aggregate scholarships, summer schools, hackathons and grants in three languages (Russian, Kazakh, English).

We'd love to partner with DAAD to distribute your scholarships and academic exchanges to a much wider audience of Kazakh students:

- Verified DAAD brand page at op-finder.online/o/daad with all your programmes.
- AI-driven personalised recommendations to students whose major and goals match each scholarship.
- Automated weekly digest with new programmes for subscribers.
- Analytics dashboard: application volume, demographics, university breakdown.

Everything is **free** for educational and government partners — we monetise via corporate placements only.

Could we schedule a 20-minute call this or next week? I can also send a Loom walkthrough if easier. I'm based in Kazakhstan and can come to Pushkin 111 in Almaty.

{SIG_EN}""",
        "lang": "en",
    },
    {
        "category": "Международные программы",
        "org": "British Council Kazakhstan",
        "email": "info@kz.britishcouncil.org",
        "subject": "Op Finder — Free distribution channel for British Council programmes in KZ",
        "body": f"""Hello,

I'm {SENDER['name_en']}, {SENDER['age']}, founder of Op Finder ({SENDER['site']}) — Kazakhstan's AI-powered platform for student opportunities, in three languages (Russian, Kazakh, English).

We'd love to feature British Council Kazakhstan programmes (Chevening, Newton-Al-Farabi, IELTS prep, English Connects) on our platform:

- Verified brand page at op-finder.online/o/british-council-kz.
- Personalised AI recommendations to relevant students.
- Weekly digest with new programmes.
- Analytics dashboard for the BC team.

All free for educational partners.

Could we schedule a 20-min call? Happy to come to your Almaty office (Samal Towers).

{SIG_EN}""",
        "lang": "en",
    },
    {
        "category": "Международные программы",
        "org": "Goethe-Institut Almaty",
        "email": "info-almaty@goethe.de",
        "subject": "Op Finder — Free distribution channel for Goethe-Institut programmes in KZ",
        "body": f"""Sehr geehrte Damen und Herren,

I'm {SENDER['name_en']}, {SENDER['age']}, founder of Op Finder ({SENDER['site']}) — Kazakhstan's AI-powered platform for student opportunities (3 languages: RU/EN/KZ).

I'd love to feature Goethe-Institut Almaty programmes (German courses, scholarships, cultural events for youth) on the platform:

- Verified brand page at op-finder.online/o/goethe-almaty.
- Personalised AI recommendations to relevant students.
- Free for educational and cultural partners.

Could we schedule a 20-minute call or coffee at Nauryzbay Batyr 31?

{SIG_EN}""",
        "lang": "en",
    },
    {
        "category": "Международные программы",
        "org": "Erasmus+ National Office Kazakhstan",
        "email": "info@erasmusplus.kz",
        "subject": "Op Finder — Free distribution for Erasmus+ programmes in Kazakhstan",
        "body": f"""Hello,

I'm {SENDER['name_en']}, {SENDER['age']}, founder of Op Finder ({SENDER['site']}) — Kazakhstan's AI-powered platform for student opportunities.

We'd love to partner with Erasmus+ National Office to distribute KA171, Jean Monnet, and other Erasmus+ programmes to Kazakh students:

- Verified brand page on op-finder.online/o/erasmus-plus-kz.
- AI-driven personalised recommendations.
- Weekly digest of new programmes.
- All free for educational/government partners.

Could we schedule a 20-min call?

{SIG_EN}""",
        "lang": "en",
    },
    {
        "category": "Международные программы",
        "org": "Fulbright Kazakhstan (US Embassy)",
        "email": "almaty@americancouncils.kz",
        "subject": "Op Finder — Free distribution for Fulbright programmes in Kazakhstan",
        "body": f"""Hello,

I'm {SENDER['name_en']}, {SENDER['age']}, founder of Op Finder ({SENDER['site']}) — Kazakhstan's AI platform for student opportunities (3 languages).

We'd love to feature Fulbright programmes (FLEX, FFSP, Humphrey, etc.) and other American Councils initiatives on the platform with a verified bage and personalised recommendations to relevant Kazakh students.

Free for educational/government partners. Could we schedule a 20-min call?

{SIG_EN}""",
        "lang": "en",
    },

    # ============ ЯНДЕКС ============
    {
        "category": "Технологические корпорации",
        "org": "Yandex Practicum Kazakhstan",
        "email": "practicum@yandex.kz",
        "subject": "Op Finder × Yandex Practicum: канал к молодёжи KZ для онлайн-курсов",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']} лет, основатель Op Finder ({SENDER['site']}) — AI-платформы возможностей для молодёжи Казахстана: хакатоны, гранты, стажировки, курсы. Уже работает на трёх языках (RU/EN/KZ), есть AI-агент для персональных рекомендаций.

Хочу предложить Yandex Practicum партнёрство:

1. Бесплатная brand-страница `op-finder.online/o/yandex-practicum` со всеми вашими курсами и спецпредложениями для KZ.
2. AI-рекомендации курсов Practicum релевантным студентам по специальности и навыкам.
3. Verified-бейдж — доверие → выше конверсия в подписку.
4. Аналитика: какие курсы вызывают интерес, какая демография, ВУЗы.

Базовые функции бесплатно. Спонсорский пакет с приоритетным размещением — обсуждаемо.

Готов на 30-минутный звонок или встречу. Когда удобно?

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Технологические корпорации",
        "org": "Yandex Лицей (Казахстан)",
        "email": "lyceum@yandex.kz",
        "subject": "Op Finder × Yandex Лицей: канал распространения для школьников 9–11 классов",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']} лет, школьник, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей для молодёжи KZ. Сам в целевой аудитории Yandex Лицея :)

Хочу предложить Лицею:
1. Бесплатную brand-страницу со всеми городами проведения и набором.
2. AI-рекомендации Лицея школьникам 9–11 классов в нужных городах.
3. Verified-бейдж — доверие к Yandex.
4. Аналитику заявок: города, школы, демография.

Готов на короткий звонок или письменное обсуждение. Когда удобно?

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Технологические корпорации",
        "org": "Yandex Cloud",
        "email": "cloud@yandex.kz",
        "subject": "Op Finder × Yandex Cloud: продвижение хакатонов и грантов для стартапов KZ",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']} лет, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей для молодёжи KZ. Часть аудитории — молодые разработчики и студенты, которые активно идут в облачные технологии.

Хочу предложить Yandex Cloud партнёрство:
1. Brand-страница `op-finder.online/o/yandex-cloud` с вашими хакатонами, грантовыми программами, конкурсами для стартапов.
2. AI-рекомендации ваших программ релевантным разработчикам по стеку и навыкам.
3. Verified-бейдж + аналитика заявок.

Сама платформа Op Finder, кстати, крутится не на Yandex Cloud — могу мигрировать при правильном офере 🙂

Готов на 30-минутный звонок. Когда удобно?

{SIG_RU}""",
        "lang": "ru",
    },

    # ============ МЕДИА ============
    {
        "category": "Медиа",
        "org": "Forbes Kazakhstan (Дамир Серикпаев, главред)",
        "email": "serikpayev@forbes.kz",
        "cc": "anna@forbes.kz",
        "subject": "Питч: 16-летний школьник из KZ построил AI-стартап Op Finder за пару месяцев",
        "body": f"""Дамир, здравствуйте!

Меня зовут {SENDER['name_ru']}, мне {SENDER['age']} лет, школьник. Делаю Op Finder ({SENDER['site']}) — AI-платформу, которая собирает все хакатоны, гранты, стажировки и летние школы Казахстана и подбирает их под профиль студента с помощью Llama 3.3 (та же модель, что в Meta AI).

Думаю, может получиться сильный материал для Forbes.kz / Forbes Young / Forbes Education:

**Угол:** «Школьник из Казахстана за пару месяцев построил AI-стартап с тремя языками и production-ready инфраструктурой. Что говорит о новом поколении основателей в Central Asia?»

**Что могу дать:**
— эксклюзивные цифры (рост, демография аудитории, какие специальности самые активные),
— скриншоты + 5-минутное демо,
— открытые ответы про стек (React + Supabase + Groq), бизнес-модель, путь от идеи до запуска,
— контакты партнёров (Astana Hub, университетские карьерные центры — некоторые уже подтвердили интерес).

Готов на интервью в Zoom, офлайн в Алматы/Астане, или прислать готовые ответы письмом.

Когда удобно? Спасибо за время!

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Медиа",
        "org": "Kursiv (Айгерим Тукушева, General News)",
        "email": "a.tukusheva@kursiv.media",
        "cc": "kursiv@kursiv.kz",
        "subject": "16-летний школьник запустил AI-стартап Op Finder в Казахстане",
        "body": f"""Айгерим, здравствуйте!

{SENDER['name_ru']}, {SENDER['age']} лет, школьник из Казахстана. Делаю Op Finder ({SENDER['site']}) — AI-агрегатор возможностей: хакатоны, гранты, стажировки, летние школы. Уже работает на трёх языках (RU/EN/KZ), есть AI-агент.

Может быть интересно для отдела Business News / Kursiv Lifestyle:

**Угол:** новое поколение казахстанских фаундеров — школьник один сделал production-ready AI-продукт с тремя языками за несколько месяцев.

Что могу дать:
— цифры роста и демография аудитории,
— скриншоты + видео-демо,
— открытые ответы про путь, стек, монетизацию.

Готов на интервью или письменные ответы. Когда удобно?

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Медиа",
        "org": "Bluescreen.kz (Жанна, главред)",
        "email": "zhanna@bluescreen.kz",
        "cc": "info@bluescreen.kz",
        "subject": "16-летний школьник из KZ запустил AI-платформу возможностей Op Finder",
        "body": f"""Жанна, здравствуйте!

{SENDER['name_ru']}, {SENDER['age']} лет, школьник. Делаю Op Finder ({SENDER['site']}) — AI-платформу для молодёжи KZ: хакатоны, гранты, стажировки. Llama 3.3, три языка, production-ready.

Может получиться сильный технологический материал для Bluescreen — кейс самостоятельной разработки production AI-продукта школьником, со стеком React + Supabase + Groq, и реальными пользователями.

Готов на:
— интервью (онлайн/офлайн в Алматы),
— технический разбор стека,
— скриншоты, демо-видео, цифры.

Когда удобно?

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Медиа",
        "org": "The Tech / techkz.org",
        "email": "info@techkz.org",
        "subject": "Питч: AI-стартап Op Finder от 16-летнего школьника KZ",
        "body": f"""Здравствуйте!

{SENDER['name_ru']}, {SENDER['age']} лет, школьник. Делаю Op Finder ({SENDER['site']}) — AI-платформу возможностей для молодёжи Казахстана. Production, три языка, AI-агент.

Думаю, может быть интересный кейс для The Tech: молодой основатель + production AI-продукт + понятный бизнес-кейс. Готов на интервью, разбор стека, скриншоты, цифры.

Когда удобно?

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "Медиа",
        "org": "Digital Business Kazakhstan",
        "email": "info@digitalbusiness.kz",
        "subject": "Op Finder — AI-платформа возможностей для молодёжи KZ от 16-летнего фаундера",
        "body": f"""Здравствуйте!

{SENDER['name_ru']}, {SENDER['age']} лет, школьник. Делаю Op Finder ({SENDER['site']}) — AI-агрегатор возможностей: хакатоны, гранты, стажировки, летние школы. Production-ready, три языка, на собственном домене.

Возможные углы материала для Digital Business: цифровая молодёжь KZ, AI в EdTech, история фаундера.

Готов на интервью или письменные ответы. Когда удобно?

{SIG_RU}""",
        "lang": "ru",
    },

    # ============ ВЫЛОЖИТЕ ВАШИ СОБЫТИЯ — короткие письма для контент-партнёров ============
    # Цель: бесплатно опубликовать события, без обязательств, без partnership-обсуждения

    {
        "category": "📌 Выложите ваши события (KZ-хабы и школы)",
        "org": "Decentrathon team (Astana Hub × Blockchain & AI)",
        "email": "info@astanahub.com",
        "subject": "Decentrathon 5.0 — добавим на Op Finder, разошлём аудитории KZ-студентов",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']} лет, основатель Op Finder ({SENDER['site']}) — AI-платформы возможностей для молодёжи KZ.

Хочу анонсировать **Decentrathon 5.0** (27 марта – 5 апреля, Павлодар) у себя бесплатно:
— карточка события на главной + в каталоге
— рассылка по подписчикам (студенты-разработчики, AI-энтузиасты)
— AI-рекомендации Decentrathon релевантным юзерам по навыкам
— ваш логотип + Verified-бейдж на карточке

От вас нужно: подтвердить публикацию + (опционально) ссылка на лучшее описание/фото для карточки.

Это бесплатно и без обязательств — просто доп. канал распространения. Если интересно — напишите «ок», и я опубликую сегодня же.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши события (KZ-хабы и школы)",
        "org": "Astana IT University — мероприятия и хакатоны",
        "email": "info@astanait.edu.kz",
        "subject": "Op Finder — выложим ваши хакатоны и олимпиады бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']} лет, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей для молодёжи KZ.

Хочу публиковать **мероприятия Astana IT University** (хакатоны типа KMG Digital, олимпиады для абитуриентов, дни открытых дверей) бесплатно:
— карточка события + AI-рекомендации релевантным студентам и абитуриентам
— Verified-бейдж AITU
— аналитика заявок (города, школы, специальности)

От вас: список ближайших событий или ссылка на ваш календарь.

Если интересно — отвечу за час, опубликую сегодня. Без обязательств и без оплаты.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши события (KZ-хабы и школы)",
        "org": "Quantum STEM School (организаторы летних школ)",
        "email": "info@quantum.org.kz",
        "subject": "Op Finder — выложим ваши летние школы для школьников бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей. Сам в целевой аудитории Quantum.

Хочу публиковать **летние школы Quantum** (физика, математика, программирование) у себя бесплатно:
— рассылка по подписчикам-школьникам KZ
— AI-рекомендации Quantum 9-11 классам по интересу к точным наукам
— Verified-бейдж
— аналитика откликов

От вас: ссылка на текущий набор / описание.

Если интересно — выложу сегодня. Без обязательств.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши события (KZ-хабы и школы)",
        "org": "ISSAI Lab Nazarbayev University",
        "email": "issai@nu.edu.kz",
        "subject": "Op Finder — выложим Summer Research Program ISSAI бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей для молодёжи KZ.

Хочу анонсировать **ISSAI Summer Research Program 2026** (июнь-июль, NU) у себя:
— карточка с AI-рекомендациями целевым студентам (CS, Data Science, ML)
— Verified-бейдж NU/ISSAI
— автомат-рассылка подписчикам по интересам

Бесплатно, без обязательств. Если интересно — напишите «ок», опубликую сегодня. От вас нужно только подтверждение, что я могу использовать описание программы.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши события (KZ-хабы и школы)",
        "org": "NPG Research School (Nuclear Physics)",
        "email": "school@npg.kz",
        "subject": "Op Finder — выложим вашу летнюю школу 2026 бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей для молодёжи KZ.

Хочу опубликовать **NPG Research School 2026** (8-30 июня, Astana / NU) у себя бесплатно:
— карточка с автоматическими рекомендациями студентам/школьникам по интересу к физике/STEM
— рассылка по подписчикам
— Verified-бейдж NPG

Без обязательств. Если интересно — отвечайте, выложу сегодня.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши события (KZ-хабы и школы)",
        "org": "Astana Hub Pavlodar (региональный филиал)",
        "email": "info@astanahub.com",
        "subject": "Op Finder — публикуем ваши региональные события бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей для молодёжи KZ. Цель — чтобы региональные события не терялись на фоне Алматы/Астана.

Хочу публиковать **региональные события Astana Hub Pavlodar** (помимо Decentrathon 5.0) бесплатно:
— гео-таргетинг: события показываются студентам Павлодарской области в первую очередь
— AI-рекомендации
— Verified-бейдж филиала

От вас: список ближайших событий / контактное лицо для согласования контента.

Без обязательств, чисто доп. канал. Если интересно — отвечайте.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши вакансии и стажировки (корпорации)",
        "org": "Halyk Bank HR — стажировки",
        "email": "career@halykbank.kz",
        "cc": "info@halykbank.kz",
        "subject": "Halyk Start — публикация на Op Finder бесплатно (50K+ студенческой аудитории)",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-агрегатор возможностей для студентов KZ.

Хочу опубликовать **Halyk Start Internship Program** у себя бесплатно:
— карточка стажировки с AI-распределением целевым IT/Finance-студентам
— Verified-бейдж Halyk
— уведомление подписчиков по специальностям и городам
— аналитика заявок (ВУЗы, регионы, конверсия)

Без оплаты, без обязательств. От вас: подтверждение публикации + ссылка на форму подачи / описание программы.

Отвечу за час и опубликую сегодня. Когда удобно?

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши вакансии и стажировки (корпорации)",
        "org": "Kaspi.kz HR — Kaspi Lab",
        "email": "career@kaspi.kz",
        "cc": "press@kaspi.kz",
        "subject": "Kaspi Lab — выложим стажировку на Op Finder бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей для молодёжи KZ.

Хочу публиковать **Kaspi Lab Internship** у себя бесплатно:
— AI-таргетинг релевантным IT-студентам (3-4 курсы технических ВУЗов)
— Verified-бейдж Kaspi
— рассылка по подписчикам в Алматы
— аналитика откликов

Без обязательств. Просто канал распространения для HR.

От вас: ссылка на актуальную форму подачи / описание Kaspi Lab. Если интересно — отвечайте, выложу.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши вакансии и стажировки (корпорации)",
        "org": "EPAM Kazakhstan HR",
        "email": "kazakhstan@epam.com",
        "subject": "EPAM Python Internship — выложим на Op Finder бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-агрегатор возможностей для молодёжи KZ.

Хочу публиковать **EPAM Python Internship** (14 weeks) и другие ваши обучающие программы (.NET, Java, QA, Cloud) у себя бесплатно:
— AI-распределение релевантным студентам
— Verified-бейдж
— рассылка подписчикам по специальности
— аналитика заявок

Без обязательств — просто канал. Отвечайте «ок» и пришлите ссылки на актуальные программы — выложу сегодня.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши вакансии и стажировки (корпорации)",
        "org": "inDriver R&D HR (Алматы)",
        "email": "career@indriver.com",
        "subject": "inDriver Junior Internship — публикация на Op Finder бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-агрегатор возможностей для молодёжи KZ.

Хочу публиковать **стажировки и junior-вакансии inDriver** (Go, Mobile, ML) у себя бесплатно:
— AI-таргетинг по стеку и навыкам
— Verified-бейдж inDriver
— рассылка по подписчикам в Алматы

Без обязательств. От вас: ссылка на актуальные позиции / описание программы стажировок.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши вакансии и стажировки (корпорации)",
        "org": "Kolesa Group HR",
        "email": "hr@kolesa.kz",
        "subject": "Kolesa Group internships — выложим на Op Finder бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей для молодёжи KZ.

Хочу публиковать стажировки **Kolesa Group** (Backend Go/PHP, Mobile Swift/Kotlin, Frontend) у себя бесплатно:
— AI-таргетинг по стеку
— Verified-бейдж
— аналитика откликов

Без обязательств. От вас: список открытых позиций или ссылка на ваш career-page.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши вакансии и стажировки (корпорации)",
        "org": "Chocofamily Holding HR",
        "email": "hr@chocofamily.kz",
        "subject": "Chocofamily Engineering Trainee — публикация на Op Finder бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-агрегатор возможностей для молодёжи KZ.

Хочу публиковать **Chocofamily Engineering Trainee** и другие ваши junior-программы (Ruby, React, Mobile, QA) у себя бесплатно:
— AI-таргетинг по стеку и геолокации
— Verified-бейдж
— аналитика заявок

Без обязательств. От вас: ссылка на актуальные позиции.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши вакансии и стажировки (корпорации)",
        "org": "Air Astana HR — IT Internship",
        "email": "hr@airastana.com",
        "subject": "Air Astana IT Internship — выложим на Op Finder бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей для молодёжи KZ.

Хочу публиковать **Air Astana IT & E-Business Internship** у себя бесплатно:
— AI-распределение IT-студентам
— Verified-бейдж Air Astana
— рассылка подписчикам в Алматы
— аналитика откликов

Без обязательств. Если интересно — отвечайте, опубликую сегодня.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши вакансии и стажировки (корпорации)",
        "org": "Tinkoff KZ — Tinkoff Generation",
        "email": "career@tinkoff.kz",
        "subject": "Tinkoff Generation — публикация на Op Finder бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-агрегатор возможностей для молодёжи KZ. Сам в возрастной аудитории Tinkoff Generation :)

Хочу публиковать **Tinkoff Generation** и другие программы Tinkoff у себя бесплатно:
— AI-таргетинг школьникам/студентам с интересом к программированию
— Verified-бейдж Tinkoff
— рассылка по подписчикам KZ

Без обязательств. От вас: ссылка на актуальный набор.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши программы (международные)",
        "org": "DAAD WISE — летние стажировки в Германии",
        "email": "info@daad.kz",
        "subject": "DAAD WISE 2026 — выложим на Op Finder бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей для молодёжи KZ.

Хочу публиковать **DAAD WISE Internship** (летние исследовательские стажировки в Германии для STEM-бакалавров) и другие ваши стипендии у себя бесплатно:
— AI-таргетинг по специальности
— Verified-бейдж DAAD
— рассылка по STEM-подписчикам

Без обязательств. От вас: ссылка на актуальный приём DAAD WISE 2026.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши программы (международные)",
        "org": "China Scholarship Council (KZ-представительство)",
        "email": "consul.kz@mfa.gov.cn",
        "subject": "CSC Scholarships — выложим на Op Finder бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей для молодёжи KZ.

Хочу публиковать **China Scholarship Council** (CSC) программы для KZ-студентов у себя бесплатно:
— AI-таргетинг по уровню образования
— Verified-бейдж посольства
— рассылка подписчикам

Без обязательств. От вас: ссылка на актуальный приём.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши программы (международные)",
        "org": "Korean Cultural Center / NIIED",
        "email": "kazakhstan@kccuz.org",
        "subject": "GKS Scholarship — выложим на Op Finder бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей для молодёжи KZ.

Хочу публиковать **Global Korea Scholarship (GKS / KGSP)** и другие программы Korean Cultural Center у себя бесплатно:
— AI-таргетинг по уровню образования
— Verified-бейдж
— рассылка подписчикам

Без обязательств. От вас: ссылка на актуальный приём.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши программы (международные)",
        "org": "Konfuzius-Institut Almaty",
        "email": "info@confucius.kz",
        "subject": "Konfuzius программы — выложим на Op Finder бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей для молодёжи KZ.

Хочу публиковать программы **Институтa Конфуция** (китайские стипендии, языковые курсы, культурные программы) у себя бесплатно. AI-таргетинг по интересу к китайскому языку, рассылка подписчикам.

Без обязательств. От вас: ссылка на актуальный набор.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши программы (международные)",
        "org": "Hertie School Admissions",
        "email": "study@hertie-school.org",
        "subject": "Hertie School — list your KZ scholarship on Op Finder for free",
        "body": f"""Hello,

I'm {SENDER['name_en']}, {SENDER['age']}, founder of Op Finder ({SENDER['site']}) — Kazakhstan's AI platform for student opportunities.

I'd love to feature **Hertie School scholarships** (esp. Eastern Partnership scholarship for KZ students) on the platform for free:
— AI-driven recommendations to relevant Master applicants in policy/data
— Verified Hertie School badge
— Email digest to subscribers

No commitment, no fees — pure distribution channel. Send me a link to current openings and I'll publish today.

{SIG_EN}""",
        "lang": "en",
    },
    {
        "category": "📌 Выложите ваши программы (НКО, студ-сообщества)",
        "org": "AIESEC Kazakhstan (LC Almaty)",
        "email": "info.kz@aiesec.net",
        "subject": "AIESEC Global Volunteer/Talent — публикация на Op Finder бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-агрегатор возможностей для молодёжи KZ.

Хочу публиковать **AIESEC Global Volunteer** и **Global Talent** у себя бесплатно:
— AI-таргетинг по интересу к международному волонтёрству / стажировкам
— Verified-бейдж AIESEC
— рассылка подписчикам с английским B2+
— аналитика заявок

Без обязательств. От вас: контактное лицо для согласования контента + ссылки на текущие открытые роли.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши программы (НКО, студ-сообщества)",
        "org": "Enactus Kazakhstan",
        "email": "info@enactus.kz",
        "subject": "Enactus National Competition — выложим на Op Finder бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей для молодёжи KZ.

Хочу публиковать **Enactus National Competition** и другие ваши события у себя бесплатно. AI-таргетинг командам соц-предпринимателей в KZ ВУЗах. Verified-бейдж Enactus.

Без обязательств. От вас: ссылка на актуальный набор / описание.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши программы (НКО, студ-сообщества)",
        "org": "JCI Kazakhstan",
        "email": "info@jci.kz",
        "subject": "JCI TOYP и другие программы — выложим на Op Finder бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-платформа возможностей для молодёжи KZ.

Хочу публиковать **JCI TOYP** (Ten Outstanding Young Persons) и другие ваши программы у себя бесплатно. AI-таргетинг лидерским кандидатам, Verified-бейдж JCI.

Без обязательств. От вас: ссылка на актуальный набор / описание.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши программы (НКО, студ-сообщества)",
        "org": "Saby Foundation (грантовые программы)",
        "email": "info@saby.kz",
        "subject": "Saby Foundation gradute — выложим стипендии на Op Finder бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-агрегатор возможностей для молодёжи KZ.

Хочу публиковать **стипендии и гранты Saby Foundation** у себя бесплатно:
— AI-таргетинг релевантным студентам / выпускникам школ
— Verified-бейдж Saby
— рассылка подписчикам

Без обязательств. От вас: ссылка на актуальные конкурсы / стипендии.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши программы (Олимпиады)",
        "org": "Kangaroo Math KZ",
        "email": "info@kangaroo.kz",
        "subject": "Kangaroo 2026 — публикация на Op Finder бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-агрегатор возможностей для молодёжи KZ.

Хочу публиковать **Kangaroo Math Contest 2026** у себя бесплатно:
— AI-таргетинг школьникам с интересом к математике
— Verified-бейдж Kangaroo
— рассылка школам-партнёрам Op Finder

Без обязательств. От вас: ссылка на актуальный приём 2026.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши программы (МУН, дебаты)",
        "org": "Almaty MUN Society",
        "email": "info@almatymun.kz",
        "subject": "Almaty MUN 2026 — выложим на Op Finder бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-агрегатор возможностей для молодёжи KZ.

Хочу публиковать **Almaty MUN 2026** у себя бесплатно:
— AI-таргетинг школьникам/студентам с интересом к дебатам/международным отношениям
— Verified-бейдж AMUN
— рассылка подписчикам с английским B1+

Без обязательств. От вас: ссылка на регистрацию / описание.

{SIG_RU}""",
        "lang": "ru",
    },
    {
        "category": "📌 Выложите ваши программы (МУН, дебаты)",
        "org": "Astana MUN (NU MUN Society)",
        "email": "mun@nu.edu.kz",
        "subject": "Astana MUN 2026 — публикация на Op Finder бесплатно",
        "body": f"""Здравствуйте!

Я {SENDER['name_ru']}, {SENDER['age']}, основатель Op Finder ({SENDER['site']}) — AI-агрегатор возможностей для молодёжи KZ.

Хочу публиковать **Astana MUN** и другие ваши дебатные события у себя бесплатно. AI-таргетинг по интересу к дипломатии/политике, Verified-бейдж NU MUN.

Без обязательств. От вас: ссылка на актуальный приём.

{SIG_RU}""",
        "lang": "ru",
    },
]

# ----------------------------------------------------------------------------

def gmail_compose_url(to, subject, body, cc=None):
    """Generate a Gmail compose URL with prefilled fields."""
    params = {
        "view": "cm",
        "fs": "1",
        "to": to,
        "su": subject,
        "body": body,
    }
    if cc:
        params["cc"] = cc
    qs = urllib.parse.urlencode(params, quote_via=urllib.parse.quote)
    return f"https://mail.google.com/mail/?{qs}"

def mailto_url(to, subject, body, cc=None):
    """Standard mailto URL fallback."""
    params = {"subject": subject, "body": body}
    if cc:
        params["cc"] = cc
    qs = urllib.parse.urlencode(params, quote_via=urllib.parse.quote)
    return f"mailto:{to}?{qs}"

# Group drafts by category
categories = {}
for d in DRAFTS:
    categories.setdefault(d["category"], []).append(d)

# Build HTML
def esc(s):
    return html_lib.escape(s)

def build_card(idx, d):
    gmail = gmail_compose_url(d["email"], d["subject"], d["body"], d.get("cc"))
    mailto = mailto_url(d["email"], d["subject"], d["body"], d.get("cc"))
    cc_line = f'<div class="meta"><strong>CC:</strong> <code>{esc(d["cc"])}</code></div>' if d.get("cc") else ""
    body_id = f"body-{idx}"
    return f"""
<details class="card" id="card-{idx}">
  <summary>
    <span class="num">#{idx}</span>
    <span class="org">{esc(d["org"])}</span>
    <span class="badge">{esc(d["lang"].upper())}</span>
  </summary>
  <div class="meta"><strong>Кому:</strong> <code>{esc(d["email"])}</code></div>
  {cc_line}
  <div class="meta"><strong>Тема:</strong> {esc(d["subject"])}</div>
  <pre id="{body_id}">{esc(d["body"])}</pre>
  <div class="actions">
    <a class="btn primary" href="{esc(gmail)}" target="_blank" rel="noopener">📨 Открыть в Gmail (готовое письмо)</a>
    <a class="btn" href="{esc(mailto)}">✉ Открыть в почтовом клиенте</a>
    <button class="btn copy" data-target="{body_id}">📋 Скопировать тело</button>
    <button class="btn copy-subject" data-subject="{esc(d['subject'])}">Скопировать тему</button>
    <button class="btn copy-email" data-email="{esc(d['email'])}">Скопировать адрес</button>
  </div>
</details>
"""

cards_html = ""
for cat, items in categories.items():
    cards_html += f'<h2 class="category">{esc(cat)} <span class="count">({len(items)})</span></h2>\n'
    for d in items:
        idx = DRAFTS.index(d) + 1
        cards_html += build_card(idx, d)

html = f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Op Finder — Outreach Hub ({len(DRAFTS)} писем)</title>
<style>
  :root {{
    --bg: #0b0c10;
    --card: #15171c;
    --border: #2a2d36;
    --text: #e6e7eb;
    --muted: #9099a8;
    --accent: #6c8cff;
    --accent-hover: #8aa1ff;
    --green: #4ade80;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    margin: 0;
    padding: 24px;
    line-height: 1.55;
  }}
  .container {{ max-width: 880px; margin: 0 auto; }}
  h1 {{
    font-size: 28px;
    margin: 0 0 4px;
  }}
  .subtitle {{
    color: var(--muted);
    margin-bottom: 32px;
  }}
  .instructions {{
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 32px;
  }}
  .instructions h3 {{
    margin-top: 0;
    color: var(--accent);
  }}
  .instructions ol {{ margin: 0; padding-left: 20px; }}
  .instructions li {{ margin: 6px 0; }}
  h2.category {{
    font-size: 18px;
    color: var(--accent);
    margin: 32px 0 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
  }}
  .count {{ color: var(--muted); font-size: 14px; font-weight: normal; }}
  details.card {{
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    margin: 12px 0;
    overflow: hidden;
  }}
  details[open] {{
    border-color: var(--accent);
  }}
  summary {{
    cursor: pointer;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 12px;
    list-style: none;
    user-select: none;
    transition: background 0.1s;
  }}
  summary:hover {{ background: rgba(108, 140, 255, 0.08); }}
  summary::-webkit-details-marker {{ display: none; }}
  .num {{
    color: var(--muted);
    font-family: ui-monospace, monospace;
    font-size: 13px;
    min-width: 32px;
  }}
  .org {{
    flex: 1;
    font-weight: 500;
  }}
  .badge {{
    background: var(--border);
    color: var(--muted);
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 600;
  }}
  .meta {{
    padding: 8px 18px;
    color: var(--muted);
    font-size: 13px;
  }}
  .meta strong {{ color: var(--text); }}
  code {{
    background: rgba(255,255,255,0.05);
    padding: 2px 6px;
    border-radius: 3px;
    font-family: ui-monospace, monospace;
    font-size: 12px;
  }}
  pre {{
    margin: 8px 18px 12px;
    padding: 14px 16px;
    background: #0a0b10;
    border: 1px solid var(--border);
    border-radius: 8px;
    white-space: pre-wrap;
    font-family: ui-monospace, monospace;
    font-size: 13px;
    line-height: 1.6;
    max-height: 420px;
    overflow-y: auto;
  }}
  .actions {{
    padding: 12px 18px 18px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }}
  .btn {{
    background: var(--border);
    color: var(--text);
    border: 1px solid var(--border);
    padding: 8px 14px;
    border-radius: 8px;
    text-decoration: none;
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.1s;
  }}
  .btn:hover {{ background: #353945; }}
  .btn.primary {{
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }}
  .btn.primary:hover {{
    background: var(--accent-hover);
    border-color: var(--accent-hover);
  }}
  .btn.copied {{
    background: var(--green);
    color: black;
    border-color: var(--green);
  }}
</style>
</head>
<body>
<div class="container">

<h1>Op Finder — Outreach Hub</h1>
<p class="subtitle">{len(DRAFTS)} готовых писем для отправки. Кликнуть «Открыть в Gmail» → откроется готовое письмо в вашем Gmail-аккаунте → проверить → нажать Send.</p>

<div class="instructions">
  <h3>Как пользоваться</h3>
  <ol>
    <li>Кликните «📨 Открыть в Gmail» — откроется новая вкладка с готовым письмом (адрес, тема, тело уже подставлены).</li>
    <li>Вы залогинены в kanievbahtiar02@gmail.com — Gmail откроется именно в этом аккаунте.</li>
    <li>Прочитайте письмо, при необходимости подправьте, нажмите Send.</li>
    <li>Если хотите отправить через Apple Mail / другой клиент — нажмите «✉ Открыть в почтовом клиенте» (mailto:).</li>
    <li>Вернитесь сюда и кликните на следующее письмо.</li>
  </ol>
  <p style="color:var(--muted);font-size:13px;margin:12px 0 0;">
    <strong>Примечание:</strong> часть email-адресов — стандартные <code>info@</code> или <code>press@</code>; для нескольких организаций (Kaspi, Beeline, BI Group, Erasmus+, Fulbright, AlmaU) точные адреса PR-команды публично недоступны — указаны наиболее вероятные. Если письмо вернётся как недоставленное, найдите контакт через LinkedIn или контактную форму на сайте организации.
  </p>
</div>

{cards_html}

</div>

<script>
  // Copy buttons
  document.querySelectorAll('.btn.copy').forEach(btn => {{
    btn.addEventListener('click', () => {{
      const id = btn.dataset.target;
      const text = document.getElementById(id).textContent;
      navigator.clipboard.writeText(text);
      const orig = btn.textContent;
      btn.textContent = '✓ Скопировано';
      btn.classList.add('copied');
      setTimeout(() => {{
        btn.textContent = orig;
        btn.classList.remove('copied');
      }}, 1500);
    }});
  }});
  document.querySelectorAll('.btn.copy-subject').forEach(btn => {{
    btn.addEventListener('click', () => {{
      navigator.clipboard.writeText(btn.dataset.subject);
      const orig = btn.textContent;
      btn.textContent = '✓';
      btn.classList.add('copied');
      setTimeout(() => {{
        btn.textContent = orig;
        btn.classList.remove('copied');
      }}, 1200);
    }});
  }});
  document.querySelectorAll('.btn.copy-email').forEach(btn => {{
    btn.addEventListener('click', () => {{
      navigator.clipboard.writeText(btn.dataset.email);
      const orig = btn.textContent;
      btn.textContent = '✓';
      btn.classList.add('copied');
      setTimeout(() => {{
        btn.textContent = orig;
        btn.classList.remove('copied');
      }}, 1200);
    }});
  }});
</script>
</body>
</html>
"""

with open("/home/ubuntu/op-finder/op-finder-final/outreach/outreach_hub.html", "w") as f:
    f.write(html)

print(f"Built {len(DRAFTS)} drafts in outreach_hub.html")
print(f"Categories: {list(categories.keys())}")
