# Phase 1 checklist

Source of truth: `expense_chat_codex_plan.md`, delivery phase 1. The starting repository contained only that plan and a title-only README; there was no application code or repository-specific AGENTS.md.

## Implementation

- [x] Inspect repository and read the complete plan.
- [x] Scaffold Next.js App Router with strict TypeScript and Tailwind.
- [x] Add responsive shared shell: desktop sidebar and mobile bottom navigation.
- [x] Add all six route foundations and root redirect to `/chat`.
- [x] Use Thai UI, semantic structure, active states, skip link, and focus styling.
- [x] Mark features awaiting later phases clearly; do not collect credentials or write financial data.
- [x] Configure ESLint, Prettier, Vitest, and React Testing Library.
- [x] Provide safe environment example, ignore real secrets and generated files.
- [x] Document setup, commands, architecture, coding conventions, and remaining scope.
- [x] Commit dependency lockfile for reproducible installation.

## Verification

- [x] `npm run lint`
- [x] `npm run format:check`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run build`
- [x] Production HTTP smoke check for every route and root redirect.
- [ ] Browser check at 360px and desktop: navigation, overflow, console, and layout. Blocked: the connected browser is unavailable, and the Chromium download returned an invalid archive. Responsive CSS is implemented; visual verification is still required.

## Deferred acceptance criteria

These are outside Phase 1 and must not be represented as verified here:

- Phase 2: authentication, RLS, cross-user isolation.
- Phase 3: exact Thai command grammar and financial amount validation.
- Phase 4: atomic execution, persistence, idempotency.
- Phases 5–7: balances, Bangkok boundaries, budgets, copy, refunds, voids, dashboard, export.
- Phase 8: manifest, icons, static-only service worker, offline state, Android/iOS install.
- Phase 9: full security, accessibility and authenticated end-to-end review, deployment instructions.

## Recorded verification results

- `npm run lint`: passed, zero warnings/errors.
- `npm run format:check`: passed.
- `npm run typecheck`: passed with strict mode enabled.
- `npm test`: 2 files, 13 tests passed.
- `npm run build`: production compilation, TypeScript validation, and all 9 generated pages passed.
- Production server: `/` returned 307 to `/chat`; all six planned screen routes returned 200 with Thai document language and a page heading; an unknown route returned 404.
- React review: pages and shell remain Server Components; active navigation is the only client component; no effects, shared request state, API calls, or credential access are introduced.

Tooling compatibility: TypeScript 7 and ESLint 10 were not compatible with the current Next.js lint dependency tree. This scaffold uses TypeScript 6.0.x and ESLint 9.39.x, with the exact dependency graph committed in `package-lock.json`. Upgrade the lint plugins together before moving to later major versions.
