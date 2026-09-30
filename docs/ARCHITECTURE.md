# Architecture

No custom API server: the app talks to Supabase directly, and Row Level Security is the authorisation layer.

- **Screens** (`mobile/app`) call a `Repo` (`mobile/lib/data/types.ts`) obtained from `useRepo()`.
- **`createSupabaseRepo`** runs every query as the signed-in user, always with an explicit `user id` filter in addition to RLS.
- **`createDemoRepo`** implements the same interface over local storage. It is chosen only when `EXPO_PUBLIC_DEMO_MODE=true` (`npm run web:demo`). Missing Supabase env vars do *not* enable it; the app shows a set-up screen instead.
- **Auth** (`mobile/lib/auth.tsx`): restores the session with `getSession()`, follows `onAuthStateChange`, handles the password-recovery event. Protected routes render through `<RequireAuth>`; the root layout always renders a navigator (an Expo Router requirement).
- **Rules** (`packages/core`): `checkEligibility`, `matchScore`, `buildRecommendation`, `computeProfileCompletion`, value normalisation (gender/state/education spellings), deadline helpers, and the application-status rules that the data layer enforces client-side (the database enforces them too once migration 0003 is applied).
- **Assistant**: local keyword helper by default; optional Edge Function (docs/ASSISTANT.md).

## Security model
- Students read/write only their own `students`, `saved_scholarships`, `applications`, `notifications` rows. Published scholarships are readable; drafts/archived are admin-only.
- Students may record only `not_applied`, `started`, `submitted`. Reviewer stages are admin-only (**enforced in the database only after migration 0003 is applied**; before that, RLS alone would let a student write any status via the API).
- Only the public URL and anon key are in the app. Service-role and AI provider keys are never in client code.
