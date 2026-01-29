# Mood Tracker

Minimal Laravel 12 + Inertia + React experience to log how you feel, keep history, and surface playful insights.

## Requirements

- PHP 8.2+ with PDO and OpenSSL
- Composer
- Node.js (18+) / npm
- PostgreSQL (local dev database: `mood_tracker`)
- Tailwind-compatible build (`npm run dev`)

## Local setup

1. `cp .env.example .env`
2. Update `.env` with actual PostgreSQL credentials and Google OAuth values (see below).
3. Create the database: `createdb mood_tracker` (or use your preferred Postgres client).
4. `composer install`
5. `php artisan key:generate`
6. `php artisan migrate --seed`
7. `npm install`
8. `npm run dev`
9. Visit `/` to start logging after authenticating via Google.

## Google OAuth

- Redirect URI: `http://localhost/auth/google/callback`
- Register the app in Google Cloud Console and paste the client ID/secret into `.env`.
- The `/auth/google` and `/auth/google/callback` routes are wired through Socialite; newly authenticated users are created automatically.

## Vultr deployment hints

1. **Webserver**: Use Nginx with PHP-FPM (PHP 8.2+) and point the document root to `public/`.
2. **Process management**: Supervisor can keep queue workers running once notifications or background jobs are added.
3. **Scheduler**: Add a cron job like `* * * * * php /path/to/artisan schedule:run >> /dev/null 2>&1` for future notification dispatches.
4. **Environment**: Copy `.env.example`, set `APP_ENV=production`, and configure Postgres credentials backed by a Vultr database or managed service.
5. **Domain**: Target `mood.brendonbaugh.com` with a TLS certificate and force HTTPS in Nginx.

## Scheduler

- Run `php artisan mood:send-reminders` to dispatch any due reminders immediately.
- Add the scheduler cron: `* * * * * php /path/to/artisan schedule:run >> /dev/null 2>&1` so reminders can fire on the configured cadence.

## Commands

- `php artisan migrate --seed`
- `php artisan test`
- `npm run dev`

## Testing

`php artisan test` runs the feature suite that verifies auth gating and mood entry creation.
