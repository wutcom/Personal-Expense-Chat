# Personal Expense Chat — Implementation Plan for Codex

## Goal
Build a Thai-first, mobile-first private expense tracking PWA replacing LINE OA chat commands. Stack: Next.js App Router + TypeScript, Tailwind CSS, Supabase Auth/PostgreSQL/RLS, Vercel Hobby. No paid APIs or LLM in MVP.

## Product requirements
- Email/password login, protected routes, per-user isolation.
- Chat interface with command parser and persisted user/assistant messages.
- Budget categories: slug supports letters, digits and hyphens (e.g. `7-11`, `rent-h`, `uob-c`).
- Per-month category budgets, spending and refunds; monthly remainder = planned - expenses + refunds.
- Month-specific dashboards, category progress, history with search/edit/void.
- Copy previous month budget idempotently; never overwrite current-month budgets without confirmation.
- Undo last transaction as a soft-void, with auditability.
- PWA installable, responsive, Thai locale, Asia/Bangkok dates, THB currency.
- Export transactions CSV, UTF-8 BOM for Excel Thai compatibility.

## Tech architecture
- Next.js App Router, TypeScript strict, Tailwind, optionally shadcn/ui, Recharts, Zod.
- Supabase SSR Auth via @supabase/ssr. Server-side authorization and Postgres RLS for all user data.
- Route handler POST /api/chat/execute: authenticated; Zod validation; command parsing; transactional execution through Postgres RPC or a single database transaction; return typed structured reply. Use client-generated UUID idempotency key per message.
- No Supabase service-role key in browser. Public anon/publishable key is permitted; RLS mandatory.
- Vercel hosting, Supabase free tier (subject to changing limits). Avoid background workers/paid services.

## Database schema (Postgres SQL)
```sql
create extension if not exists pgcrypto;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  display_name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, slug),
  unique (id, user_id)
);

create table public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null,
  month date not null check (extract(day from month) = 1),
  planned_amount numeric(14,2) not null check (planned_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id, month),
  foreign key (category_id, user_id) references public.categories(id, user_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null,
  kind text not null check (kind in ('expense','refund')),
  amount numeric(14,2) not null check (amount > 0),
  note text,
  occurred_at timestamptz not null default now(),
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (category_id, user_id) references public.categories(id, user_id)
);
create index transactions_user_date_idx on public.transactions(user_id, occurred_at desc);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  body text not null,
  response_json jsonb,
  created_at timestamptz not null default now()
);
create index chat_messages_user_date_idx on public.chat_messages(user_id, created_at desc);

create table public.command_executions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key uuid not null,
  command_text text not null,
  result_json jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, idempotency_key)
);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'Asia/Bangkok',
  currency text not null default 'THB',
  language text not null default 'th'
);

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.transactions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.command_executions enable row level security;
alter table public.user_settings enable row level security;

-- Generate equivalent CRUD policies for each table; use the authenticated role.
create policy profiles_owner on public.profiles for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy categories_owner on public.categories for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy monthly_budgets_owner on public.monthly_budgets for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy transactions_owner on public.transactions for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy chat_messages_owner on public.chat_messages for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy command_executions_owner on public.command_executions for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy user_settings_owner on public.user_settings for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
```

### SQL reporting
Monthly aggregation must use Asia/Bangkok calendar boundaries converted to timestamptz. Only non-voided transactions count. Expense adds spending; refund subtracts spending. If refund exceeds expenses, allow a negative net expense and display accurately. Categories with no budget may be shown as unbudgeted; do not silently omit spending. Historical categories stay visible when inactive.

## Commands and parsing
Normalize Unicode whitespace, Thai/English aliases, case-fold slugs, strip commas in amounts, reject NaN/negative/zero/overprecision. Exact grammar first, never guess a category.
- `เพิ่มแผน car 10000`: create/update monthly budget (confirm overwrite if exists).
- `จ่าย car 500`: expense.
- `คืนเงิน car 100`: refund.
- `คงเหลือเดือนนี้`: list all category remainders + total.
- `คงเหลือ car`: specific category.
- `ดูวันนี้`: transactions in user's local day.
- `สรุปเดือนนี้`: monthly aggregate.
- `copy แผนเดือนก่อน`: copy prior month budgets into missing current month entries, preview and confirm if existing entries conflict.
- `ยกเลิกรายการล่าสุด`: void latest non-voided transaction, ask confirmation.
- `ช่วยเหลือ`: command help.
For ambiguous or unknown commands return a safe help response and do not mutate data. Date filters and custom notes can follow after MVP.

