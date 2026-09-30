# Deployment

## Web
`cd mobile && npm run export:web` produces a static site in `mobile/dist` (single-page output). Host it on any static host with a fallback to `index.html` for unknown paths.
Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in the build environment (they are public by design; security comes from RLS). Do **not** set `EXPO_PUBLIC_DEMO_MODE` for a real deployment.

## Supabase dashboard steps (manual)
1. Authentication > URL Configuration: set **Site URL** to your web address and add it (and `http://localhost:8081` for development) to **Redirect URLs**. Without this, confirmation and password-reset links will not return to the app.
2. Authentication > Providers > Email: decide whether "Confirm email" stays on. The app handles both cases.
3. Apply migrations 0001, 0002, then reviewed 0003, in that order. Optionally run the seed for demo data.
4. Optional: deploy the assistant function (docs/ASSISTANT.md).

## Android
`app.json` already has the package name `com.tribalscholar.app`. Use EAS Build for release builds. Android and iOS builds have not been run by the author.

## Security checklist
- RLS enabled on every table (it is, in 0001). Apply 0003.
- No service-role or AI provider keys in the app or in any `EXPO_PUBLIC_*` variable.
- Remove `[DEMO]` scholarships before launch.
