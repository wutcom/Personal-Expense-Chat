# Personal Expense Chat

Thai-first, mobile-first expense tracker using Next.js App Router, strict TypeScript, Tailwind CSS, Supabase Auth, and a private Google Sheets ledger. The [Google Sheets setup guide](docs/google-sheets-setup.md) describes the current storage design; [the original plan](expense_chat_codex_plan.md) describes the earlier PostgreSQL approach.

## Local setup

Use Node.js 24 LTS (`nvm use`) and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. `/` redirects to `/chat`; unauthenticated workspace requests redirect to `/login`. Without Supabase configuration, login shows a setup notice and does not collect credentials. The build and automated tests do not require a Supabase project, secrets, Docker, or paid services.

Configure login through [Supabase Auth](docs/supabase-setup.md) and the ledger through [Google Sheets setup](docs/google-sheets-setup.md). The chat, history, and dashboard do not require the Supabase SQL migration. The separate profile API still uses its existing PostgreSQL table. Do not paste credentials into chat or commit `.env.local`.

## Commands

| Command                | Purpose                                             |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Development server                                  |
| `npm run build`        | Production build and route generation               |
| `npm start`            | Serve the production build                          |
| `npm run lint`         | Next.js/TypeScript ESLint rules, zero warnings      |
| `npm run format`       | Apply Prettier                                      |
| `npm run format:check` | Check formatting                                    |
| `npm run typecheck`    | Strict TypeScript checks                            |
| `npm test`             | Component, auth, API, and real PostgreSQL RLS tests |
| `npm run test:watch`   | Watch tests                                         |
| `npm run check`        | Lint, formatting, types, tests, and build           |

`npm run test:smoke` starts a temporary production server on port 3103 and checks 12 HTTP paths in unconfigured mode. Run it after `npm run build` without Supabase environment values. It is separate from `npm test` because it needs build output and an available local port.

## Current behavior

- Responsive Thai shell with desktop sidebar and mobile bottom navigation; `/chat`, `/dashboard`, `/budgets`, `/history`, `/settings`, `/login`.
- Email/password sign-in, signup with email confirmation, reset email, `/reset-password`, sign out, and safe confirmation/PKCE callbacks.
- Server-validated identity via `auth.getUser()` in every private page, shared layout, password action, and account API. Proxy refreshes cookies; authorization does not rely on Proxy or an unverified cookie session.
- Seven versioned tables from the plan, owner RLS, composite category-owner foreign keys, timestamp triggers, and automatic profile/settings initialization for new and existing Auth users.
- `GET /api/account` reads the authenticated user's profile. `PATCH /api/account` accepts only `{ "display_name": "Name" }`; rejects a caller-supplied `user_id`, requires an `Origin` header matching the validated canonical `SITE_URL` and JSON body, and updates only the authenticated user. RLS independently protects the row.
- Authenticated responses are dynamic and private/no-store. No service worker or private-data caching is introduced.
- The configured owner can record expenses and refunds from chat. The server appends to `Transactions` in Google Sheets. History and monthly totals read from the same sheet; no financial rows are written to PostgreSQL.
- Editable budgets, transaction editing, export, and PWA installation are outside this change.

## Architecture and standards

```text
src/app/(auth)/              Login, password form, server actions
src/app/(app)/               Server-protected workspace pages and layout
src/app/auth/                Email confirmation and PKCE callbacks
src/app/api/account/         Authenticated, owner-scoped profile API
src/components/              Shared shell and small client form boundaries
src/lib/auth/                Server-only session validation
src/lib/expenses/            Expense parser, totals, and server-only Sheets adapter
src/lib/supabase/            Typed browser/server clients and cookie refresh
src/lib/validation/          Zod input schemas
src/types/                   Database and action-state contracts
src/proxy.ts                 Next.js 16 session refresh, private cache headers
supabase/migrations/         Versioned SQL only
tests/                      Components, auth, API, PostgreSQL/RLS tests
```

Use Server Components by default, strict types, `@/*` imports, Zod at write boundaries, accessible forms, semantic HTML, and visible focus states. Do not trust caller-supplied identities or `getSession()` for authorization. Keep Google credentials server-only. The existing profile API uses the Supabase publishable key with the logged-in user's JWT and RLS.

The ledger uses Thai, THB, and Asia/Bangkok. It stores numeric amounts in baht and calculates totals in integer satang. Sheets writes are not automatically retried; see the setup guide for how to reconcile uncertain writes. No offline financial writes are supported.

## Verification and remaining scope

See [Phase 1 checklist](docs/phase-1-checklist.md) and [Phase 2 checklist](docs/phase-2-checklist.md). The latter supersedes Phase 1's public-route/auth-placeholder state.

`npm test` runs the actual migration against PGlite (PostgreSQL compiled to WebAssembly) using separate `authenticated`/`anon` roles. It tests all seven tables for owner reads and blocked foreign reads/writes, ownership transfer, anonymous access, and cross-owner category references. API tests use the actual route handlers plus a PostgreSQL query adapter; Auth identity is mocked at that boundary. Auth actions, invalid sessions, token callbacks, cookie refresh, validation, and accessible form modes are also tested.

These tests **do not replace hosted Supabase integration testing**: real GoTrue JWT/cookie handling, PostgREST, email delivery, and browser confirmation/recovery must be checked against a configured development Supabase project. See the manual checklist in the setup guide. No hosted database migration or Vercel deployment is performed by this change.

The Sheets tests cover Thai command parsing, Bangkok month boundaries, owner checks, RAW append payloads, and error handling with mocked Google requests. A live write requires your private Sheet and Service Account; use the manual check in the setup guide after configuring them.
