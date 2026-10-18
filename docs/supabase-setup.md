# Supabase setup — Phase 2

Use a development Supabase project first. This change does not provision a cloud project or apply migrations to an existing database.

## 1. Apply the schema

In Supabase SQL Editor, run the complete versioned file:

`supabase/migrations/202610180001_initial_schema.sql`

Alternatively, with the Supabase CLI installed and authenticated locally:

```sh
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Let the CLI prompt for credentials locally. Do not put passwords or access tokens on the command line or in Git. Apply migrations once through the tracked migration workflow; the initial migration intentionally does not silently overwrite existing tables. If tables were created manually before this phase, reconcile that schema before applying it.

The migration creates all seven tables, owner RLS and privileges, composite ownership constraints, `updated_at` triggers, and a narrow Auth user trigger that initializes `profiles` and `user_settings`. Existing Auth users are backfilled. `gen_random_uuid()` is native on supported PostgreSQL versions, so a separate `pgcrypto` extension is not needed.

## 2. Configure Auth

In Supabase Authentication settings:

1. Enable the Email provider with email/password sign-in.
2. Keep email confirmations enabled; use a password minimum of at least 8 characters.
3. Set **Site URL** to the canonical app origin (local development: `http://localhost:3000`; production: your HTTPS Vercel/custom domain).
4. Add exact development/production callback URLs to the redirect allowlist, including `/auth/callback` and `/auth/callback?flow=recovery`.
5. Keep Supabase's built-in authentication rate limits enabled. Provider email restrictions/rate limits still apply; tests do not send email.

### Recommended SSR email templates

Configure **Confirm signup** to link to your app's server token verification route:

```html
<a
  href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=signup"
  >ยืนยันอีเมล</a
>
```

Configure **Reset password**:

```html
<a
  href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery"
  >ตั้งรหัสผ่านใหม่</a
>
```

These templates use the configured Supabase Site URL, not an arbitrary return URL. Set that URL for the environment you are testing. The app verifies only `signup` and `recovery`, then redirects to fixed local destinations. Invalid/expired links return to login with a Thai error; token-bearing responses are no-store with a no-referrer policy.

If using Supabase's default email templates instead, `/auth/callback` exchanges the PKCE code. Open that link in the same browser that initiated signup/reset so its verifier cookie is present. For recovery the action supplies `flow=recovery`, routing the verified session to `/reset-password`. The token-hash templates above also support opening the email in a different browser.

## 3. Set environment variables

Copy `.env.example` to `.env.local`. Enter values directly in your local environment/Vercel project settings:

| Variable                               | Value                                                        |
| -------------------------------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Project URL from Supabase                                    |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_...`), or legacy `anon` key |
| `SITE_URL`                             | Canonical app origin; HTTPS in production                    |

Never use `sb_secret_...` or a legacy `service_role` key. The application rejects those as public configuration. A public key is expected to be visible in client code; RLS enforces access control. The app does not require an admin key or database password at runtime.

Restart development after changing values. Set them in each intended Vercel environment and rebuild/redeploy, because `NEXT_PUBLIC_*` values may be embedded at build time. Configure the correct Site URL before sending confirmation/recovery emails. An unconfigured app fails closed: private pages redirect to login and `/api/account` returns 503 without financial data.

## 4. Verify the hosted integration before using real data

Use two disposable accounts, A and B, and a development project:

- [ ] Signup sends confirmation email; opening the link creates a usable session. Profile/settings appear once for each user.
- [ ] Unauthenticated users cannot open any of the five workspace routes or `/reset-password`; `/api/account` returns 401 when configured.
- [ ] A's `/api/account` returns only A's profile. Changing URL parameters cannot select B.
- [ ] A's profile PATCH with `user_id: B` returns 400; a normal same-origin PATCH changes only A.
- [ ] Using A's public-key/JWT Supabase client, selecting B's rows returns none; attempts to insert/update with B's `user_id` are denied on all seven tables.
- [ ] An anonymous client cannot access any application table.
- [ ] Expired access tokens refresh while cookies and no-store headers are preserved; invalid/revoked credentials fail closed.
- [ ] Password-reset email leads to the new-password screen, both values must match, and the new password works after sign-out.
- [ ] Invalid/expired confirmation links show a recoverable error.
- [ ] Sign-out prevents further access to private pages. Verify both mobile navigation and desktop navigation at 360px and desktop width.

Automated tests cover SQL and handler behavior without a hosted Auth service. This manual checklist remains pending until a development project and real browser/email access are available.

## Updating database types

The checked-in `src/types/database.ts` matches the initial migration. After future schema changes, generate the contract from your development database and review the diff:

```sh
supabase gen types typescript --linked > src/types/database.ts
npm run typecheck
```
