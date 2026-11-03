# Changes in this version (review fixes)

- Added .gitignore, LICENSE (MIT), src/vite-env.d.ts, @types/node (build fixes).
- Workflow now passes VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (set as GitHub Actions *Variables*).
- SQL: user_id defaults to auth.uid(), re-runnable policies, draft-review UPDATE (review_status only), locked note insert status.
- Rewind: cannot be closed, once per day, pauses when app is hidden, weak topics first, Maths question set.
- Real streak / accuracy / mastery from actual answers; fake numbers and fake paper progress removed.
- Auth state tracked; profile + sessions sync after sign-in; settings survive reload.
- Upload validation (type/size), orphan cleanup, queue cleared after upload.
- Service worker: network-first pages, versioned cache. PNG icons added. Google Fonts import removed.

NOT verified: npm install / build could not be run in the authoring environment (no network). Run `npm install && npm run build` first.
