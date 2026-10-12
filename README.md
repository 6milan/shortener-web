# Snipp web (Part 2)

Next.js 15 (App Router) + TypeScript + Tailwind + Framer Motion frontend for the Django URL shortener API (Part 1).

## Run

    npm install
    cp .env.example .env.local     # set NEXT_PUBLIC_API_URL and optionally NEXT_PUBLIC_GOOGLE_CLIENT_ID
    npm run dev                    # http://localhost:3000
    npm test                       # API client logic tests
    npm run build && npm start     # production

Start the API first (Redis, `runserver`, Celery worker). Its `CORS_ALLOWED_ORIGINS` must contain this app's origin.

## Structure

    app/                 routes: / (landing), (auth)/login|register, (app)/dashboard, dashboard/links/[code], dashboard/settings
    components/          ui primitives (button, field, modal, ...), charts, links list, create/edit/QR modals
    context/             auth (session + refresh), toast, theme
    lib/api.ts           API client: token storage, single-flight refresh, idempotent create with retries, 429 handling
    lib/format.ts        dates, clipboard, password strength, safe ?next=
    tests/api.test.ts    refresh single-flight, same-key retries, error mapping, logout on rejected refresh

## Key behaviours

- **Tokens:** access + refresh in localStorage. On 401 the client refreshes once (shared by all parallel requests and by all tabs via Web Locks), stores the *rotated* refresh token and retries the request. A rejected refresh token signs the user out everywhere.
- **Idempotent create:** one `crypto.randomUUID()` per submission; reused on retry while the form data is unchanged. The client auto-retries network errors, 502/503/504, 409 and one short 429, always with the same key.
- **Rate limits:** `Retry-After` is read from 429 responses and shown to the user.
- **Dashboard:** debounced search, filters, sorting, paging, optimistic enable/disable with rollback, stale-response protection, QR modal and PNG download.
- **Route guard:** unauthenticated visitors go to `/login?next=...`; `next` is validated to stay in-app.
