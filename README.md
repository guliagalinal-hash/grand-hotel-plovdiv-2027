# Новый год 2027 в Пловдиве — Grand Hotel Plovdiv 5★ (RU/BG landing)

Рекламный лендинг новогоднего предложения (не официальный сайт отеля). React + TypeScript, сборка esbuild,
две статические страницы `/ru/` и `/bg/`, серверная обработка заявок через Cloudflare Pages Functions + Brevo + Turnstile.
**Статус: предпросмотр. Ничего не опубликовано, DNS не менялся, в GitHub ничего не отправлено.**

## Быстрый просмотр (без установки)
Откройте `dist/ru/index.html` или `dist/bg/index.html` двойным щелчком. Работает и с `file://`
(форма при этом работает в демо-режиме: заявки не отправляются).

## Запуск
```bash
npm install
npm run dev            # http://localhost:5173/ru/  и  /bg/   (пересборка при изменениях)
npm run build          # production → dist/ru, dist/bg, dist/index.html (редирект), assets, images
npm run preview        # отдать готовый dist/
npm run images         # пересоздать public/images/*.webp из assets-src/images/ (sharp)
npm run test:inquiry   # офлайн-тесты серверной функции (Turnstile и Brevo подменены)
npx tsc -p tsconfig.functions.json   # проверка типов серверной функции
npm run typecheck      # проверка типов сайта (нужен @types/react из npm install)
```
Проверка цен по PDF: `node scripts/verify-prices.mjs docs/official_offer_2027.pdf` (нужен `pdftotext`).

## Структура
| Что | Где |
|---|---|
| Тексты RU / BG | `src/content/ru.ts`, `src/content/bg.ts` |
| Цены (из official_offer_2027.pdf) | `src/data/prices.ts` |
| Пути к фото и подписи | `src/data/images.ts`; фото `public/images/**` (оригиналы в `assets-src/images/**`) |
| Контакты, данные продавца, режим предпросмотра | `src/config.ts` |
| Секции сайта | `src/components/*` |
| Стили (Midnight Teal & Sand) | `src/styles.css` |
| Приём заявок | `functions/api/inquiry.ts` |
| Заголовки кэша / robots | `public/_headers`, `public/robots.txt` |

Баннер предпросмотра и подписи-дисклеймеры удалены. Фото банкетного зала — `assets-src/images/events/new-year-banquet-ai.png`, нижнее фото в разделе «Пловдив» — `assets-src/images/plovdiv/plovdiv-winter-sunset.png`.

Фото, которые переданы, но **не используются**: свадебные оригиналы (3), AI-иллюстрации SPA (2), парикмахерская, карточка «Platinum Casino» на ресепшене, прежняя панорама города.

## Cloudflare Pages
1. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → репозиторий `grand-hotel-plovdiv-2027`.
2. Build command: `npm run build` · Build output directory: `dist` · Root: `/`.
3. Variables (Settings → Environment variables): `NODE_VERSION` = `22`.
4. Папка `functions/` в корне репозитория подхватывается автоматически: адрес `/api/inquiry`.
5. Custom domain: `newyear.rootsandroads.com` (CNAME на `*.pages.dev`). Основной сайт на Tilda не затрагивается.
   DNS меняйте только после утверждения результата.

### Секреты (только в Cloudflare, не в GitHub)
Settings → Environment variables → **Production** (и Preview при необходимости), тип *Secret*:

| Переменная | Что это |
|---|---|
| `BREVO_API_KEY` | API-ключ Brevo (v3) |
| `BREVO_SENDER_EMAIL` | **подтверждённый** отправитель в Brevo (Senders & IP) |
| `FORM_RECIPIENT_EMAIL` | `info@wordofethnic.com` |
| `TURNSTILE_SECRET_KEY` | секретный ключ Turnstile |
| `ALLOWED_ORIGINS` | необязательно: доп. адреса через запятую (например preview-адрес `*.pages.dev`) |

Публичный ключ Turnstile — **не секрет**, он вшивается при сборке: добавьте переменную сборки `TURNSTILE_SITE_KEY`
(Settings → Environment variables, обычная переменная, а не Secret) и пересоберите проект.
Пока `TURNSTILE_SITE_KEY` пуст, форма проверяет поля, но **ничего не отправляет** и честно пишет об этом.

### Brevo
1. Brevo → Senders, domains & dedicated IPs → добавьте и подтвердите отправителя (лучше домен `wordofethnic.com` с DKIM/SPF).
2. SMTP & API → API keys → создайте ключ → `BREVO_API_KEY`.
3. Письмо уходит от `BREVO_SENDER_EMAIL` на `FORM_RECIPIENT_EMAIL`; адрес клиента — только в Reply-To.

