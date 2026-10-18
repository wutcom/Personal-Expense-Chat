# Phase 2 checklist

Source: `expense_chat_codex_plan.md`, phase 2. Based on merged Phase 1 (`62d3eee`); the original plan is unchanged.

## Implementation

- [x] Seven-table versioned migration matching the plan, constraints and indexes.
- [x] Owner-only RLS for all tables; explicit authenticated privileges and no anonymous table access.
- [x] Composite category/user foreign keys prevent foreign-category references.
- [x] Automatic profile/default-settings creation, backfill, narrow bootstrap trigger and updated timestamps.
- [x] Typed Supabase SSR browser/server clients using a public key; reject secret/service-role public configuration.
- [x] Next.js 16 Proxy refreshes cookies on both request and response, retaining private/no-store headers.
- [x] Independent server validation in layout, private pages, account API, password action; never authorize from `getSession()`.
- [x] Thai signup/sign-in/reset email/new-password/sign-out forms with validation, pending states and safe errors.
- [x] Safe signup/recovery token confirmation and PKCE callback; fixed destinations prevent open redirects.
- [x] Authenticated account GET/PATCH, strict Zod ownership rejection and same-origin write check.
- [x] Setup guide, email templates, environment example, test scope and remaining live checks.

## Automated verification

- [x] Actual migration executes on PostgreSQL (PGlite), including bootstrap triggers.
- [x] A/B isolation tests on all seven tables: select, foreign insert/update/delete, ownership transfer, anonymous access.
- [x] Composite foreign keys and default settings tested.
- [x] Account handlers tested against PostgreSQL/RLS with an Auth identity stub and query adapter.
- [x] Verified/revoked/absent/anonymous sessions, action validation, signup confirmation, reset and sign-out errors tested.
- [x] Callback destinations, invalid tokens and refreshed cookie propagation tested.
- [x] Final lint, formatting, typecheck, tests and production build.
- [x] Production HTTP smoke with missing configuration: private-page redirects, setup notice, API fail-closed response.

## Still requires a configured development Supabase project

- [ ] Apply migration to the hosted project.
- [ ] Real Supabase Auth/PostgREST JWT integration, email delivery, signup, recovery and sign-out in browser.
- [ ] Browser visual check at 360px and desktop.

No hosted migration or deployment is claimed. Tests run the real SQL/RLS, but stub the Auth identity and use a PostgreSQL query adapter for the API tests; they do not simulate a live Supabase Auth/PostgREST service.

## Final recorded results

- `npm run lint`: passed, zero warnings/errors.
- `npm run format:check`: passed.
- `npm run typecheck`: passed in strict mode.
- `npm test`: 10 files, 92 tests passed.
- `npm run build`: passed after clearing a stale local Turbopack cache; private routes are dynamic.
- `npm run test:smoke`: 12 production HTTP paths passed. Root redirects to chat; five workspace routes and password update redirect to login; login shows the setup notice; account API returns 503; invalid callbacks stay on local login paths; unknown route returns 404. Sensitive responses carry no-store.
- Production smoke found and fixed two regressions: malformed/blank project URLs no longer throw during configuration validation, and callback redirects use relative paths so proxy-normalized hosts cannot change the destination origin. Regression coverage is retained.
- API profile writes compare Origin with validated canonical SITE_URL, not proxy-normalized request URLs.
