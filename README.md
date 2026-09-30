# TribalScholar

A mobile-first scholarship-support app (Expo / React Native / Expo Router, runs on web, Android and iOS) with Supabase Auth + PostgreSQL. Eligibility is decided by a deterministic, unit-tested rules engine in `packages/core`, never by an AI model.

## What works today

| Area | Status |
|---|---|
| Email/password sign-up, sign-in, sign-out, session restore on reload, resend confirmation, password reset | Implemented (Supabase) |
| Profile read/update with consent, validation, completion meter | Implemented (Supabase `students` + `profiles.full_name`) |
| Published scholarship list, search, closed-deadline filtering, detail page | Implemented (Supabase) |
| Eligibility explanations per scholarship | Implemented (`packages/core`) |
| Saved scholarships | Implemented (Supabase) |
| Application tracking (not applied / started / submitted) | Implemented; later stages are reviewer-only |
| Alerts: deadlines for saved items + stored notifications | Implemented |
| Admin tab: live counts (admins only) | Implemented (read-only) |
| Demo assistant (keyword matching, labelled "not AI") | Implemented |
| AI assistant | Code provided (Edge Function); **not deployed**, needs your secret (docs/ASSISTANT.md) |
| Admin tools to add scholarships / review applications | **Not built** (use the Supabase dashboard) |
| Document upload, push notifications, account deletion | **Not built** |
| Verified real scholarship data | **None.** All bundled records are fictional samples marked `[DEMO]` |

## Run it

```bash
npm install                      # root: core engine + test tooling
cd mobile && npm install
```

**A. Preview with no backend (sample data, stored in the browser only)**
```bash
npm run web:demo                 # opens http://localhost:8081, labelled "Demo mode"
```

**B. With your Supabase project**
1. Copy `.env.example` to `mobile/.env` and fill in the project URL and anon key (public values only).
2. Apply migrations (see docs/DATABASE.md) and optionally the seed.
3. `cd mobile && npm run web` (after editing `.env`, restart with `npx expo start -c`; Expo caches env values).

If neither is configured the app shows a set-up screen. There is no fake login.

## Tests
```bash
npm test               # core engine (21) + mobile data layer/validation/assistant (29)
npm run typecheck --prefix mobile
cd mobile && npm run smoke:web   # builds the demo web bundle and walks the main flow in jsdom
```
`npm run check:web:prod` (in `mobile/`) builds the real production bundle and asserts it contains no demo mode.
The smoke tests use jsdom, not a real browser: they check behaviour, not layout or visual polish.
Expo caches `EXPO_PUBLIC_*` values inside its bundle cache. The scripts pass `--clear`; if you build by hand after changing env values, use `npx expo export --platform web --clear`.

## Layout
- `packages/core` – eligibility, scoring, normalisation, deadlines, status rules
- `mobile/lib/data` – `Repo` interface with a Supabase implementation and a local demo implementation
- `mobile/app` – Expo Router screens; `mobile/components` – shared UI
- `supabase/migrations` – 0001 schema, 0002 signup trigger, **0003 draft (review before applying)**
- `supabase/functions/assistant` – optional server-side assistant
- `docs/` – architecture, database/RLS, deployment, assistant, demo guide

See docs/DEPLOYMENT.md for hosting the web build and the Supabase dashboard steps.