## Screens and routes
- `/login`: Supabase sign-in/up and reset password.
- `/chat`: default, bubble messages, sticky composer, send state, quick chips, structured balance reply cards.
- `/dashboard`: monthly navigation, budget/spent/remain KPI, category bars, trend chart.
- `/budgets`: list/edit/add categories and monthly plans, copy last month.
- `/history`: transaction table/cards, filters, edit/void, export CSV.
- `/settings`: profile, categories, install help, timezone, sign out.
Mobile bottom navigation: Chat, Dashboard, Budgets, History, Settings. Desktop sidebar.

## PWA
- `app/manifest.ts`: name, short_name, start_url=/chat, display=standalone, icons 192x192 and 512x512, maskable icon, theme/background colors.
- Use HTTPS on Vercel, service worker with conservative caching of static assets only. Do not cache authenticated API responses, sensitive chat data or financial records in shared caches. Offline write support is not part of MVP; show clear offline state.
- Test Android Chrome install and iOS Safari Add to Home Screen.

## Suggested structure
```
src/
  app/(auth)/login/page.tsx
  app/(app)/chat/page.tsx
  app/(app)/dashboard/page.tsx
  app/(app)/budgets/page.tsx
  app/(app)/history/page.tsx
  app/(app)/settings/page.tsx
  app/api/chat/execute/route.ts
  app/manifest.ts
  components/chat/ components/dashboard/ components/layout/
  lib/commands/parser.ts
  lib/commands/executor.ts
  lib/supabase/client.ts
  lib/supabase/server.ts
  lib/validation/
  types/
supabase/migrations/
public/icons/
tests/
```

## Delivery phases for Codex
1. Scaffold Next.js TS strict, Tailwind, responsive shell, lint/format/test, env example, README.
2. Supabase migrations, RLS policies, auth, server session validation, tests for cross-user isolation.
3. Command parser with comprehensive unit tests, Thai input handling, amount parsing.
4. Atomic idempotent command execution, chat persistence, validation, error handling.
5. Budgets and transaction CRUD, monthly reporting and timezone-safe queries.
6. Chat UI and quick commands, optimistic pending state without duplicate writes.
7. Dashboard charts, history, export CSV, copy budget, confirm undo.
8. PWA manifest, icons, static-only service worker, offline indicators.
9. Security review, accessibility, mobile E2E, production build, Vercel deployment instructions.

## Acceptance criteria
- Login user A cannot read/write user B's records (direct DB and API tests).
- Duplicate idempotency key does not duplicate a transaction.
- Expense 500 from budget 10000 shows 9500 remaining; refund 100 shows 9600.
- Bangkok day/month boundaries work around UTC midnight.
- Void transaction restores computed balance and keeps audit trail.
- `7-11` and `rent-h` slugs parse correctly; 1,500.50 parses correctly.
- Copying a month twice never duplicates or overwrites plans without confirmation.
- Chat remains usable at 360px mobile width; PWA installable over HTTPS.
- No secrets exposed in browser, no paid dependency required, npm run build/test/lint pass.

## Codex master prompt
Implement this project phase-by-phase according to this document. First inspect the repository, summarize existing code, and create a task checklist. Use current stable compatible package versions, avoid deprecated Next.js/Supabase APIs, keep all SQL in versioned migrations, use strict TypeScript and Zod validation, enforce Supabase RLS, use server-side authenticated authorization, make financial mutations atomic and idempotent, and add tests before completing each phase. Do not add AI, paid infrastructure, or offline financial writes in MVP. At each phase provide changed files, commands to run, test results, and outstanding issues. Never fabricate successful tests or deployments.
