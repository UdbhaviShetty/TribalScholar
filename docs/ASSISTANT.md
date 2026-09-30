# Assistant

## Default: demo assistant
Keyword matching over the scholarship records already loaded in the app. It is **not** an AI model and says so on screen. Eligibility answers come from the rules engine.

## Optional: real AI via a server-side function
`supabase/functions/assistant/index.ts` calls the Anthropic Messages API from a Supabase Edge Function. It has **not been deployed or run** by the author; treat it as a starting point and test it.

Privately configure it (never paste keys into chat, source control, or any `EXPO_PUBLIC_*` variable):
1. Install the Supabase CLI and `supabase login`, `supabase link --project-ref <ref>`.
2. In your own terminal: `supabase secrets set ANTHROPIC_API_KEY=<your key>` (or Dashboard > Edge Functions > Secrets). Optional: `ASSISTANT_MODEL`.
3. `supabase functions deploy assistant` (leave JWT verification on).
4. In `mobile/.env` set `EXPO_PUBLIC_ASSISTANT_MODE=server`, restart with `npx expo start -c`.

Behaviour and limits:
- Only signed-in users can call it; queries run as that user, so RLS applies.
- The model receives published scholarship records and, only if the student has given consent, eligibility-relevant fields (education level, state, percentage, income, ST status, gender, disability, first-gen). Name, date of birth, district, institution and tribe name are never sent.
- The system prompt forbids inventing facts and defers eligibility to the rules engine. Model output can still be wrong; the UI says so.
- **No rate limiting or usage quota is implemented.** Add one (for example a per-user counter table) before opening the app to many users, or provider costs are uncapped.
