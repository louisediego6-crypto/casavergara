# Casa Vergara Resort – Laravel 11 version

This is the original plain-PHP project (`resorts/`) converted to Laravel. The website, pages, CSS/JS and every
API behaviour are the same; only the plumbing changed (routing, sessions, config, database setup).

## Setup

Requirements: PHP 8.2+ (with `pdo_mysql`, `mbstring`, `curl`, `fileinfo`), Composer, MySQL/MariaDB (XAMPP is fine).

```bash
composer install
cp .env.example .env
php artisan key:generate
# create an empty database called casa_vergara (phpMyAdmin or: mysql -e "CREATE DATABASE casa_vergara CHARACTER SET utf8mb4")
php artisan migrate --seed
php artisan serve          # http://localhost:8000
```

Edit `.env` for the database password, `APP_URL`, and the keys that used to live in `config/secrets.php`
(`MAIL_USERNAME` / `MAIL_PASSWORD` for Gmail SMTP, `CVR_AI_API_KEY`, `CVR_GIPHY_API_KEY`, …). Make sure `storage/` and `public/uploads/` are writable.
If you serve it over HTTPS set `SESSION_SECURE_COOKIE=true`.

`php artisan migrate --seed` gives you the same starter data as the old SQL import (admin + event-manager logins,
FAQs, terms, packages, site content, team).

## Where things went

| Old | New |
|---|---|
| `api/<group>/<name>.php` | `POST/GET /api/<group>/<name>` → `app/Http/Controllers/Api/...` (routes in `routes/cvr_api.php`) |
| `pages/*.html` | `resources/views/pages/*.blade.php`, served at the same URLs (`/pages/login.html`, `/pages/admin/dashboard.html`) |
| `css/ js/ images/` | `public/css`, `public/js`, `public/images` (JS only changed to drop `.php` from API URLs) |
| `uploads/` | `public/uploads/` (chat attachments are now private: `storage/app/uploads/chat/`) |
| `config/config.php`, `mail.php`, `secrets.php` | `config/cvr.php` + `.env` |
| `includes/functions.php`, `live_chat.php`, reminders, catalogs | `app/Support/*.php` (autoloaded helpers, same function names) |
| `database/*.sql` | `database/migrations/*` + `database/seeders` |
| `scripts/send-*-reminders.php` | `php artisan reminders:checkin` / `reminders:checkout`, or `/scripts/send-checkin-reminders?key=…` |
| PHP `$_SESSION` | Laravel session (file driver) |

## Things you should know

* **Not ported on purpose:** `api/chat/upload.php`, `api/chat/gif-search.php`, `api/chat/delete-message.php`. They call functions
  that exist nowhere in the original code (`cvr_chat_blocked_extension`, `cvr_chat_unlink_attachment`, …) so they crashed in
  the original too, and the front-end never calls them (it uses `chat/send`, `chat/gifs`, `chat/delete`).
* **Schema fix:** the original SQL import never created `event_packages.max_pax / extra_pax_rate / is_flat_rate / double_rate_on_24hr`,
  yet `content/packages` and `admin/packages-list` select them. They are included in the migration.
* The SQL layer is still parameterised SQL through Laravel's PDO connection (same queries as before) so behaviour stays identical.
* Database sessions use `strict => false` and a `+08:00` time zone to match the original XAMPP behaviour.
* Like the original, API POSTs have no CSRF token (session cookie is `SameSite=Lax`).
* Existing chat files from an old install must be moved from `uploads/chat/` to `storage/app/uploads/chat/`.
* Gemini model default is the value from your `secrets.php` (`gemini-3.8-flash`); change `CVR_AI_MODEL` if Google rejects it.