### Turnstile
Cloudflare → Turnstile → Add site → домен `newyear.rootsandroads.com` (и `*.pages.dev` для проверки), виджет Managed.
Site key → `TURNSTILE_SITE_KEY`, Secret key → `TURNSTILE_SECRET_KEY`.
Для локальных тестов Cloudflare даёт тестовые ключи: site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`.

### Защита от повторов и частых запросов (опционально, рекомендуется)
Создайте KV namespace и привяжите к проекту (Settings → Functions → KV bindings) под именем `INQUIRY_KV`.
Тогда лимит (5 заявок в час с одного IP; IP хранится только в виде хэша) и защита от дублей работают между всеми экземплярами.
Без KV лимит работает «по возможности» (в памяти экземпляра); добавьте правило Rate limiting в Cloudflare WAF для `/api/inquiry`.

### Локальная проверка функции с реальным окружением
`cp .dev.vars.example .dev.vars` (файл в .gitignore) → вписать ключ Brevo → `npm run build && npx wrangler pages dev dist`.
**Реальная отправка запустит настоящее письмо** — делайте это только с разрешения владельца.

## Как работает форма
Поля: имя, email, телефон (обязательные), комментарий (необязательный) и согласие на обработку данных.
1. Посетитель отправляет форму; браузер шлёт только эти поля, язык страницы и одноразовый токен Turnstile.
2. Функция проверяет Origin, форматы и длины, ловушку для ботов и Turnstile.
3. Brevo отправляет уведомление на `FORM_RECIPIENT_EMAIL`; адрес клиента стоит только в Reply-To.
4. Клиент видит «заявка отправлена» только после ответа `{"ok":true}`. Без ключа Turnstile или при любой ошибке показывается сообщение с телефоном и email — ложного подтверждения нет.
5. В логи персональные данные не пишутся. Цены в заявке не передаются.

## Контакты
Телефон и email заданы в `src/config.ts → contact`. Viber показан как подпись с номером **без кнопки**: ссылка `viber://chat?number=%2B359895396896` не была проверена на реальных устройствах. После проверки её можно вернуть (компонент `ContactCard` в `src/components/Sections.tsx`).

## Чек-лист перед публикацией
1. **Права на фото.** Владелец подтвердил использование фотографий (часть исходно с Booking.com) — сохраните подтверждение.
2. **Цены и условия продажи.** Подтвердите у продавца розничные цены. В PDF: цены проживания и пакета включают 10% комиссию оператора, а цена отдельного гала-ужина (220 € / 132 €) — **не включает**. Решите, какую цену показывать на сайте.
3. **Юридические данные продавца** (`src/config.ts → seller`): название, адрес, регистрационный номер, лицензия/страхование туроператора; **политика конфиденциальности и условия обработки персональных данных** (`seller.privacyUrl`).
4. Условия для детей и допкроватей в PDF указаны только для проживания — подтвердите для пакета.
5. Секреты и Turnstile (см. выше), тест одной реальной заявки с разрешения владельца.
6. Удалить `<meta name="robots" content="noindex, nofollow">` в `index.html` и `Disallow: /` в `public/robots.txt` (сейчас сайт закрыт от индексации).
7. AI-иллюстрации (главный зал, Пловдив) подписаны как иллюстрации — не убирайте подписи.
8. Подключить аналитику/cookie-баннер, если требуется.

## Конфигурация развёртывания (подготовлено, не подключено)
Конфигурация в репозитории:
- `.node-version` — Node 22 для сборки;
- `public/_routes.json` — функции запускаются только для `/api/*`, статика отдаётся напрямую;
- `public/_headers` — кэш для `/assets/*` и `/images/*`, базовые заголовки безопасности;
- `functions/api/inquiry.ts` — приём заявок;
- `dist/ru/`, `dist/bg/` — две отдельные страницы; `dist/index.html` — редирект на `/ru/` или `/bg/` по языку браузера.

Настройки проекта в Cloudflare: Framework preset — None · Build command `npm run build` · Build output directory `dist`.
Переменные и секреты — в разделе выше. Домен `newyear.rootsandroads.com` подключается только после вашего подтверждения; пока сайт закрыт от индексации.
Проверка с реальным Cloudflare (деплой, Functions, Turnstile) ещё не выполнялась.

## Загрузка в GitHub с вашего компьютера
Репозиторий: `https://github.com/guliagalinal-hash/grand-hotel-plovdiv-2027` (**рекомендуется сделать его приватным** — в проекте есть оригиналы фото отеля).
1. Распакуйте архив, откройте терминал в папке `plovdiv-new-year-2027`.
2. `npm install` — создаст `package-lock.json` (его нужно закоммитить: в облачной среде без интернета его создать было нельзя).
3. `npm run build` и `npm run test:inquiry` — убедитесь, что всё собирается.
4. `git init -b main` → `git add .` → **`git status`**: в списке не должно быть `node_modules`, `dist`, `.env`, `.dev.vars`.
5. `git commit -m "Landing: New Year 2027 at Grand Hotel Plovdiv"`.
6. `git remote add origin https://github.com/guliagalinal-hash/grand-hotel-plovdiv-2027.git`
7. Если репозиторий пустой: `git push -u origin main`.
   Если в нём уже есть файлы (например README): `git pull origin main --allow-unrelated-histories`, решите возможные конфликты, затем `git push -u origin main`.
8. Авторизация GitHub (браузер, Personal Access Token или GitHub Desktop) выполняется вами.

Файл `docs/official_offer_2027.pdf` (коммерческие условия оператора) и неиспользуемые оригиналы фото перечислены в `.gitignore` и в репозиторий не попадут.
