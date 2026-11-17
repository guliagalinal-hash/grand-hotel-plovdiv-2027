# Подключение заявок через Google Таблицу (без Brevo)

Таблица: https://docs.google.com/spreadsheets/d/1v87A_tmHY7sAzkiU53N-sIgQshI8N5c86r2O-WMlUjw/edit

1. Откройте таблицу → **Расширения → Apps Script**.
2. Вставьте код из `integrations/google-apps-script/Code.gs` вместо содержимого `Code.gs`. Сохраните.
3. Apps Script → **Настройки проекта → Свойства скрипта**:
   - `SHEET_ID`: `1v87A_tmHY7sAzkiU53N-sIgQshI8N5c86r2O-WMlUjw`
   - `NOTIFY_EMAIL`: `info@wordofethnic.com`
   - `INQUIRY_TOKEN`: сгенерируйте случайную строку длиной от 32 символов. **Не присылайте её в чат**.
4. **Развернуть → Новое развертывание → Веб-приложение**. Выполнять от своего имени, доступ «Все». Подтвердите разрешения Google. Скопируйте URL вида `https://script.google.com/macros/s/.../exec`.
5. Cloudflare Pages → проект → Settings → Variables and Secrets. В **Preview** добавьте:
   - `GOOGLE_SCRIPT_URL` (Secret): URL веб-приложения из шага 4
   - `GOOGLE_SCRIPT_TOKEN` (Secret): тот же токен из шага 3
   - `TURNSTILE_SECRET_KEY` (Secret): секрет Cloudflare Turnstile
   - `TURNSTILE_SITE_KEY` (обычная переменная сборки): публичный ключ Turnstile
6. Пересоберите Preview и отправьте тестовую заявку. Проверьте **и новую строку в таблице, и письмо**.
7. После успешной проверки и согласования публикации перенесите переменные в Production и опубликуйте согласованную ветку.

Важно: URL Google Apps Script является публичным техническим адресом, но обработчик отклоняет запросы без секретного токена. Токен хранится только в Cloudflare и в свойствах Apps Script. Проверка Turnstile и расчёт суммы выполняются сервером Cloudflare.

При изменении кода Apps Script необходимо создать новую версию развертывания.
