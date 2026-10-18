# Personal Expense Chat

Thai-first, mobile-first expense tracker. Phase 1 implements the application foundation from [the implementation plan](expense_chat_codex_plan.md).

## Requirements and local setup

Use Node.js 24 LTS (`nvm use`) and npm. No paid service or API is required for Phase 1.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. `/` redirects to `/chat`. Environment values can remain empty in this phase. No font downloads or Supabase connection are required to build.

## Commands

| Command                | Purpose                                                       |
| ---------------------- | ------------------------------------------------------------- |
| `npm run dev`          | Local development server                                      |
| `npm run build`        | Production compilation and route generation                   |
| `npm start`            | Serve the production build                                    |
| `npm run lint`         | ESLint with Next.js and TypeScript rules; no warnings allowed |
| `npm run format`       | Apply Prettier formatting                                     |
| `npm run format:check` | Verify formatting without writing                             |
| `npm run typecheck`    | Strict TypeScript checks                                      |
| `npm test`             | Run Vitest component and navigation tests once                |
| `npm run test:watch`   | Watch tests during development                                |
| `npm run check`        | Run lint, format check, types, tests, and build               |

## Phase 1 scope

- Next.js App Router, strict TypeScript, Tailwind CSS v4, and a committed npm lockfile.
- Thai page language, responsive desktop sidebar and five-item mobile bottom navigation, active route states, skip link, focus indicators, and safe-area spacing.
- `/chat`, `/dashboard`, `/budgets`, `/history`, `/settings`, `/login`, root redirect, and a not-found page.
- Honest empty states. Chat input is disabled; totals are unknown rather than fabricated. Login does not collect credentials yet.
- Browser-visible code contains no secrets. `.env.local` and other real environment files are ignored; `.env.example` contains placeholders only.

**This scaffold is not ready to store personal financial data.** Routes are currently public and contain no user records. Authentication, server authorization, database migrations, RLS, and cross-user isolation belong to Phase 2. The Phase 1 login page is a placeholder, not an authentication implementation.

## Architecture and coding standards

```text
src/app/                     App Router pages and route-group layouts
src/app/(auth)/login/         Future Supabase authentication screen
src/app/(app)/                Shared workspace routes
src/components/layout/       Shell, navigation, headings, empty states
src/lib/navigation.ts        Typed navigation definitions
tests/                      Vitest and React Testing Library
```

Keep pages/layouts as Server Components by default. Only the navigation needs a client boundary to read the active pathname. Use `@/*` imports, strict types, semantic HTML, accessible names, and visible focus styles. Shared design tokens and responsive rules live in `src/app/globals.css`, which imports Tailwind; utilities can be used alongside these component styles.

In subsequent phases, put Supabase SSR clients under `src/lib/supabase/`, command parsing/execution under `src/lib/commands/`, request validation under `src/lib/validation/`, and all SQL in `supabase/migrations/`. Add Zod validation when request handling is introduced. Authorize on the server and enforce owner RLS. Never expose a service-role key. Financial commands must execute atomically with per-user UUID idempotency keys. Do not add AI, paid services, offline financial writes, or caching of private records.

The intended defaults are Thai (`th-TH`), THB, and Asia/Bangkok. No financial calculations, date filters, or persisted settings are implemented yet.

## Tests and acceptance boundaries

Component tests cover every route's page heading, active navigation in both shells, navigation destinations, the main-content skip target, root redirect, disabled writes, unknown totals, and the explicit authentication placeholder. See [Phase 1 checklist](docs/phase-1-checklist.md) for completed checks and remaining phase ownership.

The plan's database isolation, transaction idempotency, balance arithmetic, Bangkok boundaries, void audit trail, command parsing, budget copy, and PWA installation criteria require later phases. They are not claimed as passing in Phase 1.

## Next phase

Add Supabase migrations, owner RLS, email/password authentication and password reset, SSR session validation, protected routes, and real cross-user isolation tests. Add deployment and PWA setup in the phases specified by the plan.
