-- gen_random_uuid() is built into supported PostgreSQL versions.

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

-- Explicit privileges: unauthenticated requests cannot access application data.
grant usage on schema public to authenticated;
revoke all on public.profiles, public.categories, public.monthly_budgets,
  public.transactions, public.chat_messages, public.command_executions,
  public.user_settings from public, anon;
grant select, insert, update, delete on public.profiles, public.categories,
  public.monthly_budgets, public.transactions, public.chat_messages,
  public.command_executions, public.user_settings to authenticated;

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger monthly_budgets_updated_at before update on public.monthly_budgets
for each row execute function public.touch_updated_at();
create trigger transactions_updated_at before update on public.transactions
for each row execute function public.touch_updated_at();

-- Only this narrow trigger bypasses RLS to bootstrap new Auth users.
-- Never trust raw user metadata for authorization or roles.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  insert into public.user_settings (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill users who existed before this migration.
insert into public.profiles (user_id) select id from auth.users on conflict do nothing;
insert into public.user_settings (user_id) select id from auth.users on conflict do nothing;
